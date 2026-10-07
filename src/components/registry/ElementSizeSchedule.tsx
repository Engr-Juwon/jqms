import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Box,
  Ruler,
  Building2,
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  Layers,
  Calculator,
  X,
  Info,
  FileText,
  Check,
  ArrowUpDown,
  Maximize2,
  Minimize2,
  Square,
} from "lucide-react";
import type { StructuralElement, ProjectLevel } from "@/types";
import {
  getOrCalculateVolume,
  getOrCalculateFormworkArea,
} from "@/lib/elementCalculations";

/* ─── Props ─── */
interface ElementSizeScheduleProps {
  elements?: StructuralElement[];
  levels?: ProjectLevel[];
  projectName?: string;
  companyName?: string;
  createdBy?: string;
  companyLogo?: string;
  className?: string;
}

/* ─── Types ─── */
type FilterType = "ALL" | "COLUMN" | "BEAM" | "WALL" | "SLAB";
type SortField = "size" | "qty" | "volume" | "formwork";
type SortOrder = "asc" | "desc";
type ElementCategory = "Column" | "Beam" | "Wall" | "Slab" | "Other";

interface SizeGroup {
  id: string;
  type: ElementCategory;
  sizeLabel: string;
  dimensionsText: string;
  countsByLevel: Record<string, number>;
  totalCount: number;
  totalVolume: number;
  totalFormwork: number;
  elementsByLevel: Record<string, StructuralElement[]>;
}

/* ─── Helper: Format dimension value to mm ─── */
const formatMm = (valInMeters?: number | string | null): string => {
  if (valInMeters === undefined || valInMeters === null || valInMeters === "") {
    return "—";
  }
  const num = typeof valInMeters === "string" ? parseFloat(valInMeters) : valInMeters;
  if (isNaN(num)) return "—";
  const mm = num < 50 ? Math.round(num * 1000) : Math.round(num);
  return `${mm}`;
};

/* ─── Helper: Parse element profile & size designation ─── */
const parseElementProfile = (
  el: StructuralElement
): { type: ElementCategory; key: string; label: string; details: string } | null => {
  const typeStr = (el.elementType || "").toLowerCase();
  
  let type: ElementCategory = "Other";
  if (typeStr.includes("column")) type = "Column";
  else if (typeStr.includes("beam")) type = "Beam";
  else if (typeStr.includes("wall")) type = "Wall";
  else if (typeStr.includes("slab")) type = "Slab";

  // 1. Column Profiles
  if (type === "Column") {
    const isCircular = el.columnShape === "circular" || typeStr.includes("circular");

    if (isCircular && el.diameter) {
      const dMm = formatMm(el.diameter);
      return {
        type,
        key: `COL_CIRC_${dMm}`,
        label: `Ø${dMm} mm`,
        details: `Circular Column · Diameter: ${dMm}mm`,
      };
    } else {
      const wMm = formatMm(el.width || el.dimensions?.width);
      const lMm = formatMm(el.length || el.dimensions?.length);
      const dims = [parseInt(wMm) || 0, parseInt(lMm) || 0].sort((a, b) => a - b);
      const keyStr = dims[0] && dims[1] ? `${dims[0]}x${dims[1]}` : `${wMm}x${lMm}`;
      const labelStr = dims[0] && dims[1] ? `${dims[0]} × ${dims[1]} mm` : `${wMm} × ${lMm} mm`;

      return {
        type,
        key: `COL_RECT_${keyStr}`,
        label: labelStr,
        details: `Rect. Column · ${wMm}mm × ${lMm}mm`,
      };
    }
  }

  // 2. Beam Profiles
  if (type === "Beam") {
    const wMm = formatMm(el.width || el.dimensions?.width);
    const dMm = formatMm(el.depth || el.thickness || el.height || el.dimensions?.height);
    return {
      type,
      key: `BEAM_${wMm}x${dMm}`,
      label: `${wMm} × ${dMm} mm`,
      details: `Beam · Width: ${wMm}mm × Depth: ${dMm}mm`,
    };
  }

  // 3. Wall Profiles
  if (type === "Wall") {
    const thMm = formatMm(el.thickness || el.width || el.dimensions?.width);
    return {
      type,
      key: `WALL_THK_${thMm}`,
      label: `t = ${thMm} mm`,
      details: `Structural Wall · Thickness: ${thMm}mm`,
    };
  }

  // 4. Slab Profiles
  if (type === "Slab") {
    const thMm = formatMm(el.thickness || 250);
    return {
      type,
      key: `SLAB_THK_${thMm}`,
      label: `t = ${thMm} mm`,
      details: `Slab · Thickness: ${thMm}mm`,
    };
  }

  // 5. Fallback Profiles
  const wMm = formatMm(el.width || el.dimensions?.width);
  const lMm = formatMm(el.length || el.dimensions?.length || el.thickness);
  return {
    type: "Other",
    key: `OTHER_${wMm}x${lMm}`,
    label: `${wMm} × ${lMm} mm`,
    details: `${el.elementType || "Element"} · ${wMm}mm × ${lMm}mm`,
  };
};

