import React, { useState, useEffect, useRef } from "react";
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
  Building2,
  ExternalLink,
  ShieldCheck,
  Plus,
  Info,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useCompany } from "@/lib/companyHelper";
import { EmailService } from "@/services/emailService";
import { ROLE_TITLES } from "@/lib/permissions";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

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
  defaultCc?: string[];
  defaultBcc?: string[];
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
  defaultCc = [],
  defaultBcc = [],
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
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { activeProject } = useProjectStore();
  const { company, name: companyName } = useCompany();

  // Form State
  const [toInput, setToInput] = useState("");
  const [ccInput, setCcInput] = useState("");
  const [bccInput, setBccInput] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [includeSignature, setIncludeSignature] = useState(true);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [sending, setSending] = useState(false);

  // Track previous open state to only initialize when modal transitions from closed -> open
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Initialize form fields ONLY when opening
      setToInput(defaultRecipients.join(", "));
      setCcInput(defaultCc.join(", "));
      setBccInput(defaultBcc.join(", "));
      setShowCc(defaultCc.length > 0);
      setShowBcc(defaultBcc.length > 0);
      setSubject(defaultSubject);
      setMessage(defaultBodyText);
      setAttachments(initialAttachments);
      setIncludeSignature(true);
      setIncludeLogo(currentUser?.smtpCredentials?.includeCompanyLogoInSignature !== false);
    }
    prevIsOpenRef.current = isOpen;
  }, [
    isOpen,
    defaultRecipients,
    defaultCc,
    defaultBcc,
    defaultSubject,
    defaultBodyText,
    initialAttachments,
    currentUser,
  ]);

  if (!isOpen) return null;

  // Check SMTP configuration status
  const smtpStatus = EmailService.isSMTPConfigured(company, currentUser);

  // User identity details
  const authorName =
    currentUser?.smtpCredentials?.senderDisplayName ||
    currentUser?.fullName ||
    currentUser?.displayName ||
    "QA/QC Engineer";
  const authorTitle =
    currentUser?.title ||
    currentUser?.designation ||
    (currentUser?.role ? ROLE_TITLES[currentUser.role] : "QA/QC Engineer") ||
    "QA/QC Engineer";
  const authorEmail =
    currentUser?.smtpCredentials?.senderEmail ||
    currentUser?.smtpCredentials?.username ||
    currentUser?.email ||
    "";
  const authorPhone = currentUser?.phone || "";
  const companyLogoUrl =
    company?.logoUrl ||
    company?.logo ||
    (typeof window !== "undefined" ? `${window.location.origin}/jqms-logo.png` : "");
  const customSignatureText = currentUser?.smtpCredentials?.emailSignature?.trim() || "";

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

  const handleQuickAddRecipient = (email: string, targetField: "to" | "cc" = "to") => {
    if (!email) return;
    if (targetField === "to") {
      const current = toInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!current.includes(email)) {
        setToInput(current.length > 0 ? `${toInput.trim()}, ${email}` : email);
        toast.success(`Added ${email} to recipients`);
      }
    } else {
      setShowCc(true);
      const current = ccInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!current.includes(email)) {
        setCcInput(current.length > 0 ? `${ccInput.trim()}, ${email}` : email);
        toast.success(`Added ${email} to CC`);
      }
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!smtpStatus.configured) {
      toast.error(`Cannot send: Missing ${smtpStatus.missing.join(", ")}`);
      return;
    }

    const recipients = toInput
      .split(/[,;]/)
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    if (recipients.length === 0) {
      toast.error("Please enter at least one recipient email address in the 'To' field.");
      return;
    }

    const ccRecipients = ccInput
      .split(/[,;]/)
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const bccRecipients = bccInput
      .split(/[,;]/)
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    setSending(true);

    try {
      const esc = (v?: string) =>
        String(v || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");

      const resolvedOrgName = companyName || company?.name || "Jay-QMS Enterprise";

      // 1. Build signature HTML
      const signatureHtml = includeSignature
        ? EmailService.formatSignatureHtml({
            signatureText: customSignatureText || undefined,
            fullName: authorName,
            title: authorTitle,
            companyName: resolvedOrgName,
            companyLogoUrl: companyLogoUrl,
            email: authorEmail,
            phone: authorPhone,
            includeLogo: includeLogo,
          })
        : "";

      // 2. Build Message HTML body (entity-escaped to prevent HTML/XSS injection)
      const messageBodyHtml = message
        .split("\n\n")
        .map(
          (paragraph) =>
            `<p style="margin: 0 0 12px 0; line-height: 1.6;">${esc(paragraph).replace(/\n/g, "<br/>")}</p>`,
        )
        .join("");

      // 3. Complete Corporate HTML Email
      const formattedHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc;">
          <!-- Corporate Header -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 20px 24px; border-radius: 12px; color: #ffffff; margin-bottom: 20px;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 4px;">Quality Assurance &amp; Control System</div>
            <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #ffffff;">${esc(resolvedOrgName)}</h2>
            ${activeProject?.name ? `<div style="font-size: 12px; color: #38bdf8; margin-top: 4px;">Project: <strong>${esc(activeProject.name)}</strong></div>` : ""}
          </div>
          
          <!-- Message Body Card -->
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 20px; font-size: 14px; color: #1e293b;">
            ${messageBodyHtml}
            ${signatureHtml}
          </div>

          <!-- Document / Report Reference -->
          ${
            referenceTitle
              ? `
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 12px; color: #475569;">
                <strong>Document Reference:</strong> ${esc(referenceTitle)} ${referenceId ? `<span style="font-family: monospace; color: #64748b;">(${esc(referenceId)})</span>` : ""}
              </div>
            `
              : ""
          }

          <!-- Audit Footer -->
          <div style="font-size: 11px; color: #94a3b8; text-align: center; padding-top: 8px;">
            Sent securely via <strong>Jay-QMS Enterprise</strong> by ${esc(authorName)}${authorEmail ? ` (${esc(authorEmail)})` : ""}.
          </div>
        </div>
      `;

      // 4. Plain text fallback
      const plainText = `${message}\n\n${includeSignature ? `--\n${authorName}\n${authorTitle}\n${authorEmail ? `Email: ${authorEmail}` : ""}\n${authorPhone ? `Tel: ${authorPhone}` : ""}` : ""}`;

      const res = await EmailService.sendEmail({
        company,
        currentUser,
        to: recipients,
        cc: ccRecipients.length > 0 ? ccRecipients : undefined,
        bcc: bccRecipients.length > 0 ? bccRecipients : undefined,
        subject: subject.trim() || "Jay-QMS Quality Communication",
        text: plainText,
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
        toast.success("Official email report dispatched successfully!");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Dispatch Email Communication
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  {smtpStatus.mode === "custom" ? "Encrypted Custom SMTP" : "Platform SMTP Relay"}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Server:{" "}
                <span className="font-mono">
                  {smtpStatus.mode === "custom"
                    ? company?.settings?.smtpServer?.host
                    : "Platform Environment Relay"}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning if SMTP is not configured */}
        {!smtpStatus.configured && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <strong>SMTP Setup Required:</strong>
                <p>
                  Missing: {smtpStatus.missing.join(", ")}. Please configure your mailbox password in Personal Settings.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/project/profile");
              }}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shrink-0 transition"
            >
              Configure Profile
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSendEmail} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Sender Identity Preview */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>
                <strong>From:</strong> {authorName} &lt;{authorEmail}&gt;
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Title: <strong className="text-slate-700 dark:text-slate-200">{authorTitle}</strong>
              </span>
            </div>
          </div>

          {/* Recipients: TO */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                To (Recipients) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {!showCc && (
                  <button
                    type="button"
                    onClick={() => setShowCc(true)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add CC
                  </button>
                )}
                {!showBcc && (
                  <button
                    type="button"
                    onClick={() => setShowBcc(true)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add BCC
                  </button>
                )}
              </div>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. client@developer.com, consultant@eng.com (separate multiple with commas)"
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-medium focus:border-indigo-500 focus:outline-none transition shadow-xs"
            />
          </div>

          {/* Quick Add Project Stakeholders (if available) */}
          {activeProject && (activeProject.clientName || activeProject.consultantName || activeProject.contractorName) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Project Stakeholders:
              </span>
              {activeProject.clientName && (
                <button
                  type="button"
                  onClick={() => handleQuickAddRecipient(`client@${activeProject.clientName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md text-[10px] font-semibold border border-slate-200 dark:border-slate-700 transition flex items-center gap-1"
                >
                  <span>+ Client ({activeProject.clientName})</span>
                </button>
              )}
              {activeProject.consultantName && (
                <button
                  type="button"
                  onClick={() => handleQuickAddRecipient(`consultant@${activeProject.consultantName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`, "cc")}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md text-[10px] font-semibold border border-slate-200 dark:border-slate-700 transition flex items-center gap-1"
                >
                  <span>+ CC Consultant ({activeProject.consultantName})</span>
                </button>
              )}
            </div>
          )}

          {/* CC Field */}
          {showCc && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  CC (Carbon Copy)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowCc(false);
                    setCcInput("");
                  }}
                  className="text-[10px] text-slate-400 hover:text-red-500 font-semibold"
                >
                  Remove CC
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. director@company.com, pm@company.com (comma separated)"
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white text-xs font-medium focus:border-indigo-500 focus:outline-none transition"
              />
            </div>
          )}

          {/* BCC Field */}
          {showBcc && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  BCC (Blind Carbon Copy)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowBcc(false);
                    setBccInput("");
                  }}
                  className="text-[10px] text-slate-400 hover:text-red-500 font-semibold"
                >
                  Remove BCC
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. archive@company.com, audit@company.com (comma separated)"
                value={bccInput}
                onChange={(e) => setBccInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white text-xs font-medium focus:border-indigo-500 focus:outline-none transition"
              />
            </div>
          )}

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. [QA/QC Weekly Report] Week 38 - Bayview Suites"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-bold focus:border-indigo-500 focus:outline-none transition shadow-xs"
            />
          </div>

          {/* Message Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Message Content
              </label>
              <span className="text-[11px] text-slate-400">
                Personal signature and branding are automatically appended below
              </span>
            </div>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your email body here..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-slate-900 dark:text-white text-xs leading-relaxed focus:border-indigo-500 focus:outline-none transition shadow-xs"
            />
          </div>

          {/* ═══ Personal Signature & Company Branding Box ═══ */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Personal Signature & Company Branding
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Applied from Profile
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/project/profile");
                }}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>Edit in Profile</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Signature Live Preview Card */}
            <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs space-y-2">
              <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                {authorName}
              </div>
              <div className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                {authorTitle}
              </div>

              {/* Embedded Logo */}
              {includeLogo && (
                <div className="my-2.5">
                  <img
                    src={companyLogoUrl}
                    alt={companyName || "Company Logo"}
                    className="h-10 sm:h-11 max-w-[170px] object-contain block dark:brightness-110"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Custom Signature text lines if provided */}
              {customSignatureText && (
                <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line font-mono bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  {customSignatureText}
                </div>
              )}

              {/* Contact info badges */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1 font-mono">
                {authorEmail && (
                  <div>
                    <strong className="font-sans text-slate-700 dark:text-slate-300">Email:</strong>{" "}
                    <span className="text-indigo-600 dark:text-indigo-400">{authorEmail}</span>
                  </div>
                )}
                {authorPhone && (
                  <div>
                    <strong className="font-sans text-slate-700 dark:text-slate-300">Tel:</strong>{" "}
                    <span>{authorPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Signature Toggles */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSignature}
                  onChange={(e) => setIncludeSignature(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                />
                <span>Include Personal Signature in this email</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLogo}
                  disabled={!includeSignature}
                  onChange={(e) => setIncludeLogo(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-indigo-500 disabled:opacity-50"
                />
                <span>Embed Company Logo</span>
              </label>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Attachments ({attachments.length})
              </label>
              <label className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add File
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
                No attachments added. Generated PDFs or local files can be attached.
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
