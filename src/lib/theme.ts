import { CompanyThemePalette } from "@/types";

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  category: "civil" | "infrastructure" | "industrial" | "executive" | "safety";
  primary: string; // hex
  accent: string;  // hex
  previewBadgeClass: string;
}

/**
 * Built-in Construction & Civil Engineering Industry Palette Presets
 */
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "apex-civil-blue",
    name: "Civil Navy & Electric Blue",
    description: "Classic civil engineering aesthetic — professional, high trust and crisp clarity.",
    category: "civil",
    primary: "#0284c7", // Sky/Navy Blue 600
    accent: "#f59e0b",  // Amber
    previewBadgeClass: "from-sky-500 to-blue-700",
  },
  {
    id: "construction-safety-amber",
    name: "Safety Amber & Industrial Steel",
    description: "High-visibility civil construction motif inspired by Caterpillar & site safety gear.",
    category: "safety",
    primary: "#d97706", // Amber 600
    accent: "#0284c7",  // Blue accent
    previewBadgeClass: "from-amber-500 to-orange-600",
  },
  {
    id: "emerald-infrastructure",
    name: "Environmental & Sustainable Green",
    description: "LEED/BREEAM certified infrastructure, environmental compliance & green civil works.",
    category: "infrastructure",
    primary: "#059669", // Emerald 600
    accent: "#3b82f6",  // Blue accent
    previewBadgeClass: "from-emerald-500 to-teal-700",
  },
  {
    id: "nordic-monolith-slate",
    name: "Graphite Monolith & Cobalt",
    description: "Sleek, architectural concrete minimalism with dark slate and precise cobalt highlights.",
    category: "industrial",
    primary: "#2563eb", // Royal Cobalt Blue
    accent: "#10b981",  // Emerald accent
    previewBadgeClass: "from-blue-600 to-indigo-900",
  },
  {
    id: "high-contrast-crimson",
    name: "Crimson Quality & Steel",
    description: "High-alert critical inspection emphasis, QA non-conformance rigor and urgency.",
    category: "executive",
    primary: "#dc2626", // Red 600
    accent: "#f97316",  // Orange accent
    previewBadgeClass: "from-red-500 to-rose-700",
  },
  {
    id: "executive-indigo-deep",
    name: "Executive Indigo & Cyber Cyan",
    description: "Modern enterprise tech platform palette with rich violet-blue and cyan accents.",
    category: "executive",
    primary: "#4f46e5", // Indigo 600
    accent: "#06b6d4",  // Cyan accent
    previewBadgeClass: "from-indigo-500 to-purple-700",
  },
  {
    id: "heavy-plant-orange",
    name: "Heavy Machinery & Safety Orange",
    description: "Earthworks, piling, heavy earthmoving equipment and plant management visual theme.",
    category: "safety",
    primary: "#ea580c", // Orange 600
    accent: "#eab308",  // Yellow accent
    previewBadgeClass: "from-orange-500 to-amber-600",
  },
  {
    id: "concrete-teal-architectural",
    name: "Structural Teal & Marine Marine",
    description: "Hydraulic works, marine construction, bridge structures and geotechnical styling.",
    category: "infrastructure",
    primary: "#0d9488", // Teal 600
    accent: "#0284c7",  // Sky accent
    previewBadgeClass: "from-teal-500 to-emerald-700",
  },
];

export const DEFAULT_THEME_PALETTE: CompanyThemePalette = {
  presetId: "apex-civil-blue",
  presetName: "Civil Navy & Electric Blue",
  primaryColor: "#0284c7",
  accentColor: "#f59e0b",
  secondaryColor: "#0f172a",
  radius: "md",
  modePreference: "dark",
  customHex: false,
};

/**
 * Utility: Convert hex (#rrggbb) to {r, g, b}
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

/**
 * Utility: Convert {r,g,b} to hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * Blend a base color with pure white (weight 0 to 1) or pure black (weight 0 to 1)
 */
function tint(rgb: { r: number; g: number; b: number }, weight: number) {
  return {
    r: rgb.r + (255 - rgb.r) * weight,
    g: rgb.g + (255 - rgb.g) * weight,
    b: rgb.b + (255 - rgb.b) * weight,
  };
}

function shade(rgb: { r: number; g: number; b: number }, weight: number) {
  return {
    r: rgb.r * (1 - weight),
    g: rgb.g * (1 - weight),
    b: rgb.b * (1 - weight),
  };
}

