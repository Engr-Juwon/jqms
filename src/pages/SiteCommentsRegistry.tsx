import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService, sortByNewestFirst } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import { generateSiteCommentsPDF } from "@/lib/pdfGenerators";
import { SiteCommentReport, ObservationItem, ProjectLevel, StructuralElement } from "@/types";
import { parseTradeAndSubtrade } from "@/lib/tradeUtils";
import { toast } from "react-hot-toast";
import {
  MessageSquareWarning,
  Plus,
  Search,
  FileDown,
  AlertOctagon,
  Layers,
  MapPin,
  Wrench,
  Tag,
  User,
  ShieldCheck,
  X,
  Maximize2,
  Calendar,
  Edit3,
  FileWarning,
  Filter,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { ModuleTabNav } from "@/components/common/ModuleTabNav";

interface NormalizedPhoto {
  url: string;
  thumbnailUrl?: string;
  caption?: string;
}

export const SiteCommentsRegistry: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";
  const canCreateComment = hasPermission(currentUser?.role, "CREATE_SITE_COMMENT");

  const [reports, setReports] = useState<SiteCommentReport[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "RECTIFIED">("ALL");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("ALL");
  const [selectedElementFilter, setSelectedElementFilter] = useState<string>("ALL");
  const [selectedPhoto, setSelectedPhoto] = useState<NormalizedPhoto | null>(
    null,
  );

  // Expanded report cards state for mobile (defaults to expanded)
  const [collapsedReports, setCollapsedReports] = useState<Record<string, boolean>>({});

  const toggleReportCollapse = (reportId: string) => {
    setCollapsedReports((prev) => ({
      ...prev,
      [reportId]: !prev[reportId],
    }));
  };

  // Real-time live listener for Site Comments
  useEffect(() => {
    if (!currentProjId) return;

    // Load initial cache first for instant UI response
    dbService.getSiteComments(currentProjId, currentCompId).then((cached) => {
      if (cached && cached.length > 0) {
        setReports(sortByNewestFirst(cached));
      }
    });

    const unsubscribe = dbService.subscribeSiteComments(
      currentProjId,
      (liveList) => {
        setReports((prev) => {
          if (prev.length > 0 && liveList.length > prev.length) {
            toast.success("New site observation report synced!", { id: "live-site-obs-sync" });
          }
          return sortByNewestFirst(liveList);
        });
      },
      currentCompId,
    );

    return () => unsubscribe();
  }, [currentProjId, currentCompId]);

  // Helpers to extract fields seamlessly across Firestore and local schemas
  const getObsText = (obs: ObservationItem) =>
    obs.comments ||
    obs.observationText ||
    obs.fieldObservation ||
    "No comment provided";

  const getObsDirective = (obs: ObservationItem) =>
    obs.correctiveDirective || "None specified";

  const getObsAssigned = (obs: ObservationItem) =>
    obs.assignedTo || obs.assignedSubcontractor || "Unassigned";

  const getObsLevel = (obs: ObservationItem) => obs.levelName || "General Site";

  const getObsGrid = (obs: ObservationItem) => obs.gridLocation || "";

  const getObsElement = (obs: ObservationItem) =>
    obs.structuralElement || obs.elementName || "";

  const getObsTrade = (obs: ObservationItem) =>
    obs.trade || obs.tradeName || obs.subtradeName || "General Works";

  const getObsSeverity = (obs: ObservationItem) =>
    (obs.severity || "MEDIUM").toUpperCase();

  const getObsStatus = (obs: ObservationItem) => obs.status || "OPEN";

  const isObsRectified = (obs: ObservationItem) => {
    const s = String(obs.status || "").toLowerCase();
    return (
      s === "rectified" ||
      s === "closed" ||
      s === "compliant" ||
      s === "rectified on site"
    );
  };

  const isObsOpen = (obs: ObservationItem) => !isObsRectified(obs);

  const getObsPhotos = (obs: ObservationItem): NormalizedPhoto[] => {
    if (!obs.photos || !Array.isArray(obs.photos)) return [];
    return obs.photos
      .map((p) => {
        if (typeof p === "string") {
          return { url: p, thumbnailUrl: p, caption: "" };
        }
        return {
          url: p.url || p.thumbnailUrl || "",
          thumbnailUrl: p.thumbnailUrl || p.url || "",
          caption: p.caption || "",
        };
      })
      .filter((p) => Boolean(p.url));
  };

  const getReportTitle = (report: SiteCommentReport) => {
    if (report.title) return report.title;
    if (report.projectName) return `${report.projectName} - Field Observation`;
    return `Observation Report ${report.reportNumber || ""}`;
  };

  const getInspectorName = (report: SiteCommentReport) => {
    if (report.raisedByName) return report.raisedByName;
    if (typeof report.raisedBy === "object" && report.raisedBy?.name)
      return report.raisedBy.name;
    if (report.signOff?.qaEngineerName) return report.signOff.qaEngineerName;
    if (typeof report.raisedBy === "string" && report.raisedBy.length < 30)
      return report.raisedBy;
    return "QA/QC Engineer";
  };

  const getInspectorRole = (report: SiteCommentReport) => {
    if (report.inspectorRole) return report.inspectorRole;
    if (typeof report.raisedBy === "object" && report.raisedBy?.role)
      return report.raisedBy.role;
    return "QA/QC Engineer";
  };

  const totalReports = reports.length;
  const totalObs = reports.reduce(
    (acc, r) => acc + (r.observations?.length || 0),
    0,
  );
  const openObs = reports.reduce(
    (acc, r) => acc + (r.observations?.filter(isObsOpen).length || 0),
    0,
  );
  const rectifiedObs = reports.reduce(
    (acc, r) => acc + (r.observations?.filter(isObsRectified).length || 0),
    0,
  );

  // Derive distinct levels and elements present across current reports for instant filtering
  const availableLevels = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      r.observations?.forEach((o) => {
        const lvl = getObsLevel(o);
        if (lvl && lvl !== "General Site") set.add(lvl);
      });
    });
    return Array.from(set).sort();
  }, [reports]);

  const availableElements = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      r.observations?.forEach((o) => {
        const el = getObsElement(o);
        if (el) set.add(el);
      });
    });
    return Array.from(set).sort();
  }, [reports]);

  const filteredReports = useMemo(() => {
    return sortByNewestFirst(
      reports.filter((r) => {
        const term = searchTerm.toLowerCase().trim();
        const title = getReportTitle(r).toLowerCase();
        const repNum = (r.reportNumber || "").toLowerCase();
        const projName = (r.projectName || "").toLowerCase();
        const locDesc = (r.locationDescription || "").toLowerCase();
        const inspector = getInspectorName(r).toLowerCase();

        const matchesObservations = (r.observations || []).some((o) => {
          const text = getObsText(o).toLowerCase();
          const directive = getObsDirective(o).toLowerCase();
          const assigned = getObsAssigned(o).toLowerCase();
          const element = getObsElement(o).toLowerCase();
          const grid = getObsGrid(o).toLowerCase();
          const parsedTrade = parseTradeAndSubtrade(o);
          const trade = parsedTrade.trade.toLowerCase();
          const subtrade = parsedTrade.subtrade.toLowerCase();
          return (
            text.includes(term) ||
            directive.includes(term) ||
            assigned.includes(term) ||
            element.includes(term) ||
            grid.includes(term) ||
            trade.includes(term) ||
            subtrade.includes(term)
          );
        });

        const matchSearch =
          !term ||
          repNum.includes(term) ||
          title.includes(term) ||
          projName.includes(term) ||
          locDesc.includes(term) ||
          inspector.includes(term) ||
          matchesObservations;

        const matchSeverity =
          severityFilter === "ALL" ||
          (r.observations &&
            r.observations.some((o) => getObsSeverity(o) === severityFilter));

        const matchStatus =
          statusFilter === "ALL" ||
          (statusFilter === "OPEN" &&
            r.observations &&
            r.observations.some(isObsOpen)) ||
          (statusFilter === "RECTIFIED" &&
            r.observations &&
            r.observations.some(isObsRectified));

        const matchLevel =
          selectedLevelFilter === "ALL" ||
          (r.observations &&
            r.observations.some((o) => getObsLevel(o) === selectedLevelFilter));

        const matchElement =
          selectedElementFilter === "ALL" ||
          (r.observations &&
            r.observations.some((o) => getObsElement(o) === selectedElementFilter));

        return matchSearch && matchSeverity && matchStatus && matchLevel && matchElement;
      }),
    );
  }, [reports, searchTerm, severityFilter, statusFilter, selectedLevelFilter, selectedElementFilter]);

  const handleUpdateObservationStatus = async (
    report: SiteCommentReport,
    obsIndex: number,
    newStatus: string,
  ) => {
    const obs = report.observations?.[obsIndex];
    if (!obs) return;
    const oldStatus = getObsStatus(obs);
    if (oldStatus === newStatus) return;

    const isNowRectified =
      newStatus === "RECTIFIED" ||
      newStatus === "Compliant" ||
      newStatus === "Rectified on Site" ||
      newStatus === "CLOSED";

    const updatedObservations = [...(report.observations || [])];
    updatedObservations[obsIndex] = {
      ...obs,
      status: newStatus,
      rectifiedDate: isNowRectified
        ? obs.rectifiedDate || new Date().toISOString().split("T")[0]
        : obs.rectifiedDate,
    };

    const updatedReport: SiteCommentReport = {
      ...report,
      observations: updatedObservations,
      updatedAt: Date.now(),
    };

    // Update state immediately for instant feedback
    setReports((prev) =>
      prev.map((r) => (r.id === report.id ? updatedReport : r)),
    );

    try {
      await dbService.saveSiteComment(updatedReport);

      // Audit log the status update
      await writeAudit({
        companyId: currentCompId,
        projectId: currentProjId,
        userId: currentUser?.uid || "unknown",
        userName: currentUser?.displayName || currentUser?.email || "User",
        userRole: currentUser?.role || "QA/QC Engineer",
        action: "STATUS_CHANGED",
        module: "SiteComments",
        details: `Updated observation #${obsIndex + 1} status on ${report.reportNumber || "Report"} from "${oldStatus}" to "${newStatus}"`,
        previousValue: { observationIndex: obsIndex, status: oldStatus },
        newValue: { observationIndex: obsIndex, status: newStatus },
      });
    } catch (err) {
      console.error("Failed to update site comment observation status:", err);
    }
  };

  const handleEscalateToNcr = (
    report: SiteCommentReport,
    obsIndex: number = 0,
  ) => {
    const obs = report.observations?.[obsIndex];
    if (!obs) return;

    const photos = getObsPhotos(obs).map((p) => p.url);

    navigate("/project/ncrs/create", {
      state: {
        sourceSiteCommentId: report.id,
        prefillTitle: `${getReportTitle(report)} (From ${report.reportNumber})`,
        prefillDescription: `Observation: ${getObsText(obs)}\n\nRequired Directive: ${getObsDirective(obs)}${
          getObsGrid(obs) ? `\nGrid Location: ${getObsGrid(obs)}` : ""
        }`,
        prefillLevelId: obs.levelId || "",
        prefillElementId: obs.elementId || "",
        prefillTradeId: obs.tradeId || "",
        prefillTradeName: getObsTrade(obs),
        prefillSeverity: getObsSeverity(obs),
        prefillPhotos: photos,
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-mono text-xs uppercase tracking-wider mb-1">
            <MessageSquareWarning className="w-4 h-4" />
            <span>Field Auditing & Site Directives</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Site Observations & Comments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Procore-standard field observations, defect markups, subcontractor
            directives, and dual sign-off
          </p>
        </div>

        {canCreateComment ? (
          <Link
            to="/project/site-comments/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Site Observation Report</span>
          </Link>
        ) : (
          <button
            disabled
            title="You do not have permission to log site observations"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold cursor-not-allowed opacity-60"
          >
            <Plus className="w-4 h-4" />
            <span>New Site Observation Report</span>
          </button>
        )}
      </div>

      {/* Module Navigation Tabs */}
      <ModuleTabNav
        items={[
          {
            label: "Non-Conformance Reports (NCR)",
            path: "/project/ncrs",
            icon: AlertOctagon,
          },
          {
            label: "Site Instructions (SI)",
            path: "/project/site-instructions",
            icon: FileWarning,
          },
          {
            label: "Site Observations & Comments",
            path: "/project/site-comments",
            icon: MessageSquareWarning,
          },
        ]}
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
            Total Reports
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalReports}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {totalObs} discrete observations
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-red-600 dark:text-red-400">
            Open Directives
          </span>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">
            {openObs}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            Awaiting rectification
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400">
            Rectified on Site
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {rectifiedObs}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            Verified by inspector
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400">
            Compliance Rate
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {totalObs > 0 ? Math.round((rectifiedObs / totalObs) * 100) : 100}%
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            Field resolution ratio
          </span>
        </div>
      </div>

      {/* Search & Filter Bar with Quick Chips */}
      <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ref, element name, grid location, directive..."
              className="w-full pl-9 pr-9 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Quick Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs shrink-0 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 whitespace-nowrap min-h-[36px] ${
                statusFilter === "ALL"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span>All Statuses</span>
            </button>
            <button
              onClick={() => setStatusFilter("OPEN")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 whitespace-nowrap min-h-[36px] ${
                statusFilter === "OPEN"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Open ({openObs})</span>
            </button>
            <button
              onClick={() => setStatusFilter("RECTIFIED")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 whitespace-nowrap min-h-[36px] ${
                statusFilter === "RECTIFIED"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Rectified ({rectifiedObs})</span>
            </button>
          </div>
        </div>

        {/* Level and Element Dropdowns & Quick Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5 text-brand-500" />
            <span>Filter By:</span>
          </div>

          {/* Level Filter Dropdown */}
          {availableLevels.length > 0 && (
            <div className="relative">
              <select
                value={selectedLevelFilter}
                onChange={(e) => setSelectedLevelFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 transition"
              >
                <option value="ALL">🏢 All Levels ({availableLevels.length})</option>
                {availableLevels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Element Filter Dropdown */}
          {availableElements.length > 0 && (
            <div className="relative">
              <select
                value={selectedElementFilter}
                onChange={(e) => setSelectedElementFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 transition max-w-[200px] truncate"
              >
                <option value="ALL">🧱 All Elements ({availableElements.length})</option>
                {availableElements.map((el) => (
                  <option key={el} value={el}>
                    {el}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Severity Badges */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none ml-auto">
            {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                  severityFilter === sev
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800/60"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {(selectedLevelFilter !== "ALL" || selectedElementFilter !== "ALL" || severityFilter !== "ALL" || statusFilter !== "ALL" || searchTerm) && (
            <button
              onClick={() => {
                setSelectedLevelFilter("ALL");
                setSelectedElementFilter("ALL");
                setSeverityFilter("ALL");
                setStatusFilter("ALL");
                setSearchTerm("");
              }}
              className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline ml-1"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <MessageSquareWarning className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-300">
              No site comments found
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Try changing your search keywords or active filters.
            </p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const reportTitle = getReportTitle(report);
            const inspectorName = getInspectorName(report);
            const inspectorRole = getInspectorRole(report);
            const obsList = report.observations || [];
            const isCollapsed = Boolean(collapsedReports[report.id]);
            const reportOpenCount = obsList.filter(isObsOpen).length;
            const reportRectifiedCount = obsList.filter(isObsRectified).length;

            return (
              <div
                key={report.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm dark:shadow-xl space-y-3 sm:space-y-4 transition"
              >
                {/* Report Header - Optimized for Mobile Tapping */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleReportCollapse(report.id)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                      title={isCollapsed ? "Expand Observations" : "Collapse Observations"}
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </button>

                    <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-200 dark:border-brand-500/20">
                      {report.reportNumber || "QC/COMMENTS"}
                    </span>

                    {report.status === "DRAFT" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                        DRAFT
                      </span>
                    )}

                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {reportTitle}
                    </h3>

                    {/* Quick status counters */}
                    <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                      {reportOpenCount > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40">
                          {reportOpenCount} Open
                        </span>
                      )}
                      {reportRectifiedCount > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                          {reportRectifiedCount} Rectified
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{report.inspectionDate || "N/A"}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/project/site-comments/edit/${report.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition shadow-sm min-h-[34px]"
                        title="Edit Site Observation Report"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                        <span>Edit</span>
                      </Link>
                      <button
                        onClick={() =>
                          generateSiteCommentsPDF(
                            report,
                            activeProject || {},
                            company || {},
                          )
                        }
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition shadow-sm min-h-[34px]"
                        title="Download Publication-Ready PDF Report"
                      >
                        <FileDown className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                        <span className="hidden sm:inline">PDF Report</span>
                        <span className="sm:hidden">PDF</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Observations Table / Cards (Collapsible) */}
                {!isCollapsed && (
                <div className="space-y-3">
                  {obsList.map((obs, idx) => {
                    const photos = getObsPhotos(obs);
                    const obsText = getObsText(obs);
                    const directive = getObsDirective(obs);
                    const assigned = getObsAssigned(obs);
                    const level = getObsLevel(obs);
                    const grid = getObsGrid(obs);
                    const element = getObsElement(obs);
                    const severity = getObsSeverity(obs);
                    const status = getObsStatus(obs);
                    const rectified = isObsRectified(obs);

                    return (
                      <div
                        key={obs.id || idx}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs"
                      >
                        {/* Left: Location & Metadata */}
                        <div className="lg:col-span-3 space-y-2 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 pb-3 lg:pb-0 lg:pr-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 dark:text-slate-300">
                              Observation #{idx + 1}
                            </span>
                            <div className="flex items-center gap-1">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  severity === "CRITICAL"
                                    ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30"
                                    : severity === "HIGH"
                                      ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30"
                                      : "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30"
                                }`}
                              >
                                {severity}
                              </span>
                              <select
                                value={status}
                                onChange={(e) =>
                                  handleUpdateObservationStatus(
                                    report,
                                    idx,
                                    e.target.value,
                                  )
                                }
                                className={`px-2 py-1 rounded-lg text-xs font-bold border cursor-pointer focus:outline-none transition min-h-[32px] ${
                                  rectified
                                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50"
                                    : status === "Non-Compliant"
                                      ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/50"
                                      : status === "Observation / Note"
                                        ? "bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700/50"
                                        : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/50"
                                }`}
                                title="Change Observation Status (Logged to Audit Trail)"
                              >
                                <option
                                  value="OPEN"
                                  className="bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300"
                                >
                                  OPEN
                                </option>
                                <option
                                  value="Non-Compliant"
                                  className="bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300"
                                >
                                  Non-Compliant
                                </option>
                                <option
                                  value="Compliant"
                                  className="bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300"
                                >
                                  Compliant
                                </option>
                                <option
                                  value="Observation / Note"
                                  className="bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300"
                                >
                                  Observation / Note
                                </option>
                                <option
                                  value="Rectified on Site"
                                  className="bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300"
                                >
                                  Rectified on Site
                                </option>
                                <option
                                  value="RECTIFIED"
                                  className="bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300"
                                >
                                  RECTIFIED
                                </option>
                                <option
                                  value="CLOSED"
                                  className="bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400"
                                >
                                  CLOSED
                                </option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1 text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-300 font-medium">
                              <Layers className="w-3 h-3 text-brand-500 dark:text-brand-400 shrink-0" />
                              <span className="truncate">{level}</span>
                              {grid && (
                                <span className="text-[11px] font-mono text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-1 rounded border border-indigo-200 dark:border-transparent">
                                  {grid}
                                </span>
                              )}
                            </div>

                            {element && (
                              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-300">
                                <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                                <span className="font-semibold text-slate-900 dark:text-slate-200">
                                  {element}
                                </span>
                              </div>
                            )}

                            {(() => {
                              const tradeInfo = parseTradeAndSubtrade(obs);
                              return (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="flex items-center gap-1 text-slate-800 dark:text-slate-300">
                                    <Wrench className="w-3 h-3 text-amber-500 dark:text-amber-400 shrink-0" />
                                    <span className="font-semibold">
                                      {tradeInfo.trade}
                                    </span>
                                  </div>
                                  {tradeInfo.subtrade && (
                                    <div className="flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-sans font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
                                      <Tag className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400 shrink-0" />
                                      <span>{tradeInfo.subtrade}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                              <User className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                              <span>
                                Assigned:{" "}
                                <strong className="text-slate-800 dark:text-slate-300">
                                  {assigned}
                                </strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Middle: Observed Condition & Directives */}
                        <div className="lg:col-span-6 space-y-2.5">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 font-bold block text-[10px] uppercase tracking-wider mb-0.5">
                              Observed Site Condition:
                            </span>
                            <p className="text-slate-800 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/60 whitespace-pre-line font-sans">
                              {obsText}
                            </p>
                          </div>

                          <div>
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold block text-[10px] uppercase tracking-wider mb-0.5">
                              Corrective Action Directive:
                            </span>
                            <p className="text-slate-800 dark:text-slate-300 leading-relaxed bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/30 whitespace-pre-line font-sans">
                              {directive}
                            </p>
                          </div>
                        </div>

                        {/* Right: Evidence Photos & Actions */}
                        <div className="lg:col-span-3 flex flex-col justify-between items-start lg:items-end gap-3 pt-2 lg:pt-0">
                          <div className="w-full">
                            <span className="text-slate-500 dark:text-slate-400 font-bold block text-[10px] uppercase tracking-wider mb-1 lg:text-right">
                              Photos ({photos.length})
                            </span>
                            {photos.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                {photos.map((p, pIdx) => (
                                  <div
                                    key={pIdx}
                                    onClick={() => setSelectedPhoto(p)}
                                    className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-brand-500 transition cursor-pointer shadow-sm"
                                  >
                                    <img
                                      src={p.thumbnailUrl || p.url}
                                      alt={
                                        p.caption ||
                                        `Observation ${idx + 1} photo`
                                      }
                                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                      <Maximize2 className="w-3.5 h-3.5 text-white" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 italic block lg:text-right">
                                No photos attached
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleEscalateToNcr(report, idx)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-[11px] font-bold transition shadow-sm mt-2"
                          >
                            <AlertOctagon className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                            <span>Escalate to NCR</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}

                {/* Footer Sign-off Info */}
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800 gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      Originator:{" "}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {inspectorName}
                      </strong>{" "}
                      ({inspectorRole})
                    </span>
                    {report.signOff?.qaSignDate && (
                      <span className="text-slate-400 dark:text-slate-500 font-mono">
                        • QA Signed: {report.signOff.qaSignDate}
                      </span>
                    )}
                  </div>

                  {(report.signOff?.contractorRepName ||
                    report.acknowledgedBy?.name) && (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <span>
                        Acknowledged By:{" "}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {report.signOff?.contractorRepName ||
                            report.acknowledgedBy?.name}
                        </strong>
                        {(report.acknowledgedBy?.subcontractorCompany ||
                          report.companyName) && (
                          <span>
                            {" "}
                            (
                            {report.acknowledgedBy?.subcontractorCompany ||
                              report.companyName}
                            )
                          </span>
                        )}
                      </span>
                      {report.signOff?.contractorSignDate && (
                        <span className="text-slate-400 dark:text-slate-500 font-mono">
                          • Date: {report.signOff.contractorSignDate}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-300">
                Photo Evidence Inspection
              </span>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || "Evidence"}
                className="max-w-full max-h-[75vh] rounded-xl object-contain"
              />
            </div>

            {selectedPhoto.caption && (
              <div className="mt-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-300 text-center">
                {selectedPhoto.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
