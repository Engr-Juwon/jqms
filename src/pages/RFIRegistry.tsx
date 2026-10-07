import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjectStore } from '@/stores/useProjectStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { dbService, sortByNewestFirst } from '@/lib/db';
import { generateRFIPDF } from '@/lib/pdfGenerators';
import { hasPermission } from '@/lib/rbac';
import { RequestForInformation } from '@/types';
import {
  FileQuestion,
  Plus,
  Search,
  FileDown,
  Clock,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const RFIRegistry: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject } = useProjectStore();
  const { company, currentUser } = useAuthStore();
  const currentProjId = activeProject?.id || projectId || '';
  const currentCompId = currentUser?.companyId || company?.id || activeProject?.companyId || '';
  const canCreateRFI = hasPermission(currentUser?.role, 'CREATE_RFI');

  const [rfis, setRfis] = useState<RequestForInformation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    async function load() {
      if (!currentProjId) {
        setRfis([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const list = await dbService.getRFIs(currentProjId, currentCompId);
      setRfis(sortByNewestFirst(list));
      setLoading(false);
    }
    load();
  }, [currentProjId, currentCompId]);

  const filtered = sortByNewestFirst(rfis.filter((r) => {
    const matchSearch =
      (r.rfiNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.drawingReference || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-1">
            <FileQuestion className="w-4 h-4" />
            <span>Technical Inquiry & Engineering Clarifications (ISO 9001:2015 Clause 8.2.3)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Requests for Information (RFI)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Drawing ambiguities, specification conflicts, cost/schedule impact tracking, and consultant responses
          </p>
        </div>

        {canCreateRFI ? (
          <Link
            to="/project/rfi/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Draft Technical RFI</span>
          </Link>
        ) : (
          <button
            disabled
            title="You do not have permission to raise RFIs"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold cursor-not-allowed opacity-60"
          >
            <Plus className="w-4 h-4" />
            <span>Draft Technical RFI</span>
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search RFI #, subject, drawing ref..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="RESPONDED">RESPONDED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      {/* RFI Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">Loading RFI records from database...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">No Technical RFIs Found</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              There are currently no Requests for Information logged for this project and company workspace.
            </p>
            {canCreateRFI ? (
              <Link
                to="/project/rfi/create"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Draft First RFI</span>
              </Link>
            ) : (
              <button
                disabled
                title="You do not have permission to raise RFIs"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold cursor-not-allowed opacity-60"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Draft First RFI</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">RFI Number</th>
                  <th className="py-3 px-4">Subject Title</th>
                  <th className="py-3 px-4">Drawing Ref</th>
                  <th className="py-3 px-4">Discipline</th>
                  <th className="py-3 px-4">Impacts</th>
                  <th className="py-3 px-4">Consultant</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {filtered.map((rfi) => (
                  <tr key={rfi.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                      <Link to={`/project/rfi/${rfi.id}`} className="hover:underline">
                        {rfi.rfiNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-200 line-clamp-1">{rfi.title}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">Raised: {rfi.raisedBy?.date}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">{rfi.drawingReference}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{rfi.discipline}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {rfi.costImpact && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-[9px] font-bold border border-amber-200 dark:border-amber-500/30">
                            Cost: ${rfi.costImpactEstimate || 0}
                          </span>
                        )}
                        {rfi.scheduleImpact && (
                          <span className="px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-300 font-mono text-[9px] font-bold border border-red-200 dark:border-red-500/30">
                            Delay: +{rfi.scheduleDelayDays || 0}d
                          </span>
                        )}
                        {!rfi.costImpact && !rfi.scheduleImpact && (
                          <span className="text-slate-400 dark:text-slate-500 text-[10px]">None</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{rfi.assignedConsultant}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        rfi.status === 'RESPONDED' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' :
                        rfi.status === 'SUBMITTED' ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}>
                        {rfi.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => generateRFIPDF(rfi, activeProject || {}, company || {})}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Download RFI PDF"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/project/rfi/${rfi.id}`}
                        className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold"
                      >
                        <span>Review</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
