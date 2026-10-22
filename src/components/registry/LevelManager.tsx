import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Sparkles,
  Edit3,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Save,
  Briefcase,
  X,
} from "lucide-react";
import { dbService } from "@/lib/db";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { writeAudit } from "@/lib/audit";
import { ProjectLevel, StructuralElement, WorkPackage } from "@/types";
import { calculateLevelProgressList, EnrichedLevelProgress } from "@/lib/levelCalculations";
import { toast } from "react-hot-toast";

export const LevelManager: React.FC = () => {
  const { currentUser, company } = useAuthStore();
  const { activeProject, setCurrentLevel } = useProjectStore();
  const currentProjId = activeProject?.id || "";
  const currentCompId = currentUser?.companyId || company?.id || activeProject?.companyId || "";

  const [levels, setLevels] = useState<ProjectLevel[]>([]);
  const [elements, setElements] = useState<StructuralElement[]>([]);
  const [packages, setPackages] = useState<WorkPackage[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Level State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLevelName, setNewLevelName] = useState("");
  const [newElevation, setNewElevation] = useState(0);
  const [newLevelPosition, setNewLevelPosition] = useState<"TOP" | "BASE" | "CUSTOM">("TOP");
  const [newLevelCustomOrder, setNewLevelCustomOrder] = useState(1);
  const [newWorkPackageId, setNewWorkPackageId] = useState("");

  // Edit Level State
  const [editingLevel, setEditingLevel] = useState<ProjectLevel | null>(null);
  const [editLevelName, setEditLevelName] = useState("");
  const [editElevation, setEditElevation] = useState(0);
  const [editOrder, setEditOrder] = useState(1);
  const [editWorkPackageId, setEditWorkPackageId] = useState("");

  const loadData = async () => {
    if (!currentProjId) return;
    setLoading(true);
    try {
      const [lvlList, elemList, pkgList] = await Promise.all([
        dbService.getLevels(currentProjId, currentCompId),
        dbService.getElements(currentProjId, currentCompId),
        dbService.getWorkPackages(currentProjId, currentCompId),
      ]);
      setLevels(lvlList);
      setElements(elemList);
      setPackages(pkgList);
    } catch (err) {
      console.error("Failed to load levels:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentProjId, currentCompId]);

  const enrichedLevels: EnrichedLevelProgress[] = calculateLevelProgressList(levels, elements);

  const handleCreateLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProjId || !newLevelName.trim()) return;

    let targetOrder = levels.length + 1;
    if (newLevelPosition === "BASE") {
      targetOrder = 0.5;
    } else if (newLevelPosition === "CUSTOM") {
      targetOrder = Number(newLevelCustomOrder) || levels.length + 1;
    }

    const newLvl: ProjectLevel = {
      id: `lvl-${Date.now()}`,
      projectId: currentProjId,
      companyId: currentCompId,
      name: newLevelName.trim(),
      elevation: Number(newElevation),
      order: targetOrder,
      workPackageId: newWorkPackageId || undefined,
      workPackageName: packages.find((p) => p.id === newWorkPackageId)?.name || undefined,
    };

    const updatedList = [...levels, newLvl]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.elevation ?? 0) - (b.elevation ?? 0))
      .map((l, idx) => ({ ...l, order: idx + 1 }));

    try {
      await dbService.saveLevels(updatedList);
      toast.success(`Level "${newLvl.name}" created.`);
      setShowAddModal(false);
      setNewLevelName("");
      setNewElevation(0);
      setNewLevelPosition("TOP");
      setNewWorkPackageId("");
      loadData();
    } catch (err) {
      toast.error("Failed to create level.");
    }
  };

  const handleMoveLevel = async (index: number, direction: "HIGHER" | "LOWER") => {
    const list = [...enrichedLevels];
    const targetIndex = direction === "HIGHER" ? index + 1 : index - 1;

    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    const normalized = list.map((lvl, idx) => ({
      ...lvl,
      order: idx + 1,
    }));

    try {
      await dbService.saveLevels(normalized);
      toast.success(`Level hierarchy updated.`);
      loadData();
    } catch {
      toast.error("Failed to reorder levels.");
    }
  };

  const handleAutoSortByElevation = async () => {
    if (levels.length === 0) return;
    if (
      !window.confirm(
        "Auto-sort all levels from lowest elevation to highest elevation? This will reassign hierarchy ranks #1..#N based on height in meters."
      )
    ) {
      return;
    }

    const sorted = [...levels]
      .sort((a, b) => (a.elevation || 0) - (b.elevation || 0))
      .map((lvl, idx) => ({ ...lvl, order: idx + 1 }));

    try {
      await dbService.saveLevels(sorted);
      toast.success("Levels auto-sorted by elevation.");
      loadData();
    } catch {
      toast.error("Failed to auto-sort levels.");
    }
  };

  const handleStartEdit = (lvl: ProjectLevel) => {
    setEditingLevel(lvl);
    setEditLevelName(lvl.name);
    setEditElevation(lvl.elevation);
    setEditOrder(lvl.order ?? 1);
    setEditWorkPackageId(lvl.workPackageId || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLevel) return;

    const updatedList = levels.map((l) => {
      if (l.id === editingLevel.id) {
        return {
          ...l,
          name: editLevelName.trim(),
          elevation: Number(editElevation),
          order: Number(editOrder),
          workPackageId: editWorkPackageId || undefined,
          workPackageName: packages.find((p) => p.id === editWorkPackageId)?.name || undefined,
        };
      }
      return l;
    });

    const normalized = updatedList
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.elevation ?? 0) - (b.elevation ?? 0))
      .map((l, idx) => ({ ...l, order: idx + 1 }));

    try {
      await dbService.saveLevels(normalized);
      toast.success("Level updated.");
      setEditingLevel(null);
      loadData();
    } catch {
      toast.error("Failed to update level.");
    }
  };

  const handleDelete = async (lvlId: string, lvlName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${lvlName}"? Elements linked to this level may need reassignment.`
      )
    ) {
      return;
    }
    try {
      await dbService.deleteLevel(lvlId, currentProjId);
      toast.success(`Deleted level ${lvlName}`);
      loadData();
    } catch {
      toast.error("Failed to delete level.");
    }
  };

  const handleSetActive = (lvlId: string, lvlName: string) => {
    setCurrentLevel(lvlId, lvlName);
    toast.success(`Current project level set to: ${lvlName}`);
  };

  return (
    <div className="space-y-6">
      {/* Superstructure Level Progression Horizon (Lower to Higher Hierarchy) */}
      {enrichedLevels.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider font-bold">
                <Building2 className="w-4 h-4" />
                <span>Superstructure Elevation Horizon</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sequential lower-to-higher floor progression with automated cascade logic
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoSortByElevation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition shadow"
                title="Auto-sort ranks #1..#N by elevation in meters"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Auto-Sort by Elevation</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Floor Level</span>
              </button>
            </div>
          </div>

          {/* Level Cards Horizon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {enrichedLevels.map((lvl, idx) => {
              const isCurrent = activeProject?.currentLevelId === lvl.id;
              return (
                <div
                  key={lvl.id}
                  className={`p-3.5 rounded-xl border transition relative flex flex-col justify-between ${
                    isCurrent
                      ? "bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-500/50 shadow-lg shadow-brand-500/10"
                      : (lvl.isDirectlyComplete || lvl.isCompleted)
                      ? "bg-emerald-50/50 dark:bg-slate-950/80 border-emerald-300 dark:border-emerald-500/40"
                      : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 font-bold">
                        #{lvl.order ?? idx + 1}
                      </span>
                      <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                        {lvl.elevation >= 0 ? `+${lvl.elevation}m` : `${lvl.elevation}m`}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{lvl.name}</h4>
                    {lvl.workPackageName ? (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold truncate bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-200/50 dark:border-indigo-800/40">
                        <Briefcase className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate">{lvl.workPackageName}</span>
                      </div>
                    ) : (
                      <div className="mt-1 text-[10px] text-slate-400 italic">
                        No Package Assigned
                      </div>
                    )}

                    <div className="mt-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        <span>Completion</span>
                        <span className={`font-bold ${lvl.effectivePercentage === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200"}`}>
                          {lvl.effectivePercentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            lvl.isPrecedenceComplete
                              ? "bg-cyan-500"
                              : lvl.effectivePercentage === 100
                              ? "bg-emerald-500"
                              : "bg-brand-500"
                          }`}
                          style={{ width: `${lvl.effectivePercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions & Active Indicator */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleSetActive(lvl.id, lvl.name)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg transition ${isCurrent ? "bg-brand-600 text-white shadow" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"}`}
                    >
                      {isCurrent ? "Active Stage" : "Set Active"}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveLevel(idx, "LOWER")}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30"
                        title="Move Lower in Hierarchy"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMoveLevel(idx, "HIGHER")}
                        disabled={idx === enrichedLevels.length - 1}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30"
                        title="Move Higher in Hierarchy"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(lvl)}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        title="Edit Level"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(lvl.id, lvl.name)}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Delete Level"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Floor Level Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Add Floor Level</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLevel} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Level Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ground Floor, Level 01, Level 02"
                  value={newLevelName}
                  onChange={(e) => setNewLevelName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Elevation Height (m)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newElevation}
                  onChange={(e) => setNewElevation(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Hierarchy Position</label>
                <select
                  value={newLevelPosition}
                  onChange={(e) => setNewLevelPosition(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="TOP">Top of Building (Highest Rank)</option>
                  <option value="BASE">Base / Foundation (Lowest Rank)</option>
                  <option value="CUSTOM">Custom Position Rank</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Work Package (Inherited by all elements on this floor)
                </label>
                <select
                  value={newWorkPackageId}
                  onChange={(e) => setNewWorkPackageId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">No Work Package (Unassigned)</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.code || "PKG"})
                    </option>
                  ))}
                </select>
              </div>

              {newLevelPosition === "CUSTOM" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Custom Rank #</label>
                  <input
                    type="number"
                    min="1"
                    value={newLevelCustomOrder}
                    onChange={(e) => setNewLevelCustomOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              )}<div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow transition"
                >
                  Create Level
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Floor Level Modal */}
      {editingLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Edit Floor Level</span>
              </h3>
              <button
                onClick={() => setEditingLevel(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Level Name</label>
                <input
                  type="text"
                  value={editLevelName}
                  onChange={(e) => setEditLevelName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Elevation Height (m)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editElevation}
                  onChange={(e) => setEditElevation(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Hierarchy Rank #</label>
                <input
                  type="number"
                  min="1"
                  value={editOrder}
                  onChange={(e) => setEditOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Work Package (Inherited by all elements on this floor)
                </label>
                <select
                  value={editWorkPackageId}
                  onChange={(e) => setEditWorkPackageId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">No Work Package (Unassigned)</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.code || "PKG"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingLevel(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
