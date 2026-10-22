import React, { useState, useEffect } from "react";
import {
  StructuralElement,
  ProjectLevel,
  WorkPackage,
  ElementStatus,
  Gridline,
} from "@/types";
import { dbService } from "@/lib/db";
import { calculatePureGeometricVolume } from "@/lib/elementDiagnostics";
import {
  Save,
  Undo2,
  Check,
  AlertCircle,
  Hash,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface ElementSpreadsheetViewProps {
  elements: StructuralElement[];
  levels: ProjectLevel[];
  packages: WorkPackage[];
  gridlines?: Gridline[];
  onElementsUpdated: () => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
}

const CONCRETE_GRADES = [
  "C20/25",
  "C25/30",
  "C28/35",
  "C30/37",
  "C32/40",
  "C35/45",
  "C40/50",
  "C45/55",
  "C50/60",
];

const STATUS_OPTIONS: { value: ElementStatus; label: string; bg: string; text: string }[] = [
  { value: "PENDING", label: "Pending", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-300" },
  { value: "REBAR_IN_PROGRESS", label: "Rebar Progress", bg: "bg-blue-50 dark:bg-blue-950/50", text: "text-blue-600 dark:text-blue-400" },
  { value: "FORMWORK_IN_PROGRESS", label: "Formwork Progress", bg: "bg-amber-50 dark:bg-amber-950/50", text: "text-amber-600 dark:text-amber-400" },
  { value: "READY_FOR_CASTING", label: "Ready Casting", bg: "bg-indigo-50 dark:bg-indigo-950/50", text: "text-indigo-600 dark:text-indigo-400" },
  { value: "REBAR_INSPECTED", label: "Rebar Inspected", bg: "bg-purple-50 dark:bg-purple-950/50", text: "text-purple-600 dark:text-purple-400" },
  { value: "POURED", label: "Poured", bg: "bg-cyan-50 dark:bg-cyan-950/50", text: "text-cyan-600 dark:text-cyan-400" },
  { value: "APPROVED", label: "Approved", bg: "bg-emerald-50 dark:bg-emerald-950/50", text: "text-emerald-600 dark:text-emerald-400" },
  { value: "REJECTED", label: "Rejected", bg: "bg-red-50 dark:bg-red-950/50", text: "text-red-600 dark:text-red-400" },
];

export const ElementSpreadsheetView: React.FC<ElementSpreadsheetViewProps> = ({
  elements,
  levels,
  packages,
  gridlines = [],
  onElementsUpdated,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  isAllSelected,
}) => {
  // Local working copy of elements for ultra-fast, zero-lag in-line typing
  const [localRows, setLocalRows] = useState<StructuralElement[]>(elements);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize when parent elements change, keeping dirty edits intact
  useEffect(() => {
    setLocalRows((prevRows) => {
      return elements.map((incoming) => {
        const existingDirty = dirtyIds.has(incoming.id)
          ? prevRows.find((r) => r.id === incoming.id)
          : null;
        return existingDirty || incoming;
      });
    });
  }, [elements]);

  // Handle single cell update with live volume recalculation
  const handleCellChange = (
    id: string,
    field: keyof StructuralElement,
    val: any,
  ) => {
    setLocalRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;

        const updated: StructuralElement = {
          ...row,
          [field]: val,
        };

        // If dimension changed, recalculate volume in real-time
        if (
          field === "length" ||
          field === "width" ||
          field === "height" ||
          field === "depth" ||
          field === "diameter" ||
          field === "thickness"
        ) {
          const newVol = calculatePureGeometricVolume(updated);
          updated.calculatedVolume = newVol;
          updated.volume = newVol;

          // If already marked completed, sync achieved volume too
          if (updated.status === "POURED" || updated.status === "APPROVED") {
            updated.achievedVolume = newVol;
          }
        }

        return updated;
      }),
    );

    setDirtyIds((prev) => new Set(prev).add(id));
  };

  // Save all modified elements in batch
  const handleSaveAll = async () => {
    if (dirtyIds.size === 0) return;

    setIsSaving(true);
    try {
      const itemsToSave = localRows.filter((r) => dirtyIds.has(r.id));
      await Promise.all(
        itemsToSave.map((el) =>
          dbService.saveElement({
            ...el,
            updatedAt: new Date().toISOString(),
          }),
        ),
      );

      toast.success(`Saved changes to ${itemsToSave.length} elements!`);
      setDirtyIds(new Set());
      onElementsUpdated();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  // Discard all unsaved edits
  const handleDiscard = () => {
    if (
      dirtyIds.size > 0 &&
      !window.confirm(`Discard unsaved changes on ${dirtyIds.size} element(s)?`)
    ) {
      return;
    }
    setLocalRows(elements);
    setDirtyIds(new Set());
    toast("Unsaved changes discarded", { icon: "↩️" });
  };

  return (
    <div className="space-y-3">
      {/* Dirty Edits Status Bar */}
      {dirtyIds.size > 0 && (
        <div className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-black uppercase tracking-wider">
              {dirtyIds.size} Element(s) Modified
            </span>
            <span className="text-xs text-indigo-200 hidden sm:inline">
              &bull; Changes are pending database commit
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDiscard}
              disabled={isSaving}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-indigo-100 transition-colors flex items-center gap-1"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Discard
            </button>

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-4 py-1 rounded-lg text-xs font-black bg-white hover:bg-slate-100 text-indigo-900 shadow-md transition-all flex items-center gap-1.5"
            >
              {isSaving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-indigo-600" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Spreadsheet Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[72vh]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 shadow-xs">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={onToggleSelectAll}
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3 min-w-[130px]">Identifier</th>
                <th className="py-2.5 px-3 min-w-[110px]">Grid Location</th>
                <th className="py-2.5 px-3 min-w-[100px]">Type</th>
                <th className="py-2.5 px-3 min-w-[80px]">Length (m)</th>
                <th className="py-2.5 px-3 min-w-[80px]">Width (m)</th>
                <th className="py-2.5 px-3 min-w-[100px]" title="Height (H) for Columns/Walls, Depth (D) for Beams">Height / Depth (m)</th>
                <th className="py-2.5 px-3 min-w-[105px]">Orientation</th>
                <th className="py-2.5 px-3 min-w-[80px]">Thick (m)</th>
                <th className="py-2.5 px-3 min-w-[90px] text-right">Volume (m³)</th>
                <th className="py-2.5 px-3 min-w-[110px]">Grade</th>
                <th className="py-2.5 px-3 min-w-[130px]">Rebar Spec</th>
                <th className="py-2.5 px-3 min-w-[140px]">Status</th>
                <th className="py-2.5 px-3 min-w-[130px]">Floor Level</th>
                <th className="py-2.5 px-3 min-w-[100px] text-right">Elevation (m)</th>
                <th className="py-2.5 px-3 min-w-[90px] text-right">Offset (m)</th>
                <th className="py-2.5 px-3 min-w-[130px]">Work Package</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {localRows.map((row) => {
                const isDirty = dirtyIds.has(row.id);
                const isSelected = selectedIds.has(row.id);
                const currStatus = STATUS_OPTIONS.find((s) => s.value === row.status) || STATUS_OPTIONS[0];

                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 transition-colors ${
                      isDirty ? "bg-amber-50/30 dark:bg-amber-950/10" : ""
                    } ${isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""}`}
                  >
                    {/* Checkbox */}
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(row.id)}
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    {/* Element Identifier */}
                    <td className="py-1.5 px-2">
                      <div className="flex items-center gap-1.5">
                        {isDirty && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
                            title="Unsaved changes"
                          />
                        )}
                        <input
                          type="text"
                          value={row.elementName || ""}
                          onChange={(e) =>
                            handleCellChange(row.id, "elementName", e.target.value)
                          }
                          className="w-full px-2 py-1 rounded bg-transparent font-mono font-bold text-slate-900 dark:text-white uppercase focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-indigo-400 focus:outline-none"
                        />
                      </div>
                    </td>

                    {/* Grid Location */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        list={`grid-list-${row.id}`}
                        value={row.grid || ""}
                        placeholder="e.g. 1-2/A-B"
                        onChange={(e) =>
                          handleCellChange(row.id, "grid", e.target.value)
                        }
                        className="w-full px-2 py-1 rounded bg-transparent font-mono text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-indigo-400 focus:outline-none"
                      />
                      <datalist id={`grid-list-${row.id}`}>
                        {gridlines.map((g) => (
                          <option key={g.id} value={g.label || (g as any).name || g.axis} />
                        ))}
                      </datalist>
                    </td>

                    {/* Element Type */}
                    <td className="py-1.5 px-2">
                      <span className="font-bold text-[10px] text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {row.elementType || "ELEMENT"}
                      </span>
                    </td>

                    {/* Length */}
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={row.length ?? ""}
                        placeholder="—"
                        onChange={(e) =>
                          handleCellChange(
                            row.id,
                            "length",
                            e.target.value === "" ? 0 : parseFloat(e.target.value),
                          )
                        }
                        className="w-full px-1.5 py-1 rounded bg-transparent font-mono text-right text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-indigo-400 focus:outline-none"
                      />
                    </td>

                    {/* Width */}
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={row.width ?? ""}
                        placeholder="—"
                        onChange={(e) =>
                          handleCellChange(
                            row.id,
                            "width",
                            e.target.value === "" ? 0 : parseFloat(e.target.value),
                          )
                        }
                        className="w-full px-1.5 py-1 rounded bg-transparent font-mono text-right text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-indigo-400 focus:outline-none"
                      />
                    </td>

                    {/* Height (Col) / Depth (Beam) */}
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={row.height ?? row.depth ?? ""}
                        placeholder={String(row.elementType || "").toUpperCase().includes("BEAM") ? "D: 0.60" : "H: 3.20"}
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                          const isBeam = String(row.elementType || "").toUpperCase().includes("BEAM");
                          if (isBeam) {
                            handleCellChange(row.id, "depth", val);
                          } else {
                            handleCellChange(row.id, "height", val);
                          }
                        }}
                        className="w-full px-1.5 py-1 rounded bg-transparent font-mono text-right text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-indigo-400 focus:outline-none"
                      />
                    </td>

                    {/* Orientation */}
                    <td className="py-1.5 px-2">
                      {String(row.elementType || "").toUpperCase().includes("COLUMN") ? (
                        <select
                          value={
                            row.columnOrientation ||
                            (row.cantileverDirection === "TOP" || row.cantileverDirection === "BOTTOM"
                              ? "VERTICAL"
                              : "HORIZONTAL")
                          }
                          onChange={(e) => {
                            const newOrient = e.target.value as "HORIZONTAL" | "VERTICAL";
                            handleCellChange(row.id, "columnOrientation", newOrient);
                            handleCellChange(row.id, "cantileverDirection", newOrient === "VERTICAL" ? "TOP" : "LEFT");
                          }}
                          className="w-full px-1.5 py-1 rounded bg-transparent text-[10px] font-bold text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-indigo-400 focus:outline-none cursor-pointer"
                        >
                          <option value="HORIZONTAL">↔ Horiz (E-W)</option>
                          <option value="VERTICAL">↕ Vert (N-S)</option>
                        </select>
                      ) : String(row.elementType || "").toUpperCase().includes("SLAB") ? (
                        <select
                          value={row.cantileverDirection || "TOP"}
                          onChange={(e) =>
                            handleCellChange(row.id, "cantileverDirection", e.target.value)
                          }
                          className="w-full px-1.5 py-1 rounded bg-transparent text-[10px] font-bold text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-indigo-400 focus:outline-none cursor-pointer"
                        >
                          <option value="TOP">North (Top)</option>
                          <option value="BOTTOM">South (Bottom)</option>
                          <option value="LEFT">West (Left)</option>
                          <option value="RIGHT">East (Right)</option>
                        </select>
                      ) : (
                        <span className="text-slate-400 text-[10px] pl-2">—</span>
                      )}
                    </td>

                    {/* Thickness */}
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        step="0.025"
                        min="0"
                        value={row.thickness ?? ""}
                        placeholder="—"
                        onChange={(e) =>
                          handleCellChange(
                            row.id,
                            "thickness",
                            e.target.value === "" ? 0 : parseFloat(e.target.value),
                          )
                        }
                        className="w-full px-1.5 py-1 rounded bg-transparent font-mono text-right text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-indigo-400 focus:outline-none"
                      />
                    </td>

                    {/* Volume (Real-time auto calculated) */}
                    <td className="py-1.5 px-3 text-right">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {(row.calculatedVolume || calculatePureGeometricVolume(row)).toFixed(3)}
                      </span>
                    </td>

                    {/* Concrete Grade */}
                    <td className="py-1.5 px-2">
                      <select
                        value={row.concreteGrade || "C35/45"}
                        onChange={(e) =>
                          handleCellChange(row.id, "concreteGrade", e.target.value)
                        }
                        className="w-full px-1.5 py-1 rounded bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-indigo-400 focus:outline-none cursor-pointer"
                      >
                        {CONCRETE_GRADES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Rebar Spec */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={row.rebarSpec || ""}
                        placeholder="e.g. 8T20"
                        onChange={(e) =>
                          handleCellChange(row.id, "rebarSpec", e.target.value)
                        }
                        className="w-full px-1.5 py-1 rounded bg-transparent font-mono text-[11px] text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-indigo-400 focus:outline-none"
                      />
                    </td>

                    {/* Status */}
                    <td className="py-1.5 px-2">
                      <select
                        value={row.status || "PENDING"}
                        onChange={(e) =>
                          handleCellChange(row.id, "status", e.target.value as ElementStatus)
                        }
                        className={`w-full px-2 py-0.5 rounded text-[10px] font-black uppercase border border-transparent focus:outline-none cursor-pointer ${currStatus.bg} ${currStatus.text}`}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Floor Level */}
                    <td className="py-1.5 px-2">
                      <select
                        value={row.levelId || ""}
                        onChange={(e) => {
                          const lvlId = e.target.value;
                          const lvl = levels.find((l) => l.id === lvlId);
                          handleCellChange(row.id, "levelId", lvlId);
                          if (lvl) {
                            handleCellChange(row.id, "levelName", lvl.name);
                            if (lvl.workPackageId) {
                              handleCellChange(row.id, "workPackageId", lvl.workPackageId);
                              const pkg = packages.find((p) => p.id === lvl.workPackageId);
                              handleCellChange(row.id, "workPackageName", pkg?.name || lvl.workPackageName || "");
                            }
                          }
                        }}
                        className="w-full px-1.5 py-1 rounded bg-transparent text-[11px] text-slate-600 dark:text-slate-400 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-indigo-400 focus:outline-none cursor-pointer"
                      >
                        <option value="">No Level</option>
                        {levels.map((lvl) => (
                          <option key={lvl.id} value={lvl.id}>
                            {lvl.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Base Elevation (m) */}
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        step="0.01"
                        value={row.elevation ?? ""}
                        placeholder="—"
                        onChange={(e) =>
                          handleCellChange(
                            row.id,
                            "elevation",
                            e.target.value === "" ? 0 : parseFloat(e.target.value),
                          )
                        }
                        className="w-full px-1.5 py-1 rounded bg-transparent font-mono text-right text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-indigo-400 focus:outline-none"
                      />
                    </td>

                    {/* Elevation Offset (m) */}
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        step="0.01"
                        value={row.elevationOffset ?? ""}
                        placeholder="0.00"
                        onChange={(e) => {
                          const offVal = e.target.value === "" ? 0 : parseFloat(e.target.value);
                          handleCellChange(row.id, "elevationOffset", offVal);
                          const lvl = levels.find((l) => l.id === row.levelId);
                          if (lvl && lvl.elevation !== undefined) {
                            handleCellChange(row.id, "elevation", parseFloat((lvl.elevation + offVal).toFixed(3)));
                          }
                        }}
                        className="w-full px-1.5 py-1 rounded bg-transparent font-mono text-right text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-indigo-400 focus:outline-none"
                      />
                    </td>

                    {/* Work Package */}
                    <td className="py-1.5 px-2">
                      <select
                        value={row.workPackageId || ""}
                        onChange={(e) => {
                          const pkg = packages.find((p) => p.id === e.target.value);
                          handleCellChange(row.id, "workPackageId", e.target.value);
                          if (pkg) {
                            handleCellChange(row.id, "workPackageName", pkg.name);
                          }
                        }}
                        className="w-full px-1.5 py-1 rounded bg-transparent text-[11px] text-slate-600 dark:text-slate-400 focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-indigo-400 focus:outline-none cursor-pointer"
                      >
                        <option value="">No Package</option>
                        {packages.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
