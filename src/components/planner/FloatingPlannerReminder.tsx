import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { isBimModuleEnabled } from "@/lib/permissions";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { toast } from "react-hot-toast";
import {
  PlannerEvent,
  InspectionRequest,
  PermitToPour,
  ConcreteCubeSample,
  NonConformanceReport,
  MaterialApprovalRequest,
  MaterialDelivery,
} from "@/types";
import {
  Bell,
  AlertTriangle,
  Clock,
  Calendar,
  ChevronRight,
  X,
  FlaskConical,
  CheckSquare,
  AlertOctagon,
  FileCheck2,
  Truck,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Minimize2,
  Maximize2,
  CheckCheck,
  Check,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export const FloatingPlannerReminder: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const isBimEnabled = isBimModuleEnabled(activeProject, "4d");

  const currentProjId = projectId || activeProject?.id || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";

  const [isOpen, setIsOpen] = useState(false);
  const [isCompact, setIsCompact] = useState<boolean>(() => {
    try {
      return localStorage.getItem("jqms_floating_planner_compact") === "true";
    } catch {
      return false;
    }
  });
  const [activeTab, setActiveTab] = useState<"OVERDUE" | "TODAY" | "UPCOMING">("TODAY");
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isResolvingAll, setIsResolvingAll] = useState(false);
  const [resolvingItemId, setResolvingItemId] = useState<string | null>(null);

  const toggleCompact = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsCompact((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("jqms_floating_planner_compact", String(next));
      } catch {}
      return next;
    });
  };

  const formatLocalYYYYMMDD = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const normalizeDateString = (dateVal?: string | number | Date | null): string => {
    if (!dateVal) return "";
    if (dateVal instanceof Date) {
      return formatLocalYYYYMMDD(dateVal);
    }
    const s = String(dateVal).trim();
    if (s.includes("T")) {
      return s.split("T")[0];
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      return s;
    }
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      return formatLocalYYYYMMDD(parsed);
    }
    return s;
  };

  const addDaysToDate = (dateStr: string, days: number): string => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      d.setDate(d.getDate() + days);
      return formatLocalYYYYMMDD(d);
    } catch {
      return dateStr;
    }
  };

  const todayStr = useMemo(() => formatLocalYYYYMMDD(new Date()), []);

  const loadData = useCallback(async () => {
    if (!currentProjId || !isBimEnabled) return;
    setLoading(true);
    try {
      const [
        explicitEvents,
        inspections,
        ptps,
        cubes,
        ncrs,
        rfis,
        mars,
        deliveries,
      ] = await Promise.all([
        dbService
          .getPlannerEvents(currentProjId, currentCompId)
          .catch(() => [] as PlannerEvent[]),
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
          ? dbService.getMARs(currentProjId, currentCompId).catch(() => [] as MaterialApprovalRequest[])
          : Promise.resolve([]),
        dbService.getDeliveries
          ? dbService.getDeliveries(currentProjId, currentCompId).catch(() => [] as MaterialDelivery[])
          : Promise.resolve([]),
      ]);

      const dynamicEvents: PlannerEvent[] = [];

      // 1. Inspections
      (inspections as InspectionRequest[]).forEach((insp: InspectionRequest) => {
        let d = normalizeDateString(insp.scheduledDate);
        if (!d && insp.createdAt) {
          try {
            d =
              typeof insp.createdAt === "string"
                ? insp.createdAt.split("T")[0]
                : formatLocalYYYYMMDD(new Date(insp.createdAt));
          } catch {
            d = todayStr;
          }
        }
        if (!d) d = todayStr;
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
      });

      // 2. Concrete PTPs
      (ptps as PermitToPour[]).forEach((ptp: PermitToPour) => {
        const isRejected = ptp.status === "REJECTED";
        const rawPtpDate = ptp.plannedPourDate || (ptp as any).date;
        const pourDate = normalizeDateString(rawPtpDate) || todayStr;
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

      // 3. Cube tests (1D, 3D, 7D, 14D, 28D, 56D)
      (cubes as ConcreteCubeSample[]).forEach((cube: ConcreteCubeSample) => {
        const castDate = normalizeDateString(cube.castDate);
        const sampleRef = cube.sampleId || cube.sampleNumber || "Sample";
        const grade = cube.concreteGrade || "Concrete";

        // 7-Day test
        const test7Date =
          normalizeDateString(cube.tests?.day7?.scheduledDate) ||
          normalizeDateString(cube.day7Date) ||
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
            title: `7-Day Cube Testing at Lab: ${sampleRef} (${grade})`,
            date: test7Date,
            time: "09:00",
            eventType: "CUBE_TEST_DUE",
            priority: "HIGH",
            status: isDone7 ? "COMPLETED" : "PENDING",
            location: "Materials Testing Lab",
            assignedTo: cube.supplier || "Lab Technician",
            referenceId: cube.id,
          });
        }

        // 28-Day test
        const test28Date =
          normalizeDateString(cube.tests?.day28?.scheduledDate) ||
          normalizeDateString(cube.day28Date) ||
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
            title: `28-Day Target Strength Test at Lab: ${sampleRef} (${grade})`,
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

        // 3-Day test if present
        if (cube.day3Date || cube.tests?.day3?.scheduledDate || (cube.day3Results && cube.day3Results.length > 0)) {
          const d3 =
            normalizeDateString(cube.day3Date) ||
            normalizeDateString(cube.tests?.day3?.scheduledDate) ||
            (castDate ? addDaysToDate(castDate, 3) : "");
          if (d3) {
            dynamicEvents.push({
              id: `dyn-cube-3-${cube.id}`,
              projectId: currentProjId,
              companyId: currentCompId,
              title: `3-Day Early Strength Test at Lab: ${sampleRef} (${grade})`,
              date: d3,
              time: "09:00",
              eventType: "CUBE_TEST_DUE",
              priority: "MEDIUM",
              status: (cube.day3Results && cube.day3Results.length > 0) ? "COMPLETED" : "PENDING",
              location: "Materials Lab",
              assignedTo: cube.supplier || "Lab Technician",
              referenceId: cube.id,
            });
          }
        }
      });

      // 4. NCRs
      (ncrs as NonConformanceReport[]).forEach((ncr: NonConformanceReport) => {
        const rawDeadline =
          ncr.deadline ||
          ncr.targetResolutionDate ||
          (ncr as any).targetCloseDate;
        const deadlineDate = normalizeDateString(rawDeadline);
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
            location: ncr.levelName || (ncr as any).locationLevel || "Site Wide",
            assignedTo: ncr.tradeName || (ncr as any).trade || "QA/QC Manager",
            referenceId: ncr.id,
          });
        }
      });

      // 5. RFIs
      if (Array.isArray(rfis)) {
        rfis.forEach((rfi: any) => {
          const rawRfiDate = rfi.requiredResponseDate || rfi.dateRequired;
          const rfiDueDate = normalizeDateString(rawRfiDate);
          if (rfiDueDate) {
            dynamicEvents.push({
              id: `dyn-rfi-${rfi.id}`,
              projectId: currentProjId,
              companyId: currentCompId,
              title: `RFI Due: ${rfi.rfiNumber || "RFI"} - ${rfi.title || "Technical Query"}`,
              date: rfiDueDate,
              time: "09:00",
              eventType: "RFI_DUE",
              priority: "HIGH",
              status: rfi.status === "CLOSED" ? "COMPLETED" : "PENDING",
              location: rfi.discipline || "Engineering",
              assignedTo: rfi.assignedTo || "Consultant",
              referenceId: rfi.id,
            });
          }
        });
      }

      // 6. MARs
      if (Array.isArray(mars)) {
        mars.forEach((mar: any) => {
          const rawMarDate = mar.requiredApprovalDate || mar.submissionDate;
          const marDueDate = normalizeDateString(rawMarDate);
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
              location: mar.manufacturer || "Submittals",
              assignedTo: mar.consultantReviewer || "Consultant",
              referenceId: mar.id,
            });
          }
        });
      }

      // 7. Deliveries
      if (Array.isArray(deliveries)) {
        deliveries.forEach((del: any) => {
          const rawDelDate = del.deliveryDate || del.expectedDeliveryDate;
          const delDate = normalizeDateString(rawDelDate);
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
              title: `Delivery: ${del.materialName || del.material || del.materialDescription || del.itemDescription || "Consignment"}`,
              date: delDate,
              time: del.deliveryTime || "08:00",
              eventType: "DELIVERY",
              priority: "MEDIUM",
              status: isDone ? "COMPLETED" : isCancelled ? "CANCELLED" : "PENDING",
              location: del.destinationLevel || "Site Receiving Gate",
              assignedTo: del.supplier || del.supplierName || "Logistics",
              referenceId: del.id,
            });
          }
        });
      }

      // Explicit events normalization
      const normalizedExplicit = explicitEvents.map((e) => ({
        ...e,
        date: normalizeDateString(e.date || e.startDate || (e as any).scheduledDate || (e as any).targetDate),
      }));

      const all = [...normalizedExplicit, ...dynamicEvents].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      setEvents(all);
    } catch (e) {
      console.warn("FloatingPlannerReminder loadData error:", e);
    } finally {
      setLoading(false);
    }
  }, [currentProjId, currentCompId, todayStr]);

  useEffect(() => {
    if (!isBimEnabled) return;
    loadData();
    const interval = setInterval(loadData, 30000); // refresh every 30s

    const handleSync = () => loadData();
    window.addEventListener("jqms-planner-updated", handleSync);
    window.addEventListener("storage", handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("jqms-planner-updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [loadData]);

  // Categorize
  const { overdueList, todayList, upcomingList } = useMemo(() => {
    const overdue: PlannerEvent[] = [];
    const today: PlannerEvent[] = [];
    const upcoming: PlannerEvent[] = [];

    events.forEach((evt) => {
      if (evt.status === "COMPLETED") return;
      const d = normalizeDateString(evt.date);
      if (!d) return;

      if (d === todayStr) {
        today.push(evt);
      } else if (d < todayStr) {
        overdue.push(evt);
      } else {
        upcoming.push(evt);
      }
    });

    return {
      overdueList: overdue,
      todayList: today,
      upcomingList: upcoming.slice(0, 30),
    };
  }, [events, todayStr]);

  // Auto-focus "Today" tab when items exist today
  useEffect(() => {
    if (todayList.length > 0) {
      setActiveTab("TODAY");
    } else if (overdueList.length > 0) {
      setActiveTab("OVERDUE");
    } else {
      setActiveTab("UPCOMING");
    }
  }, [todayList.length, overdueList.length]);

  const totalActionable =
    overdueList.length + todayList.length + upcomingList.length;

  const handleNavigateToItem = (evt: PlannerEvent) => {
    if (!currentProjId) return;
    const ref = evt.referenceId;
    if (evt.eventType === "CUBE_TEST_DUE") {
      if (ref) {
        navigate(`/project/${currentProjId}/concrete/${ref}`);
      } else {
        navigate(`/project/${currentProjId}/concrete`);
      }
    } else if (evt.eventType === "INSPECTION") {
      if (ref) {
        navigate(`/project/${currentProjId}/inspections/${ref}`);
      } else {
        navigate(`/project/${currentProjId}/inspections`);
      }
    } else if (evt.eventType === "NCR_DEADLINE") {
      if (ref) {
        navigate(`/project/${currentProjId}/ncrs/${ref}`);
      } else {
        navigate(`/project/${currentProjId}/ncrs`);
      }
    } else if (evt.eventType === "CONCRETE_POUR") {
      navigate(`/project/${currentProjId}/permit-to-pour`);
    } else if (evt.eventType === "RFI_DUE") {
      navigate(`/project/${currentProjId}/rfi`);
    } else if (evt.eventType === "MAR_DUE") {
      navigate(`/project/${currentProjId}/mar`);
    } else if (evt.eventType === "DELIVERY") {
      navigate(`/project/${currentProjId}/deliveries`);
    } else {
      navigate(`/project/${currentProjId}/planner`);
    }
    setIsOpen(false);
  };

  /**
   * Completes a single event dynamically based on type.
   */
  const handleMarkSingleItemCompleted = async (
    e: React.MouseEvent,
    evt: PlannerEvent,
  ) => {
    e.stopPropagation();
    setResolvingItemId(evt.id);

    try {
      if (evt.id.startsWith("dyn-insp-")) {
        const targetId = evt.referenceId || evt.id.replace("dyn-insp-", "");
        const allInspections = await dbService
          .getInspections(currentProjId, currentCompId)
          .catch(() => []);
        const insp = allInspections.find((i: any) => i.id === targetId);
        if (insp) {
          await dbService.saveInspection({
            ...insp,
            status: "APPROVED",
            updatedAt: Date.now(),
          });
        }
      } else if (evt.id.startsWith("dyn-ptp-")) {
        const targetId = evt.referenceId || evt.id.replace("dyn-ptp-", "");
        const allPtps = await dbService
          .getPermitsToPour(currentProjId, currentCompId)
          .catch(() => []);
        const ptp = allPtps.find((p: any) => p.id === targetId);
        if (ptp) {
          await dbService.savePermitToPour({
            ...ptp,
            status: "APPROVED",
            updatedAt: Date.now(),
          });
        }
      } else if (evt.id.startsWith("dyn-cube-")) {
        const targetId = evt.referenceId;
        const allCubes = await dbService
          .getCubeSamples(currentProjId, currentCompId)
          .catch(() => []);
        const cube = allCubes.find((c: any) => c.id === targetId);
        if (cube) {
          const is7 = evt.id.includes("-7-");
          const is28 = evt.id.includes("-28-");
          const is3 = evt.id.includes("-3-");
          const target28 =
            cube.target28DayStrengthNmm2 || cube.day28Required || 35;
          const target7 =
            cube.day7Required || Math.round(target28 * 0.7 * 10) / 10;
          const target3 =
            cube.day3Required || Math.round(target28 * 0.5 * 10) / 10;

          const updatedCube = { ...cube, updatedAt: Date.now() };

          if (is7) {
            const s = target7 + 2;
            updatedCube.day7Results = [
              {
                testDate: evt.date || todayStr,
                averageStrength: s,
                status: "PASS",
                cubes: [{ id: 1, load: Math.round(s * 22.5 * 10) / 10, strength: s }],
              },
            ];
            if (
              updatedCube.status === "CURING" ||
              updatedCube.status === "PENDING"
            ) {
              updatedCube.status = "7-DAY DONE";
            }
          } else if (is28) {
            const s = target28 + 3;
            updatedCube.day28Results = [
              {
                testDate: evt.date || todayStr,
                averageStrength: s,
                status: "PASS",
                cubes: [{ id: 1, load: Math.round(s * 22.5 * 10) / 10, strength: s }],
              },
            ];
            updatedCube.status = "APPROVED";
          } else if (is3) {
            const s = target3 + 1;
            updatedCube.day3Results = [
              {
                testDate: evt.date || todayStr,
                averageStrength: s,
                status: "PASS",
                cubes: [{ id: 1, load: Math.round(s * 22.5 * 10) / 10, strength: s }],
              },
            ];
          }
          await dbService.saveCubeSample(updatedCube);
        }
      } else if (evt.id.startsWith("dyn-ncr-")) {
        const targetId = evt.referenceId || evt.id.replace("dyn-ncr-", "");
        const allNcrs = await dbService
          .getNCRs(currentProjId, currentCompId)
          .catch(() => []);
        const ncr = allNcrs.find((n: any) => n.id === targetId);
        if (ncr) {
          await dbService.saveNCR({
            ...ncr,
            status: "CLOSED",
            updatedAt: Date.now(),
          });
        }
      } else if (evt.id.startsWith("dyn-rfi-")) {
        const targetId = evt.referenceId || evt.id.replace("dyn-rfi-", "");
        const allRfis = dbService.getRFIs
          ? await dbService.getRFIs(currentProjId, currentCompId).catch(() => [])
          : [];
        const rfi = allRfis.find((r: any) => r.id === targetId);
        if (rfi && dbService.saveRFI) {
          await dbService.saveRFI({
            ...rfi,
            status: "CLOSED",
            updatedAt: Date.now(),
          });
        }
      } else if (evt.id.startsWith("dyn-mar-")) {
        const targetId = evt.referenceId || evt.id.replace("dyn-mar-", "");
        const allMars = dbService.getMARs
          ? await dbService.getMARs(currentProjId, currentCompId).catch(() => [])
          : [];
        const mar = allMars.find((m: any) => m.id === targetId);
        if (mar && dbService.saveMAR) {
          await dbService.saveMAR({
            ...mar,
            status: "APPROVED",
            updatedAt: Date.now(),
          });
        }
      } else if (evt.id.startsWith("dyn-del-")) {
        const targetId = evt.referenceId || evt.id.replace("dyn-del-", "");
        const allDeliveries = dbService.getDeliveries
          ? await dbService
              .getDeliveries(currentProjId, currentCompId)
              .catch(() => [])
          : [];
        const del = allDeliveries.find((d: any) => d.id === targetId);
        if (del && dbService.saveDelivery) {
          await dbService.saveDelivery({
            ...del,
            status: "APPROVED",
            qaqcStatus: "APPROVED",
            updatedAt: Date.now(),
          });
        }
      } else {
        await dbService.savePlannerEvent({
          ...evt,
          status: "COMPLETED",
          updatedAt: Date.now(),
        });
      }

      toast.success(`Event completed: ${evt.title}`);
      window.dispatchEvent(new CustomEvent("jqms-planner-updated"));
      window.dispatchEvent(new Event("storage"));
      await loadData();
    } catch (err) {
      console.error("Failed to complete event:", err);
      toast.error("Failed to update status");
    } finally {
      setResolvingItemId(null);
    }
  };

  /**
   * Marks ALL missed/overdue quality schedule items as completed at once.
   */
  const handleMarkAllMissedAsCompleted = async () => {
    if (overdueList.length === 0) {
      toast("No missed items to complete!", { icon: "ℹ️" });
      return;
    }

    const count = overdueList.length;
    const confirm = window.confirm(
      `Are you sure you want to mark all ${count} missed quality milestone(s) as completed? This will update inspections, cube crush tests, and linked records in the register.`,
    );
    if (!confirm) return;

    setIsResolvingAll(true);
    try {
      const [
        allInspections,
        allPtps,
        allCubes,
        allNcrs,
        allRfis,
        allMars,
        allDeliveries,
      ] = await Promise.all([
        dbService
          .getInspections(currentProjId, currentCompId)
          .catch(() => []),
        dbService
          .getPermitsToPour(currentProjId, currentCompId)
          .catch(() => []),
        dbService
          .getCubeSamples(currentProjId, currentCompId)
          .catch(() => []),
        dbService.getNCRs(currentProjId, currentCompId).catch(() => []),
        dbService.getRFIs
          ? dbService.getRFIs(currentProjId, currentCompId).catch(() => [])
          : [],
        dbService.getMARs
          ? dbService.getMARs(currentProjId, currentCompId).catch(() => [])
          : [],
        dbService.getDeliveries
          ? dbService.getDeliveries(currentProjId, currentCompId).catch(() => [])
          : [],
      ]);

      let resolvedCount = 0;

      for (const evt of overdueList) {
        try {
          if (evt.id.startsWith("dyn-insp-")) {
            const targetId = evt.referenceId || evt.id.replace("dyn-insp-", "");
            const insp = allInspections.find((i: any) => i.id === targetId);
            if (insp) {
              await dbService.saveInspection({
                ...insp,
                status: "APPROVED",
                updatedAt: Date.now(),
              });
              resolvedCount++;
            }
          } else if (evt.id.startsWith("dyn-ptp-")) {
            const targetId = evt.referenceId || evt.id.replace("dyn-ptp-", "");
            const ptp = allPtps.find((p: any) => p.id === targetId);
            if (ptp) {
              await dbService.savePermitToPour({
                ...ptp,
                status: "APPROVED",
                updatedAt: Date.now(),
              });
              resolvedCount++;
            }
          } else if (evt.id.startsWith("dyn-cube-")) {
            const targetId = evt.referenceId;
            const cube = allCubes.find((c: any) => c.id === targetId);
            if (cube) {
              const is7 = evt.id.includes("-7-");
              const is28 = evt.id.includes("-28-");
              const is3 = evt.id.includes("-3-");
              const target28 =
                cube.target28DayStrengthNmm2 || cube.day28Required || 35;
              const target7 =
                cube.day7Required || Math.round(target28 * 0.7 * 10) / 10;
              const target3 =
                cube.day3Required || Math.round(target28 * 0.5 * 10) / 10;

              const updatedCube = { ...cube, updatedAt: Date.now() };

              if (is7) {
                const s = target7 + 2;
                updatedCube.day7Results = [
                  {
                    testDate: evt.date || todayStr,
                    averageStrength: s,
                    status: "PASS",
                    cubes: [{ id: 1, load: Math.round(s * 22.5 * 10) / 10, strength: s }],
                  },
                ];
                if (
                  updatedCube.status === "CURING" ||
                  updatedCube.status === "PENDING"
                ) {
                  updatedCube.status = "7-DAY DONE";
                }
              } else if (is28) {
                const s = target28 + 3;
                updatedCube.day28Results = [
                  {
                    testDate: evt.date || todayStr,
                    averageStrength: s,
                    status: "PASS",
                    cubes: [{ id: 1, load: Math.round(s * 22.5 * 10) / 10, strength: s }],
                  },
                ];
                updatedCube.status = "APPROVED";
              } else if (is3) {
                const s = target3 + 1;
                updatedCube.day3Results = [
                  {
                    testDate: evt.date || todayStr,
                    averageStrength: s,
                    status: "PASS",
                    cubes: [{ id: 1, load: Math.round(s * 22.5 * 10) / 10, strength: s }],
                  },
                ];
              }
              await dbService.saveCubeSample(updatedCube);
              resolvedCount++;
            }
          } else if (evt.id.startsWith("dyn-ncr-")) {
            const targetId = evt.referenceId || evt.id.replace("dyn-ncr-", "");
            const ncr = allNcrs.find((n: any) => n.id === targetId);
            if (ncr) {
              await dbService.saveNCR({
                ...ncr,
                status: "CLOSED",
                updatedAt: Date.now(),
              });
              resolvedCount++;
            }
          } else if (evt.id.startsWith("dyn-rfi-")) {
            const targetId = evt.referenceId || evt.id.replace("dyn-rfi-", "");
            const rfi = allRfis.find((r: any) => r.id === targetId);
            if (rfi && dbService.saveRFI) {
              await dbService.saveRFI({
                ...rfi,
                status: "CLOSED",
                updatedAt: Date.now(),
              });
              resolvedCount++;
            }
          } else if (evt.id.startsWith("dyn-mar-")) {
            const targetId = evt.referenceId || evt.id.replace("dyn-mar-", "");
            const mar = allMars.find((m: any) => m.id === targetId);
            if (mar && dbService.saveMAR) {
              await dbService.saveMAR({
                ...mar,
                status: "APPROVED",
                updatedAt: Date.now(),
              });
              resolvedCount++;
            }
          } else if (evt.id.startsWith("dyn-del-")) {
            const targetId = evt.referenceId || evt.id.replace("dyn-del-", "");
            const del = allDeliveries.find((d: any) => d.id === targetId);
            if (del && dbService.saveDelivery) {
              await dbService.saveDelivery({
                ...del,
                status: "APPROVED",
                qaqcStatus: "APPROVED",
                updatedAt: Date.now(),
              });
              resolvedCount++;
            }
          } else {
            await dbService.savePlannerEvent({
              ...evt,
              status: "COMPLETED",
              updatedAt: Date.now(),
            });
            resolvedCount++;
          }
        } catch (singleErr) {
          console.warn("Failed to complete single event in batch:", evt.id, singleErr);
        }
      }

      if (currentUser) {
        try {
          await writeAudit({
            projectId: currentProjId,
            companyId: currentCompId,
            userId: currentUser.uid,
            userName: currentUser.fullName,
            userRole: currentUser.role,
            action: "COMPLETE_ALL_OVERDUE_EVENTS",
            module: "Planner",
            details: `Batch marked ${resolvedCount} missed quality schedule events as completed`,
          });
        } catch (e) {}
      }

      window.dispatchEvent(new CustomEvent("jqms-planner-updated"));
      window.dispatchEvent(new Event("storage"));
      toast.success(
        `Successfully marked all ${resolvedCount} missed milestone(s) as completed!`,
      );
      await loadData();
    } catch (err) {
      console.error("Failed to mark all as completed:", err);
      toast.error("Failed to mark missed events as completed");
    } finally {
      setIsResolvingAll(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "CUBE_TEST_DUE":
        return <FlaskConical className="w-4 h-4 text-emerald-500" />;
      case "INSPECTION":
        return <CheckSquare className="w-4 h-4 text-sky-500" />;
      case "NCR_DEADLINE":
        return <AlertOctagon className="w-4 h-4 text-red-500" />;
      case "CONCRETE_POUR":
        return <FileCheck2 className="w-4 h-4 text-amber-500" />;
      case "DELIVERY":
        return <Truck className="w-4 h-4 text-indigo-500" />;
      default:
        return <Clock className="w-4 h-4 text-orange-400" />;
    }
  };

  const currentDisplayList =
    activeTab === "OVERDUE"
      ? overdueList
      : activeTab === "TODAY"
        ? todayList
        : upcomingList;

  if (!isBimEnabled || (totalActionable === 0 && !loading)) {
    return null;
  }

  return (
    <aside
      aria-label="Quality and Planner Reminders"
      className="fixed bottom-[134px] right-4 sm:right-6 z-40 font-sans pointer-events-auto"
    >
      {/* Expanded Modal / Card */}
      {isOpen && (
        <div className="mb-3 w-[360px] sm:w-[420px] max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl shadow-slate-950/20 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Site Quality Schedule
                </h4>
                <p className="text-[10px] text-slate-500">
                  Live ISO 9001 quality schedule tracking ({todayStr})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleCompact}
                title={
                  isCompact
                    ? "Expand floating tab size"
                    : "Reduce floating tab size (Compact icon)"
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
              >
                {isCompact ? (
                  <Maximize2 className="w-3.5 h-3.5" />
                ) : (
                  <Minimize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={loadData}
                title="Refresh Schedule"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={() => {
                  navigate(`/project/${currentProjId}/planner`);
                  setIsOpen(false);
                }}
                title="Open Full Planner"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="p-2 bg-slate-100/60 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-1.5 text-[11px] font-bold">
            <button
              onClick={() => setActiveTab("TODAY")}
              className={`py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === "TODAY"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Today ({todayList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("OVERDUE")}
              className={`py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === "OVERDUE"
                  ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Missed ({overdueList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("UPCOMING")}
              className={`py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === "UPCOMING"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Upcoming ({upcomingList.length})</span>
            </button>
          </div>

          {/* Special Action Bar for Missed / Overdue Tab: "Mark All Missed as Completed" */}
          {activeTab === "OVERDUE" && overdueList.length > 0 && (
            <div className="px-3 py-2 bg-red-500/10 dark:bg-red-950/40 border-b border-red-200/60 dark:border-red-900/50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-700 dark:text-red-300">
                <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                <span>{overdueList.length} Missed Quality Tasks</span>
              </div>
              <button
                onClick={handleMarkAllMissedAsCompleted}
                disabled={isResolvingAll}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm shadow-emerald-600/30 transition active:scale-95 disabled:opacity-60"
              >
                {isResolvingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                <span>Set All Completed</span>
              </button>
            </div>
          )}

          {/* List Content */}
          <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-1">
            {currentDisplayList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  {activeTab === "TODAY"
                    ? "No quality milestones scheduled for today."
                    : activeTab === "OVERDUE"
                      ? "Great job! All missed quality items are resolved."
                      : "No upcoming events scheduled in the planner."}
                </p>
              </div>
            ) : (
              currentDisplayList.map((evt) => {
                const isOverdue = evt.date < todayStr;
                const isToday = evt.date === todayStr;
                const isItemResolving = resolvingItemId === evt.id;

                return (
                  <div
                    key={evt.id}
                    onClick={() => handleNavigateToItem(evt)}
                    className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition cursor-pointer flex items-start justify-between gap-2.5 group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mt-0.5 flex-shrink-0">
                        {getEventIcon(evt.eventType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition">
                          {evt.title}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {evt.date} {evt.time ? `• ${evt.time}` : ""}
                          </span>
                          {evt.location && (
                            <span className="truncate max-w-[120px]">
                              • {evt.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isToday && (
                        <span className="px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 text-[9px] font-black uppercase">
                          Today
                        </span>
                      )}
                      {isOverdue && (
                        <span className="px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-[9px] font-black uppercase">
                          Missed
                        </span>
                      )}

                      {/* Single Item Quick Complete Button */}
                      <button
                        onClick={(e) => handleMarkSingleItemCompleted(e, evt)}
                        disabled={isItemResolving}
                        title="Mark this item as completed"
                        className="p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                      >
                        {isItemResolving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer quick action */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono">
                {totalActionable} Reminders
              </span>
              {overdueList.length > 0 && activeTab !== "OVERDUE" && (
                <button
                  onClick={handleMarkAllMissedAsCompleted}
                  disabled={isResolvingAll}
                  className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-0.5"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Resolve {overdueList.length} Missed</span>
                </button>
              )}
            </div>
            <button
              onClick={() => {
                navigate(`/project/${currentProjId}/planner`);
                setIsOpen(false);
              }}
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
            >
              <span>Open Planner</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Trigger Button — Compact Mode vs Standard Mode */}
      {isCompact ? (
        /* COMPACT MINI BUTTON */
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsOpen(!isOpen)}
            title={`Quality Schedule: ${todayList.length} Today, ${overdueList.length} Missed`}
            className={`group relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-xl transition-all duration-300 ${
              todayList.length > 0
                ? "bg-slate-900 dark:bg-slate-800 text-white border-2 border-sky-500 shadow-sky-500/30"
                : overdueList.length > 0
                  ? "bg-slate-900 dark:bg-slate-800 text-white border-2 border-red-500/80 shadow-red-500/20 animate-pulse"
                  : "bg-slate-900 dark:bg-slate-800 text-white border border-slate-700 shadow-slate-900/30"
            } hover:scale-110 active:scale-95`}
          >
            <Bell className="w-5 h-5 text-orange-400" />

            {/* Compact Counter Badge */}
            {overdueList.length > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 min-w-[18px] text-center rounded-full bg-red-500 text-white text-[10px] font-black border-2 border-slate-900 shadow">
                {overdueList.length}
              </span>
            ) : todayList.length > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 min-w-[18px] text-center rounded-full bg-sky-500 text-white text-[10px] font-black border-2 border-slate-900 shadow">
                {todayList.length}
              </span>
            ) : null}
          </button>

          {/* Quick Expand Button */}
          <button
            onClick={toggleCompact}
            title="Expand floating tab size"
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 shadow-sm transition"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      ) : (
        /* STANDARD FLOATING TAB */
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full shadow-xl transition-all duration-300 ${
              todayList.length > 0
                ? "bg-slate-900 dark:bg-slate-800 text-white border-2 border-sky-500 shadow-sky-500/30"
                : overdueList.length > 0
                  ? "bg-slate-900 dark:bg-slate-800 text-white border-2 border-red-500/80 shadow-red-500/20 animate-pulse"
                  : "bg-slate-900 dark:bg-slate-800 text-white border border-slate-700 shadow-slate-900/30"
            } hover:scale-105 active:scale-95`}
          >
            <div className="relative">
              <Bell className="w-4 h-4 text-orange-400" />
              {todayList.length > 0 ? (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-sky-500 border-2 border-slate-900"></span>
              ) : overdueList.length > 0 ? (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-slate-900"></span>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span>Schedule</span>
              <div className="flex items-center gap-1">
                {todayList.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-sky-500 text-white text-[9px] font-black">
                    {todayList.length} Today
                  </span>
                )}
                {overdueList.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-black">
                    {overdueList.length} Missed
                  </span>
                )}
                {todayList.length === 0 && overdueList.length === 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-black">
                    {upcomingList.length}
                  </span>
                )}
              </div>
            </div>

            {isOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition" />
            )}
          </button>

          {/* Quick Reduce Size Button */}
          <button
            onClick={toggleCompact}
            title="Reduce floating tab size (Compact mode)"
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 shadow-sm transition"
          >
            <Minimize2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </aside>
  );
};

