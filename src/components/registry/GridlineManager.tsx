import React, { useState } from 'react';
import {
  Compass,
  Plus,
  Trash2,
  Ruler,
  ArrowRight,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Gridline } from '@/types';
import { dbService } from '@/lib/db';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProjectStore } from '@/stores/useProjectStore';

interface GridlineManagerProps {
  gridlines: Gridline[];
  onRefresh: () => void;
}

export const GridlineManager: React.FC<GridlineManagerProps> = ({
  gridlines = [],
  onRefresh,
}) => {
  const { company } = useAuthStore();
  const { activeProject } = useProjectStore();

  const [newLabel, setNewLabel] = useState('');
  const [newAxis, setNewAxis] = useState<'X' | 'Y'>('X');
  const [newDistance, setNewDistance] = useState('');

  // Sort gridlines by order
  const xGridlines = (gridlines || [])
    .filter((g) => g.axis === 'X')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const yGridlines = (gridlines || [])
    .filter((g) => g.axis === 'Y')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  /* ── Add Gridline ── */
  const handleAddGridline = async () => {
    if (!newLabel.trim() || !activeProject) {
      alert('Please provide a gridline label.');
      return;
    }

    const currentAxisGroup = newAxis === 'X' ? xGridlines : yGridlines;
    const order = currentAxisGroup.length;

    const newGrid: Gridline = {
      id: `grid-${Date.now()}`,
      projectId: activeProject.id,
      companyId: company?.id || activeProject.companyId || '',
      axis: newAxis,
      label: newLabel.trim().toUpperCase(),
      order,
      distanceToNext: parseFloat(newDistance) || 0,
      createdAt: new Date().toISOString(),
    };

    await dbService.saveGridline(newGrid);
    setNewLabel('');
    setNewDistance('');
    onRefresh();
  };

  /* ── Update Grid Label ── */
  const handleUpdateLabel = async (
    grid: Gridline,
    newLabelValue: string
  ) => {
    const trimmed = newLabelValue.trim().toUpperCase();
    if (!trimmed || trimmed === grid.label) return;

    await dbService.saveGridline({
      ...grid,
      label: trimmed,
      updatedAt: new Date().toISOString(),
    });
    onRefresh();
  };

  /* ── Update Distance ── */
  const handleUpdateDistance = async (grid: Gridline, distance: string) => {
    await dbService.saveGridline({
      ...grid,
      distanceToNext: parseFloat(distance) || 0,
      updatedAt: new Date().toISOString(),
    });
    onRefresh();
  };

  /* ── Reorder Gridlines (Swap Order) ── */
  const handleMoveOrder = async (
    grid: Gridline,
    direction: 'up' | 'down',
    axisList: Gridline[]
  ) => {
    const currentIndex = axisList.findIndex((g) => g.id === grid.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= axisList.length) return;

    const targetGrid = axisList[targetIndex];

    const updatedGrid = { ...grid, order: targetGrid.order, updatedAt: new Date().toISOString() };
    const updatedTargetGrid = { ...targetGrid, order: grid.order, updatedAt: new Date().toISOString() };

    await Promise.all([
      dbService.saveGridline(updatedGrid),
      dbService.saveGridline(updatedTargetGrid),
    ]);
    onRefresh();
  };

  /* ── Delete Gridline & Normalize Orders ── */
  const handleDelete = async (
    id: string,
    label: string,
    axisList: Gridline[]
  ) => {
    if (window.confirm(`Delete Gridline ${label}?`)) {
      await dbService.deleteGridline(id, activeProject?.id);

      // Re-index remaining gridlines in this axis
      const remaining = axisList.filter((g) => g.id !== id);
      const updates = remaining.map((g, idx) => ({
        ...g,
        order: idx,
      }));

      await dbService.saveGridlines(updates);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Add Gridline Card ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Compass className="text-brand-600 dark:text-brand-400" size={18} />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Define Project Gridlines & Spacings
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Axis Type
            </label>
            <select
              value={newAxis}
              onChange={(e) => setNewAxis(e.target.value as 'X' | 'Y')}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-brand-500"
            >
              <option value="X">X-Axis (Alphabetic: A, B, C...)</option>
              <option value="Y">Y-Axis (Numeric: 1, 2, 3...)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Grid Label
            </label>
            <input
              type="text"
              placeholder={newAxis === 'X' ? 'e.g., A or B' : 'e.g., 1 or 2'}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white uppercase bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Distance to Next Grid (m)
            </label>
            <input
              type="number"
              step="0.001"
              placeholder="e.g., 6.000"
              value={newDistance}
              onChange={(e) => setNewDistance(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAddGridline}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg"
            >
              <Plus size={15} /> Add Gridline
            </button>
          </div>
        </div>
      </div>

      {/* ── Gridlines List ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ═══ X-AXIS GRIDS ═══ */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h4 className="text-xs font-extrabold text-brand-600 dark:text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
            <Ruler size={14} className="text-brand-600 dark:text-brand-400" /> X-Axis Grid Spacings ({xGridlines.length})
          </h4>
          <div className="space-y-2">
            {xGridlines.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No X-axis grids added yet.</p>
            ) : (
              xGridlines.map((grid, idx) => {
                const nextGrid = xGridlines[idx + 1];
                return (
                  <div
                    key={grid.id}
                    className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    {/* Reorder Buttons */}
                    <div className="flex flex-col">
                      <button
                        disabled={idx === 0}
                        onClick={() => handleMoveOrder(grid, 'up', xGridlines)}
                        className="p-0.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 disabled:opacity-20 transition"
                        title="Move Up"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        disabled={idx === xGridlines.length - 1}
                        onClick={() => handleMoveOrder(grid, 'down', xGridlines)}
                        className="p-0.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 disabled:opacity-20 transition"
                        title="Move Down"
                      >
                        <ChevronDown size={13} />
                      </button>
                    </div>

                    {/* Editable Label Input */}
                    <input
                      type="text"
                      defaultValue={grid.label}
                      onBlur={(e) => handleUpdateLabel(grid, e.target.value)}
                      className="w-10 h-8 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 font-black text-xs text-center border border-brand-200 dark:border-brand-500/30 uppercase outline-none focus:ring-2 focus:ring-brand-500"
                      title="Click to edit grid label"
                    />

                    {/* Distance Input / End Indicator */}
                    {nextGrid ? (
                      <div className="flex-1 flex items-center gap-1.5 min-w-0">
                        <ArrowRight size={12} className="text-slate-400 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate">
                          To Grid {nextGrid.label}:
                        </span>
                        <input
                          type="number"
                          step="0.001"
                          defaultValue={grid.distanceToNext}
                          onBlur={(e) => handleUpdateDistance(grid, e.target.value)}
                          className="w-20 px-2 py-1 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-brand-500"
                        />
                        <span className="text-[11px] font-bold text-slate-500">m</span>
                      </div>
                    ) : (
                      <span className="flex-1 text-[11px] font-semibold text-slate-500 italic">
                        End Grid
                      </span>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(grid.id, grid.label, xGridlines)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
                      title="Delete Gridline"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ═══ Y-AXIS GRIDS ═══ */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h4 className="text-xs font-extrabold text-sky-600 dark:text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
            <Ruler size={14} className="text-sky-600 dark:text-sky-400" /> Y-Axis Grid Spacings ({yGridlines.length})
          </h4>
          <div className="space-y-2">
            {yGridlines.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No Y-axis grids added yet.</p>
            ) : (
              yGridlines.map((grid, idx) => {
                const nextGrid = yGridlines[idx + 1];
                return (
                  <div
                    key={grid.id}
                    className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    {/* Reorder Buttons */}
                    <div className="flex flex-col">
                      <button
                        disabled={idx === 0}
                        onClick={() => handleMoveOrder(grid, 'up', yGridlines)}
                        className="p-0.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 disabled:opacity-20 transition"
                        title="Move Up"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        disabled={idx === yGridlines.length - 1}
                        onClick={() => handleMoveOrder(grid, 'down', yGridlines)}
                        className="p-0.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 disabled:opacity-20 transition"
                        title="Move Down"
                      >
                        <ChevronDown size={13} />
                      </button>
                    </div>

                    {/* Editable Label Input */}
                    <input
                      type="text"
                      defaultValue={grid.label}
                      onBlur={(e) => handleUpdateLabel(grid, e.target.value)}
                      className="w-10 h-8 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 font-black text-xs text-center border border-sky-200 dark:border-sky-500/30 uppercase outline-none focus:ring-2 focus:ring-sky-500"
                      title="Click to edit grid label"
                    />

                    {/* Distance Input / End Indicator */}
                    {nextGrid ? (
                      <div className="flex-1 flex items-center gap-1.5 min-w-0">
                        <ArrowRight size={12} className="text-slate-400 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate">
                          To Grid {nextGrid.label}:
                        </span>
                        <input
                          type="number"
                          step="0.001"
                          defaultValue={grid.distanceToNext}
                          onBlur={(e) => handleUpdateDistance(grid, e.target.value)}
                          className="w-20 px-2 py-1 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-sky-500"
                        />
                        <span className="text-[11px] font-bold text-slate-500">m</span>
                      </div>
                    ) : (
                      <span className="flex-1 text-[11px] font-semibold text-slate-500 italic">
                        End Grid
                      </span>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(grid.id, grid.label, yGridlines)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
                      title="Delete Gridline"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
