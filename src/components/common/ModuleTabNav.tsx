import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";

export interface ModuleTabItem {
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface ModuleTabNavProps {
  items: ModuleTabItem[];
  className?: string;
}

export const ModuleTabNav: React.FC<ModuleTabNavProps> = ({
  items,
  className = "",
}) => {
  const location = useLocation();

  return (
    <div
      className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl ${className}`}
    >
      {items.map((tab) => {
        const isActive =
          location.pathname === tab.path ||
          location.pathname.startsWith(`${tab.path}/`);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
              isActive
                ? "bg-brand-600 text-white shadow-sm shadow-brand-500/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
};
