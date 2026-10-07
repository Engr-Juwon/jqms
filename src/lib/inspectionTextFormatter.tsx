import React from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Scale,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Bookmark,
  Info,
} from "lucide-react";

export type ClauseCategory =
  | "defect"
  | "impact"
  | "directive"
  | "disclaimer"
  | "action"
  | "note"
  | "standard";

export interface StructuredClause {
  category: ClauseCategory;
  header: string;
  content: string;
}

/**
 * Parses multi-paragraph inspection notes, rejection defects, or engineering endorsements
 * into structured clauses with categorized metadata, titles, and paragraphs.
 * Handles both newline-separated paragraphs and inline labeled sentences (e.g. "Dimensional Non-Conformance: ... Operational Impact: ...").
 */
export function parseStructuredInspectionText(
  rawText?: string | null,
): StructuredClause[] {
  if (!rawText || !rawText.trim()) return [];
  const text = rawText.trim();

  // Known clause keywords commonly used in QA/QC, structural, and material inspection records
  const knownHeaderPattern =
    /(?:^|\n+|(?<=[.!?]\s+)|(?<=\b))((?:Dimensional\s+Non-Conformance|Dimensional\s+Check|Dimensional\s+Defect|Non-Conformance|Defect\s+Notice|Material\s+Defect|Defects?|Discrepancy|Discrepancies|Operational\s+Impact|Structural\s+Impact|Engineering\s+Impact|Risk\s+Assessment|Safety\s+Impact|Technical\s+Impact|Management\s+Directive|Executive\s+Directive|Management\s+Override|Management\s+Instruction|Director'?s?\s+Override|Director'?s?\s+Directive|Executive\s+Instruction|Site\s+Instruction|Liability\s+Disclaimer|Disclaimer|Warranty\s+Notice|Indemnity\s+Clause|Indemnity|Legal\s+Notice|Corrective\s+Action|Mandatory\s+Action|Action\s+Required|Remedial\s+Action|Resolution|Mitigation|Technical\s+Evaluation|Technical\s+Justification|Specification\s+Reference|QA\/QC\s+Observation|Inspector\s+Notes?|Notes?|Special\s+Instructions?|Caveats?|Conditions?|Observations?|Root\s+Cause|Justification|Disposition\s+Notice|Testing\s+Conditions?))(?:\s*:\s*|\s*—\s*|\s*-\s*)/gi;

  const matches = Array.from(text.matchAll(knownHeaderPattern));

  if (matches.length >= 1) {
    const clauses: StructuredClause[] = [];

    // Any text prior to the first matched header
    const firstIndex = matches[0].index ?? 0;
    if (firstIndex > 0) {
      const leadingText = text.substring(0, firstIndex).trim();
      if (leadingText) {
        clauses.push({
          category: "standard",
          header: "",
          content: leadingText,
        });
      }
    }

    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i];
      const matchIndex = currentMatch.index ?? 0;
      const fullMatchStr = currentMatch[0];
      const headerTitle = currentMatch[1].trim();

      const nextMatch = matches[i + 1];
      const endIndex = nextMatch
        ? (nextMatch.index ?? text.length)
        : text.length;

      const content = text
        .substring(matchIndex + fullMatchStr.length, endIndex)
        .trim();

      const normalizedHeader = headerTitle.toLowerCase();
      let category: ClauseCategory = "standard";

      if (
        normalizedHeader.includes("non-conformance") ||
        normalizedHeader.includes("defect") ||
        normalizedHeader.includes("discrepanc")
      ) {
        category = "defect";
      } else if (
        normalizedHeader.includes("impact") ||
        normalizedHeader.includes("risk") ||
        normalizedHeader.includes("safety")
      ) {
        category = "impact";
      } else if (
        normalizedHeader.includes("directive") ||
        normalizedHeader.includes("override") ||
        normalizedHeader.includes("instruction")
      ) {
        category = "directive";
      } else if (
        normalizedHeader.includes("disclaimer") ||
        normalizedHeader.includes("liability") ||
        normalizedHeader.includes("indemnity") ||
        normalizedHeader.includes("warranty") ||
        normalizedHeader.includes("legal")
      ) {
        category = "disclaimer";
      } else if (
        normalizedHeader.includes("action") ||
        normalizedHeader.includes("remedial") ||
        normalizedHeader.includes("corrective") ||
        normalizedHeader.includes("resolution") ||
        normalizedHeader.includes("mitigation")
      ) {
        category = "action";
      } else if (
        normalizedHeader.includes("note") ||
        normalizedHeader.includes("observation") ||
        normalizedHeader.includes("condition") ||
        normalizedHeader.includes("caveat") ||
        normalizedHeader.includes("evaluation") ||
        normalizedHeader.includes("justification") ||
        normalizedHeader.includes("root cause")
      ) {
        category = "note";
      }

      clauses.push({
        category,
        header: headerTitle,
        content,
      });
    }

    return clauses;
  }

  // Fallback: If no recognized keywords matched, split by paragraphs
  const rawParagraphs = text
    .split(/\n\s*\n|\r\n\s*\r\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (rawParagraphs.length === 0) {
    return [{ category: "standard", header: "", content: text }];
  }

  return rawParagraphs.map((para) => {
    // Check if paragraph starts with a generic "Header: Content"
    const genericHeaderMatch = para.match(/^([A-Za-z0-9\s/&'_-]{3,45}):\s+(.+)$/s);
    if (genericHeaderMatch) {
      const header = genericHeaderMatch[1].trim();
      const content = genericHeaderMatch[2].trim();
      const lower = header.toLowerCase();
      let category: ClauseCategory = "note";

      if (
        lower.includes("defect") ||
        lower.includes("non-conformance") ||
        lower.includes("fail") ||
        lower.includes("error") ||
        lower.includes("discrepanc")
      ) {
        category = "defect";
      } else if (lower.includes("impact") || lower.includes("risk") || lower.includes("safety")) {
        category = "impact";
      } else if (lower.includes("directive") || lower.includes("override") || lower.includes("instruction")) {
        category = "directive";
      } else if (lower.includes("disclaimer") || lower.includes("liability") || lower.includes("indemnity")) {
        category = "disclaimer";
      } else if (lower.includes("action") || lower.includes("required") || lower.includes("remed")) {
        category = "action";
      }

      return {
        category,
        header,
        content,
      };
    }

    return {
      category: "standard",
      header: "",
      content: para,
    };
  });
}

/**
 * Escapes HTML characters for safe injection into printable PDF templates.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Renders structured inspection notes, paragraphs, and clauses as clean vector HTML for PDF reports.
 */
export function renderStructuredInspectionHTML(
  rawText?: string | null,
  fallbackText: string = "No inspection observations or notes recorded.",
): string {
  const clauses = parseStructuredInspectionText(rawText);

  if (clauses.length === 0) {
    return `<div style="font-size: 8px; color: #64748b; font-style: italic; line-height: 1.4;">${escapeHtml(fallbackText)}</div>`;
  }

  // If there is only one simple paragraph with no header, return a clean paragraph
  if (clauses.length === 1 && !clauses[0].header) {
    return `<div style="font-size: 8px; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(clauses[0].content)}</div>`;
  }

  return `
    <div style="display: flex; flex-direction: column; gap: 6px; width: 100%;">
      ${clauses
        .map((clause) => {
          let boxBg = "#f8fafc";
          let boxBorder = "#cbd5e1";
          let borderLeft = "3.5px solid #64748b";
          let badgeBg = "#e2e8f0";
          let badgeColor = "#334155";
          let badgeBorder = "#cbd5e1";

          switch (clause.category) {
            case "defect":
              boxBg = "#fff5f5";
              boxBorder = "#fecaca";
              borderLeft = "3.5px solid #dc2626";
              badgeBg = "#fee2e2";
              badgeColor = "#991b1b";
              badgeBorder = "#fca5a5";
              break;
            case "impact":
              boxBg = "#fffbeb";
              boxBorder = "#fef08a";
              borderLeft = "3.5px solid #d97706";
              badgeBg = "#fef3c7";
              badgeColor = "#92400e";
              badgeBorder = "#fcd34d";
              break;
            case "directive":
              boxBg = "#faf5ff";
              boxBorder = "#e9d5ff";
              borderLeft = "3.5px solid #7c3aed";
              badgeBg = "#f3e8ff";
              badgeColor = "#581c87";
              badgeBorder = "#d8b4fe";
              break;
            case "disclaimer":
              boxBg = "#f8fafc";
              boxBorder = "#cbd5e1";
              borderLeft = "3.5px solid #334155";
              badgeBg = "#e2e8f0";
              badgeColor = "#0f172a";
              badgeBorder = "#94a3b8";
              break;
            case "action":
              boxBg = "#f0fdf4";
              boxBorder = "#bbf7d0";
              borderLeft = "3.5px solid #16a34a";
              badgeBg = "#dcfce7";
              badgeColor = "#166534";
              badgeBorder = "#86efac";
              break;
            case "note":
              boxBg = "#f0f9ff";
              boxBorder = "#bae6fd";
              borderLeft = "3.5px solid #0284c7";
              badgeBg = "#e0f2fe";
              badgeColor = "#0369a1";
              badgeBorder = "#7dd3fc";
              break;
            default:
              boxBg = "#ffffff";
              boxBorder = "#e2e8f0";
              borderLeft = "3px solid #94a3b8";
              badgeBg = "#f1f5f9";
              badgeColor = "#475569";
              badgeBorder = "#cbd5e1";
              break;
          }

          return `
            <div style="background: ${boxBg}; border: 1px solid ${boxBorder}; border-left: ${borderLeft}; border-radius: 4px; padding: 6px 8px; box-sizing: border-box; page-break-inside: avoid; break-inside: avoid;">
              ${
                clause.header
                  ? `
                <div style="margin-bottom: 3.5px; display: flex; align-items: center; gap: 6px;">
                  <span style="display: inline-block; padding: 1.5px 6px; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; border-radius: 3px; font-weight: 800; font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.4px;">
                    ${escapeHtml(clause.header)}
                  </span>
                </div>
              `
                  : ""
              }
              <div style="font-size: 8px; color: #1e293b; line-height: 1.5; white-space: pre-wrap; font-weight: ${clause.category === "defect" || clause.category === "directive" ? "600" : "400"};">
                ${escapeHtml(clause.content)}
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

interface StructuredInspectionViewProps {
  text?: string | null;
  fallback?: string;
  className?: string;
  defaultCategory?: ClauseCategory;
}

/**
 * Interactive React component for displaying multi-paragraph inspection notes,
 * non-conformances, management directives, and endorsements with responsive styled cards.
 */
export const StructuredInspectionView: React.FC<
  StructuredInspectionViewProps
> = ({
  text,
  fallback = "No observations or details recorded.",
  className = "",
  defaultCategory,
}) => {
  const clauses = parseStructuredInspectionText(text);

  if (clauses.length === 0) {
    return (
      <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 italic text-xs ${className}`}>
        {fallback}
      </div>
    );
  }

  // If single plain paragraph with no header and a defaultCategory was provided
  if (clauses.length === 1 && !clauses[0].header && defaultCategory) {
    clauses[0].category = defaultCategory;
  }

  return (
    <div className={`space-y-2.5 ${className}`}>
      {clauses.map((clause, idx) => {
        let cardStyle =
          "bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 border-l-4 border-l-slate-500";
        let badgeStyle =
          "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700";
        let IconComponent = FileText;

        switch (clause.category) {
          case "defect":
            cardStyle =
              "bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200 border-l-4 border-l-red-600";
            badgeStyle =
              "bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 border-red-300 dark:border-red-800";
            IconComponent = AlertOctagon;
            break;
          case "impact":
            cardStyle =
              "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 border-l-4 border-l-amber-500";
            badgeStyle =
              "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800";
            IconComponent = AlertTriangle;
            break;
          case "directive":
            cardStyle =
              "bg-purple-50/80 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/60 text-purple-900 dark:text-purple-200 border-l-4 border-l-purple-600";
            badgeStyle =
              "bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-800";
            IconComponent = Scale;
            break;
          case "disclaimer":
            cardStyle =
              "bg-slate-100/90 dark:bg-slate-900/90 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 border-l-4 border-l-slate-700 dark:border-l-slate-400";
            badgeStyle =
              "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-400 dark:border-slate-600";
            IconComponent = ShieldAlert;
            break;
          case "action":
            cardStyle =
              "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-l-4 border-l-emerald-600";
            badgeStyle =
              "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800";
            IconComponent = CheckCircle2;
            break;
          case "note":
            cardStyle =
              "bg-sky-50/80 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900/60 text-sky-900 dark:text-sky-200 border-l-4 border-l-sky-500";
            badgeStyle =
              "bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-800";
            IconComponent = Info;
            break;
          default:
            break;
        }

        return (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border shadow-sm transition ${cardStyle}`}
          >
            {clause.header && (
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border font-mono ${badgeStyle}`}
                >
                  <IconComponent className="w-3 h-3 shrink-0" />
                  <span>{clause.header}</span>
                </span>
              </div>
            )}
            <p className="text-xs leading-relaxed whitespace-pre-wrap font-medium">
              {clause.content}
            </p>
          </div>
        );
      })}
    </div>
  );
};
