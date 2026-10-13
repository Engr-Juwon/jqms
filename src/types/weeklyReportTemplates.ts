export type WeeklyReportTemplateId =
  | "classic-executive"
  | "engineering-blueprint"
  | "minimal-editorial"
  | "industrial-safety";

export interface WeeklyReportTemplateTheme {
  id: WeeklyReportTemplateId;
  name: string;
  tagline: string;
  description: string;
  accentColor: string;
  accentDark: string;
  accentLight: string;
  primaryHeaderBg: string;
  headerTextColor: string;
  cardBg: string;
  cardBorder: string;
  cardRadius: string;
  badgeBg: string;
  badgeTextColor: string;
  badgeBorder: string;
  ruleColor: string;
  coverStyle: "split-bronze" | "blueprint-cad" | "minimalist-clean" | "industrial-bold";
  fontFamily: string;
  headingFont: string;
  tableHeaderBg: string;
  tableHeaderTextColor: string;
  tableBorderColor: string;
  tableZebraBg: string;
  badgeApprovedBg: string;
  badgeApprovedColor: string;
  badgeApprovedBorder: string;
  badgeRejectedBg: string;
  badgeRejectedColor: string;
  badgeRejectedBorder: string;
  badgePendingBg: string;
  badgePendingColor: string;
  badgePendingBorder: string;
  previewThumbnailColor: string;
  previewBorderColor: string;
  cssVariables: Record<string, string>;
}

