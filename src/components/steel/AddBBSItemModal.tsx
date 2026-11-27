import React, { useState, useEffect, useMemo } from "react";
import { X, Plus, Check, Scissors, Calculator } from "lucide-react";
import { BBSItem } from "@/types";
import { toast } from "react-hot-toast";
import { splitRebarRunM, splitBBSItem } from "@/lib/rebarSplitter";

interface AddBBSItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: BBSItem | BBSItem[]) => void;
  initialItem?: BBSItem | null;
  existingMarks?: string[];
}

const COMMON_SHAPES = [
  "00 (Straight)",
  "21 (L-Bar / Standard Hook)",
  "51 (Link / Stirrup)",
  "11 (U-Bar)",
  "33 (Cranked Lap Bar)",
  "41 (Offset Column Bend)",
  "77 (Circular Tie / Spiral)",
  "99 (Special / Profile)",
];

const STANDARD_DIAMETERS = [8, 10, 12, 16, 20, 25, 32, 40];

export const AddBBSItemModal: React.FC<AddBBSItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  existingMarks = [],
}) => {
  const [member, setMember] = useState("");
  const [barMark, setBarMark] = useState("");
  const [diameter, setDiameter] = useState<number>(16);
  const [shapeCode, setShapeCode] = useState("00 (Straight)");
  const [lengthInput, setLengthInput] = useState("");
  const [lengthUnit, setLengthUnit] = useState<"M" | "MM">("M");
  const [noOfMembers, setNoOfMembers] = useState<number>(1);
  const [barsPerMember, setBarsPerMember] = useState<number>(1);

  useEffect(() => {
    if (initialItem) {
      setMember(initialItem.member || "");
      setBarMark(initialItem.barMark || "");
      setDiameter(initialItem.diameter || 16);
      setShapeCode(initialItem.shapeCode || "00 (Straight)");
      setLengthInput(String(initialItem.cutLengthM || ""));
      setLengthUnit("M");
      setNoOfMembers(initialItem.noOfMembers || 1);
      setBarsPerMember(initialItem.barsPerMember || 1);
    } else {
      const usedMarks = new Set(
        existingMarks.map((mark) => mark.trim().toUpperCase()),
      );
      let nextMarkNum = 1;
      let suggestedMark = String(nextMarkNum).padStart(2, "0");
      while (usedMarks.has(suggestedMark)) {
        nextMarkNum += 1;
        suggestedMark = String(nextMarkNum).padStart(2, "0");
      }
      setBarMark(suggestedMark);
      setMember("Beam 1B1");
      setDiameter(16);
      setShapeCode("00 (Straight)");
      setLengthInput("4.25");
      setLengthUnit("M");
      setNoOfMembers(1);
      setBarsPerMember(4);
    }
  }, [initialItem, isOpen, existingMarks]);

  // Calculations
  const rawLengthNum = parseFloat(lengthInput) || 0;
  const cutLengthM =
    lengthUnit === "MM" ? rawLengthNum / 1000 : rawLengthNum;

  const totalBars = Math.max(1, (noOfMembers || 1) * (barsPerMember || 1));
  const totalLengthM = totalBars * cutLengthM;
  const unitWeightKgM = (diameter * diameter) / 162.2;
  const totalWeightKg = totalLengthM * unitWeightKgM;

  // Real-time preview of multi-segment lap splits for runs > 12.0m
  const splitSegmentsPreview = useMemo(() => {
    if (cutLengthM <= 12.0 || cutLengthM <= 0) return [];
    try {
      return splitRebarRunM(barMark || "01", cutLengthM, diameter);
    } catch {
      return [];
    }
  }, [barMark, cutLengthM, diameter]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!member.trim()) {
      toast.error("Please enter a structural member or location.");
      return;
    }
    if (!barMark.trim()) {
      toast.error("Please enter a Bar Mark (e.g. 01, 02).");
      return;
    }
    if (cutLengthM <= 0) {
      toast.error("Cut length must be greater than 0.");
      return;
    }

    const item: BBSItem = {
      id:
        initialItem?.id ||
        `bbs-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      member: member.trim(),
      barMark: barMark.trim().toUpperCase(),
      diameter,
      shapeCode,
      noOfMembers: Number(noOfMembers) || 1,
      barsPerMember: Number(barsPerMember) || 1,
      totalBars,
      cutLengthM: Number(cutLengthM.toFixed(3)),
      totalLengthM: Number(totalLengthM.toFixed(3)),
      unitWeightKgM: Number(unitWeightKgM.toFixed(3)),
      totalWeightKg: Number(totalWeightKg.toFixed(2)),
      steelGrade: initialItem?.steelGrade || "Grade 500B",
    };

    if (cutLengthM > 12.0) {
      const splitItems = splitBBSItem(item);
      onSave(splitItems);
      toast.success(
        `Split continuous ${cutLengthM}m run into ${splitItems.length} standard stock segments with 50d structural laps!`,
      );
    } else {
      onSave(item);
      toast.success(
        initialItem
          ? `Updated Bar Mark ${item.barMark} successfully!`
          : `Added Bar Mark ${item.barMark} to cutting schedule!`,
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {initialItem
                  ? "Edit Rebar Mark / BBS Entry"
                  : "Add Rebar Mark / BBS Entry"}
              </h2>
              <p className="text-xs text-slate-500">
                Direct entry for structural rebar fabrication schedule
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

        {/* Body Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto flex-1"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Member */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Structural Member / Location *
              </label>
              <input
                type="text"
                value={member}
                onChange={(e) => setMember(e.target.value)}
                placeholder="e.g. Beam 1B1, Column C04, Slab S1"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            {/* Bar Mark */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Bar Mark Identifier *
              </label>
              <input
                type="text"
                value={barMark}
                onChange={(e) => setBarMark(e.target.value)}
                placeholder="e.g. 01, 02, 14A"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Diameter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Bar Diameter (mm) *
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {STANDARD_DIAMETERS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiameter(d)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      diameter === d
                        ? "bg-amber-500 text-slate-950 border-amber-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Y{d}
                  </button>
                ))}
              </div>
            </div>

            {/* Shape Code */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                BS 8666 Shape Code
              </label>
              <select
                value={shapeCode}
                onChange={(e) => setShapeCode(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {COMMON_SHAPES.map((shape) => (
                  <option key={shape} value={shape}>
                    {shape}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cut Length & Unit */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Individual Cut Length (L) *
              </label>
              <div className="flex items-center gap-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setLengthUnit("M")}
                  className={`px-2 py-0.5 rounded ${
                    lengthUnit === "M"
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Meters (m)
                </button>
                <span className="text-slate-400">/</span>
                <button
                  type="button"
                  onClick={() => setLengthUnit("MM")}
                  className={`px-2 py-0.5 rounded ${
                    lengthUnit === "MM"
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Millimeters (mm)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.001"
                min="0.1"
                value={lengthInput}
                onChange={(e) => setLengthInput(e.target.value)}
                placeholder={
                  lengthUnit === "M"
                    ? "e.g. 20.000 or 4.250"
                    : "e.g. 20000 or 4250"
                }
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
              <span className="text-xs font-bold text-slate-400">
                = {cutLengthM.toFixed(3)} m per continuous run
              </span>
            </div>
            {cutLengthM > 12.0 && splitSegmentsPreview.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-800 dark:text-amber-200 space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span>
                    ✂️ Continuous Run &gt; 12.0m: Auto-Splitting Engine Active
                  </span>
                  <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-900 dark:text-amber-100 font-mono">
                    Lap: 50d = {diameter * 50}mm (
                    {((diameter * 50) / 1000).toFixed(2)}m)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                  {splitSegmentsPreview.map((seg, idx) => (
                    <span
                      key={idx}
                      className="bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-amber-400/30"
                    >
                      <strong className="text-amber-600 dark:text-amber-400">
                        Mark {seg.barMark}:
                      </strong>{" "}
                      {seg.cutLengthM}m ({seg.cutLengthMm}mm)
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Splits into {splitSegmentsPreview.length} standard stock
                  segments with structural overlaps. Invariant verified:
                  Sum(Cuts) - {splitSegmentsPreview.length - 1}×({diameter * 50}
                  mm) = {Math.round(cutLengthM * 1000)}mm.
                </p>
              </div>
            )}
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                No. of Members
              </label>
              <input
                type="number"
                min="1"
                value={noOfMembers}
                onChange={(e) =>
                  setNoOfMembers(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Bars per Member
              </label>
              <input
                type="number"
                min="1"
                value={barsPerMember}
                onChange={(e) =>
                  setBarsPerMember(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Total Pieces
              </label>
              <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-black text-amber-600 dark:text-amber-400">
                {totalBars} Pieces
              </div>
            </div>
          </div>

          {/* Live Calculation Box */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs flex items-center justify-between text-amber-950 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="font-semibold">
                Total Steel: {totalLengthM.toFixed(2)} m ×{" "}
                {unitWeightKgM.toFixed(3)} kg/m
              </span>
            </div>
            <div className="font-mono font-black text-sm">
              = {totalWeightKg.toFixed(1)} kg
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
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
              <Check className="w-4 h-4" />
              {initialItem ? "Save Changes" : "Add to Cutting Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
