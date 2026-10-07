import React, { useEffect, useState } from 'react';
import { dbService } from '@/lib/db';
import { ProjectLevel, StructuralElement } from '@/types';
import { Layers, Box } from 'lucide-react';

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
  const [levels, setLevels] = useState<ProjectLevel[]>(passedLevels || []);
  const [elements, setElements] = useState<StructuralElement[]>(passedElements || []);
  const [currentLevelId, setCurrentLevelId] = useState<string>('');
  const [currentElementId, setCurrentElementId] = useState<string>('');

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
    // 1. Direct prop level id
    if (propLevelId) {
      setCurrentLevelId(propLevelId);
      return;
    }

    // 2. Direct prop level name
    if (propLevelName && levels.length > 0) {
      const match = levels.find(l => l.name === propLevelName || l.id === propLevelName);
      if (match) {
        setCurrentLevelId(match.id);
        return;
      }
    }

    // 3. Object value levelId or levelName
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

    // 4. If an element is selected, infer its level
    const elemTargetId = propElementId || value?.elementId;
    if (elemTargetId && elements.length > 0) {
      const el = elements.find(e => e.id === elemTargetId);
      if (el?.levelId) {
        setCurrentLevelId(el.levelId);
      }
    }
  }, [propLevelId, propLevelName, value?.levelId, value?.levelName, propElementId, value?.elementId, levels, elements]);

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

  const filteredElements = currentLevelId
    ? elements.filter((e) => e.levelId === currentLevelId)
    : elements;

  const handleLevelSelect = (lvlId: string) => {
    setCurrentLevelId(lvlId);
    setCurrentElementId('');
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

  const handleElementSelect = (elemId: string) => {
    setCurrentElementId(elemId);
    const el = elements.find((e) => e.id === elemId);
    if (!el) {
      if (onElementChange) onElementChange('', '', '', '');
      if (onChange) {
        const lvl = levels.find((l) => l.id === currentLevelId);
        onChange({
          levelId: currentLevelId,
          levelName: lvl?.name || value?.levelName || propLevelName || '',
          elementName: '',
          gridLocation: '',
          elementId: '',
          elementType: '',
        });
      }
      return;
    }

    const lvl = levels.find((l) => l.id === el.levelId) || levels.find((l) => l.id === currentLevelId);
    const lvlName = lvl?.name || value?.levelName || propLevelName || '';
    const elName = el.elementName || el.name || '';
    const grid = el.grid || el.gridAxis || '';
    const type = el.elementType || '';

    // If level wasn't selected, auto-set it from the element
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
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      <div>
        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>Floor Level {required && <span className="text-red-500">*</span>}</span>
        </label>
        <select
          value={currentLevelId}
          onChange={(e) => handleLevelSelect(e.target.value)}
          required={required}
          disabled={disabled}
          className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition shadow-sm disabled:opacity-50"
        >
          <option value="">-- Select Floor Level --</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} {l.elevation !== undefined ? `(${l.elevation >= 0 ? `+${l.elevation}` : l.elevation}m)` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Box className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>Structural Element</span>
        </label>
        <select
          value={currentElementId}
          onChange={(e) => handleElementSelect(e.target.value)}
          disabled={disabled}
          className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition shadow-sm disabled:opacity-50"
        >
          <option value="">
            {currentLevelId ? '-- Select Element on this Level --' : '-- All Structural Elements --'}
          </option>
          {filteredElements.map((el) => (
            <option key={el.id} value={el.id}>
              {el.elementName || el.name} {el.elementType ? `(${el.elementType})` : ''} {el.grid ? `[Grid ${el.grid}]` : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default LevelElementSelect;
