import { StructuralElement } from "@/types";

/**
 * Normalizes a dimensional value.
 * If the input is in millimeters (> 50 for typical structural dimensions), converts to meters.
 */
export function normalizeDimension(val?: number | string | null): number {
  if (val === null || val === undefined) return 0;
  const num = typeof val === "number" ? val : parseFloat(String(val));
  if (isNaN(num) || num <= 0) return 0;
  // If dimension is greater than 50, it is specified in millimeters (e.g. 2960mm = 2.96m, 175mm = 0.175m)
  return num > 50 ? num / 1000 : num;
}

export interface CurvedGeometryResult {
  radius: number; // in meters (R)
  arcDepth: number; // in meters (rise / sagitta h)
  chordLength: number; // in meters (span C)
  arcAngleDeg: number; // in degrees (θ)
  arcAngleRad: number; // in radians
  arcLength: number; // in meters (s)
  segmentArea: number; // in m² (area of the circular segment / cap)
  sectorArea: number; // in m² (area of the pie sector)
  triangleArea: number; // in m² (area of triangle between center and chord)
  perimeter: number; // in meters (s + C for segment)
  formulaDescription: string;
}

/**
 * Robust geometric engine for circular segments, arcs, sectors, and curved cantilevers.
 * Accurately solves any 2 known parameters among: (Radius R, Rise/Depth h, Chord C, Subtended Angle θ).
 */
export function calculateCurvedGeometry(params: {
  radius?: number | string;
  arcDepth?: number | string;
  chordLength?: number | string;
  arcAngle?: number | string;
  inputMode?: "radius_rise" | "chord_rise" | "radius_angle" | "radius_chord";
}): CurvedGeometryResult {
  const mode = params.inputMode || "radius_rise";
  const rIn = normalizeDimension(params.radius);
  const hIn = normalizeDimension(params.arcDepth);
  const cIn = normalizeDimension(params.chordLength);
  const angleIn = typeof params.arcAngle === "number" ? params.arcAngle : parseFloat(String(params.arcAngle || 0));

  let R = 0;
  let h = 0;
  let C = 0;
  let thetaRad = 0;
  let formulaDesc = "";

  if (mode === "chord_rise" && cIn > 0 && hIn > 0) {
    // R = h/2 + C²/(8h)
    h = hIn;
    C = cIn;
    R = h / 2 + (C * C) / (8 * h);
    const halfSin = Math.min(1, Math.max(-1, C / (2 * R)));
    const halfAngle = Math.asin(halfSin);
    thetaRad = h > R ? 2 * (Math.PI - halfAngle) : 2 * halfAngle;
    formulaDesc = `Solved from Chord (C=${C.toFixed(3)}m) & Rise (h=${h.toFixed(3)}m) → R = ${R.toFixed(3)}m, θ = ${((thetaRad * 180) / Math.PI).toFixed(1)}°`;
  } else if ((mode === "radius_chord" || (mode === "radius_rise" && hIn <= 0 && cIn > 0)) && rIn > 0 && cIn > 0) {
    // Auto-derive h from Radius R and Chord/Span C: h = R - sqrt(R² - (C/2)²)
    R = rIn;
    C = cIn;
    const halfC = C / 2;
    if (halfC >= R) {
      // Semi-circle or greater
      h = R;
      thetaRad = Math.PI;
    } else {
      h = R - Math.sqrt(Math.max(0, R * R - halfC * halfC));
      const halfAngle = Math.asin(Math.min(1, halfC / R));
      thetaRad = 2 * halfAngle;
    }
    formulaDesc = `Auto-derived Rise (h=${h.toFixed(3)}m) from Radius (R=${R.toFixed(3)}m) & Span (C=${C.toFixed(3)}m) → θ = ${((thetaRad * 180) / Math.PI).toFixed(1)}°`;
  } else if (mode === "radius_angle" && rIn > 0 && angleIn > 0) {
    R = rIn;
    thetaRad = (Math.min(360, Math.max(0.1, angleIn)) * Math.PI) / 180;
    h = R * (1 - Math.cos(thetaRad / 2));
    C = 2 * R * Math.sin(thetaRad / 2);
    formulaDesc = `Solved from Radius (R=${R.toFixed(3)}m) & Angle (θ=${angleIn.toFixed(1)}°) → h = ${h.toFixed(3)}m, C = ${C.toFixed(3)}m`;
  } else {
    // Default & CAD standard: Radius R & Arc Depth/Rise h (e.g. R=2.96m, h=2.394m)
    R = rIn > 0 ? rIn : 2.96;
    h = hIn > 0 ? hIn : (R > 0 ? Math.min(R, 2.394) : 1.0);

    // Limit rise to diameter
    if (h > 2 * R) {
      h = 2 * R;
    }

    // cos(θ/2) = (R - h) / R
    const cosHalf = Math.min(1, Math.max(-1, (R - h) / R));
    const halfAngle = Math.acos(cosHalf);
    thetaRad = 2 * halfAngle;

    // Chord C = 2 * sqrt(2Rh - h²)
    const underSqrt = Math.max(0, 2 * R * h - h * h);
    C = 2 * Math.sqrt(underSqrt);
    formulaDesc = `Solved from Radius (R=${R.toFixed(3)}m) & Arc Depth (h=${h.toFixed(3)}m) → Chord C = ${C.toFixed(3)}m, θ = ${((thetaRad * 180) / Math.PI).toFixed(1)}°`;
  }

  const arcAngleDeg = (thetaRad * 180) / Math.PI;
  const arcLength = R * thetaRad;
  const sectorArea = 0.5 * R * R * thetaRad;
  const triangleArea = 0.5 * R * R * Math.sin(thetaRad);
  // Segment Area = 1/2 * R² * (θ - sin θ)
  const segmentArea = Math.max(0, 0.5 * R * R * (thetaRad - Math.sin(thetaRad)));
  const perimeter = arcLength + C;

  return {
    radius: parseFloat(R.toFixed(4)),
    arcDepth: parseFloat(h.toFixed(4)),
    chordLength: parseFloat(C.toFixed(4)),
    arcAngleDeg: parseFloat(arcAngleDeg.toFixed(2)),
    arcAngleRad: parseFloat(thetaRad.toFixed(4)),
    arcLength: parseFloat(arcLength.toFixed(4)),
    segmentArea: parseFloat(segmentArea.toFixed(3)),
    sectorArea: parseFloat(sectorArea.toFixed(3)),
    triangleArea: parseFloat(triangleArea.toFixed(3)),
    perimeter: parseFloat(perimeter.toFixed(3)),
    formulaDescription: formulaDesc,
  };
}

