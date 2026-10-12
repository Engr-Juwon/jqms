import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService, sortByNewestFirst } from "@/lib/db";
import { generateStandardNCRPDF } from "@/services/pdf/ncrReport";
import { mapNCRToPDFData } from "@/pages/NCRDetail";
import { NonConformanceReport } from "@/types";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import { toast } from "react-hot-toast";
import {
  AlertOctagon,
  Plus,
  Search,
  Filter,
  FileDown,
  Clock,
  CheckCircle2,
  Trash2,
  FileWarning,
  ShieldAlert,
  MessageSquareWarning,
  ChevronRight,
} from "lucide-react";
import { ModuleTabNav } from "@/components/common/ModuleTabNav";

export const NCRModule: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";
  const canCreateNCR = hasPermission(currentUser?.role, "CREATE_NCR");
  const canIssueSI = hasPermission(currentUser?.role, "ISSUE_SITE_INSTRUCTION");

  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const ncrsRef = React.useRef<NonConformanceReport[]>([]);
  const isInitialLoadRef = React.useRef(true);
  useEffect(() => {
    ncrsRef.current = ncrs;
  }, [ncrs]);

  const loadData = async () => {
    if (!currentProjId) return;
    const list = await dbService.getNCRs(currentProjId, currentCompId);
    setNcrs(sortByNewestFirst(list));
  };

  useEffect(() => {
    if (!currentProjId) return;
    isInitialLoadRef.current = true;
    loadData();

    const unsub = dbService.subscribeNCRs(
      currentProjId,
      (incoming) => {
        if (!incoming) return;

        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          setNcrs(sortByNewestFirst(incoming));
          return;
        }

        const prevList = ncrsRef.current;
        const prevMap = new Map(prevList.map((n) => [n.id, n]));
        const incomingMap = new Map(incoming.map((n) => [n.id, n]));
        const currentUid = currentUser?.uid;

        incoming.forEach((item) => {
          const prev = prevMap.get(item.id);
          if (!prev) {
            if (item.raisedBy?.uid && item.raisedBy.uid !== currentUid) {
              toast.error(`⚠️ New NCR ${item.ncrNumber || "Defect"} raised: ${item.title || ""}`, {
                duration: 5000,
              });
            }
          } else if (prev.status !== item.status) {
            toast(`⚡ NCR ${item.ncrNumber} status changed to ${item.status}`, {
              icon: "📋",
              duration: 4000,
            });
          }
        });

        prevList.forEach((prevItem) => {
          if (!incomingMap.has(prevItem.id)) {
            toast(`NCR ${prevItem.ncrNumber} was removed`, {
              icon: "🗑️",
              duration: 4000,
            });
          }
        });

        setNcrs(sortByNewestFirst(incoming));
      },
      currentCompId,
    );

    return () => unsub();
  }, [currentProjId, currentCompId, currentUser?.uid]);

  const handleDeleteNCR = async (ncr: NonConformanceReport) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete Non-Conformance Report ${ncr.ncrNumber}? This action cannot be undone.`,
    );
    if (!confirmDelete) return;

    await dbService.deleteNCR(ncr.id, currentProjId);

    if (currentUser) {
      await writeAudit({
        projectId: currentProjId,
        companyId: currentCompId,
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "DELETE_NCR",
        module: "NCR",
        details: `Deleted Non-Conformance Report ${ncr.ncrNumber} (${ncr.title})`,
      });
    }

    toast.success(`NCR ${ncr.ncrNumber} deleted`);
    await loadData();
  };

  const totalNcrs = ncrs.length;
  const openCount = ncrs.filter((n) => n.status === "OPEN").length;
  const underReviewCount = ncrs.filter(
    (n) =>
      n.status === "UNDER_REVIEW" ||
      (n.status as any) === "REMEDIATION" ||
      (n.status as any) === "RESOLVED",
  ).length;
  const closedCount = ncrs.filter((n) => n.status === "CLOSED").length;

  const filteredNcrs = sortByNewestFirst(
    ncrs.filter((n) => {
      const matchSearch =
        (n.ncrNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.elementName &&
          n.elementName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (n.elementNames &&
          n.elementNames.some((name) =>
            name.toLowerCase().includes(searchTerm.toLowerCase()),
          )) ||
        (n.trade && n.trade.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (n.tradeName &&
          n.tradeName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === "ALL" || n.status === statusFilter;
      const matchSeverity =
        severityFilter === "ALL" || n.severity === severityFilter;

      return matchSearch && matchStatus && matchSeverity;
    }),
  );

  const handleDownloadPDF = (ncr: NonConformanceReport) => {
    try {
      const pdfData = mapNCRToPDFData(ncr, company, activeProject);
      generateStandardNCRPDF(pdfData);
    } catch (err) {
      console.error("PDF Export error:", err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-mono text-xs uppercase tracking-wider mb-1">
            <AlertOctagon className="w-4 h-4" />
            <span>ISO 9001 Clause 8.7 Nonconforming Outputs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Non-Conformance Reports (NCR)
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Root cause investigation, Corrective & Preventive Action (CAPA), and
            statutory quality close-out
          </p>
        </div>

        {canCreateNCR ? (
          <Link
            to="/project/ncrs/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Raise Official NCR</span>
          </Link>
        ) : (
          <button
            disabled
            title="You do not have permission to create NCRs"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold cursor-not-allowed opacity-60"
          >
            <Plus className="w-4 h-4" />
            <span>Raise Official NCR</span>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
            Total NCRs Issued
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalNcrs}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            Full project register
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-red-600 dark:text-red-400">
            Open / Action Required
          </span>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">
            {openCount}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            Awaiting remedial fix
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400">
            Under CAPA Review
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {underReviewCount}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            Remediation in progress
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400">
            Closed & Verified
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {closedCount}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            100% Verified on site
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search NCR #, title, element, trade..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* NCR Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">NCR Number</th>
                <th className="py-3 px-4">Title & Defect Summary</th>
                <th className="py-3 px-4">Location & Element</th>
                <th className="py-3 px-4">Trade Discipline</th>
                <th className="py-3 px-4">Root Cause</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date Found</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredNcrs.map((ncr) => {
                const raisedDateStr = ncr.dateFound
                  ? new Date(ncr.dateFound).toLocaleDateString("en-GB")
                  : (ncr.raisedBy as any)?.date ||
                    (ncr.createdAt
                      ? new Date(ncr.createdAt).toLocaleDateString("en-GB")
                      : "—");
                const raisedByNameStr =
                  ncr.raisedByName ||
                  (ncr.raisedBy as any)?.name ||
                  ncr.reportedBy ||
                  "QA/QC Team";

                let daysOverdue = 0;
                if (
                  ncr.deadline &&
                  ncr.status !== "CLOSED" &&
                  ncr.status !== "RESOLVED"
                ) {
                  const dl = new Date(ncr.deadline);
                  const td = new Date();
                  td.setHours(0, 0, 0, 0);
                  if (dl < td) {
                    daysOverdue = Math.max(
                      1,
                      Math.floor(
                        (td.getTime() - dl.getTime()) / (1000 * 60 * 60 * 24),
                      ),
                    );
                  }
                }

                return (
                  <tr
                    key={ncr.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                      daysOverdue > 0 ? "bg-red-50/40 dark:bg-red-950/20" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-red-600 dark:text-red-400">
                      <Link
                        to={`/project/ncrs/${ncr.id}`}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        <AlertOctagon className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                        <span>{ncr.ncrNumber || "NCR"}</span>
                      </Link>
                      {daysOverdue > 0 && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-red-100 dark:bg-red-500/30 text-red-700 dark:text-red-400 text-[9px] font-bold border border-red-300 dark:border-red-500/40">
                            <ShieldAlert className="w-2.5 h-2.5" />
                            <span>{daysOverdue}d Overdue</span>
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {ncr.title}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        Raised: {raisedDateStr} by {raisedByNameStr}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <div className="font-medium">
                        {ncr.locationLevel ||
                          ncr.levelName ||
                          ncr.location ||
                          "Site"}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap mt-0.5">
                        {ncr.elementIds && ncr.elementIds.length > 1 ? (
                          <>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {ncr.elementNames?.[0] || ncr.elementName?.split(",")[0]}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950/60 text-[#ea580c] font-bold text-[9px] border border-orange-200 dark:border-orange-800">
                              +{ncr.elementIds.length - 1} more
                            </span>
                          </>
                        ) : (
                          <span>{ncr.elementName || "General Area"}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                      {ncr.trade || ncr.tradeName || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {ncr.rootCauseType === "Drawing Error"
                        ? "Drawing / Design Error"
                        : ncr.rootCauseType || ncr.rootCause || "Workmanship"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          (ncr.priority || ncr.severity) === "CRITICAL"
                            ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30"
                            : (ncr.priority || ncr.severity) === "HIGH"
                              ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30"
                              : "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400"
                        }`}
                      >
                        {ncr.priority || ncr.severity || "MEDIUM"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ncr.status === "CLOSED"
                            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30"
                            : ncr.status === "RESOLVED"
                              ? "bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-500/30"
                              : ncr.status === "UNDER_REVIEW"
                                ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30"
                                : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30"
                        }`}
                      >
                        {(ncr.status || "OPEN").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {ncr.dateFound
                        ? new Date(ncr.dateFound).toLocaleDateString("en-GB")
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {daysOverdue > 0 && (
                        canIssueSI ? (
                          <Link
                            to={
                              projectId
                                ? `/project/${projectId}/site-instructions/create?ncrId=${ncr.id}`
                                : `/project/site-instructions/create?ncrId=${ncr.id}`
                            }
                            className="p-1.5 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 inline-flex items-center gap-1 transition font-semibold text-[11px]"
                            title="Issue Site Instruction Warning"
                          >
                            <FileWarning className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Issue SI</span>
                          </Link>
                        ) : (
                          <span
                            title="Level 4 quality authority required to issue Site Instructions"
                            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-600 inline-flex items-center gap-1 opacity-50 cursor-not-allowed text-[11px]"
                          >
                            <FileWarning className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Issue SI</span>
                          </span>
                        )
                      )}
                      <button
                        onClick={() => handleDownloadPDF(ncr)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Download ISO 9001 NCR Document"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNCR(ncr)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="Delete Non-Conformance Report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link
                        to={
                          projectId
                            ? `/project/${projectId}/ncrs/${ncr.id}`
                            : `/project/ncrs/${ncr.id}`
                        }
                        className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:text-brand-500 font-semibold"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredNcrs.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-slate-400 dark:text-slate-500"
                  >
                    No Non-Conformance Reports match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NCRModule;
