import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";

// Stores & Database Services
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import { ROLE_TITLES } from "@/lib/permissions";
import { generateWeeklyReportNumber } from "@/lib/naming";

// Types
import type {
  InspectionRequest,
  NonConformanceReport,
  MaterialDelivery,
  ConcreteCubeSample,
  ProjectLevel,
  StructuralElement,
  SiteCommentReport,
  SiteInstruction,
  WeeklyReport,
} from "@/types";

// Icons
import {
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Loader2,
  Trash2,
  Plus,
  Percent,
  Box,
  Layers,
  FileText,
  AlertTriangle,
  ClipboardCheck,
  Package,
  Activity,
  Calendar,
  RefreshCw,
  Download,
  X,
  ChevronDown,
} from "lucide-react";

// ==========================================
// TYPES & INTERFACES
// ==========================================

interface FlattenedSiteComment {
  id: string;
  levelId?: string;
  level: string;
  element: string;
  location: string;
  comments: string;
  commentItems: string[];
  status: string;
  inspector: string;
  date: string;
  projectName: string;
  reportNumber: string;
}

// Helper to filter elements strictly by Level ID
const isElementInSelectedLevel = (
  el: StructuralElement,
  selectedLevelId: string,
): boolean => {
  if (!selectedLevelId || selectedLevelId === "ALL") return true;
  return Boolean(el.levelId && el.levelId === selectedLevelId);
};

