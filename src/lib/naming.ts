export const generateNcrNumber = (projectCode = "PRJ"): string => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `NCR-${projectCode ? `${projectCode}-` : ""}${rand}_${day}${month}${year}`;
};

export const generateInspectionNumber = (projectCode = "INSP"): string => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INSP_${rand}_${day}${month}${year}`;
};

export const generateWeeklyReportNumber = (prefix = "WQR"): string => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix || "WQR"}_${rand}_${day}${month}${year}`;
};

export type SiteInstructionFormat =
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
 * Searches for the maximum sequence number among existing instructions, even if
 * non-consecutive numbers exist or instructions have been deleted.
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
    const trailingMatch = num.match(/(?:[-/.#\s]|^)(\d{1,4})$/);
    if (trailingMatch && trailingMatch[1]) {
      const parsed = parseInt(trailingMatch[1], 10);
      // Avoid interpreting the year itself (e.g. 2026) as sequence number
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
 * Generates a formal, standardized Site Instruction reference number.
 * Default format: [PROJECT_CODE]-SI-[YEAR]-[SEQ]
 * e.g. "CDL-BS-SI-2026-001" or "SI-2026-001" (if no project code)
 */
export const generateSiteInstructionNumber = (
  options?: SiteInstructionNamingOptions,
): string => {
  const prefix = (options?.prefix || "SI").trim().toUpperCase();
  const projectCode = (options?.projectCode || "").trim().toUpperCase();
  const year = options?.year || new Date().getFullYear();
  const seq = String(options?.sequence || 1).padStart(3, "0");
  const format =
    options?.format || (projectCode ? "PROJECT_YEAR_SEQ" : "YEAR_SEQ");
  const sep = options?.delimiter || "-";

  switch (format) {
    case "PROJECT_YEAR_SEQ":
      return projectCode
        ? `${projectCode}${sep}${prefix}${sep}${year}${sep}${seq}`
        : `${prefix}${sep}${year}${sep}${seq}`;
    case "PROJECT_SEQ":
      return projectCode
        ? `${projectCode}${sep}${prefix}${sep}${seq}`
        : `${prefix}${sep}${seq}`;
    case "YEAR_SEQ":
      return `${prefix}${sep}${year}${sep}${seq}`;
    case "SIMPLE_SEQ":
      return `${prefix}${sep}${seq}`;
    default:
      return projectCode
        ? `${projectCode}${sep}${prefix}${sep}${year}${sep}${seq}`
        : `${prefix}${sep}${year}${sep}${seq}`;
  }
};

/**
 * Generates a formal, standardized Daily Site Log (Site Diary) reference number.
 * Format: DSL-[PROJECT_CODE]-[YYYYMMDD]-[SEQ]
 * e.g. "DSL-PRJ-20260916-01"
 */
export const generateDailyLogNumber = (
  projectCode = "PRJ",
  dateStr?: string,
  seq = 1,
): string => {
  const d = dateStr ? new Date(dateStr) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const cleanProj = (projectCode || "PRJ").trim().toUpperCase();
  const seqStr = String(seq).padStart(2, "0");
  return `DSL-${cleanProj}-${year}${month}${day}-${seqStr}`;
};

