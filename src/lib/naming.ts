import { useProjectStore } from "@/stores/useProjectStore";

/**
 * Universal Naming System for JQMS
 * Format: {projectcode}_{prefix}_{random()}_{ddmmyy}
 * Example: CDAS2_DOC_4821_251026
 * With extension: CDAS2_PHOTO_8912_251026.jpg
 */

export interface UniversalNamingOptions {
  date?: Date | string | number | null;
  extension?: string | null;
  randomDigits?: number;
  randomNumber?: number | string;
}

/**
 * Normalizes project code to uppercase alphanumeric string with hyphens/underscores.
 * Falls back to active project code in useProjectStore, or "PRJ".
 */
export const sanitizeProjectCode = (code?: string | null): string => {
  if (code && typeof code === "string" && code.trim()) {
    const cleaned = code
      .trim()
      .toUpperCase()
      .replace(/[\s/\\]+/g, "-")
      .replace(/[^A-Z0-9_-]/g, "");
    if (cleaned) return cleaned;
  }

  try {
    const activeCode = useProjectStore.getState()?.activeProject?.code;
    if (activeCode && typeof activeCode === "string" && activeCode.trim()) {
      const cleaned = activeCode
        .trim()
        .toUpperCase()
        .replace(/[\s/\\]+/g, "-")
        .replace(/[^A-Z0-9_-]/g, "");
      if (cleaned) return cleaned;
    }
  } catch {
    // Zustand store not initialized yet
  }

  return "PRJ";
};

/**
 * Formats a date into 2-digit day, 2-digit month, 2-digit year (ddmmyy).
 * e.g., 25 Oct 2026 -> "251026"
 */
export const formatDdmmyy = (
  dateInput?: Date | string | number | null,
): string => {
  const d = dateInput ? new Date(dateInput) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const day = String(validDate.getDate()).padStart(2, "0");
  const month = String(validDate.getMonth() + 1).padStart(2, "0");
  const year = String(validDate.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
};

/**
 * Generates an integer random string with a fixed number of digits (default: 4 digits, 1000 - 9999).
 */
export const generateRandomNumber = (digits = 4): string => {
  const safeDigits = Math.max(1, Math.min(10, digits));
  const min = Math.pow(10, safeDigits - 1);
  const max = Math.pow(10, safeDigits) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
};

/**
 * Central generator for the universal naming system:
 * {projectcode}_{prefix}_{random()}_{ddmmyy}
 */
export function generateUniversalName(
  projectCode?: string | null,
  prefix = "DOC",
  options?: UniversalNamingOptions,
): string {
  const cleanProj = sanitizeProjectCode(projectCode);
  const cleanPrefix =
    (prefix || "DOC")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, "") || "DOC";

  const rand =
    options?.randomNumber !== undefined
      ? String(options.randomNumber)
      : generateRandomNumber(options?.randomDigits || 4);

  const dateStr = formatDdmmyy(options?.date);

  const baseName = `${cleanProj}_${cleanPrefix}_${rand}_${dateStr}`;

  if (options?.extension) {
    const ext = options.extension.replace(/^\./, "").trim().toLowerCase();
    if (ext) {
      return `${baseName}.${ext}`;
    }
  }

  return baseName;
}

// ============================================================================
// Specialized Universal Domain Generators
// ============================================================================

export const generateNcrNumber = (
  projectCode?: string | null,
  date?: Date | string | number,
): string => {
  return generateUniversalName(projectCode, "NCR", { date });
};

export const generateInspectionNumber = (
  projectCode?: string | null,
  date?: Date | string | number,
): string => {
  return generateUniversalName(projectCode, "INSP", { date });
};

export const generateWeeklyReportNumber = (
  prefix = "WQR",
  projectCode?: string | null,
  date?: Date | string | number,
): string => {
  return generateUniversalName(projectCode, prefix || "WQR", { date });
};

export const generatePhotoName = (
  projectCode?: string | null,
  extension = "jpg",
  prefix = "PHOTO",
): string => {
  return generateUniversalName(projectCode, prefix, { extension });
};

export const generateDocumentName = (
  projectCode?: string | null,
  extension?: string,
  prefix = "DOC",
): string => {
  return generateUniversalName(projectCode, prefix, { extension });
};

export const generatePdfExportName = (
  projectCode?: string | null,
  prefix = "PDF",
  date?: Date | string | number,
): string => {
  return generateUniversalName(projectCode, prefix, { extension: "pdf", date });
};

export const generateRfiNumber = (
  projectCode?: string | null,
  date?: Date | string | number,
): string => {
  return generateUniversalName(projectCode, "RFI", { date });
};

export const generateMarNumber = (
  projectCode?: string | null,
  date?: Date | string | number,
): string => {
  return generateUniversalName(projectCode, "MAR", { date });
};

