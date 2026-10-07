import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjectStore } from '@/stores/useProjectStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { dbService } from '@/lib/db';
import { InspectionRequest } from '@/types';
import { Calendar, Clock, Plus, ChevronRight, AlertCircle } from 'lucide-react';

export const InspectionSchedule: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentProjId = activeProject?.id || projectId || '';
  const currentCompId = currentUser?.companyId || company?.id || activeProject?.companyId || '';

  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!currentProjId) {
        setInspections([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const list = await dbService.getInspections(currentProjId, currentCompId);
      setInspections(list);
      setLoading(false);
    }
    load();
  }, [currentProjId, currentCompId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-1 font-bold">
            <Calendar className="w-4 h-4" />
            <span>Hold Points & Witness Calendar (ISO 9001:2015 Clause 8.6)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Inspection Timetable & Schedule
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Planned inspection hold points, scheduled time slots, and assigned witness inspectors
          </p>
        </div>

        <Link
          to="/project/inspections/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Execute Inspection</span>
        </Link>
      </div>

      {/* Timetable Cards */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">Loading inspection schedule...</div>
      ) : inspections.length === 0 ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">No Scheduled Inspections Found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are currently no inspection hold points logged for this project and company workspace.
          </p>
          <Link
            to="/project/inspections/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Execute First Inspection</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {inspections.map((insp) => (
            <div
              key={insp.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs transition"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-w-[70px]">
                  <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400 mb-1" />
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{insp.scheduledTime || '09:00 AM'}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{insp.inspectionNumber}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      {insp.stage}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{insp.templateName}</h3>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-1">
                    Location: <span className="text-slate-800 dark:text-slate-200 font-medium">{insp.levelName}</span> ({insp.elementName || insp.gridAxis || 'General'}) • Inspector: {insp.inspector?.name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={
                  insp.status === 'APPROVED' ? 'px-2.5 py-1 rounded-lg text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30' :
                  insp.status === 'REJECTED' ? 'px-2.5 py-1 rounded-lg text-xs font-bold border bg-rose-50 text-rose-700 border-rose-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30' :
                  'px-2.5 py-1 rounded-lg text-xs font-bold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                }>
                  {insp.status}
                </span>

                <Link
                  to={`/project/inspections/${insp.id}`}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InspectionSchedule;