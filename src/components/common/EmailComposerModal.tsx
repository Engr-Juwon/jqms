import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Send,
  Paperclip,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle2,
  User,
  Sparkles,
  Layers,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCompany } from "@/lib/companyHelper";
import { EmailService } from "@/services/emailService";
import { toast } from "react-hot-toast";

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 string
  contentType?: string;
  sizeFormatted?: string;
}

export interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipients?: string[];
  defaultSubject?: string;
  defaultBodyHtml?: string;
  defaultBodyText?: string;
  initialAttachments?: EmailAttachment[];
  module?: "WEEKLY_REPORT" | "NCR" | "SITE_INSTRUCTION" | "CUBE_TEST" | "INSPECTION" | "GENERAL" | string;
  referenceId?: string;
  referenceTitle?: string;
  projectId?: string;
  onSuccess?: () => void;
}

export const EmailComposerModal: React.FC<EmailComposerModalProps> = ({
  isOpen,
  onClose,
  defaultRecipients = [],
  defaultSubject = "",
  defaultBodyHtml = "",
  defaultBodyText = "",
  initialAttachments = [],
  module = "GENERAL",
  referenceId,
  referenceTitle,
  projectId,
  onSuccess,
}) => {
  const { currentUser } = useAuthStore();
  const { company } = useCompany();

  const [toInput, setToInput] = useState(defaultRecipients.join(", "));
  const [ccInput, setCcInput] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultBodyText);
  const [attachments, setAttachments] = useState<EmailAttachment[]>(initialAttachments);
  const [sending, setSending] = useState(false);

  // Sync when props change
  useEffect(() => {
    if (isOpen) {
      setToInput(defaultRecipients.join(", "));
      setSubject(defaultSubject);
      
      const signature = currentUser?.smtpCredentials?.emailSignature
        ? `\n\n${currentUser.smtpCredentials.emailSignature}`
        : "";
      setMessage(defaultBodyText ? `${defaultBodyText}${signature}` : signature.trim());
      setAttachments(initialAttachments);
    }
  }, [isOpen, defaultRecipients, defaultSubject, defaultBodyText, initialAttachments]);

  if (!isOpen) return null;

  // Check SMTP configuration status
  const smtpStatus = EmailService.isSMTPConfigured(company, currentUser);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 15 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 15MB attachment limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data:*;base64, prefix
        const base64Content = result.split(",")[1] || result;
        const sizeFormatted = (file.size / 1024).toFixed(0) + " KB";

        setAttachments((prev) => [
          ...prev,
          {
            filename: file.name,
            content: base64Content,
            contentType: file.type || "application/octet-stream",
            sizeFormatted: sizeFormatted,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!smtpStatus.configured) {
      toast.error(`Cannot send: Missing ${smtpStatus.missing.join(", ")}`);
      return;
    }

    const recipients = toInput
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    if (recipients.length === 0) {
      toast.error("Please enter at least one recipient email address.");
      return;
    }

    const ccRecipients = ccInput
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    setSending(true);

    try {
      const companyLogo = company?.logoUrl || company?.logo || (typeof window !== "undefined" ? `${window.location.origin}/jqms-logo.png` : "");
      const includeLogo = currentUser?.smtpCredentials?.includeCompanyLogoInSignature !== false;
      
      let messageHtml = message.replace(/\n/g, "<br/>");
      
      // If message has {{logo}} or [LOGO] placeholder
      if (messageHtml.includes("{{logo}}") || messageHtml.includes("[LOGO]")) {
        const logoImg = companyLogo ? `<div style="margin: 10px 0;"><img src="${companyLogo}" alt="${company?.name || 'Company'}" style="max-height: 48px; max-width: 180px; object-fit: contain; display: block;" /></div>` : "";
        messageHtml = messageHtml.replace(/\{\{logo\}\}|\[LOGO\]/g, logoImg);
      } else if (includeLogo && companyLogo && currentUser?.smtpCredentials?.emailSignature) {
        // Auto-inject logo if the email signature text matches the user's saved signature
        const sigText = currentUser.smtpCredentials.emailSignature.trim();
        if (sigText && message.includes(sigText)) {
          const formattedSig = EmailService.formatSignatureHtml({
            signatureText: sigText,
            fullName: currentUser.fullName,
            title: currentUser.title || currentUser.designation,
            companyName: company?.name || "Collection Developments",
            companyLogoUrl: companyLogo,
            email: currentUser.smtpCredentials.senderEmail || currentUser.email,
            phone: currentUser.phone,
            includeLogo: true,
          });
          messageHtml = messageHtml.replace(sigText.replace(/\n/g, "<br/>"), formattedSig);
        }
      }

      // Build HTML formatting with pleasant styling
      const formattedHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; color: #1e293b; line-height: 1.6;">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 18px 24px; border-radius: 12px; color: #ffffff; margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff;">${company?.name || "Collection Developments"}</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">Quality Assurance & Control Official Communication</p>
          </div>
          
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            ${messageHtml}
          </div>

          ${
            referenceTitle
              ? `
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px;">
                <p style="margin: 0; color: #64748b;"><strong>Subject Reference:</strong> ${referenceTitle} ${referenceId ? `(${referenceId})` : ""}</p>
              </div>
            `
              : ""
          }

          <div style="font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            Sent securely via Jay-QMS by <strong>${currentUser?.fullName}</strong> (${currentUser?.smtpCredentials?.senderEmail || currentUser?.email}).
          </div>
        </div>
      `;

      const res = await EmailService.sendEmail({
        company,
        currentUser,
        to: recipients,
        cc: ccRecipients.length > 0 ? ccRecipients : undefined,
        subject: subject.trim() || "Jay-QMS Quality Communication",
        text: message,
        html: formattedHtml,
        attachments: attachments.map((att) => ({
          filename: att.filename,
          content: att.content,
          encoding: "base64",
          contentType: att.contentType,
        })),
        module: module,
        referenceId: referenceId,
        referenceTitle: referenceTitle,
        projectId: projectId,
      });

      if (res.success) {
        toast.success("Email dispatched successfully!");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Failed to dispatch email.");
      }
    } catch (err: any) {
      console.error("Send email failed:", err);
      toast.error(err.message || "Failed to dispatch email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Dispatch Email Communication
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Via Corporate SMTP Server: {company?.settings?.smtpServer?.host || "Unconfigured"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning if SMTP is not configured */}
        {!smtpStatus.configured && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <strong>SMTP Mailbox Setup Required:</strong>
              <p>
                To send emails, please complete your SMTP configuration: {smtpStatus.missing.join(", ")}.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSendEmail} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Sender Identity Preview */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <strong>From:</strong>{" "}
              {currentUser?.smtpCredentials?.senderDisplayName || currentUser?.fullName} &lt;
              {currentUser?.smtpCredentials?.senderEmail || currentUser?.email}&gt;
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              Personal Mailbox
            </span>
          </div>

          {/* Recipients (To) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                To (Recipients) *
              </label>
              {!showCc && (
                <button
                  type="button"
                  onClick={() => setShowCc(true)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  + Add CC
                </button>
              )}
            </div>
            <input
              type="text"
              required
              placeholder="e.g. client@consultant.com, pm@company.com (comma separated)"
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-medium focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* CC field */}
          {showCc && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                CC (Carbon Copy)
              </label>
              <input
                type="text"
                placeholder="e.g. director@company.com (comma separated)"
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-medium focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Subject *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Weekly Quality Report - Week 38 (Bayview Suites)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-semibold focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Message Body */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Message Content
            </label>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-slate-900 dark:text-white text-xs leading-relaxed focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Attachments Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Attachments ({attachments.length})
              </label>
              <label className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer">
                + Add File
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {att.filename}
                      </span>
                      {att.sizeFormatted && (
                        <span className="text-[10px] text-slate-400 shrink-0">
                          ({att.sizeFormatted})
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center text-xs text-slate-400">
                No attachments added. Generated PDFs or local documents can be attached.
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || !smtpStatus.configured}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition"
            >
              <Send className={`w-3.5 h-3.5 ${sending ? "animate-spin" : ""}`} />
              <span>{sending ? "Dispatching..." : "Send Email"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
