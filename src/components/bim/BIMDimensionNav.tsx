import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { isBimEnabledForProject, isBimModuleEnabled } from "@/lib/permissions";
import { BimModuleKey } from "@/types";
import {
  Grid,
  Box,
  Coins,
  Leaf,
  Layers,
  Table as TableIcon,
  Building2,
  Briefcase,
  Compass,
} from "lucide-react";

export type BIMDimension = "2D" | "3D" | "5D" | "6D" | "7D" | "MTO";

interface BIMDimensionNavProps {
  activeDimension?: BIMDimension;
  counts?: {
    elements?: number;
    levels?: number;
    packages?: number;
    gridlines?: number;
  };
}

export const BIMDimensionNav: React.FC<BIMDimensionNavProps> = ({
  activeDimension,
  counts,
}) => {
  const location = useLocation();
  const { activeProject } = useProjectStore();

  if (!isBimEnabledForProject(activeProject)) {
    return null;
  }

  const ALL_DIMENSIONS: {
    id: BIMDimension;
    moduleKey: BimModuleKey;
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    activeBg: string;
  }[] = [
    {
      id: "2D",
      moduleKey: "2d",
      label: "2D Spatial CAD",
      path: "/project/grid-plan",
      icon: Grid,
      color: "text-blue-500",
      activeBg: "bg-blue-600 text-white shadow-sm shadow-blue-500/25",
    },
    {
      id: "3D",
      moduleKey: "3d",
      label: "3D Structural Twin",
      path: "/project/bim-3d",
      icon: Box,
      color: "text-indigo-500",
      activeBg: "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25",
    },
    {
      id: "5D",
      moduleKey: "5d",
      label: "5D Cost & BOQ",
      path: "/project/5d-cost",
      icon: Coins,
      color: "text-amber-500",
      activeBg: "bg-amber-600 text-white shadow-sm shadow-amber-500/25",
    },
    {
      id: "6D",
      moduleKey: "6d",
      label: "6D Carbon & ESG",
      path: "/project/6d-carbon",
      icon: Leaf,
      color: "text-emerald-500",
      activeBg: "bg-emerald-600 text-white shadow-sm shadow-emerald-500/25",
    },
    {
      id: "7D",
      moduleKey: "7d",
      label: "7D Asset Passports",
      path: "/project/elements",
      icon: TableIcon,
      color: "text-brand-500",
      activeBg: "bg-brand-600 text-white shadow-sm shadow-brand-500/25",
    },
    {
      id: "MTO",
      moduleKey: "mto",
      label: "Material Take-Off",
      path: "/project/mto",
      icon: Layers,
      color: "text-sky-500",
      activeBg: "bg-sky-600 text-white shadow-sm shadow-sky-500/25",
    },
  ];

  const visibleDimensions = ALL_DIMENSIONS.filter((dim) =>
    isBimModuleEnabled(activeProject, dim.moduleKey),
  );

  const canShowLevels = isBimModuleEnabled(activeProject, "levels");
  const canShowPackages = isBimModuleEnabled(activeProject, "packages");
  const canShowGridlines = isBimModuleEnabled(activeProject, "gridlines");

  if (visibleDimensions.length === 0 && !canShowLevels && !canShowPackages && !canShowGridlines) {
    return null;
  }

  const determineActive = (dimId: string, dimPath: string) => {
    if (activeDimension) return activeDimension === dimId;
    return location.pathname === dimPath;
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-sm">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
        {/* Main BIM Dimension Tabs */}
        {visibleDimensions.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5 lg:pb-0 scroll-smooth">
            {visibleDimensions.map((dim) => {
              const isActive = determineActive(dim.id, dim.path);
              const Icon = dim.icon;
              return (
                <Link
                  key={dim.id}
                  to={dim.path}
                  className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
                    isActive
                      ? `${dim.activeBg}`
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? "text-white" : dim.color
                    }`}
                  />
                  <span>{dim.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Spatial Setup Links (Levels, Packages, Gridlines) */}
        {(canShowLevels || canShowPackages || canShowGridlines) && (
          <div className="flex items-center gap-1 pt-1.5 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800 justify-end shrink-0">
            {visibleDimensions.length > 0 && (
              <div className="hidden lg:block w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
            )}
            {canShowLevels && (
              <Link
                to="/project/levels"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition"
                title="Floor Levels Management"
              >
                <Building2 className="w-3.5 h-3.5 text-sky-500" />
                <span>Levels{counts?.levels !== undefined ? ` (${counts.levels})` : ""}</span>
              </Link>
            )}
            {canShowPackages && (
              <Link
                to="/project/packages"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition"
                title="Work Packages Management"
              >
                <Briefcase className="w-3.5 h-3.5 text-purple-500" />
                <span>Packages{counts?.packages !== undefined ? ` (${counts.packages})` : ""}</span>
              </Link>
            )}
            {canShowGridlines && (
              <Link
                to="/project/gridlines"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition"
                title="Gridline Axes & Spacing"
              >
                <Compass className="w-3.5 h-3.5 text-amber-500" />
                <span>Gridlines{counts?.gridlines !== undefined ? ` (${counts.gridlines})` : ""}</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
