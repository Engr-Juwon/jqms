import React, { useState, useMemo } from "react";
import {
  Layers,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  ClipboardCheck,
  AlertTriangle,
  Camera,
  ExternalLink,
  Eye,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { StructuralElement, ElementStatus } from "@/types";
import {
  getOrCalculateVolume,
  getOrCalculateFormworkArea,
} from "@/lib/elementCalculations";

const ITEMS_PER_PAGE = 15;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  REBAR_IN_PROGRESS: "Rebar in progress",
  FORMWORK_IN_PROGRESS: "Form-work in progress",
  READY_FOR_CASTING: "Ready for casting",
  REBAR_INSPECTED: "Rebar inspected",
  POURED: "Poured",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const StatusBadge: React.FC<{ status: StructuralElement["status"] }> = ({
  status,
}) => {
  const configurations: Record<string, string> = {
    PENDING: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    REBAR_IN_PROGRESS: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border-indigo-800",
    FORMWORK_IN_PROGRESS: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800",
    READY_FOR_CASTING: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-yellow-950/60 dark:text-yellow-400 dark:border-yellow-800",
    REBAR_INSPECTED: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800",
    POURED: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800",
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap border ${configurations[status] || "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300"}`}
    >
      {STATUS_LABELS[status] || status?.replace("_", " ")}
    </span>
  );
};

const ActionMenu: React.FC<{
  el: StructuralElement;
}> = ({ el }) => {
  const navigate = useNavigate();
  const { activeProject } = useProjectStore();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() =>
          navigate(
            `/project/inspections/create?elementId=${el.id}&elementName=${encodeURIComponent(el.elementName)}&locationLevel=${encodeURIComponent(el.levelName || "")}&gridLine=${encodeURIComponent(el.grid || el.gridAxis || "")}`
          )
        }
        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition"
        title="New Inspection"
      >
        <ClipboardCheck size={15} />
      </button>
      <button
        onClick={() =>
          navigate(
            `/project/site-comments/create?elementId=${el.id}&elementName=${encodeURIComponent(el.elementName)}&locationLevel=${encodeURIComponent(el.levelName || "")}&gridLine=${encodeURIComponent(el.grid || el.gridAxis || "")}`
          )
        }
        className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded-lg transition"
        title="Add Site Observation / Snag"
      >
        <Camera size={15} />
      </button>
      <button
        onClick={() =>
          navigate(
            `/project/ncrs/create?elementId=${el.id}&elementName=${encodeURIComponent(el.elementName)}&locationLevel=${encodeURIComponent(el.levelName || "")}&gridLine=${encodeURIComponent(el.grid || el.gridAxis || "")}`
          )
        }
        className="p-1.5 text-rose-600 dark:text-red-400 hover:bg-rose-50 dark:hover:bg-red-950/60 rounded-lg transition"
        title="Raise NCR"
      >
        <AlertTriangle size={15} />
      </button>
    </div>
  );
};

export interface ElementTableProps {
  elements: StructuralElement[];
  loading?: boolean;
  canUpdateUser?: boolean;
  onViewDetail?: (el: StructuralElement) => void;
  statusOptions?: ElementStatus[];
  onStatusChange?: (id: string, status: ElementStatus) => void;
  onEdit?: (el: StructuralElement) => void;
  onDelete?: (id: string, name: string) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export const ElementTable: React.FC<ElementTableProps> = ({
  elements = [],
  loading = false,
  canUpdateUser = true,
  onViewDetail,
  statusOptions = [
    "PENDING",
    "REBAR_IN_PROGRESS",
    "FORMWORK_IN_PROGRESS",
    "READY_FOR_CASTING",
    "REBAR_INSPECTED",
    "POURED",
    "APPROVED",
    "REJECTED",
  ],
  onStatusChange,
  onEdit,
  onDelete,
  selectedIds = new Set(),
  onToggleSelect,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(elements.length / ITEMS_PER_PAGE));
  const activePage = currentPage > totalPages ? totalPages : currentPage;

  /* ─── Volumetric & Formwork Aggregations ─── */
  const statisticsSummary = useMemo(() => {
    const globalTotalVolume = elements.reduce(
      (acc, curr) => acc + getOrCalculateVolume(curr),
      0,
    );
    const globalTotalFormwork = elements.reduce(
      (acc, curr) => acc + getOrCalculateFormworkArea(curr),
      0,
    );

    const pageStartIndex = (activePage - 1) * ITEMS_PER_PAGE;
    const pageSliceElements = elements.slice(
      pageStartIndex,
      pageStartIndex + ITEMS_PER_PAGE,
    );

    const visiblePageVolume = pageSliceElements.reduce(
      (acc, curr) => acc + getOrCalculateVolume(curr),
      0,
    );
    const visiblePageFormwork = pageSliceElements.reduce(
      (acc, curr) => acc + getOrCalculateFormworkArea(curr),
      0,
    );

    return {
      globalTotalVolume,
      globalTotalFormwork,
      visiblePageVolume,
      visiblePageFormwork,
      pageSliceElements,
    };
  }, [elements, activePage]);

  const renderDimensions = (el: StructuralElement) => {
    const l = el.length && el.length > 50 ? (el.length / 1000).toFixed(2) : (el.length || el.dimensions?.length || 0);
    const w = el.width && el.width > 50 ? (el.width / 1000).toFixed(2) : (el.width || el.dimensions?.width || 0);
    const h = el.height && el.height > 50 ? (el.height / 1000).toFixed(2) : (el.height || el.dimensions?.height || 0);
    const t = el.thickness && el.thickness > 50 ? (el.thickness / 1000).toFixed(2) : (el.thickness || 0);
    const dia = el.diameter && el.diameter > 50 ? (el.diameter / 1000).toFixed(2) : (el.diameter || 0);

    const dim = el.dimensions;
    const type = (el.elementType || "").toUpperCase();

    // Stair
    if (type.includes("STAIR")) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-300 bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded-lg">
          L {l}m × W {w}m × H {h}m
        </span>
      );
    }

    // Wall
    if (type.includes("WALL")) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-300 bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded-lg">
          L {l}m × H {h}m × T {t || w}m
        </span>
      );
    }

    // Column (Circular)
    if (el.columnShape === "circular" || type.includes("CIRCULAR")) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/40 px-2 py-0.5 rounded-lg">
          Ø {dia}m × H {h}m
        </span>
      );
    }

    // Column (Rectangular) / Slab / Beam
    if (l || w || h) {
      return (
        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-lg">
          {l}m × {w}m × {h}m
        </span>
      );
    }

    return (
      <span className="text-slate-400 dark:text-slate-500 text-[11px] italic">
        No dimensions parsed
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* ─── DESKTOP TABLE ─── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                {onToggleSelect && <th className="px-4 py-3.5 text-center w-10"></th>}
                <th className="px-4 py-3.5">Level Scope</th>
                <th className="px-4 py-3.5">Element Specification</th>
                <th className="px-4 py-3.5">Volumetric Type</th>
                <th className="px-4 py-3.5 text-right">Bounding Dim.</th>
                <th className="px-4 py-3.5 text-right">Computed Formwork</th>
                <th className="px-4 py-3.5 text-right">Wet Volume</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-xs text-slate-500 dark:text-slate-400 animate-pulse">
                    Loading workspace registry data…
                  </td>
                </tr>
              ) : elements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500 text-xs">
                    No elements match the structural query settings.
                  </td>
                </tr>
              ) : (
                statisticsSummary.pageSliceElements.map((el) => (
                  <tr key={el.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    {onToggleSelect && (
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(el.id)}
                          onChange={() => onToggleSelect(el.id)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-brand-600 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <Layers size={13} className="text-brand-600 dark:text-brand-400 shrink-0" />
                        <span className="truncate max-w-[120px]" title={el.levelName}>
                          {el.levelName || "Level"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      <div
                        onClick={() => onViewDetail && onViewDetail(el)}
                        className="cursor-pointer text-brand-600 dark:text-brand-400 font-bold hover:underline flex items-center gap-1.5"
                      >
                        <span>{el.elementName}</span>
                        {el.grid && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal font-mono">
                            ({el.grid})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        {el.elementType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {renderDimensions(el)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {getOrCalculateFormworkArea(el).toFixed(2)} m²
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {getOrCalculateVolume(el).toFixed(3)} m³
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {canUpdateUser && onStatusChange ? (
                        <select
                          value={el.status}
                          onChange={(e) => onStatusChange(el.id, e.target.value as ElementStatus)}
                          className="text-[10px] font-bold border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 bg-white dark:bg-slate-950 outline-none cursor-pointer text-amber-600 dark:text-amber-400 uppercase focus:border-brand-500"
                        >
                          {statusOptions.map((st) => (
                            <option key={st} value={st} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                              {STATUS_LABELS[st] || st.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <StatusBadge status={el.status} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <ActionMenu el={el} />
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
                        {onViewDetail && (
                          <button
                            onClick={() => onViewDetail(el)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 rounded-lg hover:text-brand-600 dark:hover:text-brand-400 transition"
                            title="3D View"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        {canUpdateUser && onEdit && (
                          <button
                            onClick={() => onEdit(el)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 rounded-lg hover:text-brand-600 dark:hover:text-brand-400 transition"
                            title="Edit Properties"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                        {canUpdateUser && onDelete && (
                          <button
                            onClick={() => onDelete(el.id, el.elementName)}
                            className="p-1.5 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 rounded-lg hover:text-red-600 dark:hover:text-red-400 transition"
                            title="Delete Entry"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Volumetric & Formwork Summary Footer */}
        {!loading && elements.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <div>
                Visible Formwork:{" "}
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-lg">
                  {statisticsSummary.visiblePageFormwork.toFixed(2)} m²
                </span>
              </div>
              <div>
                Visible Volume:{" "}
                <span className="font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-lg">
                  {statisticsSummary.visiblePageVolume.toFixed(3)} m³
                </span>
              </div>
              <div className="hidden sm:block text-slate-300 dark:text-slate-700">|</div>
              <div>
                Total Formwork:{" "}
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-lg">
                  {statisticsSummary.globalTotalFormwork.toFixed(2)} m²
                </span>
              </div>
              <div>
                Total Concrete:{" "}
                <span className="font-mono font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 px-2 py-0.5 rounded-lg">
                  {statisticsSummary.globalTotalVolume.toFixed(3)} m³
                </span>
              </div>
            </div>
            <div className="text-slate-500 text-[11px] italic flex items-center gap-1">
              <HelpCircle size={12} /> Quantities computed from physical member dimensions.
            </div>
          </div>
        )}
      </div>

      {/* Pagination Action Controls */}
      {!loading && elements.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Showing <strong className="text-slate-900 dark:text-white">{(activePage - 1) * ITEMS_PER_PAGE + 1}</strong> to{" "}
            <strong className="text-slate-900 dark:text-white">{Math.min(activePage * ITEMS_PER_PAGE, elements.length)}</strong> of{" "}
            <strong className="text-slate-900 dark:text-white">{elements.length}</strong> elements
          </div>

          <div className="flex items-center justify-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={activePage === 1}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:text-white disabled:opacity-40 transition shrink-0"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded-xl text-xs font-bold transition shrink-0 ${
                  activePage === pageNum
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={activePage === totalPages}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:text-white disabled:opacity-40 transition shrink-0"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElementTable;
