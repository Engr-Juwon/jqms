import {
  StructuralElement,
  CarbonFactors,
  Element6DCarbonBreakdown,
  Level6DCarbonSummary,
  EcoRating,
} from "@/types";
import {
  getOrCalculateVolume,
  getOrCalculateFormworkArea,
} from "@/lib/elementCalculations";
import { estimateRebarTonnage } from "@/lib/costCalculations";

/* ─────────────────────────────────────────────────────────────────────────
   6D BIM EMBODIED CARBON & SUSTAINABILITY ENGINE
   Grounded in ICE (Inventory of Carbon and Energy) Database & RICS Standards
   ───────────────────────────────────────────────────────────────────────── */

export const DEFAULT_CARBON_FACTORS: CarbonFactors = {
  concreteGradeFactors: {
    "C15": 190,
    "C15/20": 190,
    "C20": 220,
    "C20/25": 220,
    "C25": 255,
    "C25/30": 255,
    "C30": 290,
    "C30/37": 290,
    "C35": 330,
    "C35/45": 330,
    "C40": 375,
    "C40/50": 375,
    "C45": 415,
    "C45/55": 415,
    "C50": 460,
    "C50/60": 460,
  },
  defaultConcreteFactor: 290, // kg CO2e / m3 (standard C30 mix)
  scmReplacementPct: 30, // 30% GGBS / Fly Ash clinker replacement
  rebarCarbonFactor: 1650, // kg CO2e / tonne of steel
  recycledSteelPct: 65, // 65% Recycled scrap in Electric Arc Furnace (EAF)
  formworkCarbonFactor: 7.5, // kg CO2e / m2 based on 10x plywood/steel formwork reuse cycle
  transportationFactor: 11.2, // kg CO2e / m3 for ~25km ready-mix truck transit
};

/**
 * Resolves baseline concrete carbon factor based on specified mix grade
 */
export function resolveConcreteCarbonFactor(
  grade?: string,
  factors: CarbonFactors = DEFAULT_CARBON_FACTORS
): number {
  if (!grade) return factors.defaultConcreteFactor;
  const cleanGrade = grade.toUpperCase().trim();

  if (factors.concreteGradeFactors[cleanGrade]) {
    return factors.concreteGradeFactors[cleanGrade];
  }

  for (const [key, factor] of Object.entries(factors.concreteGradeFactors)) {
    if (cleanGrade.includes(key) || key.includes(cleanGrade)) {
      return factor;
    }
  }

  return factors.defaultConcreteFactor;
}

/**
 * Calculates Eco Rating grade from Carbon Intensity (kg CO2e / m3)
 */
export function calculateEcoRating(intensityKgPerM3: number): EcoRating {
  if (intensityKgPerM3 <= 210) return "A+";
  if (intensityKgPerM3 <= 290) return "A";
  if (intensityKgPerM3 <= 370) return "B";
  if (intensityKgPerM3 <= 450) return "C";
  if (intensityKgPerM3 <= 530) return "D";
  return "E";
}

/**
 * Calculates full 6D Embodied Carbon footprint for an individual structural element
 */
