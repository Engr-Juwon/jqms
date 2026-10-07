import { BBSItem } from "@/types";

/**
 * Standard nominal rebar weights per meter (kg/m) based on formula d^2 / 162.197
 * Density of steel = 7850 kg/m3 per BS 4449 / BS 8666
 */
export const REBAR_UNIT_WEIGHTS: Record<number, number> = {
  6: 0.222,
  8: 0.395,
  10: 0.617,
  12: 0.888,
  14: 1.208,
  16: 1.578,
  20: 2.466,
  25: 3.853,
  28: 4.834,
  32: 6.313,
  40: 9.864,
  50: 15.413,
};

export function getRebarUnitWeight(diameterMm: number): number {
  if (REBAR_UNIT_WEIGHTS[diameterMm]) {
    return REBAR_UNIT_WEIGHTS[diameterMm];
  }
  return Number(((diameterMm * diameterMm) / 162.197).toFixed(3));
}

export function parseDiameter(raw: string | number): number {
  if (typeof raw === "number") return raw;
  if (!raw) return 12;
  const clean = String(raw).trim().toUpperCase();
  // Strip Y, T, H, R, #, mm, DIA, etc. (e.g. T12 -> 12, Y16 -> 16, 12mm -> 12)
  const match = clean.match(/(\d+)/);
  if (match) {
    const d = parseInt(match[1], 10);
    return isNaN(d) || d <= 0 ? 12 : d;
  }
  return 12;
}

export function parseLength(raw: string | number): number {
  if (typeof raw === "number") return raw > 25 ? raw / 1000 : raw;
  if (!raw) return 0;
  const clean = String(raw)
    .trim()
    .replace(/[^\d.-]/g, "");
  const val = parseFloat(clean);
  if (isNaN(val) || val <= 0) return 0;
  // If the number is greater than 25, it's in millimeters (e.g. 5100mm = 5.1m, 3425mm = 3.425m)
  return val > 25 ? Number((val / 1000).toFixed(3)) : Number(val.toFixed(3));
}

export function parseDimension(raw?: string): number | undefined {
  if (!raw) return undefined;
  // Clean parentheses like (935) -> 935
  const clean = String(raw)
    .trim()
    .replace(/[^\d.-]/g, "");
  const val = parseFloat(clean);
  return isNaN(val) ? undefined : val;
}

export interface BBSMetadata {
  siteRef?: string;
  barScheduleRef?: string;
  datePrepared?: string;
  dateRevised?: string;
  preparedBy?: string;
  checkedBy?: string;
}

export interface BBSParseResult {
  items: BBSItem[];
  errors: string[];
  totalBars: number;
  totalWeightKg: number;
  diametersFound: number[];
  detectedHeaders: string[];
  metadata?: BBSMetadata;
}

/**
 * Intelligent parser for BS 8666 / BS 4466 BBS content
 * Handles direct PDF text streams, tab-delimited, CSV, or copied table rows.
 */
