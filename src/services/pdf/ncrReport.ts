import { renderCompanyBrandCell } from "@/lib/companyHelper";

export interface NCRPhoto {
  url: string;
  caption?: string;
  timestamp?: string;
}

export function escapeHtml(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const formatAlphanumericDate = (dateStr?: string | number | null): string => {
  if (!dateStr || dateStr === "—" || dateStr === "N/A" || dateStr === "Not set") return "—";
  const date = typeof dateStr === "number" ? new Date(dateStr) : new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (timestamp?: string | number | null): string => {
  if (!timestamp || timestamp === "—") return "—";
  const date = typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);
  if (isNaN(date.getTime())) return String(timestamp);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export interface NCRStatusHistoryItem {
  status: "PENDING" | "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED" | "REJECTED" | string;
  userName?: string;
  userRole?: string;
  timestamp: string | number;
  comment?: string;
}

export interface StandardNCRPDFData {
  logoBase64?: string;
  ncrNumber: string;
  revisionNo?: string;
  projectName: string;
  projectAddress?: string;
  companyName: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  contractorName?: string;
  elementName: string;
  elementNames?: string[];
  locationLevel: string;
  gridLine: string;
  specReference: string;
  drawingNumber: string;
  dispositionType: "Rework" | "Repair" | "Use As-Is" | "Scrap" | string;
  dateFound: string;
  deadline?: string;
  reportedBy: string;
  assignedTo?: string;
  assignedToName?: string;
  trade?: string;
  subtrade?: string;
  descriptionItems: string[];
  rootCauseDetails?: string;
  rootCauseType: "Workmanship" | "Material Defect" | "Drawing Error" | "Other" | string;
  rootCauseOtherText?: string;
  correctiveActions: string[];
  preventiveAction?: string | string[];
  beforePhotos?: NCRPhoto[];
  afterPhotos?: NCRPhoto[];
  statusHistory?: NCRStatusHistoryItem[];
  verification?: {
    reInspected: boolean;
    fixSatisfiesSpec: boolean;
    photosTaken: boolean;
  };
  verificationRemarks?: {
    reInspected?: string;
    fixSatisfiesSpec?: string;
    photosTaken?: string;
  };
  finalStatus: "PENDING" | "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED" | "REJECTED" | string;
  qaqcEngineerName?: string;
  siteManagerName?: string;
  consultantName?: string;
  signDate?: string;
  closedAt?: string | number | null;
}

export const generateStandardNCRPDF = (data: StandardNCRPDFData): void => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const totalPhotos =
    (data.beforePhotos?.length || 0) + (data.afterPhotos?.length || 0);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CLOSED":
        return { bg: "#dcfce7", text: "#15803d", border: "#86efac" };
      case "RESOLVED":
        return { bg: "#e0f2fe", text: "#0369a1", border: "#7dd3fc" };
      case "UNDER_REVIEW":
        return { bg: "#fef3c7", text: "#b45309", border: "#fcd34d" };
      case "REJECTED":
        return { bg: "#fee2e2", text: "#b91c1c", border: "#fca5a5" };
      case "OPEN":
      default:
        return { bg: "#fee2e2", text: "#c2410c", border: "#fed7aa" };
    }
  };

  const statusStyle = getStatusColor(data.finalStatus);
  const effectiveFinalStatus = (data.finalStatus || "OPEN").replace(/_/g, " ");

  const assignedRepresentative =
    data.assignedTo ||
    data.assignedToName ||
    (data.trade
      ? `${data.trade}${data.subtrade ? ` (${data.subtrade})` : ""}`
      : "Unassigned");

  const effectiveOriginator = data.reportedBy || "QA/QC Inspector";

  const effectiveSignDate =
    data.signDate ||
    (data.finalStatus === "CLOSED"
      ? formatAlphanumericDate(data.closedAt || new Date().toISOString())
      : "—");

  const effectiveQaqcName =
    data.qaqcEngineerName || (data.finalStatus === "CLOSED" ? effectiveOriginator : "");

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.ncrNumber || "NCR"} - Non-Conformance Report</title>
      <style>
        *, *::before, *::after {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        @page {
          size: A4 portrait;
          margin: 12mm 10mm 14mm 10mm;
          @bottom-left {
            content: "CONFIDENTIAL & PROPRIETARY — ${escapeHtml(data.companyName || "JQMS")}";
            font-family: 'Segoe UI', -apple-system, sans-serif;
            font-size: 7.5px;
            color: #64748b;
            font-weight: 600;
          }
          @bottom-right {
            content: "Page " counter(page) " of " counter(pages);
            font-family: 'Segoe UI', -apple-system, sans-serif;
            font-size: 7.5px;
            color: #64748b;
            font-weight: 700;
          }
        }

        body { 
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; 
          font-size: 9px; 
          color: #1e293b; 
          margin: 0; 
          padding: 12mm 10mm 14mm 10mm;
          line-height: 1.35; 
          background: #fff; 
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .pdf-section {
          page-break-inside: avoid;
          break-inside: avoid;
          margin-bottom: 8px;
        }

        .doc-header { width: 100%; border: 1.5px solid #0f172a; border-collapse: collapse; margin-bottom: 8px; }
        .doc-header td { border: 1px solid #cbd5e1; padding: 6px; vertical-align: middle; }
        .header-brand { background: #f8fafc; text-align: center; }
        .header-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #0f172a; text-align: center; }
        .header-sub { font-size: 9.5px; font-weight: 700; color: #ea580c; margin-top: 2px; text-transform: uppercase; text-align: center; }
        .header-iso { font-size: 7.5px; font-weight: 600; color: #64748b; text-transform: uppercase; text-align: center; margin-top: 1px; }
        
        .meta-box { font-size: 8px; line-height: 1.5; color: #334155; }
        .status-badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-weight: 800; font-size: 8px; background: ${statusStyle.bg}; color: ${statusStyle.text}; border: 1px solid ${statusStyle.border}; }

        table.section-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; border: 1px solid #cbd5e1; }
        table.section-table th, table.section-table td { border: 1px solid #cbd5e1; padding: 4.5px 6.5px; text-align: left; vertical-align: top; }
        
        .lbl { background-color: #f1f5f9; font-weight: 700; font-size: 8px; color: #334155; text-transform: uppercase; letter-spacing: 0.3px; }
        .val { font-size: 8.5px; color: #0f172a; }
        
        .section-title { 
          background: #0f172a; 
          color: #f8fafc; 
          font-weight: 700; 
          font-size: 9px; 
          padding: 3.5px 8px; 
          text-transform: uppercase; 
          letter-spacing: 0.6px;
          margin-bottom: 3px;
          border-left: 4px solid #ea580c;
        }

        .box { display: inline-block; width: 11px; height: 11px; border: 1.5px solid #0f172a; border-radius: 2px; text-align: center; line-height: 10px; font-size: 8.5px; font-weight: 800; color: #ea580c; margin-right: 4px; background: #fff; }
        .box-checked { background: #0f172a; color: #fff; }

        .photo-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
        .photo-card { width: 48.5%; border: 1px solid #cbd5e1; border-radius: 4px; padding: 5px; text-align: center; background: #f8fafc; page-break-inside: avoid; break-inside: avoid; }
        .photo-card img { max-width: 100%; max-height: 160px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 2px; background: #000; }
        .photo-caption { font-size: 7.5px; font-weight: 700; color: #0f172a; margin-top: 4px; text-transform: uppercase; }
        .photo-tag { display: inline-block; padding: 1px 4px; font-size: 7px; font-weight: 700; border-radius: 2px; margin-bottom: 3px; }
        .tag-before { background: #fee2e2; color: #991b1b; }
        .tag-after { background: #dcfce7; color: #166534; }

        .sig-table { width: 100%; border-collapse: collapse; margin-top: 4px; border: 1px solid #cbd5e1; }
        .sig-table td { border: 1px solid #cbd5e1; padding: 6px; width: 33.33%; vertical-align: top; height: 70px; background: #fafafa; }
        .sig-title { font-weight: 700; font-size: 7.5px; text-transform: uppercase; color: #ea580c; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 5px; letter-spacing: 0.4px; }
        .sig-line { font-size: 8px; color: #334155; margin-top: 3px; }

        .footer-fallback {
          display: none;
        }

        @media print {
          body { margin: 0; }
          .footer-fallback {
            display: flex;
            justify-content: space-between;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            font-size: 7.5px;
            color: #64748b;
            border-top: 1px solid #cbd5e1;
            padding-top: 4px;
            background: #fff;
          }
        }
      </style>
    </head>
    <body>

      <table class="doc-header">
        <tr>
          <td style="width: 22%;" class="header-brand">
            ${renderCompanyBrandCell({
              name: data.companyName,
              logoUrl: data.logoBase64,
              address: data.companyAddress,
              email: data.companyEmail,
              phone: data.companyPhone,
            })}
          </td>
          <td style="width: 53%;">
            <div class="header-title">Non-Conformance Report (NCR)</div>
            <div class="header-sub">PROJECT: ${data.projectName || "Standard Project"}</div>
            <div class="header-iso">ISO 9001:2015 Clause 8.7 & 10.2 Quality Management System</div>
          </td>
          <td style="width: 25%;" class="meta-box">
            <strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:700;">${data.ncrNumber || "NCR-001"}</span><br/>
            <strong>Rev No:</strong> ${data.revisionNo || "00"}<br/>
            <strong>Date Found:</strong> ${formatAlphanumericDate(data.dateFound)}<br/>
            <strong>Status:</strong> <span class="status-badge">${effectiveFinalStatus}</span>
          </td>
        </tr>
      </table>

      <div class="pdf-section">
        <table class="section-table">
          <tr>
            <td class="lbl" style="width: 18%;">Main Contractor:</td>
            <td class="val" style="width: 32%;">${data.contractorName || data.companyName || "Main Contractor"}</td>
            <td class="lbl" style="width: 18%;">Date Logged:</td>
            <td class="val" style="width: 32%;">${formatAlphanumericDate(data.dateFound)}</td>
          </tr>
          <tr>
            <td class="lbl">Structure / Element${data.elementNames && data.elementNames.length > 1 ? `s (${data.elementNames.length})` : ""}:</td>
            <td class="val"><strong>${data.elementName || "Structural Element / Site Area"}</strong></td>
            <td class="lbl">Target Closure:</td>
            <td class="val">${formatAlphanumericDate(data.deadline)}</td>
          </tr>
          <tr>
            <td class="lbl">Location / Level:</td>
            <td class="val">${data.locationLevel || "All Levels / Site"}</td>
            <td class="lbl">Assigned To (Trade):</td>
            <td class="val"><strong>${assignedRepresentative}</strong></td>
          </tr>
          <tr>
            <td class="lbl">Grid Line / Axis:</td>
            <td class="val">${data.gridLine || "—"}</td>
            <td class="lbl">Specification Ref:</td>
            <td class="val">${data.specReference || "BS 8110 / BS EN 1992 (Eurocode 2)"}</td>
          </tr>
          <tr>
            <td class="lbl">Drawing Ref No:</td>
            <td class="val" colspan="3">${data.drawingNumber || "—"}</td>
          </tr>
        </table>
      </div>

      <div class="pdf-section">
        <div class="section-title">1.0 Description of Non-Conformance</div>
        <table class="section-table">
          <tr>
            <td style="padding: 6px 8px;">
              <p style="margin: 0 0 4px 0; font-weight: 700; color: #0f172a;">Observed Defect / Non-Compliance Details:</p>
              <ol style="margin: 0; padding-left: 16px; color: #334155;">
                ${
                  data.descriptionItems && data.descriptionItems.length > 0
                    ? data.descriptionItems.map((item) => `<li style="margin-bottom: 2px;">${item}</li>`).join("")
                    : `<li style="margin-bottom: 2px;">No itemized defect description recorded.</li>`
                }
              </ol>
              <div style="margin-top: 6px; font-size: 8px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 3px; display: flex; justify-content: space-between;">
                <span><strong>Originator / Inspector:</strong> ${effectiveOriginator}</span>
                <span><strong>Assigned Action Owner:</strong> ${assignedRepresentative}</span>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <div class="pdf-section">
        <div class="section-title">2.0 Disposition & Root Cause Assessment</div>
        <table class="section-table">
          <tr>
            <td class="lbl" style="width: 22%;">Disposition Strategy:</td>
            <td class="val">
              <span class="box ${data.dispositionType === "Rework" ? "box-checked" : ""}">${data.dispositionType === "Rework" ? "✓" : ""}</span> Rework &nbsp;&nbsp;
              <span class="box ${data.dispositionType === "Repair" ? "box-checked" : ""}">${data.dispositionType === "Repair" ? "✓" : ""}</span> Repair &nbsp;&nbsp;
              <span class="box ${data.dispositionType === "Use As-Is" ? "box-checked" : ""}">${data.dispositionType === "Use As-Is" ? "✓" : ""}</span> Use As-Is (Concession) &nbsp;&nbsp;
              <span class="box ${data.dispositionType === "Scrap" || data.dispositionType === "Reject" ? "box-checked" : ""}">${data.dispositionType === "Scrap" || data.dispositionType === "Reject" ? "✓" : ""}</span> Reject / Scrap
            </td>
          </tr>
          <tr>
            <td class="lbl">Root Cause Category:</td>
            <td class="val">
              <span class="box ${data.rootCauseType === "Workmanship" ? "box-checked" : ""}">${data.rootCauseType === "Workmanship" ? "✓" : ""}</span> Workmanship &nbsp;&nbsp;
              <span class="box ${data.rootCauseType === "Material Defect" ? "box-checked" : ""}">${data.rootCauseType === "Material Defect" ? "✓" : ""}</span> Material Defect &nbsp;&nbsp;
              <span class="box ${data.rootCauseType === "Drawing Error" ? "box-checked" : ""}">${data.rootCauseType === "Drawing Error" ? "✓" : ""}</span> Drawing / Design Error &nbsp;&nbsp;
              <span class="box ${data.rootCauseType === "Other" ? "box-checked" : ""}">${data.rootCauseType === "Other" ? "✓" : ""}</span> Other ${data.rootCauseOtherText ? `(${data.rootCauseOtherText})` : ""}
            </td>
          </tr>
          ${
            data.rootCauseDetails
              ? `
          <tr>
            <td class="lbl">Root Cause Evaluation:</td>
            <td class="val" style="color: #334155;">${data.rootCauseDetails}</td>
          </tr>
          `
              : ""
          }
        </table>
      </div>

      <div class="pdf-section">
        <div class="section-title">3.0 Corrective & Preventive Action Plan (CAPA)</div>
        <table class="section-table">
          <tr>
            <td class="lbl" style="width: 22%;">Corrective Action (Immediate Fix):</td>
            <td class="val">
              ${
                data.correctiveActions && data.correctiveActions.length > 0
                  ? `<ol style="margin: 0; padding-left: 16px;">
                      ${data.correctiveActions.map((act) => `<li style="margin-bottom: 2px;">${act}</li>`).join("")}
                     </ol>`
                  : `<p style="margin: 0; color: #64748b;">No itemized corrective action recorded.</p>`
              }
            </td>
          </tr>
          <tr>
            <td class="lbl">Preventive Action (Recurrence Prevention):</td>
            <td class="val">
              ${
                Array.isArray(data.preventiveAction) &&
                data.preventiveAction.length > 0
                  ? `<ol style="margin: 0; padding-left: 16px;">
                      ${data.preventiveAction.map((item) => `<li style="margin-bottom: 2px;">${item}</li>`).join("")}
                     </ol>`
                  : typeof data.preventiveAction === "string" &&
                      data.preventiveAction.trim().length > 0
                    ? `<ol style="margin: 0; padding-left: 16px;">
                        ${data.preventiveAction
                          .split("\\n")
                          .filter((line) => line.trim().length > 0)
                          .map(
                            (line) =>
                              `<li style="margin-bottom: 2px;">${line.replace(/^[0-9]+\\.\\s*/, "")}</li>`,
                          )
                          .join("")}
                       </ol>`
                    : `<p style="margin: 0; color: #64748b;">Standard Quality Management procedural controls apply.</p>`
              }
            </td>
          </tr>
        </table>
      </div>

      <div class="pdf-section">
        <div class="section-title">4.0 Re-Inspection & Close-Out Verification Protocol</div>
        <table class="section-table">
          <tr>
            <td style="width: 4%; text-align: center;"><span class="box ${data.verification?.reInspected ? "box-checked" : ""}">${data.verification?.reInspected ? "✓" : ""}</span></td>
            <td style="width: 32%;"><strong>Physical Area Re-Inspected:</strong></td>
            <td class="val">${data.verificationRemarks?.reInspected || (data.finalStatus === "CLOSED" ? "Physical site inspection completed" : "Pending Site Verification")}</td>
          </tr>
          <tr>
            <td style="text-align: center;"><span class="box ${data.verification?.fixSatisfiesSpec ? "box-checked" : ""}">${data.verification?.fixSatisfiesSpec ? "✓" : ""}</span></td>
            <td><strong>Fix Conforms to Specs & Codes:</strong></td>
            <td class="val">${data.verificationRemarks?.fixSatisfiesSpec || (data.finalStatus === "CLOSED" ? "Rectification satisfies project specifications & codes" : "Pending Final Verification")}</td>
          </tr>
          <tr>
            <td style="text-align: center;"><span class="box ${totalPhotos > 0 ? "box-checked" : ""}">${totalPhotos > 0 ? "✓" : ""}</span></td>
            <td><strong>Photographic Evidence Logged:</strong></td>
            <td class="val">${totalPhotos > 0 ? `${totalPhotos} Image(s) Attached in Appendix` : "No photographic evidence recorded"}</td>
          </tr>
        </table>
      </div>

      ${
        totalPhotos > 0
          ? `
        <div class="pdf-section">
          <div class="section-title">5.0 Photographic Evidence Appendix</div>
          <div class="photo-grid">
            ${
              data.beforePhotos
                ?.map(
                  (p, idx) => `
              <div class="photo-card">
                <div><span class="photo-tag tag-before">DEFECT EVIDENCE (BEFORE)</span></div>
                <img src="${p.url}" alt="Defect Photo ${idx + 1}" />
                <div class="photo-caption">PHOTO #${idx + 1} ${p.caption ? `- ${p.caption}` : ""}</div>
              </div>
            `,
                )
                .join("") || ""
            }
            ${
              data.afterPhotos
                ?.map(
                  (p, idx) => `
              <div class="photo-card">
                <div><span class="photo-tag tag-after">RECTIFICATION EVIDENCE (AFTER)</span></div>
                <img src="${p.url}" alt="Rectification Photo ${idx + 1}" />
                <div class="photo-caption">PHOTO #${idx + 1} ${p.caption ? `- ${p.caption}` : ""}</div>
              </div>
            `,
                )
                .join("") || ""
            }
          </div>
        </div>
      `
          : ""
      }

      <div class="pdf-section">
        <div class="section-title">6.0 Workflow Lifecycle & Audit Trail</div>
        <table class="section-table">
          <thead>
            <tr>
              <th class="lbl" style="width: 15%;">Stage / Status</th>
              <th class="lbl" style="width: 25%;">Action By</th>
              <th class="lbl" style="width: 20%;">Date & Time</th>
              <th class="lbl" style="width: 40%;">Remarks / Audit Notes</th>
            </tr>
          </thead>
          <tbody>
            ${
              data.statusHistory && data.statusHistory.length > 0
                ? data.statusHistory
                    .map(
                      (item) => `
                    <tr>
                      <td class="val">
                        <span class="status-badge">${(item.status || "OPEN").replace(/_/g, " ")}</span>
                      </td>
                      <td class="val">
                        <strong>${item.userName || "System / QA Team"}</strong>
                        ${item.userRole ? `<br/><span style="font-size:7px; color:#64748b;">${item.userRole}</span>` : ""}
                      </td>
                      <td class="val">${formatDateTime(item.timestamp)}</td>
                      <td class="val" style="color: #334155;">${item.comment || "Status updated"}</td>
                    </tr>
                  `,
                    )
                    .join("")
                : `
                  <tr>
                    <td colspan="4" class="val" style="text-align: center; color: #94a3b8; padding: 6px;">
                      No prior workflow transition history recorded.
                    </td>
                  </tr>
                `
            }
          </tbody>
        </table>
      </div>

      <div class="pdf-section">
        <div class="section-title">7.0 Sign-off & Statutory Authorizations</div>
        <table class="sig-table">
          <tr>
            <td>
              <div class="sig-title">QA/QC Engineer / Inspector</div>
              <div class="sig-line">Name: <strong>${effectiveQaqcName || "___________________"}</strong></div>
              <div style="margin-top: 10px;" class="sig-line">Sign: ___________________</div>
              <div style="margin-top: 4px;" class="sig-line">Date: ${effectiveSignDate}</div>
            </td>
            <td>
              <div class="sig-title">Site / Construction Manager</div>
              <div class="sig-line">Name: <strong>${data.siteManagerName || "___________________"}</strong></div>
              <div style="margin-top: 10px;" class="sig-line">Sign: ___________________</div>
              <div style="margin-top: 4px;" class="sig-line">Date: ____ / ____ / 20__</div>
            </td>
            <td>
              <div class="sig-title">Resident Engineer / Consultant</div>
              <div class="sig-line">Name: <strong>${data.consultantName || "___________________"}</strong></div>
              <div style="margin-top: 10px;" class="sig-line">Sign: ___________________</div>
              <div style="margin-top: 4px;" class="sig-line">Date: ____ / ____ / 20__</div>
            </td>
          </tr>
        </table>
      </div>

      <div class="footer-fallback">
        <span>CONFIDENTIAL & PROPRIETARY — ${data.companyName || "JQMS"}</span>
        <span>NCR Ref: ${data.ncrNumber || "NCR"}</span>
      </div>

      <script>
        window.addEventListener('load', () => {
          const images = Array.from(document.images);
          Promise.all(images.map((img) => img.complete ? Promise.resolve() : new Promise((res) => { img.onload = res; img.onerror = res; })))
            .then(() => {
              setTimeout(() => {
                window.print();
              }, 300);
            });
        });
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
