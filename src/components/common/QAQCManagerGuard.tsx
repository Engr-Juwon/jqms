import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { canAccessBarCutting } from "@/lib/permissions";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";

interface QAQCManagerGuardProps {
  children: React.ReactNode;
}

export const QAQCManagerGuard: React.FC<QAQCManagerGuardProps> = ({ children }) => {
  const { currentUser } = useAuthStore();
  const { activeProject } = useProjectStore();
  const location = useLocation();

  const hasAccess = canAccessBarCutting(currentUser);

  if (!hasAccess) {
    const fallbackPath = activeProject?.id
      ? `/project/${activeProject.id}/steel`
      : "/project/steel";

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/60">
              <Lock className="w-3 h-3" />
              <span>Restricted Governance Role</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              QA/QC Manager Only
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Access to the Bar Bending Schedule (BBS) and Cutting Optimization module is strictly restricted to the QA/QC Manager role.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <Link
              to={fallbackPath}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-xs font-bold transition shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Steel Testing</span>
            </Link>
            <Link
              to="/project/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
            >
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default QAQCManagerGuard;
