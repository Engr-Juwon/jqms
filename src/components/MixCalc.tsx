import React, { useState, useMemo } from "react";
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

// Preset Mix Types
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

export const MixCalc: React.FC = () => {
  // Mode: guided (dummy-proof) vs advanced
  const [calcMode, setCalcMode] = useState<"guided" | "advanced">("guided");
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("slabs_beams");

  // Core Parameters
  const [grade, setGrade] = useState<ConcreteGrade>("M30");
  const [fck, setFck] = useState<number>(30); // MPa
  const [sd, setSd] = useState<number>(5.0); // Standard deviation
  const [maxAggSize, setMaxAggSize] = useState<10 | 20 | 40>(20);
  const [slump, setSlump] = useState<number>(110); // mm
  const [waterCementRatio, setWaterCementRatio] = useState<number>(0.42);
  const [airContent, setAirContent] = useState<number>(1.2); // %

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
  const [customBatchVolume, setCustomBatchVolume] = useState<number>(6.0); // m³ (e.g. 1 truck)

  // Quick Preset Loader
  const loadPreset = (key: PresetKey) => {
    setSelectedPreset(key);
    const p = PRESET_LIBRARY[key];
    setGrade(p.grade);
    const gradeNum = parseInt(p.grade.substring(1));
    setFck(gradeNum);
    setSd(gradeNum <= 25 ? 4.0 : gradeNum <= 50 ? 5.0 : 6.0);
    setSlump(p.slump);
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

    toast.success(`Loaded "${p.title}" mix recipe!`);
  };

  // Grade Change Handler
  const handleGradeChange = (g: ConcreteGrade) => {
    setSelectedPreset("custom");
    setGrade(g);
    const num = parseInt(g.substring(1));
    setFck(num);

    // Standard deviation as per IS 456 / ACI 211
    if (num <= 20) setSd(3.5);
    else if (num <= 25) setSd(4.0);
    else if (num <= 50) setSd(5.0);
    else setSd(6.0);

    // Suggested w/c ratio based on target strength
    if (num <= 20) setWaterCementRatio(0.52);
    else if (num <= 25) setWaterCementRatio(0.48);
    else if (num <= 30) setWaterCementRatio(0.42);
    else if (num <= 35) setWaterCementRatio(0.38);
    else if (num <= 45) setWaterCementRatio(0.35);
    else setWaterCementRatio(0.30);
  };

  // ==========================================
  // MATHEMATICAL MIX PROPORTIONING ENGINE
  // ==========================================
  const mixResults = useMemo(() => {
    // 1. Target Mean Compressive Strength f'cr = fck + 1.65 * s
    const targetMeanStrength = fck + 1.65 * sd;

    // 2. Base Water Estimation (for 50mm slump)
    const baseWater = maxAggSize === 10 ? 208 : maxAggSize === 20 ? 186 : 165;

    // Slump correction: +3% water for each 25mm increase above 50mm
    const slumpDiff = Math.max(0, slump - 50);
    const rawWater = baseWater + (slumpDiff / 25) * 0.03 * baseWater;

    // Chemical Admixture Water Reduction Credit
    let effectiveWaterReduction = 0;
    if (useSuperplasticizer && waterReductionPercent > 0) {
      effectiveWaterReduction = Math.min(32, waterReductionPercent);
    } else if (useWaterproofer && !useSuperplasticizer) {
      // Hydrophobic admixtures also offer mild 5% water reduction
      effectiveWaterReduction = 5;
    }

    const waterReductionKg = rawWater * (effectiveWaterReduction / 100);
    const netWaterContent = Math.round(rawWater - waterReductionKg);

    // 3. Total Binder / Cementitious Material Content
    // Total Binder = netWater / (w/b ratio)
    const totalBinderContent = Math.round(netWaterContent / waterCementRatio);

    // 4. SCM Apportioning (% by weight of total binder)
    const faPct = useFlyAsh ? Math.min(35, flyAshPercent) : 0;
    const sfPct = useSilicaFume ? Math.min(15, silicaFumePercent) : 0;
    const ggbsPct = useGGBS ? Math.min(65, ggbsPercent) : 0;

    const massFlyAsh = Math.round(totalBinderContent * (faPct / 100));
    const massSilicaFume = Math.round(totalBinderContent * (sfPct / 100));
    const massGGBS = Math.round(totalBinderContent * (ggbsPct / 100));

    const massCement = Math.max(
      150,
      totalBinderContent - (massFlyAsh + massSilicaFume + massGGBS)
    );

    // 5. Chemical Admixtures Quantities (kg and Liters)
    // Density approx 1.10 kg/L for liquid admixtures
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

    const totalAdmixKg =
      superplasticizerKg + retarderKg + acceleratorKg + waterprooferKg;
    const totalAdmixL =
      superplasticizerL + retarderL + acceleratorL + waterprooferL;

    // 6. Absolute Volume Method (m³) for 1.0 m³ Concrete
    const effectiveAir = useAirEntrainer ? Math.max(3.5, airContent) : airContent;
    const volAir = effectiveAir / 100;
    const volWater = netWaterContent / 1000;
    const volCement = massCement / (sgCement * 1000);
    const volFlyAsh = massFlyAsh > 0 ? massFlyAsh / (sgFlyAsh * 1000) : 0;
    const volSilicaFume = massSilicaFume > 0 ? massSilicaFume / (sgSilicaFume * 1000) : 0;
    const volGGBS = massGGBS > 0 ? massGGBS / (sgGGBS * 1000) : 0;
    const volAdmix = totalAdmixKg / (ADMIX_DENSITY * 1000);

    const volOccupied =
      volAir + volWater + volCement + volFlyAsh + volSilicaFume + volGGBS + volAdmix;
    const volAggregate = Math.max(0.60, 1.0 - volOccupied);

    // Coarse Aggregate Volume Fraction (based on agg size and sand zone)
    let caRatio = 0.62;
    if (maxAggSize === 10) {
      caRatio = zoneFA === "Zone I" ? 0.48 : zoneFA === "Zone II" ? 0.50 : 0.52;
    } else if (maxAggSize === 20) {
      caRatio = zoneFA === "Zone I" ? 0.60 : zoneFA === "Zone II" ? 0.62 : 0.64;
    } else {
      caRatio = zoneFA === "Zone I" ? 0.69 : zoneFA === "Zone II" ? 0.71 : 0.73;
    }

    // Adjustment for w/c ratio (IS 10262: +0.01 to CA for every -0.05 reduction from 0.50)
    const wcDiff = 0.50 - waterCementRatio;
    caRatio = Math.min(0.78, Math.max(0.45, caRatio + (wcDiff / 0.05) * 0.01));

    const volCA = volAggregate * caRatio;
    const volFA = volAggregate * (1 - caRatio);

    const massCA = Math.round(volCA * sgCA * 1000);
    const massFA = Math.round(volFA * sgFA * 1000);

    // Total Mix Mass
    const totalMixMass =
      massCement +
      massFlyAsh +
      massSilicaFume +
      massGGBS +
      netWaterContent +
      massFA +
      massCA +
      Math.round(totalAdmixKg);

    // 7. Proportions Normalized to 1 Part Total Binder
    const binderRatio = 1;
    const faRatio = +(massFA / totalBinderContent).toFixed(2);
    const caRatioVal = +(massCA / totalBinderContent).toFixed(2);
    const waterRatio = +(netWaterContent / totalBinderContent).toFixed(2);

    // 8. Moisture Correction (Site Adjustment for Wet Aggregates)
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

    // 9. Multiplier for Batch Scale
    let scaleMultiplier = 1.0;
    if (batchScale === "bag") {
      // 1 bag = 50 kg cement
      scaleMultiplier = 50 / massCement;
    } else if (batchScale === "custom") {
      scaleMultiplier = Math.max(0.01, customBatchVolume);
    }

    // Green Carbon Savings Estimate
    // 1 ton OPC = ~0.85 t CO2; Fly Ash/GGBS = ~0.05 t CO2
    const scmWeight = massFlyAsh + massSilicaFume + massGGBS;
    const carbonReductionPct = totalBinderContent > 0
      ? Math.round((scmWeight / totalBinderContent) * 90)
      : 0;

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
        binderRatio,
        faRatio,
        caRatioVal,
        waterRatio,
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
    };
  }, [
    fck,
    sd,
    maxAggSize,
    slump,
    waterCementRatio,
    airContent,
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

  // Scaled Quantities Helper
  const q = (baseQty: number) => {
    return +(baseQty * mixResults.scaleMultiplier).toFixed(
      batchScale === "bag" ? 1 : baseQty < 10 ? 2 : 0
    );
  };

  // Copy Recipe Text
  const copyRecipeToClipboard = () => {
    const text = `
=== JQMS CONCRETE MIX DESIGN SUBMITTAL ===
Grade: ${grade} (${fck} MPa) | Target Strength f'cr: ${mixResults.targetMeanStrength.toFixed(1)} MPa
Slump: ${slump} mm | Max Aggregate: ${maxAggSize} mm | w/b Ratio: ${waterCementRatio}
Batching Basis: ${
      batchScale === "1m3"
        ? "1.0 m³ Standard Mix"
        : batchScale === "bag"
        ? "Per 50 kg Bag of Cement"
        : `${customBatchVolume} m³ Batch Volume`
    }

--- BINDER & MATERIALS ---
• OPC Cement: ${q(mixResults.massCement)} kg
${mixResults.massFlyAsh > 0 ? `• Fly Ash (PFA): ${q(mixResults.massFlyAsh)} kg (${flyAshPercent}%)\n` : ""}${
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
• Fine Aggregate (Sand): ${
      enableMoistureCorr
        ? `${q(mixResults.moistureCorrection.siteCorrectedFA)} kg (Wet)`
        : `${q(mixResults.massFA)} kg (SSD)`
    }
• Coarse Aggregate: ${
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
--- PROPORTIONS RATIO ---
Cementitious : Sand : Stone = 1 : ${mixResults.proportions.faRatio} : ${
      mixResults.proportions.caRatioVal
    } (w/b: ${mixResults.proportions.waterRatio})
Density: ~${mixResults.totalMixMass} kg/m³
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
      {/* Top Banner & Mode Toggle */}
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
                  IS 10262 / ACI 211
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Proportioning tool with mineral SCMs, chemical admixtures & site batching converter.
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
              Guided (Dummy-Proof)
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

        {/* 1-Click Guided Presets (Dummy-Proof Selection) */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-500" />
              Step 1: Pick What You Are Casting (Pre-Optimized Recipes)
            </span>
            <span className="text-[11px] text-slate-400">
              Click any card to auto-fill proven chemical & mix parameters
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
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                    {preset.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Parameters & Additives Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Interactive Parameters & Additives */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section A: Strength & Slump */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              Step 2: Concrete Grade & Slump (Flowability)
            </h3>

            {/* Grade Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Target Strength Grade
                </label>
                <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                  fck = {fck} N/mm² (Target f'cr = {mixResults.targetMeanStrength.toFixed(1)} MPa)
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {(
                  [
                    "M15",
                    "M20",
                    "M25",
                    "M30",
                    "M35",
                    "M40",
                    "M45",
                    "M50",
                    "M55",
                    "M60",
                  ] as ConcreteGrade[]
                ).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleGradeChange(g)}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      grade === g
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Slump & Aggregate Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Workability / Slump
                  </label>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {slump} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="200"
                  step="5"
                  value={slump}
                  onChange={(e) => {
                    setSelectedPreset("custom");
                    setSlump(Number(e.target.value));
                  }}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>25mm (Stiff)</span>
                  <span>100mm (Normal)</span>
                  <span>150mm (Pump)</span>
                  <span>200mm (Flow)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Max Stone Size (NMAS)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([10, 20, 40] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        setSelectedPreset("custom");
                        setMaxAggSize(sz);
                      }}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                        maxAggSize === sz
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {sz} mm
                    </button>
                  ))}
                </div>
                <span className="block text-[10px] text-slate-400 mt-1">
                  {maxAggSize === 10
                    ? "Thin slabs / dense rebar"
                    : maxAggSize === 20
                    ? "Standard building structural work"
                    : "Mass concrete / thick footings"}
                </span>
              </div>
            </div>

            {/* Water-Cement Ratio */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Water-to-Binder Ratio (w/b)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    (Lower = Stronger & More Durable)
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
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
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0.28 (Ultra-High)</span>
                <span>0.38 (Severe / Marine)</span>
                <span>0.45 (Standard)</span>
                <span>0.55 (Moderate)</span>
              </div>
            </div>
          </div>

          {/* Section B: Chemical Additives & Admixtures */}
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
              Modern concrete relies on chemical additives to enhance workability, reduce water,
              and prevent cracking. Select the additives you want to dose:
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
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Superplasticizer / HRWR (Polycarboxylate Ether - PCE)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Cuts water demand by {waterReductionPercent}% while enabling high slump
                        without segregation.
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
                        <span>Dosage (% of binder)</span>
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
                        <span>Water Reduction Credit</span>
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
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Delays initial setting time by 2 to 4 hours. Prevents cold joints during
                        traffic delays or high sun.
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
                      <span>Dosage by weight of binder</span>
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
                        Accelerating Admixture (Cold Weather / Fast Stripping)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Accelerates early hydration for rapid formwork stripping and precast casting
                        cycles.
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
                      <span>Dosage (% of binder)</span>
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
                        Integral Waterproofing Admixture (Crystalline / Hydrophobic)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Blocks microscopic pores and heals micro-cracks in water tanks, pools, and
                        basements.
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
                      <span>Dosage by weight of binder</span>
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

          {/* Section C: Supplementary Cementitious Materials (SCMs / Mineral Additives) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Step 4: Mineral Additives & Cement Substitution (SCMs)
              </h3>
              {mixResults.carbonReductionPct > 0 && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                  <Leaf className="w-3 h-3" />
                  -{mixResults.carbonReductionPct}% CO₂ Footprint
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Replacing ordinary cement with mineral pozzolans reduces heat of hydration, improves
              workability, prevents long-term cracking, and cuts carbon footprint.
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
                      Fly Ash (Class F / PFA)
                    </span>
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Smooths pumping, reduces thermal heat in thick pours.
                  </p>
                </div>
                {useFlyAsh && (
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                      <span>Replacement:</span>
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
                      Silica Fume (Micro-silica)
                    </span>
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Extreme early & 28d strength, ultra-dense chloride shield.
                  </p>
                </div>
                {useSilicaFume && (
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                      <span>Addition:</span>
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
                    High sulfate resistance, ideal for foundations & sea works.
                  </p>
                </div>
                {useGGBS && (
                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                      <span>Replacement:</span>
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

          {/* Section D: Moisture Correction (Site Reality Dummy-Proof Tool) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  Step 5: Wet Aggregate Moisture Correction
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Did it rain on the aggregate stockpile? Correct mixing water automatically.
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
                    <span>Sand Surface Moisture:</span>
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
                    Contributes +{mixResults.moistureCorrection.extraWaterFromSand} Liters of free
                    water per m³
                  </div>
                </div>

                <div className="bg-blue-50/60 dark:bg-blue-950/20 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/40">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Coarse Stone Moisture:</span>
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
                    Contributes +{mixResults.moistureCorrection.extraWaterFromStone} Liters of free
                    water per m³
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section E: Advanced Engineering Settings (Collapsible / Visible in Advanced Mode) */}
          {calcMode === "advanced" && (
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                Advanced Engineering Parameters (IS 10262 Fine-Tuning)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Standard Dev s (MPa)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={sd}
                    onChange={(e) => setSd(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Air Content (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={airContent}
                    onChange={(e) => setAirContent(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Cement SG
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={sgCement}
                    onChange={(e) => setSgCement(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Sand Zone
                  </label>
                  <select
                    value={zoneFA}
                    onChange={(e) => setZoneFA(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5"
                  >
                    <option value="Zone I">Zone I (Coarse)</option>
                    <option value="Zone II">Zone II (Medium)</option>
                    <option value="Zone III">Zone III (Fine)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Columns: Calculated Recipe & Batch Quantities Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/60 dark:from-indigo-950/40 dark:to-indigo-900/20 border border-indigo-200 dark:border-indigo-800/60 p-4 rounded-2xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                Target Mean Strength
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {mixResults.targetMeanStrength.toFixed(1)}{" "}
                <span className="text-xs font-normal text-slate-500">N/mm²</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                f'cr = {fck} + 1.65 × {sd}
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Proportion Ratio
              </span>
              <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1 truncate">
                1 : {mixResults.proportions.faRatio} : {mixResults.proportions.caRatioVal}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                w/b ratio: {waterCementRatio.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Main Batching Output Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Batch Quantities
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
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Select Batch Scale / Mixer Capacity:
              </label>
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
                  Custom Vol
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
                      : "Primary Binder"}
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
                      ? `Corrected for stockpile moisture (-${
                          mixResults.moistureCorrection.extraWaterFromSand +
                          mixResults.moistureCorrection.extraWaterFromStone
                        } L)`
                      : `Net W/B: ${waterCementRatio.toFixed(2)}`}
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
                          {q(mixResults.admixtures.superplasticizerL)} L)
                        </span>
                      </div>
                    )}
                    {useRetarder && (
                      <div className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>• Retarder:</span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {q(mixResults.admixtures.retarderKg)} kg (≈{" "}
                          {q(mixResults.admixtures.retarderL)} L)
                        </span>
                      </div>
                    )}
                    {useAccelerator && (
                      <div className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>• Accelerator:</span>
                        <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                          {q(mixResults.admixtures.acceleratorKg)} kg (≈{" "}
                          {q(mixResults.admixtures.acceleratorL)} L)
                        </span>
                      </div>
                    )}
                    {useWaterproofer && (
                      <div className="flex justify-between text-slate-700 dark:text-slate-300">
                        <span>• Waterproofing Agent:</span>
                        <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                          {q(mixResults.admixtures.waterprooferKg)} kg (≈{" "}
                          {q(mixResults.admixtures.waterprooferL)} L)
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
                QA/QC Compliance Check (ACI 318 / BS 8500)
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
                    {waterCementRatio.toFixed(2)}
                  </strong>{" "}
                  (Meets maximum 0.45 durability criteria)
                </li>
                {useSuperplasticizer && (
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    PCE Admixture saved{" "}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {mixResults.waterReductionKg} L
                    </strong>{" "}
                    of water per m³, maintaining slump while locking in high strength.
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
