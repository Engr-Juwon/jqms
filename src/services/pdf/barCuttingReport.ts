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
  doc.text("REINFORCEMENT SCHEDULE (SITE)", margin + 4, margin + 6.5);

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
        { content: "LOCATION/SITE", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
        { content: schedule.levelName || "SITE" },
        { content: "NO", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
        { content: docRef, styles: { fontStyle: "bold", textColor: [2, 132, 199] } },
        { content: "BTR. ELEMENT", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
        { content: schedule.title || "Reinforcement Cutting Order" },
      ],
      [
        { content: "PERIMETER/B.EAM", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
        { content: schedule.levelName || "GENERAL" },
        { content: "REINF. TYPE", styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
        { content: schedule.steelGrade || "GRADE 500B" },
        { content: `Y${primaryDiameter}`, styles: { fontStyle: "bold", fillColor: [241, 245, 249] } },
        { content: "LEVEL" },
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
  const maxCutSlots = 10;

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
    const row: RowInput = [
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
    ];

    for (let slot = 0; slot < maxCutSlots; slot++) {
      const cut = cuts[slot];
      row.push({
        content: cut
          ? `${Math.round(cut.cutLengthM * 1000)}\n${cut.barMark || "-"}\n${cut.member || schedule.levelName || "ELEMENT"}`
          : "",
        styles: {
          fillColor: [240, 249, 255],
          textColor: [3, 105, 161],
          fontStyle: "bold",
          fontSize: 5.8,
          halign: "center",
          valign: "middle",
          cellPadding: 0.25,
        },
      });
    }

    row.push({
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
    });
    cuttingRows.push(row);
  });

  const nextTableStartY = (doc as any).lastAutoTable
    ? (doc as any).lastAutoTable.finalY + 3
    : 45;

  autoTable(doc, {
    startY: nextTableStartY,
    margin: { left: margin, right: margin },
    head: [[
      "S/N",
      "LENGTH",
      "NO",
      ...Array.from({ length: maxCutSlots }, (_, i) => String(i + 1)),
      "OFFCUT",
    ]],
    body:
      cuttingRows.length > 0
        ? cuttingRows
        : [["—", "12,000.00", "0", ...Array(maxCutSlots).fill(""), "0"]],
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
      ...Object.fromEntries(Array.from({ length: maxCutSlots }, (_, i) => [i + 3, { cellWidth: 13.5, halign: "center" }])),
      13: { cellWidth: 22, halign: "center" },
    },
  });

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

export async function exportBarCuttingScheduleExcel(
  schedule: BarCuttingSchedule,
  project?: Partial<Project>,
  company?: Partial<Company>,
): Promise<void> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = company?.name || "JQMS";
  workbook.subject = `Cutting schedule ${schedule.scheduleNumber}`;
  workbook.title = schedule.title || "Reinforcement Schedule";

  const patternsByDiameter = new Map<number, typeof schedule.cuttingPatterns>();
  (schedule.cuttingPatterns || []).forEach((pattern) => {
    const diameter = pattern.diameter || schedule.diameterMm || 16;
    const group = patternsByDiameter.get(diameter) || [];
    group.push(pattern);
    patternsByDiameter.set(diameter, group);
  });
  (schedule.bbsItems || []).forEach((item) => {
    if (!patternsByDiameter.has(item.diameter)) {
      patternsByDiameter.set(item.diameter, []);
    }
  });
  if (patternsByDiameter.size === 0) {
    patternsByDiameter.set(schedule.diameterMm || 16, []);
  }

  const border = {
    top: { style: "thin" as const, color: { argb: "FF202020" } },
    left: { style: "thin" as const, color: { argb: "FF202020" } },
    bottom: { style: "thin" as const, color: { argb: "FF202020" } },
    right: { style: "thin" as const, color: { argb: "FF202020" } },
  };
  const projectLabel = project?.code || project?.name || "SITE";
  const level = schedule.levelName || "GENERAL";
  const stockLengthM = schedule.stockBarLengthM || 12;
  const diameters = Array.from(patternsByDiameter.keys()).sort((a, b) => a - b);
  const summarySheet = workbook.addWorksheet("REINFORCEMENT SUMMARY");
  const summaryTotalColumn = diameters.length + 5;
  summarySheet.columns = [
    { width: 7 },
    { width: 30 },
    { width: 13 },
    { width: 10 },
    ...diameters.map(() => ({ width: 13 })),
    { width: 14 },
  ];
  summarySheet.pageSetup = {
    orientation: "landscape",
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.2, right: 0.2, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 },
  };
  summarySheet.mergeCells(1, 1, 2, 2);
  summarySheet.mergeCells(1, 3, 1, summaryTotalColumn);
  summarySheet.getCell(1, 1).value = "REINFORCEMENT SUMMARY";
  summarySheet.getCell(1, 3).value = company?.name || "JQMS";
  summarySheet.getCell(2, 3).value = "LOCATION:";
  summarySheet.getCell(2, 4).value = projectLabel;
  summarySheet.getCell(2, 5).value = "LEVEL:";
  summarySheet.getCell(2, 6).value = level;
  summarySheet.getCell(1, 1).font = { name: "Arial", size: 12, bold: true };
  summarySheet.getCell(1, 3).font = { name: "Arial", size: 12, bold: true };
  summarySheet.getCell(1, 1).alignment = { horizontal: "center", vertical: "middle" };
  summarySheet.getCell(1, 3).alignment = { horizontal: "center", vertical: "middle" };
  summarySheet.getRow(1).height = 21;
  summarySheet.getRow(2).height = 18;
  summarySheet.mergeCells(3, 1, 4, 1);
  summarySheet.mergeCells(3, 2, 4, 2);
  summarySheet.mergeCells(3, 3, 4, 3);
  summarySheet.mergeCells(3, 4, 4, 4);
  if (diameters.length > 1) {
    summarySheet.mergeCells(3, 5, 3, 4 + diameters.length);
  }
  summarySheet.mergeCells(3, summaryTotalColumn, 4, summaryTotalColumn);
  summarySheet.getCell(3, 1).value = "S/N";
  summarySheet.getCell(3, 2).value = "STRUCTURAL DETAILS";
  summarySheet.getCell(3, 3).value = "UNIT (MT)";
  summarySheet.getCell(3, 4).value = "NO";
  if (diameters.length > 1) {
    summarySheet.getCell(3, 5).value = "DIA-WISE QUANTITIES OF REBAR";
  }
  summarySheet.getCell(3, summaryTotalColumn).value = "TOTAL (MT)";
  diameters.forEach((diameter, index) => {
    summarySheet.getCell(4, 5 + index).value = `Y${diameter} (MT)`;
  });
  for (let row = 3; row <= 4; row++) {
    for (let column = 1; column <= summaryTotalColumn; column++) {
      const cell = summarySheet.getCell(row, column);
      cell.font = { name: "Arial", size: 8, bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E2F3" } };
      cell.border = border;
    }
  }
  summarySheet.getRow(3).height = 24;
  summarySheet.getRow(4).height = 20;

  const memberTotals = new Map<string, { diameterKg: Map<number, number> }>();
  (schedule.bbsItems || []).forEach((item) => {
    const member = item.member || "UNSPECIFIED";
    const aggregate = memberTotals.get(member) || {
      diameterKg: new Map<number, number>(),
    };
    const weightKg =
      item.totalWeightKg ||
      item.totalLengthM * getLinearMassKgPerM(item.diameter);
    aggregate.diameterKg.set(
      item.diameter,
      (aggregate.diameterKg.get(item.diameter) || 0) + weightKg,
    );
    memberTotals.set(member, aggregate);
  });
  const summaryRows = Array.from(memberTotals.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const summaryTotals = new Map(diameters.map((diameter) => [diameter, 0]));
  summaryRows.forEach(([member, aggregate], index) => {
    const row = 5 + index;
    let totalKg = 0;
    summarySheet.getCell(row, 1).value = index + 1;
    summarySheet.getCell(row, 2).value = member;
    summarySheet.getCell(row, 3).value = Number(
      (
        Array.from(aggregate.diameterKg.values()).reduce((sum, value) => sum + value, 0) /
        1000
      ).toFixed(3),
    );
    summarySheet.getCell(row, 4).value = 1;
    diameters.forEach((diameter, diameterIndex) => {
      const weightKg = aggregate.diameterKg.get(diameter) || 0;
      totalKg += weightKg;
      summaryTotals.set(diameter, (summaryTotals.get(diameter) || 0) + weightKg);
      summarySheet.getCell(row, 5 + diameterIndex).value = Number(
        (weightKg / 1000).toFixed(3),
      );
    });
    summarySheet.getCell(row, summaryTotalColumn).value = Number(
      (totalKg / 1000).toFixed(3),
    );
    for (let column = 1; column <= summaryTotalColumn; column++) {
      const cell = summarySheet.getCell(row, column);
      cell.font = { name: "Arial", size: 9 };
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = border;
      if (column !== 2) cell.alignment = { horizontal: "center", vertical: "middle" };
    }
    summarySheet.getRow(row).height = 18;
  });
  const summaryFooterRow = 5 + summaryRows.length;
  summarySheet.getCell(summaryFooterRow, 2).value = "TOTAL";
  summarySheet.getCell(summaryFooterRow, 3).value = Number(
    Array.from(summaryTotals.values()).reduce((sum, value) => sum + value, 0) / 1000,
  );
  diameters.forEach((diameter, index) => {
    summarySheet.getCell(summaryFooterRow, 5 + index).value = Number(
      ((summaryTotals.get(diameter) || 0) / 1000).toFixed(3),
    );
  });
  summarySheet.getCell(summaryFooterRow, summaryTotalColumn).value = Number(
    Array.from(summaryTotals.values()).reduce((sum, value) => sum + value, 0) / 1000,
  );
  for (let column = 1; column <= summaryTotalColumn; column++) {
    const cell = summarySheet.getCell(summaryFooterRow, column);
    cell.font = { name: "Arial", size: 9, bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E2E2" } };
    cell.border = border;
    cell.alignment = { horizontal: "center", vertical: "middle" };
  }
  summarySheet.getRow(summaryFooterRow).height = 20;
  summarySheet.pageSetup.printArea = `A1:${summarySheet.getColumn(summaryTotalColumn).letter}${summaryFooterRow}`;
  summarySheet.views = [{ state: "frozen", ySplit: 4 }];

  for (const [diameter, patterns] of Array.from(patternsByDiameter.entries()).sort(
    ([a], [b]) => a - b,
  )) {
    const maxCutSlots = Math.max(
      10,
      ...patterns.map((pattern) => (pattern.cuts || []).length),
    );
    const firstCutColumn = 5;
    const lastCutColumn = firstCutColumn + maxCutSlots - 1;
    const offcutColumn = lastCutColumn + 1;
    const totalNoColumn = offcutColumn + 2;
    const fullLengthNoColumn = totalNoColumn + 1;
    const estimatedNoColumn = totalNoColumn + 2;
    const sheet = workbook.addWorksheet(`${diameter}MM-BAR`);

    sheet.columns = [
      { width: 7 },
      { width: 14 },
      { width: 9 },
      { width: 13 },
      ...Array.from({ length: maxCutSlots }, () => ({ width: 12 })),
      { width: 12 },
      { width: 3 },
      { width: 12 },
      { width: 17 },
      { width: 12 },
    ];
    sheet.pageSetup = {
      orientation: "landscape",
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.2, right: 0.2, top: 0.3, bottom: 0.3, header: 0.1, footer: 0.1 },
    };
    sheet.views = [{ state: "frozen", ySplit: 7 }];
    sheet.mergeCells(4, 1, 4, estimatedNoColumn);
    const title = sheet.getCell(4, 1);
    title.value = "REINFORCEMENT SCHEDULE (SITE)";
    title.font = { name: "Arial", size: 14, bold: true };
    title.alignment = { horizontal: "center", vertical: "middle" };
    title.border = border;
    sheet.getRow(4).height = 24;

    sheet.mergeCells(5, 1, 5, 2);
    sheet.mergeCells(5, 3, 5, 4);
    sheet.mergeCells(5, 12, 5, 13);
    sheet.mergeCells(5, 14, 5, 15);
    [
      [1, "LOCATION/SITE"],
      [3, projectLabel],
      [5, "STR. ELEMENT"],
      [6, schedule.title || "REBAR"],
      [7, "REINF. TYPE"],
      [8, `Y${diameter}`],
      [9, "LEVEL"],
      [10, level],
      [12, "SCHEDULE"],
      [14, schedule.scheduleNumber],
    ].forEach(([column, value], index) => {
      const cell = sheet.getCell(5, Number(column));
      cell.value = String(value);
      cell.font = {
        name: "Arial",
        size: 9,
        bold: index % 2 === 0,
      };
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = border;
    });
    sheet.getRow(5).height = 22;

    sheet.mergeCells(6, 1, 7, 1);
    sheet.mergeCells(6, 2, 7, 2);
    sheet.mergeCells(6, 3, 7, 3);
    if (lastCutColumn > firstCutColumn) {
      sheet.mergeCells(6, firstCutColumn, 6, lastCutColumn);
    }
    sheet.mergeCells(6, offcutColumn, 7, offcutColumn);
    sheet.mergeCells(6, totalNoColumn, 7, totalNoColumn);
    sheet.mergeCells(6, fullLengthNoColumn, 7, fullLengthNoColumn);
    sheet.mergeCells(6, estimatedNoColumn, 7, estimatedNoColumn);
    sheet.getCell(6, 1).value = "S/N";
    sheet.getCell(6, 2).value = "LENGTH";
    sheet.getCell(6, 3).value = "NO";
    sheet.getCell(6, firstCutColumn).value = "CUTTING SCHEDULE";
    sheet.getCell(6, offcutColumn).value = "OFFCUT";
    sheet.getCell(6, totalNoColumn).value = "TOTAL NO";
    sheet.getCell(6, fullLengthNoColumn).value = "NOS IN 1 FULL LENGTH";
    sheet.getCell(6, estimatedNoColumn).value = "EST. NO";
    for (let slot = 0; slot < maxCutSlots; slot++) {
      sheet.getCell(7, firstCutColumn + slot).value = slot + 1;
    }
    for (let row = 6; row <= 7; row++) {
      for (let column = 1; column <= estimatedNoColumn; column++) {
        const cell = sheet.getCell(row, column);
        cell.font = { name: "Arial", size: 8, bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E2F3" } };
        cell.border = border;
      }
    }
    sheet.getRow(6).height = 22;
    sheet.getRow(7).height = 20;

    patterns.forEach((pattern, index) => {
      const firstRow = 8 + index * 4;
      const cuts = pattern.cuts || [];
      const offcutMm = Math.round((pattern.offcutLengthM || 0) * 1000);
      const quantity = pattern.stockBarQuantity || 0;
      const cutCount = cuts.length;
      sheet.getCell(firstRow, 1).value = index + 1;
      sheet.getCell(firstRow, 2).value = Math.round(
        (pattern.stockLengthM || stockLengthM) * 1000,
      );
      sheet.getCell(firstRow, 3).value = quantity;
      sheet.getCell(firstRow + 1, 4).value = "BARMARK";
      sheet.getCell(firstRow + 2, 4).value = "ELEMENT";
      cuts.forEach((cut, slot) => {
        const column = firstCutColumn + slot;
        sheet.getCell(firstRow, column).value = Math.round(cut.cutLengthM * 1000);
        sheet.getCell(firstRow + 1, column).value = cut.barMark || "-";
        sheet.getCell(firstRow + 2, column).value =
          cut.member || schedule.levelName || "ELEMENT";
      });
      sheet.getCell(firstRow, offcutColumn).value = offcutMm;
      sheet.getCell(firstRow, totalNoColumn).value = quantity;
      sheet.getCell(firstRow, fullLengthNoColumn).value = cutCount;
      sheet.getCell(firstRow, estimatedNoColumn).value = quantity * cutCount;

      for (let row = firstRow; row < firstRow + 4; row++) {
        for (let column = 1; column <= estimatedNoColumn; column++) {
          const cell = sheet.getCell(row, column);
          cell.font = { name: "Arial", size: 8, bold: row === firstRow };
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
          cell.border = border;
        }
      }
      for (let slot = 0; slot < maxCutSlots; slot++) {
        const cell = sheet.getCell(firstRow, firstCutColumn + slot);
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: cuts[slot] ? "FFB7CCE2" : "FFEAF1F8" },
        };
        cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF003B68" } };
      }
      const offcutCell = sheet.getCell(firstRow, offcutColumn);
      offcutCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: offcutMm >= 300 ? "FFF4CCCC" : "FFD9D9D9" },
      };
      offcutCell.font = {
        name: "Arial",
        size: 9,
        bold: true,
        color: { argb: offcutMm >= 300 ? "FFCC0000" : "FF333333" },
      };
      sheet.getRow(firstRow).height = 19;
      sheet.getRow(firstRow + 1).height = 14;
      sheet.getRow(firstRow + 2).height = 14;
      sheet.getRow(firstRow + 3).height = 5;
    });

    const totalBars = patterns.reduce(
      (sum, pattern) => sum + (pattern.stockBarQuantity || 0),
      0,
    );
    const totalLengthM = totalBars * stockLengthM;
    const breakdown = schedule.summary?.diameterBreakdown?.[diameter];
    const totalTonnes = breakdown?.totalStockWeightKg
      ? breakdown.totalStockWeightKg / 1000
      : (totalLengthM * getLinearMassKgPerM(diameter)) / 1000;
    const footerRow = 8 + patterns.length * 4;
    sheet.mergeCells(footerRow, 1, footerRow, 2);
    sheet.mergeCells(footerRow, 3, footerRow, 4);
    sheet.mergeCells(footerRow, 5, footerRow, 6);
    sheet.mergeCells(footerRow, 7, footerRow, 8);
    sheet.mergeCells(footerRow, 9, footerRow, estimatedNoColumn);
    sheet.getCell(footerRow, 1).value = "TOTAL LENGTH (m)";
    sheet.getCell(footerRow, 3).value = Number(totalLengthM.toFixed(2));
    sheet.getCell(footerRow, 5).value = "MT";
    sheet.getCell(footerRow, 7).value = Number(totalTonnes.toFixed(3));
    sheet.getCell(footerRow, 9).value =
      "NOTE: Red offcuts of 300mm and above should be tagged and stored for further use.";
    for (let column = 1; column <= estimatedNoColumn; column++) {
      const cell = sheet.getCell(footerRow, column);
      cell.font = { name: "Arial", size: 9, bold: true };
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = border;
    }
    sheet.getCell(footerRow, 9).font = {
      name: "Arial",
      size: 8,
      bold: false,
      color: { argb: "FF990000" },
    };
    sheet.getRow(footerRow).height = 30;
    sheet.pageSetup.printArea = `A4:${sheet.getColumn(estimatedNoColumn).letter}${footerRow}`;
  }

  const docRef = (schedule.scheduleNumber || "cutting-schedule").replace(
    /[<>:"/\\|?*\u0000-\u001F]/g,
    "-",
  );
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${docRef}.xlsx`;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
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

      const cutSegmentsHTML = Array.from({ length: 10 }, (_, slot) => {
        const cut = cuts[slot];
        if (!cut) return `<td style="background:#ffffff;border:1px solid #cbd5e1;"></td>`;
        const cutMm = Math.round(cut.cutLengthM * 1000);
        return `
          <td style="background:#f0f9ff;border:1px solid #38bdf8;padding:1px 2px;text-align:center;width:7%;">
            <div style="font-weight:800;font-size:8px;color:#0369a1;line-height:1;">${cutMm}</div>
            <div style="font-size:6px;font-weight:800;color:#0369a1;line-height:1;margin-top:1px;">${cut.barMark || "-"}</div>
            <div style="font-size:5.5px;font-weight:700;color:#475569;line-height:1;margin-top:1px;">${cut.member || schedule.levelName || "ELEMENT"}</div>
          </td>
        `;
      }).join("");

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
          ${cutSegmentsHTML}
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
            <div class="header-title">REINFORCEMENT SCHEDULE (SITE)</div>
            <div class="header-sub">PROJECT: ${projectName} (${projectCode})</div>
            <div class="header-iso">CUTTING SCHEDULE &bull; 12.0m COMMERCIAL STOCK</div>
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
          <td class="meta-label">LOCATION/SITE</td>
          <td class="meta-val">${schedule.levelName || "SITE"}</td>
          <td class="meta-label">NO</td>
          <td class="meta-val" style="font-family:monospace;color:#0284c7;">${docRef}</td>
          <td class="meta-label">BTR. ELEMENT</td>
          <td class="meta-val">${schedule.title || "Reinforcement Cutting Order"}</td>
        </tr>
        <tr>
          <td class="meta-label">PERIMETER/B.EAM</td>
          <td class="meta-val">${schedule.levelName || "GENERAL"}</td>
          <td class="meta-label">REINF. TYPE</td>
          <td class="meta-val">${schedule.steelGrade || "GRADE 500B"}</td>
          <td class="meta-label">Y${primaryDiameter}</td>
          <td class="meta-val">${schedule.levelName === "Substructure" ? "SUB-STRUCTURE" : "LEVEL"}</td>
        </tr>
      </table>

      <!-- Main Cutting Table -->
      <table class="cutting-table">
        <thead>
          <tr>
            <th style="width: 36px;">S/N</th>
            <th style="width: 90px;">LENGTH</th>
            <th style="width: 50px;">NO</th>
            ${Array.from({length:10}, (_, i) => `<th style="width:7%;font-size:7px;">${i + 1}</th>`).join("")}
            <th style="width: 55px;">OFFCUT</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>

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
