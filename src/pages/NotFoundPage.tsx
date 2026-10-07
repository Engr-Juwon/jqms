import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FileQuestion,
  Home,
  ArrowLeft,
  Search,
  LayoutDashboard,
  FlaskConical,
  ClipboardCheck,
  AlertOctagon,
  CalendarClock,
  ShieldCheck,
} from "lucide-react";
import { useProjectStore } from "@/stores/useProjectStore";

export const NotFoundPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeProject } = useProjectStore();
  const projId = activeProject?.id || "";

  const getProjectPath = (subpath: string) => {
    return projId ? `/project/${projId}${subpath}` : `/project${subpath}`;
  };

  const quickLinks = [
    { label: "Executive Dashboard", path: getProjectPath("/dashboard"), icon: LayoutDashboard },
    { label: "Concrete Cube Testing", path: getProjectPath("/concrete"), icon: FlaskConical },
    { label: "Quality Inspections", path: getProjectPath("/inspections"), icon: ClipboardCheck },
    { label: "Non-Conformance (NCR)", path: getProjectPath("/ncrs"), icon: AlertOctagon },
    { label: "4D Construction Planner", path: getProjectPath("/planner"), icon: CalendarClock },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans antialiased">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-10 text-center space-y-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Icon & Graphic */}
        <div className="flex flex-col items-center justify-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 mb-1 hover:opacity-85 transition">
            <img
              src="/assets/jqms-icon.png"
              alt="JQMS Icon"
              className="w-9 h-9 object-contain drop-shadow-md rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/jqms-icon.png";
              }}
            />
            <span className="font-mono font-black text-xl tracking-tight text-slate-900 dark:text-white">
              JQMS
            </span>
          </Link>
          <div className="relative inline-flex items-center justify-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/20 flex items-center justify-center shadow-xl shadow-brand-500/10">
              <FileQuestion className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <span className="absolute -top-2 -right-2 px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-mono font-black shadow-lg shadow-orange-500/30">
              404
            </span>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2 max-w-lg mx-auto">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            ISO 9001 Document & Module Locator
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Page or Quality Module Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            The requested route or module URL does not exist or has been relocated.
          </p>
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-600 dark:text-slate-400 truncate mt-2">
            Target URL: <span className="text-brand-600 dark:text-brand-400 font-bold">{location.pathname}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <Link
            to={getProjectPath("/dashboard")}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>

          <Link
            to="/projects"
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition"
          >
            <span>All Projects</span>
          </Link>
        </div>

        {/* Quick Navigation Cards */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-left space-y-3">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Quick Quality Shortcuts:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 transition group"
                >
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

