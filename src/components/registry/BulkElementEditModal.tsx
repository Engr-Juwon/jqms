import React, { useState } from "react";
import {
  StructuralElement,
  ProjectLevel,
  WorkPackage,
  ElementStatus,
  NonConformanceReport,
} from "@/types";
import { dbService } from "@/lib/db";
import { calculatePureGeometricVolume } from "@/lib/elementDiagnostics";
import { calculateElementElevations } from "@/lib/elementCalculations";
import {
  X,
  Layers,
  CheckSquare,
  AlertTriangle,
  Building,
  Box,
  Hash,
  Scale,
  Ruler,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface BulkElementEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedElementIds: string[];
  elements: StructuralElement[];
  levels: ProjectLevel[];
  packages: WorkPackage[];
  ncrs: NonConformanceReport[];
  onElementsUpdated: () => void;
}

const CONCRETE_GRADES = [
  "C20/25",
  "C25/30",
  "C28/35",
  "C30/37",
  "C32/40",
  "C35/45",
  "C40/50",
  "C45/55",
  "C50/60",
];

const STATUS_OPTIONS: { value: ElementStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "REBAR_IN_PROGRESS", label: "Rebar in Progress" },
  { value: "FORMWORK_IN_PROGRESS", label: "Formwork in Progress" },
  { value: "READY_FOR_CASTING", label: "Ready for Casting" },
  { value: "REBAR_INSPECTED", label: "Rebar Inspected" },
  { value: "POURED", label: "Poured" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export const BulkElementEditModal: React.FC<BulkElementEditModalProps> = ({
  isOpen,
  onClose,
  selectedElementIds,
  elements,
  levels,
  packages,
  ncrs,
  onElementsUpdated,
}) => {
  // Enabled fields to modify
  const [updateGrade, setUpdateGrade] = useState(false);
  const [concreteGrade, setConcreteGrade] = useState("C35/45");

  const [updateLevel, setUpdateLevel] = useState(false);
  const [targetLevelId, setTargetLevelId] = useState("");

  const [updatePackage, setUpdatePackage] = useState(false);
  const [targetPackageId, setTargetPackageId] = useState("");

  const [updateStatus, setUpdateStatus] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ElementStatus>("READY_FOR_CASTING");

  const [updateRebarSpec, setUpdateRebarSpec] = useState(false);
  const [rebarSpec, setRebarSpec] = useState("");

  const [updateHeight, setUpdateHeight] = useState(false);
  const [targetHeight, setTargetHeight] = useState<number | "">("");

  const [updateElevationOffset, setUpdateElevationOffset] = useState(false);
  const [targetElevationOffset, setTargetElevationOffset] = useState<number | "">("");

  const [syncElevationsToLevel, setSyncElevationsToLevel] = useState(false);

  const [autoRecalcVolume, setAutoRecalcVolume] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedElements = elements.filter((e) =>
    selectedElementIds.includes(e.id),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !updateGrade &&
      !updateLevel &&
      !updatePackage &&
      !updateStatus &&
      !updateRebarSpec &&
      !updateHeight &&
      !updateElevationOffset &&
      !syncElevationsToLevel
    ) {
      toast.error("Please select at least one attribute to modify.");
      return;
    }

    // QA/QC Statutory Hold Check
    if (updateStatus && (targetStatus === "POURED" || targetStatus === "APPROVED")) {
      const activeNcrs = ncrs.filter(
        (n) =>
          selectedElementIds.includes(n.elementId || "") &&
          n.status !== "CLOSED" &&
          n.status !== "CANCELLED",
      );

      if (activeNcrs.length > 0) {
        const proceed = window.confirm(
          `⚠️ QA/QC STATUTORY WARNING: ${activeNcrs.length} of the ${selectedElements.length} selected elements have active, unclosed Non-Conformance Reports.\n\nChanging status to "${targetStatus}" without resolving NCRs violates quality gating. Do you wish to override and proceed?`,
        );
        if (!proceed) return;
      }
    }

    setIsSubmitting(true);
    try {
      const targetLevelObj = levels.find((l) => l.id === targetLevelId);
      const targetPkgObj = packages.find((p) => p.id === targetPackageId);

      const updatedElements: StructuralElement[] = selectedElements.map((el) => {
        const updated: StructuralElement = { ...el };

        if (updateGrade && concreteGrade) {
          updated.concreteGrade = concreteGrade;
        }

        if (updateLevel && targetLevelId) {
          updated.levelId = targetLevelId;
          if (targetLevelObj) {
            updated.levelName = targetLevelObj.name;
          }
        }

        if (updatePackage && targetPackageId) {
          updated.workPackageId = targetPackageId;
          if (targetPkgObj) {
            updated.workPackageName = targetPkgObj.name;
          }
        }

        if (updateStatus) {
          updated.status = targetStatus;
          const isDone = targetStatus === "POURED" || targetStatus === "APPROVED";
          const vol = autoRecalcVolume
            ? calculatePureGeometricVolume(updated)
            : updated.calculatedVolume || calculatePureGeometricVolume(updated);
          updated.achievedVolume = isDone ? vol : 0;
        }

        if (updateRebarSpec) {
          updated.rebarSpec = rebarSpec;
        }

        if (updateHeight && typeof targetHeight === "number" && targetHeight > 0) {
          updated.height = targetHeight;
          if (updated.dimensions) {
            updated.dimensions.height = targetHeight;
          }
        }

        if (updateElevationOffset && typeof targetElevationOffset === "number") {
          updated.elevationOffset = targetElevationOffset;
        }

        if (syncElevationsToLevel || updateElevationOffset || (updateLevel && targetLevelObj)) {
          const lvl = targetLevelObj || levels.find((l) => l.id === updated.levelId);
          if (lvl && lvl.elevation !== undefined) {
            const elevs = calculateElementElevations(updated, lvl.elevation);
            updated.elevation = elevs.elevation;
            updated.topElevation = elevs.topElevation;
            updated.bottomElevation = elevs.bottomElevation;
            updated.gridZ = elevs.gridZ;
            updated.elevationOffset = elevs.elevationOffset;
          }
        }

        if (autoRecalcVolume) {
          const newVol = calculatePureGeometricVolume(updated);
          updated.calculatedVolume = newVol;
          updated.volume = newVol;
        }

        updated.updatedAt = new Date().toISOString();
        return updated;
      });

      // Write in batches
      await Promise.all(updatedElements.map((el) => dbService.saveElement(el)));

      toast.success(
        `Successfully updated ${updatedElements.length} structural elements!`,
      );
      onElementsUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to batch update elements.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                Multi-Property Bulk Editor
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                  {selectedElementIds.length} Elements Selected
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Check the properties you wish to overwrite across all selected elements.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Property 1: Concrete Grade */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              updateGrade
                ? "border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-950/20"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateGrade}
                  onChange={(e) => setUpdateGrade(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-slate-400" />
                  Concrete Grade Specification
                </span>
              </label>
            </div>
            {updateGrade && (
              <div className="mt-3 pl-6 grid grid-cols-3 gap-2">
                {CONCRETE_GRADES.map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setConcreteGrade(grade)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      concreteGrade === grade
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Property 2: QA/QC Status */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              updateStatus
                ? "border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-950/20"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-slate-400" />
                  Element QA/QC Status
                </span>
              </label>
            </div>
            {updateStatus && (
              <div className="mt-3 pl-6">
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as ElementStatus)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {(targetStatus === "POURED" || targetStatus === "APPROVED") && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Achieved volume will automatically be set to 100% of design volume.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Property 3: Floor Level Assignment */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              updateLevel
                ? "border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-950/20"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateLevel}
                  onChange={(e) => setUpdateLevel(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-slate-400" />
                  Project Floor Level
                </span>
              </label>
            </div>
            {updateLevel && (
              <div className="mt-3 pl-6">
                <select
                  value={targetLevelId}
                  onChange={(e) => {
                    const lId = e.target.value;
                    setTargetLevelId(lId);
                    const lvl = levels.find((l) => l.id === lId);
                    if (lvl?.workPackageId) {
                      setUpdatePackage(true);
                      setTargetPackageId(lvl.workPackageId);
                    }
                  }}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Target Level...</option>
                  {levels.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.name} (Elev: {lvl.elevation ?? 0}m)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Property 4: Work Package Assignment */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              updatePackage
                ? "border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-950/20"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updatePackage}
                  onChange={(e) => setUpdatePackage(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-400" />
                  Work Package
                </span>
              </label>
            </div>
            {updatePackage && (
              <div className="mt-3 pl-6">
                <select
                  value={targetPackageId}
                  onChange={(e) => setTargetPackageId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Work Package...</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.code || (pkg as any).packageCode || "PKG"})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Property 5: Rebar Specification */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              updateRebarSpec
                ? "border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-950/20"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateRebarSpec}
                  onChange={(e) => setUpdateRebarSpec(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-slate-400" />
                  Rebar Detailing Specification
                </span>
              </label>
            </div>
            {updateRebarSpec && (
              <div className="mt-3 pl-6">
                <input
                  type="text"
                  placeholder="e.g. 8T20, links T10-150"
                  value={rebarSpec}
                  onChange={(e) => setRebarSpec(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Property 6: Height / Depth Adjustment */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              updateHeight
                ? "border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-950/20"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateHeight}
                  onChange={(e) => setUpdateHeight(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-slate-400" />
                  Element Height / Clear Span (m)
                </span>
              </label>
            </div>
            {updateHeight && (
              <div className="mt-3 pl-6">
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  placeholder="e.g. 3.20"
                  value={targetHeight}
                  onChange={(e) =>
                    setTargetHeight(
                      e.target.value === "" ? "" : parseFloat(e.target.value),
                    )
                  }
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Property 7: Elevation Offset */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              updateElevationOffset
                ? "border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-950/20"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateElevationOffset}
                  onChange={(e) => setUpdateElevationOffset(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-slate-400" />
                  Elevation Datum Offset (m)
                </span>
              </label>
            </div>
            {updateElevationOffset && (
              <div className="mt-3 pl-6">
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. +0.10 or -0.05"
                  value={targetElevationOffset}
                  onChange={(e) =>
                    setTargetElevationOffset(
                      e.target.value === "" ? "" : parseFloat(e.target.value),
                    )
                  }
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Option: Sync Elevations to Level Datum */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-brand-600" />
                <span>Sync Elevations to Floor Level Datum</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Calibrates base elevations to parent level datums while preserving individual offsets.
              </div>
            </div>
            <input
              type="checkbox"
              checked={syncElevationsToLevel}
              onChange={(e) => setSyncElevationsToLevel(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {/* Option: Auto-recalculate volume */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Auto-Recalculate Volume
              </div>
              <div className="text-[11px] text-slate-500">
                Automatically recalculates in-situ concrete volume based on geometric formulas.
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoRecalcVolume}
              onChange={(e) => setAutoRecalcVolume(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? "Applying Changes..." : `Update ${selectedElements.length} Elements`}
          </button>
        </div>
      </div>
    </div>
  );
};
