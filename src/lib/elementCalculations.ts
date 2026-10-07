import { StructuralElement } from "@/types";

/**
 * Normalizes a dimensional value.
 * If the input is in millimeters (> 50 for typical structural dimensions), converts to meters.
 */
export function normalizeDimension(val?: number | string | null): number {
  if (val === null || val === undefined) return 0;
  const num = typeof val === "number" ? val : parseFloat(String(val));
  if (isNaN(num) || num <= 0) return 0;
  // If dimension is greater than 50, it is specified in millimeters (e.g. 600mm = 0.6m, 3200mm = 3.2m)
  return num > 50 ? num / 1000 : num;
}

/**
 * Derives the in-situ concrete volume (m³) for an element from its geometry or saved volume.
 */
export function getOrCalculateVolume(el: Partial<StructuralElement>): number {
  // If pre-calculated volume is valid, prioritize it
  const savedVol = parseFloat(String(el.calculatedVolume || el.volume || 0));
  if (!isNaN(savedVol) && savedVol > 0) {
    return parseFloat(savedVol.toFixed(3));
  }

  const L = normalizeDimension(el.length ?? el.dimensions?.length);
  const W = normalizeDimension(el.width ?? el.dimensions?.width);
  const H = normalizeDimension(el.height ?? el.dimensions?.height);
  const D = normalizeDimension(el.depth);
  const T = normalizeDimension(el.thickness);
  const Dia = normalizeDimension(el.diameter ?? (el.dimensions as any)?.diameter);

  const type = String(el.elementType || "COLUMN").toUpperCase();
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
    vol = (L || 6.0) * (W || 0.3) * (D || 0.6);
  } else if (type.includes("SLAB")) {
    vol = (L || 6.0) * (W || 6.0) * (T || 0.2);
  } else if (type.includes("WALL")) {
    vol = (L || 6.0) * (H || 3.0) * (T || 0.2);
  } else if (type.includes("FOOTING") || type.includes("PILE")) {
    vol = (L || 2.0) * (W || 2.0) * (D || 1.0);
  } else if (type.includes("STAIR")) {
    vol = (L || 3.0) * (W || 1.2) * (T || 0.18);
  } else {
    // Default rectangular prism
    vol = (L || 1.0) * (W || 1.0) * (H || D || T || 1.0);
  }

  return parseFloat(vol.toFixed(3));
}

/**
 * Derives the formwork shuttering contact surface area (m²) for an element.
 * Follows standard structural quantity surveying conventions:
 * - Columns: Perimeter × clear height (or π × Ø × H for circular)
 * - Beams: Soffit + 2 sides (accounting for slab thickness deduction if present)
 * - Slabs: Soffit area + perimeter edge forms
 * - Walls: 2 outer face forms + end edge forms
 * - Footings: 4 side forms
 */
export function getOrCalculateFormworkArea(el: Partial<StructuralElement>): number {
  // If pre-calculated formwork area is already a positive number, use it
  const savedFmwk = parseFloat(String(el.calculatedFormworkArea || (el as any).formworkArea || 0));
  if (!isNaN(savedFmwk) && savedFmwk > 0) {
    return parseFloat(savedFmwk.toFixed(2));
  }

  const L = normalizeDimension(el.length ?? el.dimensions?.length);
  const W = normalizeDimension(el.width ?? el.dimensions?.width);
  const H = normalizeDimension(el.height ?? el.dimensions?.height);
  const D = normalizeDimension(el.depth);
  const T = normalizeDimension(el.thickness);
  const Dia = normalizeDimension(el.diameter ?? (el.dimensions as any)?.diameter);

  const type = String(el.elementType || "COLUMN").toUpperCase();
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
    const l = L || 6.0;
    const w = W || 0.3;
    const d = D || 0.6;
    const slabT = normalizeDimension(el.supportedSlabThickness);
    const netDepth = Math.max(0, d - slabT);
    // Soffit (w * l) + 2 side forms (2 * netDepth * l)
    area = (2 * netDepth + w) * l;
  } else if (type.includes("SLAB")) {
    const l = L || 6.0;
    const w = W || 6.0;
    const t = T || 0.2;
    // Soffit area (l * w) + perimeter edge forms 2 * (l + w) * t
    area = l * w + 2 * (l + w) * t;
  } else if (type.includes("WALL")) {
    const l = L || 6.0;
    const h = H || 3.0;
    const t = T || 0.2;
    // Two side faces (2 * l * h) + end forms (2 * h * t)
    area = 2 * (l * h) + 2 * (l + h) * t;
  } else if (type.includes("FOOTING") || type.includes("PILE")) {
    const l = L || 2.0;
    const w = W || 2.0;
    const d = D || 1.0;
    // 4 vertical side forms
    area = 2 * (l + w) * d;
  } else if (type.includes("STAIR")) {
    const l = L || 3.0;
    const w = W || 1.2;
    area = l * w * 1.35;
  } else {
    // Generic fallback based on volume or bounding dimensions
    const vol = getOrCalculateVolume(el);
    if (vol > 0) {
      area = vol * 4.5;
    } else if (L > 0 && W > 0) {
      area = 2 * (L + W) * (H || D || 1.0);
    }
  }

  return parseFloat(area.toFixed(2));
}
