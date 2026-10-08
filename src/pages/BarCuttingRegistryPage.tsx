import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService, sortByNewestFirst } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { BarCuttingSchedule, BBSItem } from "@/types";
import {
  Scissors,
  Upload,
  Plus,
  Search,
  Building2,
  Calendar,
  ChevronRight,
  Trash2,
  Merge,
  FileSpreadsheet,
  FileDown,
  Layers,
  ArrowRight,
  Printer,
  FlaskConical,
  Award,
  HardHat,
} from "lucide-react";
import { ModuleTabNav } from "@/components/common/ModuleTabNav";
import { BBSUploadModal } from "@/components/steel/BBSUploadModal";
import { CreateScheduleModal } from "@/components/steel/CreateScheduleModal";
import { Pagination } from "@/components/common/Pagination";
import {
  exportBarCuttingSchedulePDF,
  printBarCuttingSchedule,
  exportBarCuttingScheduleCSV,
} from "@/services/pdf/barCuttingReport";
import { optimizeBarCutting } from "@/lib/barCuttingOptimizer";
import { toast } from "react-hot-toast";

export const BarCuttingRegistryPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentCompId =
    currentUser?.companyId || company?.id || "comp-apex-civil";
  const currentProjId = projectId || activeProject?.id || "proj-skyline-tower";

  const [schedules, setSchedules] = useState<BarCuttingSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateScheduleModal, setShowCreateScheduleModal] = useState(false);

  // Load schedules
  const loadData = async () => {
    setIsLoading(true);
    try {
      const schedList = await dbService.getBarCuttingSchedules(
        currentProjId,
        currentCompId,
      );
      const sorted = sortByNewestFirst(schedList);
      setSchedules(sorted);
    } catch (e) {
      console.error("Error loading bar cutting schedules:", e);
      toast.error("Failed to load bar cutting schedules.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentProjId, currentCompId]);

  // Aggregate stats across all schedules in project
  const registryStats = useMemo(() => {
    let totalCutWeightKg = 0;
    let totalStockBars = 0;
    let totalScrapWeightKg = 0;
    let totalStockWeightKg = 0;
    let totalItems = 0;

    schedules.forEach((s) => {
      totalCutWeightKg += s.summary?.totalCutWeightKg || 0;
      totalStockBars += s.summary?.totalStockBarsUsed || 0;
      totalScrapWeightKg += s.summary?.totalScrapWeightKg || 0;
      totalStockWeightKg += s.summary?.totalStockWeightKg || 0;
      totalItems += s.bbsItems?.length || 0;
    });

    const avgScrapPct =
      totalStockWeightKg > 0
        ? Number(((totalScrapWeightKg / totalStockWeightKg) * 100).toFixed(2))
        : 0;

    return {
      totalSchedules: schedules.length,
      totalCutWeightTonnes: totalCutWeightKg / 1000,
      totalStockBars,
      avgScrapPct,
      totalItems,
    };
  }, [schedules]);

  // Distinct levels across schedules
  const availableLevels = useMemo(() => {
    const set = new Set<string>();
    schedules.forEach((s) => {
      if (s.levelName) set.add(s.levelName);
    });
    return Array.from(set);
  }, [schedules]);

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.scheduleNumber.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        (s.levelName && s.levelName.toLowerCase().includes(q)) ||
        (s.sourceBBSFileName &&
          s.sourceBBSFileName.toLowerCase().includes(q)) ||
        (s.heatNumber && s.heatNumber.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "ALL" || s.status === statusFilter;

      const matchesLevel =
        levelFilter === "ALL" || s.levelName === levelFilter;

      return matchesSearch && matchesStatus && matchesLevel;
    });
  }, [schedules, searchQuery, statusFilter, levelFilter]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, levelFilter]);

  // Paginated slice
  const paginatedSchedules = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSchedules.slice(start, start + pageSize);
  }, [filteredSchedules, currentPage, pageSize]);

  // Detail URL helper
  const getDetailUrl = (scheduleId: string) => {
    if (projectId) {
      return `/projects/${projectId}/steel/bar-cutting/${scheduleId}`;
    }
    return `/project/steel/bar-cutting/${scheduleId}`;
  };

  // 1. Create Brand New Schedule
  const handleCreateSchedule = async (data: {
    title: string;
    levelName: string;
    sourceBBSFileName?: string;
    heatNumber?: string;
    supplier?: string;
    contractualScrapLimit: number;
    initialMode: "EMPTY" | "SAMPLE" | "UPLOAD";
  }) => {
    const newScheduleNumber = `BCS-${new Date().getFullYear()}-${String(
      schedules.length + 1,
    ).padStart(3, "0")}`;

    let initialItems: BBSItem[] = [];
    if (data.initialMode === "SAMPLE") {
      initialItems = [
        {
          id: `item-${Date.now()}-1`,
          member: "Floor Beam 1B1 (Bottom Main)",
          barMark: "01",
          diameter: 20,
          shapeCode: "00 (Straight)",
          noOfMembers: 2,
          barsPerMember: 4,
          totalBars: 8,
          cutLengthM: 5.4,
          totalLengthM: 43.2,
          unitWeightKgM: 2.466,
          totalWeightKg: 106.5,
        },
        {
          id: `item-${Date.now()}-2`,
          member: "Floor Beam 1B1 (Top Main)",
          barMark: "02",
          diameter: 20,
          shapeCode: "00 (Straight)",
          noOfMembers: 2,
          barsPerMember: 4,
          totalBars: 8,
          cutLengthM: 6.2,
          totalLengthM: 49.6,
          unitWeightKgM: 2.466,
          totalWeightKg: 122.3,
        },
        {
          id: `item-${Date.now()}-3`,
          member: "Slab Bottom Mesh X-Dir",
          barMark: "17",
          diameter: 12,
          shapeCode: "00 (Straight)",
          noOfMembers: 1,
          barsPerMember: 124,
          totalBars: 124,
          cutLengthM: 5.1,
          totalLengthM: 632.4,
          unitWeightKgM: 0.888,
          totalWeightKg: 561.6,
        },
        {
          id: `item-${Date.now()}-4`,
          member: "Slab Bottom Mesh Y-Dir",
          barMark: "18",
          diameter: 12,
          shapeCode: "00 (Straight)",
          noOfMembers: 1,
          barsPerMember: 124,
          totalBars: 124,
          cutLengthM: 6.4,
          totalLengthM: 793.6,
          unitWeightKgM: 0.888,
          totalWeightKg: 704.7,
        },
      ];
    }

    const optResult = optimizeBarCutting(initialItems, {
      stockLengthM: 12.0,
      contractualScrapLimit: data.contractualScrapLimit,
    });

    const newSchedule: BarCuttingSchedule = {
      id: `bcs-${Date.now()}`,
      scheduleNumber: newScheduleNumber,
      title: data.title,
      projectId: currentProjId,
      companyId: currentCompId,
      levelName: data.levelName,
      status: initialItems.length > 0 ? "OPTIMIZED" : "DRAFT",
      diameterMm: initialItems[0]?.diameter || 16,
      steelGrade: "Grade 500B",
      stockBarLengthM: 12.0,
      sourceBBSFileName: data.sourceBBSFileName || "BBS-Manual.pdf",
      heatNumber: data.heatNumber || "HT-MILL-DEFAULT",
      supplier: data.supplier || "Emirates Steel",
      bbsItems: initialItems,
      cuttingPatterns: optResult.patterns,
      summary: optResult.summary,
      qaVerification: {
        cuttingToleranceChecked: false,
        endCutSquarenessChecked: false,
        couplerPrepVerified: false,
        approvalStatus: "PENDING",
      },
      createdBy: currentUser?.fullName || "Site QA Engineer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveBarCuttingSchedule(newSchedule);
    setSchedules((prev) => [newSchedule, ...prev]);

    await writeAudit({
      action: "CREATE",
      module: "STEEL_REBAR",
      details: `Created Bar Cutting Order "${newSchedule.title}" (${newSchedule.scheduleNumber}) for ${newSchedule.levelName}`,
      targetId: newSchedule.id,
      projectId: currentProjId,
      companyId: currentCompId,
      userId: currentUser?.uid || "sys",
      userName: currentUser?.fullName || "Site QA Engineer",
      userRole: currentUser?.role || "QA Engineer",
    });

    toast.success(`Created schedule ${newScheduleNumber}!`);

    if (data.initialMode === "UPLOAD") {
      setShowUploadModal(true);
    } else {
      navigate(getDetailUrl(newSchedule.id));
    }
  };

  // 2. Upload BBS to New Schedule
  const handleUploadBBSItems = async (items: BBSItem[]) => {
    const newScheduleNumber = `BCS-${new Date().getFullYear()}-${String(
      schedules.length + 1,
    ).padStart(3, "0")}`;

    const optResult = optimizeBarCutting(items, {
      stockLengthM: 12.0,
      contractualScrapLimit: 3.5,
    });

    const newSchedule: BarCuttingSchedule = {
      id: `bcs-${Date.now()}`,
      scheduleNumber: newScheduleNumber,
      title: `Imported BBS - ${items[0]?.member || "Reinforcement Package"}`,
      projectId: currentProjId,
      companyId: currentCompId,
      levelName: "Level 1 Slab & Beams",
      status: "OPTIMIZED",
      diameterMm: items[0]?.diameter || 16,
      steelGrade: "Grade 500B",
      stockBarLengthM: 12.0,
      sourceBBSFileName: "Uploaded-BBS.pdf",
      heatNumber: "HT-99412-A",
      supplier: "Emirates Steel",
      bbsItems: items,
      cuttingPatterns: optResult.patterns,
      summary: optResult.summary,
      qaVerification: {
        cuttingToleranceChecked: false,
        endCutSquarenessChecked: false,
        couplerPrepVerified: false,
        approvalStatus: "PENDING",
      },
      createdBy: currentUser?.fullName || "QA Engineer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveBarCuttingSchedule(newSchedule);
    setSchedules((prev) => [newSchedule, ...prev]);

    toast.success(`Imported ${items.length} line items into ${newScheduleNumber}`);
    navigate(getDetailUrl(newSchedule.id));
  };

  // 3. Combine Selected Schedules for Unified 12m Nesting
  const handleCombineSelectedSchedules = async () => {
    if (selectedScheduleIds.length < 2) {
      toast.error("Please select at least 2 schedules to combine.");
      return;
    }

    const toCombine = schedules.filter((s) =>
      selectedScheduleIds.includes(s.id),
    );
    const combinedItems: BBSItem[] = [];

    toCombine.forEach((s) => {
      s.bbsItems?.forEach((item) => {
        combinedItems.push({
          ...item,
          id: `comb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          member: `[${s.scheduleNumber}] ${item.member}`,
        });
      });
    });

    const newScheduleNumber = `BCS-${new Date().getFullYear()}-COMBINED-${String(
      schedules.length + 1,
    ).padStart(2, "0")}`;

    const optResult = optimizeBarCutting(combinedItems, {
      stockLengthM: 12.0,
      contractualScrapLimit: 3.5,
    });

    const newSchedule: BarCuttingSchedule = {
      id: `bcs-${Date.now()}`,
      scheduleNumber: newScheduleNumber,
      title: `Combined Cutting Run (${toCombine.map((s) => s.scheduleNumber).join(" + ")})`,
      projectId: currentProjId,
      companyId: currentCompId,
      levelName: "Multi-Level Combined Run",
      status: "OPTIMIZED",
      diameterMm: combinedItems[0]?.diameter || 16,
      steelGrade: "Grade 500B",
      stockBarLengthM: 12.0,
      sourceBBSFileName: `Merged: ${toCombine.map((s) => s.scheduleNumber).join(", ")}`,
      heatNumber: toCombine[0]?.heatNumber || "HT-COMBINED-01",
      supplier: toCombine[0]?.supplier || "Approved Steel Mill",
      bbsItems: combinedItems,
      cuttingPatterns: optResult.patterns,
      summary: optResult.summary,
      qaVerification: {
        cuttingToleranceChecked: true,
        endCutSquarenessChecked: false,
        couplerPrepVerified: false,
        approvalStatus: "PENDING",
        remarks: `Combined cutting run merging ${toCombine.length} individual BBS schedules for maximum 12m stock nesting.`,
      },
      createdBy: currentUser?.fullName || "QA Engineer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveBarCuttingSchedule(newSchedule);
    setSchedules((prev) => [newSchedule, ...prev]);
    setSelectedScheduleIds([]);

    toast.success(
      `Merged ${toCombine.length} schedules into unified cutting order ${newScheduleNumber}!`,
    );
    navigate(getDetailUrl(newSchedule.id));
  };

  // 4. Delete Schedule
  const handleDeleteSchedule = async (schedule: BarCuttingSchedule) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete cutting schedule "${schedule.scheduleNumber}"?`,
      )
    ) {
      return;
    }

    await dbService.deleteBarCuttingSchedule(schedule.id, currentProjId);
    setSchedules((prev) => prev.filter((s) => s.id !== schedule.id));
    setSelectedScheduleIds((prev) => prev.filter((id) => id !== schedule.id));
    toast.success(`Deleted schedule ${schedule.scheduleNumber}`);
  };
  // 5. Export Handlers
  const handleExportPDF = (schedule: BarCuttingSchedule) => {
    try {
      toast.loading("Generating Cutting Schedule PDF...", { id: "pdf-gen" });
      exportBarCuttingSchedulePDF(schedule, activeProject || undefined, company || undefined);
      toast.success("Cutting Schedule PDF downloaded!", { id: "pdf-gen" });
    } catch (e) {
      console.error("PDF export error:", e);
      toast.error("Failed to export cutting schedule PDF.", { id: "pdf-gen" });
    }
  };

  const handlePrint = (schedule: BarCuttingSchedule) => {
    try {
      printBarCuttingSchedule(schedule, activeProject || undefined, company || undefined);
    } catch (e) {
      console.error("Print error:", e);
      toast.error("Failed to open print preview.");
    }
  };

  const handleExportCSV = (schedule: BarCuttingSchedule) => {
    try {
      exportBarCuttingScheduleCSV(schedule);
      toast.success("Cutting Schedule CSV downloaded!");
    } catch (e) {
      console.error("CSV export error:", e);
      toast.error("Failed to export CSV.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link
              to={projectId ? `/projects/${projectId}/dashboard` : "/project/dashboard"}
              className="hover:text-amber-500 transition"
            >
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              to={projectId ? `/projects/${projectId}/steel` : "/project/steel"}
              className="hover:text-amber-500 transition"
            >
              Steel & Reinforcement
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 dark:text-slate-200">
              Bar Cutting Schedules
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span>Bar Cutting Schedules Registry</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {schedules.length} Schedules
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Standard 12.0m stock bar optimization, 1D bin packing, and rebar offcut management (BS 8666 / BS 4449).
          </p>
        </div>

        {/* Global CTAs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowCreateScheduleModal(true)}
            className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New BBS Schedule
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-2 text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-amber-500" />
            Import PDF / CSV
          </button>
        </div>
      </div>

      {/* Structural Quality & Testing Navigation Tabs */}
      <ModuleTabNav
        items={[
          {
            label: "Concrete Cube Testing",
            path: "/project/concrete",
            icon: FlaskConical,
          },
          {
            label: "Steel Rebar Testing & Mill Certs",
            path: "/project/steel",
            icon: Award,
          },
          {
            label: "Bar Bending Schedule (BBS)",
            path: "/project/bar-cutting",
            icon: Scissors,
          },
          {
            label: "Permit to Pour (PTP)",
            path: "/project/permit-to-pour",
            icon: HardHat,
          },
        ]}
      />

      {/* Project-Level Aggregate Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            Total BBS Schedules
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{registryStats.totalSchedules}</span>
            <span className="text-xs font-normal text-slate-400">Packages</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {registryStats.totalItems} distinct rebar line marks
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            Net Fabricated Steel
          </span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {registryStats.totalCutWeightTonnes.toFixed(2)} t
          </div>
          <p className="text-[11px] text-slate-400">
            Sum of all structural elements & pours
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            12.0m Commercial Bars
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {registryStats.totalStockBars} Bars
          </div>
          <p className="text-[11px] text-slate-400">
            {(registryStats.totalStockBars * 12).toLocaleString()} linear meters issued
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            Project Average Scrap %
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {registryStats.avgScrapPct}%
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
              Target ≤ 3.5%
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Within contractual wastage allowance
          </p>
        </div>
      </div>

      {/* Search, Filters & Bulk Operations Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by schedule #, title, floor level, heat #..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="QA_APPROVED">QA Approved</option>
            <option value="OPTIMIZED">Optimized</option>
            <option value="DRAFT">Draft</option>
          </select>

          {/* Level Filter */}
          {availableLevels.length > 1 && (
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Structural Levels</option>
              {availableLevels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected Schedules Action (Combine / Merge) */}
        {selectedScheduleIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {selectedScheduleIds.length} Selected
            </span>
            <button
              onClick={handleCombineSelectedSchedules}
              className="px-3.5 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-md transition-all flex items-center gap-1.5"
              title="Combine multiple schedules to minimize cutting offcuts across elements"
            >
              <Merge className="w-3.5 h-3.5" />
              Combine for Unified 12m Nesting
            </button>
          </div>
        )}
      </div>

      {/* Schedules Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-xs font-medium">Loading schedules...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Scissors className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No cutting schedules found
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Create a new cutting schedule or import a Bar Bending Schedule (BBS) to get started.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={() => setShowCreateScheduleModal(true)}
                className="px-4 py-2 text-xs font-bold bg-amber-500 text-slate-950 rounded-xl"
              >
                Create Schedule
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
              >
                Import PDF/CSV
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredSchedules.length > 0 &&
                        selectedScheduleIds.length === filteredSchedules.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedScheduleIds(filteredSchedules.map((s) => s.id));
                        } else {
                          setSelectedScheduleIds([]);
                        }
                      }}
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                  </th>
                  <th className="py-3.5 px-4">Schedule #</th>
                  <th className="py-3.5 px-4">Title & Scope</th>
                  <th className="py-3.5 px-4">Level</th>
                  <th className="py-3.5 px-4">12m Bars</th>
                  <th className="py-3.5 px-4">Fabricated Wt</th>
                  <th className="py-3.5 px-4">Scrap %</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {paginatedSchedules.map((s) => {
                  const isSelected = selectedScheduleIds.includes(s.id);
                  const scrapPct = s.summary?.scrapPercentage || 0;
                  const scrapLimit = s.summary?.contractualScrapLimit || 3.5;
                  const isScrapGood = scrapPct <= scrapLimit;
                  const totalTonnes = (s.summary?.totalCutWeightKg || 0) / 1000;

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedScheduleIds((prev) => [...prev, s.id]);
                            } else {
                              setSelectedScheduleIds((prev) =>
                                prev.filter((id) => id !== s.id),
                              );
                            }
                          }}
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <Link
                          to={getDetailUrl(s.id)}
                          className="font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1.5"
                        >
                          <span>{s.scheduleNumber}</span>
                          <ArrowRight className="w-3 h-3 opacity-60" />
                        </Link>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {s.bbsItems?.length || 0} bar marks
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                          {s.title}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <FileSpreadsheet className="w-3 h-3 text-slate-400" />
                            {s.sourceBBSFileName || "Direct BBS"}
                          </span>
                          {s.heatNumber && (
                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-[9px]">
                              {s.heatNumber}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {s.levelName || "General"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {s.summary?.totalStockBarsUsed || 0} Bars
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {((s.summary?.totalStockBarsUsed || 0) * 12).toLocaleString()} m
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {totalTonnes.toFixed(2)} t
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold ${
                              isScrapGood
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {scrapPct.toFixed(2)}%
                          </span>
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                              isScrapGood
                                ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                            }`}
                          >
                            {isScrapGood ? "Pass" : "High"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {s.status === "QA_APPROVED" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Approved
                          </span>
                        ) : s.status === "OPTIMIZED" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                            Optimized
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-600 border border-slate-500/20">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={getDetailUrl(s.id)}
                            className="px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition"
                          >
                            Open
                          </Link>

                          <button
                            onClick={() => handleExportPDF(s)}
                            title="Download Company Cutting Schedule PDF (Direct)"
                            className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <FileDown className="w-4 h-4 text-blue-500" />
                          </button>

                          <button
                            onClick={() => handlePrint(s)}
                            title="Print / Save as PDF Preview"
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleExportCSV(s)}
                            title="Download CSV Spreadsheet"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          </button>

                          <button
                            onClick={() => handleDeleteSchedule(s)}
                            title="Delete Schedule"
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredSchedules.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredSchedules.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
            pageSizeOptions={[5, 10, 20, 50]}
            itemLabel="cutting schedules"
          />
        )}
      </div>

      {/* Modals */}
      <CreateScheduleModal
        isOpen={showCreateScheduleModal}
        onClose={() => setShowCreateScheduleModal(false)}
        onCreate={handleCreateSchedule}
        existingCount={schedules.length}
      />

      <BBSUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onImport={(items) => handleUploadBBSItems(items)}
        defaultMode="NEW"
      />
    </div>
  );
};

export default BarCuttingRegistryPage;
