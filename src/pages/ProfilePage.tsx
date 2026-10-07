import React, { useState, useRef } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useCompany } from "@/lib/companyHelper";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import {
  ROLE_TITLES,
  ROLE_LEVELS,
  getUserSigningTitle,
  isQAQCUser,
} from "@/lib/permissions";
import { UserProfile } from "@/types";
import { toast } from "react-hot-toast";
import {
  User,
  Camera,
  Trash2,
  Upload,
  Shield,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Layers,
  Save,
  CheckCircle2,
  Sparkles,
  Lock,
  ArrowLeft,
  FileCheck,
  Eye,
  EyeOff,
  Send,
  Server,
  AlertCircle,
  Key,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmailService } from "@/services/emailService";

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, setUser, refreshUserProfile } = useAuthStore();
  const { activeProject, projects } = useProjectStore();
  const { company, name: companyName } = useCompany();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State
  const [fullName, setFullName] = useState(currentUser?.fullName || "");
  const [displayName, setDisplayName] = useState(
    currentUser?.displayName || currentUser?.fullName || "",
  );
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [title, setTitle] = useState(
    currentUser?.title || currentUser?.designation || "",
  );
  const [department, setDepartment] = useState(
    currentUser?.department || "Quality Assurance & Control",
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(
    currentUser?.avatarUrl || "",
  );

  // Personal SMTP Credentials
  const [smtpUsername, setSmtpUsername] = useState(
    currentUser?.smtpCredentials?.username || currentUser?.email || "",
  );
  const [smtpPassword, setSmtpPassword] = useState(
    currentUser?.smtpCredentials?.password || "",
  );
  const [smtpSenderDisplayName, setSmtpSenderDisplayName] = useState(
    currentUser?.smtpCredentials?.senderDisplayName ||
      currentUser?.displayName ||
      currentUser?.fullName ||
      "",
  );
  const [smtpSenderEmail, setSmtpSenderEmail] = useState(
    currentUser?.smtpCredentials?.senderEmail || currentUser?.email || "",
  );
  const [smtpSignature, setSmtpSignature] = useState(
    currentUser?.smtpCredentials?.emailSignature ||
      `${currentUser?.fullName || "QA/QC Engineer"}\n${currentUser?.title || "QA/QC Engineer"}\nEmail: ${currentUser?.smtpCredentials?.senderEmail || currentUser?.email || ""}\nTel: ${currentUser?.phone || ""}`,
  );
  const [includeCompanyLogoInSignature, setIncludeCompanyLogoInSignature] = useState<boolean>(
    currentUser?.smtpCredentials?.includeCompanyLogoInSignature ?? true,
  );
  const [saveSentToImap, setSaveSentToImap] = useState<boolean>(
    currentUser?.smtpCredentials?.saveSentToImap ?? true,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testEmailTarget, setTestEmailTarget] = useState(
    currentUser?.email || "",
  );
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);

  const roleLevel = currentUser?.role ? ROLE_LEVELS[currentUser.role] || 1 : 1;
  const currentCompId = currentUser?.companyId || "comp-apex-civil";

  // Handle Photo Upload via local File Reader
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file is too large. Maximum size is 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setAvatarUrl(result);
        toast.success("Profile photo loaded! Click Save to apply.");
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  // Handle Remove Profile Photo
  const handleDeletePhoto = () => {
    setAvatarUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Profile photo removed. Click Save Changes to confirm.");
  };

  // Handle Test SMTP Connection
  const handleTestSmtp = async () => {
    if (!company?.settings?.smtpServer?.host) {
      toast.error(
        "Company SMTP Server Host is not configured. Please ask your administrator to configure it in Company Settings.",
      );
      return;
    }
    if (!smtpUsername.trim() || !smtpPassword.trim()) {
      toast.error("Please enter both your SMTP Username/Email and Password.");
      return;
    }

    setTestingSmtp(true);
    setTestResult(null);

    try {
      const res = await EmailService.testSMTPConnection({
        host: company.settings.smtpServer.host,
        port: company.settings.smtpServer.port || 587,
        secure: company.settings.smtpServer.secure,
        username: smtpUsername.trim(),
        password: smtpPassword.trim(),
        senderDisplayName: smtpSenderDisplayName.trim() || fullName,
        senderEmail: smtpSenderEmail.trim() || smtpUsername.trim(),
        testRecipientEmail: testEmailTarget.trim() || currentUser?.email || smtpUsername.trim(),
      });

      if (res.success) {
        setTestResult({
          success: true,
          message: res.message || "Connection verified successfully!",
        });
        toast.success("SMTP Connection verified! Test email dispatched.");
      } else {
        setTestResult({
          success: false,
          message: res.message || "Authentication failed. Check credentials.",
        });
        toast.error(res.message || "SMTP Connection test failed.");
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Failed to reach SMTP relay.",
      });
      toast.error("Failed to run SMTP test.");
    } finally {
      setTestingSmtp(false);
    }
  };

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!fullName.trim()) {
      toast.error("Full Name cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      const updatedUser: UserProfile = {
        ...currentUser,
        fullName: fullName.trim(),
        displayName: displayName.trim() || fullName.trim(),
        phone: phone.trim() || undefined,
        title: title.trim() || undefined,
        designation: title.trim() || undefined,
        department: department.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        smtpCredentials: {
          username: smtpUsername.trim() || undefined,
          password: smtpPassword.trim() || undefined,
          senderDisplayName: smtpSenderDisplayName.trim() || undefined,
          senderEmail: smtpSenderEmail.trim() || undefined,
          emailSignature: smtpSignature.trim() || undefined,
          saveSentToImap: saveSentToImap,
          includeCompanyLogoInSignature: includeCompanyLogoInSignature,
        },
        updatedAt: new Date().toISOString(),
      };

      await dbService.saveUser(updatedUser);
      setUser(updatedUser);

      try {
        await refreshUserProfile();
      } catch {}

      await writeAudit({
        companyId: currentCompId,
        projectId: activeProject?.id || currentUser.lastActiveProjectId || "global",
        userId: currentUser.uid,
        userName: updatedUser.fullName,
        userRole: currentUser.role,
        action: "UPDATE_PROFILE",
        module: "Auth",
        details: `User updated personal profile details, signing title ("${title}") and SMTP mail credentials`,
        newValue: updatedUser,
      });

      toast.success("Profile & SMTP credentials updated successfully!");
    } catch (err) {
      console.error("Failed to save user profile:", err);
      toast.error("Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition shrink-0"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                My Profile & Identity
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 font-mono">
                L{roleLevel}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your personal credentials, official signing title, avatar photo, and project details.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
        </button>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* ═══ Section 1: Avatar & Profile Photo Management ═══ */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Camera className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Profile Photo & Digital Avatar
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Photo Preview Container */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-400 relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-brand-600 text-white flex items-center justify-center text-3xl font-black">
                    {fullName.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>
            </div>

            {/* Upload & Delete Controls */}
            <div className="space-y-3 text-center sm:text-left flex-1">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Profile Picture
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  This picture will be displayed on team chats, approval queues, activity logs, and your personnel card.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-brand-600" />
                  <span>Upload Image</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold border border-red-200 dark:border-red-900/50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Photo</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Supported formats: PNG, JPG, WebP. Maximum file size: 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* ═══ Section 2: Personal Particulars & Official Title ═══ */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <User className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Personal Information & Official Designation
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Liam Sterling"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-semibold focus:border-brand-500 focus:outline-none transition"
              />
            </div>

            {/* Display / Short Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Display Name (In Chats)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Liam"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-semibold focus:border-brand-500 focus:outline-none transition"
              />
            </div>

            {/* Official Title / Designation */}
            <div className="sm:col-span-2 p-4 rounded-xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200/70 dark:border-brand-900/50 space-y-1.5">
              <label className="block text-xs font-bold text-brand-900 dark:text-brand-300">
                Official Job / Signing Title (Printed on Signatures & Dossiers)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`e.g. ${currentUser?.role ? ROLE_TITLES[currentUser.role] : "QA/QC Lead Engineer"}`}
                className="w-full bg-white dark:bg-slate-900 border border-brand-300 dark:border-brand-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none transition"
              />
              <p className="text-[11px] text-brand-700 dark:text-brand-300/80 leading-relaxed">
                💡 <strong>Important:</strong> Your system permissions are governed by your statutory role (<strong>{currentUser?.role ? ROLE_TITLES[currentUser.role] : "Role"}</strong>), but the title entered here is what will be formally stamped on your digital signatures, permits to pour, inspection hold points, Taking Over Certificates, and chat messages.
              </p>
            </div>

            {/* Work Email (Read-Only) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Work Email (Authenticated Identity)
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || ""}
                  className="w-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-500 dark:text-slate-400 text-xs font-semibold cursor-not-allowed pr-8"
                />
                <Lock className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone / WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-semibold focus:border-brand-500 focus:outline-none transition"
              />
            </div>

            {/* Department */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Department / Company Division
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Civil & Structural Quality Assurance"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-semibold focus:border-brand-500 focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* ═══ Section 3: Statutory RBAC Credentials & Project Roster ═══ */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Statutory RBAC & Project Membership
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Governance Role
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                {currentUser?.role ? ROLE_TITLES[currentUser.role] : "Engineer"}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                Tier Level {roleLevel}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Employer / Company
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                {companyName || "Apex Construction"}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {currentCompId}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Project Roster Access
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {currentUser?.projectIds?.includes("*")
                  ? "All Projects (Global)"
                  : `${currentUser?.projectIds?.length || 1} Workspaces`}
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                Active: {activeProject?.name || "None"}
              </span>
            </div>
          </div>
        </div>

        {/* ═══ Section 4: Personal Outgoing Email & SMTP Credentials ═══ */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Personal Email & Outgoing SMTP Credentials
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Dispatches Quality Reports & Direct Correspondence
            </span>
          </div>

          {/* Company Server Status Banner */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>
                <strong>Company Server:</strong>{" "}
                {company?.settings?.smtpServer?.host ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                    {company.settings.smtpServer.host}:{company.settings.smtpServer.port || 587} (
                    {company.settings.smtpServer.secure ? "SSL" : "TLS"})
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    Not configured yet (configured by Admin in Settings)
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SMTP Username / Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mailbox Username / Email *
              </label>
              <input
                type="text"
                value={smtpUsername}
                onChange={(e) => setSmtpUsername(e.target.value)}
                placeholder="e.g. yourname@company.com"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-semibold focus:border-indigo-500 focus:outline-none transition"
              />
            </div>

            {/* SMTP Password / App Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email / App Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-semibold focus:border-indigo-500 focus:outline-none transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                For Gmail or Microsoft 365 with 2FA, create an <strong>App Password</strong> in your email account security settings.
              </p>
            </div>

            {/* Outgoing Display Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Sender Display Name (Shown to Recipients)
              </label>
              <input
                type="text"
                value={smtpSenderDisplayName}
                onChange={(e) => setSmtpSenderDisplayName(e.target.value)}
                placeholder="e.g. Engr. Liam Sterling | Senior QA/QC Lead"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-semibold focus:border-indigo-500 focus:outline-none transition"
              />
            </div>

            {/* Sender From-Email Override */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                From Email Address
              </label>
              <input
                type="email"
                value={smtpSenderEmail}
                onChange={(e) => setSmtpSenderEmail(e.target.value)}
                placeholder="e.g. yourname@company.com"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-semibold focus:border-indigo-500 focus:outline-none transition"
              />
            </div>

            {/* Email Signature */}
            <div className="sm:col-span-2 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email Signature (Automatically Appended to Outgoing Mails)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const generatedSig = `${fullName || currentUser?.fullName || "Jesujuwon Oladejo"}\n${title || currentUser?.title || "QA/QC Engineer"}\nEmail: ${smtpSenderEmail || smtpUsername || currentUser?.email || "joladejo@collection.gp"}\nTel: ${phone || currentUser?.phone || "+2347011636030"}`;
                    setSmtpSignature(generatedSig);
                    setIncludeCompanyLogoInSignature(true);
                    toast.success("Signature template generated with company logo!");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-fill Signature Template</span>
                </button>
              </div>

              <textarea
                rows={4}
                value={smtpSignature}
                onChange={(e) => setSmtpSignature(e.target.value)}
                placeholder={`Jesujuwon Oladejo\nQA/QC Engineer\nEmail: joladejo@collection.gp\nTel: +2347011636030`}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-xs font-mono focus:border-indigo-500 focus:outline-none transition"
              />

              {/* Logo in Signature Toggle */}
              <label className="flex items-center gap-2.5 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition">
                <input
                  type="checkbox"
                  checked={includeCompanyLogoInSignature}
                  onChange={(e) => setIncludeCompanyLogoInSignature(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Embed Company Logo in Email Signature
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Automatically displays the official Collection Developments company logo in your signature block on outgoing reports and correspondence.
                  </p>
                </div>
              </label>

              {/* Live Signature Preview */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <span>Live Email Signature Preview</span>
                  <span>Recipient View</span>
                </div>
                
                <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {fullName || currentUser?.fullName || "Jesujuwon Oladejo"}
                  </div>
                  <div className="font-semibold text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                    {title || currentUser?.title || currentUser?.designation || "QA/QC Engineer"}
                  </div>

                  {includeCompanyLogoInSignature && (
                    <div className="my-2.5">
                      <img
                        src={company?.logoUrl || company?.logo || "/jqms-logo.png"}
                        alt={companyName || "Collection Developments"}
                        className="h-10 sm:h-11 max-w-[160px] object-contain block dark:brightness-110"
                        onError={(e) => {
                          // Fallback gracefully to text badge if image not loaded
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <div className="space-y-0.5 text-xs text-slate-600 dark:text-slate-400 mt-2 font-mono">
                    <div>
                      <strong className="font-sans text-slate-700 dark:text-slate-300">Email:</strong>{" "}
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {smtpSenderEmail || smtpUsername || currentUser?.email || "joladejo@collection.gp"}
                      </span>
                    </div>
                    {(phone || currentUser?.phone) && (
                      <div>
                        <strong className="font-sans text-slate-700 dark:text-slate-300">Tel:</strong>{" "}
                        <span>{phone || currentUser?.phone || "+2347011636030"}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* IMAP Sent Box Sync Option */}
            <div className="sm:col-span-2">
              <label className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/70 transition">
                <input
                  type="checkbox"
                  checked={saveSentToImap}
                  onChange={(e) => setSaveSentToImap(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-200 block">
                    Sync Outgoing Emails to My Official Sent Items Folder
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Ensures a complete copy of every report or email sent from Jay-QMS appears in your Outlook, Gmail, or Webmail Sent box.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Test SMTP Tool Box */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Live Verification & Test Email Dispatch
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Verify before sending official reports
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Recipient test email address..."
                  value={testEmailTarget}
                  onChange={(e) => setTestEmailTarget(e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-xs focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestSmtp}
                  disabled={testingSmtp || !smtpUsername || !smtpPassword}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm transition shrink-0"
                >
                  <Send className={`w-3.5 h-3.5 ${testingSmtp ? "animate-spin" : ""}`} />
                  <span>{testingSmtp ? "Testing..." : "Send Test Email"}</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                    testResult.success
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong>{testResult.success ? "Success:" : "Error:"}</strong> {testResult.message}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
