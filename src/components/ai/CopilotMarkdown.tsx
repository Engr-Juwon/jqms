import React from "react";

interface CopilotMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Normalizes LaTeX math notation into clean, natural engineering symbols
 */
function sanitizeLatex(text: string): string {
  if (!text) return "";

  return (
    text
      // Common LaTeX math symbols
      .replace(/\\ge(q)?\b/g, "≥")
      .replace(/\\le(q)?\b/g, "≤")
      .replace(/\\pm\b/g, "±")
      .replace(/\\times\b/g, "×")
      .replace(/\\div\b/g, "÷")
      .replace(/\\approx\b/g, "≈")
      .replace(/\\neq\b/g, "≠")
      .replace(/\\infty\b/g, "∞")
      .replace(/\\degree\b/g, "°")
      .replace(/\^\{\\circ\}|\^\\circ/g, "°")
      .replace(/\\%/g, "%")
      .replace(/\\&/g, "&")
      .replace(/\\_/g, "_")
      .replace(/\\\{/g, "{")
      .replace(/\\\}/g, "}")
      // Subscripts: f_{cu} -> f_cu, f_{ck} -> f_ck
      .replace(/_\{([a-zA-Z0-9]+)\}/g, "_$1")
      // Superscripts: m^3 -> m³, m^2 -> m²
      .replace(/\^2\b/g, "²")
      .replace(/\^3\b/g, "³")
      // Remove inline LaTeX dollar wrappers like $L/300$ or $\ge 100\%$ -> L/300 or ≥ 100%
      .replace(/\$([^$]+)\$/g, "$1")
      // Remove escaped literal dollar signs
      .replace(/\\\$/g, "$")
  );
}

/**
 * Parses inline formatting: **bold**, *italic*, `code`, and [links](url)
 */