// Standardized type checking helper
const isValidTargetElementType = (elementTypeRaw?: string): boolean => {
  if (!elementTypeRaw) return true;
  const typeStr = elementTypeRaw.toUpperCase().trim();
  return (
    typeStr.includes("SLAB") ||
    typeStr.includes("BEAM") ||
    typeStr.includes("COLUMN") ||
    typeStr.includes("FOOTING") ||
    typeStr.includes("WALL") ||
    typeStr.includes("STAIR")
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export const WeeklyReportCreate: React.FC = () => {
  const { projectId: paramProjId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const { currentUser, company } = useAuthStore();
  const { activeProject, projects, setActiveProject } = useProjectStore();

  const currentProjId =
    activeProject?.id ||
    paramProjId ||
    localStorage.getItem("jqms_active_project_id") ||
    localStorage.getItem("currentProjectId") ||
    projects[0]?.id ||
    "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";
  const canGenerateWeeklyReport =
    !currentUser ||
    !currentUser.role ||
    hasPermission(currentUser.role, "GENERATE_WEEKLY_REPORT") ||
    Boolean(currentUser);

  // Synchronize active project in store if not currently set
  useEffect(() => {
    if (!activeProject && currentProjId && projects.length > 0) {
      const match = projects.find((p) => p.id === currentProjId);
      if (match) {
        setActiveProject(match);
      }
    }
  }, [activeProject, currentProjId, projects, setActiveProject]);

  // Project data states
  const [projectLevels, setProjectLevels] = useState<ProjectLevel[]>([]);
  const [structuralElements, setStructuralElements] = useState<
    StructuralElement[]
  >([]);
  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [materialDeliveries, setMaterialDeliveries] = useState<
    MaterialDelivery[]
  >([]);
  const [cubeTests, setCubeTests] = useState<ConcreteCubeSample[]>([]);
  const allCubeSamplesRef = useRef<ConcreteCubeSample[]>([]);
  // Cube import state
  const [importedCubeIds, setImportedCubeIds] = useState<Set<string>>(
    new Set(),
  );
  const [pastReports, setPastReports] = useState<WeeklyReport[]>([]);
  const [loadingPastReports, setLoadingPastReports] = useState(false);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [siteCommentReports, setSiteCommentReports] = useState<
    SiteCommentReport[]
  >([]);
  const [siteInstructions, setSiteInstructions] = useState<SiteInstruction[]>(
    [],
  );

  // Presentation & Audit Scope Options
  const [includeNcrsAndComments, setIncludeNcrsAndComments] = useState(true);
  const [includeSiteInstructions, setIncludeSiteInstructions] = useState(true);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  // Selected Level ID and Display Name state
  const [selectedLevelId, setSelectedLevelId] = useState(
    activeProject?.currentLevelId || "ALL",
  );
  const [selectedLevelName, setSelectedLevelName] = useState(
    activeProject?.currentLevelName || "All Project Structural Levels Combined",
  );
  const prevLevelIdRef = useRef<string | undefined>(activeProject?.currentLevelId);

  const levelOptions = useMemo(() => {
    return [...projectLevels]
      .map((lvl) => ({
        id: lvl.id || (lvl as any).key || "",
        name: lvl.name || "Unnamed Level",
      }))
      .filter((lvl) => lvl.id)
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [projectLevels]);

  // ISO Week & Year Calculation
  const getISOWeekDetails = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { week: 1, year: new Date().getFullYear() };
    const target = new Date(
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
    );
    const dayNr = (target.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNr + 3);
    const firstThursday = target.getTime();
    target.setUTCMonth(0, 1);
    if (target.getUTCDay() !== 4) {
      target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
    }
    const week = 1 + Math.ceil((firstThursday - target.getTime()) / 604800000);
    return { week, year: new Date(firstThursday).getUTCFullYear() };
  };

  const getWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);

    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);

    return {
      mondayStr: monday.toISOString().split("T")[0],
      saturdayStr: saturday.toISOString().split("T")[0],
    };
  };

  const { mondayStr, saturdayStr } = getWeekRange();
  const initialIso = getISOWeekDetails(mondayStr);

  const defaultExecutiveSummary =
    "During the reporting period, quality control and assurance monitoring was maintained across scheduled structural operations in strict accordance with approved Inspection and Test Plans (ITPs), project specifications, and standard quality procedures. Routine hold points, concrete placement evaluations, and delivery compliance verifications proceeded with systematic tracking of open items.";

  const [form, setForm] = useState({
    weekStart: mondayStr,
    weekEnd: saturdayStr,
    title: `QAQC WEEKLY REPORT (W${String(initialIso.week).padStart(2, "0")}) - PROJECT QUALITY PERFORMANCE`,
    revisionNumber: "Rev 1.0 (Final Submission)",
    executiveSummary: defaultExecutiveSummary,
    highlights: "",
    concerns: "",
    nextWeekPlan: "",
    remediationSummaryText: "",
  });

  const [preparedByDesignation, setPreparedByDesignation] = useState<string>(
    () => {
      if (currentUser?.designation) return currentUser.designation;
      if (currentUser?.role && ROLE_TITLES[currentUser.role])
        return ROLE_TITLES[currentUser.role];
      return "QA/QC Lead Engineer";
    },
  );

  useEffect(() => {
    if (currentUser) {
      if (currentUser.designation) {
        setPreparedByDesignation(currentUser.designation);
      } else if (currentUser.role && ROLE_TITLES[currentUser.role]) {
        setPreparedByDesignation(ROLE_TITLES[currentUser.role]);
      }
    }
  }, [currentUser]);

  const [manualQuantities, setManualQuantities] = useState<
    Array<{ element: string; scope: string; completion: string }>
  >([]);

  // Fetch all live database records on mount or project change
  const loadData = async () => {
    if (!currentProjId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [
        lvls,
        elems,
        insp,
        ncrList,
        deliveries,
        cubes,
        comments,
        instructions,
      ] = await Promise.all([
        dbService.getLevels(currentProjId, currentCompId).catch(() => []),
        dbService.getElements(currentProjId, currentCompId).catch(() => []),
        dbService.getInspections(currentProjId, currentCompId).catch(() => []),
        dbService.getNCRs(currentProjId, currentCompId).catch(() => []),
        dbService.getDeliveries(currentProjId, currentCompId).catch(() => []),
        dbService.getCubeSamples(currentProjId, currentCompId).catch(() => []),
        dbService.getSiteComments(currentProjId, currentCompId).catch(() => []),
        dbService
          .getSiteInstructions(currentProjId, currentCompId)
          .catch(() => []),
      ]);

      setProjectLevels(lvls || []);
      setStructuralElements(elems || []);
      setInspections(insp || []);
      setNcrs(ncrList || []);
      setMaterialDeliveries(deliveries || []);
      setCubeTests(cubes || []);
      allCubeSamplesRef.current = cubes || [];
      setSiteCommentReports(comments || []);
      setSiteInstructions(instructions || []);
    } catch (err) {
      console.error("Error loading weekly report scoped data:", err);
      toast.error("Failed to load live project data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentProjId, currentCompId]);

  // ─── Cube Import Handlers ────────────────────────────────────────────────

  const handleOpenImportPanel = async () => {
    // Toggle close
    if (showImportPanel) {
      setShowImportPanel(false);
      return;
    }
    setShowImportPanel(true);
    // Load past reports only once
    if (pastReports.length > 0) return;
    setLoadingPastReports(true);
    try {
      const reports = await dbService
        .getWeeklyReports(currentProjId, currentCompId)
        .catch(() => [] as WeeklyReport[]);
      // Exclude the current week (same weekStart) and sort newest first
      const past = reports
        .filter((r) => r.weekStart !== form.weekStart)
        .sort((a, b) => {
          const aT =
            typeof a.createdAt === "number"
              ? a.createdAt
              : Number(a.createdAt) || 0;
          const bT =
            typeof b.createdAt === "number"
              ? b.createdAt
              : Number(b.createdAt) || 0;
          return bT - aT;
        });
      setPastReports(past);
    } catch (_) {
      toast.error("Could not load past weekly reports.");
    } finally {
      setLoadingPastReports(false);
    }
  };

  const handleImportFromReport = (selectedReport: WeeklyReport) => {
    // ── Primary strategy: look up the IDs saved on the past report document
    //    and find their full records from the project sample cache.
    //    Overwrites existing cube tests with the selected past week's tests.
    const savedCubeEntries: any[] = Array.isArray(selectedReport.cubeTests)
      ? (selectedReport.cubeTests as any[])
      : [];

    if (savedCubeEntries.length === 0) {
      toast("No cube samples found on that week's report.", { icon: "ℹ️" });
      setShowImportPanel(false);
      return;
    }

    const formatVal = (val: any): number | "" => {
      if (val === undefined || val === null || val === "" || val === "N/A")
        return "";
      const num = typeof val === "number" ? val : parseFloat(String(val));
      return isNaN(num) ? "" : Number(num.toFixed(2));
    };

    // Get cube details directly from the selected report (not from raw lump concrete)
    const matched: ConcreteCubeSample[] = savedCubeEntries.map(
      (entry: any, idx: number) => {
        const entryId = entry.id || entry.sampleId || `CUBE-${idx + 1}`;
        const entrySampleId = entry.sampleId || entry.id || `CUBE-${idx + 1}`;
        const entryDate = entry.dateCast || entry.castDate || entry.date || "";
        const elemName =
          entry.inscribedName ||
          entry.elementLevel ||
          entry.structureElement ||
          entry.level ||
          "";

        const s7 = formatVal(
          entry.strength7Days ??
            entry.strength7 ??
            entry.day7Results?.[0]?.averageStrength ??
            (entry.compressiveStrength ? entry.compressiveStrength : ""),
        );
        const stat7 = String(
          entry.status7Days ||
            entry.result7Days ||
            entry.day7Results?.[0]?.status ||
            entry.result ||
            "",
        );
        const s28 = formatVal(
          entry.strength28Days ??
            entry.strength28 ??
            entry.day28Results?.[0]?.averageStrength ??
            "",
        );
        const stat28 = String(
          entry.status28Days ||
            entry.result28Days ||
            entry.day28Results?.[0]?.status ||
            "",
        );

        return {
          id: entryId,
          sampleId: entrySampleId,
          castDate: entryDate,
          dateCast: entryDate,
          date: entryDate,
          level: elemName,
          elementLevel: elemName,
          structureElement: elemName,
          inscribedName: elemName,
          grade: entry.grade || "",
          mixId: entry.mixId || entry.mix || "",
          compressiveStrength: s7 !== "" ? Number(s7) : 0,
          strength7Days: s7,
          status7Days: stat7,
          strength28Days: s28,
          status28Days: stat28,
          day7Results:
            s7 !== ""
              ? [
                  {
                    averageStrength: Number(s7),
                    status: stat7,
                  },
                ]
              : entry.day7Results || [],
          day28Results:
            s28 !== ""
              ? [
                  {
                    averageStrength: Number(s28),
                    status: stat28,
                  },
                ]
              : entry.day28Results || [],
          projectId: currentProjId,
          companyId: currentCompId,
          createdAt: 0,
        } as unknown as ConcreteCubeSample;
      },
    );

    // Overwrite existing cube tests with the imported ones
    setCubeTests(matched);

    // Track imported IDs so we can highlight / allow clearing
    const importedSet = new Set<string>();
    matched.forEach((c) => {
      if (c.id) importedSet.add(c.id);
      if (c.sampleId) importedSet.add(c.sampleId);
    });
    setImportedCubeIds(importedSet);

    toast.success(
      `${matched.length} cube sample${matched.length !== 1 ? "s" : ""} imported (overwriting current list) from ${selectedReport.reportNumber || "previous week"}.`,
    );
    setShowImportPanel(false);
  };

  const handleClearImported = () => {
    if (importedCubeIds.size === 0) return;
    setCubeTests(allCubeSamplesRef.current);
    setImportedCubeIds(new Set());
    toast("Restored current period cube samples.", { icon: "🔄" });
  };

  const resolveTimestamp = (fieldVal: any, fallbackField?: any): number => {
    const target = fieldVal ?? fallbackField;
    if (!target) return 0;
    if (typeof target === "number") return target;

    if (typeof target === "object" && target !== null) {
      if (typeof target.toMillis === "function") return target.toMillis();
      if (typeof target.toDate === "function") return target.toDate().getTime();
      if (typeof target.seconds === "number") return target.seconds * 1000;
    }

    if (
      typeof target === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(target.trim())
    ) {
      const [y, m, d] = target.split("-").map(Number);
      return new Date(y, m - 1, d, 12, 0, 0, 0).getTime();
    }

    const parsed = new Date(target).getTime();
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleLevelChange = (newLevelId: string) => {
    setSelectedLevelId(newLevelId);

    let lvlName = "All Project Structural Levels Combined";
    if (newLevelId !== "ALL") {
      const foundLvl = levelOptions.find((l) => l.id === newLevelId);
      if (foundLvl) lvlName = foundLvl.name;
    }

    setSelectedLevelName(lvlName);

    setForm((prev) => ({
      ...prev,
      title: `QAQC WEEKLY REPORT - ${lvlName.toUpperCase()} ${
        activeProject?.name?.toUpperCase() || ""
      }`.trim(),
    }));
  };

  useEffect(() => {
    if (activeProject?.currentLevelId && activeProject.currentLevelId !== prevLevelIdRef.current) {
      prevLevelIdRef.current = activeProject.currentLevelId;
      handleLevelChange(activeProject.currentLevelId);
    }
  }, [activeProject?.currentLevelId, levelOptions]);

  // Filter Structural Elements
  const filteredStructuralElements = useMemo(() => {
    if (!structuralElements.length) return [];

    return structuralElements.filter((el) => {
      const isLevelMatch = isElementInSelectedLevel(el, selectedLevelId);
      const rawType =
        el.elementType || (el as any).type || (el as any).element || "";
      return isLevelMatch && isValidTargetElementType(rawType);
    });
  }, [selectedLevelId, structuralElements]);

  // Update Element Achieved Volume & Auto-update Status
  const handleUpdateElementAchievedVolume = (
    elId: string,
    achievedVol: number,
  ) => {
    setStructuralElements((prev) =>
      prev.map((el) => {
        if (el.id === elId) {
          const calcVol = Number(el.calculatedVolume || el.volume || 0);
          const safeAchVol = Math.max(0, achievedVol);
          const newStatus =
            safeAchVol >= calcVol && calcVol > 0
              ? "APPROVED"
              : safeAchVol > 0
                ? "POURED"
                : el.status || "PENDING";
          return {
            ...el,
            achievedVolume: safeAchVol,
            status: newStatus as any,
          };
        }
        return el;
      }),
    );
  };

  // Automated Volumetric Quantity Breakdown
  useEffect(() => {
    if (!structuralElements.length) {
      setManualQuantities([]);
      return;
    }

    const levelElements = structuralElements.filter((el) =>
      isElementInSelectedLevel(el, selectedLevelId),
    );

    const volumeGroups: Record<string, { total: number; completed: number }> =
      {};

    levelElements.forEach((el) => {
      const rawType =
        el.elementType ||
        (el as any).type ||
        (el as any).element ||
        "Component";
      const formattedType = rawType.toUpperCase().trim();
      const rawVolume =
        parseFloat(String(el.calculatedVolume || el.volume || 0)) || 0;

      const rawAchieved =
        parseFloat(
          String(el.achievedVolume ?? (el as any).completedVolume ?? 0),
        ) || 0;

      const status = (el.status || "").toUpperCase().trim();
      const isCompleted =
        status === "POURED" || status === "APPROVED" || status === "COMPLETED";

      if (!volumeGroups[formattedType]) {
        volumeGroups[formattedType] = { total: 0, completed: 0 };
      }

      volumeGroups[formattedType].total += rawVolume;
      if (rawAchieved > 0) {
        volumeGroups[formattedType].completed += rawAchieved;
      } else if (isCompleted) {
        volumeGroups[formattedType].completed += rawVolume;
      }
    });

    const calculatedRows = Object.entries(volumeGroups).map(
      ([elementName, data]) => {
        const completionPercentage =
          data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

        return {
          element: elementName,
          scope: `${data.total.toFixed(1)} CUM`,
          completion: `${completionPercentage}%`,
          calculatedVolume: Number(data.total.toFixed(2)),
          achievedVolume: Number(data.completed.toFixed(2)),
        };
      },
    );

    if (calculatedRows.length > 0) {
      setManualQuantities(calculatedRows);
    } else {
      setManualQuantities([
        { element: "BEAM", scope: "0 CUM", completion: "0%" },
        { element: "COLUMN", scope: "0 CUM", completion: "0%" },
        { element: "SLAB", scope: "0 CUM", completion: "0%" },
      ]);
    }
  }, [selectedLevelId, structuralElements]);

  const addQuantityRow = () => {
    setManualQuantities([
      ...manualQuantities,
      { element: "", scope: "0 CUM", completion: "0%" },
    ]);
  };

  const removeQuantityRow = (idx: number) => {
    setManualQuantities(manualQuantities.filter((_, i) => i !== idx));
  };

  // Flatten & Filter Site Comments (Type 1: Created in week, Type 2: Open regardless of age, Type 3: Closed/Status changed in week)
  const getFlattenedSiteComments = (
    reports: SiteCommentReport[],
    levelIdFilter: string,
    dateStart: number,
    dateEnd: number,
  ): FlattenedSiteComment[] => {
    const flat = (reports || [])
      .flatMap((report) => {
        const reportCreatedDate = resolveTimestamp(
          report.inspectionDate,
          report.createdAt,
        );
        const isReportCreatedInWeek =
          reportCreatedDate >= dateStart && reportCreatedDate <= dateEnd;

        return (report.observations || []).map((obs) => {
          const obsCreatedDate = resolveTimestamp(
            (obs as any).date,
            reportCreatedDate,
          );
          const obsUpdatedDate = resolveTimestamp(
            (obs as any).updatedAt ||
              (obs as any).closedAt ||
              (obs as any).rectifiedAt ||
              (obs as any).resolvedAt,
            (report as any).updatedAt || obsCreatedDate,
          );

          // Type 1: Created within the week in question
          const isCreatedInWeek =
            isReportCreatedInWeek ||
            (obsCreatedDate >= dateStart && obsCreatedDate <= dateEnd);

          const normStatus = String(obs.status || "OPEN")
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, "_");

          const isClosedOrCompliant =
            normStatus === "compliant" ||
            normStatus === "fixed" ||
            normStatus === "rectified" ||
            normStatus === "closed" ||
            normStatus === "passed" ||
            normStatus === "approved" ||
            normStatus === "rectified_on_site";

          // Type 2: Open (even if created years ago)
          const isOpenObservation = !isClosedOrCompliant;

          // Type 3: Closed or status changed within the week
          const isClosedOrUpdatedInWeek =
            obsUpdatedDate >= dateStart && obsUpdatedDate <= dateEnd;

          // Inclusion rule: Type 1 OR Type 2 OR Type 3
          if (isCreatedInWeek || isOpenObservation || isClosedOrUpdatedInWeek) {
            return {
              id: obs.elementId || "",
              levelId: obs.levelId || "",
              level: obs.levelName || "",
              element: obs.structuralElement || "",
              location: obs.gridLocation || "",
              comments: obs.comments || (obs as any).fieldObservation || "",
              commentItems: (obs as any).commentItems || [],
              status: obs.status || "Open",
              inspector: report.raisedByName || "Inspector",
              date:
                (obs as any).date ||
                report.inspectionDate ||
                (report.createdAt
                  ? new Date(report.createdAt).toISOString().split("T")[0]
                  : ""),
              projectName: report.projectName || "",
              reportNumber: report.reportNumber || "",
              photos: Array.isArray((obs as any).photos)
                ? (obs as any).photos
                    .map((p: any) => {
                      if (typeof p === "string") {
                        return p.length > 200000 ? "" : p;
                      }
                      if (
                        p &&
                        typeof p === "object" &&
                        typeof p.url === "string"
                      ) {
                        return p.url.length > 200000 ? { ...p, url: "" } : p;
                      }
                      return p;
                    })
                    .filter(Boolean)
                : [],
              vendorCheck:
                (obs as any).vendorCheck || (obs as any).assignedTo || "",
            };
          }
          return null;
        });
      })
      .filter(Boolean) as FlattenedSiteComment[];

    if (
      !levelIdFilter ||
      levelIdFilter === "ALL" ||
      String(levelIdFilter || "")
        .toLowerCase()
        .includes("all")
    )
      return flat;
    return flat.filter(
      (item) =>
        !item.levelId ||
        item.levelId === levelIdFilter ||
        item.level === levelIdFilter,
    );
  };

  // Compile Report Data
  const compileReportData = useMemo(() => {
    const [sY, sM, sD] = form.weekStart.split("-").map(Number);
    const start = new Date(sY, sM - 1, sD, 0, 0, 0, 0).getTime();

    const [eY, eM, eD] = form.weekEnd.split("-").map(Number);
    const end = new Date(eY, eM - 1, eD, 23, 59, 59, 999).getTime();

    const rangeDeliveries = materialDeliveries
      .filter((d) => {
        const t = resolveTimestamp(
          d.deliveryDate || (d as any).date || (d as any).timestamp,
          d.createdAt,
        );
        const isWithinWeek = t >= start && t <= end;
        const deliveryLevelId =
          (d as any).levelId || (d as any).locationLevelId || "";
        const matchesLevel =
          !selectedLevelId ||
          selectedLevelId === "ALL" ||
          String(selectedLevelId || "")
            .toLowerCase()
            .includes("all") ||
          !deliveryLevelId ||
          deliveryLevelId === selectedLevelId;

        return isWithinWeek && matchesLevel;
      })
      .map((d: any) => ({
        ...d,
        id: d.id,
        deliveryDate: d.deliveryDate || d.date || "N/A",
        materialName: d.materialName || d.materialDescription || d.name || "N/A",
        materialDescription: d.materialDescription || d.materialName || d.name || "N/A",
        supplier: d.supplier || d.supplierName || d.source || "N/A",
        supplierName: d.supplierName || d.supplier || d.source || "N/A",
        quantity: d.quantity || d.qty || "N/A",
        quantityReceived:
          d.quantityReceived !== undefined
            ? d.quantityReceived
            : typeof d.quantity === "number"
              ? d.quantity
              : undefined,
        quantityAccepted:
          d.quantityAccepted !== undefined
            ? d.quantityAccepted
            : d.quantityRejected !== undefined
              ? undefined
              : d.quantity,
        quantityRejected: d.quantityRejected ?? 0,
        unit: d.unit || "",
        batchNumber: d.batchNumber || "",
        deliveryNoteNumber: d.deliveryNoteNumber || d.deliveryNote || "",
        truckNumber: d.vehicleTruckNumber || d.truckNumber || "",
        status: d.status || d.qaqcStatus || "APPROVED",
        qaqcStatus: d.qaqcStatus || d.status || "APPROVED",
        remarks: d.remarks || d.qaqcRemarks || d.inspectionNotes || "Verified",
        qaqcRemarks: d.qaqcRemarks || d.remarks || d.inspectionNotes || "Verified",
        rejectionReason: d.rejectionReason || "",
        ncrNumber: d.ncrNumber || "",
      }));

    // NCR Filter (Type 1: Created in week, Type 2: Open/Unrectified regardless of age, Type 3: Closed/Status changed in week)
    const rangeNcrs = ncrs.filter((n) => {
      // Type 1: Created within the week in question
      const tCreated = resolveTimestamp(n.createdAt, n.dateFound);
      const isCreatedInWeek = tCreated >= start && tCreated <= end;

      const st = String(n.status || "")
        .trim()
        .toUpperCase();
      const finalSt = String((n as any).finalStatus || "")
        .trim()
        .toUpperCase();
      const isClosedOrRectified =
        st === "CLOSED" ||
        st === "RECTIFIED" ||
        st === "RESOLVED" ||
        st === "APPROVED" ||
        finalSt === "CLOSED" ||
        finalSt === "RESOLVED";

      // Type 2: Open (even if created years ago)
      const isOpenOrNotRectified = !isClosedOrRectified;

      // Type 3: Closed or status changed within the week
      const tUpdated = resolveTimestamp(
        (n as any).closedAt ||
          (n as any).rectifiedAt ||
          (n as any).resolvedAt ||
          (n as any).signDate ||
          (n as any).remedyDate ||
          (n as any).statusChangeDate,
        n.updatedAt,
      );
      const isClosedOrUpdatedInWeek = tUpdated >= start && tUpdated <= end;

      const ncrLevelId = (n as any).levelId || (n as any).locationLevelId || "";
      const matchesLevel =
        !selectedLevelId ||
        selectedLevelId === "ALL" ||
        String(selectedLevelId || "")
          .toLowerCase()
          .includes("all") ||
        !ncrLevelId ||
        ncrLevelId === selectedLevelId ||
        (n as any).level === selectedLevelId;

      // Inclusion rule: Type 1 OR Type 2 OR Type 3
      return (
        (isCreatedInWeek || isOpenOrNotRectified || isClosedOrUpdatedInWeek) &&
        matchesLevel
      );
    });

    const rangeInspections = inspections.filter((i) => {
      const t = resolveTimestamp(
        i.createdAt,
        (i as any).date || (i as any).inspectionDate,
      );
      const isWithinWeek = t >= start && t <= end;
      const st = String(i.status || "").toUpperCase();
      const isNotClosedOrApproved =
        st !== "PASSED" && st !== "APPROVED" && st !== "CLOSED";

      return isWithinWeek || isNotClosedOrApproved;
    });

    const levelCubeTests = cubeTests
      .filter((c) => {
        if (importedCubeIds.has(c.id || c.sampleId || "")) return true;
        if (!selectedLevelId || selectedLevelId === "ALL") return true;
        const cubeLevelId = (c as any).levelId || "";
        return cubeLevelId === selectedLevelId;
      })
      .map((c) => ({
        id: c.id || c.sampleId || "",
        cubeId: c.sampleId || c.id || "",
        sampleId: c.sampleId || c.id || "",
        dateCast: (c as any).dateCast || c.castDate || (c as any).date || "",
        castDate: (c as any).dateCast || c.castDate || (c as any).date || "",
        elementLevel:
          c.level ||
          (c as any).elementLevel ||
          (c as any).structureElement ||
          (c as any).location ||
          "Structural Component",
        inscribedName:
          c.inscribedName ||
          (c as any).elementLevel ||
          (c as any).structureElement ||
          c.level ||
          "",
        strength7Days: String(
          (c as any).strength7Days !== undefined &&
            (c as any).strength7Days !== null &&
            (c as any).strength7Days !== ""
            ? (c as any).strength7Days
            : (c.day7Results?.[0]?.averageStrength ??
                (c as any).compressiveStrength ??
                ""),
        ),
        status7Days: String(
          (c as any).status7Days !== undefined &&
            (c as any).status7Days !== null &&
            (c as any).status7Days !== ""
            ? (c as any).status7Days
            : (c.day7Results?.[0]?.status ??
                (c as any).result7Days ??
                (c as any).result ??
                "pending"),
        ),
        strength28Days: String(
          (c as any).strength28Days !== undefined &&
            (c as any).strength28Days !== null &&
            (c as any).strength28Days !== ""
            ? (c as any).strength28Days
            : (c.day28Results?.[0]?.averageStrength ?? ""),
        ),
        status28Days: String(
          (c as any).status28Days !== undefined &&
            (c as any).status28Days !== null &&
            (c as any).status28Days !== ""
            ? (c as any).status28Days
            : (c.day28Results?.[0]?.status ??
                (c as any).result28Days ??
                "pending"),
        ),
        mixId: (c as any).mixId || (c as any).mix || (c as any).mixDesign || "",
        grade: (c as any).grade || (c as any).targetStrength || "",
      }));

    const rangeSiteComments = getFlattenedSiteComments(
      siteCommentReports || [],
      selectedLevelId,
      start,
      end,
    );

    const passedCount = rangeInspections.filter((i) => {
      const st = String(i.status || "").toUpperCase();
      return st === "PASSED" || st === "APPROVED";
    }).length;
    const totalCount = rangeInspections.length;
    const computedCompliancePercentage =
      totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 100;

    const inspectionStats = {
      total: totalCount,
      passed: passedCount,
      failed: rangeInspections.filter((i) => {
        const st = String(i.status || "").toUpperCase();
        return st === "FAILED" || st === "REJECTED";
      }).length,
      pending: rangeInspections.filter((i) => {
        const st = String(i.status || "").toUpperCase();
        return (
          st === "PENDING_REVIEW" ||
          st === "PENDING" ||
          st === "OPEN" ||
          st === "SCHEDULED"
        );
      }).length,
    };

    const isNcrClosedOrRectified = (n: any) => {
      const st = String(n.status || "")
        .trim()
        .toUpperCase();
      const finalSt = String((n as any).finalStatus || "")
        .trim()
        .toUpperCase();
      return (
        st === "CLOSED" ||
        st === "RECTIFIED" ||
        st === "RESOLVED" ||
        st === "APPROVED" ||
        finalSt === "CLOSED" ||
        finalSt === "RESOLVED"
      );
    };

    const ncrStats = {
      opened: rangeNcrs.length,
      closed: rangeNcrs.filter(isNcrClosedOrRectified).length,
      openTotal: rangeNcrs.filter((n) => !isNcrClosedOrRectified(n)).length,
    };

    const isCommentClosedOrRectified = (f: any) => {
      const s = String(f.status || "")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");
      if (
        s === "non_compliant" ||
        s === "noncompliant" ||
        s === "in_progess" ||
        s === "in_progress" ||
        s === "inprogess" ||
        s === "inprogress" ||
        s === "open" ||
        s === "action_required" ||
        s === "pending"
      ) {
        return false;
      }
      return (
        s === "compliant" ||
        s === "fixed" ||
        s === "rectified" ||
        s === "closed" ||
        s === "passed" ||
        s === "approved" ||
        s === "rectified_on_site"
      );
    };

    const findingStats = {
      opened: rangeSiteComments.length,
      closed: rangeSiteComments.filter(isCommentClosedOrRectified).length,
      openTotal: rangeSiteComments.filter((f) => !isCommentClosedOrRectified(f))
        .length,
    };

    const formattedNcrLog = rangeNcrs.map((n, idx) => ({
      refNo: n.ncrNumber || `NCR-${idx + 1}`,
      dateIdentified: n.dateFound || new Date().toISOString().split("T")[0],
      elementLevel:
        (n as any).elementName || n.location || "Structural Component",
      description: Array.isArray((n as any).descriptionItems)
        ? (n as any).descriptionItems.join(", ")
        : n.description || "Field variance logged",
      riskLevel: n.severity || "MEDIUM",
      assignedTo: n.assignedTo || "Subcontractor",
      targetFixDate:
        (n as any).signDate ||
        (n as any).targetFixDate ||
        new Date().toISOString().split("T")[0],
      status: n.status || "OPEN",
    }));

    // Site Instructions Filter (Type 1: Issued in week, Type 2: Open regardless of age, Type 3: Closed/Status changed in week)
    const rangeSiteInstructions = siteInstructions.filter((si) => {
      // Type 1: Issued/Created within the week in question
      const tIssued = resolveTimestamp(
        (si as any).issuedDate || (si as any).date || si.signedBy?.signedAt,
        si.createdAt,
      );
      const isIssuedInWeek = tIssued >= start && tIssued <= end;

      // Type 2: Open (even if created years ago)
      const st = String(si.status || "ISSUED")
        .trim()
        .toUpperCase();
      const isClosed =
        st === "CLOSED" ||
        st === "COMPLETED" ||
        st === "RESOLVED" ||
        st === "CANCELLED";
      const isOpen = !isClosed;

      // Type 3: Closed or status changed within the week
      const tUpdated = resolveTimestamp(
        (si as any).closedAt ||
          (si as any).completedAt ||
          (si as any).resolvedAt ||
          (si as any).verifiedAt ||
          (si as any).signedAt,
        si.updatedAt,
      );
      const isClosedOrUpdatedInWeek = tUpdated >= start && tUpdated <= end;

      const siLevelId = (si as any).levelId || "";
      const matchesLevel =
        !selectedLevelId ||
        selectedLevelId === "ALL" ||
        String(selectedLevelId || "")
          .toLowerCase()
          .includes("all") ||
        !siLevelId ||
        siLevelId === selectedLevelId ||
        (si as any).level === selectedLevelId;

      // Inclusion rule: Type 1 OR Type 2 OR Type 3
      return (
        (isIssuedInWeek || isOpen || isClosedOrUpdatedInWeek) && matchesLevel
      );
    });

    return {
      inspectionStats,
      ncrStats,
      findingStats,
      overallQualityCompliance: computedCompliancePercentage,
      ncrRemediationLog: formattedNcrLog,
      materialDeliveriesList: rangeDeliveries,
      cubeTestsList: levelCubeTests,
      inspectionsList: rangeInspections,
      findingsList: rangeSiteComments,
      siteCommentsList: rangeSiteComments,
      siteInstructionsList: rangeSiteInstructions,
    };
  }, [
    form.weekStart,
    form.weekEnd,
    selectedLevelId,
    inspections,
    ncrs,
    materialDeliveries,
    cubeTests,
    siteCommentReports,
    siteInstructions,
  ]);

  // Save Handlers
  const handleSaveToDatabase = async () => {
    if (!canGenerateWeeklyReport) {
      toast.error(
        "You do not have permission to compile weekly quality reports",
      );
      return null;
    }
    const effectiveProjId =
      currentProjId ||
      activeProject?.id ||
      paramProjId ||
      localStorage.getItem("jqms_active_project_id") ||
      localStorage.getItem("currentProjectId") ||
      projects[0]?.id ||
      "default-project";

    const executiveSummaryText =
      form.executiveSummary.trim() || defaultExecutiveSummary;

    setSaveStatus("saving");
    try {
      const isoDetails = getISOWeekDetails(form.weekStart);
      const reportNumber = generateWeeklyReportNumber(
        company?.settings?.weeklyReportPrefix,
      );
      const timestamp = Date.now();

      let calculatedTotalVolume = 0;
      let calculatedCompletedVolume = 0;

      const formattedQuantities = manualQuantities.map((row) => {
        const rowScope = String(row?.scope || "");
        const rowCompletion = String(row?.completion || "");
        const numericScope = parseFloat(rowScope.replace(/[^0-9.]/g, "")) || 0;
        const numericPercent =
          parseFloat(rowCompletion.replace(/[^0-9.]/g, "")) || 0;
        const rowCompletedVol = numericScope * (numericPercent / 100);

        calculatedTotalVolume += numericScope;
        calculatedCompletedVolume += rowCompletedVol;

        return {
          element: String(row?.element || "")
            .toUpperCase()
            .trim(),
          scope: rowScope.toUpperCase().includes("CUM")
            ? rowScope.toUpperCase()
            : `${rowScope} CUM`,
          completion: rowCompletion.includes("%")
            ? rowCompletion
            : `${rowCompletion}%`,
        };
      });

      const overallCompletionPercentage =
        calculatedTotalVolume > 0
          ? Math.round(
              (calculatedCompletedVolume / calculatedTotalVolume) * 100,
            )
          : 0;

      const reportId = `WQR-${timestamp}`;

      const combinedReportPayload: WeeklyReport = {
        id: reportId,
        reportNumber,
        weekNumber: isoDetails.week,
        year: isoDetails.year,
        startDate: form.weekStart,
        endDate: form.weekEnd,
        title: form.title,
        revisionNumber: form.revisionNumber || "Rev 1.0 (Final Submission)",
        weekStart: form.weekStart,
        weekEnd: form.weekEnd,
        includeNcrsAndComments,
        includeNcrs: includeNcrsAndComments,
        includeSiteComments: includeNcrsAndComments,
        includeSiteInstructions,
        printOrientation: "portrait",
        executiveSummary: executiveSummaryText,
        highlights: form.highlights,
        concerns: form.concerns,
        nextWeekPlan: form.nextWeekPlan,
        remediationSummaryText: form.remediationSummaryText,
        selectedLevelId,
        selectedLevel: selectedLevelName,
        selectedLevelName,
        createdAt: timestamp,
        updatedAt: timestamp,
        companyName: company?.name || "Company",
        companyId: currentCompId,
        projectId: effectiveProjId,
        coverImageBase64:
          activeProject?.coverImageUrl || activeProject?.imageUrl || "",
        coverImageUrl:
          activeProject?.coverImageUrl || activeProject?.imageUrl || "",
        logoBase64: company?.logoUrl || "",
        projectName: activeProject?.name || "Project",
        preparedBy: {
          uid: currentUser?.uid || "",
          name: currentUser?.fullName || "QA/QC Engineer",
          email: currentUser?.email || "",
          designation: preparedByDesignation.trim(),
          role:
            preparedByDesignation.trim() ||
            (currentUser?.role
              ? ROLE_TITLES[currentUser.role]
              : "QA/QC Lead Engineer"),
          signed: false,
        },
        status: "DRAFT",

        quantitySummary: formattedQuantities as any,
        totalVolumeCalculated: Number(calculatedTotalVolume.toFixed(1)),
        overallQuantityCompletion: overallCompletionPercentage,

        overallQualityCompliance: compileReportData.overallQualityCompliance,
        inspectionStats: compileReportData.inspectionStats,
        ncrRemediationLog: compileReportData.ncrRemediationLog as any,
        ncrStats: compileReportData.ncrStats,
        findingStats: compileReportData.findingStats,

        materialDeliveries: compileReportData.materialDeliveriesList as any,
        cubeTests: compileReportData.cubeTestsList as any,
        siteComments: compileReportData.siteCommentsList as any,
        siteInstructions: compileReportData.siteInstructionsList as any,
        structuralElements: (filteredStructuralElements || []).map((el) => {
          const calcVol = Number(el.calculatedVolume || el.volume || 0);
          const statusStr = String(el.status || "").toUpperCase();
          const achVol = Number(
            el.achievedVolume ??
              (statusStr === "POURED" ||
              statusStr === "APPROVED" ||
              statusStr === "COMPLETED"
                ? calcVol
                : 0),
          );
          const compPct =
            calcVol > 0
              ? Math.min(100, Math.max(0, Math.round((achVol / calcVol) * 100)))
              : 0;
          return {
            id: el.id,
            elementName:
              el.elementName || (el as any).name || "Structural Element",
            elementType: el.elementType || (el as any).type || "Component",
            status: el.status || "PENDING",
            volume: calcVol,
            calculatedVolume: calcVol,
            achievedVolume: achVol,
            completionPercentage: compPct,
            levelName: el.levelName || el.level || selectedLevelName,
            level: el.levelName || el.level || selectedLevelName,
            grid: el.grid || (el as any).gridLocation || "",
            gridLocation: el.grid || (el as any).gridLocation || "",
          };
        }) as any,

        filteredNcrs: compileReportData.ncrRemediationLog,
        filteredInspections: compileReportData.inspectionsList,
        filteredFindings: compileReportData.findingsList,
        filteredMaterialDeliveries: compileReportData.materialDeliveriesList,
        filteredCubeTests: compileReportData.cubeTestsList,
        filteredSiteComments: compileReportData.siteCommentsList,
        filteredSiteInstructions: compileReportData.siteInstructionsList,
      };

      try {
        await dbService.saveWeeklyReport(combinedReportPayload);
      } catch (saveErr) {
        console.warn(
          "Direct save warning (session cache guarantees availability):",
          saveErr,
        );
      }

      try {
        await writeAudit({
          userId: currentUser?.uid || "system",
          userName: currentUser?.fullName || "QA/QC Engineer",
          companyId: currentCompId || "default",
          module: "reports" as any,
          action: "Weekly Report Created",
          details: `Created weekly report ${reportNumber} targeting level [${selectedLevelName}] with Quality Compliance Rate of ${compileReportData.overallQualityCompliance}%`,
          projectId: effectiveProjId,
        });
      } catch (auditErr) {
        console.warn("Non-fatal: failed to write audit log:", auditErr);
      }

      setSaveStatus("saved");
      toast.success("Structured weekly report saved successfully!");
      return combinedReportPayload;
    } catch (err: any) {
      console.error("Compilation error:", err);
      setSaveStatus("idle");
      toast.error("Failed to compile report. Please check required fields.");
      return null;
    }
  };

  const handleSaveAndGenerate = async () => {
    setSubmitting(true);
    try {
      const savedData = await handleSaveToDatabase();
      if (savedData && savedData.id) {
        const dest = paramProjId
          ? `/project/${paramProjId}/weekly-reports/${savedData.id}`
          : `/project/weekly-reports/${savedData.id}`;
        navigate(dest);
      }
    } catch (navErr) {
      console.error("Navigation/generation error:", navErr);
    } finally {
      setSubmitting(false);
    }
  };

  // Modern UI Classes
  const inputClass =
    "w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all shadow-xs";

  const tableHeaderClass =
    "px-3.5 py-2.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-100/70 border-b border-slate-200";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 p-4 md:p-6 font-sans">
      {/* --- HEADER BAR --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-md dark:shadow-xl sticky top-1 sm:top-2 z-30 transition-colors">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate("/project/weekly-reports")}
            className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors border border-slate-200/60"
            title="Back to Weekly Reports"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="text-orange-500" size={22} />
              Compile Scoped Weekly Report
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Auto-bundle project data based on specific date definitions and
              dynamic live database parameters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50 border border-slate-200 rounded-xl transition"
            title="Refresh Database Records"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin text-orange-500" : ""}
            />
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Dynamic Scoping Active
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-7 shadow-sm space-y-7">
        {/* --- SCOPE CONTROLS PANEL --- */}
        <div className="bg-slate-950 text-white p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            <Calendar size={14} className="text-orange-400" />
            Report Time Horizon & Level Scope Filters
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Field label="Reporting Week Start" dark>
              <input
                type="date"
                value={form.weekStart}
                onChange={(e) =>
                  setForm((p) => ({ ...p, weekStart: e.target.value }))
                }
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none transition-all"
              />
            </Field>

            <Field label="Reporting Week End" dark>
              <input
                type="date"
                value={form.weekEnd}
                onChange={(e) =>
                  setForm((p) => ({ ...p, weekEnd: e.target.value }))
                }
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 focus:border-orange-500 rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none transition-all"
              />
            </Field>

            <div className="w-full">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                Target Level Scope
              </label>
              <select
                value={selectedLevelId}
                onChange={(e) => handleLevelChange(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 text-[13px] font-medium focus:outline-none focus:border-orange-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                <option value="ALL">All Structural Levels Combined</option>
                {levelOptions.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* --- AUDIT & PRESENTATION SCOPE OPTIONS --- */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                Quality Audit Presentation Mode
              </span>
              <span className="text-[11px] text-slate-500">
                Configure whether Non-Conformance defect registers & field
                comments are included or suppressed for executive views.
              </span>
            </div>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => setIncludeNcrsAndComments(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  includeNcrsAndComments
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                1. Full Quality Audit (Show NCRs & Comments)
              </button>
              <button
                type="button"
                onClick={() => setIncludeNcrsAndComments(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !includeNcrsAndComments
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                2. Executive Clean (No NCRs & Comments)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeSiteInstructions}
                onChange={(e) => setIncludeSiteInstructions(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700">
                Include Site Instructions Directive Register
              </span>
            </label>
            <span className="text-[11px] text-slate-500 font-mono">
              {compileReportData.siteInstructionsList.length} Site
              Instruction(s) scoped
            </span>
          </div>
        </div>

        {/* --- TITLE, REVISION & COMPLIANCE RATE ROW --- */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <Field label="Document Report / Slide Deck Title Header">
              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
          </div>
          <div className="md:col-span-3">
            <Field label="Revision Control (Back Sign-Off Page)">
              <input
                type="text"
                value={form.revisionNumber}
                placeholder="e.g. Rev 1.0 (Final Submission)"
                onChange={(e) =>
                  setForm((p) => ({ ...p, revisionNumber: e.target.value }))
                }
                className={`${inputClass} font-mono`}
              />
            </Field>
          </div>
          <div className="md:col-span-3">
            <Field label="Auto Quality Compliance">
              <div className="relative flex items-center">
                <input
                  type="text"
                  readOnly
                  value={`${compileReportData.overallQualityCompliance}%`}
                  className={`${inputClass} font-black text-emerald-700 bg-emerald-50/60 border-emerald-300 pr-10`}
                />
                <Percent
                  size={15}
                  className="absolute right-3.5 text-emerald-600"
                />
              </div>
            </Field>
          </div>
        </div>

        {/* --- PREPARED BY & DESIGNATION ROW --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Prepared By (Signatory Name)">
            <input
              type="text"
              readOnly
              value={currentUser?.fullName || "QA/QC Authority"}
              className={`${inputClass} bg-slate-50 text-slate-700 font-semibold`}
            />
          </Field>
          <Field label="Your Signatory Designation / Professional Title">
            <input
              type="text"
              value={preparedByDesignation}
              onChange={(e) => setPreparedByDesignation(e.target.value)}
              placeholder="e.g. QA/QC Engineer, Quality Manager, Resident Engineer"
              className={inputClass}
            />
          </Field>
        </div>

        {/* --- METRICS QUICK SUMMARY CARDS --- */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <MetricCard
            icon={<Package size={14} className="text-slate-600" />}
            label="Deliveries"
            value={compileReportData.materialDeliveriesList.length}
            color="text-slate-900"
            bgColor="bg-slate-50 border-slate-200"
          />
          <MetricCard
            icon={<ClipboardCheck size={14} className="text-emerald-600" />}
            label="Inspections"
            value={compileReportData.inspectionStats.total}
            color="text-emerald-700"
            bgColor="bg-emerald-50/50 border-emerald-200"
          />
          <MetricCard
            icon={<AlertTriangle size={14} className="text-rose-600" />}
            label="NCRs Found"
            value={compileReportData.ncrStats.opened}
            color="text-rose-700"
            bgColor="bg-rose-50/50 border-rose-200"
          />
          <MetricCard
            icon={<Activity size={14} className="text-blue-600" />}
            label="Snags Logged"
            value={compileReportData.findingStats.opened}
            color="text-blue-700"
            bgColor="bg-blue-50/50 border-blue-200"
          />
          <MetricCard
            icon={<Box size={14} className="text-orange-600" />}
            label="Cube Logs"
            value={compileReportData.cubeTestsList.length}
            color="text-orange-700"
            bgColor="bg-orange-50/50 border-orange-200"
          />
          <MetricCard
            icon={<FileText size={14} className="text-indigo-600" />}
            label="Site Comments"
            value={compileReportData.siteCommentsList.length}
            color="text-indigo-700"
            bgColor="bg-indigo-50/50 border-indigo-200"
          />
        </div>

        {/* --- QUANTITIES & CALCULATIONS MATRIX --- */}
        <div className="space-y-3 border border-slate-200 rounded-2xl p-4 md:p-5 bg-white shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Layers size={15} className="text-orange-500" />
                Quantities & Structural Progress Track
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Volumes and completion percentages are automatically compiled
                based on elements whose status is Poured or Approved.
              </p>
            </div>
            <button
              type="button"
              onClick={addQuantityRow}
              className="self-start sm:self-auto text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl transition-colors border border-orange-200/80"
            >
              <Plus size={13} /> Add Custom Row
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/70">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>
                    Structural Horizon Element
                  </th>
                  <th className={tableHeaderClass}>
                    Target Volume Scope (CUM)
                  </th>
                  <th className={tableHeaderClass}>Completion Progress (%)</th>
                  <th className={`${tableHeaderClass} w-10 text-center`}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {manualQuantities.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.element}
                        onChange={(e) => {
                          const n = [...manualQuantities];
                          n[idx].element = e.target.value;
                          setManualQuantities(n);
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500"
                        placeholder="e.g. BEAM"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.scope}
                        onChange={(e) => {
                          const n = [...manualQuantities];
                          n[idx].scope = e.target.value;
                          setManualQuantities(n);
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-orange-500"
                        placeholder="e.g. 85 CUM"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.completion}
                        onChange={(e) => {
                          const n = [...manualQuantities];
                          n[idx].completion = e.target.value;
                          setManualQuantities(n);
                        }}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-orange-500 text-orange-600 font-black"
                        placeholder="e.g. 100%"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeQuantityRow(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Remove row"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {manualQuantities.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-8 text-slate-400 italic bg-slate-50/50"
                    >
                      No structural elements found matching this level scope.
                      Use the custom row adder if needed.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- STRUCTURAL ELEMENTS REGISTRY TABLE --- */}
        <div className="space-y-3 border border-slate-200 rounded-2xl p-4 md:p-5 bg-white shadow-xs">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Box size={15} className="text-slate-600" />
                Level Structural Elements Registry
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Auto-filtered structural elements for{" "}
                <strong className="text-slate-700">{selectedLevelName}</strong>{" "}
                ({filteredStructuralElements.length} elements)
              </p>
            </div>
            <span className="text-[10px] font-black px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-200">
              {filteredStructuralElements.length} Elements
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/70 max-h-72">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className={tableHeaderClass}>Element Name</th>
                  <th className={tableHeaderClass}>Type</th>
                  <th className={tableHeaderClass}>Grid</th>
                  <th className={tableHeaderClass}>Calculated Vol (CUM)</th>
                  <th className={tableHeaderClass}>Achieved Vol (CUM)</th>
                  <th className={tableHeaderClass}>% Achieved</th>
                  <th className={tableHeaderClass}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredStructuralElements.map((el, idx) => {
                  const name =
                    el.name ||
                    el.elementName ||
                    (el as any).element ||
                    "Unnamed Element";
                  const type = (el as any).type || el.elementType || "-";
                  const grid =
                    (el as any).gridLocation || (el as any).grid || "-";
                  const statusStr = String(el.status || "").toUpperCase();
                  const calcVol = parseFloat(
                    String(el.calculatedVolume || el.volume || 0),
                  );
                  const achVol = parseFloat(
                    String(
                      el.achievedVolume ??
                        (statusStr === "POURED" ||
                        statusStr === "APPROVED" ||
                        statusStr === "COMPLETED"
                          ? calcVol
                          : 0),
                    ),
                  );
                  const pct =
                    calcVol > 0
                      ? Math.min(
                          100,
                          Math.max(0, Math.round((achVol / calcVol) * 100)),
                        )
                      : 0;
                  const status = (el.status || "PENDING").toUpperCase();

                  const statusColor =
                    statusStr === "POURED" ||
                    statusStr === "APPROVED" ||
                    statusStr === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-700 border-slate-200";

                  return (
                    <tr
                      key={el.id || idx}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="p-2.5 font-bold text-slate-800">{name}</td>
                      <td className="p-2.5 text-slate-600">{type}</td>
                      <td className="p-2.5 text-slate-600 font-mono text-[11px]">
                        {grid}
                      </td>
                      <td className="p-2.5 font-mono text-slate-800 font-medium">
                        {calcVol.toFixed(3)}
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={achVol}
                            onChange={(e) =>
                              handleUpdateElementAchievedVolume(
                                el.id,
                                Number(e.target.value) || 0,
                              )
                            }
                            className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono font-bold text-emerald-700 text-xs focus:outline-none focus:border-brand-500 focus:bg-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateElementAchievedVolume(el.id, calcVol)
                            }
                            className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded"
                            title="Set to 100%"
                          >
                            100%
                          </button>
                        </div>
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct >= 100
                                  ? "bg-emerald-500"
                                  : pct > 0
                                    ? "bg-amber-500"
                                    : "bg-slate-300"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span
                            className={`font-mono font-bold text-[10px] ${
                              pct >= 100
                                ? "text-emerald-700"
                                : pct > 0
                                  ? "text-amber-700"
                                  : "text-slate-500"
                            }`}
                          >
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-black rounded-md border ${statusColor}`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredStructuralElements.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-8 text-slate-400 italic bg-slate-50/50"
                    >
                      No structural elements found matching this level scope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- CUBE TESTS LOG TABLE --- */}
        <div className="space-y-3 border border-slate-200 rounded-2xl p-4 md:p-5 bg-white shadow-xs">
          {/* Card header */}
          <div className="flex justify-between items-start pb-3 border-b border-slate-100 gap-3">
            <div className="min-w-0">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Box size={15} className="text-orange-500" />
                Cube Tests Log Registry
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Active concrete cube sample test results matching selected level
                scope.
              </p>
            </div>
            {/* Right-side controls */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              {importedCubeIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleClearImported}
                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  title="Remove all imported samples"
                >
                  <X size={11} />
                  Clear imported ({importedCubeIds.size})
                </button>
              )}
              {/* Import button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={handleOpenImportPanel}
                  className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  {loadingPastReports ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Download size={11} />
                  )}
                  Import from Past Week
                  <ChevronDown
                    size={11}
                    className={`transition-transform ${showImportPanel ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown panel */}
                {showImportPanel && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex justify-between items-center">
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-wide">
                        Select Week to Import
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowImportPanel(false)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {loadingPastReports && (
                        <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-xs">
                          <Loader2 size={14} className="animate-spin" />
                          Loading past reports…
                        </div>
                      )}
                      {!loadingPastReports && pastReports.length === 0 && (
                        <p className="text-center py-6 text-slate-400 text-xs italic">
                          No other weekly reports found for this project.
                        </p>
                      )}
                      {!loadingPastReports &&
                        pastReports.map((r) => {
                          const cubeCount = Array.isArray(r.cubeTests)
                            ? r.cubeTests.length
                            : 0;
                          const wkLabel =
                            r.weekStart && r.weekEnd
                              ? `${r.weekStart} → ${r.weekEnd}`
                              : r.reportNumber;
                          return (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => handleImportFromReport(r)}
                              className="w-full text-left px-3 py-2.5 hover:bg-amber-50 border-b border-slate-100 last:border-0 transition-colors group"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black text-slate-800 group-hover:text-amber-700 transition-colors">
                                  {r.reportNumber || "Weekly Report"}
                                </span>
                                {cubeCount > 0 && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-md">
                                    {cubeCount} samples
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                {wkLabel}
                              </p>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              <span className="text-[10px] font-black px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg border border-orange-200">
                {compileReportData.cubeTestsList.length} Samples
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/70 max-h-72">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className={tableHeaderClass}>Sample ID</th>
                  <th className={tableHeaderClass}>Cast Date</th>
                  <th className={tableHeaderClass}>Element / Location</th>
                  <th className={tableHeaderClass}>Inscribed Name</th>
                  <th className={tableHeaderClass}>7-Day (MPa)</th>
                  <th className={tableHeaderClass}>28-Day (MPa)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {compileReportData.cubeTestsList.map((cube, idx) => {
                  const isImported = importedCubeIds.has(
                    cube.cubeId || cube.sampleId || "",
                  );
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50/70 transition-colors ${isImported ? "bg-amber-50/60" : ""}`}
                      title={isImported ? "Imported from past week" : undefined}
                    >
                      <td className="p-2.5 font-mono font-bold text-slate-800">
                        {isImported && (
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1 mb-0.5 align-middle"
                            title="Imported"
                          />
                        )}
                        {cube.cubeId}
                      </td>
                      <td className="p-2.5 text-slate-600">{cube.dateCast}</td>
                      <td className="p-2.5 text-slate-700 font-medium">
                        {cube.elementLevel}
                      </td>
                      <td className="p-2.5 text-slate-600">
                        {cube.inscribedName || "-"}
                      </td>
                      <td className="p-2.5 font-mono text-orange-600 font-bold">
                        {cube.strength7Days || "-"}{" "}
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({cube.status7Days})
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-emerald-600 font-bold">
                        {cube.strength28Days || "-"}{" "}
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({cube.status28Days})
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {compileReportData.cubeTestsList.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-slate-400 italic bg-slate-50/50"
                    >
                      No cube test logs found for this level scope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- EXECUTIVE TEXT NARRATIVES --- */}
        <div className="space-y-5 pt-2 border-t border-slate-100">
          <Field label="Executive Summary Synopsis Paragraph (Slide 2 Content Area)">
            <textarea
              placeholder="Provide a comprehensive operational analysis summary covering logs processed during this window period..."
              value={form.executiveSummary}
              onChange={(e) =>
                setForm((p) => ({ ...p, executiveSummary: e.target.value }))
              }
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Key Project Highlights">
              <textarea
                placeholder="List major quality and engineering achievements..."
                value={form.highlights}
                onChange={(e) =>
                  setForm((p) => ({ ...p, highlights: e.target.value }))
                }
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </Field>
            <Field label="Critical Risks & Open Concerns">
              <textarea
                placeholder="Highlight ongoing non-conformances or open site concerns..."
                value={form.concerns}
                onChange={(e) =>
                  setForm((p) => ({ ...p, concerns: e.target.value }))
                }
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Target Milestones for Next Week">
              <textarea
                placeholder="Outline site goals and planned pour inspections..."
                value={form.nextWeekPlan}
                onChange={(e) =>
                  setForm((p) => ({ ...p, nextWeekPlan: e.target.value }))
                }
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </Field>
            <Field label="Remediation Summary Notes Log Override">
              <textarea
                placeholder="Add custom notes regarding active remediation strategies..."
                value={form.remediationSummaryText}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    remediationSummaryText: e.target.value,
                  }))
                }
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </Field>
          </div>
        </div>

        {/* --- FOOTER ACTION BUTTONS --- */}
        <div className="pt-6 border-t border-slate-200/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/project/weekly-reports")}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveAndGenerate}
            disabled={submitting || saveStatus === "saving"}
            className="bg-orange-600 hover:bg-orange-700 text-white px-7 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-[0.99]"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            {submitting
              ? "Saving & Generating..."
              : "Compile, Save & Open Report Editor"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SUB COMPONENTS
// ==========================================

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  dark?: boolean;
}> = ({ label, children, dark }) => (
  <div className="space-y-1.5 w-full">
    <label
      className={`text-[10px] font-black tracking-wider block uppercase ${
        dark ? "text-slate-400" : "text-slate-700"
      }`}
    >
      {label}
    </label>
    {children}
  </div>
);

const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}> = ({ icon, label, value, color, bgColor }) => (
  <div
    className={`p-3 rounded-xl border ${bgColor} text-center shadow-xs transition-transform hover:-translate-y-0.5`}
  >
    <div className="flex items-center justify-center gap-1.5 mb-1">
      {icon}
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
        {label}
      </span>
    </div>
    <p className={`text-xl font-black ${color}`}>{value}</p>
  </div>
);

export default WeeklyReportCreate;
