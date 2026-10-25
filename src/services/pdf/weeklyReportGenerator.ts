// services/pdf/weeklyReportGenerator.ts
import { WeeklyReport } from "@/types";
import { generateUniversalName } from "@/lib/naming";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { StructuralElementRow } from "./newReportGen";

// ==========================================
// INTERFACES
// ==========================================

export interface InspectionStat {
  total: number;
  passed: number;
  failed: number;
  pending: number;
}

export interface NCRStat {
  opened: number;
  closed: number;
  openTotal: number;
}

export interface FindingStat {
  opened: number;
  closed: number;
  openTotal: number;
}

export interface CubeTestRow {
  sn?: number;
  dateCast?: string;
  element?: string;
  strength7Days?: string;
  status7Days?: "Passed" | "Failed" | "Pending" | string;
  strength28Days?: string;
  status28Days?: "Passed" | "Failed" | "Pending" | string;
  inscribedName?: string;
  sampleId?: string;
  cubeId?: string;
  elementLevel?: string;
  [key: string]: any;
}

export interface QuantitySummaryRow {
  element: string;
  scopeCum: number;
  completionPercentage: number;
}

export interface ElementCastingRow {
  elementName: string;
  status:
    | "Completed"
    | "Rebar in progress"
    | "Form-work in progress"
    | "Ready for casting"
    | "Hold"
    | "Balance";
}

export interface MaterialDeliveryRow {
  date?: string;
  deliveryDate?: string;
  material?: string;
  materialName?: string;
  materialDescription?: string;
  source?: string;
  supplier?: string;
  supplierName?: string;
  quantity?: string | number;
  quantityReceived?: number | string;
  quantityAccepted?: number | string;
  quantityRejected?: number | string;
  unit?: string;
  batchNumber?: string;
  deliveryNoteNumber?: string;
  ncrNumber?: string;
  qcStatus?: "APPROVED" | "REJECTED" | "PENDING" | string;
  status?: string;
  qaqcStatus?: string;
  remarks?: string;
  qaqcRemarks?: string;
  rejectionReason?: string;
  [key: string]: any;
}

export interface NcrRemediationRow {
  refNo: string;
  dateIdentified: string;
  elementLevel: string;
  errorCategory: string;
  description: string;
  riskLevel: "H" | "M" | "L";
  assignedTo: string;
  targetFixDate: string;
  status: "OPEN" | "CLOSED" | "UNDER REVIEW";
}

export interface PictorialAsset {
  url: string;
  caption: string;
}

export interface SiteCommentRow {
  date: string;
  reportNumber: string;
  inspector: string;
  level: string;
  location: string;
  element: string;
  status: "Compliant" | "Action Required" | "Pending" | "Under Review" | string;
  comments: string;
  commentItems?: string[];
}

export interface MepClearanceRow {
  elementService: string;
  subcontractor: string;
  completionPct: number;
  status: "PENDING" | "IN PROGRESS" | "APPROVED" | "HOLD" | "REJECTED";
  remarks: string;
}

export interface PreparedByInfo {
  name: string;
  email: string;
  designation?: string;
  role?: string;
}

export interface WeeklyReportData {
  reportNumber: string;
  title: string;
  projectName: string;
  projectAddress?: string;
  companyName: string;
  weekStart: string;
  weekEnd: string;
  preparedBy: PreparedByInfo;
  executiveSummary: string;
  synopsis?: string;
  highlights?: string;
  concerns?: string;
  nextWeekPlan?: string;
  overallQualityCompliance?: number | string;
  overallQuantityCompletion?: number | string;
  remediationSummaryText?: string;
  coverImageBase64: string;
  selectedLevel: string;
  selectedLevelId?: string;

  beamLayoutImg?: string;
  columnLayoutImg?: string;
  slabImg?: string;
  pictorialUrls?: PictorialAsset[];

  inspectionStats: InspectionStat;
  ncrStats: NCRStat;
  findingStats: FindingStat;
  cubeTests?: CubeTestRow[];
  quantitySummary?: QuantitySummaryRow[];
  castingStatusList?: ElementCastingRow[];
  materialDeliveries?: MaterialDeliveryRow[];
  ncrRemediationLog?: NcrRemediationRow[];
  siteComments?: SiteCommentRow[];
  mepClearance?: MepClearanceRow[];
  structuralElements?: StructuralElementRow[];
  logoBase64?: string;
  [key: string]: any;
}

// ==========================================
// FALLBACK ASSETS
// ==========================================

const FALLBACK_COMPANY_LOGO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAMAAABwKC9UAAAASFBMVEUAAAD///8Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas2WCHg1AAAAFnRSTlMAgDAwQEBAQGBgcHCAgIDAwMDQ0NDY2K99BgAAAAlJREFUaN7t2tlywyAMQBFbYsc97///bAtOC0mGgG069S7z6iSOfgIkS6K6u7u7u7v7P7skms7z9X68m9Z0mctpXbWmWvN0X67b7XhdF8W6S3XvSscscK9KxyxwSyrscMAs6bDDgVpSZUdClpTZ0ZAlZXY0ZEmZHQ1ZUmZHQ5aU2dGQJWV2NGRJmR0NWVJmR0OWlNnRkCVldjRkSXMpI0OalJHxiBlf9w8wXh7wM079PCHm89KAn69rw37+vA7858cbwX8+bxf+87mF4D9fWw3+87XN4D9f7wb/eR9u9CfcCENgCIbAEAyBIRgCQzAEhmAIDMEQGIIhMARDoAnvX67N6/w8m87VvC3rvGzL7bgt++O2pX8CChgN7Zg670gAAAAASUVORK5CYII=";

// ==========================================
// IMAGE COMPRESSION HELPER
// ==========================================

/**
 * Compresses an image by resizing to max dimension and reducing JPEG quality.
 * Handles both HTTP URLs and base64 data URLs.
 */
const compressImage = async (
  imageUrl: string,
  maxWidth: number = 2800,
  quality: number = 0.92,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // Scale down only if exceeding ultra-high max dimension
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxWidth) {
        width = Math.round((width * maxWidth) / height);
        height = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Export at high-fidelity quality
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      // If compression fails, return original
      resolve(imageUrl);
    };
    img.src = imageUrl;
  });
};

// ==========================================
// MODULE-LEVEL HELPER FUNCTIONS
// ==========================================

/**
 * Renders a high-impact, professional closing slide for the presentation.
 */
const renderClosingSlide = (
  doc: jsPDF,
  projectName: string,
  preparedBy: PreparedByInfo,
  logoUrl?: string,
  companyName?: string,
) => {
  const margin = 20;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 15, pageHeight, "F");

  if (logoUrl) {
    try {
      const format = logoUrl.startsWith("data:image/jpeg") || logoUrl.endsWith(".jpg") || logoUrl.endsWith(".jpeg") ? "JPEG" : "PNG";
      doc.addImage(logoUrl, format, pageWidth - 45, 15, 30, 30);
    } catch (logoErr) {
      console.warn("Closing slide logo render skipped:", logoErr);
    }
  }

  doc.setFont("helvetica", "bold").setFontSize(40);
  doc.setTextColor(15, 23, 42);
  doc.text("THANK YOU", margin + 15, 80);

  doc.setFont("helvetica", "normal").setFontSize(18);
  doc.setTextColor(100, 116, 139);
  doc.text(projectName.toUpperCase(), margin + 15, 95);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 15, 120, margin + 100, 120);

  doc.setFontSize(10).setTextColor(15, 23, 42);
  doc.text("Report prepared by:", margin + 15, 135);
  doc.setFont("helvetica", "bold").text(preparedBy.name, margin + 15, 142);
  doc.setFont("helvetica", "normal").text(preparedBy.email, margin + 15, 148);

  doc.setFillColor(15, 23, 42);
  doc.rect(0, pageHeight - 20, pageWidth, 20, "F");

  doc.setFontSize(8).setTextColor(148, 163, 184);
  doc.text(
    `CONFIDENTIAL | ${new Date().getFullYear()} | ${companyName?.toUpperCase()}`,
    margin + 15,
    pageHeight - 8,
  );
};

