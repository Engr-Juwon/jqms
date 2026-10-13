import{h as le}from"./html2pdf-CpttaISV.js";import{c as se}from"./permitChecklist-BHE5VmmF.js";import"./vendor-pdf-CqL8L5vX.js";import{b as ae,r as K,u as Zt}from"./index-DjBH97H4.js";import{j as ct}from"./vendor-three-h7LxBsfh.js";import{s as ce,b2 as pe,ag as fe,d as ge,bo as be,af as he,O as me}from"./vendor-icons-CHLyMjpm.js";import"./jspdf.plugin.autotable-Cg0p10kG.js";function oe(t){if(!t||!t.trim())return[];const d=t.trim(),h=new RegExp("(?:^|\\n+|(?<=[.!?]\\s+)|(?<=\\b))((?:Dimensional\\s+Non-Conformance|Dimensional\\s+Check|Dimensional\\s+Defect|Non-Conformance|Defect\\s+Notice|Material\\s+Defect|Defects?|Discrepancy|Discrepancies|Operational\\s+Impact|Structural\\s+Impact|Engineering\\s+Impact|Risk\\s+Assessment|Safety\\s+Impact|Technical\\s+Impact|Management\\s+Directive|Executive\\s+Directive|Management\\s+Override|Management\\s+Instruction|Director'?s?\\s+Override|Director'?s?\\s+Directive|Executive\\s+Instruction|Site\\s+Instruction|Liability\\s+Disclaimer|Disclaimer|Warranty\\s+Notice|Indemnity\\s+Clause|Indemnity|Legal\\s+Notice|Corrective\\s+Action|Mandatory\\s+Action|Action\\s+Required|Remedial\\s+Action|Resolution|Mitigation|Technical\\s+Evaluation|Technical\\s+Justification|Specification\\s+Reference|QA\\/QC\\s+Observation|Inspector\\s+Notes?|Notes?|Special\\s+Instructions?|Caveats?|Conditions?|Observations?|Root\\s+Cause|Justification|Disposition\\s+Notice|Testing\\s+Conditions?))(?:\\s*:\\s*|\\s*—\\s*|\\s*-\\s*)","gi"),c=Array.from(d.matchAll(h));if(c.length>=1){const b=[],f=c[0].index??0;if(f>0){const o=d.substring(0,f).trim();o&&b.push({category:"standard",header:"",content:o})}for(let o=0;o<c.length;o++){const m=c[o],p=m.index??0,x=m[0],N=m[1].trim(),T=c[o+1],R=T?T.index??d.length:d.length,g=d.substring(p+x.length,R).trim(),a=N.toLowerCase();let y="standard";a.includes("non-conformance")||a.includes("defect")||a.includes("discrepanc")?y="defect":a.includes("impact")||a.includes("risk")||a.includes("safety")?y="impact":a.includes("directive")||a.includes("override")||a.includes("instruction")?y="directive":a.includes("disclaimer")||a.includes("liability")||a.includes("indemnity")||a.includes("warranty")||a.includes("legal")?y="disclaimer":a.includes("action")||a.includes("remedial")||a.includes("corrective")||a.includes("resolution")||a.includes("mitigation")?y="action":(a.includes("note")||a.includes("observation")||a.includes("condition")||a.includes("caveat")||a.includes("evaluation")||a.includes("justification")||a.includes("root cause"))&&(y="note"),b.push({category:y,header:N,content:g})}return b}const S=d.split(/\n\s*\n|\r\n\s*\r\n|\n/).map(b=>b.trim()).filter(Boolean);return S.length===0?[{category:"standard",header:"",content:d}]:S.map(b=>{const f=b.match(/^([A-Za-z0-9\s/&'_-]{3,45}):\s+(.+)$/s);if(f){const o=f[1].trim(),m=f[2].trim(),p=o.toLowerCase();let x="note";return p.includes("defect")||p.includes("non-conformance")||p.includes("fail")||p.includes("error")||p.includes("discrepanc")?x="defect":p.includes("impact")||p.includes("risk")||p.includes("safety")?x="impact":p.includes("directive")||p.includes("override")||p.includes("instruction")?x="directive":p.includes("disclaimer")||p.includes("liability")||p.includes("indemnity")?x="disclaimer":(p.includes("action")||p.includes("required")||p.includes("remed"))&&(x="action"),{category:x,header:o,content:m}}return{category:"standard",header:"",content:b}})}function qt(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function Wt(t,d="No inspection observations or notes recorded."){const h=oe(t);return h.length===0?`<div style="font-size: 8px; color: #64748b; font-style: italic; line-height: 1.4;">${qt(d)}</div>`:h.length===1&&!h[0].header?`<div style="font-size: 8px; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">${qt(h[0].content)}</div>`:`
    <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
      ${h.map(c=>{let S="#f8fafc",b="#cbd5e1",f="3.5px solid #64748b",o="#e2e8f0",m="#334155",p="#cbd5e1";switch(c.category){case"defect":S="#fff5f5",b="#fecaca",f="3.5px solid #dc2626",o="#fee2e2",m="#991b1b",p="#fca5a5";break;case"impact":S="#fffbeb",b="#fef08a",f="3.5px solid #d97706",o="#fef3c7",m="#92400e",p="#fcd34d";break;case"directive":S="#faf5ff",b="#e9d5ff",f="3.5px solid #7c3aed",o="#f3e8ff",m="#581c87",p="#d8b4fe";break;case"disclaimer":S="#f8fafc",b="#cbd5e1",f="3.5px solid #334155",o="#e2e8f0",m="#0f172a",p="#94a3b8";break;case"action":S="#f0fdf4",b="#bbf7d0",f="3.5px solid #16a34a",o="#dcfce7",m="#166534",p="#86efac";break;case"note":S="#f0f9ff",b="#bae6fd",f="3.5px solid #0284c7",o="#e0f2fe",m="#0369a1",p="#7dd3fc";break;default:S="#ffffff",b="#e2e8f0",f="3px solid #94a3b8",o="#f1f5f9",m="#475569",p="#cbd5e1";break}return`
            <div style="background: ${S}; border: 1px solid ${b}; border-left: ${f}; border-radius: 4px; padding: 6px 8px; box-sizing: border-box; page-break-inside: avoid; break-inside: avoid;">
              ${c.header?`
                <div style="margin-bottom: 3.5px; display: flex; align-items: center; gap: 6px;">
                  <span style="display: inline-block; padding: 1.5px 6px; background: ${o}; color: ${m}; border: 1px solid ${p}; border-radius: 3px; font-weight: 800; font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.4px;">
                    ${qt(c.header)}
                  </span>
                </div>
              `:""}
              <div style="font-size: 8px; color: #1e293b; line-height: 1.5; white-space: pre-wrap; font-weight: ${c.category==="defect"||c.category==="directive"?"600":"400"};">
                ${qt(c.content)}
              </div>
            </div>
          `}).join("")}
    </div>
  `}const Ne=({text:t,fallback:d="No observations or details recorded.",className:h="",defaultCategory:c})=>{const S=oe(t);return S.length===0?ct.jsx("div",{className:`p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 italic text-xs ${h}`,children:d}):(S.length===1&&!S[0].header&&c&&(S[0].category=c),ct.jsx("div",{className:`space-y-2.5 ${h}`,children:S.map((b,f)=>{let o="bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 border-l-4 border-l-slate-500",m="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",p=ce;switch(b.category){case"defect":o="bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200 border-l-4 border-l-red-600",m="bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 border-red-300 dark:border-red-800",p=me;break;case"impact":o="bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 border-l-4 border-l-amber-500",m="bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800",p=he;break;case"directive":o="bg-purple-50/80 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/60 text-purple-900 dark:text-purple-200 border-l-4 border-l-purple-600",m="bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-800",p=be;break;case"disclaimer":o="bg-slate-100/90 dark:bg-slate-900/90 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 border-l-4 border-l-slate-700 dark:border-l-slate-400",m="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-400 dark:border-slate-600",p=ge;break;case"action":o="bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-l-4 border-l-emerald-600",m="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800",p=fe;break;case"note":o="bg-sky-50/80 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/60 text-sky-900 dark:text-sky-200 border-l-4 border-l-sky-500",m="bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-800",p=pe;break}return ct.jsxs("div",{className:`p-3.5 rounded-xl border shadow-sm transition ${o}`,children:[b.header&&ct.jsx("div",{className:"flex items-center gap-2 mb-1.5",children:ct.jsxs("span",{className:`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border font-mono ${m}`,children:[ct.jsx(p,{className:"w-3 h-3 shrink-0"}),ct.jsx("span",{children:b.header})]})}),ct.jsx("p",{className:"text-xs leading-relaxed whitespace-pre-wrap font-medium",children:b.content})]},f)})}))},Xt={"classic-executive":{id:"classic-executive",name:"Corporate Executive",tagline:"Signature Prestige & Gold Dossier",description:"Classic corporate look with bronze/warm gold accents, deep navy typography, and dual-tone hero cover.",accentColor:"#c28b5e",accentDark:"#9a6538",accentLight:"#fbf6f0",primaryHeaderBg:"#0f172a",headerTextColor:"#ffffff",cardBg:"#ffffff",cardBorder:"#e2e8f0",cardRadius:"6px",badgeBg:"#0f172a",badgeTextColor:"#ffffff",badgeBorder:"#0f172a",ruleColor:"#c28b5e",coverStyle:"split-bronze",fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",headingFont:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",tableHeaderBg:"#0f172a",tableHeaderTextColor:"#ffffff",tableBorderColor:"#e2e8f0",tableZebraBg:"#f8fafc",badgeApprovedBg:"#ecfdf5",badgeApprovedColor:"#059669",badgeApprovedBorder:"#a7f3d0",badgeRejectedBg:"#fef2f2",badgeRejectedColor:"#dc2626",badgeRejectedBorder:"#fecaca",badgePendingBg:"#f8fafc",badgePendingColor:"#64748b",badgePendingBorder:"#e2e8f0",previewThumbnailColor:"#c28b5e",previewBorderColor:"#d49a5b",cssVariables:{"--report-accent":"#c28b5e","--report-accent-dark":"#9a6538","--report-accent-light":"#fbf6f0","--report-header-bg":"#0f172a","--report-header-text":"#ffffff","--report-border":"#e2e8f0","--report-rule":"#c28b5e"}},"engineering-blueprint":{id:"engineering-blueprint",name:"Modern Blueprint",tagline:"Technical CAD & Engineering Azure",description:"A precision architectural aesthetic featuring technical cyan rules, dark blueprint header accents, and structural grid borders.",accentColor:"#0284c7",accentDark:"#0369a1",accentLight:"#f0f9ff",primaryHeaderBg:"#0c4a6e",headerTextColor:"#ffffff",cardBg:"#ffffff",cardBorder:"#bae6fd",cardRadius:"3px",badgeBg:"#0369a1",badgeTextColor:"#ffffff",badgeBorder:"#0284c7",ruleColor:"#0284c7",coverStyle:"blueprint-cad",fontFamily:"'Segoe UI', Roboto, -apple-system, sans-serif",headingFont:"'Segoe UI', Roboto, sans-serif",tableHeaderBg:"#0c4a6e",tableHeaderTextColor:"#ffffff",tableBorderColor:"#bae6fd",tableZebraBg:"#f0f9ff",badgeApprovedBg:"#ecfeff",badgeApprovedColor:"#0891b2",badgeApprovedBorder:"#a5f3fc",badgeRejectedBg:"#fff1f2",badgeRejectedColor:"#e11d48",badgeRejectedBorder:"#fecdd3",badgePendingBg:"#f8fafc",badgePendingColor:"#475569",badgePendingBorder:"#cbd5e1",previewThumbnailColor:"#0284c7",previewBorderColor:"#38bdf8",cssVariables:{"--report-accent":"#0284c7","--report-accent-dark":"#0369a1","--report-accent-light":"#f0f9ff","--report-header-bg":"#0c4a6e","--report-header-text":"#ffffff","--report-border":"#bae6fd","--report-rule":"#0284c7"}},"minimal-editorial":{id:"minimal-editorial",name:"Minimalist Editorial",tagline:"Swiss Clean Monochrome & Typography",description:"High-end Swiss editorial layout with charcoal accents, subtle hairline rules, generous white-space, and refined elegance.",accentColor:"#334155",accentDark:"#1e293b",accentLight:"#f8fafc",primaryHeaderBg:"#1e293b",headerTextColor:"#ffffff",cardBg:"#ffffff",cardBorder:"#cbd5e1",cardRadius:"0px",badgeBg:"#1e293b",badgeTextColor:"#ffffff",badgeBorder:"#1e293b",ruleColor:"#334155",coverStyle:"minimalist-clean",fontFamily:"system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",headingFont:"system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",tableHeaderBg:"#1e293b",tableHeaderTextColor:"#ffffff",tableBorderColor:"#e2e8f0",tableZebraBg:"#f8fafc",badgeApprovedBg:"#f1f5f9",badgeApprovedColor:"#0f172a",badgeApprovedBorder:"#94a3b8",badgeRejectedBg:"#fef2f2",badgeRejectedColor:"#b91c1c",badgeRejectedBorder:"#fca5a5",badgePendingBg:"#f8fafc",badgePendingColor:"#64748b",badgePendingBorder:"#e2e8f0",previewThumbnailColor:"#334155",previewBorderColor:"#64748b",cssVariables:{"--report-accent":"#334155","--report-accent-dark":"#1e293b","--report-accent-light":"#f8fafc","--report-header-bg":"#1e293b","--report-header-text":"#ffffff","--report-border":"#cbd5e1","--report-rule":"#334155"}},"industrial-safety":{id:"industrial-safety",name:"Industrial High-Vis",tagline:"Site Safety Amber & Charcoal Contrast",description:"Construction-grade visual format with high-contrast safety amber borders, bold uppercase typography, and prominent QA/QC status ribbons.",accentColor:"#d97706",accentDark:"#b45309",accentLight:"#fffbeb",primaryHeaderBg:"#18181b",headerTextColor:"#ffffff",cardBg:"#ffffff",cardBorder:"#fde68a",cardRadius:"8px",badgeBg:"#d97706",badgeTextColor:"#ffffff",badgeBorder:"#d97706",ruleColor:"#d97706",coverStyle:"industrial-bold",fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",headingFont:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",tableHeaderBg:"#18181b",tableHeaderTextColor:"#fde047",tableBorderColor:"#fde68a",tableZebraBg:"#fffbeb",badgeApprovedBg:"#ecfdf5",badgeApprovedColor:"#047857",badgeApprovedBorder:"#6ee7b7",badgeRejectedBg:"#fef2f2",badgeRejectedColor:"#b91c1c",badgeRejectedBorder:"#f87171",badgePendingBg:"#fffbeb",badgePendingColor:"#92400e",badgePendingBorder:"#fde68a",previewThumbnailColor:"#d97706",previewBorderColor:"#f59e0b",cssVariables:{"--report-accent":"#d97706","--report-accent-dark":"#b45309","--report-accent-light":"#fffbeb","--report-header-bg":"#18181b","--report-header-text":"#ffffff","--report-border":"#fde68a","--report-rule":"#d97706"}}},xe="classic-executive";function ue(t){return t in Xt?Xt[t]:Xt[xe]}const ve=`
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
`;function Z(t,d,h=""){const c=window.open("","_blank");if(!c){alert("Please allow popups to generate and print the quality document.");return}const S=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${t}</title>
  <style>
    ${ve}
    ${h}
  </style>
</head>
<body>
  <div class="page-container">
    ${d}
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
</html>`;c.document.open(),c.document.write(S),c.document.close()}const $=t=>{if(!t||t==="—")return"—";const d=t instanceof Date?t:new Date(t);return isNaN(d.getTime())?String(t):d.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})};function $e(t,d={},h={}){var R;const c=h.name,S=d.name,b=t.ptpNumber||`PTP-${Math.floor(1e3+Math.random()*9e3)}`,f=((R=t.checklistItems)!=null&&R.length?t.checklistItems:se()).map((g,a)=>{var y;return{cat:g.category||"General",param:g.label,status:g.status||(a===0&&((y=t.checklist)!=null&&y.rebarInspectionApproved),"PASS")}});(t.stakeholders||[]).filter(g=>g.required);const o=t.status==="REJECTED",p=(()=>{if(o)return[{role:"QA/QC Engineer",name:t.issuedByName,required:!0}];if(t.stakeholders&&t.stakeholders.length>0)return t.stakeholders;const g=t.requiredSignoffs,a=[{role:"QA/QC Engineer",name:t.issuedByName,required:!0}];return(!g||g.siteManager!==!1)&&a.push({role:"Site / Construction Manager",name:"",required:!0}),(!g||g.structuralConsultant!==!1)&&a.push({role:"Structural Consultant / Engineer",name:"",required:!0}),g!=null&&g.mechanicalEngineer&&a.push({role:"Mechanical Engineer",name:"",required:!1}),g!=null&&g.electricalEngineer&&a.push({role:"Electrical Engineer",name:"",required:!1}),a})(),x=t,N=`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${x.permitNumber} - Permit To Pour (PTP)</title>
      <style>
        * { box-sizing: border-box; }
        
        @page {
          size: A4 portrait;
          margin: 10mm 10mm 12mm 10mm;
          @bottom-left {
            content: "CONFIDENTIAL & PROPRIETARY — ${c}";
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
          border-left: 3px solid ${o?"#dc2626":"#ea580c"};
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
            ${K(h,d)}
          </td>
          <td style="width: 55%;">
            <div class="header-title">Official Permit To Pour (PTP) Authorization</div>
            <div class="header-sub">PROJECT: ${S}</div>
          </td>
          <td style="width: 25%;" class="meta-box">
            <strong>PTP Ref:</strong> <span style="color:#ea580c; font-weight:700;">${x.permitNumber}</span><br/>
            <strong>Scheduled Pour:</strong> ${$(x.pourDate)} (${x.pourTime})<br/>
            <strong>Status:</strong> <span class="${o?"status-rejected":"status-issued"}">${x.status||"ISSUED"}</span>
          </td>
        </tr>
      </table>

      ${o?`<div class="rejection-notice">
              <strong>POUR NOT PERMITTED:</strong> This Permit to Pour has been REJECTED due to failed hold point checks. Concrete casting is strictly prohibited. Corrective actions must be completed before re-inspection and re-issuance.
             </div>`:""}

      <div class="pdf-section">
        <div class="section-title">1.0 Structural Element & Location Parameters</div>
        <table class="section-table">
          <tr>
            <td class="lbl" style="width: 18%;">Building / Block:</td>
            <td class="val" style="width: 32%;">${x.building||"Main Structure"}</td>
            <td class="lbl" style="width: 18%;">Level / Floor:</td>
            <td class="val" style="width: 32%;">${x.floor||"—"}</td>
          </tr>
          <tr>
            <td class="lbl">Structural Element:</td>
            <td class="val"><strong>${x.elementName} ${x.elementId?`: ${x.elementId}`:""}</strong></td>
            <td class="lbl">Grid Axis / Zone:</td>
            <td class="val">${x.elementRef||x.zone||"—"}</td>
          </tr>
        </table>
      </div>

      <div class="pdf-section">
        <div class="section-title">2.0 Concrete Mix Specifications & Batching Logistics</div>
        <table class="section-table">
          <tr>
            <td class="lbl" style="width: 18%;">Specified Grade:</td>
            <td class="val" style="width: 32%;"><strong>${x.concreteGrade}</strong></td>
            <td class="lbl" style="width: 18%;">Est. Volume:</td>
            <td class="val" style="width: 32%;"><strong>${x.estimatedVolume} m³</strong></td>
          </tr>
          <tr>
            <td class="lbl">Batching Plant:</td>
            <td class="val">${x.supplier||"Approved Ready-Mix Supplier"}</td>
            <td class="lbl">Inspected By:</td>
            <td class="val">${x.issuedByName} (QA/QC Engineer)</td>
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
            ${f.map((g,a)=>`
              <tr>
                <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #64748b;">${a+1}</td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center;">
                  <span style="font-weight: 800; font-size: 8px; padding: 1px 4px; border-radius: 2px; ${g.status==="PASS"?"background: #dcfce7; color: #15803d;":g.status==="FAIL"?"background: #fee2e2; color: #b91c1c;":"background: #f1f5f9; color: #64748b;"}">${g.status}</span>
                </td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 700; color: #334155;">${g.cat}</td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 500; color: #0f172a;">${g.param}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="pdf-section">
        <div class="section-title">4.0 Statutory Authorizations & Stakeholder Sign-Off Block</div>
        <table class="section-table" style="margin-top: 4px;">
          ${p.reduce((g,a,y)=>{if(y%2===0){const l=p[y+1],n=T(a),s=l?T(l):'<td style="width: 50%; height: 75px; background: #fafafa; border: 1px dashed #cbd5e1;"></td>';g+=`<tr>${n}${s}</tr>`}return g},"")}
        </table>
      </div>

      <div class="footer-fallback">
        <span>CONFIDENTIAL — ${c}</span>
        <span>PTP Ref: ${x.permitNumber}</span>
      </div>

      <script>
        window.onload = () => {
          window.print();
        };
      <\/script>
    </body>
    </html>
  `;function T(g){const a=g.required?"#15803d":"#64748b",y=g.required?"REQUIRED":"OPTIONAL";return`
      <td style="width: 50%; height: 75px; vertical-align: top; padding: 6px 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span style="font-weight: 700; font-size: 8px; text-transform: uppercase; color: #ea580c;">${g.designation?`${g.designation} <span style="font-size: 7px; color: #64748b; font-weight: normal;">(${g.role})</span>`:g.role}</span>
          <span style="font-size: 6px; font-weight: 700; background: ${a}15; color: ${a}; padding: 1px 3px; border-radius: 2px;">${y}</span>
        </div>
        <div style="font-size: 8px; margin-bottom: 8px;">Name: <strong>${g.name||"__________________________________________________"}</strong></div>
        <div style="font-size: 8px; display: flex; justify-content: space-between;">
          <span>Sign: ________________________</span>
          <span>Date: ____ / ____ / 20__</span>
        </div>
      </td>
    `}Z(`${b} - Permit to Pour`,N)}function we(t,d={},h={}){var g;const c=h.name,S=d.companyName,b=t.ptpNumber||`PTP-${Math.floor(1e3+Math.random()*9e3)}`,f=((g=t.checklistItems)!=null&&g.length?t.checklistItems:se()).map((a,y)=>{var l;return{cat:a.category||"General",param:a.label,status:a.status||(y===0&&((l=t.checklist)!=null&&l.rebarInspectionApproved),"PASS")}}),o=t.status==="REJECTED",p=(()=>{if(o)return[{role:"QA/QC Engineer",name:t.issuedByName||"J. Oladejo",required:!0}];if(t.stakeholders&&t.stakeholders.length>0)return t.stakeholders.filter(l=>l.required);const a=t.requiredSignoffs,y=[{role:"QA/QC Engineer",name:t.issuedByName||"",required:!0}];return(!a||a.siteManager!==!1)&&y.push({role:"Site / Construction Manager",name:"",required:!0}),(!a||a.structuralConsultant!==!1)&&y.push({role:"Structural Consultant / Engineer",name:"",required:!0}),a!=null&&a.mechanicalEngineer&&y.push({role:"Mechanical Engineer",name:"",required:!0}),a!=null&&a.electricalEngineer&&y.push({role:"Electrical Engineer",name:"",required:!0}),y})(),x=`
    <div id="pdf-document" style="padding: 20px; font-family: Arial, sans-serif; color: #0f172a; background: #fff;">
      <!-- Header -->
      <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #0f172a; margin-bottom: 12px; background: #ffffff;">
        <tr>
          <td style="width: 22%; border: 1px solid #cbd5e1; padding: 6px; text-align: center; vertical-align: middle; background: #ffffff;">
            ${K(h,d)}
          </td>
          <td style="width: 53%; border: 1px solid #cbd5e1; padding: 6px; text-align: center; vertical-align: middle;">
            <div style="font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; color: #0f172a;">PERMIT TO POUR (PTP) AUTHORIZATION</div>
            <div style="font-size: 9.5px; font-weight: 700; color: #ea580c; margin-top: 2px; text-transform: uppercase;">PROJECT: ${S}</div>
            <div style="font-size: 7.5px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-top: 1px;">ISO 9001:2015 Clause 8.6 Release of Products & Services</div>
          </td>
          <td style="width: 25%; border: 1px solid #cbd5e1; padding: 6px; font-size: 8px; line-height: 1.5; color: #334155; vertical-align: middle;">
            <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${b}</span></div>
            <div><strong>Date:</strong> ${$(t.plannedPourDate)}</div>
            <div><strong>Status:</strong> <span style="display: inline-block; padding: 1px 6px; border-radius: 3px; font-weight: 800; font-size: 8px; text-transform: uppercase; ${o?"background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;":"background: #dcfce7; color: #15803d; border: 1px solid #86efac;"}">${t.status||"APPROVED"}</span></div>
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
          ${p.reduce((a,y,l)=>{if(l%2===0){const n=p[l+1],s=N(y),r=n?N(n):'<td style="width: 50%; height: 70px; background: #fafafa; border: 1px solid #e2e8f0;"></td>';a+=`<tr>${s}${r}</tr>`}return a},"")}
        </table>
      </div>

      <!-- Footer -->
      <div style="font-size: 8px; color: #64748b; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 5px; margin-top: 10px;">
        <div>CONFIDENTIAL & PROPRIETARY — ${c}</div>
        <div>Doc Ref: ${b}</div>
      </div>
    </div>
  `;function N(a){const y=a.required?"#15803d":"#64748b",l=a.required?"REQUIRED":"OPTIONAL";return`
      <td style="width: 50%; height: 70px; vertical-align: top; padding: 6px 8px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span style="font-weight: 700; font-size: 8px; text-transform: uppercase; color: #ea580c;">${a.designation?`${a.designation} <span style="font-size: 7px; color: #64748b; font-weight: normal;">(${a.role})</span>`:a.role}</span>
          <span style="font-size: 6px; font-weight: 700; background: ${y}15; color: ${y}; padding: 1px 3px; border-radius: 2px;">${l}</span>
        </div>
        <div style="font-size: 8px; margin-bottom: 8px;">Name: <strong>${a.name||"__________________________________________________"}</strong></div>
        <div style="font-size: 8px; display: flex; justify-content: space-between;">
          <span>Sign: ________________________</span>
          <span>Date: ____ / ____ / 20__</span>
        </div>
      </td>
    `}const T=document.createElement("div");T.innerHTML=x,document.body.appendChild(T);const R={margin:[10,10,10,10],filename:`${b}_PermitToPour.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:!0,logging:!1},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"}};le().set(R).from(T).toPdf().get("pdf").then(a=>{const y=a.internal.getNumberOfPages();for(let l=1;l<=y;l++)a.setPage(l),a.setFont("helvetica","normal"),a.setFontSize(6.5),a.setTextColor(100,116,139),a.text(`CONFIDENTIAL & PROPRIETARY — ${c}`,10,291),a.text(`PTP Ref: ${t.permitNumber}  |  Page ${l} of ${y}`,200,291,{align:"right"});a.save(`${b}.pdf`)}).catch(a=>{console.error("PDF generation failed:",a)}).finally(()=>{document.body.removeChild(T)})}function ye(t,d={},h={}){var g,a,y;const c=h.name||"Collection Developments LTD",S=d.name||"Bankside",b=t.inspectionNumber||`INSP-2026-${Math.floor(1e3+Math.random()*9e3)}`,f=t.items||[],o=f.filter(l=>l.result==="PASS").length,m=f.filter(l=>l.result==="FAIL").length,p=f.filter(l=>l.result==="OBSERVATION").length,N=(l=>{switch(l==null?void 0:l.toUpperCase()){case"APPROVED":case"CLOSED":return{bg:"#dcfce7",text:"#15803d",border:"#86efac"};case"PENDING_REVIEW":return{bg:"#fef3c7",text:"#b45309",border:"#fcd34d"};case"REJECTED":return{bg:"#fee2e2",text:"#b91c1c",border:"#fca5a5"};default:return{bg:"#f1f5f9",text:"#334155",border:"#cbd5e1"}}})(t.status),T=t.stakeholders&&t.stakeholders.length>0?t.stakeholders.filter(l=>l.required!==!1):[{role:"QA/QC Inspector",name:((g=t.inspector)==null?void 0:g.name)||t.inspectorName||"QA/QC Inspector",designation:((a=t.inspector)==null?void 0:a.designation)||"QA/QC Inspector",required:!0,signed:t.status==="APPROVED"||t.status==="CLOSED",signedAt:t.approvedAt?new Date(t.approvedAt).toISOString():void 0},{role:"Site / Construction Engineer",name:t.subcontractorRepresentative||"Site Engineer",designation:"Site Engineer",required:!0,signed:!1},{role:"Consultant / Resident Engineer",name:t.consultantRepresentative||"Resident Engineer",designation:"Consultant",required:!0,signed:!1}],R=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${K(h,d)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">FIELD INSPECTION & VERIFICATION REPORT</div>
          <div class="header-title-project">PROJECT: ${S}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.6 Monitoring & Measurement of Processes</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${b}</span></div>
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
          <td class="grid-value"><strong>${((y=t.inspector)==null?void 0:y.name)||t.inspectorName||"QA/QC Inspector"}</strong></td>
        </tr>
      </table>
    </div>

    <!-- 2.0 Hold Point Verification Checklist -->
    <div class="pdf-section">
      <div class="section-banner">2.0 TECHNICAL VERIFICATION CHECKPOINTS (${f.length} ITEMS | ${o} PASS, ${m} FAIL, ${p} OBS)</div>
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
          ${f.length>0?f.map((l,n)=>`
            <tr>
              <td style="text-align: center; font-weight: 700; color: #64748b;">${n+1}</td>
              <td style="text-align: center;">
                <span class="${l.result==="PASS"?"badge-pass":l.result==="FAIL"?"badge-fail":l.result==="OBSERVATION"?"badge-observation":"badge-na"}">${l.result||"PENDING"}</span>
              </td>
              <td style="font-weight: 700; color: #334155;">
                ${l.category||l.discipline||"Structural"}
                ${l.critical?'<br/><span class="badge-fail" style="font-size:6.5px; padding:0 3px;">CRITICAL</span>':""}
                ${l.isHoldPoint?'<br/><span class="badge-hold" style="font-size:6.5px; padding:0 3px;">HOLD POINT</span>':""}
              </td>
              <td>
                <div style="font-weight: 600; color: #0f172a;">${l.label}</div>
                ${l.acceptanceCriteria?`<div style="font-size: 7px; color: #64748b; margin-top: 1px; italic">Criteria: ${l.acceptanceCriteria}</div>`:""}
              </td>
              <td style="font-size: 7.2px; color: #475569;">${l.remarks||"—"}</td>
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
    ${f.some(l=>l.photos&&l.photos.length>0)?`
    <div class="pdf-section">
      <div class="section-banner">3.0 PHOTOGRAPHIC VERIFICATION RECORDS</div>
      <div class="photo-grid">
        ${f.flatMap(l=>(l.photos||[]).map(n=>({url:n,label:l.label}))).map((l,n)=>`
          <div class="photo-card">
            <span class="photo-tag">Photo #${n+1}</span>
            <div><img src="${l.url}" alt="Inspection Evidence" /></div>
            <div class="photo-caption">${l.label}</div>
          </div>
        `).join("")}
      </div>
    </div>
    `:""}

    <!-- 4.0 Statutory Sign-Off -->
    <div class="pdf-section">
      <div class="section-banner">4.0 STATUTORY WITNESS & VERIFICATION SIGN-OFF</div>
      <table class="signoff-table">
        ${(()=>{let l="";for(let s=0;s<T.length;s+=3){const r=T.slice(s,s+3),I=(100/Math.max(r.length,1)).toFixed(2);l+=`<tr>${r.map(C=>`
              <td style="width: ${I}%; vertical-align: top; padding: 6px 8px; border: 1px solid #cbd5e1; background: ${C.signed?"#f0fdf4":"#fafafa"};">
                <div class="sig-role-header">
                  <span>${C.designation?`${C.designation} (${C.role})`:C.role}</span>
                  <span class="sig-required-tag" style="font-size: 6.5px; font-weight: 700; background: ${C.required?"#dcfce7":"#f1f5f9"}; color: ${C.required?"#15803d":"#64748b"}; padding: 1px 4px; border-radius: 2px;">
                    ${C.required?"REQUIRED":"OPTIONAL"}
                  </span>
                </div>
                <div style="font-size: 8px; color: #334155; margin-bottom: 4px;">
                  Name: <strong>${C.name||"________________________"}</strong>
                </div>
                <div class="sig-line" style="border-bottom: 1px dashed #cbd5e1; margin: 4px 0;"></div>
                <div style="display: flex; justify-content: space-between; font-size: 7.2px; color: #64748b; margin-top: 3px;">
                  <span>${C.signed?'<strong style="color: #15803d;">✓ Digitally Signed</strong>':"Sign: ___________________"}</span>
                  <span>Date: ${C.signed&&C.signedAt?$(C.signedAt):C.signed?$(t.scheduledDate||t.createdAt):"____/____/20__"}</span>
                </div>
              </td>
            `).join("")}</tr>`}return l})()}
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${c}</div>
      <div>Inspection Ref: ${b}</div>
    </div>
  `;Z(`${b} - Inspection Report`,R)}const Oe=ye;function ie(t,d){if(!t||!t.trim())return`
      <div style="font-size: 7.5px; color: #64748b; margin-bottom: 3.5px;">
        <strong style="color: ${d.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 1.5px;">${d.title}:</strong>
        <span style="font-style: italic;">—</span>
      </div>
    `;const c=t.replace(/<br\s*\/?>/gi,`
`).split(/\r?\n/).map(f=>f.trim()).filter(Boolean);if(c.length===0)return`
      <div style="font-size: 7.5px; color: #64748b; margin-bottom: 3.5px;">
        <strong style="color: ${d.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 1.5px;">${d.title}:</strong>
        <span style="font-style: italic;">—</span>
      </div>
    `;if(c.length===1)return`
      <div style="font-size: 7.5px; color: ${d.textColor||"#0f172a"}; margin-bottom: 3.5px;">
        <strong style="color: ${d.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 1.5px;">${d.title}:</strong>
        <div style="white-space: pre-line; line-height: 1.45;">${c[0]}</div>
      </div>
    `;const S=c.every(f=>/^(\d+[\.\)]|[a-zA-Z][\.\)]|[-•*])\s*/.test(f)),b=c.map((f,o)=>`
        <div style="display: flex; align-items: flex-start; line-height: 1.4; margin-bottom: 2.5px;">
          ${S?"":`<span style="font-weight: 700; color: ${d.bulletColor||d.titleColor}; margin-right: 4px; min-width: 13px; display: inline-block;">${o+1}.</span>`}
          <span style="flex: 1; white-space: pre-line;">${f}</span>
        </div>
      `).join("");return`
    <div style="font-size: 7.5px; color: ${d.textColor||"#0f172a"}; margin-bottom: 4px;">
      <strong style="color: ${d.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 2px;">${d.title}:</strong>
      <div style="padding-left: 1px;">
        ${b}
      </div>
    </div>
  `}function De(t,d={},h={}){var T,R,g,a,y,l;const c=(g=(R=(T=ae)==null?void 0:T.getState)==null?void 0:R.call(T))==null?void 0:g.activeProject,b=(((l=(y=(a=ae)==null?void 0:a.getState)==null?void 0:y.call(a))==null?void 0:l.projects)||[]).find(n=>n.id===(t.projectId||t.project)),f=(h==null?void 0:h.name)||t.companyName||"Collection Developments LTD",o=(d==null?void 0:d.name)||t.projectName||t.projectTitle||(b==null?void 0:b.name)||(c==null?void 0:c.name)||"Site Construction Operations",m=t.reportNumber||`QC-COMM-${Math.floor(1e3+Math.random()*9e3)}`,p=t.observations||[],x=p.filter(n=>n.status!=="CLOSED"&&n.status!=="Compliant"&&n.status!=="RECTIFIED").length,N=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${K(h,d)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">SITE COMMENTS & FIELD OBSERVATIONS REPORT</div>
          <div class="header-title-project">PROJECT: ${o}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.5 & 8.7 Nonconformity Identification</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${m}</span></div>
          <div><strong>Date:</strong> ${$(t.inspectionDate||t.createdAt)}</div>
          <div><strong>Status:</strong> <span class="${x===0?"badge-pass":"badge-pending"}">${x===0?"ALL CLOSED":`${x} ACTION(S) PENDING`}</span></div>
        </td>
      </tr>
    </table>

    <!-- 1.0 Report Overview -->
    <div class="pdf-section">
      <div class="section-banner">1.0 GENERAL REPORT PARAMETERS & AUDIT CONTEXT</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 18%;">Project Name:</td>
          <td class="grid-value" style="width: 32%;">${o}</td>
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
      <div class="section-banner">2.0 QUALITY OBSERVATIONS & CORRECTIVE DIRECTIVES (${p.length} OBSERVATIONS)</div>
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
          ${p.length>0?p.map((n,s)=>{const r=n.comments||n.observationText||n.fieldObservation||"—",I=n.correctiveDirective||"Rectify per approved engineering specifications.",C=n.status==="CLOSED"||n.status==="Compliant"||n.status==="RECTIFIED";return`
            <tr>
              <td style="text-align: center; font-weight: 700; color: #64748b;">${s+1}</td>
              <td>
                <div style="font-weight: 700; color: #0f172a;">${n.levelName||"Site Area"}</div>
                ${n.structuralElement?`<div style="font-size: 7.2px; font-weight: 600; color: #ea580c;">${n.structuralElement}</div>`:""}
                ${n.gridLocation?`<div style="font-size: 7px; color: #64748b;">Grid: ${n.gridLocation}</div>`:""}
                <div style="font-size: 7px; color: #475569; margin-top: 2px;"><strong>Trade:</strong> ${n.tradeName||n.trade||"Civil"}</div>
              </td>
              <td>
                ${ie(r,{title:"Observed Condition",titleColor:"#991b1b",bulletColor:"#991b1b",textColor:"#0f172a"})}
                ${ie(I,{title:"Corrective Directive",titleColor:"#15803d",bulletColor:"#15803d",textColor:"#166534"})}
                <div style="font-size: 7px; color: #64748b; margin-top: 2px;">
                  Assigned To: <strong>${n.assignedTo||n.assignedSubcontractor||"Contractor"}</strong>
                  ${n.dueDate?` | Target Due: ${$(n.dueDate)}`:""}
                </div>

                ${n.photos&&n.photos.length>0?`
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; padding-top: 3px; border-top: 1px dashed #cbd5e1;">
                  ${n.photos.map((O,_)=>{const D=typeof O=="string"?O:(O==null?void 0:O.url)||(O==null?void 0:O.thumbnailUrl);return D?`<img src="${D}" style="height: 50px; max-width: 80px; object-fit: cover; border-radius: 2px; border: 1px solid #cbd5e1;" alt="Photo ${_+1}" />`:""}).join("")}
                </div>
                `:""}
              </td>
              <td style="text-align: center;">
                <span class="${C?"badge-pass":"badge-pending"}">${n.status||"OPEN"}</span>
                <div style="margin-top: 2px;">
                  <span class="${n.severity==="CRITICAL"?"badge-fail":n.severity==="HIGH"?"badge-pending":"badge-pass"}" style="font-size: 6.5px;">${n.severity||"MEDIUM"}</span>
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
      <div>Report Ref: ${m}</div>
    </div>
  `;Z(`${m} - Site Comments`,N)}function Pe(t,d={},h={}){var o,m,p,x,N,T,R,g;const c=h.name||"Collection Developments LTD",S=d.name||"Bankside",b=t.rfiNumber||`RFI-2026-${Math.floor(1e3+Math.random()*9e3)}`,f=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${K(h,d)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">REQUEST FOR INFORMATION (RFI)</div>
          <div class="header-title-project">PROJECT: ${S}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.2 Design & Engineering Communications</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${b}</span></div>
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
          <td class="grid-value">${((o=t.raisedBy)==null?void 0:o.name)||"Site Engineer"} (${((m=t.raisedBy)==null?void 0:m.role)||"Main Contractor"})</td>
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
      <div class="section-banner">4.0 CONSULTANT FORMAL RESPONSE & DIRECTIVE [${((p=t.response)==null?void 0:p.approvalStatus)||"UNDER REVIEW"}]</div>
      <div class="box-content">
        <div style="line-height: 1.45; color: #0f172a; margin-bottom: 6px;">
          ${((x=t.response)==null?void 0:x.responseText)||"Official response is currently being finalized by the engineering design consultant."}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #475569; border-top: 1px solid #f1f5f9; padding-top: 4px;">
          <span>Reviewed By: <strong>${((N=t.response)==null?void 0:N.responderName)||t.assignedConsultant||"Consultant"}</strong></span>
          <span>Response Date: <strong>${$((T=t.response)==null?void 0:T.responseDate)}</strong></span>
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
              <span>Date: ${$(t.createdAt)}</span>
            </div>
          </td>
          <td style="width: 50%;">
            <div class="sig-role-header"><span>CONSULTANT / LEAD ENGINEER</span><span class="sig-required-tag">REQUIRED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${t.assignedConsultant||"Lead Consultant"}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${$((g=t.response)==null?void 0:g.responseDate)}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${c}</div>
      <div>RFI Ref: ${b}</div>
    </div>
  `;Z(`${b} - Technical RFI`,f)}function _e(t,d={},h={}){var x,N,T,R,g;const c=h.name||"Collection Developments LTD",S=d.name||"Bankside",b=t.marNumber||`MAR-2026-${Math.floor(1e3+Math.random()*9e3)}`,f=t.submittedByName||(typeof t.submittedBy=="string"?t.submittedBy:"QA/QC Materials Lead"),o=((x=t.reviewedBy)==null?void 0:x.name)||((N=t.response)==null?void 0:N.respondedByName)||t.assignedConsultantName||"Materials Consultant",m=((T=t.reviewedBy)==null?void 0:T.date)||((R=t.response)==null?void 0:R.responseDate)||(t.updatedAt?$(t.updatedAt):$(t.createdAt)),p=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${K(h,d)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">MATERIAL APPROVAL REQUEST (MAR)</div>
          <div class="header-title-project">PROJECT: ${S}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.4 Control of Externally Provided Products & Services</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${b}</span></div>
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
          <td class="grid-value">${f}</td>
          <td class="grid-label">CONSULTANT REVIEWER:</td>
          <td class="grid-value"><strong>${o}</strong></td>
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
          ${t.reviewComments||((g=t.response)==null?void 0:g.responseText)||"Submittal is in accordance with project specifications."}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #475569; border-top: 1px solid #f1f5f9; padding-top: 4px;">
          <span>Review Status: <strong>${t.status||"APPROVED"}</strong></span>
          <span>Review Date: <strong>${m}</strong></span>
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
              <span>Date: ${$(t.createdAt)}</span>
            </div>
          </td>
          <td style="width: 50%;">
            <div class="sig-role-header"><span>CONSULTANT / MATERIALS ENGINEER</span><span class="sig-required-tag">REQUIRED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${o}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${m}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${c}</div>
      <div>MAR Ref: ${b}</div>
    </div>
  `;Z(`${b} - Material Approval Request`,p)}function Le(t,d={},h={}){var T,R,g,a,y,l;const c=h.name||" ",S=d.name||" ",b=t.sampleNumber||t.sampleId||`CUBE-${Math.floor(1e3+Math.random()*9e3)}`,f=t.target28DayStrengthNmm2||t.day28Required||(t.targetStrength?parseFloat(t.targetStrength):0)||30,o=[],m=[{age:1,title:"1-Day Test",resArray:t.day1Results,testSummary:(T=t.tests)==null?void 0:T.day1,req:t.day1Required,defaultTargetRatio:.2,dateField:t.day1Date},{age:3,title:"3-Day Test",resArray:t.day3Results,testSummary:(R=t.tests)==null?void 0:R.day3,req:t.day3Required,defaultTargetRatio:.45,dateField:t.day3Date},{age:7,title:"7-Day Test",resArray:t.day7Results,testSummary:(g=t.tests)==null?void 0:g.day7,req:t.day7Required,defaultTargetRatio:.7,dateField:t.day7Date},{age:14,title:"14-Day Test",resArray:t.day14Results,testSummary:(a=t.tests)==null?void 0:a.day14,req:t.day14Required,defaultTargetRatio:.85,dateField:t.day14Date},{age:28,title:"28-Day Test",resArray:t.day28Results,testSummary:(y=t.tests)==null?void 0:y.day28,req:t.day28Required,defaultTargetRatio:1,dateField:t.day28Date}];for(const n of m){const s=n.req||Math.round(f*n.defaultTargetRatio*10)/10;if(n.resArray&&n.resArray.length>0){const r=n.resArray[0];o.push({age:n.age,title:n.title,testDate:r.testDate||n.dateField||t.castDate,targetStrength:s,averageStrength:r.averageStrength||0,maximumStrength:r.maximumStrength,minimumStrength:r.minimumStrength,standardDeviation:r.standardDeviation,status:r.status||(r.averageStrength>=s?"PASS":"FAIL"),technician:r.technician||t.preparedBy||"Materials Technician",testingStandard:r.testingStandard||"BS EN 12390-3",cubes:r.cubes||[]})}else if(n.testSummary){const r=n.testSummary,I=r.averageStrengthNmm2??r.compressiveStrengthNmm2??0;o.push({age:n.age,title:n.title,testDate:r.actualTestDate||r.testDate||r.scheduledDate||n.dateField||t.castDate,targetStrength:r.requiredStrengthNmm2||r.targetStrengthNmm2||s,averageStrength:I,maximumStrength:I,minimumStrength:I,standardDeviation:0,status:r.compliance||(I>=s?"PASS":"FAIL"),technician:r.testedBy||r.labTechnician||t.preparedBy||"Materials Technician",testingStandard:"BS EN 12390-3",cubes:(r.cubes||r.individualResults||[]).map((C,O)=>({id:O+1,load:C.failureLoadKn||C.crushingLoadKn||r.crushingLoadKn||"—",strength:C.compressiveStrengthNmm2||I,failureMode:C.typeOfFailure||C.failureMode||"Satisfactory",cubeWeight:C.weightKg||""}))})}}const p=o.find(n=>n.age===28),x=p?p.status==="PASS"||p.averageStrength>=p.targetStrength:null,N=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${K(h,d)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">CONCRETE COMPRESSIVE STRENGTH TEST CERTIFICATE</div>
          <div class="header-title-project">PROJECT: ${S}</div>
          <div class="header-title-iso">BS EN 12390-3 / ASTM C39 Compressive Strength Quality Verification</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${b}</span></div>
          ${t.inscribedName?`<div><strong>Inscribed Mark:</strong> <span style="font-weight:700; color:#0f172a;">${t.inscribedName}</span></div>`:""}
          <div><strong>Cast Date:</strong> ${t.castDate||$(t.castDate)}</div>
          <div><strong>Status:</strong> <span class="${t.status==="APPROVED"||x?"badge-pass":x===!1||t.status==="NCR_ISSUED"||t.status==="REJECTED"?"badge-fail":"badge-pending"}">${t.status||(x?"28D COMPLIANT":"IN PROGRESS")}</span></div>
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
          <td class="grid-value">Start: ${$(t.curingStartDate||t.castDate)} ${t.removedFromTankDate?`• Out: ${$(t.removedFromTankDate)}`:""}</td>
        </tr>
      </table>
    </div>

    <!-- 3.0 Multi-Cube Crushing Results -->
    <div class="pdf-section">
      <div class="section-banner">3.0 LABORATORY COMPRESSION CRUSHING LOG & STRENGTH STATISTICAL EVALUATION</div>
      ${o.length>0?o.map(n=>{const s=n.status==="PASS"||n.averageStrength>=n.targetStrength;return`
        <div style="margin-bottom: 8px; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden;">
          <div style="background: #f8fafc; padding: 4px 8px; font-weight: 700; font-size: 8px; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0;">
            <span>${n.title.toUpperCase()} (Test Date: ${$(n.testDate)}) — Standard: ${n.testingStandard}</span>
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
              ${n.cubes.length>0?n.cubes.map(r=>`
                <tr>
                  <td style="text-align: center; font-weight: 700; color: #0f172a;">Cube #${r.id}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 700;">${r.load||"—"}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 800; color: ${s?"#15803d":"#b91c1c"};">${r.strength||"—"}</td>
                  <td style="color: #475569; font-size: 7.2px;">${r.failureMode||"Cone Failure (Satisfactory)"}</td>
                  <td style="text-align: right; font-family: monospace; color: #64748b;">${r.cubeWeight||"—"}</td>
                </tr>
              `).join(""):`
                <tr>
                  <td colspan="5" style="text-align: center; color: #64748b; padding: 6px;">Individual load readings recorded directly in laboratory register.</td>
                </tr>
              `}
              <tr style="background: #f1f5f9; font-weight: 700;">
                <td colspan="2" style="font-size: 7.5px;">AVERAGE: <strong style="font-size: 8.5px; color: ${s?"#15803d":"#b91c1c"}; font-family: monospace;">${n.averageStrength} MPa</strong> (Target: ${n.targetStrength} MPa)</td>
                <td colspan="2" style="font-size: 7.2px; color: #475569;">Min: ${n.minimumStrength??n.averageStrength} MPa • Max: ${n.maximumStrength??n.averageStrength} MPa • SD: ${n.standardDeviation??"—"}</td>
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
              <span>Date: ${$(t.preparedByDate||((l=o[0])==null?void 0:l.testDate)||t.castDate)}</span>
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
      <div>CONFIDENTIAL & PROPRIETARY — ${c}</div>
      <div>Certificate Ref: ${b}</div>
    </div>
  `;Z(`${b} - Cube Test Certificate`,N)}function ke(t,d={},h={},c){var Et,Tt,St,Ct,It,Rt;const S=h.name||"Collection Developments LTD",b=h.legalName||(h==null?void 0:h.companyName)||"Collection Developments Limited",f=h.logoUrl||h.logo||(h==null?void 0:h.logoBase64)||t.logoBase64||"",o=d.name||t.projectName||"BANKSIDE",m=t.reportNumber||`WQR-2026-${Math.floor(1e3+Math.random()*9e3)}`,p=(c==null?void 0:c.includeNcrs)!==void 0?c.includeNcrs:(c==null?void 0:c.includeNcrsAndComments)!==void 0?c.includeNcrsAndComments:t.includeNcrs!==void 0?t.includeNcrs:t.includeNcrsAndComments!==!1,x=(c==null?void 0:c.includeSiteComments)!==void 0?c.includeSiteComments:(c==null?void 0:c.includeNcrsAndComments)!==void 0?c.includeNcrsAndComments:t.includeSiteComments!==void 0?t.includeSiteComments:t.includeNcrsAndComments!==!1,N=(c==null?void 0:c.includeSiteInstructions)!==void 0?c.includeSiteInstructions:t.includeSiteInstructions!==!1;function T(e){if(!e)return"";if(typeof e=="string"){const i=e.trim();if(/^\d{4}-\d{2}-\d{2}$/.test(i))return i;const v=new Date(i);return isNaN(v.getTime())?i:v.toISOString().split("T")[0]}return typeof e=="number"?new Date(e).toISOString().split("T")[0]:e instanceof Date&&!isNaN(e.getTime())?e.toISOString().split("T")[0]:""}function R(){try{const e=Zt.getState().currentUser;return(e==null?void 0:e.email)||""}catch{return""}}const g=t.startDate||t.weekStart||"",a=t.endDate||t.weekEnd||"",y=T(g)||"—",l=T(a)||"—",n=l!=="—"?l:T(t.reportDate||t.createdAt)||T(new Date),s=typeof t.preparedBy=="object"&&t.preparedBy?t.preparedBy:{name:typeof t.preparedBy=="string"?t.preparedBy:"",designation:"QA/QC ENGINEER",role:"QA/QC ENGINEER"},r=s.name||((Et=Zt.getState().currentUser)==null?void 0:Et.fullName)||((Tt=Zt.getState().currentUser)==null?void 0:Tt.displayName)||"Authorized QA/QC Engineer",I=s.designation||s.role||"QA/QC ENGINEER",C=s.email||R()||"—";s.signed;const O=s.signatureUrl||"",_=(t.cubeTests&&t.cubeTests.length>0?t.cubeTests:t.filteredCubeTests)||[],D=t.quantitySummary||[],V=t.mepClearance||[],j=(t.materialDeliveries&&t.materialDeliveries.length>0?t.materialDeliveries:t.filteredMaterialDeliveries)||[],Y=(t.ncrRemediationLog&&t.ncrRemediationLog.length>0?t.ncrRemediationLog:t.filteredNcrs)||t.ncr||[],z=(t.siteComments&&t.siteComments.length>0?t.siteComments:t.filteredSiteComments)||t.filteredFindings||[],P=(t.siteInstructions&&t.siteInstructions.length>0?t.siteInstructions:t.filteredSiteInstructions)||[],st=t.projectCoverImageUrl||t.coverImageUrl||t.coverImageBase64||d.coverImageUrl||d.imageUrl||(d==null?void 0:d.image)||(t==null?void 0:t.projectImage)||"",X=(t.pictorialUrls||[]).filter(e=>{const i=typeof e=="string"?e:e==null?void 0:e.url;return!!(i&&typeof i=="string"&&i.trim().length>0)}),pt=t.beamLayoutImg,ft=t.columnLayoutImg,Ot=t.slabImg,tt=t.structuralElements||[],Dt=tt.filter(e=>(e.elementType||e.type||e.element||"").toLowerCase().includes("column")),Pt=tt.filter(e=>(e.elementType||e.type||e.element||"").toLowerCase().includes("beam")),_t=tt.filter(e=>(e.elementType||e.type||e.element||"").toLowerCase().includes("slab")),q=(t.selectedLevel||t.selectedLevelName||"—").toUpperCase();let et=0,at=0;D.length>0?D.forEach(e=>{const i=parseFloat(String(e.calculatedVolume??e.plannedVolume??e.scope??0))||0,v=parseFloat(String(e.achievedVolume??e.actualVolume??0))||0;et+=i,at+=v}):tt.length>0&&tt.forEach(e=>{const i=parseFloat(String(e.calculatedVolume||e.volume||0))||0,v=parseFloat(String(e.achievedVolume??e.completedVolume??0))||0;et+=i,at+=v}),et===0&&t.totalVolumeCalculated&&(et=Number(t.totalVolumeCalculated)||0),at===0&&t.totalVolumeAchieved&&(at=Number(t.totalVolumeAchieved)||0);const Lt=et>0?Math.round(at/et*100):0,gt=(((St=t.ncrStats)==null?void 0:St.openTotal)??0)+z.filter(e=>{const i=String(e.status||"").toLowerCase();return i.includes("non")||i.includes("open")||i.includes("progress")||i.includes("pending")}).length,kt=t.overallQualityCompliance!==void 0&&t.overallQualityCompliance!==null?Number(t.overallQualityCompliance):((Ct=t.metrics)==null?void 0:Ct.inspectionPassRate)!==void 0&&((It=t.metrics)==null?void 0:It.inspectionPassRate)!==null?Number(t.metrics.inspectionPassRate):100,Mt=(c==null?void 0:c.templateId)||t.templateId||"classic-executive",u=ue(Mt),zt=()=>`
    <div style="display: flex; align-items: center; gap: 6px;">
      ${f?`<img src="${f}" style="max-height: 22px; max-width: 80px; object-fit: contain;" alt="Logo" />`:`
          <div style="display: flex; gap: 2px; align-items: flex-end; height: 16px;">
            <span style="width: 3.5px; height: 9px; background: ${u.accentColor}; border-radius: 1px;"></span>
            <span style="width: 3.5px; height: 16px; background: ${u.accentColor}; border-radius: 1px;"></span>
            <span style="width: 3.5px; height: 12px; background: ${u.accentColor}; border-radius: 1px;"></span>
          </div>
          <span style="font-size: 8.5px; font-weight: 900; color: #0f172a; letter-spacing: 0.8px; text-transform: uppercase;">COLLECTION</span>
        `}
    </div>
  `,B=e=>`
    <div class="pdf-header">
      <div class="pdf-header-top">
        <div style="display: flex; align-items: center; gap: 8px;">
          ${zt()}
          <div style="font-size: 8.5px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 6px; letter-spacing: 0.2px;">
            <span>${n}</span>
            <span style="color: #cbd5e1;">|</span>
            <span style="color: ${u.accentColor}; font-weight: 800;">QA/QC SURVEILLANCE</span>
            <span style="color: #cbd5e1;">|</span>
            <span style="font-weight: 800; color: #0f172a; text-transform: uppercase;">${e}</span>
          </div>
        </div>
        <div style="font-size: 8.5px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase;">
          <span style="color: #0f172a;">${o.toUpperCase()}</span> &nbsp;|&nbsp; <span style="color: ${u.accentColor}; font-weight: 800;">${u.name.toUpperCase()}</span> &nbsp;|&nbsp; <span style="color: #94a3b8;">CONFIDENTIAL</span>
        </div>
      </div>
      <div class="pdf-header-rule" style="background: ${u.ruleColor}; height: 2px;"></div>
    </div>
  `,G=e=>`
    <div class="pdf-footer" style="border-top: 1px solid ${u.cardBorder};">
      <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">
        Compiled By: <strong style="color: #475569;">${r} (${I})</strong> &nbsp;|&nbsp; ISO 9001:2015 Quality Management System &nbsp;|&nbsp; <span style="color: ${u.accentColor}; font-weight: 700;">Theme: ${u.name}</span>
      </div>
      <div class="pdf-slide-badge" style="background: ${u.badgeBg}; color: ${u.badgeTextColor}; border: 1px solid ${u.badgeBorder}; border-radius: ${u.cardRadius};">
        SLIDE ${String(e).padStart(2,"0")}
      </div>
    </div>
  `,w=[];w.push(`
    <div class="pdf-sheet" style="padding: 0; display: flex; flex-direction: row; height: 210mm; overflow: hidden; position: relative;">
      <!-- Left Hero Column (~46% width) -->
      <div style="width: 46%; padding: 24mm 14mm 16mm 16mm; display: flex; flex-direction: column; justify-content: space-between; background: #ffffff; position: relative; border-right: 3px solid ${u.accentColor};">
        <div>
          <!-- Company Brand Header -->
          <div style="margin-bottom: 22px;">
            <div style="display: flex; align-items: flex-end; gap: 2px; margin-bottom: 4px;">
              ${f?`<img src="${f}" style="max-height: 120px; max-width: 190px; object-fit: contain;" alt="${S}" />`:`
                <div style="display: flex; gap: 3px; align-items: flex-end; height: 26px;">
                  <span style="width: 5px; height: 14px; background: ${u.accentColor}; border-radius: 1px;"></span>
                  <span style="width: 5px; height: 24px; background: ${u.accentColor}; border-radius: 1px;"></span>
                  <span style="width: 5px; height: 18px; background: ${u.accentColor}; border-radius: 1px;"></span>
                </div>
              `}
            </div>
            <div style="font-size: 13px; font-weight: 900; color: #0f172a; letter-spacing: 1.5px; text-transform: uppercase;">
              ${S.toUpperCase()}
            </div>
          </div>

          <!-- Project Title & Divider -->
          <div style="margin-bottom: 18px;">
            <div style="font-size: 34px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; text-transform: uppercase; line-height: 1.05;">
              ${o.toUpperCase()}
            </div>
            <div style="width: 100%; height: 2px; background: ${u.accentColor}; margin-top: 14px;"></div>
          </div>

          <!-- Report Title -->
          <div style="font-size: 19px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.3px; margin-bottom: 12px;">
            ${t.title||"QA/QC WEEKLY REPORT"}
          </div>

          <!-- Surveillance Level Tag -->
          <div style="display: inline-block; background: ${u.accentLight}; color: ${u.accentDark}; font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: ${u.cardRadius}; border: 1px solid ${u.cardBorder}; text-transform: uppercase; margin-bottom: 12px;">
            SURVEILLANCE: ${q}
          </div>
          <div></div>

          <!-- Date Range Pill -->
          <div style="display: inline-block; background: #FFFFFF; border: 1.5px solid ${u.accentColor}; color: ${u.accentDark}; font-size: 10.5px; font-weight: 800; padding: 6px 22px; border-radius: 9999px; letter-spacing: 0.5px; text-transform: uppercase;">
            ${y} &nbsp;TO&nbsp; ${l}
          </div>

          <div style="margin-top: 10px;">
            <span style="display: inline-block; font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px;">
              Theme: ${u.name} • ${u.tagline}
            </span>
          </div>
        </div>

        <!-- Compiler Card (Bottom Left) -->
        <div style="background: #ffffff; border: 1px solid ${u.cardBorder}; border-left: 4px solid ${u.accentColor}; border-radius: ${u.cardRadius}; padding: 12px 16px; margin-top: auto;">
          <div style="font-size: 7.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
            AUTHORIZED COMPILER &amp; QA/QC OFFICER
          </div>
          <div style="font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 3px;">
            ${r}
          </div>
          <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 1px;">
            ${I}
          </div>
        </div>
      </div>

      <!-- Right Column (~54% width) Full-Bleed Cover Image -->
      <div style="width: 54%; height: 100%; background: #0f172a; overflow: hidden; position: relative;">
        ${st?`<img src="${st}" style="width: 100%; height: 100%; object-fit: cover;" alt="${o}" />`:`
          <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
            <div style="text-align: center; color: #ffffff; padding: 30px;">
              <div style="font-size: 36px; font-weight: 900; color: #c28b5e;">${o.toUpperCase()}</div>
              <div style="font-size: 12px; color: #94a3b8; font-weight: 700; margin-top: 8px;">OFFICIAL QA/QC SURVEILLANCE DOSSIER</div>
            </div>
          </div>
        `}
      </div>
    </div>
  `),w.push(`
    <div class="pdf-sheet">
      <div>
        ${B("EXECUTIVE SUMMARY: OPERATIONAL OVERVIEW")}
        
        <!-- 4 Top Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px;">
          <!-- Card 1: Total Scope Volume -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #0f172a; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL SCOPE VOLUME</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${et.toLocaleString(void 0,{maximumFractionDigits:1})} m³</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">Design Volume Target</div>
          </div>

          <!-- Card 2: Achieved Volume -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #0284c7; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">ACHIEVED VOLUME</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${at.toLocaleString(void 0,{maximumFractionDigits:1})} m³</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">${Lt}% Cumulative</div>
          </div>

          <!-- Card 3: Quality Compliance -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #16a34a; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">QUALITY COMPLIANCE</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${kt}%</div>
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
      ${G(w.length+1)}
    </div>
  `);const mt=e=>{const i=e&&e.trim().length>0?e.trim():"";return i?i.split(/\n\s*\n|\n/).map(E=>E.trim()).filter(Boolean).map(E=>{if(E.includes(":")){const A=E.split(":"),k=A[0].trim(),Q=A.slice(1).join(":").trim();return`
            <div style="margin-bottom: 12px;">
              <strong style="color: #0f172a; font-weight: 800;">${k}:</strong> ${Q}
            </div>
          `}return`<div style="margin-bottom: 10px;">${E}</div>`}).join(""):""};w.push(`
    <div class="pdf-sheet">
      <div>
        ${B("EXECUTIVE SUMMARY: STRATEGIC INSIGHTS")}
        
        <!-- 3 Columns Grid -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; min-height: 420px;">
          <!-- Column 1: Highlights -->
          <div style="display: flex; flex-direction: column;">
            <div style="background: #16a34a; color: #ffffff; text-align: center; padding: 10px 12px; font-weight: 800; font-size: 10.5px; border-radius: 4px 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
              KEY PROJECT HIGHLIGHTS
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 16px; font-size: 9px; line-height: 1.5; color: #334155; background: #ffffff;">
              ${mt(t.highlights)}
            </div>
          </div>

          <!-- Column 2: Risks & Concerns -->
          <div style="display: flex; flex-direction: column;">
            <div style="background: #d97706; color: #ffffff; text-align: center; padding: 10px 12px; font-weight: 800; font-size: 10.5px; border-radius: 4px 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
              CRITICAL RISKS &amp; OPEN CONCERNS
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 16px; font-size: 9px; line-height: 1.5; color: #334155; background: #ffffff;">
              ${mt(t.concerns)}
            </div>
          </div>

          <!-- Column 3: Look-Ahead Plan -->
          <div style="display: flex; flex-direction: column;">
            <div style="background: #4f46e5; color: #ffffff; text-align: center; padding: 10px 12px; font-weight: 800; font-size: 10.5px; border-radius: 4px 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
              LOOK-AHEAD PLAN &amp; ACTION TARGETS
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 16px; font-size: 9px; line-height: 1.5; color: #334155; background: #ffffff;">
              ${mt(t.nextWeekPlan)}
            </div>
          </div>
        </div>
      </div>
      ${G(w.length+1)}
    </div>
  `);const vt=_,Ut=vt.length>0?vt.map((e,i)=>{var Q,F,H,W;const v=e.strength7Days||((F=(Q=e.day7Results)==null?void 0:Q[0])!=null&&F.averageStrength?`${e.day7Results[0].averageStrength} N/mm²`:"—"),E=e.strength28Days||((W=(H=e.day28Results)==null?void 0:H[0])!=null&&W.averageStrength?`${e.day28Results[0].averageStrength} N/mm²`:"—"),A=String(e.status7Days||(v!=="—"?"PASS":"pending")).toLowerCase(),k=String(e.status28Days||(E!=="—"?"PASS":"pending")).toLowerCase();return`
              <tr>
                <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(i+1).padStart(2,"0")}</td>
                <td style="font-family: monospace; font-weight: 600;">${T(e.dateCast||e.castDate||e.date)||"—"}</td>
                <td style="font-weight: 800; color: #0f172a; text-transform: uppercase;">${e.elementLevel||e.element||e.inscribedName||"Structural Element"}</td>
                <td style="font-family: monospace; font-weight: 700; text-align: center;">${v}</td>
                <td style="text-align: center; font-weight: 800; color: ${A.includes("pass")?"#16a34a":"#d97706"};">${A.includes("pass")?"PASS":A.toUpperCase()}</td>
                <td style="font-family: monospace; font-weight: 700; text-align: center;">${E}</td>
                <td style="text-align: center; font-weight: 800; color: ${k.includes("pass")?"#16a34a":"#d97706"};">${k.includes("pass")?"PASS":k.toUpperCase()}</td>
              </tr>
            `}).join(""):`
        <tr>
          <td colspan="7" style="text-align: center; color: #64748b; padding: 24px; font-weight: 600;">
            No concrete compressive strength test records logged for this reporting period.
          </td>
        </tr>
      `;w.push(`
    <div class="pdf-sheet">
      <div>
        ${B("CONCRETE COMPRESSIVE STRENGTH TEST MATRIX")}
        
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
            ${Ut}
          </tbody>
        </table>
      </div>
      ${G(w.length+1)}
    </div>
  `);const bt=["#3b82f6","#10b981","#f97316","#8b5cf6","#06b6d4","#ec4899","#f59e0b"],L=[];if(D.length>0)D.forEach((e,i)=>{const v=parseFloat(String(e.calculatedVolume??e.plannedVolume??e.scope??0))||0,E=parseFloat(String(e.achievedVolume??e.actualVolume??0))||0;let A=v>0?Math.round(E/v*100):parseInt(String(e.completion||0));A=Math.min(100,Math.max(0,A)),L.push({name:String(e.element||e.structuralElement||`Element ${i+1}`).toUpperCase().trim(),scope:v,completion:A,color:bt[i%bt.length]})});else if(tt.length>0){const e={};tt.forEach(i=>{const v=(i.elementType||i.type||i.element||"OTHER").toUpperCase().trim(),E=parseFloat(String(i.calculatedVolume||i.volume||0))||0,A=parseFloat(String(i.achievedVolume??i.completedVolume??0))||0;e[v]||(e[v]={scope:0,achieved:0}),e[v].scope+=E,e[v].achieved+=A}),Object.entries(e).forEach(([i,v],E)=>{const A=v.scope>0?Math.min(100,Math.max(0,Math.round(v.achieved/v.scope*100))):0;L.push({name:i,scope:Math.round(v.scope*100)/100,completion:A,color:bt[E%bt.length]})})}const ht=L.reduce((e,i)=>e+i.scope,0),Ft=L.length>0?Math.round(L.reduce((e,i)=>e+i.completion,0)/L.length):0,yt=(()=>{if(L.length===0||ht===0)return{svg:`
          <svg width="150" height="150" viewBox="0 0 150 150" style="display: block; margin: 0 auto;">
            <circle cx="75" cy="75" r="62" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3 3" />
            <text x="75" y="78" text-anchor="middle" font-size="8.5" fill="#94a3b8" font-family="-apple-system, sans-serif" font-weight="600">No Volume Data</text>
          </svg>
        `,legend:`
          <div style="margin-top: 10px; font-size: 7.5px; color: #94a3b8; text-align: center; font-style: italic;">
            No quantity distribution recorded
          </div>
        `};const e=150,i=75,v=75,E=62;let A=-Math.PI/2;const k=[];L.forEach(H=>{const U=(ht>0?H.scope/ht:1/(L.length||1))*2*Math.PI,it=A+U,ot=i+E*Math.cos(A),At=v+E*Math.sin(A),Nt=i+E*Math.cos(it),$t=v+E*Math.sin(it),wt=U>Math.PI?1:0,M=`M ${i} ${v} L ${ot.toFixed(2)} ${At.toFixed(2)} A ${E} ${E} 0 ${wt} 1 ${Nt.toFixed(2)} ${$t.toFixed(2)} Z`;k.push(`<path d="${M}" fill="${H.color}" stroke="#ffffff" stroke-width="1.5" />`),A=it});const Q=`
      <svg width="${e}" height="${e}" viewBox="0 0 ${e} ${e}" style="display: block; margin: 0 auto;">
        ${k.join("")}
      </svg>
    `,F=`
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; margin-top: 10px; font-size: 7.5px; font-weight: 800;">
        ${L.map(H=>`
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="display: inline-block; width: 8px; height: 8px; background: ${H.color}; border-radius: 1.5px;"></span>
            <span style="color: #334155; text-transform: uppercase;">${H.name}</span>
          </div>
        `).join("")}
      </div>
    `;return{svg:Q,legend:F}})(),Bt=()=>{if(L.length===0)return`
        <div style="margin-top: 10px; background: #fafbfd; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; color: #94a3b8; font-size: 8.5px; font-style: italic;">
          No element quantity comparison metrics logged for this level.
        </div>
      `;const e=720,i=100,v=78,E=Math.max(...L.map(F=>F.scope),10),A=e/(L.length||1),k=Math.min(22,A*.32),Q=L.map((F,H)=>{const W=H*A+A/2,U=E>0?F.scope/E*58:0,it=F.scope*F.completion/100,ot=E>0?it/E*58:0,At=W-k-2,Nt=v-U,$t=W+2,wt=v-ot;return`
          <!-- Scope Bar (Blue) -->
          <rect x="${At.toFixed(1)}" y="${Nt.toFixed(1)}" width="${k.toFixed(1)}" height="${Math.max(U,1).toFixed(1)}" rx="1.5" fill="#3b82f6" />
          <!-- Achieved Bar (Orange) -->
          <rect x="${$t.toFixed(1)}" y="${wt.toFixed(1)}" width="${k.toFixed(1)}" height="${Math.max(ot,1).toFixed(1)}" rx="1.5" fill="#f97316" />
          <!-- X-Axis Label -->
          <text x="${W.toFixed(1)}" y="${(v+14).toFixed(1)}" text-anchor="middle" font-size="8" font-weight="700" fill="#475569" font-family="-apple-system, sans-serif" letter-spacing="0.3">${F.name}</text>
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
        <svg width="100%" height="${i}" viewBox="0 0 ${e} ${i}" style="display: block; overflow: visible;">
          <line x1="20" y1="${v}" x2="${e-20}" y2="${v}" stroke="#cbd5e1" stroke-width="1.2" />
          ${Q}
        </svg>
      </div>
    `},Gt=L.length>0?L.map(e=>`
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
      `;w.push(`
    <div class="pdf-sheet">
      <div>
        ${B(`${q} — QUANTITY SUMMARY`)}
        
        <!-- Top Half: Table and Pie Chart -->
        <div style="display: flex; gap: 16px; align-items: stretch; margin-top: 8px;">
          <!-- Left Table (50% width) -->
          <div style="flex: 1.1;">
            <div style="font-size: 10px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 6px; letter-spacing: -0.2px;">
              ${q} FLOOR CONCRETE CHART
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
                ${Gt}
                ${L.length>0?`
                  <tr style="background: #f8fafc; font-weight: 900; border-top: 2px solid #cbd5e1;">
                    <td style="font-size: 8.5px; color: #0f172a; text-transform: uppercase; font-weight: 900;">TOTAL</td>
                    <td style="font-family: monospace; font-size: 9px; color: #0f172a; font-weight: 900;">${ht.toLocaleString(void 0,{maximumFractionDigits:1})}</td>
                    <td style="font-family: monospace; font-size: 9px; color: #0f172a; font-weight: 900;">${Ft}%</td>
                  </tr>
                `:""}
              </tbody>
            </table>
          </div>

          <!-- Right Pie Chart Card (50% width) -->
          <div style="flex: 0.9; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; display: flex; flex-direction: column; justify-content: space-between;">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
              ${yt.svg}
              ${yt.legend}
            </div>
            <div style="text-align: center; font-size: 8px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-top: 6px; letter-spacing: 0.5px;">
              ${q} FLOOR CONCRETE CHART
            </div>
          </div>
        </div>

        <!-- Bottom Half: Grouped Vertical Bar Chart -->
        ${Bt()}
      </div>
      ${G(w.length+1)}
    </div>
  `);function xt(e,i,v,E,A,k=!0){if(k&&v.length>0){const F=Math.ceil(v.length/26);let H=0,W=0;v.forEach(U=>{const it=parseFloat(String(U.calculatedVolume||U.volume||0))||0,ot=parseFloat(String(U.achievedVolume??U.completedVolume??0))||0;H+=it,W+=ot});for(let U=0;U<F;U++){const it=v.slice(U*26,(U+1)*26),ot=U===0,At=U===F-1,Nt=ot?`${q} — ${i.toUpperCase()} ELEMENTS STATUS`:`${q} — ${e.toUpperCase()} STATUS (CONT'D)`,$t=it.map(M=>{const Kt=parseFloat(String(M.calculatedVolume||M.volume||0))||0,te=parseFloat(String(M.achievedVolume??M.completedVolume??0))||0;let ut=Kt>0?Math.round(te/Kt*100):Number(M.completionPercentage||M.completion||0);ut=Math.min(100,Math.max(0,ut));const ee=(M.status||M.qaStatus||M.inspectionStatus||"PENDING").toString().trim(),J=ee.toUpperCase().replace(/\s+/g,"_"),ne=ee.replace(/_/g," ").toUpperCase();let nt="#f8fafc",dt="#475569",rt="#cbd5e1",lt=ut>0?"#3b82f6":"#cbd5e1";J.includes("APPROV")||J==="COMPLETED"||J==="PASS"?(nt="#ecfdf5",dt="#059669",rt="#a7f3d0",lt="#16a34a"):J==="POURED"||J.includes("CAST")?(nt="#ecfeff",dt="#0891b2",rt="#a5f3fc",lt="#06b6d4"):J.includes("READY")?(nt="#e0e7ff",dt="#4338ca",rt="#c7d2fe",lt="#6366f1"):J.includes("INSPECT")?(nt="#f5f3ff",dt="#7c3aed",rt="#ddd6fe",lt="#8b5cf6"):J.includes("PROGRESS")?(nt="#eff6ff",dt="#2563eb",rt="#bfdbfe",lt="#3b82f6"):J.includes("REJECT")||J.includes("FAIL")||J.includes("NCR")?(nt="#fef2f2",dt="#dc2626",rt="#fecaca",lt="#ef4444"):(nt="#f8fafc",dt="#64748b",rt="#e2e8f0",lt=ut>0?"#3b82f6":"#cbd5e1");const de=(M.elementName||M.name||M.element||M.id||"—").toUpperCase(),re=M.gridLocation||M.grid||M.location||"—";return`
              <tr>
                <td style="font-weight: 800; color: #0f172a;">${de}</td>
                <td style="font-family: monospace; color: #475569;">${re}</td>
                <td style="font-family: monospace; font-weight: 600;">${Kt.toFixed(2)}</td>
                <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${te.toFixed(2)}</td>
                <td>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                    <div style="flex: 1; height: 7px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
                      <div style="width: ${ut}%; height: 100%; background: ${lt}; border-radius: 999px;"></div>
                    </div>
                    <span style="font-size: 7px; font-weight: 800; font-family: monospace; min-width: 24px; text-align: right;">${ut}%</span>
                    <span style="background: ${nt}; color: ${dt}; border: 1px solid ${rt}; border-radius: 4px; padding: 1.5px 7px; font-weight: 800; font-size: 7px; text-transform: uppercase; white-space: nowrap; display: inline-block;">${ne}</span>
                  </div>
                </td>
              </tr>
            `}).join(""),wt=H>0?Math.round(W/H*100):0;w.push(`
          <div class="pdf-sheet">
            <div>
              ${B(Nt)}
              
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
                  ${$t}
                  ${At?`
                    <tr style="background: #f1f5f9; font-weight: 900; border-top: 1.5px solid #cbd5e1;">
                      <td colspan="2" style="font-size: 7.5px; color: #0f172a; text-transform: uppercase;">
                        TOTAL ${e.toUpperCase()}
                      </td>
                      <td style="font-family: monospace; font-size: 7.5px;">${H.toFixed(2)}</td>
                      <td style="font-family: monospace; font-size: 7.5px; color: #0f172a;">${W.toFixed(2)}</td>
                      <td style="font-size: 7.5px; color: #0f172a; font-weight: 900;">
                        ${wt}% COMPLETION
                      </td>
                    </tr>
                  `:""}
                </tbody>
              </table>
            </div>
            ${G(w.length+1)}
          </div>
        `)}}E&&typeof E=="string"&&E.trim().length>0&&w.push(`
        <div class="pdf-sheet">
          <div>
            ${B(A||`${e.toUpperCase()} LAYOUT &amp; INSPECTION`)}
            
            <div style="height: 154mm; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; position: relative; margin-top: 6px;">
              <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 6px; overflow: hidden; background: #ffffff;">
                <img src="${E}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="${A}" />
              </div>
              <div style="background: #0f172a; border-left: 5px solid #ea580c; color: #ffffff; padding: 8px 14px; font-size: 8px; font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
                <span style="letter-spacing: 0.5px; text-transform: uppercase;">
                  ${A||`${e.toUpperCase()} LAYOUT`} &nbsp;|&nbsp; VERIFIED AS-BUILT SURVEILLANCE OVERLAY
                </span>
                <span style="color: #4ade80; font-weight: 800;">&#10003; QC CLEARANCE COMPLETE</span>
              </div>
            </div>
          </div>
          ${G(w.length+1)}
        </div>
      `)}xt("Columns","Column",Dt,ft,"COLUMNS LAYOUT & CASTING INSPECTION"),xt("Beams","Beam",Pt,pt,"BEAMS LAYOUT & REINFORCEMENT INSPECTION"),xt("Slabs","Slab",_t,Ot,"SLABS LAYOUT & CONCRETING INSPECTION",!1);const Ht=V.length>0?V.map((e,i)=>`
            <tr>
              <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(i+1).padStart(2,"0")}</td>
              <td style="font-weight: 800; color: #0f172a;">${e.service||e.system||e.elementService||"—"}</td>
              <td>${e.subcontractor||e.trade||"—"}</td>
              <td style="font-family: monospace; font-weight: 700; text-align: center;">${e.completionPct!==void 0?e.completionPct:0}%</td>
              <td style="text-align: center;"><span class="badge-approved">${e.status||"CLEARED"}</span></td>
              <td style="font-size: 7.5px; color: #475569;">${e.remarks||"—"}</td>
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
        ${B("MEP QA/QC CLEARANCE STATUS — PRE-CASTING")}
        
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
            ${Ht}
          </tbody>
        </table>
      </div>
      ${G(w.length+1)}
    </div>
  `);const Vt=j.length>0?j.map((e,i)=>{const v=String(e.qcStatus||e.status||"APPROVED").toUpperCase(),E=v.includes("REJECT")?"#dc2626":v.includes("NOTED")?"#0284c7":"#16a34a",A=e.unit||"units",k=e.quantityAccepted!==void 0?e.quantityAccepted:e.quantity||0,Q=e.quantityRejected??0,F=e.quantityReceived??e.quantity??0;return`
            <tr>
              <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(i+1).padStart(2,"0")}</td>
              <td style="font-family: monospace; font-weight: 600;">${T(e.deliveryDate||e.date)||"—"}</td>
              <td style="font-weight: 800; color: #0f172a;">${e.materialDescription||e.materialName||e.name||"Material"}</td>
              <td>${e.supplier||e.supplierName||"—"}</td>
              <td style="font-family: monospace; font-weight: 700;">${F} ${A} [${k} Acc / ${Q} Rej]</td>
              <td style="text-align: center; font-weight: 800; color: ${E}; font-size: 7.5px;">${v}</td>
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
        ${B("MATERIAL DELIVERY LOG & TRACEABILITY")}
        
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
      ${G(w.length+1)}
    </div>
  `),p){const e=Y.length>0?Y.map(i=>{const v=String(i.status||"OPEN").toUpperCase(),E=v==="CLOSED"||v==="RECTIFIED"||v==="RESOLVED",A=Array.isArray(i.descriptionItems)?i.descriptionItems.join(", "):i.description||"Field variance logged";return`
              <tr>
                <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${i.refNo||i.ncrNumber||"NCR"}</td>
                <td style="font-weight: 700;">${i.elementLevel||i.location||"Structural Component"}</td>
                <td style="font-size: 7.5px; line-height: 1.4; color: #334155;">${A}</td>
                <td style="font-family: monospace; font-weight: 600;">${T(i.dateIdentified||i.dateFound||i.createdAt)}</td>
                <td style="font-family: monospace; font-weight: 600;">${T(i.targetFixDate||i.signDate||n)}</td>
                <td style="text-align: center; font-weight: 900; color: ${E?"#16a34a":"#dc2626"}; font-size: 7.5px;">${E?"CLOSED":"OPEN"}</td>
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
          ${B("APPENDIX: NCR REGISTER")}
          
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
        ${G(w.length+1)}
      </div>
    `)}if(N){const e=P.length>0?P.map(i=>{const v=String(i.status||"ISSUED").toUpperCase(),E=v.includes("CLOSE")||v.includes("COMPLET");return`
              <tr>
                <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${i.instructionNumber||i.siNumber||i.id||"SI"}</td>
                <td style="font-weight: 700; font-size: 7.5px; color: #0f172a;">${i.title||i.subject||"Formal Notice of Defect Rectification"}</td>
                <td style="font-size: 7.5px; text-transform: uppercase;">${i.contractorName||i.recipient||"Subcontractor"}</td>
                <td style="font-family: monospace; font-weight: 600;">${T(i.issuedDate||i.date)}</td>
                <td style="font-family: monospace; font-weight: 600;">${T(i.complianceDeadline||i.dueDate||n)}</td>
                <td style="text-align: center; font-weight: 900; color: ${E?"#16a34a":"#d97706"}; font-size: 7.5px;">${E?"CLOSED":"ISSUED"}</td>
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
          ${B("APPENDIX: SITE INSTRUCTION REGISTER")}
          
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
        ${G(w.length+1)}
      </div>
    `)}if(x){const e=z.length>0?z.map((i,v)=>{const E=String(i.status||"Non-Compliant"),A=E.toLowerCase().includes("comp")||E.toLowerCase().includes("passed")||E.toLowerCase().includes("approved"),k=E.toLowerCase().includes("pend"),Q=A?"#16a34a":k?"#d97706":"#dc2626";return`
              <tr>
                <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(v+1).padStart(2,"0")}</td>
                <td style="font-family: monospace; font-weight: 600;">${T(i.date||i.createdAt)||"—"}</td>
                <td>${i.level||q}${i.location?` &bull; ${i.location}`:""}</td>
                <td style="font-weight: 700;">${i.element||"—"}</td>
                <td style="font-size: 7.5px; line-height: 1.4; color: #334155; white-space: pre-line;">${(i.comments||i.text||"—").replace(/<br\s*\/?>/gi,`
`)}</td>
                <td>${i.inspector||r}${i.vendorCheck?` / ${i.vendorCheck}`:""}</td>
                <td style="text-align: center; font-weight: 800; color: ${Q}; font-size: 7.5px;">${E}</td>
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
          ${B("APPENDIX: SITE COMMENTS / OBSERVATION LOG")}
          
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
        ${G(w.length+1)}
      </div>
    `)}X.length>0&&X.forEach((e,i)=>{const v=typeof e=="string"?e:e.url,E=typeof e=="object"&&e.caption&&e.caption.trim().length>0?e.caption:`SPECIMEN ${i+1} | AS-BUILT SITE QUALITY RECORD`;w.push(`
        <div class="pdf-sheet">
          <div>
            ${B(`PICTORIAL SURVEILLANCE RECORD (SPECIMEN ${i+1} OF ${X.length})`)}
            
            <div style="height: 154mm; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; position: relative; margin-top: 6px;">
              <!-- Photo Viewport -->
              <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 6px; overflow: hidden; background: #ffffff;">
                <img src="${v}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 2px;" alt="${E}" />
              </div>

              <!-- Dark Caption Ribbon -->
              <div style="background: #0f172a; border-left: 5px solid #ea580c; color: #ffffff; padding: 10px 16px; font-size: 8.5px; font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
                <span style="letter-spacing: 0.3px; text-transform: uppercase;">
                  ${E}
                </span>
                <span style="color: #94a3b8; font-family: monospace; font-size: 7.5px;">
                  SPECIMEN ${i+1} / ${X.length}
                </span>
              </div>
            </div>
          </div>
          ${G(w.length+1)}
        </div>
      `)});const Qt=gt>0?`${gt} Holds Active / Pending Sign-off`:"All Quality Checks Conforming & Approved";t.synopsis||t.executiveSummary,w.push(`
    <div class="pdf-sheet" style="padding: 0; display: flex; flex-direction: row; height: 210mm; overflow: hidden; position: relative;">
      <!-- Left Dark Emerald Panel (~30% width) -->
      <div style="width: 30%; background: #091a18; color: #ffffff; padding: 28mm 12mm 16mm 14mm; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <!-- Company Brand -->
          <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: flex-end; gap: 2px; margin-bottom: 6px; justify-content: center;">
              ${f?`<img src="${f}" style="max-height: 150px; max-width: 200px; object-fit: contain;" alt="${S}" />`:`
                <div style="display: flex; gap: 3px; align-items: flex-end; height: 24px;">
                  <span style="width: 4.5px; height: 12px; background: #c28b5e; border-radius: 1px;"></span>
                  <span style="width: 4.5px; height: 22px; background: #c28b5e; border-radius: 1px;"></span>
                  <span style="width: 4.5px; height: 16px; background: #c28b5e; border-radius: 1px;"></span>
                </div>
              `}
            </div>
            <div style="font-size: 13px; text-align: center; font-weight: 700; color: #FFFFFF; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 5px;">
              ${b.toUpperCase()}
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
              DOC-ID: ${m}
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
              ${o.toUpperCase()} DEVELOPMENT
            </h3>
            <p style="font-size: 7.5px; color: #64748b; margin: 0;">
              Weekly Structural Quality Control, Surveillance &amp; Materials Conformance Audit
            </p>
          </div>

          <!-- Key Metadata Grid (2x2) -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 10px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; font-size: 8px; margin-bottom: 12px;">
            <div>
              <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Reporting Period</p>
              <p style="font-weight: 700; color: #1e293b; margin: 0;">${y} – ${l}</p>
            </div>
            <div>
              <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Structure Level</p>
              <p style="font-weight: 700; color: #1e293b; margin: 0;">${q}</p>
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
                  ${r}
                </h4>
                <p style="font-size: 8px; font-weight: 800; color: #047857; text-transform: uppercase; margin: 0;">
                  ${I}
                </p>
              </div>
              
              <!-- Stamp / Verification Badge Indicator -->
              <div style="display: flex; align-items: center; gap: 8px;">
                ${O?`<img src="${O}" style="max-height: 38px; max-width: 100px; object-fit: contain;" alt="Signature" />`:""}
                <div style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgba(5, 150, 105, 0.4); display: flex; align-items: center; justify-content: center; font-size: 7px; font-weight: 900; color: #065f46; text-transform: uppercase; text-align: center; line-height: 1.15; background: #ecfdf5;">
                  VERIFIED<br />QA/QC
                </div>
              </div>
            </div>

            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b;">
              <span>Email: <strong style="color: #334155; font-weight: 700;">${C}</strong></span>
              <span>Issued: <strong style="color: #334155; font-weight: 700;">${T(n)}</strong></span>
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
  `);const jt=`
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
      height: 2px;
      background: ${u.ruleColor};
    }

    .pdf-footer {
      padding-top: 5px;
      border-top: 1px solid ${u.cardBorder};
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pdf-slide-badge {
      background: ${u.badgeBg};
      color: ${u.badgeTextColor};
      font-size: 7.5px;
      font-weight: 800;
      padding: 2.5px 10px;
      border-radius: ${u.cardRadius};
      border: 1px solid ${u.badgeBorder};
      letter-spacing: 0.5px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5px;
      font-family: ${u.fontFamily} !important;
    }

    .data-table th {
      background: ${u.tableHeaderBg} !important;
      color: ${u.tableHeaderTextColor} !important;
      font-weight: 800;
      font-size: 7.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 6px 8px;
      border: 1px solid ${u.tableHeaderBg};
      text-align: left;
    }

    .data-table td {
      padding: 4.5px 8px;
      border: 1px solid #f1f5f9;
      border-bottom: 1px solid ${u.tableBorderColor};
      vertical-align: middle;
    }

    .data-table tr:nth-child(even) td {
      background: ${u.tableZebraBg};
    }

    .badge-approved {
      background: ${u.badgeApprovedBg} !important;
      color: ${u.badgeApprovedColor} !important;
      border: 1px solid ${u.badgeApprovedBorder};
      border-radius: ${u.cardRadius};
      padding: 1.5px 7px;
      font-weight: 800;
      font-size: 7px;
      text-transform: uppercase;
      display: inline-block;
    }

    .badge-rejected {
      background: ${u.badgeRejectedBg} !important;
      color: ${u.badgeRejectedColor} !important;
      border: 1px solid ${u.badgeRejectedBorder};
      border-radius: ${u.cardRadius};
      padding: 1.5px 7px;
      font-weight: 800;
      font-size: 7px;
      text-transform: uppercase;
      display: inline-block;
    }

    .badge-pending {
      background: ${u.badgePendingBg} !important;
      color: ${u.badgePendingColor} !important;
      border: 1px solid ${u.badgePendingBorder};
      border-radius: ${u.cardRadius};
      padding: 1.5px 7px;
      font-weight: 800;
      font-size: 7px;
      text-transform: uppercase;
      display: inline-block;
    }
  `,Yt=w.join(`
`);Z(`${m} - QA/QC Weekly Surveillance Report (Landscape Slide Deck)`,Yt,jt)}function Me(t,d="All Levels",h={},c={}){const S=c.name||"Apex Civil Engineering",b=h.name||"Site Quality Assessment",f=$(new Date),o=`CQ-REG-${d.toUpperCase().replace(/[^A-Z0-9]/g,"-")}-${Date.now().toString().slice(-6)}`,m=t.length,p=t.filter(s=>s.status==="CURING"||s.status==="PENDING").length,x=t.filter(s=>{var r,I;return s.day7Results&&s.day7Results.length>0||((I=(r=s.tests)==null?void 0:r.day7)==null?void 0:I.averageStrengthNmm2)}),N=x.filter(s=>{var O,_,D,V;const r=((_=(O=s.day7Results)==null?void 0:O[0])==null?void 0:_.averageStrength)||((V=(D=s.tests)==null?void 0:D.day7)==null?void 0:V.averageStrengthNmm2)||0,I=s.target28DayStrengthNmm2||s.day28Required||30,C=s.day7Required||Math.round(I*.7*10)/10;return r>=C}).length,T=x.length>0?Math.round(N/x.length*100):100,R=t.filter(s=>{var r,I;return s.day28Results&&s.day28Results.length>0||((I=(r=s.tests)==null?void 0:r.day28)==null?void 0:I.averageStrengthNmm2)}),g=R.filter(s=>{var C,O,_,D;const r=((O=(C=s.day28Results)==null?void 0:C[0])==null?void 0:O.averageStrength)||((D=(_=s.tests)==null?void 0:_.day28)==null?void 0:D.averageStrengthNmm2)||0,I=s.target28DayStrengthNmm2||s.day28Required||30;return r>=I}).length,a=R.length>0?Math.round(g/R.length*100):100,y=t.filter(s=>s.status==="APPROVED"||s.status==="28-DAY DONE").length,l=t.filter(s=>s.status==="NCR_ISSUED"||s.status==="REJECTED"||s.ncrGenerated).length,n=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${K(c,h)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">CONCRETE QUALITY & COMPRESSIVE STRENGTH REGISTER</div>
          <div class="header-title-project">PROJECT: ${b}</div>
          <div class="header-title-iso">BS EN 12390-3 / BS EN 206-1 / ASTM C39 Concrete Conformance Register</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${o}</span></div>
          <div><strong>Scope / Level:</strong> <span style="font-weight:700; color:#0f172a;">${d}</span></div>
          <div><strong>Report Date:</strong> ${f}</div>
          <div><strong>Total Samples:</strong> ${m} specimen sets</div>
        </td>
      </tr>
    </table>

    <!-- 1.0 Executive Quality Statistics -->
    <div class="pdf-section">
      <div class="section-banner">1.0 CONCRETE COMPLIANCE SUMMARY & QUALITY STATISTICS</div>
      <table class="grid-table">
        <tr>
          <td class="grid-label" style="width: 20%;">LOCATION / FILTER:</td>
          <td class="grid-value" style="width: 30%; font-weight:700; color:#0f172a;">${d}</td>
          <td class="grid-label" style="width: 20%;">TOTAL SAMPLES LOGGED:</td>
          <td class="grid-value" style="width: 30%; font-weight:800; font-size:9.5px; font-family:monospace;">${m} Specimens</td>
        </tr>
        <tr>
          <td class="grid-label">28-DAY COMPLIANCE RATE:</td>
          <td class="grid-value">
            <span style="font-weight:800; font-size:10px; color:${a>=95?"#15803d":"#b91c1c"};">${a}%</span>
            <span style="font-size:7.5px; color:#64748b; margin-left:4px;">(${g}/${R.length} tested sets compliant)</span>
          </td>
          <td class="grid-label">7-DAY EARLY STRENGTH:</td>
          <td class="grid-value">
            <span style="font-weight:800; font-size:9.5px; color:#0369a1;">${T}%</span>
            <span style="font-size:7.5px; color:#64748b; margin-left:4px;">(${N}/${x.length} tested sets compliant)</span>
          </td>
        </tr>
        <tr>
          <td class="grid-label">APPROVED CERTIFICATES:</td>
          <td class="grid-value" style="color:#15803d; font-weight:800;">${y} Fully Certified</td>
          <td class="grid-label">ACTIVE NCRS / DEFECTIVE:</td>
          <td class="grid-value" style="color:${l>0?"#b91c1c":"#15803d"}; font-weight:800;">${l} Non-Conforming</td>
        </tr>
        <tr>
          <td class="grid-label">IN CURING TANKS:</td>
          <td class="grid-value" style="color:#0284c7; font-weight:700;">${p} In Curing Water Tanks</td>
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
          ${t.length>0?t.map(s=>{var j,Y,z,P,st,X,pt,ft;const r=s.target28DayStrengthNmm2||s.day28Required||30,I=s.day7Required||Math.round(r*.7*10)/10,C=((Y=(j=s.day7Results)==null?void 0:j[0])==null?void 0:Y.averageStrength)??((P=(z=s.tests)==null?void 0:z.day7)==null?void 0:P.averageStrengthNmm2),O=C!=null?C>=I:null,_=((X=(st=s.day28Results)==null?void 0:st[0])==null?void 0:X.averageStrength)??((ft=(pt=s.tests)==null?void 0:pt.day28)==null?void 0:ft.averageStrengthNmm2),D=_!=null?_>=r:null,V=s.status==="NCR_ISSUED"||s.status==="REJECTED"||s.ncrGenerated||!!s.ncrNumber;return`
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
                <td style="font-weight: 700; font-family: monospace;">${s.concreteGrade||"C30"} (${r})</td>
                <td>${$(s.castDate)}</td>
                <td style="font-family: monospace;">${s.slumpMm||s.slumpValue||"—"} mm</td>
                <td>
                  ${C!=null?`<div style="font-family: monospace; font-weight: 800; color: ${O?"#15803d":"#b91c1c"};">${C} MPa</div>
                         <div style="font-size: 6.8px; color: ${O?"#15803d":"#b91c1c"}; font-weight: 700;">(${O?"PASS":"FAIL"} - Min ${I})</div>`:'<span style="color: #94a3b8; font-size: 7.5px;">Pending</span>'}
                </td>
                <td>
                  ${_!=null?`<div style="font-family: monospace; font-weight: 800; color: ${D?"#15803d":"#b91c1c"};">${_} MPa</div>
                         <div style="font-size: 6.8px; color: ${D?"#15803d":"#b91c1c"}; font-weight: 700;">(${D?"PASS":"FAIL"} - Min ${r})</div>`:'<span style="color: #94a3b8; font-size: 7.5px;">In Curing</span>'}
                </td>
                <td>
                  ${V?`<span class="badge-fail">NCR: ${s.ncrNumber||"ISSUED"}</span>`:s.status==="APPROVED"||D?'<span class="badge-pass">APPROVED</span>':`<span class="badge-pending">${s.status||"IN PROGRESS"}</span>`}
                </td>
              </tr>
            `}).join(""):`
              <tr>
                <td colspan="9" style="text-align: center; color: #64748b; padding: 14px;">
                  No concrete specimen records found for ${d}.
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
      <div>CONFIDENTIAL & PROPRIETARY — ${S}</div>
      <div>Report Ref: ${o} • Filter: ${d}</div>
    </div>
  `;Z(`${o} - Concrete Quality Register (${d})`,n)}function ze(t,d,h){var T,R,g,a,y,l,n,s;const c=(h==null?void 0:h.name)||t.companyName||"JQMS Civil Infrastructure",S=(d==null?void 0:d.name)||t.projectName||"Civil Engineering Construction Project",b=(d==null?void 0:d.code)||"PRJ-001",f=t.instructionNumber||`SI-${t.id.slice(0,8).toUpperCase()}`,o=$(((T=t.signedBy)==null?void 0:T.signedAt)||t.createdAt),m=$(t.complianceDeadline),p=t.severity==="STOP_WORK"||t.severity==="CRITICAL"?"#dc2626":t.severity==="HIGH"?"#ea580c":"#2563eb",x=t.severity==="STOP_WORK"?"INTERNAL WORK HOLD DIRECTIVE":t.severity==="CRITICAL"?"CRITICAL INTERNAL QUALITY DIRECTIVE":t.severity==="HIGH"?"HIGH PRIORITY RECTIFICATION NOTICE":"STANDARD QUALITY DIRECTIVE",N=`
    <!-- ═══ DOCUMENT HEADER ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${K(h,d)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main" style="color: ${p};">
            INTERNAL SITE INSTRUCTION
          </div>
          <div style="font-size: 8px; font-weight: 800; letter-spacing: 0.8px; color: #475569; text-transform: uppercase; margin-top: 1px;">
            INTERNAL QUALITY CONTROL & REMEDIATION DIRECTIVE
          </div>
          <div class="header-title-project">${S} (${b})</div>
        </td>
        <td style="width: 25%; font-size: 8px; vertical-align: top; background: #fafafa;">
          <div style="margin-bottom: 2px;">Doc Ref: <strong style="font-family: monospace; font-size: 8.5px; color: #0f172a;">${f}</strong></div>
          <div style="margin-bottom: 2px;">Issue Date: <strong>${o}</strong></div>
          <div style="margin-bottom: 2px;">Target Rectification: <strong style="color: #dc2626;">${m}</strong></div>
          <div>Status: <span style="background: #e0f2fe; color: #0369a1; font-weight: 800; padding: 1px 4px; border-radius: 2px; font-size: 7px;">${t.status||"ISSUED"}</span></div>
        </td>
      </tr>
    </table>

    <!-- ═══ INTERNAL SEVERITY BANNER ═══ -->
    <div style="background: ${p}; color: #ffffff; padding: 5px 10px; border-radius: 4px; font-weight: 800; font-size: 9px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; letter-spacing: 0.5px;">
      <span>⚠️ NOTICE CATEGORY: ${x}</span>
      <span>ACTION REQUIRED BY: ${m}</span>
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
          ${t.mandatoryActions&&t.mandatoryActions.length>0?t.mandatoryActions.map((r,I)=>`
                <tr>
                  <td style="text-align: center; font-weight: 800; color: #ea580c;">${I+1}.0</td>
                  <td style="font-weight: 600; color: #0f172a;">${r}</td>
                  <td style="text-align: center; font-weight: 700; color: #dc2626;">${m}</td>
                </tr>
              `).join(""):`
                <tr>
                  <td style="text-align: center; font-weight: 800;">1.0</td>
                  <td>Execute complete remediation of identified defect according to internal project quality guidelines.</td>
                  <td style="text-align: center; font-weight: 700;">${m}</td>
                </tr>
                <tr>
                  <td style="text-align: center; font-weight: 800;">2.0</td>
                  <td>Notify QA/QC team for re-inspection and sign-off upon completion of corrective actions.</td>
                  <td style="text-align: center; font-weight: 700;">${m}</td>
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
                <div>Designation: <strong>${((g=t.signedBy)==null?void 0:g.designation)||((a=t.signedBy)==null?void 0:a.role)||"QA/QC Lead Engineer"}</strong></div>
                <div style="font-size: 7.5px; color: #64748b; font-style: italic; margin-top: 4px;">
                  "${((y=t.signedBy)==null?void 0:y.declaration)||"Issued in accordance with company internal quality control standards."}"
                </div>
              </div>

              <div style="text-align: center; min-width: 170px; padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; background: #ffffff;">
                <div style="font-size: 7px; font-weight: 800; color: #0284c7; text-transform: uppercase; margin-bottom: 2px;">
                  Digital Signature
                </div>
                ${(l=t.signedBy)!=null&&l.signatureUrl?`<img src="${t.signedBy.signatureUrl}" style="max-height: 44px; max-width: 150px; object-fit: contain; margin: 0 auto;" alt="Signature" />`:`<div style="height: 36px; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 10px; font-weight: bold; color: #0284c7;">${((n=t.signedBy)==null?void 0:n.name)||"ELECTRONICALLY SIGNED"}</div>`}
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
      <div>INTERNAL QUALITY DIRECTIVE — ${c}</div>
      <div>Document Ref: ${f} </div>
    </div>
  `;Z(`${f} - Internal Site Instruction`,N)}function Ue(t,d={},h={}){var x,N,T,R,g,a,y,l,n,s;const c=h.name||"JQMS ENTERPRISE QUALITY MANAGEMENT",S=d.name||t.projectName||"CONSTRUCTION PROJECT",b=d.code||"PRJ",f=t.mirNumber||"MIR-DRAFT",o=r=>{switch(r){case"ACCEPTED":return'<span style="display:inline-block; padding: 3px 10px; background: #dcfce7; color: #15803d; border: 1.5px solid #86efac; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">ACCEPTED / APPROVED</span>';case"ACCEPTED_AS_NOTED":return'<span style="display:inline-block; padding: 3px 10px; background: #dbeafe; color: #1d4ed8; border: 1.5px solid #93c5fd; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">ACCEPTED AS NOTED</span>';case"REJECTED":return'<span style="display:inline-block; padding: 3px 10px; background: #fee2e2; color: #b91c1c; border: 1.5px solid #fca5a5; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">REJECTED / NON-COMPLIANT</span>';case"HOLD_FOR_TESTING":return'<span style="display:inline-block; padding: 3px 10px; background: #fef3c7; color: #b45309; border: 1.5px solid #fcd34d; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">HOLD FOR LAB TESTING</span>';default:return'<span style="display:inline-block; padding: 3px 10px; background: #f1f5f9; color: #475569; border: 1.5px solid #cbd5e1; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">PENDING INSPECTION</span>'}},m=t.items&&t.items.length>0?t.items.map((r,I)=>`
        <tr>
          <td style="text-align: center; font-weight: bold; width: 30px;">${I+1}</td>
          <td style="font-weight: 600; color: #0f172a;">${r.description||"Material Item"}</td>
          <td style="font-size: 7.5px; color: #475569;">${r.specificationRef||"—"}</td>
          <td style="text-align: right; font-weight: bold;">${r.quantityDelivered}</td>
          <td style="text-align: right;">${r.quantityInspected}</td>
          <td style="text-align: right; color: #15803d; font-weight: bold;">${r.quantityAccepted}</td>
          <td style="text-align: right; color: ${r.quantityRejected>0?"#b91c1c":"#64748b"}; font-weight: bold;">${r.quantityRejected}</td>
          <td style="text-align: center; text-transform: uppercase; font-size: 7.5px;">${r.unit||"units"}</td>
          <td style="font-size: 7.5px; color: #475569;">${r.remarks||"—"}</td>
        </tr>
      `).join(""):'<tr><td colspan="9" style="text-align:center; padding: 12px; color: #64748b;">No individual line items registered. Full delivery inspected as described.</td></tr>',p=`
    <!-- ═══ 1.0 HEADER TABLE ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${K(h,d)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">MATERIAL INSPECTION REPORT (MIR)</div>
          <div class="header-title-project">${S} (${b})</div>
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
          <td colspan="3">${o(t.disposition)}</td>
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
          ${m}
        </tbody>
      </table>
    </div>

    <!-- ═══ 4.0 NOTES & REMARKS ═══ -->
    <div class="pdf-section">
      <div class="section-banner">4.0 INSPECTION OBSERVATIONS & REQUIRED ACTIONS</div>
      <div style="border: 1px solid #cbd5e1; border-top: none; background: #ffffff; padding: 8px 10px; display: flex; flex-direction: column; gap: 8px;">
        <div>
          <div style="font-size: 7.5px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">QA/QC Receiving Observations & Inspector Notes:</div>
          ${Wt(t.inspectionNotes,"Materials visually checked and verified compliant with delivery waybill and approved submittal specification.")}
        </div>
        ${t.rejectionReasons?`
        <div style="margin-top: 4px;">
          <div style="font-size: 7.5px; font-weight: 800; color: #b91c1c; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Defects, Non-Conformances & Technical Justifications:</div>
          ${Wt(t.rejectionReasons)}
        </div>
        `:""}
        ${t.actionRequired?`
        <div style="margin-top: 4px;">
          <div style="font-size: 7.5px; font-weight: 800; color: #d97706; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Mandatory Action & Quarantine Requirements:</div>
          ${Wt(t.actionRequired)}
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
                ${o(((x=t.qaqcSignOff)==null?void 0:x.verdict)||((N=t.consultantSignOff)==null?void 0:N.verdict)||t.disposition)}
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 2.2fr; gap: 12px; font-size: 8px; line-height: 1.6; color: #1e293b; margin-bottom: 6px;">
              <div style="border-right: 1px dashed #fed7aa; padding-right: 10px;">
                <div>QA/QC Engineer: <strong>${((T=t.qaqcSignOff)==null?void 0:T.name)||((R=t.consultantSignOff)==null?void 0:R.name)||((g=t.inspectedBy)==null?void 0:g.name)||"QA/QC Engineer"}</strong></div>
                <div>Designation: <strong>${((a=t.qaqcSignOff)==null?void 0:a.designation)||"QA/QC Engineer"}</strong></div>
                <div>Date of Endorsement: <strong>${$(((y=t.qaqcSignOff)==null?void 0:y.date)||((l=t.consultantSignOff)==null?void 0:l.date)||t.inspectionDate)}</strong></div>
                <div style="margin-top: 4px; color: #15803d; font-weight: bold; font-size: 7.5px;">
                  ✓ Electronically Authenticated Endorsement
                </div>
              </div>
              <div>
                <div style="font-weight: 800; color: #9a3412; font-size: 7.5px; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Official QA/QC Commentary, Directives & Liability Disclaimers:</div>
                ${Wt(((n=t.qaqcSignOff)==null?void 0:n.comments)||((s=t.consultantSignOff)==null?void 0:s.comments),"Materials inspected at site receiving laydown. Verified compliant with approved submittal & material specifications.")}
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
    ${(()=>{var C,O,_,D,V,j,Y;const r=t.stakeholders&&t.stakeholders.length>0?t.stakeholders:[{role:"Contractor Quality Representative",name:((C=t.contractorSignOff)==null?void 0:C.name)||((O=t.inspectedBy)==null?void 0:O.name)||"Contractor Quality Representative",designation:"Site QA/QC Inspector",required:!0,signed:!!((_=t.contractorSignOff)!=null&&_.signed||(D=t.inspectedBy)!=null&&D.date),signedAt:((V=t.contractorSignOff)==null?void 0:V.date)||((j=t.inspectedBy)==null?void 0:j.date)||t.inspectionDate},...(Y=t.consultantSignOff)!=null&&Y.signed?[{role:"Supervising Consultant / Resident Engineer",name:t.consultantSignOff.name,designation:"Resident Engineer",required:!1,signed:!0,signedAt:t.consultantSignOff.date}]:[]];if(r.length===0)return"";const I=[];for(let z=0;z<r.length;z+=2)I.push(r.slice(z,z+2));return`
      <div class="pdf-section">
        <div class="section-banner">6.0 STATUTORY STAKEHOLDER SIGN-OFF AUTHORIZATIONS</div>
        <table class="signoff-table">
          ${I.map(z=>`
            <tr>
              ${z.map(P=>`
                <td style="width: 50%; padding: 8px 12px; vertical-align: top; background: ${P.signed?"#f0fdf4":"#ffffff"};">
                  <div class="sig-role-header">
                    <span>${P.role}</span>
                    <span class="sig-required-tag" style="${P.signed?"background: #dcfce7; color: #166534; border-color: #86efac;":P.required?"background: #fee2e2; color: #991b1b; border-color: #fca5a5;":"background: #f1f5f9; color: #475569; border-color: #cbd5e1;"}">
                      ${P.signed?"VERIFIED & SIGNED":P.required?"REQUIRED":"OPTIONAL"}
                    </span>
                  </div>
                  <div style="font-size: 8px; line-height: 1.5; color: #1e293b; margin-top: 4px;">
                    <div>Name: <strong>${P.name||"— (Pending Signature)"}</strong></div>
                    <div>Designation: <strong>${P.designation||P.role}</strong></div>
                    <div>Date: <strong>${P.signedAt?$(P.signedAt):P.signed?$(t.inspectionDate):"—"}</strong></div>
                  </div>
                  <div style="margin-top: 14px; border-top: 1px dashed #94a3b8; padding-top: 4px; font-size: 7px; color: #64748b; text-align: center;">
                    ${P.signed?`Electronically Authenticated • ${P.name}`:`Signature & Stamp (${P.role})`}
                  </div>
                </td>
              `).join("")}
              ${z.length===1?'<td style="width: 50%; background: #f8fafc; border: 1px solid #cbd5e1;"></td>':""}
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
        ${t.photos.map((r,I)=>`
          <div class="photo-card" style="width: 48%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; text-align: center; background: #f8fafc; page-break-inside: avoid; break-inside: avoid; margin-bottom: 6px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #ea580c; text-align: left; margin-bottom: 4px; display: flex; justify-content: space-between;">
              <span>PHOTO #${I+1} — DELIVERY EVIDENCE</span>
              <span style="color: #64748b; font-size: 7px;">${f}</span>
            </div>
            <div style="height: 160px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
              <img src="${r}" alt="Inspection Evidence #${I+1}" style="max-height: 160px; max-width: 100%; object-fit: contain;" />
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
      <div>CONFIDENTIAL & STATUTORY QUALITY RECORD — ISO 9001:2015 CLAUSE 8.4 — ${c}</div>
      <div>Document Ref: ${f}</div>
    </div>
  `;Z(`${f} - Material Inspection Report (${t.title})`,p)}function Fe(t,d={},h={}){var R,g,a,y,l,n,s,r,I,C,O,_,D,V,j,Y,z,P,st,X,pt,ft,Ot,tt,Dt,Pt,_t,q,et,at,Lt,gt,kt,Mt,u,zt,B,G,w,mt,vt,Ut,bt,L,ht,Ft,Jt,yt,Bt,Gt,xt,Ht,Vt,Qt,jt,Yt,Et,Tt,St,Ct,It,Rt;const c=h.name||"JQMS ENTERPRISE QUALITY MANAGEMENT",S=d.name||t.projectName||"CONSTRUCTION PROJECT",b=d.code||t.projectCode||"PRJ",f=t.logNumber||`DSL-${b}-${((R=t.generalConditions)==null?void 0:R.date)||"TODAY"}`,o=t.generalConditions||{date:new Date().toISOString().slice(0,10),shift:"DAY",weather:"CLEAR",workHoursStart:"07:00",workHoursEnd:"17:00",totalHours:10},m=(t.manpower||[]).reduce((e,i)=>e+(Number(i.headCount)||0),0),p=(t.manpower||[]).reduce((e,i)=>e+(Number(i.totalManHours)||(Number(i.headCount)||0)*(Number(i.hoursWorked)||o.totalHours||8)),0),x=e=>{switch(e){case"SUNNY":return"☀️ Sunny";case"CLEAR":return"🌤️ Clear Sky";case"OVERCAST":return"☁️ Overcast / Cloudy";case"RAIN":return"🌧️ Rainy";case"HEAVY_RAIN":return"⛈️ Heavy Rain / Downpour";case"STORMY":return"🌩️ Stormy / High Winds";case"EXTREME_HEAT":return"🔥 Extreme Heat / High Temp";case"WINDY":return"💨 High Winds / Dust";default:return"🌤️ Normal Site Conditions"}},N=e=>{switch(e){case"APPROVED":return'<span style="padding: 2px 8px; background: #dcfce7; color: #15803d; border: 1px solid #86efac; border-radius: 3px; font-weight: 800; font-size: 8px;">APPROVED</span>';case"SUBMITTED":case"UNDER_REVIEW":return'<span style="padding: 2px 8px; background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; border-radius: 3px; font-weight: 800; font-size: 8px;">UNDER REVIEW</span>';case"REJECTED":return'<span style="padding: 2px 8px; background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; border-radius: 3px; font-weight: 800; font-size: 8px;">REVISION REQUIRED</span>';default:return'<span style="padding: 2px 8px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 3px; font-weight: 800; font-size: 8px;">DRAFT RECORD</span>'}},T=`
    <!-- ═══ HEADER BLOCK ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${K(h,d)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">DAILY SITE LOG & STATUTORY DIARY</div>
          <div class="header-title-project">PROJECT: ${S} (${b})</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.5.1 Operations & Site Quality Records</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${f}</span></div>
          <div><strong>Log Date:</strong> ${o.date}</div>
          <div><strong>Shift:</strong> ${o.shift||"DAY SHIFT"}</div>
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
          <td class="meta-value" style="width: 20%; font-weight: 800;">${o.date}</td>
          <td class="meta-label" style="width: 13%;">SHIFT:</td>
          <td class="meta-value" style="width: 20%; font-weight: 700;">${o.shift||"DAY SHIFT"}</td>
          <td class="meta-label" style="width: 13%;">HOURS:</td>
          <td class="meta-value" style="width: 20%;">${o.workHoursStart||"07:00"} - ${o.workHoursEnd||"17:00"} (${o.totalHours||10} hrs)</td>
        </tr>
        <tr>
          <td class="meta-label">WEATHER:</td>
          <td class="meta-value" style="font-weight: 700;">${x(o.weather)}</td>
          <td class="meta-label">TEMPERATURE:</td>
          <td class="meta-value">${o.tempMin!=null?`${o.tempMin}°C`:"—"} to ${o.tempMax!=null?`${o.tempMax}°C`:"—"}</td>
          <td class="meta-label">GROUND/SOIL:</td>
          <td class="meta-value">${o.groundConditions||"Normal / Dry"} (RH: ${o.humidity?`${o.humidity}%`:"—"})</td>
        </tr>
        ${o.siteStatusNotes?`
        <tr>
          <td class="meta-label">SITE OVERVIEW:</td>
          <td class="meta-value" colspan="5">${o.siteStatusNotes}</td>
        </tr>
        `:""}
      </table>
    </div>

    <!-- ═══ 2.0 SITE MANPOWER & TRADE HEADCOUNT (ALL SPHERES) ═══ -->
    <div class="pdf-section">
      <div class="section-banner" style="display: flex; justify-content: space-between;">
        <span>2.0 SITE MANPOWER & TRADE HEADCOUNT SUMMARY</span>
        <span style="font-size: 7.5px; text-transform: none; color: #cbd5e1;">TOTAL PERSONNEL: <strong>${m}</strong> &bull; MAN-HOURS: <strong>${p.toFixed(1)} hrs</strong></span>
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
          ${t.manpower&&t.manpower.length>0?t.manpower.map((e,i)=>{const v=Number(e.hoursWorked)||o.totalHours||8,E=Number(e.headCount)||0,A=Number(e.totalManHours)||E*v;return`
              <tr>
                <td style="font-weight: 700; color: #0f172a;">${e.tradeName}</td>
                <td style="font-size: 7.5px; color: #64748b;">${e.tradeCategory||"Direct Execution"}</td>
                <td>${e.companyOrSubcontractor||"Direct Labor"}</td>
                <td style="text-align: center; font-weight: 800; color: #0284c7;">${E}</td>
                <td style="text-align: center;">${v}</td>
                <td style="text-align: center; font-weight: 700;">${A.toFixed(1)}</td>
              </tr>
            `}).join(""):`
            <tr>
              <td colspan="6" style="text-align: center; color: #94a3b8; padding: 6px;">No manpower entries logged for this shift.</td>
            </tr>
          `}
          <tr style="background: #f1f5f9; font-weight: 800; border-top: 1.5px solid #cbd5e1;">
            <td colspan="3" style="text-align: right; text-transform: uppercase; font-size: 7.5px; color: #334155;">Cumulative Site Workforce:</td>
            <td style="text-align: center; color: #0284c7; font-size: 8.5px;">${m}</td>
            <td style="text-align: center; color: #64748b; font-size: 7px;">Avg ${o.totalHours||8}h</td>
            <td style="text-align: center; color: #0f172a; font-size: 8.5px;">${p.toFixed(1)}</td>
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
      ${(g=t.quality)!=null&&g.inspections&&t.quality.inspections.length>0?`
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
        ${(l=t.quality)!=null&&l.ncrsRaised&&t.quality.ncrsRaised.length>0?`<div><strong>NCRs Raised / Monitored:</strong> <span style="color: #dc2626; font-weight: 700;">${t.quality.ncrsRaised.join(", ")}</span></div>`:""}
        ${(n=t.quality)!=null&&n.qualityNotes?`<div style="margin-top: 2px;"><strong>QA/QC Notes:</strong> ${t.quality.qualityNotes}</div>`:""}
      </div>
      `:""}
    </div>

    <!-- ═══ 6.0 MATERIALS LOGISTICS & CONCRETE POURS ═══ -->
    ${(s=t.materials)!=null&&s.deliveries&&t.materials.deliveries.length>0||(r=t.materials)!=null&&r.concretePours&&t.materials.concretePours.length>0?`
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

      ${(C=t.materials)!=null&&C.deliveries&&t.materials.deliveries.length>0?`
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
            ${((O=t.hse)==null?void 0:O.toolboxTalkTopic)||"Daily Morning Safety & PPE Briefing"}
          </td>
          <td class="meta-label" style="width: 18%;">TBT ATTENDANCE:</td>
          <td class="meta-value" style="width: 16%; font-weight: 800; color: #0284c7;">
            ${((_=t.hse)==null?void 0:_.toolboxTalkAttendees)!=null?`${t.hse.toolboxTalkAttendees} Workers`:`${m} Workers`}
          </td>
        </tr>
        <tr>
          <td class="meta-label">INCIDENT RECORD:</td>
          <td class="meta-value" style="font-weight: 800; color: ${(D=t.hse)!=null&&D.incidentsReported?"#dc2626":"#15803d"};">
            ${(V=t.hse)!=null&&V.incidentsReported?`⚠️ ${t.hse.incidentsReported} INCIDENTS REPORTED (${t.hse.incidentDetails||""})`:"✅ ZERO (0) ACCIDENTS / LOST TIME INJURIES (LTI)"}
          </td>
          <td class="meta-label">HOUSEKEEPING:</td>
          <td class="meta-value" style="font-weight: 700;">
            ${((j=t.hse)==null?void 0:j.housekeepingRating)||"GOOD"}
          </td>
        </tr>
        ${(Y=t.hse)!=null&&Y.permitsToWork&&t.hse.permitsToWork.length>0?`
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
    ${t.delays&&t.delays.length>0||(z=t.consultant)!=null&&z.observations?`
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
      ${(P=t.consultant)!=null&&P.observations?`
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
              Name: <strong>${((ft=(pt=(X=t.signOffs)==null?void 0:X.SITE_ENGINEER)==null?void 0:pt.signedBy)==null?void 0:ft.name)||t.createdByName||"Site Engineer"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((Dt=(tt=(Ot=t.signOffs)==null?void 0:Ot.SITE_ENGINEER)==null?void 0:tt.signedBy)==null?void 0:Dt.designation)||"Project Field Engineer"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(_t=(Pt=t.signOffs)==null?void 0:Pt.SITE_ENGINEER)!=null&&_t.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">DIGITALLY SIGNED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((q=t.signOffs.SITE_ENGINEER.signedBy)==null?void 0:q.digitalStamp)||"VERIFIED-EXECUTION"}</div>
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
              Name: <strong>${((Lt=(at=(et=t.signOffs)==null?void 0:et.QAQC_ENGINEER)==null?void 0:at.signedBy)==null?void 0:Lt.name)||"Pending QA/QC Certification"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((Mt=(kt=(gt=t.signOffs)==null?void 0:gt.QAQC_ENGINEER)==null?void 0:kt.signedBy)==null?void 0:Mt.designation)||"QA/QC Lead Engineer"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(zt=(u=t.signOffs)==null?void 0:u.QAQC_ENGINEER)!=null&&zt.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">ISO 9001 CERTIFIED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((B=t.signOffs.QAQC_ENGINEER.signedBy)==null?void 0:B.digitalStamp)||"QAQC-CERT-PASSED"}</div>
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
              Name: <strong>${((mt=(w=(G=t.signOffs)==null?void 0:G.SAFETY_OFFICER)==null?void 0:w.signedBy)==null?void 0:mt.name)||"Pending HSE Clearance"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((bt=(Ut=(vt=t.signOffs)==null?void 0:vt.SAFETY_OFFICER)==null?void 0:Ut.signedBy)==null?void 0:bt.designation)||"Site Safety Manager"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(ht=(L=t.signOffs)==null?void 0:L.SAFETY_OFFICER)!=null&&ht.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">SAFETY CLEARED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((Ft=t.signOffs.SAFETY_OFFICER.signedBy)==null?void 0:Ft.digitalStamp)||"HSE-CLEARED"}</div>
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
              Name: <strong>${((Bt=(yt=(Jt=t.signOffs)==null?void 0:Jt.PROJECT_MANAGER)==null?void 0:yt.signedBy)==null?void 0:Bt.name)||((Ht=(xt=(Gt=t.signOffs)==null?void 0:Gt.CONSULTANT)==null?void 0:xt.signedBy)==null?void 0:Ht.name)||"Pending Final Endorsement"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((jt=(Qt=(Vt=t.signOffs)==null?void 0:Vt.PROJECT_MANAGER)==null?void 0:Qt.signedBy)==null?void 0:jt.designation)||"Project Manager / Consultant"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(Et=(Yt=t.signOffs)==null?void 0:Yt.PROJECT_MANAGER)!=null&&Et.signed||(St=(Tt=t.signOffs)==null?void 0:Tt.CONSULTANT)!=null&&St.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">APPROVED & ENDORSED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((Rt=(It=(Ct=t.signOffs)==null?void 0:Ct.PROJECT_MANAGER)==null?void 0:It.signedBy)==null?void 0:Rt.digitalStamp)||"PM-AUTHORIZED"}</div>
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
        ${t.photos.map((e,i)=>`
          <div style="width: 48%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; text-align: center; background: #f8fafc; page-break-inside: avoid; margin-bottom: 6px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #0284c7; text-align: left; margin-bottom: 3px; display: flex; justify-content: space-between;">
              <span>PHOTO #${i+1} ${e.tradeTag?`&bull; ${e.tradeTag}`:""}</span>
              <span style="color: #64748b; font-size: 7px;">${e.location||"Site"}</span>
            </div>
            <div style="height: 150px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
              <img src="${e.url}" alt="Site Evidence #${i+1}" style="max-height: 150px; max-width: 100%; object-fit: contain;" />
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
      <div>CONFIDENTIAL & STATUTORY QUALITY RECORD — ISO 9001:2015 CLAUSE 8.5.1 — ${c}</div>
      <div>Document Ref: ${f} &bull; Date: ${o.date}</div>
    </div>
  `;Z(`${f} - Daily Site Log (${o.date})`,T)}export{Ne as S,Xt as W,ze as a,Pe as b,_e as c,Ue as d,Oe as e,$e as f,De as g,we as h,Le as i,Me as j,ke as k,Fe as l,Z as o};