export const ElementSizeSchedule: React.FC<ElementSizeScheduleProps> = ({
  elements = [],
  levels = [],
  projectName = "Active Project",
  companyName = "JQMS Enterprise",
  createdBy = "QA/QC Lead",
  className = "",
}) => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("ALL");
  const [selectedLevelIds, setSelectedLevelIds] = useState<string[]>([]);
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  const [sortField, setSortField] = useState<SortField>("qty");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [activeElement, setActiveElement] = useState<StructuralElement | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLevelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const levelMap = useMemo(() => {
    const map = new Map<string, string>();
    levels.forEach((l) => map.set(l.id, l.name));
    return map;
  }, [levels]);

  const sortedLevels = useMemo(() => {
    return [...levels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [levels]);

  const activeLevels = useMemo(() => {
    if (selectedLevelIds.length === 0) return sortedLevels;
    return sortedLevels.filter((lvl) => selectedLevelIds.includes(lvl.id));
  }, [sortedLevels, selectedLevelIds]);

  const toggleLevelSelection = (levelId: string) => {
    setSelectedLevelIds((prev) =>
      prev.includes(levelId) ? prev.filter((id) => id !== levelId) : [...prev, levelId]
    );
  };

  const sizeGroups = useMemo(() => {
    const map = new Map<string, SizeGroup>();
    const activeLevelSet = new Set(activeLevels.map((l) => l.id));

    elements.forEach((el) => {
      const levelId = el.levelId || "UNASSIGNED";
      if (selectedLevelIds.length > 0 && !activeLevelSet.has(levelId)) return;

      const profile = parseElementProfile(el);
      if (!profile) return;

      if (filterType === "COLUMN" && profile.type !== "Column") return;
      if (filterType === "BEAM" && profile.type !== "Beam") return;
      if (filterType === "WALL" && profile.type !== "Wall") return;
      if (filterType === "SLAB" && profile.type !== "Slab") return;

      const groupKey = `${profile.type}_${profile.key}`;
      const vol = getOrCalculateVolume(el);
      const fw = getOrCalculateFormworkArea(el);

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          id: groupKey,
          type: profile.type,
          sizeLabel: profile.label,
          dimensionsText: profile.details,
          countsByLevel: {},
          totalCount: 0,
          totalVolume: 0,
          totalFormwork: 0,
          elementsByLevel: {},
        });
      }

      const group = map.get(groupKey)!;
      group.countsByLevel[levelId] = (group.countsByLevel[levelId] || 0) + 1;
      group.totalCount += 1;
      group.totalVolume += vol;
      group.totalFormwork += fw;

      if (!group.elementsByLevel[levelId]) {
        group.elementsByLevel[levelId] = [];
      }
      group.elementsByLevel[levelId].push(el);
    });

    return Array.from(map.values());
  }, [elements, filterType, activeLevels, selectedLevelIds]);

  const processedGroups = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = sizeGroups;
    if (q) {
      result = sizeGroups.filter(
        (g) =>
          g.sizeLabel.toLowerCase().includes(q) ||
          g.dimensionsText.toLowerCase().includes(q) ||
          g.type.toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      let comparison = 0;
      if (sortField === "size") {
        comparison = a.sizeLabel.localeCompare(b.sizeLabel);
      } else if (sortField === "qty") {
        comparison = a.totalCount - b.totalCount;
      } else if (sortField === "volume") {
        comparison = a.totalVolume - b.totalVolume;
      } else if (sortField === "formwork") {
        comparison = a.totalFormwork - b.totalFormwork;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [sizeGroups, search, sortField, sortOrder]);

  const matrixTotals = useMemo(() => {
    const levelCounts: Record<string, number> = {};
    let grandQty = 0;
    let grandVolume = 0;
    let grandFormwork = 0;

    activeLevels.forEach((lvl) => {
      levelCounts[lvl.id] = 0;
    });

    processedGroups.forEach((g) => {
      grandQty += g.totalCount;
      grandVolume += g.totalVolume;
      grandFormwork += g.totalFormwork;

      activeLevels.forEach((lvl) => {
        levelCounts[lvl.id] += g.countsByLevel[lvl.id] || 0;
      });
    });

    return { levelCounts, grandQty, grandVolume, grandFormwork };
  }, [processedGroups, activeLevels]);

  const kpis = useMemo(() => {
    let colCount = 0;
    let beamCount = 0;
    let wallCount = 0;
    let slabCount = 0;
    let totalVol = 0;
    let totalFw = 0;

    const colSizes = new Set<string>();
    const beamSizes = new Set<string>();

    sizeGroups.forEach((g) => {
      totalVol += g.totalVolume;
      totalFw += g.totalFormwork;

      if (g.type === "Column") {
        colCount += g.totalCount;
        colSizes.add(g.sizeLabel);
      } else if (g.type === "Beam") {
        beamCount += g.totalCount;
        beamSizes.add(g.sizeLabel);
      } else if (g.type === "Wall") {
        wallCount += g.totalCount;
      } else if (g.type === "Slab") {
        slabCount += g.totalCount;
      }
    });

    return {
      colCount,
      beamCount,
      wallCount,
      slabCount,
      colTypesCount: colSizes.size,
      beamTypesCount: beamSizes.size,
      totalVol,
      totalFw,
    };
  }, [sizeGroups]);

  const toggleExpand = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedGroups(new Set(processedGroups.map((g) => g.id)));
  const collapseAll = () => setExpandedGroups(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Element Type",
      "Size Designation",
      ...activeLevels.map((l) => `"${l.name}"`),
      "Total Quantity",
      "Total Volume (m³)",
      "Total Formwork (m²)",
    ];

    const rows = processedGroups.map((g) => [
      g.type,
      `"${g.sizeLabel}"`,
      ...activeLevels.map((l) => g.countsByLevel[l.id] || 0),
      g.totalCount,
      g.totalVolume.toFixed(3),
      g.totalFormwork.toFixed(3),
    ]);

    const summaryRow = [
      "SUMMARY TOTALS",
      "—",
      ...activeLevels.map((l) => matrixTotals.levelCounts[l.id] || 0),
      matrixTotals.grandQty,
      matrixTotals.grandVolume.toFixed(3),
      matrixTotals.grandFormwork.toFixed(3),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(",")), summaryRow.join(",")].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${projectName.replace(/[^a-zA-Z0-9]/g, "_")}_Element_Size_Schedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ─── KPI SUMMARY CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Box size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Columns
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {kpis.colCount}
              </span>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                ({kpis.colTypesCount} unique)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Ruler size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Beams
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {kpis.beamCount}
              </span>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                ({kpis.beamTypesCount} unique)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Calculator size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Concrete Volume
            </p>
            <p className="text-2xl font-black text-brand-600 dark:text-brand-400 font-mono">
              {kpis.totalVol.toFixed(2)}{" "}
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">m³</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Square size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Formwork Area
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {kpis.totalFw.toFixed(2)}{" "}
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">m²</span>
            </p>
          </div>
        </div>
      </div>

      {/* ─── CONTROLS & FILTERS ─── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              {(["ALL", "COLUMN", "BEAM", "WALL", "SLAB"] as FilterType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer ${
                    filterType === t
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t === "ALL" ? "All Types" : t.toLowerCase() + "s"}
                </button>
              ))}
            </div>

            {/* Multi-floor Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsLevelDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedLevelIds.length > 0
                    ? "bg-brand-50 dark:bg-brand-950/60 border-brand-300 dark:border-brand-500 text-brand-700 dark:text-brand-300"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Building2 size={14} className="text-brand-600 dark:text-brand-400" />
                <span>
                  {selectedLevelIds.length === 0
                    ? "All Floors"
                    : selectedLevelIds.length === 1
                    ? levelMap.get(selectedLevelIds[0]) || "1 Floor"
                    : `${selectedLevelIds.length} Floors`}
                </span>
                <ChevronDown size={14} className="ml-1 text-slate-400" />
              </button>

              {isLevelDropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-40 p-2 space-y-1">
                  <div className="px-2 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 mb-1">
                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Select Floors
                    </span>
                    {selectedLevelIds.length > 0 && (
                      <button
                        onClick={() => setSelectedLevelIds([])}
                        className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedLevelIds([])}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      selectedLevelIds.length === 0
                        ? "bg-brand-600 text-white"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span>All Floors ({sortedLevels.length})</span>
                    {selectedLevelIds.length === 0 && <Check size={14} />}
                  </button>

                  <div className="max-h-48 overflow-y-auto space-y-0.5 border-t border-slate-100 dark:border-slate-800 pt-1">
                    {sortedLevels.map((lvl) => {
                      const isSelected = selectedLevelIds.includes(lvl.id);
                      return (
                        <button
                          key={lvl.id}
                          onClick={() => toggleLevelSelection(lvl.id)}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-brand-50 dark:bg-brand-600/30 text-brand-700 dark:text-brand-400 font-bold"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span>{lvl.name}</span>
                          {isSelected && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search Input & Action Buttons */}
          <div className="flex items-center gap-2 flex-1 md:flex-initial">
            <div className="relative flex-1 md:w-56">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search size..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button
              onClick={exportToCSV}
              title="Export CSV"
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-sm border border-slate-200 dark:border-slate-700"
            >
              <Download size={14} className="text-brand-600 dark:text-brand-400" /> CSV
            </button>
          </div>
        </div>

        {/* Matrix Row Expand / Collapse */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2.5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              Showing <strong className="text-slate-900 dark:text-white">{processedGroups.length}</strong> unique size profile(s)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={expandAll}
              className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-[11px] cursor-pointer"
            >
              <Maximize2 size={12} /> Expand All
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              onClick={collapseAll}
              className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold text-[11px] cursor-pointer"
            >
              <Minimize2 size={12} /> Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* ─── SCHEDULE MATRIX TABLE ─── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-700 dark:text-slate-300">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-3.5 px-3 w-8"></th>
                <th className="py-3.5 px-4">Type</th>
                <th
                  onClick={() => handleSort("size")}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Size Designation</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>

                {/* Level Columns */}
                {activeLevels.map((lvl) => (
                  <th key={lvl.id} className="py-3.5 px-3 text-center min-w-[75px]">
                    {lvl.name}
                  </th>
                ))}

                <th
                  onClick={() => handleSort("qty")}
                  className="py-3.5 px-4 text-center bg-brand-50/50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-950/60 select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Total Qty</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("volume")}
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Vol (m³)</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>

                <th
                  onClick={() => handleSort("formwork")}
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Formwork (m²)</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {processedGroups.length === 0 ? (
                <tr>
                  <td colSpan={6 + activeLevels.length} className="py-12 text-center text-slate-400 dark:text-slate-500 font-semibold">
                    No structural element profiles matching the specified criteria.
                  </td>
                </tr>
              ) : (
                processedGroups.map((group) => {
                  const isExpanded = expandedGroups.has(group.id);

                  return (
                    <React.Fragment key={group.id}>
                      <tr
                        onClick={() => toggleExpand(group.id)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-3 text-center">
                          <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 cursor-pointer">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        </td>

                        <td className="py-3 px-4 font-bold">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${
                              group.type === "Column"
                                ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                                : group.type === "Beam"
                                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                : group.type === "Wall"
                                ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                                : group.type === "Slab"
                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {group.type}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                            {group.sizeLabel}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{group.dimensionsText}</div>
                        </td>

                        {/* Level Counts */}
                        {activeLevels.map((lvl) => {
                          const count = group.countsByLevel[lvl.id] || 0;
                          return (
                            <td
                              key={lvl.id}
                              className={`py-3 px-3 text-center font-mono font-bold ${
                                count > 0 ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-600"
                              }`}
                            >
                              {count > 0 ? (
                                <span className="inline-block px-2 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md">
                                  {count}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                          );
                        })}

                        {/* Total Count */}
                        <td className="py-3 px-4 text-center font-mono font-black text-sm bg-brand-50/40 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400">
                          {group.totalCount}
                        </td>

                        {/* Total Volume */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {group.totalVolume.toFixed(2)}
                        </td>

                        {/* Total Formwork */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {group.totalFormwork.toFixed(2)}
                        </td>
                      </tr>

                      {/* Accordion Expanded Sub-panel */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50 dark:bg-slate-950/60 border-y border-slate-200 dark:border-slate-800">
                          <td colSpan={6 + activeLevels.length} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h5 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <Layers size={13} className="text-brand-600 dark:text-brand-400" />
                                  Individual Elements in {group.sizeLabel}
                                </h5>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                                  Click element chip to inspect physical parameters
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {activeLevels.map((lvl) => {
                                  const els = group.elementsByLevel[lvl.id];
                                  if (!els || els.length === 0) return null;

                                  return (
                                    <div
                                      key={lvl.id}
                                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm"
                                    >
                                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1 mb-2 flex justify-between">
                                        <span>{lvl.name}</span>
                                        <span className="text-slate-900 dark:text-white font-mono">{els.length} nos</span>
                                      </div>

                                      <div className="flex flex-wrap gap-1.5">
                                        {els.map((e) => {
                                          const tagLabel = e.elementName || e.grid || "Unassigned";
                                          return (
                                            <button
                                              key={e.id}
                                              onClick={(ev) => {
                                                ev.stopPropagation();
                                                setActiveElement(e);
                                              }}
                                              className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950 hover:bg-brand-600 hover:text-white text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-800 transition cursor-pointer active:scale-95 flex items-center gap-1 shadow-sm"
                                            >
                                              {tagLabel}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>

            {/* Summary Footer */}
            {processedGroups.length > 0 && (
              <tfoot className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-xs border-t border-slate-200 dark:border-slate-800">
                <tr>
                  <td colSpan={2} className="py-3.5 px-4 font-black uppercase tracking-wider font-sans text-[11px] text-slate-700 dark:text-slate-300">
                    Summary Totals
                  </td>

                  {activeLevels.map((lvl) => (
                    <td key={lvl.id} className="py-3.5 px-3 text-center font-bold text-brand-600 dark:text-brand-400">
                      {matrixTotals.levelCounts[lvl.id] || 0}
                    </td>
                  ))}

                  <td className="py-3.5 px-4 text-center font-black text-sm bg-brand-600 text-white">
                    {matrixTotals.grandQty}
                  </td>

                  <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                    {matrixTotals.grandVolume.toFixed(2)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                    {matrixTotals.grandFormwork.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Element Detail Modal */}
      {activeElement && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveElement(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 flex items-start justify-between border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="inline-block px-2.5 py-0.5 bg-brand-600 text-white font-bold text-[10px] uppercase rounded-md tracking-wider mb-2">
                  {activeElement.elementType || "Structural Element"}
                </span>
                <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {activeElement.elementName || "Element Detail"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                  <Building2 size={13} className="text-brand-600 dark:text-brand-400" />
                  {levelMap.get(activeElement.levelId || "") || "Level"}
                  {activeElement.grid && ` · Grid ${activeElement.grid}`}
                </p>
              </div>

              <button
                onClick={() => setActiveElement(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Ruler size={13} className="text-brand-600 dark:text-brand-400" /> Dimensions &amp; Profile
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                      {formatMm(activeElement.width || activeElement.dimensions?.width)} mm
                    </span>
                  </div>

                  {activeElement.columnShape === "circular" ? (
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
                      <span className="text-sm font-bold text-brand-600 dark:text-brand-400 font-mono">
                        Ø{formatMm(activeElement.diameter)} mm
                      </span>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
                      <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                        {formatMm(activeElement.length || activeElement.dimensions?.length)} mm
                      </span>
                    </div>
                  )}

                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                      {formatMm(activeElement.height || activeElement.dimensions?.height)} mm
                    </span>
                  </div>
                </div>
              </div>

              {/* Calculated KPI stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-600/20 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-500/30 flex items-center justify-center shrink-0">
                    <Box size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Concrete Volume</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                      {(parseFloat(String(activeElement.calculatedVolume || activeElement.volume || 0)) || 0).toFixed(3)} m³
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Square size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Formwork Area</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {getOrCalculateFormworkArea(activeElement).toFixed(2)} m²
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveElement(null)}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElementSizeSchedule;
