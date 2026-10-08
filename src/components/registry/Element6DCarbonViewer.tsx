import React, { useState, useMemo } from "react";
import {
  StructuralElement,
  ProjectLevel,
  CarbonFactors,
  Level6DCarbonSummary,
  EcoRating,
} from "@/types";
import {
  DEFAULT_CARBON_FACTORS,
  calculateElement6DCarbon,
  calculateLevel6DCarbonSummary,
  formatCarbonKg,
  formatCarbonTonne,
} from "@/lib/carbonCalculations";
import {
  Leaf,
  Trees,
  Sliders,
  TrendingDown,
  Download,
  FileSpreadsheet,
  Layers,
  Box,
  RotateCcw,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
  Building2,
  Award,
  Sparkles,
  Zap,
  Info,
  Save,
} from "lucide-react";
import { useProjectStore } from "@/stores/useProjectStore";
import { toast } from "react-hot-toast";

interface Element6DCarbonViewerProps {
  elements: StructuralElement[];
  levels: ProjectLevel[];
  selectedLevelId: string;
  onSelectLevel: (lvlId: string) => void;
  onInspectElement?: (el: StructuralElement) => void;
  className?: string;
}

export const Element6DCarbonViewer: React.FC<Element6DCarbonViewerProps> = ({
  elements,
  levels,
  selectedLevelId,
  onSelectLevel,
  onInspectElement,
  className = "",
}) => {
  const { activeProject, updateCarbonFactors } = useProjectStore();
  const [factors, setFactors] = useState<CarbonFactors>(() => {
    return activeProject?.carbonFactors || DEFAULT_CARBON_FACTORS;
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showFactorSettings, setShowFactorSettings] = useState<boolean>(false);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sync state if activeProject.carbonFactors updates
  React.useEffect(() => {
    if (activeProject?.carbonFactors) {
      setFactors(activeProject.carbonFactors);
    }
  }, [activeProject?.carbonFactors]);

  const handleSaveFactors = async (factorsToSave: CarbonFactors = factors) => {
    setIsSaving(true);
    try {
      await updateCarbonFactors(factorsToSave);
      toast.success("6D Carbon Factors saved to project database.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save carbon factors to database.");
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

  // Filter elements by active floor level & search
  const filteredElements = useMemo(() => {
    return elements.filter((el) => {
      if (selectedLevelId !== "ALL" && el.levelId !== selectedLevelId) {
        return false;
      }
      if (typeFilter !== "ALL" && el.elementType !== typeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (el.elementName || "").toLowerCase();
        const grid = (el.grid || el.gridAxis || "").toLowerCase();
        const grade = (el.concreteGrade || "").toLowerCase();
        return name.includes(q) || grid.includes(q) || grade.includes(q);
      }
      return true;
    });
  }, [elements, selectedLevelId, typeFilter, searchQuery]);

  // Compute 6D Carbon Breakdown for each element
  const itemizedCarbon = useMemo(() => {
    return filteredElements.map((el) => ({
      element: el,
      breakdown: calculateElement6DCarbon(el, factors),
    }));
  }, [filteredElements, factors]);

  // Aggregate Level/Project 6D Summary
  const summary: Level6DCarbonSummary = useMemo(() => {
    return calculateLevel6DCarbonSummary(
      filteredElements,
      selectedLevelId,
      currentLevelName,
      factors
    );
  }, [filteredElements, selectedLevelId, currentLevelName, factors]);

  // Unique element types for filtering
  const elementTypes = useMemo(() => {
    const set = new Set<string>();
    elements.forEach((e) => {
      if (e.elementType) set.add(e.elementType);
    });
    return Array.from(set);
  }, [elements]);

  // Export 6D Carbon Audit CSV
  const handleExportCSV = () => {
    if (itemizedCarbon.length === 0) {
      toast.error("No element carbon data available to export.");
      return;
    }

    const headers = [
      "Element Name",
      "Type",
      "Level",
      "Grid Axis",
      "Concrete Grade",
      "Volume (m3)",
      "Formwork Area (m2)",
      "Rebar (Tonnes)",
      "Concrete Carbon (kg CO2e)",
      "Rebar Carbon (kg CO2e)",
      "Formwork Carbon (kg CO2e)",
      "Transport Carbon (kg CO2e)",
      "Total Carbon (kg CO2e)",
      "Total Carbon (t CO2e)",
      "Intensity (kg CO2e/m3)",
      "SCM Avoided Carbon (kg CO2e)",
      "Eco Rating",
      "Status",
    ];

    const rows = itemizedCarbon.map(({ element: el, breakdown: b }) => [
      `"${el.elementName || "Element"}"`,
      `"${el.elementType || ""}"`,
      `"${levelNameMap.get(el.levelId || "") || el.levelName || ""}"`,
      `"${el.grid || el.gridAxis || ""}"`,
      `"${el.concreteGrade || "C30/37"}"`,
      b.concreteVolume.toFixed(3),
      b.formworkArea.toFixed(2),
      b.rebarTonnage.toFixed(3),
      b.concreteCarbonKg.toFixed(1),
      b.rebarCarbonKg.toFixed(1),
      b.formworkCarbonKg.toFixed(1),
      b.transportCarbonKg.toFixed(1),
      b.totalCarbonKg.toFixed(1),
      b.totalCarbonTonne.toFixed(3),
      b.carbonIntensityKgPerM3.toFixed(1),
      b.scmAvoidedCarbonKg.toFixed(1),
      `"${b.ecoRating}"`,
      `"${el.status}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `6D_Carbon_Audit_Schedule_${currentLevelName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("6D Carbon Audit schedule exported.");
  };

  const getEcoBadgeColor = (rating: EcoRating) => {
    switch (rating) {
      case "A+":
        return "bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20";
      case "A":
        return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40";
      case "B":
        return "bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40";
      case "C":
        return "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40";
      case "D":
        return "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/40";
      case "E":
      default:
        return "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40";
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ═══ 6D HEADER & SUSTAINABILITY CONTROLS ═══ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-black uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1">
                <Leaf className="w-3 h-3" />
                <span>6D BIM Sustainability &amp; Embodied Carbon</span>
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {currentLevelName}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Whole-Life Carbon Assessment &amp; Green Mix Schedule</span>
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowFactorSettings(!showFactorSettings)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs border ${
                showFactorSettings
                  ? "bg-emerald-600 text-white border-emerald-600 shadow"
                  : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Carbon Factors &amp; SCM</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  showFactorSettings ? "rotate-180" : ""
                }`}
              />
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-sm transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
              <span>Export Carbon Audit</span>
            </button>
          </div>
        </div>

        {/* ═══ CARBON FACTORS & SCM PARAMETERS DRAWER ═══ */}
        {showFactorSettings && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Trees className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Embodied Carbon &amp; SCM Parameter Calibration</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFactors(DEFAULT_CARBON_FACTORS);
                    handleSaveFactors(DEFAULT_CARBON_FACTORS);
                  }}
                  className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-mono px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to ICE Defaults</span>
                </button>
                <button
                  onClick={() => handleSaveFactors(factors)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
                >
                  <Save className={`w-3.5 h-3.5 ${isSaving ? "animate-spin" : ""}`} />
                  <span>{isSaving ? "Saving..." : "Save to Database"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* SCM Clinker Replacement % Slider */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>SCM Replacement (GGBS / PFA)</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    {factors.scmReplacementPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={70}
                  step={5}
                  value={factors.scmReplacementPct}
                  onChange={(e) =>
                    setFactors((prev) => ({
                      ...prev,
                      scmReplacementPct: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block">
                  Lowers net clinker calcination emissions
                </span>
              </div>

              {/* Recycled Scrap Rebar % Slider */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Recycled EAF Scrap Steel</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400">
                    {factors.recycledSteelPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={95}
                  step={5}
                  value={factors.recycledSteelPct}
                  onChange={(e) =>
                    setFactors((prev) => ({
                      ...prev,
                      recycledSteelPct: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block">
                  Electric Arc Furnace vs. Basic Oxygen Steel
                </span>
              </div>

              {/* Baseline Rebar Factor */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                  Virgin Rebar Factor (kg CO₂e/T)
                </label>
                <input
                  type="number"
                  value={factors.rebarCarbonFactor}
                  onChange={(e) =>
                    setFactors((prev) => ({
                      ...prev,
                      rebarCarbonFactor: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono font-bold text-xs"
                />
              </div>

              {/* Formwork Reuse Factor */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                  Formwork Factor (kg CO₂e/m²)
                </label>
                <input
                  type="number"
                  value={factors.formworkCarbonFactor}
                  onChange={(e) =>
                    setFactors((prev) => ({
                      ...prev,
                      formworkCarbonFactor: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono font-bold text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* ═══ LIVE 6D KPI DECK ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Embodied Carbon */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Total Embodied Carbon</span>
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {formatCarbonTonne(summary.totalCarbonTonne)}
            </div>
            <span className="text-[10px] text-slate-400 block">
              {summary.totalElementsCount} structural members assessed
            </span>
          </div>

          {/* Average Carbon Intensity */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Carbon Intensity</span>
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400">
              {summary.averageIntensityKgPerM3.toFixed(1)}{" "}
              <span className="text-xs font-normal text-slate-400">kg CO₂e/m³</span>
            </div>
            <span className="text-[10px] text-slate-400 block">
              Volumetric carbon density
            </span>
          </div>

          {/* SCM Offset Avoidance */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>SCM Carbon Offset</span>
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-teal-600 dark:text-teal-400">
              {formatCarbonTonne(summary.totalScmAvoidedCarbonTonne)}
            </div>
            <span className="text-[10px] text-slate-400 block">
              Saved via {factors.scmReplacementPct}% clinker replacement
            </span>
          </div>

          {/* Green Building Tier */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Green Building Rating</span>
            </span>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
              {summary.greenBuildingTier}
            </div>
            <span className="text-[10px] text-slate-400 block font-mono">
              LEED / BREEAM Structural Tier
            </span>
          </div>
        </div>

        {/* ═══ CARBON TRADE SEGMENTATION BAR ═══ */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">
              Trade Embodied Carbon Distribution
            </span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                <span>
                  Concrete ({summary.totalCarbonKg > 0 ? ((summary.concreteCarbonTonne / summary.totalCarbonTonne) * 100).toFixed(0) : 0}%)
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>
                  Rebar ({summary.totalCarbonKg > 0 ? ((summary.rebarCarbonTonne / summary.totalCarbonTonne) * 100).toFixed(0) : 0}%)
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>
                  Formwork ({summary.totalCarbonKg > 0 ? ((summary.formworkCarbonTonne / summary.totalCarbonTonne) * 100).toFixed(0) : 0}%)
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>
                  Logistics ({summary.totalCarbonKg > 0 ? ((summary.transportCarbonTonne / summary.totalCarbonTonne) * 100).toFixed(0) : 0}%)
                </span>
              </span>
            </div>
          </div>

          <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800 flex overflow-hidden p-0.5 border border-slate-300 dark:border-slate-700">
            {summary.totalCarbonTonne > 0 && (
              <>
                <div
                  style={{ width: `${(summary.concreteCarbonTonne / summary.totalCarbonTonne) * 100}%` }}
                  className="bg-cyan-500 h-full rounded-l-full transition-all duration-500"
                  title={`Concrete: ${formatCarbonTonne(summary.concreteCarbonTonne)}`}
                />
                <div
                  style={{ width: `${(summary.rebarCarbonTonne / summary.totalCarbonTonne) * 100}%` }}
                  className="bg-purple-500 h-full transition-all duration-500"
                  title={`Rebar: ${formatCarbonTonne(summary.rebarCarbonTonne)}`}
                />
                <div
                  style={{ width: `${(summary.formworkCarbonTonne / summary.totalCarbonTonne) * 100}%` }}
                  className="bg-amber-500 h-full transition-all duration-500"
                  title={`Formwork: ${formatCarbonTonne(summary.formworkCarbonTonne)}`}
                />
                <div
                  style={{ width: `${(summary.transportCarbonTonne / summary.totalCarbonTonne) * 100}%` }}
                  className="bg-emerald-500 h-full rounded-r-full transition-all duration-500"
                  title={`Transport: ${formatCarbonTonne(summary.transportCarbonTonne)}`}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ FILTER & SEARCH BAR ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Level Switcher */}
          <select
            value={selectedLevelId}
            onChange={(e) => onSelectLevel(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Floor Levels</option>
            {levels.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>
                {lvl.name}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">All Element Types</option>
            {elementTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Search by name, grid, grade..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 w-full sm:w-64"
        />
      </div>

      {/* ═══ ITEMIZED 6D CARBON AUDIT TABLE ═══ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-mono text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">Element Identifier</th>
                <th className="py-3.5 px-4 font-bold">Type / Grade</th>
                <th className="py-3.5 px-4 font-bold text-right">Volume</th>
                <th className="py-3.5 px-4 font-bold text-right">Rebar Steel</th>
                <th className="py-3.5 px-4 font-bold text-right">Concrete CO₂</th>
                <th className="py-3.5 px-4 font-bold text-right">Rebar CO₂</th>
                <th className="py-3.5 px-4 font-bold text-right">Total Carbon</th>
                <th className="py-3.5 px-4 font-bold text-right">Intensity</th>
                <th className="py-3.5 px-4 font-bold text-center">Eco Rating</th>
                <th className="py-3.5 px-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {itemizedCarbon.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No structural elements matching the filter criteria.
                  </td>
                </tr>
              ) : (
                itemizedCarbon.map(({ element: el, breakdown: b }) => (
                  <tr
                    key={el.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group"
                  >
                    {/* Name & Grid */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white font-sans text-xs flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                        <span>{el.elementName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {levelNameMap.get(el.levelId || "") || el.levelName || "Level"} · Grid: {el.grid || el.gridAxis || "N/A"}
                      </div>
                    </td>

                    {/* Type & Grade */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {el.elementType}
                      </span>
                      <span className="block text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">
                        {el.concreteGrade || "C30/37"}
                      </span>
                    </td>

                    {/* Volume */}
                    <td className="py-3 px-4 text-right">
                      {b.concreteVolume.toFixed(2)} m³
                    </td>

                    {/* Rebar Steel */}
                    <td className="py-3 px-4 text-right">
                      {(b.rebarTonnage * 1000).toFixed(0)} kg
                    </td>

                    {/* Concrete Carbon */}
                    <td className="py-3 px-4 text-right text-cyan-600 dark:text-cyan-400 font-semibold">
                      {b.concreteCarbonKg.toFixed(0)} kg
                    </td>

                    {/* Rebar Carbon */}
                    <td className="py-3 px-4 text-right text-purple-600 dark:text-purple-400 font-semibold">
                      {b.rebarCarbonKg.toFixed(0)} kg
                    </td>

                    {/* Total Carbon */}
                    <td className="py-3 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                      {formatCarbonKg(b.totalCarbonKg)}
                    </td>

                    {/* Intensity */}
                    <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300">
                      {b.carbonIntensityKgPerM3.toFixed(0)} <span className="text-[10px] text-slate-400">kg/m³</span>
                    </td>

                    {/* Eco Rating */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getEcoBadgeColor(
                          b.ecoRating
                        )}`}
                      >
                        {b.ecoRating}
                      </span>
                    </td>

                    {/* Inspect Link */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onInspectElement && onInspectElement(el)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                        title="Inspect 3D Twin & 6D Carbon Breakdown"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Subtotal Summary Footer */}
            <tfoot className="bg-slate-50 dark:bg-slate-950 font-mono font-bold text-xs border-t border-slate-200 dark:border-slate-800">
              <tr>
                <td colSpan={2} className="py-3.5 px-4 text-slate-900 dark:text-white uppercase font-sans">
                  Total Assessment ({filteredElements.length} members)
                </td>
                <td className="py-3.5 px-4 text-right">{summary.totalVolumeM3.toFixed(2)} m³</td>
                <td className="py-3.5 px-4 text-right">
                  {(summary.rebarCarbonTonne > 0 ? (summary.rebarCarbonTonne / 1.65).toFixed(2) : 0)} T
                </td>
                <td className="py-3.5 px-4 text-right text-cyan-600 dark:text-cyan-400">
                  {formatCarbonTonne(summary.concreteCarbonTonne)}
                </td>
                <td className="py-3.5 px-4 text-right text-purple-600 dark:text-purple-400">
                  {formatCarbonTonne(summary.rebarCarbonTonne)}
                </td>
                <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatCarbonTonne(summary.totalCarbonTonne)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {summary.averageIntensityKgPerM3.toFixed(0)} kg/m³
                </td>
                <td colSpan={2} className="py-3.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-sans">
                  Tier: {summary.greenBuildingTier}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Element6DCarbonViewer;
