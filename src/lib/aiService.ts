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
  };
  taskType?: "chat" | "ncr_draft" | "weekly_summary" | "spec_lookup" | "photo_defect_analysis";
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
export function extractActionProposal(rawText: string): { cleanText: string; action?: AIActionProposal } {
  const match = rawText.match(/```jqms-action\s*([\s\S]*?)\s*```/);
  if (!match) {
    return { cleanText: rawText };
  }

  try {
    const jsonStr = match[1].trim();
    const action = JSON.parse(jsonStr) as AIActionProposal;
    const cleanText = rawText.replace(/```jqms-action\s*[\s\S]*?\s*```/, "").trim();
    return { cleanText, action };
  } catch (err) {
    console.warn("Failed parsing action proposal JSON:", err);
    return { cleanText: rawText };
  }
}

/**
 * Client service to communicate with the secure Netlify AI Copilot serverless function.
 */
export async function askGeminiCopilot(options: AskAIOptions): Promise<AIResponse> {
  try {
    const res = await fetch("/api/gemini-assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.error || `Server responded with status ${res.status}`);
    }

    const data = await res.json();
    const rawText = data.text || "No reply received from AI model.";
    const { cleanText, action } = extractActionProposal(rawText);

    return {
      text: rawText,
      cleanText,
      actionProposal: action,
      model: data.model,
    };
  } catch (err: any) {
    console.error("Gemini Copilot client error:", err);
    return {
      text: "",
      cleanText: "",
      error: err?.message || "Failed to communicate with AI Copilot.",
    };
  }
}
