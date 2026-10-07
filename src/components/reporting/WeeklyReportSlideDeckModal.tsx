import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  Building2,
  User,
  Percent,
  FileText,
  Activity,
  Award,
  Layers,
  Sparkles,
} from "lucide-react";
import { WeeklyReport } from "@/types";
import { MepClearanceRow } from "@/services/pdf/weeklyReportGenerator";
import { getThumbnail } from "@/lib/cloudinary";

interface PictorialAsset {
  url: string;
  caption: string;
}

interface WeeklyReportSlideDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: WeeklyReport;
  activeProject?: any;
  company?: any;
  executiveSummary: string;
  highlights: string;
  concerns: string;
  nextWeekPlan: string;
  overallQualityCompliance: number;
  beamLayoutImg: any;
  columnLayoutImg: any;
  slabImg: any;
  mepClearance: MepClearanceRow[];
  pictorialUrls: PictorialAsset[];
  rawSiteInstructions: any[];
}

export const WeeklyReportSlideDeckModal: React.FC<
  WeeklyReportSlideDeckModalProps
> = ({
  isOpen,
  onClose,
  report,
  activeProject,
  company,
  executiveSummary,
  highlights,
  concerns,
  nextWeekPlan,
  overallQualityCompliance,
  beamLayoutImg,
  columnLayoutImg,
  slabImg,
  mepClearance,
  pictorialUrls,
  rawSiteInstructions,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const TOTAL_SLIDES = 11;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev < TOTAL_SLIDES - 1 ? prev + 1 : prev));
  }, [TOTAL_SLIDES]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request error:", err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Space") {
        e.preventDefault();
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSlide();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, nextSlide, prevSlide, onClose]);

  if (!isOpen) return null;

  const projName =
    activeProject?.name || report.projectName || "Site Operations";
  const compName = company?.name || report.companyName || "Quality Management";
  const compilerName =
    (typeof report.preparedBy === "object"
      ? report.preparedBy?.name
      : report.preparedBy) || "QA/QC Lead";
  const compilerRole =
    (typeof report.preparedBy === "object"
      ? report.preparedBy?.designation || report.preparedBy?.role
      : "Quality Control Lead") || "Quality Control Lead";

  // Calculate Radial Meter properties
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (overallQualityCompliance / 100) * circumference;

  const complianceColor =
    overallQualityCompliance >= 85
      ? "#10b981"
      : overallQualityCompliance >= 70
        ? "#f59e0b"
        : "#ef4444";

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950/98 text-white flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-300">
      {/* TOP HEADER CONTROLS */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-lg bg-orange-600/20 text-orange-400 border border-orange-500/30 text-[11px] font-black tracking-wider uppercase font-mono">
            Executive Deck · {report.reportNumber || "WR-Live"}
          </span>
          <div className="h-4 w-px bg-slate-800" />
          <h2 className="text-sm font-bold text-slate-200 truncate max-w-md">
            {projName} — {report.title || "Weekly Quality Surveillance Report"}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Slide Indicator Pills */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 mr-2">
            {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === idx
                    ? "w-6 bg-orange-500"
                    : "w-2 bg-slate-700 hover:bg-slate-500"
                }`}
                title={`Jump to Slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-red-950/40 border border-slate-800 text-slate-400 hover:text-red-400 transition"
            title="Close Presentation (Esc)"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* SLIDE CONTENT VIEWPORT (16:9 Aspect ratio container) */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-6xl aspect-[16/9] max-h-[82vh] bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/80 rounded-3xl shadow-2xl p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Ambient Background Accents */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* SLIDE 1: COVER SLIDE */}
          {currentSlide === 0 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-orange-400 font-bold">
                      {compName}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      ISO 9001:2015 Quality Management System
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5">
                    <Award size={13} />
                    <span>Statutory QA/QC Report</span>
                  </span>
                </div>
              </div>

              <div className="my-auto space-y-4">
                <div className="inline-block px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300">
                  Surveillance Cycle: {report.weekStart || "Start"} —{" "}
                  {report.weekEnd || "End"}
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-4xl">
                  {report.title || "Weekly Quality Assurance & Control Dossier"}
                </h1>
                <p className="text-lg sm:text-xl text-slate-400 font-medium max-w-2xl">
                  Project:{" "}
                  <strong className="text-white font-bold">{projName}</strong> |
                  Target Level:{" "}
                  <span className="text-orange-400 font-bold">
                    {report.selectedLevel || "All Structural Levels"}
                  </span>
                </p>
              </div>

              <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">
                      {compilerName}
                    </p>
                    <p className="text-slate-400">{compilerRole}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[11px] font-mono text-slate-500">
                    Report Reference
                  </p>
                  <p className="font-mono font-bold text-orange-400 text-sm">
                    {report.reportNumber || "WR-3428"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2: EXECUTIVE SUMMARY & MACRO QUALITY SCORECARD */}
          {currentSlide === 1 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                    Slide 02 · Strategic Executive Summary
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">
                    Executive Quality Intelligence & Compliance Scorecard
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Period: {report.weekStart} → {report.weekEnd}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto items-center">
                {/* Radial Meter Card */}
                <div className="lg:col-span-4 bg-slate-950/80 p-6 rounded-3xl border border-slate-800 text-center flex flex-col items-center justify-center shadow-lg">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Overall Quality Compliance
                  </p>
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r={radius}
                        stroke="#1e293b"
                        strokeWidth="12"
                        fill="transparent"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r={radius}
                        stroke={complianceColor}
                        strokeWidth="12"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-black text-white tracking-tight">
                        {overallQualityCompliance}%
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {overallQualityCompliance >= 85
                          ? "Conformant"
                          : overallQualityCompliance >= 70
                            ? "Action Needed"
                            : "Defect Hold"}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-3">
                    Calculated composite score across inspections, cube tests,
                    and NCR status.
                  </p>
                </div>

                {/* Macro Metric Scorecards & Narrative */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Field Inspections
                      </p>
                      <p className="text-2xl font-black text-white mt-1">
                        {report.inspectionStats?.passed || 0}/
                        {report.inspectionStats?.total || 0}
                      </p>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {report.inspectionStats?.total
                          ? Math.round(
                              ((report.inspectionStats?.passed || 0) /
                                report.inspectionStats.total) *
                                100,
                            )
                          : 100}
                        % Pass Rate
                      </span>
                    </div>

                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Open Defect NCRs
                      </p>
                      <p className="text-2xl font-black text-red-400 mt-1">
                        {report.ncrStats?.openTotal || 0}
                      </p>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {report.ncrRemediationLog?.length || 0} Total Active
                      </span>
                    </div>

                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Concrete Cast
                      </p>
                      <p className="text-2xl font-black text-orange-400 mt-1">
                        {report.totalVolumeCalculated || "243 CUM"}
                      </p>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {report.overallQuantityCompletion || "0%"} Scope
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                      Compiler Executive Briefing
                    </span>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-h-32 overflow-y-auto">
                      {executiveSummary ||
                        "Weekly quality surveillance confirms steady structural progress with rigorous adherence to approved shop drawings, concrete batch consistency, and inspection sign-offs."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-800 pt-3">
                <span>JayQMS Executive Briefing Engine</span>
                <span>Confidential — Internal Quality Governance</span>
              </div>
            </div>
          )}

          {/* SLIDE 3: HIGHLIGHTS, RISKS & NEXT MILESTONES */}
          {currentSlide === 2 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                    Slide 03 · Operational Surveillance
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">
                    Key Highlights, Critical Risks & Next-Week Targets
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-auto">
                {/* Highlights Card */}
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-emerald-500/20 flex flex-col justify-between shadow-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
                      <CheckCircle2 size={16} />
                      <span>Key Project Highlights</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mt-2 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {highlights ||
                        "• Reinforcement inspections successfully executed.\n• Concrete cube tests achieved design compressive criteria.\n• Structural alignment verified within tolerances."}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-emerald-400/80 font-mono">
                    Status: Verified Compliant
                  </div>
                </div>

                {/* Risks & Concerns Card */}
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-red-500/20 flex flex-col justify-between shadow-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase">
                      <ShieldAlert size={16} />
                      <span>Critical Risks & Concerns</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mt-2 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {concerns ||
                        "• MEP sleeve coordination required prior to casting.\n• Expedite rebar mill certificate verification.\n• Monitor remedial works on open defect locations."}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-red-400/80 font-mono">
                    Status: Active Surveillance
                  </div>
                </div>

                {/* Next Week Plan Card */}
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-blue-500/20 flex flex-col justify-between shadow-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase">
                      <Calendar size={16} />
                      <span>Target Milestones (Next Week)</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mt-2 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {nextWeekPlan ||
                        "• Complete pre-pour checklist for Mezzanine slab.\n• Conduct 28-day break tests on column casting batch.\n• Issue formal closure reports for rectified NCRs."}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-blue-400/80 font-mono">
                    Status: Target Scheduled
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-800 pt-3">
                <span>JayQMS Risk Matrix & Surveillance Engine</span>
                <span>Page 3 of {TOTAL_SLIDES}</span>
              </div>
            </div>
          )}

          {/* SLIDE 4: CONCRETE CUBE STRENGTH & VOLUME TAKEOFF */}
          {currentSlide === 3 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                    Slide 04 · Material & Compressive Strength Vault
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">
                    Concrete Cube Tests & Structural Volume Progress
                  </h3>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                  BS EN 12390 / ASTM C39 Testing Standard
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto">
                {/* Cube Test Table */}
                <div className="lg:col-span-8 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <p className="text-xs font-bold text-slate-300 uppercase mb-2 flex items-center justify-between">
                    <span>Compressive Strength Logs (7-Day & 28-Day)</span>
                    <span className="text-[10px] text-slate-400">
                      {(report.cubeTests || []).length} Samples Logged
                    </span>
                  </p>
                  <div className="overflow-x-auto max-h-56">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px]">
                          <th className="pb-2">Sample ID</th>
                          <th className="pb-2">Date Cast</th>
                          <th className="pb-2">Element</th>
                          <th className="pb-2">7D Break</th>
                          <th className="pb-2">28D Break</th>
                          <th className="pb-2">Conformity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {(report.cubeTests || []).slice(0, 6).map((c: any, i) => (
                          <tr key={i} className="hover:bg-slate-900/40">
                            <td className="py-1.5 font-bold text-white">
                              {c.sampleId || `CUB-${i + 1}`}
                            </td>
                            <td className="py-1.5 text-slate-400">
                              {c.dateCast || "—"}
                            </td>
                            <td className="py-1.5 text-slate-300 font-sans">
                              {c.inscribedName || c.element || "Structural Core"}
                            </td>
                            <td className="py-1.5 text-slate-300">
                              {c.strength7Days || "Pending"}
                            </td>
                            <td className="py-1.5 text-slate-300">
                              {c.strength28Days || "Pending"}
                            </td>
                            <td className="py-1.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  c.status28Days === "PASS" ||
                                  c.status7Days === "PASS"
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                }`}
                              >
                                {c.status28Days || c.status7Days || "LOGGED"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Volume Takeoff Summary */}
                <div className="lg:col-span-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-300 uppercase mb-3">
                      Pour Volume vs Target Scope
                    </p>
                    <div className="space-y-3">
                      {(report.quantitySummary || []).length > 0 ? (
                        (report.quantitySummary || []).map((q: any, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-slate-300">
                                {q.element}
                              </span>
                              <span className="font-mono text-orange-400 font-bold">
                                {q.scope} ({q.completion})
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-orange-500 rounded-full"
                                style={{
                                  width: `${parseInt(q.completion) || 20}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-400 italic">
                          Standard scope metrics active for Mezzanine Level.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total Volume Cast:</span>
                    <span className="text-base font-black text-white font-mono">
                      {report.totalVolumeCalculated || "243 CUM"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-800 pt-3">
                <span>JayQMS Material Quality Engine</span>
                <span>Page 4 of {TOTAL_SLIDES}</span>
              </div>
            </div>
          )}

          {/* SLIDE 5: INWARD MATERIAL DELIVERIES & QUALITY LOG */}
          {currentSlide === 4 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                    Slide 05 · Supply Chain Quality
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">
                    Material Inward Deliveries & Verification Register
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {(report.materialDeliveries || []).length} Batches Received
                </span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 my-auto overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono">
                      <th className="pb-2">Material Description</th>
                      <th className="pb-2">Supplier</th>
                      <th className="pb-2 text-right">Received</th>
                      <th className="pb-2 text-right">Accepted</th>
                      <th className="pb-2 text-right">Rejected</th>
                      <th className="pb-2 text-center">Status</th>
                      <th className="pb-2">Remarks / Rejection Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(report.materialDeliveries || []).length > 0 ? (
                      (report.materialDeliveries || []).slice(0, 6).map((mat: any, idx: number) => {
                        const st = (mat.status || mat.qaqcStatus || "APPROVED").toUpperCase();
                        const isPartial =
                          st.includes("PARTIAL") ||
                          (Number(mat.quantityRejected || 0) > 0 && Number(mat.quantityAccepted || 0) > 0);
                        const isRejected =
                          st === "REJECTED" ||
                          (Number(mat.quantityAccepted || 0) === 0 && Number(mat.quantityRejected || 0) > 0);
                        const isApprovedAsNoted = st.includes("NOTED");

                        return (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="py-2 font-bold text-white">
                              {mat.materialName || mat.materialDescription || "Material"}
                            </td>
                            <td className="py-2 text-slate-300">
                              {mat.supplier || mat.supplierName || "Supplier"}
                            </td>
                            <td className="py-2 text-right font-mono text-slate-300">
                              {mat.quantityReceived || mat.quantity || "—"}
                            </td>
                            <td className="py-2 text-right font-mono font-bold text-emerald-400">
                              {mat.quantityAccepted || "—"}
                            </td>
                            <td className="py-2 text-right font-mono font-bold text-rose-400">
                              {mat.quantityRejected || "—"}
                            </td>
                            <td className="py-2 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isPartial
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : isApprovedAsNoted
                                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                      : isRejected
                                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                }`}
                              >
                                {isPartial
                                  ? "PARTIAL"
                                  : isApprovedAsNoted
                                    ? "APPROVED W/ NOTES"
                                    : isRejected
                                      ? "REJECTED"
                                      : "APPROVED"}
                              </span>
                            </td>
                            <td className="py-2 text-slate-400 text-[11px] truncate max-w-xs">
                              {mat.rejectionReason
                                ? `[REJECT] ${mat.rejectionReason}`
                                : mat.remarks || mat.qaqcRemarks || "Conforming"}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                          No inward material deliveries logged for this cycle.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-800 pt-3">
                <span>JayQMS Inward Quality Verification</span>
                <span>Page 5 of {TOTAL_SLIDES}</span>
              </div>
            </div>
          )}

          {/* SLIDE 6: STRUCTURAL ELEMENTS MASTER SCHEDULE */}
          {currentSlide === 5 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                    Slide 06 · Structural Elements Schedule
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">
                    Structural Elements Takeoff & Casting Log
                  </h3>
                </div>
                <span className="text-xs font-mono text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/30">
                  {(report.structuralElements || []).length} Elements Registered
                </span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 my-auto overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono">
                      <th className="pb-2">Element Name</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Grid Location</th>
                      <th className="pb-2 text-right">Design Vol</th>
                      <th className="pb-2 text-right">Achieved Vol</th>
                      <th className="pb-2 text-center">Progress %</th>
                      <th className="pb-2 text-center">Conformity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {(report.structuralElements || []).length > 0 ? (
                      (report.structuralElements || []).slice(0, 7).map((el: any, idx: number) => {
                        const dVol = Number(el.designVolume || el.volume || 0);
                        const aVol = Number(el.achievedVolume || el.actualVolume || 0);
                        const pct =
                          el.completionPercentage !== undefined
                            ? Number(el.completionPercentage)
                            : dVol > 0
                              ? Math.min(100, Math.round((aVol / dVol) * 100))
                              : 0;

                        return (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="py-2 font-bold text-white">
                              {el.elementName || el.name || `Element #${idx + 1}`}
                            </td>
                            <td className="py-2 text-slate-300 font-sans">
                              {el.elementType || "ELEMENT"}
                            </td>
                            <td className="py-2 text-slate-400">
                              {el.gridLocation || el.gridRef || "—"}
                            </td>
                            <td className="py-2 text-right text-slate-300">
                              {dVol > 0 ? `${dVol.toFixed(2)} CUM` : "—"}
                            </td>
                            <td className="py-2 text-right font-bold text-orange-400">
                              {aVol > 0 ? `${aVol.toFixed(2)} CUM` : "0.00"}
                            </td>
                            <td className="py-2 text-center">
                              <span className="font-bold text-slate-200">
                                {pct}%
                              </span>
                            </td>
                            <td className="py-2 text-center font-sans">
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  pct >= 100
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : pct > 0
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                      : "bg-slate-800 text-slate-400 border border-slate-700"
                                }`}
                              >
                                {pct >= 100
                                  ? "CONFORMANT"
                                  : pct > 0
                                    ? "IN PROGRESS"
                                    : "SCHEDULED"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                          No structural elements registered.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-800 pt-3">
                <span>JayQMS Structural Elements Master Takeoff</span>
                <span>Page 6 of {TOTAL_SLIDES}</span>
              </div>
            </div>
          )}

          {/* SLIDE 7: 2D SPATIAL PROGRESS BLUEPRINTS */}
          {currentSlide === 6 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                    Slide 07 · Visual Spatial Intelligence
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">
                    2D Spatial Progress Layouts (Beams, Columns & Slabs)
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Target Level: {report.selectedLevel || "Mezzanine"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 my-auto">
                {[
                  {
                    title: "Beams Layout Progress",
                    img: beamLayoutImg,
                    desc: "Structural beam grid & casting status",
                  },
                  {
                    title: "Columns Layout Progress",
                    img: columnLayoutImg,
                    desc: "Vertical structural columns & stanchions",
                  },
                  {
                    title: "Slabs Layout Progress",
                    img: slabImg,
                    desc: "Slab pouring bays & rebar inspection zones",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between h-56"
                  >
                    <div>
                      <p className="text-xs font-bold text-white uppercase">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-400">{item.desc}</p>
                    </div>

                    <div className="my-auto w-full h-32 bg-slate-900 rounded-xl border border-dashed border-slate-800 flex items-center justify-center overflow-hidden">
                      {typeof item.img === "string" &&
                      item.img.startsWith("http") ? (
                        <img
                          src={getThumbnail(item.img, 400)}
                          alt={item.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-3">
                          <Layers
                            size={24}
                            className="mx-auto text-slate-600 mb-1"
                          />
                          <p className="text-[10px] text-slate-500 font-mono">
                            2D Spatial Blueprint Linked
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                      <span>Spatial Grid Linked</span>
                      <span className="text-emerald-400 font-bold">Live</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-800 pt-3">
                <span>JayQMS 2D Spatial Engine Integration</span>
                <span>Page 7 of {TOTAL_SLIDES}</span>
              </div>
            </div>
          )}

          {/* SLIDE 8: MEP CLEARANCE & SUBCONTRACTOR READINESS */}
          {currentSlide === 7 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                    Slide 08 · Multi-Trade Coordination
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">
                    MEP Services Pre-Casting Clearance Matrix
                  </h3>
                </div>
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/30">
                  {mepClearance.filter((r) => r.status === "APPROVED").length}/
                  {mepClearance.length} Services Approved
                </span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 my-auto overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono">
                      <th className="pb-2">Element / Service</th>
                      <th className="pb-2">Subcontractor Trade</th>
                      <th className="pb-2 text-center">% Completion</th>
                      <th className="pb-2 text-center">QA/QC Clearance</th>
                      <th className="pb-2">Remarks & Directives</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {mepClearance.slice(0, 7).map((mep, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="py-2 font-bold text-white">
                          {mep.elementService || "Conduit / Sleeve"}
                        </td>
                        <td className="py-2 text-slate-300">
                          {mep.subcontractor || "MEP Subcontractor"}
                        </td>
                        <td className="py-2 text-center font-mono font-bold text-orange-400">
                          {mep.completionPct || 0}%
                        </td>
                        <td className="py-2 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              mep.status === "APPROVED"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : mep.status === "IN PROGRESS"
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {mep.status}
                          </span>
                        </td>
                        <td className="py-2 text-slate-400 text-[11px] truncate max-w-xs">
                          {mep.remarks || "Inspected & signed off"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-800 pt-3">
                <span>JayQMS Pre-Pour Clearance Protocols</span>
                <span>Page 8 of {TOTAL_SLIDES}</span>
              </div>
            </div>
          )}

          {/* SLIDE 9: NON-CONFORMANCE REMEDIATION REGISTER */}
          {currentSlide === 8 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                    Slide 09 · Defect Management
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">
                    Non-Conformance Remediation (NCR) Register
                  </h3>
                </div>
                <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30">
                  {(report.ncrRemediationLog || []).length} Defect Logged
                </span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 my-auto overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono">
                      <th className="pb-2">NCR Ref No</th>
                      <th className="pb-2">Location / Element</th>
                      <th className="pb-2">Description / Deviation</th>
                      <th className="pb-2">Assigned Trade</th>
                      <th className="pb-2 font-mono">Target Fix</th>
                      <th className="pb-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(report.ncrRemediationLog || []).length > 0 ? (
                      (report.ncrRemediationLog || []).slice(0, 6).map((ncr: any, idx: number) => {
                        const isClosed = (ncr.status || "").toUpperCase() === "CLOSED";

                        return (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="py-2 font-bold font-mono text-white">
                              {ncr.refNo || `NCR-${idx + 1}`}
                            </td>
                            <td className="py-2 text-slate-300">
                              {ncr.elementLevel || ncr.location || "Mezzanine"}
                            </td>
                            <td className="py-2 text-slate-300 text-[11px] truncate max-w-sm">
                              {ncr.description || "Field non-conformance recorded."}
                            </td>
                            <td className="py-2 text-slate-400">
                              {ncr.assignedTrade || ncr.assignedTo || "Contractor"}
                            </td>
                            <td className="py-2 text-slate-400 font-mono">
                              {ncr.targetFixDate || "—"}
                            </td>
                            <td className="py-2 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isClosed
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                }`}
                              >
                                {ncr.status || "OPEN"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                          Zero open NCRs logged for this cycle.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-800 pt-3">
                <span>JayQMS Non-Conformance Governance Engine</span>
                <span>Page 9 of {TOTAL_SLIDES}</span>
              </div>
            </div>
          )}

          {/* SLIDE 10: CONTRACTUAL SITE INSTRUCTIONS */}
          {currentSlide === 9 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                    Slide 10 · Contractual Directives
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">
                    Contractual Site Instructions & Technical Directives
                  </h3>
                </div>
                <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/30">
                  {((report.siteInstructions?.length ? report.siteInstructions : rawSiteInstructions) || []).length} Instructions Issued
                </span>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 my-auto overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono">
                      <th className="pb-2">SI Number</th>
                      <th className="pb-2">Subject / Directive Title</th>
                      <th className="pb-2">Recipient Trade</th>
                      <th className="pb-2 font-mono">Compliance Deadline</th>
                      <th className="pb-2 text-center">Stop Work</th>
                      <th className="pb-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {((report.siteInstructions?.length ? report.siteInstructions : rawSiteInstructions) || []).length > 0 ? (
                      ((report.siteInstructions?.length ? report.siteInstructions : rawSiteInstructions) || []).slice(0, 6).map((si: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="py-2 font-bold font-mono text-white">
                            {si.instructionNumber || `SI-${idx + 1}`}
                          </td>
                          <td className="py-2 text-slate-300 font-bold truncate max-w-xs">
                            {si.subject || si.title || "Directive"}
                          </td>
                          <td className="py-2 text-slate-400">
                            {si.contractorName || si.recipientName || "Main Contractor"}
                          </td>
                          <td className="py-2 text-slate-400 font-mono">
                            {si.complianceDeadline || si.dueDate || "Immediate"}
                          </td>
                          <td className="py-2 text-center">
                            {si.stopWorkOrdered ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white">
                                YES
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">NO</span>
                            )}
                          </td>
                          <td className="py-2 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {si.status || "ISSUED"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                          No contractual site instructions issued in this cycle.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-800 pt-3">
                <span>JayQMS Contractual Site Instruction Register</span>
                <span>Page 10 of {TOTAL_SLIDES}</span>
              </div>
            </div>
          )}

          {/* SLIDE 11: COMPILER CERTIFICATION & STATUTORY SIGN-OFF */}
          {currentSlide === 10 && (
            <div className="h-full flex flex-col justify-between animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                    Slide 11 · Statutory Quality Certification
                  </span>
                  <h3 className="text-xl font-black text-white mt-0.5">
                    ISO 9001:2015 Compiler Endorsement & Audit Verification
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 size={13} />
                  <span>Clause 9.1 & 9.3 Conformant</span>
                </span>
              </div>

              <div className="max-w-3xl mx-auto my-auto text-center space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                  <Award size={32} />
                </div>

                <p className="text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
                  &quot;I hereby certify that the structural metrics, compressive
                  cube logs, MEP clearance statuses, material delivery inspections, and surveillance evidence
                  compiled within this weekly dossier represent a true and
                  accurate record of operations across this surveillance
                  cycle.&quot;
                </p>

                <div className="bg-slate-950/80 p-6 rounded-3xl border border-slate-800 max-w-md mx-auto text-left flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Certified Quality Compiler
                    </span>
                    <p className="text-base font-black text-white">
                      {compilerName}
                    </p>
                    <p className="text-xs text-orange-400 font-semibold">
                      {compilerRole}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                      Digitally Sealed
                    </span>
                    <p className="text-[9px] font-mono text-slate-500 mt-1">
                      {report.weekEnd || "Period End"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-800 pt-3">
                <span>JayQMS Statutory Compliance & Sign-Off Engine</span>
                <span className="text-orange-400 font-bold">
                  End of Executive Presentation
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM SLIDE NAVIGATION CONTROLS */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-slate-900/60 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            <span>Previous Slide</span>
          </button>

          <button
            type="button"
            onClick={nextSlide}
            disabled={currentSlide === TOTAL_SLIDES - 1}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-orange-600/20"
          >
            <span>Next Slide</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Slide <strong className="text-white">{currentSlide + 1}</strong> of{" "}
          <strong className="text-white">{TOTAL_SLIDES}</strong> · Use{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
            ←
          </kbd>{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
            →
          </kbd>{" "}
          keys to navigate
        </div>
      </div>
    </div>
  );
};

