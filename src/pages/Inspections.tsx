import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjectStore } from '@/stores/useProjectStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { dbService, sortByNewestFirst } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';
import { InspectionRequest } from '@/types';
import { toast } from 'react-hot-toast';
import {
  ClipboardCheck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { ModuleTabNav } from '@/components/common/ModuleTabNav';

export const Inspections: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentProjId = activeProject?.id || projectId || '';
  const currentCompId = currentUser?.companyId || company?.id || activeProject?.companyId || '';
  const canCreateInspection = hasPermission(currentUser?.role, 'CREATE_INSPECTION');

  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');

  const inspectionsRef = React.useRef<InspectionRequest[]>([]);
  const isInitialLoadRef = React.useRef(true);
  useEffect(() => {
    inspectionsRef.current = inspections;
  }, [inspections]);

  useEffect(() => {
    if (!currentProjId) return;
    isInitialLoadRef.current = true;

    // Load initial data
    dbService.getInspections(currentProjId, currentCompId).then((list) => {
      setInspections(sortByNewestFirst(list));
    });

    // Real-time listener without page reload or loading state
    const unsub = dbService.subscribeInspections(
      currentProjId,
      (incoming) => {
        if (!incoming) return;

        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          setInspections(sortByNewestFirst(incoming));
          return;
        }

        const prevList = inspectionsRef.current;
        const prevMap = new Map(prevList.map((i) => [i.id, i]));
        const incomingMap = new Map(incoming.map((i) => [i.id, i]));
        const currentUid = currentUser?.uid;

        incoming.forEach((item) => {
          const prev = prevMap.get(item.id);
          if (!prev) {
            // New inspection created
            if (item.inspector?.uid && item.inspector.uid !== currentUid) {
              const by = item.inspector.name || "a site inspector";
              toast.success(`📋 New Inspection ${item.inspectionNumber} logged by ${by}`, {
                icon: "🔔",
                duration: 4000,
              });
            }
          } else if (prev.status !== item.status) {
            toast(`⚡ Inspection ${item.inspectionNumber} status updated to ${item.status}`, {
              icon: "📝",
              duration: 4000,
            });
          }
        });

        prevList.forEach((prevItem) => {
          if (!incomingMap.has(prevItem.id)) {
            toast(`Inspection ${prevItem.inspectionNumber} was removed`, {
              icon: "🗑️",
              duration: 4000,
            });
          }
        });

        setInspections(sortByNewestFirst(incoming));
      },
      currentCompId,
    );

    return () => unsub();
  }, [currentProjId, currentCompId, currentUser?.uid]);

  const filtered = sortByNewestFirst(inspections.filter((i) => {
    const matchSearch =
      i.inspectionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.elementName && i.elementName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStage = stageFilter === 'ALL' || i.stage === stageFilter;
    return matchSearch && matchStage;
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-mono text-xs uppercase tracking-wider mb-1">
            <ClipboardCheck className="w-4 h-4" />
            <span>ISO 9001 Clause 8.6 Release of Products & Services</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Quality Inspection Requests (IR / WIR)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Checklist execution, pass score calculations, digital inspector sign-off, and hold point approvals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/project/inspections/schedule"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Inspection Timetable</span>
          </Link>
          {canCreateInspection ? (
            <Link
              to="/project/inspections/create"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Execute Inspection</span>
            </Link>
          ) : (
            <button
              disabled
              title="You do not have permission to create inspections"
              className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold cursor-not-allowed opacity-60 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Execute Inspection</span>
            </button>
          )}
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <ModuleTabNav
        items={[
          {
            label: "Inspection Requests (IR/WIR)",
            path: "/project/inspections",
            icon: ClipboardCheck,
          },
          {
            label: "Inspection Timetable & Schedule",
            path: "/project/inspections/schedule",
            icon: Calendar,
          },
        ]}
      />

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search inspection #, element, template..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
        >
          <option value="ALL">All Inspection Stages</option>
          <option value="Rebar">Rebar Reinforcement</option>
          <option value="Formwork">Formwork & Plumb</option>
          <option value="Concrete Pour">Concrete Casting Pre-Pour</option>
          <option value="Waterproofing">Waterproofing</option>
          <option value="MEP Embeds">MEP Embeds & Sleeves</option>
          <option value="Post-Pour">Post-Pour Striking & Curing</option>
        </select>
      </div>

      {/* Inspections Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Inspection #</th>
                <th className="py-3 px-4">Stage & Template</th>
                <th className="py-3 px-4">Location / Element</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Pass Score</th>
                <th className="py-3 px-4">Inspector</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((insp) => (
                <tr key={insp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 transition">
                  <td className="py-3 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                    <Link to={`/project/inspections/${insp.id}`} className="hover:underline">
                      {insp.inspectionNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 dark:text-slate-200">{insp.templateName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{insp.stage}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                    <div>{insp.levelName}</div>
                    <div className="text-[10px] text-slate-500">{insp.elementName || insp.gridAxis || 'General'}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                    {insp.scheduledDate} {insp.scheduledTime && `@ ${insp.scheduledTime}`}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold ${
                        insp.passScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {insp.passScore}%
                      </span>
                      <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            insp.passScore >= 80 ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${insp.passScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{insp.inspector?.name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      insp.status === 'APPROVED' ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' :
                      insp.status === 'REJECTED' ? 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30' :
                      'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    }`}>
                      {insp.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/project/inspections/${insp.id}`}
                      className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:text-brand-500 font-semibold"
                    >
                      <span>Passport</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
