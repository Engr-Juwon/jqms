import { Gridline, StructuralElement } from "@/types";

export interface ParsedGridSpan {
  xStartLabel: string;
  xEndLabel: string;
  yStartLabel: string;
  yEndLabel: string;
  isArea: boolean; // Slab bay
  isLineX: boolean; // Beam/Wall along X
  isLineY: boolean; // Beam/Wall along Y
  isPoint: boolean; // Column/Footing at intersection
}

export interface GridAxisItem {
  id?: string;
  label: string;
  pos: number;
  offset: number;
  order: number;
  distanceToNext: number;
}

export interface GridSystemGeometry {
  xAxes: GridAxisItem[];
  yAxes: GridAxisItem[];
  xMap: Map<string, number>;
  yMap: Map<string, number>;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerOffsetX: number;
  centerOffsetY: number;
}

export interface ResolvedElementCoords {
  x1: number;
  x2: number;
  y1: number; // or z1 in 3D
  y2: number; // or z2 in 3D
  midX: number;
  midY: number;
  sizeX: number;
  sizeY: number;
  spanLength: number;
  angleRad: number; // Angle in radians from X-axis towards Y/Z-axis
  isArea: boolean;
  isSpan: boolean;
  isPoint: boolean;
  matched: boolean;
  xLabel: string;
  yLabel: string;
}

/**
 * Clean and normalize a grid label string (e.g., "01" -> "1", " 9' " -> "9'", "A " -> "A")
 */
