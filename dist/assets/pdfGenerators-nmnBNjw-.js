import{h as ce}from"./html2pdf-CpttaISV.js";import{c as re}from"./permitChecklist-BHE5VmmF.js";import"./vendor-pdf-CqL8L5vX.js";import{b as oe,r as dt,u as se}from"./index-CU_V3px1.js";import{j as Et}from"./vendor-three-h7LxBsfh.js";import{s as pe,b2 as ge,ag as fe,d as xe,bo as he,af as me,O as be}from"./vendor-icons-CHLyMjpm.js";import"./jspdf.plugin.autotable-Cg0p10kG.js";function le(t){if(!t||!t.trim())return[];const c=t.trim(),E=new RegExp("(?:^|\\n+|(?<=[.!?]\\s+)|(?<=\\b))((?:Dimensional\\s+Non-Conformance|Dimensional\\s+Check|Dimensional\\s+Defect|Non-Conformance|Defect\\s+Notice|Material\\s+Defect|Defects?|Discrepancy|Discrepancies|Operational\\s+Impact|Structural\\s+Impact|Engineering\\s+Impact|Risk\\s+Assessment|Safety\\s+Impact|Technical\\s+Impact|Management\\s+Directive|Executive\\s+Directive|Management\\s+Override|Management\\s+Instruction|Director'?s?\\s+Override|Director'?s?\\s+Directive|Executive\\s+Instruction|Site\\s+Instruction|Liability\\s+Disclaimer|Disclaimer|Warranty\\s+Notice|Indemnity\\s+Clause|Indemnity|Legal\\s+Notice|Corrective\\s+Action|Mandatory\\s+Action|Action\\s+Required|Remedial\\s+Action|Resolution|Mitigation|Technical\\s+Evaluation|Technical\\s+Justification|Specification\\s+Reference|QA\\/QC\\s+Observation|Inspector\\s+Notes?|Notes?|Special\\s+Instructions?|Caveats?|Conditions?|Observations?|Root\\s+Cause|Justification|Disposition\\s+Notice|Testing\\s+Conditions?))(?:\\s*:\\s*|\\s*—\\s*|\\s*-\\s*)","gi"),l=Array.from(c.matchAll(E));if(l.length>=1){const r=[],m=l[0].index??0;if(m>0){const n=c.substring(0,m).trim();n&&r.push({category:"standard",header:"",content:n})}for(let n=0;n<l.length;n++){const T=l[n],h=T.index??0,v=T[0],O=T[1].trim(),N=l[n+1],P=N?N.index??c.length:c.length,b=c.substring(h+v.length,P).trim(),i=O.toLowerCase();let u="standard";i.includes("non-conformance")||i.includes("defect")||i.includes("discrepanc")?u="defect":i.includes("impact")||i.includes("risk")||i.includes("safety")?u="impact":i.includes("directive")||i.includes("override")||i.includes("instruction")?u="directive":i.includes("disclaimer")||i.includes("liability")||i.includes("indemnity")||i.includes("warranty")||i.includes("legal")?u="disclaimer":i.includes("action")||i.includes("remedial")||i.includes("corrective")||i.includes("resolution")||i.includes("mitigation")?u="action":(i.includes("note")||i.includes("observation")||i.includes("condition")||i.includes("caveat")||i.includes("evaluation")||i.includes("justification")||i.includes("root cause"))&&(u="note"),r.push({category:u,header:O,content:b})}return r}const $=c.split(/\n\s*\n|\r\n\s*\r\n|\n/).map(r=>r.trim()).filter(Boolean);return $.length===0?[{category:"standard",header:"",content:c}]:$.map(r=>{const m=r.match(/^([A-Za-z0-9\s/&'_-]{3,45}):\s+(.+)$/s);if(m){const n=m[1].trim(),T=m[2].trim(),h=n.toLowerCase();let v="note";return h.includes("defect")||h.includes("non-conformance")||h.includes("fail")||h.includes("error")||h.includes("discrepanc")?v="defect":h.includes("impact")||h.includes("risk")||h.includes("safety")?v="impact":h.includes("directive")||h.includes("override")||h.includes("instruction")?v="directive":h.includes("disclaimer")||h.includes("liability")||h.includes("indemnity")?v="disclaimer":(h.includes("action")||h.includes("required")||h.includes("remed"))&&(v="action"),{category:v,header:n,content:T}}return{category:"standard",header:"",content:r}})}function Zt(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function te(t,c="No inspection observations or notes recorded."){const E=le(t);return E.length===0?`<div style="font-size: 8px; color: #64748b; font-style: italic; line-height: 1.4;">${Zt(c)}</div>`:E.length===1&&!E[0].header?`<div style="font-size: 8px; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">${Zt(E[0].content)}</div>`:`
    <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
      ${E.map(l=>{let $="#f8fafc",r="#cbd5e1",m="3.5px solid #64748b",n="#e2e8f0",T="#334155",h="#cbd5e1";switch(l.category){case"defect":$="#fff5f5",r="#fecaca",m="3.5px solid #dc2626",n="#fee2e2",T="#991b1b",h="#fca5a5";break;case"impact":$="#fffbeb",r="#fef08a",m="3.5px solid #d97706",n="#fef3c7",T="#92400e",h="#fcd34d";break;case"directive":$="#faf5ff",r="#e9d5ff",m="3.5px solid #7c3aed",n="#f3e8ff",T="#581c87",h="#d8b4fe";break;case"disclaimer":$="#f8fafc",r="#cbd5e1",m="3.5px solid #334155",n="#e2e8f0",T="#0f172a",h="#94a3b8";break;case"action":$="#f0fdf4",r="#bbf7d0",m="3.5px solid #16a34a",n="#dcfce7",T="#166534",h="#86efac";break;case"note":$="#f0f9ff",r="#bae6fd",m="3.5px solid #0284c7",n="#e0f2fe",T="#0369a1",h="#7dd3fc";break;default:$="#ffffff",r="#e2e8f0",m="3px solid #94a3b8",n="#f1f5f9",T="#475569",h="#cbd5e1";break}return`
            <div style="background: ${$}; border: 1px solid ${r}; border-left: ${m}; border-radius: 4px; padding: 6px 8px; box-sizing: border-box; page-break-inside: avoid; break-inside: avoid;">
              ${l.header?`
                <div style="margin-bottom: 3.5px; display: flex; align-items: center; gap: 6px;">
                  <span style="display: inline-block; padding: 1.5px 6px; background: ${n}; color: ${T}; border: 1px solid ${h}; border-radius: 3px; font-weight: 800; font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.4px;">
                    ${Zt(l.header)}
                  </span>
                </div>
              `:""}
              <div style="font-size: 8px; color: #1e293b; line-height: 1.5; white-space: pre-wrap; font-weight: ${l.category==="defect"||l.category==="directive"?"600":"400"};">
                ${Zt(l.content)}
              </div>
            </div>
          `}).join("")}
    </div>
  `}const Ne=({text:t,fallback:c="No observations or details recorded.",className:E="",defaultCategory:l})=>{const $=le(t);return $.length===0?Et.jsx("div",{className:`p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 italic text-xs ${E}`,children:c}):($.length===1&&!$[0].header&&l&&($[0].category=l),Et.jsx("div",{className:`space-y-2.5 ${E}`,children:$.map((r,m)=>{let n="bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 border-l-4 border-l-slate-500",T="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",h=pe;switch(r.category){case"defect":n="bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200 border-l-4 border-l-red-600",T="bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 border-red-300 dark:border-red-800",h=be;break;case"impact":n="bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 border-l-4 border-l-amber-500",T="bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800",h=me;break;case"directive":n="bg-purple-50/80 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/60 text-purple-900 dark:text-purple-200 border-l-4 border-l-purple-600",T="bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-800",h=he;break;case"disclaimer":n="bg-slate-100/90 dark:bg-slate-900/90 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 border-l-4 border-l-slate-700 dark:border-l-slate-400",T="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-400 dark:border-slate-600",h=xe;break;case"action":n="bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-l-4 border-l-emerald-600",T="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800",h=fe;break;case"note":n="bg-sky-50/80 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/60 text-sky-900 dark:text-sky-200 border-l-4 border-l-sky-500",T="bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-800",h=ge;break}return Et.jsxs("div",{className:`p-3.5 rounded-xl border shadow-sm transition ${n}`,children:[r.header&&Et.jsx("div",{className:"flex items-center gap-2 mb-1.5",children:Et.jsxs("span",{className:`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border font-mono ${T}`,children:[Et.jsx(h,{className:"w-3 h-3 shrink-0"}),Et.jsx("span",{children:r.header})]})}),Et.jsx("p",{className:"text-xs leading-relaxed whitespace-pre-wrap font-medium",children:r.content})]},m)})}))},ne={"classic-executive":{id:"classic-executive",name:"Corporate Executive",tagline:"Signature Prestige & Gold Dossier",description:"Classic corporate look with bronze/warm gold accents, deep navy typography, and dual-tone hero cover.",accentColor:"#c28b5e",accentDark:"#9a6538",accentLight:"#fbf6f0",primaryHeaderBg:"#0f172a",headerTextColor:"#ffffff",cardBg:"#ffffff",cardBorder:"#e2e8f0",cardRadius:"6px",badgeBg:"#0f172a",badgeTextColor:"#ffffff",badgeBorder:"#0f172a",ruleColor:"#c28b5e",coverStyle:"split-bronze",fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",headingFont:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",tableHeaderBg:"#0f172a",tableHeaderTextColor:"#ffffff",tableBorderColor:"#e2e8f0",tableZebraBg:"#f8fafc",badgeApprovedBg:"#ecfdf5",badgeApprovedColor:"#059669",badgeApprovedBorder:"#a7f3d0",badgeRejectedBg:"#fef2f2",badgeRejectedColor:"#dc2626",badgeRejectedBorder:"#fecaca",badgePendingBg:"#f8fafc",badgePendingColor:"#64748b",badgePendingBorder:"#e2e8f0",previewThumbnailColor:"#c28b5e",previewBorderColor:"#d49a5b",cssVariables:{"--report-accent":"#c28b5e","--report-accent-dark":"#9a6538","--report-accent-light":"#fbf6f0","--report-header-bg":"#0f172a","--report-header-text":"#ffffff","--report-border":"#e2e8f0","--report-rule":"#c28b5e"}},"engineering-blueprint":{id:"engineering-blueprint",name:"Modern Blueprint",tagline:"Technical CAD & Engineering Azure",description:"A precision architectural aesthetic featuring technical cyan rules, dark blueprint header accents, and structural grid borders.",accentColor:"#0284c7",accentDark:"#0369a1",accentLight:"#f0f9ff",primaryHeaderBg:"#0c4a6e",headerTextColor:"#ffffff",cardBg:"#ffffff",cardBorder:"#bae6fd",cardRadius:"3px",badgeBg:"#0369a1",badgeTextColor:"#ffffff",badgeBorder:"#0284c7",ruleColor:"#0284c7",coverStyle:"blueprint-cad",fontFamily:"'Segoe UI', Roboto, -apple-system, sans-serif",headingFont:"'Segoe UI', Roboto, sans-serif",tableHeaderBg:"#0c4a6e",tableHeaderTextColor:"#ffffff",tableBorderColor:"#bae6fd",tableZebraBg:"#f0f9ff",badgeApprovedBg:"#ecfeff",badgeApprovedColor:"#0891b2",badgeApprovedBorder:"#a5f3fc",badgeRejectedBg:"#fff1f2",badgeRejectedColor:"#e11d48",badgeRejectedBorder:"#fecdd3",badgePendingBg:"#f8fafc",badgePendingColor:"#475569",badgePendingBorder:"#cbd5e1",previewThumbnailColor:"#0284c7",previewBorderColor:"#38bdf8",cssVariables:{"--report-accent":"#0284c7","--report-accent-dark":"#0369a1","--report-accent-light":"#f0f9ff","--report-header-bg":"#0c4a6e","--report-header-text":"#ffffff","--report-border":"#bae6fd","--report-rule":"#0284c7"}},"minimal-editorial":{id:"minimal-editorial",name:"Minimalist Editorial",tagline:"Swiss Clean Monochrome & Typography",description:"High-end Swiss editorial layout with charcoal accents, subtle hairline rules, generous white-space, and refined elegance.",accentColor:"#334155",accentDark:"#1e293b",accentLight:"#f8fafc",primaryHeaderBg:"#1e293b",headerTextColor:"#ffffff",cardBg:"#ffffff",cardBorder:"#cbd5e1",cardRadius:"0px",badgeBg:"#1e293b",badgeTextColor:"#ffffff",badgeBorder:"#1e293b",ruleColor:"#334155",coverStyle:"minimalist-clean",fontFamily:"system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",headingFont:"system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",tableHeaderBg:"#1e293b",tableHeaderTextColor:"#ffffff",tableBorderColor:"#e2e8f0",tableZebraBg:"#f8fafc",badgeApprovedBg:"#f1f5f9",badgeApprovedColor:"#0f172a",badgeApprovedBorder:"#94a3b8",badgeRejectedBg:"#fef2f2",badgeRejectedColor:"#b91c1c",badgeRejectedBorder:"#fca5a5",badgePendingBg:"#f8fafc",badgePendingColor:"#64748b",badgePendingBorder:"#e2e8f0",previewThumbnailColor:"#334155",previewBorderColor:"#64748b",cssVariables:{"--report-accent":"#334155","--report-accent-dark":"#1e293b","--report-accent-light":"#f8fafc","--report-header-bg":"#1e293b","--report-header-text":"#ffffff","--report-border":"#cbd5e1","--report-rule":"#334155"}},"industrial-safety":{id:"industrial-safety",name:"Industrial High-Vis",tagline:"Site Safety Amber & Charcoal Contrast",description:"Construction-grade visual format with high-contrast safety amber borders, bold uppercase typography, and prominent QA/QC status ribbons.",accentColor:"#d97706",accentDark:"#b45309",accentLight:"#fffbeb",primaryHeaderBg:"#18181b",headerTextColor:"#ffffff",cardBg:"#ffffff",cardBorder:"#fde68a",cardRadius:"8px",badgeBg:"#d97706",badgeTextColor:"#ffffff",badgeBorder:"#d97706",ruleColor:"#d97706",coverStyle:"industrial-bold",fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",headingFont:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",tableHeaderBg:"#18181b",tableHeaderTextColor:"#fde047",tableBorderColor:"#fde68a",tableZebraBg:"#fffbeb",badgeApprovedBg:"#ecfdf5",badgeApprovedColor:"#047857",badgeApprovedBorder:"#6ee7b7",badgeRejectedBg:"#fef2f2",badgeRejectedColor:"#b91c1c",badgeRejectedBorder:"#f87171",badgePendingBg:"#fffbeb",badgePendingColor:"#92400e",badgePendingBorder:"#fde68a",previewThumbnailColor:"#d97706",previewBorderColor:"#f59e0b",cssVariables:{"--report-accent":"#d97706","--report-accent-dark":"#b45309","--report-accent-light":"#fffbeb","--report-header-bg":"#18181b","--report-header-text":"#ffffff","--report-border":"#fde68a","--report-rule":"#d97706"}}},ue="classic-executive";function ve(t){return t in ne?ne[t]:ne[ue]}const ye=`
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
`;function rt(t,c,E=""){const l=window.open("","_blank");if(!l){alert("Please allow popups to generate and print the quality document.");return}const $=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t}</title>
  <style>
    ${ye}
    ${E}
  </style>
</head>
<body>
  <div class="page-container">
    ${c}
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
</html>`;l.document.open(),l.document.write($),l.document.close()}const k=t=>{if(!t||t==="—")return"—";const c=t instanceof Date?t:new Date(t);return isNaN(c.getTime())?String(t):c.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})};function we(t,c={},E={}){var P;const l=E.name,$=c.name,r=t.ptpNumber||`PTP-${Math.floor(1e3+Math.random()*9e3)}`,m=((P=t.checklistItems)!=null&&P.length?t.checklistItems:re()).map((b,i)=>{var u;return{cat:b.category||"General",param:b.label,status:b.status||(i===0&&((u=t.checklist)!=null&&u.rebarInspectionApproved),"PASS")}});(t.stakeholders||[]).filter(b=>b.required);const n=t.status==="REJECTED",h=(()=>{if(n)return[{role:"QA/QC Engineer",name:t.issuedByName,required:!0}];if(t.stakeholders&&t.stakeholders.length>0)return t.stakeholders;const b=t.requiredSignoffs,i=[{role:"QA/QC Engineer",name:t.issuedByName,required:!0}];return(!b||b.siteManager!==!1)&&i.push({role:"Site / Construction Manager",name:"",required:!0}),(!b||b.structuralConsultant!==!1)&&i.push({role:"Structural Consultant / Engineer",name:"",required:!0}),b!=null&&b.mechanicalEngineer&&i.push({role:"Mechanical Engineer",name:"",required:!1}),b!=null&&b.electricalEngineer&&i.push({role:"Electrical Engineer",name:"",required:!1}),i})(),v=t,O=`
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
            content: "CONFIDENTIAL & PROPRIETARY — ${l}";
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
            ${dt(E,c)}
          </td>
          <td style="width: 55%;">
            <div class="header-title">Official Permit To Pour (PTP) Authorization</div>
            <div class="header-sub">PROJECT: ${$}</div>
          </td>
          <td style="width: 25%;" class="meta-box">
            <strong>PTP Ref:</strong> <span style="color:#ea580c; font-weight:700;">${v.permitNumber}</span><br/>
            <strong>Scheduled Pour:</strong> ${k(v.pourDate)} (${v.pourTime})<br/>
            <strong>Status:</strong> <span class="${n?"status-rejected":"status-issued"}">${v.status||"ISSUED"}</span>
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
            ${m.map((b,i)=>`
              <tr>
                <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #64748b;">${i+1}</td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center;">
                  <span style="font-weight: 800; font-size: 8px; padding: 1px 4px; border-radius: 2px; ${b.status==="PASS"?"background: #dcfce7; color: #15803d;":b.status==="FAIL"?"background: #fee2e2; color: #b91c1c;":"background: #f1f5f9; color: #64748b;"}">${b.status}</span>
                </td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 700; color: #334155;">${b.cat}</td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 500; color: #0f172a;">${b.param}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="pdf-section">
        <div class="section-title">4.0 Statutory Authorizations & Stakeholder Sign-Off Block</div>
        <table class="section-table" style="margin-top: 4px;">
          ${h.reduce((b,i,u)=>{if(u%2===0){const x=h[u+1],o=N(i),s=x?N(x):'<td style="width: 50%; height: 75px; background: #fafafa; border: 1px dashed #cbd5e1;"></td>';b+=`<tr>${o}${s}</tr>`}return b},"")}
        </table>
      </div>

      <div class="footer-fallback">
        <span>CONFIDENTIAL — ${l}</span>
        <span>PTP Ref: ${v.permitNumber}</span>
      </div>

      <script>
        window.onload = () => {
          window.print();
        };
      <\/script>
    </body>
    </html>
  `;function N(b){const i=b.required?"#15803d":"#64748b",u=b.required?"REQUIRED":"OPTIONAL";return`
      <td style="width: 50%; height: 75px; vertical-align: top; padding: 6px 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span style="font-weight: 700; font-size: 8px; text-transform: uppercase; color: #ea580c;">${b.designation?`${b.designation} <span style="font-size: 7px; color: #64748b; font-weight: normal;">(${b.role})</span>`:b.role}</span>
          <span style="font-size: 6px; font-weight: 700; background: ${i}15; color: ${i}; padding: 1px 3px; border-radius: 2px;">${u}</span>
        </div>
        <div style="font-size: 8px; margin-bottom: 8px;">Name: <strong>${b.name||"__________________________________________________"}</strong></div>
        <div style="font-size: 8px; display: flex; justify-content: space-between;">
          <span>Sign: ________________________</span>
          <span>Date: ____ / ____ / 20__</span>
        </div>
      </td>
    `}rt(`${r} - Permit to Pour`,O)}function Oe(t,c={},E={}){var b;const l=E.name,$=c.companyName,r=t.ptpNumber||`PTP-${Math.floor(1e3+Math.random()*9e3)}`,m=((b=t.checklistItems)!=null&&b.length?t.checklistItems:re()).map((i,u)=>{var x;return{cat:i.category||"General",param:i.label,status:i.status||(u===0&&((x=t.checklist)!=null&&x.rebarInspectionApproved),"PASS")}}),n=t.status==="REJECTED",h=(()=>{if(n)return[{role:"QA/QC Engineer",name:t.issuedByName||"J. Oladejo",required:!0}];if(t.stakeholders&&t.stakeholders.length>0)return t.stakeholders.filter(x=>x.required);const i=t.requiredSignoffs,u=[{role:"QA/QC Engineer",name:t.issuedByName||"",required:!0}];return(!i||i.siteManager!==!1)&&u.push({role:"Site / Construction Manager",name:"",required:!0}),(!i||i.structuralConsultant!==!1)&&u.push({role:"Structural Consultant / Engineer",name:"",required:!0}),i!=null&&i.mechanicalEngineer&&u.push({role:"Mechanical Engineer",name:"",required:!0}),i!=null&&i.electricalEngineer&&u.push({role:"Electrical Engineer",name:"",required:!0}),u})(),v=`
    <div id="pdf-document" style="padding: 20px; font-family: Arial, sans-serif; color: #0f172a; background: #fff;">
      <!-- Header -->
      <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #0f172a; margin-bottom: 12px; background: #ffffff;">
        <tr>
          <td style="width: 22%; border: 1px solid #cbd5e1; padding: 6px; text-align: center; vertical-align: middle; background: #ffffff;">
            ${dt(E,c)}
          </td>
          <td style="width: 53%; border: 1px solid #cbd5e1; padding: 6px; text-align: center; vertical-align: middle;">
            <div style="font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; color: #0f172a;">PERMIT TO POUR (PTP) AUTHORIZATION</div>
            <div style="font-size: 9.5px; font-weight: 700; color: #ea580c; margin-top: 2px; text-transform: uppercase;">PROJECT: ${$}</div>
            <div style="font-size: 7.5px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-top: 1px;">ISO 9001:2015 Clause 8.6 Release of Products & Services</div>
          </td>
          <td style="width: 25%; border: 1px solid #cbd5e1; padding: 6px; font-size: 8px; line-height: 1.5; color: #334155; vertical-align: middle;">
            <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${r}</span></div>
            <div><strong>Date:</strong> ${k(t.plannedPourDate)}</div>
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
            ${m.map((i,u)=>`
              <tr>
                <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #64748b;">${u+1}</td>
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
          ${h.reduce((i,u,x)=>{if(x%2===0){const o=h[x+1],s=O(u),p=o?O(o):'<td style="width: 50%; height: 70px; background: #fafafa; border: 1px solid #e2e8f0;"></td>';i+=`<tr>${s}${p}</tr>`}return i},"")}
        </table>
      </div>

      <!-- Footer -->
      <div style="font-size: 8px; color: #64748b; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 5px; margin-top: 10px;">
        <div>CONFIDENTIAL & PROPRIETARY — ${l}</div>
        <div>Doc Ref: ${r}</div>
      </div>
    </div>
  `;function O(i){const u=i.required?"#15803d":"#64748b",x=i.required?"REQUIRED":"OPTIONAL";return`
      <td style="width: 50%; height: 70px; vertical-align: top; padding: 6px 8px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span style="font-weight: 700; font-size: 8px; text-transform: uppercase; color: #ea580c;">${i.designation?`${i.designation} <span style="font-size: 7px; color: #64748b; font-weight: normal;">(${i.role})</span>`:i.role}</span>
          <span style="font-size: 6px; font-weight: 700; background: ${u}15; color: ${u}; padding: 1px 3px; border-radius: 2px;">${x}</span>
        </div>
        <div style="font-size: 8px; margin-bottom: 8px;">Name: <strong>${i.name||"__________________________________________________"}</strong></div>
        <div style="font-size: 8px; display: flex; justify-content: space-between;">
          <span>Sign: ________________________</span>
          <span>Date: ____ / ____ / 20__</span>
        </div>
      </td>
    `}const N=document.createElement("div");N.innerHTML=v,document.body.appendChild(N);const P={margin:[10,10,10,10],filename:`${r}_PermitToPour.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:!0,logging:!1},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"}};ce().set(P).from(N).toPdf().get("pdf").then(i=>{const u=i.internal.getNumberOfPages();for(let x=1;x<=u;x++)i.setPage(x),i.setFont("helvetica","normal"),i.setFontSize(6.5),i.setTextColor(100,116,139),i.text(`CONFIDENTIAL & PROPRIETARY — ${l}`,10,291),i.text(`PTP Ref: ${t.permitNumber}  |  Page ${x} of ${u}`,200,291,{align:"right"});i.save(`${r}.pdf`)}).catch(i=>{console.error("PDF generation failed:",i)}).finally(()=>{document.body.removeChild(N)})}function Ee(t,c={},E={}){var b,i,u;const l=E.name||"Collection Developments LTD",$=c.name||"Bankside",r=t.inspectionNumber||`INSP-2026-${Math.floor(1e3+Math.random()*9e3)}`,m=t.items||[],n=m.filter(x=>x.result==="PASS").length,T=m.filter(x=>x.result==="FAIL").length,h=m.filter(x=>x.result==="OBSERVATION").length,O=(x=>{switch(x==null?void 0:x.toUpperCase()){case"APPROVED":case"CLOSED":return{bg:"#dcfce7",text:"#15803d",border:"#86efac"};case"PENDING_REVIEW":return{bg:"#fef3c7",text:"#b45309",border:"#fcd34d"};case"REJECTED":return{bg:"#fee2e2",text:"#b91c1c",border:"#fca5a5"};default:return{bg:"#f1f5f9",text:"#334155",border:"#cbd5e1"}}})(t.status),N=t.stakeholders&&t.stakeholders.length>0?t.stakeholders.filter(x=>x.required!==!1):[{role:"QA/QC Inspector",name:((b=t.inspector)==null?void 0:b.name)||t.inspectorName||"QA/QC Inspector",designation:((i=t.inspector)==null?void 0:i.designation)||"QA/QC Inspector",required:!0,signed:t.status==="APPROVED"||t.status==="CLOSED",signedAt:t.approvedAt?new Date(t.approvedAt).toISOString():void 0},{role:"Site / Construction Engineer",name:t.subcontractorRepresentative||"Site Engineer",designation:"Site Engineer",required:!0,signed:!1},{role:"Consultant / Resident Engineer",name:t.consultantRepresentative||"Resident Engineer",designation:"Consultant",required:!0,signed:!1}],P=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${dt(E,c)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">FIELD INSPECTION & VERIFICATION REPORT</div>
          <div class="header-title-project">PROJECT: ${$}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.6 Monitoring & Measurement of Processes</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${r}</span></div>
          <div><strong>Date:</strong> ${k(t.scheduledDate||t.createdAt)}</div>
          <div><strong>Status:</strong> <span class="status-badge" style="background:${O.bg}; color:${O.text}; border:1px solid ${O.border};">${t.status||"DRAFT"}</span></div>
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
          <td class="grid-value"><strong>${((u=t.inspector)==null?void 0:u.name)||t.inspectorName||"QA/QC Inspector"}</strong></td>
        </tr>
      </table>
    </div>

    <!-- 2.0 Hold Point Verification Checklist -->
    <div class="pdf-section">
      <div class="section-banner">2.0 TECHNICAL VERIFICATION CHECKPOINTS (${m.length} ITEMS | ${n} PASS, ${T} FAIL, ${h} OBS)</div>
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
          ${m.length>0?m.map((x,o)=>`
            <tr>
              <td style="text-align: center; font-weight: 700; color: #64748b;">${o+1}</td>
              <td style="text-align: center;">
                <span class="${x.result==="PASS"?"badge-pass":x.result==="FAIL"?"badge-fail":x.result==="OBSERVATION"?"badge-observation":"badge-na"}">${x.result||"PENDING"}</span>
              </td>
              <td style="font-weight: 700; color: #334155;">
                ${x.category||x.discipline||"Structural"}
                ${x.critical?'<br/><span class="badge-fail" style="font-size:6.5px; padding:0 3px;">CRITICAL</span>':""}
                ${x.isHoldPoint?'<br/><span class="badge-hold" style="font-size:6.5px; padding:0 3px;">HOLD POINT</span>':""}
              </td>
              <td>
                <div style="font-weight: 600; color: #0f172a;">${x.label}</div>
                ${x.acceptanceCriteria?`<div style="font-size: 7px; color: #64748b; margin-top: 1px; italic">Criteria: ${x.acceptanceCriteria}</div>`:""}
              </td>
              <td style="font-size: 7.2px; color: #475569;">${x.remarks||"—"}</td>
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
    ${m.some(x=>x.photos&&x.photos.length>0)?`
    <div class="pdf-section">
      <div class="section-banner">3.0 PHOTOGRAPHIC VERIFICATION RECORDS</div>
      <div class="photo-grid">
        ${m.flatMap(x=>(x.photos||[]).map(o=>({url:o,label:x.label}))).map((x,o)=>`
          <div class="photo-card">
            <span class="photo-tag">Photo #${o+1}</span>
            <div><img src="${x.url}" alt="Inspection Evidence" /></div>
            <div class="photo-caption">${x.label}</div>
          </div>
        `).join("")}
      </div>
    </div>
    `:""}

    <!-- 4.0 Statutory Sign-Off -->
    <div class="pdf-section">
      <div class="section-banner">4.0 STATUTORY WITNESS & VERIFICATION SIGN-OFF</div>
      <table class="signoff-table">
        ${(()=>{let x="";for(let s=0;s<N.length;s+=3){const p=N.slice(s,s+3),w=(100/Math.max(p.length,1)).toFixed(2);x+=`<tr>${p.map(R=>`
              <td style="width: ${w}%; vertical-align: top; padding: 6px 8px; border: 1px solid #cbd5e1; background: ${R.signed?"#f0fdf4":"#fafafa"};">
                <div class="sig-role-header">
                  <span>${R.designation?`${R.designation} (${R.role})`:R.role}</span>
                  <span class="sig-required-tag" style="font-size: 6.5px; font-weight: 700; background: ${R.required?"#dcfce7":"#f1f5f9"}; color: ${R.required?"#15803d":"#64748b"}; padding: 1px 4px; border-radius: 2px;">
                    ${R.required?"REQUIRED":"OPTIONAL"}
                  </span>
                </div>
                <div style="font-size: 8px; color: #334155; margin-bottom: 4px;">
                  Name: <strong>${R.name||"________________________"}</strong>
                </div>
                <div class="sig-line" style="border-bottom: 1px dashed #cbd5e1; margin: 4px 0;"></div>
                <div style="display: flex; justify-content: space-between; font-size: 7.2px; color: #64748b; margin-top: 3px;">
                  <span>${R.signed?'<strong style="color: #15803d;">✓ Digitally Signed</strong>':"Sign: ___________________"}</span>
                  <span>Date: ${R.signed&&R.signedAt?k(R.signedAt):R.signed?k(t.scheduledDate||t.createdAt):"____/____/20__"}</span>
                </div>
              </td>
            `).join("")}</tr>`}return x})()}
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${l}</div>
      <div>Inspection Ref: ${r}</div>
    </div>
  `;rt(`${r} - Inspection Report`,P)}const De=Ee;function de(t,c){if(!t||!t.trim())return`
      <div style="font-size: 7.5px; color: #64748b; margin-bottom: 3.5px;">
        <strong style="color: ${c.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 1.5px;">${c.title}:</strong>
        <span style="font-style: italic;">—</span>
      </div>
    `;const l=t.replace(/<br\s*\/?>/gi,`
`).split(/\r?\n/).map(m=>m.trim()).filter(Boolean);if(l.length===0)return`
      <div style="font-size: 7.5px; color: #64748b; margin-bottom: 3.5px;">
        <strong style="color: ${c.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 1.5px;">${c.title}:</strong>
        <span style="font-style: italic;">—</span>
      </div>
    `;if(l.length===1)return`
      <div style="font-size: 7.5px; color: ${c.textColor||"#0f172a"}; margin-bottom: 3.5px;">
        <strong style="color: ${c.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 1.5px;">${c.title}:</strong>
        <div style="white-space: pre-line; line-height: 1.45;">${l[0]}</div>
      </div>
    `;const $=l.every(m=>/^(\d+[\.\)]|[a-zA-Z][\.\)]|[-•*])\s*/.test(m)),r=l.map((m,n)=>`
        <div style="display: flex; align-items: flex-start; line-height: 1.4; margin-bottom: 2.5px;">
          ${$?"":`<span style="font-weight: 700; color: ${c.bulletColor||c.titleColor}; margin-right: 4px; min-width: 13px; display: inline-block;">${n+1}.</span>`}
          <span style="flex: 1; white-space: pre-line;">${m}</span>
        </div>
      `).join("");return`
    <div style="font-size: 7.5px; color: ${c.textColor||"#0f172a"}; margin-bottom: 4px;">
      <strong style="color: ${c.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 2px;">${c.title}:</strong>
      <div style="padding-left: 1px;">
        ${r}
      </div>
    </div>
  `}function Pe(t,c={},E={}){var N,P,b,i,u,x;const l=(b=(P=(N=oe)==null?void 0:N.getState)==null?void 0:P.call(N))==null?void 0:b.activeProject,r=(((x=(u=(i=oe)==null?void 0:i.getState)==null?void 0:u.call(i))==null?void 0:x.projects)||[]).find(o=>o.id===(t.projectId||t.project)),m=(E==null?void 0:E.name)||t.companyName||"Collection Developments LTD",n=(c==null?void 0:c.name)||t.projectName||t.projectTitle||(r==null?void 0:r.name)||(l==null?void 0:l.name)||"Site Construction Operations",T=t.reportNumber||`QC-COMM-${Math.floor(1e3+Math.random()*9e3)}`,h=t.observations||[],v=h.filter(o=>o.status!=="CLOSED"&&o.status!=="Compliant"&&o.status!=="RECTIFIED").length,O=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${dt(E,c)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">SITE COMMENTS & FIELD OBSERVATIONS REPORT</div>
          <div class="header-title-project">PROJECT: ${n}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.5 & 8.7 Nonconformity Identification</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${T}</span></div>
          <div><strong>Date:</strong> ${k(t.inspectionDate||t.createdAt)}</div>
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
          <td class="grid-value" style="width: 32%;">${n}</td>
          <td class="grid-label" style="width: 18%;">Inspection Date:</td>
          <td class="grid-value" style="width: 32%;">${k(t.inspectionDate)}</td>
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
      <div class="section-banner">2.0 QUALITY OBSERVATIONS & CORRECTIVE DIRECTIVES (${h.length} OBSERVATIONS)</div>
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
          ${h.length>0?h.map((o,s)=>{const p=o.comments||o.observationText||o.fieldObservation||"—",w=o.correctiveDirective||"Rectify per approved engineering specifications.",R=o.status==="CLOSED"||o.status==="Compliant"||o.status==="RECTIFIED";return`
            <tr>
              <td style="text-align: center; font-weight: 700; color: #64748b;">${s+1}</td>
              <td>
                <div style="font-weight: 700; color: #0f172a;">${o.levelName||"Site Area"}</div>
                ${o.structuralElement?`<div style="font-size: 7.2px; font-weight: 600; color: #ea580c;">${o.structuralElement}</div>`:""}
                ${o.gridLocation?`<div style="font-size: 7px; color: #64748b;">Grid: ${o.gridLocation}</div>`:""}
                <div style="font-size: 7px; color: #475569; margin-top: 2px;"><strong>Trade:</strong> ${o.tradeName||o.trade||"Civil"}</div>
              </td>
              <td>
                ${de(p,{title:"Observed Condition",titleColor:"#991b1b",bulletColor:"#991b1b",textColor:"#0f172a"})}
                ${de(w,{title:"Corrective Directive",titleColor:"#15803d",bulletColor:"#15803d",textColor:"#166534"})}
                <div style="font-size: 7px; color: #64748b; margin-top: 2px;">
                  Assigned To: <strong>${o.assignedTo||o.assignedSubcontractor||"Contractor"}</strong>
                  ${o.dueDate?` | Target Due: ${k(o.dueDate)}`:""}
                </div>

                ${o.photos&&o.photos.length>0?`
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; padding-top: 3px; border-top: 1px dashed #cbd5e1;">
                  ${o.photos.map((L,U)=>{const F=typeof L=="string"?L:(L==null?void 0:L.url)||(L==null?void 0:L.thumbnailUrl);return F?`<img src="${F}" style="height: 50px; max-width: 80px; object-fit: cover; border-radius: 2px; border: 1px solid #cbd5e1;" alt="Photo ${U+1}" />`:""}).join("")}
                </div>
                `:""}
              </td>
              <td style="text-align: center;">
                <span class="${R?"badge-pass":"badge-pending"}">${o.status||"OPEN"}</span>
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
              <span>Date: ${k(t.inspectionDate||t.createdAt)}</span>
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
      <div>CONFIDENTIAL & PROPRIETARY — ${m}</div>
      <div>Report Ref: ${T}</div>
    </div>
  `;rt(`${T} - Site Comments`,O)}function Le(t,c={},E={}){var n,T,h,v,O,N,P,b;const l=E.name||"Collection Developments LTD",$=c.name||"Bankside",r=t.rfiNumber||`RFI-2026-${Math.floor(1e3+Math.random()*9e3)}`,m=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${dt(E,c)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">REQUEST FOR INFORMATION (RFI)</div>
          <div class="header-title-project">PROJECT: ${$}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.2 Design & Engineering Communications</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${r}</span></div>
          <div><strong>Date Raised:</strong> ${k(t.createdAt)}</div>
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
          <td class="grid-value">${((n=t.raisedBy)==null?void 0:n.name)||"Site Engineer"} (${((T=t.raisedBy)==null?void 0:T.role)||"Main Contractor"})</td>
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
      <div class="section-banner">4.0 CONSULTANT FORMAL RESPONSE & DIRECTIVE [${((h=t.response)==null?void 0:h.approvalStatus)||"UNDER REVIEW"}]</div>
      <div class="box-content">
        <div style="line-height: 1.45; color: #0f172a; margin-bottom: 6px;">
          ${((v=t.response)==null?void 0:v.responseText)||"Official response is currently being finalized by the engineering design consultant."}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #475569; border-top: 1px solid #f1f5f9; padding-top: 4px;">
          <span>Reviewed By: <strong>${((O=t.response)==null?void 0:O.responderName)||t.assignedConsultant||"Consultant"}</strong></span>
          <span>Response Date: <strong>${k((N=t.response)==null?void 0:N.responseDate)}</strong></span>
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
            <div style="font-size: 8px; color: #334155;">Name: <strong>${((P=t.raisedBy)==null?void 0:P.name)||"Lead Engineer"}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${k(t.createdAt)}</span>
            </div>
          </td>
          <td style="width: 50%;">
            <div class="sig-role-header"><span>CONSULTANT / LEAD ENGINEER</span><span class="sig-required-tag">REQUIRED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${t.assignedConsultant||"Lead Consultant"}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${k((b=t.response)==null?void 0:b.responseDate)}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${l}</div>
      <div>RFI Ref: ${r}</div>
    </div>
  `;rt(`${r} - Technical RFI`,m)}function _e(t,c={},E={}){var v,O,N,P,b;const l=E.name||"Collection Developments LTD",$=c.name||"Bankside",r=t.marNumber||`MAR-2026-${Math.floor(1e3+Math.random()*9e3)}`,m=t.submittedByName||(typeof t.submittedBy=="string"?t.submittedBy:"QA/QC Materials Lead"),n=((v=t.reviewedBy)==null?void 0:v.name)||((O=t.response)==null?void 0:O.respondedByName)||t.assignedConsultantName||"Materials Consultant",T=((N=t.reviewedBy)==null?void 0:N.date)||((P=t.response)==null?void 0:P.responseDate)||(t.updatedAt?k(t.updatedAt):k(t.createdAt)),h=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${dt(E,c)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">MATERIAL APPROVAL REQUEST (MAR)</div>
          <div class="header-title-project">PROJECT: ${$}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.4 Control of Externally Provided Products & Services</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${r}</span></div>
          <div><strong>Date:</strong> ${k(t.createdAt)}</div>
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
          <td class="grid-value">${m}</td>
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
          ${t.reviewComments||((b=t.response)==null?void 0:b.responseText)||"Submittal is in accordance with project specifications."}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #475569; border-top: 1px solid #f1f5f9; padding-top: 4px;">
          <span>Review Status: <strong>${t.status||"APPROVED"}</strong></span>
          <span>Review Date: <strong>${T}</strong></span>
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
            <div style="font-size: 8px; color: #334155;">Name: <strong>${m}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${k(t.createdAt)}</span>
            </div>
          </td>
          <td style="width: 50%;">
            <div class="sig-role-header"><span>CONSULTANT / MATERIALS ENGINEER</span><span class="sig-required-tag">REQUIRED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${n}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${T}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${l}</div>
      <div>MAR Ref: ${r}</div>
    </div>
  `;rt(`${r} - Material Approval Request`,h)}function ke(t,c={},E={}){var N,P,b,i,u,x;const l=E.name||" ",$=c.name||" ",r=t.sampleNumber||t.sampleId||`CUBE-${Math.floor(1e3+Math.random()*9e3)}`,m=t.target28DayStrengthNmm2||t.day28Required||(t.targetStrength?parseFloat(t.targetStrength):0)||30,n=[],T=[{age:1,title:"1-Day Test",resArray:t.day1Results,testSummary:(N=t.tests)==null?void 0:N.day1,req:t.day1Required,defaultTargetRatio:.2,dateField:t.day1Date},{age:3,title:"3-Day Test",resArray:t.day3Results,testSummary:(P=t.tests)==null?void 0:P.day3,req:t.day3Required,defaultTargetRatio:.45,dateField:t.day3Date},{age:7,title:"7-Day Test",resArray:t.day7Results,testSummary:(b=t.tests)==null?void 0:b.day7,req:t.day7Required,defaultTargetRatio:.7,dateField:t.day7Date},{age:14,title:"14-Day Test",resArray:t.day14Results,testSummary:(i=t.tests)==null?void 0:i.day14,req:t.day14Required,defaultTargetRatio:.85,dateField:t.day14Date},{age:28,title:"28-Day Test",resArray:t.day28Results,testSummary:(u=t.tests)==null?void 0:u.day28,req:t.day28Required,defaultTargetRatio:1,dateField:t.day28Date}];for(const o of T){const s=o.req||Math.round(m*o.defaultTargetRatio*10)/10;if(o.resArray&&o.resArray.length>0){const p=o.resArray[0];n.push({age:o.age,title:o.title,testDate:p.testDate||o.dateField||t.castDate,targetStrength:s,averageStrength:p.averageStrength||0,maximumStrength:p.maximumStrength,minimumStrength:p.minimumStrength,standardDeviation:p.standardDeviation,status:p.status||(p.averageStrength>=s?"PASS":"FAIL"),technician:p.technician||t.preparedBy||"Materials Technician",testingStandard:p.testingStandard||"BS EN 12390-3",cubes:p.cubes||[]})}else if(o.testSummary){const p=o.testSummary,w=p.averageStrengthNmm2??p.compressiveStrengthNmm2??0;n.push({age:o.age,title:o.title,testDate:p.actualTestDate||p.testDate||p.scheduledDate||o.dateField||t.castDate,targetStrength:p.requiredStrengthNmm2||p.targetStrengthNmm2||s,averageStrength:w,maximumStrength:w,minimumStrength:w,standardDeviation:0,status:p.compliance||(w>=s?"PASS":"FAIL"),technician:p.testedBy||p.labTechnician||t.preparedBy||"Materials Technician",testingStandard:"BS EN 12390-3",cubes:(p.cubes||p.individualResults||[]).map((R,L)=>({id:L+1,load:R.failureLoadKn||R.crushingLoadKn||p.crushingLoadKn||"—",strength:R.compressiveStrengthNmm2||w,failureMode:R.typeOfFailure||R.failureMode||"Satisfactory",cubeWeight:R.weightKg||""}))})}}const h=n.find(o=>o.age===28),v=h?h.status==="PASS"||h.averageStrength>=h.targetStrength:null,O=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${dt(E,c)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">CONCRETE COMPRESSIVE STRENGTH TEST CERTIFICATE</div>
          <div class="header-title-project">PROJECT: ${$}</div>
          <div class="header-title-iso">BS EN 12390-3 / ASTM C39 Compressive Strength Quality Verification</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${r}</span></div>
          ${t.inscribedName?`<div><strong>Inscribed Mark:</strong> <span style="font-weight:700; color:#0f172a;">${t.inscribedName}</span></div>`:""}
          <div><strong>Cast Date:</strong> ${t.castDate||k(t.castDate)}</div>
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
          <td class="grid-value" style="width: 32%;"><strong>${t.concreteGrade}</strong> (Target: ${m} MPa)</td>
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
          <td class="grid-value">Start: ${k(t.curingStartDate||t.castDate)} ${t.removedFromTankDate?`• Out: ${k(t.removedFromTankDate)}`:""}</td>
        </tr>
      </table>
    </div>

    <!-- 3.0 Multi-Cube Crushing Results -->
    <div class="pdf-section">
      <div class="section-banner">3.0 LABORATORY COMPRESSION CRUSHING LOG & STRENGTH STATISTICAL EVALUATION</div>
      ${n.length>0?n.map(o=>{const s=o.status==="PASS"||o.averageStrength>=o.targetStrength;return`
        <div style="margin-bottom: 8px; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden;">
          <div style="background: #f8fafc; padding: 4px 8px; font-weight: 700; font-size: 8px; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0;">
            <span>${o.title.toUpperCase()} (Test Date: ${k(o.testDate)}) — Standard: ${o.testingStandard}</span>
            <span style="color: ${s?"#15803d":"#b91c1c"}; font-weight: 800;">${s?"COMPLIANT (PASS)":"NON-COMPLIANT (FAIL)"}</span>
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
              ${o.cubes.length>0?o.cubes.map(p=>`
                <tr>
                  <td style="text-align: center; font-weight: 700; color: #0f172a;">Cube #${p.id}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 700;">${p.load||"—"}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 800; color: ${s?"#15803d":"#b91c1c"};">${p.strength||"—"}</td>
                  <td style="color: #475569; font-size: 7.2px;">${p.failureMode||"Cone Failure (Satisfactory)"}</td>
                  <td style="text-align: right; font-family: monospace; color: #64748b;">${p.cubeWeight||"—"}</td>
                </tr>
              `).join(""):`
                <tr>
                  <td colspan="5" style="text-align: center; color: #64748b; padding: 6px;">Individual load readings recorded directly in laboratory register.</td>
                </tr>
              `}
              <tr style="background: #f1f5f9; font-weight: 700;">
                <td colspan="2" style="font-size: 7.5px;">AVERAGE: <strong style="font-size: 8.5px; color: ${s?"#15803d":"#b91c1c"}; font-family: monospace;">${o.averageStrength} MPa</strong> (Target: ${o.targetStrength} MPa)</td>
                <td colspan="2" style="font-size: 7.2px; color: #475569;">Min: ${o.minimumStrength??o.averageStrength} MPa • Max: ${o.maximumStrength??o.averageStrength} MPa • SD: ${o.standardDeviation??"—"}</td>
                <td style="text-align: right;"><span class="${s?"badge-pass":"badge-fail"}">${s?"PASS":"FAIL"}</span></td>
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
              <span>Date: ${k(t.preparedByDate||((x=n[0])==null?void 0:x.testDate)||t.castDate)}</span>
            </div>
          </td>
          <td style="width: 33.33%;">
            <div class="sig-role-header"><span>CONSULTANT ENGINEER</span><span class="sig-optional-tag">OPTIONAL</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${t.reviewedBy||t.approvedBy||""}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 10px;">
              <span>Sign: ___________________</span>
              <span>Date: ${k(t.reviewedByDate||t.approvedByDate||t.castDate)}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${l}</div>
      <div>Certificate Ref: ${r}</div>
    </div>
  `;rt(`${r} - Cube Test Certificate`,O)}function Me(t,c={},E={},l){var Ot,Dt,Pt,Lt,_t,a;const r=((l==null?void 0:l.orientation)||t.printOrientation||"portrait")==="portrait",m=(l==null?void 0:l.revisionNumber)||t.revisionNumber||(t==null?void 0:t.revision),n=m&&String(m).trim().length>0?String(m).trim():"Rev 1.0 (Final Submission)",T=E.name||"Collection Developments LTD",h=E.legalName||(E==null?void 0:E.companyName)||"Collection Developments Limited",v=E.logoUrl||E.logo||(E==null?void 0:E.logoBase64)||t.logoBase64||"",O=c.name||t.projectName||"BANKSIDE",N=t.reportNumber||`WQR-2026-${Math.floor(1e3+Math.random()*9e3)}`,P=(l==null?void 0:l.includeNcrs)!==void 0?l.includeNcrs:(l==null?void 0:l.includeNcrsAndComments)!==void 0?l.includeNcrsAndComments:t.includeNcrs!==void 0?t.includeNcrs:t.includeNcrsAndComments!==!1,b=(l==null?void 0:l.includeSiteComments)!==void 0?l.includeSiteComments:(l==null?void 0:l.includeNcrsAndComments)!==void 0?l.includeNcrsAndComments:t.includeSiteComments!==void 0?t.includeSiteComments:t.includeNcrsAndComments!==!1,i=(l==null?void 0:l.includeSiteInstructions)!==void 0?l.includeSiteInstructions:t.includeSiteInstructions!==!1;function u(e){if(!e)return"";if(typeof e=="string"){const g=e.trim();if(/^\d{4}-\d{2}-\d{2}$/.test(g))return g;const f=new Date(g);return isNaN(f.getTime())?g:f.toISOString().split("T")[0]}return typeof e=="number"?new Date(e).toISOString().split("T")[0]:e instanceof Date&&!isNaN(e.getTime())?e.toISOString().split("T")[0]:""}function x(){try{const e=se.getState().currentUser;return(e==null?void 0:e.email)||""}catch{return""}}const o=t.startDate||t.weekStart||"",s=t.endDate||t.weekEnd||"",p=u(o)||"—",w=u(s)||"—",R=w!=="—"?w:u(t.reportDate||t.createdAt)||u(new Date),L=typeof t.preparedBy=="object"&&t.preparedBy?t.preparedBy:{name:typeof t.preparedBy=="string"?t.preparedBy:"",designation:"QA/QC ENGINEER",role:"QA/QC ENGINEER"},U=L.name||((Ot=se.getState().currentUser)==null?void 0:Ot.fullName)||((Dt=se.getState().currentUser)==null?void 0:Dt.displayName)||"Authorized QA/QC Engineer",F=L.designation||L.role||"QA/QC ENGINEER",J=L.email||x()||"—";L.signed;const X=L.signatureUrl||"",lt=(t.cubeTests&&t.cubeTests.length>0?t.cubeTests:t.filteredCubeTests)||[],q=t.quantitySummary||[],B=t.mepClearance||[],xt=(t.materialDeliveries&&t.materialDeliveries.length>0?t.materialDeliveries:t.filteredMaterialDeliveries)||[],ht=(t.ncrRemediationLog&&t.ncrRemediationLog.length>0?t.ncrRemediationLog:t.filteredNcrs)||t.ncr||[],ct=(t.siteComments&&t.siteComments.length>0?t.siteComments:t.filteredSiteComments)||t.filteredFindings||[],at=(t.siteInstructions&&t.siteInstructions.length>0?t.siteInstructions:t.filteredSiteInstructions)||[],Tt=t.projectCoverImageUrl||t.coverImageUrl||t.coverImageBase64||c.coverImageUrl||c.imageUrl||(c==null?void 0:c.image)||(t==null?void 0:t.projectImage)||"",St=(t.pictorialUrls||[]).filter(e=>{const g=typeof e=="string"?e:e==null?void 0:e.url;return!!(g&&typeof g=="string"&&g.trim().length>0)}),Mt=t.beamLayoutImg,zt=t.columnLayoutImg,Ut=t.slabImg,pt=t.structuralElements||[],Ft=pt.filter(e=>(e.elementType||e.type||e.element||"").toLowerCase().includes("column")),Bt=pt.filter(e=>(e.elementType||e.type||e.element||"").toLowerCase().includes("beam")),Gt=pt.filter(e=>(e.elementType||e.type||e.element||"").toLowerCase().includes("slab")),Z=(t.selectedLevel||t.selectedLevelName||"—").toUpperCase();let gt=0,mt=0;q.length>0?q.forEach(e=>{const g=parseFloat(String(e.calculatedVolume??e.plannedVolume??e.scope??0))||0,f=parseFloat(String(e.achievedVolume??e.actualVolume??0))||0;gt+=g,mt+=f}):pt.length>0&&pt.forEach(e=>{const g=parseFloat(String(e.calculatedVolume||e.volume||0))||0,f=parseFloat(String(e.achievedVolume??e.completedVolume??0))||0;gt+=g,mt+=f}),gt===0&&t.totalVolumeCalculated&&(gt=Number(t.totalVolumeCalculated)||0),mt===0&&t.totalVolumeAchieved&&(mt=Number(t.totalVolumeAchieved)||0);const Vt=gt>0?Math.round(mt/gt*100):0,ut=(((Pt=t.ncrStats)==null?void 0:Pt.openTotal)??0)+ct.filter(e=>{const g=String(e.status||"").toLowerCase();return g.includes("non")||g.includes("open")||g.includes("progress")||g.includes("pending")}).length,Ht=t.overallQualityCompliance!==void 0&&t.overallQualityCompliance!==null?Number(t.overallQualityCompliance):((Lt=t.metrics)==null?void 0:Lt.inspectionPassRate)!==void 0&&((_t=t.metrics)==null?void 0:_t.inspectionPassRate)!==null?Number(t.metrics.inspectionPassRate):100,Qt=(l==null?void 0:l.templateId)||t.templateId||"classic-executive",y=ve(Qt),jt=()=>`
    <div style="display: flex; align-items: center; gap: 6px;">
      ${v?`<img src="${v}" style="max-height: 22px; max-width: 80px; object-fit: contain;" alt="Logo" />`:`
          <div style="display: flex; gap: 2px; align-items: flex-end; height: 16px;">
            <span style="width: 3.5px; height: 9px; background: ${y.accentColor}; border-radius: 1px;"></span>
            <span style="width: 3.5px; height: 16px; background: ${y.accentColor}; border-radius: 1px;"></span>
            <span style="width: 3.5px; height: 12px; background: ${y.accentColor}; border-radius: 1px;"></span>
          </div>
          <span style="font-size: 8.5px; font-weight: 900; color: #0f172a; letter-spacing: 0.8px; text-transform: uppercase;">COLLECTION</span>
        `}
    </div>
  `,Q=e=>`
    <div class="pdf-header">
      <div class="pdf-header-top">
        <div style="display: flex; align-items: center; gap: 8px;">
          ${jt()}
          <div style="font-size: 8.5px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 6px; letter-spacing: 0.2px;">
            <span>${R}</span>
            <span style="color: #cbd5e1;">|</span>
            <span style="color: ${y.accentColor}; font-weight: 800;">QA/QC SURVEILLANCE</span>
            <span style="color: #cbd5e1;">|</span>
            <span style="font-weight: 800; color: #0f172a; text-transform: uppercase;">${e}</span>
          </div>
        </div>
        <div style="font-size: 8.5px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase;">
          <span style="color: #0f172a;">${O.toUpperCase()}</span> &nbsp;|&nbsp; <span style="color: #94a3b8;">CONFIDENTIAL</span>
        </div>
      </div>
      <div class="pdf-header-rule" style="background: ${y.ruleColor}; height: 2px;"></div>
    </div>
  `,j=e=>`
    <div class="pdf-footer" style="border-top: 1px solid ${y.cardBorder};">
      <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">
        Compiled By: <strong style="color: #475569;">${U} (${F})</strong> &nbsp;|&nbsp; ISO 9001:2015 Quality Management System
      </div>
      <div class="pdf-slide-badge" style="background: ${y.badgeBg}; color: ${y.badgeTextColor}; border: 1px solid ${y.badgeBorder}; border-radius: ${y.cardRadius};">
        SLIDE ${String(e).padStart(2,"0")}
      </div>
    </div>
  `,C=[];r?C.push(`
      <div class="pdf-sheet" style="padding: 0; display: flex; flex-direction: column; height: 297mm; overflow: hidden; position: relative; background: #ffffff;">
        <!-- Top Hero Column -->
        <div style="padding: 14mm 16mm 10mm 16mm; background: #ffffff; border-bottom: 3px solid ${y.accentColor};">
          <!-- Company Brand Header -->
          <div style="margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              ${v?`<img src="${v}" style="max-height: 44px; max-width: 150px; object-fit: contain;" alt="${T}" />`:`
                <div style="display: flex; gap: 2.5px; align-items: flex-end; height: 20px;">
                  <span style="width: 4px; height: 11px; background: ${y.accentColor}; border-radius: 1px;"></span>
                  <span style="width: 4px; height: 20px; background: ${y.accentColor}; border-radius: 1px;"></span>
                  <span style="width: 4px; height: 15px; background: ${y.accentColor}; border-radius: 1px;"></span>
                </div>
              `}
              <div style="font-size: 13px; font-weight: 900; color: #0f172a; letter-spacing: 1.2px; text-transform: uppercase;">
                ${T.toUpperCase()}
              </div>
            </div>
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; background: #f8fafc; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 4px;">
              ISO 9001:2015 AUDITED
            </div>
          </div>

          <!-- Project Title & Divider -->
          <div style="margin-bottom: 8px;">
            <div style="font-size: 28px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; text-transform: uppercase; line-height: 1.1;">
              ${O.toUpperCase()}
            </div>
          </div>

          <!-- Report Title -->
          <div style="font-size: 16px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.2px; margin-bottom: 10px;">
            ${t.title||"QA/QC WEEKLY SURVEILLANCE REPORT"}
          </div>

          <!-- Surveillance Level Tag & Date Range Pill -->
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <div style="display: inline-block; background: ${y.accentLight}; color: ${y.accentDark}; font-size: 9px; font-weight: 800; padding: 4px 10px; border-radius: ${y.cardRadius}; border: 1px solid ${y.cardBorder}; text-transform: uppercase;">
              SURVEILLANCE: ${Z}
            </div>
            <div style="display: inline-block; background: #FFFFFF; border: 1.5px solid ${y.accentColor}; color: ${y.accentDark}; font-size: 9px; font-weight: 800; padding: 4px 14px; border-radius: 9999px; letter-spacing: 0.3px; text-transform: uppercase;">
              ${p} &nbsp;TO&nbsp; ${w}
            </div>
          </div>
        </div>

        <!-- Center Full-Bleed Cover Image -->
        <div style="flex: 1; min-height: 120mm; max-height: 145mm; width: 100%; background: #0f172a; overflow: hidden; position: relative;">
          ${Tt?`<img src="${Tt}" style="width: 100%; height: 100%; object-fit: cover;" alt="${O}" />`:`
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
              <div style="text-align: center; color: #ffffff; padding: 30px;">
                <div style="font-size: 32px; font-weight: 900; color: #c28b5e;">${O.toUpperCase()}</div>
                <div style="font-size: 11px; color: #94a3b8; font-weight: 700; margin-top: 6px;">OFFICIAL QA/QC SURVEILLANCE DOSSIER</div>
              </div>
            </div>
          `}
        </div>

        <!-- Bottom Compiler Card & Reference Info -->
        <div style="padding: 10mm 16mm 12mm 16mm; background: #ffffff; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
          <div style="border-left: 4px solid ${y.accentColor}; padding-left: 12px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
              AUTHORIZED COMPILER &amp; QA/QC OFFICER
            </div>
            <div style="font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 2px;">
              ${U}
            </div>
            <div style="font-size: 8.5px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 1px;">
              ${F} &bull; ${J}
            </div>
          </div>

          <div style="text-align: right;">
            <div style="font-size: 7px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
              DOCUMENT REFERENCE
            </div>
            <div style="font-size: 11px; font-weight: 900; font-family: monospace; color: #0f172a; margin-top: 1px;">
              ${N}
            </div>
            <div style="font-size: 8px; color: #059669; font-weight: 800; margin-top: 2px;">
              ${n}
            </div>
          </div>
        </div>
      </div>
    `):C.push(`
      <div class="pdf-sheet" style="padding: 0; display: flex; flex-direction: row; height: 210mm; overflow: hidden; position: relative;">
        <!-- Left Hero Column (~46% width) -->
        <div style="width: 46%; padding: 24mm 14mm 16mm 16mm; display: flex; flex-direction: column; justify-content: space-between; background: #ffffff; position: relative; border-right: 3px solid ${y.accentColor};">
          <div>
            <!-- Company Brand Header -->
            <div style="margin-bottom: 22px;">
              <div style="display: flex; align-items: flex-end; gap: 2px; margin-bottom: 4px;">
                ${v?`<img src="${v}" style="max-height: 120px; max-width: 190px; object-fit: contain;" alt="${T}" />`:`
                  <div style="display: flex; gap: 3px; align-items: flex-end; height: 26px;">
                    <span style="width: 5px; height: 14px; background: ${y.accentColor}; border-radius: 1px;"></span>
                    <span style="width: 5px; height: 24px; background: ${y.accentColor}; border-radius: 1px;"></span>
                    <span style="width: 5px; height: 18px; background: ${y.accentColor}; border-radius: 1px;"></span>
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
                ${O.toUpperCase()}
              </div>
              <div style="width: 100%; height: 2px; background: ${y.accentColor}; margin-top: 14px;"></div>
            </div>

            <!-- Report Title -->
            <div style="font-size: 19px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.3px; margin-bottom: 12px;">
              ${t.title||"QA/QC WEEKLY REPORT"}
            </div>

            <!-- Surveillance Level Tag -->
            <div style="display: inline-block; background: ${y.accentLight}; color: ${y.accentDark}; font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: ${y.cardRadius}; border: 1px solid ${y.cardBorder}; text-transform: uppercase; margin-bottom: 12px;">
              SURVEILLANCE: ${Z}
            </div>
            <div></div>

            <!-- Date Range Pill -->
            <div style="display: inline-block; background: #FFFFFF; border: 1.5px solid ${y.accentColor}; color: ${y.accentDark}; font-size: 10.5px; font-weight: 800; padding: 6px 22px; border-radius: 9999px; letter-spacing: 0.5px; text-transform: uppercase;">
              ${p} &nbsp;TO&nbsp; ${w}
            </div>
          </div>

          <!-- Compiler Card (Bottom Left) -->
          <div style="background: #ffffff; border: 1px solid ${y.cardBorder}; border-left: 4px solid ${y.accentColor}; border-radius: ${y.cardRadius}; padding: 12px 16px; margin-top: auto;">
            <div style="font-size: 7.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
              AUTHORIZED COMPILER &amp; QA/QC OFFICER
            </div>
            <div style="font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 3px;">
              ${U}
            </div>
            <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 1px;">
              ${F}
            </div>
          </div>
        </div>

        <!-- Right Column (~54% width) Full-Bleed Cover Image -->
        <div style="width: 54%; height: 100%; background: #0f172a; overflow: hidden; position: relative;">
          ${Tt?`<img src="${Tt}" style="width: 100%; height: 100%; object-fit: cover;" alt="${O}" />`:`
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
              <div style="text-align: center; color: #ffffff; padding: 30px;">
                <div style="font-size: 36px; font-weight: 900; color: #c28b5e;">${O.toUpperCase()}</div>
                <div style="font-size: 12px; color: #94a3b8; font-weight: 700; margin-top: 8px;">OFFICIAL QA/QC SURVEILLANCE DOSSIER</div>
              </div>
            </div>
          `}
        </div>
      </div>
    `),C.push(`
    <div class="pdf-sheet">
      <div>
        ${Q("EXECUTIVE SUMMARY: OPERATIONAL OVERVIEW")}
        
        <!-- 4 Top Cards Grid -->
        <div style="display: grid; grid-template-columns: ${r?"repeat(2, 1fr)":"repeat(4, 1fr)"}; gap: ${r?"10px":"14px"}; margin-bottom: ${r?"12px":"18px"};">
          <!-- Card 1: Total Scope Volume -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #0f172a; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL SCOPE VOLUME</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${gt.toLocaleString(void 0,{maximumFractionDigits:1})} m³</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">Design Volume Target</div>
          </div>

          <!-- Card 2: Achieved Volume -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #0284c7; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">ACHIEVED VOLUME</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${mt.toLocaleString(void 0,{maximumFractionDigits:1})} m³</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">${Vt}% Cumulative</div>
          </div>

          <!-- Card 3: Quality Compliance -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #16a34a; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">QUALITY COMPLIANCE</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${Ht}%</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">Field Surveillance Benchmark</div>
          </div>

          <!-- Card 4: Open Findings / NCRs -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #dc2626; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">OPEN FINDINGS / NCRS</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${ut}</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">Active Remediation Items</div>
          </div>
        </div>

        <!-- Large Content Card -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 22px 26px; min-height: ${r?"420px":"320px"}; position: relative;">
          <div style="border-left: 6px solid #0f172a; padding-left: 14px; margin-bottom: 16px;">
            <div style="font-size: 12px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
              EXECUTIVE QA/QC SYNOPSIS &amp; MANAGEMENT EVALUATION
            </div>
          </div>
          <div style="width: 100%; height: 1px; background: #f1f5f9; margin-bottom: 16px;"></div>
          <div style="font-size: 10.5px; line-height: 1.7; color: #334155; font-weight: 500;">
            ${(a=t.synopsis||t.executiveSummary)!=null&&a.trim()?t.synopsis||t.executiveSummary:'<span style="color: #94a3b8; font-style: italic;">No executive synopsis provided for this reporting period.</span>'}
          </div>
        </div>
      </div>
      ${j(C.length+1)}
    </div>
  `);const It=e=>{const g=e&&e.trim().length>0?e.trim():"";return g?g.split(/\n\s*\n|\n/).map(A=>A.trim()).filter(Boolean).map(A=>{if(A.includes(":")){const I=A.split(":"),_=I[0].trim(),d=I.slice(1).join(":").trim();return`
            <div style="margin-bottom: 12px;">
              <strong style="color: #0f172a; font-weight: 800;">${_}:</strong> ${d}
            </div>
          `}return`<div style="margin-bottom: 10px;">${A}</div>`}).join(""):""};C.push(`
    <div class="pdf-sheet">
      <div>
        ${Q("EXECUTIVE SUMMARY: STRATEGIC INSIGHTS")}
        
        <!-- 3 Columns / Cards Layout -->
        <div style="display: flex; flex-direction: ${r?"column":"row"}; gap: 12px; min-height: ${r?"auto":"420px"};">
          <!-- Column 1: Highlights -->
          <div style="display: flex; flex-direction: column; flex: 1;">
            <div style="background: #16a34a; color: #ffffff; text-align: center; padding: 8px 12px; font-weight: 800; font-size: 10px; border-radius: 4px 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
              KEY PROJECT HIGHLIGHTS
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 12px 14px; font-size: 8.5px; line-height: 1.5; color: #334155; background: #ffffff;">
              ${It(t.highlights)}
            </div>
          </div>

          <!-- Column 2: Risks & Concerns -->
          <div style="display: flex; flex-direction: column; flex: 1;">
            <div style="background: #d97706; color: #ffffff; text-align: center; padding: 8px 12px; font-weight: 800; font-size: 10px; border-radius: 4px 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
              CRITICAL RISKS &amp; OPEN CONCERNS
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 12px 14px; font-size: 8.5px; line-height: 1.5; color: #334155; background: #ffffff;">
              ${It(t.concerns)}
            </div>
          </div>

          <!-- Column 3: Look-Ahead Plan -->
          <div style="display: flex; flex-direction: column; flex: 1;">
            <div style="background: #4f46e5; color: #ffffff; text-align: center; padding: 8px 12px; font-weight: 800; font-size: 10px; border-radius: 4px 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
              LOOK-AHEAD PLAN &amp; ACTION TARGETS
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 12px 14px; font-size: 8.5px; line-height: 1.5; color: #334155; background: #ffffff;">
              ${It(t.nextWeekPlan)}
            </div>
          </div>
        </div>
      </div>
      ${j(C.length+1)}
    </div>
  `);const At=lt;if(At.length===0)C.push(`
      <div class="pdf-sheet">
        <div>
          ${Q("CONCRETE COMPRESSIVE STRENGTH TEST MATRIX")}
          
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
        ${j(C.length+1)}
      </div>
    `);else{const e=r?20:14,g=Math.ceil(At.length/e);for(let f=0;f<g;f++){const A=At.slice(f*e,(f+1)*e),I=g>1?`CONCRETE COMPRESSIVE STRENGTH TEST MATRIX (PART ${f+1} OF ${g})`:"CONCRETE COMPRESSIVE STRENGTH TEST MATRIX",_=A.map((d,M)=>{var K,V,nt,st;const z=f*e+M+1,G=d.strength7Days||((V=(K=d.day7Results)==null?void 0:K[0])!=null&&V.averageStrength?`${d.day7Results[0].averageStrength} N/mm²`:"—"),D=d.strength28Days||((st=(nt=d.day28Results)==null?void 0:nt[0])!=null&&st.averageStrength?`${d.day28Results[0].averageStrength} N/mm²`:"—"),S=String(d.status7Days||(G!=="—"?"PASS":"pending")).toLowerCase(),W=String(d.status28Days||(D!=="—"?"PASS":"pending")).toLowerCase();return`
            <tr>
              <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(z).padStart(2,"0")}</td>
              <td style="font-family: monospace; font-weight: 600;">${u(d.dateCast||d.castDate||d.date)||"—"}</td>
              <td style="font-weight: 800; color: #0f172a; text-transform: uppercase;">${d.elementLevel||d.element||d.inscribedName||"Structural Element"}</td>
              <td style="font-family: monospace; font-weight: 700; text-align: center;">${G}</td>
              <td style="text-align: center; font-weight: 800; color: ${S.includes("pass")?"#16a34a":"#d97706"};">${S.includes("pass")?"PASS":S.toUpperCase()}</td>
              <td style="font-family: monospace; font-weight: 700; text-align: center;">${D}</td>
              <td style="text-align: center; font-weight: 800; color: ${W.includes("pass")?"#16a34a":"#d97706"};">${W.includes("pass")?"PASS":W.toUpperCase()}</td>
            </tr>
          `}).join("");C.push(`
        <div class="pdf-sheet">
          <div>
            ${Q(I)}
            
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
                ${_}
              </tbody>
            </table>
          </div>
          ${j(C.length+1)}
        </div>
      `)}}const Rt=["#3b82f6","#10b981","#f97316","#8b5cf6","#06b6d4","#ec4899","#f59e0b"],Y=[];if(q.length>0)q.forEach((e,g)=>{const f=parseFloat(String(e.calculatedVolume??e.plannedVolume??e.scope??0))||0,A=parseFloat(String(e.achievedVolume??e.actualVolume??0))||0;let I=f>0?Math.round(A/f*100):parseInt(String(e.completion||0));I=Math.min(100,Math.max(0,I)),Y.push({name:String(e.element||e.structuralElement||`Element ${g+1}`).toUpperCase().trim(),scope:f,completion:I,color:Rt[g%Rt.length]})});else if(pt.length>0){const e={};pt.forEach(g=>{const f=(g.elementType||g.type||g.element||"OTHER").toUpperCase().trim(),A=parseFloat(String(g.calculatedVolume||g.volume||0))||0,I=parseFloat(String(g.achievedVolume??g.completedVolume??0))||0;e[f]||(e[f]={scope:0,achieved:0}),e[f].scope+=A,e[f].achieved+=I}),Object.entries(e).forEach(([g,f],A)=>{const I=f.scope>0?Math.min(100,Math.max(0,Math.round(f.achieved/f.scope*100))):0;Y.push({name:g,scope:Math.round(f.scope*100)/100,completion:I,color:Rt[A%Rt.length]})})}const Ct=Y.reduce((e,g)=>e+g.scope,0),Yt=Y.length>0?Math.round(Y.reduce((e,g)=>e+g.completion,0)/Y.length):0,Nt=(()=>{if(Y.length===0||Ct===0)return{svg:`
          <svg width="150" height="150" viewBox="0 0 150 150" style="display: block; margin: 0 auto;">
            <circle cx="75" cy="75" r="62" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3 3" />
            <text x="75" y="78" text-anchor="middle" font-size="8.5" fill="#94a3b8" font-family="-apple-system, sans-serif" font-weight="600">No Volume Data</text>
          </svg>
        `,legend:`
          <div style="margin-top: 10px; font-size: 7.5px; color: #94a3b8; text-align: center; font-style: italic;">
            No quantity distribution recorded
          </div>
        `};const e=150,g=75,f=75,A=62;let I=-Math.PI/2;const _=[];Y.forEach(z=>{const D=(Ct>0?z.scope/Ct:1/(Y.length||1))*2*Math.PI,S=I+D,W=g+A*Math.cos(I),K=f+A*Math.sin(I),V=g+A*Math.cos(S),nt=f+A*Math.sin(S),st=D>Math.PI?1:0,H=`M ${g} ${f} L ${W.toFixed(2)} ${K.toFixed(2)} A ${A} ${A} 0 ${st} 1 ${V.toFixed(2)} ${nt.toFixed(2)} Z`;_.push(`<path d="${H}" fill="${z.color}" stroke="#ffffff" stroke-width="1.5" />`),I=S});const d=`
      <svg width="${e}" height="${e}" viewBox="0 0 ${e} ${e}" style="display: block; margin: 0 auto;">
        ${_.join("")}
      </svg>
    `,M=`
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; margin-top: 10px; font-size: 7.5px; font-weight: 800;">
        ${Y.map(z=>`
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="display: inline-block; width: 8px; height: 8px; background: ${z.color}; border-radius: 1.5px;"></span>
            <span style="color: #334155; text-transform: uppercase;">${z.name}</span>
          </div>
        `).join("")}
      </div>
    `;return{svg:d,legend:M}})(),qt=()=>{if(Y.length===0)return`
        <div style="margin-top: 10px; background: #fafbfd; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; color: #94a3b8; font-size: 8.5px; font-style: italic;">
          No element quantity comparison metrics logged for this level.
        </div>
      `;const e=720,g=100,f=78,A=Math.max(...Y.map(M=>M.scope),10),I=e/(Y.length||1),_=Math.min(22,I*.32),d=Y.map((M,z)=>{const G=z*I+I/2,D=A>0?M.scope/A*58:0,S=M.scope*M.completion/100,W=A>0?S/A*58:0,K=G-_-2,V=f-D,nt=G+2,st=f-W;return`
          <!-- Scope Bar (Blue) -->
          <rect x="${K.toFixed(1)}" y="${V.toFixed(1)}" width="${_.toFixed(1)}" height="${Math.max(D,1).toFixed(1)}" rx="1.5" fill="#3b82f6" />
          <!-- Achieved Bar (Orange) -->
          <rect x="${nt.toFixed(1)}" y="${st.toFixed(1)}" width="${_.toFixed(1)}" height="${Math.max(W,1).toFixed(1)}" rx="1.5" fill="#f97316" />
          <!-- X-Axis Label -->
          <text x="${G.toFixed(1)}" y="${(f+14).toFixed(1)}" text-anchor="middle" font-size="8" font-weight="700" fill="#475569" font-family="-apple-system, sans-serif" letter-spacing="0.3">${M.name}</text>
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
        <svg width="100%" height="${g}" viewBox="0 0 ${e} ${g}" style="display: block; overflow: visible;">
          <line x1="20" y1="${f}" x2="${e-20}" y2="${f}" stroke="#cbd5e1" stroke-width="1.2" />
          ${d}
        </svg>
      </div>
    `},Wt=Y.length>0?Y.map(e=>`
            <tr>
              <td style="font-weight: 800; color: #0f172a; text-transform: uppercase;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="display: inline-block; width: 3px; height: 13px; background: ${e.color}; border-radius: 1px; shrink: 0;"></span>
                  <span>${e.name}</span>
                </div>
              </td>
              <td style="font-family: monospace; font-weight: 700; color: #1e293b;">${e.scope.toLocaleString(void 0,{maximumFractionDigits:1})}</td>
              <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${e.completion}%</td>
            </tr>
          `).join(""):`
        <tr>
          <td colspan="3" style="text-align: center; color: #64748b; padding: 18px; font-weight: 600;">
            No quantity data recorded for this level.
          </td>
        </tr>
      `;C.push(`
    <div class="pdf-sheet">
      <div>
        ${Q(`${Z} — QUANTITY SUMMARY`)}
        
        <!-- Top Half: Table and Pie Chart -->
        <div style="display: flex; gap: 16px; align-items: stretch; margin-top: 8px;">
          <!-- Left Table (50% width) -->
          <div style="flex: 1.1;">
            <div style="font-size: 10px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 6px; letter-spacing: -0.2px;">
              ${Z} FLOOR CONCRETE CHART
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
                ${Wt}
                ${Y.length>0?`
                  <tr style="background: #f8fafc; font-weight: 900; border-top: 2px solid #cbd5e1;">
                    <td style="font-size: 8.5px; color: #0f172a; text-transform: uppercase; font-weight: 900;">TOTAL</td>
                    <td style="font-family: monospace; font-size: 9px; color: #0f172a; font-weight: 900;">${Ct.toLocaleString(void 0,{maximumFractionDigits:1})}</td>
                    <td style="font-family: monospace; font-size: 9px; color: #0f172a; font-weight: 900;">${Yt}%</td>
                  </tr>
                `:""}
              </tbody>
            </table>
          </div>

          <!-- Right Pie Chart Card (50% width) -->
          <div style="flex: 0.9; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; display: flex; flex-direction: column; justify-content: space-between;">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
              ${Nt.svg}
              ${Nt.legend}
            </div>
            <div style="text-align: center; font-size: 8px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-top: 6px; letter-spacing: 0.5px;">
              ${Z} FLOOR CONCRETE CHART
            </div>
          </div>
        </div>

        <!-- Bottom Half: Grouped Vertical Bar Chart -->
        ${qt()}
      </div>
      ${j(C.length+1)}
    </div>
  `);function $t(e,g,f,A,I,_=!0){if(_&&f.length>0){const d=r?32:26,M=Math.ceil(f.length/d);let z=0,G=0;f.forEach(D=>{const S=parseFloat(String(D.calculatedVolume||D.volume||0))||0,W=parseFloat(String(D.achievedVolume??D.completedVolume??0))||0;z+=S,G+=W});for(let D=0;D<M;D++){const S=f.slice(D*d,(D+1)*d),W=D===0,K=D===M-1,V=W?`${Z} — ${g.toUpperCase()} ELEMENTS STATUS`:`${Z} — ${e.toUpperCase()} STATUS (CONT'D)`,nt=S.map(H=>{const bt=parseFloat(String(H.calculatedVolume||H.volume||0))||0,vt=parseFloat(String(H.achievedVolume??H.completedVolume??0))||0;let yt=bt>0?Math.round(vt/bt*100):Number(H.completionPercentage||H.completion||0);yt=Math.min(100,Math.max(0,yt));const kt=(H.status||H.qaStatus||H.inspectionStatus||"PENDING").toString().trim(),tt=kt.toUpperCase().replace(/\s+/g,"_"),ie=kt.replace(/_/g," ").toUpperCase();let et="#f8fafc",it="#475569",ft="#cbd5e1",ot=yt>0?"#3b82f6":"#cbd5e1";tt.includes("APPROV")||tt==="COMPLETED"||tt==="PASS"?(et="#ecfdf5",it="#059669",ft="#a7f3d0",ot="#16a34a"):tt==="POURED"||tt.includes("CAST")?(et="#ecfeff",it="#0891b2",ft="#a5f3fc",ot="#06b6d4"):tt.includes("READY")?(et="#e0e7ff",it="#4338ca",ft="#c7d2fe",ot="#6366f1"):tt.includes("INSPECT")?(et="#f5f3ff",it="#7c3aed",ft="#ddd6fe",ot="#8b5cf6"):tt.includes("PROGRESS")?(et="#eff6ff",it="#2563eb",ft="#bfdbfe",ot="#3b82f6"):tt.includes("REJECT")||tt.includes("FAIL")||tt.includes("NCR")?(et="#fef2f2",it="#dc2626",ft="#fecaca",ot="#ef4444"):(et="#f8fafc",it="#64748b",ft="#e2e8f0",ot=yt>0?"#3b82f6":"#cbd5e1");const Xt=(H.elementName||H.name||H.element||H.id||"—").toUpperCase(),ae=H.gridLocation||H.grid||H.location||"—";return`
              <tr>
                <td style="font-weight: 800; color: #0f172a;">${Xt}</td>
                <td style="font-family: monospace; color: #475569;">${ae}</td>
                <td style="font-family: monospace; font-weight: 600;">${bt.toFixed(2)}</td>
                <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${vt.toFixed(2)}</td>
                <td>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                    <div style="flex: 1; height: 7px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
                      <div style="width: ${yt}%; height: 100%; background: ${ot}; border-radius: 999px;"></div>
                    </div>
                    <span style="font-size: 7px; font-weight: 800; font-family: monospace; min-width: 24px; text-align: right;">${yt}%</span>
                    <span style="background: ${et}; color: ${it}; border: 1px solid ${ft}; border-radius: 4px; padding: 1.5px 7px; font-weight: 800; font-size: 7px; text-transform: uppercase; white-space: nowrap; display: inline-block;">${ie}</span>
                  </div>
                </td>
              </tr>
            `}).join(""),st=z>0?Math.round(G/z*100):0;C.push(`
          <div class="pdf-sheet">
            <div>
              ${Q(V)}
              
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
                  ${nt}
                  ${K?`
                    <tr style="background: #f1f5f9; font-weight: 900; border-top: 1.5px solid #cbd5e1;">
                      <td colspan="2" style="font-size: 7.5px; color: #0f172a; text-transform: uppercase;">
                        TOTAL ${e.toUpperCase()}
                      </td>
                      <td style="font-family: monospace; font-size: 7.5px;">${z.toFixed(2)}</td>
                      <td style="font-family: monospace; font-size: 7.5px; color: #0f172a;">${G.toFixed(2)}</td>
                      <td style="font-size: 7.5px; color: #0f172a; font-weight: 900;">
                        ${st}% COMPLETION
                      </td>
                    </tr>
                  `:""}
                </tbody>
              </table>
            </div>
            ${j(C.length+1)}
          </div>
        `)}}A&&typeof A=="string"&&A.trim().length>0&&C.push(`
        <div class="pdf-sheet">
          <div>
            ${Q(I||`${e.toUpperCase()} LAYOUT &amp; INSPECTION`)}
            
            <div style="height: ${r?"230mm":"154mm"}; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; position: relative; margin-top: 6px;">
              <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 6px; overflow: hidden; background: #ffffff;">
                <img src="${A}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="${I}" />
              </div>

              <!-- Integrated Spatial Blueprint Legend -->
              <div style="background: #f8fafc; border-top: 1.5px solid #e2e8f0; padding: 6px 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="display: inline-block; background: #0284c7; color: #ffffff; font-size: 7.5px; font-weight: 900; padding: 2px 7px; border-radius: 3px; letter-spacing: 0.5px; text-transform: uppercase;">
                    SPATIAL LEGEND
                  </span>
                  <span style="font-size: 7.5px; font-weight: 700; color: #475569; text-transform: uppercase;">
                    ${e.toUpperCase()} SURVEILLANCE KEY:
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
                  ${I||`${e.toUpperCase()} LAYOUT`} &nbsp;|&nbsp; VERIFIED AS-BUILT SURVEILLANCE OVERLAY
                </span>
                <span style="color: #4ade80; font-weight: 800;">&#10003; QC CLEARANCE COMPLETE</span>
              </div>
            </div>
          </div>
          ${j(C.length+1)}
        </div>
      `)}if($t("Columns","Column",Ft,zt,"COLUMNS LAYOUT & CASTING INSPECTION"),$t("Beams","Beam",Bt,Mt,"BEAMS LAYOUT & REINFORCEMENT INSPECTION"),$t("Slabs","Slab",Gt,Ut,"SLABS LAYOUT & CONCRETING INSPECTION",!1),B.length===0)C.push(`
      <div class="pdf-sheet">
        <div>
          ${Q("MEP QA/QC CLEARANCE STATUS — PRE-CASTING")}
          
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
        ${j(C.length+1)}
      </div>
    `);else{const e=r?20:14,g=Math.ceil(B.length/e);for(let f=0;f<g;f++){const A=B.slice(f*e,(f+1)*e),I=g>1?`MEP QA/QC CLEARANCE STATUS — PRE-CASTING (PART ${f+1} OF ${g})`:"MEP QA/QC CLEARANCE STATUS — PRE-CASTING",_=A.map((d,M)=>{const z=f*e+M+1;return`
            <tr>
              <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(z).padStart(2,"0")}</td>
              <td style="font-weight: 800; color: #0f172a;">${d.service||d.system||d.elementService||"—"}</td>
              <td>${d.subcontractor||d.trade||"—"}</td>
              <td style="font-family: monospace; font-weight: 700; text-align: center;">${d.completionPct!==void 0?d.completionPct:0}%</td>
              <td style="text-align: center;"><span class="badge-approved">${d.status||"CLEARED"}</span></td>
              <td style="font-size: 7.5px; color: #475569;">${d.remarks||"—"}</td>
            </tr>
          `}).join("");C.push(`
        <div class="pdf-sheet">
          <div>
            ${Q(I)}
            
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
                ${_}
              </tbody>
            </table>
          </div>
          ${j(C.length+1)}
        </div>
      `)}}if(xt.length===0)C.push(`
      <div class="pdf-sheet">
        <div>
          ${Q("MATERIAL DELIVERY LOG & TRACEABILITY")}
          
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
        ${j(C.length+1)}
      </div>
    `);else{const e=r?20:14,g=Math.ceil(xt.length/e);for(let f=0;f<g;f++){const A=xt.slice(f*e,(f+1)*e),I=g>1?`MATERIAL DELIVERY LOG & TRACEABILITY (PART ${f+1} OF ${g})`:"MATERIAL DELIVERY LOG & TRACEABILITY",_=A.map((d,M)=>{const z=f*e+M+1,G=String(d.qcStatus||d.status||"APPROVED").toUpperCase(),D=G.includes("REJECT")?"#dc2626":G.includes("NOTED")?"#0284c7":"#16a34a",S=d.unit||"units",W=d.quantityAccepted!==void 0?d.quantityAccepted:d.quantity||0,K=d.quantityRejected??0,V=d.quantityReceived??d.quantity??0;return`
            <tr>
              <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(z).padStart(2,"0")}</td>
              <td style="font-family: monospace; font-weight: 600;">${u(d.deliveryDate||d.date)||"—"}</td>
              <td style="font-weight: 800; color: #0f172a;">${d.materialDescription||d.materialName||d.name||"Material"}</td>
              <td>${d.supplier||d.supplierName||"—"}</td>
              <td style="font-family: monospace; font-weight: 700; text-align: right;">${V} <span style="font-size: 7px; color: #64748b; font-weight: normal;">${S}</span></td>
              <td style="font-family: monospace; font-weight: 800; text-align: right; color: #059669;">${W} <span style="font-size: 7px; color: #10b981; font-weight: normal;">${S}</span></td>
              <td style="font-family: monospace; font-weight: 800; text-align: right; color: ${K>0?"#dc2626":"#94a3b8"};">${K} <span style="font-size: 7px; color: ${K>0?"#ef4444":"#cbd5e1"}; font-weight: normal;">${S}</span></td>
              <td style="text-align: center; font-weight: 800; color: ${D}; font-size: 7.5px;">${G}</td>
            </tr>
          `}).join("");C.push(`
        <div class="pdf-sheet">
          <div>
            ${Q(I)}
            
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
                ${_}
              </tbody>
            </table>
          </div>
          ${j(C.length+1)}
        </div>
      `)}}if(P)if(ht.length===0)C.push(`
        <div class="pdf-sheet">
          <div>
            ${Q("APPENDIX: NCR REGISTER")}
            
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
          ${j(C.length+1)}
        </div>
      `);else{const e=r?15:10,g=Math.ceil(ht.length/e);for(let f=0;f<g;f++){const A=ht.slice(f*e,(f+1)*e),I=g>1?`APPENDIX: NCR REGISTER (PART ${f+1} OF ${g})`:"APPENDIX: NCR REGISTER",_=A.map(d=>{const M=String(d.status||"OPEN").toUpperCase(),z=M==="CLOSED"||M==="RECTIFIED"||M==="RESOLVED",G=Array.isArray(d.descriptionItems)?d.descriptionItems.join(", "):d.description||"Field variance logged";return`
              <tr>
                <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${d.refNo||d.ncrNumber||"NCR"}</td>
                <td style="font-weight: 700;">${d.elementLevel||d.location||"Structural Component"}</td>
                <td style="font-size: 7.5px; line-height: 1.4; color: #334155;">${G}</td>
                <td style="font-family: monospace; font-weight: 600;">${u(d.dateIdentified||d.dateFound||d.createdAt)}</td>
                <td style="font-family: monospace; font-weight: 600;">${u(d.targetFixDate||d.signDate||R)}</td>
                <td style="text-align: center; font-weight: 900; color: ${z?"#16a34a":"#dc2626"}; font-size: 7.5px;">${z?"CLOSED":"OPEN"}</td>
              </tr>
            `}).join("");C.push(`
          <div class="pdf-sheet">
            <div>
              ${Q(I)}
              
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
                  ${_}
                </tbody>
              </table>
            </div>
            ${j(C.length+1)}
          </div>
        `)}}if(i){const e=at.length,g=at.filter(I=>{const _=String(I.status||"").toUpperCase();return _.includes("CLOSE")||_.includes("COMPLET")||_.includes("COMPLI")||!!I.closedAt}).length,f=at.filter(I=>{const _=String(I.status||"").toUpperCase();if(_.includes("CLOSE")||_.includes("COMPLET")||_.includes("COMPLI")||!!I.closedAt)return!1;if(_.includes("OVERDUE"))return!0;const M=I.complianceDeadline||I.dueDate||I.targetDate;if(!M)return!1;const z=new Date(M).getTime(),G=R?new Date(R).getTime():Date.now();return!isNaN(z)&&z<G}).length,A=e-g;if(at.length===0)C.push(`
        <div class="pdf-sheet">
          <div>
            ${Q("APPENDIX: SITE INSTRUCTION REGISTER")}

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
          ${j(C.length+1)}
        </div>
      `);else{const I=r?9:6,_=Math.ceil(at.length/I);for(let d=0;d<_;d++){const M=at.slice(d*I,(d+1)*I),z=_>1?`APPENDIX: SITE INSTRUCTION REGISTER (PART ${d+1} OF ${_})`:"APPENDIX: SITE INSTRUCTION REGISTER",G=M.map((S,W)=>{var ot;const K=d*I+W,V=String(S.status||"ISSUED").trim().toUpperCase(),nt=V.includes("CLOSE")||V.includes("COMPLET")||V.includes("COMPLI")||!!S.closedAt,st=S.complianceDeadline||S.dueDate||S.targetDate;let H=!1;if(!nt&&st){const Xt=new Date(st).getTime(),ae=R?new Date(R).getTime():Date.now();!isNaN(Xt)&&Xt<ae&&(H=!0)}V.includes("OVERDUE")&&(H=!0);let bt="ISSUED",vt="#d97706";nt?(bt="CLOSED",vt="#16a34a"):H?(bt="OVERDUE",vt="#dc2626"):V.includes("ACKNOW")||V.includes("PROGRESS")||V.includes("REVIEW")?(bt="IN PROGRESS",vt="#2563eb"):V&&(bt=V.replace(/_/g," "),vt="#d97706");const yt=S.title||S.subject||"Formal Notice of Defect Rectification",kt=S.instructionText||S.issueSummary||S.directiveText||S.description||"",tt=S.stopWorkOrdered?'<span style="display: inline-block; background: #dc2626; color: #ffffff; font-size: 6.5px; font-weight: 900; padding: 1.5px 4px; border-radius: 2px; margin-bottom: 2px; letter-spacing: 0.5px;">STOP WORK ORDERED</span><br/>':"",ie=S.location||S.elementName?`<div style="font-size: 6.5px; color: #64748b; font-weight: 600; margin-top: 2px;">Zone: ${S.location||"Site"}${S.elementName?` &bull; ${S.elementName}`:""}</div>`:"",et=S.recipientName||S.assignedToName||S.recipient||"",it=S.contractorName||S.subcontractorCompany||S.subcontractor||S.contractor||"",ft=et&&it&&et!==it?`<div style="font-weight: 700; color: #0f172a;">${et}</div><div style="font-size: 6.5px; color: #64748b; text-transform: uppercase;">${it}</div>`:`<div style="font-weight: 700; color: #0f172a; text-transform: uppercase;">${et||it||"Main Contractor"}</div>`;return`
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="font-family: monospace; font-weight: 800; color: #0f172a; vertical-align: top; padding: 5px 6px;">
                  ${S.instructionNumber||S.siNumber||S.id||`SI-${String(K+1).padStart(3,"0")}`}
                </td>
                <td style="vertical-align: top; padding: 5px 6px;">
                  ${tt}
                  <div style="font-weight: 700; font-size: 7.5px; color: #0f172a; line-height: 1.35;">${yt}</div>
                  ${kt?`<div style="font-size: 7px; color: #475569; margin-top: 2px; line-height: 1.35; white-space: pre-line;">${kt}</div>`:""}
                  ${ie}
                </td>
                <td style="font-size: 7.5px; vertical-align: top; padding: 5px 6px;">
                  ${ft}
                  ${S.recipientRole?`<div style="font-size: 6.5px; color: #94a3b8;">${S.recipientRole}</div>`:""}
                </td>
                <td style="font-family: monospace; font-weight: 600; text-align: center; vertical-align: top; padding: 5px 6px; font-size: 7px;">
                  ${u(S.issuedDate||S.date||S.createdAt||((ot=S.signedBy)==null?void 0:ot.signedAt))||"—"}
                </td>
                <td style="font-family: monospace; font-weight: 600; text-align: center; vertical-align: top; padding: 5px 6px; font-size: 7px;">
                  ${u(st)||"Immediate"}
                </td>
                <td style="text-align: center; font-weight: 900; color: ${vt}; font-size: 7.5px; vertical-align: top; padding: 5px 6px; text-transform: uppercase;">
                  ${bt}
                </td>
              </tr>
            `}).join(""),D=d===0?`
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 8px; margin-bottom: 8px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px;">
              <div style="font-size: 7px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Total Directives</div>
              <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-top: 1px;">${e}</div>
            </div>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 6px 10px;">
              <div style="font-size: 7px; font-weight: 800; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.5px;">Overdue Directives</div>
              <div style="font-size: 13px; font-weight: 900; color: #dc2626; margin-top: 1px;">${f}</div>
            </div>
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 6px 10px;">
              <div style="font-size: 7px; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px;">Open / In Progress</div>
              <div style="font-size: 13px; font-weight: 900; color: #d97706; margin-top: 1px;">${A}</div>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 6px 10px;">
              <div style="font-size: 7px; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px;">Closed &amp; Complied</div>
              <div style="font-size: 13px; font-weight: 900; color: #16a34a; margin-top: 1px;">${g}</div>
            </div>
          </div>
        `:"";C.push(`
          <div class="pdf-sheet">
            <div>
              ${Q(z)}
              ${D}
              
              <table class="data-table" style="margin-top: ${d===0?"4px":"8px"};">
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
                  ${G}
                </tbody>
              </table>
            </div>
            ${j(C.length+1)}
          </div>
        `)}}}if(b)if(ct.length===0)C.push(`
        <div class="pdf-sheet">
          <div>
            ${Q("APPENDIX: SITE COMMENTS / OBSERVATION LOG")}
            
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
          ${j(C.length+1)}
        </div>
      `);else{const e=r?16:12,g=Math.ceil(ct.length/e);for(let f=0;f<g;f++){const A=ct.slice(f*e,(f+1)*e),I=g>1?`APPENDIX: SITE COMMENTS / OBSERVATION LOG (PART ${f+1} OF ${g})`:"APPENDIX: SITE COMMENTS / OBSERVATION LOG",_=A.map((d,M)=>{const z=f*e+M+1,G=String(d.status||"Non-Compliant").trim(),D=G.toLowerCase().replace(/[\s-]+/g,"_"),S=D.includes("non_comp")||D.includes("noncomp")||D.includes("defect")||D.includes("fail")||D.includes("reject")||D==="open",W=D.includes("rectif")||D.includes("fixed")||D.includes("closed")||D.includes("pass")||D.includes("approv")||D.includes("comp")&&!S,K=D.includes("pend")||D.includes("prog")||D.includes("review")||D.includes("action"),V=S?"#dc2626":W?"#16a34a":K?"#d97706":"#dc2626";return`
              <tr>
                <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(z).padStart(2,"0")}</td>
                <td style="font-family: monospace; font-weight: 600;">${u(d.date||d.createdAt)||"—"}</td>
                <td>${d.level||Z}${d.location?` &bull; ${d.location}`:""}</td>
                <td style="font-weight: 700;">${d.element||"—"}</td>
                <td style="font-size: 7.5px; line-height: 1.4; color: #334155; white-space: pre-line;">${(d.comments||d.text||"—").replace(/<br\s*\/?>/gi,`
`)}</td>
                <td>${d.inspector||U}${d.vendorCheck?` / ${d.vendorCheck}`:""}</td>
                <td style="text-align: center; font-weight: 800; color: ${V}; font-size: 7.5px;">${G}</td>
              </tr>
            `}).join("");C.push(`
          <div class="pdf-sheet">
            <div>
              ${Q(I)}
              
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
                  ${_}
                </tbody>
              </table>
            </div>
            ${j(C.length+1)}
          </div>
        `)}}St.length>0&&St.forEach((e,g)=>{const f=typeof e=="string"?e:e.url,A=typeof e=="object"&&e.caption&&e.caption.trim().length>0?e.caption:`SPECIMEN ${g+1} | AS-BUILT SITE QUALITY RECORD`;C.push(`
        <div class="pdf-sheet">
          <div>
            ${Q(`PICTORIAL SURVEILLANCE RECORD (SPECIMEN ${g+1} OF ${St.length})`)}
            
            <div style="height: ${r?"230mm":"154mm"}; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; position: relative; margin-top: 6px;">
              <!-- Photo Viewport -->
              <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 6px; overflow: hidden; background: #ffffff;">
                <img src="${f}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 2px;" alt="${A}" />
              </div>

              <!-- Dark Caption Ribbon -->
              <div style="background: #0f172a; border-left: 5px solid #ea580c; color: #ffffff; padding: 10px 16px; font-size: 8.5px; font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
                <span style="letter-spacing: 0.3px; text-transform: uppercase;">
                  ${A}
                </span>
                <span style="color: #94a3b8; font-family: monospace; font-size: 7.5px;">
                  SPECIMEN ${g+1} / ${St.length}
                </span>
              </div>
            </div>
          </div>
          ${j(C.length+1)}
        </div>
      `)});const wt=ut>0?`${ut} Holds Active / Pending Sign-off`:"All Quality Checks Conforming & Approved";t.synopsis||t.executiveSummary,r?C.push(`
      <div class="pdf-sheet" style="padding: 0; display: flex; flex-direction: column; height: 297mm; overflow: hidden; position: relative;">
        <!-- Top Dark Emerald Panel (~60mm height) -->
        <div style="height: 60mm; width: 100%; background: #091a18; color: #ffffff; padding: 8mm 16mm; display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #10b981;">
          <!-- Company Brand -->
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              ${v?`<img src="${v}" style="max-height: 40px; max-width: 140px; object-fit: contain;" alt="${T}" />`:`
                <div style="display: flex; gap: 2.5px; align-items: flex-end; height: 18px;">
                  <span style="width: 4px; height: 10px; background: #c28b5e; border-radius: 1px;"></span>
                  <span style="width: 4px; height: 18px; background: #c28b5e; border-radius: 1px;"></span>
                  <span style="width: 4px; height: 14px; background: #c28b5e; border-radius: 1px;"></span>
                </div>
              `}
              <div style="font-size: 12px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.5px; text-transform: uppercase;">
                ${h.toUpperCase()}
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
                DOC-ID: ${N}
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
                ${O.toUpperCase()} DEVELOPMENT
              </h3>
              <p style="font-size: 7.5px; color: #64748b; margin: 0;">
                Weekly Structural Quality Control, Surveillance &amp; Materials Conformance Audit
              </p>
            </div>

            <!-- Key Metadata Grid (2x2) -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 10px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; font-size: 8px; margin-bottom: 12px;">
              <div>
                <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Reporting Period</p>
                <p style="font-weight: 700; color: #1e293b; margin: 0;">${p} – ${w}</p>
              </div>
              <div>
                <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Structure Level</p>
                <p style="font-weight: 700; color: #1e293b; margin: 0;">${Z}</p>
              </div>
              <div>
                <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Inspection Status</p>
                <p style="font-weight: 700; color: ${ut>0?"#dc2626":"#16a34a"}; margin: 0;">${wt}</p>
              </div>
              <div>
                <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Revision Control</p>
                <p style="font-weight: 700; color: #1e293b; margin: 0;">${n}</p>
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
                    ${U}
                  </h4>
                  <p style="font-size: 8px; font-weight: 800; color: #047857; text-transform: uppercase; margin: 0;">
                    ${F}
                  </p>
                </div>
                
                <!-- Stamp / Verification Badge Indicator -->
                <div style="display: flex; align-items: center; gap: 8px;">
                  ${X?`<img src="${X}" style="max-height: 38px; max-width: 100px; object-fit: contain;" alt="Signature" />`:""}
                  <div style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgba(5, 150, 105, 0.4); display: flex; align-items: center; justify-content: center; font-size: 7px; font-weight: 900; color: #065f46; text-transform: uppercase; text-align: center; line-height: 1.15; background: #ecfdf5;">
                    VERIFIED<br />QA/QC
                  </div>
                </div>
              </div>

              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b;">
                <span>Email: <strong style="color: #334155; font-weight: 700;">${J}</strong></span>
                <span>Issued: <strong style="color: #334155; font-weight: 700;">${u(R)}</strong></span>
              </div>
            </div>

            <!-- Legal Footer -->
            <div style="padding-top: 8px; margin-top: 8px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; font-size: 7px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
              <span>CONFIDENTIAL | PREPARED FOR CLIENT &amp; SUPERVISING CONSULTANT</span>
              <span>PAGE ${C.length+1} OF ${C.length+1}</span>
            </div>
          </div>
        </div>
      </div>
    `):C.push(`
      <div class="pdf-sheet" style="padding: 0; display: flex; flex-direction: row; height: 210mm; overflow: hidden; position: relative;">
        <!-- Left Dark Emerald Panel (~30% width) -->
        <div style="width: 30%; background: #091a18; color: #ffffff; padding: 28mm 12mm 16mm 14mm; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <!-- Company Brand -->
            <div style="margin-bottom: 24px;">
              <div style="display: flex; align-items: flex-end; gap: 2px; margin-bottom: 6px; justify-content: center;">
                ${v?`<img src="${v}" style="max-height: 150px; max-width: 200px; object-fit: contain;" alt="${T}" />`:`
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
                DOC-ID: ${N}
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
                ${O.toUpperCase()} DEVELOPMENT
              </h3>
              <p style="font-size: 7.5px; color: #64748b; margin: 0;">
                Weekly Structural Quality Control, Surveillance &amp; Materials Conformance Audit
              </p>
            </div>

            <!-- Key Metadata Grid (2x2) -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 10px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; font-size: 8px; margin-bottom: 12px;">
              <div>
                <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Reporting Period</p>
                <p style="font-weight: 700; color: #1e293b; margin: 0;">${p} – ${w}</p>
              </div>
              <div>
                <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Structure Level</p>
                <p style="font-weight: 700; color: #1e293b; margin: 0;">${Z}</p>
              </div>
              <div>
                <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Inspection Status</p>
                <p style="font-weight: 700; color: ${ut>0?"#dc2626":"#16a34a"}; margin: 0;">${wt}</p>
              </div>
              <div>
                <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Revision Control</p>
                <p style="font-weight: 700; color: #1e293b; margin: 0;">${n}</p>
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
                    ${U}
                  </h4>
                  <p style="font-size: 8px; font-weight: 800; color: #047857; text-transform: uppercase; margin: 0;">
                    ${F}
                  </p>
                </div>
                
                <!-- Stamp / Verification Badge Indicator -->
                <div style="display: flex; align-items: center; gap: 8px;">
                  ${X?`<img src="${X}" style="max-height: 38px; max-width: 100px; object-fit: contain;" alt="Signature" />`:""}
                  <div style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgba(5, 150, 105, 0.4); display: flex; align-items: center; justify-content: center; font-size: 7px; font-weight: 900; color: #065f46; text-transform: uppercase; text-align: center; line-height: 1.15; background: #ecfdf5;">
                    VERIFIED<br />QA/QC
                  </div>
                </div>
              </div>

              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b;">
                <span>Email: <strong style="color: #334155; font-weight: 700;">${J}</strong></span>
                <span>Issued: <strong style="color: #334155; font-weight: 700;">${u(R)}</strong></span>
              </div>
            </div>

            <!-- Legal Footer -->
            <div style="padding-top: 8px; margin-top: 8px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; font-size: 7px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
              <span>CONFIDENTIAL | PREPARED FOR CLIENT &amp; SUPERVISING CONSULTANT</span>
              <span>PAGE ${C.length+1} OF ${C.length+1}</span>
            </div>
          </div>
        </div>

      </div>
    `);const Kt=`
    @page {
      size: ${r?"A4 portrait":"A4 landscape"} !important;
      margin: 0 !important;
    }

    @media print {
      html, body {
        width: ${r?"210mm":"297mm"} !important;
        height: ${r?"297mm":"210mm"} !important;
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
      width: ${r?"210mm":"297mm"} !important;
      height: ${r?"297mm":"210mm"} !important;
      min-height: ${r?"297mm":"210mm"} !important;
      max-height: ${r?"297mm":"210mm"} !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      padding: ${r?"8mm 10mm 6mm 10mm":"7mm 12mm 5mm 12mm"};
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
      background: ${y.ruleColor};
    }

    .pdf-footer {
      padding-top: 5px;
      border-top: 1px solid ${y.cardBorder};
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pdf-slide-badge {
      background: ${y.badgeBg};
      color: ${y.badgeTextColor};
      font-size: 7.5px;
      font-weight: 800;
      padding: 2.5px 10px;
      border-radius: ${y.cardRadius};
      border: 1px solid ${y.badgeBorder};
      letter-spacing: 0.5px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5px;
      font-family: ${y.fontFamily} !important;
    }

    .data-table th {
      background: ${y.tableHeaderBg} !important;
      color: ${y.tableHeaderTextColor} !important;
      font-weight: 800;
      font-size: 7.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 6px 8px;
      border: 1px solid ${y.tableHeaderBg};
      text-align: left;
    }

    .data-table td {
      padding: 4.5px 8px;
      border: 1px solid #f1f5f9;
      border-bottom: 1px solid ${y.tableBorderColor};
      vertical-align: middle;
    }

    .data-table tr:nth-child(even) td {
      background: ${y.tableZebraBg};
    }

    .badge-approved {
      background: ${y.badgeApprovedBg} !important;
      color: ${y.badgeApprovedColor} !important;
      border: 1px solid ${y.badgeApprovedBorder};
      border-radius: ${y.cardRadius};
      padding: 1.5px 7px;
      font-weight: 800;
      font-size: 7px;
      text-transform: uppercase;
      display: inline-block;
    }

    .badge-rejected {
      background: ${y.badgeRejectedBg} !important;
      color: ${y.badgeRejectedColor} !important;
      border: 1px solid ${y.badgeRejectedBorder};
      border-radius: ${y.cardRadius};
      padding: 1.5px 7px;
      font-weight: 800;
      font-size: 7px;
      text-transform: uppercase;
      display: inline-block;
    }

    .badge-pending {
      background: ${y.badgePendingBg} !important;
      color: ${y.badgePendingColor} !important;
      border: 1px solid ${y.badgePendingBorder};
      border-radius: ${y.cardRadius};
      padding: 1.5px 7px;
      font-weight: 800;
      font-size: 7px;
      text-transform: uppercase;
      display: inline-block;
    }
  `,Jt=C.join(`
`);rt(`${N} - QA/QC Weekly Surveillance Report (${r?"Portrait Dossier":"Landscape Slide Deck"})`,Jt,Kt)}function ze(t,c="All Levels",E={},l={}){const $=l.name||"Apex Civil Engineering",r=E.name||"Site Quality Assessment",m=k(new Date),n=`CQ-REG-${c.toUpperCase().replace(/[^A-Z0-9]/g,"-")}-${Date.now().toString().slice(-6)}`,T=t.length,h=t.filter(s=>s.status==="CURING"||s.status==="PENDING").length,v=t.filter(s=>{var p,w;return s.day7Results&&s.day7Results.length>0||((w=(p=s.tests)==null?void 0:p.day7)==null?void 0:w.averageStrengthNmm2)}),O=v.filter(s=>{var L,U,F,J;const p=((U=(L=s.day7Results)==null?void 0:L[0])==null?void 0:U.averageStrength)||((J=(F=s.tests)==null?void 0:F.day7)==null?void 0:J.averageStrengthNmm2)||0,w=s.target28DayStrengthNmm2||s.day28Required||30,R=s.day7Required||Math.round(w*.7*10)/10;return p>=R}).length,N=v.length>0?Math.round(O/v.length*100):100,P=t.filter(s=>{var p,w;return s.day28Results&&s.day28Results.length>0||((w=(p=s.tests)==null?void 0:p.day28)==null?void 0:w.averageStrengthNmm2)}),b=P.filter(s=>{var R,L,U,F;const p=((L=(R=s.day28Results)==null?void 0:R[0])==null?void 0:L.averageStrength)||((F=(U=s.tests)==null?void 0:U.day28)==null?void 0:F.averageStrengthNmm2)||0,w=s.target28DayStrengthNmm2||s.day28Required||30;return p>=w}).length,i=P.length>0?Math.round(b/P.length*100):100,u=t.filter(s=>s.status==="APPROVED"||s.status==="28-DAY DONE").length,x=t.filter(s=>s.status==="NCR_ISSUED"||s.status==="REJECTED"||s.ncrGenerated).length,o=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${dt(l,E)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">CONCRETE QUALITY & COMPRESSIVE STRENGTH REGISTER</div>
          <div class="header-title-project">PROJECT: ${r}</div>
          <div class="header-title-iso">BS EN 12390-3 / BS EN 206-1 / ASTM C39 Concrete Conformance Register</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${n}</span></div>
          <div><strong>Scope / Level:</strong> <span style="font-weight:700; color:#0f172a;">${c}</span></div>
          <div><strong>Report Date:</strong> ${m}</div>
          <div><strong>Total Samples:</strong> ${T} specimen sets</div>
        </td>
      </tr>
    </table>

    <!-- 1.0 Executive Quality Statistics -->
    <div class="pdf-section">
      <div class="section-banner">1.0 CONCRETE COMPLIANCE SUMMARY & QUALITY STATISTICS</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 20%;">LOCATION / FILTER:</td>
          <td class="grid-value" style="width: 30%; font-weight:700; color:#0f172a;">${c}</td>
          <td class="grid-label" style="width: 20%;">TOTAL SAMPLES LOGGED:</td>
          <td class="grid-value" style="width: 30%; font-weight:800; font-size:9.5px; font-family:monospace;">${T} Specimens</td>
        </tr>
        <tr>
          <td class="grid-label">28-DAY COMPLIANCE RATE:</td>
          <td class="grid-value">
            <span style="font-weight:800; font-size:10px; color:${i>=95?"#15803d":"#b91c1c"};">${i}%</span>
            <span style="font-size:7.5px; color:#64748b; margin-left:4px;">(${b}/${P.length} tested sets compliant)</span>
          </td>
          <td class="grid-label">7-DAY EARLY STRENGTH:</td>
          <td class="grid-value">
            <span style="font-weight:800; font-size:9.5px; color:#0369a1;">${N}%</span>
            <span style="font-size:7.5px; color:#64748b; margin-left:4px;">(${O}/${v.length} tested sets compliant)</span>
          </td>
        </tr>
        <tr>
          <td class="grid-label">APPROVED CERTIFICATES:</td>
          <td class="grid-value" style="color:#15803d; font-weight:800;">${u} Fully Certified</td>
          <td class="grid-label">ACTIVE NCRS / DEFECTIVE:</td>
          <td class="grid-value" style="color:${x>0?"#b91c1c":"#15803d"}; font-weight:800;">${x} Non-Conforming</td>
        </tr>
        <tr>
          <td class="grid-label">IN CURING TANKS:</td>
          <td class="grid-value" style="color:#0284c7; font-weight:700;">${h} In Curing Water Tanks</td>
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
          ${t.length>0?t.map(s=>{var X,lt,q,B,xt,ht,ct,at;const p=s.target28DayStrengthNmm2||s.day28Required||30,w=s.day7Required||Math.round(p*.7*10)/10,R=((lt=(X=s.day7Results)==null?void 0:X[0])==null?void 0:lt.averageStrength)??((B=(q=s.tests)==null?void 0:q.day7)==null?void 0:B.averageStrengthNmm2),L=R!=null?R>=w:null,U=((ht=(xt=s.day28Results)==null?void 0:xt[0])==null?void 0:ht.averageStrength)??((at=(ct=s.tests)==null?void 0:ct.day28)==null?void 0:at.averageStrengthNmm2),F=U!=null?U>=p:null,J=s.status==="NCR_ISSUED"||s.status==="REJECTED"||s.ncrGenerated||!!s.ncrNumber;return`
              <tr>
                <td>
                  <div style="font-weight: 800; color: #0f172a;">${s.sampleId||s.sampleNumber||"—"}</div>
                  ${s.inscribedName?`<div style="font-size: 7px; color: #64748b;">Mark: ${s.inscribedName}</div>`:""}
                </td>
                <td>
                  <div style="font-weight: 700;">${s.structureElement||s.elementName||"Structural Element"}</div>
                  ${s.supplier?`<div style="font-size: 7px; color: #64748b;">${s.supplier}</div>`:""}
                </td>
                <td>${[s.level||s.levelName,s.zone].filter(Boolean).join(" • ")||"Site"}</td>
                <td style="font-weight: 700; font-family: monospace;">${s.concreteGrade||"C30"} (${p})</td>
                <td>${k(s.castDate)}</td>
                <td style="font-family: monospace;">${s.slumpMm||s.slumpValue||"—"} mm</td>
                <td>
                  ${R!=null?`<div style="font-family: monospace; font-weight: 800; color: ${L?"#15803d":"#b91c1c"};">${R} MPa</div>
                         <div style="font-size: 6.8px; color: ${L?"#15803d":"#b91c1c"}; font-weight: 700;">(${L?"PASS":"FAIL"} - Min ${w})</div>`:'<span style="color: #94a3b8; font-size: 7.5px;">Pending</span>'}
                </td>
                <td>
                  ${U!=null?`<div style="font-family: monospace; font-weight: 800; color: ${F?"#15803d":"#b91c1c"};">${U} MPa</div>
                         <div style="font-size: 6.8px; color: ${F?"#15803d":"#b91c1c"}; font-weight: 700;">(${F?"PASS":"FAIL"} - Min ${p})</div>`:'<span style="color: #94a3b8; font-size: 7.5px;">In Curing</span>'}
                </td>
                <td>
                  ${J?`<span class="badge-fail">NCR: ${s.ncrNumber||"ISSUED"}</span>`:s.status==="APPROVED"||F?'<span class="badge-pass">APPROVED</span>':`<span class="badge-pending">${s.status||"IN PROGRESS"}</span>`}
                </td>
              </tr>
            `}).join(""):`
              <tr>
                <td colspan="9" style="text-align: center; color: #64748b; padding: 14px;">
                  No concrete specimen records found for ${c}.
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
              <span>Date: ${m}</span>
            </div>
          </td>
          <td style="width: 33.3%;">
            <div class="sig-role-header"><span>QA/QC MANAGER</span><span class="sig-required-tag">APPROVED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>QA/QC Manager</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${m}</span>
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
      <div>CONFIDENTIAL & PROPRIETARY — ${$}</div>
      <div>Report Ref: ${n} • Filter: ${c}</div>
    </div>
  `;rt(`${n} - Concrete Quality Register (${c})`,o)}function Ue(t,c,E){var N,P,b,i,u,x,o,s;const l=(E==null?void 0:E.name)||t.companyName||"JQMS Civil Infrastructure",$=(c==null?void 0:c.name)||t.projectName||"Civil Engineering Construction Project",r=(c==null?void 0:c.code)||"PRJ-001",m=t.instructionNumber||`SI-${t.id.slice(0,8).toUpperCase()}`,n=k(((N=t.signedBy)==null?void 0:N.signedAt)||t.createdAt),T=k(t.complianceDeadline),h=t.severity==="STOP_WORK"||t.severity==="CRITICAL"?"#dc2626":t.severity==="HIGH"?"#ea580c":"#2563eb",v=t.severity==="STOP_WORK"?"INTERNAL WORK HOLD DIRECTIVE":t.severity==="CRITICAL"?"CRITICAL INTERNAL QUALITY DIRECTIVE":t.severity==="HIGH"?"HIGH PRIORITY RECTIFICATION NOTICE":"STANDARD QUALITY DIRECTIVE",O=`
    <!-- ═══ DOCUMENT HEADER ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${dt(E,c)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main" style="color: ${h};">
            INTERNAL SITE INSTRUCTION
          </div>
          <div style="font-size: 8px; font-weight: 800; letter-spacing: 0.8px; color: #475569; text-transform: uppercase; margin-top: 1px;">
            INTERNAL QUALITY CONTROL & REMEDIATION DIRECTIVE
          </div>
          <div class="header-title-project">${$} (${r})</div>
        </td>
        <td style="width: 25%; font-size: 8px; vertical-align: top; background: #fafafa;">
          <div style="margin-bottom: 2px;">Doc Ref: <strong style="font-family: monospace; font-size: 8.5px; color: #0f172a;">${m}</strong></div>
          <div style="margin-bottom: 2px;">Issue Date: <strong>${n}</strong></div>
          <div style="margin-bottom: 2px;">Target Rectification: <strong style="color: #dc2626;">${T}</strong></div>
          <div>Status: <span style="background: #e0f2fe; color: #0369a1; font-weight: 800; padding: 1px 4px; border-radius: 2px; font-size: 7px;">${t.status||"ISSUED"}</span></div>
        </td>
      </tr>
    </table>

    <!-- ═══ INTERNAL SEVERITY BANNER ═══ -->
    <div style="background: ${h}; color: #ffffff; padding: 5px 10px; border-radius: 4px; font-weight: 800; font-size: 9px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; letter-spacing: 0.5px;">
      <span>⚠️ NOTICE CATEGORY: ${v}</span>
      <span>ACTION REQUIRED BY: ${T}</span>
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
          <td class="meta-value"><strong>${k(t.ncrDeadline)}</strong></td>
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
          ${t.mandatoryActions&&t.mandatoryActions.length>0?t.mandatoryActions.map((p,w)=>`
                <tr>
                  <td style="text-align: center; font-weight: 800; color: #ea580c;">${w+1}.0</td>
                  <td style="font-weight: 600; color: #0f172a;">${p}</td>
                  <td style="text-align: center; font-weight: 700; color: #dc2626;">${T}</td>
                </tr>
              `).join(""):`
                <tr>
                  <td style="text-align: center; font-weight: 800;">1.0</td>
                  <td>Execute complete remediation of identified defect according to internal project quality guidelines.</td>
                  <td style="text-align: center; font-weight: 700;">${T}</td>
                </tr>
                <tr>
                  <td style="text-align: center; font-weight: 800;">2.0</td>
                  <td>Notify QA/QC team for re-inspection and sign-off upon completion of corrective actions.</td>
                  <td style="text-align: center; font-weight: 700;">${T}</td>
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
                <div>Full Name: <strong>${((P=t.signedBy)==null?void 0:P.name.toUpperCase())||"Authorized Quality Authority"}</strong></div>
                <div>Designation: <strong>${((b=t.signedBy)==null?void 0:b.designation)||((i=t.signedBy)==null?void 0:i.role)||"QA/QC Lead Engineer"}</strong></div>
                <div style="font-size: 7.5px; color: #64748b; font-style: italic; margin-top: 4px;">
                  "${((u=t.signedBy)==null?void 0:u.declaration)||"Issued in accordance with company internal quality control standards."}"
                </div>
              </div>

              <div style="text-align: center; min-width: 170px; padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; background: #ffffff;">
                <div style="font-size: 7px; font-weight: 800; color: #0284c7; text-transform: uppercase; margin-bottom: 2px;">
                  Digital Signature
                </div>
                ${(x=t.signedBy)!=null&&x.signatureUrl?`<img src="${t.signedBy.signatureUrl}" style="max-height: 44px; max-width: 150px; object-fit: contain; margin: 0 auto;" alt="Signature" />`:`<div style="height: 36px; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 10px; font-weight: bold; color: #0284c7;">${((o=t.signedBy)==null?void 0:o.name)||"ELECTRONICALLY SIGNED"}</div>`}
                <div style="font-family: monospace; font-size: 6.5px; color: #94a3b8; border-top: 0.5px solid #f1f5f9; padding-top: 2px; margin-top: 2px;">
                  ID: ${((s=t.signedBy)==null?void 0:s.digitalSignatureStamp)||`JQMS-SI-${t.id.slice(0,8).toUpperCase()}`}
                </div>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- ═══ DOCUMENT FOOTER ═══ -->
    <div class="doc-footer">
      <div>INTERNAL QUALITY DIRECTIVE — ${l}</div>
      <div>Document Ref: ${m} </div>
    </div>
  `;rt(`${m} - Internal Site Instruction`,O)}function Fe(t,c={},E={}){var v,O,N,P,b,i,u,x,o,s;const l=E.name||"JQMS ENTERPRISE QUALITY MANAGEMENT",$=c.name||t.projectName||"CONSTRUCTION PROJECT",r=c.code||"PRJ",m=t.mirNumber||"MIR-DRAFT",n=p=>{switch(p){case"ACCEPTED":return'<span style="display:inline-block; padding: 3px 10px; background: #dcfce7; color: #15803d; border: 1.5px solid #86efac; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">ACCEPTED / APPROVED</span>';case"ACCEPTED_AS_NOTED":return'<span style="display:inline-block; padding: 3px 10px; background: #dbeafe; color: #1d4ed8; border: 1.5px solid #93c5fd; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">ACCEPTED AS NOTED</span>';case"REJECTED":return'<span style="display:inline-block; padding: 3px 10px; background: #fee2e2; color: #b91c1c; border: 1.5px solid #fca5a5; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">REJECTED / NON-COMPLIANT</span>';case"HOLD_FOR_TESTING":return'<span style="display:inline-block; padding: 3px 10px; background: #fef3c7; color: #b45309; border: 1.5px solid #fcd34d; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">HOLD FOR LAB TESTING</span>';default:return'<span style="display:inline-block; padding: 3px 10px; background: #f1f5f9; color: #475569; border: 1.5px solid #cbd5e1; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">PENDING INSPECTION</span>'}},T=t.items&&t.items.length>0?t.items.map((p,w)=>`
        <tr>
          <td style="text-align: center; font-weight: bold; width: 30px;">${w+1}</td>
          <td style="font-weight: 600; color: #0f172a;">${p.description||"Material Item"}</td>
          <td style="font-size: 7.5px; color: #475569;">${p.specificationRef||"—"}</td>
          <td style="text-align: right; font-weight: bold;">${p.quantityDelivered}</td>
          <td style="text-align: right;">${p.quantityInspected}</td>
          <td style="text-align: right; color: #15803d; font-weight: bold;">${p.quantityAccepted}</td>
          <td style="text-align: right; color: ${p.quantityRejected>0?"#b91c1c":"#64748b"}; font-weight: bold;">${p.quantityRejected}</td>
          <td style="text-align: center; text-transform: uppercase; font-size: 7.5px;">${p.unit||"units"}</td>
          <td style="font-size: 7.5px; color: #475569;">${p.remarks||"—"}</td>
        </tr>
      `).join(""):'<tr><td colspan="9" style="text-align:center; padding: 12px; color: #64748b;">No individual line items registered. Full delivery inspected as described.</td></tr>',h=`
    <!-- ═══ 1.0 HEADER TABLE ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${dt(E,c)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">MATERIAL INSPECTION REPORT (MIR)</div>
          <div class="header-title-project">${$} (${r})</div>
          <div class="header-title-iso">ISO 9001:2015 CLAUSE 8.4 — RECEIVING INSPECTION & VERIFICATION</div>
        </td>
        <td class="header-meta-cell">
          <div class="header-meta-row">
            <span class="header-meta-label">MIR NO:</span>
            <span class="header-meta-val" style="color: #ea580c; font-weight: 900;">${m}</span>
          </div>
          <div class="header-meta-row">
            <span class="header-meta-label">DISCIPLINE:</span>
            <span class="header-meta-val">${t.discipline||"Civil & Structural"}</span>
          </div>
          <div class="header-meta-row">
            <span class="header-meta-label">INSP DATE:</span>
            <span class="header-meta-val">${k(t.inspectionDate)}</span>
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
          <td>${k(t.deliveryDate)}</td>
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
          ${T}
        </tbody>
      </table>
    </div>

    <!-- ═══ 4.0 NOTES & REMARKS ═══ -->
    <div class="pdf-section">
      <div class="section-banner">4.0 INSPECTION OBSERVATIONS & REQUIRED ACTIONS</div>
      <div style="border: 1px solid #cbd5e1; border-top: none; background: #ffffff; padding: 8px 10px; display: flex; flex-direction: column; gap: 8px;">
        <div>
          <div style="font-size: 7.5px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">QA/QC Receiving Observations & Inspector Notes:</div>
          ${te(t.inspectionNotes,"Materials visually checked and verified compliant with delivery waybill and approved submittal specification.")}
        </div>
        ${t.rejectionReasons?`
        <div style="margin-top: 4px;">
          <div style="font-size: 7.5px; font-weight: 800; color: #b91c1c; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Defects, Non-Conformances & Technical Justifications:</div>
          ${te(t.rejectionReasons)}
        </div>
        `:""}
        ${t.actionRequired?`
        <div style="margin-top: 4px;">
          <div style="font-size: 7.5px; font-weight: 800; color: #d97706; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Mandatory Action & Quarantine Requirements:</div>
          ${te(t.actionRequired)}
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
                ${n(((v=t.qaqcSignOff)==null?void 0:v.verdict)||((O=t.consultantSignOff)==null?void 0:O.verdict)||t.disposition)}
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 2.2fr; gap: 12px; font-size: 8px; line-height: 1.6; color: #1e293b; margin-bottom: 6px;">
              <div style="border-right: 1px dashed #fed7aa; padding-right: 10px;">
                <div>QA/QC Engineer: <strong>${((N=t.qaqcSignOff)==null?void 0:N.name)||((P=t.consultantSignOff)==null?void 0:P.name)||((b=t.inspectedBy)==null?void 0:b.name)||"QA/QC Engineer"}</strong></div>
                <div>Designation: <strong>${((i=t.qaqcSignOff)==null?void 0:i.designation)||"QA/QC Engineer"}</strong></div>
                <div>Date of Endorsement: <strong>${k(((u=t.qaqcSignOff)==null?void 0:u.date)||((x=t.consultantSignOff)==null?void 0:x.date)||t.inspectionDate)}</strong></div>
                <div style="margin-top: 4px; color: #15803d; font-weight: bold; font-size: 7.5px;">
                  ✓ Electronically Authenticated Endorsement
                </div>
              </div>
              <div>
                <div style="font-weight: 800; color: #9a3412; font-size: 7.5px; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Official QA/QC Commentary, Directives & Liability Disclaimers:</div>
                ${te(((o=t.qaqcSignOff)==null?void 0:o.comments)||((s=t.consultantSignOff)==null?void 0:s.comments),"Materials inspected at site receiving laydown. Verified compliant with approved submittal & material specifications.")}
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
    ${(()=>{var R,L,U,F,J,X,lt;const p=t.stakeholders&&t.stakeholders.length>0?t.stakeholders:[{role:"Contractor Quality Representative",name:((R=t.contractorSignOff)==null?void 0:R.name)||((L=t.inspectedBy)==null?void 0:L.name)||"Contractor Quality Representative",designation:"Site QA/QC Inspector",required:!0,signed:!!((U=t.contractorSignOff)!=null&&U.signed||(F=t.inspectedBy)!=null&&F.date),signedAt:((J=t.contractorSignOff)==null?void 0:J.date)||((X=t.inspectedBy)==null?void 0:X.date)||t.inspectionDate},...(lt=t.consultantSignOff)!=null&&lt.signed?[{role:"Supervising Consultant / Resident Engineer",name:t.consultantSignOff.name,designation:"Resident Engineer",required:!1,signed:!0,signedAt:t.consultantSignOff.date}]:[]];if(p.length===0)return"";const w=[];for(let q=0;q<p.length;q+=2)w.push(p.slice(q,q+2));return`
      <div class="pdf-section">
        <div class="section-banner">6.0 STATUTORY STAKEHOLDER SIGN-OFF AUTHORIZATIONS</div>
        <table class="signoff-table">
          ${w.map(q=>`
            <tr>
              ${q.map(B=>`
                <td style="width: 50%; padding: 8px 12px; vertical-align: top; background: ${B.signed?"#f0fdf4":"#ffffff"};">
                  <div class="sig-role-header">
                    <span>${B.role}</span>
                    <span class="sig-required-tag" style="${B.signed?"background: #dcfce7; color: #166534; border-color: #86efac;":B.required?"background: #fee2e2; color: #991b1b; border-color: #fca5a5;":"background: #f1f5f9; color: #475569; border-color: #cbd5e1;"}">
                      ${B.signed?"VERIFIED & SIGNED":B.required?"REQUIRED":"OPTIONAL"}
                    </span>
                  </div>
                  <div style="font-size: 8px; line-height: 1.5; color: #1e293b; margin-top: 4px;">
                    <div>Name: <strong>${B.name||"— (Pending Signature)"}</strong></div>
                    <div>Designation: <strong>${B.designation||B.role}</strong></div>
                    <div>Date: <strong>${B.signedAt?k(B.signedAt):B.signed?k(t.inspectionDate):"—"}</strong></div>
                  </div>
                  <div style="margin-top: 14px; border-top: 1px dashed #94a3b8; padding-top: 4px; font-size: 7px; color: #64748b; text-align: center;">
                    ${B.signed?`Electronically Authenticated • ${B.name}`:`Signature & Stamp (${B.role})`}
                  </div>
                </td>
              `).join("")}
              ${q.length===1?'<td style="width: 50%; background: #f8fafc; border: 1px solid #cbd5e1;"></td>':""}
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
        ${t.photos.map((p,w)=>`
          <div class="photo-card" style="width: 48%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; text-align: center; background: #f8fafc; page-break-inside: avoid; break-inside: avoid; margin-bottom: 6px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #ea580c; text-align: left; margin-bottom: 4px; display: flex; justify-content: space-between;">
              <span>PHOTO #${w+1} — DELIVERY EVIDENCE</span>
              <span style="color: #64748b; font-size: 7px;">${m}</span>
            </div>
            <div style="height: 160px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
              <img src="${p}" alt="Inspection Evidence #${w+1}" style="max-height: 160px; max-width: 100%; object-fit: contain;" />
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
      <div>CONFIDENTIAL & STATUTORY QUALITY RECORD — ISO 9001:2015 CLAUSE 8.4 — ${l}</div>
      <div>Document Ref: ${m}</div>
    </div>
  `;rt(`${m} - Material Inspection Report (${t.title})`,h)}function Be(t,c={},E={}){var P,b,i,u,x,o,s,p,w,R,L,U,F,J,X,lt,q,B,xt,ht,ct,at,Tt,St,Mt,zt,Ut,pt,Ft,Bt,Gt,Z,gt,mt,Vt,ut,Ht,Qt,y,jt,Q,j,C,It,At,Rt,Y,Ct,Yt,ee,Nt,qt,Wt,$t,wt,Kt,Jt,Ot,Dt,Pt,Lt,_t;const l=E.name||"JQMS ENTERPRISE QUALITY MANAGEMENT",$=c.name||t.projectName||"CONSTRUCTION PROJECT",r=c.code||t.projectCode||"PRJ",m=t.logNumber||`DSL-${r}-${((P=t.generalConditions)==null?void 0:P.date)||"TODAY"}`,n=t.generalConditions||{date:new Date().toISOString().slice(0,10),shift:"DAY",weather:"CLEAR",workHoursStart:"07:00",workHoursEnd:"17:00",totalHours:10},T=(t.manpower||[]).reduce((a,e)=>a+(Number(e.headCount)||0),0),h=(t.manpower||[]).reduce((a,e)=>a+(Number(e.totalManHours)||(Number(e.headCount)||0)*(Number(e.hoursWorked)||n.totalHours||8)),0),v=a=>{switch(a){case"SUNNY":return"☀️ Sunny";case"CLEAR":return"🌤️ Clear Sky";case"OVERCAST":return"☁️ Overcast / Cloudy";case"RAIN":return"🌧️ Rainy";case"HEAVY_RAIN":return"⛈️ Heavy Rain / Downpour";case"STORMY":return"🌩️ Stormy / High Winds";case"EXTREME_HEAT":return"🔥 Extreme Heat / High Temp";case"WINDY":return"💨 High Winds / Dust";default:return"🌤️ Normal Site Conditions"}},O=a=>{switch(a){case"APPROVED":return'<span style="padding: 2px 8px; background: #dcfce7; color: #15803d; border: 1px solid #86efac; border-radius: 3px; font-weight: 800; font-size: 8px;">APPROVED</span>';case"SUBMITTED":case"UNDER_REVIEW":return'<span style="padding: 2px 8px; background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; border-radius: 3px; font-weight: 800; font-size: 8px;">UNDER REVIEW</span>';case"REJECTED":return'<span style="padding: 2px 8px; background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; border-radius: 3px; font-weight: 800; font-size: 8px;">REVISION REQUIRED</span>';default:return'<span style="padding: 2px 8px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 3px; font-weight: 800; font-size: 8px;">DRAFT RECORD</span>'}},N=`
    <!-- ═══ HEADER BLOCK ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${dt(E,c)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">DAILY SITE LOG & STATUTORY DIARY</div>
          <div class="header-title-project">PROJECT: ${$} (${r})</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.5.1 Operations & Site Quality Records</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${m}</span></div>
          <div><strong>Log Date:</strong> ${n.date}</div>
          <div><strong>Shift:</strong> ${n.shift||"DAY SHIFT"}</div>
          <div><strong>Status:</strong> ${O(t.status)}</div>
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
          <td class="meta-value" style="font-weight: 700;">${v(n.weather)}</td>
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
        <span style="font-size: 7.5px; text-transform: none; color: #cbd5e1;">TOTAL PERSONNEL: <strong>${T}</strong> &bull; MAN-HOURS: <strong>${h.toFixed(1)} hrs</strong></span>
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
          ${t.manpower&&t.manpower.length>0?t.manpower.map((a,e)=>{const g=Number(a.hoursWorked)||n.totalHours||8,f=Number(a.headCount)||0,A=Number(a.totalManHours)||f*g;return`
              <tr>
                <td style="font-weight: 700; color: #0f172a;">${a.tradeName}</td>
                <td style="font-size: 7.5px; color: #64748b;">${a.tradeCategory||"Direct Execution"}</td>
                <td>${a.companyOrSubcontractor||"Direct Labor"}</td>
                <td style="text-align: center; font-weight: 800; color: #0284c7;">${f}</td>
                <td style="text-align: center;">${g}</td>
                <td style="text-align: center; font-weight: 700;">${A.toFixed(1)}</td>
              </tr>
            `}).join(""):`
            <tr>
              <td colspan="6" style="text-align: center; color: #94a3b8; padding: 6px;">No manpower entries logged for this shift.</td>
            </tr>
          `}
          <tr style="background: #f1f5f9; font-weight: 800; border-top: 1.5px solid #cbd5e1;">
            <td colspan="3" style="text-align: right; text-transform: uppercase; font-size: 7.5px; color: #334155;">Cumulative Site Workforce:</td>
            <td style="text-align: center; color: #0284c7; font-size: 8.5px;">${T}</td>
            <td style="text-align: center; color: #64748b; font-size: 7px;">Avg ${n.totalHours||8}h</td>
            <td style="text-align: center; color: #0f172a; font-size: 8.5px;">${h.toFixed(1)}</td>
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
      ${(b=t.quality)!=null&&b.inspections&&t.quality.inspections.length>0?`
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
      ${(i=t.quality)!=null&&i.qualityNotes||(u=t.quality)!=null&&u.ncrsRaised&&t.quality.ncrsRaised.length>0?`
      <div style="background: #fafafa; border: 1px solid #cbd5e1; border-top: none; padding: 6px 10px; font-size: 7.5px; color: #334155;">
        ${(x=t.quality)!=null&&x.ncrsRaised&&t.quality.ncrsRaised.length>0?`<div><strong>NCRs Raised / Monitored:</strong> <span style="color: #dc2626; font-weight: 700;">${t.quality.ncrsRaised.join(", ")}</span></div>`:""}
        ${(o=t.quality)!=null&&o.qualityNotes?`<div style="margin-top: 2px;"><strong>QA/QC Notes:</strong> ${t.quality.qualityNotes}</div>`:""}
      </div>
      `:""}
    </div>

    <!-- ═══ 6.0 MATERIALS LOGISTICS & CONCRETE POURS ═══ -->
    ${(s=t.materials)!=null&&s.deliveries&&t.materials.deliveries.length>0||(p=t.materials)!=null&&p.concretePours&&t.materials.concretePours.length>0?`
    <div class="pdf-section">
      <div class="section-banner">6.0 MATERIALS LOGISTICS, DELIVERIES & CONCRETE POURS</div>
      ${(w=t.materials)!=null&&w.concretePours&&t.materials.concretePours.length>0?`
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

      ${(R=t.materials)!=null&&R.deliveries&&t.materials.deliveries.length>0?`
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
            ${((L=t.hse)==null?void 0:L.toolboxTalkTopic)||"Daily Morning Safety & PPE Briefing"}
          </td>
          <td class="meta-label" style="width: 18%;">TBT ATTENDANCE:</td>
          <td class="meta-value" style="width: 16%; font-weight: 800; color: #0284c7;">
            ${((U=t.hse)==null?void 0:U.toolboxTalkAttendees)!=null?`${t.hse.toolboxTalkAttendees} Workers`:`${T} Workers`}
          </td>
        </tr>
        <tr>
          <td class="meta-label">INCIDENT RECORD:</td>
          <td class="meta-value" style="font-weight: 800; color: ${(F=t.hse)!=null&&F.incidentsReported?"#dc2626":"#15803d"};">
            ${(J=t.hse)!=null&&J.incidentsReported?`⚠️ ${t.hse.incidentsReported} INCIDENTS REPORTED (${t.hse.incidentDetails||""})`:"✅ ZERO (0) ACCIDENTS / LOST TIME INJURIES (LTI)"}
          </td>
          <td class="meta-label">HOUSEKEEPING:</td>
          <td class="meta-value" style="font-weight: 700;">
            ${((X=t.hse)==null?void 0:X.housekeepingRating)||"GOOD"}
          </td>
        </tr>
        ${(lt=t.hse)!=null&&lt.permitsToWork&&t.hse.permitsToWork.length>0?`
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
    ${t.delays&&t.delays.length>0||(q=t.consultant)!=null&&q.observations?`
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
      ${(B=t.consultant)!=null&&B.observations?`
      <div style="background: #fafafa; border: 1px solid #cbd5e1; border-top: none; padding: 6px 10px; font-size: 7.5px; color: #334155;">
        <div><strong>Consultant / Client Representative Walk Remarks:</strong> ${t.consultant.observations}</div>
        ${(xt=t.consultant)!=null&&xt.directivesIssued?`<div style="margin-top: 2px;"><strong>Directives Issued:</strong> ${t.consultant.directivesIssued}</div>`:""}
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
              Name: <strong>${((at=(ct=(ht=t.signOffs)==null?void 0:ht.SITE_ENGINEER)==null?void 0:ct.signedBy)==null?void 0:at.name)||t.createdByName||"Site Engineer"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((Mt=(St=(Tt=t.signOffs)==null?void 0:Tt.SITE_ENGINEER)==null?void 0:St.signedBy)==null?void 0:Mt.designation)||"Project Field Engineer"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(Ut=(zt=t.signOffs)==null?void 0:zt.SITE_ENGINEER)!=null&&Ut.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">DIGITALLY SIGNED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((pt=t.signOffs.SITE_ENGINEER.signedBy)==null?void 0:pt.digitalStamp)||"VERIFIED-EXECUTION"}</div>
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
              Name: <strong>${((Gt=(Bt=(Ft=t.signOffs)==null?void 0:Ft.QAQC_ENGINEER)==null?void 0:Bt.signedBy)==null?void 0:Gt.name)||"Pending QA/QC Certification"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((mt=(gt=(Z=t.signOffs)==null?void 0:Z.QAQC_ENGINEER)==null?void 0:gt.signedBy)==null?void 0:mt.designation)||"QA/QC Lead Engineer"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(ut=(Vt=t.signOffs)==null?void 0:Vt.QAQC_ENGINEER)!=null&&ut.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">ISO 9001 CERTIFIED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((Ht=t.signOffs.QAQC_ENGINEER.signedBy)==null?void 0:Ht.digitalStamp)||"QAQC-CERT-PASSED"}</div>
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
              Name: <strong>${((jt=(y=(Qt=t.signOffs)==null?void 0:Qt.SAFETY_OFFICER)==null?void 0:y.signedBy)==null?void 0:jt.name)||"Pending HSE Clearance"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((C=(j=(Q=t.signOffs)==null?void 0:Q.SAFETY_OFFICER)==null?void 0:j.signedBy)==null?void 0:C.designation)||"Site Safety Manager"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(At=(It=t.signOffs)==null?void 0:It.SAFETY_OFFICER)!=null&&At.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">SAFETY CLEARED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((Rt=t.signOffs.SAFETY_OFFICER.signedBy)==null?void 0:Rt.digitalStamp)||"HSE-CLEARED"}</div>
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
              Name: <strong>${((Yt=(Ct=(Y=t.signOffs)==null?void 0:Y.PROJECT_MANAGER)==null?void 0:Ct.signedBy)==null?void 0:Yt.name)||((qt=(Nt=(ee=t.signOffs)==null?void 0:ee.CONSULTANT)==null?void 0:Nt.signedBy)==null?void 0:qt.name)||"Pending Final Endorsement"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((wt=($t=(Wt=t.signOffs)==null?void 0:Wt.PROJECT_MANAGER)==null?void 0:$t.signedBy)==null?void 0:wt.designation)||"Project Manager / Consultant"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(Jt=(Kt=t.signOffs)==null?void 0:Kt.PROJECT_MANAGER)!=null&&Jt.signed||(Dt=(Ot=t.signOffs)==null?void 0:Ot.CONSULTANT)!=null&&Dt.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">APPROVED & ENDORSED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((_t=(Lt=(Pt=t.signOffs)==null?void 0:Pt.PROJECT_MANAGER)==null?void 0:Lt.signedBy)==null?void 0:_t.digitalStamp)||"PM-AUTHORIZED"}</div>
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
        ${t.photos.map((a,e)=>`
          <div style="width: 48%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; text-align: center; background: #f8fafc; page-break-inside: avoid; margin-bottom: 6px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #0284c7; text-align: left; margin-bottom: 3px; display: flex; justify-content: space-between;">
              <span>PHOTO #${e+1} ${a.tradeTag?`&bull; ${a.tradeTag}`:""}</span>
              <span style="color: #64748b; font-size: 7px;">${a.location||"Site"}</span>
            </div>
            <div style="height: 150px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
              <img src="${a.url}" alt="Site Evidence #${e+1}" style="max-height: 150px; max-width: 100%; object-fit: contain;" />
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
      <div>CONFIDENTIAL & STATUTORY QUALITY RECORD — ISO 9001:2015 CLAUSE 8.5.1 — ${l}</div>
      <div>Document Ref: ${m} &bull; Date: ${n.date}</div>
    </div>
  `;rt(`${m} - Daily Site Log (${n.date})`,N)}export{Ne as S,ne as W,Ue as a,Le as b,_e as c,Fe as d,De as e,we as f,Pe as g,Oe as h,ke as i,ze as j,Me as k,Be as l,rt as o};
