import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { dbService } from "@/lib/db";
import {
  StructuralElement,
  ProjectLevel,
} from "@/types";
import { Element6DCarbonViewer } from "@/components/registry/Element6DCarbonViewer";
import { BIMDimensionNav } from "@/components/bim/BIMDimensionNav";
import {
  Leaf,
  FileSpreadsheet,
  RefreshCw,
  Box,
  Coins,
  ShieldCheck,
  Award,
} from "lucide-react";
import { toast } from "react-hot-toast";

export const BIM6DCarbonPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();

  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";

  const [elements, setElements] = useState<StructuralElement[]>([]);
  const [levels, setLevels] = useState<ProjectLevel[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<string>(
    activeProject?.currentLevelId || "ALL",
  );
  const prevLevelIdRef = useRef<string | undefined>(activeProject?.currentLevelId);
  useEffect(() => {
    if (activeProject?.currentLevelId !== prevLevelIdRef.current) {
      prevLevelIdRef.current = activeProject?.currentLevelId;
      setSelectedLevelId(activeProject?.currentLevelId || "ALL");
    }
  }, [activeProject?.currentLevelId]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!currentProjId) return;
    setLoading(true);
    try {
      const [elemList, lvlList] = await Promise.all([
        dbService.getElements(currentProjId, currentCompId),
        dbService.getLevels(currentProjId, currentCompId),
      ]);
      setElements(elemList);
      setLevels(lvlList);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load 6D embodied carbon & sustainability data.");
    } finally {
      setLoading(false);
    }
  }, [currentProjId, currentCompId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-xs uppercase tracking-wider mb-1 font-bold">
            <Leaf className="w-4 h-4" />
            <span>6D BIM Dimension &bull; Embodied Carbon &amp; ESG Lifecycle</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            6D Sustainability &amp; Carbon Footprint Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cradle-to-gate (A1&ndash;A4) embodied carbon accounting, SCM cement replacement offsets, LEED/BREEAM rating, and ICE database calibration
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/project/5d-cost"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm transition"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>5D Cost Takeoff</span>
          </Link>

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
        activeDimension="6D"
        counts={{
          elements: elements.length,
          levels: levels.length,
        }}
      />

      {/* Main 6D Carbon Viewer Component */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-32 text-center shadow-xl">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Computing Embodied Carbon &amp; Eco-Ratings...
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Running ICE Database emission calculations across concrete grades and reinforcement steel
          </p>
        </div>
      ) : (
        <Element6DCarbonViewer
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

export default BIM6DCarbonPage;
