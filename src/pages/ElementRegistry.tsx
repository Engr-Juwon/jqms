import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  calculateElementElevations,
} from "@/lib/elementCalculations";
import { ElementCard } from "@/components/registry/ElementCard";
import { ElementFilters } from "@/components/registry/ElementFilters";
import { BulkToolbar } from "@/components/registry/BulkToolbar";
import { ElementModal } from "@/components/registry/ElementModal";
import { BulkElementGenerator } from "@/components/registry/BulkElementGenerator";
import { ElementViewer } from "@/components/registry/ElementViewer";
import { ElementQRTagsModal } from "@/components/registry/ElementQRTagsModal";
import { ElementHealthModal } from "@/components/registry/ElementHealthModal";
import { BulkElementEditModal } from "@/components/registry/BulkElementEditModal";
import { ElementSpreadsheetView } from "@/components/registry/ElementSpreadsheetView";
import { auditStructuralElements } from "@/lib/elementDiagnostics";
import { BIMDimensionNav } from "@/components/bim/BIMDimensionNav";
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
  ChevronDown,
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
  Activity,
  SlidersHorizontal,
  Ruler,
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

  // View Mode: Cards or Table
  const [viewMode, setViewMode] = useState<"CARDS" | "TABLE" | "SPREADSHEET">("TABLE");

  // Modals
  const [showElementModal, setShowElementModal] = useState(false);
  const [editingElement, setEditingElement] =
    useState<StructuralElement | null>(null);
  const [showBulkGen, setShowBulkGen] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [viewerEl, setViewerEl] = useState<StructuralElement | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrModalElements, setQrModalElements] = useState<StructuralElement[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState(
    activeProject?.currentLevelId || "ALL",
  );
  const prevLevelIdRef = useRef<string | undefined>(activeProject?.currentLevelId);
  useEffect(() => {
    if (activeProject?.currentLevelId !== prevLevelIdRef.current) {
      prevLevelIdRef.current = activeProject?.currentLevelId;
      setFilterLevel(activeProject?.currentLevelId || "ALL");
    }
  }, [activeProject?.currentLevelId]);
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

  // Table Sorting (Default: arranged by name ascending, e.g. P01 before P02)
  const [sortField, setSortField] = useState<"name" | "type" | "level" | "elevation" | "grid" | "volume" | "status" | "inclination">("name");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleSort = (field: "name" | "type" | "level" | "elevation" | "grid" | "volume" | "status" | "inclination") => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Pagination (Dynamic page sizes: 20, 50, 100, 250, All)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  const isQAQC = isQAQCUser(currentUser) || hasMinRole(currentUser?.role, 2) || !currentUser;
  const isLvl2 = hasMinRole(currentUser?.role, 2);
  const isLvl3 = hasMinRole(currentUser?.role, 3);

  // Load all structural data (optional silent reload without triggering loading spinner)
  const loadData = useCallback(async (isSilent = false) => {
    if (!currentProjId) return;
    if (!isSilent) setLoading(true);
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
      if (!isSilent) setLoading(false);
    }
  }, [currentProjId, currentCompId]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Refs to track user actions vs remote real-time updates
  const isInitialSnapshotRef = React.useRef(true);
  const elementsRef = React.useRef<StructuralElement[]>([]);
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // Real-time Element listener: seamlessly appends/replaces elements without triggering loading state
  // and alerts the user with a notification when a change is detected from someone else or background sync
  useEffect(() => {
    if (!currentProjId) return;
    isInitialSnapshotRef.current = true;

    const unsub = dbService.subscribeElements(
      currentProjId,
      (incomingElements) => {
        if (!incomingElements) return;

        // On first subscription mount, seed state without firing "changed by someone else" toasts
        if (isInitialSnapshotRef.current) {
          isInitialSnapshotRef.current = false;
          setElements(incomingElements);
          return;
        }

        const prevList = elementsRef.current;
        const prevMap = new Map(prevList.map((e) => [e.id, e]));
        const incomingMap = new Map(incomingElements.map((e) => [e.id, e]));

        const currentUserId = currentUser?.uid;

        // Check for newly added or updated elements
        incomingElements.forEach((incoming) => {
          const prev = prevMap.get(incoming.id);
          if (!prev) {
            // New element added
            if (incoming.createdBy && incoming.createdBy !== currentUserId) {
              const author = incoming.createdByName || "a team member";
              toast(
                `🆕 New element "${incoming.elementName}" registered by ${author}`,
                { icon: "✨", duration: 4000 },
              );
            }
          } else {
            // Element updated: check if updatedAt or critical fields changed
            const timeDiff = incoming.updatedAt !== prev.updatedAt;
            const statusDiff = incoming.status !== prev.status;
            const nameDiff = incoming.elementName !== prev.elementName;
            const levelDiff = incoming.levelId !== prev.levelId;

            if (timeDiff || statusDiff || nameDiff || levelDiff) {
              if (incoming.updatedBy && incoming.updatedBy !== currentUserId) {
                const editor = incoming.updatedByName || "another user";
                if (statusDiff) {
                  toast(
                    `⚡ "${incoming.elementName}" status changed to ${incoming.status} by ${editor}`,
                    { icon: "🔔", duration: 4500 },
                  );
                } else {
                  toast(
                    `📝 "${incoming.elementName}" updated by ${editor}`,
                    { icon: "🔄", duration: 4000 },
                  );
                }
              }
            }
          }
        });

        // Check for deleted elements
        prevList.forEach((prevEl) => {
          if (!incomingMap.has(prevEl.id)) {
            toast(
              `🗑️ Element "${prevEl.elementName}" was removed`,
              { icon: "ℹ️", duration: 4000 },
            );
          }
        });

        // Update state in-place without loading screen
        setElements(incomingElements);
      },
      currentCompId,
    );

    return () => unsub();
  }, [currentProjId, currentCompId, currentUser?.uid]);

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

  // Level to Package mapping (levels determine work packages automatically)
  const levelPkgMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    levels.forEach((lvl) => {
      if (lvl.workPackageId) {
        const pkg = packages.find((p) => p.id === lvl.workPackageId);
        map.set(lvl.id, {
          id: lvl.workPackageId,
          name: pkg?.name || lvl.workPackageName || "Work Package",
        });
      }
    });
    return map;
  }, [levels, packages]);

  // Enriched elements: elements inherit work package directly from their level
  const enrichedElements = useMemo(() => {
    return elements.map((el) => {
      const lvlPkg = el.levelId ? levelPkgMap.get(el.levelId) : undefined;
      return {
        ...el,
        workPackageId: lvlPkg?.id || el.workPackageId,
        workPackageName: lvlPkg?.name || el.workPackageName,
      };
    });
  }, [elements, levelPkgMap]);

  const selectedLevelObj = useMemo(() => {
    return levels.find((l) => l.id === filterLevel);
  }, [levels, filterLevel]);

  // Automated Structural Health Diagnostic Audit
  const elementAudit = useMemo(() => {
    return auditStructuralElements(enrichedElements, levels, packages, ncrs);
  }, [enrichedElements, levels, packages, ncrs]);
  const auditIssuesCount = elementAudit.issues.length;

  // Natural Alphanumeric String Sorting (e.g. P01 before P02, P2 before P10)
  const naturalCompare = (a: string, b: string): number => {
    return (a || "").trim().localeCompare((b || "").trim(), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  };

  // Filtered elements
  const filteredElements = useMemo(() => {
    const q = search.toLowerCase().trim();
    return enrichedElements
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
          if (filterType === "INCLINED_COLUMN") {
            if (!el.isInclined && el.verticality !== "inclined") {
              return false;
            }
          } else {
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
        let cmp = 0;
        if (sortField === "name") {
          const nameA = a.elementName || a.name || "";
          const nameB = b.elementName || b.name || "";
          cmp = naturalCompare(nameA, nameB);
        } else if (sortField === "type") {
          cmp = (a.elementType || "").localeCompare(b.elementType || "");
        } else if (sortField === "level") {
          const lA = levelNameMap.get(a.levelId || "") || a.levelName || "";
          const lB = levelNameMap.get(b.levelId || "") || b.levelName || "";
          cmp = naturalCompare(lA, lB);
        } else if (sortField === "elevation") {
          const eA = a.elevation !== undefined ? a.elevation : -9999;
          const eB = b.elevation !== undefined ? b.elevation : -9999;
          cmp = eA - eB;
        } else if (sortField === "grid") {
          const gA = a.grid || a.gridAxis || "";
          const gB = b.grid || b.gridAxis || "";
          cmp = naturalCompare(gA, gB);
        } else if (sortField === "volume") {
          const vA = getOrCalculateVolume(a);
          const vB = getOrCalculateVolume(b);
          cmp = vA - vB;
        } else if (sortField === "status") {
          cmp = (a.status || "").localeCompare(b.status || "");
        } else if (sortField === "inclination") {
          const isIncA = a.isInclined || a.verticality === "inclined" ? 1 : 0;
          const isIncB = b.isInclined || b.verticality === "inclined" ? 1 : 0;
          if (isIncA !== isIncB) {
            cmp = isIncA - isIncB;
          } else {
            const angA = Number(a.inclinationAngle) || Number(a.horizontalOffset) || 0;
            const angB = Number(b.inclinationAngle) || Number(b.horizontalOffset) || 0;
            cmp = angA - angB;
          }
        }

        if (cmp !== 0) {
          return sortAsc ? cmp : -cmp;
        }

        // Secondary tie-breaker: natural alphanumeric name order (P01 before P02)
        const nameA = a.elementName || a.name || "";
        const nameB = b.elementName || b.name || "";
        const secondary = naturalCompare(nameA, nameB);
        if (secondary !== 0) return secondary;

        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
  }, [
    enrichedElements,
    search,
    filterLevel,
    filterStatus,
    filterType,
    filterPackage,
    quickFilter,
    sortField,
    sortAsc,
    ncrMap,
    levelNameMap,
  ]);

  // Paginated Elements
  const paginatedElements = useMemo(() => {
    if (itemsPerPage >= 999999) return filteredElements;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredElements.slice(start, start + itemsPerPage);
  }, [filteredElements, currentPage, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredElements.length / itemsPerPage));

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

  const selectAllFiltered = useCallback(() => {
    setSelectedIds(new Set(filteredElements.map((e) => e.id)));
  }, [filteredElements]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const isAllPageSelected =
    paginatedElements.length > 0 &&
    paginatedElements.every((e) => selectedIds.has(e.id));

  const isAllFilteredSelected =
    filteredElements.length > 0 &&
    filteredElements.every((e) => selectedIds.has(e.id));

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
      const lvlPkg = payload.levelId ? levelPkgMap.get(payload.levelId) : undefined;
    const finalWorkPkgId = lvlPkg?.id || payload.workPackageId;
    const finalWorkPkgName = lvlPkg?.name || payload.workPackageName;

    const payloadWithTakeoffs: Partial<StructuralElement> = {
      workPackageId: finalWorkPkgId,
      workPackageName: finalWorkPkgName,
        ...payload,
        calculatedFormworkArea: payload.calculatedFormworkArea || fmwk,
        calculatedVolume: payload.calculatedVolume || vol,
        area: payload.area || area,
      };

      const currentUserName = currentUser?.fullName || currentUser?.displayName || currentUser?.email || "QA/QC User";

      if (editingId) {
        const existing = elements.find((e) => e.id === editingId);
        const updated: StructuralElement = {
          ...existing,
          ...payloadWithTakeoffs,
          id: editingId,
          projectId: currentProjId,
          companyId: currentCompId,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.uid,
          updatedByName: currentUserName,
        } as StructuralElement;

        // In-place optimistic update: immediate UI reflect without loading state
        setElements((prev) =>
          prev.map((e) => (e.id === editingId ? updated : e)),
        );

        await dbService.saveElement(updated);
        toast.success(`Element "${updated.elementName}" saved.`);
      } else {
        const created: StructuralElement = {
          ...payloadWithTakeoffs,
          id: `elem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          projectId: currentProjId,
          companyId: currentCompId,
          status: payload.status || "PENDING",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: currentUser?.uid,
          createdByName: currentUserName,
          updatedBy: currentUser?.uid,
          updatedByName: currentUserName,
        } as StructuralElement;

        // In-place append: immediate UI reflect without loading state
        setElements((prev) => [created, ...prev]);

        await dbService.saveElement(created);
        toast.success(`Element "${created.elementName}" registered.`);
      }

      setShowElementModal(false);
      setEditingElement(null);
      loadData(true);
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
      // In-place optimistic removal
      setElements((prev) => prev.filter((e) => e.id !== elementId));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(elementId);
        return next;
      });

      await dbService.deleteElement(elementId, currentProjId);
      toast.success(`Deleted ${name}`);
      loadData(true);
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
    const currentUserName = currentUser?.fullName || currentUser?.displayName || currentUser?.email || "QA/QC User";

    const updated: StructuralElement = {
      ...target,
      status: newStatus,
      achievedVolume: isCompleted ? totalVol : 0,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.uid,
      updatedByName: currentUserName,
    };

    // In-place optimistic status update
    setElements((prev) =>
      prev.map((e) => (e.id === elementId ? updated : e)),
    );

    try {
      await dbService.saveElement(updated);
      toast.success(`Status updated to ${newStatus}`);
      loadData(true);
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
      // In-place optimistic status update
      setElements((prev) =>
        prev.map((e) => {
          if (!selectedIds.has(e.id)) return e;
          const totalVol = getOrCalculateVolume(e);
          return {
            ...e,
            status: bulkStatus as ElementStatus,
            achievedVolume: isCompleted ? totalVol : 0,
            updatedAt: new Date().toISOString(),
          };
        }),
      );

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
      loadData(true);
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
      // In-place optimistic level update
      setElements((prev) =>
        prev.map((e) =>
          selectedIds.has(e.id)
            ? { ...e, levelId: bulkLevelId, levelName: lvl?.name || "Level" }
            : e,
        ),
      );

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
      loadData(true);
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
      // In-place optimistic package update
      setElements((prev) =>
        prev.map((e) =>
          selectedIds.has(e.id)
            ? {
                ...e,
                workPackageId: bulkPkgId,
                workPackageName: pkg?.name || "Package",
              }
            : e,
        ),
      );

      await dbService.bulkUpdateElements(
        Array.from(selectedIds),
        { workPackageId: bulkPkgId, workPackageName: pkg?.name || "Package" },
        currentProjId,
      );
      toast.success(`${selectedIds.size} elements assigned to package`);
      clearSelection();
      setBulkPkgId("");
      loadData(true);
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
      // In-place optimistic deletion
      setElements((prev) => prev.filter((e) => !selectedIds.has(e.id)));

      await dbService.bulkDeleteElements(
        Array.from(selectedIds),
        currentProjId,
      );
      toast.success(`${selectedIds.size} elements deleted.`);
      clearSelection();
      loadData(true);
    } catch {
      toast.error("Bulk delete failed.");
    }
  };

  const handleSetActiveLevel = (lvlId: string, lvlName: string) => {
    setCurrentLevel(lvlId, lvlName);
    toast.success(`Active Stage set to: ${lvlName}`);
  };

  // Reset and synchronize elevations for all elements on a specific level
  const handleResetLevelElevations = async (targetLevelId: string) => {
    if (!isQAQC) {
      toast.error("Unauthorized: Only QA/QC personnel can calibrate element elevations.");
      return;
    }
    const lvl = levels.find((l) => l.id === targetLevelId);
    if (!lvl) {
      toast.error("Please select a valid floor level.");
      return;
    }

    const targetElements = elements.filter((e) => e.levelId === targetLevelId);
    if (targetElements.length === 0) {
      toast.error(`No elements registered on level "${lvl.name}".`);
      return;
    }

    const datumFormatted = lvl.elevation >= 0 ? `+${lvl.elevation}` : `${lvl.elevation}`;
    const confirmed = window.confirm(
      `Calibrate elevations for all ${targetElements.length} elements on "${lvl.name}" to level datum (${datumFormatted}m)?\n\n` +
      `✓ All elements will have their base elevations reset to ${datumFormatted}m.\n` +
      `✓ Any individual element offsets (elevationOffset) will be automatically preserved.\n` +
      `✓ Element top/bottom levels and 3D heights will be updated perfectly.`
    );
    if (!confirmed) return;

    try {
      const updatedElements = targetElements.map((el) => {
        const elevs = calculateElementElevations(el, lvl.elevation);
        return {
          ...el,
          elevation: elevs.elevation,
          topElevation: elevs.topElevation,
          bottomElevation: elevs.bottomElevation,
          gridZ: elevs.gridZ,
          elevationOffset: elevs.elevationOffset,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.uid,
          updatedByName: currentUser?.fullName || "QA/QC User",
        };
      });

      const updateMap = new Map(updatedElements.map((u) => [u.id, u]));

      // Optimistic in-place update
      setElements((prev) => prev.map((e) => updateMap.get(e.id) || e));

      await Promise.all(updatedElements.map((el) => dbService.saveElement(el)));
      toast.success(
        `✨ Successfully reset ${updatedElements.length} element elevations to datum ${datumFormatted}m!`,
        { icon: "📐", duration: 4000 }
      );
      loadData(true);
    } catch (err) {
      console.error("Failed to reset elevations:", err);
      toast.error("Failed to reset element elevations.");
    }
  };

  // Reset and synchronize elevations for all elements across all levels
  const handleResetAllLevelsElevations = async () => {
    if (!isQAQC) {
      toast.error("Unauthorized: Only QA/QC personnel can calibrate element elevations.");
      return;
    }
    if (levels.length === 0 || elements.length === 0) {
      toast.error("No levels or elements available.");
      return;
    }

    const confirmed = window.confirm(
      `Reset and synchronize elevations for all ${elements.length} elements across all ${levels.length} floor levels?\n\n` +
      `Each element will be calibrated to its parent level datum while strictly preserving individual elevation offsets.`
    );
    if (!confirmed) return;

    try {
      const lvlMap = new Map(levels.map((l) => [l.id, l]));
      const updatedElements = elements
        .filter((e) => e.levelId && lvlMap.has(e.levelId))
        .map((el) => {
          const lvl = lvlMap.get(el.levelId)!;
          const elevs = calculateElementElevations(el, lvl.elevation);
          return {
            ...el,
            elevation: elevs.elevation,
            topElevation: elevs.topElevation,
            bottomElevation: elevs.bottomElevation,
            gridZ: elevs.gridZ,
            elevationOffset: elevs.elevationOffset,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser?.uid,
            updatedByName: currentUser?.fullName || "QA/QC User",
          };
        });

      const updateMap = new Map(updatedElements.map((u) => [u.id, u]));
      setElements((prev) => prev.map((e) => updateMap.get(e.id) || e));

      await Promise.all(updatedElements.map((el) => dbService.saveElement(el)));
      toast.success(
        `✨ Calibrated ${updatedElements.length} elements across all levels!`,
        { icon: "📐", duration: 4000 }
      );
      loadData(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to reset all elevations.");
    }
  };

  // Enhanced Pagination Bar with Dynamic Page Sizes (20, 50, 100, 250, All)
  const renderPagination = () => {
    if (filteredElements.length === 0) return null;
    const isAll = itemsPerPage >= 999999;
    const startIdx = isAll ? 1 : (currentPage - 1) * itemsPerPage + 1;
    const endIdx = isAll ? filteredElements.length : Math.min(currentPage * itemsPerPage, filteredElements.length);

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing {startIdx} to {endIdx} of {filteredElements.length} elements
          </span>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 dark:text-slate-500 text-[11px] font-semibold">Per page:</span>
            {[20, 50, 100, 250].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setItemsPerPage(size);
                  setCurrentPage(1);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                  itemsPerPage === size
                    ? "bg-brand-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {size}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setItemsPerPage(999999);
                setCurrentPage(1);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                isAll
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All
            </button>
          </div>
        </div>

        {!isAll && totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition bg-slate-50 dark:bg-slate-950 cursor-pointer disabled:cursor-not-allowed"
              title="First Page"
            >
              &laquo;
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition bg-slate-50 dark:bg-slate-950 cursor-pointer disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <span className="text-xs font-bold text-slate-900 dark:text-white px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition bg-slate-50 dark:bg-slate-950 cursor-pointer disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition bg-slate-50 dark:bg-slate-950 cursor-pointer disabled:cursor-not-allowed"
              title="Last Page"
            >
              &raquo;
            </button>
          </div>
        )}
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
      {/* ═══ CLEAN SIMPLIFIED HEADER ═══ */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-3 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-0.5">
            <Box className="w-3.5 h-3.5" />
            <span>Structural Asset Registry</span>
            {filterLevel !== "ALL" && (
              <span className="px-1.5 py-0.2 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded text-[10px]">
                {levelNameMap.get(filterLevel) || filterLevel}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Element Registry
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Element Doctor Audit Button */}
          <button
            onClick={() => setShowHealthModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              auditIssuesCount > 0
                ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30"
                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
            }`}
            title="Structural Health Doctor & Auto-Fix Scanner"
          >
            <Activity className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Doctor</span>
            {auditIssuesCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-black">
                {auditIssuesCount}
              </span>
            )}
          </button>

          {/* Export & Tools Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition shadow-sm"
            >
              <span>Export &amp; Tools</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showExportMenu && (
              <div
                className="absolute right-0 mt-1.5 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-xs font-medium divide-y divide-slate-100 dark:divide-slate-800"
                onClick={() => setShowExportMenu(false)}
              >
                <div className="py-1">
                  <button
                    onClick={() =>
                      exportElementSchedulePDF(
                        filteredElements,
                        activeProject || {},
                        company || {},
                        { levelNameMap }
                      )
                    }
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-rose-500" />
                    <span>Export PDF Schedule</span>
                  </button>
                  <button
                    onClick={() =>
                      exportElementScheduleCSV(
                        filteredElements,
                        activeProject || {},
                        levelNameMap
                      )
                    }
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <span>Export CSV Schedule</span>
                  </button>
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
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4 text-brand-500" />
                    <span>Print QR Sticker Tags</span>
                  </button>
                </div>
                {isQAQC && (
                  <div className="py-1">
                    <button
                      onClick={() => setShowBulkGen(true)}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4 text-indigo-500" />
                      <span>Bulk Element Generator</span>
                    </button>
                    {filterLevel !== "ALL" && (
                      <button
                        onClick={() => handleResetLevelElevations(filterLevel)}
                        className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                      >
                        <Ruler className="w-4 h-4 text-sky-500" />
                        <span>Reset Elevations ({levelNameMap.get(filterLevel) || "Floor"})</span>
                      </button>
                    )}
                    <button
                      onClick={handleResetAllLevelsElevations}
                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                    >
                      <Ruler className="w-4 h-4 text-indigo-500" />
                      <span>Reset Elevations (All Floors)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Primary Register Button */}
          {isQAQC && (
            <button
              onClick={() => {
                setEditingElement(null);
                setShowElementModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Register</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══ FLOOR LEVEL HORIZONTAL TABS ═══ */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setFilterLevel("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition border ${
              filterLevel === "ALL"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-800"
            }`}
          >
            All Floors ({elements.length})
          </button>
          {levels.map((lvl) => {
            const isSelected = filterLevel === lvl.id;
            const count = elements.filter((e) => e.levelId === lvl.id).length;
            return (
              <button
                key={lvl.id}
                onClick={() => setFilterLevel(lvl.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition border flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-800"
                }`}
              >
                <span>{lvl.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Floor Info Strip: Elevation & Automatically Inherited Work Package */}
        {filterLevel !== "ALL" && (
          <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 bg-brand-50/60 dark:bg-brand-950/20 border border-brand-200/60 dark:border-brand-900/40 rounded-xl text-xs">
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 flex-wrap">
              <span className="font-bold text-slate-900 dark:text-white">{levelNameMap.get(filterLevel)}</span>
              {selectedLevelObj?.elevation !== undefined && (
                <span className="font-mono text-slate-500 text-[11px]">
                  Elevation: {selectedLevelObj.elevation >= 0 ? `+${selectedLevelObj.elevation}` : selectedLevelObj.elevation}m
                </span>
              )}
              {selectedLevelObj?.workPackageName ? (
                <span className="flex items-center gap-1 text-indigo-700 dark:text-indigo-400 font-semibold text-[11px] bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-200/50 dark:border-indigo-800/40">
                  <Briefcase className="w-3 h-3" />
                  Package: {selectedLevelObj.workPackageName}
                </span>
              ) : (
                <span className="text-slate-400 text-[11px] italic">
                  Package: Inherited from level
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedLevelObj?.elevation !== undefined && isQAQC && (
                <button
                  type="button"
                  onClick={() => handleResetLevelElevations(filterLevel)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-brand-300 dark:border-brand-800 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/40 text-[11px] font-bold shadow-xs transition"
                  title={`Reset all element elevations on ${selectedLevelObj.name} to level datum (${selectedLevelObj.elevation >= 0 ? `+${selectedLevelObj.elevation}` : selectedLevelObj.elevation}m) preserving individual offsets`}
                >
                  <Ruler className="w-3.5 h-3.5 text-brand-500" />
                  <span>Sync Elevations ({selectedLevelObj.elevation >= 0 ? `+${selectedLevelObj.elevation}` : selectedLevelObj.elevation}m)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSetActiveLevel(filterLevel, levelNameMap.get(filterLevel) || "")}
                className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                Set as Active Stage
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ COMPACT KPI METRIC BAR ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
            Total Elements
          </div>
          <div className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">
            {filteredElements.length}
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
            <span>Poured Volume</span>
            <span className="text-brand-600 font-mono font-bold">{kpiStats.pct}%</span>
          </div>
          <div className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5 truncate">
            {kpiStats.pouredVol.toFixed(1)}{" "}
            <span className="text-xs font-normal text-slate-400 font-sans">
              / {kpiStats.totalVol.toFixed(1)} m³
            </span>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
            Awaiting Casting
          </div>
          <div className="text-lg font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
            {kpiStats.awaitingPourCount}
          </div>
        </div>

        <div className={`p-3 rounded-2xl border shadow-xs ${
          kpiStats.ncrCount > 0
            ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50"
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        }`}>
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
            Defect Holds (NCR)
          </div>
          <div className={`text-lg font-black font-mono mt-0.5 ${
            kpiStats.ncrCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
          }`}>
            {kpiStats.ncrCount}
          </div>
        </div>
      </div>

      {/* ═══ REGISTRY FILTERS & ACTIONS ═══ */}
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
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalFilteredCount={filteredElements.length}
          totalSelectedCount={selectedIds.size}
          onSelectAllFiltered={selectAllFiltered}
          onClearSelection={clearSelection}
        />

        {/* Contextual Select All Across Pages Banner */}
        {isAllPageSelected && filteredElements.length > paginatedElements.length && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-brand-50/90 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/60 rounded-xl text-xs text-brand-900 dark:text-brand-200 animate-in fade-in duration-150">
            <span className="font-medium">
              {isAllFilteredSelected
                ? `✓ All ${filteredElements.length} elements in this view are selected.`
                : `All ${paginatedElements.length} elements on this page are selected.`}
            </span>
            {!isAllFilteredSelected ? (
              <button
                type="button"
                onClick={selectAllFiltered}
                className="font-bold underline text-brand-700 dark:text-brand-300 hover:text-brand-900 dark:hover:text-white cursor-pointer"
              >
                Select all {filteredElements.length} elements on{" "}
                {filterLevel !== "ALL" ? levelNameMap.get(filterLevel) || "this level" : "all levels"}
              </button>
            ) : (
              <button
                type="button"
                onClick={clearSelection}
                className="font-bold underline text-brand-700 dark:text-brand-300 hover:text-brand-900 dark:hover:text-white cursor-pointer"
              >
                Clear selection
              </button>
            )}
          </div>
        )}

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
              onOpenBulkEditModal={() => setShowBulkEditModal(true)}
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
          ) : viewMode === "SPREADSHEET" ? (
            <div className="space-y-4">
              {renderPagination()}
              <ElementSpreadsheetView
                elements={paginatedElements}
                levels={levels}
                packages={packages}
                gridlines={gridlines}
                onElementsUpdated={() => loadData(true)}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAllPage}
                isAllSelected={isAllPageSelected}
              />
              {renderPagination()}
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
                        <th
                          onClick={() => handleSort("name")}
                          className="py-3.5 px-4 font-bold cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Element Name</span>
                            <span className={`text-[10px] ${sortField === "name" ? "text-brand-600 dark:text-brand-400 font-black" : "text-slate-300 dark:text-slate-600"}`}>
                              {sortField === "name" ? (sortAsc ? "▲" : "▼") : "▲"}
                            </span>
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("type")}
                          className="py-3.5 px-4 font-bold cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition"
                        >
                          <div className="flex items-center gap-1">
                            <span>Type</span>
                            {sortField === "type" && (
                              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-black">
                                {sortAsc ? "▲" : "▼"}
                              </span>
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("level")}
                          className="py-3.5 px-4 font-bold cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition"
                        >
                          <div className="flex items-center gap-1">
                            <span>Level</span>
                            {sortField === "level" && (
                              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-black">
                                {sortAsc ? "▲" : "▼"}
                              </span>
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("elevation")}
                          className="py-3.5 px-4 font-bold cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition"
                        >
                          <div className="flex items-center gap-1">
                            <span>Elevation (m)</span>
                            {sortField === "elevation" && (
                              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-black">
                                {sortAsc ? "▲" : "▼"}
                              </span>
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("grid")}
                          className="py-3.5 px-4 font-bold cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition"
                        >
                          <div className="flex items-center gap-1">
                            <span>Grid Axis</span>
                            {sortField === "grid" && (
                              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold">
                                {sortAsc ? "▲" : "▼"}
                              </span>
                            )}
                          </div>
                        </th>
                        <th
                          onClick={() => handleSort("volume")}
                          className="py-3.5 px-4 font-bold text-right cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Volume (m³)</span>
                            {sortField === "volume" && (
                              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-black">
                                {sortAsc ? "▲" : "▼"}
                              </span>
                            )}
                          </div>
                        </th>
                        <th className="py-3.5 px-4 font-bold text-right">
                          Formwork (m²)
                        </th>
                        <th className="py-3.5 px-4 font-bold">
                          Concrete Grade
                        </th>
                        <th
                          onClick={() => handleSort("status")}
                          className="py-3.5 px-4 font-bold cursor-pointer hover:text-slate-900 dark:hover:text-white select-none transition"
                        >
                          <div className="flex items-center gap-1">
                            <span>Status</span>
                            {sortField === "status" && (
                              <span className="text-[10px] text-brand-600 dark:text-brand-400 font-black">
                                {sortAsc ? "▲" : "▼"}
                              </span>
                            )}
                          </div>
                        </th>
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
                            <div className="flex flex-col gap-1 items-start">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {el.elementType}
                              </span>
                              {(el.isInclined || el.verticality === "inclined") && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 whitespace-nowrap">
                                  Slanted ⤢ {el.inclinationAngle || 10}° ({el.inclinationDirection || "EAST"})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                            {levelNameMap.get(el.levelId || "") ||
                              el.levelName ||
                              "Level"}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {el.elevation !== undefined && el.elevation !== null
                                ? `${el.elevation >= 0 ? "+" : ""}${Number(el.elevation).toFixed(2)}m`
                                : "—"}
                            </span>
                            {el.elevationOffset ? (
                              <span className="block text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
                                offset: {el.elevationOffset > 0 ? `+${el.elevationOffset}` : el.elevationOffset}m
                              </span>
                            ) : null}
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
          onSuccess={() => loadData(true)}
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

      {showHealthModal && (
        <ElementHealthModal
          isOpen={showHealthModal}
          onClose={() => setShowHealthModal(false)}
          elements={elements}
          levels={levels}
          packages={packages}
          ncrs={ncrs}
          onElementsUpdated={() => loadData(true)}
        />
      )}

      {showBulkEditModal && (
        <BulkElementEditModal
          isOpen={showBulkEditModal}
          onClose={() => setShowBulkEditModal(false)}
          selectedElementIds={Array.from(selectedIds)}
          elements={elements}
          levels={levels}
          packages={packages}
          ncrs={ncrs}
          onElementsUpdated={() => {
            clearSelection();
            loadData(true);
          }}
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
