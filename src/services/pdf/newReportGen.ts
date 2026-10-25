// services/pdf/newReportGen.ts
import { generateUniversalName } from "@/lib/naming";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

export interface MaterialDeliveryRow {
  date?: string;
  deliveryDate?: string;
  material?: string;
  materialName?: string;
  source?: string;
  supplier?: string;
  quantity?: string | number;
  qcStatus?: "APPROVED" | "REJECTED" | "PENDING" | string;
  status?: string;
  remarks?: string;
  qaqcRemarks?: string;
  [key: string]: any;
}

export interface QuantitySummaryRow {
  element: string;
  scopeCum: number;
  completionPercentage: number;
  scope?: number | string;
  completion?: number | string;
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

export interface NcrRemediationRow {
  refNo: string;
  dateIdentified: string;
  elementLevel: string;
  errorCategory?: string;
  description: string;
  riskLevel: "H" | "M" | "L" | string;
  assignedTo: string;
  targetFixDate: string;
  status: "OPEN" | "CLOSED" | "UNDER REVIEW" | string;
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
  element?: string;
  status: "Compliant" | "Action Required" | "Pending" | "Under Review" | string;
  comments: string;
  commentItems?: string[];
}

export interface StructuralElementRow {
  id?: string;
  elementType?: string;
  type?: string;
  element?: string;
  elementName?: string;
  name?: string;
  gridLocation?: string;
  grid?: string;
  calculatedVolume?: number | string;
  volume?: number | string;
  achievedVolume?: number | string;
  arcvievedVolume?: number | string;
  achieved?: number | string;
  completedVolume?: number | string;
  completionPercentage?: number | string;
  completion?: number | string;
  status?: string;
  concreteGrade?: string;
  castingDate?: string;
  columnShape?: string;
  [key: string]: any;
}

export interface PreparedByInfo {
  name: string;
  email: string;
  role?: string;
  designation?: string;
  signed?: boolean;
  signatureUrl?: string;
  signedAt?: string;
}

export interface SiteInstructionRow {
  id?: string;
  instructionNumber?: string;
  title?: string;
  subject?: string;
  type?: string;
  severity?: string;
  status?: string;
  location?: string;
  levelName?: string;
  elementName?: string;
  instructionText?: string;
  mandatoryActions?: string[];
  complianceDeadline?: string;
  stopWorkOrdered?: boolean;
  signedBy?: { name?: string; role?: string };
  createdAt?: number | string;
  [key: string]: any;
}

export interface MepClearanceRow {
  elementService: string;
  subcontractor: string;
  completionPct: number;
  status: "PENDING" | "IN PROGRESS" | "APPROVED" | "HOLD" | "REJECTED" | string;
  remarks: string;
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
  coverImageBase64?: string;
  coverImageUrl?: string;
  projectCoverImageUrl?: string;
  includeNcrsAndComments?: boolean;
  includeNcrs?: boolean;
  includeSiteComments?: boolean;
  includeSiteInstructions?: boolean;
  siteInstructions?: SiteInstructionRow[];
  filteredSiteInstructions?: SiteInstructionRow[];
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
// FALLBACK ASSETS & CONSTANTS
// ==========================================

const FALLBACK_COMPANY_LOGO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAMAAABwKC9UAAAASFBMVEUAAAD///8Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas0Aas2WCHg1AAAAFnRSTlMAgDAwQEBAQGBgcHCAgIDAwMDQ0NDY2K99BgAAAAlJREFUaN7t2tlywyAMQBFbYsc97///bAtOC0mGgG069S7z6iSOfgIkS6K6u7u7u7v7P7skms7z9X68m9Z0mctpXbWmWvN0X67b7XhdF8W6S3XvSscscK9KxyxwSyrscMAs6bDDgVpSZUdClpTZ0ZAlZXY0ZEmZHQ1ZUmZHQ5aU2dGQJWV2NGRJmR0NWVJmR0OWlNnRkCVldjRkSXMpI0OalJHxiBlf9w8wXh7wM079PCHm89KAn69rw37+vA7858cbwX8+bxf+87mF4D9fWw3+87XN4D9f7wb/eR9u9CfcCENgCIbAEAyBIRgCQzAEhmAIDMEQGIIhMARDoAnvX67N6/w8m87VvC3rvGzL7bgt++O2pX8CChgN7Zg670gAAAAASUVORK5CYII=";

// ==========================================
// IMAGE COMPRESSION HELPER
// ==========================================

const compressImage = async (
  imageUrl: string,
  maxWidth: number = 2800,
  quality: number = 0.92,
): Promise<string> => {
  if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim()) {
    return "";
  }

  let sourceUrl = imageUrl;

  // If remote HTTP URL, attempt fetch-as-blob conversion first to bypass canvas tainting
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    try {
      const res = await fetch(imageUrl, { mode: "cors" });
      if (res.ok) {
        const blob = await res.blob();
        sourceUrl = await new Promise<string>((resBlob, rejBlob) => {
          const reader = new FileReader();
          reader.onloadend = () => resBlob(reader.result as string);
          reader.onerror = rejBlob;
          reader.readAsDataURL(blob);
        });
      }
    } catch {
      // CORS restricted, proceed with standard Image element
    }
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

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
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(sourceUrl.startsWith("data:") ? sourceUrl : "");
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(sourceUrl.startsWith("data:") ? sourceUrl : "");
      }
    };
    img.onerror = () => {
      resolve(sourceUrl.startsWith("data:") ? sourceUrl : "");
    };
    img.src = sourceUrl;
  });
};

// ==========================================
// CLOSING SLIDE HELPER
// ==========================================

