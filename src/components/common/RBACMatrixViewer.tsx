import React, { useState, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Users,
  Info,
  ChevronDown,
  Layers,
  Sparkles,
  Award,
} from 'lucide-react';
import { UserRole, ROLE_LEVELS, ROLE_LABELS } from '@/types';
import {
  PermissionKey,
  PERMISSION_DEFINITIONS,
  hasPermission,
  useRBAC,
} from '@/lib/rbac';

export const RBACMatrixViewer: React.FC<{ defaultRole?: UserRole }> = ({ defaultRole }) => {
  const { currentUser, role: activeRole } = useRBAC();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [inspectRole, setInspectRole] = useState<UserRole | null>(defaultRole || activeRole || null);

  const allRoles = useMemo(() => {
    return (Object.keys(ROLE_LEVELS) as UserRole[]).sort((a, b) => {
      const diff = (ROLE_LEVELS[b] || 1) - (ROLE_LEVELS[a] || 1);
      if (diff !== 0) return diff;
      return (ROLE_LABELS[a] || a).localeCompare(ROLE_LABELS[b] || b);
    });
  }, []);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    Object.values(PERMISSION_DEFINITIONS).forEach((def) => {
      cats.add(def.category);
    });
    return Array.from(cats);
  }, []);

  const filteredRoles = useMemo(() => {
    return allRoles.filter((role) => {
      const label = ROLE_LABELS[role] || role;
      const level = ROLE_LEVELS[role] || 1;
      const matchSearch =
        label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;
      if (selectedLevel !== 'ALL' && level !== Number(selectedLevel)) return false;
      return true;
    });
  }, [allRoles, searchTerm, selectedLevel]);

  const filteredPermissions = useMemo(() => {
    return Object.values(PERMISSION_DEFINITIONS).filter((def) => {
      if (selectedCategory !== 'ALL' && def.category !== selectedCategory) return false;
      if (
        searchTerm &&
        !def.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !def.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !def.category.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [selectedCategory, searchTerm]);

  return (
    <div className="space-y-6">
      {/* ═══ Header Banner ═══ */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 border border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                Statutory ISO 9001:2015 Security Matrix
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Role-Based Access Control (RBAC) Governance Matrix
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Standardized role hierarchy and permissions across all civil QA/QC modules, quality hold points, testing registries, and company governance.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              L{ROLE_LEVELS[activeRole || 'QAQC_ENGINEER'] || 4}
            </div>
            <div>
              <span className="text-[10px] text-slate-300 uppercase tracking-wider font-bold block">
                Your Active Authority
              </span>
              <span className="text-xs font-bold text-white">
                {activeRole ? ROLE_LABELS[activeRole] : 'User'}
              </span>
            </div>
          </div>
        </div>

        {/* Level Breakdown Pills */}
        <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {[
            { lvl: 5, label: 'Level 5: Executive & System Admin', color: 'text-purple-300 border-purple-800 bg-purple-950/40' },
            { lvl: 4, label: 'Level 4: Quality Manager & QA/QC', color: 'text-blue-300 border-blue-800 bg-blue-950/40' },
            { lvl: 3, label: 'Level 3: CM & Senior Leads', color: 'text-teal-300 border-teal-800 bg-teal-950/40' },
            { lvl: 2, label: 'Level 2: Field Site Engineers', color: 'text-amber-300 border-amber-800 bg-amber-950/40' },
            { lvl: 1, label: 'Level 1: External & Consultants', color: 'text-slate-300 border-slate-800 bg-slate-800/40' },
          ].map((item) => (
            <div key={item.lvl} className={`p-2 rounded-xl border ${item.color} text-center`}>
              <span className="font-bold text-[11px] block">{item.label.split(':')[0]}</span>
              <span className="text-[10px] opacity-80 block truncate">{item.label.split(':')[1]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Filter Toolbar ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search roles, actions, or permissions..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Level Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'All Levels' },
            { id: '5', label: 'Level 5 (Exec)' },
            { id: '4', label: 'Level 4 (QA/QC Lead)' },
            { id: '3', label: 'Level 3 (CM & Lead)' },
            { id: '2', label: 'Level 2 (Field)' },
            { id: '1', label: 'Level 1 (External)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedLevel(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedLevel === tab.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Role Inspector & Detailed Matrix ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Role Selector List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-brand-600" />
              <span>Select Role to Audit</span>
            </span>
            <span className="text-[11px] font-bold text-slate-400">{filteredRoles.length} Roles</span>
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-1 pr-1">
            {filteredRoles.map((role) => {
              const level = ROLE_LEVELS[role] || 1;
              const isSelected = inspectRole === role;

              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setInspectRole(role)}
                  className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-sm font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs truncate">{ROLE_LABELS[role] || role}</div>
                    <div className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-slate-400'} truncate font-mono`}>
                      {role}
                    </div>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : level === 5
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : level === 4
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : level === 3
                              ? 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300'
                              : level === 2
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    Level {level}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Permissions & Limitations Audit for Selected Role */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-sm">
          {inspectRole ? (
            <div>
              {/* Role Summary Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {ROLE_LABELS[inspectRole] || inspectRole}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/30">
                      Level {ROLE_LEVELS[inspectRole] || 1}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Authorized actions, responsibility boundary, and limitations.
                  </p>
                </div>

                {/* Category Filter dropdown */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-semibold"
                >
                  <option value="ALL">All Categories ({Object.keys(PERMISSION_DEFINITIONS).length})</option>
                  {allCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Permissions Checklist */}
              <div className="mt-4 space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                {filteredPermissions.map((def) => {
                  const permitted = hasPermission(inspectRole, def.key);

                  return (
                    <div
                      key={def.key}
                      className={`p-3 rounded-xl border transition flex items-start justify-between gap-3 ${
                        permitted
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/60'
                          : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {permitted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-bold ${
                                permitted
                                  ? 'text-slate-900 dark:text-white'
                                  : 'text-slate-500 line-through'
                              }`}
                            >
                              {def.label}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {def.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {def.description}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
                          permitted
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {permitted
                          ? 'Allowed'
                          : def.allowedRoles && def.allowedRoles.length > 0
                            ? 'Restricted (Scope)'
                            : `Req. Level ${def.minLevel}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select a role from the left to inspect permissions and limits.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RBACMatrixViewer;
