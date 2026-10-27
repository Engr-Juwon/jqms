import React, { useState, useMemo, useEffect } from "react";
import {
  Layers,
  FlaskConical,
  Droplets,
  Leaf,
  CheckCircle2,
  AlertTriangle,
  Info,
  Copy,
  Printer,
  Sparkles,
  Sliders,
  Scale,
  Building,
  Check,
  RefreshCw,
  Waves,
  ShieldCheck,
  Zap,
  HelpCircle,
  Gauge,
  Box,
  Activity,
  Award,
  ArrowRightLeft,
  RotateCcw,
  Wand2,
} from "lucide-react";
import toast from "react-hot-toast";

// Concrete Grade Options
export type ConcreteGrade =
  | "M15"
  | "M20"
  | "M25"
  | "M30"
  | "M35"
  | "M40"
  | "M45"
  | "M50"
  | "M55"
  | "M60";

// Preset Mix Types for Forward Mode
export type PresetKey =
  | "residential_footing"
  | "slabs_beams"
  | "highrise_pump"
  | "waterproof_basement"
  | "fast_demould"
  | "marine_durable"
  | "custom";

interface PresetConfig {
  id: PresetKey;
  title: string;
  subtitle: string;
  icon: string;
  laymanTag: string;
  grade: ConcreteGrade;
  slump: number;
  maxAggSize: 10 | 20 | 40;
  waterCementRatio: number;
  // SCMs
  useFlyAsh: boolean;
  flyAshPercent: number;
  useSilicaFume: boolean;
  silicaFumePercent: number;
  useGGBS: boolean;
  ggbsPercent: number;
  // Chemical Admixtures
  useSuperplasticizer: boolean;
  superplasticizerDosage: number; // % of binder
  waterReductionPercent: number; // % cut in water
  useRetarder: boolean;
  retarderDosage: number;
  useAccelerator: boolean;
  acceleratorDosage: number;
  useWaterproofer: boolean;
  waterprooferDosage: number;
  useAirEntrainer: boolean;
  airPercent: number;
}

const PRESET_LIBRARY: Record<PresetKey, PresetConfig> = {
  residential_footing: {
    id: "residential_footing",
    title: "Footings & Ground Slabs",
    subtitle: "M25 • Standard residential foundation, strip footings, unpumped pour",
    icon: "🏠",
    laymanTag: "Best for houses, ground slabs & driveways",
    grade: "M25",
    slump: 80,
    maxAggSize: 20,
    waterCementRatio: 0.48,
    useFlyAsh: false,
    flyAshPercent: 0,
    useSilicaFume: false,
    silicaFumePercent: 0,
    useGGBS: false,
    ggbsPercent: 0,
    useSuperplasticizer: false,
    superplasticizerDosage: 0,
    waterReductionPercent: 0,
    useRetarder: false,
    retarderDosage: 0,
    useAccelerator: false,
    acceleratorDosage: 0,
    useWaterproofer: false,
    waterprooferDosage: 0,
    useAirEntrainer: false,
    airPercent: 1.0,
  },
  slabs_beams: {
    id: "slabs_beams",
    title: "Suspended Slabs & Beams",
    subtitle: "M30 • General structural frame, moderate workability, crack controlled",
    icon: "🏢",
    laymanTag: "Best for upper floors, roof slabs & beams",
    grade: "M30",
    slump: 110,
    maxAggSize: 20,
    waterCementRatio: 0.42,
    useFlyAsh: true,
    flyAshPercent: 15,
    useSilicaFume: false,
    silicaFumePercent: 0,
    useGGBS: false,
    ggbsPercent: 0,
    useSuperplasticizer: true,
    superplasticizerDosage: 0.8,
    waterReductionPercent: 18,
    useRetarder: false,
    retarderDosage: 0,
    useAccelerator: false,
    acceleratorDosage: 0,
    useWaterproofer: false,
    waterprooferDosage: 0,
    useAirEntrainer: false,
    airPercent: 1.2,
  },
  highrise_pump: {
    id: "highrise_pump",
    title: "High-Rise Columns (Pumped)",
    subtitle: "M35 • High workability, long pump lines, self-compacting flow",
    icon: "🏬",
    laymanTag: "Best for tall pillars & pumping through long hoses",
    grade: "M35",
    slump: 140,
    maxAggSize: 20,
    waterCementRatio: 0.38,
    useFlyAsh: true,
    flyAshPercent: 20,
    useSilicaFume: false,
    silicaFumePercent: 0,
    useGGBS: false,
    ggbsPercent: 0,
    useSuperplasticizer: true,
    superplasticizerDosage: 1.1,
    waterReductionPercent: 22,
    useRetarder: true,
    retarderDosage: 0.3,
    useAccelerator: false,
    acceleratorDosage: 0,
    useWaterproofer: false,
    waterprooferDosage: 0,
    useAirEntrainer: false,
    airPercent: 1.0,
  },
  waterproof_basement: {
    id: "waterproof_basement",
    title: "Water Tank & Basement Wall",
    subtitle: "M35 • Low permeability, crystalline pore blocking, leak-proof",
    icon: "🌊",
    laymanTag: "Best for water storage tanks, basements & pools",
    grade: "M35",
    slump: 120,
    maxAggSize: 20,
    waterCementRatio: 0.38,
    useFlyAsh: false,
    flyAshPercent: 0,
    useSilicaFume: false,
    silicaFumePercent: 0,
    useGGBS: true,
    ggbsPercent: 30,
    useSuperplasticizer: true,
    superplasticizerDosage: 1.0,
    waterReductionPercent: 20,
    useRetarder: false,
    retarderDosage: 0,
    useAccelerator: false,
    acceleratorDosage: 0,
    useWaterproofer: true,
    waterprooferDosage: 1.5,
    useAirEntrainer: false,
    airPercent: 1.0,
  },
  fast_demould: {
    id: "fast_demould",
    title: "Rapid Demould / Precast",
    subtitle: "M40 • Fast early 1-3 day strength, accelerated curing cycle",
    icon: "⚡",
    laymanTag: "Dries fast so you can remove wooden forms quickly",
    grade: "M40",
    slump: 100,
    maxAggSize: 20,
    waterCementRatio: 0.36,
    useFlyAsh: false,
    flyAshPercent: 0,
    useSilicaFume: false,
    silicaFumePercent: 0,
    useGGBS: false,
    ggbsPercent: 0,
    useSuperplasticizer: true,
    superplasticizerDosage: 1.2,
    waterReductionPercent: 24,
    useRetarder: false,
    retarderDosage: 0,
    useAccelerator: true,
    acceleratorDosage: 1.5,
    useWaterproofer: false,
    waterprooferDosage: 0,
    useAirEntrainer: false,
    airPercent: 1.0,
  },
  marine_durable: {
    id: "marine_durable",
    title: "Marine & Bridge Piles",
    subtitle: "M50 • Ultra-dense micro-silica, extreme chloride & sulfate resistance",
    icon: "🌉",
    laymanTag: "Super-duty concrete for bridges & coastal salty waters",
    grade: "M50",
    slump: 150,
    maxAggSize: 20,
    waterCementRatio: 0.32,
    useFlyAsh: false,
    flyAshPercent: 0,
    useSilicaFume: true,
    silicaFumePercent: 8,
    useGGBS: true,
    ggbsPercent: 30,
    useSuperplasticizer: true,
    superplasticizerDosage: 1.5,
    waterReductionPercent: 26,
    useRetarder: true,
    retarderDosage: 0.4,
    useAccelerator: false,
    acceleratorDosage: 0,
    useWaterproofer: true,
    waterprooferDosage: 1.0,
    useAirEntrainer: false,
    airPercent: 1.2,
  },
  custom: {
    id: "custom",
    title: "Custom Engineered Mix",
    subtitle: "Fully tailored parameters, custom additives and batch targets",
    icon: "🎛️",
    laymanTag: "Custom adjusted mix",
    grade: "M30",
    slump: 100,
    maxAggSize: 20,
    waterCementRatio: 0.42,
    useFlyAsh: false,
    flyAshPercent: 0,
    useSilicaFume: false,
    silicaFumePercent: 0,
    useGGBS: false,
    ggbsPercent: 0,
    useSuperplasticizer: false,
    superplasticizerDosage: 0,
    waterReductionPercent: 0,
    useRetarder: false,
    retarderDosage: 0,
    useAccelerator: false,
    acceleratorDosage: 0,
    useWaterproofer: false,
    waterprooferDosage: 0,
    useAirEntrainer: false,
    airPercent: 1.0,
  },
};

// Layman Grade Guide
const GRADE_LAYMAN_GUIDE: Record<
  ConcreteGrade,
  {
    name: string;
    psi: number;
    usage: string;
    color: string;
    meterLevel: number;
    description: string;
  }
> = {
  M15: {
    name: "Lean Concrete / Blinding",
    psi: 2175,
    usage: "Mud slabs, trench bottom leveling, garden curbs",
    color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    meterLevel: 1,
    description: "Lightweight non-structural base layer.",
  },
  M20: {
    name: "Light Reinforced Concrete",
    psi: 2900,
    usage: "Driveways, single-storey house footings, walkways",
    color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    meterLevel: 2,
    description: "Good for basic residential ground floors and patios.",
  },
  M25: {
    name: "Standard Residential Structural",
    psi: 3625,
    usage: "Strip foundations, reinforced floor slabs, house columns",
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    meterLevel: 3,
    description: "The universal choice for modern residential buildings.",
  },
  M30: {
    name: "Heavy Structural Concrete",
    psi: 4350,
    usage: "Suspended 1st & 2nd floor slabs, long beams, lintels",
    color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800",
    meterLevel: 3,
    description: "Ideal for upper floor suspended slabs and structural frames.",
  },
  M35: {
    name: "High-Strength Structural",
    psi: 5075,
    usage: "Multi-storey columns, shear walls, water tanks & basements",
    color: "text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-700",
    meterLevel: 4,
    description: "High durability and heavy load bearing capacity.",
  },
  M40: {
    name: "Commercial High-Strength",
    psi: 5800,
    usage: "High-rise towers, precast beams, heavily loaded piers",
    color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800",
    meterLevel: 4,
    description: "Industrial strength for tall buildings and precast yards.",
  },
  M45: {
    name: "Special High-Strength",
    psi: 6525,
    usage: "Heavy infrastructure foundations, transfer slabs",
    color: "text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700",
    meterLevel: 5,
    description: "Extra dense matrix with very low water permeability.",
  },
  M50: {
    name: "Heavy Infrastructure Grade",
    psi: 7250,
    usage: "Highway bridges, deep foundation piles, coastal docks",
    color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
    meterLevel: 5,
    description: "Designed for bridges, marine piers, and chemical defense.",
  },
  M55: {
    name: "Ultra-High Durability",
    psi: 7975,
    usage: "Pre-stressed bridge girders, offshore marine oil platforms",
    color: "text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700",
    meterLevel: 5,
    description: "Requires advanced superplasticizer and micro-silica.",
  },
  M60: {
    name: "Ultra High-Performance (UHPC)",
    psi: 8700,
    usage: "Skyscraper mega-columns, extreme seismic zones",
    color: "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700",
    meterLevel: 5,
    description: "Extreme compressive capacity and maximum durability.",
  },
};