const drawStructuralElementsTable = (
  doc: jsPDF,
  elements: StructuralElementRow[],
  elementType: string,
  margin: number,
  contentWidth: number,
  pageHeight: number,
  applySlideTemplate: (title: string) => void,
  createNewSlide: (title: string) => void,
  renderNoDataNotice: (x: number, y: number, textWidth?: number) => void,
  slideNumberRef: { current: number },
) => {
  const thH = 8;
  const rowH = 8;

  const cols = [55, 50, 45, 45, 45];
  const headers = [
    "ELEMENT NAME",
    "GRID LOCATION",
    "CALC. VOLUME (CUM)",
    "ACHIEVED (CUM)",
    "COMPLETION %",
  ];

  let tableY = 26;

  // Header
  doc.setFillColor(15, 23, 42).rect(margin, tableY, contentWidth, thH, "F");
  doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(255, 255, 255);

  let currX = margin;
  headers.forEach((h, idx) => {
    doc.text(h, currX + 3, tableY + 5.5);
    currX += cols[idx];
  });
  tableY += thH;

  if (elements.length > 0) {
    elements.forEach((el, rIdx) => {
      const calcVol =
        parseFloat(String(el.calculatedVolume || el.volume || 0)) || 0;

      // Safely handle missing/alternative spellings (treating them as 0)
      const achievedVol =
        parseFloat(
          String(
            el.achievedVolume ??
              el.arcvievedVolume ??
              el.achieved ??
              el.completedVolume ??
              0,
          ),
        ) || 0;

      const completionPct =
        calcVol > 0
          ? Math.round((achievedVol / calcVol) * 100)
          : el.completionPercentage || el.completion || 0;

      // Check page overflow
      if (tableY + rowH > pageHeight - 20) {
        doc.addPage();
        slideNumberRef.current++;
        applySlideTemplate(`${elementType} Structural Elements (Cont'd)`);
        tableY = 26;

        // Redraw header
        doc
          .setFillColor(15, 23, 42)
          .rect(margin, tableY, contentWidth, thH, "F");
        doc
          .setFont("helvetica", "bold")
          .setFontSize(8.5)
          .setTextColor(255, 255, 255);
        let hX = margin;
        headers.forEach((h, idx) => {
          doc.text(h, hX + 3, tableY + 5.5);
          hX += cols[idx];
        });
        tableY += thH;
      }

      doc
        .setFillColor(
          rIdx % 2 === 0 ? 255 : 248,
          rIdx % 2 === 0 ? 255 : 250,
          rIdx % 2 === 0 ? 255 : 252,
        )
        .rect(margin, tableY, contentWidth, rowH, "F");
      doc
        .setDrawColor(241, 245, 249)
        .setLineWidth(0.2)
        .rect(margin, tableY, contentWidth, rowH, "S");

      let rX = margin;

      // Element Name Priority Lookup
      const elementName = (
        (el as any).elementName ||
        (el as any).element ||
        el.id ||
        "Unknown"
      ).toUpperCase();

      const values = [
        elementName,
        el.gridLocation || el.grid || "—",
        calcVol > 0 ? calcVol.toFixed(2) : "—",
        achievedVol > 0 ? achievedVol.toFixed(2) : "0.00",
        `${completionPct}%`,
      ];

      values.forEach((v, vIdx) => {
        if (vIdx === 4) {
          // Completion % color coding
          const pct = parseInt(String(v).replace("%", ""), 10) || 0;
          if (pct === 100) {
            doc.setFont("helvetica", "bold").setTextColor(22, 163, 74);
          } else if (pct > 0) {
            doc.setFont("helvetica", "bold").setTextColor(245, 158, 11);
          } else {
            doc.setFont("helvetica", "normal").setTextColor(148, 163, 184);
          }
        } else {
          doc.setFont("helvetica", "normal").setTextColor(51, 65, 85);
        }
        doc.text(String(v || "-"), rX + 3, tableY + 5.2);
        rX += cols[vIdx];
      });
      tableY += rowH;
    });

    // Total row calculation
    const totalCalcVol = elements.reduce((sum, el) => {
      return (
        sum + (parseFloat(String(el.calculatedVolume || el.volume || 0)) || 0)
      );
    }, 0);

    const totalAchieved = elements.reduce((sum, el) => {
      return (
        sum +
        (parseFloat(
          String(
            el.achievedVolume ??
              el.arcvievedVolume ??
              el.achieved ??
              el.completedVolume ??
              0,
          ),
        ) || 0)
      );
    }, 0);

    const totalCompletion =
      totalCalcVol > 0 ? Math.round((totalAchieved / totalCalcVol) * 100) : 0;

    doc
      .setFillColor(248, 250, 252)
      .rect(margin, tableY, contentWidth, rowH, "F");
    doc
      .setDrawColor(226, 232, 240)
      .rect(margin, tableY, contentWidth, rowH, "S");
    doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(15, 23, 42);

    let tX = margin;
    doc.text("TOTAL", tX + 3, tableY + 5.5);
    tX += cols[0] + cols[1];
    doc.text(totalCalcVol.toFixed(2), tX + 3, tableY + 5.5);
    tX += cols[2];
    doc.text(totalAchieved.toFixed(2), tX + 3, tableY + 5.5);
    tX += cols[3];

    // Proper color logic for total completion
    if (totalCompletion === 100) {
      doc.setTextColor(22, 163, 74);
    } else if (totalCompletion > 0) {
      doc.setTextColor(245, 158, 11);
    } else {
      doc.setTextColor(148, 163, 184);
    }
    doc.text(`${totalCompletion}%`, tX + 3, tableY + 5.5);
  } else {
    doc
      .setDrawColor(241, 245, 249)
      .rect(margin, tableY, contentWidth, rowH, "S");
    renderNoDataNotice(margin + 5, tableY + 5.5);
  }
};

/**
 * Generates the formal NCR and Remediation Log Table
 * Dynamically pulling from open site notes to prevent data mismatches
 */
// export function generateNCRLogTable(doc: jsPDF, report: WeeklyReport, margin: number, contentWidth: number) {
//   // 1. Gather any hardcoded NCRs if they exist
//   const formalNCRs = report.ncrRows || [];

//   // 2. Scan Inspection Notes for any unresolved issues (Pending Fix / Action Required)
//   const dynamicNCRsFromNotes = (report.inspectionNotes || [])
//     .filter(note => note.status === "Pending Fix" || note.status === "Action Required")
//     .map((note, index) => ({
//       sn: formalNCRs.length + index + 1,
//       date: note.date || report.reportDate,
//       location: note.location,
//       description: note.comments || note.observation,
//       risk: note.status === "Pending Fix" ? "High" : "Medium",
//       owner: note.inspector || "Site Engineer / CM",
//       status: note.status
//     }));

//   // 3. Combine both lists into a single source of truth
//   const combinedNCRLog = [...formalNCRs, ...dynamicNCRsFromNotes];

//   // 4. Update the document metrics on the fly so the Dashboard Summary matches
//   if (report.summaryMetrics) {
//     report.summaryMetrics.openNCRs = combinedNCRLog.length;
//   }

//   // 5. Render the table
//   if (combinedNCRLog.length === 0) {
//     // Fallback if site is 100% compliant
//     doc.setFont("helvetica", "italic").setFontSize(10).setTextColor(100);
//     doc.text("No open non-conformances recorded for this evaluation window.", margin + 5, doc.internal.pageSize.getHeight() / 2);
//     return;
//   }

//   const tableBody = combinedNCRLog.map(row => [
//     `NCR-${row.date.replace(/-/g, "")}-${row.sn}`,
//     row.date,
//     row.location,
//     row.description,
//     row.risk,
//     row.owner,
//     row.status
//   ]);

//   autoTable(doc, {
//     startY: doc.previousAutoTable ? doc.previousAutoTable.finalY + 10 : 35,
//     margin: { left: margin, right: margin },
//     head: [["NCR REF", "DATE", "LOCATION", "NON-CONFORMANCE / OBSERVATION", "RISK", "OWNER", "STATUS"]],
//     body: tableBody,
//     theme: "striped",
//     headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold" },
//     columnStyles: {
//       0: { cellWidth: 25 }, // Ref
//       1: { cellWidth: 22 }, // Date
//       2: { cellWidth: 35 }, // Location
//       3: { cellWidth: "auto" }, // Description expands
//       4: { cellWidth: 18 }, // Risk
//       5: { cellWidth: 25 }, // Owner
//       6: { cellWidth: 25 }  // Status
//     },
//     didParseCell: (data) => {
//       // Color-code the Status cell for quick execution review
//       if (data.column.index === 6) {
//         const val = data.cell.raw;
//         if (val === "Pending Fix") data.cell.styles.textColor = [220, 38, 38]; // Red
//         if (val === "Action Required") data.cell.styles.textColor = [217, 119, 6]; // Amber
//       }
//     }
//   });
// }

// ==========================================
// MAIN PDF GENERATOR FUNCTION
// ==========================================

