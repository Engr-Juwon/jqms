import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/stores/useProjectStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { dbService } from '@/lib/db';
import {
  StructuralElement,
  ProjectLevel,
  Gridline,
  WorkPackage,
  NonConformanceReport,
} from '@/types';
import { GridPlanCanvas } from '@/components/registry/GridPlanCanvas';
import { ElementModal } from '@/components/registry/ElementModal';
import { ElementActionModal } from '@/components/registry/ElementActionModal';
import { ElementViewer } from '@/components/registry/ElementViewer';
import { BIMDimensionNav } from '@/components/bim/BIMDimensionNav';
import { Grid, Layers, Box, Plus, ArrowLeft } from 'lucide-react';
import { hasMinRole, isQAQCUser } from '@/lib/permissions';
import { toast } from 'react-hot-toast';

export const GridPlanPage: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentProjId = activeProject?.id || projectId || '';
  const currentCompId = currentUser?.companyId || company?.id || activeProject?.companyId || '';

  const [elements, setElements] = useState<StructuralElement[]>([]);
  const [levels, setLevels] = useState<ProjectLevel[]>([]);
  const [gridlines, setGridlines] = useState<Gridline[]>([]);
  const [packages, setPackages] = useState<WorkPackage[]>([]);
  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [selectedActionElement, setSelectedActionElement] = useState<StructuralElement | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingElement, setEditingElement] = useState<StructuralElement | null>(null);
  const [viewerElement, setViewerElement] = useState<StructuralElement | null>(null);

  const isQAQC = isQAQCUser(currentUser);
  const isLvl2 = hasMinRole(currentUser?.role, 2);
  const canEdit = isQAQC || isLvl2 || !currentUser;

  useEffect(() => {
    if (!currentProjId) return;

    let isMounted = true;

    // Load initial static layout data (levels, gridlines, work packages)
    const loadStaticData = async () => {
      try {
        const [lvlList, gridList, pkgList] = await Promise.all([
          dbService.getLevels(currentProjId, currentCompId),
          dbService.getGridlines(currentProjId, currentCompId),
          dbService.getWorkPackages(currentProjId, currentCompId),
        ]);
        if (isMounted) {
          setLevels(lvlList);
          setGridlines(gridList);
          setPackages(pkgList);
        }
      } catch (err) {
        console.error('Failed to load levels, gridlines, or packages:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStaticData();

    // Subscribe in real-time to StructuralElements
    const unsubElements = dbService.subscribeElements(
      currentProjId,
      (liveElements) => {
        if (isMounted) {
          setElements(liveElements);
          setLoading(false);
        }
      },
      currentCompId
    );

    // Subscribe in real-time to NCRs
    const unsubNCRs = dbService.subscribeNCRs(
      currentProjId,
      (liveNCRs) => {
        if (isMounted) {
          setNcrs(liveNCRs);
        }
      },
      currentCompId
    );

    return () => {
      isMounted = false;
      unsubElements();
      unsubNCRs();
    };
  }, [currentProjId, currentCompId]);

  // Click handler from 2D Canvas: Prompts the user to choose between editing or viewing details
  const handleSelectElement = (el: StructuralElement) => {
    setSelectedActionElement(el);
  };

  // Launch editing modal
  const handleStartEdit = (el: StructuralElement) => {
    setSelectedActionElement(null);
    setEditingElement(el);
    setShowEditModal(true);
  };

  // Launch technical details / 3D BIM viewer modal
  const handleViewDetails = (el: StructuralElement) => {
    setSelectedActionElement(null);
    setViewerElement(el);
  };

  // Navigate to full Element Passport
  const handleOpenPassport = (el: StructuralElement) => {
    setSelectedActionElement(null);
    navigate(`/project/elements/${el.id}`);
  };

  const handleSaveElement = async (payload: Partial<StructuralElement>, editingId: string | null) => {
    if (!canEdit) {
      toast.error('Unauthorized: QA/QC authority required to modify elements.');
      return;
    }
    if (!currentProjId) return;

    try {
      const now = new Date().toISOString();
      const targetId = editingId || `elem-${Date.now()}`;
      const existing = editingId ? elements.find((e) => e.id === editingId) : undefined;

      const elementToSave: StructuralElement = {
        ...(existing || {}),
        ...payload,
        id: targetId,
        projectId: currentProjId,
        companyId: currentCompId,
        elementName: payload.elementName || payload.name || existing?.elementName || existing?.name || 'New Element',
        name: payload.name || payload.elementName || existing?.name || existing?.elementName || 'New Element',
        elementType: payload.elementType || existing?.elementType || 'SLAB',
        levelId: payload.levelId || existing?.levelId || (levels[0]?.id ?? ''),
        grid: payload.grid || existing?.grid || '',
        status: payload.status || existing?.status || 'PLANNED',
        calculatedVolume: payload.calculatedVolume ?? existing?.calculatedVolume ?? 0,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      } as StructuralElement;

      // Immediate optimistic local update so the 2D canvas responds with 0 latency
      setElements((prev) => {
        if (editingId) {
          return prev.map((el) => (el.id === editingId ? elementToSave : el));
        } else {
          return [...prev, elementToSave];
        }
      });

      setShowEditModal(false);
      setEditingElement(null);

      // Persist to database (triggers onSnapshot for all clients and syncs server state)
      await dbService.saveElement(elementToSave);
      toast.success(editingId ? 'Element updated successfully' : 'Element created successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save element.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-mono text-xs uppercase tracking-wider mb-1 font-bold">
            <Grid className="w-4 h-4" />
            <span>2D Spatial Blueprint Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Interactive Structural Grid Plan
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            True-scale coordinate overlays for QA Lifecycle Status, Formwork Contact Heatmaps, and Quality Defect Risk
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {canEdit && (
            <button
              onClick={() => {
                setEditingElement(null);
                setShowEditModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow transition"
              title="Add a new structural element"
            >
              <Plus className="w-4 h-4" />
              <span>New Element</span>
            </button>
          )}

          {canEdit && (
            <Link
              to="/project/elements"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow transition"
            >
              <Box className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Element Registry</span>
            </Link>
          )}

          <Link
            to="/project/gridlines"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow transition"
          >
            <span>Manage Gridlines</span>
          </Link>
        </div>
      </div>

      {/* BIM Dimension Navigation Bar */}
      <BIMDimensionNav
        activeDimension="2D"
        counts={{
          elements: elements.length,
          levels: levels.length,
          gridlines: gridlines.length,
        }}
      />

      {/* Main Grid Plan Canvas */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-24 text-center shadow-xl">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rendering true-scale grid plan canvas...</p>
        </div>
      ) : (
        <GridPlanCanvas
          elements={elements}
          levels={levels}
          gridlines={gridlines}
          ncrs={ncrs}
          projectId={currentProjId}
          onSelectElement={handleSelectElement}
          onEditElement={handleStartEdit}
          onViewDetails={handleViewDetails}
        />
      )}

      {/* Choice Prompt Modal: Edit or View Details */}
      {selectedActionElement && (
        <ElementActionModal
          isOpen={!!selectedActionElement}
          element={selectedActionElement}
          levelName={levels.find((l) => l.id === selectedActionElement?.levelId)?.name || selectedActionElement?.levelName}
          canEdit={canEdit}
          onClose={() => setSelectedActionElement(null)}
          onEdit={handleStartEdit}
          onViewDetails={handleViewDetails}
          onOpenPassport={handleOpenPassport}
        />
      )}

      {/* Edit & Update Modal */}
      {showEditModal && canEdit && (
        <ElementModal
          isOpen={showEditModal}
          editingElement={editingElement}
          levels={levels}
          gridlines={gridlines}
          packages={packages}
          onClose={() => {
            setShowEditModal(false);
            setEditingElement(null);
          }}
          onSubmit={handleSaveElement}
        />
      )}

      {/* 3D BIM & Technical Details Viewer Modal */}
      {viewerElement && (
        <ElementViewer
          element={viewerElement}
          isOpen={!!viewerElement}
          levelName={levels.find((l) => l.id === viewerElement?.levelId)?.name || viewerElement.levelName}
          onClose={() => setViewerElement(null)}
        />
      )}
    </div>
  );
};

export default GridPlanPage;
