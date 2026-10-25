import { auth } from "@/firebase";

export type AIActionType =
  | "CREATE_NCR"
  | "CREATE_DAILY_LOG"
  | "CREATE_SITE_INSTRUCTION"
  | "CREATE_SITE_COMMENT"
  | "CREATE_ELEMENT"
  | "CREATE_WEEKLY_REPORT"
  | "SYNC_GOOGLE_CALENDAR"
  | "SYNC_GOOGLE_SHEETS"
  | "SYNC_GOOGLE_DOCS"
  | "SYNC_GOOGLE_DRIVE"
  | "SYNC_GMAIL";

export interface AIActionProposal {
  action: AIActionType;
  [key: string]: any;
}

export interface AIChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: number;
  imageBase64?: string;
  isStreaming?: boolean;
  actionProposal?: AIActionProposal;
  actionExecuted?: boolean;
}

export interface AskAIOptions {
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

export interface AIResponse {
  text: string;
  cleanText: string;
  actionProposal?: AIActionProposal;
  model?: string;
  error?: string;
}

/**
 * Parses markdown ```jqms-action ... ``` block out of the model's text response.
 */
export function extractActionProposal(rawText: string): {
  cleanText: string;
  action?: AIActionProposal;
} {
  const match = rawText.match(/```jqms-action\s*([\s\S]*?)\s*```/);
  if (!match) {
    return { cleanText: rawText };
  }

  try {
    const jsonStr = match[1].trim();
    const action = JSON.parse(jsonStr) as AIActionProposal;
    const cleanText = rawText
      .replace(/```jqms-action\s*[\s\S]*?\s*```/, "")
      .trim();
    return { cleanText, action };
  } catch (err) {
    console.warn("Failed parsing action proposal JSON:", err);
    return { cleanText: rawText };
  }
}

/**
 * Client service to communicate with the AI Copilot exclusively via the
 * authenticated Netlify serverless endpoint (/api/gemini-assistant).
 * Server API keys never enter browser bundles or client network query strings.
 */
export async function askGeminiCopilot(
  options: AskAIOptions,
): Promise<AIResponse> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return {
      text: "",
      cleanText: "",
      error: "Authentication required. Please sign in to use Jay-QMS Copilot.",
    };
  }

  let idToken = "";
  try {
    idToken = await currentUser.getIdToken();
  } catch (tokenErr: any) {
    return {
      text: "",
      cleanText: "",
      error:
        tokenErr?.message ||
        "Unable to verify session token. Please sign in again.",
    };
  }

  const endpoints = [
    "/api/gemini-assistant",
    "/.netlify/functions/gemini-assistant",
  ];
  let lastError = "Failed to communicate with AI Copilot.";

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(options),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        // Likely SPA fallback in non-netlify vite dev server; try direct netlify function path next
        lastError =
          "AI Copilot serverless endpoint is not reachable in this environment. Run `npx netlify dev` locally or deploy to Netlify with GEMINI_API_KEY configured.";
        continue;
      }

      const data = await res.json();
      if (!res.ok) {
        lastError =
          data?.error ||
          `AI Copilot returned status ${res.status}.`;
        break;
      }

      const rawText = data.text || "No reply received from AI model.";
      const { cleanText, action } = extractActionProposal(rawText);

      return {
        text: rawText,
        cleanText,
        actionProposal: action,
        model: data.model,
      };
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }

  return {
    text: "",
    cleanText: "",
    error: lastError,
  };
}
