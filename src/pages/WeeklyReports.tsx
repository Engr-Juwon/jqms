import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { dbService } from "@/lib/db";
import { hasPermission } from "@/lib/rbac";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { generateWeeklyReportPDF } from "@/lib/pdfGenerators";
import { generateWeeklyPresentationPDF } from "@/services/pdf/newReportGen";
import { generateNewWeeklyPresentationPDF } from "@/services/pdf/weeklyReportGenerator";
import { WeeklyReport } from "@/types";
import {
  FileSpreadsheet,
  Plus,
  FileDown,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Trash2,
  Edit,
  Sparkles,
  Presentation,
  RefreshCw,
  Printer,
  X,
  Check,
  FileText,
  TrendingUp,
} from "lucide-react";
import { ModuleTabNav } from "@/components/common/ModuleTabNav";

export const WeeklyReports: React.FC = () => {
  const { projectId: paramProjId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const { activeProject, projects, setActiveProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentProjId =
    activeProject?.id ||
    paramProjId ||
    localStorage.getItem("jqms_active_project_id") ||
    localStorage.getItem("currentProjectId") ||
    projects[0]?.id ||
    "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";

  // Synchronize active project in store if not currently set
  useEffect(() => {
    if (!activeProject && currentProjId && projects.length > 0) {
      const match = projects.find((p) => p.id === currentProjId);
      if (match) {
        setActiveProject(match);
      }
    }
  }, [activeProject, currentProjId, projects, setActiveProject]);

  const createUrl = paramProjId
    ? `/project/${paramProjId}/weekly-reports/create`
    : "/project/weekly-reports/create";

  const getDetailUrl = (reportId: string) =>
    paramProjId
      ? `/project/${paramProjId}/weekly-reports/${reportId}`
      : `/project/weekly-reports/${reportId}`;

  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportForPrint, setSelectedReportForPrint] =
    useState<WeeklyReport | null>(null);
  const [printOrientation, setPrintOrientation] = useState<
    "portrait" | "landscape"
  >("portrait");
  const [printIncludeNcrs, setPrintIncludeNcrs] = useState(true);
  const [printIncludeComments, setPrintIncludeComments] = useState(true);
  const [printIncludeSIs, setPrintIncludeSIs] = useState(true);

  const loadReports = async () => {
    if (!currentProjId) {
      setReports([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await dbService.getWeeklyReports(
        currentProjId,
        currentCompId,
      );
      setReports(list);
    } catch (err) {
      console.error("Error loading weekly reports:", err);
      toast.error("Failed to load weekly reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [currentProjId, currentCompId]);

  const handleDelete = async (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Are you sure you want to delete this weekly report? This action cannot be undone.",
      )
    ) {
      return;
    }
    try {
      await dbService.deleteWeeklyReport(reportId, currentProjId);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      toast.success("Weekly report deleted successfully");
    } catch (err) {
      console.error("Error deleting report:", err);
      toast.error("Failed to delete report");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>
              Executive Governance & Management Review (ISO 9001:2015 Clause
              9.3)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Weekly Quality Summary Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Consolidated weekly quality metrics, inspection compliance pass
            rates, active NCR tracking, and concrete testing records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadReports}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Refresh list"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin text-orange-500" : ""}
            />
          </button>
          <Link
            to={createUrl}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Compile Weekly Report</span>
          </Link>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <ModuleTabNav
        items={[
          {
            label: "Quality Analytics & KPIs",
            path: "/project/reporting",
            icon: TrendingUp,
          },
          {
            label: "Weekly Quality Reports",
            path: "/project/weekly-reports",
            icon: FileSpreadsheet,
          },
        ]}
      />

      {/* Reports Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
            Loading weekly quality reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-16 text-center rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl">
            <FileSpreadsheet className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-800 dark:text-slate-300 font-bold text-sm">
              No Weekly Quality Reports Compiled
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-md mx-auto">
              Generate executive summary reports with auto-compiled inspection
              pass rates, NCR metrics, cube tests, and material deliveries.
            </p>
            <Link
              to={createUrl}
              className="mt-5 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition inline-flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Compile First Weekly Report</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reports.map((rpt) => (
              <div
                key={rpt.id}
                onClick={() => navigate(getDetailUrl(rpt.id))}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-700 shadow-sm dark:shadow-xl space-y-4 transition cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
                      {rpt.reportNumber}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-orange-600 transition">
                      {rpt.title ||
                        `Weekly Quality Report - ${rpt.selectedLevel || "All Levels"}`}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      ({rpt.weekStart || rpt.startDate} to{" "}
                      {rpt.weekEnd || rpt.endDate})
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        const projectCoverImage =
                          activeProject?.coverImageUrl ||
                          activeProject?.imageUrl ||
                          rpt.coverImageUrl ||
                          rpt.coverImageBase64 ||
                          "";
                        generateWeeklyPresentationPDF({
                          ...rpt,
                          title: rpt.title || "QAQC Weekly Report",
                          projectName:
                            activeProject?.name ||
                            rpt.projectName ||
                            "Site Operations",
                          companyName:
                            company?.name ||
                            (company as any)?.companyName ||
                            "COLLECTION DEVELOPMENTS LTD",
                          logoBase64: company?.logoUrl || rpt.logoBase64 || "",
                          coverImageUrl: projectCoverImage,
                          projectCoverImageUrl: projectCoverImage,
                          coverImageBase64: projectCoverImage,
                          includeNcrsAndComments:
                            rpt.includeNcrsAndComments !== false,
                          includeSiteInstructions:
                            rpt.includeSiteInstructions !== false,
                          siteInstructions:
                            rpt.siteInstructions ||
                            rpt.filteredSiteInstructions ||
                            [],
                          preparedBy:
                            typeof rpt.preparedBy === "object"
                              ? {
                                  name:
                                    rpt.preparedBy?.name ||
                                    currentUser?.displayName ||
                                    "QA/QC Engineer",
                                  email:
                                    rpt.preparedBy?.email ||
                                    currentUser?.email ||
                                    "",
                                  designation:
                                    rpt.preparedBy?.designation ||
                                    rpt.preparedBy?.role ||
                                    "QA/QC Engineer",
                                  role:
                                    rpt.preparedBy?.role || "QA/QC Engineer",
                                  signed: (rpt.preparedBy as any)?.signed,
                                  signatureUrl: (rpt.preparedBy as any)
                                    ?.signatureUrl,
                                  signedAt: (rpt.preparedBy as any)?.signedAt,
                                }
                              : {
                                  name: String(
                                    rpt.preparedBy ||
                                      currentUser?.displayName ||
                                      "QA/QC Engineer",
                                  ),
                                  email: currentUser?.email || "",
                                },
                        } as any);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow"
                      title="Export Presentation Deck"
                    >
                      <Presentation className="w-3.5 h-3.5 text-orange-400" />
                      <span>Slide Deck</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedReportForPrint(rpt);
                        setPrintOrientation(rpt.printOrientation || "portrait");
                        setPrintIncludeNcrs(
                          rpt.includeNcrsAndComments !== false,
                        );
                        setPrintIncludeSIs(
                          rpt.includeSiteInstructions !== false,
                        );
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow"
                      title="Print or Export PDF (Choose Portrait / Landscape & Scope)"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print / PDF</span>
                    </button>

                    <Link
                      to={getDetailUrl(rpt.id)}
                      className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Edit & Review Report"
                    >
                      <Edit size={16} />
                    </Link>

                    <button
                      onClick={(e) => handleDelete(e, rpt.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Delete Report"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {rpt.executiveSummary && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {rpt.executiveSummary}
                  </p>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Inspections Conducted
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-200">
                      {rpt.metrics?.inspectionsConducted ||
                        rpt.inspectionStats?.total ||
                        0}{" "}
                      (
                      {rpt.metrics?.inspectionPassRate ??
                        rpt.overallQualityCompliance ??
                        100}
                      % Pass)
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Active NCRs
                    </span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      {rpt.ncrStats?.openTotal ?? rpt.metrics?.openNcrs ?? 0}{" "}
                      Open
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Cube Compliance
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {rpt.metrics?.cubeTestComplianceRate ??
                        rpt.overallQualityCompliance ??
                        100}
                      %
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      Scope Volume
                    </span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      {rpt.totalVolumeCalculated ||
                        rpt.metrics?.totalConcretePouredM3 ||
                        0}{" "}
                      CUM
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* PRINT & EXPORT CONFIGURATION MODAL */}
      {/* ========================================== */}
      {selectedReportForPrint && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                  <Printer size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Print & PDF Configuration
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedReportForPrint.reportNumber || "Weekly Report"} •{" "}
                    {selectedReportForPrint.projectName || "Project"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReportForPrint(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Orientation selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  1. Print Orientation
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPrintOrientation("portrait")}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      printOrientation === "portrait"
                        ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-slate-900 dark:text-white ring-2 ring-orange-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-6 h-8 border-2 border-current rounded-sm flex items-center justify-center text-[9px] font-bold">
                        A4
                      </div>
                      {printOrientation === "portrait" && (
                        <Check size={16} className="text-orange-600" />
                      )}
                    </div>
                    <p className="font-bold text-xs">Portrait</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Standard vertical dossier binder format
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintOrientation("landscape")}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      printOrientation === "landscape"
                        ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-slate-900 dark:text-white ring-2 ring-orange-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-6 border-2 border-current rounded-sm flex items-center justify-center text-[9px] font-bold">
                        A4
                      </div>
                      {printOrientation === "landscape" && (
                        <Check size={16} className="text-orange-600" />
                      )}
                    </div>
                    <p className="font-bold text-xs">Landscape</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Wide presentation & engineering drawing layout
                    </p>
                  </button>
                </div>
              </div>

              {/* Quality Surveillance Scope */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    2. Quality Surveillance Scope
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Choose preset or customize below
                  </span>
                </div>

                {/* Presets */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPrintIncludeNcrs(true);
                      setPrintIncludeComments(true);
                      setPrintIncludeSIs(true);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      printIncludeNcrs &&
                      printIncludeComments &&
                      printIncludeSIs
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-900 dark:text-white"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <p className="font-bold text-xs">
                      Option 1: Complete Audit
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Show NCRs, Comments & SIs
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPrintIncludeNcrs(false);
                      setPrintIncludeComments(false);
                      setPrintIncludeSIs(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      !printIncludeNcrs &&
                      !printIncludeComments &&
                      !printIncludeSIs
                        ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 text-slate-900 dark:text-white"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <p className="font-bold text-xs">
                      Option 2: Executive Clean
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      No NCRs, Comments or SIs
                    </p>
                  </button>
                </div>

                {/* Granular Individual Checkboxes */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Granular Scope Controls
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={printIncludeNcrs}
                      onChange={(e) => setPrintIncludeNcrs(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Include Non-Conformance Reports (NCRs)
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        Defect logs, root causes & remediation status
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={printIncludeComments}
                      onChange={(e) =>
                        setPrintIncludeComments(e.target.checked)
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Include Site Surveillance Comments
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        Inspector observations and compliance field notes
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={printIncludeSIs}
                      onChange={(e) => setPrintIncludeSIs(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Include Site Instructions (SIs)
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        Contractual directives & mandatory corrective orders
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedReportForPrint(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              {printOrientation === "landscape" && selectedReportForPrint && (
                <button
                  type="button"
                  onClick={() => {
                    const rpt = selectedReportForPrint;
                    const projectCoverImage =
                      activeProject?.coverImageUrl ||
                      activeProject?.imageUrl ||
                      rpt.coverImageUrl ||
                      rpt.coverImageBase64 ||
                      "";
                    generateWeeklyPresentationPDF({
                      ...rpt,
                      title: rpt.title || "QAQC Weekly Report",
                      projectName:
                        activeProject?.name ||
                        rpt.projectName ||
                        "Site Operations",
                      companyName:
                        company?.name ||
                        (company as any)?.companyName ||
                        "COLLECTION DEVELOPMENTS LTD",
                      logoBase64: company?.logoUrl || rpt.logoBase64 || "",
                      coverImageUrl: projectCoverImage,
                      projectCoverImageUrl: projectCoverImage,
                      coverImageBase64: projectCoverImage,
                      includeNcrsAndComments:
                        printIncludeNcrs && printIncludeComments,
                      includeNcrs: printIncludeNcrs,
                      includeSiteComments: printIncludeComments,
                      includeSiteInstructions: printIncludeSIs,
                      siteInstructions:
                        rpt.siteInstructions ||
                        rpt.filteredSiteInstructions ||
                        [],
                      preparedBy:
                        typeof rpt.preparedBy === "object"
                          ? {
                              name:
                                rpt.preparedBy?.name ||
                                currentUser?.displayName ||
                                "QA/QC Engineer",
                              email:
                                rpt.preparedBy?.email ||
                                currentUser?.email ||
                                "",
                              designation:
                                rpt.preparedBy?.designation ||
                                rpt.preparedBy?.role ||
                                "QA/QC Engineer",
                              role: rpt.preparedBy?.role || "QA/QC Engineer",
                              signed: (rpt.preparedBy as any)?.signed,
                              signatureUrl: (rpt.preparedBy as any)
                                ?.signatureUrl,
                              signedAt: (rpt.preparedBy as any)?.signedAt,
                            }
                          : {
                              name: String(
                                rpt.preparedBy ||
                                  currentUser?.displayName ||
                                  "QA/QC Engineer",
                              ),
                              email: currentUser?.email || "",
                            },
                    } as any);
                    setSelectedReportForPrint(null);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
                  title="Generate high-resolution landscape presentation PDF deck"
                >
                  <FileText size={14} className="text-orange-400" />
                  <span>Download Slide Deck (PDF)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  generateWeeklyReportPDF(
                    selectedReportForPrint,
                    activeProject || {},
                    company || {},
                    {
                      orientation: printOrientation,
                      includeNcrsAndComments:
                        printIncludeNcrs && printIncludeComments,
                      includeNcrs: printIncludeNcrs,
                      includeSiteComments: printIncludeComments,
                      includeSiteInstructions: printIncludeSIs,
                      revisionNumber:
                        selectedReportForPrint.revisionNumber ||
                        (selectedReportForPrint as any).revision,
                    },
                  );
                  setSelectedReportForPrint(null);
                }}
                className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
              >
                <Printer size={14} />
                <span>Open Print Window</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyReports;
