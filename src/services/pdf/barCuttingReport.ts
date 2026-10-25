import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import { BarCuttingSchedule, Project, Company } from "@/types";
import { renderCompanyBrandCell } from "@/lib/companyHelper";
import { generateUniversalName } from "@/lib/naming";

export interface ExportOptions {
  fileName?: string;
  orientation?: "landscape" | "portrait";
  openPrintDialog?: boolean;
}

/**
 * Formats a number with thousands separators and fixed decimals.
 */
function formatNumber(num: number, decimals = 2): string {
  return (num || 0).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Calculates standard linear unit mass (kg/m) for a given rebar diameter.
 * Formula: D^2 * 0.006165 (BS 4449 / BS 8666 standard)
 */
function getLinearMassKgPerM(diameterMm: number): number {
  const d = diameterMm || 16;
  return Number((Math.pow(d, 2) * 0.006165).toFixed(3));
}

/**
 * Generates and directly downloads the company-standard Bar Cutting Schedule PDF
 * matching the spreadsheet template with blue cut tracks and red reusable offcuts (>=300mm).
 * Uses pure jsPDF + autoTable for rock-solid, zero-dependency direct vector PDF download.
 */
export function exportBarCuttingSchedulePDF(
  schedule: BarCuttingSchedule,
  project?: Partial<Project>,
  company?: Partial<Company>,
  options: ExportOptions = {},
): void {
  const companyName = company?.name || "JQMS Civil Infrastructure Ltd.";
  const compAddress = company?.address || "14 Bankside Boulevard, London SE1 9SG, United Kingdom";
  const compEmail = company?.email || "quality@collectiondev.com";
  const compPhone = company?.phone || "+44 (0) 20 7946 0912";
  const projectName = project?.name || "Civil Engineering Construction Project";
  const projectCode = project?.code || "PRJ-001";
  const docRef =
    schedule.scheduleNumber || generateUniversalName(projectCode, "BBS");
  const fileName = options.fileName || `${docRef}.pdf`;

  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const patterns = schedule.cuttingPatterns || [];
  const summary = schedule.summary;
  const stockLengthM = schedule.stockBarLengthM || 12.0;
  const stockLengthMm = Math.round(stockLengthM * 1000);

  // Total stock bars used
  const totalStockBars =
    summary?.totalStockBarsUsed ||
    patterns.reduce((sum, p) => sum + (p.stockBarQuantity || 0), 0);
  const totalStockLengthM = totalStockBars * stockLengthM;

  // Diameter & mass calculation
  const primaryDiameter =
    schedule.diameterMm ||
    (patterns.length > 0 && patterns[0].diameter ? patterns[0].diameter : 16);
  const unitMass = getLinearMassKgPerM(primaryDiameter);

  // Total tonnage (MT)
  let totalStockTonnageMT = "0.000";
  if (summary?.totalStockWeightKg && summary.totalStockWeightKg > 0) {
    totalStockTonnageMT = (summary.totalStockWeightKg / 1000).toFixed(3);
  } else if (summary?.totalCutWeightKg && summary.totalCutWeightKg > 0) {
    totalStockTonnageMT = (summary.totalCutWeightKg / 1000).toFixed(3);
  } else {
    totalStockTonnageMT = ((totalStockLengthM * unitMass) / 1000).toFixed(3);
  }

  // Scrap percentage
  const scrapPct =
    summary?.scrapPercentage !== undefined
      ? summary.scrapPercentage
      : patterns.length > 0
        ? patterns.reduce((sum, p) => sum + (p.wastePercentage || 0), 0) / patterns.length
        : 0;
  const scrapLimit = summary?.contractualScrapLimit || 3.5;

  // Initialize Landscape A4 Document (297mm x 210mm)
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2; // 277 mm

  // =========================================================================
  // 1. TOP HEADER BANNER
  // =========================================================================
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, margin, contentWidth, 18, "F");

  // Amber accent line
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(margin, margin + 17.2, contentWidth, 0.8, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("REBAR CUTTING SCHEDULE & STOCK BAR OPTIMIZATION", margin + 4, margin + 6.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(
    "BS 8666:2020 / BS 4449 Standard — 12.0m Commercial Stock Nesting (QA/QC Steel Fabrication Order)",
    margin + 4,
    margin + 11.5,
  );
  doc.text(
    `Project: ${projectName} (${projectCode})`,
    margin + 4,
    margin + 15.5,
  );

  // Right Side Company / Project Info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(companyName, pageWidth - margin - 4, margin + 5.5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    compAddress,
    pageWidth - margin - 4,
    margin + 10,
    { align: "right" },
  );
  doc.text(
    `${compEmail} | ${compPhone} | Doc Ref: ${docRef}`,
    pageWidth - margin - 4,
    margin + 14.5,
    { align: "right" },
  );

  // =========================================================================
  // 2. METADATA SUMMARY TABLE
  // =========================================================================
  autoTable(doc, {
    startY: 30.5,
    margin: { left: margin, right: margin },
    body: [
      [
        {
          content: "SCHEDULE REF:",
          styles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [71, 85, 105] },
        },
        {
          content: docRef,
          styles: { fontStyle: "bold", textColor: [2, 132, 199] },
        },
        {
          content: "TITLE / SCOPE:",
          styles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [71, 85, 105] },
        },
        { content: schedule.title || "Reinforcement Cutting Order" },
        {
          content: "DATE:",
          styles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [71, 85, 105] },
        },
        { content: currentDate },
      ],
      [
        {
          content: "SOURCE BBS:",
          styles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [71, 85, 105] },
        },
        { content: schedule.sourceBBSFileName || "BBS-Uploaded" },
        {
          content: "LOCATION / LEVEL:",
          styles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [71, 85, 105] },
        },
        { content: schedule.levelName || "General Reinforcement" },
        {
          content: "STEEL GRADE:",
          styles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [71, 85, 105] },
        },
        { content: schedule.steelGrade || "Grade 500B" },
      ],
      [
        {
          content: "HEAT / BATCH NO:",
          styles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [71, 85, 105] },
        },
        { content: schedule.heatNumber || "HT-MILL-VERIFIED" },
        {
          content: "SUPPLIER:",
          styles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [71, 85, 105] },
        },
        { content: schedule.supplier || "Approved Steel Mill" },
        {
          content: "QA STATUS:",
          styles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [71, 85, 105] },
        },
        {
          content: schedule.status || "OPTIMIZED",
          styles: {
            fontStyle: "bold",
            textColor:
              schedule.status === "QA_APPROVED"
                ? [22, 163, 74]
                : [202, 138, 4],
          },
        },
      ],
    ],
    theme: "grid",
    styles: {
      fontSize: 7,
      cellPadding: 1.4,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 66 },
      2: { cellWidth: 28 },
      3: { cellWidth: 70 },
      4: { cellWidth: 24 },
      5: { cellWidth: 63 },
    },
  });

  // =========================================================================
  // 3. MAIN CUTTING TABLE (MATCHING SPREADSHEET LAYOUT)
  // =========================================================================
  const cuttingRows: RowInput[] = [];

  patterns.forEach((pattern, pIdx) => {
    const sn = pIdx + 1;
    const stockLengthFormatted = formatNumber(stockLengthMm, 2);
    const qtyFormatted =
      pattern.stockBarQuantity % 1 === 0
        ? `${pattern.stockBarQuantity}.00`
        : pattern.stockBarQuantity.toFixed(2);

    const offcutMm = Math.round(pattern.offcutLengthM * 1000);
    const isRedOffcut = offcutMm >= 300;

    const cuts = pattern.cuts || [];
    const cutSegmentsFormatted =
      cuts.length > 0
        ? cuts
            .map(
              (c) =>
                `${Math.round(c.cutLengthM * 1000)} mm [MK:${c.barMark || "—"}${c.member ? ` · ${c.member}` : ""}]`,
            )
            .join("   +   ")
        : "Full Bar (12,000 mm)";

    // Sleek single-row per cutting pattern: maximizes patterns per page (fits 24-28 patterns per page)
    cuttingRows.push([
      {
        content: String(sn),
        styles: { halign: "center", valign: "middle", fontStyle: "bold", fontSize: 6.8, cellPadding: 0.6 },
      },
      {
        content: stockLengthFormatted,
        styles: { halign: "right", valign: "middle", fontStyle: "bold", fontSize: 6.8, cellPadding: 0.6 },
      },
      {
        content: qtyFormatted,
        styles: { halign: "center", valign: "middle", fontStyle: "bold", fontSize: 6.8, cellPadding: 0.6 },
      },
      {
        content: cutSegmentsFormatted,
        styles: {
          fillColor: [240, 249, 255],
          textColor: [3, 105, 161],
          fontStyle: "bold",
          fontSize: 6.8,
          cellPadding: 0.6,
        },
      },
      {
        content: String(offcutMm),
        styles: {
          halign: "center",
          valign: "middle",
          fontStyle: "bold",
          fontSize: 7,
          cellPadding: 0.6,
          fillColor: isRedOffcut ? [254, 226, 226] : [248, 250, 252],
          textColor: isRedOffcut ? [220, 38, 38] : [71, 85, 105],
        },
      },
    ]);
  });

  const nextTableStartY = (doc as any).lastAutoTable
    ? (doc as any).lastAutoTable.finalY + 3
    : 45;

  autoTable(doc, {
    startY: nextTableStartY,
    margin: { left: margin, right: margin },
    head: [
      [
        "S/N",
        "LENGTH",
        "NO",
        "CUTTING SCHEDULE (SEGMENT ALLOCATION)",
        "OFFCUT (mm)",
      ],
    ],
    body:
      cuttingRows.length > 0
        ? cuttingRows
        : [["—", "12,000.00", "0", "No cutting patterns available", "0"]],
    theme: "grid",
    headStyles: {
      fillColor: [226, 232, 240], // slate-200
      textColor: [15, 23, 42],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
      lineWidth: 0.2,
      lineColor: [148, 163, 184],
      cellPadding: 1,
    },
    styles: {
      fontSize: 6.8,
      cellPadding: 0.6,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 24, halign: "right" },
      2: { cellWidth: 16, halign: "center" },
      3: { cellWidth: 199, halign: "left" },
      4: { cellWidth: 26, halign: "center" },
    },
  });

  // =========================================================================
  // 3b. PER-DIAMETER SUMMARY TABLE
  // Each bar diameter is shown as a bold section header row grouping all
  // cutting patterns for that diameter, followed by an amber subtotal row.
  // =========================================================================
  {
    // Build an ordered map: diameter → list of patterns
    const diameterPatternMap = new Map<number, typeof patterns>();
    patterns.forEach((p) => {
      const d: number = p.diameter || schedule.diameterMm || 16;
      if (!diameterPatternMap.has(d)) diameterPatternMap.set(d, []);
      diameterPatternMap.get(d)!.push(p);
    });

    // Sort diameters ascending
    const sortedDiameters = Array.from(diameterPatternMap.keys()).sort((a, b) => a - b);

    if (sortedDiameters.length > 0) {
      const diameterRows: RowInput[] = [];

      sortedDiameters.forEach((dia) => {
        const dPatterns = diameterPatternMap.get(dia)!;
        const totalBarsForDia = dPatterns.reduce((sum, p) => sum + (p.stockBarQuantity || 0), 0);
        const totalLenM = totalBarsForDia * stockLengthM;
        const massKgPerM = getLinearMassKgPerM(dia);
        const totalWeightKg = totalLenM * massKgPerM;

        // Diameter header row (full-width dark label)
        diameterRows.push([
          {
            content: `T${dia}  —  Ø${dia} mm Rebar`,
            colSpan: 5,
            styles: {
              fillColor: [15, 23, 42],
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 7.5,
              halign: "left",
              cellPadding: { top: 2, bottom: 2, left: 4, right: 4 },
            },
          },
        ]);

        // One row per cutting pattern for this diameter
        dPatterns.forEach((p, idx) => {
          const offcutMm = Math.round(p.offcutLengthM * 1000);
          diameterRows.push([
            {
              content: String(idx + 1),
              styles: { halign: "center", fontSize: 6.5, cellPadding: 0.8 },
            },
            {
              content: `${stockLengthMm} mm`,
              styles: { halign: "right", fontSize: 6.5, cellPadding: 0.8 },
            },
            {
              content: String(p.stockBarQuantity),
              styles: { halign: "center", fontSize: 6.5, cellPadding: 0.8 },
            },
            {
              content: (p.cuts || [])
                .map(
                  (c) =>
                    `${Math.round(c.cutLengthM * 1000)} mm [MK:${c.barMark || "—"}${c.member ? ` · ${c.member}` : ""}]`,
                )
                .join("   +   ") || "Full Bar",
              styles: {
                fontSize: 6.5,
                cellPadding: 0.8,
                fillColor: [240, 249, 255],
                textColor: [3, 105, 161],
              },
            },
            {
              content: `${offcutMm} mm`,
              styles: {
                halign: "center",
                fontSize: 6.5,
                cellPadding: 0.8,
                fillColor: offcutMm >= 300 ? [254, 226, 226] : [248, 250, 252],
                textColor: offcutMm >= 300 ? [220, 38, 38] : [71, 85, 105],
              },
            },
          ]);
        });

        // Amber subtotal row for this diameter
        diameterRows.push([
          {
            content: `TOTAL — Ø${dia} mm`,
            colSpan: 2,
            styles: {
              fillColor: [245, 158, 11],
              textColor: [15, 23, 42],
              fontStyle: "bold",
              fontSize: 7,
              halign: "left",
              cellPadding: { top: 2, bottom: 2, left: 4, right: 4 },
            },
          },
          {
            content: String(totalBarsForDia),
            styles: {
              fillColor: [245, 158, 11],
              textColor: [15, 23, 42],
              fontStyle: "bold",
              fontSize: 7,
              halign: "center",
              cellPadding: { top: 2, bottom: 2, left: 4, right: 4 },
            },
          },
          {
            content: `Stock Bars = ${totalBarsForDia} × ${stockLengthM}m = ${formatNumber(totalLenM, 2)} m  |  Unit Mass = ${massKgPerM} kg/m  |  Weight = ${formatNumber(totalWeightKg, 2)} kg`,
            styles: {
              fillColor: [245, 158, 11],
              textColor: [15, 23, 42],
              fontStyle: "bold",
              fontSize: 6.8,
              halign: "left",
              cellPadding: { top: 2, bottom: 2, left: 4, right: 4 },
            },
          },
          {
            content: "",
            styles: { fillColor: [245, 158, 11] },
          },
        ]);
      });

      const diaTableStartY = (doc as any).lastAutoTable
        ? (doc as any).lastAutoTable.finalY + 4
        : 45;

      autoTable(doc, {
        startY: diaTableStartY,
        margin: { left: margin, right: margin },
        head: [["S/N", "STOCK LENGTH", "NO OF BARS", "CUTTING PATTERN", "OFFCUT"]],
        body: diameterRows,
        theme: "grid",
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7.5,
          halign: "center",
          lineWidth: 0.2,
          lineColor: [100, 116, 139],
          cellPadding: 1,
        },
        styles: {
          fontSize: 6.8,
          cellPadding: 0.6,
          lineColor: [203, 213, 225],
          lineWidth: 0.2,
        },
        columnStyles: {
          0: { cellWidth: 12, halign: "center" },
          1: { cellWidth: 30, halign: "right" },
          2: { cellWidth: 20, halign: "center" },
          3: { cellWidth: 189, halign: "left" },
          4: { cellWidth: 26, halign: "center" },
        },
      });
    }
  }

  // =========================================================================
  // 4. SUMMARY BOX & QA SIGN-OFF
  // =========================================================================
  let summaryY = (doc as any).lastAutoTable
    ? (doc as any).lastAutoTable.finalY + 4
    : 150;

  // If table ran close to bottom of page, start a fresh page
  if (summaryY > 162) {
    doc.addPage();
    summaryY = 15;
  }

  // Summary Table on Left
  const summaryLeftW = 95;
  autoTable(doc, {
    startY: summaryY,
    margin: { left: margin },
    tableWidth: summaryLeftW,
    body: [
      [
        {
          content: "TOTAL LENGTH (m)",
          styles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [71, 85, 105] },
        },
        {
          content: formatNumber(totalStockLengthM, 2),
          styles: { halign: "right", fontStyle: "bold" },
        },
      ],
      [
        {
          content: "12m STOCK BARS",
          styles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [71, 85, 105] },
        },
        {
          content: String(totalStockBars),
          styles: { halign: "right", fontStyle: "bold" },
        },
      ],
      [
        {
          content: "SCRAP WASTAGE %",
          styles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [71, 85, 105] },
        },
        {
          content: `${scrapPct.toFixed(2)}% (Target ≤ ${scrapLimit}%)`,
          styles: {
            halign: "right",
            fontStyle: "bold",
            textColor: scrapPct <= scrapLimit ? [22, 163, 74] : [220, 38, 38],
          },
        },
      ],
    ],
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 1.6, lineColor: [203, 213, 225], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 48 },
      1: { cellWidth: 47 },
    },
  });

  // MT Box next to summary table
  const mtBoxX = margin + summaryLeftW + 3;
  const mtBoxW = 32;
  const mtBoxH = 19.5;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);
  doc.rect(mtBoxX, summaryY, mtBoxW, mtBoxH, "FD");

  doc.setFillColor(241, 245, 249);
  doc.rect(mtBoxX, summaryY, mtBoxW, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("MT", mtBoxX + mtBoxW / 2, summaryY + 3.8, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(totalStockTonnageMT, mtBoxX + mtBoxW / 2, summaryY + 14, { align: "center" });

  // Red Note Box on Right
  const noteBoxX = mtBoxX + mtBoxW + 4;
  const noteBoxW = contentWidth - (noteBoxX - margin);
  const noteBoxH = mtBoxH;

  doc.setFillColor(255, 245, 245); // light red background
  doc.setDrawColor(239, 68, 68);    // red border
  doc.setLineWidth(0.4);
  doc.rect(noteBoxX, summaryY, noteBoxW, noteBoxH, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(185, 28, 28); // red-700
  doc.text("NOTE ON REUSABLE OFFCUTS (≥ 300mm):", noteBoxX + 3, summaryY + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(153, 27, 27); // red-800
  const noteText =
    "The offcuts in Red are significantly required for storage and further usage (from 300mm length and above). Site steelfixers and storekeepers must tag and store them in designated offcut racks for stirrups, chairs, and sub-elements.";
  const splitNote = doc.splitTextToSize(noteText, noteBoxW - 6);
  doc.text(splitNote, noteBoxX + 3, summaryY + 9);

  // Signatures Table
  const signY = summaryY + mtBoxH + 3.5;
  autoTable(doc, {
    startY: signY,
    margin: { left: margin, right: margin },
    body: [
      [
        {
          content: `PREPARED BY (BBS DRAUGHTSMAN / FOREMAN):\n\nName:  ${schedule.createdBy || "Steelfixer In-charge"}\n\nSignature: __________________________    Date: ${currentDate}`,
          styles: { cellPadding: 2.5, textColor: [51, 65, 85] },
        },
        {
          content: `CHECKED BY (SITE QA/QC ENGINEER):\n\nName:  ${schedule.qaVerification?.inspectedBy || "Site QA/QC Engineer"}\n\nSignature: __________________________    Date: ${currentDate}`,
          styles: { cellPadding: 2.5, textColor: [51, 65, 85] },
        },
        {
          content: `APPROVED BY (CONSULTANT / RESIDENT ENGINEER):\n\nName:  Resident Engineer / Lead QA\n\nSignature: __________________________    Date: ____ / ____ / 20__`,
          styles: { cellPadding: 2.5, textColor: [51, 65, 85] },
        },
      ],
    ],
    theme: "grid",
    styles: { fontSize: 6.5, lineColor: [203, 213, 225], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: contentWidth / 3 },
      1: { cellWidth: contentWidth / 3 },
      2: { cellWidth: contentWidth / 3 },
    },
  });

  // =========================================================================
  // 5. STAMP PAGE NUMBERS & CONFIDENTIAL FOOTER
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `CONFIDENTIAL & STATUTORY QUALITY RECORD — ${companyName} — Doc Ref: ${docRef}`,
      margin,
      pageHeight - 5,
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, {
      align: "right",
    });
  }

  // =========================================================================
  // 6. TRIGGER DIRECT DOWNLOAD
  // =========================================================================
  doc.save(fileName);
}