// Standard Nominal Ratios for Reverse Mode
interface NominalRatioPreset {
  id: string;
  name: string;
  cement: number;
  sand: number;
  stone: number;
  approxGrade: ConcreteGrade;
  defaultWc: number;
  useCase: string;
}

const NOMINAL_RATIO_PRESETS: NominalRatioPreset[] = [
  {
    id: "1_1_2",
    name: "1 : 1 : 2",
    cement: 1,
    sand: 1,
    stone: 2,
    approxGrade: "M25",
    defaultWc: 0.40,
    useCase: "Heavy columns, water retaining tanks, high strength RCC",
  },
  {
    id: "1_1.5_3",
    name: "1 : 1.5 : 3",
    cement: 1,
    sand: 1.5,
    stone: 3,
    approxGrade: "M20",
    defaultWc: 0.45,
    useCase: "Universal structural RCC (slabs, beams, staircases, lintels)",
  },
  {
    id: "1_2_4",
    name: "1 : 2 : 4",
    cement: 1,
    sand: 2,
    stone: 4,
    approxGrade: "M15",
    defaultWc: 0.50,
    useCase: "General unreinforced works, foundations, ground floors",
  },
  {
    id: "1_3_6",
    name: "1 : 3 : 6",
    cement: 1,
    sand: 3,
    stone: 6,
    approxGrade: "M15",
    defaultWc: 0.55,
    useCase: "Mass concrete foundations, trench leveling, pipe bedding",
  },
  {
    id: "1_4_8",
    name: "1 : 4 : 8",
    cement: 1,
    sand: 4,
    stone: 8,
    approxGrade: "M15",
    defaultWc: 0.60,
    useCase: "Lean concrete sub-base, mud slabs under footings",
  },
];

