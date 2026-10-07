import React, { useState } from "react";
import {
  Sparkles,
  Save,
  Printer,
  FileText,
  Presentation,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Upload,
  Plus,
  Trash2,
  Grid3x3,
  Calendar,
  Layers,
  ShieldCheck,
  Building2,
  Percent,
  FileCheck,
  Loader2,
  Lock,
  Eye,
  Award,
  Activity,
  Image as ImageIcon,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { WeeklyReport } from "@/types";
import { MepClearanceRow } from "@/services/pdf/weeklyReportGenerator";
import { getThumbnail } from "@/lib/cloudinary";

interface PictorialAsset {
  url: string;
  caption: string;
}

export interface WeeklyReportExecutiveMatrixProps {
  report: WeeklyReport;
  activeProject?: any;
  company?: any;
  currentUser?: any;
  executiveSummary: string;
  setExecutiveSummary: (val: string) => void;
  highlights: string;
  setHighlights: (val: string) => void;
  concerns: string;
  setConcerns: (val: string) => void;
  nextWeekPlan: string;
  setNextWeekPlan: (val: string) => void;
  remediationSummaryText?: string;
  setRemediationSummaryText?: (val: string) => void;
  overallQualityCompliance: number;
  setOverallQualityCompliance: (val: number) => void;
  beamLayoutImg: any;
  setBeamLayoutImg: any;
  columnLayoutImg: any;
  setColumnLayoutImg: any;
  slabImg: any;
  setslabImg: any;
  mepClearance: MepClearanceRow[];
  setMepClearance: any;
  pictorialUrls: PictorialAsset[];
  setPictorialUrls: any;
  handleCaptionChange: (idx: number, val: string) => void;
  handleImageUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    target: any,
  ) => void;
  openGalleryPicker: (target: any) => void;
  uploadingImage: any;
  handleUpdate: () => void;
  handleGenerate: () => void;
  setIsPrintModalOpen: (open: boolean) => void;
  handleRefreshCubes: () => void;
  refreshingCubes: boolean;
  handleRefreshMaterials: () => void;
  refreshingDeliveries: boolean;
  handleRefreshNcrs: () => void;
  refreshingNcrs: boolean;
  handleRefreshSiteComments: () => void;
  refreshingComments: boolean;
  handleRefreshSiteInstructions: () => void;
  refreshingSiteInstructions: boolean;
  handleRefreshElements?: () => void;
  refreshingElements?: boolean;
  handleUpdateElementVolume?: (elementId: string, achievedVolume: number) => void;
  handleSignAsCompiler: () => void;
  isSigningCompiler: boolean;
  handleClearSignature: () => void;
  rawSiteInstructions: any[];
  includeNcrsAndComments: boolean;
  setIncludeNcrsAndComments: (val: boolean) => void;
  includeSiteInstructions: boolean;
  setIncludeSiteInstructions: (val: boolean) => void;
  canUpdateReport: boolean;
  saving: boolean;
  onOpenPresentation: () => void;
}

type MatrixDomain =
  | "STRATEGIC"
  | "CONCRETE_MATERIALS"
  | "STRUCTURAL_SCHEDULE"
  | "SPATIAL_LAYOUTS"
  | "MEP_GOVERNANCE"
  | "PHOTO_EVIDENCE"
  | "ISO_SIGN_OFF";

export const WeeklyReportExecutiveMatrix: React.FC<
  WeeklyReportExecutiveMatrixProps
