import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService } from "@/lib/db";
import { StructuralElement, ProjectLevel } from "@/types";
import { ElementSizeSchedule } from "@/components/registry/ElementSizeSchedule";
import { printMaterialTakeoffReport } from "@/services/pdf/materialTakeoffReport";
import { BIMDimensionNav } from "@/components/bim/BIMDimensionNav";
import {
  Layers,
  Box,
  FileSpreadsheet,
  Table,
  BarChart3,
  Calculator,
  Package,
  Info,
  Droplets,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Grid as GridIcon,
  Printer,
  FlaskConical,
  FileText,
  ChevronDown,
  Building2,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Truck,
  Scale,
  Settings2,
} from "lucide-react";

/* ─── Mix Presets ─── */
const MIX_PRESETS = [
  { name: "M15 (1:2:4) - Blinding & Mass Concrete", value: "1:2:4" },
  { name: "M20 (1:1.5:3) - General Reinforced Concrete", value: "1:1.5:3" },
  { name: "M25 (1:1:2) - High Strength / Heavy Load", value: "1:1:2" },
  { name: "M30 (1:1.2:2.4) - Pre-stressed / Columns", value: "1:1.2:2.4" },
  { name: "M35 (1:1.5:2.5) - CDL Grade 35 with Admixture", value: "1:1.5:2.5" },
];

/* ─── Admixture Presets ─── */
const ADMIXTURE_PRESETS = [
  { name: "Superplasticizer (SNF)", value: "Superplasticizer (SNF)" },
  { name: "Lignosulfonate Water Reducer", value: "Lignosulfonate Water Reducer" },
  { name: "Set Retarding Admixture (Plastiment)", value: "Set Retarding Admixture (Plastiment)" },
  { name: "Accelerating Admixture (Non-Chloride)", value: "Accelerating Admixture (Non-Chloride)" },
  { name: "Air-Entraining Agent (AEA)", value: "Air-Entraining Agent (AEA)" },
  { name: "Integral Waterproofing Compound", value: "Integral Waterproofing Compound" },
  { name: "None / Plain Mix", value: "None / Plain Mix" },
];

/* ─── Aggregate Tipper Fleet Presets (Trips apply specifically to Sand & Stone) ─── */
const FLEET_PRESETS = [
  {
    name: "20T Standard Tippers",
    sandCap: 20,
    stoneCap: 20,
  },
  {
    name: "30T Heavy Tippers",
    sandCap: 30,
    stoneCap: 30,
  },
  {
    name: "10T Medium Urban Tippers",
    sandCap: 10,
    stoneCap: 10,
  },
  {
    name: "15T Intermediate Tippers",
    sandCap: 15,
    stoneCap: 15,
  },
];

/* ─── Material Calculation Helper (Includes Tonnes & Aggregate Trips) ─── */
const calculateMaterials = (
  wetVolume: number,
  ratio: string,
  dryFactor: number,
  admixtureDosageMlPerBag: number = 300,
  logistics?: {
    sandDensity: number;
    stoneDensity: number;
    sandTruckCapacity: number;
    stoneTruckCapacity: number;
  },
) => {
  const sandDensity = logistics?.sandDensity ?? 1.6;
  const stoneDensity = logistics?.stoneDensity ?? 2.6;
  const sandTruckCapacity = logistics?.sandTruckCapacity ?? 30;
  const stoneTruckCapacity = logistics?.stoneTruckCapacity ?? 30;

  if (wetVolume <= 0) {
    return {
      bagsCement: 0,
      sandM3: 0,
      stoneM3: 0,
      waterLiters: 0,
      dryVolume: 0,
      cementWeightKg: 0,
      admixtureMl: 0,
      admixtureLiters: 0,
      cementTonnes: 0,
      sandTonnes: 0,
      stoneTonnes: 0,
      waterTonnes: 0,
      sandTrips: 0,
      stoneTrips: 0,
      totalMaterialTonnes: 0,
      totalTrips: 0,
    };
  }

  const parts = ratio.split(":").map(Number);
  if (parts.length !== 3 || parts.some(isNaN) || parts[0] === 0) {
    return {
      bagsCement: 0,
      sandM3: 0,
      stoneM3: 0,
      waterLiters: 0,
      dryVolume: 0,
      cementWeightKg: 0,
      admixtureMl: 0,
      admixtureLiters: 0,
      cementTonnes: 0,
      sandTonnes: 0,
      stoneTonnes: 0,
      waterTonnes: 0,
      sandTrips: 0,
      stoneTrips: 0,
      totalMaterialTonnes: 0,
      totalTrips: 0,
    };
  }

  const [cementPart, sandPart, stonePart] = parts;
  const totalParts = cementPart + sandPart + stonePart;

  const dryVolume = wetVolume * dryFactor;

  const cementVol = (cementPart / totalParts) * dryVolume;
  const sandVol = (sandPart / totalParts) * dryVolume;
  const stoneVol = (stonePart / totalParts) * dryVolume;

  const cementWeightKg = cementVol * 1440;
  const bagsCement = Math.ceil(cementWeightKg / 50);
  const waterLiters = Math.round(bagsCement * 25);
  const admixtureMl = Math.round(bagsCement * admixtureDosageMlPerBag);
  const admixtureLiters = parseFloat((admixtureMl / 1000).toFixed(2));

  const sandM3 = parseFloat(sandVol.toFixed(2));
  const stoneM3 = parseFloat(stoneVol.toFixed(2));

  // Weights in Metric Tonnes (All materials have weights)
  const cementTonnes = parseFloat((cementWeightKg / 1000).toFixed(2));
  const sandTonnes = parseFloat((sandM3 * sandDensity).toFixed(2));
  const stoneTonnes = parseFloat((stoneM3 * stoneDensity).toFixed(2));
  const waterTonnes = parseFloat((waterLiters / 1000).toFixed(2));

  // Trips strictly apply to Sand and Stone aggregate tippers only
  const sandTrips =
    sandTonnes > 0 && sandTruckCapacity > 0
      ? Math.ceil(sandTonnes / sandTruckCapacity)
      : 0;
  const stoneTrips =
    stoneTonnes > 0 && stoneTruckCapacity > 0
      ? Math.ceil(stoneTonnes / stoneTruckCapacity)
      : 0;

  const totalMaterialTonnes = parseFloat(
    (cementTonnes + sandTonnes + stoneTonnes + waterTonnes).toFixed(2),
  );
  // Total trips count strictly aggregate tippers
  const totalTrips = sandTrips + stoneTrips;

  return {
    bagsCement,
    sandM3,
    stoneM3,
    waterLiters,
    dryVolume: parseFloat(dryVolume.toFixed(3)),
    cementWeightKg: parseFloat(cementWeightKg.toFixed(2)),
    admixtureMl,
    admixtureLiters,
    cementTonnes,
    sandTonnes,
    stoneTonnes,
    waterTonnes,
    sandTrips,
    stoneTrips,
    totalMaterialTonnes,
    totalTrips,
  };
};