/**
 * Derives the net plan/surface area (m²) for an element.
 * Supports standard rectangular shapes as well as curved arcs, circular segments, sectors, and curved cantilevers.
 */
export function getOrCalculateElementArea(el: Partial<StructuralElement>): number {
  if (typeof el.area === "number" && el.area > 0) {
    return parseFloat(el.area.toFixed(2));
  }

  const type = String(el.elementType || "COLUMN").toUpperCase();
  const L = normalizeDimension(el.length ?? el.dimensions?.length);
  const W = normalizeDimension(el.width ?? el.dimensions?.width);
  const H = normalizeDimension(el.height ?? el.dimensions?.height);
  const T = normalizeDimension(el.thickness);
  const Dia = normalizeDimension(el.diameter ?? (el.dimensions as any)?.diameter);
  const R = normalizeDimension(el.radius);
  const h = normalizeDimension(el.arcDepth);
  const C = normalizeDimension(el.chordLength);
  const angle = el.arcAngle || 0;

  // 1. SLAB Shapes
  if (type.includes("SLAB")) {
    const shape = el.slabShape || (R > 0 || h > 0 ? "circular_segment" : "rectangular");

    if (shape === "circular_segment") {
      const geom = calculateCurvedGeometry({
        radius: R || 2.96,
        arcDepth: h || 2.394,
        chordLength: C,
        arcAngle: angle,
        inputMode: el.curvedInputMode || "radius_rise",
      });
      return geom.segmentArea;
    }

    if (shape === "circular_sector") {
      const effR = R || (Dia > 0 ? Dia / 2 : 3.0);
      const effAngle = angle > 0 ? angle : 90;
      const geom = calculateCurvedGeometry({
        radius: effR,
        arcAngle: effAngle,
        inputMode: "radius_angle",
      });
      return geom.sectorArea;
    }

    if (shape === "semi_circular") {
      const effR = R || (Dia > 0 ? Dia / 2 : (L > 0 ? L / 2 : 3.0));
      return parseFloat((0.5 * Math.PI * effR * effR).toFixed(3));
    }

    if (shape === "circular") {
      const effR = R || (Dia > 0 ? Dia / 2 : (L > 0 ? L / 2 : 3.0));
      return parseFloat((Math.PI * effR * effR).toFixed(3));
    }

    if (shape === "curved_cantilever") {
      const baseL = L || 5.0;
      const baseW = W || normalizeDimension(el.cantileverDepth) || 2.0;
      const baseArea = baseL * baseW;
      const geom = calculateCurvedGeometry({
        radius: R || 2.96,
        arcDepth: h || 2.394,
        chordLength: C,
        arcAngle: angle,
        inputMode: el.curvedInputMode || "radius_rise",
      });
      const netArea = el.isArcDeduction
        ? Math.max(0, baseArea - geom.segmentArea)
        : baseArea + geom.segmentArea;
      return parseFloat(netArea.toFixed(3));
    }

    if (shape === "trapezoidal_cantilever") {
      const baseL = L || 5.0;
      const startW = normalizeDimension(el.cantileverDepth) || W || 2.0;
      const endW = normalizeDimension((el as any).taperEndDepth ?? (el as any).width2 ?? 0);
      const baseArea = baseL * ((startW + endW) / 2);
      const filletDeduct = R > 0 ? (1 - Math.PI / 4) * R * R : 0;
      return parseFloat(Math.max(0, baseArea - filletDeduct).toFixed(3));
    }

    if (shape === "cad_area") {
      const directA = normalizeDimension(el.area || (el as any).customArea);
      if (directA > 0) return directA;
      return parseFloat(((L || 6.0) * (W || 6.0)).toFixed(2));
    }

    // Default rectangular slab
    return parseFloat(((L || 6.0) * (W || 6.0)).toFixed(2));
  }

  // 2. BEAM Shapes
  if (type.includes("BEAM")) {
    if (el.beamShape === "curved" || R > 0) {
      const geom = calculateCurvedGeometry({
        radius: R || 5.0,
        arcDepth: h,
        chordLength: C || L,
        arcAngle: angle || 45,
        inputMode: el.curvedInputMode || (angle > 0 ? "radius_angle" : "radius_rise"),
      });
      return parseFloat((geom.arcLength * (W || 0.3)).toFixed(2));
    }
    return parseFloat(((L || 6.0) * (W || 0.3)).toFixed(2));
  }

  // 3. WALL Shapes
  if (type.includes("WALL")) {
    let grossArea = 0;
    if (el.wallShape === "curved" || R > 0) {
      const geom = calculateCurvedGeometry({
        radius: R || 5.0,
        arcDepth: h,
        chordLength: C || L,
        arcAngle: angle || 45,
        inputMode: el.curvedInputMode || (angle > 0 ? "radius_angle" : "radius_rise"),
      });
      grossArea = geom.arcLength * (H || 3.0);
    } else {
      grossArea = (L || 6.0) * (H || 3.0);
    }

    const voidArea = (el.openings || []).reduce((sum, op) => {
      const opW = normalizeDimension(op.width);
      const opH = normalizeDimension(op.height);
      return sum + opW * opH;
    }, 0);

    return parseFloat(Math.max(0, grossArea - voidArea).toFixed(2));
  }

  // 4. COLUMN Shapes
  if (type.includes("COLUMN")) {
    if (el.columnShape === "circular" || Dia > 0) {
      const r = (Dia || 0.6) / 2;
      return parseFloat((Math.PI * r * r).toFixed(3));
    }
    return parseFloat(((L || 0.6) * (W || 0.6)).toFixed(3));
  }

  // 5. FOOTING / STAIRS / FALLBACK
  if (type.includes("FOOTING") || type.includes("PILE")) {
    return parseFloat(((L || 2.0) * (W || 2.0)).toFixed(2));
  }

  return parseFloat(((L || 1.0) * (W || 1.0)).toFixed(2));
}

