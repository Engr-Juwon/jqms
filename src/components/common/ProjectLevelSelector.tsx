import React, { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { dbService } from '@/lib/db';
import { ProjectLevel, StructuralElement } from '@/types';
import { calculateLevelProgressList, EnrichedLevelProgress } from '@/lib/levelCalculations';
import {
  Layers,
  ChevronDown,
  CheckCircle2,
  Clock,
  ArrowUpCircle,
  Building,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface ProjectLevelSelectorProps {
  className?: string;
  variant?: 'header' | 'card' | 'compact';
}

export const ProjectLevelSelector: React.FC<ProjectLevelSelectorProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { activeProject, setCurrentLevel } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentCompId = currentUser?.companyId || company?.id || activeProject?.companyId || '';

  const [isOpen, setIsOpen] = useState(false);
  const [levels, setLevels] = useState<ProjectLevel[]>([]);
  const [elements, setElements] = useState<StructuralElement[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadLevelsAndElements = async () => {
    if (!activeProject?.id) return;
    setLoading(true);
    try {
      const [lvlList, elemList] = await Promise.all([
        dbService.getLevels(activeProject.id, currentCompId),
        dbService.getElements(activeProject.id, currentCompId),
      ]);
      setLevels(lvlList);
      setElements(elemList);
    } catch (e) {
      console.error('Failed to load levels & elements:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLevelsAndElements();
  }, [activeProject?.id, currentCompId]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const enrichedLevels: EnrichedLevelProgress[] = calculateLevelProgressList(levels, elements);

  const currentLevel = enrichedLevels.find(l => l.id === activeProject?.currentLevelId) || enrichedLevels[0];

  const handleSelectLevel = async (level: EnrichedLevelProgress) => {
    await setCurrentLevel(level.id, level.name);
    setIsOpen(false);
  };

  if (!activeProject) return null;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      {variant === 'header' && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-sm transition"
          title="Current Construction Level & Progress"
        >
          <Layers className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">Level:</span>
            <span className="font-bold text-slate-900 dark:text-white max-w-[120px] truncate">
              {currentLevel ? currentLevel.name : 'All Levels'}
            </span>
          </div>

          {currentLevel && (
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border ${
                currentLevel.effectivePercentage === 100
                  ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : currentLevel.effectivePercentage > 0
                  ? 'bg-brand-500/10 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 border-brand-500/30'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
              }`}
            >
              {currentLevel.effectivePercentage}%
            </span>
          )}

          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      )}

      {variant === 'card' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Current Active Level</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Superstructure Construction Horizon</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-xs font-bold text-slate-800 dark:text-white rounded-xl transition shadow-sm"
            >
              <span>{currentLevel?.name || 'Select Working Level'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {currentLevel && (
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{currentLevel.name}</span>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    Elev: {currentLevel.elevation >= 0 ? `+${currentLevel.elevation}m` : `${currentLevel.elevation}m`}
                  </span>
                </div>
                <span className="font-mono text-xs font-black text-brand-600 dark:text-brand-400">
                  {currentLevel.approvedElementsCount} / {currentLevel.totalElementsCount} Approved ({currentLevel.effectivePercentage}%)
                </span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    currentLevel.effectivePercentage === 100
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-brand-500 to-cyan-400'
                  }`}
                  style={{ width: `${currentLevel.effectivePercentage}%` }}
                />
              </div>

              {currentLevel.isPrecedenceComplete && (
                <div className="flex items-center gap-1.5 text-[10px] text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 p-1.5 rounded-lg border border-teal-500/20">
                  <ArrowUpCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                  <span>
                    Marked 100% complete via Superstructure Precedence from Level <strong>{currentLevel.precedenceSourceLevelName}</strong>.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 md:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Project Construction Levels</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Select current active level & inspect element approval rates
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-950 font-mono text-[10px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
              {enrichedLevels.length} Levels
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {enrichedLevels.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No structural levels registered for this project.
              </div>
            ) : (
              enrichedLevels.map((lvl, idx) => {
                const isActive = activeProject.currentLevelId === lvl.id;
                const isBase = idx === 0;
                const isTop = idx === enrichedLevels.length - 1;

                return (
                  <div
                    key={lvl.id}
                    onClick={() => handleSelectLevel(lvl)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition ${
                      isActive
                        ? 'bg-brand-500/10 border-brand-500 text-slate-900 dark:text-white shadow-md'
                        : 'bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono text-[9px] font-bold border border-slate-300 dark:border-slate-700">
                          #{lvl.order ?? (idx + 1)}
                        </span>
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1.5 text-slate-900 dark:text-white">
                            <span>{lvl.name}</span>
                            {isBase && (
                              <span className="px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] font-bold">
                                BASE
                              </span>
                            )}
                            {isTop && enrichedLevels.length > 1 && (
                              <span className="px-1 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[8px] font-bold">
                                TOP
                              </span>
                            )}
                            {isActive && (
                              <span className="px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-700 dark:text-brand-300 font-mono text-[9px] font-bold border border-brand-500/30">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Elev: {lvl.elevation >= 0 ? `+${lvl.elevation}m` : `${lvl.elevation}m`}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-mono font-bold ${
                            lvl.effectivePercentage === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {lvl.effectivePercentage}%
                        </span>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                          {lvl.approvedElementsCount} / {lvl.totalElementsCount} approved
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          lvl.effectivePercentage === 100
                            ? 'bg-emerald-500'
                            : 'bg-brand-500'
                        }`}
                        style={{ width: `${lvl.effectivePercentage}%` }}
                      />
                    </div>

                    {/* Precedence Notice Badge */}
                    {lvl.isPrecedenceComplete && (
                      <div className="mt-2 flex items-center gap-1.5 text-[9px] text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2 py-1 rounded-lg border border-teal-500/20">
                        <ArrowUpCircle className="w-3 h-3 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                        <span>Completed via Superstructure Precedence (Level {lvl.precedenceSourceLevelName})</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <ShieldCheck className="w-3 h-3 text-brand-600 dark:text-brand-400" />
              <span>ISO 9001 Superstructure Gating</span>
            </span>
            <span className="font-mono text-slate-500">
              Click level to set as Active
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