/**
 * Generates an 11-shade color ramp (50 to 950) from any primary HEX color
 */
export function generateColorShades(primaryHex: string): Record<string, string> {
  const base = hexToRgb(primaryHex) || { r: 2, g: 132, b: 199 }; // fallback #0284c7

  return {
    50: rgbToHex(tint(base, 0.92).r, tint(base, 0.92).g, tint(base, 0.92).b),
    100: rgbToHex(tint(base, 0.82).r, tint(base, 0.82).g, tint(base, 0.82).b),
    200: rgbToHex(tint(base, 0.65).r, tint(base, 0.65).g, tint(base, 0.65).b),
    300: rgbToHex(tint(base, 0.45).r, tint(base, 0.45).g, tint(base, 0.45).b),
    400: rgbToHex(tint(base, 0.22).r, tint(base, 0.22).g, tint(base, 0.22).b),
    500: rgbToHex(base.r, base.g, base.b),
    600: rgbToHex(shade(base, 0.12).r, shade(base, 0.12).g, shade(base, 0.12).b),
    700: rgbToHex(shade(base, 0.28).r, shade(base, 0.28).g, shade(base, 0.28).b),
    800: rgbToHex(shade(base, 0.45).r, shade(base, 0.45).g, shade(base, 0.45).b),
    900: rgbToHex(shade(base, 0.65).r, shade(base, 0.65).g, shade(base, 0.65).b),
    950: rgbToHex(shade(base, 0.82).r, shade(base, 0.82).g, shade(base, 0.82).b),
  };
}

const STORAGE_KEY = "jqms_company_theme_palette";

/**
 * Reads locally cached company palette or default
 */
export function getStoredCompanyTheme(): CompanyThemePalette {
  if (typeof window === "undefined") return DEFAULT_THEME_PALETTE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.primaryColor) {
        return { ...DEFAULT_THEME_PALETTE, ...parsed };
      }
    }
  } catch (err) {
    console.warn("Failed reading cached theme palette:", err);
  }
  return DEFAULT_THEME_PALETTE;
}

/**
 * Injects CSS custom properties dynamically into document.documentElement (:root)
 * Affects brand 50-950, primary hex, rgb channels, accent color, and border radius.
 */
export function applyCompanyTheme(palette: Partial<CompanyThemePalette>): void {
  if (typeof document === "undefined") return;

  const resolved: CompanyThemePalette = {
    ...DEFAULT_THEME_PALETTE,
    ...palette,
    primaryColor: palette.primaryColor || DEFAULT_THEME_PALETTE.primaryColor,
  };

  const root = document.documentElement;
  const shades = generateColorShades(resolved.primaryColor);
  const rgbPrimary = hexToRgb(resolved.primaryColor) || { r: 2, g: 132, b: 199 };

  // Set individual CSS variables for brand shades
  Object.entries(shades).forEach(([step, hex]) => {
    const rgb = hexToRgb(hex);
    root.style.setProperty(`--color-brand-${step}`, hex);
    if (rgb) {
      root.style.setProperty(`--color-brand-${step}-rgb`, `${rgb.r} ${rgb.g} ${rgb.b}`);
    }
  });

  // Set primary and accent root variables
  root.style.setProperty("--color-brand-primary", resolved.primaryColor);
  root.style.setProperty("--color-brand-rgb", `${rgbPrimary.r} ${rgbPrimary.g} ${rgbPrimary.b}`);

  if (resolved.accentColor) {
    const rgbAccent = hexToRgb(resolved.accentColor);
    root.style.setProperty("--color-brand-accent", resolved.accentColor);
    if (rgbAccent) {
      root.style.setProperty("--color-brand-accent-rgb", `${rgbAccent.r} ${rgbAccent.g} ${rgbAccent.b}`);
    }
  }

  // Border radius preference
  const radiusMap: Record<string, string> = {
    none: "0px",
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    full: "9999px",
  };
  if (resolved.radius && radiusMap[resolved.radius]) {
    root.style.setProperty("--brand-border-radius", radiusMap[resolved.radius]);
  }

  // Cache locally for instantaneous re-render without wait
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resolved));
  } catch (e) {
    // Ignore storage quota
  }
}

// Auto-run on script load to prevent white/unthemed flash
if (typeof window !== "undefined") {
  applyCompanyTheme(getStoredCompanyTheme());
}
