import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { dbService } from "@/lib/db";
import { isQAQCUser } from "@/lib/permissions";
import {
  StructuralElement,
  ProjectLevel,
  Gridline,
  WorkPackage,
  InspectionRequest,
  NonConformanceReport,
  ConcreteCubeSample,
  SiteCommentReport,
} from "@/types";
import { BIMViewer3D } from "@/components/bim/BIMViewer3D";
import { BIMDimensionNav } from "@/components/bim/BIMDimensionNav";
import { ElementViewer } from "@/components/registry/ElementViewer";
import { ElementModal } from "@/components/registry/ElementModal";
import {
  getOrCalculateVolume,
  getOrCalculateFormworkArea,
  getOrCalculateElementArea,
} from "@/lib/elementCalculations";
import {
  Box,
  Layers,
  Grid,
  Coins,
  Leaf,
  Table as TableIcon,
  Plus,
  Building2,
  Maximize2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-hot-toast";

export const BIM3DViewerPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject, setCurrentLevel } = useProjectStore();
  const { currentUser, company } = useAuthStore();

  const currentLevelId = activeProject?.currentLevelId;

  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";

  const [elements, setElements] = useState<StructuralElement[]>([]);
  const [levels, setLevels] = useState<ProjectLevel[]>([]);
  const [gridlines, setGridlines] = useState<Gridline[]>([]);
  const [packages, setPackages] = useState<WorkPackage[]>([]);
  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [cubeTests, setCubeTests] = useState<ConcreteCubeSample[]>([]);
  const [siteComments, setSiteComments] = useState<SiteCommentReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Inspector & Edit Modals
  const [viewerElement, setViewerElement] = useState<StructuralElement | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingElement, setEditingElement] = useState<StructuralElement | null>(null);

  const isQAQC = isQAQCUser(currentUser) || !currentUser;

  const loadData = useCallback(async () => {
    if (!currentProjId) return;
    setLoading(true);
    try {
      const [
        elemList,
        lvlList,
        gridList,
        pkgList,
        inspList,
        ncrList,
        cubeList,
        commentList,
      ] = await Promise.all([
        dbService.getElements(currentProjId, currentCompId),
        dbService.getLevels(currentProjId, currentCompId),
        dbService.getGridlines(currentProjId, currentCompId),
        dbService.getWorkPackages(currentProjId, currentCompId),
        dbService.getInspections(currentProjId, currentCompId),
        dbService.getNCRs(currentProjId, currentCompId),
        dbService.getCubeSamples(currentProjId, currentCompId),
        dbService.getSiteComments(currentProjId, currentCompId),
      ]);
      setElements(elemList);
      setLevels(lvlList);
      setGridlines(gridList);
      setPackages(pkgList);
      setInspections(inspList);
      setNcrs(ncrList);
      setCubeTests(cubeList);
      setSiteComments(commentList);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load 3D structural model data.");
    } finally {
      setLoading(false);
    }
  }, [currentProjId, currentCompId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveElement = async (
    payload: Partial<StructuralElement>,
    editingId: string | null,
  ) => {
    if (!isQAQC) {
      toast.error("Unauthorized: QA/QC authority required to modify elements.");
      return;
    }
    if (!currentProjId || !payload.elementName) {
      toast.error("Element Name is required.");
      return;
    }

    try {
      const fmwk = getOrCalculateFormworkArea(payload);
      const vol = getOrCalculateVolume(payload);
      const area = getOrCalculateElementArea(payload);
      const payloadWithTakeoffs: Partial<StructuralElement> = {
        ...payload,
        calculatedFormworkArea: payload.calculatedFormworkArea || fmwk,
        calculatedVolume: payload.calculatedVolume || vol,
        area: payload.area || area,
      };

      if (editingId) {
        const existing = elements.find((e) => e.id === editingId);
        const updated: StructuralElement = {
          ...existing,
          ...payloadWithTakeoffs,
          id: editingId,
          projectId: currentProjId,
          companyId: currentCompId,
          updatedAt: new Date().toISOString(),
        } as StructuralElement;

        await dbService.saveElement(updated);
        toast.success(`Element "${updated.elementName}" updated.`);
      } else {
        const created: StructuralElement = {
          ...payloadWithTakeoffs,
          id: `elem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          projectId: currentProjId,
          companyId: currentCompId,
          status: payload.status || "PENDING",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as StructuralElement;

        await dbService.saveElement(created);
        toast.success(`Element "${created.elementName}" registered.`);
      }

      setShowEditModal(false);
      setEditingElement(null);
      loadData();
    } catch (err) {
      toast.error("Failed to save element.");
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-mono text-xs uppercase tracking-wider mb-1 font-bold">
            <Box className="w-4 h-4" />
            <span>3D Spatial Twin &bull; WebGL Structural BIM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Interactive 3D BIM Structural Twin
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time geometry renderer, level filtering, QA/QC hold point color coding, and interactive element inspector
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm transition"
            title="Reload 3D Model"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          {isQAQC && (
            <button
              onClick={() => {
                setEditingElement(null);
                setShowEditModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Register Element</span>
            </button>
          )}

          <Link
            to="/project/elements"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-bold shadow-sm transition"
          >
            <TableIcon className="w-3.5 h-3.5 text-brand-400 dark:text-brand-600" />
            <span>Element Registry</span>
          </Link>
        </div>
      </div>

      {/* BIM Dimension Navigation Bar */}
      <BIMDimensionNav
        activeDimension="3D"
        counts={{
          elements: elements.length,
          levels: levels.length,
          packages: packages.length,
          gridlines: gridlines.length,
        }}
      />

      {/* 3D BIM Viewer Canvas Container */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl min-h-[700px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 text-center">
            <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Generating WebGL Structural 3D Meshes...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Building true-scale column, beam, slab, and wall geometries
            </p>
          </div>
        ) : (
          <BIMViewer3D
            elements={elements}
            levels={levels}
            gridlines={gridlines}
            activeLevelId={currentLevelId || undefined}
            onLevelChange={(lvlId) => {
              const lvl = levels.find((l) => l.id === lvlId);
              setCurrentLevel(lvlId, lvl?.name || "");
            }}
            onSelectElement={(el) => {
              if (el) {
                setViewerElement(el);
              }
            }}
            projectId={currentProjId}
          />
        )}
      </div>

      {/* Element Inspector Passport Modal */}
      {viewerElement && (
        <ElementViewer
          element={viewerElement}
          levelName={
            levels.find((l) => l.id === viewerElement.levelId)?.name ||
            viewerElement.level ||
            "Standard Floor"
          }
          isOpen={!!viewerElement}
          onClose={() => setViewerElement(null)}
        />
      )}

      {/* Edit/Create Element Modal */}
      {showEditModal && isQAQC && (
        <ElementModal
          isOpen={showEditModal}
          editingElement={editingElement}
          levels={levels}
          gridlines={gridlines}
          onClose={() => {
            setShowEditModal(false);
            setEditingElement(null);
          }}
          onSubmit={handleSaveElement}
        />
      )}
    </div>
  );
};

export default BIM3DViewerPage;
