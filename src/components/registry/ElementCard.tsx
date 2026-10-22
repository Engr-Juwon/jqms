import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Ruler,
  Layers,
  Building,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  CheckCircle2,
  Hammer,
  AlertTriangle,
  Eye,
  ExternalLink,
  ShieldAlert,
  Clock,
  Briefcase,
  Check,
} from "lucide-react";
import {
  StructuralElement,
  InspectionRequest,
  NonConformanceReport,
  ConcreteCubeSample,
  SiteCommentReport,
  ElementStatus,
} from "@/types";
import { isQAQCUser } from "@/lib/permissions";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  getOrCalculateVolume,
  getElementDimensionMeta,
  normalizeDimension,
} from "@/lib/elementCalculations";

interface ElementCardProps {
  element: StructuralElement;
  projectId: string;
  levelName: string;
  packageName?: string;
  inspections?: InspectionRequest[];
  ncrs?: NonConformanceReport[];
  cubeTests?: ConcreteCubeSample[];
  siteComments?: SiteCommentReport[];
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onView3D: () => void;
  onPrintQR?: () => void;
  onStatusChange: (status: StructuralElement["status"]) => void;
}

const ELEMENT_TYPE_ICONS: Record<string, React.ElementType> = {
  COLUMN: Box,
  BEAM: Ruler,
  SLAB: Layers,
  WALL: Building,
  FOOTING: Box,
  STAIRS: ArrowUpRight,
  STAIR: ArrowUpRight,
};