/**
 * Derives the in-situ concrete volume (m³) for an element from its geometry or saved volume.
 */
export function getOrCalculateVolume(el: Partial<StructuralElement>): number {
  const savedVol = parseFloat(String(el.calculatedVolume || el.volume || 0));
  if (!isNaN(savedVol) && savedVol > 0) {
    return parseFloat(savedVol.toFixed(3));
  }

  const type = String(el.elementType || "COLUMN").toUpperCase();
  const L = normalizeDimension(el.length ?? el.dimensions?.length);
  const W = normalizeDimension(el.width ?? el.dimensions?.width);
  const H = normalizeDimension(el.height ?? el.dimensions?.height);
  const D = normalizeDimension(el.depth);
  const T = normalizeDimension(el.thickness);
  const Dia = normalizeDimension(el.diameter ?? (el.dimensions as any)?.diameter);
  const R = normalizeDimension(el.radius);
  const h = normalizeDimension(el.arcDepth);
  const C = normalizeDimension(el.chordLength);
  const angle = el.arcAngle || 0;

  let vol = 0;

  if (type.includes("COLUMN")) {
    if (el.columnShape === "circular" || Dia > 0) {
      const effH = H || 3.2;
      const r = (Dia || 0.6) / 2;
      vol = Math.PI * r * r * effH;
    } else {
      const effH = H || 3.2;
      vol = (L || 0.6) * (W || 0.6) * effH;
    }
  } else if (type.includes("BEAM")) {
    if (el.beamShape === "curved" || R > 0) {
      const geom = calculateCurvedGeometry({
        radius: R || 5.0,
        arcDepth: h,
        chordLength: C || L,
        arcAngle: angle || 45,
        inputMode: el.curvedInputMode || (angle > 0 ? "radius_angle" : "radius_rise"),
      });
      vol = geom.arcLength * (W || 0.3) * (D || 0.6);
    } else {
      vol = (L || 6.0) * (W || 0.3) * (D || 0.6);
    }
  } else if (type.includes("SLAB")) {
    const area = getOrCalculateElementArea(el);
    const effT = T || 0.175;
    vol = area * effT;
  } else if (type.includes("WALL")) {
    const netFaceArea = getOrCalculateElementArea(el);
    const effT = T || 0.25;
    vol = netFaceArea * effT;
  } else if (type.includes("FOOTING") || type.includes("PILE")) {
    vol = (L || 2.0) * (W || 2.0) * (D || 1.0);
  } else if (type.includes("STAIR")) {
    vol = (L || 3.0) * (W || 1.2) * (T || 0.18);
  } else {
    vol = (L || 1.0) * (W || 1.0) * (H || D || T || 1.0);
  }

  return parseFloat(vol.toFixed(3));
}

