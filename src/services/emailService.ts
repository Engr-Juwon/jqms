import { Company, UserProfile, EmailCommunicationLog } from "@/types";
import { auth, firestore } from "@/firebase";
import { cleanForFirestore } from "@/lib/db";
import { collection, doc, setDoc, getDocs, query, where } from "firebase/firestore";

export interface SendEmailOptions {
  company: Company | null;
  currentUser: UserProfile | null;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string; // Base64 encoded or string
    encoding?: string;
    contentType?: string;
  }>;
  module?:
    | "WEEKLY_REPORT"
    | "NCR"
    | "SITE_INSTRUCTION"
    | "CUBE_TEST"
    | "INSPECTION"
    | "GENERAL"
    | string;
  referenceId?: string;
  referenceTitle?: string;
  projectId?: string;
}

export interface TestSMTPOptions {
  host: string;
  port: number;
  secure?: boolean;
  username: string;
  password?: string;
  encryptedPassword?: string;
  senderDisplayName?: string;
  senderEmail?: string;
  testRecipientEmail?: string;
}

function escapeHtml(raw: string): string {
  return String(raw || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeSafeLogoUrl(url?: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) {
    return escapeHtml(trimmed);
  }
  return "";
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Authentication required to access email services.");
  }
  const idToken = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`,
  };
}

async function postEmailEndpoint(payload: Record<string, unknown>): Promise<{
  ok: boolean;
  status: number;
  data: any;
}> {
  const headers = await getAuthHeaders();
  const endpoints = ["/api/send-email", "/.netlify/functions/send-email"];
  let lastError = "Unable to reach email serverless endpoint.";

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        continue;
      }
      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }

  throw new Error(lastError);
}

export class EmailService {
  /**
   * Generates default structured plain text signature for a user
   */
  public static buildDefaultSignatureText(options: {
    fullName?: string;
    title?: string;
    email?: string;
    phone?: string;
  }): string {
    const {
      fullName = "",
      title = "QA/QC Engineer",
      email = "",
      phone = "",
    } = options;

    const parts = [
      fullName,
      title,
      email ? `Email: ${email}` : "",
      phone ? `Tel: ${phone}` : "",
    ].filter(Boolean);

    return `--\n${parts.join("\n")}`;
  }

  /**
   * Formats a corporate signature into XSS-safe HTML with the company logo embedded.
   */
  public static formatSignatureHtml(options: {
    signatureText?: string;
    fullName?: string;
    title?: string;
    companyName?: string;
    companyLogoUrl?: string;
    email?: string;
    phone?: string;
    includeLogo?: boolean;
  }): string {
    const {
      signatureText = "",
      fullName = "",
      title = "",
      companyName = "Organization",
      companyLogoUrl,
      email = "",
      phone = "",
      includeLogo = true,
    } = options;

    const safeLogoSrc = sanitizeSafeLogoUrl(companyLogoUrl);
    const safeCompanyAlt = escapeHtml(companyName);
    const logoHtml =
      includeLogo && safeLogoSrc
        ? `<div style="margin: 12px 0 8px 0;"><img src="${safeLogoSrc}" alt="${safeCompanyAlt}" style="max-height: 48px; max-width: 180px; object-fit: contain; display: block;" /></div>`
        : "";

    if (signatureText && signatureText.trim()) {
      const raw = signatureText.trim();

      if (raw.includes("{{logo}}") || raw.includes("[LOGO]")) {
        const escaped = escapeHtml(raw)
          .replace(/\{\{logo\}\}|\[LOGO\]/g, logoHtml)
          .replace(/\n/g, "<br/>");
        return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #0f172a; line-height: 1.5; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 16px;">${escaped}</div>`;
      }

      const rawLines = raw
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const lines = rawLines[0] === "--" ? rawLines.slice(1) : rawLines;

      let logoInserted = false;
      const resultElements: string[] = [];

      lines.forEach((line, idx) => {
        const isEmailLine = /^email:\s*/i.test(line);
        const isTelLine = /^(tel|phone|mobile):\s*/i.test(line);
        const isContactLine =
          isEmailLine || isTelLine || /^(addr|web|website):/i.test(line);

        if (isContactLine && !logoInserted && logoHtml) {
          resultElements.push(logoHtml);
          logoInserted = true;
        }

        if (idx === 0) {
          resultElements.push(
            `<div style="font-weight: 800; font-size: 14px; color: #0f172a;">${escapeHtml(line)}</div>`,
          );
        } else if (idx === 1 && !isContactLine) {
          resultElements.push(
            `<div style="font-weight: 600; font-size: 13px; color: #475569; margin-top: 2px;">${escapeHtml(line)}</div>`,
          );
        } else if (isEmailLine) {
          const mailVal = escapeHtml(line.replace(/^email:\s*/i, "").trim());
          resultElements.push(
            `<div style="font-size: 12px; color: #334155; margin-top: 4px;"><strong>Email:</strong> <a href="mailto:${mailVal}" style="color: #2563eb; text-decoration: underline;">${mailVal}</a></div>`,
          );
        } else if (isTelLine) {
          const telVal = escapeHtml(
            line.replace(/^(tel|phone|mobile):\s*/i, "").trim(),
          );
          resultElements.push(
            `<div style="font-size: 12px; color: #334155; margin-top: 2px;"><strong>Tel:</strong> <a href="tel:${telVal}" style="color: #334155; text-decoration: none;">${telVal}</a></div>`,
          );
        } else {
          resultElements.push(
            `<div style="font-size: 12px; color: #475569; margin-top: 2px;">${escapeHtml(line)}</div>`,
          );
        }
      });

      if (!logoInserted && logoHtml) {
        resultElements.push(logoHtml);
      }

      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          ${resultElements.join("")}
        </div>
      `;
    }

    const safeFullName = escapeHtml(fullName || "QA/QC Engineer");
    const safeTitle = escapeHtml(title);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        <div style="font-weight: 800; font-size: 14px; color: #0f172a;">${safeFullName}</div>
        ${safeTitle ? `<div style="font-weight: 600; font-size: 13px; color: #475569; margin-top: 2px;">${safeTitle}</div>` : ""}
        ${logoHtml}
        ${safeEmail ? `<div style="font-size: 12px; color: #334155; margin-top: 4px;"><strong>Email:</strong> <a href="mailto:${safeEmail}" style="color: #2563eb; text-decoration: underline;">${safeEmail}</a></div>` : ""}
        ${safePhone ? `<div style="font-size: 12px; color: #334155; margin-top: 2px;"><strong>Tel:</strong> <a href="tel:${safePhone}" style="color: #334155; text-decoration: none;">${safePhone}</a></div>` : ""}
      </div>
    `;
  }

  /**
   * Encrypts a custom SMTP password server-side using AES-256-GCM bound to the user's UID.
   * Plaintext passwords are never stored in Firestore, IndexedDB, localStorage, or audit logs.
   */
  public static async encryptSmtpPassword(rawPassword: string): Promise<string> {
    const trimmed = rawPassword.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("enc:v1:")) return trimmed;

    const { ok, data } = await postEmailEndpoint({
      action: "encrypt_smtp",
      password: trimmed,
    });
    if (!ok || !data?.encryptedPassword) {
      throw new Error(
        data?.error ||
          "Unable to encrypt SMTP password via server security service.",
      );
    }
    return String(data.encryptedPassword);
  }

  /**
   * Checks whether custom tenant/user SMTP is configured, or if platform server env SMTP will be used.
   */
  public static isSMTPConfigured(
    company: Company | null,
    currentUser: UserProfile | null,
  ): {
    configured: boolean;
    mode: "custom" | "platform";
    missing: string[];
  } {
    const missing: string[] = [];

    if (!company?.settings?.smtpServer?.host) {
      missing.push("Company SMTP Server Host");
    }
    if (!company?.settings?.smtpServer?.port) {
      missing.push("Company SMTP Server Port");
    }
    if (!currentUser?.smtpCredentials?.username) {
      missing.push("Personal Email / Username (in Profile)");
    }
    const hasSecret = Boolean(
      currentUser?.smtpCredentials?.encryptedPassword ||
        currentUser?.smtpCredentials?.hasSavedPassword,
    );
    if (!hasSecret) {
      missing.push("Encrypted App Password (in Profile)");
    }

    const hasCustom = missing.length === 0;
    return {
      // Platform Server SMTP acts as default fallback when custom SMTP is not configured
      configured: true,
      mode: hasCustom ? "custom" : "platform",
      missing,
    };
  }

  /**
   * Test SMTP Connection and optionally send a test email
   */
  public static async testSMTPConnection(options: TestSMTPOptions): Promise<{
    success: boolean;
    message: string;
    encryptedPassword?: string;
    error?: string;
    code?: string;
  }> {
    try {
      const payload = {
        isTestConnection: true,
        smtp: {
          host: options.host,
          port: options.port,
          secure: options.secure,
          user: options.username,
          pass: options.password || undefined,
          encryptedPass: options.encryptedPassword || undefined,
          fromName: options.senderDisplayName || "Jay-QMS Test",
          fromEmail: options.senderEmail || options.username,
        },
        to:
          options.testRecipientEmail ||
          options.senderEmail ||
          options.username,
      };

      const { ok, data } = await postEmailEndpoint(payload);

      if (!ok || !data.success) {
        return {
          success: false,
          message: data.error || "SMTP Authentication failed.",
          error: data.error,
          code: data.code,
        };
      }

      return {
        success: true,
        message: data.message || "SMTP connection verified successfully!",
        encryptedPassword: data.encryptedPassword,
      };
    } catch (err: any) {
      console.error("Test SMTP failed:", err);
      return {
        success: false,
        message:
          err.message ||
          "Failed to reach email dispatch service. Check network or Netlify function status.",
        error: err.toString(),
      };
    }
  }

  /**
   * Send an Email using Custom Encrypted Tenant SMTP (if configured) or Server Env SMTP by default.
   */
  public static async sendEmail(options: SendEmailOptions): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const { company, currentUser } = options;
    const smtpStatus = this.isSMTPConfigured(company, currentUser);

    const smtpServer = company?.settings?.smtpServer;
    const userCreds = currentUser?.smtpCredentials;

    const senderEmail =
      userCreds?.senderEmail ||
      userCreds?.username ||
      currentUser?.email ||
      company?.email ||
      "notifications@jayqms.app";
    const senderDisplayName =
      userCreds?.senderDisplayName ||
      currentUser?.displayName ||
      currentUser?.fullName ||
      smtpServer?.defaultSenderName ||
      company?.name ||
      "Jay-QMS";

    const useCustom =
      smtpStatus.mode === "custom" &&
      Boolean(smtpServer?.host && userCreds?.username && userCreds?.encryptedPassword);

    const payload = {
      usePlatformSmtp: !useCustom,
      smtp: useCustom
        ? {
            host: smtpServer!.host,
            port: smtpServer!.port,
            secure: smtpServer!.secure,
            user: userCreds!.username!,
            encryptedPass: userCreds!.encryptedPassword!,
            fromName: senderDisplayName,
            fromEmail: senderEmail,
          }
        : {
            fromName: senderDisplayName,
            fromEmail: senderEmail,
          },
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: currentUser?.email || senderEmail,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    };

    try {
      const { ok, data } = await postEmailEndpoint(payload);

      if (!ok || !data.success) {
        const errorMsg = data.error || "Failed to send email via SMTP.";
        await this.logEmailCommunication({
          options,
          status: "FAILED",
          errorMessage: errorMsg,
          senderEmail,
          senderName: senderDisplayName,
        });
        return {
          success: false,
          error: errorMsg,
        };
      }

      await this.logEmailCommunication({
        options,
        status: "SENT",
        senderEmail,
        senderName: senderDisplayName,
      });

      return {
        success: true,
        messageId: data.messageId,
      };
    } catch (err: any) {
      console.error("Send email error:", err);
      const errorMsg = err.message || "Network error while sending email.";
      await this.logEmailCommunication({
        options,
        status: "FAILED",
        errorMessage: errorMsg,
        senderEmail,
        senderName: senderDisplayName,
      });
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Log email communication record to Firestore using cleanForFirestore so optional undefined fields never fail.
   */
  private static async logEmailCommunication(params: {
    options: SendEmailOptions;
    status: "SENT" | "FAILED" | "DELIVERED";
    errorMessage?: string;
    senderEmail: string;
    senderName: string;
  }): Promise<void> {
    try {
      const { options, status, errorMessage, senderEmail, senderName } = params;
      const resolvedCompanyId =
        options.company?.id || options.currentUser?.companyId || "";
      if (!resolvedCompanyId) return;

      const randomPart =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID().slice(0, 8)
          : Math.random().toString(36).substring(2, 10);
      const logId = `eml-${Date.now()}-${randomPart}`;
      const logRef = doc(firestore, "emailCommunications", logId);

      const logRecord: EmailCommunicationLog = cleanForFirestore({
        id: logId,
        companyId: resolvedCompanyId,
        projectId: options.projectId || undefined,
        senderUid: options.currentUser?.uid || auth.currentUser?.uid || "system",
        senderName,
        senderEmail,
        recipients: Array.isArray(options.to) ? options.to : [options.to],
        cc: options.cc
          ? Array.isArray(options.cc)
            ? options.cc
            : [options.cc]
          : undefined,
        bcc: options.bcc
          ? Array.isArray(options.bcc)
            ? options.bcc
            : [options.bcc]
          : undefined,
        subject: options.subject,
        bodyText: options.text ? options.text.slice(0, 20_000) : undefined,
        bodyHtml: options.html ? options.html.slice(0, 40_000) : undefined,
        module: options.module || "GENERAL",
        referenceId: options.referenceId || undefined,
        referenceTitle: options.referenceTitle || undefined,
        status,
        errorMessage: errorMessage || undefined,
        hasAttachments: Boolean(
          options.attachments && options.attachments.length > 0,
        ),
        attachmentNames: options.attachments?.map((a) => a.filename),
        sentAt: new Date().toISOString(),
      });

      await setDoc(logRef, logRecord);
    } catch (logErr) {
      console.warn(
        "Could not write email communication log to Firestore:",
        logErr,
      );
    }
  }

  /**
   * Fetch recent email communications scoped strictly to a tenant companyId.
   */
  public static async getEmailLogs(
    companyId: string,
    projectId?: string,
  ): Promise<EmailCommunicationLog[]> {
    if (!companyId) return [];
    try {
      const colRef = collection(firestore, "emailCommunications");
      const q = query(colRef, where("companyId", "==", companyId));

      const snap = await getDocs(q);
      const logs: EmailCommunicationLog[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as EmailCommunicationLog;
        if (!projectId || data.projectId === projectId) {
          logs.push(data);
        }
      });

      return logs.sort(
        (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
      );
    } catch (err) {
      console.warn("Error fetching email logs:", err);
      return [];
    }
  }
}
