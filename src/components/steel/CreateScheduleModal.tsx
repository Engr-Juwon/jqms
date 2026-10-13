import React, { useState } from "react";
import { useProjectStore } from "@/stores/useProjectStore";
import {
  X,
  Plus,
  Layers,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { BarCuttingSchedule, SteelRebarTest } from "@/types";
import { toast } from "react-hot-toast";

interface CreateScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newScheduleData: {
    title: string;
    levelName: string;
    sourceBBSFileName?: string;
    heatNumber?: string;
    supplier?: string;
    contractualScrapLimit: number;
    initialMode: "EMPTY" | "SAMPLE" | "UPLOAD";
  }) => void;
  existingCount: number;
  steelTests?: SteelRebarTest[];
}

const COMMON_LEVELS = [
  "Foundation / Substructure Level",
  "Basement B1 & Retaining Walls",
  "Ground Floor (+0.000m)",
  "Level 01 (+4.200m)",
  "Level 02 (+7.800m)",
  "Level 03 (+11.400m)",
  "Typical Floor (L04 - L12)",
  "Roof Water Tank & Parapet",
];

export const CreateScheduleModal: React.FC<CreateScheduleModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  existingCount,
  steelTests = [],
}) => {
  const { activeProject } = useProjectStore();
  const nextNum = `BCS-${new Date().getFullYear()}-${String(
    existingCount + 1,
  ).padStart(3, "0")}`;

  const defaultLvl = activeProject?.currentLevelName || "Level 02 (+7.800m)";
  const [title, setTitle] = useState(
    `${defaultLvl.split("(")[0].trim()} Columns & Core Walls - ${nextNum}`,
  );
  const [levelName, setLevelName] = useState(defaultLvl);
  const [customLevel, setCustomLevel] = useState("");
  const [sourceBBSFileName, setSourceBBSFileName] = useState(
    "STR-BBS-DWG-002.pdf",
  );
  const [heatNumber, setHeatNumber] = useState(
    steelTests[0]?.heatNumber || "HT-99830-C",
  );
  const [scrapLimit, setScrapLimit] = useState("3.5");
  const [initialMode, setInitialMode] = useState<"EMPTY" | "SAMPLE" | "UPLOAD">(
    "EMPTY",
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a schedule title.");
      return;
    }

    const effectiveLevel = customLevel.trim() || levelName;

    onCreate({
      title: title.trim(),
      levelName: effectiveLevel,
      sourceBBSFileName: sourceBBSFileName.trim() || undefined,
      heatNumber: heatNumber.trim() || undefined,
      supplier:
        steelTests.find((t) => t.heatNumber === heatNumber)?.supplier ||
        "Emirates Steel",
      contractualScrapLimit: parseFloat(scrapLimit) || 3.5,
      initialMode,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Create New Bar Cutting Schedule
              </h2>
              <p className="text-xs text-slate-500">
                Register a new structural package or floor pour cutting order
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto flex-1 text-xs"
        >
          {/* Schedule Title */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Schedule Title & Package *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Level 02 Suspended Slab & Drop Panels"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          {/* Level Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Structural Level / Elevation
              </label>
              <select
                value={levelName}
                onChange={(e) => {
                  setLevelName(e.target.value);
                  setCustomLevel("");
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {COMMON_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Custom Level (Optional)
              </label>
              <input
                type="text"
                value={customLevel}
                onChange={(e) => setCustomLevel(e.target.value)}
                placeholder="Or type custom floor/zone"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Drawing Ref & Heat Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                BBS Drawing Ref / Source Doc
              </label>
              <input
                type="text"
                value={sourceBBSFileName}
                onChange={(e) => setSourceBBSFileName(e.target.value)}
                placeholder="e.g. STR-BBS-DWG-002_RevB.pdf"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Heat Lot / Mill Certificate
              </label>
              <select
                value={heatNumber}
                onChange={(e) => setHeatNumber(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {steelTests.length > 0 ? (
                  steelTests.map((t) => (
                    <option key={t.id} value={t.heatNumber}>
                      {t.heatNumber} ({t.supplier})
                    </option>
                  ))
                ) : (
                  <option value="HT-99830-C">
                    HT-99830-C (Emirates Steel)
                  </option>
                )}
              </select>
            </div>
          </div>

          {/* Contractual Scrap Limit */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Contractual Scrap Wastage Limit (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="10.0"
                value={scrapLimit}
                onChange={(e) => setScrapLimit(e.target.value)}
                className="w-32 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-slate-500">
                Typical construction contract specification allows 3.0% - 5.0%
                scrap.
              </span>
            </div>
          </div>

          {/* Initial Intake Option */}
          <div className="pt-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Initial Rebar Intake Choice
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setInitialMode("EMPTY")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  initialMode === "EMPTY"
                    ? "bg-amber-500/10 border-amber-500 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/20"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                <div className="font-bold flex items-center justify-between mb-1">
                  <span>Start Empty</span>
                  {initialMode === "EMPTY" && (
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Add rebar entries manually row by row.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setInitialMode("UPLOAD")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  initialMode === "UPLOAD"
                    ? "bg-amber-500/10 border-amber-500 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/20"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                <div className="font-bold flex items-center justify-between mb-1">
                  <span>Upload BBS Document</span>
                  {initialMode === "UPLOAD" && (
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Import PDF or CSV after creating.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setInitialMode("SAMPLE")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  initialMode === "SAMPLE"
                    ? "bg-amber-500/10 border-amber-500 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/20"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                <div className="font-bold flex items-center justify-between mb-1">
                  <span>Load Sample Bars</span>
                  {initialMode === "SAMPLE" && (
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pre-load with typical beam & column bars.
                </p>
              </button>
            </div>
          </div>

          {/* Footer CTAs */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Schedule Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