const renderClosingSlide = (
  doc: jsPDF,
  projectName: string,
  preparedBy: PreparedByInfo,
  logoBase64?: string,
  companyName?: string,
) => {
  doc.addPage();
  const pageWidth = 297;
  const pageHeight = 210;

  // -------------------------------------------------------------
  // DUAL-TONE ARCHITECTURAL SPLIT LAYOUT
  // Left Panel (95mm): Industrial Slate Branding & Accreditation
  // Right Panel (202mm): Clean Light Workspace & Sign-off Details
  // -------------------------------------------------------------
  const splitX = 95;

  // 1. LEFT PANEL - Deep Industrial Slate
  doc.setFillColor(15, 23, 42).rect(0, 0, splitX, pageHeight, "F");

  // Vibrant Emerald Green Structural Accent Bar
  doc.setFillColor(16, 185, 129).rect(splitX - 3, 0, 3, pageHeight, "F");

  // 2. RIGHT PANEL - Crisp Light Slate Background
  doc.setFillColor(248, 250, 252).rect(splitX, 0, pageWidth - splitX, pageHeight, "F");

  // Modern Blueprint Grid Lines (Right Panel background)
  doc.setDrawColor(226, 232, 240).setLineWidth(0.3);
  doc.line(splitX + 20, 0, splitX + 20, pageHeight);
  doc.line(pageWidth - 20, 0, pageWidth - 20, pageHeight);
  doc.line(splitX, pageHeight - 25, pageWidth, pageHeight - 25);

  // =============================================================
  // LEFT PANEL: BRANDING & ACCREDITATION
  // =============================================================
  const leftCenterX = splitX / 2;

  // Company Logo
  let logoY = 42;
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", leftCenterX - 25, 30, 50, 22);
      logoY = 62;
    } catch {}
  }

  // Company Name
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(255, 255, 255);
  doc.text((companyName || "BENCHMARK QA/QC").toUpperCase(), leftCenterX, logoY, {
    align: "center",
  });

  // Divider Line
  doc.setDrawColor(51, 65, 85).setLineWidth(0.5);
  doc.line(20, logoY + 10, splitX - 20, logoY + 10);

  // ISO Certification Box
  const certY = logoY + 24;
  doc.setFillColor(30, 41, 59).roundedRect(15, certY, splitX - 30, 46, 3, 3, "F");
  doc.setDrawColor(51, 65, 85).roundedRect(15, certY, splitX - 30, 46, 3, 3, "S");

  doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(16, 185, 129);
  doc.text("QUALITY MANAGEMENT SYSTEM", leftCenterX, certY + 11, { align: "center" });

  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(255, 255, 255);
  doc.text("ISO 9001:2015", leftCenterX, certY + 21, { align: "center" });

  doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(148, 163, 184);
  doc.text("Civil Engineering & Quality", leftCenterX, certY + 31, { align: "center" });
  doc.text("Compliance Verified", leftCenterX, certY + 37, { align: "center" });

  // =============================================================
  // RIGHT PANEL: AUDIT COMPLETION & SIGN-OFF
  // =============================================================
  const rightStartX = splitX + 25;

  // Audit Status Badge
  doc.setFillColor(16, 185, 129).roundedRect(rightStartX, 35, 48, 7, 2, 2, "F");
  doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(255, 255, 255);
  doc.text("AUDIT COMPLETE", rightStartX + 24, 39.5, { align: "center" });

  // Main Slide Title
  doc.setFont("helvetica", "bold").setFontSize(24).setTextColor(15, 23, 42);
  doc.text("QUALITY EXCELLENCE", rightStartX, 54);
  doc.text("VERIFICATION REPORT", rightStartX, 64);

  // Decorative Underline
  doc.setDrawColor(16, 185, 129).setLineWidth(1.5);
  doc.line(rightStartX, 70, rightStartX + 35, 70);

  // Project Info
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(71, 85, 105);
  doc.text((projectName || "Project Site").toUpperCase(), rightStartX, 80);

  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(100, 116, 139);
  doc.text(
    "Weekly Structural Quality Control, Surveillance & Materials Conformance Audit",
    rightStartX,
    86,
  );

  // Compiler Authorization Card
  const cardX = rightStartX;
  const cardY = 102;
  const cardW = pageWidth - rightStartX - 25;
  const cardH = 65;

  // Card Background
  doc.setFillColor(255, 255, 255).roundedRect(cardX, cardY, cardW, cardH, 4, 4, "F");
  doc.setDrawColor(226, 232, 240).setLineWidth(0.8);
  doc.roundedRect(cardX, cardY, cardW, cardH, 4, 4, "S");

  // Card Left Accent Ribbon
  doc.setFillColor(15, 23, 42).roundedRect(cardX, cardY, 4, cardH, 4, 0, "F");

  // Card Header
  doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(100, 116, 139);
  doc.text("AUTHORIZATION & COMPLIANCE SIGN-OFF", cardX + 15, cardY + 14);

  // Compiler Details
  const compilerName = preparedBy?.name || "Operations Lead";
  const compilerMail = preparedBy?.email || "info@jqms.org";
  const compilerRole =
    preparedBy?.designation || preparedBy?.role || "QA/QC Engineer";

  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(15, 23, 42);
  doc.text(compilerName, cardX + 15, cardY + 26);

  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(16, 185, 129);
  doc.text(compilerRole.toUpperCase(), cardX + 15, cardY + 34);

  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(71, 85, 105);
  doc.text(`Email: ${compilerMail}`, cardX + 15, cardY + 44);

  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(148, 163, 184);
  doc.text(`Issued: ${new Date().toLocaleDateString("en-GB")}`, cardX + 15, cardY + 53);

  // Footer Confidentiality Statement
  doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(148, 163, 184);
  doc.text(
    "CONFIDENTIAL  |  PREPARED FOR CLIENT, SUPERVISING CONSULTANT & INTERNAL QUALITY AUDITING ONLY",
    rightStartX,
    pageHeight - 12,
  );
};

// ==========================================
// MAIN PRESENTATION GENERATOR
// ==========================================

