import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import { ITPPlan, Project, Company } from "@/types";
import { renderCompanyBrandCell } from "@/lib/companyHelper";

export interface ITPExportOptions {
  fileName?: string;
  orientation?: "landscape" | "portrait";
}

/**
 * Generates and directly downloads the company-standard Inspection & Test Plan (ITP) Matrix PDF
 * conforming to Collection Developments LTD Quality Plan (CD-QP-001 Rev 01).
 * Uses pure jsPDF + autoTable for reliable vector PDF generation.
 */
export function exportITPPlanPDF(
  plan: ITPPlan,
  project?: Partial<Project>,
  company?: Partial<Company>,
  options: ITPExportOptions = {},
): void {
  const companyName =
    company?.name || plan.companyName || "Collection Developments LTD";
  const officeAddress =
    company?.address ||
    plan.officeAddress ||
    "3B, Taofik Lawal, Off Awolowo Road, Ikoyi, Lagos";
  const contactPhone =
    company?.phone || plan.contactPhone || "+234 (0) 16328782";
  const contactEmail =
    company?.email || plan.contactEmail || "info@collection.gp";
  const docCode = plan.docCode || "CD-QP-001";
  const revision = plan.revision || "REV. 01";
  const projectName = project?.name || plan.projectName || "Standard Construction Development";
  const projectCode = project?.code || "CDL-PRJ-001";

  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const docRef = plan.itpNumber || "CD-ITP-001";
  const fileName = options.fileName || `${docRef}_ITP_Matrix.pdf`;

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
  // 1. TOP HEADER BANNER (MATCHING CD-QP-001)
  // =========================================================================
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, margin, contentWidth, 17, "F");

  // Amber accent stripe
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(margin, margin + 16.2, contentWidth, 0.8, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(255, 255, 255);
  doc.text(
    "QUALITY ASSURANCE / QUALITY CONTROL DEPARTMENT",
    margin + 4,
    margin + 6.5,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(
    `Inspection & Test Plan (ITP) Matrix — ${docCode} Compliance (ISO 9001:2015 Clause 8.5.1)`,
    margin + 4,
    margin + 11.5,
  );

  // Right Side Company / Document info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(companyName, pageWidth - margin - 4, margin + 5.5, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `${officeAddress} | Phone: ${contactPhone} | Email: ${contactEmail}`,
    pageWidth - margin - 4,
    margin + 10,
    { align: "right" },
  );
  doc.text(
    `${docCode} | ${revision} | Doc Ref: ${docRef}`,
    pageWidth - margin - 4,
    margin + 14.5,
    { align: "right" },
  );

  // =========================================================================
  // 2. METADATA SUMMARY TABLE
  // =========================================================================
  autoTable(doc, {
    startY: 29.5,
    margin: { left: margin, right: margin },
    body: [
      [
        {
          content: "ITP TITLE:",
          styles: {
            fontStyle: "bold",
            fillColor: [241, 245, 249],
            textColor: [71, 85, 105],
          },
        },
        {
          content: plan.title || "Inspection & Test Plan Matrix",
          styles: { fontStyle: "bold", textColor: [15, 23, 42] },
        },
        {
          content: "DISCIPLINE:",
          styles: {
            fontStyle: "bold",
            fillColor: [241, 245, 249],
            textColor: [71, 85, 105],
          },
        },
        { content: plan.discipline || "Civil/Structural" },
        {
          content: "REVISION:",
          styles: {
            fontStyle: "bold",
            fillColor: [241, 245, 249],
            textColor: [71, 85, 105],
          },
        },
        { content: `${revision} (${currentDate})` },
      ],
      [
        {
          content: "METHOD STATEMENT:",
          styles: {
            fontStyle: "bold",
            fillColor: [241, 245, 249],
            textColor: [71, 85, 105],
          },
        },
        {
          content: `${plan.methodStatementRef || "WMS-CIV-001"} — ${plan.methodStatementTitle || "Approved Construction Methodology"}`,
        },
        {
          content: "SPECIFICATION:",
          styles: {
            fontStyle: "bold",
            fillColor: [241, 245, 249],
            textColor: [71, 85, 105],
          },
        },
        { content: plan.specSection || "Project Technical Specifications" },
        {
          content: "STATUS:",
          styles: {
            fontStyle: "bold",
            fillColor: [241, 245, 249],
            textColor: [71, 85, 105],
          },
        },
        {
          content: plan.status || "APPROVED",
          styles: {
            fontStyle: "bold",
            textColor:
              plan.status === "APPROVED"
                ? [22, 163, 74]
                : plan.status === "UNDER_REVIEW"
                  ? [202, 138, 4]
                  : [71, 85, 105],
          },
        },
      ],
      [
        {
          content: "PROJECT / SITE:",
          styles: {
            fontStyle: "bold",
            fillColor: [241, 245, 249],
            textColor: [71, 85, 105],
          },
        },
        { content: `${projectName} (${projectCode})` },
        {
          content: "PREPARED BY:",
          styles: {
            fontStyle: "bold",
            fillColor: [241, 245, 249],
            textColor: [71, 85, 105],
          },
        },
        {
          content: `${plan.preparedBy || "Oladejo Jesujuwon"} (${plan.preparedByTitle || "QA/QC Engineer"})`,
        },
        {
          content: "APPROVED BY:",
          styles: {
            fontStyle: "bold",
            fillColor: [241, 245, 249],
            textColor: [71, 85, 105],
          },
        },
        {
          content: plan.approvedBy || "Structural Consultant / Lead RE",
        },
      ],
    ],
    theme: "grid",
    styles: {
      fontSize: 6.8,
      cellPadding: 1.4,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 84 },
      2: { cellWidth: 26 },
      3: { cellWidth: 70 },
      4: { cellWidth: 20 },
      5: { cellWidth: 49 },
    },
  });

  // =========================================================================
  // 3. MASTER ITP MATRIX TABLE
  // =========================================================================
  const items = plan.items || [];
  const matrixRows: RowInput[] = items.map((item, idx) => {
    const sn = item.itemNo || String(idx + 1);

    // Gate badge styling
    let gateBg: [number, number, number] = [241, 245, 249];
    let gateFg: [number, number, number] = [15, 23, 42];
    let gateLabel = item.controlGate || "S";

    if (gateLabel === "H") {
      gateBg = [254, 226, 226]; // light red #fee2e2
      gateFg = [220, 38, 38];   // deep red #dc2626
    } else if (gateLabel === "W") {
      gateBg = [254, 243, 199]; // light amber #fef3c7
      gateFg = [180, 83, 9];    // dark amber #b45309
    } else if (gateLabel === "R") {
      gateBg = [241, 245, 249]; // light slate #f1f5f9
      gateFg = [71, 85, 105];   // slate #475569
    } else if (gateLabel === "S") {
      gateBg = [224, 242, 254]; // light blue #e0f2fe
      gateFg = [3, 105, 161];   // deep blue #0369a1
    }

    return [
      {
        content: sn,
        styles: { halign: "center", valign: "middle", fontStyle: "bold", fontSize: 7.5 },
      },
      {
        content: item.activityStage || "—",
        styles: { fontStyle: "bold", textColor: [15, 23, 42], fontSize: 7 },
      },
      {
        content: item.itemParameter || "—",
        styles: { textColor: [51, 65, 85], fontSize: 6.8 },
      },
      {
        content: item.referenceStandard || "Project Spec",
        styles: { textColor: [2, 132, 199], fontStyle: "bold", fontSize: 6.8 },
      },
      {
        content: item.acceptanceCriteria || "Per approved specification and drawings",
        styles: { textColor: [15, 23, 42], fontSize: 6.8 },
      },
      {
        content: gateLabel,
        styles: {
          halign: "center",
          valign: "middle",
          fontStyle: "bold",
          fontSize: 8.5,
          fillColor: gateBg,
          textColor: gateFg,
        },
      },
      {
        content: item.responsibleParty || "QA/QC Engineer",
        styles: { textColor: [71, 85, 105], fontSize: 6.8 },
      },
      {
        content: item.verifiableRecord || "WIR / RFI",
        styles: { textColor: [15, 23, 42], fontStyle: "normal", fontSize: 6.5 },
      },
    ];
  });

  const nextTableStartY = (doc as any).lastAutoTable
    ? (doc as any).lastAutoTable.finalY + 3
    : 48;

  autoTable(doc, {
    startY: nextTableStartY,
    margin: { left: margin, right: margin },
    head: [
      [
        "S/N",
        "ACTIVITY / STAGE",
        "INSPECTION ITEM / PARAMETER",
        "REFERENCE STANDARD / SPEC",
        "ACCEPTANCE CRITERIA",
        "GATE",
        "RESPONSIBLE / VERIFYING PARTY",
        "CONTROLLING RECORD",
      ],
    ],
    body:
      matrixRows.length > 0
        ? matrixRows
        : [["—", "No inspection items defined", "—", "—", "—", "—", "—", "—"]],
    theme: "grid",
    headStyles: {
      fillColor: [226, 232, 240], // slate-200
      textColor: [15, 23, 42],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
      lineWidth: 0.2,
      lineColor: [148, 163, 184],
    },
    styles: {
      fontSize: 6.8,
      cellPadding: 1.6,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 34, halign: "left" },
      2: { cellWidth: 50, halign: "left" },
      3: { cellWidth: 32, halign: "left" },
      4: { cellWidth: 70, halign: "left" },
      5: { cellWidth: 14, halign: "center" },
      6: { cellWidth: 37, halign: "left" },
      7: { cellWidth: 30, halign: "left" },
    },
  });

  // =========================================================================
  // 4. CONTROL GATES LEGEND & QA SIGN-OFF
  // =========================================================================
  let footerY = (doc as any).lastAutoTable
    ? (doc as any).lastAutoTable.finalY + 4
    : 155;

  if (footerY > 165) {
    doc.addPage();
    footerY = 15;
  }

  // Legend Box on Left
  const legendW = 120;
  const legendH = 20;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(margin, footerY, legendW, legendH, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("CONTROL GATES (CD-QP-001 SECTION 5.3.2):", margin + 3, footerY + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(51, 65, 85);
  doc.text(
    "• H (Hold Point): Mandatory stoppage; work CANNOT proceed without signed clearance.",
    margin + 3,
    footerY + 8,
  );
  doc.text(
    "• W (Witness Point): Scheduled checkpoint; work proceeds if inspector is absent at notice time.",
    margin + 3,
    footerY + 11.5,
  );
  doc.text(
    "• R (Review Point): Administrative verification of test certificates, MTC, or delivery records.",
    margin + 3,
    footerY + 15,
  );
  doc.text(
    "• S (Surveillance): Random ongoing site monitoring and visual audits by the QA/QC team.",
    margin + 3,
    footerY + 18.5,
  );

  // Signatures Table on Right
  const signX = margin + legendW + 4;
  const signW = contentWidth - (legendW + 4);
  autoTable(doc, {
    startY: footerY,
    margin: { left: signX },
    tableWidth: signW,
    body: [
      [
        {
          content: `PREPARED BY (QA/QC ENGINEER):\n\nName:  ${plan.preparedBy || "Oladejo Jesujuwon"}\n\nSignature: __________________  Date: ${plan.preparedByDate || currentDate}`,
          styles: { cellPadding: 2, textColor: [51, 65, 85], fontSize: 6.2 },
        },
        {
          content: `CHECKED BY (QUALITY MANAGER):\n\nName:  ${plan.checkedBy || "QA/QC Manager"}\n\nSignature: __________________  Date: ${plan.checkedByDate || currentDate}`,
          styles: { cellPadding: 2, textColor: [51, 65, 85], fontSize: 6.2 },
        },
        {
          content: `APPROVED BY (STRUCTURAL CONSULTANT / RE):\n\nName:  ${plan.approvedBy || "Resident Engineer"}\n\nSignature: __________________  Date: ${plan.approvedByDate || "____/____/20__"}`,
          styles: { cellPadding: 2, textColor: [51, 65, 85], fontSize: 6.2 },
        },
      ],
    ],
    theme: "grid",
    styles: { fontSize: 6.2, lineColor: [203, 213, 225], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: signW / 3 },
      1: { cellWidth: signW / 3 },
      2: { cellWidth: signW / 3 },
    },
  });

  // =========================================================================
  // 5. STAMP PAGE NUMBERS & CONFIDENTIAL STATUTORY FOOTER
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `CONFIDENTIAL QUALITY MANAGEMENT RECORD — ${companyName} — Quality Plan Ref: ${docCode} — Doc Ref: ${docRef}`,
      margin,
      pageHeight - 5,
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, {
      align: "right",
    });
  }

  // Direct vector save
  doc.save(fileName);
}

