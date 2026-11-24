import type { BBSItem } from "@/types";

/**
 * Standard Stock Length: 12,000 mm (12.0 meters) per standard commercial rebar stock.
 */
export const DEFAULT_STOCK_LENGTH_MM = 12000;

/**
 * Standard Lap Multiplier: 50 * d (where d is bar diameter in mm) per BS 8666 / Eurocode 2.
 */
export const DEFAULT_LAP_MULTIPLIER = 50;

/**
 * Resolves raw bar diameter string or number into numeric millimeters (e.g., "Y16" -> 16, "T20" -> 20).
 */
export function parseDiameter(raw: string | number): number {
  if (typeof raw === "number") return raw;
  if (!raw) return 16;
  const clean = String(raw).trim().toUpperCase();
  const match = clean.match(/(\d+)/);
  if (match) {
    const d = parseInt(match[1], 10);
    return isNaN(d) || d <= 0 ? 16 : d;
  }
  return 16;
}

export interface RebarSegment {
  /** The Bar Mark identifier, using prime notation for subsequent splits (e.g., "20", "20'", "20''") */
  barMark: string;
  /** Cut length of this individual stock segment in millimeters */
  cutLengthMm: number;
  /** Cut length alias in millimeters */
  cutLength: number;
  /** Cut length of this segment in meters (e.g., 12.000, 8.800) */
  cutLengthM: number;
  /** 0-based index of this segment in the continuous run sequence */
  segmentIndex: number;
  /** Structural overlap (lap) length in millimeters for this bar diameter */
  lapLengthMm: number;
  /** True if this cut length equals full stock length (12,000 mm) */
  isStockLength: boolean;
}

export interface SplitRebarOptions {
  /** Commercial stock length in mm (default: 12,000 mm) */
  stockLengthMm?: number;
  /** Lap multiplier factor (default: 50, resulting in 50 * d) */
  lapMultiplier?: number;
}

export interface RebarSplitInvariantResult {
  isValid: boolean;
  sumCutLengthsMm: number;
  lapLengthMm: number;
  numberOfSegments: number;
  totalLapLossMm: number;
  effectiveTotalLengthMm: number;
  expectedTotalLengthMm: number;
  differenceMm: number;
}

/**
 * Splits an arbitrarily long rebar run length (L_total) into standard stock segments
 * of maximum 12,000 mm with structural overlaps (laps).
 *
 * CALCULATION RULES:
 * 1. Stock Parameters:
 *    - Standard Stock Length (L_stock) = 12,000 mm.
 *    - Lap Length (L_lap) = 50 * d (where d is the bar diameter in mm).
 *    - Effective Stock Coverage per full bar (L_effective) = L_stock - L_lap.
 *
 * 2. Segment Breakdown Logic:
 *    - Base Case (L_total <= 12,000 mm):
 *      * Single segment with original Bar Mark (e.g. "20"), cut length = L_total.
 *    - Multi-segment Case (L_total > 12,000 mm):
 *      * Segment 1 (Base Bar Mark, e.g. "20"): Cut length = 12,000 mm.
 *      * Intermediate Full Stock Segments ("20'", "20''", ...):
 *        While remaining clear run > (12,000 - L_lap), generate full 12,000 mm stock segments.
 *      * Final Segment ("20'" with final prime count):
 *        Cut length = (Remaining Clear Run) + L_lap.
 *
 * 3. Naming Convention:
 *    - Index 0: Original Bar Mark (no prime, e.g. "20")
 *    - Index 1: Bar Mark + single prime ("20'")
 *    - Index 2: Bar Mark + double prime ("20''")
 *    - Index N: Bar Mark + N single quote characters (').
 *
 * INVARIANT:
 * Sum(Cut Lengths) - ((Number of Segments - 1) * L_lap) === L_total
 *
 * @param barMark - Base Bar Mark string (e.g. "20", "01", "B-01")
 * @param totalLengthMm - Arbitrary continuous run length in mm (e.g. 8000, 20000, 30000, 100000)
 * @param barSizeMm - Bar diameter in mm or notation (e.g. 16, 20, "Y16", "T20")
 * @param options - Custom stock length (default 12,000mm) or lap multiplier (default 50)
 */
