import { StructuralElement, ProjectCostRates, Element5DCostBreakdown, Level5DCostSummary } from "@/types";
import { getOrCalculateVolume, getOrCalculateFormworkArea } from "./elementCalculations";

export const DEFAULT_PROJECT_COST_RATES: ProjectCostRates = {
  currencySymbol: "$",
  concreteRates: {
    C15: 95,
    C20: 105,
    C25: 120,
    C30: 135,
    C35: 155,
    C40: 175,
    C45: 195,
    C50: 220,
    "C28/35": 140,
    "C30/37": 145,
    "C32/40": 155,
    "C35/45": 165,
    "C40/50": 180,
  },
  defaultConcreteRate: 135,
  formworkRate: 24.5,
  rebarRatePerTonne: 1180,
  laborRatePerM3: 38,
  equipmentRatePerM3: 18,
};

/**
 * Standard structural engineering rebar density factors (kg/m³)
 */
export function estimateRebarDensityKgPerM3(elementType?: string): number {
  const t = (elementType || "").toUpperCase();
  if (t.includes("BEAM")) return 135;
  if (t.includes("COLUMN") || t.includes("PIER")) return 125;
  if (t.includes("SLAB")) return 90;
  if (t.includes("WALL")) return 100;
  if (t.includes("STAIR")) return 110;
  if (t.includes("FOOTING") || t.includes("PAD") || t.includes("RAFT") || t.includes("PILE")) return 95;
  return 110;
}

/**
 * Estimates rebar tonnage for an element (in metric tonnes)
 */
export function estimateRebarTonnage(el: Partial<StructuralElement>): number {
  const vol = getOrCalculateVolume(el);
  const density = estimateRebarDensityKgPerM3(el.elementType);
  const kg = vol * density;
  return parseFloat((kg / 1000).toFixed(3));
}

/**
 * Derives concrete unit price based on concreteGrade string (e.g. C35/45, C30)
 */
export function resolveConcreteRate(
  grade: string | undefined,
  rates: ProjectCostRates = DEFAULT_PROJECT_COST_RATES,
): number {
  if (!grade) return rates.defaultConcreteRate;
  const clean = grade.trim().toUpperCase();

  if (rates.concreteRates[clean]) {
    return rates.concreteRates[clean];
  }

  // Regex match Cxx
  const match = clean.match(/C\s*(\d+)/i);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num <= 15) return rates.concreteRates["C15"] || 95;
    if (num <= 20) return rates.concreteRates["C20"] || 105;
    if (num <= 25) return rates.concreteRates["C25"] || 120;
    if (num <= 30) return rates.concreteRates["C30"] || 135;
    if (num <= 35) return rates.concreteRates["C35"] || 155;
    if (num <= 40) return rates.concreteRates["C40"] || 175;
    if (num <= 45) return rates.concreteRates["C45"] || 195;
    return rates.concreteRates["C50"] || 220;
  }

  return rates.defaultConcreteRate;
}

/**
 * Calculates complete 5D Cost Breakdown for a single structural element
 */
export function calculateElement5DCost(
  el: StructuralElement,
  customRates?: Partial<ProjectCostRates>,
): Element5DCostBreakdown {
  const rates: ProjectCostRates = {
    ...DEFAULT_PROJECT_COST_RATES,
    ...(customRates || {}),
    concreteRates: {
      ...DEFAULT_PROJECT_COST_RATES.concreteRates,
      ...(customRates?.concreteRates || {}),
    },
  };

  const concreteVolume = getOrCalculateVolume(el);
  const concreteRate = resolveConcreteRate(el.concreteGrade, rates);
  const concreteCost = concreteVolume * concreteRate;

  const formworkArea = getOrCalculateFormworkArea(el);
  const formworkCost = formworkArea * rates.formworkRate;

  const rebarTonnage = estimateRebarTonnage(el);
  const rebarCost = rebarTonnage * rates.rebarRatePerTonne;

  const laborCost = concreteVolume * rates.laborRatePerM3;
  const equipmentCost = concreteVolume * rates.equipmentRatePerM3;

  const totalCost = concreteCost + formworkCost + rebarCost + laborCost + equipmentCost;

  return {
    concreteVolume: parseFloat(concreteVolume.toFixed(3)),
    concreteRate,
    concreteCost: parseFloat(concreteCost.toFixed(2)),
    formworkArea: parseFloat(formworkArea.toFixed(2)),
    formworkRate: rates.formworkRate,
    formworkCost: parseFloat(formworkCost.toFixed(2)),
    rebarTonnage,
    rebarRatePerTonne: rates.rebarRatePerTonne,
    rebarCost: parseFloat(rebarCost.toFixed(2)),
    laborRatePerM3: rates.laborRatePerM3,
    laborCost: parseFloat(laborCost.toFixed(2)),
    equipmentRatePerM3: rates.equipmentRatePerM3,
    equipmentCost: parseFloat(equipmentCost.toFixed(2)),
    totalCost: parseFloat(totalCost.toFixed(2)),
    currencySymbol: rates.currencySymbol,
  };
}