export const WEEKLY_REPORT_TEMPLATES: Record<WeeklyReportTemplateId, WeeklyReportTemplateTheme> = {
  "classic-executive": {
    id: "classic-executive",
    name: "Corporate Executive",
    tagline: "Signature Prestige & Gold Dossier",
    description: "Classic corporate look with bronze/warm gold accents, deep navy typography, and dual-tone hero cover.",
    accentColor: "#c28b5e",
    accentDark: "#9a6538",
    accentLight: "#fbf6f0",
    primaryHeaderBg: "#0f172a",
    headerTextColor: "#ffffff",
    cardBg: "#ffffff",
    cardBorder: "#e2e8f0",
    cardRadius: "6px",
    badgeBg: "#0f172a",
    badgeTextColor: "#ffffff",
    badgeBorder: "#0f172a",
    ruleColor: "#c28b5e",
    coverStyle: "split-bronze",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    headingFont: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    tableHeaderBg: "#0f172a",
    tableHeaderTextColor: "#ffffff",
    tableBorderColor: "#e2e8f0",
    tableZebraBg: "#f8fafc",
    badgeApprovedBg: "#ecfdf5",
    badgeApprovedColor: "#059669",
    badgeApprovedBorder: "#a7f3d0",
    badgeRejectedBg: "#fef2f2",
    badgeRejectedColor: "#dc2626",
    badgeRejectedBorder: "#fecaca",
    badgePendingBg: "#f8fafc",
    badgePendingColor: "#64748b",
    badgePendingBorder: "#e2e8f0",
    previewThumbnailColor: "#c28b5e",
    previewBorderColor: "#d49a5b",
    cssVariables: {
      "--report-accent": "#c28b5e",
      "--report-accent-dark": "#9a6538",
      "--report-accent-light": "#fbf6f0",
      "--report-header-bg": "#0f172a",
      "--report-header-text": "#ffffff",
      "--report-border": "#e2e8f0",
      "--report-rule": "#c28b5e",
    },
  },

  "engineering-blueprint": {
    id: "engineering-blueprint",
    name: "Modern Blueprint",
    tagline: "Technical CAD & Engineering Azure",
    description: "A precision architectural aesthetic featuring technical cyan rules, dark blueprint header accents, and structural grid borders.",
    accentColor: "#0284c7",
    accentDark: "#0369a1",
    accentLight: "#f0f9ff",
    primaryHeaderBg: "#0c4a6e",
    headerTextColor: "#ffffff",
    cardBg: "#ffffff",
    cardBorder: "#bae6fd",
    cardRadius: "3px",
    badgeBg: "#0369a1",
    badgeTextColor: "#ffffff",
    badgeBorder: "#0284c7",
    ruleColor: "#0284c7",
    coverStyle: "blueprint-cad",
    fontFamily: "'Segoe UI', Roboto, -apple-system, sans-serif",
    headingFont: "'Segoe UI', Roboto, sans-serif",
    tableHeaderBg: "#0c4a6e",
    tableHeaderTextColor: "#ffffff",
    tableBorderColor: "#bae6fd",
    tableZebraBg: "#f0f9ff",
    badgeApprovedBg: "#ecfeff",
    badgeApprovedColor: "#0891b2",
    badgeApprovedBorder: "#a5f3fc",
    badgeRejectedBg: "#fff1f2",
    badgeRejectedColor: "#e11d48",
    badgeRejectedBorder: "#fecdd3",
    badgePendingBg: "#f8fafc",
    badgePendingColor: "#475569",
    badgePendingBorder: "#cbd5e1",
    previewThumbnailColor: "#0284c7",
    previewBorderColor: "#38bdf8",
    cssVariables: {
      "--report-accent": "#0284c7",
      "--report-accent-dark": "#0369a1",
      "--report-accent-light": "#f0f9ff",
      "--report-header-bg": "#0c4a6e",
      "--report-header-text": "#ffffff",
      "--report-border": "#bae6fd",
      "--report-rule": "#0284c7",
    },
  },

  "minimal-editorial": {
    id: "minimal-editorial",
    name: "Minimalist Editorial",
    tagline: "Swiss Clean Monochrome & Typography",
    description: "High-end Swiss editorial layout with charcoal accents, subtle hairline rules, generous white-space, and refined elegance.",
    accentColor: "#334155",
    accentDark: "#1e293b",
    accentLight: "#f8fafc",
    primaryHeaderBg: "#1e293b",
    headerTextColor: "#ffffff",
    cardBg: "#ffffff",
    cardBorder: "#cbd5e1",
    cardRadius: "0px",
    badgeBg: "#1e293b",
    badgeTextColor: "#ffffff",
    badgeBorder: "#1e293b",
    ruleColor: "#334155",
    coverStyle: "minimalist-clean",
    fontFamily: "system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
    headingFont: "system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
    tableHeaderBg: "#1e293b",
    tableHeaderTextColor: "#ffffff",
    tableBorderColor: "#e2e8f0",
    tableZebraBg: "#f8fafc",
    badgeApprovedBg: "#f1f5f9",
    badgeApprovedColor: "#0f172a",
    badgeApprovedBorder: "#94a3b8",
    badgeRejectedBg: "#fef2f2",
    badgeRejectedColor: "#b91c1c",
    badgeRejectedBorder: "#fca5a5",
    badgePendingBg: "#f8fafc",
    badgePendingColor: "#64748b",
    badgePendingBorder: "#e2e8f0",
    previewThumbnailColor: "#334155",
    previewBorderColor: "#64748b",
    cssVariables: {
      "--report-accent": "#334155",
      "--report-accent-dark": "#1e293b",
      "--report-accent-light": "#f8fafc",
      "--report-header-bg": "#1e293b",
      "--report-header-text": "#ffffff",
      "--report-border": "#cbd5e1",
      "--report-rule": "#334155",
    },
  },

  "industrial-safety": {
    id: "industrial-safety",
    name: "Industrial High-Vis",
    tagline: "Site Safety Amber & Charcoal Contrast",
    description: "Construction-grade visual format with high-contrast safety amber borders, bold uppercase typography, and prominent QA/QC status ribbons.",
    accentColor: "#d97706",
    accentDark: "#b45309",
    accentLight: "#fffbeb",
    primaryHeaderBg: "#18181b",
    headerTextColor: "#ffffff",
    cardBg: "#ffffff",
    cardBorder: "#fde68a",
    cardRadius: "8px",
    badgeBg: "#d97706",
    badgeTextColor: "#ffffff",
    badgeBorder: "#d97706",
    ruleColor: "#d97706",
    coverStyle: "industrial-bold",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    headingFont: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    tableHeaderBg: "#18181b",
    tableHeaderTextColor: "#fde047",
    tableBorderColor: "#fde68a",
    tableZebraBg: "#fffbeb",
    badgeApprovedBg: "#ecfdf5",
    badgeApprovedColor: "#047857",
    badgeApprovedBorder: "#6ee7b7",
    badgeRejectedBg: "#fef2f2",
    badgeRejectedColor: "#b91c1c",
    badgeRejectedBorder: "#f87171",
    badgePendingBg: "#fffbeb",
    badgePendingColor: "#92400e",
    badgePendingBorder: "#fde68a",
    previewThumbnailColor: "#d97706",
    previewBorderColor: "#f59e0b",
    cssVariables: {
      "--report-accent": "#d97706",
      "--report-accent-dark": "#b45309",
      "--report-accent-light": "#fffbeb",
      "--report-header-bg": "#18181b",
      "--report-header-text": "#ffffff",
      "--report-border": "#fde68a",
      "--report-rule": "#d97706",
    },
  },
};

export const DEFAULT_WEEKLY_REPORT_TEMPLATE: WeeklyReportTemplateId = "classic-executive";

export function getWeeklyReportTemplate(templateId?: string): WeeklyReportTemplateTheme {
  if (templateId && templateId in WEEKLY_REPORT_TEMPLATES) {
    return WEEKLY_REPORT_TEMPLATES[templateId as WeeklyReportTemplateId];
  }
  return WEEKLY_REPORT_TEMPLATES[DEFAULT_WEEKLY_REPORT_TEMPLATE];
}
