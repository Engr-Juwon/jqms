import React, { useEffect } from 'react';
import {
  Pencil,
  Eye,
  X,
  ExternalLink,
  Box,
  Layers,
  ChevronRight,
  ShieldAlert,
  Ruler,
  HardHat,
} from 'lucide-react';
import { StructuralElement } from '@/types';
import {
  getOrCalculateVolume,
  getOrCalculateFormworkArea,
} from '@/lib/elementCalculations';

export interface ElementActionModalProps {
  isOpen: boolean;
  element: StructuralElement | null;
  levelName?: string;
  canEdit?: boolean;
  onClose: () => void;
  onEdit: (element: StructuralElement) => void;
  onViewDetails: (element: StructuralElement) => void;
  onOpenPassport?: (element: StructuralElement) => void;
}

const STATUS_THEME: Record<string, { bg: string; text: string; border: string }> = {
  PLANNED: { bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  PENDING: { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  REBAR_INSPECTION: { bg: 'bg-orange-50 dark:bg-orange-950/50', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  FORMWORK_INSPECTION: { bg: 'bg-purple-50 dark:bg-purple-950/50', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
  POUR_APPROVED: { bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' },
  POURED: { bg: 'bg-cyan-50 dark:bg-cyan-950/50', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800' },
  CURING: { bg: 'bg-teal-50 dark:bg-teal-950/50', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800' },
  STRIPPED: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  COMPLETED: { bg: 'bg-green-50 dark:bg-green-950/50', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
  INSPECTED: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
};

export const ElementActionModal: React.FC<ElementActionModalProps> = ({
  isOpen,
  element,
  levelName,
  canEdit = true,
  onClose,
  onEdit,
  onViewDetails,
  onOpenPassport,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !element) return null;

  const statusStyle = STATUS_THEME[element.status] || {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
  };

  const volume = getOrCalculateVolume(element);
  const formwork = getOrCalculateFormworkArea(element);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-white transition-all transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-500/20 shrink-0">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black tracking-tight">
                  {element.elementName || element.name}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {element.elementType}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                >
                  {element.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                <span>
                  Level: <strong className="text-slate-700 dark:text-slate-300">{levelName || element.levelName || 'Current Level'}</strong>
                </span>
                <span>•</span>
                <span>
                  Grid: <strong className="text-brand-600 dark:text-brand-400 font-mono">{element.grid || element.gridAxis || 'N/A'}</strong>
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {(element.hasGridOffset || element.baseOffsetX || element.baseOffsetY) ? (
                  <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold">
                    Offset: ΔX = {(element.baseOffsetX || 0) > 0 ? `+${element.baseOffsetX}` : (element.baseOffsetX || 0)}m, ΔY = {(element.baseOffsetY || 0) > 0 ? `+${element.baseOffsetY}` : (element.baseOffsetY || 0)}m
                  </span>
                ) : (
                  <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Directly on Grid (Centered)
                  </span>
                )}
                {(element.isInclined || element.verticality === 'inclined') && (
                  <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/30 font-bold">
                    Slanted: {element.inclinedFixedEnd === 'TOP' ? 'Top Fixed ⚓ · Base Moved' : 'Base Fixed ⚓ · Top Moved'} ({element.horizontalOffset || 0.4}m {element.inclinationDirection || 'EAST'})
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Specs Overview Strip */}
        <div className="px-5 sm:px-6 py-3 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Concrete</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
              {element.concreteGrade || 'C30/37'}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Volume</span>
            <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-xs">
              {volume.toFixed(3)} m³
            </span>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Formwork</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
              {formwork.toFixed(2)} m²
            </span>
          </div>
        </div>

        {/* Action Choice Body */}
        <div className="p-5 sm:p-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Select Action
          </p>

          {/* Action 1: Edit & Update */}
          <button
            onClick={() => {
              if (canEdit) onEdit(element);
            }}
            disabled={!canEdit}
            className={`w-full group text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
              canEdit
                ? 'bg-gradient-to-r from-brand-50 to-indigo-50/30 dark:from-brand-950/30 dark:to-indigo-950/20 border-brand-200 dark:border-brand-800 hover:border-brand-500 hover:shadow-md cursor-pointer'
                : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  canEdit
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-500'
                }`}
              >
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    Edit & Update Element
                  </h4>
                  {!canEdit && (
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> QA/QC Only
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update geometry dimensions, grid offsets, concrete grade, rebar specs, or lifecycle status.
                </p>
              </div>
            </div>
            <ChevronRight
              className={`w-5 h-5 shrink-0 transition-transform ${
                canEdit
                  ? 'text-brand-500 group-hover:translate-x-1'
                  : 'text-slate-400'
              }`}
            />
          </button>

          {/* Action 2: View Details */}
          <button
            onClick={() => onViewDetails(element)}
            className="w-full group text-left p-4 rounded-2xl border bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all flex items-center justify-between gap-4 cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white">
                  View Technical Details
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Inspect 3D BIM model, reinforcement schedule, 5D cost takeoffs, and 6D embodied carbon.
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          Acion 3: Change Staus
          
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          {onOpenPassport ? (
            <button
              onClick={() => onOpenPassport(element)}
              className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 font-bold transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Full Element Passport</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
