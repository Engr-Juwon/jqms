import {
  SiteCommentReport,
  NonConformanceReport,
  RequestForInformation,
  MaterialApprovalRequest,
  PermitToPour,
  WeeklyReport,
  InspectionRequest,
  Project,
  Company,
  ProjectLevel,
  StructuralElement,
  ConcreteCubeSample,
  CubeCrushTest,
  SiteInstruction,
  MaterialInspectionReport,
  DailySiteLog,
} from "@/types";
import html2pdf from "html2pdf.js";
import { createDefaultPermitChecklist } from "@/lib/permitChecklist";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { generateNewWeeklyPresentationPDF } from "@/services/pdf/weeklyReportGenerator";
import {
  generateStandardNCRPDF,
  type StandardNCRPDFData,
} from "@/services/pdf/ncrReport";
import { mapNCRToPDFData } from "@/pages/NCRDetail";
import { renderCompanyBrandCell } from "@/lib/companyHelper";
import { renderStructuredInspectionHTML } from "@/lib/inspectionTextFormatter";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";

// ==========================================
// COMMON STYLES & PRINT ENGINE
// ==========================================

const COMMON_CSS = `
  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  @page {
    size: A4 portrait;
    margin: 0;
  }
  @media print {
    html, body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
    }
    .no-print { display: none !important; }
  }
  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    font-size: 8.5px;
    color: #0f172a;
    margin: 0;
    line-height: 1.35;
    background: #ffffff;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .page-container {
    width: 100%;
    max-width: 210mm;
    margin: 0 auto;
    padding: 10mm 10mm 12mm 10mm;
    box-sizing: border-box;
  }
  .pdf-section {
    page-break-inside: avoid;
    break-inside: avoid;
    margin-bottom: 8px;
  }

  /* ═══ DOCUMENT HEADER TABLE ═══ */
  .doc-header-table {
    width: 100%;
    border-collapse: collapse;
    border: 1.5px solid #0f172a;
    margin-bottom: 8px;
    background: #ffffff;
  }
  .doc-header-table td {
    border: 1px solid #cbd5e1;
    padding: 6px 8px;
    vertical-align: middle;
  }
  .header-brand-cell {
    width: 22%;
    text-align: center;
    background: #ffffff;
  }
  .header-title-cell {
    width: 53%;
    text-align: center;
  }
  .header-title-main {
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    color: #0f172a;
    letter-spacing: 0.8px;
  }
  .header-title-project {
    font-size: 9.5px;
    font-weight: 700;
    color: #ea580c;
    margin-top: 2px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .header-title-iso {
    font-size: 7.5px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    margin-top: 1px;
  }
  .header-meta-cell {
    width: 25%;
    font-size: 8px;
    line-height: 1.5;
    background: #ffffff;
    color: #334155;
  }

  /* ═══ SECTION TITLES ═══ */
  .section-banner, .section-title {
    background: #0f172a;
    color: #f8fafc;
    font-weight: 700;
    font-size: 9px;
    padding: 3.5px 8px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 0;
    border-left: 4px solid #ea580c;
  }

  /* ═══ TABLES ═══ */
  .grid-table, .section-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #cbd5e1;
    border-top: none;
    margin-bottom: 8px;
  }
  .grid-table td, .grid-table th, .section-table td, .section-table th {
    border: 1px solid #cbd5e1;
    padding: 4.5px 6.5px;
    font-size: 8px;
    vertical-align: top;
  }
  .grid-label, .lbl {
    background: #f1f5f9;
    font-weight: 700;
    color: #334155;
    text-transform: uppercase;
    font-size: 8px;
    letter-spacing: 0.3px;
  }
  .grid-value, .val {
    color: #0f172a;
    font-size: 8.5px;
  }
  .box-content {
    border: 1px solid #cbd5e1;
    border-top: none;
    padding: 6px 8px;
    background: #ffffff;
    font-size: 8.2px;
    margin-bottom: 8px;
  }

  /* ═══ DATA TABLE ═══ */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #cbd5e1;
    border-top: none;
    margin-bottom: 8px;
  }
  .data-table th {
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
    font-size: 8px;
    text-transform: uppercase;
    border: 1px solid #cbd5e1;
    padding: 4.5px 6px;
    text-align: left;
  }
  .data-table td {
    border: 1px solid #e2e8f0;
    padding: 4px 6px;
    font-size: 8px;
    vertical-align: middle;
  }

  /* ═══ BADGES ═══ */
  .status-badge {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 3px;
    font-weight: 800;
    font-size: 8px;
    text-transform: uppercase;
  }
  .badge-pass {
    background: #dcfce7;
    color: #15803d;
    font-weight: 800;
    padding: 1.5px 5px;
    border-radius: 3px;
    font-size: 7.5px;
    display: inline-block;
    border: 1px solid #86efac;
    text-align: center;
  }
  .badge-fail {
    background: #fee2e2;
    color: #b91c1c;
    font-weight: 800;
    padding: 1.5px 5px;
    border-radius: 3px;
    font-size: 7.5px;
    display: inline-block;
    border: 1px solid #fca5a5;
    text-align: center;
  }
  .badge-observation {
    background: #fef3c7;
    color: #b45309;
    font-weight: 700;
    padding: 1.5px 5px;
    border-radius: 3px;
    font-size: 7.5px;
    display: inline-block;
    border: 1px solid #fcd34d;
    text-align: center;
  }
  .badge-na {
    background: #f1f5f9;
    color: #64748b;
    font-weight: 700;
    padding: 1.5px 5px;
    border-radius: 3px;
    font-size: 7.5px;
    display: inline-block;
    border: 1px solid #e2e8f0;
    text-align: center;
  }
  .badge-pending {
    background: #fef3c7;
    color: #b45309;
    font-weight: 700;
    padding: 1.5px 5px;
    border-radius: 3px;
    font-size: 7.5px;
    display: inline-block;
    border: 1px solid #fcd34d;
    text-align: center;
  }
  .badge-hold {
    background: #fee2e2;
    color: #991b1b;
    font-weight: 800;
    padding: 1px 4px;
    border-radius: 2px;
    font-size: 7px;
    text-transform: uppercase;
    border: 1px solid #fca5a5;
  }

  /* ═══ SIGNOFF TABLES ═══ */
  .signoff-table, .sig-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #cbd5e1;
    border-top: none;
    margin-bottom: 8px;
  }
  .signoff-table td, .sig-table td {
    border: 1px solid #cbd5e1;
    padding: 6px 8px;
    vertical-align: top;
    background: #fafafa;
  }
  .sig-role-header, .sig-title {
    font-size: 7.8px;
    font-weight: 800;
    color: #ea580c;
    text-transform: uppercase;
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    letter-spacing: 0.4px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 3px;
  }
  .sig-required-tag {
    font-size: 6.8px;
    color: #0d9488;
    font-weight: 800;
    background: #ccfbf1;
    padding: 1px 4px;
    border-radius: 2px;
    border: 0.5px solid #99f6e4;
  }
  .sig-line {
    margin-top: 14px;
    border-bottom: 1px dashed #94a3b8;
    height: 1px;
  }

  /* ═══ PHOTO GRID ═══ */
  .photo-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;
    padding: 6px;
    border: 1px solid #cbd5e1;
    border-top: none;
    margin-bottom: 8px;
    background: #fafafa;
  }
  .photo-card {
    width: 48.5%;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 5px;
    text-align: center;
    background: #f8fafc;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .photo-card img {
    max-width: 100%;
    max-height: 150px;
    object-fit: contain;
    border: 1px solid #e2e8f0;
    border-radius: 2px;
    background: #000;
  }
  .photo-caption {
    font-size: 7.5px;
    font-weight: 700;
    color: #0f172a;
    margin-top: 4px;
    text-transform: uppercase;
  }
  .photo-tag {
    font-size: 7px;
    font-weight: 800;
    color: #ea580c;
    text-transform: uppercase;
    margin-bottom: 3px;
    display: inline-block;
    padding: 1px 4px;
    border-radius: 2px;
    background: #fff7ed;
  }

  /* ═══ FOOTER ═══ */
  .doc-footer {
    width: 100%;
    border-top: 1px solid #cbd5e1;
    padding-top: 4px;
    margin-top: 6px;
    display: flex;
    justify-content: space-between;
    font-size: 7.5px;
    color: #64748b;
  }
`;

export function openPrintWindow(
  title: string,
  htmlBody: string,
  customCss: string = "",
): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to generate and print the quality document.");
    return;
  }

  const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${COMMON_CSS}
    ${customCss}
  </style>
</head>
<body>
  <div class="page-container">
    ${htmlBody}
  </div>
  <script>
    async function waitForImagesAndPrint() {
      try {
        const imgs = Array.from(document.images);
        if (imgs.length > 0) {
          const promises = imgs.map((img) => {
            if (img.complete && img.naturalHeight > 0) return Promise.resolve();
            return new Promise((resolve) => {
              img.addEventListener('load', resolve, { once: true });
              img.addEventListener('error', resolve, { once: true });
            });
          });
          await Promise.race([
            Promise.all(promises),
            new Promise((resolve) => setTimeout(resolve, 3000)),
          ]);
        }
      } catch (e) {
        console.warn("Image pre-load error:", e);
      }
      setTimeout(() => {
        window.focus();
        window.print();
      }, 400);
    }

    if (document.readyState === 'complete') {
      waitForImagesAndPrint();
    } else {
      window.addEventListener('load', waitForImagesAndPrint);
    }
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(fullHTML);
  printWindow.document.close();
}

