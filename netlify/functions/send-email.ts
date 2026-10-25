import type { Handler, HandlerEvent } from "@netlify/functions";
import nodemailer from "nodemailer";
import {
  assertBodySize,
  buildCorsHeaders,
  checkRateLimit,
  decryptSecret,
  encryptSecret,
  HttpSecurityError,
  isEncryptedSecret,
  isOriginAllowed,
  jsonResponse,
  validateSafeSmtpEndpoint,
  verifyFirebaseRequest,
} from "./_security";

interface EmailRequestBody {
  action?: "send" | "test" | "encrypt_smtp";
  password?: string;
  smtp?: {
    host?: string;
    port?: number;
    secure?: boolean;
    requireTls?: boolean;
    user?: string;
    pass?: string;
    encryptedPass?: string;
    fromName?: string;
    fromEmail?: string;
  };
  usePlatformSmtp?: boolean;
  to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  subject?: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding?: string;
    contentType?: string;
  }>;
  isTestConnection?: boolean;
}

const MAX_EMAIL_BODY_BYTES = 12 * 1024 * 1024; // 12 MB max (including base64 PDF report attachments)

function stripCrLf(val?: string): string {
  return (val || "").replace(/[\r\n]+/g, " ").trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Server-side defense-in-depth HTML sanitization for outbound email bodies.
 * Strips executable script/iframe/object tags, inline event handlers, and javascript: URIs.
 */
function sanitizeEmailHtml(rawHtml?: string): string | undefined {
  if (!rawHtml) return undefined;
  return rawHtml
    .replace(/<\s*(script|iframe|object|embed|form|meta|base)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|iframe|object|embed|meta|base)\b[^>]*\/?\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1=$2#$2');
}

function resolvePlatformEnvSmtp() {
  const host = (process.env.SMTP_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === "true"
      : port === 465;
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").trim();
  const fromName = (process.env.SMTP_FROM_NAME || "Jay-QMS Notifications").trim();
  const fromEmail = (process.env.SMTP_FROM_EMAIL || user).trim();

  if (!host || !user || !pass) {
    return null;
  }
  return { host, port, secure, user, pass, fromName, fromEmail };
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === "OPTIONS") {
    if (!isOriginAllowed(event)) {
      return jsonResponse(event, 403, { error: "Origin not permitted." });
    }
    return {
      statusCode: 200,
      headers: buildCorsHeaders(event),
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(event, 405, {
      error: "Method Not Allowed. Use POST.",
    });
  }

  try {
    assertBodySize(event, MAX_EMAIL_BODY_BYTES);
    const verifiedUser = await verifyFirebaseRequest(event);
    checkRateLimit("send-email", verifiedUser.uid, 20, 60_000);

    if (!event.body) {
      return jsonResponse(event, 400, { error: "Missing request payload." });
    }

    const payload: EmailRequestBody = JSON.parse(event.body);

    // 1. Dedicated AES-256-GCM Password Encryption Action (bound to verified Firebase UID)
    if (payload.action === "encrypt_smtp") {
      const rawPassword = (payload.password || "").trim();
      if (!rawPassword) {
        return jsonResponse(event, 400, {
          success: false,
          error: "Password is required for encryption.",
        });
      }
      const encryptedPassword = encryptSecret(rawPassword, verifiedUser.uid);
      return jsonResponse(event, 200, {
        success: true,
        encryptedPassword,
      });
    }

    const {
      smtp,
      usePlatformSmtp,
      to,
      cc,
      bcc,
      replyTo,
      subject,
      text,
      html,
      attachments,
      isTestConnection,
    } = payload;

    // 2. Resolve SMTP Transport Credentials (Custom Encrypted Tenant/User SMTP OR Server Env SMTP)
    const platformSmtp = resolvePlatformEnvSmtp();
    const hasCustomSmtp = Boolean(
      !usePlatformSmtp &&
        smtp?.host &&
        smtp?.user &&
        (smtp?.encryptedPass || smtp?.pass),
    );

    let resolvedHost = "";
    let resolvedPort = 587;
    let resolvedSecure = false;
    let resolvedUser = "";
    let resolvedPass = "";
    let senderDisplayName = "Jay-QMS";
    let senderAddress = "";

    if (hasCustomSmtp && smtp) {
      const safeEndpoint = await validateSafeSmtpEndpoint(
        smtp.host!,
        Number(smtp.port) || 587,
      );
      resolvedHost = safeEndpoint.host;
      resolvedPort = safeEndpoint.port;
      resolvedSecure =
        smtp.secure !== undefined ? Boolean(smtp.secure) : resolvedPort === 465;
      resolvedUser = stripCrLf(smtp.user);

      const candidateSecret = (smtp.encryptedPass || smtp.pass || "").trim();
      if (isEncryptedSecret(candidateSecret)) {
        resolvedPass = decryptSecret(candidateSecret, verifiedUser.uid);
      } else if (isTestConnection) {
        // Allow testing an unsaved password directly from Profile Settings before saving
        resolvedPass = candidateSecret;
      } else {
        throw new HttpSecurityError(
          400,
          "Plaintext SMTP passwords are not permitted for email dispatch. Please re-save your SMTP password in Profile Settings to encrypt it.",
        );
      }

      senderAddress = stripCrLf(smtp.fromEmail || resolvedUser);
      senderDisplayName = stripCrLf(smtp.fromName || "Jay-QMS").replace(/"/g, "");
    } else if (platformSmtp) {
      const safeEndpoint = await validateSafeSmtpEndpoint(
        platformSmtp.host,
        platformSmtp.port,
      );
      resolvedHost = safeEndpoint.host;
      resolvedPort = safeEndpoint.port;
      resolvedSecure = platformSmtp.secure;
      resolvedUser = platformSmtp.user;
      resolvedPass = platformSmtp.pass;
      senderAddress = stripCrLf(smtp?.fromEmail || platformSmtp.fromEmail);
      senderDisplayName = stripCrLf(
        smtp?.fromName || platformSmtp.fromName,
      ).replace(/"/g, "");
    } else {
      return jsonResponse(event, 400, {
        success: false,
        error:
          "No SMTP relay is configured. Either configure server environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS) in Netlify or save custom encrypted SMTP settings in Company & Profile Settings.",
        code: "SMTP_NOT_CONFIGURED",
      });
    }

    // Modern TLS 1.2/1.3 Transporter (no deprecated SSLv3 or disabled certificate verification)
    const transporter = nodemailer.createTransport({
      host: resolvedHost,
      port: resolvedPort,
      secure: resolvedSecure,
      auth: {
        user: resolvedUser,
        pass: resolvedPass,
      },
      tls: {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
    });

    // 3. Test Connection Mode
    if (isTestConnection) {
      try {
        await transporter.verify();

        if (to) {
          const safeSender = escapeHtml(senderAddress);
          const safeDisplay = escapeHtml(senderDisplayName);
          const safeHost = escapeHtml(`${resolvedHost}:${resolvedPort}`);

          await transporter.sendMail({
            from: `"${senderDisplayName}" <${senderAddress}>`,
            to: Array.isArray(to) ? to.map(stripCrLf).join(", ") : stripCrLf(to),
            subject: "Jay-QMS SMTP Verification Test",
            text: `Hello,\n\nThis is a test email confirming that your SMTP email settings in Jay-QMS are configured properly and active.\n\nSent from: ${senderAddress}\nHost: ${resolvedHost}:${resolvedPort}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); padding: 16px 20px; border-radius: 8px; color: #ffffff; margin-bottom: 20px;">
                  <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">Jay-QMS Email Delivery Test</h2>
                  <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Quality Assurance &amp; Control Management System</p>
                </div>
                <div style="padding: 0 4px; color: #1e293b; font-size: 14px; line-height: 1.6;">
                  <p><strong>Congratulations!</strong> Your encrypted SMTP authentication and mail server connection are working seamlessly.</p>
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 13px;">
                    <p style="margin: 0 0 6px 0;"><strong>Sender Account:</strong> ${safeSender}</p>
                    <p style="margin: 0 0 6px 0;"><strong>Display Name:</strong> ${safeDisplay}</p>
                    <p style="margin: 0;"><strong>SMTP Server:</strong> ${safeHost} (${resolvedSecure ? "TLS/465" : "STARTTLS"})</p>
                  </div>
                  <p style="color: #64748b; font-size: 12px; margin-top: 24px;">This automated verification email was dispatched from Jay-QMS.</p>
                </div>
              </div>
            `,
          });
        }

        const encryptedToken =
          hasCustomSmtp && resolvedPass
            ? encryptSecret(resolvedPass, verifiedUser.uid)
            : undefined;

        return jsonResponse(event, 200, {
          success: true,
          message: "SMTP server verified and test email dispatched successfully!",
          encryptedPassword: encryptedToken,
        });
      } catch (verifyError: any) {
        return jsonResponse(event, 400, {
          success: false,
          error:
            verifyError.message || "Failed to authenticate with SMTP server.",
          code: verifyError.code || "SMTP_VERIFY_FAILED",
        });
      }
    }

    // 4. Standard Email Send Mode
    const recipientsList = Array.isArray(to)
      ? to.map(stripCrLf).filter(Boolean)
      : [stripCrLf(to)].filter(Boolean);

    if (recipientsList.length === 0 || recipientsList.length > 50) {
      return jsonResponse(event, 400, {
        success: false,
        error:
          recipientsList.length === 0
            ? "Recipient ('to') address is required."
            : "Maximum of 50 recipients per email dispatch.",
      });
    }

    const formattedAttachments = attachments?.slice(0, 10).map((att) => ({
      filename: stripCrLf(att.filename).replace(/[/\\]/g, "_") || "attachment",
      content:
        att.encoding === "base64"
          ? Buffer.from(att.content, "base64")
          : att.content,
      contentType: stripCrLf(att.contentType) || undefined,
    }));

    const mailOptions = {
      from: `"${senderDisplayName}" <${senderAddress}>`,
      to: recipientsList.join(", "),
      cc: cc
        ? (Array.isArray(cc) ? cc.map(stripCrLf) : [stripCrLf(cc)])
            .filter(Boolean)
            .join(", ")
        : undefined,
      bcc: bcc
        ? (Array.isArray(bcc) ? bcc.map(stripCrLf) : [stripCrLf(bcc)])
            .filter(Boolean)
            .join(", ")
        : undefined,
      replyTo: stripCrLf(replyTo || verifiedUser.email || senderAddress),
      subject: stripCrLf(subject) || "Notification from Jay-QMS",
      text: text,
      html: sanitizeEmailHtml(html),
      attachments: formattedAttachments,
    };

    const info = await transporter.sendMail(mailOptions);

    return jsonResponse(event, 200, {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
  } catch (error: any) {
    if (error instanceof HttpSecurityError) {
      return jsonResponse(event, error.statusCode, {
        success: false,
        error: error.message,
      });
    }
    console.error("Netlify send-email function error:", error);
    return jsonResponse(event, 500, {
      success: false,
      error:
        error.message || "An unexpected error occurred while sending email.",
      code: error.code || "INTERNAL_ERROR",
    });
  }
};
