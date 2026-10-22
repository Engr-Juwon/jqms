import React from "react";
import {
  Search,
  Filter,
  Layers,
  Building2,
  Briefcase,
  Activity,
  Table as TableIcon,
  LayoutGrid,
  FileSpreadsheet,
} from "lucide-react";

interface ElementFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedType: string;
  onTypeChange: (t: string) => void;
  selectedLevel: string;
  onLevelChange: (l: string) => void;
  selectedStatus: string;
  onStatusChange: (s: string) => void;
  selectedPackage: string;
  onPackageChange: (p: string) => void;
  levels: Array<{ id: string; name: string }>;
  packages: Array<{ id: string; name: string }>;
  elementTypes?: string[];
  selectAllChecked: boolean;
  onToggleSelectAll: () => void;
  viewMode?: "TABLE" | "CARDS" | "SPREADSHEET";
  onViewModeChange?: (mode: "TABLE" | "CARDS" | "SPREADSHEET") => void;
  totalFilteredCount?: number;
  totalSelectedCount?: number;
  onSelectAllFiltered?: () => void;
  onClearSelection?: () => void;
}

const CORE_ELEMENT_TYPES = [
  { value: "ALL", label: "All Element Types" },
  { value: "Beam", label: "Beam" },
  { value: "Column", label: "Column" },
  { value: "Slab", label: "Slab" },
  { value: "Wall", label: "Wall" },
  { value: "Footing", label: "Footing" },
  { value: "Stair", label: "Stairs / Staircase" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "PENDING", label: "Pending Inspection" },
  { value: "REBAR_IN_PROGRESS", label: "Rebar in Progress" },
  { value: "FORMWORK_IN_PROGRESS", label: "Formwork in Progress" },
  { value: "READY_FOR_CASTING", label: "Ready for Casting" },
  { value: "REBAR_INSPECTED", label: "Rebar Inspected" },
  { value: "POURED", label: "Concrete Poured" },
  { value: "APPROVED", label: "QA Approved" },
  { value: "REJECTED", label: "QA Rejected" },
];

export const ElementFilters: React.FC<ElementFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedLevel,
  onLevelChange,
  selectedStatus,
  onStatusChange,
  selectedPackage,
  onPackageChange,
  levels,
  packages,
  elementTypes = [],
  selectAllChecked,
  onToggleSelectAll,
  viewMode,
  onViewModeChange,
  totalFilteredCount,
  totalSelectedCount,
  onSelectAllFiltered,
  onClearSelection,
}) => {
  // Build unified dynamic + core types list
  const typeOptions = React.useMemo(() => {
    const list: Array<{ value: string; label: string }> = [...CORE_ELEMENT_TYPES];
    
    elementTypes.forEach((type) => {
      const trimmed = type?.trim();
      if (!trimmed) return;
      const alreadyExists = list.some(
        (opt) => opt.value.toLowerCase() === trimmed.toLowerCase()
      );
      if (!alreadyExists) {
        list.push({ value: trimmed, label: trimmed });
      }
    });

    return list;
  }, [elementTypes]);

  return (
    <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xl space-y-3 transition-colors duration-200">
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by element name, grid axis, level or ID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-start">
          {/* Select Options (Page vs All) */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl shrink-0">
            <input
              type="checkbox"
              id="selectAllPage"
              checked={selectAllChecked}
              onChange={onToggleSelectAll}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 bg-white dark:bg-slate-900 cursor-pointer"
            />
            <label
              htmlFor="selectAllPage"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none cursor-pointer whitespace-nowrap"
            >
              Select Page
            </label>
            {onSelectAllFiltered && totalFilteredCount !== undefined && totalFilteredCount > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-700 text-xs">|</span>
                <button
                  type="button"
                  onClick={onSelectAllFiltered}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline whitespace-nowrap"
                  title={`Select all ${totalFilteredCount} elements in this view`}
                >
                  All ({totalFilteredCount})
                </button>
              </>
            )}
            {totalSelectedCount !== undefined && totalSelectedCount > 0 && onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1 font-bold"
                title="Clear selection"
              >
                ✕
              </button>
            )}
          </div>

          {/* Table / Cards View Mode Toggle */}
          {onViewModeChange && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => onViewModeChange("TABLE")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === "TABLE"
                    ? "bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Structured Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("CARDS")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === "CARDS"
                    ? "bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Visual Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("SPREADSHEET")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === "SPREADSHEET"
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Spreadsheet Quick-Edit View"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quick Edit</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Type Filter */}
        <div className="relative">
          <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-brand-500 transition cursor-pointer appearance-none font-medium"
          >
            {typeOptions.map((t) => (
              <option
                key={t.value}
                value={t.value}
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Level Filter */}
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <select
            value={selectedLevel}
            onChange={(e) => onLevelChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-brand-500 transition cursor-pointer appearance-none"
          >
            <option
              value="ALL"
              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              All Levels
            </option>
            {levels.map((lvl) => (
              <option
                key={lvl.id}
                value={lvl.id}
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {lvl.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-brand-500 transition cursor-pointer appearance-none"
          >
            {STATUS_OPTIONS.map((s) => (
              <option
                key={s.value}
                value={s.value}
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Work Package Filter */}
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <select
            value={selectedPackage}
            onChange={(e) => onPackageChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-300 focus:outline-none focus:border-brand-500 transition cursor-pointer appearance-none"
          >
            <option
              value="ALL"
              className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              All Work Packages
            </option>
            {packages.map((pkg) => (
              <option
                key={pkg.id}
                value={pkg.id}
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                {pkg.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