export async function generateWeeklyPresentationPDF(
  report: WeeklyReportData,
): Promise<void> {
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

  // Surveillance options evaluation
  const showNcrs =
    report.includeNcrs !== false &&
    (report.includeNcrs === true || report.includeNcrsAndComments !== false);
  const showSiteComments =
    report.includeSiteComments !== false &&
    (report.includeSiteComments === true ||
      report.includeNcrsAndComments !== false);
  const showSiteInstructions = report.includeSiteInstructions === true;

  const applySlideTemplate = (titleText: string) => {
    const headerLogoW = 20;
    const headerLogoH = 10;
    if (report.logoBase64) {
      try {
        doc.addImage(
          report.logoBase64,
          "PNG",
          margin,
          4,
          headerLogoW,
          headerLogoH,
        );
      } catch {}
    }

    doc
      .setFont("helvetica", "bold")
      .setFontSize(8.5)
      .setTextColor(100, 116, 139);
    doc.text(
      `${report.weekEnd || "CURRENT"}  |  QA/QC SURVEILLANCE  |  ${titleText.toUpperCase()}`,
      margin + (report.logoBase64 ? headerLogoW + 4 : 0),
      11,
    );

    doc
      .setFont("helvetica", "normal")
      .setFontSize(7.5)
      .setTextColor(148, 163, 184);
    doc.text(
      `${(report.projectName || "PROJECT").toUpperCase()}  |  CONFIDENTIAL`,
      endX,
      11,
      { align: "right" },
    );

    // Deep navy header line + gold pinstripe
    doc.setFillColor(15, 23, 42).rect(margin, 15, contentWidth, 0.8, "F");
    doc
      .setFillColor(212, 163, 115)
      .rect(margin, 15.8, contentWidth * 0.25, 0.6, "F");

    // Bottom footer line
    doc.setDrawColor(226, 232, 240).setLineWidth(0.3);
    doc.line(margin, pageHeight - 13, endX, pageHeight - 13);

    const compilerName = report.preparedBy?.name || "QA/QC Field Operations";
    const compilerRole =
      report.preparedBy?.designation ||
      report.preparedBy?.role ||
      "QA/QC Engineer";

    doc
      .setFont("helvetica", "normal")
      .setFontSize(7)
      .setTextColor(148, 163, 184);
    doc.text(
      `Compiled By: ${compilerName} (${compilerRole})  |  ISO 9001:2015 Quality Management System`,
      margin,
      pageHeight - 8,
    );

    doc
      .setFillColor(15, 23, 42)
      .roundedRect(endX - 18, pageHeight - 11.5, 18, 6, 1.5, 1.5, "F");
    doc
      .setFont("helvetica", "bold")
      .setFontSize(7.5)
      .setTextColor(255, 255, 255);
    doc.text(
      `SLIDE ${String(slideNumberRef.current).padStart(2, "0")}`,
      endX - 9,
      pageHeight - 7.5,
      { align: "center" },
    );
  };

  const createNewSlide = (titleText: string) => {
    doc.addPage();
    slideNumberRef.current++;
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
      "[No records registered for the current quality evaluation window]",
      x,
      y,
      { maxWidth: textWidth },
    );
  };

  // Helper to draw structural element tables with full pagination
  const drawStructuralElementsTable = (
    targetDoc: jsPDF,
    elements: StructuralElementRow[],
    typeLabel: string,
    tableMargin: number,
    tableWidth: number,
    docPageHeight: number,
    templateFn: (title: string) => void,
    newSlideFn: (title: string) => void,
    noDataFn: (x: number, y: number, textWidth?: number) => void,
    slideRef: { current: number },
  ) => {
    const thH = 8.5;
    const rowH = 8.2;
    const cols = [52, 45, 42, 42, 56]; // sum = 237, remainder given to column 4
    const remaining = tableWidth - (52 + 45 + 42 + 42 + 56);
    if (remaining > 0) cols[4] += remaining;

    const headers = [
      "ELEMENT IDENTIFIER",
      "GRID COORDINATE",
      "DESIGN VOL (m³)",
      "ACHIEVED (m³)",
      "SURVEILLANCE / STATUS",
    ];

    const drawHeader = (y: number) => {
      targetDoc
        .setFillColor(15, 23, 42)
        .rect(tableMargin, y, tableWidth, thH, "F");
      targetDoc
        .setFillColor(212, 163, 115)
        .rect(tableMargin, y + thH - 0.7, tableWidth, 0.7, "F");
      targetDoc
        .setFont("helvetica", "bold")
        .setFontSize(7.5)
        .setTextColor(255, 255, 255);
      let currX = tableMargin;
      headers.forEach((h, idx) => {
        targetDoc.text(h, currX + 3.5, y + 5.5);
        currX += cols[idx];
      });
    };

    let tableY = 25;
    drawHeader(tableY);
    tableY += thH;

    if (elements.length === 0) {
      targetDoc
        .setFillColor(248, 250, 252)
        .rect(tableMargin, tableY, tableWidth, 20, "F");
      targetDoc
        .setDrawColor(226, 232, 240)
        .setLineWidth(0.3)
        .rect(tableMargin, tableY, tableWidth, 20, "S");
      noDataFn(tableMargin + 6, tableY + 11, tableWidth - 12);
      return;
    }

    let totalCalc = 0;
    let totalAch = 0;

    elements.forEach((el, rIdx) => {
      const calcVol =
        parseFloat(String(el.calculatedVolume || el.volume || 0)) || 0;
      const achVol =
        parseFloat(
          String(
            el.achievedVolume ??
              el.arcvievedVolume ??
              el.achieved ??
              el.completedVolume ??
              0,
          ),
        ) || 0;
      totalCalc += calcVol;
      totalAch += achVol;

      let compPct =
        calcVol > 0
          ? Math.round((achVol / calcVol) * 100)
          : Number(el.completionPercentage || el.completion || 0);
      compPct = Math.min(100, Math.max(0, compPct));

      // Page overflow check (leave space for row + footer total)
      if (tableY + rowH > docPageHeight - 22) {
        newSlideFn(
          `${report.selectedLevel || "Level"} — ${typeLabel} Status (Cont'd)`,
        );
        tableY = 25;
        drawHeader(tableY);
        tableY += thH;
      }

      const isEven = rIdx % 2 === 0;
      targetDoc
        .setFillColor(
          isEven ? 255 : 248,
          isEven ? 255 : 250,
          isEven ? 255 : 252,
        )
        .rect(tableMargin, tableY, tableWidth, rowH, "F");
      targetDoc
        .setDrawColor(226, 232, 240)
        .setLineWidth(0.2)
        .rect(tableMargin, tableY, tableWidth, rowH, "S");

      let currX = tableMargin;

      // 0: Element Identifier
      const elName = (
        el.elementName ||
        el.name ||
        el.element ||
        el.id ||
        "—"
      ).toUpperCase();
      targetDoc
        .setFont("helvetica", "bold")
        .setFontSize(7.5)
        .setTextColor(15, 23, 42);
      targetDoc.text(elName, currX + 3.5, tableY + 5.3);
      currX += cols[0];

      // 1: Grid Coordinate
      const gridLoc = el.gridLocation || el.grid || "—";
      targetDoc
        .setFont("helvetica", "normal")
        .setFontSize(7)
        .setTextColor(71, 85, 105);
      targetDoc.text(gridLoc, currX + 3.5, tableY + 5.3);
      currX += cols[1];

      // 2: Design Vol
      targetDoc
        .setFont("helvetica", "normal")
        .setFontSize(7.5)
        .setTextColor(51, 65, 85);
      targetDoc.text(
        calcVol > 0 ? calcVol.toFixed(2) : "—",
        currX + 3.5,
        tableY + 5.3,
      );
      currX += cols[2];

      // 3: Achieved Vol
      targetDoc
        .setFont("helvetica", "bold")
        .setFontSize(7.5)
        .setTextColor(15, 23, 42);
      targetDoc.text(
        achVol > 0 ? achVol.toFixed(2) : "0.00",
        currX + 3.5,
        tableY + 5.3,
      );
      currX += cols[3];

      // 4: Progress Bar + Status Badge
      const barX = currX + 3.5;
      const barW = 20;
      const barH = 3;
      const barY = tableY + (rowH - barH) / 2;

      targetDoc.setFillColor(226, 232, 240);
      targetDoc.roundedRect(barX, barY, barW, barH, 0.8, 0.8, "F");

      const fillW = Math.max(0.5, (compPct / 100) * barW);
      targetDoc.setFillColor(
        compPct === 100 ? 22 : 217,
        compPct === 100 ? 163 : 119,
        compPct === 100 ? 74 : 6,
      );
      targetDoc.roundedRect(barX, barY, fillW, barH, 0.8, 0.8, "F");

      targetDoc
        .setFont("helvetica", "bold")
        .setFontSize(7)
        .setTextColor(51, 65, 85);
      targetDoc.text(`${compPct}%`, barX + barW + 2.5, tableY + 5.3);

      // Status pill
      const statusText = (
        el.status ||
        (compPct === 100 ? "APPROVED" : compPct > 0 ? "IN PROGRESS" : "PENDING")
      ).toUpperCase();

      let badgeBg = [241, 245, 249];
      let badgeFg = [100, 116, 139];
      if (
        statusText.includes("APPROVED") ||
        statusText.includes("COMPLETE") ||
        statusText.includes("PASSED")
      ) {
        badgeBg = [220, 252, 231];
        badgeFg = [22, 163, 74];
      } else if (
        statusText.includes("REJECTED") ||
        statusText.includes("HOLD") ||
        statusText.includes("FAILED")
      ) {
        badgeBg = [254, 226, 226];
        badgeFg = [220, 38, 38];
      } else if (
        statusText.includes("IN PROGRESS") ||
        statusText.includes("REBAR") ||
        statusText.includes("FORMWORK")
      ) {
        badgeBg = [254, 243, 199];
        badgeFg = [217, 119, 6];
      }

      const badgeW = 20;
      const badgeX = currX + cols[4] - badgeW - 3;
      targetDoc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
      targetDoc.roundedRect(
        badgeX,
        tableY + 1.8,
        badgeW,
        rowH - 3.6,
        1,
        1,
        "F",
      );
      targetDoc
        .setFont("helvetica", "bold")
        .setFontSize(6)
        .setTextColor(badgeFg[0], badgeFg[1], badgeFg[2]);
      targetDoc.text(
        statusText.slice(0, 12),
        badgeX + badgeW / 2,
        tableY + 5.2,
        { align: "center" },
      );

      tableY += rowH;
    });

    // Total summary row
    if (tableY + rowH > docPageHeight - 16) {
      newSlideFn(`${report.selectedLevel || "Level"} — ${typeLabel} Summary`);
      tableY = 25;
      drawHeader(tableY);
      tableY += thH;
    }
    targetDoc
      .setFillColor(241, 245, 249)
      .rect(tableMargin, tableY, tableWidth, rowH, "F");
    targetDoc
      .setDrawColor(203, 213, 225)
      .setLineWidth(0.3)
      .rect(tableMargin, tableY, tableWidth, rowH, "S");
    targetDoc
      .setFont("helvetica", "bold")
      .setFontSize(8)
      .setTextColor(15, 23, 42);
    targetDoc.text(
      `TOTAL ${typeLabel.toUpperCase()}`,
      tableMargin + 3.5,
      tableY + 5.5,
    );

    let sumX = tableMargin + cols[0] + cols[1];
    targetDoc.text(totalCalc.toFixed(2), sumX + 3.5, tableY + 5.5);
    sumX += cols[2];
    targetDoc.text(totalAch.toFixed(2), sumX + 3.5, tableY + 5.5);
    sumX += cols[3];
    const overallTypePct =
      totalCalc > 0 ? Math.round((totalAch / totalCalc) * 100) : 0;
    targetDoc.text(`${overallTypePct}% COMPLETION`, sumX + 3.5, tableY + 5.5);
  };

  // Helper to render CAD Drawing slide
  const renderCADLayoutSlide = async (title: string, imgUrl?: string) => {
    createNewSlide(title);
    const frameW = contentWidth;
    const frameH = 148;
    const frameY = 24;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240).setLineWidth(0.3);
    doc.roundedRect(margin, frameY, frameW, frameH, 2.5, 2.5, "FD");

    if (imgUrl && (imgUrl.startsWith("http") || imgUrl.startsWith("data:"))) {
      try {
        const compressedCAD = await compressImage(imgUrl, 2800, 0.94);
        doc.addImage(
          compressedCAD,
          "JPEG",
          margin + 3,
          frameY + 3,
          frameW - 6,
          frameH - 14,
        );
      } catch {
        renderNoDataNotice(margin + frameW / 2 - 40, frameY + frameH / 2, 80);
      }
    } else {
      doc
        .setFont("helvetica", "bold")
        .setFontSize(9.5)
        .setTextColor(148, 163, 184);
      doc.text(
        `[CAD TECHNICAL DRAWING ATTACHMENT PENDING FOR ${title.toUpperCase()}]`,
        margin + frameW / 2,
        frameY + frameH / 2 - 4,
        { align: "center" },
      );
      renderNoDataNotice(margin + frameW / 2 - 40, frameY + frameH / 2 + 5, 80);
    }

    // Title tag bar at bottom of frame
    doc
      .setFillColor(15, 23, 42)
      .rect(margin, frameY + frameH - 10, frameW, 10, "F");
    doc
      .setFillColor(212, 163, 115)
      .rect(margin, frameY + frameH - 10, 4, 10, "F");
    doc
      .setFont("helvetica", "bold")
      .setFontSize(7.5)
      .setTextColor(255, 255, 255);
    doc.text(
      `${title.toUpperCase()}  |  VERIFIED AS-BUILT SURVEILLANCE OVERLAY`,
      margin + 8,
      frameY + frameH - 3.8,
    );
  };

  // ==========================================
  // SLIDE 1: SPLIT-SCREEN LUXURY COVER
  // ==========================================
  const leftWidth = pageWidth * 0.5;
  const rightWidth = pageWidth - leftWidth;

  // Left background
  doc.setFillColor(248, 250, 252).rect(0, 0, leftWidth, pageHeight, "F");

  // Cover image on right half
  const rawCoverImage =
    report.projectCoverImageUrl ||
    report.coverImageUrl ||
    report.coverImageBase64 ||
    "";

  if (
    rawCoverImage &&
    (rawCoverImage.startsWith("http") || rawCoverImage.startsWith("data:"))
  ) {
    try {
      const compressedCover = await compressImage(rawCoverImage, 1800, 0.75);
      doc.addImage(
        compressedCover,
        "JPEG",
        leftWidth,
        0,
        rightWidth,
        pageHeight,
      );
    } catch {
      doc
        .setFillColor(226, 232, 240)
        .rect(leftWidth, 0, rightWidth, pageHeight, "F");
    }
  } else {
    doc
      .setFillColor(226, 232, 240)
      .rect(leftWidth, 0, rightWidth, pageHeight, "F");
  }

  // Vertical gold accent line separating left & right
  doc.setFillColor(212, 163, 115).rect(leftWidth - 1, 0, 2, pageHeight, "F");

  // Company logo on top-left
  if (report.logoBase64) {
    try {
      doc.addImage(report.logoBase64, "PNG", 20, 22, 36, 18);
    } catch {}
  }

  // Company name
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(212, 163, 115);
  doc.text(
    (report.companyName || " ").toUpperCase(),
    20,
    report.logoBase64 ? 47 : 35,
  );

  // Project title
  doc.setFont("helvetica", "bold").setFontSize(28).setTextColor(15, 23, 42);
  const projTitle = (report.projectName || "Site Operations").toUpperCase();
  const splitProj = doc.splitTextToSize(projTitle, leftWidth - 40);
  doc.text(splitProj, 20, report.logoBase64 ? 60 : 48);

  const titleBottomY = (report.logoBase64 ? 60 : 48) + splitProj.length * 9;

  // Gold accent rule
  doc.setDrawColor(212, 163, 115).setLineWidth(1.2);
  doc.line(20, titleBottomY, 70, titleBottomY);

  // Report Main Heading
  doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(15, 23, 42);
  doc.text("QA/QC WEEKLY REPORT", 20, titleBottomY + 12);

  // Scope level badge
  doc
    .setFillColor(241, 245, 249)
    .roundedRect(20, titleBottomY + 18, 75, 7, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(100, 116, 139);
  doc.text(
    `SURVEILLANCE: ${(report.selectedLevel || "ALL LEVELS").toUpperCase()}`,
    24,
    titleBottomY + 22.8,
  );

  // Date Range Dark Navy Pill
  const datePillW = 100;
  const datePillH = 9;
  const datePillY = titleBottomY + 30;

  doc
    .setFillColor(15, 23, 42)
    .roundedRect(20, datePillY, datePillW, datePillH, 2, 2, "F");
  doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(255, 255, 255);
  doc.text(
    `${report.weekStart || "—"}   TO   ${report.weekEnd || "—"}`,
    20 + datePillW / 2,
    datePillY + 5.8,
    { align: "center" },
  );

  // Single compiler sign-off container at bottom-left
  const compilerBoxW = leftWidth - 40;
  const compilerBoxH = 26;
  const compilerBoxY = pageHeight - 44;

  doc
    .setFillColor(255, 255, 255)
    .roundedRect(20, compilerBoxY, compilerBoxW, compilerBoxH, 2, 2, "F");
  doc.setDrawColor(226, 232, 240).setLineWidth(0.4);
  doc.roundedRect(20, compilerBoxY, compilerBoxW, compilerBoxH, 2, 2, "S");
  doc.setFillColor(212, 163, 115).rect(20, compilerBoxY, 3, compilerBoxH, "F");

  doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(148, 163, 184);
  doc.text("AUTHORIZED COMPILER & QA/QC OFFICER", 28, compilerBoxY + 7);

  const compilerName = report.preparedBy?.name || "Operations Lead";
  const compilerRole =
    report.preparedBy?.designation ||
    report.preparedBy?.role ||
    "QA/QC Engineer";

  doc.setFont("helvetica", "bold").setFontSize(9.5).setTextColor(15, 23, 42);
  doc.text(compilerName, 28, compilerBoxY + 15);

  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(100, 116, 139);
  doc.text(compilerRole, 28, compilerBoxY + 21);

  // ==========================================
  // SLIDE 2A: EXECUTIVE SUMMARY - OVERVIEW
  // ==========================================
  createNewSlide("Executive Summary: Operational Overview");

  // Helper to safely extract numeric values from strings like "32.4 CUM"
  const parseVolume = (val: any) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    // Strip everything except digits, decimal points, and minus signs
    const cleaned = String(val).replace(/[^0-9.-]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // 1. Process Quantity Summary List
  const qSummary1 = (report.quantitySummary || []).map((q) => {
    const scopeVal = parseVolume(q.scope ?? q.scopeCum);
    const completionVal = parseVolume(q.completion ?? q.completionPercentage);

    return {
      element: q.element || "General Element",
      scopeCum: scopeVal,
      completionPercentage: completionVal,
    };
  });

  // 2. Total Scope Calculation from Processed List
  const totalQtyScope1 = qSummary1.reduce((acc, cur) => acc + cur.scopeCum, 0);

  // 3. KPI Calculations (Reuse qSummary1 to ensure consistency)
  const totalScopeM3 = totalQtyScope1;

  const totalAchievedM3 = qSummary1.reduce(
    (acc, cur) => acc + (cur.scopeCum * cur.completionPercentage) / 100,
    0,
  );

  // 4. KPI Summary Cards Layout
  const kpiY = 24;
  const kpiH = 26;
  const kpiGap = 6;
  const kpiW = (contentWidth - kpiGap * 3) / 4;

  const kpis = [
    {
      title: "TOTAL SCOPE VOLUME",
      val: `${Math.round(totalScopeM3)} m³`,
      sub: "Design Volume Target",
      accent: [15, 23, 42],
    },
    {
      title: "ACHIEVED VOLUME",
      val: `${Math.round(totalAchievedM3)} m³`,
      sub: `${report.overallQuantityCompletion || "0"}% Cumulative`,
      accent: [2, 132, 199],
    },
    {
      title: "QUALITY COMPLIANCE",
      val: `${report.overallQualityCompliance || "100"}%`,
      sub: "Field Surveillance Benchmark",
      accent: [22, 163, 74],
    },
    {
      title: "OPEN FINDINGS / NCRS",
      val: `${report.ncrStats?.openTotal ?? 0}`,
      sub: "Active Remediation Items",
      accent:
        (report.ncrStats?.openTotal ?? 0) > 0 ? [220, 38, 38] : [22, 163, 74],
    },
  ];

  kpis.forEach((k, idx) => {
    const kX = margin + idx * (kpiW + kpiGap);
    doc
      .setFillColor(255, 255, 255)
      .roundedRect(kX, kpiY, kpiW, kpiH, 2, 2, "F");
    doc
      .setDrawColor(226, 232, 240)
      .setLineWidth(0.3)
      .roundedRect(kX, kpiY, kpiW, kpiH, 2, 2, "S");
    doc
      .setFillColor(k.accent[0], k.accent[1], k.accent[2])
      .rect(kX, kpiY, kpiW, 2.5, "F");

    doc
      .setFont("helvetica", "bold")
      .setFontSize(6.5)
      .setTextColor(100, 116, 139);
    doc.text(k.title, kX + 6, kpiY + 8.5);

    doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(15, 23, 42);
    doc.text(k.val, kX + 6, kpiY + 17);

    doc
      .setFont("helvetica", "normal")
      .setFontSize(6.5)
      .setTextColor(148, 163, 184);
    doc.text(k.sub, kX + 6, kpiY + 22.5);
  });

  // Core Synopsis callout container
  const synY = 56;
  const synH = 130;
  doc
    .setFillColor(255, 255, 255)
    .roundedRect(margin, synY, contentWidth, synH, 2, 2, "F");
  doc
    .setDrawColor(226, 232, 240)
    .setLineWidth(0.3)
    .roundedRect(margin, synY, contentWidth, synH, 2, 2, "S");
  doc.setFillColor(15, 23, 42).rect(margin, synY, 3.5, synH, "F");

  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(15, 23, 42);
  doc.text(
    "EXECUTIVE QA/QC SYNOPSIS & MANAGEMENT EVALUATION",
    margin + 10,
    synY + 12,
  );

  doc.setDrawColor(212, 163, 115).setLineWidth(0.8);
  doc.line(margin + 10, synY + 16, margin + 85, synY + 16);

  const synopsisText =
    report.synopsis ||
    report.executiveSummary ||
    "All routine surveillance inspections across structural reinforcement, formwork tolerances, MEP pre-pour clearances, and cube compressive specimens were executed in alignment with design specifications and engineering standards.";

  doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(51, 65, 85);
  const splitSyn = doc.splitTextToSize(synopsisText, contentWidth - 24);
  doc.text(splitSyn, margin + 10, synY + 26);

  // ==========================================
  // SLIDE 2B: STRATEGIC INSIGHTS
  // ==========================================
  createNewSlide("Executive Summary: Strategic Insights");

  const colGap = 8;
  const colW = (contentWidth - colGap * 2) / 3;
  const cardY = 25;
  const cardH = 158;

  const strategicCols = [
    {
      title: "KEY PROJECT HIGHLIGHTS",
      text:
        report.highlights ||
        "All major milestones achieved within expected quality tolerance parameters.",
      color: [22, 163, 74],
      bg: [240, 253, 244],
    },
    {
      title: "CRITICAL RISKS & OPEN CONCERNS",
      text:
        report.concerns ||
        "No unmitigated non-conformances registered for this surveillance period.",
      color: [217, 119, 6],
      bg: [255, 251, 235],
    },
    {
      title: "LOOK-AHEAD PLAN & ACTION TARGETS",
      text:
        report.nextWeekPlan ||
        "Proceed with scheduled casting sequences, pre-pour sign-offs, and strength verification.",
      color: [79, 70, 229],
      bg: [238, 242, 255],
    },
  ];

  strategicCols.forEach((col, idx) => {
    const cX = margin + idx * (colW + colGap);
    doc
      .setFillColor(255, 255, 255)
      .roundedRect(cX, cardY, colW, cardH, 2, 2, "F");
    doc
      .setDrawColor(226, 232, 240)
      .setLineWidth(0.3)
      .roundedRect(cX, cardY, colW, cardH, 2, 2, "S");

    // Colored top header bar
    doc
      .setFillColor(col.color[0], col.color[1], col.color[2])
      .rect(cX, cardY, colW, 10, "F");
    doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(255, 255, 255);
    doc.text(col.title, cX + colW / 2, cardY + 6.5, { align: "center" });

    // Inner body
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(51, 65, 85);
    const splitBody = doc.splitTextToSize(col.text, colW - 14);
    doc.text(splitBody, cX + 7, cardY + 20);
  });

  // ==========================================
  // SLIDE 3: CONCRETE COMPRESSIVE STRENGTH MATRIX
  // ==========================================
  createNewSlide("Concrete Compressive Strength Test Matrix");

  const cubeRows = (report.cubeTests || []).map((cube, idx) => {
    return [
      String(cube.sn ?? idx + 1).padStart(2, "0"),
      cube.dateCast || "—",
      cube.inscribedName || cube.elementLevel || "Structural Element",
      cube.strength7Days ? `${cube.strength7Days} N/mm²` : "—",
      cube.status7Days || "Pending",
      cube.strength28Days ? `${cube.strength28Days} N/mm²` : "—",
      cube.status28Days || "Pending",
    ];
  });

  autoTable(doc, {
    startY: 25,
    margin: { left: margin, right: margin },
    head: [
      [
        "S/N",
        "DATE CAST",
        "ELEMENT / LEVEL",
        "7-DAY STRENGTH",
        "7-DAY STATUS",
        "28-DAY STRENGTH",
        "28-DAY STATUS",
      ],
    ],
    body:
      cubeRows.length > 0
        ? cubeRows
        : [
            [
              "—",
              "—",
              "No compressive strength cube test records logged for this cycle",
              "—",
              "—",
              "—",
              "—",
            ],
          ],
    theme: "striped",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      cellPadding: 2.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 28 },
      2: { cellWidth: "auto" },
      3: { cellWidth: 32, halign: "right" },
      4: { cellWidth: 28, halign: "center" },
      5: { cellWidth: 32, halign: "right" },
      6: { cellWidth: 28, halign: "center" },
    },
    didParseCell: (data) => {
      if (
        data.section === "body" &&
        (data.column.index === 4 || data.column.index === 6)
      ) {
        const val = String(data.cell.raw || "").toUpperCase();
        if (val.includes("PASSED")) {
          data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fontStyle = "bold";
        } else if (val.includes("FAILED")) {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [217, 119, 6];
        }
      }
    },
  });

  // ==========================================
  // SLIDE 4: MATERIAL & QUANTITY SCHEDULE + DONUT CHART
  // ==========================================
  createNewSlide(
    `${report.selectedLevel || "Project Scope"} — Material & Quantity Summary`,
  );

  const leftTableW = 145;
  const leftTableCols = [55, 42, 48];
  let qtyTableY = 26;

  doc.setFillColor(15, 23, 42).rect(margin, qtyTableY, leftTableW, 8, "F");
  doc
    .setFillColor(212, 163, 115)
    .rect(margin, qtyTableY + 7.3, leftTableW, 0.7, "F");
  doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(255, 255, 255);
  doc.text("ELEMENT", margin + 4, qtyTableY + 5.5);
  doc.text("SCOPE (m³)", margin + leftTableCols[0] + 4, qtyTableY + 5.5);
  doc.text(
    "% COMPLETION",
    margin + leftTableCols[0] + leftTableCols[1] + 4,
    qtyTableY + 5.5,
  );
  qtyTableY += 8;

  const chartPalette = [
    [15, 23, 42], // Navy
    [212, 163, 115], // Gold
    [22, 163, 74], // Emerald
    [2, 132, 199], // Sky Blue
    [124, 58, 237], // Purple
    [100, 116, 139], // Slate
  ];

  const qSummary = (report.quantitySummary || []).map((q) => {
    return {
      element: q.element || "General Element",
      scopeCum: parseFloat(String(q.scope ?? q.scopeCum ?? 0)) || 0,
      completionPercentage:
        parseFloat(String(q.completion ?? q.completionPercentage ?? 0)) || 0,
    };
  });

  let totalQtyScope = 0;
  qSummary.forEach((q) => (totalQtyScope += q.scopeCum));

  if (qSummary.length > 0) {
    qSummary.forEach((qRow, rIdx) => {
      const isEven = rIdx % 2 === 0;
      doc.setFillColor(
        isEven ? 255 : 248,
        isEven ? 255 : 250,
        isEven ? 255 : 252,
      );
      doc.rect(margin, qtyTableY, leftTableW, 8.5, "F");
      doc
        .setDrawColor(226, 232, 240)
        .setLineWidth(0.2)
        .rect(margin, qtyTableY, leftTableW, 8.5, "S");

      // Left color marker
      const colColor = chartPalette[rIdx % chartPalette.length];
      doc
        .setFillColor(colColor[0], colColor[1], colColor[2])
        .rect(margin, qtyTableY, 2.5, 8.5, "F");

      doc
        .setFont("helvetica", "bold")
        .setFontSize(7.5)
        .setTextColor(15, 23, 42);
      doc.text(qRow.element, margin + 6, qtyTableY + 5.5);

      doc
        .setFont("helvetica", "normal")
        .setFontSize(7.5)
        .setTextColor(51, 65, 85);
      doc.text(
        `${qRow.scopeCum.toFixed(1)} m³`,
        margin + leftTableCols[0] + 4,
        qtyTableY + 5.5,
      );

      // In-cell mini progress bar
      const barX = margin + leftTableCols[0] + leftTableCols[1] + 4;
      const barW = 20;
      const barH = 3;
      const barY = qtyTableY + (8.5 - barH) / 2;

      doc.setFillColor(226, 232, 240);
      doc.roundedRect(barX, barY, barW, barH, 0.8, 0.8, "F");

      const fillW = Math.max(
        0.5,
        (Math.min(100, qRow.completionPercentage) / 100) * barW,
      );
      doc.setFillColor(
        qRow.completionPercentage === 100 ? 22 : 217,
        qRow.completionPercentage === 100 ? 163 : 119,
        qRow.completionPercentage === 100 ? 74 : 6,
      );
      doc.roundedRect(barX, barY, fillW, barH, 0.8, 0.8, "F");

      doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(51, 65, 85);
      doc.text(
        `${Math.round(qRow.completionPercentage)}%`,
        barX + barW + 3,
        qtyTableY + 5.5,
      );

      qtyTableY += 8.5;
    });

    // Summary Total Row
    doc
      .setFillColor(241, 245, 249)
      .rect(margin, qtyTableY, leftTableW, 8.5, "F");
    doc
      .setDrawColor(203, 213, 225)
      .rect(margin, qtyTableY, leftTableW, 8.5, "S");
    doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(15, 23, 42);
    doc.text("TOTAL CUMULATIVE SCOPE", margin + 6, qtyTableY + 5.5);
    doc.text(
      `${totalQtyScope.toFixed(1)} m³`,
      margin + leftTableCols[0] + 4,
      qtyTableY + 5.5,
    );
    doc.text(
      `${report.overallQuantityCompletion || 0}`,
      margin + leftTableCols[0] + leftTableCols[1] + 4,
      qtyTableY + 5.5,
    );
  } else {
    renderNoDataNotice(margin + 6, qtyTableY + 8, leftTableW - 12);
  }

  // Right Side Donut / Pie Chart Simulation
  const rightCanvasX = margin + leftTableW + 12;
  const rightCanvasW = contentWidth - leftTableW - 12;
  const rightCanvasH = 95;

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(rightCanvasX, 26, rightCanvasW, rightCanvasH, 2.5, 2.5, "F");
  doc.setDrawColor(226, 232, 240).setLineWidth(0.3);
  doc.roundedRect(rightCanvasX, 26, rightCanvasW, rightCanvasH, 2.5, 2.5, "S");

  doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(15, 23, 42);
  doc.text("STRUCTURAL SCOPE DISTRIBUTION", rightCanvasX + 8, 35);

  if (qSummary.length > 0 && totalQtyScope > 0) {
    const centerX = rightCanvasX + 38;
    const centerY = 70;
    const radius = 25;
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

    qSummary.forEach((qRow, idx) => {
      if (qRow.scopeCum <= 0) return;
      const slicePct = qRow.scopeCum / totalQtyScope;
      const angleDelta = slicePct * 360;
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

    // Donut center hole in white
    doc.setFillColor(255, 255, 255);
    doc.circle(centerX, centerY, 12, "F");
    doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(15, 23, 42);
    doc.text("TOTAL", centerX, centerY - 1, { align: "center" });
    doc
      .setFont("helvetica", "normal")
      .setFontSize(6.5)
      .setTextColor(100, 116, 139);
    doc.text(`${Math.round(totalQtyScope)} m³`, centerX, centerY + 3.5, {
      align: "center",
    });

    // Legend on Right of Donut
    let legY = 44;
    const legX = rightCanvasX + 78;
    qSummary.forEach((qRow, idx) => {
      const currentFill = chartPalette[idx % chartPalette.length];
      doc.setFillColor(currentFill[0], currentFill[1], currentFill[2]);
      doc.roundedRect(legX, legY, 3, 3, 0.5, 0.5, "F");

      doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(15, 23, 42);
      doc.text(qRow.element, legX + 5, legY + 2.6);

      const pctStr = `${Math.round((qRow.scopeCum / totalQtyScope) * 100)}%`;
      doc
        .setFont("helvetica", "normal")
        .setFontSize(6.5)
        .setTextColor(100, 116, 139);
      doc.text(pctStr, legX + 48, legY + 2.6, { align: "right" });

      legY += 7.5;
    });
  }

  // =========================================================================
  // SLIDES 5+: STRUCTURAL ELEMENTS & CAD LAYOUTS (BY-TYPE FLOW AS REQUESTED)
  // 1. Columns table(s) -> Column layout
  // 2. Beams table(s)   -> Beam layout
  // 3. Slabs table(s)   -> Slab layout
  // =========================================================================
  const elements = report.structuralElements || [];

  // 1. COLUMNS GROUP
  const columnElements = elements.filter((el) => {
    const t = (el.elementType || el.type || el.element || "").toLowerCase();
    return t.includes("column");
  });
  createNewSlide(`${report.selectedLevel || "Level"} — Column Elements Status`);
  drawStructuralElementsTable(
    doc,
    columnElements,
    "Columns",
    margin,
    contentWidth,
    pageHeight,
    applySlideTemplate,
    createNewSlide,
    renderNoDataNotice,
    slideNumberRef,
  );
  await renderCADLayoutSlide(
    "Columns Layout & Casting Inspection",
    report.columnLayoutImg,
  );

  // 2. BEAMS GROUP
  const beamElements = elements.filter((el) => {
    const t = (el.elementType || el.type || el.element || "").toLowerCase();
    return t.includes("beam");
  });
  createNewSlide(`${report.selectedLevel || "Level"} — Beam Elements Status`);
  drawStructuralElementsTable(
    doc,
    beamElements,
    "Beams",
    margin,
    contentWidth,
    pageHeight,
    applySlideTemplate,
    createNewSlide,
    renderNoDataNotice,
    slideNumberRef,
  );
  await renderCADLayoutSlide(
    "Beams Layout & Reinforcement Inspection",
    report.beamLayoutImg,
  );

  // 3. SLABS GROUP
  const slabElements = elements.filter((el) => {
    const t = (el.elementType || el.type || el.element || "").toLowerCase();
    return t.includes("slab");
  });
  // if (slabElements.length > 0) {
  //   createNewSlide(`${report.selectedLevel || "Level"} — Slab Panels Status`);
  //   drawStructuralElementsTable(
  //     doc,
  //     slabElements,
  //     "Slabs",
  //     margin,
  //     contentWidth,
  //     pageHeight,
  //     applySlideTemplate,
  //     createNewSlide,
  //     renderNoDataNotice,
  //     slideNumberRef,
  //   );
  // }
  await renderCADLayoutSlide(
    "Slabs Layout & Concreting Inspection",
    report.slabImg,
  );

  // ==========================================
  // SLIDE: MEP PRE-CASTING QA/QC CLEARANCE
  // ==========================================
  createNewSlide("MEP QA/QC Clearance Status — Pre-Casting");

  const mepRows = (report.mepClearance || []).map((mep, idx) => {
    return [
      String(idx + 1).padStart(2, "0"),
      mep.elementService || "MEP Service",
      mep.subcontractor || "Trade Contractor",
      `${mep.completionPct || 0}%`,
      mep.status || "PENDING",
      mep.remarks || "Inspected & aligned to structural schedule",
    ];
  });

  autoTable(doc, {
    startY: 25,
    margin: { left: margin, right: margin },
    head: [
      [
        "S/N",
        "SERVICE / INSTALLATION",
        "TRADE SUBCONTRACTOR",
        "PROGRESS %",
        "CLEARANCE STATUS",
        "ENGINEERING REMARKS",
      ],
    ],
    body:
      mepRows.length > 0
        ? mepRows
        : [
            [
              "—",
              "No MEP service clearances recorded for this cycle",
              "—",
              "—",
              "—",
              "—",
            ],
          ],
    theme: "striped",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      cellPadding: 2.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 55 },
      2: { cellWidth: 50 },
      3: { cellWidth: 26, halign: "center" },
      4: { cellWidth: 35 },
      5: { cellWidth: "auto" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 4) {
        const val = String(data.cell.raw || "").toUpperCase();
        if (val.includes("APPROVED")) {
          data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fontStyle = "bold";
        } else if (val.includes("HOLD") || val.includes("REJECTED")) {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [217, 119, 6];
        }
      }
    },
  });

  // ==========================================
  // SLIDE: MATERIAL DELIVERY LOG
  // ==========================================
  createNewSlide("Material Delivery Log & Traceability");

  const matRows = (report.materialDeliveries || []).map((m: any, idx: number) => {
    let displayQty = String(m.quantity || "—");
    if (
      (m.quantityAccepted !== undefined || (m.quantityRejected !== undefined && m.quantityRejected > 0)) &&
      m.quantityAccepted !== undefined
    ) {
      displayQty = `${m.quantity || ""} [${m.quantityAccepted} Acc / ${m.quantityRejected || 0} Rej]`.trim();
    }

    let displayStatus = String(m.status || m.qcStatus || "APPROVED").toUpperCase();
    if (displayStatus === "APPROVED_AS_NOTED") displayStatus = "APPROVED AS NOTED";
    if (displayStatus === "PARTIALLY_ACCEPTED") displayStatus = "PARTIALLY ACCEPTED";
    if (m.ncrNumber) {
      displayStatus += ` (#${m.ncrNumber})`;
    }

    return [
      String(idx + 1).padStart(2, "0"),
      m.deliveryDate || m.date || "—",
      m.materialName || m.materialDescription || m.material || "Structural Supply",
      m.supplier || m.supplierName || m.source || "Approved Vendor",
      displayQty,
      displayStatus,
    ];
  });

  autoTable(doc, {
    startY: 25,
    margin: { left: margin, right: margin },
    head: [
      [
        "S/N",
        "DELIVERY DATE",
        "MATERIAL DESCRIPTION",
        "SOURCE / SUPPLIER",
        "QUANTITY",
        "QC ADMISSION STATUS",
      ],
    ],
    body:
      matRows.length > 0
        ? matRows
        : [
            [
              "—",
              "—",
              "No material delivery admission logs recorded for this cycle",
              "—",
              "—",
              "—",
            ],
          ],
    theme: "striped",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      cellPadding: 2.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 32 },
      2: { cellWidth: "auto" },
      3: { cellWidth: 50 },
      4: { cellWidth: 36, halign: "right" },
      5: { cellWidth: 42, halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        const val = String(data.cell.raw || "").toUpperCase();
        if (val.includes("APPROVED AS NOTED")) {
          data.cell.styles.textColor = [2, 132, 199];
          data.cell.styles.fontStyle = "bold";
        } else if (val.includes("APPROVED") || val.includes("ACCEPTED")) {
          data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fontStyle = "bold";
        } else if (val.includes("REJECTED")) {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [217, 119, 6];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  // ==========================================
  // APPENDICES (ATTACHMENTS)
  // 1. NCR Register: NCR No., Location/Trade, Description, Date Raised, Target Date, Status
  // 2. Site Instruction Register: SI No., Subject, Recipient, Issue Date, Due Date, Compliance Status
  // 3. Site Comments / Observation Log: Ongoing register of routine quality observations, photo logs, vendor checks
  // ==========================================

  // APPENDIX A: NCR REGISTER
  if (showNcrs) {
    createNewSlide("Appendix: NCR Register");

    const ncrRows = (report.ncrRemediationLog || []).map((ncr, idx) => {
      const location =
        ncr.elementLevel || (ncr as any).location || "Site General";
      const trade = (ncr as any).trade || ncr.assignedTo || "";
      const locationTrade = trade ? `${location}\n(${trade})` : location;

      return [
        ncr.refNo ||
          (ncr as any).ncrNumber ||
          `NCR-${String(idx + 1).padStart(3, "0")}`,
        locationTrade,
        ncr.description || "Field variance logged",
        ncr.dateIdentified || (ncr as any).dateFound || "—",
        ncr.targetFixDate || (ncr as any).signDate || "—",
        ncr.status || "OPEN",
      ];
    });

    autoTable(doc, {
      startY: 25,
      margin: { left: margin, right: margin },
      head: [
        [
          "NCR NO.",
          "LOCATION / TRADE",
          "DESCRIPTION",
          "DATE RAISED",
          "TARGET DATE",
          "STATUS",
        ],
      ],
      body:
        ncrRows.length > 0
          ? ncrRows
          : [
              [
                "—",
                "—",
                "No open non-conformance remediation registers recorded",
                "—",
                "—",
                "—",
              ],
            ],
      theme: "striped",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
      },
      styles: {
        fontSize: 7,
        textColor: [51, 65, 85],
        cellPadding: 2.4,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: "bold" },
        1: { cellWidth: 46 },
        2: { cellWidth: "auto" },
        3: { cellWidth: 24 },
        4: { cellWidth: 24 },
        5: { cellWidth: 26, halign: "center" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 5) {
          const val = String(data.cell.raw || "").toUpperCase();
          if (
            val.includes("CLOSED") ||
            val.includes("RECTIFIED") ||
            val.includes("RESOLVED") ||
            val.includes("APPROVED")
          ) {
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = "bold";
          } else {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });
  }

  // APPENDIX B: SITE INSTRUCTION REGISTER
  if (showSiteInstructions) {
    createNewSlide("Appendix: Site Instruction Register");

    const siList =
      report.siteInstructions || report.filteredSiteInstructions || [];
    const siRows = siList.map((si, idx) => {
      const subject = si.subject || si.title || "Directive";
      const stopWork = si.stopWorkOrdered ? " [STOP WORK]" : "";
      const recipient =
        si.recipientName ||
        (si as any).contractorName ||
        (si as any).recipient ||
        (si as any).assignedTo ||
        "Main Contractor";
      const issueDate =
        (si as any).issuedDate ||
        (si as any).date ||
        (si.createdAt
          ? new Date(si.createdAt).toISOString().split("T")[0]
          : "—");
      const dueDate =
        si.complianceDeadline ||
        (si as any).targetDate ||
        (si as any).dueDate ||
        "Immediate";
      const complianceStatus = si.status || "ACTIVE";

      return [
        si.instructionNumber || `SI-${String(idx + 1).padStart(3, "0")}`,
        subject + stopWork,
        recipient,
        issueDate,
        dueDate,
        complianceStatus,
      ];
    });

    autoTable(doc, {
      startY: 25,
      margin: { left: margin, right: margin },
      head: [
        [
          "SI NO.",
          "SUBJECT",
          "RECIPIENT",
          "ISSUE DATE",
          "DUE DATE",
          "COMPLIANCE STATUS",
        ],
      ],
      body:
        siRows.length > 0
          ? siRows
          : [
              [
                "—",
                "No formal Site Instructions issued for this surveillance period",
                "—",
                "—",
                "—",
                "—",
              ],
            ],
      theme: "striped",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
      },
      styles: {
        fontSize: 7,
        textColor: [51, 65, 85],
        cellPadding: 2.4,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: "bold" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 44 },
        3: { cellWidth: 24 },
        4: { cellWidth: 24 },
        5: { cellWidth: 32, halign: "center" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 5) {
          const val = String(data.cell.raw || "").toUpperCase();
          if (val.includes("CLOSED") || val.includes("COMPLIANT")) {
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = "bold";
          } else {
            data.cell.styles.textColor = [217, 119, 6];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });
  }

  // APPENDIX C: SITE COMMENTS / OBSERVATION LOG
  if (showSiteComments) {
    createNewSlide("Appendix: Site Comments / Observation Log");

    const commentRows = (report.siteComments || []).map((c, idx) => {
      const notes =
        c.comments ||
        (Array.isArray(c.commentItems)
          ? c.commentItems.join("; ")
          : "Routine quality surveillance");
      const photoTag =
        (c as any).photos && (c as any).photos.length > 0
          ? ` [${(c as any).photos.length} Photo(s) Logged]`
          : "";
      const locText = `${c.level || report.selectedLevel || "Level"} • ${c.location || "General"}`;
      const elemText = c.element || "Structural Component";
      const inspectorVendor = (c as any).vendorCheck
        ? `${c.inspector || "QA/QC"} / ${(c as any).vendorCheck}`
        : c.inspector || "QA/QC Officer";

      return [
        String(idx + 1).padStart(2, "0"),
        c.date || "—",
        locText,
        elemText,
        notes + photoTag,
        inspectorVendor,
        c.status || "Compliant",
      ];
    });

    autoTable(doc, {
      startY: 25,
      margin: { left: margin, right: margin },
      head: [
        [
          "S/N",
          "DATE",
          "LOCATION / LEVEL",
          "STRUCTURAL ELEMENT",
          "ROUTINE QUALITY OBSERVATIONS",
          "INSPECTOR / VENDOR CHECK",
          "STATUS",
        ],
      ],
      body:
        commentRows.length > 0
          ? commentRows
          : [
              [
                "—",
                "—",
                "—",
                "—",
                "No routine quality observations logged for this reporting period",
                "—",
                "—",
              ],
            ],
      theme: "striped",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
      },
      styles: {
        fontSize: 7,
        textColor: [51, 65, 85],
        cellPadding: 2.2,
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: 20 },
        2: { cellWidth: 35 },
        3: { cellWidth: 32 },
        4: { cellWidth: "auto" },
        5: { cellWidth: 35 },
        6: { cellWidth: 25, halign: "center" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 6) {
          const val = String(data.cell.raw || "").toUpperCase();
          if (
            !val.includes("NON") &&
            (val.includes("COMPLIANT") ||
              val.includes("PASSED") ||
              val.includes("CLOSED") ||
              val.includes("FIXED") ||
              val.includes("RECTIFIED") ||
              val.includes("APPROVED"))
          ) {
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = "bold";
          } else if (
            val.includes("NON") ||
            val.includes("ACTION") ||
            val.includes("OPEN") ||
            val.includes("FAILED") ||
            val.includes("REJECTED")
          ) {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = "bold";
          } else if (
            val.includes("PROGESS") ||
            val.includes("PROGRESS") ||
            val.includes("PENDING")
          ) {
            data.cell.styles.textColor = [217, 119, 6];
            data.cell.styles.fontStyle = "bold";
          } else {
            data.cell.styles.textColor = [100, 116, 139];
          }
        }
      },
    });
  }

  // ==========================================
  // SLIDES: PICTORIAL SURVEILLANCE VIEWPORTS (SEPARATE PAGES)
  // ==========================================
  if (report.pictorialUrls && report.pictorialUrls.length > 0) {
    const validAssets = report.pictorialUrls.filter((a) => a && a.url);

    for (let i = 0; i < validAssets.length; i++) {
      const asset = validAssets[i];
      createNewSlide(
        `Pictorial Surveillance Record (Specimen ${i + 1} of ${validAssets.length})`,
      );

      const frameW = contentWidth;
      const frameH = 148;
      const frameY = 24;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240).setLineWidth(0.3);
      doc.roundedRect(margin, frameY, frameW, frameH, 2.5, 2.5, "FD");

      if (asset.url) {
        try {
          const compPic = await compressImage(asset.url, 1600, 0.8);
          const maxImgW = frameW - 8;
          const maxImgH = frameH - 18;
          let imgW = maxImgW;
          let imgH = maxImgH;

          const imgProps = doc.getImageProperties(compPic);
          if (imgProps && imgProps.width && imgProps.height) {
            const aspect = imgProps.width / imgProps.height;
            if (maxImgW / maxImgH > aspect) {
              imgH = maxImgH;
              imgW = imgH * aspect;
            } else {
              imgW = maxImgW;
              imgH = imgW / aspect;
            }
          }

          const imgX = margin + 4 + (maxImgW - imgW) / 2;
          const imgY = frameY + 4 + (maxImgH - imgH) / 2;

          doc.addImage(compPic, "JPEG", imgX, imgY, imgW, imgH);
        } catch {
          renderNoDataNotice(margin + frameW / 2 - 40, frameY + frameH / 2, 80);
        }
      }

      // Caption bar at bottom of frame
      doc
        .setFillColor(15, 23, 42)
        .rect(margin, frameY + frameH - 12, frameW, 12, "F");
      doc
        .setFillColor(212, 163, 115)
        .rect(margin, frameY + frameH - 12, 4, 12, "F");
      doc
        .setFont("helvetica", "bold")
        .setFontSize(8)
        .setTextColor(255, 255, 255);
      const captionText =
        asset.caption && asset.caption.trim() !== ""
          ? asset.caption
          : `SPECIMEN ${i + 1}  |  AS-BUILT SITE QUALITY RECORD`;
      doc.text(captionText, margin + 8, frameY + frameH - 4.2, {
        maxWidth: frameW - 16,
      });
    }
  }

  // ==========================================
  // FINAL SLIDE: EXECUTIVE CLOSING
  // ==========================================
  renderClosingSlide(
    doc,
    report.projectName,
    report.preparedBy,
    report.logoBase64,
    report.companyName,
  );

  // Save the document using universal naming standard
  const fileName = report.reportNumber
    ? `${report.reportNumber}.pdf`
    : generateUniversalName(report.projectCode || report.projectName, "WQR", {
        extension: "pdf",
      });
  doc.save(fileName);
}
