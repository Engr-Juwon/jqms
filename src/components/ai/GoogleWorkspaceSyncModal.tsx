import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Table,
  FileText,
  Mail,
  ExternalLink,
  Check,
  FolderOpen,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Copy,
} from "lucide-react";
import {
  getGoogleWorkspaceConfig,
  saveGoogleWorkspaceConfig,
  GoogleWorkspaceConfig,
  syncToGoogleCalendar,
  exportToGoogleSheets,
  exportToGoogleDocs,
  sendViaGmail,
  openGoogleDrive,
} from "@/lib/googleSyncService";
import { Project } from "@/types";
import { dbService } from "@/lib/db";
import { toast } from "react-hot-toast";

interface GoogleWorkspaceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: Project | null;
  onAskCopilot: (prompt: string) => void;
}

export const GoogleWorkspaceSyncModal: React.FC<GoogleWorkspaceSyncModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  onAskCopilot,
}) => {
  const [config, setConfig] = useState<GoogleWorkspaceConfig>(getGoogleWorkspaceConfig());
  const [emailInput, setEmailInput] = useState(config.connectedEmail || "");
  const [driveFolderInput, setDriveFolderInput] = useState(config.driveFolderUrl || "");
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  useEffect(() => {
    const loaded = getGoogleWorkspaceConfig();
    setConfig(loaded);
    setEmailInput(loaded.connectedEmail || "");
    setDriveFolderInput(loaded.driveFolderUrl || "");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    const updated: GoogleWorkspaceConfig = {
      ...config,
      connectedEmail: emailInput.trim(),
      driveFolderUrl: driveFolderInput.trim(),
      lastSyncTimestamp: Date.now(),
    };
    saveGoogleWorkspaceConfig(updated);
    setConfig(updated);
    toast.success("Google Workspace settings saved!");
  };

  // Sync NCRs to Google Sheets
  const handleSyncNcrsToSheets = async () => {
    if (!activeProject?.id) {
      toast.error("Please select an active project first.");
      return;
    }

    setIsSyncing("ncrs");
    try {
      const ncrs = await dbService.getNCRs(activeProject.id);
      const headers = [
        "NCR #",
        "Title",
        "Severity",
        "Category",
        "Location",
        "Status",
        "Root Cause",
        "Corrective Action",
        "Date Raised",
      ];
      const rows = ncrs.map((n) => [
        n.ncrNumber || "",
        n.title || "",
        n.severity || "MODERATE",
        n.category || "General",
        n.location || n.locationLevel || "Site",
        n.status || "OPEN",
        n.rootCause || "Under Investigation",
        n.correctiveAction || "Pending Verification",
        new Date(n.createdAt || Date.now()).toLocaleDateString(),
      ]);

      await exportToGoogleSheets({
        title: `${activeProject.name || "Project"}_NCR_Register`,
        headers,
        rows,
      });
      toast.success("Opened in Google Sheets! (Data copied to clipboard & CSV saved)");
    } catch (err: any) {
      toast.error(err?.message || "Failed syncing NCRs to Google Sheets");
    } finally {
      setIsSyncing(null);
    }
  };

  // Sync Daily Logs to Google Sheets
  const handleSyncLogsToSheets = async () => {
    if (!activeProject?.id) {
      toast.error("Please select an active project first.");
      return;
    }

    setIsSyncing("logs");
    try {
      const logs = await dbService.getDailySiteLogs(activeProject.id);
      const headers = [
        "Log #",
        "Date",
        "Weather",
        "Total Manpower",
        "Activities / Work Summary",
        "Delays / Issues",
      ];
      const rows = logs.map((l) => {
        const totalManpower =
          l.manpower?.reduce((acc, m) => acc + (m.headCount || 0), 0) || 0;
        const workSummary =
          l.activities?.map((a) => a.description).filter(Boolean).join("; ") ||
          l.generalConditions?.siteStatusNotes ||
          "Site works";
        const delaySummary =
          l.delays?.map((d) => d.description).filter(Boolean).join("; ") || "None";

        return [
          l.logNumber || "",
          l.generalConditions?.date || new Date(l.createdAt).toLocaleDateString(),
          l.generalConditions?.weather || "Sunny",
          totalManpower,
          workSummary,
          delaySummary,
        ];
      });

      await exportToGoogleSheets({
        title: `${activeProject.name || "Project"}_Daily_Site_Logs`,
        headers,
        rows,
      });
      toast.success("Opened in Google Sheets!");
    } catch (err: any) {
      toast.error(err?.message || "Failed syncing Site Logs");
    } finally {
      setIsSyncing(null);
    }
  };

  // Sync upcoming pour / inspection to Google Calendar
  const handleSyncCalendarPour = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const end = new Date(tomorrow);
    end.setHours(11, 0, 0, 0);

    syncToGoogleCalendar({
      title: `[Jay-QMS] Pre-Pour QA/QC Inspection - ${activeProject?.name || "Active Project"}`,
      description: `Formal Pre-Pour Structural Inspection per BS EN 13670 / ACI 318.\nProject: ${
        activeProject?.name || "Site"
      }\nChecklist: Formwork rigidity, rebar cleanliness, cover spacers, ITP hold-point signoff.`,
      location: activeProject?.name || "Project Site",
      startDateTime: tomorrow,
      endDateTime: end,
    });
    toast.success("Opened Google Calendar event creator!");
  };

  // Export Executive Summary to Google Docs
  const handleExportQualityReportToDocs = async () => {
    setIsSyncing("docs");
    try {
      const pName = activeProject?.name || "Civil Works Site";
      const docContent = `JAY-QMS QUALITY ASSURANCE & AUDIT DOSSIER
Project: ${pName} (${activeProject?.code || "PRJ"})
Generated: ${new Date().toLocaleString()}
Governed Standards: ISO 9001:2015, BS EN 12390, BS 4449, ASTM C39

1. EXECUTIVE QUALITY SUMMARY
All primary structural activities are tracked under active Inspection & Test Plans (ITP). Concrete cube compressive testing and steel tensile verifications comply with approved specifications.

2. HOLD POINT AUDIT SCHEDULE
Pre-pour inspections and reinforcement sign-offs must be approved prior to concrete placement. All non-conformance reports (NCRs) require verified root cause analysis (5-Whys) before structural cover-up.

3. REMEDIAL & CORRECTIVE ACTION DIRECTIVE
Site Instructions (SI) issued through Jay-QMS carry mandatory contractual compliance deadlines.`;

      await exportToGoogleDocs({
        title: `${pName} Quality Dossier`,
        content: docContent,
      });
      toast.success("Opened Google Docs! Content copied to clipboard ready to paste.");
    } catch (err: any) {
      toast.error("Failed opening Google Docs");
    } finally {
      setIsSyncing(null);
    }
  };

  // Open Google Drive
  const handleOpenDrive = () => {
    openGoogleDrive(activeProject?.name, config.driveFolderUrl);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">
                  Google Workspace & Products Sync
                </h3>
                <span className="px-1.5 py-0.2 rounded bg-white/20 text-[9px] font-mono font-bold">
                  DIRECT
                </span>
              </div>
              <p className="text-[11px] text-white/80">
                Sync Copilot & Jay-QMS registers with Google Cloud & Workspace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 scrollbar-thin">
          {/* Google Account / Drive Links */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Google Workspace Connection
              </span>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
              >
                Save Settings
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Google Email / Workspace Account
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="engineer@company.com"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Google Drive Project Folder URL (Optional)
                </label>
                <input
                  type="url"
                  value={driveFolderInput}
                  onChange={(e) => setDriveFolderInput(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Quick 1-Click Sync Actions */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              1-Click Google Products Sync
            </h4>

            {/* Google Calendar */}
            <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-500/40 transition flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    Google Calendar
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Sync inspection dates, pour holds & audit milestones
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSyncCalendarPour}
                className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-600 hover:text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
              >
                <span>Add Event</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Google Sheets - NCRs */}
            <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-500/40 transition flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Table className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    Google Sheets (NCRs)
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Export live Non-Conformance Reports into a spreadsheet
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSyncNcrsToSheets}
                disabled={isSyncing === "ncrs"}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
              >
                <span>Sync Sheets</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Google Sheets - Daily Logs */}
            <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-emerald-500/40 transition flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Table className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    Google Sheets (Site Logs)
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Sync daily weather, manpower & site activity log
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSyncLogsToSheets}
                disabled={isSyncing === "logs"}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
              >
                <span>Sync Sheets</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Google Docs */}
            <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-500/40 transition flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    Google Docs
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Export audit reports & method statements into Google Docs
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportQualityReportToDocs}
                disabled={isSyncing === "docs"}
                className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-600 hover:text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
              >
                <span>Open Docs</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Google Drive */}
            <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-amber-500/40 transition flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    Google Drive
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Access project photo binders & quality archive
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenDrive}
                className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 hover:bg-amber-600 hover:text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
              >
                <span>Open Drive</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Copilot Prompt Commands */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-900/50 space-y-2">
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Ask Copilot to Sync in Natural Language:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Schedule pour inspection on Google Calendar",
                "Sync open NCRs to Google Sheets",
                "Export quality summary to Google Docs",
                "Compose SI notification in Gmail",
              ].map((cmd, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onClose();
                    onAskCopilot(cmd);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-[10px] font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition"
                >
                  "{cmd}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            Jay-QMS Google Workspace Sync
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
