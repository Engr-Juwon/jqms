import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { hasMinRole, isQAQCUser, canEditElementRegistry } from "@/lib/permissions";
import {
  StructuralElement,
  ProjectLevel,
  Gridline,
  WorkPackage,
  InspectionRequest,
  NonConformanceReport,
  ConcreteCubeSample,
  SiteCommentReport,
  ElementStatus,
  ElementType,
} from "@/types";
import {
  calculateLevelProgressList,
  EnrichedLevelProgress,
} from "@/lib/levelCalculations";
import {
  getOrCalculateVolume,
  getOrCalculateFormworkArea,
  getOrCalculateElementArea,
} from "@/lib/elementCalculations";
import { BIMViewer3D } from "@/components/bim/BIMViewer3D";
import { GridPlanCanvas } from "@/components/registry/GridPlanCanvas";
import { ElementCard } from "@/components/registry/ElementCard";
import { ElementFilters } from "@/components/registry/ElementFilters";
import { BulkToolbar } from "@/components/registry/BulkToolbar";
import { ElementModal } from "@/components/registry/ElementModal";
import { BulkElementGenerator } from "@/components/registry/BulkElementGenerator";
import { ElementViewer } from "@/components/registry/ElementViewer";
import { ElementQRTagsModal } from "@/components/registry/ElementQRTagsModal";
import {
  exportElementSchedulePDF,
  exportElementScheduleCSV,
} from "@/services/pdf/elementScheduleReport";
import {
  Box,
  Layers,
  Table as TableIcon,
  Plus,
  Copy,
  Grid,
  Building2,
  Briefcase,
  Compass,
  LayoutGrid,
  List,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  HardHat,
  ArrowUpRight,
  ArrowUpDown,
  Sparkles,
  QrCode,
  FileSpreadsheet,
  FileText,
  AlertOctagon,
  Clock,
  Hammer,
  ShieldAlert,
  BarChart3,
  Filter,
} from "lucide-react";
import { toast } from "react-hot-toast";