export function normalizeGridLabel(label: string | undefined): string {
  if (!label) return "";
  return String(label)
    .trim()
    .toUpperCase()
    .replace(/^GRID\s*[:#]?\s*/i, "")
    .replace(/^AXIS\s*[:#]?\s*/i, "")
    .replace(/^BAY\s*[:#]?\s*/i, "")
    .trim();
}

/**
 * Safely lookup a grid coordinate by label with strict prioritization:
 * 1. Direct exact match (e.g. "B" matches "B", "B''" matches "B''")
 * 2. Case-insensitive exact match
 * 3. Leading-zero normalization ("01" -> "1" / "1" -> "01")
 * 4. Fallback: ONLY if the search query itself contains prime/tick marks that don't exist in project
 */
export function lookupGridCoord(
  label: string | undefined,
  map: Map<string, number>,
): number | undefined {
  if (!label) return undefined;
  const clean = normalizeGridLabel(label);
  if (!clean) return undefined;

  // 1. Direct exact match (NEVER match B to B'' or B' to B if exact exists)
  if (map.has(clean)) return map.get(clean);

  // 2. Case-insensitive exact key lookup
  for (const [key, val] of map.entries()) {
    if (key.toUpperCase().trim() === clean) return val;
  }

  // 3. Leading zero normalization ("01" -> "1", "1" -> "01") without altering letters or ticks
  const noZero = clean.replace(/^0+/, "");
  if (noZero && map.has(noZero)) return map.get(noZero);

  const padded = clean.padStart(2, "0");
  if (map.has(padded)) return map.get(padded);

  // 4. Fallback ONLY if query has tick/prime and wasn't found in project gridlines:
  // e.g. query is "9'" but project only has "9"
  const hasTick = /['"’`]/.test(clean);
  if (hasTick) {
    const noTick = clean.replace(/['"’`]/g, "");
    if (noTick && map.has(noTick)) return map.get(noTick);
  }

  return undefined;
}

/**
 * Checks if a token (single label or span range like "3-5" or "B-C" or "B''-C") matches a grid map.
 * Returns { startCoord, endCoord, isRange, label } or null if neither part matches.
 */
export function lookupGridSpan(
  token: string | undefined,
  map: Map<string, number>,
): {
  startCoord: number;
  endCoord: number;
  isRange: boolean;
  label: string;
} | null {
  if (!token) return null;
  const clean = normalizeGridLabel(token);
  if (!clean) return null;

  // Check if it's a range like "B-C", "B''-C", "3-5", "C-D", "3 to 5", "3..5"
  const rangeMatch = clean.match(
    /^([A-Z0-9'"`]+)\s*(?:[-_]|TO|\.\.)\s*([A-Z0-9'"`]+)$/i,
  );
  if (rangeMatch) {
    const startLbl = rangeMatch[1];
    const endLbl = rangeMatch[2];
    const startCoord = lookupGridCoord(startLbl, map);
    const endCoord = lookupGridCoord(endLbl, map);

    if (startCoord !== undefined && endCoord !== undefined) {
      return {
        startCoord,
        endCoord,
        isRange: true,
        label: `${startLbl}-${endLbl}`,
      };
    }
    if (startCoord !== undefined) {
      return {
        startCoord,
        endCoord: startCoord,
        isRange: false,
        label: startLbl,
      };
    }
    if (endCoord !== undefined) {
      return {
        startCoord: endCoord,
        endCoord,
        isRange: false,
        label: endLbl,
      };
    }
  }

  // Single label lookup
  const singleCoord = lookupGridCoord(clean, map);
  if (singleCoord !== undefined) {
    return {
      startCoord: singleCoord,
      endCoord: singleCoord,
      isRange: false,
      label: clean,
    };
  }

  return null;
}

/**
 * Bidirectional Coordinate Resolver:
 * Reliably maps any construction grid string (e.g. "3-5/C-D", "C-D/3-5", "3/C", "C/3", "F/8-10", "3-5/C", "C-3")
 * against the project's actual X and Y grid systems, regardless of whether X is Letters/Numbers and Y is Numbers/Letters.
 */
export function resolveElementGridCoords(
  rawGrid: string | undefined,
  elementName: string | undefined,
  xMap: Map<string, number>,
  yMap: Map<string, number>,
  xAxes: GridAxisItem[],
  yAxes: GridAxisItem[],
  scaleMultiplier: number = 1,
  fallbackIndex: number = 0,
  explicitGridX?: number,
  explicitGridZ?: number,
): ResolvedElementCoords {
  let str = normalizeGridLabel(rawGrid);

  // Extract from elementName if grid string is empty
  if (!str && elementName) {
    const match = elementName
      .toUpperCase()
      .match(
        /(?:GRID|COL|COLUMN|BEAM|SLAB|WALL|FOOTING|C|B|S|W)[-_ ]*([A-Z0-9/,\-.'’ ]+)/i,
      );
    if (match) str = normalizeGridLabel(match[1]);
  }

  let x1: number | undefined;
  let x2: number | undefined;
  let y1: number | undefined;
  let y2: number | undefined;
  let isArea = false;
  let isSpan = false;
  let isPoint = false;
  let matched = false;
  let xLabel = "";
  let yLabel = "";

  if (str) {
    // Split by major axis delimiters: '/', ',', ';', '|', or whitespace if both tokens exist
    let segA = "";
    let segB = "";

    if (str.includes("/")) {
      const parts = str.split("/");
      segA = parts[0]?.trim() || "";
      segB = parts[1]?.trim() || "";
    } else if (str.includes(",")) {
      const parts = str.split(",");
      segA = parts[0]?.trim() || "";
      segB = parts[1]?.trim() || "";
    } else if (str.includes(";") || str.includes("|")) {
      const parts = str.split(/[;|]/);
      segA = parts[0]?.trim() || "";
      segB = parts[1]?.trim() || "";
    } else {
      // Check composite patterns like "C-3", "3-C", "C3", "3C", "C-D 1-2", "1-2 C-D"
      const compMatch = str.match(/^([A-Z0-9'-]+)\s+([A-Z0-9'-]+)$/i);
      if (compMatch) {
        segA = compMatch[1];
        segB = compMatch[2];
      } else {
        // Point match like "C-3", "C3", "3-C", "3C"
        const pMatch1 = str.match(/^([A-Z]+)[-_.]*([0-9]+['"`]?)$/i);
        const pMatch2 = str.match(/^([0-9]+['"`]?)[-_.]*([A-Z]+)$/i);
        if (pMatch1) {
          segA = pMatch1[1];
          segB = pMatch1[2];
        } else if (pMatch2) {
          segA = pMatch2[1];
          segB = pMatch2[2];
        } else {
          segA = str;
        }
      }
    }

    if (segA && segB) {
      // Test hypothesis 1: segA is on X-axis, segB is on Y-axis
      const spanA_X = lookupGridSpan(segA, xMap);
      const spanB_Y = lookupGridSpan(segB, yMap);

      // Test hypothesis 2: segA is on Y-axis, segB is on X-axis
      const spanA_Y = lookupGridSpan(segA, yMap);
      const spanB_X = lookupGridSpan(segB, xMap);

      if (spanA_X && spanB_Y) {
        x1 = spanA_X.startCoord;
        x2 = spanA_X.endCoord;
        y1 = spanB_Y.startCoord;
        y2 = spanB_Y.endCoord;
        xLabel = spanA_X.label;
        yLabel = spanB_Y.label;
        matched = true;
      } else if (spanB_X && spanA_Y) {
        x1 = spanB_X.startCoord;
        x2 = spanB_X.endCoord;
        y1 = spanA_Y.startCoord;
        y2 = spanA_Y.endCoord;
        xLabel = spanB_X.label;
        yLabel = spanA_Y.label;
        matched = true;
      } else if (spanA_X) {
        x1 = spanA_X.startCoord;
        x2 = spanA_X.endCoord;
        xLabel = spanA_X.label;
        y1 = yAxes[0]?.pos ?? 0;
        y2 = yAxes[yAxes.length - 1]?.pos ?? y1;
        yLabel = yAxes[0]?.label ?? "1";
        matched = true;
      } else if (spanA_Y) {
        y1 = spanA_Y.startCoord;
        y2 = spanA_Y.endCoord;
        yLabel = spanA_Y.label;
        x1 = xAxes[0]?.pos ?? 0;
        x2 = xAxes[xAxes.length - 1]?.pos ?? x1;
        xLabel = xAxes[0]?.label ?? "A";
        matched = true;
      }
    } else if (segA) {
      // Single token (e.g. "C", "3", "3-5", "C-D")
      const spanX = lookupGridSpan(segA, xMap);
      const spanY = lookupGridSpan(segA, yMap);

      if (spanX) {
        x1 = spanX.startCoord;
        x2 = spanX.endCoord;
        xLabel = spanX.label;
        y1 = yAxes[0]?.pos ?? 0;
        y2 = yAxes[yAxes.length - 1]?.pos ?? y1;
        yLabel = yAxes[0]?.label ?? "1";
        matched = true;
      } else if (spanY) {
        y1 = spanY.startCoord;
        y2 = spanY.endCoord;
        yLabel = spanY.label;
        x1 = xAxes[0]?.pos ?? 0;
        x2 = xAxes[xAxes.length - 1]?.pos ?? x1;
        xLabel = xAxes[0]?.label ?? "A";
        matched = true;
      }
    }
  }

  // Fallback: If explicit coordinates provided in DB
  if (
    !matched &&
    (explicitGridX !== undefined || explicitGridZ !== undefined)
  ) {
    x1 = (explicitGridX ?? 0) * scaleMultiplier;
    x2 = x1;
    y1 = (explicitGridZ ?? 0) * scaleMultiplier;
    y2 = y1;
    matched = true;
  }

  // Fallback: Deterministic distribution on available grid intersections
  if (x1 === undefined || y1 === undefined) {
    const xLen = Math.max(1, xAxes.length);
    const yLen = Math.max(1, yAxes.length);
    const xIdx = fallbackIndex % xLen;
    const yIdx = Math.floor(fallbackIndex / xLen) % yLen;

    x1 = xAxes[xIdx]?.pos ?? xIdx * 6 * scaleMultiplier;
    x2 = x1;
    y1 = yAxes[yIdx]?.pos ?? yIdx * 6 * scaleMultiplier;
    y2 = y1;
    xLabel = xAxes[xIdx]?.label ?? String(xIdx + 1);
    yLabel = yAxes[yIdx]?.label ?? String(yIdx + 1);
  }

  if (x2 === undefined) x2 = x1;
  if (y2 === undefined) y2 = y1;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const sizeX = Math.abs(dx);
  const sizeY = Math.abs(dy);
  const spanLength = Math.sqrt(dx * dx + dy * dy);
  const angleRad = Math.atan2(dy, dx);

  const hasSpanX = Math.abs(dx) > 0.001;
  const hasSpanY = Math.abs(dy) > 0.001;

  if (hasSpanX && hasSpanY) {
    isArea = true;
    isSpan = false;
    isPoint = false;
  } else if (hasSpanX || hasSpanY) {
    isArea = false;
    isSpan = true;
    isPoint = false;
  } else {
    isArea = false;
    isSpan = false;
    isPoint = true;
  }

  return {
    x1,
    x2,
    y1,
    y2,
    midX: (x1 + x2) / 2,
    midY: (y1 + y2) / 2,
    sizeX: Math.max(0.3 * scaleMultiplier, sizeX),
    sizeY: Math.max(0.3 * scaleMultiplier, sizeY),
    spanLength,
    angleRad,
    isArea,
    isSpan,
    isPoint,
    matched,
    xLabel,
    yLabel,
  };
}

/**
 * Builds the geometric grid system from database gridlines.
 */
export function buildGridSystemGeometry(
  gridlines: Gridline[] = [],
  scaleMultiplier: number = 1,
): GridSystemGeometry {
  let xGrids = gridlines.filter((g) => (g.axis || "").toUpperCase() === "X");
  let yGrids = gridlines.filter((g) => (g.axis || "").toUpperCase() === "Y");

  // Auto-detect letters (X) vs numbers (Y) if axis property is unspecified or uniform
  if (xGrids.length === 0 || yGrids.length === 0) {
    const letters = gridlines.filter((g) =>
      /^[A-Za-z]+$/.test((g.label || "").trim()),
    );
    const numbers = gridlines.filter((g) =>
      /^[0-9]+['"`]?$/.test((g.label || "").trim()),
    );
    if (letters.length > 0 && numbers.length > 0) {
      xGrids = letters;
      yGrids = numbers;
    }
  }

  // Sort strictly by order
  xGrids.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  yGrids.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Defaults if no gridlines exist in project
  const defaultX: Partial<Gridline>[] =
    xGrids.length > 0
      ? xGrids
      : [
          {
            id: "def-gx-1",
            axis: "X",
            label: "A",
            order: 0,
            distanceToNext: 6,
          },
          {
            id: "def-gx-2",
            axis: "X",
            label: "B",
            order: 1,
            distanceToNext: 6,
          },
          {
            id: "def-gx-3",
            axis: "X",
            label: "C",
            order: 2,
            distanceToNext: 6,
          },
          {
            id: "def-gx-4",
            axis: "X",
            label: "D",
            order: 3,
            distanceToNext: 0,
          },
        ];

  const defaultY: Partial<Gridline>[] =
    yGrids.length > 0
      ? yGrids
      : [
          {
            id: "def-gy-1",
            axis: "Y",
            label: "1",
            order: 0,
            distanceToNext: 6,
          },
          {
            id: "def-gy-2",
            axis: "Y",
            label: "2",
            order: 1,
            distanceToNext: 6,
          },
          {
            id: "def-gy-3",
            axis: "Y",
            label: "3",
            order: 2,
            distanceToNext: 6,
          },
          {
            id: "def-gy-4",
            axis: "Y",
            label: "4",
            order: 3,
            distanceToNext: 0,
          },
        ];

  // 1. Calculate X Gridline Cumulative Positions
  let curX = 0;
  const xMap = new Map<string, number>();
  const xAxes: GridAxisItem[] = defaultX.map((g, idx) => {
    const pos = curX * scaleMultiplier;
    const rawLbl = (g.label || String.fromCharCode(65 + idx)).trim();
    const lbl = rawLbl.toUpperCase();
    xMap.set(lbl, pos);
    const noZero = lbl.replace(/^0+/, "");
    if (noZero && !xMap.has(noZero)) xMap.set(noZero, pos);
    const padded = lbl.padStart(2, "0");
    if (!xMap.has(padded)) xMap.set(padded, pos);

    const rawDist =
      g.distanceToNext !== undefined &&
      g.distanceToNext !== null &&
      String(g.distanceToNext).trim() !== ""
        ? Number(g.distanceToNext)
        : idx === defaultX.length - 1
          ? 0
          : 6;

    const validDist =
      !isNaN(rawDist) && rawDist >= 0
        ? rawDist
        : idx === defaultX.length - 1
          ? 0
          : 6;
    curX += validDist;

    return {
      id: g.id,
      label: rawLbl,
      pos,
      offset: pos,
      order: g.order ?? idx,
      distanceToNext: validDist,
    };
  });

  // 2. Calculate Y Gridline Cumulative Positions (Highest to Lowest from Top to Bottom)
  // Extract distances between consecutive ascending levels (0 -> N-1)
  const yDistances: number[] = defaultY.map((g, idx) => {
    const rawDist =
      g.distanceToNext !== undefined &&
      g.distanceToNext !== null &&
      String(g.distanceToNext).trim() !== ""
        ? Number(g.distanceToNext)
        : idx === defaultY.length - 1
          ? 0
          : 6;
    return !isNaN(rawDist) && rawDist >= 0
      ? rawDist
      : idx === defaultY.length - 1
        ? 0
        : 6;
  });

  // Calculate total vertical height
  let totalHeightM = 0;
  for (let i = 0; i < defaultY.length - 1; i++) {
    totalHeightM += yDistances[i];
  }
  if (totalHeightM <= 0) totalHeightM = (defaultY.length - 1) * 6;

  // Build top-to-bottom array: Highest index (N-1) at Top (curTopY = 0), descending to index 0 at Bottom
  const yMap = new Map<string, number>();
  let curTopY = 0;
  const reversedIndices: number[] = [];
  for (let i = defaultY.length - 1; i >= 0; i--) {
    reversedIndices.push(i);
  }

  const yAxes: GridAxisItem[] = reversedIndices.map((origIdx, revIdx) => {
    const g = defaultY[origIdx];
    const pos = curTopY * scaleMultiplier;
    const rawLbl = (g?.label || String(origIdx + 1)).trim();
    const lbl = rawLbl.toUpperCase();

    yMap.set(lbl, pos);
    const noZero = lbl.replace(/^0+/, "");
    if (noZero && !yMap.has(noZero)) yMap.set(noZero, pos);
    const padded = lbl.padStart(2, "0");
    if (!yMap.has(padded)) yMap.set(padded, pos);

    // Distance to next gridline below this one
    const distToBelow = origIdx > 0 ? yDistances[origIdx - 1] : 0;
    curTopY += distToBelow;

    return {
      id: g?.id,
      label: rawLbl,
      pos,
      offset: pos,
      order: g?.order ?? origIdx,
      distanceToNext: distToBelow,
    };
  });

  const minX = 0;
  const maxX = xAxes[xAxes.length - 1]?.pos || 18 * scaleMultiplier;
  const minY = 0;
  const maxY = yAxes[yAxes.length - 1]?.pos || 18 * scaleMultiplier;

  return {
    xAxes,
    yAxes,
    xMap,
    yMap,
    minX,
    maxX,
    minY,
    maxY,
    centerOffsetX: (minX + maxX) / 2,
    centerOffsetY: (minY + maxY) / 2,
  };
}

/**
 * Legacy compatibility export of parseGridLocation
 */
export function parseGridLocation(
  rawStr: string | undefined,
  elementName?: string,
): ParsedGridSpan | null {
  const norm = normalizeGridLabel(rawStr);
  if (!norm && !elementName) return null;

  // Broad check for area bay
  const areaMatch = norm.match(/^([A-Z0-9'-]+)[/,\s]+([A-Z0-9'-]+)$/i);
  if (areaMatch) {
    return {
      xStartLabel: areaMatch[1],
      xEndLabel: areaMatch[1],
      yStartLabel: areaMatch[2],
      yEndLabel: areaMatch[2],
      isArea: norm.includes("-"),
      isLineX: false,
      isLineY: false,
      isPoint: !norm.includes("-"),
    };
  }
  return null;
}

/**
 * Resolves physical span/bay dimensions (length & width) from a grid string (e.g., "A-C/1-3", "2/E-G", "E-G/2", "C-D/4")
 */
export function resolveGridDimensions(
  gridVal: string | undefined,
  gridlines: Gridline[] = [],
  elementType?: string,
): { length: number | null; width: number | null } {
  if (!gridVal || !gridlines || gridlines.length === 0) {
    return { length: null, width: null };
  }

  const { xMap, yMap, xAxes, yAxes } = buildGridSystemGeometry(gridlines, 1);
  const coords = resolveElementGridCoords(
    gridVal,
    undefined,
    xMap,
    yMap,
    xAxes,
    yAxes,
    1,
  );

  if (!coords || !coords.matched) {
    return { length: null, width: null };
  }

  const sizeX = coords.sizeX > 0 ? Number(coords.sizeX.toFixed(3)) : null;
  const sizeY = coords.sizeY > 0 ? Number(coords.sizeY.toFixed(3)) : null;

  if (coords.isArea) {
    // For slabs: Length is primary dimension, Width is secondary
    const length = sizeX !== null && sizeY !== null ? Math.max(sizeX, sizeY) : sizeX || sizeY;
    const width = sizeX !== null && sizeY !== null ? Math.min(sizeX, sizeY) : null;
    return { length, width };
  }

  if (coords.isSpan) {
    // For beams/walls: spanLength is length
    const spanLen = coords.spanLength > 0 ? Number(coords.spanLength.toFixed(3)) : (sizeX || sizeY);
    return { length: spanLen, width: null };
  }

  return { length: sizeX, width: sizeY };
}

