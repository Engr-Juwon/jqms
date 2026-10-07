import React from 'react';
import { Link } from 'react-router-dom';
import { LevelManager } from '@/components/registry/LevelManager';
import { Building2, Box, Grid } from 'lucide-react';

export const FloorLevelsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-1 font-bold">
            <Building2 className="w-4 h-4" />
            <span>Superstructure Hierarchy Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Floor Level Progression & Hierarchy
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sequential #1..#N building elevations, automated cascade completion logic, and active project stage control
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

      {/* Main Level Manager Studio */}
      <LevelManager />
    </div>
  );
};

export default FloorLevelsPage;
