import React from "react";
import { Link, useParams } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import {
  ShieldCheck,
  HardHat,
  Box,
  Layers,
  FlaskConical,
  ClipboardCheck,
  CalendarClock,
  History,
  TrendingUp,
} from "lucide-react";

export const Footer: React.FC<{
  variant?: "project" | "company" | "public";
}> = ({ variant = "project" }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject } = useProjectStore();
  const currentProjId = projectId || activeProject?.id || "";

  const getProjectPath = (subpath: string) => {
    return currentProjId
      ? `/project/${currentProjId}${subpath}`
      : `/project${subpath}`;
  };

  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md text-slate-500 dark:text-slate-400 text-xs py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Brand Logo & Mission */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <Link
            to={variant === "public" ? "/" : getProjectPath("/dashboard")}
            className="flex items-center gap-3 group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shadow-md group-hover:scale-105 transition">
              <img
                src="/assets/jqms-icon.png"
                alt="JQMS Icon"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/jqms-icon.png";
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight">
                  JQMS Enterprise
                </span>
                <span className="px-1.5 py-0.5 rounded bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 font-mono text-[9px] font-bold border border-brand-500/30">
                  ISO 9001:2015
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Civil Infrastructure QA/QC Management Platform
              </p>
            </div>
          </Link>
        </div>

        {/* Middle: Quick Module Links */}
        {variant !== "public" && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-medium">
            <Link
              to={getProjectPath("/dashboard")}
              className="hover:text-brand-600 dark:hover:text-brand-400 transition"
            >
              Dashboard
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              to={getProjectPath("/concrete")}
              className="hover:text-brand-600 dark:hover:text-brand-400 transition"
            >
              Concrete Lab
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              to={getProjectPath("/inspections")}
              className="hover:text-brand-600 dark:hover:text-brand-400 transition"
            >
              Inspections
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              to={getProjectPath("/ncrs")}
              className="hover:text-brand-600 dark:hover:text-brand-400 transition"
            >
              NCR Registry
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              to={getProjectPath("/site-instructions")}
              className="hover:text-brand-600 dark:hover:text-brand-400 transition"
            >
              Site Instructions
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              to={getProjectPath("/planner")}
              className="hover:text-brand-600 dark:hover:text-brand-400 transition"
            >
              4D Planner
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              to="/company/audit"
              className="hover:text-brand-600 dark:hover:text-brand-400 transition"
            >
              Audit Trail
            </Link>
          </div>
        )}

        {/* Right: Security, Standards & System Badge */}
        <div className="flex flex-col sm:flex-row items-center gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300">
              BS EN 12390 & ASTM C39 Validated
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-[10px]">Cloud Synced</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
        <p>
          © {new Date().getFullYear()} JQMS Enterprise. All rights reserved.
        </p>
        <p className="font-mono text-[10px]">Version 2.0.4 Enterprise Build</p>
      </div>
    </footer>
  );
};
