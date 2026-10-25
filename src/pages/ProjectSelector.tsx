import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { hasMinRole } from "@/lib/permissions";
import { Project } from "@/types";
import { Footer } from "@/components/common/Footer";
import {
  Building2,
  FolderPlus,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  MapPin,
  HardHat,
  Loader2,
  ShieldCheck,
  Award,
  Edit3,
} from "lucide-react";

export const ProjectSelector: React.FC = () => {
  const navigate = useNavigate();
  const { projects, setActiveProject, loadProjects, isLoading } =
    useProjectStore();
  const { currentUser, company } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  useEffect(() => {
    loadProjects(currentUser?.companyId || company?.id, currentUser);
  }, [currentUser?.companyId, company?.id]);

  const canCreate = hasMinRole(currentUser?.role, 4);

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.clientName &&
        p.clientName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchType =
      filterType === "ALL" ||
      p.type?.toLowerCase() === filterType.toLowerCase();
    return matchSearch && matchType;
  });

  const handleSelect = (project: Project) => {
    setActiveProject(project);
    navigate("/project/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 md:p-12 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <Link
              to="/"
              className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center shadow-lg shrink-0 hover:scale-105 transition"
            >
              <img
                src="/assets/jqms-icon.png"
                alt="JQMS Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/jqms-icon.png";
                }}
              />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-brand-600 dark:text-indigo-400 font-mono text-xs uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>ISO 9001:2015 Multi-Project Governance Hub</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Active Civil Projects
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {company?.name
                  ? `${company.name} Workspace`
                  : "Global Construction Quality Workspace"}{" "}
                — Select project scope for 3D BIM, QA/QC hold points, and
                inspection dossiers
              </p>
            </div>
          </div>

          {canCreate && (
            <Link
              to="/company/projects/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 dark:shadow-indigo-500/20 transition"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Provision New Project</span>
            </Link>
          )}
        </div>

        {/* Search & Type Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects by name, code, or client..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            {[
              "ALL",
              "Commercial",
              "Residential",
              "Infrastructure",
              "Industrial",
            ].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${filterType === type ? "bg-brand-600 dark:bg-indigo-600 text-white shadow" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 text-brand-600 dark:text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              Retrieving live enterprise projects from database...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 dark:bg-indigo-500/10 border border-brand-500/20 dark:border-indigo-500/20 text-brand-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {projects.length > 0 && (filterType !== "ALL" || searchTerm)
                ? `No Matching Projects Found`
                : "No Construction Projects Provisioned"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {projects.length > 0 && (filterType !== "ALL" || searchTerm)
                ? "No projects match your current filter or search criteria. Try selecting 'ALL' or resetting your search filter."
                : "There are no active projects found for this company in the database. Provision your first project to configure structural grids, BIM elements, and ISO 9001 QA/QC inspection matrices."}
            </p>
            {projects.length > 0 && (filterType !== "ALL" || searchTerm) ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFilterType("ALL");
                    setSearchTerm("");
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold transition"
                >
                  Clear Filters & Show All Projects
                </button>
              </div>
            ) : canCreate ? (
              <div className="pt-2">
                <Link
                  to="/company/projects/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 dark:shadow-indigo-500/20 transition"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Provision First Project</span>
                </Link>
              </div>
            ) : null}
          </div>
        )}

        {/* Project Cards Grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((proj) => (
              <div
                key={proj.id}
                onClick={() => handleSelect(proj)}
                className="group rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-brand-500/60 dark:hover:border-indigo-500/60 transition-all duration-200 overflow-hidden flex flex-col shadow-sm hover:shadow-xl dark:shadow-xl cursor-pointer hover:-translate-y-1"
              >
                {/* Cover Graphic */}
                <div className="h-44 relative bg-slate-100 dark:bg-slate-950 overflow-hidden">
                  <img
                    src={
                      proj.coverImageUrl ||
                      "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800"
                    }
                    alt={proj.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90 dark:opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 dark:from-slate-900 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700 font-mono text-[11px] font-bold text-indigo-300">
                    {proj.code}
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{proj.status}</span>
                    </div>
                    {canCreate && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/company/projects/${proj.id}/edit`);
                        }}
                        className="p-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                        title="Edit Project Specification & Matrix"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-brand-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                      {proj.type}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-indigo-300 transition mt-1 line-clamp-1">
                      {proj.name}
                    </h3>
                    {proj.address && (
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mt-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{proj.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                    {proj.clientName && (
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Client:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {proj.clientName}
                        </span>
                      </div>
                    )}
                    {proj.consultantName && (
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Consultant:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {proj.consultantName}
                        </span>
                      </div>
                    )}
                    {proj.contractorName && (
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Contractor:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {proj.contractorName}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs font-bold text-brand-600 dark:text-indigo-400 group-hover:text-brand-700 dark:group-hover:text-indigo-300">
                    <span>Open QA/QC Workspace</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="max-w-6xl mx-auto mt-12">
        <Footer variant="public" />
      </div>
    </div>
  );
};