export const MaterialTakeoff: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentCompId = currentUser?.companyId || company?.id || "";
  const currentProjId = projectId || activeProject?.id || "";

  const [elements, setElements] = useState<StructuralElement[]>([]);
  const [levels, setLevels] = useState<ProjectLevel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    "CALCULATOR" | "SCHEDULE" | "LEVELS"
  >("CALCULATOR");
  const [showPrintDropdown, setShowPrintDropdown] = useState<boolean>(false);

  // Calculator Parameters
  const [selectedLevelId, setSelectedLevelId] = useState<string>(
    activeProject?.currentLevelId || "ALL",
  );
  const prevLevelIdRef = useRef<string | undefined>(activeProject?.currentLevelId);
  useEffect(() => {
    if (activeProject?.currentLevelId !== prevLevelIdRef.current) {
      prevLevelIdRef.current = activeProject?.currentLevelId;
      setSelectedLevelId(activeProject?.currentLevelId || "ALL");
    }
  }, [activeProject?.currentLevelId]);

  const [mixRatio, setMixRatio] = useState<string>("1:1.5:2.5");
  const [admixtureType, setAdmixtureType] = useState<string>(
    "Superplasticizer (SNF)",
  );
  const [admixtureDosageMl, setAdmixtureDosageMl] = useState<number>(750);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [includeWastage, setIncludeWastage] = useState<boolean>(true);
  const [wastagePercent, setWastagePercent] = useState<number>(10);
  const [dryVolumeFactor, setDryVolumeFactor] = useState<number>(1.54);

  // ─── Flexible Haulage & Logistics Parameters (Trips strictly apply to Sand & Stone) ───
  const [sandDensity, setSandDensity] = useState<number>(1.6); // tonnes/m3
  const [stoneDensity, setStoneDensity] = useState<number>(2.6); // tonnes/m3
  const [concreteDensity, setConcreteDensity] = useState<number>(2.4); // tonnes/m3
  const [sandTruckCapacity, setSandTruckCapacity] = useState<number>(30); // tonnes/trip
  const [stoneTruckCapacity, setStoneTruckCapacity] = useState<number>(30); // tonnes/trip

  // ─── Report Content Options (By default, formwork & rebars are NOT shown in reports) ───
  const [showFormworkInReport, setShowFormworkInReport] = useState<boolean>(false);
  const [showRebarsInReport, setShowRebarsInReport] = useState<boolean>(false);
  const [showLogisticsInReport, setShowLogisticsInReport] = useState<boolean>(true);

  const [selectedCategories, setSelectedCategories] = useState<
    Record<string, boolean>
  >({
    Column: true,
    Slab: true,
    Beam: true,
    Wall: true,
    Stair: true,
    Other: true,
  });

  useEffect(() => {
    async function load() {
      if (!currentProjId) return;
      setLoading(true);
      try {
        const [elList, lvlList] = await Promise.all([
          dbService.getElements(currentProjId, currentCompId),
          dbService.getLevels(currentProjId, currentCompId),
        ]);
        setElements(elList);
        setLevels(lvlList);
      } catch (err) {
        console.error("Error loading MTO data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentProjId, currentCompId]);

  const toggleCategorySelection = (catKey: string) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  const resetLogisticsParams = () => {
    setSandDensity(1.6);
    setStoneDensity(1.6);
    setConcreteDensity(2.4);
    setSandTruckCapacity(20);
    setStoneTruckCapacity(20);
  };

  const applyFleetPreset = (preset: (typeof FLEET_PRESETS)[0]) => {
    setSandTruckCapacity(preset.sandCap);
    setStoneTruckCapacity(preset.stoneCap);
  };

  /* ─── Active Level Filtered Elements ─── */
  const activeLevelElements = useMemo(() => {
    return elements.filter(
      (el) => selectedLevelId === "ALL" || el.levelId === selectedLevelId,
    );
  }, [elements, selectedLevelId]);

  /* ─── Categorized Quantities Calculation (Strictly scoped to selected level) ─── */
  const calculatedData = useMemo(() => {
    const summaryMap: Record<
      string,
      {
        rawVolume: number;
        rawFormworkArea: number;
        count: number;
        items: StructuralElement[];
      }
    > = {
      Column: { rawVolume: 0, rawFormworkArea: 0, count: 0, items: [] },
      Slab: { rawVolume: 0, rawFormworkArea: 0, count: 0, items: [] },
      Beam: { rawVolume: 0, rawFormworkArea: 0, count: 0, items: [] },
      Wall: { rawVolume: 0, rawFormworkArea: 0, count: 0, items: [] },
      Stair: { rawVolume: 0, rawFormworkArea: 0, count: 0, items: [] },
      Other: { rawVolume: 0, rawFormworkArea: 0, count: 0, items: [] },
    };

    activeLevelElements.forEach((el) => {
      let category = "Other";
      const type = (el.elementType || "").toLowerCase();
      if (type.includes("column")) category = "Column";
      else if (type.includes("slab")) category = "Slab";
      else if (type.includes("beam")) category = "Beam";
      else if (type.includes("wall")) category = "Wall";
      else if (type.includes("stair")) category = "Stair";

      const vol = el.calculatedVolume || el.volume || 0;
      const area = el.calculatedFormworkArea || vol * 4.5;

      summaryMap[category].rawVolume += vol;
      summaryMap[category].rawFormworkArea += area;
      summaryMap[category].count += 1;
      summaryMap[category].items.push(el);
    });

    let activeRawVolume = 0;
    let activeRawFormworkArea = 0;
    const wastageMultiplier = includeWastage
      ? 1 + Math.max(0, wastagePercent) / 100
      : 1;

    const categoriesList = Object.entries(summaryMap).map(([type, data]) => {
      const isIncluded = selectedCategories[type] ?? true;
      if (isIncluded) {
        activeRawVolume += data.rawVolume;
        activeRawFormworkArea += data.rawFormworkArea;
      }
      const totalWithWaste = data.rawVolume * wastageMultiplier;
      const totalFormworkWithWaste = data.rawFormworkArea * wastageMultiplier;

      const materials = calculateMaterials(
        totalWithWaste,
        mixRatio,
        dryVolumeFactor,
        admixtureDosageMl,
        {
          sandDensity,
          stoneDensity,
          sandTruckCapacity,
          stoneTruckCapacity,
        },
      );
      return {
        type,
        count: data.count,
        rawVolume: data.rawVolume,
        rawFormworkArea: data.rawFormworkArea,
        totalWithWaste,
        totalFormworkWithWaste,
        materials,
        isIncluded,
        items: data.items.sort((a, b) =>
          a.elementName.localeCompare(b.elementName),
        ),
      };
    });

    const filteredCategoriesTotal = categoriesList
      .filter((c) => c.isIncluded)
      .reduce((acc, curr) => acc + curr.rawVolume, 0);

    const filteredFormworkTotal = categoriesList
      .filter((c) => c.isIncluded)
      .reduce((acc, curr) => acc + curr.rawFormworkArea, 0);

    const totalWithWasteVolume = filteredCategoriesTotal * wastageMultiplier;
    const totalWithWasteFormworkArea =
      filteredFormworkTotal * wastageMultiplier;

    return {
      categories: categoriesList,
      totalRawVolume: filteredCategoriesTotal,
      totalRawFormworkArea: filteredFormworkTotal,
      totalWithWasteVolume,
      totalWithWasteFormworkArea,
    };
  }, [
    activeLevelElements,
    mixRatio,
    includeWastage,
    wastagePercent,
    dryVolumeFactor,
    selectedCategories,
    admixtureDosageMl,
    sandDensity,
    stoneDensity,
    sandTruckCapacity,
    stoneTruckCapacity,
  ]);

  const materialQuantities = useMemo(() => {
    const totalVol = calculatedData.totalWithWasteVolume;
    return calculateMaterials(
      totalVol,
      mixRatio,
      dryVolumeFactor,
      admixtureDosageMl,
      {
        sandDensity,
        stoneDensity,
        sandTruckCapacity,
        stoneTruckCapacity,
      },
    );
  }, [
    calculatedData.totalWithWasteVolume,
    mixRatio,
    dryVolumeFactor,
    admixtureDosageMl,
    sandDensity,
    stoneDensity,
    sandTruckCapacity,
    stoneTruckCapacity,
  ]);

  /* ─── Metrics strictly scoped to active floor selection ─── */
  const scopeTotalVolumeM3 = useMemo(() => {
    return activeLevelElements.reduce(
      (acc, el) => acc + (el.calculatedVolume || el.volume || 0),
      0,
    );
  }, [activeLevelElements]);

  const scopeTotalFormworkM2 = useMemo(() => {
    return activeLevelElements.reduce(
      (acc, el) =>
        acc + (el.calculatedFormworkArea || (el.calculatedVolume || 0) * 4.5),
      0,
    );
  }, [activeLevelElements]);

  const scopeEstimatedRebarTons = useMemo(() => {
    return Number(((scopeTotalVolumeM3 * 140) / 1000).toFixed(2));
  }, [scopeTotalVolumeM3]);

  /* ─── Level Summary (Strictly filtered if single level selected, all if ALL selected) ─── */
  const levelSummary = useMemo(() => {
    const activeLevels =
      selectedLevelId === "ALL"
        ? levels
        : levels.filter((l) => l.id === selectedLevelId);

    return activeLevels.map((lvl) => {
      const lvlElems = elements.filter((e) => e.levelId === lvl.id);
      const vol = lvlElems.reduce(
        (a, e) => a + (e.calculatedVolume || e.volume || 0),
        0,
      );
      const fw = lvlElems.reduce(
        (a, e) =>
          a + (e.calculatedFormworkArea || (e.calculatedVolume || 0) * 4.5),
        0,
      );
      return {
        level: lvl,
        count: lvlElems.length,
        volume: Number(vol.toFixed(2)),
        rebarTons: Number(((vol * 140) / 1000).toFixed(2)),
        formworkM2: Number(fw.toFixed(1)),
      };
    });
  }, [levels, elements, selectedLevelId]);

  const selectedLevelObj = useMemo(() => {
    return levels.find((l) => l.id === selectedLevelId);
  }, [levels, selectedLevelId]);

  const handleExportCSV = () => {
    const headers = [
      "Level Name",
      "Elevation (m)",
      "Element Count",
      "Concrete Volume (m3)",
      "Est. Rebar (Tons)",
      "Est. Formwork (m2)",
    ];
    const rows = levelSummary.map((item) => [
      `"${item.level.name}"`,
      item.level.elevation,
      item.count,
      item.volume,
      item.rebarTons,
      item.formworkM2,
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `material_takeoff_${currentProjId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = (reportType: "DETAILED" | "SUMMARY") => {
    setShowPrintDropdown(false);
    const selectedLevelName =
      selectedLevelId === "ALL"
        ? "All Project Levels Combined"
        : selectedLevelObj
        ? `${selectedLevelObj.name} (Elev: ${
            selectedLevelObj.elevation >= 0 ? "+" : ""
          }${selectedLevelObj.elevation}m)`
        : "Selected Floor Level Scope";

    const formattedLevelSummary = levelSummary.map((item) => ({
      levelName: item.level.name,
      elevation: item.level.elevation,
      count: item.count,
      volume: item.volume,
      rebarTons: item.rebarTons,
      formworkM2: item.formworkM2,
    }));

    printMaterialTakeoffReport({
      reportType,
      projectName: activeProject?.name || "Civil Engineering Project",
      projectId: currentProjId,
      companyName: company?.name || "JQMS Civil Infrastructure Ltd.",
      companyLogo: company?.logoUrl || "",
      createdBy:
        currentUser?.fullName || currentUser?.email || "QA/QC Engineer",
      selectedLevelName,
      mixRatio,
      includeWastage,
      wastagePercent,
      dryVolumeFactor,
      admixtureType,
      admixtureDosageMl,
      selectedCategories,
      showFormworkInReport,
      showRebarsInReport,
      showLogisticsInReport,
      logisticsParams: {
        sandDensity,
        stoneDensity,
        concreteDensity,
        cementBagWeightKg: 50,
        sandTruckCapacityTonnes: sandTruckCapacity,
        stoneTruckCapacityTonnes: stoneTruckCapacity,
      },
      levelSummary: formattedLevelSummary,
      calculatedData,
      materialQuantities,
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 animate-pulse">
          Loading Material Take-Off Engine...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ─── Top Hero Header Bar ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 p-6 lg:p-8 text-white border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 font-mono font-bold uppercase tracking-wider">
                <Calculator className="w-3.5 h-3.5 text-brand-400" />
                Civil Take-Off Engine 2.0
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Active CAD Batch Model
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20 text-[11px] font-semibold font-mono">
                <Truck className="w-3 h-3 text-amber-400" />
                {materialQuantities.totalMaterialTonnes} Tonnes &bull; {materialQuantities.totalTrips} Tipper Trips (Sand &amp; Stone)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                Material Take-Off &amp; Schedule
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
              Automated volumetric estimation (m³), mix batching, material tonnage conversions &amp; aggregate tipper trips (Sand &amp; Stone).
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/project/elements"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700/80 transition shadow-sm hover:shadow"
            >
              <Box className="w-4 h-4 text-brand-400" />
              <span>Element Registry</span>
            </Link>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700/80 transition shadow-sm hover:shadow cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            {/* Dual Print Action Button with Dropdown & Report Preferences */}
            <div className="relative">
              <button
                onClick={() => setShowPrintDropdown((prev) => !prev)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-xl shadow-brand-500/25 border border-brand-400/30 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Material Report</span>
                <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80" />
              </button>

              {showPrintDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Report Content &amp; Inclusions
                    </span>
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
                  </div>

                  {/* Explicit Report Toggle Options */}
                  <div className="space-y-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-xs">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
                      Filter Elements &amp; Schedules:
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-brand-600">
                      <input
                        type="checkbox"
                        checked={showFormworkInReport}
                        onChange={(e) => setShowFormworkInReport(e.target.checked)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                      />
                      <span className="text-[11px] font-medium">Include Formwork Contact Area</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-brand-600">
                      <input
                        type="checkbox"
                        checked={showRebarsInReport}
                        onChange={(e) => setShowRebarsInReport(e.target.checked)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                      />
                      <span className="text-[11px] font-medium">Include Rebar Estimations</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-brand-600">
                      <input
                        type="checkbox"
                        checked={showLogisticsInReport}
                        onChange={(e) => setShowLogisticsInReport(e.target.checked)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                      />
                      <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                        Include Tonnes &amp; Aggregate Trips
                      </span>
                    </label>

                    <p className="text-[9.5px] text-slate-400 dark:text-slate-500 leading-tight pt-1 border-t border-slate-200/50 dark:border-slate-800">
                      Formwork &amp; rebars are hidden by default. Trips apply to Sand &amp; Stone only.
                    </p>
                  </div>

                  <div className="pt-1 space-y-1.5">
                    <button
                      onClick={() => handlePrintReport("DETAILED")}
                      className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 text-left transition cursor-pointer group border border-transparent hover:border-purple-200 dark:hover:border-purple-800/50"
                    >
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 block">
                          Detailed Report (Full Schedule)
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                          Selected sections only, batch tonnes, aggregate trips + member schedule
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => handlePrintReport("SUMMARY")}
                      className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950/40 text-left transition cursor-pointer group border border-transparent hover:border-brand-200 dark:hover:border-brand-800/50"
                    >
                      <div className="p-2 rounded-lg bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-300 shrink-0">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 block">
                          Summary Report (Executive)
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                          Material BoQ, tonnages, aggregate tipper deliveries &amp; mix specs
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BIM Dimension Navigation Bar */}
      <BIMDimensionNav
        activeDimension="MTO"
        counts={{
          elements: elements.length,
          levels: levels.length,
        }}
      />

      {/* ─── Top 5 Dynamic KPI Summary Metric Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Concrete Volume */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-xl hover:shadow-md transition border-t-4 border-t-brand-500 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Concrete Volume
            </span>
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400">
              <Droplets size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {scopeTotalVolumeM3.toFixed(2)}
            </span>
            <span className="text-sm font-bold text-brand-600 dark:text-brand-400 font-mono">m³</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span>Elements in scope:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
              {activeLevelElements.length} members
            </span>
          </div>
        </div>

        {/* Metric 2: Total Material Weight in Tonnes */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-xl hover:shadow-md transition border-t-4 border-t-amber-500 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Materials Weight
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
              <Scale size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
              {materialQuantities.totalMaterialTonnes}
            </span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">Tonnes</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span>All Materials:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
              Cement + Sand + Stone + H₂O
            </span>
          </div>
        </div>

        {/* Metric 3: Total Aggregate Tipper Trips (Sand & Stone) */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-xl hover:shadow-md transition border-t-4 border-t-indigo-500 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Aggregate Tipper Trips
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <Truck size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight">
              {materialQuantities.totalTrips}
            </span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">Trips</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span>Sand &amp; Stone Only:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
              {materialQuantities.sandTrips} Sand + {materialQuantities.stoneTrips} Stone
            </span>
          </div>
        </div>

        {/* Metric 4: Formwork */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-xl hover:shadow-md transition border-t-4 border-t-emerald-500 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Formwork Contact
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <GridIcon size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {scopeTotalFormworkM2.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">m²</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span>Shuttering surface:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
              Contact area
            </span>
          </div>
        </div>

        {/* Metric 5: Admixture */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm dark:shadow-xl hover:shadow-md transition border-t-4 border-t-purple-500 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Chemical Admixture
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
              <FlaskConical size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {materialQuantities.admixtureLiters}
            </span>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400 font-mono">Liters</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2">
            <span>Dosage rate:</span>
            <span className="font-bold text-purple-700 dark:text-purple-300 font-mono truncate max-w-[100px]" title={admixtureType}>
              {admixtureDosageMl} mL/bag
            </span>
          </div>
        </div>
      </div>

      {/* ─── View Switcher Segmented Tabs ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab("CALCULATOR")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "CALCULATOR"
                ? "bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-md border border-slate-200 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Mix Calculator, Tonnes &amp; Trips BoQ</span>
          </button>

          <button
            onClick={() => setActiveTab("SCHEDULE")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "SCHEDULE"
                ? "bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-md border border-slate-200 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Member Size Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab("LEVELS")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "LEVELS"
                ? "bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-md border border-slate-200 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Floor Level Breakdown</span>
          </button>
        </div>

        <div className="px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-500"></span>
          <span>Scope: {selectedLevelId === "ALL" ? "All Levels Combined" : selectedLevelObj?.name || "Single Floor"}</span>
        </div>
      </div>

      {/* ─── TAB 1: MIX CALCULATOR & BOQ ─── */}
      {activeTab === "CALCULATOR" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* ─── STANDALONE BANNER: TARGET FLOOR LEVEL SCOPE ─── */}
          <div className="bg-gradient-to-r from-brand-900/90 via-slate-900 to-indigo-950 p-5 lg:p-6 rounded-3xl border border-brand-700/40 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-brand-500/20 text-brand-300 border border-brand-500/30 shrink-0">
                <Building2 size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Target Floor Level Scope
                  </h3>
                  {selectedLevelId !== "ALL" ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40 text-[10px] font-extrabold uppercase font-mono tracking-wider">
                      Single Level Filtered
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-500/30 text-brand-200 border border-brand-400/40 text-[10px] font-extrabold uppercase font-mono tracking-wider">
                      Entire Project Scope
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Select a specific level to isolate materials, concrete volume, tonnages, and aggregate tipper trips.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="relative min-w-[240px]">
                <select
                  value={selectedLevelId}
                  onChange={(e) => setSelectedLevelId(e.target.value)}
                  className="w-full bg-slate-950/90 border border-brand-500/40 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-400 transition cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900 text-white">
                    🏢 All Project Levels Combined
                  </option>
                  {levels.map((lvl) => (
                    <option key={lvl.id} value={lvl.id} className="bg-slate-900 text-white">
                      📍 {lvl.name} (Elev: {lvl.elevation >= 0 ? `+${lvl.elevation}` : lvl.elevation}m)
                    </option>
                  ))}
                </select>
              </div>

              {selectedLevelId !== "ALL" && (
                <button
                  onClick={() => setSelectedLevelId("ALL")}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0"
                  title="Reset scope to all levels"
                >
                  <RotateCcw size={14} />
                  <span>Show All</span>
                </button>
              )}
            </div>
          </div>

          {/* ─── DUAL COLUMN PARAMETER ENGINE: MIX DESIGN & ADMIXTURES ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Card: Concrete Mix Design & Ratio */}
            <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl p-5 lg:p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                    <Calculator size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Concrete Mix Design Specifications
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Volumetric mix ratio &amp; shrinkage buffer
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                  Ratio: {mixRatio}
                </span>
              </div>

              {/* Concrete Mix Ratio Row */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Mix Ratio (Cement : Sand : Aggregate)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-mono font-bold text-slate-400">
                      Ratio:
                    </span>
                    <input
                      type="text"
                      value={mixRatio}
                      onChange={(e) => setMixRatio(e.target.value)}
                      placeholder="1:1.5:2.5"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-14 pr-3 text-xs font-mono font-bold text-brand-600 dark:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                    />
                  </div>
                  <select
                    onChange={(e) => e.target.value && setMixRatio(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select Structural Preset
                    </option>
                    {MIX_PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Advanced Controls: Wastage Buffer & Shrinkage Index */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="includeWastageToggle2"
                      checked={includeWastage}
                      onChange={(e) => setIncludeWastage(e.target.checked)}
                      className="w-4 h-4 text-brand-600 rounded border-slate-300 dark:border-slate-700 focus:ring-brand-500 cursor-pointer"
                    />
                    <label
                      htmlFor="includeWastageToggle2"
                      className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      Wastage Buffer
                    </label>
                  </div>
                  {includeWastage && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={wastagePercent}
                        onChange={(e) => setWastagePercent(Number(e.target.value))}
                        className="w-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-xs font-mono font-bold text-center text-brand-600 dark:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">%</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Dry Shrinkage Factor
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="1.0"
                      max="2.0"
                      value={dryVolumeFactor}
                      onChange={(e) => setDryVolumeFactor(Number(e.target.value))}
                      className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-xs font-mono font-bold text-center text-amber-600 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Chemical Admixture Specification */}
            <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl p-5 lg:p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                    <FlaskConical size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Chemical Admixture Specification
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Performance additive &amp; dosage volume (Trips N/A)
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {materialQuantities.admixtureLiters} Liters Total
                </span>
              </div>

              {/* Admixture Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider">
                  Admixture Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={admixtureType}
                    onChange={(e) => setAdmixtureType(e.target.value)}
                    placeholder="Type or select preset"
                    className="w-full bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-xl p-2.5 text-xs font-semibold text-purple-900 dark:text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                  <select
                    onChange={(e) => e.target.value && setAdmixtureType(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select Admixture Preset
                    </option>
                    {ADMIXTURE_PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dosage Rate Input Row */}
              <div className="flex items-center justify-between bg-purple-50/40 dark:bg-purple-950/20 p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/40">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Admixture Dosage Rate
                  </span>
                  <span className="text-[10px] text-purple-700 dark:text-purple-300">
                    Milliliters per 50kg cement bag
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    step="25"
                    value={admixtureDosageMl}
                    onChange={(e) => setAdmixtureDosageMl(Number(e.target.value))}
                    className="w-24 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 rounded-xl p-2 text-xs font-mono font-bold text-center text-purple-700 dark:text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-300">
                    mL/bag
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── DEDICATED CARD: FLEXIBLE AGGREGATE HAULAGE & MATERIAL DENSITY PARAMETERS ─── */}
          <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl p-5 lg:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Truck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Aggregate Haulage &amp; Material Density Parameters (Sand &amp; Stone Trips)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                      100% Flexible
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Trips are calculated exclusively for aggregate haulage (Sand &amp; Stone tippers). Cement is bagged/bulk, water is piped/reservoir.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetLogisticsParams}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Reset haulage parameters to standard engineering defaults"
                >
                  <RotateCcw size={13} />
                  <span>Reset Defaults</span>
                </button>
              </div>
            </div>

            {/* Tipper Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
                Tipper Presets:
              </span>
              {FLEET_PRESETS.map((fp) => (
                <button
                  key={fp.name}
                  type="button"
                  onClick={() => applyFleetPreset(fp)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 hover:border-amber-300 transition cursor-pointer"
                >
                  {fp.name}
                </button>
              ))}
            </div>

            {/* Flexible Input Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2">
              {/* Parameter 1: Sand Density */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
                  Sand Density
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    max="2.5"
                    value={sandDensity}
                    onChange={(e) => setSandDensity(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 text-center focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                    t/m³
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block truncate">
                  Zone II sharp river sand
                </span>
              </div>

              {/* Parameter 2: Stone Density */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
                  Stone Density
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.05"
                    min="1.0"
                    max="2.5"
                    value={stoneDensity}
                    onChange={(e) => setStoneDensity(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 text-center focus:ring-2 focus:ring-slate-500"
                  />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                    t/m³
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block truncate">
                  Crushed 20mm granite
                </span>
              </div>

              {/* Parameter 3: Sand Tipper Capacity */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
                  Sand Tipper Load
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="60"
                    value={sandTruckCapacity}
                    onChange={(e) => setSandTruckCapacity(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800/80 rounded-xl p-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400 text-center focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                    T/trip
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block truncate">
                  Tipper truck payload
                </span>
              </div>

              {/* Parameter 4: Stone Tipper Capacity */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
                  Stone Tipper Load
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="60"
                    value={stoneTruckCapacity}
                    onChange={(e) => setStoneTruckCapacity(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 text-center focus:ring-2 focus:ring-slate-500"
                  />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 shrink-0">
                    T/trip
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block truncate">
                  Tipper truck payload
                </span>
              </div>

              {/* Parameter 5: Concrete Density */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">
                  Wet Concrete Density
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.05"
                    min="1.8"
                    max="2.8"
                    value={concreteDensity}
                    onChange={(e) => setConcreteDensity(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-brand-300 dark:border-brand-800/80 rounded-xl p-2 text-xs font-mono font-bold text-brand-600 dark:text-brand-400 text-center focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 shrink-0">
                    t/m³
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 block truncate">
                  Wet mix density index
                </span>
              </div>
            </div>

            {/* Aggregate Dispatch Summary Strip */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-indigo-500/10 border border-amber-500/20 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold">
                  <Truck size={18} />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                    Calculated Aggregate Tipper Deliveries for Current Scope
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">
                    Fine Sand: <strong className="text-amber-600 dark:text-amber-400">{materialQuantities.sandTrips} trips</strong> ({materialQuantities.sandTonnes}T @ {sandTruckCapacity}T/tipper) &bull; Coarse Stone: <strong className="text-slate-800 dark:text-slate-200">{materialQuantities.stoneTrips} trips</strong> ({materialQuantities.stoneTonnes}T @ {stoneTruckCapacity}T/tipper)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                    Total Material Weight
                  </span>
                  <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                    {materialQuantities.totalMaterialTonnes} Tonnes
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                    Aggregate Tipper Deliveries
                  </span>
                  <span className="text-base font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    {materialQuantities.totalTrips} Trips
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── STRUCTURAL ELEMENT CATEGORY FILTERS BANNER ─── */}
          <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-brand-600 dark:text-brand-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Structural Sections Included in Take-Off &amp; Report:
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.keys(selectedCategories).map((catKey) => {
                const isSelected = selectedCategories[catKey];
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => toggleCategorySelection(catKey)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-700/60 shadow-sm"
                        : "bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 line-through opacity-60"
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare size={13} className="text-brand-600 dark:text-brand-400" />
                    ) : (
                      <Square size={13} className="text-slate-400 dark:text-slate-500" />
                    )}
                    <span>{catKey}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── Main Grid: Volumetric Breakdown Left + BoQ Card Right ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Volumetric Breakdown */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden flex flex-col justify-between">
              <div>
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                      <Layers size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Volumetric, Tonnes &amp; Aggregate Trips Breakdown
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {selectedLevelId === "ALL"
                          ? "Aggregated across all levels"
                          : `Filtered scope: ${selectedLevelObj?.name}`}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                    {includeWastage ? `+${wastagePercent}% waste` : "Net (0% waste)"}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {calculatedData.categories.map((cat) => {
                    const isExpanded = expandedCategory === cat.type;
                    const opacityClass = cat.isIncluded
                      ? ""
                      : "opacity-40 bg-slate-50 dark:bg-slate-950/30";

                    return (
                      <div key={cat.type} className={opacityClass}>
                        <div
                          className="p-4.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition"
                          onClick={() =>
                            setExpandedCategory(isExpanded ? null : cat.type)
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                                isExpanded
                                  ? "bg-brand-600 text-white rotate-90"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              <ChevronRight size={15} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                  {cat.type} Elements
                                </h4>
                                {!cat.isIncluded && (
                                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded font-semibold uppercase">
                                    Deselected
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {cat.count} elements &bull; {cat.materials.totalMaterialTonnes} Tonnes &bull; {cat.materials.totalTrips} Tipper Trips
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex items-center gap-6">
                            <div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                                Weight &amp; Trips
                              </p>
                              <p className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">
                                {cat.materials.totalMaterialTonnes} T ({cat.materials.totalTrips} trp)
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                                Wet Volume
                              </p>
                              <p className="text-sm font-black text-brand-600 dark:text-brand-400 font-mono">
                                {cat.rawVolume.toFixed(3)} m³
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Detail Accordion */}
                        {isExpanded && cat.count > 0 && (
                          <div className="px-5 pb-5 pt-3 bg-slate-50/80 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
                            {/* 5-Card Mini Metric Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                              {/* Cement Mini Card (Tonnes only - NO TRIPS) */}
                              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase block mb-1">
                                  Cement Cargo
                                </span>
                                <span className="text-base font-black text-brand-600 dark:text-brand-400 font-mono block">
                                  {cat.materials.cementTonnes} T
                                </span>
                                <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5 font-mono">
                                  {cat.materials.bagsCement} bags (50kg)
                                </span>
                              </div>

                              {/* Sand Mini Card (Tonnes & Trips) */}
                              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase block mb-1">
                                  Sand Cargo
                                </span>
                                <span className="text-base font-black text-amber-600 dark:text-amber-400 font-mono block">
                                  {cat.materials.sandTonnes} T
                                </span>
                                <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5 font-mono">
                                  {cat.materials.sandM3} m³ &bull; <strong>{cat.materials.sandTrips} trips</strong>
                                </span>
                              </div>

                              {/* Stone Mini Card (Tonnes & Trips) */}
                              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                                  Stone Cargo
                                </span>
                                <span className="text-base font-black text-slate-800 dark:text-slate-200 font-mono block">
                                  {cat.materials.stoneTonnes} T
                                </span>
                                <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5 font-mono">
                                  {cat.materials.stoneM3} m³ &bull; <strong>{cat.materials.stoneTrips} trips</strong>
                                </span>
                              </div>

                              {/* Water Mini Card (Tonnes only - NO TRIPS) */}
                              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase block mb-1">
                                  Water Cargo
                                </span>
                                <span className="text-base font-black text-blue-600 dark:text-blue-400 font-mono block">
                                  {cat.materials.waterTonnes} T
                                </span>
                                <span className="text-[9px] text-slate-500 dark:text-slate-400 block mt-0.5 font-mono">
                                  {cat.materials.waterLiters.toLocaleString()} Liters
                                </span>
                              </div>

                              {/* Formwork Mini Card */}
                              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-1">
                                  Formwork
                                </span>
                                <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                                  {cat.totalFormworkWithWaste.toFixed(1)} m²
                                </span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5 font-mono">
                                  Contact surface
                                </span>
                              </div>
                            </div>

                            {/* Member Items List */}
                            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                              {cat.items.map((el) => (
                                <div
                                  key={el.id}
                                  className="flex justify-between items-center text-xs p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 dark:text-white">
                                      {el.elementName}
                                    </span>
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-mono">
                                      {el.grid || el.gridAxis || "N/A"}
                                    </span>
                                  </div>
                                  <div className="text-right font-mono text-slate-600 dark:text-slate-300 flex items-center gap-4 text-xs">
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                      {(
                                        el.calculatedFormworkArea ||
                                        (el.calculatedVolume || 0) * 4.5
                                      ).toFixed(2)}{" "}
                                      m²
                                    </span>
                                    <span className="text-brand-600 dark:text-brand-400 font-bold">
                                      {(
                                        el.calculatedVolume ||
                                        el.volume ||
                                        0
                                      ).toFixed(3)}{" "}
                                      m³
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Row Footer */}
              <div className="p-5 bg-gradient-to-r from-brand-50/80 via-white to-brand-50/80 dark:from-brand-950/40 dark:via-slate-900 dark:to-brand-950/40 border-t border-brand-200 dark:border-brand-800/40 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-black text-slate-900 dark:text-white block">
                    Total Active Scope Quantities
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Includes active category selections with wastage buffer
                  </span>
                </div>
                <div className="text-right flex items-center gap-6">
                  <div>
                    <span className="text-[10px] block text-slate-500 dark:text-slate-400 uppercase font-bold">
                      Material Weight
                    </span>
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
                      {materialQuantities.totalMaterialTonnes} Tonnes
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] block text-slate-500 dark:text-slate-400 uppercase font-bold">
                      Aggregate Deliveries
                    </span>
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      {materialQuantities.totalTrips} Tipper Trips
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] block text-slate-500 dark:text-slate-400 uppercase font-bold">
                      Concrete Volume
                    </span>
                    <span className="text-lg font-black text-brand-600 dark:text-brand-400 font-mono">
                      {calculatedData.totalWithWasteVolume.toFixed(3)} m³
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Material Bill of Quantities (BoQ) Card with Tonnes & Aggregate Trips */}
            <div className="bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-2xl space-y-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                      <Calculator size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Material &amp; Aggregate BoQ
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Itemized batching manifest &amp; tipper trips
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-mono text-[10px] font-bold border border-brand-200 dark:border-brand-800">
                    {mixRatio}
                  </span>
                </div>

                <div className="py-4 space-y-3.5">
                  {/* Volumetric Metrics Card */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Surface &amp; Volume Metrics
                    </span>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Droplets size={14} className="text-sky-600 dark:text-sky-400" />
                        Wet Concrete Vol.
                      </span>
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-sm">
                        {calculatedData.totalWithWasteVolume.toFixed(3)} m³
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Package size={14} className="text-amber-600 dark:text-amber-400" />
                        Dry Batch Vol.
                      </span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                        {materialQuantities.dryVolume} m³
                      </span>
                    </div>
                  </div>

                  {/* Portland Cement Item (NO TRIPS) */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-xs font-mono">
                        CEM
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Portland Cement
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {materialQuantities.cementTonnes} Metric Tonnes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-brand-600 dark:text-brand-400 font-mono block">
                        {materialQuantities.bagsCement}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium font-mono">
                        Bags ({materialQuantities.cementWeightKg.toLocaleString()} kg)
                      </span>
                    </div>
                  </div>

                  {/* Sand Item (WITH TRIPS) */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Package size={17} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Fine Aggregate (Sand)
                        </h4>
                        <p className="text-[10px] text-amber-700 dark:text-amber-300 font-mono font-medium">
                          {materialQuantities.sandTonnes} Tonnes &bull; <strong>{materialQuantities.sandTrips} Tipper Trips</strong> (@ {sandTruckCapacity}T)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono block">
                        {materialQuantities.sandM3}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        Cubic Meters (m³)
                      </span>
                    </div>
                  </div>

                  {/* Stone Item (WITH TRIPS) */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
                        <Package size={17} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Coarse Aggregate (Stone)
                        </h4>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-medium">
                          {materialQuantities.stoneTonnes} Tonnes &bull; <strong>{materialQuantities.stoneTrips} Tipper Trips</strong> (@ {stoneTruckCapacity}T)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-slate-800 dark:text-slate-200 font-mono block">
                        {materialQuantities.stoneM3}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        Cubic Meters (m³)
                      </span>
                    </div>
                  </div>

                  {/* Water Item (NO TRIPS) */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-black font-mono">
                        H₂O
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Water Batch Volume
                        </h4>
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-medium">
                          {materialQuantities.waterTonnes} Metric Tonnes (Piped / Reservoir)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono block">
                        ~{materialQuantities.waterLiters.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        Liters Total
                      </span>
                    </div>
                  </div>

                  {/* Chemical Admixture Item (NO TRIPS) */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 hover:border-purple-300 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <FlaskConical size={17} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Chemical Admixture
                        </h4>
                        <p
                          className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold truncate max-w-[160px]"
                          title={admixtureType}
                        >
                          {admixtureType || "Superplasticizer"} (@ {admixtureDosageMl} mL/bag)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono block">
                        {materialQuantities.admixtureLiters}
                      </span>
                      <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                        Liters ({materialQuantities.admixtureMl.toLocaleString()} mL)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {/* Report Content Checkbox Options */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block tracking-wider">
                    Report Content Preferences:
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={showFormworkInReport}
                        onChange={(e) => setShowFormworkInReport(e.target.checked)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                      />
                      <span className="text-[11px]">Include Formwork in Report</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={showRebarsInReport}
                        onChange={(e) => setShowRebarsInReport(e.target.checked)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                      />
                      <span className="text-[11px]">Include Rebars in Report</span>
                    </label>
                  </div>
                  <p className="text-[9.5px] text-slate-400 dark:text-slate-500 leading-tight">
                    Reports show selected items only. Formwork &amp; rebars omitted unless checked.
                  </p>
                </div>

                {/* Print Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePrintReport("DETAILED")}
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    <Printer size={14} />
                    <span>Detailed PDF</span>
                  </button>

                  <button
                    onClick={() => handlePrintReport("SUMMARY")}
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    <BarChart3 size={14} />
                    <span>Summary PDF</span>
                  </button>
                </div>

                {/* Info Note */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  <Info
                    size={16}
                    className="text-brand-600 dark:text-brand-400 shrink-0 mt-0.5"
                  />
                  <p>
                    {includeWastage ? (
                      <>
                        Includes an automated{" "}
                        <strong className="text-slate-800 dark:text-slate-200">{wastagePercent}% wastage buffer</strong>.{" "}
                      </>
                    ) : (
                      <>
                        Wastage buffer is currently <strong className="text-slate-800 dark:text-slate-200">disabled</strong>{" "}
                        (net values).{" "}
                      </>
                    )}
                    Dry conversion uses{" "}
                    <strong className="text-slate-800 dark:text-slate-200">{dryVolumeFactor} shrinkage index</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: MEMBER SIZE SCHEDULE ─── */}
      {activeTab === "SCHEDULE" && (
        <ElementSizeSchedule
          elements={elements}
          levels={levels}
          projectName={activeProject?.name}
          companyName={company?.name}
          createdBy={currentUser?.fullName}
        />
      )}

      {/* ─── TAB 3: FLOOR LEVEL BREAKDOWN ─── */}
      {activeTab === "LEVELS" && (
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden animate-in fade-in duration-200">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Quantity Take-Off Breakdown by Floor Level
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedLevelId !== "ALL" && selectedLevelObj
                    ? `Single Floor Scope: ${selectedLevelObj.name}`
                    : "All project levels combined"}
                </p>
              </div>
            </div>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Export Level CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-5">Level Name</th>
                  <th className="py-3.5 px-4">Elevation (m)</th>
                  <th className="py-3.5 px-4 text-center">Element Count</th>
                  <th className="py-3.5 px-4 text-right">Concrete Volume (m³)</th>
                  <th className="py-3.5 px-4 text-right">Est. Rebar (Tons)</th>
                  <th className="py-3.5 px-4 text-right">Formwork (m²)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {levelSummary.map((item) => (
                  <tr
                    key={item.level.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Building2 size={14} className="text-slate-400" />
                      {item.level.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {item.level.elevation >= 0
                        ? `+${item.level.elevation}`
                        : item.level.elevation}{" "}
                      m
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold">
                        {item.count}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-brand-600 dark:text-brand-400 font-bold text-sm">
                      {item.volume.toFixed(2)} m³
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-red-600 dark:text-red-400 font-bold text-sm">
                      {item.rebarTons} T
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      {item.formworkM2} m²
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialTakeoff;
