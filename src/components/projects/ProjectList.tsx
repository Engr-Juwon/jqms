import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Plus,
  MapPin,
  Layers,
  ArrowRight,
  ShieldCheck,
  Edit3,
} from "lucide-react";
import { useProjectStore } from "../../stores/useProjectStore";
import { Project } from "../../types";

export const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const { projects, loadProjects, setActiveProject } = useProjectStore();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleSelect = (project: Project) => {
    setActiveProject(project);
    navigate("/project/dashboard");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm dark:shadow-none">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Building2 className="w-7 h-7 text-brand-600 dark:text-indigo-400" />
            Active Projects Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Access multi-tenant QA/QC engineering workspaces, 3D structural
            models, and site audit registries.
          </p>
        </div>
        <button
          onClick={() => navigate("/company/projects/create")}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-500/20 dark:shadow-indigo-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          Create New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <div
            key={p.id}
            onClick={() => handleSelect(p)}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 dark:hover:border-indigo-500/50 rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-xl dark:shadow-none dark:hover:shadow-indigo-500/5 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="px-2.5 py-0.5 rounded-lg bg-brand-500/10 dark:bg-indigo-500/10 text-brand-600 dark:text-indigo-400 font-mono text-xs font-bold border border-brand-500/20 dark:border-indigo-500/20">
                  {p.code}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {p.status}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/company/projects/${p.id}/edit`);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Edit Project Specification & Matrix"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4 group-hover:text-brand-600 dark:group-hover:text-indigo-400 transition">
                {p.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                {p.type} Development
              </p>

              <div className="mt-5 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>{p.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>Contractor: {p.contractorName}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-indigo-400 group-hover:text-brand-700 dark:group-hover:text-indigo-300">
              <span>Open QA/QC Workspace</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
