import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService, sortByNewestFirst } from "@/lib/db";
import {
  BarCuttingSchedule,
  BBSItem,
  SteelRebarTest,
} from "@/types";
import {
  Scissors,
  FileSpreadsheet,
  Upload,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Search,
  Layers,
  Building2,
  Calendar,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
  Trash2,
  RefreshCw,
  Edit2,
  FileDown,
  Printer,
  ExternalLink,
} from "lucide-react";
import { BBSUploadModal } from "@/components/steel/BBSUploadModal";
import { CuttingPatternCard } from "@/components/steel/CuttingPatternCard";
import { BarBundleTagsModal } from "@/components/steel/BarBundleTagsModal";
import { AddBBSItemModal } from "@/components/steel/AddBBSItemModal";
import { Pagination } from "@/components/common/Pagination";
import {
  exportBarCuttingSchedulePDF,
  printBarCuttingSchedule,
  exportBarCuttingScheduleCSV,
} from "@/services/pdf/barCuttingReport";
import { optimizeBarCutting } from "@/lib/barCuttingOptimizer";
import { toast } from "react-hot-toast";

export const BarCuttingDetailPage: React.FC = () => {
  const { projectId, scheduleId } = useParams<{
    projectId: string;
    scheduleId: string;
  }>();
  const navigate = useNavigate();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentCompId =
    currentUser?.companyId || company?.id || "";
  const currentProjId = projectId || activeProject?.id || "";

  const [schedules, setSchedules] = useState<BarCuttingSchedule[]>([]);
  const [activeSchedule, setActiveSchedule] =
    useState<BarCuttingSchedule | null>(null);
  const [steelTests, setSteelTests] = useState<SteelRebarTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sub-tabs
  const [activeDetailTab, setActiveDetailTab] = useState<
    "PATTERNS" | "BBS_ITEMS" | "QA_TRACEABILITY"
  >("PATTERNS");
  const [selectedDiameter, setSelectedDiameter] = useState<number | "ALL">(
    "ALL",
  );
  const [itemSearchQuery, setItemSearchQuery] = useState("");

  // Pagination for Cutting Patterns
  const [patternsCurrentPage, setPatternsCurrentPage] = useState(1);
  const [patternsPageSize, setPatternsPageSize] = useState(6);

  // Pagination for BBS Line Items
  const [bbsCurrentPage, setBbsCurrentPage] = useState(1);
  const [bbsPageSize, setBbsPageSize] = useState(10);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BBSItem | null>(null);

  // Load schedules and tests
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [schedList, testList] = await Promise.all([
        dbService.getBarCuttingSchedules(currentProjId, currentCompId),
        dbService.getSteelTests(currentProjId, currentCompId),
      ]);
      const sorted = sortByNewestFirst(schedList);
      setSchedules(sorted);
      setSteelTests(testList);

      if (sorted.length > 0) {
        const found = scheduleId
          ? sorted.find((s) => s.id === scheduleId)
          : sorted[0];
        setActiveSchedule(found || sorted[0]);
      }
    } catch (e) {
      console.error("Error loading bar cutting schedule:", e);
      toast.error("Failed to load bar cutting schedule.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentProjId, currentCompId, scheduleId]);

  // Registry URL helper
  const registryUrl = projectId
    ? `/project/${projectId}/steel/bar-cutting`
    : `/project/steel/bar-cutting`;

  const getDetailUrl = (targetId: string) => {
    if (projectId) {
      return `/project/${projectId}/steel/bar-cutting/${targetId}`;
    }
    return `/project/steel/bar-cutting/${targetId}`;
  };

  // Available diameters in active schedule
  const availableDiameters = useMemo(() => {
    if (!activeSchedule || !activeSchedule.bbsItems) return [];
    const set = new Set<number>();
    activeSchedule.bbsItems.forEach((item) => set.add(item.diameter));
    return Array.from(set).sort((a, b) => a - b);
  }, [activeSchedule]);

  // Filtered BBS line items
  const filteredBBSItems = useMemo(() => {
    if (!activeSchedule || !activeSchedule.bbsItems) return [];
    return activeSchedule.bbsItems.filter((i) => {
      const matchesDiameter =
        selectedDiameter === "ALL" || i.diameter === selectedDiameter;
      const q = itemSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        i.barMark.toLowerCase().includes(q) ||
        i.member.toLowerCase().includes(q) ||
        (i.shapeCode && i.shapeCode.toLowerCase().includes(q));
      return matchesDiameter && matchesSearch;
    });
  }, [activeSchedule, selectedDiameter, itemSearchQuery]);

  // Paginated BBS line items
  const paginatedBBSItems = useMemo(() => {
    const start = (bbsCurrentPage - 1) * bbsPageSize;
    return filteredBBSItems.slice(start, start + bbsPageSize);
  }, [filteredBBSItems, bbsCurrentPage, bbsPageSize]);

  // Filtered cutting patterns
  const filteredPatterns = useMemo(() => {
    if (!activeSchedule || !activeSchedule.cuttingPatterns) return [];
    if (selectedDiameter === "ALL") return activeSchedule.cuttingPatterns;
    return activeSchedule.cuttingPatterns.filter(
      (pat) => (pat.diameter || activeSchedule.diameterMm) === selectedDiameter,
    );
  }, [activeSchedule, selectedDiameter]);

  // Paginated cutting patterns
  const paginatedPatterns = useMemo(() => {
    const start = (patternsCurrentPage - 1) * patternsPageSize;
    return filteredPatterns.slice(start, start + patternsPageSize);
  }, [filteredPatterns, patternsCurrentPage, patternsPageSize]);

  // Reset pagination on diameter or search change
  useEffect(() => {
    setPatternsCurrentPage(1);
    setBbsCurrentPage(1);
  }, [selectedDiameter, itemSearchQuery]);

  // --- Handlers ---

  // 1. Re-optimize active schedule
  const handleReoptimize = async () => {
    if (!activeSchedule) return;

    const itemsToOptimize =
      selectedDiameter === "ALL"
        ? activeSchedule.bbsItems
        : activeSchedule.bbsItems.filter(
            (i) => i.diameter === selectedDiameter,
          );

    const optResult = optimizeBarCutting(itemsToOptimize, {
      stockLengthM: activeSchedule.stockBarLengthM || 12.0,
      contractualScrapLimit:
        activeSchedule.summary?.contractualScrapLimit || 3.5,
    });

    const updated: BarCuttingSchedule = {
      ...activeSchedule,
      cuttingPatterns: optResult.patterns,
      summary: optResult.summary,
      status: "OPTIMIZED",
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveBarCuttingSchedule(updated);
    setActiveSchedule(updated);
    setSchedules((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s)),
    );
    toast.success("Cutting patterns re-optimized successfully!");
  };

  // 2. Append BBS Items from Upload
  const handleAppendBBSItems = async (
    items: BBSItem[],
    fileName?: string,
  ) => {
    if (!activeSchedule) return;

    const combinedItems = [...activeSchedule.bbsItems, ...items];
    const optResult = optimizeBarCutting(combinedItems, {
      stockLengthM: activeSchedule.stockBarLengthM || 12.0,
      contractualScrapLimit:
        activeSchedule.summary?.contractualScrapLimit || 3.5,
    });

    const updated: BarCuttingSchedule = {
      ...activeSchedule,
      bbsItems: combinedItems,
      cuttingPatterns: optResult.patterns,
      summary: optResult.summary,
      status: "OPTIMIZED",
      sourceBBSFileName: activeSchedule.sourceBBSFileName
        ? `${activeSchedule.sourceBBSFileName}, ${fileName || "Addendum"}`
        : fileName,
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveBarCuttingSchedule(updated);
    setActiveSchedule(updated);
    setSchedules((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s)),
    );

    toast.success(
      `Appended ${items.length} marks to ${activeSchedule.scheduleNumber}! Re-optimized 12m stock.`,
    );
  };

  // 3. Add or Edit a single BBS Rebar Mark
  const handleSaveBBSItem = async (item: BBSItem) => {
    if (!activeSchedule) return;

    let updatedItems: BBSItem[];
    const existingIndex = activeSchedule.bbsItems.findIndex(
      (i) =>
        i.id === item.id ||
        (i.barMark === item.barMark && i.member === item.member),
    );

    if (existingIndex >= 0) {
      updatedItems = [...activeSchedule.bbsItems];
      updatedItems[existingIndex] = item;
    } else {
      updatedItems = [...activeSchedule.bbsItems, item];
    }

    const optResult = optimizeBarCutting(updatedItems, {
      stockLengthM: activeSchedule.stockBarLengthM || 12.0,
      contractualScrapLimit:
        activeSchedule.summary?.contractualScrapLimit || 3.5,
    });

    const updated: BarCuttingSchedule = {
      ...activeSchedule,
      bbsItems: updatedItems,
      cuttingPatterns: optResult.patterns,
      summary: optResult.summary,
      status: "OPTIMIZED",
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveBarCuttingSchedule(updated);
    setActiveSchedule(updated);
    setSchedules((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s)),
    );
    toast.success("Bar mark saved and 12m patterns re-optimized!");
  };

  // 4. Delete single BBS Rebar Mark
  const handleDeleteBBSItem = async (itemId: string) => {
    if (!activeSchedule) return;
    const itemToDelete = activeSchedule.bbsItems.find((i) => i.id === itemId);
    if (
      !window.confirm(
        `Remove Bar Mark "${itemToDelete?.barMark || "item"}" from cutting schedule?`,
      )
    )
      return;

    const updatedItems = activeSchedule.bbsItems.filter((i) => i.id !== itemId);
    const optResult = optimizeBarCutting(updatedItems, {
      stockLengthM: activeSchedule.stockBarLengthM || 12.0,
      contractualScrapLimit:
        activeSchedule.summary?.contractualScrapLimit || 3.5,
    });

    const updated: BarCuttingSchedule = {
      ...activeSchedule,
      bbsItems: updatedItems,
      cuttingPatterns: optResult.patterns,
      summary: optResult.summary,
      status: updatedItems.length > 0 ? "OPTIMIZED" : "DRAFT",
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveBarCuttingSchedule(updated);
    setActiveSchedule(updated);
    setSchedules((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s)),
    );
    toast.success("Bar mark removed and cutting patterns re-optimized.");
  };

  // 5. QA Sign-off
  const handleQASignOff = async () => {
    if (!activeSchedule) return;
    const isAlreadyApproved =
      activeSchedule.qaVerification?.approvalStatus === "APPROVED";

    const updated: BarCuttingSchedule = {
      ...activeSchedule,
      status: isAlreadyApproved ? "OPTIMIZED" : "QA_APPROVED",
      qaVerification: {
        ...activeSchedule.qaVerification,
        approvalStatus: isAlreadyApproved ? "PENDING" : "APPROVED",
        inspectedBy: currentUser?.fullName || "Lead QA/QC Engineer",
        inspectedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveBarCuttingSchedule(updated);
    setActiveSchedule(updated);
    setSchedules((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s)),
    );
    toast.success(
      isAlreadyApproved
        ? "QA Approval reverted to Pending"
        : "Cutting Schedule approved & stamped by QA/QC!",
    );
  };
  // 6. Export Actions
  const handleExportPDF = () => {
    if (!activeSchedule) return;
    try {
      toast.loading("Generating Company Cutting Schedule PDF...", { id: "detail-pdf" });
      exportBarCuttingSchedulePDF(
        activeSchedule,
        activeProject || undefined,
        company || undefined,
      );
      toast.success("Cutting Schedule PDF downloaded successfully!", { id: "detail-pdf" });
    } catch (e) {
      console.error("PDF export error:", e);
      toast.error("Failed to generate PDF.", { id: "detail-pdf" });
    }
  };

  const handlePrint = () => {
    if (!activeSchedule) return;
    try {
      printBarCuttingSchedule(
        activeSchedule,
        activeProject || undefined,
        company || undefined,
      );
    } catch (e) {
      console.error("Print error:", e);
      toast.error("Failed to open print preview.");
    }
  };

  const handleExportCSV = () => {
    if (!activeSchedule) return;
    try {
      exportBarCuttingScheduleCSV(activeSchedule);
      toast.success("Cutting Schedule CSV downloaded!");
    } catch (e) {
      console.error("CSV export error:", e);
      toast.error("Failed to export CSV.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm font-semibold">Loading Cutting Schedule & 1D Nesting...</p>
      </div>
    );
  }

  if (!activeSchedule) {
    return (
      <div className="p-16 text-center space-y-4">
        <Scissors className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Schedule Not Found</h2>
        <p className="text-xs text-slate-500">The requested cutting schedule could not be located.</p>
        <Link
          to={registryUrl}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Schedules
        </Link>
      </div>
    );
  }

  const scrapPct = activeSchedule.summary?.scrapPercentage || 0;
  const scrapLimit = activeSchedule.summary?.contractualScrapLimit || 3.5;
  const isScrapGood = scrapPct <= scrapLimit;
  const totalTonnes = (activeSchedule.summary?.totalCutWeightKg || 0) / 1000;
  const usableOffcutsCount =
    activeSchedule.cuttingPatterns?.filter((p) => p.isReusableOffcut).length || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
            <Link to={registryUrl} className="hover:text-amber-500 transition flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              All Schedules
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 dark:text-slate-200">
              {activeSchedule.scheduleNumber}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>{activeSchedule.title}</span>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {activeSchedule.scheduleNumber}
              </span>
            </h1>

            {/* Quick Switcher dropdown for active schedule */}
            {schedules.length > 1 && (
              <select
                value={activeSchedule.id}
                onChange={(e) => {
                  navigate(getDetailUrl(e.target.value));
                }}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.scheduleNumber} ({s.bbsItems?.length || 0} marks)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Level: <strong className="text-slate-800 dark:text-slate-200">{activeSchedule.levelName || "General"}</strong>
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              BBS Source: <strong className="text-slate-800 dark:text-slate-200">{activeSchedule.sourceBBSFileName || "Manual"}</strong>
            </span>
            {activeSchedule.heatNumber && (
              <>
                <span>&bull;</span>
                <span>
                  Heat: <strong className="font-mono text-slate-800 dark:text-slate-200">{activeSchedule.heatNumber}</strong>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export PDF Button (Company Format) */}
          {/* Export PDF Button (Direct jsPDF Download) */}
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download Company Cutting Schedule PDF with visual cuts, barmarks & red offcuts"
          >
            <FileDown className="w-4 h-4" />
            Export Schedule PDF
          </button>

          {/* Print / Preview Button */}
          <button
            onClick={handlePrint}
            className="px-3 py-2 text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Open printable schedule view in browser"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            Print Preview
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Download cutting patterns as CSV spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export CSV
          </button>

          <button
            onClick={handleReoptimize}
            className="px-3.5 py-2 text-xs font-bold bg-slate-900 dark:bg-slate-800 text-slate-100 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-700/60 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Re-run 1D cutting stock nesting algorithm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            Optimize 12m Stock
          </button>

          <button
            onClick={() => setShowTagsModal(true)}
            className="px-3 py-2 text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Tag className="w-3.5 h-3.5 text-blue-500" />
            Print Bar Tags
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setShowAddItemModal(true);
            }}
            className="px-3 py-2 text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-500" />
            Add Rebar Mark
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3 py-2 text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-amber-500" />
            Append BBS
          </button>

          <button
            onClick={handleQASignOff}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSchedule.qaVerification?.approvalStatus === "APPROVED"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-500 hover:text-slate-950"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {activeSchedule.qaVerification?.approvalStatus === "APPROVED"
              ? "QA Approved"
              : "Approve Schedule"}
          </button>
        </div>
      </div>

      {/* Requisition & Wastage KPIs Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            Total 12.0m Commercial Bars
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {activeSchedule.summary?.totalStockBarsUsed || 0} Bars
          </div>
          <p className="text-[11px] text-slate-400">
            {((activeSchedule.summary?.totalStockBarsUsed || 0) * 12).toLocaleString()} linear meters
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            Net Fabricated Steel Weight
          </span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {totalTonnes.toFixed(2)} t
          </div>
          <p className="text-[11px] text-slate-400">
            {activeSchedule.bbsItems?.length || 0} distinct bar marks cut
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            Scrap Wastage %
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-black ${
                isScrapGood
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {scrapPct.toFixed(2)}%
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isScrapGood
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-amber-500/10 text-amber-600"
              }`}
            >
              Limit ≤ {scrapLimit}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {activeSchedule.summary?.totalScrapWeightKg.toFixed(1) || 0} kg unrecoverable scrap
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">
            Usable Offcuts (≥ 300mm)
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{usableOffcutsCount}</span>
            <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/50 px-1.5 py-0.5 rounded">
              Stored in Rack
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {activeSchedule.summary?.totalReusableOffcutWeightKg.toFixed(1) || 0} kg reusable stock
          </p>
        </div>
      </div>

      {/* Diameter Requisition Matrix Card */}
      {activeSchedule.summary?.diameterBreakdown &&
        Object.keys(activeSchedule.summary.diameterBreakdown).length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  12.0m Commercial Stock Bar Requisition by Size
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Stock allocation and wastage percentage broken down by rebar diameter
                </p>
              </div>

              {/* Diameter Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSelectedDiameter("ALL")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    selectedDiameter === "ALL"
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  All Sizes ({availableDiameters.map((d) => `T${d}`).join(", ")})
                </button>
                {availableDiameters.map((dia) => (
                  <button
                    key={dia}
                    onClick={() => setSelectedDiameter(dia)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      selectedDiameter === dia
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    T{dia}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(activeSchedule.summary.diameterBreakdown).map(
                ([diaStr, breakdown]) => {
                  const dia = Number(diaStr);
                  const isSelected = selectedDiameter === dia;
                  return (
                    <button
                      key={dia}
                      onClick={() =>
                        setSelectedDiameter(isSelected ? "ALL" : dia)
                      }
                      className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm ring-2 ring-amber-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-slate-900 text-amber-400 dark:bg-slate-950">
                          T{dia}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            breakdown.isWithinLimit
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        >
                          {breakdown.scrapPercentage.toFixed(1)}% scrap
                        </span>
                      </div>
                      <div className="text-base font-black text-slate-900 dark:text-white">
                        {breakdown.totalStockBarsUsed}{" "}
                        <span className="text-xs font-normal text-slate-500">
                          Bars
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                        <span>{(breakdown.totalCutWeightKg / 1000).toFixed(2)} t</span>
                        <span>{breakdown.totalCutsRequired} cuts</span>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          </div>
        )}

      {/* Sub-tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
        <button
          onClick={() => setActiveDetailTab("PATTERNS")}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeDetailTab === "PATTERNS"
              ? "text-amber-600 dark:text-amber-400 border-b-2 border-amber-500"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          12.0m Commercial Cutting Patterns ({filteredPatterns.length})
        </button>

        <button
          onClick={() => setActiveDetailTab("BBS_ITEMS")}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeDetailTab === "BBS_ITEMS"
              ? "text-amber-600 dark:text-amber-400 border-b-2 border-amber-500"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          BBS Line Items ({filteredBBSItems.length})
        </button>

        <button
          onClick={() => setActiveDetailTab("QA_TRACEABILITY")}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer ${
            activeDetailTab === "QA_TRACEABILITY"
              ? "text-amber-600 dark:text-amber-400 border-b-2 border-amber-500"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          QA Traceability & Mill Tests
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: 12.0m CUTTING PATTERNS (PAGINATED)                             */}
      {/* ========================================================================= */}
      {activeDetailTab === "PATTERNS" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span>Showing:</span>
              <strong className="text-slate-900 dark:text-white">
                {selectedDiameter === "ALL" ? "All Diameters" : `T${selectedDiameter} Diameter Bars`}
              </strong>
              <span>&bull;</span>
              <span>{filteredPatterns.length} Distinct Cutting Patterns</span>
            </div>

            <div className="text-xs text-slate-400">
              Page {patternsCurrentPage} of {Math.max(1, Math.ceil(filteredPatterns.length / patternsPageSize))}
            </div>
          </div>

          {filteredPatterns.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <Scissors className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No patterns for selected diameter
              </p>
              <button
                onClick={() => setSelectedDiameter("ALL")}
                className="mt-3 px-3 py-1 text-xs font-bold bg-amber-500 text-slate-950 rounded-lg"
              >
                Reset Diameter Filter
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedPatterns.map((pattern, index) => {
                const globalIndex = (patternsCurrentPage - 1) * patternsPageSize + index + 1;
                return (
                  <CuttingPatternCard
                    key={pattern.patternId || index}
                    pattern={pattern}
                    index={globalIndex}
                    diameterMm={pattern.diameter || activeSchedule.diameterMm}
                  />
                );
              })}

              {/* Pagination for Cutting Pattern Cards */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <Pagination
                  currentPage={patternsCurrentPage}
                  totalItems={filteredPatterns.length}
                  pageSize={patternsPageSize}
                  onPageChange={(p) => setPatternsCurrentPage(p)}
                  onPageSizeChange={(sz) => {
                    setPatternsPageSize(sz);
                    setPatternsCurrentPage(1);
                  }}
                  pageSizeOptions={[4, 6, 12, 24]}
                  itemLabel="cutting patterns"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: BBS LINE ITEMS (PAGINATED)                                     */}
      {/* ========================================================================= */}
      {activeDetailTab === "BBS_ITEMS" && (
        <div className="space-y-4">
          {/* BBS Search & Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
                placeholder="Search bar mark, member, shape..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              onClick={() => {
                setEditingItem(null);
                setShowAddItemModal(true);
              }}
              className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Bar Mark
            </button>
          </div>

          {/* BBS Items Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Bar Mark</th>
                    <th className="py-3 px-4">Member / Element</th>
                    <th className="py-3 px-4">Type & Size</th>
                    <th className="py-3 px-4">Shape Code</th>
                    <th className="py-3 px-4">Cut Length</th>
                    <th className="py-3 px-4">No. of Bars</th>
                    <th className="py-3 px-4">Total Length</th>
                    <th className="py-3 px-4">Weight</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {paginatedBBSItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No bar marks found for active filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedBBSItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                          {item.barMark}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {item.member}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`font-mono text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              item.diameter === 10
                                ? "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200"
                                : item.diameter === 12
                                  ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800"
                                  : item.diameter === 16
                                    ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800"
                                    : item.diameter === 20
                                      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                                      : item.diameter === 25
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                                        : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                            }`}
                          >
                            T{item.diameter}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                          {item.shapeCode}
                        </td>
                        <td className="py-2.5 px-4 font-mono">
                          {item.cutLengthM.toFixed(3)} m
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                          {item.totalBars}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {item.totalLengthM.toFixed(1)} m
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {item.totalWeightKg.toFixed(1)} kg
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setShowAddItemModal(true);
                              }}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                              title="Edit item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBBSItem(item.id)}
                              className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded text-slate-400 hover:text-red-600 transition"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for BBS Line Items */}
            {filteredBBSItems.length > 0 && (
              <Pagination
                currentPage={bbsCurrentPage}
                totalItems={filteredBBSItems.length}
                pageSize={bbsPageSize}
                onPageChange={(p) => setBbsCurrentPage(p)}
                onPageSizeChange={(sz) => {
                  setBbsPageSize(sz);
                  setBbsCurrentPage(1);
                }}
                pageSizeOptions={[10, 25, 50, 100]}
                itemLabel="rebar line marks"
              />
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: QA & TRACEABILITY                                              */}
      {/* ========================================================================= */}
      {activeDetailTab === "QA_TRACEABILITY" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Mill Test Certificate & Traceability
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Mill Heat / Cast Number:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {activeSchedule.heatNumber || "HT-99412-A"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Steel Supplier / Manufacturer:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {activeSchedule.supplier || "Emirates Steel Industries"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Steel Grade:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {activeSchedule.steelGrade || "Grade 500B (BS 4449)"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">QA Inspector:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {activeSchedule.qaVerification?.inspectedBy || "Site QA/QC Engineer"}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Approval Status:</span>
                <span
                  className={`font-bold ${
                    activeSchedule.qaVerification?.approvalStatus === "APPROVED"
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                >
                  {activeSchedule.qaVerification?.approvalStatus || "PENDING"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              Fabrication Tolerance Checklist (BS 8666)
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeSchedule.qaVerification?.cuttingToleranceChecked || false}
                  readOnly
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  Length cut tolerance within &plusmn;5mm of specified BBS length
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeSchedule.qaVerification?.endCutSquarenessChecked || false}
                  readOnly
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  End-cut squareness checked (no excessive shearing burrs)
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeSchedule.qaVerification?.couplerPrepVerified || false}
                  readOnly
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-slate-700 dark:text-slate-300">
                  Coupler thread preparation / end saw cutting verified (if applicable)
                </span>
              </label>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={handleQASignOff}
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl transition cursor-pointer"
              >
                {activeSchedule.qaVerification?.approvalStatus === "APPROVED"
                  ? "Revoke Approval"
                  : "Sign & Approve Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <BBSUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onImport={(items, fileName) => handleAppendBBSItems(items, fileName)}
        activeSchedule={{
          id: activeSchedule.id,
          scheduleNumber: activeSchedule.scheduleNumber,
          title: activeSchedule.title,
        }}
        defaultMode="APPEND"
      />

      <AddBBSItemModal
        isOpen={showAddItemModal}
        onClose={() => {
          setShowAddItemModal(false);
          setEditingItem(null);
        }}
        onSave={handleSaveBBSItem}
        initialItem={editingItem}
      />

      <BarBundleTagsModal
        isOpen={showTagsModal}
        onClose={() => setShowTagsModal(false)}
        schedule={activeSchedule}
      />
    </div>
  );
};

export default BarCuttingDetailPage;