export function splitRebarRun(
  barMark: string,
  totalLengthMm: number,
  barSizeMm: number | string,
  options: SplitRebarOptions = {},
): RebarSegment[] {
  if (totalLengthMm <= 0) {
    return [];
  }

  const stockLengthMm = options.stockLengthMm ?? DEFAULT_STOCK_LENGTH_MM;
  const lapMultiplier = options.lapMultiplier ?? DEFAULT_LAP_MULTIPLIER;

  // Resolve bar diameter (handles numeric 16, 20 or strings "Y16", "T20")
  const d = typeof barSizeMm === "number" ? barSizeMm : parseDiameter(barSizeMm);
  const lapLengthMm = Math.round(lapMultiplier * d);
  const effectiveStockLengthMm = stockLengthMm - lapLengthMm;

  if (effectiveStockLengthMm <= 0) {
    throw new Error(
      `Invalid parameters: Lap length (${lapLengthMm}mm) exceeds or equals stock length (${stockLengthMm}mm).`,
    );
  }

  const baseMark = String(barMark || "").trim();

  // 1. Base Case: L_total <= 12,000 mm
  if (totalLengthMm <= stockLengthMm) {
    return [
      {
        barMark: baseMark,
        cutLengthMm: totalLengthMm,
        cutLength: totalLengthMm,
        cutLengthM: Number((totalLengthMm / 1000).toFixed(3)),
        segmentIndex: 0,
        lapLengthMm,
        isStockLength: totalLengthMm === stockLengthMm,
      },
    ];
  }

  // 2. Multi-segment Case: L_total > 12,000 mm
  const segments: RebarSegment[] = [];

  // Segment 1 (Base Bar Mark, Index 0): Cut length = 12,000 mm
  segments.push({
    barMark: baseMark,
    cutLengthMm: stockLengthMm,
    cutLength: stockLengthMm,
    cutLengthM: Number((stockLengthMm / 1000).toFixed(3)),
    segmentIndex: 0,
    lapLengthMm,
    isStockLength: true,
  });

  let remainingClearRun = totalLengthMm - stockLengthMm;
  let primeCount = 1;

  // Intermediate Full Stock Segments
  while (remainingClearRun > effectiveStockLengthMm) {
    const mark = `${baseMark}${"'".repeat(primeCount)}`;
    segments.push({
      barMark: mark,
      cutLengthMm: stockLengthMm,
      cutLength: stockLengthMm,
      cutLengthM: Number((stockLengthMm / 1000).toFixed(3)),
      segmentIndex: primeCount,
      lapLengthMm,
      isStockLength: true,
    });
    remainingClearRun -= effectiveStockLengthMm;
    primeCount++;
  }

  // Final Segment: Cut length = (Remaining Clear Run) + L_lap
  const finalCutLengthMm = remainingClearRun + lapLengthMm;
  const finalMark = `${baseMark}${"'".repeat(primeCount)}`;
  segments.push({
    barMark: finalMark,
    cutLengthMm: finalCutLengthMm,
    cutLength: finalCutLengthMm,
    cutLengthM: Number((finalCutLengthMm / 1000).toFixed(3)),
    segmentIndex: primeCount,
    lapLengthMm,
    isStockLength: finalCutLengthMm === stockLengthMm,
  });

  return segments;
}

/**
 * Convenience helper when working directly in meters (e.g. 20.0m, 30.0m).
 */
export function splitRebarRunM(
  barMark: string,
  totalLengthM: number,
  barSizeMm: number | string,
  options: SplitRebarOptions = {},
): RebarSegment[] {
  const totalLengthMm = Math.round(totalLengthM * 1000);
  return splitRebarRun(barMark, totalLengthMm, barSizeMm, options);
}

/**
 * Validates the structural overlapping invariant:
 * Sum(Cut Lengths) - ((Number of Segments - 1) * L_lap) === L_total
 */
export function verifyRebarSplitInvariant(
  segments: RebarSegment[],
  totalLengthMm: number,
  barSizeMm: number | string,
  options: SplitRebarOptions = {},
): RebarSplitInvariantResult {
  const lapMultiplier = options.lapMultiplier ?? DEFAULT_LAP_MULTIPLIER;
  const d = typeof barSizeMm === "number" ? barSizeMm : parseDiameter(barSizeMm);
  const lapLengthMm = Math.round(lapMultiplier * d);

  if (!segments || segments.length === 0) {
    return {
      isValid: totalLengthMm === 0,
      sumCutLengthsMm: 0,
      lapLengthMm,
      numberOfSegments: 0,
      totalLapLossMm: 0,
      effectiveTotalLengthMm: 0,
      expectedTotalLengthMm: totalLengthMm,
      differenceMm: totalLengthMm,
    };
  }

  const sumCutLengthsMm = segments.reduce((sum, seg) => sum + seg.cutLengthMm, 0);
  const numberOfSegments = segments.length;
  const totalLapLossMm = (numberOfSegments - 1) * lapLengthMm;
  const effectiveTotalLengthMm = sumCutLengthsMm - totalLapLossMm;
  const differenceMm = Math.abs(effectiveTotalLengthMm - totalLengthMm);
  const isValid = differenceMm < 0.001;

  return {
    isValid,
    sumCutLengthsMm,
    lapLengthMm,
    numberOfSegments,
    totalLapLossMm,
    effectiveTotalLengthMm,
    expectedTotalLengthMm: totalLengthMm,
    differenceMm,
  };
}

/**
 * Decomposes an existing BBSItem with a continuous run exceeding stock length
 * into individual BBSItem segments formatted with prime notation and updated weights.
 */
export function splitBBSItem(
  item: BBSItem,
  options: SplitRebarOptions = {},
): BBSItem[] {
  const stockLengthM = (options.stockLengthMm ?? DEFAULT_STOCK_LENGTH_MM) / 1000;
  if (item.cutLengthM <= stockLengthM) {
    return [item];
  }

  const totalLengthMm = Math.round(item.cutLengthM * 1000);
  const segments = splitRebarRun(
    item.barMark,
    totalLengthMm,
    item.diameter,
    options,
  );

  const unitWeight = item.unitWeightKgM || 0;

  return segments.map((seg, idx) => {
    const cutLengthM = seg.cutLengthM;
    const totalLengthM = Number((cutLengthM * item.totalBars).toFixed(3));
    const totalWeightKg = Number((totalLengthM * unitWeight).toFixed(2));

    return {
      ...item,
      id: idx === 0 ? item.id : `${item.id}-split-${idx}`,
      barMark: seg.barMark,
      cutLengthM,
      totalLengthM,
      totalWeightKg,
    };
  });
}
