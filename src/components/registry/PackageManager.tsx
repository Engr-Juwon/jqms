import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  Building,
} from 'lucide-react';
import { WorkPackage, ProjectLevel, StructuralElement } from '@/types';
import { dbService } from '@/lib/db';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProjectStore } from '@/stores/useProjectStore';

interface PackageManagerProps {
  packages: WorkPackage[];
  levels: ProjectLevel[];
  elements: StructuralElement[];
  onRefresh: () => void;
}

export const PackageManager: React.FC<PackageManagerProps> = ({
  packages = [],
  levels = [],
  elements = [],
  onRefresh,
}) => {
  const { company } = useAuthStore();
  const { activeProject } = useProjectStore();

  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !activeProject) return;

    const newPkg: WorkPackage = {
      id: `pkg-${Date.now()}`,
      projectId: activeProject.id,
      companyId: company?.id || activeProject.companyId || '',
      name: newName.trim(),
      code: newCode.trim() || `WP-${packages.length + 1}`,
      description: newDesc.trim(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    await dbService.saveWorkPackage(newPkg);
    setNewName('');
    setNewCode('');
    setNewDesc('');
    onRefresh();
  };

  const handleDeletePackage = async (id: string, name: string) => {
    if (window.confirm(`Delete Work Package "${name}"? Elements will remain registered.`)) {
      await dbService.deleteWorkPackage(id, activeProject?.id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Create Package Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Briefcase className="text-brand-600 dark:text-brand-400" size={18} />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Create Work Package / Section
          </h3>
        </div>

        <form onSubmit={handleCreatePackage} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-400 font-semibold mb-1">Package Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Substructure Core Works"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-400 font-semibold mb-1">Package Code</label>
            <input
              type="text"
              placeholder="e.g. WP-01"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-brand-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-400 font-semibold mb-1">Scope / Description</label>
            <input
              type="text"
              placeholder="e.g. Columns, Walls & Foundation"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition shadow-lg"
            >
              <Plus size={15} /> Add Work Package
            </button>
          </div>
        </form>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.length === 0 ? (
          <div className="col-span-full p-10 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            No work packages defined yet. Group your structural elements into packages above.
          </div>
        ) : (
          packages.map((pkg) => {
            const pkgElements = elements.filter((e) => e.workPackageId === pkg.id);
            const approvedCount = pkgElements.filter((e) => e.status === 'APPROVED').length;
            const progress = pkgElements.length > 0 ? Math.round((approvedCount / pkgElements.length) * 100) : 0;

            return (
              <div
                key={pkg.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 font-mono text-[10px] font-black border border-brand-200 dark:border-brand-500/20">
                        {pkg.code || 'WP'}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{pkg.name}</h4>
                    </div>
                    <button
                      onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
                      title="Delete Work Package"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {pkg.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{pkg.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Elements</span>
                      <strong className="text-slate-900 dark:text-white text-sm">{pkgElements.length}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Approved</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{approvedCount} ({progress}%)</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>Package Progress</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        progress === 100 ? 'bg-emerald-500' : 'bg-brand-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