function renderInline(text: string): React.ReactNode[] {
  // Regex splits on bold (**...**), inline code (`...`), italic (*...* or _..._), link ([...](...))
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*|\[.*?\]\(.*?\))/g;
  const tokens = text.split(regex);

  tokens.forEach((token, idx) => {
    if (!token) return;

    if (token.startsWith("**") && token.endsWith("**") && token.length >= 4) {
      parts.push(
        <strong
          key={idx}
          className="font-bold text-slate-900 dark:text-white"
        >
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`") && token.length >= 2) {
      parts.push(
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-200/70 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("*") && token.endsWith("*") && token.length >= 2) {
      parts.push(
        <em key={idx} className="italic text-slate-700 dark:text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const match = token.match(/^\[(.*?)\]\((.*?)\)$/);
      if (match) {
        parts.push(
          <a
            key={idx}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 dark:text-brand-400 underline underline-offset-2 hover:opacity-80"
          >
            {match[1]}
          </a>
        );
      } else {
        parts.push(token);
      }
    } else {
      parts.push(token);
    }
  });

  return parts;
}

/**
 * Rich Markdown renderer tailored for Jay-QMS Technical Copilot chats.
 * Formats headings, bullet points, numbered lists, code blocks, and cleans math symbols.
 */
export const CopilotMarkdown: React.FC<CopilotMarkdownProps> = ({ content, className = "" }) => {
  const cleaned = sanitizeLatex(content);
  const lines = cleaned.split("\n");

  const nodes: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code blocks ```
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        nodes.push(
          <div
            key={`code-${i}`}
            className="my-2 p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto border border-slate-800"
          >
            {codeLang && (
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1 pb-1 border-b border-slate-800">
                {codeLang}
              </div>
            )}
            <pre className="whitespace-pre">{codeBuffer.join("\n")}</pre>
          </div>
        );
        codeBuffer = [];
        inCodeBlock = false;
        codeLang = "";
      } else {
        inCodeBlock = true;
        codeLang = trimmed.replace(/^```/, "").trim();
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Empty lines
    if (!trimmed) {
      nodes.push(<div key={`spacer-${i}`} className="h-1.5" />);
      continue;
    }

    // Dividers: --- or ***
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      nodes.push(
        <hr
          key={`hr-${i}`}
          className="my-2.5 border-slate-300 dark:border-slate-700/60"
        />
      );
      continue;
    }

    // Headings: ####, ###, ##, #
    if (trimmed.startsWith("#### ")) {
      nodes.push(
        <h5
          key={`h4-${i}`}
          className="font-bold text-xs tracking-tight text-brand-700 dark:text-brand-300 mt-2.5 mb-1 flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 inline-block" />
          {renderInline(trimmed.replace(/^####\s+/, ""))}
        </h5>
      );
      continue;
    }

    if (trimmed.startsWith("### ")) {
      nodes.push(
        <h4
          key={`h3-${i}`}
          className="font-bold text-xs tracking-tight text-slate-900 dark:text-white mt-3 mb-1.5 border-b border-slate-200 dark:border-slate-700/50 pb-1"
        >
          {renderInline(trimmed.replace(/^###\s+/, ""))}
        </h4>
      );
      continue;
    }

    if (trimmed.startsWith("## ")) {
      nodes.push(
        <h3
          key={`h2-${i}`}
          className="font-bold text-sm tracking-tight text-slate-900 dark:text-white mt-3.5 mb-1.5"
        >
          {renderInline(trimmed.replace(/^##\s+/, ""))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith("# ")) {
      nodes.push(
        <h2
          key={`h1-${i}`}
          className="font-extrabold text-sm tracking-tight text-brand-600 dark:text-brand-400 mt-4 mb-2"
        >
          {renderInline(trimmed.replace(/^#\s+/, ""))}
        </h2>
      );
      continue;
    }

    // Blockquote: > text
    if (trimmed.startsWith("> ")) {
      nodes.push(
        <blockquote
          key={`bq-${i}`}
          className="pl-2.5 my-1.5 border-l-2 border-brand-500 text-slate-600 dark:text-slate-300 italic text-[11px]"
        >
          {renderInline(trimmed.replace(/^>\s+/, ""))}
        </blockquote>
      );
      continue;
    }

    // Bullet lists (*, -, +)
    // Check indentation level for nested sub-bullets
    const indentMatch = line.match(/^(\s*)([*+-])\s+(.*)$/);
    if (indentMatch) {
      const indentSpaces = indentMatch[1].length;
      const isSubBullet = indentSpaces >= 2;
      const bulletText = indentMatch[3];

      nodes.push(
        <div
          key={`bullet-${i}`}
          className={`flex items-start gap-2 my-1 leading-relaxed ${
            isSubBullet ? "ml-4 text-slate-700 dark:text-slate-300" : "text-slate-800 dark:text-slate-200"
          }`}
        >
          <span
            className={`select-none shrink-0 ${
              isSubBullet
                ? "text-[9px] text-slate-400 mt-1"
                : "text-brand-500 font-bold mt-0.5 text-xs"
            }`}
          >
            {isSubBullet ? "◦" : "•"}
          </span>
          <div className="flex-1 min-w-0">{renderInline(bulletText)}</div>
        </div>
      );
      continue;
    }

    // Numbered lists: 1. , 2.
    const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const indentSpaces = numMatch[1].length;
      const isSub = indentSpaces >= 2;
      const numStr = numMatch[2];
      const listText = numMatch[3];

      nodes.push(
        <div
          key={`num-${i}`}
          className={`flex items-start gap-2 my-1 leading-relaxed ${
            isSub ? "ml-4" : ""
          }`}
        >
          <span className="font-bold text-brand-600 dark:text-brand-400 select-none text-[11px] shrink-0 mt-0.5">
            {numStr}.
          </span>
          <div className="flex-1 min-w-0">{renderInline(listText)}</div>
        </div>
      );
      continue;
    }

    // Standard paragraph line
    nodes.push(
      <p key={`p-${i}`} className="my-1 leading-relaxed">
        {renderInline(trimmed)}
      </p>
    );
  }

  // Handle unclosed code block if any
  if (inCodeBlock && codeBuffer.length > 0) {
    nodes.push(
      <pre
        key="code-unclosed"
        className="my-2 p-2 rounded bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto"
      >
        {codeBuffer.join("\n")}
      </pre>
    );
  }

  return (
    <div className={`space-y-0.5 leading-relaxed text-xs ${className}`}>
      {nodes}
    </div>
  );
};
