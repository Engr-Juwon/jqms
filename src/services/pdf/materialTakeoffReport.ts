import { StructuralElement } from "@/types";
import { renderCompanyBrandCell } from "@/lib/companyHelper";
import { openPrintWindow } from "@/lib/pdfGenerators";

export interface PrintMaterialTakeoffData {
  reportType: "DETAILED" | "SUMMARY";
  projectName?: string;
  projectId?: string;
  companyName?: string;
  companyLogo?: string;
  createdBy?: string;
  selectedLevelName: string;
  mixRatio: string;
  includeWastage: boolean;
  wastagePercent: number;
  dryVolumeFactor: number;
  admixtureType?: string;
  admixtureDosageMl?: number;
  selectedCategories: Record<string, boolean>;
  levelSummary?: Array<{
    levelName: string;
    elevation: number;
    count: number;
    volume: number;
    rebarTons: number;
    formworkM2: number;
  }>;
  calculatedData: {
    categories: Array<{
      type: string;
      count: number;
      rawVolume: number;
      rawFormworkArea: number;
      totalWithWaste: number;
      totalFormworkWithWaste: number;
      materials: {
        bagsCement: number;
        sandM3: number;
        stoneM3: number;
        waterLiters: number;
        dryVolume: number;
        cementWeightKg: number;
        admixtureLiters?: number;
        admixtureMl?: number;
      };
      isIncluded: boolean;
      items: StructuralElement[];
    }>;
    totalRawVolume: number;
    totalRawFormworkArea: number;
    totalWithWasteVolume: number;
    totalWithWasteFormworkArea: number;
  };
  materialQuantities: {
    bagsCement: number;
    sandM3: number;
    stoneM3: number;
    waterLiters: number;
    dryVolume: number;
    cementWeightKg: number;
    admixtureLiters?: number;
    admixtureMl?: number;
  };
}

/**
 * Format structural element dimensions into human-readable millimeter string (e.g. 300 × 600 mm, Ø450 mm, t = 250 mm)
 */
export const formatElementDimensions = (el: StructuralElement): string => {
  const typeStr = (el.elementType || "").toLowerCase();

  // Circular Column / Diameter
  if (
    typeStr.includes("circular") ||
    el.columnShape === "circular" ||
    el.diameter
  ) {
    const d = el.diameter || el.width;
    const h = el.height || el.length || el.dimensions?.height;
    const dMm = d ? (d < 50 ? Math.round(d * 1000) : Math.round(d)) : "—";
    const hMm = h ? (h < 50 ? Math.round(h * 1000) : Math.round(h)) : "—";
    return `Ø${dMm} mm × H: ${hMm} mm`;
  }

  const w = el.width || el.dimensions?.width;
  const l = el.length || el.dimensions?.length;
  const h = el.height || el.depth || el.thickness || el.dimensions?.height;

  const wMm = w ? (w < 50 ? Math.round(w * 1000) : Math.round(w)) : null;
  const lMm = l ? (l < 50 ? Math.round(l * 1000) : Math.round(l)) : null;
  const hMm = h ? (h < 50 ? Math.round(h * 1000) : Math.round(h)) : null;

  if (typeStr.includes("slab")) {
    const th = el.thickness || h || 0.25;
    const thMm = th < 50 ? Math.round(th * 1000) : Math.round(th);
    if (wMm && lMm) return `t = ${thMm} mm (${wMm} × ${lMm} mm)`;
    return `t = ${thMm} mm`;
  }

  if (typeStr.includes("wall")) {
    const th = el.thickness || w || 0.2;
    const thMm = th < 50 ? Math.round(th * 1000) : Math.round(th);
    if (lMm && hMm) return `t = ${thMm} mm (L: ${lMm} × H: ${hMm} mm)`;
    return `t = ${thMm} mm`;
  }

  if (typeStr.includes("beam")) {
    if (wMm && hMm && lMm) return `${wMm} × ${hMm} mm (L: ${lMm} mm)`;
    if (wMm && hMm) return `${wMm} × ${hMm} mm`;
    return `Beam Section`;
  }

  if (wMm && lMm && hMm) return `${wMm} × ${lMm} × ${hMm} mm`;
  if (wMm && lMm) return `${wMm} × ${lMm} mm`;
  if (wMm) return `${wMm} mm`;
  return "—";
};

