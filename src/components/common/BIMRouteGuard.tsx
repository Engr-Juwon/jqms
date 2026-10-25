import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  getBimModuleForRoute,
  isBimModuleEnabled,
  canManageProjectFeatures,
} from "@/lib/permissions";
import { Box, Lock, ArrowLeft, Settings, ShieldAlert } from "lucide-react";

interface BIMRouteGuardProps {
  children: React.ReactNode;
}

const MODULE_NAMES: Record<string, string> = {
  "elements": "Element Registry",
  "2d": "2D Interactive Grid Plan",
  "3d": "3D Structural Digital Twin",
  "4d": "4D Construction Planner",
  "5d": "5D Cost Takeoff & BOQ",
  "6d": "6D Carbon & Sustainability ESG",
  "7d": "7D Asset Register & Passports",
  "mto": "Material Take-Off (MTO)",
  "gridlines": "Gridlines & Axis Matrix",
  "levels": "Floor Levels & Vertical Zones",
  "packages": "Work Packages & Disciplines",
};

export const BIMRouteGuard: React.FC<BIMRouteGuardProps> = ({ children }) => {
  const location = useLocation();
  const { activeProject } = useProjectStore();
  const { currentUser } = useAuthStore();

  const moduleKey = getBimModuleForRoute(location.pathname);
  const isEnabled = moduleKey ? isBimModuleEnabled(activeProject, moduleKey) : true;

  if (isEnabled) {
    return <>{children}</>;
  }

  const moduleLabel = moduleKey ? MODULE_NAMES[moduleKey] || "BIM Module" : "BIM Module";
  const canEnable = canManageProjectFeatures(currentUser, activeProject);
 
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
          <Box className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60">
            <Lock className="w-3 h-3" />
            <span>Module Inactive</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {moduleLabel} Disabled
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            The <span className="font-semibold text-slate-700 dark:text-slate-200">{moduleLabel}</span> module is currently disabled for{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {activeProject?.name || "this project"}
            </span>.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-400 text-left space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Access &amp; Governance Policy</span>
          </div>
          <p>
            Only the Project Administrator or someone on Level 5 (Super Admin, Quality Director, Executive Management, Quality Manager, QAQC Manager) can toggle individual BIM module visibility and access for this project.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 justify-center">
          <Link
            to="/project/dashboard"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>

          {canEnable && activeProject && (
            <Link
              to={`/company/projects/${activeProject.id}/edit?tab=bim`}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 transition active:scale-95"
            >
              <Settings className="w-4 h-4" />
              <span>Configure in Project Admin</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
