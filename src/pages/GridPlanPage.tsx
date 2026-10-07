import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProjectStore } from '@/stores/useProjectStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { dbService } from '@/lib/db';
import { StructuralElement, ProjectLevel, Gridline, NonConformanceReport } from '@/types';
import { GridPlanCanvas } from '@/components/registry/GridPlanCanvas';
import { ElementModal } from '@/components/registry/ElementModal';
import { Grid, Layers, Box, Plus, ArrowLeft } from 'lucide-react';
import { hasMinRole, isQAQCUser } from '@/lib/permissions';
import { toast } from 'react-hot-toast';

export const GridPlanPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentProjId = activeProject?.id || projectId || '';
  const currentCompId = currentUser?.companyId || company?.id || activeProject?.companyId || '';

  const [elements, setElements] = useState<StructuralElement[]>([]);
  const [levels, setLevels] = useState<ProjectLevel[]>([]);
  const [gridlines, setGridlines] = useState<Gridline[]>([]);
  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingElement, setEditingElement] = useState<StructuralElement | null>(null);

  const isQAQC = isQAQCUser(currentUser);
  const isLvl2 = hasMinRole(currentUser?.role, 2);

  const loadData = async () => {
    if (!currentProjId) return;
    setLoading(true);
    try {
      const [elList, lvlList, gridList, ncrList] = await Promise.all([
        dbService.getElements(currentProjId, currentCompId),
        dbService.getLevels(currentProjId, currentCompId),
        dbService.getGridlines(currentProjId, currentCompId),
        dbService.getNCRs(currentProjId, currentCompId),
      ]);
      setElements(elList);
      setLevels(lvlList);
      setGridlines(gridList);
      setNcrs(ncrList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentProjId, currentCompId]);

  const handleSaveElement = async (payload: Partial<StructuralElement>, editingId: string | null) => {
    if (!isQAQC) {
      toast.error('Unauthorized: QA/QC authority required to modify elements.');
      return;
    }
    if (!currentProjId) return;
    try {
      if (editingId) {
        const existing = elements.find((e) => e.id === editingId);
        await dbService.saveElement({
          ...existing,
          ...payload,
          id: editingId,
          projectId: currentProjId,
          companyId: currentCompId,
          updatedAt: new Date().toISOString(),
        } as StructuralElement);
      }
      setShowModal(false);
      setEditingElement(null);
      loadData();
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
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-1 font-bold">
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

        <div className="flex items-center gap-3">
          {isQAQC && (
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
          onSelectElement={(el) => {
            if (isQAQC) {
              setEditingElement(el);
              setShowModal(true);
            }
          }}
        />
      )}

      {showModal && isQAQC && (
        <ElementModal
          isOpen={showModal}
          editingElement={editingElement}
          levels={levels}
          gridlines={gridlines}
          onClose={() => {
            setShowModal(false);
            setEditingElement(null);
          }}
          onSubmit={handleSaveElement}
        />
      )}
    </div>
  );
};

export default GridPlanPage;
