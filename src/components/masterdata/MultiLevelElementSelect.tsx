import React, { useEffect, useState, useMemo } from 'react';
import { dbService } from '@/lib/db';
import { ProjectLevel, StructuralElement } from '@/types';
import { Layers, Box, Search, CheckSquare, Square, X, Check, Filter } from 'lucide-react';

export interface SelectedElementItem {
  id: string;
  elementName: string;
  elementType?: string;
  levelId?: string;
  levelName?: string;
  grid?: string;
}

export interface MultiLevelElementSelectProps {
  projectId?: string;
  companyId?: string;
  selectedElements: SelectedElementItem[];
  onChange: (elements: SelectedElementItem[]) => void;
  levels?: ProjectLevel[];
  elements?: StructuralElement[];
  defaultLevelId?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  label?: string;
}

export const MultiLevelElementSelect: React.FC<MultiLevelElementSelectProps> = ({
  projectId = '',
  companyId = '',
  selectedElements = [],
  onChange,
  levels: passedLevels,
  elements: passedElements,
  defaultLevelId = '',
  required = false,
  className = '',
  disabled = false,
  label = 'Structural Elements Subject to Issue',
}) => {
  const [levels, setLevels] = useState<ProjectLevel[]>(passedLevels || []);
  const [elements, setElements] = useState<StructuralElement[]>(passedElements || []);
  const [currentLevelId, setCurrentLevelId] = useState<string>(defaultLevelId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Load levels if not passed
  useEffect(() => {
    if (passedLevels && passedLevels.length > 0) {
      setLevels(passedLevels);
    } else if (projectId) {
      dbService
        .getLevels(projectId, companyId)
        .then((lvls) => {
          if (lvls) setLevels(lvls);
        })
        .catch(console.error);
    }
  }, [projectId, companyId, passedLevels]);

  // Load elements if not passed
  useEffect(() => {
    if (passedElements && passedElements.length > 0) {
      setElements(passedElements);
    } else if (projectId) {
      dbService
        .getElements(projectId, companyId)
        .then((elems) => {
          if (elems) setElements(elems);
        })
        .catch(console.error);
    }
  }, [projectId, companyId, passedElements]);

  // If defaultLevelId changes and we don't have a level selected, apply it
  useEffect(() => {
    if (defaultLevelId && !currentLevelId) {
      setCurrentLevelId(defaultLevelId);
    }
  }, [defaultLevelId]);

  // If selectedElements has elements from a specific level and currentLevelId is empty, auto-focus that level
  useEffect(() => {
    if (!currentLevelId && selectedElements.length > 0 && selectedElements[0].levelId) {
      setCurrentLevelId(selectedElements[0].levelId);
    }
  }, [selectedElements]);

  // Distinct element types available in current element list
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    elements.forEach((el) => {
      if (el.elementType) types.add(el.elementType.toUpperCase());
    });
    return Array.from(types).sort();
  }, [elements]);

  // Filter elements by level, search, and type
  const filteredElements = useMemo(() => {
    return elements.filter((el) => {
      // Level filter
      if (currentLevelId && el.levelId && el.levelId !== currentLevelId) {
        return false;
      }
      // Type filter
      if (selectedType !== 'ALL' && (el.elementType || '').toUpperCase() !== selectedType) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (el.elementName || el.name || '').toLowerCase();
        const grid = (el.grid || el.gridAxis || '').toLowerCase();
        const type = (el.elementType || '').toLowerCase();
        return name.includes(q) || grid.includes(q) || type.includes(q);
      }
      return true;
    });
  }, [elements, currentLevelId, selectedType, searchQuery]);

  const selectedIdsSet = useMemo(() => {
    return new Set(selectedElements.map((e) => e.id));
  }, [selectedElements]);

  // Toggle single element
  const toggleElement = (el: StructuralElement) => {
    if (disabled) return;
    const elId = el.id;
    const isSelected = selectedIdsSet.has(elId);

    if (isSelected) {
      onChange(selectedElements.filter((e) => e.id !== elId));
    } else {
      const lvl = levels.find((l) => l.id === el.levelId);
      const newItem: SelectedElementItem = {
        id: el.id,
        elementName: el.elementName || el.name || 'Unnamed Element',
        elementType: el.elementType || '',
        levelId: el.levelId || currentLevelId,
        levelName: lvl?.name || '',
        grid: el.grid || el.gridAxis || '',
      };
      onChange([...selectedElements, newItem]);
    }
  };

  // Remove element by ID
  const removeElement = (idToRemove: string) => {
    if (disabled) return;
    onChange(selectedElements.filter((e) => e.id !== idToRemove));
  };

  // Select all filtered elements
  const selectAllFiltered = () => {
    if (disabled) return;
    const currentMap = new Map(selectedElements.map((e) => [e.id, e]));

    filteredElements.forEach((el) => {
      if (!currentMap.has(el.id)) {
        const lvl = levels.find((l) => l.id === el.levelId);
        currentMap.set(el.id, {
          id: el.id,
          elementName: el.elementName || el.name || 'Unnamed Element',
          elementType: el.elementType || '',
          levelId: el.levelId || currentLevelId,
          levelName: lvl?.name || '',
          grid: el.grid || el.gridAxis || '',
        });
      }
    });

    onChange(Array.from(currentMap.values()));
  };

  // Deselect all filtered elements
  const deselectFiltered = () => {
    if (disabled) return;
    const filteredIdSet = new Set(filteredElements.map((e) => e.id));
    onChange(selectedElements.filter((e) => !filteredIdSet.has(e.id)));
  };

  const allFilteredSelected =
    filteredElements.length > 0 &&
    filteredElements.every((el) => selectedIdsSet.has(el.id));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Level Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Floor Level {required && <span className="text-red-500">*</span>}</span>
          </label>
          <select
            value={currentLevelId}
            onChange={(e) => setCurrentLevelId(e.target.value)}
            disabled={disabled}
            className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition shadow-sm disabled:opacity-50"
          >
            <option value="">-- All Floor Levels --</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} {l.elevation !== undefined ? `(${l.elevation >= 0 ? `+${l.elevation}` : l.elevation}m)` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter by Name or Grid</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={disabled}
              placeholder="e.g. C-101, Grid A-4, Beam..."
              className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition shadow-sm disabled:opacity-50"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Type Filter Pills */}
      {availableTypes.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
            <Filter size={10} /> Type:
          </span>
          <button
            type="button"
            onClick={() => setSelectedType('ALL')}
            disabled={disabled}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
              selectedType === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Types
          </button>
          {availableTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              disabled={disabled}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                selectedType === type
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Selected Items Tray */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box size={14} className="text-[#ea580c]" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {label}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                selectedElements.length > 0
                  ? 'bg-[#ea580c]/10 text-[#ea580c] border border-[#ea580c]/30'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}
            >
              {selectedElements.length} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {filteredElements.length > 0 && (
              <button
                type="button"
                onClick={allFilteredSelected ? deselectFiltered : selectAllFiltered}
                disabled={disabled}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 transition"
              >
                {allFilteredSelected ? (
                  <>
                    <Square size={12} /> Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare size={12} /> Select All ({filteredElements.length})
                  </>
                )}
              </button>
            )}

            {selectedElements.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                disabled={disabled}
                className="text-[11px] font-semibold text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-0.5 ml-2 transition"
              >
                <X size={12} /> Clear All
              </button>
            )}
          </div>
        </div>

        {/* Selected Chips List */}
        {selectedElements.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1 max-h-36 overflow-y-auto">
            {selectedElements.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-orange-200 dark:border-orange-900/60 shadow-xs"
              >
                <span className="font-bold text-[#ea580c]">{item.elementName}</span>
                {item.elementType && (
                  <span className="text-[10px] uppercase font-mono text-slate-400 dark:text-slate-500">
                    {item.elementType}
                  </span>
                )}
                {item.grid && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    [{item.grid}]
                  </span>
                )}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeElement(item.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                    title={`Remove ${item.elementName}`}
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
            No structural elements selected yet. Choose from the grid below to link them to this NCR.
          </p>
        )}
      </div>

      {/* Element Options Grid */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
        <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong>{filteredElements.length}</strong> available element
            {filteredElements.length === 1 ? '' : 's'}
            {currentLevelId ? ' on this level' : ' across all levels'}
          </span>
          <span className="text-[11px] text-slate-400">Click to select/unselect</span>
        </div>

        <div className="max-h-64 overflow-y-auto p-2.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {filteredElements.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No elements found matching your filters.
            </div>
          ) : (
            filteredElements.map((el) => {
              const isSelected = selectedIdsSet.has(el.id);
              return (
                <button
                  key={el.id}
                  type="button"
                  onClick={() => toggleElement(el)}
                  disabled={disabled}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-orange-50/80 dark:bg-orange-950/40 border-[#ea580c] ring-1 ring-[#ea580c]/50 text-slate-900 dark:text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold truncate flex items-center gap-1.5">
                      <span className={isSelected ? 'text-[#ea580c]' : ''}>
                        {el.elementName || el.name}
                      </span>
                      {el.elementType && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                          {el.elementType}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-mono mt-0.5">
                      {el.grid ? `Grid ${el.grid}` : 'No grid'}
                      {el.concreteGrade ? ` · ${el.concreteGrade}` : ''}
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#ea580c] text-white'
                        : 'border border-slate-300 dark:border-slate-700 text-transparent'
                    }`}
                  >
                    <Check size={12} strokeWidth={3} />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiLevelElementSelect;
