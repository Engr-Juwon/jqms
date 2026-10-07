import {
  BBSItem,
  CuttingPattern,
  CuttingPatternCut,
  BarCuttingSummary,
  DiameterCuttingBreakdown,
} from "@/types";
import { getRebarUnitWeight } from "./bbsParser";

export interface OptimizerOptions {
  stockLengthM?: number; // default 12.0
  reusableThresholdM?: number; // default 1.5m (offcuts >= 1.5m are treated as salvageable stock)
  contractualScrapLimit?: number; // default 3.5%
}

export interface OptimizationResult {
  patterns: CuttingPattern[];
  summary: BarCuttingSummary;
  totalPieces: number;
}

/**
 * 1D Rebar Cutting Stock Optimizer (Bin Packing Heuristic with Cut Consolidation)
 * Pack required cuts into minimum standard stock bars (12.0m) while minimizing scrap.
 *
 * CRITICAL ENGINEERING PRINCIPLE:
 * Steel rebar is stocked, ordered, and fabricated strictly PER DIAMETER and GRADE.
 * Cuts of different diameters (e.g., T12 vs T16) can NEVER be cut from the same stock bar.
 * This optimizer partitions BBS items by diameter first, running an independent 12m
 * bin-packing optimization for each bar diameter.
 */
export function optimizeBarCutting(
  items: BBSItem[],
  options: OptimizerOptions = {},
): OptimizationResult {
  const stockLengthM = options.stockLengthM || 12.0;
  const reusableThresholdM = options.reusableThresholdM || 1.5;
  const contractualScrapLimit = options.contractualScrapLimit ?? 3.5;

  if (items.length === 0) {
    return {
      patterns: [],
      summary: {
        totalBarsRequired: 0,
        totalStockBarsUsed: 0,
        totalCutWeightKg: 0,
        totalStockWeightKg: 0,
        totalScrapWeightKg: 0,
        totalReusableOffcutWeightKg: 0,
        scrapPercentage: 0,
        contractualScrapLimit,
        isWithinLimit: true,
        diameterBreakdown: {},
      },
      totalPieces: 0,
    };
  }

  // 1. Group items strictly by bar diameter
  const itemsByDiameter = new Map<number, BBSItem[]>();
  for (const item of items) {
    const dia = item.diameter || 12;
    if (!itemsByDiameter.has(dia)) {
      itemsByDiameter.set(dia, []);
    }
    itemsByDiameter.get(dia)!.push(item);
  }

  const allPatterns: CuttingPattern[] = [];
  const diameterBreakdown: Record<number, DiameterCuttingBreakdown> = {};

  let aggregateCutsRequired = 0;
  let aggregateStockBarsUsed = 0;
  let aggregateCutWeightKg = 0;
  let aggregateStockWeightKg = 0;
  let aggregateScrapWeightKg = 0;
  let aggregateReusableOffcutWeightKg = 0;

  // Sort diameters ascending (e.g. 10, 12, 16, 20, 25, 32)
  const sortedDiameters = Array.from(itemsByDiameter.keys()).sort(
    (a, b) => a - b,
  );

  for (const dia of sortedDiameters) {
    const diaItems = itemsByDiameter.get(dia)!;
    const unitWeight = getRebarUnitWeight(dia);
    const diaGrade = diaItems[0]?.steelGrade || "Grade 500B";
    const gradePrefix = diaGrade.toUpperCase().includes("T") ? "T" : "Y";

    // Expand all BBS items in this diameter group into individual pieces
    interface Piece {
      bbsItemId: string;
      barMark: string;
      member: string;
      cutLengthM: number;
    }

    const pieces: Piece[] = [];
    for (const item of diaItems) {
      for (let i = 0; i < item.totalBars; i++) {
        const length = Math.min(item.cutLengthM, stockLengthM);
        pieces.push({
          bbsItemId: item.id,
          barMark: item.barMark,
          member: item.member,
          cutLengthM: length,
        });
      }
    }

    // Sort pieces descending by cut length (Best-Fit Decreasing)
    pieces.sort((a, b) => b.cutLengthM - a.cutLengthM);

    interface StockBarBin {
      cuts: CuttingPatternCut[];
      usedLength: number;
      remainingLength: number;
    }

    const bins: StockBarBin[] = [];

    for (const piece of pieces) {
      let bestBinIndex = -1;
      let minRemaining = Infinity;

      for (let i = 0; i < bins.length; i++) {
        const remaining = bins[i].remainingLength;
        if (remaining >= piece.cutLengthM - 0.0001) {
          const remainingAfter = remaining - piece.cutLengthM;
          if (remainingAfter < minRemaining) {
            minRemaining = remainingAfter;
            bestBinIndex = i;
          }
        }
      }

      if (bestBinIndex !== -1) {
        bins[bestBinIndex].cuts.push({
          bbsItemId: piece.bbsItemId,
          barMark: piece.barMark,
          member: piece.member,
          cutLengthM: piece.cutLengthM,
          diameter: dia,
          steelGrade: diaGrade,
        });
        bins[bestBinIndex].usedLength = Number(
          (bins[bestBinIndex].usedLength + piece.cutLengthM).toFixed(3),
        );
        bins[bestBinIndex].remainingLength = Number(
          (bins[bestBinIndex].remainingLength - piece.cutLengthM).toFixed(3),
        );
      } else {
        // Open a new 12.0m commercial stock bar of this diameter
        const remaining = Number((stockLengthM - piece.cutLengthM).toFixed(3));
        bins.push({
          cuts: [
            {
              bbsItemId: piece.bbsItemId,
              barMark: piece.barMark,
              member: piece.member,
              cutLengthM: piece.cutLengthM,
              diameter: dia,
              steelGrade: diaGrade,
            },
          ],
          usedLength: piece.cutLengthM,
          remainingLength: remaining,
        });
      }
    }

    // Consolidate identical bins into cutting patterns for this diameter
    const patternMap = new Map<
      string,
      {
        sampleBin: StockBarBin;
        quantity: number;
      }
    >();

    for (const bin of bins) {
      bin.cuts.sort((a, b) => b.cutLengthM - a.cutLengthM);
      const signature = bin.cuts
        .map((c) => `${c.barMark}:${c.cutLengthM.toFixed(3)}`)
        .join("|");

      if (patternMap.has(signature)) {
        patternMap.get(signature)!.quantity += 1;
      } else {
        patternMap.set(signature, {
          sampleBin: bin,
          quantity: 1,
        });
      }
    }

    let diaPatternIdx = 1;
    let diaTotalCutLengthM = 0;
    let diaTotalStockLengthM = 0;
    let diaTotalScrapLengthM = 0;
    let diaTotalReusableLengthM = 0;

    for (const [, { sampleBin, quantity }] of patternMap.entries()) {
      const totalCutLength = sampleBin.usedLength;
      const offcutLength = sampleBin.remainingLength;
      const isReusable = offcutLength >= reusableThresholdM;
      const wastePct = Number(((offcutLength / stockLengthM) * 100).toFixed(2));

      allPatterns.push({
        patternId: `CP-${gradePrefix}${dia}-${String(diaPatternIdx).padStart(2, "0")}`,
        diameter: dia,
        steelGrade: diaGrade,
        stockLengthM,
        cuts: sampleBin.cuts,
        totalCutLengthM: totalCutLength,
        offcutLengthM: offcutLength,
        isReusableOffcut: isReusable,
        wastePercentage: wastePct,
        stockBarQuantity: quantity,
      });

      diaTotalCutLengthM += totalCutLength * quantity;
      diaTotalStockLengthM += stockLengthM * quantity;

      if (isReusable) {
        diaTotalReusableLengthM += offcutLength * quantity;
      } else {
        diaTotalScrapLengthM += offcutLength * quantity;
      }

      diaPatternIdx++;
    }

    const diaStockBarsUsed = bins.length;
    const diaCutWeightKg = Number((diaTotalCutLengthM * unitWeight).toFixed(2));
    const diaStockWeightKg = Number(
      (diaTotalStockLengthM * unitWeight).toFixed(2),
    );
    const diaScrapWeightKg = Number(
      (diaTotalScrapLengthM * unitWeight).toFixed(2),
    );
    const diaReusableWeightKg = Number(
      (diaTotalReusableLengthM * unitWeight).toFixed(2),
    );

    const diaScrapPct =
      diaStockWeightKg > 0
        ? Number(((diaScrapWeightKg / diaStockWeightKg) * 100).toFixed(2))
        : 0;

    diameterBreakdown[dia] = {
      diameter: dia,
      steelGrade: diaGrade,
      totalCutsRequired: pieces.length,
      totalStockBarsUsed: diaStockBarsUsed,
      totalCutWeightKg: diaCutWeightKg,
      totalStockWeightKg: diaStockWeightKg,
      totalScrapWeightKg: diaScrapWeightKg,
      totalReusableOffcutWeightKg: diaReusableWeightKg,
      scrapPercentage: diaScrapPct,
      isWithinLimit: diaScrapPct <= contractualScrapLimit,
    };

    aggregateCutsRequired += pieces.length;
    aggregateStockBarsUsed += diaStockBarsUsed;
    aggregateCutWeightKg += diaCutWeightKg;
    aggregateStockWeightKg += diaStockWeightKg;
    aggregateScrapWeightKg += diaScrapWeightKg;
    aggregateReusableOffcutWeightKg += diaReusableWeightKg;
  }

  const overallScrapPercentage =
    aggregateStockWeightKg > 0
      ? Number(
          ((aggregateScrapWeightKg / aggregateStockWeightKg) * 100).toFixed(2),
        )
      : 0;

  const isWithinLimit = overallScrapPercentage <= contractualScrapLimit;

  return {
    patterns: allPatterns,
    summary: {
      totalBarsRequired: aggregateCutsRequired,
      totalStockBarsUsed: aggregateStockBarsUsed,
      totalCutWeightKg: Number(aggregateCutWeightKg.toFixed(2)),
      totalStockWeightKg: Number(aggregateStockWeightKg.toFixed(2)),
      totalScrapWeightKg: Number(aggregateScrapWeightKg.toFixed(2)),
      totalReusableOffcutWeightKg: Number(
        aggregateReusableOffcutWeightKg.toFixed(2),
      ),
      scrapPercentage: overallScrapPercentage,
      contractualScrapLimit,
      isWithinLimit,
      diameterBreakdown,
    },
    totalPieces: aggregateCutsRequired,
  };
}