/**
 * Generates clean CSV spreadsheet export of the ITP Matrix.
 */
export function exportITPPlanCSV(plan: ITPPlan, fileName?: string): void {
  const docRef = plan.itpNumber || "CD-ITP-001";
  const outName = fileName || `${docRef}_ITP_Matrix.csv`;

  const headers = [
    "S/N",
    "Activity / Stage",
    "Inspection Item / Parameter",
    "Reference Standard / Spec",
    "Acceptance Criteria",
    "Control Gate",
    "Responsible / Verifying Party",
    "Frequency",
    "Controlling Record",
    "Remarks",
  ];

  const rows = (plan.items || []).map((item, idx) => {
    return [
      item.itemNo || String(idx + 1),
      `"${(item.activityStage || "").replace(/"/g, '""')}"`,
      `"${(item.itemParameter || "").replace(/"/g, '""')}"`,
      `"${(item.referenceStandard || "").replace(/"/g, '""')}"`,
      `"${(item.acceptanceCriteria || "").replace(/"/g, '""')}"`,
      item.controlGate || "S",
      `"${(item.responsibleParty || "").replace(/"/g, '""')}"`,
      `"${(item.frequency || "").replace(/"/g, '""')}"`,
      `"${(item.verifiableRecord || "").replace(/"/g, '""')}"`,
      `"${(item.remarks || "").replace(/"/g, '""')}"`,
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
 * Generates formatted HTML string of the ITP Matrix.
 */
export function generateITPHTML(
  plan: ITPPlan,
  project?: Partial<Project>,
  company?: Partial<Company>,
): string {
  const companyName =
    company?.name || plan.companyName || "Collection Developments LTD";
  const officeAddress =
    company?.address ||
    plan.officeAddress ||
    "3B, Taofik Lawal, Off Awolowo Road, Ikoyi, Lagos";
  const contactPhone =
    company?.phone || plan.contactPhone || "+234 (0) 16328782";
  const contactEmail =
    company?.email || plan.contactEmail || "info@collection.gp";
  const docCode = plan.docCode || "CD-QP-001";
  const revision = plan.revision || "REV. 01";
  const docRef = plan.itpNumber || "CD-ITP-001";

  const rowsHTML = (plan.items || [])
    .map((item, idx) => {
      const gate = item.controlGate || "S";
      let gateStyle = "background: #f1f5f9; color: #475569;";
      if (gate === "H") gateStyle = "background: #fee2e2; color: #dc2626; font-weight: 800;";
      else if (gate === "W") gateStyle = "background: #fef3c7; color: #b45309; font-weight: 800;";
      else if (gate === "R") gateStyle = "background: #f1f5f9; color: #475569; font-weight: 800;";
      else if (gate === "S") gateStyle = "background: #e0f2fe; color: #0369a1; font-weight: 800;";

      return `
        <tr>
          <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; padding: 4px;">${item.itemNo || idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; font-weight: bold; padding: 4px;">${item.activityStage || "—"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px;">${item.itemParameter || "—"}</td>
          <td style="border: 1px solid #cbd5e1; color: #0284c7; font-weight: bold; padding: 4px;">${item.referenceStandard || "—"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px;">${item.acceptanceCriteria || "—"}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; padding: 4px; ${gateStyle}">${gate}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px;">${item.responsibleParty || "—"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px;">${item.verifiableRecord || "WIR / RFI"}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>${docRef} - ITP Matrix</title>
      <style>
        * { box-sizing: border-box; }
        @page { size: A4 landscape; margin: 8mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size: 10px; color: #0f172a; margin: 0; padding: 10px; }
        .doc-header { width: 100%; border: 1.5px solid #0f172a; border-collapse: collapse; margin-bottom: 8px; background: #ffffff; }
        .doc-header td { border: 1px solid #cbd5e1; padding: 6px; vertical-align: middle; }
        .header-brand { width: 22%; background: #ffffff; text-align: center; }
        .header-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #0f172a; text-align: center; }
        .header-sub { font-size: 9.5px; font-weight: 700; color: #ea580c; margin-top: 2px; text-transform: uppercase; text-align: center; }
        .header-iso { font-size: 7.5px; font-weight: 600; color: #64748b; text-transform: uppercase; text-align: center; margin-top: 1px; }
        .meta-box { width: 25%; font-size: 8px; line-height: 1.5; color: #334155; }
        .meta-table, .matrix-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 9px; }
        .meta-table td, .matrix-table td, .matrix-table th { border: 1px solid #cbd5e1; padding: 4px 6px; }
        .matrix-table th { background: #e2e8f0; font-weight: 800; text-align: center; }
        .legend { border: 1px solid #cbd5e1; background: #f8fafc; padding: 6px 10px; font-size: 8.5px; border-radius: 4px; margin-top: 8px; }
      </style>
    </head>
    <body>
      <table class="doc-header">
        <tr>
          <td class="header-brand">
            ${renderCompanyBrandCell(company, project)}
          </td>
          <td style="width: 53%;">
            <div class="header-title">INSPECTION & TEST PLAN (ITP) MATRIX</div>
            <div class="header-sub">PROJECT: ${project?.name || plan.projectName || "Standard Construction Development"} &bull; ${plan.discipline || "Civil & Structural"}</div>
            <div class="header-iso">ISO 9001:2015 Clause 8.5.1 Control of Production & Service Provision</div>
          </td>
          <td class="meta-box">
            <strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:700;">${docRef}</span><br/>
            <strong>Rev No:</strong> ${revision}<br/>
            <strong>Doc Code:</strong> ${docCode}<br/>
            <strong>Date:</strong> ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </td>
        </tr>
      </table>

      <table class="meta-table">
        <tr>
          <td style="background: #f1f5f9; font-weight: bold; width: 15%;">DISCIPLINE:</td>
          <td style="width: 35%;">${plan.discipline}</td>
          <td style="background: #f1f5f9; font-weight: bold; width: 15%;">METHOD STATEMENT:</td>
          <td style="width: 35%;">${plan.methodStatementRef || "WMS-001"} — ${plan.methodStatementTitle || "Approved Methodology"}</td>
        </tr>
        <tr>
          <td style="background: #f1f5f9; font-weight: bold;">SPECIFICATION:</td>
          <td>${plan.specSection || "Project Specs"}</td>
          <td style="background: #f1f5f9; font-weight: bold;">PREPARED BY:</td>
          <td>${plan.preparedBy} (${plan.preparedByTitle || "QA/QC Engineer"})</td>
        </tr>
      </table>

      <table class="matrix-table">
        <thead>
          <tr>
            <th style="width: 30px;">S/N</th>
            <th style="width: 110px;">ACTIVITY / STAGE</th>
            <th>INSPECTION ITEM / PARAMETER</th>
            <th style="width: 110px;">REFERENCE STANDARD</th>
            <th>ACCEPTANCE CRITERIA</th>
            <th style="width: 45px;">GATE</th>
            <th style="width: 110px;">RESPONSIBLE PARTY</th>
            <th style="width: 90px;">RECORD</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>

      <div class="legend">
        <strong>CONTROL GATES (CD-QP-001 Section 5.3.2):</strong><br/>
        <strong>[ H ] Hold Point:</strong> Mandatory quality stoppage; work cannot proceed without signed inspection clearance.<br/>
        <strong>[ W ] Witness Point:</strong> Scheduled checkpoint; work proceeds if inspector is absent at agreed notification time.<br/>
        <strong>[ R ] Review Point:</strong> Administrative verification of test certificates, MTC, or delivery records.<br/>
        <strong>[ S ] Surveillance:</strong> Random ongoing site monitoring and visual inspection by QA/QC team.
      </div>
    </body>
    </html>
  `;
}

/**
 * Opens print preview window for ITP Matrix.
 */
export function printITPPlan(
  plan: ITPPlan,
  project?: Partial<Project>,
  company?: Partial<Company>,
): void {
  const html = generateITPHTML(plan, project, company);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  }
}