/**
 * Derives the formwork shuttering contact surface area (m²) for an element.
 * Follows standard structural quantity surveying conventions:
 * - Columns: Perimeter × clear height (or π × Ø × H for circular)
 * - Beams: Soffit + 2 sides (accounting for slab thickness deduction if present)
 * - Slabs: Soffit area + perimeter edge forms (supports curved arcs, circular, semi-circular, sectors, etc.)
 * - Walls: 2 outer face forms + end edge forms (straight or curved)
 * - Footings: 4 side forms
 */
export function getOrCalculateFormworkArea(el: Partial<StructuralElement>): number {
  const savedFmwk = parseFloat(String(el.calculatedFormworkArea || (el as any).formworkArea || 0));
  if (!isNaN(savedFmwk) && savedFmwk > 0) {
    return parseFloat(savedFmwk.toFixed(2));
  }

  const type = String(el.elementType || "COLUMN").toUpperCase();
  const L = normalizeDimension(el.length ?? el.dimensions?.length);
  const W = normalizeDimension(el.width ?? el.dimensions?.width);
  const H = normalizeDimension(el.height ?? el.dimensions?.height);
  const D = normalizeDimension(el.depth);
  const T = normalizeDimension(el.thickness);
  const Dia = normalizeDimension(el.diameter ?? (el.dimensions as any)?.diameter);
  const R = normalizeDimension(el.radius);
  const h = normalizeDimension(el.arcDepth);
  const C = normalizeDimension(el.chordLength);
  const angle = el.arcAngle || 0;

  let area = 0;

  if (type.includes("COLUMN")) {
    const effH = H || 3.2;
    if (el.columnShape === "circular" || Dia > 0) {
      const d = Dia || 0.6;
      area = Math.PI * d * effH;
    } else {
      const l = L || 0.6;
      const w = W || 0.6;
      area = 2 * (l + w) * effH;
    }
  } else if (type.includes("BEAM")) {
    const slabT = normalizeDimension(el.supportedSlabThickness);
    const d = D || 0.6;
    const w = W || 0.3;
    const netDepth = Math.max(0, d - slabT);

    if (el.beamShape === "curved" || R > 0) {
      const geom = calculateCurvedGeometry({
        radius: R || 5.0,
        arcDepth: h,
        chordLength: C || L,
        arcAngle: angle || 45,
        inputMode: el.curvedInputMode || (angle > 0 ? "radius_angle" : "radius_rise"),
      });
      // Curved Soffit (geom.arcLength * w) + 2 Curved Sides (2 * netDepth * geom.arcLength)
      area = (2 * netDepth + w) * geom.arcLength;
    } else {
      const l = L || 6.0;
      area = (2 * netDepth + w) * l;
    }
  } else if (type.includes("SLAB")) {
    const t = T || 0.175;
    const shape = el.slabShape || (R > 0 || h > 0 ? "circular_segment" : "rectangular");

    if (shape === "circular_segment") {
      const geom = calculateCurvedGeometry({
        radius: R || 2.96,
        arcDepth: h || 2.394,
        chordLength: C,
        arcAngle: angle,
        inputMode: el.curvedInputMode || "radius_rise",
      });
      // Soffit area + perimeter edges (arc length + chord span) * t
      area = geom.segmentArea + (geom.arcLength + geom.chordLength) * t;
    } else if (shape === "circular_sector") {
      const effR = R || (Dia > 0 ? Dia / 2 : 3.0);
      const geom = calculateCurvedGeometry({
        radius: effR,
        arcAngle: angle || 90,
        inputMode: "radius_angle",
      });
      area = geom.sectorArea + (2 * effR + geom.arcLength) * t;
    } else if (shape === "semi_circular") {
      const effR = R || (Dia > 0 ? Dia / 2 : (L > 0 ? L / 2 : 3.0));
      const soffit = 0.5 * Math.PI * effR * effR;
      const perimeter = Math.PI * effR + 2 * effR;
      area = soffit + perimeter * t;
    } else if (shape === "circular") {
      const effR = R || (Dia > 0 ? Dia / 2 : (L > 0 ? L / 2 : 3.0));
      const soffit = Math.PI * effR * effR;
      const perimeter = 2 * Math.PI * effR;
      area = soffit + perimeter * t;
    } else if (shape === "curved_cantilever") {
      const baseL = L || 5.0;
      const baseW = W || normalizeDimension(el.cantileverDepth) || 2.0;
      const geom = calculateCurvedGeometry({
        radius: R || 2.96,
        arcDepth: h || 2.394,
        chordLength: C,
        arcAngle: angle,
        inputMode: el.curvedInputMode || "radius_rise",
      });
      const netSoffit = el.isArcDeduction
        ? Math.max(0, baseL * baseW - geom.segmentArea)
        : baseL * baseW + geom.segmentArea;
      const edgePerimeter = 2 * baseL + 2 * baseW + geom.arcLength;
      area = netSoffit + edgePerimeter * t;
    } else if (shape === "trapezoidal_cantilever") {
      const baseL = L || 5.0;
      const startW = normalizeDimension(el.cantileverDepth) || W || 2.0;
      const endW = normalizeDimension((el as any).taperEndDepth ?? (el as any).width2 ?? 0);
      const soffit = baseL * ((startW + endW) / 2);
      const hypotenuse = Math.sqrt(baseL * baseL + Math.pow(Math.abs(startW - endW), 2));
      const perimeter = baseL + startW + endW + hypotenuse;
      area = soffit + perimeter * t;
    } else if (shape === "cad_area") {
      const soffit = normalizeDimension(el.area || (el as any).customArea) || ((L || 6.0) * (W || 6.0));
      const perim = normalizeDimension((el as any).customPerimeter) || (L > 0 && W > 0 ? 2 * (L + W) : Math.sqrt(soffit) * 4);
      area = soffit + perim * t;
    } else {
      const l = L || 6.0;
      const w = W || 6.0;
      area = l * w + 2 * (l + w) * t;
    }
  } else if (type.includes("WALL")) {
    const t = T || 0.25;
    const h = H || 3.0;

    if (el.wallShape === "curved" || R > 0) {
      const geom = calculateCurvedGeometry({
        radius: R || 5.0,
        arcDepth: h,
        chordLength: C || L,
        arcAngle: angle || 45,
        inputMode: el.curvedInputMode || (angle > 0 ? "radius_angle" : "radius_rise"),
      });
      const netFaceArea = getOrCalculateElementArea(el);
      // 2 curved faces + end forms
      area = 2 * netFaceArea + 2 * (geom.arcLength + h) * t;
    } else {
      const l = L || 6.0;
      const netFaceArea = getOrCalculateElementArea(el);
      area = 2 * netFaceArea + 2 * (l + h) * t;
    }
  } else if (type.includes("FOOTING") || type.includes("PILE")) {
    const l = L || 2.0;
    const w = W || 2.0;
    const d = D || 1.0;
    area = 2 * (l + w) * d;
  } else if (type.includes("STAIR")) {
    const l = L || 3.0;
    const w = W || 1.2;
    area = l * w * 1.35;
  } else {
    const vol = getOrCalculateVolume(el);
    if (vol > 0) {
      area = vol * 4.5;
    } else if (L > 0 && W > 0) {
      area = 2 * (L + W) * (H || D || 1.0);
    }
  }

  return parseFloat(area.toFixed(2));
}
