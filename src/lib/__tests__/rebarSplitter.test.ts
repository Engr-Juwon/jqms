import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  splitRebarRun,
  splitRebarRunM,
  verifyRebarSplitInvariant,
  splitBBSItem,
} from "../rebarSplitter.ts";
import type { BBSItem } from "../../types/index.ts";

describe("splitRebarRun - Bar Bending Schedule Cut Length Calculation Engine", () => {
  it("TestCase 1: L_total = 8,000 mm (No split) - Base Case", () => {
    const totalLengthMm = 8000;
    const barSizeMm = 16;
    const barMark = "20";

    const segments = splitRebarRun(barMark, totalLengthMm, barSizeMm);

    // 1. Should return a single segment
    assert.equal(segments.length, 1);

    // 2. Original Bar Mark without prime suffix
    assert.equal(segments[0].barMark, "20");

    // 3. Cut length equals L_total
    assert.equal(segments[0].cutLengthMm, 8000);
    assert.equal(segments[0].cutLength, 8000);
    assert.equal(segments[0].cutLengthM, 8.0);
    assert.equal(segments[0].segmentIndex, 0);
    assert.equal(segments[0].isStockLength, false);

    // 4. Invariant check: Sum(Cut Lengths) - ((Number of Segments - 1) * L_lap) === L_total
    const inv = verifyRebarSplitInvariant(segments, totalLengthMm, barSizeMm);
    assert.equal(inv.isValid, true);
    assert.equal(inv.sumCutLengthsMm, 8000);
    assert.equal(inv.totalLapLossMm, 0);
    assert.equal(inv.effectiveTotalLengthMm, 8000);
  });

  it("TestCase 2: L_total = 20,000 mm, Y16 (Splits into '20': 12,000mm and '20'': 8,800mm)", () => {
    const totalLengthMm = 20000;
    const barSizeMm = 16;
    const barMark = "20";

    // Standard stock = 12,000 mm; Lap length = 50 * 16 = 800 mm.
    const segments = splitRebarRun(barMark, totalLengthMm, barSizeMm);

    // 1. Expected 2 segments
    assert.equal(segments.length, 2);

    // 2. Segment 1: Base Bar Mark "20", full 12,000 mm stock
    assert.equal(segments[0].barMark, "20");
    assert.equal(segments[0].cutLengthMm, 12000);
    assert.equal(segments[0].cutLength, 12000);
    assert.equal(segments[0].cutLengthM, 12.0);
    assert.equal(segments[0].segmentIndex, 0);
    assert.equal(segments[0].lapLengthMm, 800);
    assert.equal(segments[0].isStockLength, true);

    // 3. Segment 2: Bar Mark "20'", remaining clear run (8,000mm) + lap (800mm) = 8,800 mm
    assert.equal(segments[1].barMark, "20'");
    assert.equal(segments[1].cutLengthMm, 8800);
    assert.equal(segments[1].cutLength, 8800);
    assert.equal(segments[1].cutLengthM, 8.8);
    assert.equal(segments[1].segmentIndex, 1);
    assert.equal(segments[1].lapLengthMm, 800);
    assert.equal(segments[1].isStockLength, false);

    // 4. Invariant check
    // Sum(Cut Lengths) = 12,000 + 8,800 = 20,800 mm.
    // Lap loss = (2 - 1) * 800 = 800 mm.
    // Effective total = 20,800 - 800 = 20,000 mm === L_total.
    const inv = verifyRebarSplitInvariant(segments, totalLengthMm, barSizeMm);
    assert.equal(inv.isValid, true);
    assert.equal(inv.sumCutLengthsMm, 20800);
    assert.equal(inv.numberOfSegments, 2);
    assert.equal(inv.lapLengthMm, 800);
    assert.equal(inv.totalLapLossMm, 800);
    assert.equal(inv.effectiveTotalLengthMm, 20000);

    // Also verify accepting string format "Y16"
    const segmentsFromString = splitRebarRun(barMark, totalLengthMm, "Y16");
    assert.deepEqual(segmentsFromString, segments);
  });

  it("TestCase 3: L_total = 30,000 mm, Y20 (Splits across 3+ segments with correct prime notation)", () => {
    const totalLengthMm = 30000;
    const barSizeMm = 20;
    const barMark = "20";

    // Standard stock = 12,000 mm; Lap length = 50 * 20 = 1,000 mm.
    // L_effective = 12,000 - 1,000 = 11,000 mm.
    // Segment 1 ("20"): 12,000 mm (provides 11,000 mm clear run, 18,000 mm remaining clear run)
    // Segment 2 ("20'"): 12,000 mm (provides 11,000 mm clear run, 7,000 mm remaining clear run)
    // Segment 3 ("20''"): 7,000 mm + 1,000 mm lap = 8,000 mm
    const segments = splitRebarRun(barMark, totalLengthMm, barSizeMm);

    // 1. Expected 3 segments
    assert.equal(segments.length, 3);

    // 2. Segment 0 (Index 0): "20", 12,000 mm
    assert.equal(segments[0].barMark, "20");
    assert.equal(segments[0].cutLengthMm, 12000);
    assert.equal(segments[0].segmentIndex, 0);
    assert.equal(segments[0].lapLengthMm, 1000);
    assert.equal(segments[0].isStockLength, true);

    // 3. Segment 1 (Index 1): "20'", 12,000 mm
    assert.equal(segments[1].barMark, "20'");
    assert.equal(segments[1].cutLengthMm, 12000);
    assert.equal(segments[1].segmentIndex, 1);
    assert.equal(segments[1].lapLengthMm, 1000);
    assert.equal(segments[1].isStockLength, true);

    // 4. Segment 2 (Index 2): "20''", 8,000 mm
    assert.equal(segments[2].barMark, "20''");
    assert.equal(segments[2].cutLengthMm, 8000);
    assert.equal(segments[2].segmentIndex, 2);
    assert.equal(segments[2].lapLengthMm, 1000);
    assert.equal(segments[2].isStockLength, false);

    // 5. Invariant check:
    // Sum = 12,000 + 12,000 + 8,000 = 32,000 mm.
    // Total laps = (3 - 1) * 1,000 = 2,000 mm.
    // 32,000 - 2,000 = 30,000 mm === L_total!
    const inv = verifyRebarSplitInvariant(segments, totalLengthMm, barSizeMm);
    assert.equal(inv.isValid, true);
    assert.equal(inv.sumCutLengthsMm, 32000);
    assert.equal(inv.numberOfSegments, 3);
    assert.equal(inv.totalLapLossMm, 2000);
    assert.equal(inv.effectiveTotalLengthMm, 30000);
  });

  it("Boundary Case: Exactly 12,000 mm (Stock length boundary)", () => {
    const segments = splitRebarRun("01", 12000, 16);
    assert.equal(segments.length, 1);
    assert.equal(segments[0].barMark, "01");
    assert.equal(segments[0].cutLengthMm, 12000);
    assert.equal(segments[0].isStockLength, true);

    const inv = verifyRebarSplitInvariant(segments, 12000, 16);
    assert.equal(inv.isValid, true);
  });

  it("Boundary Case: Exactly 23,000 mm with Y20 (Exact 2 full stock bars with overlap)", () => {
    // Lap = 1,000 mm; 2 * 12,000 - 1,000 = 23,000 mm
    const segments = splitRebarRun("B1", 23000, 20);
    assert.equal(segments.length, 2);
    assert.equal(segments[0].barMark, "B1");
    assert.equal(segments[0].cutLengthMm, 12000);
    assert.equal(segments[1].barMark, "B1'");
    assert.equal(segments[1].cutLengthMm, 12000);

    const inv = verifyRebarSplitInvariant(segments, 23000, 20);
    assert.equal(inv.isValid, true);
    assert.equal(inv.sumCutLengthsMm, 24000);
    assert.equal(inv.effectiveTotalLengthMm, 23000);
  });

  it("Arbitrary Long Run: 50,000 mm (50m) with Y25", () => {
    // d = 25 mm -> Lap = 50 * 25 = 1,250 mm.
    // Stock = 12,000 mm.
    // L_effective = 12,000 - 1,250 = 10,750 mm.
    // Segments: 5 total (1 base + 3 intermediate + 1 final)
    const segments = splitRebarRun("COL-01", 50000, 25);
    assert.equal(segments.length, 5);
    assert.equal(segments[0].barMark, "COL-01");
    assert.equal(segments[1].barMark, "COL-01'");
    assert.equal(segments[2].barMark, "COL-01''");
    assert.equal(segments[3].barMark, "COL-01'''");
    assert.equal(segments[4].barMark, "COL-01''''");

    // All cuts <= 12,000 mm
    for (const seg of segments) {
      assert.ok(seg.cutLengthMm <= 12000);
      assert.ok(seg.cutLengthMm > 0);
    }

    // Invariant check:
    const inv = verifyRebarSplitInvariant(segments, 50000, 25);
    assert.equal(inv.isValid, true);
    assert.equal(inv.effectiveTotalLengthMm, 50000);
  });

  it("Arbitrary Long Run: 100,000 mm (100m) with Y32", () => {
    const segments = splitRebarRunM("RAFT-X", 100.0, 32);
    // Invariant holds for 100m raft rebar
    const inv = verifyRebarSplitInvariant(segments, 100000, 32);
    assert.equal(inv.isValid, true);
    assert.equal(inv.effectiveTotalLengthMm, 100000);
  });

  it("BBS Pipeline Integration: splitBBSItem decomposes a BBSItem into prime-notated items", () => {
    const longBBSItem: BBSItem = {
      id: "item-long-1",
      member: "Raft Foundation Slab",
      barMark: "20",
      diameter: 16,
      noOfMembers: 1,
      barsPerMember: 10,
      totalBars: 10,
      cutLengthM: 20.0, // 20 meters
      totalLengthM: 200.0,
      unitWeightKgM: 1.578,
      totalWeightKg: 315.6,
      steelGrade: "Grade 500B",
    };

    const splitItems = splitBBSItem(longBBSItem);
    assert.equal(splitItems.length, 2);

    // Segment 1
    assert.equal(splitItems[0].barMark, "20");
    assert.equal(splitItems[0].cutLengthM, 12.0);
    assert.equal(splitItems[0].totalLengthM, 120.0);
    assert.equal(splitItems[0].totalWeightKg, 189.36); // 120 * 1.578

    // Segment 2
    assert.equal(splitItems[1].barMark, "20'");
    assert.equal(splitItems[1].cutLengthM, 8.8);
    assert.equal(splitItems[1].totalLengthM, 88.0);
    assert.equal(splitItems[1].totalWeightKg, 138.86); // 88 * 1.578
  });
});
