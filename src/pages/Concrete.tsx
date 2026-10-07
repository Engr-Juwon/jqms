import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService, sortByNewestFirst } from "@/lib/db";
import { ConcreteCubeSample, ProjectLevel } from "@/types";
import {
  generateCubeTestPDF,
  generateConcreteRegisterReport,
} from "@/lib/pdfGenerators";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import { toast } from "react-hot-toast";
import {
  FlaskConical,
  Plus,
  Search,
  ChevronRight,
  AlertOctagon,
  Edit2,
  X,
  Save,
  Printer,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  ShieldCheck,
  TrendingUp,
  Tag,
  Trash2,
  FileText,
  Filter,
  Table,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  Download,
} from "lucide-react";

export interface ConcreteTestResultItem {
  age: number;
  label: string; // e.g. "3 days", "1 day", "7 days", "14 days", "24 days", "28 days", "56 days"
  strength: number; // e.g. 24.0
  formattedText: string; // e.g. "24.0 MPa (3 days)"
  targetStrength: number; // Target strength for this age
  percentOfTarget: number; // % of target
  status: "PASS" | "FAIL";
  testDate?: string;
  source: string;
}

/**
 * Extracts all recorded compressive strength test results across any available age
 * (1, 3, 7, 14, 24, 28, 56 days, etc.) for a concrete sample.
 */
export function extractAllTestResults(cube: ConcreteCubeSample): {
  results: ConcreteTestResultItem[];
  pendingAges: number[];
  latestResult: ConcreteTestResultItem | null;
  overallPassed: boolean | null;
} {
  const results: ConcreteTestResultItem[] = [];
  const pendingAges: number[] = [];

  const target28 =
    cube.target28DayStrengthNmm2 ||
    cube.day28Required ||
    (cube.targetStrength ? parseFloat(cube.targetStrength) : 0) ||
    30;

  // Collect all possible ages for this cube
  const candidateAges = new Set<number>([1, 3, 7, 14, 24, 28, 56]);
  if (Array.isArray(cube.testAges)) {
    cube.testAges.forEach((a) => {
      const num = Number(a);
      if (!isNaN(num) && num > 0) candidateAges.add(num);
    });
  }
  if (Array.isArray(cube.cubes)) {
    cube.cubes.forEach((c: any) => {
      if (c?.age || c?.targetAge) {
        const num = Number(c.age || c.targetAge);
        if (!isNaN(num) && num > 0) candidateAges.add(num);
      }
    });
  }

  const sortedAges = Array.from(candidateAges).sort((a, b) => a - b);

  for (const age of sortedAges) {
    let strength: number | null = null;
    let testDate: string | undefined = undefined;
    let statusOverride: string | undefined = undefined;
    let source = "";

    // 1. Check day<Age>Results array
    const dayKey = `day${age}Results` as keyof ConcreteCubeSample;
    const dayArray = cube[dayKey] as any[];
    if (Array.isArray(dayArray) && dayArray.length > 0) {
      const entry = dayArray[0];
      const val = entry.averageStrength ?? entry.strength;
      if (val != null && !isNaN(parseFloat(val))) {
        strength = parseFloat(val);
        testDate = entry.testDate;
        statusOverride = entry.status;
        source = `day${age}Results`;
      }
    }

    // 2. Check cube.tests.day<Age>
    if (strength == null && cube.tests) {
      const testSummary = (cube.tests as any)?.[`day${age}`];
      if (testSummary) {
        const val =
          testSummary.averageStrengthNmm2 ??
          testSummary.compressiveStrengthNmm2 ??
          testSummary.averageStrength;
        if (val != null && !isNaN(parseFloat(val))) {
          strength = parseFloat(val);
          testDate = testSummary.testDate;
          statusOverride = testSummary.status;
          source = `tests.day${age}`;
        }
      }
    }

    // 3. Check individual cube specimens in cube.cubes
    if (strength == null && Array.isArray(cube.cubes)) {
      const matching = (cube.cubes as any[]).filter(
        (c) =>
          Number(c?.age || c?.targetAge) === age &&
          (c?.strength != null || c?.compressiveStrength != null || c?.compressiveStrengthNmm2 != null) &&
          !isNaN(parseFloat(c.strength ?? c.compressiveStrength ?? c.compressiveStrengthNmm2)),
      );
      if (matching.length > 0) {
        const sum = matching.reduce(
          (acc, c) => acc + parseFloat(c.strength ?? c.compressiveStrength ?? c.compressiveStrengthNmm2),
          0,
        );
        strength = Math.round((sum / matching.length) * 10) / 10;
        source = "cubes_array";
      }
    }

    // 4. Legacy fields
    if (strength == null && age === 7 && cube.strength7Days) {
      const p = parseFloat(cube.strength7Days);
      if (!isNaN(p)) {
        strength = p;
        statusOverride = cube.status7Days;
      }
    }
    if (strength == null && age === 28 && cube.strength28Days) {
      const p = parseFloat(cube.strength28Days);
      if (!isNaN(p)) {
        strength = p;
        statusOverride = cube.status28Days;
      }
    }

    // Target calculation for this age
    let target = target28;
    if (age === 1)
      target = cube.day1Required || Math.round(target28 * 0.3 * 10) / 10;
    else if (age === 3)
      target = cube.day3Required || Math.round(target28 * 0.5 * 10) / 10;
    else if (age === 7)
      target = cube.day7Required || Math.round(target28 * 0.7 * 10) / 10;
    else if (age === 14)
      target = cube.day14Required || Math.round(target28 * 0.85 * 10) / 10;
    else if (age === 24) target = Math.round(target28 * 0.95 * 10) / 10;
    else if (age === 28) target = cube.day28Required || target28;
    else if (age === 56) target = Math.round(target28 * 1.1 * 10) / 10;

    if (strength != null) {
      const isPass =
        statusOverride === "PASS"
          ? true
          : statusOverride === "FAIL"
            ? false
            : strength >= target;
      const pct = target > 0 ? Math.round((strength / target) * 100) : 100;
      const ageLabel = age === 1 ? "1 day" : `${age} days`;

      results.push({
        age,
        label: ageLabel,
        strength,
        formattedText: `${strength} MPa (${ageLabel})`,
        targetStrength: target,
        percentOfTarget: pct,
        status: isPass ? "PASS" : "FAIL",
        testDate,
        source,
      });
    } else if (
      Array.isArray(cube.testAges) &&
      cube.testAges.includes(age as any)
    ) {
      pendingAges.push(age);
    }
  }

  const latestResult = results.length > 0 ? results[results.length - 1] : null;

  let overallPassed: boolean | null = null;
  if (results.some((r) => r.status === "FAIL")) {
    overallPassed = false;
  } else if (results.some((r) => r.age >= 28 && r.status === "PASS")) {
    overallPassed = true;
  } else if (results.length > 0) {
    overallPassed = results.every((r) => r.status === "PASS");
  }

  return { results, pendingAges, latestResult, overallPassed };
}

