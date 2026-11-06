import { StructuralElement } from "@/types";
import { renderCompanyBrandCell } from "@/lib/companyHelper";
import { openPrintWindow } from "@/lib/pdfGenerators";

export interface LogisticsParameters {
  sandDensity?: number; // tonnes/m3 (default 1.6)
  stoneDensity?: number; // tonnes/m3 (default 1.6)
  concreteDensity?: number; // tonnes/m3 (default 2.4)
  cementBagWeightKg?: number; // kg per bag (default 50)
  sandTruckCapacityTonnes?: number; // tonnes per tipper (default 20)
  stoneTruckCapacityTonnes?: number; // tonnes per tipper (default 20)
}

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

  // Flexible Visibility Toggles (By default, formwork & rebars are NOT shown in reports)
  showFormworkInReport?: boolean;
  showRebarsInReport?: boolean;
  showLogisticsInReport?: boolean;
  logisticsParams?: LogisticsParameters;

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
        sandTonnes?: number;
        stoneTonnes?: number;
        cementTonnes?: number;
        waterTonnes?: number;
        sandTrips?: number;
        stoneTrips?: number;
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
    sandTonnes?: number;
    stoneTonnes?: number;
    cementTonnes?: number;
    waterTonnes?: number;
    sandTrips?: number;
    stoneTrips?: number;
    totalMaterialTonnes?: number;
    totalTrips?: number;
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

  // Visibility flags: By default, DO NOT show formwork and rebars unless stated otherwise
  const showFormwork = Boolean(data.showFormworkInReport);
  const showRebars = Boolean(data.showRebarsInReport);
  const showLogistics = data.showLogisticsInReport !== false;

  // Logistics parameters (Trips strictly apply to Sand and Stone aggregates only)
  const sandDensity = data.logisticsParams?.sandDensity ?? 1.6;
  const stoneDensity = data.logisticsParams?.stoneDensity ?? 1.6;
  const concreteDensity = data.logisticsParams?.concreteDensity ?? 2.4;
  const sandTruckCapacity = data.logisticsParams?.sandTruckCapacityTonnes ?? 20;
  const stoneTruckCapacity = data.logisticsParams?.stoneTruckCapacityTonnes ?? 20;

  // Material weights (in tonnes)
  const cementWeightKg =
    data.materialQuantities.cementWeightKg || data.materialQuantities.bagsCement * 50;
  const cementTonnes =
    data.materialQuantities.cementTonnes ??
    Number((cementWeightKg / 1000).toFixed(2));

  const sandM3 = data.materialQuantities.sandM3 || 0;
  const sandTonnes =
    data.materialQuantities.sandTonnes ??
    Number((sandM3 * sandDensity).toFixed(2));
  const sandTrips =
    data.materialQuantities.sandTrips ??
    (sandTonnes > 0 && sandTruckCapacity > 0
      ? Math.ceil(sandTonnes / sandTruckCapacity)
      : 0);

  const stoneM3 = data.materialQuantities.stoneM3 || 0;
  const stoneTonnes =
    data.materialQuantities.stoneTonnes ??
    Number((stoneM3 * stoneDensity).toFixed(2));
  const stoneTrips =
    data.materialQuantities.stoneTrips ??
    (stoneTonnes > 0 && stoneTruckCapacity > 0
      ? Math.ceil(stoneTonnes / stoneTruckCapacity)
      : 0);

  const waterLiters = data.materialQuantities.waterLiters || 0;
  const waterTonnes =
    data.materialQuantities.waterTonnes ??
    Number((waterLiters / 1000).toFixed(2));

  const wetConcreteTonnes = Number(
    (data.calculatedData.totalWithWasteVolume * concreteDensity).toFixed(2),
  );
  const totalMaterialTonnes =
    data.materialQuantities.totalMaterialTonnes ??
    Number((cementTonnes + sandTonnes + stoneTonnes + waterTonnes).toFixed(2));

  // Trips strictly apply to Sand & Stone aggregates only
  const totalTrips =
    data.materialQuantities.totalTrips ?? (sandTrips + stoneTrips);

  const activeCategoriesStr = Object.entries(data.selectedCategories)
    .filter(([, selected]) => selected)
    .map(([cat]) => cat)
    .join(", ");

  const rebarWeightTons = (
    (data.calculatedData.totalRawVolume * 140) /
    1000
  ).toFixed(2);

  // Flatten active elements across ONLY included categories
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

  // Filter ONLY selected categories for rendering in the report
  const selectedCategoriesList = data.calculatedData.categories.filter(
    (cat) => cat.isIncluded,
  );

  const totalWaterAllLiters = data.materialQuantities.waterLiters;
  const totalAdmixtureAllLiters = data.materialQuantities.admixtureLiters || 0;

  const html = `
    <!-- ═══ DOCUMENT HEADER ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">${brandCellHTML}</td>
        <td class="header-title-cell">
          <div class="header-title-main">${data.reportType === "SUMMARY" ? "EXECUTIVE SUMMARY" : "DETAILED"} CONCRETE MATERIAL TAKE-OFF &amp; LOGISTICS REPORT</div>
          <div class="header-title-project">${projectName}</div>
          <div class="header-title-iso">STATUTORY MATERIAL ESTIMATION RECORD &bull; ISO 9001:2015 CLAUSE 8.5.1 &bull; SCOPE: ${data.selectedLevelName.toUpperCase()}</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> ${docRef}</div>
          <div><strong>Report Type:</strong> <span style="color: ${data.reportType === "SUMMARY" ? "#0284c7" : "#7c3aed"}; font-weight: bold;">${data.reportType === "SUMMARY" ? "SUMMARY (EXECUTIVE TAKE-OFF)" : "DETAILED (WITH MEMBER SCHEDULE)"}</span></div>
          <div><strong>Floor Scope:</strong> <strong>${data.selectedLevelName}</strong></div>
          <div><strong>Date:</strong> ${dateStr} ${timeStr}</div>
          <div><strong>Prepared By:</strong> ${data.createdBy || "QA/QC Engineer"}</div>
        </td>
      </tr>
    </table>

    <!-- ═══ SECTION 1: CALCULATION PARAMETERS & MIX SPECIFICATION ═══ -->
    <div class="pdf-section">
      <div class="section-banner">1.0 CALCULATION PARAMETERS, MIX SPECIFICATION &amp; LOGISTICS FLEET BASIS</div>
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
          <td class="val"><strong>${data.admixtureDosageMl || 300} mL</strong> per 50kg bag (~${(((data.admixtureDosageMl || 300) / 50000) * 100).toFixed(2)}% wt)</td>
        </tr>
        <tr>
          <td class="lbl">Bulk Densities:</td>
          <td class="val">Sand: <strong>${sandDensity} t/m³</strong> &bull; Stone: <strong>${stoneDensity} t/m³</strong> &bull; Concrete: <strong>${concreteDensity} t/m³</strong></td>
          <td class="lbl">Aggregate Haulage Basis:</td>
          <td class="val">Sand Tipper: <strong>${sandTruckCapacity}T</strong> &bull; Stone Tipper: <strong>${stoneTruckCapacity}T</strong> <em>(Trips apply to sand &amp; stone only)</em></td>
        </tr>
        <tr>
          <td class="lbl">Active Sections:</td>
          <td class="val"><strong>${activeCategoriesStr || "All Sections"}</strong> (Only selected categories rendered)</td>
          <td class="lbl">Report Inclusions:</td>
          <td class="val">
            Formwork: <strong>${showFormwork ? "Included" : "Excluded (Hidden)"}</strong> &bull;
            Rebar: <strong>${showRebars ? "Included" : "Excluded (Hidden)"}</strong> &bull;
            Logistics (Tonnes/Trips): <strong>${showLogistics ? "Enabled" : "Disabled"}</strong>
          </td>
        </tr>
      </table>
    </div>

    <!-- ═══ SECTION 2: FLOOR LEVEL CONCRETE VOLUME & METRIC BREAKDOWN ═══ -->
    ${
      data.levelSummary && data.levelSummary.length > 0
        ? `
    <div class="pdf-section">
      <div class="section-banner">2.0 CONCRETE VOLUME BREAKDOWN BY FLOOR LEVEL (${data.selectedLevelName.toUpperCase()})</div>
      <table class="data-table">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="width: 28%;">Floor Level Name</th>
            <th style="width: 15%;">Elevation (m)</th>
            <th style="width: 15%; text-align: center;">Element Count</th>
            <th style="width: 18%; text-align: right;">Concrete Vol (m³)</th>
            ${showRebars ? '<th style="width: 12%; text-align: right;">Est. Rebar (Tons)</th>' : ""}
            ${showFormwork ? '<th style="width: 12%; text-align: right;">Formwork (m²)</th>' : ""}
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
              ${showRebars ? `<td style="text-align: right; color: #dc2626;"><strong>${lvl.rebarTons.toFixed(2)} T</strong></td>` : ""}
              ${showFormwork ? `<td style="text-align: right; color: #059669;">${lvl.formworkM2.toFixed(1)} m²</td>` : ""}
            </tr>
          `,
            )
            .join("")}
          <tr style="background: #f8fafc; font-weight: 800; border-top: 1.5px solid #0f172a;">
            <td>TOTAL (${data.selectedLevelName.toUpperCase()})</td>
            <td>—</td>
            <td style="text-align: center;">${data.levelSummary.reduce((a, b) => a + b.count, 0)}</td>
            <td style="text-align: right; color: #0284c7;">${data.levelSummary.reduce((a, b) => a + b.volume, 0).toFixed(2)} m³</td>
            ${showRebars ? `<td style="text-align: right; color: #dc2626;">${data.levelSummary.reduce((a, b) => a + b.rebarTons, 0).toFixed(2)} T</td>` : ""}
            ${showFormwork ? `<td style="text-align: right; color: #059669;">${data.levelSummary.reduce((a, b) => a + b.formworkM2, 0).toFixed(1)} m²</td>` : ""}
          </tr>
        </tbody>
      </table>
    </div>
    `
        : ""
    }

    <!-- ═══ SECTION 3: MATERIAL BREAKDOWN BY STRUCTURAL ELEMENT TYPE (ONLY SELECTED CATEGORIES) ═══ -->
    <div class="pdf-section">
      <div class="section-banner">3.0 CONCRETE VOLUME, MATERIAL TONNES &amp; AGGREGATE TRIPS PER SELECTED ELEMENT TYPE (${data.selectedLevelName.toUpperCase()})</div>
      <table class="data-table">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="width: 14%;">Element Type</th>
            <th style="width: 7%; text-align: center;">Count</th>
            ${showFormwork ? '<th style="width: 10%; text-align: right;">Formwork (m²)</th>' : ""}
            <th style="width: 11%; text-align: right;">Wet Vol (m³)</th>
            <th style="width: 14%; text-align: right;">Cement (Bags &amp; T)</th>
            <th style="width: 14%; text-align: right;">Sand (m³ &amp; Trips)</th>
            <th style="width: 14%; text-align: right;">Stone (m³ &amp; Trips)</th>
            <th style="width: 13%; text-align: right;">Water (L &amp; T)</th>
            <th style="width: 9%; text-align: right;">Admixture (L)</th>
          </tr>
        </thead>
        <tbody>
          ${
            selectedCategoriesList.length === 0
              ? '<tr><td colspan="9" style="text-align: center; color: #64748b; padding: 12px;">No structural sections selected for take-off.</td></tr>'
              : selectedCategoriesList
                  .map((cat) => {
                    const catCementKg = cat.materials.cementWeightKg || cat.materials.bagsCement * 50;
                    const catCementT = (catCementKg / 1000).toFixed(2);

                    const catSandT = (cat.materials.sandM3 * sandDensity).toFixed(2);
                    const catSandTrips =
                      sandTruckCapacity > 0
                        ? Math.ceil(Number(catSandT) / sandTruckCapacity)
                        : 0;

                    const catStoneT = (cat.materials.stoneM3 * stoneDensity).toFixed(2);
                    const catStoneTrips =
                      stoneTruckCapacity > 0
                        ? Math.ceil(Number(catStoneT) / stoneTruckCapacity)
                        : 0;

                    const catWaterT = (cat.materials.waterLiters / 1000).toFixed(2);

                    return `
            <tr>
              <td><strong>${cat.type} Elements</strong></td>
              <td style="text-align: center;">${cat.count}</td>
              ${showFormwork ? `<td style="text-align: right; color: #059669;">${cat.totalFormworkWithWaste.toFixed(2)} m²</td>` : ""}
              <td style="text-align: right; color: #0284c7;"><strong>${cat.totalWithWaste.toFixed(3)} m³</strong></td>
              <td style="text-align: right; color: #ea580c;">
                <strong>${cat.materials.bagsCement} bags</strong>
                <div style="font-size: 8px; color: #64748b; font-family: monospace;">${catCementT} Tonnes</div>
              </td>
              <td style="text-align: right; color: #d97706;">
                <strong>${cat.materials.sandM3} m³</strong>
                <div style="font-size: 8px; color: #64748b; font-family: monospace;">${catSandT} T &bull; <strong>${catSandTrips} trips</strong></div>
              </td>
              <td style="text-align: right; color: #334155;">
                <strong>${cat.materials.stoneM3} m³</strong>
                <div style="font-size: 8px; color: #64748b; font-family: monospace;">${catStoneT} T &bull; <strong>${catStoneTrips} trips</strong></div>
              </td>
              <td style="text-align: right; color: #2563eb;">
                ${cat.materials.waterLiters.toLocaleString()} L
                <div style="font-size: 8px; color: #64748b; font-family: monospace;">${catWaterT} Tonnes</div>
              </td>
              <td style="text-align: right; color: #7c3aed;"><strong>${(cat.materials.admixtureLiters || 0).toFixed(2)} L</strong></td>
            </tr>
          `;
                  })
                  .join("")
          }
          <tr style="background: #f8fafc; font-weight: 800; border-top: 1.5px solid #0f172a;">
            <td>TOTAL SELECTED SECTIONS</td>
            <td style="text-align: center;">${selectedCategoriesList.reduce((a, b) => a + b.count, 0)}</td>
            ${showFormwork ? `<td style="text-align: right; color: #059669;">${data.calculatedData.totalWithWasteFormworkArea.toFixed(2)} m²</td>` : ""}
            <td style="text-align: right; color: #0284c7;">${data.calculatedData.totalWithWasteVolume.toFixed(3)} m³</td>
            <td style="text-align: right; color: #ea580c;">
              ${data.materialQuantities.bagsCement} Bags
              <div style="font-size: 8px; color: #64748b; font-family: monospace;">${cementTonnes} Tonnes</div>
            </td>
            <td style="text-align: right; color: #d97706;">
              ${data.materialQuantities.sandM3} m³
              <div style="font-size: 8px; color: #64748b; font-family: monospace;">${sandTonnes} T &bull; ${sandTrips} trips</div>
            </td>
            <td style="text-align: right; color: #334155;">
              ${data.materialQuantities.stoneM3} m³
              <div style="font-size: 8px; color: #64748b; font-family: monospace;">${stoneTonnes} T &bull; ${stoneTrips} trips</div>
            </td>
            <td style="text-align: right; color: #2563eb;">
              ${totalWaterAllLiters.toLocaleString()} L
              <div style="font-size: 8px; color: #64748b; font-family: monospace;">${waterTonnes} Tonnes</div>
            </td>
            <td style="text-align: right; color: #7c3aed;">${totalAdmixtureAllLiters.toFixed(2)} L</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ═══ SECTION 4: GRAND TOTAL MATERIAL BILL OF QUANTITIES (BOQ) ═══ -->
    <div class="pdf-section">
      <div class="section-banner">4.0 TOTAL MATERIAL BILL OF QUANTITIES (BOQ) - ${data.selectedLevelName.toUpperCase()}</div>
      <table class="data-table">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="width: 22%;">Material / Metric Description</th>
            <th style="width: 14%;">Primary Unit</th>
            <th style="width: 16%; text-align: right;">Net Requirement</th>
            <th style="width: 20%; text-align: right;">Gross Requirement (${data.includeWastage ? `+${data.wastagePercent}% Waste` : "Net"})</th>
            <th style="width: 14%; text-align: right;">Total Tonnes</th>
            <th style="width: 14%;">Tipper Trips / Logistics</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Wet Concrete Volume</strong></td>
            <td>Cubic Meters (m³)</td>
            <td style="text-align: right;" class="val"><strong>${data.calculatedData.totalRawVolume.toFixed(3)} m³</strong></td>
            <td style="text-align: right; color: #0284c7;" class="val"><strong>${data.calculatedData.totalWithWasteVolume.toFixed(3)} m³</strong></td>
            <td style="text-align: right; color: #0284c7; font-weight: bold;">${wetConcreteTonnes} T</td>
            <td style="font-family: monospace; font-size: 8px; color: #64748b;">Ready-mix wet batch</td>
          </tr>
          <tr>
            <td><strong>Dry Concrete Volume</strong></td>
            <td>Cubic Meters (m³)</td>
            <td style="text-align: right;" class="val">${(data.calculatedData.totalRawVolume * data.dryVolumeFactor).toFixed(3)} m³</td>
            <td style="text-align: right; color: #d97706;" class="val"><strong>${data.materialQuantities.dryVolume} m³</strong></td>
            <td style="text-align: right; color: #d97706; font-weight: bold;">—</td>
            <td style="font-family: monospace; font-size: 8px; color: #64748b;">×${data.dryVolumeFactor} shrinkage index</td>
          </tr>
          <tr>
            <td><strong>Portland Cement</strong></td>
            <td>50kg Bags / Tonnes</td>
            <td style="text-align: right;" class="val"><strong>${Math.round(data.materialQuantities.bagsCement / (data.includeWastage ? 1 + data.wastagePercent / 100 : 1))} Bags</strong></td>
            <td style="text-align: right; color: #ea580c;" class="val"><strong>${data.materialQuantities.bagsCement} Bags</strong> (${(data.materialQuantities.cementWeightKg).toLocaleString()} kg)</td>
            <td style="text-align: right; color: #ea580c; font-weight: bold; font-family: monospace;">${cementTonnes} T</td>
            <td style="font-size: 8px; color: #64748b;">OPC 42.5N / 52.5N (Trips N/A - Bagged)</td>
          </tr>
          <tr>
            <td><strong>Fine Aggregate (Sand)</strong></td>
            <td>Cubic Meters (m³) / Tonnes</td>
            <td style="text-align: right;" class="val">${(data.materialQuantities.sandM3 / (data.includeWastage ? 1 + data.wastagePercent / 100 : 1)).toFixed(2)} m³</td>
            <td style="text-align: right; color: #d97706;" class="val"><strong>${data.materialQuantities.sandM3} m³</strong></td>
            <td style="text-align: right; color: #d97706; font-weight: bold; font-family: monospace;">${sandTonnes} T</td>
            <td style="color: #d97706; font-weight: bold; font-family: monospace;"><strong>${sandTrips} Tipper Trips</strong> (@ ${sandTruckCapacity}T)</td>
          </tr>
          <tr>
            <td><strong>Coarse Aggregate (Stone)</strong></td>
            <td>Cubic Meters (m³) / Tonnes</td>
            <td style="text-align: right;" class="val">${(data.materialQuantities.stoneM3 / (data.includeWastage ? 1 + data.wastagePercent / 100 : 1)).toFixed(2)} m³</td>
            <td style="text-align: right; color: #334155;" class="val"><strong>${data.materialQuantities.stoneM3} m³</strong></td>
            <td style="text-align: right; color: #334155; font-weight: bold; font-family: monospace;">${stoneTonnes} T</td>
            <td style="color: #334155; font-weight: bold; font-family: monospace;"><strong>${stoneTrips} Tipper Trips</strong> (@ ${stoneTruckCapacity}T)</td>
          </tr>
          <tr>
            <td><strong>Water Batch Volume</strong></td>
            <td>Liters (L) / Tonnes</td>
            <td style="text-align: right;" class="val">~${Math.round(data.materialQuantities.waterLiters / (data.includeWastage ? 1 + data.wastagePercent / 100 : 1)).toLocaleString()} L</td>
            <td style="text-align: right; color: #2563eb;" class="val"><strong>~${data.materialQuantities.waterLiters.toLocaleString()} L</strong></td>
            <td style="text-align: right; color: #2563eb; font-weight: bold; font-family: monospace;">${waterTonnes} T</td>
            <td style="font-size: 8px; color: #64748b;">Potable water (Trips N/A - Reservoir)</td>
          </tr>
          <tr>
            <td><strong>Chemical Admixture</strong></td>
            <td>Liters (L)</td>
            <td style="text-align: right;" class="val">${((data.materialQuantities.admixtureLiters || 0) / (data.includeWastage ? 1 + data.wastagePercent / 100 : 1)).toFixed(2)} L</td>
            <td style="text-align: right; color: #7c3aed;" class="val"><strong>${(data.materialQuantities.admixtureLiters || 0).toFixed(2)} L</strong> (${(data.materialQuantities.admixtureMl || 0).toLocaleString()} mL)</td>
            <td style="text-align: right; color: #7c3aed; font-family: monospace;">~${((data.materialQuantities.admixtureLiters || 0) * 0.0011).toFixed(2)} T</td>
            <td style="font-size: 8px; color: #64748b;">${data.admixtureDosageMl || 300} mL/bag (Trips N/A - Drums)</td>
          </tr>
          ${
            showFormwork
              ? `
          <tr>
            <td><strong>Formwork Contact Area</strong></td>
            <td>Square Meters (m²)</td>
            <td style="text-align: right;" class="val">${data.calculatedData.totalRawFormworkArea.toFixed(2)} m²</td>
            <td style="text-align: right; color: #059669;" class="val"><strong>${data.calculatedData.totalWithWasteFormworkArea.toFixed(2)} m²</strong></td>
            <td style="text-align: right;">—</td>
            <td style="font-size: 8px; color: #64748b;">Contact shuttering surface area</td>
          </tr>
          `
              : ""
          }
          ${
            showRebars
              ? `
          <tr>
            <td><strong>Est. High-Yield Rebar</strong></td>
            <td>Metric Tons (T)</td>
            <td style="text-align: right;" class="val">${rebarWeightTons} T</td>
            <td style="text-align: right; color: #dc2626;" class="val"><strong>${rebarWeightTons} Tons</strong></td>
            <td style="text-align: right; color: #dc2626; font-weight: bold; font-family: monospace;">${rebarWeightTons} T</td>
            <td style="font-size: 8px; color: #64748b;">Grade 500B rebar density @ 140 kg/m³</td>
          </tr>
          `
              : ""
          }
        </tbody>
      </table>
    </div>

    <!-- ═══ SECTION 5: AGGREGATE HAULAGE & FLEET TRIPS DISPATCH SCHEDULE ═══ -->
    <div class="pdf-section">
      <div class="section-banner">5.0 MATERIAL BULK TONNAGE &amp; AGGREGATE FLEET TRIPS DISPATCH MANIFEST</div>
      <table class="data-table">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="width: 20%;">Material Cargo</th>
            <th style="width: 15%;">Gross Physical Qty</th>
            <th style="width: 14%;">Bulk Density</th>
            <th style="width: 16%; text-align: right;">Gross Weight (Tonnes)</th>
            <th style="width: 20%;">Haulage / Supply Method</th>
            <th style="width: 15%; text-align: right;">Required Tipper Trips</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Portland Cement</strong></td>
            <td>${data.materialQuantities.bagsCement} Bags (50kg)</td>
            <td style="font-family: monospace;">1,440 kg/m³</td>
            <td style="text-align: right; color: #ea580c; font-weight: bold; font-family: monospace;">${cementTonnes} Metric Tonnes</td>
            <td>Standard 50kg Bags / Palletized</td>
            <td style="text-align: right; color: #64748b; font-family: monospace; font-size: 9px;">N/A (Bagged Supply)</td>
          </tr>
          <tr>
            <td><strong>Fine Aggregate (Sand)</strong></td>
            <td>${sandM3} m³ (with waste)</td>
            <td style="font-family: monospace;">${sandDensity} t/m³ (Zone II River Sand)</td>
            <td style="text-align: right; color: #d97706; font-weight: bold; font-family: monospace;">${sandTonnes} Metric Tonnes</td>
            <td>Heavy Tipper Truck (${sandTruckCapacity}T payload)</td>
            <td style="text-align: right; color: #d97706; font-weight: 800; font-family: monospace; font-size: 11px;">${sandTrips} Tipper Trips</td>
          </tr>
          <tr>
            <td><strong>Coarse Aggregate (Stone)</strong></td>
            <td>${stoneM3} m³ (with waste)</td>
            <td style="font-family: monospace;">${stoneDensity} t/m³ (20mm Single Size)</td>
            <td style="text-align: right; color: #334155; font-weight: bold; font-family: monospace;">${stoneTonnes} Metric Tonnes</td>
            <td>Heavy Tipper Truck (${stoneTruckCapacity}T payload)</td>
            <td style="text-align: right; color: #334155; font-weight: 800; font-family: monospace; font-size: 11px;">${stoneTrips} Tipper Trips</td>
          </tr>
          <tr>
            <td><strong>Water Batching</strong></td>
            <td>~${waterLiters.toLocaleString()} Liters</td>
            <td style="font-family: monospace;">1,000 L = 1.000 Tonne</td>
            <td style="text-align: right; color: #2563eb; font-weight: bold; font-family: monospace;">${waterTonnes} Metric Tonnes</td>
            <td>Site Mains / Bulk Storage Reservoir</td>
            <td style="text-align: right; color: #64748b; font-family: monospace; font-size: 9px;">N/A (Piped Supply)</td>
          </tr>
          <tr style="background: #f8fafc; font-weight: 800; border-top: 2px solid #0f172a;">
            <td colspan="3"><strong>TOTAL COMBINED MATERIAL TONNAGE &amp; AGGREGATE TRIPS</strong></td>
            <td style="text-align: right; color: #0f172a; font-size: 11px; font-family: monospace;"><strong>${totalMaterialTonnes} Metric Tonnes</strong></td>
            <td>Aggregate Tippers Only (Sand &amp; Stone)</td>
            <td style="text-align: right; color: #0284c7; font-size: 12px; font-family: monospace;"><strong>${totalTrips} Total Tipper Trips</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ═══ SECTION 6: DETAILED MEMBER DIMENSIONS & MATERIAL SCHEDULE (ONLY IN DETAILED REPORT) ═══ -->
    ${
      data.reportType === "DETAILED"
        ? `
    <div class="pdf-section">
      <div class="section-banner">6.0 DETAILED MEMBER DIMENSIONS, VOLUMES &amp; MATERIAL SCHEDULE (${includedElements.length} MEMBERS - ${data.selectedLevelName.toUpperCase()})</div>
      <table class="data-table">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="width: 4%;">#</th>
            <th style="width: 14%;">Element Ref</th>
            <th style="width: 10%;">Category</th>
            <th style="width: 12%;">Level / Floor</th>
            <th style="width: 10%;">Grid Axis</th>
            <th style="width: 24%;">Element Dimensions</th>
            <th style="width: 12%; text-align: right;">Volume (m³)</th>
            ${showFormwork ? '<th style="width: 10%; text-align: right;">Formwork (m²)</th>' : ""}
            <th style="width: 14%; text-align: right;">Cement (Bags &amp; T)</th>
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
                    const elTonnes = (elBags * 0.05).toFixed(2);

                    return `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${el.elementName}</strong></td>
                <td>${item.categoryType}</td>
                <td>${el.levelName || el.level || "—"}</td>
                <td>${el.grid || el.gridAxis || "—"}</td>
                <td><strong style="color: #0f172a;">${dimsText}</strong></td>
                <td style="text-align: right; color: #0284c7;"><strong>${vol.toFixed(3)}</strong></td>
                ${showFormwork ? `<td style="text-align: right; color: #059669;">${fw.toFixed(2)}</td>` : ""}
                <td style="text-align: right; color: #ea580c;">
                  <strong>${elBags} bags</strong>
                  <span style="font-size: 7.5px; color: #64748b; font-family: monospace;">(${elTonnes} T)</span>
                </td>
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

    <!-- ═══ SECTION 7: SIGN-OFF AUTHORIZATION BLOCK ═══ -->
    <div class="pdf-section">
      <div class="section-banner">${data.reportType === "DETAILED" ? "7.0" : "6.0"} QUALITY ASSURANCE &amp; MATERIAL VERIFICATION AUTHORIZATION</div>
      <table class="sig-table">
        <tr>
          <td style="width: 33%;">
            <div class="sig-title">PREPARED BY (QA/QC ENGINEER)</div>
            <div style="font-size: 8px; margin-top: 4px;"><strong>Name:</strong> ${data.createdBy || "QA/QC Inspector"}</div>
            <div style="font-size: 8px; color: #64748b;">Designation: QA/QC Engineer</div>
            <div class="sig-line"></div>
            <div style="font-size: 7px; color: #94a3b8; margin-top: 3px;">Signature &amp; Date</div>
          </td>
          <td style="width: 33%;">
            <div class="sig-title">LOGISTICS &amp; SITE PROCUREMENT MANAGER</div>
            <div style="font-size: 8px; margin-top: 4px;"><strong>Aggregate Trips:</strong> Verified &amp; Scheduled</div>
            <div style="font-size: 8px; color: #64748b;">Designation: Site Logistics / Batch Plant Manager</div>
            <div class="sig-line"></div>
            <div style="font-size: 7px; color: #94a3b8; margin-top: 3px;">Signature &amp; Date</div>
          </td>
          <td style="width: 33%;">
            <div class="sig-title">PROJECT MANAGER SIGN-OFF</div>
            <div style="font-size: 8px; margin-top: 4px;"><strong>Status:</strong> Approved for Batching / Pouring</div>
            <div style="font-size: 8px; color: #64748b;">Designation: Project Manager / Lead Consultant</div>
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
