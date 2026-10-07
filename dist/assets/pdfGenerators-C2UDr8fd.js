import{h as Xt}from"./html2pdf-CpttaISV.js";import{c as Bt}from"./permitChecklist-BHE5VmmF.js";import"./vendor-pdf-D15HUmNk.js";import{r as X,u as Zt}from"./index-BWbEtKwo.js";import{j as at}from"./vendor-three-lc7nvFJG.js";import{h as te,b2 as ee,ag as ie,S as ae,bh as se,af as ne,O as oe}from"./vendor-icons-BdJZFKPy.js";import"./jspdf.plugin.autotable-CTCpbugc.js";function jt(t){if(!t||!t.trim())return[];const p=t.trim(),x=new RegExp("(?:^|\\n+|(?<=[.!?]\\s+)|(?<=\\b))((?:Dimensional\\s+Non-Conformance|Dimensional\\s+Check|Dimensional\\s+Defect|Non-Conformance|Defect\\s+Notice|Material\\s+Defect|Defects?|Discrepancy|Discrepancies|Operational\\s+Impact|Structural\\s+Impact|Engineering\\s+Impact|Risk\\s+Assessment|Safety\\s+Impact|Technical\\s+Impact|Management\\s+Directive|Executive\\s+Directive|Management\\s+Override|Management\\s+Instruction|Director'?s?\\s+Override|Director'?s?\\s+Directive|Executive\\s+Instruction|Site\\s+Instruction|Liability\\s+Disclaimer|Disclaimer|Warranty\\s+Notice|Indemnity\\s+Clause|Indemnity|Legal\\s+Notice|Corrective\\s+Action|Mandatory\\s+Action|Action\\s+Required|Remedial\\s+Action|Resolution|Mitigation|Technical\\s+Evaluation|Technical\\s+Justification|Specification\\s+Reference|QA\\/QC\\s+Observation|Inspector\\s+Notes?|Notes?|Special\\s+Instructions?|Caveats?|Conditions?|Observations?|Root\\s+Cause|Justification|Disposition\\s+Notice|Testing\\s+Conditions?))(?:\\s*:\\s*|\\s*—\\s*|\\s*-\\s*)","gi"),f=Array.from(p.matchAll(x));if(f.length>=1){const h=[],g=f[0].index??0;if(g>0){const n=p.substring(0,g).trim();n&&h.push({category:"standard",header:"",content:n})}for(let n=0;n<f.length;n++){const v=f[n],s=v.index??0,u=v[0],N=v[1].trim(),I=f[n+1],A=I?I.index??p.length:p.length,c=p.substring(s+u.length,A).trim(),i=N.toLowerCase();let b="standard";i.includes("non-conformance")||i.includes("defect")||i.includes("discrepanc")?b="defect":i.includes("impact")||i.includes("risk")||i.includes("safety")?b="impact":i.includes("directive")||i.includes("override")||i.includes("instruction")?b="directive":i.includes("disclaimer")||i.includes("liability")||i.includes("indemnity")||i.includes("warranty")||i.includes("legal")?b="disclaimer":i.includes("action")||i.includes("remedial")||i.includes("corrective")||i.includes("resolution")||i.includes("mitigation")?b="action":(i.includes("note")||i.includes("observation")||i.includes("condition")||i.includes("caveat")||i.includes("evaluation")||i.includes("justification")||i.includes("root cause"))&&(b="note"),h.push({category:b,header:N,content:c})}return h}const y=p.split(/\n\s*\n|\r\n\s*\r\n|\n/).map(h=>h.trim()).filter(Boolean);return y.length===0?[{category:"standard",header:"",content:p}]:y.map(h=>{const g=h.match(/^([A-Za-z0-9\s/&'_-]{3,45}):\s+(.+)$/s);if(g){const n=g[1].trim(),v=g[2].trim(),s=n.toLowerCase();let u="note";return s.includes("defect")||s.includes("non-conformance")||s.includes("fail")||s.includes("error")||s.includes("discrepanc")?u="defect":s.includes("impact")||s.includes("risk")||s.includes("safety")?u="impact":s.includes("directive")||s.includes("override")||s.includes("instruction")?u="directive":s.includes("disclaimer")||s.includes("liability")||s.includes("indemnity")?u="disclaimer":(s.includes("action")||s.includes("required")||s.includes("remed"))&&(u="action"),{category:u,header:n,content:v}}return{category:"standard",header:"",content:h}})}function zt(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function Ut(t,p="No inspection observations or notes recorded."){const x=jt(t);return x.length===0?`<div style="font-size: 8px; color: #64748b; font-style: italic; line-height: 1.4;">${zt(p)}</div>`:x.length===1&&!x[0].header?`<div style="font-size: 8px; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">${zt(x[0].content)}</div>`:`
    <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
      ${x.map(f=>{let y="#f8fafc",h="#cbd5e1",g="3.5px solid #64748b",n="#e2e8f0",v="#334155",s="#cbd5e1";switch(f.category){case"defect":y="#fff5f5",h="#fecaca",g="3.5px solid #dc2626",n="#fee2e2",v="#991b1b",s="#fca5a5";break;case"impact":y="#fffbeb",h="#fef08a",g="3.5px solid #d97706",n="#fef3c7",v="#92400e",s="#fcd34d";break;case"directive":y="#faf5ff",h="#e9d5ff",g="3.5px solid #7c3aed",n="#f3e8ff",v="#581c87",s="#d8b4fe";break;case"disclaimer":y="#f8fafc",h="#cbd5e1",g="3.5px solid #334155",n="#e2e8f0",v="#0f172a",s="#94a3b8";break;case"action":y="#f0fdf4",h="#bbf7d0",g="3.5px solid #16a34a",n="#dcfce7",v="#166534",s="#86efac";break;case"note":y="#f0f9ff",h="#bae6fd",g="3.5px solid #0284c7",n="#e0f2fe",v="#0369a1",s="#7dd3fc";break;default:y="#ffffff",h="#e2e8f0",g="3px solid #94a3b8",n="#f1f5f9",v="#475569",s="#cbd5e1";break}return`
            <div style="background: ${y}; border: 1px solid ${h}; border-left: ${g}; border-radius: 4px; padding: 6px 8px; box-sizing: border-box; page-break-inside: avoid; break-inside: avoid;">
              ${f.header?`
                <div style="margin-bottom: 3.5px; display: flex; align-items: center; gap: 6px;">
                  <span style="display: inline-block; padding: 1.5px 6px; background: ${n}; color: ${v}; border: 1px solid ${s}; border-radius: 3px; font-weight: 800; font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.4px;">
                    ${zt(f.header)}
                  </span>
                </div>
              `:""}
              <div style="font-size: 8px; color: #1e293b; line-height: 1.5; white-space: pre-wrap; font-weight: ${f.category==="defect"||f.category==="directive"?"600":"400"};">
                ${zt(f.content)}
              </div>
            </div>
          `}).join("")}
    </div>
  `}const xe=({text:t,fallback:p="No observations or details recorded.",className:x="",defaultCategory:f})=>{const y=jt(t);return y.length===0?at.jsx("div",{className:`p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 italic text-xs ${x}`,children:p}):(y.length===1&&!y[0].header&&f&&(y[0].category=f),at.jsx("div",{className:`space-y-2.5 ${x}`,children:y.map((h,g)=>{let n="bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 border-l-4 border-l-slate-500",v="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",s=te;switch(h.category){case"defect":n="bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200 border-l-4 border-l-red-600",v="bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 border-red-300 dark:border-red-800",s=oe;break;case"impact":n="bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 border-l-4 border-l-amber-500",v="bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800",s=ne;break;case"directive":n="bg-purple-50/80 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/60 text-purple-900 dark:text-purple-200 border-l-4 border-l-purple-600",v="bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-800",s=se;break;case"disclaimer":n="bg-slate-100/90 dark:bg-slate-900/90 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 border-l-4 border-l-slate-700 dark:border-l-slate-400",v="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-400 dark:border-slate-600",s=ae;break;case"action":n="bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-l-4 border-l-emerald-600",v="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800",s=ie;break;case"note":n="bg-sky-50/80 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/60 text-sky-900 dark:text-sky-200 border-l-4 border-l-sky-500",v="bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-800",s=ee;break}return at.jsxs("div",{className:`p-3.5 rounded-xl border shadow-sm transition ${n}`,children:[h.header&&at.jsx("div",{className:"flex items-center gap-2 mb-1.5",children:at.jsxs("span",{className:`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border font-mono ${v}`,children:[at.jsx(s,{className:"w-3 h-3 shrink-0"}),at.jsx("span",{children:h.header})]})}),at.jsx("p",{className:"text-xs leading-relaxed whitespace-pre-wrap font-medium",children:h.content})]},g)})}))},de=`
  * { box-sizing: border-box; }
  @page {
    size: A4 portrait;
    margin: 10mm 10mm 12mm 10mm;
    @bottom-left {
      content: "CONFIDENTIAL & PROPRIETARY";
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
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
    .no-print { display: none !important; }
  }
  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    font-size: 8.5px;
    color: #0f172a;
    margin: 0;
    line-height: 1.35;
    background: #ffffff;
  }
  .page-container {
    width: 100%;
    max-width: 190mm;
    margin: 0 auto;
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
`;function Z(t,p,x=""){const f=window.open("","_blank");if(!f){alert("Please allow popups to generate and print the quality document.");return}const y=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${t}</title>
  <style>
    ${de}
    ${x}
  </style>
</head>
<body>
  <div class="page-container">
    ${p}
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
  <\/script>
</body>
</html>`;f.document.open(),f.document.write(y),f.document.close()}const $=t=>{if(!t||t==="—")return"—";const p=t instanceof Date?t:new Date(t);return isNaN(p.getTime())?String(t):p.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})};function be(t,p={},x={}){var A;const f=x.name,y=p.name,h=t.ptpNumber||`PTP-${Math.floor(1e3+Math.random()*9e3)}`,g=((A=t.checklistItems)!=null&&A.length?t.checklistItems:Bt()).map((c,i)=>{var b;return{cat:c.category||"General",param:c.label,status:c.status||(i===0&&((b=t.checklist)!=null&&b.rebarInspectionApproved),"PASS")}});(t.stakeholders||[]).filter(c=>c.required);const n=t.status==="REJECTED",s=(()=>{if(n)return[{role:"QA/QC Engineer",name:t.issuedByName,required:!0}];if(t.stakeholders&&t.stakeholders.length>0)return t.stakeholders;const c=t.requiredSignoffs,i=[{role:"QA/QC Engineer",name:t.issuedByName,required:!0}];return(!c||c.siteManager!==!1)&&i.push({role:"Site / Construction Manager",name:"",required:!0}),(!c||c.structuralConsultant!==!1)&&i.push({role:"Structural Consultant / Engineer",name:"",required:!0}),c!=null&&c.mechanicalEngineer&&i.push({role:"Mechanical Engineer",name:"",required:!1}),c!=null&&c.electricalEngineer&&i.push({role:"Electrical Engineer",name:"",required:!1}),i})(),u=t,N=`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${u.permitNumber} - Permit To Pour (PTP)</title>
      <style>
        * { box-sizing: border-box; }
        
        @page {
          size: A4 portrait;
          margin: 10mm 10mm 12mm 10mm;
          @bottom-left {
            content: "CONFIDENTIAL & PROPRIETARY — ${f}";
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
          border-left: 3px solid ${n?"#dc2626":"#ea580c"};
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
            ${X(x,p)}
          </td>
          <td style="width: 55%;">
            <div class="header-title">Official Permit To Pour (PTP) Authorization</div>
            <div class="header-sub">PROJECT: ${y}</div>
          </td>
          <td style="width: 25%;" class="meta-box">
            <strong>PTP Ref:</strong> <span style="color:#ea580c; font-weight:700;">${u.permitNumber}</span><br/>
            <strong>Scheduled Pour:</strong> ${$(u.pourDate)} (${u.pourTime})<br/>
            <strong>Status:</strong> <span class="${n?"status-rejected":"status-issued"}">${u.status||"ISSUED"}</span>
          </td>
        </tr>
      </table>

      ${n?`<div class="rejection-notice">
              <strong>POUR NOT PERMITTED:</strong> This Permit to Pour has been REJECTED due to failed hold point checks. Concrete casting is strictly prohibited. Corrective actions must be completed before re-inspection and re-issuance.
             </div>`:""}

      <div class="pdf-section">
        <div class="section-title">1.0 Structural Element & Location Parameters</div>
        <table class="section-table">
          <tr>
            <td class="lbl" style="width: 18%;">Building / Block:</td>
            <td class="val" style="width: 32%;">${u.building||"Main Structure"}</td>
            <td class="lbl" style="width: 18%;">Level / Floor:</td>
            <td class="val" style="width: 32%;">${u.floor||"—"}</td>
          </tr>
          <tr>
            <td class="lbl">Structural Element:</td>
            <td class="val"><strong>${u.elementName} ${u.elementId?`: ${u.elementId}`:""}</strong></td>
            <td class="lbl">Grid Axis / Zone:</td>
            <td class="val">${u.elementRef||u.zone||"—"}</td>
          </tr>
        </table>
      </div>

      <div class="pdf-section">
        <div class="section-title">2.0 Concrete Mix Specifications & Batching Logistics</div>
        <table class="section-table">
          <tr>
            <td class="lbl" style="width: 18%;">Specified Grade:</td>
            <td class="val" style="width: 32%;"><strong>${u.concreteGrade}</strong></td>
            <td class="lbl" style="width: 18%;">Est. Volume:</td>
            <td class="val" style="width: 32%;"><strong>${u.estimatedVolume} m³</strong></td>
          </tr>
          <tr>
            <td class="lbl">Batching Plant:</td>
            <td class="val">${u.supplier||"Approved Ready-Mix Supplier"}</td>
            <td class="lbl">Inspected By:</td>
            <td class="val">${u.issuedByName} (QA/QC Engineer)</td>
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
            ${g.map((c,i)=>`
              <tr>
                <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #64748b;">${i+1}</td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center;">
                  <span style="font-weight: 800; font-size: 8px; padding: 1px 4px; border-radius: 2px; ${c.status==="PASS"?"background: #dcfce7; color: #15803d;":c.status==="FAIL"?"background: #fee2e2; color: #b91c1c;":"background: #f1f5f9; color: #64748b;"}">${c.status}</span>
                </td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 700; color: #334155;">${c.cat}</td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 500; color: #0f172a;">${c.param}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="pdf-section">
        <div class="section-title">4.0 Statutory Authorizations & Stakeholder Sign-Off Block</div>
        <table class="section-table" style="margin-top: 4px;">
          ${s.reduce((c,i,b)=>{if(b%2===0){const r=s[b+1],m=I(i),o=r?I(r):'<td style="width: 50%; height: 75px; background: #fafafa; border: 1px dashed #cbd5e1;"></td>';c+=`<tr>${m}${o}</tr>`}return c},"")}
        </table>
      </div>

      <div class="footer-fallback">
        <span>CONFIDENTIAL — ${f}</span>
        <span>PTP Ref: ${u.permitNumber}</span>
      </div>

      <script>
        window.onload = () => {
          window.print();
        };
      <\/script>
    </body>
    </html>
  `;function I(c){const i=c.required?"#15803d":"#64748b",b=c.required?"REQUIRED":"OPTIONAL";return`
      <td style="width: 50%; height: 75px; vertical-align: top; padding: 6px 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span style="font-weight: 700; font-size: 8px; text-transform: uppercase; color: #ea580c;">${c.designation?`${c.designation} <span style="font-size: 7px; color: #64748b; font-weight: normal;">(${c.role})</span>`:c.role}</span>
          <span style="font-size: 6px; font-weight: 700; background: ${i}15; color: ${i}; padding: 1px 3px; border-radius: 2px;">${b}</span>
        </div>
        <div style="font-size: 8px; margin-bottom: 8px;">Name: <strong>${c.name||"__________________________________________________"}</strong></div>
        <div style="font-size: 8px; display: flex; justify-content: space-between;">
          <span>Sign: ________________________</span>
          <span>Date: ____ / ____ / 20__</span>
        </div>
      </td>
    `}Z(`${h} - Permit to Pour`,N)}function ue(t,p={},x={}){var c;const f=x.name,y=p.companyName,h=t.ptpNumber||`PTP-${Math.floor(1e3+Math.random()*9e3)}`,g=((c=t.checklistItems)!=null&&c.length?t.checklistItems:Bt()).map((i,b)=>{var r;return{cat:i.category||"General",param:i.label,status:i.status||(b===0&&((r=t.checklist)!=null&&r.rebarInspectionApproved),"PASS")}}),n=t.status==="REJECTED",s=(()=>{if(n)return[{role:"QA/QC Engineer",name:t.issuedByName||"J. Oladejo",required:!0}];if(t.stakeholders&&t.stakeholders.length>0)return t.stakeholders.filter(r=>r.required);const i=t.requiredSignoffs,b=[{role:"QA/QC Engineer",name:t.issuedByName||"",required:!0}];return(!i||i.siteManager!==!1)&&b.push({role:"Site / Construction Manager",name:"",required:!0}),(!i||i.structuralConsultant!==!1)&&b.push({role:"Structural Consultant / Engineer",name:"",required:!0}),i!=null&&i.mechanicalEngineer&&b.push({role:"Mechanical Engineer",name:"",required:!0}),i!=null&&i.electricalEngineer&&b.push({role:"Electrical Engineer",name:"",required:!0}),b})(),u=`
    <div id="pdf-document" style="padding: 20px; font-family: Arial, sans-serif; color: #0f172a; background: #fff;">
      <!-- Header -->
      <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #0f172a; margin-bottom: 12px; background: #ffffff;">
        <tr>
          <td style="width: 22%; border: 1px solid #cbd5e1; padding: 6px; text-align: center; vertical-align: middle; background: #ffffff;">
            ${X(x,p)}
          </td>
          <td style="width: 53%; border: 1px solid #cbd5e1; padding: 6px; text-align: center; vertical-align: middle;">
            <div style="font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; color: #0f172a;">PERMIT TO POUR (PTP) AUTHORIZATION</div>
            <div style="font-size: 9.5px; font-weight: 700; color: #ea580c; margin-top: 2px; text-transform: uppercase;">PROJECT: ${y}</div>
            <div style="font-size: 7.5px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-top: 1px;">ISO 9001:2015 Clause 8.6 Release of Products & Services</div>
          </td>
          <td style="width: 25%; border: 1px solid #cbd5e1; padding: 6px; font-size: 8px; line-height: 1.5; color: #334155; vertical-align: middle;">
            <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${h}</span></div>
            <div><strong>Date:</strong> ${$(t.plannedPourDate)}</div>
            <div><strong>Status:</strong> <span style="display: inline-block; padding: 1px 6px; border-radius: 3px; font-weight: 800; font-size: 8px; text-transform: uppercase; ${n?"background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;":"background: #dcfce7; color: #15803d; border: 1px solid #86efac;"}">${t.status||"APPROVED"}</span></div>
          </td>
        </tr>
      </table>

      <!-- 1.0 Pour Parameters -->
      <div style="margin-bottom: 15px;">
        <div style="background: #1e293b; color: #fff; padding: 4px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase;">1.0 Concrete Casting Parameters & Specifications</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px; border: 1px solid #cbd5e1; margin-top: 4px;">
          <tr>
            <td style="padding: 5px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700; width: 20%;">STRUCTURAL ELEMENT:</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0; width: 30%;"><strong>${t.elementName}</strong></td>
            <td style="padding: 5px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700; width: 20%;">CONCRETE GRADE:</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0; width: 30%;"><strong>${t.concreteGrade}</strong></td>
          </tr>
          <tr>
            <td style="padding: 5px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700;">LOCATION / LEVEL:</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0;">${t.levelName}</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700;">ESTIMATED VOLUME:</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0;">${t.targetVolumeM3} m³</td>
          </tr>
          <tr>
            <td style="padding: 5px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700;">GRID AXIS / ZONE:</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0;">${t.gridAxis||t.grid||"—"}</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700;">TARGET SLUMP:</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0;">${t.slumpTargetMm} mm</td>
          </tr>
          <tr>
            <td style="padding: 5px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700;">BATCHING PLANT / SUPPLIER:</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0;">${t.batchingPlant||t.supplierBatchPlant||"Approved Ready-Mix Plant"}</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0; background: #f8fafc; font-weight: 700;">PLANNED POUR TIME:</td>
            <td style="padding: 5px; border: 1px solid #e2e8f0;">${t.plannedPourTime||"08:00 AM"}</td>
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
            ${g.map((i,b)=>`
              <tr>
                <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #64748b;">${b+1}</td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center;">
                  <span style="font-weight: 800; font-size: 8px; padding: 1px 4px; border-radius: 2px; ${i.status==="PASS"?"background: #dcfce7; color: #15803d;":i.status==="FAIL"?"background: #fee2e2; color: #b91c1c;":"background: #f1f5f9; color: #64748b;"}">${i.status}</span>
                </td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 700; color: #334155;">${i.cat}</td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 500; color: #0f172a;">${i.param}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <!-- 3.0 Statutory Sign-Off -->
      <div style="margin-bottom: 15px;">
        <div style="font-size: 11px; font-weight: 700; margin-bottom: 4px;">3.0 Statutory Authorizations & Stakeholder Sign-Off Block</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px; border: 1px solid #cbd5e1;">
          ${s.reduce((i,b,r)=>{if(r%2===0){const m=s[r+1],o=N(b),l=m?N(m):'<td style="width: 50%; height: 70px; background: #fafafa; border: 1px solid #e2e8f0;"></td>';i+=`<tr>${o}${l}</tr>`}return i},"")}
        </table>
      </div>

      <!-- Footer -->
      <div style="font-size: 8px; color: #64748b; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 5px; margin-top: 10px;">
        <div>CONFIDENTIAL & PROPRIETARY — ${f}</div>
        <div>Doc Ref: ${h}</div>
      </div>
    </div>
  `;function N(i){const b=i.required?"#15803d":"#64748b",r=i.required?"REQUIRED":"OPTIONAL";return`
      <td style="width: 50%; height: 70px; vertical-align: top; padding: 6px 8px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span style="font-weight: 700; font-size: 8px; text-transform: uppercase; color: #ea580c;">${i.designation?`${i.designation} <span style="font-size: 7px; color: #64748b; font-weight: normal;">(${i.role})</span>`:i.role}</span>
          <span style="font-size: 6px; font-weight: 700; background: ${b}15; color: ${b}; padding: 1px 3px; border-radius: 2px;">${r}</span>
        </div>
        <div style="font-size: 8px; margin-bottom: 8px;">Name: <strong>${i.name||"__________________________________________________"}</strong></div>
        <div style="font-size: 8px; display: flex; justify-content: space-between;">
          <span>Sign: ________________________</span>
          <span>Date: ____ / ____ / 20__</span>
        </div>
      </td>
    `}const I=document.createElement("div");I.innerHTML=u,document.body.appendChild(I);const A={margin:[10,10,10,10],filename:`${h}_PermitToPour.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:!0,logging:!1},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"}};Xt().set(A).from(I).toPdf().get("pdf").then(i=>{const b=i.internal.getNumberOfPages();for(let r=1;r<=b;r++)i.setPage(r),i.setFont("helvetica","normal"),i.setFontSize(6.5),i.setTextColor(100,116,139),i.text(`CONFIDENTIAL & PROPRIETARY — ${f}`,10,291),i.text(`PTP Ref: ${t.permitNumber}  |  Page ${r} of ${b}`,200,291,{align:"right"});i.save(`${h}.pdf`)}).catch(i=>{console.error("PDF generation failed:",i)}).finally(()=>{document.body.removeChild(I)})}function re(t,p={},x={}){var c,i,b;const f=x.name||"Collection Developments LTD",y=p.name||"Bankside",h=t.inspectionNumber||`INSP-2026-${Math.floor(1e3+Math.random()*9e3)}`,g=t.items||[],n=g.filter(r=>r.result==="PASS").length,v=g.filter(r=>r.result==="FAIL").length,s=g.filter(r=>r.result==="OBSERVATION").length,N=(r=>{switch(r==null?void 0:r.toUpperCase()){case"APPROVED":case"CLOSED":return{bg:"#dcfce7",text:"#15803d",border:"#86efac"};case"PENDING_REVIEW":return{bg:"#fef3c7",text:"#b45309",border:"#fcd34d"};case"REJECTED":return{bg:"#fee2e2",text:"#b91c1c",border:"#fca5a5"};default:return{bg:"#f1f5f9",text:"#334155",border:"#cbd5e1"}}})(t.status),I=t.stakeholders&&t.stakeholders.length>0?t.stakeholders.filter(r=>r.required!==!1):[{role:"QA/QC Inspector",name:((c=t.inspector)==null?void 0:c.name)||t.inspectorName||"QA/QC Inspector",designation:((i=t.inspector)==null?void 0:i.designation)||"QA/QC Inspector",required:!0,signed:t.status==="APPROVED"||t.status==="CLOSED",signedAt:t.approvedAt?new Date(t.approvedAt).toISOString():void 0},{role:"Site / Construction Engineer",name:t.subcontractorRepresentative||"Site Engineer",designation:"Site Engineer",required:!0,signed:!1},{role:"Consultant / Resident Engineer",name:t.consultantRepresentative||"Resident Engineer",designation:"Consultant",required:!0,signed:!1}],A=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${X(x,p)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">FIELD INSPECTION & VERIFICATION REPORT</div>
          <div class="header-title-project">PROJECT: ${y}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.6 Monitoring & Measurement of Processes</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${h}</span></div>
          <div><strong>Date:</strong> ${$(t.scheduledDate||t.createdAt)}</div>
          <div><strong>Status:</strong> <span class="status-badge" style="background:${N.bg}; color:${N.text}; border:1px solid ${N.border};">${t.status||"DRAFT"}</span></div>
        </td>
      </tr>
    </table>

    <!-- 1.0 Inspection Parameters -->
    <div class="pdf-section">
      <div class="section-banner">1.0 INSPECTION PROTOCOL PARAMETERS & LOCATION</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 20%;">STRUCTURAL ELEMENT:</td>
          <td class="grid-value" style="width: 30%;"><strong>${t.elementName||t.element||"Structural Member"}</strong></td>
          <td class="grid-label" style="width: 20%;">STAGE / DISCIPLINE:</td>
          <td class="grid-value" style="width: 30%;"><strong>${t.stage}</strong> (${t.trade||"Structural"})</td>
        </tr>
        <tr>
          <td class="grid-label">LOCATION / LEVEL:</td>
          <td class="grid-value">${t.levelName||t.floor||"All Levels"}</td>
          <td class="grid-label">QUALITY SCORE:</td>
          <td class="grid-value" style="font-weight: 800; color: ${t.qualityScore&&t.qualityScore>=90?"#15803d":"#ea580c"};">${t.qualityScore||100}% (Pass Target: ${t.passScore||100}%)</td>
        </tr>
        <tr>
          <td class="grid-label">GRID AXIS / ZONE:</td>
          <td class="grid-value">${t.zone||"—"}</td>
          <td class="grid-label">EXECUTING CONTRACTOR:</td>
          <td class="grid-value">${t.contractor||"Main Contractor"}</td>
        </tr>
        <tr>
          <td class="grid-label">TEMPLATE ALIGNMENT:</td>
          <td class="grid-value">${t.templateName}</td>
          <td class="grid-label">QA/QC INSPECTOR:</td>
          <td class="grid-value"><strong>${((b=t.inspector)==null?void 0:b.name)||t.inspectorName||"QA/QC Inspector"}</strong></td>
        </tr>
      </table>
    </div>

    <!-- 2.0 Hold Point Verification Checklist -->
    <div class="pdf-section">
      <div class="section-banner">2.0 TECHNICAL VERIFICATION CHECKPOINTS (${g.length} ITEMS | ${n} PASS, ${v} FAIL, ${s} OBS)</div>
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
          ${g.length>0?g.map((r,m)=>`
            <tr>
              <td style="text-align: center; font-weight: 700; color: #64748b;">${m+1}</td>
              <td style="text-align: center;">
                <span class="${r.result==="PASS"?"badge-pass":r.result==="FAIL"?"badge-fail":r.result==="OBSERVATION"?"badge-observation":"badge-na"}">${r.result||"PENDING"}</span>
              </td>
              <td style="font-weight: 700; color: #334155;">
                ${r.category||r.discipline||"Structural"}
                ${r.critical?'<br/><span class="badge-fail" style="font-size:6.5px; padding:0 3px;">CRITICAL</span>':""}
                ${r.isHoldPoint?'<br/><span class="badge-hold" style="font-size:6.5px; padding:0 3px;">HOLD POINT</span>':""}
              </td>
              <td>
                <div style="font-weight: 600; color: #0f172a;">${r.label}</div>
                ${r.acceptanceCriteria?`<div style="font-size: 7px; color: #64748b; margin-top: 1px; italic">Criteria: ${r.acceptanceCriteria}</div>`:""}
              </td>
              <td style="font-size: 7.2px; color: #475569;">${r.remarks||"—"}</td>
            </tr>
          `).join(""):`
            <tr>
              <td colspan="5" style="text-align: center; color: #64748b; padding: 10px;">No checklist parameters logged.</td>
            </tr>
          `}
        </tbody>
      </table>
    </div>

    <!-- 3.0 Photographic Records if any -->
    ${g.some(r=>r.photos&&r.photos.length>0)?`
    <div class="pdf-section">
      <div class="section-banner">3.0 PHOTOGRAPHIC VERIFICATION RECORDS</div>
      <div class="photo-grid">
        ${g.flatMap(r=>(r.photos||[]).map(m=>({url:m,label:r.label}))).map((r,m)=>`
          <div class="photo-card">
            <span class="photo-tag">Photo #${m+1}</span>
            <div><img src="${r.url}" alt="Inspection Evidence" /></div>
            <div class="photo-caption">${r.label}</div>
          </div>
        `).join("")}
      </div>
    </div>
    `:""}

    <!-- 4.0 Statutory Sign-Off -->
    <div class="pdf-section">
      <div class="section-banner">4.0 STATUTORY WITNESS & VERIFICATION SIGN-OFF</div>
      <table class="signoff-table">
        ${(()=>{let r="";for(let o=0;o<I.length;o+=3){const l=I.slice(o,o+3),R=(100/Math.max(l.length,1)).toFixed(2);r+=`<tr>${l.map(E=>`
              <td style="width: ${R}%; vertical-align: top; padding: 6px 8px; border: 1px solid #cbd5e1; background: ${E.signed?"#f0fdf4":"#fafafa"};">
                <div class="sig-role-header">
                  <span>${E.designation?`${E.designation} (${E.role})`:E.role}</span>
                  <span class="sig-required-tag" style="font-size: 6.5px; font-weight: 700; background: ${E.required?"#dcfce7":"#f1f5f9"}; color: ${E.required?"#15803d":"#64748b"}; padding: 1px 4px; border-radius: 2px;">
                    ${E.required?"REQUIRED":"OPTIONAL"}
                  </span>
                </div>
                <div style="font-size: 8px; color: #334155; margin-bottom: 4px;">
                  Name: <strong>${E.name||"________________________"}</strong>
                </div>
                <div class="sig-line" style="border-bottom: 1px dashed #cbd5e1; margin: 4px 0;"></div>
                <div style="display: flex; justify-content: space-between; font-size: 7.2px; color: #64748b; margin-top: 3px;">
                  <span>${E.signed?'<strong style="color: #15803d;">✓ Digitally Signed</strong>':"Sign: ___________________"}</span>
                  <span>Date: ${E.signed&&E.signedAt?$(E.signedAt):E.signed?$(t.scheduledDate||t.createdAt):"____/____/20__"}</span>
                </div>
              </td>
            `).join("")}</tr>`}return r})()}
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${f}</div>
      <div>Inspection Ref: ${h}</div>
    </div>
  `;Z(`${h} - Inspection Report`,A)}const ve=re;function ye(t,p={},x={}){const f=x.name||t.companyName||"Collection Developments LTD",y=p.name||t.projectName||"Bankside",h=t.reportNumber||`QC-COMM-${Math.floor(1e3+Math.random()*9e3)}`,g=t.observations||[],n=g.filter(s=>s.status!=="CLOSED"&&s.status!=="Compliant"&&s.status!=="RECTIFIED").length,v=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${X(x,p)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">SITE COMMENTS & FIELD OBSERVATIONS REPORT</div>
          <div class="header-title-project">PROJECT: ${y}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.5 & 8.7 Nonconformity Identification</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${h}</span></div>
          <div><strong>Date:</strong> ${$(t.inspectionDate||t.createdAt)}</div>
          <div><strong>Status:</strong> <span class="${n===0?"badge-pass":"badge-pending"}">${n===0?"ALL CLOSED":`${n} ACTION(S) PENDING`}</span></div>
        </td>
      </tr>
    </table>

    <!-- 1.0 Report Overview -->
    <div class="pdf-section">
      <div class="section-banner">1.0 GENERAL REPORT PARAMETERS & AUDIT CONTEXT</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 18%;">Project Name:</td>
            <td class="grid-value" style="width: 32%;">${t.projectName}</td>
            <td class="grid-label" style="width: 18%;">Inspection Date:</td>
            <td class="grid-value" style="width: 32%;">${$(t.inspectionDate)}</td>
        </tr>
        <tr>
          <td class="grid-label">RAISED BY:</td>
          <td class="grid-value">${t.raisedByName||"All Site Levels / Structural Zones"}</td>
          <td class="grid-label">WEATHER / ENVIRONMENT:</td>
          <td class="grid-value">${t.weatherConditions||"Clear / Dry"}</td>
        </tr>
      </table>
    </div>

    <!-- 2.0 Observations Log -->
    <div class="pdf-section">
      <div class="section-banner">2.0 QUALITY OBSERVATIONS & CORRECTIVE DIRECTIVES (${g.length} OBSERVATIONS)</div>
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
          ${g.length>0?g.map((s,u)=>{const N=s.comments||s.observationText||s.fieldObservation||"—",I=s.correctiveDirective||"Rectify per approved engineering specifications.",A=s.status==="CLOSED"||s.status==="Compliant"||s.status==="RECTIFIED";return`
            <tr>
              <td style="text-align: center; font-weight: 700; color: #64748b;">${u+1}</td>
              <td>
                <div style="font-weight: 700; color: #0f172a;">${s.levelName||"Site Area"}</div>
                ${s.structuralElement?`<div style="font-size: 7.2px; font-weight: 600; color: #ea580c;">${s.structuralElement}</div>`:""}
                ${s.gridLocation?`<div style="font-size: 7px; color: #64748b;">Grid: ${s.gridLocation}</div>`:""}
                <div style="font-size: 7px; color: #475569; margin-top: 2px;"><strong>Trade:</strong> ${s.tradeName||s.trade||"Civil"}</div>
              </td>
              <td>
                <div style="font-size: 7.5px; color: #0f172a; margin-bottom: 3px;">
                  <strong style="color: #991b1b; text-transform: uppercase; font-size: 6.8px; display: block;">Observed Condition:</strong>
                  ${N}
                </div>
                <div style="font-size: 7.5px; color: #166534; margin-bottom: 3px;">
                  <strong style="color: #15803d; text-transform: uppercase; font-size: 6.8px; display: block;">Corrective Directive:</strong>
                  ${I}
                </div>
                <div style="font-size: 7px; color: #64748b;">
                  Assigned To: <strong>${s.assignedTo||s.assignedSubcontractor||"Contractor"}</strong>
                  ${s.dueDate?` | Target Due: ${$(s.dueDate)}`:""}
                </div>

                ${s.photos&&s.photos.length>0?`
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; padding-top: 3px; border-top: 1px dashed #cbd5e1;">
                  ${s.photos.map((c,i)=>{const b=typeof c=="string"?c:(c==null?void 0:c.url)||(c==null?void 0:c.thumbnailUrl);return b?`<img src="${b}" style="height: 50px; max-width: 80px; object-fit: cover; border-radius: 2px; border: 1px solid #cbd5e1;" alt="Photo ${i+1}" />`:""}).join("")}
                </div>
                `:""}
              </td>
              <td style="text-align: center;">
                <span class="${A?"badge-pass":"badge-pending"}">${s.status||"OPEN"}</span>
                <div style="margin-top: 2px;">
                  <span class="${s.severity==="CRITICAL"?"badge-fail":s.severity==="HIGH"?"badge-pending":"badge-pass"}" style="font-size: 6.5px;">${s.severity||"MEDIUM"}</span>
                </div>
              </td>
            </tr>
          `}).join(""):`
            <tr>
              <td colspan="4" style="text-align: center; color: #64748b; padding: 10px;">No observations logged in this report.</td>
            </tr>
          `}
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
            <div style="font-size: 8px; color: #334155;">Name: <strong>${t.raisedByName||"QA/QC Engineer"}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ______________________________________</span>
              <span>Date: ${$(t.inspectionDate||t.createdAt)}</span>
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
      <div>CONFIDENTIAL & PROPRIETARY — ${f}</div>
      <div>Report Ref: ${h}</div>
    </div>
  `;Z(`${h} - Site Comments`,v)}function Ee(t,p={},x={}){var n,v,s,u,N,I,A,c;const f=x.name||"Collection Developments LTD",y=p.name||"Bankside",h=t.rfiNumber||`RFI-2026-${Math.floor(1e3+Math.random()*9e3)}`,g=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${X(x,p)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">REQUEST FOR INFORMATION (RFI)</div>
          <div class="header-title-project">PROJECT: ${y}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.2 Design & Engineering Communications</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${h}</span></div>
          <div><strong>Date Raised:</strong> ${$(t.createdAt)}</div>
          <div><strong>Status:</strong> <span class="${t.status==="CLOSED"?"badge-pass":"badge-pending"}">${t.status||"SUBMITTED"}</span></div>
        </td>
      </tr>
    </table>

    <!-- 1.0 Parameters -->
    <div class="pdf-section">
      <div class="section-banner">1.0 TECHNICAL PARAMETERS & ENGINEERING CONTEXT</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 20%;">DISCIPLINE / TRADE:</td>
          <td class="grid-value" style="width: 30%;"><strong>${t.discipline||t.tradeName||"Structural Engineering"}</strong></td>
          <td class="grid-label" style="width: 20%;">PRIORITY:</td>
          <td class="grid-value" style="width: 30%;"><strong>${t.priority||"MEDIUM"}</strong></td>
        </tr>
        <tr>
          <td class="grid-label">DRAWING REFERENCE:</td>
          <td class="grid-value">${t.drawingReference||"—"}</td>
          <td class="grid-label">SPECIFICATION REF:</td>
          <td class="grid-value">${t.specReference||"—"}</td>
        </tr>
        <tr>
          <td class="grid-label">SCHEDULE IMPACT:</td>
          <td class="grid-value">${t.scheduleImpact?`YES (${t.scheduleDelayDays||0} Days)`:"NO IMPACT"}</td>
          <td class="grid-label">COST IMPACT:</td>
          <td class="grid-value">${t.costImpact?`YES (${t.costImpactEstimate?"£"+t.costImpactEstimate:"TBD"})`:"NO IMPACT"}</td>
        </tr>
        <tr>
          <td class="grid-label">RAISED BY:</td>
          <td class="grid-value">${((n=t.raisedBy)==null?void 0:n.name)||"Site Engineer"} (${((v=t.raisedBy)==null?void 0:v.role)||"Main Contractor"})</td>
          <td class="grid-label">ASSIGNED CONSULTANT:</td>
          <td class="grid-value"><strong>${t.assignedConsultant||"Lead Engineering Consultant"}</strong></td>
        </tr>
      </table>
    </div>

    <!-- 2.0 Question / Technical Clarification -->
    <div class="pdf-section">
      <div class="section-banner">2.0 TECHNICAL INQUIRY & CLARIFICATION SOUGHT</div>
      <div class="box-content">
        <div style="font-size: 9px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">Subject: ${t.title}</div>
        <div style="line-height: 1.45; color: #334155;">${t.question}</div>
      </div>
    </div>

    <!-- 3.0 Contractor's Proposed Solution -->
    <div class="pdf-section">
      <div class="section-banner">3.0 CONTRACTOR'S PROPOSED SOLUTION / ALTERNATIVE</div>
      <div class="box-content">
        <div style="line-height: 1.45; color: #334155;">${t.proposedSolution||"Awaiting consultant directive and technical instructions."}</div>
      </div>
    </div>

    <!-- 4.0 Consultant Response -->
    <div class="pdf-section">
      <div class="section-banner">4.0 CONSULTANT FORMAL RESPONSE & DIRECTIVE [${((s=t.response)==null?void 0:s.approvalStatus)||"UNDER REVIEW"}]</div>
      <div class="box-content">
        <div style="line-height: 1.45; color: #0f172a; margin-bottom: 6px;">
          ${((u=t.response)==null?void 0:u.responseText)||"Official response is currently being finalized by the engineering design consultant."}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #475569; border-top: 1px solid #f1f5f9; padding-top: 4px;">
          <span>Reviewed By: <strong>${((N=t.response)==null?void 0:N.responderName)||t.assignedConsultant||"Consultant"}</strong></span>
          <span>Response Date: <strong>${$((I=t.response)==null?void 0:I.responseDate)}</strong></span>
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
            <div style="font-size: 8px; color: #334155;">Name: <strong>${((A=t.raisedBy)==null?void 0:A.name)||"Lead Engineer"}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${$(t.createdAt)}</span>
            </div>
          </td>
          <td style="width: 50%;">
            <div class="sig-role-header"><span>CONSULTANT / LEAD ENGINEER</span><span class="sig-required-tag">REQUIRED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${t.assignedConsultant||"Lead Consultant"}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${$((c=t.response)==null?void 0:c.responseDate)}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${f}</div>
      <div>RFI Ref: ${h}</div>
    </div>
  `;Z(`${h} - Technical RFI`,g)}function Se(t,p={},x={}){var u,N,I,A,c;const f=x.name||"Collection Developments LTD",y=p.name||"Bankside",h=t.marNumber||`MAR-2026-${Math.floor(1e3+Math.random()*9e3)}`,g=t.submittedByName||(typeof t.submittedBy=="string"?t.submittedBy:"QA/QC Materials Lead"),n=((u=t.reviewedBy)==null?void 0:u.name)||((N=t.response)==null?void 0:N.respondedByName)||t.assignedConsultantName||"Materials Consultant",v=((I=t.reviewedBy)==null?void 0:I.date)||((A=t.response)==null?void 0:A.responseDate)||(t.updatedAt?$(t.updatedAt):$(t.createdAt)),s=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${X(x,p)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">MATERIAL APPROVAL REQUEST (MAR)</div>
          <div class="header-title-project">PROJECT: ${y}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.4 Control of Externally Provided Products & Services</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${h}</span></div>
          <div><strong>Date:</strong> ${$(t.createdAt)}</div>
          <div><strong>Status:</strong> <span class="${t.status==="APPROVED"?"badge-pass":t.status==="REJECTED"?"badge-fail":"badge-pending"}">${t.status||"SUBMITTED"}</span></div>
        </td>
      </tr>
    </table>

    <!-- 1.0 Parameters -->
    <div class="pdf-section">
      <div class="section-banner">1.0 MATERIAL SPECIFICATION & SUPPLIER DETAILS</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 20%;">MATERIAL DESCRIPTION:</td>
          <td class="grid-value" style="width: 30%;"><strong>${t.technicalDescription||t.title}</strong></td>
          <td class="grid-label" style="width: 20%;">DISCIPLINE / TRADE:</td>
          <td class="grid-value" style="width: 30%;"><strong>${t.tradeName||t.trade||"Structural / Civil"}</strong></td>
        </tr>
        <tr>
          <td class="grid-label">MANUFACTURER / SUPPLIER:</td>
          <td class="grid-value">${t.manufacturer||t.supplierVendor||"Approved Vendor"}</td>
          <td class="grid-label">SUPPLIER / VENDOR:</td>
          <td class="grid-value">${t.supplierVendor||"Project Approved Source"}</td>
        </tr>
        <tr>
          <td class="grid-label">DRAWING / SPEC SECTION:</td>
          <td class="grid-value">${t.specSection||t.specificationRef||t.drawingNumber||"Per Approved Submittal"}</td>
          <td class="grid-label">SAMPLE SUBMITTED:</td>
          <td class="grid-value"><strong>${t.sampleSubmitted?`YES (${t.sampleDetails||"Physical Sample Provided"})`:"NO (Technical Literature Only)"}</strong></td>
        </tr>
        <tr>
          <td class="grid-label">SUBMITTED BY:</td>
          <td class="grid-value">${g}</td>
          <td class="grid-label">CONSULTANT REVIEWER:</td>
          <td class="grid-value"><strong>${n}</strong></td>
        </tr>
      </table>
    </div>

    <!-- 2.0 Submittal Data -->
    <div class="pdf-section">
      <div class="section-banner">2.0 COMPLIANCE STATEMENT & DOCUMENTATION ATTACHED</div>
      <div class="box-content">
        <div style="line-height: 1.45; color: #0f172a; margin-bottom: 4px;">
          ${t.description||t.technicalDescription||"Material compliance documentation, technical mill test certificates, and samples provided for formal consultant review."}
        </div>
      </div>
    </div>

    <!-- 3.0 Consultant Directive -->
    <div class="pdf-section">
      <div class="section-banner">3.0 CONSULTANT EVALUATION & DISPOSITION</div>
      <div class="box-content">
        <div style="line-height: 1.45; color: #0f172a; margin-bottom: 6px;">
          ${t.reviewComments||((c=t.response)==null?void 0:c.responseText)||"Submittal is in accordance with project specifications."}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #475569; border-top: 1px solid #f1f5f9; padding-top: 4px;">
          <span>Review Status: <strong>${t.status||"APPROVED"}</strong></span>
          <span>Review Date: <strong>${v}</strong></span>
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
            <div style="font-size: 8px; color: #334155;">Name: <strong>${g}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${$(t.createdAt)}</span>
            </div>
          </td>
          <td style="width: 50%;">
            <div class="sig-role-header"><span>CONSULTANT / MATERIALS ENGINEER</span><span class="sig-required-tag">REQUIRED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${n}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${v}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${f}</div>
      <div>MAR Ref: ${h}</div>
    </div>
  `;Z(`${h} - Material Approval Request`,s)}function Te(t,p={},x={}){var I,A,c,i,b,r;const f=x.name||" ",y=p.name||" ",h=t.sampleNumber||t.sampleId||`CUBE-${Math.floor(1e3+Math.random()*9e3)}`,g=t.target28DayStrengthNmm2||t.day28Required||(t.targetStrength?parseFloat(t.targetStrength):0)||30,n=[],v=[{age:1,title:"1-Day Test",resArray:t.day1Results,testSummary:(I=t.tests)==null?void 0:I.day1,req:t.day1Required,defaultTargetRatio:.2,dateField:t.day1Date},{age:3,title:"3-Day Test",resArray:t.day3Results,testSummary:(A=t.tests)==null?void 0:A.day3,req:t.day3Required,defaultTargetRatio:.45,dateField:t.day3Date},{age:7,title:"7-Day Test",resArray:t.day7Results,testSummary:(c=t.tests)==null?void 0:c.day7,req:t.day7Required,defaultTargetRatio:.7,dateField:t.day7Date},{age:14,title:"14-Day Test",resArray:t.day14Results,testSummary:(i=t.tests)==null?void 0:i.day14,req:t.day14Required,defaultTargetRatio:.85,dateField:t.day14Date},{age:28,title:"28-Day Test",resArray:t.day28Results,testSummary:(b=t.tests)==null?void 0:b.day28,req:t.day28Required,defaultTargetRatio:1,dateField:t.day28Date}];for(const m of v){const o=m.req||Math.round(g*m.defaultTargetRatio*10)/10;if(m.resArray&&m.resArray.length>0){const l=m.resArray[0];n.push({age:m.age,title:m.title,testDate:l.testDate||m.dateField||t.castDate,targetStrength:o,averageStrength:l.averageStrength||0,maximumStrength:l.maximumStrength,minimumStrength:l.minimumStrength,standardDeviation:l.standardDeviation,status:l.status||(l.averageStrength>=o?"PASS":"FAIL"),technician:l.technician||t.preparedBy||"Materials Technician",testingStandard:l.testingStandard||"BS EN 12390-3",cubes:l.cubes||[]})}else if(m.testSummary){const l=m.testSummary,R=l.averageStrengthNmm2??l.compressiveStrengthNmm2??0;n.push({age:m.age,title:m.title,testDate:l.actualTestDate||l.testDate||l.scheduledDate||m.dateField||t.castDate,targetStrength:l.requiredStrengthNmm2||l.targetStrengthNmm2||o,averageStrength:R,maximumStrength:R,minimumStrength:R,standardDeviation:0,status:l.compliance||(R>=o?"PASS":"FAIL"),technician:l.testedBy||l.labTechnician||t.preparedBy||"Materials Technician",testingStandard:"BS EN 12390-3",cubes:(l.cubes||l.individualResults||[]).map((E,P)=>({id:P+1,load:E.failureLoadKn||E.crushingLoadKn||l.crushingLoadKn||"—",strength:E.compressiveStrengthNmm2||R,failureMode:E.typeOfFailure||E.failureMode||"Satisfactory",cubeWeight:E.weightKg||""}))})}}const s=n.find(m=>m.age===28),u=s?s.status==="PASS"||s.averageStrength>=s.targetStrength:null,N=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${X(x,p)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">CONCRETE COMPRESSIVE STRENGTH TEST CERTIFICATE</div>
          <div class="header-title-project">PROJECT: ${y}</div>
          <div class="header-title-iso">BS EN 12390-3 / ASTM C39 Compressive Strength Quality Verification</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${h}</span></div>
          ${t.inscribedName?`<div><strong>Inscribed Mark:</strong> <span style="font-weight:700; color:#0f172a;">${t.inscribedName}</span></div>`:""}
          <div><strong>Cast Date:</strong> ${t.castDate||$(t.castDate)}</div>
          <div><strong>Status:</strong> <span class="${t.status==="APPROVED"||u?"badge-pass":u===!1||t.status==="NCR_ISSUED"||t.status==="REJECTED"?"badge-fail":"badge-pending"}">${t.status||(u?"28D COMPLIANT":"IN PROGRESS")}</span></div>
        </td>
      </tr>
    </table>

    <!-- 1.0 Parameters -->
    <div class="pdf-section">
      <div class="section-banner">1.0 CONCRETE SPECIMEN & BATCHING PLANT PARAMETERS</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 18%;">STRUCTURAL ELEMENT:</td>
          <td class="grid-value" style="width: 32%;"><strong>${t.structureElement||t.elementName}</strong></td>
          <td class="grid-label" style="width: 18%;">SPECIFIED GRADE:</td>
          <td class="grid-value" style="width: 32%;"><strong>${t.concreteGrade}</strong> (Target: ${g} MPa)</td>
        </tr>
        <tr>
          <td class="grid-label">LOCATION / LEVEL:</td>
          <td class="grid-value">${[t.level||t.levelName,t.zone].filter(Boolean).join(" • ")||"Foundation / Site Area"}</td>
          <td class="grid-label">MIX TYPE & DESIGN:</td>
          <td class="grid-value">${t.mixType||"Design Mix"} ${t.mixDesignReference?`(${t.mixDesignReference})`:""}</td>
        </tr>
        <tr>
          <td class="grid-label">BATCHING SUPPLIER:</td>
          <td class="grid-value">${t.supplier||"Approved ReadyMix Source"} ${t.batchingPlant?`(${t.batchingPlant})`:""}</td>
          <td class="grid-label">TRUCK / TICKET #:</td>
          <td class="grid-value">${[t.truckNumber,t.batchTicketNumber||t.deliveryNoteNumber].filter(Boolean).join(" / ")||"—"}</td>
        </tr>
        <tr>
          <td class="grid-label">CEMENT TYPE:</td>
          <td class="grid-value">${t.cementType||"OPC Type I / BS EN 197-1"}</td>
          <td class="grid-label">W/C RATIO & AGGREGATE:</td>
          <td class="grid-value">W/C: <strong>${t.waterCementRatio||"0.40"}</strong> • Max Agg: ${t.maximumAggregateSize||"20mm"}</td>
        </tr>
        <tr>
          <td class="grid-label">TRACEABILITY REFS:</td>
          <td class="grid-value">PTP: <strong>${t.pourReference||"—"}</strong> • ITP: ${t.ITPReference||"—"}</td>
          <td class="grid-label">DRAWING / RFI:</td>
          <td class="grid-value">DWG: ${t.drawingReference||"—"} • RFI: ${t.RFINumber||"—"}</td>
        </tr>
      </table>
    </div>

    <!-- 2.0 Fresh Concrete & Curing Details -->
    <div class="pdf-section">
      <div class="section-banner">2.0 FRESH CONCRETE FIELD INSPECTION & CURING REGIMEN</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 18%;">SLUMP RESULT:</td>
          <td class="grid-value" style="width: 32%;"><strong>${t.slumpResult||t.slumpMm||"120"} mm</strong> ${t.slumpClass?`(${t.slumpClass})`:""} @ ${t.slumpTestTime||t.castTime||"Discharge"}</td>
          <td class="grid-label" style="width: 18%;">FIELD ACCEPTANCE:</td>
          <td class="grid-value" style="width: 32%;"><span class="badge-pass">${t.freshConcreteAccepted!==!1?"FRESH CONCRETE ACCEPTED":"REJECTED"}</span></td>
        </tr>
        <tr>
          <td class="grid-label">TEMPERATURES:</td>
          <td class="grid-value">Concrete: ${t.concreteTemperature||t.concreteTempCelsius||"28"}°C • Ambient: ${t.ambientTemperature||"31"}°C</td>
          <td class="grid-label">FRESH DENSITY:</td>
          <td class="grid-value">${t.density||t.densityKgM3||"2400"} kg/m³</td>
        </tr>
        <tr>
          <td class="grid-label">SAMPLING METHOD:</td>
          <td class="grid-value">${t.samplingMethod||"BS EN 12350-1"} (${t.sampleCondition||"Good"})</td>
          <td class="grid-label">CURING METHOD:</td>
          <td class="grid-value"><strong>${t.curingMethod||"Water Tank (20°C ± 2°C)"}</strong> ${t.curingTank?`(${t.curingTank})`:""}</td>
        </tr>
        <tr>
          <td class="grid-label">SPECIMEN MOLD SIZE:</td>
          <td class="grid-value">${t.cubeSize||(t.cubeSizeMm?`${t.cubeSizeMm}x${t.cubeSizeMm}x${t.cubeSizeMm}mm`:"150x150x150mm")} (${t.numCubes||t.cubeCount||6} Specimens)</td>
          <td class="grid-label">CURING DATES:</td>
          <td class="grid-value">Start: ${$(t.curingStartDate||t.castDate)} ${t.removedFromTankDate?`• Out: ${$(t.removedFromTankDate)}`:""}</td>
        </tr>
      </table>
    </div>

    <!-- 3.0 Multi-Cube Crushing Results -->
    <div class="pdf-section">
      <div class="section-banner">3.0 LABORATORY COMPRESSION CRUSHING LOG & STRENGTH STATISTICAL EVALUATION</div>
      ${n.length>0?n.map(m=>{const o=m.status==="PASS"||m.averageStrength>=m.targetStrength;return`
        <div style="margin-bottom: 8px; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden;">
          <div style="background: #f8fafc; padding: 4px 8px; font-weight: 700; font-size: 8px; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0;">
            <span>${m.title.toUpperCase()} (Test Date: ${$(m.testDate)}) — Standard: ${m.testingStandard}</span>
            <span style="color: ${o?"#15803d":"#b91c1c"}; font-weight: 800;">${o?"COMPLIANT (PASS)":"NON-COMPLIANT (FAIL)"}</span>
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
              ${m.cubes.length>0?m.cubes.map(l=>`
                <tr>
                  <td style="text-align: center; font-weight: 700; color: #0f172a;">Cube #${l.id}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 700;">${l.load||"—"}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 800; color: ${o?"#15803d":"#b91c1c"};">${l.strength||"—"}</td>
                  <td style="color: #475569; font-size: 7.2px;">${l.failureMode||"Cone Failure (Satisfactory)"}</td>
                  <td style="text-align: right; font-family: monospace; color: #64748b;">${l.cubeWeight||"—"}</td>
                </tr>
              `).join(""):`
                <tr>
                  <td colspan="5" style="text-align: center; color: #64748b; padding: 6px;">Individual load readings recorded directly in laboratory register.</td>
                </tr>
              `}
              <tr style="background: #f1f5f9; font-weight: 700;">
                <td colspan="2" style="font-size: 7.5px;">AVERAGE: <strong style="font-size: 8.5px; color: ${o?"#15803d":"#b91c1c"}; font-family: monospace;">${m.averageStrength} MPa</strong> (Target: ${m.targetStrength} MPa)</td>
                <td colspan="2" style="font-size: 7.2px; color: #475569;">Min: ${m.minimumStrength??m.averageStrength} MPa • Max: ${m.maximumStrength??m.averageStrength} MPa • SD: ${m.standardDeviation??"—"}</td>
                <td style="text-align: right;"><span class="${o?"badge-pass":"badge-fail"}">${o?"PASS":"FAIL"}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        `}).join(""):`
        <div style="text-align: center; color: #64748b; padding: 14px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 4px; font-size: 8px;">
          Specimens currently curing under monitored laboratory conditions. Scheduled crushing tests pending.
        </div>
      `}
    </div>

    <!-- 4.0 Testing Laboratory & Equipment -->
    <div class="pdf-section">
      <div class="section-banner">4.0 LABORATORY TESTING EQUIPMENT & ACCREDITATION</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 20%;">TESTING LABORATORY:</td>
          <td class="grid-value" style="width: 30%;">${t.testingLaboratory||"LSMTL Independent Materials Testing Lab"}</td>
          <td class="grid-label" style="width: 20%;">ACCREDITATION NO:</td>
          <td class="grid-value" style="width: 30%;">${t.laboratoryAccreditationNumber||"ISO/IEC 17025 Accredited"}</td>
        </tr>
        <tr>
          <td class="grid-label">TESTING COMPRESSION MACHINE:</td>
          <td class="grid-value">${t.testingMachine||"2000 kN Automatic Hydraulic Compression Frame"}</td>
          <td class="grid-label">CALIBRATION CERTIFICATE:</td>
          <td class="grid-value">${t.machineCalibrationCertificate||"CAL-2026-ENG-088 (Valid to Dec 2026)"}</td>
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
            <div style="font-size: 8px; color: #334155;">Name: <strong>${t.qaqcInspector||t.witnessedBy||t.preparedBy||"QA/QC Engineer"}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 10px;">
              <span>Sign: ___________________</span>
              <span>Date: ${$(t.preparedByDate||((r=n[0])==null?void 0:r.testDate)||t.castDate)}</span>
            </div>
          </td>
          <td style="width: 33.33%;">
            <div class="sig-role-header"><span>CONSULTANT ENGINEER</span><span class="sig-optional-tag">OPTIONAL</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${t.reviewedBy||t.approvedBy||""}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 10px;">
              <span>Sign: ___________________</span>
              <span>Date: ${$(t.reviewedByDate||t.approvedByDate||t.castDate)}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${f}</div>
      <div>Certificate Ref: ${h}</div>
    </div>
  `;Z(`${h} - Cube Test Certificate`,N)}function Ie(t,p={},x={},f){var ht,mt;const y=x.name||"Collection Developments LTD",h=x.legalName||(x==null?void 0:x.companyName)||"Collection Developments Limited",g=x.logoUrl||x.logo||(x==null?void 0:x.logoBase64)||t.logoBase64||"",n=p.name||t.projectName||"BANKSIDE",v=t.reportNumber||`WQR-2026-${Math.floor(1e3+Math.random()*9e3)}`,s=(f==null?void 0:f.includeNcrs)!==void 0?f.includeNcrs:(f==null?void 0:f.includeNcrsAndComments)!==void 0?f.includeNcrsAndComments:t.includeNcrs!==void 0?t.includeNcrs:t.includeNcrsAndComments!==!1,u=(f==null?void 0:f.includeSiteComments)!==void 0?f.includeSiteComments:(f==null?void 0:f.includeNcrsAndComments)!==void 0?f.includeNcrsAndComments:t.includeSiteComments!==void 0?t.includeSiteComments:t.includeNcrsAndComments!==!1,N=(f==null?void 0:f.includeSiteInstructions)!==void 0?f.includeSiteInstructions:t.includeSiteInstructions!==!1,I=t.startDate||t.weekStart||"2026-09-28",A=t.endDate||t.weekEnd||"2026-10-03",c=Y(I),i=Y(A),b=i,r=typeof t.preparedBy=="object"&&t.preparedBy?t.preparedBy:{name:typeof t.preparedBy=="string"?t.preparedBy:"Jesujuwon Oladejo",designation:"QA/QC ENGINEER",role:"QA/QC ENGINEER"},m=r.name||"Jesujuwon Oladejo",o=r.designation||r.role||"QA/QC ENGINEER",l=r.email||At()||"joladejo@collection.gp";r.signed;const R=r.signatureUrl||"",E=(t.cubeTests&&t.cubeTests.length>0?t.cubeTests:t.filteredCubeTests)||[],P=t.quantitySummary||[],L=t.mepClearance||[],k=(t.materialDeliveries&&t.materialDeliveries.length>0?t.materialDeliveries:t.filteredMaterialDeliveries)||[],j=(t.ncrRemediationLog&&t.ncrRemediationLog.length>0?t.ncrRemediationLog:t.filteredNcrs)||t.ncr||[],q=(t.siteComments&&t.siteComments.length>0?t.siteComments:t.filteredSiteComments)||t.filteredFindings||[],W=(t.siteInstructions&&t.siteInstructions.length>0?t.siteInstructions:t.filteredSiteInstructions)||[],U=t.projectCoverImageUrl||t.coverImageUrl||t.coverImageBase64||p.coverImageUrl||p.imageUrl||(p==null?void 0:p.image)||(t==null?void 0:t.projectImage)||"",D=(t.pictorialUrls||[]).filter(e=>{const d=typeof e=="string"?e:e==null?void 0:e.url;return!!(d&&typeof d=="string"&&d.trim().length>0)}),st=t.beamLayoutImg,nt=t.columnLayoutImg,ot=t.slabImg,J=t.structuralElements||[],Et=J.filter(e=>(e.elementType||e.type||e.element||"").toLowerCase().includes("column")),St=J.filter(e=>(e.elementType||e.type||e.element||"").toLowerCase().includes("beam")),Tt=J.filter(e=>(e.elementType||e.type||e.element||"").toLowerCase().includes("slab")),K=(t.selectedLevel||t.selectedLevelName||"000 - MEZZANINE").toUpperCase();let V=0,tt=0;P.length>0?P.forEach(e=>{const d=parseFloat(String(e.calculatedVolume??e.plannedVolume??e.scope??0))||0,S=parseFloat(String(e.achievedVolume??e.actualVolume??0))||0;V+=d,tt+=S}):J.length>0&&J.forEach(e=>{const d=parseFloat(String(e.calculatedVolume||e.volume||0))||0,S=parseFloat(String(e.achievedVolume??e.completedVolume??0))||0;V+=d,tt+=S}),V===0&&t.totalVolumeCalculated&&(V=Number(t.totalVolumeCalculated)||0),V===0&&(V=270.7),tt===0&&V>0&&(tt=Math.round(V*.98*10)/10);const It=V>0?Math.round(tt/V*100):98,dt=(((ht=t.ncrStats)==null?void 0:ht.openTotal)??0)+q.filter(e=>{const d=String(e.status||"").toLowerCase();return d.includes("non")||d.includes("open")||d.includes("progress")||d.includes("pending")}).length,Rt=t.overallQualityCompliance??((mt=t.metrics)==null?void 0:mt.inspectionPassRate)??100;function Y(e){if(!e)return"2026-10-03";if(typeof e=="string"){if(/^\d{4}-\d{2}-\d{2}$/.test(e.trim()))return e.trim();const d=new Date(e);return isNaN(d.getTime())?e:d.toISOString().split("T")[0]}return typeof e=="number"?new Date(e).toISOString().split("T")[0]:e instanceof Date&&!isNaN(e.getTime())?e.toISOString().split("T")[0]:"2026-10-03"}function At(){try{const e=Zt.getState().currentUser;return(e==null?void 0:e.email)||"joladejo@collection.gp"}catch{return"joladejo@collection.gp"}}const Ct=()=>`
    <div style="display: flex; align-items: center; gap: 6px;">
      ${g?`<img src="${g}" style="max-height: 22px; max-width: 80px; object-fit: contain;" alt="Logo" />`:`
          <div style="display: flex; gap: 2px; align-items: flex-end; height: 16px;">
            <span style="width: 3.5px; height: 9px; background: #c28b5e; border-radius: 1px;"></span>
            <span style="width: 3.5px; height: 16px; background: #c28b5e; border-radius: 1px;"></span>
            <span style="width: 3.5px; height: 12px; background: #c28b5e; border-radius: 1px;"></span>
          </div>
          <span style="font-size: 8.5px; font-weight: 900; color: #0f172a; letter-spacing: 0.8px; text-transform: uppercase;">COLLECTION</span>
        `}
    </div>
  `,H=e=>`
    <div class="pdf-header">
      <div class="pdf-header-top">
        <div style="display: flex; align-items: center; gap: 8px;">
          ${Ct()}
          <div style="font-size: 8.5px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 6px; letter-spacing: 0.2px;">
            <span>${b}</span>
            <span style="color: #cbd5e1;">|</span>
            <span style="color: #64748b;">QA/QC SURVEILLANCE</span>
            <span style="color: #cbd5e1;">|</span>
            <span style="font-weight: 800; color: #0f172a; text-transform: uppercase;">${e}</span>
          </div>
        </div>
        <div style="font-size: 8.5px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase;">
          <span style="color: #0f172a;">${n.toUpperCase()}</span> &nbsp;|&nbsp; <span style="color: #94a3b8;">CONFIDENTIAL</span>
        </div>
      </div>
      <div class="pdf-header-rule"></div>
    </div>
  `,Q=e=>`
    <div class="pdf-footer">
      <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">
        Compiled By: <strong style="color: #475569;">${m} (${o})</strong> &nbsp;|&nbsp; ISO 9001:2015 Quality Management System
      </div>
      <div class="pdf-slide-badge">
        SLIDE ${String(e).padStart(2,"0")}
      </div>
    </div>
  `,w=[];w.push(`
    <div class="pdf-sheet" style="padding: 0; display: flex; flex-direction: row; height: 210mm; overflow: hidden; position: relative;">
      <!-- Left Hero Column (~46% width) -->
      <div style="width: 46%; padding: 24mm 14mm 16mm 16mm; display: flex; flex-direction: column; justify-content: space-between; background: #ffffff; position: relative; border-right: 3px solid #d49a5b;">
        <div>
          <!-- Company Brand Header -->
          <div style="margin-bottom: 22px;">
            <div style="display: flex; align-items: flex-end; gap: 2px; margin-bottom: 4px;">
              ${g?`<img src="${g}" style="max-height: 120px; max-width: 190px; object-fit: contain;" alt="${y}" />`:`
                <div style="display: flex; gap: 3px; align-items: flex-end; height: 26px;">
                  <span style="width: 5px; height: 14px; background: #c28b5e; border-radius: 1px;"></span>
                  <span style="width: 5px; height: 24px; background: #c28b5e; border-radius: 1px;"></span>
                  <span style="width: 5px; height: 18px; background: #c28b5e; border-radius: 1px;"></span>
                </div>
              `}
            </div>
            <div style="font-size: 13px; font-weight: 900; color: #0f172a; letter-spacing: 1.5px; text-transform: uppercase;">
              ${y.toUpperCase()}
            </div>
          </div>

          <!-- Project Title & Divider -->
          <div style="margin-bottom: 18px;">
            <div style="font-size: 34px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; text-transform: uppercase; line-height: 1.05;">
              ${n.toUpperCase()}
            </div>
            <div style="width: 100%; height: 2px; background: #c28b5e; margin-top: 14px;"></div>
          </div>

          <!-- Report Title -->
          <div style="font-size: 19px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.3px; margin-bottom: 12px;">
            ${t.title||"QA/QC WEEKLY REPORT"}
          </div>

          <!-- Surveillance Level Tag -->
          <div style="display: inline-block; background: #f1f5f9; color: #475569; font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: 4px; text-transform: uppercase; margin-bottom: 12px;">
            SURVEILLANCE: ${K}
          </div>
          <div></div>

          <!-- Date Range Pill -->
          <div style="display: inline-block; background: #FFFFFF; border: 1px solid #c28b5e; color: #c28b5e; font-size: 10.5px; font-weight: 800; padding: 6px 22px; border-radius: 9999px; letter-spacing: 0.5px; text-transform: uppercase;">
            ${c} &nbsp;TO&nbsp; ${i}
          </div>
        </div>

        <!-- Compiler Card (Bottom Left) -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #c28b5e; border-radius: 6px; padding: 12px 16px; margin-top: auto;">
          <div style="font-size: 7.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
            AUTHORIZED COMPILER &amp; QA/QC OFFICER
          </div>
          <div style="font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 3px;">
            ${m}
          </div>
          <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 1px;">
            ${o}
          </div>
        </div>
      </div>

      <!-- Right Column (~54% width) Full-Bleed Cover Image -->
      <div style="width: 54%; height: 100%; background: #0f172a; overflow: hidden; position: relative;">
        ${U?`<img src="${U}" style="width: 100%; height: 100%; object-fit: cover;" alt="${n}" />`:`
          <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
            <div style="text-align: center; color: #ffffff; padding: 30px;">
              <div style="font-size: 36px; font-weight: 900; color: #c28b5e;">${n.toUpperCase()}</div>
              <div style="font-size: 12px; color: #94a3b8; font-weight: 700; margin-top: 8px;">OFFICIAL QA/QC SURVEILLANCE DOSSIER</div>
            </div>
          </div>
        `}
      </div>
    </div>
  `),w.push(`
    <div class="pdf-sheet">
      <div>
        ${H("EXECUTIVE SUMMARY: OPERATIONAL OVERVIEW")}
        
        <!-- 4 Top Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px;">
          <!-- Card 1: Total Scope Volume -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #0f172a; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL SCOPE VOLUME</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${V.toFixed(0)} m³</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">Design Volume Target</div>
          </div>

          <!-- Card 2: Achieved Volume -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #0284c7; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">ACHIEVED VOLUME</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${tt.toFixed(0)} m³</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">${It}% Cumulative</div>
          </div>

          <!-- Card 3: Quality Compliance -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #16a34a; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">QUALITY COMPLIANCE</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${Rt}%</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">Field Surveillance Benchmark</div>
          </div>

          <!-- Card 4: Open Findings / NCRs -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #dc2626; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">OPEN FINDINGS / NCRS</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${dt}</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">Active Remediation Items</div>
          </div>
        </div>

        <!-- Large Content Card -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 22px 26px; min-height: 320px; position: relative;">
          <div style="border-left: 6px solid #0f172a; padding-left: 14px; margin-bottom: 16px;">
            <div style="font-size: 12px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
              EXECUTIVE QA/QC SYNOPSIS &amp; MANAGEMENT EVALUATION
            </div>
          </div>
          <div style="width: 100%; height: 1px; background: #f1f5f9; margin-bottom: 16px;"></div>
          <div style="font-size: 10.5px; line-height: 1.7; color: #334155; font-weight: 500;">
            ${t.synopsis||t.executiveSummary||"During the reporting period, structural operations for the active suspended slab advanced with the erection of modular false-work towers reaching substantial completion, along with soffit shuttering using timber H-beams and perimeter formwork panels."}
          </div>
        </div>
      </div>
      ${Q(w.length+1)}
    </div>
  `);const lt=(e,d="")=>{const S=e&&e.trim().length>0?e:d;return S?S.split(/\n\s*\n|\n/).map(T=>T.trim()).filter(Boolean).map(T=>{if(T.includes(":")){const _=T.split(":"),a=_[0].trim(),O=_.slice(1).join(":").trim();return`
            <div style="margin-bottom: 12px;">
              <strong style="color: #0f172a; font-weight: 800;">${a}:</strong> ${O}
            </div>
          `}return`<div style="margin-bottom: 10px;">${T}</div>`}).join(""):""};w.push(`
    <div class="pdf-sheet">
      <div>
        ${H("EXECUTIVE SUMMARY: STRATEGIC INSIGHTS")}
        
        <!-- 3 Columns Grid -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; min-height: 420px;">
          <!-- Column 1: Highlights -->
          <div style="display: flex; flex-direction: column;">
            <div style="background: #16a34a; color: #ffffff; text-align: center; padding: 10px 12px; font-weight: 800; font-size: 10.5px; border-radius: 4px 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
              KEY PROJECT HIGHLIGHTS
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 16px; font-size: 9px; line-height: 1.5; color: #334155; background: #ffffff;">
              ${lt(t.highlights,`Falsework & Prop Support Systems: Complete erection, leveling, and structural alignment of modular scaffolding falsework towers across designated floor deck sections.

Soffit & Edge-Beam Shuttering: Installation and dimensional verification of timber H-beam secondary/primary supports and perimeter edge-beam formwork panels.

Reinforcement Inspection: Pre-pour QA/QC review of beam rebar cages, link spacing, stirrup detailing, lap lengths, and cover block positioning prior to deck closure.

Material Verification: Physical inspection, quantity reconciliation, and logging of incoming MEP site infrastructure items.`)}
            </div>
          </div>

          <!-- Column 2: Risks & Concerns -->
          <div style="display: flex; flex-direction: column;">
            <div style="background: #d97706; color: #ffffff; text-align: center; padding: 10px 12px; font-weight: 800; font-size: 10.5px; border-radius: 4px 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
              CRITICAL RISKS &amp; OPEN CONCERNS
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 16px; font-size: 9px; line-height: 1.5; color: #334155; background: #ffffff;">
              ${lt(t.concerns,`Formwork Rigidity & Column Alignment: Active QA monitoring on column starter bar verticality and formwork bracing rigidity to mitigate risk of lateral displacement or concrete bulging during high-rate pours.

Scaffolding Component Shortage: Site supply deficit of scaffolding clips/couplers currently delaying final connection and cross-bracing of the falsework system.

Pending Demolition: Demolition and structural removal of non-conforming elements remain pending final QA clearance sign-off.

Outstanding NCR Closures: Formal sign-off and closure of open Non-Conformance Reports (NCRs) regarding concrete honeycombing await approved repair method statements.`)}
            </div>
          </div>

          <!-- Column 3: Look-Ahead Plan -->
          <div style="display: flex; flex-direction: column;">
            <div style="background: #4f46e5; color: #ffffff; text-align: center; padding: 10px 12px; font-weight: 800; font-size: 10.5px; border-radius: 4px 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
              LOOK-AHEAD PLAN &amp; ACTION TARGETS
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 16px; font-size: 9px; line-height: 1.5; color: #334155; background: #ffffff;">
              ${lt(t.nextWeekPlan,`Falsework & Scaffold Completion: Finalize structural erection, cross-bracing, and level checks of falsework scaffolding towers for the suspended slab upon receipt of additional components.

First-Floor Slab Formwork: Complete deck shuttering, soffit lining, perimeter edge-beam formwork, and dimensional alignment for the entire active floor level.

Column Remediation: Conclude rectification of non-conforming column elements, followed by re-bar cage alignment, formwork shuttering, and reconstruction.

Slab Reinforcement Commencement: Initiate bottom-mat rebar placement, chair support spacing, and cover block installation for the suspended slab deck.`)}
            </div>
          </div>
        </div>
      </div>
      ${Q(w.length+1)}
    </div>
  `);const Nt=(E.length>0?E:[{dateCast:"2026-08-12",elementLevel:"WALL AND COLUMNS",strength7Days:"30.52 N/mm²",status7Days:"PASS",strength28Days:"—",status28Days:"pending"},{dateCast:"2026-07-28",elementLevel:"SLAB AND BEAMS",strength7Days:"28.07 N/mm²",status7Days:"PASS",strength28Days:"32.41 N/mm²",status28Days:"PASS"}]).map((e,d)=>{var a,O,z,B;const S=e.strength7Days||((O=(a=e.day7Results)==null?void 0:a[0])!=null&&O.averageStrength?`${e.day7Results[0].averageStrength} N/mm²`:"—"),C=e.strength28Days||((B=(z=e.day28Results)==null?void 0:z[0])!=null&&B.averageStrength?`${e.day28Results[0].averageStrength} N/mm²`:"—"),T=String(e.status7Days||(S!=="—"?"PASS":"pending")).toLowerCase(),_=String(e.status28Days||(C!=="—"?"PASS":"pending")).toLowerCase();return`
        <tr>
          <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(d+1).padStart(2,"0")}</td>
          <td style="font-family: monospace; font-weight: 600;">${Y(e.dateCast||e.castDate||e.date)}</td>
          <td style="font-weight: 800; color: #0f172a; text-transform: uppercase;">${e.elementLevel||e.element||e.inscribedName||"Structural Element"}</td>
          <td style="font-family: monospace; font-weight: 700; text-align: center;">${S}</td>
          <td style="text-align: center; font-weight: 800; color: ${T.includes("pass")?"#16a34a":"#d97706"};">${T.includes("pass")?"PASS":T}</td>
          <td style="font-family: monospace; font-weight: 700; text-align: center;">${C}</td>
          <td style="text-align: center; font-weight: 800; color: ${_.includes("pass")?"#16a34a":"#d97706"};">${_.includes("pass")?"PASS":_}</td>
        </tr>
      `}).join("");w.push(`
    <div class="pdf-sheet">
      <div>
        ${H("CONCRETE COMPRESSIVE STRENGTH TEST MATRIX")}
        
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
            ${Nt}
          </tbody>
        </table>
      </div>
      ${Q(w.length+1)}
    </div>
  `);const gt=["#3b82f6","#10b981","#f97316","#8b5cf6","#06b6d4","#ec4899","#f59e0b"],F=[{name:"BEAM",scope:42,completion:97,color:"#3b82f6"},{name:"SLAB",scope:98,completion:100,color:"#10b981"},{name:"WALL",scope:24,completion:100,color:"#f97316"},{name:"STAIR",scope:71,completion:100,color:"#8b5cf6"},{name:"COLUMN",scope:32,completion:89,color:"#3b82f6"}];P.length>0&&(F.length=0,P.forEach((e,d)=>{const S=parseFloat(String(e.calculatedVolume??e.plannedVolume??e.scope??0))||0,C=parseFloat(String(e.achievedVolume??e.actualVolume??0))||0;let T=S>0?Math.round(C/S*100):parseInt(String(e.completion||100));T=Math.min(100,Math.max(0,T)),F.push({name:String(e.element||e.structuralElement||`Element ${d+1}`).toUpperCase().trim(),scope:S,completion:T,color:gt[d%gt.length]})}));const ct=F.reduce((e,d)=>e+d.scope,0),$t=F.length>0?Math.round(F.reduce((e,d)=>e+d.completion,0)/F.length):98,ft=(()=>{let T=-Math.PI/2;const _=[];F.forEach(z=>{const M=(ct>0?z.scope/ct:1/(F.length||1))*2*Math.PI,et=T+M,it=75+62*Math.cos(T),xt=75+62*Math.sin(T),bt=75+62*Math.cos(et),ut=75+62*Math.sin(et),vt=M>Math.PI?1:0,G=`M 75 75 L ${it.toFixed(2)} ${xt.toFixed(2)} A 62 62 0 ${vt} 1 ${bt.toFixed(2)} ${ut.toFixed(2)} Z`;_.push(`<path d="${G}" fill="${z.color}" stroke="#ffffff" stroke-width="1.5" />`),T=et});const a=`
      <svg width="150" height="150" viewBox="0 0 150 150" style="display: block; margin: 0 auto;">
        ${_.join("")}
      </svg>
    `,O=`
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; margin-top: 10px; font-size: 7.5px; font-weight: 800;">
        ${F.map(z=>`
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="display: inline-block; width: 8px; height: 8px; background: ${z.color}; border-radius: 1.5px;"></span>
            <span style="color: #334155; text-transform: uppercase;">${z.name}</span>
          </div>
        `).join("")}
      </div>
    `;return{svg:a,legend:O}})(),wt=()=>{const C=Math.max(...F.map(O=>O.scope),10),T=720/(F.length||1),_=Math.min(22,T*.32);return`
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
        <svg width="100%" height="100" viewBox="0 0 720 100" style="display: block; overflow: visible;">
          <line x1="20" y1="78" x2="700" y2="78" stroke="#cbd5e1" stroke-width="1.2" />
          ${F.map((O,z)=>{const B=z*T+T/2,M=C>0?O.scope/C*58:0,et=O.scope*O.completion/100,it=C>0?et/C*58:0,xt=B-_-2,bt=78-M,ut=B+2,vt=78-it;return`
          <!-- Scope Bar (Blue) -->
          <rect x="${xt.toFixed(1)}" y="${bt.toFixed(1)}" width="${_.toFixed(1)}" height="${Math.max(M,1).toFixed(1)}" rx="1.5" fill="#3b82f6" />
          <!-- Achieved Bar (Orange) -->
          <rect x="${ut.toFixed(1)}" y="${vt.toFixed(1)}" width="${_.toFixed(1)}" height="${Math.max(it,1).toFixed(1)}" rx="1.5" fill="#f97316" />
          <!-- X-Axis Label -->
          <text x="${B.toFixed(1)}" y="${92 .toFixed(1)}" text-anchor="middle" font-size="8" font-weight="700" fill="#475569" font-family="-apple-system, sans-serif" letter-spacing="0.3">${O.name}</text>
        `}).join("")}
        </svg>
      </div>
    `},Ot=F.map(e=>`
      <tr>
        <td style="font-weight: 800; color: #0f172a; text-transform: uppercase;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-block; width: 3px; height: 13px; background: ${e.color}; border-radius: 1px; shrink: 0;"></span>
            <span>${e.name}</span>
          </div>
        </td>
        <td style="font-family: monospace; font-weight: 700; color: #1e293b;">${e.scope.toFixed(0)}</td>
        <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${e.completion}</td>
      </tr>
    `).join("");w.push(`
    <div class="pdf-sheet">
      <div>
        ${H(`${K} — QUANTITY SUMMARY`)}
        
        <!-- Top Half: Table and Pie Chart -->
        <div style="display: flex; gap: 16px; align-items: stretch; margin-top: 8px;">
          <!-- Left Table (50% width) -->
          <div style="flex: 1.1;">
            <div style="font-size: 10px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 6px; letter-spacing: -0.2px;">
              ${K} FLOOR CONCRETE CHART
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
                ${Ot}
                <tr style="background: #f8fafc; font-weight: 900; border-top: 2px solid #cbd5e1;">
                  <td style="font-size: 8.5px; color: #0f172a; text-transform: uppercase; font-weight: 900;">TOTAL</td>
                  <td style="font-family: monospace; font-size: 9px; color: #0f172a; font-weight: 900;">${ct.toFixed(0)}</td>
                  <td style="font-family: monospace; font-size: 9px; color: #0f172a; font-weight: 900;">${$t}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Right Pie Chart Card (50% width) -->
          <div style="flex: 0.9; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; display: flex; flex-direction: column; justify-content: space-between;">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
              ${ft.svg}
              ${ft.legend}
            </div>
            <div style="text-align: center; font-size: 8px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-top: 6px; letter-spacing: 0.5px;">
              ${K} FLOOR CONCRETE CHART
            </div>
          </div>
        </div>

        <!-- Bottom Half: Grouped Vertical Bar Chart -->
        ${wt()}
      </div>
      ${Q(w.length+1)}
    </div>
  `);function pt(e,d,S,C,T,_=!0){if(_&&S.length>0){const O=Math.ceil(S.length/26);let z=0,B=0;S.forEach(M=>{const et=parseFloat(String(M.calculatedVolume||M.volume||0))||0,it=parseFloat(String(M.achievedVolume??M.completedVolume??0))||0;z+=et,B+=it});for(let M=0;M<O;M++){const et=S.slice(M*26,(M+1)*26),it=M===0,xt=M===O-1,bt=it?`${K} — ${d.toUpperCase()} ELEMENTS STATUS`:`${K} — ${e.toUpperCase()} STATUS (CONT'D)`,ut=et.map(G=>{const Ht=parseFloat(String(G.calculatedVolume||G.volume||0))||0,Qt=parseFloat(String(G.achievedVolume??G.completedVolume??0))||0;let rt=Ht>0?Math.round(Qt/Ht*100):Number(G.completionPercentage||G.completion||0);rt=Math.min(100,Math.max(0,rt));const yt=String(G.status||(rt===100||rt>0?"APPROVED":"REJECTED")).toUpperCase(),Mt=yt.includes("APPROV")||yt.includes("COMPLET")||yt.includes("PASS")||rt===100,Vt=yt.includes("REJECT")||yt.includes("FAIL")||!Mt&&Qt===0,Yt=Mt?"APPROVED":Vt?"REJECTED":"PENDING",qt=Mt?"badge-approved":Vt?"badge-rejected":"badge-pending",Wt=Mt?"#16a34a":Vt?"#d97706":"#cbd5e1",Jt=(G.elementName||G.name||G.element||G.id||"—").toUpperCase(),Kt=G.gridLocation||G.grid||G.location||"—";return`
              <tr>
                <td style="font-weight: 800; color: #0f172a;">${Jt}</td>
                <td style="font-family: monospace; color: #475569;">${Kt}</td>
                <td style="font-family: monospace; font-weight: 600;">${Ht.toFixed(2)}</td>
                <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${Qt.toFixed(2)}</td>
                <td>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                    <div style="flex: 1; height: 7px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
                      <div style="width: ${rt}%; height: 100%; background: ${Wt}; border-radius: 999px;"></div>
                    </div>
                    <span style="font-size: 7px; font-weight: 800; font-family: monospace; min-width: 24px; text-align: right;">${rt}%</span>
                    <span class="${qt}">${Yt}</span>
                  </div>
                </td>
              </tr>
            `}).join(""),vt=z>0?Math.round(B/z*100):0;w.push(`
          <div class="pdf-sheet">
            <div>
              ${H(bt)}
              
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
                  ${ut}
                  ${xt?`
                    <tr style="background: #f1f5f9; font-weight: 900; border-top: 1.5px solid #cbd5e1;">
                      <td colspan="2" style="font-size: 7.5px; color: #0f172a; text-transform: uppercase;">
                        TOTAL ${e.toUpperCase()}
                      </td>
                      <td style="font-family: monospace; font-size: 7.5px;">${z.toFixed(2)}</td>
                      <td style="font-family: monospace; font-size: 7.5px; color: #0f172a;">${B.toFixed(2)}</td>
                      <td style="font-size: 7.5px; color: #0f172a; font-weight: 900;">
                        ${vt}% COMPLETION
                      </td>
                    </tr>
                  `:""}
                </tbody>
              </table>
            </div>
            ${Q(w.length+1)}
          </div>
        `)}}(C||T)&&w.push(`
        <div class="pdf-sheet">
          <div>
            ${H(T||`${e.toUpperCase()} LAYOUT &amp; INSPECTION`)}
            
            <div style="height: 154mm; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; position: relative; margin-top: 6px;">
              <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 6px; overflow: hidden; background: #ffffff;">
                ${C?`<img src="${C}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="${T}" />`:`
                    <div style="text-align: center; padding: 20px; color: #64748b;">
                      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 4px;">
                        ${T}
                      </div>
                      <div style="font-size: 8px;">Verified as-built CAD completion overlay</div>
                    </div>
                  `}
              </div>
              <div style="background: #0f172a; border-left: 5px solid #ea580c; color: #ffffff; padding: 8px 14px; font-size: 8px; font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
                <span style="letter-spacing: 0.5px; text-transform: uppercase;">
                  ${T} &nbsp;|&nbsp; VERIFIED AS-BUILT SURVEILLANCE OVERLAY
                </span>
                <span style="color: #4ade80; font-weight: 800;">&#10003; QC CLEARANCE COMPLETE</span>
              </div>
            </div>
          </div>
          ${Q(w.length+1)}
        </div>
      `)}pt("Columns","Column",Et,nt,"COLUMNS LAYOUT & CASTING INSPECTION"),pt("Beams","Beam",St,st,"BEAMS LAYOUT & REINFORCEMENT INSPECTION"),pt("Slabs","Slab",Tt,ot,"SLABS LAYOUT & CONCRETING INSPECTION",!1);const Dt=L.length>0?L.map((e,d)=>`
            <tr>
              <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(d+1).padStart(2,"0")}</td>
              <td style="font-weight: 800; color: #0f172a;">${e.service||e.system||e.elementService||"Electrical / Plumbing"}</td>
              <td>${e.contractor||e.trade||"Main MEP Subcontractor"}</td>
              <td style="font-family: monospace; font-weight: 700; text-align: center;">${e.progress||100}%</td>
              <td style="text-align: center;"><span class="badge-approved">${e.status||"CLEARED"}</span></td>
              <td style="font-size: 7.5px; color: #475569;">${e.remarks||"All box fixings and conduit sleeves cleared for casting"}</td>
            </tr>
          `).join(""):`
        <tr>
          <td style="text-align: center; font-family: monospace;">—</td>
          <td style="font-weight: 600; color: #64748b;">No MEP service clearances recorded for this cycle</td>
          <td style="text-align: center;">—</td>
          <td style="text-align: center;">—</td>
          <td style="text-align: center;">—</td>
          <td style="text-align: center;">—</td>
        </tr>
      `;w.push(`
    <div class="pdf-sheet">
      <div>
        ${H("MEP QA/QC CLEARANCE STATUS — PRE-CASTING")}
        
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
            ${Dt}
          </tbody>
        </table>
      </div>
      ${Q(w.length+1)}
    </div>
  `);const Pt=k.length>0?k.map((e,d)=>{const S=String(e.qcStatus||e.status||"APPROVED").toUpperCase(),C=S.includes("REJECT")?"#dc2626":S.includes("NOTED")?"#0284c7":"#16a34a",T=e.unit||"units",_=e.quantityAccepted!==void 0?e.quantityAccepted:e.quantity||1,a=e.quantityRejected??0,O=e.quantityReceived??e.quantity??1;return`
            <tr>
              <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(d+1).padStart(2,"0")}</td>
              <td style="font-family: monospace; font-weight: 600;">${Y(e.deliveryDate||e.date)}</td>
              <td style="font-weight: 800; color: #0f172a;">${e.materialDescription||e.materialName||e.name||"Material"}</td>
              <td>${e.supplier||e.supplierName||"LOCAL"}</td>
              <td style="font-family: monospace; font-weight: 700;">${O} ${T} [${_} Acc / ${a} Rej]</td>
              <td style="text-align: center; font-weight: 800; color: ${C}; font-size: 7.5px;">${S}</td>
            </tr>
          `}).join(""):`
        <tr>
          <td colspan="6" style="text-align: center; color: #64748b; padding: 24px;">
            Zero material rejections recorded during this surveillance period.
          </td>
        </tr>
      `;if(w.push(`
    <div class="pdf-sheet">
      <div>
        ${H("MATERIAL DELIVERY LOG & TRACEABILITY")}
        
        <table class="data-table" style="margin-top: 8px;">
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">S/N</th>
              <th style="width: 14%;">DELIVERY DATE</th>
              <th style="width: 33%;">MATERIAL DESCRIPTION</th>
              <th style="width: 18%;">SOURCE / SUPPLIER</th>
              <th style="width: 18%;">QUANTITY</th>
              <th style="width: 12%; text-align: center;">QC ADMISSION STATUS</th>
            </tr>
          </thead>
          <tbody>
            ${Pt}
          </tbody>
        </table>
      </div>
      ${Q(w.length+1)}
    </div>
  `),s){const e=j.length>0?j.map(d=>{const S=String(d.status||"OPEN").toUpperCase(),C=S==="CLOSED"||S==="RECTIFIED"||S==="RESOLVED",T=Array.isArray(d.descriptionItems)?d.descriptionItems.join(", "):d.description||"Field variance logged";return`
              <tr>
                <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${d.refNo||d.ncrNumber||"NCR"}</td>
                <td style="font-weight: 700;">${d.elementLevel||d.location||"Structural Component"}</td>
                <td style="font-size: 7.5px; line-height: 1.4; color: #334155;">${T}</td>
                <td style="font-family: monospace; font-weight: 600;">${Y(d.dateIdentified||d.dateFound||d.createdAt)}</td>
                <td style="font-family: monospace; font-weight: 600;">${Y(d.targetFixDate||d.signDate||b)}</td>
                <td style="text-align: center; font-weight: 900; color: ${C?"#16a34a":"#dc2626"}; font-size: 7.5px;">${C?"CLOSED":"OPEN"}</td>
              </tr>
            `}).join(""):`
          <tr>
            <td colspan="6" style="text-align: center; color: #166534; padding: 24px; font-weight: 800;">
              &#10003; ZERO ACTIVE NON-CONFORMANCE REPORTS LOGGED
            </td>
          </tr>
        `;w.push(`
      <div class="pdf-sheet">
        <div>
          ${H("APPENDIX: NCR REGISTER")}
          
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
              ${e}
            </tbody>
          </table>
        </div>
        ${Q(w.length+1)}
      </div>
    `)}if(N){const e=W.length>0?W.map(d=>{const S=String(d.status||"ISSUED").toUpperCase(),C=S.includes("CLOSE")||S.includes("COMPLET");return`
              <tr>
                <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${d.instructionNumber||d.siNumber||d.id||"SI"}</td>
                <td style="font-weight: 700; font-size: 7.5px; color: #0f172a;">${d.title||d.subject||"Formal Notice of Defect Rectification"}</td>
                <td style="font-size: 7.5px; text-transform: uppercase;">${d.contractorName||d.recipient||"Subcontractor"}</td>
                <td style="font-family: monospace; font-weight: 600;">${Y(d.issuedDate||d.date)}</td>
                <td style="font-family: monospace; font-weight: 600;">${Y(d.complianceDeadline||d.dueDate||b)}</td>
                <td style="text-align: center; font-weight: 900; color: ${C?"#16a34a":"#d97706"}; font-size: 7.5px;">${C?"CLOSED":"ISSUED"}</td>
              </tr>
            `}).join(""):`
          <tr>
            <td colspan="6" style="text-align: center; color: #64748b; padding: 24px;">
              No contractual site instructions issued during this reporting period.
            </td>
          </tr>
        `;w.push(`
      <div class="pdf-sheet">
        <div>
          ${H("APPENDIX: SITE INSTRUCTION REGISTER")}
          
          <table class="data-table" style="margin-top: 8px;">
            <thead>
              <tr>
                <th style="width: 14%;">SI NO.</th>
                <th style="width: 38%;">SUBJECT</th>
                <th style="width: 22%;">RECIPIENT</th>
                <th style="width: 10%;">ISSUE DATE</th>
                <th style="width: 10%;">DUE DATE</th>
                <th style="width: 10%; text-align: center;">COMPLIANCE STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${e}
            </tbody>
          </table>
        </div>
        ${Q(w.length+1)}
      </div>
    `)}if(u){const e=q.length>0?q.map((d,S)=>{const C=String(d.status||"Non-Compliant"),T=C.toLowerCase().includes("comp")||C.toLowerCase().includes("passed")||C.toLowerCase().includes("approved"),_=C.toLowerCase().includes("pend"),a=T?"#16a34a":_?"#d97706":"#dc2626";return`
              <tr>
                <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(S+1).padStart(2,"0")}</td>
                <td style="font-family: monospace; font-weight: 600;">${Y(d.date||d.createdAt)}</td>
                <td>${d.level||K} &bull; ${d.location||"3-5/C-D"}</td>
                <td style="font-weight: 700;">${d.element||"Structural Element"}</td>
                <td style="font-size: 7.5px; line-height: 1.4; color: #334155;">${d.comments||d.text||"Routine inspection observation"}</td>
                <td>${d.inspector||m}${d.vendorCheck?` / ${d.vendorCheck}`:""}</td>
                <td style="text-align: center; font-weight: 800; color: ${a}; font-size: 7.5px;">${C}</td>
              </tr>
            `}).join(""):`
          <tr>
            <td colspan="7" style="text-align: center; color: #64748b; padding: 24px;">
              Zero outstanding quality observations recorded for this surveillance cycle.
            </td>
          </tr>
        `;w.push(`
      <div class="pdf-sheet">
        <div>
          ${H("APPENDIX: SITE COMMENTS / OBSERVATION LOG")}
          
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
              ${e}
            </tbody>
          </table>
        </div>
        ${Q(w.length+1)}
      </div>
    `)}D.length>0&&D.forEach((e,d)=>{const S=typeof e=="string"?e:e.url,C=typeof e=="object"&&e.caption&&e.caption.trim().length>0?e.caption:`SPECIMEN ${d+1} | AS-BUILT SITE QUALITY RECORD`;w.push(`
        <div class="pdf-sheet">
          <div>
            ${H(`PICTORIAL SURVEILLANCE RECORD (SPECIMEN ${d+1} OF ${D.length})`)}
            
            <div style="height: 154mm; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; position: relative; margin-top: 6px;">
              <!-- Photo Viewport -->
              <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 6px; overflow: hidden; background: #ffffff;">
                <img src="${S}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 2px;" alt="${C}" />
              </div>

              <!-- Dark Caption Ribbon -->
              <div style="background: #0f172a; border-left: 5px solid #ea580c; color: #ffffff; padding: 10px 16px; font-size: 8.5px; font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
                <span style="letter-spacing: 0.3px; text-transform: uppercase;">
                  ${C}
                </span>
                <span style="color: #94a3b8; font-family: monospace; font-size: 7.5px;">
                  SPECIMEN ${d+1} / ${D.length}
                </span>
              </div>
            </div>
          </div>
          ${Q(w.length+1)}
        </div>
      `)});const _t=dt>0?`${dt} Holds Active / Pending Sign-off`:"All Quality Checks Conforming & Approved";t.synopsis||t.executiveSummary,w.push(`
    <div class="pdf-sheet" style="padding: 0; display: flex; flex-direction: row; height: 210mm; overflow: hidden; position: relative;">
      <!-- Left Dark Emerald Panel (~30% width) -->
      <div style="width: 30%; background: #091a18; color: #ffffff; padding: 28mm 12mm 16mm 14mm; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <!-- Company Brand -->
          <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: flex-end; gap: 2px; margin-bottom: 6px; justify-content: center;">
              ${g?`<img src="${g}" style="max-height: 150px; max-width: 200px; object-fit: contain;" alt="${y}" />`:`
                <div style="display: flex; gap: 3px; align-items: flex-end; height: 24px;">
                  <span style="width: 4.5px; height: 12px; background: #c28b5e; border-radius: 1px;"></span>
                  <span style="width: 4.5px; height: 22px; background: #c28b5e; border-radius: 1px;"></span>
                  <span style="width: 4.5px; height: 16px; background: #c28b5e; border-radius: 1px;"></span>
                </div>
              `}
            </div>
            <div style="font-size: 13px; text-align: center; font-weight: 700; color: #FFFFFF; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 5px;">
              ${h.toUpperCase()}
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
              DOC-ID: ${v}
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
              ${n.toUpperCase()} DEVELOPMENT
            </h3>
            <p style="font-size: 7.5px; color: #64748b; margin: 0;">
              Weekly Structural Quality Control, Surveillance &amp; Materials Conformance Audit
            </p>
          </div>

          <!-- Key Metadata Grid (2x2) -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 10px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; font-size: 8px; margin-bottom: 12px;">
            <div>
              <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Reporting Period</p>
              <p style="font-weight: 700; color: #1e293b; margin: 0;">${c} – ${i}</p>
            </div>
            <div>
              <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Structure Level</p>
              <p style="font-weight: 700; color: #1e293b; margin: 0;">${K}</p>
            </div>
            <div>
              <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Inspection Status</p>
              <p style="font-weight: 700; color: ${dt>0?"#dc2626":"#16a34a"}; margin: 0;">${_t}</p>
            </div>
            <div>
              <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Revision Control</p>
              <p style="font-weight: 700; color: #1e293b; margin: 0;">Rev 1.0 (Final Submission)</p>
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
                  ${m}
                </h4>
                <p style="font-size: 8px; font-weight: 800; color: #047857; text-transform: uppercase; margin: 0;">
                  ${o}
                </p>
              </div>
              
              <!-- Stamp / Verification Badge Indicator -->
              <div style="display: flex; align-items: center; gap: 8px;">
                ${R?`<img src="${R}" style="max-height: 38px; max-width: 100px; object-fit: contain;" alt="Signature" />`:""}
                <div style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgba(5, 150, 105, 0.4); display: flex; align-items: center; justify-content: center; font-size: 7px; font-weight: 900; color: #065f46; text-transform: uppercase; text-align: center; line-height: 1.15; background: #ecfdf5;">
                  VERIFIED<br />QA/QC
                </div>
              </div>
            </div>

            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b;">
              <span>Email: <strong style="color: #334155; font-weight: 700;">${l}</strong></span>
              <span>Issued: <strong style="color: #334155; font-weight: 700;">${Y(b)}</strong></span>
            </div>
          </div>

          <!-- Legal Footer -->
          <div style="padding-top: 8px; margin-top: 8px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; font-size: 7px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
            <span>CONFIDENTIAL | PREPARED FOR CLIENT &amp; SUPERVISING CONSULTANT</span>
            <span>PAGE ${w.length+1} OF ${w.length+1}</span>
          </div>
        </div>

      </div>
    </div>
  `);const Lt=`
    @page {
      size: A4 landscape !important;
      margin: 0 !important;
    }

    @media print {
      html, body {
        width: 297mm !important;
        height: 210mm !important;
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
      width: 297mm !important;
      height: 210mm !important;
      max-height: 210mm !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      padding: 7mm 12mm 5mm 12mm;
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
      height: 1.5px;
      background: #0f172a;
    }

    .pdf-footer {
      padding-top: 5px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pdf-slide-badge {
      background: #0f172a;
      color: #ffffff;
      font-size: 7.5px;
      font-weight: 800;
      padding: 2.5px 10px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5px;
    }

    .data-table th {
      background: #0f172a !important;
      color: #ffffff !important;
      font-weight: 800;
      font-size: 7.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 6px 8px;
      border: 1px solid #0f172a;
      text-align: left;
    }

    .data-table td {
      padding: 4.5px 8px;
      border: 1px solid #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
    }

    .data-table tr:nth-child(even) td {
      background: #f8fafc;
    }

    .badge-approved {
      background: #ecfdf5 !important;
      color: #059669 !important;
      border: 1px solid #a7f3d0;
      border-radius: 4px;
      padding: 1.5px 7px;
      font-weight: 800;
      font-size: 7px;
      text-transform: uppercase;
      display: inline-block;
    }

    .badge-rejected {
      background: #fef2f2 !important;
      color: #dc2626 !important;
      border: 1px solid #fecaca;
      border-radius: 4px;
      padding: 1.5px 7px;
      font-weight: 800;
      font-size: 7px;
      text-transform: uppercase;
      display: inline-block;
    }

    .badge-pending {
      background: #f8fafc !important;
      color: #64748b !important;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 1.5px 7px;
      font-weight: 800;
      font-size: 7px;
      text-transform: uppercase;
      display: inline-block;
    }
  `,kt=w.join(`
`);Z(`${v} - QA/QC Weekly Surveillance Report (Landscape Slide Deck)`,kt,Lt)}function Re(t,p="All Levels",x={},f={}){const y=f.name||"Apex Civil Engineering",h=x.name||"Site Quality Assessment",g=$(new Date),n=`CQ-REG-${p.toUpperCase().replace(/[^A-Z0-9]/g,"-")}-${Date.now().toString().slice(-6)}`,v=t.length,s=t.filter(o=>o.status==="CURING"||o.status==="PENDING").length,u=t.filter(o=>{var l,R;return o.day7Results&&o.day7Results.length>0||((R=(l=o.tests)==null?void 0:l.day7)==null?void 0:R.averageStrengthNmm2)}),N=u.filter(o=>{var P,L,k,j;const l=((L=(P=o.day7Results)==null?void 0:P[0])==null?void 0:L.averageStrength)||((j=(k=o.tests)==null?void 0:k.day7)==null?void 0:j.averageStrengthNmm2)||0,R=o.target28DayStrengthNmm2||o.day28Required||30,E=o.day7Required||Math.round(R*.7*10)/10;return l>=E}).length,I=u.length>0?Math.round(N/u.length*100):100,A=t.filter(o=>{var l,R;return o.day28Results&&o.day28Results.length>0||((R=(l=o.tests)==null?void 0:l.day28)==null?void 0:R.averageStrengthNmm2)}),c=A.filter(o=>{var E,P,L,k;const l=((P=(E=o.day28Results)==null?void 0:E[0])==null?void 0:P.averageStrength)||((k=(L=o.tests)==null?void 0:L.day28)==null?void 0:k.averageStrengthNmm2)||0,R=o.target28DayStrengthNmm2||o.day28Required||30;return l>=R}).length,i=A.length>0?Math.round(c/A.length*100):100,b=t.filter(o=>o.status==="APPROVED"||o.status==="28-DAY DONE").length,r=t.filter(o=>o.status==="NCR_ISSUED"||o.status==="REJECTED"||o.ncrGenerated).length,m=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${X(f,x)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">CONCRETE QUALITY & COMPRESSIVE STRENGTH REGISTER</div>
          <div class="header-title-project">PROJECT: ${h}</div>
          <div class="header-title-iso">BS EN 12390-3 / BS EN 206-1 / ASTM C39 Concrete Conformance Register</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${n}</span></div>
          <div><strong>Scope / Level:</strong> <span style="font-weight:700; color:#0f172a;">${p}</span></div>
          <div><strong>Report Date:</strong> ${g}</div>
          <div><strong>Total Samples:</strong> ${v} specimen sets</div>
        </td>
      </tr>
    </table>

    <!-- 1.0 Executive Quality Statistics -->
    <div class="pdf-section">
      <div class="section-banner">1.0 CONCRETE COMPLIANCE SUMMARY & QUALITY STATISTICS</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 20%;">LOCATION / FILTER:</td>
          <td class="grid-value" style="width: 30%; font-weight:700; color:#0f172a;">${p}</td>
          <td class="grid-label" style="width: 20%;">TOTAL SAMPLES LOGGED:</td>
          <td class="grid-value" style="width: 30%; font-weight:800; font-size:9.5px; font-family:monospace;">${v} Specimens</td>
        </tr>
        <tr>
          <td class="grid-label">28-DAY COMPLIANCE RATE:</td>
          <td class="grid-value">
            <span style="font-weight:800; font-size:10px; color:${i>=95?"#15803d":"#b91c1c"};">${i}%</span>
            <span style="font-size:7.5px; color:#64748b; margin-left:4px;">(${c}/${A.length} tested sets compliant)</span>
          </td>
          <td class="grid-label">7-DAY EARLY STRENGTH:</td>
          <td class="grid-value">
            <span style="font-weight:800; font-size:9.5px; color:#0369a1;">${I}%</span>
            <span style="font-size:7.5px; color:#64748b; margin-left:4px;">(${N}/${u.length} tested sets compliant)</span>
          </td>
        </tr>
        <tr>
          <td class="grid-label">APPROVED CERTIFICATES:</td>
          <td class="grid-value" style="color:#15803d; font-weight:800;">${b} Fully Certified</td>
          <td class="grid-label">ACTIVE NCRS / DEFECTIVE:</td>
          <td class="grid-value" style="color:${r>0?"#b91c1c":"#15803d"}; font-weight:800;">${r} Non-Conforming</td>
        </tr>
        <tr>
          <td class="grid-label">IN CURING TANKS:</td>
          <td class="grid-value" style="color:#0284c7; font-weight:700;">${s} In Curing Water Tanks</td>
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
          ${t.length>0?t.map(o=>{var q,W,U,D,st,nt,ot,J;const l=o.target28DayStrengthNmm2||o.day28Required||30,R=o.day7Required||Math.round(l*.7*10)/10,E=((W=(q=o.day7Results)==null?void 0:q[0])==null?void 0:W.averageStrength)??((D=(U=o.tests)==null?void 0:U.day7)==null?void 0:D.averageStrengthNmm2),P=E!=null?E>=R:null,L=((nt=(st=o.day28Results)==null?void 0:st[0])==null?void 0:nt.averageStrength)??((J=(ot=o.tests)==null?void 0:ot.day28)==null?void 0:J.averageStrengthNmm2),k=L!=null?L>=l:null,j=o.status==="NCR_ISSUED"||o.status==="REJECTED"||o.ncrGenerated||!!o.ncrNumber;return`
              <tr>
                <td>
                  <div style="font-weight: 800; color: #0f172a;">${o.sampleId||o.sampleNumber||"—"}</div>
                  ${o.inscribedName?`<div style="font-size: 7px; color: #64748b;">Mark: ${o.inscribedName}</div>`:""}
                </td>
                <td>
                  <div style="font-weight: 700;">${o.structureElement||o.elementName||"Structural Element"}</div>
                  ${o.supplier?`<div style="font-size: 7px; color: #64748b;">${o.supplier}</div>`:""}
                </td>
                <td>${[o.level||o.levelName,o.zone].filter(Boolean).join(" • ")||"Site"}</td>
                <td style="font-weight: 700; font-family: monospace;">${o.concreteGrade||"C30"} (${l})</td>
                <td>${$(o.castDate)}</td>
                <td style="font-family: monospace;">${o.slumpMm||o.slumpValue||"—"} mm</td>
                <td>
                  ${E!=null?`<div style="font-family: monospace; font-weight: 800; color: ${P?"#15803d":"#b91c1c"};">${E} MPa</div>
                         <div style="font-size: 6.8px; color: ${P?"#15803d":"#b91c1c"}; font-weight: 700;">(${P?"PASS":"FAIL"} - Min ${R})</div>`:'<span style="color: #94a3b8; font-size: 7.5px;">Pending</span>'}
                </td>
                <td>
                  ${L!=null?`<div style="font-family: monospace; font-weight: 800; color: ${k?"#15803d":"#b91c1c"};">${L} MPa</div>
                         <div style="font-size: 6.8px; color: ${k?"#15803d":"#b91c1c"}; font-weight: 700;">(${k?"PASS":"FAIL"} - Min ${l})</div>`:'<span style="color: #94a3b8; font-size: 7.5px;">In Curing</span>'}
                </td>
                <td>
                  ${j?`<span class="badge-fail">NCR: ${o.ncrNumber||"ISSUED"}</span>`:o.status==="APPROVED"||k?'<span class="badge-pass">APPROVED</span>':`<span class="badge-pending">${o.status||"IN PROGRESS"}</span>`}
                </td>
              </tr>
            `}).join(""):`
              <tr>
                <td colspan="9" style="text-align: center; color: #64748b; padding: 14px;">
                  No concrete specimen records found for ${p}.
                </td>
              </tr>
            `}
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
              <span>Date: ${g}</span>
            </div>
          </td>
          <td style="width: 33.3%;">
            <div class="sig-role-header"><span>QA/QC MANAGER</span><span class="sig-required-tag">APPROVED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>QA/QC Manager</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${g}</span>
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
      <div>CONFIDENTIAL & PROPRIETARY — ${y}</div>
      <div>Report Ref: ${n} • Filter: ${p}</div>
    </div>
  `;Z(`${n} - Concrete Quality Register (${p})`,m)}function Ae(t,p,x){var I,A,c,i,b,r,m,o;const f=(x==null?void 0:x.name)||t.companyName||"JQMS Civil Infrastructure",y=(p==null?void 0:p.name)||t.projectName||"Civil Engineering Construction Project",h=(p==null?void 0:p.code)||"PRJ-001",g=t.instructionNumber||`SI-${t.id.slice(0,8).toUpperCase()}`,n=$(((I=t.signedBy)==null?void 0:I.signedAt)||t.createdAt),v=$(t.complianceDeadline),s=t.severity==="STOP_WORK"||t.severity==="CRITICAL"?"#dc2626":t.severity==="HIGH"?"#ea580c":"#2563eb",u=t.severity==="STOP_WORK"?"INTERNAL WORK HOLD DIRECTIVE":t.severity==="CRITICAL"?"CRITICAL INTERNAL QUALITY DIRECTIVE":t.severity==="HIGH"?"HIGH PRIORITY RECTIFICATION NOTICE":"STANDARD QUALITY DIRECTIVE",N=`
    <!-- ═══ DOCUMENT HEADER ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${X(x,p)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main" style="color: ${s};">
            INTERNAL SITE INSTRUCTION
          </div>
          <div style="font-size: 8px; font-weight: 800; letter-spacing: 0.8px; color: #475569; text-transform: uppercase; margin-top: 1px;">
            INTERNAL QUALITY CONTROL & REMEDIATION DIRECTIVE
          </div>
          <div class="header-title-project">${y} (${h})</div>
        </td>
        <td style="width: 25%; font-size: 8px; vertical-align: top; background: #fafafa;">
          <div style="margin-bottom: 2px;">Doc Ref: <strong style="font-family: monospace; font-size: 8.5px; color: #0f172a;">${g}</strong></div>
          <div style="margin-bottom: 2px;">Issue Date: <strong>${n}</strong></div>
          <div style="margin-bottom: 2px;">Target Rectification: <strong style="color: #dc2626;">${v}</strong></div>
          <div>Status: <span style="background: #e0f2fe; color: #0369a1; font-weight: 800; padding: 1px 4px; border-radius: 2px; font-size: 7px;">${t.status||"ISSUED"}</span></div>
        </td>
      </tr>
    </table>

    <!-- ═══ INTERNAL SEVERITY BANNER ═══ -->
    <div style="background: ${s}; color: #ffffff; padding: 5px 10px; border-radius: 4px; font-weight: 800; font-size: 9px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; letter-spacing: 0.5px;">
      <span>⚠️ NOTICE CATEGORY: ${u}</span>
      <span>ACTION REQUIRED BY: ${v}</span>
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
              ${t.issuingDepartment||"Quality Assurance & Control (QA/QC)"}
            </td>
            <td style="width: 18%; background: #f8fafc; padding: 6px 8px; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 7.5px; border-right: 1px solid #e2e8f0;">
              ACTION ASSIGNED TO
            </td>
            <td style="width: 32%; padding: 6px 8px; color: #0f172a; font-weight: 700;">
              ${t.recipientName||"Project Site Manager / Execution Engineer"}
              ${t.recipientRole?`<span style="color: #64748b; font-weight: 500; font-size: 7.5px;">(${t.recipientRole})</span>`:""}
            </td>
          </tr>

          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="background: #f8fafc; padding: 6px 8px; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 7.5px; border-right: 1px solid #e2e8f0;">
              LOCATION / LEVEL
            </td>
            <td style="padding: 6px 8px; color: #0f172a; font-weight: 600; border-right: 1px solid #cbd5e1;">
              <span style="background: #f1f5f9; color: #334155; padding: 1.5px 6px; border-radius: 3px; font-weight: 700; border: 1px solid #e2e8f0;">
                ${t.location||t.levelName||"Site Wide"}
              </span>
            </td>
            <td style="background: #f8fafc; padding: 6px 8px; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 7.5px; border-right: 1px solid #e2e8f0;">
              STRUCTURAL ELEMENT
            </td>
            <td style="padding: 6px 8px; color: #0369a1; font-weight: 800;">
              ${t.elementName||"Refer to detailed defect description"}
            </td>
          </tr>

          <tr>
            <td style="background: #f8fafc; padding: 6px 8px; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 7.5px; border-right: 1px solid #e2e8f0;">
              QUALITY / SPEC STD
            </td>
            <td style="padding: 6px 8px; color: #0f172a; font-weight: 600; border-right: 1px solid #cbd5e1;">
              ${t.specReference||"Internal Quality Standards / Project Technical Specs"}
            </td>
            <td style="background: #f8fafc; padding: 6px 8px; color: #475569; font-weight: 700; text-transform: uppercase; font-size: 7.5px; border-right: 1px solid #e2e8f0;">
              DRAWING REF
            </td>
            <td style="padding: 6px 8px; color: #0f172a; font-weight: 600;">
              <span style="font-family: monospace; font-size: 8.5px; background: #fafafa; padding: 1px 4px; border: 1px solid #f1f5f9; border-radius: 2px;">
                ${t.drawingNumber||"Approved Construction Drawings"}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ═══ 2.0 INTERNAL NCR CROSS-REFERENCE ═══ -->
    ${t.ncrNumber||t.ncrId?`
    <div class="pdf-section">
      <div class="section-banner" style="background: #7f1d1d; color: #ffffff;">2.0 CROSS-REFERENCE TO INTERNAL NON-CONFORMANCE REPORT (NCR)</div>
      <table class="meta-table" style="border-left: 3px solid #dc2626;">
        <tr>
          <td class="meta-label" style="background: #fef2f2; color: #991b1b;">LINKED NCR REF:</td>
          <td class="meta-value" style="font-weight: 800; color: #b91c1c; font-family: monospace;">${t.ncrNumber||"NCR"}</td>
          <td class="meta-label" style="background: #fef2f2; color: #991b1b;">ORIGINAL TARGET DATE:</td>
          <td class="meta-value"><strong>${$(t.ncrDeadline)}</strong></td>
        </tr>
        <tr>
          <td class="meta-label" style="background: #fef2f2; color: #991b1b;">OVERDUE STATUS:</td>
          <td class="meta-value">
            <span style="background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 3px; font-weight: 800; font-size: 8px; border: 1px solid #f87171;">
              ⚠️ UNRESOLVED QUALITY DEFECT ${t.ncrDaysOverdue?`(${t.ncrDaysOverdue} DAYS OVERDUE)`:""}
            </span>
          </td>
          <td class="meta-label" style="background: #fef2f2; color: #991b1b;">SEVERITY LEVEL:</td>
          <td class="meta-value"><strong>${t.ncrSeverity||"HIGH"}</strong></td>
        </tr>
        <tr>
          <td class="meta-label" style="background: #fef2f2; color: #991b1b;">DEFECT SUMMARY:</td>
          <td class="meta-value" colspan="3">${t.ncrTitle||t.issueSummary}</td>
        </tr>
      </table>
    </div>
    `:""}

    <!-- ═══ 3.0 IMMEDIATE WORK HOLD (IF ORDERED) ═══ -->
    ${t.stopWorkOrdered?`
    <div style="background: #7f1d1d; color: #ffffff; border: 1.5px solid #dc2626; padding: 8px 12px; border-radius: 4px; margin-bottom: 8px; text-align: center;">
      <div style="font-size: 11px; font-weight: 900; letter-spacing: 0.8px; margin-bottom: 2px;">🛑 MANDATORY WORK HOLD ORDERED</div>
      <div style="font-size: 8px; font-weight: 600; opacity: 0.95;">
        Per internal project quality control guidelines, ALL further casting, assembly, or installation on the affected section MUST STOP immediately until remedial actions are verified by QA/QC.
      </div>
    </div>
    `:""}

    <!-- ═══ 4.0 INSTRUCTION SUBJECT & DIRECTIVE ═══ -->
    <div class="pdf-section">
      <div class="section-banner">3.0 TECHNICAL DIRECTIVE & RECTIFICATION SCOPE</div>
      <div style="border: 1px solid #cbd5e1; border-top: none; padding: 8px 10px; background: #ffffff;">
        <div style="margin-bottom: 6px;">
          <span style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase;">DIRECTIVE SUBJECT:</span>
          <div style="font-size: 10px; font-weight: 800; color: #0f172a; margin-top: 1px;">${t.subject||t.title}</div>
        </div>

        <div style="margin-bottom: 6px;">
          <span style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase;">DEFECT / QUALITY OBSERVATION:</span>
          <div style="font-size: 8.5px; color: #334155; line-height: 1.45; margin-top: 2px; white-space: pre-wrap;">${t.issueSummary||"No issue summary recorded."}</div>
        </div>

        <div>
          <span style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase;">REQUIRED ACTION & SPECIFICATION:</span>
          <div style="font-size: 8.5px; color: #0f172a; line-height: 1.45; margin-top: 2px; background: #f8fafc; padding: 6px 8px; border-left: 3px solid #0284c7; border-radius: 2px; white-space: pre-wrap;">${t.instructionText||"Execute corrective work as specified below."}</div>
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
          ${t.mandatoryActions&&t.mandatoryActions.length>0?t.mandatoryActions.map((l,R)=>`
                <tr>
                  <td style="text-align: center; font-weight: 800; color: #ea580c;">${R+1}.0</td>
                  <td style="font-weight: 600; color: #0f172a;">${l}</td>
                  <td style="text-align: center; font-weight: 700; color: #dc2626;">${v}</td>
                </tr>
              `).join(""):`
                <tr>
                  <td style="text-align: center; font-weight: 800;">1.0</td>
                  <td>Execute complete remediation of identified defect according to internal project quality guidelines.</td>
                  <td style="text-align: center; font-weight: 700;">${v}</td>
                </tr>
                <tr>
                  <td style="text-align: center; font-weight: 800;">2.0</td>
                  <td>Notify QA/QC team for re-inspection and sign-off upon completion of corrective actions.</td>
                  <td style="text-align: center; font-weight: 700;">${v}</td>
                </tr>
              `}
        </tbody>
      </table>
    </div>

    <!-- ═══ 6.0 INTERNAL GOVERNANCE ═══ -->
    <div class="pdf-section">
      <div class="section-banner">5.0 INTERNAL QUALITY GOVERNANCE</div>
      <div style="border: 1px solid #cbd5e1; border-top: none; padding: 6px 10px; background: #fafafa; font-size: 7.8px; color: #475569; line-height: 1.4;">
        <div style="margin-bottom: 3px;">
          <strong>Governance Standard:</strong> ${t.contractualClause||"ISO 9001:2015 Clause 8.7 (Control of Nonconforming Outputs) & Internal Quality Management System Rules."}
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
                <div>Full Name: <strong>${((A=t.signedBy)==null?void 0:A.name.toUpperCase())||"Authorized Quality Authority"}</strong></div>
                <div>Designation: <strong>${((c=t.signedBy)==null?void 0:c.designation)||((i=t.signedBy)==null?void 0:i.role)||"QA/QC Lead Engineer"}</strong></div>
                <div style="font-size: 7.5px; color: #64748b; font-style: italic; margin-top: 4px;">
                  "${((b=t.signedBy)==null?void 0:b.declaration)||"Issued in accordance with company internal quality control standards."}"
                </div>
              </div>

              <div style="text-align: center; min-width: 170px; padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; background: #ffffff;">
                <div style="font-size: 7px; font-weight: 800; color: #0284c7; text-transform: uppercase; margin-bottom: 2px;">
                  Digital Signature
                </div>
                ${(r=t.signedBy)!=null&&r.signatureUrl?`<img src="${t.signedBy.signatureUrl}" style="max-height: 44px; max-width: 150px; object-fit: contain; margin: 0 auto;" alt="Signature" />`:`<div style="height: 36px; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 10px; font-weight: bold; color: #0284c7;">${((m=t.signedBy)==null?void 0:m.name)||"ELECTRONICALLY SIGNED"}</div>`}
                <div style="font-family: monospace; font-size: 6.5px; color: #94a3b8; border-top: 0.5px solid #f1f5f9; padding-top: 2px; margin-top: 2px;">
                  ID: ${((o=t.signedBy)==null?void 0:o.digitalSignatureStamp)||`JQMS-SI-${t.id.slice(0,8).toUpperCase()}`}
                </div>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- ═══ DOCUMENT FOOTER ═══ -->
    <div class="doc-footer">
      <div>INTERNAL QUALITY DIRECTIVE — ${f}</div>
      <div>Document Ref: ${g} </div>
    </div>
  `;Z(`${g} - Internal Site Instruction`,N)}function Ce(t,p={},x={}){var u,N,I,A,c,i,b,r,m,o;const f=x.name||"JQMS ENTERPRISE QUALITY MANAGEMENT",y=p.name||t.projectName||"CONSTRUCTION PROJECT",h=p.code||"PRJ",g=t.mirNumber||"MIR-DRAFT",n=l=>{switch(l){case"ACCEPTED":return'<span style="display:inline-block; padding: 3px 10px; background: #dcfce7; color: #15803d; border: 1.5px solid #86efac; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">ACCEPTED / APPROVED</span>';case"ACCEPTED_AS_NOTED":return'<span style="display:inline-block; padding: 3px 10px; background: #dbeafe; color: #1d4ed8; border: 1.5px solid #93c5fd; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">ACCEPTED AS NOTED</span>';case"REJECTED":return'<span style="display:inline-block; padding: 3px 10px; background: #fee2e2; color: #b91c1c; border: 1.5px solid #fca5a5; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">REJECTED / NON-COMPLIANT</span>';case"HOLD_FOR_TESTING":return'<span style="display:inline-block; padding: 3px 10px; background: #fef3c7; color: #b45309; border: 1.5px solid #fcd34d; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">HOLD FOR LAB TESTING</span>';default:return'<span style="display:inline-block; padding: 3px 10px; background: #f1f5f9; color: #475569; border: 1.5px solid #cbd5e1; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">PENDING INSPECTION</span>'}},v=t.items&&t.items.length>0?t.items.map((l,R)=>`
        <tr>
          <td style="text-align: center; font-weight: bold; width: 30px;">${R+1}</td>
          <td style="font-weight: 600; color: #0f172a;">${l.description||"Material Item"}</td>
          <td style="font-size: 7.5px; color: #475569;">${l.specificationRef||"—"}</td>
          <td style="text-align: right; font-weight: bold;">${l.quantityDelivered}</td>
          <td style="text-align: right;">${l.quantityInspected}</td>
          <td style="text-align: right; color: #15803d; font-weight: bold;">${l.quantityAccepted}</td>
          <td style="text-align: right; color: ${l.quantityRejected>0?"#b91c1c":"#64748b"}; font-weight: bold;">${l.quantityRejected}</td>
          <td style="text-align: center; text-transform: uppercase; font-size: 7.5px;">${l.unit||"units"}</td>
          <td style="font-size: 7.5px; color: #475569;">${l.remarks||"—"}</td>
        </tr>
      `).join(""):'<tr><td colspan="9" style="text-align:center; padding: 12px; color: #64748b;">No individual line items registered. Full delivery inspected as described.</td></tr>',s=`
    <!-- ═══ 1.0 HEADER TABLE ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${X(x,p)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">MATERIAL INSPECTION REPORT (MIR)</div>
          <div class="header-title-project">${y} (${h})</div>
          <div class="header-title-iso">ISO 9001:2015 CLAUSE 8.4 — RECEIVING INSPECTION & VERIFICATION</div>
        </td>
        <td class="header-meta-cell">
          <div class="header-meta-row">
            <span class="header-meta-label">MIR NO:</span>
            <span class="header-meta-val" style="color: #ea580c; font-weight: 900;">${g}</span>
          </div>
          <div class="header-meta-row">
            <span class="header-meta-label">DISCIPLINE:</span>
            <span class="header-meta-val">${t.discipline||"Civil & Structural"}</span>
          </div>
          <div class="header-meta-row">
            <span class="header-meta-label">INSP DATE:</span>
            <span class="header-meta-val">${$(t.inspectionDate)}</span>
          </div>
          <div class="header-meta-row">
            <span class="header-meta-label">STATUS:</span>
            <span class="header-meta-val">${t.status||"INSPECTED"}</span>
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
          <td style="width: 32%; font-weight: 800; font-size: 9px; color: #0f172a;">${t.title}</td>
          <td class="label-cell" style="width: 18%;">Approved MAR Ref:</td>
          <td style="width: 32%; font-weight: 700; color: #0284c7;">${t.marNumber||"— (Direct Site Receiving)"}</td>
        </tr>
        <tr>
          <td class="label-cell">Supplier / Vendor:</td>
          <td style="font-weight: 600;">${t.supplierVendor||"—"}</td>
          <td class="label-cell">Manufacturer:</td>
          <td>${t.manufacturer||"—"}</td>
        </tr>
        <tr>
          <td class="label-cell">Delivery Date:</td>
          <td>${$(t.deliveryDate)}</td>
          <td class="label-cell">Gate Ticket / Waybill:</td>
          <td style="font-family: monospace; font-weight: bold;">${t.deliveryNumber||"—"}</td>
        </tr>
        <tr>
          <td class="label-cell">Purchase Order (PO):</td>
          <td style="font-family: monospace;">${t.poNumber||"—"}</td>
          <td class="label-cell">Laydown / Storage:</td>
          <td>${t.storageLocation||"On-Site Storage / Laydown Area"}</td>
        </tr>
        <tr>
          <td class="label-cell">Current Disposition:</td>
          <td colspan="3">${n(t.disposition)}</td>
        </tr>
      </table>
    </div>

    <!-- ═══ 3.0 VERIFICATION MATRIX ═══ -->
    <div class="pdf-section">
      <div class="section-banner">2.0 PHYSICAL & STATUTORY COMPLIANCE CHECKPOINTS</div>
      <table class="data-table">
        <tr>
          <td style="width: 25%; font-weight: 600;">Packaging / Physical Condition:</td>
          <td style="width: 25%; font-weight: 700; color: ${t.packagingCondition==="DAMAGED"?"#b91c1c":"#15803d"};">
            ${t.packagingCondition==="DAMAGED"?"❌ DAMAGED":t.packagingCondition==="COMPROMISED"?"⚠️ COMPROMISED":"✅ SATISFACTORY / SOUND"}
          </td>
          <td style="width: 25%; font-weight: 600;">Mill Test Certificate (MTC):</td>
          <td style="width: 25%; font-weight: 700; color: ${t.millCertificateProvided?"#15803d":"#b91c1c"};">
            ${t.millCertificateProvided?"✅ PROVIDED & VERIFIED":"❌ MISSING / PENDING"}
          </td>
        </tr>
        <tr>
          <td style="font-weight: 600;">Dimensional / Visual Check:</td>
          <td style="font-weight: 700; color: ${t.physicalDimensionsCheck==="PASS"?"#15803d":t.physicalDimensionsCheck==="FAIL"?"#b91c1c":"#64748b"};">
            ${t.physicalDimensionsCheck==="PASS"?"✅ PASS / CONFORMING":t.physicalDimensionsCheck==="FAIL"?"❌ FAIL / NON-CONFORMING":"⚪ NOT APPLICABLE"}
          </td>
          <td style="font-weight: 600;">Laboratory Sampling:</td>
          <td style="font-weight: 700;">
            ${t.samplingRequired?`🔬 REQUIRED (Sample Tag: ${t.sampleTagNumber||"Assigned"})`:"⚪ NO SAMPLING REQUIRED"}
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
          ${v}
        </tbody>
      </table>
    </div>

    <!-- ═══ 4.0 NOTES & REMARKS ═══ -->
    <div class="pdf-section">
      <div class="section-banner">4.0 INSPECTION OBSERVATIONS & REQUIRED ACTIONS</div>
      <div style="border: 1px solid #cbd5e1; border-top: none; background: #ffffff; padding: 8px 10px; display: flex; flex-direction: column; gap: 8px;">
        <div>
          <div style="font-size: 7.5px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">QA/QC Receiving Observations & Inspector Notes:</div>
          ${Ut(t.inspectionNotes,"Materials visually checked and verified compliant with delivery waybill and approved submittal specification.")}
        </div>
        ${t.rejectionReasons?`
        <div style="margin-top: 4px;">
          <div style="font-size: 7.5px; font-weight: 800; color: #b91c1c; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Defects, Non-Conformances & Technical Justifications:</div>
          ${Ut(t.rejectionReasons)}
        </div>
        `:""}
        ${t.actionRequired?`
        <div style="margin-top: 4px;">
          <div style="font-size: 7.5px; font-weight: 800; color: #d97706; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Mandatory Action & Quarantine Requirements:</div>
          ${Ut(t.actionRequired)}
        </div>
        `:""}
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
                ${n(((u=t.qaqcSignOff)==null?void 0:u.verdict)||((N=t.consultantSignOff)==null?void 0:N.verdict)||t.disposition)}
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 2.2fr; gap: 12px; font-size: 8px; line-height: 1.6; color: #1e293b; margin-bottom: 6px;">
              <div style="border-right: 1px dashed #fed7aa; padding-right: 10px;">
                <div>QA/QC Engineer: <strong>${((I=t.qaqcSignOff)==null?void 0:I.name)||((A=t.consultantSignOff)==null?void 0:A.name)||((c=t.inspectedBy)==null?void 0:c.name)||"QA/QC Engineer"}</strong></div>
                <div>Designation: <strong>${((i=t.qaqcSignOff)==null?void 0:i.designation)||"QA/QC Engineer"}</strong></div>
                <div>Date of Endorsement: <strong>${$(((b=t.qaqcSignOff)==null?void 0:b.date)||((r=t.consultantSignOff)==null?void 0:r.date)||t.inspectionDate)}</strong></div>
                <div style="margin-top: 4px; color: #15803d; font-weight: bold; font-size: 7.5px;">
                  ✓ Electronically Authenticated Endorsement
                </div>
              </div>
              <div>
                <div style="font-weight: 800; color: #9a3412; font-size: 7.5px; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Official QA/QC Commentary, Directives & Liability Disclaimers:</div>
                ${Ut(((m=t.qaqcSignOff)==null?void 0:m.comments)||((o=t.consultantSignOff)==null?void 0:o.comments),"Materials inspected at site receiving laydown. Verified compliant with approved submittal & material specifications.")}
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
    ${(()=>{var E,P,L,k,j,q,W;const l=t.stakeholders&&t.stakeholders.length>0?t.stakeholders:[{role:"Contractor Quality Representative",name:((E=t.contractorSignOff)==null?void 0:E.name)||((P=t.inspectedBy)==null?void 0:P.name)||"Contractor Quality Representative",designation:"Site QA/QC Inspector",required:!0,signed:!!((L=t.contractorSignOff)!=null&&L.signed||(k=t.inspectedBy)!=null&&k.date),signedAt:((j=t.contractorSignOff)==null?void 0:j.date)||((q=t.inspectedBy)==null?void 0:q.date)||t.inspectionDate},...(W=t.consultantSignOff)!=null&&W.signed?[{role:"Supervising Consultant / Resident Engineer",name:t.consultantSignOff.name,designation:"Resident Engineer",required:!1,signed:!0,signedAt:t.consultantSignOff.date}]:[]];if(l.length===0)return"";const R=[];for(let U=0;U<l.length;U+=2)R.push(l.slice(U,U+2));return`
      <div class="pdf-section">
        <div class="section-banner">6.0 STATUTORY STAKEHOLDER SIGN-OFF AUTHORIZATIONS</div>
        <table class="signoff-table">
          ${R.map(U=>`
            <tr>
              ${U.map(D=>`
                <td style="width: 50%; padding: 8px 12px; vertical-align: top; background: ${D.signed?"#f0fdf4":"#ffffff"};">
                  <div class="sig-role-header">
                    <span>${D.role}</span>
                    <span class="sig-required-tag" style="${D.signed?"background: #dcfce7; color: #166534; border-color: #86efac;":D.required?"background: #fee2e2; color: #991b1b; border-color: #fca5a5;":"background: #f1f5f9; color: #475569; border-color: #cbd5e1;"}">
                      ${D.signed?"VERIFIED & SIGNED":D.required?"REQUIRED":"OPTIONAL"}
                    </span>
                  </div>
                  <div style="font-size: 8px; line-height: 1.5; color: #1e293b; margin-top: 4px;">
                    <div>Name: <strong>${D.name||"— (Pending Signature)"}</strong></div>
                    <div>Designation: <strong>${D.designation||D.role}</strong></div>
                    <div>Date: <strong>${D.signedAt?$(D.signedAt):D.signed?$(t.inspectionDate):"—"}</strong></div>
                  </div>
                  <div style="margin-top: 14px; border-top: 1px dashed #94a3b8; padding-top: 4px; font-size: 7px; color: #64748b; text-align: center;">
                    ${D.signed?`Electronically Authenticated • ${D.name}`:`Signature & Stamp (${D.role})`}
                  </div>
                </td>
              `).join("")}
              ${U.length===1?'<td style="width: 50%; background: #f8fafc; border: 1px solid #cbd5e1;"></td>':""}
            </tr>
          `).join("")}
        </table>
      </div>
      `})()}

    <!-- ═══ 7.0 ATTACHED INSPECTION PHOTOS & DELIVERY EVIDENCE ═══ -->
    ${t.photos&&t.photos.length>0?`
    <div class="pdf-section">
      <div class="section-banner">7.0 ATTACHED INSPECTION PHOTOS & DELIVERY EVIDENCE (${t.photos.length} PHOTOGRAPHS ATTACHED)</div>
      <div class="photo-grid" style="display: flex; flex-wrap: wrap; gap: 8px; background: #ffffff; border: 1px solid #cbd5e1; border-top: none; padding: 8px;">
        ${t.photos.map((l,R)=>`
          <div class="photo-card" style="width: 48%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; text-align: center; background: #f8fafc; page-break-inside: avoid; break-inside: avoid; margin-bottom: 6px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #ea580c; text-align: left; margin-bottom: 4px; display: flex; justify-content: space-between;">
              <span>PHOTO #${R+1} — DELIVERY EVIDENCE</span>
              <span style="color: #64748b; font-size: 7px;">${g}</span>
            </div>
            <div style="height: 160px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
              <img src="${l}" alt="Inspection Evidence #${R+1}" style="max-height: 160px; max-width: 100%; object-fit: contain;" />
            </div>
            <div style="font-size: 7px; color: #475569; text-align: left;">
              Verified site delivery photograph / mill certificate attachment
            </div>
          </div>
        `).join("")}
      </div>
    </div>
    `:""}

    <!-- ═══ DOCUMENT FOOTER ═══ -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & STATUTORY QUALITY RECORD — ISO 9001:2015 CLAUSE 8.4 — ${f}</div>
      <div>Document Ref: ${g}</div>
    </div>
  `;Z(`${g} - Material Inspection Report (${t.title})`,s)}function Ne(t,p={},x={}){var A,c,i,b,r,m,o,l,R,E,P,L,k,j,q,W,U,D,st,nt,ot,J,Et,St,Tt,K,V,tt,It,dt,Rt,Y,At,Ct,H,Q,w,lt,Ft,Nt,gt,F,ct,$t,Gt,ft,wt,Ot,pt,Dt,Pt,_t,Lt,kt,ht,mt,e,d,S,C,T,_;const f=x.name||"JQMS ENTERPRISE QUALITY MANAGEMENT",y=p.name||t.projectName||"CONSTRUCTION PROJECT",h=p.code||t.projectCode||"PRJ",g=t.logNumber||`DSL-${h}-${((A=t.generalConditions)==null?void 0:A.date)||"TODAY"}`,n=t.generalConditions||{date:new Date().toISOString().slice(0,10),shift:"DAY",weather:"CLEAR",workHoursStart:"07:00",workHoursEnd:"17:00",totalHours:10},v=(t.manpower||[]).reduce((a,O)=>a+(Number(O.headCount)||0),0),s=(t.manpower||[]).reduce((a,O)=>a+(Number(O.totalManHours)||(Number(O.headCount)||0)*(Number(O.hoursWorked)||n.totalHours||8)),0),u=a=>{switch(a){case"SUNNY":return"☀️ Sunny";case"CLEAR":return"🌤️ Clear Sky";case"OVERCAST":return"☁️ Overcast / Cloudy";case"RAIN":return"🌧️ Rainy";case"HEAVY_RAIN":return"⛈️ Heavy Rain / Downpour";case"STORMY":return"🌩️ Stormy / High Winds";case"EXTREME_HEAT":return"🔥 Extreme Heat / High Temp";case"WINDY":return"💨 High Winds / Dust";default:return"🌤️ Normal Site Conditions"}},N=a=>{switch(a){case"APPROVED":return'<span style="padding: 2px 8px; background: #dcfce7; color: #15803d; border: 1px solid #86efac; border-radius: 3px; font-weight: 800; font-size: 8px;">APPROVED</span>';case"SUBMITTED":case"UNDER_REVIEW":return'<span style="padding: 2px 8px; background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; border-radius: 3px; font-weight: 800; font-size: 8px;">UNDER REVIEW</span>';case"REJECTED":return'<span style="padding: 2px 8px; background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; border-radius: 3px; font-weight: 800; font-size: 8px;">REVISION REQUIRED</span>';default:return'<span style="padding: 2px 8px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 3px; font-weight: 800; font-size: 8px;">DRAFT RECORD</span>'}},I=`
    <!-- ═══ HEADER BLOCK ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${X(x,p)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">DAILY SITE LOG & STATUTORY DIARY</div>
          <div class="header-title-project">PROJECT: ${y} (${h})</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.5.1 Operations & Site Quality Records</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${g}</span></div>
          <div><strong>Log Date:</strong> ${n.date}</div>
          <div><strong>Shift:</strong> ${n.shift||"DAY SHIFT"}</div>
          <div><strong>Status:</strong> ${N(t.status)}</div>
        </td>
      </tr>
    </table>

    <!-- ═══ 1.0 ENVIRONMENTAL & SITE CONDITIONS ═══ -->
    <div class="pdf-section">
      <div class="section-banner">1.0 GENERAL SITE & ENVIRONMENTAL CONDITIONS</div>
      <table class="meta-table">
        <tr>
          <td class="meta-label" style="width: 14%;">LOG DATE:</td>
          <td class="meta-value" style="width: 20%; font-weight: 800;">${n.date}</td>
          <td class="meta-label" style="width: 13%;">SHIFT:</td>
          <td class="meta-value" style="width: 20%; font-weight: 700;">${n.shift||"DAY SHIFT"}</td>
          <td class="meta-label" style="width: 13%;">HOURS:</td>
          <td class="meta-value" style="width: 20%;">${n.workHoursStart||"07:00"} - ${n.workHoursEnd||"17:00"} (${n.totalHours||10} hrs)</td>
        </tr>
        <tr>
          <td class="meta-label">WEATHER:</td>
          <td class="meta-value" style="font-weight: 700;">${u(n.weather)}</td>
          <td class="meta-label">TEMPERATURE:</td>
          <td class="meta-value">${n.tempMin!=null?`${n.tempMin}°C`:"—"} to ${n.tempMax!=null?`${n.tempMax}°C`:"—"}</td>
          <td class="meta-label">GROUND/SOIL:</td>
          <td class="meta-value">${n.groundConditions||"Normal / Dry"} (RH: ${n.humidity?`${n.humidity}%`:"—"})</td>
        </tr>
        ${n.siteStatusNotes?`
        <tr>
          <td class="meta-label">SITE OVERVIEW:</td>
          <td class="meta-value" colspan="5">${n.siteStatusNotes}</td>
        </tr>
        `:""}
      </table>
    </div>

    <!-- ═══ 2.0 SITE MANPOWER & TRADE HEADCOUNT (ALL SPHERES) ═══ -->
    <div class="pdf-section">
      <div class="section-banner" style="display: flex; justify-content: space-between;">
        <span>2.0 SITE MANPOWER & TRADE HEADCOUNT SUMMARY</span>
        <span style="font-size: 7.5px; text-transform: none; color: #cbd5e1;">TOTAL PERSONNEL: <strong>${v}</strong> &bull; MAN-HOURS: <strong>${s.toFixed(1)} hrs</strong></span>
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
          ${t.manpower&&t.manpower.length>0?t.manpower.map((a,O)=>{const z=Number(a.hoursWorked)||n.totalHours||8,B=Number(a.headCount)||0,M=Number(a.totalManHours)||B*z;return`
              <tr>
                <td style="font-weight: 700; color: #0f172a;">${a.tradeName}</td>
                <td style="font-size: 7.5px; color: #64748b;">${a.tradeCategory||"Direct Execution"}</td>
                <td>${a.companyOrSubcontractor||"Direct Labor"}</td>
                <td style="text-align: center; font-weight: 800; color: #0284c7;">${B}</td>
                <td style="text-align: center;">${z}</td>
                <td style="text-align: center; font-weight: 700;">${M.toFixed(1)}</td>
              </tr>
            `}).join(""):`
            <tr>
              <td colspan="6" style="text-align: center; color: #94a3b8; padding: 6px;">No manpower entries logged for this shift.</td>
            </tr>
          `}
          <tr style="background: #f1f5f9; font-weight: 800; border-top: 1.5px solid #cbd5e1;">
            <td colspan="3" style="text-align: right; text-transform: uppercase; font-size: 7.5px; color: #334155;">Cumulative Site Workforce:</td>
            <td style="text-align: center; color: #0284c7; font-size: 8.5px;">${v}</td>
            <td style="text-align: center; color: #64748b; font-size: 7px;">Avg ${n.totalHours||8}h</td>
            <td style="text-align: center; color: #0f172a; font-size: 8.5px;">${s.toFixed(1)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ═══ 3.0 PLANT, MACHINERY & HEAVY EQUIPMENT ═══ -->
    ${t.equipment&&t.equipment.length>0?`
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
          ${t.equipment.map(a=>`
            <tr>
              <td style="font-weight: 700;">${a.equipmentType}</td>
              <td style="font-family: monospace; font-size: 7px;">${a.plantNumber||"—"}</td>
              <td style="text-align: center; font-weight: 700;">${a.quantity||1}</td>
              <td style="text-align: center;">
                <span style="padding: 1px 6px; border-radius: 2px; font-weight: 700; font-size: 7px; ${a.status==="OPERATIONAL"?"background: #dcfce7; color: #15803d;":a.status==="BREAKDOWN"?"background: #fee2e2; color: #b91c1c;":"background: #fef3c7; color: #b45309;"}">${a.status}</span>
              </td>
              <td style="text-align: center; font-weight: 700;">${a.hoursUsed!=null?`${a.hoursUsed} hrs`:"—"}</td>
              <td style="font-size: 7.5px;">${a.operatorName||a.notes||"Standard Operations"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    `:""}

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
          ${t.activities&&t.activities.length>0?t.activities.map(a=>`
            <tr>
              <td style="font-weight: 700; color: #0f172a;">
                ${a.levelName||"Site Wide"} ${a.elementName?`&bull; ${a.elementName}`:""}
                ${a.gridlineRef?`<div style="font-size: 7px; color: #64748b; font-weight: normal;">Grid: ${a.gridlineRef}</div>`:""}
              </td>
              <td style="font-size: 7.5px; font-weight: 600; color: #2563eb;">${a.trade}</td>
              <td style="font-size: 8px;">
                <div>${a.description}</div>
                ${a.quantityDone?`<div style="font-size: 7px; color: #475569; margin-top: 1px;">Output: <strong>${a.quantityDone}</strong></div>`:""}
                ${a.delayNotes?`<div style="font-size: 7px; color: #dc2626; margin-top: 1px;">Note: ${a.delayNotes}</div>`:""}
              </td>
              <td style="text-align: center; font-weight: 800; color: #0284c7;">${a.progressPercentage!=null?`${a.progressPercentage}%`:"—"}</td>
              <td style="text-align: center;">
                <span style="padding: 1px 5px; border-radius: 2px; font-size: 7px; font-weight: 700; ${a.status==="COMPLETED"?"background: #dcfce7; color: #15803d;":a.status==="DELAYED"?"background: #fee2e2; color: #b91c1c;":"background: #dbeafe; color: #1d4ed8;"}">${a.status.replace("_"," ")}</span>
              </td>
            </tr>
          `).join(""):`
            <tr>
              <td colspan="5" style="text-align: center; color: #94a3b8; padding: 6px;">No specific activity breakdowns logged for this shift.</td>
            </tr>
          `}
        </tbody>
      </table>
    </div>

    <!-- ═══ 5.0 QA/QC COMPLIANCE & INSPECTIONS SPHERE ═══ -->
    <div class="pdf-section">
      <div class="section-banner">5.0 QUALITY ASSURANCE, INSPECTIONS & HOLD POINTS (QA/QC SPHERE)</div>
      ${(c=t.quality)!=null&&c.inspections&&t.quality.inspections.length>0?`
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
          ${t.quality.inspections.map(a=>`
            <tr>
              <td style="font-weight: 700;">${a.inspectionType}</td>
              <td style="font-family: monospace; font-size: 7px;">${a.refNo||"—"}</td>
              <td>${a.levelName||"—"} ${a.elementName?`&bull; ${a.elementName}`:""}</td>
              <td>${a.trade||"Civil/Structural"}</td>
              <td style="text-align: center;">
                <span style="padding: 1px 6px; border-radius: 2px; font-weight: 800; font-size: 7px; ${a.result==="PASSED"?"background: #dcfce7; color: #15803d;":a.result==="PASSED_AS_NOTED"?"background: #dbeafe; color: #1d4ed8;":"background: #fee2e2; color: #b91c1c;"}">${a.result.replace(/_/g," ")}</span>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      `:`
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; padding: 6px 10px; font-size: 7.5px; color: #64748b;">
        No formal hold-point inspection requests performed or witnessed during this shift.
      </div>
      `}
      ${(i=t.quality)!=null&&i.qualityNotes||(b=t.quality)!=null&&b.ncrsRaised&&t.quality.ncrsRaised.length>0?`
      <div style="background: #fafafa; border: 1px solid #cbd5e1; border-top: none; padding: 6px 10px; font-size: 7.5px; color: #334155;">
        ${(r=t.quality)!=null&&r.ncrsRaised&&t.quality.ncrsRaised.length>0?`<div><strong>NCRs Raised / Monitored:</strong> <span style="color: #dc2626; font-weight: 700;">${t.quality.ncrsRaised.join(", ")}</span></div>`:""}
        ${(m=t.quality)!=null&&m.qualityNotes?`<div style="margin-top: 2px;"><strong>QA/QC Notes:</strong> ${t.quality.qualityNotes}</div>`:""}
      </div>
      `:""}
    </div>

    <!-- ═══ 6.0 MATERIALS LOGISTICS & CONCRETE POURS ═══ -->
    ${(o=t.materials)!=null&&o.deliveries&&t.materials.deliveries.length>0||(l=t.materials)!=null&&l.concretePours&&t.materials.concretePours.length>0?`
    <div class="pdf-section">
      <div class="section-banner">6.0 MATERIALS LOGISTICS, DELIVERIES & CONCRETE POURS</div>
      ${(R=t.materials)!=null&&R.concretePours&&t.materials.concretePours.length>0?`
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
          ${t.materials.concretePours.map(a=>`
            <tr>
              <td style="font-weight: 700;">${a.elementName} ${a.levelName?`(${a.levelName})`:""}</td>
              <td style="text-align: center; font-weight: 800; color: #0284c7;">${a.concreteGrade}</td>
              <td style="font-size: 7px;">${a.supplier||"Batching Plant"} (${a.truckCount||1} trucks)</td>
              <td style="text-align: center; font-weight: 800;">${a.volumePoured} m³</td>
              <td style="text-align: center;">${a.slumpMm?`${a.slumpMm} mm`:"—"}</td>
              <td style="text-align: center; font-family: monospace; font-size: 7px;">${a.cubeSampleNumber||"Standard 6-Cube Set"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      `:""}

      ${(E=t.materials)!=null&&E.deliveries&&t.materials.deliveries.length>0?`
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
          ${t.materials.deliveries.map(a=>`
            <tr>
              <td style="font-weight: 700;">${a.description}</td>
              <td>${a.supplier}</td>
              <td style="font-family: monospace; font-size: 7px;">${a.ticketNumber||"—"}</td>
              <td style="text-align: center; font-weight: 700;">${a.quantity} ${a.unit}</td>
              <td style="text-align: center;">
                <span style="padding: 1px 6px; border-radius: 2px; font-weight: 800; font-size: 7px; ${a.status==="ACCEPTED"||a.status==="APPROVED"?"background: #dcfce7; color: #15803d;":a.status==="APPROVED_AS_NOTED"||a.status==="APPROVED AS NOTED"?"background: #e0f2fe; color: #0369a1;":a.status==="REJECTED"?"background: #fee2e2; color: #b91c1c;":"background: #fef3c7; color: #b45309;"}">${(a.status||"").replace(/_/g," ")}</span>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      `:""}
    </div>
    `:""}

    <!-- ═══ 7.0 HEALTH, SAFETY & ENVIRONMENT (HSE SPHERE) ═══ -->
    <div class="pdf-section">
      <div class="section-banner">7.0 HEALTH, SAFETY & ENVIRONMENT (HSE SPHERE)</div>
      <table class="meta-table">
        <tr>
          <td class="meta-label" style="width: 18%;">TOOLBOX TALK (TBT):</td>
          <td class="meta-value" style="width: 48%; font-weight: 600;">
            ${((P=t.hse)==null?void 0:P.toolboxTalkTopic)||"Daily Morning Safety & PPE Briefing"}
          </td>
          <td class="meta-label" style="width: 18%;">TBT ATTENDANCE:</td>
          <td class="meta-value" style="width: 16%; font-weight: 800; color: #0284c7;">
            ${((L=t.hse)==null?void 0:L.toolboxTalkAttendees)!=null?`${t.hse.toolboxTalkAttendees} Workers`:`${v} Workers`}
          </td>
        </tr>
        <tr>
          <td class="meta-label">INCIDENT RECORD:</td>
          <td class="meta-value" style="font-weight: 800; color: ${(k=t.hse)!=null&&k.incidentsReported?"#dc2626":"#15803d"};">
            ${(j=t.hse)!=null&&j.incidentsReported?`⚠️ ${t.hse.incidentsReported} INCIDENTS REPORTED (${t.hse.incidentDetails||""})`:"✅ ZERO (0) ACCIDENTS / LOST TIME INJURIES (LTI)"}
          </td>
          <td class="meta-label">HOUSEKEEPING:</td>
          <td class="meta-value" style="font-weight: 700;">
            ${((q=t.hse)==null?void 0:q.housekeepingRating)||"GOOD"}
          </td>
        </tr>
        ${(W=t.hse)!=null&&W.permitsToWork&&t.hse.permitsToWork.length>0?`
        <tr>
          <td class="meta-label">ACTIVE PERMITS (PTW):</td>
          <td class="meta-value" colspan="3">
            ${t.hse.permitsToWork.map(a=>`<strong>${a.permitType}</strong> at ${a.location} (Auth: ${a.approvedBy})`).join(" &bull; ")}
          </td>
        </tr>
        `:""}
      </table>
    </div>

    <!-- ═══ 8.0 DELAYS, OBSTACLES & CONSULTANT OVERSIGHT ═══ -->
    ${t.delays&&t.delays.length>0||(U=t.consultant)!=null&&U.observations?`
    <div class="pdf-section">
      <div class="section-banner">8.0 SITE DELAYS, HINDRANCES & CONSULTANT REMARKS</div>
      ${t.delays&&t.delays.length>0?`
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
          ${t.delays.map(a=>`
            <tr>
              <td style="font-weight: 700; color: #dc2626;">${a.category}</td>
              <td>${a.location||"General Site"} ${a.trade?`(${a.trade})`:""}</td>
              <td style="text-align: center; font-weight: 800; color: #dc2626;">${a.impactHours} hrs</td>
              <td style="font-size: 7.5px;">
                <div>${a.description}</div>
                ${a.remedialAction?`<div style="font-size: 7px; color: #15803d; margin-top: 2px;">Action: ${a.remedialAction}</div>`:""}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      `:""}
      ${(D=t.consultant)!=null&&D.observations?`
      <div style="background: #fafafa; border: 1px solid #cbd5e1; border-top: none; padding: 6px 10px; font-size: 7.5px; color: #334155;">
        <div><strong>Consultant / Client Representative Walk Remarks:</strong> ${t.consultant.observations}</div>
        ${(st=t.consultant)!=null&&st.directivesIssued?`<div style="margin-top: 2px;"><strong>Directives Issued:</strong> ${t.consultant.directivesIssued}</div>`:""}
      </div>
      `:""}
    </div>
    `:""}

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
              Name: <strong>${((J=(ot=(nt=t.signOffs)==null?void 0:nt.SITE_ENGINEER)==null?void 0:ot.signedBy)==null?void 0:J.name)||t.createdByName||"Site Engineer"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((Tt=(St=(Et=t.signOffs)==null?void 0:Et.SITE_ENGINEER)==null?void 0:St.signedBy)==null?void 0:Tt.designation)||"Project Field Engineer"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(V=(K=t.signOffs)==null?void 0:K.SITE_ENGINEER)!=null&&V.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">DIGITALLY SIGNED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((tt=t.signOffs.SITE_ENGINEER.signedBy)==null?void 0:tt.digitalStamp)||"VERIFIED-EXECUTION"}</div>
              `:`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">RECORDED BY CREATOR</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${t.createdByRole||"SITE-EXECUTION"}</div>
              `}
            </div>
          </td>

          <!-- Sphere 2: QA/QC Quality Authority -->
          <td style="width: 25%; padding: 8px; border-right: 1px solid #e2e8f0; vertical-align: top; background: #fafafa;">
            <div class="sig-role-header" style="font-size: 7px; font-weight: 800; color: #16a34a; margin-bottom: 4px;">
              QA/QC QUALITY LEAD
            </div>
            <div style="font-size: 7.5px; color: #334155; margin-bottom: 2px;">
              Name: <strong>${((Rt=(dt=(It=t.signOffs)==null?void 0:It.QAQC_ENGINEER)==null?void 0:dt.signedBy)==null?void 0:Rt.name)||"Pending QA/QC Certification"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((Ct=(At=(Y=t.signOffs)==null?void 0:Y.QAQC_ENGINEER)==null?void 0:At.signedBy)==null?void 0:Ct.designation)||"QA/QC Lead Engineer"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(Q=(H=t.signOffs)==null?void 0:H.QAQC_ENGINEER)!=null&&Q.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">ISO 9001 CERTIFIED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((w=t.signOffs.QAQC_ENGINEER.signedBy)==null?void 0:w.digitalStamp)||"QAQC-CERT-PASSED"}</div>
              `:`
                <div style="font-family: monospace; font-size: 6.5px; color: #94a3b8;">PENDING SIGN-OFF</div>
              `}
            </div>
          </td>

          <!-- Sphere 3: Safety / HSE Manager -->
          <td style="width: 25%; padding: 8px; border-right: 1px solid #e2e8f0; vertical-align: top; background: #fafafa;">
            <div class="sig-role-header" style="font-size: 7px; font-weight: 800; color: #ea580c; margin-bottom: 4px;">
              HSE & SAFETY OFFICER
            </div>
            <div style="font-size: 7.5px; color: #334155; margin-bottom: 2px;">
              Name: <strong>${((Nt=(Ft=(lt=t.signOffs)==null?void 0:lt.SAFETY_OFFICER)==null?void 0:Ft.signedBy)==null?void 0:Nt.name)||"Pending HSE Clearance"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((ct=(F=(gt=t.signOffs)==null?void 0:gt.SAFETY_OFFICER)==null?void 0:F.signedBy)==null?void 0:ct.designation)||"Site Safety Manager"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(Gt=($t=t.signOffs)==null?void 0:$t.SAFETY_OFFICER)!=null&&Gt.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">SAFETY CLEARED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((ft=t.signOffs.SAFETY_OFFICER.signedBy)==null?void 0:ft.digitalStamp)||"HSE-CLEARED"}</div>
              `:`
                <div style="font-family: monospace; font-size: 6.5px; color: #94a3b8;">PENDING SIGN-OFF</div>
              `}
            </div>
          </td>

          <!-- Sphere 4: Consultant / PM Final Governance -->
          <td style="width: 25%; padding: 8px; vertical-align: top; background: #fafafa;">
            <div class="sig-role-header" style="font-size: 7px; font-weight: 800; color: #7c3aed; margin-bottom: 4px;">
              CONSULTANT / PROJECT MGR
            </div>
            <div style="font-size: 7.5px; color: #334155; margin-bottom: 2px;">
              Name: <strong>${((pt=(Ot=(wt=t.signOffs)==null?void 0:wt.PROJECT_MANAGER)==null?void 0:Ot.signedBy)==null?void 0:pt.name)||((_t=(Pt=(Dt=t.signOffs)==null?void 0:Dt.CONSULTANT)==null?void 0:Pt.signedBy)==null?void 0:_t.name)||"Pending Final Endorsement"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((ht=(kt=(Lt=t.signOffs)==null?void 0:Lt.PROJECT_MANAGER)==null?void 0:kt.signedBy)==null?void 0:ht.designation)||"Project Manager / Consultant"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(e=(mt=t.signOffs)==null?void 0:mt.PROJECT_MANAGER)!=null&&e.signed||(S=(d=t.signOffs)==null?void 0:d.CONSULTANT)!=null&&S.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">APPROVED & ENDORSED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((_=(T=(C=t.signOffs)==null?void 0:C.PROJECT_MANAGER)==null?void 0:T.signedBy)==null?void 0:_.digitalStamp)||"PM-AUTHORIZED"}</div>
              `:`
                <div style="font-family: monospace; font-size: 6.5px; color: #94a3b8;">PENDING APPROVAL</div>
              `}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- ═══ 10.0 ATTACHED SITE PHOTOGRAPHS ═══ -->
    ${t.photos&&t.photos.length>0?`
    <div class="pdf-section" style="page-break-before: auto;">
      <div class="section-banner">10.0 ATTACHED SITE PHOTOGRAPHIC EVIDENCE (${t.photos.length} PHOTOS)</div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px; background: #ffffff; border: 1px solid #cbd5e1; border-top: none; padding: 8px;">
        ${t.photos.map((a,O)=>`
          <div style="width: 48%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; text-align: center; background: #f8fafc; page-break-inside: avoid; margin-bottom: 6px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #0284c7; text-align: left; margin-bottom: 3px; display: flex; justify-content: space-between;">
              <span>PHOTO #${O+1} ${a.tradeTag?`&bull; ${a.tradeTag}`:""}</span>
              <span style="color: #64748b; font-size: 7px;">${a.location||"Site"}</span>
            </div>
            <div style="height: 150px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
              <img src="${a.url}" alt="Site Evidence #${O+1}" style="max-height: 150px; max-width: 100%; object-fit: contain;" />
            </div>
            <div style="font-size: 7px; color: #475569; text-align: left;">
              ${a.caption||"Daily site work progress photo"}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
    `:""}

    <!-- ═══ DOCUMENT FOOTER ═══ -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & STATUTORY QUALITY RECORD — ISO 9001:2015 CLAUSE 8.5.1 — ${f}</div>
      <div>Document Ref: ${g} &bull; Date: ${n.date}</div>
    </div>
  `;Z(`${g} - Daily Site Log (${n.date})`,I)}export{xe as S,Ae as a,Ee as b,Se as c,Ce as d,ve as e,be as f,ye as g,ue as h,Te as i,Re as j,Ie as k,Ne as l,Z as o};
