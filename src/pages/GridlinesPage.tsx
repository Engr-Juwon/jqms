import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjectStore } from '@/stores/useProjectStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { dbService } from '@/lib/db';
import { Gridline } from '@/types';
import { GridlineManager } from '@/components/registry/GridlineManager';
import { Compass, Box, Grid } from 'lucide-react';

export const GridlinesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentProjId = activeProject?.id || projectId || '';
  const currentCompId = currentUser?.companyId || company?.id || activeProject?.companyId || '';

  const [gridlines, setGridlines] = useState<Gridline[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!currentProjId) return;
    setLoading(true);
    try {
      const gridList = await dbService.getGridlines(currentProjId, currentCompId);
      setGridlines(gridList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentProjId, currentCompId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-1 font-bold">
            <Compass className="w-4 h-4" />
            <span>Structural Grid Geometry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Gridlines & Axis Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure true-scale X-Axis (alphabetic) and Y-Axis (numeric) coordinates with meter spacing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/project/elements"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow transition"
          >
            <Box className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Element Registry</span>
          </Link>
          <Link
            to="/project/grid-plan"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow transition"
          >
            <Grid className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>2D Grid Plan</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-20 text-center shadow-xl">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading project gridlines...</p>
        </div>
      ) : (
        <GridlineManager gridlines={gridlines} onRefresh={loadData} />
      )}
    </div>
  );
};

export default GridlinesPage;
