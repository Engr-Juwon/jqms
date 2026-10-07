import type { Handler, HandlerEvent } from "@netlify/functions";
import nodemailer from "nodemailer";

interface EmailRequestBody {
  smtp: {
    host: string;
    port: number;
    secure?: boolean;
    requireTls?: boolean;
    user: string;
    pass: string;
    fromName?: string;
    fromEmail?: string;
  };
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

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const handler: Handler = async (event: HandlerEvent) => {
  // Handle CORS Preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method Not Allowed. Use POST." }),
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Missing request payload." }),
      };
    }

    const payload: EmailRequestBody = JSON.parse(event.body);
    const { smtp, to, cc, bcc, replyTo, subject, text, html, attachments, isTestConnection } = payload;

    // Validate SMTP parameters
    if (!smtp || !smtp.host || !smtp.user || !smtp.pass) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: "Incomplete SMTP configuration. Host, username, and password are required.",
        }),
      };
    }

    const port = Number(smtp.port) || 587;
    const isSecure = smtp.secure !== undefined ? smtp.secure : port === 465;

    // Create Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      host: smtp.host.trim(),
      port: port,
      secure: isSecure, // true for 465, false for 587/25
      auth: {
        user: smtp.user.trim(),
        pass: smtp.pass.trim(),
      },
      tls: {
        rejectUnauthorized: false, // Prevents self-signed cert blocks on custom corporate relays
        ciphers: "SSLv3",
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
    });

    // Test Connection Mode
    if (isTestConnection) {
      try {
        await transporter.verify();

        // If a recipient is provided in test mode, dispatch a friendly verification email
        if (to) {
          const senderAddress = smtp.fromEmail || smtp.user;
          const senderDisplayName = smtp.fromName || "Jay-QMS System";
          
          await transporter.sendMail({
            from: `"${senderDisplayName}" <${senderAddress}>`,
            to: Array.isArray(to) ? to.join(", ") : to,
            subject: "Jay-QMS SMTP Verification Test",
            text: `Hello,\n\nThis is a test email confirming that your SMTP email settings in Jay-QMS are configured properly and active.\n\nSent from: ${senderAddress}\nHost: ${smtp.host}:${port}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); padding: 16px 20px; border-radius: 8px; color: #ffffff; margin-bottom: 20px;">
                  <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">Jay-QMS Email Delivery Test</h2>
                  <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Quality Assurance & Control Management System</p>
                </div>
                <div style="padding: 0 4px; color: #1e293b; font-size: 14px; line-height: 1.6;">
                  <p><strong>Congratulations!</strong> Your personal SMTP authentication and company mail server connection are working seamlessly.</p>
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 13px;">
                    <p style="margin: 0 0 6px 0;"><strong>Sender Account:</strong> ${senderAddress}</p>
                    <p style="margin: 0 0 6px 0;"><strong>Display Name:</strong> ${senderDisplayName}</p>
                    <p style="margin: 0;"><strong>SMTP Server:</strong> ${smtp.host}:${port} (${isSecure ? "SSL" : "TLS/STARTTLS"})</p>
                  </div>
                  <p style="color: #64748b; font-size: 12px; margin-top: 24px;">This automated verification email was dispatched from Jay-QMS.</p>
                </div>
              </div>
            `,
          });
        }

        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: true,
            message: "SMTP server verified and test email dispatched successfully!",
          }),
        };
      } catch (verifyError: any) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            success: false,
            error: verifyError.message || "Failed to authenticate with SMTP server.",
            code: verifyError.code || "SMTP_VERIFY_FAILED",
          }),
        };
      }
    }

    // Standard Email Send Mode
    if (!to || (Array.isArray(to) && to.length === 0)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Recipient ('to') address is required." }),
      };
    }

    const senderAddress = smtp.fromEmail || smtp.user;
    const senderDisplayName = smtp.fromName || "Jay-QMS";

    const formattedAttachments = attachments?.map((att) => ({
      filename: att.filename,
      content: att.encoding === "base64" ? Buffer.from(att.content, "base64") : att.content,
      contentType: att.contentType,
    }));

    const mailOptions = {
      from: `"${senderDisplayName}" <${senderAddress}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      cc: cc ? (Array.isArray(cc) ? cc.join(", ") : cc) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc.join(", ") : bcc) : undefined,
      replyTo: replyTo || senderAddress,
      subject: subject || "Notification from Jay-QMS",
      text: text,
      html: html,
      attachments: formattedAttachments,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        response: info.response,
      }),
    };
  } catch (error: any) {
    console.error("Netlify send-email function error:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred while sending email.",
        code: error.code || "INTERNAL_ERROR",
      }),
    };
  }
};
