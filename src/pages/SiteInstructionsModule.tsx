import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService, sortByNewestFirst } from "@/lib/db";
import { generateSiteInstructionPDF } from "@/lib/pdfGenerators";
import { SiteInstruction, NonConformanceReport } from "@/types";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  FileDown,
  Clock,
  CheckCircle2,
  Calendar,
  AlertOctagon,
  ChevronRight,
  Trash2,
  FileWarning,
  ShieldAlert,
  Flame,
  UserCheck,
  Building2,
  Layers,
  ArrowRight,
} from "lucide-react";

export const SiteInstructionsModule: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";
  const canCreateSI = hasPermission(currentUser?.role, "CREATE_SITE_INSTRUCTION");

  const [instructions, setInstructions] = useState<SiteInstruction[]>([]);
  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const loadData = async () => {
    if (!currentProjId) return;
    setLoading(true);
    try {
      const [siList, ncrList] = await Promise.all([
        dbService.getSiteInstructions(currentProjId, currentCompId),
        dbService.getNCRs(currentProjId, currentCompId),
      ]);
      setInstructions(sortByNewestFirst(siList));
      setNcrs(sortByNewestFirst(ncrList));
    } catch (e) {
      console.error("Error loading site instructions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentProjId, currentCompId]);

  // Compute overdue NCRs that might need a Site Instruction warning
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueNcrs = ncrs.filter((ncr) => {
    if (ncr.status === "CLOSED" || ncr.status === "RESOLVED") return false;
    if (!ncr.deadline) return false;
    const deadlineDate = new Date(ncr.deadline);
    return deadlineDate < today;
  });

  const handleDelete = async (si: SiteInstruction) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete Site Instruction ${si.instructionNumber}? This action cannot be undone.`,
    );
    if (!confirmDelete) return;

    await dbService.deleteSiteInstruction(si.id, currentProjId);

    if (currentUser) {
      await writeAudit({
        projectId: currentProjId,
        companyId: currentCompId,
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "DELETE_SITE_INSTRUCTION",
        module: "SITE_INSTRUCTION",
        details: `Deleted Site Instruction ${si.instructionNumber} (${si.title})`,
      });
    }

    toast.success(`Site Instruction ${si.instructionNumber} deleted`);
    await loadData();
  };

  const handleDownloadPDF = (si: SiteInstruction) => {
    try {
      generateSiteInstructionPDF(si, activeProject || undefined, company || undefined);
    } catch (err) {
      console.error("PDF Export error:", err);
      toast.error("Failed to generate PDF document");
    }
  };

  // KPIs
  const totalInstructions = instructions.length;
  const overdueWarningsCount = instructions.filter(
    (si) => si.type === "OVERDUE_NCR_WARNING" || si.ncrDaysOverdue,
  ).length;
  const stopWorkCount = instructions.filter(
    (si) => si.severity === "STOP_WORK" || si.stopWorkOrdered,
  ).length;
  const compliedCount = instructions.filter(
    (si) => si.status === "COMPLIED",
  ).length;
  const activeDirectivesCount = instructions.filter(
    (si) => si.status === "ISSUED" || si.status === "ACKNOWLEDGED",
  ).length;

  const filteredInstructions = sortByNewestFirst(
    instructions.filter((si) => {
      const matchSearch =
        (si.instructionNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (si.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (si.subject || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (si.ncrNumber && si.ncrNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (si.contractorName &&
          si.contractorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (si.tradeName &&
          si.tradeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (si.location && si.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (si.elementName &&
          si.elementName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === "ALL" || si.status === statusFilter;
      const matchSeverity =
        severityFilter === "ALL" || si.severity === severityFilter;
      const matchType =
        typeFilter === "ALL" ||
        (typeFilter === "OVERDUE_NCR" && (si.type === "OVERDUE_NCR_WARNING" || si.ncrId)) ||
        si.type === typeFilter;

      return matchSearch && matchStatus && matchSeverity && matchType;
    }),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-mono text-xs uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>ISO 9001 Clause 8.7 & 10.2 Statutory Directives</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Site Instructions & Quality Directives
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Contractual notices, overdue NCR rectifications, and unilateral single-authority quality orders
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canCreateSI ? (
            <Link
              to={currentProjId ? `/project/${currentProjId}/site-instructions/create` : `/project/site-instructions/create`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Site Instruction</span>
            </Link>
          ) : (
            <button
              disabled
              title="Level 4 authority required to issue Site Instructions"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold cursor-not-allowed opacity-60"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Site Instruction</span>
            </button>
          )}
        </div>
      </div>

      {/* Overdue NCRs Immediate Alert Banner */}
      {overdueNcrs.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-red-900/60 to-slate-900 border border-red-800/80 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-600/30 text-red-400 border border-red-500/40 shrink-0 mt-0.5">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-red-500/30 border border-red-500/50 text-red-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Quality Warning
                </span>
                <span className="text-xs font-mono text-red-200">
                  {overdueNcrs.length} Non-Conformance Report{overdueNcrs.length > 1 ? "s" : ""} Overdue
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-1">
                NCR Rectification Deadlines Have Exceeded Allotted Time
              </h3>
              <p className="text-xs text-red-200/80 mt-0.5 max-w-2xl">
                Statutory quality guidelines require issuing formal Site Instructions to main contractors for overdue open non-conformances.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canCreateSI ? (
              <Link
                to={
                  currentProjId
                    ? `/project/${currentProjId}/site-instructions/create?ncrId=${overdueNcrs[0].id}`
                    : `/project/site-instructions/create?ncrId=${overdueNcrs[0].id}`
                }
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition flex items-center gap-1.5"
              >
                <span>Issue Warning for {overdueNcrs[0].ncrNumber || "NCR"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                disabled
                title="Level 4 quality authority required to issue Site Instructions"
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold cursor-not-allowed opacity-60 flex items-center gap-1.5"
              >
                <span>Issue Warning for {overdueNcrs[0].ncrNumber || "NCR"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
            Total Instructions Issued
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalInstructions}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            Official project register
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-orange-600 dark:text-orange-400">
            Overdue NCR Warnings
          </span>
          <div className="text-2xl font-black text-orange-600 dark:text-orange-400">
            {overdueWarningsCount}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            Linked to expired NCRs
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-red-600 dark:text-red-400">
            Work Stoppage Orders
          </span>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">
            {stopWorkCount}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            Immediate hold on site
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400">
            Complied & Closed
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {compliedCount}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            Remedial actions verified
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
            placeholder="Search SI #, title, NCR #, contractor, trade..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Directive Types</option>
            <option value="OVERDUE_NCR">Overdue NCR Warnings</option>
            <option value="QUALITY_DIRECTIVE">Quality Directives</option>
            <option value="DEFECT_RECTIFICATION">Defect Rectification</option>
            <option value="WORK_STOPPAGE">Work Stoppage Orders</option>
            <option value="TESTING_ORDER">Testing Orders</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ISSUED">ISSUED</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="COMPLIED">COMPLIED</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
          >
            <option value="ALL">All Severities</option>
            <option value="STOP_WORK">STOP WORK</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Site Instructions Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Instruction #</th>
                <th className="py-3 px-4">Subject & Directive</th>
                <th className="py-3 px-4">Linked NCR Reference</th>
                <th className="py-3 px-4">Recipient / Trade</th>
                <th className="py-3 px-4">Location & Element</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Compliance Due</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredInstructions.map((si) => {
                const issueDateStr = si.signedBy?.signedAt
                  ? new Date(si.signedBy.signedAt).toLocaleDateString("en-GB")
                  : si.createdAt
                    ? new Date(si.createdAt).toLocaleDateString("en-GB")
                    : "—";

                const complianceDateStr = si.complianceDeadline
                  ? new Date(si.complianceDeadline).toLocaleDateString("en-GB")
                  : "—";

                const isStopWork = si.severity === "STOP_WORK" || si.stopWorkOrdered;

                return (
                  <tr
                    key={si.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                      <Link
                        to={
                          currentProjId
                            ? `/project/${currentProjId}/site-instructions/${si.id}`
                            : `/project/site-instructions/${si.id}`
                        }
                        className="hover:underline flex items-center gap-1.5"
                      >
                        <FileWarning className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                        <span>{si.instructionNumber || "SI"}</span>
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {si.subject || si.title}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        Issued: {issueDateStr} by {si.signedBy?.name || "Quality Authority"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {si.ncrNumber || si.ncrId ? (
                        <div className="space-y-0.5">
                          <Link
                            to={
                              currentProjId
                                ? `/project/${currentProjId}/ncrs/${si.ncrId}`
                                : `/project/ncrs/${si.ncrId}`
                            }
                            className="font-mono font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                          >
                            <AlertOctagon className="w-3 h-3 shrink-0" />
                            <span>{si.ncrNumber || "NCR"}</span>
                          </Link>
                          {si.ncrDaysOverdue && (
                            <span className="px-1.5 py-0.2 rounded bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-[9px] font-bold border border-red-300 dark:border-red-500/30">
                              {si.ncrDaysOverdue}d overdue
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <div className="font-medium">
                        {si.contractorName || activeProject?.contractorName || "Main Contractor"}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        {si.tradeName || "General Civil"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <div className="font-medium">
                        {si.location || si.levelName || "Site"}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        {si.elementName || "—"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isStopWork
                            ? "bg-red-600 text-white animate-pulse"
                            : si.severity === "CRITICAL"
                              ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30"
                              : si.severity === "HIGH"
                                ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30"
                                : "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400"
                        }`}
                      >
                        {isStopWork ? "STOP WORK" : si.severity || "MEDIUM"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          si.status === "COMPLIED"
                            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30"
                            : si.status === "ACKNOWLEDGED"
                              ? "bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-500/30"
                              : si.status === "DRAFT"
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                : "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-500/30"
                        }`}
                      >
                        {si.status || "ISSUED"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 font-semibold">
                      {complianceDateStr}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleDownloadPDF(si)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Download Official Site Instruction PDF"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(si)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="Delete Site Instruction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link
                        to={
                          currentProjId
                            ? `/project/${currentProjId}/site-instructions/${si.id}`
                            : `/project/site-instructions/${si.id}`
                        }
                        className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:text-orange-500 font-semibold"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredInstructions.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-slate-400 dark:text-slate-500"
                  >
                    No Site Instructions found matching your filter criteria.
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

export default SiteInstructionsModule;
