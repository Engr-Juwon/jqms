import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { dbService } from '@/lib/db';
import { ProjectLevel, StructuralElement } from '@/types';
import { Layers, Box, Search, X, Check, Filter, ChevronDown } from 'lucide-react';

export interface LevelElementSelection {
  levelName: string;
  elementName: string;
  gridLocation: string;
  elementType?: string;
  elementId?: string;
  levelId?: string;
}

export interface LevelElementSelectProps {
  projectId?: string;
  companyId?: string;
  // Object mode
  value?: LevelElementSelection | null;
  onChange?: (selection: LevelElementSelection) => void;
  // Direct props mode
  selectedLevelId?: string;
  selectedLevelName?: string;
  selectedElementId?: string;
  selectedElementName?: string;
  onLevelChange?: (levelId: string, levelName: string) => void;
  onElementChange?: (elementId: string, elementName: string, gridLocation?: string, elementType?: string) => void;
  // Optional preloaded data
  levels?: ProjectLevel[];
  elements?: StructuralElement[];
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export const LevelElementSelect: React.FC<LevelElementSelectProps> = ({
  projectId = '',
  companyId = '',
  value,
  onChange,
  selectedLevelId: propLevelId,
  selectedLevelName: propLevelName,
  selectedElementId: propElementId,
  selectedElementName: propElementName,
  onLevelChange,
  onElementChange,
  levels: passedLevels,
  elements: passedElements,
  required = false,
  className = '',
  disabled = false,
}) => {
  const { activeProject } = useProjectStore();
  const [levels, setLevels] = useState<ProjectLevel[]>(passedLevels || []);
  const [elements, setElements] = useState<StructuralElement[]>(passedElements || []);
  const [currentLevelId, setCurrentLevelId] = useState<string>(
    propLevelId || activeProject?.currentLevelId || '',
  );
  const [currentElementId, setCurrentElementId] = useState<string>('');

  // Mobile-friendly search & category filter state
  const [elementSearch, setElementSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch levels and elements if not provided
  useEffect(() => {
    if (passedLevels && passedLevels.length > 0) {
      setLevels(passedLevels);
    } else if (projectId) {
      dbService.getLevels(projectId, companyId).then((lvls) => {
        if (lvls) setLevels(lvls);
      }).catch(console.error);
    }
  }, [projectId, companyId, passedLevels]);

  useEffect(() => {
    if (passedElements && passedElements.length > 0) {
      setElements(passedElements);
    } else if (projectId) {
      dbService.getElements(projectId, companyId).then((elems) => {
        if (elems) setElements(elems);
      }).catch(console.error);
    }
  }, [projectId, companyId, passedElements]);

  // Synchronize internal level state with incoming props or object value
  useEffect(() => {
    if (propLevelId) {
      setCurrentLevelId(propLevelId);
      return;
    }

    if (propLevelName && levels.length > 0) {
      const match = levels.find(l => l.name === propLevelName || l.id === propLevelName);
      if (match) {
        setCurrentLevelId(match.id);
        return;
      }
    }

    if (value?.levelId) {
      setCurrentLevelId(value.levelId);
      return;
    }

    if (value?.levelName && levels.length > 0) {
      const match = levels.find(l => l.name === value.levelName || l.id === value.levelName);
      if (match) {
        setCurrentLevelId(match.id);
        return;
      }
    }

    const elemTargetId = propElementId || value?.elementId;
    if (elemTargetId && elements.length > 0) {
      const el = elements.find(e => e.id === elemTargetId);
      if (el?.levelId) {
        setCurrentLevelId(el.levelId);
        return;
      }
    }

    if (!propLevelId && !propLevelName && !value?.levelId && !value?.levelName && !elemTargetId) {
      if (!currentLevelId && activeProject?.currentLevelId) {
        setCurrentLevelId(activeProject.currentLevelId);
      }
    }
  }, [propLevelId, propLevelName, value?.levelId, value?.levelName, propElementId, value?.elementId, levels, elements, activeProject?.currentLevelId]);

  // Synchronize internal element state
  useEffect(() => {
    const elemId = propElementId || value?.elementId || '';
    if (elemId) {
      setCurrentElementId(elemId);
    } else if (propElementName || value?.elementName) {
      const name = propElementName || value?.elementName || '';
      const match = elements.find(e => (e.elementName || e.name) === name);
      if (match) setCurrentElementId(match.id);
    } else {
      setCurrentElementId('');
    }
  }, [propElementId, propElementName, value?.elementId, value?.elementName, elements]);

  // Distinct element types available on the active level (or all elements)
  const availableTypes = useMemo(() => {
    const pool = currentLevelId
      ? elements.filter((e) => e.levelId === currentLevelId)
      : elements;
    const types = new Set<string>();
    pool.forEach((e) => {
      if (e.elementType) types.add(e.elementType.toUpperCase());
    });
    return Array.from(types).sort();
  }, [elements, currentLevelId]);

  // Filtered elements by Level, Type pill, and Search input
  const filteredElements = useMemo(() => {
    let pool = currentLevelId
      ? elements.filter((e) => e.levelId === currentLevelId)
      : elements;

    if (typeFilter !== 'ALL') {
      pool = pool.filter((e) => (e.elementType || '').toUpperCase() === typeFilter);
    }

    if (elementSearch.trim()) {
      const q = elementSearch.toLowerCase().trim();
      pool = pool.filter((e) => {
        const name = (e.elementName || e.name || '').toLowerCase();
        const grid = (e.grid || e.gridAxis || '').toLowerCase();
        const type = (e.elementType || '').toLowerCase();
        return name.includes(q) || grid.includes(q) || type.includes(q);
      });
    }

    return pool;
  }, [elements, currentLevelId, typeFilter, elementSearch]);

  const selectedElement = useMemo(() => {
    return elements.find((e) => e.id === currentElementId);
  }, [elements, currentElementId]);

  const selectedLevel = useMemo(() => {
    return levels.find((l) => l.id === currentLevelId);
  }, [levels, currentLevelId]);

  const handleLevelSelect = (lvlId: string) => {
    setCurrentLevelId(lvlId);
    setCurrentElementId('');
    setTypeFilter('ALL');
    setElementSearch('');
    const lvl = levels.find((l) => l.id === lvlId);
    const lvlName = lvl ? lvl.name : '';

    if (onLevelChange) {
      onLevelChange(lvlId, lvlName);
    }
    if (onChange) {
      onChange({
        levelId: lvlId,
        levelName: lvlName,
        elementName: '',
        gridLocation: '',
        elementId: '',
        elementType: '',
      });
    }
  };

  const handleElementSelect = (el: StructuralElement | null) => {
    if (!el) {
      setCurrentElementId('');
      if (onElementChange) onElementChange('', '', '', '');
      if (onChange) {
        onChange({
          levelId: currentLevelId,
          levelName: selectedLevel?.name || value?.levelName || propLevelName || '',
          elementName: '',
          gridLocation: '',
          elementId: '',
          elementType: '',
        });
      }
      setIsDropdownOpen(false);
      return;
    }

    setCurrentElementId(el.id);
    const lvl = levels.find((l) => l.id === el.levelId) || selectedLevel;
    const lvlName = lvl?.name || value?.levelName || propLevelName || '';
    const elName = el.elementName || el.name || '';
    const grid = el.grid || el.gridAxis || '';
    const type = el.elementType || '';

    if (el.levelId && el.levelId !== currentLevelId) {
      setCurrentLevelId(el.levelId);
      if (onLevelChange) onLevelChange(el.levelId, lvlName);
    }

    if (onElementChange) {
      onElementChange(el.id, elName, grid, type);
    }
    if (onChange) {
      onChange({
        levelId: el.levelId || currentLevelId,
        levelName: lvlName,
        elementName: elName,
        gridLocation: grid,
        elementType: type,
        elementId: el.id,
      });
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Top Bar: Floor Level Picker & Active Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Floor Level */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Floor Level {required && <span className="text-red-500">*</span>}</span>
            </span>
            {selectedLevel && (
              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-mono font-bold lowercase">
                {elements.filter(e => e.levelId === selectedLevel.id).length} elements
              </span>
            )}
          </label>
          <div className="relative">
            <select
              value={currentLevelId}
              onChange={(e) => handleLevelSelect(e.target.value)}
              required={required}
              disabled={disabled}
              className="w-full px-3.5 py-2.5 sm:py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition shadow-sm disabled:opacity-50 appearance-none pr-8 cursor-pointer"
            >
              <option value="">-- All Floor Levels --</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.elevation !== undefined ? `(${l.elevation >= 0 ? `+${l.elevation}` : l.elevation}m)` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Quick Filter Pill Buttons (Column, Beam, Slab, Wall) for rapid thumb-tapping */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-500" />
            <span>Element Type Filter</span>
          </label>
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                typeFilter === 'ALL'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All Types
            </button>
            {availableTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t === typeFilter ? 'ALL' : t)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                  typeFilter === t
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Structural Element Picker (Mobile-Optimized Searchable Selection) */}
      <div ref={dropdownRef} className="relative">
        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Target Structural Element</span>
          </span>
          {selectedElement && (
            <button
              type="button"
              onClick={() => handleElementSelect(null)}
              className="text-[10px] text-rose-500 hover:text-rose-600 font-semibold"
            >
              Clear selection
            </button>
          )}
        </label>

        {/* Interactive trigger bar */}
        <div
          onClick={() => !disabled && setIsDropdownOpen((prev) => !prev)}
          className={`w-full min-h-[44px] px-3.5 py-2 border rounded-xl flex items-center justify-between gap-2 cursor-pointer transition shadow-sm bg-white dark:bg-slate-900 ${
            isDropdownOpen
              ? 'border-brand-500 ring-2 ring-brand-500/20'
              : selectedElement
                ? 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          {selectedElement ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                {selectedElement.elementType || 'ELEM'}
              </span>
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                {selectedElement.elementName || selectedElement.name}
              </span>
              {selectedElement.grid && (
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded shrink-0">
                  Grid {selectedElement.grid}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {currentLevelId
                ? `Tap to search element on ${selectedLevel?.name || 'this level'}...`
                : 'Tap to search & select structural member...'}
            </span>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            {selectedElement ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleElementSelect(null);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-3.5 h-3.5" />
              </div>
            ) : null}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Dropdown list panel with instant filter & live search */}
        {isDropdownOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input Box with clear button */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={elementSearch}
                onChange={(e) => setElementSearch(e.target.value)}
                placeholder="Type member name, grid (e.g. C-1, Grid 4)..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
              />
              {elementSearch && (
                <button
                  type="button"
                  onClick={() => setElementSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Scrollable Element Items */}
            <div className="max-h-56 sm:max-h-64 overflow-y-auto space-y-1 pr-1 overscroll-contain">
              {filteredElements.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  No elements matching <span className="font-semibold text-slate-600 dark:text-slate-300">"{elementSearch || typeFilter}"</span>
                </div>
              ) : (
                filteredElements.map((el) => {
                  const isSelected = el.id === currentElementId;
                  return (
                    <button
                      key={el.id}
                      type="button"
                      onClick={() => handleElementSelect(el)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 transition ${
                        isSelected
                          ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-800 dark:text-brand-200 font-bold border border-brand-200 dark:border-brand-700/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                          {el.elementType || 'ELEM'}
                        </span>
                        <span className="font-semibold truncate">
                          {el.elementName || el.name}
                        </span>
                        {el.grid && (
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded shrink-0">
                            Grid {el.grid}
                          </span>
                        )}
                        {!currentLevelId && el.levelName && (
                          <span className="text-[10px] text-slate-400 truncate">
                            • {el.levelName}
                          </span>
                        )}
                      </div>

                      {isSelected ? (
                        <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>

            {/* Quick Helper Footer */}
            <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>{filteredElements.length} elements shown</span>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(false)}
                className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelElementSelect;
