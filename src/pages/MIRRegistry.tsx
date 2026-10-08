import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService, sortByNewestFirst } from "@/lib/db";
import { generateMIRPDF } from "@/lib/pdfGenerators";
import { hasPermission } from "@/lib/rbac";
import { MaterialInspectionReport, MaterialDiscipline } from "@/types";
import {
  ClipboardCheck,
  Plus,
  Search,
  FileDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Filter,
  Edit3,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { ModuleTabNav } from "@/components/common/ModuleTabNav";

export const MIRRegistry: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { activeProject } = useProjectStore();
  const { company, currentUser } = useAuthStore();
  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";
  const canCreateMIR = hasPermission(currentUser?.role, "CREATE_MIR");

  const [mirs, setMirs] = useState<MaterialInspectionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    async function load() {
      if (!currentProjId) {
        setMirs([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const list = await dbService.getMIRs(currentProjId, currentCompId);
      setMirs(sortByNewestFirst(list));
      setLoading(false);
    }
    load();
  }, [currentProjId, currentCompId]);

  const getMirLink = (mirId: string, isEdit = false) => {
    const base = projectId
      ? `/project/${projectId}/mir/${mirId}`
      : `/project/mir/${mirId}`;
    return isEdit ? `${base}/edit` : base;
  };

  // KPI Calculations
  const totalCount = mirs.length;
  const acceptedCount = mirs.filter((m) => m.disposition === "ACCEPTED").length;
  const conditionalCount = mirs.filter(
    (m) => m.disposition === "ACCEPTED_AS_NOTED",
  ).length;
  const rejectedCount = mirs.filter((m) => m.disposition === "REJECTED").length;
  const pendingCount = mirs.filter(
    (m) => !m.disposition || m.status === "SUBMITTED" || m.status === "DRAFT",
  ).length;

  const filtered = sortByNewestFirst(
    mirs.filter((m) => {
      const matchSearch =
        (m.mirNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.supplierVendor || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (m.marNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.deliveryNumber || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchDiscipline =
        disciplineFilter === "ALL" || m.discipline === disciplineFilter;
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACCEPTED" && m.disposition === "ACCEPTED") ||
        (statusFilter === "CONDITIONAL" &&
          m.disposition === "ACCEPTED_AS_NOTED") ||
        (statusFilter === "REJECTED" && m.disposition === "REJECTED") ||
        (statusFilter === "PENDING" &&
          (!m.disposition || m.status === "SUBMITTED" || m.status === "DRAFT"));

      return matchSearch && matchDiscipline && matchStatus;
    }),
  );

  const getDispositionBadge = (disp?: string, status?: string) => {
    if (disp === "ACCEPTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3 h-3" />
          <span>ACCEPTED</span>
        </span>
      );
    }
    if (disp === "ACCEPTED_AS_NOTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <CheckCircle2 className="w-3 h-3" />
          <span>ACCEPTED AS NOTED</span>
        </span>
      );
    }
    if (disp === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
          <XCircle className="w-3 h-3" />
          <span>REJECTED</span>
        </span>
      );
    }
    if (disp === "HOLD_FOR_TESTING") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-3 h-3" />
          <span>HOLD FOR LAB</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <Clock className="w-3 h-3 text-slate-400" />
        <span>{status || "AWAITING INSPECTION"}</span>
      </span>
    );
  };

  const disciplines: MaterialDiscipline[] = [
    "Civil & Structural",
    "Architectural",
    "MEP - Electrical",
    "MEP - Mechanical",
    "Plumbing & Drainage",
    "Geotechnical",
    "General",
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sticky Action Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-1 font-bold">
            <ClipboardCheck className="w-4 h-4" />
            <span>ISO 9001:2015 Clause 8.4 • Receiving Inspection</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Material Inspection Reports (MIR)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Physical receiving verification, mill certificates, MAR
            cross-referencing, and consultant disposition stamps
          </p>
        </div>

        <button
          onClick={() => navigate("/project/mir/create")}
          disabled={!canCreateMIR}
          title={
            !canCreateMIR
              ? "Level 2 minimum authority required to raise an MIR"
              : undefined
          }
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Issue New MIR</span>
        </button>
      </div>

      {/* Module Navigation Tabs */}
      <ModuleTabNav
        items={[
          {
            label: "Material Deliveries Log",
            path: "/project/deliveries",
            icon: Truck,
          },
          {
            label: "Material Inspection Reports (MIR)",
            path: "/project/mir",
            icon: ShieldCheck,
          },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-white dark:bg-slate-900 border-brand-500 shadow-md ring-1 ring-brand-500/20"
              : "bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Total MIRs
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {totalCount}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("ACCEPTED")}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === "ACCEPTED"
              ? "bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/20"
              : "bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-emerald-300"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
            Accepted / Code A
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {acceptedCount}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("CONDITIONAL")}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === "CONDITIONAL"
              ? "bg-blue-50/60 dark:bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/20"
              : "bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-blue-300"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block">
            Accepted As Noted
          </span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {conditionalCount}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("REJECTED")}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === "REJECTED"
              ? "bg-red-50/60 dark:bg-red-950/40 border-red-500 shadow-md ring-1 ring-red-500/20"
              : "bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-red-300"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400 block">
            Rejected
          </span>
          <span className="text-2xl font-black text-red-600 dark:text-red-400">
            {rejectedCount}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("PENDING")}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === "PENDING"
              ? "bg-amber-50/60 dark:bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/20"
              : "bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-amber-300"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
            Pending / Awaiting RE
          </span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {pendingCount}
          </span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by MIR #, material description, vendor, MAR ref, or waybill..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">All Disciplines</option>
            {disciplines.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            Loading material inspection registry...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <ClipboardCheck className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">
              No Material Inspection Reports Found
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm ||
              disciplineFilter !== "ALL" ||
              statusFilter !== "ALL"
                ? "Try adjusting your filters or search keywords."
                : "Raise an MIR when materials arrive on site to verify quantities, mill certificates, and obtain consultant approval."}
            </p>
            {canCreateMIR && (
              <button
                onClick={() => navigate("/project/mir/create")}
                className="mt-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-500 transition shadow-sm"
              >
                Create First MIR
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">MIR Reference</th>
                  <th className="py-3 px-4">Material Title & Spec</th>
                  <th className="py-3 px-4">Approved MAR #</th>
                  <th className="py-3 px-4">Discipline</th>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4">Delivery Date</th>
                  <th className="py-3 px-4">Disposition</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((mir) => (
                  <tr
                    key={mir.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-brand-600 dark:text-brand-400">
                        {mir.mirNumber}
                      </div>
                      {mir.deliveryNumber && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          WB: {mir.deliveryNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {mir.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                        {mir.items && mir.items.length > 0
                          ? `${mir.items.length} line item(s) logged`
                          : mir.storageLocation || "General Laydown"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {mir.marNumber ? (
                        <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                          {mir.marNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          Direct Site
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {mir.discipline || "Civil & Structural"}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {mir.supplierVendor || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {mir.deliveryDate || "—"}
                    </td>
                    <td className="py-3 px-4">
                      {getDispositionBadge(mir.disposition, mir.status)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      {mir.status === "DRAFT" && (
                        <Link
                          to={getMirLink(mir.id, true)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 text-[11px] font-bold transition mr-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Continue Draft</span>
                        </Link>
                      )}
                      <button
                        onClick={() =>
                          generateMIRPDF(
                            mir,
                            activeProject || {},
                            company || {},
                          )
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Download Stamped MIR PDF"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                      <Link
                        to={getMirLink(mir.id, false)}
                        className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MIRRegistry;
