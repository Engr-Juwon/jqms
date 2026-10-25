import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import { StructuralElement, Project, Company } from "@/types";
import { renderCompanyBrandCell } from "@/lib/companyHelper";
import { generateUniversalName } from "@/lib/naming";

export interface ElementScheduleExportOptions {
  fileName?: string;
  levelNameMap?: Map<string, string>;
}

/**
 * Generates and downloads a vector PDF of the Structural Element Schedule & Takeoff.
 * Formatted for landscape A4 with dynamic company branding and QA sign-off block.
 */
export function exportElementSchedulePDF(
  elements: StructuralElement[],
  project?: Partial<Project>,
  company?: Partial<Company>,
  options: ElementScheduleExportOptions = {},
): void {
  const companyName = company?.name || company?.legalName || "Corporate Quality Framework";
  const compAddress = company?.address || "";
  const compEmail = company?.email || "";
  const compPhone = company?.phone || "";
  const projectName = project?.name || "Structural Engineering Project";
  const projectCode = project?.code || "PRJ-001";
  const qaqcEngineer = (project as any)?.qaqcEngineerName || "Lead QA/QC Engineer";

  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const fileName =
    options.fileName ||
    generateUniversalName(projectCode, "MTO", { extension: "pdf" });

  const totalVolume = elements.reduce(
    (sum, el) => sum + (parseFloat(String(el.calculatedVolume || el.volume || 0)) || 0),
    0,
  );
  const totalFormwork = elements.reduce(
    (sum, el) => sum + (parseFloat(String(el.calculatedFormworkArea || 0)) || 0),
    0,
  );

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 297;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  // 1. Top Header Box
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, margin, contentWidth, 18, "F");

  // Amber accent line
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(margin, margin + 17.2, contentWidth, 0.8, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(
    "STRUCTURAL ELEMENT SCHEDULE & CONCRETE / FORMWORK TAKEOFF",
    margin + 4,
    margin + 6.5,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text(
    "BIM Spatial Twin Asset Registry — ISO 9001:2015 Quality & Dimension Verification",
    margin + 4,
    margin + 11.5,
  );
  doc.text(
    `Project: ${projectName} (${projectCode}) | Lead QA/QC: ${qaqcEngineer}`,
    margin + 4,
    margin + 15.5,
  );

  // Right Side Project / Company Info
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
    `${compEmail} | ${compPhone} | Date: ${currentDate}`,
    pageWidth - margin - 4,
    margin + 14.5,
    { align: "right" },
  );

  // 2. Summary Metadata Table
  autoTable(doc, {
    startY: 30.5,
    margin: { left: margin, right: margin },
    body: [
      [
        {
          content: "PROJECT:",
          styles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [71, 85, 105] },
        },
        { content: `${projectName} (${projectCode})` },
        {
          content: "TOTAL ELEMENTS:",
          styles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [71, 85, 105] },
        },
        { content: String(elements.length), styles: { fontStyle: "bold", textColor: [2, 132, 199] } },
        {
          content: "TOTAL CONCRETE VOL:",
          styles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [71, 85, 105] },
        },
        {
          content: `${totalVolume.toFixed(3)} m³`,
          styles: { fontStyle: "bold", textColor: [15, 23, 42] },
        },
      ],
      [
        {
          content: "LEAD QA/QC:",
          styles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [71, 85, 105] },
        },
        { content: qaqcEngineer },
        {
          content: "TOTAL FORMWORK:",
          styles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [71, 85, 105] },
        },
        { content: `${totalFormwork.toFixed(2)} m²` },
        {
          content: "DATE OF REPORT:",
          styles: { fontStyle: "bold", fillColor: [241, 245, 249], textColor: [71, 85, 105] },
        },
        { content: currentDate },
      ],
    ],
    theme: "grid",
    styles: {
      fontSize: 7,
      cellPadding: 1.2,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 70 },
      2: { cellWidth: 32 },
      3: { cellWidth: 36 },
      4: { cellWidth: 38 },
      5: { cellWidth: 73 },
    },
  });

  // 3. Main Elements Schedule Table
  const tableRows: RowInput[] = elements.map((el, idx) => {
    const lvlName =
      options.levelNameMap?.get(el.levelId || "") ||
      el.level ||
      el.levelName ||
      "Level";
    const grid = el.grid || el.gridAxis || "—";
    const dimL = el.length || el.dimensions?.length || 0;
    const dimW = el.width || el.dimensions?.width || 0;
    const dimH = el.height || el.dimensions?.height || 0;
    const dimDia = el.diameter || (el.dimensions as any)?.diameter || 0;

    let dimStr = "Standard";
    if (dimDia > 0) {
      dimStr = `Ø ${dimDia}m × H ${dimH}m`;
    } else if (dimL || dimW || dimH) {
      dimStr = `${dimL} × ${dimW} × ${dimH} mm`;
    }

    const vol = parseFloat(String(el.calculatedVolume || el.volume || 0)) || 0;
    const fmwk = parseFloat(String(el.calculatedFormworkArea || 0)) || 0;

    return [
      String(idx + 1),
      el.elementName || "—",
      el.elementType || "ELEMENT",
      lvlName,
      grid,
      dimStr,
      el.concreteGrade || "C35/45",
      vol.toFixed(3),
      fmwk.toFixed(2),
      el.status || "PENDING",
    ];
  });

  const nextTableStartY = (doc as any).lastAutoTable
    ? (doc as any).lastAutoTable.finalY + 3
    : 42;

  autoTable(doc, {
    startY: nextTableStartY,
    margin: { left: margin, right: margin },
    head: [
      [
        "S/N",
        "ELEMENT NAME",
        "TYPE",
        "LEVEL",
        "GRID",
        "DIMENSIONS",
        "MIX GRADE",
        "NET VOL (m³)",
        "FMWK (m²)",
        "QA STATUS",
      ],
    ],
    body: tableRows.length > 0 ? tableRows : [["—", "No elements found", "—", "—", "—", "—", "—", "0.000", "0.00", "—"]],
    theme: "grid",
    headStyles: {
      fillColor: [226, 232, 240],
      textColor: [15, 23, 42],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
      lineColor: [148, 163, 184],
      lineWidth: 0.2,
      cellPadding: 1,
    },
    styles: {
      fontSize: 6.8,
      cellPadding: 0.8,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 44, fontStyle: "bold" },
      2: { cellWidth: 26 },
      3: { cellWidth: 32 },
      4: { cellWidth: 22, halign: "center" },
      5: { cellWidth: 44 },
      6: { cellWidth: 24, halign: "center" },
      7: { cellWidth: 25, halign: "right" },
      8: { cellWidth: 22, halign: "right" },
      9: { cellWidth: 26, halign: "center", fontStyle: "bold" },
    },
  });

  // 4. Sign-Off Block
  let signY = (doc as any).lastAutoTable
    ? (doc as any).lastAutoTable.finalY + 4
    : 160;

  if (signY > 175) {
    doc.addPage();
    signY = 15;
  }

  autoTable(doc, {
    startY: signY,
    margin: { left: margin, right: margin },
    body: [
      [
        {
          content: "PREPARED BY (SITE / QA/QC ENGINEER):\nName: " + qaqcEngineer + "\n\nSignature: __________________   Date: " + currentDate,
          styles: { cellPadding: 2, fontSize: 6.8, textColor: [71, 85, 105] },
        },
        {
          content: "CHECKED BY (QUALITY CONTROL MANAGER):\nName: Lead Quality Manager\n\nSignature: __________________   Date: ____/____/20__",
          styles: { cellPadding: 2, fontSize: 6.8, textColor: [71, 85, 105] },
        },
        {
          content: "APPROVED BY (RESIDENT ENGINEER / CONSULTANT):\nName: Structural Consultant\n\nSignature: __________________   Date: ____/____/20__",
          styles: { cellPadding: 2, fontSize: 6.8, textColor: [71, 85, 105] },
        },
      ],
    ],
    theme: "grid",
    styles: {
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
  });

  doc.save(fileName);
}