export const Concrete: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject, projects, setActiveProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentProjId =
    activeProject?.id ||
    projectId ||
    localStorage.getItem("jqms_active_project_id") ||
    localStorage.getItem("currentProjectId") ||
    projects[0]?.id ||
    "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";
  const canCreateSample =
    !currentUser ||
    !currentUser.role ||
    hasPermission(currentUser?.role, "CREATE_CONCRETE_SAMPLE");
  const canDeleteCube =
    !currentUser ||
    !currentUser.role ||
    hasPermission(currentUser?.role, "DELETE_CONCRETE_RECORD") ||
    Boolean(currentUser);

  // Synchronize active project if not set
  useEffect(() => {
    if (!activeProject && currentProjId && projects.length > 0) {
      const match = projects.find((p) => p.id === currentProjId);
      if (match) setActiveProject(match);
    }
  }, [activeProject, currentProjId, projects, setActiveProject]);

  const [cubes, setCubes] = useState<ConcreteCubeSample[]>([]);
  const [projectLevels, setProjectLevels] = useState<ProjectLevel[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState("ALL");
  const [testAgeFilter, setTestAgeFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"RESULTS_TABLE" | "STANDARD_REGISTER">("RESULTS_TABLE");
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [modalPrintLevel, setModalPrintLevel] = useState("ALL");
  const [editingCube, setEditingCube] = useState<ConcreteCubeSample | null>(
    null,
  );

  const loadData = async () => {
    if (!currentProjId) return;
    const [list, levels] = await Promise.all([
      dbService.getCubeSamples(currentProjId, currentCompId),
      dbService.getLevels(currentProjId, currentCompId).catch(() => []),
    ]);
    setCubes(sortByNewestFirst(list));
    setProjectLevels(levels);
  };

  useEffect(() => {
    loadData();
  }, [currentProjId, currentCompId]);

  const handleUpdateCube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCube) return;

    // Recalculate scheduled test dates if castDate is modified
    let day1Date = editingCube.day1Date;
    let day3Date = editingCube.day3Date;
    let day7Date = editingCube.day7Date;
    let day14Date = editingCube.day14Date;
    let day28Date = editingCube.day28Date;

    const targetCastDate = editingCube.castDate || "";
    if (targetCastDate) {
      const castDateObj = new Date(targetCastDate);
      if (!isNaN(castDateObj.getTime())) {
        const testAges = editingCube.testAges || [7, 28];
        if (testAges.includes(1)) {
          day1Date = new Date(castDateObj.getTime() + 1 * 86400000).toISOString().split("T")[0];
        }
        if (testAges.includes(3)) {
          day3Date = new Date(castDateObj.getTime() + 3 * 86400000).toISOString().split("T")[0];
        }
        if (testAges.includes(7)) {
          day7Date = new Date(castDateObj.getTime() + 7 * 86400000).toISOString().split("T")[0];
        }
        if (testAges.includes(14)) {
          day14Date = new Date(castDateObj.getTime() + 14 * 86400000).toISOString().split("T")[0];
        }
        if (testAges.includes(28)) {
          day28Date = new Date(castDateObj.getTime() + 28 * 86400000).toISOString().split("T")[0];
        }
      }
    }

    const updated: ConcreteCubeSample = {
      ...editingCube,
      castDate: targetCastDate,
      day1Date,
      day3Date,
      day7Date,
      day14Date,
      day28Date,
      updatedAt: Date.now(),
    };

    await dbService.saveCubeSample(updated);
    setEditingCube(null);
    toast.success("Concrete record updated successfully");
    await loadData();
  };

  const handleDeleteCube = async (cubeToDelete: ConcreteCubeSample) => {
    if (!canDeleteCube) {
      toast.error(
        "Permission Denied: You do not have permission to delete concrete test records.",
      );
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete concrete sample "${cubeToDelete.sampleId}"? This action cannot be undone and will also remove any linked Non-Conformance Report.`,
    );
    if (!confirmDelete) return;

    // Optimistic UI removal
    setCubes((prev) =>
      prev.filter(
        (c) =>
          c.id !== cubeToDelete.id &&
          c.sampleId !== cubeToDelete.sampleId &&
          c.id !== cubeToDelete.sampleId,
      ),
    );
    if (editingCube?.id === cubeToDelete.id) {
      setEditingCube(null);
    }

    const effectiveProjId =
      cubeToDelete.projectId || currentProjId || activeProject?.id || "";

    const ncrIdToDelete =
      cubeToDelete.ncrDetails?.ncrId || cubeToDelete.ncrNumber;
    if (ncrIdToDelete) {
      try {
        await dbService.deleteNCR(ncrIdToDelete, effectiveProjId);
      } catch (err) {
        console.error("Failed to delete linked NCR:", err);
      }
    }

    try {
      await dbService.deleteCubeSample(cubeToDelete.id, effectiveProjId);
      if (cubeToDelete.sampleId && cubeToDelete.sampleId !== cubeToDelete.id) {
        await dbService.deleteCubeSample(
          cubeToDelete.sampleId,
          effectiveProjId,
        );
      }
    } catch (err) {
      console.error("Failed to delete cube sample:", err);
    }

    if (currentUser) {
      try {
        await writeAudit({
          projectId: effectiveProjId,
          companyId: currentCompId,
          userId: currentUser.uid,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          action: "DELETE_CUBE_SAMPLE",
          module: "Concrete",
          details: `Deleted concrete cube sample ${cubeToDelete.sampleId} (${cubeToDelete.structureElement || cubeToDelete.elementName})`,
        });
      } catch (auditErr) {
        console.warn("Non-fatal: failed to write audit log:", auditErr);
      }
    }

    toast.success(`Concrete specimen ${cubeToDelete.sampleId} deleted`);
    await loadData();
  };

  // Extract all distinct levels from samples and projectLevels
  const availableLevels = useMemo(() => {
    const set = new Set<string>();
    projectLevels.forEach((l) => {
      if (l.name) set.add(l.name.trim());
    });
    cubes.forEach((c) => {
      if (c.level) set.add(c.level.trim());
      if (c.levelName) set.add(c.levelName.trim());
    });
    return Array.from(set)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [cubes, projectLevels]);

  const handlePrintLevelReport = (levelName: string) => {
    let targetCubes = cubes;
    let label = "All Levels";
    if (levelName !== "ALL") {
      targetCubes = cubes.filter(
        (c) =>
          (c.level || c.levelName || "").toLowerCase().trim() ===
          levelName.toLowerCase().trim(),
      );
      label = levelName;
    }
    if (targetCubes.length === 0) {
      toast.error(`No concrete specimens found for ${label}`);
      return;
    }
    generateConcreteRegisterReport(
      targetCubes,
      label,
      activeProject || {},
      company || {},
    );
    setShowPrintModal(false);
  };

  // KPI Calculations
  const totalSamples = cubes.length;
  const approvedSamples = cubes.filter(
    (c) => c.status === "APPROVED" || c.status === "28-DAY DONE",
  ).length;
  const ncrSamples = cubes.filter(
    (c) =>
      c.status === "NCR_ISSUED" || c.status === "REJECTED" || c.ncrGenerated,
  ).length;
  const curingSamples = cubes.filter(
    (c) => c.status === "CURING" || c.status === "PENDING",
  ).length;

  const tested28Count = cubes.filter(
    (c) =>
      (c.day28Results && c.day28Results.length > 0) ||
      c.tests?.day28?.averageStrengthNmm2,
  ).length;
  const passed28Count = cubes.filter((c) => {
    const res28 =
      c.day28Results?.[0]?.averageStrength ||
      c.tests?.day28?.averageStrengthNmm2;
    const target = c.target28DayStrengthNmm2 || c.day28Required || 30;
    return res28 && res28 >= target;
  }).length;
  const complianceRate =
    tested28Count > 0 ? Math.round((passed28Count / tested28Count) * 100) : 100;

  const filtered = sortByNewestFirst(
    cubes.filter((c) => {
      const matchesSearch =
        (c.sampleId &&
          c.sampleId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.inscribedName &&
          c.inscribedName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.elementName &&
          c.elementName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.structureElement &&
          c.structureElement
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (c.concreteGrade &&
          c.concreteGrade.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.supplier &&
          c.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.zone && c.zone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.pourReference &&
          c.pourReference.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.ITPReference &&
          c.ITPReference.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.ncrNumber &&
          c.ncrNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedLevelFilter !== "ALL") {
        const itemLvl = (c.level || c.levelName || "").toLowerCase().trim();
        if (itemLvl !== selectedLevelFilter.toLowerCase().trim()) return false;
      }

      if (testAgeFilter !== "ALL") {
        const { results } = extractAllTestResults(c);
        if (testAgeFilter === "PENDING") {
          if (results.length > 0) return false;
        } else {
          const targetAge = parseInt(testAgeFilter, 10);
          if (!results.some((r) => r.age === targetAge)) return false;
        }
      }

      if (statusFilter === "ALL") return true;
      if (statusFilter === "APPROVED")
        return c.status === "APPROVED" || c.status === "28-DAY DONE";
      if (statusFilter === "CURING")
        return c.status === "CURING" || c.status === "PENDING";
      if (statusFilter === "7-DAY")
        return (
          c.status === "7-DAY DONE" ||
          (c.day7Results && c.day7Results.length > 0)
        );
      if (statusFilter === "28-DAY")
        return (
          c.status === "28-DAY DONE" ||
          (c.day28Results && c.day28Results.length > 0)
        );
      if (statusFilter === "NCR")
        return (
          c.status === "NCR_ISSUED" || c.status === "REJECTED" || c.ncrGenerated
        );
      return true;
    }),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-xs uppercase tracking-wider mb-1">
            <FlaskConical className="w-4 h-4" />
            <span>BS EN 12390-3 / ASTM C39 Concrete Quality Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Concrete Cube Crushing Register
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Laboratory compression strength testing, specimen curing tracking &
            non-destructive compliance verification
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setModalPrintLevel(
                selectedLevelFilter !== "ALL" ? selectedLevelFilter : "ALL",
              );
              setShowPrintModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm transition"
          >
            <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Print Reports by Level</span>
          </button>

          {canCreateSample ? (
            <Link
              to={`/project/${currentProjId}/concrete/sample`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Log New Concrete Sample</span>
            </Link>
          ) : (
            <button
              disabled
              title="You do not have permission to register concrete samples"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold cursor-not-allowed opacity-60"
            >
              <Plus className="w-4 h-4" />
              <span>Log New Concrete Sample</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500 font-bold">
              Total Samples
            </span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalSamples}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Logged across site pours
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-sky-600 dark:text-sky-400 font-bold">
              In Curing
            </span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">
            {curingSamples}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Awaiting crushing age
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-bold">
              28D Compliance
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {complianceRate}%
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {passed28Count}/{tested28Count} tests passed
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-bold">
              Approved
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {approvedSamples}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Full 28d certificate ready
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-red-600 dark:text-red-400 font-bold">
              NCR / Defective
            </span>
            <AlertOctagon className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 font-mono">
            {ncrSamples}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Requires core test / review
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/80 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("RESULTS_TABLE")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              viewMode === "RESULTS_TABLE"
                ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Table className="w-4 h-4" />
            <span>All-Age Strength Results Table</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-mono">
              1, 3, 7, 14, 24, 28, 56d
            </span>
          </button>
          <button
            onClick={() => setViewMode("STANDARD_REGISTER")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
              viewMode === "STANDARD_REGISTER"
                ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Standard Quality Register</span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-2 text-xs text-slate-500 dark:text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] font-medium">
            {viewMode === "RESULTS_TABLE"
              ? "All available test intervals (1d, 3d, 7d, 14d, 24d, 28d, 56d) dynamically displayed in-line"
              : "Standard 7-Day & 28-Day crushing strength format"}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sample ID, inscribed mark, element, grade, PTP, supplier..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Level Filter Dropdown */}
            {availableLevels.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] font-semibold text-slate-500">
                  Level:
                </span>
                <select
                  value={selectedLevelFilter}
                  onChange={(e) => setSelectedLevelFilter(e.target.value)}
                  className="bg-transparent text-slate-900 dark:text-white font-bold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="ALL" className="dark:bg-slate-900">
                    All Levels ({cubes.length})
                  </option>
                  {availableLevels.map((lvl) => {
                    const count = cubes.filter(
                      (c) =>
                        (c.level || c.levelName || "").toLowerCase().trim() ===
                        lvl.toLowerCase().trim(),
                    ).length;
                    return (
                      <option
                        key={lvl}
                        value={lvl}
                        className="dark:bg-slate-900"
                      >
                        {lvl} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "ALL", label: "All Statuses" },
                { id: "CURING", label: "In Curing" },
                { id: "7-DAY", label: "7-Day Done" },
                { id: "28-DAY", label: "28-Day Done" },
                { id: "APPROVED", label: "Approved" },
                { id: "NCR", label: "NCR / Defect" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    statusFilter === tab.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Age Filter Bar for Results Table View */}
        {viewMode === "RESULTS_TABLE" && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
              <Filter className="w-3 h-3 text-emerald-500" />
              <span>Age Filter:</span>
            </span>
            {[
              { id: "ALL", label: "All Tested Ages" },
              { id: "1", label: "1-Day (24h)" },
              { id: "3", label: "3-Day" },
              { id: "7", label: "7-Day" },
              { id: "14", label: "14-Day" },
              { id: "24", label: "24-Day" },
              { id: "28", label: "28-Day" },
              { id: "56", label: "56-Day" },
              { id: "PENDING", label: "In Curing Only" },
            ].map((ageTab) => (
              <button
                key={ageTab.id}
                onClick={() => setTestAgeFilter(ageTab.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition whitespace-nowrap ${
                  testAgeFilter === ageTab.id
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800"
                }`}
              >
                {ageTab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Print Level Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Print Concrete Quality Reports
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Generate ISO 9001 / BS EN 12390 Compliance Registers
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Floor / Level Scope:
              </label>
              <select
                value={modalPrintLevel}
                onChange={(e) => setModalPrintLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">
                  All Levels — Comprehensive Site Register ({cubes.length}{" "}
                  specimens)
                </option>
                {availableLevels.map((lvl) => {
                  const count = cubes.filter(
                    (c) =>
                      (c.level || c.levelName || "").toLowerCase().trim() ===
                      lvl.toLowerCase().trim(),
                  ).length;
                  return (
                    <option key={lvl} value={lvl}>
                      {lvl} ({count} specimens)
                    </option>
                  );
                })}
              </select>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Selected Level Scope:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {modalPrintLevel === "ALL"
                      ? "All Site Levels"
                      : modalPrintLevel}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Specimens in Register:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {modalPrintLevel === "ALL"
                      ? cubes.length
                      : cubes.filter(
                          (c) =>
                            (c.level || c.levelName || "")
                              .toLowerCase()
                              .trim() === modalPrintLevel.toLowerCase().trim(),
                        ).length}{" "}
                    Samples
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handlePrintLevelReport(modalPrintLevel)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Generate & Print Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALL-AGE RESULTS TABLE VIEW */}
      {viewMode === "RESULTS_TABLE" ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Sample ID & Mark</th>
                  <th className="py-3.5 px-4">Structural Element & Location</th>
                  <th className="py-3.5 px-4">Grade & Target</th>
                  <th className="py-3.5 px-4">Cast Date</th>
                  <th className="py-3.5 px-4">Fresh Props / Slump</th>
                  {/* CRITICAL: Header does NOT show specific days, it displays generic Compressive Strength Results */}
                  <th className="py-3.5 px-4 min-w-[260px]">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Compressive Strength Results</span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Target Achievement</th>
                  <th className="py-3.5 px-4">Status / NCR</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-12 text-center text-slate-500 dark:text-slate-400"
                    >
                      <FlaskConical className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-60" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        No concrete cube samples found
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Try adjusting your search terms or age filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((cube) => {
                    const target28 =
                      cube.target28DayStrengthNmm2 ||
                      cube.day28Required ||
                      (cube.targetStrength
                        ? parseFloat(cube.targetStrength)
                        : 0) ||
                      30;

                    const { results, pendingAges, latestResult, overallPassed } =
                      extractAllTestResults(cube);

                    const highestStrength = results.length > 0
                      ? Math.max(...results.map((r) => r.strength))
                      : 0;
                    const achievementPct = target28 > 0
                      ? Math.min(Math.round((highestStrength / target28) * 100), 200)
                      : 0;

                    return (
                      <tr
                        key={cube.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                      >
                        {/* Sample ID & Mark */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <Link
                              to={`/project/${currentProjId}/concrete/${cube.id}`}
                              className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              {cube.sampleId}
                            </Link>
                            {cube.inscribedName && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[9px] font-mono font-bold text-amber-700 dark:text-amber-400">
                                {cube.inscribedName}
                              </span>
                            )}
                          </div>
                          {cube.pourReference && (
                            <div className="text-[10px] font-mono text-slate-400">
                              PTP: {cube.pourReference}
                            </div>
                          )}
                        </td>

                        {/* Structural Element & Location */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {cube.structureElement || cube.elementName}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">
                            {[cube.level || cube.levelName, cube.zone]
                              .filter(Boolean)
                              .join(" • ")}
                          </div>
                        </td>

                        {/* Grade & Target */}
                        <td className="py-3 px-4 font-mono">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {cube.concreteGrade}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Target: {target28} MPa
                          </div>
                        </td>

                        {/* Cast Date */}
                        <td className="py-3 px-4">
                          <div className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                            {cube.castDate}
                          </div>
                          {cube.castTime && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {cube.castTime}
                            </div>
                          )}
                        </td>

                        {/* Fresh Props / Slump */}
                        <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                          <div>
                            {cube.slumpResult || cube.slumpMm || "120"} mm
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[110px]">
                            {cube.supplier || "ReadyMix"}
                          </div>
                        </td>

                        {/* COMPRESSIVE STRENGTH RESULTS — EXACT FORMAT: "24.0 MPa (3 days)" */}
                        <td className="py-3 px-4">
                          {results.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {results.map((res) => {
                                const isPass = res.status === "PASS";
                                return (
                                  <div
                                    key={res.age}
                                    title={`Age: ${res.label} • Tested: ${res.strength} MPa (Target: ${res.targetStrength} MPa = ${res.percentOfTarget}%) ${res.testDate ? `• Date: ${res.testDate}` : ""}`}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition shadow-xs ${
                                      isPass
                                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400"
                                        : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:border-rose-400"
                                    }`}
                                  >
                                    {isPass ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    ) : (
                                      <AlertOctagon className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                    )}
                                    <span>
                                      {res.strength.toFixed(1)} MPa ({res.label})
                                    </span>
                                  </div>
                                );
                              })}

                              {pendingAges.length > 0 && (
                                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 italic">
                                  + {pendingAges.map((a) => `${a}D`).join(", ")} pending
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[11px] font-medium">
                              <Clock className="w-3 h-3 text-sky-500 animate-pulse shrink-0" />
                              <span>
                                In Curing{" "}
                                {pendingAges.length > 0
                                  ? `(Scheduled: ${pendingAges.map((a) => `${a}D`).join(", ")})`
                                  : ""}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Target Achievement */}
                        <td className="py-3 px-4">
                          {results.length > 0 ? (
                            <div className="w-28 space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className="text-slate-500 dark:text-slate-400">
                                  vs 28D:
                                </span>
                                <span
                                  className={`font-bold ${
                                    achievementPct >= 100
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : achievementPct >= 70
                                        ? "text-amber-600 dark:text-amber-400"
                                        : "text-slate-700 dark:text-slate-300"
                                  }`}
                                >
                                  {achievementPct}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    achievementPct >= 100
                                      ? "bg-emerald-500"
                                      : achievementPct >= 70
                                        ? "bg-amber-500"
                                        : "bg-sky-500"
                                  }`}
                                  style={{
                                    width: `${Math.min(achievementPct, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-400">
                              0% (Pending)
                            </span>
                          )}
                        </td>

                        {/* Status / NCR */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                cube.status === "APPROVED"
                                  ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30"
                                  : cube.status === "NCR_ISSUED" ||
                                      cube.status === "REJECTED"
                                    ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30"
                                    : "bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/30"
                              }`}
                            >
                              {cube.status}
                            </span>
                            {cube.ncrGenerated && cube.ncrNumber && (
                              <Link
                                to={`/project/${currentProjId}/ncrs/${cube.ncrDetails?.ncrId || cube.ncrNumber}`}
                                className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline"
                                title="View Non-Conformance Report"
                              >
                                <AlertOctagon className="w-3 h-3 shrink-0" />
                                {cube.ncrNumber}
                              </Link>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() =>
                                generateCubeTestPDF(
                                  cube,
                                  activeProject || {},
                                  company || {},
                                )
                              }
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Print Test Certificate"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingCube(cube)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Edit Sample Information"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCube(cube)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                              title="Delete Concrete Sample"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <Link
                              to={`/project/${currentProjId}/concrete/${cube.id}`}
                              className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-semibold text-[11px] transition"
                            >
                              <span>Crush Test</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* STANDARD REGISTER VIEW */
        <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Sample ID & Mark</th>
                  <th className="py-3.5 px-4">Structural Element</th>
                  <th className="py-3.5 px-4">Grade & Target</th>
                  <th className="py-3.5 px-4">Cast Date & Ages</th>
                  <th className="py-3.5 px-4">Slump & Fresh Props</th>
                  <th className="py-3.5 px-4">7-Day Strength</th>
                  <th className="py-3.5 px-4">28-Day Strength</th>
                  <th className="py-3.5 px-4">Status / NCR</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-12 text-center text-slate-500 dark:text-slate-400"
                    >
                      <FlaskConical className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-60" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        No concrete cube samples found
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Try adjusting your search terms or filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((cube) => {
                    const target28 =
                      cube.target28DayStrengthNmm2 ||
                      cube.day28Required ||
                      (cube.targetStrength
                        ? parseFloat(cube.targetStrength)
                        : 0) ||
                      30;
                    const target7 =
                      cube.day7Required || Math.round(target28 * 0.7 * 10) / 10;

                    // 7-day test extraction
                    const day7Res = cube.day7Results?.[0];
                    const day7Strength =
                      day7Res?.averageStrength ||
                      cube.tests?.day7?.averageStrengthNmm2 ||
                      cube.tests?.day7?.compressiveStrengthNmm2;
                    const day7Pass = day7Res
                      ? day7Res.status === "PASS"
                      : day7Strength != null
                        ? day7Strength >= target7
                        : null;

                    // 28-day test extraction
                    const day28Res = cube.day28Results?.[0];
                    const day28Strength =
                      day28Res?.averageStrength ||
                      cube.tests?.day28?.averageStrengthNmm2 ||
                      cube.tests?.day28?.compressiveStrengthNmm2;
                    const day28Pass = day28Res
                      ? day28Res.status === "PASS"
                      : day28Strength != null
                        ? day28Strength >= target28
                        : null;

                    return (
                      <tr
                        key={cube.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                      >
                        {/* Sample ID & Inscribed Mark */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <Link
                              to={`/project/${currentProjId}/concrete/${cube.id}`}
                              className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              {cube.sampleId}
                            </Link>
                            {cube.inscribedName && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[9px] font-mono font-bold text-amber-700 dark:text-amber-400">
                                {cube.inscribedName}
                              </span>
                            )}
                          </div>
                          {cube.pourReference && (
                            <div className="text-[10px] font-mono text-slate-400">
                              PTP: {cube.pourReference}
                            </div>
                          )}
                        </td>

                        {/* Structural Element & Location */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {cube.structureElement || cube.elementName}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">
                            {[cube.level || cube.levelName, cube.zone]
                              .filter(Boolean)
                              .join(" • ")}
                          </div>
                        </td>

                        {/* Grade & Target */}
                        <td className="py-3 px-4 font-mono">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {cube.concreteGrade}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Target: {target28} MPa ({cube.mixType || "Design Mix"})
                          </div>
                        </td>

                        {/* Cast Date & Ages */}
                        <td className="py-3 px-4">
                          <div className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                            {cube.castDate}
                          </div>
                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            {(cube.testAges || [7, 28]).map((age) => {
                              const resKey =
                                `day${age}Results` as keyof ConcreteCubeSample;
                              const res =
                                (cube[resKey] as any[])?.[0] ||
                                (cube.tests as any)?.[`day${age}`];
                              const hasVal =
                                res?.averageStrength || res?.averageStrengthNmm2;
                              return (
                                <span
                                  key={age}
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                                    hasVal
                                      ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                  }`}
                                  title={
                                    hasVal
                                      ? `${age}-Day: ${hasVal} MPa`
                                      : `${age}-Day Scheduled`
                                  }
                                >
                                  {age}D{hasVal ? ` (${hasVal}M)` : ""}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        {/* Slump & Fresh Properties */}
                        <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                          <div>
                            {cube.slumpResult || cube.slumpMm || "120"} mm
                          </div>
                          <div className="text-[10px] text-slate-400">
                            W/C: {cube.waterCementRatio || "0.40"} •{" "}
                            {cube.supplier || "ReadyMix"}
                          </div>
                        </td>

                        {/* 7-Day Strength */}
                        <td className="py-3 px-4 font-mono">
                          {day7Strength != null ? (
                            <div>
                              <span
                                className={`font-bold ${day7Pass ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                              >
                                {day7Strength} MPa
                              </span>
                              <div className="text-[10px] text-slate-400">
                                {Math.round((day7Strength / target7) * 100)}% (
                                {day7Pass ? "PASS" : "FAIL"})
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                              Pending (Target: {target7} MPa)
                            </span>
                          )}
                        </td>

                        {/* 28-Day Strength */}
                        <td className="py-3 px-4 font-mono">
                          {day28Strength != null ? (
                            <div>
                              <span
                                className={`font-bold ${day28Pass ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                              >
                                {day28Strength} MPa
                              </span>
                              <div className="text-[10px] text-slate-400">
                                {Math.round((day28Strength / target28) * 100)}% (
                                {day28Pass ? "PASS" : "FAIL"})
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                              Pending (Target: {target28} MPa)
                            </span>
                          )}
                        </td>

                        {/* Status / NCR */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                cube.status === "APPROVED"
                                  ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30"
                                  : cube.status === "NCR_ISSUED" ||
                                      cube.status === "REJECTED"
                                    ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30"
                                    : "bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/30"
                              }`}
                            >
                              {cube.status}
                            </span>
                            {cube.ncrGenerated && cube.ncrNumber && (
                              <Link
                                to={`/project/${currentProjId}/ncrs/${cube.ncrDetails?.ncrId || cube.ncrNumber}`}
                                className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline"
                                title="View Non-Conformance Report"
                              >
                                <AlertOctagon className="w-3 h-3 shrink-0" />
                                {cube.ncrNumber}
                              </Link>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() =>
                                generateCubeTestPDF(
                                  cube,
                                  activeProject || {},
                                  company || {},
                                )
                              }
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Print Test Certificate"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingCube(cube)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Edit Sample Information"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCube(cube)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                              title="Delete Concrete Sample"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <Link
                              to={`/project/${currentProjId}/concrete/${cube.id}`}
                              className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-semibold text-[11px] transition"
                            >
                              <span>Crush Test</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inline Quick Edit Drawer Modal */}
      {editingCube && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 space-y-4 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Edit Concrete Record</span>
              </h2>
              <button
                onClick={() => setEditingCube(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCube} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Sample ID *
                  </label>
                  <input
                    type="text"
                    value={editingCube.sampleId}
                    onChange={(e) =>
                      setEditingCube({
                        ...editingCube,
                        sampleId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Inscribed Mark
                  </label>
                  <input
                    type="text"
                    value={editingCube.inscribedName || ""}
                    onChange={(e) =>
                      setEditingCube({
                        ...editingCube,
                        inscribedName: e.target.value,
                      })
                    }
                    placeholder="e.g. S3"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Structural Element *
                </label>
                <input
                  type="text"
                  value={
                    editingCube.structureElement || editingCube.elementName
                  }
                  onChange={(e) =>
                    setEditingCube({
                      ...editingCube,
                      elementName: e.target.value,
                      structureElement: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Level
                  </label>
                  <input
                    type="text"
                    value={editingCube.level || editingCube.levelName || ""}
                    onChange={(e) =>
                      setEditingCube({
                        ...editingCube,
                        levelName: e.target.value,
                        level: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Zone / Grid
                  </label>
                  <input
                    type="text"
                    value={editingCube.zone || ""}
                    onChange={(e) =>
                      setEditingCube({ ...editingCube, zone: e.target.value })
                    }
                    placeholder="e.g. PILE CAPS 4, 5"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Cast Date (Pour Date) *
                  </label>
                  <input
                    type="date"
                    value={editingCube.castDate || ""}
                    onChange={(e) =>
                      setEditingCube({
                        ...editingCube,
                        castDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Cast Time
                  </label>
                  <input
                    type="time"
                    value={editingCube.castTime || ""}
                    onChange={(e) =>
                      setEditingCube({
                        ...editingCube,
                        castTime: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Grade *
                  </label>
                  <input
                    type="text"
                    value={editingCube.concreteGrade}
                    onChange={(e) =>
                      setEditingCube({
                        ...editingCube,
                        concreteGrade: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Target 28d Strength (MPa)
                  </label>
                  <input
                    type="number"
                    value={
                      editingCube.target28DayStrengthNmm2 ||
                      editingCube.day28Required ||
                      30
                    }
                    onChange={(e) =>
                      setEditingCube({
                        ...editingCube,
                        target28DayStrengthNmm2: Number(e.target.value),
                        day28Required: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Slump Result (mm)
                  </label>
                  <input
                    type="number"
                    value={
                      editingCube.slumpMm ||
                      (editingCube.slumpResult
                        ? parseFloat(editingCube.slumpResult)
                        : 120)
                    }
                    onChange={(e) =>
                      setEditingCube({
                        ...editingCube,
                        slumpMm: Number(e.target.value),
                        slumpResult: String(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    W/C Ratio
                  </label>
                  <input
                    type="text"
                    value={String(editingCube.waterCementRatio || "0.40")}
                    onChange={(e) =>
                      setEditingCube({
                        ...editingCube,
                        waterCementRatio: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={editingCube.supplier || ""}
                    onChange={(e) =>
                      setEditingCube({
                        ...editingCube,
                        supplier: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Pour Reference (PTP #)
                  </label>
                  <input
                    type="text"
                    value={editingCube.pourReference || ""}
                    onChange={(e) =>
                      setEditingCube({
                        ...editingCube,
                        pourReference: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Status
                </label>
                <select
                  value={editingCube.status}
                  onChange={(e) =>
                    setEditingCube({
                      ...editingCube,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CURING">CURING</option>
                  <option value="7-DAY DONE">7-DAY DONE</option>
                  <option value="28-DAY DONE">28-DAY DONE</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="NCR_ISSUED">NCR_ISSUED</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const toDel = editingCube;
                    handleDeleteCube(toDel);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold text-xs transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Sample</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCube(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
