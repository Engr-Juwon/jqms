import React, { useState, useEffect } from "react";
import { Copy, X, Layers, Building2, Check, Sparkles, AlertCircle } from "lucide-react";
import { dbService } from "@/lib/db";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { StructuralElement, ElementType, ConcreteGrade } from "@/types";
import { toast } from "react-hot-toast";

interface BulkElementGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  levels: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
}

const CONCRETE_GRADES: ConcreteGrade[] = ["C20/25", "C25/30", "C30/37", "C35/45", "C40/50", "C50/60"];

export const BulkElementGenerator: React.FC<BulkElementGeneratorProps> = ({
  isOpen,
  onClose,
  levels,
  onSuccess,
}) => {
  const { currentUser, company } = useAuthStore();
  const { activeProject } = useProjectStore();

  const [levelId, setLevelId] = useState(
    activeProject?.currentLevelId || levels[0]?.id || "",
  );
  useEffect(() => {
    if (activeProject?.currentLevelId) {
      setLevelId(activeProject.currentLevelId);
    }
  }, [activeProject?.currentLevelId]);
  const [elementType, setElementType] = useState<ElementType>("COLUMN");
  const [prefix, setPrefix] = useState("C-");
  const [startIndex, setStartIndex] = useState(1);
  const [count, setCount] = useState(10);
  const [gridPrefix, setGridPrefix] = useState("Grid ");
  const [concreteGrade, setConcreteGrade] = useState<ConcreteGrade>("C35/45");
  const [rebarSpec, setRebarSpec] = useState("12T25, T10-150");

  // Geometry
  const [length, setLength] = useState(500);
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(3200);
  const [thickness, setThickness] = useState(250);
  const [columnShape, setColumnShape] = useState<"rectangular" | "circular">("rectangular");
  const [diameter, setDiameter] = useState(600);

  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject?.id || !levelId) {
      toast.error("Please select an active project level.");
      return;
    }

    if (count < 1 || count > 100) {
      toast.error("Count must be between 1 and 100 elements per batch.");
      return;
    }

    setIsGenerating(true);
    const selectedLevel = levels.find((l) => l.id === levelId);
    const elementsToCreate: StructuralElement[] = [];

    // Calculate unit dimensions and volume
    const lM = (length || 0) / 1000;
    const wM = (width || 0) / 1000;
    const hM = (height || 0) / 1000;
    const tM = (thickness || 0) / 1000;
    const dM = (diameter || 0) / 1000;

    let unitVolume = 0;
    let unitFormwork = 0;

    if (elementType === "COLUMN") {
      if (columnShape === "circular") {
        const radius = dM / 2;
        unitVolume = Math.PI * radius * radius * hM;
        unitFormwork = 2 * Math.PI * radius * hM;
      } else {
        unitVolume = lM * wM * hM;
        unitFormwork = 2 * (lM + wM) * hM;
      }
    } else if (elementType === "BEAM") {
      unitVolume = lM * wM * hM;
      unitFormwork = (2 * hM + wM) * lM;
    } else if (elementType === "SLAB") {
      unitVolume = lM * wM * tM;
      unitFormwork = lM * wM;
    } else if (elementType === "WALL") {
      unitVolume = lM * tM * hM;
      unitFormwork = 2 * (lM * hM);
    } else {
      unitVolume = lM * wM * hM;
      unitFormwork = 2 * (lM + wM) * hM;
    }

    unitVolume = parseFloat(unitVolume.toFixed(3));
    unitFormwork = parseFloat(unitFormwork.toFixed(3));

    for (let i = 0; i < count; i++) {
      const idx = startIndex + i;
      const numStr = idx < 10 ? `0${idx}` : `${idx}`;
      const elementName = `${prefix}${numStr}`;
      const grid = `${gridPrefix}${numStr}`;

      const element: StructuralElement = {
        id: `elem-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        projectId: activeProject.id,
        companyId: currentUser?.companyId || company?.id || activeProject.companyId || "",
        elementName,
        elementType,
        levelId,
        levelName: selectedLevel?.name || "Level",
        grid,
        gridAxis: grid,
        status: "PENDING",
        concreteGrade,
        rebarSpec,
        dimensions: {
          length: Number(length),
          width: Number(width),
          height: Number(height),
        },
        length: Number(length),
        width: Number(width),
        height: Number(height),
        thickness: Number(thickness),
        diameter: Number(diameter),
        columnShape,
        calculatedVolume: unitVolume,
        calculatedFormworkArea: unitFormwork,
        achievedVolume: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      elementsToCreate.push(element);
    }

    try {
      await dbService.saveElements(elementsToCreate);
      toast.success(`Successfully generated ${elementsToCreate.length} elements!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate elements.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 border border-brand-500/30 rounded-xl text-brand-600 dark:text-brand-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Bulk Element Generator</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rapidly create sequences of columns, beams, slabs, or walls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Level</label>
              <select
                value={levelId}
                onChange={(e) => setLevelId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                required
              >
                {levels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Element Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Element Type</label>
              <select
                value={elementType}
                onChange={(e) => {
                  const t = e.target.value as ElementType;
                  setElementType(t);
                  if (t === "COLUMN") setPrefix("C-");
                  else if (t === "BEAM") setPrefix("B-");
                  else if (t === "SLAB") setPrefix("S-");
                  else if (t === "WALL") setPrefix("W-");
                  else if (t === "FOOTING") setPrefix("FT-");
                  else setPrefix("EL-");
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              >
                <option value="COLUMN">Column</option>
                <option value="BEAM">Beam</option>
                <option value="SLAB">Slab</option>
                <option value="WALL">Wall</option>
                <option value="FOOTING">Footing</option>
                <option value="STAIR">Stairs</option>
              </select>
            </div>
          </div>

          {/* Sequence Config */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
              <Copy className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" /> Naming Sequence
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Prefix</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  placeholder="C-"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Start Number</label>
                <input
                  type="number"
                  min="1"
                  value={startIndex}
                  onChange={(e) => setStartIndex(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Total Count</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Preview: <span className="text-brand-600 dark:text-brand-400 font-mono font-bold">{prefix}{startIndex < 10 ? `0${startIndex}` : startIndex}</span> to <span className="text-brand-600 dark:text-brand-400 font-mono font-bold">{prefix}{(startIndex + count - 1) < 10 ? `0${startIndex + count - 1}` : startIndex + count - 1}</span>
            </p>
          </div>

          {/* Geometry & Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {elementType === "COLUMN" && (
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Shape</label>
                <select
                  value={columnShape}
                  onChange={(e) => setColumnShape(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                >
                  <option value="rectangular">Rectangular</option>
                  <option value="circular">Circular</option>
                </select>
              </div>
            )}

            {columnShape === "circular" && elementType === "COLUMN" ? (
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Diameter (mm)</label>
                <input
                  type="number"
                  value={diameter}
                  onChange={(e) => setDiameter(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Length (mm)</label>
                  <input
                    type="number"
                    value={length}
                    onChange={(e) => setLength(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Width (mm)</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Height / Depth (mm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Concrete Grade</label>
              <select
                value={concreteGrade}
                onChange={(e) => setConcreteGrade(e.target.value as ConcreteGrade)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
              >
                {CONCRETE_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Rebar Spec</label>
              <input
                type="text"
                value={rebarSpec}
                onChange={(e) => setRebarSpec(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 transition"
            >
              {isGenerating ? (
                <span>Generating...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Generate {count} Elements</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