export async function generateNewWeeklyPresentationPDF(
  report: WeeklyReportData,
  options?: { returnBase64?: boolean; saveFile?: boolean },
): Promise<string | void> {
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "landscape",
    compress: true,
  });
  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const endX = margin + contentWidth;

  let slideNumber = 1;
  const slideNumberRef = { current: slideNumber };

  const applySlideTemplate = (titleText: string) => {
    const headerLogoW = 20;
    const headerLogoH = 12;

    try {
      doc.addImage(
        report.logoBase64 || FALLBACK_COMPANY_LOGO,
        "PNG",
        margin,
        3,
        headerLogoW,
        headerLogoH,
      );
    } catch (e) {
      // ignore
    }

    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(100, 116, 139);
    doc.text(
      `${report.weekEnd || "N/A"}  |  QAQC REPORT  |  ${titleText.toUpperCase()}`,
      margin + headerLogoW + 4,
      11,
    );

    doc
      .setFont("helvetica", "normal")
      .setFontSize(8)
      .setTextColor(148, 163, 184);
    doc.text(
      `${(report.projectName || "N/A").toUpperCase()} PROJECT  |  CONFIDENTIAL`,
      endX,
      11,
      { align: "right" },
    );

    doc.setDrawColor(226, 232, 240).setLineWidth(0.4);
    doc.line(margin, 16, endX, 16);

    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(15, 23, 42);
    doc.text(String(slideNumber).padStart(2, "0"), endX, pageHeight - 10, {
      align: "right",
    });

    doc
      .setFont("helvetica", "normal")
      .setFontSize(7)
      .setTextColor(148, 163, 184);
    doc.text(
      `Prepared By: ${report.preparedBy?.name || "Unassigned Operations Officer"}${report.preparedBy?.designation ? ` (${report.preparedBy.designation})` : report.preparedBy?.role ? ` (${report.preparedBy.role})` : " — QAQC Engineering Division"}`,
      margin,
      pageHeight - 10,
    );
  };

  const createNewSlide = (titleText: string) => {
    doc.addPage();
    slideNumber++;
    applySlideTemplate(titleText);
  };

  const renderNoDataNotice = (
    x: number,
    y: number,
    textWidth: number = contentWidth - 10,
  ) => {
    doc
      .setFont("helvetica", "italic")
      .setFontSize(9.5)
      .setTextColor(148, 163, 184);
    doc.text(
      "[No data recorded for the current tracking evaluation window]",
      x,
      y,
      { maxWidth: textWidth },
    );
  };

  // ==========================================
  // SLIDE 1: COVER PAGE
  // ==========================================

  const leftWidth = pageWidth * 0.5;
  const rightWidth = pageWidth - leftWidth;

  doc.setFillColor(245, 243, 240);
  doc.rect(0, 0, leftWidth, pageHeight, "F");

  // Compress cover image before embedding
  try {
    const compressedCover = await compressImage(
      report.coverImageBase64,
      1600,
      0.7,
    );
    doc.addImage(compressedCover, "JPEG", leftWidth, 0, rightWidth, pageHeight);
  } catch (e) {
    doc.setFillColor(220, 220, 220);
    doc.rect(leftWidth, 0, rightWidth, pageHeight, "F");
  }

  doc.setTextColor(140, 140, 140);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(55);
  doc.text((report.projectName || " ").toUpperCase(), leftWidth / 2, 55, {
    align: "center",
  });

  doc.setDrawColor(208, 163, 114);
  doc.setLineWidth(1.5);
  doc.line(leftWidth / 2 - 30, 59, leftWidth / 2 + 30, 59);

  doc.setTextColor(208, 163, 114);
  doc.setFontSize(50);
  doc.text("QAQC REPORT", leftWidth / 2, 76, { align: "center" });

  const formatReportDate = (dateStr: string): string => {
    if (!dateStr) return "N/A";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;

    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    let suffix = "th";
    if (day % 10 === 1 && day !== 11) suffix = "st";
    else if (day % 10 === 2 && day !== 12) suffix = "nd";
    else if (day % 10 === 3 && day !== 13) suffix = "rd";

    return `${day}${suffix} ${months[monthIdx]} ${year}`;
  };

  const formattedStart = formatReportDate(report.weekStart);
  const formattedEnd = formatReportDate(report.weekEnd);
  const structuredDateText = `${formattedStart}  —  ${formattedEnd}`;

  const pillWidth = 105;
  const pillHeight = 9;
  const pillX = (leftWidth - pillWidth) / 2;
  const pillY = 83;

  doc.roundedRect(pillX, pillY, pillWidth, pillHeight, 4.5, 4.5, "F");
  doc.setFont("helvetica", "bold").setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(structuredDateText, leftWidth / 2, pillY + 5.8, {
    align: "center",
  });
  doc.setTextColor(120, 120, 120);

  const infoStartY = 185;
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(
    `Prepared By: ${report.preparedBy.name}`,
    leftWidth / 2,
    infoStartY,
    { align: "center" },
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(
    report.preparedBy?.designation ||
      report.preparedBy?.role ||
      "QA/QC Engineer",
    leftWidth / 2,
    infoStartY + 8,
    { align: "center" },
  );

  try {
    doc.addImage(
      report.logoBase64 || FALLBACK_COMPANY_LOGO,
      "PNG",
      pageWidth - 50,
      10,
      40,
      24,
    );
  } catch (e) {
    // ignore
  }

  // ============================================================
  // SLIDE 2A: EXECUTIVE SUMMARY - METRICS & SYNOPSIS
  // ============================================================
  createNewSlide("Executive Summary: Overview");

  const cardW = (contentWidth - 9) / 4;
  let cardX = margin;

  const drawMetricPill = (
    x: number,
    label: string,
    val: string,
    badgeBg: number[],
  ) => {
    doc
      .setDrawColor(226, 232, 240)
      .setLineWidth(0.3)
      .setFillColor(255, 255, 255);
    doc.rect(x, 24, cardW, 20, "FD");
    doc
      .setFillColor(badgeBg[0], badgeBg[1], badgeBg[2])
      .rect(x, 24, 3, 20, "F");
    doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), x + 8, 31);
    doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(15, 23, 42);
    doc.text(val, x + 8, 39);
  };

  // Render Metric Pills
  drawMetricPill(
    cardX,
    "Total Inspections",
    `${report.inspectionStats.passed}/${report.inspectionStats.total} Passed`,
    [148, 163, 184],
  );
  cardX += cardW + 3;
  drawMetricPill(
    cardX,
    "Active Draft Summaries",
    String(report.inspectionStats.pending),
    [245, 158, 11],
  );
  cardX += cardW + 3;
  drawMetricPill(
    cardX,
    "Open Non-Conformances",
    String(report.ncrStats.openTotal),
    [239, 68, 68],
  );
  cardX += cardW + 3;
  drawMetricPill(
    cardX,
    "Open Site Findings",
    String(report.findingStats.openTotal),
    [59, 130, 246],
  );

  // Executive Synopsis Box (Dynamic Height)
  const synopsisStartY = 52;
  doc.setFont("helvetica", "normal").setFontSize(10);
  const splitSummary = doc.splitTextToSize(
    report.executiveSummary,
    contentWidth - 10,
  );
  const synopsisLineHeight = doc.getLineHeight();
  const synopsisBoxHeight = splitSummary.length * synopsisLineHeight + 15;

  doc.setFillColor(248, 250, 252).setDrawColor(226, 232, 240).setLineWidth(0.3);
  doc.rect(margin, synopsisStartY, contentWidth, synopsisBoxHeight, "FD");

  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(15, 23, 42);
  doc.text("CORE SYNOPSIS OVERVIEW", margin + 5, synopsisStartY + 7);
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(51, 65, 85);
  doc.text(splitSummary, margin + 5, synopsisStartY + 15);

  // ============================================================
  // SLIDE 2B: EXECUTIVE SUMMARY - STRATEGIC INSIGHTS
  // ============================================================
  createNewSlide("Executive Summary: Strategic Insights");

  const colW = (contentWidth - 8) / 3;
  let blockX = margin;
  const segmentStartY = 24; // Starting higher up as we are on a new page

  const drawSegment = (
    x: number,
    title: string,
    text: string,
    primaryColor: number[],
  ): number => {
    const paddingX = 4;
    const paddingTop = 7;
    const titleHeight = 4;
    const titleToTextGap = 5;
    const paddingBottom = 8;

    doc.setFont("helvetica", "normal").setFontSize(9);
    const splitTxt = doc.splitTextToSize(
      text || "No distinct variables registered for current reporting period.",
      colW - paddingX * 2,
    );

    const lineHeight = doc.getLineHeight();
    const dynamicH =
      paddingTop +
      titleHeight +
      titleToTextGap +
      splitTxt.length * lineHeight +
      paddingBottom;

    // Draw Card
    doc.setFillColor(250, 250, 250).rect(x, segmentStartY, colW, 125, "F");
    doc
      .setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
      .setLineWidth(0.6);
    doc.line(x, segmentStartY, x + colW, segmentStartY);

    // Title
    doc.setFont("helvetica", "bold").setFontSize(9.5).setTextColor(15, 23, 42);
    doc.text(title, x + paddingX, segmentStartY + paddingTop);

    // Body
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(71, 85, 105);
    doc.text(
      splitTxt,
      x + paddingX,
      segmentStartY + paddingTop + titleToTextGap,
    );

    return segmentStartY + 125;
  };

  // Draw the three detailed columns
  drawSegment(
    blockX,
    "Key Project Highlights",
    report.highlights || "",
    [34, 197, 94],
  );
  blockX += colW + 4;
  drawSegment(
    blockX,
    "Critical Risks & Open Concerns",
    report.concerns || "",
    [239, 68, 68],
  );
  blockX += colW + 4;
  drawSegment(
    blockX,
    "Target Milestones (Next Week)",
    report.nextWeekPlan || "",
    [59, 130, 246],
  );

  // ==========================================
  // SLIDE 3: CUBE TEST STRUCTURAL MATRIX
  // ==========================================
  createNewSlide("Cube Test Results");

  let tableY = 25;
  const thH = 8;
  const rowH = 8;
  const cubeCols = [30, 26, 68, 28, 28, 28, 28];
  const cubeHeaders = [
    "SAMPLE ID",
    "DATE CAST",
    "ELEMENT REFERENCE",
    "7D BREAK",
    "7D STATUS",
    "28D BREAK",
    "28D STATUS",
  ];

  doc.setFillColor(15, 23, 42).rect(margin, tableY, contentWidth, thH, "F");
  doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(255, 255, 255);

  let currX = margin;
  cubeHeaders.forEach((h, idx) => {
    doc.text(h, currX + 3, tableY + 5.5);
    currX += cubeCols[idx];
  });
  tableY += thH;

  if (report.cubeTests && report.cubeTests.length > 0) {
    report.cubeTests.forEach((row, rIdx) => {
      // Check page overflow
      if (tableY + rowH > pageHeight - 20) {
        slideNumberRef.current++;
        createNewSlide("Cube Test Results (Cont'd)");
        tableY = 25;
        doc.setFillColor(15, 23, 42).rect(margin, tableY, contentWidth, thH, "F");
        doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(255, 255, 255);
        let currXCont = margin;
        cubeHeaders.forEach((h, idx) => {
          doc.text(h, currXCont + 3, tableY + 5.5);
          currXCont += cubeCols[idx];
        });
        tableY += thH;
      }

      doc
        .setFillColor(
          rIdx % 2 === 0 ? 255 : 248,
          rIdx % 2 === 0 ? 255 : 250,
          rIdx % 2 === 0 ? 255 : 252,
        )
        .rect(margin, tableY, contentWidth, rowH, "F");
      doc
        .setDrawColor(241, 245, 249)
        .setLineWidth(0.2)
        .rect(margin, tableY, contentWidth, rowH, "S");

      let rX = margin;
      const str7 = row.strength7Days !== undefined && row.strength7Days !== null && row.strength7Days !== ""
        ? `${row.strength7Days} MPa`
        : "Pending";
      const str28 = row.strength28Days !== undefined && row.strength28Days !== null && row.strength28Days !== ""
        ? `${row.strength28Days} MPa`
        : "Pending";

      const values = [
        row.sampleId || row.id || `CUBE-${rIdx + 1}`,
        row.dateCast || row.castDate || "N/A",
        row.inscribedName || row.element || row.elementName || "N/A",
        str7,
        row.status7Days || (str7 !== "Pending" ? "PASS" : "Pending"),
        str28,
        row.status28Days || (str28 !== "Pending" ? "PASS" : "Pending"),
      ];

      values.forEach((v, vIdx) => {
        if (vIdx === 4 || vIdx === 6) {
          const upper = String(v).toUpperCase();
          if (upper === "PASSED" || upper === "PASS")
            doc.setFont("helvetica", "bold").setTextColor(22, 163, 74);
          else if (upper === "PENDING" || upper === "CURING")
            doc.setFont("helvetica", "medium").setTextColor(217, 119, 6);
          else doc.setFont("helvetica", "bold").setTextColor(220, 38, 38);
        } else {
          doc.setFont("helvetica", vIdx === 0 ? "bold" : "normal").setTextColor(51, 65, 85);
        }
        doc.text(String(v), rX + 3, tableY + 5.2);
        rX += cubeCols[vIdx];
      });
      tableY += rowH;
    });
  } else {
    doc
      .setDrawColor(241, 245, 249)
      .rect(margin, tableY, contentWidth, rowH, "S");
    renderNoDataNotice(margin + 5, tableY + 5.5);
  }

  // ==========================================
  // SLIDE 4: MATERIAL / QUANTITY SUMMARY & CHARTS
  // ==========================================
  createNewSlide(report.selectedLevel + " - Quantity Summary");

  const leftChartW = 120;
  let qtyY = 30;

  // Header Title
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(15, 23, 42);
  doc.text(report.selectedLevel + " FLOOR CONCRETE CHART", margin, qtyY);
  qtyY += 6;

  // Table Header Configuration
  const qtyCols = [45, 40, 35];
  const qtyHeaders = ["ELEMENT", "SCOPE (CUM)", "% COMPLETION"];
  doc.setFillColor(241, 245, 249).rect(margin, qtyY, leftChartW, 8, "F");
  doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(71, 85, 105);

  let qX = margin;
  qtyHeaders.forEach((qh, qidx) => {
    doc.text(qh, qX + 3, qtyY + 5.5);
    qX += qtyCols[qidx];
  });
  qtyY += 8;

  const chartPalette = [
    [59, 130, 246], // Blue
    [16, 185, 129], // Emerald
    [245, 158, 11], // Amber
    [139, 92, 246], // Purple
    [239, 68, 68], // Red
    [100, 116, 139], // Slate
  ];

  let totalVolumeScope = 0;

  // Sanitize and normalize summary data
  const sanitizedSummary = (report.quantitySummary || []).map((qRow: any) => {
    const numericScope = qRow.scope
      ? parseInt(String(qRow.scope), 10)
      : qRow.scopeCum || 0;
    const numericCompletion = qRow.completion
      ? parseInt(String(qRow.completion), 10)
      : qRow.completionPercentage || 0;

    return {
      element: qRow.element || "N/A",
      scopeCum: isNaN(numericScope) ? 0 : numericScope,
      completionPercentage: isNaN(numericCompletion) ? 0 : numericCompletion,
    };
  });

  // Render Table Rows
  if (sanitizedSummary.length > 0) {
    sanitizedSummary.forEach((qRow, rIdx) => {
      totalVolumeScope += qRow.scopeCum;

      doc
        .setDrawColor(241, 245, 249)
        .setLineWidth(0.3)
        .rect(margin, qtyY, leftChartW, 9, "S");

      doc
        .setFont("helvetica", "normal")
        .setFontSize(8.5)
        .setTextColor(51, 65, 85);

      const currentColor = chartPalette[rIdx % chartPalette.length];
      doc
        .setFillColor(currentColor[0], currentColor[1], currentColor[2])
        .rect(margin, qtyY, 1.5, 9, "F");

      doc.text(qRow.element, margin + 4, qtyY + 6);
      doc.text(`${qRow.scopeCum}`, margin + qtyCols[0] + 3, qtyY + 6);

      // Mini Completion Progress Bar
      const barCellX = margin + qtyCols[0] + qtyCols[1] + 3;
      const barTrackW = 20;
      const fillW = Math.max(0.5, (Math.min(100, qRow.completionPercentage) / 100) * barTrackW);
      doc.setFillColor(226, 232, 240).roundedRect(barCellX, qtyY + 2.5, barTrackW, 4, 1, 1, "F");
      doc.setFillColor(
        qRow.completionPercentage === 100 ? 16 : 245,
        qRow.completionPercentage === 100 ? 185 : 158,
        qRow.completionPercentage === 100 ? 129 : 11
      ).roundedRect(barCellX, qtyY + 2.5, fillW, 4, 1, 1, "F");

      doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(15, 23, 42);
      doc.text(
        `${qRow.completionPercentage}%`,
        barCellX + barTrackW + 3,
        qtyY + 5.8,
      );
      qtyY += 9;
    });

    // Total Volume Summary Footer Row
    doc.setFillColor(248, 250, 252).rect(margin, qtyY, leftChartW, 9, "F");
    doc.setDrawColor(226, 232, 240).rect(margin, qtyY, leftChartW, 9, "S");
    doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(15, 23, 42);
    doc.text("TOTAL", margin + 4, qtyY + 6);
    doc.text(`${totalVolumeScope}`, margin + qtyCols[0] + 3, qtyY + 6);

    const totalPct = parseInt(String(report.overallQuantityCompletion || "98"), 10) || 98;
    const totBarX = margin + qtyCols[0] + qtyCols[1] + 3;
    const totBarW = 20;
    const totFillW = Math.max(0.5, (Math.min(100, totalPct) / 100) * totBarW);
    doc.setFillColor(203, 213, 225).roundedRect(totBarX, qtyY + 2.5, totBarW, 4, 1, 1, "F");
    doc.setFillColor(37, 99, 235).roundedRect(totBarX, qtyY + 2.5, totFillW, 4, 1, 1, "F");
    doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(15, 23, 42);
    doc.text(
      `${totalPct}%`,
      totBarX + totBarW + 3,
      qtyY + 5.8,
    );
  } else {
    doc.setDrawColor(241, 245, 249).rect(margin, qtyY, leftChartW, 9, "S");
    renderNoDataNotice(margin + 4, qtyY + 6, leftChartW - 8);
  }

  // ==========================================
  // TOP-RIGHT CANVAS: 3D PIE CHART & LEGEND
  // ==========================================
  const rightCanvasX = margin + leftChartW + 10;
  const rightCanvasW = contentWidth - leftChartW - 10;
  const rightCanvasH = 85;

  doc
    .setFillColor(250, 251, 253)
    .setDrawColor(226, 232, 240)
    .setLineWidth(0.4)
    .rect(rightCanvasX, 30, rightCanvasW, rightCanvasH, "FD");

  if (sanitizedSummary.length > 0 && totalVolumeScope > 0) {
    const centerX = rightCanvasX + rightCanvasW / 2;
    const centerY = 58;
    const radius = 28;
    let startAngle = 0;

    const drawTrianglePieSlice = (
      cx: number,
      cy: number,
      r: number,
      sAngle: number,
      eAngle: number,
      fillColor: number[],
    ) => {
      doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
      doc
        .setDrawColor(fillColor[0], fillColor[1], fillColor[2])
        .setLineWidth(0.2);

      const steps = Math.max(12, Math.ceil((eAngle - sAngle) / 2));
      let lastX = cx + r * Math.cos(((sAngle - 90) * Math.PI) / 180);
      let lastY = cy + r * Math.sin(((sAngle - 90) * Math.PI) / 180);

      for (let i = 1; i <= steps; i++) {
        const currentAngle = sAngle + (i / steps) * (eAngle - sAngle);
        const rad = ((currentAngle - 90) * Math.PI) / 180;
        const nextX = cx + r * Math.cos(rad);
        const nextY = cy + r * Math.sin(rad);

        doc.triangle(cx, cy, lastX, lastY, nextX, nextY, "FD");

        lastX = nextX;
        lastY = nextY;
      }
    };

    sanitizedSummary.forEach((qRow, idx) => {
      if (qRow.scopeCum <= 0) return;

      const slicePercentage = qRow.scopeCum / totalVolumeScope;
      const angleDelta = slicePercentage * 360;
      const endAngle = startAngle + angleDelta;
      const currentFill = chartPalette[idx % chartPalette.length];

      drawTrianglePieSlice(
        centerX,
        centerY,
        radius,
        startAngle,
        endAngle,
        currentFill,
      );
      startAngle = endAngle;
    });

    // Pie Chart Legend Below
    let legendItemX = rightCanvasX + 10;
    let legendItemY = 96;

    sanitizedSummary.forEach((qRow, idx) => {
      const currentFill = chartPalette[idx % chartPalette.length];
      doc
        .setFillColor(currentFill[0], currentFill[1], currentFill[2])
        .rect(legendItemX, legendItemY, 3, 3, "F");

      doc
        .setFont("helvetica", "normal")
        .setFontSize(7)
        .setTextColor(71, 85, 105);
      doc.text(qRow.element, legendItemX + 5, legendItemY + 2.5);

      legendItemX += 38;
    });

    doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(15, 23, 42);
    doc.text(
      (report.selectedLevel + " FLOOR CONCRETE CHART").toUpperCase(),
      rightCanvasX + rightCanvasW / 2,
      110,
      { align: "center" },
    );
  }

  // ==========================================
  // BOTTOM CANVAS: GROUPED VERTICAL BAR CHART
  // ==========================================
  const barCanvasY = 120;
  const barCanvasH = 68;

  doc
    .setFillColor(250, 251, 253)
    .setDrawColor(226, 232, 240)
    .setLineWidth(0.4)
    .rect(margin, barCanvasY, contentWidth, barCanvasH, "FD");

  // Legend for Bar Chart (Top Right of Bar Canvas)
  const legScopeColor = [59, 130, 246];
  const legAchColor = [249, 115, 22];

  doc
    .setFillColor(legScopeColor[0], legScopeColor[1], legScopeColor[2])
    .rect(margin + contentWidth - 45, barCanvasY + 6, 3, 3, "F");
  doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(100, 116, 139);
  doc.text("SCOPE", margin + contentWidth - 40, barCanvasY + 8.5);

  doc
    .setFillColor(legAchColor[0], legAchColor[1], legAchColor[2])
    .rect(margin + contentWidth - 22, barCanvasY + 6, 3, 3, "F");
  doc.text("ACHIEVED", margin + contentWidth - 17, barCanvasY + 8.5);

  // Render Grouped Bars
  if (sanitizedSummary.length > 0) {
    const chartAreaX = margin + 12;
    const chartAreaY = barCanvasY + 16;
    const chartAreaW = contentWidth - 24;
    const chartAreaH = 38;

    // Baseline axis
    doc.setDrawColor(203, 213, 225).setLineWidth(0.4);
    doc.line(
      chartAreaX,
      chartAreaY + chartAreaH,
      chartAreaX + chartAreaW,
      chartAreaY + chartAreaH,
    );

    // Find max value for scaling
    let maxVal = 10;
    sanitizedSummary.forEach((r) => {
      if (r.scopeCum > maxVal) maxVal = r.scopeCum;
    });

    const slotWidth = chartAreaW / sanitizedSummary.length;
    const barWidth = Math.min(10, slotWidth * 0.32);

    sanitizedSummary.forEach((qRow, idx) => {
      const scopeVal = qRow.scopeCum;
      const achievedVal = (scopeVal * qRow.completionPercentage) / 100;

      const slotCenterX = chartAreaX + idx * slotWidth + slotWidth / 2;

      // Scope Bar Height & Position
      const scopeBarH = maxVal > 0 ? (scopeVal / maxVal) * chartAreaH : 0;
      const scopeBarX = slotCenterX - barWidth - 1;
      const scopeBarY = chartAreaY + chartAreaH - scopeBarH;

      doc.setFillColor(legScopeColor[0], legScopeColor[1], legScopeColor[2]);
      doc.rect(scopeBarX, scopeBarY, barWidth, scopeBarH, "F");

      // Achieved Bar Height & Position
      const achievedBarH = maxVal > 0 ? (achievedVal / maxVal) * chartAreaH : 0;
      const achievedBarX = slotCenterX + 1;
      const achievedBarY = chartAreaY + chartAreaH - achievedBarH;

      doc.setFillColor(legAchColor[0], legAchColor[1], legAchColor[2]);
      doc.rect(
        achievedBarX,
        achievedBarY,
        barWidth,
        Math.max(achievedBarH, 0.5),
        "F",
      );

      // X-Axis Element Label
      doc
        .setFont("helvetica", "normal")
        .setFontSize(6.5)
        .setTextColor(71, 85, 105);
      doc.text(qRow.element, slotCenterX, chartAreaY + chartAreaH + 6, {
        align: "center",
        maxWidth: slotWidth - 4,
      });
    });
  }

  // ==========================================
  // SLIDES 5 - 10: STRUCTURAL ELEMENTS TABLES + CASTING STATUS PROGRESS MAPS
  // ==========================================

  // ── Helper to filter structural elements by type ──
  const getElementsByType = (typeKeyword: string): StructuralElementRow[] => {
    if (!report.structuralElements || report.structuralElements.length === 0)
      return [];
    return report.structuralElements.filter((el) => {
      const elType = (
        (el as any).elementType ||
        (el as any).type ||
        (el as any).element ||
        ""
      ).toUpperCase();
      return elType.includes(typeKeyword.toUpperCase());
    });
  };

  const structuralMaps = [
    {
      title: report.selectedLevel + " Columns",
      image: report.columnLayoutImg,
      fallbackText: "[COLOR-CODED LAYOUT OVERLAY]",
      elementType: "COLUMN",
      showElementsTable: true,
    },
    {
      title: report.selectedLevel + " Beams",
      image: report.beamLayoutImg,
      fallbackText: "[COLOR-CODED LAYOUT OVERLAY]",
      elementType: "BEAM",
      showElementsTable: true,
    },
    {
      title: report.selectedLevel + " Slab",
      image: report.slabImg,
      fallbackText: "[COLOR-CODED LAYOUT OVERLAY]",
      elementType: "SLAB",
      showElementsTable: false,
    },
  ];

  for (const mapObj of structuralMaps) {
    // ── STEP 1: Draw structural elements table (BEAM & COLUMN only) ──
    if (mapObj.showElementsTable) {
      const elements = getElementsByType(mapObj.elementType);
      createNewSlide(`${mapObj.title} — Structural Elements`);
      drawStructuralElementsTable(
        doc,
        elements,
        mapObj.elementType,
        margin,
        contentWidth,
        pageHeight,
        applySlideTemplate,
        createNewSlide,
        renderNoDataNotice,
        slideNumberRef,
      );
    }

    // ── STEP 2: Draw casting status layout map (ALL types) ──
    createNewSlide(`${mapObj.title} – Casting Status`);

    // let legendX = margin;
    // const legendItems = [
    //   { label: "Completed", color: [22, 163, 74] },
    //   { label: "Rebar in progress", color: [234, 179, 8] },
    //   { label: "Form-work in progress", color: [147, 51, 234] },
    //   { label: "Ready for casting", color: [59, 130, 246] },
    //   { label: "Hold", color: [220, 38, 38] },
    //   { label: "Balance", color: [100, 116, 139] },
    // ];

    // legendItems.forEach((item) => {
    //   doc
    //     .setFillColor(item.color[0], item.color[1], item.color[2])
    //     .rect(legendX, 22, 4, 4, "F");
    //   doc
    //     .setFont("helvetica", "medium")
    //     .setFontSize(8)
    //     .setTextColor(71, 85, 105);
    //   doc.text(item.label, legendX + 6, 25.2);
    //   legendX += mapObj.title.includes("Columns") ? 41 : 43;
    // });

    const mapW = contentWidth;
    const mapH = 145;
    doc
      .setFillColor(248, 250, 252)
      .setDrawColor(226, 232, 240)
      .setLineWidth(0.4)
      .rect(margin, 32, mapW, mapH, "FD");

    if (
      mapObj.image &&
      (mapObj.image.startsWith("http") || mapObj.image.startsWith("data:"))
    ) {
      try {
        const compressedMap = await compressImage(mapObj.image, 2800, 0.94);
        doc.addImage(
          compressedMap,
          "JPEG",
          margin + 2,
          34,
          mapW - 4,
          mapH - 4,
          undefined,
          "MEDIUM",
        );
      } catch (e) {
        doc
          .setFont("helvetica", "bold")
          .setFontSize(10)
          .setTextColor(203, 213, 225);
        doc.text(mapObj.fallbackText, margin + mapW / 2, 100, {
          align: "center",
        });
      }
    } else {
      doc
        .setFont("helvetica", "bold")
        .setFontSize(10)
        .setTextColor(148, 163, 184);
      doc.text(mapObj.fallbackText, margin + mapW / 2, 95, { align: "center" });
      renderNoDataNotice(margin + mapW / 2 - 35, 105, 70);
    }
  }

  // ── STEP 3: Draw other structural elements (Walls, Stairs, Core) if present ──
  const otherElements = (report.structuralElements || []).filter((el) => {
    const t = (
      (el as any).elementType ||
      (el as any).type ||
      (el as any).element ||
      ""
    ).toUpperCase();
    return !t.includes("COLUMN") && !t.includes("BEAM") && !t.includes("SLAB");
  });

  if (otherElements.length > 0) {
    createNewSlide(
      `${report.selectedLevel || "Structural"} — Walls, Staircases & Core Elements`,
    );
    drawStructuralElementsTable(
      doc,
      otherElements,
      "WALL/CORE",
      margin,
      contentWidth,
      pageHeight,
      applySlideTemplate,
      createNewSlide,
      renderNoDataNotice,
      slideNumberRef,
    );
  }

  // ==========================================
  // SLIDE 11: MEP QA/QC CLEARANCE STATUS
  // ==========================================

  const drawMepClearanceTable = (
    doc: jsPDF,
    rows: MepClearanceRow[],
    margin: number,
    contentWidth: number,
    pageHeight: number,
    applySlideTemplate: (title: string) => void,
    createNewSlide: (title: string) => void,
    renderNoDataNotice: (x: number, y: number, textWidth?: number) => void,
    slideNumberRef: { current: number },
  ) => {
    const thH = 8;
    const rowH = 8;
    const cols = [65, 55, 35, 45, 85];
    const headers = [
      "ELEMENT / SERVICE",
      "SUBCONTRACTOR / TRADE",
      "% COMPLETION",
      "QA/QC STATUS",
      "REMARKS & OBSERVATIONS",
    ];

    let tableY = 26;

    // Header
    doc.setFillColor(15, 23, 42).rect(margin, tableY, contentWidth, thH, "F");
    doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(255, 255, 255);

    let currX = margin;
    headers.forEach((h, idx) => {
      doc.text(h, currX + 3, tableY + 5.5);
      currX += cols[idx];
    });
    tableY += thH;

    if (rows.length > 0) {
      rows.forEach((row, rIdx) => {
        // Check page overflow
        if (tableY + rowH > pageHeight - 20) {
          doc.addPage();
          slideNumberRef.current++;
          applySlideTemplate("MEP QA/QC Clearance Status (Cont'd)");
          tableY = 26;

          // Redraw header
          doc
            .setFillColor(15, 23, 42)
            .rect(margin, tableY, contentWidth, thH, "F");
          doc
            .setFont("helvetica", "bold")
            .setFontSize(8)
            .setTextColor(255, 255, 255);
          let hX = margin;
          headers.forEach((h, idx) => {
            doc.text(h, hX + 3, tableY + 5.5);
            hX += cols[idx];
          });
          tableY += thH;
        }

        doc
          .setFillColor(
            rIdx % 2 === 0 ? 255 : 248,
            rIdx % 2 === 0 ? 255 : 250,
            rIdx % 2 === 0 ? 255 : 252,
          )
          .rect(margin, tableY, contentWidth, rowH, "F");
        doc
          .setDrawColor(241, 245, 249)
          .setLineWidth(0.2)
          .rect(margin, tableY, contentWidth, rowH, "S");

        let rX = margin;
        const status = row.status || "PENDING";
        const statusUpper = status.toUpperCase();

        const values = [
          row.elementService || "—",
          row.subcontractor || "—",
          `${row.completionPct || 0}%`,
          statusUpper,
          row.remarks || "—",
        ];

        values.forEach((v, vIdx) => {
          if (vIdx === 3) {
            // Status color coding
            if (statusUpper === "APPROVED")
              doc.setFont("helvetica", "bold").setTextColor(22, 163, 74);
            else if (statusUpper === "IN PROGRESS")
              doc.setFont("helvetica", "bold").setTextColor(59, 130, 246);
            else if (statusUpper === "PENDING")
              doc.setFont("helvetica", "bold").setTextColor(245, 158, 11);
            else if (statusUpper === "HOLD" || statusUpper === "REJECTED")
              doc.setFont("helvetica", "bold").setTextColor(220, 38, 38);
            else doc.setFont("helvetica", "normal").setTextColor(51, 65, 85);
          } else if (vIdx === 2) {
            // Completion % color coding
            const pct = row.completionPct || 0;
            if (pct === 100)
              doc.setFont("helvetica", "bold").setTextColor(22, 163, 74);
            else if (pct >= 75)
              doc.setFont("helvetica", "bold").setTextColor(59, 130, 246);
            else if (pct >= 50)
              doc.setFont("helvetica", "bold").setTextColor(245, 158, 11);
            else doc.setFont("helvetica", "normal").setTextColor(148, 163, 184);
          } else {
            doc.setFont("helvetica", "normal").setTextColor(51, 65, 85);
          }

          // Wrap text for remarks column
          if (vIdx === 4) {
            const wrapped = doc.splitTextToSize(String(v), cols[vIdx] - 6);
            doc.text(wrapped, rX + 3, tableY + 5.2);
          } else {
            doc.text(v, rX + 3, tableY + 5.2);
          }
          rX += cols[vIdx];
        });
        tableY += rowH;
      });
    } else {
      doc
        .setDrawColor(241, 245, 249)
        .rect(margin, tableY, contentWidth, rowH, "S");
      renderNoDataNotice(margin + 5, tableY + 5.5);
    }
  };

  // ==========================================
  // SLIDE 11: MEP QA/QC CLEARANCE STATUS
  // ==========================================
  createNewSlide("MEP QA/QC Clearance Status — Pre-Casting");

  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(15, 23, 42);
  doc.text("MEP QA/QC CLEARANCE STATUS", margin, 24);

  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(100, 116, 139);
  doc.text("Pre-Casting Service Installations & Clearance Log", margin, 29);

  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(148, 163, 184);
  doc.text(
    "All services must achieve 100% installation layout and structural QA/QC sign-off prior to the monolithic concrete casting window.",
    margin,
    33,
  );

  drawMepClearanceTable(
    doc,
    report.mepClearance || [],
    margin,
    contentWidth,
    pageHeight,
    applySlideTemplate,
    createNewSlide,
    renderNoDataNotice,
    slideNumberRef,
  );

  // ==========================================
  // SLIDE 8: QUALITY COMPLIANCE & SITE REMEDIATION
  // ==========================================
  createNewSlide("QAQC Observation Progress Report");

  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(15, 23, 42);
  doc.text("QUALITY COMPLIANCE & SITE REMEDIATION", margin, 28);

  doc
    .setFillColor(240, 253, 244)
    .setDrawColor(74, 222, 128)
    .setLineWidth(0.5)
    .rect(margin, 36, 90, 45, "FD");
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(21, 128, 61);
  doc.text("OVERALL QUALITY COMPLIANCE", margin + 8, 45);

  const complianceScore =
    report.overallQualityCompliance !== undefined
      ? `${report.overallQualityCompliance}%`
      : "0%";
  doc.setFont("helvetica", "bold").setFontSize(32).setTextColor(22, 163, 74);
  doc.text(complianceScore, margin + 8, 68);
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(22, 163, 74);
  doc.text("Maintained for current structural cycle.", margin + 8, 75);

  // ── DYNAMIC HEIGHT REMEDIATION BOX ──
  const remX = margin + 98;
  const remW = contentWidth - 98;

  let remTextHeight = 0;
  let splitRem: string[] = [];

  if (
    report.remediationSummaryText &&
    report.remediationSummaryText.trim() !== ""
  ) {
    doc.setFont("helvetica", "normal").setFontSize(9.5);
    splitRem = doc.splitTextToSize(report.remediationSummaryText, remW - 12);
    const lineHeight = 9.5 * 1.2;
    remTextHeight = splitRem.length * lineHeight;
  } else {
    remTextHeight = 12;
  }

  const headerHeight = 16;
  const contentPadding = 10;
  const minBoxHeight = 45;
  const calculatedHeight = headerHeight + remTextHeight + contentPadding;
  const remH = Math.max(minBoxHeight, calculatedHeight);

  doc.setFillColor(254, 243, 199).rect(remX, 36, remW, remH, "F");
  doc
    .setDrawColor(245, 158, 11)
    .setLineWidth(0.5)
    .line(remX, 36, remX, 36 + remH);

  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(146, 64, 14);
  doc.text("FIELD REMEDIATION SUMMARY NOTES", remX + 6, 44);

  const contentY = 52;
  if (
    report.remediationSummaryText &&
    report.remediationSummaryText.trim() !== ""
  ) {
    doc
      .setFont("helvetica", "normal")
      .setFontSize(9.5)
      .setTextColor(180, 83, 9);
    doc.text(splitRem, remX + 6, contentY);
  } else {
    renderNoDataNotice(remX + 6, contentY, remW - 12);
  }

  const sectionBottomY = 36 + remH + 8;

  // ==========================================
  // SLIDE 9: MATERIAL DELIVERY LOG
  // ==========================================
  createNewSlide("Material Delivery Log");

  let matY = 26;
  const matCols = [22, 45, 36, 20, 20, 20, 30, 84];
  const matHeaders = [
    "DATE",
    "MATERIAL & SPEC",
    "SUPPLIER",
    "DELIVERED",
    "ACCEPTED",
    "REJECTED",
    "QC STATUS",
    "REMARKS & DEFECT NOTES",
  ];

  doc.setFillColor(15, 23, 42).rect(margin, matY, contentWidth, thH, "F");
  doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(255, 255, 255);

  let mX = margin;
  matHeaders.forEach((mh, idx) => {
    doc.text(mh, mX + 2, matY + 5.5);
    mX += matCols[idx];
  });
  matY += thH;

  if (report.materialDeliveries && report.materialDeliveries.length > 0) {
    report.materialDeliveries.forEach((mrow, rIdx) => {
      const deliveredQty = String(mrow.quantityReceived ?? mrow.quantity ?? "—");
      const unitStr = mrow.unit ? ` ${mrow.unit}` : "";
      const acceptedQty =
        mrow.quantityAccepted !== undefined
          ? `${mrow.quantityAccepted}${unitStr}`
          : "—";
      const rejectedQty =
        mrow.quantityRejected !== undefined && Number(mrow.quantityRejected) > 0
          ? `${mrow.quantityRejected}${unitStr}`
          : "0";

      let displayStatus = String(
        mrow.status || mrow.qaqcStatus || "PENDING",
      ).toUpperCase();
      if (displayStatus === "APPROVED_AS_NOTED") displayStatus = "APPROVED AS NOTED";
      if (displayStatus === "PARTIALLY_ACCEPTED") displayStatus = "PARTIALLY ACCEPTED";
      if (mrow.ncrNumber) {
        displayStatus += ` (#${mrow.ncrNumber})`;
      }

      // Build consolidated remarks & defect notes
      const remarksParts: string[] = [];
      const primaryRemark = mrow.remarks || mrow.qaqcRemarks || "";
      if (primaryRemark && primaryRemark !== "Verified" && primaryRemark !== "N/A") {
        remarksParts.push(primaryRemark);
      }
      if (mrow.rejectionReason) {
        remarksParts.push(`Rejection: ${mrow.rejectionReason}`);
      }
      if (mrow.batchNumber) {
        remarksParts.push(`Batch: ${mrow.batchNumber}`);
      }
      if (mrow.deliveryNoteNumber) {
        remarksParts.push(`DO/DN: ${mrow.deliveryNoteNumber}`);
      }
      const displayRemarks = remarksParts.length > 0 ? remarksParts.join(" | ") : (primaryRemark || "Verified compliant");

      const matTitle = mrow.materialName || mrow.materialDescription || mrow.material || "N/A";
      const supplierTitle = mrow.supplier || mrow.supplierName || mrow.source || "N/A";

      const itemValues = [
        mrow.deliveryDate || "N/A",
        matTitle,
        supplierTitle,
        `${deliveredQty}${unitStr}`,
        acceptedQty,
        rejectedQty,
        displayStatus,
        displayRemarks,
      ];

      // Calculate maximum wrapped lines
      let maxMatLines = 1;
      itemValues.forEach((val, vIdx) => {
        if ([1, 2, 6, 7].includes(vIdx)) {
          const wrapped = doc.splitTextToSize(String(val), matCols[vIdx] - 4);
          maxMatLines = Math.max(maxMatLines, wrapped.length);
        }
      });

      const matRowHeight = Math.max(rowH, maxMatLines * 3.8 + 4);

      // Check page overflow
      if (matY + matRowHeight > pageHeight - 20) {
        slideNumberRef.current++;
        createNewSlide("Material Delivery Log (Cont'd)");
        matY = 26;
        doc.setFillColor(15, 23, 42).rect(margin, matY, contentWidth, thH, "F");
        doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(255, 255, 255);
        let mXCont = margin;
        matHeaders.forEach((mh, idx) => {
          doc.text(mh, mXCont + 2, matY + 5.5);
          mXCont += matCols[idx];
        });
        matY += thH;
      }

      doc
        .setFillColor(
          rIdx % 2 === 0 ? 255 : 248,
          rIdx % 2 === 0 ? 255 : 250,
          rIdx % 2 === 0 ? 255 : 252,
        )
        .rect(margin, matY, contentWidth, matRowHeight, "F");
      doc
        .setDrawColor(241, 245, 249)
        .setLineWidth(0.2)
        .rect(margin, matY, contentWidth, matRowHeight, "S");

      let currentMatX = margin;
      itemValues.forEach((val, vIdx) => {
        doc.setFontSize(7.5);
        if (vIdx === 4) {
          // Accepted quantity (green)
          doc.setFont("helvetica", "bold").setTextColor(22, 163, 74);
        } else if (vIdx === 5) {
          // Rejected quantity (red if > 0)
          if (val !== "0" && val !== "—") {
            doc.setFont("helvetica", "bold").setTextColor(220, 38, 38);
          } else {
            doc.setFont("helvetica", "normal").setTextColor(148, 163, 184);
          }
        } else if (vIdx === 6) {
          // Status
          const stStr = String(val).toUpperCase();
          if (stStr.startsWith("APPROVED AS NOTED")) {
            doc.setFont("helvetica", "bold").setTextColor(2, 132, 199);
          } else if (stStr.startsWith("APPROVED") || stStr.startsWith("ACCEPTED")) {
            doc.setFont("helvetica", "bold").setTextColor(22, 163, 74);
          } else if (stStr.startsWith("PARTIALLY ACCEPTED") || stStr.startsWith("PENDING")) {
            doc.setFont("helvetica", "bold").setTextColor(217, 119, 6);
          } else {
            doc.setFont("helvetica", "bold").setTextColor(220, 38, 38);
          }
        } else if (vIdx === 1) {
          doc.setFont("helvetica", "bold").setTextColor(30, 41, 59);
        } else if (vIdx === 7) {
          doc.setFont("helvetica", "normal").setTextColor(71, 85, 105);
        } else {
          doc.setFont("helvetica", "normal").setTextColor(51, 65, 85);
        }

        if ([1, 2, 6, 7].includes(vIdx)) {
          const wrapped = doc.splitTextToSize(String(val), matCols[vIdx] - 4);
          doc.text(wrapped, currentMatX + 2, matY + 4.2);
        } else {
          doc.text(String(val), currentMatX + 2, matY + 4.8);
        }
        currentMatX += matCols[vIdx];
      });
      matY += matRowHeight;
    });
  } else {
    doc.setDrawColor(241, 245, 249).rect(margin, matY, contentWidth, rowH, "S");
    renderNoDataNotice(margin + 5, matY + 5.5);
  }

  // ==========================================
  // SLIDE: NCR REMEDIATION REGISTER
  // ==========================================
  const ncrList = (report.ncrRemediationLog || []).filter(Boolean);
  if (ncrList.length > 0) {
    createNewSlide("NCR Remediation Register");

    let ncrY = 26;
    const ncrCols = [26, 42, 112, 24, 24, 22];
    const ncrHeaders = [
      "NCR REF",
      "LOCATION / TRADE",
      "DEFECT DESCRIPTION & ROOT CAUSE",
      "RAISED",
      "TARGET",
      "STATUS",
    ];

    doc.setFillColor(15, 23, 42).rect(margin, ncrY, contentWidth, thH, "F");
    doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(255, 255, 255);

    let nX = margin;
    ncrHeaders.forEach((nh, idx) => {
      doc.text(nh, nX + 2, ncrY + 5.5);
      nX += ncrCols[idx];
    });
    ncrY += thH;

    ncrList.forEach((nrow: any, rIdx: number) => {
      const refNo = nrow.refNo || nrow.ncrNumber || nrow.ncrNo || `NCR-${String(rIdx + 1).padStart(3, "0")}`;
      const locTrade = [nrow.elementLevel || nrow.location || "Site General", nrow.trade || nrow.assignedTo].filter(Boolean).join(" / ");
      const desc = nrow.description || nrow.issueSummary || nrow.title || "Defect logged";
      const raised = nrow.dateIdentified || nrow.dateFound || nrow.dateRaised || "—";
      const target = nrow.targetFixDate || nrow.dueDate || nrow.signDate || "—";
      const st = (nrow.status || "OPEN").toUpperCase();

      const itemValues = [refNo, locTrade, desc, raised, target, st];

      let maxLines = 1;
      itemValues.forEach((val, vIdx) => {
        if ([1, 2].includes(vIdx)) {
          const wrapped = doc.splitTextToSize(String(val), ncrCols[vIdx] - 4);
          maxLines = Math.max(maxLines, wrapped.length);
        }
      });

      const ncrRowHeight = Math.max(rowH, maxLines * 3.8 + 4);

      // Check for page overflow
      if (ncrY + ncrRowHeight > pageHeight - 20) {
        slideNumberRef.current++;
        createNewSlide("NCR Remediation Register (Cont'd)");
        ncrY = 26;
        doc.setFillColor(15, 23, 42).rect(margin, ncrY, contentWidth, thH, "F");
        doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(255, 255, 255);
        let nXCont = margin;
        ncrHeaders.forEach((nh, idx) => {
          doc.text(nh, nXCont + 2, ncrY + 5.5);
          nXCont += ncrCols[idx];
        });
        ncrY += thH;
      }

      doc
        .setFillColor(
          rIdx % 2 === 0 ? 255 : 248,
          rIdx % 2 === 0 ? 255 : 250,
          rIdx % 2 === 0 ? 255 : 252,
        )
        .rect(margin, ncrY, contentWidth, ncrRowHeight, "F");
      doc
        .setDrawColor(241, 245, 249)
        .setLineWidth(0.2)
        .rect(margin, ncrY, contentWidth, ncrRowHeight, "S");

      let currentNcrX = margin;
      itemValues.forEach((val, vIdx) => {
        doc.setFontSize(7.5);
        if (vIdx === 5) {
          if (st === "CLOSED" || st === "RECTIFIED" || st === "APPROVED") {
            doc.setFont("helvetica", "bold").setTextColor(22, 163, 74);
          } else {
            doc.setFont("helvetica", "bold").setTextColor(220, 38, 38);
          }
        } else if (vIdx === 0) {
          doc.setFont("helvetica", "bold").setTextColor(15, 23, 42);
        } else {
          doc.setFont("helvetica", "normal").setTextColor(51, 65, 85);
        }

        if ([1, 2].includes(vIdx)) {
          const wrapped = doc.splitTextToSize(String(val), ncrCols[vIdx] - 4);
          doc.text(wrapped, currentNcrX + 2, ncrY + 4.2);
        } else {
          doc.text(String(val), currentNcrX + 2, ncrY + 4.8);
        }
        currentNcrX += ncrCols[vIdx];
      });
      ncrY += ncrRowHeight;
    });
  }

  // ==========================================
  // SLIDE: CONTRACTUAL SITE INSTRUCTIONS (SIs)
  // ==========================================
  const siList = (report.siteInstructions || []).filter(Boolean);
  if (siList.length > 0) {
    createNewSlide("Contractual Site Instructions");

    let siY = 26;
    const siCols = [26, 106, 44, 25, 25, 24];
    const siHeaders = [
      "SI NO.",
      "SUBJECT & TECHNICAL DIRECTIVE",
      "RECIPIENT CONTRACTOR",
      "ISSUED",
      "DUE DATE",
      "STATUS",
    ];

    doc.setFillColor(15, 23, 42).rect(margin, siY, contentWidth, thH, "F");
    doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(255, 255, 255);

    let sX = margin;
    siHeaders.forEach((sh, idx) => {
      doc.text(sh, sX + 2, siY + 5.5);
      sX += siCols[idx];
    });
    siY += thH;

    siList.forEach((siRow: any, rIdx: number) => {
      const siNo = siRow.instructionNumber || siRow.refNo || `SI-${String(rIdx + 1).padStart(3, "0")}`;
      const subjDirective = [
        siRow.subject || siRow.title,
        siRow.instructionText || siRow.issueSummary,
      ].filter(Boolean).join(" — ");
      const recip = [siRow.contractorName || siRow.recipientName || "Main Contractor", siRow.recipientRole].filter(Boolean).join(" (") + (siRow.recipientRole ? ")" : "");
      const issued = siRow.issuedDate || (siRow.createdAt ? (typeof siRow.createdAt === "number" ? new Date(siRow.createdAt).toISOString().split("T")[0] : String(siRow.createdAt)) : "—");
      const due = siRow.complianceDeadline || siRow.dueDate || siRow.targetDate || "Immediate";
      const status = (siRow.status || "ISSUED").toUpperCase();

      const itemValues = [siNo, subjDirective, recip, issued, due, status];

      let maxLines = 1;
      itemValues.forEach((val, vIdx) => {
        if ([1, 2].includes(vIdx)) {
          const wrapped = doc.splitTextToSize(String(val), siCols[vIdx] - 4);
          maxLines = Math.max(maxLines, wrapped.length);
        }
      });

      const siRowHeight = Math.max(rowH, maxLines * 3.8 + 4);

      if (siY + siRowHeight > pageHeight - 20) {
        slideNumberRef.current++;
        createNewSlide("Contractual Site Instructions (Cont'd)");
        siY = 26;
        doc.setFillColor(15, 23, 42).rect(margin, siY, contentWidth, thH, "F");
        doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(255, 255, 255);
        let sXCont = margin;
        siHeaders.forEach((sh, idx) => {
          doc.text(sh, sXCont + 2, siY + 5.5);
          sXCont += siCols[idx];
        });
        siY += thH;
      }

      doc
        .setFillColor(
          rIdx % 2 === 0 ? 255 : 248,
          rIdx % 2 === 0 ? 255 : 250,
          rIdx % 2 === 0 ? 255 : 252,
        )
        .rect(margin, siY, contentWidth, siRowHeight, "F");
      doc
        .setDrawColor(241, 245, 249)
        .setLineWidth(0.2)
        .rect(margin, siY, contentWidth, siRowHeight, "S");

      let currentSiX = margin;
      itemValues.forEach((val, vIdx) => {
        doc.setFontSize(7.5);
        if (vIdx === 5) {
          if (status === "COMPLIED" || status === "CLOSED") {
            doc.setFont("helvetica", "bold").setTextColor(22, 163, 74);
          } else if (status === "ACKNOWLEDGED") {
            doc.setFont("helvetica", "bold").setTextColor(2, 132, 199);
          } else {
            doc.setFont("helvetica", "bold").setTextColor(217, 119, 6);
          }
        } else if (vIdx === 0) {
          doc.setFont("helvetica", "bold").setTextColor(15, 23, 42);
        } else {
          doc.setFont("helvetica", "normal").setTextColor(51, 65, 85);
        }

        if ([1, 2].includes(vIdx)) {
          const wrapped = doc.splitTextToSize(String(val), siCols[vIdx] - 4);
          doc.text(wrapped, currentSiX + 2, siY + 4.2);
        } else {
          doc.text(String(val), currentSiX + 2, siY + 4.8);
        }
        currentSiX += siCols[vIdx];
      });
      siY += siRowHeight;
    });
  }

  // ==========================================
  // SLIDE: SITE QUALITY SURVEILLANCE LOGS
  // ==========================================
  const commentList = (report.siteComments || []).filter(Boolean);
  if (commentList.length > 0) {
    createNewSlide("Site Quality Surveillance Logs");

    let comY = 26;
    const comCols = [26, 36, 120, 36, 32];
    const comHeaders = [
      "DATE",
      "LOCATION / LEVEL",
      "INSPECTION OBSERVATION & COMMENTS",
      "INSPECTOR / TRADE",
      "STATUS",
    ];

    doc.setFillColor(15, 23, 42).rect(margin, comY, contentWidth, thH, "F");
    doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(255, 255, 255);

    let cX = margin;
    comHeaders.forEach((ch, idx) => {
      doc.text(ch, cX + 2, comY + 5.5);
      cX += comCols[idx];
    });
    comY += thH;

    commentList.forEach((comRow: any, rIdx: number) => {
      const cDate =
        comRow.date ||
        (comRow.createdAt
          ? typeof comRow.createdAt === "number"
            ? new Date(comRow.createdAt).toISOString().split("T")[0]
            : String(comRow.createdAt)
          : "—");
      const loc =
        [comRow.level || comRow.levelName, comRow.location || comRow.gridLocation]
          .filter(Boolean)
          .join(" / ") || "Site General";
      const text =
        comRow.commentText ||
        comRow.text ||
        comRow.comments ||
        comRow.observation ||
        "Observation noted.";
      const inspTrade =
        [
          comRow.inspector || comRow.author || comRow.raisedByName,
          comRow.trade || comRow.vendorCheck,
        ]
          .filter(Boolean)
          .join(" / ") || "QA/QC Lead";
      const st = (comRow.status || "OPEN").toUpperCase();

      const itemValues = [cDate, loc, text, inspTrade, st];

      let maxLines = 1;
      itemValues.forEach((val, vIdx) => {
        if ([1, 2, 3].includes(vIdx)) {
          const wrapped = doc.splitTextToSize(String(val), comCols[vIdx] - 4);
          maxLines = Math.max(maxLines, wrapped.length);
        }
      });

      const comRowHeight = Math.max(rowH, maxLines * 3.8 + 4);

      if (comY + comRowHeight > pageHeight - 20) {
        slideNumberRef.current++;
        createNewSlide("Site Quality Surveillance Logs (Cont'd)");
        comY = 26;
        doc.setFillColor(15, 23, 42).rect(margin, comY, contentWidth, thH, "F");
        doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(255, 255, 255);
        let cXCont = margin;
        comHeaders.forEach((ch, idx) => {
          doc.text(ch, cXCont + 2, comY + 5.5);
          cXCont += comCols[idx];
        });
        comY += thH;
      }

      doc
        .setFillColor(
          rIdx % 2 === 0 ? 255 : 248,
          rIdx % 2 === 0 ? 255 : 250,
          rIdx % 2 === 0 ? 255 : 252,
        )
        .rect(margin, comY, contentWidth, comRowHeight, "F");
      doc
        .setDrawColor(241, 245, 249)
        .setLineWidth(0.2)
        .rect(margin, comY, contentWidth, comRowHeight, "S");

      let currentComX = margin;
      itemValues.forEach((val, vIdx) => {
        doc.setFontSize(7.5);
        if (vIdx === 4) {
          if (
            st === "COMPLIANT" ||
            st === "CLOSED" ||
            st === "PASSED" ||
            st === "RECTIFIED"
          ) {
            doc.setFont("helvetica", "bold").setTextColor(22, 163, 74);
          } else if (st === "IN PROGRESS" || st === "ACTION REQUIRED") {
            doc.setFont("helvetica", "bold").setTextColor(217, 119, 6);
          } else {
            doc.setFont("helvetica", "bold").setTextColor(220, 38, 38);
          }
        } else if (vIdx === 0) {
          doc.setFont("helvetica", "bold").setTextColor(15, 23, 42);
        } else {
          doc.setFont("helvetica", "normal").setTextColor(51, 65, 85);
        }

        if ([1, 2, 3].includes(vIdx)) {
          const wrapped = doc.splitTextToSize(String(val), comCols[vIdx] - 4);
          doc.text(wrapped, currentComX + 2, comY + 4.2);
        } else {
          doc.text(String(val), currentComX + 2, comY + 4.8);
        }
        currentComX += comCols[vIdx];
      });
      comY += comRowHeight;
    });
  }

  // ==========================================
  // SLIDES 12+: PICTORIAL IMAGES (COMPRESSED)
  // ==========================================
  if (report.pictorialUrls && report.pictorialUrls.length > 0) {
    for (const asset of report.pictorialUrls) {
      createNewSlide(
        `Pictorial Viewport ${String.fromCharCode(65 + report.pictorialUrls.indexOf(asset))}`,
      );

      const frameW = contentWidth;
      const frameH = 135;
      const frameY = 28;

      doc
        .setFillColor(248, 250, 252)
        .setDrawColor(226, 232, 240)
        .setLineWidth(0.3)
        .rect(margin, frameY, frameW, frameH, "FD");

      if (
        asset.url &&
        (asset.url.startsWith("http") || asset.url.startsWith("data:"))
      ) {
        try {
          // Compress pictorial image before embedding
          const compressedPictorial = await compressImage(asset.url, 1200, 0.7);

          // ── DYNAMIC WIDTH FROM HEIGHT (aspect-ratio preserved) ──
          const specifiedHeight = frameH - 18;
          let imgX = margin + 4;
          let imgW = frameW - 8;
          let imgY = frameY + 4;
          let imgH = specifiedHeight;

          const imgProps = doc.getImageProperties(compressedPictorial);
          const naturalAspect = imgProps.width / imgProps.height;
          const scaledWidth = specifiedHeight * naturalAspect;

          if (scaledWidth < frameW - 8) {
            imgW = scaledWidth;
            imgX = margin + 4 + (frameW - 8 - scaledWidth) / 2;
          } else {
            imgW = frameW - 8;
            imgH = imgW / naturalAspect;
            imgY = frameY + 4 + (specifiedHeight - imgH) / 2;
          }

          doc.addImage(
            compressedPictorial,
            "JPEG",
            imgX,
            imgY,
            imgW,
            imgH,
            undefined,
            "FAST",
          );
        } catch (e) {
          doc
            .setFont("helvetica", "bold")
            .setFontSize(10)
            .setTextColor(203, 213, 225);
          doc.text(
            "[UNABLE TO EXECUTE IMAGE PIPELINE DATA STREAM]",
            margin + frameW / 2,
            frameY + frameH / 2 - 5,
            { align: "center" },
          );
        }
      } else {
        doc
          .setFont("helvetica", "bold")
          .setFontSize(10)
          .setTextColor(161, 161, 170);
        doc.text(
          "[FIELD RECORD IMAGE ASSET NOT ATTACHED]",
          margin + frameW / 2,
          frameY + frameH / 2 - 5,
          { align: "center" },
        );
        renderNoDataNotice(
          margin + frameW / 2 - 35,
          frameY + frameH / 2 + 5,
          70,
        );
      }

      // Caption bar
      doc
        .setFillColor(15, 23, 42)
        .rect(margin + 4, frameY + frameH - 12, frameW - 8, 8, "F");
      doc
        .setFont("helvetica", "bold")
        .setFontSize(9)
        .setTextColor(255, 255, 255);

      const displayCaption =
        asset.caption && asset.caption.trim() !== ""
          ? asset.caption
          : `Operational Viewport Specification - Index Reference Asset ${String.fromCharCode(65 + report.pictorialUrls.indexOf(asset))}`;

      doc.text(displayCaption, margin + 8, frameY + frameH - 6.5);
    }
  } else {
    createNewSlide("Pictorial Reports — Viewports");
    doc
      .setFillColor(248, 250, 252)
      .setDrawColor(226, 232, 240)
      .setLineWidth(0.3)
      .rect(margin, 28, contentWidth, 145, "FD");
    doc
      .setFont("helvetica", "bold")
      .setFontSize(10)
      .setTextColor(161, 161, 170);
    doc.text(
      "[NO PICTORIAL ARCHIVE SPECIMENS LOADED INTO DOCUMENT ATTACHMENTS]",
      margin + contentWidth / 2,
      95,
      { align: "center" },
    );
    renderNoDataNotice(margin + contentWidth / 2 - 40, 105, 80);
  }

  // ==========================================
  // CLOSING SLIDE
  // ==========================================
  renderClosingSlide(
    doc,
    report.projectName,
    report.preparedBy,
    report.logoBase64,
    report.companyName,
  );

  if (options?.returnBase64) {
    const dataUri = doc.output("datauristring");
    return dataUri.split(",")[1] || dataUri;
  }

  if (options?.saveFile !== false) {
    const finalName = report.reportNumber
      ? `${report.reportNumber}.pdf`
      : generateUniversalName(report.projectCode || report.projectName, "WQR", {
          extension: "pdf",
        });
    doc.save(finalName);
  }
}

export const generateWeeklyPresentationPDF = generateNewWeeklyPresentationPDF;

