import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService, sortByNewestFirst } from "@/lib/db";
import { generateMARPDF } from "@/lib/pdfGenerators";
import { hasPermission } from "@/lib/rbac";
import { MaterialApprovalRequest } from "@/types";
import {
  FileCheck2,
  Plus,
  Search,
  FileDown,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

export const MARRegistry: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject } = useProjectStore();
  const { company, currentUser } = useAuthStore();
  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";
  const canCreateMAR = hasPermission(currentUser?.role, "CREATE_MAR");

  const [mars, setMars] = useState<MaterialApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    async function load() {
      if (!currentProjId) {
        setMars([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const list = await dbService.getMARs(currentProjId, currentCompId);
      setMars(sortByNewestFirst(list));
      setLoading(false);
    }
    load();
  }, [currentProjId, currentCompId]);

  const filtered = sortByNewestFirst(
    mars.filter((m) => {
      const matchSearch =
        (m.marNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.supplierVendor || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchCat =
        categoryFilter === "ALL" || m.category === categoryFilter;
      return matchSearch && matchCat;
    }),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-1">
            <FileCheck2 className="w-4 h-4" />
            <span>
              Submittals & Material Approval Requests (ISO 9001:2015 Clause 8.4)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Material Approvals & Submittals (MAR)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Technical data sheets, mill test certificates, sample approvals, and
            Code A/B/C/D review stamps
          </p>
        </div>

        {canCreateMAR ? (
          <Link
            to="/project/mar/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Submittal / MAR</span>
          </Link>
        ) : (
          <button
            disabled
            title="You do not have permission to submit MAR requests"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold cursor-not-allowed opacity-60"
          >
            <Plus className="w-4 h-4" />
            <span>New Submittal / MAR</span>
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search MAR #, material, supplier..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
        >
          <option value="ALL">All Submittal Categories</option>
          <option value="Technical Data Sheet">
            Technical Data Sheet (TDS)
          </option>
          <option value="Mill Certificate">Mill Test Certificate</option>
          <option value="Material Sample">Material Physical Sample</option>
          <option value="Method Statement">Method Statement</option>
          <option value="Shop Drawing">Shop Drawing</option>
        </select>
      </div>

      {/* Submittals Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
            Loading submittal records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">
              No Material Submittals Found
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              There are currently no Material Approval Requests logged for this
              project and company workspace.
            </p>
            {canCreateMAR ? (
              <Link
                to="/project/mar/create"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Submittal</span>
              </Link>
            ) : (
              <button
                disabled
                title="You do not have permission to submit MAR requests"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold cursor-not-allowed opacity-60"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Submittal</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">MAR Number</th>
                  <th className="py-3 px-4">Material / Item Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Discipline</th>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4">Review Stamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {filtered.map((mar) => (
                  <tr
                    key={mar.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                      <Link
                        to={`/project/mar/${mar.id}`}
                        className="hover:underline"
                      >
                        {mar.marNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-200 line-clamp-1">
                        {mar.title}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        {mar.specSection}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                      {mar.category}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {mar.tradeName}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {mar.supplierVendor}
                    </td>
                    <td className="py-3 px-4">
                      {mar.reviewCode ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            mar.reviewCode === "Code A"
                              ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
                              : mar.reviewCode === "Code B"
                                ? "bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30"
                                : mar.reviewCode === "Code C"
                                  ? "bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30"
                                  : "bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30"
                          }`}
                        >
                          {mar.reviewCode}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                          Under Review
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() =>
                          generateMARPDF(
                            mar,
                            activeProject || {},
                            company || {},
                          )
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Download Stamped MAR PDF"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/project/mar/${mar.id}`}
                        className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold"
                      >
                        <span>Review</span>
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
