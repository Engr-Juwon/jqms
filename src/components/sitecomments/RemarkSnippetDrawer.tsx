import React from 'react';
import { Sparkles, Plus, X } from 'lucide-react';

interface RemarkSnippetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSnippet: (observationText: string, directiveText: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => void;
}

const SNIPPETS = [
  {
    category: 'Reinforced Concrete & Rebar',
    title: 'Inadequate Rebar Lap Length',
    observation: 'Main tension reinforcement lap length measured below drawing specified minimum (50d) at structural splice zone.',
    directive: 'Dismantle splice cage, extend lap length to full 50d requirement or install approved mechanical couplers (Type 2).',
    severity: 'CRITICAL' as const,
  },
  {
    category: 'Reinforced Concrete & Rebar',
    title: 'Insufficient Clear Concrete Cover & Missing Spacers',
    observation: 'Rebar cage is touching formwork face in several locations due to missing or displaced concrete cover spacer blocks.',
    directive: 'Install heavy-duty 50mm fibre concrete cover blocks at 600mm centers along top, bottom and side faces before pour permit sign-off.',
    severity: 'HIGH' as const,
  },
  {
    category: 'Formwork & Falsework',
    title: 'Formwork Alignment & Plumb Out of Tolerance',
    observation: 'Column / wall vertical formwork plumb line shows 8mm deviation exceeding permissible 3mm tolerance per BS 8110.',
    directive: 'Re-align and re-brace push-pull props; verify verticality with laser plumb instrument before casting.',
    severity: 'HIGH' as const,
  },
  {
    category: 'Formwork & Falsework',
    title: 'Debris & Tie Wire Scraps at Soffit Base',
    observation: 'Formwork trough base contains wood shavings, saw dust, and discarded tie wire fragments.',
    directive: 'Open clean-out hatch, waterjet wash interior, and vacuum clean all loose debris before final rebar sign-off.',
    severity: 'MEDIUM' as const,
  },
  {
    category: 'Post-Pour Concrete',
    title: 'Honeycombing & Aggregate Segregation',
    observation: 'Surface honeycombing with exposed reinforcement links observed at beam-column joint after formwork striking.',
    directive: 'Hack uncompacted concrete to solid core, clean with compressed air, and apply approved structural polymer-modified repair mortar.',
    severity: 'CRITICAL' as const,
  },
  {
    category: 'Waterproofing & Joints',
    title: 'Waterstop Joint Displacement & Contamination',
    observation: 'Hydrophilic / PVC waterstop strip is bent and covered with wet mud slurry along the construction cold joint.',
    directive: 'Clean construction joint with high-pressure waterjet, replace damaged waterstop strip, and secure firmly at center of joint.',
    severity: 'HIGH' as const,
  },
  {
    category: 'MEP Coordination',
    title: 'Cast-in Conduit & Core Sleeve Clashing with Main Rebar',
    observation: '100mm PVC electrical conduit cut across primary beam top tension reinforcement bundle without structural clearance.',
    directive: 'Re-route conduit per coordinated CSD drawing Rev B; preserve structural rebar spacing and cover.',
    severity: 'HIGH' as const,
  }
];

export const RemarkSnippetDrawer: React.FC<RemarkSnippetDrawerProps> = ({
  isOpen,
  onClose,
  onSelectSnippet,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>Standard QA/QC Remark Library</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-6 py-2 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
        Click any verified engineering snippet to auto-fill observation and directive text.
      </div>

      {/* Snippet List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {SNIPPETS.map((s, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 transition cursor-pointer group"
            onClick={() => {
              onSelectSnippet(s.observation, s.directive, s.severity);
              onClose();
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {s.category}
                </span>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-300 transition">
                  {s.title}
                </h4>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                s.severity === 'CRITICAL' ? 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/40' :
                s.severity === 'HIGH' ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40' :
                'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40'
              }`}>
                {s.severity}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
              <span className="text-slate-800 dark:text-slate-300 font-medium">Obs: </span>
              {s.observation}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">Directive: </span>
              {s.directive}
            </p>

            <div className="flex items-center justify-end text-xs font-semibold text-brand-600 dark:text-brand-400 gap-1 group-hover:translate-x-1 transition duration-200">
              <Plus className="w-3.5 h-3.5" />
              <span>Insert Snippet</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
