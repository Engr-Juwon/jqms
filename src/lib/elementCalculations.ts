import { StructuralElement } from "@/types";

/**
 * Normalizes a dimensional value.
 * In reinforced concrete construction:
 * - Cross-sections in millimeters are typically integers >= 100 (e.g. 150, 175, 200, 225, 250, 300, 450, 600, 750, 1200, 2500 mm).
 * - Decimal numbers (e.g. 98.24m radius, 24.799m span, 1.872m cantilever depth, 0.175m thickness) or values under 100 are ALWAYS in METERS.
 * - Large radii (e.g. R=98.24m) or bay spans (L=24.8m) must never be divided by 1000.
 */
export function normalizeDimension(val?: number | string | null): number {
  if (val === null || val === undefined) return 0;
  const num = typeof val === "number" ? val : parseFloat(String(val));
  if (isNaN(num) || num <= 0) return 0;
  if (num >= 100 && (Number.isInteger(num) || num >= 500)) {
    return num / 1000;
  }
  return num;
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

  if ((mode === "chord_rise" || (rIn <= 0 && cIn > 0 && hIn > 0)) && cIn > 0 && hIn > 0) {
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
        chordLength: C || baseL,
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
 * Returns user-friendly dimension metadata based on structural member type.
 * Columns: Breadth (L) × Width (W) × Storey Height (H) [has Height, NO Depth]
 * Beams:   Span (L) × Web Width (W) × Section Depth (D) [has Depth, NO Height]
 * Walls:   Length (L) × Thickness (T) × Wall Height (H) [has Height & Thickness]
 * Slabs:   Length (L) × Width (W) × Slab Thickness (T)  [has Thickness]
 */
export function getElementDimensionMeta(typeStr?: string) {
  const type = String(typeStr || "COLUMN").toUpperCase();
  if (type.includes("COLUMN")) {
    return {
      type: "COLUMN",
      dim1Label: "Breadth (L)",
      dim2Label: "Width (W)",
      dim3Label: "Storey Height (H)",
      dim3Key: "height" as const,
      hasDepth: false,
      hasHeight: true,
      hasThickness: false,
      summary: (l: number, w: number, h: number, d: number, t: number) =>
        `${(w * 1000).toFixed(0)}×${(l * 1000).toFixed(0)}mm · H: ${(h || d || 3.2).toFixed(2)}m`,
    };
  }
  if (type.includes("BEAM")) {
    return {
      type: "BEAM",
      dim1Label: "Span (L)",
      dim2Label: "Width (b)",
      dim3Label: "Section Depth (D)",
      dim3Key: "depth" as const,
      hasDepth: true,
      hasHeight: false,
      hasThickness: false,
      summary: (l: number, w: number, h: number, d: number, t: number) =>
        `Span: ${l.toFixed(2)}m · ${(w * 1000).toFixed(0)}×${((d || h || 0.6) * 1000).toFixed(0)}mm`,
    };
  }
  if (type.includes("WALL")) {
    return {
      type: "WALL",
      dim1Label: "Length (L)",
      dim2Label: "Thickness (t)",
      dim3Label: "Wall Height (H)",
      dim3Key: "height" as const,
      hasDepth: false,
      hasHeight: true,
      hasThickness: true,
      summary: (l: number, w: number, h: number, d: number, t: number) =>
        `L: ${l.toFixed(2)}m · T: ${((t || 0.25) * 1000).toFixed(0)}mm · H: ${(h || d || 3.0).toFixed(2)}m`,
    };
  }
  if (type.includes("SLAB")) {
    return {
      type: "SLAB",
      dim1Label: "Length (L)",
      dim2Label: "Width (W)",
      dim3Label: "Thickness (t)",
      dim3Key: "thickness" as const,
      hasDepth: false,
      hasHeight: false,
      hasThickness: true,
      summary: (l: number, w: number, h: number, d: number, t: number) =>
        `${l.toFixed(2)}×${w.toFixed(2)}m · T: ${((t || 0.175) * 1000).toFixed(0)}mm`,
    };
  }
  return {
    type: "OTHER",
    dim1Label: "Length (L)",
    dim2Label: "Width (W)",
    dim3Label: "Height/Depth",
    dim3Key: "height" as const,
    hasDepth: true,
    hasHeight: true,
    hasThickness: true,
    summary: (l: number, w: number, h: number, d: number, t: number) =>
      `${l.toFixed(2)}×${w.toFixed(2)}m · ${(h || d || t || 1.0).toFixed(2)}m`,
  };
}

/**
 * Derives the in-situ concrete volume (m³) for an element from its geometry or saved volume.
 */
/**
 * Calculates the true effective axis length for a column.
 * For straight vertical columns: returns H.
 * For slanted / inclined columns: returns L_slant = sqrt(H² + Δ²) = H / cos(θ).
 */
export function getEffectiveColumnLength(el: Partial<StructuralElement>): number {
  const H = normalizeDimension(el.height ?? el.dimensions?.height) || 3.2;
  const isInclined = !!el.isInclined || el.verticality === "inclined";
  if (!isInclined) return H;

  const mode = el.inclinedCalcMode || "offset";
  const offset = Number(el.horizontalOffset);
  const angle = Number(el.inclinationAngle);

  if (mode === "offset" && offset > 0) {
    return parseFloat(Math.sqrt(H * H + offset * offset).toFixed(3));
  } else if (angle > 0) {
    const rad = (Math.min(85, angle) * Math.PI) / 180;
    return parseFloat((H / Math.cos(rad)).toFixed(3));
  } else if (offset > 0) {
    return parseFloat(Math.sqrt(H * H + offset * offset).toFixed(3));
  }
  return H;
}

export interface ColumnInclinationInfo {
  isInclined: boolean;
  verticalHeightM: number;
  horizontalOffsetM: number;
  inclinationAngleDeg: number;
  effectiveLengthM: number;
  direction: "EAST" | "WEST" | "NORTH" | "SOUTH";
  deltaX: number; // in meters (world X)
  deltaY: number; // in meters (2D plan Y: North is negative, South is positive)
  deltaZ: number; // in meters (Three.js world Z: North is negative, South is positive)
}

export function getColumnInclinationInfo(el: Partial<StructuralElement>): ColumnInclinationInfo {
  const H = normalizeDimension(el.height ?? el.dimensions?.height) || 3.2;
  const isInclined = !!el.isInclined || el.verticality === "inclined";
  const rawDir = String(el.inclinationDirection || "EAST").toUpperCase();
  let direction: "EAST" | "WEST" | "NORTH" | "SOUTH" = "EAST";
  if (rawDir.includes("WEST") || rawDir === "-X" || rawDir === "LEFT") direction = "WEST";
  else if (rawDir.includes("NORTH") || rawDir === "+Y" || rawDir === "TOP") direction = "NORTH";
  else if (rawDir.includes("SOUTH") || rawDir === "-Y" || rawDir === "BOTTOM") direction = "SOUTH";

  let offsetM = Number(el.horizontalOffset) || 0;
  let angleDeg = Number(el.inclinationAngle) || 0;

  if (isInclined) {
    if (el.inclinedCalcMode === "angle" && angleDeg > 0) {
      const rad = (Math.min(85, angleDeg) * Math.PI) / 180;
      offsetM = parseFloat((H * Math.tan(rad)).toFixed(3));
    } else if (offsetM > 0) {
      angleDeg = parseFloat(((Math.atan(offsetM / H) * 180) / Math.PI).toFixed(1));
    } else if (angleDeg > 0) {
      const rad = (Math.min(85, angleDeg) * Math.PI) / 180;
      offsetM = parseFloat((H * Math.tan(rad)).toFixed(3));
    } else {
      offsetM = 0.4;
      angleDeg = parseFloat(((Math.atan(0.4 / H) * 180) / Math.PI).toFixed(1));
    }
  }

  const effectiveLengthM = isInclined
    ? parseFloat(Math.sqrt(H * H + offsetM * offsetM).toFixed(3))
    : H;

  let deltaX = 0;
  let deltaY = 0;
  let deltaZ = 0;

  if (isInclined) {
    if (direction === "EAST") {
      deltaX = offsetM;
    } else if (direction === "WEST") {
      deltaX = -offsetM;
    } else if (direction === "NORTH") {
      deltaY = -offsetM;
      deltaZ = -offsetM;
    } else if (direction === "SOUTH") {
      deltaY = offsetM;
      deltaZ = offsetM;
    }
  }

  return {
    isInclined,
    verticalHeightM: H,
    horizontalOffsetM: offsetM,
    inclinationAngleDeg: angleDeg,
    effectiveLengthM,
    direction,
    deltaX,
    deltaY,
    deltaZ,
  };
}

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
    const effH = getEffectiveColumnLength(el) || H || D || 3.2;
    if (el.columnShape === "circular" || Dia > 0) {
      const r = (Dia || 0.6) / 2;
      vol = Math.PI * r * r * effH;
    } else {
      vol = (L || 0.6) * (W || 0.6) * effH;
    }
  } else if (type.includes("BEAM")) {
    const effD = D || H || 0.6;
    if (el.beamShape === "curved" || R > 0) {
      const geom = calculateCurvedGeometry({
        radius: R || 5.0,
        arcDepth: h,
        chordLength: C || L,
        arcAngle: angle || 45,
        inputMode: el.curvedInputMode || (angle > 0 ? "radius_angle" : "radius_rise"),
      });
      vol = geom.arcLength * (W || 0.3) * effD;
    } else {
      vol = (L || 6.0) * (W || 0.3) * effD;
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
    const effH = getEffectiveColumnLength(el) || H || 3.2;
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

export interface CalculatedElevations {
  elevation: number;
  topElevation: number;
  bottomElevation: number;
  gridZ: number;
  elevationOffset: number;
  base: number;
  top: number;
  bottom: number;
}

/**
 * Calculates correct structural element elevations based on parent level datum
 * and individual element height/depth and elevationOffset.
 * 
 * If level datum is e.g. +7.40m and element has elevationOffset +0.10m,
 * base elevation = 7.50m.
 * For columns/walls/stairs: base = baseWithOffset, top = base + height (default 3.2m).
 * For beams: top = baseWithOffset, bottom = top - depth (default 0.6m).
 * For slabs: top = baseWithOffset, bottom = top - thickness (default 0.175m).
 * For footings: top = baseWithOffset, bottom = top - depth (default 1.0m).
 */
/**
 * Calculates absolute elevations (base, top, bottom) for a structural element.
 * For columns/walls: bottom = baseWithOffset, top = bottom + height.
 * For beams: top = baseWithOffset, bottom = top - depth (default 0.6m).
 * For slabs: top = baseWithOffset, bottom = top - thickness.
 * For footings: top = baseWithOffset, bottom = top - depth (default 1.0m).
 */
export function calculateElementElevations(
  element: Partial<StructuralElement>,
  levelElevation?: number | null
): CalculatedElevations {
  const offset = normalizeDimension(element.elevationOffset) || 0;
  const rawLvlElev =
    levelElevation !== undefined && levelElevation !== null && levelElevation !== 0
      ? normalizeDimension(levelElevation)
      : normalizeDimension(element.elevation) || 0;
  const levelDatum = rawLvlElev;
  const baseWithOffset = levelDatum + offset;

  const type = String(element.elementType || (element as any).type || "").toUpperCase();
  const height = normalizeDimension(element.height) || 3.2;
  const depth = normalizeDimension(element.depth) || 0.6;
  const thickness = normalizeDimension(element.thickness) || 0.175;

  let base = baseWithOffset;
  let top = baseWithOffset + height;
  let bottom = baseWithOffset;

  if (type.includes("COLUMN") || type.includes("WALL") || type.includes("STAIR")) {
    base = baseWithOffset;
    bottom = baseWithOffset;
    top = baseWithOffset + height;
  } else if (type.includes("BEAM")) {
    top = baseWithOffset;
    bottom = baseWithOffset - depth;
    base = baseWithOffset;
  } else if (type.includes("SLAB")) {
    top = baseWithOffset;
    bottom = baseWithOffset - thickness;
    base = baseWithOffset;
  } else if (type.includes("FOOTING") || type.includes("PILE")) {
    top = baseWithOffset;
    bottom = baseWithOffset - depth;
    base = baseWithOffset;
  } else {
    base = baseWithOffset;
    top = element.height ? baseWithOffset + Number(element.height) : baseWithOffset + 3.2;
    bottom = element.depth ? baseWithOffset - Number(element.depth) : baseWithOffset;
  }

  // If explicit topElevation or bottomElevation exist on the element, prioritize them
  if (element.bottomElevation !== undefined && element.bottomElevation !== null) {
    bottom = normalizeDimension(element.bottomElevation);
  }
  if (element.topElevation !== undefined && element.topElevation !== null) {
    top = normalizeDimension(element.topElevation);
  }

  return {
    elevation: parseFloat(base.toFixed(3)),
    topElevation: parseFloat(top.toFixed(3)),
    bottomElevation: parseFloat(bottom.toFixed(3)),
    base: parseFloat(base.toFixed(3)),
    top: parseFloat(top.toFixed(3)),
    bottom: parseFloat(bottom.toFixed(3)),
    gridZ: parseFloat(base.toFixed(3)),
    elevationOffset: offset,
  };
}

export interface Column2DDimensions {
  widthPx: number;
  heightPx: number;
  radiusPx: number;
  isCircular: boolean;
  maxExtentPx: number;
  dimensionLabel: string;
  isVertical: boolean;
  widthM: number;
  heightM: number;
  inclinationInfo: ColumnInclinationInfo;
}

/**
 * Derives accurate 2D CAD dimensions and orientation for a column.
 * - Respects actual physical size: e.g. 450mm x 450mm vs 300mm x 300mm vs 600mm x 300mm
 * - Respects column orientation (HORIZONTAL / 0° vs VERTICAL / 90°)
 * - Respects slant / inclination direction and plan projection offset
 */
export function getColumn2DDimensions(
  element: Partial<StructuralElement>,
  scaleFactor: number = 80
): Column2DDimensions {
  const isCircular =
    element.columnShape === "circular" ||
    element.elementType === "COLUMN_CIRCULAR";

  const rawDimL = normalizeDimension(element.length) || normalizeDimension(element.dimensions?.length) || 0.45;
  const rawDimW = normalizeDimension(element.width) || normalizeDimension(element.dimensions?.width) || 0.45;
  const rawDia = normalizeDimension(element.diameter) || rawDimW || 0.45;

  const orientation = String(element.columnOrientation || element.cantileverDirection || "HORIZONTAL").toUpperCase();
  const isVertical =
    orientation === "VERTICAL" ||
    orientation === "TOP" ||
    orientation === "BOTTOM" ||
    orientation === "NORTH" ||
    orientation === "SOUTH" ||
    orientation === "90";

  let colWidthM = rawDimL;
  let colHeightM = rawDimW;

  if (isVertical) {
    colWidthM = Math.min(rawDimL, rawDimW);
    colHeightM = Math.max(rawDimL, rawDimW);
  } else {
    colWidthM = Math.max(rawDimL, rawDimW);
    colHeightM = Math.min(rawDimL, rawDimW);
  }

  // Convert to pixels (1m = scaleFactor px, default 80px)
  const widthPx = Math.max(16, colWidthM * scaleFactor);
  const heightPx = Math.max(16, colHeightM * scaleFactor);
  const radiusPx = Math.max(8, (rawDia / 2) * scaleFactor);
  const maxExtentPx = isCircular ? radiusPx * 2 : Math.max(widthPx, heightPx);

  const inclinationInfo = getColumnInclinationInfo(element);

  const dimensionLabel = isCircular
    ? `${Math.round(rawDia * 1000)}mm Ø${inclinationInfo.isInclined ? ` ⤢ ${inclinationInfo.inclinationAngleDeg}°` : ""}`
    : `${Math.round(colWidthM * 1000)}×${Math.round(colHeightM * 1000)}mm${inclinationInfo.isInclined ? ` ⤢ ${inclinationInfo.inclinationAngleDeg}°` : ""}`;

  return {
    widthPx,
    heightPx,
    radiusPx,
    isCircular,
    maxExtentPx,
    dimensionLabel,
    isVertical,
    widthM: isCircular ? rawDia : colWidthM,
    heightM: isCircular ? rawDia : colHeightM,
    inclinationInfo,
  };
}

/**
 * Derives initial storey height for a column based on project floor elevations.
 * Finds the height difference between the current level and the level before it (or next level).
 */
export function deriveStoreyHeightForLevel(
  targetLevelId?: string | null,
  levels: Array<{ id: string; elevation?: number | null; order?: number | null; name?: string }> = []
): number {
  if (!targetLevelId || !levels || levels.length === 0) return 3.2;

  const sorted = [...levels].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined && a.order !== null && b.order !== null && a.order !== b.order) {
      return (a.order || 0) - (b.order || 0);
    }
    return (Number(a.elevation) || 0) - (Number(b.elevation) || 0);
  });

  const curIdx = sorted.findIndex((l) => l.id === targetLevelId);
  if (curIdx === -1) return 3.2;

  const curElev = Number(sorted[curIdx].elevation) || 0;

  // 1. Elevation of current level deducted from elevation of level before (as requested)
  if (curIdx > 0) {
    const prevElev = Number(sorted[curIdx - 1].elevation) || 0;
    const diff = Math.abs(curElev - prevElev);
    if (diff > 0.4) return parseFloat(diff.toFixed(3));
  }

  // 2. If it's the lowest level (no level before), use elevation of next level deducted from current level
  if (curIdx < sorted.length - 1) {
    const nextElev = Number(sorted[curIdx + 1].elevation) || 0;
    const diff = Math.abs(nextElev - curElev);
    if (diff > 0.4) return parseFloat(diff.toFixed(3));
  }

  return 3.2;
}

