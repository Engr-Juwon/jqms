import{E as ft}from"./vendor-pdf-CqL8L5vX.js";import{a as Z}from"./jspdf.plugin.autotable-Cg0p10kG.js";import{r as gt,J as xt,n as B,K as st}from"./index-DkJ-W63H.js";import{j as e}from"./vendor-three-h7LxBsfh.js";import{r as O}from"./vendor-react-DCR-ZuuX.js";import{$ as nt,X as ht,az as it,al as pt,aY as bt,ag as ut,aq as St}from"./vendor-icons-CHLyMjpm.js";function z(o,n=2){return(o||0).toLocaleString("en-US",{minimumFractionDigits:n,maximumFractionDigits:n})}function et(o){return Number((Math.pow(o||16,2)*.006165).toFixed(3))}function Dt(o,n,l,p={}){var lt;const g=(l==null?void 0:l.name)||"JQMS Civil Infrastructure Ltd.",c=(l==null?void 0:l.address)||"14 Bankside Boulevard, London SE1 9SG, United Kingdom",i=(l==null?void 0:l.email)||"quality@collectiondev.com",f=(l==null?void 0:l.phone)||"+44 (0) 20 7946 0912",a=(n==null?void 0:n.name)||"Civil Engineering Construction Project",d=(n==null?void 0:n.code)||"PRJ-001",x=o.scheduleNumber||`BCS-${(o.id||"00000000").slice(0,8).toUpperCase()}`,y=p.fileName||`${x}_Cutting_Schedule.pdf`,b=new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}),r=o.cuttingPatterns||[],m=o.summary,E=o.stockBarLengthM||12,P=Math.round(E*1e3),j=(m==null?void 0:m.totalStockBarsUsed)||r.reduce((S,R)=>S+(R.stockBarQuantity||0),0),D=j*E,W=o.diameterMm||(r.length>0&&r[0].diameter?r[0].diameter:16),u=et(W);let N="0.000";m!=null&&m.totalStockWeightKg&&m.totalStockWeightKg>0?N=(m.totalStockWeightKg/1e3).toFixed(3):m!=null&&m.totalCutWeightKg&&m.totalCutWeightKg>0?N=(m.totalCutWeightKg/1e3).toFixed(3):N=(D*u/1e3).toFixed(3);const I=(m==null?void 0:m.scrapPercentage)!==void 0?m.scrapPercentage:r.length>0?r.reduce((S,R)=>S+(R.wastePercentage||0),0)/r.length:0,k=(m==null?void 0:m.contractualScrapLimit)||3.5,t=new ft({orientation:"landscape",unit:"mm",format:"a4"}),h=297,T=210,s=10,w=h-s*2;t.setFillColor(15,23,42),t.rect(s,s,w,18,"F"),t.setFillColor(245,158,11),t.rect(s,s+17.2,w,.8,"F"),t.setFont("helvetica","bold"),t.setFontSize(11),t.setTextColor(255,255,255),t.text("REBAR CUTTING SCHEDULE & STOCK BAR OPTIMIZATION",s+4,s+6.5),t.setFont("helvetica","normal"),t.setFontSize(7),t.setTextColor(203,213,225),t.text("BS 8666:2020 / BS 4449 Standard — 12.0m Commercial Stock Nesting (QA/QC Steel Fabrication Order)",s+4,s+11.5),t.text(`Project: ${a} (${d})`,s+4,s+15.5),t.setFont("helvetica","bold"),t.setFontSize(8.5),t.setTextColor(255,255,255),t.text(g,h-s-4,s+5.5,{align:"right"}),t.setFont("helvetica","normal"),t.setFontSize(6.5),t.setTextColor(203,213,225),t.text(c,h-s-4,s+10,{align:"right"}),t.text(`${i} | ${f} | Doc Ref: ${x}`,h-s-4,s+14.5,{align:"right"}),Z(t,{startY:30.5,margin:{left:s,right:s},body:[[{content:"SCHEDULE REF:",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:x,styles:{fontStyle:"bold",textColor:[2,132,199]}},{content:"TITLE / SCOPE:",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:o.title||"Reinforcement Cutting Order"},{content:"DATE:",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:b}],[{content:"SOURCE BBS:",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:o.sourceBBSFileName||"BBS-Uploaded"},{content:"LOCATION / LEVEL:",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:o.levelName||"General Reinforcement"},{content:"STEEL GRADE:",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:o.steelGrade||"Grade 500B"}],[{content:"HEAT / BATCH NO:",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:o.heatNumber||"HT-MILL-VERIFIED"},{content:"SUPPLIER:",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:o.supplier||"Approved Steel Mill"},{content:"QA STATUS:",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:o.status||"OPTIMIZED",styles:{fontStyle:"bold",textColor:o.status==="QA_APPROVED"?[22,163,74]:[202,138,4]}}]],theme:"grid",styles:{fontSize:7,cellPadding:1.4,lineColor:[203,213,225],lineWidth:.2,textColor:[15,23,42]},columnStyles:{0:{cellWidth:26},1:{cellWidth:66},2:{cellWidth:28},3:{cellWidth:70},4:{cellWidth:24},5:{cellWidth:63}}});const v=[];r.forEach((S,R)=>{const F=R+1,A=z(P,2),G=S.stockBarQuantity%1===0?`${S.stockBarQuantity}.00`:S.stockBarQuantity.toFixed(2),V=Math.round(S.offcutLengthM*1e3),Q=V>=300,q=S.cuts||[],X=q.length>0?q.map(H=>`${Math.round(H.cutLengthM*1e3)} mm [MK:${H.barMark||"—"}${H.member?` · ${H.member}`:""}]`).join("   +   "):"Full Bar (12,000 mm)";v.push([{content:String(F),styles:{halign:"center",valign:"middle",fontStyle:"bold",fontSize:6.8,cellPadding:.6}},{content:A,styles:{halign:"right",valign:"middle",fontStyle:"bold",fontSize:6.8,cellPadding:.6}},{content:G,styles:{halign:"center",valign:"middle",fontStyle:"bold",fontSize:6.8,cellPadding:.6}},{content:X,styles:{fillColor:[240,249,255],textColor:[3,105,161],fontStyle:"bold",fontSize:6.8,cellPadding:.6}},{content:String(V),styles:{halign:"center",valign:"middle",fontStyle:"bold",fontSize:7,cellPadding:.6,fillColor:Q?[254,226,226]:[248,250,252],textColor:Q?[220,38,38]:[71,85,105]}}])});const $=t.lastAutoTable?t.lastAutoTable.finalY+3:45;Z(t,{startY:$,margin:{left:s,right:s},head:[["S/N","LENGTH","NO","CUTTING SCHEDULE (SEGMENT ALLOCATION)","OFFCUT (mm)"]],body:v.length>0?v:[["—","12,000.00","0","No cutting patterns available","0"]],theme:"grid",headStyles:{fillColor:[226,232,240],textColor:[15,23,42],fontStyle:"bold",fontSize:7.5,halign:"center",lineWidth:.2,lineColor:[148,163,184],cellPadding:1},styles:{fontSize:6.8,cellPadding:.6,lineColor:[203,213,225],lineWidth:.2},columnStyles:{0:{cellWidth:12,halign:"center"},1:{cellWidth:24,halign:"right"},2:{cellWidth:16,halign:"center"},3:{cellWidth:199,halign:"left"},4:{cellWidth:26,halign:"center"}}});{const S=new Map;r.forEach(F=>{const A=F.diameter||o.diameterMm||16;S.has(A)||S.set(A,[]),S.get(A).push(F)});const R=Array.from(S.keys()).sort((F,A)=>F-A);if(R.length>0){const F=[];R.forEach(G=>{const V=S.get(G),Q=V.reduce((J,ot)=>J+(ot.stockBarQuantity||0),0),q=Q*E,X=et(G),H=q*X;F.push([{content:`T${G}  —  Ø${G} mm Rebar`,colSpan:5,styles:{fillColor:[15,23,42],textColor:[255,255,255],fontStyle:"bold",fontSize:7.5,halign:"left",cellPadding:{top:2,bottom:2,left:4,right:4}}}]),V.forEach((J,ot)=>{const at=Math.round(J.offcutLengthM*1e3);F.push([{content:String(ot+1),styles:{halign:"center",fontSize:6.5,cellPadding:.8}},{content:`${P} mm`,styles:{halign:"right",fontSize:6.5,cellPadding:.8}},{content:String(J.stockBarQuantity),styles:{halign:"center",fontSize:6.5,cellPadding:.8}},{content:(J.cuts||[]).map(tt=>`${Math.round(tt.cutLengthM*1e3)} mm [MK:${tt.barMark||"—"}${tt.member?` · ${tt.member}`:""}]`).join("   +   ")||"Full Bar",styles:{fontSize:6.5,cellPadding:.8,fillColor:[240,249,255],textColor:[3,105,161]}},{content:`${at} mm`,styles:{halign:"center",fontSize:6.5,cellPadding:.8,fillColor:at>=300?[254,226,226]:[248,250,252],textColor:at>=300?[220,38,38]:[71,85,105]}}])}),F.push([{content:`TOTAL — Ø${G} mm`,colSpan:2,styles:{fillColor:[245,158,11],textColor:[15,23,42],fontStyle:"bold",fontSize:7,halign:"left",cellPadding:{top:2,bottom:2,left:4,right:4}}},{content:String(Q),styles:{fillColor:[245,158,11],textColor:[15,23,42],fontStyle:"bold",fontSize:7,halign:"center",cellPadding:{top:2,bottom:2,left:4,right:4}}},{content:`Stock Bars = ${Q} × ${E}m = ${z(q,2)} m  |  Unit Mass = ${X} kg/m  |  Weight = ${z(H,2)} kg`,styles:{fillColor:[245,158,11],textColor:[15,23,42],fontStyle:"bold",fontSize:6.8,halign:"left",cellPadding:{top:2,bottom:2,left:4,right:4}}},{content:"",styles:{fillColor:[245,158,11]}}])});const A=t.lastAutoTable?t.lastAutoTable.finalY+4:45;Z(t,{startY:A,margin:{left:s,right:s},head:[["S/N","STOCK LENGTH","NO OF BARS","CUTTING PATTERN","OFFCUT"]],body:F,theme:"grid",headStyles:{fillColor:[30,41,59],textColor:[255,255,255],fontStyle:"bold",fontSize:7.5,halign:"center",lineWidth:.2,lineColor:[100,116,139],cellPadding:1},styles:{fontSize:6.8,cellPadding:.6,lineColor:[203,213,225],lineWidth:.2},columnStyles:{0:{cellWidth:12,halign:"center"},1:{cellWidth:30,halign:"right"},2:{cellWidth:20,halign:"center"},3:{cellWidth:189,halign:"left"},4:{cellWidth:26,halign:"center"}}})}}let C=t.lastAutoTable?t.lastAutoTable.finalY+4:150;C>162&&(t.addPage(),C=15);const L=95;Z(t,{startY:C,margin:{left:s},tableWidth:L,body:[[{content:"TOTAL LENGTH (m)",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:z(D,2),styles:{halign:"right",fontStyle:"bold"}}],[{content:"12m STOCK BARS",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:String(j),styles:{halign:"right",fontStyle:"bold"}}],[{content:"SCRAP WASTAGE %",styles:{fontStyle:"bold",fillColor:[241,245,249],textColor:[71,85,105]}},{content:`${I.toFixed(2)}% (Target ≤ ${k}%)`,styles:{halign:"right",fontStyle:"bold",textColor:I<=k?[22,163,74]:[220,38,38]}}]],theme:"grid",styles:{fontSize:7,cellPadding:1.6,lineColor:[203,213,225],lineWidth:.2},columnStyles:{0:{cellWidth:48},1:{cellWidth:47}}});const M=s+L+3,_=32,Y=19.5;t.setDrawColor(15,23,42),t.setLineWidth(.4),t.setFillColor(255,255,255),t.rect(M,C,_,Y,"FD"),t.setFillColor(241,245,249),t.rect(M,C,_,5,"F"),t.setFont("helvetica","bold"),t.setFontSize(8),t.setTextColor(71,85,105),t.text("MT",M+_/2,C+3.8,{align:"center"}),t.setFont("helvetica","bold"),t.setFontSize(13),t.setTextColor(15,23,42),t.text(N,M+_/2,C+14,{align:"center"});const K=M+_+4,U=w-(K-s),dt=Y;t.setFillColor(255,245,245),t.setDrawColor(239,68,68),t.setLineWidth(.4),t.rect(K,C,U,dt,"FD"),t.setFont("helvetica","bold"),t.setFontSize(7.5),t.setTextColor(185,28,28),t.text("NOTE ON REUSABLE OFFCUTS (≥ 300mm):",K+3,C+4.5),t.setFont("helvetica","normal"),t.setFontSize(6.5),t.setTextColor(153,27,27);const ct=t.splitTextToSize("The offcuts in Red are significantly required for storage and further usage (from 300mm length and above). Site steelfixers and storekeepers must tag and store them in designated offcut racks for stirrups, chairs, and sub-elements.",U-6);t.text(ct,K+3,C+9);const mt=C+Y+3.5;Z(t,{startY:mt,margin:{left:s,right:s},body:[[{content:`PREPARED BY (BBS DRAUGHTSMAN / FOREMAN):

Name:  ${o.createdBy||"Steelfixer In-charge"}

Signature: __________________________    Date: ${b}`,styles:{cellPadding:2.5,textColor:[51,65,85]}},{content:`CHECKED BY (SITE QA/QC ENGINEER):

Name:  ${((lt=o.qaVerification)==null?void 0:lt.inspectedBy)||"Site QA/QC Engineer"}

Signature: __________________________    Date: ${b}`,styles:{cellPadding:2.5,textColor:[51,65,85]}},{content:`APPROVED BY (CONSULTANT / RESIDENT ENGINEER):

Name:  Resident Engineer / Lead QA

Signature: __________________________    Date: ____ / ____ / 20__`,styles:{cellPadding:2.5,textColor:[51,65,85]}}]],theme:"grid",styles:{fontSize:6.5,lineColor:[203,213,225],lineWidth:.2},columnStyles:{0:{cellWidth:w/3},1:{cellWidth:w/3},2:{cellWidth:w/3}}});const rt=t.getNumberOfPages();for(let S=1;S<=rt;S++)t.setPage(S),t.setFont("helvetica","normal"),t.setFontSize(6.5),t.setTextColor(148,163,184),t.text(`CONFIDENTIAL & STATUTORY QUALITY RECORD — ${g} — Doc Ref: ${x}`,s,T-5),t.text(`Page ${S} of ${rt}`,h-s,T-5,{align:"right"});t.save(y)}function Ft(o,n){const p=`${o.scheduleNumber||`BCS-${(o.id||"00000000").slice(0,8).toUpperCase()}`}_Cutting_Schedule.csv`,g=["S/N","Stock Length (mm)","No of Stock Bars","Cutting Pattern Segments (Length mm, Bar Mark, Member)","Offcut (mm)","Offcut Status","Diameter (mm)","Wastage %"],c=(o.cuttingPatterns||[]).map((x,y)=>{const b=y+1,r=Math.round((x.stockLengthM||o.stockBarLengthM||12)*1e3),E=(x.cuts||[]).map(D=>`[${Math.round(D.cutLengthM*1e3)}mm | Mark: ${D.barMark||"—"} | Member: ${D.member||o.levelName||"SLAB"}]`).join(" + "),P=Math.round(x.offcutLengthM*1e3),j=P>=300?"REUSABLE (STORE IN OFFCUT RACK)":"SCRAP (RECYCLE)";return[String(b),String(r),String(x.stockBarQuantity),`"${E}"`,String(P),`"${j}"`,String(x.diameter||o.diameterMm||16),`${(x.wastePercentage||0).toFixed(2)}%`]}),i=[g.join(","),...c.map(x=>x.join(","))].join(`\r
`),f=new Blob([i],{type:"text/csv;charset=utf-8;"}),a=URL.createObjectURL(f),d=document.createElement("a");d.setAttribute("href",a),d.setAttribute("download",p),document.body.appendChild(d),d.click(),document.body.removeChild(d),URL.revokeObjectURL(a)}function yt(o,n,l){var W;l!=null&&l.name;const p=(n==null?void 0:n.name)||"Civil Engineering Construction Project",g=(n==null?void 0:n.code)||"PRJ-001",c=o.scheduleNumber||`BCS-${(o.id||"00000000").slice(0,8).toUpperCase()}`,i=new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}),f=o.cuttingPatterns||[],a=o.summary,d=o.stockBarLengthM||12,x=Math.round(d*1e3),y=(a==null?void 0:a.totalStockBarsUsed)||f.reduce((u,N)=>u+(N.stockBarQuantity||0),0),b=y*d,r=o.diameterMm||(f.length>0&&f[0].diameter?f[0].diameter:16),m=et(r);let E="0.000";a!=null&&a.totalStockWeightKg&&a.totalStockWeightKg>0?E=(a.totalStockWeightKg/1e3).toFixed(3):a!=null&&a.totalCutWeightKg&&a.totalCutWeightKg>0?E=(a.totalCutWeightKg/1e3).toFixed(3):E=(b*m/1e3).toFixed(3);const P=(a==null?void 0:a.scrapPercentage)!==void 0?a.scrapPercentage:f.length>0?f.reduce((u,N)=>u+(N.wastePercentage||0),0)/f.length:0,j=(a==null?void 0:a.contractualScrapLimit)||3.5,D=f.map((u,N)=>{const I=N+1,k=z(x,2),t=u.stockBarQuantity%1===0?`${u.stockBarQuantity}.00`:u.stockBarQuantity.toFixed(2),h=Math.round(u.offcutLengthM*1e3),T=h>=300,w=(u.cuts||[]).map($=>`
            <td style="background: #f0f9ff; border: 1px solid #38bdf8; border-radius: 2px; padding: 1px 3px; text-align: center; min-width: 34px;">
              <div style="font-weight: 800; font-size: 8.5px; color: #0369a1; line-height: 1;">${Math.round($.cutLengthM*1e3)}</div>
              <div style="font-size: 6.5px; font-weight: 700; color: #475569; line-height: 1; margin-top: 1px;">${$.barMark||"—"}</div>
            </td>
          `).join("");return`
        <tr style="border-bottom: 1px solid #cbd5e1; page-break-inside: avoid;">
          <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: 800; font-size: 8.5px; padding: 1.5px 3px; background: #ffffff;">
            ${I}
          </td>
          <td style="border: 1px solid #cbd5e1; text-align: right; padding: 1.5px 5px; font-weight: 700; font-size: 8.5px; font-family: monospace; background: #ffffff;">
            ${k}
          </td>
          <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: 800; font-size: 8.5px; padding: 1.5px 3px; background: #ffffff;">
            ${t}
          </td>
          <td style="padding: 1px 2px; border: 1px solid #cbd5e1; background: #ffffff;">
            <table style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
              <tr>${w}</tr>
            </table>
          </td>
          <td style="text-align: center; vertical-align: middle; padding: 1.5px 3px; ${T?"background: #fee2e2; color: #dc2626; font-weight: 800; font-size: 8.5px; border: 1px solid #f87171;":"background: #f8fafc; color: #334155; font-weight: 700; font-size: 8.5px; border: 1px solid #cbd5e1;"}">
            ${h}
          </td>
        </tr>
      `}).join("");return`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${c} - Cutting Schedule</title>
      <style>
        * { box-sizing: border-box; }
        @page {
          size: A4 landscape;
          margin: 6mm 8mm 6mm 8mm;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
          .no-print { display: none !important; }
        }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 8px 10px;
          font-size: 9.5px;
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
          margin-bottom: 6px;
          border: 1px solid #cbd5e1;
          font-size: 8.5px;
        }
        .meta-table td {
          border: 1px solid #cbd5e1;
          padding: 2.5px 6px;
        }
        .meta-label {
          background: #f1f5f9;
          font-weight: 700;
          color: #475569;
          width: 12%;
        }
        .meta-val {
          font-weight: 700;
          color: #0f172a;
          width: 21%;
        }
        .cutting-table {
          width: 100%;
          border-collapse: collapse;
          border: 1.5px solid #0f172a;
          margin-bottom: 8px;
        }
        .cutting-table tr {
          page-break-inside: avoid;
        }
        .cutting-table th {
          border: 1px solid #0f172a;
          padding: 4px 6px;
          background: #e2e8f0;
          font-size: 8.5px;
          font-weight: 900;
          text-align: center;
          color: #0f172a;
          letter-spacing: 0.5px;
        }
        .summary-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-top: 8px;
        }
        .summary-left {
          display: flex;
          align-items: stretch;
          gap: 8px;
        }
        .stats-table {
          border-collapse: collapse;
          border: 1.5px solid #0f172a;
          font-size: 9px;
          font-weight: 800;
        }
        .stats-table td {
          border: 1px solid #cbd5e1;
          padding: 4px 10px;
        }
        .mt-box {
          border: 2px solid #0f172a;
          background: #ffffff;
          padding: 4px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 90px;
        }
        .mt-header {
          font-size: 10px;
          font-weight: 900;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 2px;
          color: #475569;
        }
        .mt-val {
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
          margin-top: 2px;
          font-family: monospace;
        }
        .note-box {
          border: 1.5px solid #dc2626;
          background: #fff5f5;
          padding: 8px 14px;
          font-size: 9px;
          font-weight: 700;
          color: #991b1b;
          border-radius: 4px;
          max-width: 480px;
          line-height: 1.4;
        }
        .signoff-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          border: 1px solid #cbd5e1;
          font-size: 8px;
        }
        .signoff-table td {
          border: 1px solid #cbd5e1;
          padding: 6px 10px;
          width: 33.33%;
          vertical-align: top;
        }
        .print-btn-bar {
          margin-bottom: 10px;
          padding: 8px 12px;
          background: #1e293b;
          color: white;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .print-btn {
          background: #f59e0b;
          color: #0f172a;
          border: none;
          padding: 6px 16px;
          font-weight: 800;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="print-btn-bar no-print">
        <span style="font-weight: 700;">Cutting Schedule Print & PDF Preview — ${c}</span>
        <button onclick="window.print()" class="print-btn">Print / Save as PDF</button>
      </div>

      <!-- Header Banner with Dynamic Company Branding -->
      <table class="doc-header">
        <tr>
          <td class="header-brand">
            ${gt(l,n)}
          </td>
          <td style="width: 53%;">
            <div class="header-title">REBAR CUTTING SCHEDULE & STOCK BAR OPTIMIZATION</div>
            <div class="header-sub">PROJECT: ${p} (${g})</div>
            <div class="header-iso">BS 8666:2020 / BS 4449 Standard &bull; 12.0m Commercial Stock Nesting</div>
          </td>
          <td class="meta-box">
            <strong>Doc Ref:</strong> <span style="color:#ea580c; font-weight:700;">${c}</span><br/>
            <strong>Date:</strong> ${i}<br/>
            <strong>Steel Grade:</strong> ${o.steelGrade||"Grade 500B"}<br/>
            <strong>Status:</strong> <span style="font-weight: 800; color: ${o.status==="QA_APPROVED"?"#16a34a":"#ca8a04"};">${o.status||"OPTIMIZED"}</span>
          </td>
        </tr>
      </table>

      <!-- Metadata Box -->
      <table class="meta-table">
        <tr>
          <td class="meta-label">SCHEDULE REF:</td>
          <td class="meta-val" style="font-family: monospace; font-size: 10px; color: #0284c7;">${c}</td>
          <td class="meta-label">TITLE / SCOPE:</td>
          <td class="meta-val">${o.title||"Reinforcement Cutting Order"}</td>
          <td class="meta-label">DATE:</td>
          <td class="meta-val">${i}</td>
        </tr>
        <tr>
          <td class="meta-label">SOURCE BBS:</td>
          <td class="meta-val">${o.sourceBBSFileName||"BBS-Uploaded"}</td>
          <td class="meta-label">LOCATION / LEVEL:</td>
          <td class="meta-val">${o.levelName||"General Reinforcement"}</td>
          <td class="meta-label">STEEL GRADE:</td>
          <td class="meta-val">${o.steelGrade||"Grade 500B"}</td>
        </tr>
        <tr>
          <td class="meta-label">HEAT / BATCH NO:</td>
          <td class="meta-val">${o.heatNumber||"HT-MILL-VERIFIED"}</td>
          <td class="meta-label">SUPPLIER:</td>
          <td class="meta-val">${o.supplier||"Approved Steel Mill"}</td>
          <td class="meta-label">QA STATUS:</td>
          <td class="meta-val" style="color: ${o.status==="QA_APPROVED"?"#16a34a":"#ca8a04"};">
            ${o.status||"OPTIMIZED"}
          </td>
        </tr>
      </table>

      <!-- Main Cutting Table -->
      <table class="cutting-table">
        <thead>
          <tr>
            <th style="width: 36px;">S/N</th>
            <th style="width: 90px;">LENGTH</th>
            <th style="width: 50px;">NO</th>
            <th>CUTTING SCHEDULE (TRACK & SEGMENT ALLOCATION)</th>
            <th style="width: 75px;">OFFCUT</th>
          </tr>
        </thead>
        <tbody>
          ${D}
        </tbody>
      </table>

      <!-- Per-Diameter Summary Table -->
      ${(()=>{const u=new Map;f.forEach(k=>{const t=k.diameter||o.diameterMm||16;u.has(t)||u.set(t,[]),u.get(t).push(k)});const N=Array.from(u.keys()).sort((k,t)=>k-t);return N.length===0?"":`
          <table style="width:100%;border-collapse:collapse;border:1.5px solid #0f172a;margin-bottom:10px;">
            <thead>
              <tr style="background:#1e293b;">
                <th style="border:1px solid #475569;color:#fff;font-size:8.5px;padding:3px 6px;text-align:center;">S/N</th>
                <th style="border:1px solid #475569;color:#fff;font-size:8.5px;padding:3px 6px;text-align:center;">STOCK LENGTH</th>
                <th style="border:1px solid #475569;color:#fff;font-size:8.5px;padding:3px 6px;text-align:center;">NO OF BARS</th>
                <th style="border:1px solid #475569;color:#fff;font-size:8.5px;padding:3px 6px;text-align:center;">CUTTING PATTERN</th>
                <th style="border:1px solid #475569;color:#fff;font-size:8.5px;padding:3px 6px;text-align:center;">OFFCUT</th>
              </tr>
            </thead>
            <tbody>${N.map(k=>{const t=u.get(k),h=t.reduce((L,M)=>L+(M.stockBarQuantity||0),0),T=h*d,s=et(k),w=T*s,v=`<tr>
              <td colspan="5" style="background:#0f172a;color:#fff;font-weight:900;font-size:9px;padding:3px 8px;letter-spacing:0.5px;">
                T${k}&nbsp;&nbsp;—&nbsp;&nbsp;Ø${k} mm Rebar
              </td>
            </tr>`,$=t.map((L,M)=>{const _=Math.round(L.offcutLengthM*1e3),Y=_>=300,K=(L.cuts||[]).map(U=>`${Math.round(U.cutLengthM*1e3)} mm [MK:${U.barMark||"—"}${U.member?` · ${U.member}`:""}]`).join(" + ")||"Full Bar";return`<tr>
                  <td style="border:1px solid #cbd5e1;text-align:center;font-size:8px;padding:2px 4px;">${M+1}</td>
                  <td style="border:1px solid #cbd5e1;text-align:right;font-size:8px;padding:2px 4px;">${x} mm</td>
                  <td style="border:1px solid #cbd5e1;text-align:center;font-weight:800;font-size:8px;padding:2px 4px;">${L.stockBarQuantity}</td>
                  <td style="border:1px solid #cbd5e1;background:#f0f9ff;color:#0369a1;font-size:7.5px;padding:2px 6px;">${K}</td>
                  <td style="border:1px solid #cbd5e1;text-align:center;font-size:8px;padding:2px 4px;${Y?"background:#fee2e2;color:#dc2626;":"background:#f8fafc;color:#334155;"}">${_} mm</td>
                </tr>`}).join(""),C=`<tr>
              <td colspan="2" style="background:#f59e0b;color:#0f172a;font-weight:900;font-size:8.5px;padding:3px 8px;">TOTAL — Ø${k} mm</td>
              <td style="background:#f59e0b;color:#0f172a;font-weight:900;font-size:8.5px;text-align:center;padding:3px 4px;">${h}</td>
              <td style="background:#f59e0b;color:#0f172a;font-weight:800;font-size:7.8px;padding:3px 6px;">
                Stock Bars = ${h} × ${d}m = ${z(T,2)} m &nbsp;|&nbsp; Unit Mass = ${s} kg/m &nbsp;|&nbsp; Weight = ${z(w,2)} kg
              </td>
              <td style="background:#f59e0b;"></td>
            </tr>`;return v+$+C}).join("")}</tbody>
          </table>`})()}

      <!-- Bottom Summary Box Matching Spreadsheet Layout -->
      <div class="summary-wrapper">
        <div class="summary-left">
          <table class="stats-table">
            <tr>
              <td style="background: #f1f5f9; color: #475569;">TOTAL LENGTH (m)</td>
              <td style="text-align: right; font-family: monospace; font-size: 9.5px;">
                ${z(b,2)}
              </td>
            </tr>
            <tr>
              <td style="background: #f1f5f9; color: #475569;">12m STOCK BARS</td>
              <td style="text-align: right; font-family: monospace; font-size: 9.5px;">
                ${y}
              </td>
            </tr>
            <tr>
              <td style="background: #f1f5f9; color: #475569;">SCRAP WASTAGE %</td>
              <td style="text-align: right; font-family: monospace; color: ${P<=j?"#16a34a":"#dc2626"};">
                ${P.toFixed(2)}% (≤ ${j}%)
              </td>
            </tr>
          </table>

          <div class="mt-box">
            <div class="mt-header">MT</div>
            <div class="mt-val">${E}</div>
          </div>
        </div>

        <!-- Note on Reusable Red Offcuts -->
        <div class="note-box">
          <strong style="color: #dc2626; font-size: 9.5px;">NOTE:</strong>
          The offcuts in <strong>Red</strong> are significantly required for storage and further usage (from 300mm length and above). Steelfixers and storekeepers must tag and store them in designated offcut racks.
        </div>
      </div>

      <!-- QA Sign-Off Block -->
      <table class="signoff-table">
        <tr>
          <td>
            <div style="font-weight: 800; color: #475569; margin-bottom: 3px;">PREPARED BY (BBS DRAUGHTSMAN / FOREMAN):</div>
            <div>Name: <strong>${o.createdBy||"Steelfixer In-charge"}</strong></div>
            <div style="margin-top: 12px; border-bottom: 1px dotted #94a3b8; width: 80%;">Signature: </div>
            <div style="margin-top: 3px;">Date: ${i}</div>
          </td>
          <td>
            <div style="font-weight: 800; color: #475569; margin-bottom: 3px;">CHECKED BY (SITE QA/QC ENGINEER):</div>
            <div>Name: <strong>${((W=o.qaVerification)==null?void 0:W.inspectedBy)||"Site QA/QC Engineer"}</strong></div>
            <div style="margin-top: 12px; border-bottom: 1px dotted #94a3b8; width: 80%;">Signature: </div>
            <div style="margin-top: 3px;">Date: ${i}</div>
          </td>
          <td>
            <div style="font-weight: 800; color: #475569; margin-bottom: 3px;">APPROVED BY (CONSULTANT / RE):</div>
            <div>Name: <strong>Resident Engineer / Lead QA</strong></div>
            <div style="margin-top: 12px; border-bottom: 1px dotted #94a3b8; width: 80%;">Signature: </div>
            <div style="margin-top: 3px;">Date: ____ / ____ / 20__</div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `}function $t(o,n,l){var c;const p=yt(o,n,l),g=window.open("","_blank");if(g)g.document.open(),g.document.write(p),g.document.close(),setTimeout(()=>{g.focus(),g.print()},400);else{const i=document.createElement("iframe");i.style.position="fixed",i.style.right="0",i.style.bottom="0",i.style.width="0",i.style.height="0",i.style.border="none",document.body.appendChild(i);const f=(c=i.contentWindow)==null?void 0:c.document;f&&(f.open(),f.write(p),f.close(),setTimeout(()=>{var a,d;(a=i.contentWindow)==null||a.focus(),(d=i.contentWindow)==null||d.print(),setTimeout(()=>{document.body.removeChild(i)},1e3)},500))}}async function Ct(o){try{const n=new DecompressionStream("deflate"),l=n.writable.getWriter();l.write(o),l.close();const p=n.readable.getReader(),g=[];let c=0;for(;;){const{value:a,done:d}=await p.read();if(d)break;g.push(a),c+=a.length}const i=new Uint8Array(c);let f=0;for(const a of g)i.set(a,f),f+=a.length;return new TextDecoder("latin1").decode(i)}catch{try{const n=new DecompressionStream("deflate-raw"),l=n.writable.getWriter();l.write(o),l.close();const p=n.readable.getReader(),g=[];let c=0;for(;;){const{value:a,done:d}=await p.read();if(d)break;g.push(a),c+=a.length}const i=new Uint8Array(c);let f=0;for(const a of g)i.set(a,f),f+=a.length;return new TextDecoder("latin1").decode(i)}catch{return new TextDecoder("latin1").decode(o)}}}function kt(o){const n=[];let l=[];const p=/BT([\s\S]*?)ET/g;let g;for(;(g=p.exec(o))!==null;){const i=g[1].split(/\r?\n/);for(const f of i){const a=f.trim();if(!a)continue;(a.endsWith("T*")||a.endsWith("'")||a.endsWith('"')||/\d+\s+-\d+\s+Td$/.test(a))&&l.length>0&&(n.push(l.join(" ").trim()),l=[]);const d=a.match(/\[(.*?)\]\s*TJ/);if(d){const b=d[1].match(/\((.*?)\)/g);if(b){const r=b.map(m=>m.slice(1,-1)).join("");r.trim()&&l.push(r.trim())}continue}const x=a.match(/\((.*?)\)\s*Tj/);if(x){const y=x[1];y.trim()&&l.push(y.trim());continue}}l.length>0&&(n.push(l.join(" ").trim()),l=[])}if(n.length===0){const c=o.match(/\(([^()]{2,})\)/g);if(c)return c.map(i=>i.slice(1,-1).trim()).filter(i=>i.length>0)}return n}async function wt(o){const n=new Uint8Array(o),l=new TextDecoder("latin1").decode(n),p=[];let g=0;for(;g<n.length;){const c=l.indexOf("stream",g);if(c===-1)break;const i=Math.max(0,c-300),a=l.slice(i,c).includes("/FlateDecode");let d=c+6;n[d]===13&&n[d+1]===10?d+=2:(n[d]===10||n[d]===13)&&(d+=1);const x=l.indexOf("endstream",d);if(x===-1)break;const y=n.subarray(d,x);try{let b="";if(a?b=await Ct(y):b=new TextDecoder("latin1").decode(y),b&&(b.includes("BT")||b.includes("Tj")||b.includes("TJ"))){const r=kt(b);r.length>0&&p.push(...r)}}catch{}g=x+9}return p.join(`
`)}const Mt=({isOpen:o,onClose:n,onImport:l,activeSchedule:p,defaultMode:g})=>{const[c,i]=O.useState("FILE"),[f,a]=O.useState(""),[d,x]=O.useState(!1),[y,b]=O.useState(null),[r,m]=O.useState(null),[E,P]=O.useState(!1),[j,D]=O.useState(g||(p?"APPEND":"NEW")),W=O.useRef(null);if(!o)return null;const u=t=>{if(b(t),t.name.toLowerCase().endsWith(".pdf")||t.type==="application/pdf"){P(!0);const T=new FileReader;T.onload=async s=>{var v;const w=(v=s.target)==null?void 0:v.result;if(w)try{B.loading("Extracting rebar text from PDF schedule...",{id:"pdf-load"});const $=await wt(w);if(B.dismiss("pdf-load"),P(!1),$&&$.trim()){const C=st($);m(C),C.items.length>0?B.success(`Extracted ${C.items.length} rebar marks from PDF!`):B.error("Extracted text from PDF, but no standard rebar rows were recognized. You can copy the table text from your PDF reader and paste into the 'Paste Schedule Rows' tab!",{duration:6e3})}else B.error("Could not extract digital text from this PDF (it may be a scanned drawing). You can copy the table text from your PDF reader and paste into 'Paste Schedule Rows'!",{duration:6e3})}catch{B.dismiss("pdf-load"),P(!1),B.error("Failed to parse PDF streams.")}},T.readAsArrayBuffer(t);return}const h=new FileReader;h.onload=T=>{var w;const s=(w=T.target)==null?void 0:w.result;if(s){const v=st(s);m(v),v.items.length>0?B.success(`Parsed ${v.items.length} rebar marks successfully!`):B.error("Could not find valid rebar entries. Check file format.")}},h.onerror=()=>{B.error("Failed to read file.")},h.readAsText(t)},N=t=>{if(a(t),t.trim()){const h=st(t);m(h)}else m(null)},I=()=>{const t=xt(),h=new Blob([t],{type:"text/csv;charset=utf-8;"}),T=URL.createObjectURL(h),s=document.createElement("a");s.href=T,s.setAttribute("download","Sample_BBS_Schedule_Template.csv"),document.body.appendChild(s),s.click(),document.body.removeChild(s),B.success("Sample BBS Template downloaded!")},k=()=>{if(!r||r.items.length===0){B.error("No valid rebar lines to import.");return}l(r.items,(y==null?void 0:y.name)||"Manual_BBS_Intake.csv",j),B.success(j==="APPEND"&&p?`Appended ${r.items.length} BBS line items to ${p.scheduleNumber}!`:`Imported ${r.items.length} BBS line items as a new schedule!`),n()};return e.jsx("div",{className:"fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200",children:e.jsxs("div",{className:"bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]",children:[e.jsxs("div",{className:"px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold",children:e.jsx(nt,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-lg font-bold text-slate-900 dark:text-white",children:"Import Bar Bending Schedule (BBS)"}),e.jsx("p",{className:"text-xs text-slate-500 dark:text-slate-400",children:"Upload PDF / CSV / Excel schedules or paste schedule rows to produce the Bar Cutting Order"})]})]}),e.jsx("button",{onClick:n,className:"text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-lg transition-colors",children:e.jsx(ht,{className:"w-5 h-5"})})]}),p&&e.jsxs("div",{className:"px-6 pt-3 pb-1 bg-amber-500/5 dark:bg-amber-500/10 border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-3 text-xs",children:[e.jsx("span",{className:"font-bold text-slate-700 dark:text-slate-300",children:"Import Destination:"}),e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs("label",{className:"flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200",children:[e.jsx("input",{type:"radio",name:"importDestination",checked:j==="APPEND",onChange:()=>D("APPEND"),className:"text-amber-500 focus:ring-amber-500 cursor-pointer"}),e.jsxs("span",{children:["Append to Current Schedule (",e.jsx("strong",{className:"text-amber-600 dark:text-amber-400",children:p.scheduleNumber}),")"]})]}),e.jsxs("label",{className:"flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200",children:[e.jsx("input",{type:"radio",name:"importDestination",checked:j==="NEW",onChange:()=>D("NEW"),className:"text-amber-500 focus:ring-amber-500 cursor-pointer"}),e.jsx("span",{children:"Create as Brand-New Schedule"})]})]})]}),e.jsxs("div",{className:"px-6 pt-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("button",{onClick:()=>i("FILE"),className:`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${c==="FILE"?"border-amber-500 text-amber-600 dark:text-amber-400":"border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`,children:e.jsxs("span",{className:"flex items-center gap-2",children:[e.jsx(it,{className:"w-4 h-4"}),"Upload PDF / CSV File"]})}),e.jsx("button",{onClick:()=>i("PASTE"),className:`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${c==="PASTE"?"border-amber-500 text-amber-600 dark:text-amber-400":"border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`,children:e.jsxs("span",{className:"flex items-center gap-2",children:[e.jsx(pt,{className:"w-4 h-4"}),"Paste Schedule Rows (from PDF / Excel)"]})})]}),e.jsxs("button",{onClick:I,className:"flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline px-2 py-1",children:[e.jsx(bt,{className:"w-3.5 h-3.5"}),"Download Sample BBS Template"]})]}),e.jsxs("div",{className:"p-6 overflow-y-auto space-y-6 flex-1",children:[c==="FILE"?e.jsxs("div",{children:[e.jsxs("div",{onDragOver:t=>{t.preventDefault(),x(!0)},onDragLeave:()=>x(!1),onDrop:t=>{t.preventDefault(),x(!1),t.dataTransfer.files&&t.dataTransfer.files[0]&&u(t.dataTransfer.files[0])},onClick:()=>{var t;return(t=W.current)==null?void 0:t.click()},className:`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${d?"border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 scale-[0.99]":"border-slate-200 dark:border-slate-700 hover:border-amber-400 bg-slate-50/50 dark:bg-slate-800/20"}`,children:[e.jsx("input",{type:"file",ref:W,onChange:t=>{t.target.files&&t.target.files[0]&&u(t.target.files[0])},accept:".pdf,.csv,.txt,.tsv",className:"hidden"}),e.jsx("div",{className:"w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3",children:e.jsx(it,{className:"w-7 h-7"})}),e.jsx("h3",{className:"text-base font-bold text-slate-800 dark:text-slate-100",children:y?y.name:"Click to select or drag & drop PDF / CSV BBS schedule"}),e.jsx("p",{className:"text-xs text-slate-500 dark:text-slate-400 mt-1",children:"Supports digital PDF Bar Bending Schedules, CSV, TSV, or exported text schedules from RebarCAD, CADS RC, Tekla, Prokon & AutoCAD"})]}),e.jsxs("div",{className:"mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-xl flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300",children:[e.jsx(nt,{className:"w-4 h-4 shrink-0 mt-0.5 text-blue-500"}),e.jsxs("div",{children:[e.jsx("strong",{className:"block font-bold",children:"Have your BBS in PDF format?"}),e.jsxs("span",{children:["Upload your PDF directly above to automatically parse rebar lines. If your PDF is a scanned drawing or has complex framing, you can also select the table in your PDF reader (Chrome, Acrobat, Edge), press ",e.jsx("strong",{children:"Ctrl+C"}),", and paste it into the ",e.jsx("strong",{children:'"Paste Schedule Rows"'})," ","tab!"]})]})]})]}):e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2",children:"Paste BBS Table Rows (Tab or Comma Delimited)"}),e.jsx("textarea",{value:f,onChange:t=>N(t.target.value),placeholder:`Member	Bar Mark	Diameter	Cut Length	Total Bars	Shape Code
1B-01	01	20	5.45	8	00
1B-01	02	20	4.80	6	00
1B-01	03	10	1.75	56	51`,rows:6,className:"w-full text-xs font-mono p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"}),e.jsx("p",{className:"text-[11px] text-slate-400 dark:text-slate-500 mt-1",children:"Tip: Copy cells directly from your engineer's Excel spreadsheet and paste them above."})]}),r&&r.items.length>0&&e.jsxs("div",{className:"space-y-3 pt-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(ut,{className:"w-4 h-4 text-emerald-500"}),e.jsxs("span",{className:"text-sm font-bold text-slate-900 dark:text-white",children:["Parsed Rebar Entries (",r.items.length," items ·"," ",r.totalBars," total bars)"]})]}),e.jsxs("div",{className:"flex items-center gap-3 text-xs",children:[e.jsxs("span",{className:"px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold",children:["Total Weight:"," ",e.jsxs("strong",{children:[(r.totalWeightKg/1e3).toFixed(3)," t"]})," ","(",r.totalWeightKg.toLocaleString()," kg)"]}),e.jsxs("span",{className:"px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold",children:["Diameters:"," ",r.diametersFound.map(t=>`Y${t}`).join(", ")]})]})]}),r.errors.length>0&&e.jsxs("div",{className:"p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl space-y-1",children:[e.jsxs("div",{className:"flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300",children:[e.jsx(St,{className:"w-3.5 h-3.5"}),e.jsxs("span",{children:[r.errors.length," rows skipped due to invalid values:"]})]}),e.jsx("ul",{className:"text-[11px] text-amber-700 dark:text-amber-400 list-disc list-inside space-y-0.5 max-h-20 overflow-y-auto",children:r.errors.map((t,h)=>e.jsx("li",{children:t},h))})]}),e.jsx("div",{className:"border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto",children:e.jsxs("table",{className:"w-full text-xs text-left",children:[e.jsx("thead",{className:"bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold sticky top-0",children:e.jsxs("tr",{children:[e.jsx("th",{className:"p-2.5",children:"Member"}),e.jsx("th",{className:"p-2.5",children:"Mark"}),e.jsx("th",{className:"p-2.5",children:"Dia"}),e.jsx("th",{className:"p-2.5",children:"Cut Length (m)"}),e.jsx("th",{className:"p-2.5",children:"Qty"}),e.jsx("th",{className:"p-2.5",children:"Total Length"}),e.jsx("th",{className:"p-2.5",children:"Shape"}),e.jsx("th",{className:"p-2.5 text-right",children:"Total Wt (kg)"})]})}),e.jsx("tbody",{className:"divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300",children:r.items.map((t,h)=>e.jsxs("tr",{className:"hover:bg-slate-50 dark:hover:bg-slate-800/50",children:[e.jsx("td",{className:"p-2.5 font-semibold text-slate-900 dark:text-white",children:t.member}),e.jsx("td",{className:"p-2.5 font-mono font-bold text-amber-600 dark:text-amber-400",children:t.barMark}),e.jsx("td",{className:"p-2.5",children:e.jsxs("span",{className:"px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold",children:["Y",t.diameter]})}),e.jsxs("td",{className:"p-2.5 font-mono",children:[t.cutLengthM.toFixed(3)," m"]}),e.jsx("td",{className:"p-2.5 font-bold",children:t.totalBars}),e.jsxs("td",{className:"p-2.5 font-mono",children:[t.totalLengthM.toFixed(2)," m"]}),e.jsx("td",{className:"p-2.5 font-mono",children:t.shapeCode||"00"}),e.jsx("td",{className:"p-2.5 text-right font-mono font-bold",children:t.totalWeightKg.toFixed(1)})]},h))})]})})]})]}),e.jsxs("div",{className:"px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between",children:[e.jsx("span",{className:"text-xs text-slate-400",children:r!=null&&r.items.length?`${r.items.length} items ready to optimize into 12m stock bars`:"Upload a file or paste text to preview schedule"}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("button",{onClick:n,className:"px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors",children:"Cancel"}),e.jsxs("button",{onClick:k,disabled:!r||r.items.length===0,className:"px-5 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2",children:[e.jsx(nt,{className:"w-4 h-4"}),"Import BBS Data"]})]})]})]})})};export{Mt as B,Ft as a,Dt as e,$t as p};
