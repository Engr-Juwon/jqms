import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { dbService } from "@/lib/db";
import {
  StructuralElement,
  ProjectLevel,
  WorkPackage,
  Gridline,
} from "@/types";
import { Element5DCostViewer } from "@/components/registry/Element5DCostViewer";
import { BIMDimensionNav } from "@/components/bim/BIMDimensionNav";
import { exportElementScheduleCSV } from "@/services/pdf/elementScheduleReport";
import {
  Coins,
  FileSpreadsheet,
  RefreshCw,
  Box,
  Layers,
  Table as TableIcon,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { toast } from "react-hot-toast";

export const BIM5DCostPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();

  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";

  const [elements, setElements] = useState<StructuralElement[]>([]);
  const [levels, setLevels] = useState<ProjectLevel[]>([]);
  const [packages, setPackages] = useState<WorkPackage[]>([]);
  const [gridlines, setGridlines] = useState<Gridline[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!currentProjId) return;
    setLoading(true);
    try {
      const [elemList, lvlList, pkgList, gridList] = await Promise.all([
        dbService.getElements(currentProjId, currentCompId),
        dbService.getLevels(currentProjId, currentCompId),
        dbService.getWorkPackages(currentProjId, currentCompId),
        dbService.getGridlines(currentProjId, currentCompId),
      ]);
      setElements(elemList);
      setLevels(lvlList);
      setPackages(pkgList);
      setGridlines(gridList);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load 5D cost and element takeoff data.");
    } finally {
      setLoading(false);
    }
  }, [currentProjId, currentCompId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const levelNameMap = new Map(levels.map((l) => [l.id, l.name]));

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-mono text-xs uppercase tracking-wider mb-1 font-bold">
            <Coins className="w-4 h-4" />
            <span>5D BIM Dimension &bull; Real-Time Cost &amp; BOQ Takeoff</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            5D Cost &amp; Commercial Valuation Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time trade bill of quantities (Concrete m³, Rebar kg, Formwork m²), unit rates calibration, and level budget allocations
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() =>
              exportElementScheduleCSV(
                elements,
                activeProject || {},
                levelNameMap,
              )
            }
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm transition"
            title="Export CSV BOQ for QS estimation"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Export BOQ CSV</span>
          </button>

          <button
            onClick={() => loadData()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/project/bim-3d"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-bold shadow-sm transition"
          >
            <Box className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-600" />
            <span>View 3D Twin</span>
          </Link>
        </div>
      </div>

      {/* BIM Dimension Navigation Bar */}
      <BIMDimensionNav
        activeDimension="5D"
        counts={{
          elements: elements.length,
          levels: levels.length,
          packages: packages.length,
          gridlines: gridlines.length,
        }}
      />

      {/* Main 5D Cost Viewer Component */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-32 text-center shadow-xl">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Calculating 5D Trade Take-Off &amp; Cost Models...
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aggregating concrete volume, formwork area, and rebar tonnage with unit rate schedules
          </p>
        </div>
      ) : (
        <Element5DCostViewer
          elements={elements}
          levels={levels}
          selectedLevelId={selectedLevelId}
          onSelectLevel={setSelectedLevelId}
          onInspectElement={(el: StructuralElement) => {
            window.location.href = `/project/elements/${el.id}`;
          }}
        />
      )}
    </div>
  );
};

export default BIM5DCostPage;
