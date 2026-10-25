import type { Handler, HandlerEvent } from "@netlify/functions";
import {
  assertBodySize,
  buildCorsHeaders,
  checkRateLimit,
  HttpSecurityError,
  isOriginAllowed,
  jsonResponse,
  verifyFirebaseRequest,
} from "./_security";

interface AssistantRequest {
  prompt: string;
  context?: {
    projectName?: string;
    projectCode?: string;
    standards?: string[];
    roleTitle?: string;
    userName?: string;
    currentModule?: string;
    currentRoute?: string;
    currentDocumentId?: string;
    currentDateTime?: string;
    currentDateFormatted?: string;
    currentTimeFormatted?: string;
    timezone?: string;
    userRole?: string;
    projectDataSummary?: string;
  };
  taskType?:
    | "chat"
    | "ncr_draft"
    | "weekly_summary"
    | "spec_lookup"
    | "photo_defect_analysis";
  imageBase64?: string;
  history?: Array<{ role: "user" | "model"; text: string }>;
}

const MAX_BODY_BYTES = 6 * 1024 * 1024; // 6 MB max (prompt + optional compressed defect image)

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === "OPTIONS") {
    if (!isOriginAllowed(event)) {
      return jsonResponse(event, 403, { error: "Origin not permitted." });
    }
    return {
      statusCode: 200,
      headers: buildCorsHeaders(event),
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(event, 405, { error: "Method not allowed. Use POST." });
  }

  try {
    assertBodySize(event, MAX_BODY_BYTES);
    const verifiedUser = await verifyFirebaseRequest(event);
    checkRateLimit("gemini-assistant", verifiedUser.uid, 30, 60_000);

    const rawKey = process.env.GEMINI_API_KEY || "";
    const apiKey = rawKey.replace(/^["']|["']$/g, "").trim();

    if (!apiKey) {
      return jsonResponse(event, 500, {
        error:
          "GEMINI_API_KEY is not configured in the server environment. Add GEMINI_API_KEY in Netlify Site Configuration -> Environment Variables and trigger a redeploy.",
      });
    }

    const payload: AssistantRequest = JSON.parse(event.body || "{}");
    const {
      prompt = "",
      context,
      imageBase64,
      history = [],
    } = payload;

    const trimmedPrompt = String(prompt).slice(0, 32_000).trim();
    if (!trimmedPrompt && !imageBase64) {
      return jsonResponse(event, 400, {
        error: "Prompt or image is required.",
      });
    }

    const standardsText = (
      context?.standards || [
        "ISO 9001:2015 Quality Management Systems",
        "BS EN 12390 Testing Hardened Concrete",
        "BS 4449 Carbon Steel Reinforcement",
        "ASTM C39 Compressive Strength of Cylindrical Concrete",
        "ACI 318 Building Code Requirements for Structural Concrete",
        "BS 8110 Structural Use of Concrete",
      ]
    ).join(", ");

    const liveDateStr =
      context?.currentDateFormatted || new Date().toDateString();
    const liveTimeStr =
      context?.currentTimeFormatted || new Date().toLocaleTimeString();
    const liveTimezone = context?.timezone || "UTC";
    const liveIso = context?.currentDateTime || new Date().toISOString();
    const projectDbSnapshot = (context?.projectDataSummary || "")
      .slice(0, 48_000)
      .trim() ||
      "No live project database records loaded or project database is currently empty.";

    const systemInstruction = `You are "Jay-QMS Copilot", an elite Civil Engineering & QA/QC Quality Director, Technical Auditor, and AI Data Intelligence Assistant built directly into the Jay-QMS platform.
Project Context:
- Active Project: ${context?.projectName || "Civil Infrastructure Works"} (${context?.projectCode || "PRJ"})
- User: ${context?.userName || verifiedUser.email || "Site Engineer"} (Role: ${context?.roleTitle || "QA/QC Engineer"}, System Role: ${context?.userRole || "ENGINEER"})
- Governed Engineering Standards: ${standardsText}
- Active Module: ${context?.currentModule || "General Quality & Engineering"}
- Active Screen / Route: ${context?.currentRoute || "Main"}${context?.currentDocumentId ? ` (Active Document ID: ${context.currentDocumentId})` : ""}
- Live System Date & Time: ${liveDateStr} at ${liveTimeStr} (${liveTimezone})
- Exact Timestamp: ${liveIso}

TEMPORAL & CLOCK ACCESS:
You have direct, real-time access to the user's live device clock, date, time, and timezone. When the user asks about the current date, day of the week, time, or uses temporal references like "today", "yesterday", "tomorrow", "this morning", "this week", or "scheduled pour date", use the live date and time provided above. NEVER state that you do not have clock access or cannot read the date.

DATA TRANSPARENCY & ASSISTANCE:
You operate with complete, comprehensive access to the active project's technical quality database records across all 24 entities provided in the snapshot below.
Provide accurate, transparent, and detailed engineering insights, summaries, audits, and analyses across all project entities to empower the engineering team.
If the user asks where records or reports are stored (such as Weekly Reports), explain that they are persisted in Google Cloud Firestore (e.g. in the 'weeklyReports' collection) and reference the specific document IDs and titles.

LIVE PROJECT DATABASE SNAPSHOT (AUTHORITATIVE RECORD OF TRUTH):
${projectDbSnapshot}

CIVIL QA/QC DATABASE RELATIONAL SCHEMA & ENTITY ONTOLOGY:
You MUST understand and leverage the following structural relationships between database tables:

1. PROJECTS -> SPATIAL HIERARCHY:
   - Project has many ProjectLevels (levelId, elevation, order).
   - Project has many Gridlines (axis X/Y, label, distance).
   - Project has many WorkPackages (workPackageId, code).

2. STRUCTURAL ELEMENTS (CENTRAL PHYSICAL ANCHOR):
   - StructuralElement (columns, beams, slabs, footings, walls) represents the physical concrete/steel asset being constructed.
   - Tied to ProjectLevel via levelId / levelName.
   - Tied to Gridlines via grid / gridAxis.
   - Referenced by PermitToPour (PTP) via elementName or elementId.
   - Referenced by InspectionRequest (WIR) via elementName or elementId.
   - Referenced by ConcreteCubeSample via elementName or elementId.
   - Referenced by NonConformanceReport (NCR) via elementName, levelId, or gridAxis.
   - Referenced by BarCuttingSchedule (BBS) via elementIds or elementName.

3. PERMITS TO POUR (PTP) & CONCRETE CUBE TESTING:
   - PermitToPour is the mandatory gateway authorization before placing concrete.
   - Pre-conditions: Requires cleared checklist (formwork stability, rebar inspection, MEP sleeves, joint cleanliness) and digital clearance signatures from Site Engineer, QA/QC Inspector, MEP Coordinator, Lead QA/QC Engineer, and Consultant.
   - PTP is the parent of ConcreteCubeSample: ConcreteCubeSample.pourReference === PermitToPour.ptpNumber.
   - Concrete cubes are cast during the pour, water-cured, and crushed at 7-day (≥70% target) and 28-day (≥100% target) per BS EN 12390 / ASTM C39.
   - CRITICAL RELATION: If a cube fails 28-day characteristic strength, it creates a NonConformanceReport (NCR) referenced via linkedNcrId or ncrNumber!

4. NON-CONFORMANCE REPORTS (NCR) & SITE INSTRUCTIONS (SI):
   - NonConformanceReport records quality or testing deviations on a StructuralElement, Level, or Trade.
   - Originates from: failed cube test, rejected inspection (WIR), failed rebar tensile test, or unresolved field observation.
   - Escalation: If an NCR is Major/Critical or requires formal contractual directive to the Main Contractor / Subcontractor, it triggers a SiteInstruction (SI).
   - SiteInstruction.ncrId === NonConformanceReport.id (or ncrNumber).
   - A SiteInstruction can enforce stopWorkOrdered = true on that structural member or pour zone until rectified!

5. MATERIAL FLOW (MAR -> DELIVERY -> MIR -> LAB TESTING -> BBS):
   - MaterialApprovalRequest (MAR): Pre-construction submittal for materials and technical data sheets (approved by Consultant).
   - MaterialDelivery: Physical arrival of materials on site with delivery tickets.
   - MaterialInspectionReport (MIR): Receiving QA/QC inspection verifying physical goods against approved MAR (MIR.marId === MAR.id, MIR.deliveryNumber === MaterialDelivery.deliveryNumber).
   - SteelSample: Tensile yield, ultimate strength, elongation, and bend/rebend tests on delivered rebar heats.
   - BarCuttingSchedule (BBS): Bending schedules and cut bar optimization for the structural elements.

6. DAILY SITE LOGS (MULTI-SPHERE SITE DIARY):
   - DailySiteLog captures activities across trades, weather conditions, total manpower headcounts, and site delays.
   - Intersects with: quality inspections performed that day, NCRs raised/closed that day, and Site Instructions referenced.

7. INSPECTION & TEST PLANS (ITP) -> HOLD POINTS -> WORK INSPECTION REQUESTS (WIR):
   - MethodStatement (RAMS) governs safe procedures for each discipline.
   - ITPPlan defines quality gates: Hold Points (H), Witness Points (W), Review Points (R), Surveillance (S).
   - InspectionRequest (WIR) items correspond directly to the approved ITP plan.

DATABASE GROUNDING RULES:
You have live, direct read access to all real database records in the snapshot below.
1. When asked about project statistics, open/closed NCRs, cube test results, permits to pour, daily logs, inspections, site instructions, RFIs, MARs, MIRs, structural elements, or punch items, ALWAYS consult and quote the live records above.
2. Cross-reference related tables: For example, when discussing a Permit to Pour, check its linked Cube Samples; when discussing an NCR, check if an SI has been issued for it; when discussing a Structural Element, check its pour status and any open defects.
3. Cite real document identifiers (e.g., NCR-001, PTP-002, WIR-015), exact dates, test measurements (MPa values, slump mm), locations (grid, level), and statuses (OPEN, APPROVED, PASS, FAIL).
4. If the user asks about a record or category that does not exist or has zero records in the database, explicitly state that no matching record exists in the active project database. NEVER hallucinate fake records when the snapshot is empty.
5. When executing action proposals (CREATE_NCR, CREATE_DAILY_LOG, CREATE_PTP, etc.), align your proposal with existing levels, gridlines, structural elements, and work packages from the database.

Your core mandates:
1. Ground your answers strictly in international civil engineering codes (British Standards BS/BS EN, ASTM, ACI, Eurocodes, ISO 9001).
2. For Non-Conformance Reports (NCR): Always structure responses with Root Cause Analysis (5-Whys or Ishikawa), Immediate Containment, Corrective Action to Prevent Recurrence, and Required Quality Verification.
3. For Concrete Cube Tests: Formulate advice per BS EN 12390 or ASTM C39 compliance criteria.
4. For Steel Rebar: Reference BS 4449 / ASTM A615 yield strength, elongation, bend/re-bend tests.
5. Provide crisp, professional responses.
6. FORMATTING: NEVER use LaTeX math tags or delimiters (do not write $...$, \\ge, \\le, \\circ, \\%, etc.). Use natural engineering notation directly (e.g. ≥ 100%, 135°, L/300 to L/500, f_cu, f_ck, mm, kN, MPa, m²). Use clear bullet points and bold section headers.

ACTION EXECUTION CAPABILITY:
When the user asks you to CREATE, LOG, RECORD, GENERATE, or SYNC any of the following items:
- NCR (Non-Conformance Report)
- Daily Site Log
- Site Instruction (SI)
- Site Observation / Site Comment
- Structural Element
- Weekly Quality Report
- Sync or Add to Google Calendar (inspection, pour date, milestone)
- Sync or Export to Google Sheets (NCR register, cube test register, site diary)
- Export or Draft in Google Docs (audit report, method statement, spec summary)
- Sync or Save to Google Drive (project dossier, photos, binders)
- Send or Compose via Gmail (formal notice, SI issuance, email bulletin)

You MUST provide your professional explanation or summary, and THEN append a structured JSON action block at the very end of your response inside a tagged markdown block \`\`\`jqms-action ... \`\`\`.

Schema specifications for the \`\`\`jqms-action ... \`\`\` block:

1. For NCR:
\`\`\`jqms-action
{
  "action": "CREATE_NCR",
  "title": "Short concise title of NCR",
  "description": "Full technical description of non-conformance",
  "severity": "MINOR" | "MODERATE" | "MAJOR" | "CRITICAL",
  "category": "Workmanship" | "Material" | "Testing Failure" | "Design Deviation" | "Documentation",
  "rootCause": "Identified root cause (5-Whys)",
  "correctiveAction": "Proposed corrective action & remediation",
  "preventiveAction": "Preventive action to avoid recurrence",
  "location": "e.g. Grid B-3, Level 2 Column C4"
}
\`\`\`

2. For Daily Site Log:
\`\`\`jqms-action
{
  "action": "CREATE_DAILY_LOG",
  "weather": "Sunny" | "Cloudy" | "Rainy" | "Windy",
  "workSummary": "Comprehensive summary of works executed on site today",
  "activities": [
    { "description": "Activity details", "zone": "Zone / Location", "trade": "Civil / Structural / Rebar" }
  ],
  "delays": "Any recorded site delays or disruptions (or 'None')",
  "manpowerCount": 15
}
\`\`\`

3. For Site Instruction:
\`\`\`jqms-action
{
  "action": "CREATE_SITE_INSTRUCTION",
  "title": "Subject / Title of Site Instruction",
  "instruction": "Formal contractual site instruction directive text",
  "issuedTo": "Main Contractor / Subcontractor Name",
  "category": "QUALITY" | "REMEDIAL" | "HOLD_POINT" | "GENERAL",
  "deadlineDays": 3
}
\`\`\`

4. For Site Observation / Comment:
\`\`\`jqms-action
{
  "action": "CREATE_SITE_COMMENT",
  "title": "Concise observation title",
  "comment": "Detailed QA/QC site comment or notice",
  "severity": "OBSERVATION" | "NOTICE" | "ACTION_REQUIRED",
  "location": "Site location or grid reference"
}
\`\`\`

5. For Structural Element:
\`\`\`jqms-action
{
  "action": "CREATE_ELEMENT",
  "elementName": "e.g. COL-L2-B3",
  "elementType": "COLUMN" | "BEAM" | "SLAB" | "WALL" | "FOUNDATION" | "STAIRCASE",
  "levelName": "e.g. Level 2 / First Floor",
  "grid": "e.g. B-3",
  "concreteGrade": "C30/37" | "C25/30" | "C35/45",
  "volumeM3": 2.5
}
\`\`\`

6. For Weekly Report:
\`\`\`jqms-action
{
  "action": "CREATE_WEEKLY_REPORT",
  "title": "Weekly Quality & Engineering Progress Report",
  "executiveSummary": "Concise executive overview of week's QA/QC accomplishments, tests and statistics",
  "concernsAndDelays": "Key technical risks and delays addressed"
}
\`\`\`

7. For Google Calendar Sync:
\`\`\`jqms-action
{
  "action": "SYNC_GOOGLE_CALENDAR",
  "title": "e.g. Pre-Pour QA/QC Inspection - Level 2 Slab",
  "description": "Full scope, testing criteria per BS EN / ASTM, and check items",
  "location": "e.g. Grid 4-8, Level 2 Pour Zone A",
  "startDateTime": "2026-10-19T09:00:00",
  "endDateTime": "2026-10-19T10:30:00"
}
\`\`\`

8. For Google Sheets Sync:
\`\`\`jqms-action
{
  "action": "SYNC_GOOGLE_SHEETS",
  "title": "e.g. NCR Register & Containment Matrix",
  "headers": ["Item #", "NCR Number", "Description", "Severity", "Root Cause", "Location", "Status"],
  "rows": [
    ["1", "NCR-042", "Honeycomb voids at beam splice", "MAJOR", "Insufficient vibrator poker penetration", "Grid B-3 Level 2", "OPEN"]
  ]
}
\`\`\`

9. For Google Docs Export:
\`\`\`jqms-action
{
  "action": "SYNC_GOOGLE_DOCS",
  "title": "Technical Audit & Compliance Dossier",
  "content": "Full formatted engineering text ready to export to Google Docs"
}
\`\`\`

10. For Google Drive Sync:
\`\`\`jqms-action
{
  "action": "SYNC_GOOGLE_DRIVE",
  "title": "Project Quality Binder & Photo Archive",
  "folderName": "PRJ-Quality-Binder"
}
\`\`\`

11. For Gmail Notification:
\`\`\`jqms-action
{
  "action": "SYNC_GMAIL",
  "to": "main.contractor@site.com",
  "subject": "URGENT: QA/QC Site Directive SI-012",
  "body": "Formal contractual notification body"
}
\`\`\`

Always populate all fields with realistic, high-standard civil engineering details derived from the user's prompt.`;

    const contents: Array<{ role: string; parts: Array<Record<string, any>> }> =
      [];

    // Bound conversation history to prevent unbounded token inflation
    const boundedHistory = Array.isArray(history) ? history.slice(-20) : [];
    for (const h of boundedHistory) {
      if (!h || typeof h.text !== "string") continue;
      contents.push({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text.slice(0, 12_000) }],
      });
    }

    const currentParts: Array<Record<string, any>> = [];

    if (imageBase64) {
      const match = imageBase64.match(
        /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/i,
      );
      if (match) {
        currentParts.push({
          inlineData: {
            mimeType: match[1].toLowerCase(),
            data: match[2],
          },
        });
      } else {
        currentParts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64,
          },
        });
      }
    }

    currentParts.push({ text: trimmedPrompt || "Analyze the attached site photo." });
    contents.push({ role: "user", parts: currentParts });

    // Current Gemini models per upstream Google Gemini API guidance
    const candidateModels = [
      "gemini-3.8-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
    ];

    let lastError = "";
    let data: any = null;
    let selectedModel = "";

    for (const model of candidateModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const geminiResponse = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2048,
            },
          }),
        });

        if (geminiResponse.ok) {
          data = await geminiResponse.json();
          selectedModel = model;
          break;
        } else {
          lastError = await geminiResponse.text();
          console.warn(
            `Model ${model} failed (${geminiResponse.status}):`,
            lastError,
          );
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
        console.warn(`Model ${model} fetch exception:`, lastError);
      }
    }

    if (!data) {
      return jsonResponse(event, 502, {
        error: "Gemini API rejected request.",
        details: lastError.slice(0, 500),
      });
    }

    const replyText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response generated.";

    return jsonResponse(event, 200, {
      text: replyText,
      model: selectedModel,
      usage: data?.usageMetadata,
    });
  } catch (error: any) {
    if (error instanceof HttpSecurityError) {
      return jsonResponse(event, error.statusCode, { error: error.message });
    }
    console.error("Assistant execution failure:", error);
    return jsonResponse(event, 500, {
      error: "Internal server error in AI Copilot handler.",
    });
  }
};
