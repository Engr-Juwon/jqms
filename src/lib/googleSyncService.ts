import { initializeApp, getApps } from "firebase/app";
import { GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
import { firebaseConfig } from "@/firebase";

function getSecondarySyncAuth() {
  const secondaryName = "GoogleWorkspaceSync";
  const existing = getApps().find((a) => a.name === secondaryName);
  const secondaryApp = existing || initializeApp(firebaseConfig, secondaryName);
  return getAuth(secondaryApp);
}

/**
 * Google Products & Workspace Synchronization Service for Jay-QMS
 * Connects Jay-QMS Copilot and data registers directly with:
 * - Google Calendar (inspections, pour dates, audit milestones, NCR deadlines)
 * - Google Sheets (live NCR logs, concrete test registers, daily site diaries)
 * - Google Drive (project dossiers, photo archives, quality binders)
 * - Google Docs (technical audit reports, method statements, executive summaries)
 * - Gmail (formal site notices, SI issuances, quality alerts)
 */

export interface GoogleCalendarEventInput {
  title: string;
  description?: string;
  location?: string;
  startDateTime?: string | Date;
  endDateTime?: string | Date;
  allDay?: boolean;
}

export interface GmailComposeInput {
  to?: string;
  cc?: string;
  subject: string;
  body: string;
}

export interface GoogleDocsInput {
  title: string;
  content: string;
}

export interface GoogleSheetsInput {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export interface GoogleWorkspaceConfig {
  connectedEmail?: string;
  accessToken?: string;
  driveFolderUrl?: string;
  driveFolderId?: string;
  sheetsSpreadsheetUrl?: string;
  calendarId?: string;
  lastSyncTimestamp?: number;
}

const STORAGE_KEY = "jqms_google_workspace_config";

/**
 * Loads current user's Google Workspace configuration from localStorage
 */
export function getGoogleWorkspaceConfig(): GoogleWorkspaceConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Failed to load Google Workspace configuration:", err);
  }
  return {};
}

/**
 * Saves Google Workspace configuration
 */
export function saveGoogleWorkspaceConfig(config: GoogleWorkspaceConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn("Failed to save Google Workspace configuration:", err);
  }
}

/**
 * Connects user's real Google Account using Firebase Google Auth with Workspace Scopes
 */
export async function connectGoogleAccount(): Promise<{ email: string; token: string }> {
  const provider = new GoogleAuthProvider();
  provider.addScope("https://www.googleapis.com/auth/calendar.events");
  provider.addScope("https://www.googleapis.com/auth/spreadsheets");
  provider.addScope("https://www.googleapis.com/auth/drive.file");

  const syncAuth = getSecondarySyncAuth();
  const result = await signInWithPopup(syncAuth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken || "";
  const email = result.user.email || "";

  const updatedConfig: GoogleWorkspaceConfig = {
    ...getGoogleWorkspaceConfig(),
    connectedEmail: email,
    accessToken: token,
    lastSyncTimestamp: Date.now(),
  };
  saveGoogleWorkspaceConfig(updatedConfig);
  return { email, token };
}

/**
 * Disconnects Google Workspace account
 */
export function disconnectGoogleAccount(): void {
  try {
    const syncAuth = getSecondarySyncAuth();
    syncAuth.signOut();
  } catch (e) {
    // ignore
  }
  const cfg = getGoogleWorkspaceConfig();
  delete cfg.accessToken;
  delete cfg.connectedEmail;
  saveGoogleWorkspaceConfig(cfg);
}

/**
 * Formats a Date to Google Calendar URL string format (YYYYMMDDTHHmmssZ or YYYYMMDD)
 */
function formatGoogleCalendarDate(date: Date, allDay = false): string {
  if (allDay) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}${m}${d}`;
  }

  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

/**
 * Direct Google Calendar API: creates an event in the user's primary calendar
 */
export async function directCreateGoogleCalendarEvent(
  token: string,
  event: GoogleCalendarEventInput
): Promise<string> {
  const startDate = event.startDateTime ? new Date(event.startDateTime) : new Date();
  const endDate = event.endDateTime
    ? new Date(event.endDateTime)
    : new Date(startDate.getTime() + 60 * 60 * 1000);

  const body = {
    summary: event.title,
    description: event.description || "Created via Jay-QMS Technical Copilot",
    location: event.location || "Project Site",
    start: {
      dateTime: startDate.toISOString(),
    },
    end: {
      dateTime: endDate.toISOString(),
    },
  };

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message || "Google Calendar API request failed");
  }

  const data = await res.json();
  return data.htmlLink || "https://calendar.google.com";
}

/**
 * Direct Google Sheets API: creates a real Google Spreadsheet populated with headers and rows
 */
export async function directCreateGoogleSheet(
  token: string,
  sheet: GoogleSheetsInput
): Promise<string> {
  // 1. Create spreadsheet
  const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: { title: sheet.title },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => null);
    throw new Error(err?.error?.message || "Google Sheets creation failed");
  }

  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;

  // 2. Populate values
  const values = [sheet.headers, ...sheet.rows];
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    }
  );

  return (
    spreadsheet.spreadsheetUrl ||
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
  );
}

/**
 * Generates an instant Google Calendar synchronization link and opens it safely
 */
export function syncToGoogleCalendar(
  event: GoogleCalendarEventInput,
  targetWindow?: Window | null
): string {
  const startDate = event.startDateTime ? new Date(event.startDateTime) : new Date();
  const endDate = event.endDateTime
    ? new Date(event.endDateTime)
    : new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour default

  const startFormatted = formatGoogleCalendarDate(startDate, event.allDay);
  const endFormatted = formatGoogleCalendarDate(endDate, event.allDay);

  const datesParam = `${startFormatted}/${endFormatted}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description || "Generated from Jay-QMS Technical Copilot",
    dates: datesParam,
  });

  if (event.location) {
    params.set("location", event.location);
  }

  const url = `https://calendar.google.com/calendar/render?${params.toString()}`;
  if (targetWindow && !targetWindow.closed) {
    targetWindow.location.href = url;
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return url;
}

