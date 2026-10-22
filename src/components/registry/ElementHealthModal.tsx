import React, { useState, useMemo } from "react";
import {
  StructuralElement,
  ProjectLevel,
  WorkPackage,
  NonConformanceReport,
} from "@/types";
import {
  auditStructuralElements,
  ElementDiagnosticIssue,
  ElementIssueType,
  calculatePureGeometricVolume,
} from "@/lib/elementDiagnostics";
import { calculateElementElevations } from "@/lib/elementCalculations";
import { dbService } from "@/lib/db";
import {
  X,
  Activity,
  AlertTriangle,
  AlertOctagon,
  Info,
  Wrench,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronRight,
  Ruler,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface ElementHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: StructuralElement[];
  levels: ProjectLevel[];
  packages: WorkPackage[];
  ncrs: NonConformanceReport[];
  onElementsUpdated: () => void;
}

export const ElementHealthModal: React.FC<ElementHealthModalProps> = ({
  isOpen,
  onClose,
  elements,
  levels,
  packages,
  ncrs,
  onElementsUpdated,
}) => {
  const [selectedTab, setSelectedTab] = useState<"ALL" | ElementIssueType>("ALL");
  const [isFixing, setIsFixing] = useState(false);
  const [search, setSearch] = useState("");

  const audit = useMemo(() => {
    return auditStructuralElements(elements, levels, packages, ncrs);
  }, [elements, levels, packages, ncrs]);

  if (!isOpen) return null;

  const filteredIssues = audit.issues.filter((iss) => {
    if (selectedTab !== "ALL" && iss.issueType !== selectedTab) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        iss.elementName.toLowerCase().includes(q) ||
        iss.title.toLowerCase().includes(q) ||
        iss.description.toLowerCase().includes(q) ||
        (iss.levelName && iss.levelName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Fix Single Issue
  const handleFixSingleIssue = async (issue: ElementDiagnosticIssue) => {
    const target = elements.find((e) => e.id === issue.elementId);
    if (!target) return;

    setIsFixing(true);
    try {
      let updated: StructuralElement = { ...target };

      if (issue.issueType === "ZERO_VOLUME" || issue.issueType === "VOLUME_MISMATCH") {
        const pureVol = calculatePureGeometricVolume(target);
        const newAch =
          target.status === "POURED" || target.status === "APPROVED"
            ? pureVol
            : target.achievedVolume || 0;
        updated = {
          ...target,
          calculatedVolume: pureVol,
          volume: pureVol,
          achievedVolume: newAch,
          updatedAt: new Date().toISOString(),
        };
      } else if (issue.issueType === "ACHIEVED_VOLUME_MISMATCH") {
        const isCompleted = target.status === "POURED" || target.status === "APPROVED";
        const vol = target.calculatedVolume || calculatePureGeometricVolume(target);
        updated = {
          ...target,
          achievedVolume: isCompleted ? vol : 0,
          updatedAt: new Date().toISOString(),
        };
      } else if (issue.issueType === "MISSING_GRADE") {
        updated = {
          ...target,
          concreteGrade: "C35/45",
          updatedAt: new Date().toISOString(),
        };
      } else if (issue.issueType === "DUPLICATE_NAME") {
        updated = {
          ...target,
          elementName: issue.suggestedValue || `${target.elementName}-rev`,
          updatedAt: new Date().toISOString(),
        };
      } else if (issue.issueType === "ORPHAN_LEVEL") {
        if (levels.length > 0) {
          const fallbackLvl = levels[0];
          updated = {
            ...target,
            levelId: fallbackLvl.id,
            levelName: fallbackLvl.name,
            updatedAt: new Date().toISOString(),
          };
        }
      } else if (issue.issueType === "ELEVATION_MISMATCH") {
        const lvl = levels.find((l) => l.id === target.levelId);
        if (lvl) {
          const elevs = calculateElementElevations(target, lvl.elevation);
          updated = {
            ...target,
            elevation: elevs.elevation,
            topElevation: elevs.topElevation,
            bottomElevation: elevs.bottomElevation,
            gridZ: elevs.gridZ,
            updatedAt: new Date().toISOString(),
          };
        }
      }

      await dbService.saveElement(updated);
      toast.success(`Fixed issue for "${target.elementName}"`);
      onElementsUpdated();
    } catch (err) {
      console.error(err);
      toast.error("Failed to repair element issue.");
    } finally {
      setIsFixing(false);
    }
  };

  // Batch Auto-Fix All Volume Discrepancies
  const handleBatchFixVolumes = async () => {
    const volIssues = [
      ...audit.issuesByType.ZERO_VOLUME,
      ...audit.issuesByType.VOLUME_MISMATCH,
    ];
    if (volIssues.length === 0) {
      toast.success("No volume issues detected.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you wish to automatically recalculate and update volumes for ${volIssues.length} element(s)?`,
      )
    )
      return;

    setIsFixing(true);
    try {
      const fixedMap = new Map<string, StructuralElement>();

      volIssues.forEach((iss) => {
        const el = elements.find((e) => e.id === iss.elementId);
        if (!el) return;
        const pureVol = calculatePureGeometricVolume(el);
        const isCompleted = el.status === "POURED" || el.status === "APPROVED";
        fixedMap.set(el.id, {
          ...el,
          calculatedVolume: pureVol,
          volume: pureVol,
          achievedVolume: isCompleted ? pureVol : el.achievedVolume || 0,
          updatedAt: new Date().toISOString(),
        });
      });

      await Promise.all(
        Array.from(fixedMap.values()).map((el) => dbService.saveElement(el)),
      );

      toast.success(`Successfully repaired ${fixedMap.size} element volumes!`);
      onElementsUpdated();
    } catch (err) {
      console.error(err);
      toast.error("Failed to batch repair volumes.");
    } finally {
      setIsFixing(false);
    }
  };

  // Batch Sync Achieved Volumes with Status
  const handleBatchSyncAchieved = async () => {
    const achIssues = audit.issuesByType.ACHIEVED_VOLUME_MISMATCH;
    if (achIssues.length === 0) {
      toast.success("All achieved volumes are synchronized.");
      return;
    }

    setIsFixing(true);
    try {
      const updates = achIssues.map((iss) => {
        const el = elements.find((e) => e.id === iss.elementId)!;
        const isCompleted = el.status === "POURED" || el.status === "APPROVED";
        const vol = el.calculatedVolume || calculatePureGeometricVolume(el);
        return {
          ...el,
          achievedVolume: isCompleted ? vol : 0,
          updatedAt: new Date().toISOString(),
        };
      });

      await Promise.all(updates.map((el) => dbService.saveElement(el)));
      toast.success(`Synchronized achieved volume on ${updates.length} elements!`);
      onElementsUpdated();
    } catch (err) {
      console.error(err);
      toast.error("Failed to synchronize achieved volumes.");
    } finally {
      setIsFixing(false);
    }
  };

  // Batch Fix Missing Concrete Grades
  const handleBatchFixGrades = async () => {
    const gradeIssues = audit.issuesByType.MISSING_GRADE;
    if (gradeIssues.length === 0) return;

    setIsFixing(true);
    try {
      const updates = gradeIssues.map((iss) => {
        const el = elements.find((e) => e.id === iss.elementId)!;
        return {
          ...el,
          concreteGrade: "C35/45",
          updatedAt: new Date().toISOString(),
        };
      });

      await Promise.all(updates.map((el) => dbService.saveElement(el)));
      toast.success(`Assigned standard concrete grade (C35/45) to ${updates.length} elements!`);
      onElementsUpdated();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update concrete grades.");
    } finally {
      setIsFixing(false);
    }
  };

  // Batch Fix Elevation Mismatches
  const handleBatchFixElevations = async () => {
    const elevIssues = audit.issuesByType.ELEVATION_MISMATCH || [];
    if (elevIssues.length === 0) {
      toast.success("All element elevations match their level datums.");
      return;
    }

    if (
      !window.confirm(
        `Automatically recalculate and reset elevations for ${elevIssues.length} element(s) to their respective level datums (preserving individual elevation offsets)?`
      )
    )
      return;

    setIsFixing(true);
    try {
      const fixedMap = new Map<string, StructuralElement>();

      elevIssues.forEach((iss) => {
        const el = elements.find((e) => e.id === iss.elementId);
        if (!el) return;
        const lvl = levels.find((l) => l.id === el.levelId);
        if (!lvl) return;
        const elevs = calculateElementElevations(el, lvl.elevation);
        fixedMap.set(el.id, {
          ...el,
          elevation: elevs.elevation,
          topElevation: elevs.topElevation,
          bottomElevation: elevs.bottomElevation,
          gridZ: elevs.gridZ,
          updatedAt: new Date().toISOString(),
        });
      });

      await Promise.all(
        Array.from(fixedMap.values()).map((el) => dbService.saveElement(el))
      );

      toast.success(`Successfully resynced elevations for ${fixedMap.size} element(s)!`);
      onElementsUpdated();
    } catch (err) {
      console.error(err);
      toast.error("Failed to batch repair elevations.");
    } finally {
      setIsFixing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-500 stroke-emerald-500";
    if (score >= 70) return "text-amber-500 stroke-amber-500";
    return "text-red-500 stroke-red-500";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                Structural Health Doctor &amp; Auto-Fixer
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                  Jay-QMS AI Engine
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audits structural geometry, volumes, status reconciliations, and QA/QC integrity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Health Score & Quick Metrics Banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-100 dark:border-slate-800">
          {/* Health Gauge */}
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 dark:text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={getScoreColor(audit.healthScore)}
                  strokeDasharray={`${audit.healthScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-black text-xs text-slate-800 dark:text-slate-100">
                {audit.healthScore}%
              </span>
            </div>
            <div>
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                Overall Health
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {audit.healthScore >= 90
                  ? "Audit Ready"
                  : audit.healthScore >= 70
                  ? "Attention Needed"
                  : "Critical Errors"}
              </div>
              <div className="text-[10px] text-slate-500">
                {audit.healthyElements} / {audit.totalElements} elements clean
              </div>
            </div>
          </div>

          {/* Metric 1: Critical */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-red-200/70 dark:border-red-950/50 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black text-red-500 uppercase tracking-wider">
                Critical Issues
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {audit.criticalCount}
              </div>
              <div className="text-[10px] text-slate-500">Zero volumes &amp; NCR holds</div>
            </div>
          </div>

          {/* Metric 2: Warnings */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-200/70 dark:border-amber-950/50 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black text-amber-500 uppercase tracking-wider">
                Warnings
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {audit.warningCount}
              </div>
              <div className="text-[10px] text-slate-500">Volume &amp; status variance</div>
            </div>
          </div>

          {/* Metric 3: Info & Notices */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Metadata Gaps
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {audit.infoCount}
              </div>
              <div className="text-[10px] text-slate-500">Missing grid or grade</div>
            </div>
          </div>
        </div>

        {/* Batch Auto-Fix Quick Toolbar */}
        <div className="px-6 py-3 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100/60 dark:border-indigo-900/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wide">
              One-Click Batch Repairs:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBatchFixVolumes}
              disabled={
                isFixing ||
                (audit.issuesByType.ZERO_VOLUME.length === 0 &&
                  audit.issuesByType.VOLUME_MISMATCH.length === 0)
              }
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFixing ? "animate-spin" : ""}`} />
              Recalculate All Volumes (
              {audit.issuesByType.ZERO_VOLUME.length +
                audit.issuesByType.VOLUME_MISMATCH.length}
              )
            </button>

            <button
              onClick={handleBatchSyncAchieved}
              disabled={isFixing || audit.issuesByType.ACHIEVED_VOLUME_MISMATCH.length === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-cyan-50 dark:hover:bg-cyan-950 text-cyan-700 dark:text-cyan-400 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sync Achieved Volumes (
              {audit.issuesByType.ACHIEVED_VOLUME_MISMATCH.length})
            </button>

            <button
              onClick={handleBatchFixGrades}
              disabled={isFixing || audit.issuesByType.MISSING_GRADE.length === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-emerald-700 dark:text-emerald-400 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              Assign Default Grade C35/45 ({audit.issuesByType.MISSING_GRADE.length})
            </button>

            <button
              onClick={handleBatchFixElevations}
              disabled={isFixing || (audit.issuesByType.ELEVATION_MISMATCH?.length || 0) === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-sky-50 dark:hover:bg-sky-950 text-sky-700 dark:text-sky-400 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              title="Recalculate elevations to level datums + offsets"
            >
              <Ruler className="w-3.5 h-3.5" />
              Sync Elevations ({audit.issuesByType.ELEVATION_MISMATCH?.length || 0})
            </button>
          </div>
        </div>

        {/* Tab Filters & Search */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedTab("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedTab === "ALL"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              All Issues ({audit.issues.length})
            </button>
            <button
              onClick={() => setSelectedTab("ZERO_VOLUME")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedTab === "ZERO_VOLUME"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Zero Volumes ({audit.issuesByType.ZERO_VOLUME.length})
            </button>
            <button
              onClick={() => setSelectedTab("VOLUME_MISMATCH")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedTab === "VOLUME_MISMATCH"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Volume Mismatches ({audit.issuesByType.VOLUME_MISMATCH.length})
            </button>
            <button
              onClick={() => setSelectedTab("ACHIEVED_VOLUME_MISMATCH")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedTab === "ACHIEVED_VOLUME_MISMATCH"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Status Sync ({audit.issuesByType.ACHIEVED_VOLUME_MISMATCH.length})
            </button>
            <button
              onClick={() => setSelectedTab("ORPHAN_LEVEL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedTab === "ORPHAN_LEVEL"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Orphan Levels ({audit.issuesByType.ORPHAN_LEVEL.length})
            </button>
            <button
              onClick={() => setSelectedTab("DUPLICATE_NAME")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedTab === "DUPLICATE_NAME"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Duplicates ({audit.issuesByType.DUPLICATE_NAME.length})
            </button>
            <button
              onClick={() => setSelectedTab("ELEVATION_MISMATCH")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedTab === "ELEVATION_MISMATCH"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Elevations ({audit.issuesByType.ELEVATION_MISMATCH?.length || 0})
            </button>
          </div>

          <div className="w-64">
            <input
              type="text"
              placeholder="Search issues by element or grid..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Issue Table List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredIssues.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                No Issues Found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                All structural elements in this category meet QA/QC calculation and integrity
                benchmarks.
              </p>
            </div>
          ) : (
            filteredIssues.map((issue) => {
              const isCrit = issue.severity === "CRITICAL";
              const isWarn = issue.severity === "WARNING";

              return (
                <div
                  key={issue.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    isCrit
                      ? "bg-red-50/30 dark:bg-red-950/20 border-red-200 dark:border-red-900/50"
                      : isWarn
                      ? "bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
                      : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isCrit
                          ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
                          : isWarn
                          ? "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400"
                          : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {isCrit ? (
                        <AlertOctagon className="w-4 h-4" />
                      ) : isWarn ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Info className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-slate-900 dark:text-white uppercase">
                          {issue.elementName}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          &bull; {issue.levelName}
                        </span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            isCrit
                              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                              : isWarn
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {issue.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {issue.description}
                      </p>
                      {issue.suggestedValue !== undefined && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-slate-500">
                          <span>Current:</span>
                          <code className="text-red-600 dark:text-red-400 font-mono">
                            {String(issue.currentValue || "none")}
                          </code>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                          <span>Suggested Fix:</span>
                          <code className="text-emerald-600 dark:text-emerald-400 font-mono">
                            {typeof issue.suggestedValue === "number"
                              ? `${issue.suggestedValue.toFixed(3)} m³`
                              : String(issue.suggestedValue)}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto justify-end">
                    {issue.autoFixable && (
                      <button
                        onClick={() => handleFixSingleIssue(issue)}
                        disabled={isFixing}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Wrench className="w-3 h-3" />
                        Fix Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Detected <strong>{audit.issues.length}</strong> discrepancy items across{" "}
            <strong>{audit.totalElements}</strong> project elements.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Close Doctor
          </button>
        </div>
      </div>
    </div>
  );
};