const STATUS_CONFIGS: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING: {
    label: "Pending",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    dot: "bg-slate-400",
  },
  REBAR_IN_PROGRESS: {
    label: "Rebar Progress",
    bg: "bg-blue-50 dark:bg-blue-950/60",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  REBAR_INSPECTED: {
    label: "Rebar Passed",
    bg: "bg-indigo-50 dark:bg-indigo-950/60",
    text: "text-indigo-700 dark:text-indigo-300",
    dot: "bg-indigo-500",
  },
  FORMWORK_IN_PROGRESS: {
    label: "Formwork Progress",
    bg: "bg-purple-50 dark:bg-purple-950/60",
    text: "text-purple-700 dark:text-purple-300",
    dot: "bg-purple-500",
  },
  READY_FOR_CASTING: {
    label: "Ready for Casting",
    bg: "bg-amber-50 dark:bg-amber-950/60",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  POURED: {
    label: "Poured",
    bg: "bg-cyan-50 dark:bg-cyan-950/60",
    text: "text-cyan-700 dark:text-cyan-300",
    dot: "bg-cyan-500",
  },
  APPROVED: {
    label: "QA Approved",
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "QA Rejected",
    bg: "bg-red-50 dark:bg-red-950/60",
    text: "text-red-700 dark:text-red-300",
    dot: "bg-red-500",
  },
};

const STATUS_OPTIONS: ElementStatus[] = [
  "PENDING",
  "REBAR_IN_PROGRESS",
  "FORMWORK_IN_PROGRESS",
  "READY_FOR_CASTING",
  "REBAR_INSPECTED",
  "POURED",
  "APPROVED",
  "REJECTED",
];

export const ElementCard: React.FC<ElementCardProps> = ({
  element,
  projectId,
  levelName,
  packageName = "",
  inspections = [],
  ncrs = [],
  cubeTests = [],
  siteComments = [],
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onView3D,
  onStatusChange,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const isQAQC = isQAQCUser(currentUser);
  const [showDetails, setShowDetails] = useState(false);

  const type = String(element.elementType || "COLUMN").toUpperCase();
  const Icon = ELEMENT_TYPE_ICONS[type] || Box;
  const statusCfg = STATUS_CONFIGS[element.status] || STATUS_CONFIGS.PENDING;

  // Active NCRs
  const activeNCRs = ncrs.filter(
    (n) => n.status !== "CLOSED" && n.status !== "CANCELLED",
  );
  const hasNCRHold = activeNCRs.length > 0;

  // Volume
  const totalVol = getOrCalculateVolume(element);
  const achievedVol =
    element.achievedVolume ??
    (element.status === "POURED" || element.status === "APPROVED" ? totalVol : 0);

  // Type-Aware Dimensions
  const dimMeta = getElementDimensionMeta(element.elementType);
  const L = normalizeDimension(element.length ?? element.dimensions?.length);
  const W = normalizeDimension(element.width ?? element.dimensions?.width);
  const H = normalizeDimension(element.height ?? element.dimensions?.height);
  const D = normalizeDimension(element.depth);
  const T = normalizeDimension(element.thickness);

  const dimensionSummary = dimMeta.summary(L, W, H, D, T);

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md flex flex-col justify-between ${
        isSelected
          ? "border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20 dark:bg-brand-950/20"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      {/* ─── CARD HEADER ─── */}
      <div className="p-3.5 pb-2.5 flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 cursor-pointer shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-black text-sm text-slate-900 dark:text-white truncate">
                {element.elementName}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0">
                <Icon className="w-3 h-3 text-slate-500" />
                {element.elementType}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              <span>Grid: <strong className="text-slate-700 dark:text-slate-300">{element.grid || element.gridAxis || "—"}</strong></span>
              <span>•</span>
              <span className="truncate">{levelName || "Level"}</span>
            </div>
          </div>
        </div>

        {/* 3D View & Passport Quick Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onView3D}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="3D BIM Twin Model"
          >
            <Eye className="w-4 h-4" />
          </button>
          <Link
            to={`/project/elements/${element.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Open Element Passport"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ─── CARD BODY: DIMENSIONS & VOLUME ─── */}
      <div className="p-3.5 py-2.5 space-y-2">
        {/* Dimension & Volume Strip */}
        <div className="flex items-center justify-between text-xs font-mono bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2">
          <div className="text-slate-700 dark:text-slate-300 font-bold truncate">
            {dimensionSummary}
          </div>
          <div className="text-right shrink-0 ml-2 font-black text-brand-700 dark:text-brand-300">
            {totalVol.toFixed(2)} m³
          </div>
        </div>

        {/* Grade & Package Strip */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div>
            Grade:{" "}
            <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
              {element.concreteGrade || "C35/45"}
            </span>
          </div>
          {packageName && (
            <div className="flex items-center gap-1 truncate text-slate-600 dark:text-slate-400">
              <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate font-medium">{packageName}</span>
            </div>
          )}
        </div>

        {/* Statutory NCR Hold Warning */}
        {hasNCRHold && (
          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>DEFECT HOLD: {activeNCRs.length} Active NCR(s)</span>
            </div>
            <Link
              to={`/project/elements/${element.id}`}
              className="text-[10px] font-mono underline hover:text-red-500 font-bold shrink-0"
            >
              Inspect
            </Link>
          </div>
        )}
      </div>

      {/* ─── CARD FOOTER: STATUS SELECTOR & ACTIONS ─── */}
      <div className="p-3.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        {/* Status Dropdown Pill */}
        <div className="relative">
          <select
            value={element.status}
            onChange={(e) => onStatusChange(e.target.value as ElementStatus)}
            disabled={!isQAQC}
            className={`appearance-none px-2.5 py-1.5 pr-6 rounded-xl text-xs font-bold border transition cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-500 ${statusCfg.bg} ${statusCfg.text} border-current/20`}
          >
            {STATUS_OPTIONS.map((st) => (
              <option
                key={st}
                value={st}
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {st.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
            <span className={`block w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
          </div>
        </div>

        {/* Actions Cluster */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={showDetails ? "Hide QA details" : "Show QA details"}
          >
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {isQAQC && (
            <>
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Edit Element"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition"
                title="Delete Element"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── EXPANDABLE QA/QC DETAILS ─── */}
      {showDetails && (
        <div className="p-3.5 pt-0 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 rounded-b-2xl space-y-2 text-xs">
          <div className="grid grid-cols-3 gap-2 text-center pt-2.5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Inspections</div>
              <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {inspections.length}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Cube Tests</div>
              <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {cubeTests.length}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Achieved</div>
              <div className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                {achievedVol.toFixed(2)} m³
              </div>
            </div>
          </div>
          {element.rebarSpec && (
            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
              Rebar: <span className="font-bold text-slate-800 dark:text-slate-200">{element.rebarSpec}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
