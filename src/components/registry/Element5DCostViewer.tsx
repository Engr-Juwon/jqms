import React, { useState, useMemo } from "react";
import {
  StructuralElement,
  ProjectLevel,
  ProjectCostRates,
  Level5DCostSummary,
} from "@/types";
import {
  DEFAULT_PROJECT_COST_RATES,
  calculateElement5DCost,
  calculateLevel5DCostSummary,
  format5DCurrency,
} from "@/lib/costCalculations";
import {
  Coins,
  Calculator,
  Sliders,
  TrendingUp,
  Download,
  FileSpreadsheet,
  Layers,
  Box,
  HardHat,
  Truck,
  RotateCcw,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
  Building2,
  DollarSign,
  PieChart,
  Sparkles,
  Save,
} from "lucide-react";
import { useProjectStore } from "@/stores/useProjectStore";
import { toast } from "react-hot-toast";

interface Element5DCostViewerProps {
  elements: StructuralElement[];
  levels: ProjectLevel[];
  selectedLevelId: string;
  onSelectLevel: (lvlId: string) => void;
  onInspectElement?: (el: StructuralElement) => void;
  className?: string;
}

export const Element5DCostViewer: React.FC<Element5DCostViewerProps> = ({
  elements,
  levels,
  selectedLevelId,
  onSelectLevel,
  onInspectElement,
  className = "",
}) => {
  const { activeProject, updateCostRates } = useProjectStore();
  const [rates, setRates] = useState<ProjectCostRates>(() => {
    return activeProject?.costRates || DEFAULT_PROJECT_COST_RATES;
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showRateSettings, setShowRateSettings] = useState<boolean>(false);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sync state if activeProject.costRates updates from remote
  React.useEffect(() => {
    if (activeProject?.costRates) {
      setRates(activeProject.costRates);
    }
  }, [activeProject?.costRates]);

  const handleSaveRates = async (ratesToSave: ProjectCostRates = rates) => {
    setIsSaving(true);
    try {
      await updateCostRates(ratesToSave);
      toast.success("5D Unit Rates saved to project database.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save unit rates to database.");
    } finally {
      setIsSaving(false);
    }
  };

  const levelNameMap = useMemo(() => {
    const map = new Map<string, string>();
    levels.forEach((l) => map.set(l.id, l.name));
    return map;
  }, [levels]);

  const currentLevelName =
    selectedLevelId === "ALL"
      ? "All Project Stages"
      : levelNameMap.get(selectedLevelId) || "Selected Level";

  // Filter elements by active floor level & query
  const levelElements = useMemo(() => {
    let list = elements;
    if (selectedLevelId !== "ALL") {
      list = list.filter((el) => el.levelId === selectedLevelId);
    }
    return list;
  }, [elements, selectedLevelId]);

  // Filtered by type & search
  const displayElements = useMemo(() => {
    let list = levelElements;
    if (typeFilter !== "ALL") {
      list = list.filter((el) =>
        (el.elementType || "").toUpperCase().includes(typeFilter.toUpperCase()),
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (el) =>
          (el.elementName && el.elementName.toLowerCase().includes(q)) ||
          (el.grid && el.grid.toLowerCase().includes(q)) ||
          (el.concreteGrade && el.concreteGrade.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [levelElements, typeFilter, searchQuery]);

  // Compute 5D Cost Summary across level elements
  const summary: Level5DCostSummary = useMemo(() => {
    return calculateLevel5DCostSummary(
      levelElements,
      rates,
      selectedLevelId,
      currentLevelName,
    );
  }, [levelElements, rates, selectedLevelId, currentLevelName]);

  // Compute percentage of cost by trade
  const tradeShares = useMemo(() => {
    const pv = summary.plannedCostPV || 1;
    return {
      concretePct: Math.round((summary.concreteCostTotal / pv) * 100),
      formworkPct: Math.round((summary.formworkCostTotal / pv) * 100),
      rebarPct: Math.round((summary.rebarCostTotal / pv) * 100),
      laborPlantPct: Math.round(
        ((summary.laborCostTotal + summary.equipmentCostTotal) / pv) * 100,
      ),
    };
  }, [summary]);

  const earnedValuePct = useMemo(() => {
    if (summary.plannedCostPV <= 0) return 0;
    return Math.min(
      100,
      Math.round((summary.approvedCostEV / summary.plannedCostPV) * 100),
    );
  }, [summary]);

  // Export 5D BOQ as CSV
  const handleExportCSV = () => {
    const headers = [
      "Element Name",
      "Type",
      "Level",
      "Grid",
      "Status",
      "Concrete Grade",
      "Volume (m3)",
      "Concrete Rate",
      "Concrete Cost",
      "Formwork (m2)",
      "Formwork Rate",
      "Formwork Cost",
      "Rebar (Tonne)",
      "Rebar Rate",
      "Rebar Cost",
      "Labor & Plant Cost",
      "Total Cost",
    ];

    const rows = displayElements.map((el) => {
      const c = calculateElement5DCost(el, rates);
      return [
        `"${el.elementName || ""}"`,
        `"${el.elementType || ""}"`,
        `"${levelNameMap.get(el.levelId) || el.levelName || ""}"`,
        `"${el.grid || el.gridAxis || ""}"`,
        `"${el.status || ""}"`,
        `"${el.concreteGrade || "C30"}"`,
        c.concreteVolume,
        c.concreteRate,
        c.concreteCost,
        c.formworkArea,
        c.formworkRate,
        c.formworkCost,
        c.rebarTonnage,
        c.rebarRatePerTonne,
        c.rebarCost,
        c.laborCost + c.equipmentCost,
        c.totalCost,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `5D_BIM_Takeoff_${currentLevelName.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("5D BOQ Schedule exported to CSV");
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top 5D Horizon Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono font-extrabold uppercase tracking-wider border border-emerald-500/20">
                5D BIM Cost &amp; QTO Engine
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {currentLevelName}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>5D Bill of Quantities &amp; Budget Forecast</span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                ({levelElements.length} elements)
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Level Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <Building2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <select
                value={selectedLevelId}
                onChange={(e) => onSelectLevel(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Levels Combined</option>
                {levels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Rate Settings Toggle */}
            <button
              onClick={() => setShowRateSettings((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                showRateSettings
                  ? "bg-brand-600 text-white border-brand-600 shadow"
                  : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Unit Rates Matrix</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition"
              title="Export 5D BOQ Schedule to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export BOQ</span>
            </button>
          </div>
        </div>

        {/* 5D Primary Financial KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Planned Value (PV) */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-mono font-bold uppercase">
              <span>Planned Value (PV)</span>
              <Coins className="w-4 h-4 text-brand-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
              {format5DCurrency(summary.plannedCostPV, rates.currencySymbol)}
            </div>
            <p className="text-[11px] text-slate-500">
              Total modeled structural budget
            </p>
          </div>

          {/* Earned Value (EV) */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold uppercase">
              <span>Earned Value (EV)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
              {format5DCurrency(summary.approvedCostEV, rates.currencySymbol)}
            </div>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
              {earnedValuePct}% QA/QC Approved &amp; Certified
            </p>
          </div>

          {/* Work in Progress */}
          <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-mono font-bold uppercase">
              <span>In-Progress (WIP)</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-700 dark:text-amber-300">
              {format5DCurrency(summary.inProgressCost, rates.currencySymbol)}
            </div>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80">
              Under Rebar / Formwork / Pouring
            </p>
          </div>

          {/* Material Volumes Total */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-mono font-bold uppercase">
              <span>Structural Quantities</span>
              <Layers className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white">
              {summary.plannedVolume.toFixed(1)} m³{" "}
              <span className="text-xs font-normal text-slate-400">conc</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              {summary.plannedFormworkArea.toFixed(1)} m² fmwk ·{" "}
              {summary.plannedRebarTonnage.toFixed(1)} t steel
            </p>
          </div>
        </div>

        {/* 5D Trade Financial Distribution Bar */}
        <div className="space-y-2 bg-slate-50 dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-brand-500" />
              5D Trade Cost Distribution
            </span>
            <span className="text-slate-500">
              100% = {format5DCurrency(summary.plannedCostPV, rates.currencySymbol)}
            </span>
          </div>

          {/* Segmented Cost Stack Bar */}
          <div className="w-full h-3.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${tradeShares.concretePct}%` }}
              className="h-full bg-cyan-500 transition-all duration-500"
              title={`Concrete Supply: ${tradeShares.concretePct}% (${format5DCurrency(summary.concreteCostTotal, rates.currencySymbol)})`}
            />
            <div
              style={{ width: `${tradeShares.rebarPct}%` }}
              className="h-full bg-amber-500 transition-all duration-500"
              title={`Reinforcement Steel: ${tradeShares.rebarPct}% (${format5DCurrency(summary.rebarCostTotal, rates.currencySymbol)})`}
            />
            <div
              style={{ width: `${tradeShares.formworkPct}%` }}
              className="h-full bg-emerald-500 transition-all duration-500"
              title={`Formwork & Shuttering: ${tradeShares.formworkPct}% (${format5DCurrency(summary.formworkCostTotal, rates.currencySymbol)})`}
            />
            <div
              style={{ width: `${tradeShares.laborPlantPct}%` }}
              className="h-full bg-purple-500 transition-all duration-500"
              title={`Labor & Plant Equipment: ${tradeShares.laborPlantPct}%`}
            />
          </div>

          {/* Trade Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shrink-0" />
              <span>
                Concrete: <strong>{format5DCurrency(summary.concreteCostTotal, rates.currencySymbol)}</strong> ({tradeShares.concretePct}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span>
                Rebar Steel: <strong>{format5DCurrency(summary.rebarCostTotal, rates.currencySymbol)}</strong> ({tradeShares.rebarPct}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>
                Formwork: <strong>{format5DCurrency(summary.formworkCostTotal, rates.currencySymbol)}</strong> ({tradeShares.formworkPct}%)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
              <span>
                Labor &amp; Plant: <strong>{format5DCurrency(summary.laborCostTotal + summary.equipmentCostTotal, rates.currencySymbol)}</strong> ({tradeShares.laborPlantPct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Collapsible Unit Rate Settings Matrix Drawer */}
        {showRateSettings && (
          <div className="p-4 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-brand-500/30 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Project 5D Unit Rates Matrix (Live Pricing)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setRates(DEFAULT_PROJECT_COST_RATES);
                    handleSaveRates(DEFAULT_PROJECT_COST_RATES);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Defaults
                </button>
                <button
                  onClick={() => handleSaveRates(rates)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition disabled:opacity-50"
                >
                  <Save className={`w-3.5 h-3.5 ${isSaving ? "animate-spin" : ""}`} />
                  <span>{isSaving ? "Saving..." : "Save to Database"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={rates.currencySymbol}
                  onChange={(e) =>
                    setRates({ ...rates, currencySymbol: e.target.value })
                  }
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Formwork ({rates.currencySymbol}/m²)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={rates.formworkRate}
                  onChange={(e) =>
                    setRates({
                      ...rates,
                      formworkRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Rebar ({rates.currencySymbol}/Tonne)
                </label>
                <input
                  type="number"
                  step="10"
                  value={rates.rebarRatePerTonne}
                  onChange={(e) =>
                    setRates({
                      ...rates,
                      rebarRatePerTonne: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Concrete C30 ({rates.currencySymbol}/m³)
                </label>
                <input
                  type="number"
                  step="1"
                  value={rates.concreteRates["C30"] || 135}
                  onChange={(e) =>
                    setRates({
                      ...rates,
                      concreteRates: {
                        ...rates.concreteRates,
                        C30: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Labor ({rates.currencySymbol}/m³)
                </label>
                <input
                  type="number"
                  step="1"
                  value={rates.laborRatePerM3}
                  onChange={(e) =>
                    setRates({
                      ...rates,
                      laborRatePerM3: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Plant/Pump ({rates.currencySymbol}/m³)
                </label>
                <input
                  type="number"
                  step="1"
                  value={rates.equipmentRatePerM3}
                  onChange={(e) =>
                    setRates({
                      ...rates,
                      equipmentRatePerM3: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Itemized 5D BOQ Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {/* Table Filters & Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-950/60">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search elements by name, grid, grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none w-64 shadow-xs"
            />

            <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
              {["ALL", "COLUMN", "BEAM", "SLAB", "WALL"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    typeFilter === t
                      ? "bg-brand-600 text-white shadow"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs font-mono font-bold text-slate-500">
            Showing {displayElements.length} of {levelElements.length} line items
          </div>
        </div>

        {/* BOQ Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100/80 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Element / Grid</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Grade</th>
                <th className="py-3 px-3 text-right">Volume (m³)</th>
                <th className="py-3 px-3 text-right">Formwork (m²)</th>
                <th className="py-3 px-3 text-right">Rebar (t)</th>
                <th className="py-3 px-3 text-right">Concrete ($)</th>
                <th className="py-3 px-3 text-right">Formwork ($)</th>
                <th className="py-3 px-3 text-right">Rebar ($)</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                  Line Total
                </th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {displayElements.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No structural elements found matching the criteria.
                  </td>
                </tr>
              ) : (
                displayElements.map((el) => {
                  const c = calculateElement5DCost(el, rates);
                  return (
                    <tr
                      key={el.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                      onClick={() => onInspectElement && onInspectElement(el)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{el.elementName}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {el.grid || el.gridAxis || "No grid"}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {el.elementType}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-brand-600 dark:text-brand-400 font-bold">
                        {el.concreteGrade || "C30"}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {c.concreteVolume.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {c.formworkArea.toFixed(1)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-amber-600 dark:text-amber-400">
                        {c.rebarTonnage.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {format5DCurrency(c.concreteCost, rates.currencySymbol)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {format5DCurrency(c.formworkCost, rates.currencySymbol)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {format5DCurrency(c.rebarCost, rates.currencySymbol)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-950/40">
                        {format5DCurrency(c.totalCost, rates.currencySymbol)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            el.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                              : el.status === "POURED"
                                ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30"
                                : el.status === "REJECTED"
                                  ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {el.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footer Totals */}
            {displayElements.length > 0 && (
              <tfoot className="bg-slate-100 dark:bg-slate-950 font-mono font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                <tr>
                  <td colSpan={3} className="py-3 px-4 uppercase text-[11px]">
                    Subtotal for Displayed ({displayElements.length} elements)
                  </td>
                  <td className="py-3 px-3 text-right">
                    {displayElements
                      .reduce(
                        (sum, el) =>
                          sum + calculateElement5DCost(el, rates).concreteVolume,
                        0,
                      )
                      .toFixed(2)}{" "}
                    m³
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400">
                    {displayElements
                      .reduce(
                        (sum, el) =>
                          sum + calculateElement5DCost(el, rates).formworkArea,
                        0,
                      )
                      .toFixed(1)}{" "}
                    m²
                  </td>
                  <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400">
                    {displayElements
                      .reduce(
                        (sum, el) =>
                          sum + calculateElement5DCost(el, rates).rebarTonnage,
                        0,
                      )
                      .toFixed(2)}{" "}
                    t
                  </td>
                  <td colSpan={3} />
                  <td className="py-3 px-4 text-right font-black text-sm text-brand-600 dark:text-brand-400 bg-brand-500/10">
                    {format5DCurrency(
                      displayElements.reduce(
                        (sum, el) =>
                          sum + calculateElement5DCost(el, rates).totalCost,
                        0,
                      ),
                      rates.currencySymbol,
                    )}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default Element5DCostViewer;
