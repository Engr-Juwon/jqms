import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useCompany } from "@/lib/companyHelper";
import { dbService } from "@/lib/db";
import {
  isUserEligibleForStakeholderRole,
  isQAQCUser,
  getRoleLevel,
  ROLE_TITLES,
  canApproveAndClose,
  getUserSigningTitle,
} from "@/lib/permissions";
import {
  AlertOctagon,
  Clock,
  HardHat,
  ClipboardCheck,
  FileCheck2,
  FileQuestion,
  BookOpen,
  FileWarning,
  Search,
  CheckCheck,
  X,
  ChevronRight,
  ExternalLink,
  Building2,
  User,
  Layers,
  ArrowUpDown,
  RefreshCw,
  PenTool,
  Check,
  BadgeCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { SignaturePad } from "@/components/common/SignaturePad";
import {
  PermitToPour,
  InspectionRequest,
  NonConformanceReport,
  MaterialApprovalRequest,
  MaterialInspectionReport,
  RequestForInformation,
  DailySiteLog,
  SiteInstruction,
  UserRole,
  SubmittalReviewCode,
  MIRInspectionDisposition,
} from "@/types";

export type ActionItemType =
  | "PTP"
  | "INSPECTION"
  | "NCR"
  | "MAR"
  | "MIR"
  | "RFI"
  | "DAILY_LOG"
  | "SITE_INSTRUCTION";

export interface UnifiedActionItem {
  id: string;
  type: ActionItemType;
  typeLabel: string;
  typeColor: string;
  typeIcon: React.ElementType;
  refNumber: string;
  title: string;
  subtitle: string;
  location?: string;
  levelName?: string;
  elementName?: string;
  tradeName?: string;
  submittedBy: string;
  submittedAt: number;
  dueDate?: string;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "NORMAL";
  status: string;
  statusBadgeColor: string;
  pendingRoleRequirement: string;
  canCurrentUserSign: boolean;
  deepLink: string;
  rawItem: any;
  details: Record<string, string | number | boolean | undefined>;
}

export const ActionCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { activeProject } = useProjectStore();
  const { company } = useCompany();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"MY_ACTIONS" | "ALL" | ActionItemType>("MY_ACTIONS");
  const [urgencyFilter, setUrgencyFilter] = useState<"ALL" | "CRITICAL" | "HIGH" | "OVERDUE">("ALL");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"URGENCY" | "NEWEST" | "OLDEST">("URGENCY");

  // Raw Data State
  const [ptpList, setPtpList] = useState<PermitToPour[]>([]);
  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [mars, setMars] = useState<MaterialApprovalRequest[]>([]);
  const [mirs, setMirs] = useState<MaterialInspectionReport[]>([]);
  const [rfis, setRfis] = useState<RequestForInformation[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailySiteLog[]>([]);
  const [siteInstructions, setSiteInstructions] = useState<SiteInstruction[]>([]);

  // Modals
  const [quickReviewItem, setQuickReviewItem] = useState<UnifiedActionItem | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [signingInProgress, setSigningInProgress] = useState(false);

  // Signature Form State for Review Modal
  const [signatureData, setSignatureData] = useState<string>("");
  const [signerName, setSignerName] = useState<string>(currentUser?.fullName || "");
  const [decisionVerdict, setDecisionVerdict] = useState<string>("APPROVED");
  const [decisionRemarks, setDecisionRemarks] = useState<string>("");
  const [consultantCode, setConsultantCode] = useState<"A" | "B" | "C">("A");

  const currentProjId = activeProject?.id || "";
  const currentCompId = currentUser?.companyId || company?.id || "";

  // Load all project registries in parallel
  const loadActionData = async (isManual = false) => {
    if (!currentProjId) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        loadedPtp,
        loadedInsp,
        loadedNcr,
        loadedMar,
        loadedMir,
        loadedRfi,
        loadedLogs,
        loadedSi,
      ] = await Promise.all([
        dbService.getPermitToPours(currentProjId, currentCompId).catch(() => []),
        dbService.getInspections(currentProjId, currentCompId).catch(() => []),
        dbService.getNCRs(currentProjId, currentCompId).catch(() => []),
        dbService.getMARs(currentProjId, currentCompId).catch(() => []),
        dbService.getMIRs(currentProjId, currentCompId).catch(() => []),
        dbService.getRFIs(currentProjId, currentCompId).catch(() => []),
        dbService.getDailySiteLogs(currentProjId, currentCompId).catch(() => []),
        dbService.getSiteInstructions(currentProjId, currentCompId).catch(() => []),
      ]);

      setPtpList(loadedPtp);
      setInspections(loadedInsp);
      setNcrs(loadedNcr);
      setMars(loadedMar);
      setMirs(loadedMir);
      setRfis(loadedRfi);
      setDailyLogs(loadedLogs);
      setSiteInstructions(loadedSi);
    } catch (err) {
      console.error("Error loading action center records:", err);
      toast.error("Failed to sync some project action records.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadActionData();
  }, [currentProjId, currentCompId]);

  // Transform all disparate items into a unified action pipeline
  const unifiedItems: UnifiedActionItem[] = useMemo(() => {
    if (!currentUser) return [];

    const items: UnifiedActionItem[] = [];
    const now = Date.now();
    const isQuality = isQAQCUser(currentUser);
    const userLvl = getRoleLevel(currentUser.role);

    // 1. PERMIT TO POUR (PTP)
    ptpList.forEach((ptp) => {
      const isApproved = ptp.status === "APPROVED" || ptp.status === "ISSUED";
      if (isApproved) return;

      const sigs = ptp.clearanceSignatures || {};
      const needsQAQC = !sigs.qaqcLeadEngineer?.signed;
      const needsCM = !sigs.siteEngineer?.signed;
      const needsConsultant = !sigs.consultantEngineer?.signed;
      const needsMEP = !sigs.mepCoordinator?.signed;

      let pendingRole = "Multi-Discipline Sign-Offs";
      let canSign = false;

      if (needsQAQC && isQuality) {
        pendingRole = "QA/QC Pre-Pour Card";
        canSign = true;
      } else if (needsCM && isUserEligibleForStakeholderRole(currentUser, "Site / Construction Manager")) {
        pendingRole = "Site / CM Pre-Pour Clearance";
        canSign = true;
      } else if (needsConsultant && isUserEligibleForStakeholderRole(currentUser, "Consultant")) {
        pendingRole = "Consultant Concurrence Stamp";
        canSign = true;
      } else if (needsMEP && isUserEligibleForStakeholderRole(currentUser, "MEP Coordinator")) {
        pendingRole = "MEP Embeds & Clearance";
        canSign = true;
      } else if (!needsQAQC && !needsCM && !needsConsultant && userLvl >= 4) {
        pendingRole = "Final Pour Authorization (PM)";
        canSign = true;
      } else {
        if (needsConsultant) pendingRole = "Pending Consultant Stamp";
        else if (needsQAQC) pendingRole = "Pending QA/QC Review";
        else if (needsCM) pendingRole = "Pending Construction Manager";
        else if (needsMEP) pendingRole = "Pending MEP Coordinator";
      }

      const submittedAt = typeof ptp.createdAt === "number" ? ptp.createdAt : new Date(ptp.createdAt || now).getTime();
      const isUrgentPour = ptp.plannedPourDate ? new Date(ptp.plannedPourDate).getTime() - now < 86400000 : false;

      items.push({
        id: `ptp-${ptp.id}`,
        type: "PTP",
        typeLabel: "Permit to Pour (PTP)",
        typeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        typeIcon: HardHat,
        refNumber: ptp.ptpNumber || "PTP",
        title: ptp.elementName || "Structural Concrete Pour",
        subtitle: `${ptp.levelName || "Level"} • Grade ${ptp.concreteGrade} (${ptp.targetVolumeM3} m³)`,
        location: ptp.levelName,
        levelName: ptp.levelName,
        elementName: ptp.elementName,
        tradeName: ptp.tradeName || "Concrete Works",
        submittedBy: ptp.issuedByName || "Site Engineer",
        submittedAt,
        dueDate: ptp.plannedPourDate ? `${ptp.plannedPourDate} @ ${ptp.plannedPourTime || "08:00"}` : undefined,
        urgency: isUrgentPour ? "CRITICAL" : "HIGH",
        status: ptp.status || "PENDING_APPROVAL",
        statusBadgeColor: "bg-amber-500 text-white",
        pendingRoleRequirement: pendingRole,
        canCurrentUserSign: canSign,
        deepLink: `/project/permit-to-pour/${ptp.id}`,
        rawItem: ptp,
        details: {
          "Planned Pour": `${ptp.plannedPourDate} @ ${ptp.plannedPourTime}`,
          "Target Volume": `${ptp.targetVolumeM3} m³`,
          "Concrete Grade": ptp.concreteGrade,
          "Slump Spec": `${ptp.slumpTargetMm} mm`,
          "Grid Axis": ptp.gridAxis || "N/A",
          "QA/QC Signed": sigs.qaqcLeadEngineer?.signed ? "Yes" : "Pending",
          "CM Signed": sigs.siteEngineer?.signed ? "Yes" : "Pending",
          "Consultant Signed": sigs.consultantEngineer?.signed ? "Yes" : "Pending",
        },
      });
    });

    // 2. INSPECTIONS & HOLD POINTS
    inspections.forEach((insp) => {
      const isClosed = insp.status === "APPROVED" || (insp.status as string) === "CLOSED" || insp.status === "REJECTED";
      if (isClosed) return;

      const isHoldPoint = insp.riskLevel === "CRITICAL" || (insp as any).type === "HOLD_POINT" || Boolean((insp as any).isHoldPoint);
      let canSign = false;
      let pendingRole = "QA/QC Inspection Review";

      if (isQuality && (insp.status === "SCHEDULED" || insp.status === "SUBMITTED" || (insp.status as string) === "PENDING_REVIEW")) {
        canSign = true;
        pendingRole = "QA/QC Hold-Point Release";
      } else if (isUserEligibleForStakeholderRole(currentUser, "Consultant") && (insp.status === "SUBMITTED" || (insp.status as string) === "PENDING_REVIEW")) {
        canSign = true;
        pendingRole = "Consultant Witness Stamp";
      } else if (userLvl >= 4 && insp.status === "SUBMITTED") {
        canSign = true;
        pendingRole = "Quality Manager Approval";
      } else {
        pendingRole = isHoldPoint ? "Consultant / QAQC Hold Point" : "QA/QC Check-sheet";
      }

      const submittedAt = typeof insp.createdAt === "number" ? insp.createdAt : new Date(insp.createdAt || now).getTime();
      const tradeLabel = (insp as any).tradeName || insp.trade || "General";
      const inspLocation = insp.levelName || insp.building || insp.floor || (insp as any).location || "Site";

      items.push({
        id: `insp-${insp.id}`,
        type: "INSPECTION",
        typeLabel: isHoldPoint ? "Hold Point Inspection" : "Work Inspection (WIR)",
        typeColor: isHoldPoint ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        typeIcon: ClipboardCheck,
        refNumber: insp.inspectionNumber || "IR",
        title: insp.templateName || `${tradeLabel} Inspection`,
        subtitle: `${insp.elementName || "Structural Element"} • ${tradeLabel}`,
        location: inspLocation,
        levelName: insp.levelName,
        elementName: insp.elementName,
        tradeName: tradeLabel,
        submittedBy: insp.inspector?.name || insp.inspectorName || "Inspector",
        submittedAt,
        dueDate: insp.scheduledDate ? `${insp.scheduledDate} ${insp.scheduledTime || ""}` : undefined,
        urgency: isHoldPoint ? "CRITICAL" : "MEDIUM",
        status: insp.status || "SCHEDULED",
        statusBadgeColor: "bg-blue-600 text-white",
        pendingRoleRequirement: pendingRole,
        canCurrentUserSign: canSign,
        deepLink: `/project/inspections/${insp.id}`,
        rawItem: insp,
        details: {
          "Inspection Trade": tradeLabel,
          "Stage": insp.stage || "Initial",
          "Inspection Type": isHoldPoint ? "Mandatory Hold Point (Clause 8.6)" : "Standard Checklist",
          "Checklist Items": insp.items ? `${insp.items.length} Points` : "Default",
          "Location": inspLocation,
        },
      });
    });

    // 3. NON-CONFORMANCE REPORTS (NCR)
    ncrs.forEach((ncr) => {
      if (ncr.status === "CLOSED") return;

      let canSign = false;
      let pendingRole = "Subcontractor CAPA Proposal";

      if (ncr.status === "OPEN" || ncr.status === "ISSUED") {
        if (userLvl >= 3 || isQuality) {
          canSign = true;
          pendingRole = "Subcontractor Disposition & CAPA";
        }
      } else if (ncr.status === "INVESTIGATING" || ncr.status === "ACTION_PROPOSED" || ncr.status === "REMEDIATION") {
        if (isQuality) {
          canSign = true;
          pendingRole = "QA/QC Rectification Verification";
        }
      } else if (ncr.status === "UNDER_REVIEW" || ncr.status === "VERIFIED") {
        if (canApproveAndClose(currentUser.role) || isQuality) {
          canSign = true;
          pendingRole = "Quality Director Final Closeout";
        }
      }

      const submittedAt = typeof ncr.createdAt === "number" ? ncr.createdAt : new Date(ncr.createdAt || now).getTime();
      const isCritical = ncr.severity === "CRITICAL" || ncr.severity === "HIGH";

      items.push({
        id: `ncr-${ncr.id}`,
        type: "NCR",
        typeLabel: `NCR (${ncr.severity || "Standard"})`,
        typeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        typeIcon: AlertOctagon,
        refNumber: ncr.ncrNumber || "NCR",
        title: ncr.title || ncr.description?.substring(0, 50) || "Non-Conformance Defect",
        subtitle: `${ncr.tradeName || ncr.trade || "Trade"} • ${ncr.specReference || "ISO 9001:2015 Clause 8.7"}`,
        location: ncr.locationLevel || ncr.levelName,
        levelName: ncr.levelName,
        elementName: ncr.elementName,
        tradeName: ncr.tradeName || ncr.trade,
        submittedBy: ncr.raisedBy?.name || ncr.raisedByName || "QA/QC Engineer",
        submittedAt,
        dueDate: ncr.deadline || ncr.targetResolutionDate || undefined,
        urgency: isCritical ? "CRITICAL" : "HIGH",
        status: ncr.status || "OPEN",
        statusBadgeColor: "bg-rose-600 text-white",
        pendingRoleRequirement: pendingRole,
        canCurrentUserSign: canSign,
        deepLink: `/project/ncrs/${ncr.id}`,
        rawItem: ncr,
        details: {
          "Severity": ncr.severity || "Medium",
          "Root Cause": ncr.rootCause || "Workmanship",
          "Spec Ref": ncr.specReference || "ISO 8.7",
          "Assigned To": ncr.assignedTo || "Subcontractor",
          "Element": ncr.elementName || "Site",
        },
      });
    });

    // 4. MATERIAL APPROVAL REQUESTS (MAR)
    mars.forEach((mar) => {
      const isClosed = mar.status === "APPROVED" || mar.status === "APPROVED_AS_NOTED" || mar.status === "REJECTED";
      if (isClosed) return;

      let canSign = false;
      let pendingRole = "Consultant Code A/B/C Review";

      if (isUserEligibleForStakeholderRole(currentUser, "Consultant") || isUserEligibleForStakeholderRole(currentUser, "Client Representative")) {
        canSign = true;
        pendingRole = "Consultant Approval Stamp";
      } else if (isQuality && userLvl >= 4) {
        canSign = true;
        pendingRole = "Quality Manager Endorsement";
      }

      const submittedAt = typeof mar.createdAt === "number" ? mar.createdAt : new Date(mar.createdAt || now).getTime();

      items.push({
        id: `mar-${mar.id}`,
        type: "MAR",
        typeLabel: "Material Approval (MAR)",
        typeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        typeIcon: FileCheck2,
        refNumber: mar.marNumber || "MAR",
        title: mar.title || "Material Submittal",
        subtitle: `${mar.supplierVendor || "Supplier"} • ${mar.tradeName || "Specification Compliance"}`,
        tradeName: mar.tradeName || mar.trade,
        submittedBy: mar.submittedByName || "Materials Engineer",
        submittedAt,
        dueDate: undefined,
        urgency: "MEDIUM",
        status: mar.status || "SUBMITTED",
        statusBadgeColor: "bg-emerald-600 text-white",
        pendingRoleRequirement: pendingRole,
        canCurrentUserSign: canSign,
        deepLink: `/project/mar/${mar.id}`,
        rawItem: mar,
        details: {
          "Category": mar.category || "General",
          "Supplier/Vendor": mar.supplierVendor || "N/A",
          "Manufacturer": mar.manufacturer || "N/A",
          "Spec Section": mar.specSection || mar.specificationRef || "General",
        },
      });
    });

    // 5. MATERIAL INSPECTION REPORTS (MIR)
    mirs.forEach((mir) => {
      const isClosed = mir.status === "ACCEPTED" || mir.status === "ACCEPTED_AS_NOTED" || mir.status === "REJECTED";
      if (isClosed) return;

      let canSign = false;
      let pendingRole = "Consultant / QAQC Delivery Stamp";

      if (isUserEligibleForStakeholderRole(currentUser, "Consultant") || isQuality) {
        canSign = true;
        pendingRole = "Consultant & QA/QC Site Inspection Disposition";
      }

      const submittedAt = typeof mir.createdAt === "number" ? mir.createdAt : new Date(mir.createdAt || now).getTime();

      items.push({
        id: `mir-${mir.id}`,
        type: "MIR",
        typeLabel: "Material Inspection (MIR)",
        typeColor: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
        typeIcon: ClipboardCheck,
        refNumber: mir.mirNumber || "MIR",
        title: mir.title || "Material Delivery Inspection",
        subtitle: `${mir.supplierVendor || "Supplier"} • ${mir.discipline || "Civil/Structural"}`,
        tradeName: mir.discipline,
        submittedBy: mir.inspectedBy?.name || mir.contractorSignOff?.name || "Materials Engineer",
        submittedAt,
        dueDate: undefined,
        urgency: "MEDIUM",
        status: mir.status || "SUBMITTED",
        statusBadgeColor: "bg-teal-600 text-white",
        pendingRoleRequirement: pendingRole,
        canCurrentUserSign: canSign,
        deepLink: `/project/mir/${mir.id}`,
        rawItem: mir,
        details: {
          "Discipline": mir.discipline,
          "Delivery Note": mir.deliveryNumber || "N/A",
          "Condition": mir.packagingCondition || "SATISFACTORY",
          "Mill Cert Provided": mir.millCertificateProvided ? "Yes" : "No",
          "MAR Ref": mir.marNumber || "N/A",
        },
      });
    });

    // 6. REQUESTS FOR INFORMATION (RFI)
    rfis.forEach((rfi) => {
      const isClosed = rfi.status === "CLOSED" || rfi.status === "RESPONDED";
      if (isClosed) return;

      let canSign = false;
      let pendingRole = "Consultant Engineering Clarification";

      if (isUserEligibleForStakeholderRole(currentUser, "Consultant") || userLvl >= 4) {
        canSign = true;
        pendingRole = "Consultant Official Response";
      }

      const submittedAt = typeof rfi.createdAt === "number" ? rfi.createdAt : new Date(rfi.createdAt || now).getTime();

      items.push({
        id: `rfi-${rfi.id}`,
        type: "RFI",
        typeLabel: "Technical Query (RFI)",
        typeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
        typeIcon: FileQuestion,
        refNumber: rfi.rfiNumber || "RFI",
        title: rfi.title || rfi.question || "Technical Clarification",
        subtitle: `${rfi.discipline || "Discipline"} • ${rfi.drawingNumber || rfi.drawingReference || "Drawing Ref"}`,
        location: rfi.levelName || rfi.locationLevel,
        submittedBy: rfi.raisedBy?.name || rfi.raisedByName || "Project Engineer",
        submittedAt,
        dueDate: rfi.requestedDueDate || undefined,
        urgency: rfi.hasCostImpact || rfi.hasScheduleImpact ? "HIGH" : "MEDIUM",
        status: rfi.status || "SUBMITTED",
        statusBadgeColor: "bg-sky-600 text-white",
        pendingRoleRequirement: pendingRole,
        canCurrentUserSign: canSign,
        deepLink: `/project/rfi/${rfi.id}`,
        rawItem: rfi,
        details: {
          "Discipline": rfi.discipline || "Structural",
          "Drawing #": rfi.drawingNumber || rfi.drawingReference || "N/A",
          "Cost Impact": rfi.hasCostImpact ? "Yes" : "No",
          "Schedule Impact": rfi.hasScheduleImpact ? "Yes" : "No",
          "Required By": rfi.requestedDueDate || "Standard SLA",
        },
      });
    });

    // 7. DAILY SITE LOGS (DIARY)
    dailyLogs.forEach((log) => {
      if (log.status === "APPROVED") return;

      const sigs = log.signOffs || {};
      const needsQAQC = !sigs["qaqc"]?.signed;
      const needsSafety = !sigs["safety"]?.signed;
      const needsConsultant = !sigs["consultant"]?.signed;
      const needsPM = !sigs["pm"]?.signed;

      let canSign = false;
      let pendingRole = "Daily Log Multi-Endorsement";

      if (needsQAQC && isQuality) {
        canSign = true;
        pendingRole = "QA/QC Daily Verification";
      } else if (needsSafety && isUserEligibleForStakeholderRole(currentUser, "Safety Manager")) {
        canSign = true;
        pendingRole = "HSE Daily Endorsement";
      } else if (needsConsultant && isUserEligibleForStakeholderRole(currentUser, "Consultant")) {
        canSign = true;
        pendingRole = "Consultant Walkthrough Endorsement";
      } else if (needsPM && userLvl >= 4) {
        canSign = true;
        pendingRole = "Project Manager Final Approval";
      }

      const submittedAt = typeof log.createdAt === "number" ? log.createdAt : new Date(log.createdAt || now).getTime();
      const logDate = log.generalConditions?.date || "Today";

      items.push({
        id: `log-${log.id}`,
        type: "DAILY_LOG",
        typeLabel: "Daily Site Diary",
        typeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
        typeIcon: BookOpen,
        refNumber: log.logNumber || `LOG-${logDate}`,
        title: `Site Diary — ${logDate}`,
        subtitle: `Weather: ${log.generalConditions?.weather || "Clear"} • Activities: ${log.activities?.length || 0}`,
        submittedBy: log.createdByName || "Site Engineer",
        submittedAt,
        urgency: "MEDIUM",
        status: log.status || "SUBMITTED",
        statusBadgeColor: "bg-indigo-600 text-white",
        pendingRoleRequirement: pendingRole,
        canCurrentUserSign: canSign,
        deepLink: `/project/daily-logs/${log.id}`,
        rawItem: log,
        details: {
          "Date": logDate,
          "Activities Logged": log.activities?.length || 0,
          "Weather": log.generalConditions?.weather || "Normal",
          "QA/QC Signed": sigs["qaqc"]?.signed ? "Yes" : "Pending",
          "Safety Signed": sigs["safety"]?.signed ? "Yes" : "Pending",
          "PM Signed": sigs["pm"]?.signed ? "Yes" : "Pending",
        },
      });
    });

    // 8. SITE INSTRUCTIONS (SI)
    siteInstructions.forEach((si) => {
      if (si.status === "ACKNOWLEDGED" || si.status === "COMPLIED" || si.status === "CANCELLED" || (si.status as string) === "CLOSED") return;

      let canSign = false;
      let pendingRole = "Contractor Acknowledgment";

      if (userLvl >= 2 && !isUserEligibleForStakeholderRole(currentUser, "Consultant")) {
        canSign = true;
        pendingRole = "Contractor Receipt Acknowledgment";
      }

      const submittedAt = typeof si.createdAt === "number" ? si.createdAt : new Date(si.createdAt || now).getTime();

      items.push({
        id: `si-${si.id}`,
        type: "SITE_INSTRUCTION",
        typeLabel: "Site Instruction (SI)",
        typeColor: "bg-amber-600/10 text-amber-700 dark:text-amber-300 border-amber-600/20",
        typeIcon: FileWarning,
        refNumber: si.instructionNumber || "SI",
        title: si.title || si.subject || "Contractual Site Directive",
        subtitle: `${si.contractualClause || "ISO 9001:2015 Clause 8.7 & 10.2"}`,
        location: si.location || si.levelName,
        submittedBy: si.signedBy?.name || "Quality Authority",
        submittedAt,
        dueDate: si.complianceDeadline || undefined,
        urgency: si.stopWorkOrdered ? "CRITICAL" : "HIGH",
        status: si.status || "ISSUED",
        statusBadgeColor: "bg-amber-600 text-white",
        pendingRoleRequirement: pendingRole,
        canCurrentUserSign: canSign,
        deepLink: `/project/site-instructions/${si.id}`,
        rawItem: si,
        details: {
          "Directives": `${si.mandatoryActions?.length || 1} Action Points`,
          "Stop Work Ordered": si.stopWorkOrdered ? "YES (CRITICAL)" : "No",
          "Compliance Deadline": si.complianceDeadline || "Immediate",
          "Issued By": si.signedBy?.name || "Authority",
        },
      });
    });

    return items;
  }, [
    ptpList,
    inspections,
    ncrs,
    mars,
    mirs,
    rfis,
    dailyLogs,
    siteInstructions,
    currentUser,
  ]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return unifiedItems.filter((item) => {
      // Tab Filter
      if (activeTab === "MY_ACTIONS" && !item.canCurrentUserSign) return false;
      if (activeTab !== "ALL" && activeTab !== "MY_ACTIONS" && item.type !== activeTab) return false;

      // Urgency Filter
      if (urgencyFilter === "CRITICAL" && item.urgency !== "CRITICAL") return false;
      if (urgencyFilter === "HIGH" && item.urgency !== "CRITICAL" && item.urgency !== "HIGH") return false;
      if (urgencyFilter === "OVERDUE") {
        if (!item.dueDate) return false;
        const dueTime = new Date(item.dueDate).getTime();
        if (isNaN(dueTime) || dueTime >= Date.now()) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesRef = item.refNumber.toLowerCase().includes(query);
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesSub = item.subtitle.toLowerCase().includes(query);
        const matchesLocation = (item.location || "").toLowerCase().includes(query);
        const matchesRole = item.pendingRoleRequirement.toLowerCase().includes(query);
        const matchesSubm = item.submittedBy.toLowerCase().includes(query);
        if (!matchesRef && !matchesTitle && !matchesSub && !matchesLocation && !matchesRole && !matchesSubm) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "URGENCY") {
        const urgencyWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, NORMAL: 1 };
        const diff = urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
        if (diff !== 0) return diff;
        return b.submittedAt - a.submittedAt;
      }
      if (sortBy === "NEWEST") return b.submittedAt - a.submittedAt;
      return a.submittedAt - b.submittedAt;
    });
  }, [unifiedItems, activeTab, urgencyFilter, searchQuery, sortBy]);

  // Counts for Badges & KPI metrics
  const kpiStats = useMemo(() => {
    const totalMyAction = unifiedItems.filter((i) => i.canCurrentUserSign).length;
    const criticalHoldPoints = unifiedItems.filter(
      (i) => (i.type === "PTP" || i.type === "INSPECTION") && (i.urgency === "CRITICAL" || i.urgency === "HIGH"),
    ).length;
    const totalOverdue = unifiedItems.filter((i) => {
      if (!i.dueDate) return false;
      const due = new Date(i.dueDate).getTime();
      return !isNaN(due) && due < Date.now();
    }).length;
    const totalSubmittals = unifiedItems.filter(
      (i) => i.type === "MAR" || i.type === "MIR" || i.type === "RFI",
    ).length;

    return {
      totalMyAction,
      criticalHoldPoints,
      totalOverdue,
      totalSubmittals,
      totalAll: unifiedItems.length,
    };
  }, [unifiedItems]);

  // Checkbox toggle
  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const selectAllEligible = () => {
    const eligibleIds = filteredItems.filter((i) => i.canCurrentUserSign).map((i) => i.id);
    if (selectedItemIds.length === eligibleIds.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(eligibleIds);
    }
  };

  // Open Review modal for individual item
  const handleOpenQuickReview = (item: UnifiedActionItem) => {
    setQuickReviewItem(item);
    setSignatureData("");
    setDecisionVerdict("APPROVED");
    setDecisionRemarks("");
    setConsultantCode("A");
    setSignerName(currentUser?.fullName || "");
  };

  // Execute Individual Sign-Off / Approval
  const handleExecuteSingleSignOff = async () => {
    if (!quickReviewItem || !currentUser) return;
    setSigningInProgress(true);

    try {
      const nowIso = new Date().toISOString();
      const nowTs = Date.now();
      const userFullName = signerName || currentUser.fullName || "Authorized Signer";
      const userRole = currentUser.role || "QAQC_ENGINEER";
      const isQuality = isQAQCUser(currentUser);

      if (quickReviewItem.type === "PTP") {
        const ptp = { ...quickReviewItem.rawItem } as PermitToPour;
        const sigs = { ...(ptp.clearanceSignatures || {}) };

        if (isQuality) {
          sigs.qaqcLeadEngineer = { name: userFullName, signed: true, signedAt: nowIso };
        } else if (isUserEligibleForStakeholderRole(currentUser, "Consultant")) {
          sigs.consultantEngineer = { name: userFullName, signed: true, signedAt: nowIso };
        } else if (isUserEligibleForStakeholderRole(currentUser, "Site / Construction Manager")) {
          sigs.siteEngineer = { name: userFullName, signed: true, signedAt: nowIso };
        } else if (isUserEligibleForStakeholderRole(currentUser, "MEP Coordinator")) {
          sigs.mepCoordinator = { name: userFullName, signed: true, signedAt: nowIso };
        }

        if (decisionVerdict === "REJECTED") {
          ptp.status = "REJECTED";
        } else if (decisionVerdict === "APPROVED" && getRoleLevel(currentUser.role) >= 4) {
          ptp.status = "APPROVED";
        }

        ptp.clearanceSignatures = sigs;
        ptp.updatedAt = nowTs;
        await dbService.savePermitToPour(ptp);
      } else if (quickReviewItem.type === "INSPECTION") {
        const insp = { ...quickReviewItem.rawItem } as InspectionRequest;
        const approvals = [...(insp.approvals || [])];
        approvals.push({
          level: userRole,
          userId: currentUser.uid,
          date: nowIso,
          approved: decisionVerdict !== "REJECTED",
          comment: decisionRemarks,
        } as any);

        insp.approvals = approvals;
        insp.status = decisionVerdict === "REJECTED" ? "REJECTED" : decisionVerdict === "CONDITIONAL" ? "CONDITIONAL" : "APPROVED";
        insp.updatedAt = nowTs;
        await dbService.saveInspection(insp);
      } else if (quickReviewItem.type === "MAR") {
        const mar = { ...quickReviewItem.rawItem } as MaterialApprovalRequest;
        mar.status = consultantCode === "A" ? "APPROVED" : consultantCode === "B" ? "APPROVED_AS_NOTED" : "REJECTED";
        mar.reviewCode = (consultantCode === "A" ? "Code A" : consultantCode === "B" ? "Code B" : "Code C") as SubmittalReviewCode;
        mar.approvalCode = consultantCode === "A" ? "CODE_A" : consultantCode === "B" ? "CODE_B" : "CODE_C";
        mar.updatedAt = nowTs;
        await dbService.saveMAR(mar);
      } else if (quickReviewItem.type === "MIR") {
        const mir = { ...quickReviewItem.rawItem } as MaterialInspectionReport;
        const disp: MIRInspectionDisposition = (decisionVerdict === "REJECTED" ? "REJECTED" : decisionVerdict === "ACCEPTED_AS_NOTED" ? "ACCEPTED_AS_NOTED" : "ACCEPTED");
        mir.status = disp;
        mir.disposition = disp;
        mir.consultantSignOff = {
          name: userFullName,
          firm: "Supervising Consultant",
          date: nowIso,
          verdict: disp,
          comments: decisionRemarks,
          signed: true,
        };
        mir.updatedAt = nowTs;
        await dbService.saveMIR(mir);
      } else if (quickReviewItem.type === "NCR") {
        const ncr = { ...quickReviewItem.rawItem } as NonConformanceReport;
        if (ncr.status === "VERIFIED" || getRoleLevel(currentUser.role) >= 4) {
          ncr.status = "CLOSED";
        } else {
          ncr.status = "VERIFIED";
        }
        ncr.updatedAt = nowTs;
        await dbService.saveNCR(ncr);
      } else if (quickReviewItem.type === "RFI") {
        const rfi = { ...quickReviewItem.rawItem } as RequestForInformation;
        rfi.status = "RESPONDED";
        rfi.response = {
          responderName: userFullName,
          responderRole: userRole,
          responseDate: nowIso,
          responseText: decisionRemarks || "Technical clarification approved as noted.",
          approvalStatus: "APPROVED_AS_NOTED",
        };
        rfi.updatedAt = nowTs;
        await dbService.saveRFI(rfi);
      } else if (quickReviewItem.type === "DAILY_LOG") {
        const log = { ...quickReviewItem.rawItem } as DailySiteLog;
        const sigs = { ...(log.signOffs || {}) };

        if (isQuality) {
          sigs["qaqc"] = {
            role: "QAQC_ENGINEER",
            signed: true,
            signedBy: {
              uid: currentUser.uid,
              name: userFullName,
              designation: getUserSigningTitle(currentUser),
              timestamp: nowIso,
            },
          };
        } else if (isUserEligibleForStakeholderRole(currentUser, "Safety Manager")) {
          sigs["safety"] = {
            role: "SAFETY_OFFICER",
            signed: true,
            signedBy: {
              uid: currentUser.uid,
              name: userFullName,
              designation: getUserSigningTitle(currentUser),
              timestamp: nowIso,
            },
          };
        } else if (isUserEligibleForStakeholderRole(currentUser, "Consultant")) {
          sigs["consultant"] = {
            role: "CONSULTANT",
            signed: true,
            signedBy: {
              uid: currentUser.uid,
              name: userFullName,
              designation: getUserSigningTitle(currentUser),
              timestamp: nowIso,
            },
          };
        } else if (getRoleLevel(currentUser.role) >= 4) {
          sigs["pm"] = {
            role: "PROJECT_MANAGER",
            signed: true,
            signedBy: {
              uid: currentUser.uid,
              name: userFullName,
              designation: getUserSigningTitle(currentUser),
              timestamp: nowIso,
            },
          };
          log.status = "APPROVED";
        }

        log.signOffs = sigs;
        log.updatedAt = nowTs;
        await dbService.saveDailySiteLog(log);
      } else if (quickReviewItem.type === "SITE_INSTRUCTION") {
        const si = { ...quickReviewItem.rawItem } as SiteInstruction;
        si.status = "ACKNOWLEDGED";
        si.updatedAt = nowTs;
        await dbService.saveSiteInstruction(si);
      }

      toast.success(`Successfully signed & stamped ${quickReviewItem.refNumber}!`);
      setQuickReviewItem(null);
      loadActionData(true);
    } catch (err) {
      console.error("Sign-off error:", err);
      toast.error("Failed to apply sign-off. Please check permissions.");
    } finally {
      setSigningInProgress(false);
    }
  };

  // Execute Batch Approval across all selected items
  const handleExecuteBatchSignOff = async () => {
    if (selectedItemIds.length === 0 || !currentUser) return;
    setSigningInProgress(true);

    const itemsToSign = unifiedItems.filter(
      (item) => selectedItemIds.includes(item.id) && item.canCurrentUserSign,
    );

    if (itemsToSign.length === 0) {
      toast.error("None of the selected items can be signed by your current role.");
      setSigningInProgress(false);
      return;
    }

    try {
      const nowIso = new Date().toISOString();
      const nowTs = Date.now();
      const userFullName = signerName || currentUser.fullName || "Authorized Signer";
      const userRole = currentUser.role || "QAQC_ENGINEER";
      const isQuality = isQAQCUser(currentUser);

      await Promise.all(
        itemsToSign.map(async (item) => {
          if (item.type === "PTP") {
            const ptp = { ...item.rawItem } as PermitToPour;
            const sigs = { ...(ptp.clearanceSignatures || {}) };
            if (isQuality) sigs.qaqcLeadEngineer = { name: userFullName, signed: true, signedAt: nowIso };
            else if (isUserEligibleForStakeholderRole(currentUser, "Consultant")) sigs.consultantEngineer = { name: userFullName, signed: true, signedAt: nowIso };
            else if (isUserEligibleForStakeholderRole(currentUser, "Site / Construction Manager")) sigs.siteEngineer = { name: userFullName, signed: true, signedAt: nowIso };
            else if (isUserEligibleForStakeholderRole(currentUser, "MEP Coordinator")) sigs.mepCoordinator = { name: userFullName, signed: true, signedAt: nowIso };

            if (getRoleLevel(currentUser.role) >= 4) ptp.status = "APPROVED";
            ptp.clearanceSignatures = sigs;
            ptp.updatedAt = nowTs;
            return dbService.savePermitToPour(ptp);
          } else if (item.type === "INSPECTION") {
            const insp = { ...item.rawItem } as InspectionRequest;
            const approvals = [...(insp.approvals || [])];
            approvals.push({
              level: userRole,
              userId: currentUser.uid,
              date: nowIso,
              approved: true,
              comment: decisionRemarks || "Batch hold-point verification approved.",
            } as any);
            insp.approvals = approvals;
            insp.status = "APPROVED";
            insp.updatedAt = nowTs;
            return dbService.saveInspection(insp);
          } else if (item.type === "MAR") {
            const mar = { ...item.rawItem } as MaterialApprovalRequest;
            mar.status = "APPROVED";
            mar.reviewCode = "Code A";
            mar.approvalCode = "CODE_A";
            mar.updatedAt = nowTs;
            return dbService.saveMAR(mar);
          } else if (item.type === "MIR") {
            const mir = { ...item.rawItem } as MaterialInspectionReport;
            mir.status = "ACCEPTED";
            mir.disposition = "ACCEPTED";
            mir.consultantSignOff = {
              name: userFullName,
              firm: "Supervising Consultant",
              date: nowIso,
              verdict: "ACCEPTED",
              comments: decisionRemarks || "Accepted batch delivery verification.",
              signed: true,
            };
            mir.updatedAt = nowTs;
            return dbService.saveMIR(mir);
          } else if (item.type === "DAILY_LOG") {
            const log = { ...item.rawItem } as DailySiteLog;
            const sigs = { ...(log.signOffs || {}) };
            if (isQuality) {
              sigs["qaqc"] = {
                role: "QAQC_ENGINEER",
                signed: true,
                signedBy: {
                  uid: currentUser.uid,
                  name: userFullName,
                  designation: getUserSigningTitle(currentUser),
                  timestamp: nowIso,
                },
              };
            } else if (isUserEligibleForStakeholderRole(currentUser, "Safety Manager")) {
              sigs["safety"] = {
                role: "SAFETY_OFFICER",
                signed: true,
                signedBy: {
                  uid: currentUser.uid,
                  name: userFullName,
                  designation: getUserSigningTitle(currentUser),
                  timestamp: nowIso,
                },
              };
            } else if (isUserEligibleForStakeholderRole(currentUser, "Consultant")) {
              sigs["consultant"] = {
                role: "CONSULTANT",
                signed: true,
                signedBy: {
                  uid: currentUser.uid,
                  name: userFullName,
                  designation: getUserSigningTitle(currentUser),
                  timestamp: nowIso,
                },
              };
            } else if (getRoleLevel(currentUser.role) >= 4) {
              sigs["pm"] = {
                role: "PROJECT_MANAGER",
                signed: true,
                signedBy: {
                  uid: currentUser.uid,
                  name: userFullName,
                  designation: getUserSigningTitle(currentUser),
                  timestamp: nowIso,
                },
              };
              log.status = "APPROVED";
            }
            log.signOffs = sigs;
            log.updatedAt = nowTs;
            return dbService.saveDailySiteLog(log);
          }
          return Promise.resolve();
        }),
      );

      toast.success(`Batch signed & approved ${itemsToSign.length} items successfully!`);
      setSelectedItemIds([]);
      setShowBatchModal(false);
      loadActionData(true);
    } catch (err) {
      console.error("Batch sign error:", err);
      toast.error("Error during batch signing. Some items may have failed.");
    } finally {
      setSigningInProgress(false);
    }
  };

  const userRoleKey = currentUser?.role as UserRole | undefined;
  const userRoleTitle = userRoleKey ? ROLE_TITLES[userRoleKey] || userRoleKey : "Authorized Signer";

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 pb-16">
      {/* 1. Header Banner & Quick Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/20 shrink-0">
            <CheckCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Unified Sign-Off & Action Center
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60">
                Live Action Queue
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Single-pane review queue for Permits to Pour, Inspections, Submittals, NCR Closures & Daily Logs.
            </p>
          </div>
        </div>

        {/* Refresh & Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadActionData(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition disabled:opacity-50"
            title="Sync latest project items"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>

          {selectedItemIds.length > 0 && (
            <button
              onClick={() => setShowBatchModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 animate-pulse"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Batch Sign ({selectedItemIds.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => {
            setActiveTab("MY_ACTIONS");
            setUrgencyFilter("ALL");
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === "MY_ACTIONS"
              ? "bg-brand-50/80 dark:bg-brand-950/40 border-brand-500/40 shadow-sm"
              : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-brand-600 dark:text-brand-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending My Action</span>
            <PenTool className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {kpiStats.totalMyAction}
            </span>
            {kpiStats.totalMyAction > 0 && (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                Action Required
              </span>
            )}
          </div>
        </div>

        <div
          onClick={() => {
            setActiveTab("ALL");
            setUrgencyFilter("CRITICAL");
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            urgencyFilter === "CRITICAL"
              ? "bg-purple-50/80 dark:bg-purple-950/40 border-purple-500/40 shadow-sm"
              : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Critical Hold-Points</span>
            <HardHat className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {kpiStats.criticalHoldPoints}
            </span>
            <span className="text-[10px] font-medium text-slate-500">PTP & Hold-Points</span>
          </div>
        </div>

        <div
          onClick={() => {
            setActiveTab("ALL");
            setUrgencyFilter("OVERDUE");
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            urgencyFilter === "OVERDUE"
              ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-500/40 shadow-sm"
              : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Overdue SLA</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {kpiStats.totalOverdue}
            </span>
            <span className="text-[10px] font-medium text-slate-500">&gt; 24h/48h Target</span>
          </div>
        </div>

        <div
          onClick={() => {
            setActiveTab("ALL");
            setUrgencyFilter("ALL");
          }}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            activeTab === "ALL" && urgencyFilter === "ALL"
              ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500/40 shadow-sm"
              : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Active Backlog</span>
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {kpiStats.totalAll}
            </span>
            <span className="text-[10px] font-medium text-slate-500">Across 7 Suites</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Category Filters Bar */}
      <div className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference #, element, location, trade, submitter..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          {/* Quick Select & Sort dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={selectAllEligible}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition whitespace-nowrap"
            >
              {selectedItemIds.length > 0 && selectedItemIds.length === filteredItems.filter((i) => i.canCurrentUserSign).length
                ? "Deselect All"
                : "Select All Eligible"}
            </button>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent outline-none cursor-pointer text-xs font-bold"
              >
                <option value="URGENCY">Urgency First</option>
                <option value="NEWEST">Newest Submitted</option>
                <option value="OLDEST">Oldest Submitted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 no-scrollbar text-xs font-bold">
          {[
            { id: "MY_ACTIONS", label: `My Action Required (${kpiStats.totalMyAction})`, icon: PenTool },
            { id: "ALL", label: `All Backlog (${kpiStats.totalAll})`, icon: Layers },
            { id: "PTP", label: "Permits to Pour", icon: HardHat },
            { id: "INSPECTION", label: "Inspections", icon: ClipboardCheck },
            { id: "NCR", label: "NCRs", icon: AlertOctagon },
            { id: "MAR", label: "Submittals (MAR)", icon: FileCheck2 },
            { id: "MIR", label: "Deliveries (MIR)", icon: ClipboardCheck },
            { id: "RFI", label: "Technical RFIs", icon: FileQuestion },
            { id: "DAILY_LOG", label: "Daily Logs", icon: BookOpen },
            { id: "SITE_INSTRUCTION", label: "Site Instructions", icon: FileWarning },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? "bg-brand-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Action Center Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-16 text-center space-y-3 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Aggregating project approvals & action queue...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center space-y-4 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <BadgeCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">All Clear! No Pending Actions</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {activeTab === "MY_ACTIONS"
                  ? "You have completed all pending sign-offs, witness stamps, and authorizations matching your role."
                  : "No pending records matching the selected category and urgency criteria."}
              </p>
            </div>
            {activeTab !== "ALL" && (
              <button
                onClick={() => {
                  setActiveTab("ALL");
                  setUrgencyFilter("ALL");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                View Full Project Queue
              </button>
            )}
          </div>
        ) : (
          filteredItems.map((item) => {
            const Icon = item.typeIcon;
            const isSelected = selectedItemIds.includes(item.id);

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900/80 shadow-xs hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  item.canCurrentUserSign
                    ? "border-amber-400/60 dark:border-amber-500/40 ring-1 ring-amber-500/10"
                    : "border-slate-200 dark:border-slate-800"
                } ${isSelected ? "bg-brand-50/40 dark:bg-brand-950/20 border-brand-500" : ""}`}
              >
                {/* Left section: Checkbox + Icon + Details */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Select Checkbox (only if eligible) */}
                  <div className="pt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!item.canCurrentUserSign}
                      onChange={() => toggleSelectItem(item.id)}
                      className="w-4 h-4 rounded accent-brand-600 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Type Icon Badge */}
                  <div
                    className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${item.typeColor}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Main Content */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-slate-900 dark:text-white">
                        {item.refNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${item.typeColor}`}>
                        {item.typeLabel}
                      </span>
                      {item.urgency === "CRITICAL" && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white animate-pulse">
                          CRITICAL HOLD-POINT
                        </span>
                      )}
                      {item.canCurrentUserSign && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <PenTool className="w-3 h-3" />
                          <span>Action Needed By You</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {item.subtitle}
                    </p>

                    {/* Metadata chips */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Submitted by: <strong>{item.submittedBy}</strong></span>
                      </span>
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{item.location}</span>
                        </span>
                      )}
                      {item.dueDate && (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                          <Clock className="w-3 h-3" />
                          <span>Target: {item.dueDate}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right section: Requirement + Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-left md:text-right">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">
                      Required Action
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {item.pendingRoleRequirement}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.canCurrentUserSign ? (
                      <button
                        onClick={() => handleOpenQuickReview(item)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition active:scale-95 flex items-center gap-1.5"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>Quick Sign</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(item.deepLink)}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => navigate(item.deepLink)}
                      title="Open full page"
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================= */}
      {/* 5. QUICK REVIEW & SIGN-OFF MODAL                          */}
      {/* ========================================================= */}
      {quickReviewItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${quickReviewItem.typeColor}`}>
                  <quickReviewItem.typeIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-brand-600 dark:text-brand-400">
                      {quickReviewItem.refNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {quickReviewItem.typeLabel}
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white truncate max-w-md">
                    {quickReviewItem.title}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setQuickReviewItem(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Specification Grid */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Document Specifications & Context
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(quickReviewItem.details).map(([key, val]) => (
                    <div key={key}>
                      <span className="text-[10px] text-slate-400 block font-medium">{key}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {String(val ?? "N/A")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Code selection for MAR */}
              {quickReviewItem.type === "MAR" && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Consultant Review Stamp / Code Verdict
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { code: "A", label: "Code A — Approved", desc: "Meets specifications unconditionally." },
                      { code: "B", label: "Code B — Approved as Noted", desc: "Proceed subject to compliance notes." },
                      { code: "C", label: "Code C — Rejected / Resubmit", desc: "Non-compliant with contract specs." },
                    ].map((opt) => (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => setConsultantCode(opt.code as any)}
                        className={`p-3 rounded-2xl border text-left transition ${
                          consultantCode === opt.code
                            ? "bg-brand-50/80 dark:bg-brand-950/60 border-brand-500 shadow-xs"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <span className="font-black text-sm text-slate-900 dark:text-white block">
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                          {opt.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Disposition Verdict Selector (for PTP, Inspections, NCR) */}
              {quickReviewItem.type !== "MAR" && quickReviewItem.type !== "RFI" && quickReviewItem.type !== "SITE_INSTRUCTION" && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Disposition Verdict
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDecisionVerdict("APPROVED")}
                      className={`flex-1 py-2 rounded-xl font-bold text-xs border transition ${
                        decisionVerdict === "APPROVED"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      ✓ Approve / Pass
                    </button>
                    {quickReviewItem.type === "INSPECTION" && (
                      <button
                        type="button"
                        onClick={() => setDecisionVerdict("CONDITIONAL")}
                        className={`flex-1 py-2 rounded-xl font-bold text-xs border transition ${
                          decisionVerdict === "CONDITIONAL"
                            ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                            : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        ⚠ Conditional Pass
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDecisionVerdict("REJECTED")}
                      className={`flex-1 py-2 rounded-xl font-bold text-xs border transition ${
                        decisionVerdict === "REJECTED"
                          ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      ✕ Reject / Defect
                    </button>
                  </div>
                </div>
              )}

              {/* Remarks / Comments Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Engineering Remarks / Conditions / Notes
                </label>
                <textarea
                  rows={2}
                  value={decisionRemarks}
                  onChange={(e) => setDecisionRemarks(e.target.value)}
                  placeholder="Optional review observations, hold-point clearance remarks, or instructions..."
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition"
                />
              </div>

              {/* Signer Identity & Digital Signature */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Digital Signature & Statutory Authorization
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Authorized as: {userRoleTitle}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Signer Full Name"
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <SignaturePad
                    label="Draw Digital Stamp / Signature"
                    onSave={(dataUrl) => setSignatureData(dataUrl)}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => navigate(quickReviewItem.deepLink)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>Open Full Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuickReviewItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSingleSignOff}
                  disabled={signingInProgress}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {signingInProgress ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Authorize & Sign Document</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. BATCH SIGN-OFF MODAL                                   */}
      {/* ========================================================= */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Batch Sign & Authorize Selected Items
                  </h2>
                  <p className="text-xs text-slate-500">
                    Applying master digital authorization to {selectedItemIds.length} items.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs">
                <strong>Attention:</strong> Batch authorization applies your statutory digital signature across all {selectedItemIds.length} selected documents in a single atomic transaction.
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Batch Approval Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={decisionRemarks}
                  onChange={(e) => setDecisionRemarks(e.target.value)}
                  placeholder="e.g. Batch inspected and certified compliant with project specifications."
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <SignaturePad
                  label="Master Authorization Signature"
                  onSave={(dataUrl) => setSignatureData(dataUrl)}
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchSignOff}
                disabled={signingInProgress}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {signingInProgress ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing Batch ({selectedItemIds.length})...</span>
                  </>
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    <span>Sign All {selectedItemIds.length} Items</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ActionCenterPage;
