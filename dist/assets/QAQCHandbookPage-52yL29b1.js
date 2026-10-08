import{j as e}from"./vendor-three-DPHNrIDs.js";import{f as q,h as B,r as u,L as k}from"./vendor-react-DCR-ZuuX.js";import{r as F,u as W,b as H,k as z,p as V,j as _}from"./index-DBjGkz9S.js";import{M as $}from"./ModuleTabNav-EllHuKrH.js";import{y as S,h as P,H as Y,_ as G,a9 as U,O as J,j as K,l as X,$ as Z,o as ee,as as te,B as b,aX as se,a0 as ae,a1 as ie,r as re,au as ne,ad as R,C as le,u as oe}from"./vendor-icons-DXt7NphH.js";import"./vendor-charts-DpV9R7i2.js";import"./vendor-firebase-yLmGYKlF.js";function de(a,l,i){var h;a!=null&&a.name||a!=null&&a.legalName,a!=null&&a.address,a!=null&&a.phone,a!=null&&a.email;const o=(l==null?void 0:l.name)||"Corporate Quality Management Project",s=(l==null?void 0:l.code)||"PRJ-001",c=(l==null?void 0:l.qaqcEngineerName)||(i==null?void 0:i.fullName)||"Lead QA/QC Engineer",d=`${((h=a==null?void 0:a.settings)==null?void 0:h.inspectionPrefix)||"CD"}-QP-001`,x="REV. 01",m=new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});return`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>QA/QC System Instruction Booklet & SOP Manual - ${d}</title>
      <style>
        * { box-sizing: border-box; }
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 10mm 12mm;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          .chapter-box { page-break-inside: avoid; }
          .signoff-box { page-break-inside: avoid; }
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 12px 16px;
          font-size: 9.5px;
          line-height: 1.45;
        }
        .no-print {
          background: #0f172a;
          color: #ffffff;
          padding: 8px 14px;
          border-radius: 8px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
        }
        .print-btn {
          background: #f59e0b;
          color: #0f172a;
          border: none;
          padding: 6px 16px;
          font-weight: 800;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
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
          margin-bottom: 10px;
          border: 1px solid #cbd5e1;
          font-size: 8.5px;
        }
        .meta-table td {
          border: 1px solid #cbd5e1;
          padding: 3.5px 7px;
        }
        .meta-label {
          background: #f8fafc;
          font-weight: 700;
          color: #475569;
          width: 14%;
        }
        .meta-val {
          font-weight: 700;
          color: #0f172a;
          width: 20%;
        }
        .chapter-box {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          margin-bottom: 10px;
          background: #ffffff;
          overflow: hidden;
        }
        .chapter-header {
          background: #0f172a;
          color: #ffffff;
          padding: 6px 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .chapter-title {
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.3px;
        }
        .chapter-badge {
          font-size: 7.5px;
          font-weight: 700;
          background: #f59e0b;
          color: #0f172a;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .chapter-content {
          padding: 8px 10px;
          font-size: 8.5px;
          color: #334155;
        }
        .callout-amber {
          background: #fefce8;
          border-left: 3px solid #f59e0b;
          padding: 5px 8px;
          margin-bottom: 6px;
          color: #854d0e;
          font-weight: 600;
        }
        .callout-red {
          background: #fef2f2;
          border-left: 3px solid #ef4444;
          padding: 5px 8px;
          margin-bottom: 6px;
          color: #991b1b;
          font-weight: 600;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          margin-top: 5px;
          margin-bottom: 5px;
        }
        .grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 6px;
          margin-top: 5px;
          margin-bottom: 5px;
        }
        .grid-4 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 5px;
          margin-top: 5px;
          margin-bottom: 5px;
        }
        .subcard {
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 4px;
          padding: 5px 7px;
        }
        .subcard-title {
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 2px;
          font-size: 8.5px;
        }
        .gate-badge {
          display: inline-block;
          width: 16px;
          height: 16px;
          line-height: 16px;
          text-align: center;
          border-radius: 50%;
          font-weight: 900;
          font-size: 8.5px;
          margin-right: 4px;
        }
        .gate-h { background: #ef4444; color: #ffffff; }
        .gate-w { background: #f59e0b; color: #0f172a; }
        .gate-r { background: #64748b; color: #ffffff; }
        .gate-s { background: #3b82f6; color: #ffffff; }
        .signoff-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          border: 1px solid #cbd5e1;
          font-size: 8px;
        }
        .signoff-table td {
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
          width: 33.33%;
          vertical-align: top;
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <span><strong>QA/QC Field Manual & SOP Document:</strong> ${d} | ${x}</span>
        <button onclick="window.print()" class="print-btn">Print Manual / Save as PDF</button>
      </div>

      <!-- Top Header Box with Dynamic Company Branding -->
      <table class="doc-header">
        <tr>
          <td class="header-brand">
            ${F(a,l)}
          </td>
          <td style="width: 53%;">
            <div class="header-title">QUALITY ASSURANCE & QUALITY CONTROL SYSTEM HANDBOOK</div>
            <div class="header-sub">PROJECT: ${o} (${s})</div>
            <div class="header-iso">QA/QC System Instruction Booklet & SOP Manual &bull; ISO 9001:2015</div>
          </td>
          <td class="meta-box">
            <strong>Manual Ref:</strong> <span style="color:#ea580c; font-weight:700;">${d}</span><br/>
            <strong>Rev No:</strong> ${x}<br/>
            <strong>Lead QA/QC:</strong> ${c}<br/>
            <strong>Date:</strong> ${m}
          </td>
        </tr>
      </table>

      <!-- Metadata Box -->
      <table class="meta-table">
        <tr>
          <td class="meta-label">MANUAL REF:</td>
          <td class="meta-val" style="color: #0284c7; font-family: monospace;">${d} (${x})</td>
          <td class="meta-label">PROJECT NAME:</td>
          <td class="meta-val">${o}</td>
          <td class="meta-label">DATE:</td>
          <td class="meta-val">${m}</td>
        </tr>
        <tr>
          <td class="meta-label">PROJECT CODE:</td>
          <td class="meta-val" style="font-family: monospace;">${s}</td>
          <td class="meta-label">LEAD QA/QC:</td>
          <td class="meta-val">${c}</td>
          <td class="meta-label">GOVERNANCE:</td>
          <td class="meta-val" style="color: #16a34a;">ISO 9001:2015 / BS EN Standards</td>
        </tr>
      </table>

      <!-- CHAPTER 0: Corporate Quality Architecture & 9 Stages -->
      <div class="chapter-box">
        <div class="chapter-header">
          <div class="chapter-title">0. Corporate Quality Architecture & The 9-Stage QA/QC Progression</div>
          <div class="chapter-badge">CD-QP-001 REV. 01</div>
        </div>
        <div class="chapter-content">
          <div class="callout-amber">
            <strong>Mandatory Corporate Quality Rule:</strong> No structural or architectural element may be cast, concealed, or backfilled without formal multi-stakeholder clearance. Compliance with this 9-stage sequence is mandatory on all construction sites.
          </div>
          <div class="grid-3">
            <div class="subcard">
              <div class="subcard-title">1. Pre-Construction Docs</div>
              <div>Approved PQP, QAP, ITP matrix, Method Statements, Project Specs & Issued-for-Construction (IFC) Drawings.</div>
            </div>
            <div class="subcard">
              <div class="subcard-title">2. Material Approval (MAR)</div>
              <div>Technical Data Sheets (TDS), Mill Test Certificates (MTC), source approvals, and physical sample approvals prior to procurement.</div>
            </div>
            <div class="subcard">
              <div class="subcard-title">3. Material Receiving (MIR)</div>
              <div>Waybill / Delivery tally, offloading condition check, quantity tally, Material Inspection Report (MIR) before unloading.</div>
            </div>
            <div class="subcard">
              <div class="subcard-title">4. Laboratory Testing</div>
              <div>Test requests, sampling logs, concrete batch tickets, 7/14/28-day cube crushing register, and calibration records.</div>
            </div>
            <div class="subcard">
              <div class="subcard-title">5. Work Inspection (WIR)</div>
              <div>Setting out, formwork line & level, rebar cover block checks, MEP coordination, and joint consultant inspections.</div>
            </div>
            <div class="subcard">
              <div class="subcard-title">6. Permit to Pour (PTP)</div>
              <div>Mandatory statutory pre-pour clearance signed off by Site Engineer, QA/QC Engineer, and Structural Consultant.</div>
            </div>
            <div class="subcard">
              <div class="subcard-title">7. Non-Conformance (NCR)</div>
              <div>Root-cause 5-Whys, containment, proposed disposition, corrective & preventive action (CAPA), ISO 8.7 closure sign-off.</div>
            </div>
            <div class="subcard">
              <div class="subcard-title">8. Site Instructions (SI)</div>
              <div>Formal contractual instructions issued to subcontractors for overdue NCRs or recurring defects with financial withholding.</div>
            </div>
            <div class="subcard">
              <div class="subcard-title">9. Records & Audits</div>
              <div>Daily site diary, weekly executive quality reports, subcontractor quality league tables, and permanent audit trails.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- CHAPTER 1: Material Submittals & Receiving -->
      <div class="chapter-box">
        <div class="chapter-header">
          <div class="chapter-title">1. Material Submittals (MAR) & Material Receiving Inspection (MIR)</div>
          <div class="chapter-badge">MAR / MIR Protocol</div>
        </div>
        <div class="chapter-content">
          <div class="grid-2">
            <div class="subcard">
              <div class="subcard-title">Material Approval Request (MAR) Protocol:</div>
              <div>1. All materials (cement, rebar, aggregates, waterproofing, admixtures, blocks) require approved MAR before purchase orders.</div>
              <div>2. Submissions must include Manufacturer Profile, Test Certificates, Compliance Statement against Project Specs.</div>
              <div>3. Valid status codes: <strong>A</strong> (Approved), <strong>B</strong> (Approved with Comments), <strong>C</strong> (Revise & Resubmit), <strong>D</strong> (Rejected).</div>
            </div>
            <div class="subcard">
              <div class="subcard-title">Material Inspection Report (MIR) Protocol:</div>
              <div>1. Conducted within 4 hours of truck arrival at site gate.</div>
              <div>2. Verify manufacturer tags, Heat Numbers against approved Mill Test Certificates, and physical integrity.</div>
              <div>3. Unapproved or damaged deliveries must be segregated into a quarantined holding yard with red warning tags.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- CHAPTER 2: Concrete Cube Testing & Acceptance Criteria -->
      <div class="chapter-box">
        <div class="chapter-header">
          <div class="chapter-title">2. Concrete Sampling, Slump Testing & Cube Crushing (BS EN 12390)</div>
          <div class="chapter-badge">BS EN 12390 / ASTM C39</div>
        </div>
        <div class="chapter-content">
          <div class="grid-3">
            <div class="subcard">
              <div class="subcard-title">Slump Test (BS EN 12350-2)</div>
              <div>Fill cone in 3 equal layers, tamping 25 times per layer. True slump must be within tolerance (e.g. 100 ± 25 mm for Class S3). Reject batch if slump exceeds 150 mm or water is added on site.</div>
            </div>
            <div class="subcard">
              <div class="subcard-title">Casting & Curing</div>
              <div>Cast 150×150×150 mm steel moulds in 3 layers (35 tamps/layer). Store covered with damp hessian at 20 ± 5°C for 24h. Submerge in water curing tank maintained at 20 ± 2°C until test date.</div>
            </div>
            <div class="subcard">
              <div class="subcard-title">Acceptance Rule (BS EN 206)</div>
              <div>Mean 28-day compressive strength of 3 test cubes must be ≥ fcu + 3 N/mm². No individual cube &lt; fcu - 3 N/mm². 7-day test is an early warning check (aiming for ≥ 65% fcu).</div>
            </div>
          </div>
          <div class="callout-red">
            <strong>Action on 28-Day Strength Failure:</strong> 1. Raise formal NCR; 2. Prohibit stripping back-props under structural slabs/beams; 3. Perform Schmidt rebound hammer & UPV non-destructive testing; 4. If still unresolved, core extraction (BS EN 12504-1) directed by Structural Consultant.
          </div>
        </div>
      </div>

      <!-- CHAPTER 3: Rebar Cutting & 1D Stock Nesting -->
      <div class="chapter-box">
        <div class="chapter-header">
          <div class="chapter-title">3. Rebar Cutting Schedule (BBS), 1D Stock Optimization & Offcut Salvage</div>
          <div class="chapter-badge">BS 8666 / BS 4449</div>
        </div>
        <div class="chapter-content">
          <div class="grid-3">
            <div class="subcard">
              <div class="subcard-title">Scrap Wastage Limit (≤ 3.5%)</div>
              <div>Contractual scrap allowance is ≤ 3.5%. Cutting schedules exceeding 4.0% must be re-nested or blended with smaller element schedules to absorb odd lengths.</div>
            </div>
            <div class="subcard">
              <div class="subcard-title">Reusable Offcuts (≥ 300 mm)</div>
              <div>Offcuts ≥ 300 mm must be tagged with red salvage labels, returned to offcut racks, and allocated for stirrups, links, chairs, and sub-elements.</div>
            </div>
            <div class="subcard">
              <div class="subcard-title">Unit Mass (w = D² / 162 kg/m)</div>
              <div>Y10: 0.617 kg/m | Y12: 0.888 kg/m | Y16: 1.578 kg/m | Y20: 2.466 kg/m | Y25: 3.853 kg/m | Y32: 6.313 kg/m. Verify against mill weighing scale.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- CHAPTER 4: ITP Matrix Architecture -->
      <div class="chapter-box">
        <div class="chapter-header">
          <div class="chapter-title">4. Inspection & Test Plan (ITP) Matrix & Control Gates</div>
          <div class="chapter-badge">Section 5.3 & Appendix B</div>
        </div>
        <div class="chapter-content">
          <div class="grid-4">
            <div class="subcard">
              <div class="subcard-title"><span class="gate-badge gate-h">H</span> Hold Point</div>
              <div>Mandatory quality stop. Work cannot proceed past this stage without signed clearance from QA/QC & Consultant.</div>
            </div>
            <div class="subcard">
              <div class="subcard-title"><span class="gate-badge gate-w">W</span> Witness Point</div>
              <div>Scheduled inspection checkpoint. Contractor gives min. 24h advance notice. Work may proceed if inspector is absent at agreed time.</div>
            </div>
            <div class="subcard">
              <div class="subcard-title"><span class="gate-badge gate-r">R</span> Review Point</div>
              <div>Verification of mill test certificates, laboratory crushing results, batching tickets, or calibration certificates.</div>
            </div>
            <div class="subcard">
              <div class="subcard-title"><span class="gate-badge gate-s">S</span> Surveillance</div>
              <div>Continuous or random monitoring of site workmanship (e.g. wall plumbness, concrete curing duration, vibrator usage).</div>
            </div>
          </div>
        </div>
      </div>

      <!-- CHAPTER 5: Permit to Pour Pre-Pour Checklist -->
      <div class="chapter-box">
        <div class="chapter-header">
          <div class="chapter-title">5. Permit to Pour (PTP) & Pre-Pour Inspection Sequence</div>
          <div class="chapter-badge">Mandatory Statutory Gating</div>
        </div>
        <div class="chapter-content">
          <div class="callout-amber">
            <strong>Mandatory Rule:</strong> No concrete placement permitted without an approved Permit to Pour signed by Site Engineer, QA/QC Engineer, and Consultant.
          </div>
          <div class="grid-2">
            <div class="subcard">
              <div class="subcard-title">5 Mandatory Checklist Items:</div>
              <div>1. <strong>Formwork:</strong> Plumbness, prop stability, tightness of joints, kicker alignment, cleanout doors open.</div>
              <div>2. <strong>Reinforcement:</strong> Size, count, spacing, lap lengths (40D tension / 50D compression), chairs, cover blocks (25mm slab, 40mm beam/col, 50mm earth).</div>
              <div>3. <strong>MEP Embeds:</strong> Conduits tied, plumbing sleeves insulated, no rebar cut for pipes.</div>
              <div>4. <strong>Cleanliness:</strong> All sawdust, tie wire, and debris blown out with compressed air / water jet.</div>
              <div>5. <strong>Survey & Levels:</strong> Level pegs set with laser/optical instrument.</div>
            </div>
            <div class="subcard">
              <div class="subcard-title">Sign-Off Sequence:</div>
              <div>1. <strong>Site Engineer:</strong> Verifies dimensional readiness & subcontractor work.</div>
              <div>2. <strong>QA/QC Engineer:</strong> Verifies rebar cover, cleanliness, MEP sign-off & concrete mix order.</div>
              <div>3. <strong>Structural Consultant / RE:</strong> Final statutory authorization for batch plant truck dispatch.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- CHAPTER 6: Non-Conformance Reports (NCR) -->
      <div class="chapter-box">
        <div class="chapter-header">
          <div class="chapter-title">6. Non-Conformance Reports (NCR) & Corrective Action Lifecycle</div>
          <div class="chapter-badge">ISO 9001 Clause 8.7</div>
        </div>
        <div class="chapter-content">
          <div class="grid-3">
            <div class="subcard">
              <div class="subcard-title">1. Identify & Contain</div>
              <div>Mark up defect with photos, cordon off area with red tape, and set digital lock on element in BIM.</div>
            </div>
            <div class="subcard">
              <div class="subcard-title">2. Root Cause & CAPA</div>
              <div>Apply 5-Whys methodology to uncover root cause and formulate corrective & preventive action across remaining floors.</div>
            </div>
            <div class="subcard">
              <div class="subcard-title">3. Re-inspect & Close</div>
              <div>QA/QC conducts physical reinspection of remedial work. Signs off closure date and archives records.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- CHAPTER 7: Site Observations & Daily Diary -->
      <div class="chapter-box">
        <div class="chapter-header">
          <div class="chapter-title">7. Field Observations, Photo Markup & Daily Site Log</div>
          <div class="chapter-badge">Field Quality Records</div>
        </div>
        <div class="chapter-content">
          <div class="grid-2">
            <div class="subcard">
              <div class="subcard-title">Site Observations & Photo Canvas Markup:</div>
              <div>Log defects with mobile photos, circle honeycombing or misplaced rebar with visual callouts, assign severity (Low, Med, High), and track through to after-repair resolution.</div>
            </div>
            <div class="subcard">
              <div class="subcard-title">Daily Site Diary:</div>
              <div>Records morning/afternoon weather, rainfall hours, subcontractor workforce headcount by trade, heavy equipment operating hours, and concrete volume cast.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- CHAPTER 8: Executive Reporting & Governance -->
      <div class="chapter-box">
        <div class="chapter-header">
          <div class="chapter-title">8. Executive Reporting, Staff Matrix & Audit Trail</div>
          <div class="chapter-badge">ISO Management Review</div>
        </div>
        <div class="chapter-content">
          <div class="grid-2">
            <div class="subcard">
              <div class="subcard-title">Weekly Quality Reports & KPIs:</div>
              <div>Summarizes weekly pour volume, cube strength trends, open vs closed NCR burndown, subcontractor scorecard rankings, and executive commentary for client/director review.</div>
            </div>
            <div class="subcard">
              <div class="subcard-title">Immutable Audit Trail:</div>
              <div>Every permit approval, cube entry, NCR sign-off, and drawing revision is cryptographically stamped with UID, exact timestamp, role, and client IP for audit traceability.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- CHAPTER 9: Technical Formulas & Cheatsheet -->
      <div class="chapter-box">
        <div class="chapter-header">
          <div class="chapter-title">9. Quick Reference Engineering Formulas & Tolerances</div>
          <div class="chapter-badge">Engineering Reference</div>
        </div>
        <div class="chapter-content">
          <div class="grid-3">
            <div class="subcard">
              <div class="subcard-title">Formulas</div>
              <div>&bull; Rebar: w = D² / 162 kg/m<br/>&bull; Lap (Tension): 40 × D<br/>&bull; Lap (Compression): 50 × D<br/>&bull; Cube: f = (P [kN] × 1000) / 22,500 N/mm²</div>
            </div>
            <div class="subcard">
              <div class="subcard-title">Slump Classes (BS EN 206)</div>
              <div>&bull; S1: 10 – 40 mm (Kerbs, mass conc)<br/>&bull; S2: 50 – 90 mm (Strip footings)<br/>&bull; S3: 100 – 150 mm (Pumpable slabs/cols)<br/>&bull; S4: 160 – 210 mm (Congested rebar)<br/>&bull; S5: ≥ 220 mm (Self-compacting)</div>
            </div>
            <div class="subcard">
              <div class="subcard-title">Min Concrete Cover</div>
              <div>&bull; Slabs / Walls: 25 mm<br/>&bull; Beams: 35 – 40 mm<br/>&bull; Columns: 40 mm<br/>&bull; Foundations / Soil: 50 – 75 mm</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sign-Off Block -->
      <table class="signoff-table">
        <tr>
          <td>
            <div style="font-weight: 800; color: #475569; margin-bottom: 3px;">COMPILED BY (QA/QC ENGINEER):</div>
            <div>Name: <strong>${c}</strong></div>
            <div style="margin-top: 14px; border-bottom: 1px dotted #94a3b8; width: 80%;">Signature: </div>
            <div style="margin-top: 3px;">Date: ${m}</div>
          </td>
          <td>
            <div style="font-weight: 800; color: #475569; margin-bottom: 3px;">REVIEWED BY (QUALITY MANAGER):</div>
            <div>Name: <strong>Quality Assurance / Control Manager</strong></div>
            <div style="margin-top: 14px; border-bottom: 1px dotted #94a3b8; width: 80%;">Signature: </div>
            <div style="margin-top: 3px;">Date: ____ / ____ / 20__</div>
          </td>
          <td>
            <div style="font-weight: 800; color: #475569; margin-bottom: 3px;">APPROVED BY (PROJECT DIRECTOR / RE):</div>
            <div>Name: <strong>Project Director / Resident Engineer</strong></div>
            <div style="margin-top: 14px; border-bottom: 1px dotted #94a3b8; width: 80%;">Signature: </div>
            <div style="margin-top: 3px;">Date: ____ / ____ / 20__</div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `}function ce(a,l,i){var c;const o=de(a,l,i),s=window.open("","_blank");if(s)s.document.open(),s.document.write(o),s.document.close(),setTimeout(()=>{s.focus(),s.print()},400);else{const r=document.createElement("iframe");r.style.position="fixed",r.style.right="0",r.style.bottom="0",r.style.width="0",r.style.height="0",r.style.border="none",document.body.appendChild(r);const d=(c=r.contentWindow)==null?void 0:c.document;d&&(d.open(),d.write(o),d.close(),setTimeout(()=>{var x,m;(x=r.contentWindow)==null||x.focus(),(m=r.contentWindow)==null||m.print(),setTimeout(()=>{document.body.removeChild(r)},1e3)},500))}}const ve=()=>{var w;const a=q(),{projectId:l}=B(),{currentUser:i}=W(),{activeProject:o}=H(),{company:s}=z(),c=(s==null?void 0:s.name)||(s==null?void 0:s.legalName)||"JQMS Enterprise",r=(s==null?void 0:s.address)||"3B, Taofik Lawal, Off Awolowo Road, Ikoyi, Lagos",d=(s==null?void 0:s.phone)||"+234 (0) 16328782",x=(s==null?void 0:s.email)||"info@collection.gp",m=(o==null?void 0:o.qaqcEngineerName)||(i==null?void 0:i.fullName)||"Lead QA/QC Engineer",v=`${((w=s==null?void 0:s.settings)==null?void 0:w.inspectionPrefix)||"CD"}-QP-001 REV. 01`,[f,A]=u.useState(""),[g,M]=u.useState("ALL"),[E,j]=u.useState({"ch-0":!0,"ch-1":!0}),T=V(i),Q=t=>{j(n=>({...n,[t]:!n[t]}))},L=()=>{const t={};y.forEach(n=>t[n.id]=!0),j(t)},I=()=>{j({})},D=()=>{ce(s||void 0,o||void 0,i||void 0)},y=u.useMemo(()=>[{id:"ch-0",category:"Preamble",title:"0. Corporate Quality Architecture & 9-Stage QA/QC Flow",icon:S,badge:v,summary:`Governing Quality Plan for ${c}. Mandates the sequential 9-step quality lifecycle for all construction activities.`,content:e.jsxs("div",{className:"space-y-4 text-xs text-slate-300 leading-relaxed",children:[e.jsxs("div",{className:"p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-amber-400 font-bold uppercase tracking-wider text-[11px]",children:"Company Standards & Document Control"}),e.jsxs("span",{className:"font-mono text-[10px] text-slate-400",children:["Ref: ",v]})]}),e.jsxs("p",{className:"text-slate-300",children:[e.jsx("strong",{children:"Company:"})," ",c," |"," ",e.jsx("strong",{children:"Headquarters:"})," ",r," |"," ",e.jsx("strong",{children:"Lead QA/QC Authority:"})," ",m," (QA/QC Engineer)."]}),e.jsx("p",{className:"text-slate-400 text-[11px]",children:"This Quality Management Plan enforces the zero-compromise standard across all structural, civil, and architectural trades. No element may be cast or covered without formal multi-stakeholder clearance."})]}),e.jsx("h4",{className:"font-bold text-slate-100 text-sm mt-4",children:"The 9 Sequential Stages of Quality Progression:"}),e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-3",children:[{step:"Stage 1",title:"Pre-Construction Documentation",desc:"Approved Project Quality Plan (PQP), Quality Assurance Plan (QAP), Inspection & Test Plan (ITP), Method Statements, Project Specifications, Construction Drawings."},{step:"Stage 2",title:"Material Approval (MAR)",desc:"Technical Data Sheets (TDS), Mill Test Certificates (MTC), Source Approvals, and Sample Approvals before procurement."},{step:"Stage 3",title:"Material Receiving & MIR",desc:"Delivery Waybill verification, physical damage inspection, quantity tally, and Material Inspection Report (MIR) before site unloading."},{step:"Stage 4",title:"Laboratory Testing",desc:"Test requests, sampling logs, concrete batch tickets, cube registers, and equipment calibration certificates."},{step:"Stage 5",title:"Work Inspection & Hold Points",desc:"Work Inspection Requests (WIR / RFI), setting out, formwork, rebar cover, and joint consultant inspections."},{step:"Stage 6",title:"Permit to Pour (PTP)",desc:"Mandatory statutory pre-pour clearance signed off by Site Engineer, QA/QC Engineer, and Structural Consultant."},{step:"Stage 7",title:"Non-Conformance Control (NCR)",desc:"Root-cause 5-Whys, containment, proposed disposition, corrective & preventive action, ISO 8.7 closure sign-off."},{step:"Stage 8",title:"Site Instructions (SI)",desc:"Formal contractual warning notices issued to subcontractors for overdue NCRs or recurring defects."},{step:"Stage 9",title:"Records, Logs & Weekly Audits",desc:"Daily Site Log diary, Weekly Quality Progress Reports, Executive KPI dashboards, and immutable audit trail."}].map((t,n)=>e.jsxs("div",{className:"p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-1.5",children:[e.jsx("span",{className:"px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold",children:t.step}),e.jsx("span",{className:"font-semibold text-slate-200 text-xs truncate",children:t.title})]}),e.jsx("p",{className:"text-[11px] text-slate-400",children:t.desc})]},n))})]})},{id:"ch-1",category:"Quality & Defect",title:"1. Inspection & Test Plan (ITP) Matrix Architecture",icon:P,badge:"Section 5.3 & Appendix B",summary:"How to navigate, filter, append, and export the standard 6-column ITP matrix and utilize 1-click WIR generation for Hold Points.",quickLink:"/project/itp",quickLinkLabel:"Open ITP Matrix Registry",content:e.jsxs("div",{className:"space-y-4 text-xs text-slate-300 leading-relaxed",children:[e.jsx("p",{children:"The ITP Matrix is the definitive roadmap for site inspection gating. It coordinates what to inspect, to what standard, by whom, and under which control gate."}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-3",children:[e.jsxs("div",{className:"p-3 rounded-xl bg-red-950/30 border border-red-800/50",children:[e.jsxs("div",{className:"flex items-center gap-2 text-red-400 font-bold mb-1",children:[e.jsx("span",{className:"w-5 h-5 rounded-full bg-red-500 text-slate-950 flex items-center justify-center text-xs font-black",children:"H"}),"Hold Point"]}),e.jsxs("p",{className:"text-[11px] text-slate-300",children:[e.jsx("strong",{children:"Mandatory inspection stop."})," Work cannot proceed past this stage without formal written sign-off from the QA/QC Engineer and Resident Engineer."]}),e.jsx("div",{className:"mt-2 text-[10px] text-red-300 font-mono",children:'→ Click "WIR" button in matrix to raise inspection notice.'})]}),e.jsxs("div",{className:"p-3 rounded-xl bg-amber-950/30 border border-amber-800/50",children:[e.jsxs("div",{className:"flex items-center gap-2 text-amber-400 font-bold mb-1",children:[e.jsx("span",{className:"w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black",children:"W"}),"Witness Point"]}),e.jsx("p",{className:"text-[11px] text-slate-300",children:"Notified checkpoint. Contractor provides min. 24h notice. If QA/QC or consultant is not present at designated time, work may proceed if pre-authorized."})]}),e.jsxs("div",{className:"p-3 rounded-xl bg-slate-900 border border-slate-700",children:[e.jsxs("div",{className:"flex items-center gap-2 text-slate-300 font-bold mb-1",children:[e.jsx("span",{className:"w-5 h-5 rounded-full bg-slate-400 text-slate-950 flex items-center justify-center text-xs font-black",children:"R"}),"Review Point"]}),e.jsx("p",{className:"text-[11px] text-slate-300",children:"Documentary examination point. Verification of Mill Test Certificates (MTC), concrete crushing results, batching records, or independent lab certificates."})]}),e.jsxs("div",{className:"p-3 rounded-xl bg-blue-950/30 border border-blue-800/50",children:[e.jsxs("div",{className:"flex items-center gap-2 text-blue-400 font-bold mb-1",children:[e.jsx("span",{className:"w-5 h-5 rounded-full bg-blue-500 text-slate-950 flex items-center justify-center text-xs font-black",children:"S"}),"Surveillance"]}),e.jsx("p",{className:"text-[11px] text-slate-300",children:"Continuous or random visual monitoring of ongoing site execution (e.g. wall plumbness, concrete curing duration, rebar bending yard checks)."})]})]}),e.jsxs("div",{className:"p-3.5 rounded-xl bg-slate-950 border border-slate-800",children:[e.jsx("h5",{className:"font-bold text-slate-200 mb-2",children:"Standard Appendix B Matrix Columns:"}),e.jsxs("ol",{className:"list-decimal pl-5 space-y-1 text-slate-400 text-[11px]",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Activity / Stage:"})," The specific construction package (e.g. Masonry, In-situ Concrete, Substructure)."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Inspection Item / Parameter:"})," The exact physical or chemical attribute to be checked."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Reference Standard / Spec:"})," Code clause (BS 6073, NIS 87, BS EN 12390, ASTM C39, BS 8110)."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Acceptance Criteria:"})," Objective numerical tolerance or boundary (e.g. Min 5 blocks crushing, ≥ 2.5 N/mm²)."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Control Gate:"})," H, W, R, or S classification."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Responsible / Verifying Party:"})," Assigned inspection entity (QA/QC Engineer, RE, Lab)."]})]})]})]})},{id:"ch-2",category:"Materials & Testing",title:"2. Permit to Pour (PTP) & Pre-Pour Checklist Protocol",icon:Y,badge:"Mandatory Gating",summary:"Protocol for issuing concrete permits, conducting the 5-point verification, and securing statutory sign-offs.",quickLink:"/project/permit-to-pour",quickLinkLabel:"Open Permit to Pour Register",content:e.jsxs("div",{className:"space-y-4 text-xs text-slate-300 leading-relaxed",children:[e.jsxs("div",{className:"p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200",children:[e.jsx("strong",{children:"MANDATORY GATING RULE:"})," Under no circumstances may ready-mix concrete or site-batched concrete be placed into formwork without an APPROVED, digitally or physically signed Permit to Pour (PTP). Concrete batch plants must not dispatch trucks without PTP confirmation."]}),e.jsx("h5",{className:"font-bold text-slate-100 text-sm",children:"The 5 Pre-Pour Inspection Gates:"}),e.jsx("div",{className:"space-y-2",children:[{gate:"1. Formwork & Falsework",checks:"Prop spacing, bracing stability, shutter plumbness, tightness of joints (grout-loss prevention), release agent applied sparingly without pooling, kicker alignment."},{gate:"2. Reinforcement & Spacers",checks:"Rebar size, quantity, spacing, lap lengths (min 40D / 50D), chair spacers for top steel, concrete cover blocks (min 25mm slabs, 40mm beams/columns, 50mm earth-retaining elements)."},{gate:"3. MEP Concealed Services",checks:"Electrical conduits tied securely, plumbing sleeves sleeved with pipe insulation, box positions verified against MEP coordinated drawings, no rebar cut for pipes."},{gate:"4. Cleanliness & Debris Blowout",checks:"Cleanout windows open at column bases, all sawdust, binding wire clippings, and debris blown out with compressed air / high-pressure water, cleanout doors sealed tight."},{gate:"5. Setting Out & Level Verification",checks:"Slab top finish level pegs set with optical level/laser, vertical axis alignment verified against cadastral gridlines."}].map((t,n)=>e.jsxs("div",{className:"p-3 rounded-xl bg-slate-900 border border-slate-800",children:[e.jsxs("span",{className:"font-bold text-amber-400",children:[t.gate,": "]}),e.jsx("span",{className:"text-slate-300",children:t.checks})]},n))}),e.jsxs("div",{className:"p-3 rounded-xl bg-slate-950 border border-slate-800",children:[e.jsx("span",{className:"font-bold text-slate-200",children:"Statutory 3-Party Sign-Off Sequence:"}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-[11px]",children:[e.jsxs("div",{className:"p-2 rounded-lg bg-slate-900 border border-slate-800",children:[e.jsx("span",{className:"font-bold text-slate-300",children:"1. Site Engineer:"}),e.jsx("p",{className:"text-slate-400",children:"Verifies readiness, dimensions, and subcontractor execution."})]}),e.jsxs("div",{className:"p-2 rounded-lg bg-slate-900 border border-slate-800",children:[e.jsx("span",{className:"font-bold text-amber-400",children:"2. QA/QC Engineer:"}),e.jsx("p",{className:"text-slate-400",children:"Verifies cover, cleanliness, MEP sign-off, and slump criteria."})]}),e.jsxs("div",{className:"p-2 rounded-lg bg-slate-900 border border-slate-800",children:[e.jsx("span",{className:"font-bold text-blue-400",children:"3. Structural Consultant / RE:"}),e.jsx("p",{className:"text-slate-400",children:"Final statutory clearance authorizing batch plant discharge."})]})]})]})]})},{id:"ch-3",category:"Materials & Testing",title:"3. Concrete Cube Testing & Acceptance Criteria (BS EN 12390)",icon:G,badge:"BS EN 12390 / ASTM C39",summary:"Sampling procedures, curing water tank conditions, crushing machine entry, and compliance evaluation rules.",quickLink:"/project/concrete",quickLinkLabel:"Open Concrete Cube Testing",content:e.jsxs("div",{className:"space-y-4 text-xs text-slate-300 leading-relaxed",children:[e.jsx("h5",{className:"font-bold text-slate-100 text-sm",children:"Sampling & Casting Procedure:"}),e.jsxs("ol",{className:"list-decimal pl-5 space-y-1.5 text-slate-300 text-[11px]",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Sampling Point:"})," Collect fresh concrete from ready-mix truck chute after discharging the initial 0.2 m³ (never from the very first or last discharge)."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Slump Testing (BS EN 12350-2):"})," Fill slump cone in 3 equal layers, tamping each 25 times. Measure true subsidence. Tolerance: 100 ± 25 mm (Class S3). Reject batch if slump > 150 mm (excess water/segregation) or < 50 mm (stiff batch)."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Temperature Check:"})," Fresh concrete temperature must not exceed 32°C in tropical ambient conditions."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Cube Casting:"})," Standard 150 × 150 × 150 mm steel moulds. Apply thin mineral oil release. Fill in 3 layers, compacting each layer with 35 tamps using standard 1.8 kg tamping bar or vibrating table."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Initial Setting:"})," Store in shaded, humid area at 20 ± 5°C covered with damp hessian or polythene for 24 ± 4 hours."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Curing Tank:"})," Demould after 24h, mark indelibly with Element ID & Date, and submerge in water curing tank maintained at 20 ± 2°C."]})]}),e.jsxs("div",{className:"p-3 rounded-xl bg-slate-900 border border-slate-800",children:[e.jsx("h5",{className:"font-bold text-amber-400 mb-2",children:"Compressive Strength Acceptance Rules:"}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]",children:[e.jsxs("div",{className:"p-2.5 rounded-lg bg-slate-950 border border-slate-800",children:[e.jsx("div",{className:"font-bold text-slate-200 mb-1",children:"7-Day Interim Check"}),e.jsx("p",{className:"text-slate-400",children:"Concrete should typically attain 65% to 75% of specified characteristic strength (fcu). Used as early warning indicator; low 7-day strength warrants propping retention."})]}),e.jsxs("div",{className:"p-2.5 rounded-lg bg-slate-950 border border-slate-800",children:[e.jsx("div",{className:"font-bold text-slate-200 mb-1",children:"28-Day Final Statutory Acceptance"}),e.jsxs("p",{className:"text-slate-400",children:["BS EN 206 / BS 8110 Compliance Rule:",e.jsx("br",{}),"1. Mean strength of 3 test cubes ≥ fcu + 3 N/mm²",e.jsx("br",{}),"2. No individual test cube < fcu - 3 N/mm²"]})]})]})]}),e.jsxs("div",{className:"p-3 rounded-xl bg-red-950/30 border border-red-800/40 text-red-200 text-[11px]",children:[e.jsx("strong",{children:"FAIL PROTOCOL:"})," If 28-day strength fails, immediately: 1. Raise formal NCR; 2. Stop stripping back-props; 3. Perform Schmidt Rebound Hammer & UPV testing; 4. If inconclusive, extract 100 mm diameter core samples (BS EN 12504-1) under Structural Engineer supervision."]})]})},{id:"ch-4",category:"Materials & Testing",title:"4. Rebar Cutting Schedule (BBS) & Commercial Stock Optimization",icon:U,badge:"12m Stock & Offcut QA",summary:"Managing cutting patterns, enforcing scrap wastage limits (<= 3.5%), tagging reusable offcuts (>= 300mm), and mill test verification.",quickLink:"/project/steel/bar-cutting",quickLinkLabel:"Open Bar Cutting Schedule",content:e.jsxs("div",{className:"space-y-4 text-xs text-slate-300 leading-relaxed",children:[e.jsx("p",{children:"Reinforcement steel represents up to 40% of structural cost. The Bar Cutting module enforces mathematical 1D cutting stock optimization from standard 12.00m commercial bars to minimize scrap wastage while maintaining 100% barmark traceability."}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-3",children:[e.jsxs("div",{className:"p-3 rounded-xl bg-slate-900 border border-slate-800",children:[e.jsx("span",{className:"font-bold text-amber-400",children:"Target Scrap Limit"}),e.jsx("p",{className:"text-slate-400 text-[11px] mt-1",children:"Contractual scrap threshold is ≤ 3.5%. Any cutting schedule with scrap > 4.0% must be re-combined with other schedules to utilize offcuts."})]}),e.jsxs("div",{className:"p-3 rounded-xl bg-slate-900 border border-slate-800",children:[e.jsx("span",{className:"font-bold text-red-400",children:"Offcut Reusability Rule"}),e.jsxs("p",{className:"text-slate-400 text-[11px] mt-1",children:["Any offcut ≥ 300 mm is designated as ",e.jsx("strong",{children:"REUSABLE STOCK"})," (highlighted in red/pink badge). Tag and return to rebar yard for starters/stirrups."]})]}),e.jsxs("div",{className:"p-3 rounded-xl bg-slate-900 border border-slate-800",children:[e.jsx("span",{className:"font-bold text-blue-400",children:"MTC Heat Traceability"}),e.jsx("p",{className:"text-slate-400 text-[11px] mt-1",children:"Every fabricated batch must record Mill Heat Number and yield strength (fy ≥ 500 N/mm², elongation ≥ 12%)."})]})]}),e.jsxs("div",{className:"p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px]",children:[e.jsx("div",{className:"text-slate-200 font-bold mb-1",children:"Standard Rebar Unit Weights (w = D² / 162 kg/m):"}),e.jsxs("div",{className:"grid grid-cols-3 sm:grid-cols-6 gap-2 text-slate-400",children:[e.jsx("div",{children:"Y10: 0.617 kg/m"}),e.jsx("div",{children:"Y12: 0.888 kg/m"}),e.jsx("div",{children:"Y16: 1.578 kg/m"}),e.jsx("div",{children:"Y20: 2.466 kg/m"}),e.jsx("div",{children:"Y25: 3.853 kg/m"}),e.jsx("div",{children:"Y32: 6.313 kg/m"})]})]})]})},{id:"ch-5",category:"Quality & Defect",title:"5. Non-Conformance Reports (NCR) & Corrective Action Lifecycle",icon:J,badge:"ISO 9001 Clause 8.7",summary:"Procedure for defect classification, containment, root cause analysis (5-Whys), disposition, and statutory closure.",quickLink:"/project/ncrs",quickLinkLabel:"Open NCR Module",content:e.jsxs("div",{className:"space-y-4 text-xs text-slate-300 leading-relaxed",children:[e.jsx("h5",{className:"font-bold text-slate-100 text-sm",children:"NCR Step-by-Step Resolution Workflow:"}),e.jsx("div",{className:"space-y-2",children:[{phase:"1. Identification & Containment",detail:"Document defect with high-resolution photo markup. Immediately stop ongoing work on the affected element. Tag element with Red Caution Tape or digital Lock in BIM register."},{phase:"2. Root Cause Analysis (RCA)",detail:"Apply 5-Whys methodology. Distinguish between Human Error, Material Failure, Equipment Malfunction, Inadequate Method Statement, or Environmental Factor."},{phase:"3. Proposed Disposition",detail:"Subcontractor proposes one of 4 statutory dispositions: 1. Scrap / Reconstruct; 2. Repair / Remedial Work; 3. Concession / Use-as-is (requires Consultant approval); 4. Re-classify."},{phase:"4. Corrective & Preventive Action (CAPA)",detail:"Formulate actions to eliminate the underlying root cause across remaining floors (e.g. retraining rebar fixers, replacing defective formwork plywood)."},{phase:"5. Physical Verification & Final Sign-Off",detail:"QA/QC Engineer conducts physical reinspection of repaired element. When compliant, digitally signs off with closure date and attaches verification photos."}].map((t,n)=>e.jsxs("div",{className:"p-3 rounded-xl bg-slate-900 border border-slate-800",children:[e.jsxs("span",{className:"font-bold text-amber-400",children:[t.phase,": "]}),e.jsx("span",{className:"text-slate-300",children:t.detail})]},n))}),e.jsxs("div",{className:"p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("span",{className:"font-bold text-slate-200",children:"Overdue NCR Escalation:"}),e.jsxs("p",{className:"text-slate-400 text-[11px]",children:["If an NCR is not addressed within its target completion SLA (e.g. 7 days), the system generates an alert to issue a formal ",e.jsx("strong",{children:"Site Instruction (SI)"})," with financial withholding."]})]}),e.jsx(k,{to:"/project/site-instructions",className:"px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-semibold text-xs transition shrink-0 ml-3",children:"Site Instructions"})]})]})},{id:"ch-6",category:"BIM & Elements",title:"6. 3D BIM Elements & Digital Element Passports",icon:K,badge:"WebGL & QR Code",summary:"Visualizing structural elements in 3D, tracing lifecycle statuses, and scanning QR element passports on site.",quickLink:"/project/elements",quickLinkLabel:"Open BIM Element Registry",content:e.jsxs("div",{className:"space-y-4 text-xs text-slate-300 leading-relaxed",children:[e.jsx("p",{children:"Every structural component (Foundation, Column, Shear Wall, Beam, Slab) has a unique digital identity and barcode/QR passport."}),e.jsxs("div",{className:"p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2",children:[e.jsx("span",{className:"font-bold text-slate-200 text-xs",children:"Standard Element Lifecycle Statuses:"}),e.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]",children:[e.jsxs("div",{className:"p-2 rounded bg-slate-950 border border-slate-800 text-slate-400",children:[e.jsx("span",{className:"font-bold text-slate-300",children:"1. Planned / Pending:"})," Modeled in BIM, awaiting kickoff."]}),e.jsxs("div",{className:"p-2 rounded bg-slate-950 border border-slate-800 text-amber-400",children:[e.jsx("span",{className:"font-bold",children:"2. Rebar Fixed:"})," Steel tied, awaiting WIR inspection."]}),e.jsxs("div",{className:"p-2 rounded bg-slate-950 border border-slate-800 text-blue-400",children:[e.jsx("span",{className:"font-bold",children:"3. Formwork Boxed:"})," Shutters closed, PTP checklist open."]}),e.jsxs("div",{className:"p-2 rounded bg-slate-950 border border-slate-800 text-purple-400",children:[e.jsx("span",{className:"font-bold",children:"4. Poured:"})," Concrete cast, batch ticket & cube tied."]}),e.jsxs("div",{className:"p-2 rounded bg-slate-950 border border-slate-800 text-teal-400",children:[e.jsx("span",{className:"font-bold",children:"5. Curing (7-28d):"})," Water ponding or curing compound active."]}),e.jsxs("div",{className:"p-2 rounded bg-slate-950 border border-slate-800 text-emerald-400",children:[e.jsx("span",{className:"font-bold",children:"6. Accepted & Closed:"})," 28d crushing passed, QA signed."]})]})]}),e.jsxs("div",{className:"p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400",children:[e.jsx("strong",{children:"Digital Passport Scanning:"})," Field engineers scan the QR sticker on the cast element using any mobile camera or tablet to immediately inspect attached concrete cube crushing results, PTP history, inspection sign-offs, and open comments."]})]})},{id:"ch-7",category:"Field Operations",title:"7. Field Observations, Photo Markup & Daily Diary",icon:X,badge:"Site Reality",summary:"Capturing field defects, marking up site photos with arrows/clouds, and compiling the daily site diary.",quickLink:"/project/site-comments",quickLinkLabel:"Open Site Comments",content:e.jsxs("div",{className:"space-y-4 text-xs text-slate-300 leading-relaxed",children:[e.jsx("h5",{className:"font-bold text-slate-100 text-sm",children:"Site Observations & Mobile Photo Markup:"}),e.jsxs("p",{children:["When a defect or deviation is noticed on site that does not yet warrant a full contractual NCR, raise a ",e.jsx("strong",{children:"Site Comment / Observation"}),":"]}),e.jsxs("ul",{className:"list-disc pl-5 space-y-1 text-slate-300 text-[11px]",children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Snap Photo:"})," Use the camera or upload directly from phone gallery."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Interactive Markup:"})," Use the built-in canvas markup tool to circle honeycombing, draw arrows to displaced rebar, or highlight missing cover blocks."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Categorize:"})," Assign severity (Low, Medium, High) and trade (Concreting, Steel Fixing, Carpentry, Masonry, Plumbing, Electrical)."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Status Tracking:"})," Track from ",e.jsx("em",{children:"Open"})," → ",e.jsx("em",{children:"In Progress"})," → ",e.jsx("em",{children:"Resolved"})," with after-repair verification photo."]})]}),e.jsxs("div",{className:"p-3 rounded-xl bg-slate-900 border border-slate-800",children:[e.jsx("span",{className:"font-bold text-slate-200",children:"Daily Site Log (Diary):"}),e.jsx("p",{className:"text-slate-400 text-[11px] mt-1",children:"Records weather (temperature, morning/afternoon rainfall, wind), operational workforce headcount by trade, heavy plant utilization (tower cranes, concrete pumps, generators), and key pour volumes."}),e.jsx("div",{className:"mt-2",children:e.jsx(k,{to:"/project/daily-logs",className:"text-amber-400 hover:text-amber-300 font-semibold text-xs underline",children:"→ Go to Daily Site Logs"})})]})]})},{id:"ch-8",category:"Governance",title:"8. Executive Reporting, Staff Matrix & Audit Trail",icon:Z,badge:"ISO 9001 Management Review",summary:"Weekly quality report generation, role-based access control (RBAC), and immutable tamper-evident audit logging.",quickLink:"/project/weekly-reports",quickLinkLabel:"Open Weekly Reports",content:e.jsxs("div",{className:"space-y-4 text-xs text-slate-300 leading-relaxed",children:[e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-3",children:[e.jsxs("div",{className:"p-3 rounded-xl bg-slate-900 border border-slate-800",children:[e.jsx("span",{className:"font-bold text-amber-400",children:"Weekly Quality Reports"}),e.jsx("p",{className:"text-slate-400 text-[11px] mt-1",children:"Aggregates active PTPs, concrete test statistics, open vs closed NCR count, subcontractor quality scorecards, and executive narrative summaries for client/investor circulation."})]}),e.jsxs("div",{className:"p-3 rounded-xl bg-slate-900 border border-slate-800",children:[e.jsx("span",{className:"font-bold text-blue-400",children:"Immutable Audit Trail"}),e.jsx("p",{className:"text-slate-400 text-[11px] mt-1",children:"Every permit approval, cube crush entry, NCR closure, and document revision is stamped with UID, exact server timestamp, user role, and hash to guarantee tamper prevention."})]})]}),e.jsxs("div",{className:"p-3 rounded-xl bg-slate-950 border border-slate-800",children:[e.jsx("span",{className:"font-bold text-slate-200",children:"5-Tier Role Access Architecture:"}),e.jsxs("div",{className:"space-y-1 text-slate-400 text-[11px] mt-1.5",children:[e.jsxs("div",{children:["• ",e.jsx("strong",{children:"Level 5:"})," Quality Director, Super Admin, Executive Management (Company-wide governance)."]}),e.jsxs("div",{children:["• ",e.jsx("strong",{children:"Level 4:"})," Senior QA/QC Engineer, QA/QC Engineer, Quality Manager, Project Manager (Authorizes PTP, Closes NCR, Signs ITP)."]}),e.jsxs("div",{children:["• ",e.jsx("strong",{children:"Level 3:"})," Construction Manager, Project Engineer, Materials Engineer, Lab Manager (Reviews & Prepares)."]}),e.jsxs("div",{children:["• ",e.jsx("strong",{children:"Level 2:"})," Site Engineer, QA/QC Inspector, Surveyor (Raises WIR, inputs field tests)."]}),e.jsxs("div",{children:["• ",e.jsx("strong",{children:"Level 1:"})," Subcontractor, Third-Party Lab, Consultant (Viewer / Reviewer)."]})]})]})]})},{id:"ch-9",category:"Standards & Formulas",title:"9. Quick Reference Engineering Formulas & Tolerances",icon:ee,badge:"Field Pocket Cheatsheet",summary:"Essential mathematical formulas, concrete slump classes, cover tolerances, and brickwork testing standards.",quickLink:"/project/calculators",quickLinkLabel:"Open Calculators",content:e.jsxs("div",{className:"space-y-4 text-xs text-slate-300 leading-relaxed",children:[e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-3",children:[e.jsxs("div",{className:"p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-[11px]",children:[e.jsx("div",{className:"font-bold text-amber-400 font-sans text-xs",children:"Structural Engineering Formulas:"}),e.jsxs("div",{children:["• ",e.jsx("strong",{children:"Rebar Weight:"})," w = D² / 162 (kg/m)"]}),e.jsxs("div",{children:["• ",e.jsx("strong",{children:"Tension Lap Length:"})," L_lap = 40 × D (Grade 500)"]}),e.jsxs("div",{children:["• ",e.jsx("strong",{children:"Compression Lap:"})," L_lap = 50 × D"]}),e.jsxs("div",{children:["• ",e.jsx("strong",{children:"Concrete Volume:"})," V = L × W × H × 1.05 (5% waste allowance)"]}),e.jsxs("div",{children:["• ",e.jsx("strong",{children:"Cube Strength:"})," f = (P [kN] × 1000) / 22,500 (N/mm²)"]})]}),e.jsxs("div",{className:"p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-[11px]",children:[e.jsx("div",{className:"font-bold text-blue-400 font-sans text-xs",children:"Slump Classes (BS EN 206):"}),e.jsxs("div",{children:["• ",e.jsx("strong",{children:"S1:"})," 10 – 40 mm (Kerbs, mass foundations)"]}),e.jsxs("div",{children:["• ",e.jsx("strong",{children:"S2:"})," 50 – 90 mm (Normal reinforced slabs, strips)"]}),e.jsxs("div",{children:["• ",e.jsx("strong",{children:"S3:"})," 100 – 150 mm (Pumpable mix, beams, columns)"]}),e.jsxs("div",{children:["• ",e.jsx("strong",{children:"S4:"})," 160 – 210 mm (Tremie, congested rebar)"]}),e.jsxs("div",{children:["• ",e.jsx("strong",{children:"S5:"})," ≥ 220 mm (Self-compacting concrete)"]})]})]}),e.jsxs("div",{className:"p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px]",children:[e.jsx("div",{className:"font-bold text-emerald-400 font-sans text-xs mb-1",children:"Minimum Concrete Cover Tolerances:"}),e.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300",children:[e.jsx("div",{children:"Slabs / Walls: 25 mm"}),e.jsx("div",{children:"Beams: 35 – 40 mm"}),e.jsx("div",{children:"Columns: 40 mm"}),e.jsx("div",{children:"Foundations / Soil: 50 – 75 mm"})]})]})]})}],[]),O=["ALL","Preamble","Governance","BIM & Elements","Quality & Defect","Materials & Testing","Field Operations","Standards & Formulas"],C=u.useMemo(()=>y.filter(t=>{const n=g==="ALL"||t.category===g,p=f.toLowerCase().trim();if(!p)return n;const N=t.title.toLowerCase().includes(p)||t.summary.toLowerCase().includes(p)||t.category.toLowerCase().includes(p)||t.badge&&t.badge.toLowerCase().includes(p);return n&&N}),[y,g,f]);return T?e.jsxs("div",{className:"min-h-screen pb-16 space-y-6 text-slate-100",children:[e.jsxs("div",{className:"p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 shadow-2xl relative overflow-hidden",children:[e.jsx("div",{className:"absolute top-0 right-0 p-8 opacity-10 pointer-events-none",children:e.jsx(b,{className:"w-64 h-64 text-amber-400"})}),e.jsxs("div",{className:"relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsxs("span",{className:"px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm",children:[e.jsx(S,{className:"w-3.5 h-3.5"}),"QA/QC EXCLUSIVE FIELD MANUAL"]}),e.jsx("span",{className:"px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-bold",children:v}),e.jsx("span",{className:"px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold",children:"ISO 9001:2015 Compliant"})]}),e.jsx("h1",{className:"text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight",children:"QA/QC System Instruction Booklet & SOP Manual"}),e.jsx("p",{className:"text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed",children:"Standard Operating Procedures (SOP), statutory inspection gating, concrete & steel testing protocols, and complete operational guidelines covering every module in the Jay-QMS platform."})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0 no-print",children:[e.jsxs("button",{onClick:D,className:"flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition shadow-sm",title:"Print entire manual or Save as PDF",children:[e.jsx(se,{className:"w-4 h-4 text-amber-400"}),e.jsx("span",{children:"Print Manual"})]}),e.jsxs("div",{className:"hidden sm:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-[11px]",children:[e.jsx("button",{onClick:L,className:"px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 font-semibold transition",children:"Expand All"}),e.jsx("button",{onClick:I,className:"px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 font-semibold transition",children:"Collapse All"})]})]})]}),e.jsxs("div",{className:"mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"font-semibold text-slate-300",children:"Entity:"})," ",c,e.jsx("span",{className:"text-slate-600",children:"|"}),e.jsx("span",{className:"font-semibold text-slate-300",children:"HQ:"})," ",r]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"font-semibold text-slate-300",children:"QA/QC Engineer:"})," ",m,e.jsx("span",{className:"text-slate-600",children:"|"}),e.jsx("span",{className:"font-semibold text-slate-300",children:"Project:"})," ",(o==null?void 0:o.name)||"Global"]})]})]}),e.jsx($,{items:[{label:"Inspection & Test Plans (ITP)",path:"/project/itp",icon:P},{label:"Material Approvals (MAR)",path:"/project/mar",icon:ae},{label:"Requests for Information (RFI)",path:"/project/rfi",icon:ie},{label:"Method Statements (RAMS)",path:"/project/method-statements",icon:re},{label:"QA/QC SOP Manual",path:"/project/qaqc-handbook",icon:b}]}),e.jsxs("div",{className:"p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md no-print",children:[e.jsxs("div",{className:"relative w-full md:w-80",children:[e.jsx(ne,{className:"w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"}),e.jsx("input",{type:"text",value:f,onChange:t=>A(t.target.value),placeholder:"Search chapters, standards, slump, PTP...",className:"w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"})]}),e.jsx("div",{className:"flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-thin",children:O.map(t=>e.jsx("button",{onClick:()=>M(t),className:`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${g===t?"bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20":"bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`,children:t},t))})]}),e.jsx("div",{className:"space-y-4",children:C.length===0?e.jsxs("div",{className:"p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-2",children:[e.jsx(b,{className:"w-8 h-8 text-slate-500 mx-auto"}),e.jsx("p",{className:"text-sm font-semibold text-slate-300",children:"No matching handbook chapters found"}),e.jsx("p",{className:"text-xs text-slate-500",children:"Try adjusting your search query or switching category filter."})]}):C.map(t=>{const n=t.icon,p=!!E[t.id];return e.jsxs("div",{className:"rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg overflow-hidden transition hover:border-slate-700/80",children:[e.jsxs("div",{onClick:()=>Q(t.id),className:"p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer select-none bg-slate-900 hover:bg-slate-850 transition",children:[e.jsxs("div",{className:"flex items-start sm:items-center gap-3.5 min-w-0",children:[e.jsx("div",{className:"p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0",children:e.jsx(n,{className:"w-5 h-5"})}),e.jsxs("div",{className:"min-w-0",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-2 mb-0.5",children:[e.jsx("span",{className:"px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono font-bold uppercase",children:t.category}),t.badge&&e.jsx("span",{className:"px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20",children:t.badge})]}),e.jsx("h3",{className:"font-extrabold text-white text-sm sm:text-base tracking-tight truncate",children:t.title}),e.jsx("p",{className:"text-xs text-slate-400 line-clamp-1 mt-0.5",children:t.summary})]})]}),e.jsxs("div",{className:"flex items-center gap-3 shrink-0 no-print",children:[t.quickLink&&e.jsxs("button",{onClick:N=>{N.stopPropagation(),a(t.quickLink)},className:"hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-xs font-bold transition border border-slate-700 hover:border-amber-400",title:t.quickLinkLabel,children:[e.jsx("span",{children:t.quickLinkLabel||"Open Module"}),e.jsx(R,{className:"w-3.5 h-3.5"})]}),e.jsx("button",{className:"p-1 rounded-xl text-slate-400 hover:text-white transition","aria-label":p?"Collapse chapter":"Expand chapter",children:p?e.jsx(le,{className:"w-5 h-5 text-amber-400"}):e.jsx(oe,{className:"w-5 h-5 text-slate-500"})})]})]}),p&&e.jsxs("div",{className:"p-4 sm:p-6 border-t border-slate-800 bg-slate-950/60 animate-in fade-in duration-200",children:[t.content,t.quickLink&&e.jsxs("div",{className:"mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between no-print",children:[e.jsx("span",{className:"text-[11px] text-slate-400",children:"Direct system module shortcut:"}),e.jsxs("button",{onClick:()=>a(t.quickLink),className:"flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-md shadow-amber-500/20",children:[e.jsx("span",{children:t.quickLinkLabel||"Launch Module"}),e.jsx(R,{className:"w-3.5 h-3.5"})]})]})]})]},t.id)})}),e.jsxs("div",{className:"p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(b,{className:"w-4 h-4 text-amber-400 shrink-0"}),e.jsx("span",{children:"Need updates to QA/QC specifications or new ITP templates added to the manual?"})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsxs("span",{className:"text-slate-300 font-mono text-[11px]",children:["QA/QC Desk: ",d]}),e.jsx("span",{className:"text-slate-600",children:"|"}),e.jsx("span",{className:"text-amber-400 font-mono text-[11px]",children:x})]})]}),e.jsx("style",{children:`
        @media print {
          .no-print, header, nav, aside {
            display: none !important;
          }
          body, html {
            background: #ffffff !important;
            color: #0f172a !important;
          }
        }
      `})]}):e.jsx("div",{className:"min-h-[80vh] flex items-center justify-center p-4",children:e.jsxs("div",{className:"max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-red-800/40 text-center shadow-2xl space-y-4 animate-in fade-in",children:[e.jsx("div",{className:"w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-500/10",children:e.jsx(te,{className:"w-8 h-8"})}),e.jsxs("div",{className:"space-y-1",children:[e.jsx("span",{className:"px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-mono text-[11px] font-extrabold uppercase tracking-wider",children:"Restricted Area"}),e.jsx("h2",{className:"text-xl font-black text-white",children:"QA/QC Personnel Only"})]}),e.jsxs("p",{className:"text-xs text-slate-400 leading-relaxed",children:["The ",e.jsx("strong",{children:"QA/QC Field Manual & System Instruction Booklet"})," contains proprietary testing standards, statutory audit procedures, and inspection gating controls reserved strictly for Quality Assurance & Quality Control engineers."]}),e.jsxs("div",{className:"p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 text-left",children:[e.jsxs("div",{children:[e.jsx("strong",{children:"Logged in as:"})," ",(i==null?void 0:i.fullName)||"Guest"]}),e.jsxs("div",{children:[e.jsx("strong",{children:"Active Role:"})," ",i!=null&&i.role?_[i.role]:"Standard User"]})]}),e.jsx("div",{className:"pt-2",children:e.jsx("button",{onClick:()=>a("/project/dashboard"),className:"w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition shadow-md",children:"Return to Project Dashboard"})})]})})};export{ve as QAQCHandbookPage,ve as default};
