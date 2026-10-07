import React from "react";
import { CheckSquare, X, Building2, Briefcase, Activity, Trash2, ArrowRight } from "lucide-react";

interface BulkToolbarProps {
  selectedCount: number;
  onClear: () => void;
  bulkStatus: string;
  onStatusChange: (status: string) => void;
  onApplyStatus: () => void;
  bulkPackageId: string;
  onPackageChange: (packageId: string) => void;
  onAssignPackage: () => void;
  bulkLevelId: string;
  onLevelChange: (levelId: string) => void;
  onAssignLevel: () => void;
  levels: Array<{ id: string; name: string }>;
  packages: Array<{ id: string; name: string }>;
  onDelete: () => void;
}

const BULK_STATUS_OPTIONS = [
  { value: "", label: "Change Status..." },
  { value: "PENDING", label: "Pending Inspection" },
  { value: "REBAR_IN_PROGRESS", label: "Rebar in Progress" },
  { value: "FORMWORK_IN_PROGRESS", label: "Formwork in Progress" },
  { value: "READY_FOR_CASTING", label: "Ready for Casting" },
  { value: "REBAR_INSPECTED", label: "Rebar Inspected" },
  { value: "POURED", label: "Concrete Poured" },
  { value: "APPROVED", label: "QA Approved" },
  { value: "REJECTED", label: "QA Rejected" },
];

export const BulkToolbar: React.FC<BulkToolbarProps> = ({
  selectedCount,
  onClear,
  bulkStatus,
  onStatusChange,
  onApplyStatus,
  bulkPackageId,
  onPackageChange,
  onAssignPackage,
  bulkLevelId,
  onLevelChange,
  onAssignLevel,
  levels,
  packages,
  onDelete,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-brand-500/40 rounded-2xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top duration-200 transition-colors duration-200">
      {/* Selection Badge */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 dark:bg-brand-600/20 border border-brand-500/30 rounded-xl">
          <CheckSquare className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span className="text-xs font-bold text-brand-700 dark:text-brand-300">
            {selectedCount} element{selectedCount === 1 ? "" : "s"} selected
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition"
        >
          <X className="w-3.5 h-3.5" /> Clear
        </button>
      </div>

      {/* Bulk Operations */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end">
        {/* Bulk Status Update */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1">
          <Activity className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <select
            value={bulkStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-2"
          >
            {BULK_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {opt.label}
              </option>
            ))}
          </select>
          {bulkStatus && (
            <button
              onClick={onApplyStatus}
              className="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-bold rounded-lg transition shadow-sm"
            >
              Apply
            </button>
          )}
        </div>

        {/* Bulk Move Level */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1">
          <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <select
            value={bulkLevelId}
            onChange={(e) => onLevelChange(e.target.value)}
            className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-2"
          >
            <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Move to Level...</option>
            {levels.map((lvl) => (
              <option key={lvl.id} value={lvl.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {lvl.name}
              </option>
            ))}
          </select>
          {bulkLevelId && (
            <button
              onClick={onAssignLevel}
              className="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-bold rounded-lg transition shadow-sm"
            >
              Move
            </button>
          )}
        </div>

        {/* Bulk Assign Package */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1">
          <Briefcase className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <select
            value={bulkPackageId}
            onChange={(e) => onPackageChange(e.target.value)}
            className="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-2"
          >
            <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Assign Package...</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {pkg.name}
              </option>
            ))}
          </select>
          {bulkPackageId && (
            <button
              onClick={onAssignPackage}
              className="px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-bold rounded-lg transition shadow-sm"
            >
              Assign
            </button>
          )}
        </div>

        {/* Bulk Delete */}
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-950/60 hover:bg-red-200 dark:hover:bg-red-900/80 border border-red-300 dark:border-red-800/80 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl transition shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete ({selectedCount})</span>
        </button>
      </div>
    </div>
  );
};