/**
 * Print Material Take-Off Report (Detailed or Summary)
 */
export function printMaterialTakeoffReport(
  data: PrintMaterialTakeoffData,
): void {
  const companyName = data.companyName || "JQMS Civil Infrastructure Ltd.";
  const companyLogo = data.companyLogo || "";
  const projectName = data.projectName || "Civil Engineering Project";
  const docRef = `MTO-${data.reportType === "SUMMARY" ? "SUM" : "DET"}-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const brandCellHTML = renderCompanyBrandCell(
    { name: companyName, logoUrl: companyLogo, logo: companyLogo },
    { name: projectName },
  );

  const activeCategoriesStr = Object.entries(data.selectedCategories)
    .filter(([, selected]) => selected)
    .map(([cat]) => cat)
    .join(", ");

  const rebarWeightTons = (
    (data.calculatedData.totalRawVolume * 140) /
    1000
  ).toFixed(2);

  // Flatten active elements across included categories
  const includedElements: Array<{
    element: StructuralElement;
    categoryType: string;
  }> = [];
  data.calculatedData.categories.forEach((cat) => {
    if (cat.isIncluded && cat.items) {
      cat.items.forEach((item) => {
        includedElements.push({ element: item, categoryType: cat.type });
      });
    }
  });

  const totalWaterAllLiters = data.materialQuantities.waterLiters;
  const totalAdmixtureAllLiters = data.materialQuantities.admixtureLiters || 0;

  const html = `
    <!-- ═══ DOCUMENT HEADER ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">${brandCellHTML}</td>
        <td class="header-title-cell">
          <div class="header-title-main">${data.reportType === "SUMMARY" ? "EXECUTIVE SUMMARY" : "DETAILED"} CONCRETE MATERIAL TAKE-OFF REPORT</div>
          <div class="header-title-project">${projectName}</div>
          <div class="header-title-iso">STATUTORY MATERIAL ESTIMATION RECORD &bull; ISO 9001:2015 CLAUSE 8.5.1 &bull; SCOPE: ${data.selectedLevelName.toUpperCase()}</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> ${docRef}</div>
          <div><strong>Report Type:</strong> <span style="color: ${data.reportType === "SUMMARY" ? "#0284c7" : "#7c3aed"}; font-weight: bold;">${data.reportType === "SUMMARY" ? "SUMMARY (NO MEMBER BREAKDOWN)" : "DETAILED (WITH MEMBER SCHEDULE)"}</span></div>
          <div><strong>Floor Scope:</strong> <strong>${data.selectedLevelName}</strong></div>
          <div><strong>Date:</strong> ${dateStr} ${timeStr}</div>
          <div><strong>Prepared By:</strong> ${data.createdBy || "QA/QC Engineer"}</div>
        </td>
      </tr>
    </table>

    <!-- ═══ SECTION 1: CALCULATION PARAMETERS & MIX SPECIFICATION ═══ -->
    <div class="pdf-section">
      <div class="section-banner">1.0 CALCULATION PARAMETERS &amp; MIX SPECIFICATION</div>
      <table class="grid-table">
        <tr>
          <td class="lbl" style="width: 18%;">Target Level Scope:</td>
          <td class="val" style="width: 32%; color: #0284c7;"><strong>${data.selectedLevelName}</strong></td>
          <td class="lbl" style="width: 18%;">Mix Design Ratio:</td>
          <td class="val" style="width: 32%;"><strong>${data.mixRatio}</strong> (Cement : Sand : Stone)</td>
        </tr>
        <tr>
          <td class="lbl">Wastage Buffer:</td>
          <td class="val">${
            data.includeWastage
              ? `<strong>+${data.wastagePercent}% Wastage Buffer Included</strong>`
              : "<em>Disabled (Net Quantities Only)</em>"
          }</td>
          <td class="lbl">Dry Volume Factor:</td>
          <td class="val"><strong>${data.dryVolumeFactor}</strong> (Dry Volume Shrinkage Index)</td>
        </tr>
        <tr>
          <td class="lbl">Admixture Type:</td>
          <td class="val" style="color: #7c3aed;"><strong>${data.admixtureType || "Polycarboxylate Superplasticizer (PCE)"}</strong></td>
          <td class="lbl">Admixture Dosage:</td>
          <td class="val"><strong>${data.admixtureDosageMl || 300} mL</strong> per 50kg cement bag (~${(((data.admixtureDosageMl || 300) / 50000) * 100).toFixed(2)}% wt)</td>
        </tr>
        <tr>
          <td class="lbl">Active Sections:</td>
          <td class="val" colspan="3"><strong>${activeCategoriesStr || "All Sections"}</strong></td>
        </tr>
      </table>
    </div>

    <!-- ═══ SECTION 2: FLOOR LEVEL CONCRETE VOLUME & METRIC BREAKDOWN ═══ -->
    ${
      data.levelSummary && data.levelSummary.length > 0
        ? `
    <div class="pdf-section">
      <div class="section-banner">2.0 CONCRETE VOLUME &amp; QUANTITY BREAKDOWN BY FLOOR LEVEL (${data.selectedLevelName.toUpperCase()})</div>
      <table class="data-table">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="width: 25%;">Floor Level Name</th>
            <th style="width: 15%;">Elevation (m)</th>
            <th style="width: 15%; text-align: center;">Element Count</th>
            <th style="width: 15%; text-align: right;">Concrete Vol (m³)</th>
            <th style="width: 15%; text-align: right;">Est. Rebar (Tons)</th>
            <th style="width: 15%; text-align: right;">Formwork (m²)</th>
          </tr>
        </thead>
        <tbody>
          ${data.levelSummary
            .map(
              (lvl) => `
            <tr>
              <td><strong>${lvl.levelName}</strong></td>
              <td style="font-family: monospace;">${lvl.elevation >= 0 ? `+${lvl.elevation}` : lvl.elevation} m</td>
              <td style="text-align: center; font-weight: bold;">${lvl.count}</td>
              <td style="text-align: right; color: #0284c7;"><strong>${lvl.volume.toFixed(2)} m³</strong></td>
              <td style="text-align: right; color: #dc2626;"><strong>${lvl.rebarTons.toFixed(2)} T</strong></td>
              <td style="text-align: right; color: #059669;">${lvl.formworkM2.toFixed(1)} m²</td>
            </tr>
          `,
            )
            .join("")}
          <tr style="background: #f8fafc; font-weight: 800; border-top: 1.5px solid #0f172a;">
            <td>TOTAL (${data.selectedLevelName.toUpperCase()})</td>
            <td>—</td>
            <td style="text-align: center;">${data.levelSummary.reduce((a, b) => a + b.count, 0)}</td>
            <td style="text-align: right; color: #0284c7;">${data.levelSummary.reduce((a, b) => a + b.volume, 0).toFixed(2)} m³</td>
            <td style="text-align: right; color: #dc2626;">${data.levelSummary.reduce((a, b) => a + b.rebarTons, 0).toFixed(2)} T</td>
            <td style="text-align: right; color: #059669;">${data.levelSummary.reduce((a, b) => a + b.formworkM2, 0).toFixed(1)} m²</td>
          </tr>
        </tbody>
      </table>
    </div>
    `
        : ""
    }

    <!-- ═══ SECTION 3: MATERIAL BREAKDOWN BY STRUCTURAL ELEMENT TYPE ═══ -->
    <div class="pdf-section">
      <div class="section-banner">3.0 CONCRETE VOLUME &amp; MATERIAL BREAKDOWN PER ELEMENT TYPE (${data.selectedLevelName.toUpperCase()})</div>
      <table class="data-table">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="width: 14%;">Element Type</th>
            <th style="width: 8%; text-align: center;">Count</th>
            <th style="width: 11%; text-align: right;">Formwork (m²)</th>
            <th style="width: 11%; text-align: right;">Wet Vol (m³)</th>
            <th style="width: 12%; text-align: right;">Cement (Bags)</th>
            <th style="width: 11%; text-align: right;">Sand (m³)</th>
            <th style="width: 11%; text-align: right;">Stone (m³)</th>
            <th style="width: 11%; text-align: right;">Water (L)</th>
            <th style="width: 11%; text-align: right;">Admixture (L)</th>
          </tr>
        </thead>
        <tbody>
          ${data.calculatedData.categories
            .map(
              (cat) => `
            <tr style="${!cat.isIncluded ? "opacity: 0.5; background: #f8fafc;" : ""}">
              <td><strong>${cat.type} Elements</strong> ${!cat.isIncluded ? '<span style="font-size: 7px; color: #94a3b8;">(Deselected)</span>' : ""}</td>
              <td style="text-align: center;">${cat.count}</td>
              <td style="text-align: right; color: #059669;">${cat.totalFormworkWithWaste.toFixed(2)} m²</td>
              <td style="text-align: right; color: #0284c7;"><strong>${cat.totalWithWaste.toFixed(3)} m³</strong></td>
              <td style="text-align: right; color: #ea580c;"><strong>${cat.materials.bagsCement}</strong></td>
              <td style="text-align: right; color: #d97706;">${cat.materials.sandM3}</td>
              <td style="text-align: right; color: #334155;">${cat.materials.stoneM3}</td>
              <td style="text-align: right; color: #2563eb;">${cat.materials.waterLiters.toLocaleString()} L</td>
              <td style="text-align: right; color: #7c3aed;"><strong>${(cat.materials.admixtureLiters || 0).toFixed(2)} L</strong></td>
            </tr>
          `,
            )
            .join("")}
          <tr style="background: #f8fafc; font-weight: 800; border-top: 1.5px solid #0f172a;">
            <td>TOTAL PER ELEMENT TYPE</td>
            <td style="text-align: center;">${data.calculatedData.categories
              .filter((c) => c.isIncluded)
              .reduce((a, b) => a + b.count, 0)}</td>
            <td style="text-align: right; color: #059669;">${data.calculatedData.totalWithWasteFormworkArea.toFixed(2)} m²</td>
            <td style="text-align: right; color: #0284c7;">${data.calculatedData.totalWithWasteVolume.toFixed(3)} m³</td>
            <td style="text-align: right; color: #ea580c;">${data.materialQuantities.bagsCement} Bags</td>
            <td style="text-align: right; color: #d97706;">${data.materialQuantities.sandM3} m³</td>
            <td style="text-align: right; color: #334155;">${data.materialQuantities.stoneM3} m³</td>
            <td style="text-align: right; color: #2563eb;">${totalWaterAllLiters.toLocaleString()} L</td>
            <td style="text-align: right; color: #7c3aed;">${totalAdmixtureAllLiters.toFixed(2)} L</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ═══ SECTION 4: GRAND TOTAL MATERIAL BILL OF QUANTITIES (BOQ) FOR ALL ═══ -->
    <div class="pdf-section">
      <div class="section-banner">4.0 TOTAL MATERIAL BILL OF QUANTITIES (BOQ) - ${data.selectedLevelName.toUpperCase()}</div>
      <table class="data-table">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="width: 25%;">Material / Metric Description</th>
            <th style="width: 15%;">Unit</th>
            <th style="width: 20%; text-align: right;">Net Requirement</th>
            <th style="width: 20%; text-align: right;">Gross Requirement (${data.includeWastage ? `+${data.wastagePercent}% Waste` : "Net"})</th>
            <th style="width: 20%;">Specification Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Wet Concrete Volume</strong></td>
            <td>Cubic Meters (m³)</td>
            <td style="text-align: right;" class="val"><strong>${data.calculatedData.totalRawVolume.toFixed(3)} m³</strong></td>
            <td style="text-align: right; color: #0284c7;" class="val"><strong>${data.calculatedData.totalWithWasteVolume.toFixed(3)} m³</strong></td>
            <td>Ready-mix wet batch volume</td>
          </tr>
          <tr>
            <td><strong>Dry Concrete Volume</strong></td>
            <td>Cubic Meters (m³)</td>
            <td style="text-align: right;" class="val">${(data.calculatedData.totalRawVolume * data.dryVolumeFactor).toFixed(3)} m³</td>
            <td style="text-align: right; color: #d97706;" class="val"><strong>${data.materialQuantities.dryVolume} m³</strong></td>
            <td>Converted @ ×${data.dryVolumeFactor} shrinkage index</td>
          </tr>
          <tr>
            <td><strong>Portland Cement</strong></td>
            <td>50kg Bags</td>
            <td style="text-align: right;" class="val"><strong>${data.materialQuantities.bagsCement} Bags</strong></td>
            <td style="text-align: right; color: #ea580c;" class="val"><strong>${data.materialQuantities.bagsCement} Bags (${data.materialQuantities.cementWeightKg.toLocaleString()} kg)</strong></td>
            <td>OPC 42.5N / 52.5N (${(data.materialQuantities.cementWeightKg / 1000).toFixed(2)} Metric Tons)</td>
          </tr>
          <tr>
            <td><strong>Fine Aggregate (Sand)</strong></td>
            <td>Cubic Meters (m³)</td>
            <td style="text-align: right;" class="val">${(data.materialQuantities.sandM3 / (data.includeWastage ? 1 + data.wastagePercent / 100 : 1)).toFixed(2)} m³</td>
            <td style="text-align: right; color: #d97706;" class="val"><strong>${data.materialQuantities.sandM3} m³</strong></td>
            <td>Clean sharp river sand (Zone II)</td>
          </tr>
          <tr>
            <td><strong>Coarse Aggregate (Stone)</strong></td>
            <td>Cubic Meters (m³)</td>
            <td style="text-align: right;" class="val">${(data.materialQuantities.stoneM3 / (data.includeWastage ? 1 + data.wastagePercent / 100 : 1)).toFixed(2)} m³</td>
            <td style="text-align: right; color: #334155;" class="val"><strong>${data.materialQuantities.stoneM3} m³</strong></td>
            <td>Crushed granite / gravel (20mm single size)</td>
          </tr>
          <tr>
            <td><strong>Water Batch Volume</strong></td>
            <td>Liters (L)</td>
            <td style="text-align: right;" class="val">~${data.materialQuantities.waterLiters.toLocaleString()} L</td>
            <td style="text-align: right; color: #2563eb;" class="val"><strong>~${data.materialQuantities.waterLiters.toLocaleString()} Liters</strong></td>
            <td>Estimated @ ~0.50 Water/Cement ratio</td>
          </tr>
          <tr>
            <td><strong>Chemical Admixture</strong></td>
            <td>Liters (L)</td>
            <td style="text-align: right;" class="val">${((data.materialQuantities.admixtureLiters || 0) / (data.includeWastage ? 1 + data.wastagePercent / 100 : 1)).toFixed(2)} L</td>
            <td style="text-align: right; color: #7c3aed;" class="val"><strong>${(data.materialQuantities.admixtureLiters || 0).toFixed(2)} L (${(data.materialQuantities.admixtureMl || 0).toLocaleString()} mL)</strong></td>
            <td>${data.admixtureType || "Polycarboxylate Superplasticizer"} @ ${data.admixtureDosageMl || 300} mL/bag</td>
          </tr>
          <tr>
            <td><strong>Formwork Contact Area</strong></td>
            <td>Square Meters (m²)</td>
            <td style="text-align: right;" class="val">${data.calculatedData.totalRawFormworkArea.toFixed(2)} m²</td>
            <td style="text-align: right; color: #059669;" class="val"><strong>${data.calculatedData.totalWithWasteFormworkArea.toFixed(2)} m²</strong></td>
            <td>Contact shuttering surface area</td>
          </tr>
          <tr>
            <td><strong>Est. High-Yield Rebar</strong></td>
            <td>Metric Tons (T)</td>
            <td style="text-align: right;" class="val">${rebarWeightTons} T</td>
            <td style="text-align: right; color: #dc2626;" class="val"><strong>${rebarWeightTons} Tons</strong></td>
            <td>Grade 500B rebar density @ 140 kg/m³</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ═══ SECTION 5: DETAILED MEMBER DIMENSIONS & MATERIAL SCHEDULE (ONLY IN DETAILED REPORT) ═══ -->
    ${
      data.reportType === "DETAILED"
        ? `
    <div class="pdf-section">
      <div class="section-banner">5.0 DETAILED MEMBER DIMENSIONS, VOLUMES &amp; MATERIAL SCHEDULE (${includedElements.length} MEMBERS - ${data.selectedLevelName.toUpperCase()})</div>
      <table class="data-table">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="width: 4%;">#</th>
            <th style="width: 14%;">Element Ref</th>
            <th style="width: 10%;">Category</th>
            <th style="width: 12%;">Level / Floor</th>
            <th style="width: 10%;">Grid Axis</th>
            <th style="width: 22%;">Element Dimensions</th>
            <th style="width: 10%; text-align: right;">Volume (m³)</th>
            <th style="width: 9%; text-align: right;">Formwork (m²)</th>
            <th style="width: 9%; text-align: right;">Cement (Bags)</th>
          </tr>
        </thead>
        <tbody>
          ${
            includedElements.length === 0
              ? '<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 12px;">No active elements selected for calculation.</td></tr>'
              : includedElements
                  .map((item, idx) => {
                    const el = item.element;
                    const vol = el.calculatedVolume || el.volume || 0;
                    const fw =
                      el.calculatedFormworkArea || (vol || 0) * 4.5;
                    const dimsText = formatElementDimensions(el);
                    const propRatio = vol / (data.calculatedData.totalRawVolume || 1);
                    const elBags = Math.round(propRatio * data.materialQuantities.bagsCement);

                    return `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${el.elementName}</strong></td>
                <td>${item.categoryType}</td>
                <td>${el.levelName || el.level || "—"}</td>
                <td>${el.grid || el.gridAxis || "—"}</td>
                <td><strong style="color: #0f172a;">${dimsText}</strong></td>
                <td style="text-align: right; color: #0284c7;"><strong>${vol.toFixed(3)}</strong></td>
                <td style="text-align: right; color: #059669;">${fw.toFixed(2)}</td>
                <td style="text-align: right; color: #ea580c;"><strong>${elBags}</strong></td>
              </tr>
            `;
                  })
                  .join("")
          }
        </tbody>
      </table>
    </div>
    `
        : ""
    }

    <!-- ═══ SECTION 6: SIGN-OFF AUTHORIZATION BLOCK ═══ -->
    <div class="pdf-section">
      <div class="section-banner">${data.reportType === "DETAILED" ? "6.0" : "5.0"} QUALITY ASSURANCE &amp; MATERIAL VERIFICATION AUTHORIZATION</div>
      <table class="sig-table">
        <tr>
          <td style="width: 33%;">
            <div class="sig-title">PREPARED BY (QA/QC ENGINEER)</div>
            <div style="font-size: 8px; margin-top: 4px;"><strong>Name:</strong> ${data.createdBy || "QA/QC Inspector"}</div>
            <div style="font-size: 8px; color: #64748b;">Designation: QA/QC Engineer</div>
            <div class="sig-line"></div>
            <div style="font-size: 7px; color: #94a3b8; margin-top: 3px;">Signature &amp; Date</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- ═══ DOCUMENT FOOTER ═══ -->
    <div class="doc-footer">
      <div>CONFIDENTIAL &amp; STATUTORY MATERIAL RECORD &bull; ${companyName}</div>
      <div>Document Ref: ${docRef} &bull; Generated: ${dateStr} ${timeStr}</div>
    </div>
  `;

  openPrintWindow(
    `${docRef} - ${data.reportType === "SUMMARY" ? "Executive Summary" : "Detailed"} Material Takeoff Report`,
    html,
  );
}