const formatDate = (dateVal?: string | number | Date | null) => {
  if (!dateVal || dateVal === "—") return "—";
  const date = dateVal instanceof Date ? dateVal : new Date(dateVal);
  return isNaN(date.getTime())
    ? String(dateVal)
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

export { renderCompanyBrandCell };

export interface StakeholderSignoff {
  role: string;
  name?: string;
  designation?: string;
  required?: boolean;
  signed?: boolean;
  signedAt?: string;
}

export interface RequiredSignoffs {
  qaqcEngineer?: boolean;
  siteManager?: boolean;
  structuralConsultant?: boolean;
  mechanicalEngineer?: boolean;
  electricalEngineer?: boolean;
}

export type PtpItemStatus = "PASS" | "FAIL" | "N/A" | "REJECTED";

// =========================================================================
// 1. OFFICIAL PERMIT TO POUR (PTP) AUTHORIZATION
// =========================================================================
export function generatePermitToPourPrint(
  ptp: PermitToPour,
  project: Partial<Project> = {},
  company: Partial<Company> = {},
): void {
  const companyName = company.name;
  const projectName = project.name;
  const docRef =
    ptp.ptpNumber || `PTP-${Math.floor(1000 + Math.random() * 9000)}`;

  const checklistItems = (
    ptp.checklistItems?.length
      ? ptp.checklistItems
      : createDefaultPermitChecklist()
  ).map((item, index) => ({
    cat: item.category || "General",
    param: item.label,
    status:
      item.status ||
      (index === 0 && ptp.checklist?.rebarInspectionApproved ? "PASS" : "PASS"),
  }));

  const stakeholderRows = (ptp.stakeholders || []).filter((s) => s.required);

  const isRejected = ptp.status === "REJECTED";

  const buildStakeholderList = (): StakeholderSignoff[] => {
    // If PTP is rejected, restrict signatures ONLY to QA/QC Engineer
    if (isRejected) {
      return [
        { role: "QA/QC Engineer", name: ptp.issuedByName, required: true },
      ];
    }

    if (ptp.stakeholders && ptp.stakeholders.length > 0) {
      return ptp.stakeholders;
    }

    const reqs = ptp.requiredSignoffs;
    const list: StakeholderSignoff[] = [
      { role: "QA/QC Engineer", name: ptp.issuedByName, required: true },
    ];

    if (!reqs || reqs.siteManager !== false) {
      list.push({
        role: "Site / Construction Manager",
        name: "",
        required: true,
      });
    }
    if (!reqs || reqs.structuralConsultant !== false) {
      list.push({
        role: "Structural Consultant / Engineer",
        name: "",
        required: true,
      });
    }
    if (reqs?.mechanicalEngineer) {
      list.push({
        role: "Mechanical Engineer",
        name: "",
        required: false,
      });
    }
    if (reqs?.electricalEngineer) {
      list.push({
        role: "Electrical Engineer",
        name: "",
        required: false,
      });
    }

    return list;
  };

  const stakeholdersList = buildStakeholderList();

  type PtpItemStatus = "PASS" | "FAIL" | "N/A";

  const getStatusBadge = (status: PtpItemStatus) => {
    switch (status) {
      case "PASS":
        return `<span style="background: #dcfce7; color: #15803d; padding: 1px 4px; border-radius: 2px; font-weight: 800;">PASS</span>`;
      case "FAIL":
        return `<span style="background: #fee2e2; color: #b91c1c; padding: 1px 4px; border-radius: 2px; font-weight: 800;">FAIL</span>`;
      case "N/A":
      default:
        return `<span style="background: #f1f5f9; color: #64748b; padding: 1px 4px; border-radius: 2px; font-weight: 700;">N/A</span>`;
    }
  };

  const data = ptp;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${data.permitNumber} - Permit To Pour (PTP)</title>
      <style>
        * { box-sizing: border-box; }
        
        @page {
          size: A4 portrait;
          margin: 10mm 10mm 12mm 10mm;
          @bottom-left {
            content: "CONFIDENTIAL & PROPRIETARY — ${companyName}";
            font-family: 'Segoe UI', -apple-system, sans-serif;
            font-size: 7px;
            color: #64748b;
            font-weight: 600;
          }
          @bottom-right {
            content: "Page " counter(page) " of " counter(pages);
            font-family: 'Segoe UI', -apple-system, sans-serif;
            font-size: 7px;
            color: #64748b;
            font-weight: 700;
          }
        }

        body { 
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; 
          font-size: 9px; 
          color: #1e293b; 
          margin: 0; 
          line-height: 1.3; 
          background: #fff; 
        }

        .pdf-section {
          page-break-inside: avoid;
          break-inside: avoid;
          margin-bottom: 8px;
        }

        .doc-header { width: 100%; border: 1.5px solid #0f172a; border-collapse: collapse; margin-bottom: 8px; }
        .doc-header td { border: 1px solid #cbd5e1; padding: 5px; vertical-align: middle; }
        .header-brand { background: #f8fafc; text-align: center; }
        .header-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; text-align: center; }
        .header-sub { font-size: 9px; font-weight: 700; color: #ea580c; margin-top: 2px; text-transform: uppercase; text-align: center; }
        
        .meta-box { font-size: 8px; line-height: 1.4; color: #334155; }

        table.section-table { width: 100%; border-collapse: collapse; margin-bottom: 2px; border: 1px solid #cbd5e1; }
        table.section-table th, table.section-table td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; vertical-align: middle; }
        
        .lbl { background-color: #f1f5f9; font-weight: 700; font-size: 8px; color: #334155; text-transform: uppercase; }
        .val { font-size: 8.5px; color: #0f172a; }
        
        .section-title { 
          background: #0f172a; 
          color: #f8fafc; 
          font-weight: 700; 
          font-size: 8.5px; 
          padding: 3px 6px; 
          text-transform: uppercase; 
          letter-spacing: 0.5px;
          margin-bottom: 3px;
          border-left: 3px solid ${isRejected ? "#dc2626" : "#ea580c"};
        }

        .status-issued { color: #059669; font-weight: 800; }
        .status-rejected { color: #dc2626; font-weight: 800; }

        .rejection-notice {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          color: #991b1b;
          padding: 5px 8px;
          font-size: 8px;
          font-weight: 600;
          margin-bottom: 8px;
          border-radius: 2px;
        }

        .footer-fallback { display: none; }

        @media print {
          body { margin: 0; }
          .footer-fallback {
            display: flex;
            justify-content: space-between;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            font-size: 7px;
            color: #64748b;
            border-top: 1px solid #cbd5e1;
            padding-top: 2px;
            background: #fff;
          }
        }
      </style>
    </head>
    <body>

      <table class="doc-header">
        <tr>
          <td>
            ${renderCompanyBrandCell(company, project)}
          </td>
          <td style="width: 55%;">
            <div class="header-title">Official Permit To Pour (PTP) Authorization</div>
            <div class="header-sub">PROJECT: ${projectName}</div>
          </td>
          <td style="width: 25%;" class="meta-box">
            <strong>PTP Ref:</strong> <span style="color:#ea580c; font-weight:700;">${data.permitNumber}</span><br/>
            <strong>Scheduled Pour:</strong> ${formatDate(data.pourDate)} (${data.pourTime})<br/>
            <strong>Status:</strong> <span class="${isRejected ? "status-rejected" : "status-issued"}">${data.status || "ISSUED"}</span>
          </td>
        </tr>
      </table>

      ${
        isRejected
          ? `<div class="rejection-notice">
              <strong>POUR NOT PERMITTED:</strong> This Permit to Pour has been REJECTED due to failed hold point checks. Concrete casting is strictly prohibited. Corrective actions must be completed before re-inspection and re-issuance.
             </div>`
          : ""
      }

      <div class="pdf-section">
        <div class="section-title">1.0 Structural Element & Location Parameters</div>
        <table class="section-table">
          <tr>
            <td class="lbl" style="width: 18%;">Building / Block:</td>
            <td class="val" style="width: 32%;">${data.building || "Main Structure"}</td>
            <td class="lbl" style="width: 18%;">Level / Floor:</td>
            <td class="val" style="width: 32%;">${data.floor || "—"}</td>
          </tr>
          <tr>
            <td class="lbl">Structural Element:</td>
            <td class="val"><strong>${data.elementName} ${data.elementId ? `: ${data.elementId}` : ""}</strong></td>
            <td class="lbl">Grid Axis / Zone:</td>
            <td class="val">${data.elementRef || data.zone || "—"}</td>
          </tr>
        </table>
      </div>

      <div class="pdf-section">
        <div class="section-title">2.0 Concrete Mix Specifications & Batching Logistics</div>
        <table class="section-table">
          <tr>
            <td class="lbl" style="width: 18%;">Specified Grade:</td>
            <td class="val" style="width: 32%;"><strong>${data.concreteGrade}</strong></td>
            <td class="lbl" style="width: 18%;">Est. Volume:</td>
            <td class="val" style="width: 32%;"><strong>${data.estimatedVolume} m³</strong></td>
          </tr>
          <tr>
            <td class="lbl">Batching Plant:</td>
            <td class="val">${data.supplier || "Approved Ready-Mix Supplier"}</td>
            <td class="lbl">Inspected By:</td>
            <td class="val">${data.issuedByName} (QA/QC Engineer)</td>
          </tr>
        </table>
      </div>

      <div class="pdf-section">
        <div class="section-title">3.0 Mandatory Pre-Pour Inspection Checklist (Hold Point Clearance)</div>
        <table class="section-table">
          <thead>
            <tr>
              <th class="lbl" style="width: 5%; text-align: center;">S/N</th>
              <th class="lbl" style="width: 10%; text-align: center;">Status</th>
              <th class="lbl" style="width: 20%;">Discipline / Category</th>
              <th class="lbl" style="width: 65%;">Verification Parameter</th>
            </tr>
          </thead>
          <tbody>
            ${checklistItems
              .map(
                (item, idx) => `
              <tr>
                <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #64748b;">${idx + 1}</td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center;">
                  <span style="font-weight: 800; font-size: 8px; padding: 1px 4px; border-radius: 2px; ${
                    item.status === "PASS"
                      ? "background: #dcfce7; color: #15803d;"
                      : item.status === "FAIL"
                        ? "background: #fee2e2; color: #b91c1c;"
                        : "background: #f1f5f9; color: #64748b;"
                  }">${item.status}</span>
                </td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 700; color: #334155;">${item.cat}</td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 500; color: #0f172a;">${item.param}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div class="pdf-section">
        <div class="section-title">4.0 Statutory Authorizations & Stakeholder Sign-Off Block</div>
        <table class="section-table" style="margin-top: 4px;">
          ${stakeholdersList.reduce((acc, sh, index) => {
            if (index % 2 === 0) {
              const nextSh = stakeholdersList[index + 1];
              const cell1 = renderSignCell(sh);
              const cell2 = nextSh
                ? renderSignCell(nextSh)
                : `<td style="width: 50%; height: 75px; background: #fafafa; border: 1px dashed #cbd5e1;"></td>`;
              acc += `<tr>${cell1}${cell2}</tr>`;
            }
            return acc;
          }, "")}
        </table>
      </div>

      <div class="footer-fallback">
        <span>CONFIDENTIAL — ${companyName}</span>
        <span>PTP Ref: ${data.permitNumber}</span>
      </div>

      <script>
        window.onload = () => {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  function renderSignCell(sh: StakeholderSignoff) {
    const badgeColor = sh.required ? "#15803d" : "#64748b";
    const badgeText = sh.required ? "REQUIRED" : "OPTIONAL";
    const roleTitle = sh.designation
      ? `${sh.designation} <span style="font-size: 7px; color: #64748b; font-weight: normal;">(${sh.role})</span>`
      : sh.role;
    return `
      <td style="width: 50%; height: 75px; vertical-align: top; padding: 6px 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span style="font-weight: 700; font-size: 8px; text-transform: uppercase; color: #ea580c;">${roleTitle}</span>
          <span style="font-size: 6px; font-weight: 700; background: ${badgeColor}15; color: ${badgeColor}; padding: 1px 3px; border-radius: 2px;">${badgeText}</span>
        </div>
        <div style="font-size: 8px; margin-bottom: 8px;">Name: <strong>${sh.name || "__________________________________________________"}</strong></div>
        <div style="font-size: 8px; display: flex; justify-content: space-between;">
          <span>Sign: ________________________</span>
          <span>Date: ____ / ____ / 20__</span>
        </div>
      </td>
    `;
  }

  openPrintWindow(`${docRef} - Permit to Pour`, htmlContent);
}

export function generatePermitToPourPDF(
  ptp: PermitToPour,
  project: Partial<Project> = {},
  company: Partial<Company> = {},
): void {
  const companyName = company.name;
  const projectName = project.companyName;
  const docRef =
    ptp.ptpNumber || `PTP-${Math.floor(1000 + Math.random() * 9000)}`;

  const checklistItems = (
    ptp.checklistItems?.length
      ? ptp.checklistItems
      : createDefaultPermitChecklist()
  ).map((item, index) => ({
    cat: item.category || "General",
    param: item.label,
    status:
      item.status ||
      (index === 0 && ptp.checklist?.rebarInspectionApproved ? "PASS" : "PASS"),
  }));

  const isRejected = ptp.status === "REJECTED";

  const buildStakeholderList = (): StakeholderSignoff[] => {
    if (isRejected) {
      return [
        {
          role: "QA/QC Engineer",
          name: ptp.issuedByName || "J. Oladejo",
          required: true,
        },
      ];
    }

    if (ptp.stakeholders && ptp.stakeholders.length > 0) {
      return ptp.stakeholders.filter((s) => s.required);
    }

    const reqs = ptp.requiredSignoffs;
    const list: StakeholderSignoff[] = [
      { role: "QA/QC Engineer", name: ptp.issuedByName || "", required: true },
    ];

    if (!reqs || reqs.siteManager !== false) {
      list.push({
        role: "Site / Construction Manager",
        name: "",
        required: true,
      });
    }
    if (!reqs || reqs.structuralConsultant !== false) {
      list.push({
        role: "Structural Consultant / Engineer",
        name: "",
        required: true,
      });
    }
    if (reqs?.mechanicalEngineer) {
      list.push({
        role: "Mechanical Engineer",
        name: "",
        required: true,
      });
    }
    if (reqs?.electricalEngineer) {
      list.push({
        role: "Electrical Engineer",
        name: "",
        required: true,
      });
    }

    return list;
  };

  const stakeholdersList = buildStakeholderList();

  const getStatusBadge = (status: PtpItemStatus) => {
    switch (status) {
      case "PASS":
        return `<span style="background: #dcfce7; color: #15803d; padding: 1px 4px; border-radius: 2px; font-weight: 800;">PASS</span>`;
      case "FAIL":
        return `<span style="background: #fee2e2; color: #b91c1c; padding: 1px 4px; border-radius: 2px; font-weight: 800;">FAIL</span>`;
      case "REJECTED":
        return `<span style="background: #fee2e2; color: #b91c1c; padding: 1px 4px; border-radius: 2px; font-weight: 800;">FAIL</span>`;
      case "N/A":
      default:
        return `<span style="background: #f1f5f9; color: #64748b; padding: 1px 4px; border-radius: 2px; font-weight: 700;">N/A</span>`;
    }
  };

  const htmlContent = `
    <div id="pdf-document" style="padding: 20px; font-family: Arial, sans-serif; color: #0f172a; background: #fff;">
      <!-- Header -->
      <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #0f172a; margin-bottom: 12px; background: #ffffff;">
        <tr>
          <td style="width: 22%; border: 1px solid #cbd5e1; padding: 6px; text-align: center; vertical-align: middle; background: #ffffff;">
            ${renderCompanyBrandCell(company, project)}
          </td>
          <td style="width: 53%; border: 1px solid #cbd5e1; padding: 6px; text-align: center; vertical-align: middle;">
            <div style="font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; color: #0f172a;">PERMIT TO POUR (PTP) AUTHORIZATION</div>
            <div style="font-size: 9.5px; font-weight: 700; color: #ea580c; margin-top: 2px; text-transform: uppercase;">PROJECT: ${projectName}</div>
            <div style="font-size: 7.5px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-top: 1px;">ISO 9001:2015 Clause 8.6 Release of Products & Services</div>
          </td>
          <td style="width: 25%; border: 1px solid #cbd5e1; padding: 6px; font-size: 8px; line-height: 1.5; color: #334155; vertical-align: middle;">
            <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${docRef}</span></div>
            <div><strong>Date:</strong> ${formatDate(ptp.plannedPourDate)}</div>
            <div><strong>Status:</strong> <span style="display: inline-block; padding: 1px 6px; border-radius: 3px; font-weight: 800; font-size: 8px; text-transform: uppercase; ${isRejected ? "background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;" : "background: #dcfce7; color: #15803d; border: 1px solid #86efac;"}">${ptp.status || "APPROVED"}</span></div>
          </td>
        </tr>
      </table>

      <!-- 1.0 Pour Parameters -->
      <div style="margin-bottom: 15px;">
        <div style="background: #1e293b; color: #fff; padding: 4px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase;">1.0 Concrete Casting Parameters & Specifications</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px; border: 1px solid #cbd5e1; margin-top: 4px;">
          <tr>
            <td style="padding: 5px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700; width: 20%;">STRUCTURAL ELEMENT:</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0; width: 30%;"><strong>${ptp.elementName}</strong></td>
            <td style="padding: 5px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700; width: 20%;">CONCRETE GRADE:</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0; width: 30%;"><strong>${ptp.concreteGrade}</strong></td>
          </tr>
          <tr>
            <td style="padding: 5px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700;">LOCATION / LEVEL:</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0;">${ptp.levelName}</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700;">ESTIMATED VOLUME:</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0;">${ptp.targetVolumeM3} m³</td>
          </tr>
          <tr>
            <td style="padding: 5px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700;">GRID AXIS / ZONE:</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0;">${ptp.gridAxis || ptp.grid || "—"}</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700;">TARGET SLUMP:</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0;">${ptp.slumpTargetMm} mm</td>
          </tr>
          <tr>
            <td style="padding: 5px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700;">BATCHING PLANT / SUPPLIER:</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0;">${ptp.batchingPlant || ptp.supplierBatchPlant || "Approved Ready-Mix Plant"}</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700;">PLANNED POUR TIME:</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0;">${ptp.plannedPourTime || "08:00 AM"}</td>
          </tr>
        </table>
      </div>

      <!-- 2.0 Pre-Pour Verification Checklist -->
      <div style="margin-bottom: 15px;">
        <div style="background: #1e293b; color: #fff; padding: 4px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase;">2.0 Multi-Disciplinary Pre-Pour Verification Checklist</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px; border: 1px solid #cbd5e1; margin-top: 4px;">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 5px; border: 1px solid #cbd5e1; width: 6%; text-align: center;">#</th>
              <th style="padding: 5px; border: 1px solid #cbd5e1; width: 14%; text-align: center;">STATUS</th>
              <th style="padding: 5px; border: 1px solid #cbd5e1; width: 20%; text-align: left;">CATEGORY</th>
              <th style="padding: 5px; border: 1px solid #cbd5e1; width: 60%; text-align: left;">CHECKPOINT / VERIFICATION PARAMETER</th>
            </tr>
          </thead>
          <tbody>
            ${checklistItems
              .map(
                (item, idx) => `
              <tr>
                <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #64748b;">${idx + 1}</td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center;">
                  <span style="font-weight: 800; font-size: 8px; padding: 1px 4px; border-radius: 2px; ${
                    item.status === "PASS"
                      ? "background: #dcfce7; color: #15803d;"
                      : item.status === "FAIL"
                        ? "background: #fee2e2; color: #b91c1c;"
                        : "background: #f1f5f9; color: #64748b;"
                  }">${item.status}</span>
                </td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 700; color: #334155;">${item.cat}</td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 500; color: #0f172a;">${item.param}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <!-- 3.0 Statutory Sign-Off -->
      <div style="margin-bottom: 15px;">
        <div style="font-size: 11px; font-weight: 700; margin-bottom: 4px;">3.0 Statutory Authorizations & Stakeholder Sign-Off Block</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px; border: 1px solid #cbd5e1;">
          ${stakeholdersList.reduce((acc, sh, index) => {
            if (index % 2 === 0) {
              const nextSh = stakeholdersList[index + 1];
              const cell1 = renderSignCell(sh);
              const cell2 = nextSh
                ? renderSignCell(nextSh)
                : `<td style="width: 50%; height: 70px; background: #fafafa; border: 1px solid #e2e8f0;"></td>`;
              acc += `<tr>${cell1}${cell2}</tr>`;
            }
            return acc;
          }, "")}
        </table>
      </div>

      <!-- Footer -->
      <div style="font-size: 8px; color: #64748b; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 5px; margin-top: 10px;">
        <div>CONFIDENTIAL & PROPRIETARY — ${companyName}</div>
        <div>Doc Ref: ${docRef}</div>
      </div>
    </div>
  `;

  function renderSignCell(sh: StakeholderSignoff) {
    const badgeColor = sh.required ? "#15803d" : "#64748b";
    const badgeText = sh.required ? "REQUIRED" : "OPTIONAL";
    const roleTitle = sh.designation
      ? `${sh.designation} <span style="font-size: 7px; color: #64748b; font-weight: normal;">(${sh.role})</span>`
      : sh.role;
    return `
      <td style="width: 50%; height: 70px; vertical-align: top; padding: 6px 8px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span style="font-weight: 700; font-size: 8px; text-transform: uppercase; color: #ea580c;">${roleTitle}</span>
          <span style="font-size: 6px; font-weight: 700; background: ${badgeColor}15; color: ${badgeColor}; padding: 1px 3px; border-radius: 2px;">${badgeText}</span>
        </div>
        <div style="font-size: 8px; margin-bottom: 8px;">Name: <strong>${sh.name || "__________________________________________________"}</strong></div>
        <div style="font-size: 8px; display: flex; justify-content: space-between;">
          <span>Sign: ________________________</span>
          <span>Date: ____ / ____ / 20__</span>
        </div>
      </td>
    `;
  }

  // --- PDF GENERATION & DIRECT DOWNLOAD ---
  const element = document.createElement("div");
  element.innerHTML = htmlContent;
  document.body.appendChild(element);

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `${docRef}_PermitToPour.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  (html2pdf() as any)
    .set(opt)
    .from(element)
    .toPdf()
    .get("pdf")
    .then((pdf: any) => {
      // Stamp a real footer on every page (confidential note + page numbers)
      const total = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        pdf.setPage(i);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`CONFIDENTIAL & PROPRIETARY — ${companyName}`, 10, 291);
        pdf.text(
          `PTP Ref: ${ptp.permitNumber}  |  Page ${i} of ${total}`,
          200,
          291,
          { align: "right" },
        );
      }
      pdf.save(`${docRef}.pdf`);
    })
    .catch((err: unknown) => {
      console.error("PDF generation failed:", err);
    })
    .finally(() => {
      document.body.removeChild(element);
    });
}

// =========================================================================
// 2. FIELD INSPECTION (HOLD POINT) REPORT
// =========================================================================
export function generateInspectionRequestPDF(
  insp: InspectionRequest,
  project: Partial<Project> = {},
  company: Partial<Company> = {},
): void {
  const companyName = company.name || "Collection Developments LTD";
  const projectName = project.name || "Bankside";
  const docRef =
    insp.inspectionNumber ||
    `INSP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const items = insp.items || [];
  const passItems = items.filter((it) => it.result === "PASS").length;
  const failItems = items.filter((it) => it.result === "FAIL").length;
  const obsItems = items.filter((it) => it.result === "OBSERVATION").length;

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
      case "CLOSED":
        return { bg: "#dcfce7", text: "#15803d", border: "#86efac" };
      case "PENDING_REVIEW":
        return { bg: "#fef3c7", text: "#b45309", border: "#fcd34d" };
      case "REJECTED":
        return { bg: "#fee2e2", text: "#b91c1c", border: "#fca5a5" };
      default:
        return { bg: "#f1f5f9", text: "#334155", border: "#cbd5e1" };
    }
  };
  const sc = getStatusColor(insp.status);

  const inspectionStakeholders: StakeholderSignoff[] =
    insp.stakeholders && insp.stakeholders.length > 0
      ? insp.stakeholders.filter((s) => s.required !== false)
      : [
          {
            role: "QA/QC Inspector",
            name:
              insp.inspector?.name || insp.inspectorName || "QA/QC Inspector",
            designation: insp.inspector?.designation || "QA/QC Inspector",
            required: true,
            signed: !!(insp.status === "APPROVED" || insp.status === "CLOSED"),
            signedAt: insp.approvedAt
              ? new Date(insp.approvedAt).toISOString()
              : undefined,
          },
          {
            role: "Site / Construction Engineer",
            name: insp.subcontractorRepresentative || "Site Engineer",
            designation: "Site Engineer",
            required: true,
            signed: false,
          },
          {
            role: "Consultant / Resident Engineer",
            name: insp.consultantRepresentative || "Resident Engineer",
            designation: "Consultant",
            required: true,
            signed: false,
          },
        ];

  const html = `
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${renderCompanyBrandCell(company, project)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">FIELD INSPECTION & VERIFICATION REPORT</div>
          <div class="header-title-project">PROJECT: ${projectName}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.6 Monitoring & Measurement of Processes</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${docRef}</span></div>
          <div><strong>Date:</strong> ${formatDate(insp.scheduledDate || insp.createdAt)}</div>
          <div><strong>Status:</strong> <span class="status-badge" style="background:${sc.bg}; color:${sc.text}; border:1px solid ${sc.border};">${insp.status || "DRAFT"}</span></div>
        </td>
      </tr>
    </table>

    <!-- 1.0 Inspection Parameters -->
    <div class="pdf-section">
      <div class="section-banner">1.0 INSPECTION PROTOCOL PARAMETERS & LOCATION</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 20%;">STRUCTURAL ELEMENT:</td>
          <td class="grid-value" style="width: 30%;"><strong>${insp.elementName || insp.element || "Structural Member"}</strong></td>
          <td class="grid-label" style="width: 20%;">STAGE / DISCIPLINE:</td>
          <td class="grid-value" style="width: 30%;"><strong>${insp.stage}</strong> (${insp.trade || "Structural"})</td>
        </tr>
        <tr>
          <td class="grid-label">LOCATION / LEVEL:</td>
          <td class="grid-value">${insp.levelName || insp.floor || "All Levels"}</td>
          <td class="grid-label">QUALITY SCORE:</td>
          <td class="grid-value" style="font-weight: 800; color: ${insp.qualityScore && insp.qualityScore >= 90 ? "#15803d" : "#ea580c"};">${insp.qualityScore || 100}% (Pass Target: ${insp.passScore || 100}%)</td>
        </tr>
        <tr>
          <td class="grid-label">GRID AXIS / ZONE:</td>
          <td class="grid-value">${insp.zone || "—"}</td>
          <td class="grid-label">EXECUTING CONTRACTOR:</td>
          <td class="grid-value">${insp.contractor || "Main Contractor"}</td>
        </tr>
        <tr>
          <td class="grid-label">TEMPLATE ALIGNMENT:</td>
          <td class="grid-value">${insp.templateName}</td>
          <td class="grid-label">QA/QC INSPECTOR:</td>
          <td class="grid-value"><strong>${insp.inspector?.name || insp.inspectorName || "QA/QC Inspector"}</strong></td>
        </tr>
      </table>
    </div>

    <!-- 2.0 Hold Point Verification Checklist -->
    <div class="pdf-section">
      <div class="section-banner">2.0 TECHNICAL VERIFICATION CHECKPOINTS (${items.length} ITEMS | ${passItems} PASS, ${failItems} FAIL, ${obsItems} OBS)</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 5%; text-align: center;">#</th>
            <th style="width: 12%; text-align: center;">RESULT</th>
            <th style="width: 16%;">CATEGORY</th>
            <th style="width: 47%;">CHECKPOINT PARAMETER & CRITERIA</th>
            <th style="width: 20%;">ENGINEERING REMARKS</th>
          </tr>
        </thead>
        <tbody>
          ${
            items.length > 0
              ? items
                  .map(
                    (item, idx) => `
            <tr>
              <td style="text-align: center; font-weight: 700; color: #64748b;">${idx + 1}</td>
              <td style="text-align: center;">
                <span class="${item.result === "PASS" ? "badge-pass" : item.result === "FAIL" ? "badge-fail" : item.result === "OBSERVATION" ? "badge-observation" : "badge-na"}">${item.result || "PENDING"}</span>
              </td>
              <td style="font-weight: 700; color: #334155;">
                ${item.category || item.discipline || "Structural"}
                ${item.critical ? `<br/><span class="badge-fail" style="font-size:6.5px; padding:0 3px;">CRITICAL</span>` : ""}
                ${item.isHoldPoint ? `<br/><span class="badge-hold" style="font-size:6.5px; padding:0 3px;">HOLD POINT</span>` : ""}
              </td>
              <td>
                <div style="font-weight: 600; color: #0f172a;">${item.label}</div>
                ${item.acceptanceCriteria ? `<div style="font-size: 7px; color: #64748b; margin-top: 1px; italic">Criteria: ${item.acceptanceCriteria}</div>` : ""}
              </td>
              <td style="font-size: 7.2px; color: #475569;">${item.remarks || "—"}</td>
            </tr>
          `,
                  )
                  .join("")
              : `
            <tr>
              <td colspan="5" style="text-align: center; color: #64748b; padding: 10px;">No checklist parameters logged.</td>
            </tr>
          `
          }
        </tbody>
      </table>
    </div>

    <!-- 3.0 Photographic Records if any -->
    ${
      items.some((it) => it.photos && it.photos.length > 0)
        ? `
    <div class="pdf-section">
      <div class="section-banner">3.0 PHOTOGRAPHIC VERIFICATION RECORDS</div>
      <div class="photo-grid">
        ${items
          .flatMap((it) =>
            (it.photos || []).map((url) => ({ url, label: it.label })),
          )
          .map(
            (p, pIdx) => `
          <div class="photo-card">
            <span class="photo-tag">Photo #${pIdx + 1}</span>
            <div><img src="${p.url}" alt="Inspection Evidence" /></div>
            <div class="photo-caption">${p.label}</div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
    `
        : ""
    }

    <!-- 4.0 Statutory Sign-Off -->
    <div class="pdf-section">
      <div class="section-banner">4.0 STATUTORY WITNESS & VERIFICATION SIGN-OFF</div>
      <table class="signoff-table">
        ${(() => {
          let rowsHtml = "";
          const chunkSize = 3;
          for (let i = 0; i < inspectionStakeholders.length; i += chunkSize) {
            const chunk = inspectionStakeholders.slice(i, i + chunkSize);
            const cellWidth = (100 / Math.max(chunk.length, 1)).toFixed(2);
            rowsHtml += `<tr>${chunk
              .map(
                (sh) => `
              <td style="width: ${cellWidth}%; vertical-align: top; padding: 6px 8px; border: 1px solid #cbd5e1; background: ${sh.signed ? "#f0fdf4" : "#fafafa"};">
                <div class="sig-role-header">
                  <span>${sh.designation ? `${sh.designation} (${sh.role})` : sh.role}</span>
                  <span class="sig-required-tag" style="font-size: 6.5px; font-weight: 700; background: ${sh.required ? "#dcfce7" : "#f1f5f9"}; color: ${sh.required ? "#15803d" : "#64748b"}; padding: 1px 4px; border-radius: 2px;">
                    ${sh.required ? "REQUIRED" : "OPTIONAL"}
                  </span>
                </div>
                <div style="font-size: 8px; color: #334155; margin-bottom: 4px;">
                  Name: <strong>${sh.name || "________________________"}</strong>
                </div>
                <div class="sig-line" style="border-bottom: 1px dashed #cbd5e1; margin: 4px 0;"></div>
                <div style="display: flex; justify-content: space-between; font-size: 7.2px; color: #64748b; margin-top: 3px;">
                  <span>${sh.signed ? `<strong style="color: #15803d;">✓ Digitally Signed</strong>` : "Sign: ___________________"}</span>
                  <span>Date: ${sh.signed && sh.signedAt ? formatDate(sh.signedAt) : sh.signed ? formatDate(insp.scheduledDate || insp.createdAt) : "____/____/20__"}</span>
                </div>
              </td>
            `,
              )
              .join("")}</tr>`;
          }
          return rowsHtml;
        })()}
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${companyName}</div>
      <div>Inspection Ref: ${docRef}</div>
    </div>
  `;

  openPrintWindow(`${docRef} - Inspection Report`, html);
}

export const generateInspectionPDF = generateInspectionRequestPDF;

// Helper to format multi-line observation conditions and directives
function formatObservationItemsHtml(
  rawText: string,
  options: {
    title: string;
    titleColor: string;
    bulletColor?: string;
    textColor?: string;
  }
): string {
  if (!rawText || !rawText.trim()) {
    return `
      <div style="font-size: 7.5px; color: #64748b; margin-bottom: 3.5px;">
        <strong style="color: ${options.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 1.5px;">${options.title}:</strong>
        <span style="font-style: italic;">—</span>
      </div>
    `;
  }

  // Normalize HTML line breaks and split by newline
  const normalized = rawText.replace(/<br\s*\/?>/gi, "\n");
  const lines = normalized
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return `
      <div style="font-size: 7.5px; color: #64748b; margin-bottom: 3.5px;">
        <strong style="color: ${options.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 1.5px;">${options.title}:</strong>
        <span style="font-style: italic;">—</span>
      </div>
    `;
  }

  // Single line: Render cleanly with white-space pre-line so any soft wraps are preserved
  if (lines.length === 1) {
    return `
      <div style="font-size: 7.5px; color: ${options.textColor || "#0f172a"}; margin-bottom: 3.5px;">
        <strong style="color: ${options.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 1.5px;">${options.title}:</strong>
        <div style="white-space: pre-line; line-height: 1.45;">${lines[0]}</div>
      </div>
    `;
  }

  // Multiple lines (e.g. Issue 1, Issue 2 or Directive 1, Directive 2 entered with Enter key)
  // Check if lines already have manual numbering or bullets (e.g. "1.", "a)", "•", "-")
  const alreadyNumbered = lines.every((l) =>
    /^(\d+[\.\)]|[a-zA-Z][\.\)]|[-•*])\s*/.test(l)
  );

  const itemsHtml = lines
    .map((line, idx) => {
      const prefix = alreadyNumbered
        ? ""
        : `<span style="font-weight: 700; color: ${options.bulletColor || options.titleColor}; margin-right: 4px; min-width: 13px; display: inline-block;">${idx + 1}.</span>`;
      return `
        <div style="display: flex; align-items: flex-start; line-height: 1.4; margin-bottom: 2.5px;">
          ${prefix}
          <span style="flex: 1; white-space: pre-line;">${line}</span>
        </div>
      `;
    })
    .join("");

  return `
    <div style="font-size: 7.5px; color: ${options.textColor || "#0f172a"}; margin-bottom: 4px;">
      <strong style="color: ${options.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 2px;">${options.title}:</strong>
      <div style="padding-left: 1px;">
        ${itemsHtml}
      </div>
    </div>
  `;
}

// =========================================================================
// 3. SITE COMMENTS / QUALITY OBSERVATION REPORT
// =========================================================================
export function generateSiteCommentsPDF(
  report: SiteCommentReport,
  project: Partial<Project> = {},
  company: Partial<Company> = {},
): void {
  const storeProject = useProjectStore?.getState?.()?.activeProject;
  const storeProjects = useProjectStore?.getState?.()?.projects || [];
  const matchedProject = storeProjects.find(
    (p) => p.id === (report.projectId || (report as any).project)
  );

  const companyName =
    company?.name || report.companyName || "Collection Developments LTD";
  const projectName =
    project?.name ||
    report.projectName ||
    (report as any).projectTitle ||
    matchedProject?.name ||
    storeProject?.name ||
    "Site Construction Operations";
  const docRef =
    report.reportNumber || `QC-COMM-${Math.floor(1000 + Math.random() * 9000)}`;

  const observations = report.observations || [];
  const openObs = observations.filter(
    (o) =>
      o.status !== "CLOSED" &&
      o.status !== "Compliant" &&
      o.status !== "RECTIFIED",
  ).length;

  const html = `
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${renderCompanyBrandCell(company, project)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">SITE COMMENTS & FIELD OBSERVATIONS REPORT</div>
          <div class="header-title-project">PROJECT: ${projectName}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.5 & 8.7 Nonconformity Identification</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${docRef}</span></div>
          <div><strong>Date:</strong> ${formatDate(report.inspectionDate || report.createdAt)}</div>
          <div><strong>Status:</strong> <span class="${openObs === 0 ? "badge-pass" : "badge-pending"}">${openObs === 0 ? "ALL CLOSED" : `${openObs} ACTION(S) PENDING`}</span></div>
        </td>
      </tr>
    </table>

    <!-- 1.0 Report Overview -->
    <div class="pdf-section">
      <div class="section-banner">1.0 GENERAL REPORT PARAMETERS & AUDIT CONTEXT</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 18%;">Project Name:</td>
          <td class="grid-value" style="width: 32%;">${projectName}</td>
          <td class="grid-label" style="width: 18%;">Inspection Date:</td>
          <td class="grid-value" style="width: 32%;">${formatDate(report.inspectionDate)}</td>
        </tr>
        <tr>
          <td class="grid-label">RAISED BY:</td>
          <td class="grid-value">${report.raisedByName || "All Site Levels / Structural Zones"}</td>
          <td class="grid-label">WEATHER / ENVIRONMENT:</td>
          <td class="grid-value">${report.weatherConditions || "Clear / Dry"}</td>
        </tr>
      </table>
    </div>

    <!-- 2.0 Observations Log -->
    <div class="pdf-section">
      <div class="section-banner">2.0 QUALITY OBSERVATIONS & CORRECTIVE DIRECTIVES (${observations.length} OBSERVATIONS)</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 5%; text-align: center;">#</th>
            <th style="width: 22%;">LOCATION & TRADE</th>
            <th style="width: 58%;">OBSERVED CONDITION, DIRECTIVE & ACTION</th>
            <th style="width: 15%; text-align: center;">SEVERITY / STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${
            observations.length > 0
              ? observations
                  .map((obs, idx) => {
                    const text =
                      obs.comments ||
                      obs.observationText ||
                      obs.fieldObservation ||
                      "—";
                    const directive =
                      obs.correctiveDirective ||
                      "Rectify per approved engineering specifications.";
                    const isClosed =
                      obs.status === "CLOSED" ||
                      obs.status === "Compliant" ||
                      obs.status === "RECTIFIED";
                    return `
            <tr>
              <td style="text-align: center; font-weight: 700; color: #64748b;">${idx + 1}</td>
              <td>
                <div style="font-weight: 700; color: #0f172a;">${obs.levelName || "Site Area"}</div>
                ${obs.structuralElement ? `<div style="font-size: 7.2px; font-weight: 600; color: #ea580c;">${obs.structuralElement}</div>` : ""}
                ${obs.gridLocation ? `<div style="font-size: 7px; color: #64748b;">Grid: ${obs.gridLocation}</div>` : ""}
                <div style="font-size: 7px; color: #475569; margin-top: 2px;"><strong>Trade:</strong> ${obs.tradeName || obs.trade || "Civil"}</div>
              </td>
              <td>
                ${formatObservationItemsHtml(text, {
                  title: "Observed Condition",
                  titleColor: "#991b1b",
                  bulletColor: "#991b1b",
                  textColor: "#0f172a",
                })}
                ${formatObservationItemsHtml(directive, {
                  title: "Corrective Directive",
                  titleColor: "#15803d",
                  bulletColor: "#15803d",
                  textColor: "#166534",
                })}
                <div style="font-size: 7px; color: #64748b; margin-top: 2px;">
                  Assigned To: <strong>${obs.assignedTo || obs.assignedSubcontractor || "Contractor"}</strong>
                  ${obs.dueDate ? ` | Target Due: ${formatDate(obs.dueDate)}` : ""}
                </div>

                ${
                  obs.photos && obs.photos.length > 0
                    ? `
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; padding-top: 3px; border-top: 1px dashed #cbd5e1;">
                  ${obs.photos
                    .map((p: any, pIdx: number) => {
                      const url =
                        typeof p === "string" ? p : p?.url || p?.thumbnailUrl;
                      if (!url) return "";
                      return `<img src="${url}" style="height: 50px; max-width: 80px; object-fit: cover; border-radius: 2px; border: 1px solid #cbd5e1;" alt="Photo ${pIdx + 1}" />`;
                    })
                    .join("")}
                </div>
                `
                    : ""
                }
              </td>
              <td style="text-align: center;">
                <span class="${isClosed ? "badge-pass" : "badge-pending"}">${obs.status || "OPEN"}</span>
                <div style="margin-top: 2px;">
                  <span class="${obs.severity === "CRITICAL" ? "badge-fail" : obs.severity === "HIGH" ? "badge-pending" : "badge-pass"}" style="font-size: 6.5px;">${obs.severity || "MEDIUM"}</span>
                </div>
              </td>
            </tr>
          `;
                  })
                  .join("")
              : `
            <tr>
              <td colspan="4" style="text-align: center; color: #64748b; padding: 10px;">No observations logged in this report.</td>
            </tr>
          `
          }
        </tbody>
      </table>
    </div>

    <!-- 3.0 Sign-Off -->
    <div class="pdf-section">
      <div class="section-banner">3.0 STATUTORY VERIFICATION & SIGN-OFF</div>
      <table class="signoff-table">
        <tr>
          <td style="width: 50%;">
            <div class="sig-role-header"><span>INSPECTED BY (QA/QC LEAD)</span><span class="sig-required-tag">REQUIRED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${report.raisedByName || "QA/QC Engineer"}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ______________________________________</span>
              <span>Date: ${formatDate(report.inspectionDate || report.createdAt)}</span>
            </div>
          </td>
          <td style="width: 50%;">
            <div class="sig-role-header"><span>ACKNOWLEDGED BY (SITE ENGINEER/ CONSTRUCTION MANAGER)</span><span class="sig-required-tag">REQUIRED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>______________________________________</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ______________________________________</span>
              <span>Date: ____ / ____ / 20___</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${companyName}</div>
      <div>Report Ref: ${docRef}</div>
    </div>
  `;

  openPrintWindow(`${docRef} - Site Comments`, html);
}

// =========================================================================
// 4. REQUEST FOR INFORMATION (RFI)
// =========================================================================
export function generateRFIPDF(
  rfi: RequestForInformation,
  project: Partial<Project> = {},
  company: Partial<Company> = {},
): void {
  const companyName = company.name || "Collection Developments LTD";
  const projectName = project.name || "Bankside";
  const docRef =
    rfi.rfiNumber || `RFI-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const html = `
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${renderCompanyBrandCell(company, project)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">REQUEST FOR INFORMATION (RFI)</div>
          <div class="header-title-project">PROJECT: ${projectName}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.2 Design & Engineering Communications</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${docRef}</span></div>
          <div><strong>Date Raised:</strong> ${formatDate(rfi.createdAt)}</div>
          <div><strong>Status:</strong> <span class="${rfi.status === "CLOSED" ? "badge-pass" : "badge-pending"}">${rfi.status || "SUBMITTED"}</span></div>
        </td>
      </tr>
    </table>

    <!-- 1.0 Parameters -->
    <div class="pdf-section">
      <div class="section-banner">1.0 TECHNICAL PARAMETERS & ENGINEERING CONTEXT</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 20%;">DISCIPLINE / TRADE:</td>
          <td class="grid-value" style="width: 30%;"><strong>${rfi.discipline || rfi.tradeName || "Structural Engineering"}</strong></td>
          <td class="grid-label" style="width: 20%;">PRIORITY:</td>
          <td class="grid-value" style="width: 30%;"><strong>${rfi.priority || "MEDIUM"}</strong></td>
        </tr>
        <tr>
          <td class="grid-label">DRAWING REFERENCE:</td>
          <td class="grid-value">${rfi.drawingReference || "—"}</td>
          <td class="grid-label">SPECIFICATION REF:</td>
          <td class="grid-value">${rfi.specReference || "—"}</td>
        </tr>
        <tr>
          <td class="grid-label">SCHEDULE IMPACT:</td>
          <td class="grid-value">${rfi.scheduleImpact ? `YES (${rfi.scheduleDelayDays || 0} Days)` : "NO IMPACT"}</td>
          <td class="grid-label">COST IMPACT:</td>
          <td class="grid-value">${rfi.costImpact ? `YES (${rfi.costImpactEstimate ? "£" + rfi.costImpactEstimate : "TBD"})` : "NO IMPACT"}</td>
        </tr>
        <tr>
          <td class="grid-label">RAISED BY:</td>
          <td class="grid-value">${rfi.raisedBy?.name || "Site Engineer"} (${rfi.raisedBy?.role || "Main Contractor"})</td>
          <td class="grid-label">ASSIGNED CONSULTANT:</td>
          <td class="grid-value"><strong>${rfi.assignedConsultant || "Lead Engineering Consultant"}</strong></td>
        </tr>
      </table>
    </div>

    <!-- 2.0 Question / Technical Clarification -->
    <div class="pdf-section">
      <div class="section-banner">2.0 TECHNICAL INQUIRY & CLARIFICATION SOUGHT</div>
      <div class="box-content">
        <div style="font-size: 9px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">Subject: ${rfi.title}</div>
        <div style="line-height: 1.45; color: #334155;">${rfi.question}</div>
      </div>
    </div>

    <!-- 3.0 Contractor's Proposed Solution -->
    <div class="pdf-section">
      <div class="section-banner">3.0 CONTRACTOR'S PROPOSED SOLUTION / ALTERNATIVE</div>
      <div class="box-content">
        <div style="line-height: 1.45; color: #334155;">${rfi.proposedSolution || "Awaiting consultant directive and technical instructions."}</div>
      </div>
    </div>

    <!-- 4.0 Consultant Response -->
    <div class="pdf-section">
      <div class="section-banner">4.0 CONSULTANT FORMAL RESPONSE & DIRECTIVE [${rfi.response?.approvalStatus || "UNDER REVIEW"}]</div>
      <div class="box-content">
        <div style="line-height: 1.45; color: #0f172a; margin-bottom: 6px;">
          ${rfi.response?.responseText || "Official response is currently being finalized by the engineering design consultant."}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #475569; border-top: 1px solid #f1f5f9; padding-top: 4px;">
          <span>Reviewed By: <strong>${rfi.response?.responderName || rfi.assignedConsultant || "Consultant"}</strong></span>
          <span>Response Date: <strong>${formatDate(rfi.response?.responseDate)}</strong></span>
        </div>
      </div>
    </div>

    <!-- 5.0 Sign-off -->
    <div class="pdf-section">
      <div class="section-banner">5.0 STATUTORY SIGN-OFF & AUTHORIZATIONS</div>
      <table class="signoff-table">
        <tr>
          <td style="width: 50%;">
            <div class="sig-role-header"><span>CONTRACTOR REPRESENTATIVE</span><span class="sig-required-tag">REQUIRED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${rfi.raisedBy?.name || "Lead Engineer"}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${formatDate(rfi.createdAt)}</span>
            </div>
          </td>
          <td style="width: 50%;">
            <div class="sig-role-header"><span>CONSULTANT / LEAD ENGINEER</span><span class="sig-required-tag">REQUIRED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${rfi.assignedConsultant || "Lead Consultant"}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${formatDate(rfi.response?.responseDate)}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${companyName}</div>
      <div>RFI Ref: ${docRef}</div>
    </div>
  `;

  openPrintWindow(`${docRef} - Technical RFI`, html);
}

// =========================================================================
// 5. MATERIAL APPROVAL REQUEST (MAR)
// =========================================================================
export function generateMARPDF(
  mar: MaterialApprovalRequest,
  project: Partial<Project> = {},
  company: Partial<Company> = {},
): void {
  const companyName = company.name || "Collection Developments LTD";
  const projectName = project.name || "Bankside";
  const docRef =
    mar.marNumber || `MAR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const submitterName =
    mar.submittedByName ||
    (typeof mar.submittedBy === "string"
      ? mar.submittedBy
      : "QA/QC Materials Lead");
  const reviewerName =
    mar.reviewedBy?.name ||
    mar.response?.respondedByName ||
    mar.assignedConsultantName ||
    "Materials Consultant";
  const reviewDate =
    mar.reviewedBy?.date ||
    mar.response?.responseDate ||
    (mar.updatedAt ? formatDate(mar.updatedAt) : formatDate(mar.createdAt));

  const html = `
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${renderCompanyBrandCell(company, project)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">MATERIAL APPROVAL REQUEST (MAR)</div>
          <div class="header-title-project">PROJECT: ${projectName}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.4 Control of Externally Provided Products & Services</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${docRef}</span></div>
          <div><strong>Date:</strong> ${formatDate(mar.createdAt)}</div>
          <div><strong>Status:</strong> <span class="${mar.status === "APPROVED" ? "badge-pass" : mar.status === "REJECTED" ? "badge-fail" : "badge-pending"}">${mar.status || "SUBMITTED"}</span></div>
        </td>
      </tr>
    </table>

    <!-- 1.0 Parameters -->
    <div class="pdf-section">
      <div class="section-banner">1.0 MATERIAL SPECIFICATION & SUPPLIER DETAILS</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 20%;">MATERIAL DESCRIPTION:</td>
          <td class="grid-value" style="width: 30%;"><strong>${mar.technicalDescription || mar.title}</strong></td>
          <td class="grid-label" style="width: 20%;">DISCIPLINE / TRADE:</td>
          <td class="grid-value" style="width: 30%;"><strong>${mar.tradeName || mar.trade || "Structural / Civil"}</strong></td>
        </tr>
        <tr>
          <td class="grid-label">MANUFACTURER / SUPPLIER:</td>
          <td class="grid-value">${mar.manufacturer || mar.supplierVendor || "Approved Vendor"}</td>
          <td class="grid-label">SUPPLIER / VENDOR:</td>
          <td class="grid-value">${mar.supplierVendor || "Project Approved Source"}</td>
        </tr>
        <tr>
          <td class="grid-label">DRAWING / SPEC SECTION:</td>
          <td class="grid-value">${mar.specSection || mar.specificationRef || mar.drawingNumber || "Per Approved Submittal"}</td>
          <td class="grid-label">SAMPLE SUBMITTED:</td>
          <td class="grid-value"><strong>${mar.sampleSubmitted ? `YES (${mar.sampleDetails || "Physical Sample Provided"})` : "NO (Technical Literature Only)"}</strong></td>
        </tr>
        <tr>
          <td class="grid-label">SUBMITTED BY:</td>
          <td class="grid-value">${submitterName}</td>
          <td class="grid-label">CONSULTANT REVIEWER:</td>
          <td class="grid-value"><strong>${reviewerName}</strong></td>
        </tr>
      </table>
    </div>

    <!-- 2.0 Submittal Data -->
    <div class="pdf-section">
      <div class="section-banner">2.0 COMPLIANCE STATEMENT & DOCUMENTATION ATTACHED</div>
      <div class="box-content">
        <div style="line-height: 1.45; color: #0f172a; margin-bottom: 4px;">
          ${mar.description || mar.technicalDescription || "Material compliance documentation, technical mill test certificates, and samples provided for formal consultant review."}
        </div>
      </div>
    </div>

    <!-- 3.0 Consultant Directive -->
    <div class="pdf-section">
      <div class="section-banner">3.0 CONSULTANT EVALUATION & DISPOSITION</div>
      <div class="box-content">
        <div style="line-height: 1.45; color: #0f172a; margin-bottom: 6px;">
          ${mar.reviewComments || mar.response?.responseText || "Submittal is in accordance with project specifications."}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #475569; border-top: 1px solid #f1f5f9; padding-top: 4px;">
          <span>Review Status: <strong>${mar.status || "APPROVED"}</strong></span>
          <span>Review Date: <strong>${reviewDate}</strong></span>
        </div>
      </div>
    </div>

    <!-- 4.0 Sign-off -->
    <div class="pdf-section">
      <div class="section-banner">4.0 STATUTORY MATERIAL AUTHORIZATION SIGN-OFF</div>
      <table class="signoff-table">
        <tr>
          <td style="width: 50%;">
            <div class="sig-role-header"><span>CONTRACTOR QA/QC LEAD</span><span class="sig-required-tag">REQUIRED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${submitterName}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${formatDate(mar.createdAt)}</span>
            </div>
          </td>
          <td style="width: 50%;">
            <div class="sig-role-header"><span>CONSULTANT / MATERIALS ENGINEER</span><span class="sig-required-tag">REQUIRED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${reviewerName}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${reviewDate}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${companyName}</div>
      <div>MAR Ref: ${docRef}</div>
    </div>
  `;

  openPrintWindow(`${docRef} - Material Approval Request`, html);
}

// =========================================================================
// 6. CONCRETE CUBE TEST CERTIFICATE (BS EN 12390 / ASTM C39)
// =========================================================================
export function generateCubeTestPDF(
  cube: ConcreteCubeSample,
  project: Partial<Project> = {},
  company: Partial<Company> = {},
): void {
  const companyName = company.name || " ";
  const projectName = project.name || " ";
  const docRef =
    cube.sampleNumber ||
    cube.sampleId ||
    `CUBE-${Math.floor(1000 + Math.random() * 9000)}`;

  const target28d =
    cube.target28DayStrengthNmm2 ||
    cube.day28Required ||
    (cube.targetStrength ? parseFloat(cube.targetStrength) : 0) ||
    30;

  // Extract all age test results
  type AgeResultItem = {
    age: number;
    title: string;
    testDate: string;
    targetStrength: number;
    averageStrength: number;
    maximumStrength?: number;
    minimumStrength?: number;
    standardDeviation?: number;
    status: string;
    technician: string;
    testingStandard: string;
    cubes: Array<{
      id: number;
      load: string | number;
      strength: string | number;
      failureMode?: string;
      cubeWeight?: string | number;
    }>;
  };

  const resultsList: AgeResultItem[] = [];

  const ageDefs: Array<{
    age: number;
    title: string;
    resArray?: any[];
    testSummary?: any;
    req?: number;
    defaultTargetRatio: number;
    dateField?: string | null;
  }> = [
    {
      age: 1,
      title: "1-Day Test",
      resArray: cube.day1Results,
      testSummary: cube.tests?.day1,
      req: cube.day1Required,
      defaultTargetRatio: 0.2,
      dateField: cube.day1Date,
    },
    {
      age: 3,
      title: "3-Day Test",
      resArray: cube.day3Results,
      testSummary: cube.tests?.day3,
      req: cube.day3Required,
      defaultTargetRatio: 0.45,
      dateField: cube.day3Date,
    },
    {
      age: 7,
      title: "7-Day Test",
      resArray: cube.day7Results,
      testSummary: cube.tests?.day7,
      req: cube.day7Required,
      defaultTargetRatio: 0.7,
      dateField: cube.day7Date,
    },
    {
      age: 14,
      title: "14-Day Test",
      resArray: cube.day14Results,
      testSummary: cube.tests?.day14,
      req: cube.day14Required,
      defaultTargetRatio: 0.85,
      dateField: cube.day14Date,
    },
    {
      age: 28,
      title: "28-Day Test",
      resArray: cube.day28Results,
      testSummary: cube.tests?.day28,
      req: cube.day28Required,
      defaultTargetRatio: 1.0,
      dateField: cube.day28Date,
    },
  ];

  for (const def of ageDefs) {
    const target =
      def.req || Math.round(target28d * def.defaultTargetRatio * 10) / 10;
    if (def.resArray && def.resArray.length > 0) {
      const entry = def.resArray[0];
      resultsList.push({
        age: def.age,
        title: def.title,
        testDate: entry.testDate || def.dateField || cube.castDate,
        targetStrength: target,
        averageStrength: entry.averageStrength || 0,
        maximumStrength: entry.maximumStrength,
        minimumStrength: entry.minimumStrength,
        standardDeviation: entry.standardDeviation,
        status:
          entry.status || (entry.averageStrength >= target ? "PASS" : "FAIL"),
        technician:
          entry.technician || cube.preparedBy || "Materials Technician",
        testingStandard: entry.testingStandard || "BS EN 12390-3",
        cubes: entry.cubes || [],
      });
    } else if (def.testSummary) {
      const t = def.testSummary;
      const avg = t.averageStrengthNmm2 ?? t.compressiveStrengthNmm2 ?? 0;
      resultsList.push({
        age: def.age,
        title: def.title,
        testDate:
          t.actualTestDate ||
          t.testDate ||
          t.scheduledDate ||
          def.dateField ||
          cube.castDate,
        targetStrength:
          t.requiredStrengthNmm2 || t.targetStrengthNmm2 || target,
        averageStrength: avg,
        maximumStrength: avg,
        minimumStrength: avg,
        standardDeviation: 0,
        status: t.compliance || (avg >= target ? "PASS" : "FAIL"),
        technician:
          t.testedBy ||
          t.labTechnician ||
          cube.preparedBy ||
          "Materials Technician",
        testingStandard: "BS EN 12390-3",
        cubes: (t.cubes || t.individualResults || []).map(
          (c: any, idx: number) => ({
            id: idx + 1,
            load:
              c.failureLoadKn || c.crushingLoadKn || t.crushingLoadKn || "—",
            strength: c.compressiveStrengthNmm2 || avg,
            failureMode: c.typeOfFailure || c.failureMode || "Satisfactory",
            cubeWeight: c.weightKg || "",
          }),
        ),
      });
    }
  }

  const test28Item = resultsList.find((r) => r.age === 28);
  const is28dPass = test28Item
    ? test28Item.status === "PASS" ||
      test28Item.averageStrength >= test28Item.targetStrength
    : null;

  const html = `
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${renderCompanyBrandCell(company, project)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">CONCRETE COMPRESSIVE STRENGTH TEST CERTIFICATE</div>
          <div class="header-title-project">PROJECT: ${projectName}</div>
          <div class="header-title-iso">BS EN 12390-3 / ASTM C39 Compressive Strength Quality Verification</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${docRef}</span></div>
          ${cube.inscribedName ? `<div><strong>Inscribed Mark:</strong> <span style="font-weight:700; color:#0f172a;">${cube.inscribedName}</span></div>` : ""}
          <div><strong>Cast Date:</strong> ${cube.castDate || formatDate(cube.castDate)}</div>
          <div><strong>Status:</strong> <span class="${cube.status === "APPROVED" || is28dPass ? "badge-pass" : is28dPass === false || cube.status === "NCR_ISSUED" || cube.status === "REJECTED" ? "badge-fail" : "badge-pending"}">${cube.status || (is28dPass ? "28D COMPLIANT" : "IN PROGRESS")}</span></div>
        </td>
      </tr>
    </table>

    <!-- 1.0 Parameters -->
    <div class="pdf-section">
      <div class="section-banner">1.0 CONCRETE SPECIMEN & BATCHING PLANT PARAMETERS</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 18%;">STRUCTURAL ELEMENT:</td>
          <td class="grid-value" style="width: 32%;"><strong>${cube.structureElement || cube.elementName}</strong></td>
          <td class="grid-label" style="width: 18%;">SPECIFIED GRADE:</td>
          <td class="grid-value" style="width: 32%;"><strong>${cube.concreteGrade}</strong> (Target: ${target28d} MPa)</td>
        </tr>
        <tr>
          <td class="grid-label">LOCATION / LEVEL:</td>
          <td class="grid-value">${[cube.level || cube.levelName, cube.zone].filter(Boolean).join(" • ") || "Foundation / Site Area"}</td>
          <td class="grid-label">MIX TYPE & DESIGN:</td>
          <td class="grid-value">${cube.mixType || "Design Mix"} ${cube.mixDesignReference ? `(${cube.mixDesignReference})` : ""}</td>
        </tr>
        <tr>
          <td class="grid-label">BATCHING SUPPLIER:</td>
          <td class="grid-value">${cube.supplier || "Approved ReadyMix Source"} ${cube.batchingPlant ? `(${cube.batchingPlant})` : ""}</td>
          <td class="grid-label">TRUCK / TICKET #:</td>
          <td class="grid-value">${[cube.truckNumber, cube.batchTicketNumber || cube.deliveryNoteNumber].filter(Boolean).join(" / ") || "—"}</td>
        </tr>
        <tr>
          <td class="grid-label">CEMENT TYPE:</td>
          <td class="grid-value">${cube.cementType || "OPC Type I / BS EN 197-1"}</td>
          <td class="grid-label">W/C RATIO & AGGREGATE:</td>
          <td class="grid-value">W/C: <strong>${cube.waterCementRatio || "0.40"}</strong> • Max Agg: ${cube.maximumAggregateSize || "20mm"}</td>
        </tr>
        <tr>
          <td class="grid-label">TRACEABILITY REFS:</td>
          <td class="grid-value">PTP: <strong>${cube.pourReference || "—"}</strong> • ITP: ${cube.ITPReference || "—"}</td>
          <td class="grid-label">DRAWING / RFI:</td>
          <td class="grid-value">DWG: ${cube.drawingReference || "—"} • RFI: ${cube.RFINumber || "—"}</td>
        </tr>
      </table>
    </div>

    <!-- 2.0 Fresh Concrete & Curing Details -->
    <div class="pdf-section">
      <div class="section-banner">2.0 FRESH CONCRETE FIELD INSPECTION & CURING REGIMEN</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 18%;">SLUMP RESULT:</td>
          <td class="grid-value" style="width: 32%;"><strong>${cube.slumpResult || cube.slumpMm || "120"} mm</strong> ${cube.slumpClass ? `(${cube.slumpClass})` : ""} @ ${cube.slumpTestTime || cube.castTime || "Discharge"}</td>
          <td class="grid-label" style="width: 18%;">FIELD ACCEPTANCE:</td>
          <td class="grid-value" style="width: 32%;"><span class="badge-pass">${cube.freshConcreteAccepted !== false ? "FRESH CONCRETE ACCEPTED" : "REJECTED"}</span></td>
        </tr>
        <tr>
          <td class="grid-label">TEMPERATURES:</td>
          <td class="grid-value">Concrete: ${cube.concreteTemperature || cube.concreteTempCelsius || "28"}°C • Ambient: ${cube.ambientTemperature || "31"}°C</td>
          <td class="grid-label">FRESH DENSITY:</td>
          <td class="grid-value">${cube.density || cube.densityKgM3 || "2400"} kg/m³</td>
        </tr>
        <tr>
          <td class="grid-label">SAMPLING METHOD:</td>
          <td class="grid-value">${cube.samplingMethod || "BS EN 12350-1"} (${cube.sampleCondition || "Good"})</td>
          <td class="grid-label">CURING METHOD:</td>
          <td class="grid-value"><strong>${cube.curingMethod || "Water Tank (20°C ± 2°C)"}</strong> ${cube.curingTank ? `(${cube.curingTank})` : ""}</td>
        </tr>
        <tr>
          <td class="grid-label">SPECIMEN MOLD SIZE:</td>
          <td class="grid-value">${cube.cubeSize || (cube.cubeSizeMm ? `${cube.cubeSizeMm}x${cube.cubeSizeMm}x${cube.cubeSizeMm}mm` : "150x150x150mm")} (${cube.numCubes || cube.cubeCount || 6} Specimens)</td>
          <td class="grid-label">CURING DATES:</td>
          <td class="grid-value">Start: ${formatDate(cube.curingStartDate || cube.castDate)} ${cube.removedFromTankDate ? `• Out: ${formatDate(cube.removedFromTankDate)}` : ""}</td>
        </tr>
      </table>
    </div>

    <!-- 3.0 Multi-Cube Crushing Results -->
    <div class="pdf-section">
      <div class="section-banner">3.0 LABORATORY COMPRESSION CRUSHING LOG & STRENGTH STATISTICAL EVALUATION</div>
      ${
        resultsList.length > 0
          ? resultsList
              .map((res) => {
                const pass =
                  res.status === "PASS" ||
                  res.averageStrength >= res.targetStrength;
                return `
        <div style="margin-bottom: 8px; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden;">
          <div style="background: #f8fafc; padding: 4px 8px; font-weight: 700; font-size: 8px; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0;">
            <span>${res.title.toUpperCase()} (Test Date: ${formatDate(res.testDate)}) — Standard: ${res.testingStandard}</span>
            <span style="color: ${pass ? "#15803d" : "#b91c1c"}; font-weight: 800;">${pass ? "COMPLIANT (PASS)" : "NON-COMPLIANT (FAIL)"}</span>
          </div>
          <table class="data-table" style="margin-bottom: 0;">
            <thead>
              <tr>
                <th style="width: 10%; text-align: center;">SPECIMEN</th>
                <th style="width: 18%; text-align: right;">MAX LOAD (kN)</th>
                <th style="width: 22%; text-align: right;">MEASURED STRENGTH (MPa)</th>
                <th style="width: 25%;">FAILURE MODE</th>
                <th style="width: 25%; text-align: right;">CUBE WEIGHT (kg)</th>
              </tr>
            </thead>
            <tbody>
              ${
                res.cubes.length > 0
                  ? res.cubes
                      .map(
                        (c) => `
                <tr>
                  <td style="text-align: center; font-weight: 700; color: #0f172a;">Cube #${c.id}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 700;">${c.load || "—"}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 800; color: ${pass ? "#15803d" : "#b91c1c"};">${c.strength || "—"}</td>
                  <td style="color: #475569; font-size: 7.2px;">${c.failureMode || "Cone Failure (Satisfactory)"}</td>
                  <td style="text-align: right; font-family: monospace; color: #64748b;">${c.cubeWeight || "—"}</td>
                </tr>
              `,
                      )
                      .join("")
                  : `
                <tr>
                  <td colspan="5" style="text-align: center; color: #64748b; padding: 6px;">Individual load readings recorded directly in laboratory register.</td>
                </tr>
              `
              }
              <tr style="background: #f1f5f9; font-weight: 700;">
                <td colspan="2" style="font-size: 7.5px;">AVERAGE: <strong style="font-size: 8.5px; color: ${pass ? "#15803d" : "#b91c1c"}; font-family: monospace;">${res.averageStrength} MPa</strong> (Target: ${res.targetStrength} MPa)</td>
                <td colspan="2" style="font-size: 7.2px; color: #475569;">Min: ${res.minimumStrength ?? res.averageStrength} MPa • Max: ${res.maximumStrength ?? res.averageStrength} MPa • SD: ${res.standardDeviation ?? "—"}</td>
                <td style="text-align: right;"><span class="${pass ? "badge-pass" : "badge-fail"}">${pass ? "PASS" : "FAIL"}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        `;
              })
              .join("")
          : `
        <div style="text-align: center; color: #64748b; padding: 14px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 4px; font-size: 8px;">
          Specimens currently curing under monitored laboratory conditions. Scheduled crushing tests pending.
        </div>
      `
      }
    </div>

    <!-- 4.0 Testing Laboratory & Equipment -->
    <div class="pdf-section">
      <div class="section-banner">4.0 LABORATORY TESTING EQUIPMENT & ACCREDITATION</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 20%;">TESTING LABORATORY:</td>
          <td class="grid-value" style="width: 30%;">${cube.testingLaboratory || "LSMTL Independent Materials Testing Lab"}</td>
          <td class="grid-label" style="width: 20%;">ACCREDITATION NO:</td>
          <td class="grid-value" style="width: 30%;">${cube.laboratoryAccreditationNumber || "ISO/IEC 17025 Accredited"}</td>
        </tr>
        <tr>
          <td class="grid-label">TESTING COMPRESSION MACHINE:</td>
          <td class="grid-value">${cube.testingMachine || "2000 kN Automatic Hydraulic Compression Frame"}</td>
          <td class="grid-label">CALIBRATION CERTIFICATE:</td>
          <td class="grid-value">${cube.machineCalibrationCertificate || "CAL-2026-ENG-088 (Valid to Dec 2026)"}</td>
        </tr>
      </table>
    </div>

    <!-- 5.0 Statutory Sign-off -->
    <div class="pdf-section">
      <div class="section-banner">5.0 STATUTORY WITNESS & VERIFICATION SIGN-OFF</div>
      <table class="signoff-table">
        <tr>
          <td style="width: 33.33%;">
            <div class="sig-role-header"><span>QA/QC INSPECTOR</span><span class="sig-required-tag">REQUIRED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${cube.qaqcInspector || cube.witnessedBy || cube.preparedBy || "QA/QC Engineer"}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 10px;">
              <span>Sign: ___________________</span>
              <span>Date: ${formatDate(cube.preparedByDate || resultsList[0]?.testDate || cube.castDate)}</span>
            </div>
          </td>
          <td style="width: 33.33%;">
            <div class="sig-role-header"><span>CONSULTANT ENGINEER</span><span class="sig-optional-tag">OPTIONAL</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${cube.reviewedBy || cube.approvedBy || ""}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 10px;">
              <span>Sign: ___________________</span>
              <span>Date: ${formatDate(cube.reviewedByDate || cube.approvedByDate || cube.castDate)}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${companyName}</div>
      <div>Certificate Ref: ${docRef}</div>
    </div>
  `;

  openPrintWindow(`${docRef} - Cube Test Certificate`, html);
}

export function generateElementSchedulePDF(
  elements: StructuralElement[],
  levels: ProjectLevel[],
  project: Partial<Project> = {},
  company: Partial<Company> = {},
): void {
  const companyName = company.name || "Collection Developments LTD";
  const projectName = project.name || "Bankside";
  const docRef = `ESS-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const totalVol = elements.reduce(
    (acc, el) =>
      acc + (el.calculatedVolume || el.volume || el.achievedVolume || 0),
    0,
  );
  const totalArea = elements.reduce(
    (acc, el) => acc + (el.calculatedFormworkArea || el.area || 0),
    0,
  );

  const html = `
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${renderCompanyBrandCell(company, project)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">STRUCTURAL ELEMENT SIZE SCHEDULE & TAKEOFF</div>
          <div class="header-title-project">PROJECT: ${projectName}</div>
          <div class="header-title-iso">ISO 9001:2015 Structural Quality Verification Register</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${docRef}</span></div>
          <div><strong>Date:</strong> ${formatDate(new Date())}</div>
          <div><strong>Elements:</strong> ${elements.length} Total</div>
        </td>
      </tr>
    </table>

    <!-- 1.0 Summary Metrics -->
    <div class="pdf-section">
      <div class="section-banner">1.0 EXECUTIVE MATERIAL TAKEOFF SUMMARY</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 25%;">TOTAL ELEMENTS:</td>
          <td class="grid-value" style="width: 25%; font-size: 9px; font-weight: 800;">${elements.length} Nos</td>
          <td class="grid-label" style="width: 25%;">TOTAL CONCRETE VOLUME:</td>
          <td class="grid-value" style="width: 25%; font-size: 9px; font-weight: 800; color: #15803d;">${totalVol.toFixed(2)} m³</td>
        </tr>
        <tr>
          <td class="grid-label">EST. FORMWORK AREA:</td>
          <td class="grid-value" style="font-size: 9px; font-weight: 800;">${totalArea.toFixed(2)} m²</td>
          <td class="grid-label">LEVELS COVERED:</td>
          <td class="grid-value" style="font-size: 9px; font-weight: 800;">${levels.length} Levels</td>
        </tr>
      </table>
    </div>

    <!-- 2.0 Inventory Table -->
    <div class="pdf-section">
      <div class="section-banner">2.0 STRUCTURAL ELEMENT INVENTORY (${elements.length} ELEMENTS)</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 5%; text-align: center;">#</th>
            <th style="width: 22%;">ELEMENT NAME</th>
            <th style="width: 15%;">TYPE</th>
            <th style="width: 18%;">LEVEL</th>
            <th style="width: 14%;">GRID AXIS</th>
            <th style="width: 14%; text-align: right;">VOLUME (m³)</th>
            <th style="width: 12%; text-align: center;">STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${elements
            .slice(0, 100)
            .map(
              (el, idx) => `
            <tr>
              <td style="text-align: center; font-weight: 700; color: #64748b;">${idx + 1}</td>
              <td style="font-weight: 700; color: #0f172a;">${el.elementName}</td>
              <td>${el.elementType || "Structural"}</td>
              <td>${el.levelName || "—"}</td>
              <td>${el.grid || el.gridAxis || (el.gridX !== undefined && el.gridY !== undefined ? `${el.gridX}/${el.gridY}` : "—")}</td>
              <td style="text-align: right; font-weight: 700; font-family: monospace;">${(el.calculatedVolume || el.volume || el.achievedVolume || 0).toFixed(2)}</td>
              <td style="text-align: center;">
                <span class="${el.status === "APPROVED" ? "badge-pass" : el.status === "REJECTED" ? "badge-fail" : "badge-pending"}">${el.status || "PENDING"}</span>
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <!-- 3.0 Sign-off -->
    <div class="pdf-section">
      <div class="section-banner">3.0 STATUTORY TAKEOFF VERIFICATION SIGN-OFF</div>
      <table class="signoff-table">
        <tr>
          <td style="width: 50%;">
            <div class="sig-role-header"><span>QUANTITY SURVEYOR / QA/QC</span><span class="sig-required-tag">REQUIRED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>Site Engineer</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${formatDate(new Date())}</span>
            </div>
          </td>
          <td style="width: 50%;">
            <div class="sig-role-header"><span>PROJECT MANAGER</span><span class="sig-required-tag">REQUIRED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>Project Manager</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ____ / ____ / 20__</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${companyName}</div>
      <div>Schedule Ref: ${docRef}</div>
    </div>
  `;

  openPrintWindow(`${docRef} - Element Size Schedule`, html);
}

// =========================================================================
// 8. WEEKLY QA/QC QUALITY REPORT (DUAL ORIENTATION & MODULAR AUDIT)
// =========================================================================

import {
  WeeklyReportTemplateId,
  getWeeklyReportTemplate,
} from "@/types/weeklyReportTemplates";

export interface WeeklyReportPrintOptions {
  orientation?: "portrait" | "landscape";
  templateId?: WeeklyReportTemplateId | string;
  includeNcrsAndComments?: boolean; // fallback
  includeNcrs?: boolean; // granular toggle
  includeSiteComments?: boolean; // granular toggle
  includeSiteInstructions?: boolean; // default true
  revisionNumber?: string;
}


export function generateWeeklyReportPDF(
  report: WeeklyReport,
  project: Partial<Project> = {},
  company: Partial<Company> = {},
  options?: WeeklyReportPrintOptions,
): void {
  const orientation = options?.orientation || report.printOrientation || "portrait";
  const isPortrait = orientation === "portrait";
  const rawRevision =
    options?.revisionNumber ||
    report.revisionNumber ||
    (report as any)?.revision;
  const revisionText =
    rawRevision && String(rawRevision).trim().length > 0
      ? String(rawRevision).trim()
      : "Rev 1.0 (Final Submission)";
  const companyName = company.name || "Collection Developments LTD";
  const companyLegalName =
    company.legalName || (company as any)?.companyName || "Collection Developments Limited";
  const companyLogo =
    company.logoUrl ||
    company.logo ||
    (company as any)?.logoBase64 ||
    report.logoBase64 ||
    "";
  const projectName =
    project.name || report.projectName || "BANKSIDE";
  const docRef =
    report.reportNumber ||
    `WQR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const showNcrs =
    options?.includeNcrs !== undefined
      ? options.includeNcrs
      : options?.includeNcrsAndComments !== undefined
        ? options.includeNcrsAndComments
        : (report as any).includeNcrs !== undefined
          ? (report as any).includeNcrs
          : report.includeNcrsAndComments !== false;

  const showSiteComments =
    options?.includeSiteComments !== undefined
      ? options.includeSiteComments
      : options?.includeNcrsAndComments !== undefined
        ? options.includeNcrsAndComments
        : (report as any).includeSiteComments !== undefined
          ? (report as any).includeSiteComments
          : report.includeNcrsAndComments !== false;

  const includeSiteInstructions =
    options?.includeSiteInstructions !== undefined
      ? options.includeSiteInstructions
      : report.includeSiteInstructions !== false;

  // Helper to format Date string as YYYY-MM-DD
  function formatDateYMD(dVal?: any): string {
    if (!dVal) return "";
    if (typeof dVal === "string") {
      const trimmed = dVal.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split("T")[0];
      }
      return trimmed;
    }
    if (typeof dVal === "number") {
      return new Date(dVal).toISOString().split("T")[0];
    }
    if (dVal instanceof Date && !isNaN(dVal.getTime())) {
      return dVal.toISOString().split("T")[0];
    }
    return "";
  }

  function currentUserEmail(): string {
    try {
      const u = useAuthStore.getState().currentUser;
      return u?.email || "";
    } catch {
      return "";
    }
  }

  const rawStart = report.startDate || report.weekStart || "";
  const rawEnd = report.endDate || report.weekEnd || "";
  const startDateStr = formatDateYMD(rawStart) || "—";
  const endDateStr = formatDateYMD(rawEnd) || "—";
  const reportDate = endDateStr !== "—" ? endDateStr : (formatDateYMD(report.reportDate || report.createdAt) || formatDateYMD(new Date()));

  const compiler =
    typeof report.preparedBy === "object" && report.preparedBy
      ? (report.preparedBy as any)
      : {
          name:
            typeof report.preparedBy === "string"
              ? report.preparedBy
              : "",
          designation: "QA/QC ENGINEER",
          role: "QA/QC ENGINEER",
        };
  const compilerName =
    compiler.name ||
    useAuthStore.getState().currentUser?.fullName ||
    useAuthStore.getState().currentUser?.displayName ||
    "Authorized QA/QC Engineer";
  const compilerRole = compiler.designation || compiler.role || "QA/QC ENGINEER";
  const compilerEmail = compiler.email || currentUserEmail() || "—";
  const isCompilerSigned = Boolean(compiler.signed);
  const signatureUrl = compiler.signatureUrl || "";

  // Data sets
  const cubeList =
    (report.cubeTests && report.cubeTests.length > 0
      ? report.cubeTests
      : report.filteredCubeTests) || [];
  const quantityList = report.quantitySummary || [];
  const mepList = report.mepClearance || [];
  const deliveriesList =
    (report.materialDeliveries && report.materialDeliveries.length > 0
      ? report.materialDeliveries
      : report.filteredMaterialDeliveries) || [];
  const ncrList =
    (report.ncrRemediationLog && report.ncrRemediationLog.length > 0
      ? report.ncrRemediationLog
      : report.filteredNcrs) ||
    report.ncr ||
    [];
  const commentsList =
    (report.siteComments && report.siteComments.length > 0
      ? report.siteComments
      : report.filteredSiteComments) ||
    report.filteredFindings ||
    [];
  const siteInstructionsList =
    (report.siteInstructions && report.siteInstructions.length > 0
      ? report.siteInstructions
      : report.filteredSiteInstructions) || [];

  // Project Cover Image resolution
  const projectCoverImage =
    report.projectCoverImageUrl ||
    report.coverImageUrl ||
    report.coverImageBase64 ||
    project.coverImageUrl ||
    project.imageUrl ||
    (project as any)?.image ||
    (report as any)?.projectImage ||
    "";

  // Filter pictorials (only items with valid image url)
  const validPictorials = (report.pictorialUrls || []).filter((p: any) => {
    const u = typeof p === "string" ? p : p?.url;
    return Boolean(u && typeof u === "string" && u.trim().length > 0);
  });

  // CAD Layout drawings
  const beamLayoutImg = report.beamLayoutImg;
  const columnLayoutImg = report.columnLayoutImg;
  const slabImg = report.slabImg;

  // Structural Elements
  const allElements = report.structuralElements || [];
  const columnElements = allElements.filter((el) => {
    const t = (el.elementType || (el as any).type || el.element || "").toLowerCase();
    return t.includes("column");
  });
  const beamElements = allElements.filter((el) => {
    const t = (el.elementType || (el as any).type || el.element || "").toLowerCase();
    return t.includes("beam");
  });
  const slabElements = allElements.filter((el) => {
    const t = (el.elementType || (el as any).type || el.element || "").toLowerCase();
    return t.includes("slab");
  });

  const selectedLevel = (
    report.selectedLevel ||
    report.selectedLevelName ||
    "—"
  ).toUpperCase();

  // Aggregate Volumes calculation
  let totalScopeVol = 0;
  let totalAchievedVol = 0;

  if (quantityList.length > 0) {
    quantityList.forEach((q: any) => {
      const p = parseFloat(String(q.calculatedVolume ?? q.plannedVolume ?? q.scope ?? 0)) || 0;
      const a = parseFloat(String(q.achievedVolume ?? q.actualVolume ?? 0)) || 0;
      totalScopeVol += p;
      totalAchievedVol += a;
    });
  } else if (allElements.length > 0) {
    allElements.forEach((el: any) => {
      const calcVol = parseFloat(String(el.calculatedVolume || el.volume || 0)) || 0;
      const achVol = parseFloat(String(el.achievedVolume ?? el.completedVolume ?? 0)) || 0;
      totalScopeVol += calcVol;
      totalAchievedVol += achVol;
    });
  }

  if (totalScopeVol === 0 && report.totalVolumeCalculated) {
    totalScopeVol = Number(report.totalVolumeCalculated) || 0;
  }
  if (totalAchievedVol === 0 && report.totalVolumeAchieved) {
    totalAchievedVol = Number(report.totalVolumeAchieved) || 0;
  }

  const overallPercentage =
    totalScopeVol > 0 ? Math.round((totalAchievedVol / totalScopeVol) * 100) : 0;

  const openFindingsCount =
    (report.ncrStats?.openTotal ?? 0) +
    (commentsList.filter((c: any) => {
      const s = String(c.status || "").toLowerCase();
      return s.includes("non") || s.includes("open") || s.includes("progress") || s.includes("pending");
    }).length);

  const complianceRate =
    report.overallQualityCompliance !== undefined && report.overallQualityCompliance !== null
      ? Number(report.overallQualityCompliance)
      : report.metrics?.inspectionPassRate !== undefined && report.metrics?.inspectionPassRate !== null
        ? Number(report.metrics.inspectionPassRate)
        : 100;

  // Theme Template Resolution
  const selectedTemplateId =
    options?.templateId ||
    report.templateId ||
    "classic-executive";
  const theme = getWeeklyReportTemplate(selectedTemplateId);

  // Header Brand Renderer
  const renderHeaderBrand = () => `
    <div style="display: flex; align-items: center; gap: 6px;">
      ${
        companyLogo
          ? `<img src="${companyLogo}" style="max-height: 22px; max-width: 80px; object-fit: contain;" alt="Logo" />`
          : `
          <div style="display: flex; gap: 2px; align-items: flex-end; height: 16px;">
            <span style="width: 3.5px; height: 9px; background: ${theme.accentColor}; border-radius: 1px;"></span>
            <span style="width: 3.5px; height: 16px; background: ${theme.accentColor}; border-radius: 1px;"></span>
            <span style="width: 3.5px; height: 12px; background: ${theme.accentColor}; border-radius: 1px;"></span>
          </div>
          <span style="font-size: 8.5px; font-weight: 900; color: #0f172a; letter-spacing: 0.8px; text-transform: uppercase;">COLLECTION</span>
        `
      }
    </div>
  `;

  // Standard Header for Slides 2 to 30
  const renderHeader = (pageTitle: string) => `
    <div class="pdf-header">
      <div class="pdf-header-top">
        <div style="display: flex; align-items: center; gap: 8px;">
          ${renderHeaderBrand()}
          <div style="font-size: 8.5px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 6px; letter-spacing: 0.2px;">
            <span>${reportDate}</span>
            <span style="color: #cbd5e1;">|</span>
            <span style="color: ${theme.accentColor}; font-weight: 800;">QA/QC SURVEILLANCE</span>
            <span style="color: #cbd5e1;">|</span>
            <span style="font-weight: 800; color: #0f172a; text-transform: uppercase;">${pageTitle}</span>
          </div>
        </div>
        <div style="font-size: 8.5px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase;">
          <span style="color: #0f172a;">${projectName.toUpperCase()}</span> &nbsp;|&nbsp; <span style="color: #94a3b8;">CONFIDENTIAL</span>
        </div>
      </div>
      <div class="pdf-header-rule" style="background: ${theme.ruleColor}; height: 2px;"></div>
    </div>
  `;

  // Standard Footer for Slides 2 to 30
  const renderFooter = (slideNumber: number) => `
    <div class="pdf-footer" style="border-top: 1px solid ${theme.cardBorder};">
      <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">
        Compiled By: <strong style="color: #475569;">${compilerName} (${compilerRole})</strong> &nbsp;|&nbsp; ISO 9001:2015 Quality Management System
      </div>
      <div class="pdf-slide-badge" style="background: ${theme.badgeBg}; color: ${theme.badgeTextColor}; border: 1px solid ${theme.badgeBorder}; border-radius: ${theme.cardRadius};">
        SLIDE ${String(slideNumber).padStart(2, "0")}
      </div>
    </div>
  `;

  // Array of Slide HTML definitions
  const slidesHtml: string[] = [];

  // =========================================================================
  // SLIDE 1: COVER SLIDE (Theme Adaptive Hero Layout)
  // =========================================================================
  if (isPortrait) {
    slidesHtml.push(`
      <div class="pdf-sheet" style="padding: 0; display: flex; flex-direction: column; height: 297mm; overflow: hidden; position: relative; background: #ffffff;">
        <!-- Top Hero Column -->
        <div style="padding: 14mm 16mm 10mm 16mm; background: #ffffff; border-bottom: 3px solid ${theme.accentColor};">
          <!-- Company Brand Header -->
          <div style="margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              ${
                companyLogo
                  ? `<img src="${companyLogo}" style="max-height: 44px; max-width: 150px; object-fit: contain;" alt="${companyName}" />`
                  : `
                <div style="display: flex; gap: 2.5px; align-items: flex-end; height: 20px;">
                  <span style="width: 4px; height: 11px; background: ${theme.accentColor}; border-radius: 1px;"></span>
                  <span style="width: 4px; height: 20px; background: ${theme.accentColor}; border-radius: 1px;"></span>
                  <span style="width: 4px; height: 15px; background: ${theme.accentColor}; border-radius: 1px;"></span>
                </div>
              `
              }
              <div style="font-size: 13px; font-weight: 900; color: #0f172a; letter-spacing: 1.2px; text-transform: uppercase;">
                ${companyName.toUpperCase()}
              </div>
            </div>
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; background: #f8fafc; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 4px;">
              ISO 9001:2015 AUDITED
            </div>
          </div>

          <!-- Project Title & Divider -->
          <div style="margin-bottom: 8px;">
            <div style="font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; text-transform: uppercase; line-height: 1.1;">
              ${projectName.toUpperCase()}
            </div>
          </div>

          <!-- Report Title -->
          <div style="font-size: 16px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.2px; margin-bottom: 10px;">
            ${report.title || "QA/QC WEEKLY SURVEILLANCE REPORT"}
          </div>

          <!-- Surveillance Level Tag & Date Range Pill -->
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <div style="display: inline-block; background: ${theme.accentLight}; color: ${theme.accentDark}; font-size: 9px; font-weight: 800; padding: 4px 10px; border-radius: ${theme.cardRadius}; border: 1px solid ${theme.cardBorder}; text-transform: uppercase;">
              SURVEILLANCE: ${selectedLevel}
            </div>
            <div style="display: inline-block; background: #FFFFFF; border: 1.5px solid ${theme.accentColor}; color: ${theme.accentDark}; font-size: 9px; font-weight: 800; padding: 4px 14px; border-radius: 9999px; letter-spacing: 0.3px; text-transform: uppercase;">
              ${startDateStr} &nbsp;TO&nbsp; ${endDateStr}
            </div>
          </div>
        </div>

        <!-- Center Full-Bleed Cover Image -->
        <div style="flex: 1; min-height: 120mm; max-height: 145mm; width: 100%; background: #0f172a; overflow: hidden; position: relative;">
          ${
            projectCoverImage
              ? `<img src="${projectCoverImage}" style="width: 100%; height: 100%; object-fit: cover;" alt="${projectName}" />`
              : `
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
              <div style="text-align: center; color: #ffffff; padding: 30px;">
                <div style="font-size: 32px; font-weight: 900; color: #c28b5e;">${projectName.toUpperCase()}</div>
                <div style="font-size: 11px; color: #94a3b8; font-weight: 700; margin-top: 6px;">OFFICIAL QA/QC SURVEILLANCE DOSSIER</div>
              </div>
            </div>
          `
          }
        </div>

        <!-- Bottom Compiler Card & Reference Info -->
        <div style="padding: 10mm 16mm 12mm 16mm; background: #ffffff; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
          <div style="border-left: 4px solid ${theme.accentColor}; padding-left: 12px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
              AUTHORIZED COMPILER &amp; QA/QC OFFICER
            </div>
            <div style="font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 2px;">
              ${compilerName}
            </div>
            <div style="font-size: 8.5px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 1px;">
              ${compilerRole} &bull; ${compilerEmail}
            </div>
          </div>

          <div style="text-align: right;">
            <div style="font-size: 7px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
              DOCUMENT REFERENCE
            </div>
            <div style="font-size: 11px; font-weight: 900; font-family: monospace; color: #0f172a; margin-top: 1px;">
              ${docRef}
            </div>
            <div style="font-size: 8px; color: #059669; font-weight: 800; margin-top: 2px;">
              ${revisionText}
            </div>
          </div>
        </div>
      </div>
    `);
  } else {
    slidesHtml.push(`
      <div class="pdf-sheet" style="padding: 0; display: flex; flex-direction: row; height: 210mm; overflow: hidden; position: relative;">
        <!-- Left Hero Column (~46% width) -->
        <div style="width: 46%; padding: 24mm 14mm 16mm 16mm; display: flex; flex-direction: column; justify-content: space-between; background: #ffffff; position: relative; border-right: 3px solid ${theme.accentColor};">
          <div>
            <!-- Company Brand Header -->
            <div style="margin-bottom: 22px;">
              <div style="display: flex; align-items: flex-end; gap: 2px; margin-bottom: 4px;">
                ${
                  companyLogo
                    ? `<img src="${companyLogo}" style="max-height: 120px; max-width: 190px; object-fit: contain;" alt="${companyName}" />`
                    : `
                  <div style="display: flex; gap: 3px; align-items: flex-end; height: 26px;">
                    <span style="width: 5px; height: 14px; background: ${theme.accentColor}; border-radius: 1px;"></span>
                    <span style="width: 5px; height: 24px; background: ${theme.accentColor}; border-radius: 1px;"></span>
                    <span style="width: 5px; height: 18px; background: ${theme.accentColor}; border-radius: 1px;"></span>
                  </div>
                `
                }
              </div>
              <div style="font-size: 13px; font-weight: 900; color: #0f172a; letter-spacing: 1.5px; text-transform: uppercase;">
                ${companyName.toUpperCase()}
              </div>
            </div>

            <!-- Project Title & Divider -->
            <div style="margin-bottom: 18px;">
              <div style="font-size: 34px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; text-transform: uppercase; line-height: 1.05;">
                ${projectName.toUpperCase()}
              </div>
              <div style="width: 100%; height: 2px; background: ${theme.accentColor}; margin-top: 14px;"></div>
            </div>

            <!-- Report Title -->
            <div style="font-size: 19px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.3px; margin-bottom: 12px;">
              ${report.title || "QA/QC WEEKLY REPORT"}
            </div>

            <!-- Surveillance Level Tag -->
            <div style="display: inline-block; background: ${theme.accentLight}; color: ${theme.accentDark}; font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: ${theme.cardRadius}; border: 1px solid ${theme.cardBorder}; text-transform: uppercase; margin-bottom: 12px;">
              SURVEILLANCE: ${selectedLevel}
            </div>
            <div></div>

            <!-- Date Range Pill -->
            <div style="display: inline-block; background: #FFFFFF; border: 1.5px solid ${theme.accentColor}; color: ${theme.accentDark}; font-size: 10.5px; font-weight: 800; padding: 6px 22px; border-radius: 9999px; letter-spacing: 0.5px; text-transform: uppercase;">
              ${startDateStr} &nbsp;TO&nbsp; ${endDateStr}
            </div>
          </div>

          <!-- Compiler Card (Bottom Left) -->
          <div style="background: #ffffff; border: 1px solid ${theme.cardBorder}; border-left: 4px solid ${theme.accentColor}; border-radius: ${theme.cardRadius}; padding: 12px 16px; margin-top: auto;">
            <div style="font-size: 7.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
              AUTHORIZED COMPILER &amp; QA/QC OFFICER
            </div>
            <div style="font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 3px;">
              ${compilerName}
            </div>
            <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 1px;">
              ${compilerRole}
            </div>
          </div>
        </div>

        <!-- Right Column (~54% width) Full-Bleed Cover Image -->
        <div style="width: 54%; height: 100%; background: #0f172a; overflow: hidden; position: relative;">
          ${
            projectCoverImage
              ? `<img src="${projectCoverImage}" style="width: 100%; height: 100%; object-fit: cover;" alt="${projectName}" />`
              : `
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
              <div style="text-align: center; color: #ffffff; padding: 30px;">
                <div style="font-size: 36px; font-weight: 900; color: #c28b5e;">${projectName.toUpperCase()}</div>
                <div style="font-size: 12px; color: #94a3b8; font-weight: 700; margin-top: 8px;">OFFICIAL QA/QC SURVEILLANCE DOSSIER</div>
              </div>
            </div>
          `
          }
        </div>
      </div>
    `);
  }

  // =========================================================================
  // SLIDE 2: EXECUTIVE SUMMARY: OPERATIONAL OVERVIEW
  // =========================================================================
  slidesHtml.push(`
    <div class="pdf-sheet">
      <div>
        ${renderHeader("EXECUTIVE SUMMARY: OPERATIONAL OVERVIEW")}
        
        <!-- 4 Top Cards Grid -->
        <div style="display: grid; grid-template-columns: ${isPortrait ? "repeat(2, 1fr)" : "repeat(4, 1fr)"}; gap: ${isPortrait ? "10px" : "14px"}; margin-bottom: ${isPortrait ? "12px" : "18px"};">
          <!-- Card 1: Total Scope Volume -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #0f172a; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL SCOPE VOLUME</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${totalScopeVol.toLocaleString(undefined, { maximumFractionDigits: 1 })} m³</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">Design Volume Target</div>
          </div>

          <!-- Card 2: Achieved Volume -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #0284c7; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">ACHIEVED VOLUME</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${totalAchievedVol.toLocaleString(undefined, { maximumFractionDigits: 1 })} m³</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">${overallPercentage}% Cumulative</div>
          </div>

          <!-- Card 3: Quality Compliance -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #16a34a; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">QUALITY COMPLIANCE</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${complianceRate}%</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">Field Surveillance Benchmark</div>
          </div>

          <!-- Card 4: Open Findings / NCRs -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #dc2626; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">OPEN FINDINGS / NCRS</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${openFindingsCount}</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">Active Remediation Items</div>
          </div>
        </div>

        <!-- Large Content Card -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 22px 26px; min-height: ${isPortrait ? "420px" : "320px"}; position: relative;">
          <div style="border-left: 6px solid #0f172a; padding-left: 14px; margin-bottom: 16px;">
            <div style="font-size: 12px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
              EXECUTIVE QA/QC SYNOPSIS &amp; MANAGEMENT EVALUATION
            </div>
          </div>
          <div style="width: 100%; height: 1px; background: #f1f5f9; margin-bottom: 16px;"></div>
          <div style="font-size: 10.5px; line-height: 1.7; color: #334155; font-weight: 500;">
            ${
              (report.synopsis || report.executiveSummary)?.trim()
                ? (report.synopsis || report.executiveSummary)
                : `<span style="color: #94a3b8; font-style: italic;">No executive synopsis provided for this reporting period.</span>`
            }
          </div>
        </div>
      </div>
      ${renderFooter(slidesHtml.length + 1)}
    </div>
  `);

  // =========================================================================
  // SLIDE 3: EXECUTIVE SUMMARY: STRATEGIC INSIGHTS
  // =========================================================================
  const formatBulletSection = (rawText?: string) => {
    const text = rawText && rawText.trim().length > 0 ? rawText.trim() : "";
    if (!text) return "";
    
    // Split by double newline or linebreaks and render formatted paragraphs
    const paragraphs = text
      .split(/\n\s*\n|\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    return paragraphs
      .map((p) => {
        // If line contains colon (e.g. "Title: Body"), highlight the title
        if (p.includes(":")) {
          const parts = p.split(":");
          const head = parts[0].trim();
          const rest = parts.slice(1).join(":").trim();
          return `
            <div style="margin-bottom: 12px;">
              <strong style="color: #0f172a; font-weight: 800;">${head}:</strong> ${rest}
            </div>
          `;
        }
        return `<div style="margin-bottom: 10px;">${p}</div>`;
      })
      .join("");
  };

  slidesHtml.push(`
    <div class="pdf-sheet">
      <div>
        ${renderHeader("EXECUTIVE SUMMARY: STRATEGIC INSIGHTS")}
        
        <!-- 3 Columns / Cards Layout -->
        <div style="display: flex; flex-direction: ${isPortrait ? "column" : "row"}; gap: 12px; min-height: ${isPortrait ? "auto" : "420px"};">
          <!-- Column 1: Highlights -->
          <div style="display: flex; flex-direction: column; flex: 1;">
            <div style="background: #16a34a; color: #ffffff; text-align: center; padding: 8px 12px; font-weight: 800; font-size: 10px; border-radius: 4px 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
              KEY PROJECT HIGHLIGHTS
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 12px 14px; font-size: 8.5px; line-height: 1.5; color: #334155; background: #ffffff;">
              ${formatBulletSection(report.highlights)}
            </div>
          </div>

          <!-- Column 2: Risks & Concerns -->
          <div style="display: flex; flex-direction: column; flex: 1;">
            <div style="background: #d97706; color: #ffffff; text-align: center; padding: 8px 12px; font-weight: 800; font-size: 10px; border-radius: 4px 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
              CRITICAL RISKS &amp; OPEN CONCERNS
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 12px 14px; font-size: 8.5px; line-height: 1.5; color: #334155; background: #ffffff;">
              ${formatBulletSection(report.concerns)}
            </div>
          </div>

          <!-- Column 3: Look-Ahead Plan -->
          <div style="display: flex; flex-direction: column; flex: 1;">
            <div style="background: #4f46e5; color: #ffffff; text-align: center; padding: 8px 12px; font-weight: 800; font-size: 10px; border-radius: 4px 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
              LOOK-AHEAD PLAN &amp; ACTION TARGETS
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 12px 14px; font-size: 8.5px; line-height: 1.5; color: #334155; background: #ffffff;">
              ${formatBulletSection(report.nextWeekPlan)}
            </div>
          </div>
        </div>
      </div>
      ${renderFooter(slidesHtml.length + 1)}
    </div>
  `);

  // =========================================================================
  // SLIDE 4: CONCRETE COMPRESSIVE STRENGTH TEST MATRIX
  // =========================================================================
  const sampleCubes = cubeList;

  if (sampleCubes.length === 0) {
    slidesHtml.push(`
      <div class="pdf-sheet">
        <div>
          ${renderHeader("CONCRETE COMPRESSIVE STRENGTH TEST MATRIX")}
          
          <table class="data-table" style="margin-top: 8px;">
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">S/N</th>
                <th style="width: 14%;">DATE CAST</th>
                <th style="width: 35%;">ELEMENT / LEVEL</th>
                <th style="width: 13%; text-align: center;">7-DAY STRENGTH</th>
                <th style="width: 11%; text-align: center;">7-DAY STATUS</th>
                <th style="width: 13%; text-align: center;">28-DAY STRENGTH</th>
                <th style="width: 11%; text-align: center;">28-DAY STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="7" style="text-align: center; color: #64748b; padding: 24px; font-weight: 600;">
                  No concrete compressive strength test records logged for this reporting period.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        ${renderFooter(slidesHtml.length + 1)}
      </div>
    `);
  } else {
    const ROWS_PER_PAGE = isPortrait ? 20 : 14;
    const totalPages = Math.ceil(sampleCubes.length / ROWS_PER_PAGE);

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pageCubes = sampleCubes.slice(pageIdx * ROWS_PER_PAGE, (pageIdx + 1) * ROWS_PER_PAGE);
      const pageTitle =
        totalPages > 1
          ? `CONCRETE COMPRESSIVE STRENGTH TEST MATRIX (PART ${pageIdx + 1} OF ${totalPages})`
          : "CONCRETE COMPRESSIVE STRENGTH TEST MATRIX";

      const cubeRowsHtml = pageCubes
        .map((c: any, idx: number) => {
          const globalIdx = pageIdx * ROWS_PER_PAGE + idx + 1;
          const d7 = c.strength7Days || (c.day7Results?.[0]?.averageStrength ? `${c.day7Results[0].averageStrength} N/mm²` : "—");
          const d28 = c.strength28Days || (c.day28Results?.[0]?.averageStrength ? `${c.day28Results[0].averageStrength} N/mm²` : "—");
          const st7 = String(c.status7Days || (d7 !== "—" ? "PASS" : "pending")).toLowerCase();
          const st28 = String(c.status28Days || (d28 !== "—" ? "PASS" : "pending")).toLowerCase();

          return `
            <tr>
              <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(globalIdx).padStart(2, "0")}</td>
              <td style="font-family: monospace; font-weight: 600;">${formatDateYMD(c.dateCast || c.castDate || c.date) || "—"}</td>
              <td style="font-weight: 800; color: #0f172a; text-transform: uppercase;">${c.elementLevel || c.element || c.inscribedName || "Structural Element"}</td>
              <td style="font-family: monospace; font-weight: 700; text-align: center;">${d7}</td>
              <td style="text-align: center; font-weight: 800; color: ${st7.includes("pass") ? "#16a34a" : "#d97706"};">${st7.includes("pass") ? "PASS" : st7.toUpperCase()}</td>
              <td style="font-family: monospace; font-weight: 700; text-align: center;">${d28}</td>
              <td style="text-align: center; font-weight: 800; color: ${st28.includes("pass") ? "#16a34a" : "#d97706"};">${st28.includes("pass") ? "PASS" : st28.toUpperCase()}</td>
            </tr>
          `;
        })
        .join("");

      slidesHtml.push(`
        <div class="pdf-sheet">
          <div>
            ${renderHeader(pageTitle)}
            
            <table class="data-table" style="margin-top: 8px;">
              <thead>
                <tr>
                  <th style="width: 5%; text-align: center;">S/N</th>
                  <th style="width: 14%;">DATE CAST</th>
                  <th style="width: 35%;">ELEMENT / LEVEL</th>
                  <th style="width: 13%; text-align: center;">7-DAY STRENGTH</th>
                  <th style="width: 11%; text-align: center;">7-DAY STATUS</th>
                  <th style="width: 13%; text-align: center;">28-DAY STRENGTH</th>
                  <th style="width: 11%; text-align: center;">28-DAY STATUS</th>
                </tr>
              </thead>
              <tbody>
                ${cubeRowsHtml}
              </tbody>
            </table>
          </div>
          ${renderFooter(slidesHtml.length + 1)}
        </div>
      `);
    }
  }

  // =========================================================================
  // SLIDE 5: MATERIAL & QUANTITY SUMMARY + PIE CHART & GROUPED VERTICAL BAR CHART
  // =========================================================================
  const colorPalette = [
    "#3b82f6", // Blue
    "#10b981", // Emerald
    "#f97316", // Orange
    "#8b5cf6", // Purple
    "#06b6d4", // Cyan
    "#ec4899", // Pink
    "#f59e0b", // Amber
  ];

  const elementVolumes: { name: string; scope: number; completion: number; color: string }[] = [];

  // If quantity summary exists in report, map from live report
  if (quantityList.length > 0) {
    quantityList.forEach((q: any, i: number) => {
      const scopeVal = parseFloat(String(q.calculatedVolume ?? q.plannedVolume ?? q.scope ?? 0)) || 0;
      const achVal = parseFloat(String(q.achievedVolume ?? q.actualVolume ?? 0)) || 0;
      let pct = scopeVal > 0 ? Math.round((achVal / scopeVal) * 100) : parseInt(String(q.completion || 0));
      pct = Math.min(100, Math.max(0, pct));
      elementVolumes.push({
        name: String(q.element || q.structuralElement || `Element ${i + 1}`).toUpperCase().trim(),
        scope: scopeVal,
        completion: pct,
        color: colorPalette[i % colorPalette.length],
      });
    });
  } else if (allElements.length > 0) {
    const grouped: Record<string, { scope: number; achieved: number }> = {};
    allElements.forEach((el: any) => {
      const type = (el.elementType || el.type || el.element || "OTHER").toUpperCase().trim();
      const calcVol = parseFloat(String(el.calculatedVolume || el.volume || 0)) || 0;
      const achVol = parseFloat(String(el.achievedVolume ?? el.completedVolume ?? 0)) || 0;
      if (!grouped[type]) grouped[type] = { scope: 0, achieved: 0 };
      grouped[type].scope += calcVol;
      grouped[type].achieved += achVol;
    });

    Object.entries(grouped).forEach(([type, data], i) => {
      const pct = data.scope > 0 ? Math.min(100, Math.max(0, Math.round((data.achieved / data.scope) * 100))) : 0;
      elementVolumes.push({
        name: type,
        scope: Math.round(data.scope * 100) / 100,
        completion: pct,
        color: colorPalette[i % colorPalette.length],
      });
    });
  }

  const calcTotalScope = elementVolumes.reduce((acc, curr) => acc + curr.scope, 0);
  const calcAvgCompletion =
    elementVolumes.length > 0
      ? Math.round(elementVolumes.reduce((acc, curr) => acc + curr.completion, 0) / elementVolumes.length)
      : 0;

  // Render SVG Solid Pie Chart
  const renderPieChart = () => {
    if (elementVolumes.length === 0 || calcTotalScope === 0) {
      return {
        svg: `
          <svg width="150" height="150" viewBox="0 0 150 150" style="display: block; margin: 0 auto;">
            <circle cx="75" cy="75" r="62" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3 3" />
            <text x="75" y="78" text-anchor="middle" font-size="8.5" fill="#94a3b8" font-family="-apple-system, sans-serif" font-weight="600">No Volume Data</text>
          </svg>
        `,
        legend: `
          <div style="margin-top: 10px; font-size: 7.5px; color: #94a3b8; text-align: center; font-style: italic;">
            No quantity distribution recorded
          </div>
        `,
      };
    }

    const size = 150;
    const cx = 75;
    const cy = 75;
    const r = 62;

    let startAngle = -Math.PI / 2;
    const paths: string[] = [];

    elementVolumes.forEach((item) => {
      const fraction = calcTotalScope > 0 ? item.scope / calcTotalScope : 1 / (elementVolumes.length || 1);
      const sliceAngle = fraction * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);

      const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

      const pathData = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
      paths.push(`<path d="${pathData}" fill="${item.color}" stroke="#ffffff" stroke-width="1.5" />`);

      startAngle = endAngle;
    });

    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display: block; margin: 0 auto;">
        ${paths.join("")}
      </svg>
    `;

    const legend = `
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; margin-top: 10px; font-size: 7.5px; font-weight: 800;">
        ${elementVolumes
          .map(
            (item) => `
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="display: inline-block; width: 8px; height: 8px; background: ${item.color}; border-radius: 1.5px;"></span>
            <span style="color: #334155; text-transform: uppercase;">${item.name}</span>
          </div>
        `,
          )
          .join("")}
      </div>
    `;

    return { svg, legend };
  };

  const pieData = renderPieChart();

  // Render SVG Grouped Vertical Bar Chart (Scope vs Achieved)
  const renderBarChart = () => {
    if (elementVolumes.length === 0) {
      return `
        <div style="margin-top: 10px; background: #fafbfd; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; color: #94a3b8; font-size: 8.5px; font-style: italic;">
          No element quantity comparison metrics logged for this level.
        </div>
      `;
    }

    const chartW = 720;
    const chartH = 100;
    const baselineY = 78;
    const maxVal = Math.max(...elementVolumes.map((item) => item.scope), 10);
    const slotW = chartW / (elementVolumes.length || 1);
    const barW = Math.min(22, slotW * 0.32);

    const barsSvg = elementVolumes
      .map((item, idx) => {
        const slotCenterX = idx * slotW + slotW / 2;
        const scopeH = maxVal > 0 ? (item.scope / maxVal) * 58 : 0;
        const achVal = (item.scope * item.completion) / 100;
        const achH = maxVal > 0 ? (achVal / maxVal) * 58 : 0;

        const scopeX = slotCenterX - barW - 2;
        const scopeY = baselineY - scopeH;
        const achX = slotCenterX + 2;
        const achY = baselineY - achH;

        return `
          <!-- Scope Bar (Blue) -->
          <rect x="${scopeX.toFixed(1)}" y="${scopeY.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(scopeH, 1).toFixed(1)}" rx="1.5" fill="#3b82f6" />
          <!-- Achieved Bar (Orange) -->
          <rect x="${achX.toFixed(1)}" y="${achY.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(achH, 1).toFixed(1)}" rx="1.5" fill="#f97316" />
          <!-- X-Axis Label -->
          <text x="${slotCenterX.toFixed(1)}" y="${(baselineY + 14).toFixed(1)}" text-anchor="middle" font-size="8" font-weight="700" fill="#475569" font-family="-apple-system, sans-serif" letter-spacing="0.3">${item.name}</text>
        `;
      })
      .join("");

    return `
      <div style="margin-top: 10px; background: #fafbfd; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 16px; position: relative;">
        <!-- Legend at Top Right -->
        <div style="display: flex; justify-content: flex-end; align-items: center; gap: 14px; font-size: 7.5px; font-weight: 800; margin-bottom: 2px;">
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="display: inline-block; width: 9px; height: 9px; background: #3b82f6; border-radius: 2px;"></span>
            <span style="color: #475569; letter-spacing: 0.5px;">SCOPE</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="display: inline-block; width: 9px; height: 9px; background: #f97316; border-radius: 2px;"></span>
            <span style="color: #475569; letter-spacing: 0.5px;">ACHIEVED</span>
          </div>
        </div>

        <!-- Grouped Bar Chart SVG -->
        <svg width="100%" height="${chartH}" viewBox="0 0 ${chartW} ${chartH}" style="display: block; overflow: visible;">
          <line x1="20" y1="${baselineY}" x2="${chartW - 20}" y2="${baselineY}" stroke="#cbd5e1" stroke-width="1.2" />
          ${barsSvg}
        </svg>
      </div>
    `;
  };

  const volumeRowsHtml =
    elementVolumes.length > 0
      ? elementVolumes
          .map((item) => {
            return `
            <tr>
              <td style="font-weight: 800; color: #0f172a; text-transform: uppercase;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="display: inline-block; width: 3px; height: 13px; background: ${item.color}; border-radius: 1px; shrink: 0;"></span>
                  <span>${item.name}</span>
                </div>
              </td>
              <td style="font-family: monospace; font-weight: 700; color: #1e293b;">${item.scope.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
              <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${item.completion}%</td>
            </tr>
          `;
          })
          .join("")
      : `
        <tr>
          <td colspan="3" style="text-align: center; color: #64748b; padding: 18px; font-weight: 600;">
            No quantity data recorded for this level.
          </td>
        </tr>
      `;

  slidesHtml.push(`
    <div class="pdf-sheet">
      <div>
        ${renderHeader(`${selectedLevel} — QUANTITY SUMMARY`)}
        
        <!-- Top Half: Table and Pie Chart -->
        <div style="display: flex; gap: 16px; align-items: stretch; margin-top: 8px;">
          <!-- Left Table (50% width) -->
          <div style="flex: 1.1;">
            <div style="font-size: 10px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 6px; letter-spacing: -0.2px;">
              ${selectedLevel} FLOOR CONCRETE CHART
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 38%;">ELEMENT</th>
                  <th style="width: 32%;">SCOPE (CUM)</th>
                  <th style="width: 30%;">% COMPLETION</th>
                </tr>
              </thead>
              <tbody>
                ${volumeRowsHtml}
                ${
                  elementVolumes.length > 0
                    ? `
                  <tr style="background: #f8fafc; font-weight: 900; border-top: 2px solid #cbd5e1;">
                    <td style="font-size: 8.5px; color: #0f172a; text-transform: uppercase; font-weight: 900;">TOTAL</td>
                    <td style="font-family: monospace; font-size: 9px; color: #0f172a; font-weight: 900;">${calcTotalScope.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                    <td style="font-family: monospace; font-size: 9px; color: #0f172a; font-weight: 900;">${calcAvgCompletion}%</td>
                  </tr>
                `
                    : ""
                }
              </tbody>
            </table>
          </div>

          <!-- Right Pie Chart Card (50% width) -->
          <div style="flex: 0.9; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; display: flex; flex-direction: column; justify-content: space-between;">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
              ${pieData.svg}
              ${pieData.legend}
            </div>
            <div style="text-align: center; font-size: 8px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-top: 6px; letter-spacing: 0.5px;">
              ${selectedLevel} FLOOR CONCRETE CHART
            </div>
          </div>
        </div>

        <!-- Bottom Half: Grouped Vertical Bar Chart -->
        ${renderBarChart()}
      </div>
      ${renderFooter(slidesHtml.length + 1)}
    </div>
  `);

  // =========================================================================
  // HELPER FOR MULTI-PAGE STRUCTURAL ELEMENTS SCHEDULES
  // =========================================================================
  function renderPaginatedElements(
    typeLabel: string,
    singularLabel: string,
    elements: any[],
    layoutImg?: string,
    layoutDrawingTitle?: string,
    showElementsTable: boolean = true,
  ) {
    if (showElementsTable && elements.length > 0) {
      const ROWS_PER_PAGE = isPortrait ? 32 : 26;
      const totalPages = Math.ceil(elements.length / ROWS_PER_PAGE);

      let runningTotalCalc = 0;
      let runningTotalAch = 0;

      elements.forEach((el) => {
        const calcVol = parseFloat(String(el.calculatedVolume || el.volume || 0)) || 0;
        const achVol = parseFloat(String(el.achievedVolume ?? el.completedVolume ?? 0)) || 0;
        runningTotalCalc += calcVol;
        runningTotalAch += achVol;
      });

      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        const pageElements = elements.slice(pageIdx * ROWS_PER_PAGE, (pageIdx + 1) * ROWS_PER_PAGE);
        const isFirst = pageIdx === 0;
        const isLast = pageIdx === totalPages - 1;

        const pageTitle = isFirst
          ? `${selectedLevel} — ${singularLabel.toUpperCase()} ELEMENTS STATUS`
          : `${selectedLevel} — ${typeLabel.toUpperCase()} STATUS (CONT'D)`;

        const rowsHtml = pageElements
          .map((el) => {
            const calcVol = parseFloat(String(el.calculatedVolume || el.volume || 0)) || 0;
            const achVol = parseFloat(String(el.achievedVolume ?? el.completedVolume ?? 0)) || 0;

            let compPct = calcVol > 0 ? Math.round((achVol / calcVol) * 100) : Number(el.completionPercentage || el.completion || 0);
            compPct = Math.min(100, Math.max(0, compPct));

            const rawStatus = (el.status || el.qaStatus || el.inspectionStatus || "PENDING").toString().trim();
            const normalizedStatus = rawStatus.toUpperCase().replace(/\s+/g, "_");
            const statusLabel = rawStatus.replace(/_/g, " ").toUpperCase();

            let badgeBg = "#f8fafc";
            let badgeColor = "#475569";
            let badgeBorder = "#cbd5e1";
            let barColor = compPct > 0 ? "#3b82f6" : "#cbd5e1";

            if (normalizedStatus.includes("APPROV") || normalizedStatus === "COMPLETED" || normalizedStatus === "PASS") {
              badgeBg = "#ecfdf5";
              badgeColor = "#059669";
              badgeBorder = "#a7f3d0";
              barColor = "#16a34a";
            } else if (normalizedStatus === "POURED" || normalizedStatus.includes("CAST")) {
              badgeBg = "#ecfeff";
              badgeColor = "#0891b2";
              badgeBorder = "#a5f3fc";
              barColor = "#06b6d4";
            } else if (normalizedStatus.includes("READY")) {
              badgeBg = "#e0e7ff";
              badgeColor = "#4338ca";
              badgeBorder = "#c7d2fe";
              barColor = "#6366f1";
            } else if (normalizedStatus.includes("INSPECT")) {
              badgeBg = "#f5f3ff";
              badgeColor = "#7c3aed";
              badgeBorder = "#ddd6fe";
              barColor = "#8b5cf6";
            } else if (normalizedStatus.includes("PROGRESS")) {
              badgeBg = "#eff6ff";
              badgeColor = "#2563eb";
              badgeBorder = "#bfdbfe";
              barColor = "#3b82f6";
            } else if (normalizedStatus.includes("REJECT") || normalizedStatus.includes("FAIL") || normalizedStatus.includes("NCR")) {
              badgeBg = "#fef2f2";
              badgeColor = "#dc2626";
              badgeBorder = "#fecaca";
              barColor = "#ef4444";
            } else {
              badgeBg = "#f8fafc";
              badgeColor = "#64748b";
              badgeBorder = "#e2e8f0";
              barColor = compPct > 0 ? "#3b82f6" : "#cbd5e1";
            }

            const elName = (el.elementName || el.name || el.element || el.id || "—").toUpperCase();
            const gridLoc = el.gridLocation || el.grid || el.location || "—";

            return `
              <tr>
                <td style="font-weight: 800; color: #0f172a;">${elName}</td>
                <td style="font-family: monospace; color: #475569;">${gridLoc}</td>
                <td style="font-family: monospace; font-weight: 600;">${calcVol.toFixed(2)}</td>
                <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${achVol.toFixed(2)}</td>
                <td>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                    <div style="flex: 1; height: 7px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
                      <div style="width: ${compPct}%; height: 100%; background: ${barColor}; border-radius: 999px;"></div>
                    </div>
                    <span style="font-size: 7px; font-weight: 800; font-family: monospace; min-width: 24px; text-align: right;">${compPct}%</span>
                    <span style="background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; border-radius: 4px; padding: 1.5px 7px; font-weight: 800; font-size: 7px; text-transform: uppercase; white-space: nowrap; display: inline-block;">${statusLabel}</span>
                  </div>
                </td>
              </tr>
            `;
          })
          .join("");

        const overallPct = runningTotalCalc > 0 ? Math.round((runningTotalAch / runningTotalCalc) * 100) : 0;

        slidesHtml.push(`
          <div class="pdf-sheet">
            <div>
              ${renderHeader(pageTitle)}
              
              <table class="data-table" style="margin-top: 4px;">
                <thead>
                  <tr>
                    <th style="width: 22%;">ELEMENT IDENTIFIER</th>
                    <th style="width: 20%;">GRID COORDINATE</th>
                    <th style="width: 16%;">DESIGN VOL (m³)</th>
                    <th style="width: 16%;">ACHIEVED (m³)</th>
                    <th style="width: 26%;">SURVEILLANCE / STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                  ${
                    isLast
                      ? `
                    <tr style="background: #f1f5f9; font-weight: 900; border-top: 1.5px solid #cbd5e1;">
                      <td colspan="2" style="font-size: 7.5px; color: #0f172a; text-transform: uppercase;">
                        TOTAL ${typeLabel.toUpperCase()}
                      </td>
                      <td style="font-family: monospace; font-size: 7.5px;">${runningTotalCalc.toFixed(2)}</td>
                      <td style="font-family: monospace; font-size: 7.5px; color: #0f172a;">${runningTotalAch.toFixed(2)}</td>
                      <td style="font-size: 7.5px; color: #0f172a; font-weight: 900;">
                        ${overallPct}% COMPLETION
                      </td>
                    </tr>
                  `
                      : ""
                  }
                </tbody>
              </table>
            </div>
            ${renderFooter(slidesHtml.length + 1)}
          </div>
        `);
      }
    }

    // CAD Drawing Slide
    if (layoutImg && typeof layoutImg === "string" && layoutImg.trim().length > 0) {
      slidesHtml.push(`
        <div class="pdf-sheet">
          <div>
            ${renderHeader(layoutDrawingTitle || `${typeLabel.toUpperCase()} LAYOUT &amp; INSPECTION`)}
            
            <div style="height: ${isPortrait ? "230mm" : "154mm"}; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; position: relative; margin-top: 6px;">
              <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 6px; overflow: hidden; background: #ffffff;">
                <img src="${layoutImg}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="${layoutDrawingTitle}" />
              </div>

              <!-- Integrated Spatial Blueprint Legend -->
              <div style="background: #f8fafc; border-top: 1.5px solid #e2e8f0; padding: 6px 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="display: inline-block; background: #0284c7; color: #ffffff; font-size: 7.5px; font-weight: 900; padding: 2px 7px; border-radius: 3px; letter-spacing: 0.5px; text-transform: uppercase;">
                    SPATIAL LEGEND
                  </span>
                  <span style="font-size: 7.5px; font-weight: 700; color: #475569; text-transform: uppercase;">
                    ${typeLabel.toUpperCase()} SURVEILLANCE KEY:
                  </span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="width: 9px; height: 9px; background: #fef3c7; border: 1.5px solid #d97706; border-radius: 2px; display: inline-block;"></span>
                    <span style="font-size: 7px; font-weight: 700; color: #334155;">Pending</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="width: 9px; height: 9px; background: #e0e7ff; border: 1.5px solid #4338ca; border-radius: 2px; display: inline-block;"></span>
                    <span style="font-size: 7px; font-weight: 700; color: #334155;">Rebar Active</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="width: 9px; height: 9px; background: #f3e8ff; border: 1.5px solid #7e22ce; border-radius: 2px; display: inline-block;"></span>
                    <span style="font-size: 7px; font-weight: 700; color: #334155;">Formwork Active</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="width: 9px; height: 9px; background: #fef08a; border: 1.5px solid #ca8a04; border-radius: 2px; display: inline-block;"></span>
                    <span style="font-size: 7px; font-weight: 700; color: #334155;">Ready Cast</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="width: 9px; height: 9px; background: #cffaff; border: 1.5px solid #0891b2; border-radius: 2px; display: inline-block;"></span>
                    <span style="font-size: 7px; font-weight: 700; color: #334155;">Concreted</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="width: 9px; height: 9px; background: #d1fae5; border: 1.5px solid #059669; border-radius: 2px; display: inline-block;"></span>
                    <span style="font-size: 7px; font-weight: 700; color: #059669;">QA Approved</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="width: 9px; height: 9px; background: #fee2e2; border: 1.5px solid #dc2626; border-radius: 2px; display: inline-block;"></span>
                    <span style="font-size: 7px; font-weight: 700; color: #dc2626;">QA Rejected</span>
                  </div>
                </div>
              </div>

              <div style="background: #0f172a; border-left: 5px solid #ea580c; color: #ffffff; padding: 7px 14px; font-size: 8px; font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
                <span style="letter-spacing: 0.5px; text-transform: uppercase;">
                  ${layoutDrawingTitle || `${typeLabel.toUpperCase()} LAYOUT`} &nbsp;|&nbsp; VERIFIED AS-BUILT SURVEILLANCE OVERLAY
                </span>
                <span style="color: #4ade80; font-weight: 800;">&#10003; QC CLEARANCE COMPLETE</span>
              </div>
            </div>
          </div>
          ${renderFooter(slidesHtml.length + 1)}
        </div>
      `);
    }
  }

  // =========================================================================
  // SLIDES 6-10: COLUMNS ELEMENTS & CAD LAYOUT
  // =========================================================================
  renderPaginatedElements(
    "Columns",
    "Column",
    columnElements,
    columnLayoutImg,
    "COLUMNS LAYOUT & CASTING INSPECTION",
  );

  // =========================================================================
  // SLIDES 11-16: BEAMS ELEMENTS & CAD LAYOUT
  // =========================================================================
  renderPaginatedElements(
    "Beams",
    "Beam",
    beamElements,
    beamLayoutImg,
    "BEAMS LAYOUT & REINFORCEMENT INSPECTION",
  );

  // =========================================================================
  // SLIDE 17: SLABS CAD LAYOUT (No slab elements table)
  // =========================================================================
  renderPaginatedElements(
    "Slabs",
    "Slab",
    slabElements,
    slabImg,
    "SLABS LAYOUT & CONCRETING INSPECTION",
    false,
  );

  // =========================================================================
  // SLIDE 18: MEP QA/QC CLEARANCE STATUS — PRE-CASTING
  // =========================================================================
  if (mepList.length === 0) {
    slidesHtml.push(`
      <div class="pdf-sheet">
        <div>
          ${renderHeader("MEP QA/QC CLEARANCE STATUS — PRE-CASTING")}
          
          <table class="data-table" style="margin-top: 8px;">
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">S/N</th>
                <th style="width: 25%;">SERVICE / INSTALLATION</th>
                <th style="width: 22%;">TRADE SUBCONTRACTOR</th>
                <th style="width: 12%; text-align: center;">PROGRESS %</th>
                <th style="width: 14%; text-align: center;">CLEARANCE STATUS</th>
                <th style="width: 22%;">ENGINEERING REMARKS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center; font-family: monospace;">—</td>
                <td style="font-weight: 600; color: #64748b;">No MEP service clearances recorded for this cycle</td>
                <td style="text-align: center;">—</td>
                <td style="text-align: center;">—</td>
                <td style="text-align: center;">—</td>
                <td style="text-align: center;">—</td>
              </tr>
            </tbody>
          </table>
        </div>
        ${renderFooter(slidesHtml.length + 1)}
      </div>
    `);
  } else {
    const ROWS_PER_PAGE = isPortrait ? 20 : 14;
    const totalPages = Math.ceil(mepList.length / ROWS_PER_PAGE);

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pageMep = mepList.slice(pageIdx * ROWS_PER_PAGE, (pageIdx + 1) * ROWS_PER_PAGE);
      const pageTitle =
        totalPages > 1
          ? `MEP QA/QC CLEARANCE STATUS — PRE-CASTING (PART ${pageIdx + 1} OF ${totalPages})`
          : "MEP QA/QC CLEARANCE STATUS — PRE-CASTING";

      const mepRowsHtml = pageMep
        .map((m: any, idx: number) => {
          const globalIdx = pageIdx * ROWS_PER_PAGE + idx + 1;
          return `
            <tr>
              <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(globalIdx).padStart(2, "0")}</td>
              <td style="font-weight: 800; color: #0f172a;">${m.service || m.system || m.elementService || "—"}</td>
              <td>${m.subcontractor || m.trade || "—"}</td>
              <td style="font-family: monospace; font-weight: 700; text-align: center;">${m.completionPct !== undefined ? m.completionPct : 0}%</td>
              <td style="text-align: center;"><span class="badge-approved">${m.status || "CLEARED"}</span></td>
              <td style="font-size: 7.5px; color: #475569;">${m.remarks || "—"}</td>
            </tr>
          `;
        })
        .join("");

      slidesHtml.push(`
        <div class="pdf-sheet">
          <div>
            ${renderHeader(pageTitle)}
            
            <table class="data-table" style="margin-top: 8px;">
              <thead>
                <tr>
                  <th style="width: 5%; text-align: center;">S/N</th>
                  <th style="width: 25%;">SERVICE / INSTALLATION</th>
                  <th style="width: 22%;">TRADE SUBCONTRACTOR</th>
                  <th style="width: 12%; text-align: center;">PROGRESS %</th>
                  <th style="width: 14%; text-align: center;">CLEARANCE STATUS</th>
                  <th style="width: 22%;">ENGINEERING REMARKS</th>
                </tr>
              </thead>
              <tbody>
                ${mepRowsHtml}
              </tbody>
            </table>
          </div>
          ${renderFooter(slidesHtml.length + 1)}
        </div>
      `);
    }
  }

  // =========================================================================
  // SLIDE 19: MATERIAL DELIVERY LOG & TRACEABILITY
  // =========================================================================
  if (deliveriesList.length === 0) {
    slidesHtml.push(`
      <div class="pdf-sheet">
        <div>
          ${renderHeader("MATERIAL DELIVERY LOG & TRACEABILITY")}
          
          <table class="data-table" style="margin-top: 8px;">
            <thead>
              <tr>
                <th style="width: 4%; text-align: center;">S/N</th>
                <th style="width: 12%;">DELIVERY DATE</th>
                <th style="width: 27%;">MATERIAL DESCRIPTION</th>
                <th style="width: 17%;">SOURCE / SUPPLIER</th>
                <th style="width: 11%; text-align: right;">DELIVERED</th>
                <th style="width: 11%; text-align: right; color: #10b981;">APPROVED</th>
                <th style="width: 8%; text-align: right; color: #ef4444;">REJECTED</th>
                <th style="width: 10%; text-align: center;">QC STATUS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="8" style="text-align: center; color: #64748b; padding: 24px;">
                  Zero material deliveries recorded during this surveillance period.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        ${renderFooter(slidesHtml.length + 1)}
      </div>
    `);
  } else {
    const ROWS_PER_PAGE = isPortrait ? 20 : 14;
    const totalPages = Math.ceil(deliveriesList.length / ROWS_PER_PAGE);

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pageDeliveries = deliveriesList.slice(pageIdx * ROWS_PER_PAGE, (pageIdx + 1) * ROWS_PER_PAGE);
      const pageTitle =
        totalPages > 1
          ? `MATERIAL DELIVERY LOG & TRACEABILITY (PART ${pageIdx + 1} OF ${totalPages})`
          : "MATERIAL DELIVERY LOG & TRACEABILITY";

      const deliveriesRowsHtml = pageDeliveries
        .map((d: any, idx: number) => {
          const globalIdx = pageIdx * ROWS_PER_PAGE + idx + 1;
          const st = String(d.qcStatus || d.status || "APPROVED").toUpperCase();
          const badgeColor = st.includes("REJECT") ? "#dc2626" : st.includes("NOTED") ? "#0284c7" : "#16a34a";
          const unit = d.unit || "units";
          const acc = d.quantityAccepted !== undefined ? d.quantityAccepted : d.quantity || 0;
          const rej = d.quantityRejected ?? 0;
          const total = d.quantityReceived ?? d.quantity ?? 0;

          return `
            <tr>
              <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(globalIdx).padStart(2, "0")}</td>
              <td style="font-family: monospace; font-weight: 600;">${formatDateYMD(d.deliveryDate || d.date) || "—"}</td>
              <td style="font-weight: 800; color: #0f172a;">${d.materialDescription || d.materialName || d.name || "Material"}</td>
              <td>${d.supplier || d.supplierName || "—"}</td>
              <td style="font-family: monospace; font-weight: 700; text-align: right;">${total} <span style="font-size: 7px; color: #64748b; font-weight: normal;">${unit}</span></td>
              <td style="font-family: monospace; font-weight: 800; text-align: right; color: #059669;">${acc} <span style="font-size: 7px; color: #10b981; font-weight: normal;">${unit}</span></td>
              <td style="font-family: monospace; font-weight: 800; text-align: right; color: ${rej > 0 ? "#dc2626" : "#94a3b8"};">${rej} <span style="font-size: 7px; color: ${rej > 0 ? "#ef4444" : "#cbd5e1"}; font-weight: normal;">${unit}</span></td>
              <td style="text-align: center; font-weight: 800; color: ${badgeColor}; font-size: 7.5px;">${st}</td>
            </tr>
          `;
        })
        .join("");

      slidesHtml.push(`
        <div class="pdf-sheet">
          <div>
            ${renderHeader(pageTitle)}
            
            <table class="data-table" style="margin-top: 8px;">
              <thead>
                <tr>
                  <th style="width: 4%; text-align: center;">S/N</th>
                  <th style="width: 12%;">DELIVERY DATE</th>
                  <th style="width: 27%;">MATERIAL DESCRIPTION</th>
                  <th style="width: 17%;">SOURCE / SUPPLIER</th>
                  <th style="width: 11%; text-align: right;">DELIVERED</th>
                  <th style="width: 11%; text-align: right; color: #10b981;">APPROVED</th>
                  <th style="width: 8%; text-align: right; color: #ef4444;">REJECTED</th>
                  <th style="width: 10%; text-align: center;">QC STATUS</th>
                </tr>
              </thead>
              <tbody>
                ${deliveriesRowsHtml}
              </tbody>
            </table>
          </div>
          ${renderFooter(slidesHtml.length + 1)}
        </div>
      `);
    }
  }

  // =========================================================================
  // SLIDE 20: APPENDIX: NCR REGISTER
  // =========================================================================
  if (showNcrs) {
    if (ncrList.length === 0) {
      slidesHtml.push(`
        <div class="pdf-sheet">
          <div>
            ${renderHeader("APPENDIX: NCR REGISTER")}
            
            <table class="data-table" style="margin-top: 8px;">
              <thead>
                <tr>
                  <th style="width: 16%;">NCR NO.</th>
                  <th style="width: 15%;">LOCATION / TRADE</th>
                  <th style="width: 45%;">DESCRIPTION</th>
                  <th style="width: 10%;">DATE RAISED</th>
                  <th style="width: 10%;">TARGET DATE</th>
                  <th style="width: 8%; text-align: center;">STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colspan="6" style="text-align: center; color: #166534; padding: 24px; font-weight: 800;">
                    &#10003; ZERO ACTIVE NON-CONFORMANCE REPORTS LOGGED
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          ${renderFooter(slidesHtml.length + 1)}
        </div>
      `);
    } else {
      const ROWS_PER_PAGE = isPortrait ? 15 : 10;
      const totalPages = Math.ceil(ncrList.length / ROWS_PER_PAGE);

      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        const pageNcrs = ncrList.slice(pageIdx * ROWS_PER_PAGE, (pageIdx + 1) * ROWS_PER_PAGE);
        const pageTitle =
          totalPages > 1
            ? `APPENDIX: NCR REGISTER (PART ${pageIdx + 1} OF ${totalPages})`
            : "APPENDIX: NCR REGISTER";

        const ncrRowsHtml = pageNcrs
          .map((n: any) => {
            const st = String(n.status || "OPEN").toUpperCase();
            const isClosed = st === "CLOSED" || st === "RECTIFIED" || st === "RESOLVED";
            const desc = Array.isArray(n.descriptionItems) ? n.descriptionItems.join(", ") : n.description || "Field variance logged";

            return `
              <tr>
                <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${n.refNo || n.ncrNumber || "NCR"}</td>
                <td style="font-weight: 700;">${n.elementLevel || n.location || "Structural Component"}</td>
                <td style="font-size: 7.5px; line-height: 1.4; color: #334155;">${desc}</td>
                <td style="font-family: monospace; font-weight: 600;">${formatDateYMD(n.dateIdentified || n.dateFound || n.createdAt)}</td>
                <td style="font-family: monospace; font-weight: 600;">${formatDateYMD(n.targetFixDate || n.signDate || reportDate)}</td>
                <td style="text-align: center; font-weight: 900; color: ${isClosed ? "#16a34a" : "#dc2626"}; font-size: 7.5px;">${isClosed ? "CLOSED" : "OPEN"}</td>
              </tr>
            `;
          })
          .join("");

        slidesHtml.push(`
          <div class="pdf-sheet">
            <div>
              ${renderHeader(pageTitle)}
              
              <table class="data-table" style="margin-top: 8px;">
                <thead>
                  <tr>
                    <th style="width: 16%;">NCR NO.</th>
                    <th style="width: 15%;">LOCATION / TRADE</th>
                    <th style="width: 45%;">DESCRIPTION</th>
                    <th style="width: 10%;">DATE RAISED</th>
                    <th style="width: 10%;">TARGET DATE</th>
                    <th style="width: 8%; text-align: center;">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  ${ncrRowsHtml}
                </tbody>
              </table>
            </div>
            ${renderFooter(slidesHtml.length + 1)}
          </div>
        `);
      }
    }
  }

  // =========================================================================
  // SLIDE 21: APPENDIX: SITE INSTRUCTION REGISTER
  // =========================================================================
  if (includeSiteInstructions) {
    const totalSIs = siteInstructionsList.length;
    const closedCount = siteInstructionsList.filter((si: any) => {
      const st = String(si.status || "").toUpperCase();
      return (
        st.includes("CLOSE") ||
        st.includes("COMPLET") ||
        st.includes("COMPLI") ||
        Boolean(si.closedAt)
      );
    }).length;
    const overdueCount = siteInstructionsList.filter((si: any) => {
      const st = String(si.status || "").toUpperCase();
      const isClosed =
        st.includes("CLOSE") ||
        st.includes("COMPLET") ||
        st.includes("COMPLI") ||
        Boolean(si.closedAt);
      if (isClosed) return false;
      if (st.includes("OVERDUE")) return true;
      const dueVal =
        si.complianceDeadline || (si as any).dueDate || (si as any).targetDate;
      if (!dueVal) return false;
      const dueTime = new Date(dueVal).getTime();
      const refTime = reportDate ? new Date(reportDate).getTime() : Date.now();
      return !isNaN(dueTime) && dueTime < refTime;
    }).length;
    const openActiveCount = totalSIs - closedCount;

    if (siteInstructionsList.length === 0) {
      slidesHtml.push(`
        <div class="pdf-sheet">
          <div>
            ${renderHeader("APPENDIX: SITE INSTRUCTION REGISTER")}

            <table class="data-table" style="margin-top: 8px;">
              <thead>
                <tr>
                  <th style="width: 13%;">SI NO.</th>
                  <th style="width: 41%;">DIRECTIVE &amp; SCOPE OF WORK</th>
                  <th style="width: 18%;">RECIPIENT &amp; TRADE</th>
                  <th style="width: 9%; text-align: center;">ISSUE DATE</th>
                  <th style="width: 9%; text-align: center;">DUE DATE</th>
                  <th style="width: 10%; text-align: center;">COMPLIANCE STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colspan="6" style="text-align: center; color: #64748b; padding: 24px;">
                    No contractual site instructions issued during this reporting period.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          ${renderFooter(slidesHtml.length + 1)}
        </div>
      `);
    } else {
      const ROWS_PER_PAGE = isPortrait ? 9 : 6;
      const totalPages = Math.ceil(siteInstructionsList.length / ROWS_PER_PAGE);

      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        const pageSIs = siteInstructionsList.slice(pageIdx * ROWS_PER_PAGE, (pageIdx + 1) * ROWS_PER_PAGE);
        const pageTitle =
          totalPages > 1
            ? `APPENDIX: SITE INSTRUCTION REGISTER (PART ${pageIdx + 1} OF ${totalPages})`
            : "APPENDIX: SITE INSTRUCTION REGISTER";

        const siRowsHtml = pageSIs
          .map((si: any, idx: number) => {
            const globalIdx = pageIdx * ROWS_PER_PAGE + idx;
            const st = String(si.status || "ISSUED").trim().toUpperCase();
            const isClosed =
              st.includes("CLOSE") ||
              st.includes("COMPLET") ||
              st.includes("COMPLI") ||
              Boolean(si.closedAt);

            const dueVal =
              si.complianceDeadline ||
              (si as any).dueDate ||
              (si as any).targetDate;
            let isOverdue = false;
            if (!isClosed && dueVal) {
              const dueTime = new Date(dueVal).getTime();
              const refTime = reportDate
                ? new Date(reportDate).getTime()
                : Date.now();
              if (!isNaN(dueTime) && dueTime < refTime) {
                isOverdue = true;
              }
            }
            if (st.includes("OVERDUE")) isOverdue = true;

            let displayStatus = "ISSUED";
            let statusColor = "#d97706";
            if (isClosed) {
              displayStatus = "CLOSED";
              statusColor = "#16a34a";
            } else if (isOverdue) {
              displayStatus = "OVERDUE";
              statusColor = "#dc2626";
            } else if (
              st.includes("ACKNOW") ||
              st.includes("PROGRESS") ||
              st.includes("REVIEW")
            ) {
              displayStatus = "IN PROGRESS";
              statusColor = "#2563eb";
            } else if (st) {
              displayStatus = st.replace(/_/g, " ");
              statusColor = "#d97706";
            }

            const titleText =
              si.title ||
              si.subject ||
              "Formal Notice of Defect Rectification";
            const directiveText =
              si.instructionText ||
              si.issueSummary ||
              (si as any).directiveText ||
              (si as any).description ||
              "";
            const stopWorkBadge = si.stopWorkOrdered
              ? `<span style="display: inline-block; background: #dc2626; color: #ffffff; font-size: 6.5px; font-weight: 900; padding: 1.5px 4px; border-radius: 2px; margin-bottom: 2px; letter-spacing: 0.5px;">STOP WORK ORDERED</span><br/>`
              : "";
            const locBadge =
              si.location || si.elementName
                ? `<div style="font-size: 6.5px; color: #64748b; font-weight: 600; margin-top: 2px;">Zone: ${si.location || "Site"}${si.elementName ? ` &bull; ${si.elementName}` : ""}</div>`
                : "";

            const recipientPerson =
              si.recipientName ||
              (si as any).assignedToName ||
              (si as any).recipient ||
              "";
            const recipientOrg =
              si.contractorName ||
              (si as any).subcontractorCompany ||
              (si as any).subcontractor ||
              (si as any).contractor ||
              "";
            const recipientDisplay =
              recipientPerson &&
              recipientOrg &&
              recipientPerson !== recipientOrg
                ? `<div style="font-weight: 700; color: #0f172a;">${recipientPerson}</div><div style="font-size: 6.5px; color: #64748b; text-transform: uppercase;">${recipientOrg}</div>`
                : `<div style="font-weight: 700; color: #0f172a; text-transform: uppercase;">${recipientPerson || recipientOrg || "Main Contractor"}</div>`;

            return `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="font-family: monospace; font-weight: 800; color: #0f172a; vertical-align: top; padding: 5px 6px;">
                  ${si.instructionNumber || si.siNumber || si.id || `SI-${String(globalIdx + 1).padStart(3, "0")}`}
                </td>
                <td style="vertical-align: top; padding: 5px 6px;">
                  ${stopWorkBadge}
                  <div style="font-weight: 700; font-size: 7.5px; color: #0f172a; line-height: 1.35;">${titleText}</div>
                  ${directiveText ? `<div style="font-size: 7px; color: #475569; margin-top: 2px; line-height: 1.35; white-space: pre-line;">${directiveText}</div>` : ""}
                  ${locBadge}
                </td>
                <td style="font-size: 7.5px; vertical-align: top; padding: 5px 6px;">
                  ${recipientDisplay}
                  ${si.recipientRole ? `<div style="font-size: 6.5px; color: #94a3b8;">${si.recipientRole}</div>` : ""}
                </td>
                <td style="font-family: monospace; font-weight: 600; text-align: center; vertical-align: top; padding: 5px 6px; font-size: 7px;">
                  ${formatDateYMD(si.issuedDate || (si as any).date || si.createdAt || si.signedBy?.signedAt) || "—"}
                </td>
                <td style="font-family: monospace; font-weight: 600; text-align: center; vertical-align: top; padding: 5px 6px; font-size: 7px;">
                  ${formatDateYMD(dueVal) || "Immediate"}
                </td>
                <td style="text-align: center; font-weight: 900; color: ${statusColor}; font-size: 7.5px; vertical-align: top; padding: 5px 6px; text-transform: uppercase;">
                  ${displayStatus}
                </td>
              </tr>
            `;
          })
          .join("");

        const kpiRibbonHtml =
          pageIdx === 0
            ? `
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 8px; margin-bottom: 8px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px;">
              <div style="font-size: 7px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Total Directives</div>
              <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-top: 1px;">${totalSIs}</div>
            </div>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 6px 10px;">
              <div style="font-size: 7px; font-weight: 800; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.5px;">Overdue Directives</div>
              <div style="font-size: 13px; font-weight: 900; color: #dc2626; margin-top: 1px;">${overdueCount}</div>
            </div>
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 6px 10px;">
              <div style="font-size: 7px; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px;">Open / In Progress</div>
              <div style="font-size: 13px; font-weight: 900; color: #d97706; margin-top: 1px;">${openActiveCount}</div>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 6px 10px;">
              <div style="font-size: 7px; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px;">Closed &amp; Complied</div>
              <div style="font-size: 13px; font-weight: 900; color: #16a34a; margin-top: 1px;">${closedCount}</div>
            </div>
          </div>
        `
            : "";

        slidesHtml.push(`
          <div class="pdf-sheet">
            <div>
              ${renderHeader(pageTitle)}
              ${kpiRibbonHtml}
              
              <table class="data-table" style="margin-top: ${pageIdx === 0 ? "4px" : "8px"};">
                <thead>
                  <tr>
                    <th style="width: 13%;">SI NO.</th>
                    <th style="width: 41%;">DIRECTIVE &amp; SCOPE OF WORK</th>
                    <th style="width: 18%;">RECIPIENT &amp; TRADE</th>
                    <th style="width: 9%; text-align: center;">ISSUE DATE</th>
                    <th style="width: 9%; text-align: center;">DUE DATE</th>
                    <th style="width: 10%; text-align: center;">COMPLIANCE STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  ${siRowsHtml}
                </tbody>
              </table>
            </div>
            ${renderFooter(slidesHtml.length + 1)}
          </div>
        `);
      }
    }
  }

  // =========================================================================
  // SLIDE 22: APPENDIX: SITE COMMENTS / OBSERVATION LOG
  // =========================================================================
  if (showSiteComments) {
    if (commentsList.length === 0) {
      slidesHtml.push(`
        <div class="pdf-sheet">
          <div>
            ${renderHeader("APPENDIX: SITE COMMENTS / OBSERVATION LOG")}
            
            <table class="data-table" style="margin-top: 8px;">
              <thead>
                <tr>
                  <th style="width: 4%; text-align: center;">S/N</th>
                  <th style="width: 10%;">DATE</th>
                  <th style="width: 16%;">LOCATION / LEVEL</th>
                  <th style="width: 14%;">STRUCTURAL ELEMENT</th>
                  <th style="width: 34%;">ROUTINE QUALITY OBSERVATIONS</th>
                  <th style="width: 14%;">INSPECTOR / VENDOR CHECK</th>
                  <th style="width: 8%; text-align: center;">STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colspan="7" style="text-align: center; color: #64748b; padding: 24px;">
                    Zero outstanding quality observations recorded for this surveillance cycle.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          ${renderFooter(slidesHtml.length + 1)}
        </div>
      `);
    } else {
      const ROWS_PER_PAGE = isPortrait ? 16 : 12;
      const totalPages = Math.ceil(commentsList.length / ROWS_PER_PAGE);

      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        const pageComments = commentsList.slice(pageIdx * ROWS_PER_PAGE, (pageIdx + 1) * ROWS_PER_PAGE);
        const pageTitle =
          totalPages > 1
            ? `APPENDIX: SITE COMMENTS / OBSERVATION LOG (PART ${pageIdx + 1} OF ${totalPages})`
            : "APPENDIX: SITE COMMENTS / OBSERVATION LOG";

        const commentsRowsHtml = pageComments
          .map((c: any, idx: number) => {
            const globalIdx = pageIdx * ROWS_PER_PAGE + idx + 1;
            const rawSt = String(c.status || "Non-Compliant").trim();
            const normSt = rawSt.toLowerCase().replace(/[\s-]+/g, "_");

            const isNonCompliant =
              normSt.includes("non_comp") ||
              normSt.includes("noncomp") ||
              normSt.includes("defect") ||
              normSt.includes("fail") ||
              normSt.includes("reject") ||
              normSt === "open";

            const isResolved =
              normSt.includes("rectif") ||
              normSt.includes("fixed") ||
              normSt.includes("closed") ||
              normSt.includes("pass") ||
              normSt.includes("approv") ||
              (normSt.includes("comp") && !isNonCompliant);

            const isPending =
              normSt.includes("pend") ||
              normSt.includes("prog") ||
              normSt.includes("review") ||
              normSt.includes("action");

            const color = isNonCompliant
              ? "#dc2626"
              : isResolved
                ? "#16a34a"
                : isPending
                  ? "#d97706"
                  : "#dc2626";

            return `
              <tr>
                <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(globalIdx).padStart(2, "0")}</td>
                <td style="font-family: monospace; font-weight: 600;">${formatDateYMD(c.date || c.createdAt) || "—"}</td>
                <td>${c.level || selectedLevel}${c.location ? ` &bull; ${c.location}` : ""}</td>
                <td style="font-weight: 700;">${c.element || "—"}</td>
                <td style="font-size: 7.5px; line-height: 1.4; color: #334155; white-space: pre-line;">${(c.comments || c.text || "—").replace(/<br\s*\/?>/gi, "\n")}</td>
                <td>${c.inspector || compilerName}${c.vendorCheck ? ` / ${c.vendorCheck}` : ""}</td>
                <td style="text-align: center; font-weight: 800; color: ${color}; font-size: 7.5px;">${rawSt}</td>
              </tr>
            `;
          })
          .join("");

        slidesHtml.push(`
          <div class="pdf-sheet">
            <div>
              ${renderHeader(pageTitle)}
              
              <table class="data-table" style="margin-top: 8px;">
                <thead>
                  <tr>
                    <th style="width: 4%; text-align: center;">S/N</th>
                    <th style="width: 10%;">DATE</th>
                    <th style="width: 16%;">LOCATION / LEVEL</th>
                    <th style="width: 14%;">STRUCTURAL ELEMENT</th>
                    <th style="width: 34%;">ROUTINE QUALITY OBSERVATIONS</th>
                    <th style="width: 14%;">INSPECTOR / VENDOR CHECK</th>
                    <th style="width: 8%; text-align: center;">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  ${commentsRowsHtml}
                </tbody>
              </table>
            </div>
            ${renderFooter(slidesHtml.length + 1)}
          </div>
        `);
      }
    }
  }

  // =========================================================================
  // SLIDES 23-30: PICTORIAL SURVEILLANCE RECORDS (1 PHOTO PER SLIDE)
  // =========================================================================
  if (validPictorials.length > 0) {
    validPictorials.forEach((p: any, idx: number) => {
      const url = typeof p === "string" ? p : p.url;
      const caption =
        typeof p === "object" && p.caption && p.caption.trim().length > 0
          ? p.caption
          : `SPECIMEN ${idx + 1} | AS-BUILT SITE QUALITY RECORD`;

      slidesHtml.push(`
        <div class="pdf-sheet">
          <div>
            ${renderHeader(`PICTORIAL SURVEILLANCE RECORD (SPECIMEN ${idx + 1} OF ${validPictorials.length})`)}
            
            <div style="height: ${isPortrait ? "230mm" : "154mm"}; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; position: relative; margin-top: 6px;">
              <!-- Photo Viewport -->
              <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 6px; overflow: hidden; background: #ffffff;">
                <img src="${url}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 2px;" alt="${caption}" />
              </div>

              <!-- Dark Caption Ribbon -->
              <div style="background: #0f172a; border-left: 5px solid #ea580c; color: #ffffff; padding: 10px 16px; font-size: 8.5px; font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
                <span style="letter-spacing: 0.3px; text-transform: uppercase;">
                  ${caption}
                </span>
                <span style="color: #94a3b8; font-family: monospace; font-size: 7.5px;">
                  SPECIMEN ${idx + 1} / ${validPictorials.length}
                </span>
              </div>
            </div>
          </div>
          ${renderFooter(slidesHtml.length + 1)}
        </div>
      `);
    });
  }

  // =========================================================================
  // FINAL SLIDE: BACK SIGN-OFF / QUALITY EXCELLENCE VERIFICATION REPORT
  // =========================================================================
  const inspectionStatusText =
    openFindingsCount > 0
      ? `${openFindingsCount} Holds Active / Pending Sign-off`
      : "All Quality Checks Conforming & Approved";

  const executiveOverviewText =
    report.synopsis ||
    report.executiveSummary ||
    "";

  if (isPortrait) {
    slidesHtml.push(`
      <div class="pdf-sheet" style="padding: 0; display: flex; flex-direction: column; height: 297mm; overflow: hidden; position: relative;">
        <!-- Top Dark Emerald Panel (~60mm height) -->
        <div style="height: 60mm; width: 100%; background: #091a18; color: #ffffff; padding: 8mm 16mm; display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #10b981;">
          <!-- Company Brand -->
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              ${
                companyLogo
                  ? `<img src="${companyLogo}" style="max-height: 40px; max-width: 140px; object-fit: contain;" alt="${companyName}" />`
                  : `
                <div style="display: flex; gap: 2.5px; align-items: flex-end; height: 18px;">
                  <span style="width: 4px; height: 10px; background: #c28b5e; border-radius: 1px;"></span>
                  <span style="width: 4px; height: 18px; background: #c28b5e; border-radius: 1px;"></span>
                  <span style="width: 4px; height: 14px; background: #c28b5e; border-radius: 1px;"></span>
                </div>
              `
              }
              <div style="font-size: 12px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.5px; text-transform: uppercase;">
                ${companyLegalName.toUpperCase()}
              </div>
            </div>
            <div style="font-size: 6.5px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 6px;">
              JQMS ENTERPRISE COMPLIANCE FRAMEWORK &bull; QUALITY ASSURANCE
            </div>
          </div>

          <!-- ISO Accreditation Box -->
          <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 14px; text-align: right;">
            <div style="font-size: 6.5px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 0.8px;">
              QUALITY MANAGEMENT SYSTEM
            </div>
            <div style="font-size: 13px; font-weight: 900; color: #ffffff; margin: 2px 0;">
              ISO 9001:2015
            </div>
            <div style="font-size: 6.5px; color: #94a3b8;">
              Civil Engineering &amp; Quality Compliance Verified
            </div>
          </div>
        </div>

        <!-- Bottom White Panel (~237mm height) -->
        <div style="flex: 1; width: 100%; background: #ffffff; padding: 12mm 16mm 10mm 16mm; display: flex; flex-direction: column; justify-content: space-between;">
          <!-- Top Section: Header & Metadata Grid -->
          <div>
            <!-- Top Header & Badging -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 9999px; font-size: 8px; font-weight: 800; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; text-transform: uppercase; letter-spacing: 0.5px;">
                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>
                AUDIT COMPLETE
              </span>
              <span style="font-size: 8px; font-family: monospace; font-weight: 700; color: #94a3b8;">
                DOC-ID: ${docRef}
              </span>
            </div>

            <!-- Main Title Group -->
            <div style="margin-bottom: 10px;">
              <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: -0.3px; line-height: 1.15; text-transform: uppercase; margin: 0 0 6px 0;">
                QUALITY EXCELLENCE<br />
                <span style="color: #047857;">VERIFICATION REPORT</span>
              </h1>
              <div style="height: 3px; width: 60px; background: #059669; border-radius: 9999px;"></div>
            </div>

            <!-- Subtitle & Location -->
            <div style="margin-bottom: 12px;">
              <h3 style="font-size: 11px; font-weight: 800; color: #1e293b; text-transform: uppercase; margin: 0 0 2px 0;">
                ${projectName.toUpperCase()} DEVELOPMENT
              </h3>
              <p style="font-size: 7.5px; color: #64748b; margin: 0;">
                Weekly Structural Quality Control, Surveillance &amp; Materials Conformance Audit
              </p>
            </div>

            <!-- Key Metadata Grid (2x2) -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 10px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; font-size: 8px; margin-bottom: 12px;">
              <div>
                <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Reporting Period</p>
                <p style="font-weight: 700; color: #1e293b; margin: 0;">${startDateStr} – ${endDateStr}</p>
              </div>
              <div>
                <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Structure Level</p>
                <p style="font-weight: 700; color: #1e293b; margin: 0;">${selectedLevel}</p>
              </div>
              <div>
                <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Inspection Status</p>
                <p style="font-weight: 700; color: ${openFindingsCount > 0 ? "#dc2626" : "#16a34a"}; margin: 0;">${inspectionStatusText}</p>
              </div>
              <div>
                <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Revision Control</p>
                <p style="font-weight: 700; color: #1e293b; margin: 0;">${revisionText}</p>
              </div>
            </div>
          </div>

          <!-- Bottom Section: Authorization Card & Legal Footer -->
          <div>
            <!-- Authorization & Sign-off Card -->
            <div style="border: 1px solid #e2e8f0; border-left: 6px solid #047857; border-radius: 8px; padding: 12px 16px; background: #ffffff; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 2px 0;">
                    Authorization &amp; Compliance Sign-Off
                  </p>
                  <h4 style="font-size: 15px; font-weight: 900; color: #0f172a; margin: 0 0 2px 0;">
                    ${compilerName}
                  </h4>
                  <p style="font-size: 8px; font-weight: 800; color: #047857; text-transform: uppercase; margin: 0;">
                    ${compilerRole}
                  </p>
                </div>
                
                <!-- Stamp / Verification Badge Indicator -->
                <div style="display: flex; align-items: center; gap: 8px;">
                  ${
                    signatureUrl
                      ? `<img src="${signatureUrl}" style="max-height: 38px; max-width: 100px; object-fit: contain;" alt="Signature" />`
                      : ""
                  }
                  <div style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgba(5, 150, 105, 0.4); display: flex; align-items: center; justify-content: center; font-size: 7px; font-weight: 900; color: #065f46; text-transform: uppercase; text-align: center; line-height: 1.15; background: #ecfdf5;">
                    VERIFIED<br />QA/QC
                  </div>
                </div>
              </div>

              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b;">
                <span>Email: <strong style="color: #334155; font-weight: 700;">${compilerEmail}</strong></span>
                <span>Issued: <strong style="color: #334155; font-weight: 700;">${formatDateYMD(reportDate)}</strong></span>
              </div>
            </div>

            <!-- Legal Footer -->
            <div style="padding-top: 8px; margin-top: 8px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; font-size: 7px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
              <span>CONFIDENTIAL | PREPARED FOR CLIENT &amp; SUPERVISING CONSULTANT</span>
              <span>PAGE ${slidesHtml.length + 1} OF ${slidesHtml.length + 1}</span>
            </div>
          </div>
        </div>
      </div>
    `);
  } else {
    slidesHtml.push(`
      <div class="pdf-sheet" style="padding: 0; display: flex; flex-direction: row; height: 210mm; overflow: hidden; position: relative;">
        <!-- Left Dark Emerald Panel (~30% width) -->
        <div style="width: 30%; background: #091a18; color: #ffffff; padding: 28mm 12mm 16mm 14mm; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <!-- Company Brand -->
            <div style="margin-bottom: 24px;">
              <div style="display: flex; align-items: flex-end; gap: 2px; margin-bottom: 6px; justify-content: center;">
                ${
                  companyLogo
                    ? `<img src="${companyLogo}" style="max-height: 150px; max-width: 200px; object-fit: contain;" alt="${companyName}" />`
                    : `
                  <div style="display: flex; gap: 3px; align-items: flex-end; height: 24px;">
                    <span style="width: 4.5px; height: 12px; background: #c28b5e; border-radius: 1px;"></span>
                    <span style="width: 4.5px; height: 22px; background: #c28b5e; border-radius: 1px;"></span>
                    <span style="width: 4.5px; height: 16px; background: #c28b5e; border-radius: 1px;"></span>
                  </div>
                `
                }
              </div>
              <div style="font-size: 13px; text-align: center; font-weight: 700; color: #FFFFFF; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 5px;">
                ${companyLegalName.toUpperCase()}
              </div>
            </div>

            <!-- ISO Accreditation Box -->
            <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 14px;">
              <div style="font-size: 7px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 0.8px;">
                QUALITY MANAGEMENT SYSTEM
              </div>
              <div style="font-size: 15px; font-weight: 900; color: #ffffff; margin: 4px 0 2px 0;">
                ISO 9001:2015
              </div>
              <div style="font-size: 7px; color: #94a3b8; line-height: 1.4;">
                Civil Engineering &amp; Quality Compliance Verified
              </div>
            </div>
          </div>

          <div style="font-size: 6.5px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
            JQMS ENTERPRISE COMPLIANCE FRAMEWORK
          </div>
        </div>

        <!-- Right White Panel (~70% width) -->
        <div style="width: 70%; background: #ffffff; padding: 16mm 16mm 12mm 16mm; display: flex; flex-direction: column; justify-content: space-between;">
          
          <!-- Top Section: Header & Metadata Grid & Scope Summary -->
          <div>
            <!-- Top Header & Badging -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 9999px; font-size: 8px; font-weight: 800; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; text-transform: uppercase; letter-spacing: 0.5px;">
                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>
                AUDIT COMPLETE
              </span>
              <span style="font-size: 8px; font-family: monospace; font-weight: 700; color: #94a3b8;">
                DOC-ID: ${docRef}
              </span>
            </div>

            <!-- Main Title Group -->
            <div style="margin-bottom: 10px;">
              <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: -0.3px; line-height: 1.15; text-transform: uppercase; margin: 0 0 6px 0;">
                QUALITY EXCELLENCE<br />
                <span style="color: #047857;">VERIFICATION REPORT</span>
              </h1>
              <div style="height: 3px; width: 60px; background: #059669; border-radius: 9999px;"></div>
            </div>

            <!-- Subtitle & Location -->
            <div style="margin-bottom: 12px;">
              <h3 style="font-size: 11px; font-weight: 800; color: #1e293b; text-transform: uppercase; margin: 0 0 2px 0;">
                ${projectName.toUpperCase()} DEVELOPMENT
              </h3>
              <p style="font-size: 7.5px; color: #64748b; margin: 0;">
                Weekly Structural Quality Control, Surveillance &amp; Materials Conformance Audit
              </p>
            </div>

            <!-- Key Metadata Grid (2x2) -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 10px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; font-size: 8px; margin-bottom: 12px;">
              <div>
                <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Reporting Period</p>
                <p style="font-weight: 700; color: #1e293b; margin: 0;">${startDateStr} – ${endDateStr}</p>
              </div>
              <div>
                <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Structure Level</p>
                <p style="font-weight: 700; color: #1e293b; margin: 0;">${selectedLevel}</p>
              </div>
              <div>
                <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Inspection Status</p>
                <p style="font-weight: 700; color: ${openFindingsCount > 0 ? "#dc2626" : "#16a34a"}; margin: 0;">${inspectionStatusText}</p>
              </div>
              <div>
                <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Revision Control</p>
                <p style="font-weight: 700; color: #1e293b; margin: 0;">${revisionText}</p>
              </div>
            </div>
          </div>

          <!-- Bottom Section: Authorization Card & Legal Footer -->
          <div>
            <!-- Authorization & Sign-off Card -->
            <div style="border: 1px solid #e2e8f0; border-left: 6px solid #047857; border-radius: 8px; padding: 12px 16px; background: #ffffff; position: relative; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 2px 0;">
                    Authorization &amp; Compliance Sign-Off
                  </p>
                  <h4 style="font-size: 15px; font-weight: 900; color: #0f172a; margin: 0 0 2px 0;">
                    ${compilerName}
                  </h4>
                  <p style="font-size: 8px; font-weight: 800; color: #047857; text-transform: uppercase; margin: 0;">
                    ${compilerRole}
                  </p>
                </div>
                
                <!-- Stamp / Verification Badge Indicator -->
                <div style="display: flex; align-items: center; gap: 8px;">
                  ${
                    signatureUrl
                      ? `<img src="${signatureUrl}" style="max-height: 38px; max-width: 100px; object-fit: contain;" alt="Signature" />`
                      : ""
                  }
                  <div style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgba(5, 150, 105, 0.4); display: flex; align-items: center; justify-content: center; font-size: 7px; font-weight: 900; color: #065f46; text-transform: uppercase; text-align: center; line-height: 1.15; background: #ecfdf5;">
                    VERIFIED<br />QA/QC
                  </div>
                </div>
              </div>

              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b;">
                <span>Email: <strong style="color: #334155; font-weight: 700;">${compilerEmail}</strong></span>
                <span>Issued: <strong style="color: #334155; font-weight: 700;">${formatDateYMD(reportDate)}</strong></span>
              </div>
            </div>

            <!-- Legal Footer -->
            <div style="padding-top: 8px; margin-top: 8px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; font-size: 7px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
              <span>CONFIDENTIAL | PREPARED FOR CLIENT &amp; SUPERVISING CONSULTANT</span>
              <span>PAGE ${slidesHtml.length + 1} OF ${slidesHtml.length + 1}</span>
            </div>
          </div>
        </div>

      </div>
    `);
  }

  // Custom CSS for pixel-perfect executive print design matching the exact screenshots
  const customCss = `
    @page {
      size: ${isPortrait ? "A4 portrait" : "A4 landscape"} !important;
      margin: 0 !important;
    }

    @media print {
      html, body {
        width: ${isPortrait ? "210mm" : "297mm"} !important;
        height: ${isPortrait ? "297mm" : "210mm"} !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0 !important;
      padding: 0 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
      color: #0f172a !important;
      background: #ffffff !important;
    }

    .page-container {
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 0 !important;
    }

    .pdf-sheet {
      width: ${isPortrait ? "210mm" : "297mm"} !important;
      height: ${isPortrait ? "297mm" : "210mm"} !important;
      min-height: ${isPortrait ? "297mm" : "210mm"} !important;
      max-height: ${isPortrait ? "297mm" : "210mm"} !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      padding: ${isPortrait ? "8mm 10mm 6mm 10mm" : "7mm 12mm 5mm 12mm"};
      position: relative;
      background: #ffffff;
      overflow: hidden;
    }

    .pdf-sheet:last-child {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }

    .pdf-header {
      margin-bottom: 8px;
      position: relative;
    }

    .pdf-header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 5px;
    }

    .pdf-header-rule {
      width: 100%;
      height: 2px;
      background: ${theme.ruleColor};
    }

    .pdf-footer {
      padding-top: 5px;
      border-top: 1px solid ${theme.cardBorder};
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pdf-slide-badge {
      background: ${theme.badgeBg};
      color: ${theme.badgeTextColor};
      font-size: 7.5px;
      font-weight: 800;
      padding: 2.5px 10px;
      border-radius: ${theme.cardRadius};
      border: 1px solid ${theme.badgeBorder};
      letter-spacing: 0.5px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5px;
      font-family: ${theme.fontFamily} !important;
    }

    .data-table th {
      background: ${theme.tableHeaderBg} !important;
      color: ${theme.tableHeaderTextColor} !important;
      font-weight: 800;
      font-size: 7.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 6px 8px;
      border: 1px solid ${theme.tableHeaderBg};
      text-align: left;
    }

    .data-table td {
      padding: 4.5px 8px;
      border: 1px solid #f1f5f9;
      border-bottom: 1px solid ${theme.tableBorderColor};
      vertical-align: middle;
    }

    .data-table tr:nth-child(even) td {
      background: ${theme.tableZebraBg};
    }

    .badge-approved {
      background: ${theme.badgeApprovedBg} !important;
      color: ${theme.badgeApprovedColor} !important;
      border: 1px solid ${theme.badgeApprovedBorder};
      border-radius: ${theme.cardRadius};
      padding: 1.5px 7px;
      font-weight: 800;
      font-size: 7px;
      text-transform: uppercase;
      display: inline-block;
    }

    .badge-rejected {
      background: ${theme.badgeRejectedBg} !important;
      color: ${theme.badgeRejectedColor} !important;
      border: 1px solid ${theme.badgeRejectedBorder};
      border-radius: ${theme.cardRadius};
      padding: 1.5px 7px;
      font-weight: 800;
      font-size: 7px;
      text-transform: uppercase;
      display: inline-block;
    }

    .badge-pending {
      background: ${theme.badgePendingBg} !important;
      color: ${theme.badgePendingColor} !important;
      border: 1px solid ${theme.badgePendingBorder};
      border-radius: ${theme.cardRadius};
      padding: 1.5px 7px;
      font-weight: 800;
      font-size: 7px;
      text-transform: uppercase;
      display: inline-block;
    }
  `;

  const html = slidesHtml.join("\n");

  openPrintWindow(
    `${docRef} - QA/QC Weekly Surveillance Report (${isPortrait ? "Portrait Dossier" : "Landscape Slide Deck"})`,
    html,
    customCss,
  );
}

// =========================================================================
// 8. CONCRETE QUALITY & COMPRESSIVE STRENGTH REGISTER REPORT (BY LEVEL / ALL)
// =========================================================================
export function generateConcreteRegisterReport(
  cubes: ConcreteCubeSample[],
  levelFilter: string = "All Levels",
  project: Partial<Project> = {},
  company: Partial<Company> = {},
): void {
  const companyName = company.name || "Apex Civil Engineering";
  const projectName = project.name || "Site Quality Assessment";
  const reportDate = formatDate(new Date());
  const docRef = `CQ-REG-${levelFilter.toUpperCase().replace(/[^A-Z0-9]/g, "-")}-${Date.now().toString().slice(-6)}`;

  // Summary KPIs
  const totalSamples = cubes.length;
  const inCuringCount = cubes.filter(
    (c) => c.status === "CURING" || c.status === "PENDING",
  ).length;

  const day7Tested = cubes.filter(
    (c) =>
      (c.day7Results && c.day7Results.length > 0) ||
      c.tests?.day7?.averageStrengthNmm2,
  );
  const day7Passed = day7Tested.filter((c) => {
    const val =
      c.day7Results?.[0]?.averageStrength ||
      c.tests?.day7?.averageStrengthNmm2 ||
      0;
    const target28d = c.target28DayStrengthNmm2 || c.day28Required || 30;
    const target7d = c.day7Required || Math.round(target28d * 0.7 * 10) / 10;
    return val >= target7d;
  }).length;
  const day7PassRate =
    day7Tested.length > 0
      ? Math.round((day7Passed / day7Tested.length) * 100)
      : 100;

  const day28Tested = cubes.filter(
    (c) =>
      (c.day28Results && c.day28Results.length > 0) ||
      c.tests?.day28?.averageStrengthNmm2,
  );
  const day28Passed = day28Tested.filter((c) => {
    const val =
      c.day28Results?.[0]?.averageStrength ||
      c.tests?.day28?.averageStrengthNmm2 ||
      0;
    const target28d = c.target28DayStrengthNmm2 || c.day28Required || 30;
    return val >= target28d;
  }).length;
  const day28PassRate =
    day28Tested.length > 0
      ? Math.round((day28Passed / day28Tested.length) * 100)
      : 100;

  const approvedCount = cubes.filter(
    (c) => c.status === "APPROVED" || c.status === "28-DAY DONE",
  ).length;
  const ncrCount = cubes.filter(
    (c) =>
      c.status === "NCR_ISSUED" || c.status === "REJECTED" || c.ncrGenerated,
  ).length;

  const html = `
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${renderCompanyBrandCell(company, project)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">CONCRETE QUALITY & COMPRESSIVE STRENGTH REGISTER</div>
          <div class="header-title-project">PROJECT: ${projectName}</div>
          <div class="header-title-iso">BS EN 12390-3 / BS EN 206-1 / ASTM C39 Concrete Conformance Register</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${docRef}</span></div>
          <div><strong>Scope / Level:</strong> <span style="font-weight:700; color:#0f172a;">${levelFilter}</span></div>
          <div><strong>Report Date:</strong> ${reportDate}</div>
          <div><strong>Total Samples:</strong> ${totalSamples} specimen sets</div>
        </td>
      </tr>
    </table>

    <!-- 1.0 Executive Quality Statistics -->
    <div class="pdf-section">
      <div class="section-banner">1.0 CONCRETE COMPLIANCE SUMMARY & QUALITY STATISTICS</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 20%;">LOCATION / FILTER:</td>
          <td class="grid-value" style="width: 30%; font-weight:700; color:#0f172a;">${levelFilter}</td>
          <td class="grid-label" style="width: 20%;">TOTAL SAMPLES LOGGED:</td>
          <td class="grid-value" style="width: 30%; font-weight:800; font-size:9.5px; font-family:monospace;">${totalSamples} Specimens</td>
        </tr>
        <tr>
          <td class="grid-label">28-DAY COMPLIANCE RATE:</td>
          <td class="grid-value">
            <span style="font-weight:800; font-size:10px; color:${day28PassRate >= 95 ? "#15803d" : "#b91c1c"};">${day28PassRate}%</span>
            <span style="font-size:7.5px; color:#64748b; margin-left:4px;">(${day28Passed}/${day28Tested.length} tested sets compliant)</span>
          </td>
          <td class="grid-label">7-DAY EARLY STRENGTH:</td>
          <td class="grid-value">
            <span style="font-weight:800; font-size:9.5px; color:#0369a1;">${day7PassRate}%</span>
            <span style="font-size:7.5px; color:#64748b; margin-left:4px;">(${day7Passed}/${day7Tested.length} tested sets compliant)</span>
          </td>
        </tr>
        <tr>
          <td class="grid-label">APPROVED CERTIFICATES:</td>
          <td class="grid-value" style="color:#15803d; font-weight:800;">${approvedCount} Fully Certified</td>
          <td class="grid-label">ACTIVE NCRS / DEFECTIVE:</td>
          <td class="grid-value" style="color:${ncrCount > 0 ? "#b91c1c" : "#15803d"}; font-weight:800;">${ncrCount} Non-Conforming</td>
        </tr>
        <tr>
          <td class="grid-label">IN CURING TANKS:</td>
          <td class="grid-value" style="color:#0284c7; font-weight:700;">${inCuringCount} In Curing Water Tanks</td>
          <td class="grid-label">TESTING STANDARD:</td>
          <td class="grid-value">BS EN 12390-3 / BS EN 12350 / ASTM C39</td>
        </tr>
      </table>
    </div>

    <!-- 2.0 Concrete Samples Register Table -->
    <div class="pdf-section">
      <div class="section-banner">2.0 CONCRETE SPECIMEN LOG & COMPRESSIVE TEST REGISTER</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 12%;">SAMPLE ID & MARK</th>
            <th style="width: 15%;">STRUCTURAL ELEMENT</th>
            <th style="width: 10%;">LEVEL / ZONE</th>
            <th style="width: 9%;">GRADE (MPa)</th>
            <th style="width: 9%;">CAST DATE</th>
            <th style="width: 8%;">SLUMP (mm)</th>
            <th style="width: 12%;">7-DAY STRENGTH</th>
            <th style="width: 13%;">28-DAY STRENGTH</th>
            <th style="width: 12%;">STATUS / NCR</th>
          </tr>
        </thead>
        <tbody>
          ${
            cubes.length > 0
              ? cubes
                  .map((c) => {
                    const target28d =
                      c.target28DayStrengthNmm2 || c.day28Required || 30;
                    const target7d =
                      c.day7Required || Math.round(target28d * 0.7 * 10) / 10;

                    const res7 =
                      c.day7Results?.[0]?.averageStrength ??
                      c.tests?.day7?.averageStrengthNmm2;
                    const is7Pass =
                      res7 !== undefined && res7 !== null
                        ? res7 >= target7d
                        : null;

                    const res28 =
                      c.day28Results?.[0]?.averageStrength ??
                      c.tests?.day28?.averageStrengthNmm2;
                    const is28Pass =
                      res28 !== undefined && res28 !== null
                        ? res28 >= target28d
                        : null;

                    const hasNCR =
                      c.status === "NCR_ISSUED" ||
                      c.status === "REJECTED" ||
                      c.ncrGenerated ||
                      Boolean(c.ncrNumber);

                    return `
              <tr>
                <td>
                  <div style="font-weight: 800; color: #0f172a;">${c.sampleId || c.sampleNumber || "—"}</div>
                  ${c.inscribedName ? `<div style="font-size: 7px; color: #64748b;">Mark: ${c.inscribedName}</div>` : ""}
                </td>
                <td>
                  <div style="font-weight: 700;">${c.structureElement || c.elementName || "Structural Element"}</div>
                  ${c.supplier ? `<div style="font-size: 7px; color: #64748b;">${c.supplier}</div>` : ""}
                </td>
                <td>${[c.level || c.levelName, c.zone].filter(Boolean).join(" • ") || "Site"}</td>
                <td style="font-weight: 700; font-family: monospace;">${c.concreteGrade || "C30"} (${target28d})</td>
                <td>${formatDate(c.castDate)}</td>
                <td style="font-family: monospace;">${c.slumpMm || (c as any).slumpValue || "—"} mm</td>
                <td>
                  ${
                    res7 !== undefined && res7 !== null
                      ? `<div style="font-family: monospace; font-weight: 800; color: ${is7Pass ? "#15803d" : "#b91c1c"};">${res7} MPa</div>
                         <div style="font-size: 6.8px; color: ${is7Pass ? "#15803d" : "#b91c1c"}; font-weight: 700;">(${is7Pass ? "PASS" : "FAIL"} - Min ${target7d})</div>`
                      : `<span style="color: #94a3b8; font-size: 7.5px;">Pending</span>`
                  }
                </td>
                <td>
                  ${
                    res28 !== undefined && res28 !== null
                      ? `<div style="font-family: monospace; font-weight: 800; color: ${is28Pass ? "#15803d" : "#b91c1c"};">${res28} MPa</div>
                         <div style="font-size: 6.8px; color: ${is28Pass ? "#15803d" : "#b91c1c"}; font-weight: 700;">(${is28Pass ? "PASS" : "FAIL"} - Min ${target28d})</div>`
                      : `<span style="color: #94a3b8; font-size: 7.5px;">In Curing</span>`
                  }
                </td>
                <td>
                  ${
                    hasNCR
                      ? `<span class="badge-fail">NCR: ${c.ncrNumber || "ISSUED"}</span>`
                      : c.status === "APPROVED" || is28Pass
                        ? `<span class="badge-pass">APPROVED</span>`
                        : `<span class="badge-pending">${c.status || "IN PROGRESS"}</span>`
                  }
                </td>
              </tr>
            `;
                  })
                  .join("")
              : `
              <tr>
                <td colspan="9" style="text-align: center; color: #64748b; padding: 14px;">
                  No concrete specimen records found for ${levelFilter}.
                </td>
              </tr>
            `
          }
        </tbody>
      </table>
    </div>

    <!-- 3.0 Statutory Review Sign-off -->
    <div class="pdf-section">
      <div class="section-banner">3.0 QA/QC CERTIFICATION & STRUCTURAL SIGN-OFF</div>
      <table class="signoff-table">
        <tr>
          <td style="width: 33.3%;">
            <div class="sig-role-header"><span>MATERIALS / LAB TECHNICIAN</span><span class="sig-required-tag">CERTIFIED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>Materials Testing Lead</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${reportDate}</span>
            </div>
          </td>
          <td style="width: 33.3%;">
            <div class="sig-role-header"><span>QA/QC MANAGER</span><span class="sig-required-tag">APPROVED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>QA/QC Manager</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${reportDate}</span>
            </div>
          </td>
          <td style="width: 33.3%;">
            <div class="sig-role-header"><span>RESIDENT / STRUCTURAL ENGINEER</span><span class="sig-required-tag">ACCEPTED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>Consultant Structural Engineer</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ____ / ____ / 20__</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${companyName}</div>
      <div>Report Ref: ${docRef} • Filter: ${levelFilter}</div>
    </div>
  `;

  openPrintWindow(
    `${docRef} - Concrete Quality Register (${levelFilter})`,
    html,
  );
}

// ==========================================
// 8.0 FORMAL SITE INSTRUCTION / QUALITY WARNING PDF
// ==========================================

export function generateSiteInstructionPDF(
  si: SiteInstruction,
  project?: Project,
  company?: Company,
): void {
  const companyName =
    company?.name || si.companyName || "JQMS Civil Infrastructure";
  const projectName =
    project?.name || si.projectName || "Civil Engineering Construction Project";
  const projectCode = project?.code || "PRJ-001";
  const docRef =
    si.instructionNumber || `SI-${si.id.slice(0, 8).toUpperCase()}`;
  const issueDate = formatDate(si.signedBy?.signedAt || si.createdAt);
  const complianceDate = formatDate(si.complianceDeadline);

  const severityColor =
    si.severity === "STOP_WORK" || si.severity === "CRITICAL"
      ? "#dc2626"
      : si.severity === "HIGH"
        ? "#ea580c"
        : "#2563eb";

  const severityLabel =
    si.severity === "STOP_WORK"
      ? "INTERNAL WORK HOLD DIRECTIVE"
      : si.severity === "CRITICAL"
        ? "CRITICAL INTERNAL QUALITY DIRECTIVE"
        : si.severity === "HIGH"
          ? "HIGH PRIORITY RECTIFICATION NOTICE"
          : "STANDARD QUALITY DIRECTIVE";

  const html = `
    <!-- ═══ DOCUMENT HEADER ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${renderCompanyBrandCell(company, project)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main" style="color: ${severityColor};">
            INTERNAL SITE INSTRUCTION
          </div>
          <div style="font-size: 8px; font-weight: 800; letter-spacing: 0.8px; color: #475569; text-transform: uppercase; margin-top: 1px;">
            INTERNAL QUALITY CONTROL & REMEDIATION DIRECTIVE
          </div>
          <div class="header-title-project">${projectName} (${projectCode})</div>
        </td>
        <td style="width: 25%; font-size: 8px; vertical-align: top; background: #fafafa;">
          <div style="margin-bottom: 2px;">Doc Ref: <strong style="font-family: monospace; font-size: 8.5px; color: #0f172a;">${docRef}</strong></div>
          <div style="margin-bottom: 2px;">Issue Date: <strong>${issueDate}</strong></div>
          <div style="margin-bottom: 2px;">Target Rectification: <strong style="color: #dc2626;">${complianceDate}</strong></div>
          <div>Status: <span style="background: #e0f2fe; color: #0369a1; font-weight: 800; padding: 1px 4px; border-radius: 2px; font-size: 7px;">${si.status || "ISSUED"}</span></div>
        </td>
      </tr>
    </table>

    <!-- ═══ INTERNAL SEVERITY BANNER ═══ -->
    <div style="background: ${severityColor}; color: #ffffff; padding: 5px 10px; border-radius: 4px; font-weight: 800; font-size: 9px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; letter-spacing: 0.5px;">
      <span>⚠️ NOTICE CATEGORY: ${severityLabel}</span>
      <span>ACTION REQUIRED BY: ${complianceDate}</span>
    </div>

    <!-- ═══ 1.0 INTERNAL ADMINISTRATIVE PARTICULARS ═══ -->
    <div class="pdf-section" style="margin-bottom: 12px; page-break-inside: avoid;">
      <div class="section-banner" style="
        background: #0f172a;
        color: #ffffff;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.8px;
        padding: 5px 10px;
        border-radius: 4px 4px 0 0;
        text-transform: uppercase;
      ">
        1.0 INTERNAL ADMINISTRATIVE & PROJECT PARTICULARS
      </div>

      <table class="meta-table" style="
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #cbd5e1;
        border-top: none;
        font-size: 8px;
        background: #ffffff;
      ">
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="width: 18%; background: #f8fafc; padding: 6px 8px; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 7.5px; border-right: 1px solid #e2e8f0;">
              ISSUING DIVISION
            </td>
            <td style="width: 32%; padding: 6px 8px; color: #0f172a; font-weight: 600; border-right: 1px solid #cbd5e1;">
              ${si.issuingDepartment || "Quality Assurance & Control (QA/QC)"}
            </td>
            <td style="width: 18%; background: #f8fafc; padding: 6px 8px; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 7.5px; border-right: 1px solid #e2e8f0;">
              ACTION ASSIGNED TO
            </td>
            <td style="width: 32%; padding: 6px 8px; color: #0f172a; font-weight: 700;">
              ${si.recipientName || "Project Site Manager / Execution Engineer"}
              ${si.recipientRole ? `<span style="color: #64748b; font-weight: 500; font-size: 7.5px;">(${si.recipientRole})</span>` : ""}
            </td>
          </tr>

          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="background: #f8fafc; padding: 6px 8px; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 7.5px; border-right: 1px solid #e2e8f0;">
              LOCATION / LEVEL
            </td>
            <td style="padding: 6px 8px; color: #0f172a; font-weight: 600; border-right: 1px solid #cbd5e1;">
              <span style="background: #f1f5f9; color: #334155; padding: 1.5px 6px; border-radius: 3px; font-weight: 700; border: 1px solid #e2e8f0;">
                ${si.location || si.levelName || "Site Wide"}
              </span>
            </td>
            <td style="background: #f8fafc; padding: 6px 8px; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 7.5px; border-right: 1px solid #e2e8f0;">
              STRUCTURAL ELEMENT
            </td>
            <td style="padding: 6px 8px; color: #0369a1; font-weight: 800;">
              ${si.elementName || "Refer to detailed defect description"}
            </td>
          </tr>

          <tr>
            <td style="background: #f8fafc; padding: 6px 8px; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 7.5px; border-right: 1px solid #e2e8f0;">
              QUALITY / SPEC STD
            </td>
            <td style="padding: 6px 8px; color: #0f172a; font-weight: 600; border-right: 1px solid #cbd5e1;">
              ${si.specReference || "Internal Quality Standards / Project Technical Specs"}
            </td>
            <td style="background: #f8fafc; padding: 6px 8px; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 7.5px; border-right: 1px solid #e2e8f0;">
              DRAWING REF
            </td>
            <td style="padding: 6px 8px; color: #0f172a; font-weight: 600;">
              <span style="font-family: monospace; font-size: 8.5px; background: #fafafa; padding: 1px 4px; border: 1px solid #f1f5f9; border-radius: 2px;">
                ${si.drawingNumber || "Approved Construction Drawings"}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ═══ 2.0 INTERNAL NCR CROSS-REFERENCE ═══ -->
    ${
      si.ncrNumber || si.ncrId
        ? `
    <div class="pdf-section">
      <div class="section-banner" style="background: #7f1d1d; color: #ffffff;">2.0 CROSS-REFERENCE TO INTERNAL NON-CONFORMANCE REPORT (NCR)</div>
      <table class="meta-table" style="border-left: 3px solid #dc2626;">
        <tr>
          <td class="meta-label" style="background: #fef2f2; color: #991b1b;">LINKED NCR REF:</td>
          <td class="meta-value" style="font-weight: 800; color: #b91c1c; font-family: monospace;">${si.ncrNumber || "NCR"}</td>
          <td class="meta-label" style="background: #fef2f2; color: #991b1b;">ORIGINAL TARGET DATE:</td>
          <td class="meta-value"><strong>${formatDate(si.ncrDeadline)}</strong></td>
        </tr>
        <tr>
          <td class="meta-label" style="background: #fef2f2; color: #991b1b;">OVERDUE STATUS:</td>
          <td class="meta-value">
            <span style="background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 3px; font-weight: 800; font-size: 8px; border: 1px solid #f87171;">
              ⚠️ UNRESOLVED QUALITY DEFECT ${si.ncrDaysOverdue ? `(${si.ncrDaysOverdue} DAYS OVERDUE)` : ""}
            </span>
          </td>
          <td class="meta-label" style="background: #fef2f2; color: #991b1b;">SEVERITY LEVEL:</td>
          <td class="meta-value"><strong>${si.ncrSeverity || "HIGH"}</strong></td>
        </tr>
        <tr>
          <td class="meta-label" style="background: #fef2f2; color: #991b1b;">DEFECT SUMMARY:</td>
          <td class="meta-value" colspan="3">${si.ncrTitle || si.issueSummary}</td>
        </tr>
      </table>
    </div>
    `
        : ""
    }

    <!-- ═══ 3.0 IMMEDIATE WORK HOLD (IF ORDERED) ═══ -->
    ${
      si.stopWorkOrdered
        ? `
    <div style="background: #7f1d1d; color: #ffffff; border: 1.5px solid #dc2626; padding: 8px 12px; border-radius: 4px; margin-bottom: 8px; text-align: center;">
      <div style="font-size: 11px; font-weight: 900; letter-spacing: 0.8px; margin-bottom: 2px;">🛑 MANDATORY WORK HOLD ORDERED</div>
      <div style="font-size: 8px; font-weight: 600; opacity: 0.95;">
        Per internal project quality control guidelines, ALL further casting, assembly, or installation on the affected section MUST STOP immediately until remedial actions are verified by QA/QC.
      </div>
    </div>
    `
        : ""
    }

    <!-- ═══ 4.0 INSTRUCTION SUBJECT & DIRECTIVE ═══ -->
    <div class="pdf-section">
      <div class="section-banner">3.0 TECHNICAL DIRECTIVE & RECTIFICATION SCOPE</div>
      <div style="border: 1px solid #cbd5e1; border-top: none; padding: 8px 10px; background: #ffffff;">
        <div style="margin-bottom: 6px;">
          <span style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase;">DIRECTIVE SUBJECT:</span>
          <div style="font-size: 10px; font-weight: 800; color: #0f172a; margin-top: 1px;">${si.subject || si.title}</div>
        </div>

        <div style="margin-bottom: 6px;">
          <span style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase;">DEFECT / QUALITY OBSERVATION:</span>
          <div style="font-size: 8.5px; color: #334155; line-height: 1.45; margin-top: 2px; white-space: pre-wrap;">${si.issueSummary || "No issue summary recorded."}</div>
        </div>

        <div>
          <span style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase;">REQUIRED ACTION & SPECIFICATION:</span>
          <div style="font-size: 8.5px; color: #0f172a; line-height: 1.45; margin-top: 2px; background: #f8fafc; padding: 6px 8px; border-left: 3px solid #0284c7; border-radius: 2px; white-space: pre-wrap;">${si.instructionText || "Execute corrective work as specified below."}</div>
        </div>
      </div>
    </div>

    <!-- ═══ 5.0 MANDATORY ACTION ITEMS ═══ -->
    <div class="pdf-section">
      <div class="section-banner">4.0 CORRECTIVE ACTIONS & DEADLINES</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 8%; text-align: center;">ITEM</th>
            <th style="width: 72%;">ACTION REQUIRED</th>
            <th style="width: 20%; text-align: center;">TARGET DATE</th>
          </tr>
        </thead>
        <tbody>
          ${
            si.mandatoryActions && si.mandatoryActions.length > 0
              ? si.mandatoryActions
                  .map(
                    (action, idx) => `
                <tr>
                  <td style="text-align: center; font-weight: 800; color: #ea580c;">${idx + 1}.0</td>
                  <td style="font-weight: 600; color: #0f172a;">${action}</td>
                  <td style="text-align: center; font-weight: 700; color: #dc2626;">${complianceDate}</td>
                </tr>
              `,
                  )
                  .join("")
              : `
                <tr>
                  <td style="text-align: center; font-weight: 800;">1.0</td>
                  <td>Execute complete remediation of identified defect according to internal project quality guidelines.</td>
                  <td style="text-align: center; font-weight: 700;">${complianceDate}</td>
                </tr>
                <tr>
                  <td style="text-align: center; font-weight: 800;">2.0</td>
                  <td>Notify QA/QC team for re-inspection and sign-off upon completion of corrective actions.</td>
                  <td style="text-align: center; font-weight: 700;">${complianceDate}</td>
                </tr>
              `
          }
        </tbody>
      </table>
    </div>

    <!-- ═══ 6.0 INTERNAL GOVERNANCE ═══ -->
    <div class="pdf-section">
      <div class="section-banner">5.0 INTERNAL QUALITY GOVERNANCE</div>
      <div style="border: 1px solid #cbd5e1; border-top: none; padding: 6px 10px; background: #fafafa; font-size: 7.8px; color: #475569; line-height: 1.4;">
        <div style="margin-bottom: 3px;">
          <strong>Governance Standard:</strong> ${si.contractualClause || "ISO 9001:2015 Clause 8.7 (Control of Nonconforming Outputs) & Internal Quality Management System Rules."}
        </div>
        <div>
          <strong>Management Escalation:</strong> Unresolved directives will be escalated to Executive Project Management for review during internal quality audits.
        </div>
      </div>
    </div>

    <!-- ═══ 7.0 INTERNAL QA/QC SIGN-OFF ═══ -->
    <div class="pdf-section">
      <div class="section-banner">6.0 AUTHORIZED QA/QC ISSUANCE</div>
      <table class="signoff-table">
        <tr>
          <td style="width: 100%; padding: 10px 14px;">
            <div class="sig-role-header">
              <span>ISSUED BY INTERNAL QA/QC AUTHORITY</span>
              <span class="sig-required-tag">DIGITALLY RECORDED</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 6px;">
              <div style="space-y: 2px; font-size: 8.5px; color: #1e293b;">
                <div>Full Name: <strong>${si.signedBy?.name.toUpperCase() || "Authorized Quality Authority"}</strong></div>
                <div>Designation: <strong>${si.signedBy?.designation || si.signedBy?.role || "QA/QC Lead Engineer"}</strong></div>
                <div style="font-size: 7.5px; color: #64748b; font-style: italic; margin-top: 4px;">
                  "${si.signedBy?.declaration || "Issued in accordance with company internal quality control standards."}"
                </div>
              </div>

              <div style="text-align: center; min-width: 170px; padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; background: #ffffff;">
                <div style="font-size: 7px; font-weight: 800; color: #0284c7; text-transform: uppercase; margin-bottom: 2px;">
                  Digital Signature
                </div>
                ${
                  si.signedBy?.signatureUrl
                    ? `<img src="${si.signedBy.signatureUrl}" style="max-height: 44px; max-width: 150px; object-fit: contain; margin: 0 auto;" alt="Signature" />`
                    : `<div style="height: 36px; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 10px; font-weight: bold; color: #0284c7;">${si.signedBy?.name || "ELECTRONICALLY SIGNED"}</div>`
                }
                <div style="font-family: monospace; font-size: 6.5px; color: #94a3b8; border-top: 0.5px solid #f1f5f9; padding-top: 2px; margin-top: 2px;">
                  ID: ${si.signedBy?.digitalSignatureStamp || `JQMS-SI-${si.id.slice(0, 8).toUpperCase()}`}
                </div>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- ═══ DOCUMENT FOOTER ═══ -->
    <div class="doc-footer">
      <div>INTERNAL QUALITY DIRECTIVE — ${companyName}</div>
      <div>Document Ref: ${docRef} </div>
    </div>
  `;

  openPrintWindow(`${docRef} - Internal Site Instruction`, html);
}

// =========================================================================
// 8. MATERIAL INSPECTION REPORT (MIR) PDF GENERATOR (ISO 9001:2015 CLAUSE 8.4)
// =========================================================================
export function generateMIRPDF(
  mir: MaterialInspectionReport,
  project: Partial<Project> = {},
  company: Partial<Company> = {},
): void {
  const companyName = company.name || "JQMS ENTERPRISE QUALITY MANAGEMENT";
  const projectName = project.name || mir.projectName || "CONSTRUCTION PROJECT";
  const projectCode = project.code || "PRJ";
  const docRef = mir.mirNumber || "MIR-DRAFT";

  const getDispositionBadge = (disp?: string) => {
    switch (disp) {
      case "ACCEPTED":
        return `<span style="display:inline-block; padding: 3px 10px; background: #dcfce7; color: #15803d; border: 1.5px solid #86efac; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">ACCEPTED / APPROVED</span>`;
      case "ACCEPTED_AS_NOTED":
        return `<span style="display:inline-block; padding: 3px 10px; background: #dbeafe; color: #1d4ed8; border: 1.5px solid #93c5fd; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">ACCEPTED AS NOTED</span>`;
      case "REJECTED":
        return `<span style="display:inline-block; padding: 3px 10px; background: #fee2e2; color: #b91c1c; border: 1.5px solid #fca5a5; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">REJECTED / NON-COMPLIANT</span>`;
      case "HOLD_FOR_TESTING":
        return `<span style="display:inline-block; padding: 3px 10px; background: #fef3c7; color: #b45309; border: 1.5px solid #fcd34d; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">HOLD FOR LAB TESTING</span>`;
      default:
        return `<span style="display:inline-block; padding: 3px 10px; background: #f1f5f9; color: #475569; border: 1.5px solid #cbd5e1; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">PENDING INSPECTION</span>`;
    }
  };

  const itemsHtml =
    mir.items && mir.items.length > 0
      ? mir.items
          .map(
            (item, idx) => `
        <tr>
          <td style="text-align: center; font-weight: bold; width: 30px;">${idx + 1}</td>
          <td style="font-weight: 600; color: #0f172a;">${item.description || "Material Item"}</td>
          <td style="font-size: 7.5px; color: #475569;">${item.specificationRef || "—"}</td>
          <td style="text-align: right; font-weight: bold;">${item.quantityDelivered}</td>
          <td style="text-align: right;">${item.quantityInspected}</td>
          <td style="text-align: right; color: #15803d; font-weight: bold;">${item.quantityAccepted}</td>
          <td style="text-align: right; color: ${item.quantityRejected > 0 ? "#b91c1c" : "#64748b"}; font-weight: bold;">${item.quantityRejected}</td>
          <td style="text-align: center; text-transform: uppercase; font-size: 7.5px;">${item.unit || "units"}</td>
          <td style="font-size: 7.5px; color: #475569;">${item.remarks || "—"}</td>
        </tr>
      `,
          )
          .join("")
      : `<tr><td colspan="9" style="text-align:center; padding: 12px; color: #64748b;">No individual line items registered. Full delivery inspected as described.</td></tr>`;

  const html = `
    <!-- ═══ 1.0 HEADER TABLE ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${renderCompanyBrandCell(company, project)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">MATERIAL INSPECTION REPORT (MIR)</div>
          <div class="header-title-project">${projectName} (${projectCode})</div>
          <div class="header-title-iso">ISO 9001:2015 CLAUSE 8.4 — RECEIVING INSPECTION & VERIFICATION</div>
        </td>
        <td class="header-meta-cell">
          <div class="header-meta-row">
            <span class="header-meta-label">MIR NO:</span>
            <span class="header-meta-val" style="color: #ea580c; font-weight: 900;">${docRef}</span>
          </div>
          <div class="header-meta-row">
            <span class="header-meta-label">DISCIPLINE:</span>
            <span class="header-meta-val">${mir.discipline || "Civil & Structural"}</span>
          </div>
          <div class="header-meta-row">
            <span class="header-meta-label">INSP DATE:</span>
            <span class="header-meta-val">${formatDate(mir.inspectionDate)}</span>
          </div>
          <div class="header-meta-row">
            <span class="header-meta-label">STATUS:</span>
            <span class="header-meta-val">${mir.status || "INSPECTED"}</span>
          </div>
        </td>
      </tr>
    </table>

    <!-- ═══ 2.0 OVERVIEW & CROSS REFERENCES ═══ -->
    <div class="pdf-section">
      <div class="section-banner">1.0 MATERIAL SHIPMENT & SUBMITTAL TRACEABILITY</div>
      <table class="data-table">
        <tr>
          <td class="label-cell" style="width: 18%;">Material Title:</td>
          <td style="width: 32%; font-weight: 800; font-size: 9px; color: #0f172a;">${mir.title}</td>
          <td class="label-cell" style="width: 18%;">Approved MAR Ref:</td>
          <td style="width: 32%; font-weight: 700; color: #0284c7;">${mir.marNumber || "— (Direct Site Receiving)"}</td>
        </tr>
        <tr>
          <td class="label-cell">Supplier / Vendor:</td>
          <td style="font-weight: 600;">${mir.supplierVendor || "—"}</td>
          <td class="label-cell">Manufacturer:</td>
          <td>${mir.manufacturer || "—"}</td>
        </tr>
        <tr>
          <td class="label-cell">Delivery Date:</td>
          <td>${formatDate(mir.deliveryDate)}</td>
          <td class="label-cell">Gate Ticket / Waybill:</td>
          <td style="font-family: monospace; font-weight: bold;">${mir.deliveryNumber || "—"}</td>
        </tr>
        <tr>
          <td class="label-cell">Purchase Order (PO):</td>
          <td style="font-family: monospace;">${mir.poNumber || "—"}</td>
          <td class="label-cell">Laydown / Storage:</td>
          <td>${mir.storageLocation || "On-Site Storage / Laydown Area"}</td>
        </tr>
        <tr>
          <td class="label-cell">Current Disposition:</td>
          <td colspan="3">${getDispositionBadge(mir.disposition)}</td>
        </tr>
      </table>
    </div>

    <!-- ═══ 3.0 VERIFICATION MATRIX ═══ -->
    <div class="pdf-section">
      <div class="section-banner">2.0 PHYSICAL & STATUTORY COMPLIANCE CHECKPOINTS</div>
      <table class="data-table">
        <tr>
          <td style="width: 25%; font-weight: 600;">Packaging / Physical Condition:</td>
          <td style="width: 25%; font-weight: 700; color: ${mir.packagingCondition === "DAMAGED" ? "#b91c1c" : "#15803d"};">
            ${mir.packagingCondition === "DAMAGED" ? "❌ DAMAGED" : mir.packagingCondition === "COMPROMISED" ? "⚠️ COMPROMISED" : "✅ SATISFACTORY / SOUND"}
          </td>
          <td style="width: 25%; font-weight: 600;">Mill Test Certificate (MTC):</td>
          <td style="width: 25%; font-weight: 700; color: ${mir.millCertificateProvided ? "#15803d" : "#b91c1c"};">
            ${mir.millCertificateProvided ? "✅ PROVIDED & VERIFIED" : "❌ MISSING / PENDING"}
          </td>
        </tr>
        <tr>
          <td style="font-weight: 600;">Dimensional / Visual Check:</td>
          <td style="font-weight: 700; color: ${mir.physicalDimensionsCheck === "PASS" ? "#15803d" : mir.physicalDimensionsCheck === "FAIL" ? "#b91c1c" : "#64748b"};">
            ${mir.physicalDimensionsCheck === "PASS" ? "✅ PASS / CONFORMING" : mir.physicalDimensionsCheck === "FAIL" ? "❌ FAIL / NON-CONFORMING" : "⚪ NOT APPLICABLE"}
          </td>
          <td style="font-weight: 600;">Laboratory Sampling:</td>
          <td style="font-weight: 700;">
            ${mir.samplingRequired ? `🔬 REQUIRED (Sample Tag: ${mir.sampleTagNumber || "Assigned"})` : "⚪ NO SAMPLING REQUIRED"}
          </td>
        </tr>
      </table>
    </div>

    <!-- ═══ 4.0 LINE ITEMS TABLE ═══ -->
    <div class="pdf-section">
      <div class="section-banner">3.0 DELIVERED ITEMS INSPECTION BREAKDOWN</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 30px; text-align: center;">#</th>
            <th>Item Description</th>
            <th style="width: 14%;">Spec Ref</th>
            <th style="width: 10%; text-align: right;">Delivered</th>
            <th style="width: 10%; text-align: right;">Inspected</th>
            <th style="width: 10%; text-align: right;">Accepted</th>
            <th style="width: 10%; text-align: right;">Rejected</th>
            <th style="width: 8%; text-align: center;">Unit</th>
            <th style="width: 18%;">Remarks / Defect Details</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <!-- ═══ 4.0 NOTES & REMARKS ═══ -->
    <div class="pdf-section">
      <div class="section-banner">4.0 INSPECTION OBSERVATIONS & REQUIRED ACTIONS</div>
      <div style="border: 1px solid #cbd5e1; border-top: none; background: #ffffff; padding: 8px 10px; display: flex; flex-direction: column; gap: 8px;">
        <div>
          <div style="font-size: 7.5px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">QA/QC Receiving Observations & Inspector Notes:</div>
          ${renderStructuredInspectionHTML(
            mir.inspectionNotes,
            "Materials visually checked and verified compliant with delivery waybill and approved submittal specification.",
          )}
        </div>
        ${
          mir.rejectionReasons
            ? `
        <div style="margin-top: 4px;">
          <div style="font-size: 7.5px; font-weight: 800; color: #b91c1c; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Defects, Non-Conformances & Technical Justifications:</div>
          ${renderStructuredInspectionHTML(mir.rejectionReasons)}
        </div>
        `
            : ""
        }
        ${
          mir.actionRequired
            ? `
        <div style="margin-top: 4px;">
          <div style="font-size: 7.5px; font-weight: 800; color: #d97706; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Mandatory Action & Quarantine Requirements:</div>
          ${renderStructuredInspectionHTML(mir.actionRequired)}
        </div>
        `
            : ""
        }
      </div>
    </div>

    <!-- ═══ 5.0 QA/QC ENGINEER OFFICIAL ENDORSEMENT & MATERIAL DISPOSITION ═══ -->
    <div class="pdf-section">
      <div class="section-banner">5.0 QA/QC ENGINEER OFFICIAL ENDORSEMENT & MATERIAL DISPOSITION</div>
      <table class="signoff-table" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 100%; padding: 10px 12px; vertical-align: top; background: #fffbf5; border: 1.5px solid #fed7aa;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #fed7aa; padding-bottom: 6px; margin-bottom: 8px;">
              <div>
                <span style="font-size: 9px; font-weight: 900; color: #c2410c; text-transform: uppercase; letter-spacing: 0.5px;">
                  QA/QC ENGINEER OFFICIAL DISPOSITION STAMP
                </span>
                <div style="font-size: 7.5px; color: #7c2d12;">Statutory Receiving Quality Verification & Material Acceptance Decision</div>
              </div>
              <div>
                ${getDispositionBadge(mir.qaqcSignOff?.verdict || mir.consultantSignOff?.verdict || mir.disposition)}
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 2.2fr; gap: 12px; font-size: 8px; line-height: 1.6; color: #1e293b; margin-bottom: 6px;">
              <div style="border-right: 1px dashed #fed7aa; padding-right: 10px;">
                <div>QA/QC Engineer: <strong>${mir.qaqcSignOff?.name || mir.consultantSignOff?.name || mir.inspectedBy?.name || "QA/QC Engineer"}</strong></div>
                <div>Designation: <strong>${(mir.qaqcSignOff as any)?.designation || "QA/QC Engineer"}</strong></div>
                <div>Date of Endorsement: <strong>${formatDate(mir.qaqcSignOff?.date || mir.consultantSignOff?.date || mir.inspectionDate)}</strong></div>
                <div style="margin-top: 4px; color: #15803d; font-weight: bold; font-size: 7.5px;">
                  ✓ Electronically Authenticated Endorsement
                </div>
              </div>
              <div>
                <div style="font-weight: 800; color: #9a3412; font-size: 7.5px; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Official QA/QC Commentary, Directives & Liability Disclaimers:</div>
                ${renderStructuredInspectionHTML(
                  mir.qaqcSignOff?.comments || mir.consultantSignOff?.comments,
                  "Materials inspected at site receiving laydown. Verified compliant with approved submittal & material specifications.",
                )}
              </div>
            </div>

            <div style="margin-top: 10px; border-top: 1px dashed #fdba74; padding-top: 4px; font-size: 7px; color: #9a3412; text-align: center; font-weight: bold;">
              Official QA/QC Engineering Endorsement & Inspection Acceptance Stamp • ISO 9001:2015 Clause 8.4
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- ═══ 6.0 STATUTORY STAKEHOLDER SIGN-OFF AUTHORIZATIONS ═══ -->
    ${(() => {
      const shList: StakeholderSignoff[] =
        mir.stakeholders && mir.stakeholders.length > 0
          ? mir.stakeholders
          : [
              {
                role: "Contractor Quality Representative",
                name:
                  mir.contractorSignOff?.name ||
                  mir.inspectedBy?.name ||
                  "Contractor Quality Representative",
                designation: "Site QA/QC Inspector",
                required: true,
                signed: Boolean(
                  mir.contractorSignOff?.signed || mir.inspectedBy?.date,
                ),
                signedAt:
                  mir.contractorSignOff?.date ||
                  mir.inspectedBy?.date ||
                  mir.inspectionDate,
              },
              ...(mir.consultantSignOff?.signed
                ? [
                    {
                      role: "Supervising Consultant / Resident Engineer",
                      name: mir.consultantSignOff.name,
                      designation: "Resident Engineer",
                      required: false,
                      signed: true,
                      signedAt: mir.consultantSignOff.date,
                    },
                  ]
                : []),
            ];

      if (shList.length === 0) return "";

      const pairs: StakeholderSignoff[][] = [];
      for (let i = 0; i < shList.length; i += 2) {
        pairs.push(shList.slice(i, i + 2));
      }

      return `
      <div class="pdf-section">
        <div class="section-banner">6.0 STATUTORY STAKEHOLDER SIGN-OFF AUTHORIZATIONS</div>
        <table class="signoff-table">
          ${pairs
            .map(
              (pair) => `
            <tr>
              ${pair
                .map(
                  (sh) => `
                <td style="width: 50%; padding: 8px 12px; vertical-align: top; background: ${sh.signed ? "#f0fdf4" : "#ffffff"};">
                  <div class="sig-role-header">
                    <span>${sh.role}</span>
                    <span class="sig-required-tag" style="${
                      sh.signed
                        ? "background: #dcfce7; color: #166534; border-color: #86efac;"
                        : sh.required
                          ? "background: #fee2e2; color: #991b1b; border-color: #fca5a5;"
                          : "background: #f1f5f9; color: #475569; border-color: #cbd5e1;"
                    }">
                      ${sh.signed ? "VERIFIED & SIGNED" : sh.required ? "REQUIRED" : "OPTIONAL"}
                    </span>
                  </div>
                  <div style="font-size: 8px; line-height: 1.5; color: #1e293b; margin-top: 4px;">
                    <div>Name: <strong>${sh.name || "— (Pending Signature)"}</strong></div>
                    <div>Designation: <strong>${sh.designation || sh.role}</strong></div>
                    <div>Date: <strong>${sh.signedAt ? formatDate(sh.signedAt) : sh.signed ? formatDate(mir.inspectionDate) : "—"}</strong></div>
                  </div>
                  <div style="margin-top: 14px; border-top: 1px dashed #94a3b8; padding-top: 4px; font-size: 7px; color: #64748b; text-align: center;">
                    ${sh.signed ? `Electronically Authenticated • ${sh.name}` : `Signature & Stamp (${sh.role})`}
                  </div>
                </td>
              `,
                )
                .join("")}
              ${pair.length === 1 ? `<td style="width: 50%; background: #f8fafc; border: 1px solid #cbd5e1;"></td>` : ""}
            </tr>
          `,
            )
            .join("")}
        </table>
      </div>
      `;
    })()}

    <!-- ═══ 7.0 ATTACHED INSPECTION PHOTOS & DELIVERY EVIDENCE ═══ -->
    ${
      mir.photos && mir.photos.length > 0
        ? `
    <div class="pdf-section">
      <div class="section-banner">7.0 ATTACHED INSPECTION PHOTOS & DELIVERY EVIDENCE (${mir.photos.length} PHOTOGRAPHS ATTACHED)</div>
      <div class="photo-grid" style="display: flex; flex-wrap: wrap; gap: 8px; background: #ffffff; border: 1px solid #cbd5e1; border-top: none; padding: 8px;">
        ${mir.photos
          .map(
            (photoUrl, idx) => `
          <div class="photo-card" style="width: 48%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; text-align: center; background: #f8fafc; page-break-inside: avoid; break-inside: avoid; margin-bottom: 6px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #ea580c; text-align: left; margin-bottom: 4px; display: flex; justify-content: space-between;">
              <span>PHOTO #${idx + 1} — DELIVERY EVIDENCE</span>
              <span style="color: #64748b; font-size: 7px;">${docRef}</span>
            </div>
            <div style="height: 160px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
              <img src="${photoUrl}" alt="Inspection Evidence #${idx + 1}" style="max-height: 160px; max-width: 100%; object-fit: contain;" />
            </div>
            <div style="font-size: 7px; color: #475569; text-align: left;">
              Verified site delivery photograph / mill certificate attachment
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
    `
        : ""
    }

    <!-- ═══ DOCUMENT FOOTER ═══ -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & STATUTORY QUALITY RECORD — ISO 9001:2015 CLAUSE 8.4 — ${companyName}</div>
      <div>Document Ref: ${docRef}</div>
    </div>
  `;

  openPrintWindow(
    `${docRef} - Material Inspection Report (${mir.title})`,
    html,
  );
}

// =========================================================================
// 9. DAILY SITE LOG (SITE DIARY - MULTI-SPHERE) PDF GENERATOR (ISO 9001:2015 CLAUSE 8.5.1)
// =========================================================================
export function generateDailySiteLogPDF(
  log: DailySiteLog,
  project: Partial<Project> = {},
  company: Partial<Company> = {},
): void {
  const companyName = company.name || "JQMS ENTERPRISE QUALITY MANAGEMENT";
  const projectName = project.name || log.projectName || "CONSTRUCTION PROJECT";
  const projectCode = project.code || log.projectCode || "PRJ";
  const docRef =
    log.logNumber ||
    `DSL-${projectCode}-${log.generalConditions?.date || "TODAY"}`;

  const gen = log.generalConditions || {
    date: new Date().toISOString().slice(0, 10),
    shift: "DAY",
    weather: "CLEAR",
    workHoursStart: "07:00",
    workHoursEnd: "17:00",
    totalHours: 10,
  };

  const totalHeadcount = (log.manpower || []).reduce(
    (acc, m) => acc + (Number(m.headCount) || 0),
    0,
  );
  const totalManHours = (log.manpower || []).reduce(
    (acc, m) =>
      acc +
      (Number(m.totalManHours) ||
        (Number(m.headCount) || 0) *
          (Number(m.hoursWorked) || gen.totalHours || 8)),
    0,
  );

  const getWeatherIcon = (w?: string) => {
    switch (w) {
      case "SUNNY":
        return "☀️ Sunny";
      case "CLEAR":
        return "🌤️ Clear Sky";
      case "OVERCAST":
        return "☁️ Overcast / Cloudy";
      case "RAIN":
        return "🌧️ Rainy";
      case "HEAVY_RAIN":
        return "⛈️ Heavy Rain / Downpour";
      case "STORMY":
        return "🌩️ Stormy / High Winds";
      case "EXTREME_HEAT":
        return "🔥 Extreme Heat / High Temp";
      case "WINDY":
        return "💨 High Winds / Dust";
      default:
        return "🌤️ Normal Site Conditions";
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "APPROVED":
        return `<span style="padding: 2px 8px; background: #dcfce7; color: #15803d; border: 1px solid #86efac; border-radius: 3px; font-weight: 800; font-size: 8px;">APPROVED</span>`;
      case "SUBMITTED":
      case "UNDER_REVIEW":
        return `<span style="padding: 2px 8px; background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; border-radius: 3px; font-weight: 800; font-size: 8px;">UNDER REVIEW</span>`;
      case "REJECTED":
        return `<span style="padding: 2px 8px; background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; border-radius: 3px; font-weight: 800; font-size: 8px;">REVISION REQUIRED</span>`;
      default:
        return `<span style="padding: 2px 8px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 3px; font-weight: 800; font-size: 8px;">DRAFT RECORD</span>`;
    }
  };

  const html = `
    <!-- ═══ HEADER BLOCK ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${renderCompanyBrandCell(company, project)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">DAILY SITE LOG & STATUTORY DIARY</div>
          <div class="header-title-project">PROJECT: ${projectName} (${projectCode})</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.5.1 Operations & Site Quality Records</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${docRef}</span></div>
          <div><strong>Log Date:</strong> ${gen.date}</div>
          <div><strong>Shift:</strong> ${gen.shift || "DAY SHIFT"}</div>
          <div><strong>Status:</strong> ${getStatusBadge(log.status)}</div>
        </td>
      </tr>
    </table>

    <!-- ═══ 1.0 ENVIRONMENTAL & SITE CONDITIONS ═══ -->
    <div class="pdf-section">
      <div class="section-banner">1.0 GENERAL SITE & ENVIRONMENTAL CONDITIONS</div>
      <table class="meta-table">
        <tr>
          <td class="meta-label" style="width: 14%;">LOG DATE:</td>
          <td class="meta-value" style="width: 20%; font-weight: 800;">${gen.date}</td>
          <td class="meta-label" style="width: 13%;">SHIFT:</td>
          <td class="meta-value" style="width: 20%; font-weight: 700;">${gen.shift || "DAY SHIFT"}</td>
          <td class="meta-label" style="width: 13%;">HOURS:</td>
          <td class="meta-value" style="width: 20%;">${gen.workHoursStart || "07:00"} - ${gen.workHoursEnd || "17:00"} (${gen.totalHours || 10} hrs)</td>
        </tr>
        <tr>
          <td class="meta-label">WEATHER:</td>
          <td class="meta-value" style="font-weight: 700;">${getWeatherIcon(gen.weather)}</td>
          <td class="meta-label">TEMPERATURE:</td>
          <td class="meta-value">${gen.tempMin != null ? `${gen.tempMin}°C` : "—"} to ${gen.tempMax != null ? `${gen.tempMax}°C` : "—"}</td>
          <td class="meta-label">GROUND/SOIL:</td>
          <td class="meta-value">${gen.groundConditions || "Normal / Dry"} (RH: ${gen.humidity ? `${gen.humidity}%` : "—"})</td>
        </tr>
        ${
          gen.siteStatusNotes
            ? `
        <tr>
          <td class="meta-label">SITE OVERVIEW:</td>
          <td class="meta-value" colspan="5">${gen.siteStatusNotes}</td>
        </tr>
        `
            : ""
        }
      </table>
    </div>

    <!-- ═══ 2.0 SITE MANPOWER & TRADE HEADCOUNT (ALL SPHERES) ═══ -->
    <div class="pdf-section">
      <div class="section-banner" style="display: flex; justify-content: space-between;">
        <span>2.0 SITE MANPOWER & TRADE HEADCOUNT SUMMARY</span>
        <span style="font-size: 7.5px; text-transform: none; color: #cbd5e1;">TOTAL PERSONNEL: <strong>${totalHeadcount}</strong> &bull; MAN-HOURS: <strong>${totalManHours.toFixed(1)} hrs</strong></span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 28%;">TRADE / DISCIPLINE</th>
            <th style="width: 18%;">CATEGORY</th>
            <th style="width: 24%;">CONTRACTOR / SUB-TEAM</th>
            <th style="width: 10%; text-align: center;">HEADCOUNT</th>
            <th style="width: 10%; text-align: center;">HOURS/PERSON</th>
            <th style="width: 10%; text-align: center;">TOTAL HRS</th>
          </tr>
        </thead>
        <tbody>
          ${
            log.manpower && log.manpower.length > 0
              ? log.manpower
                  .map((m, idx) => {
                    const hrs = Number(m.hoursWorked) || gen.totalHours || 8;
                    const cnt = Number(m.headCount) || 0;
                    const tot = Number(m.totalManHours) || cnt * hrs;
                    return `
              <tr>
                <td style="font-weight: 700; color: #0f172a;">${m.tradeName}</td>
                <td style="font-size: 7.5px; color: #64748b;">${m.tradeCategory || "Direct Execution"}</td>
                <td>${m.companyOrSubcontractor || "Direct Labor"}</td>
                <td style="text-align: center; font-weight: 800; color: #0284c7;">${cnt}</td>
                <td style="text-align: center;">${hrs}</td>
                <td style="text-align: center; font-weight: 700;">${tot.toFixed(1)}</td>
              </tr>
            `;
                  })
                  .join("")
              : `
            <tr>
              <td colspan="6" style="text-align: center; color: #94a3b8; padding: 6px;">No manpower entries logged for this shift.</td>
            </tr>
          `
          }
          <tr style="background: #f1f5f9; font-weight: 800; border-top: 1.5px solid #cbd5e1;">
            <td colspan="3" style="text-align: right; text-transform: uppercase; font-size: 7.5px; color: #334155;">Cumulative Site Workforce:</td>
            <td style="text-align: center; color: #0284c7; font-size: 8.5px;">${totalHeadcount}</td>
            <td style="text-align: center; color: #64748b; font-size: 7px;">Avg ${gen.totalHours || 8}h</td>
            <td style="text-align: center; color: #0f172a; font-size: 8.5px;">${totalManHours.toFixed(1)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ═══ 3.0 PLANT, MACHINERY & HEAVY EQUIPMENT ═══ -->
    ${
      log.equipment && log.equipment.length > 0
        ? `
    <div class="pdf-section">
      <div class="section-banner">3.0 PLANT, MACHINERY & HEAVY EQUIPMENT LOG</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 25%;">EQUIPMENT TYPE</th>
            <th style="width: 18%;">PLANT / FLEET ID</th>
            <th style="width: 10%; text-align: center;">QTY</th>
            <th style="width: 18%; text-align: center;">STATUS</th>
            <th style="width: 12%; text-align: center;">HOURS OPERATED</th>
            <th style="width: 17%;">OPERATOR / REMARKS</th>
          </tr>
        </thead>
        <tbody>
          ${log.equipment
            .map(
              (eq) => `
            <tr>
              <td style="font-weight: 700;">${eq.equipmentType}</td>
              <td style="font-family: monospace; font-size: 7px;">${eq.plantNumber || "—"}</td>
              <td style="text-align: center; font-weight: 700;">${eq.quantity || 1}</td>
              <td style="text-align: center;">
                <span style="padding: 1px 6px; border-radius: 2px; font-weight: 700; font-size: 7px; ${
                  eq.status === "OPERATIONAL"
                    ? "background: #dcfce7; color: #15803d;"
                    : eq.status === "BREAKDOWN"
                      ? "background: #fee2e2; color: #b91c1c;"
                      : "background: #fef3c7; color: #b45309;"
                }">${eq.status}</span>
              </td>
              <td style="text-align: center; font-weight: 700;">${eq.hoursUsed != null ? `${eq.hoursUsed} hrs` : "—"}</td>
              <td style="font-size: 7.5px;">${eq.operatorName || eq.notes || "Standard Operations"}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
    `
        : ""
    }

    <!-- ═══ 4.0 TRADE EXECUTION & SITE ACTIVITIES ═══ -->
    <div class="pdf-section">
      <div class="section-banner">4.0 SITE WORK ACTIVITIES & PROGRESS LOG (BY LOCATION / LEVEL / ELEMENT)</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 24%;">LOCATION / LEVEL / ELEMENT</th>
            <th style="width: 16%;">TRADE DISCIPLINE</th>
            <th style="width: 36%;">ACTIVITY & SCOPE EXECUTED</th>
            <th style="width: 12%; text-align: center;">PROGRESS</th>
            <th style="width: 12%; text-align: center;">STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${
            log.activities && log.activities.length > 0
              ? log.activities
                  .map(
                    (act) => `
            <tr>
              <td style="font-weight: 700; color: #0f172a;">
                ${act.levelName || "Site Wide"} ${act.elementName ? `&bull; ${act.elementName}` : ""}
                ${act.gridlineRef ? `<div style="font-size: 7px; color: #64748b; font-weight: normal;">Grid: ${act.gridlineRef}</div>` : ""}
              </td>
              <td style="font-size: 7.5px; font-weight: 600; color: #2563eb;">${act.trade}</td>
              <td style="font-size: 8px;">
                <div>${act.description}</div>
                ${act.quantityDone ? `<div style="font-size: 7px; color: #475569; margin-top: 1px;">Output: <strong>${act.quantityDone}</strong></div>` : ""}
                ${act.delayNotes ? `<div style="font-size: 7px; color: #dc2626; margin-top: 1px;">Note: ${act.delayNotes}</div>` : ""}
              </td>
              <td style="text-align: center; font-weight: 800; color: #0284c7;">${act.progressPercentage != null ? `${act.progressPercentage}%` : "—"}</td>
              <td style="text-align: center;">
                <span style="padding: 1px 5px; border-radius: 2px; font-size: 7px; font-weight: 700; ${
                  act.status === "COMPLETED"
                    ? "background: #dcfce7; color: #15803d;"
                    : act.status === "DELAYED"
                      ? "background: #fee2e2; color: #b91c1c;"
                      : "background: #dbeafe; color: #1d4ed8;"
                }">${act.status.replace("_", " ")}</span>
              </td>
            </tr>
          `,
                  )
                  .join("")
              : `
            <tr>
              <td colspan="5" style="text-align: center; color: #94a3b8; padding: 6px;">No specific activity breakdowns logged for this shift.</td>
            </tr>
          `
          }
        </tbody>
      </table>
    </div>

    <!-- ═══ 5.0 QA/QC COMPLIANCE & INSPECTIONS SPHERE ═══ -->
    <div class="pdf-section">
      <div class="section-banner">5.0 QUALITY ASSURANCE, INSPECTIONS & HOLD POINTS (QA/QC SPHERE)</div>
      ${
        log.quality?.inspections && log.quality.inspections.length > 0
          ? `
      <table class="data-table" style="margin-bottom: 6px;">
        <thead>
          <tr>
            <th style="width: 18%;">INSPECTION TYPE</th>
            <th style="width: 18%;">REF / DOC NO</th>
            <th style="width: 26%;">LOCATION / STRUCTURAL ELEMENT</th>
            <th style="width: 18%;">TRADE</th>
            <th style="width: 20%; text-align: center;">RESULT / DISPOSITION</th>
          </tr>
        </thead>
        <tbody>
          ${log.quality.inspections
            .map(
              (insp) => `
            <tr>
              <td style="font-weight: 700;">${insp.inspectionType}</td>
              <td style="font-family: monospace; font-size: 7px;">${insp.refNo || "—"}</td>
              <td>${insp.levelName || "—"} ${insp.elementName ? `&bull; ${insp.elementName}` : ""}</td>
              <td>${insp.trade || "Civil/Structural"}</td>
              <td style="text-align: center;">
                <span style="padding: 1px 6px; border-radius: 2px; font-weight: 800; font-size: 7px; ${
                  insp.result === "PASSED"
                    ? "background: #dcfce7; color: #15803d;"
                    : insp.result === "PASSED_AS_NOTED"
                      ? "background: #dbeafe; color: #1d4ed8;"
                      : "background: #fee2e2; color: #b91c1c;"
                }">${insp.result.replace(/_/g, " ")}</span>
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      `
          : `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; padding: 6px 10px; font-size: 7.5px; color: #64748b;">
        No formal hold-point inspection requests performed or witnessed during this shift.
      </div>
      `
      }
      ${
        log.quality?.qualityNotes ||
        (log.quality?.ncrsRaised && log.quality.ncrsRaised.length > 0)
          ? `
      <div style="background: #fafafa; border: 1px solid #cbd5e1; border-top: none; padding: 6px 10px; font-size: 7.5px; color: #334155;">
        ${log.quality?.ncrsRaised && log.quality.ncrsRaised.length > 0 ? `<div><strong>NCRs Raised / Monitored:</strong> <span style="color: #dc2626; font-weight: 700;">${log.quality.ncrsRaised.join(", ")}</span></div>` : ""}
        ${log.quality?.qualityNotes ? `<div style="margin-top: 2px;"><strong>QA/QC Notes:</strong> ${log.quality.qualityNotes}</div>` : ""}
      </div>
      `
          : ""
      }
    </div>

    <!-- ═══ 6.0 MATERIALS LOGISTICS & CONCRETE POURS ═══ -->
    ${
      (log.materials?.deliveries && log.materials.deliveries.length > 0) ||
      (log.materials?.concretePours && log.materials.concretePours.length > 0)
        ? `
    <div class="pdf-section">
      <div class="section-banner">6.0 MATERIALS LOGISTICS, DELIVERIES & CONCRETE POURS</div>
      ${
        log.materials?.concretePours && log.materials.concretePours.length > 0
          ? `
      <div style="font-size: 7.5px; font-weight: 800; color: #0f172a; margin-bottom: 2px; text-transform: uppercase;">A. Concrete Pour Log</div>
      <table class="data-table" style="margin-bottom: 6px;">
        <thead>
          <tr>
            <th style="width: 24%;">STRUCTURAL ELEMENT</th>
            <th style="width: 14%; text-align: center;">GRADE</th>
            <th style="width: 18%;">SUPPLIER / TRUCKS</th>
            <th style="width: 14%; text-align: center;">POURED (m³)</th>
            <th style="width: 14%; text-align: center;">SLUMP (mm)</th>
            <th style="width: 16%; text-align: center;">CUBES CAST</th>
          </tr>
        </thead>
        <tbody>
          ${log.materials.concretePours
            .map(
              (cp) => `
            <tr>
              <td style="font-weight: 700;">${cp.elementName} ${cp.levelName ? `(${cp.levelName})` : ""}</td>
              <td style="text-align: center; font-weight: 800; color: #0284c7;">${cp.concreteGrade}</td>
              <td style="font-size: 7px;">${cp.supplier || "Batching Plant"} (${cp.truckCount || 1} trucks)</td>
              <td style="text-align: center; font-weight: 800;">${cp.volumePoured} m³</td>
              <td style="text-align: center;">${cp.slumpMm ? `${cp.slumpMm} mm` : "—"}</td>
              <td style="text-align: center; font-family: monospace; font-size: 7px;">${cp.cubeSampleNumber || "Standard 6-Cube Set"}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      `
          : ""
      }

      ${
        log.materials?.deliveries && log.materials.deliveries.length > 0
          ? `
      <div style="font-size: 7.5px; font-weight: 800; color: #0f172a; margin-bottom: 2px; text-transform: uppercase;">B. Material Deliveries Received</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 26%;">MATERIAL DESCRIPTION</th>
            <th style="width: 20%;">SUPPLIER / VENDOR</th>
            <th style="width: 18%;">DELIVERY NOTE NO</th>
            <th style="width: 16%; text-align: center;">QUANTITY</th>
            <th style="width: 20%; text-align: center;">INSPECTION STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${log.materials.deliveries
            .map(
              (del) => `
            <tr>
              <td style="font-weight: 700;">${del.description}</td>
              <td>${del.supplier}</td>
              <td style="font-family: monospace; font-size: 7px;">${del.ticketNumber || "—"}</td>
              <td style="text-align: center; font-weight: 700;">${del.quantity} ${del.unit}</td>
              <td style="text-align: center;">
                <span style="padding: 1px 6px; border-radius: 2px; font-weight: 800; font-size: 7px; ${
                  del.status === "ACCEPTED" || del.status === "APPROVED"
                    ? "background: #dcfce7; color: #15803d;"
                    : del.status === "APPROVED_AS_NOTED" || del.status === "APPROVED AS NOTED"
                      ? "background: #e0f2fe; color: #0369a1;"
                      : del.status === "REJECTED"
                        ? "background: #fee2e2; color: #b91c1c;"
                        : "background: #fef3c7; color: #b45309;"
                }">${(del.status || "").replace(/_/g, " ")}</span>
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      `
          : ""
      }
    </div>
    `
        : ""
    }

    <!-- ═══ 7.0 HEALTH, SAFETY & ENVIRONMENT (HSE SPHERE) ═══ -->
    <div class="pdf-section">
      <div class="section-banner">7.0 HEALTH, SAFETY & ENVIRONMENT (HSE SPHERE)</div>
      <table class="meta-table">
        <tr>
          <td class="meta-label" style="width: 18%;">TOOLBOX TALK (TBT):</td>
          <td class="meta-value" style="width: 48%; font-weight: 600;">
            ${log.hse?.toolboxTalkTopic || "Daily Morning Safety & PPE Briefing"}
          </td>
          <td class="meta-label" style="width: 18%;">TBT ATTENDANCE:</td>
          <td class="meta-value" style="width: 16%; font-weight: 800; color: #0284c7;">
            ${log.hse?.toolboxTalkAttendees != null ? `${log.hse.toolboxTalkAttendees} Workers` : `${totalHeadcount} Workers`}
          </td>
        </tr>
        <tr>
          <td class="meta-label">INCIDENT RECORD:</td>
          <td class="meta-value" style="font-weight: 800; color: ${log.hse?.incidentsReported ? "#dc2626" : "#15803d"};">
            ${log.hse?.incidentsReported ? `⚠️ ${log.hse.incidentsReported} INCIDENTS REPORTED (${log.hse.incidentDetails || ""})` : "✅ ZERO (0) ACCIDENTS / LOST TIME INJURIES (LTI)"}
          </td>
          <td class="meta-label">HOUSEKEEPING:</td>
          <td class="meta-value" style="font-weight: 700;">
            ${log.hse?.housekeepingRating || "GOOD"}
          </td>
        </tr>
        ${
          log.hse?.permitsToWork && log.hse.permitsToWork.length > 0
            ? `
        <tr>
          <td class="meta-label">ACTIVE PERMITS (PTW):</td>
          <td class="meta-value" colspan="3">
            ${log.hse.permitsToWork.map((p) => `<strong>${p.permitType}</strong> at ${p.location} (Auth: ${p.approvedBy})`).join(" &bull; ")}
          </td>
        </tr>
        `
            : ""
        }
      </table>
    </div>

    <!-- ═══ 8.0 DELAYS, OBSTACLES & CONSULTANT OVERSIGHT ═══ -->
    ${
      (log.delays && log.delays.length > 0) || log.consultant?.observations
        ? `
    <div class="pdf-section">
      <div class="section-banner">8.0 SITE DELAYS, HINDRANCES & CONSULTANT REMARKS</div>
      ${
        log.delays && log.delays.length > 0
          ? `
      <table class="data-table" style="margin-bottom: 6px;">
        <thead>
          <tr>
            <th style="width: 18%;">CATEGORY</th>
            <th style="width: 22%;">LOCATION / TRADE</th>
            <th style="width: 14%; text-align: center;">IMPACT (HRS)</th>
            <th style="width: 46%;">DESCRIPTION & MITIGATION ACTION</th>
          </tr>
        </thead>
        <tbody>
          ${log.delays
            .map(
              (d) => `
            <tr>
              <td style="font-weight: 700; color: #dc2626;">${d.category}</td>
              <td>${d.location || "General Site"} ${d.trade ? `(${d.trade})` : ""}</td>
              <td style="text-align: center; font-weight: 800; color: #dc2626;">${d.impactHours} hrs</td>
              <td style="font-size: 7.5px;">
                <div>${d.description}</div>
                ${d.remedialAction ? `<div style="font-size: 7px; color: #15803d; margin-top: 2px;">Action: ${d.remedialAction}</div>` : ""}
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      `
          : ""
      }
      ${
        log.consultant?.observations
          ? `
      <div style="background: #fafafa; border: 1px solid #cbd5e1; border-top: none; padding: 6px 10px; font-size: 7.5px; color: #334155;">
        <div><strong>Consultant / Client Representative Walk Remarks:</strong> ${log.consultant.observations}</div>
        ${log.consultant?.directivesIssued ? `<div style="margin-top: 2px;"><strong>Directives Issued:</strong> ${log.consultant.directivesIssued}</div>` : ""}
      </div>
      `
          : ""
      }
    </div>
    `
        : ""
    }

    <!-- ═══ 9.0 MULTI-SPHERE DIGITAL CERTIFICATION (QUAD-PARTY SIGN-OFF) ═══ -->
    <div class="pdf-section">
      <div class="section-banner">9.0 MULTI-SPHERE DIGITAL CERTIFICATION & AUTHORIZATION</div>
      <table class="signoff-table" style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-top: none;">
        <tr>
          <!-- Sphere 1: Site Execution / Contractor -->
          <td style="width: 25%; padding: 8px; border-right: 1px solid #e2e8f0; vertical-align: top; background: #fafafa;">
            <div class="sig-role-header" style="font-size: 7px; font-weight: 800; color: #0284c7; margin-bottom: 4px;">
              SITE ENGINEER / CONTRACTOR
            </div>
            <div style="font-size: 7.5px; color: #334155; margin-bottom: 2px;">
              Name: <strong>${log.signOffs?.SITE_ENGINEER?.signedBy?.name || log.createdByName || "Site Engineer"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${log.signOffs?.SITE_ENGINEER?.signedBy?.designation || "Project Field Engineer"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${
                log.signOffs?.SITE_ENGINEER?.signed
                  ? `
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">DIGITALLY SIGNED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${log.signOffs.SITE_ENGINEER.signedBy?.digitalStamp || "VERIFIED-EXECUTION"}</div>
              `
                  : `
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">RECORDED BY CREATOR</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${log.createdByRole || "SITE-EXECUTION"}</div>
              `
              }
            </div>
          </td>

          <!-- Sphere 2: QA/QC Quality Authority -->
          <td style="width: 25%; padding: 8px; border-right: 1px solid #e2e8f0; vertical-align: top; background: #fafafa;">
            <div class="sig-role-header" style="font-size: 7px; font-weight: 800; color: #16a34a; margin-bottom: 4px;">
              QA/QC QUALITY LEAD
            </div>
            <div style="font-size: 7.5px; color: #334155; margin-bottom: 2px;">
              Name: <strong>${log.signOffs?.QAQC_ENGINEER?.signedBy?.name || "Pending QA/QC Certification"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${log.signOffs?.QAQC_ENGINEER?.signedBy?.designation || "QA/QC Lead Engineer"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${
                log.signOffs?.QAQC_ENGINEER?.signed
                  ? `
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">ISO 9001 CERTIFIED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${log.signOffs.QAQC_ENGINEER.signedBy?.digitalStamp || "QAQC-CERT-PASSED"}</div>
              `
                  : `
                <div style="font-family: monospace; font-size: 6.5px; color: #94a3b8;">PENDING SIGN-OFF</div>
              `
              }
            </div>
          </td>

          <!-- Sphere 3: Safety / HSE Manager -->
          <td style="width: 25%; padding: 8px; border-right: 1px solid #e2e8f0; vertical-align: top; background: #fafafa;">
            <div class="sig-role-header" style="font-size: 7px; font-weight: 800; color: #ea580c; margin-bottom: 4px;">
              HSE & SAFETY OFFICER
            </div>
            <div style="font-size: 7.5px; color: #334155; margin-bottom: 2px;">
              Name: <strong>${log.signOffs?.SAFETY_OFFICER?.signedBy?.name || "Pending HSE Clearance"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${log.signOffs?.SAFETY_OFFICER?.signedBy?.designation || "Site Safety Manager"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${
                log.signOffs?.SAFETY_OFFICER?.signed
                  ? `
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">SAFETY CLEARED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${log.signOffs.SAFETY_OFFICER.signedBy?.digitalStamp || "HSE-CLEARED"}</div>
              `
                  : `
                <div style="font-family: monospace; font-size: 6.5px; color: #94a3b8;">PENDING SIGN-OFF</div>
              `
              }
            </div>
          </td>

          <!-- Sphere 4: Consultant / PM Final Governance -->
          <td style="width: 25%; padding: 8px; vertical-align: top; background: #fafafa;">
            <div class="sig-role-header" style="font-size: 7px; font-weight: 800; color: #7c3aed; margin-bottom: 4px;">
              CONSULTANT / PROJECT MGR
            </div>
            <div style="font-size: 7.5px; color: #334155; margin-bottom: 2px;">
              Name: <strong>${log.signOffs?.PROJECT_MANAGER?.signedBy?.name || log.signOffs?.CONSULTANT?.signedBy?.name || "Pending Final Endorsement"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${log.signOffs?.PROJECT_MANAGER?.signedBy?.designation || "Project Manager / Consultant"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${
                log.signOffs?.PROJECT_MANAGER?.signed ||
                log.signOffs?.CONSULTANT?.signed
                  ? `
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">APPROVED & ENDORSED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${log.signOffs?.PROJECT_MANAGER?.signedBy?.digitalStamp || "PM-AUTHORIZED"}</div>
              `
                  : `
                <div style="font-family: monospace; font-size: 6.5px; color: #94a3b8;">PENDING APPROVAL</div>
              `
              }
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- ═══ 10.0 ATTACHED SITE PHOTOGRAPHS ═══ -->
    ${
      log.photos && log.photos.length > 0
        ? `
    <div class="pdf-section" style="page-break-before: auto;">
      <div class="section-banner">10.0 ATTACHED SITE PHOTOGRAPHIC EVIDENCE (${log.photos.length} PHOTOS)</div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px; background: #ffffff; border: 1px solid #cbd5e1; border-top: none; padding: 8px;">
        ${log.photos
          .map(
            (p, idx) => `
          <div style="width: 48%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; text-align: center; background: #f8fafc; page-break-inside: avoid; margin-bottom: 6px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #0284c7; text-align: left; margin-bottom: 3px; display: flex; justify-content: space-between;">
              <span>PHOTO #${idx + 1} ${p.tradeTag ? `&bull; ${p.tradeTag}` : ""}</span>
              <span style="color: #64748b; font-size: 7px;">${p.location || "Site"}</span>
            </div>
            <div style="height: 150px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
              <img src="${p.url}" alt="Site Evidence #${idx + 1}" style="max-height: 150px; max-width: 100%; object-fit: contain;" />
            </div>
            <div style="font-size: 7px; color: #475569; text-align: left;">
              ${p.caption || "Daily site work progress photo"}
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
    `
        : ""
    }

    <!-- ═══ DOCUMENT FOOTER ═══ -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & STATUTORY QUALITY RECORD — ISO 9001:2015 CLAUSE 8.5.1 — ${companyName}</div>
      <div>Document Ref: ${docRef} &bull; Date: ${gen.date}</div>
    </div>
  `;

  openPrintWindow(`${docRef} - Daily Site Log (${gen.date})`, html);
}

export { generateStandardNCRPDF, generateNewWeeklyPresentationPDF };
export {
  exportBarCuttingSchedulePDF,
  exportBarCuttingScheduleCSV,
  printBarCuttingSchedule,
  generateCuttingScheduleHTML,
} from "@/services/pdf/barCuttingReport";
export {
  printMaterialTakeoffReport,
  type PrintMaterialTakeoffData,
} from "@/services/pdf/materialTakeoffReport";