export function calculateElement6DCarbon(
  element: Partial<StructuralElement>,
  factors: CarbonFactors = DEFAULT_CARBON_FACTORS
): Element6DCarbonBreakdown {
  const volumeM3 = getOrCalculateVolume(element);
  const formworkAreaM2 = getOrCalculateFormworkArea(element);
  const rebarTonne = estimateRebarTonnage(element);

  // 1. Concrete Carbon with SCM Clinker Offset
  const baselineConcreteFactor = resolveConcreteCarbonFactor(element.concreteGrade, factors);
  const scmFactor = Math.max(0, Math.min(0.8, (factors.scmReplacementPct || 0) / 100));
  // 1% SCM replaces ~0.85% of clinker emissions
  const effectiveConcreteFactor = baselineConcreteFactor * (1 - scmFactor * 0.85);
  const concreteCarbonKg = volumeM3 * effectiveConcreteFactor;
  const scmAvoidedCarbonKg = volumeM3 * (baselineConcreteFactor - effectiveConcreteFactor);

  // 2. Rebar Reinforcement Carbon with Recycled EAF content
  const recycledReduction = Math.max(0, Math.min(0.7, (factors.recycledSteelPct || 0) / 100 * 0.6));
  const effectiveRebarFactor = factors.rebarCarbonFactor * (1 - recycledReduction);
  const rebarCarbonKg = rebarTonne * effectiveRebarFactor;

  // 3. Formwork Shuttering & Propping Carbon
  const formworkCarbonKg = formworkAreaM2 * (factors.formworkCarbonFactor || 7.5);

  // 4. Transportation & Placement Logistics
  const transportCarbonKg = volumeM3 * (factors.transportationFactor || 11.2);

  // 5. Total Embodied Carbon
  const totalCarbonKg = concreteCarbonKg + rebarCarbonKg + formworkCarbonKg + transportCarbonKg;
  const totalCarbonTonne = totalCarbonKg / 1000;
  const carbonIntensityKgPerM3 = volumeM3 > 0 ? totalCarbonKg / volumeM3 : 0;
  const ecoRating = calculateEcoRating(carbonIntensityKgPerM3);

  return {
    concreteVolume: volumeM3,
    concreteFactor: effectiveConcreteFactor,
    concreteCarbonKg,
    formworkArea: formworkAreaM2,
    formworkCarbonKg,
    rebarTonnage: rebarTonne,
    rebarCarbonFactor: effectiveRebarFactor,
    rebarCarbonKg,
    transportCarbonKg,
    totalCarbonKg,
    totalCarbonTonne,
    carbonIntensityKgPerM3,
    scmAvoidedCarbonKg,
    ecoRating,
  };
}

/**
 * Aggregates 6D carbon emissions and green building rating across all elements on a level or project
 */
export function calculateLevel6DCarbonSummary(
  elements: StructuralElement[],
  levelId: string,
  levelName: string,
  factors: CarbonFactors = DEFAULT_CARBON_FACTORS
): Level6DCarbonSummary {
  let totalVolumeM3 = 0;
  let totalCarbonKg = 0;
  let concreteCarbonKg = 0;
  let rebarCarbonKg = 0;
  let formworkCarbonKg = 0;
  let transportCarbonKg = 0;
  let totalScmAvoidedKg = 0;

  elements.forEach((el) => {
    const carbon = calculateElement6DCarbon(el, factors);
    totalVolumeM3 += carbon.concreteVolume;
    totalCarbonKg += carbon.totalCarbonKg;
    concreteCarbonKg += carbon.concreteCarbonKg;
    rebarCarbonKg += carbon.rebarCarbonKg;
    formworkCarbonKg += carbon.formworkCarbonKg;
    transportCarbonKg += carbon.transportCarbonKg;
    totalScmAvoidedKg += carbon.scmAvoidedCarbonKg;
  });

  const averageIntensityKgPerM3 =
    totalVolumeM3 > 0 ? totalCarbonKg / totalVolumeM3 : 0;

  let greenBuildingTier: Level6DCarbonSummary["greenBuildingTier"] = "Standard (B)";
  if (averageIntensityKgPerM3 <= 220) {
    greenBuildingTier = "Net-Zero Ready (A+)";
  } else if (averageIntensityKgPerM3 <= 300) {
    greenBuildingTier = "Low Carbon (A)";
  } else if (averageIntensityKgPerM3 <= 390) {
    greenBuildingTier = "Standard (B)";
  } else if (averageIntensityKgPerM3 <= 480) {
    greenBuildingTier = "Moderate (C)";
  } else {
    greenBuildingTier = "High Impact (D)";
  }

  return {
    levelId,
    levelName,
    totalElementsCount: elements.length,
    totalVolumeM3,
    totalCarbonKg,
    totalCarbonTonne: totalCarbonKg / 1000,
    concreteCarbonTonne: concreteCarbonKg / 1000,
    rebarCarbonTonne: rebarCarbonKg / 1000,
    formworkCarbonTonne: formworkCarbonKg / 1000,
    transportCarbonTonne: transportCarbonKg / 1000,
    averageIntensityKgPerM3,
    totalScmAvoidedCarbonTonne: totalScmAvoidedKg / 1000,
    greenBuildingTier,
  };
}

/**
 * Format helpers for carbon values
 */
export function formatCarbonKg(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t CO₂e`;
  }
  return `${kg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg CO₂e`;
}

export function formatCarbonTonne(tonnes: number): string {
  return `${tonnes.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t CO₂e`;
}
