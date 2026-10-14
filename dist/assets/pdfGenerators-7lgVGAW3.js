import{h as pe}from"./html2pdf-CpttaISV.js";import{c as oe}from"./permitChecklist-BHE5VmmF.js";import"./vendor-pdf-CqL8L5vX.js";import{b as se,r as X,u as te}from"./index-CRWjaoyc.js";import{j as ht}from"./vendor-three-h7LxBsfh.js";import{s as fe,b2 as ge,ag as he,d as be,bo as xe,af as me,O as ue}from"./vendor-icons-CHLyMjpm.js";import"./jspdf.plugin.autotable-Cg0p10kG.js";function de(t){if(!t||!t.trim())return[];const r=t.trim(),x=new RegExp("(?:^|\\n+|(?<=[.!?]\\s+)|(?<=\\b))((?:Dimensional\\s+Non-Conformance|Dimensional\\s+Check|Dimensional\\s+Defect|Non-Conformance|Defect\\s+Notice|Material\\s+Defect|Defects?|Discrepancy|Discrepancies|Operational\\s+Impact|Structural\\s+Impact|Engineering\\s+Impact|Risk\\s+Assessment|Safety\\s+Impact|Technical\\s+Impact|Management\\s+Directive|Executive\\s+Directive|Management\\s+Override|Management\\s+Instruction|Director'?s?\\s+Override|Director'?s?\\s+Directive|Executive\\s+Instruction|Site\\s+Instruction|Liability\\s+Disclaimer|Disclaimer|Warranty\\s+Notice|Indemnity\\s+Clause|Indemnity|Legal\\s+Notice|Corrective\\s+Action|Mandatory\\s+Action|Action\\s+Required|Remedial\\s+Action|Resolution|Mitigation|Technical\\s+Evaluation|Technical\\s+Justification|Specification\\s+Reference|QA\\/QC\\s+Observation|Inspector\\s+Notes?|Notes?|Special\\s+Instructions?|Caveats?|Conditions?|Observations?|Root\\s+Cause|Justification|Disposition\\s+Notice|Testing\\s+Conditions?))(?:\\s*:\\s*|\\s*—\\s*|\\s*-\\s*)","gi"),l=Array.from(r.matchAll(x));if(l.length>=1){const b=[],h=l[0].index??0;if(h>0){const d=r.substring(0,h).trim();d&&b.push({category:"standard",header:"",content:d})}for(let d=0;d<l.length;d++){const m=l[d],f=m.index??0,u=m[0],$=m[1].trim(),I=l[d+1],A=I?I.index??r.length:r.length,p=r.substring(f+u.length,A).trim(),a=$.toLowerCase();let v="standard";a.includes("non-conformance")||a.includes("defect")||a.includes("discrepanc")?v="defect":a.includes("impact")||a.includes("risk")||a.includes("safety")?v="impact":a.includes("directive")||a.includes("override")||a.includes("instruction")?v="directive":a.includes("disclaimer")||a.includes("liability")||a.includes("indemnity")||a.includes("warranty")||a.includes("legal")?v="disclaimer":a.includes("action")||a.includes("remedial")||a.includes("corrective")||a.includes("resolution")||a.includes("mitigation")?v="action":(a.includes("note")||a.includes("observation")||a.includes("condition")||a.includes("caveat")||a.includes("evaluation")||a.includes("justification")||a.includes("root cause"))&&(v="note"),b.push({category:v,header:$,content:p})}return b}const S=r.split(/\n\s*\n|\r\n\s*\r\n|\n/).map(b=>b.trim()).filter(Boolean);return S.length===0?[{category:"standard",header:"",content:r}]:S.map(b=>{const h=b.match(/^([A-Za-z0-9\s/&'_-]{3,45}):\s+(.+)$/s);if(h){const d=h[1].trim(),m=h[2].trim(),f=d.toLowerCase();let u="note";return f.includes("defect")||f.includes("non-conformance")||f.includes("fail")||f.includes("error")||f.includes("discrepanc")?u="defect":f.includes("impact")||f.includes("risk")||f.includes("safety")?u="impact":f.includes("directive")||f.includes("override")||f.includes("instruction")?u="directive":f.includes("disclaimer")||f.includes("liability")||f.includes("indemnity")?u="disclaimer":(f.includes("action")||f.includes("required")||f.includes("remed"))&&(u="action"),{category:u,header:d,content:m}}return{category:"standard",header:"",content:b}})}function Jt(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function Kt(t,r="No inspection observations or notes recorded."){const x=de(t);return x.length===0?`<div style="font-size: 8px; color: #64748b; font-style: italic; line-height: 1.4;">${Jt(r)}</div>`:x.length===1&&!x[0].header?`<div style="font-size: 8px; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">${Jt(x[0].content)}</div>`:`
    <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
      ${x.map(l=>{let S="#f8fafc",b="#cbd5e1",h="3.5px solid #64748b",d="#e2e8f0",m="#334155",f="#cbd5e1";switch(l.category){case"defect":S="#fff5f5",b="#fecaca",h="3.5px solid #dc2626",d="#fee2e2",m="#991b1b",f="#fca5a5";break;case"impact":S="#fffbeb",b="#fef08a",h="3.5px solid #d97706",d="#fef3c7",m="#92400e",f="#fcd34d";break;case"directive":S="#faf5ff",b="#e9d5ff",h="3.5px solid #7c3aed",d="#f3e8ff",m="#581c87",f="#d8b4fe";break;case"disclaimer":S="#f8fafc",b="#cbd5e1",h="3.5px solid #334155",d="#e2e8f0",m="#0f172a",f="#94a3b8";break;case"action":S="#f0fdf4",b="#bbf7d0",h="3.5px solid #16a34a",d="#dcfce7",m="#166534",f="#86efac";break;case"note":S="#f0f9ff",b="#bae6fd",h="3.5px solid #0284c7",d="#e0f2fe",m="#0369a1",f="#7dd3fc";break;default:S="#ffffff",b="#e2e8f0",h="3px solid #94a3b8",d="#f1f5f9",m="#475569",f="#cbd5e1";break}return`
            <div style="background: ${S}; border: 1px solid ${b}; border-left: ${h}; border-radius: 4px; padding: 6px 8px; box-sizing: border-box; page-break-inside: avoid; break-inside: avoid;">
              ${l.header?`
                <div style="margin-bottom: 3.5px; display: flex; align-items: center; gap: 6px;">
                  <span style="display: inline-block; padding: 1.5px 6px; background: ${d}; color: ${m}; border: 1px solid ${f}; border-radius: 3px; font-weight: 800; font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.4px;">
                    ${Jt(l.header)}
                  </span>
                </div>
              `:""}
              <div style="font-size: 8px; color: #1e293b; line-height: 1.5; white-space: pre-wrap; font-weight: ${l.category==="defect"||l.category==="directive"?"600":"400"};">
                ${Jt(l.content)}
              </div>
            </div>
          `}).join("")}
    </div>
  `}const we=({text:t,fallback:r="No observations or details recorded.",className:x="",defaultCategory:l})=>{const S=de(t);return S.length===0?ht.jsx("div",{className:`p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 italic text-xs ${x}`,children:r}):(S.length===1&&!S[0].header&&l&&(S[0].category=l),ht.jsx("div",{className:`space-y-2.5 ${x}`,children:S.map((b,h)=>{let d="bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 border-l-4 border-l-slate-500",m="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",f=fe;switch(b.category){case"defect":d="bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200 border-l-4 border-l-red-600",m="bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 border-red-300 dark:border-red-800",f=ue;break;case"impact":d="bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 border-l-4 border-l-amber-500",m="bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800",f=me;break;case"directive":d="bg-purple-50/80 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/60 text-purple-900 dark:text-purple-200 border-l-4 border-l-purple-600",m="bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-800",f=xe;break;case"disclaimer":d="bg-slate-100/90 dark:bg-slate-900/90 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 border-l-4 border-l-slate-700 dark:border-l-slate-400",m="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-400 dark:border-slate-600",f=be;break;case"action":d="bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-l-4 border-l-emerald-600",m="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800",f=he;break;case"note":d="bg-sky-50/80 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/60 text-sky-900 dark:text-sky-200 border-l-4 border-l-sky-500",m="bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-800",f=ge;break}return ht.jsxs("div",{className:`p-3.5 rounded-xl border shadow-sm transition ${d}`,children:[b.header&&ht.jsx("div",{className:"flex items-center gap-2 mb-1.5",children:ht.jsxs("span",{className:`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border font-mono ${m}`,children:[ht.jsx(f,{className:"w-3 h-3 shrink-0"}),ht.jsx("span",{children:b.header})]})}),ht.jsx("p",{className:"text-xs leading-relaxed whitespace-pre-wrap font-medium",children:b.content})]},h)})}))},ee={"classic-executive":{id:"classic-executive",name:"Corporate Executive",tagline:"Signature Prestige & Gold Dossier",description:"Classic corporate look with bronze/warm gold accents, deep navy typography, and dual-tone hero cover.",accentColor:"#c28b5e",accentDark:"#9a6538",accentLight:"#fbf6f0",primaryHeaderBg:"#0f172a",headerTextColor:"#ffffff",cardBg:"#ffffff",cardBorder:"#e2e8f0",cardRadius:"6px",badgeBg:"#0f172a",badgeTextColor:"#ffffff",badgeBorder:"#0f172a",ruleColor:"#c28b5e",coverStyle:"split-bronze",fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",headingFont:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",tableHeaderBg:"#0f172a",tableHeaderTextColor:"#ffffff",tableBorderColor:"#e2e8f0",tableZebraBg:"#f8fafc",badgeApprovedBg:"#ecfdf5",badgeApprovedColor:"#059669",badgeApprovedBorder:"#a7f3d0",badgeRejectedBg:"#fef2f2",badgeRejectedColor:"#dc2626",badgeRejectedBorder:"#fecaca",badgePendingBg:"#f8fafc",badgePendingColor:"#64748b",badgePendingBorder:"#e2e8f0",previewThumbnailColor:"#c28b5e",previewBorderColor:"#d49a5b",cssVariables:{"--report-accent":"#c28b5e","--report-accent-dark":"#9a6538","--report-accent-light":"#fbf6f0","--report-header-bg":"#0f172a","--report-header-text":"#ffffff","--report-border":"#e2e8f0","--report-rule":"#c28b5e"}},"engineering-blueprint":{id:"engineering-blueprint",name:"Modern Blueprint",tagline:"Technical CAD & Engineering Azure",description:"A precision architectural aesthetic featuring technical cyan rules, dark blueprint header accents, and structural grid borders.",accentColor:"#0284c7",accentDark:"#0369a1",accentLight:"#f0f9ff",primaryHeaderBg:"#0c4a6e",headerTextColor:"#ffffff",cardBg:"#ffffff",cardBorder:"#bae6fd",cardRadius:"3px",badgeBg:"#0369a1",badgeTextColor:"#ffffff",badgeBorder:"#0284c7",ruleColor:"#0284c7",coverStyle:"blueprint-cad",fontFamily:"'Segoe UI', Roboto, -apple-system, sans-serif",headingFont:"'Segoe UI', Roboto, sans-serif",tableHeaderBg:"#0c4a6e",tableHeaderTextColor:"#ffffff",tableBorderColor:"#bae6fd",tableZebraBg:"#f0f9ff",badgeApprovedBg:"#ecfeff",badgeApprovedColor:"#0891b2",badgeApprovedBorder:"#a5f3fc",badgeRejectedBg:"#fff1f2",badgeRejectedColor:"#e11d48",badgeRejectedBorder:"#fecdd3",badgePendingBg:"#f8fafc",badgePendingColor:"#475569",badgePendingBorder:"#cbd5e1",previewThumbnailColor:"#0284c7",previewBorderColor:"#38bdf8",cssVariables:{"--report-accent":"#0284c7","--report-accent-dark":"#0369a1","--report-accent-light":"#f0f9ff","--report-header-bg":"#0c4a6e","--report-header-text":"#ffffff","--report-border":"#bae6fd","--report-rule":"#0284c7"}},"minimal-editorial":{id:"minimal-editorial",name:"Minimalist Editorial",tagline:"Swiss Clean Monochrome & Typography",description:"High-end Swiss editorial layout with charcoal accents, subtle hairline rules, generous white-space, and refined elegance.",accentColor:"#334155",accentDark:"#1e293b",accentLight:"#f8fafc",primaryHeaderBg:"#1e293b",headerTextColor:"#ffffff",cardBg:"#ffffff",cardBorder:"#cbd5e1",cardRadius:"0px",badgeBg:"#1e293b",badgeTextColor:"#ffffff",badgeBorder:"#1e293b",ruleColor:"#334155",coverStyle:"minimalist-clean",fontFamily:"system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",headingFont:"system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",tableHeaderBg:"#1e293b",tableHeaderTextColor:"#ffffff",tableBorderColor:"#e2e8f0",tableZebraBg:"#f8fafc",badgeApprovedBg:"#f1f5f9",badgeApprovedColor:"#0f172a",badgeApprovedBorder:"#94a3b8",badgeRejectedBg:"#fef2f2",badgeRejectedColor:"#b91c1c",badgeRejectedBorder:"#fca5a5",badgePendingBg:"#f8fafc",badgePendingColor:"#64748b",badgePendingBorder:"#e2e8f0",previewThumbnailColor:"#334155",previewBorderColor:"#64748b",cssVariables:{"--report-accent":"#334155","--report-accent-dark":"#1e293b","--report-accent-light":"#f8fafc","--report-header-bg":"#1e293b","--report-header-text":"#ffffff","--report-border":"#cbd5e1","--report-rule":"#334155"}},"industrial-safety":{id:"industrial-safety",name:"Industrial High-Vis",tagline:"Site Safety Amber & Charcoal Contrast",description:"Construction-grade visual format with high-contrast safety amber borders, bold uppercase typography, and prominent QA/QC status ribbons.",accentColor:"#d97706",accentDark:"#b45309",accentLight:"#fffbeb",primaryHeaderBg:"#18181b",headerTextColor:"#ffffff",cardBg:"#ffffff",cardBorder:"#fde68a",cardRadius:"8px",badgeBg:"#d97706",badgeTextColor:"#ffffff",badgeBorder:"#d97706",ruleColor:"#d97706",coverStyle:"industrial-bold",fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",headingFont:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",tableHeaderBg:"#18181b",tableHeaderTextColor:"#fde047",tableBorderColor:"#fde68a",tableZebraBg:"#fffbeb",badgeApprovedBg:"#ecfdf5",badgeApprovedColor:"#047857",badgeApprovedBorder:"#6ee7b7",badgeRejectedBg:"#fef2f2",badgeRejectedColor:"#b91c1c",badgeRejectedBorder:"#f87171",badgePendingBg:"#fffbeb",badgePendingColor:"#92400e",badgePendingBorder:"#fde68a",previewThumbnailColor:"#d97706",previewBorderColor:"#f59e0b",cssVariables:{"--report-accent":"#d97706","--report-accent-dark":"#b45309","--report-accent-light":"#fffbeb","--report-header-bg":"#18181b","--report-header-text":"#ffffff","--report-border":"#fde68a","--report-rule":"#d97706"}}},ye="classic-executive";function ve(t){return t in ee?ee[t]:ee[ye]}const Ee=`
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
`;function tt(t,r,x=""){const l=window.open("","_blank");if(!l){alert("Please allow popups to generate and print the quality document.");return}const S=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${t}</title>
  <style>
    ${Ee}
    ${x}
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
</html>`;l.document.open(),l.document.write(S),l.document.close()}const w=t=>{if(!t||t==="—")return"—";const r=t instanceof Date?t:new Date(t);return isNaN(r.getTime())?String(t):r.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})};function Oe(t,r={},x={}){var A;const l=x.name,S=r.name,b=t.ptpNumber||`PTP-${Math.floor(1e3+Math.random()*9e3)}`,h=((A=t.checklistItems)!=null&&A.length?t.checklistItems:oe()).map((p,a)=>{var v;return{cat:p.category||"General",param:p.label,status:p.status||(a===0&&((v=t.checklist)!=null&&v.rebarInspectionApproved),"PASS")}});(t.stakeholders||[]).filter(p=>p.required);const d=t.status==="REJECTED",f=(()=>{if(d)return[{role:"QA/QC Engineer",name:t.issuedByName,required:!0}];if(t.stakeholders&&t.stakeholders.length>0)return t.stakeholders;const p=t.requiredSignoffs,a=[{role:"QA/QC Engineer",name:t.issuedByName,required:!0}];return(!p||p.siteManager!==!1)&&a.push({role:"Site / Construction Manager",name:"",required:!0}),(!p||p.structuralConsultant!==!1)&&a.push({role:"Structural Consultant / Engineer",name:"",required:!0}),p!=null&&p.mechanicalEngineer&&a.push({role:"Mechanical Engineer",name:"",required:!1}),p!=null&&p.electricalEngineer&&a.push({role:"Electrical Engineer",name:"",required:!1}),a})(),u=t,$=`
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
            ${X(x,r)}
          </td>
          <td style="width: 55%;">
            <div class="header-title">Official Permit To Pour (PTP) Authorization</div>
            <div class="header-sub">PROJECT: ${S}</div>
          </td>
          <td style="width: 25%;" class="meta-box">
            <strong>PTP Ref:</strong> <span style="color:#ea580c; font-weight:700;">${u.permitNumber}</span><br/>
            <strong>Scheduled Pour:</strong> ${w(u.pourDate)} (${u.pourTime})<br/>
            <strong>Status:</strong> <span class="${d?"status-rejected":"status-issued"}">${u.status||"ISSUED"}</span>
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
            ${h.map((p,a)=>`
              <tr>
                <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #64748b;">${a+1}</td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center;">
                  <span style="font-weight: 800; font-size: 8px; padding: 1px 4px; border-radius: 2px; ${p.status==="PASS"?"background: #dcfce7; color: #15803d;":p.status==="FAIL"?"background: #fee2e2; color: #b91c1c;":"background: #f1f5f9; color: #64748b;"}">${p.status}</span>
                </td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 700; color: #334155;">${p.cat}</td>
                <td style="padding: 5px; border: 1px solid #e2e8f0; font-weight: 500; color: #0f172a;">${p.param}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="pdf-section">
        <div class="section-title">4.0 Statutory Authorizations & Stakeholder Sign-Off Block</div>
        <table class="section-table" style="margin-top: 4px;">
          ${f.reduce((p,a,v)=>{if(v%2===0){const g=f[v+1],o=I(a),n=g?I(g):'<td style="width: 50%; height: 75px; background: #fafafa; border: 1px dashed #cbd5e1;"></td>';p+=`<tr>${o}${n}</tr>`}return p},"")}
        </table>
      </div>

      <div class="footer-fallback">
        <span>CONFIDENTIAL — ${l}</span>
        <span>PTP Ref: ${u.permitNumber}</span>
      </div>

      <script>
        window.onload = () => {
          window.print();
        };
      <\/script>
    </body>
    </html>
  `;function I(p){const a=p.required?"#15803d":"#64748b",v=p.required?"REQUIRED":"OPTIONAL";return`
      <td style="width: 50%; height: 75px; vertical-align: top; padding: 6px 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span style="font-weight: 700; font-size: 8px; text-transform: uppercase; color: #ea580c;">${p.designation?`${p.designation} <span style="font-size: 7px; color: #64748b; font-weight: normal;">(${p.role})</span>`:p.role}</span>
          <span style="font-size: 6px; font-weight: 700; background: ${a}15; color: ${a}; padding: 1px 3px; border-radius: 2px;">${v}</span>
        </div>
        <div style="font-size: 8px; margin-bottom: 8px;">Name: <strong>${p.name||"__________________________________________________"}</strong></div>
        <div style="font-size: 8px; display: flex; justify-content: space-between;">
          <span>Sign: ________________________</span>
          <span>Date: ____ / ____ / 20__</span>
        </div>
      </td>
    `}tt(`${b} - Permit to Pour`,$)}function De(t,r={},x={}){var p;const l=x.name,S=r.companyName,b=t.ptpNumber||`PTP-${Math.floor(1e3+Math.random()*9e3)}`,h=((p=t.checklistItems)!=null&&p.length?t.checklistItems:oe()).map((a,v)=>{var g;return{cat:a.category||"General",param:a.label,status:a.status||(v===0&&((g=t.checklist)!=null&&g.rebarInspectionApproved),"PASS")}}),d=t.status==="REJECTED",f=(()=>{if(d)return[{role:"QA/QC Engineer",name:t.issuedByName||"J. Oladejo",required:!0}];if(t.stakeholders&&t.stakeholders.length>0)return t.stakeholders.filter(g=>g.required);const a=t.requiredSignoffs,v=[{role:"QA/QC Engineer",name:t.issuedByName||"",required:!0}];return(!a||a.siteManager!==!1)&&v.push({role:"Site / Construction Manager",name:"",required:!0}),(!a||a.structuralConsultant!==!1)&&v.push({role:"Structural Consultant / Engineer",name:"",required:!0}),a!=null&&a.mechanicalEngineer&&v.push({role:"Mechanical Engineer",name:"",required:!0}),a!=null&&a.electricalEngineer&&v.push({role:"Electrical Engineer",name:"",required:!0}),v})(),u=`
    <div id="pdf-document" style="padding: 20px; font-family: Arial, sans-serif; color: #0f172a; background: #fff;">
      <!-- Header -->
      <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #0f172a; margin-bottom: 12px; background: #ffffff;">
        <tr>
          <td style="width: 22%; border: 1px solid #cbd5e1; padding: 6px; text-align: center; vertical-align: middle; background: #ffffff;">
            ${X(x,r)}
          </td>
          <td style="width: 53%; border: 1px solid #cbd5e1; padding: 6px; text-align: center; vertical-align: middle;">
            <div style="font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; color: #0f172a;">PERMIT TO POUR (PTP) AUTHORIZATION</div>
            <div style="font-size: 9.5px; font-weight: 700; color: #ea580c; margin-top: 2px; text-transform: uppercase;">PROJECT: ${S}</div>
            <div style="font-size: 7.5px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-top: 1px;">ISO 9001:2015 Clause 8.6 Release of Products & Services</div>
          </td>
          <td style="width: 25%; border: 1px solid #cbd5e1; padding: 6px; font-size: 8px; line-height: 1.5; color: #334155; vertical-align: middle;">
            <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${b}</span></div>
            <div><strong>Date:</strong> ${w(t.plannedPourDate)}</div>
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
            ${h.map((a,v)=>`
              <tr>
                <td style="padding: 5px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #64748b;">${v+1}</td>
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
          ${f.reduce((a,v,g)=>{if(g%2===0){const o=f[g+1],n=$(v),c=o?$(o):'<td style="width: 50%; height: 70px; background: #fafafa; border: 1px solid #e2e8f0;"></td>';a+=`<tr>${n}${c}</tr>`}return a},"")}
        </table>
      </div>

      <!-- Footer -->
      <div style="font-size: 8px; color: #64748b; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 5px; margin-top: 10px;">
        <div>CONFIDENTIAL & PROPRIETARY — ${l}</div>
        <div>Doc Ref: ${b}</div>
      </div>
    </div>
  `;function $(a){const v=a.required?"#15803d":"#64748b",g=a.required?"REQUIRED":"OPTIONAL";return`
      <td style="width: 50%; height: 70px; vertical-align: top; padding: 6px 8px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span style="font-weight: 700; font-size: 8px; text-transform: uppercase; color: #ea580c;">${a.designation?`${a.designation} <span style="font-size: 7px; color: #64748b; font-weight: normal;">(${a.role})</span>`:a.role}</span>
          <span style="font-size: 6px; font-weight: 700; background: ${v}15; color: ${v}; padding: 1px 3px; border-radius: 2px;">${g}</span>
        </div>
        <div style="font-size: 8px; margin-bottom: 8px;">Name: <strong>${a.name||"__________________________________________________"}</strong></div>
        <div style="font-size: 8px; display: flex; justify-content: space-between;">
          <span>Sign: ________________________</span>
          <span>Date: ____ / ____ / 20__</span>
        </div>
      </td>
    `}const I=document.createElement("div");I.innerHTML=u,document.body.appendChild(I);const A={margin:[10,10,10,10],filename:`${b}_PermitToPour.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:!0,logging:!1},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"}};pe().set(A).from(I).toPdf().get("pdf").then(a=>{const v=a.internal.getNumberOfPages();for(let g=1;g<=v;g++)a.setPage(g),a.setFont("helvetica","normal"),a.setFontSize(6.5),a.setTextColor(100,116,139),a.text(`CONFIDENTIAL & PROPRIETARY — ${l}`,10,291),a.text(`PTP Ref: ${t.permitNumber}  |  Page ${g} of ${v}`,200,291,{align:"right"});a.save(`${b}.pdf`)}).catch(a=>{console.error("PDF generation failed:",a)}).finally(()=>{document.body.removeChild(I)})}function Te(t,r={},x={}){var p,a,v;const l=x.name||"Collection Developments LTD",S=r.name||"Bankside",b=t.inspectionNumber||`INSP-2026-${Math.floor(1e3+Math.random()*9e3)}`,h=t.items||[],d=h.filter(g=>g.result==="PASS").length,m=h.filter(g=>g.result==="FAIL").length,f=h.filter(g=>g.result==="OBSERVATION").length,$=(g=>{switch(g==null?void 0:g.toUpperCase()){case"APPROVED":case"CLOSED":return{bg:"#dcfce7",text:"#15803d",border:"#86efac"};case"PENDING_REVIEW":return{bg:"#fef3c7",text:"#b45309",border:"#fcd34d"};case"REJECTED":return{bg:"#fee2e2",text:"#b91c1c",border:"#fca5a5"};default:return{bg:"#f1f5f9",text:"#334155",border:"#cbd5e1"}}})(t.status),I=t.stakeholders&&t.stakeholders.length>0?t.stakeholders.filter(g=>g.required!==!1):[{role:"QA/QC Inspector",name:((p=t.inspector)==null?void 0:p.name)||t.inspectorName||"QA/QC Inspector",designation:((a=t.inspector)==null?void 0:a.designation)||"QA/QC Inspector",required:!0,signed:t.status==="APPROVED"||t.status==="CLOSED",signedAt:t.approvedAt?new Date(t.approvedAt).toISOString():void 0},{role:"Site / Construction Engineer",name:t.subcontractorRepresentative||"Site Engineer",designation:"Site Engineer",required:!0,signed:!1},{role:"Consultant / Resident Engineer",name:t.consultantRepresentative||"Resident Engineer",designation:"Consultant",required:!0,signed:!1}],A=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${X(x,r)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">FIELD INSPECTION & VERIFICATION REPORT</div>
          <div class="header-title-project">PROJECT: ${S}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.6 Monitoring & Measurement of Processes</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${b}</span></div>
          <div><strong>Date:</strong> ${w(t.scheduledDate||t.createdAt)}</div>
          <div><strong>Status:</strong> <span class="status-badge" style="background:${$.bg}; color:${$.text}; border:1px solid ${$.border};">${t.status||"DRAFT"}</span></div>
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
          <td class="grid-value"><strong>${((v=t.inspector)==null?void 0:v.name)||t.inspectorName||"QA/QC Inspector"}</strong></td>
        </tr>
      </table>
    </div>

    <!-- 2.0 Hold Point Verification Checklist -->
    <div class="pdf-section">
      <div class="section-banner">2.0 TECHNICAL VERIFICATION CHECKPOINTS (${h.length} ITEMS | ${d} PASS, ${m} FAIL, ${f} OBS)</div>
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
          ${h.length>0?h.map((g,o)=>`
            <tr>
              <td style="text-align: center; font-weight: 700; color: #64748b;">${o+1}</td>
              <td style="text-align: center;">
                <span class="${g.result==="PASS"?"badge-pass":g.result==="FAIL"?"badge-fail":g.result==="OBSERVATION"?"badge-observation":"badge-na"}">${g.result||"PENDING"}</span>
              </td>
              <td style="font-weight: 700; color: #334155;">
                ${g.category||g.discipline||"Structural"}
                ${g.critical?'<br/><span class="badge-fail" style="font-size:6.5px; padding:0 3px;">CRITICAL</span>':""}
                ${g.isHoldPoint?'<br/><span class="badge-hold" style="font-size:6.5px; padding:0 3px;">HOLD POINT</span>':""}
              </td>
              <td>
                <div style="font-weight: 600; color: #0f172a;">${g.label}</div>
                ${g.acceptanceCriteria?`<div style="font-size: 7px; color: #64748b; margin-top: 1px; italic">Criteria: ${g.acceptanceCriteria}</div>`:""}
              </td>
              <td style="font-size: 7.2px; color: #475569;">${g.remarks||"—"}</td>
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
    ${h.some(g=>g.photos&&g.photos.length>0)?`
    <div class="pdf-section">
      <div class="section-banner">3.0 PHOTOGRAPHIC VERIFICATION RECORDS</div>
      <div class="photo-grid">
        ${h.flatMap(g=>(g.photos||[]).map(o=>({url:o,label:g.label}))).map((g,o)=>`
          <div class="photo-card">
            <span class="photo-tag">Photo #${o+1}</span>
            <div><img src="${g.url}" alt="Inspection Evidence" /></div>
            <div class="photo-caption">${g.label}</div>
          </div>
        `).join("")}
      </div>
    </div>
    `:""}

    <!-- 4.0 Statutory Sign-Off -->
    <div class="pdf-section">
      <div class="section-banner">4.0 STATUTORY WITNESS & VERIFICATION SIGN-OFF</div>
      <table class="signoff-table">
        ${(()=>{let g="";for(let n=0;n<I.length;n+=3){const c=I.slice(n,n+3),R=(100/Math.max(c.length,1)).toFixed(2);g+=`<tr>${c.map(C=>`
              <td style="width: ${R}%; vertical-align: top; padding: 6px 8px; border: 1px solid #cbd5e1; background: ${C.signed?"#f0fdf4":"#fafafa"};">
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
                  <span>Date: ${C.signed&&C.signedAt?w(C.signedAt):C.signed?w(t.scheduledDate||t.createdAt):"____/____/20__"}</span>
                </div>
              </td>
            `).join("")}</tr>`}return g})()}
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${l}</div>
      <div>Inspection Ref: ${b}</div>
    </div>
  `;tt(`${b} - Inspection Report`,A)}const Pe=Te;function ne(t,r){if(!t||!t.trim())return`
      <div style="font-size: 7.5px; color: #64748b; margin-bottom: 3.5px;">
        <strong style="color: ${r.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 1.5px;">${r.title}:</strong>
        <span style="font-style: italic;">—</span>
      </div>
    `;const l=t.replace(/<br\s*\/?>/gi,`
`).split(/\r?\n/).map(h=>h.trim()).filter(Boolean);if(l.length===0)return`
      <div style="font-size: 7.5px; color: #64748b; margin-bottom: 3.5px;">
        <strong style="color: ${r.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 1.5px;">${r.title}:</strong>
        <span style="font-style: italic;">—</span>
      </div>
    `;if(l.length===1)return`
      <div style="font-size: 7.5px; color: ${r.textColor||"#0f172a"}; margin-bottom: 3.5px;">
        <strong style="color: ${r.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 1.5px;">${r.title}:</strong>
        <div style="white-space: pre-line; line-height: 1.45;">${l[0]}</div>
      </div>
    `;const S=l.every(h=>/^(\d+[\.\)]|[a-zA-Z][\.\)]|[-•*])\s*/.test(h)),b=l.map((h,d)=>`
        <div style="display: flex; align-items: flex-start; line-height: 1.4; margin-bottom: 2.5px;">
          ${S?"":`<span style="font-weight: 700; color: ${r.bulletColor||r.titleColor}; margin-right: 4px; min-width: 13px; display: inline-block;">${d+1}.</span>`}
          <span style="flex: 1; white-space: pre-line;">${h}</span>
        </div>
      `).join("");return`
    <div style="font-size: 7.5px; color: ${r.textColor||"#0f172a"}; margin-bottom: 4px;">
      <strong style="color: ${r.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 2px;">${r.title}:</strong>
      <div style="padding-left: 1px;">
        ${b}
      </div>
    </div>
  `}function _e(t,r={},x={}){var I,A,p,a,v,g;const l=(p=(A=(I=se)==null?void 0:I.getState)==null?void 0:A.call(I))==null?void 0:p.activeProject,b=(((g=(v=(a=se)==null?void 0:a.getState)==null?void 0:v.call(a))==null?void 0:g.projects)||[]).find(o=>o.id===(t.projectId||t.project)),h=(x==null?void 0:x.name)||t.companyName||"Collection Developments LTD",d=(r==null?void 0:r.name)||t.projectName||t.projectTitle||(b==null?void 0:b.name)||(l==null?void 0:l.name)||"Site Construction Operations",m=t.reportNumber||`QC-COMM-${Math.floor(1e3+Math.random()*9e3)}`,f=t.observations||[],u=f.filter(o=>o.status!=="CLOSED"&&o.status!=="Compliant"&&o.status!=="RECTIFIED").length,$=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${X(x,r)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">SITE COMMENTS & FIELD OBSERVATIONS REPORT</div>
          <div class="header-title-project">PROJECT: ${d}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.5 & 8.7 Nonconformity Identification</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${m}</span></div>
          <div><strong>Date:</strong> ${w(t.inspectionDate||t.createdAt)}</div>
          <div><strong>Status:</strong> <span class="${u===0?"badge-pass":"badge-pending"}">${u===0?"ALL CLOSED":`${u} ACTION(S) PENDING`}</span></div>
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
          <td class="grid-value" style="width: 32%;">${w(t.inspectionDate)}</td>
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
      <div class="section-banner">2.0 QUALITY OBSERVATIONS & CORRECTIVE DIRECTIVES (${f.length} OBSERVATIONS)</div>
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
          ${f.length>0?f.map((o,n)=>{const c=o.comments||o.observationText||o.fieldObservation||"—",R=o.correctiveDirective||"Rectify per approved engineering specifications.",C=o.status==="CLOSED"||o.status==="Compliant"||o.status==="RECTIFIED";return`
            <tr>
              <td style="text-align: center; font-weight: 700; color: #64748b;">${n+1}</td>
              <td>
                <div style="font-weight: 700; color: #0f172a;">${o.levelName||"Site Area"}</div>
                ${o.structuralElement?`<div style="font-size: 7.2px; font-weight: 600; color: #ea580c;">${o.structuralElement}</div>`:""}
                ${o.gridLocation?`<div style="font-size: 7px; color: #64748b;">Grid: ${o.gridLocation}</div>`:""}
                <div style="font-size: 7px; color: #475569; margin-top: 2px;"><strong>Trade:</strong> ${o.tradeName||o.trade||"Civil"}</div>
              </td>
              <td>
                ${ne(c,{title:"Observed Condition",titleColor:"#991b1b",bulletColor:"#991b1b",textColor:"#0f172a"})}
                ${ne(R,{title:"Corrective Directive",titleColor:"#15803d",bulletColor:"#15803d",textColor:"#166534"})}
                <div style="font-size: 7px; color: #64748b; margin-top: 2px;">
                  Assigned To: <strong>${o.assignedTo||o.assignedSubcontractor||"Contractor"}</strong>
                  ${o.dueDate?` | Target Due: ${w(o.dueDate)}`:""}
                </div>

                ${o.photos&&o.photos.length>0?`
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; padding-top: 3px; border-top: 1px dashed #cbd5e1;">
                  ${o.photos.map((D,_)=>{const L=typeof D=="string"?D:(D==null?void 0:D.url)||(D==null?void 0:D.thumbnailUrl);return L?`<img src="${L}" style="height: 50px; max-width: 80px; object-fit: cover; border-radius: 2px; border: 1px solid #cbd5e1;" alt="Photo ${_+1}" />`:""}).join("")}
                </div>
                `:""}
              </td>
              <td style="text-align: center;">
                <span class="${C?"badge-pass":"badge-pending"}">${o.status||"OPEN"}</span>
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
              <span>Date: ${w(t.inspectionDate||t.createdAt)}</span>
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
      <div>CONFIDENTIAL & PROPRIETARY — ${h}</div>
      <div>Report Ref: ${m}</div>
    </div>
  `;tt(`${m} - Site Comments`,$)}function Le(t,r={},x={}){var d,m,f,u,$,I,A,p;const l=x.name||"Collection Developments LTD",S=r.name||"Bankside",b=t.rfiNumber||`RFI-2026-${Math.floor(1e3+Math.random()*9e3)}`,h=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${X(x,r)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">REQUEST FOR INFORMATION (RFI)</div>
          <div class="header-title-project">PROJECT: ${S}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.2 Design & Engineering Communications</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${b}</span></div>
          <div><strong>Date Raised:</strong> ${w(t.createdAt)}</div>
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
          <td class="grid-value">${((d=t.raisedBy)==null?void 0:d.name)||"Site Engineer"} (${((m=t.raisedBy)==null?void 0:m.role)||"Main Contractor"})</td>
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
      <div class="section-banner">4.0 CONSULTANT FORMAL RESPONSE & DIRECTIVE [${((f=t.response)==null?void 0:f.approvalStatus)||"UNDER REVIEW"}]</div>
      <div class="box-content">
        <div style="line-height: 1.45; color: #0f172a; margin-bottom: 6px;">
          ${((u=t.response)==null?void 0:u.responseText)||"Official response is currently being finalized by the engineering design consultant."}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #475569; border-top: 1px solid #f1f5f9; padding-top: 4px;">
          <span>Reviewed By: <strong>${(($=t.response)==null?void 0:$.responderName)||t.assignedConsultant||"Consultant"}</strong></span>
          <span>Response Date: <strong>${w((I=t.response)==null?void 0:I.responseDate)}</strong></span>
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
              <span>Date: ${w(t.createdAt)}</span>
            </div>
          </td>
          <td style="width: 50%;">
            <div class="sig-role-header"><span>CONSULTANT / LEAD ENGINEER</span><span class="sig-required-tag">REQUIRED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${t.assignedConsultant||"Lead Consultant"}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${w((p=t.response)==null?void 0:p.responseDate)}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${l}</div>
      <div>RFI Ref: ${b}</div>
    </div>
  `;tt(`${b} - Technical RFI`,h)}function ke(t,r={},x={}){var u,$,I,A,p;const l=x.name||"Collection Developments LTD",S=r.name||"Bankside",b=t.marNumber||`MAR-2026-${Math.floor(1e3+Math.random()*9e3)}`,h=t.submittedByName||(typeof t.submittedBy=="string"?t.submittedBy:"QA/QC Materials Lead"),d=((u=t.reviewedBy)==null?void 0:u.name)||(($=t.response)==null?void 0:$.respondedByName)||t.assignedConsultantName||"Materials Consultant",m=((I=t.reviewedBy)==null?void 0:I.date)||((A=t.response)==null?void 0:A.responseDate)||(t.updatedAt?w(t.updatedAt):w(t.createdAt)),f=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${X(x,r)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">MATERIAL APPROVAL REQUEST (MAR)</div>
          <div class="header-title-project">PROJECT: ${S}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.4 Control of Externally Provided Products & Services</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${b}</span></div>
          <div><strong>Date:</strong> ${w(t.createdAt)}</div>
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
          <td class="grid-value">${h}</td>
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
          ${t.reviewComments||((p=t.response)==null?void 0:p.responseText)||"Submittal is in accordance with project specifications."}
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
            <div style="font-size: 8px; color: #334155;">Name: <strong>${h}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${w(t.createdAt)}</span>
            </div>
          </td>
          <td style="width: 50%;">
            <div class="sig-role-header"><span>CONSULTANT / MATERIALS ENGINEER</span><span class="sig-required-tag">REQUIRED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${d}</strong></div>
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
      <div>CONFIDENTIAL & PROPRIETARY — ${l}</div>
      <div>MAR Ref: ${b}</div>
    </div>
  `;tt(`${b} - Material Approval Request`,f)}function Me(t,r={},x={}){var I,A,p,a,v,g;const l=x.name||" ",S=r.name||" ",b=t.sampleNumber||t.sampleId||`CUBE-${Math.floor(1e3+Math.random()*9e3)}`,h=t.target28DayStrengthNmm2||t.day28Required||(t.targetStrength?parseFloat(t.targetStrength):0)||30,d=[],m=[{age:1,title:"1-Day Test",resArray:t.day1Results,testSummary:(I=t.tests)==null?void 0:I.day1,req:t.day1Required,defaultTargetRatio:.2,dateField:t.day1Date},{age:3,title:"3-Day Test",resArray:t.day3Results,testSummary:(A=t.tests)==null?void 0:A.day3,req:t.day3Required,defaultTargetRatio:.45,dateField:t.day3Date},{age:7,title:"7-Day Test",resArray:t.day7Results,testSummary:(p=t.tests)==null?void 0:p.day7,req:t.day7Required,defaultTargetRatio:.7,dateField:t.day7Date},{age:14,title:"14-Day Test",resArray:t.day14Results,testSummary:(a=t.tests)==null?void 0:a.day14,req:t.day14Required,defaultTargetRatio:.85,dateField:t.day14Date},{age:28,title:"28-Day Test",resArray:t.day28Results,testSummary:(v=t.tests)==null?void 0:v.day28,req:t.day28Required,defaultTargetRatio:1,dateField:t.day28Date}];for(const o of m){const n=o.req||Math.round(h*o.defaultTargetRatio*10)/10;if(o.resArray&&o.resArray.length>0){const c=o.resArray[0];d.push({age:o.age,title:o.title,testDate:c.testDate||o.dateField||t.castDate,targetStrength:n,averageStrength:c.averageStrength||0,maximumStrength:c.maximumStrength,minimumStrength:c.minimumStrength,standardDeviation:c.standardDeviation,status:c.status||(c.averageStrength>=n?"PASS":"FAIL"),technician:c.technician||t.preparedBy||"Materials Technician",testingStandard:c.testingStandard||"BS EN 12390-3",cubes:c.cubes||[]})}else if(o.testSummary){const c=o.testSummary,R=c.averageStrengthNmm2??c.compressiveStrengthNmm2??0;d.push({age:o.age,title:o.title,testDate:c.actualTestDate||c.testDate||c.scheduledDate||o.dateField||t.castDate,targetStrength:c.requiredStrengthNmm2||c.targetStrengthNmm2||n,averageStrength:R,maximumStrength:R,minimumStrength:R,standardDeviation:0,status:c.compliance||(R>=n?"PASS":"FAIL"),technician:c.testedBy||c.labTechnician||t.preparedBy||"Materials Technician",testingStandard:"BS EN 12390-3",cubes:(c.cubes||c.individualResults||[]).map((C,D)=>({id:D+1,load:C.failureLoadKn||C.crushingLoadKn||c.crushingLoadKn||"—",strength:C.compressiveStrengthNmm2||R,failureMode:C.typeOfFailure||C.failureMode||"Satisfactory",cubeWeight:C.weightKg||""}))})}}const f=d.find(o=>o.age===28),u=f?f.status==="PASS"||f.averageStrength>=f.targetStrength:null,$=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${X(x,r)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">CONCRETE COMPRESSIVE STRENGTH TEST CERTIFICATE</div>
          <div class="header-title-project">PROJECT: ${S}</div>
          <div class="header-title-iso">BS EN 12390-3 / ASTM C39 Compressive Strength Quality Verification</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${b}</span></div>
          ${t.inscribedName?`<div><strong>Inscribed Mark:</strong> <span style="font-weight:700; color:#0f172a;">${t.inscribedName}</span></div>`:""}
          <div><strong>Cast Date:</strong> ${t.castDate||w(t.castDate)}</div>
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
          <td class="grid-value" style="width: 32%;"><strong>${t.concreteGrade}</strong> (Target: ${h} MPa)</td>
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
          <td class="grid-value">Start: ${w(t.curingStartDate||t.castDate)} ${t.removedFromTankDate?`• Out: ${w(t.removedFromTankDate)}`:""}</td>
        </tr>
      </table>
    </div>

    <!-- 3.0 Multi-Cube Crushing Results -->
    <div class="pdf-section">
      <div class="section-banner">3.0 LABORATORY COMPRESSION CRUSHING LOG & STRENGTH STATISTICAL EVALUATION</div>
      ${d.length>0?d.map(o=>{const n=o.status==="PASS"||o.averageStrength>=o.targetStrength;return`
        <div style="margin-bottom: 8px; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden;">
          <div style="background: #f8fafc; padding: 4px 8px; font-weight: 700; font-size: 8px; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0;">
            <span>${o.title.toUpperCase()} (Test Date: ${w(o.testDate)}) — Standard: ${o.testingStandard}</span>
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
              ${o.cubes.length>0?o.cubes.map(c=>`
                <tr>
                  <td style="text-align: center; font-weight: 700; color: #0f172a;">Cube #${c.id}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 700;">${c.load||"—"}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 800; color: ${n?"#15803d":"#b91c1c"};">${c.strength||"—"}</td>
                  <td style="color: #475569; font-size: 7.2px;">${c.failureMode||"Cone Failure (Satisfactory)"}</td>
                  <td style="text-align: right; font-family: monospace; color: #64748b;">${c.cubeWeight||"—"}</td>
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
              <span>Date: ${w(t.preparedByDate||((g=d[0])==null?void 0:g.testDate)||t.castDate)}</span>
            </div>
          </td>
          <td style="width: 33.33%;">
            <div class="sig-role-header"><span>CONSULTANT ENGINEER</span><span class="sig-optional-tag">OPTIONAL</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${t.reviewedBy||t.approvedBy||""}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 10px;">
              <span>Sign: ___________________</span>
              <span>Date: ${w(t.reviewedByDate||t.approvedByDate||t.castDate)}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${l}</div>
      <div>Certificate Ref: ${b}</div>
    </div>
  `;tt(`${b} - Cube Test Certificate`,$)}function ze(t,r={},x={},l){var St,Ct,Rt,It,s,q;const S=(l==null?void 0:l.revisionNumber)||t.revisionNumber||(t==null?void 0:t.revision),b=S&&String(S).trim().length>0?String(S).trim():"Rev 1.0 (Final Submission)",h=x.name||"Collection Developments LTD",d=x.legalName||(x==null?void 0:x.companyName)||"Collection Developments Limited",m=x.logoUrl||x.logo||(x==null?void 0:x.logoBase64)||t.logoBase64||"",f=r.name||t.projectName||"BANKSIDE",u=t.reportNumber||`WQR-2026-${Math.floor(1e3+Math.random()*9e3)}`,$=(l==null?void 0:l.includeNcrs)!==void 0?l.includeNcrs:(l==null?void 0:l.includeNcrsAndComments)!==void 0?l.includeNcrsAndComments:t.includeNcrs!==void 0?t.includeNcrs:t.includeNcrsAndComments!==!1,I=(l==null?void 0:l.includeSiteComments)!==void 0?l.includeSiteComments:(l==null?void 0:l.includeNcrsAndComments)!==void 0?l.includeNcrsAndComments:t.includeSiteComments!==void 0?t.includeSiteComments:t.includeNcrsAndComments!==!1,A=(l==null?void 0:l.includeSiteInstructions)!==void 0?l.includeSiteInstructions:t.includeSiteInstructions!==!1;function p(e){if(!e)return"";if(typeof e=="string"){const i=e.trim();if(/^\d{4}-\d{2}-\d{2}$/.test(i))return i;const y=new Date(i);return isNaN(y.getTime())?i:y.toISOString().split("T")[0]}return typeof e=="number"?new Date(e).toISOString().split("T")[0]:e instanceof Date&&!isNaN(e.getTime())?e.toISOString().split("T")[0]:""}function a(){try{const e=te.getState().currentUser;return(e==null?void 0:e.email)||""}catch{return""}}const v=t.startDate||t.weekStart||"",g=t.endDate||t.weekEnd||"",o=p(v)||"—",n=p(g)||"—",c=n!=="—"?n:p(t.reportDate||t.createdAt)||p(new Date),R=typeof t.preparedBy=="object"&&t.preparedBy?t.preparedBy:{name:typeof t.preparedBy=="string"?t.preparedBy:"",designation:"QA/QC ENGINEER",role:"QA/QC ENGINEER"},C=R.name||((St=te.getState().currentUser)==null?void 0:St.fullName)||((Ct=te.getState().currentUser)==null?void 0:Ct.displayName)||"Authorized QA/QC Engineer",D=R.designation||R.role||"QA/QC ENGINEER",_=R.email||a()||"—";R.signed;const L=R.signatureUrl||"",Y=(t.cubeTests&&t.cubeTests.length>0?t.cubeTests:t.filteredCubeTests)||[],j=t.quantitySummary||[],W=t.mepClearance||[],F=(t.materialDeliveries&&t.materialDeliveries.length>0?t.materialDeliveries:t.filteredMaterialDeliveries)||[],P=(t.ncrRemediationLog&&t.ncrRemediationLog.length>0?t.ncrRemediationLog:t.filteredNcrs)||t.ncr||[],st=(t.siteComments&&t.siteComments.length>0?t.siteComments:t.filteredSiteComments)||t.filteredFindings||[],dt=(t.siteInstructions&&t.siteInstructions.length>0?t.siteInstructions:t.filteredSiteInstructions)||[],rt=t.projectCoverImageUrl||t.coverImageUrl||t.coverImageBase64||r.coverImageUrl||r.imageUrl||(r==null?void 0:r.image)||(t==null?void 0:t.projectImage)||"",et=(t.pictorialUrls||[]).filter(e=>{const i=typeof e=="string"?e:e==null?void 0:e.url;return!!(i&&typeof i=="string"&&i.trim().length>0)}),Ot=t.beamLayoutImg,Dt=t.columnLayoutImg,Pt=t.slabImg,at=t.structuralElements||[],_t=at.filter(e=>(e.elementType||e.type||e.element||"").toLowerCase().includes("column")),Lt=at.filter(e=>(e.elementType||e.type||e.element||"").toLowerCase().includes("beam")),kt=at.filter(e=>(e.elementType||e.type||e.element||"").toLowerCase().includes("slab")),J=(t.selectedLevel||t.selectedLevelName||"—").toUpperCase();let it=0,nt=0;j.length>0?j.forEach(e=>{const i=parseFloat(String(e.calculatedVolume??e.plannedVolume??e.scope??0))||0,y=parseFloat(String(e.achievedVolume??e.actualVolume??0))||0;it+=i,nt+=y}):at.length>0&&at.forEach(e=>{const i=parseFloat(String(e.calculatedVolume||e.volume||0))||0,y=parseFloat(String(e.achievedVolume??e.completedVolume??0))||0;it+=i,nt+=y}),it===0&&t.totalVolumeCalculated&&(it=Number(t.totalVolumeCalculated)||0),nt===0&&t.totalVolumeAchieved&&(nt=Number(t.totalVolumeAchieved)||0);const Mt=it>0?Math.round(nt/it*100):0,bt=(((Rt=t.ncrStats)==null?void 0:Rt.openTotal)??0)+st.filter(e=>{const i=String(e.status||"").toLowerCase();return i.includes("non")||i.includes("open")||i.includes("progress")||i.includes("pending")}).length,zt=t.overallQualityCompliance!==void 0&&t.overallQualityCompliance!==null?Number(t.overallQualityCompliance):((It=t.metrics)==null?void 0:It.inspectionPassRate)!==void 0&&((s=t.metrics)==null?void 0:s.inspectionPassRate)!==null?Number(t.metrics.inspectionPassRate):100,Ut=(l==null?void 0:l.templateId)||t.templateId||"classic-executive",E=ve(Ut),Ft=()=>`
    <div style="display: flex; align-items: center; gap: 6px;">
      ${m?`<img src="${m}" style="max-height: 22px; max-width: 80px; object-fit: contain;" alt="Logo" />`:`
          <div style="display: flex; gap: 2px; align-items: flex-end; height: 16px;">
            <span style="width: 3.5px; height: 9px; background: ${E.accentColor}; border-radius: 1px;"></span>
            <span style="width: 3.5px; height: 16px; background: ${E.accentColor}; border-radius: 1px;"></span>
            <span style="width: 3.5px; height: 12px; background: ${E.accentColor}; border-radius: 1px;"></span>
          </div>
          <span style="font-size: 8.5px; font-weight: 900; color: #0f172a; letter-spacing: 0.8px; text-transform: uppercase;">COLLECTION</span>
        `}
    </div>
  `,G=e=>`
    <div class="pdf-header">
      <div class="pdf-header-top">
        <div style="display: flex; align-items: center; gap: 8px;">
          ${Ft()}
          <div style="font-size: 8.5px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 6px; letter-spacing: 0.2px;">
            <span>${c}</span>
            <span style="color: #cbd5e1;">|</span>
            <span style="color: ${E.accentColor}; font-weight: 800;">QA/QC SURVEILLANCE</span>
            <span style="color: #cbd5e1;">|</span>
            <span style="font-weight: 800; color: #0f172a; text-transform: uppercase;">${e}</span>
          </div>
        </div>
        <div style="font-size: 8.5px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase;">
          <span style="color: #0f172a;">${f.toUpperCase()}</span> &nbsp;|&nbsp; <span style="color: #94a3b8;">CONFIDENTIAL</span>
        </div>
      </div>
      <div class="pdf-header-rule" style="background: ${E.ruleColor}; height: 2px;"></div>
    </div>
  `,H=e=>`
    <div class="pdf-footer" style="border-top: 1px solid ${E.cardBorder};">
      <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">
        Compiled By: <strong style="color: #475569;">${C} (${D})</strong> &nbsp;|&nbsp; ISO 9001:2015 Quality Management System
      </div>
      <div class="pdf-slide-badge" style="background: ${E.badgeBg}; color: ${E.badgeTextColor}; border: 1px solid ${E.badgeBorder}; border-radius: ${E.cardRadius};">
        SLIDE ${String(e).padStart(2,"0")}
      </div>
    </div>
  `,O=[];O.push(`
    <div class="pdf-sheet" style="padding: 0; display: flex; flex-direction: row; height: 210mm; overflow: hidden; position: relative;">
      <!-- Left Hero Column (~46% width) -->
      <div style="width: 46%; padding: 24mm 14mm 16mm 16mm; display: flex; flex-direction: column; justify-content: space-between; background: #ffffff; position: relative; border-right: 3px solid ${E.accentColor};">
        <div>
          <!-- Company Brand Header -->
          <div style="margin-bottom: 22px;">
            <div style="display: flex; align-items: flex-end; gap: 2px; margin-bottom: 4px;">
              ${m?`<img src="${m}" style="max-height: 120px; max-width: 190px; object-fit: contain;" alt="${h}" />`:`
                <div style="display: flex; gap: 3px; align-items: flex-end; height: 26px;">
                  <span style="width: 5px; height: 14px; background: ${E.accentColor}; border-radius: 1px;"></span>
                  <span style="width: 5px; height: 24px; background: ${E.accentColor}; border-radius: 1px;"></span>
                  <span style="width: 5px; height: 18px; background: ${E.accentColor}; border-radius: 1px;"></span>
                </div>
              `}
            </div>
            <div style="font-size: 13px; font-weight: 900; color: #0f172a; letter-spacing: 1.5px; text-transform: uppercase;">
              ${h.toUpperCase()}
            </div>
          </div>

          <!-- Project Title & Divider -->
          <div style="margin-bottom: 18px;">
            <div style="font-size: 34px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; text-transform: uppercase; line-height: 1.05;">
              ${f.toUpperCase()}
            </div>
            <div style="width: 100%; height: 2px; background: ${E.accentColor}; margin-top: 14px;"></div>
          </div>

          <!-- Report Title -->
          <div style="font-size: 19px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.3px; margin-bottom: 12px;">
            ${t.title||"QA/QC WEEKLY REPORT"}
          </div>

          <!-- Surveillance Level Tag -->
          <div style="display: inline-block; background: ${E.accentLight}; color: ${E.accentDark}; font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: ${E.cardRadius}; border: 1px solid ${E.cardBorder}; text-transform: uppercase; margin-bottom: 12px;">
            SURVEILLANCE: ${J}
          </div>
          <div></div>

          <!-- Date Range Pill -->
          <div style="display: inline-block; background: #FFFFFF; border: 1.5px solid ${E.accentColor}; color: ${E.accentDark}; font-size: 10.5px; font-weight: 800; padding: 6px 22px; border-radius: 9999px; letter-spacing: 0.5px; text-transform: uppercase;">
            ${o} &nbsp;TO&nbsp; ${n}
          </div>
        </div>

        <!-- Compiler Card (Bottom Left) -->
        <div style="background: #ffffff; border: 1px solid ${E.cardBorder}; border-left: 4px solid ${E.accentColor}; border-radius: ${E.cardRadius}; padding: 12px 16px; margin-top: auto;">
          <div style="font-size: 7.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
            AUTHORIZED COMPILER &amp; QA/QC OFFICER
          </div>
          <div style="font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 3px;">
            ${C}
          </div>
          <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 1px;">
            ${D}
          </div>
        </div>
      </div>

      <!-- Right Column (~54% width) Full-Bleed Cover Image -->
      <div style="width: 54%; height: 100%; background: #0f172a; overflow: hidden; position: relative;">
        ${rt?`<img src="${rt}" style="width: 100%; height: 100%; object-fit: cover;" alt="${f}" />`:`
          <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
            <div style="text-align: center; color: #ffffff; padding: 30px;">
              <div style="font-size: 36px; font-weight: 900; color: #c28b5e;">${f.toUpperCase()}</div>
              <div style="font-size: 12px; color: #94a3b8; font-weight: 700; margin-top: 8px;">OFFICIAL QA/QC SURVEILLANCE DOSSIER</div>
            </div>
          </div>
        `}
      </div>
    </div>
  `),O.push(`
    <div class="pdf-sheet">
      <div>
        ${G("EXECUTIVE SUMMARY: OPERATIONAL OVERVIEW")}
        
        <!-- 4 Top Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px;">
          <!-- Card 1: Total Scope Volume -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #0f172a; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL SCOPE VOLUME</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${it.toLocaleString(void 0,{maximumFractionDigits:1})} m³</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">Design Volume Target</div>
          </div>

          <!-- Card 2: Achieved Volume -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #0284c7; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">ACHIEVED VOLUME</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${nt.toLocaleString(void 0,{maximumFractionDigits:1})} m³</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">${Mt}% Cumulative</div>
          </div>

          <!-- Card 3: Quality Compliance -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #16a34a; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">QUALITY COMPLIANCE</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${zt}%</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">Field Surveillance Benchmark</div>
          </div>

          <!-- Card 4: Open Findings / NCRs -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #dc2626; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">OPEN FINDINGS / NCRS</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${bt}</div>
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
            ${(q=t.synopsis||t.executiveSummary)!=null&&q.trim()?t.synopsis||t.executiveSummary:'<span style="color: #94a3b8; font-style: italic;">No executive synopsis provided for this reporting period.</span>'}
          </div>
        </div>
      </div>
      ${H(O.length+1)}
    </div>
  `);const ut=e=>{const i=e&&e.trim().length>0?e.trim():"";return i?i.split(/\n\s*\n|\n/).map(T=>T.trim()).filter(Boolean).map(T=>{if(T.includes(":")){const N=T.split(":"),M=N[0].trim(),V=N.slice(1).join(":").trim();return`
            <div style="margin-bottom: 12px;">
              <strong style="color: #0f172a; font-weight: 800;">${M}:</strong> ${V}
            </div>
          `}return`<div style="margin-bottom: 10px;">${T}</div>`}).join(""):""};O.push(`
    <div class="pdf-sheet">
      <div>
        ${G("EXECUTIVE SUMMARY: STRATEGIC INSIGHTS")}
        
        <!-- 3 Columns Grid -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; min-height: 420px;">
          <!-- Column 1: Highlights -->
          <div style="display: flex; flex-direction: column;">
            <div style="background: #16a34a; color: #ffffff; text-align: center; padding: 10px 12px; font-weight: 800; font-size: 10.5px; border-radius: 4px 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
              KEY PROJECT HIGHLIGHTS
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 16px; font-size: 9px; line-height: 1.5; color: #334155; background: #ffffff;">
              ${ut(t.highlights)}
            </div>
          </div>

          <!-- Column 2: Risks & Concerns -->
          <div style="display: flex; flex-direction: column;">
            <div style="background: #d97706; color: #ffffff; text-align: center; padding: 10px 12px; font-weight: 800; font-size: 10.5px; border-radius: 4px 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
              CRITICAL RISKS &amp; OPEN CONCERNS
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 16px; font-size: 9px; line-height: 1.5; color: #334155; background: #ffffff;">
              ${ut(t.concerns)}
            </div>
          </div>

          <!-- Column 3: Look-Ahead Plan -->
          <div style="display: flex; flex-direction: column;">
            <div style="background: #4f46e5; color: #ffffff; text-align: center; padding: 10px 12px; font-weight: 800; font-size: 10.5px; border-radius: 4px 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
              LOOK-AHEAD PLAN &amp; ACTION TARGETS
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 16px; font-size: 9px; line-height: 1.5; color: #334155; background: #ffffff;">
              ${ut(t.nextWeekPlan)}
            </div>
          </div>
        </div>
      </div>
      ${H(O.length+1)}
    </div>
  `);const Et=Y,Bt=Et.length>0?Et.map((e,i)=>{var V,B,Q,K;const y=e.strength7Days||((B=(V=e.day7Results)==null?void 0:V[0])!=null&&B.averageStrength?`${e.day7Results[0].averageStrength} N/mm²`:"—"),T=e.strength28Days||((K=(Q=e.day28Results)==null?void 0:Q[0])!=null&&K.averageStrength?`${e.day28Results[0].averageStrength} N/mm²`:"—"),N=String(e.status7Days||(y!=="—"?"PASS":"pending")).toLowerCase(),M=String(e.status28Days||(T!=="—"?"PASS":"pending")).toLowerCase();return`
              <tr>
                <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(i+1).padStart(2,"0")}</td>
                <td style="font-family: monospace; font-weight: 600;">${p(e.dateCast||e.castDate||e.date)||"—"}</td>
                <td style="font-weight: 800; color: #0f172a; text-transform: uppercase;">${e.elementLevel||e.element||e.inscribedName||"Structural Element"}</td>
                <td style="font-family: monospace; font-weight: 700; text-align: center;">${y}</td>
                <td style="text-align: center; font-weight: 800; color: ${N.includes("pass")?"#16a34a":"#d97706"};">${N.includes("pass")?"PASS":N.toUpperCase()}</td>
                <td style="font-family: monospace; font-weight: 700; text-align: center;">${T}</td>
                <td style="text-align: center; font-weight: 800; color: ${M.includes("pass")?"#16a34a":"#d97706"};">${M.includes("pass")?"PASS":M.toUpperCase()}</td>
              </tr>
            `}).join(""):`
        <tr>
          <td colspan="7" style="text-align: center; color: #64748b; padding: 24px; font-weight: 600;">
            No concrete compressive strength test records logged for this reporting period.
          </td>
        </tr>
      `;O.push(`
    <div class="pdf-sheet">
      <div>
        ${G("CONCRETE COMPRESSIVE STRENGTH TEST MATRIX")}
        
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
            ${Bt}
          </tbody>
        </table>
      </div>
      ${H(O.length+1)}
    </div>
  `);const xt=["#3b82f6","#10b981","#f97316","#8b5cf6","#06b6d4","#ec4899","#f59e0b"],k=[];if(j.length>0)j.forEach((e,i)=>{const y=parseFloat(String(e.calculatedVolume??e.plannedVolume??e.scope??0))||0,T=parseFloat(String(e.achievedVolume??e.actualVolume??0))||0;let N=y>0?Math.round(T/y*100):parseInt(String(e.completion||0));N=Math.min(100,Math.max(0,N)),k.push({name:String(e.element||e.structuralElement||`Element ${i+1}`).toUpperCase().trim(),scope:y,completion:N,color:xt[i%xt.length]})});else if(at.length>0){const e={};at.forEach(i=>{const y=(i.elementType||i.type||i.element||"OTHER").toUpperCase().trim(),T=parseFloat(String(i.calculatedVolume||i.volume||0))||0,N=parseFloat(String(i.achievedVolume??i.completedVolume??0))||0;e[y]||(e[y]={scope:0,achieved:0}),e[y].scope+=T,e[y].achieved+=N}),Object.entries(e).forEach(([i,y],T)=>{const N=y.scope>0?Math.min(100,Math.max(0,Math.round(y.achieved/y.scope*100))):0;k.push({name:i,scope:Math.round(y.scope*100)/100,completion:N,color:xt[T%xt.length]})})}const mt=k.reduce((e,i)=>e+i.scope,0),Gt=k.length>0?Math.round(k.reduce((e,i)=>e+i.completion,0)/k.length):0,Tt=(()=>{if(k.length===0||mt===0)return{svg:`
          <svg width="150" height="150" viewBox="0 0 150 150" style="display: block; margin: 0 auto;">
            <circle cx="75" cy="75" r="62" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3 3" />
            <text x="75" y="78" text-anchor="middle" font-size="8.5" fill="#94a3b8" font-family="-apple-system, sans-serif" font-weight="600">No Volume Data</text>
          </svg>
        `,legend:`
          <div style="margin-top: 10px; font-size: 7.5px; color: #94a3b8; text-align: center; font-style: italic;">
            No quantity distribution recorded
          </div>
        `};const e=150,i=75,y=75,T=62;let N=-Math.PI/2;const M=[];k.forEach(Q=>{const U=(mt>0?Q.scope/mt:1/(k.length||1))*2*Math.PI,ot=N+U,lt=i+T*Math.cos(N),At=y+T*Math.sin(N),Nt=i+T*Math.cos(ot),$t=y+T*Math.sin(ot),wt=U>Math.PI?1:0,z=`M ${i} ${y} L ${lt.toFixed(2)} ${At.toFixed(2)} A ${T} ${T} 0 ${wt} 1 ${Nt.toFixed(2)} ${$t.toFixed(2)} Z`;M.push(`<path d="${z}" fill="${Q.color}" stroke="#ffffff" stroke-width="1.5" />`),N=ot});const V=`
      <svg width="${e}" height="${e}" viewBox="0 0 ${e} ${e}" style="display: block; margin: 0 auto;">
        ${M.join("")}
      </svg>
    `,B=`
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; margin-top: 10px; font-size: 7.5px; font-weight: 800;">
        ${k.map(Q=>`
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="display: inline-block; width: 8px; height: 8px; background: ${Q.color}; border-radius: 1.5px;"></span>
            <span style="color: #334155; text-transform: uppercase;">${Q.name}</span>
          </div>
        `).join("")}
      </div>
    `;return{svg:V,legend:B}})(),Ht=()=>{if(k.length===0)return`
        <div style="margin-top: 10px; background: #fafbfd; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; color: #94a3b8; font-size: 8.5px; font-style: italic;">
          No element quantity comparison metrics logged for this level.
        </div>
      `;const e=720,i=100,y=78,T=Math.max(...k.map(B=>B.scope),10),N=e/(k.length||1),M=Math.min(22,N*.32),V=k.map((B,Q)=>{const K=Q*N+N/2,U=T>0?B.scope/T*58:0,ot=B.scope*B.completion/100,lt=T>0?ot/T*58:0,At=K-M-2,Nt=y-U,$t=K+2,wt=y-lt;return`
          <!-- Scope Bar (Blue) -->
          <rect x="${At.toFixed(1)}" y="${Nt.toFixed(1)}" width="${M.toFixed(1)}" height="${Math.max(U,1).toFixed(1)}" rx="1.5" fill="#3b82f6" />
          <!-- Achieved Bar (Orange) -->
          <rect x="${$t.toFixed(1)}" y="${wt.toFixed(1)}" width="${M.toFixed(1)}" height="${Math.max(lt,1).toFixed(1)}" rx="1.5" fill="#f97316" />
          <!-- X-Axis Label -->
          <text x="${K.toFixed(1)}" y="${(y+14).toFixed(1)}" text-anchor="middle" font-size="8" font-weight="700" fill="#475569" font-family="-apple-system, sans-serif" letter-spacing="0.3">${B.name}</text>
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
          <line x1="20" y1="${y}" x2="${e-20}" y2="${y}" stroke="#cbd5e1" stroke-width="1.2" />
          ${V}
        </svg>
      </div>
    `},Vt=k.length>0?k.map(e=>`
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
      `;O.push(`
    <div class="pdf-sheet">
      <div>
        ${G(`${J} — QUANTITY SUMMARY`)}
        
        <!-- Top Half: Table and Pie Chart -->
        <div style="display: flex; gap: 16px; align-items: stretch; margin-top: 8px;">
          <!-- Left Table (50% width) -->
          <div style="flex: 1.1;">
            <div style="font-size: 10px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 6px; letter-spacing: -0.2px;">
              ${J} FLOOR CONCRETE CHART
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
                ${Vt}
                ${k.length>0?`
                  <tr style="background: #f8fafc; font-weight: 900; border-top: 2px solid #cbd5e1;">
                    <td style="font-size: 8.5px; color: #0f172a; text-transform: uppercase; font-weight: 900;">TOTAL</td>
                    <td style="font-family: monospace; font-size: 9px; color: #0f172a; font-weight: 900;">${mt.toLocaleString(void 0,{maximumFractionDigits:1})}</td>
                    <td style="font-family: monospace; font-size: 9px; color: #0f172a; font-weight: 900;">${Gt}%</td>
                  </tr>
                `:""}
              </tbody>
            </table>
          </div>

          <!-- Right Pie Chart Card (50% width) -->
          <div style="flex: 0.9; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; display: flex; flex-direction: column; justify-content: space-between;">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
              ${Tt.svg}
              ${Tt.legend}
            </div>
            <div style="text-align: center; font-size: 8px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-top: 6px; letter-spacing: 0.5px;">
              ${J} FLOOR CONCRETE CHART
            </div>
          </div>
        </div>

        <!-- Bottom Half: Grouped Vertical Bar Chart -->
        ${Ht()}
      </div>
      ${H(O.length+1)}
    </div>
  `);function yt(e,i,y,T,N,M=!0){if(M&&y.length>0){const B=Math.ceil(y.length/26);let Q=0,K=0;y.forEach(U=>{const ot=parseFloat(String(U.calculatedVolume||U.volume||0))||0,lt=parseFloat(String(U.achievedVolume??U.completedVolume??0))||0;Q+=ot,K+=lt});for(let U=0;U<B;U++){const ot=y.slice(U*26,(U+1)*26),lt=U===0,At=U===B-1,Nt=lt?`${J} — ${i.toUpperCase()} ELEMENTS STATUS`:`${J} — ${e.toUpperCase()} STATUS (CONT'D)`,$t=ot.map(z=>{const Xt=parseFloat(String(z.calculatedVolume||z.volume||0))||0,ae=parseFloat(String(z.achievedVolume??z.completedVolume??0))||0;let vt=Xt>0?Math.round(ae/Xt*100):Number(z.completionPercentage||z.completion||0);vt=Math.min(100,Math.max(0,vt));const ie=(z.status||z.qaStatus||z.inspectionStatus||"PENDING").toString().trim(),Z=ie.toUpperCase().replace(/\s+/g,"_"),re=ie.replace(/_/g," ").toUpperCase();let ct="#f8fafc",pt="#475569",ft="#cbd5e1",gt=vt>0?"#3b82f6":"#cbd5e1";Z.includes("APPROV")||Z==="COMPLETED"||Z==="PASS"?(ct="#ecfdf5",pt="#059669",ft="#a7f3d0",gt="#16a34a"):Z==="POURED"||Z.includes("CAST")?(ct="#ecfeff",pt="#0891b2",ft="#a5f3fc",gt="#06b6d4"):Z.includes("READY")?(ct="#e0e7ff",pt="#4338ca",ft="#c7d2fe",gt="#6366f1"):Z.includes("INSPECT")?(ct="#f5f3ff",pt="#7c3aed",ft="#ddd6fe",gt="#8b5cf6"):Z.includes("PROGRESS")?(ct="#eff6ff",pt="#2563eb",ft="#bfdbfe",gt="#3b82f6"):Z.includes("REJECT")||Z.includes("FAIL")||Z.includes("NCR")?(ct="#fef2f2",pt="#dc2626",ft="#fecaca",gt="#ef4444"):(ct="#f8fafc",pt="#64748b",ft="#e2e8f0",gt=vt>0?"#3b82f6":"#cbd5e1");const le=(z.elementName||z.name||z.element||z.id||"—").toUpperCase(),ce=z.gridLocation||z.grid||z.location||"—";return`
              <tr>
                <td style="font-weight: 800; color: #0f172a;">${le}</td>
                <td style="font-family: monospace; color: #475569;">${ce}</td>
                <td style="font-family: monospace; font-weight: 600;">${Xt.toFixed(2)}</td>
                <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${ae.toFixed(2)}</td>
                <td>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                    <div style="flex: 1; height: 7px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
                      <div style="width: ${vt}%; height: 100%; background: ${gt}; border-radius: 999px;"></div>
                    </div>
                    <span style="font-size: 7px; font-weight: 800; font-family: monospace; min-width: 24px; text-align: right;">${vt}%</span>
                    <span style="background: ${ct}; color: ${pt}; border: 1px solid ${ft}; border-radius: 4px; padding: 1.5px 7px; font-weight: 800; font-size: 7px; text-transform: uppercase; white-space: nowrap; display: inline-block;">${re}</span>
                  </div>
                </td>
              </tr>
            `}).join(""),wt=Q>0?Math.round(K/Q*100):0;O.push(`
          <div class="pdf-sheet">
            <div>
              ${G(Nt)}
              
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
                      <td style="font-family: monospace; font-size: 7.5px;">${Q.toFixed(2)}</td>
                      <td style="font-family: monospace; font-size: 7.5px; color: #0f172a;">${K.toFixed(2)}</td>
                      <td style="font-size: 7.5px; color: #0f172a; font-weight: 900;">
                        ${wt}% COMPLETION
                      </td>
                    </tr>
                  `:""}
                </tbody>
              </table>
            </div>
            ${H(O.length+1)}
          </div>
        `)}}T&&typeof T=="string"&&T.trim().length>0&&O.push(`
        <div class="pdf-sheet">
          <div>
            ${G(N||`${e.toUpperCase()} LAYOUT &amp; INSPECTION`)}
            
            <div style="height: 154mm; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; position: relative; margin-top: 6px;">
              <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 6px; overflow: hidden; background: #ffffff;">
                <img src="${T}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="${N}" />
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
                  ${N||`${e.toUpperCase()} LAYOUT`} &nbsp;|&nbsp; VERIFIED AS-BUILT SURVEILLANCE OVERLAY
                </span>
                <span style="color: #4ade80; font-weight: 800;">&#10003; QC CLEARANCE COMPLETE</span>
              </div>
            </div>
          </div>
          ${H(O.length+1)}
        </div>
      `)}yt("Columns","Column",_t,Dt,"COLUMNS LAYOUT & CASTING INSPECTION"),yt("Beams","Beam",Lt,Ot,"BEAMS LAYOUT & REINFORCEMENT INSPECTION"),yt("Slabs","Slab",kt,Pt,"SLABS LAYOUT & CONCRETING INSPECTION",!1);const Qt=W.length>0?W.map((e,i)=>`
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
      `;O.push(`
    <div class="pdf-sheet">
      <div>
        ${G("MEP QA/QC CLEARANCE STATUS — PRE-CASTING")}
        
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
            ${Qt}
          </tbody>
        </table>
      </div>
      ${H(O.length+1)}
    </div>
  `);const jt=F.length>0?F.map((e,i)=>{const y=String(e.qcStatus||e.status||"APPROVED").toUpperCase(),T=y.includes("REJECT")?"#dc2626":y.includes("NOTED")?"#0284c7":"#16a34a",N=e.unit||"units",M=e.quantityAccepted!==void 0?e.quantityAccepted:e.quantity||0,V=e.quantityRejected??0,B=e.quantityReceived??e.quantity??0;return`
            <tr>
              <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(i+1).padStart(2,"0")}</td>
              <td style="font-family: monospace; font-weight: 600;">${p(e.deliveryDate||e.date)||"—"}</td>
              <td style="font-weight: 800; color: #0f172a;">${e.materialDescription||e.materialName||e.name||"Material"}</td>
              <td>${e.supplier||e.supplierName||"—"}</td>
              <td style="font-family: monospace; font-weight: 700; text-align: right;">${B} <span style="font-size: 7px; color: #64748b; font-weight: normal;">${N}</span></td>
              <td style="font-family: monospace; font-weight: 800; text-align: right; color: #059669;">${M} <span style="font-size: 7px; color: #10b981; font-weight: normal;">${N}</span></td>
              <td style="font-family: monospace; font-weight: 800; text-align: right; color: ${V>0?"#dc2626":"#94a3b8"};">${V} <span style="font-size: 7px; color: ${V>0?"#ef4444":"#cbd5e1"}; font-weight: normal;">${N}</span></td>
              <td style="text-align: center; font-weight: 800; color: ${T}; font-size: 7.5px;">${y}</td>
            </tr>
          `}).join(""):`
        <tr>
          <td colspan="8" style="text-align: center; color: #64748b; padding: 24px;">
            Zero material deliveries recorded during this surveillance period.
          </td>
        </tr>
      `;if(O.push(`
    <div class="pdf-sheet">
      <div>
        ${G("MATERIAL DELIVERY LOG & TRACEABILITY")}
        
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
            ${jt}
          </tbody>
        </table>
      </div>
      ${H(O.length+1)}
    </div>
  `),$){const e=P.length>0?P.map(i=>{const y=String(i.status||"OPEN").toUpperCase(),T=y==="CLOSED"||y==="RECTIFIED"||y==="RESOLVED",N=Array.isArray(i.descriptionItems)?i.descriptionItems.join(", "):i.description||"Field variance logged";return`
              <tr>
                <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${i.refNo||i.ncrNumber||"NCR"}</td>
                <td style="font-weight: 700;">${i.elementLevel||i.location||"Structural Component"}</td>
                <td style="font-size: 7.5px; line-height: 1.4; color: #334155;">${N}</td>
                <td style="font-family: monospace; font-weight: 600;">${p(i.dateIdentified||i.dateFound||i.createdAt)}</td>
                <td style="font-family: monospace; font-weight: 600;">${p(i.targetFixDate||i.signDate||c)}</td>
                <td style="text-align: center; font-weight: 900; color: ${T?"#16a34a":"#dc2626"}; font-size: 7.5px;">${T?"CLOSED":"OPEN"}</td>
              </tr>
            `}).join(""):`
          <tr>
            <td colspan="6" style="text-align: center; color: #166534; padding: 24px; font-weight: 800;">
              &#10003; ZERO ACTIVE NON-CONFORMANCE REPORTS LOGGED
            </td>
          </tr>
        `;O.push(`
      <div class="pdf-sheet">
        <div>
          ${G("APPENDIX: NCR REGISTER")}
          
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
        ${H(O.length+1)}
      </div>
    `)}if(A){const e=dt.length>0?dt.map(i=>{const y=String(i.status||"ISSUED").toUpperCase(),T=y.includes("CLOSE")||y.includes("COMPLET");return`
              <tr>
                <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${i.instructionNumber||i.siNumber||i.id||"SI"}</td>
                <td style="font-weight: 700; font-size: 7.5px; color: #0f172a;">${i.title||i.subject||"Formal Notice of Defect Rectification"}</td>
                <td style="font-size: 7.5px; text-transform: uppercase;">${i.contractorName||i.recipient||"Subcontractor"}</td>
                <td style="font-family: monospace; font-weight: 600;">${p(i.issuedDate||i.date)}</td>
                <td style="font-family: monospace; font-weight: 600;">${p(i.complianceDeadline||i.dueDate||c)}</td>
                <td style="text-align: center; font-weight: 900; color: ${T?"#16a34a":"#d97706"}; font-size: 7.5px;">${T?"CLOSED":"ISSUED"}</td>
              </tr>
            `}).join(""):`
          <tr>
            <td colspan="6" style="text-align: center; color: #64748b; padding: 24px;">
              No contractual site instructions issued during this reporting period.
            </td>
          </tr>
        `;O.push(`
      <div class="pdf-sheet">
        <div>
          ${G("APPENDIX: SITE INSTRUCTION REGISTER")}
          
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
        ${H(O.length+1)}
      </div>
    `)}if(I){const e=st.length>0?st.map((i,y)=>{const T=String(i.status||"Non-Compliant"),N=T.toLowerCase().includes("comp")||T.toLowerCase().includes("passed")||T.toLowerCase().includes("approved"),M=T.toLowerCase().includes("pend"),V=N?"#16a34a":M?"#d97706":"#dc2626";return`
              <tr>
                <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(y+1).padStart(2,"0")}</td>
                <td style="font-family: monospace; font-weight: 600;">${p(i.date||i.createdAt)||"—"}</td>
                <td>${i.level||J}${i.location?` &bull; ${i.location}`:""}</td>
                <td style="font-weight: 700;">${i.element||"—"}</td>
                <td style="font-size: 7.5px; line-height: 1.4; color: #334155; white-space: pre-line;">${(i.comments||i.text||"—").replace(/<br\s*\/?>/gi,`
`)}</td>
                <td>${i.inspector||C}${i.vendorCheck?` / ${i.vendorCheck}`:""}</td>
                <td style="text-align: center; font-weight: 800; color: ${V}; font-size: 7.5px;">${T}</td>
              </tr>
            `}).join(""):`
          <tr>
            <td colspan="7" style="text-align: center; color: #64748b; padding: 24px;">
              Zero outstanding quality observations recorded for this surveillance cycle.
            </td>
          </tr>
        `;O.push(`
      <div class="pdf-sheet">
        <div>
          ${G("APPENDIX: SITE COMMENTS / OBSERVATION LOG")}
          
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
        ${H(O.length+1)}
      </div>
    `)}et.length>0&&et.forEach((e,i)=>{const y=typeof e=="string"?e:e.url,T=typeof e=="object"&&e.caption&&e.caption.trim().length>0?e.caption:`SPECIMEN ${i+1} | AS-BUILT SITE QUALITY RECORD`;O.push(`
        <div class="pdf-sheet">
          <div>
            ${G(`PICTORIAL SURVEILLANCE RECORD (SPECIMEN ${i+1} OF ${et.length})`)}
            
            <div style="height: 154mm; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; position: relative; margin-top: 6px;">
              <!-- Photo Viewport -->
              <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 6px; overflow: hidden; background: #ffffff;">
                <img src="${y}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 2px;" alt="${T}" />
              </div>

              <!-- Dark Caption Ribbon -->
              <div style="background: #0f172a; border-left: 5px solid #ea580c; color: #ffffff; padding: 10px 16px; font-size: 8.5px; font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
                <span style="letter-spacing: 0.3px; text-transform: uppercase;">
                  ${T}
                </span>
                <span style="color: #94a3b8; font-family: monospace; font-size: 7.5px;">
                  SPECIMEN ${i+1} / ${et.length}
                </span>
              </div>
            </div>
          </div>
          ${H(O.length+1)}
        </div>
      `)});const Yt=bt>0?`${bt} Holds Active / Pending Sign-off`:"All Quality Checks Conforming & Approved";t.synopsis||t.executiveSummary,O.push(`
    <div class="pdf-sheet" style="padding: 0; display: flex; flex-direction: row; height: 210mm; overflow: hidden; position: relative;">
      <!-- Left Dark Emerald Panel (~30% width) -->
      <div style="width: 30%; background: #091a18; color: #ffffff; padding: 28mm 12mm 16mm 14mm; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <!-- Company Brand -->
          <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: flex-end; gap: 2px; margin-bottom: 6px; justify-content: center;">
              ${m?`<img src="${m}" style="max-height: 150px; max-width: 200px; object-fit: contain;" alt="${h}" />`:`
                <div style="display: flex; gap: 3px; align-items: flex-end; height: 24px;">
                  <span style="width: 4.5px; height: 12px; background: #c28b5e; border-radius: 1px;"></span>
                  <span style="width: 4.5px; height: 22px; background: #c28b5e; border-radius: 1px;"></span>
                  <span style="width: 4.5px; height: 16px; background: #c28b5e; border-radius: 1px;"></span>
                </div>
              `}
            </div>
            <div style="font-size: 13px; text-align: center; font-weight: 700; color: #FFFFFF; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 5px;">
              ${d.toUpperCase()}
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
              ${f.toUpperCase()} DEVELOPMENT
            </h3>
            <p style="font-size: 7.5px; color: #64748b; margin: 0;">
              Weekly Structural Quality Control, Surveillance &amp; Materials Conformance Audit
            </p>
          </div>

          <!-- Key Metadata Grid (2x2) -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 10px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; font-size: 8px; margin-bottom: 12px;">
            <div>
              <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Reporting Period</p>
              <p style="font-weight: 700; color: #1e293b; margin: 0;">${o} – ${n}</p>
            </div>
            <div>
              <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Structure Level</p>
              <p style="font-weight: 700; color: #1e293b; margin: 0;">${J}</p>
            </div>
            <div>
              <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Inspection Status</p>
              <p style="font-weight: 700; color: ${bt>0?"#dc2626":"#16a34a"}; margin: 0;">${Yt}</p>
            </div>
            <div>
              <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Revision Control</p>
              <p style="font-weight: 700; color: #1e293b; margin: 0;">${b}</p>
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
                  ${C}
                </h4>
                <p style="font-size: 8px; font-weight: 800; color: #047857; text-transform: uppercase; margin: 0;">
                  ${D}
                </p>
              </div>
              
              <!-- Stamp / Verification Badge Indicator -->
              <div style="display: flex; align-items: center; gap: 8px;">
                ${L?`<img src="${L}" style="max-height: 38px; max-width: 100px; object-fit: contain;" alt="Signature" />`:""}
                <div style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgba(5, 150, 105, 0.4); display: flex; align-items: center; justify-content: center; font-size: 7px; font-weight: 900; color: #065f46; text-transform: uppercase; text-align: center; line-height: 1.15; background: #ecfdf5;">
                  VERIFIED<br />QA/QC
                </div>
              </div>
            </div>

            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b;">
              <span>Email: <strong style="color: #334155; font-weight: 700;">${_}</strong></span>
              <span>Issued: <strong style="color: #334155; font-weight: 700;">${p(c)}</strong></span>
            </div>
          </div>

          <!-- Legal Footer -->
          <div style="padding-top: 8px; margin-top: 8px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; font-size: 7px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
            <span>CONFIDENTIAL | PREPARED FOR CLIENT &amp; SUPERVISING CONSULTANT</span>
            <span>PAGE ${O.length+1} OF ${O.length+1}</span>
          </div>
        </div>

      </div>
    </div>
  `);const qt=`
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
      background: ${E.ruleColor};
    }

    .pdf-footer {
      padding-top: 5px;
      border-top: 1px solid ${E.cardBorder};
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pdf-slide-badge {
      background: ${E.badgeBg};
      color: ${E.badgeTextColor};
      font-size: 7.5px;
      font-weight: 800;
      padding: 2.5px 10px;
      border-radius: ${E.cardRadius};
      border: 1px solid ${E.badgeBorder};
      letter-spacing: 0.5px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5px;
      font-family: ${E.fontFamily} !important;
    }

    .data-table th {
      background: ${E.tableHeaderBg} !important;
      color: ${E.tableHeaderTextColor} !important;
      font-weight: 800;
      font-size: 7.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 6px 8px;
      border: 1px solid ${E.tableHeaderBg};
      text-align: left;
    }

    .data-table td {
      padding: 4.5px 8px;
      border: 1px solid #f1f5f9;
      border-bottom: 1px solid ${E.tableBorderColor};
      vertical-align: middle;
    }

    .data-table tr:nth-child(even) td {
      background: ${E.tableZebraBg};
    }

    .badge-approved {
      background: ${E.badgeApprovedBg} !important;
      color: ${E.badgeApprovedColor} !important;
      border: 1px solid ${E.badgeApprovedBorder};
      border-radius: ${E.cardRadius};
      padding: 1.5px 7px;
      font-weight: 800;
      font-size: 7px;
      text-transform: uppercase;
      display: inline-block;
    }

    .badge-rejected {
      background: ${E.badgeRejectedBg} !important;
      color: ${E.badgeRejectedColor} !important;
      border: 1px solid ${E.badgeRejectedBorder};
      border-radius: ${E.cardRadius};
      padding: 1.5px 7px;
      font-weight: 800;
      font-size: 7px;
      text-transform: uppercase;
      display: inline-block;
    }

    .badge-pending {
      background: ${E.badgePendingBg} !important;
      color: ${E.badgePendingColor} !important;
      border: 1px solid ${E.badgePendingBorder};
      border-radius: ${E.cardRadius};
      padding: 1.5px 7px;
      font-weight: 800;
      font-size: 7px;
      text-transform: uppercase;
      display: inline-block;
    }
  `,Wt=O.join(`
`);tt(`${u} - QA/QC Weekly Surveillance Report (Landscape Slide Deck)`,Wt,qt)}function Ue(t,r="All Levels",x={},l={}){const S=l.name||"Apex Civil Engineering",b=x.name||"Site Quality Assessment",h=w(new Date),d=`CQ-REG-${r.toUpperCase().replace(/[^A-Z0-9]/g,"-")}-${Date.now().toString().slice(-6)}`,m=t.length,f=t.filter(n=>n.status==="CURING"||n.status==="PENDING").length,u=t.filter(n=>{var c,R;return n.day7Results&&n.day7Results.length>0||((R=(c=n.tests)==null?void 0:c.day7)==null?void 0:R.averageStrengthNmm2)}),$=u.filter(n=>{var D,_,L,Y;const c=((_=(D=n.day7Results)==null?void 0:D[0])==null?void 0:_.averageStrength)||((Y=(L=n.tests)==null?void 0:L.day7)==null?void 0:Y.averageStrengthNmm2)||0,R=n.target28DayStrengthNmm2||n.day28Required||30,C=n.day7Required||Math.round(R*.7*10)/10;return c>=C}).length,I=u.length>0?Math.round($/u.length*100):100,A=t.filter(n=>{var c,R;return n.day28Results&&n.day28Results.length>0||((R=(c=n.tests)==null?void 0:c.day28)==null?void 0:R.averageStrengthNmm2)}),p=A.filter(n=>{var C,D,_,L;const c=((D=(C=n.day28Results)==null?void 0:C[0])==null?void 0:D.averageStrength)||((L=(_=n.tests)==null?void 0:_.day28)==null?void 0:L.averageStrengthNmm2)||0,R=n.target28DayStrengthNmm2||n.day28Required||30;return c>=R}).length,a=A.length>0?Math.round(p/A.length*100):100,v=t.filter(n=>n.status==="APPROVED"||n.status==="28-DAY DONE").length,g=t.filter(n=>n.status==="NCR_ISSUED"||n.status==="REJECTED"||n.ncrGenerated).length,o=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${X(l,x)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">CONCRETE QUALITY & COMPRESSIVE STRENGTH REGISTER</div>
          <div class="header-title-project">PROJECT: ${b}</div>
          <div class="header-title-iso">BS EN 12390-3 / BS EN 206-1 / ASTM C39 Concrete Conformance Register</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${d}</span></div>
          <div><strong>Scope / Level:</strong> <span style="font-weight:700; color:#0f172a;">${r}</span></div>
          <div><strong>Report Date:</strong> ${h}</div>
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
          <td class="grid-value" style="width: 30%; font-weight:700; color:#0f172a;">${r}</td>
          <td class="grid-label" style="width: 20%;">TOTAL SAMPLES LOGGED:</td>
          <td class="grid-value" style="width: 30%; font-weight:800; font-size:9.5px; font-family:monospace;">${m} Specimens</td>
        </tr>
        <tr>
          <td class="grid-label">28-DAY COMPLIANCE RATE:</td>
          <td class="grid-value">
            <span style="font-weight:800; font-size:10px; color:${a>=95?"#15803d":"#b91c1c"};">${a}%</span>
            <span style="font-size:7.5px; color:#64748b; margin-left:4px;">(${p}/${A.length} tested sets compliant)</span>
          </td>
          <td class="grid-label">7-DAY EARLY STRENGTH:</td>
          <td class="grid-value">
            <span style="font-weight:800; font-size:9.5px; color:#0369a1;">${I}%</span>
            <span style="font-size:7.5px; color:#64748b; margin-left:4px;">(${$}/${u.length} tested sets compliant)</span>
          </td>
        </tr>
        <tr>
          <td class="grid-label">APPROVED CERTIFICATES:</td>
          <td class="grid-value" style="color:#15803d; font-weight:800;">${v} Fully Certified</td>
          <td class="grid-label">ACTIVE NCRS / DEFECTIVE:</td>
          <td class="grid-value" style="color:${g>0?"#b91c1c":"#15803d"}; font-weight:800;">${g} Non-Conforming</td>
        </tr>
        <tr>
          <td class="grid-label">IN CURING TANKS:</td>
          <td class="grid-value" style="color:#0284c7; font-weight:700;">${f} In Curing Water Tanks</td>
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
          ${t.length>0?t.map(n=>{var j,W,F,P,st,dt,rt,et;const c=n.target28DayStrengthNmm2||n.day28Required||30,R=n.day7Required||Math.round(c*.7*10)/10,C=((W=(j=n.day7Results)==null?void 0:j[0])==null?void 0:W.averageStrength)??((P=(F=n.tests)==null?void 0:F.day7)==null?void 0:P.averageStrengthNmm2),D=C!=null?C>=R:null,_=((dt=(st=n.day28Results)==null?void 0:st[0])==null?void 0:dt.averageStrength)??((et=(rt=n.tests)==null?void 0:rt.day28)==null?void 0:et.averageStrengthNmm2),L=_!=null?_>=c:null,Y=n.status==="NCR_ISSUED"||n.status==="REJECTED"||n.ncrGenerated||!!n.ncrNumber;return`
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
                <td style="font-weight: 700; font-family: monospace;">${n.concreteGrade||"C30"} (${c})</td>
                <td>${w(n.castDate)}</td>
                <td style="font-family: monospace;">${n.slumpMm||n.slumpValue||"—"} mm</td>
                <td>
                  ${C!=null?`<div style="font-family: monospace; font-weight: 800; color: ${D?"#15803d":"#b91c1c"};">${C} MPa</div>
                         <div style="font-size: 6.8px; color: ${D?"#15803d":"#b91c1c"}; font-weight: 700;">(${D?"PASS":"FAIL"} - Min ${R})</div>`:'<span style="color: #94a3b8; font-size: 7.5px;">Pending</span>'}
                </td>
                <td>
                  ${_!=null?`<div style="font-family: monospace; font-weight: 800; color: ${L?"#15803d":"#b91c1c"};">${_} MPa</div>
                         <div style="font-size: 6.8px; color: ${L?"#15803d":"#b91c1c"}; font-weight: 700;">(${L?"PASS":"FAIL"} - Min ${c})</div>`:'<span style="color: #94a3b8; font-size: 7.5px;">In Curing</span>'}
                </td>
                <td>
                  ${Y?`<span class="badge-fail">NCR: ${n.ncrNumber||"ISSUED"}</span>`:n.status==="APPROVED"||L?'<span class="badge-pass">APPROVED</span>':`<span class="badge-pending">${n.status||"IN PROGRESS"}</span>`}
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
              <span>Date: ${h}</span>
            </div>
          </td>
          <td style="width: 33.3%;">
            <div class="sig-role-header"><span>QA/QC MANAGER</span><span class="sig-required-tag">APPROVED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>QA/QC Manager</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${h}</span>
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
      <div>Report Ref: ${d} • Filter: ${r}</div>
    </div>
  `;tt(`${d} - Concrete Quality Register (${r})`,o)}function Fe(t,r,x){var I,A,p,a,v,g,o,n;const l=(x==null?void 0:x.name)||t.companyName||"JQMS Civil Infrastructure",S=(r==null?void 0:r.name)||t.projectName||"Civil Engineering Construction Project",b=(r==null?void 0:r.code)||"PRJ-001",h=t.instructionNumber||`SI-${t.id.slice(0,8).toUpperCase()}`,d=w(((I=t.signedBy)==null?void 0:I.signedAt)||t.createdAt),m=w(t.complianceDeadline),f=t.severity==="STOP_WORK"||t.severity==="CRITICAL"?"#dc2626":t.severity==="HIGH"?"#ea580c":"#2563eb",u=t.severity==="STOP_WORK"?"INTERNAL WORK HOLD DIRECTIVE":t.severity==="CRITICAL"?"CRITICAL INTERNAL QUALITY DIRECTIVE":t.severity==="HIGH"?"HIGH PRIORITY RECTIFICATION NOTICE":"STANDARD QUALITY DIRECTIVE",$=`
    <!-- ═══ DOCUMENT HEADER ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${X(x,r)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main" style="color: ${f};">
            INTERNAL SITE INSTRUCTION
          </div>
          <div style="font-size: 8px; font-weight: 800; letter-spacing: 0.8px; color: #475569; text-transform: uppercase; margin-top: 1px;">
            INTERNAL QUALITY CONTROL & REMEDIATION DIRECTIVE
          </div>
          <div class="header-title-project">${S} (${b})</div>
        </td>
        <td style="width: 25%; font-size: 8px; vertical-align: top; background: #fafafa;">
          <div style="margin-bottom: 2px;">Doc Ref: <strong style="font-family: monospace; font-size: 8.5px; color: #0f172a;">${h}</strong></div>
          <div style="margin-bottom: 2px;">Issue Date: <strong>${d}</strong></div>
          <div style="margin-bottom: 2px;">Target Rectification: <strong style="color: #dc2626;">${m}</strong></div>
          <div>Status: <span style="background: #e0f2fe; color: #0369a1; font-weight: 800; padding: 1px 4px; border-radius: 2px; font-size: 7px;">${t.status||"ISSUED"}</span></div>
        </td>
      </tr>
    </table>

    <!-- ═══ INTERNAL SEVERITY BANNER ═══ -->
    <div style="background: ${f}; color: #ffffff; padding: 5px 10px; border-radius: 4px; font-weight: 800; font-size: 9px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; letter-spacing: 0.5px;">
      <span>⚠️ NOTICE CATEGORY: ${u}</span>
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
          <td class="meta-value"><strong>${w(t.ncrDeadline)}</strong></td>
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
          ${t.mandatoryActions&&t.mandatoryActions.length>0?t.mandatoryActions.map((c,R)=>`
                <tr>
                  <td style="text-align: center; font-weight: 800; color: #ea580c;">${R+1}.0</td>
                  <td style="font-weight: 600; color: #0f172a;">${c}</td>
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
                <div>Full Name: <strong>${((A=t.signedBy)==null?void 0:A.name.toUpperCase())||"Authorized Quality Authority"}</strong></div>
                <div>Designation: <strong>${((p=t.signedBy)==null?void 0:p.designation)||((a=t.signedBy)==null?void 0:a.role)||"QA/QC Lead Engineer"}</strong></div>
                <div style="font-size: 7.5px; color: #64748b; font-style: italic; margin-top: 4px;">
                  "${((v=t.signedBy)==null?void 0:v.declaration)||"Issued in accordance with company internal quality control standards."}"
                </div>
              </div>

              <div style="text-align: center; min-width: 170px; padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; background: #ffffff;">
                <div style="font-size: 7px; font-weight: 800; color: #0284c7; text-transform: uppercase; margin-bottom: 2px;">
                  Digital Signature
                </div>
                ${(g=t.signedBy)!=null&&g.signatureUrl?`<img src="${t.signedBy.signatureUrl}" style="max-height: 44px; max-width: 150px; object-fit: contain; margin: 0 auto;" alt="Signature" />`:`<div style="height: 36px; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 10px; font-weight: bold; color: #0284c7;">${((o=t.signedBy)==null?void 0:o.name)||"ELECTRONICALLY SIGNED"}</div>`}
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
      <div>INTERNAL QUALITY DIRECTIVE — ${l}</div>
      <div>Document Ref: ${h} </div>
    </div>
  `;tt(`${h} - Internal Site Instruction`,$)}function Be(t,r={},x={}){var u,$,I,A,p,a,v,g,o,n;const l=x.name||"JQMS ENTERPRISE QUALITY MANAGEMENT",S=r.name||t.projectName||"CONSTRUCTION PROJECT",b=r.code||"PRJ",h=t.mirNumber||"MIR-DRAFT",d=c=>{switch(c){case"ACCEPTED":return'<span style="display:inline-block; padding: 3px 10px; background: #dcfce7; color: #15803d; border: 1.5px solid #86efac; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">ACCEPTED / APPROVED</span>';case"ACCEPTED_AS_NOTED":return'<span style="display:inline-block; padding: 3px 10px; background: #dbeafe; color: #1d4ed8; border: 1.5px solid #93c5fd; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">ACCEPTED AS NOTED</span>';case"REJECTED":return'<span style="display:inline-block; padding: 3px 10px; background: #fee2e2; color: #b91c1c; border: 1.5px solid #fca5a5; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">REJECTED / NON-COMPLIANT</span>';case"HOLD_FOR_TESTING":return'<span style="display:inline-block; padding: 3px 10px; background: #fef3c7; color: #b45309; border: 1.5px solid #fcd34d; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">HOLD FOR LAB TESTING</span>';default:return'<span style="display:inline-block; padding: 3px 10px; background: #f1f5f9; color: #475569; border: 1.5px solid #cbd5e1; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">PENDING INSPECTION</span>'}},m=t.items&&t.items.length>0?t.items.map((c,R)=>`
        <tr>
          <td style="text-align: center; font-weight: bold; width: 30px;">${R+1}</td>
          <td style="font-weight: 600; color: #0f172a;">${c.description||"Material Item"}</td>
          <td style="font-size: 7.5px; color: #475569;">${c.specificationRef||"—"}</td>
          <td style="text-align: right; font-weight: bold;">${c.quantityDelivered}</td>
          <td style="text-align: right;">${c.quantityInspected}</td>
          <td style="text-align: right; color: #15803d; font-weight: bold;">${c.quantityAccepted}</td>
          <td style="text-align: right; color: ${c.quantityRejected>0?"#b91c1c":"#64748b"}; font-weight: bold;">${c.quantityRejected}</td>
          <td style="text-align: center; text-transform: uppercase; font-size: 7.5px;">${c.unit||"units"}</td>
          <td style="font-size: 7.5px; color: #475569;">${c.remarks||"—"}</td>
        </tr>
      `).join(""):'<tr><td colspan="9" style="text-align:center; padding: 12px; color: #64748b;">No individual line items registered. Full delivery inspected as described.</td></tr>',f=`
    <!-- ═══ 1.0 HEADER TABLE ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${X(x,r)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">MATERIAL INSPECTION REPORT (MIR)</div>
          <div class="header-title-project">${S} (${b})</div>
          <div class="header-title-iso">ISO 9001:2015 CLAUSE 8.4 — RECEIVING INSPECTION & VERIFICATION</div>
        </td>
        <td class="header-meta-cell">
          <div class="header-meta-row">
            <span class="header-meta-label">MIR NO:</span>
            <span class="header-meta-val" style="color: #ea580c; font-weight: 900;">${h}</span>
          </div>
          <div class="header-meta-row">
            <span class="header-meta-label">DISCIPLINE:</span>
            <span class="header-meta-val">${t.discipline||"Civil & Structural"}</span>
          </div>
          <div class="header-meta-row">
            <span class="header-meta-label">INSP DATE:</span>
            <span class="header-meta-val">${w(t.inspectionDate)}</span>
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
          <td>${w(t.deliveryDate)}</td>
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
          ${Kt(t.inspectionNotes,"Materials visually checked and verified compliant with delivery waybill and approved submittal specification.")}
        </div>
        ${t.rejectionReasons?`
        <div style="margin-top: 4px;">
          <div style="font-size: 7.5px; font-weight: 800; color: #b91c1c; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Defects, Non-Conformances & Technical Justifications:</div>
          ${Kt(t.rejectionReasons)}
        </div>
        `:""}
        ${t.actionRequired?`
        <div style="margin-top: 4px;">
          <div style="font-size: 7.5px; font-weight: 800; color: #d97706; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Mandatory Action & Quarantine Requirements:</div>
          ${Kt(t.actionRequired)}
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
                ${d(((u=t.qaqcSignOff)==null?void 0:u.verdict)||(($=t.consultantSignOff)==null?void 0:$.verdict)||t.disposition)}
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 2.2fr; gap: 12px; font-size: 8px; line-height: 1.6; color: #1e293b; margin-bottom: 6px;">
              <div style="border-right: 1px dashed #fed7aa; padding-right: 10px;">
                <div>QA/QC Engineer: <strong>${((I=t.qaqcSignOff)==null?void 0:I.name)||((A=t.consultantSignOff)==null?void 0:A.name)||((p=t.inspectedBy)==null?void 0:p.name)||"QA/QC Engineer"}</strong></div>
                <div>Designation: <strong>${((a=t.qaqcSignOff)==null?void 0:a.designation)||"QA/QC Engineer"}</strong></div>
                <div>Date of Endorsement: <strong>${w(((v=t.qaqcSignOff)==null?void 0:v.date)||((g=t.consultantSignOff)==null?void 0:g.date)||t.inspectionDate)}</strong></div>
                <div style="margin-top: 4px; color: #15803d; font-weight: bold; font-size: 7.5px;">
                  ✓ Electronically Authenticated Endorsement
                </div>
              </div>
              <div>
                <div style="font-weight: 800; color: #9a3412; font-size: 7.5px; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Official QA/QC Commentary, Directives & Liability Disclaimers:</div>
                ${Kt(((o=t.qaqcSignOff)==null?void 0:o.comments)||((n=t.consultantSignOff)==null?void 0:n.comments),"Materials inspected at site receiving laydown. Verified compliant with approved submittal & material specifications.")}
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
    ${(()=>{var C,D,_,L,Y,j,W;const c=t.stakeholders&&t.stakeholders.length>0?t.stakeholders:[{role:"Contractor Quality Representative",name:((C=t.contractorSignOff)==null?void 0:C.name)||((D=t.inspectedBy)==null?void 0:D.name)||"Contractor Quality Representative",designation:"Site QA/QC Inspector",required:!0,signed:!!((_=t.contractorSignOff)!=null&&_.signed||(L=t.inspectedBy)!=null&&L.date),signedAt:((Y=t.contractorSignOff)==null?void 0:Y.date)||((j=t.inspectedBy)==null?void 0:j.date)||t.inspectionDate},...(W=t.consultantSignOff)!=null&&W.signed?[{role:"Supervising Consultant / Resident Engineer",name:t.consultantSignOff.name,designation:"Resident Engineer",required:!1,signed:!0,signedAt:t.consultantSignOff.date}]:[]];if(c.length===0)return"";const R=[];for(let F=0;F<c.length;F+=2)R.push(c.slice(F,F+2));return`
      <div class="pdf-section">
        <div class="section-banner">6.0 STATUTORY STAKEHOLDER SIGN-OFF AUTHORIZATIONS</div>
        <table class="signoff-table">
          ${R.map(F=>`
            <tr>
              ${F.map(P=>`
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
                    <div>Date: <strong>${P.signedAt?w(P.signedAt):P.signed?w(t.inspectionDate):"—"}</strong></div>
                  </div>
                  <div style="margin-top: 14px; border-top: 1px dashed #94a3b8; padding-top: 4px; font-size: 7px; color: #64748b; text-align: center;">
                    ${P.signed?`Electronically Authenticated • ${P.name}`:`Signature & Stamp (${P.role})`}
                  </div>
                </td>
              `).join("")}
              ${F.length===1?'<td style="width: 50%; background: #f8fafc; border: 1px solid #cbd5e1;"></td>':""}
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
        ${t.photos.map((c,R)=>`
          <div class="photo-card" style="width: 48%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; text-align: center; background: #f8fafc; page-break-inside: avoid; break-inside: avoid; margin-bottom: 6px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #ea580c; text-align: left; margin-bottom: 4px; display: flex; justify-content: space-between;">
              <span>PHOTO #${R+1} — DELIVERY EVIDENCE</span>
              <span style="color: #64748b; font-size: 7px;">${h}</span>
            </div>
            <div style="height: 160px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
              <img src="${c}" alt="Inspection Evidence #${R+1}" style="max-height: 160px; max-width: 100%; object-fit: contain;" />
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
      <div>Document Ref: ${h}</div>
    </div>
  `;tt(`${h} - Material Inspection Report (${t.title})`,f)}function Ge(t,r={},x={}){var A,p,a,v,g,o,n,c,R,C,D,_,L,Y,j,W,F,P,st,dt,rt,et,Ot,Dt,Pt,at,_t,Lt,kt,J,it,nt,Mt,bt,zt,Ut,E,Ft,G,H,O,ut,Et,Bt,xt,k,mt,Gt,Zt,Tt,Ht,Vt,yt,Qt,jt,Yt,qt,Wt,St,Ct,Rt,It;const l=x.name||"JQMS ENTERPRISE QUALITY MANAGEMENT",S=r.name||t.projectName||"CONSTRUCTION PROJECT",b=r.code||t.projectCode||"PRJ",h=t.logNumber||`DSL-${b}-${((A=t.generalConditions)==null?void 0:A.date)||"TODAY"}`,d=t.generalConditions||{date:new Date().toISOString().slice(0,10),shift:"DAY",weather:"CLEAR",workHoursStart:"07:00",workHoursEnd:"17:00",totalHours:10},m=(t.manpower||[]).reduce((s,q)=>s+(Number(q.headCount)||0),0),f=(t.manpower||[]).reduce((s,q)=>s+(Number(q.totalManHours)||(Number(q.headCount)||0)*(Number(q.hoursWorked)||d.totalHours||8)),0),u=s=>{switch(s){case"SUNNY":return"☀️ Sunny";case"CLEAR":return"🌤️ Clear Sky";case"OVERCAST":return"☁️ Overcast / Cloudy";case"RAIN":return"🌧️ Rainy";case"HEAVY_RAIN":return"⛈️ Heavy Rain / Downpour";case"STORMY":return"🌩️ Stormy / High Winds";case"EXTREME_HEAT":return"🔥 Extreme Heat / High Temp";case"WINDY":return"💨 High Winds / Dust";default:return"🌤️ Normal Site Conditions"}},$=s=>{switch(s){case"APPROVED":return'<span style="padding: 2px 8px; background: #dcfce7; color: #15803d; border: 1px solid #86efac; border-radius: 3px; font-weight: 800; font-size: 8px;">APPROVED</span>';case"SUBMITTED":case"UNDER_REVIEW":return'<span style="padding: 2px 8px; background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; border-radius: 3px; font-weight: 800; font-size: 8px;">UNDER REVIEW</span>';case"REJECTED":return'<span style="padding: 2px 8px; background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; border-radius: 3px; font-weight: 800; font-size: 8px;">REVISION REQUIRED</span>';default:return'<span style="padding: 2px 8px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 3px; font-weight: 800; font-size: 8px;">DRAFT RECORD</span>'}},I=`
    <!-- ═══ HEADER BLOCK ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${X(x,r)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">DAILY SITE LOG & STATUTORY DIARY</div>
          <div class="header-title-project">PROJECT: ${S} (${b})</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.5.1 Operations & Site Quality Records</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${h}</span></div>
          <div><strong>Log Date:</strong> ${d.date}</div>
          <div><strong>Shift:</strong> ${d.shift||"DAY SHIFT"}</div>
          <div><strong>Status:</strong> ${$(t.status)}</div>
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
          <td class="meta-value" style="font-weight: 700;">${u(d.weather)}</td>
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
        <span style="font-size: 7.5px; text-transform: none; color: #cbd5e1;">TOTAL PERSONNEL: <strong>${m}</strong> &bull; MAN-HOURS: <strong>${f.toFixed(1)} hrs</strong></span>
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
          ${t.manpower&&t.manpower.length>0?t.manpower.map((s,q)=>{const e=Number(s.hoursWorked)||d.totalHours||8,i=Number(s.headCount)||0,y=Number(s.totalManHours)||i*e;return`
              <tr>
                <td style="font-weight: 700; color: #0f172a;">${s.tradeName}</td>
                <td style="font-size: 7.5px; color: #64748b;">${s.tradeCategory||"Direct Execution"}</td>
                <td>${s.companyOrSubcontractor||"Direct Labor"}</td>
                <td style="text-align: center; font-weight: 800; color: #0284c7;">${i}</td>
                <td style="text-align: center;">${e}</td>
                <td style="text-align: center; font-weight: 700;">${y.toFixed(1)}</td>
              </tr>
            `}).join(""):`
            <tr>
              <td colspan="6" style="text-align: center; color: #94a3b8; padding: 6px;">No manpower entries logged for this shift.</td>
            </tr>
          `}
          <tr style="background: #f1f5f9; font-weight: 800; border-top: 1.5px solid #cbd5e1;">
            <td colspan="3" style="text-align: right; text-transform: uppercase; font-size: 7.5px; color: #334155;">Cumulative Site Workforce:</td>
            <td style="text-align: center; color: #0284c7; font-size: 8.5px;">${m}</td>
            <td style="text-align: center; color: #64748b; font-size: 7px;">Avg ${d.totalHours||8}h</td>
            <td style="text-align: center; color: #0f172a; font-size: 8.5px;">${f.toFixed(1)}</td>
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
          ${t.equipment.map(s=>`
            <tr>
              <td style="font-weight: 700;">${s.equipmentType}</td>
              <td style="font-family: monospace; font-size: 7px;">${s.plantNumber||"—"}</td>
              <td style="text-align: center; font-weight: 700;">${s.quantity||1}</td>
              <td style="text-align: center;">
                <span style="padding: 1px 6px; border-radius: 2px; font-weight: 700; font-size: 7px; ${s.status==="OPERATIONAL"?"background: #dcfce7; color: #15803d;":s.status==="BREAKDOWN"?"background: #fee2e2; color: #b91c1c;":"background: #fef3c7; color: #b45309;"}">${s.status}</span>
              </td>
              <td style="text-align: center; font-weight: 700;">${s.hoursUsed!=null?`${s.hoursUsed} hrs`:"—"}</td>
              <td style="font-size: 7.5px;">${s.operatorName||s.notes||"Standard Operations"}</td>
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
          ${t.activities&&t.activities.length>0?t.activities.map(s=>`
            <tr>
              <td style="font-weight: 700; color: #0f172a;">
                ${s.levelName||"Site Wide"} ${s.elementName?`&bull; ${s.elementName}`:""}
                ${s.gridlineRef?`<div style="font-size: 7px; color: #64748b; font-weight: normal;">Grid: ${s.gridlineRef}</div>`:""}
              </td>
              <td style="font-size: 7.5px; font-weight: 600; color: #2563eb;">${s.trade}</td>
              <td style="font-size: 8px;">
                <div>${s.description}</div>
                ${s.quantityDone?`<div style="font-size: 7px; color: #475569; margin-top: 1px;">Output: <strong>${s.quantityDone}</strong></div>`:""}
                ${s.delayNotes?`<div style="font-size: 7px; color: #dc2626; margin-top: 1px;">Note: ${s.delayNotes}</div>`:""}
              </td>
              <td style="text-align: center; font-weight: 800; color: #0284c7;">${s.progressPercentage!=null?`${s.progressPercentage}%`:"—"}</td>
              <td style="text-align: center;">
                <span style="padding: 1px 5px; border-radius: 2px; font-size: 7px; font-weight: 700; ${s.status==="COMPLETED"?"background: #dcfce7; color: #15803d;":s.status==="DELAYED"?"background: #fee2e2; color: #b91c1c;":"background: #dbeafe; color: #1d4ed8;"}">${s.status.replace("_"," ")}</span>
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
      ${(p=t.quality)!=null&&p.inspections&&t.quality.inspections.length>0?`
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
          ${t.quality.inspections.map(s=>`
            <tr>
              <td style="font-weight: 700;">${s.inspectionType}</td>
              <td style="font-family: monospace; font-size: 7px;">${s.refNo||"—"}</td>
              <td>${s.levelName||"—"} ${s.elementName?`&bull; ${s.elementName}`:""}</td>
              <td>${s.trade||"Civil/Structural"}</td>
              <td style="text-align: center;">
                <span style="padding: 1px 6px; border-radius: 2px; font-weight: 800; font-size: 7px; ${s.result==="PASSED"?"background: #dcfce7; color: #15803d;":s.result==="PASSED_AS_NOTED"?"background: #dbeafe; color: #1d4ed8;":"background: #fee2e2; color: #b91c1c;"}">${s.result.replace(/_/g," ")}</span>
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
      ${(a=t.quality)!=null&&a.qualityNotes||(v=t.quality)!=null&&v.ncrsRaised&&t.quality.ncrsRaised.length>0?`
      <div style="background: #fafafa; border: 1px solid #cbd5e1; border-top: none; padding: 6px 10px; font-size: 7.5px; color: #334155;">
        ${(g=t.quality)!=null&&g.ncrsRaised&&t.quality.ncrsRaised.length>0?`<div><strong>NCRs Raised / Monitored:</strong> <span style="color: #dc2626; font-weight: 700;">${t.quality.ncrsRaised.join(", ")}</span></div>`:""}
        ${(o=t.quality)!=null&&o.qualityNotes?`<div style="margin-top: 2px;"><strong>QA/QC Notes:</strong> ${t.quality.qualityNotes}</div>`:""}
      </div>
      `:""}
    </div>

    <!-- ═══ 6.0 MATERIALS LOGISTICS & CONCRETE POURS ═══ -->
    ${(n=t.materials)!=null&&n.deliveries&&t.materials.deliveries.length>0||(c=t.materials)!=null&&c.concretePours&&t.materials.concretePours.length>0?`
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
          ${t.materials.concretePours.map(s=>`
            <tr>
              <td style="font-weight: 700;">${s.elementName} ${s.levelName?`(${s.levelName})`:""}</td>
              <td style="text-align: center; font-weight: 800; color: #0284c7;">${s.concreteGrade}</td>
              <td style="font-size: 7px;">${s.supplier||"Batching Plant"} (${s.truckCount||1} trucks)</td>
              <td style="text-align: center; font-weight: 800;">${s.volumePoured} m³</td>
              <td style="text-align: center;">${s.slumpMm?`${s.slumpMm} mm`:"—"}</td>
              <td style="text-align: center; font-family: monospace; font-size: 7px;">${s.cubeSampleNumber||"Standard 6-Cube Set"}</td>
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
          ${t.materials.deliveries.map(s=>`
            <tr>
              <td style="font-weight: 700;">${s.description}</td>
              <td>${s.supplier}</td>
              <td style="font-family: monospace; font-size: 7px;">${s.ticketNumber||"—"}</td>
              <td style="text-align: center; font-weight: 700;">${s.quantity} ${s.unit}</td>
              <td style="text-align: center;">
                <span style="padding: 1px 6px; border-radius: 2px; font-weight: 800; font-size: 7px; ${s.status==="ACCEPTED"||s.status==="APPROVED"?"background: #dcfce7; color: #15803d;":s.status==="APPROVED_AS_NOTED"||s.status==="APPROVED AS NOTED"?"background: #e0f2fe; color: #0369a1;":s.status==="REJECTED"?"background: #fee2e2; color: #b91c1c;":"background: #fef3c7; color: #b45309;"}">${(s.status||"").replace(/_/g," ")}</span>
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
            ${((D=t.hse)==null?void 0:D.toolboxTalkTopic)||"Daily Morning Safety & PPE Briefing"}
          </td>
          <td class="meta-label" style="width: 18%;">TBT ATTENDANCE:</td>
          <td class="meta-value" style="width: 16%; font-weight: 800; color: #0284c7;">
            ${((_=t.hse)==null?void 0:_.toolboxTalkAttendees)!=null?`${t.hse.toolboxTalkAttendees} Workers`:`${m} Workers`}
          </td>
        </tr>
        <tr>
          <td class="meta-label">INCIDENT RECORD:</td>
          <td class="meta-value" style="font-weight: 800; color: ${(L=t.hse)!=null&&L.incidentsReported?"#dc2626":"#15803d"};">
            ${(Y=t.hse)!=null&&Y.incidentsReported?`⚠️ ${t.hse.incidentsReported} INCIDENTS REPORTED (${t.hse.incidentDetails||""})`:"✅ ZERO (0) ACCIDENTS / LOST TIME INJURIES (LTI)"}
          </td>
          <td class="meta-label">HOUSEKEEPING:</td>
          <td class="meta-value" style="font-weight: 700;">
            ${((j=t.hse)==null?void 0:j.housekeepingRating)||"GOOD"}
          </td>
        </tr>
        ${(W=t.hse)!=null&&W.permitsToWork&&t.hse.permitsToWork.length>0?`
        <tr>
          <td class="meta-label">ACTIVE PERMITS (PTW):</td>
          <td class="meta-value" colspan="3">
            ${t.hse.permitsToWork.map(s=>`<strong>${s.permitType}</strong> at ${s.location} (Auth: ${s.approvedBy})`).join(" &bull; ")}
          </td>
        </tr>
        `:""}
      </table>
    </div>

    <!-- ═══ 8.0 DELAYS, OBSTACLES & CONSULTANT OVERSIGHT ═══ -->
    ${t.delays&&t.delays.length>0||(F=t.consultant)!=null&&F.observations?`
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
          ${t.delays.map(s=>`
            <tr>
              <td style="font-weight: 700; color: #dc2626;">${s.category}</td>
              <td>${s.location||"General Site"} ${s.trade?`(${s.trade})`:""}</td>
              <td style="text-align: center; font-weight: 800; color: #dc2626;">${s.impactHours} hrs</td>
              <td style="font-size: 7.5px;">
                <div>${s.description}</div>
                ${s.remedialAction?`<div style="font-size: 7px; color: #15803d; margin-top: 2px;">Action: ${s.remedialAction}</div>`:""}
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
              Name: <strong>${((et=(rt=(dt=t.signOffs)==null?void 0:dt.SITE_ENGINEER)==null?void 0:rt.signedBy)==null?void 0:et.name)||t.createdByName||"Site Engineer"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((Pt=(Dt=(Ot=t.signOffs)==null?void 0:Ot.SITE_ENGINEER)==null?void 0:Dt.signedBy)==null?void 0:Pt.designation)||"Project Field Engineer"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(_t=(at=t.signOffs)==null?void 0:at.SITE_ENGINEER)!=null&&_t.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">DIGITALLY SIGNED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((Lt=t.signOffs.SITE_ENGINEER.signedBy)==null?void 0:Lt.digitalStamp)||"VERIFIED-EXECUTION"}</div>
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
              Name: <strong>${((it=(J=(kt=t.signOffs)==null?void 0:kt.QAQC_ENGINEER)==null?void 0:J.signedBy)==null?void 0:it.name)||"Pending QA/QC Certification"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((bt=(Mt=(nt=t.signOffs)==null?void 0:nt.QAQC_ENGINEER)==null?void 0:Mt.signedBy)==null?void 0:bt.designation)||"QA/QC Lead Engineer"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(Ut=(zt=t.signOffs)==null?void 0:zt.QAQC_ENGINEER)!=null&&Ut.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">ISO 9001 CERTIFIED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((E=t.signOffs.QAQC_ENGINEER.signedBy)==null?void 0:E.digitalStamp)||"QAQC-CERT-PASSED"}</div>
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
              Name: <strong>${((H=(G=(Ft=t.signOffs)==null?void 0:Ft.SAFETY_OFFICER)==null?void 0:G.signedBy)==null?void 0:H.name)||"Pending HSE Clearance"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((Et=(ut=(O=t.signOffs)==null?void 0:O.SAFETY_OFFICER)==null?void 0:ut.signedBy)==null?void 0:Et.designation)||"Site Safety Manager"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(xt=(Bt=t.signOffs)==null?void 0:Bt.SAFETY_OFFICER)!=null&&xt.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">SAFETY CLEARED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((k=t.signOffs.SAFETY_OFFICER.signedBy)==null?void 0:k.digitalStamp)||"HSE-CLEARED"}</div>
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
              Name: <strong>${((Zt=(Gt=(mt=t.signOffs)==null?void 0:mt.PROJECT_MANAGER)==null?void 0:Gt.signedBy)==null?void 0:Zt.name)||((Vt=(Ht=(Tt=t.signOffs)==null?void 0:Tt.CONSULTANT)==null?void 0:Ht.signedBy)==null?void 0:Vt.name)||"Pending Final Endorsement"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((jt=(Qt=(yt=t.signOffs)==null?void 0:yt.PROJECT_MANAGER)==null?void 0:Qt.signedBy)==null?void 0:jt.designation)||"Project Manager / Consultant"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(qt=(Yt=t.signOffs)==null?void 0:Yt.PROJECT_MANAGER)!=null&&qt.signed||(St=(Wt=t.signOffs)==null?void 0:Wt.CONSULTANT)!=null&&St.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">APPROVED & ENDORSED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((It=(Rt=(Ct=t.signOffs)==null?void 0:Ct.PROJECT_MANAGER)==null?void 0:Rt.signedBy)==null?void 0:It.digitalStamp)||"PM-AUTHORIZED"}</div>
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
        ${t.photos.map((s,q)=>`
          <div style="width: 48%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; text-align: center; background: #f8fafc; page-break-inside: avoid; margin-bottom: 6px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #0284c7; text-align: left; margin-bottom: 3px; display: flex; justify-content: space-between;">
              <span>PHOTO #${q+1} ${s.tradeTag?`&bull; ${s.tradeTag}`:""}</span>
              <span style="color: #64748b; font-size: 7px;">${s.location||"Site"}</span>
            </div>
            <div style="height: 150px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
              <img src="${s.url}" alt="Site Evidence #${q+1}" style="max-height: 150px; max-width: 100%; object-fit: contain;" />
            </div>
            <div style="font-size: 7px; color: #475569; text-align: left;">
              ${s.caption||"Daily site work progress photo"}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
    `:""}

    <!-- ═══ DOCUMENT FOOTER ═══ -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & STATUTORY QUALITY RECORD — ISO 9001:2015 CLAUSE 8.5.1 — ${l}</div>
      <div>Document Ref: ${h} &bull; Date: ${d.date}</div>
    </div>
  `;tt(`${h} - Daily Site Log (${d.date})`,I)}export{we as S,ee as W,Fe as a,Le as b,ke as c,Be as d,Pe as e,Oe as f,_e as g,De as h,Me as i,Ue as j,ze as k,Ge as l,tt as o};