/**
 * Aggregates 5D financial summary across an array of structural elements (e.g. for a floor level or full project)
 */
export function calculateLevel5DCostSummary(
  elements: StructuralElement[],
  customRates?: Partial<ProjectCostRates>,
  levelId: string = "ALL",
  levelName: string = "All Levels",
): Level5DCostSummary {
  const rates: ProjectCostRates = {
    ...DEFAULT_PROJECT_COST_RATES,
    ...(customRates || {}),
  };

  let plannedVolume = 0;
  let plannedFormworkArea = 0;
  let plannedRebarTonnage = 0;

  let concreteCostTotal = 0;
  let formworkCostTotal = 0;
  let rebarCostTotal = 0;
  let laborCostTotal = 0;
  let equipmentCostTotal = 0;

  let plannedCostPV = 0;
  let approvedCostEV = 0;
  let inProgressCost = 0;

  elements.forEach((el) => {
    const cost = calculateElement5DCost(el, rates);

    plannedVolume += cost.concreteVolume;
    plannedFormworkArea += cost.formworkArea;
    plannedRebarTonnage += cost.rebarTonnage;

    concreteCostTotal += cost.concreteCost;
    formworkCostTotal += cost.formworkCost;
    rebarCostTotal += cost.rebarCost;
    laborCostTotal += cost.laborCost;
    equipmentCostTotal += cost.equipmentCost;

    plannedCostPV += cost.totalCost;

    if (el.status === "APPROVED") {
      approvedCostEV += cost.totalCost;
    } else if (
      el.status === "POURED" ||
      el.status === "READY_FOR_CASTING" ||
      el.status === "REBAR_INSPECTED" ||
      el.status === "FORMWORK_IN_PROGRESS" ||
      el.status === "REBAR_IN_PROGRESS"
    ) {
      inProgressCost += cost.totalCost;
    }
  });

  return {
    levelId,
    levelName,
    totalElementsCount: elements.length,
    plannedVolume: parseFloat(plannedVolume.toFixed(2)),
    plannedFormworkArea: parseFloat(plannedFormworkArea.toFixed(2)),
    plannedRebarTonnage: parseFloat(plannedRebarTonnage.toFixed(2)),
    plannedCostPV: parseFloat(plannedCostPV.toFixed(2)),
    approvedCostEV: parseFloat(approvedCostEV.toFixed(2)),
    inProgressCost: parseFloat(inProgressCost.toFixed(2)),
    currencySymbol: rates.currencySymbol,
    concreteCostTotal: parseFloat(concreteCostTotal.toFixed(2)),
    formworkCostTotal: parseFloat(formworkCostTotal.toFixed(2)),
    rebarCostTotal: parseFloat(rebarCostTotal.toFixed(2)),
    laborCostTotal: parseFloat(laborCostTotal.toFixed(2)),
    equipmentCostTotal: parseFloat(equipmentCostTotal.toFixed(2)),
  };
}

/**
 * Currency Formatter Utility
 */
export function format5DCurrency(
  val: number,
  currencySymbol: string = "$",
): string {
  return `${currencySymbol}${val.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
