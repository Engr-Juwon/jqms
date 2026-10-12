import{h as de}from"./html2pdf-CpttaISV.js";import{c as ee}from"./permitChecklist-BHE5VmmF.js";import"./vendor-pdf-mxELRCvR.js";import{b as Zt,r as J,u as Jt}from"./index-I3q-hmBB.js";import{j as lt}from"./vendor-three-DPHNrIDs.js";import{s as oe,b2 as re,ag as le,d as ce,bn as pe,af as ge,O as fe}from"./vendor-icons-CVsi4Asg.js";import"./jspdf.plugin.autotable-DkCS_eWm.js";function ie(t){if(!t||!t.trim())return[];const r=t.trim(),m=new RegExp("(?:^|\\n+|(?<=[.!?]\\s+)|(?<=\\b))((?:Dimensional\\s+Non-Conformance|Dimensional\\s+Check|Dimensional\\s+Defect|Non-Conformance|Defect\\s+Notice|Material\\s+Defect|Defects?|Discrepancy|Discrepancies|Operational\\s+Impact|Structural\\s+Impact|Engineering\\s+Impact|Risk\\s+Assessment|Safety\\s+Impact|Technical\\s+Impact|Management\\s+Directive|Executive\\s+Directive|Management\\s+Override|Management\\s+Instruction|Director'?s?\\s+Override|Director'?s?\\s+Directive|Executive\\s+Instruction|Site\\s+Instruction|Liability\\s+Disclaimer|Disclaimer|Warranty\\s+Notice|Indemnity\\s+Clause|Indemnity|Legal\\s+Notice|Corrective\\s+Action|Mandatory\\s+Action|Action\\s+Required|Remedial\\s+Action|Resolution|Mitigation|Technical\\s+Evaluation|Technical\\s+Justification|Specification\\s+Reference|QA\\/QC\\s+Observation|Inspector\\s+Notes?|Notes?|Special\\s+Instructions?|Caveats?|Conditions?|Observations?|Root\\s+Cause|Justification|Disposition\\s+Notice|Testing\\s+Conditions?))(?:\\s*:\\s*|\\s*—\\s*|\\s*-\\s*)","gi"),p=Array.from(r.matchAll(m));if(p.length>=1){const x=[],f=p[0].index??0;if(f>0){const d=r.substring(0,f).trim();d&&x.push({category:"standard",header:"",content:d})}for(let d=0;d<p.length;d++){const u=p[d],g=u.index??0,v=u[0],N=u[1].trim(),E=p[d+1],R=E?E.index??r.length:r.length,h=r.substring(g+v.length,R).trim(),a=N.toLowerCase();let y="standard";a.includes("non-conformance")||a.includes("defect")||a.includes("discrepanc")?y="defect":a.includes("impact")||a.includes("risk")||a.includes("safety")?y="impact":a.includes("directive")||a.includes("override")||a.includes("instruction")?y="directive":a.includes("disclaimer")||a.includes("liability")||a.includes("indemnity")||a.includes("warranty")||a.includes("legal")?y="disclaimer":a.includes("action")||a.includes("remedial")||a.includes("corrective")||a.includes("resolution")||a.includes("mitigation")?y="action":(a.includes("note")||a.includes("observation")||a.includes("condition")||a.includes("caveat")||a.includes("evaluation")||a.includes("justification")||a.includes("root cause"))&&(y="note"),x.push({category:y,header:N,content:h})}return x}const T=r.split(/\n\s*\n|\r\n\s*\r\n|\n/).map(x=>x.trim()).filter(Boolean);return T.length===0?[{category:"standard",header:"",content:r}]:T.map(x=>{const f=x.match(/^([A-Za-z0-9\s/&'_-]{3,45}):\s+(.+)$/s);if(f){const d=f[1].trim(),u=f[2].trim(),g=d.toLowerCase();let v="note";return g.includes("defect")||g.includes("non-conformance")||g.includes("fail")||g.includes("error")||g.includes("discrepanc")?v="defect":g.includes("impact")||g.includes("risk")||g.includes("safety")?v="impact":g.includes("directive")||g.includes("override")||g.includes("instruction")?v="directive":g.includes("disclaimer")||g.includes("liability")||g.includes("indemnity")?v="disclaimer":(g.includes("action")||g.includes("required")||g.includes("remed"))&&(v="action"),{category:v,header:d,content:u}}return{category:"standard",header:"",content:x}})}function jt(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function Yt(t,r="No inspection observations or notes recorded."){const m=ie(t);return m.length===0?`<div style="font-size: 8px; color: #64748b; font-style: italic; line-height: 1.4;">${jt(r)}</div>`:m.length===1&&!m[0].header?`<div style="font-size: 8px; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">${jt(m[0].content)}</div>`:`
    <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
      ${m.map(p=>{let T="#f8fafc",x="#cbd5e1",f="3.5px solid #64748b",d="#e2e8f0",u="#334155",g="#cbd5e1";switch(p.category){case"defect":T="#fff5f5",x="#fecaca",f="3.5px solid #dc2626",d="#fee2e2",u="#991b1b",g="#fca5a5";break;case"impact":T="#fffbeb",x="#fef08a",f="3.5px solid #d97706",d="#fef3c7",u="#92400e",g="#fcd34d";break;case"directive":T="#faf5ff",x="#e9d5ff",f="3.5px solid #7c3aed",d="#f3e8ff",u="#581c87",g="#d8b4fe";break;case"disclaimer":T="#f8fafc",x="#cbd5e1",f="3.5px solid #334155",d="#e2e8f0",u="#0f172a",g="#94a3b8";break;case"action":T="#f0fdf4",x="#bbf7d0",f="3.5px solid #16a34a",d="#dcfce7",u="#166534",g="#86efac";break;case"note":T="#f0f9ff",x="#bae6fd",f="3.5px solid #0284c7",d="#e0f2fe",u="#0369a1",g="#7dd3fc";break;default:T="#ffffff",x="#e2e8f0",f="3px solid #94a3b8",d="#f1f5f9",u="#475569",g="#cbd5e1";break}return`
            <div style="background: ${T}; border: 1px solid ${x}; border-left: ${f}; border-radius: 4px; padding: 6px 8px; box-sizing: border-box; page-break-inside: avoid; break-inside: avoid;">
              ${p.header?`
                <div style="margin-bottom: 3.5px; display: flex; align-items: center; gap: 6px;">
                  <span style="display: inline-block; padding: 1.5px 6px; background: ${d}; color: ${u}; border: 1px solid ${g}; border-radius: 3px; font-weight: 800; font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.4px;">
                    ${jt(p.header)}
                  </span>
                </div>
              `:""}
              <div style="font-size: 8px; color: #1e293b; line-height: 1.5; white-space: pre-wrap; font-weight: ${p.category==="defect"||p.category==="directive"?"600":"400"};">
                ${jt(p.content)}
              </div>
            </div>
          `}).join("")}
    </div>
  `}const Se=({text:t,fallback:r="No observations or details recorded.",className:m="",defaultCategory:p})=>{const T=ie(t);return T.length===0?lt.jsx("div",{className:`p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 italic text-xs ${m}`,children:r}):(T.length===1&&!T[0].header&&p&&(T[0].category=p),lt.jsx("div",{className:`space-y-2.5 ${m}`,children:T.map((x,f)=>{let d="bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 border-l-4 border-l-slate-500",u="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",g=oe;switch(x.category){case"defect":d="bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200 border-l-4 border-l-red-600",u="bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 border-red-300 dark:border-red-800",g=fe;break;case"impact":d="bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 border-l-4 border-l-amber-500",u="bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800",g=ge;break;case"directive":d="bg-purple-50/80 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/60 text-purple-900 dark:text-purple-200 border-l-4 border-l-purple-600",u="bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-800",g=pe;break;case"disclaimer":d="bg-slate-100/90 dark:bg-slate-900/90 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 border-l-4 border-l-slate-700 dark:border-l-slate-400",u="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-400 dark:border-slate-600",g=ce;break;case"action":d="bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-l-4 border-l-emerald-600",u="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800",g=le;break;case"note":d="bg-sky-50/80 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/60 text-sky-900 dark:text-sky-200 border-l-4 border-l-sky-500",u="bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-800",g=re;break}return lt.jsxs("div",{className:`p-3.5 rounded-xl border shadow-sm transition ${d}`,children:[x.header&&lt.jsx("div",{className:"flex items-center gap-2 mb-1.5",children:lt.jsxs("span",{className:`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border font-mono ${u}`,children:[lt.jsx(g,{className:"w-3 h-3 shrink-0"}),lt.jsx("span",{children:x.header})]})}),lt.jsx("p",{className:"text-xs leading-relaxed whitespace-pre-wrap font-medium",children:x.content})]},f)})}))},he=`
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
`;function K(t,r,m=""){const p=window.open("","_blank");if(!p){alert("Please allow popups to generate and print the quality document.");return}const T=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${t}</title>
  <style>
    ${he}
    ${m}
  </style>
</head>
<body>
  <div class="page-container">
    ${r}
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
</html>`;p.document.open(),p.document.write(T),p.document.close()}const A=t=>{if(!t||t==="—")return"—";const r=t instanceof Date?t:new Date(t);return isNaN(r.getTime())?String(t):r.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})};function Ie(t,r={},m={}){var R;const p=m.name,T=r.name,x=t.ptpNumber||`PTP-${Math.floor(1e3+Math.random()*9e3)}`,f=((R=t.checklistItems)!=null&&R.length?t.checklistItems:ee()).map((h,a)=>{var y;return{cat:h.category||"General",param:h.label,status:h.status||(a===0&&((y=t.checklist)!=null&&y.rebarInspectionApproved),"PASS")}});(t.stakeholders||[]).filter(h=>h.required);const d=t.status==="REJECTED",g=(()=>{if(d)return[{role:"QA/QC Engineer",name:t.issuedByName,required:!0}];if(t.stakeholders&&t.stakeholders.length>0)return t.stakeholders;const h=t.requiredSignoffs,a=[{role:"QA/QC Engineer",name:t.issuedByName,required:!0}];return(!h||h.siteManager!==!1)&&a.push({role:"Site / Construction Manager",name:"",required:!0}),(!h||h.structuralConsultant!==!1)&&a.push({role:"Structural Consultant / Engineer",name:"",required:!0}),h!=null&&h.mechanicalEngineer&&a.push({role:"Mechanical Engineer",name:"",required:!1}),h!=null&&h.electricalEngineer&&a.push({role:"Electrical Engineer",name:"",required:!1}),a})(),v=t,N=`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${v.permitNumber} - Permit To Pour (PTP)</title>
      <style>
        * { box-sizing: border-box; }
        
        @page {
          size: A4 portrait;
          margin: 10mm 10mm 12mm 10mm;
          @bottom-left {
            content: "CONFIDENTIAL & PROPRIETARY — ${p}";
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
          border-left: 3px solid ${d?"#dc2626":"#ea580c"};
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
            ${J(m,r)}
          </td>
          <td style="width: 55%;">
            <div class="header-title">Official Permit To Pour (PTP) Authorization</div>
            <div class="header-sub">PROJECT: ${T}</div>
          </td>
          <td style="width: 25%;" class="meta-box">
            <strong>PTP Ref:</strong> <span style="color:#ea580c; font-weight:700;">${v.permitNumber}</span><br/>
            <strong>Scheduled Pour:</strong> ${A(v.pourDate)} (${v.pourTime})<br/>
            <strong>Status:</strong> <span class="${d?"status-rejected":"status-issued"}">${v.status||"ISSUED"}</span>
          </td>
        </tr>
      </table>

      ${d?`<div class="rejection-notice">
              <strong>POUR NOT PERMITTED:</strong> This Permit to Pour has been REJECTED due to failed hold point checks. Concrete casting is strictly prohibited. Corrective actions must be completed before re-inspection and re-issuance.
             </div>`:""}

      <div class="pdf-section">
        <div class="section-title">1.0 Structural Element & Location Parameters</div>
        <table class="section-table">
          <tr>
            <td class="lbl" style="width: 18%;">Building / Block:</td>
            <td class="val" style="width: 32%;">${v.building||"Main Structure"}</td>
            <td class="lbl" style="width: 18%;">Level / Floor:</td>
            <td class="val" style="width: 32%;">${v.floor||"—"}</td>
          </tr>
          <tr>
            <td class="lbl">Structural Element:</td>
            <td class="val"><strong>${v.elementName} ${v.elementId?`: ${v.elementId}`:""}</strong></td>
            <td class="lbl">Grid Axis / Zone:</td>
            <td class="val">${v.elementRef||v.zone||"—"}</td>
          </tr>
        </table>
      </div>

      <div class="pdf-section">
        <div class="section-title">2.0 Concrete Mix Specifications & Batching Logistics</div>
        <table class="section-table">
          <tr>
            <td class="lbl" style="width: 18%;">Specified Grade:</td>
            <td class="val" style="width: 32%;"><strong>${v.concreteGrade}</strong></td>
            <td class="lbl" style="width: 18%;">Est. Volume:</td>
            <td class="val" style="width: 32%;"><strong>${v.estimatedVolume} m³</strong></td>
          </tr>
          <tr>
            <td class="lbl">Batching Plant:</td>
            <td class="val">${v.supplier||"Approved Ready-Mix Supplier"}</td>
            <td class="lbl">Inspected By:</td>
            <td class="val">${v.issuedByName} (QA/QC Engineer)</td>
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
            ${f.map((h,a)=>`
              <tr>
                <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #64748b;">${a+1}</td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center;">
                  <span style="font-weight: 800; font-size: 8px; padding: 1px 4px; border-radius: 2px; ${h.status==="PASS"?"background: #dcfce7; color: #15803d;":h.status==="FAIL"?"background: #fee2e2; color: #b91c1c;":"background: #f1f5f9; color: #64748b;"}">${h.status}</span>
                </td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 700; color: #334155;">${h.cat}</td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 500; color: #0f172a;">${h.param}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="pdf-section">
        <div class="section-title">4.0 Statutory Authorizations & Stakeholder Sign-Off Block</div>
        <table class="section-table" style="margin-top: 4px;">
          ${g.reduce((h,a,y)=>{if(y%2===0){const c=g[y+1],o=E(a),n=c?E(c):'<td style="width: 50%; height: 75px; background: #fafafa; border: 1px dashed #cbd5e1;"></td>';h+=`<tr>${o}${n}</tr>`}return h},"")}
        </table>
      </div>

      <div class="footer-fallback">
        <span>CONFIDENTIAL — ${p}</span>
        <span>PTP Ref: ${v.permitNumber}</span>
      </div>

      <script>
        window.onload = () => {
          window.print();
        };
      <\/script>
    </body>
    </html>
  `;function E(h){const a=h.required?"#15803d":"#64748b",y=h.required?"REQUIRED":"OPTIONAL";return`
      <td style="width: 50%; height: 75px; vertical-align: top; padding: 6px 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span style="font-weight: 700; font-size: 8px; text-transform: uppercase; color: #ea580c;">${h.designation?`${h.designation} <span style="font-size: 7px; color: #64748b; font-weight: normal;">(${h.role})</span>`:h.role}</span>
          <span style="font-size: 6px; font-weight: 700; background: ${a}15; color: ${a}; padding: 1px 3px; border-radius: 2px;">${y}</span>
        </div>
        <div style="font-size: 8px; margin-bottom: 8px;">Name: <strong>${h.name||"__________________________________________________"}</strong></div>
        <div style="font-size: 8px; display: flex; justify-content: space-between;">
          <span>Sign: ________________________</span>
          <span>Date: ____ / ____ / 20__</span>
        </div>
      </td>
    `}K(`${x} - Permit to Pour`,N)}function Re(t,r={},m={}){var h;const p=m.name,T=r.companyName,x=t.ptpNumber||`PTP-${Math.floor(1e3+Math.random()*9e3)}`,f=((h=t.checklistItems)!=null&&h.length?t.checklistItems:ee()).map((a,y)=>{var c;return{cat:a.category||"General",param:a.label,status:a.status||(y===0&&((c=t.checklist)!=null&&c.rebarInspectionApproved),"PASS")}}),d=t.status==="REJECTED",g=(()=>{if(d)return[{role:"QA/QC Engineer",name:t.issuedByName||"J. Oladejo",required:!0}];if(t.stakeholders&&t.stakeholders.length>0)return t.stakeholders.filter(c=>c.required);const a=t.requiredSignoffs,y=[{role:"QA/QC Engineer",name:t.issuedByName||"",required:!0}];return(!a||a.siteManager!==!1)&&y.push({role:"Site / Construction Manager",name:"",required:!0}),(!a||a.structuralConsultant!==!1)&&y.push({role:"Structural Consultant / Engineer",name:"",required:!0}),a!=null&&a.mechanicalEngineer&&y.push({role:"Mechanical Engineer",name:"",required:!0}),a!=null&&a.electricalEngineer&&y.push({role:"Electrical Engineer",name:"",required:!0}),y})(),v=`
    <div id="pdf-document" style="padding: 20px; font-family: Arial, sans-serif; color: #0f172a; background: #fff;">
      <!-- Header -->
      <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #0f172a; margin-bottom: 12px; background: #ffffff;">
        <tr>
          <td style="width: 22%; border: 1px solid #cbd5e1; padding: 6px; text-align: center; vertical-align: middle; background: #ffffff;">
            ${J(m,r)}
          </td>
          <td style="width: 53%; border: 1px solid #cbd5e1; padding: 6px; text-align: center; vertical-align: middle;">
            <div style="font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; color: #0f172a;">PERMIT TO POUR (PTP) AUTHORIZATION</div>
            <div style="font-size: 9.5px; font-weight: 700; color: #ea580c; margin-top: 2px; text-transform: uppercase;">PROJECT: ${T}</div>
            <div style="font-size: 7.5px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-top: 1px;">ISO 9001:2015 Clause 8.6 Release of Products & Services</div>
          </td>
          <td style="width: 25%; border: 1px solid #cbd5e1; padding: 6px; font-size: 8px; line-height: 1.5; color: #334155; vertical-align: middle;">
            <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${x}</span></div>
            <div><strong>Date:</strong> ${A(t.plannedPourDate)}</div>
            <div><strong>Status:</strong> <span style="display: inline-block; padding: 1px 6px; border-radius: 3px; font-weight: 800; font-size: 8px; text-transform: uppercase; ${d?"background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;":"background: #dcfce7; color: #15803d; border: 1px solid #86efac;"}">${t.status||"APPROVED"}</span></div>
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
            ${f.map((a,y)=>`
              <tr>
                <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #64748b;">${y+1}</td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center;">
                  <span style="font-weight: 800; font-size: 8px; padding: 1px 4px; border-radius: 2px; ${a.status==="PASS"?"background: #dcfce7; color: #15803d;":a.status==="FAIL"?"background: #fee2e2; color: #b91c1c;":"background: #f1f5f9; color: #64748b;"}">${a.status}</span>
                </td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 700; color: #334155;">${a.cat}</td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 500; color: #0f172a;">${a.param}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <!-- 3.0 Statutory Sign-Off -->
      <div style="margin-bottom: 15px;">
        <div style="font-size: 11px; font-weight: 700; margin-bottom: 4px;">3.0 Statutory Authorizations & Stakeholder Sign-Off Block</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px; border: 1px solid #cbd5e1;">
          ${g.reduce((a,y,c)=>{if(c%2===0){const o=g[c+1],n=N(y),l=o?N(o):'<td style="width: 50%; height: 70px; background: #fafafa; border: 1px solid #e2e8f0;"></td>';a+=`<tr>${n}${l}</tr>`}return a},"")}
        </table>
      </div>

      <!-- Footer -->
      <div style="font-size: 8px; color: #64748b; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 5px; margin-top: 10px;">
        <div>CONFIDENTIAL & PROPRIETARY — ${p}</div>
        <div>Doc Ref: ${x}</div>
      </div>
    </div>
  `;function N(a){const y=a.required?"#15803d":"#64748b",c=a.required?"REQUIRED":"OPTIONAL";return`
      <td style="width: 50%; height: 70px; vertical-align: top; padding: 6px 8px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span style="font-weight: 700; font-size: 8px; text-transform: uppercase; color: #ea580c;">${a.designation?`${a.designation} <span style="font-size: 7px; color: #64748b; font-weight: normal;">(${a.role})</span>`:a.role}</span>
          <span style="font-size: 6px; font-weight: 700; background: ${y}15; color: ${y}; padding: 1px 3px; border-radius: 2px;">${c}</span>
        </div>
        <div style="font-size: 8px; margin-bottom: 8px;">Name: <strong>${a.name||"__________________________________________________"}</strong></div>
        <div style="font-size: 8px; display: flex; justify-content: space-between;">
          <span>Sign: ________________________</span>
          <span>Date: ____ / ____ / 20__</span>
        </div>
      </td>
    `}const E=document.createElement("div");E.innerHTML=v,document.body.appendChild(E);const R={margin:[10,10,10,10],filename:`${x}_PermitToPour.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:!0,logging:!1},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"}};de().set(R).from(E).toPdf().get("pdf").then(a=>{const y=a.internal.getNumberOfPages();for(let c=1;c<=y;c++)a.setPage(c),a.setFont("helvetica","normal"),a.setFontSize(6.5),a.setTextColor(100,116,139),a.text(`CONFIDENTIAL & PROPRIETARY — ${p}`,10,291),a.text(`PTP Ref: ${t.permitNumber}  |  Page ${c} of ${y}`,200,291,{align:"right"});a.save(`${x}.pdf`)}).catch(a=>{console.error("PDF generation failed:",a)}).finally(()=>{document.body.removeChild(E)})}function xe(t,r={},m={}){var h,a,y;const p=m.name||"Collection Developments LTD",T=r.name||"Bankside",x=t.inspectionNumber||`INSP-2026-${Math.floor(1e3+Math.random()*9e3)}`,f=t.items||[],d=f.filter(c=>c.result==="PASS").length,u=f.filter(c=>c.result==="FAIL").length,g=f.filter(c=>c.result==="OBSERVATION").length,N=(c=>{switch(c==null?void 0:c.toUpperCase()){case"APPROVED":case"CLOSED":return{bg:"#dcfce7",text:"#15803d",border:"#86efac"};case"PENDING_REVIEW":return{bg:"#fef3c7",text:"#b45309",border:"#fcd34d"};case"REJECTED":return{bg:"#fee2e2",text:"#b91c1c",border:"#fca5a5"};default:return{bg:"#f1f5f9",text:"#334155",border:"#cbd5e1"}}})(t.status),E=t.stakeholders&&t.stakeholders.length>0?t.stakeholders.filter(c=>c.required!==!1):[{role:"QA/QC Inspector",name:((h=t.inspector)==null?void 0:h.name)||t.inspectorName||"QA/QC Inspector",designation:((a=t.inspector)==null?void 0:a.designation)||"QA/QC Inspector",required:!0,signed:t.status==="APPROVED"||t.status==="CLOSED",signedAt:t.approvedAt?new Date(t.approvedAt).toISOString():void 0},{role:"Site / Construction Engineer",name:t.subcontractorRepresentative||"Site Engineer",designation:"Site Engineer",required:!0,signed:!1},{role:"Consultant / Resident Engineer",name:t.consultantRepresentative||"Resident Engineer",designation:"Consultant",required:!0,signed:!1}],R=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${J(m,r)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">FIELD INSPECTION & VERIFICATION REPORT</div>
          <div class="header-title-project">PROJECT: ${T}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.6 Monitoring & Measurement of Processes</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${x}</span></div>
          <div><strong>Date:</strong> ${A(t.scheduledDate||t.createdAt)}</div>
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
          <td class="grid-value"><strong>${((y=t.inspector)==null?void 0:y.name)||t.inspectorName||"QA/QC Inspector"}</strong></td>
        </tr>
      </table>
    </div>

    <!-- 2.0 Hold Point Verification Checklist -->
    <div class="pdf-section">
      <div class="section-banner">2.0 TECHNICAL VERIFICATION CHECKPOINTS (${f.length} ITEMS | ${d} PASS, ${u} FAIL, ${g} OBS)</div>
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
          ${f.length>0?f.map((c,o)=>`
            <tr>
              <td style="text-align: center; font-weight: 700; color: #64748b;">${o+1}</td>
              <td style="text-align: center;">
                <span class="${c.result==="PASS"?"badge-pass":c.result==="FAIL"?"badge-fail":c.result==="OBSERVATION"?"badge-observation":"badge-na"}">${c.result||"PENDING"}</span>
              </td>
              <td style="font-weight: 700; color: #334155;">
                ${c.category||c.discipline||"Structural"}
                ${c.critical?'<br/><span class="badge-fail" style="font-size:6.5px; padding:0 3px;">CRITICAL</span>':""}
                ${c.isHoldPoint?'<br/><span class="badge-hold" style="font-size:6.5px; padding:0 3px;">HOLD POINT</span>':""}
              </td>
              <td>
                <div style="font-weight: 600; color: #0f172a;">${c.label}</div>
                ${c.acceptanceCriteria?`<div style="font-size: 7px; color: #64748b; margin-top: 1px; italic">Criteria: ${c.acceptanceCriteria}</div>`:""}
              </td>
              <td style="font-size: 7.2px; color: #475569;">${c.remarks||"—"}</td>
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
    ${f.some(c=>c.photos&&c.photos.length>0)?`
    <div class="pdf-section">
      <div class="section-banner">3.0 PHOTOGRAPHIC VERIFICATION RECORDS</div>
      <div class="photo-grid">
        ${f.flatMap(c=>(c.photos||[]).map(o=>({url:o,label:c.label}))).map((c,o)=>`
          <div class="photo-card">
            <span class="photo-tag">Photo #${o+1}</span>
            <div><img src="${c.url}" alt="Inspection Evidence" /></div>
            <div class="photo-caption">${c.label}</div>
          </div>
        `).join("")}
      </div>
    </div>
    `:""}

    <!-- 4.0 Statutory Sign-Off -->
    <div class="pdf-section">
      <div class="section-banner">4.0 STATUTORY WITNESS & VERIFICATION SIGN-OFF</div>
      <table class="signoff-table">
        ${(()=>{let c="";for(let n=0;n<E.length;n+=3){const l=E.slice(n,n+3),I=(100/Math.max(l.length,1)).toFixed(2);c+=`<tr>${l.map(S=>`
              <td style="width: ${I}%; vertical-align: top; padding: 6px 8px; border: 1px solid #cbd5e1; background: ${S.signed?"#f0fdf4":"#fafafa"};">
                <div class="sig-role-header">
                  <span>${S.designation?`${S.designation} (${S.role})`:S.role}</span>
                  <span class="sig-required-tag" style="font-size: 6.5px; font-weight: 700; background: ${S.required?"#dcfce7":"#f1f5f9"}; color: ${S.required?"#15803d":"#64748b"}; padding: 1px 4px; border-radius: 2px;">
                    ${S.required?"REQUIRED":"OPTIONAL"}
                  </span>
                </div>
                <div style="font-size: 8px; color: #334155; margin-bottom: 4px;">
                  Name: <strong>${S.name||"________________________"}</strong>
                </div>
                <div class="sig-line" style="border-bottom: 1px dashed #cbd5e1; margin: 4px 0;"></div>
                <div style="display: flex; justify-content: space-between; font-size: 7.2px; color: #64748b; margin-top: 3px;">
                  <span>${S.signed?'<strong style="color: #15803d;">✓ Digitally Signed</strong>':"Sign: ___________________"}</span>
                  <span>Date: ${S.signed&&S.signedAt?A(S.signedAt):S.signed?A(t.scheduledDate||t.createdAt):"____/____/20__"}</span>
                </div>
              </td>
            `).join("")}</tr>`}return c})()}
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${p}</div>
      <div>Inspection Ref: ${x}</div>
    </div>
  `;K(`${x} - Inspection Report`,R)}const Ce=xe;function te(t,r){if(!t||!t.trim())return`
      <div style="font-size: 7.5px; color: #64748b; margin-bottom: 3.5px;">
        <strong style="color: ${r.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 1.5px;">${r.title}:</strong>
        <span style="font-style: italic;">—</span>
      </div>
    `;const p=t.replace(/<br\s*\/?>/gi,`
`).split(/\r?\n/).map(f=>f.trim()).filter(Boolean);if(p.length===0)return`
      <div style="font-size: 7.5px; color: #64748b; margin-bottom: 3.5px;">
        <strong style="color: ${r.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 1.5px;">${r.title}:</strong>
        <span style="font-style: italic;">—</span>
      </div>
    `;if(p.length===1)return`
      <div style="font-size: 7.5px; color: ${r.textColor||"#0f172a"}; margin-bottom: 3.5px;">
        <strong style="color: ${r.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 1.5px;">${r.title}:</strong>
        <div style="white-space: pre-line; line-height: 1.45;">${p[0]}</div>
      </div>
    `;const T=p.every(f=>/^(\d+[\.\)]|[a-zA-Z][\.\)]|[-•*])\s*/.test(f)),x=p.map((f,d)=>`
        <div style="display: flex; align-items: flex-start; line-height: 1.4; margin-bottom: 2.5px;">
          ${T?"":`<span style="font-weight: 700; color: ${r.bulletColor||r.titleColor}; margin-right: 4px; min-width: 13px; display: inline-block;">${d+1}.</span>`}
          <span style="flex: 1; white-space: pre-line;">${f}</span>
        </div>
      `).join("");return`
    <div style="font-size: 7.5px; color: ${r.textColor||"#0f172a"}; margin-bottom: 4px;">
      <strong style="color: ${r.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 2px;">${r.title}:</strong>
      <div style="padding-left: 1px;">
        ${x}
      </div>
    </div>
  `}function Ne(t,r={},m={}){var E,R,h,a,y,c;const p=(h=(R=(E=Zt)==null?void 0:E.getState)==null?void 0:R.call(E))==null?void 0:h.activeProject,x=(((c=(y=(a=Zt)==null?void 0:a.getState)==null?void 0:y.call(a))==null?void 0:c.projects)||[]).find(o=>o.id===(t.projectId||t.project)),f=(m==null?void 0:m.name)||t.companyName||"Collection Developments LTD",d=(r==null?void 0:r.name)||t.projectName||t.projectTitle||(x==null?void 0:x.name)||(p==null?void 0:p.name)||"Site Construction Operations",u=t.reportNumber||`QC-COMM-${Math.floor(1e3+Math.random()*9e3)}`,g=t.observations||[],v=g.filter(o=>o.status!=="CLOSED"&&o.status!=="Compliant"&&o.status!=="RECTIFIED").length,N=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${J(m,r)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">SITE COMMENTS & FIELD OBSERVATIONS REPORT</div>
          <div class="header-title-project">PROJECT: ${d}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.5 & 8.7 Nonconformity Identification</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${u}</span></div>
          <div><strong>Date:</strong> ${A(t.inspectionDate||t.createdAt)}</div>
          <div><strong>Status:</strong> <span class="${v===0?"badge-pass":"badge-pending"}">${v===0?"ALL CLOSED":`${v} ACTION(S) PENDING`}</span></div>
        </td>
      </tr>
    </table>

    <!-- 1.0 Report Overview -->
    <div class="pdf-section">
      <div class="section-banner">1.0 GENERAL REPORT PARAMETERS & AUDIT CONTEXT</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 18%;">Project Name:</td>
          <td class="grid-value" style="width: 32%;">${d}</td>
          <td class="grid-label" style="width: 18%;">Inspection Date:</td>
          <td class="grid-value" style="width: 32%;">${A(t.inspectionDate)}</td>
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
          ${g.length>0?g.map((o,n)=>{const l=o.comments||o.observationText||o.fieldObservation||"—",I=o.correctiveDirective||"Rectify per approved engineering specifications.",S=o.status==="CLOSED"||o.status==="Compliant"||o.status==="RECTIFIED";return`
            <tr>
              <td style="text-align: center; font-weight: 700; color: #64748b;">${n+1}</td>
              <td>
                <div style="font-weight: 700; color: #0f172a;">${o.levelName||"Site Area"}</div>
                ${o.structuralElement?`<div style="font-size: 7.2px; font-weight: 600; color: #ea580c;">${o.structuralElement}</div>`:""}
                ${o.gridLocation?`<div style="font-size: 7px; color: #64748b;">Grid: ${o.gridLocation}</div>`:""}
                <div style="font-size: 7px; color: #475569; margin-top: 2px;"><strong>Trade:</strong> ${o.tradeName||o.trade||"Civil"}</div>
              </td>
              <td>
                ${te(l,{title:"Observed Condition",titleColor:"#991b1b",bulletColor:"#991b1b",textColor:"#0f172a"})}
                ${te(I,{title:"Corrective Directive",titleColor:"#15803d",bulletColor:"#15803d",textColor:"#166534"})}
                <div style="font-size: 7px; color: #64748b; margin-top: 2px;">
                  Assigned To: <strong>${o.assignedTo||o.assignedSubcontractor||"Contractor"}</strong>
                  ${o.dueDate?` | Target Due: ${A(o.dueDate)}`:""}
                </div>

                ${o.photos&&o.photos.length>0?`
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; padding-top: 3px; border-top: 1px dashed #cbd5e1;">
                  ${o.photos.map((w,P)=>{const O=typeof w=="string"?w:(w==null?void 0:w.url)||(w==null?void 0:w.thumbnailUrl);return O?`<img src="${O}" style="height: 50px; max-width: 80px; object-fit: cover; border-radius: 2px; border: 1px solid #cbd5e1;" alt="Photo ${P+1}" />`:""}).join("")}
                </div>
                `:""}
              </td>
              <td style="text-align: center;">
                <span class="${S?"badge-pass":"badge-pending"}">${o.status||"OPEN"}</span>
                <div style="margin-top: 2px;">
                  <span class="${o.severity==="CRITICAL"?"badge-fail":o.severity==="HIGH"?"badge-pending":"badge-pass"}" style="font-size: 6.5px;">${o.severity||"MEDIUM"}</span>
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
              <span>Date: ${A(t.inspectionDate||t.createdAt)}</span>
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
      <div>Report Ref: ${u}</div>
    </div>
  `;K(`${u} - Site Comments`,N)}function Ae(t,r={},m={}){var d,u,g,v,N,E,R,h;const p=m.name||"Collection Developments LTD",T=r.name||"Bankside",x=t.rfiNumber||`RFI-2026-${Math.floor(1e3+Math.random()*9e3)}`,f=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${J(m,r)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">REQUEST FOR INFORMATION (RFI)</div>
          <div class="header-title-project">PROJECT: ${T}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.2 Design & Engineering Communications</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${x}</span></div>
          <div><strong>Date Raised:</strong> ${A(t.createdAt)}</div>
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
          <td class="grid-value">${((d=t.raisedBy)==null?void 0:d.name)||"Site Engineer"} (${((u=t.raisedBy)==null?void 0:u.role)||"Main Contractor"})</td>
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
      <div class="section-banner">4.0 CONSULTANT FORMAL RESPONSE & DIRECTIVE [${((g=t.response)==null?void 0:g.approvalStatus)||"UNDER REVIEW"}]</div>
      <div class="box-content">
        <div style="line-height: 1.45; color: #0f172a; margin-bottom: 6px;">
          ${((v=t.response)==null?void 0:v.responseText)||"Official response is currently being finalized by the engineering design consultant."}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #475569; border-top: 1px solid #f1f5f9; padding-top: 4px;">
          <span>Reviewed By: <strong>${((N=t.response)==null?void 0:N.responderName)||t.assignedConsultant||"Consultant"}</strong></span>
          <span>Response Date: <strong>${A((E=t.response)==null?void 0:E.responseDate)}</strong></span>
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
            <div style="font-size: 8px; color: #334155;">Name: <strong>${((R=t.raisedBy)==null?void 0:R.name)||"Lead Engineer"}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${A(t.createdAt)}</span>
            </div>
          </td>
          <td style="width: 50%;">
            <div class="sig-role-header"><span>CONSULTANT / LEAD ENGINEER</span><span class="sig-required-tag">REQUIRED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${t.assignedConsultant||"Lead Consultant"}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${A((h=t.response)==null?void 0:h.responseDate)}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${p}</div>
      <div>RFI Ref: ${x}</div>
    </div>
  `;K(`${x} - Technical RFI`,f)}function $e(t,r={},m={}){var v,N,E,R,h;const p=m.name||"Collection Developments LTD",T=r.name||"Bankside",x=t.marNumber||`MAR-2026-${Math.floor(1e3+Math.random()*9e3)}`,f=t.submittedByName||(typeof t.submittedBy=="string"?t.submittedBy:"QA/QC Materials Lead"),d=((v=t.reviewedBy)==null?void 0:v.name)||((N=t.response)==null?void 0:N.respondedByName)||t.assignedConsultantName||"Materials Consultant",u=((E=t.reviewedBy)==null?void 0:E.date)||((R=t.response)==null?void 0:R.responseDate)||(t.updatedAt?A(t.updatedAt):A(t.createdAt)),g=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${J(m,r)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">MATERIAL APPROVAL REQUEST (MAR)</div>
          <div class="header-title-project">PROJECT: ${T}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.4 Control of Externally Provided Products & Services</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${x}</span></div>
          <div><strong>Date:</strong> ${A(t.createdAt)}</div>
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
          <td class="grid-value">${f}</td>
          <td class="grid-label">CONSULTANT REVIEWER:</td>
          <td class="grid-value"><strong>${d}</strong></td>
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
          ${t.reviewComments||((h=t.response)==null?void 0:h.responseText)||"Submittal is in accordance with project specifications."}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #475569; border-top: 1px solid #f1f5f9; padding-top: 4px;">
          <span>Review Status: <strong>${t.status||"APPROVED"}</strong></span>
          <span>Review Date: <strong>${u}</strong></span>
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
            <div style="font-size: 8px; color: #334155;">Name: <strong>${f}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${A(t.createdAt)}</span>
            </div>
          </td>
          <td style="width: 50%;">
            <div class="sig-role-header"><span>CONSULTANT / MATERIALS ENGINEER</span><span class="sig-required-tag">REQUIRED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${d}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${u}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${p}</div>
      <div>MAR Ref: ${x}</div>
    </div>
  `;K(`${x} - Material Approval Request`,g)}function we(t,r={},m={}){var E,R,h,a,y,c;const p=m.name||" ",T=r.name||" ",x=t.sampleNumber||t.sampleId||`CUBE-${Math.floor(1e3+Math.random()*9e3)}`,f=t.target28DayStrengthNmm2||t.day28Required||(t.targetStrength?parseFloat(t.targetStrength):0)||30,d=[],u=[{age:1,title:"1-Day Test",resArray:t.day1Results,testSummary:(E=t.tests)==null?void 0:E.day1,req:t.day1Required,defaultTargetRatio:.2,dateField:t.day1Date},{age:3,title:"3-Day Test",resArray:t.day3Results,testSummary:(R=t.tests)==null?void 0:R.day3,req:t.day3Required,defaultTargetRatio:.45,dateField:t.day3Date},{age:7,title:"7-Day Test",resArray:t.day7Results,testSummary:(h=t.tests)==null?void 0:h.day7,req:t.day7Required,defaultTargetRatio:.7,dateField:t.day7Date},{age:14,title:"14-Day Test",resArray:t.day14Results,testSummary:(a=t.tests)==null?void 0:a.day14,req:t.day14Required,defaultTargetRatio:.85,dateField:t.day14Date},{age:28,title:"28-Day Test",resArray:t.day28Results,testSummary:(y=t.tests)==null?void 0:y.day28,req:t.day28Required,defaultTargetRatio:1,dateField:t.day28Date}];for(const o of u){const n=o.req||Math.round(f*o.defaultTargetRatio*10)/10;if(o.resArray&&o.resArray.length>0){const l=o.resArray[0];d.push({age:o.age,title:o.title,testDate:l.testDate||o.dateField||t.castDate,targetStrength:n,averageStrength:l.averageStrength||0,maximumStrength:l.maximumStrength,minimumStrength:l.minimumStrength,standardDeviation:l.standardDeviation,status:l.status||(l.averageStrength>=n?"PASS":"FAIL"),technician:l.technician||t.preparedBy||"Materials Technician",testingStandard:l.testingStandard||"BS EN 12390-3",cubes:l.cubes||[]})}else if(o.testSummary){const l=o.testSummary,I=l.averageStrengthNmm2??l.compressiveStrengthNmm2??0;d.push({age:o.age,title:o.title,testDate:l.actualTestDate||l.testDate||l.scheduledDate||o.dateField||t.castDate,targetStrength:l.requiredStrengthNmm2||l.targetStrengthNmm2||n,averageStrength:I,maximumStrength:I,minimumStrength:I,standardDeviation:0,status:l.compliance||(I>=n?"PASS":"FAIL"),technician:l.testedBy||l.labTechnician||t.preparedBy||"Materials Technician",testingStandard:"BS EN 12390-3",cubes:(l.cubes||l.individualResults||[]).map((S,w)=>({id:w+1,load:S.failureLoadKn||S.crushingLoadKn||l.crushingLoadKn||"—",strength:S.compressiveStrengthNmm2||I,failureMode:S.typeOfFailure||S.failureMode||"Satisfactory",cubeWeight:S.weightKg||""}))})}}const g=d.find(o=>o.age===28),v=g?g.status==="PASS"||g.averageStrength>=g.targetStrength:null,N=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${J(m,r)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">CONCRETE COMPRESSIVE STRENGTH TEST CERTIFICATE</div>
          <div class="header-title-project">PROJECT: ${T}</div>
          <div class="header-title-iso">BS EN 12390-3 / ASTM C39 Compressive Strength Quality Verification</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${x}</span></div>
          ${t.inscribedName?`<div><strong>Inscribed Mark:</strong> <span style="font-weight:700; color:#0f172a;">${t.inscribedName}</span></div>`:""}
          <div><strong>Cast Date:</strong> ${t.castDate||A(t.castDate)}</div>
          <div><strong>Status:</strong> <span class="${t.status==="APPROVED"||v?"badge-pass":v===!1||t.status==="NCR_ISSUED"||t.status==="REJECTED"?"badge-fail":"badge-pending"}">${t.status||(v?"28D COMPLIANT":"IN PROGRESS")}</span></div>
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
          <td class="grid-value" style="width: 32%;"><strong>${t.concreteGrade}</strong> (Target: ${f} MPa)</td>
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
          <td class="grid-value">Start: ${A(t.curingStartDate||t.castDate)} ${t.removedFromTankDate?`• Out: ${A(t.removedFromTankDate)}`:""}</td>
        </tr>
      </table>
    </div>

    <!-- 3.0 Multi-Cube Crushing Results -->
    <div class="pdf-section">
      <div class="section-banner">3.0 LABORATORY COMPRESSION CRUSHING LOG & STRENGTH STATISTICAL EVALUATION</div>
      ${d.length>0?d.map(o=>{const n=o.status==="PASS"||o.averageStrength>=o.targetStrength;return`
        <div style="margin-bottom: 8px; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden;">
          <div style="background: #f8fafc; padding: 4px 8px; font-weight: 700; font-size: 8px; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0;">
            <span>${o.title.toUpperCase()} (Test Date: ${A(o.testDate)}) — Standard: ${o.testingStandard}</span>
            <span style="color: ${n?"#15803d":"#b91c1c"}; font-weight: 800;">${n?"COMPLIANT (PASS)":"NON-COMPLIANT (FAIL)"}</span>
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
              ${o.cubes.length>0?o.cubes.map(l=>`
                <tr>
                  <td style="text-align: center; font-weight: 700; color: #0f172a;">Cube #${l.id}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 700;">${l.load||"—"}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 800; color: ${n?"#15803d":"#b91c1c"};">${l.strength||"—"}</td>
                  <td style="color: #475569; font-size: 7.2px;">${l.failureMode||"Cone Failure (Satisfactory)"}</td>
                  <td style="text-align: right; font-family: monospace; color: #64748b;">${l.cubeWeight||"—"}</td>
                </tr>
              `).join(""):`
                <tr>
                  <td colspan="5" style="text-align: center; color: #64748b; padding: 6px;">Individual load readings recorded directly in laboratory register.</td>
                </tr>
              `}
              <tr style="background: #f1f5f9; font-weight: 700;">
                <td colspan="2" style="font-size: 7.5px;">AVERAGE: <strong style="font-size: 8.5px; color: ${n?"#15803d":"#b91c1c"}; font-family: monospace;">${o.averageStrength} MPa</strong> (Target: ${o.targetStrength} MPa)</td>
                <td colspan="2" style="font-size: 7.2px; color: #475569;">Min: ${o.minimumStrength??o.averageStrength} MPa • Max: ${o.maximumStrength??o.averageStrength} MPa • SD: ${o.standardDeviation??"—"}</td>
                <td style="text-align: right;"><span class="${n?"badge-pass":"badge-fail"}">${n?"PASS":"FAIL"}</span></td>
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
              <span>Date: ${A(t.preparedByDate||((c=d[0])==null?void 0:c.testDate)||t.castDate)}</span>
            </div>
          </td>
          <td style="width: 33.33%;">
            <div class="sig-role-header"><span>CONSULTANT ENGINEER</span><span class="sig-optional-tag">OPTIONAL</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${t.reviewedBy||t.approvedBy||""}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 10px;">
              <span>Sign: ___________________</span>
              <span>Date: ${A(t.reviewedByDate||t.approvedByDate||t.castDate)}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${p}</div>
      <div>Certificate Ref: ${x}</div>
    </div>
  `;K(`${x} - Cube Test Certificate`,N)}function Oe(t,r={},m={},p){var yt,Et,Tt,St,It,Rt;const T=m.name||"Collection Developments LTD",x=m.legalName||(m==null?void 0:m.companyName)||"Collection Developments Limited",f=m.logoUrl||m.logo||(m==null?void 0:m.logoBase64)||t.logoBase64||"",d=r.name||t.projectName||"BANKSIDE",u=t.reportNumber||`WQR-2026-${Math.floor(1e3+Math.random()*9e3)}`,g=(p==null?void 0:p.includeNcrs)!==void 0?p.includeNcrs:(p==null?void 0:p.includeNcrsAndComments)!==void 0?p.includeNcrsAndComments:t.includeNcrs!==void 0?t.includeNcrs:t.includeNcrsAndComments!==!1,v=(p==null?void 0:p.includeSiteComments)!==void 0?p.includeSiteComments:(p==null?void 0:p.includeNcrsAndComments)!==void 0?p.includeNcrsAndComments:t.includeSiteComments!==void 0?t.includeSiteComments:t.includeNcrsAndComments!==!1,N=(p==null?void 0:p.includeSiteInstructions)!==void 0?p.includeSiteInstructions:t.includeSiteInstructions!==!1;function E(i){if(!i)return"";if(typeof i=="string"){const s=i.trim();if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;const e=new Date(s);return isNaN(e.getTime())?s:e.toISOString().split("T")[0]}return typeof i=="number"?new Date(i).toISOString().split("T")[0]:i instanceof Date&&!isNaN(i.getTime())?i.toISOString().split("T")[0]:""}function R(){try{const i=Jt.getState().currentUser;return(i==null?void 0:i.email)||""}catch{return""}}const h=t.startDate||t.weekStart||"",a=t.endDate||t.weekEnd||"",y=E(h)||"—",c=E(a)||"—",o=c!=="—"?c:E(t.reportDate||t.createdAt)||E(new Date),n=typeof t.preparedBy=="object"&&t.preparedBy?t.preparedBy:{name:typeof t.preparedBy=="string"?t.preparedBy:"",designation:"QA/QC ENGINEER",role:"QA/QC ENGINEER"},l=n.name||((yt=Jt.getState().currentUser)==null?void 0:yt.fullName)||((Et=Jt.getState().currentUser)==null?void 0:Et.displayName)||"Authorized QA/QC Engineer",I=n.designation||n.role||"QA/QC ENGINEER",S=n.email||R()||"—";n.signed;const w=n.signatureUrl||"",P=(t.cubeTests&&t.cubeTests.length>0?t.cubeTests:t.filteredCubeTests)||[],O=t.quantitySummary||[],H=t.mepClearance||[],B=(t.materialDeliveries&&t.materialDeliveries.length>0?t.materialDeliveries:t.filteredMaterialDeliveries)||[],j=(t.ncrRemediationLog&&t.ncrRemediationLog.length>0?t.ncrRemediationLog:t.filteredNcrs)||t.ncr||[],M=(t.siteComments&&t.siteComments.length>0?t.siteComments:t.filteredSiteComments)||t.filteredFindings||[],D=(t.siteInstructions&&t.siteInstructions.length>0?t.siteInstructions:t.filteredSiteInstructions)||[],at=t.projectCoverImageUrl||t.coverImageUrl||t.coverImageBase64||r.coverImageUrl||r.imageUrl||(r==null?void 0:r.image)||(t==null?void 0:t.projectImage)||"",X=(t.pictorialUrls||[]).filter(i=>{const s=typeof i=="string"?i:i==null?void 0:i.url;return!!(s&&typeof s=="string"&&s.trim().length>0)}),ct=t.beamLayoutImg,pt=t.columnLayoutImg,wt=t.slabImg,Z=t.structuralElements||[],Ot=Z.filter(i=>(i.elementType||i.type||i.element||"").toLowerCase().includes("column")),Dt=Z.filter(i=>(i.elementType||i.type||i.element||"").toLowerCase().includes("beam")),Pt=Z.filter(i=>(i.elementType||i.type||i.element||"").toLowerCase().includes("slab")),Y=(t.selectedLevel||t.selectedLevelName||"—").toUpperCase();let tt=0,et=0;O.length>0?O.forEach(i=>{const s=parseFloat(String(i.calculatedVolume??i.plannedVolume??i.scope??0))||0,e=parseFloat(String(i.achievedVolume??i.actualVolume??0))||0;tt+=s,et+=e}):Z.length>0&&Z.forEach(i=>{const s=parseFloat(String(i.calculatedVolume||i.volume||0))||0,e=parseFloat(String(i.achievedVolume??i.completedVolume??0))||0;tt+=s,et+=e}),tt===0&&t.totalVolumeCalculated&&(tt=Number(t.totalVolumeCalculated)||0),et===0&&t.totalVolumeAchieved&&(et=Number(t.totalVolumeAchieved)||0);const _t=tt>0?Math.round(et/tt*100):0,gt=(((Tt=t.ncrStats)==null?void 0:Tt.openTotal)??0)+M.filter(i=>{const s=String(i.status||"").toLowerCase();return s.includes("non")||s.includes("open")||s.includes("progress")||s.includes("pending")}).length,Lt=t.overallQualityCompliance!==void 0&&t.overallQualityCompliance!==null?Number(t.overallQualityCompliance):((St=t.metrics)==null?void 0:St.inspectionPassRate)!==void 0&&((It=t.metrics)==null?void 0:It.inspectionPassRate)!==null?Number(t.metrics.inspectionPassRate):100,kt=()=>`
    <div style="display: flex; align-items: center; gap: 6px;">
      ${f?`<img src="${f}" style="max-height: 22px; max-width: 80px; object-fit: contain;" alt="Logo" />`:`
          <div style="display: flex; gap: 2px; align-items: flex-end; height: 16px;">
            <span style="width: 3.5px; height: 9px; background: #c28b5e; border-radius: 1px;"></span>
            <span style="width: 3.5px; height: 16px; background: #c28b5e; border-radius: 1px;"></span>
            <span style="width: 3.5px; height: 12px; background: #c28b5e; border-radius: 1px;"></span>
          </div>
          <span style="font-size: 8.5px; font-weight: 900; color: #0f172a; letter-spacing: 0.8px; text-transform: uppercase;">COLLECTION</span>
        `}
    </div>
  `,F=i=>`
    <div class="pdf-header">
      <div class="pdf-header-top">
        <div style="display: flex; align-items: center; gap: 8px;">
          ${kt()}
          <div style="font-size: 8.5px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 6px; letter-spacing: 0.2px;">
            <span>${o}</span>
            <span style="color: #cbd5e1;">|</span>
            <span style="color: #64748b;">QA/QC SURVEILLANCE</span>
            <span style="color: #cbd5e1;">|</span>
            <span style="font-weight: 800; color: #0f172a; text-transform: uppercase;">${i}</span>
          </div>
        </div>
        <div style="font-size: 8.5px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase;">
          <span style="color: #0f172a;">${d.toUpperCase()}</span> &nbsp;|&nbsp; <span style="color: #94a3b8;">CONFIDENTIAL</span>
        </div>
      </div>
      <div class="pdf-header-rule"></div>
    </div>
  `,G=i=>`
    <div class="pdf-footer">
      <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">
        Compiled By: <strong style="color: #475569;">${l} (${I})</strong> &nbsp;|&nbsp; ISO 9001:2015 Quality Management System
      </div>
      <div class="pdf-slide-badge">
        SLIDE ${String(i).padStart(2,"0")}
      </div>
    </div>
  `,$=[];$.push(`
    <div class="pdf-sheet" style="padding: 0; display: flex; flex-direction: row; height: 210mm; overflow: hidden; position: relative;">
      <!-- Left Hero Column (~46% width) -->
      <div style="width: 46%; padding: 24mm 14mm 16mm 16mm; display: flex; flex-direction: column; justify-content: space-between; background: #ffffff; position: relative; border-right: 3px solid #d49a5b;">
        <div>
          <!-- Company Brand Header -->
          <div style="margin-bottom: 22px;">
            <div style="display: flex; align-items: flex-end; gap: 2px; margin-bottom: 4px;">
              ${f?`<img src="${f}" style="max-height: 120px; max-width: 190px; object-fit: contain;" alt="${T}" />`:`
                <div style="display: flex; gap: 3px; align-items: flex-end; height: 26px;">
                  <span style="width: 5px; height: 14px; background: #c28b5e; border-radius: 1px;"></span>
                  <span style="width: 5px; height: 24px; background: #c28b5e; border-radius: 1px;"></span>
                  <span style="width: 5px; height: 18px; background: #c28b5e; border-radius: 1px;"></span>
                </div>
              `}
            </div>
            <div style="font-size: 13px; font-weight: 900; color: #0f172a; letter-spacing: 1.5px; text-transform: uppercase;">
              ${T.toUpperCase()}
            </div>
          </div>

          <!-- Project Title & Divider -->
          <div style="margin-bottom: 18px;">
            <div style="font-size: 34px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; text-transform: uppercase; line-height: 1.05;">
              ${d.toUpperCase()}
            </div>
            <div style="width: 100%; height: 2px; background: #c28b5e; margin-top: 14px;"></div>
          </div>

          <!-- Report Title -->
          <div style="font-size: 19px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.3px; margin-bottom: 12px;">
            ${t.title||"QA/QC WEEKLY REPORT"}
          </div>

          <!-- Surveillance Level Tag -->
          <div style="display: inline-block; background: #f1f5f9; color: #475569; font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: 4px; text-transform: uppercase; margin-bottom: 12px;">
            SURVEILLANCE: ${Y}
          </div>
          <div></div>

          <!-- Date Range Pill -->
          <div style="display: inline-block; background: #FFFFFF; border: 1px solid #c28b5e; color: #c28b5e; font-size: 10.5px; font-weight: 800; padding: 6px 22px; border-radius: 9999px; letter-spacing: 0.5px; text-transform: uppercase;">
            ${y} &nbsp;TO&nbsp; ${c}
          </div>
        </div>

        <!-- Compiler Card (Bottom Left) -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #c28b5e; border-radius: 6px; padding: 12px 16px; margin-top: auto;">
          <div style="font-size: 7.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
            AUTHORIZED COMPILER &amp; QA/QC OFFICER
          </div>
          <div style="font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 3px;">
            ${l}
          </div>
          <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 1px;">
            ${I}
          </div>
        </div>
      </div>

      <!-- Right Column (~54% width) Full-Bleed Cover Image -->
      <div style="width: 54%; height: 100%; background: #0f172a; overflow: hidden; position: relative;">
        ${at?`<img src="${at}" style="width: 100%; height: 100%; object-fit: cover;" alt="${d}" />`:`
          <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
            <div style="text-align: center; color: #ffffff; padding: 30px;">
              <div style="font-size: 36px; font-weight: 900; color: #c28b5e;">${d.toUpperCase()}</div>
              <div style="font-size: 12px; color: #94a3b8; font-weight: 700; margin-top: 8px;">OFFICIAL QA/QC SURVEILLANCE DOSSIER</div>
            </div>
          </div>
        `}
      </div>
    </div>
  `),$.push(`
    <div class="pdf-sheet">
      <div>
        ${F("EXECUTIVE SUMMARY: OPERATIONAL OVERVIEW")}
        
        <!-- 4 Top Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px;">
          <!-- Card 1: Total Scope Volume -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #0f172a; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL SCOPE VOLUME</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${tt.toLocaleString(void 0,{maximumFractionDigits:1})} m³</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">Design Volume Target</div>
          </div>

          <!-- Card 2: Achieved Volume -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #0284c7; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">ACHIEVED VOLUME</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${et.toLocaleString(void 0,{maximumFractionDigits:1})} m³</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">${_t}% Cumulative</div>
          </div>

          <!-- Card 3: Quality Compliance -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #16a34a; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">QUALITY COMPLIANCE</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${Lt}%</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">Field Surveillance Benchmark</div>
          </div>

          <!-- Card 4: Open Findings / NCRs -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #dc2626; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">OPEN FINDINGS / NCRS</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${gt}</div>
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
            ${(Rt=t.synopsis||t.executiveSummary)!=null&&Rt.trim()?t.synopsis||t.executiveSummary:'<span style="color: #94a3b8; font-style: italic;">No executive synopsis provided for this reporting period.</span>'}
          </div>
        </div>
      </div>
      ${G($.length+1)}
    </div>
  `);const xt=i=>{const s=i&&i.trim().length>0?i.trim():"";return s?s.split(/\n\s*\n|\n/).map(b=>b.trim()).filter(Boolean).map(b=>{if(b.includes(":")){const C=b.split(":"),_=C[0].trim(),V=C.slice(1).join(":").trim();return`
            <div style="margin-bottom: 12px;">
              <strong style="color: #0f172a; font-weight: 800;">${_}:</strong> ${V}
            </div>
          `}return`<div style="margin-bottom: 10px;">${b}</div>`}).join(""):""};$.push(`
    <div class="pdf-sheet">
      <div>
        ${F("EXECUTIVE SUMMARY: STRATEGIC INSIGHTS")}
        
        <!-- 3 Columns Grid -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; min-height: 420px;">
          <!-- Column 1: Highlights -->
          <div style="display: flex; flex-direction: column;">
            <div style="background: #16a34a; color: #ffffff; text-align: center; padding: 10px 12px; font-weight: 800; font-size: 10.5px; border-radius: 4px 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
              KEY PROJECT HIGHLIGHTS
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 16px; font-size: 9px; line-height: 1.5; color: #334155; background: #ffffff;">
              ${xt(t.highlights)}
            </div>
          </div>

          <!-- Column 2: Risks & Concerns -->
          <div style="display: flex; flex-direction: column;">
            <div style="background: #d97706; color: #ffffff; text-align: center; padding: 10px 12px; font-weight: 800; font-size: 10.5px; border-radius: 4px 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
              CRITICAL RISKS &amp; OPEN CONCERNS
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 16px; font-size: 9px; line-height: 1.5; color: #334155; background: #ffffff;">
              ${xt(t.concerns)}
            </div>
          </div>

          <!-- Column 3: Look-Ahead Plan -->
          <div style="display: flex; flex-direction: column;">
            <div style="background: #4f46e5; color: #ffffff; text-align: center; padding: 10px 12px; font-weight: 800; font-size: 10.5px; border-radius: 4px 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
              LOOK-AHEAD PLAN &amp; ACTION TARGETS
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 16px; font-size: 9px; line-height: 1.5; color: #334155; background: #ffffff;">
              ${xt(t.nextWeekPlan)}
            </div>
          </div>
        </div>
      </div>
      ${G($.length+1)}
    </div>
  `);const ut=P,Mt=ut.length>0?ut.map((i,s)=>{var V,U,Q,q;const e=i.strength7Days||((U=(V=i.day7Results)==null?void 0:V[0])!=null&&U.averageStrength?`${i.day7Results[0].averageStrength} N/mm²`:"—"),b=i.strength28Days||((q=(Q=i.day28Results)==null?void 0:Q[0])!=null&&q.averageStrength?`${i.day28Results[0].averageStrength} N/mm²`:"—"),C=String(i.status7Days||(e!=="—"?"PASS":"pending")).toLowerCase(),_=String(i.status28Days||(b!=="—"?"PASS":"pending")).toLowerCase();return`
              <tr>
                <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(s+1).padStart(2,"0")}</td>
                <td style="font-family: monospace; font-weight: 600;">${E(i.dateCast||i.castDate||i.date)||"—"}</td>
                <td style="font-weight: 800; color: #0f172a; text-transform: uppercase;">${i.elementLevel||i.element||i.inscribedName||"Structural Element"}</td>
                <td style="font-family: monospace; font-weight: 700; text-align: center;">${e}</td>
                <td style="text-align: center; font-weight: 800; color: ${C.includes("pass")?"#16a34a":"#d97706"};">${C.includes("pass")?"PASS":C.toUpperCase()}</td>
                <td style="font-family: monospace; font-weight: 700; text-align: center;">${b}</td>
                <td style="text-align: center; font-weight: 800; color: ${_.includes("pass")?"#16a34a":"#d97706"};">${_.includes("pass")?"PASS":_.toUpperCase()}</td>
              </tr>
            `}).join(""):`
        <tr>
          <td colspan="7" style="text-align: center; color: #64748b; padding: 24px; font-weight: 600;">
            No concrete compressive strength test records logged for this reporting period.
          </td>
        </tr>
      `;$.push(`
    <div class="pdf-sheet">
      <div>
        ${F("CONCRETE COMPRESSIVE STRENGTH TEST MATRIX")}
        
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
            ${Mt}
          </tbody>
        </table>
      </div>
      ${G($.length+1)}
    </div>
  `);const ft=["#3b82f6","#10b981","#f97316","#8b5cf6","#06b6d4","#ec4899","#f59e0b"],L=[];if(O.length>0)O.forEach((i,s)=>{const e=parseFloat(String(i.calculatedVolume??i.plannedVolume??i.scope??0))||0,b=parseFloat(String(i.achievedVolume??i.actualVolume??0))||0;let C=e>0?Math.round(b/e*100):parseInt(String(i.completion||0));C=Math.min(100,Math.max(0,C)),L.push({name:String(i.element||i.structuralElement||`Element ${s+1}`).toUpperCase().trim(),scope:e,completion:C,color:ft[s%ft.length]})});else if(Z.length>0){const i={};Z.forEach(s=>{const e=(s.elementType||s.type||s.element||"OTHER").toUpperCase().trim(),b=parseFloat(String(s.calculatedVolume||s.volume||0))||0,C=parseFloat(String(s.achievedVolume??s.completedVolume??0))||0;i[e]||(i[e]={scope:0,achieved:0}),i[e].scope+=b,i[e].achieved+=C}),Object.entries(i).forEach(([s,e],b)=>{const C=e.scope>0?Math.min(100,Math.max(0,Math.round(e.achieved/e.scope*100))):0;L.push({name:s,scope:Math.round(e.scope*100)/100,completion:C,color:ft[b%ft.length]})})}const ht=L.reduce((i,s)=>i+s.scope,0),zt=L.length>0?Math.round(L.reduce((i,s)=>i+s.completion,0)/L.length):0,vt=(()=>{if(L.length===0||ht===0)return{svg:`
          <svg width="150" height="150" viewBox="0 0 150 150" style="display: block; margin: 0 auto;">
            <circle cx="75" cy="75" r="62" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3 3" />
            <text x="75" y="78" text-anchor="middle" font-size="8.5" fill="#94a3b8" font-family="-apple-system, sans-serif" font-weight="600">No Volume Data</text>
          </svg>
        `,legend:`
          <div style="margin-top: 10px; font-size: 7.5px; color: #94a3b8; text-align: center; font-style: italic;">
            No quantity distribution recorded
          </div>
        `};const i=150,s=75,e=75,b=62;let C=-Math.PI/2;const _=[];L.forEach(Q=>{const z=(ht>0?Q.scope/ht:1/(L.length||1))*2*Math.PI,it=C+z,st=s+b*Math.cos(C),Ct=e+b*Math.sin(C),Nt=s+b*Math.cos(it),At=e+b*Math.sin(it),$t=z>Math.PI?1:0,k=`M ${s} ${e} L ${st.toFixed(2)} ${Ct.toFixed(2)} A ${b} ${b} 0 ${$t} 1 ${Nt.toFixed(2)} ${At.toFixed(2)} Z`;_.push(`<path d="${k}" fill="${Q.color}" stroke="#ffffff" stroke-width="1.5" />`),C=it});const V=`
      <svg width="${i}" height="${i}" viewBox="0 0 ${i} ${i}" style="display: block; margin: 0 auto;">
        ${_.join("")}
      </svg>
    `,U=`
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; margin-top: 10px; font-size: 7.5px; font-weight: 800;">
        ${L.map(Q=>`
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="display: inline-block; width: 8px; height: 8px; background: ${Q.color}; border-radius: 1.5px;"></span>
            <span style="color: #334155; text-transform: uppercase;">${Q.name}</span>
          </div>
        `).join("")}
      </div>
    `;return{svg:V,legend:U}})(),Ut=()=>{if(L.length===0)return`
        <div style="margin-top: 10px; background: #fafbfd; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; color: #94a3b8; font-size: 8.5px; font-style: italic;">
          No element quantity comparison metrics logged for this level.
        </div>
      `;const i=720,s=100,e=78,b=Math.max(...L.map(U=>U.scope),10),C=i/(L.length||1),_=Math.min(22,C*.32),V=L.map((U,Q)=>{const q=Q*C+C/2,z=b>0?U.scope/b*58:0,it=U.scope*U.completion/100,st=b>0?it/b*58:0,Ct=q-_-2,Nt=e-z,At=q+2,$t=e-st;return`
          <!-- Scope Bar (Blue) -->
          <rect x="${Ct.toFixed(1)}" y="${Nt.toFixed(1)}" width="${_.toFixed(1)}" height="${Math.max(z,1).toFixed(1)}" rx="1.5" fill="#3b82f6" />
          <!-- Achieved Bar (Orange) -->
          <rect x="${At.toFixed(1)}" y="${$t.toFixed(1)}" width="${_.toFixed(1)}" height="${Math.max(st,1).toFixed(1)}" rx="1.5" fill="#f97316" />
          <!-- X-Axis Label -->
          <text x="${q.toFixed(1)}" y="${(e+14).toFixed(1)}" text-anchor="middle" font-size="8" font-weight="700" fill="#475569" font-family="-apple-system, sans-serif" letter-spacing="0.3">${U.name}</text>
        `}).join("");return`
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
        <svg width="100%" height="${s}" viewBox="0 0 ${i} ${s}" style="display: block; overflow: visible;">
          <line x1="20" y1="${e}" x2="${i-20}" y2="${e}" stroke="#cbd5e1" stroke-width="1.2" />
          ${V}
        </svg>
      </div>
    `},Ft=L.length>0?L.map(i=>`
            <tr>
              <td style="font-weight: 800; color: #0f172a; text-transform: uppercase;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="display: inline-block; width: 3px; height: 13px; background: ${i.color}; border-radius: 1px; shrink: 0;"></span>
                  <span>${i.name}</span>
                </div>
              </td>
              <td style="font-family: monospace; font-weight: 700; color: #1e293b;">${i.scope.toLocaleString(void 0,{maximumFractionDigits:1})}</td>
              <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${i.completion}%</td>
            </tr>
          `).join(""):`
        <tr>
          <td colspan="3" style="text-align: center; color: #64748b; padding: 18px; font-weight: 600;">
            No quantity data recorded for this level.
          </td>
        </tr>
      `;$.push(`
    <div class="pdf-sheet">
      <div>
        ${F(`${Y} — QUANTITY SUMMARY`)}
        
        <!-- Top Half: Table and Pie Chart -->
        <div style="display: flex; gap: 16px; align-items: stretch; margin-top: 8px;">
          <!-- Left Table (50% width) -->
          <div style="flex: 1.1;">
            <div style="font-size: 10px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 6px; letter-spacing: -0.2px;">
              ${Y} FLOOR CONCRETE CHART
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
                ${Ft}
                ${L.length>0?`
                  <tr style="background: #f8fafc; font-weight: 900; border-top: 2px solid #cbd5e1;">
                    <td style="font-size: 8.5px; color: #0f172a; text-transform: uppercase; font-weight: 900;">TOTAL</td>
                    <td style="font-family: monospace; font-size: 9px; color: #0f172a; font-weight: 900;">${ht.toLocaleString(void 0,{maximumFractionDigits:1})}</td>
                    <td style="font-family: monospace; font-size: 9px; color: #0f172a; font-weight: 900;">${zt}%</td>
                  </tr>
                `:""}
              </tbody>
            </table>
          </div>

          <!-- Right Pie Chart Card (50% width) -->
          <div style="flex: 0.9; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; display: flex; flex-direction: column; justify-content: space-between;">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
              ${vt.svg}
              ${vt.legend}
            </div>
            <div style="text-align: center; font-size: 8px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-top: 6px; letter-spacing: 0.5px;">
              ${Y} FLOOR CONCRETE CHART
            </div>
          </div>
        </div>

        <!-- Bottom Half: Grouped Vertical Bar Chart -->
        ${Ut()}
      </div>
      ${G($.length+1)}
    </div>
  `);function mt(i,s,e,b,C,_=!0){if(_&&e.length>0){const U=Math.ceil(e.length/26);let Q=0,q=0;e.forEach(z=>{const it=parseFloat(String(z.calculatedVolume||z.volume||0))||0,st=parseFloat(String(z.achievedVolume??z.completedVolume??0))||0;Q+=it,q+=st});for(let z=0;z<U;z++){const it=e.slice(z*26,(z+1)*26),st=z===0,Ct=z===U-1,Nt=st?`${Y} — ${s.toUpperCase()} ELEMENTS STATUS`:`${Y} — ${i.toUpperCase()} STATUS (CONT'D)`,At=it.map(k=>{const Wt=parseFloat(String(k.calculatedVolume||k.volume||0))||0,Kt=parseFloat(String(k.achievedVolume??k.completedVolume??0))||0;let bt=Wt>0?Math.round(Kt/Wt*100):Number(k.completionPercentage||k.completion||0);bt=Math.min(100,Math.max(0,bt));const Xt=(k.status||k.qaStatus||k.inspectionStatus||"PENDING").toString().trim(),W=Xt.toUpperCase().replace(/\s+/g,"_"),ae=Xt.replace(/_/g," ").toUpperCase();let nt="#f8fafc",dt="#475569",ot="#cbd5e1",rt=bt>0?"#3b82f6":"#cbd5e1";W.includes("APPROV")||W==="COMPLETED"||W==="PASS"?(nt="#ecfdf5",dt="#059669",ot="#a7f3d0",rt="#16a34a"):W==="POURED"||W.includes("CAST")?(nt="#ecfeff",dt="#0891b2",ot="#a5f3fc",rt="#06b6d4"):W.includes("READY")?(nt="#e0e7ff",dt="#4338ca",ot="#c7d2fe",rt="#6366f1"):W.includes("INSPECT")?(nt="#f5f3ff",dt="#7c3aed",ot="#ddd6fe",rt="#8b5cf6"):W.includes("PROGRESS")?(nt="#eff6ff",dt="#2563eb",ot="#bfdbfe",rt="#3b82f6"):W.includes("REJECT")||W.includes("FAIL")||W.includes("NCR")?(nt="#fef2f2",dt="#dc2626",ot="#fecaca",rt="#ef4444"):(nt="#f8fafc",dt="#64748b",ot="#e2e8f0",rt=bt>0?"#3b82f6":"#cbd5e1");const se=(k.elementName||k.name||k.element||k.id||"—").toUpperCase(),ne=k.gridLocation||k.grid||k.location||"—";return`
              <tr>
                <td style="font-weight: 800; color: #0f172a;">${se}</td>
                <td style="font-family: monospace; color: #475569;">${ne}</td>
                <td style="font-family: monospace; font-weight: 600;">${Wt.toFixed(2)}</td>
                <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${Kt.toFixed(2)}</td>
                <td>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                    <div style="flex: 1; height: 7px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
                      <div style="width: ${bt}%; height: 100%; background: ${rt}; border-radius: 999px;"></div>
                    </div>
                    <span style="font-size: 7px; font-weight: 800; font-family: monospace; min-width: 24px; text-align: right;">${bt}%</span>
                    <span style="background: ${nt}; color: ${dt}; border: 1px solid ${ot}; border-radius: 4px; padding: 1.5px 7px; font-weight: 800; font-size: 7px; text-transform: uppercase; white-space: nowrap; display: inline-block;">${ae}</span>
                  </div>
                </td>
              </tr>
            `}).join(""),$t=Q>0?Math.round(q/Q*100):0;$.push(`
          <div class="pdf-sheet">
            <div>
              ${F(Nt)}
              
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
                  ${At}
                  ${Ct?`
                    <tr style="background: #f1f5f9; font-weight: 900; border-top: 1.5px solid #cbd5e1;">
                      <td colspan="2" style="font-size: 7.5px; color: #0f172a; text-transform: uppercase;">
                        TOTAL ${i.toUpperCase()}
                      </td>
                      <td style="font-family: monospace; font-size: 7.5px;">${Q.toFixed(2)}</td>
                      <td style="font-family: monospace; font-size: 7.5px; color: #0f172a;">${q.toFixed(2)}</td>
                      <td style="font-size: 7.5px; color: #0f172a; font-weight: 900;">
                        ${$t}% COMPLETION
                      </td>
                    </tr>
                  `:""}
                </tbody>
              </table>
            </div>
            ${G($.length+1)}
          </div>
        `)}}b&&typeof b=="string"&&b.trim().length>0&&$.push(`
        <div class="pdf-sheet">
          <div>
            ${F(C||`${i.toUpperCase()} LAYOUT &amp; INSPECTION`)}
            
            <div style="height: 154mm; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; position: relative; margin-top: 6px;">
              <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 6px; overflow: hidden; background: #ffffff;">
                <img src="${b}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="${C}" />
              </div>
              <div style="background: #0f172a; border-left: 5px solid #ea580c; color: #ffffff; padding: 8px 14px; font-size: 8px; font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
                <span style="letter-spacing: 0.5px; text-transform: uppercase;">
                  ${C||`${i.toUpperCase()} LAYOUT`} &nbsp;|&nbsp; VERIFIED AS-BUILT SURVEILLANCE OVERLAY
                </span>
                <span style="color: #4ade80; font-weight: 800;">&#10003; QC CLEARANCE COMPLETE</span>
              </div>
            </div>
          </div>
          ${G($.length+1)}
        </div>
      `)}mt("Columns","Column",Ot,pt,"COLUMNS LAYOUT & CASTING INSPECTION"),mt("Beams","Beam",Dt,ct,"BEAMS LAYOUT & REINFORCEMENT INSPECTION"),mt("Slabs","Slab",Pt,wt,"SLABS LAYOUT & CONCRETING INSPECTION",!1);const Gt=H.length>0?H.map((i,s)=>`
            <tr>
              <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(s+1).padStart(2,"0")}</td>
              <td style="font-weight: 800; color: #0f172a;">${i.service||i.system||i.elementService||"—"}</td>
              <td>${i.subcontractor||i.trade||"—"}</td>
              <td style="font-family: monospace; font-weight: 700; text-align: center;">${i.completionPct!==void 0?i.completionPct:0}%</td>
              <td style="text-align: center;"><span class="badge-approved">${i.status||"CLEARED"}</span></td>
              <td style="font-size: 7.5px; color: #475569;">${i.remarks||"—"}</td>
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
      `;$.push(`
    <div class="pdf-sheet">
      <div>
        ${F("MEP QA/QC CLEARANCE STATUS — PRE-CASTING")}
        
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
            ${Gt}
          </tbody>
        </table>
      </div>
      ${G($.length+1)}
    </div>
  `);const Vt=B.length>0?B.map((i,s)=>{const e=String(i.qcStatus||i.status||"APPROVED").toUpperCase(),b=e.includes("REJECT")?"#dc2626":e.includes("NOTED")?"#0284c7":"#16a34a",C=i.unit||"units",_=i.quantityAccepted!==void 0?i.quantityAccepted:i.quantity||0,V=i.quantityRejected??0,U=i.quantityReceived??i.quantity??0;return`
            <tr>
              <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(s+1).padStart(2,"0")}</td>
              <td style="font-family: monospace; font-weight: 600;">${E(i.deliveryDate||i.date)||"—"}</td>
              <td style="font-weight: 800; color: #0f172a;">${i.materialDescription||i.materialName||i.name||"Material"}</td>
              <td>${i.supplier||i.supplierName||"—"}</td>
              <td style="font-family: monospace; font-weight: 700;">${U} ${C} [${_} Acc / ${V} Rej]</td>
              <td style="text-align: center; font-weight: 800; color: ${b}; font-size: 7.5px;">${e}</td>
            </tr>
          `}).join(""):`
        <tr>
          <td colspan="6" style="text-align: center; color: #64748b; padding: 24px;">
            Zero material rejections recorded during this surveillance period.
          </td>
        </tr>
      `;if($.push(`
    <div class="pdf-sheet">
      <div>
        ${F("MATERIAL DELIVERY LOG & TRACEABILITY")}
        
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
            ${Vt}
          </tbody>
        </table>
      </div>
      ${G($.length+1)}
    </div>
  `),g){const i=j.length>0?j.map(s=>{const e=String(s.status||"OPEN").toUpperCase(),b=e==="CLOSED"||e==="RECTIFIED"||e==="RESOLVED",C=Array.isArray(s.descriptionItems)?s.descriptionItems.join(", "):s.description||"Field variance logged";return`
              <tr>
                <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${s.refNo||s.ncrNumber||"NCR"}</td>
                <td style="font-weight: 700;">${s.elementLevel||s.location||"Structural Component"}</td>
                <td style="font-size: 7.5px; line-height: 1.4; color: #334155;">${C}</td>
                <td style="font-family: monospace; font-weight: 600;">${E(s.dateIdentified||s.dateFound||s.createdAt)}</td>
                <td style="font-family: monospace; font-weight: 600;">${E(s.targetFixDate||s.signDate||o)}</td>
                <td style="text-align: center; font-weight: 900; color: ${b?"#16a34a":"#dc2626"}; font-size: 7.5px;">${b?"CLOSED":"OPEN"}</td>
              </tr>
            `}).join(""):`
          <tr>
            <td colspan="6" style="text-align: center; color: #166534; padding: 24px; font-weight: 800;">
              &#10003; ZERO ACTIVE NON-CONFORMANCE REPORTS LOGGED
            </td>
          </tr>
        `;$.push(`
      <div class="pdf-sheet">
        <div>
          ${F("APPENDIX: NCR REGISTER")}
          
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
              ${i}
            </tbody>
          </table>
        </div>
        ${G($.length+1)}
      </div>
    `)}if(N){const i=D.length>0?D.map(s=>{const e=String(s.status||"ISSUED").toUpperCase(),b=e.includes("CLOSE")||e.includes("COMPLET");return`
              <tr>
                <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${s.instructionNumber||s.siNumber||s.id||"SI"}</td>
                <td style="font-weight: 700; font-size: 7.5px; color: #0f172a;">${s.title||s.subject||"Formal Notice of Defect Rectification"}</td>
                <td style="font-size: 7.5px; text-transform: uppercase;">${s.contractorName||s.recipient||"Subcontractor"}</td>
                <td style="font-family: monospace; font-weight: 600;">${E(s.issuedDate||s.date)}</td>
                <td style="font-family: monospace; font-weight: 600;">${E(s.complianceDeadline||s.dueDate||o)}</td>
                <td style="text-align: center; font-weight: 900; color: ${b?"#16a34a":"#d97706"}; font-size: 7.5px;">${b?"CLOSED":"ISSUED"}</td>
              </tr>
            `}).join(""):`
          <tr>
            <td colspan="6" style="text-align: center; color: #64748b; padding: 24px;">
              No contractual site instructions issued during this reporting period.
            </td>
          </tr>
        `;$.push(`
      <div class="pdf-sheet">
        <div>
          ${F("APPENDIX: SITE INSTRUCTION REGISTER")}
          
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
              ${i}
            </tbody>
          </table>
        </div>
        ${G($.length+1)}
      </div>
    `)}if(v){const i=M.length>0?M.map((s,e)=>{const b=String(s.status||"Non-Compliant"),C=b.toLowerCase().includes("comp")||b.toLowerCase().includes("passed")||b.toLowerCase().includes("approved"),_=b.toLowerCase().includes("pend"),V=C?"#16a34a":_?"#d97706":"#dc2626";return`
              <tr>
                <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(e+1).padStart(2,"0")}</td>
                <td style="font-family: monospace; font-weight: 600;">${E(s.date||s.createdAt)||"—"}</td>
                <td>${s.level||Y}${s.location?` &bull; ${s.location}`:""}</td>
                <td style="font-weight: 700;">${s.element||"—"}</td>
                <td style="font-size: 7.5px; line-height: 1.4; color: #334155; white-space: pre-line;">${(s.comments||s.text||"—").replace(/<br\s*\/?>/gi,`
`)}</td>
                <td>${s.inspector||l}${s.vendorCheck?` / ${s.vendorCheck}`:""}</td>
                <td style="text-align: center; font-weight: 800; color: ${V}; font-size: 7.5px;">${b}</td>
              </tr>
            `}).join(""):`
          <tr>
            <td colspan="7" style="text-align: center; color: #64748b; padding: 24px;">
              Zero outstanding quality observations recorded for this surveillance cycle.
            </td>
          </tr>
        `;$.push(`
      <div class="pdf-sheet">
        <div>
          ${F("APPENDIX: SITE COMMENTS / OBSERVATION LOG")}
          
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
              ${i}
            </tbody>
          </table>
        </div>
        ${G($.length+1)}
      </div>
    `)}X.length>0&&X.forEach((i,s)=>{const e=typeof i=="string"?i:i.url,b=typeof i=="object"&&i.caption&&i.caption.trim().length>0?i.caption:`SPECIMEN ${s+1} | AS-BUILT SITE QUALITY RECORD`;$.push(`
        <div class="pdf-sheet">
          <div>
            ${F(`PICTORIAL SURVEILLANCE RECORD (SPECIMEN ${s+1} OF ${X.length})`)}
            
            <div style="height: 154mm; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; position: relative; margin-top: 6px;">
              <!-- Photo Viewport -->
              <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 6px; overflow: hidden; background: #ffffff;">
                <img src="${e}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 2px;" alt="${b}" />
              </div>

              <!-- Dark Caption Ribbon -->
              <div style="background: #0f172a; border-left: 5px solid #ea580c; color: #ffffff; padding: 10px 16px; font-size: 8.5px; font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
                <span style="letter-spacing: 0.3px; text-transform: uppercase;">
                  ${b}
                </span>
                <span style="color: #94a3b8; font-family: monospace; font-size: 7.5px;">
                  SPECIMEN ${s+1} / ${X.length}
                </span>
              </div>
            </div>
          </div>
          ${G($.length+1)}
        </div>
      `)});const Qt=gt>0?`${gt} Holds Active / Pending Sign-off`:"All Quality Checks Conforming & Approved";t.synopsis||t.executiveSummary,$.push(`
    <div class="pdf-sheet" style="padding: 0; display: flex; flex-direction: row; height: 210mm; overflow: hidden; position: relative;">
      <!-- Left Dark Emerald Panel (~30% width) -->
      <div style="width: 30%; background: #091a18; color: #ffffff; padding: 28mm 12mm 16mm 14mm; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <!-- Company Brand -->
          <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: flex-end; gap: 2px; margin-bottom: 6px; justify-content: center;">
              ${f?`<img src="${f}" style="max-height: 150px; max-width: 200px; object-fit: contain;" alt="${T}" />`:`
                <div style="display: flex; gap: 3px; align-items: flex-end; height: 24px;">
                  <span style="width: 4.5px; height: 12px; background: #c28b5e; border-radius: 1px;"></span>
                  <span style="width: 4.5px; height: 22px; background: #c28b5e; border-radius: 1px;"></span>
                  <span style="width: 4.5px; height: 16px; background: #c28b5e; border-radius: 1px;"></span>
                </div>
              `}
            </div>
            <div style="font-size: 13px; text-align: center; font-weight: 700; color: #FFFFFF; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 5px;">
              ${x.toUpperCase()}
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
              DOC-ID: ${u}
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
              ${d.toUpperCase()} DEVELOPMENT
            </h3>
            <p style="font-size: 7.5px; color: #64748b; margin: 0;">
              Weekly Structural Quality Control, Surveillance &amp; Materials Conformance Audit
            </p>
          </div>

          <!-- Key Metadata Grid (2x2) -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 10px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; font-size: 8px; margin-bottom: 12px;">
            <div>
              <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Reporting Period</p>
              <p style="font-weight: 700; color: #1e293b; margin: 0;">${y} – ${c}</p>
            </div>
            <div>
              <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Structure Level</p>
              <p style="font-weight: 700; color: #1e293b; margin: 0;">${Y}</p>
            </div>
            <div>
              <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Inspection Status</p>
              <p style="font-weight: 700; color: ${gt>0?"#dc2626":"#16a34a"}; margin: 0;">${Qt}</p>
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
                  ${l}
                </h4>
                <p style="font-size: 8px; font-weight: 800; color: #047857; text-transform: uppercase; margin: 0;">
                  ${I}
                </p>
              </div>
              
              <!-- Stamp / Verification Badge Indicator -->
              <div style="display: flex; align-items: center; gap: 8px;">
                ${w?`<img src="${w}" style="max-height: 38px; max-width: 100px; object-fit: contain;" alt="Signature" />`:""}
                <div style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgba(5, 150, 105, 0.4); display: flex; align-items: center; justify-content: center; font-size: 7px; font-weight: 900; color: #065f46; text-transform: uppercase; text-align: center; line-height: 1.15; background: #ecfdf5;">
                  VERIFIED<br />QA/QC
                </div>
              </div>
            </div>

            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b;">
              <span>Email: <strong style="color: #334155; font-weight: 700;">${S}</strong></span>
              <span>Issued: <strong style="color: #334155; font-weight: 700;">${E(o)}</strong></span>
            </div>
          </div>

          <!-- Legal Footer -->
          <div style="padding-top: 8px; margin-top: 8px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; font-size: 7px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
            <span>CONFIDENTIAL | PREPARED FOR CLIENT &amp; SUPERVISING CONSULTANT</span>
            <span>PAGE ${$.length+1} OF ${$.length+1}</span>
          </div>
        </div>

      </div>
    </div>
  `);const Ht=`
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
  `,Bt=$.join(`
`);K(`${u} - QA/QC Weekly Surveillance Report (Landscape Slide Deck)`,Bt,Ht)}function De(t,r="All Levels",m={},p={}){const T=p.name||"Apex Civil Engineering",x=m.name||"Site Quality Assessment",f=A(new Date),d=`CQ-REG-${r.toUpperCase().replace(/[^A-Z0-9]/g,"-")}-${Date.now().toString().slice(-6)}`,u=t.length,g=t.filter(n=>n.status==="CURING"||n.status==="PENDING").length,v=t.filter(n=>{var l,I;return n.day7Results&&n.day7Results.length>0||((I=(l=n.tests)==null?void 0:l.day7)==null?void 0:I.averageStrengthNmm2)}),N=v.filter(n=>{var w,P,O,H;const l=((P=(w=n.day7Results)==null?void 0:w[0])==null?void 0:P.averageStrength)||((H=(O=n.tests)==null?void 0:O.day7)==null?void 0:H.averageStrengthNmm2)||0,I=n.target28DayStrengthNmm2||n.day28Required||30,S=n.day7Required||Math.round(I*.7*10)/10;return l>=S}).length,E=v.length>0?Math.round(N/v.length*100):100,R=t.filter(n=>{var l,I;return n.day28Results&&n.day28Results.length>0||((I=(l=n.tests)==null?void 0:l.day28)==null?void 0:I.averageStrengthNmm2)}),h=R.filter(n=>{var S,w,P,O;const l=((w=(S=n.day28Results)==null?void 0:S[0])==null?void 0:w.averageStrength)||((O=(P=n.tests)==null?void 0:P.day28)==null?void 0:O.averageStrengthNmm2)||0,I=n.target28DayStrengthNmm2||n.day28Required||30;return l>=I}).length,a=R.length>0?Math.round(h/R.length*100):100,y=t.filter(n=>n.status==="APPROVED"||n.status==="28-DAY DONE").length,c=t.filter(n=>n.status==="NCR_ISSUED"||n.status==="REJECTED"||n.ncrGenerated).length,o=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${J(p,m)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">CONCRETE QUALITY & COMPRESSIVE STRENGTH REGISTER</div>
          <div class="header-title-project">PROJECT: ${x}</div>
          <div class="header-title-iso">BS EN 12390-3 / BS EN 206-1 / ASTM C39 Concrete Conformance Register</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${d}</span></div>
          <div><strong>Scope / Level:</strong> <span style="font-weight:700; color:#0f172a;">${r}</span></div>
          <div><strong>Report Date:</strong> ${f}</div>
          <div><strong>Total Samples:</strong> ${u} specimen sets</div>
        </td>
      </tr>
    </table>

    <!-- 1.0 Executive Quality Statistics -->
    <div class="pdf-section">
      <div class="section-banner">1.0 CONCRETE COMPLIANCE SUMMARY & QUALITY STATISTICS</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 20%;">LOCATION / FILTER:</td>
          <td class="grid-value" style="width: 30%; font-weight:700; color:#0f172a;">${r}</td>
          <td class="grid-label" style="width: 20%;">TOTAL SAMPLES LOGGED:</td>
          <td class="grid-value" style="width: 30%; font-weight:800; font-size:9.5px; font-family:monospace;">${u} Specimens</td>
        </tr>
        <tr>
          <td class="grid-label">28-DAY COMPLIANCE RATE:</td>
          <td class="grid-value">
            <span style="font-weight:800; font-size:10px; color:${a>=95?"#15803d":"#b91c1c"};">${a}%</span>
            <span style="font-size:7.5px; color:#64748b; margin-left:4px;">(${h}/${R.length} tested sets compliant)</span>
          </td>
          <td class="grid-label">7-DAY EARLY STRENGTH:</td>
          <td class="grid-value">
            <span style="font-weight:800; font-size:9.5px; color:#0369a1;">${E}%</span>
            <span style="font-size:7.5px; color:#64748b; margin-left:4px;">(${N}/${v.length} tested sets compliant)</span>
          </td>
        </tr>
        <tr>
          <td class="grid-label">APPROVED CERTIFICATES:</td>
          <td class="grid-value" style="color:#15803d; font-weight:800;">${y} Fully Certified</td>
          <td class="grid-label">ACTIVE NCRS / DEFECTIVE:</td>
          <td class="grid-value" style="color:${c>0?"#b91c1c":"#15803d"}; font-weight:800;">${c} Non-Conforming</td>
        </tr>
        <tr>
          <td class="grid-label">IN CURING TANKS:</td>
          <td class="grid-value" style="color:#0284c7; font-weight:700;">${g} In Curing Water Tanks</td>
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
          ${t.length>0?t.map(n=>{var B,j,M,D,at,X,ct,pt;const l=n.target28DayStrengthNmm2||n.day28Required||30,I=n.day7Required||Math.round(l*.7*10)/10,S=((j=(B=n.day7Results)==null?void 0:B[0])==null?void 0:j.averageStrength)??((D=(M=n.tests)==null?void 0:M.day7)==null?void 0:D.averageStrengthNmm2),w=S!=null?S>=I:null,P=((X=(at=n.day28Results)==null?void 0:at[0])==null?void 0:X.averageStrength)??((pt=(ct=n.tests)==null?void 0:ct.day28)==null?void 0:pt.averageStrengthNmm2),O=P!=null?P>=l:null,H=n.status==="NCR_ISSUED"||n.status==="REJECTED"||n.ncrGenerated||!!n.ncrNumber;return`
              <tr>
                <td>
                  <div style="font-weight: 800; color: #0f172a;">${n.sampleId||n.sampleNumber||"—"}</div>
                  ${n.inscribedName?`<div style="font-size: 7px; color: #64748b;">Mark: ${n.inscribedName}</div>`:""}
                </td>
                <td>
                  <div style="font-weight: 700;">${n.structureElement||n.elementName||"Structural Element"}</div>
                  ${n.supplier?`<div style="font-size: 7px; color: #64748b;">${n.supplier}</div>`:""}
                </td>
                <td>${[n.level||n.levelName,n.zone].filter(Boolean).join(" • ")||"Site"}</td>
                <td style="font-weight: 700; font-family: monospace;">${n.concreteGrade||"C30"} (${l})</td>
                <td>${A(n.castDate)}</td>
                <td style="font-family: monospace;">${n.slumpMm||n.slumpValue||"—"} mm</td>
                <td>
                  ${S!=null?`<div style="font-family: monospace; font-weight: 800; color: ${w?"#15803d":"#b91c1c"};">${S} MPa</div>
                         <div style="font-size: 6.8px; color: ${w?"#15803d":"#b91c1c"}; font-weight: 700;">(${w?"PASS":"FAIL"} - Min ${I})</div>`:'<span style="color: #94a3b8; font-size: 7.5px;">Pending</span>'}
                </td>
                <td>
                  ${P!=null?`<div style="font-family: monospace; font-weight: 800; color: ${O?"#15803d":"#b91c1c"};">${P} MPa</div>
                         <div style="font-size: 6.8px; color: ${O?"#15803d":"#b91c1c"}; font-weight: 700;">(${O?"PASS":"FAIL"} - Min ${l})</div>`:'<span style="color: #94a3b8; font-size: 7.5px;">In Curing</span>'}
                </td>
                <td>
                  ${H?`<span class="badge-fail">NCR: ${n.ncrNumber||"ISSUED"}</span>`:n.status==="APPROVED"||O?'<span class="badge-pass">APPROVED</span>':`<span class="badge-pending">${n.status||"IN PROGRESS"}</span>`}
                </td>
              </tr>
            `}).join(""):`
              <tr>
                <td colspan="9" style="text-align: center; color: #64748b; padding: 14px;">
                  No concrete specimen records found for ${r}.
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
              <span>Date: ${f}</span>
            </div>
          </td>
          <td style="width: 33.3%;">
            <div class="sig-role-header"><span>QA/QC MANAGER</span><span class="sig-required-tag">APPROVED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>QA/QC Manager</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${f}</span>
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
      <div>CONFIDENTIAL & PROPRIETARY — ${T}</div>
      <div>Report Ref: ${d} • Filter: ${r}</div>
    </div>
  `;K(`${d} - Concrete Quality Register (${r})`,o)}function Pe(t,r,m){var E,R,h,a,y,c,o,n;const p=(m==null?void 0:m.name)||t.companyName||"JQMS Civil Infrastructure",T=(r==null?void 0:r.name)||t.projectName||"Civil Engineering Construction Project",x=(r==null?void 0:r.code)||"PRJ-001",f=t.instructionNumber||`SI-${t.id.slice(0,8).toUpperCase()}`,d=A(((E=t.signedBy)==null?void 0:E.signedAt)||t.createdAt),u=A(t.complianceDeadline),g=t.severity==="STOP_WORK"||t.severity==="CRITICAL"?"#dc2626":t.severity==="HIGH"?"#ea580c":"#2563eb",v=t.severity==="STOP_WORK"?"INTERNAL WORK HOLD DIRECTIVE":t.severity==="CRITICAL"?"CRITICAL INTERNAL QUALITY DIRECTIVE":t.severity==="HIGH"?"HIGH PRIORITY RECTIFICATION NOTICE":"STANDARD QUALITY DIRECTIVE",N=`
    <!-- ═══ DOCUMENT HEADER ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${J(m,r)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main" style="color: ${g};">
            INTERNAL SITE INSTRUCTION
          </div>
          <div style="font-size: 8px; font-weight: 800; letter-spacing: 0.8px; color: #475569; text-transform: uppercase; margin-top: 1px;">
            INTERNAL QUALITY CONTROL & REMEDIATION DIRECTIVE
          </div>
          <div class="header-title-project">${T} (${x})</div>
        </td>
        <td style="width: 25%; font-size: 8px; vertical-align: top; background: #fafafa;">
          <div style="margin-bottom: 2px;">Doc Ref: <strong style="font-family: monospace; font-size: 8.5px; color: #0f172a;">${f}</strong></div>
          <div style="margin-bottom: 2px;">Issue Date: <strong>${d}</strong></div>
          <div style="margin-bottom: 2px;">Target Rectification: <strong style="color: #dc2626;">${u}</strong></div>
          <div>Status: <span style="background: #e0f2fe; color: #0369a1; font-weight: 800; padding: 1px 4px; border-radius: 2px; font-size: 7px;">${t.status||"ISSUED"}</span></div>
        </td>
      </tr>
    </table>

    <!-- ═══ INTERNAL SEVERITY BANNER ═══ -->
    <div style="background: ${g}; color: #ffffff; padding: 5px 10px; border-radius: 4px; font-weight: 800; font-size: 9px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; letter-spacing: 0.5px;">
      <span>⚠️ NOTICE CATEGORY: ${v}</span>
      <span>ACTION REQUIRED BY: ${u}</span>
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
          <td class="meta-value"><strong>${A(t.ncrDeadline)}</strong></td>
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
          ${t.mandatoryActions&&t.mandatoryActions.length>0?t.mandatoryActions.map((l,I)=>`
                <tr>
                  <td style="text-align: center; font-weight: 800; color: #ea580c;">${I+1}.0</td>
                  <td style="font-weight: 600; color: #0f172a;">${l}</td>
                  <td style="text-align: center; font-weight: 700; color: #dc2626;">${u}</td>
                </tr>
              `).join(""):`
                <tr>
                  <td style="text-align: center; font-weight: 800;">1.0</td>
                  <td>Execute complete remediation of identified defect according to internal project quality guidelines.</td>
                  <td style="text-align: center; font-weight: 700;">${u}</td>
                </tr>
                <tr>
                  <td style="text-align: center; font-weight: 800;">2.0</td>
                  <td>Notify QA/QC team for re-inspection and sign-off upon completion of corrective actions.</td>
                  <td style="text-align: center; font-weight: 700;">${u}</td>
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
                <div>Full Name: <strong>${((R=t.signedBy)==null?void 0:R.name.toUpperCase())||"Authorized Quality Authority"}</strong></div>
                <div>Designation: <strong>${((h=t.signedBy)==null?void 0:h.designation)||((a=t.signedBy)==null?void 0:a.role)||"QA/QC Lead Engineer"}</strong></div>
                <div style="font-size: 7.5px; color: #64748b; font-style: italic; margin-top: 4px;">
                  "${((y=t.signedBy)==null?void 0:y.declaration)||"Issued in accordance with company internal quality control standards."}"
                </div>
              </div>

              <div style="text-align: center; min-width: 170px; padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; background: #ffffff;">
                <div style="font-size: 7px; font-weight: 800; color: #0284c7; text-transform: uppercase; margin-bottom: 2px;">
                  Digital Signature
                </div>
                ${(c=t.signedBy)!=null&&c.signatureUrl?`<img src="${t.signedBy.signatureUrl}" style="max-height: 44px; max-width: 150px; object-fit: contain; margin: 0 auto;" alt="Signature" />`:`<div style="height: 36px; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 10px; font-weight: bold; color: #0284c7;">${((o=t.signedBy)==null?void 0:o.name)||"ELECTRONICALLY SIGNED"}</div>`}
                <div style="font-family: monospace; font-size: 6.5px; color: #94a3b8; border-top: 0.5px solid #f1f5f9; padding-top: 2px; margin-top: 2px;">
                  ID: ${((n=t.signedBy)==null?void 0:n.digitalSignatureStamp)||`JQMS-SI-${t.id.slice(0,8).toUpperCase()}`}
                </div>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- ═══ DOCUMENT FOOTER ═══ -->
    <div class="doc-footer">
      <div>INTERNAL QUALITY DIRECTIVE — ${p}</div>
      <div>Document Ref: ${f} </div>
    </div>
  `;K(`${f} - Internal Site Instruction`,N)}function _e(t,r={},m={}){var v,N,E,R,h,a,y,c,o,n;const p=m.name||"JQMS ENTERPRISE QUALITY MANAGEMENT",T=r.name||t.projectName||"CONSTRUCTION PROJECT",x=r.code||"PRJ",f=t.mirNumber||"MIR-DRAFT",d=l=>{switch(l){case"ACCEPTED":return'<span style="display:inline-block; padding: 3px 10px; background: #dcfce7; color: #15803d; border: 1.5px solid #86efac; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">ACCEPTED / APPROVED</span>';case"ACCEPTED_AS_NOTED":return'<span style="display:inline-block; padding: 3px 10px; background: #dbeafe; color: #1d4ed8; border: 1.5px solid #93c5fd; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">ACCEPTED AS NOTED</span>';case"REJECTED":return'<span style="display:inline-block; padding: 3px 10px; background: #fee2e2; color: #b91c1c; border: 1.5px solid #fca5a5; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">REJECTED / NON-COMPLIANT</span>';case"HOLD_FOR_TESTING":return'<span style="display:inline-block; padding: 3px 10px; background: #fef3c7; color: #b45309; border: 1.5px solid #fcd34d; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">HOLD FOR LAB TESTING</span>';default:return'<span style="display:inline-block; padding: 3px 10px; background: #f1f5f9; color: #475569; border: 1.5px solid #cbd5e1; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">PENDING INSPECTION</span>'}},u=t.items&&t.items.length>0?t.items.map((l,I)=>`
        <tr>
          <td style="text-align: center; font-weight: bold; width: 30px;">${I+1}</td>
          <td style="font-weight: 600; color: #0f172a;">${l.description||"Material Item"}</td>
          <td style="font-size: 7.5px; color: #475569;">${l.specificationRef||"—"}</td>
          <td style="text-align: right; font-weight: bold;">${l.quantityDelivered}</td>
          <td style="text-align: right;">${l.quantityInspected}</td>
          <td style="text-align: right; color: #15803d; font-weight: bold;">${l.quantityAccepted}</td>
          <td style="text-align: right; color: ${l.quantityRejected>0?"#b91c1c":"#64748b"}; font-weight: bold;">${l.quantityRejected}</td>
          <td style="text-align: center; text-transform: uppercase; font-size: 7.5px;">${l.unit||"units"}</td>
          <td style="font-size: 7.5px; color: #475569;">${l.remarks||"—"}</td>
        </tr>
      `).join(""):'<tr><td colspan="9" style="text-align:center; padding: 12px; color: #64748b;">No individual line items registered. Full delivery inspected as described.</td></tr>',g=`
    <!-- ═══ 1.0 HEADER TABLE ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${J(m,r)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">MATERIAL INSPECTION REPORT (MIR)</div>
          <div class="header-title-project">${T} (${x})</div>
          <div class="header-title-iso">ISO 9001:2015 CLAUSE 8.4 — RECEIVING INSPECTION & VERIFICATION</div>
        </td>
        <td class="header-meta-cell">
          <div class="header-meta-row">
            <span class="header-meta-label">MIR NO:</span>
            <span class="header-meta-val" style="color: #ea580c; font-weight: 900;">${f}</span>
          </div>
          <div class="header-meta-row">
            <span class="header-meta-label">DISCIPLINE:</span>
            <span class="header-meta-val">${t.discipline||"Civil & Structural"}</span>
          </div>
          <div class="header-meta-row">
            <span class="header-meta-label">INSP DATE:</span>
            <span class="header-meta-val">${A(t.inspectionDate)}</span>
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
          <td>${A(t.deliveryDate)}</td>
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
          <td colspan="3">${d(t.disposition)}</td>
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
          ${u}
        </tbody>
      </table>
    </div>

    <!-- ═══ 4.0 NOTES & REMARKS ═══ -->
    <div class="pdf-section">
      <div class="section-banner">4.0 INSPECTION OBSERVATIONS & REQUIRED ACTIONS</div>
      <div style="border: 1px solid #cbd5e1; border-top: none; background: #ffffff; padding: 8px 10px; display: flex; flex-direction: column; gap: 8px;">
        <div>
          <div style="font-size: 7.5px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">QA/QC Receiving Observations & Inspector Notes:</div>
          ${Yt(t.inspectionNotes,"Materials visually checked and verified compliant with delivery waybill and approved submittal specification.")}
        </div>
        ${t.rejectionReasons?`
        <div style="margin-top: 4px;">
          <div style="font-size: 7.5px; font-weight: 800; color: #b91c1c; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Defects, Non-Conformances & Technical Justifications:</div>
          ${Yt(t.rejectionReasons)}
        </div>
        `:""}
        ${t.actionRequired?`
        <div style="margin-top: 4px;">
          <div style="font-size: 7.5px; font-weight: 800; color: #d97706; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Mandatory Action & Quarantine Requirements:</div>
          ${Yt(t.actionRequired)}
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
                ${d(((v=t.qaqcSignOff)==null?void 0:v.verdict)||((N=t.consultantSignOff)==null?void 0:N.verdict)||t.disposition)}
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 2.2fr; gap: 12px; font-size: 8px; line-height: 1.6; color: #1e293b; margin-bottom: 6px;">
              <div style="border-right: 1px dashed #fed7aa; padding-right: 10px;">
                <div>QA/QC Engineer: <strong>${((E=t.qaqcSignOff)==null?void 0:E.name)||((R=t.consultantSignOff)==null?void 0:R.name)||((h=t.inspectedBy)==null?void 0:h.name)||"QA/QC Engineer"}</strong></div>
                <div>Designation: <strong>${((a=t.qaqcSignOff)==null?void 0:a.designation)||"QA/QC Engineer"}</strong></div>
                <div>Date of Endorsement: <strong>${A(((y=t.qaqcSignOff)==null?void 0:y.date)||((c=t.consultantSignOff)==null?void 0:c.date)||t.inspectionDate)}</strong></div>
                <div style="margin-top: 4px; color: #15803d; font-weight: bold; font-size: 7.5px;">
                  ✓ Electronically Authenticated Endorsement
                </div>
              </div>
              <div>
                <div style="font-weight: 800; color: #9a3412; font-size: 7.5px; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Official QA/QC Commentary, Directives & Liability Disclaimers:</div>
                ${Yt(((o=t.qaqcSignOff)==null?void 0:o.comments)||((n=t.consultantSignOff)==null?void 0:n.comments),"Materials inspected at site receiving laydown. Verified compliant with approved submittal & material specifications.")}
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
    ${(()=>{var S,w,P,O,H,B,j;const l=t.stakeholders&&t.stakeholders.length>0?t.stakeholders:[{role:"Contractor Quality Representative",name:((S=t.contractorSignOff)==null?void 0:S.name)||((w=t.inspectedBy)==null?void 0:w.name)||"Contractor Quality Representative",designation:"Site QA/QC Inspector",required:!0,signed:!!((P=t.contractorSignOff)!=null&&P.signed||(O=t.inspectedBy)!=null&&O.date),signedAt:((H=t.contractorSignOff)==null?void 0:H.date)||((B=t.inspectedBy)==null?void 0:B.date)||t.inspectionDate},...(j=t.consultantSignOff)!=null&&j.signed?[{role:"Supervising Consultant / Resident Engineer",name:t.consultantSignOff.name,designation:"Resident Engineer",required:!1,signed:!0,signedAt:t.consultantSignOff.date}]:[]];if(l.length===0)return"";const I=[];for(let M=0;M<l.length;M+=2)I.push(l.slice(M,M+2));return`
      <div class="pdf-section">
        <div class="section-banner">6.0 STATUTORY STAKEHOLDER SIGN-OFF AUTHORIZATIONS</div>
        <table class="signoff-table">
          ${I.map(M=>`
            <tr>
              ${M.map(D=>`
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
                    <div>Date: <strong>${D.signedAt?A(D.signedAt):D.signed?A(t.inspectionDate):"—"}</strong></div>
                  </div>
                  <div style="margin-top: 14px; border-top: 1px dashed #94a3b8; padding-top: 4px; font-size: 7px; color: #64748b; text-align: center;">
                    ${D.signed?`Electronically Authenticated • ${D.name}`:`Signature & Stamp (${D.role})`}
                  </div>
                </td>
              `).join("")}
              ${M.length===1?'<td style="width: 50%; background: #f8fafc; border: 1px solid #cbd5e1;"></td>':""}
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
        ${t.photos.map((l,I)=>`
          <div class="photo-card" style="width: 48%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; text-align: center; background: #f8fafc; page-break-inside: avoid; break-inside: avoid; margin-bottom: 6px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #ea580c; text-align: left; margin-bottom: 4px; display: flex; justify-content: space-between;">
              <span>PHOTO #${I+1} — DELIVERY EVIDENCE</span>
              <span style="color: #64748b; font-size: 7px;">${f}</span>
            </div>
            <div style="height: 160px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
              <img src="${l}" alt="Inspection Evidence #${I+1}" style="max-height: 160px; max-width: 100%; object-fit: contain;" />
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
      <div>CONFIDENTIAL & STATUTORY QUALITY RECORD — ISO 9001:2015 CLAUSE 8.4 — ${p}</div>
      <div>Document Ref: ${f}</div>
    </div>
  `;K(`${f} - Material Inspection Report (${t.title})`,g)}function Le(t,r={},m={}){var R,h,a,y,c,o,n,l,I,S,w,P,O,H,B,j,M,D,at,X,ct,pt,wt,Z,Ot,Dt,Pt,Y,tt,et,_t,gt,Lt,kt,F,G,$,xt,ut,Mt,ft,L,ht,zt,qt,vt,Ut,Ft,mt,Gt,Vt,Qt,Ht,Bt,yt,Et,Tt,St,It,Rt,i,s;const p=m.name||"JQMS ENTERPRISE QUALITY MANAGEMENT",T=r.name||t.projectName||"CONSTRUCTION PROJECT",x=r.code||t.projectCode||"PRJ",f=t.logNumber||`DSL-${x}-${((R=t.generalConditions)==null?void 0:R.date)||"TODAY"}`,d=t.generalConditions||{date:new Date().toISOString().slice(0,10),shift:"DAY",weather:"CLEAR",workHoursStart:"07:00",workHoursEnd:"17:00",totalHours:10},u=(t.manpower||[]).reduce((e,b)=>e+(Number(b.headCount)||0),0),g=(t.manpower||[]).reduce((e,b)=>e+(Number(b.totalManHours)||(Number(b.headCount)||0)*(Number(b.hoursWorked)||d.totalHours||8)),0),v=e=>{switch(e){case"SUNNY":return"☀️ Sunny";case"CLEAR":return"🌤️ Clear Sky";case"OVERCAST":return"☁️ Overcast / Cloudy";case"RAIN":return"🌧️ Rainy";case"HEAVY_RAIN":return"⛈️ Heavy Rain / Downpour";case"STORMY":return"🌩️ Stormy / High Winds";case"EXTREME_HEAT":return"🔥 Extreme Heat / High Temp";case"WINDY":return"💨 High Winds / Dust";default:return"🌤️ Normal Site Conditions"}},N=e=>{switch(e){case"APPROVED":return'<span style="padding: 2px 8px; background: #dcfce7; color: #15803d; border: 1px solid #86efac; border-radius: 3px; font-weight: 800; font-size: 8px;">APPROVED</span>';case"SUBMITTED":case"UNDER_REVIEW":return'<span style="padding: 2px 8px; background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; border-radius: 3px; font-weight: 800; font-size: 8px;">UNDER REVIEW</span>';case"REJECTED":return'<span style="padding: 2px 8px; background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; border-radius: 3px; font-weight: 800; font-size: 8px;">REVISION REQUIRED</span>';default:return'<span style="padding: 2px 8px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 3px; font-weight: 800; font-size: 8px;">DRAFT RECORD</span>'}},E=`
    <!-- ═══ HEADER BLOCK ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${J(m,r)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">DAILY SITE LOG & STATUTORY DIARY</div>
          <div class="header-title-project">PROJECT: ${T} (${x})</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.5.1 Operations & Site Quality Records</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${f}</span></div>
          <div><strong>Log Date:</strong> ${d.date}</div>
          <div><strong>Shift:</strong> ${d.shift||"DAY SHIFT"}</div>
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
          <td class="meta-value" style="width: 20%; font-weight: 800;">${d.date}</td>
          <td class="meta-label" style="width: 13%;">SHIFT:</td>
          <td class="meta-value" style="width: 20%; font-weight: 700;">${d.shift||"DAY SHIFT"}</td>
          <td class="meta-label" style="width: 13%;">HOURS:</td>
          <td class="meta-value" style="width: 20%;">${d.workHoursStart||"07:00"} - ${d.workHoursEnd||"17:00"} (${d.totalHours||10} hrs)</td>
        </tr>
        <tr>
          <td class="meta-label">WEATHER:</td>
          <td class="meta-value" style="font-weight: 700;">${v(d.weather)}</td>
          <td class="meta-label">TEMPERATURE:</td>
          <td class="meta-value">${d.tempMin!=null?`${d.tempMin}°C`:"—"} to ${d.tempMax!=null?`${d.tempMax}°C`:"—"}</td>
          <td class="meta-label">GROUND/SOIL:</td>
          <td class="meta-value">${d.groundConditions||"Normal / Dry"} (RH: ${d.humidity?`${d.humidity}%`:"—"})</td>
        </tr>
        ${d.siteStatusNotes?`
        <tr>
          <td class="meta-label">SITE OVERVIEW:</td>
          <td class="meta-value" colspan="5">${d.siteStatusNotes}</td>
        </tr>
        `:""}
      </table>
    </div>

    <!-- ═══ 2.0 SITE MANPOWER & TRADE HEADCOUNT (ALL SPHERES) ═══ -->
    <div class="pdf-section">
      <div class="section-banner" style="display: flex; justify-content: space-between;">
        <span>2.0 SITE MANPOWER & TRADE HEADCOUNT SUMMARY</span>
        <span style="font-size: 7.5px; text-transform: none; color: #cbd5e1;">TOTAL PERSONNEL: <strong>${u}</strong> &bull; MAN-HOURS: <strong>${g.toFixed(1)} hrs</strong></span>
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
          ${t.manpower&&t.manpower.length>0?t.manpower.map((e,b)=>{const C=Number(e.hoursWorked)||d.totalHours||8,_=Number(e.headCount)||0,V=Number(e.totalManHours)||_*C;return`
              <tr>
                <td style="font-weight: 700; color: #0f172a;">${e.tradeName}</td>
                <td style="font-size: 7.5px; color: #64748b;">${e.tradeCategory||"Direct Execution"}</td>
                <td>${e.companyOrSubcontractor||"Direct Labor"}</td>
                <td style="text-align: center; font-weight: 800; color: #0284c7;">${_}</td>
                <td style="text-align: center;">${C}</td>
                <td style="text-align: center; font-weight: 700;">${V.toFixed(1)}</td>
              </tr>
            `}).join(""):`
            <tr>
              <td colspan="6" style="text-align: center; color: #94a3b8; padding: 6px;">No manpower entries logged for this shift.</td>
            </tr>
          `}
          <tr style="background: #f1f5f9; font-weight: 800; border-top: 1.5px solid #cbd5e1;">
            <td colspan="3" style="text-align: right; text-transform: uppercase; font-size: 7.5px; color: #334155;">Cumulative Site Workforce:</td>
            <td style="text-align: center; color: #0284c7; font-size: 8.5px;">${u}</td>
            <td style="text-align: center; color: #64748b; font-size: 7px;">Avg ${d.totalHours||8}h</td>
            <td style="text-align: center; color: #0f172a; font-size: 8.5px;">${g.toFixed(1)}</td>
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
          ${t.equipment.map(e=>`
            <tr>
              <td style="font-weight: 700;">${e.equipmentType}</td>
              <td style="font-family: monospace; font-size: 7px;">${e.plantNumber||"—"}</td>
              <td style="text-align: center; font-weight: 700;">${e.quantity||1}</td>
              <td style="text-align: center;">
                <span style="padding: 1px 6px; border-radius: 2px; font-weight: 700; font-size: 7px; ${e.status==="OPERATIONAL"?"background: #dcfce7; color: #15803d;":e.status==="BREAKDOWN"?"background: #fee2e2; color: #b91c1c;":"background: #fef3c7; color: #b45309;"}">${e.status}</span>
              </td>
              <td style="text-align: center; font-weight: 700;">${e.hoursUsed!=null?`${e.hoursUsed} hrs`:"—"}</td>
              <td style="font-size: 7.5px;">${e.operatorName||e.notes||"Standard Operations"}</td>
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
          ${t.activities&&t.activities.length>0?t.activities.map(e=>`
            <tr>
              <td style="font-weight: 700; color: #0f172a;">
                ${e.levelName||"Site Wide"} ${e.elementName?`&bull; ${e.elementName}`:""}
                ${e.gridlineRef?`<div style="font-size: 7px; color: #64748b; font-weight: normal;">Grid: ${e.gridlineRef}</div>`:""}
              </td>
              <td style="font-size: 7.5px; font-weight: 600; color: #2563eb;">${e.trade}</td>
              <td style="font-size: 8px;">
                <div>${e.description}</div>
                ${e.quantityDone?`<div style="font-size: 7px; color: #475569; margin-top: 1px;">Output: <strong>${e.quantityDone}</strong></div>`:""}
                ${e.delayNotes?`<div style="font-size: 7px; color: #dc2626; margin-top: 1px;">Note: ${e.delayNotes}</div>`:""}
              </td>
              <td style="text-align: center; font-weight: 800; color: #0284c7;">${e.progressPercentage!=null?`${e.progressPercentage}%`:"—"}</td>
              <td style="text-align: center;">
                <span style="padding: 1px 5px; border-radius: 2px; font-size: 7px; font-weight: 700; ${e.status==="COMPLETED"?"background: #dcfce7; color: #15803d;":e.status==="DELAYED"?"background: #fee2e2; color: #b91c1c;":"background: #dbeafe; color: #1d4ed8;"}">${e.status.replace("_"," ")}</span>
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
      ${(h=t.quality)!=null&&h.inspections&&t.quality.inspections.length>0?`
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
          ${t.quality.inspections.map(e=>`
            <tr>
              <td style="font-weight: 700;">${e.inspectionType}</td>
              <td style="font-family: monospace; font-size: 7px;">${e.refNo||"—"}</td>
              <td>${e.levelName||"—"} ${e.elementName?`&bull; ${e.elementName}`:""}</td>
              <td>${e.trade||"Civil/Structural"}</td>
              <td style="text-align: center;">
                <span style="padding: 1px 6px; border-radius: 2px; font-weight: 800; font-size: 7px; ${e.result==="PASSED"?"background: #dcfce7; color: #15803d;":e.result==="PASSED_AS_NOTED"?"background: #dbeafe; color: #1d4ed8;":"background: #fee2e2; color: #b91c1c;"}">${e.result.replace(/_/g," ")}</span>
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
      ${(a=t.quality)!=null&&a.qualityNotes||(y=t.quality)!=null&&y.ncrsRaised&&t.quality.ncrsRaised.length>0?`
      <div style="background: #fafafa; border: 1px solid #cbd5e1; border-top: none; padding: 6px 10px; font-size: 7.5px; color: #334155;">
        ${(c=t.quality)!=null&&c.ncrsRaised&&t.quality.ncrsRaised.length>0?`<div><strong>NCRs Raised / Monitored:</strong> <span style="color: #dc2626; font-weight: 700;">${t.quality.ncrsRaised.join(", ")}</span></div>`:""}
        ${(o=t.quality)!=null&&o.qualityNotes?`<div style="margin-top: 2px;"><strong>QA/QC Notes:</strong> ${t.quality.qualityNotes}</div>`:""}
      </div>
      `:""}
    </div>

    <!-- ═══ 6.0 MATERIALS LOGISTICS & CONCRETE POURS ═══ -->
    ${(n=t.materials)!=null&&n.deliveries&&t.materials.deliveries.length>0||(l=t.materials)!=null&&l.concretePours&&t.materials.concretePours.length>0?`
    <div class="pdf-section">
      <div class="section-banner">6.0 MATERIALS LOGISTICS, DELIVERIES & CONCRETE POURS</div>
      ${(I=t.materials)!=null&&I.concretePours&&t.materials.concretePours.length>0?`
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
          ${t.materials.concretePours.map(e=>`
            <tr>
              <td style="font-weight: 700;">${e.elementName} ${e.levelName?`(${e.levelName})`:""}</td>
              <td style="text-align: center; font-weight: 800; color: #0284c7;">${e.concreteGrade}</td>
              <td style="font-size: 7px;">${e.supplier||"Batching Plant"} (${e.truckCount||1} trucks)</td>
              <td style="text-align: center; font-weight: 800;">${e.volumePoured} m³</td>
              <td style="text-align: center;">${e.slumpMm?`${e.slumpMm} mm`:"—"}</td>
              <td style="text-align: center; font-family: monospace; font-size: 7px;">${e.cubeSampleNumber||"Standard 6-Cube Set"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      `:""}

      ${(S=t.materials)!=null&&S.deliveries&&t.materials.deliveries.length>0?`
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
          ${t.materials.deliveries.map(e=>`
            <tr>
              <td style="font-weight: 700;">${e.description}</td>
              <td>${e.supplier}</td>
              <td style="font-family: monospace; font-size: 7px;">${e.ticketNumber||"—"}</td>
              <td style="text-align: center; font-weight: 700;">${e.quantity} ${e.unit}</td>
              <td style="text-align: center;">
                <span style="padding: 1px 6px; border-radius: 2px; font-weight: 800; font-size: 7px; ${e.status==="ACCEPTED"||e.status==="APPROVED"?"background: #dcfce7; color: #15803d;":e.status==="APPROVED_AS_NOTED"||e.status==="APPROVED AS NOTED"?"background: #e0f2fe; color: #0369a1;":e.status==="REJECTED"?"background: #fee2e2; color: #b91c1c;":"background: #fef3c7; color: #b45309;"}">${(e.status||"").replace(/_/g," ")}</span>
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
            ${((w=t.hse)==null?void 0:w.toolboxTalkTopic)||"Daily Morning Safety & PPE Briefing"}
          </td>
          <td class="meta-label" style="width: 18%;">TBT ATTENDANCE:</td>
          <td class="meta-value" style="width: 16%; font-weight: 800; color: #0284c7;">
            ${((P=t.hse)==null?void 0:P.toolboxTalkAttendees)!=null?`${t.hse.toolboxTalkAttendees} Workers`:`${u} Workers`}
          </td>
        </tr>
        <tr>
          <td class="meta-label">INCIDENT RECORD:</td>
          <td class="meta-value" style="font-weight: 800; color: ${(O=t.hse)!=null&&O.incidentsReported?"#dc2626":"#15803d"};">
            ${(H=t.hse)!=null&&H.incidentsReported?`⚠️ ${t.hse.incidentsReported} INCIDENTS REPORTED (${t.hse.incidentDetails||""})`:"✅ ZERO (0) ACCIDENTS / LOST TIME INJURIES (LTI)"}
          </td>
          <td class="meta-label">HOUSEKEEPING:</td>
          <td class="meta-value" style="font-weight: 700;">
            ${((B=t.hse)==null?void 0:B.housekeepingRating)||"GOOD"}
          </td>
        </tr>
        ${(j=t.hse)!=null&&j.permitsToWork&&t.hse.permitsToWork.length>0?`
        <tr>
          <td class="meta-label">ACTIVE PERMITS (PTW):</td>
          <td class="meta-value" colspan="3">
            ${t.hse.permitsToWork.map(e=>`<strong>${e.permitType}</strong> at ${e.location} (Auth: ${e.approvedBy})`).join(" &bull; ")}
          </td>
        </tr>
        `:""}
      </table>
    </div>

    <!-- ═══ 8.0 DELAYS, OBSTACLES & CONSULTANT OVERSIGHT ═══ -->
    ${t.delays&&t.delays.length>0||(M=t.consultant)!=null&&M.observations?`
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
          ${t.delays.map(e=>`
            <tr>
              <td style="font-weight: 700; color: #dc2626;">${e.category}</td>
              <td>${e.location||"General Site"} ${e.trade?`(${e.trade})`:""}</td>
              <td style="text-align: center; font-weight: 800; color: #dc2626;">${e.impactHours} hrs</td>
              <td style="font-size: 7.5px;">
                <div>${e.description}</div>
                ${e.remedialAction?`<div style="font-size: 7px; color: #15803d; margin-top: 2px;">Action: ${e.remedialAction}</div>`:""}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      `:""}
      ${(D=t.consultant)!=null&&D.observations?`
      <div style="background: #fafafa; border: 1px solid #cbd5e1; border-top: none; padding: 6px 10px; font-size: 7.5px; color: #334155;">
        <div><strong>Consultant / Client Representative Walk Remarks:</strong> ${t.consultant.observations}</div>
        ${(at=t.consultant)!=null&&at.directivesIssued?`<div style="margin-top: 2px;"><strong>Directives Issued:</strong> ${t.consultant.directivesIssued}</div>`:""}
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
              Name: <strong>${((pt=(ct=(X=t.signOffs)==null?void 0:X.SITE_ENGINEER)==null?void 0:ct.signedBy)==null?void 0:pt.name)||t.createdByName||"Site Engineer"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((Ot=(Z=(wt=t.signOffs)==null?void 0:wt.SITE_ENGINEER)==null?void 0:Z.signedBy)==null?void 0:Ot.designation)||"Project Field Engineer"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(Pt=(Dt=t.signOffs)==null?void 0:Dt.SITE_ENGINEER)!=null&&Pt.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">DIGITALLY SIGNED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((Y=t.signOffs.SITE_ENGINEER.signedBy)==null?void 0:Y.digitalStamp)||"VERIFIED-EXECUTION"}</div>
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
              Name: <strong>${((_t=(et=(tt=t.signOffs)==null?void 0:tt.QAQC_ENGINEER)==null?void 0:et.signedBy)==null?void 0:_t.name)||"Pending QA/QC Certification"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((kt=(Lt=(gt=t.signOffs)==null?void 0:gt.QAQC_ENGINEER)==null?void 0:Lt.signedBy)==null?void 0:kt.designation)||"QA/QC Lead Engineer"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(G=(F=t.signOffs)==null?void 0:F.QAQC_ENGINEER)!=null&&G.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">ISO 9001 CERTIFIED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${(($=t.signOffs.QAQC_ENGINEER.signedBy)==null?void 0:$.digitalStamp)||"QAQC-CERT-PASSED"}</div>
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
              Name: <strong>${((Mt=(ut=(xt=t.signOffs)==null?void 0:xt.SAFETY_OFFICER)==null?void 0:ut.signedBy)==null?void 0:Mt.name)||"Pending HSE Clearance"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((ht=(L=(ft=t.signOffs)==null?void 0:ft.SAFETY_OFFICER)==null?void 0:L.signedBy)==null?void 0:ht.designation)||"Site Safety Manager"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(qt=(zt=t.signOffs)==null?void 0:zt.SAFETY_OFFICER)!=null&&qt.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">SAFETY CLEARED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((vt=t.signOffs.SAFETY_OFFICER.signedBy)==null?void 0:vt.digitalStamp)||"HSE-CLEARED"}</div>
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
              Name: <strong>${((mt=(Ft=(Ut=t.signOffs)==null?void 0:Ut.PROJECT_MANAGER)==null?void 0:Ft.signedBy)==null?void 0:mt.name)||((Qt=(Vt=(Gt=t.signOffs)==null?void 0:Gt.CONSULTANT)==null?void 0:Vt.signedBy)==null?void 0:Qt.name)||"Pending Final Endorsement"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((yt=(Bt=(Ht=t.signOffs)==null?void 0:Ht.PROJECT_MANAGER)==null?void 0:Bt.signedBy)==null?void 0:yt.designation)||"Project Manager / Consultant"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(Tt=(Et=t.signOffs)==null?void 0:Et.PROJECT_MANAGER)!=null&&Tt.signed||(It=(St=t.signOffs)==null?void 0:St.CONSULTANT)!=null&&It.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">APPROVED & ENDORSED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((s=(i=(Rt=t.signOffs)==null?void 0:Rt.PROJECT_MANAGER)==null?void 0:i.signedBy)==null?void 0:s.digitalStamp)||"PM-AUTHORIZED"}</div>
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
        ${t.photos.map((e,b)=>`
          <div style="width: 48%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; text-align: center; background: #f8fafc; page-break-inside: avoid; margin-bottom: 6px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #0284c7; text-align: left; margin-bottom: 3px; display: flex; justify-content: space-between;">
              <span>PHOTO #${b+1} ${e.tradeTag?`&bull; ${e.tradeTag}`:""}</span>
              <span style="color: #64748b; font-size: 7px;">${e.location||"Site"}</span>
            </div>
            <div style="height: 150px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
              <img src="${e.url}" alt="Site Evidence #${b+1}" style="max-height: 150px; max-width: 100%; object-fit: contain;" />
            </div>
            <div style="font-size: 7px; color: #475569; text-align: left;">
              ${e.caption||"Daily site work progress photo"}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
    `:""}

    <!-- ═══ DOCUMENT FOOTER ═══ -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & STATUTORY QUALITY RECORD — ISO 9001:2015 CLAUSE 8.5.1 — ${p}</div>
      <div>Document Ref: ${f} &bull; Date: ${d.date}</div>
    </div>
  `;K(`${f} - Daily Site Log (${d.date})`,E)}export{Se as S,Pe as a,Ae as b,$e as c,_e as d,Ce as e,Ie as f,Ne as g,Re as h,we as i,De as j,Oe as k,Le as l,K as o};
