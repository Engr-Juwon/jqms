import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Ruler,
  Layers,
  Building,
  ArrowUpRight,
  ChevronRight,
  Edit3,
  Trash2,
  Clock,
  CheckCircle2,
  Hammer,
  AlertTriangle,
  ClipboardCheck,
  FlaskConical,
  MessageSquare,
  AlertOctagon,
  Grid,
  Square,
  Eye,
  BoxSelect,
  MapPin,
  Briefcase,
  QrCode,
  ShieldAlert,
} from "lucide-react";
import {
  StructuralElement,
  InspectionRequest,
  NonConformanceReport,
  ConcreteCubeSample,
  SiteCommentReport,
} from "@/types";
import { hasMinRole, isQAQCUser } from "@/lib/permissions";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  getOrCalculateVolume,
  getOrCalculateFormworkArea,
  getOrCalculateElementArea,
} from "@/lib/elementCalculations";

/* ─── Element Configs ─── */
const ELEMENT_CONFIGS: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  COLUMN: {
    label: "Column",
    icon: Box,
    color: "text-brand-600 dark:text-brand-400",
    bg: "bg-brand-500/10 border-brand-500/20",
  },
  BEAM: {
    label: "Beam",
    icon: Ruler,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  SLAB: {
    label: "Slab",
    icon: Layers,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  WALL: {
    label: "Wall",
    icon: Building,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
  },
  FOOTING: {
    label: "Footing",
    icon: Box,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  STAIRS: {
    label: "Stairs",
    icon: ArrowUpRight,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
};

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; icon: React.ElementType }
> = {
  PENDING: {
    bg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    text: "text-slate-700 dark:text-slate-300",
    icon: Clock,
  },
  REBAR_IN_PROGRESS: {
    bg: "bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    text: "text-indigo-700 dark:text-indigo-300",
    icon: Hammer,
  },
  REBAR_INSPECTED: {
    bg: "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
    text: "text-blue-700 dark:text-blue-300",
    icon: CheckCircle2,
  },
  FORMWORK_IN_PROGRESS: {
    bg: "bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
    text: "text-purple-700 dark:text-purple-300",
    icon: Layers,
  },
  READY_FOR_CASTING: {
    bg: "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
    text: "text-amber-700 dark:text-amber-300",
    icon: CheckCircle2,
  },
  POURED: {
    bg: "bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    text: "text-cyan-700 dark:text-cyan-300",
    icon: Hammer,
  },
  APPROVED: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  REJECTED: {
    bg: "bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30",
    text: "text-red-700 dark:text-red-300",
    icon: AlertTriangle,
  },
};

const STATUS_OPTIONS: Array<{
  key: StructuralElement["status"];
  label: string;
  color: string;
}> = [
  { key: "PENDING", label: "Pending Planned", color: "#94a3b8" },
  { key: "REBAR_IN_PROGRESS", label: "Rebar in Progress", color: "#6366f1" },
  { key: "REBAR_INSPECTED", label: "Rebar Inspected", color: "#3b82f6" },
  { key: "FORMWORK_IN_PROGRESS", label: "Formwork in Progress", color: "#a855f7" },
  { key: "READY_FOR_CASTING", label: "Ready for Casting", color: "#eab308" },
  { key: "POURED", label: "Concrete Poured", color: "#06b6d4" },
  { key: "APPROVED", label: "QA Approved", color: "#10b981" },
  { key: "REJECTED", label: "Rejected / NCR", color: "#ef4444" },
];

const STATUS_STAGE_MAP: Record<string, number> = {
  PENDING: 0,
  REBAR_IN_PROGRESS: 1,
  REBAR_INSPECTED: 1,
  FORMWORK_IN_PROGRESS: 2,
  READY_FOR_CASTING: 2,
  POURED: 3,
  APPROVED: 4,
  REJECTED: 0,
};

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
  onPrintQR,
  onStatusChange,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const isQAQC = isQAQCUser(currentUser);
  const isLvl2 = hasMinRole(currentUser?.role, 2);
  const isLvl3 = hasMinRole(currentUser?.role, 3);

  const config = ELEMENT_CONFIGS[element.elementType] || ELEMENT_CONFIGS.COLUMN;

  const StatusIcon = STATUS_STYLES[element.status]?.icon || Clock;

  const latestInspection = [...inspections].sort(
    (a, b) =>
      new Date(b.scheduledDate || b.createdAt || 0).getTime() -
      new Date(a.scheduledDate || a.createdAt || 0).getTime(),
  )[0];

  const openNCRs = ncrs.filter((n) => n.status !== "CLOSED").length;
  const failedCubes = cubeTests.filter(
    (ct) => ct.overallStatus === "REJECTED",
  ).length;

  const isOverdue = !!(
    element.nextInspectionDate &&
    new Date(element.nextInspectionDate) < new Date() &&
    element.status !== "APPROVED"
  );

  /* Web depth for beams */
  const webDepth =
    element.elementType === "BEAM" && element.supportedSlabThickness
      ? Math.max(
          0,
          (element.depth || element.thickness || 0.6) -
            element.supportedSlabThickness,
        )
      : element.depth || element.thickness || 0.6;

  /* Volumetric & Formwork Calculations with fallback to dimensions */
  const totalVol = getOrCalculateVolume(element);
  const achievedVol =
    element.achievedVolume ??
    (element.status === "POURED" || element.status === "APPROVED" ? totalVol : 0);
  const volPct =
    totalVol > 0 ? Math.min(100, Math.round((achievedVol / totalVol) * 100)) : 0;
  const formworkArea = getOrCalculateFormworkArea(element);

  /* Calculated element area */
  const elementArea = getOrCalculateElementArea(element);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border bg-white dark:bg-slate-900/90 p-4 sm:p-5 shadow-sm dark:shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-2xl group flex flex-col justify-between space-y-3.5 ${
        isSelected
          ? "border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/50 dark:bg-brand-950/20"
          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 transition-all ${
          isSelected ? "bg-brand-500" : "bg-slate-200 dark:bg-slate-800 group-hover:bg-brand-500"
        }`}
      />

      {/* Absolute Checkbox */}
      <div className="absolute top-4 left-4 z-10">
        <label className="flex items-center justify-center p-1 cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-brand-600 focus:ring-brand-500/30 cursor-pointer transition-transform active:scale-90"
          />
        </label>
      </div>

      {/* ─── Header ─── */}
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3.5 pl-8 sm:flex-row sm:items-start sm:pl-0">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${config.bg} shadow-sm`}
          >
            <config.icon size={20} className={config.color} />
          </div>
          <div>
            <h4 className="text-sm font-extrabold leading-snug tracking-tight text-slate-900 dark:text-white sm:text-base">
              {element.elementName}
            </h4>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {element.elementType}
              </span>
              <span className="text-slate-400 dark:text-slate-600">•</span>
              <span className="rounded-lg bg-slate-100 dark:bg-slate-950 px-2 py-0.5 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                {levelName}
              </span>
            </p>
          </div>
        </div>

        {/* Status / Dates Strip */}
        <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
          {element.plannedCastingDate && (
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono">
              Cast: {new Date(element.plannedCastingDate).toLocaleDateString()}
            </span>
          )}
          {element.actualCastingDate && (
            <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-lg border border-sky-200 dark:border-sky-500/30 font-mono">
              Poured: {new Date(element.actualCastingDate).toLocaleDateString()}
            </span>
          )}
          {isOverdue && (
            <span className="px-2 py-0.5 rounded-lg bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-[9px] font-black uppercase tracking-wider animate-pulse border border-red-500/30">
              Overdue
            </span>
          )}
          <span
            className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5 shadow-sm ${
              STATUS_STYLES[element.status]?.bg ||
              "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}
          >
            <StatusIcon size={12} />
            {element.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {/* Active NCR Defect Hold Warning */}
      {openNCRs > 0 && (
        <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            <span className="font-bold text-[11px]">
              🛑 DEFECT HOLD: {openNCRs} active non-conformance reported
            </span>
          </div>
          <button
            onClick={() => navigate(`/project/elements/${element.id}`)}
            className="text-[10px] font-mono font-bold underline hover:text-red-500"
          >
            Review Defect
          </button>
        </div>
      )}

      {/* ─── 5-Stage Lifecycle Stepper ─── */}
      <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
          <span>Lifecycle Progress</span>
          <span className="text-brand-600 dark:text-brand-400 font-mono">
            {element.status.replace(/_/g, " ")}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1 text-[8px] font-mono font-bold text-center">
          {[
            { key: "PENDING", label: "Planned", stage: 0 },
            { key: "REBAR_INSPECTED", label: "Rebar", stage: 1 },
            { key: "READY_FOR_CASTING", label: "Formwork", stage: 2 },
            { key: "POURED", label: "Poured", stage: 3 },
            { key: "APPROVED", label: "Accepted", stage: 4 },
          ].map((step) => {
            const currentStage = STATUS_STAGE_MAP[element.status] ?? 0;
            const isDone = currentStage >= step.stage && element.status !== "REJECTED";
            const isCurrent = currentStage === step.stage;

            return (
              <div key={step.key} className="space-y-1">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    isCurrent
                      ? "bg-brand-500 ring-2 ring-brand-500/20"
                      : isDone
                        ? "bg-emerald-500"
                        : "bg-slate-200 dark:bg-slate-800"
                  }`}
                />
                <span className={`block truncate ${isDone ? "text-slate-800 dark:text-slate-200" : "text-slate-400 dark:text-slate-600"}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Quantity Takeoffs Grid ─── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 text-xs">
        {/* Volume with SVG Radial Donut Gauge */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 sm:p-3 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5 truncate">
              Volume (Ach / Tot)
            </p>
            <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono truncate">
              {achievedVol.toFixed(2)}{" "}
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-sans">
                / {totalVol.toFixed(2)} m³
              </span>
            </p>
          </div>
          {/* Radial Donut Progress */}
          <div
            className="relative w-9 h-9 shrink-0 flex items-center justify-center"
            title={`${volPct}% Poured / Achieved`}
          >
            <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="3.5"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke={
                  volPct >= 100
                    ? "#10b981"
                    : volPct > 0
                      ? "#0ea5e9"
                      : "#94a3b8"
                }
                strokeWidth="3.5"
                strokeDasharray="88"
                strokeDashoffset={88 - (88 * volPct) / 100}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <span className="absolute text-[8px] font-black font-mono text-slate-700 dark:text-slate-300">
              {volPct}%
            </span>
          </div>
        </div>

        {/* Formwork Area */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/20 p-2.5 sm:p-3">
          <p className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-0.5 flex items-center gap-1 truncate">
            <Grid size={10} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            Formwork Area
          </p>
          <p className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-300 font-mono truncate">
            {formworkArea.toFixed(2)}{" "}
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 font-sans">
              m²
            </span>
          </p>
        </div>

        {/* Element Area */}
        <div className="col-span-2 rounded-2xl border border-sky-500/20 bg-sky-50/60 dark:bg-sky-950/20 p-2.5 sm:p-3 sm:col-span-1">
          <p className="text-[9px] font-black text-sky-700 dark:text-sky-400 uppercase tracking-wider mb-0.5 flex items-center gap-1 truncate">
            <Square size={10} className="text-sky-600 dark:text-sky-400 shrink-0" />
            Element Area
          </p>
          <p className="text-xs sm:text-sm font-black text-sky-800 dark:text-sky-300 font-mono truncate">
            {elementArea.toFixed(2)}{" "}
            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-500 font-sans">
              m²
            </span>
          </p>
        </div>
      </div>

      {/* ─── Location & Package Context ─── */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 flex items-center gap-2">
          <MapPin size={12} className="text-brand-600 dark:text-brand-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[9px] text-slate-500 block uppercase font-bold">
              Grid Location
            </span>
            <strong className="text-slate-800 dark:text-slate-200 text-xs truncate block font-mono">
              {element.grid || element.gridAxis || "—"}
            </strong>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 flex items-center gap-2">
          <Briefcase size={12} className="text-sky-600 dark:text-sky-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[9px] text-slate-500 block uppercase font-bold">
              Work Package
            </span>
            <strong className="text-slate-800 dark:text-slate-200 text-xs truncate block">
              {packageName || "Unassigned"}
            </strong>
          </div>
        </div>
      </div>

      {/* ─── Dimensions Display Panel ─── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 shadow-inner">
        <div className="flex items-center justify-between mb-1.5 border-b border-slate-200/80 dark:border-slate-800/80 pb-1.5">
          <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <BoxSelect size={11} className="text-slate-500 dark:text-slate-400" />
            Dimensions & Grade
          </p>
          <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 px-2 py-0.5 rounded-lg font-mono">
            {element.concreteGrade || "C40/50"}
          </span>
        </div>

        {/* Curved Slab / Circular Arc Profile */}
        {element.elementType === "SLAB" && (element.slabShape === "circular_segment" || element.slabShape === "curved_cantilever" || element.radius) ? (
          <div>
            <p className="text-xs sm:text-sm font-black font-mono leading-tight text-emerald-800 dark:text-emerald-300">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 mr-1.5">
                {element.slabShape === "circular_segment" ? "Arc Segment" : element.slabShape === "curved_cantilever" ? "Curved Cantilever" : "Curved Slab"}
              </span>
              R={element.radius?.toFixed(2) || "2.96"}m
              {element.arcDepth && (
                <>
                  <span className="text-[10px] px-1.5 text-slate-400 dark:text-slate-500">·</span>
                  <span>Rise h={element.arcDepth.toFixed(2)}m</span>
                </>
              )}
              <span className="text-[10px] px-1.5 text-slate-400 dark:text-slate-500">×</span>
              <span className="text-slate-900 dark:text-white">
                {(element.thickness || 0.175).toFixed(3)}m (T)
              </span>
            </p>
          </div>
        ) : element.elementType === "BEAM" && (element.beamShape === "curved" || (element.radius && !element.columnShape)) ? (
          <div>
            <p className="text-xs sm:text-sm font-black font-mono leading-tight text-amber-800 dark:text-amber-300">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 mr-1.5">
                Curved Beam
              </span>
              R={element.radius?.toFixed(2)}m
              <span className="text-[10px] px-1.5 text-slate-400 dark:text-slate-500">×</span>
              {element.width?.toFixed(2)}m × {element.depth?.toFixed(2)}m
            </p>
          </div>
        ) : element.elementType === "BEAM" && element.supportedSlabThickness ? (
          <div>
            <p className="text-xs sm:text-sm font-black font-mono leading-tight text-slate-900 dark:text-white tracking-tight">
              {element.width?.toFixed(2) || "0.30"}m
              <span className="text-[10px] px-1.5 text-slate-400 dark:text-slate-500">×</span>
              <span className="text-amber-600 dark:text-amber-400 font-black">
                {(webDepth ?? 0).toFixed(2)}m
              </span>
              <span className="text-[10px] px-1.5 text-slate-400 dark:text-slate-500">×</span>
              {element.length?.toFixed(2) || "6.00"}m
            </p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1 leading-snug">
              Web depth: {(webDepth ?? 0).toFixed(3)}m
              <span className="text-slate-500">
                {" "}
                (total {element.depth?.toFixed(2) || "0.60"}m − slab{" "}
                {element.supportedSlabThickness?.toFixed(2) || "0.15"}m)
              </span>
            </p>
          </div>
        ) : element.elementType === "COLUMN" ? (
          /* Column Dimensions (Circular vs Rectangular) */
          <div>
            {element.columnShape === "circular" || element.diameter ? (
              <p className="text-xs sm:text-sm font-black font-mono leading-tight text-slate-900 dark:text-white">
                <span className="text-sky-600 dark:text-sky-400 font-bold">Ø</span>{" "}
                {element.diameter?.toFixed(2) || "0.60"}m{" "}
                <span className="text-[10px] px-1.5 text-slate-400 dark:text-slate-500">×</span>
                {element.height?.toFixed(2) || "3.20"}m (H)
              </p>
            ) : (
              <p className="text-xs sm:text-sm font-black font-mono leading-tight text-slate-900 dark:text-white">
                {element.length?.toFixed(2) || "0.80"}m
                <span className="text-[10px] px-1.5 text-slate-400 dark:text-slate-500">×</span>
                {element.width?.toFixed(2) || "0.80"}m
                <span className="text-[10px] px-1.5 text-slate-400 dark:text-slate-500">×</span>
                <span className="text-brand-600 dark:text-brand-300 font-black">
                  {element.height?.toFixed(2) || "3.20"}m (H)
                </span>
              </p>
            )}
          </div>
        ) : (
          /* Default Dimensions */
          <p className="text-xs sm:text-sm font-black font-mono leading-tight text-slate-900 dark:text-white">
            {element.length?.toFixed(2) || "6.00"}m
            <span className="text-[10px] px-1.5 text-slate-400 dark:text-slate-500">×</span>
            {element.width?.toFixed(2) || "6.00"}m
            <span className="text-[10px] px-1.5 text-slate-400 dark:text-slate-500">×</span>
            {element.thickness?.toFixed(2) ||
              element.height?.toFixed(2) ||
              "0.20"}
            m
          </p>
        )}
      </div>

      {/* ─── Inspection & QA Badges ─── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
          <ClipboardCheck size={11} className="text-brand-600 dark:text-brand-400" />
          <span>
            {inspections.length === 0
              ? "No Hold Points"
              : `${inspections.length} insp · ${latestInspection?.status || "PENDING"}`}
          </span>
        </div>

        {ncrs.length > 0 && (
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
              openNCRs > 0
                ? "bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30"
                : "bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
            }`}
          >
            <AlertOctagon
              size={11}
              className={openNCRs > 0 ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}
            />
            <span>
              {openNCRs > 0
                ? `${openNCRs} Open NCR`
                : `${ncrs.length} NCR Resolved`}
            </span>
          </div>
        )}

        {cubeTests.length > 0 && (
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
              failedCubes > 0
                ? "bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30"
                : "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
            }`}
          >
            <FlaskConical size={11} />
            <span>
              {failedCubes > 0
                ? `${failedCubes} Failed Cube`
                : `${cubeTests.length} Cubes Compliant`}
            </span>
          </div>
        )}
      </div>

      {/* ─── Footer Controls & Actions ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-3">
        {/* Quick Status Donut Rings */}
        {isLvl2 && (
          <div
            className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-full border border-slate-200 dark:border-slate-800"
            title="Quick Status Selector"
          >
            {STATUS_OPTIONS.map((st) => {
              const isSelected = element.status === st.key;
              return (
                <button
                  key={st.key}
                  onClick={() => onStatusChange(st.key)}
                  className={`w-4 h-4 rounded-full transition-all active:scale-90 cursor-pointer relative flex items-center justify-center ${
                    isSelected
                      ? "ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 ring-slate-900 dark:ring-white scale-110 shadow-sm"
                      : "opacity-45 hover:opacity-100 hover:scale-105"
                  }`}
                  style={{
                    backgroundColor: st.color,
                  }}
                  title={`Set status to ${st.label}`}
                >
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900 shadow-xs" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          {isQAQC && (
            <>
              <button
                onClick={onEdit}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition shadow-sm"
                title="Edit Element Specs"
              >
                <Edit3 size={14} />
              </button>

              <button
                onClick={onDelete}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950 hover:bg-red-500/20 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-800 transition shadow-sm"
                title="Delete Element"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}

          {onPrintQR && (
            <button
              onClick={onPrintQR}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950 hover:bg-brand-500/10 dark:hover:bg-brand-500/20 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 border border-slate-200 dark:border-slate-800 transition shadow-sm"
              title="Print QR Asset Tag"
            >
              <QrCode size={14} />
            </button>
          )}

          <button
            onClick={onView3D}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950 hover:bg-brand-500/10 dark:hover:bg-brand-500/20 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 border border-slate-200 dark:border-slate-800 transition shadow-sm"
            title="Inspect 3D Twin"
          >
            <Box size={14} />
          </button>

          <button
            onClick={() => navigate(`/project/elements/${element.id}`)}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition group/btn"
            title="View Quality Passport"
          >
            <Eye size={13} />
            <span>Passport</span>
            <ChevronRight
              size={13}
              className="transition-transform group-hover/btn:translate-x-0.5"
            />
          </button>
        </div>
      </div>
    </div>
  );
};
