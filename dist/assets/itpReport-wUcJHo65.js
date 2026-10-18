import{E as W}from"./vendor-pdf-CqL8L5vX.js";import{a as y}from"./jspdf.plugin.autotable-Cg0p10kG.js";import{r as k}from"./index-CU_V3px1.js";function Q(e,l,o,g={}){const d=(o==null?void 0:o.name)||e.companyName||"Collection Developments LTD",h=(o==null?void 0:o.address)||e.officeAddress||"3B, Taofik Lawal, Off Awolowo Road, Ikoyi, Lagos",b=(o==null?void 0:o.phone)||e.contactPhone||"+234 (0) 16328782",s=(o==null?void 0:o.email)||e.contactEmail||"info@collection.gp",f=e.docCode||"CD-QP-001",r=e.revision||"REV. 01",n=(l==null?void 0:l.name)||e.projectName||"Standard Construction Development",T=(l==null?void 0:l.code)||"CDL-PRJ-001",u=new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}),E=e.itpNumber||"CD-ITP-001",N=g.fileName||`${E}_ITP_Matrix.pdf`,t=new W({orientation:"landscape",unit:"mm",format:"a4"}),C=297,A=210,i=10,R=C-i*2;t.setFillColor(15,23,42),t.rect(i,i,R,17,"F"),t.setFillColor(245,158,11),t.rect(i,i+16.2,R,.8,"F"),t.setFont("helvetica","bold"),t.setFontSize(11.5),t.setTextColor(255,255,255),t.text("QUALITY ASSURANCE / QUALITY CONTROL DEPARTMENT",i+4,i+6.5),t.setFont("helvetica","normal"),t.setFontSize(7),t.setTextColor(203,213,225),t.text(`Inspection & Test Plan (ITP) Matrix — ${f} Compliance (ISO 9001:2015 Clause 8.5.1)`,i+4,i+11.5),t.setFont("helvetica","bold"),t.setFontSize(8.5),t.setTextColor(255,255,255),t.text(d,C-i-4,i+5.5,{align:"right"}),t.setFont("helvetica","normal"),t.setFontSize(6.5),t.setTextColor(203,213,225),t.text(`${h} | Phone: ${b} | Email: ${s}`,C-i-4,i+10,{align:"right"}),t.text(`${f} | ${r} | Doc Ref: ${E}`,C-i-4,i+14.5,{align:"right"}),y(t,{startY:29.5,margin:{left:i,right:i},body:[[{content:"ITP TITLE:",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:e.title||"Inspection & Test Plan Matrix",styles:{fontStyle:"bold",textColor:[15,23,42]}},{content:"DISCIPLINE:",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:e.discipline||"Civil/Structural"},{content:"REVISION:",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:`${r} (${u})`}],[{content:"METHOD STATEMENT:",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:`${e.methodStatementRef||"WMS-CIV-001"} — ${e.methodStatementTitle||"Approved Construction Methodology"}`},{content:"SPECIFICATION:",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:e.specSection||"Project Technical Specifications"},{content:"STATUS:",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:e.status||"APPROVED",styles:{fontStyle:"bold",textColor:e.status==="APPROVED"?[22,163,74]:e.status==="UNDER_REVIEW"?[202,138,4]:[71,85,105]}}],[{content:"PROJECT / SITE:",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:`${n} (${T})`},{content:"PREPARED BY:",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:`${e.preparedBy||"Oladejo Jesujuwon"} (${e.preparedByTitle||"QA/QC Engineer"})`},{content:"APPROVED BY:",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:e.approvedBy||"Structural Consultant / Lead RE"}]],theme:"grid",styles:{fontSize:6.8,cellPadding:1.4,lineColor:[203,213,225],lineWidth:.2,textColor:[15,23,42]},columnStyles:{0:{cellWidth:28},1:{cellWidth:84},2:{cellWidth:26},3:{cellWidth:70},4:{cellWidth:20},5:{cellWidth:49}}});const I=(e.items||[]).map((a,D)=>{const O=a.itemNo||String(D+1);let S=[241,245,249],x=[15,23,42],p=a.controlGate||"S";return p==="H"?(S=[254,226,226],x=[220,38,38]):p==="W"?(S=[254,243,199],x=[180,83,9]):p==="R"?(S=[241,245,249],x=[71,85,105]):p==="S"&&(S=[224,242,254],x=[3,105,161]),[{content:O,styles:{halign:"center",valign:"middle",fontStyle:"bold",fontSize:7.5}},{content:a.activityStage||"—",styles:{fontStyle:"bold",textColor:[15,23,42],fontSize:7}},{content:a.itemParameter||"—",styles:{textColor:[51,65,85],fontSize:6.8}},{content:a.referenceStandard||"Project Spec",styles:{textColor:[2,132,199],fontStyle:"bold",fontSize:6.8}},{content:a.acceptanceCriteria||"Per approved specification and drawings",styles:{textColor:[15,23,42],fontSize:6.8}},{content:p,styles:{halign:"center",valign:"middle",fontStyle:"bold",fontSize:8.5,fillColor:S,textColor:x}},{content:a.responsibleParty||"QA/QC Engineer",styles:{textColor:[71,85,105],fontSize:6.8}},{content:a.verifiableRecord||"WIR / RFI",styles:{textColor:[15,23,42],fontStyle:"normal",fontSize:6.5}}]}),w=t.lastAutoTable?t.lastAutoTable.finalY+3:48;y(t,{startY:w,margin:{left:i,right:i},head:[["S/N","ACTIVITY / STAGE","INSPECTION ITEM / PARAMETER","REFERENCE STANDARD / SPEC","ACCEPTANCE CRITERIA","GATE","RESPONSIBLE / VERIFYING PARTY","CONTROLLING RECORD"]],body:I.length>0?I:[["—","No inspection items defined","—","—","—","—","—","—"]],theme:"grid",headStyles:{fillColor:[226,232,240],textColor:[15,23,42],fontStyle:"bold",fontSize:7.5,halign:"center",lineWidth:.2,lineColor:[148,163,184]},styles:{fontSize:6.8,cellPadding:1.6,lineColor:[203,213,225],lineWidth:.2,valign:"middle"},columnStyles:{0:{cellWidth:10,halign:"center"},1:{cellWidth:34,halign:"left"},2:{cellWidth:50,halign:"left"},3:{cellWidth:32,halign:"left"},4:{cellWidth:70,halign:"left"},5:{cellWidth:14,halign:"center"},6:{cellWidth:37,halign:"left"},7:{cellWidth:30,halign:"left"}}});let c=t.lastAutoTable?t.lastAutoTable.finalY+4:155;c>165&&(t.addPage(),c=15);const P=120,v=20;t.setFillColor(248,250,252),t.setDrawColor(203,213,225),t.setLineWidth(.3),t.rect(i,c,P,v,"FD"),t.setFont("helvetica","bold"),t.setFontSize(7.5),t.setTextColor(15,23,42),t.text("CONTROL GATES (CD-QP-001 SECTION 5.3.2):",i+3,c+4),t.setFont("helvetica","normal"),t.setFontSize(6.2),t.setTextColor(51,65,85),t.text("• H (Hold Point): Mandatory stoppage; work CANNOT proceed without signed clearance.",i+3,c+8),t.text("• W (Witness Point): Scheduled checkpoint; work proceeds if inspector is absent at notice time.",i+3,c+11.5),t.text("• R (Review Point): Administrative verification of test certificates, MTC, or delivery records.",i+3,c+15),t.text("• S (Surveillance): Random ongoing site monitoring and visual audits by the QA/QC team.",i+3,c+18.5);const $=i+P+4,m=R-(P+4);y(t,{startY:c,margin:{left:$},tableWidth:m,body:[[{content:`PREPARED BY (QA/QC ENGINEER):

Name:  ${e.preparedBy||"Oladejo Jesujuwon"}

Signature: __________________  Date: ${e.preparedByDate||u}`,styles:{cellPadding:2,textColor:[51,65,85],fontSize:6.2}},{content:`CHECKED BY (QUALITY MANAGER):

Name:  ${e.checkedBy||"QA/QC Manager"}

Signature: __________________  Date: ${e.checkedByDate||u}`,styles:{cellPadding:2,textColor:[51,65,85],fontSize:6.2}},{content:`APPROVED BY (STRUCTURAL CONSULTANT / RE):

Name:  ${e.approvedBy||"Resident Engineer"}

Signature: __________________  Date: ${e.approvedByDate||"____/____/20__"}`,styles:{cellPadding:2,textColor:[51,65,85],fontSize:6.2}}]],theme:"grid",styles:{fontSize:6.2,lineColor:[203,213,225],lineWidth:.2},columnStyles:{0:{cellWidth:m/3},1:{cellWidth:m/3},2:{cellWidth:m/3}}});const _=t.getNumberOfPages();for(let a=1;a<=_;a++)t.setPage(a),t.setFont("helvetica","normal"),t.setFontSize(6.5),t.setTextColor(148,163,184),t.text(`CONFIDENTIAL QUALITY MANAGEMENT RECORD — ${d} — Quality Plan Ref: ${f} — Doc Ref: ${E}`,i,A-5),t.text(`Page ${a} of ${_}`,C-i,A-5,{align:"right"});t.save(N)}function Y(e,l){const g=`${e.itpNumber||"CD-ITP-001"}_ITP_Matrix.csv`,d=["S/N","Activity / Stage","Inspection Item / Parameter","Reference Standard / Spec","Acceptance Criteria","Control Gate","Responsible / Verifying Party","Frequency","Controlling Record","Remarks"],h=(e.items||[]).map((n,T)=>[n.itemNo||String(T+1),`"${(n.activityStage||"").replace(/"/g,'""')}"`,`"${(n.itemParameter||"").replace(/"/g,'""')}"`,`"${(n.referenceStandard||"").replace(/"/g,'""')}"`,`"${(n.acceptanceCriteria||"").replace(/"/g,'""')}"`,n.controlGate||"S",`"${(n.responsibleParty||"").replace(/"/g,'""')}"`,`"${(n.frequency||"").replace(/"/g,'""')}"`,`"${(n.verifiableRecord||"").replace(/"/g,'""')}"`,`"${(n.remarks||"").replace(/"/g,'""')}"`]),b=[d.join(","),...h.map(n=>n.join(","))].join(`\r
`),s=new Blob([b],{type:"text/csv;charset=utf-8;"}),f=URL.createObjectURL(s),r=document.createElement("a");r.setAttribute("href",f),r.setAttribute("download",g),document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(f)}function L(e,l,o){o!=null&&o.name||e.companyName,o!=null&&o.address||e.officeAddress,o!=null&&o.phone||e.contactPhone,o!=null&&o.email||e.contactEmail;const g=e.docCode||"CD-QP-001",d=e.revision||"REV. 01",h=e.itpNumber||"CD-ITP-001",b=(e.items||[]).map((s,f)=>{const r=s.controlGate||"S";let n="background: #f1f5f9; color: #475569;";return r==="H"?n="background: #fee2e2; color: #dc2626; font-weight: 800;":r==="W"?n="background: #fef3c7; color: #b45309; font-weight: 800;":r==="R"?n="background: #f1f5f9; color: #475569; font-weight: 800;":r==="S"&&(n="background: #e0f2fe; color: #0369a1; font-weight: 800;"),`
        <tr>
          <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold; padding: 4px;">${s.itemNo||f+1}</td>
          <td style="border: 1px solid #cbd5e1; font-weight: bold; padding: 4px;">${s.activityStage||"—"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px;">${s.itemParameter||"—"}</td>
          <td style="border: 1px solid #cbd5e1; color: #0284c7; font-weight: bold; padding: 4px;">${s.referenceStandard||"—"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px;">${s.acceptanceCriteria||"—"}</td>
          <td style="border: 1px solid #cbd5e1; text-align: center; padding: 4px; ${n}">${r}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px;">${s.responsibleParty||"—"}</td>
          <td style="border: 1px solid #cbd5e1; padding: 4px;">${s.verifiableRecord||"WIR / RFI"}</td>
        </tr>
      `}).join("");return`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${h} - ITP Matrix</title>
      <style>
        *, *::before, *::after {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        @page { size: A4 landscape; margin: 0; }
        @media print {
          html, body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 8mm !important;
            background: #ffffff !important;
          }
        }
        body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size: 10px; color: #0f172a; margin: 0; padding: 8mm; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .doc-header { width: 100%; border: 1.5px solid #0f172a; border-collapse: collapse; margin-bottom: 8px; background: #ffffff; }
        .doc-header td { border: 1px solid #cbd5e1; padding: 6px; vertical-align: middle; }
        .header-brand { width: 22%; background: #ffffff; text-align: center; }
        .header-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #0f172a; text-align: center; }
        .header-sub { font-size: 9.5px; font-weight: 700; color: #ea580c; margin-top: 2px; text-transform: uppercase; text-align: center; }
        .header-iso { font-size: 7.5px; font-weight: 600; color: #64748b; text-transform: uppercase; text-align: center; margin-top: 1px; }
        .meta-box { width: 25%; font-size: 8px; line-height: 1.5; color: #334155; }
        .meta-table, .matrix-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 9px; }
        .meta-table td, .matrix-table td, .matrix-table th { border: 1px solid #cbd5e1; padding: 4px 6px; }
        .matrix-table th { background: #e2e8f0; font-weight: 800; text-align: center; }
        .legend { border: 1px solid #cbd5e1; background: #f8fafc; padding: 6px 10px; font-size: 8.5px; border-radius: 4px; margin-top: 8px; }
      </style>
    </head>
    <body>
      <table class="doc-header">
        <tr>
          <td class="header-brand">
            ${k(o,l)}
          </td>
          <td style="width: 53%;">
            <div class="header-title">INSPECTION & TEST PLAN (ITP) MATRIX</div>
            <div class="header-sub">PROJECT: ${(l==null?void 0:l.name)||e.projectName||"Standard Construction Development"} &bull; ${e.discipline||"Civil & Structural"}</div>
            <div class="header-iso">ISO 9001:2015 Clause 8.5.1 Control of Production & Service Provision</div>
          </td>
          <td class="meta-box">
            <strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:700;">${h}</span><br/>
            <strong>Rev No:</strong> ${d}<br/>
            <strong>Doc Code:</strong> ${g}<br/>
            <strong>Date:</strong> ${new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}
          </td>
        </tr>
      </table>

      <table class="meta-table">
        <tr>
          <td style="background: #f1f5f9; font-weight: bold; width: 15%;">DISCIPLINE:</td>
          <td style="width: 35%;">${e.discipline}</td>
          <td style="background: #f1f5f9; font-weight: bold; width: 15%;">METHOD STATEMENT:</td>
          <td style="width: 35%;">${e.methodStatementRef||"WMS-001"} — ${e.methodStatementTitle||"Approved Methodology"}</td>
        </tr>
        <tr>
          <td style="background: #f1f5f9; font-weight: bold;">SPECIFICATION:</td>
          <td>${e.specSection||"Project Specs"}</td>
          <td style="background: #f1f5f9; font-weight: bold;">PREPARED BY:</td>
          <td>${e.preparedBy} (${e.preparedByTitle||"QA/QC Engineer"})</td>
        </tr>
      </table>

      <table class="matrix-table">
        <thead>
          <tr>
            <th style="width: 30px;">S/N</th>
            <th style="width: 110px;">ACTIVITY / STAGE</th>
            <th>INSPECTION ITEM / PARAMETER</th>
            <th style="width: 110px;">REFERENCE STANDARD</th>
            <th>ACCEPTANCE CRITERIA</th>
            <th style="width: 45px;">GATE</th>
            <th style="width: 110px;">RESPONSIBLE PARTY</th>
            <th style="width: 90px;">RECORD</th>
          </tr>
        </thead>
        <tbody>
          ${b}
        </tbody>
      </table>

      <div class="legend">
        <strong>CONTROL GATES (CD-QP-001 Section 5.3.2):</strong><br/>
        <strong>[ H ] Hold Point:</strong> Mandatory quality stoppage; work cannot proceed without signed inspection clearance.<br/>
        <strong>[ W ] Witness Point:</strong> Scheduled checkpoint; work proceeds if inspector is absent at agreed notification time.<br/>
        <strong>[ R ] Review Point:</strong> Administrative verification of test certificates, MTC, or delivery records.<br/>
        <strong>[ S ] Surveillance:</strong> Random ongoing site monitoring and visual inspection by QA/QC team.
      </div>
    </body>
    </html>
  `}function G(e,l,o){const g=L(e,l,o),d=window.open("","_blank");d&&(d.document.open(),d.document.write(g),d.document.close(),setTimeout(()=>{d.focus(),d.print()},400))}export{Y as a,Q as e,G as p};