/**
 * Generates a Gmail compose URL and opens it safely
 */
export function sendViaGmail(email: GmailComposeInput, targetWindow?: Window | null): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    su: email.subject,
    body: email.body,
  });

  if (email.to) params.set("to", email.to);
  if (email.cc) params.set("cc", email.cc);

  const url = `https://mail.google.com/mail/?${params.toString()}`;
  if (targetWindow && !targetWindow.closed) {
    targetWindow.location.href = url;
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return url;
}

/**
 * Formats a document, copies to clipboard, and opens Google Docs
 */
export async function exportToGoogleDocs(
  doc: GoogleDocsInput,
  targetWindow?: Window | null
): Promise<string> {
  const header = `Jay-QMS Engineering Document: ${doc.title}\nDate: ${new Date().toLocaleDateString()}\n----------------------------------------\n\n`;
  const fullText = header + doc.content;

  try {
    await navigator.clipboard.writeText(fullText);
  } catch (err) {
    console.warn("Clipboard access failed:", err);
  }

  const url = "https://docs.new";
  if (targetWindow && !targetWindow.closed) {
    targetWindow.location.href = url;
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return url;
}

/**
 * Converts a structured table into CSV and opens Google Sheets safely
 */
export async function exportToGoogleSheets(
  sheet: GoogleSheetsInput,
  targetWindow?: Window | null
): Promise<string> {
  const csvLines: string[] = [];

  const escapeCell = (val: string | number) => {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  csvLines.push(sheet.headers.map(escapeCell).join(","));

  for (const row of sheet.rows) {
    csvLines.push(row.map(escapeCell).join(","));
  }

  const csvContent = csvLines.join("\n");

  try {
    await navigator.clipboard.writeText(csvContent);
  } catch (err) {
    console.warn("Clipboard copy failed:", err);
  }

  // Also trigger a downloadable CSV fallback
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `${sheet.title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);

  const sheetsUrl = "https://sheets.new";
  if (targetWindow && !targetWindow.closed) {
    targetWindow.location.href = sheetsUrl;
  } else {
    window.open(sheetsUrl, "_blank", "noopener,noreferrer");
  }
  return sheetsUrl;
}

/**
 * Opens Google Drive project archive folder or search
 */
export function openGoogleDrive(projectName?: string, folderUrl?: string, targetWindow?: Window | null): string {
  if (folderUrl && folderUrl.startsWith("http")) {
    if (targetWindow && !targetWindow.closed) {
      targetWindow.location.href = folderUrl;
    } else {
      window.open(folderUrl, "_blank", "noopener,noreferrer");
    }
    return folderUrl;
  }

  const query = projectName ? encodeURIComponent(`Jay-QMS ${projectName}`) : "";
  const url = query
    ? `https://drive.google.com/drive/search?q=${query}`
    : "https://drive.google.com/drive/my-drive";

  if (targetWindow && !targetWindow.closed) {
    targetWindow.location.href = url;
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return url;
}