/**
 * Generates clean CSV spreadsheet export of cutting patterns and offcuts.
 * Uses native Blob + object URL for guaranteed download without data URI truncation.
 */
export function exportBarCuttingScheduleCSV(
  schedule: BarCuttingSchedule,
  fileName?: string,
): void {
  const docRef =
    schedule.scheduleNumber ||
    generateUniversalName((schedule as any)?.projectCode, "BBS");
  const outName = fileName || `${docRef}.csv`;

  const headers = [
    "S/N",
    "Stock Length (mm)",
    "No of Stock Bars",
    "Cutting Pattern Segments (Length mm, Bar Mark, Member)",
    "Offcut (mm)",
    "Offcut Status",
    "Diameter (mm)",
    "Wastage %",
  ];

  const rows = (schedule.cuttingPatterns || []).map((pattern, idx) => {
    const sn = idx + 1;
    const stockLengthMm = Math.round((pattern.stockLengthM || schedule.stockBarLengthM || 12.0) * 1000);
    const cuts = pattern.cuts || [];
    const segmentsStr = cuts
      .map(
        (c) =>
          `[${Math.round(c.cutLengthM * 1000)}mm | Mark: ${c.barMark || "—"} | Member: ${c.member || schedule.levelName || "SLAB"}]`,
      )
      .join(" + ");
    const offcutMm = Math.round(pattern.offcutLengthM * 1000);
    const offcutStatus =
      offcutMm >= 300
        ? "REUSABLE (STORE IN OFFCUT RACK)"
        : "SCRAP (RECYCLE)";

    return [
      String(sn),
      String(stockLengthMm),
      String(pattern.stockBarQuantity),
      `"${segmentsStr}"`,
      String(offcutMm),
      `"${offcutStatus}"`,
      String(pattern.diameter || schedule.diameterMm || 16),
      `${(pattern.wastePercentage || 0).toFixed(2)}%`,
    ];
  });

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", outName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates formatted HTML string of the cutting schedule matching the spreadsheet format.
 */
export function generateCuttingScheduleHTML(
  schedule: BarCuttingSchedule,
  project?: Partial<Project>,
  company?: Partial<Company>,
): string {
  const companyName = company?.name || "JQMS Civil Infrastructure Ltd.";
  const projectName = project?.name || "Civil Engineering Construction Project";
  const projectCode = project?.code || "PRJ-001";
  const docRef =
    schedule.scheduleNumber || `BCS-${(schedule.id || "00000000").slice(0, 8).toUpperCase()}`;
  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const patterns = schedule.cuttingPatterns || [];
  const summary = schedule.summary;
  const stockLengthM = schedule.stockBarLengthM || 12.0;
  const stockLengthMm = Math.round(stockLengthM * 1000);

  const totalStockBars =
    summary?.totalStockBarsUsed ||
    patterns.reduce((sum, p) => sum + (p.stockBarQuantity || 0), 0);
  const totalStockLengthM = totalStockBars * stockLengthM;

  const primaryDiameter =
    schedule.diameterMm ||
    (patterns.length > 0 && patterns[0].diameter ? patterns[0].diameter : 16);
  const unitMass = getLinearMassKgPerM(primaryDiameter);

  let totalStockTonnageMT = "0.000";
  if (summary?.totalStockWeightKg && summary.totalStockWeightKg > 0) {
    totalStockTonnageMT = (summary.totalStockWeightKg / 1000).toFixed(3);
  } else if (summary?.totalCutWeightKg && summary.totalCutWeightKg > 0) {
    totalStockTonnageMT = (summary.totalCutWeightKg / 1000).toFixed(3);
  } else {
    totalStockTonnageMT = ((totalStockLengthM * unitMass) / 1000).toFixed(3);
  }

  const scrapPct =
    summary?.scrapPercentage !== undefined
      ? summary.scrapPercentage
      : patterns.length > 0
        ? patterns.reduce((sum, p) => sum + (p.wastePercentage || 0), 0) / patterns.length
        : 0;
  const scrapLimit = summary?.contractualScrapLimit || 3.5;

  const rowsHTML = patterns
    .map((pattern, pIdx) => {
      const sn = pIdx + 1;
      const stockLengthFormatted = formatNumber(stockLengthMm, 2);
      const qtyFormatted =
        pattern.stockBarQuantity % 1 === 0
          ? `${pattern.stockBarQuantity}.00`
          : pattern.stockBarQuantity.toFixed(2);

      const offcutMm = Math.round(pattern.offcutLengthM * 1000);
      const isRedOffcut = offcutMm >= 300;
      const cuts = pattern.cuts || [];

      const cutSegmentsHTML = cuts
        .map((cut) => {
          const cutMm = Math.round(cut.cutLengthM * 1000);
          return `
            <td style="background: #f0f9ff; border: 1px solid #38bdf8; border-radius: 2px; padding: 1px 3px; text-align: center; min-width: 34px;">
              <div style="font-weight: 800; font-size: 8.5px; color: #0369a1; line-height: 1;">${cutMm}</div>
              <div style="font-size: 6.5px; font-weight: 700; color: #475569; line-height: 1; margin-top: 1px;">${cut.barMark || "—"}</div>
            </td>
          `;
        })
        .join("");

      const offcutStyle = isRedOffcut
        ? "background: #fee2e2; color: #dc2626; font-weight: 800; font-size: 8.5px; border: 1px solid #f87171;"
        : "background: #f8fafc; color: #334155; font-weight: 700; font-size: 8.5px; border: 1px solid #cbd5e1;";

      return `
        <tr style="border-bottom: 1px solid #cbd5e1; page-break-inside: avoid;">
          <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: 800; font-size: 8.5px; padding: 1.5px 3px; background: #ffffff;">
            ${sn}
          </td>
          <td style="border: 1px solid #cbd5e1; text-align: right; padding: 1.5px 5px; font-weight: 700; font-size: 8.5px; font-family: monospace; background: #ffffff;">
            ${stockLengthFormatted}
          </td>
          <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: 800; font-size: 8.5px; padding: 1.5px 3px; background: #ffffff;">
            ${qtyFormatted}
          </td>
          <td style="padding: 1px 2px; border: 1px solid #cbd5e1; background: #ffffff;">
            <table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
              <tr>${cutSegmentsHTML}</tr>
            </table>
          </td>
          <td style="text-align: center; vertical-align: middle; padding: 1.5px 3px; ${offcutStyle}">
            ${offcutMm}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${docRef} - Cutting Schedule</title>
      <style>
        *, *::before, *::after {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        @page {
          size: A4 landscape;
          margin: 0;
        }
        @media print {
          html, body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 6mm 8mm 6mm 8mm !important;
            background: #ffffff !important;
          }
          .no-print { display: none !important; }
        }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 6mm 8mm 6mm 8mm;
          font-size: 9.5px;
        }
        .doc-header {
          width: 100%;
          border: 1.5px solid #0f172a;
          border-collapse: collapse;
          margin-bottom: 8px;
          background: #ffffff;
        }
        .doc-header td {
          border: 1px solid #cbd5e1;
          padding: 6px;
          vertical-align: middle;
        }
        .header-brand {
          width: 22%;
          background: #ffffff;
          text-align: center;
        }
        .header-title {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #0f172a;
          text-align: center;
        }
        .header-sub {
          font-size: 9.5px;
          font-weight: 700;
          color: #ea580c;
          margin-top: 2px;
          text-transform: uppercase;
          text-align: center;
        }
        .header-iso {
          font-size: 7.5px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          text-align: center;
          margin-top: 1px;
        }
        .meta-box {
          width: 25%;
          font-size: 8px;
          line-height: 1.5;
          color: #334155;
        }
        .meta-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 6px;
          border: 1px solid #cbd5e1;
          font-size: 8.5px;
        }
        .meta-table td {
          border: 1px solid #cbd5e1;
          padding: 2.5px 6px;
        }
        .meta-label {
          background: #f1f5f9;
          font-weight: 700;
          color: #475569;
          width: 12%;
        }
        .meta-val {
          font-weight: 700;
          color: #0f172a;
          width: 21%;
        }
        .cutting-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #0f172a;
          margin-bottom: 8px;
        }
        .cutting-table tr {
          page-break-inside: avoid;
        }
        .cutting-table th {
          border: 1px solid #0f172a;
          padding: 4px 6px;
          background: #e2e8f0;
          font-size: 8.5px;
          font-weight: 900;
          text-align: center;
          color: #0f172a;
          letter-spacing: 0.5px;
        }
        .summary-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-top: 8px;
        }
        .summary-left {
          display: flex;
          align-items: stretch;
          gap: 8px;
        }
        .stats-table {
          border-collapse: collapse;
          border: 1.5px solid #0f172a;
          font-size: 9px;
          font-weight: 800;
        }
        .stats-table td {
          border: 1px solid #cbd5e1;
          padding: 4px 10px;
        }
        .mt-box {
          border: 2px solid #0f172a;
          background: #ffffff;
          padding: 4px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 90px;
        }
        .mt-header {
          font-size: 10px;
          font-weight: 900;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 2px;
          color: #475569;
        }
        .mt-val {
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
          margin-top: 2px;
          font-family: monospace;
        }
        .note-box {
          border: 1.5px solid #dc2626;
          background: #fff5f5;
          padding: 8px 14px;
          font-size: 9px;
          font-weight: 700;
          color: #991b1b;
          border-radius: 4px;
          max-width: 480px;
          line-height: 1.4;
        }
        .signoff-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          border: 1px solid #cbd5e1;
          font-size: 8px;
        }
        .signoff-table td {
          border: 1px solid #cbd5e1;
          padding: 6px 10px;
          width: 33.33%;
          vertical-align: top;
        }
        .print-btn-bar {
          margin-bottom: 10px;
          padding: 8px 12px;
          background: #1e293b;
          color: white;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .print-btn {
          background: #f59e0b;
          color: #0f172a;
          border: none;
          padding: 6px 16px;
          font-weight: 800;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="print-btn-bar no-print">
        <span style="font-weight: 700;">Cutting Schedule Print & PDF Preview — ${docRef}</span>
        <button onclick="window.print()" class="print-btn">Print / Save as PDF</button>
      </div>

      <!-- Header Banner with Dynamic Company Branding -->
      <table class="doc-header">
        <tr>
          <td class="header-brand">
            ${renderCompanyBrandCell(company, project)}
          </td>
          <td style="width: 53%;">
            <div class="header-title">REBAR CUTTING SCHEDULE & STOCK BAR OPTIMIZATION</div>
            <div class="header-sub">PROJECT: ${projectName} (${projectCode})</div>
            <div class="header-iso">BS 8666:2020 / BS 4449 Standard &bull; 12.0m Commercial Stock Nesting</div>
          </td>
          <td class="meta-box">
            <strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:700;">${docRef}</span><br/>
            <strong>Date:</strong> ${currentDate}<br/>
            <strong>Steel Grade:</strong> ${schedule.steelGrade || "Grade 500B"}<br/>
            <strong>Status:</strong> <span style="font-weight: 800; color: ${schedule.status === "QA_APPROVED" ? "#16a34a" : "#ca8a04"};">${schedule.status || "OPTIMIZED"}</span>
          </td>
        </tr>
      </table>

      <!-- Metadata Box -->
      <table class="meta-table">
        <tr>
          <td class="meta-label">SCHEDULE REF:</td>
          <td class="meta-val" style="font-family: monospace; font-size: 10px; color: #0284c7;">${docRef}</td>
          <td class="meta-label">TITLE / SCOPE:</td>
          <td class="meta-val">${schedule.title || "Reinforcement Cutting Order"}</td>
          <td class="meta-label">DATE:</td>
          <td class="meta-val">${currentDate}</td>
        </tr>
        <tr>
          <td class="meta-label">SOURCE BBS:</td>
          <td class="meta-val">${schedule.sourceBBSFileName || "BBS-Uploaded"}</td>
          <td class="meta-label">LOCATION / LEVEL:</td>
          <td class="meta-val">${schedule.levelName || "General Reinforcement"}</td>
          <td class="meta-label">STEEL GRADE:</td>
          <td class="meta-val">${schedule.steelGrade || "Grade 500B"}</td>
        </tr>
        <tr>
          <td class="meta-label">HEAT / BATCH NO:</td>
          <td class="meta-val">${schedule.heatNumber || "HT-MILL-VERIFIED"}</td>
          <td class="meta-label">SUPPLIER:</td>
          <td class="meta-val">${schedule.supplier || "Approved Steel Mill"}</td>
          <td class="meta-label">QA STATUS:</td>
          <td class="meta-val" style="color: ${schedule.status === "QA_APPROVED" ? "#16a34a" : "#ca8a04"};">
            ${schedule.status || "OPTIMIZED"}
          </td>
        </tr>
      </table>

      <!-- Main Cutting Table -->
      <table class="cutting-table">
        <thead>
          <tr>
            <th style="width: 36px;">S/N</th>
            <th style="width: 90px;">LENGTH</th>
            <th style="width: 50px;">NO</th>
            <th>CUTTING SCHEDULE (TRACK & SEGMENT ALLOCATION)</th>
            <th style="width: 75px;">OFFCUT</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>

      <!-- Per-Diameter Summary Table -->
      ${(() => {
        // Build ordered map: diameter → patterns
        const dMap = new Map<number, typeof patterns>();
        patterns.forEach((p) => {
          const d: number = p.diameter || schedule.diameterMm || 16;
          if (!dMap.has(d)) dMap.set(d, []);
          dMap.get(d)!.push(p);
        });
        const sortedDias = Array.from(dMap.keys()).sort((a, b) => a - b);
        if (sortedDias.length === 0) return "";

        const rows = sortedDias
          .map((dia) => {
            const dp = dMap.get(dia)!;
            const totalBars = dp.reduce((s, p) => s + (p.stockBarQuantity || 0), 0);
            const totalLen = totalBars * stockLengthM;
            const massKgPerM = getLinearMassKgPerM(dia);
            const totalWt = totalLen * massKgPerM;

            const headerRow = `<tr>
              <td colspan="5" style="background:#0f172a;color:#fff;font-weight:900;font-size:9px;padding:3px 8px;letter-spacing:0.5px;">
                T${dia}&nbsp;&nbsp;—&nbsp;&nbsp;Ø${dia} mm Rebar
              </td>
            </tr>`;

            const patternRows = dp
              .map((p, idx) => {
                const offcutMm = Math.round(p.offcutLengthM * 1000);
                const isRed = offcutMm >= 300;
                const segs = (p.cuts || [])
                  .map(
                    (c) =>
                      `${Math.round(c.cutLengthM * 1000)} mm [MK:${c.barMark || "—"}${c.member ? ` · ${c.member}` : ""}]`,
                  )
                  .join(" + ") || "Full Bar";
                return `<tr>
                  <td style="border:1px solid #cbd5e1;text-align:center;font-size:8px;padding:2px 4px;">${idx + 1}</td>
                  <td style="border:1px solid #cbd5e1;text-align:right;font-size:8px;padding:2px 4px;">${stockLengthMm} mm</td>
                  <td style="border:1px solid #cbd5e1;text-align:center;font-weight:800;font-size:8px;padding:2px 4px;">${p.stockBarQuantity}</td>
                  <td style="border:1px solid #cbd5e1;background:#f0f9ff;color:#0369a1;font-size:7.5px;padding:2px 6px;">${segs}</td>
                  <td style="border:1px solid #cbd5e1;text-align:center;font-size:8px;padding:2px 4px;${isRed ? "background:#fee2e2;color:#dc2626;" : "background:#f8fafc;color:#334155;"}">${offcutMm} mm</td>
                </tr>`;
              })
              .join("");

            const subtotalRow = `<tr>
              <td colspan="2" style="background:#f59e0b;color:#0f172a;font-weight:900;font-size:8.5px;padding:3px 8px;">TOTAL — Ø${dia} mm</td>
              <td style="background:#f59e0b;color:#0f172a;font-weight:900;font-size:8.5px;text-align:center;padding:3px 4px;">${totalBars}</td>
              <td style="background:#f59e0b;color:#0f172a;font-weight:800;font-size:7.8px;padding:3px 6px;">
                Stock Bars = ${totalBars} × ${stockLengthM}m = ${formatNumber(totalLen, 2)} m &nbsp;|&nbsp; Unit Mass = ${massKgPerM} kg/m &nbsp;|&nbsp; Weight = ${formatNumber(totalWt, 2)} kg
              </td>
              <td style="background:#f59e0b;"></td>
            </tr>`;

            return headerRow + patternRows + subtotalRow;
          })
          .join("");

        return `
          <table style="width:100%;border-collapse:collapse;border:1.5px solid #0f172a;margin-bottom:10px;">
            <thead>
              <tr style="background:#1e293b;">
                <th style="border:1px solid #475569;color:#fff;font-size:8.5px;padding:3px 6px;text-align:center;">S/N</th>
                <th style="border:1px solid #475569;color:#fff;font-size:8.5px;padding:3px 6px;text-align:center;">STOCK LENGTH</th>
                <th style="border:1px solid #475569;color:#fff;font-size:8.5px;padding:3px 6px;text-align:center;">NO OF BARS</th>
                <th style="border:1px solid #475569;color:#fff;font-size:8.5px;padding:3px 6px;text-align:center;">CUTTING PATTERN</th>
                <th style="border:1px solid #475569;color:#fff;font-size:8.5px;padding:3px 6px;text-align:center;">OFFCUT</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>`;
      })()}

      <!-- Bottom Summary Box Matching Spreadsheet Layout -->
      <div class="summary-wrapper">
        <div class="summary-left">
          <table class="stats-table">
            <tr>
              <td style="background: #f1f5f9; color: #475569;">TOTAL LENGTH (m)</td>
              <td style="text-align: right; font-family: monospace; font-size: 9.5px;">
                ${formatNumber(totalStockLengthM, 2)}
              </td>
            </tr>
            <tr>
              <td style="background: #f1f5f9; color: #475569;">12m STOCK BARS</td>
              <td style="text-align: right; font-family: monospace; font-size: 9.5px;">
                ${totalStockBars}
              </td>
            </tr>
            <tr>
              <td style="background: #f1f5f9; color: #475569;">SCRAP WASTAGE %</td>
              <td style="text-align: right; font-family: monospace; color: ${scrapPct <= scrapLimit ? "#16a34a" : "#dc2626"};">
                ${scrapPct.toFixed(2)}% (≤ ${scrapLimit}%)
              </td>
            </tr>
          </table>

          <div class="mt-box">
            <div class="mt-header">MT</div>
            <div class="mt-val">${totalStockTonnageMT}</div>
          </div>
        </div>

        <!-- Note on Reusable Red Offcuts -->
        <div class="note-box">
          <strong style="color: #dc2626; font-size: 9.5px;">NOTE:</strong>
          The offcuts in <strong>Red</strong> are significantly required for storage and further usage (from 300mm length and above). Steelfixers and storekeepers must tag and store them in designated offcut racks.
        </div>
      </div>

      <!-- QA Sign-Off Block -->
      <table class="signoff-table">
        <tr>
          <td>
            <div style="font-weight: 800; color: #475569; margin-bottom: 3px;">PREPARED BY (BBS DRAUGHTSMAN / FOREMAN):</div>
            <div>Name: <strong>${schedule.createdBy || "Steelfixer In-charge"}</strong></div>
            <div style="margin-top: 12px; border-bottom: 1px dotted #94a3b8; width: 80%;">Signature: </div>
            <div style="margin-top: 3px;">Date: ${currentDate}</div>
          </td>
          <td>
            <div style="font-weight: 800; color: #475569; margin-bottom: 3px;">CHECKED BY (SITE QA/QC ENGINEER):</div>
            <div>Name: <strong>${schedule.qaVerification?.inspectedBy || "Site QA/QC Engineer"}</strong></div>
            <div style="margin-top: 12px; border-bottom: 1px dotted #94a3b8; width: 80%;">Signature: </div>
            <div style="margin-top: 3px;">Date: ${currentDate}</div>
          </td>
          <td>
            <div style="font-weight: 800; color: #475569; margin-bottom: 3px;">APPROVED BY (CONSULTANT / RE):</div>
            <div>Name: <strong>Resident Engineer / Lead QA</strong></div>
            <div style="margin-top: 12px; border-bottom: 1px dotted #94a3b8; width: 80%;">Signature: </div>
            <div style="margin-top: 3px;">Date: ____ / ____ / 20__</div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Opens interactive print/preview window for browser print & Save as PDF.
 * Uses a popup window or fallback hidden iframe to guarantee print dialog triggers.
 */
export function printBarCuttingSchedule(
  schedule: BarCuttingSchedule,
  project?: Partial<Project>,
  company?: Partial<Company>,
): void {
  const html = generateCuttingScheduleHTML(schedule, project, company);

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  } else {
    // Fallback using hidden iframe if popups are blocked
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  }
}
