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
 * Generates an instant Google Calendar synchronization link and opens it
 */
export function syncToGoogleCalendar(event: GoogleCalendarEventInput): string {
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
  window.open(url, "_blank", "noopener,noreferrer");
  return url;
}

/**
 * Generates a Gmail compose URL and opens it
 */
export function sendViaGmail(email: GmailComposeInput): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    su: email.subject,
    body: email.body,
  });

  if (email.to) params.set("to", email.to);
  if (email.cc) params.set("cc", email.cc);

  const url = `https://mail.google.com/mail/?${params.toString()}`;
  window.open(url, "_blank", "noopener,noreferrer");
  return url;
}

/**
 * Prepares and opens a fresh Google Doc (docs.new), copying the content to the clipboard
 * for instant paste into Google Docs.
 */
export async function exportToGoogleDocs(doc: GoogleDocsInput): Promise<string> {
  const header = `Jay-QMS Engineering Document: ${doc.title}\nDate: ${new Date().toLocaleDateString()}\n----------------------------------------\n\n`;
  const fullText = header + doc.content;

  try {
    await navigator.clipboard.writeText(fullText);
  } catch (err) {
    console.warn("Clipboard access failed:", err);
  }

  const url = "https://docs.new";
  window.open(url, "_blank", "noopener,noreferrer");
  return url;
}

/**
 * Converts a structured table into CSV and opens Google Sheets (sheets.new)
 */
export async function exportToGoogleSheets(sheet: GoogleSheetsInput): Promise<string> {
  const csvLines: string[] = [];

  // Escape CSV value
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
  window.open(sheetsUrl, "_blank", "noopener,noreferrer");
  return sheetsUrl;
}

/**
 * Opens Google Drive project archive folder or search
 */
export function openGoogleDrive(projectName?: string, folderUrl?: string): string {
  if (folderUrl && folderUrl.startsWith("http")) {
    window.open(folderUrl, "_blank", "noopener,noreferrer");
    return folderUrl;
  }

  const query = projectName ? encodeURIComponent(`Jay-QMS ${projectName}`) : "";
  const url = query
    ? `https://drive.google.com/drive/search?q=${query}`
    : "https://drive.google.com/drive/my-drive";

  window.open(url, "_blank", "noopener,noreferrer");
  return url;
}