export const MixCalc: React.FC = () => {
  // Calculation Direction:
  // "forward" = Target Strength -> Auto Mix Proportioning
  // "reverse" = Input Mix Ratio -> Work Back to Calculate Batch Materials
  const [calcDirection, setCalcDirection] = useState<"forward" | "reverse">("forward");

  // Mode: guided (dummy-proof) vs advanced
  const [calcMode, setCalcMode] = useState<"guided" | "advanced">("guided");
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("slabs_beams");

  // Site Measure Toggle: Display in kg vs 18L Headpans/Buckets
  const [displaySiteBuckets, setDisplaySiteBuckets] = useState<boolean>(true);

  // Core Parameters (Forward)
  const [grade, setGrade] = useState<ConcreteGrade>("M30");
  const [fck, setFck] = useState<number>(30); // MPa
  const [sd, setSd] = useState<number>(5.0); // Standard deviation
  const [maxAggSize, setMaxAggSize] = useState<10 | 20 | 40>(20);
  const [slump, setSlump] = useState<number>(110); // mm
  const [autoDetectSlump, setAutoDetectSlump] = useState<boolean>(true); // Auto-predict slump from w/c & admixtures
  const [waterCementRatio, setWaterCementRatio] = useState<number>(0.42);
  const [airContent, setAirContent] = useState<number>(1.2); // %

  // ==========================================
  // REVERSE MIX DESIGN STATE (WORK BACK)
  // ==========================================
  const [reverseRatioSand, setReverseRatioSand] = useState<number>(1.5);
  const [reverseRatioStone, setReverseRatioStone] = useState<number>(3.0);
  const [reverseTargetGrade, setReverseTargetGrade] = useState<ConcreteGrade>("M25");
  const [reverseWc, setReverseWc] = useState<number>(0.45);

  // Specific Gravities (Advanced)
  const [sgCement, setSgCement] = useState<number>(3.15);
  const [sgFlyAsh, setSgFlyAsh] = useState<number>(2.20);
  const [sgSilicaFume, setSgSilicaFume] = useState<number>(2.20);
  const [sgGGBS, setSgGGBS] = useState<number>(2.90);
  const [sgCA, setSgCA] = useState<number>(2.70);
  const [sgFA, setSgFA] = useState<number>(2.65);
  const [zoneFA, setZoneFA] = useState<"Zone I" | "Zone II" | "Zone III">("Zone II");

  // SCMs (Mineral Additives)
  const [useFlyAsh, setUseFlyAsh] = useState<boolean>(true);
  const [flyAshPercent, setFlyAshPercent] = useState<number>(15); // % of total binder
  const [useSilicaFume, setUseSilicaFume] = useState<boolean>(false);
  const [silicaFumePercent, setSilicaFumePercent] = useState<number>(7); // % of total binder
  const [useGGBS, setUseGGBS] = useState<boolean>(false);
  const [ggbsPercent, setGgbsPercent] = useState<number>(30); // % of total binder

  // Chemical Additives
  const [useSuperplasticizer, setUseSuperplasticizer] = useState<boolean>(true);
  const [superplasticizerDosage, setSuperplasticizerDosage] = useState<number>(0.8); // % by binder wt
  const [waterReductionPercent, setWaterReductionPercent] = useState<number>(18); // % cut

  const [useRetarder, setUseRetarder] = useState<boolean>(false);
  const [retarderDosage, setRetarderDosage] = useState<number>(0.3); // % by binder wt

  const [useAccelerator, setUseAccelerator] = useState<boolean>(false);
  const [acceleratorDosage, setAcceleratorDosage] = useState<number>(1.5); // % by binder wt

  const [useWaterproofer, setUseWaterproofer] = useState<boolean>(false);
  const [waterprooferDosage, setWaterprooferDosage] = useState<number>(1.2); // % by binder wt

  const [useAirEntrainer, setUseAirEntrainer] = useState<boolean>(false);

  // Moisture Correction (Damp Aggregates on Site)
  const [enableMoistureCorr, setEnableMoistureCorr] = useState<boolean>(false);
  const [sandMoisture, setSandMoisture] = useState<number>(3.5); // %
  const [stoneMoisture, setStoneMoisture] = useState<number>(1.0); // %

  // Batching Mode
  const [batchScale, setBatchScale] = useState<"1m3" | "bag" | "custom">("1m3");
  const [customBatchVolume, setCustomBatchVolume] = useState<number>(6.0); // m³

  // Effective W/C Ratio depending on direction
  const effectiveWc = calcDirection === "forward" ? waterCementRatio : reverseWc;

  // ==========================================
  // SLUMP AUTO-DETECTION ENGINE (PHYSICAL PREDICTION)
  // ==========================================
  const predictedSlump = useMemo(() => {
    // Base slump at w/b = 0.42 for 20mm aggregate without plasticizer is ~50 mm
    let base = 50 + ((effectiveWc - 0.42) / 0.01) * 4.5;

    // Superplasticizer (PCE) effect: +75mm per 1.0% dosage
    if (useSuperplasticizer && superplasticizerDosage > 0) {
      base += superplasticizerDosage * 75;
    }

    // Retarder preserves slump flowability: +10mm
    if (useRetarder) {
      base += 10;
    }

    // Fly Ash spherical micro-ball bearings improve slump: +8mm per 10%
    if (useFlyAsh && flyAshPercent > 0) {
      base += (flyAshPercent / 10) * 8;
    }

    // Silica Fume has massive surface area, reducing slump unless SP is high: -15mm per 5%
    if (useSilicaFume && silicaFumePercent > 0) {
      base -= (silicaFumePercent / 5) * 15;
    }

    // GGBS slightly improves fluidity: +5mm per 20%
    if (useGGBS && ggbsPercent > 0) {
      base += (ggbsPercent / 20) * 5;
    }

    // Aggregate size effect
    if (maxAggSize === 10) base -= 15;
    else if (maxAggSize === 40) base += 15;

    // Clamp between 25 mm and 220 mm and round to 5mm
    return Math.min(220, Math.max(25, Math.round(base / 5) * 5));
  }, [
    effectiveWc,
    useSuperplasticizer,
    superplasticizerDosage,
    useRetarder,
    useFlyAsh,
    flyAshPercent,
    useSilicaFume,
    silicaFumePercent,
    useGGBS,
    ggbsPercent,
    maxAggSize,
  ]);

  // When auto-detect is enabled, keep slump in sync with predicted value
  useEffect(() => {
    if (autoDetectSlump) {
      setSlump(predictedSlump);
    }
  }, [autoDetectSlump, predictedSlump]);

  // Slump Deviation Warning/Statement text
  const slumpDeviation = useMemo(() => {
    const diff = slump - predictedSlump;
    const isOverridden = Math.abs(diff) >= 15;

    // Build summary of active additives
    const activeAdditives: string[] = [];
    if (useSuperplasticizer) activeAdditives.push(`${superplasticizerDosage}% Superplasticizer`);
    if (useRetarder) activeAdditives.push("Retarder");
    if (useAccelerator) activeAdditives.push("Accelerator");
    if (useWaterproofer) activeAdditives.push("Waterproofing");
    if (useFlyAsh) activeAdditives.push(`${flyAshPercent}% Fly Ash`);
    if (useSilicaFume) activeAdditives.push(`${silicaFumePercent}% Silica Fume`);
    if (useGGBS) activeAdditives.push(`${ggbsPercent}% GGBS`);

    const additiveText =
      activeAdditives.length > 0 ? activeAdditives.join(", ") : "no chemical admixtures";

    let advice = "";
    if (diff > 0) {
      advice = `Your mix is dialed higher than natural (${slump} mm vs ~${predictedSlump} mm). To reach ${slump} mm without segregation on site, consider increasing Superplasticizer dosage.`;
    } else {
      advice = `Your mix will naturally pour more fluid than ${slump} mm on site (~${predictedSlump} mm) due to the fluidizing effect of your water ratio & admixtures. Lower your water or reduce Superplasticizer if a stiffer ${slump} mm mix is required.`;
    }

    return {
      isOverridden,
      diff,
      additiveText,
      statement: `Based on your current settings (Water ratio ${effectiveWc.toFixed(2)} and ${additiveText}), this mix will naturally yield a ~${predictedSlump} mm slump.`,
      advice,
    };
  }, [
    slump,
    predictedSlump,
    effectiveWc,
    useSuperplasticizer,
    superplasticizerDosage,
    useRetarder,
    useAccelerator,
    useWaterproofer,
    useFlyAsh,
    flyAshPercent,
    useSilicaFume,
    silicaFumePercent,
    useGGBS,
    ggbsPercent,
  ]);

  // Quick Preset Loader (Forward)
  const loadPreset = (key: PresetKey) => {
    setSelectedPreset(key);
    const p = PRESET_LIBRARY[key];
    setGrade(p.grade);
    const gradeNum = parseInt(p.grade.substring(1));
    setFck(gradeNum);
    setSd(gradeNum <= 25 ? 4.0 : gradeNum <= 50 ? 5.0 : 6.0);
    setMaxAggSize(p.maxAggSize);
    setWaterCementRatio(p.waterCementRatio);

    // SCMs
    setUseFlyAsh(p.useFlyAsh);
    setFlyAshPercent(p.flyAshPercent);
    setUseSilicaFume(p.useSilicaFume);
    setSilicaFumePercent(p.silicaFumePercent);
    setUseGGBS(p.useGGBS);
    setGgbsPercent(p.ggbsPercent);

    // Chemical Additives
    setUseSuperplasticizer(p.useSuperplasticizer);
    setSuperplasticizerDosage(p.superplasticizerDosage);
    setWaterReductionPercent(p.waterReductionPercent);
    setUseRetarder(p.useRetarder);
    setRetarderDosage(p.retarderDosage);
    setUseAccelerator(p.useAccelerator);
    setAcceleratorDosage(p.acceleratorDosage);
    setUseWaterproofer(p.useWaterproofer);
    setWaterprooferDosage(p.waterprooferDosage);
    setUseAirEntrainer(p.useAirEntrainer);
    setAirContent(p.airPercent);

    // Slump
    setSlump(p.slump);
    setAutoDetectSlump(true);

    toast.success(`Loaded "${p.title}" mix recipe!`);
  };

  // Grade Change Handler (Forward)
  const handleGradeChange = (g: ConcreteGrade) => {
    setSelectedPreset("custom");
    setGrade(g);
    const num = parseInt(g.substring(1));
    setFck(num);

    if (num <= 20) setSd(3.5);
    else if (num <= 25) setSd(4.0);
    else if (num <= 50) setSd(5.0);
    else setSd(6.0);

    if (num <= 20) setWaterCementRatio(0.52);
    else if (num <= 25) setWaterCementRatio(0.48);
    else if (num <= 30) setWaterCementRatio(0.42);
    else if (num <= 35) setWaterCementRatio(0.38);
    else if (num <= 45) setWaterCementRatio(0.35);
    else setWaterCementRatio(0.30);
  };

  // Quick Nominal Ratio Selector (Reverse Mode)
  const loadNominalRatio = (preset: NominalRatioPreset) => {
    setReverseRatioSand(preset.sand);
    setReverseRatioStone(preset.stone);
    setReverseTargetGrade(preset.approxGrade);
    setReverseWc(preset.defaultWc);
    setAutoDetectSlump(true);
    toast.success(`Loaded "${preset.name}" nominal ratio!`);
  };

  // ==========================================
  // MATHEMATICAL ENGINE (FORWARD & REVERSE)
  // ==========================================
  const mixResults = useMemo(() => {
    // ------------------------------------------
    // CASE A: FORWARD PROPORTIONING (IS 10262)
    // ------------------------------------------
    if (calcDirection === "forward") {
      const targetMeanStrength = fck + 1.65 * sd;
      const baseWater = maxAggSize === 10 ? 208 : maxAggSize === 20 ? 186 : 165;
      const slumpDiff = Math.max(0, slump - 50);
      const rawWater = baseWater + (slumpDiff / 25) * 0.03 * baseWater;

      let effectiveWaterReduction = 0;
      if (useSuperplasticizer && waterReductionPercent > 0) {
        effectiveWaterReduction = Math.min(32, waterReductionPercent);
      } else if (useWaterproofer && !useSuperplasticizer) {
        effectiveWaterReduction = 5;
      }

      const waterReductionKg = rawWater * (effectiveWaterReduction / 100);
      const netWaterContent = Math.round(rawWater - waterReductionKg);
      const totalBinderContent = Math.round(netWaterContent / waterCementRatio);

      const faPct = useFlyAsh ? Math.min(35, flyAshPercent) : 0;
      const sfPct = useSilicaFume ? Math.min(15, silicaFumePercent) : 0;
      const ggbsPct = useGGBS ? Math.min(65, ggbsPercent) : 0;

      const massFlyAsh = Math.round(totalBinderContent * (faPct / 100));
      const massSilicaFume = Math.round(totalBinderContent * (sfPct / 100));
      const massGGBS = Math.round(totalBinderContent * (ggbsPct / 100));
      const massCement = Math.max(150, totalBinderContent - (massFlyAsh + massSilicaFume + massGGBS));

      const ADMIX_DENSITY = 1.10;
      const superplasticizerKg = useSuperplasticizer
        ? +(totalBinderContent * (superplasticizerDosage / 100)).toFixed(2)
        : 0;
      const superplasticizerL = +(superplasticizerKg / ADMIX_DENSITY).toFixed(2);
      const retarderKg = useRetarder
        ? +(totalBinderContent * (retarderDosage / 100)).toFixed(2)
        : 0;
      const retarderL = +(retarderKg / ADMIX_DENSITY).toFixed(2);
      const acceleratorKg = useAccelerator
        ? +(totalBinderContent * (acceleratorDosage / 100)).toFixed(2)
        : 0;
      const acceleratorL = +(acceleratorKg / ADMIX_DENSITY).toFixed(2);
      const waterprooferKg = useWaterproofer
        ? +(totalBinderContent * (waterprooferDosage / 100)).toFixed(2)
        : 0;
      const waterprooferL = +(waterprooferKg / ADMIX_DENSITY).toFixed(2);

      const totalAdmixKg = superplasticizerKg + retarderKg + acceleratorKg + waterprooferKg;
      const totalAdmixL = superplasticizerL + retarderL + acceleratorL + waterprooferL;

      const effectiveAir = useAirEntrainer ? Math.max(3.5, airContent) : airContent;
      const volAir = effectiveAir / 100;
      const volWater = netWaterContent / 1000;
      const volCement = massCement / (sgCement * 1000);
      const volFlyAsh = massFlyAsh > 0 ? massFlyAsh / (sgFlyAsh * 1000) : 0;
      const volSilicaFume = massSilicaFume > 0 ? massSilicaFume / (sgSilicaFume * 1000) : 0;
      const volGGBS = massGGBS > 0 ? massGGBS / (sgGGBS * 1000) : 0;
      const volAdmix = totalAdmixKg / (ADMIX_DENSITY * 1000);

      const volOccupied = volAir + volWater + volCement + volFlyAsh + volSilicaFume + volGGBS + volAdmix;
      const volAggregate = Math.max(0.60, 1.0 - volOccupied);

      let caRatio = 0.62;
      if (maxAggSize === 10) {
        caRatio = zoneFA === "Zone I" ? 0.48 : zoneFA === "Zone II" ? 0.50 : 0.52;
      } else if (maxAggSize === 20) {
        caRatio = zoneFA === "Zone I" ? 0.60 : zoneFA === "Zone II" ? 0.62 : 0.64;
      } else {
        caRatio = zoneFA === "Zone I" ? 0.69 : zoneFA === "Zone II" ? 0.71 : 0.73;
      }

      const wcDiff = 0.50 - waterCementRatio;
      caRatio = Math.min(0.78, Math.max(0.45, caRatio + (wcDiff / 0.05) * 0.01));

      const volCA = volAggregate * caRatio;
      const volFA = volAggregate * (1 - caRatio);

      const massCA = Math.round(volCA * sgCA * 1000);
      const massFA = Math.round(volFA * sgFA * 1000);

      const totalMixMass =
        massCement + massFlyAsh + massSilicaFume + massGGBS + netWaterContent + massFA + massCA + Math.round(totalAdmixKg);

      const binderRatio = 1;
      const faRatio = +(massFA / totalBinderContent).toFixed(2);
      const caRatioVal = +(massCA / totalBinderContent).toFixed(2);
      const waterRatio = +(netWaterContent / totalBinderContent).toFixed(2);

      let extraWaterFromSand = 0;
      let extraWaterFromStone = 0;
      let siteCorrectedWater = netWaterContent;
      let siteCorrectedFA = massFA;
      let siteCorrectedCA = massCA;

      if (enableMoistureCorr) {
        extraWaterFromSand = Math.round(massFA * (sandMoisture / 100));
        extraWaterFromStone = Math.round(massCA * (stoneMoisture / 100));
        siteCorrectedWater = Math.max(0, netWaterContent - (extraWaterFromSand + extraWaterFromStone));
        siteCorrectedFA = massFA + extraWaterFromSand;
        siteCorrectedCA = massCA + extraWaterFromStone;
      }

      let scaleMultiplier = 1.0;
      if (batchScale === "bag") {
        scaleMultiplier = 50 / massCement;
      } else if (batchScale === "custom") {
        scaleMultiplier = Math.max(0.01, customBatchVolume);
      }

      const scmWeight = massFlyAsh + massSilicaFume + massGGBS;
      const carbonReductionPct = totalBinderContent > 0 ? Math.round((scmWeight / totalBinderContent) * 90) : 0;

      const pctStone = Math.round((massCA / totalMixMass) * 100);
      const pctSand = Math.round((massFA / totalMixMass) * 100);
      const pctCement = Math.round((massCement / totalMixMass) * 100);
      const pctSCM = Math.round((scmWeight / totalMixMass) * 100);
      const pctWater = Math.round((netWaterContent / totalMixMass) * 100);
      const pctAdmix = Math.max(0.5, +(totalAdmixKg / totalMixMass * 100).toFixed(1));

      const bagMultiplier = 50 / massCement;
      const bagSandKg = (enableMoistureCorr ? siteCorrectedFA : massFA) * bagMultiplier;
      const bagStoneKg = (enableMoistureCorr ? siteCorrectedCA : massCA) * bagMultiplier;
      const bagWaterL = (enableMoistureCorr ? siteCorrectedWater : netWaterContent) * bagMultiplier;
      const bagAdmixMl = totalAdmixL * 1000 * bagMultiplier;

      return {
        targetMeanStrength,
        rawWater: Math.round(rawWater),
        waterReductionKg: Math.round(waterReductionKg),
        effectiveWaterReduction,
        netWaterContent,
        totalBinderContent,
        massCement,
        massFlyAsh,
        massSilicaFume,
        massGGBS,
        massFA,
        massCA,
        totalMixMass,
        proportions: { binderRatio, faRatio, caRatioVal, waterRatio },
        admixtures: {
          superplasticizerKg,
          superplasticizerL,
          retarderKg,
          retarderL,
          acceleratorKg,
          acceleratorL,
          waterprooferKg,
          waterprooferL,
          totalAdmixKg: +totalAdmixKg.toFixed(2),
          totalAdmixL: +totalAdmixL.toFixed(2),
        },
        moistureCorrection: {
          applied: enableMoistureCorr,
          extraWaterFromSand,
          extraWaterFromStone,
          siteCorrectedWater,
          siteCorrectedFA,
          siteCorrectedCA,
        },
        scaleMultiplier,
        carbonReductionPct,
        breakdownPct: { pctStone, pctSand, pctCement, pctSCM, pctWater, pctAdmix },
        siteBuckets: {
          sand: +(bagSandKg / 27).toFixed(1),
          stone: +(bagStoneKg / 26).toFixed(1),
          water: +(bagWaterL / 18).toFixed(1),
          waterLiters: Math.round(bagWaterL),
          admixMl: Math.round(bagAdmixMl),
        },
        reverseAnalysis: null,
      };
    }

    // ------------------------------------------
    // CASE B: REVERSE MIX RATIO ("WORK BACK")
    // ------------------------------------------
    const ADMIX_DENSITY = 1.10;
    const effectiveAir = useAirEntrainer ? Math.max(3.5, airContent) : airContent;
    const volAir = effectiveAir / 100;

    let effectiveWaterReduction = 0;
    if (useSuperplasticizer && waterReductionPercent > 0) {
      effectiveWaterReduction = Math.min(32, waterReductionPercent);
    } else if (useWaterproofer && !useSuperplasticizer) {
      effectiveWaterReduction = 5;
    }

    const waterMultiplier = reverseWc * (1 - effectiveWaterReduction / 100);

    const faPct = useFlyAsh ? Math.min(35, flyAshPercent) : 0;
    const sfPct = useSilicaFume ? Math.min(15, silicaFumePercent) : 0;
    const ggbsPct = useGGBS ? Math.min(65, ggbsPercent) : 0;
    const opcPct = Math.max(0, 100 - (faPct + sfPct + ggbsPct));

    const spDose = useSuperplasticizer ? superplasticizerDosage / 100 : 0;
    const retDose = useRetarder ? retarderDosage / 100 : 0;
    const accDose = useAccelerator ? acceleratorDosage / 100 : 0;
    const wpDose = useWaterproofer ? waterprooferDosage / 100 : 0;
    const totalAdmixFraction = spDose + retDose + accDose + wpDose;

    const kWater = waterMultiplier / 1000;
    const kCement = (opcPct / 100) / (sgCement * 1000);
    const kFA_SCM = faPct > 0 ? (faPct / 100) / (sgFlyAsh * 1000) : 0;
    const kSF_SCM = sfPct > 0 ? (sfPct / 100) / (sgSilicaFume * 1000) : 0;
    const kGGBS_SCM = ggbsPct > 0 ? (ggbsPct / 100) / (sgGGBS * 1000) : 0;
    const kSand = reverseRatioSand / (sgFA * 1000);
    const kStone = reverseRatioStone / (sgCA * 1000);
    const kAdmix = totalAdmixFraction / (ADMIX_DENSITY * 1000);

    const kTotal = kWater + kCement + kFA_SCM + kSF_SCM + kGGBS_SCM + kSand + kStone + kAdmix;

    const totalBinderContent = Math.round((1.0 - volAir) / kTotal);

    const massCement = Math.round(totalBinderContent * (opcPct / 100));
    const massFlyAsh = Math.round(totalBinderContent * (faPct / 100));
    const massSilicaFume = Math.round(totalBinderContent * (sfPct / 100));
    const massGGBS = Math.round(totalBinderContent * (ggbsPct / 100));

    const netWaterContent = Math.round(totalBinderContent * waterMultiplier);
    const rawWater = Math.round(netWaterContent / (1 - effectiveWaterReduction / 100));
    const waterReductionKg = rawWater - netWaterContent;

    const massFA = Math.round(totalBinderContent * reverseRatioSand);
    const massCA = Math.round(totalBinderContent * reverseRatioStone);

    const superplasticizerKg = +(totalBinderContent * spDose).toFixed(2);
    const superplasticizerL = +(superplasticizerKg / ADMIX_DENSITY).toFixed(2);
    const retarderKg = +(totalBinderContent * retDose).toFixed(2);
    const retarderL = +(retarderKg / ADMIX_DENSITY).toFixed(2);
    const acceleratorKg = +(totalBinderContent * accDose).toFixed(2);
    const acceleratorL = +(acceleratorKg / ADMIX_DENSITY).toFixed(2);
    const waterprooferKg = +(totalBinderContent * wpDose).toFixed(2);
    const waterprooferL = +(waterprooferKg / ADMIX_DENSITY).toFixed(2);

    const totalAdmixKg = superplasticizerKg + retarderKg + acceleratorKg + waterprooferKg;
    const totalAdmixL = superplasticizerL + retarderL + acceleratorL + waterprooferL;

    const totalMixMass =
      massCement + massFlyAsh + massSilicaFume + massGGBS + netWaterContent + massFA + massCA + Math.round(totalAdmixKg);

    let extraWaterFromSand = 0;
    let extraWaterFromStone = 0;
    let siteCorrectedWater = netWaterContent;
    let siteCorrectedFA = massFA;
    let siteCorrectedCA = massCA;

    if (enableMoistureCorr) {
      extraWaterFromSand = Math.round(massFA * (sandMoisture / 100));
      extraWaterFromStone = Math.round(massCA * (stoneMoisture / 100));
      siteCorrectedWater = Math.max(0, netWaterContent - (extraWaterFromSand + extraWaterFromStone));
      siteCorrectedFA = massFA + extraWaterFromSand;
      siteCorrectedCA = massCA + extraWaterFromStone;
    }

    let scaleMultiplier = 1.0;
    if (batchScale === "bag") {
      scaleMultiplier = 50 / massCement;
    } else if (batchScale === "custom") {
      scaleMultiplier = Math.max(0.01, customBatchVolume);
    }

    const scmWeight = massFlyAsh + massSilicaFume + massGGBS;
    const carbonReductionPct = totalBinderContent > 0 ? Math.round((scmWeight / totalBinderContent) * 90) : 0;

    const cementWaterRatio = totalBinderContent / Math.max(100, netWaterContent);
    const estimatedFck = Math.min(65, Math.max(10, Math.round(18.5 * (cementWaterRatio - 0.45))));

    const targetFckNum = parseInt(reverseTargetGrade.substring(1));
    const targetMeanStrength = targetFckNum + 1.65 * (targetFckNum <= 25 ? 4.0 : 5.0);

    const strengthAdequate = estimatedFck >= targetFckNum;

    const pctStone = Math.round((massCA / totalMixMass) * 100);
    const pctSand = Math.round((massFA / totalMixMass) * 100);
    const pctCement = Math.round((massCement / totalMixMass) * 100);
    const pctSCM = Math.round((scmWeight / totalMixMass) * 100);
    const pctWater = Math.round((netWaterContent / totalMixMass) * 100);
    const pctAdmix = Math.max(0.5, +(totalAdmixKg / totalMixMass * 100).toFixed(1));

    const bagMultiplier = 50 / massCement;
    const bagSandKg = (enableMoistureCorr ? siteCorrectedFA : massFA) * bagMultiplier;
    const bagStoneKg = (enableMoistureCorr ? siteCorrectedCA : massCA) * bagMultiplier;
    const bagWaterL = (enableMoistureCorr ? siteCorrectedWater : netWaterContent) * bagMultiplier;
    const bagAdmixMl = totalAdmixL * 1000 * bagMultiplier;

    return {
      targetMeanStrength,
      rawWater: Math.round(rawWater),
      waterReductionKg: Math.round(waterReductionKg),
      effectiveWaterReduction,
      netWaterContent,
      totalBinderContent,
      massCement,
      massFlyAsh,
      massSilicaFume,
      massGGBS,
      massFA,
      massCA,
      totalMixMass,
      proportions: {
        binderRatio: 1,
        faRatio: reverseRatioSand,
        caRatioVal: reverseRatioStone,
        waterRatio: +reverseWc.toFixed(2),
      },
      admixtures: {
        superplasticizerKg,
        superplasticizerL,
        retarderKg,
        retarderL,
        acceleratorKg,
        acceleratorL,
        waterprooferKg,
        waterprooferL,
        totalAdmixKg: +totalAdmixKg.toFixed(2),
        totalAdmixL: +totalAdmixL.toFixed(2),
      },
      moistureCorrection: {
        applied: enableMoistureCorr,
        extraWaterFromSand,
        extraWaterFromStone,
        siteCorrectedWater,
        siteCorrectedFA,
        siteCorrectedCA,
      },
      scaleMultiplier,
      carbonReductionPct,
      breakdownPct: { pctStone, pctSand, pctCement, pctSCM, pctWater, pctAdmix },
      siteBuckets: {
        sand: +(bagSandKg / 27).toFixed(1),
        stone: +(bagStoneKg / 26).toFixed(1),
        water: +(bagWaterL / 18).toFixed(1),
        waterLiters: Math.round(bagWaterL),
        admixMl: Math.round(bagAdmixMl),
      },
      reverseAnalysis: {
        estimatedFck,
        targetFck: targetFckNum,
        adequate: strengthAdequate,
      },
    };
  }, [
    calcDirection,
    fck,
    sd,
    maxAggSize,
    slump,
    waterCementRatio,
    airContent,
    reverseRatioSand,
    reverseRatioStone,
    reverseTargetGrade,
    reverseWc,
    sgCement,
    sgFlyAsh,
    sgSilicaFume,
    sgGGBS,
    sgCA,
    sgFA,
    zoneFA,
    useFlyAsh,
    flyAshPercent,
    useSilicaFume,
    silicaFumePercent,
    useGGBS,
    ggbsPercent,
    useSuperplasticizer,
    superplasticizerDosage,
    waterReductionPercent,
    useRetarder,
    retarderDosage,
    useAccelerator,
    acceleratorDosage,
    useWaterproofer,
    waterprooferDosage,
    useAirEntrainer,
    enableMoistureCorr,
    sandMoisture,
    stoneMoisture,
    batchScale,
    customBatchVolume,
  ]);

  // Scaled numbers helper
  const q = (baseQty: number) => {
    return +(baseQty * mixResults.scaleMultiplier).toFixed(
      batchScale === "bag" ? 1 : baseQty < 10 ? 2 : 0
    );
  };

  // Active Grade info (Forward or Reverse)
  const activeGradeKey = calcDirection === "forward" ? grade : reverseTargetGrade;
  const gradeInfo = GRADE_LAYMAN_GUIDE[activeGradeKey];

  // Slump info for current active slump
  const activeSlumpValue = calcDirection === "forward" ? slump : predictedSlump;
  const slumpIndicator = useMemo(() => {
    const s = activeSlumpValue;
    if (s <= 60) {
      return {
        label: "Very Stiff / Low Workability",
        badge: "🪨 Stiff (Pavement)",
        color: "text-amber-700 bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800",
        barColor: "bg-amber-500",
        pct: 25,
        feel: "Like damp brown sugar. Needs heavy machine vibration.",
        pumpable: "❌ Cannot pump (will clog pump hose)",
      };
    } else if (s <= 110) {
      return {
        label: "Normal / Shovelable Workability",
        badge: "🧱 Normal (House Slabs)",
        color: "text-blue-700 bg-blue-100 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800",
        barColor: "bg-blue-500",
        pct: 50,
        feel: "Like thick oatmeal paste. Easy to spread with hand shovels.",
        pumpable: "⚠️ Hard to pump (better for crane bucket or wheelbarrows)",
      };
    } else if (s <= 155) {
      return {
        label: "Pump-Friendly / High Flow",
        badge: "🚀 Pumpable (Recommended)",
        color: "text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800",
        barColor: "bg-emerald-500",
        pct: 80,
        feel: "Like a smooth milkshake. Flows effortlessly around rebar cages.",
        pumpable: "✅ Ideal for concrete boom pumps & long hoses",
      };
    } else {
      return {
        label: "Flowing / Self-Compacting",
        badge: "🌊 Self-Leveling",
        color: "text-indigo-700 bg-indigo-100 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800",
        barColor: "bg-indigo-500",
        pct: 100,
        feel: "Near liquid soup. Self-levels into congested formwork with zero vibration.",
        pumpable: "✅ Ultra-easy pumping (Requires Superplasticizer to prevent stone sinking)",
      };
    }
  }, [activeSlumpValue]);

  // Water-Binder Dial
  const waterHealthIndicator = useMemo(() => {
    if (effectiveWc <= 0.38) {
      return {
        label: "Ultra-Strong & Waterproof",
        badge: "🟢 Premium Durability",
        color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
        advice: "Extremely dense, crack-resistant and impermeable to water leaks.",
      };
    } else if (effectiveWc <= 0.45) {
      return {
        label: "Good Balance",
        badge: "🟢 Safe Structural",
        color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
        advice: "Standard quality for reinforced concrete beams, columns and slabs.",
      };
    } else if (effectiveWc <= 0.50) {
      return {
        label: "Moderate (Watch Shrinkage)",
        badge: "🟡 Moderate Strength",
        color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
        advice: "Acceptable for plain ground footings, but higher chance of hairline cracks.",
      };
    } else {
      return {
        label: "Too Much Water (Caution!)",
        badge: "🔴 Weak / High Crack Risk",
        color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800",
        advice: "Excess water creates hollow microscopic pores, causing weak powdery concrete!",
      };
    }
  }, [effectiveWc]);

  // Copy Recipe Text
  const copyRecipeToClipboard = () => {
    const text = `
=== JQMS CONCRETE MIX DESIGN SUBMITTAL ===
Mode: ${calcDirection === "forward" ? "Forward Engineering (Strength -> Proportions)" : "Reverse Mix Design (Ratio -> Materials)"}
Grade: ${activeGradeKey} (${gradeInfo.name} - ${gradeInfo.psi} PSI)
Target Mean Strength f'cr: ${mixResults.targetMeanStrength.toFixed(1)} MPa
Workability / Slump: ${slump} mm (Natural predicted: ~${predictedSlump} mm)
Ratio: 1 : ${mixResults.proportions.faRatio} : ${mixResults.proportions.caRatioVal} (w/b: ${mixResults.proportions.waterRatio})
Batching Basis: ${
      batchScale === "1m3"
        ? "1.0 m³ Standard Mix"
        : batchScale === "bag"
        ? "Per 50 kg Bag of Cement"
        : `${customBatchVolume} m³ Batch Volume`
    }

--- BATCH QUANTITIES ---
• OPC Cement: ${q(mixResults.massCement)} kg
${mixResults.massFlyAsh > 0 ? `• Fly Ash: ${q(mixResults.massFlyAsh)} kg (${flyAshPercent}%)\n` : ""}${
      mixResults.massSilicaFume > 0
        ? `• Silica Fume: ${q(mixResults.massSilicaFume)} kg (${silicaFumePercent}%)\n`
        : ""
    }${mixResults.massGGBS > 0 ? `• GGBS: ${q(mixResults.massGGBS)} kg (${ggbsPercent}%)\n` : ""}• Total Binder: ${q(
      mixResults.totalBinderContent
    )} kg
• Net Mixing Water: ${
      enableMoistureCorr
        ? `${q(mixResults.moistureCorrection.siteCorrectedWater)} L (Moisture Corrected)`
        : `${q(mixResults.netWaterContent)} L`
    }
• Fine Sand: ${
      enableMoistureCorr
        ? `${q(mixResults.moistureCorrection.siteCorrectedFA)} kg (Wet)`
        : `${q(mixResults.massFA)} kg (SSD)`
    }
• Coarse Stone: ${
      enableMoistureCorr
        ? `${q(mixResults.moistureCorrection.siteCorrectedCA)} kg (Wet)`
        : `${q(mixResults.massCA)} kg (SSD)`
    }

--- CHEMICAL ADMIXTURES ---
${
  useSuperplasticizer
    ? `• Superplasticizer (PCE): ${q(mixResults.admixtures.superplasticizerKg)} kg (${q(
        mixResults.admixtures.superplasticizerL
      )} L) [${superplasticizerDosage}%]\n`
    : ""
}${
      useRetarder
        ? `• Retarder: ${q(mixResults.admixtures.retarderKg)} kg (${q(
            mixResults.admixtures.retarderL
          )} L) [${retarderDosage}%]\n`
        : ""
    }${
      useAccelerator
        ? `• Accelerator: ${q(mixResults.admixtures.acceleratorKg)} kg (${q(
            mixResults.admixtures.acceleratorL
          )} L) [${acceleratorDosage}%]\n`
        : ""
    }${
      useWaterproofer
        ? `• Waterproofing Agent: ${q(mixResults.admixtures.waterprooferKg)} kg (${q(
            mixResults.admixtures.waterprooferL
          )} L) [${waterprooferDosage}%]\n`
        : ""
    }
--- SITE BUCKET ESTIMATE (PER 50KG BAG) ---
1 Bag Cement + ~${mixResults.siteBuckets.sand} Buckets Sand + ~${
      mixResults.siteBuckets.stone
    } Buckets Stone + ${mixResults.siteBuckets.waterLiters} Liters Water (${
      mixResults.siteBuckets.admixMl > 0 ? `+ ${mixResults.siteBuckets.admixMl} ml Admixture` : "no admix"
    })

Generated via JQMS Engineering Mix Design Engine
    `.trim();

    navigator.clipboard.writeText(text);
    toast.success("Mix recipe copied to clipboard!");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Direction / Mode Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Concrete Mix Design Assistant
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Slump Auto-Detection
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Proportion forward or work backwards from ratio, with automatic slump prediction & override feedback.
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setCalcMode("guided")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                calcMode === "guided"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Easy Mode (Layman)
            </button>
            <button
              type="button"
              onClick={() => setCalcMode("advanced")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                calcMode === "advanced"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Advanced Engineering
            </button>
          </div>
        </div>

        {/* PRIMARY CALCULATION DIRECTION TABS */}
        <div className="mt-5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setCalcDirection("forward")}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition ${
              calcDirection === "forward"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-750"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            1. Target Strength &rarr; Auto Mix Ratio (Forward Design)
          </button>

          <button
            type="button"
            onClick={() => setCalcDirection("reverse")}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition ${
              calcDirection === "reverse"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-750"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            2. Input Mix Ratio &rarr; Calculate Materials ("Work Back")
          </button>
        </div>

        {/* FORWARD PRESET SELECTOR */}
        {calcDirection === "forward" && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-500" />
                Pick What You Are Casting (Pre-Optimized Recipes)
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Click any card to auto-configure additives & proportions
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {(Object.keys(PRESET_LIBRARY) as PresetKey[]).map((key) => {
                const preset = PRESET_LIBRARY[key];
                const isSelected = selectedPreset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => loadPreset(key)}
                    className={`p-3 text-left rounded-xl border transition flex flex-col justify-between relative group ${
                      isSelected
                        ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-500/80 ring-2 ring-indigo-500/20 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    )}
                    <div>
                      <div className="text-xl mb-1">{preset.icon}</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        {preset.title}
                      </div>
                    </div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-2 leading-tight">
                      {preset.laymanTag}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* REVERSE RATIO SELECTOR */}
        {calcDirection === "reverse" && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                Pick a Standard Site Ratio OR Enter Custom Proportions
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Common nominal volumetric site ratios
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {NOMINAL_RATIO_PRESETS.map((preset) => {
                const isSelected =
                  reverseRatioSand === preset.sand && reverseRatioStone === preset.stone;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => loadNominalRatio(preset)}
                    className={`p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {preset.name}
                    </div>
                    <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      Approx {preset.approxGrade}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-tight">
                      {preset.useCase}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Parameters & Additives Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Interactive Parameters */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECTION A: INPUTS BASED ON DIRECTION */}
          {calcDirection === "forward" ? (
            /* FORWARD SECTION A: Strength & Slump */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  Step 2: Concrete Grade & Slump Flow
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  fck = {fck} MPa
                </span>
              </div>

              {/* Strength Meter */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${gradeInfo.color}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black tracking-tight">{grade}: {gradeInfo.name}</span>
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/60 dark:bg-black/30 font-bold">
                      ≈ {gradeInfo.psi} PSI
                    </span>
                  </div>
                  <p className="text-xs mt-1 opacity-90">
                    👉 <strong>Best For:</strong> {gradeInfo.usage}
                  </p>
                </div>

                <div className="flex items-center gap-1 self-end sm:self-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider mr-1 opacity-70">
                    Strength:
                  </span>
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`w-3.5 h-6 rounded-sm transition-all ${
                        lvl <= gradeInfo.meterLevel
                          ? "bg-indigo-600 dark:bg-indigo-400 opacity-100 scale-105"
                          : "bg-slate-300 dark:bg-slate-700 opacity-40"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Grade Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select Concrete Grade:
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(
                    ["M15", "M20", "M25", "M30", "M35", "M40", "M45", "M50", "M55", "M60"] as ConcreteGrade[]
                  ).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleGradeChange(g)}
                      className={`py-2 text-xs font-bold rounded-lg border transition ${
                        grade === g
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-sm ring-2 ring-indigo-500/30"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Water-Cement Ratio */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Water-to-Binder Ratio (w/b)
                      </label>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${waterHealthIndicator.color}`}>
                        {waterHealthIndicator.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {waterHealthIndicator.advice}
                    </span>
                  </div>
                  <span className="text-sm font-mono font-black text-blue-600 dark:text-blue-400">
                    {waterCementRatio.toFixed(2)}
                  </span>
                </div>

                <input
                  type="range"
                  min="0.28"
                  max="0.55"
                  step="0.01"
                  value={waterCementRatio}
                  onChange={(e) => {
                    setSelectedPreset("custom");
                    setWaterCementRatio(Number(e.target.value));
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Slump Flow & Auto-Detection Engine */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Workability / Slump Flow
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !autoDetectSlump;
                          setAutoDetectSlump(next);
                          if (next) setSlump(predictedSlump);
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
                          autoDetectSlump
                            ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700 hover:text-slate-900"
                        }`}
                      >
                        <Wand2 className="w-3 h-3" />
                        {autoDetectSlump ? "Auto-Detecting" : "Manual Override"}
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {autoDetectSlump
                        ? `Auto-predicted from w/b (${waterCementRatio}) & active chemical admixtures`
                        : "Manual custom target dialed"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      {slump} mm
                    </span>
                    <span className={`block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5 ${slumpIndicator.color}`}>
                      {slumpIndicator.badge}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <input
                    type="range"
                    min="25"
                    max="200"
                    step="5"
                    value={slump}
                    onChange={(e) => {
                      setAutoDetectSlump(false);
                      setSelectedPreset("custom");
                      setSlump(Number(e.target.value));
                    }}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${slumpIndicator.barColor}`}
                      style={{ width: `${slumpIndicator.pct}%` }}
                    />
                  </div>
                </div>

                {/* SLUMP OVERRIDE STATEMENT / ADVISORY CARD */}
                {slumpDeviation.isOverridden && (
                  <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-300 dark:border-amber-800/80 text-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-amber-900 dark:text-amber-200">
                            {slumpDeviation.statement}
                          </p>
                          <p className="text-amber-800 dark:text-amber-300 mt-0.5 text-[11px] leading-relaxed">
                            {slumpDeviation.advice}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSlump(predictedSlump);
                          setAutoDetectSlump(true);
                          toast.success(`Reset to auto-predicted slump (${predictedSlump} mm)`);
                        }}
                        className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] whitespace-nowrap shadow-sm"
                      >
                        Sync ({predictedSlump} mm)
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Flow Texture: </span>
                    <strong className="text-slate-800 dark:text-slate-200">{slumpIndicator.feel}</strong>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 font-semibold text-[11px] whitespace-nowrap">
                    {slumpIndicator.pumpable}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* REVERSE SECTION A: INPUT YOUR MIX RATIO & TARGET STRENGTH */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-indigo-500" />
                  Step 2: Enter Your Mix Ratio & Target Strength
                </h3>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  1 : {reverseRatioSand} : {reverseRatioStone}
                </span>
              </div>

              {/* Ratio Input Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Part 1: Cement
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">1</div>
                  <span className="text-[10px] text-slate-500">Fixed Basis</span>
                </div>

                <div className="p-3 bg-yellow-50/60 dark:bg-yellow-950/20 rounded-xl border border-yellow-200 dark:border-yellow-800/60 text-center">
                  <span className="text-[10px] font-bold uppercase text-yellow-700 dark:text-yellow-400 block">
                    Part 2: Fine Sand
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="6.0"
                    value={reverseRatioSand}
                    onChange={(e) => setReverseRatioSand(Math.max(0.1, Number(e.target.value)))}
                    className="w-20 text-center font-black text-xl bg-white dark:bg-slate-900 border border-yellow-300 dark:border-yellow-700 rounded-lg py-1 mt-1 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">Parts Sand</span>
                </div>

                <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/60 text-center">
                  <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 block">
                    Part 3: Coarse Stone
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="10.0"
                    value={reverseRatioStone}
                    onChange={(e) => setReverseRatioStone(Math.max(0.1, Number(e.target.value)))}
                    className="w-20 text-center font-black text-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg py-1 mt-1 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">Parts Gravel</span>
                </div>
              </div>

              {/* Target Concrete Grade */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    What Grade/Strength are you aiming to achieve?
                  </label>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {reverseTargetGrade} (≈ {GRADE_LAYMAN_GUIDE[reverseTargetGrade].psi} PSI)
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {(
                    ["M15", "M20", "M25", "M30", "M35", "M40", "M45", "M50", "M55", "M60"] as ConcreteGrade[]
                  ).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setReverseTargetGrade(g)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                        reverseTargetGrade === g
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Water-to-Cement Ratio in Reverse Mode */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Prescribed Water-Cement Ratio (w/c)
                      </label>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${waterHealthIndicator.color}`}>
                        {waterHealthIndicator.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Amount of mixing water per 1 kg of cement
                    </span>
                  </div>
                  <span className="text-sm font-mono font-black text-blue-600 dark:text-blue-400">
                    {reverseWc.toFixed(2)}
                  </span>
                </div>

                <input
                  type="range"
                  min="0.30"
                  max="0.65"
                  step="0.01"
                  value={reverseWc}
                  onChange={(e) => setReverseWc(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* REVERSE MODE SLUMP AUTO-DETECTION STATEMENT */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      Auto-Detected Slump for this Recipe:
                    </span>
                    <span className="text-xs font-black font-mono px-2 py-0.5 rounded bg-indigo-600 text-white">
                      ~{predictedSlump} mm ({slumpIndicator.badge})
                    </span>
                  </div>

                  <p className="text-[11px] text-indigo-800 dark:text-indigo-300 leading-relaxed">
                    Based on your water ratio ({reverseWc.toFixed(2)}) and active admixtures, this mix will naturally produce a <strong>~{predictedSlump} mm slump</strong> ({slumpIndicator.label}).
                  </p>
                </div>
              </div>

              {/* Reverse Strength Feasibility Card */}
              {mixResults.reverseAnalysis && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    mixResults.reverseAnalysis.adequate
                      ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                      : "bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                  }`}
                >
                  {mixResults.reverseAnalysis.adequate ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-sm">
                      {mixResults.reverseAnalysis.adequate
                        ? `Strength Verified: Estimated ~${mixResults.reverseAnalysis.estimatedFck} MPa (Exceeds ${reverseTargetGrade})`
                        : `Strength Warning: Estimated ~${mixResults.reverseAnalysis.estimatedFck} MPa (Short of ${reverseTargetGrade})`}
                    </div>
                    <p className="opacity-90 leading-relaxed">
                      {mixResults.reverseAnalysis.adequate
                        ? `A 1 : ${reverseRatioSand} : ${reverseRatioStone} mix with w/c ${reverseWc} provides ample cement density to reach your target ${reverseTargetGrade} compressive strength safely.`
                        : `A 1 : ${reverseRatioSand} : ${reverseRatioStone} mix with w/c ${reverseWc} is somewhat lean for ${reverseTargetGrade} (${mixResults.reverseAnalysis.targetFck} MPa). Consider turning on Superplasticizer to lower w/c, or use a richer ratio such as 1 : 1.5 : 3.`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION B: CHEMICAL ADMIXTURES */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-emerald-500" />
                Step 3: Chemical Additives & Admixtures
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-medium">
                {useSuperplasticizer || useRetarder || useAccelerator || useWaterproofer
                  ? "Admixtures Active"
                  : "No Admixtures"}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Toggle additives to customize setting speed, water reduction, and waterproofing (auto-updates slump prediction):
            </p>

            <div className="space-y-3 pt-1">
              {/* 1. Superplasticizer / HRWR */}
              <div
                className={`p-3.5 rounded-xl border transition ${
                  useSuperplasticizer
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80"
                    : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useSuperplasticizer}
                      onChange={(e) => {
                        setSelectedPreset("custom");
                        setUseSuperplasticizer(e.target.checked);
                      }}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Superplasticizer / HRWR (Polycarboxylate Ether - PCE)
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold">
                          ★ Flow & Water Cut
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        💡 <strong>What it does:</strong> Cuts water demand by {waterReductionPercent}% while making concrete glide smoothly without losing strength.
                      </span>
                    </div>
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap ml-2">
                    {useSuperplasticizer ? `${superplasticizerDosage}% dosage` : "OFF"}
                  </span>
                </div>

                {useSuperplasticizer && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-emerald-100 dark:border-emerald-900/40">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1 text-slate-600 dark:text-slate-300">
                        <span>Dosage (% of cement weight)</span>
                        <span className="font-bold">{superplasticizerDosage}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.4"
                        max="2.0"
                        step="0.1"
                        value={superplasticizerDosage}
                        onChange={(e) => setSuperplasticizerDosage(Number(e.target.value))}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1 text-slate-600 dark:text-slate-300">
                        <span>Water Cut Credit</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          -{waterReductionPercent}% water
                        </span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="30"
                        step="1"
                        value={waterReductionPercent}
                        onChange={(e) => setWaterReductionPercent(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Retarder */}
              <div
                className={`p-3.5 rounded-xl border transition ${
                  useRetarder
                    ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80"
                    : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useRetarder}
                      onChange={(e) => {
                        setSelectedPreset("custom");
                        setUseRetarder(e.target.checked);
                      }}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Retarding Admixture (Hot Weather Concreting)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        💡 <strong>What it does:</strong> Delays setting by 2 to 4 hours to prevent cold joints during transport delays or under hot sun.
                      </span>
                    </div>
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap ml-2">
                    {useRetarder ? `${retarderDosage}% dosage` : "OFF"}
                  </span>
                </div>

                {useRetarder && (
                  <div className="mt-3 pt-3 border-t border-amber-100 dark:border-amber-900/40">
                    <div className="flex justify-between text-[11px] mb-1 text-slate-600 dark:text-slate-300">
                      <span>Dosage (% of cement)</span>
                      <span className="font-bold">{retarderDosage}% (approx 200-500 ml/100kg)</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="0.8"
                      step="0.05"
                      value={retarderDosage}
                      onChange={(e) => setRetarderDosage(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* 3. Accelerator */}
              <div
                className={`p-3.5 rounded-xl border transition ${
                  useAccelerator
                    ? "bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800/80"
                    : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAccelerator}
                      onChange={(e) => {
                        setSelectedPreset("custom");
                        setUseAccelerator(e.target.checked);
                      }}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Accelerating Admixture (Cold Weather / Early Stripping)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        💡 <strong>What it does:</strong> Accelerates early 1-3 day strength so formwork can be stripped faster.
                      </span>
                    </div>
                  </label>
                  <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap ml-2">
                    {useAccelerator ? `${acceleratorDosage}% dosage` : "OFF"}
                  </span>
                </div>

                {useAccelerator && (
                  <div className="mt-3 pt-3 border-t border-purple-100 dark:border-purple-900/40">
                    <div className="flex justify-between text-[11px] mb-1 text-slate-600 dark:text-slate-300">
                      <span>Dosage (% of cement)</span>
                      <span className="font-bold">{acceleratorDosage}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      value={acceleratorDosage}
                      onChange={(e) => setAcceleratorDosage(Number(e.target.value))}
                      className="w-full accent-purple-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* 4. Integral Waterproofing */}
              <div
                className={`p-3.5 rounded-xl border transition ${
                  useWaterproofer
                    ? "bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-300 dark:border-cyan-800/80"
                    : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-80"
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useWaterproofer}
                      onChange={(e) => {
                        setSelectedPreset("custom");
                        setUseWaterproofer(e.target.checked);
                      }}
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Integral Waterproofing (Crystalline Leak Blocker)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        💡 <strong>What it does:</strong> Seals microscopic pores in basements, retaining walls, and water tanks.
                      </span>
                    </div>
                  </label>
                  <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 whitespace-nowrap ml-2">
                    {useWaterproofer ? `${waterprooferDosage}% dosage` : "OFF"}
                  </span>
                </div>

                {useWaterproofer && (
                  <div className="mt-3 pt-3 border-t border-cyan-100 dark:border-cyan-900/40">
                    <div className="flex justify-between text-[11px] mb-1 text-slate-600 dark:text-slate-300">
                      <span>Dosage (% of cement)</span>
                      <span className="font-bold">{waterprooferDosage}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={waterprooferDosage}
                      onChange={(e) => setWaterprooferDosage(Number(e.target.value))}
                      className="w-full accent-cyan-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION C: MINERAL POWDERS (SCMs) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Step 4: Mineral Powders (Fly Ash, Slag, Micro-Silica)
              </h3>
              {mixResults.carbonReductionPct > 0 && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                  <Leaf className="w-3 h-3" />
                  -{mixResults.carbonReductionPct}% CO₂ Green Score
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Substitute cement with mineral pozzolans to improve long-term durability and lower costs:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Fly Ash */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  useFlyAsh
                    ? "bg-slate-100/70 dark:bg-slate-800/60 border-indigo-400 dark:border-indigo-500"
                    : "bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 opacity-70"
                }`}
              >
                <div>
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={useFlyAsh}
                      onChange={(e) => {
                        setSelectedPreset("custom");
                        setUseFlyAsh(e.target.checked);
                      }}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Fly Ash (PFA)
                    </span>
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    🍃 Smooths pumping, prevents thermal cracks.
                  </p>
                </div>
                {useFlyAsh && (
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                      <span>Replaced:</span>
                      <span>{flyAshPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="35"
                      step="5"
                      value={flyAshPercent}
                      onChange={(e) => setFlyAshPercent(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Silica Fume */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  useSilicaFume
                    ? "bg-slate-100/70 dark:bg-slate-800/60 border-indigo-400 dark:border-indigo-500"
                    : "bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 opacity-70"
                }`}
              >
                <div>
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={useSilicaFume}
                      onChange={(e) => {
                        setSelectedPreset("custom");
                        setUseSilicaFume(e.target.checked);
                      }}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Silica Fume
                    </span>
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    💎 Extreme 28d strength & sea-salt resistance.
                  </p>
                </div>
                {useSilicaFume && (
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                      <span>Dose Addition:</span>
                      <span>{silicaFumePercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="12"
                      step="1"
                      value={silicaFumePercent}
                      onChange={(e) => setSilicaFumePercent(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* GGBS */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  useGGBS
                    ? "bg-slate-100/70 dark:bg-slate-800/60 border-indigo-400 dark:border-indigo-500"
                    : "bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 opacity-70"
                }`}
              >
                <div>
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={useGGBS}
                      onChange={(e) => {
                        setSelectedPreset("custom");
                        setUseGGBS(e.target.checked);
                      }}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      GGBS (Slag)
                    </span>
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    🛡️ High sulfate & marine acid defense.
                  </p>
                </div>
                {useGGBS && (
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                      <span>Replaced:</span>
                      <span>{ggbsPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="60"
                      step="5"
                      value={ggbsPercent}
                      onChange={(e) => setGgbsPercent(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION D: MOISTURE CORRECTION */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  Step 5: Rain & Damp Sand Moisture Fix
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Subtract moisture water automatically so concrete doesn't get ruined.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableMoistureCorr}
                  onChange={(e) => setEnableMoistureCorr(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {enableMoistureCorr && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50/60 dark:bg-blue-950/20 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/40">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Sand Dampness (Wetness):</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      {sandMoisture}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="0.5"
                    value={sandMoisture}
                    onChange={(e) => setSandMoisture(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Adds +{mixResults.moistureCorrection.extraWaterFromSand} Liters free water from damp sand
                  </div>
                </div>

                <div className="bg-blue-50/60 dark:bg-blue-950/20 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/40">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Stone Pile Dampness:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      {stoneMoisture}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="0.5"
                    value={stoneMoisture}
                    onChange={(e) => setStoneMoisture(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Adds +{mixResults.moistureCorrection.extraWaterFromStone} Liters free water from stones
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Columns: Calculated Materials & Batch Quantities */}
        <div className="lg:col-span-5 space-y-6">
          {/* Layman One-Minute Summary Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-5 rounded-2xl shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider opacity-90 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {calcDirection === "forward" ? "Forward Mix Recipe" : "Reverse Mix Material Plan"}
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/20">
                1 : {mixResults.proportions.faRatio} : {mixResults.proportions.caRatioVal}
              </span>
            </div>

            <div className="text-sm font-bold leading-snug">
              "For every 1 bag of cement, add ~{mixResults.siteBuckets.sand} buckets of sand, ~{mixResults.siteBuckets.stone} buckets of gravel, and {mixResults.siteBuckets.waterLiters} Liters of water."
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 text-xs">
              <div>
                <span className="text-indigo-200 text-[10px] block">Effective w/b Ratio</span>
                <span className="font-bold">{effectiveWc.toFixed(2)} ({waterHealthIndicator.badge})</span>
              </div>
              <div>
                <span className="text-indigo-200 text-[10px] block">Target Strength</span>
                <span className="font-bold">{activeGradeKey} ({gradeInfo.psi} PSI)</span>
              </div>
            </div>
          </div>

          {/* Visual Concrete Anatomy Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-500" />
                Concrete Anatomy (1.0 m³ Ingredients)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Total ≈ {mixResults.totalMixMass} kg
              </span>
            </div>

            <div className="h-5 w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${mixResults.breakdownPct.pctStone}%` }}
                className="bg-amber-600 hover:opacity-90 transition-all flex items-center justify-center text-[10px] font-bold text-white truncate px-1"
                title={`Coarse Stone: ${mixResults.breakdownPct.pctStone}%`}
              >
                {mixResults.breakdownPct.pctStone}% Stone
              </div>
              <div
                style={{ width: `${mixResults.breakdownPct.pctSand}%` }}
                className="bg-yellow-500 hover:opacity-90 transition-all flex items-center justify-center text-[10px] font-bold text-slate-950 truncate px-1"
                title={`Sand: ${mixResults.breakdownPct.pctSand}%`}
              >
                {mixResults.breakdownPct.pctSand}% Sand
              </div>
              <div
                style={{ width: `${mixResults.breakdownPct.pctCement}%` }}
                className="bg-slate-500 hover:opacity-90 transition-all flex items-center justify-center text-[10px] font-bold text-white truncate px-1"
                title={`Cement: ${mixResults.breakdownPct.pctCement}%`}
              >
                {mixResults.breakdownPct.pctCement}% Cement
              </div>
              {mixResults.breakdownPct.pctSCM > 0 && (
                <div
                  style={{ width: `${mixResults.breakdownPct.pctSCM}%` }}
                  className="bg-emerald-500 hover:opacity-90 transition-all flex items-center justify-center text-[10px] font-bold text-white truncate px-1"
                  title={`SCM Powders: ${mixResults.breakdownPct.pctSCM}%`}
                >
                  {mixResults.breakdownPct.pctSCM}% SCM
                </div>
              )}
              <div
                style={{ width: `${mixResults.breakdownPct.pctWater}%` }}
                className="bg-blue-500 hover:opacity-90 transition-all flex items-center justify-center text-[10px] font-bold text-white truncate px-1"
                title={`Water: ${mixResults.breakdownPct.pctWater}%`}
              >
                {mixResults.breakdownPct.pctWater}%
              </div>
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"/> Stone</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"/> Sand</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block"/> Cement</span>
              {mixResults.breakdownPct.pctSCM > 0 && (
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/> Mineral SCM</span>
              )}
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"/> Water</span>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/60 dark:from-indigo-950/40 dark:to-indigo-900/20 border border-indigo-200 dark:border-indigo-800/60 p-4 rounded-2xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                Target Lab Strength
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {mixResults.targetMeanStrength.toFixed(1)}{" "}
                <span className="text-xs font-normal text-slate-500">MPa</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                f'cr = {activeGradeKey.substring(1)} + 1.65 × s
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Mix Proportion
              </span>
              <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1 truncate">
                1 : {mixResults.proportions.faRatio} : {mixResults.proportions.caRatioVal}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                w/b ratio: {effectiveWc.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Main Batching Output Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Site Batching Quantities
                </h4>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={copyRecipeToClipboard}
                  title="Copy recipe text"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  title="Print Mix Sheet"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Batch Scale Switcher */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Batching Scale:
                </label>

                {batchScale === "bag" && (
                  <button
                    type="button"
                    onClick={() => setDisplaySiteBuckets(!displaySiteBuckets)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Box className="w-3.5 h-3.5" />
                    {displaySiteBuckets ? "Show Exact Kg" : "Show Headpans / Buckets"}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBatchScale("1m3")}
                  className={`py-2 px-2.5 text-xs font-bold rounded-xl border text-center transition ${
                    batchScale === "1m3"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  Per 1.0 m³
                </button>
                <button
                  type="button"
                  onClick={() => setBatchScale("bag")}
                  className={`py-2 px-2.5 text-xs font-bold rounded-xl border text-center transition ${
                    batchScale === "bag"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  Per 50kg Bag
                </button>
                <button
                  type="button"
                  onClick={() => setBatchScale("custom")}
                  className={`py-2 px-2.5 text-xs font-bold rounded-xl border text-center transition ${
                    batchScale === "custom"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  Custom Volume
                </button>
              </div>

              {batchScale === "custom" && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Batch Volume (Truck or Mixer):</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      {customBatchVolume} m³
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      step="0.1"
                      min="0.05"
                      max="20"
                      value={customBatchVolume}
                      onChange={(e) => setCustomBatchVolume(Math.max(0.01, Number(e.target.value)))}
                      className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold"
                    />
                    <div className="flex gap-1">
                      {[0.05, 0.2, 0.5, 6.0, 8.0].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setCustomBatchVolume(v)}
                          className="px-2 py-1 text-[10px] font-semibold rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-500"
                        >
                          {v}m³
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Special Site Headpans / Buckets Mode Banner */}
            {batchScale === "bag" && displaySiteBuckets && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                  <Box className="w-4 h-4 text-amber-600" />
                  Site Foreman Measurement (18L Standard Headpan / Bucket):
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800">
                    <span className="text-[10px] text-slate-500 block">Fine Sand</span>
                    <strong className="text-base font-black text-amber-700 dark:text-amber-400">
                      ~{mixResults.siteBuckets.sand}
                    </strong>
                    <span className="text-[10px] text-slate-400 block">Buckets</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800">
                    <span className="text-[10px] text-slate-500 block">Coarse Stone</span>
                    <strong className="text-base font-black text-amber-700 dark:text-amber-400">
                      ~{mixResults.siteBuckets.stone}
                    </strong>
                    <span className="text-[10px] text-slate-400 block">Buckets</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800">
                    <span className="text-[10px] text-slate-500 block">Clean Water</span>
                    <strong className="text-base font-black text-blue-600 dark:text-blue-400">
                      {mixResults.siteBuckets.waterLiters}L
                    </strong>
                    <span className="text-[10px] text-slate-400 block">
                      (≈{mixResults.siteBuckets.water} Buckets)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Batch Table */}
            <div className="space-y-2.5">
              {/* Cement */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    OPC Cement (Type I / 43/53)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {batchScale === "1m3"
                      ? `${(mixResults.massCement / 50).toFixed(1)} Bags (50kg)`
                      : "1 Full Standard 50kg Bag"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                    {q(mixResults.massCement)}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">kg</span>
                </div>
              </div>

              {/* Mineral SCMs if active */}
              {mixResults.massFlyAsh > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Fly Ash (PFA)
                    </span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                      {flyAshPercent}% Binder Replacement
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                      {q(mixResults.massFlyAsh)}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">kg</span>
                  </div>
                </div>
              )}

              {mixResults.massSilicaFume > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Silica Fume (Micro-silica)
                    </span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                      {silicaFumePercent}% Pozzolanic Dosage
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                      {q(mixResults.massSilicaFume)}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">kg</span>
                  </div>
                </div>
              )}

              {mixResults.massGGBS > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      GGBS (Slag)
                    </span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                      {ggbsPercent}% Slag Substitution
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                      {q(mixResults.massGGBS)}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">kg</span>
                  </div>
                </div>
              )}

              {/* Mixing Water */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
                <div>
                  <span className="text-xs font-bold text-blue-950 dark:text-blue-300 block">
                    Mixing Water
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                    {enableMoistureCorr
                      ? `Stockpile moisture adjusted (-${
                          mixResults.moistureCorrection.extraWaterFromSand +
                          mixResults.moistureCorrection.extraWaterFromStone
                        } L)`
                      : `Net W/B: ${effectiveWc.toFixed(2)}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-blue-600 dark:text-blue-400 font-mono">
                    {q(
                      enableMoistureCorr
                        ? mixResults.moistureCorrection.siteCorrectedWater
                        : mixResults.netWaterContent
                    )}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">Liters</span>
                </div>
              </div>

              {/* Fine Aggregate */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Fine Aggregate (Sand)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {enableMoistureCorr ? `Wet Batch Weight (+${sandMoisture}% moist)` : "SSD Dry Weight"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                    {q(
                      enableMoistureCorr
                        ? mixResults.moistureCorrection.siteCorrectedFA
                        : mixResults.massFA
                    )}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">kg</span>
                </div>
              </div>

              {/* Coarse Aggregate */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Coarse Aggregate ({maxAggSize} mm)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {enableMoistureCorr ? `Wet Batch Weight (+${stoneMoisture}% moist)` : "SSD Dry Weight"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                    {q(
                      enableMoistureCorr
                        ? mixResults.moistureCorrection.siteCorrectedCA
                        : mixResults.massCA
                    )}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">kg</span>
                </div>
              </div>

              {/* Chemical Admixtures Row */}
              {mixResults.admixtures.totalAdmixKg > 0 && (
                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                    Chemical Admixture Batch Dosing:
                  </span>
                  <div className="space-y-1 text-xs">
                    {useSuperplasticizer && (
                      <div className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>• Superplasticizer (PCE):</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {q(mixResults.admixtures.superplasticizerKg)} kg (≈{" "}
                          {batchScale === "bag"
                            ? `${mixResults.siteBuckets.admixMl} ml`
                            : `${q(mixResults.admixtures.superplasticizerL)} L`}
                          )
                        </span>
                      </div>
                    )}
                    {useRetarder && (
                      <div className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>• Retarder:</span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {q(mixResults.admixtures.retarderKg)} kg
                        </span>
                      </div>
                    )}
                    {useAccelerator && (
                      <div className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>• Accelerator:</span>
                        <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                          {q(mixResults.admixtures.acceleratorKg)} kg
                        </span>
                      </div>
                    )}
                    {useWaterproofer && (
                      <div className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>• Waterproofing Agent:</span>
                        <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                          {q(mixResults.admixtures.waterprooferKg)} kg
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* QA/QC Guardrails Notice */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                QA/QC Durability Check (ACI 318 / BS 8500)
              </div>
              <ul className="space-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Total Binder Content:{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {mixResults.totalBinderContent} kg/m³
                  </strong>{" "}
                  (Safe: ≥ 320 kg/m³ for reinforced concrete)
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Water-Binder Ratio:{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {effectiveWc.toFixed(2)}
                  </strong>{" "}
                  ({waterHealthIndicator.label})
                </li>
                {useSuperplasticizer && (
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    PCE Admixture saved{" "}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {mixResults.waterReductionKg} L
                    </strong>{" "}
                    of water per m³, locking in compressive strength without honeycombs.
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
