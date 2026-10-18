import{h as re}from"./html2pdf-CpttaISV.js";import{c as de}from"./permitChecklist-BHE5VmmF.js";import"./vendor-pdf-CqL8L5vX.js";import{b as se,r as ot,u as ae}from"./index-CSONSIXW.js";import{j as yt}from"./vendor-three-h7LxBsfh.js";import{s as le,b2 as ce,ag as pe,d as ge,bo as fe,af as he,O as xe}from"./vendor-icons-CHLyMjpm.js";import"./jspdf.plugin.autotable-Cg0p10kG.js";function oe(t){if(!t||!t.trim())return[];const c=t.trim(),m=new RegExp("(?:^|\\n+|(?<=[.!?]\\s+)|(?<=\\b))((?:Dimensional\\s+Non-Conformance|Dimensional\\s+Check|Dimensional\\s+Defect|Non-Conformance|Defect\\s+Notice|Material\\s+Defect|Defects?|Discrepancy|Discrepancies|Operational\\s+Impact|Structural\\s+Impact|Engineering\\s+Impact|Risk\\s+Assessment|Safety\\s+Impact|Technical\\s+Impact|Management\\s+Directive|Executive\\s+Directive|Management\\s+Override|Management\\s+Instruction|Director'?s?\\s+Override|Director'?s?\\s+Directive|Executive\\s+Instruction|Site\\s+Instruction|Liability\\s+Disclaimer|Disclaimer|Warranty\\s+Notice|Indemnity\\s+Clause|Indemnity|Legal\\s+Notice|Corrective\\s+Action|Mandatory\\s+Action|Action\\s+Required|Remedial\\s+Action|Resolution|Mitigation|Technical\\s+Evaluation|Technical\\s+Justification|Specification\\s+Reference|QA\\/QC\\s+Observation|Inspector\\s+Notes?|Notes?|Special\\s+Instructions?|Caveats?|Conditions?|Observations?|Root\\s+Cause|Justification|Disposition\\s+Notice|Testing\\s+Conditions?))(?:\\s*:\\s*|\\s*—\\s*|\\s*-\\s*)","gi"),p=Array.from(c.matchAll(m));if(p.length>=1){const b=[],x=p[0].index??0;if(x>0){const d=c.substring(0,x).trim();d&&b.push({category:"standard",header:"",content:d})}for(let d=0;d<p.length;d++){const u=p[d],f=u.index??0,y=u[0],P=u[1].trim(),w=p[d+1],O=w?w.index??c.length:c.length,g=c.substring(f+y.length,O).trim(),a=P.toLowerCase();let v="standard";a.includes("non-conformance")||a.includes("defect")||a.includes("discrepanc")?v="defect":a.includes("impact")||a.includes("risk")||a.includes("safety")?v="impact":a.includes("directive")||a.includes("override")||a.includes("instruction")?v="directive":a.includes("disclaimer")||a.includes("liability")||a.includes("indemnity")||a.includes("warranty")||a.includes("legal")?v="disclaimer":a.includes("action")||a.includes("remedial")||a.includes("corrective")||a.includes("resolution")||a.includes("mitigation")?v="action":(a.includes("note")||a.includes("observation")||a.includes("condition")||a.includes("caveat")||a.includes("evaluation")||a.includes("justification")||a.includes("root cause"))&&(v="note"),b.push({category:v,header:P,content:g})}return b}const S=c.split(/\n\s*\n|\r\n\s*\r\n|\n/).map(b=>b.trim()).filter(Boolean);return S.length===0?[{category:"standard",header:"",content:c}]:S.map(b=>{const x=b.match(/^([A-Za-z0-9\s/&'_-]{3,45}):\s+(.+)$/s);if(x){const d=x[1].trim(),u=x[2].trim(),f=d.toLowerCase();let y="note";return f.includes("defect")||f.includes("non-conformance")||f.includes("fail")||f.includes("error")||f.includes("discrepanc")?y="defect":f.includes("impact")||f.includes("risk")||f.includes("safety")?y="impact":f.includes("directive")||f.includes("override")||f.includes("instruction")?y="directive":f.includes("disclaimer")||f.includes("liability")||f.includes("indemnity")?y="disclaimer":(f.includes("action")||f.includes("required")||f.includes("remed"))&&(y="action"),{category:y,header:d,content:u}}return{category:"standard",header:"",content:b}})}function Jt(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function Xt(t,c="No inspection observations or notes recorded."){const m=oe(t);return m.length===0?`<div style="font-size: 8px; color: #64748b; font-style: italic; line-height: 1.4;">${Jt(c)}</div>`:m.length===1&&!m[0].header?`<div style="font-size: 8px; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">${Jt(m[0].content)}</div>`:`
    <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
      ${m.map(p=>{let S="#f8fafc",b="#cbd5e1",x="3.5px solid #64748b",d="#e2e8f0",u="#334155",f="#cbd5e1";switch(p.category){case"defect":S="#fff5f5",b="#fecaca",x="3.5px solid #dc2626",d="#fee2e2",u="#991b1b",f="#fca5a5";break;case"impact":S="#fffbeb",b="#fef08a",x="3.5px solid #d97706",d="#fef3c7",u="#92400e",f="#fcd34d";break;case"directive":S="#faf5ff",b="#e9d5ff",x="3.5px solid #7c3aed",d="#f3e8ff",u="#581c87",f="#d8b4fe";break;case"disclaimer":S="#f8fafc",b="#cbd5e1",x="3.5px solid #334155",d="#e2e8f0",u="#0f172a",f="#94a3b8";break;case"action":S="#f0fdf4",b="#bbf7d0",x="3.5px solid #16a34a",d="#dcfce7",u="#166534",f="#86efac";break;case"note":S="#f0f9ff",b="#bae6fd",x="3.5px solid #0284c7",d="#e0f2fe",u="#0369a1",f="#7dd3fc";break;default:S="#ffffff",b="#e2e8f0",x="3px solid #94a3b8",d="#f1f5f9",u="#475569",f="#cbd5e1";break}return`
            <div style="background: ${S}; border: 1px solid ${b}; border-left: ${x}; border-radius: 4px; padding: 6px 8px; box-sizing: border-box; page-break-inside: avoid; break-inside: avoid;">
              ${p.header?`
                <div style="margin-bottom: 3.5px; display: flex; align-items: center; gap: 6px;">
                  <span style="display: inline-block; padding: 1.5px 6px; background: ${d}; color: ${u}; border: 1px solid ${f}; border-radius: 3px; font-weight: 800; font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.4px;">
                    ${Jt(p.header)}
                  </span>
                </div>
              `:""}
              <div style="font-size: 8px; color: #1e293b; line-height: 1.5; white-space: pre-wrap; font-weight: ${p.category==="defect"||p.category==="directive"?"600":"400"};">
                ${Jt(p.content)}
              </div>
            </div>
          `}).join("")}
    </div>
  `}const Ae=({text:t,fallback:c="No observations or details recorded.",className:m="",defaultCategory:p})=>{const S=oe(t);return S.length===0?yt.jsx("div",{className:`p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 italic text-xs ${m}`,children:c}):(S.length===1&&!S[0].header&&p&&(S[0].category=p),yt.jsx("div",{className:`space-y-2.5 ${m}`,children:S.map((b,x)=>{let d="bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 border-l-4 border-l-slate-500",u="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",f=le;switch(b.category){case"defect":d="bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200 border-l-4 border-l-red-600",u="bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 border-red-300 dark:border-red-800",f=xe;break;case"impact":d="bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 border-l-4 border-l-amber-500",u="bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800",f=he;break;case"directive":d="bg-purple-50/80 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/60 text-purple-900 dark:text-purple-200 border-l-4 border-l-purple-600",u="bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-800",f=fe;break;case"disclaimer":d="bg-slate-100/90 dark:bg-slate-900/90 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 border-l-4 border-l-slate-700 dark:border-l-slate-400",u="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-400 dark:border-slate-600",f=ge;break;case"action":d="bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-l-4 border-l-emerald-600",u="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800",f=pe;break;case"note":d="bg-sky-50/80 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/60 text-sky-900 dark:text-sky-200 border-l-4 border-l-sky-500",u="bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-800",f=ce;break}return yt.jsxs("div",{className:`p-3.5 rounded-xl border shadow-sm transition ${d}`,children:[b.header&&yt.jsx("div",{className:"flex items-center gap-2 mb-1.5",children:yt.jsxs("span",{className:`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border font-mono ${u}`,children:[yt.jsx(f,{className:"w-3 h-3 shrink-0"}),yt.jsx("span",{children:b.header})]})}),yt.jsx("p",{className:"text-xs leading-relaxed whitespace-pre-wrap font-medium",children:b.content})]},x)})}))},ie={"classic-executive":{id:"classic-executive",name:"Corporate Executive",tagline:"Signature Prestige & Gold Dossier",description:"Classic corporate look with bronze/warm gold accents, deep navy typography, and dual-tone hero cover.",accentColor:"#c28b5e",accentDark:"#9a6538",accentLight:"#fbf6f0",primaryHeaderBg:"#0f172a",headerTextColor:"#ffffff",cardBg:"#ffffff",cardBorder:"#e2e8f0",cardRadius:"6px",badgeBg:"#0f172a",badgeTextColor:"#ffffff",badgeBorder:"#0f172a",ruleColor:"#c28b5e",coverStyle:"split-bronze",fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",headingFont:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",tableHeaderBg:"#0f172a",tableHeaderTextColor:"#ffffff",tableBorderColor:"#e2e8f0",tableZebraBg:"#f8fafc",badgeApprovedBg:"#ecfdf5",badgeApprovedColor:"#059669",badgeApprovedBorder:"#a7f3d0",badgeRejectedBg:"#fef2f2",badgeRejectedColor:"#dc2626",badgeRejectedBorder:"#fecaca",badgePendingBg:"#f8fafc",badgePendingColor:"#64748b",badgePendingBorder:"#e2e8f0",previewThumbnailColor:"#c28b5e",previewBorderColor:"#d49a5b",cssVariables:{"--report-accent":"#c28b5e","--report-accent-dark":"#9a6538","--report-accent-light":"#fbf6f0","--report-header-bg":"#0f172a","--report-header-text":"#ffffff","--report-border":"#e2e8f0","--report-rule":"#c28b5e"}},"engineering-blueprint":{id:"engineering-blueprint",name:"Modern Blueprint",tagline:"Technical CAD & Engineering Azure",description:"A precision architectural aesthetic featuring technical cyan rules, dark blueprint header accents, and structural grid borders.",accentColor:"#0284c7",accentDark:"#0369a1",accentLight:"#f0f9ff",primaryHeaderBg:"#0c4a6e",headerTextColor:"#ffffff",cardBg:"#ffffff",cardBorder:"#bae6fd",cardRadius:"3px",badgeBg:"#0369a1",badgeTextColor:"#ffffff",badgeBorder:"#0284c7",ruleColor:"#0284c7",coverStyle:"blueprint-cad",fontFamily:"'Segoe UI', Roboto, -apple-system, sans-serif",headingFont:"'Segoe UI', Roboto, sans-serif",tableHeaderBg:"#0c4a6e",tableHeaderTextColor:"#ffffff",tableBorderColor:"#bae6fd",tableZebraBg:"#f0f9ff",badgeApprovedBg:"#ecfeff",badgeApprovedColor:"#0891b2",badgeApprovedBorder:"#a5f3fc",badgeRejectedBg:"#fff1f2",badgeRejectedColor:"#e11d48",badgeRejectedBorder:"#fecdd3",badgePendingBg:"#f8fafc",badgePendingColor:"#475569",badgePendingBorder:"#cbd5e1",previewThumbnailColor:"#0284c7",previewBorderColor:"#38bdf8",cssVariables:{"--report-accent":"#0284c7","--report-accent-dark":"#0369a1","--report-accent-light":"#f0f9ff","--report-header-bg":"#0c4a6e","--report-header-text":"#ffffff","--report-border":"#bae6fd","--report-rule":"#0284c7"}},"minimal-editorial":{id:"minimal-editorial",name:"Minimalist Editorial",tagline:"Swiss Clean Monochrome & Typography",description:"High-end Swiss editorial layout with charcoal accents, subtle hairline rules, generous white-space, and refined elegance.",accentColor:"#334155",accentDark:"#1e293b",accentLight:"#f8fafc",primaryHeaderBg:"#1e293b",headerTextColor:"#ffffff",cardBg:"#ffffff",cardBorder:"#cbd5e1",cardRadius:"0px",badgeBg:"#1e293b",badgeTextColor:"#ffffff",badgeBorder:"#1e293b",ruleColor:"#334155",coverStyle:"minimalist-clean",fontFamily:"system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",headingFont:"system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",tableHeaderBg:"#1e293b",tableHeaderTextColor:"#ffffff",tableBorderColor:"#e2e8f0",tableZebraBg:"#f8fafc",badgeApprovedBg:"#f1f5f9",badgeApprovedColor:"#0f172a",badgeApprovedBorder:"#94a3b8",badgeRejectedBg:"#fef2f2",badgeRejectedColor:"#b91c1c",badgeRejectedBorder:"#fca5a5",badgePendingBg:"#f8fafc",badgePendingColor:"#64748b",badgePendingBorder:"#e2e8f0",previewThumbnailColor:"#334155",previewBorderColor:"#64748b",cssVariables:{"--report-accent":"#334155","--report-accent-dark":"#1e293b","--report-accent-light":"#f8fafc","--report-header-bg":"#1e293b","--report-header-text":"#ffffff","--report-border":"#cbd5e1","--report-rule":"#334155"}},"industrial-safety":{id:"industrial-safety",name:"Industrial High-Vis",tagline:"Site Safety Amber & Charcoal Contrast",description:"Construction-grade visual format with high-contrast safety amber borders, bold uppercase typography, and prominent QA/QC status ribbons.",accentColor:"#d97706",accentDark:"#b45309",accentLight:"#fffbeb",primaryHeaderBg:"#18181b",headerTextColor:"#ffffff",cardBg:"#ffffff",cardBorder:"#fde68a",cardRadius:"8px",badgeBg:"#d97706",badgeTextColor:"#ffffff",badgeBorder:"#d97706",ruleColor:"#d97706",coverStyle:"industrial-bold",fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",headingFont:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",tableHeaderBg:"#18181b",tableHeaderTextColor:"#fde047",tableBorderColor:"#fde68a",tableZebraBg:"#fffbeb",badgeApprovedBg:"#ecfdf5",badgeApprovedColor:"#047857",badgeApprovedBorder:"#6ee7b7",badgeRejectedBg:"#fef2f2",badgeRejectedColor:"#b91c1c",badgeRejectedBorder:"#f87171",badgePendingBg:"#fffbeb",badgePendingColor:"#92400e",badgePendingBorder:"#fde68a",previewThumbnailColor:"#d97706",previewBorderColor:"#f59e0b",cssVariables:{"--report-accent":"#d97706","--report-accent-dark":"#b45309","--report-accent-light":"#fffbeb","--report-header-bg":"#18181b","--report-header-text":"#ffffff","--report-border":"#fde68a","--report-rule":"#d97706"}}},be="classic-executive";function me(t){return t in ie?ie[t]:ie[be]}const ue=`
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
`;function rt(t,c,m=""){const p=window.open("","_blank");if(!p){alert("Please allow popups to generate and print the quality document.");return}const S=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t}</title>
  <style>
    ${ue}
    ${m}
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
</html>`;p.document.open(),p.document.write(S),p.document.close()}const _=t=>{if(!t||t==="—")return"—";const c=t instanceof Date?t:new Date(t);return isNaN(c.getTime())?String(t):c.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})};function Ne(t,c={},m={}){var O;const p=m.name,S=c.name,b=t.ptpNumber||`PTP-${Math.floor(1e3+Math.random()*9e3)}`,x=((O=t.checklistItems)!=null&&O.length?t.checklistItems:de()).map((g,a)=>{var v;return{cat:g.category||"General",param:g.label,status:g.status||(a===0&&((v=t.checklist)!=null&&v.rebarInspectionApproved),"PASS")}});(t.stakeholders||[]).filter(g=>g.required);const d=t.status==="REJECTED",f=(()=>{if(d)return[{role:"QA/QC Engineer",name:t.issuedByName,required:!0}];if(t.stakeholders&&t.stakeholders.length>0)return t.stakeholders;const g=t.requiredSignoffs,a=[{role:"QA/QC Engineer",name:t.issuedByName,required:!0}];return(!g||g.siteManager!==!1)&&a.push({role:"Site / Construction Manager",name:"",required:!0}),(!g||g.structuralConsultant!==!1)&&a.push({role:"Structural Consultant / Engineer",name:"",required:!0}),g!=null&&g.mechanicalEngineer&&a.push({role:"Mechanical Engineer",name:"",required:!1}),g!=null&&g.electricalEngineer&&a.push({role:"Electrical Engineer",name:"",required:!1}),a})(),y=t,P=`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${y.permitNumber} - Permit To Pour (PTP)</title>
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
            ${ot(m,c)}
          </td>
          <td style="width: 55%;">
            <div class="header-title">Official Permit To Pour (PTP) Authorization</div>
            <div class="header-sub">PROJECT: ${S}</div>
          </td>
          <td style="width: 25%;" class="meta-box">
            <strong>PTP Ref:</strong> <span style="color:#ea580c; font-weight:700;">${y.permitNumber}</span><br/>
            <strong>Scheduled Pour:</strong> ${_(y.pourDate)} (${y.pourTime})<br/>
            <strong>Status:</strong> <span class="${d?"status-rejected":"status-issued"}">${y.status||"ISSUED"}</span>
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
            <td class="val" style="width: 32%;">${y.building||"Main Structure"}</td>
            <td class="lbl" style="width: 18%;">Level / Floor:</td>
            <td class="val" style="width: 32%;">${y.floor||"—"}</td>
          </tr>
          <tr>
            <td class="lbl">Structural Element:</td>
            <td class="val"><strong>${y.elementName} ${y.elementId?`: ${y.elementId}`:""}</strong></td>
            <td class="lbl">Grid Axis / Zone:</td>
            <td class="val">${y.elementRef||y.zone||"—"}</td>
          </tr>
        </table>
      </div>

      <div class="pdf-section">
        <div class="section-title">2.0 Concrete Mix Specifications & Batching Logistics</div>
        <table class="section-table">
          <tr>
            <td class="lbl" style="width: 18%;">Specified Grade:</td>
            <td class="val" style="width: 32%;"><strong>${y.concreteGrade}</strong></td>
            <td class="lbl" style="width: 18%;">Est. Volume:</td>
            <td class="val" style="width: 32%;"><strong>${y.estimatedVolume} m³</strong></td>
          </tr>
          <tr>
            <td class="lbl">Batching Plant:</td>
            <td class="val">${y.supplier||"Approved Ready-Mix Supplier"}</td>
            <td class="lbl">Inspected By:</td>
            <td class="val">${y.issuedByName} (QA/QC Engineer)</td>
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
            ${x.map((g,a)=>`
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
          ${f.reduce((g,a,v)=>{if(v%2===0){const h=f[v+1],n=w(a),s=h?w(h):'<td style="width: 50%; height: 75px; background: #fafafa; border: 1px dashed #cbd5e1;"></td>';g+=`<tr>${n}${s}</tr>`}return g},"")}
        </table>
      </div>

      <div class="footer-fallback">
        <span>CONFIDENTIAL — ${p}</span>
        <span>PTP Ref: ${y.permitNumber}</span>
      </div>

      <script>
        window.onload = () => {
          window.print();
        };
      <\/script>
    </body>
    </html>
  `;function w(g){const a=g.required?"#15803d":"#64748b",v=g.required?"REQUIRED":"OPTIONAL";return`
      <td style="width: 50%; height: 75px; vertical-align: top; padding: 6px 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span style="font-weight: 700; font-size: 8px; text-transform: uppercase; color: #ea580c;">${g.designation?`${g.designation} <span style="font-size: 7px; color: #64748b; font-weight: normal;">(${g.role})</span>`:g.role}</span>
          <span style="font-size: 6px; font-weight: 700; background: ${a}15; color: ${a}; padding: 1px 3px; border-radius: 2px;">${v}</span>
        </div>
        <div style="font-size: 8px; margin-bottom: 8px;">Name: <strong>${g.name||"__________________________________________________"}</strong></div>
        <div style="font-size: 8px; display: flex; justify-content: space-between;">
          <span>Sign: ________________________</span>
          <span>Date: ____ / ____ / 20__</span>
        </div>
      </td>
    `}rt(`${b} - Permit to Pour`,P)}function $e(t,c={},m={}){var g;const p=m.name,S=c.companyName,b=t.ptpNumber||`PTP-${Math.floor(1e3+Math.random()*9e3)}`,x=((g=t.checklistItems)!=null&&g.length?t.checklistItems:de()).map((a,v)=>{var h;return{cat:a.category||"General",param:a.label,status:a.status||(v===0&&((h=t.checklist)!=null&&h.rebarInspectionApproved),"PASS")}}),d=t.status==="REJECTED",f=(()=>{if(d)return[{role:"QA/QC Engineer",name:t.issuedByName||"J. Oladejo",required:!0}];if(t.stakeholders&&t.stakeholders.length>0)return t.stakeholders.filter(h=>h.required);const a=t.requiredSignoffs,v=[{role:"QA/QC Engineer",name:t.issuedByName||"",required:!0}];return(!a||a.siteManager!==!1)&&v.push({role:"Site / Construction Manager",name:"",required:!0}),(!a||a.structuralConsultant!==!1)&&v.push({role:"Structural Consultant / Engineer",name:"",required:!0}),a!=null&&a.mechanicalEngineer&&v.push({role:"Mechanical Engineer",name:"",required:!0}),a!=null&&a.electricalEngineer&&v.push({role:"Electrical Engineer",name:"",required:!0}),v})(),y=`
    <div id="pdf-document" style="padding: 20px; font-family: Arial, sans-serif; color: #0f172a; background: #fff;">
      <!-- Header -->
      <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #0f172a; margin-bottom: 12px; background: #ffffff;">
        <tr>
          <td style="width: 22%; border: 1px solid #cbd5e1; padding: 6px; text-align: center; vertical-align: middle; background: #ffffff;">
            ${ot(m,c)}
          </td>
          <td style="width: 53%; border: 1px solid #cbd5e1; padding: 6px; text-align: center; vertical-align: middle;">
            <div style="font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; color: #0f172a;">PERMIT TO POUR (PTP) AUTHORIZATION</div>
            <div style="font-size: 9.5px; font-weight: 700; color: #ea580c; margin-top: 2px; text-transform: uppercase;">PROJECT: ${S}</div>
            <div style="font-size: 7.5px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-top: 1px;">ISO 9001:2015 Clause 8.6 Release of Products & Services</div>
          </td>
          <td style="width: 25%; border: 1px solid #cbd5e1; padding: 6px; font-size: 8px; line-height: 1.5; color: #334155; vertical-align: middle;">
            <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${b}</span></div>
            <div><strong>Date:</strong> ${_(t.plannedPourDate)}</div>
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
            ${x.map((a,v)=>`
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
          ${f.reduce((a,v,h)=>{if(h%2===0){const n=f[h+1],s=P(v),l=n?P(n):'<td style="width: 50%; height: 70px; background: #fafafa; border: 1px solid #e2e8f0;"></td>';a+=`<tr>${s}${l}</tr>`}return a},"")}
        </table>
      </div>

      <!-- Footer -->
      <div style="font-size: 8px; color: #64748b; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 5px; margin-top: 10px;">
        <div>CONFIDENTIAL & PROPRIETARY — ${p}</div>
        <div>Doc Ref: ${b}</div>
      </div>
    </div>
  `;function P(a){const v=a.required?"#15803d":"#64748b",h=a.required?"REQUIRED":"OPTIONAL";return`
      <td style="width: 50%; height: 70px; vertical-align: top; padding: 6px 8px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <span style="font-weight: 700; font-size: 8px; text-transform: uppercase; color: #ea580c;">${a.designation?`${a.designation} <span style="font-size: 7px; color: #64748b; font-weight: normal;">(${a.role})</span>`:a.role}</span>
          <span style="font-size: 6px; font-weight: 700; background: ${v}15; color: ${v}; padding: 1px 3px; border-radius: 2px;">${h}</span>
        </div>
        <div style="font-size: 8px; margin-bottom: 8px;">Name: <strong>${a.name||"__________________________________________________"}</strong></div>
        <div style="font-size: 8px; display: flex; justify-content: space-between;">
          <span>Sign: ________________________</span>
          <span>Date: ____ / ____ / 20__</span>
        </div>
      </td>
    `}const w=document.createElement("div");w.innerHTML=y,document.body.appendChild(w);const O={margin:[10,10,10,10],filename:`${b}_PermitToPour.pdf`,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:!0,logging:!1},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"}};re().set(O).from(w).toPdf().get("pdf").then(a=>{const v=a.internal.getNumberOfPages();for(let h=1;h<=v;h++)a.setPage(h),a.setFont("helvetica","normal"),a.setFontSize(6.5),a.setTextColor(100,116,139),a.text(`CONFIDENTIAL & PROPRIETARY — ${p}`,10,291),a.text(`PTP Ref: ${t.permitNumber}  |  Page ${h} of ${v}`,200,291,{align:"right"});a.save(`${b}.pdf`)}).catch(a=>{console.error("PDF generation failed:",a)}).finally(()=>{document.body.removeChild(w)})}function ye(t,c={},m={}){var g,a,v;const p=m.name||"Collection Developments LTD",S=c.name||"Bankside",b=t.inspectionNumber||`INSP-2026-${Math.floor(1e3+Math.random()*9e3)}`,x=t.items||[],d=x.filter(h=>h.result==="PASS").length,u=x.filter(h=>h.result==="FAIL").length,f=x.filter(h=>h.result==="OBSERVATION").length,P=(h=>{switch(h==null?void 0:h.toUpperCase()){case"APPROVED":case"CLOSED":return{bg:"#dcfce7",text:"#15803d",border:"#86efac"};case"PENDING_REVIEW":return{bg:"#fef3c7",text:"#b45309",border:"#fcd34d"};case"REJECTED":return{bg:"#fee2e2",text:"#b91c1c",border:"#fca5a5"};default:return{bg:"#f1f5f9",text:"#334155",border:"#cbd5e1"}}})(t.status),w=t.stakeholders&&t.stakeholders.length>0?t.stakeholders.filter(h=>h.required!==!1):[{role:"QA/QC Inspector",name:((g=t.inspector)==null?void 0:g.name)||t.inspectorName||"QA/QC Inspector",designation:((a=t.inspector)==null?void 0:a.designation)||"QA/QC Inspector",required:!0,signed:t.status==="APPROVED"||t.status==="CLOSED",signedAt:t.approvedAt?new Date(t.approvedAt).toISOString():void 0},{role:"Site / Construction Engineer",name:t.subcontractorRepresentative||"Site Engineer",designation:"Site Engineer",required:!0,signed:!1},{role:"Consultant / Resident Engineer",name:t.consultantRepresentative||"Resident Engineer",designation:"Consultant",required:!0,signed:!1}],O=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${ot(m,c)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">FIELD INSPECTION & VERIFICATION REPORT</div>
          <div class="header-title-project">PROJECT: ${S}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.6 Monitoring & Measurement of Processes</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${b}</span></div>
          <div><strong>Date:</strong> ${_(t.scheduledDate||t.createdAt)}</div>
          <div><strong>Status:</strong> <span class="status-badge" style="background:${P.bg}; color:${P.text}; border:1px solid ${P.border};">${t.status||"DRAFT"}</span></div>
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
      <div class="section-banner">2.0 TECHNICAL VERIFICATION CHECKPOINTS (${x.length} ITEMS | ${d} PASS, ${u} FAIL, ${f} OBS)</div>
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
          ${x.length>0?x.map((h,n)=>`
            <tr>
              <td style="text-align: center; font-weight: 700; color: #64748b;">${n+1}</td>
              <td style="text-align: center;">
                <span class="${h.result==="PASS"?"badge-pass":h.result==="FAIL"?"badge-fail":h.result==="OBSERVATION"?"badge-observation":"badge-na"}">${h.result||"PENDING"}</span>
              </td>
              <td style="font-weight: 700; color: #334155;">
                ${h.category||h.discipline||"Structural"}
                ${h.critical?'<br/><span class="badge-fail" style="font-size:6.5px; padding:0 3px;">CRITICAL</span>':""}
                ${h.isHoldPoint?'<br/><span class="badge-hold" style="font-size:6.5px; padding:0 3px;">HOLD POINT</span>':""}
              </td>
              <td>
                <div style="font-weight: 600; color: #0f172a;">${h.label}</div>
                ${h.acceptanceCriteria?`<div style="font-size: 7px; color: #64748b; margin-top: 1px; italic">Criteria: ${h.acceptanceCriteria}</div>`:""}
              </td>
              <td style="font-size: 7.2px; color: #475569;">${h.remarks||"—"}</td>
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
    ${x.some(h=>h.photos&&h.photos.length>0)?`
    <div class="pdf-section">
      <div class="section-banner">3.0 PHOTOGRAPHIC VERIFICATION RECORDS</div>
      <div class="photo-grid">
        ${x.flatMap(h=>(h.photos||[]).map(n=>({url:n,label:h.label}))).map((h,n)=>`
          <div class="photo-card">
            <span class="photo-tag">Photo #${n+1}</span>
            <div><img src="${h.url}" alt="Inspection Evidence" /></div>
            <div class="photo-caption">${h.label}</div>
          </div>
        `).join("")}
      </div>
    </div>
    `:""}

    <!-- 4.0 Statutory Sign-Off -->
    <div class="pdf-section">
      <div class="section-banner">4.0 STATUTORY WITNESS & VERIFICATION SIGN-OFF</div>
      <table class="signoff-table">
        ${(()=>{let h="";for(let s=0;s<w.length;s+=3){const l=w.slice(s,s+3),N=(100/Math.max(l.length,1)).toFixed(2);h+=`<tr>${l.map(R=>`
              <td style="width: ${N}%; vertical-align: top; padding: 6px 8px; border: 1px solid #cbd5e1; background: ${R.signed?"#f0fdf4":"#fafafa"};">
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
                  <span>Date: ${R.signed&&R.signedAt?_(R.signedAt):R.signed?_(t.scheduledDate||t.createdAt):"____/____/20__"}</span>
                </div>
              </td>
            `).join("")}</tr>`}return h})()}
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${p}</div>
      <div>Inspection Ref: ${b}</div>
    </div>
  `;rt(`${b} - Inspection Report`,O)}const we=ye;function ne(t,c){if(!t||!t.trim())return`
      <div style="font-size: 7.5px; color: #64748b; margin-bottom: 3.5px;">
        <strong style="color: ${c.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 1.5px;">${c.title}:</strong>
        <span style="font-style: italic;">—</span>
      </div>
    `;const p=t.replace(/<br\s*\/?>/gi,`
`).split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(p.length===0)return`
      <div style="font-size: 7.5px; color: #64748b; margin-bottom: 3.5px;">
        <strong style="color: ${c.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 1.5px;">${c.title}:</strong>
        <span style="font-style: italic;">—</span>
      </div>
    `;if(p.length===1)return`
      <div style="font-size: 7.5px; color: ${c.textColor||"#0f172a"}; margin-bottom: 3.5px;">
        <strong style="color: ${c.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 1.5px;">${c.title}:</strong>
        <div style="white-space: pre-line; line-height: 1.45;">${p[0]}</div>
      </div>
    `;const S=p.every(x=>/^(\d+[\.\)]|[a-zA-Z][\.\)]|[-•*])\s*/.test(x)),b=p.map((x,d)=>`
        <div style="display: flex; align-items: flex-start; line-height: 1.4; margin-bottom: 2.5px;">
          ${S?"":`<span style="font-weight: 700; color: ${c.bulletColor||c.titleColor}; margin-right: 4px; min-width: 13px; display: inline-block;">${d+1}.</span>`}
          <span style="flex: 1; white-space: pre-line;">${x}</span>
        </div>
      `).join("");return`
    <div style="font-size: 7.5px; color: ${c.textColor||"#0f172a"}; margin-bottom: 4px;">
      <strong style="color: ${c.titleColor}; text-transform: uppercase; font-size: 6.8px; display: block; margin-bottom: 2px;">${c.title}:</strong>
      <div style="padding-left: 1px;">
        ${b}
      </div>
    </div>
  `}function Oe(t,c={},m={}){var w,O,g,a,v,h;const p=(g=(O=(w=se)==null?void 0:w.getState)==null?void 0:O.call(w))==null?void 0:g.activeProject,b=(((h=(v=(a=se)==null?void 0:a.getState)==null?void 0:v.call(a))==null?void 0:h.projects)||[]).find(n=>n.id===(t.projectId||t.project)),x=(m==null?void 0:m.name)||t.companyName||"Collection Developments LTD",d=(c==null?void 0:c.name)||t.projectName||t.projectTitle||(b==null?void 0:b.name)||(p==null?void 0:p.name)||"Site Construction Operations",u=t.reportNumber||`QC-COMM-${Math.floor(1e3+Math.random()*9e3)}`,f=t.observations||[],y=f.filter(n=>n.status!=="CLOSED"&&n.status!=="Compliant"&&n.status!=="RECTIFIED").length,P=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${ot(m,c)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">SITE COMMENTS & FIELD OBSERVATIONS REPORT</div>
          <div class="header-title-project">PROJECT: ${d}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.5 & 8.7 Nonconformity Identification</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${u}</span></div>
          <div><strong>Date:</strong> ${_(t.inspectionDate||t.createdAt)}</div>
          <div><strong>Status:</strong> <span class="${y===0?"badge-pass":"badge-pending"}">${y===0?"ALL CLOSED":`${y} ACTION(S) PENDING`}</span></div>
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
          <td class="grid-value" style="width: 32%;">${_(t.inspectionDate)}</td>
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
          ${f.length>0?f.map((n,s)=>{const l=n.comments||n.observationText||n.fieldObservation||"—",N=n.correctiveDirective||"Rectify per approved engineering specifications.",R=n.status==="CLOSED"||n.status==="Compliant"||n.status==="RECTIFIED";return`
            <tr>
              <td style="text-align: center; font-weight: 700; color: #64748b;">${s+1}</td>
              <td>
                <div style="font-weight: 700; color: #0f172a;">${n.levelName||"Site Area"}</div>
                ${n.structuralElement?`<div style="font-size: 7.2px; font-weight: 600; color: #ea580c;">${n.structuralElement}</div>`:""}
                ${n.gridLocation?`<div style="font-size: 7px; color: #64748b;">Grid: ${n.gridLocation}</div>`:""}
                <div style="font-size: 7px; color: #475569; margin-top: 2px;"><strong>Trade:</strong> ${n.tradeName||n.trade||"Civil"}</div>
              </td>
              <td>
                ${ne(l,{title:"Observed Condition",titleColor:"#991b1b",bulletColor:"#991b1b",textColor:"#0f172a"})}
                ${ne(N,{title:"Corrective Directive",titleColor:"#15803d",bulletColor:"#15803d",textColor:"#166534"})}
                <div style="font-size: 7px; color: #64748b; margin-top: 2px;">
                  Assigned To: <strong>${n.assignedTo||n.assignedSubcontractor||"Contractor"}</strong>
                  ${n.dueDate?` | Target Due: ${_(n.dueDate)}`:""}
                </div>

                ${n.photos&&n.photos.length>0?`
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; padding-top: 3px; border-top: 1px dashed #cbd5e1;">
                  ${n.photos.map((L,F)=>{const B=typeof L=="string"?L:(L==null?void 0:L.url)||(L==null?void 0:L.thumbnailUrl);return B?`<img src="${B}" style="height: 50px; max-width: 80px; object-fit: cover; border-radius: 2px; border: 1px solid #cbd5e1;" alt="Photo ${F+1}" />`:""}).join("")}
                </div>
                `:""}
              </td>
              <td style="text-align: center;">
                <span class="${R?"badge-pass":"badge-pending"}">${n.status||"OPEN"}</span>
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
              <span>Date: ${_(t.inspectionDate||t.createdAt)}</span>
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
      <div>CONFIDENTIAL & PROPRIETARY — ${x}</div>
      <div>Report Ref: ${u}</div>
    </div>
  `;rt(`${u} - Site Comments`,P)}function De(t,c={},m={}){var d,u,f,y,P,w,O,g;const p=m.name||"Collection Developments LTD",S=c.name||"Bankside",b=t.rfiNumber||`RFI-2026-${Math.floor(1e3+Math.random()*9e3)}`,x=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${ot(m,c)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">REQUEST FOR INFORMATION (RFI)</div>
          <div class="header-title-project">PROJECT: ${S}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.2 Design & Engineering Communications</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${b}</span></div>
          <div><strong>Date Raised:</strong> ${_(t.createdAt)}</div>
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
      <div class="section-banner">4.0 CONSULTANT FORMAL RESPONSE & DIRECTIVE [${((f=t.response)==null?void 0:f.approvalStatus)||"UNDER REVIEW"}]</div>
      <div class="box-content">
        <div style="line-height: 1.45; color: #0f172a; margin-bottom: 6px;">
          ${((y=t.response)==null?void 0:y.responseText)||"Official response is currently being finalized by the engineering design consultant."}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #475569; border-top: 1px solid #f1f5f9; padding-top: 4px;">
          <span>Reviewed By: <strong>${((P=t.response)==null?void 0:P.responderName)||t.assignedConsultant||"Consultant"}</strong></span>
          <span>Response Date: <strong>${_((w=t.response)==null?void 0:w.responseDate)}</strong></span>
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
            <div style="font-size: 8px; color: #334155;">Name: <strong>${((O=t.raisedBy)==null?void 0:O.name)||"Lead Engineer"}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${_(t.createdAt)}</span>
            </div>
          </td>
          <td style="width: 50%;">
            <div class="sig-role-header"><span>CONSULTANT / LEAD ENGINEER</span><span class="sig-required-tag">REQUIRED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${t.assignedConsultant||"Lead Consultant"}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${_((g=t.response)==null?void 0:g.responseDate)}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${p}</div>
      <div>RFI Ref: ${b}</div>
    </div>
  `;rt(`${b} - Technical RFI`,x)}function Pe(t,c={},m={}){var y,P,w,O,g;const p=m.name||"Collection Developments LTD",S=c.name||"Bankside",b=t.marNumber||`MAR-2026-${Math.floor(1e3+Math.random()*9e3)}`,x=t.submittedByName||(typeof t.submittedBy=="string"?t.submittedBy:"QA/QC Materials Lead"),d=((y=t.reviewedBy)==null?void 0:y.name)||((P=t.response)==null?void 0:P.respondedByName)||t.assignedConsultantName||"Materials Consultant",u=((w=t.reviewedBy)==null?void 0:w.date)||((O=t.response)==null?void 0:O.responseDate)||(t.updatedAt?_(t.updatedAt):_(t.createdAt)),f=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${ot(m,c)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">MATERIAL APPROVAL REQUEST (MAR)</div>
          <div class="header-title-project">PROJECT: ${S}</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.4 Control of Externally Provided Products & Services</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${b}</span></div>
          <div><strong>Date:</strong> ${_(t.createdAt)}</div>
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
          <td class="grid-value">${x}</td>
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
          ${t.reviewComments||((g=t.response)==null?void 0:g.responseText)||"Submittal is in accordance with project specifications."}
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
            <div style="font-size: 8px; color: #334155;">Name: <strong>${x}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${_(t.createdAt)}</span>
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
      <div>MAR Ref: ${b}</div>
    </div>
  `;rt(`${b} - Material Approval Request`,f)}function _e(t,c={},m={}){var w,O,g,a,v,h;const p=m.name||" ",S=c.name||" ",b=t.sampleNumber||t.sampleId||`CUBE-${Math.floor(1e3+Math.random()*9e3)}`,x=t.target28DayStrengthNmm2||t.day28Required||(t.targetStrength?parseFloat(t.targetStrength):0)||30,d=[],u=[{age:1,title:"1-Day Test",resArray:t.day1Results,testSummary:(w=t.tests)==null?void 0:w.day1,req:t.day1Required,defaultTargetRatio:.2,dateField:t.day1Date},{age:3,title:"3-Day Test",resArray:t.day3Results,testSummary:(O=t.tests)==null?void 0:O.day3,req:t.day3Required,defaultTargetRatio:.45,dateField:t.day3Date},{age:7,title:"7-Day Test",resArray:t.day7Results,testSummary:(g=t.tests)==null?void 0:g.day7,req:t.day7Required,defaultTargetRatio:.7,dateField:t.day7Date},{age:14,title:"14-Day Test",resArray:t.day14Results,testSummary:(a=t.tests)==null?void 0:a.day14,req:t.day14Required,defaultTargetRatio:.85,dateField:t.day14Date},{age:28,title:"28-Day Test",resArray:t.day28Results,testSummary:(v=t.tests)==null?void 0:v.day28,req:t.day28Required,defaultTargetRatio:1,dateField:t.day28Date}];for(const n of u){const s=n.req||Math.round(x*n.defaultTargetRatio*10)/10;if(n.resArray&&n.resArray.length>0){const l=n.resArray[0];d.push({age:n.age,title:n.title,testDate:l.testDate||n.dateField||t.castDate,targetStrength:s,averageStrength:l.averageStrength||0,maximumStrength:l.maximumStrength,minimumStrength:l.minimumStrength,standardDeviation:l.standardDeviation,status:l.status||(l.averageStrength>=s?"PASS":"FAIL"),technician:l.technician||t.preparedBy||"Materials Technician",testingStandard:l.testingStandard||"BS EN 12390-3",cubes:l.cubes||[]})}else if(n.testSummary){const l=n.testSummary,N=l.averageStrengthNmm2??l.compressiveStrengthNmm2??0;d.push({age:n.age,title:n.title,testDate:l.actualTestDate||l.testDate||l.scheduledDate||n.dateField||t.castDate,targetStrength:l.requiredStrengthNmm2||l.targetStrengthNmm2||s,averageStrength:N,maximumStrength:N,minimumStrength:N,standardDeviation:0,status:l.compliance||(N>=s?"PASS":"FAIL"),technician:l.testedBy||l.labTechnician||t.preparedBy||"Materials Technician",testingStandard:"BS EN 12390-3",cubes:(l.cubes||l.individualResults||[]).map((R,L)=>({id:L+1,load:R.failureLoadKn||R.crushingLoadKn||l.crushingLoadKn||"—",strength:R.compressiveStrengthNmm2||N,failureMode:R.typeOfFailure||R.failureMode||"Satisfactory",cubeWeight:R.weightKg||""}))})}}const f=d.find(n=>n.age===28),y=f?f.status==="PASS"||f.averageStrength>=f.targetStrength:null,P=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${ot(m,c)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">CONCRETE COMPRESSIVE STRENGTH TEST CERTIFICATE</div>
          <div class="header-title-project">PROJECT: ${S}</div>
          <div class="header-title-iso">BS EN 12390-3 / ASTM C39 Compressive Strength Quality Verification</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${b}</span></div>
          ${t.inscribedName?`<div><strong>Inscribed Mark:</strong> <span style="font-weight:700; color:#0f172a;">${t.inscribedName}</span></div>`:""}
          <div><strong>Cast Date:</strong> ${t.castDate||_(t.castDate)}</div>
          <div><strong>Status:</strong> <span class="${t.status==="APPROVED"||y?"badge-pass":y===!1||t.status==="NCR_ISSUED"||t.status==="REJECTED"?"badge-fail":"badge-pending"}">${t.status||(y?"28D COMPLIANT":"IN PROGRESS")}</span></div>
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
          <td class="grid-value" style="width: 32%;"><strong>${t.concreteGrade}</strong> (Target: ${x} MPa)</td>
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
          <td class="grid-value">Start: ${_(t.curingStartDate||t.castDate)} ${t.removedFromTankDate?`• Out: ${_(t.removedFromTankDate)}`:""}</td>
        </tr>
      </table>
    </div>

    <!-- 3.0 Multi-Cube Crushing Results -->
    <div class="pdf-section">
      <div class="section-banner">3.0 LABORATORY COMPRESSION CRUSHING LOG & STRENGTH STATISTICAL EVALUATION</div>
      ${d.length>0?d.map(n=>{const s=n.status==="PASS"||n.averageStrength>=n.targetStrength;return`
        <div style="margin-bottom: 8px; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden;">
          <div style="background: #f8fafc; padding: 4px 8px; font-weight: 700; font-size: 8px; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0;">
            <span>${n.title.toUpperCase()} (Test Date: ${_(n.testDate)}) — Standard: ${n.testingStandard}</span>
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
              ${n.cubes.length>0?n.cubes.map(l=>`
                <tr>
                  <td style="text-align: center; font-weight: 700; color: #0f172a;">Cube #${l.id}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 700;">${l.load||"—"}</td>
                  <td style="text-align: right; font-family: monospace; font-weight: 800; color: ${s?"#15803d":"#b91c1c"};">${l.strength||"—"}</td>
                  <td style="color: #475569; font-size: 7.2px;">${l.failureMode||"Cone Failure (Satisfactory)"}</td>
                  <td style="text-align: right; font-family: monospace; color: #64748b;">${l.cubeWeight||"—"}</td>
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
              <span>Date: ${_(t.preparedByDate||((h=d[0])==null?void 0:h.testDate)||t.castDate)}</span>
            </div>
          </td>
          <td style="width: 33.33%;">
            <div class="sig-role-header"><span>CONSULTANT ENGINEER</span><span class="sig-optional-tag">OPTIONAL</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>${t.reviewedBy||t.approvedBy||""}</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 10px;">
              <span>Sign: ___________________</span>
              <span>Date: ${_(t.reviewedByDate||t.approvedByDate||t.castDate)}</span>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="doc-footer">
      <div>CONFIDENTIAL & PROPRIETARY — ${p}</div>
      <div>Certificate Ref: ${b}</div>
    </div>
  `;rt(`${b} - Cube Test Certificate`,P)}function Le(t,c={},m={},p){var At,Nt,$t,wt,Ot,Dt;const S=(p==null?void 0:p.revisionNumber)||t.revisionNumber||(t==null?void 0:t.revision),b=S&&String(S).trim().length>0?String(S).trim():"Rev 1.0 (Final Submission)",x=m.name||"Collection Developments LTD",d=m.legalName||(m==null?void 0:m.companyName)||"Collection Developments Limited",u=m.logoUrl||m.logo||(m==null?void 0:m.logoBase64)||t.logoBase64||"",f=c.name||t.projectName||"BANKSIDE",y=t.reportNumber||`WQR-2026-${Math.floor(1e3+Math.random()*9e3)}`,P=(p==null?void 0:p.includeNcrs)!==void 0?p.includeNcrs:(p==null?void 0:p.includeNcrsAndComments)!==void 0?p.includeNcrsAndComments:t.includeNcrs!==void 0?t.includeNcrs:t.includeNcrsAndComments!==!1,w=(p==null?void 0:p.includeSiteComments)!==void 0?p.includeSiteComments:(p==null?void 0:p.includeNcrsAndComments)!==void 0?p.includeNcrsAndComments:t.includeSiteComments!==void 0?t.includeSiteComments:t.includeNcrsAndComments!==!1,O=(p==null?void 0:p.includeSiteInstructions)!==void 0?p.includeSiteInstructions:t.includeSiteInstructions!==!1;function g(i){if(!i)return"";if(typeof i=="string"){const e=i.trim();if(/^\d{4}-\d{2}-\d{2}$/.test(e))return e;const r=new Date(e);return isNaN(r.getTime())?e:r.toISOString().split("T")[0]}return typeof i=="number"?new Date(i).toISOString().split("T")[0]:i instanceof Date&&!isNaN(i.getTime())?i.toISOString().split("T")[0]:""}function a(){try{const i=ae.getState().currentUser;return(i==null?void 0:i.email)||""}catch{return""}}const v=t.startDate||t.weekStart||"",h=t.endDate||t.weekEnd||"",n=g(v)||"—",s=g(h)||"—",l=s!=="—"?s:g(t.reportDate||t.createdAt)||g(new Date),N=typeof t.preparedBy=="object"&&t.preparedBy?t.preparedBy:{name:typeof t.preparedBy=="string"?t.preparedBy:"",designation:"QA/QC ENGINEER",role:"QA/QC ENGINEER"},R=N.name||((At=ae.getState().currentUser)==null?void 0:At.fullName)||((Nt=ae.getState().currentUser)==null?void 0:Nt.displayName)||"Authorized QA/QC Engineer",L=N.designation||N.role||"QA/QC ENGINEER",F=N.email||a()||"—";N.signed;const B=N.signatureUrl||"",tt=(t.cubeTests&&t.cubeTests.length>0?t.cubeTests:t.filteredCubeTests)||[],K=t.quantitySummary||[],et=t.mepClearance||[],W=(t.materialDeliveries&&t.materialDeliveries.length>0?t.materialDeliveries:t.filteredMaterialDeliveries)||[],z=(t.ncrRemediationLog&&t.ncrRemediationLog.length>0?t.ncrRemediationLog:t.filteredNcrs)||t.ncr||[],lt=(t.siteComments&&t.siteComments.length>0?t.siteComments:t.filteredSiteComments)||t.filteredFindings||[],at=(t.siteInstructions&&t.siteInstructions.length>0?t.siteInstructions:t.filteredSiteInstructions)||[],bt=t.projectCoverImageUrl||t.coverImageUrl||t.coverImageBase64||c.coverImageUrl||c.imageUrl||(c==null?void 0:c.image)||(t==null?void 0:t.projectImage)||"",ct=(t.pictorialUrls||[]).filter(i=>{const e=typeof i=="string"?i:i==null?void 0:i.url;return!!(e&&typeof e=="string"&&e.trim().length>0)}),_t=t.beamLayoutImg,Lt=t.columnLayoutImg,kt=t.slabImg,pt=t.structuralElements||[],Mt=pt.filter(i=>(i.elementType||i.type||i.element||"").toLowerCase().includes("column")),zt=pt.filter(i=>(i.elementType||i.type||i.element||"").toLowerCase().includes("beam")),Ut=pt.filter(i=>(i.elementType||i.type||i.element||"").toLowerCase().includes("slab")),st=(t.selectedLevel||t.selectedLevelName||"—").toUpperCase();let gt=0,ht=0;K.length>0?K.forEach(i=>{const e=parseFloat(String(i.calculatedVolume??i.plannedVolume??i.scope??0))||0,r=parseFloat(String(i.achievedVolume??i.actualVolume??0))||0;gt+=e,ht+=r}):pt.length>0&&pt.forEach(i=>{const e=parseFloat(String(i.calculatedVolume||i.volume||0))||0,r=parseFloat(String(i.achievedVolume??i.completedVolume??0))||0;gt+=e,ht+=r}),gt===0&&t.totalVolumeCalculated&&(gt=Number(t.totalVolumeCalculated)||0),ht===0&&t.totalVolumeAchieved&&(ht=Number(t.totalVolumeAchieved)||0);const Ft=gt>0?Math.round(ht/gt*100):0,vt=((($t=t.ncrStats)==null?void 0:$t.openTotal)??0)+lt.filter(i=>{const e=String(i.status||"").toLowerCase();return e.includes("non")||e.includes("open")||e.includes("progress")||e.includes("pending")}).length,Bt=t.overallQualityCompliance!==void 0&&t.overallQualityCompliance!==null?Number(t.overallQualityCompliance):((wt=t.metrics)==null?void 0:wt.inspectionPassRate)!==void 0&&((Ot=t.metrics)==null?void 0:Ot.inspectionPassRate)!==null?Number(t.metrics.inspectionPassRate):100,Gt=(p==null?void 0:p.templateId)||t.templateId||"classic-executive",T=me(Gt),Vt=()=>`
    <div style="display: flex; align-items: center; gap: 6px;">
      ${u?`<img src="${u}" style="max-height: 22px; max-width: 80px; object-fit: contain;" alt="Logo" />`:`
          <div style="display: flex; gap: 2px; align-items: flex-end; height: 16px;">
            <span style="width: 3.5px; height: 9px; background: ${T.accentColor}; border-radius: 1px;"></span>
            <span style="width: 3.5px; height: 16px; background: ${T.accentColor}; border-radius: 1px;"></span>
            <span style="width: 3.5px; height: 12px; background: ${T.accentColor}; border-radius: 1px;"></span>
          </div>
          <span style="font-size: 8.5px; font-weight: 900; color: #0f172a; letter-spacing: 0.8px; text-transform: uppercase;">COLLECTION</span>
        `}
    </div>
  `,H=i=>`
    <div class="pdf-header">
      <div class="pdf-header-top">
        <div style="display: flex; align-items: center; gap: 8px;">
          ${Vt()}
          <div style="font-size: 8.5px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 6px; letter-spacing: 0.2px;">
            <span>${l}</span>
            <span style="color: #cbd5e1;">|</span>
            <span style="color: ${T.accentColor}; font-weight: 800;">QA/QC SURVEILLANCE</span>
            <span style="color: #cbd5e1;">|</span>
            <span style="font-weight: 800; color: #0f172a; text-transform: uppercase;">${i}</span>
          </div>
        </div>
        <div style="font-size: 8.5px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase;">
          <span style="color: #0f172a;">${f.toUpperCase()}</span> &nbsp;|&nbsp; <span style="color: #94a3b8;">CONFIDENTIAL</span>
        </div>
      </div>
      <div class="pdf-header-rule" style="background: ${T.ruleColor}; height: 2px;"></div>
    </div>
  `,Q=i=>`
    <div class="pdf-footer" style="border-top: 1px solid ${T.cardBorder};">
      <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">
        Compiled By: <strong style="color: #475569;">${R} (${L})</strong> &nbsp;|&nbsp; ISO 9001:2015 Quality Management System
      </div>
      <div class="pdf-slide-badge" style="background: ${T.badgeBg}; color: ${T.badgeTextColor}; border: 1px solid ${T.badgeBorder}; border-radius: ${T.cardRadius};">
        SLIDE ${String(i).padStart(2,"0")}
      </div>
    </div>
  `,A=[];A.push(`
    <div class="pdf-sheet" style="padding: 0; display: flex; flex-direction: row; height: 210mm; overflow: hidden; position: relative;">
      <!-- Left Hero Column (~46% width) -->
      <div style="width: 46%; padding: 24mm 14mm 16mm 16mm; display: flex; flex-direction: column; justify-content: space-between; background: #ffffff; position: relative; border-right: 3px solid ${T.accentColor};">
        <div>
          <!-- Company Brand Header -->
          <div style="margin-bottom: 22px;">
            <div style="display: flex; align-items: flex-end; gap: 2px; margin-bottom: 4px;">
              ${u?`<img src="${u}" style="max-height: 120px; max-width: 190px; object-fit: contain;" alt="${x}" />`:`
                <div style="display: flex; gap: 3px; align-items: flex-end; height: 26px;">
                  <span style="width: 5px; height: 14px; background: ${T.accentColor}; border-radius: 1px;"></span>
                  <span style="width: 5px; height: 24px; background: ${T.accentColor}; border-radius: 1px;"></span>
                  <span style="width: 5px; height: 18px; background: ${T.accentColor}; border-radius: 1px;"></span>
                </div>
              `}
            </div>
            <div style="font-size: 13px; font-weight: 900; color: #0f172a; letter-spacing: 1.5px; text-transform: uppercase;">
              ${x.toUpperCase()}
            </div>
          </div>

          <!-- Project Title & Divider -->
          <div style="margin-bottom: 18px;">
            <div style="font-size: 34px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; text-transform: uppercase; line-height: 1.05;">
              ${f.toUpperCase()}
            </div>
            <div style="width: 100%; height: 2px; background: ${T.accentColor}; margin-top: 14px;"></div>
          </div>

          <!-- Report Title -->
          <div style="font-size: 19px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.3px; margin-bottom: 12px;">
            ${t.title||"QA/QC WEEKLY REPORT"}
          </div>

          <!-- Surveillance Level Tag -->
          <div style="display: inline-block; background: ${T.accentLight}; color: ${T.accentDark}; font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: ${T.cardRadius}; border: 1px solid ${T.cardBorder}; text-transform: uppercase; margin-bottom: 12px;">
            SURVEILLANCE: ${st}
          </div>
          <div></div>

          <!-- Date Range Pill -->
          <div style="display: inline-block; background: #FFFFFF; border: 1.5px solid ${T.accentColor}; color: ${T.accentDark}; font-size: 10.5px; font-weight: 800; padding: 6px 22px; border-radius: 9999px; letter-spacing: 0.5px; text-transform: uppercase;">
            ${n} &nbsp;TO&nbsp; ${s}
          </div>
        </div>

        <!-- Compiler Card (Bottom Left) -->
        <div style="background: #ffffff; border: 1px solid ${T.cardBorder}; border-left: 4px solid ${T.accentColor}; border-radius: ${T.cardRadius}; padding: 12px 16px; margin-top: auto;">
          <div style="font-size: 7.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
            AUTHORIZED COMPILER &amp; QA/QC OFFICER
          </div>
          <div style="font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 3px;">
            ${R}
          </div>
          <div style="font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 1px;">
            ${L}
          </div>
        </div>
      </div>

      <!-- Right Column (~54% width) Full-Bleed Cover Image -->
      <div style="width: 54%; height: 100%; background: #0f172a; overflow: hidden; position: relative;">
        ${bt?`<img src="${bt}" style="width: 100%; height: 100%; object-fit: cover;" alt="${f}" />`:`
          <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
            <div style="text-align: center; color: #ffffff; padding: 30px;">
              <div style="font-size: 36px; font-weight: 900; color: #c28b5e;">${f.toUpperCase()}</div>
              <div style="font-size: 12px; color: #94a3b8; font-weight: 700; margin-top: 8px;">OFFICIAL QA/QC SURVEILLANCE DOSSIER</div>
            </div>
          </div>
        `}
      </div>
    </div>
  `),A.push(`
    <div class="pdf-sheet">
      <div>
        ${H("EXECUTIVE SUMMARY: OPERATIONAL OVERVIEW")}
        
        <!-- 4 Top Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px;">
          <!-- Card 1: Total Scope Volume -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #0f172a; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL SCOPE VOLUME</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${gt.toLocaleString(void 0,{maximumFractionDigits:1})} m³</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">Design Volume Target</div>
          </div>

          <!-- Card 2: Achieved Volume -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #0284c7; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">ACHIEVED VOLUME</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${ht.toLocaleString(void 0,{maximumFractionDigits:1})} m³</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">${Ft}% Cumulative</div>
          </div>

          <!-- Card 3: Quality Compliance -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #16a34a; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">QUALITY COMPLIANCE</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${Bt}%</div>
            <div style="font-size: 7.5px; color: #94a3b8; font-weight: 600;">Field Surveillance Benchmark</div>
          </div>

          <!-- Card 4: Open Findings / NCRs -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: 3px solid #dc2626; border-radius: 4px; padding: 12px 14px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">OPEN FINDINGS / NCRS</div>
            <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px 0;">${vt}</div>
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
            ${(Dt=t.synopsis||t.executiveSummary)!=null&&Dt.trim()?t.synopsis||t.executiveSummary:'<span style="color: #94a3b8; font-style: italic;">No executive synopsis provided for this reporting period.</span>'}
          </div>
        </div>
      </div>
      ${Q(A.length+1)}
    </div>
  `);const St=i=>{const e=i&&i.trim().length>0?i.trim():"";return e?e.split(/\n\s*\n|\n/).map(I=>I.trim()).filter(Boolean).map(I=>{if(I.includes(":")){const C=I.split(":"),D=C[0].trim(),o=C.slice(1).join(":").trim();return`
            <div style="margin-bottom: 12px;">
              <strong style="color: #0f172a; font-weight: 800;">${D}:</strong> ${o}
            </div>
          `}return`<div style="margin-bottom: 10px;">${I}</div>`}).join(""):""};A.push(`
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
              ${St(t.highlights)}
            </div>
          </div>

          <!-- Column 2: Risks & Concerns -->
          <div style="display: flex; flex-direction: column;">
            <div style="background: #d97706; color: #ffffff; text-align: center; padding: 10px 12px; font-weight: 800; font-size: 10.5px; border-radius: 4px 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
              CRITICAL RISKS &amp; OPEN CONCERNS
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 16px; font-size: 9px; line-height: 1.5; color: #334155; background: #ffffff;">
              ${St(t.concerns)}
            </div>
          </div>

          <!-- Column 3: Look-Ahead Plan -->
          <div style="display: flex; flex-direction: column;">
            <div style="background: #4f46e5; color: #ffffff; text-align: center; padding: 10px 12px; font-weight: 800; font-size: 10.5px; border-radius: 4px 4px 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
              LOOK-AHEAD PLAN &amp; ACTION TARGETS
            </div>
            <div style="flex: 1; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; padding: 16px; font-size: 9px; line-height: 1.5; color: #334155; background: #ffffff;">
              ${St(t.nextWeekPlan)}
            </div>
          </div>
        </div>
      </div>
      ${Q(A.length+1)}
    </div>
  `);const Rt=tt;if(Rt.length===0)A.push(`
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
              <tr>
                <td colspan="7" style="text-align: center; color: #64748b; padding: 24px; font-weight: 600;">
                  No concrete compressive strength test records logged for this reporting period.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        ${Q(A.length+1)}
      </div>
    `);else{const e=Math.ceil(Rt.length/14);for(let r=0;r<e;r++){const I=Rt.slice(r*14,(r+1)*14),C=e>1?`CONCRETE COMPRESSIVE STRENGTH TEST MATRIX (PART ${r+1} OF ${e})`:"CONCRETE COMPRESSIVE STRENGTH TEST MATRIX",D=I.map((o,k)=>{var q,G,nt,it;const M=r*14+k+1,U=o.strength7Days||((G=(q=o.day7Results)==null?void 0:q[0])!=null&&G.averageStrength?`${o.day7Results[0].averageStrength} N/mm²`:"—"),$=o.strength28Days||((it=(nt=o.day28Results)==null?void 0:nt[0])!=null&&it.averageStrength?`${o.day28Results[0].averageStrength} N/mm²`:"—"),E=String(o.status7Days||(U!=="—"?"PASS":"pending")).toLowerCase(),Y=String(o.status28Days||($!=="—"?"PASS":"pending")).toLowerCase();return`
            <tr>
              <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(M).padStart(2,"0")}</td>
              <td style="font-family: monospace; font-weight: 600;">${g(o.dateCast||o.castDate||o.date)||"—"}</td>
              <td style="font-weight: 800; color: #0f172a; text-transform: uppercase;">${o.elementLevel||o.element||o.inscribedName||"Structural Element"}</td>
              <td style="font-family: monospace; font-weight: 700; text-align: center;">${U}</td>
              <td style="text-align: center; font-weight: 800; color: ${E.includes("pass")?"#16a34a":"#d97706"};">${E.includes("pass")?"PASS":E.toUpperCase()}</td>
              <td style="font-family: monospace; font-weight: 700; text-align: center;">${$}</td>
              <td style="text-align: center; font-weight: 800; color: ${Y.includes("pass")?"#16a34a":"#d97706"};">${Y.includes("pass")?"PASS":Y.toUpperCase()}</td>
            </tr>
          `}).join("");A.push(`
        <div class="pdf-sheet">
          <div>
            ${H(C)}
            
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
                ${D}
              </tbody>
            </table>
          </div>
          ${Q(A.length+1)}
        </div>
      `)}}const Et=["#3b82f6","#10b981","#f97316","#8b5cf6","#06b6d4","#ec4899","#f59e0b"],j=[];if(K.length>0)K.forEach((i,e)=>{const r=parseFloat(String(i.calculatedVolume??i.plannedVolume??i.scope??0))||0,I=parseFloat(String(i.achievedVolume??i.actualVolume??0))||0;let C=r>0?Math.round(I/r*100):parseInt(String(i.completion||0));C=Math.min(100,Math.max(0,C)),j.push({name:String(i.element||i.structuralElement||`Element ${e+1}`).toUpperCase().trim(),scope:r,completion:C,color:Et[e%Et.length]})});else if(pt.length>0){const i={};pt.forEach(e=>{const r=(e.elementType||e.type||e.element||"OTHER").toUpperCase().trim(),I=parseFloat(String(e.calculatedVolume||e.volume||0))||0,C=parseFloat(String(e.achievedVolume??e.completedVolume??0))||0;i[r]||(i[r]={scope:0,achieved:0}),i[r].scope+=I,i[r].achieved+=C}),Object.entries(i).forEach(([e,r],I)=>{const C=r.scope>0?Math.min(100,Math.max(0,Math.round(r.achieved/r.scope*100))):0;j.push({name:e,scope:Math.round(r.scope*100)/100,completion:C,color:Et[I%Et.length]})})}const Tt=j.reduce((i,e)=>i+e.scope,0),Ht=j.length>0?Math.round(j.reduce((i,e)=>i+e.completion,0)/j.length):0,Ct=(()=>{if(j.length===0||Tt===0)return{svg:`
          <svg width="150" height="150" viewBox="0 0 150 150" style="display: block; margin: 0 auto;">
            <circle cx="75" cy="75" r="62" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="3 3" />
            <text x="75" y="78" text-anchor="middle" font-size="8.5" fill="#94a3b8" font-family="-apple-system, sans-serif" font-weight="600">No Volume Data</text>
          </svg>
        `,legend:`
          <div style="margin-top: 10px; font-size: 7.5px; color: #94a3b8; text-align: center; font-style: italic;">
            No quantity distribution recorded
          </div>
        `};const i=150,e=75,r=75,I=62;let C=-Math.PI/2;const D=[];j.forEach(M=>{const $=(Tt>0?M.scope/Tt:1/(j.length||1))*2*Math.PI,E=C+$,Y=e+I*Math.cos(C),q=r+I*Math.sin(C),G=e+I*Math.cos(E),nt=r+I*Math.sin(E),it=$>Math.PI?1:0,V=`M ${e} ${r} L ${Y.toFixed(2)} ${q.toFixed(2)} A ${I} ${I} 0 ${it} 1 ${G.toFixed(2)} ${nt.toFixed(2)} Z`;D.push(`<path d="${V}" fill="${M.color}" stroke="#ffffff" stroke-width="1.5" />`),C=E});const o=`
      <svg width="${i}" height="${i}" viewBox="0 0 ${i} ${i}" style="display: block; margin: 0 auto;">
        ${D.join("")}
      </svg>
    `,k=`
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; margin-top: 10px; font-size: 7.5px; font-weight: 800;">
        ${j.map(M=>`
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="display: inline-block; width: 8px; height: 8px; background: ${M.color}; border-radius: 1.5px;"></span>
            <span style="color: #334155; text-transform: uppercase;">${M.name}</span>
          </div>
        `).join("")}
      </div>
    `;return{svg:o,legend:k}})(),Qt=()=>{if(j.length===0)return`
        <div style="margin-top: 10px; background: #fafbfd; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; color: #94a3b8; font-size: 8.5px; font-style: italic;">
          No element quantity comparison metrics logged for this level.
        </div>
      `;const i=720,e=100,r=78,I=Math.max(...j.map(k=>k.scope),10),C=i/(j.length||1),D=Math.min(22,C*.32),o=j.map((k,M)=>{const U=M*C+C/2,$=I>0?k.scope/I*58:0,E=k.scope*k.completion/100,Y=I>0?E/I*58:0,q=U-D-2,G=r-$,nt=U+2,it=r-Y;return`
          <!-- Scope Bar (Blue) -->
          <rect x="${q.toFixed(1)}" y="${G.toFixed(1)}" width="${D.toFixed(1)}" height="${Math.max($,1).toFixed(1)}" rx="1.5" fill="#3b82f6" />
          <!-- Achieved Bar (Orange) -->
          <rect x="${nt.toFixed(1)}" y="${it.toFixed(1)}" width="${D.toFixed(1)}" height="${Math.max(Y,1).toFixed(1)}" rx="1.5" fill="#f97316" />
          <!-- X-Axis Label -->
          <text x="${U.toFixed(1)}" y="${(r+14).toFixed(1)}" text-anchor="middle" font-size="8" font-weight="700" fill="#475569" font-family="-apple-system, sans-serif" letter-spacing="0.3">${k.name}</text>
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
        <svg width="100%" height="${e}" viewBox="0 0 ${i} ${e}" style="display: block; overflow: visible;">
          <line x1="20" y1="${r}" x2="${i-20}" y2="${r}" stroke="#cbd5e1" stroke-width="1.2" />
          ${o}
        </svg>
      </div>
    `},jt=j.length>0?j.map(i=>`
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
      `;A.push(`
    <div class="pdf-sheet">
      <div>
        ${H(`${st} — QUANTITY SUMMARY`)}
        
        <!-- Top Half: Table and Pie Chart -->
        <div style="display: flex; gap: 16px; align-items: stretch; margin-top: 8px;">
          <!-- Left Table (50% width) -->
          <div style="flex: 1.1;">
            <div style="font-size: 10px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 6px; letter-spacing: -0.2px;">
              ${st} FLOOR CONCRETE CHART
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
                ${jt}
                ${j.length>0?`
                  <tr style="background: #f8fafc; font-weight: 900; border-top: 2px solid #cbd5e1;">
                    <td style="font-size: 8.5px; color: #0f172a; text-transform: uppercase; font-weight: 900;">TOTAL</td>
                    <td style="font-family: monospace; font-size: 9px; color: #0f172a; font-weight: 900;">${Tt.toLocaleString(void 0,{maximumFractionDigits:1})}</td>
                    <td style="font-family: monospace; font-size: 9px; color: #0f172a; font-weight: 900;">${Ht}%</td>
                  </tr>
                `:""}
              </tbody>
            </table>
          </div>

          <!-- Right Pie Chart Card (50% width) -->
          <div style="flex: 0.9; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; display: flex; flex-direction: column; justify-content: space-between;">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
              ${Ct.svg}
              ${Ct.legend}
            </div>
            <div style="text-align: center; font-size: 8px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-top: 6px; letter-spacing: 0.5px;">
              ${st} FLOOR CONCRETE CHART
            </div>
          </div>
        </div>

        <!-- Bottom Half: Grouped Vertical Bar Chart -->
        ${Qt()}
      </div>
      ${Q(A.length+1)}
    </div>
  `);function It(i,e,r,I,C,D=!0){if(D&&r.length>0){const k=Math.ceil(r.length/26);let M=0,U=0;r.forEach($=>{const E=parseFloat(String($.calculatedVolume||$.volume||0))||0,Y=parseFloat(String($.achievedVolume??$.completedVolume??0))||0;M+=E,U+=Y});for(let $=0;$<k;$++){const E=r.slice($*26,($+1)*26),Y=$===0,q=$===k-1,G=Y?`${st} — ${e.toUpperCase()} ELEMENTS STATUS`:`${st} — ${i.toUpperCase()} STATUS (CONT'D)`,nt=E.map(V=>{const xt=parseFloat(String(V.calculatedVolume||V.volume||0))||0,mt=parseFloat(String(V.achievedVolume??V.completedVolume??0))||0;let ut=xt>0?Math.round(mt/xt*100):Number(V.completionPercentage||V.completion||0);ut=Math.min(100,Math.max(0,ut));const Pt=(V.status||V.qaStatus||V.inspectionStatus||"PENDING").toString().trim(),J=Pt.toUpperCase().replace(/\s+/g,"_"),te=Pt.replace(/_/g," ").toUpperCase();let X="#f8fafc",Z="#475569",ft="#cbd5e1",dt=ut>0?"#3b82f6":"#cbd5e1";J.includes("APPROV")||J==="COMPLETED"||J==="PASS"?(X="#ecfdf5",Z="#059669",ft="#a7f3d0",dt="#16a34a"):J==="POURED"||J.includes("CAST")?(X="#ecfeff",Z="#0891b2",ft="#a5f3fc",dt="#06b6d4"):J.includes("READY")?(X="#e0e7ff",Z="#4338ca",ft="#c7d2fe",dt="#6366f1"):J.includes("INSPECT")?(X="#f5f3ff",Z="#7c3aed",ft="#ddd6fe",dt="#8b5cf6"):J.includes("PROGRESS")?(X="#eff6ff",Z="#2563eb",ft="#bfdbfe",dt="#3b82f6"):J.includes("REJECT")||J.includes("FAIL")||J.includes("NCR")?(X="#fef2f2",Z="#dc2626",ft="#fecaca",dt="#ef4444"):(X="#f8fafc",Z="#64748b",ft="#e2e8f0",dt=ut>0?"#3b82f6":"#cbd5e1");const Kt=(V.elementName||V.name||V.element||V.id||"—").toUpperCase(),ee=V.gridLocation||V.grid||V.location||"—";return`
              <tr>
                <td style="font-weight: 800; color: #0f172a;">${Kt}</td>
                <td style="font-family: monospace; color: #475569;">${ee}</td>
                <td style="font-family: monospace; font-weight: 600;">${xt.toFixed(2)}</td>
                <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${mt.toFixed(2)}</td>
                <td>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                    <div style="flex: 1; height: 7px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
                      <div style="width: ${ut}%; height: 100%; background: ${dt}; border-radius: 999px;"></div>
                    </div>
                    <span style="font-size: 7px; font-weight: 800; font-family: monospace; min-width: 24px; text-align: right;">${ut}%</span>
                    <span style="background: ${X}; color: ${Z}; border: 1px solid ${ft}; border-radius: 4px; padding: 1.5px 7px; font-weight: 800; font-size: 7px; text-transform: uppercase; white-space: nowrap; display: inline-block;">${te}</span>
                  </div>
                </td>
              </tr>
            `}).join(""),it=M>0?Math.round(U/M*100):0;A.push(`
          <div class="pdf-sheet">
            <div>
              ${H(G)}
              
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
                  ${q?`
                    <tr style="background: #f1f5f9; font-weight: 900; border-top: 1.5px solid #cbd5e1;">
                      <td colspan="2" style="font-size: 7.5px; color: #0f172a; text-transform: uppercase;">
                        TOTAL ${i.toUpperCase()}
                      </td>
                      <td style="font-family: monospace; font-size: 7.5px;">${M.toFixed(2)}</td>
                      <td style="font-family: monospace; font-size: 7.5px; color: #0f172a;">${U.toFixed(2)}</td>
                      <td style="font-size: 7.5px; color: #0f172a; font-weight: 900;">
                        ${it}% COMPLETION
                      </td>
                    </tr>
                  `:""}
                </tbody>
              </table>
            </div>
            ${Q(A.length+1)}
          </div>
        `)}}I&&typeof I=="string"&&I.trim().length>0&&A.push(`
        <div class="pdf-sheet">
          <div>
            ${H(C||`${i.toUpperCase()} LAYOUT &amp; INSPECTION`)}
            
            <div style="height: 154mm; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; position: relative; margin-top: 6px;">
              <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 6px; overflow: hidden; background: #ffffff;">
                <img src="${I}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="${C}" />
              </div>

              <!-- Integrated Spatial Blueprint Legend -->
              <div style="background: #f8fafc; border-top: 1.5px solid #e2e8f0; padding: 6px 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="display: inline-block; background: #0284c7; color: #ffffff; font-size: 7.5px; font-weight: 900; padding: 2px 7px; border-radius: 3px; letter-spacing: 0.5px; text-transform: uppercase;">
                    SPATIAL LEGEND
                  </span>
                  <span style="font-size: 7.5px; font-weight: 700; color: #475569; text-transform: uppercase;">
                    ${i.toUpperCase()} SURVEILLANCE KEY:
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
                  ${C||`${i.toUpperCase()} LAYOUT`} &nbsp;|&nbsp; VERIFIED AS-BUILT SURVEILLANCE OVERLAY
                </span>
                <span style="color: #4ade80; font-weight: 800;">&#10003; QC CLEARANCE COMPLETE</span>
              </div>
            </div>
          </div>
          ${Q(A.length+1)}
        </div>
      `)}if(It("Columns","Column",Mt,Lt,"COLUMNS LAYOUT & CASTING INSPECTION"),It("Beams","Beam",zt,_t,"BEAMS LAYOUT & REINFORCEMENT INSPECTION"),It("Slabs","Slab",Ut,kt,"SLABS LAYOUT & CONCRETING INSPECTION",!1),et.length===0)A.push(`
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
        ${Q(A.length+1)}
      </div>
    `);else{const e=Math.ceil(et.length/14);for(let r=0;r<e;r++){const I=et.slice(r*14,(r+1)*14),C=e>1?`MEP QA/QC CLEARANCE STATUS — PRE-CASTING (PART ${r+1} OF ${e})`:"MEP QA/QC CLEARANCE STATUS — PRE-CASTING",D=I.map((o,k)=>{const M=r*14+k+1;return`
            <tr>
              <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(M).padStart(2,"0")}</td>
              <td style="font-weight: 800; color: #0f172a;">${o.service||o.system||o.elementService||"—"}</td>
              <td>${o.subcontractor||o.trade||"—"}</td>
              <td style="font-family: monospace; font-weight: 700; text-align: center;">${o.completionPct!==void 0?o.completionPct:0}%</td>
              <td style="text-align: center;"><span class="badge-approved">${o.status||"CLEARED"}</span></td>
              <td style="font-size: 7.5px; color: #475569;">${o.remarks||"—"}</td>
            </tr>
          `}).join("");A.push(`
        <div class="pdf-sheet">
          <div>
            ${H(C)}
            
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
                ${D}
              </tbody>
            </table>
          </div>
          ${Q(A.length+1)}
        </div>
      `)}}if(W.length===0)A.push(`
      <div class="pdf-sheet">
        <div>
          ${H("MATERIAL DELIVERY LOG & TRACEABILITY")}
          
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
        ${Q(A.length+1)}
      </div>
    `);else{const e=Math.ceil(W.length/14);for(let r=0;r<e;r++){const I=W.slice(r*14,(r+1)*14),C=e>1?`MATERIAL DELIVERY LOG & TRACEABILITY (PART ${r+1} OF ${e})`:"MATERIAL DELIVERY LOG & TRACEABILITY",D=I.map((o,k)=>{const M=r*14+k+1,U=String(o.qcStatus||o.status||"APPROVED").toUpperCase(),$=U.includes("REJECT")?"#dc2626":U.includes("NOTED")?"#0284c7":"#16a34a",E=o.unit||"units",Y=o.quantityAccepted!==void 0?o.quantityAccepted:o.quantity||0,q=o.quantityRejected??0,G=o.quantityReceived??o.quantity??0;return`
            <tr>
              <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(M).padStart(2,"0")}</td>
              <td style="font-family: monospace; font-weight: 600;">${g(o.deliveryDate||o.date)||"—"}</td>
              <td style="font-weight: 800; color: #0f172a;">${o.materialDescription||o.materialName||o.name||"Material"}</td>
              <td>${o.supplier||o.supplierName||"—"}</td>
              <td style="font-family: monospace; font-weight: 700; text-align: right;">${G} <span style="font-size: 7px; color: #64748b; font-weight: normal;">${E}</span></td>
              <td style="font-family: monospace; font-weight: 800; text-align: right; color: #059669;">${Y} <span style="font-size: 7px; color: #10b981; font-weight: normal;">${E}</span></td>
              <td style="font-family: monospace; font-weight: 800; text-align: right; color: ${q>0?"#dc2626":"#94a3b8"};">${q} <span style="font-size: 7px; color: ${q>0?"#ef4444":"#cbd5e1"}; font-weight: normal;">${E}</span></td>
              <td style="text-align: center; font-weight: 800; color: ${$}; font-size: 7.5px;">${U}</td>
            </tr>
          `}).join("");A.push(`
        <div class="pdf-sheet">
          <div>
            ${H(C)}
            
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
                ${D}
              </tbody>
            </table>
          </div>
          ${Q(A.length+1)}
        </div>
      `)}}if(P)if(z.length===0)A.push(`
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
                <tr>
                  <td colspan="6" style="text-align: center; color: #166534; padding: 24px; font-weight: 800;">
                    &#10003; ZERO ACTIVE NON-CONFORMANCE REPORTS LOGGED
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          ${Q(A.length+1)}
        </div>
      `);else{const e=Math.ceil(z.length/10);for(let r=0;r<e;r++){const I=z.slice(r*10,(r+1)*10),C=e>1?`APPENDIX: NCR REGISTER (PART ${r+1} OF ${e})`:"APPENDIX: NCR REGISTER",D=I.map(o=>{const k=String(o.status||"OPEN").toUpperCase(),M=k==="CLOSED"||k==="RECTIFIED"||k==="RESOLVED",U=Array.isArray(o.descriptionItems)?o.descriptionItems.join(", "):o.description||"Field variance logged";return`
              <tr>
                <td style="font-family: monospace; font-weight: 800; color: #0f172a;">${o.refNo||o.ncrNumber||"NCR"}</td>
                <td style="font-weight: 700;">${o.elementLevel||o.location||"Structural Component"}</td>
                <td style="font-size: 7.5px; line-height: 1.4; color: #334155;">${U}</td>
                <td style="font-family: monospace; font-weight: 600;">${g(o.dateIdentified||o.dateFound||o.createdAt)}</td>
                <td style="font-family: monospace; font-weight: 600;">${g(o.targetFixDate||o.signDate||l)}</td>
                <td style="text-align: center; font-weight: 900; color: ${M?"#16a34a":"#dc2626"}; font-size: 7.5px;">${M?"CLOSED":"OPEN"}</td>
              </tr>
            `}).join("");A.push(`
          <div class="pdf-sheet">
            <div>
              ${H(C)}
              
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
                  ${D}
                </tbody>
              </table>
            </div>
            ${Q(A.length+1)}
          </div>
        `)}}if(O){const i=at.length,e=at.filter(C=>{const D=String(C.status||"").toUpperCase();return D.includes("CLOSE")||D.includes("COMPLET")||D.includes("COMPLI")||!!C.closedAt}).length,r=at.filter(C=>{const D=String(C.status||"").toUpperCase();if(D.includes("CLOSE")||D.includes("COMPLET")||D.includes("COMPLI")||!!C.closedAt)return!1;if(D.includes("OVERDUE"))return!0;const k=C.complianceDeadline||C.dueDate||C.targetDate;if(!k)return!1;const M=new Date(k).getTime(),U=l?new Date(l).getTime():Date.now();return!isNaN(M)&&M<U}).length,I=i-e;if(at.length===0)A.push(`
        <div class="pdf-sheet">
          <div>
            ${H("APPENDIX: SITE INSTRUCTION REGISTER")}

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
          ${Q(A.length+1)}
        </div>
      `);else{const D=Math.ceil(at.length/6);for(let o=0;o<D;o++){const k=at.slice(o*6,(o+1)*6),M=D>1?`APPENDIX: SITE INSTRUCTION REGISTER (PART ${o+1} OF ${D})`:"APPENDIX: SITE INSTRUCTION REGISTER",U=k.map((E,Y)=>{var dt;const q=o*6+Y,G=String(E.status||"ISSUED").trim().toUpperCase(),nt=G.includes("CLOSE")||G.includes("COMPLET")||G.includes("COMPLI")||!!E.closedAt,it=E.complianceDeadline||E.dueDate||E.targetDate;let V=!1;if(!nt&&it){const Kt=new Date(it).getTime(),ee=l?new Date(l).getTime():Date.now();!isNaN(Kt)&&Kt<ee&&(V=!0)}G.includes("OVERDUE")&&(V=!0);let xt="ISSUED",mt="#d97706";nt?(xt="CLOSED",mt="#16a34a"):V?(xt="OVERDUE",mt="#dc2626"):G.includes("ACKNOW")||G.includes("PROGRESS")||G.includes("REVIEW")?(xt="IN PROGRESS",mt="#2563eb"):G&&(xt=G.replace(/_/g," "),mt="#d97706");const ut=E.title||E.subject||"Formal Notice of Defect Rectification",Pt=E.instructionText||E.issueSummary||E.directiveText||E.description||"",J=E.stopWorkOrdered?'<span style="display: inline-block; background: #dc2626; color: #ffffff; font-size: 6.5px; font-weight: 900; padding: 1.5px 4px; border-radius: 2px; margin-bottom: 2px; letter-spacing: 0.5px;">STOP WORK ORDERED</span><br/>':"",te=E.location||E.elementName?`<div style="font-size: 6.5px; color: #64748b; font-weight: 600; margin-top: 2px;">Zone: ${E.location||"Site"}${E.elementName?` &bull; ${E.elementName}`:""}</div>`:"",X=E.recipientName||E.assignedToName||E.recipient||"",Z=E.contractorName||E.subcontractorCompany||E.subcontractor||E.contractor||"",ft=X&&Z&&X!==Z?`<div style="font-weight: 700; color: #0f172a;">${X}</div><div style="font-size: 6.5px; color: #64748b; text-transform: uppercase;">${Z}</div>`:`<div style="font-weight: 700; color: #0f172a; text-transform: uppercase;">${X||Z||"Main Contractor"}</div>`;return`
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="font-family: monospace; font-weight: 800; color: #0f172a; vertical-align: top; padding: 5px 6px;">
                  ${E.instructionNumber||E.siNumber||E.id||`SI-${String(q+1).padStart(3,"0")}`}
                </td>
                <td style="vertical-align: top; padding: 5px 6px;">
                  ${J}
                  <div style="font-weight: 700; font-size: 7.5px; color: #0f172a; line-height: 1.35;">${ut}</div>
                  ${Pt?`<div style="font-size: 7px; color: #475569; margin-top: 2px; line-height: 1.35; white-space: pre-line;">${Pt}</div>`:""}
                  ${te}
                </td>
                <td style="font-size: 7.5px; vertical-align: top; padding: 5px 6px;">
                  ${ft}
                  ${E.recipientRole?`<div style="font-size: 6.5px; color: #94a3b8;">${E.recipientRole}</div>`:""}
                </td>
                <td style="font-family: monospace; font-weight: 600; text-align: center; vertical-align: top; padding: 5px 6px; font-size: 7px;">
                  ${g(E.issuedDate||E.date||E.createdAt||((dt=E.signedBy)==null?void 0:dt.signedAt))||"—"}
                </td>
                <td style="font-family: monospace; font-weight: 600; text-align: center; vertical-align: top; padding: 5px 6px; font-size: 7px;">
                  ${g(it)||"Immediate"}
                </td>
                <td style="text-align: center; font-weight: 900; color: ${mt}; font-size: 7.5px; vertical-align: top; padding: 5px 6px; text-transform: uppercase;">
                  ${xt}
                </td>
              </tr>
            `}).join(""),$=o===0?`
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 8px; margin-bottom: 8px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px;">
              <div style="font-size: 7px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Total Directives</div>
              <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-top: 1px;">${i}</div>
            </div>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 6px 10px;">
              <div style="font-size: 7px; font-weight: 800; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.5px;">Overdue Directives</div>
              <div style="font-size: 13px; font-weight: 900; color: #dc2626; margin-top: 1px;">${r}</div>
            </div>
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 6px 10px;">
              <div style="font-size: 7px; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px;">Open / In Progress</div>
              <div style="font-size: 13px; font-weight: 900; color: #d97706; margin-top: 1px;">${I}</div>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 6px 10px;">
              <div style="font-size: 7px; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px;">Closed &amp; Complied</div>
              <div style="font-size: 13px; font-weight: 900; color: #16a34a; margin-top: 1px;">${e}</div>
            </div>
          </div>
        `:"";A.push(`
          <div class="pdf-sheet">
            <div>
              ${H(M)}
              ${$}
              
              <table class="data-table" style="margin-top: ${o===0?"4px":"8px"};">
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
                  ${U}
                </tbody>
              </table>
            </div>
            ${Q(A.length+1)}
          </div>
        `)}}}if(w)if(lt.length===0)A.push(`
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
                <tr>
                  <td colspan="7" style="text-align: center; color: #64748b; padding: 24px;">
                    Zero outstanding quality observations recorded for this surveillance cycle.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          ${Q(A.length+1)}
        </div>
      `);else{const e=Math.ceil(lt.length/12);for(let r=0;r<e;r++){const I=lt.slice(r*12,(r+1)*12),C=e>1?`APPENDIX: SITE COMMENTS / OBSERVATION LOG (PART ${r+1} OF ${e})`:"APPENDIX: SITE COMMENTS / OBSERVATION LOG",D=I.map((o,k)=>{const M=r*12+k+1,U=String(o.status||"Non-Compliant").trim(),$=U.toLowerCase().replace(/[\s-]+/g,"_"),E=$.includes("non_comp")||$.includes("noncomp")||$.includes("defect")||$.includes("fail")||$.includes("reject")||$==="open",Y=$.includes("rectif")||$.includes("fixed")||$.includes("closed")||$.includes("pass")||$.includes("approv")||$.includes("comp")&&!E,q=$.includes("pend")||$.includes("prog")||$.includes("review")||$.includes("action"),G=E?"#dc2626":Y?"#16a34a":q?"#d97706":"#dc2626";return`
              <tr>
                <td style="font-weight: 700; font-family: monospace; text-align: center;">${String(M).padStart(2,"0")}</td>
                <td style="font-family: monospace; font-weight: 600;">${g(o.date||o.createdAt)||"—"}</td>
                <td>${o.level||st}${o.location?` &bull; ${o.location}`:""}</td>
                <td style="font-weight: 700;">${o.element||"—"}</td>
                <td style="font-size: 7.5px; line-height: 1.4; color: #334155; white-space: pre-line;">${(o.comments||o.text||"—").replace(/<br\s*\/?>/gi,`
`)}</td>
                <td>${o.inspector||R}${o.vendorCheck?` / ${o.vendorCheck}`:""}</td>
                <td style="text-align: center; font-weight: 800; color: ${G}; font-size: 7.5px;">${U}</td>
              </tr>
            `}).join("");A.push(`
          <div class="pdf-sheet">
            <div>
              ${H(C)}
              
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
                  ${D}
                </tbody>
              </table>
            </div>
            ${Q(A.length+1)}
          </div>
        `)}}ct.length>0&&ct.forEach((i,e)=>{const r=typeof i=="string"?i:i.url,I=typeof i=="object"&&i.caption&&i.caption.trim().length>0?i.caption:`SPECIMEN ${e+1} | AS-BUILT SITE QUALITY RECORD`;A.push(`
        <div class="pdf-sheet">
          <div>
            ${H(`PICTORIAL SURVEILLANCE RECORD (SPECIMEN ${e+1} OF ${ct.length})`)}
            
            <div style="height: 154mm; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; position: relative; margin-top: 6px;">
              <!-- Photo Viewport -->
              <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 6px; overflow: hidden; background: #ffffff;">
                <img src="${r}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 2px;" alt="${I}" />
              </div>

              <!-- Dark Caption Ribbon -->
              <div style="background: #0f172a; border-left: 5px solid #ea580c; color: #ffffff; padding: 10px 16px; font-size: 8.5px; font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
                <span style="letter-spacing: 0.3px; text-transform: uppercase;">
                  ${I}
                </span>
                <span style="color: #94a3b8; font-family: monospace; font-size: 7.5px;">
                  SPECIMEN ${e+1} / ${ct.length}
                </span>
              </div>
            </div>
          </div>
          ${Q(A.length+1)}
        </div>
      `)});const Yt=vt>0?`${vt} Holds Active / Pending Sign-off`:"All Quality Checks Conforming & Approved";t.synopsis||t.executiveSummary,A.push(`
    <div class="pdf-sheet" style="padding: 0; display: flex; flex-direction: row; height: 210mm; overflow: hidden; position: relative;">
      <!-- Left Dark Emerald Panel (~30% width) -->
      <div style="width: 30%; background: #091a18; color: #ffffff; padding: 28mm 12mm 16mm 14mm; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <!-- Company Brand -->
          <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: flex-end; gap: 2px; margin-bottom: 6px; justify-content: center;">
              ${u?`<img src="${u}" style="max-height: 150px; max-width: 200px; object-fit: contain;" alt="${x}" />`:`
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
              DOC-ID: ${y}
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
              <p style="font-weight: 700; color: #1e293b; margin: 0;">${n} – ${s}</p>
            </div>
            <div>
              <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Structure Level</p>
              <p style="font-weight: 700; color: #1e293b; margin: 0;">${st}</p>
            </div>
            <div>
              <p style="font-size: 6.8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 2px 0;">Inspection Status</p>
              <p style="font-weight: 700; color: ${vt>0?"#dc2626":"#16a34a"}; margin: 0;">${Yt}</p>
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
                  ${R}
                </h4>
                <p style="font-size: 8px; font-weight: 800; color: #047857; text-transform: uppercase; margin: 0;">
                  ${L}
                </p>
              </div>
              
              <!-- Stamp / Verification Badge Indicator -->
              <div style="display: flex; align-items: center; gap: 8px;">
                ${B?`<img src="${B}" style="max-height: 38px; max-width: 100px; object-fit: contain;" alt="Signature" />`:""}
                <div style="width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgba(5, 150, 105, 0.4); display: flex; align-items: center; justify-content: center; font-size: 7px; font-weight: 900; color: #065f46; text-transform: uppercase; text-align: center; line-height: 1.15; background: #ecfdf5;">
                  VERIFIED<br />QA/QC
                </div>
              </div>
            </div>

            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b;">
              <span>Email: <strong style="color: #334155; font-weight: 700;">${F}</strong></span>
              <span>Issued: <strong style="color: #334155; font-weight: 700;">${g(l)}</strong></span>
            </div>
          </div>

          <!-- Legal Footer -->
          <div style="padding-top: 8px; margin-top: 8px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; font-size: 7px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">
            <span>CONFIDENTIAL | PREPARED FOR CLIENT &amp; SUPERVISING CONSULTANT</span>
            <span>PAGE ${A.length+1} OF ${A.length+1}</span>
          </div>
        </div>

      </div>
    </div>
  `);const Wt=`
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
      background: ${T.ruleColor};
    }

    .pdf-footer {
      padding-top: 5px;
      border-top: 1px solid ${T.cardBorder};
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pdf-slide-badge {
      background: ${T.badgeBg};
      color: ${T.badgeTextColor};
      font-size: 7.5px;
      font-weight: 800;
      padding: 2.5px 10px;
      border-radius: ${T.cardRadius};
      border: 1px solid ${T.badgeBorder};
      letter-spacing: 0.5px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5px;
      font-family: ${T.fontFamily} !important;
    }

    .data-table th {
      background: ${T.tableHeaderBg} !important;
      color: ${T.tableHeaderTextColor} !important;
      font-weight: 800;
      font-size: 7.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 6px 8px;
      border: 1px solid ${T.tableHeaderBg};
      text-align: left;
    }

    .data-table td {
      padding: 4.5px 8px;
      border: 1px solid #f1f5f9;
      border-bottom: 1px solid ${T.tableBorderColor};
      vertical-align: middle;
    }

    .data-table tr:nth-child(even) td {
      background: ${T.tableZebraBg};
    }

    .badge-approved {
      background: ${T.badgeApprovedBg} !important;
      color: ${T.badgeApprovedColor} !important;
      border: 1px solid ${T.badgeApprovedBorder};
      border-radius: ${T.cardRadius};
      padding: 1.5px 7px;
      font-weight: 800;
      font-size: 7px;
      text-transform: uppercase;
      display: inline-block;
    }

    .badge-rejected {
      background: ${T.badgeRejectedBg} !important;
      color: ${T.badgeRejectedColor} !important;
      border: 1px solid ${T.badgeRejectedBorder};
      border-radius: ${T.cardRadius};
      padding: 1.5px 7px;
      font-weight: 800;
      font-size: 7px;
      text-transform: uppercase;
      display: inline-block;
    }

    .badge-pending {
      background: ${T.badgePendingBg} !important;
      color: ${T.badgePendingColor} !important;
      border: 1px solid ${T.badgePendingBorder};
      border-radius: ${T.cardRadius};
      padding: 1.5px 7px;
      font-weight: 800;
      font-size: 7px;
      text-transform: uppercase;
      display: inline-block;
    }
  `,qt=A.join(`
`);rt(`${y} - QA/QC Weekly Surveillance Report (Landscape Slide Deck)`,qt,Wt)}function ke(t,c="All Levels",m={},p={}){const S=p.name||"Apex Civil Engineering",b=m.name||"Site Quality Assessment",x=_(new Date),d=`CQ-REG-${c.toUpperCase().replace(/[^A-Z0-9]/g,"-")}-${Date.now().toString().slice(-6)}`,u=t.length,f=t.filter(s=>s.status==="CURING"||s.status==="PENDING").length,y=t.filter(s=>{var l,N;return s.day7Results&&s.day7Results.length>0||((N=(l=s.tests)==null?void 0:l.day7)==null?void 0:N.averageStrengthNmm2)}),P=y.filter(s=>{var L,F,B,tt;const l=((F=(L=s.day7Results)==null?void 0:L[0])==null?void 0:F.averageStrength)||((tt=(B=s.tests)==null?void 0:B.day7)==null?void 0:tt.averageStrengthNmm2)||0,N=s.target28DayStrengthNmm2||s.day28Required||30,R=s.day7Required||Math.round(N*.7*10)/10;return l>=R}).length,w=y.length>0?Math.round(P/y.length*100):100,O=t.filter(s=>{var l,N;return s.day28Results&&s.day28Results.length>0||((N=(l=s.tests)==null?void 0:l.day28)==null?void 0:N.averageStrengthNmm2)}),g=O.filter(s=>{var R,L,F,B;const l=((L=(R=s.day28Results)==null?void 0:R[0])==null?void 0:L.averageStrength)||((B=(F=s.tests)==null?void 0:F.day28)==null?void 0:B.averageStrengthNmm2)||0,N=s.target28DayStrengthNmm2||s.day28Required||30;return l>=N}).length,a=O.length>0?Math.round(g/O.length*100):100,v=t.filter(s=>s.status==="APPROVED"||s.status==="28-DAY DONE").length,h=t.filter(s=>s.status==="NCR_ISSUED"||s.status==="REJECTED"||s.ncrGenerated).length,n=`
    <!-- Header -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${ot(p,m)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">CONCRETE QUALITY & COMPRESSIVE STRENGTH REGISTER</div>
          <div class="header-title-project">PROJECT: ${b}</div>
          <div class="header-title-iso">BS EN 12390-3 / BS EN 206-1 / ASTM C39 Concrete Conformance Register</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${d}</span></div>
          <div><strong>Scope / Level:</strong> <span style="font-weight:700; color:#0f172a;">${c}</span></div>
          <div><strong>Report Date:</strong> ${x}</div>
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
          <td class="grid-value" style="width: 30%; font-weight:700; color:#0f172a;">${c}</td>
          <td class="grid-label" style="width: 20%;">TOTAL SAMPLES LOGGED:</td>
          <td class="grid-value" style="width: 30%; font-weight:800; font-size:9.5px; font-family:monospace;">${u} Specimens</td>
        </tr>
        <tr>
          <td class="grid-label">28-DAY COMPLIANCE RATE:</td>
          <td class="grid-value">
            <span style="font-weight:800; font-size:10px; color:${a>=95?"#15803d":"#b91c1c"};">${a}%</span>
            <span style="font-size:7.5px; color:#64748b; margin-left:4px;">(${g}/${O.length} tested sets compliant)</span>
          </td>
          <td class="grid-label">7-DAY EARLY STRENGTH:</td>
          <td class="grid-value">
            <span style="font-weight:800; font-size:9.5px; color:#0369a1;">${w}%</span>
            <span style="font-size:7.5px; color:#64748b; margin-left:4px;">(${P}/${y.length} tested sets compliant)</span>
          </td>
        </tr>
        <tr>
          <td class="grid-label">APPROVED CERTIFICATES:</td>
          <td class="grid-value" style="color:#15803d; font-weight:800;">${v} Fully Certified</td>
          <td class="grid-label">ACTIVE NCRS / DEFECTIVE:</td>
          <td class="grid-value" style="color:${h>0?"#b91c1c":"#15803d"}; font-weight:800;">${h} Non-Conforming</td>
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
          ${t.length>0?t.map(s=>{var K,et,W,z,lt,at,bt,ct;const l=s.target28DayStrengthNmm2||s.day28Required||30,N=s.day7Required||Math.round(l*.7*10)/10,R=((et=(K=s.day7Results)==null?void 0:K[0])==null?void 0:et.averageStrength)??((z=(W=s.tests)==null?void 0:W.day7)==null?void 0:z.averageStrengthNmm2),L=R!=null?R>=N:null,F=((at=(lt=s.day28Results)==null?void 0:lt[0])==null?void 0:at.averageStrength)??((ct=(bt=s.tests)==null?void 0:bt.day28)==null?void 0:ct.averageStrengthNmm2),B=F!=null?F>=l:null,tt=s.status==="NCR_ISSUED"||s.status==="REJECTED"||s.ncrGenerated||!!s.ncrNumber;return`
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
                <td style="font-weight: 700; font-family: monospace;">${s.concreteGrade||"C30"} (${l})</td>
                <td>${_(s.castDate)}</td>
                <td style="font-family: monospace;">${s.slumpMm||s.slumpValue||"—"} mm</td>
                <td>
                  ${R!=null?`<div style="font-family: monospace; font-weight: 800; color: ${L?"#15803d":"#b91c1c"};">${R} MPa</div>
                         <div style="font-size: 6.8px; color: ${L?"#15803d":"#b91c1c"}; font-weight: 700;">(${L?"PASS":"FAIL"} - Min ${N})</div>`:'<span style="color: #94a3b8; font-size: 7.5px;">Pending</span>'}
                </td>
                <td>
                  ${F!=null?`<div style="font-family: monospace; font-weight: 800; color: ${B?"#15803d":"#b91c1c"};">${F} MPa</div>
                         <div style="font-size: 6.8px; color: ${B?"#15803d":"#b91c1c"}; font-weight: 700;">(${B?"PASS":"FAIL"} - Min ${l})</div>`:'<span style="color: #94a3b8; font-size: 7.5px;">In Curing</span>'}
                </td>
                <td>
                  ${tt?`<span class="badge-fail">NCR: ${s.ncrNumber||"ISSUED"}</span>`:s.status==="APPROVED"||B?'<span class="badge-pass">APPROVED</span>':`<span class="badge-pending">${s.status||"IN PROGRESS"}</span>`}
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
              <span>Date: ${x}</span>
            </div>
          </td>
          <td style="width: 33.3%;">
            <div class="sig-role-header"><span>QA/QC MANAGER</span><span class="sig-required-tag">APPROVED</span></div>
            <div style="font-size: 8px; color: #334155;">Name: <strong>QA/QC Manager</strong></div>
            <div class="sig-line"></div>
            <div style="display: flex; justify-content: space-between; font-size: 7.5px; color: #64748b; margin-top: 3px;">
              <span>Sign: ___________________</span>
              <span>Date: ${x}</span>
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
      <div>Report Ref: ${d} • Filter: ${c}</div>
    </div>
  `;rt(`${d} - Concrete Quality Register (${c})`,n)}function Me(t,c,m){var w,O,g,a,v,h,n,s;const p=(m==null?void 0:m.name)||t.companyName||"JQMS Civil Infrastructure",S=(c==null?void 0:c.name)||t.projectName||"Civil Engineering Construction Project",b=(c==null?void 0:c.code)||"PRJ-001",x=t.instructionNumber||`SI-${t.id.slice(0,8).toUpperCase()}`,d=_(((w=t.signedBy)==null?void 0:w.signedAt)||t.createdAt),u=_(t.complianceDeadline),f=t.severity==="STOP_WORK"||t.severity==="CRITICAL"?"#dc2626":t.severity==="HIGH"?"#ea580c":"#2563eb",y=t.severity==="STOP_WORK"?"INTERNAL WORK HOLD DIRECTIVE":t.severity==="CRITICAL"?"CRITICAL INTERNAL QUALITY DIRECTIVE":t.severity==="HIGH"?"HIGH PRIORITY RECTIFICATION NOTICE":"STANDARD QUALITY DIRECTIVE",P=`
    <!-- ═══ DOCUMENT HEADER ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${ot(m,c)}
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
          <div style="margin-bottom: 2px;">Doc Ref: <strong style="font-family: monospace; font-size: 8.5px; color: #0f172a;">${x}</strong></div>
          <div style="margin-bottom: 2px;">Issue Date: <strong>${d}</strong></div>
          <div style="margin-bottom: 2px;">Target Rectification: <strong style="color: #dc2626;">${u}</strong></div>
          <div>Status: <span style="background: #e0f2fe; color: #0369a1; font-weight: 800; padding: 1px 4px; border-radius: 2px; font-size: 7px;">${t.status||"ISSUED"}</span></div>
        </td>
      </tr>
    </table>

    <!-- ═══ INTERNAL SEVERITY BANNER ═══ -->
    <div style="background: ${f}; color: #ffffff; padding: 5px 10px; border-radius: 4px; font-weight: 800; font-size: 9px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; letter-spacing: 0.5px;">
      <span>⚠️ NOTICE CATEGORY: ${y}</span>
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
          <td class="meta-value"><strong>${_(t.ncrDeadline)}</strong></td>
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
          ${t.mandatoryActions&&t.mandatoryActions.length>0?t.mandatoryActions.map((l,N)=>`
                <tr>
                  <td style="text-align: center; font-weight: 800; color: #ea580c;">${N+1}.0</td>
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
                <div>Full Name: <strong>${((O=t.signedBy)==null?void 0:O.name.toUpperCase())||"Authorized Quality Authority"}</strong></div>
                <div>Designation: <strong>${((g=t.signedBy)==null?void 0:g.designation)||((a=t.signedBy)==null?void 0:a.role)||"QA/QC Lead Engineer"}</strong></div>
                <div style="font-size: 7.5px; color: #64748b; font-style: italic; margin-top: 4px;">
                  "${((v=t.signedBy)==null?void 0:v.declaration)||"Issued in accordance with company internal quality control standards."}"
                </div>
              </div>

              <div style="text-align: center; min-width: 170px; padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; background: #ffffff;">
                <div style="font-size: 7px; font-weight: 800; color: #0284c7; text-transform: uppercase; margin-bottom: 2px;">
                  Digital Signature
                </div>
                ${(h=t.signedBy)!=null&&h.signatureUrl?`<img src="${t.signedBy.signatureUrl}" style="max-height: 44px; max-width: 150px; object-fit: contain; margin: 0 auto;" alt="Signature" />`:`<div style="height: 36px; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 10px; font-weight: bold; color: #0284c7;">${((n=t.signedBy)==null?void 0:n.name)||"ELECTRONICALLY SIGNED"}</div>`}
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
      <div>INTERNAL QUALITY DIRECTIVE — ${p}</div>
      <div>Document Ref: ${x} </div>
    </div>
  `;rt(`${x} - Internal Site Instruction`,P)}function ze(t,c={},m={}){var y,P,w,O,g,a,v,h,n,s;const p=m.name||"JQMS ENTERPRISE QUALITY MANAGEMENT",S=c.name||t.projectName||"CONSTRUCTION PROJECT",b=c.code||"PRJ",x=t.mirNumber||"MIR-DRAFT",d=l=>{switch(l){case"ACCEPTED":return'<span style="display:inline-block; padding: 3px 10px; background: #dcfce7; color: #15803d; border: 1.5px solid #86efac; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">ACCEPTED / APPROVED</span>';case"ACCEPTED_AS_NOTED":return'<span style="display:inline-block; padding: 3px 10px; background: #dbeafe; color: #1d4ed8; border: 1.5px solid #93c5fd; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">ACCEPTED AS NOTED</span>';case"REJECTED":return'<span style="display:inline-block; padding: 3px 10px; background: #fee2e2; color: #b91c1c; border: 1.5px solid #fca5a5; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">REJECTED / NON-COMPLIANT</span>';case"HOLD_FOR_TESTING":return'<span style="display:inline-block; padding: 3px 10px; background: #fef3c7; color: #b45309; border: 1.5px solid #fcd34d; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">HOLD FOR LAB TESTING</span>';default:return'<span style="display:inline-block; padding: 3px 10px; background: #f1f5f9; color: #475569; border: 1.5px solid #cbd5e1; border-radius: 4px; font-weight: 800; font-size: 9px; text-transform: uppercase;">PENDING INSPECTION</span>'}},u=t.items&&t.items.length>0?t.items.map((l,N)=>`
        <tr>
          <td style="text-align: center; font-weight: bold; width: 30px;">${N+1}</td>
          <td style="font-weight: 600; color: #0f172a;">${l.description||"Material Item"}</td>
          <td style="font-size: 7.5px; color: #475569;">${l.specificationRef||"—"}</td>
          <td style="text-align: right; font-weight: bold;">${l.quantityDelivered}</td>
          <td style="text-align: right;">${l.quantityInspected}</td>
          <td style="text-align: right; color: #15803d; font-weight: bold;">${l.quantityAccepted}</td>
          <td style="text-align: right; color: ${l.quantityRejected>0?"#b91c1c":"#64748b"}; font-weight: bold;">${l.quantityRejected}</td>
          <td style="text-align: center; text-transform: uppercase; font-size: 7.5px;">${l.unit||"units"}</td>
          <td style="font-size: 7.5px; color: #475569;">${l.remarks||"—"}</td>
        </tr>
      `).join(""):'<tr><td colspan="9" style="text-align:center; padding: 12px; color: #64748b;">No individual line items registered. Full delivery inspected as described.</td></tr>',f=`
    <!-- ═══ 1.0 HEADER TABLE ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${ot(m,c)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">MATERIAL INSPECTION REPORT (MIR)</div>
          <div class="header-title-project">${S} (${b})</div>
          <div class="header-title-iso">ISO 9001:2015 CLAUSE 8.4 — RECEIVING INSPECTION & VERIFICATION</div>
        </td>
        <td class="header-meta-cell">
          <div class="header-meta-row">
            <span class="header-meta-label">MIR NO:</span>
            <span class="header-meta-val" style="color: #ea580c; font-weight: 900;">${x}</span>
          </div>
          <div class="header-meta-row">
            <span class="header-meta-label">DISCIPLINE:</span>
            <span class="header-meta-val">${t.discipline||"Civil & Structural"}</span>
          </div>
          <div class="header-meta-row">
            <span class="header-meta-label">INSP DATE:</span>
            <span class="header-meta-val">${_(t.inspectionDate)}</span>
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
          <td>${_(t.deliveryDate)}</td>
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
          ${Xt(t.inspectionNotes,"Materials visually checked and verified compliant with delivery waybill and approved submittal specification.")}
        </div>
        ${t.rejectionReasons?`
        <div style="margin-top: 4px;">
          <div style="font-size: 7.5px; font-weight: 800; color: #b91c1c; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Defects, Non-Conformances & Technical Justifications:</div>
          ${Xt(t.rejectionReasons)}
        </div>
        `:""}
        ${t.actionRequired?`
        <div style="margin-top: 4px;">
          <div style="font-size: 7.5px; font-weight: 800; color: #d97706; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Mandatory Action & Quarantine Requirements:</div>
          ${Xt(t.actionRequired)}
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
                ${d(((y=t.qaqcSignOff)==null?void 0:y.verdict)||((P=t.consultantSignOff)==null?void 0:P.verdict)||t.disposition)}
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 2.2fr; gap: 12px; font-size: 8px; line-height: 1.6; color: #1e293b; margin-bottom: 6px;">
              <div style="border-right: 1px dashed #fed7aa; padding-right: 10px;">
                <div>QA/QC Engineer: <strong>${((w=t.qaqcSignOff)==null?void 0:w.name)||((O=t.consultantSignOff)==null?void 0:O.name)||((g=t.inspectedBy)==null?void 0:g.name)||"QA/QC Engineer"}</strong></div>
                <div>Designation: <strong>${((a=t.qaqcSignOff)==null?void 0:a.designation)||"QA/QC Engineer"}</strong></div>
                <div>Date of Endorsement: <strong>${_(((v=t.qaqcSignOff)==null?void 0:v.date)||((h=t.consultantSignOff)==null?void 0:h.date)||t.inspectionDate)}</strong></div>
                <div style="margin-top: 4px; color: #15803d; font-weight: bold; font-size: 7.5px;">
                  ✓ Electronically Authenticated Endorsement
                </div>
              </div>
              <div>
                <div style="font-weight: 800; color: #9a3412; font-size: 7.5px; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.3px;">Official QA/QC Commentary, Directives & Liability Disclaimers:</div>
                ${Xt(((n=t.qaqcSignOff)==null?void 0:n.comments)||((s=t.consultantSignOff)==null?void 0:s.comments),"Materials inspected at site receiving laydown. Verified compliant with approved submittal & material specifications.")}
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
    ${(()=>{var R,L,F,B,tt,K,et;const l=t.stakeholders&&t.stakeholders.length>0?t.stakeholders:[{role:"Contractor Quality Representative",name:((R=t.contractorSignOff)==null?void 0:R.name)||((L=t.inspectedBy)==null?void 0:L.name)||"Contractor Quality Representative",designation:"Site QA/QC Inspector",required:!0,signed:!!((F=t.contractorSignOff)!=null&&F.signed||(B=t.inspectedBy)!=null&&B.date),signedAt:((tt=t.contractorSignOff)==null?void 0:tt.date)||((K=t.inspectedBy)==null?void 0:K.date)||t.inspectionDate},...(et=t.consultantSignOff)!=null&&et.signed?[{role:"Supervising Consultant / Resident Engineer",name:t.consultantSignOff.name,designation:"Resident Engineer",required:!1,signed:!0,signedAt:t.consultantSignOff.date}]:[]];if(l.length===0)return"";const N=[];for(let W=0;W<l.length;W+=2)N.push(l.slice(W,W+2));return`
      <div class="pdf-section">
        <div class="section-banner">6.0 STATUTORY STAKEHOLDER SIGN-OFF AUTHORIZATIONS</div>
        <table class="signoff-table">
          ${N.map(W=>`
            <tr>
              ${W.map(z=>`
                <td style="width: 50%; padding: 8px 12px; vertical-align: top; background: ${z.signed?"#f0fdf4":"#ffffff"};">
                  <div class="sig-role-header">
                    <span>${z.role}</span>
                    <span class="sig-required-tag" style="${z.signed?"background: #dcfce7; color: #166534; border-color: #86efac;":z.required?"background: #fee2e2; color: #991b1b; border-color: #fca5a5;":"background: #f1f5f9; color: #475569; border-color: #cbd5e1;"}">
                      ${z.signed?"VERIFIED & SIGNED":z.required?"REQUIRED":"OPTIONAL"}
                    </span>
                  </div>
                  <div style="font-size: 8px; line-height: 1.5; color: #1e293b; margin-top: 4px;">
                    <div>Name: <strong>${z.name||"— (Pending Signature)"}</strong></div>
                    <div>Designation: <strong>${z.designation||z.role}</strong></div>
                    <div>Date: <strong>${z.signedAt?_(z.signedAt):z.signed?_(t.inspectionDate):"—"}</strong></div>
                  </div>
                  <div style="margin-top: 14px; border-top: 1px dashed #94a3b8; padding-top: 4px; font-size: 7px; color: #64748b; text-align: center;">
                    ${z.signed?`Electronically Authenticated • ${z.name}`:`Signature & Stamp (${z.role})`}
                  </div>
                </td>
              `).join("")}
              ${W.length===1?'<td style="width: 50%; background: #f8fafc; border: 1px solid #cbd5e1;"></td>':""}
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
        ${t.photos.map((l,N)=>`
          <div class="photo-card" style="width: 48%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; text-align: center; background: #f8fafc; page-break-inside: avoid; break-inside: avoid; margin-bottom: 6px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #ea580c; text-align: left; margin-bottom: 4px; display: flex; justify-content: space-between;">
              <span>PHOTO #${N+1} — DELIVERY EVIDENCE</span>
              <span style="color: #64748b; font-size: 7px;">${x}</span>
            </div>
            <div style="height: 160px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
              <img src="${l}" alt="Inspection Evidence #${N+1}" style="max-height: 160px; max-width: 100%; object-fit: contain;" />
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
      <div>Document Ref: ${x}</div>
    </div>
  `;rt(`${x} - Material Inspection Report (${t.title})`,f)}function Ue(t,c={},m={}){var O,g,a,v,h,n,s,l,N,R,L,F,B,tt,K,et,W,z,lt,at,bt,ct,_t,Lt,kt,pt,Mt,zt,Ut,st,gt,ht,Ft,vt,Bt,Gt,T,Vt,H,Q,A,St,Rt,Et,j,Tt,Ht,Zt,Ct,Qt,jt,It,Yt,Wt,qt,At,Nt,$t,wt,Ot,Dt,i;const p=m.name||"JQMS ENTERPRISE QUALITY MANAGEMENT",S=c.name||t.projectName||"CONSTRUCTION PROJECT",b=c.code||t.projectCode||"PRJ",x=t.logNumber||`DSL-${b}-${((O=t.generalConditions)==null?void 0:O.date)||"TODAY"}`,d=t.generalConditions||{date:new Date().toISOString().slice(0,10),shift:"DAY",weather:"CLEAR",workHoursStart:"07:00",workHoursEnd:"17:00",totalHours:10},u=(t.manpower||[]).reduce((e,r)=>e+(Number(r.headCount)||0),0),f=(t.manpower||[]).reduce((e,r)=>e+(Number(r.totalManHours)||(Number(r.headCount)||0)*(Number(r.hoursWorked)||d.totalHours||8)),0),y=e=>{switch(e){case"SUNNY":return"☀️ Sunny";case"CLEAR":return"🌤️ Clear Sky";case"OVERCAST":return"☁️ Overcast / Cloudy";case"RAIN":return"🌧️ Rainy";case"HEAVY_RAIN":return"⛈️ Heavy Rain / Downpour";case"STORMY":return"🌩️ Stormy / High Winds";case"EXTREME_HEAT":return"🔥 Extreme Heat / High Temp";case"WINDY":return"💨 High Winds / Dust";default:return"🌤️ Normal Site Conditions"}},P=e=>{switch(e){case"APPROVED":return'<span style="padding: 2px 8px; background: #dcfce7; color: #15803d; border: 1px solid #86efac; border-radius: 3px; font-weight: 800; font-size: 8px;">APPROVED</span>';case"SUBMITTED":case"UNDER_REVIEW":return'<span style="padding: 2px 8px; background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; border-radius: 3px; font-weight: 800; font-size: 8px;">UNDER REVIEW</span>';case"REJECTED":return'<span style="padding: 2px 8px; background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; border-radius: 3px; font-weight: 800; font-size: 8px;">REVISION REQUIRED</span>';default:return'<span style="padding: 2px 8px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 3px; font-weight: 800; font-size: 8px;">DRAFT RECORD</span>'}},w=`
    <!-- ═══ HEADER BLOCK ═══ -->
    <table class="doc-header-table">
      <tr>
        <td class="header-brand-cell">
          ${ot(m,c)}
        </td>
        <td class="header-title-cell">
          <div class="header-title-main">DAILY SITE LOG & STATUTORY DIARY</div>
          <div class="header-title-project">PROJECT: ${S} (${b})</div>
          <div class="header-title-iso">ISO 9001:2015 Clause 8.5.1 Operations & Site Quality Records</div>
        </td>
        <td class="header-meta-cell">
          <div><strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:800;">${x}</span></div>
          <div><strong>Log Date:</strong> ${d.date}</div>
          <div><strong>Shift:</strong> ${d.shift||"DAY SHIFT"}</div>
          <div><strong>Status:</strong> ${P(t.status)}</div>
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
          <td class="meta-value" style="font-weight: 700;">${y(d.weather)}</td>
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
        <span style="font-size: 7.5px; text-transform: none; color: #cbd5e1;">TOTAL PERSONNEL: <strong>${u}</strong> &bull; MAN-HOURS: <strong>${f.toFixed(1)} hrs</strong></span>
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
          ${t.manpower&&t.manpower.length>0?t.manpower.map((e,r)=>{const I=Number(e.hoursWorked)||d.totalHours||8,C=Number(e.headCount)||0,D=Number(e.totalManHours)||C*I;return`
              <tr>
                <td style="font-weight: 700; color: #0f172a;">${e.tradeName}</td>
                <td style="font-size: 7.5px; color: #64748b;">${e.tradeCategory||"Direct Execution"}</td>
                <td>${e.companyOrSubcontractor||"Direct Labor"}</td>
                <td style="text-align: center; font-weight: 800; color: #0284c7;">${C}</td>
                <td style="text-align: center;">${I}</td>
                <td style="text-align: center; font-weight: 700;">${D.toFixed(1)}</td>
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
      ${(a=t.quality)!=null&&a.qualityNotes||(v=t.quality)!=null&&v.ncrsRaised&&t.quality.ncrsRaised.length>0?`
      <div style="background: #fafafa; border: 1px solid #cbd5e1; border-top: none; padding: 6px 10px; font-size: 7.5px; color: #334155;">
        ${(h=t.quality)!=null&&h.ncrsRaised&&t.quality.ncrsRaised.length>0?`<div><strong>NCRs Raised / Monitored:</strong> <span style="color: #dc2626; font-weight: 700;">${t.quality.ncrsRaised.join(", ")}</span></div>`:""}
        ${(n=t.quality)!=null&&n.qualityNotes?`<div style="margin-top: 2px;"><strong>QA/QC Notes:</strong> ${t.quality.qualityNotes}</div>`:""}
      </div>
      `:""}
    </div>

    <!-- ═══ 6.0 MATERIALS LOGISTICS & CONCRETE POURS ═══ -->
    ${(s=t.materials)!=null&&s.deliveries&&t.materials.deliveries.length>0||(l=t.materials)!=null&&l.concretePours&&t.materials.concretePours.length>0?`
    <div class="pdf-section">
      <div class="section-banner">6.0 MATERIALS LOGISTICS, DELIVERIES & CONCRETE POURS</div>
      ${(N=t.materials)!=null&&N.concretePours&&t.materials.concretePours.length>0?`
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
            ${((L=t.hse)==null?void 0:L.toolboxTalkTopic)||"Daily Morning Safety & PPE Briefing"}
          </td>
          <td class="meta-label" style="width: 18%;">TBT ATTENDANCE:</td>
          <td class="meta-value" style="width: 16%; font-weight: 800; color: #0284c7;">
            ${((F=t.hse)==null?void 0:F.toolboxTalkAttendees)!=null?`${t.hse.toolboxTalkAttendees} Workers`:`${u} Workers`}
          </td>
        </tr>
        <tr>
          <td class="meta-label">INCIDENT RECORD:</td>
          <td class="meta-value" style="font-weight: 800; color: ${(B=t.hse)!=null&&B.incidentsReported?"#dc2626":"#15803d"};">
            ${(tt=t.hse)!=null&&tt.incidentsReported?`⚠️ ${t.hse.incidentsReported} INCIDENTS REPORTED (${t.hse.incidentDetails||""})`:"✅ ZERO (0) ACCIDENTS / LOST TIME INJURIES (LTI)"}
          </td>
          <td class="meta-label">HOUSEKEEPING:</td>
          <td class="meta-value" style="font-weight: 700;">
            ${((K=t.hse)==null?void 0:K.housekeepingRating)||"GOOD"}
          </td>
        </tr>
        ${(et=t.hse)!=null&&et.permitsToWork&&t.hse.permitsToWork.length>0?`
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
    ${t.delays&&t.delays.length>0||(W=t.consultant)!=null&&W.observations?`
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
      ${(z=t.consultant)!=null&&z.observations?`
      <div style="background: #fafafa; border: 1px solid #cbd5e1; border-top: none; padding: 6px 10px; font-size: 7.5px; color: #334155;">
        <div><strong>Consultant / Client Representative Walk Remarks:</strong> ${t.consultant.observations}</div>
        ${(lt=t.consultant)!=null&&lt.directivesIssued?`<div style="margin-top: 2px;"><strong>Directives Issued:</strong> ${t.consultant.directivesIssued}</div>`:""}
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
              Name: <strong>${((ct=(bt=(at=t.signOffs)==null?void 0:at.SITE_ENGINEER)==null?void 0:bt.signedBy)==null?void 0:ct.name)||t.createdByName||"Site Engineer"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((kt=(Lt=(_t=t.signOffs)==null?void 0:_t.SITE_ENGINEER)==null?void 0:Lt.signedBy)==null?void 0:kt.designation)||"Project Field Engineer"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(Mt=(pt=t.signOffs)==null?void 0:pt.SITE_ENGINEER)!=null&&Mt.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">DIGITALLY SIGNED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((zt=t.signOffs.SITE_ENGINEER.signedBy)==null?void 0:zt.digitalStamp)||"VERIFIED-EXECUTION"}</div>
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
              Name: <strong>${((gt=(st=(Ut=t.signOffs)==null?void 0:Ut.QAQC_ENGINEER)==null?void 0:st.signedBy)==null?void 0:gt.name)||"Pending QA/QC Certification"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((vt=(Ft=(ht=t.signOffs)==null?void 0:ht.QAQC_ENGINEER)==null?void 0:Ft.signedBy)==null?void 0:vt.designation)||"QA/QC Lead Engineer"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(Gt=(Bt=t.signOffs)==null?void 0:Bt.QAQC_ENGINEER)!=null&&Gt.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">ISO 9001 CERTIFIED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((T=t.signOffs.QAQC_ENGINEER.signedBy)==null?void 0:T.digitalStamp)||"QAQC-CERT-PASSED"}</div>
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
              Name: <strong>${((Q=(H=(Vt=t.signOffs)==null?void 0:Vt.SAFETY_OFFICER)==null?void 0:H.signedBy)==null?void 0:Q.name)||"Pending HSE Clearance"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((Rt=(St=(A=t.signOffs)==null?void 0:A.SAFETY_OFFICER)==null?void 0:St.signedBy)==null?void 0:Rt.designation)||"Site Safety Manager"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(j=(Et=t.signOffs)==null?void 0:Et.SAFETY_OFFICER)!=null&&j.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">SAFETY CLEARED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((Tt=t.signOffs.SAFETY_OFFICER.signedBy)==null?void 0:Tt.digitalStamp)||"HSE-CLEARED"}</div>
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
              Name: <strong>${((Ct=(Zt=(Ht=t.signOffs)==null?void 0:Ht.PROJECT_MANAGER)==null?void 0:Zt.signedBy)==null?void 0:Ct.name)||((It=(jt=(Qt=t.signOffs)==null?void 0:Qt.CONSULTANT)==null?void 0:jt.signedBy)==null?void 0:It.name)||"Pending Final Endorsement"}</strong>
            </div>
            <div style="font-size: 7px; color: #64748b;">
              Role: ${((qt=(Wt=(Yt=t.signOffs)==null?void 0:Yt.PROJECT_MANAGER)==null?void 0:Wt.signedBy)==null?void 0:qt.designation)||"Project Manager / Consultant"}
            </div>
            <div style="margin-top: 8px; text-align: center; border-top: 0.5px dashed #cbd5e1; padding-top: 4px;">
              ${(Nt=(At=t.signOffs)==null?void 0:At.PROJECT_MANAGER)!=null&&Nt.signed||(wt=($t=t.signOffs)==null?void 0:$t.CONSULTANT)!=null&&wt.signed?`
                <div style="font-family: monospace; font-size: 6.5px; color: #15803d; font-weight: 700;">APPROVED & ENDORSED</div>
                <div style="font-family: monospace; font-size: 6px; color: #94a3b8;">${((i=(Dt=(Ot=t.signOffs)==null?void 0:Ot.PROJECT_MANAGER)==null?void 0:Dt.signedBy)==null?void 0:i.digitalStamp)||"PM-AUTHORIZED"}</div>
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
        ${t.photos.map((e,r)=>`
          <div style="width: 48%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; text-align: center; background: #f8fafc; page-break-inside: avoid; margin-bottom: 6px;">
            <div style="font-size: 7.5px; font-weight: 800; color: #0284c7; text-align: left; margin-bottom: 3px; display: flex; justify-content: space-between;">
              <span>PHOTO #${r+1} ${e.tradeTag?`&bull; ${e.tradeTag}`:""}</span>
              <span style="color: #64748b; font-size: 7px;">${e.location||"Site"}</span>
            </div>
            <div style="height: 150px; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 3px; overflow: hidden; margin-bottom: 4px;">
              <img src="${e.url}" alt="Site Evidence #${r+1}" style="max-height: 150px; max-width: 100%; object-fit: contain;" />
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
      <div>Document Ref: ${x} &bull; Date: ${d.date}</div>
    </div>
  `;rt(`${x} - Daily Site Log (${d.date})`,w)}export{Ae as S,ie as W,Me as a,De as b,Pe as c,ze as d,we as e,Ne as f,Oe as g,$e as h,_e as i,ke as j,Le as k,Ue as l,rt as o};