/**
 * Generates and downloads a clean CSV file of the structural element schedule.
 */
export function exportElementScheduleCSV(
  elements: StructuralElement[],
  project?: Partial<Project>,
  levelNameMap?: Map<string, string>,
): void {
  const projectCode = project?.code || "PRJ-001";
  const fileName = generateUniversalName(projectCode, "MTO", {
    extension: "csv",
  });

  const headers = [
    "S/N",
    "Element ID",
    "Element Name",
    "Type",
    "Level",
    "Grid Axis",
    "Length (mm)",
    "Width (mm)",
    "Height (mm)",
    "Diameter (m)",
    "Concrete Mix Grade",
    "Net Volume (m3)",
    "Formwork Area (m2)",
    "Rebar Specification",
    "Planned Pour Date",
    "QA Status",
  ];

  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = elements.map((el, idx) => {
    const lvlName =
      levelNameMap?.get(el.levelId || "") ||
      el.level ||
      el.levelName ||
      "Level";
    const grid = el.grid || el.gridAxis || "";
    const dimL = el.length || el.dimensions?.length || 0;
    const dimW = el.width || el.dimensions?.width || 0;
    const dimH = el.height || el.dimensions?.height || 0;
    const dimDia = el.diameter || (el.dimensions as any)?.diameter || 0;
    const vol = parseFloat(String(el.calculatedVolume || el.volume || 0)) || 0;
    const fmwk = parseFloat(String(el.calculatedFormworkArea || 0)) || 0;

    return [
      idx + 1,
      el.id,
      el.elementName || "",
      el.elementType || "",
      lvlName,
      grid,
      dimL,
      dimW,
      dimH,
      dimDia,
      el.concreteGrade || "C35/45",
      vol.toFixed(3),
      fmwk.toFixed(2),
      el.rebarSpec || "",
      el.plannedPourDate || el.plannedCastingDate || "",
      el.status || "PENDING",
    ].map(escapeCSV).join(",");
  });

  const csvContent = [headers.map(escapeCSV).join(","), ...rows].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