export interface Beam2DDimensions {
  beamWidthM: number;
  beamDepthM: number;
  widthPx: number;
  dimensionLabel: string;
}

/**
 * Derives accurate 2D CAD dimensions for a beam.
 * Converts physical width (web thickness) to canvas pixels so 225mm, 300mm, 450mm beams render visibly distinct to scale.
 */
export function getBeam2DDimensions(
  element: Partial<StructuralElement>,
  scaleFactor: number = 80
): Beam2DDimensions {
  const rawDimW =
    normalizeDimension(element.width) ||
    normalizeDimension(element.dimensions?.width) ||
    0.225;
  const rawDimD =
    normalizeDimension(element.depth) ||
    normalizeDimension((element.dimensions as any)?.depth) ||
    0.6;

  // Beam plan thickness in pixels (minimum 8px for visibility on canvas)
  const widthPx = Math.max(8, rawDimW * scaleFactor);
  const dimensionLabel = `${Math.round(rawDimW * 1000)}×${Math.round(rawDimD * 1000)}mm`;

  return {
    beamWidthM: rawDimW,
    beamDepthM: rawDimD,
    widthPx,
    dimensionLabel,
  };
}

export interface BeamElevationDatums {
  levelElevation: number;
  topOfBeam: number;
  soffitElevation: number;
  elevationOffset: number;
  depth: number;
}

/**
 * Derives Top of Beam (TOB) and Bottom of Beam / Soffit elevations from level datums.
 */
export function deriveBeamElevationDatums(
  targetLevelId?: string | null,
  levels: Array<{ id: string; elevation?: number | null; name?: string }> = [],
  elevationOffset: number = 0,
  beamDepth: number = 0.6
): BeamElevationDatums {
  const lvl = levels.find((l) => l.id === targetLevelId);
  const levelElev = Number(lvl?.elevation) || 0;
  const off = Number(elevationOffset) || 0;
  const d = Math.max(0.1, Number(beamDepth) || 0.6);
  const tob = parseFloat((levelElev + off).toFixed(3));
  const soffit = parseFloat((tob - d).toFixed(3));

  return {
    levelElevation: levelElev,
    topOfBeam: tob,
    soffitElevation: soffit,
    elevationOffset: off,
    depth: d,
  };
}