> = ({
  report,
  activeProject,
  company,
  currentUser,
  executiveSummary,
  setExecutiveSummary,
  highlights,
  setHighlights,
  concerns,
  setConcerns,
  nextWeekPlan,
  setNextWeekPlan,
  remediationSummaryText = "",
  setRemediationSummaryText,
  overallQualityCompliance,
  setOverallQualityCompliance,
  beamLayoutImg,
  setBeamLayoutImg,
  columnLayoutImg,
  setColumnLayoutImg,
  slabImg,
  setslabImg,
  mepClearance,
  setMepClearance,
  pictorialUrls,
  setPictorialUrls,
  handleCaptionChange,
  handleImageUpload,
  openGalleryPicker,
  uploadingImage,
  handleUpdate,
  handleGenerate,
  setIsPrintModalOpen,
  handleRefreshCubes,
  refreshingCubes,
  handleRefreshMaterials,
  refreshingDeliveries,
  handleRefreshNcrs,
  refreshingNcrs,
  handleRefreshSiteComments,
  refreshingComments,
  handleRefreshSiteInstructions,
  refreshingSiteInstructions,
  handleRefreshElements,
  refreshingElements = false,
  handleUpdateElementVolume,
  handleSignAsCompiler,
  isSigningCompiler,
  handleClearSignature,
  rawSiteInstructions,
  includeNcrsAndComments,
  setIncludeNcrsAndComments,
  includeSiteInstructions,
  setIncludeSiteInstructions,
  canUpdateReport,
  saving,
  onOpenPresentation,
}) => {
  const [activeDomain, setActiveDomain] = useState<MatrixDomain>("STRATEGIC");
  const [elementFilterType, setElementFilterType] = useState<"ALL" | "COLUMN" | "BEAM" | "SLAB" | "WALL">("ALL");
  const [elementSearchTerm, setElementSearchTerm] = useState("");

  const projName =
    activeProject?.name || report.projectName || "Site Operations";
  const compilerName =
    (typeof report.preparedBy === "object"
      ? report.preparedBy?.name
      : report.preparedBy) || "QA/QC Engineer";
  const compilerRole =
    (typeof report.preparedBy === "object"
      ? report.preparedBy?.designation || report.preparedBy?.role
      : "Quality Control Lead") || "Quality Control Lead";

  // Radial Meter Calculation
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (overallQualityCompliance / 100) * circumference;

  const complianceBadge =
    overallQualityCompliance >= 85
      ? {
          label: "ISO Conformant",
          color: "text-emerald-700 dark:text-emerald-400",
          stroke: "#10b981",
          bg: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
        }
      : overallQualityCompliance >= 70
        ? {
            label: "Surveillance Attention",
            color: "text-amber-700 dark:text-amber-400",
            stroke: "#f59e0b",
            bg: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
          }
        : {
            label: "Critical Quality Hold",
            color: "text-red-700 dark:text-red-400",
            stroke: "#ef4444",
            bg: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20",
          };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. HERO EXECUTIVE COCKPIT (Strategic Macro Status) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-2xl relative overflow-hidden">
        {/* Glow ambient background accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Left Title & Project Bio */}
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/20 dark:border-orange-500/30 text-[10px] font-black uppercase tracking-wider font-mono">
                Executive Command Matrix
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {report.reportNumber || "WR-3428"}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                ISO 9001:2015 Clause 9.1
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              {report.title || "Weekly Quality Assurance Dossier"}
            </h2>

            {/* Glass Metadata Strip */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-xs">
                <Building2 size={13} className="text-orange-500 dark:text-orange-400" />
                <span className="font-bold text-slate-900 dark:text-white">{projName}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-xs">
                <MapPin size={13} className="text-amber-500 dark:text-amber-400" />
                <span>
                  Level:{" "}
                  <strong className="text-slate-900 dark:text-white font-bold">
                    {report.selectedLevel || "All Levels"}
                  </strong>
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-xs font-mono text-[11px]">
                <Calendar size={13} className="text-blue-500 dark:text-blue-400" />
                <span>
                  {report.weekStart || "Start"} → {report.weekEnd || "End"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Launchers */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              type="button"
              onClick={onOpenPresentation}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black transition shadow-xl shadow-orange-600/30 border border-orange-400/30 active:scale-95 group"
              title="Launch 16:9 In-Browser Full-Screen Slide Deck"
            >
              <div className="p-1.5 rounded-xl bg-white/20 group-hover:scale-110 transition-transform">
                <Presentation size={18} />
              </div>
              <div className="text-left">
                <span className="block text-xs font-black tracking-wide uppercase">
                  Present Deck (16:9)
                </span>
                <span className="block text-[10px] text-orange-100 font-normal">
                  Boardroom Interactive Mode
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Cockpit KPI Grid & Live Radial Gauge */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800/80 items-center">
          {/* Live SVG Circular Quality Gauge */}
          <div className="md:col-span-4 bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-xs">
            <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="transparent"
                  className="text-slate-200 dark:text-slate-800"
                />
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  stroke={complianceBadge.stroke}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {overallQualityCompliance}%
                </span>
                <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Quality Index
                </span>
              </div>
            </div>

            <div className="space-y-1 text-left min-w-0">
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${complianceBadge.bg} ${complianceBadge.color}`}
              >
                {complianceBadge.label}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                Adjust overall project compliance rating:
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={overallQualityCompliance}
                  onChange={(e) =>
                    setOverallQualityCompliance(Number(e.target.value))
                  }
                  className="w-24 accent-orange-500 cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
                  {overallQualityCompliance}%
                </span>
              </div>
            </div>
          </div>

          {/* 3 Strategic Scorecard Tiles */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Tile 1: Inspections */}
            <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Field Inspections
                </span>
                <ShieldCheck size={14} className="text-emerald-500 dark:text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {report.inspectionStats?.passed || 0}/
                {report.inspectionStats?.total || 0}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                <span>Verified Passed</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                  {report.inspectionStats?.total
                    ? Math.round(
                        ((report.inspectionStats?.passed || 0) /
                          report.inspectionStats.total) *
                          100,
                      )
                    : 100}
                  %
                </span>
              </div>
            </div>

            {/* Tile 2: Open Defect NCRs */}
            <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Defect Velocity (NCRs)
                </span>
                <AlertTriangle size={14} className="text-red-500 dark:text-red-400" />
              </div>
              <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-2">
                {report.ncrStats?.openTotal || 0}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                <span>Active Remediation</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono">
                  {report.ncrRemediationLog?.length || 0} Total Logged
                </span>
              </div>
            </div>

            {/* Tile 3: Concrete Volume Cast */}
            <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Pour Volume Takeoff
                </span>
                <Layers size={14} className="text-orange-500 dark:text-orange-400" />
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-2 truncate font-mono">
                {report.totalVolumeCalculated || "243 CUM"}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                <span>Scope Completion</span>
                <span className="text-orange-600 dark:text-orange-400 font-bold font-mono">
                  {report.overallQuantityCompletion || "0%"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DOMAIN-BASED INTELLIGENCE DECK (Segmented Navigation) */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold scrollbar-none">
        {[
          {
            id: "STRATEGIC" as const,
            label: "Strategic Overview & Risks",
            badge: `${highlights ? "1" : "0"} Alert`,
          },
          {
            id: "CONCRETE_MATERIALS" as const,
            label: "Concrete & Material Vault",
            badge: `${(report.cubeTests || []).length} Cubes`,
          },
          {
            id: "STRUCTURAL_SCHEDULE" as const,
            label: "Structural Elements Schedule",
            badge: `${(report.structuralElements || []).length} Elements`,
          },
          {
            id: "SPATIAL_LAYOUTS" as const,
            label: "2D Spatial Progress Layouts",
            badge: "3 Blueprints",
          },
          {
            id: "MEP_GOVERNANCE" as const,
            label: "MEP & Quality Governance",
            badge: `${mepClearance.length} MEP / ${report.ncrRemediationLog?.length || 0} NCRs`,
          },
          {
            id: "PHOTO_EVIDENCE" as const,
            label: "Photographic Portfolio",
            badge: `${pictorialUrls.length} Photos`,
          },
          {
            id: "ISO_SIGN_OFF" as const,
            label: "Statutory ISO 9001 Sign-off",
            badge:
              typeof report.preparedBy === "object" && report.preparedBy?.signed
                ? "Certified"
                : "Pending",
          },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveDomain(tab.id)}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeDomain === tab.id
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                : "bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                activeDomain === tab.id
                  ? "bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-500"
              }`}
            >
              {tab.badge}
            </span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 3. ACTIVE DOMAIN CONTENT PANELS */}
      {/* ========================================================================= */}

      {/* DOMAIN 1: STRATEGIC OVERVIEW & RISKS */}
      {activeDomain === "STRATEGIC" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Executive Briefing & Summary Narrative
                </h3>
                <p className="text-xs text-slate-500">
                  Comprehensive synthesis of weekly progress, material
                  verifications, and statutory compliance
                </p>
              </div>
            </div>

            <textarea
              value={executiveSummary}
              onChange={(e) => setExecutiveSummary(e.target.value)}
              rows={4}
              placeholder="Enter compiler executive summary text..."
              className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Key Project Highlights */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-emerald-500/20 shadow-sm flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 size={16} />
                  <span>Key Project Highlights</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Major structural completions and approved milestones
                </p>
                <textarea
                  value={highlights}
                  onChange={(e) => setHighlights(e.target.value)}
                  rows={6}
                  placeholder="• Milestone accomplishments..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:border-emerald-500 outline-none leading-relaxed resize-none"
                />
              </div>
            </div>

            {/* Critical Risks & Concerns */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-red-500/20 shadow-sm flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle size={16} />
                  <span>Critical Risks & Concerns</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Active QA holds, defect notices, and supplier bottlenecks
                </p>
                <textarea
                  value={concerns}
                  onChange={(e) => setConcerns(e.target.value)}
                  rows={6}
                  placeholder="• Active risk items requiring intervention..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:border-red-500 outline-none leading-relaxed resize-none"
                />
              </div>
            </div>

            {/* Target Milestones Next Week */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-blue-500/20 shadow-sm flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                  <Calendar size={16} />
                  <span>Next Week Target Milestones</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Planned concrete pours, testing dates, and rebar inspections
                </p>
                <textarea
                  value={nextWeekPlan}
                  onChange={(e) => setNextWeekPlan(e.target.value)}
                  rows={6}
                  placeholder="• Scheduled targets for upcoming cycle..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:border-blue-500 outline-none leading-relaxed resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOMAIN 2: CONCRETE & MATERIAL VAULT */}
      {activeDomain === "CONCRETE_MATERIALS" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Cube Tests Table Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Compressive Strength Vault (Concrete Cube Logs)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                    BS EN 12390
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  7-Day early strength and 28-Day characteristic strength
                  conformity register
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefreshCubes}
                disabled={refreshingCubes}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 text-xs font-bold transition disabled:opacity-50"
              >
                <RefreshCw
                  size={13}
                  className={refreshingCubes ? "animate-spin" : ""}
                />
                <span>Sync Period Cubes</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="p-2.5 font-mono">Sample ID</th>
                    <th className="p-2.5">Date Cast</th>
                    <th className="p-2.5">Element Reference</th>
                    <th className="p-2.5">7-Day Break</th>
                    <th className="p-2.5">7D Status</th>
                    <th className="p-2.5">28-Day Break</th>
                    <th className="p-2.5">28D Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                  {(report.cubeTests || []).length > 0 ? (
                    (report.cubeTests || []).map((ncr: any, index: number) => (
                      <tr
                        key={index}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                          {ncr.sampleId}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">
                          {ncr.dateCast}
                        </td>
                        <td className="p-2.5 text-slate-800 dark:text-slate-200 font-sans">
                          {ncr.inscribedName}
                        </td>
                        <td className="p-2.5 text-slate-800 dark:text-slate-200">
                          {ncr.strength7Days || "Pending"}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ncr.status7Days === "PASS"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            }`}
                          >
                            {ncr.status7Days || "PENDING"}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-800 dark:text-slate-200">
                          {ncr.strength28Days || "Pending"}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ncr.status28Days === "PASS"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            }`}
                          >
                            {ncr.status28Days || "PENDING"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-slate-400 italic"
                      >
                        No concrete cube test logs logged for this surveillance
                        window.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pour Volume Takeoff & Materials Deliveries Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quantity Takeoff */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Structural Volume Scope vs Actuals
                </h4>
                <span className="text-orange-500 font-mono font-bold text-xs">
                  {(() => {
                    const raw = report.totalVolumeCalculated;
                    if (raw !== undefined && raw !== null && raw !== "") {
                      const str = String(raw).trim();
                      return str.toUpperCase().includes("CUM") ? str : `${str} CUM`;
                    }
                    const sum = (report.quantitySummary || []).reduce((acc: number, q: any) => {
                      const val =
                        typeof q.calculatedVolume === "number"
                          ? q.calculatedVolume
                          : parseFloat(String(q.scope || "").replace(/[^0-9.]/g, "")) || 0;
                      return acc + val;
                    }, 0);
                    return sum > 0 ? `${sum.toFixed(1)} CUM` : "243.0 CUM";
                  })()}
                </span>
              </div>
              <div className="space-y-3">
                {(report.quantitySummary && report.quantitySummary.length > 0
                  ? report.quantitySummary
                  : [
                      { element: "BEAM", scope: "42.6 CUM", completion: "0%" },
                      { element: "SLAB", scope: "98.9 CUM", completion: "0%" },
                      { element: "WALL", scope: "24.8 CUM", completion: "0%" },
                      { element: "STAIR", scope: "71.8 CUM", completion: "0%" },
                      { element: "COLUMN", scope: "32.6 CUM", completion: "0%" },
                    ]
                ).map((qty: any, qIdx: number) => {
                  const calcVol =
                    typeof qty.calculatedVolume === "number" && qty.calculatedVolume > 0
                      ? qty.calculatedVolume
                      : parseFloat(String(qty.scope || "").replace(/[^0-9.]/g, "")) || 0;

                  const achVol =
                    typeof qty.achievedVolume === "number" && qty.achievedVolume >= 0
                      ? qty.achievedVolume
                      : typeof qty.total === "number" && qty.total >= 0
                      ? qty.total
                      : 0;

                  let completionStr = qty.completion;
                  if (!completionStr || completionStr === "0%" || completionStr === "0") {
                    if (calcVol > 0 && achVol > 0) {
                      completionStr = `${Math.min(100, Math.round((achVol / calcVol) * 100))}%`;
                    } else if (qty.percentageTotal && qty.percentageTotal > 0) {
                      completionStr = `${Math.min(100, Math.round(qty.percentageTotal))}%`;
                    } else {
                      completionStr = completionStr || "0%";
                    }
                  }

                  const scopeStr =
                    qty.scope && String(qty.scope).trim().length > 0
                      ? String(qty.scope).toUpperCase().includes("CUM")
                        ? qty.scope
                        : `${qty.scope} CUM`
                      : `${calcVol.toFixed(1)} CUM`;

                  return (
                    <div
                      key={qIdx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {qty.element || qty.elementName || "Component"}
                        </span>
                        <span className="font-mono text-orange-600 font-bold">
                          {scopeStr} ({completionStr})
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all duration-300"
                          style={{ width: completionStr || "0%" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Material Deliveries */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Material Deliveries & Batches
                </h4>
                <button
                  type="button"
                  onClick={handleRefreshMaterials}
                  disabled={refreshingDeliveries}
                  className="text-xs text-orange-600 hover:underline font-bold flex items-center gap-1"
                >
                  <RefreshCw
                    size={11}
                    className={refreshingDeliveries ? "animate-spin" : ""}
                  />
                  <span>Sync Deliveries</span>
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {(report.materialDeliveries || []).length > 0 ? (
                  (report.materialDeliveries || []).map(
                    (mat: any, idx: number) => {
                      const st = (mat.status || mat.qaqcStatus || "APPROVED").toUpperCase();
                      const hasPartial =
                        st === "PARTIALLY ACCEPTED" ||
                        st === "PARTIALLY_ACCEPTED" ||
                        (Number(mat.quantityRejected || 0) > 0 && Number(mat.quantityAccepted || 0) > 0);
                      const isApprovedAsNoted =
                        st === "APPROVED AS NOTED" || st === "APPROVED_AS_NOTED";
                      const isRejected =
                        st === "REJECTED" || (Number(mat.quantityAccepted || 0) === 0 && Number(mat.quantityRejected || 0) > 0);
                      const isApproved =
                        (st === "APPROVED" || st === "ACCEPTED") && !hasPartial && !isRejected && !isApprovedAsNoted;

                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {mat.materialName || mat.materialDescription || "Material"}
                              </p>
                              <p className="text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                                <span>Supplier: {mat.supplier || mat.supplierName || "N/A"}</span>
                                <span>·</span>
                                <span>Date: {mat.deliveryDate || "N/A"}</span>
                                {mat.batchNumber && (
                                  <>
                                    <span>·</span>
                                    <span className="font-mono text-slate-600 dark:text-slate-400">
                                      Batch: {mat.batchNumber}
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                            <div className="text-right flex flex-col items-end shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                  hasPartial
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50"
                                    : isApprovedAsNoted
                                    ? "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-300 dark:border-sky-700/50"
                                    : isRejected
                                    ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-300 dark:border-red-700/50"
                                    : isApproved
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200"
                                }`}
                              >
                                {hasPartial
                                  ? "PARTIALLY ACCEPTED"
                                  : isApprovedAsNoted
                                  ? "APPROVED AS NOTED"
                                  : mat.status || "APPROVED"}
                              </span>
                              <p className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 mt-1">
                                {mat.quantity}
                              </p>
                            </div>
                          </div>

                          {/* Acceptance / Rejection Quantities and NCR linkage */}
                          {(mat.quantityAccepted !== undefined || (mat.quantityRejected !== undefined && mat.quantityRejected > 0)) && (
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-[10px]">
                              {mat.quantityAccepted !== undefined && (
                                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                                  <span>✓</span>
                                  <span>{mat.quantityAccepted} {mat.unit || ""} Accepted</span>
                                </span>
                              )}
                              {mat.quantityRejected !== undefined && mat.quantityRejected > 0 && (
                                <span className="text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-0.5">
                                  <span>✗</span>
                                  <span>{mat.quantityRejected} {mat.unit || ""} Rejected</span>
                                </span>
                              )}
                              {mat.ncrNumber && (
                                <span className="ml-auto px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 font-mono font-black text-[9px]">
                                  #{mat.ncrNumber}
                                </span>
                              )}
                            </div>
                          )}

                          {(mat.remarks || mat.qaqcRemarks) && (
                            <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                              Note: {mat.remarks || mat.qaqcRemarks}
                            </p>
                          )}

                          {mat.rejectionReason && (
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 italic font-medium">
                              Defect / Rejection: {mat.rejectionReason}
                            </p>
                          )}

                          {mat.deliveryNoteNumber && (
                            <p className="text-[9px] text-slate-400 font-mono">
                              DO / Note: {mat.deliveryNoteNumber}
                            </p>
                          )}
                        </div>
                      );
                    },
                  )
                ) : (
                  <p className="text-xs text-slate-400 italic text-center p-4">
                    No material delivery logs recorded for this period.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOMAIN 3: STRUCTURAL ELEMENTS SCHEDULE */}
      {activeDomain === "STRUCTURAL_SCHEDULE" && (() => {
        const structuralElements = report.structuralElements || [];
        const totalElementsCount = structuralElements.length;
        const columnElements = structuralElements.filter(
          (el: any) => (el.elementType || "").toUpperCase() === "COLUMN"
        );
        const beamElements = structuralElements.filter(
          (el: any) => (el.elementType || "").toUpperCase() === "BEAM"
        );
        const slabElements = structuralElements.filter(
          (el: any) => (el.elementType || "").toUpperCase() === "SLAB"
        );
        const wallElements = structuralElements.filter((el: any) => {
          const type = (el.elementType || "").toUpperCase();
          return (
            type === "WALL" ||
            type === "STAIR" ||
            (type !== "COLUMN" && type !== "BEAM" && type !== "SLAB")
          );
        });

        const totalDesignVol = structuralElements.reduce(
          (acc: number, el: any) => acc + Number(el.designVolume || el.volume || 0),
          0
        );
        const totalAchievedVol = structuralElements.reduce(
          (acc: number, el: any) =>
            acc + Number(el.achievedVolume || el.actualVolume || 0),
          0
        );
        const overallProgressPct =
          totalDesignVol > 0
            ? Math.round((totalAchievedVol / totalDesignVol) * 100)
            : 0;

        const filteredElements = structuralElements.filter((el: any) => {
          const type = (el.elementType || "").toUpperCase();
          let matchesType = true;
          if (elementFilterType === "COLUMN") matchesType = type === "COLUMN";
          else if (elementFilterType === "BEAM") matchesType = type === "BEAM";
          else if (elementFilterType === "SLAB") matchesType = type === "SLAB";
          else if (elementFilterType === "WALL")
            matchesType =
              type === "WALL" ||
              type === "STAIR" ||
              (type !== "COLUMN" && type !== "BEAM" && type !== "SLAB");

          const matchesSearch =
            elementSearchTerm === "" ||
            (el.elementName || "")
              .toLowerCase()
              .includes(elementSearchTerm.toLowerCase()) ||
            (el.gridLocation || "")
              .toLowerCase()
              .includes(elementSearchTerm.toLowerCase()) ||
            (el.level || "")
              .toLowerCase()
              .includes(elementSearchTerm.toLowerCase()) ||
            (el.qaqcStatus || "")
              .toLowerCase()
              .includes(elementSearchTerm.toLowerCase());

          return matchesType && matchesSearch;
        });

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* KPI Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Scope
                </span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {totalElementsCount}
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  Registered Elements
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Columns
                </span>
                <p className="text-xl font-black text-orange-600 mt-1">
                  {columnElements.length}
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  Vertical Members
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Beams
                </span>
                <p className="text-xl font-black text-blue-600 mt-1">
                  {beamElements.length}
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  Span Members
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Slabs
                </span>
                <p className="text-xl font-black text-emerald-600 mt-1">
                  {slabElements.length}
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  Suspended Bays
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Walls & Core
                </span>
                <p className="text-xl font-black text-purple-600 mt-1">
                  {wallElements.length}
                </p>
                <span className="text-[10px] text-slate-500 font-mono">
                  Shear / Stairs
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Volumetric Progress
                </span>
                <p className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
                  {overallProgressPct}%
                </p>
                <span className="text-[10px] text-orange-500 font-mono font-bold">
                  {totalAchievedVol.toFixed(1)} / {totalDesignVol.toFixed(1)} CUM
                </span>
              </div>
            </div>

            {/* Elements Table Container */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers size={16} className="text-orange-500" />
                    <span>Structural Elements Master Schedule</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-orange-50 text-orange-700 border border-orange-200 font-mono">
                      {filteredElements.length} of {totalElementsCount} Elements
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time verification of element casting, grid coordinates, and volumetric progress
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {handleRefreshElements && (
                    <button
                      type="button"
                      onClick={handleRefreshElements}
                      disabled={refreshingElements}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 text-xs font-bold transition disabled:opacity-50"
                    >
                      <RefreshCw
                        size={12}
                        className={refreshingElements ? "animate-spin" : ""}
                      />
                      <span>Sync Elements</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: "ALL" as const, label: "All Elements", count: totalElementsCount },
                    { id: "COLUMN" as const, label: "Columns", count: columnElements.length },
                    { id: "BEAM" as const, label: "Beams", count: beamElements.length },
                    { id: "SLAB" as const, label: "Slabs", count: slabElements.length },
                    { id: "WALL" as const, label: "Walls & Core", count: wallElements.length },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setElementFilterType(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                        elementFilterType === tab.id
                          ? "bg-orange-500 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          elementFilterType === tab.id
                            ? "bg-white/20 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    value={elementSearchTerm}
                    onChange={(e) => setElementSearchTerm(e.target.value)}
                    placeholder="Search element, grid, level..."
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Elements Table */}
              <div className="overflow-x-auto max-h-[600px] border border-slate-100 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 z-10">
                    <tr>
                      <th className="p-3 font-mono">Element ID</th>
                      <th className="p-3">Type / Category</th>
                      <th className="p-3">Level / Story</th>
                      <th className="p-3 font-mono">Grid Reference</th>
                      <th className="p-3 text-right">Design Vol</th>
                      <th className="p-3 text-right">Achieved Vol</th>
                      <th className="p-3 text-center">Progress %</th>
                      <th className="p-3 text-center">Status</th>
                      {handleUpdateElementVolume && <th className="p-3 text-center">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                    {filteredElements.length > 0 ? (
                      filteredElements.map((el: any, idx: number) => {
                        const dVol = Number(el.designVolume || el.volume || 0);
                        const aVol = Number(el.achievedVolume || el.actualVolume || 0);
                        const pct =
                          el.completionPercentage !== undefined
                            ? Number(el.completionPercentage)
                            : dVol > 0
                              ? Math.min(100, Math.round((aVol / dVol) * 100))
                              : 0;

                        const isComplete = pct >= 100;
                        const isPartial = pct > 0 && pct < 100;
                        const elType = (el.elementType || "").toUpperCase();

                        return (
                          <tr
                            key={el.id || el.elementName || idx}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                          >
                            <td className="p-3 font-bold text-slate-900 dark:text-white">
                              {el.elementName || el.name || `Element #${idx + 1}`}
                            </td>
                            <td className="p-3 font-sans">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  elType === "COLUMN"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                    : elType === "BEAM"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                      : elType === "SLAB"
                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                        : "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                                }`}
                              >
                                {el.elementType || "ELEMENT"}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400 font-sans">
                              {el.level || "Mezzanine"}
                            </td>
                            <td className="p-3 text-slate-800 dark:text-slate-200 font-mono">
                              {el.gridLocation || el.gridRef || "-"}
                            </td>
                            <td className="p-3 text-right text-slate-700 dark:text-slate-300 font-bold">
                              {dVol > 0 ? `${dVol.toFixed(2)} ${el.unit || "CUM"}` : "-"}
                            </td>
                            <td className="p-3 text-right font-bold text-orange-600">
                              {aVol > 0 ? `${aVol.toFixed(2)} ${el.unit || "CUM"}` : "0.00"}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      isComplete
                                        ? "bg-emerald-500"
                                        : isPartial
                                          ? "bg-orange-500"
                                          : "bg-slate-400"
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="font-bold text-[10px] w-8 text-right">
                                  {pct}%
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-center font-sans">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isComplete || el.qaqcStatus === "PASSED" || el.qaqcStatus === "APPROVED"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                    : isPartial || el.qaqcStatus === "IN_PROGRESS"
                                      ? "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300"
                                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                {el.qaqcStatus || (isComplete ? "CONFORMANT" : isPartial ? "IN PROGRESS" : "SCHEDULED")}
                              </span>
                            </td>
                            {handleUpdateElementVolume && (
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateElementVolume(el.id || el.elementName, dVol)}
                                  className="px-2 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-[10px] font-bold transition border border-orange-200"
                                >
                                  Update Cast
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={handleUpdateElementVolume ? 9 : 8}
                          className="p-8 text-center text-slate-400 italic font-sans"
                        >
                          No structural elements match the selected filter or search term.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* DOMAIN 4: 2D SPATIAL PROGRESS LAYOUTS */}
      {activeDomain === "SPATIAL_LAYOUTS" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                2D Spatial Blueprint Progress Layouts
              </h3>
              <p className="text-xs text-slate-500">
                Visual engineering layout blueprints depicting real-time status
                across Beams, Columns, and Slabs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Beams Layout Blueprint",
                  img: beamLayoutImg,
                  setter: setBeamLayoutImg,
                  target: "beam" as const,
                  desc: "Longitudinal & transverse beam layout",
                },
                {
                  title: "Columns Layout Blueprint",
                  img: columnLayoutImg,
                  setter: setColumnLayoutImg,
                  target: "column" as const,
                  desc: "Structural columns & vertical piers",
                },
                {
                  title: "Slabs Layout Blueprint",
                  img: slabImg,
                  setter: setslabImg,
                  target: "slab" as const,
                  desc: "Suspended slab bays & pour boundaries",
                },
              ].map((layout) => (
                <div
                  key={layout.target}
                  className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 shadow-xs"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                      {layout.title}
                    </h4>
                    <p className="text-[10px] text-slate-500">{layout.desc}</p>
                  </div>

                  <div className="w-full h-44 bg-slate-900 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center relative overflow-hidden group">
                    {typeof layout.img === "string" &&
                    (layout.img.startsWith("http") || layout.img.startsWith("data:")) ? (
                      <img
                        src={layout.img.startsWith("http") ? getThumbnail(layout.img, 2400) : layout.img}
                        alt={layout.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-3 text-slate-500 space-y-1">
                        <ImageIcon
                          size={28}
                          className="mx-auto text-slate-600"
                        />
                        <p className="text-[11px] font-mono">
                          No Snapshot Attached
                        </p>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 backdrop-blur-xs">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold cursor-pointer transition">
                        {uploadingImage === layout.target ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Upload size={13} />
                        )}
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, layout.target)}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => openGalleryPicker(layout.target)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
                      >
                        <Grid3x3 size={13} />
                        <span>Gallery</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500">Spatial Status:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Attached
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DOMAIN 5: MEP SERVICES & QUALITY GOVERNANCE */}
      {activeDomain === "MEP_GOVERNANCE" && (() => {
        const mergedSIs = (report.siteInstructions?.length ? report.siteInstructions : rawSiteInstructions) || [];
        const siteComments = report.siteComments || [];
        const ncrs = report.ncrRemediationLog || [];

        return (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* MEP Clearance Matrix */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <span>MEP QA/QC Clearance Matrix</span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                      {mepClearance.filter((r) => r.status === "APPROVED").length}
                      /{mepClearance.length} Approved
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Subcontractor trade clearances prior to concrete casting
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMepClearance([
                      ...mepClearance,
                      {
                        elementService: "",
                        subcontractor: "",
                        completionPct: 0,
                        status: "PENDING",
                        remarks: "",
                      },
                    ])
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-xs"
                >
                  <Plus size={13} />
                  <span>Add MEP Row</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="p-2.5">Service / Element</th>
                      <th className="p-2.5">Subcontractor Trade</th>
                      <th className="p-2.5 text-center w-24">% Complete</th>
                      <th className="p-2.5 text-center w-36">Status</th>
                      <th className="p-2.5">Remarks</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {mepClearance.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.elementService}
                            onChange={(e) => {
                              const updated = [...mepClearance];
                              updated[idx].elementService = e.target.value;
                              setMepClearance(updated);
                            }}
                            placeholder="e.g. Electrical Conduit Pipes"
                            className="w-full bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.subcontractor}
                            onChange={(e) => {
                              const updated = [...mepClearance];
                              updated[idx].subcontractor = e.target.value;
                              setMepClearance(updated);
                            }}
                            placeholder="e.g. Lead Electrical Subcontractor"
                            className="w-full bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={row.completionPct}
                            onChange={(e) => {
                              const updated = [...mepClearance];
                              updated[idx].completionPct = Math.min(
                                100,
                                Math.max(0, parseInt(e.target.value) || 0),
                              );
                              setMepClearance(updated);
                            }}
                            className="w-16 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-center font-mono font-bold"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <select
                            value={row.status}
                            onChange={(e) => {
                              const updated = [...mepClearance];
                              updated[idx].status = e.target
                                .value as MepClearanceRow["status"];
                              setMepClearance(updated);
                            }}
                            className={`w-full p-1.5 rounded-lg border text-xs font-bold ${
                              row.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : row.status === "IN PROGRESS"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="IN PROGRESS">IN PROGRESS</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="HOLD">HOLD</option>
                            <option value="REJECTED">REJECTED</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.remarks}
                            onChange={(e) => {
                              const updated = [...mepClearance];
                              updated[idx].remarks = e.target.value;
                              setMepClearance(updated);
                            }}
                            placeholder="Remarks..."
                            className="w-full bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = mepClearance.filter(
                                (_, i) => i !== idx,
                              );
                              setMepClearance(updated);
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Optional Remediation Summary Edit Block */}
            {setRemediationSummaryText && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText size={14} className="text-orange-500" />
                    <span>NCR & Directives Synthesis Narrative</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Slide Deck & Report Summary
                  </span>
                </div>
                <textarea
                  value={remediationSummaryText || ""}
                  onChange={(e) => setRemediationSummaryText(e.target.value)}
                  rows={3}
                  placeholder="Enter strategic overview of all NCR remediations, quality deviations, and directives..."
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none leading-relaxed"
                />
              </div>
            )}

            {/* NCR Register & Site Instructions Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* NCRs Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-red-500" />
                    <span>Non-Conformance Remediation Register</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-red-50 text-red-700 border border-red-200 font-mono font-bold">
                      {ncrs.length} Recorded
                    </span>
                    {handleRefreshNcrs && (
                      <button
                        type="button"
                        onClick={handleRefreshNcrs}
                        disabled={refreshingNcrs}
                        className="text-xs text-red-600 hover:underline font-bold flex items-center gap-1"
                      >
                        <RefreshCw
                          size={11}
                          className={refreshingNcrs ? "animate-spin" : ""}
                        />
                        <span>Sync NCRs</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {ncrs.length > 0 ? (
                    ncrs.map((ncr: any, idx: number) => {
                      const isClosed = (ncr.status || "").toUpperCase() === "CLOSED" || (ncr.status || "").toUpperCase() === "RESOLVED";

                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-bold font-mono text-slate-900 dark:text-white text-xs">
                                {ncr.refNo || `NCR-${idx + 1}`}
                              </span>
                              {(ncr.elementLevel || ncr.location) && (
                                <span className="ml-2 text-[10px] text-slate-500 font-sans">
                                  · {ncr.elementLevel || ncr.location}
                                </span>
                              )}
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isClosed
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                              }`}
                            >
                              {ncr.status || "OPEN"}
                            </span>
                          </div>

                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px] whitespace-pre-line">
                            {ncr.description || "No description provided."}
                          </p>

                          <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60 pt-2 gap-2">
                            <span>
                              Assigned:{" "}
                              <strong className="text-slate-700 dark:text-slate-300">
                                {ncr.assignedTrade || ncr.assignedTo || "Subcontractor"}
                              </strong>
                            </span>
                            <span>
                              Target Fix:{" "}
                              <strong className="text-slate-700 dark:text-slate-300 font-mono">
                                {ncr.targetFixDate || "TBD"}
                              </strong>
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center p-6">
                      Zero open NCRs active for this period.
                    </p>
                  )}
                </div>
              </div>

              {/* Site Instructions Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileCheck size={14} className="text-orange-500" />
                    <span>Contractual Site Instructions (SIs)</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold">
                      {mergedSIs.length} Issued
                    </span>
                    {handleRefreshSiteInstructions && (
                      <button
                        type="button"
                        onClick={handleRefreshSiteInstructions}
                        disabled={refreshingSiteInstructions}
                        className="text-xs text-orange-600 hover:underline font-bold flex items-center gap-1"
                      >
                        <RefreshCw
                          size={11}
                          className={refreshingSiteInstructions ? "animate-spin" : ""}
                        />
                        <span>Sync SIs</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {mergedSIs.length > 0 ? (
                    mergedSIs.map((si: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold font-mono text-slate-900 dark:text-white text-xs">
                              {si.instructionNumber || `SI-${idx + 1}`}
                            </span>
                            {si.stopWorkOrdered && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white tracking-wide">
                                STOP WORK
                              </span>
                            )}
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                            {si.status || "ISSUED"}
                          </span>
                        </div>

                        <p className="font-bold text-slate-900 dark:text-white text-xs">
                          {si.subject || si.title || "Site Technical Directive"}
                        </p>

                        {(si.technicalDirectives || si.description) && (
                          <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed whitespace-pre-line">
                            {si.technicalDirectives || si.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60 pt-2 gap-2">
                          <span>
                            Recipient:{" "}
                            <strong className="text-slate-700 dark:text-slate-300">
                              {si.contractorName || si.recipientName || "Main Contractor"}
                            </strong>
                          </span>
                          <span>
                            Compliance:{" "}
                            <strong className="text-slate-700 dark:text-slate-300 font-mono">
                              {si.complianceDeadline || si.dueDate || "Immediate"}
                            </strong>
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center p-6">
                      No contractual site instructions issued in this cycle.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Site Comments & Surveillance Observations Section */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare size={15} className="text-amber-500" />
                    <span>Site Quality Comments & Surveillance Logs</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-mono font-bold">
                      {siteComments.length} Notes
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Inspector observations, subcontractor non-conformities, and photographic notes
                  </p>
                </div>

                {handleRefreshSiteComments && (
                  <button
                    type="button"
                    onClick={handleRefreshSiteComments}
                    disabled={refreshingComments}
                    className="text-xs text-amber-600 hover:underline font-bold flex items-center gap-1"
                  >
                    <RefreshCw
                      size={11}
                      className={refreshingComments ? "animate-spin" : ""}
                    />
                    <span>Sync Comments</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {siteComments.length > 0 ? (
                  siteComments.map((comment: any, idx: number) => (
                    <div
                      key={comment.id || idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {comment.inspector || comment.author || "QA/QC Inspector"}
                          </span>
                          <span className="font-mono">{comment.date || "Active Cycle"}</span>
                        </div>
                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                          {comment.commentText || comment.text || comment.comment}
                        </p>
                      </div>

                      {comment.photos && comment.photos.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-200 dark:border-slate-800">
                          {comment.photos.map((photo: any, pIdx: number) => {
                            const photoUrl = typeof photo === "string" ? photo : photo?.url || photo?.thumbnailUrl || "";
                            if (!photoUrl) return null;
                            return (
                              <img
                                key={pIdx}
                                src={getThumbnail(photoUrl, 300)}
                                alt="Observation evidence"
                                className="w-12 h-12 rounded-lg object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                              />
                            );
                          })}
                        </div>
                      )}

                      {(comment.location || comment.trade) && (
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                          {comment.location && <span>Loc: {comment.location}</span>}
                          {comment.trade && <span>· Trade: {comment.trade}</span>}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="col-span-full text-xs text-slate-400 italic text-center p-6">
                    No site comments logged for this cycle.
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* DOMAIN 5: PHOTOGRAPHIC PORTFOLIO */}
      {activeDomain === "PHOTO_EVIDENCE" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Site Surveillance Photographic Evidence
                </h3>
                <p className="text-xs text-slate-500">
                  Visual audit trail documenting reinforced steel, formwork
                  alignment, and quality verification
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPictorialUrls([...pictorialUrls, { url: "", caption: "" }])
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-xs"
              >
                <Plus size={13} />
                <span>Add Viewport</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pictorialUrls.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 flex flex-col justify-between"
                >
                  <div className="w-full h-36 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative group">
                    {item.url ? (
                      <img
                        src={getThumbnail(item.url, 400)}
                        alt={item.caption || `Viewport ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-1">
                        <ImageIcon size={24} className="text-slate-600" />
                        <span className="text-[10px] font-mono">No Image</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 backdrop-blur-xs">
                      <label className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-medium cursor-pointer">
                        {uploadingImage === idx ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Upload size={12} />
                        )}
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, idx)}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => openGalleryPicker(idx)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-medium"
                      >
                        <Grid3x3 size={12} />
                        <span>Gallery</span>
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={item.caption || ""}
                    placeholder="Enter viewport caption..."
                    onChange={(e) => handleCaptionChange(idx, e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:border-orange-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DOMAIN 6: STATUTORY ISO 9001 SIGN-OFF */}
      {activeDomain === "ISO_SIGN_OFF" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                  ISO 9001:2015 Clause 9.1 & 9.3 Conformity
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  Statutory Compiler Certification & Audit Verification
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>Digitally Sealed Record</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
              I hereby certify that the structural metrics, cube test registers,
              MEP clearance logs, material quality inspections, surveillance
              notes, and directives recorded within this weekly quality dossier
              represent an accurate, uncompromised account of quality
              surveillance operations conducted across the project during this
              reporting period.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Lead Quality Compiler
                  </span>
                  <p className="text-base font-black text-slate-900 dark:text-white">
                    {compilerName}
                  </p>
                  <p className="text-xs text-orange-600 font-semibold">
                    {compilerRole}
                  </p>
                </div>

                {typeof report.preparedBy === "object" &&
                report.preparedBy?.signed ? (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Digital Cryptographic Verification
                    </span>
                    <p className="text-xs font-mono text-emerald-600 flex items-center gap-1 font-bold">
                      <CheckCircle2 size={12} />
                      Signature stored & verified on blockchain ledger
                    </p>
                  </div>
                ) : (
                  <div className="text-xs text-amber-600 flex items-center gap-1.5 font-semibold">
                    <Lock size={13} />
                    <span>Pending Digital Certification</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center items-start md:items-end border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
                {typeof report.preparedBy === "object" &&
                report.preparedBy?.signed ? (
                  <div className="space-y-2 text-left md:text-right">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs">
                      <CheckCircle2 size={16} />
                      <span>Certified by Compiler</span>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleClearSignature}
                        className="text-xs text-slate-400 hover:text-red-600 underline font-semibold"
                      >
                        Revoke Signature / Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSignAsCompiler}
                    disabled={isSigningCompiler}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                  >
                    {isSigningCompiler ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={15} />
                    )}
                    <span>Certify & Sign as Compiler</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
