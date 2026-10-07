import React, { useState, useEffect, useRef } from "react";
import {
  Settings as SettingsIcon,
  Building2,
  ShieldCheck,
  Bell,
  Save,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Hash,
  Sparkles,
  RefreshCw,
  Layers,
  AlertCircle,
  Server,
  Send,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useCompany } from "@/lib/companyHelper";
import { writeAudit } from "@/lib/audit";

export const Settings: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { activeProject } = useProjectStore();
  const {
    company,
    companyId,
    name: dbName,
    legalName: dbLegalName,
    logoUrl: dbLogoUrl,
    email: dbEmail,
    phone: dbPhone,
    address: dbAddress,
    website: dbWebsite,
    registrationNo: dbRegistrationNo,
    taxNumber: dbTaxNumber,
    standards: dbStandards,
    settings: dbSettings,
    isLoading: isCompanyLoading,
    refreshCompany,
    updateCompany,
  } = useCompany();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states initialized from live company helper
  const [name, setName] = useState(dbName);
  const [legalName, setLegalName] = useState(dbLegalName);
  const [registrationNo, setRegistrationNo] = useState(dbRegistrationNo);
  const [taxNumber, setTaxNumber] = useState(dbTaxNumber);
  const [email, setEmail] = useState(dbEmail);
  const [phone, setPhone] = useState(dbPhone);
  const [address, setAddress] = useState(dbAddress);
  const [website, setWebsite] = useState(dbWebsite);
  const [logoUrl, setLogoUrl] = useState(dbLogoUrl || "");

  // Prefixes & Engineering Standards
  const [ncrPrefix, setNcrPrefix] = useState(dbSettings.ncrPrefix || "NCR");
  const [rfiPrefix, setRfiPrefix] = useState(dbSettings.rfiPrefix || "RFI");
  const [marPrefix, setMarPrefix] = useState(dbSettings.marPrefix || "MAR");
  const [siteCommentPrefix, setSiteCommentPrefix] = useState(
    dbSettings.siteCommentPrefix || "QC/COM",
  );
  const [inspectionPrefix, setInspectionPrefix] = useState(
    dbSettings.inspectionPrefix || "INSP",
  );
  const [ptpPrefix, setPtpPrefix] = useState(dbSettings.ptpPrefix || "PTP");
  const [weeklyReportPrefix, setWeeklyReportPrefix] = useState(
    dbSettings.weeklyReportPrefix || "WQR",
  );
  const [siteInstructionPrefix, setSiteInstructionPrefix] = useState(
    dbSettings.siteInstructionPrefix || "SI",
  );

  const [cubeTestStandard, setCubeTestStandard] = useState(
    dbSettings.cubeTestStandard || "BS EN 12390",
  );
  const [rebarStandard, setRebarStandard] = useState(
    dbSettings.rebarStandard || "BS 4449",
  );

  // Standards list
  const [standards, setStandards] = useState<string[]>(dbStandards);
  const [newStandard, setNewStandard] = useState("");

  // Notification preferences
  const [notifyNCR, setNotifyNCR] = useState(
    dbSettings.notifications?.notifyNCR ?? true,
  );
  const [notifyInspection, setNotifyInspection] = useState(
    dbSettings.notifications?.notifyInspection ?? true,
  );
  const [notifyCubeFailure, setNotifyCubeFailure] = useState(
    dbSettings.notifications?.notifyCubeFailure ?? true,
  );
  const [notifyPTP, setNotifyPTP] = useState(
    dbSettings.notifications?.notifyPTP ?? true,
  );

  // Corporate SMTP Server Configuration
  const [smtpHost, setSmtpHost] = useState(dbSettings.smtpServer?.host || "");
  const [smtpPort, setSmtpPort] = useState<number>(dbSettings.smtpServer?.port || 587);
  const [smtpSecure, setSmtpSecure] = useState<boolean>(dbSettings.smtpServer?.secure ?? false);
  const [imapHost, setImapHost] = useState(dbSettings.smtpServer?.imapHost || "");
  const [imapPort, setImapPort] = useState<number>(dbSettings.smtpServer?.imapPort || 993);
  const [defaultSenderName, setDefaultSenderName] = useState(
    dbSettings.smtpServer?.defaultSenderName || dbName || "Jay-QMS Notifications"
  );

  // Quick Preset Handlers
  const applySmtpPreset = (preset: "m365" | "gmail" | "cpanel" | "ses") => {
    switch (preset) {
      case "m365":
        setSmtpHost("smtp.office365.com");
        setSmtpPort(587);
        setSmtpSecure(false);
        setImapHost("outlook.office365.com");
        setImapPort(993);
        break;
      case "gmail":
        setSmtpHost("smtp.gmail.com");
        setSmtpPort(587);
        setSmtpSecure(false);
        setImapHost("imap.gmail.com");
        setImapPort(993);
        break;
      case "cpanel":
        setSmtpHost(email ? `mail.${email.split("@")[1] || "domain.com"}` : "mail.yourcompany.com");
        setSmtpPort(465);
        setSmtpSecure(true);
        setImapHost(email ? `mail.${email.split("@")[1] || "domain.com"}` : "mail.yourcompany.com");
        setImapPort(993);
        break;
      case "ses":
        setSmtpHost("email-smtp.us-east-1.amazonaws.com");
        setSmtpPort(587);
        setSmtpSecure(false);
        break;
    }
  };

  // Status & UI
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Keep form in sync when company loads/changes in DB
  useEffect(() => {
    if (company) {
      setName(company.name || dbName);
      setLegalName(company.legalName || company.name || dbLegalName);
      setRegistrationNo(company.registrationNo || dbRegistrationNo);
      setTaxNumber(company.taxNumber || dbTaxNumber);
      setEmail(company.email || dbEmail);
      setPhone(company.phone || dbPhone);
      setAddress(company.address || dbAddress);
      setWebsite(company.website || dbWebsite);
      setLogoUrl(company.logoUrl || company.logo || "");
      setStandards(company.standards || dbStandards);

      if (company.settings) {
        if (company.settings.ncrPrefix)
          setNcrPrefix(company.settings.ncrPrefix);
        if (company.settings.rfiPrefix)
          setRfiPrefix(company.settings.rfiPrefix);
        if (company.settings.marPrefix)
          setMarPrefix(company.settings.marPrefix);
        if (company.settings.siteCommentPrefix)
          setSiteCommentPrefix(company.settings.siteCommentPrefix);
        if (company.settings.inspectionPrefix)
          setInspectionPrefix(company.settings.inspectionPrefix);
        if (company.settings.ptpPrefix)
          setPtpPrefix(company.settings.ptpPrefix);
        if (company.settings.weeklyReportPrefix)
          setWeeklyReportPrefix(company.settings.weeklyReportPrefix);
        if (company.settings.siteInstructionPrefix)
          setSiteInstructionPrefix(company.settings.siteInstructionPrefix);
        if (company.settings.cubeTestStandard)
          setCubeTestStandard(company.settings.cubeTestStandard);
        if (company.settings.rebarStandard)
          setRebarStandard(company.settings.rebarStandard);

        if (company.settings.smtpServer) {
          if (company.settings.smtpServer.host !== undefined)
            setSmtpHost(company.settings.smtpServer.host);
          if (company.settings.smtpServer.port !== undefined)
            setSmtpPort(company.settings.smtpServer.port);
          if (company.settings.smtpServer.secure !== undefined)
            setSmtpSecure(company.settings.smtpServer.secure);
          if (company.settings.smtpServer.imapHost !== undefined)
            setImapHost(company.settings.smtpServer.imapHost);
          if (company.settings.smtpServer.imapPort !== undefined)
            setImapPort(company.settings.smtpServer.imapPort);
          if (company.settings.smtpServer.defaultSenderName !== undefined)
            setDefaultSenderName(company.settings.smtpServer.defaultSenderName);
        }

        if (company.settings.notifications) {
          if (company.settings.notifications.notifyNCR !== undefined)
            setNotifyNCR(company.settings.notifications.notifyNCR);
          if (company.settings.notifications.notifyInspection !== undefined)
            setNotifyInspection(
              company.settings.notifications.notifyInspection,
            );
          if (company.settings.notifications.notifyCubeFailure !== undefined)
            setNotifyCubeFailure(
              company.settings.notifications.notifyCubeFailure,
            );
          if (company.settings.notifications.notifyPTP !== undefined)
            setNotifyPTP(company.settings.notifications.notifyPTP);
        }
      }
    }
  }, [company]);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert(
        "Logo file size exceeds 2MB limit. Please upload an optimized image.",
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddStandard = () => {
    if (!newStandard.trim()) return;
    if (!standards.includes(newStandard.trim())) {
      setStandards([...standards, newStandard.trim()]);
    }
    setNewStandard("");
  };

  const handleRemoveStandard = (idx: number) => {
    const next = [...standards];
    next.splice(idx, 1);
    setStandards(next);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    try {
      const updatedPayload = {
        name: name.trim() || "Collection Developments LTD",
        legalName: legalName.trim() || name.trim(),
        registrationNo: registrationNo.trim(),
        taxNumber: taxNumber.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        website: website.trim(),
        logo: logoUrl || undefined,
        logoUrl: logoUrl || undefined,
        standards,
        settings: {
          ncrPrefix: ncrPrefix.trim() || "NCR",
          rfiPrefix: rfiPrefix.trim() || "RFI",
          marPrefix: marPrefix.trim() || "MAR",
          siteCommentPrefix: siteCommentPrefix.trim() || "QC/COM",
          inspectionPrefix: inspectionPrefix.trim() || "INSP",
          ptpPrefix: ptpPrefix.trim() || "PTP",
          weeklyReportPrefix: weeklyReportPrefix.trim() || "WQR",
          siteInstructionPrefix: siteInstructionPrefix.trim() || "SI",
          cubeTestStandard,
          rebarStandard,
          notifications: {
            notifyNCR,
            notifyInspection,
            notifyCubeFailure,
            notifyPTP,
          },
          smtpServer: {
            host: smtpHost.trim(),
            port: Number(smtpPort) || 587,
            secure: smtpSecure,
            imapHost: imapHost.trim() || undefined,
            imapPort: Number(imapPort) || 993,
            defaultSenderName: defaultSenderName.trim() || undefined,
          },
        },
      };

      await updateCompany(updatedPayload);

      // Log to Audit Trail
      if (currentUser) {
        await writeAudit({
          projectId: activeProject?.id || "",
          companyId: companyId,
          userId: currentUser.uid,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          action: "UPDATE_COMPANY_SETTINGS",
          module: "Settings",
          details: `Updated corporate profile & QA/QC engineering settings for ${name}`,
          newValue: updatedPayload,
        });
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error("Error saving company settings:", err);
      setSaveError(err?.message || "Failed to save settings to database.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm dark:shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Live Cloud Firestore Configuration</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <SettingsIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Company & QA/QC Global Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage your organization's legal profile, contact details, corporate
            branding, technical standards, and numbering series.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refreshCompany()}
            disabled={isCompanyLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition shadow-sm"
            title="Refresh latest company data from database"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isCompanyLoading ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""}`}
            />
            <span>{isCompanyLoading ? "Syncing..." : "Sync Live DB"}</span>
          </button>

          {savedSuccess && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved & Synced Live</span>
            </div>
          )}
        </div>
      </div>

      {saveError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Company Profile & Corporate Branding */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm dark:shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Organization Identity & Corporate Branding</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-[10px] font-mono border border-indigo-500/20">
              ID: {companyId}
            </span>
          </div>

          {/* Logo Upload & Preview */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Company Logo (Used on PDF Reports, Quality Registers & Submittals)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-40 h-20 rounded-xl bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center p-2 overflow-hidden shrink-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Company Logo Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-400 dark:text-slate-500 space-y-1">
                    <ImageIcon className="w-6 h-6 mx-auto opacity-50" />
                    <span className="text-[10px] block">No Logo Uploaded</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoFileUpload}
                    accept="image/png, image/jpeg, image/svg+xml, image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo Image</span>
                  </button>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-500/10 dark:hover:bg-red-500/20 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Logo</span>
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Or paste direct image URL below:
                </div>
                <input
                  type="text"
                  placeholder="https://example.com/logo.png or data:image/png;base64,..."
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Company Legal Name (Official Entity)
              </label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="e.g. Collection Developments Limited"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Trading / Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Collection Developments LTD"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Commercial Registration # (CR / Company House)
              </label>
              <input
                type="text"
                value={registrationNo}
                onChange={(e) => setRegistrationNo(e.target.value)}
                placeholder="e.g. CR-2024-8849102"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Tax / VAT Identification Number
              </label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                placeholder="e.g. GB 992 819 021"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact Details & Head Office Address */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-sm">
            <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Corporate Contacts & Head Office Location</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Official Quality / Corporate Email</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="quality@collectiondev.com"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Head Office Phone / Switchboard</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+44 (0) 20 7946 0912"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Corporate Website URL</span>
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://collectiondevelopments.com"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Physical Head Office Address</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="14 Bankside Boulevard, London SE1 9SG, United Kingdom"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Document Series & QA/QC Numbering Prefixes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-sm">
            <Hash className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Document Numbering & QA/QC Module Prefixes</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                NCR Prefix
              </label>
              <input
                type="text"
                value={ncrPrefix}
                onChange={(e) => setNcrPrefix(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm font-mono uppercase focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                e.g. {ncrPrefix}-2026-001
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                RFI Prefix
              </label>
              <input
                type="text"
                value={rfiPrefix}
                onChange={(e) => setRfiPrefix(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm font-mono uppercase focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                e.g. {rfiPrefix}-2026-001
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                MAR / Submittal
              </label>
              <input
                type="text"
                value={marPrefix}
                onChange={(e) => setMarPrefix(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm font-mono uppercase focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                e.g. {marPrefix}-2026-001
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Site Observations
              </label>
              <input
                type="text"
                value={siteCommentPrefix}
                onChange={(e) => setSiteCommentPrefix(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm font-mono uppercase focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                e.g. {siteCommentPrefix}/2026/001
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Inspection (INSP)
              </label>
              <input
                type="text"
                value={inspectionPrefix}
                onChange={(e) => setInspectionPrefix(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm font-mono uppercase focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                e.g. {inspectionPrefix}-2026-001
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Pour Permit (PTP)
              </label>
              <input
                type="text"
                value={ptpPrefix}
                onChange={(e) => setPtpPrefix(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm font-mono uppercase focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                e.g. {ptpPrefix}-2026-001
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Weekly Report (WQR)
              </label>
              <input
                type="text"
                value={weeklyReportPrefix}
                onChange={(e) => setWeeklyReportPrefix(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm font-mono uppercase focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                e.g. {weeklyReportPrefix}-2026-W36
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Site Instruction (SI)
              </label>
              <input
                type="text"
                value={siteInstructionPrefix}
                onChange={(e) => setSiteInstructionPrefix(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm font-mono uppercase focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                e.g. {siteInstructionPrefix}-2026-001
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Quality Standards & Technical Code Frameworks */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Quality Standards & Technical Specifications</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Concrete Compressive Cube Testing Standard
              </label>
              <select
                value={cubeTestStandard}
                onChange={(e) => setCubeTestStandard(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="BS EN 12390">
                  BS EN 12390 (British / European Standard)
                </option>
                <option value="ASTM C39">
                  ASTM C39 (American Standard for Cylinders & Cubes)
                </option>
                <option value="IS 516">
                  IS 516 (Indian Standard Method of Tests for Strength)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Reinforcing Steel Tensile & Bend Standard
              </label>
              <select
                value={rebarStandard}
                onChange={(e) => setRebarStandard(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="BS 4449">
                  BS 4449 (Steel for the Reinforcement of Concrete)
                </option>
                <option value="ASTM A615">
                  ASTM A615 / A615M (Deformed and Plain Carbon-Steel)
                </option>
                <option value="IS 1786">
                  IS 1786 (High Strength Deformed Steel Bars)
                </option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Active Project Quality & Compliance Accreditations
            </label>
            {standards.map((std, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl"
              >
                <span className="text-sm text-slate-900 dark:text-slate-200">
                  {std}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveStandard(idx)}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold px-2 py-1 rounded hover:bg-red-500/10 transition"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="Add technical code standard (e.g. BS 8110 Structural Use of Concrete)..."
              value={newStandard}
              onChange={(e) => setNewStandard(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddStandard();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddStandard}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition shadow-sm"
            >
              Add Standard
            </button>
          </div>
        </div>

        {/* Section 5: Real-time Notifications & Escalation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-bold text-sm">
            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Automated Escalation & Quality Alerts</span>
          </div>

          <div className="space-y-3">
            {[
              {
                label:
                  "Auto-notify QA/QC Manager on CRITICAL Non-Conformance (NCR)",
                desc: "Instantly dispatches alert when an NCR with HIGH or CRITICAL severity is registered",
                checked: notifyNCR,
                set: setNotifyNCR,
              },
              {
                label:
                  "Send instant push notification on Failed Concrete Cube Compressive Strength",
                desc: "Alerts Quality Lead & Project Manager when 7-day or 28-day concrete cube strength drops below 100%",
                checked: notifyCubeFailure,
                set: setNotifyCubeFailure,
              },
              {
                label:
                  "Alert Supervision Consultant upon Request for Inspection (RFI / RIR) Submission",
                desc: "Automates dispatch of inspection hold point requests to nominated consultant engineers",
                checked: notifyInspection,
                set: setNotifyInspection,
              },
              {
                label:
                  "Notify Pour Clearance Lead when all multi-disciplinary PTP signatures are signed",
                desc: "Informs Batching Plant and Concreting Team once rebar, MEP, surveyor & consultant have cleared PTP",
                checked: notifyPTP,
                set: setNotifyPTP,
              },
            ].map((item, idx) => (
              <label
                key={idx}
                className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/30 transition"
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => item.set(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.desc}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Section 6: Corporate Email Server & SMTP Gateway */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm dark:shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Server className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Corporate Email Server & SMTP Gateway</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Company-wide Mail Routing Infrastructure
            </span>
          </div>

          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong>Architecture Note:</strong> The SMTP & IMAP server parameters (host, port, security mode) defined here apply to all team members across the organization. Each logged-in engineer connects their individual mailbox username, password, and sender display name in their personal <strong>Profile Page</strong>.
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Quick Provider Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "m365", label: "Microsoft 365 / Exchange" },
                { id: "gmail", label: "Google Workspace / Gmail" },
                { id: "cpanel", label: "Custom cPanel / Webmail" },
                { id: "ses", label: "Amazon SES Relay" },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applySmtpPreset(preset.id as any)}
                  className="px-3 py-2 text-xs font-semibold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition text-center truncate"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Host & Port Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                SMTP Outgoing Server Host
              </label>
              <input
                type="text"
                placeholder="e.g. smtp.office365.com or smtp.gmail.com"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                SMTP Port & Protocol
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="587"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(Number(e.target.value))}
                  className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none text-center"
                />
                <select
                  value={smtpSecure ? "SSL" : "TLS"}
                  onChange={(e) => setSmtpSecure(e.target.value === "SSL")}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2.5 text-slate-900 dark:text-white text-xs font-medium focus:border-indigo-500 focus:outline-none"
                >
                  <option value="TLS">STARTTLS / TLS (587)</option>
                  <option value="SSL">SSL Encrypted (465)</option>
                </select>
              </div>
            </div>
          </div>

          {/* IMAP Host & Port (For Sent Items Sync) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                IMAP Server Host (For Sent Items Sync)
              </label>
              <input
                type="text"
                placeholder="e.g. outlook.office365.com or imap.gmail.com"
                value={imapHost}
                onChange={(e) => setImapHost(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                IMAP Port
              </label>
              <input
                type="number"
                placeholder="993"
                value={imapPort}
                onChange={(e) => setImapPort(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none text-center"
              />
            </div>
          </div>

          {/* Default Sender Display Name & Quick Save */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Default Organization Sender Display Name
            </label>
            <input
              type="text"
              placeholder="e.g. Collection Developments QA/QC Quality Portal"
              value={defaultSenderName}
              onChange={(e) => setDefaultSenderName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {smtpHost ? `Configured for ${smtpHost}:${smtpPort}` : "Enter server details and save"}
            </span>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition active:scale-95"
            >
              <Save className={`w-3.5 h-3.5 ${isSaving ? "animate-spin" : ""}`} />
              <span>{isSaving ? "Saving..." : "Save SMTP Settings"}</span>
            </button>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition"
          >
            <Save className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`} />
            <span>
              {isSaving
                ? "Saving to Database..."
                : "Save & Update Organization Profile"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
