import type { Handler, HandlerEvent } from "@netlify/functions";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AssistantRequest {
  prompt: string;
  context?: {
    projectName?: string;
    projectCode?: string;
    standards?: string[];
    roleTitle?: string;
    userName?: string;
    currentModule?: string;
  };
  taskType?: "chat" | "ncr_draft" | "weekly_summary" | "spec_lookup" | "photo_defect_analysis";
  imageBase64?: string; // Optional image for defect analysis
  history?: Array<{ role: "user" | "model"; text: string }>;
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed. Use POST." }),
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "GEMINI_API_KEY is not configured in Netlify environment variables.",
      }),
    };
  }

  try {
    const payload: AssistantRequest = JSON.parse(event.body || "{}");
    const { prompt, context, taskType = "chat", imageBase64, history = [] } = payload;

    if (!prompt && !imageBase64) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Prompt or image is required." }),
      };
    }

    // Build specialized Civil QA/QC engineering system prompt
    const standardsText = (context?.standards || [
      "ISO 9001:2015 Quality Management Systems",
      "BS EN 12390 Testing Hardened Concrete",
      "BS 4449 Carbon Steel Reinforcement",
      "ASTM C39 Compressive Strength of Cylindrical Concrete",
      "ACI 318 Building Code Requirements for Structural Concrete",
      "BS 8110 Structural Use of Concrete",
    ]).join(", ");

    const systemInstruction = `You are "Jay-QMS Copilot", an elite Civil Engineering & QA/QC Quality Director and Technical Auditor built into the Jay-QMS platform.
Project Context:
- Active Project: ${context?.projectName || "Civil Infrastructure Works"} (${context?.projectCode || "PRJ"})
- User: ${context?.userName || "Site Engineer"} (Role: ${context?.roleTitle || "QA/QC Engineer"})
- Governed Engineering Standards: ${standardsText}
- Active Module: ${context?.currentModule || "General Quality & Engineering"}

Your core mandates:
1. Ground your answers strictly in international civil engineering codes (British Standards BS/BS EN, ASTM, ACI, Eurocodes, ISO 9001).
2. For Non-Conformance Reports (NCR): Always structure responses with Root Cause Analysis (5-Whys or Ishikawa), Immediate Containment, Corrective Action to Prevent Recurrence, and Required Quality Verification.
3. For Concrete Cube Tests: Formulate advice per BS EN 12390 or ASTM C39 compliance criteria.
4. For Steel Rebar: Reference BS 4449 / ASTM A615 yield strength, elongation, bend/re-bend tests.
5. Provide crisp, professional responses.

ACTION EXECUTION CAPABILITY:
When the user asks you to CREATE, LOG, RECORD, or GENERATE any of the following items:
- NCR (Non-Conformance Report)
- Daily Site Log
- Site Instruction (SI)
- Site Observation / Site Comment
- Structural Element
- Weekly Quality Report

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

Always populate all fields with realistic, high-standard civil engineering details derived from the user's prompt.`;

    // Construct Gemini API contents
    const contents: Array<{ role: string; parts: Array<Record<string, any>> }> = [];

    // Append conversation history if provided
    for (const h of history) {
      contents.push({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }],
      });
    }

    // Current turn parts
    const currentParts: Array<Record<string, any>> = [];

    // If an image was passed (for site photo inspection/defect analysis)
    if (imageBase64) {
      const match = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        currentParts.push({
          inlineData: {
            mimeType: match[1],
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

    currentParts.push({ text: prompt });
    contents.push({ role: "user", parts: currentParts });

    // Call Google Gemini REST API using modern supported models
    const candidateModels = [
      "gemini-3.8-flash",
      "gemini-3.5-flash",
      "gemini-flash-latest",
      "gemini-2.5-flash",
    ];

    let lastError: string = "";
    let data: any = null;
    let selectedModel = "";

    for (const model of candidateModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const geminiResponse = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            generationConfig: {
              temperature: 0.2, // Low temperature for high technical precision
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
          console.warn(`Model ${model} failed (${geminiResponse.status}):`, lastError);
        }
      } catch (err: any) {
        lastError = err?.message || String(err);
        console.warn(`Model ${model} fetch exception:`, lastError);
      }
    }

    if (!data) {
      return {
        statusCode: 502,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: "Gemini API rejected request.",
          details: lastError,
        }),
      };
    }

    const replyText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response generated.";

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        text: replyText,
        model: selectedModel,
        usage: data?.usageMetadata,
      }),
    };
  } catch (error: any) {
    console.error("Assistant execution failure:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Internal server error in AI Copilot handler.",
        details: error?.message,
      }),
    };
  }
};
