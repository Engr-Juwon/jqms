import { Company, UserProfile, EmailCommunicationLog } from "@/types";
import { firestore } from "@/firebase";
import { collection, doc, setDoc, getDocs, query, where, orderBy } from "firebase/firestore";

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
  module?: "WEEKLY_REPORT" | "NCR" | "SITE_INSTRUCTION" | "CUBE_TEST" | "INSPECTION" | "GENERAL" | string;
  referenceId?: string;
  referenceTitle?: string;
  projectId?: string;
}

export interface TestSMTPOptions {
  host: string;
  port: number;
  secure?: boolean;
  username: string;
  password: string;
  senderDisplayName?: string;
  senderEmail?: string;
  testRecipientEmail?: string;
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
   * Formats a corporate signature into HTML with the company logo embedded
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
      companyName = "Collection Developments",
      companyLogoUrl,
      email = "",
      phone = "",
      includeLogo = true,
    } = options;

    const logoHtml =
      includeLogo && companyLogoUrl
        ? `<div style="margin: 10px 0;"><img src="${companyLogoUrl}" alt="${companyName}" style="max-height: 48px; max-width: 180px; object-fit: contain; display: block;" /></div>`
        : "";

    if (signatureText && signatureText.trim()) {
      let raw = signatureText.trim();
      
      // If signature already has explicit logo placeholder tag
      if (raw.includes("{{logo}}") || raw.includes("[LOGO]")) {
        return raw
          .replace(/\{\{logo\}\}|\[LOGO\]/g, logoHtml)
          .replace(/\n/g, "<br/>");
      }

      // If logo is enabled and logoHtml exists, insert it between the role line and contact lines
      if (logoHtml) {
        const lines = raw.split("\n");
        const cleanLines = lines[0] === "--" ? lines.slice(1) : lines;
        
        let logoInserted = false;
        const resultLines: string[] = [];
        
        for (let i = 0; i < cleanLines.length; i++) {
          const line = cleanLines[i];
          const isContactLine = /^(email|tel|phone|mobile|addr|web):/i.test(line.trim());
          
          if (isContactLine && !logoInserted) {
            resultLines.push(logoHtml);
            logoInserted = true;
          }
          resultLines.push(line);
        }

        if (!logoInserted) {
          resultLines.push(logoHtml);
        }

        return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #1e293b; line-height: 1.5; margin-top: 16px;">${resultLines.join("<br/>")}</div>`;
      }

      return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #1e293b; line-height: 1.5; margin-top: 16px;">${raw.replace(/\n/g, "<br/>")}</div>`;
    }

    // Default Structured Signature matching user image
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #0f172a; line-height: 1.4; margin-top: 16px;">
        <div style="font-weight: 800; font-size: 14px; color: #0f172a;">${fullName}</div>
        ${title ? `<div style="font-weight: 700; font-size: 13px; color: #1e293b; margin-top: 2px;">${title}</div>` : ""}
        ${logoHtml}
        ${email ? `<div style="font-size: 12px; color: #334155; margin-top: 4px;">Email: <a href="mailto:${email}" style="color: #2563eb; text-decoration: underline;">${email}</a></div>` : ""}
        ${phone ? `<div style="font-size: 12px; color: #334155; margin-top: 2px;">Tel: ${phone}</div>` : ""}
      </div>
    `;
  }

  /**
   * Determine the API endpoint URL for sending emails via Netlify Function
   */
  private static getApiUrl(): string {
    return "/.netlify/functions/send-email";
  }

  /**
   * Check whether SMTP is properly configured across Company & User Profile
   */
  public static isSMTPConfigured(company: Company | null, currentUser: UserProfile | null): {
    configured: boolean;
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
    if (!currentUser?.smtpCredentials?.password) {
      missing.push("Personal App Password (in Profile)");
    }

    return {
      configured: missing.length === 0,
      missing,
    };
  }

  /**
   * Test SMTP Connection and optionally send a test email
   */
  public static async testSMTPConnection(options: TestSMTPOptions): Promise<{
    success: boolean;
    message: string;
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
          pass: options.password,
          fromName: options.senderDisplayName || "Jay-QMS Test",
          fromEmail: options.senderEmail || options.username,
        },
        to: options.testRecipientEmail || options.senderEmail || options.username,
      };

      const response = await fetch(this.getApiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
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
      };
    } catch (err: any) {
      console.error("Test SMTP failed:", err);
      return {
        success: false,
        message: err.message || "Failed to reach email dispatch service. Check network or Netlify function status.",
        error: err.toString(),
      };
    }
  }

  /**
   * Send an Email combining Company Server settings and User credentials
   */
  public static async sendEmail(options: SendEmailOptions): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const { company, currentUser } = options;
    const smtpStatus = this.isSMTPConfigured(company, currentUser);

    if (!smtpStatus.configured) {
      throw new Error(`SMTP not fully configured. Missing: ${smtpStatus.missing.join(", ")}`);
    }

    const smtpServer = company!.settings!.smtpServer!;
    const userCreds = currentUser!.smtpCredentials!;

    const senderEmail = userCreds.senderEmail || userCreds.username!;
    const senderDisplayName =
      userCreds.senderDisplayName || currentUser?.displayName || currentUser?.fullName || smtpServer.defaultSenderName || "Jay-QMS";

    const payload = {
      smtp: {
        host: smtpServer.host,
        port: smtpServer.port,
        secure: smtpServer.secure,
        user: userCreds.username!,
        pass: userCreds.password!,
        fromName: senderDisplayName,
        fromEmail: senderEmail,
      },
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: senderEmail,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    };

    try {
      const response = await fetch(this.getApiUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
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

      // Log success to Firestore
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
   * Log email communication record to Firestore for auditing and web app feedback tracking
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
      const logId = `eml-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const logRef = doc(firestore, "emailCommunications", logId);

      const logRecord: EmailCommunicationLog = {
        id: logId,
        companyId: options.company?.id || options.currentUser?.companyId || "global",
        projectId: options.projectId,
        senderUid: options.currentUser?.uid || "system",
        senderName: senderName,
        senderEmail: senderEmail,
        recipients: Array.isArray(options.to) ? options.to : [options.to],
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
        subject: options.subject,
        bodyText: options.text,
        bodyHtml: options.html,
        module: options.module || "GENERAL",
        referenceId: options.referenceId,
        referenceTitle: options.referenceTitle,
        status: status,
        errorMessage: errorMessage,
        hasAttachments: !!(options.attachments && options.attachments.length > 0),
        attachmentNames: options.attachments?.map((a) => a.filename),
        sentAt: new Date().toISOString(),
      };

      await setDoc(logRef, logRecord);
    } catch (logErr) {
      console.warn("Could not write email communication log to Firestore:", logErr);
    }
  }

  /**
   * Fetch recent email communications for a project or company
   */
  public static async getEmailLogs(companyId: string, projectId?: string): Promise<EmailCommunicationLog[]> {
    try {
      const colRef = collection(firestore, "emailCommunications");
      let q = query(colRef, where("companyId", "==", companyId));
      
      const snap = await getDocs(q);
      const logs: EmailCommunicationLog[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as EmailCommunicationLog;
        if (!projectId || data.projectId === projectId) {
          logs.push(data);
        }
      });

      // Sort newest first
      return logs.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    } catch (err) {
      console.warn("Error fetching email logs:", err);
      return [];
    }
  }
}