export const ElementRegistry: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { activeProject, setCurrentLevel } = useProjectStore();
  const { currentUser, company } = useAuthStore();

  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";

  // Data States
  const [elements, setElements] = useState<StructuralElement[]>([]);
  const [levels, setLevels] = useState<ProjectLevel[]>([]);
  const [gridlines, setGridlines] = useState<Gridline[]>([]);
  const [packages, setPackages] = useState<WorkPackage[]>([]);
  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [cubeTests, setCubeTests] = useState<ConcreteCubeSample[]>([]);
  const [siteComments, setSiteComments] = useState<SiteCommentReport[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 3D BIM, 2D Grid Plan, Cards, Table
  const [viewMode, setViewMode] = useState<"3D" | "GRID" | "CARDS" | "TABLE">(
    "TABLE",
  );

  // Modals
  const [showElementModal, setShowElementModal] = useState(false);
  const [editingElement, setEditingElement] =
    useState<StructuralElement | null>(null);
  const [showBulkGen, setShowBulkGen] = useState(false);
  const [viewerEl, setViewerEl] = useState<StructuralElement | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrModalElements, setQrModalElements] = useState<StructuralElement[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPackage, setFilterPackage] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [quickFilter, setQuickFilter] = useState<
    "ALL" | "NCRS" | "AWAITING_POUR" | "CURING" | "APPROVED"
  >("ALL");

  // Selection & Bulk
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkPkgId, setBulkPkgId] = useState("");
  const [bulkLevelId, setBulkLevelId] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const isQAQC = isQAQCUser(currentUser) || hasMinRole(currentUser?.role, 2) || !currentUser;
  const isLvl2 = hasMinRole(currentUser?.role, 2);
  const isLvl3 = hasMinRole(currentUser?.role, 3);

  // Load all structural data
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
      console.error("Failed to load structural elements:", err);
    } finally {
      setLoading(false);
    }
  }, [currentProjId, currentCompId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived Lookup Maps
  const levelNameMap = useMemo(() => {
    const map = new Map<string, string>();
    levels.forEach((l) => map.set(l.id, l.name));
    return map;
  }, [levels]);

  const pkgNameMap = useMemo(() => {
    const map = new Map<string, string>();
    packages.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [packages]);

  const inspMap = useMemo(() => {
    const map = new Map<string, InspectionRequest[]>();
    inspections.forEach((i) => {
      if (!i.elementId) return;
      const list = map.get(i.elementId) || [];
      list.push(i);
      map.set(i.elementId, list);
    });
    return map;
  }, [inspections]);

  const ncrMap = useMemo(() => {
    const map = new Map<string, NonConformanceReport[]>();
    ncrs.forEach((n) => {
      const ids = new Set<string>();
      if (n.elementId) ids.add(n.elementId);
      if (n.structuralElementId) ids.add(n.structuralElementId);
      if (Array.isArray(n.elementIds)) {
        n.elementIds.forEach((id) => id && ids.add(id));
      }
      ids.forEach((id) => {
        const list = map.get(id) || [];
        list.push(n);
        map.set(id, list);
      });
    });
    return map;
  }, [ncrs]);

  const cubeMap = useMemo(() => {
    const map = new Map<string, ConcreteCubeSample[]>();
    cubeTests.forEach((c) => {
      if (!c.elementId) return;
      const list = map.get(c.elementId) || [];
      list.push(c);
      map.set(c.elementId, list);
    });
    return map;
  }, [cubeTests]);

  const enrichedLevels: EnrichedLevelProgress[] = useMemo(
    () => calculateLevelProgressList(levels, elements),
    [levels, elements],
  );

  const elementTypes = useMemo(
    () =>
      Array.from(
        new Set(elements.map((element) => element.elementType).filter(Boolean)),
      ),
    [elements],
  );

  const kpiStats = useMemo(() => {
    let totalVol = 0;
    let pouredVol = 0;
    let totalFmwk = 0;
    let ncrCount = 0;
    let awaitingPourCount = 0;
    let curingCount = 0;
    let approvedCount = 0;

    elements.forEach((el) => {
      const vol = getOrCalculateVolume(el);
      const fmwk = getOrCalculateFormworkArea(el);
      totalVol += vol;
      totalFmwk += fmwk;

      if (el.status === "POURED" || el.status === "APPROVED") {
        pouredVol += vol;
      }

      const elNcrs = ncrMap.get(el.id) || [];
      if (
        elNcrs.some((n) => n.status !== "CLOSED" && n.status !== "CANCELLED")
      ) {
        ncrCount++;
      }

      if (
        el.status === "READY_FOR_CASTING" ||
        el.status === "REBAR_INSPECTED"
      ) {
        awaitingPourCount++;
      } else if (el.status === "POURED") {
        curingCount++;
      } else if (el.status === "APPROVED") {
        approvedCount++;
      }
    });

    const pct = totalVol > 0 ? Math.round((pouredVol / totalVol) * 100) : 0;
    return {
      totalVol,
      pouredVol,
      totalFmwk,
      pct,
      ncrCount,
      awaitingPourCount,
      curingCount,
      approvedCount,
    };
  }, [elements, ncrMap]);

  // Natural String Sorting
  const naturalCompare = (a: string, b: string): number => {
    const re = /(\d+)|(\D+)/g;
    const aParts = a.match(re) || [];
    const bParts = b.match(re) || [];

    for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
      const aPart = aParts[i];
      const bPart = bParts[i];
      const aNum = parseInt(aPart, 10);
      const bNum = parseInt(bPart, 10);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        if (aNum !== bNum) return aNum - bNum;
      } else {
        const cmp = aPart.localeCompare(bPart);
        if (cmp !== 0) return cmp;
      }
    }
    return aParts.length - bParts.length;
  };

  // Filtered elements
  const filteredElements = useMemo(() => {
    const q = search.toLowerCase().trim();
    return elements
      .filter((el) => {
        const levelName =
          levelNameMap.get(el.levelId || "") || el.level || el.levelName || "";
        const gridName = el.grid || el.gridAxis || "";
        const elType = el.elementType || (el as any).type || (el as any).element || "";

        if (
          q &&
          !el.elementName?.toLowerCase().includes(q) &&
          !levelName.toLowerCase().includes(q) &&
          !gridName.toLowerCase().includes(q) &&
          !elType.toLowerCase().includes(q)
        ) {
          return false;
        }

        if (
          filterLevel !== "ALL" &&
          el.levelId !== filterLevel &&
          el.level !== filterLevel &&
          el.levelName !== filterLevel &&
          levelName !== filterLevel
        ) {
          return false;
        }

        if (filterStatus !== "ALL" && el.status !== filterStatus) return false;

        if (filterType !== "ALL") {
          const normFilter = filterType.toLowerCase().replace(/_/g, " ").replace(/s$/, "").trim();
          const normEl = elType.toLowerCase().replace(/_/g, " ").replace(/s$/, "").trim();
          if (
            normEl !== normFilter &&
            !normEl.includes(normFilter) &&
            !normFilter.includes(normEl)
          ) {
            return false;
          }
        }

        if (filterPackage !== "ALL" && el.workPackageId !== filterPackage) {
          return false;
        }

        // Quick filter chips
        if (quickFilter === "NCRS") {
          const elNcrs = ncrMap.get(el.id) || [];
          const hasOpen = elNcrs.some(
            (n) => n.status !== "CLOSED" && n.status !== "CANCELLED",
          );
          if (!hasOpen) return false;
        } else if (quickFilter === "AWAITING_POUR") {
          if (
            el.status !== "READY_FOR_CASTING" &&
            el.status !== "REBAR_INSPECTED"
          ) {
            return false;
          }
        } else if (quickFilter === "CURING") {
          if (el.status !== "POURED") return false;
        } else if (quickFilter === "APPROVED") {
          if (el.status !== "APPROVED") return false;
        }

        return true;
      })
      .sort((a, b) => {
        const typeCompare = (a.elementType || "").localeCompare(
          b.elementType || "",
        );
        if (typeCompare !== 0) return typeCompare;

        const nameCompare = naturalCompare(
          a.elementName || "",
          b.elementName || "",
        );
        if (nameCompare !== 0) return nameCompare;

        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
  }, [
    elements,
    search,
    filterLevel,
    filterStatus,
    filterType,
    filterPackage,
    quickFilter,
    ncrMap,
    levelNameMap,
  ]);

  // Paginated Elements
  const paginatedElements = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredElements.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredElements, currentPage]);

  const totalPages = Math.ceil(filteredElements.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterLevel, filterStatus, filterType, filterPackage, quickFilter]);

  // Selection Helpers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAllPage = useCallback(() => {
    setSelectedIds((prev) => {
      const pageIds = paginatedElements.map((e) => e.id);
      const allPageSelected =
        pageIds.length > 0 && pageIds.every((id) => prev.has(id));

      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [paginatedElements]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const isAllPageSelected =
    paginatedElements.length > 0 &&
    paginatedElements.every((e) => selectedIds.has(e.id));

  // Element CRUD Handlers
  const handleSaveElement = async (
    payload: Partial<StructuralElement>,
    editingId: string | null,
  ) => {
    if (!isQAQC) {
      toast.error("Unauthorized: Only QA/QC personnel are permitted to register or edit elements.");
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

      setShowElementModal(false);
      setEditingElement(null);
      loadData();
    } catch (err) {
      toast.error("Failed to save element.");
    }
  };

  const handleDeleteElement = async (elementId: string, name: string) => {
    if (!isQAQC) {
      toast.error("Unauthorized: Only QA/QC personnel can delete elements.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await dbService.deleteElement(elementId, currentProjId);
      toast.success(`Deleted ${name}`);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(elementId);
        return next;
      });
      loadData();
    } catch {
      toast.error("Failed to delete element.");
    }
  };

  const handleStatusChange = async (
    elementId: string,
    newStatus: ElementStatus,
  ) => {
    if (!isQAQC) {
      toast.error("Unauthorized: Only QA/QC personnel can modify element status.");
      return;
    }

    const target = elements.find((e) => e.id === elementId);
    if (!target) return;

    // QA/QC Statutory Defect Hold Check
    if (newStatus === "POURED" || newStatus === "APPROVED") {
      const activeNCRs = (ncrMap.get(elementId) || []).filter(
        (n) => n.status !== "CLOSED" && n.status !== "CANCELLED",
      );
      if (activeNCRs.length > 0) {
        const proceed = window.confirm(
          `⚠️ QA/QC STATUTORY HOLD: Element "${target.elementName}" has ${activeNCRs.length} unresolved Non-Conformance Report(s) (e.g. ${activeNCRs[0].ncrNumber || "NCR"}).\n\nTransitioning to "${newStatus}" without defect sign-off violates quality assurance gating. Are you sure you wish to override and proceed?`,
        );
        if (!proceed) return;
      }
    }

    const totalVol = getOrCalculateVolume(target);
    const isCompleted = newStatus === "POURED" || newStatus === "APPROVED";

    const updated: StructuralElement = {
      ...target,
      status: newStatus,
      achievedVolume: isCompleted ? totalVol : 0,
      updatedAt: new Date().toISOString(),
    };

    try {
      await dbService.saveElement(updated);
      toast.success(`Status updated to ${newStatus}`);
      loadData();
    } catch {
      toast.error("Failed to update status.");
    }
  };

  // Bulk Operations
  const handleBulkStatus = async () => {
    if (!isQAQC) {
      toast.error("Unauthorized: Bulk operations are restricted to QA/QC authority.");
      return;
    }
    if (!bulkStatus || selectedIds.size === 0) return;
    const isCompleted = bulkStatus === "POURED" || bulkStatus === "APPROVED";

    if (isCompleted) {
      const flagged = Array.from(selectedIds).filter((id) => {
        const elNcrs = ncrMap.get(id) || [];
        return elNcrs.some(
          (n) => n.status !== "CLOSED" && n.status !== "CANCELLED",
        );
      });
      if (flagged.length > 0) {
        const proceed = window.confirm(
          `⚠️ QA/QC STATUTORY HOLD: ${flagged.length} of the ${selectedIds.size} selected elements currently have active unresolved Non-Conformance Reports.\n\nPromoting to "${bulkStatus}" without closing NCRs violates quality gating protocol. Do you wish to override and proceed?`,
        );
        if (!proceed) return;
      }
    }

    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => {
          const target = elements.find((e) => e.id === id);
          const totalVol = target ? getOrCalculateVolume(target) : 0;
          return dbService.saveElement({
            ...target,
            id,
            status: bulkStatus as ElementStatus,
            achievedVolume: isCompleted ? totalVol : 0,
            updatedAt: new Date().toISOString(),
          } as StructuralElement);
        }),
      );

      toast.success(`${selectedIds.size} elements updated to ${bulkStatus}`);
      clearSelection();
      setBulkStatus("");
      loadData();
    } catch {
      toast.error("Bulk status update failed.");
    }
  };

  const handleBulkLevel = async () => {
    if (!isQAQC) {
      toast.error("Unauthorized: Bulk operations are restricted to QA/QC authority.");
      return;
    }
    if (!bulkLevelId || selectedIds.size === 0) return;
    const lvl = levels.find((l) => l.id === bulkLevelId);

    try {
      await dbService.bulkUpdateElements(
        Array.from(selectedIds),
        { levelId: bulkLevelId, levelName: lvl?.name || "Level" },
        currentProjId,
      );
      toast.success(
        `${selectedIds.size} elements moved to ${lvl?.name || "Level"}`,
      );
      clearSelection();
      setBulkLevelId("");
      loadData();
    } catch {
      toast.error("Bulk level move failed.");
    }
  };

  const handleBulkPackage = async () => {
    if (!isQAQC) {
      toast.error("Unauthorized: Bulk operations are restricted to QA/QC authority.");
      return;
    }
    if (!bulkPkgId || selectedIds.size === 0) return;
    const pkg = packages.find((p) => p.id === bulkPkgId);

    try {
      await dbService.bulkUpdateElements(
        Array.from(selectedIds),
        { workPackageId: bulkPkgId, workPackageName: pkg?.name || "Package" },
        currentProjId,
      );
      toast.success(`${selectedIds.size} elements assigned to package`);
      clearSelection();
      setBulkPkgId("");
      loadData();
    } catch {
      toast.error("Bulk package assignment failed.");
    }
  };

  const handleBulkDelete = async () => {
    if (!isQAQC) {
      toast.error("Unauthorized: Bulk operations are restricted to QA/QC authority.");
      return;
    }
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        `Delete ${selectedIds.size} elements permanently? This cannot be undone.`,
      )
    )
      return;

    try {
      await dbService.bulkDeleteElements(
        Array.from(selectedIds),
        currentProjId,
      );
      toast.success(`${selectedIds.size} elements deleted.`);
      clearSelection();
      loadData();
    } catch {
      toast.error("Bulk delete failed.");
    }
  };

  const handleSetActiveLevel = (lvlId: string, lvlName: string) => {
    setCurrentLevel(lvlId, lvlName);
    toast.success(`Active Stage set to: ${lvlName}`);
  };

  // Pagination Bar
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl shadow-sm">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredElements.length)} of{" "}
          {filteredElements.length} elements
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition bg-slate-50 dark:bg-slate-950"
          >
            Prev
          </button>
          <span className="text-xs font-bold text-slate-900 dark:text-white px-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition bg-slate-50 dark:bg-slate-950"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  if (!isQAQC) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-red-500/30 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            QA/QC Access Restricted
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            The Structural Element Registry &amp; Spatial BIM Twin is strictly restricted to QA/QC personnel only.
          </p>
          <p className="text-xs text-slate-500">
            Your current role is{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {currentUser?.role || "Site Engineer"}
            </span>.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate("/project/dashboard")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow"
            >
              <span>Return to Executive Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 min-h-screen pb-12">
      {/* ═══ HEADER ═══ */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-1 font-black">
            <Box className="w-4 h-4" />
            <span>Structural Asset Registry &amp; 3D Twin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Element Register &amp; Spatial BIM Twin
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            3D WebGL element models, 2D grid plan coordinates, concrete volume
            takeoff, and inspection passports
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Schedule PDF / CSV Export */}
          <div className="flex items-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 shadow-sm">
            <button
              onClick={() =>
                exportElementSchedulePDF(
                  filteredElements,
                  activeProject || {},
                  company || {},
                  { levelNameMap },
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
              title="Export Vector Landscape PDF Schedule"
            >
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              <span>PDF Schedule</span>
            </button>
            <div className="w-[1px] h-4 bg-slate-200 dark:border-slate-800 bg-slate-200 dark:bg-slate-800 mx-0.5" />
            <button
              onClick={() =>
                exportElementScheduleCSV(
                  filteredElements,
                  activeProject || {},
                  levelNameMap,
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
              title="Export CSV Schedule for Quantity Surveying"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>CSV</span>
            </button>
          </div>

          {/* QR Asset Tags Sticker Sheet Print */}
          <button
            onClick={() => {
              const targetEls =
                selectedIds.size > 0
                  ? elements.filter((e) => selectedIds.has(e.id))
                  : filteredElements;
              if (targetEls.length === 0) {
                toast.error("No elements to print QR tags for.");
                return;
              }
              setQrModalElements(targetEls);
              setShowQRModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-sm transition"
            title="Print Scannable Adhesive QR Asset Tags"
          >
            <QrCode className="w-4 h-4 text-brand-400 dark:text-brand-600" />
            <span>
              Print QR Tags
              {selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </span>
          </button>

          {isQAQC && (
            <>
              <button
                onClick={() => {
                  setEditingElement(null);
                  setShowElementModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Register Element</span>
              </button>

              <button
                onClick={() => setShowBulkGen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition"
              >
                <Copy className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Bulk Generate</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ═══ QUICK NAV HORIZON BAR ═══ */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar whitespace-nowrap max-w-full">
          <Link
            to="/project/grid-plan"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition shrink-0"
          >
            <Grid className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>2D Grid Plan</span>
          </Link>

          <Link
            to="/project/mto"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Size Schedule &amp; MTO</span>
          </Link>

          <Link
            to="/project/levels"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
          >
            <Building2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Floor Levels ({levels.length})</span>
          </Link>

          <Link
            to="/project/packages"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
          >
            <Briefcase className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Packages ({packages.length})</span>
          </Link>

          <Link
            to="/project/gridlines"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
          >
            <Compass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Gridlines ({gridlines.length})</span>
          </Link>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setViewMode("GRID")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              viewMode === "GRID"
                ? "bg-brand-600 text-white shadow"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>2D Grid</span>
          </button>
          <button
            onClick={() => setViewMode("CARDS")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              viewMode === "CARDS"
                ? "bg-brand-600 text-white shadow"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>
          <button
            onClick={() => setViewMode("TABLE")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              viewMode === "TABLE"
                ? "bg-brand-600 text-white shadow"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
                    <button
            onClick={() => setViewMode("3D")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              viewMode === "3D"
                ? "bg-brand-600 text-white shadow"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D BIM</span>
          </button>
        </div>
      </div>

      {/* ═══ LEVEL PROGRESS HORIZON & TAKEOFF ANALYTICS ═══ */}
      <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-300 text-[10px] font-mono font-bold tracking-wider uppercase border border-brand-500/20 dark:border-brand-500/30">
                Site Progress Horizon
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {filterLevel !== "ALL"
                  ? `Level: ${levelNameMap.get(filterLevel) || filterLevel}`
                  : "All Project Stages"}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>{filteredElements.length} Structural Elements</span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                ({elements.length} total in registry)
              </span>
            </h2>
          </div>

          {/* Aggregated Numbers */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <div className="bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 px-3.5 py-2 rounded-2xl">
              <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                <Hammer className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                <span>Cast Concrete</span>
              </div>
              <div className="text-base font-black font-mono text-cyan-700 dark:text-cyan-300">
                {kpiStats.pouredVol.toFixed(1)}{" "}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  / {kpiStats.totalVol.toFixed(1)} m³
                </span>
              </div>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 px-3.5 py-2 rounded-2xl">
              <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Formwork Contact</span>
              </div>
              <div className="text-base font-black font-mono text-emerald-700 dark:text-emerald-300">
                {kpiStats.totalFmwk.toFixed(1)}{" "}
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">m²</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-600 dark:text-slate-400">
              Structural Volumetric Casting Completion
            </span>
            <span className="font-bold text-brand-600 dark:text-brand-400">{kpiStats.pct}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-brand-500 via-cyan-500 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.min(100, Math.max(0, kpiStats.pct))}%` }}
            />
          </div>
        </div>

        {/* One-Click Quick Filter Chips */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar whitespace-nowrap">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono mr-1 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>

          <button
            onClick={() => setQuickFilter("ALL")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 border ${
              quickFilter === "ALL"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow"
                : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
            }`}
          >
            <span>All Elements</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200">
              {elements.length}
            </span>
          </button>

          <button
            onClick={() => setQuickFilter("NCRS")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 border ${
              quickFilter === "NCRS"
                ? "bg-rose-500 text-white border-rose-600 dark:border-rose-400 shadow"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border-rose-200 dark:border-rose-900/60"
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Defect Hold (NCRs)</span>
            {kpiStats.ncrCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold">
                {kpiStats.ncrCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setQuickFilter("AWAITING_POUR")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 border ${
              quickFilter === "AWAITING_POUR"
                ? "bg-amber-500 text-white border-amber-600 dark:border-amber-400 shadow"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border-amber-200 dark:border-amber-900/60"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Awaiting Pour / PTP</span>
            {kpiStats.awaitingPourCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold">
                {kpiStats.awaitingPourCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setQuickFilter("CURING")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 border ${
              quickFilter === "CURING"
                ? "bg-cyan-500 text-white border-cyan-600 dark:border-cyan-400 shadow"
                : "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 border-cyan-200 dark:border-cyan-900/60"
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>In Curing</span>
            {kpiStats.curingCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500 text-white font-bold">
                {kpiStats.curingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setQuickFilter("APPROVED")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 border ${
              quickFilter === "APPROVED"
                ? "bg-emerald-500 text-white border-emerald-600 dark:border-emerald-400 shadow"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border-emerald-200 dark:border-emerald-900/60"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>QA Accepted</span>
            {kpiStats.approvedCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-bold">
                {kpiStats.approvedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ═══ VIEW MODE CONTENT ═══ */}

      {/* 1. 3D WebGL BIM Twin View */}
      {viewMode === "3D" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Interactive 3D WebGL Structural Twin
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {filteredElements.length} elements rendered
              </span>
            </div>

            <div className="h-[560px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800">
              <BIMViewer3D
                elements={filteredElements}
                levels={levels}
                gridlines={gridlines}
                selectedElementIds={Array.from(selectedIds)}
                onSelectElements={(els) => {
                  setSelectedIds(new Set(els.map((e) => e.id)));
                }}
                onSelectElement={(el) => {
                  if (el) setViewerEl(el);
                }}
                activeLevelId={filterLevel !== "ALL" ? filterLevel : undefined}
                onLevelChange={(lvlId) => setFilterLevel(lvlId)}
                projectId={currentProjId}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. 2D Spatial Grid Plan View */}
      {viewMode === "GRID" && (
        <div className="space-y-4">
          <GridPlanCanvas
            elements={elements}
            levels={levels}
            gridlines={gridlines}
            ncrs={ncrs}
            projectId={currentProjId}
            onSelectElement={(el) => {
              setEditingElement(el);
              setShowElementModal(true);
            }}
          />
        </div>
      )}

      {/* 3. Cards & Table Views: Filters + Bulk Actions + Content */}
      {(viewMode === "CARDS" || viewMode === "TABLE") && (
        <div className="space-y-4">
          {/* Filters */}
          <ElementFilters
            searchQuery={search}
            onSearchChange={setSearch}
            selectedType={filterType}
            onTypeChange={setFilterType}
            selectedLevel={filterLevel}
            onLevelChange={setFilterLevel}
            selectedStatus={filterStatus}
            onStatusChange={setFilterStatus}
            selectedPackage={filterPackage}
            onPackageChange={setFilterPackage}
            levels={levels.map((l) => ({ id: l.id, name: l.name }))}
            packages={packages.map((p) => ({ id: p.id, name: p.name }))}
            elementTypes={elementTypes}
            selectAllChecked={isAllPageSelected}
            onToggleSelectAll={toggleSelectAllPage}
          />

          {/* Floating Bulk Toolbar */}
          {selectedIds.size > 0 && (
            <BulkToolbar
              selectedCount={selectedIds.size}
              onClear={clearSelection}
              bulkStatus={bulkStatus}
              onStatusChange={setBulkStatus}
              onApplyStatus={handleBulkStatus}
              bulkPackageId={bulkPkgId}
              onPackageChange={setBulkPkgId}
              onAssignPackage={handleBulkPackage}
              bulkLevelId={bulkLevelId}
              onLevelChange={setBulkLevelId}
              onAssignLevel={handleBulkLevel}
              levels={levels.map((l) => ({ id: l.id, name: l.name }))}
              packages={packages.map((p) => ({ id: p.id, name: p.name }))}
              onDelete={handleBulkDelete}
            />
          )}

          {/* Content */}
          {loading ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-20 text-center">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Loading structural asset registry...
              </p>
            </div>
          ) : filteredElements.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-20 text-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-800">
                <Box className="w-7 h-7 text-slate-400 dark:text-slate-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                No Elements Registered
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Register your first structural member or use bulk generation.
              </p>
            </div>
          ) : viewMode === "TABLE" ? (
            <div className="space-y-4">
              {renderPagination()}

              {/* Structured Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-mono text-[11px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4 font-bold text-center w-10">
                          <input
                            type="checkbox"
                            checked={isAllPageSelected}
                            onChange={toggleSelectAllPage}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-brand-600 cursor-pointer"
                          />
                        </th>
                        <th className="py-3.5 px-4 font-bold">Element Name</th>
                        <th className="py-3.5 px-4 font-bold">Type</th>
                        <th className="py-3.5 px-4 font-bold">Level</th>
                        <th className="py-3.5 px-4 font-bold">Grid Axis</th>
                        <th className="py-3.5 px-4 font-bold text-right">
                          Volume (m³)
                        </th>
                        <th className="py-3.5 px-4 font-bold text-right">
                          Formwork (m²)
                        </th>
                        <th className="py-3.5 px-4 font-bold">
                          Concrete Grade
                        </th>
                        <th className="py-3.5 px-4 font-bold">Status</th>
                        <th className="py-3.5 px-4 font-bold text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {paginatedElements.map((el) => (
                        <tr
                          key={el.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                            selectedIds.has(el.id)
                              ? "bg-brand-50/70 dark:bg-brand-950/20"
                              : ""
                          }`}
                        >
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(el.id)}
                              onChange={() => toggleSelect(el.id)}
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-brand-600 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{el.elementName}</span>
                            <button
                              onClick={() => setViewerEl(el)}
                              className="p-1 hover:text-brand-600 dark:hover:text-brand-400 text-slate-400 dark:text-slate-500 rounded transition"
                              title="3D View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {el.elementType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                            {levelNameMap.get(el.levelId || "") ||
                              el.levelName ||
                              "Level"}
                          </td>
                          <td className="py-3 px-4 font-mono text-brand-600 dark:text-brand-400 font-bold">
                            {el.grid || el.gridAxis || "N/A"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {(() => {
                              const calcVol = getOrCalculateVolume(el);
                              const achVol =
                                el.achievedVolume ??
                                (el.status === "POURED" || el.status === "APPROVED"
                                  ? calcVol
                                  : 0);
                              const pct =
                                calcVol > 0
                                  ? Math.min(100, Math.round((achVol / calcVol) * 100))
                                  : 0;
                              return (
                                <div>
                                  <span className="font-mono font-bold text-brand-600 dark:text-brand-400 block text-xs">
                                    {calcVol.toFixed(3)} m³
                                  </span>
                                  <div className="flex items-center justify-end gap-1 mt-0.5 text-[10px] font-mono">
                                    <span className="text-slate-400">
                                      Ach: {achVol.toFixed(2)}
                                    </span>
                                    <span
                                      className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                                        pct >= 100
                                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                          : pct > 0
                                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                      }`}
                                    >
                                      {pct}%
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            {getOrCalculateFormworkArea(el).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                            {el.concreteGrade || "C35/45"}
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={el.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  el.id,
                                  e.target.value as ElementStatus,
                                )
                              }
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border focus:outline-none cursor-pointer bg-white dark:bg-slate-950 ${
                                el.status === "APPROVED"
                                  ? "text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                                  : el.status === "POURED"
                                    ? "text-cyan-600 dark:text-cyan-400 border-cyan-300 dark:border-cyan-800"
                                    : el.status === "REJECTED"
                                      ? "text-red-600 dark:text-red-400 border-red-300 dark:border-red-800"
                                      : "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800"
                              }`}
                            >
                              <option value="PENDING">Pending</option>
                              <option value="REBAR_IN_PROGRESS">
                                Rebar Progress
                              </option>
                              <option value="FORMWORK_IN_PROGRESS">
                                Formwork Progress
                              </option>
                              <option value="READY_FOR_CASTING">
                                Ready for Casting
                              </option>
                              <option value="REBAR_INSPECTED">
                                Rebar Inspected
                              </option>
                              <option value="POURED">Poured</option>
                              <option value="APPROVED">Approved</option>
                              <option value="REJECTED">Rejected</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setQrModalElements([el]);
                                  setShowQRModal(true);
                                }}
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition"
                                title="Print QR Asset Tag"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingElement(el);
                                  setShowElementModal(true);
                                }}
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                                title="Edit Element"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <Link
                                to={`/project/elements/${el.id}`}
                                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition"
                                title="Open Passport"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                onClick={() =>
                                  handleDeleteElement(el.id, el.elementName)
                                }
                                className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
                                title="Delete Element"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {renderPagination()}
            </div>
          ) : (
            <div className="space-y-4">
              {renderPagination()}

              {/* 2-Column Responsive Card Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {paginatedElements.map((el) => (
                  <ElementCard
                    key={el.id}
                    element={el}
                    projectId={currentProjId}
                    levelName={
                      levelNameMap.get(el.levelId || "") ||
                      el.levelName ||
                      "Level"
                    }
                    packageName={
                      pkgNameMap.get(el.workPackageId || "") ||
                      el.workPackageName ||
                      ""
                    }
                    inspections={inspMap.get(el.id) || []}
                    ncrs={ncrMap.get(el.id) || []}
                    cubeTests={cubeMap.get(el.id) || []}
                    siteComments={siteComments}
                    isSelected={selectedIds.has(el.id)}
                    onToggleSelect={() => toggleSelect(el.id)}
                    onEdit={() => {
                      setEditingElement(el);
                      setShowElementModal(true);
                    }}
                    onDelete={() => handleDeleteElement(el.id, el.elementName)}
                    onView3D={() => setViewerEl(el)}
                    onPrintQR={() => {
                      setQrModalElements([el]);
                      setShowQRModal(true);
                    }}
                    onStatusChange={(s) =>
                      handleStatusChange(el.id, s as ElementStatus)
                    }
                  />
                ))}
              </div>

              {renderPagination()}
            </div>
          )}
        </div>
      )}

      {/* ═══ MODALS ═══ */}
      {showElementModal && (
        <ElementModal
          isOpen={showElementModal}
          editingElement={editingElement}
          levels={levels}
          gridlines={gridlines}
          packages={packages}
          onClose={() => {
            setShowElementModal(false);
            setEditingElement(null);
          }}
          onSubmit={handleSaveElement}
        />
      )}

      {showBulkGen && (
        <BulkElementGenerator
          isOpen={showBulkGen}
          levels={levels.map((l) => ({ id: l.id, name: l.name }))}
          onClose={() => setShowBulkGen(false)}
          onSuccess={loadData}
        />
      )}

      {viewerEl && (
        <ElementViewer
          element={viewerEl}
          isOpen={!!viewerEl}
          levelName={
            levelNameMap.get(viewerEl.levelId || "") || viewerEl.levelName
          }
          onClose={() => setViewerEl(null)}
        />
      )}

      {showQRModal && (
        <ElementQRTagsModal
          isOpen={showQRModal}
          elements={qrModalElements}
          levelNameMap={levelNameMap}
          projectName={activeProject?.name}
          projectCode={activeProject?.code}
          onClose={() => {
            setShowQRModal(false);
            setQrModalElements([]);
          }}
        />
      )}
    </div>
  );
};

export default ElementRegistry;