export const generateMirNumber = (
  projectCode?: string | null,
  date?: Date | string | number,
): string => {
  return generateUniversalName(projectCode, "MIR", { date });
};

export const generatePtpNumber = (
  projectCode?: string | null,
  date?: Date | string | number,
): string => {
  return generateUniversalName(projectCode, "PTP", { date });
};

export const generateCubeNumber = (
  projectCode?: string | null,
  date?: Date | string | number,
): string => {
  return generateUniversalName(projectCode, "CUBE", { date });
};

export const generateSteelNumber = (
  projectCode?: string | null,
  date?: Date | string | number,
): string => {
  return generateUniversalName(projectCode, "STL", { date });
};

export const generateSiteCommentNumber = (
  projectCode?: string | null,
  date?: Date | string | number,
): string => {
  return generateUniversalName(projectCode, "COM", { date });
};

export type SiteInstructionFormat =
  | "UNIVERSAL" // e.g. CDAS2_SI_4821_251026
  | "PROJECT_YEAR_SEQ" // e.g. CDL-BS-SI-2026-001
  | "PROJECT_SEQ" // e.g. CDL-BS-SI-001
  | "YEAR_SEQ" // e.g. SI-2026-001
  | "SIMPLE_SEQ"; // e.g. SI-001

export interface SiteInstructionNamingOptions {
  projectCode?: string;
  prefix?: string;
  year?: number;
  sequence?: number;
  format?: SiteInstructionFormat;
  delimiter?: "-" | "/" | ".";
}

/**
 * Parses existing site instructions to determine the next sequential number.
 * Searches for the maximum sequence number among existing instructions.
 */
export const getNextSiteInstructionSequence = (
  existingNumbers: (string | undefined | null)[],
  options?: { projectCode?: string; year?: number; prefix?: string },
): number => {
  if (!existingNumbers || existingNumbers.length === 0) return 1;

  let maxSeq = 0;
  const targetYear = options?.year || new Date().getFullYear();
  const yearStr = String(targetYear);

  for (const raw of existingNumbers) {
    if (!raw) continue;
    const num = raw.trim();

    // Check if there is a trailing number (e.g. SI-2026-003, CDL-BS-SI-004, SI/2026/012)
    const trailingMatch = num.match(/(?:[-/.#\s_]|^)(\d{1,4})$/);
    if (trailingMatch && trailingMatch[1]) {
      const parsed = parseInt(trailingMatch[1], 10);
      if (!isNaN(parsed) && parsed !== targetYear) {
        if (parsed > maxSeq) maxSeq = parsed;
        continue;
      }
    }

    // Fallback: search for sequence after prefix or year, e.g. SI-2026-005 or SI-005
    const seqMatch = num.match(
      /(?:SI|INSTR)[-_/.]?(?:(\d{4})[-_/.])?(\d{1,4})/i,
    );
    if (seqMatch) {
      const matchedYear = seqMatch[1];
      const parsed = parseInt(seqMatch[2], 10);
      if (!isNaN(parsed) && parsed !== targetYear) {
        if (!matchedYear || matchedYear === yearStr) {
          if (parsed > maxSeq) maxSeq = parsed;
        }
      }
    }
  }

  return maxSeq + 1;
};

/**
 * Generates a Site Instruction reference number.
 * Defaults to the universal format: {projectcode}_SI_{random()}_{ddmmyy}
 */
export const generateSiteInstructionNumber = (
  options?: SiteInstructionNamingOptions,
): string => {
  const prefix = (options?.prefix || "SI").trim().toUpperCase();
  const projectCode = options?.projectCode;
  const format = options?.format || "UNIVERSAL";

  if (format === "UNIVERSAL") {
    return generateUniversalName(projectCode, prefix);
  }

  const cleanProj = sanitizeProjectCode(projectCode);
  const year = options?.year || new Date().getFullYear();
  const seq = String(options?.sequence || 1).padStart(3, "0");
  const sep = options?.delimiter || "-";

  switch (format) {
    case "PROJECT_YEAR_SEQ":
      return `${cleanProj}${sep}${prefix}${sep}${year}${sep}${seq}`;
    case "PROJECT_SEQ":
      return `${cleanProj}${sep}${prefix}${sep}${seq}`;
    case "YEAR_SEQ":
      return `${prefix}${sep}${year}${sep}${seq}`;
    case "SIMPLE_SEQ":
      return `${prefix}${sep}${seq}`;
    default:
      return generateUniversalName(projectCode, prefix);
  }
};

/**
 * Generates a Daily Site Log reference number according to the universal naming system.
 * Format: {projectcode}_DSL_{random()}_{ddmmyy}
 */
export const generateDailyLogNumber = (
  projectCode = "PRJ",
  dateStr?: string,
  _seq = 1,
): string => {
  return generateUniversalName(projectCode, "DSL", { date: dateStr });
};


