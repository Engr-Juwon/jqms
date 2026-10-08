import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService, sortByNewestFirst } from "@/lib/db";
import { generatePermitToPourPDF } from "@/lib/pdfGenerators";
import { hasPermission } from "@/lib/rbac";
import { PermitToPour } from "@/types";
import {
  HardHat,
  Plus,
  Search,
  FileDown,
  Calendar,
  Layers,
  ChevronRight,
  CheckCircle2,
  Building2,
  Clock,
  ArrowRight,
  FlaskConical,
  Award,
  Scissors,
} from "lucide-react";
import { ModuleTabNav } from "@/components/common/ModuleTabNav";

export const PermitToPourList: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";
  const canCreatePTP = hasPermission(currentUser?.role, "CREATE_PTP");

  const [permits, setPermits] = useState<PermitToPour[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    async function load() {
      if (!currentProjId) return;
      const list = await dbService.getPermitsToPour(
        currentProjId,
        currentCompId,
      );
      setPermits(sortByNewestFirst(list));
    }
    load();
  }, [currentProjId, currentCompId]);

  const filtered = sortByNewestFirst(
    permits
      .filter((p) => {
        return (
          p.ptpNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.elementName &&
            p.elementName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.levelName &&
            p.levelName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.elementRef &&
            p.elementRef.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (p.concreteGrade &&
            p.concreteGrade.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      })
      .filter((p) => statusFilter === "ALL" || p.status === statusFilter),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-mono text-xs uppercase tracking-wider mb-1">
            <HardHat className="w-4 h-4" />
            <span>
              ISO 9001 Clause 8.5.1 Control of Production & Casting Clearances
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Permit to Pour (PTP) Clearances
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            4-party pre-pour hold point sign-offs: Rebar, Formwork, MEP embeds,
            joint cleanliness, and batch plant readiness
          </p>
        </div>

        {canCreatePTP ? (
          <Link
            to="/project/permit-to-pour/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Permit to Pour</span>
          </Link>
        ) : (
          <button
            disabled
            title="You do not have permission to create Permits to Pour"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold cursor-not-allowed opacity-60"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Permit to Pour</span>
          </button>
        )}
      </div>

      {/* Structural Quality & Testing Navigation Tabs */}
      <ModuleTabNav
        items={[
          {
            label: "Concrete Cube Testing",
            path: "/project/concrete",
            icon: FlaskConical,
          },
          {
            label: "Steel Rebar Testing & Mill Certs",
            path: "/project/steel",
            icon: Award,
          },
          {
            label: "Bar Bending Schedule (BBS)",
            path: "/project/bar-cutting",
            icon: Scissors,
          },
          {
            label: "Permit to Pour (PTP)",
            path: "/project/permit-to-pour",
            icon: HardHat,
          },
        ]}
      />

      {/* Search and status filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search PTP #, element, level..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "ISSUED", "APPROVED", "PENDING_APPROVAL", "REJECTED"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition ${
                  statusFilter === status
                    ? "bg-amber-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                }`}
              >
                {status === "ALL" ? "ALL" : status.replace("_", " ")}
              </button>
            ),
          )}
        </div>
      </div>

      {/* PTP cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
          <FileDown className="w-8 h-8 mx-auto text-amber-500 mb-3" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            No permits found
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Try changing the search or status filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((ptp) => {
            const sigCount = ptp.stakeholders?.length
              ? ptp.stakeholders.filter(
                  (stakeholder) => stakeholder.required,
                ).length
              : Object.values(ptp.clearanceSignatures || {}).filter(
                  (signature) => signature?.signed,
                ).length;
            return (
              <div
                key={ptp.id}
                className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      {ptp.ptpNumber}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${ptp.status === "ISSUED" || ptp.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ptp.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                    >
                      {ptp.status}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-600" />
                      {ptp.elementType || "Structural Element"} :{" "}
                      {ptp.elementRef || ptp.elementName || "N/A"}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {ptp.building || "Main Structure"} ·{" "}
                      {ptp.floor || ptp.levelName || "Ground"} (
                      {ptp.zone || "Grid N/A"})
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">
                        Grade
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {ptp.concreteGrade}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">
                        Volume
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {ptp.estimatedVolume ?? ptp.targetVolumeM3} m³
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {ptp.pourDate || ptp.plannedPourDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {ptp.pourTime || ptp.plannedPourTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px]">{sigCount}/4</span>
                    <Link
                      to={`/project/permit-to-pour/${ptp.id}`}
                      className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition"
                      title="View permit details"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Legacy table intentionally replaced by the responsive permit cards above. */}
      {false && (
        <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">PTP Number</th>
                  <th className="py-3 px-4">Location / Element</th>
                  <th className="py-3 px-4">Planned Pour Date & Time</th>
                  <th className="py-3 px-4">Volume (m³)</th>
                  <th className="py-3 px-4">Mix Grade</th>
                  <th className="py-3 px-4">4-Party Signoff</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((ptp) => {
                  const sigCount = [
                    ptp.clearanceSignatures.siteEngineer?.signed,
                    ptp.clearanceSignatures.rebarInspector?.signed,
                    ptp.clearanceSignatures.mepCoordinator?.signed,
                    ptp.clearanceSignatures.qaqcLeadEngineer?.signed,
                  ].filter(Boolean).length;

                  return (
                    <tr
                      key={ptp.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                        <Link
                          to={`/project/${currentProjId}/permit-to-pour/view/${ptp.id}`}
                          className="hover:underline"
                        >
                          {ptp.ptpNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {ptp.elementName}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          {ptp.levelName}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {ptp.plannedPourDate} @ {ptp.plannedPourTime}
                      </td>
                      <td className="py-3 px-4 font-mono text-brand-600 dark:text-brand-300 font-bold">
                        {ptp.targetVolumeM3} m³
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {ptp.concreteGrade}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                          {sigCount}/4 Signed
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ptp.status === "APPROVED"
                              ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30"
                              : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30"
                          }`}
                        >
                          {ptp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() =>
                            generatePermitToPourPDF(
                              ptp,
                              activeProject || {},
                              company || {},
                            )
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Download PTP Certificate"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/project/permit-to-pour/${ptp.id}`}
                          className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 font-semibold"
                        >
                          <span>Clearance</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
