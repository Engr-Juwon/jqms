import React from "react";
import { CuttingPattern } from "@/types";
import { Scissors, CheckCircle, Layers } from "lucide-react";

interface CuttingPatternCardProps {
  pattern: CuttingPattern;
  index: number;
  diameterMm?: number;
}

const CUT_COLORS = [
  "bg-blue-500/20 border-blue-500/40 text-blue-700 dark:text-blue-300",
  "bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300",
  "bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
  "bg-purple-500/20 border-purple-500/40 text-purple-700 dark:text-purple-300",
  "bg-cyan-500/20 border-cyan-500/40 text-cyan-700 dark:text-cyan-300",
  "bg-rose-500/20 border-rose-500/40 text-rose-700 dark:text-rose-300",
];

export const CuttingPatternCard: React.FC<CuttingPatternCardProps> = ({
  pattern,
  index,
  diameterMm,
}) => {
  const stockLength = pattern.stockLengthM || 12.0;
  const dia = pattern.diameter || diameterMm || 12;
  const isTypeT =
    pattern.steelGrade?.includes("T") ||
    (!pattern.steelGrade?.includes("Y") && pattern.steelGrade?.includes("500"));
  const markPrefix = isTypeT ? `T${dia}` : `Y${dia}`;

  // Diameter theme color for clear visual distinction (T12 vs T16 etc.)
  const getDiameterTheme = (d: number) => {
    switch (d) {
      case 10:
        return {
          badge:
            "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",
          pill: "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200",
        };
      case 12:
        return {
          badge:
            "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
          pill: "bg-sky-500/20 text-sky-800 dark:text-sky-200",
        };
      case 16:
        return {
          badge:
            "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
          pill: "bg-purple-500/20 text-purple-800 dark:text-purple-200",
        };
      case 20:
        return {
          badge:
            "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
          pill: "bg-amber-500/20 text-amber-800 dark:text-amber-200",
        };
      case 25:
        return {
          badge:
            "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
          pill: "bg-emerald-500/20 text-emerald-800 dark:text-emerald-200",
        };
      case 32:
        return {
          badge:
            "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
          pill: "bg-rose-500/20 text-rose-800 dark:text-rose-200",
        };
      default:
        return {
          badge:
            "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
          pill: "bg-blue-500/20 text-blue-800 dark:text-blue-200",
        };
    }
  };

  const theme = getDiameterTheme(dia);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-4">
      {/* Pattern Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-black text-sm flex items-center justify-center">
            #{index + 1}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                {pattern.patternId}
              </h4>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border flex items-center gap-1 ${theme.badge}`}
              >
                <Layers className="w-3 h-3" />
                {markPrefix} ({dia}mm) Stock Bar
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cut from standard {stockLength.toFixed(2)}m commercial stock bar ·{" "}
              {pattern.steelGrade || "Grade 500B"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400 block">
              {markPrefix} 12m Bars to Issue
            </span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              × {pattern.stockBarQuantity}{" "}
              {pattern.stockBarQuantity === 1 ? "Bar" : "Bars"}
            </span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold ${
              pattern.isReusableOffcut
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                : pattern.wastePercentage <= 3.5
                  ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500/30 text-blue-700 dark:text-blue-400"
                  : "bg-amber-50 dark:bg-amber-950/40 border-amber-500/30 text-amber-700 dark:text-amber-400"
            }`}
          >
            {pattern.isReusableOffcut ? (
              <CheckCircle className="w-3.5 h-3.5" />
            ) : (
              <Scissors className="w-3.5 h-3.5" />
            )}
            <span>
              {pattern.isReusableOffcut
                ? `Salvage Offcut: ${pattern.offcutLengthM.toFixed(2)}m`
                : `Scrap: ${pattern.wastePercentage.toFixed(1)}% (${pattern.offcutLengthM.toFixed(2)}m)`}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Bar Cutting Track (12m Bar) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <span>0.00m (Lead End)</span>
          <span className="font-mono">
            Used: {pattern.totalCutLengthM.toFixed(2)}m /{" "}
            {stockLength.toFixed(2)}m (
            {(
              ((stockLength - pattern.offcutLengthM) / stockLength) *
              100
            ).toFixed(1)}
            % Yield)
          </span>
          <span>{stockLength.toFixed(2)}m (Tail End)</span>
        </div>

        {/* The 12m Visual Bar */}
        <div className="w-full h-11 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex border border-slate-300 dark:border-slate-700 p-1 gap-1">
          {pattern.cuts.map((cut, cutIdx) => {
            const pct = (cut.cutLengthM / stockLength) * 100;
            const color = CUT_COLORS[cutIdx % CUT_COLORS.length];
            return (
              <div
                key={cutIdx}
                style={{ width: `${pct}%` }}
                className={`h-full rounded-lg border flex flex-col justify-center items-center px-1 text-center transition-transform hover:scale-[1.02] cursor-default ${color}`}
                title={`${cut.member} - Mark ${cut.barMark} (${markPrefix}): ${cut.cutLengthM.toFixed(3)}m`}
              >
                <span className="text-[11px] font-black truncate max-w-full leading-tight">
                  Mark {cut.barMark}
                </span>
                <span className="text-[9px] font-mono opacity-90 truncate max-w-full">
                  {cut.cutLengthM.toFixed(2)}m
                </span>
              </div>
            );
          })}

          {/* Offcut / Scrap Segment */}
          {pattern.offcutLengthM > 0 && (
            <div
              style={{
                width: `${(pattern.offcutLengthM / stockLength) * 100}%`,
              }}
              className={`h-full rounded-lg border border-dashed flex flex-col justify-center items-center px-1 text-center ${
                pattern.isReusableOffcut
                  ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-400"
              }`}
              title={
                pattern.isReusableOffcut
                  ? `Reusable Offcut: ${pattern.offcutLengthM.toFixed(2)}m (Salvageable)`
                  : `Scrap Cut: ${pattern.offcutLengthM.toFixed(2)}m`
              }
            >
              <span className="text-[10px] font-bold truncate max-w-full leading-tight">
                {pattern.isReusableOffcut ? "Offcut" : "Scrap"}
              </span>
              <span className="text-[9px] font-mono opacity-80 truncate max-w-full">
                {pattern.offcutLengthM.toFixed(2)}m
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Piece Breakdown Table */}
      <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800/60 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {pattern.cuts.map((cut, cutIdx) => (
            <div key={cutIdx} className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 font-mono text-[10px] font-bold flex items-center justify-center text-slate-700 dark:text-slate-300 mt-0.5 shrink-0">
                {cutIdx + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black font-mono border ${theme.badge}`}
                  >
                    {markPrefix}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    Mark {cut.barMark}
                  </span>
                  <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                    ({cut.cutLengthM.toFixed(2)}m)
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  {cut.member}
                </p>
                <p className="text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                  Total Pieces: {pattern.stockBarQuantity}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
