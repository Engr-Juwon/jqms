import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  Sparkles,
  Search,
  Filter,
  Plus,
  Layers,
  Table as TableIcon,
  LayoutGrid,
  Download,
  Trash2,
  Home,
  Store,
  Briefcase,
  AlertOctagon,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  RefreshCw,
  Box,
} from "lucide-react";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService } from "@/lib/db";
import { ProjectUnit, ProjectLevel, UnitUsageType, UnitStageStatus } from "@/types";
import { BulkUnitGeneratorModal } from "@/components/units/BulkUnitGeneratorModal";
import { UnitDetailModal } from "@/components/units/UnitDetailModal";
import { UnitEditModal } from "@/components/units/UnitEditModal";
import { toast } from "react-hot-toast";

export const UnitsDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeProject } = useProjectStore();
  const { company, currentUser } = useAuthStore();

  const [units, setUnits] = useState<ProjectUnit[]>([]);
  const [levels, setLevels] = useState<ProjectLevel[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState<string>("ALL");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"heatmap" | "table">("heatmap");

  // Selection for bulk actions
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set());

  // Modals
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<ProjectUnit | null>(null);

  useEffect(() => {
    loadAllData();
  }, [activeProject?.id]);

  const loadAllData = async () => {
    if (!activeProject?.id) return;
    setLoading(true);
    try {
      const compId = activeProject.companyId || company?.id || "";
      const [fetchedUnits, fetchedLevels] = await Promise.all([
        dbService.getProjectUnits(activeProject.id, compId),
        dbService.getLevels(activeProject.id, compId),
      ]);
      setUnits(fetchedUnits);
      setLevels(fetchedLevels);
    } catch (err) {
      console.error("Failed to load units directory:", err);
      toast.error("Failed to load units data.");
    } finally {
      setLoading(false);
    }
  };

  // Distinct buildings
  const buildings = useMemo(() => {
    const set = new Set<string>();
    units.forEach((u) => u.building && set.add(u.building));
    return Array.from(set).sort();
  }, [units]);

  // Distinct floor levels
  const floorLevelsList = useMemo(() => {
    const set = new Set<string>();
    units.forEach((u) => u.levelName && set.add(u.levelName));
    return Array.from(set);
  }, [units]);

  // Filtered units
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      if (selectedBuilding !== "ALL" && u.building !== selectedBuilding) return false;
      if (selectedLevel !== "ALL" && u.levelName !== selectedLevel) return false;
      if (selectedType !== "ALL" && u.unitType !== selectedType) return false;
      if (selectedStage !== "ALL" && u.stageStatus !== selectedStage) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = u.unitNumber.toLowerCase().includes(q);
        const matchName = u.name.toLowerCase().includes(q);
        const matchBuilding = (u.building || "").toLowerCase().includes(q);
        const matchContractor = (u.assignedContractor || "").toLowerCase().includes(q);
        const matchCode = (u.code || "").toLowerCase().includes(q);
        if (!matchNum && !matchName && !matchBuilding && !matchContractor && !matchCode) {
          return false;
        }
      }

      return true;
    });
  }, [units, selectedBuilding, selectedLevel, selectedType, selectedStage, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = units.length;
    let residential = 0;
    let retail = 0;
    let office = 0;
    let other = 0;
    let handedOver = 0;
    let inProgress = 0;
    let snagging = 0;
    let totalGia = 0;

    units.forEach((u) => {
      if (u.unitType === "RESIDENTIAL") residential++;
      else if (u.unitType === "COMMERCIAL_RETAIL") retail++;
      else if (u.unitType === "OFFICE") office++;
      else other++;

      if (u.stageStatus === "HANDED_OVER") handedOver++;
      else if (u.stageStatus === "PRE_SNAG" || u.stageStatus === "CLIENT_SNAG") snagging++;
      else inProgress++;

      totalGia += u.grossFloorArea || 0;
    });

    const completionRate = total > 0 ? Math.round((handedOver / total) * 100) : 0;

    return {
      total,
      residential,
      retail,
      office,
      other,
      handedOver,
      snagging,
      inProgress,
      totalGia,
      completionRate,
    };
  }, [units]);

  // Grouped by Building -> Level for Heatmap Matrix
  const heatmapMatrix = useMemo(() => {
    // Structure: Record<Building, Record<LevelName, ProjectUnit[]>>
    const map: Record<string, Record<string, ProjectUnit[]>> = {};

    filteredUnits.forEach((u) => {
      const b = u.building || "General Building";
      const l = u.levelName || "Ground Floor";
      if (!map[b]) map[b] = {};
      if (!map[b][l]) map[b][l] = [];
      map[b][l].push(u);
    });

    return map;
  }, [filteredUnits]);

  // Bulk Actions
  const handleSelectAll = () => {
    if (selectedUnitIds.size === filteredUnits.length) {
      setSelectedUnitIds(new Set());
    } else {
      setSelectedUnitIds(new Set(filteredUnits.map((u) => u.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkStageChange = async (newStage: UnitStageStatus) => {
    if (selectedUnitIds.size === 0 || !activeProject?.id) return;
    const count = selectedUnitIds.size;
    if (!window.confirm(`Update ${count} selected units to stage: ${newStage.replace(/_/g, " ")}?`)) return;

    try {
      const compId = activeProject.companyId || company?.id || "";
      const updatedList = units
        .filter((u) => selectedUnitIds.has(u.id))
        .map((u) => ({ ...u, stageStatus: newStage, updatedAt: Date.now() }));

      await dbService.saveProjectUnits(updatedList, activeProject.id, compId);
      toast.success(`Updated ${count} units to ${newStage.replace(/_/g, " ")}!`);
      setSelectedUnitIds(new Set());
      loadAllData();
    } catch (e) {
      console.error(e);
      toast.error("Failed to bulk update units.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUnitIds.size === 0 || !activeProject?.id) return;
    const count = selectedUnitIds.size;
    if (!window.confirm(`Are you sure you want to permanently delete ${count} selected units?`)) return;

    try {
      const compId = activeProject.companyId || company?.id || "";
      await dbService.bulkDeleteProjectUnits(Array.from(selectedUnitIds), activeProject.id, compId);
      toast.success(`Deleted ${count} units.`);
      setSelectedUnitIds(new Set());
      loadAllData();
    } catch (e) {
      console.error(e);
      toast.error("Failed to bulk delete units.");
    }
  };

  const handleExportCsv = () => {
    if (filteredUnits.length === 0) {
      toast.error("No units to export.");
      return;
    }

    const headers = [
      "UnitNumber",
      "UnitName",
      "Building",
      "Level",
      "Type",
      "SubType",
      "Stage",
      "GrossArea_m2",
      "AssignedContractor",
      "Rooms",
    ];

    const rows = filteredUnits.map((u) => [
      `"${u.unitNumber}"`,
      `"${u.name}"`,
      `"${u.building}"`,
      `"${u.levelName}"`,
      `"${u.unitType}"`,
      `"${u.subType || ""}"`,
      `"${u.stageStatus}"`,
      u.grossFloorArea || 0,
      `"${u.assignedContractor || ""}"`,
      `"${(u.rooms || []).join("; ")}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `JQMS_${activeProject?.code || "PROJECT"}_Units_${units.length}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStageColor = (status: UnitStageStatus) => {
    switch (status) {
      case "HANDED_OVER":
        return "bg-emerald-500 text-white border-emerald-600";
      case "READY_FOR_HANDOVER":
        return "bg-teal-500 text-white border-teal-600";
      case "CLIENT_SNAG":
        return "bg-orange-500 text-white border-orange-600";
      case "PRE_SNAG":
        return "bg-amber-500 text-white border-amber-600";
      case "FINISHES":
        return "bg-blue-600 text-white border-blue-700";
      case "SECOND_FIX":
        return "bg-indigo-500 text-white border-indigo-600";
      case "FIRST_FIX":
        return "bg-sky-500 text-white border-sky-600";
      case "SUPERSTRUCTURE":
        return "bg-slate-600 text-white border-slate-700";
      case "SUBSTRUCTURE":
        return "bg-stone-600 text-white border-stone-700";
      default:
        return "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600";
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* ─── 1. TOP HEADER & PRIMARY ACTIONS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-1 font-bold">
            <Building2 className="w-4 h-4" />
            <span>Multi-Unit Spatial & Mixed-Use Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Project Units Register</span>
            <span className="px-3 py-1 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 text-sm font-mono font-bold border border-brand-500/20">
              {stats.total} Units
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise spatial breakdown, 550-unit lifecycle progression matrix, and room-level defect audit trails
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedUnit(null);
              setIsEditOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Unit</span>
          </button>

          <button
            type="button"
            onClick={() => setIsGeneratorOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Bulk 550 Units Generator</span>
          </button>
        </div>
      </div>

      {/* ─── 2. EXECUTIVE METRICS & MIXED-USE BREAKDOWN ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Units */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Total Units</span>
            <Building2 className="w-4 h-4 text-brand-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.total}
            </span>
            <span className="text-[11px] text-slate-400">allocated</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-brand-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (stats.total / 550) * 100)}%` }}
            />
          </div>
        </div>

        {/* Residential */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs">
            <span>Residential</span>
            <Home className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.residential}
            </span>
            <span className="text-[11px] text-slate-400">units</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">Apartments / Suites</p>
        </div>

        {/* Commercial Retail */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs">
            <span>Retail & Shops</span>
            <Store className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.retail}
            </span>
            <span className="text-[11px] text-slate-400">spaces</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">Ground & Podium</p>
        </div>

        {/* Corporate Offices */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs">
            <span>Offices</span>
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.office}
            </span>
            <span className="text-[11px] text-slate-400">suites</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">Commercial Wings</p>
        </div>

        {/* Snagging Active */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-orange-600 dark:text-orange-400 text-xs">
            <span>In Snagging</span>
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-orange-600 dark:text-orange-400">
              {stats.snagging}
            </span>
            <span className="text-[11px] text-slate-400">units</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">Pre-snag / Inspection</p>
        </div>

        {/* Handed Over */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs">
            <span>Handed Over</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.handedOver}
            </span>
            <span className="text-[11px] font-bold text-slate-400">({stats.completionRate}%)</span>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">TOC Complete</p>
        </div>
      </div>

      {/* ─── 3. FILTERS, SEARCH & VIEW SWITCHER ─── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by unit number (e.g. 101, RET-G01), name, or contractor..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("heatmap")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "heatmap"
                  ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>550 Spatial Heatmap</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Spreadsheet Schedule</span>
            </button>
          </div>
        </div>

        {/* Dropdowns Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          {/* Building */}
          <div>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
            >
              <option value="ALL">All Buildings / Blocks ({buildings.length})</option>
              {buildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Level */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
            >
              <option value="ALL">All Floor Levels ({floorLevelsList.length})</option>
              {floorLevelsList.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
            >
              <option value="ALL">All Usage Types</option>
              <option value="RESIDENTIAL">Residential Apartments</option>
              <option value="COMMERCIAL_RETAIL">Commercial Retail</option>
              <option value="OFFICE">Corporate Offices</option>
              <option value="HOSPITALITY">Hospitality</option>
              <option value="AMENITY_FACILITY">Amenities</option>
            </select>
          </div>

          {/* Stage */}
          <div>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
            >
              <option value="ALL">All Lifecycle Stages</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="FIRST_FIX">First Fix</option>
              <option value="SECOND_FIX">Second Fix</option>
              <option value="FINISHES">Finishes</option>
              <option value="PRE_SNAG">Pre-Snagging</option>
              <option value="CLIENT_SNAG">Client Snagging</option>
              <option value="READY_FOR_HANDOVER">Ready for Handover</option>
              <option value="HANDED_OVER">Handed Over (TOC Signed)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── 4. HEATMAP LEGEND ─── */}
      {viewMode === "heatmap" && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-850 text-[11px] font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
              Stage Legend:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-300 dark:bg-slate-600 inline-block" />
              <span>Not Started</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-sky-500 inline-block" />
              <span>1st Fix</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block" />
              <span>2nd Fix</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" />
              <span>Finishes</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
              <span>Pre-Snag</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-orange-500 inline-block" />
              <span>Client Walk</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-teal-500 inline-block" />
              <span>Ready</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
              <span>Handed Over</span>
            </span>
          </div>
        </div>
      )}

      {/* ─── 5. MAIN CONTENT VIEW ─── */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-500" />
          <p className="text-sm font-semibold">Loading project units database...</p>
        </div>
      ) : units.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No Units Configured Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your mixed-use development has no units registered yet. Use the 1-click generator to provision your 550 units or import from Excel.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsGeneratorOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Provision 550 Units Now</span>
          </button>
        </div>
      ) : viewMode === "heatmap" ? (
        /* ─── 5A. 550 SPATIAL HEATMAP MATRIX VIEW ─── */
        <div className="space-y-6">
          {Object.entries(heatmapMatrix).map(([buildingName, floorMap]) => (
            <div
              key={buildingName}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    {buildingName}
                  </h3>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {Object.values(floorMap).reduce((acc, list) => acc + list.length, 0)} Units on this structure
                </span>
              </div>

              {/* Floors Stack */}
              <div className="space-y-3">
                {Object.entries(floorMap).map(([lvlName, unitList]) => (
                  <div
                    key={lvlName}
                    className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center gap-3"
                  >
                    {/* Floor Label */}
                    <div className="w-32 shrink-0">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                        {lvlName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {unitList.length} Units
                      </span>
                    </div>

                    {/* Unit Heatmap Badges */}
                    <div className="flex flex-wrap gap-1.5 flex-1 items-center">
                      {unitList.map((unit) => {
                        return (
                          <button
                            key={unit.id}
                            type="button"
                            onClick={() => {
                              setSelectedUnit(unit);
                              setIsDetailOpen(true);
                            }}
                            className={`group relative px-2.5 py-1 rounded-lg text-[11px] font-bold border transition transform hover:scale-105 hover:z-10 shadow-sm ${getStageColor(
                              unit.stageStatus,
                            )}`}
                            title={`${unit.name} • ${unit.stageStatus.replace(/_/g, " ")} • Click to inspect`}
                          >
                            <span>{unit.unitNumber}</span>

                            {/* Defect Indicator Dot */}
                            {unit.snagStats && unit.snagStats.open > 0 && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-slate-900 animate-pulse" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ─── 5B. SPREADSHEET SCHEDULE VIEW ─── */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Bulk Selection Bar */}
          {selectedUnitIds.size > 0 && (
            <div className="p-3 bg-brand-500/10 border-b border-brand-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-brand-700 dark:text-brand-300">
                {selectedUnitIds.size} units selected
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500 text-[11px]">Set Stage:</span>
                <button
                  type="button"
                  onClick={() => handleBulkStageChange("SECOND_FIX")}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold text-[11px]"
                >
                  2nd Fix
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStageChange("FINISHES")}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-semibold text-[11px]"
                >
                  Finishes
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStageChange("PRE_SNAG")}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-semibold text-[11px]"
                >
                  Pre-Snag
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStageChange("HANDED_OVER")}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold text-[11px]"
                >
                  Handed Over
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 text-white font-semibold text-[11px] ml-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="p-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedUnitIds.size === filteredUnits.length && filteredUnits.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                  </th>
                  <th className="p-3.5">Unit #</th>
                  <th className="p-3.5">Display Name</th>
                  <th className="p-3.5">Building & Floor</th>
                  <th className="p-3.5">Usage Type</th>
                  <th className="p-3.5">Area (m²)</th>
                  <th className="p-3.5">Stage Status</th>
                  <th className="p-3.5">Contractor</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUnits.map((u) => {
                  const isChecked = selectedUnitIds.has(u.id);
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                        isChecked ? "bg-brand-50/50 dark:bg-brand-950/20" : ""
                      }`}
                    >
                      <td className="p-3.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(u.id)}
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {u.unitNumber}
                      </td>
                      <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">
                        {u.name}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        {u.building} • {u.levelName}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-slate-700 dark:text-slate-300">
                          {u.unitType === "COMMERCIAL_RETAIL" ? (
                            <Store className="w-3.5 h-3.5 text-amber-500" />
                          ) : u.unitType === "OFFICE" ? (
                            <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                          ) : (
                            <Home className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                          <span>{u.subType || u.unitType}</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">
                        {u.grossFloorArea ? `${u.grossFloorArea} m²` : "—"}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${getStageColor(
                            u.stageStatus,
                          )}`}
                        >
                          {u.stageStatus.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400">
                        {u.assignedContractor || "—"}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUnit(u);
                            setIsDetailOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-500 hover:text-white transition font-semibold text-[11px]"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 6. MODALS ─── */}
      <BulkUnitGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        levels={levels}
        existingCount={units.length}
        onSuccess={loadAllData}
      />

      <UnitDetailModal
        unit={selectedUnit}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedUnit(null);
        }}
        onEdit={(u) => {
          setIsDetailOpen(false);
          setSelectedUnit(u);
          setIsEditOpen(true);
        }}
        onRefresh={loadAllData}
      />

      <UnitEditModal
        unit={selectedUnit}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedUnit(null);
        }}
        levels={levels}
        onSuccess={loadAllData}
      />
    </div>
  );
};

export default UnitsDirectoryPage;