export function parseBBSContent(
  content: string,
  defaultGrade: string = "Grade 500B",
): BBSParseResult {
  const errors: string[] = [];
  const items: BBSItem[] = [];
  const metadata: BBSMetadata = {};

  if (!content || !content.trim()) {
    return {
      items: [],
      errors: ["File or pasted text is empty."],
      totalBars: 0,
      totalWeightKg: 0,
      diametersFound: [],
      detectedHeaders: [],
      metadata: {},
    };
  }

  // Normalize line breaks
  const rawLines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length === 0) {
    return {
      items: [],
      errors: ["No data rows found."],
      totalBars: 0,
      totalWeightKg: 0,
      diametersFound: [],
      detectedHeaders: [],
      metadata: {},
    };
  }

  // Step 1: Scan top lines for BS 8666 header metadata
  for (let i = 0; i < Math.min(15, rawLines.length); i++) {
    const line = rawLines[i];

    // Site ref : Kanike Close, 1st Floor Slab
    const siteMatch = line.match(/site\s*ref\s*[:\s]+([^|\t\n\r]+)/i);
    if (siteMatch && !metadata.siteRef) {
      metadata.siteRef = siteMatch[1].trim();
    }

    // Bar Schedule ref : 118 01
    const schedRefMatch = line.match(
      /bar\s*schedule\s*ref\s*[:\s]+([^|\t\n\r]+)/i,
    );
    if (schedRefMatch && !metadata.barScheduleRef) {
      metadata.barScheduleRef = schedRefMatch[1].trim();
    }

    // Date prepared 24.08.26
    const datePrepMatch = line.match(/date\s*prepared\s*[:\s]+([\d./-]+)/i);
    if (datePrepMatch && !metadata.datePrepared) {
      metadata.datePrepared = datePrepMatch[1].trim();
    }

    // Prepared by : TS
    const prepByMatch = line.match(
      /prepared\s*by\s*[:\s]+([A-Za-z0-9\s]+?)(?:checked|date|$)/i,
    );
    if (prepByMatch && !metadata.preparedBy) {
      metadata.preparedBy = prepByMatch[1].trim();
    }

    // Checked by : AA
    const chkByMatch = line.match(/checked\s*by\s*[:\s]+([A-Za-z0-9\s]+)/i);
    if (chkByMatch && !metadata.checkedBy) {
      metadata.checkedBy = chkByMatch[1].trim();
    }
  }

  // Step 2: Detect delimiter
  let delimiter = ",";
  const testSample = rawLines.slice(0, 10).join("\n");
  if (testSample.includes("\t")) {
    delimiter = "\t";
  } else if (testSample.includes("|")) {
    delimiter = "|";
  } else if (testSample.includes(";") && !testSample.includes(",")) {
    delimiter = ";";
  } else if (testSample.includes(",")) {
    delimiter = ",";
  } else if (/\s{2,}/.test(testSample)) {
    delimiter = "MULTISPACE";
  } else {
    delimiter = "SPACE";
  }

  // Helper to split row respecting quotes or spaces from PDF
  const splitRow = (row: string): string[] => {
    if (delimiter === "\t") {
      return row.split("\t").map((c) => c.trim().replace(/^["']|["']$/g, ""));
    }
    if (delimiter === "|") {
      return row.split("|").map((c) => c.trim().replace(/^["']|["']$/g, ""));
    }
    if (delimiter === "MULTISPACE") {
      return row
        .split(/\s{2,}/)
        .map((c) => c.trim().replace(/^["']|["']$/g, ""));
    }
    if (delimiter === "SPACE") {
      return row.split(/\s+/).map((c) => c.trim().replace(/^["']|["']$/g, ""));
    }
    // Standard CSV split
    const res: string[] = [];
    let inQuote = false;
    let token = "";
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"' || char === "'") {
        inQuote = !inQuote;
      } else if (char === delimiter && !inQuote) {
        res.push(token.trim().replace(/^["']|["']$/g, ""));
        token = "";
      } else {
        token += char;
      }
    }
    res.push(token.trim().replace(/^["']|["']$/g, ""));
    return res;
  };

  // Step 3: Find Table Header Line
  let headerRowIndex = -1;
  let memberIdx = -1;
  let markIdx = -1;
  let diaIdx = -1;
  let cutLenIdx = -1;
  let noMembersIdx = -1;
  let barsPerMemberIdx = -1;
  let totalBarsIdx = -1;
  let shapeIdx = -1;
  let gradeIdx = -1;
  let dimAIdx = -1;
  let dimBIdx = -1;
  let dimCIdx = -1;
  let dimDIdx = -1;
  let dimEIdx = -1;
  let revIdx = -1;
  let detectedHeaders: string[] = [];

  for (let r = 0; r < Math.min(15, rawLines.length); r++) {
    const tokens = splitRow(rawLines[r]).map((t) => t.toLowerCase());
    const hasMark = tokens.some(
      (t) => t.includes("mark") || t.includes("tag") || t.includes("pos"),
    );
    const hasLenOrDia = tokens.some(
      (t) =>
        t.includes("length") ||
        t.includes("size") ||
        t.includes("dia") ||
        t.includes("shape") ||
        t.includes("type"),
    );

    if (hasMark && hasLenOrDia) {
      headerRowIndex = r;
      detectedHeaders = tokens;

      for (let i = 0; i < tokens.length; i++) {
        const h = tokens[i];
        if (
          h.includes("member") ||
          h.includes("element") ||
          h.includes("location")
        ) {
          memberIdx = i;
        } else if (
          h.includes("bar mark") ||
          (h.includes("mark") && !h.includes("remark"))
        ) {
          markIdx = i;
        } else if (
          h.includes("type and size") ||
          h.includes("type & size") ||
          h.includes("size") ||
          h.includes("dia") ||
          h.includes("phi")
        ) {
          diaIdx = i;
        } else if (
          h.includes("no of mbr") ||
          h.includes("no of mem") ||
          h.includes("no. of member") ||
          h.includes("no of member")
        ) {
          noMembersIdx = i;
        } else if (
          h.includes("bars in each") ||
          h.includes("bars per") ||
          h.includes("no of bar") ||
          h.includes("per member")
        ) {
          barsPerMemberIdx = i;
        } else if (
          h.includes("total no") ||
          h.includes("total bar") ||
          h.includes("qty") ||
          h.includes("total qty")
        ) {
          totalBarsIdx = i;
        } else if (
          h.includes("length of each") ||
          h.includes("cut length") ||
          h.includes("length") ||
          h.includes("len") ||
          h.includes("l(m)") ||
          h.includes("l(mm)")
        ) {
          cutLenIdx = i;
        } else if (
          h.includes("shape code") ||
          h.includes("shape") ||
          h.includes("code") ||
          h.includes("bend shape")
        ) {
          shapeIdx = i;
        } else if (
          h.includes("grade") ||
          h.includes("type") ||
          h.includes("steel")
        ) {
          gradeIdx = i;
        } else if (
          h === "a*" ||
          h === "a" ||
          h.startsWith("a*") ||
          h.startsWith("a mm") ||
          h.startsWith("a (mm)")
        ) {
          dimAIdx = i;
        } else if (
          h === "b*" ||
          h === "b" ||
          h.startsWith("b*") ||
          h.startsWith("b mm") ||
          h.startsWith("b (mm)")
        ) {
          dimBIdx = i;
        } else if (
          h === "c*" ||
          h === "c" ||
          h.startsWith("c*") ||
          h.startsWith("c mm") ||
          h.startsWith("c (mm)")
        ) {
          dimCIdx = i;
        } else if (
          h === "d*" ||
          h === "d" ||
          h.startsWith("d*") ||
          h.startsWith("d mm") ||
          h.startsWith("d (mm)")
        ) {
          dimDIdx = i;
        } else if (h.includes("e/r") || h === "e*" || h === "e") {
          dimEIdx = i;
        } else if (h.includes("rev")) {
          revIdx = i;
        }
      }
      break;
    }
  }

  // Fallback indices if standard headers were not explicitly titled
  const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;
  if (memberIdx === -1) memberIdx = 0;
  if (markIdx === -1) markIdx = 1;
  if (diaIdx === -1) diaIdx = 2;
  if (noMembersIdx === -1) noMembersIdx = 3;
  if (barsPerMemberIdx === -1) barsPerMemberIdx = 4;
  if (totalBarsIdx === -1) totalBarsIdx = 5;
  if (cutLenIdx === -1) cutLenIdx = 6;
  if (shapeIdx === -1) shapeIdx = 7;
  if (dimAIdx === -1) dimAIdx = 8;
  if (dimBIdx === -1) dimBIdx = 9;
  if (dimCIdx === -1) dimCIdx = 10;

  const diametersSet = new Set<number>();
  let activeMember = metadata.siteRef || "First Floor Slab Details";

  for (let r = startRow; r < rawLines.length; r++) {
    const cols = splitRow(rawLines[r]);
    if (cols.length < 3 || cols.every((c) => !c)) continue;

    // Carry forward member name across rows (BS 8666 standard convention)
    const rawMemberCol = cols[memberIdx]?.trim();
    if (rawMemberCol && isNaN(Number(rawMemberCol))) {
      activeMember = rawMemberCol;
    }
    const member = activeMember;

    // Bar mark
    const mark =
      cols[markIdx]?.trim() || String(items.length + 1).padStart(2, "0");

    // Skip summary / total rows
    if (
      mark.toLowerCase().includes("total") ||
      mark.toLowerCase().includes("summary") ||
      mark.toLowerCase().includes("weight")
    ) {
      continue;
    }

    // Diameter & Steel Grade
    const rawDia = cols[diaIdx]?.trim() || "T12";
    const diameter = parseDiameter(rawDia);
    let steelGrade = defaultGrade;
    if (
      rawDia.toUpperCase().includes("T") ||
      (gradeIdx !== -1 && cols[gradeIdx]?.toUpperCase().includes("500"))
    ) {
      steelGrade = "Grade 500B (T)";
    } else if (rawDia.toUpperCase().includes("Y")) {
      steelGrade = "Grade 460B (Y)";
    }

    // Quantities
    let noOfMembers = 1;
    let barsPerMember = 1;
    let totalBars = 0;

    if (noMembersIdx !== -1 && cols[noMembersIdx]) {
      const parsed = parseInt(cols[noMembersIdx].replace(/[^\d]/g, ""), 10);
      if (!isNaN(parsed) && parsed > 0) noOfMembers = parsed;
    }

    if (barsPerMemberIdx !== -1 && cols[barsPerMemberIdx]) {
      const parsed = parseInt(cols[barsPerMemberIdx].replace(/[^\d]/g, ""), 10);
      if (!isNaN(parsed) && parsed > 0) barsPerMember = parsed;
    }

    if (totalBarsIdx !== -1 && cols[totalBarsIdx]) {
      const parsed = parseInt(cols[totalBarsIdx].replace(/[^\d]/g, ""), 10);
      if (!isNaN(parsed) && parsed > 0) totalBars = parsed;
    }

    if (totalBars <= 0) {
      totalBars = noOfMembers * barsPerMember;
    }

    // Cut length in meters
    const rawLen = cols[cutLenIdx]?.trim() || "0";
    const cutLengthM = parseLength(rawLen);

    if (cutLengthM <= 0) {
      errors.push(
        `Row ${r + 1} (Mark ${mark}): Invalid cut length "${rawLen}". Skipped.`,
      );
      continue;
    }

    // Shape Code
    let rawShape =
      shapeIdx !== -1 && cols[shapeIdx] ? cols[shapeIdx].trim() : "20";
    let shapeCode = rawShape;
    if (rawShape === "20") shapeCode = "20 (Straight)";
    else if (rawShape === "39") shapeCode = "39 (Cranked/Bobbed)";
    else if (rawShape === "00") shapeCode = "00 (Straight)";
    else if (rawShape === "21") shapeCode = "21 (L-Bar)";
    else if (rawShape === "51") shapeCode = "51 (Link/Stirrup)";
    else if (rawShape === "11") shapeCode = "11 (U-Bar)";

    const dimA = parseDimension(cols[dimAIdx]);
    const dimB = parseDimension(cols[dimBIdx]);
    const dimC = parseDimension(cols[dimCIdx]);
    const dimD = parseDimension(cols[dimDIdx]);
    const dimE = parseDimension(cols[dimEIdx]);

    diametersSet.add(diameter);
    const unitWeight = getRebarUnitWeight(diameter);
    const totalLengthM = Number((totalBars * cutLengthM).toFixed(3));
    const totalWeightKg = Number((totalLengthM * unitWeight).toFixed(2));

    items.push({
      id: `bbs-item-${Date.now()}-${r}-${Math.floor(Math.random() * 1000)}`,
      member,
      barMark: mark,
      diameter,
      steelGrade,
      noOfMembers,
      barsPerMember,
      totalBars,
      cutLengthM,
      shapeCode,
      dimensions: {
        a: dimA,
        b: dimB,
        c: dimC,
        d: dimD,
        e: dimE,
      },
      totalLengthM,
      unitWeightKgM: unitWeight,
      totalWeightKg,
    });
  }

  const totalBarsCount = items.reduce((sum, item) => sum + item.totalBars, 0);
  const totalWeight = Number(
    items.reduce((sum, item) => sum + item.totalWeightKg, 0).toFixed(2),
  );

  return {
    items,
    errors,
    totalBars: totalBarsCount,
    totalWeightKg: totalWeight,
    diametersFound: Array.from(diametersSet).sort((a, b) => a - b),
    detectedHeaders,
    metadata,
  };
}

/**
 * Pre-formatted sample BS 8666 BBS CSV generator
 * Exactly matches the company format from Kanike Close, 1st Floor Slab
 */
export function generateSampleBBSCSV(): string {
  const headers = [
    "Member",
    "Bar Mark",
    "Type and Size",
    "No of mbrs",
    "No of bars in each",
    "Total No",
    "Length of each bar mm +",
    "Shape Code",
    "A* mm",
    "B* mm",
    "C* mm",
    "D* mm",
    "E/R * mm",
    "Rev Letter",
  ];

  const sampleRows = [
    [
      "First Floor Slab Details",
      "17",
      "T12",
      "1",
      "124",
      "124",
      "5100",
      "20",
      "5100",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "",
      "18",
      "T12",
      "1",
      "124",
      "124",
      "6400",
      "20",
      "6400",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "",
      "19",
      "T12",
      "1",
      "69",
      "69",
      "7600",
      "39",
      "6575",
      "150",
      "(935)",
      "",
      "",
      "",
    ],
    [
      "",
      "20",
      "T12",
      "1",
      "49",
      "49",
      "6600",
      "20",
      "6600",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "",
      "21",
      "T12",
      "1",
      "170",
      "170",
      "3425",
      "20",
      "3425",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "",
      "22",
      "T12",
      "1",
      "85",
      "85",
      "2800",
      "20",
      "2800",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "",
      "24",
      "T12",
      "1",
      "124",
      "124",
      "3275",
      "20",
      "3275",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "",
      "25",
      "T12",
      "1",
      "124",
      "124",
      "3350",
      "20",
      "3350",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "",
      "26",
      "T12",
      "1",
      "56",
      "56",
      "2550",
      "20",
      "2550",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "",
      "27",
      "T12",
      "1",
      "56",
      "56",
      "3150",
      "20",
      "3150",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "",
      "28",
      "T12",
      "1",
      "56",
      "56",
      "2550",
      "20",
      "2550",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "",
      "29",
      "T12",
      "1",
      "76",
      "76",
      "3025",
      "20",
      "3025",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "",
      "33",
      "T12",
      "1",
      "34",
      "34",
      "3150",
      "20",
      "3150",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "",
      "34",
      "T12",
      "1",
      "42",
      "42",
      "2625",
      "39",
      "1875",
      "150",
      "(665)",
      "",
      "",
      "",
    ],
    [
      "",
      "35",
      "T12",
      "1",
      "14",
      "14",
      "2625",
      "39",
      "1935",
      "150",
      "(600)",
      "",
      "",
      "",
    ],
    [
      "",
      "36",
      "T12",
      "1",
      "61",
      "61",
      "4350",
      "39",
      "3505",
      "150",
      "(755)",
      "",
      "",
      "",
    ],
  ];

  const metadataHeader = [
    "Bar Schedule ref : 118 01",
    "Site ref : Kanike Close, 1st Floor Slab",
    "Date prepared : 24.08.26",
    "Prepared by : TS    Checked by : AA",
    "",
  ].join("\n");

  const csvRows = [
    headers.join(","),
    ...sampleRows.map((r) => r.join(",")),
  ].join("\n");
  return `${metadataHeader}${csvRows}`;
}
