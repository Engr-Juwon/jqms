import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { dbService } from "@/lib/db";
import {
  PlannerEvent,
  PlannerEventType,
  InspectionRequest,
  PermitToPour,
  ConcreteCubeSample,
  NonConformanceReport,
  MaterialApprovalRequest,
  MaterialDelivery,
} from "@/types";
import {
  CalendarClock,
  Calendar,
  Layers,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ClipboardCheck,
  HardHat,
  ChevronLeft,
  ChevronRight,
  List,
  Search,
  Sparkles,
  Sun,
  Moon,
  Volume2,
  RefreshCw,
} from "lucide-react";
import { MonthCalendarGrid } from "@/components/planner/MonthCalendarGrid";
import { PersonalAssistantPanel } from "@/components/planner/PersonalAssistantPanel";
import { ListTimelineView } from "@/components/planner/ListTimelineView";
import { GanttScheduleView } from "@/components/planner/GanttScheduleView";
import { ScheduleEventModal } from "@/components/planner/ScheduleEventModal";
import { EventDetailModal } from "@/components/planner/EventDetailModal";
import { toast } from "react-hot-toast";

export const ConstructionPlanner: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const currentCompId =
    currentUser?.companyId ||
    company?.id ||
    activeProject?.companyId ||
    "comp-apex-civil";
  const currentProjId = projectId || activeProject?.id || "proj-skyline-tower";

  // Helper to add days to ISO date string
  const addDaysToDate = (dateStr: string, days: number): string => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      d.setDate(d.getDate() + days);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {
      return dateStr;
    }
  };

  const formatLocalYYYYMMDD = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Events & State
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<
    "MONTH" | "GANTT" | "LIST" | "ASSISTANT"
  >("MONTH");

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Clock
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleInitialDate, setScheduleInitialDate] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<PlannerEvent | null>(null);

  // Update live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load and auto-aggregate live ISO quality calendar events from all sub-modules
  const loadData = useCallback(async () => {
    if (!currentProjId) return;
    setLoading(true);
    try {
      const explicitEvents = await dbService.getPlannerEvents(
        currentProjId,
        currentCompId,
      );

      const [inspections, ptps, cubes, ncrs, rfis, mars, deliveries] =
        await Promise.all([
          dbService
            .getInspections(currentProjId, currentCompId)
            .catch(() => [] as InspectionRequest[]),
          dbService
            .getPermitsToPour(currentProjId, currentCompId)
            .catch(() => [] as PermitToPour[]),
          dbService
            .getCubeSamples(currentProjId, currentCompId)
            .catch(() => [] as ConcreteCubeSample[]),
          dbService
            .getNCRs(currentProjId, currentCompId)
            .catch(() => [] as NonConformanceReport[]),
          dbService.getRFIs
            ? dbService.getRFIs(currentProjId, currentCompId).catch(() => [])
            : Promise.resolve([]),
          dbService.getMARs
            ? dbService
                .getMARs(currentProjId, currentCompId)
                .catch(() => [] as MaterialApprovalRequest[])
            : Promise.resolve([]),
          dbService.getDeliveries
            ? dbService
                .getDeliveries(currentProjId, currentCompId)
                .catch(() => [] as MaterialDelivery[])
            : Promise.resolve([]),
        ]);

      const dynamicEvents: PlannerEvent[] = [];

      // 1. Inspections
      (inspections as InspectionRequest[]).forEach(
        (insp: InspectionRequest) => {
          let d = insp.scheduledDate || "";
          if (!d && insp.createdAt) {
            try {
              d =
                typeof insp.createdAt === "string"
                  ? insp.createdAt.split("T")[0]
                  : formatLocalYYYYMMDD(new Date(insp.createdAt));
            } catch {
              d = formatLocalYYYYMMDD(new Date());
            }
          }
          if (!d) d = formatLocalYYYYMMDD(new Date());
          dynamicEvents.push({
            id: `dyn-insp-${insp.id}`,
            projectId: currentProjId,
            companyId: currentCompId,
            title: `Inspection: ${insp.inspectionNumber || "INSP"} - ${insp.elementName || insp.levelName || "Site"}`,
            date: d,
            time: insp.scheduledTime || "08:00",
            eventType: "INSPECTION",
            priority: insp.status === "REJECTED" ? "CRITICAL" : "MEDIUM",
            status: insp.status === "APPROVED" ? "COMPLETED" : "PENDING",
            location: insp.levelName || insp.elementName || "Site Location",
            assignedTo:
              insp.inspector?.name ||
              (insp as any).inspectorName ||
              "QA/QC Inspector",
            referenceId: insp.id,
          });
        },
      );

      // 2. Concrete PTPs
      (ptps as PermitToPour[]).forEach((ptp: PermitToPour) => {
        const isRejected = ptp.status === "REJECTED";
        const pourDate =
          ptp.plannedPourDate ||
          (ptp as any).date ||
          formatLocalYYYYMMDD(new Date());
        dynamicEvents.push({
          id: `dyn-ptp-${ptp.id}`,
          projectId: currentProjId,
          companyId: currentCompId,
          title: isRejected
            ? `PTP REJECTED: ${ptp.ptpNumber || "PTP"} - ${ptp.elementName || "Element"}`
            : `Concrete Pour: ${ptp.ptpNumber || "PTP"} - ${ptp.elementName || "Element"} (${ptp.targetVolumeM3 || 25}m³ ${ptp.concreteGrade || "C40"})`,
          date: pourDate,
          time: ptp.plannedPourTime || "10:00",
          eventType: "CONCRETE_POUR",
          priority: "CRITICAL",
          status:
            ptp.status === "APPROVED"
              ? "COMPLETED"
              : isRejected
                ? "REJECTED"
                : "PENDING",
          location: ptp.levelName || "Site Slab",
          assignedTo: ptp.supplierBatchPlant || "Pour Coordinator",
          referenceId: ptp.id,
        });
      });

      // 3. Concrete Cube Tests (1D, 3D, 7D, 14D, 28D, 56D)
      (cubes as ConcreteCubeSample[]).forEach((cube: ConcreteCubeSample) => {
        const castDate = cube.castDate || "";
        const sampleRef = cube.sampleId || cube.sampleNumber || "Sample";
        const grade = cube.concreteGrade || "Concrete";

        // Check 7-Day test
        const test7Date =
          cube.tests?.day7?.scheduledDate ||
          cube.day7Date ||
          (castDate ? addDaysToDate(castDate, 7) : "");
        if (test7Date) {
          const isDone7 =
            (cube.day7Results && cube.day7Results.length > 0) ||
            Boolean(cube.tests?.day7?.averageStrengthNmm2) ||
            Boolean(cube.tests?.day7?.compressiveStrengthNmm2);
          dynamicEvents.push({
            id: `dyn-cube-7-${cube.id}`,
            projectId: currentProjId,
            companyId: currentCompId,
            title: `7-Day Cube Test: ${sampleRef} (${grade})`,
            date: test7Date,
            time: "09:00",
            eventType: "CUBE_TEST_DUE",
            priority: "HIGH",
            status: isDone7 ? "COMPLETED" : "PENDING",
            location: "Central Materials Testing Lab",
            assignedTo: cube.supplier || "Lab Technician",
            referenceId: cube.id,
          });
        }

        // Check 28-Day test
        const test28Date =
          cube.tests?.day28?.scheduledDate ||
          cube.day28Date ||
          (castDate ? addDaysToDate(castDate, 28) : "");
        if (test28Date) {
          const isDone28 =
            (cube.day28Results && cube.day28Results.length > 0) ||
            Boolean(cube.tests?.day28?.averageStrengthNmm2) ||
            Boolean(cube.tests?.day28?.compressiveStrengthNmm2) ||
            cube.status === "APPROVED" ||
            cube.status === "28-DAY DONE";
          dynamicEvents.push({
            id: `dyn-cube-28-${cube.id}`,
            projectId: currentProjId,
            companyId: currentCompId,
            title: `28-Day Cube Test: ${sampleRef} (${grade})`,
            date: test28Date,
            time: "09:00",
            eventType: "CUBE_TEST_DUE",
            priority: "CRITICAL",
            status: isDone28 ? "COMPLETED" : "PENDING",
            location: "Central Materials Testing Lab",
            assignedTo: cube.supplier || "Lab Technician",
            referenceId: cube.id,
          });
        }

        // Check 14-Day or 3-Day if specified
        if (
          cube.day3Date ||
          cube.tests?.day3?.scheduledDate ||
          (cube.day3Results && cube.day3Results.length > 0)
        ) {
          const d3 =
            cube.day3Date ||
            cube.tests?.day3?.scheduledDate ||
            (castDate ? addDaysToDate(castDate, 3) : "");
          if (d3) {
            dynamicEvents.push({
              id: `dyn-cube-3-${cube.id}`,
              projectId: currentProjId,
              companyId: currentCompId,
              title: `3-Day Early Cube Test: ${sampleRef} (${grade})`,
              date: d3,
              time: "09:00",
              eventType: "CUBE_TEST_DUE",
              priority: "MEDIUM",
              status:
                cube.day3Results && cube.day3Results.length > 0
                  ? "COMPLETED"
                  : "PENDING",
              location: "Materials Lab",
              assignedTo: cube.supplier || "Lab Technician",
              referenceId: cube.id,
            });
          }
        }
      });

      // 4. NCR Rectification Deadlines
      (ncrs as NonConformanceReport[]).forEach((ncr: NonConformanceReport) => {
        const deadlineDate =
          ncr.deadline ||
          ncr.targetResolutionDate ||
          (ncr as any).targetCloseDate;
        if (deadlineDate) {
          dynamicEvents.push({
            id: `dyn-ncr-${ncr.id}`,
            projectId: currentProjId,
            companyId: currentCompId,
            title: `NCR Deadline: ${ncr.ncrNumber || ncr.title || "Non-Conformance"}`,
            date: deadlineDate,
            time: "09:00",
            eventType: "NCR_DEADLINE",
            priority: ncr.severity === "CRITICAL" ? "CRITICAL" : "HIGH",
            status: ncr.status === "CLOSED" ? "COMPLETED" : "PENDING",
            location:
              ncr.levelName || (ncr as any).locationLevel || "Site Wide",
            assignedTo: ncr.tradeName || (ncr as any).trade || "QA/QC Manager",
            referenceId: ncr.id,
          });
        }
      });

      // 5. RFIs
      if (Array.isArray(rfis)) {
        rfis.forEach((rfi: any) => {
          const rfiDueDate = rfi.requiredResponseDate || rfi.dateRequired;
          if (rfiDueDate) {
            dynamicEvents.push({
              id: `dyn-rfi-${rfi.id}`,
              projectId: currentProjId,
              companyId: currentCompId,
              title: `RFI Response Due: ${rfi.rfiNumber || "RFI"} - ${rfi.title || "Technical Query"}`,
              date: rfiDueDate,
              time: "09:00",
              eventType: "RFI_DUE",
              priority: "HIGH",
              status: rfi.status === "CLOSED" ? "COMPLETED" : "PENDING",
              location: rfi.discipline || "Engineering",
              assignedTo: rfi.assignedTo || "Consultant / Architect",
              referenceId: rfi.id,
            });
          }
        });
      }

      // 6. Material Approvals (MARs)
      if (Array.isArray(mars)) {
        mars.forEach((mar: any) => {
          const marDueDate = mar.requiredApprovalDate || mar.submissionDate;
          if (marDueDate) {
            dynamicEvents.push({
              id: `dyn-mar-${mar.id}`,
              projectId: currentProjId,
              companyId: currentCompId,
              title: `MAR Approval Due: ${mar.marNumber || "MAR"} - ${mar.materialName || "Material"}`,
              date: marDueDate,
              time: "09:00",
              eventType: "MAR_DUE",
              priority: "MEDIUM",
              status:
                mar.status === "APPROVED" || mar.status === "CLOSED"
                  ? "COMPLETED"
                  : "PENDING",
              location: mar.manufacturer || "Submittal Desk",
              assignedTo: mar.consultantReviewer || "Consultant Engineer",
              referenceId: mar.id,
            });
          }
        });
      }

      // 7. Material Deliveries
      if (Array.isArray(deliveries)) {
        deliveries.forEach((del: any) => {
          const delDate = del.deliveryDate || del.expectedDeliveryDate;
          if (delDate) {
            const st = (del.status || del.qaqcStatus || "").toUpperCase();
            const isDone =
              st === "APPROVED" ||
              st === "ACCEPTED" ||
              st === "APPROVED AS NOTED" ||
              st === "APPROVED_AS_NOTED" ||
              st === "RECEIVED";
            const isCancelled = st === "REJECTED";

            dynamicEvents.push({
              id: `dyn-del-${del.id}`,
              projectId: currentProjId,
              companyId: currentCompId,
              title: `Site Delivery: ${del.materialName || del.material || del.materialDescription || del.itemDescription || "Material Consignment"}`,
              date: delDate,
              time: del.deliveryTime || "08:00",
              eventType: "DELIVERY",
              priority: "MEDIUM",
              status: isDone ? "COMPLETED" : isCancelled ? "CANCELLED" : "PENDING",
              location:
                del.destinationLevel ||
                del.offloadLocation ||
                "Site Receiving Gate",
              assignedTo: del.supplier || del.supplierName || del.carrier || "Site Logistics",
              referenceId: del.id,
            });
          }
        });
      }

      // Merge and sort
      const allEvents = [...explicitEvents, ...dynamicEvents].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      setEvents(allEvents);
    } catch (err) {
      console.error("Failed loading planner data:", err);
    } finally {
      setLoading(false);
    }
  }, [currentProjId, currentCompId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Date Navigation Helpers
  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const monthYearLabel = useMemo(() => {
    return currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [currentDate]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return events.filter((e) => {
      if (typeFilter !== "ALL" && e.eventType !== typeFilter) return false;
      if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
      if (
        q &&
        !e.title.toLowerCase().includes(q) &&
        !(e.location || "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [events, typeFilter, statusFilter, searchQuery]);

  // Top KPI Stats
  const todayStr = useMemo(() => formatLocalYYYYMMDD(new Date()), []);
  const kpiStats = useMemo(() => {
    let todayCount = 0;
    let upcomingCount = 0;
    let overdueCount = 0;
    let completedCount = 0;

    events.forEach((e) => {
      if (e.status === "COMPLETED") {
        completedCount++;
      } else if (e.date === todayStr) {
        todayCount++;
      } else if (e.date < todayStr) {
        overdueCount++;
      } else {
        upcomingCount++;
      }
    });

    return { todayCount, upcomingCount, overdueCount, completedCount };
  }, [events, todayStr]);

  // Save custom event handler
  const handleSaveCustomEvent = async (newEvent: PlannerEvent) => {
    await dbService.savePlannerEvent(newEvent);
    loadData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ═══ Top Breadcrumb Header ═══ */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <Link
            to="/project/dashboard"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-bold">
              <span>QUALITY DESK</span>
              <span>/</span>
              <span className="text-orange-500 dark:text-orange-400">
                CONSTRUCTION PLANNER
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {activeProject?.name || "Bankside"}
            </h1>
          </div>
        </div>

        {/* Live status & Primary Action Button */}
        <div className="flex items-center gap-3">
          {/* Live Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live</span>
          </div>

          <span className="text-xs text-slate-400 font-mono hidden md:inline">
            Updated {currentTimeStr}
          </span>

          {/* Theme Toggle (Night & Day Mode) */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition"
            title={
              theme === "dark"
                ? "Switch to Day Mode (Light Theme)"
                : "Switch to Night Mode (Dark Theme)"
            }
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Schedule Event Button (Orange as in screenshot) */}
          <button
            onClick={() => {
              setScheduleInitialDate("");
              setShowScheduleModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Event</span>
          </button>
        </div>
      </div>

      {/* ═══ 4 KPI Top Stat Cards (Matching User's Screenshot) ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* TODAY */}
        <div
          onClick={() => {
            setTypeFilter("ALL");
            setStatusFilter("ALL");
            setViewMode("LIST");
          }}
          className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <span className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
            TODAY
          </span>
          <span className="text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
            {kpiStats.todayCount}
          </span>
        </div>

        {/* UPCOMING */}
        <div
          onClick={() => {
            setTypeFilter("ALL");
            setStatusFilter("ALL");
            setViewMode("MONTH");
          }}
          className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
            UPCOMING
          </span>
          <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {kpiStats.upcomingCount}
          </span>
        </div>

        {/* OVERDUE */}
        <div
          onClick={() => {
            setTypeFilter("ALL");
            setStatusFilter("OVERDUE");
            setViewMode("LIST");
          }}
          className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
            OVERDUE
          </span>
          <span className="text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
            {kpiStats.overdueCount}
          </span>
        </div>

        {/* COMPLETED */}
        <div
          onClick={() => {
            setTypeFilter("ALL");
            setStatusFilter("COMPLETED");
            setViewMode("LIST");
          }}
          className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
            COMPLETED
          </span>
          <span className="text-3xl font-black font-mono text-slate-800 dark:text-slate-200">
            {kpiStats.completedCount}
          </span>
        </div>
      </div>

      {/* ═══ Controls Navigation Bar (Matching User Screenshot) ═══ */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Date Navigator */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight ml-2">
              {monthYearLabel}
            </h2>
          </div>

          {/* View Switchers & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setViewMode("MONTH")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                  viewMode === "MONTH"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Month</span>
              </button>
              <button
                onClick={() => setViewMode("GANTT")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                  viewMode === "GANTT"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Gantt</span>
              </button>
              <button
                onClick={() => setViewMode("LIST")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                  viewMode === "LIST"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
              <button
                onClick={() => setViewMode("ASSISTANT")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
                  viewMode === "ASSISTANT"
                    ? "bg-indigo-600 text-white shadow"
                    : "text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-bold"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Assistant</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand-500 w-44"
              />
            </div>

            {/* All Types Dropdown */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Types</option>
              <option value="INSPECTION">Inspections</option>
              <option value="CONCRETE_POUR">Concrete Pours</option>
              <option value="CUBE_TEST_DUE">Cube Tests</option>
              <option value="NCR_DEADLINE">NCR Deadlines</option>
              <option value="RFI_DUE">RFI Due</option>
            </select>

            {/* All Statuses Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* ═══ Main Body Views ═══ */}
      {loading ? (
        <div className="py-24 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-semibold">
            Synchronizing quality schedule and hold points...
          </p>
        </div>
      ) : (
        <>
          {viewMode === "MONTH" && (
            <MonthCalendarGrid
              currentDate={currentDate}
              events={filteredEvents}
              onSelectEvent={(evt) => setSelectedEvent(evt)}
              onQuickSchedule={(dateStr) => {
                setScheduleInitialDate(dateStr);
                setShowScheduleModal(true);
              }}
            />
          )}

          {viewMode === "GANTT" && (
            <GanttScheduleView
              events={filteredEvents}
              currentDate={currentDate}
              onSelectEvent={(evt) => setSelectedEvent(evt)}
            />
          )}

          {viewMode === "LIST" && (
            <ListTimelineView
              events={filteredEvents}
              onSelectEvent={(evt) => setSelectedEvent(evt)}
            />
          )}

          {viewMode === "ASSISTANT" && (
            <PersonalAssistantPanel
              events={events}
              projectName={activeProject?.name || "Bankside"}
              onSelectEvent={(evt) => setSelectedEvent(evt)}
              onOpenScheduleModal={() => {
                setScheduleInitialDate("");
                setShowScheduleModal(true);
              }}
            />
          )}
        </>
      )}

      {/* ═══ Modals ═══ */}
      {showScheduleModal && (
        <ScheduleEventModal
          isOpen={showScheduleModal}
          initialDate={scheduleInitialDate}
          projectId={currentProjId}
          companyId={currentCompId}
          onClose={() => setShowScheduleModal(false)}
          onSave={handleSaveCustomEvent}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onStatusChange={async (id, status) => {
            setEvents((prev) =>
              prev.map((e) =>
                e.id === id ? { ...e, status: status as any } : e,
              ),
            );
            toast.success(`Event marked as ${status}`);
          }}
        />
      )}
    </div>
  );
};

export default ConstructionPlanner;
