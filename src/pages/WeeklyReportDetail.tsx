import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  FileText,
  Trash2,
  Loader2,
  Upload,
  Plus,
  Percent,
  Grid3x3,
  X,
  Image as ImageIcon,
  MessageSquare,
  Check,
  Calendar,
  Filter,
  Images,
  ChevronDown,
  RefreshCw,
  Printer,
  CheckCircle2,
  Lock,
  FileCheck,
  Eye,
  EyeOff,
  Sparkles,
  Presentation,
  LayoutTemplate,
  Copy,
  MapPin,
  Building2,
  ShieldCheck,
  Layers,
  Download,
  Edit3,
  Package,
  AlertTriangle,
  XCircle,
  Truck,
  Mail,
  Palette,
} from "lucide-react";
import { WeeklyReportExecutiveMatrix } from "@/components/reporting/WeeklyReportExecutiveMatrix";
import { WeeklyReportSlideDeckModal } from "@/components/reporting/WeeklyReportSlideDeckModal";
import { EmailComposerModal, EmailAttachment } from "@/components/common/EmailComposerModal";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import {
  isUserEligibleForStakeholderRole,
  ROLE_TITLES,
} from "@/lib/permissions";
import { generateWeeklyPresentationPDF, generateNewWeeklyPresentationPDF } from "@/services/pdf/weeklyReportGenerator";
import { generateWeeklyReportPDF } from "@/lib/pdfGenerators";
import { toast } from "react-hot-toast";
import { MaterialDelivery, SiteInstruction, WeeklyReport } from "@/types";
import {
  WEEKLY_REPORT_TEMPLATES,
  WeeklyReportTemplateId,
  getWeeklyReportTemplate,
} from "@/types/weeklyReportTemplates";
import { uploadMultiple, getThumbnail } from "@/lib/cloudinary";
import { syncPhotoToSiteGallery } from "@/lib/photoSync";
import { MepClearanceRow } from "@/services/pdf/weeklyReportGenerator";

interface PictorialAsset {
  url: string;
  caption: string;
}

// ==========================================
// PHOTO GALLERY TYPES
// ==========================================

interface GalleryPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  takenAt?: number;
  createdAt?: number;
  [key: string]: any;
}

// ==========================================
// STATUS BADGE HELPER
// ==========================================

const getStatusBadgeClass = (status: string) => {
  const s = String(status || "")
    .trim()
    .toUpperCase();
  if (
    !s.includes("NON") &&
    (s === "COMPLIANT" ||
      s === "PASSED" ||
      s === "CLOSED" ||
      s === "APPROVED" ||
      s === "RECTIFIED" ||
      s === "FIXED")
  )
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (
    s.includes("NON") ||
    s === "ACTION REQUIRED" ||
    s === "OPEN" ||
    s === "REJECTED" ||
    s === "FAILED"
  )
    return "bg-red-100 text-red-800 border-red-200";
  if (
    s.includes("PROGESS") ||
    s.includes("PROGRESS") ||
    s === "PENDING" ||
    s === "UNDER REVIEW"
  )
    return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

// ==========================================
// SKELETON LOADER COMPONENT
// ==========================================

const PhotoSkeleton: React.FC = () => (
  <div className="aspect-[4/3] rounded-xl bg-slate-200 animate-pulse" />
);

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

const isDateInWeek = (val: any, start: number, end: number): boolean => {
  if (!val) return false;
  const t = resolveTimestamp(val);
  return t >= start && t <= end;
};

const isAnyDateInWeek = (
  start: number,
  end: number,
  ...dates: any[]
): boolean => {
  return dates.some((d) => isDateInWeek(d, start, end));
};

export const WeeklyReportDetail: React.FC = () => {
  const {
    id,
    reportId: paramReportId,
    projectId: paramProjId,
  } = useParams<{
    id?: string;
    reportId?: string;
    projectId?: string;
  }>();
  const reportId = id || paramReportId || "";
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

  // Synchronize active project in store if not currently set
  useEffect(() => {
    if (!activeProject && currentProjId && projects.length > 0) {
      const match = projects.find((p) => p.id === currentProjId);
      if (match) {
        setActiveProject(match);
      }
    }
  }, [activeProject, currentProjId, projects, setActiveProject]);

  const [projectPhotos, setProjectPhotos] = useState<GalleryPhoto[]>([]);
  const [photosLoading] = useState(false);
  const [rawDeliveries, setRawDeliveries] = useState<any[]>([]);
  const [rawCubeTests, setRawCubeTests] = useState<any[]>([]);
  const [rawSiteInstructions, setRawSiteInstructions] = useState<
    SiteInstruction[]
  >([]);

  // Presentation & Audit Scope Options
  const [includeNcrsAndComments, setIncludeNcrsAndComments] = useState(true);
  const [includeSiteInstructions, setIncludeSiteInstructions] = useState(true);

  // Print & Export Modal States
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<WeeklyReportTemplateId>("classic-executive");
  const [printOrientation, setPrintOrientation] = useState<
    "portrait" | "landscape"
  >("portrait");
  const [printIncludeNcrs, setPrintIncludeNcrs] = useState(true);
  const [printIncludeComments, setPrintIncludeComments] = useState(true);
  const [printIncludeSIs, setPrintIncludeSIs] = useState(true);

  // Email Modal States
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailAttachments, setEmailAttachments] = useState<EmailAttachment[]>([]);
  const [preparingEmail, setPreparingEmail] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshingDeliveries, setRefreshingDeliveries] = useState(false);
  const [refreshingCubes, setRefreshingCubes] = useState(false);
  // Cube import state
  const [showCubeImportPanel, setShowCubeImportPanel] = useState(false);
  const [pastReportsForImport, setPastReportsForImport] = useState<
    WeeklyReport[]
  >([]);
  const [loadingPastReportsForImport, setLoadingPastReportsForImport] =
    useState(false);
  const [importedCubeIds, setImportedCubeIds] = useState<Set<string>>(
    new Set(),
  );
  const [refreshingSiteInstructions, setRefreshingSiteInstructions] =
    useState(false);
  const [refreshingNcrs, setRefreshingNcrs] = useState(false);
  const [refreshingComments, setRefreshingComments] = useState(false);
  const [refreshingElements, setRefreshingElements] = useState(false);
  const [isSigningCompiler, setIsSigningCompiler] = useState(false);
  const [report, setReport] = useState<WeeklyReport>();

  const canUpdateReport = hasPermission(
    currentUser?.role,
    "GENERATE_WEEKLY_REPORT",
  );
  const canDeleteReport = hasPermission(
    currentUser?.role,
    "SIGN_WEEKLY_REPORT",
  );

  const [revisionNumber, setRevisionNumber] = useState<string>(
    "Rev 1.0 (Final Submission)",
  );
  const [reportTitle, setReportTitle] = useState<string>("");
  const [executiveSummary, setExecutiveSummary] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [highlights, setHighlights] = useState("");
  const [concerns, setConcerns] = useState("");
  const [nextWeekPlan, setNextWeekPlan] = useState("");
  const [remediationSummaryText, setRemediationSummaryText] = useState("");
  const [overallQualityCompliance, setOverallQualityCompliance] =
    useState<number>(100);

  const [mepClearance, setMepClearance] = useState<MepClearanceRow[]>([
    {
      elementService: "",
      subcontractor: "",
      completionPct: 0,
      status: "PENDING",
      remarks: "",
    },
  ]);

  const [beamLayoutImg, setBeamLayoutImg] = useState(
    "[COLOR-CODED STRUCTURAL ENGINEERING LAYOUT OVERLAY FOR BEAMS]",
  );
  const [columnLayoutImg, setColumnLayoutImg] = useState(
    "[COLOR-CODED STRUCTURAL ENGINEERING LAYOUT OVERLAY FOR COLUMNS]",
  );
  const [slabImg, setslabImg] = useState(
    "[COLOR-CODED STRUCTURAL ENGINEERING LAYOUT OVERLAY FOR SLAB]",
  );

  const [pictorialUrls, setPictorialUrls] = useState<PictorialAsset[]>([]);
  const [uploadingImage, setUploadingImage] = useState<number | string | null>(
    null,
  );

  // Gallery Picker Modal States
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<
    "beam" | "column" | "slab" | number | null
  >(null);
  const [filterByDates, setFilterByDates] = useState(true);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  // Structure Mode: "EXECUTIVE" (Command Matrix & Interactive Hub) or "CLASSIC" (13-Page Vertical Dossier)
  const [structureMode, setStructureMode] = useState<"CLASSIC" | "EXECUTIVE">(
    () => {
      const saved = localStorage.getItem("jqms_weekly_report_structure_mode");
      return saved === "CLASSIC" ? "CLASSIC" : "EXECUTIVE";
    },
  );
  const [isSlideDeckOpen, setIsSlideDeckOpen] = useState(false);

  const handleStructureChange = (mode: "CLASSIC" | "EXECUTIVE") => {
    setStructureMode(mode);
    localStorage.setItem("jqms_weekly_report_structure_mode", mode);
  };

  // ==========================================
  // DATA FETCHING
  // ==========================================

  useEffect(() => {
    async function loadReportAndData() {
      if (!reportId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await dbService.getWeeklyReport(reportId, currentProjId);
        if (!data) {
          toast.error("Weekly quality report not found");
          navigate(
            paramProjId
              ? `/project/${paramProjId}/weekly-reports`
              : "/project/weekly-reports",
          );
          return;
        }

        setReport(data);
        if (data.revisionNumber) {
          setRevisionNumber(data.revisionNumber);
        } else if ((data as any).revision) {
          setRevisionNumber((data as any).revision);
        }
        setReportTitle(
          data.title || "QAQC WEEKLY REPORT - 01 - FIRST FLOOR BANKSIDE",
        );
        setExecutiveSummary(data.executiveSummary || "");
        setSynopsis(data.synopsis || "");
        setHighlights(data.highlights || "");
        setConcerns(data.concerns || "");
        setNextWeekPlan(data.nextWeekPlan || "");
        setRemediationSummaryText(data.remediationSummaryText || "");
        setOverallQualityCompliance(
          typeof data.overallQualityCompliance === "number"
            ? data.overallQualityCompliance
            : parseFloat(String(data.overallQualityCompliance || 95)) || 95,
        );

        if (data.mepClearance && Array.isArray(data.mepClearance)) {
          setMepClearance(data.mepClearance);
        } else {
          setMepClearance([
            {
              elementService: "Electrical Conduit Piping",
              subcontractor: "Electrical Subcontractor",
              completionPct: 90,
              status: "PENDING",
              remarks:
                "Initial laying of conduit cables across active zones is completed. Final inspection of loop connections and box placements will be finalized on Monday morning.",
            },
            {
              elementService: "Plumbing Pipe Routing",
              subcontractor: "Plumbing Subcontractor",
              completionPct: 85,
              status: "IN PROGRESS",
              remarks:
                'First-fix routing for drainage lines is actively advancing. Approved local PVC pipe deliveries (2", 3", 4", and 6") are fully utilized for site tracking.',
            },
            {
              elementService: "Mechanical Service Ducts",
              subcontractor: "HVAC / Mechanical Subcontractor",
              completionPct: 75,
              status: "IN PROGRESS",
              remarks:
                "Penetrations and sleeve placements through structural beams are being verified against design layouts to avoid structural modifications post-cast.",
            },
            {
              elementService: "MEP Slab Penetrations",
              subcontractor: "Integrated Services Team",
              completionPct: 95,
              status: "APPROVED",
              remarks:
                "Floor sleeve positioning and vertical riser points are verified, anchored, and sealed against the formwork.",
            },
          ]);
        }

        if (data.beamLayoutImg) setBeamLayoutImg(data.beamLayoutImg);
        if (data.columnLayoutImg) setColumnLayoutImg(data.columnLayoutImg);
        if (data.slabImg) setslabImg(data.slabImg);

        if (data.pictorialUrls) {
          const formatted = data.pictorialUrls.map((item: any, idx: number) => {
            if (typeof item === "string") {
              return {
                url: item,
                caption: `Overview Viewport ${String.fromCharCode(65 + idx)}`,
              };
            }
            return { url: item.url || "", caption: item.caption || "" };
          });
          setPictorialUrls(formatted);
        } else {
          setPictorialUrls([{ url: "", caption: "Overview Viewport A" }]);
        }

        setIncludeNcrsAndComments(data.includeNcrsAndComments !== false);
        setIncludeSiteInstructions(data.includeSiteInstructions !== false);
        if (data.templateId && data.templateId in WEEKLY_REPORT_TEMPLATES) {
          setSelectedTemplate(data.templateId as WeeklyReportTemplateId);
        }
        if (data.printOrientation) {
          setPrintOrientation(data.printOrientation);
        }
        setPrintIncludeNcrs(
          (data as any).includeNcrs !== undefined
            ? (data as any).includeNcrs
            : data.includeNcrsAndComments !== false,
        );
        setPrintIncludeComments(
          (data as any).includeSiteComments !== undefined
            ? (data as any).includeSiteComments
            : data.includeNcrsAndComments !== false,
        );
        setPrintIncludeSIs(data.includeSiteInstructions !== false);

        const proj = data.projectId || currentProjId;
        const comp = data.companyId || currentCompId;
        if (proj) {
          const [photos, dels, cubes, instructions] = await Promise.all([
            dbService.getSitePhotos(proj, comp).catch(() => []),
            dbService.getDeliveries(proj, comp).catch(() => []),
            dbService.getCubeSamples(proj, comp).catch(() => []),
            dbService.getSiteInstructions(proj, comp).catch(() => []),
          ]);
          setProjectPhotos((photos as any) || []);
          setRawDeliveries(dels || []);
          setRawCubeTests(cubes || []);
          let resolvedSIs = data.siteInstructions;
          if (
            !resolvedSIs ||
            !Array.isArray(resolvedSIs) ||
            resolvedSIs.length === 0
          ) {
            let startMs = 0;
            if (data.weekStart) {
              const [sY, sM, sD] = data.weekStart.split("-").map(Number);
              startMs = new Date(sY, sM - 1, sD, 0, 0, 0, 0).getTime();
            }
            let endMs = Infinity;
            if (data.weekEnd) {
              const [eY, eM, eD] = data.weekEnd.split("-").map(Number);
              endMs = new Date(eY, eM - 1, eD, 23, 59, 59, 999).getTime();
            }
            const targetLevel = data.selectedLevelId || data.selectedLevel;

            resolvedSIs = (instructions || []).filter((si: any) => {
              const isIssuedInWeek = isAnyDateInWeek(
                startMs,
                endMs,
                si.createdAt,
                si.issuedDate,
                si.date,
                si.signedBy?.signedAt,
              );
              const st = String(si.status || "ISSUED")
                .trim()
                .toUpperCase();
              const isClosed =
                st === "CLOSED" ||
                st === "COMPLETED" ||
                st === "RESOLVED" ||
                st === "CANCELLED" ||
                Boolean(si.closedAt);
              const isOpen = !isClosed;
              const isClosedOrUpdatedInWeek = isAnyDateInWeek(
                startMs,
                endMs,
                si.updatedAt,
                si.modifiedAt,
                si.lastModified,
                si.closedAt,
                si.completedAt,
                si.resolvedAt,
                si.verifiedAt,
                si.signedAt,
                si.statusChangeDate,
                si.signedBy?.signedAt,
              );
              const siLevelId = si.levelId || "";
              const matchesLevel =
                !targetLevel ||
                targetLevel === "ALL" ||
                targetLevel.toLowerCase().includes("all") ||
                !siLevelId ||
                siLevelId === targetLevel ||
                si.level === targetLevel ||
                String(siLevelId).toLowerCase() ===
                  String(targetLevel).toLowerCase() ||
                String(si.level || "").toLowerCase() ===
                  String(targetLevel).toLowerCase();
              return (
                (isIssuedInWeek || isOpen || isClosedOrUpdatedInWeek) &&
                matchesLevel
              );
            });
          }
          setRawSiteInstructions(resolvedSIs || []);
        }
      } catch (err) {
        console.error("Error loading weekly report:", err);
        toast.error("Failed to load weekly quality report");
      } finally {
        setLoading(false);
      }
    }

    loadReportAndData();
  }, [reportId, currentProjId, currentCompId, navigate]);

  // ==========================================
  // HANDLERS
  // ==========================================
  // --- Place this at top level inside your component ---

  // Material Delivery row editing states
  const [editingDeliveryIdx, setEditingDeliveryIdx] = useState<number | null>(
    null,
  );
  const [editingDeliveryData, setEditingDeliveryData] = useState<
    Partial<MaterialDelivery>
  >({});

  const handleStartEditDelivery = (idx: number, item: any) => {
    setEditingDeliveryIdx(idx);
    setEditingDeliveryData({
      ...item,
      quantityReceived: item.quantityReceived ?? item.quantity,
      quantityAccepted:
        item.quantityAccepted !== undefined
          ? item.quantityAccepted
          : item.quantityReceived ?? item.quantity,
      quantityRejected: item.quantityRejected ?? 0,
      unit: item.unit || "",
      qaqcRemarks: item.qaqcRemarks || item.remarks || "",
      remarks: item.remarks || item.qaqcRemarks || "",
      rejectionReason: item.rejectionReason || "",
      status: item.status || item.qaqcStatus || "APPROVED",
    });
  };

  const handleSaveDeliveryRow = async () => {
    if (editingDeliveryIdx === null || !report) return;
    const currentList = report.materialDeliveries || [];
    const updatedDeliveries = [...currentList];
    const prevItem = updatedDeliveries[editingDeliveryIdx] || {};

    const updatedItem = {
      ...prevItem,
      ...editingDeliveryData,
      quantityReceived: editingDeliveryData.quantityReceived,
      quantityAccepted: editingDeliveryData.quantityAccepted,
      quantityRejected: editingDeliveryData.quantityRejected,
      unit: editingDeliveryData.unit || prevItem.unit || "",
      remarks:
        editingDeliveryData.remarks ||
        editingDeliveryData.qaqcRemarks ||
        "",
      qaqcRemarks:
        editingDeliveryData.remarks ||
        editingDeliveryData.qaqcRemarks ||
        "",
      rejectionReason: editingDeliveryData.rejectionReason || "",
      status: editingDeliveryData.status || prevItem.status || "APPROVED",
      qaqcStatus: editingDeliveryData.status || prevItem.qaqcStatus || "APPROVED",
    };

    updatedDeliveries[editingDeliveryIdx] = updatedItem;

    const updatedReport = {
      ...report,
      materialDeliveries: updatedDeliveries,
    };

    setReport(updatedReport);
    setEditingDeliveryIdx(null);
    setEditingDeliveryData({});

    try {
      await dbService.saveWeeklyReport(updatedReport as any);
      toast.success("Delivery entry updated and saved to report.");
    } catch (err) {
      console.error("Failed to save delivery edit:", err);
      toast.error("Failed to persist updated delivery.");
    }
  };

  const handleCancelEditDelivery = () => {
    setEditingDeliveryIdx(null);
    setEditingDeliveryData({});
  };

  // --- Handler inside component ---
  const handleRefreshMaterials = async () => {
    if (!report) return;
    setRefreshingDeliveries(true);

    try {
      const proj = report.projectId || currentProjId;
      const comp = report.companyId || currentCompId;

      // 1. Fetch fresh deliveries directly from database
      const freshDeliveries = await dbService.getDeliveries(proj, comp).catch(() => []);
      setRawDeliveries(freshDeliveries || []);

      const listToFilter = freshDeliveries && freshDeliveries.length > 0 ? freshDeliveries : rawDeliveries;

      // 2. Multi-format date parsing helper
      const parseDateMs = (dateVal: any, isEnd = false): number => {
        if (!dateVal) return isEnd ? Infinity : 0;
        if (typeof dateVal === "number") return dateVal;
        if (typeof dateVal === "string") {
          const str = dateVal.trim();
          if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
            const [y, m, d] = str.substring(0, 10).split("-").map(Number);
            return isEnd
              ? new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
              : new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
          }
          const slashParts = str.split(/[/-]/);
          if (slashParts.length === 3) {
            let d = Number(slashParts[0]);
            let m = Number(slashParts[1]);
            let y = Number(slashParts[2]);
            if (y < 100) y += 2000;
            if (m > 12 && d <= 12) {
              const tmp = m;
              m = d;
              d = tmp;
            }
            if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
              return isEnd
                ? new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
                : new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
            }
          }
          const parsed = new Date(str).getTime();
          if (!isNaN(parsed)) return parsed;
        }
        return isEnd ? Infinity : 0;
      };

      const startMs = parseDateMs(report.weekStart, false);
      const endMs = parseDateMs(report.weekEnd, true);

      // Filter by project and date window
      let filtered = (listToFilter || []).filter((item: any) => {
        if (item.projectId && item.projectId !== proj) return false;

        const rawDate = item.deliveryDate || item.date || item.timestamp || item.createdAt;
        const deliveryTime = parseDateMs(rawDate, false);

        if (startMs > 0 && endMs < Infinity && deliveryTime > 0) {
          return deliveryTime >= startMs && deliveryTime <= endMs;
        }
        return true;
      });

      // Fallback: If no items matched strict date boundaries, include project deliveries
      if (filtered.length === 0 && (listToFilter || []).length > 0) {
        filtered = (listToFilter || []).filter(
          (item: any) => !item.projectId || item.projectId === proj,
        );
      }

      const mapped = filtered.map((item: any) => ({
        id: item.id || item.key || `del-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        deliveryDate: item.deliveryDate || item.date || "N/A",
        materialName: item.materialName || item.materialDescription || item.name || "N/A",
        materialDescription: item.materialDescription || item.materialName || item.name || "N/A",
        supplier: item.supplier || item.supplierName || item.source || "N/A",
        supplierName: item.supplierName || item.supplier || item.source || "N/A",
        quantity: item.quantity || item.qty || "N/A",
        quantityReceived: item.quantityReceived !== undefined ? item.quantityReceived : (typeof item.quantity === "number" ? item.quantity : undefined),
        quantityAccepted: item.quantityAccepted !== undefined ? item.quantityAccepted : (item.quantityRejected !== undefined ? undefined : item.quantity),
        quantityRejected: item.quantityRejected ?? 0,
        unit: item.unit || "",
        batchNumber: item.batchNumber,
        deliveryNoteNumber: item.deliveryNoteNumber || item.deliveryNote,
        truckNumber: item.vehicleTruckNumber || item.truckNumber,
        trade: item.trade,
        status: item.status || item.qaqcStatus || "APPROVED",
        qaqcStatus: item.qaqcStatus || item.status || "APPROVED",
        rejectionReason: item.rejectionReason,
        ncrNumber: item.ncrNumber,
        ncrId: item.ncrId,
        remarks: item.remarks || item.qaqcRemarks || item.inspectionNotes || "Verified",
        qaqcRemarks: item.qaqcRemarks || item.remarks || item.inspectionNotes || "Verified",
      }));

      const updatedReport = {
        ...report,
        materialDeliveries: mapped,
      };

      setReport(updatedReport);

      // Auto-save synced deliveries to report database
      try {
        await dbService.saveWeeklyReport(updatedReport as any);
      } catch (saveErr) {
        console.warn("Auto-save report error after sync:", saveErr);
      }

      toast.success(
        `Synced! Found ${mapped.length} material delivery record(s).`,
        { id: "sync-deliveries-toast" },
      );
    } catch (err) {
      console.error("Error refreshing material deliveries:", err);
      toast.error("Failed to refresh material deliveries log.", { id: "sync-deliveries-toast" });
    } finally {
      setRefreshingDeliveries(false);
    }
  };

  const handleRefreshCubes = async () => {
    if (!report || !currentProjId) return;
    setRefreshingCubes(true);

    try {
      const targetLevel = report.selectedLevelId || report.selectedLevel;

      const filtered = rawCubeTests
        .filter((item: any) => {
          if (item.projectId && item.projectId !== currentProjId) return false;

          // Filter by level or levelId matching the cubeSample schema[cite: 5]
          if (targetLevel) {
            const itemLevel = item.levelId || item.level;
            if (itemLevel && itemLevel !== targetLevel) return false;
          }

          return true;
        })
        .map((item: any) => {
          // Support both legacy flat fields and nested result arrays from cubeSample[cite: 5]
          const d7 = item.day7Results?.[0] || {};
          const d28 = item.day28Results?.[0] || {};

          return {
            sampleId: item.sampleId || item.id || item.key || "CUB-001",
            dateCast: item.dateCast || item.date || "N/A",
            inscribedName: item.inscribedName,
            strength7Days:
              item.strength7Days ?? item.strength7 ?? d7.averageStrength ?? "",
            status7Days:
              item.status7Days || item.result7Days || d7.status || "",
            strength28Days:
              item.strength28Days ??
              item.strength28 ??
              d28.averageStrength ??
              "",
            status28Days:
              item.status28Days || item.result28Days || d28.status || "",
          };
        });

      setReport((prev) => (prev ? { ...prev, cubeTests: filtered } : prev));

      toast.success(
        `Refreshed! Found ${filtered.length} cube test item(s) for this level.`,
      );
    } catch (err) {
      console.error("Error refreshing cube tests:", err);
      toast.error("Failed to refresh cube test logs.");
    } finally {
      setRefreshingCubes(false);
    }
  };

  // ─── Structural Elements Refresh & Volume Handlers ────────────────────────

  const handleRefreshElements = async () => {
    if (!report || !currentProjId) return;
    setRefreshingElements(true);
    try {
      const allElems = await dbService
        .getElements(currentProjId, currentCompId)
        .catch(() => []);

      const selectedLevel = (
        report.selectedLevel ||
        (report as any).selectedLevelName ||
        ""
      ).toUpperCase();
      const levelId = report.selectedLevelId || "";

      const filtered = (allElems || []).filter((el: any) => {
        if (levelId && el.levelId === levelId) return true;
        const elLvl = (el.levelName || el.level || "").toUpperCase();
        if (selectedLevel && elLvl.includes(selectedLevel)) return true;
        return false;
      });

      const targetList = filtered.length > 0 ? filtered : allElems;
      const mapped = targetList.map((el: any) => {
        const calcVol = Number(el.calculatedVolume || el.volume || 0);
        const achVol = Number(
          el.achievedVolume ??
            (el.status === "POURED" ||
            el.status === "APPROVED" ||
            el.status === "COMPLETED"
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
            el.elementName ||
            el.name ||
            (el as any).element ||
            "Structural Element",
          elementType: el.elementType || el.type || "Component",
          status: el.status || "PENDING",
          volume: calcVol,
          calculatedVolume: calcVol,
          achievedVolume: achVol,
          completionPercentage: compPct,
          grid: el.grid || el.gridLocation || "",
          gridLocation: el.grid || el.gridLocation || "",
          levelName: el.levelName || el.level || selectedLevel,
          level: el.levelName || el.level || selectedLevel,
        };
      });

      // Recalculate volumetric groups & quantity summary
      const volumeGroups: Record<string, { total: number; completed: number }> =
        {};
      let totalCalcVol = 0;
      let totalAchVol = 0;

      mapped.forEach((el: any) => {
        const rawType = (el.elementType || el.type || "Component")
          .toUpperCase()
          .trim();
        if (!volumeGroups[rawType]) {
          volumeGroups[rawType] = { total: 0, completed: 0 };
        }
        volumeGroups[rawType].total += el.calculatedVolume;
        volumeGroups[rawType].completed += el.achievedVolume;
        totalCalcVol += el.calculatedVolume;
        totalAchVol += el.achievedVolume;
      });

      const updatedQtySummary = Object.entries(volumeGroups).map(
        ([type, data]) => {
          const pct =
            data.total > 0
              ? Math.round((data.completed / data.total) * 100)
              : 0;
          return {
            element: type,
            scope: `${data.total.toFixed(1)} CUM`,
            completion: `${pct}%`,
            calculatedVolume: Number(data.total.toFixed(2)),
            achievedVolume: Number(data.completed.toFixed(2)),
          };
        },
      );

      const overallPct =
        totalCalcVol > 0 ? Math.round((totalAchVol / totalCalcVol) * 100) : 0;

      setReport((prev) =>
        prev
          ? {
              ...prev,
              structuralElements: mapped,
              quantitySummary:
                updatedQtySummary.length > 0
                  ? updatedQtySummary
                  : prev.quantitySummary,
              totalVolumeCalculated: `${totalCalcVol.toFixed(1)} CUM`,
              overallQuantityCompletion: `${overallPct}%`,
            }
          : prev,
      );

      toast.success(
        `Synced ${mapped.length} structural element(s) with latest calculated and achieved volumes!`,
      );
    } catch (err) {
      console.error("Error refreshing structural elements:", err);
      toast.error("Failed to sync structural elements from registry.");
    } finally {
      setRefreshingElements(false);
    }
  };

  const handleUpdateElementVolume = (
    elementId: string,
    newAchievedVol: number,
  ) => {
    if (!report) return;
    const currentElements = (report as any).structuralElements || [];
    const updatedElements = currentElements.map((el: any) => {
      if (el.id === elementId || el.elementName === elementId) {
        const calcVol = Number(el.calculatedVolume || el.volume || 0);
        const safeAch = Math.max(0, newAchievedVol);
        const compPct =
          calcVol > 0
            ? Math.min(100, Math.max(0, Math.round((safeAch / calcVol) * 100)))
            : 0;
        const status =
          safeAch >= calcVol && calcVol > 0
            ? "APPROVED"
            : safeAch > 0
              ? "POURED"
              : el.status || "PENDING";
        return {
          ...el,
          achievedVolume: safeAch,
          completionPercentage: compPct,
          status,
        };
      }
      return el;
    });

    // Recalculate quantity summary
    const volumeGroups: Record<string, { total: number; completed: number }> =
      {};
    let totalCalcVol = 0;
    let totalAchVol = 0;

    updatedElements.forEach((el: any) => {
      const rawType = (el.elementType || el.type || "Component")
        .toUpperCase()
        .trim();
      const calcVol = Number(el.calculatedVolume || el.volume || 0);
      const achVol = Number(el.achievedVolume ?? 0);

      if (!volumeGroups[rawType]) {
        volumeGroups[rawType] = { total: 0, completed: 0 };
      }
      volumeGroups[rawType].total += calcVol;
      volumeGroups[rawType].completed += achVol;
      totalCalcVol += calcVol;
      totalAchVol += achVol;
    });

    const updatedQtySummary = Object.entries(volumeGroups).map(
      ([type, data]) => {
        const pct =
          data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
        return {
          element: type,
          scope: `${data.total.toFixed(1)} CUM`,
          completion: `${pct}%`,
          calculatedVolume: Number(data.total.toFixed(2)),
          achievedVolume: Number(data.completed.toFixed(2)),
        };
      },
    );

    const overallPct =
      totalCalcVol > 0 ? Math.round((totalAchVol / totalCalcVol) * 100) : 0;

    setReport({
      ...report,
      structuralElements: updatedElements,
      quantitySummary:
        updatedQtySummary.length > 0
          ? updatedQtySummary
          : report.quantitySummary,
      totalVolumeCalculated: `${totalCalcVol.toFixed(1)} CUM`,
      overallQuantityCompletion: `${overallPct}%`,
    });
  };

  // ─── Cube Import Handlers (Detail / Edit page) ───────────────────────────

  const handleOpenCubeImportPanel = async () => {
    if (showCubeImportPanel) {
      setShowCubeImportPanel(false);
      return;
    }
    setShowCubeImportPanel(true);
    if (pastReportsForImport.length > 0) return;
    setLoadingPastReportsForImport(true);
    try {
      const all = await dbService
        .getWeeklyReports(currentProjId, currentCompId)
        .catch(() => [] as WeeklyReport[]);
      // Exclude the current report and sort newest first
      const past = all
        .filter((r) => r.id !== reportId)
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
      setPastReportsForImport(past);
    } catch (_) {
      toast.error("Could not load past weekly reports.");
    } finally {
      setLoadingPastReportsForImport(false);
    }
  };

  const handleDetailImportFromReport = (selectedReport: WeeklyReport) => {
    const savedEntries: any[] = Array.isArray(selectedReport.cubeTests)
      ? (selectedReport.cubeTests as any[])
      : Array.isArray(selectedReport.filteredCubeTests)
        ? (selectedReport.filteredCubeTests as any[])
        : [];

    if (savedEntries.length === 0) {
      toast("No cube samples found on that week's report.", { icon: "ℹ️" });
      setShowCubeImportPanel(false);
      return;
    }

    // Ensures clean numbers or empty strings—never undefined or NaN
    const formatVal = (val: any): number | "" => {
      if (val === undefined || val === null || val === "" || val === "N/A")
        return "";
      const num = typeof val === "number" ? val : parseFloat(String(val));
      return isNaN(num) ? "" : Number(num.toFixed(2));
    };

    // Directly use the exact saved details from the selected report (not from raw lump concrete)
    const newCubes = savedEntries.map((entry: any, idx: number) => {
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
        dateCast: entryDate,
        castDate: entryDate,
        date: entryDate,
        inscribedName: elemName,
        elementLevel: elemName,
        structureElement: elemName,
        level: elemName,
        strength7Days: s7,
        status7Days: stat7,
        strength28Days: s28,
        status28Days: stat28,
      };
    });

    // Overwrite report.cubeTests with imported cube tests safely
    setReport((prev) =>
      prev ? { ...prev, cubeTests: newCubes as any } : prev,
    );

    // Track imported IDs for highlighting
    const importedSet = new Set<string>();
    newCubes.forEach((c: any) => {
      if (c.sampleId) importedSet.add(c.sampleId);
      if (c.id) importedSet.add(c.id);
    });
    setImportedCubeIds(importedSet);

    toast.success(
      `${newCubes.length} cube sample${newCubes.length !== 1 ? "s" : ""} imported and normalized from ${selectedReport.reportNumber || "previous week"}.`,
    );
    setShowCubeImportPanel(false);
  };

  const handleClearImportedCubes = () => {
    if (importedCubeIds.size === 0) return;
    setImportedCubeIds(new Set());
    handleRefreshCubes();
    toast("Restored current period cube tests.", { icon: "🔄" });
  };

  // Flatten & Filter Site Comments (Type 1: Created in week, Type 2: Open regardless of age, Type 3: Closed/Status changed/Edited in week)
  const getFlattenedSiteComments = (
    reports: any[],
    levelIdFilter: string,
    dateStart: number,
    dateEnd: number,
  ) => {
    const flat = (reports || [])
      .flatMap((rep: any) => {
        const isReportCreatedInWeek = isAnyDateInWeek(
          dateStart,
          dateEnd,
          rep.inspectionDate,
          rep.createdAt,
        );

        return (rep.observations || []).map((obs: any) => {
          // Type 1: Created within the week in question
          const isCreatedInWeek =
            isReportCreatedInWeek ||
            isAnyDateInWeek(
              dateStart,
              dateEnd,
              obs.date,
              obs.createdAt,
            );

          const normStatus = String(obs.status || "OPEN")
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, "_");

          const isClosedOrCompliant =
            Boolean(obs.isRectified) ||
            Boolean(obs.resolved) ||
            normStatus === "compliant" ||
            normStatus === "fixed" ||
            normStatus === "rectified" ||
            normStatus === "closed" ||
            normStatus === "passed" ||
            normStatus === "approved" ||
            normStatus === "rectified_on_site";

          // Type 2: Open (even if created years ago)
          const isOpenObservation = !isClosedOrCompliant;

          // Type 3: Closed, rectified, or edited within the week
          const isClosedOrUpdatedInWeek = isAnyDateInWeek(
            dateStart,
            dateEnd,
            obs.rectifiedDate,
            obs.rectifiedAt,
            obs.closedAt,
            obs.resolvedAt,
            obs.updatedAt,
            obs.modifiedAt,
            obs.statusChangeDate,
            rep.updatedAt,
          );

          // Inclusion rule: Type 1 OR Type 2 OR Type 3
          if (isCreatedInWeek || isOpenObservation || isClosedOrUpdatedInWeek) {
            const commentContent =
              obs.comments ||
              obs.observationText ||
              obs.fieldObservation ||
              obs.comment ||
              obs.text ||
              obs.description ||
              (Array.isArray(obs.commentItems)
                ? obs.commentItems
                    .map((ci: any) =>
                      typeof ci === "string"
                        ? ci
                        : ci?.text || ci?.comment || "",
                    )
                    .filter(Boolean)
                    .join("\n")
                : "") ||
              "";

            const rawPhotos = obs.photos || obs.images || obs.photoUrls || [];
            const sanitizedPhotos = Array.isArray(rawPhotos)
              ? rawPhotos
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
              : [];

            return {
              id: obs.elementId || "",
              levelId: obs.levelId || "",
              level: obs.levelName || "",
              element: obs.structuralElement || obs.elementName || "",
              location: obs.gridLocation || obs.location || "",
              comments: commentContent,
              commentText: commentContent,
              comment: commentContent,
              text: commentContent,
              observationText: commentContent,
              fieldObservation: commentContent,
              commentItems: obs.commentItems || [],
              status: obs.status || "Open",
              inspector: rep.raisedByName || "Inspector",
              author: rep.raisedByName || "Inspector",
              date:
                obs.date ||
                rep.inspectionDate ||
                (rep.createdAt
                  ? new Date(rep.createdAt).toISOString().split("T")[0]
                  : ""),
              projectName: rep.projectName || "",
              reportNumber: rep.reportNumber || "",
              photos: sanitizedPhotos,
              images: sanitizedPhotos,
              vendorCheck: obs.vendorCheck || obs.assignedTo || "",
              trade: obs.tradeName || obs.trade || "",
            };
          }
          return null;
        });
      })
      .filter(Boolean);

    if (
      !levelIdFilter ||
      levelIdFilter === "ALL" ||
      levelIdFilter.toLowerCase().includes("all")
    )
      return flat;
    return flat.filter(
      (item: any) =>
        !item.levelId ||
        item.levelId === levelIdFilter ||
        item.level === levelIdFilter ||
        String(item.levelId || "").toLowerCase() ===
          String(levelIdFilter).toLowerCase() ||
        String(item.level || "").toLowerCase() ===
          String(levelIdFilter).toLowerCase(),
    );
  };

  const handleRefreshNcrs = async () => {
    if (!report || !currentProjId) return;
    setRefreshingNcrs(true);

    try {
      const proj = report.projectId || currentProjId;
      const comp = report.companyId || currentCompId;
      const rawNcrs = await dbService.getNCRs(proj, comp);

      let startMs = 0;
      if (report.weekStart) {
        const [sY, sM, sD] = report.weekStart.split("-").map(Number);
        startMs = new Date(sY, sM - 1, sD, 0, 0, 0, 0).getTime();
      }

      let endMs = Infinity;
      if (report.weekEnd) {
        const [eY, eM, eD] = report.weekEnd.split("-").map(Number);
        endMs = new Date(eY, eM - 1, eD, 23, 59, 59, 999).getTime();
      }

      const targetLevel = report.selectedLevelId || report.selectedLevel;

      // NCR Filter (Type 1: Created in week, Type 2: Open/Unrectified regardless of age, Type 3: Closed/Status changed/Edited in week)
      const rangeNcrs = (rawNcrs || []).filter((n: any) => {
        // Type 1: Created within the week in question
        const isCreatedInWeek = isAnyDateInWeek(
          startMs,
          endMs,
          n.createdAt,
          n.dateFound,
          n.dateRaised,
          n.date,
        );

        const st = String(n.status || "")
          .trim()
          .toUpperCase();
        const finalSt = String(n.finalStatus || "")
          .trim()
          .toUpperCase();
        const isClosedOrRectified =
          st === "CLOSED" ||
          st === "RECTIFIED" ||
          st === "RESOLVED" ||
          st === "APPROVED" ||
          finalSt === "CLOSED" ||
          finalSt === "RESOLVED" ||
          Boolean(n.closedAt);

        // Type 2: Open (even if created years ago)
        const isOpenOrNotRectified = !isClosedOrRectified;

        // Type 3: Closed, status changed, or edited within the week
        const isClosedOrUpdatedInWeek = isAnyDateInWeek(
          startMs,
          endMs,
          n.updatedAt,
          n.modifiedAt,
          n.lastModified,
          n.dateUpdated,
          n.closedAt,
          n.rectifiedAt,
          n.resolvedAt,
          n.signDate,
          n.remedyDate,
          n.statusChangeDate,
        );

        const ncrLevelId = n.levelId || n.locationLevelId || "";
        const matchesLevel =
          !targetLevel ||
          targetLevel === "ALL" ||
          targetLevel.toLowerCase().includes("all") ||
          !ncrLevelId ||
          ncrLevelId === targetLevel ||
          n.level === targetLevel ||
          String(ncrLevelId).toLowerCase() ===
            String(targetLevel).toLowerCase() ||
          String(n.level || "").toLowerCase() ===
            String(targetLevel).toLowerCase();

        // Inclusion rule: Type 1 OR Type 2 OR Type 3
        return (
          (isCreatedInWeek || isOpenOrNotRectified || isClosedOrUpdatedInWeek) &&
          matchesLevel
        );
      });

      const formattedNcrLog = rangeNcrs.map((n: any, idx: number) => ({
        refNo: n.ncrNumber || `NCR-${String(idx + 1).padStart(3, "0")}`,
        dateIdentified:
          n.dateFound ||
          (n.createdAt
            ? new Date(n.createdAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0]),
        elementLevel: n.elementName || n.location || "Structural Component",
        description: Array.isArray(n.descriptionItems)
          ? n.descriptionItems.join(", ")
          : n.description || "Field variance logged",
        riskLevel: n.severity || "MEDIUM",
        assignedTo: n.assignedToName || "Subcontractor",
        targetFixDate:
          n.signDate ||
          n.targetFixDate ||
          new Date().toISOString().split("T")[0],
        status: n.status || "OPEN",
      }));

      const isNcrClosedOrRectified = (n: any) => {
        const st = String(n.status || "")
          .trim()
          .toUpperCase();
        const finalSt = String(n.finalStatus || "")
          .trim()
          .toUpperCase();
        return (
          st === "CLOSED" ||
          st === "RECTIFIED" ||
          st === "RESOLVED" ||
          st === "APPROVED" ||
          finalSt === "CLOSED" ||
          finalSt === "RESOLVED" ||
          Boolean(n.closedAt)
        );
      };

      const ncrStats = {
        opened: rangeNcrs.length,
        closed: rangeNcrs.filter(isNcrClosedOrRectified).length,
        openTotal: rangeNcrs.filter((n: any) => !isNcrClosedOrRectified(n))
          .length,
      };

      setReport((prev) =>
        prev
          ? {
              ...prev,
              ncrRemediationLog: formattedNcrLog,
              filteredNcrs: formattedNcrLog,
              ncrStats,
            }
          : prev,
      );

      toast.success(
        `Refreshed! Found ${formattedNcrLog.length} NCR item(s) (active/open, issued in week, or edited/closed in week).`,
      );
    } catch (err) {
      console.error("Error refreshing NCRs:", err);
      toast.error("Failed to refresh NCR remediation log.");
    } finally {
      setRefreshingNcrs(false);
    }
  };

  const handleRefreshSiteComments = async () => {
    if (!report || !currentProjId) return;
    setRefreshingComments(true);

    try {
      const proj = report.projectId || currentProjId;
      const comp = report.companyId || currentCompId;
      const rawComments = await dbService.getSiteComments(proj, comp);

      let startMs = 0;
      if (report.weekStart) {
        const [sY, sM, sD] = report.weekStart.split("-").map(Number);
        startMs = new Date(sY, sM - 1, sD, 0, 0, 0, 0).getTime();
      }

      let endMs = Infinity;
      if (report.weekEnd) {
        const [eY, eM, eD] = report.weekEnd.split("-").map(Number);
        endMs = new Date(eY, eM - 1, eD, 23, 59, 59, 999).getTime();
      }

      const targetLevel = report.selectedLevelId || report.selectedLevel;

      const flattened = getFlattenedSiteComments(
        rawComments || [],
        targetLevel || "ALL",
        startMs,
        endMs,
      );

      const isCommentClosedOrRectified = (f: any) => {
        if (Boolean(f.isRectified) || Boolean(f.resolved)) return true;
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
        opened: flattened.length,
        closed: flattened.filter(isCommentClosedOrRectified).length,
        openTotal: flattened.filter((f: any) => !isCommentClosedOrRectified(f))
          .length,
      };

      setReport((prev) =>
        prev
          ? {
              ...prev,
              siteComments: flattened,
              filteredSiteComments: flattened,
              findingStats,
            }
          : prev,
      );

      toast.success(
        `Refreshed! Found ${flattened.length} site observation(s) (active/open, created in week, or edited/rectified in week).`,
      );
    } catch (err) {
      console.error("Error refreshing site comments:", err);
      toast.error("Failed to refresh site comments.");
    } finally {
      setRefreshingComments(false);
    }
  };

  const handleUpdate = async () => {
    if (!canUpdateReport) {
      toast.error(
        "You do not have permission to update weekly reports (Level 3+ required)",
      );
      return;
    }
    if (!report) return;
    setSaving(true);
    try {
      const processedQuantitySummary = (report.quantitySummary || []).map(
        (item: any) => {
          const calcVol =
            typeof item.calculatedVolume === "number" && item.calculatedVolume > 0
              ? item.calculatedVolume
              : parseFloat(String(item.scope || "").replace(/[^0-9.]/g, "")) ||
                0;
          const achVol =
            typeof item.achievedVolume === "number" && item.achievedVolume >= 0
              ? item.achievedVolume
              : typeof item.total === "number" && item.total >= 0
                ? item.total
                : (calcVol *
                    (parseFloat(
                      String(item.completion || "").replace(/[^0-9.]/g, ""),
                    ) || 0)) /
                  100;
          const percentage =
            calcVol > 0 ? Math.min(100, Math.round((achVol / calcVol) * 100)) : 0;

          const scopeFormatted =
            item.scope && String(item.scope).trim().length > 0
              ? String(item.scope).toUpperCase().includes("CUM")
                ? item.scope
                : `${item.scope} CUM`
              : `${calcVol.toFixed(1)} CUM`;

          return {
            ...item,
            calculatedVolume: calcVol,
            achievedVolume: achVol,
            total: achVol,
            scope: scopeFormatted,
            completion: `${percentage}%`,
            percentageTotal: percentage,
          };
        },
      );

      const updatedReport: WeeklyReport = {
        ...report,
        title:
          reportTitle.trim() ||
          report.title ||
          "QAQC WEEKLY REPORT - 01 - FIRST FLOOR BANKSIDE",
        revisionNumber,
        executiveSummary,
        synopsis,
        highlights,
        concerns,
        nextWeekPlan,
        remediationSummaryText,
        overallQualityCompliance: Number(overallQualityCompliance),
        beamLayoutImg,
        columnLayoutImg,
        slabImg,
        pictorialUrls,
        mepClearance,
        quantitySummary: processedQuantitySummary,
        structuralElements: (report as any).structuralElements || [],
        totalVolumeCalculated: report.totalVolumeCalculated,
        overallQuantityCompletion: report.overallQuantityCompletion,
        includeNcrsAndComments,
        includeSiteInstructions,
        siteInstructions: rawSiteInstructions,
        filteredSiteInstructions: rawSiteInstructions,
        ncrRemediationLog: report.ncrRemediationLog,
        filteredNcrs: report.filteredNcrs || report.ncrRemediationLog,
        siteComments: report.siteComments,
        filteredSiteComments:
          report.filteredSiteComments || report.siteComments,
        ncrStats: report.ncrStats,
        findingStats: report.findingStats,
        updatedAt: Date.now(),
      };

      await dbService.saveWeeklyReport(updatedReport);
      setReport(updatedReport);

      await writeAudit({
        userId: currentUser?.uid || "system",
        userName: currentUser?.fullName || "QA/QC Engineer",
        companyId: report.companyId || currentCompId || "default",
        module: "reports" as any,
        action: "Weekly Report Updated",
        details: `Updated weekly report ${report.reportNumber || report.id}`,
        projectId: report.projectId || currentProjId,
      });

      toast.success("Report fields updated successfully");
    } catch (err) {
      console.error("Failed to update report:", err);
      toast.error("Failed to update report data");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canDeleteReport) {
      toast.error(
        "You do not have permission to delete weekly reports (Level 4+ required)",
      );
      return;
    }
    if (
      !window.confirm(
        "Are you sure you want to delete this report? This cannot be undone.",
      )
    )
      return;
    try {
      await dbService.deleteWeeklyReport(
        reportId,
        report?.projectId || currentProjId,
      );
      toast.success("Report deleted successfully");
      navigate("/project/weekly-reports");
    } catch (err) {
      console.error("Failed to delete report:", err);
      toast.error("Failed to delete report");
    }
  };

  const handleGenerate = () => {
    if (report) {
      const preparedByObj =
        typeof report.preparedBy === "object"
          ? {
              name:
                report.preparedBy?.name ||
                currentUser?.displayName ||
                "QA/QC Engineer",
              email: report.preparedBy?.email || currentUser?.email || "",
              designation:
                report.preparedBy?.designation ||
                report.preparedBy?.role ||
                "QA/QC Engineer",
              role: report.preparedBy?.role || "QA/QC Engineer",
              signed: (report.preparedBy as any)?.signed,
              signatureUrl: (report.preparedBy as any)?.signatureUrl,
              signedAt: (report.preparedBy as any)?.signedAt,
            }
          : {
              name: String(
                report.preparedBy ||
                  currentUser?.displayName ||
                  "QA/QC Engineer",
              ),
              email: currentUser?.email || "",
            };

      const projectCoverImage =
        activeProject?.coverImageUrl ||
        activeProject?.imageUrl ||
        report.coverImageUrl ||
        report.coverImageBase64 ||
        "";

      generateWeeklyPresentationPDF({
        ...report,
        title: report.title || "QAQC Weekly Report",
        projectName:
          activeProject?.name || report.projectName || "Site Operations",
        companyName: company?.name || (company as any)?.companyName || " ",
        logoBase64: company?.logoUrl || report.logoBase64 || "",
        coverImageUrl: projectCoverImage,
        projectCoverImageUrl: projectCoverImage,
        coverImageBase64: projectCoverImage,
        selectedLevel: report.selectedLevel || "All Levels",
        preparedBy: preparedByObj,
        executiveSummary,
        synopsis,
        highlights,
        concerns,
        nextWeekPlan,
        remediationSummaryText,
        overallQualityCompliance,
        beamLayoutImg,
        columnLayoutImg,
        slabImg,
        mepClearance,
        pictorialUrls,
        includeNcrsAndComments: printIncludeNcrs && printIncludeComments,
        includeNcrs: printIncludeNcrs,
        includeSiteComments: printIncludeComments,
        includeSiteInstructions: printIncludeSIs,
        siteInstructions: rawSiteInstructions,
        filteredSiteInstructions: rawSiteInstructions,
      } as any);
    }
  };

  const handleOpenEmailModal = async () => {
    if (!report) return;
    setPreparingEmail(true);
    try {
      const preparedByObj =
        typeof report.preparedBy === "object" && report.preparedBy !== null
          ? {
              name: (report.preparedBy as any)?.name || currentUser?.displayName || "QA/QC Engineer",
              title: (report.preparedBy as any)?.title || currentUser?.title || "QA/QC Engineer",
              email: (report.preparedBy as any)?.email || currentUser?.email || "",
              signatureUrl: (report.preparedBy as any)?.signatureUrl,
              signedAt: (report.preparedBy as any)?.signedAt,
            }
          : {
              name: String(report.preparedBy || currentUser?.displayName || "QA/QC Engineer"),
              email: currentUser?.email || "",
            };

      const projectCoverImage =
        activeProject?.coverImageUrl ||
        activeProject?.imageUrl ||
        report.coverImageUrl ||
        report.coverImageBase64 ||
        "";

      const pdfBase64 = await generateNewWeeklyPresentationPDF(
        {
          ...report,
          title: report.title || "QAQC Weekly Report",
          projectName: activeProject?.name || report.projectName || "Site Operations",
          companyName: company?.name || (company as any)?.companyName || " ",
          logoBase64: company?.logoUrl || report.logoBase64 || "",
          coverImageUrl: projectCoverImage,
          projectCoverImageUrl: projectCoverImage,
          coverImageBase64: projectCoverImage,
          selectedLevel: report.selectedLevel || "All Levels",
          preparedBy: preparedByObj,
          executiveSummary,
          synopsis,
          highlights,
          concerns,
          nextWeekPlan,
          remediationSummaryText,
          overallQualityCompliance,
          beamLayoutImg,
          columnLayoutImg,
          slabImg,
          mepClearance,
          pictorialUrls,
          includeNcrsAndComments: printIncludeNcrs && printIncludeComments,
          includeNcrs: printIncludeNcrs,
          includeSiteComments: printIncludeComments,
          includeSiteInstructions: printIncludeSIs,
          siteInstructions: rawSiteInstructions,
          filteredSiteInstructions: rawSiteInstructions,
        } as any,
        { returnBase64: true, saveFile: false }
      );

      if (pdfBase64 && typeof pdfBase64 === "string") {
        const filename = `Weekly-QAQC-Report-${report.reportNumber || "FILE"}-${report.weekEnd || "DRAFT"}.pdf`;
        setEmailAttachments([
          {
            filename: filename,
            content: pdfBase64,
            contentType: "application/pdf",
            sizeFormatted: "Landscape Slide Deck (PDF)",
          },
        ]);
      }

      setIsEmailModalOpen(true);
    } catch (err: any) {
      console.error("Failed to generate PDF for email:", err);
      toast.error("Opening email composer...");
      setIsEmailModalOpen(true);
    } finally {
      setPreparingEmail(false);
    }
  };


  const handleRefreshSiteInstructions = async () => {
    if (!report || !currentProjId) return;
    setRefreshingSiteInstructions(true);
    try {
      const proj = report.projectId || currentProjId;
      const comp = report.companyId || currentCompId;
      const list = await dbService.getSiteInstructions(proj, comp);

      let startMs = 0;
      if (report.weekStart) {
        const [sY, sM, sD] = report.weekStart.split("-").map(Number);
        startMs = new Date(sY, sM - 1, sD, 0, 0, 0, 0).getTime();
      }

      let endMs = Infinity;
      if (report.weekEnd) {
        const [eY, eM, eD] = report.weekEnd.split("-").map(Number);
        endMs = new Date(eY, eM - 1, eD, 23, 59, 59, 999).getTime();
      }

      const targetLevel = report.selectedLevelId || report.selectedLevel;

      // Site Instructions Filter (Type 1: Issued in week, Type 2: Open regardless of age, Type 3: Closed/Status changed/Edited in week)
      const filteredList = (list || []).filter((si: any) => {
        // Type 1: Issued/Created within the week in question
        const isIssuedInWeek = isAnyDateInWeek(
          startMs,
          endMs,
          si.createdAt,
          si.issuedDate,
          si.date,
          si.signedBy?.signedAt,
        );

        // Type 2: Open (even if created years ago)
        const st = String(si.status || "ISSUED")
          .trim()
          .toUpperCase();
        const isClosed =
          st === "CLOSED" ||
          st === "COMPLETED" ||
          st === "RESOLVED" ||
          st === "CANCELLED" ||
          Boolean(si.closedAt);
        const isOpen = !isClosed;

        // Type 3: Closed, status changed, or edited within the week
        const isClosedOrUpdatedInWeek = isAnyDateInWeek(
          startMs,
          endMs,
          si.updatedAt,
          si.modifiedAt,
          si.lastModified,
          si.closedAt,
          si.completedAt,
          si.resolvedAt,
          si.verifiedAt,
          si.signedAt,
          si.statusChangeDate,
          si.signedBy?.signedAt,
        );

        const siLevelId = si.levelId || "";
        const matchesLevel =
          !targetLevel ||
          targetLevel === "ALL" ||
          targetLevel.toLowerCase().includes("all") ||
          !siLevelId ||
          siLevelId === targetLevel ||
          si.level === targetLevel ||
          String(siLevelId).toLowerCase() ===
            String(targetLevel).toLowerCase() ||
          String(si.level || "").toLowerCase() ===
            String(targetLevel).toLowerCase();

        // Inclusion rule: Type 1 OR Type 2 OR Type 3
        return (
          (isIssuedInWeek || isOpen || isClosedOrUpdatedInWeek) && matchesLevel
        );
      });

      setRawSiteInstructions(filteredList);
      setReport((prev) =>
        prev
          ? {
              ...prev,
              siteInstructions: filteredList,
              filteredSiteInstructions: filteredList,
            }
          : prev,
      );
      toast.success(
        `Refreshed! Found ${filteredList.length} site instruction(s) (active/open, issued in week, or edited/closed in week).`,
      );
    } catch (err) {
      console.error("Error refreshing site instructions:", err);
      toast.error("Failed to refresh site instructions");
    } finally {
      setRefreshingSiteInstructions(false);
    }
  };

  const handleSignAsCompiler = async () => {
    if (!report) return;

    const compilerRole =
      (typeof report.preparedBy === "object"
        ? report.preparedBy?.designation || report.preparedBy?.role
        : "") || "QA/QC Lead Engineer";

    const isEligible =
      isUserEligibleForStakeholderRole(currentUser, compilerRole) ||
      currentUser?.fullName ===
        (typeof report.preparedBy === "object"
          ? report.preparedBy?.name
          : report.preparedBy) ||
      (currentUser?.role &&
        [
          "SUPER_ADMIN",
          "QUALITY_DIRECTOR",
          "EXECUTIVE_MANAGEMENT",
          "QUALITY_MANAGER",
          "QAQC_MANAGER",
          "SENIOR_QAQC_ENGINEER",
          "QAQC_ENGINEER",
        ].includes(currentUser.role));

    if (!isEligible) {
      toast.error(`Only ${compilerRole} can sign this report`);
      return;
    }

    setIsSigningCompiler(true);
    try {
      const currentComp =
        typeof report.preparedBy === "object" && report.preparedBy
          ? (report.preparedBy as any)
          : {};

      const updatedCompiler = {
        ...currentComp,
        uid: currentUser?.uid || currentComp.uid || "",
        name: currentUser?.fullName || currentComp.name || "QA/QC Engineer",
        email: currentUser?.email || currentComp.email || "",
        designation:
          currentUser?.designation ||
          currentComp.designation ||
          (currentUser?.role
            ? ROLE_TITLES[currentUser.role]
            : "QA/QC Engineer"),
        role: currentUser?.role || currentComp.role || "QAQC_ENGINEER",
        signed: true,
        signedAt: new Date().toISOString(),
      };

      const updatedReport: WeeklyReport = {
        ...report,
        preparedBy: updatedCompiler,
        status: "APPROVED",
        updatedAt: Date.now(),
      };

      await dbService.saveWeeklyReport(updatedReport);
      setReport(updatedReport);

      await writeAudit({
        userId: currentUser?.uid || "system",
        userName: currentUser?.fullName || "QA/QC Engineer",
        companyId: report.companyId || currentCompId || "default",
        module: "reports" as any,
        action: "Weekly Report Signed",
        details: `Report ${report.reportNumber || report.id} digitally certified by ${currentUser?.fullName} (${updatedCompiler.designation})`,
        projectId: report.projectId || currentProjId,
      });

      toast.success("Report successfully certified and digitally signed!");
    } catch (err) {
      console.error("Sign error:", err);
      toast.error("Failed to sign report");
    } finally {
      setIsSigningCompiler(false);
    }
  };

  const handleClearSignature = async () => {
    if (!report) return;
    const isCompiler =
      currentUser?.fullName ===
      (typeof report.preparedBy === "object" ? report.preparedBy?.name : "");
    const isLevel5 =
      currentUser?.role &&
      ["SUPER_ADMIN", "QUALITY_DIRECTOR", "EXECUTIVE_MANAGEMENT", "QUALITY_MANAGER", "QAQC_MANAGER"].includes(
        currentUser.role,
      );

    if (!isCompiler && !isLevel5) {
      toast.error(
        "Only the signing officer or Level 5 Management can clear this signature.",
      );
      return;
    }

    try {
      const currentComp =
        typeof report.preparedBy === "object" && report.preparedBy
          ? (report.preparedBy as any)
          : { name: String(report.preparedBy || "QA/QC Lead Engineer") };

      const updatedCompiler = {
        ...currentComp,
        signed: false,
        signedAt: undefined,
      };

      const updatedReport: WeeklyReport = {
        ...report,
        preparedBy: updatedCompiler,
        status: "DRAFT",
        updatedAt: Date.now(),
      };

      await dbService.saveWeeklyReport(updatedReport);
      setReport(updatedReport);
      toast.success("Signature cleared. Report status set to Draft.");
    } catch (err) {
      console.error("Clear error:", err);
      toast.error("Failed to clear signature");
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "beam" | "column" | "slab" | number,
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileList = Array.from(e.target.files);

    setUploadingImage(target);
    const toastId = toast.loading(
      "Uploading asset structural viewports to Cloudinary...",
    );

    try {
      const urls = await uploadMultiple(fileList);
      if (urls && urls.length > 0) {
        const item = urls[0];
        const uploadedUrl =
          typeof item === "object" && item !== null ? item.url : item;

        if (!uploadedUrl || typeof uploadedUrl !== "string") {
          throw new Error("Invalid URL returned from upload pipeline");
        }

        assignImageToTarget(target, uploadedUrl);
        try {
          syncPhotoToSiteGallery({
            projectId: currentProjId,
            companyId: currentCompId,
            url: uploadedUrl,
            thumbnailUrl: getThumbnail(uploadedUrl, 250),
            caption: `Weekly Report W${report?.weekNumber || ""}: ${typeof target === "number" ? `Site Progress Photo #${target + 1}` : `${String(target).toUpperCase()} Layout`}`,
            category: "PROGRESS",
            uploadedBy: currentUser?.fullName || "QA/QC Lead",
            uploaderRole: currentUser?.role,
            sourceModule: "WeeklyReport",
            sourceId: reportId || "WEEKLY_REPORT",
          });
        } catch (e) {
          console.warn("Gallery sync notice:", e);
        }
        toast.success(
          "Asset attached to document lifecycle maps successfully!",
          { id: toastId },
        );
      }
    } catch (error) {
      console.error("Cloudinary execution failure:", error);
      toast.error("Failed to execute image routing pipeline assets.", {
        id: toastId,
      });
    } finally {
      setUploadingImage(null);
    }
  };

  const assignImageToTarget = (
    target: "beam" | "column" | "slab" | number,
    url: string,
  ) => {
    if (target === "beam") setBeamLayoutImg(url);
    else if (target === "column") setColumnLayoutImg(url);
    else if (target === "slab") setslabImg(url);
    else if (typeof target === "number") {
      const updatedPictorials = [...pictorialUrls];
      updatedPictorials[target] = {
        ...updatedPictorials[target],
        url: url,
      };
      setPictorialUrls(updatedPictorials);
    }
  };

  const handleSelectGalleryPhoto = useCallback(
    (photo: GalleryPhoto) => {
      if (pickerTarget !== null) {
        setSelectedPhotoId(photo.id);
        // Small delay for visual feedback before closing
        setTimeout(() => {
          assignImageToTarget(pickerTarget, photo.url);
          setIsPickerOpen(false);
          setPickerTarget(null);
          setSelectedPhotoId(null);
          toast.success("Photo selected and linked successfully!");
        }, 300);
      }
    },
    [pickerTarget],
  );

  const handleCaptionChange = (index: number, newCaption: string) => {
    const updatedPictorials = [...pictorialUrls];
    updatedPictorials[index] = {
      ...updatedPictorials[index],
      caption: newCaption,
    };
    setPictorialUrls(updatedPictorials);
  };

  const handleAddImageSlot = () => {
    setPictorialUrls([
      ...pictorialUrls,
      {
        url: "",
        caption: `New Operational Viewport ${pictorialUrls.length + 1}`,
      },
    ]);
  };

  const openGalleryPicker = (target: "beam" | "column" | "slab" | number) => {
    setPickerTarget(target);
    setSelectedPhotoId(null);
    setIsPickerOpen(true);
  };

  // ==========================================
  // FILTERED PHOTOS
  // ==========================================

  const eligiblePhotos = React.useMemo(() => {
    if (!projectPhotos) return [];
    return projectPhotos.filter((p: GalleryPhoto) => {
      if (!filterByDates) return true;
      const photoTime = p.takenAt || p.createdAt;
      if (!photoTime) return false;

      const startTime = report?.weekStart
        ? new Date(report.weekStart).getTime()
        : 0;
      let endTime = report?.weekEnd
        ? new Date(report.weekEnd).getTime()
        : Infinity;

      if (endTime !== Infinity) {
        endTime += 24 * 60 * 60 * 1000 - 1;
      }
      return photoTime >= startTime && photoTime <= endTime;
    });
  }, [projectPhotos, filterByDates, report?.weekStart, report?.weekEnd]);

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  const formatPhotoDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f8fafc]">
        <Loader2 className="animate-spin text-[#ea580c]" size={32} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-10 text-center">Report not found or inaccessible.</div>
    );
  }

  // ==========================================
  // MAIN RENDER HELPERS
  // ==========================================

  const renderStatusBadge = () => {
    const status = report.status || "DRAFT";
    const isApproved = status === "APPROVED" || status === "PUBLISHED";
    const isReview = status === "UNDER REVIEW";
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shrink-0 ${
          isApproved
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
            : isReview
              ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            isApproved
              ? "bg-emerald-500 animate-pulse"
              : isReview
                ? "bg-blue-500"
                : "bg-amber-500"
          }`}
        />
        {status}
      </span>
    );
  };

  const renderMetadataStrip = () => (
    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 overflow-x-auto no-scrollbar py-0.5">
      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0">
        <Building2 size={12} className="text-orange-500 shrink-0" />
        {report.projectName || activeProject?.name || "Bankside Project"}
      </span>
      <span className="text-slate-300 dark:text-slate-600">&bull;</span>
      <span className="flex items-center gap-1 shrink-0">
        <MapPin size={12} className="text-slate-400 shrink-0" />
        {report.selectedLevel || "All Levels"}
      </span>
      <span className="text-slate-300 dark:text-slate-600">&bull;</span>
      <span className="flex items-center gap-1 font-mono shrink-0">
        <Calendar size={12} className="text-slate-400 shrink-0" />
        {report.weekStart && report.weekEnd
          ? `${report.weekStart} → ${report.weekEnd}`
          : report.weekNumber
            ? `Week ${report.weekNumber}`
            : "Current Period"}
      </span>
      <span className="text-slate-300 dark:text-slate-600">&bull;</span>
      <span className="shrink-0">
        Compiled by{" "}
        {(typeof report.preparedBy === "object"
          ? report.preparedBy?.name
          : report.preparedBy) || "QA/QC Engineer"}
      </span>
    </div>
  );

  return (
    <>
      <div
        className={`${
          structureMode === "EXECUTIVE" ? "max-w-7xl" : "max-w-5xl"
        } mx-auto pb-20 px-3 sm:px-4 space-y-6 sm:space-y-8 mt-3 sm:mt-6 transition-all duration-300`}
      >
        {/* ========================================== */}
        {/* STICKY ACTION & METADATA BAR (ADAPTIVE RESPONSIVE) */}
        {/* ========================================== */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2.5 sm:p-3.5 md:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-md dark:shadow-2xl sticky top-1 sm:top-2 z-30 transition-all">
          
          {/* ────────────────────────────────────────── */}
          {/* DESKTOP & LARGE DISPLAY VIEW (lg:flex, hidden on < lg) */}
          {/* ────────────────────────────────────────── */}
          <div className="hidden lg:flex flex-col space-y-2.5">
            {/* Top Tier: Nav + Badges + Flexible Title + Primary Actions */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  onClick={() => navigate("/project/weekly-reports")}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200/70 dark:border-slate-700/70 shrink-0 transition-colors shadow-xs"
                  title="Back to Weekly Reports List"
                >
                  <ArrowLeft size={18} />
                </button>

                {/* Badges Cluster */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-black text-slate-800 dark:text-slate-200">
                    <span>{report.reportNumber || "WQR-RECORD"}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (report.reportNumber) {
                          navigator.clipboard.writeText(report.reportNumber);
                          toast.success("Report ID copied to clipboard");
                        }
                      }}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors ml-0.5"
                      title="Copy Report ID"
                    >
                      <Copy size={11} />
                    </button>
                  </div>

                  <div
                    className="inline-flex items-center px-2 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-xs font-mono font-bold text-orange-700 dark:text-orange-300"
                    title="Document Revision Control"
                  >
                    <span>{revisionNumber}</span>
                  </div>

                  {renderStatusBadge()}
                </div>

                {/* Editable Title with Dedicated Flexible Box */}
                <div className="flex-1 min-w-[220px]">
                  <input
                    type="text"
                    value={reportTitle || report.title || ""}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="QAQC WEEKLY REPORT - 01 - FIRST FLOOR BANKSIDE"
                    className="w-full text-sm font-black text-slate-900 dark:text-white bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 tracking-tight transition-all font-sans"
                    title="Click to edit report title"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              {/* Primary Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsSlideDeckOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition active:scale-95"
                  title="Open Interactive 16:9 Presentation Deck"
                >
                  <Presentation size={14} />
                  <span>Present Deck</span>
                </button>

                <button
                  onClick={() => setIsPrintModalOpen(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 border border-slate-700 transition active:scale-95"
                  title="Print or Export PDF (Choose Portrait / Landscape & Scope)"
                >
                  <Printer size={14} className="text-slate-300" />
                  <span>Print / PDF</span>
                </button>

                <button
                  onClick={handleUpdate}
                  disabled={saving || !canUpdateReport}
                  title={
                    !canUpdateReport
                      ? "Level 3+ authority required to update weekly reports"
                      : "Save All Real-Time Updates"
                  }
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 shadow-md shadow-orange-500/20 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Save size={14} />
                  )}
                  <span>{saving ? "Saving..." : "Save States"}</span>
                </button>
              </div>
            </div>

            {/* Bottom Tier: Metadata Strip + Mode Switcher + Auxiliary Actions */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
              {renderMetadataStrip()}

              <div className="flex items-center gap-2 shrink-0">
                {/* Segmented Mode Switcher */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-inner shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStructureChange("EXECUTIVE")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      structureMode === "EXECUTIVE"
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    title="Executive Command Matrix & Real-Time Quality Control view"
                  >
                    <Sparkles size={13} />
                    <span>Executive Matrix</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStructureChange("CLASSIC")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      structureMode === "CLASSIC"
                        ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-800"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    title="Classic 13-page vertical dossier document editor"
                  >
                    <LayoutTemplate size={13} />
                    <span>Classic Dossier (13 Pgs)</span>
                  </button>
                </div>

                {/* Slides PDF Quick Export */}
                <button
                  onClick={handleGenerate}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 border border-slate-200 dark:border-slate-700 transition"
                  title="Export Slide Deck (jsPDF Landscape Presentation)"
                >
                  <FileText size={13} className="text-orange-500" />
                  <span>Slides PDF</span>
                </button>

                {/* Email Report */}
                <button
                  onClick={handleOpenEmailModal}
                  disabled={preparingEmail}
                  className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 border border-indigo-200 dark:border-indigo-800/80 transition active:scale-95 disabled:opacity-50"
                  title="Dispatch Report via SMTP Email with Attached Presentation PDF"
                >
                  {preparingEmail ? (
                    <Loader2 size={13} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <Mail size={13} className="text-indigo-600 dark:text-indigo-400" />
                  )}
                  <span>Email Report</span>
                </button>

                {/* Delete Button */}
                <button
                  onClick={handleDelete}
                  disabled={!canDeleteReport}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl shrink-0 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/40"
                  title={
                    !canDeleteReport
                      ? "Level 4 authority required to delete weekly reports"
                      : "Delete Report"
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────── */}
          {/* MOBILE & TABLET ADAPTIVE VIEW (< lg:flex, hidden on lg+) */}
          {/* ────────────────────────────────────────── */}
          <div className="flex lg:hidden flex-col space-y-2">
            {/* Row 1: Nav + Badges + Primary Action Buttons */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <button
                  onClick={() => navigate("/project/weekly-reports")}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 border border-slate-200/70 dark:border-slate-700/70 shrink-0"
                  title="Back to Weekly Reports"
                >
                  <ArrowLeft size={16} />
                </button>

                {/* Code badge */}
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">
                  <span className="truncate max-w-[85px] sm:max-w-none">{report.reportNumber || "WQR"}</span>
                </div>

                {renderStatusBadge()}
              </div>
            </div>

            {/* Row 2: Full-Width Title Input */}
            <div className="w-full">
              <input
                type="text"
                value={reportTitle || report.title || ""}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="QAQC WEEKLY REPORT - 01 - FIRST FLOOR BANKSIDE"
                className="w-full text-xs font-black text-slate-900 dark:text-white bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 tracking-tight transition-all font-sans"
                title="Click to edit report title"
              />
            </div>

            {/* Row 1: Nav + Badges + Primary Action Buttons */}
            <div className="flex items-center justify-between gap-1.5">
                {/* Rev badge */}
                <div className="inline-flex items-center px-1.5 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-[11px] font-mono font-bold text-orange-700 dark:text-orange-300">
                  <span>{revisionNumber}</span>
                </div>
                
              {/* Quick Primary Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setIsSlideDeckOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
                  title="Present Deck"
                >
                  <Presentation size={13} />
                  <span className="hidden sm:inline">Present</span>
                </button>

                <button
                  onClick={() => setIsPrintModalOpen(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-100 p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 border border-slate-700"
                  title="Print / PDF"
                >
                  <Printer size={13} />
                  <span className="hidden sm:inline">PDF</span>
                </button>

                <button
                  onClick={handleUpdate}
                  disabled={saving || !canUpdateReport}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white px-2.5 sm:px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 shrink-0 shadow-sm disabled:opacity-50"
                  title="Save States"
                >
                  {saving ? <Loader2 className="animate-spin" size={13} /> : <Save size={13} />}
                  <span>Save</span>
                </button>
              </div>
            </div>

            {/* Row 3: Mode Switcher + Auxiliary Actions */}
            <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shrink-0">
                <button
                  type="button"
                  onClick={() => handleStructureChange("EXECUTIVE")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                    structureMode === "EXECUTIVE"
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Sparkles size={11} />
                  <span>Matrix</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStructureChange("CLASSIC")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    structureMode === "CLASSIC"
                      ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <LayoutTemplate size={11} />
                  <span>Dossier (13p)</span>
                </button>
              </div>

              {/* Auxiliary Quick Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleGenerate}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                  title="Export Slides PDF"
                >
                  <FileText size={12} className="text-orange-500" />
                  <span className="hidden sm:inline">Slides</span>
                </button>

                <button
                  onClick={handleOpenEmailModal}
                  disabled={preparingEmail}
                  className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-indigo-200 dark:border-indigo-800/80"
                  title="Email Report"
                >
                  {preparingEmail ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
                  <span className="hidden sm:inline">Email</span>
                </button>

                <button
                  onClick={handleDelete}
                  disabled={!canDeleteReport}
                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg shrink-0"
                  title="Delete Report"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Row 4: Scrollable Metadata Chips on Mobile */}
            <div className="pt-0.5">
              {renderMetadataStrip()}
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* BODY CONTENT: EXECUTIVE MATRIX vs CLASSIC DOSSIER */}
        {/* ========================================== */}
        {structureMode === "EXECUTIVE" ? (
          <WeeklyReportExecutiveMatrix
            report={report}
            activeProject={activeProject}
            company={company}
            currentUser={currentUser}
            executiveSummary={executiveSummary}
            setExecutiveSummary={setExecutiveSummary}
            highlights={highlights}
            setHighlights={setHighlights}
            concerns={concerns}
            setConcerns={setConcerns}
            nextWeekPlan={nextWeekPlan}
            setNextWeekPlan={setNextWeekPlan}
            overallQualityCompliance={overallQualityCompliance}
            setOverallQualityCompliance={setOverallQualityCompliance}
            beamLayoutImg={beamLayoutImg}
            setBeamLayoutImg={setBeamLayoutImg}
            columnLayoutImg={columnLayoutImg}
            setColumnLayoutImg={setColumnLayoutImg}
            slabImg={slabImg}
            setslabImg={setslabImg}
            revisionNumber={revisionNumber}
            setRevisionNumber={setRevisionNumber}
            mepClearance={mepClearance}
            setMepClearance={setMepClearance}
            pictorialUrls={pictorialUrls}
            setPictorialUrls={setPictorialUrls}
            handleCaptionChange={handleCaptionChange}
            handleImageUpload={handleImageUpload}
            openGalleryPicker={openGalleryPicker}
            uploadingImage={uploadingImage}
            handleUpdate={handleUpdate}
            handleGenerate={handleGenerate}
            setIsPrintModalOpen={setIsPrintModalOpen}
            handleRefreshCubes={handleRefreshCubes}
            refreshingCubes={refreshingCubes}
            handleRefreshMaterials={handleRefreshMaterials}
            refreshingDeliveries={refreshingDeliveries}
            handleRefreshNcrs={handleRefreshNcrs}
            refreshingNcrs={refreshingNcrs}
            handleRefreshSiteComments={handleRefreshSiteComments}
            refreshingComments={refreshingComments}
            handleRefreshSiteInstructions={handleRefreshSiteInstructions}
            refreshingSiteInstructions={refreshingSiteInstructions}
            handleRefreshElements={handleRefreshElements}
            refreshingElements={refreshingElements}
            handleUpdateElementVolume={handleUpdateElementVolume}
            remediationSummaryText={remediationSummaryText}
            setRemediationSummaryText={setRemediationSummaryText}
            handleSignAsCompiler={handleSignAsCompiler}
            isSigningCompiler={isSigningCompiler}
            handleClearSignature={handleClearSignature}
            rawSiteInstructions={rawSiteInstructions}
            includeNcrsAndComments={includeNcrsAndComments}
            setIncludeNcrsAndComments={setIncludeNcrsAndComments}
            includeSiteInstructions={includeSiteInstructions}
            setIncludeSiteInstructions={setIncludeSiteInstructions}
            canUpdateReport={canUpdateReport}
            saving={saving}
            onOpenPresentation={() => setIsSlideDeckOpen(true)}
          />
        ) : (
          <>
            {/* ========================================== */}
            {/* CLASSIC DOSSIER CONTROL & SCOPE TOOLBAR */}
            {/* ========================================== */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/95 p-3 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <ShieldCheck size={14} className="text-orange-500" />
                  <span>Dossier Scope:</span>
                </div>
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setIncludeNcrsAndComments(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      includeNcrsAndComments
                        ? "bg-white dark:bg-slate-950 text-emerald-700 dark:text-emerald-400 shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <CheckCircle2
                      size={13}
                      className={
                        includeNcrsAndComments
                          ? "text-emerald-600"
                          : "text-slate-400"
                      }
                    />
                    <span>Full Scope (w/ NCRs & Comments)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncludeNcrsAndComments(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      !includeNcrsAndComments
                        ? "bg-white dark:bg-slate-950 text-sky-700 dark:text-sky-400 shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>Audit Only (No NCRs)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs flex-wrap">
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeSiteInstructions}
                    onChange={(e) =>
                      setIncludeSiteInstructions(e.target.checked)
                    }
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
                  />
                  <span>Site Instructions ({rawSiteInstructions.length})</span>
                </label>

                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70 text-slate-500 dark:text-slate-400 text-[11px] font-mono font-semibold">
                  <Layers size={13} className="text-slate-400" />
                  <span>13 Pages • A4 Portrait</span>
                </div>
              </div>
            </div>

            {/* ========================================== */}
            {/* DOCUMENT PREVIEW WRAPPER */}
            {/* ========================================== */}
            <div className="space-y-8 sm:space-y-10 bg-slate-100/80 dark:bg-slate-950/60 p-4 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-inner">
              {/* PAGE 1: TITLE BANNER WITH PROJECT IMAGE */}
              {(() => {
                const projectCoverImage =
                  report.projectCoverImageUrl ||
                  report.coverImageUrl ||
                  report.coverImageBase64 ||
                  activeProject?.coverImageUrl ||
                  activeProject?.imageUrl ||
                  (activeProject as any)?.image ||
                  (report as any)?.projectImage ||
                  (pictorialUrls.length > 0 && pictorialUrls[0]?.url
                    ? pictorialUrls[0].url
                    : "");

                return (
                  <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-xl border border-slate-800">
                    <div className="grid grid-cols-1 lg:grid-cols-12">
                      <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between min-h-[220px]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                            <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-orange-500">
                              {report.projectName?.toUpperCase() ||
                                activeProject?.name?.toUpperCase() ||
                                "SURVEILLANCE OPERATIONS"}
                            </p>
                          </div>
                          <h2 className="text-xl sm:text-3xl font-black mt-3 leading-tight tracking-tight text-white">
                            {report.title || "QA/QC WEEKLY SURVEILLANCE REPORT"}
                          </h2>
                          <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                            Statutory compliance and technical surveillance
                            record &bull; ISO 9001:2015 Clause 9.1 & 9.3
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-t border-slate-800 pt-4 mt-6 text-xs text-slate-400 gap-3 sm:gap-0">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">
                              Surveillance Window
                            </span>
                            <span className="block font-bold text-white text-xs sm:text-sm">
                              {report.weekStart} — {report.weekEnd}
                            </span>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">
                              Lead Compiler
                            </span>
                            <span className="block font-bold text-white text-xs sm:text-sm">
                              {(typeof report.preparedBy === "object"
                                ? report.preparedBy?.name
                                : report.preparedBy || "QA/QC Engineer") ||
                                "Lead QA/QC Inspector"}
                            </span>
                            <span className="text-[10px] text-orange-400 font-medium">
                              {typeof report.preparedBy === "object"
                                ? report.preparedBy?.designation ||
                                  report.preparedBy?.role
                                : "Quality Management Division"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-5 bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 relative min-h-[180px] sm:min-h-[220px] flex items-center justify-center overflow-hidden">
                        {projectCoverImage ? (
                          <img
                            src={projectCoverImage}
                            alt={report.projectName || "Project Cover"}
                            className="w-full h-full object-cover object-center absolute inset-0"
                          />
                        ) : (
                          <div className="text-center p-6 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-500 font-black text-lg mb-2">
                              QMS
                            </div>
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                              Project Visual Record
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5">
                              Surveillance Photo Attached
                            </span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs border border-white/10 px-2.5 py-1 rounded-full text-[9px] font-bold text-slate-200 uppercase tracking-wider">
                          Project Cover
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* EXECUTIVE SUMMARY & STATS */}
              <div className="bg-white dark:bg-slate-900/95 p-5 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl space-y-4 sm:space-y-6 transition-colors">
                <div className="border-b pb-3 flex justify-between items-center">
                  <h3 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2">
                    EXECUTIVE SUMMARY
                  </h3>
                  <span className="text-[10px] sm:text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded font-mono font-bold">
                    {report.companyName || "CONFIDENTIAL"}
                  </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                  <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-xs">
                    <p className="text-[9px] sm:text-xs text-gray-500 font-bold uppercase">
                      Total Inspections
                    </p>
                    <p className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                      {report.inspectionStats?.passed || 0}/
                      {report.inspectionStats?.total || 4} Passed
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-xs">
                    <p className="text-[9px] sm:text-xs text-gray-500 font-bold uppercase">
                      Active Drafts
                    </p>
                    <p className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                      {report.findingStats?.opened || 0}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-xs">
                    <p className="text-[9px] sm:text-xs text-red-500 font-bold uppercase">
                      Open NCRs
                    </p>
                    <p className="text-lg sm:text-xl font-black text-red-600 mt-1">
                      {report.ncrStats?.openTotal || 5}
                    </p>
                  </div>
                  <div className="bg-orange-50/40 p-2 sm:p-3 rounded-lg border border-orange-200/70 text-center">
                    <p className="text-[9px] sm:text-xs text-orange-600 font-extrabold uppercase">
                      Overall Compliance
                    </p>
                    <div className="mt-1 flex items-center justify-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={overallQualityCompliance}
                        onChange={(e) =>
                          setOverallQualityCompliance(
                            Math.min(
                              100,
                              Math.max(0, parseInt(e.target.value) || 0),
                            ),
                          )
                        }
                        className="w-12 sm:w-16 bg-white text-center font-black text-lg sm:text-xl text-orange-700 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 p-0.5"
                      />
                      <Percent
                        size={14}
                        className="text-orange-500 font-bold shrink-0"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
                  <Field label="Executive Summary Text Wrapper">
                    <textarea
                      value={executiveSummary}
                      onChange={(e) => setExecutiveSummary(e.target.value)}
                      className="w-full h-20 p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none resize-none transition-colors font-sans"
                    />
                  </Field>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <Field label="Key Project Highlights">
                      <textarea
                        value={highlights}
                        onChange={(e) => setHighlights(e.target.value)}
                        className="w-full h-20 sm:h-24 p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none resize-none transition-colors font-sans"
                      />
                    </Field>
                    <Field label="Critical Risks & Concerns">
                      <textarea
                        value={concerns}
                        onChange={(e) => setConcerns(e.target.value)}
                        className="w-full h-20 sm:h-24 p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none resize-none transition-colors font-sans"
                      />
                    </Field>
                    <Field label="Target Milestones (Next Week)">
                      <textarea
                        value={nextWeekPlan}
                        onChange={(e) => setNextWeekPlan(e.target.value)}
                        className="w-full h-20 sm:h-24 p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none resize-none transition-colors font-sans"
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {/* CUBE TEST RESULTS */}
              <div className="bg-white dark:bg-slate-900/95 p-5 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl space-y-3 sm:space-y-4 transition-colors">
                <div className="border-b pb-3 flex justify-between items-start gap-3 flex-wrap">
                  <h3 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2">
                    CONCRETE COMPRESSIVE STRENGTH (CUBE TEST REGISTER)
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* Clear imported button */}
                    {importedCubeIds.size > 0 && (
                      <button
                        type="button"
                        onClick={handleClearImportedCubes}
                        className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        <X size={11} />
                        Clear imported ({importedCubeIds.size})
                      </button>
                    )}
                    {/* Import from Past Week */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={handleOpenCubeImportPanel}
                        className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        {loadingPastReportsForImport ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Download size={12} />
                        )}
                        Import from Past Week
                        <ChevronDown
                          size={11}
                          className={`transition-transform ${showCubeImportPanel ? "rotate-180" : ""}`}
                        />
                      </button>

                      {showCubeImportPanel && (
                        <div className="absolute right-0 top-full mt-1 z-50 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                          <div className="bg-slate-50 dark:bg-slate-950 px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                              Select Week to Import
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowCubeImportPanel(false)}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <X size={13} />
                            </button>
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {loadingPastReportsForImport && (
                              <div className="flex items-center justify-center gap-2 py-6 text-slate-400 text-xs">
                                <Loader2 size={14} className="animate-spin" />
                                Loading past reports…
                              </div>
                            )}
                            {!loadingPastReportsForImport &&
                              pastReportsForImport.length === 0 && (
                                <p className="text-center py-6 text-slate-400 text-xs italic">
                                  No other weekly reports found for this
                                  project.
                                </p>
                              )}
                            {!loadingPastReportsForImport &&
                              pastReportsForImport.map((r) => {
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
                                    onClick={() =>
                                      handleDetailImportFromReport(r)
                                    }
                                    className="w-full text-left px-3 py-2.5 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors group"
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 group-hover:text-amber-700 transition-colors">
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

                    {/* Existing Refresh button */}
                    <button
                      onClick={handleRefreshCubes}
                      disabled={refreshingCubes}
                      className="text-[10px] sm:text-xs bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw
                        size={13}
                        className={refreshingCubes ? "animate-spin" : ""}
                      />
                      <span>
                        {refreshingCubes
                          ? "Syncing..."
                          : "Refresh Period Cubes"}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <table className="w-full text-left text-[10px] sm:text-xs border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/90 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                        <th className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                          S/N
                        </th>
                        <th className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                          Date Cast
                        </th>
                        <th className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                          Element
                        </th>
                        <th className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                          7 Days
                        </th>
                        <th className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                          7D Status
                        </th>
                        <th className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                          28 Days
                        </th>
                        <th className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                          28D Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.cubeTests && report.cubeTests.length > 0 ? (
                        (report.cubeTests || []).map(
                          (ncr: any, index: number) => {
                            const isImported = importedCubeIds.has(
                              ncr.sampleId || ncr.id || "",
                            );
                            return (
                              <tr
                                key={index}
                                className={`border-b align-top hover:bg-slate-50 ${isImported ? "bg-amber-50/70" : ""}`}
                                title={
                                  isImported
                                    ? "Imported from past week"
                                    : undefined
                                }
                              >
                                <td className="p-1.5 sm:p-2 border font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                  {isImported && (
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1 mb-0.5 align-middle" />
                                  )}
                                  {ncr.sampleId || ncr.id || `CUBE-${index + 1}`}
                                </td>
                                <td className="p-1.5 sm:p-2 border font-medium text-slate-600 dark:text-slate-400">
                                  {ncr.dateCast || ncr.castDate || "—"}
                                </td>
                                <td className="p-1.5 sm:p-2 border text-slate-800 dark:text-slate-200 max-w-[150px] sm:max-w-sm whitespace-pre-wrap font-sans">
                                  {ncr.inscribedName || ncr.element || ncr.elementName || ncr.elementLevel || ncr.structureElement || "—"}
                                </td>
                                <td
                                  className={`p-1.5 sm:p-2 border font-medium ${!ncr.strength7Days && ncr.strength7Days !== 0 ? "text-gray-400" : "text-slate-800 dark:text-slate-200 font-mono"}`}
                                >
                                  {ncr.strength7Days !== undefined && ncr.strength7Days !== null && ncr.strength7Days !== ""
                                    ? (typeof ncr.strength7Days === "number" ? `${ncr.strength7Days} MPa` : `${ncr.strength7Days}`)
                                    : "PENDING"}
                                </td>
                                <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                                  <span
                                    className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black tracking-wide ${
                                      ncr.status7Days === "PASS" || ncr.status7Days === "PASSED" || ncr.status7Days === "APPROVED"
                                        ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
                                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                    }`}
                                  >
                                    {ncr.status7Days || (ncr.strength7Days ? "PASS" : "PENDING")}
                                  </span>
                                </td>
                                <td
                                  className={`p-1.5 sm:p-2 border font-medium ${!ncr.strength28Days && ncr.strength28Days !== 0 ? "text-gray-400" : "text-slate-800 dark:text-slate-200 font-mono"}`}
                                >
                                  {ncr.strength28Days !== undefined && ncr.strength28Days !== null && ncr.strength28Days !== ""
                                    ? (typeof ncr.strength28Days === "number" ? `${ncr.strength28Days} MPa` : `${ncr.strength28Days}`)
                                    : "PENDING"}
                                </td>
                                <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                                  <span
                                    className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black tracking-wide ${
                                      ncr.status28Days === "PASS" || ncr.status28Days === "PASSED" || ncr.status28Days === "APPROVED"
                                        ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
                                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                    }`}
                                  >
                                    {ncr.status28Days || (ncr.strength28Days ? "PASS" : "PENDING")}
                                  </span>
                                </td>
                              </tr>
                            );
                          },
                        )
                      ) : (
                        <tr>
                          <td
                            colSpan={7}
                            className="p-4 text-center text-gray-400 italic"
                          >
                            No cube test logs for this cycle. Click
                            &quot;Refresh Period Cubes&quot; above to sync.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* STRUCTURAL BY-TYPE FLOW: TABLE OF ELEMENTS FOLLOWED IMMEDIATELY BY COMPLETION STATUS IMAGE */}
              {(() => {
                const allElements = (report as any).structuralElements || [];
                const columnElements = allElements.filter((el: any) => {
                  const t = (
                    el.elementType ||
                    el.type ||
                    el.element ||
                    ""
                  ).toLowerCase();
                  return t.includes("column");
                });
                const beamElements = allElements.filter((el: any) => {
                  const t = (
                    el.elementType ||
                    el.type ||
                    el.element ||
                    ""
                  ).toLowerCase();
                  return t.includes("beam");
                });
                const slabElements = allElements.filter((el: any) => {
                  const t = (
                    el.elementType ||
                    el.type ||
                    el.element ||
                    ""
                  ).toLowerCase();
                  return t.includes("slab");
                });
                const otherElements = allElements.filter((el: any) => {
                  const t = (
                    el.elementType ||
                    el.type ||
                    el.element ||
                    ""
                  ).toLowerCase();
                  return !t.includes("column") && !t.includes("beam") && !t.includes("slab");
                });
                const selectedLevel = (
                  report.selectedLevel ||
                  (report as any).selectedLevelName ||
                  "MEZZANINE"
                ).toUpperCase();

                const renderElementsTable = (
                  typeLabel: string,
                  elements: any[],
                ) => {
                  if (elements.length === 0) {
                    return (
                      <div className="bg-slate-50 dark:bg-slate-950/80 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
                        <p className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          No Individual {typeLabel} Schedules Registered For{" "}
                          {selectedLevel}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Pre-pour alignment, rebar tolerances, and casting
                          clearances verified under site quality surveillance.
                        </p>
                      </div>
                    );
                  }

                  let totalCalc = 0;
                  let totalAch = 0;

                  return (
                    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                      <table className="w-full text-left text-[10px] sm:text-xs border-collapse min-w-[550px]">
                        <thead>
                          <tr className="bg-slate-900 dark:bg-slate-950 text-white font-bold border-b border-slate-800">
                            <th className="p-2 sm:p-2.5 border border-slate-800 text-slate-200">
                              ELEMENT IDENTIFIER
                            </th>
                            <th className="p-2 sm:p-2.5 border border-slate-800 text-slate-200">
                              GRID COORDINATE
                            </th>
                            <th className="p-2 sm:p-2.5 border border-slate-800 text-slate-200">
                              DESIGN VOL (m³)
                            </th>
                            <th className="p-2 sm:p-2.5 border border-slate-800 text-slate-200">
                              ACHIEVED (m³)
                            </th>
                            <th className="p-2 sm:p-2.5 border border-slate-800 text-slate-200">
                              % COMPLETION
                            </th>
                            <th className="p-2 sm:p-2.5 border border-slate-800 text-slate-200 text-center">
                              QC STATUS
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {elements.map((el: any, idx: number) => {
                            const calcVol =
                              parseFloat(
                                String(el.calculatedVolume || el.volume || 0),
                              ) || 0;
                            const achVol =
                              parseFloat(
                                String(
                                  el.achievedVolume ??
                                    el.arcvievedVolume ??
                                    el.achieved ??
                                    el.completedVolume ??
                                    0,
                                ),
                              ) || 0;
                            totalCalc += calcVol;
                            totalAch += achVol;

                            let compPct =
                              calcVol > 0
                                ? Math.round((achVol / calcVol) * 100)
                                : Number(
                                    el.completionPercentage ||
                                      el.completion ||
                                      0,
                                  );
                            compPct = Math.min(100, Math.max(0, compPct));

                            const statusText = String(
                              el.status ||
                                (compPct === 100
                                  ? "APPROVED"
                                  : compPct > 0
                                    ? "IN PROGRESS"
                                    : "PENDING"),
                            ).toUpperCase();

                            const isApproved =
                              statusText.includes("APPROV") ||
                              statusText.includes("COMPLET") ||
                              statusText.includes("PASS");
                            const isRejected =
                              statusText.includes("REJECT") ||
                              statusText.includes("HOLD") ||
                              statusText.includes("FAIL");

                            return (
                              <tr
                                key={idx}
                                className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/40"
                              >
                                <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                                  {(
                                    el.elementName ||
                                    el.name ||
                                    el.element ||
                                    el.id ||
                                    "—"
                                  ).toUpperCase()}
                                </td>
                                <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 font-mono text-slate-600 dark:text-slate-400">
                                  {el.gridLocation || el.grid || "—"}
                                </td>
                                <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 font-mono">
                                  {calcVol > 0 ? calcVol.toFixed(2) : "—"}
                                </td>
                                <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-white">
                                  {canUpdateReport ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={achVol}
                                        onChange={(e) =>
                                          handleUpdateElementVolume(
                                            el.id || el.elementName,
                                            Number(e.target.value) || 0,
                                          )
                                        }
                                        className="w-16 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono font-bold text-orange-600 dark:text-orange-400 text-[11px] focus:outline-none focus:border-orange-500"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateElementVolume(
                                            el.id || el.elementName,
                                            calcVol,
                                          )
                                        }
                                        className="px-1 py-0.5 text-[8px] font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 hover:bg-orange-200 border border-orange-300 dark:border-orange-800 rounded"
                                        title="Mark 100% Achieved"
                                      >
                                        100%
                                      </button>
                                    </div>
                                  ) : achVol > 0 ? (
                                    achVol.toFixed(2)
                                  ) : (
                                    "0.00"
                                  )}
                                </td>
                                <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          compPct === 100
                                            ? "bg-emerald-500"
                                            : "bg-orange-500"
                                        }`}
                                        style={{ width: `${compPct}%` }}
                                      />
                                    </div>
                                    <span className="font-mono font-bold text-[10px]">
                                      {compPct}%
                                    </span>
                                  </div>
                                </td>
                                <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                      isApproved
                                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                                        : isRejected
                                          ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-800"
                                          : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800"
                                    }`}
                                  >
                                    {statusText.slice(0, 14)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="bg-slate-100 dark:bg-slate-950 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                            <td
                              colSpan={2}
                              className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 uppercase"
                            >
                              Total {typeLabel} Scope
                            </td>
                            <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 font-mono">
                              {totalCalc.toFixed(2)}
                            </td>
                            <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 font-mono text-orange-600">
                              {totalAch.toFixed(2)}
                            </td>
                            <td
                              colSpan={2}
                              className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-emerald-600 font-mono"
                            >
                              {totalCalc > 0
                                ? Math.round((totalAch / totalCalc) * 100)
                                : 0}
                              % Cumulative Completion
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                };

                const renderCADCard = (
                  title: string,
                  subtitle: string,
                  img: string | any,
                  setter: (val: string) => void,
                  target: "column" | "beam" | "slab",
                ) => {
                  const hasImage =
                    typeof img === "string" &&
                    img.trim().length > 0 &&
                    img.startsWith("http");

                  return (
                    <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            {title}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {subtitle}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer shadow-xs transition-colors">
                            {uploadingImage === target ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Upload size={13} />
                            )}
                            <span>Upload Drawing</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, target)}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => openGalleryPicker(target)}
                            className="flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                          >
                            <Grid3x3 size={13} />
                            <span>Gallery</span>
                          </button>
                        </div>
                      </div>

                      <div className="min-h-[160px] sm:min-h-[200px] max-h-[380px] bg-slate-900/95 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-3 relative">
                        {hasImage ? (
                          <img
                            src={img}
                            alt={title}
                            className="max-h-[340px] max-w-full object-contain rounded"
                          />
                        ) : (
                          <div className="text-center p-6 space-y-2">
                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 font-black text-sm mx-auto">
                              CAD
                            </div>
                            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                              CAD Technical Drawing Attachment Pending
                            </p>
                            <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                              As-built inspection layout drawing for {title} is
                              pending attachment. Use Upload or Gallery above.
                            </p>
                          </div>
                        )}
                        {hasImage && (
                          <div className="absolute bottom-2 right-2 bg-slate-900/90 backdrop-blur-xs border border-white/10 px-2.5 py-1 rounded-full text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                            <span>✓</span> QC Visual Overlay Cleared
                          </div>
                        )}
                      </div>
                    </div>
                  );
                };

                return (
                  <div className="space-y-6 sm:space-y-8">
                    {/* 1. COLUMNS: TABLE OF ELEMENTS FOLLOWED IMMEDIATELY BY COMPLETION STATUS IMAGE */}
                    <div className="bg-white dark:bg-slate-900/95 p-5 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl space-y-4 transition-colors">
                      <div className="border-b pb-3 flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <h3 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2">
                            {selectedLevel} — COLUMN ELEMENTS STATUS
                          </h3>
                          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                            Reinforcement Alignment, Vertical Coordinates &
                            Concrete Volume Clearances
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleRefreshElements}
                            disabled={refreshingElements}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/60 px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-800 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Sync latest elements and achieved volumes from element registry"
                          >
                            <RefreshCw
                              size={11}
                              className={
                                refreshingElements ? "animate-spin" : ""
                              }
                            />
                            <span>
                              {refreshingElements
                                ? "Syncing..."
                                : "Sync Elements"}
                            </span>
                          </button>
                          <span className="text-[10px] sm:text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/60 px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-800">
                            {columnElements.length} Columns
                          </span>
                        </div>
                      </div>

                      {renderElementsTable("Columns", columnElements)}

                      {renderCADCard(
                        "Columns Layout & Casting Inspection",
                        "Pre-Pour Column Alignment, Vertical Rebar Clearances & CAD Completion Overlay",
                        columnLayoutImg,
                        setColumnLayoutImg,
                        "column",
                      )}
                    </div>

                    {/* 2. BEAMS: TABLE OF ELEMENTS FOLLOWED IMMEDIATELY BY COMPLETION STATUS IMAGE */}
                    <div className="bg-white dark:bg-slate-900/95 p-5 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl space-y-4 transition-colors">
                      <div className="border-b pb-3 flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <h3 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2">
                            {selectedLevel} — BEAM ELEMENTS STATUS
                          </h3>
                          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                            Primary & Secondary Beam Reinforcement, Spacing, and
                            Concrete Schedule
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleRefreshElements}
                            disabled={refreshingElements}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Sync latest elements and achieved volumes from element registry"
                          >
                            <RefreshCw
                              size={11}
                              className={
                                refreshingElements ? "animate-spin" : ""
                              }
                            />
                            <span>
                              {refreshingElements
                                ? "Syncing..."
                                : "Sync Elements"}
                            </span>
                          </button>
                          <span className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                            {beamElements.length} Beams
                          </span>
                        </div>
                      </div>

                      {renderElementsTable("Beams", beamElements)}

                      {renderCADCard(
                        "Beams Layout & Reinforcement Inspection",
                        "Primary & Secondary Beam Rebar Spacing, Links & Shear Links CAD Overlay",
                        beamLayoutImg,
                        setBeamLayoutImg,
                        "beam",
                      )}
                    </div>

                    {/* 3. SLABS: TABLE OF ELEMENTS & QUANTITY SCOPE FOLLOWED IMMEDIATELY BY COMPLETION STATUS IMAGE */}
                    <div className="bg-white dark:bg-slate-900/95 p-5 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl space-y-4 transition-colors">
                      <div className="border-b pb-3 flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <h3 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2">
                            {selectedLevel} — SLAB PANELS STATUS & QUANTITY
                            SCOPE
                          </h3>
                          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                            Panel Concrete Quantities, Casting Tolerances &
                            Stop-End Clearances
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleRefreshElements}
                            disabled={refreshingElements}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Sync latest elements and achieved volumes from element registry"
                          >
                            <RefreshCw
                              size={11}
                              className={
                                refreshingElements ? "animate-spin" : ""
                              }
                            />
                            <span>
                              {refreshingElements
                                ? "Syncing..."
                                : "Sync Elements"}
                            </span>
                          </button>
                          <span className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                            {slabElements.length > 0
                              ? `${slabElements.length} Panels`
                              : `${report.quantitySummary?.length || 3} Scope Items`}
                          </span>
                        </div>
                      </div>

                      {slabElements.length > 0 ? (
                        renderElementsTable("Slabs", slabElements)
                      ) : (
                        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                          <table className="w-full text-left text-[10px] sm:text-xs border-collapse min-w-[400px]">
                            <thead>
                              <tr className="bg-slate-900 dark:bg-slate-950 text-white font-bold border-b border-slate-800">
                                <th className="p-2 sm:p-2.5 border border-slate-800 text-slate-200">
                                  STRUCTURAL ELEMENT / ZONE
                                </th>
                                <th className="p-2 sm:p-2.5 border border-slate-800 text-slate-200">
                                  SCOPE (CUM)
                                </th>
                                <th className="p-2 sm:p-2.5 border border-slate-800 text-slate-200">
                                  % COMPLETION
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {report.quantitySummary &&
                              report.quantitySummary.length > 0 ? (
                                report.quantitySummary.map(
                                  (qty: any, qIdx: number) => (
                                    <tr
                                      key={qIdx}
                                      className="border-b border-slate-200 dark:border-slate-800"
                                    >
                                      <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 font-medium">
                                        {qty.element}
                                      </td>
                                      <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 font-mono">
                                        {qty.scope}
                                      </td>
                                      <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-orange-600 font-mono font-bold">
                                        {qty.completion}
                                      </td>
                                    </tr>
                                  ),
                                )
                              ) : (
                                <>
                                  <tr className="border-b border-slate-200 dark:border-slate-800">
                                    <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 font-medium">
                                      BEAMS
                                    </td>
                                    <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 font-mono">
                                      70 CUM
                                    </td>
                                    <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-500 font-mono">
                                      0%
                                    </td>
                                  </tr>
                                  <tr className="border-b border-slate-200 dark:border-slate-800">
                                    <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 font-medium">
                                      COLUMNS
                                    </td>
                                    <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 font-mono">
                                      33 CUM
                                    </td>
                                    <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-500 font-mono">
                                      0%
                                    </td>
                                  </tr>
                                  <tr className="border-b border-slate-200 dark:border-slate-800">
                                    <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 font-medium">
                                      SLAB
                                    </td>
                                    <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 font-mono">
                                      140 CUM
                                    </td>
                                    <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-500 font-mono">
                                      0%
                                    </td>
                                  </tr>
                                </>
                              )}
                              <tr className="bg-slate-100 dark:bg-slate-950 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                                <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                                  Calculated Total
                                </td>
                                <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 font-mono text-slate-800 dark:text-slate-200">
                                  {report.totalVolumeCalculated || "243 CUM"}
                                </td>
                                <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 font-mono text-orange-600">
                                  {report.overallQuantityCompletion || "0%"}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {renderCADCard(
                        "Slabs Layout & Concreting Inspection",
                        "Top & Bottom Reinforcement Mats, Chairs, Stop-Ends & Concreting CAD Overlay",
                        slabImg,
                        setslabImg,
                        "slab",
                      )}
                    </div>

                    {/* 4. WALLS, STAIRCASES & OTHER STRUCTURAL ELEMENTS (IF PRESENT) */}
                    {otherElements.length > 0 && (
                      <div className="bg-white dark:bg-slate-900/95 p-5 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl space-y-4 transition-colors">
                        <div className="border-b pb-3 flex justify-between items-center flex-wrap gap-2">
                          <div>
                            <h3 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2">
                              {selectedLevel} — WALLS, STAIRCASES & OTHER STRUCTURAL ELEMENTS
                            </h3>
                            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                              Shear Walls, Vertical Core Structures, Staircases & Auxiliary Element Takeoff
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] sm:text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                              {otherElements.length} Structural Elements
                            </span>
                          </div>
                        </div>

                        {renderElementsTable("Walls & Core Structures", otherElements)}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* MEP QA/QC CLEARANCE STATUS */}
              <div className="bg-white dark:bg-slate-900/95 p-5 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl space-y-3 sm:space-y-4 transition-colors">
                <div className="border-b pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2">
                      MEP QA/QC CLEARANCE STATUS
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">
                      Pre-Casting Service Installations & Clearance Log
                    </p>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-2 sm:px-3 py-1 rounded-full">
                    {mepClearance.filter((r) => r.status === "APPROVED").length}
                    /{mepClearance.length} Approved
                  </span>
                </div>

                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <table className="w-full text-left text-[10px] sm:text-xs border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-900 dark:bg-slate-950 text-white font-bold border-b border-slate-800">
                        <th className="p-1.5 sm:p-2 border border-slate-700">
                          ELEMENT / SERVICE
                        </th>
                        <th className="p-1.5 sm:p-2 border border-slate-700">
                          SUBCONTRACTOR / TRADE
                        </th>
                        <th className="p-1.5 sm:p-2 border border-slate-700 w-[80px]">
                          % COMPLETION
                        </th>
                        <th className="p-1.5 sm:p-2 border border-slate-700 w-[110px]">
                          QA/QC STATUS
                        </th>
                        <th className="p-1.5 sm:p-2 border border-slate-700">
                          REMARKS & OBSERVATIONS
                        </th>
                        <th className="p-1.5 sm:p-2 border border-slate-700 w-[40px]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {mepClearance.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b align-top hover:bg-slate-50"
                        >
                          <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                            <input
                              type="text"
                              value={row.elementService}
                              onChange={(e) => {
                                const updated = [...mepClearance];
                                updated[idx].elementService = e.target.value;
                                setMepClearance(updated);
                              }}
                              placeholder="e.g. Electrical Conduit Piping"
                              className="w-full bg-transparent text-[10px] sm:text-xs p-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </td>
                          <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                            <input
                              type="text"
                              value={row.subcontractor}
                              onChange={(e) => {
                                const updated = [...mepClearance];
                                updated[idx].subcontractor = e.target.value;
                                setMepClearance(updated);
                              }}
                              placeholder="e.g. Electrical Subcontractor"
                              className="w-full bg-transparent text-[10px] sm:text-xs p-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </td>
                          <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={row.completionPct}
                              onChange={(e) => {
                                const updated = [...mepClearance];
                                updated[idx].completionPct = Math.min(
                                  100,
                                  Math.max(0, parseInt(e.target.value) || 0),
                                );
                                setMepClearance(updated);
                              }}
                              className="w-full bg-transparent text-[10px] sm:text-xs p-1 border border-gray-200 rounded text-center font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </td>
                          <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                            <select
                              value={row.status}
                              onChange={(e) => {
                                const updated = [...mepClearance];
                                updated[idx].status = e.target
                                  .value as MepClearanceRow["status"];
                                setMepClearance(updated);
                              }}
                              className={`w-full text-[10px] sm:text-xs p-1 border rounded font-bold text-center focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                                row.status === "APPROVED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : row.status === "IN PROGRESS"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : row.status === "PENDING"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="IN PROGRESS">IN PROGRESS</option>
                              <option value="APPROVED">APPROVED</option>
                              <option value="HOLD">HOLD</option>
                              <option value="REJECTED">REJECTED</option>
                            </select>
                          </td>
                          <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                            <textarea
                              value={row.remarks}
                              onChange={(e) => {
                                const updated = [...mepClearance];
                                updated[idx].remarks = e.target.value;
                                setMepClearance(updated);
                              }}
                              placeholder="Remarks & observations..."
                              className="w-full bg-transparent text-[10px] sm:text-xs p-1 border border-gray-200 rounded resize-none h-12 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </td>
                          <td className="p-1.5 sm:p-2 border text-center">
                            <button
                              onClick={() => {
                                const updated = mepClearance.filter(
                                  (_, i) => i !== idx,
                                );
                                setMepClearance(updated);
                              }}
                              className="text-red-400 hover:text-red-600 p-1"
                              title="Remove row"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={() =>
                    setMepClearance([
                      ...mepClearance,
                      {
                        elementService: "",
                        subcontractor: "",
                        completionPct: 0,
                        status: "PENDING",
                        remarks: "",
                      },
                    ])
                  }
                  className="flex items-center gap-1.5 text-[10px] sm:text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={13} /> Add MEP Row
                </button>
              </div>

              {/* APPENDIX: NCR REGISTER */}
              {includeNcrsAndComments ? (
                <div className="bg-white dark:bg-slate-900/95 p-5 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl space-y-3 sm:space-y-4 transition-colors">
                  <div className="border-b pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2">
                        APPENDIX: NCR REGISTER
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">
                        Complete log showing NCR No., Location/Trade,
                        Description, Date Raised, Target Date, and Status.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-2 sm:px-3 py-1 rounded-full">
                        Open NCRs:{" "}
                        <b className="text-red-600">
                          {report.ncrRemediationLog?.length || 0}
                        </b>
                      </span>
                      <button
                        type="button"
                        onClick={handleRefreshNcrs}
                        disabled={refreshingNcrs}
                        className="text-[10px] sm:text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        title="Sync live NCRs"
                      >
                        <RefreshCw
                          size={13}
                          className={refreshingNcrs ? "animate-spin" : ""}
                        />
                        <span>
                          {refreshingNcrs ? "Syncing..." : "Refresh NCR Log"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <Field label="Field Remediation Summary">
                    <textarea
                      value={remediationSummaryText}
                      onChange={(e) =>
                        setRemediationSummaryText(e.target.value)
                      }
                      className="w-full h-14 sm:h-16 p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none resize-none transition-colors font-sans"
                    />
                  </Field>

                  <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                    <table className="w-full text-left text-[10px] sm:text-[11px] border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-slate-900 dark:bg-slate-950 text-white font-bold border-b border-slate-800">
                          <th className="p-1.5 sm:p-2 border border-slate-700">
                            NCR NO.
                          </th>
                          <th className="p-1.5 sm:p-2 border border-slate-700">
                            LOCATION / TRADE
                          </th>
                          <th className="p-1.5 sm:p-2 border border-slate-700">
                            DESCRIPTION
                          </th>
                          <th className="p-1.5 sm:p-2 border border-slate-700">
                            DATE RAISED
                          </th>
                          <th className="p-1.5 sm:p-2 border border-slate-700">
                            TARGET DATE
                          </th>
                          <th className="p-1.5 sm:p-2 border border-slate-700">
                            STATUS
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.ncrRemediationLog &&
                        report.ncrRemediationLog.length > 0 ? (
                          report.ncrRemediationLog.map((ncr, index) => {
                            const loc =
                              ncr.elementLevel ||
                              (ncr as any).location ||
                              "Site General";
                            const trade =
                              (ncr as any).trade || ncr.assignedTo || "";
                            return (
                              <tr
                                key={index}
                                className="border-b align-top hover:bg-slate-50"
                              >
                                <td className="p-1.5 sm:p-2 border font-mono font-bold text-slate-800 whitespace-nowrap">
                                  {ncr.refNo ||
                                    (ncr as any).ncrNumber ||
                                    `NCR-${String(index + 1).padStart(3, "0")}`}
                                </td>
                                <td className="p-1.5 sm:p-2 border font-medium text-slate-700">
                                  <div>{loc}</div>
                                  {trade && (
                                    <div className="text-[9px] text-slate-400">
                                      ({trade})
                                    </div>
                                  )}
                                </td>
                                <td className="p-1.5 sm:p-2 border text-gray-700 max-w-[200px] sm:max-w-sm whitespace-pre-wrap">
                                  {ncr.description || "Field variance logged"}
                                </td>
                                <td className="p-1.5 sm:p-2 border font-mono text-gray-600 whitespace-nowrap">
                                  {(ncr as any).dateIdentified ||
                                    (ncr as any).dateFound ||
                                    "—"}
                                </td>
                                <td className="p-1.5 sm:p-2 border font-mono text-gray-500 whitespace-nowrap">
                                  {ncr.targetFixDate ||
                                    (ncr as any).signDate ||
                                    "—"}
                                </td>
                                <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                                  <span
                                    className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black tracking-wide ${
                                      ncr.status === "OPEN"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-emerald-100 text-emerald-800"
                                    }`}
                                  >
                                    {ncr.status || "OPEN"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan={6}
                              className="p-4 text-center text-gray-400 italic"
                            >
                              No NCR logs for this cycle.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900/95 p-6 sm:p-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
                  <div className="inline-flex p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-2xl">
                    <EyeOff size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Option 2: Executive Clean Mode Active
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    NCR Remediation Log is suppressed for executive reporting.
                    Toggle "Show NCRs & Comments" above to inspect
                    non-conformance records.
                  </p>
                </div>
              )}

              {/* ========================================================================= */}
              {/* SECTION: MATERIAL DELIVERY LOG & QUALITY CONFORMANCE REGISTRY */}
              {/* ========================================================================= */}
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl overflow-hidden transition-all duration-200">
                {/* Header banner with gradient accent and live analytics KPIs */}
                <div className="p-5 sm:p-6 border-b border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-r from-slate-50/90 via-white to-slate-50/60 dark:from-slate-950/80 dark:via-slate-900/90 dark:to-slate-950/60">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base tracking-tight uppercase">
                            Material Delivery &amp; Batch Quality Log
                          </h3>
                          <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {report.materialDeliveries?.length || 0} Batch{(report.materialDeliveries?.length || 0) !== 1 ? "es" : ""}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Verified receiving logistics, quality compliance stamps, and site inspector remarks
                        </p>
                      </div>
                    </div>

                    {/* Live KPI Quick Pills & Sync Button */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      {(report.materialDeliveries || []).length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-xs">
                            <span className="text-slate-400 dark:text-slate-400 font-semibold uppercase text-[10px] mr-1.5">
                              Deliveries:
                            </span>
                            <span className="font-mono font-black">
                              {(report.materialDeliveries || []).length}
                            </span>
                          </div>

                          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-emerald-600/90 dark:text-emerald-400/90 uppercase text-[10px]">
                              Accepted:
                            </span>
                            <span className="font-mono font-black">
                              {(report.materialDeliveries || []).filter(
                                (m: any) =>
                                  !String(m.status || "").toUpperCase().includes("REJECT"),
                              ).length}
                            </span>
                          </div>

                          {(report.materialDeliveries || []).some(
                            (m: any) =>
                              Number(m.quantityRejected || 0) > 0 ||
                              String(m.status || "").toUpperCase() === "REJECTED",
                          ) && (
                            <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5 shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              <span className="text-rose-600/90 dark:text-rose-400/90 uppercase text-[10px]">
                                Rejected:
                              </span>
                              <span className="font-mono font-black">
                                {(report.materialDeliveries || []).filter(
                                  (m: any) =>
                                    Number(m.quantityRejected || 0) > 0 ||
                                    String(m.status || "").toUpperCase() === "REJECTED",
                                ).length}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleRefreshMaterials}
                        disabled={refreshingDeliveries}
                        className="px-3.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50 ml-auto sm:ml-0"
                      >
                        <RefreshCw
                          size={13}
                          className={refreshingDeliveries ? "animate-spin text-orange-500" : ""}
                        />
                        <span>{refreshingDeliveries ? "Syncing..." : "Sync Deliveries"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fluid Modern Table Container */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/80 dark:border-slate-800/80">
                        <th className="py-3.5 px-4 font-black">Date</th>
                        <th className="py-3.5 px-4 font-black">Material &amp; Specification</th>
                        <th className="py-3.5 px-4 font-black">Source / Supplier</th>
                        <th className="py-3.5 px-4 font-black text-right">Delivered</th>
                        <th className="py-3.5 px-4 font-black text-right text-emerald-700 dark:text-emerald-400">Accepted</th>
                        <th className="py-3.5 px-4 font-black text-right text-rose-700 dark:text-rose-400">Rejected</th>
                        <th className="py-3.5 px-4 font-black text-center">QC Status</th>
                        <th className="py-3.5 px-4 font-black">Remarks &amp; Quality Notes</th>
                        <th className="py-3.5 px-4 font-black text-center w-14">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {report.materialDeliveries &&
                      report.materialDeliveries.length > 0 ? (
                        report.materialDeliveries.map((md, index) => {
                          const isEditing = editingDeliveryIdx === index;
                          const st = (md.status || md.qaqcStatus || "APPROVED").toUpperCase();
                          const hasPartial =
                            st === "PARTIALLY ACCEPTED" ||
                            st === "PARTIALLY_ACCEPTED" ||
                            (Number(md.quantityRejected || 0) > 0 && Number(md.quantityAccepted || 0) > 0);
                          const isApprovedAsNoted =
                            st === "APPROVED AS NOTED" || st === "APPROVED_AS_NOTED";
                          const isRejected =
                            st === "REJECTED" || (Number(md.quantityAccepted || 0) === 0 && Number(md.quantityRejected || 0) > 0);

                          const unitStr = md.unit ? ` ${md.unit}` : "";
                          const delQty = md.quantityReceived ?? md.quantity ?? "—";
                          const accQty = md.quantityAccepted !== undefined ? `${md.quantityAccepted}${unitStr}` : "—";
                          const rejCount = Number(md.quantityRejected || 0);
                          const rejsStr = rejCount > 0 ? `${md.quantityRejected}${unitStr}` : "0";

                          if (isEditing) {
                            return (
                              <tr
                                key={index}
                                className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-l-amber-500 border-b border-amber-200 dark:border-amber-900/60"
                              >
                                <td className="p-3.5 font-mono text-xs font-bold text-slate-900 dark:text-white align-top">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                    <span>{md.deliveryDate}</span>
                                  </div>
                                </td>
                                <td className="p-3.5 align-top">
                                  <div className="font-bold text-slate-900 dark:text-white text-xs mb-1">
                                    {md.materialName}
                                  </div>
                                  <input
                                    type="text"
                                    value={editingDeliveryData.batchNumber || ""}
                                    onChange={(e) =>
                                      setEditingDeliveryData((p) => ({
                                        ...p,
                                        batchNumber: e.target.value,
                                      }))
                                    }
                                    placeholder="Batch # (optional)"
                                    className="w-full text-[10px] px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-amber-500/30 font-mono"
                                  />
                                </td>
                                <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium align-top">
                                  <div className="flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{md.supplier}</span>
                                  </div>
                                </td>
                                <td className="p-3.5 text-right align-top">
                                  <input
                                    type="number"
                                    step="any"
                                    value={
                                      editingDeliveryData.quantityReceived ??
                                      editingDeliveryData.quantity ??
                                      ""
                                    }
                                    onChange={(e) =>
                                      setEditingDeliveryData((p) => ({
                                        ...p,
                                        quantityReceived: Number(e.target.value) || 0,
                                        quantity: Number(e.target.value) || 0,
                                      }))
                                    }
                                    placeholder="Delivered"
                                    className="w-24 text-right px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono font-bold text-xs focus:ring-2 focus:ring-amber-500/30"
                                  />
                                </td>
                                <td className="p-3.5 text-right align-top">
                                  <input
                                    type="number"
                                    step="any"
                                    value={editingDeliveryData.quantityAccepted ?? ""}
                                    onChange={(e) =>
                                      setEditingDeliveryData((p) => ({
                                        ...p,
                                        quantityAccepted: Number(e.target.value) || 0,
                                      }))
                                    }
                                    placeholder="Accepted"
                                    className="w-24 text-right px-2 py-1 rounded-lg border border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-xs focus:ring-2 focus:ring-emerald-500/30"
                                  />
                                </td>
                                <td className="p-3.5 text-right align-top">
                                  <input
                                    type="number"
                                    step="any"
                                    value={editingDeliveryData.quantityRejected ?? ""}
                                    onChange={(e) =>
                                      setEditingDeliveryData((p) => ({
                                        ...p,
                                        quantityRejected: Number(e.target.value) || 0,
                                      }))
                                    }
                                    placeholder="Rejected"
                                    className="w-24 text-right px-2 py-1 rounded-lg border border-rose-400 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 font-mono font-bold text-xs focus:ring-2 focus:ring-rose-500/30"
                                  />
                                </td>
                                <td className="p-3.5 align-top">
                                  <select
                                    value={editingDeliveryData.status || "APPROVED"}
                                    onChange={(e) =>
                                      setEditingDeliveryData((p) => ({
                                        ...p,
                                        status: e.target.value,
                                        qaqcStatus: e.target.value,
                                      }))
                                    }
                                    className="w-full px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 cursor-pointer"
                                  >
                                    <option value="APPROVED">APPROVED</option>
                                    <option value="APPROVED_AS_NOTED">APPROVED AS NOTED</option>
                                    <option value="PARTIALLY_ACCEPTED">PARTIALLY ACCEPTED</option>
                                    <option value="REJECTED">REJECTED</option>
                                    <option value="PENDING">PENDING</option>
                                  </select>
                                </td>
                                <td className="p-3.5 space-y-1.5 align-top">
                                  <textarea
                                    rows={2}
                                    value={
                                      editingDeliveryData.remarks ||
                                      editingDeliveryData.qaqcRemarks ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      setEditingDeliveryData((p) => ({
                                        ...p,
                                        remarks: e.target.value,
                                        qaqcRemarks: e.target.value,
                                      }))
                                    }
                                    placeholder="Inspector remarks &amp; quality notes..."
                                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-[10px] leading-relaxed"
                                  />
                                  <input
                                    type="text"
                                    value={editingDeliveryData.rejectionReason || ""}
                                    onChange={(e) =>
                                      setEditingDeliveryData((p) => ({
                                        ...p,
                                        rejectionReason: e.target.value,
                                      }))
                                    }
                                    placeholder="Defect / Non-conformance reason (if any)..."
                                    className="w-full px-2 py-1 rounded-lg border border-rose-300 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 text-[10px]"
                                  />
                                </td>
                                <td className="p-3.5 text-center whitespace-nowrap align-top">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={handleSaveDeliveryRow}
                                      className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition active:scale-95"
                                      title="Save Delivery Changes"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelEditDelivery}
                                      className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 transition active:scale-95"
                                      title="Cancel"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr
                              key={index}
                              className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150"
                            >
                              {/* Date */}
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap align-top">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 text-[11px]">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{md.deliveryDate}</span>
                                </div>
                              </td>

                              {/* Material & Specification */}
                              <td className="py-3.5 px-4 align-top">
                                <div className="space-y-1">
                                  <div className="font-bold text-slate-900 dark:text-white text-xs tracking-tight">
                                    {md.materialName}
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {md.batchNumber && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                                        Batch: {md.batchNumber}
                                      </span>
                                    )}
                                    {md.trade && (
                                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                        {md.trade}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Source / Supplier */}
                              <td className="py-3.5 px-4 align-top text-slate-700 dark:text-slate-300 font-medium">
                                <div className="flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate max-w-[150px]" title={md.supplier}>
                                    {md.supplier}
                                  </span>
                                </div>
                              </td>

                              {/* Delivered Quantity */}
                              <td className="py-3.5 px-4 text-right align-top">
                                <div className="font-mono font-black text-slate-900 dark:text-white text-xs">
                                  {delQty}
                                  {unitStr && (
                                    <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                                      {unitStr}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Accepted Quantity */}
                              <td className="py-3.5 px-4 text-right align-top whitespace-nowrap">
                                {accQty !== "—" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-mono font-bold text-xs shadow-xs">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    <span>{accQty}</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-mono text-xs">—</span>
                                )}
                              </td>

                              {/* Rejected Quantity */}
                              <td className="py-3.5 px-4 text-right align-top whitespace-nowrap">
                                {rejCount > 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 font-mono font-bold text-xs shadow-xs">
                                    <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                    <span>{rejsStr}</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-mono text-xs">0</span>
                                )}
                              </td>

                              {/* QC Status */}
                              <td className="py-3.5 px-4 text-center align-top">
                                <div className="inline-flex flex-col items-center gap-1">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs ${
                                      hasPartial
                                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/80"
                                        : isApprovedAsNoted
                                        ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300/80"
                                        : isRejected
                                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/80"
                                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/80"
                                    }`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                    <span>
                                      {hasPartial
                                        ? "PARTIAL ACCEPT"
                                        : isApprovedAsNoted
                                        ? "APPROVED AS NOTED"
                                        : md.status}
                                    </span>
                                  </span>
                                  {md.ncrNumber && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-black text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60">
                                      <AlertTriangle className="w-2.5 h-2.5" />
                                      <span>#{md.ncrNumber}</span>
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Remarks & Quality Notes */}
                              <td className="py-3.5 px-4 align-top">
                                <div className="space-y-1.5 max-w-[280px]">
                                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 text-slate-800 dark:text-slate-200 font-medium text-[11px] leading-relaxed shadow-xs">
                                    {md.remarks || md.qaqcRemarks || "Verified compliant with specifications."}
                                  </div>

                                  {md.rejectionReason && (
                                    <div className="p-2 rounded-xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-[10px] font-medium flex items-start gap-1.5 leading-tight shadow-xs">
                                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                      <div>
                                        <strong className="block text-rose-900 dark:text-rose-200 uppercase text-[9px] font-black tracking-wider">
                                          Defect / Non-Conformance:
                                        </strong>
                                        <span>{md.rejectionReason}</span>
                                      </div>
                                    </div>
                                  )}

                                  {md.deliveryNoteNumber && (
                                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                      <FileText className="w-3 h-3 text-slate-400" />
                                      <span>DO/Waybill: {md.deliveryNoteNumber}</span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Action */}
                              <td className="py-3.5 px-4 text-center align-top">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditDelivery(index, md)}
                                  className="p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white text-slate-500 dark:text-slate-400 transition-all shadow-xs hover:shadow-md active:scale-95"
                                  title="Edit Delivery Entry"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={9} className="py-12 px-4 text-center">
                            <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-slate-400">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <Package className="w-6 h-6" />
                              </div>
                              <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                                No Delivery Logs Found For This Period
                              </p>
                              <p className="text-[11px] text-slate-400 text-center">
                                Click "Sync Deliveries" to auto-populate material deliveries matching this week's date range.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* APPENDIX: SITE COMMENTS / OBSERVATION LOG */}
              {includeNcrsAndComments ? (
                <div className="bg-white dark:bg-slate-900/95 p-5 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl space-y-3 sm:space-y-4 transition-colors">
                  <div className="border-b pb-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} className="text-indigo-600" />
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2">
                          APPENDIX: SITE COMMENTS / OBSERVATION LOG
                        </h3>
                        <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">
                          Ongoing register of routine quality observations,
                          photo logs, and vendor checks.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-xs font-bold text-indigo-600 bg-indigo-50 px-2 sm:px-3 py-1 rounded-full border border-indigo-100">
                        {report.siteComments?.length || 0} Observations
                      </span>
                      <button
                        type="button"
                        onClick={handleRefreshSiteComments}
                        disabled={refreshingComments}
                        className="text-[10px] sm:text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        title="Sync live site comments"
                      >
                        <RefreshCw
                          size={13}
                          className={refreshingComments ? "animate-spin" : ""}
                        />
                        <span>
                          {refreshingComments
                            ? "Syncing..."
                            : "Refresh Comments"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                    <table className="w-full text-left text-[10px] sm:text-[11px] border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-slate-900 dark:bg-slate-950 text-white font-bold border-b border-slate-800">
                          <th className="p-2 sm:p-2.5 border border-slate-800 text-slate-200 w-[120px] sm:w-[140px]">
                            DATE / INSPECTOR
                          </th>
                          <th className="p-2 sm:p-2.5 border border-slate-800 text-slate-200 w-[110px] sm:w-[130px]">
                            LOCATION / LEVEL
                          </th>
                          <th className="p-2 sm:p-2.5 border border-slate-800 text-slate-200 w-[100px] sm:w-[120px]">
                            ELEMENT / TRADE
                          </th>
                          <th className="p-2 sm:p-2.5 border border-slate-800 text-slate-200 w-[80px] sm:w-[100px]">
                            STATUS
                          </th>
                          <th className="p-2 sm:p-2.5 border border-slate-800 text-slate-200">
                            ROUTINE QUALITY OBSERVATIONS & VENDOR CHECKS
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.siteComments &&
                        report.siteComments.length > 0 ? (
                          (report.siteComments || []).map(
                            (comment: any, index: number) => {
                              const hasPhotos =
                                (comment.photos && comment.photos.length > 0) ||
                                (comment.images && comment.images.length > 0);
                              const locText =
                                [comment.location, comment.level]
                                  .filter(Boolean)
                                  .join(" - ") || "Site General";
                              const elemTrade =
                                [comment.element, comment.trade]
                                  .filter(Boolean)
                                  .join(" / ") || "—";
                              return (
                                <tr
                                  key={index}
                                  className={`border-b align-top hover:bg-slate-50 transition-colors ${
                                    index % 2 === 0
                                      ? "bg-white"
                                      : "bg-slate-50/60"
                                  }`}
                                >
                                  <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                                    <div className="space-y-0.5">
                                      <p className="font-mono font-bold text-slate-800 text-[9px] sm:text-[10px]">
                                        {comment.date || "N/A"}
                                      </p>
                                      <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium">
                                        {comment.reportNumber || "—"}
                                      </p>
                                      <p className="text-[9px] sm:text-[10px] text-indigo-600 font-semibold">
                                        {comment.inspector ||
                                          comment.vendorCheck ||
                                          "QC Inspector"}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="p-1.5 sm:p-2.5 border border-slate-200 font-medium text-slate-700">
                                    {locText}
                                  </td>
                                  <td className="p-1.5 sm:p-2.5 border border-slate-200 text-slate-700">
                                    {elemTrade}
                                  </td>
                                  <td className="p-2 sm:p-2.5 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                                    <span
                                      className={`inline-block px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-black tracking-wide border ${getStatusBadgeClass(
                                        comment.status,
                                      )}`}
                                    >
                                      {comment.status || "PENDING"}
                                    </span>
                                  </td>
                                  <td className="p-1.5 sm:p-2.5 border border-slate-200 text-slate-700 max-w-[250px] sm:max-w-md whitespace-pre-wrap leading-relaxed">
                                    <div>
                                      {comment.comments || comment.text || "—"}
                                    </div>
                                    {hasPhotos && (
                                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[8px] font-bold rounded">
                                        📷 Photos Logged (
                                        {comment.photos?.length ||
                                          comment.images?.length}
                                        )
                                      </span>
                                    )}
                                    {comment.vendorCheck && (
                                      <div className="text-[9px] text-slate-400 mt-0.5">
                                        Vendor Check: {comment.vendorCheck}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            },
                          )
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="p-4 sm:p-6 text-center text-gray-400 italic"
                            >
                              <div className="flex flex-col items-center gap-2">
                                <MessageSquare
                                  size={18}
                                  className="text-slate-300"
                                />
                                <p className="text-xs">
                                  No site comments for this reporting period.
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900/95 p-6 sm:p-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
                  <div className="inline-flex p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-2xl">
                    <EyeOff size={22} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Option 2: Executive Clean Mode Active
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Site Comments & Inspection Observations are omitted from
                    this executive view.
                  </p>
                </div>
              )}

              {/* PICTORIAL VIEWPORTS */}
              <div className="bg-white dark:bg-slate-900/95 p-5 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl space-y-4 sm:space-y-6 transition-colors">
                <div className="border-b pb-3 flex justify-between items-center">
                  <h3 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2">
                    PICTORIAL FIELD VIEWPORTS
                  </h3>
                  <button
                    onClick={handleAddImageSlot}
                    className="text-[10px] sm:text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <Plus size={13} /> Add Image
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {pictorialUrls.map((item, idx) => {
                    const currentImgUrl = item?.url;
                    return (
                      <div
                        key={idx}
                        className="bg-slate-50 border border-gray-200 rounded-xl p-2.5 sm:p-3 flex flex-col space-y-2.5 sm:space-y-3 shadow-xs"
                      >
                        <div className="w-full bg-slate-100 rounded-lg flex flex-col items-center justify-center text-center h-32 sm:h-28 relative overflow-hidden">
                          {currentImgUrl ? (
                            <img
                              src={getThumbnail(currentImgUrl)}
                              alt={item.caption || "Viewport"}
                              className="h-full w-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-gray-400">
                              <ImageIcon size={20} className="text-slate-300" />
                              <span className="text-[9px] font-mono">
                                No Image
                              </span>
                            </div>
                          )}

                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 flex items-center justify-center text-white gap-2 backdrop-blur-[2px]">
                            <label className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-[10px] font-medium cursor-pointer transition-colors">
                              {uploadingImage === idx ? (
                                <Loader2
                                  size={12}
                                  className="animate-spin text-orange-400"
                                />
                              ) : (
                                <Upload size={12} />
                              )}
                              <span>Upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, idx)}
                                className="hidden"
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => openGalleryPicker(idx)}
                              className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-[10px] font-medium transition-colors"
                            >
                              <Grid3x3 size={10} />
                              <span>Gallery</span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] sm:text-[9px] font-black tracking-wider uppercase text-slate-400">
                            Caption
                          </label>
                          <input
                            type="text"
                            value={item?.caption || ""}
                            placeholder="Enter viewport details..."
                            onChange={(e) =>
                              handleCaptionChange(idx, e.target.value)
                            }
                            className="w-full text-[11px] sm:text-xs p-1.5 sm:p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* APPENDIX: SITE INSTRUCTION REGISTER */}
              {includeSiteInstructions && (
                <div className="bg-white dark:bg-slate-900/95 p-5 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl space-y-3 sm:space-y-4 transition-colors">
                  <div className="border-b pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <FileCheck size={16} className="text-orange-600" />
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm tracking-wider uppercase flex items-center gap-2">
                          APPENDIX: SITE INSTRUCTION REGISTER
                        </h3>
                        <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">
                          Complete log showing SI No., Subject, Recipient, Issue
                          Date, Due Date, and Compliance Status.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-xs font-bold text-orange-600 bg-orange-50 px-2 sm:px-3 py-1 rounded-full border border-orange-100">
                        {((report.siteInstructions && report.siteInstructions.length > 0 ? report.siteInstructions : rawSiteInstructions) || []).length} Active Directives
                      </span>
                      <button
                        type="button"
                        onClick={handleRefreshSiteInstructions}
                        disabled={refreshingSiteInstructions}
                        className="text-[10px] sm:text-xs bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        title="Sync live site instructions"
                      >
                        <RefreshCw
                          size={13}
                          className={
                            refreshingSiteInstructions ? "animate-spin" : ""
                          }
                        />
                        <span>
                          {refreshingSiteInstructions
                            ? "Syncing..."
                            : "Refresh"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                    <table className="w-full text-left text-[10px] sm:text-[11px] border-collapse min-w-[750px]">
                      <thead>
                        <tr className="bg-slate-900 dark:bg-slate-950 text-white font-bold border-b border-slate-800">
                          <th className="p-2 sm:p-2.5 border border-slate-800 text-slate-200 w-[110px]">
                            SI NO.
                          </th>
                          <th className="p-2 sm:p-2.5 border border-slate-800 text-slate-200">
                            SUBJECT
                          </th>
                          <th className="p-2 sm:p-2.5 border border-slate-800 text-slate-200 w-[130px]">
                            RECIPIENT
                          </th>
                          <th className="p-2 sm:p-2.5 border border-slate-800 text-slate-200 w-[100px]">
                            ISSUE DATE
                          </th>
                          <th className="p-2 sm:p-2.5 border border-slate-800 text-slate-200 w-[100px]">
                            DUE DATE
                          </th>
                          <th className="p-2 sm:p-2.5 border border-slate-800 text-slate-200 w-[110px]">
                            COMPLIANCE STATUS
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const siList = (report.siteInstructions && report.siteInstructions.length > 0 ? report.siteInstructions : rawSiteInstructions) || [];
                          return siList && siList.length > 0 ? (
                            siList.map((si, index) => (
                              <tr
                                key={si.id || index}
                                className={`border-b align-top hover:bg-slate-50 transition-colors ${
                                  index % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                                }`}
                              >
                                <td className="p-2 sm:p-2.5 border border-slate-200 font-mono">
                                  <p className="font-bold text-slate-900">
                                    {si.instructionNumber || (si as any).refNo || `SI-${String(index + 1).padStart(3, "0")}`}
                                  </p>
                                  {si.stopWorkOrdered && (
                                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-red-600 text-white text-[8px] font-black tracking-wider rounded uppercase">
                                      STOP WORK
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 sm:p-2.5 border border-slate-200">
                                  <p className="font-bold text-slate-900 text-xs">
                                    {si.subject || si.title || "Directive"}
                                  </p>
                                  <p className="text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                                    {si.instructionText || si.issueSummary || "—"}
                                  </p>
                                  {si.location && (
                                    <p className="text-[9px] text-slate-400 mt-1">
                                      Zone: {si.location}{" "}
                                      {si.elementName
                                        ? `| Element: ${si.elementName}`
                                        : ""}
                                    </p>
                                  )}
                                </td>
                                <td className="p-2 sm:p-2.5 border border-slate-200 text-slate-700">
                                  <p className="font-medium text-slate-800">
                                    {si.contractorName ||
                                      si.recipientName ||
                                      (si as any).recipient ||
                                      "Main Contractor"}
                                  </p>
                                  {si.recipientRole && (
                                    <p className="text-[9px] text-slate-500">
                                      {si.recipientRole}
                                    </p>
                                  )}
                                </td>
                                <td className="p-2 sm:p-2.5 border border-slate-200 font-mono text-slate-600 whitespace-nowrap">
                                  {(si as any).issuedDate || (si as any).date ||
                                    (si.signedBy?.signedAt
                                      ? new Date(
                                          si.signedBy.signedAt,
                                        ).toLocaleDateString()
                                      : si.createdAt
                                        ? new Date(
                                            si.createdAt,
                                          ).toLocaleDateString()
                                        : "—")}
                                </td>
                                <td className="p-2 sm:p-2.5 border border-slate-200 font-mono text-slate-600 whitespace-nowrap">
                                  {si.complianceDeadline ||
                                    (si as any).targetDate ||
                                    (si as any).dueDate ||
                                    "Immediate"}
                                </td>
                                <td className="p-2 sm:p-2.5 border border-slate-200">
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[9px] font-black tracking-wide ${
                                      si.status === "COMPLIED" ||
                                      (si.status as string) === "CLOSED"
                                        ? "bg-green-100 text-green-800"
                                        : si.status === "ACKNOWLEDGED"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {si.status || "ISSUED"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={6}
                                className="p-4 text-center text-gray-400 italic"
                              >
                                No Site Instructions issued for this surveillance
                                period.
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PAGE 13: STATUTORY COMPILER CERTIFICATION & DIGITAL SIGN-OFF */}
              <div className="bg-white dark:bg-slate-900/95 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl space-y-6 transition-colors">
                <div className="border-b pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="text-[10px] font-black tracking-widest uppercase text-orange-600">
                      ISO 9001:2015 Clause 9.1 & 9.3 Conformity
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                      Compiler Certification & Quality Endorsement
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                        typeof report.preparedBy === "object" &&
                        report.preparedBy?.signed
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                      }`}
                    >
                      {typeof report.preparedBy === "object" &&
                      report.preparedBy?.signed ? (
                        <>
                          <CheckCircle2
                            size={13}
                            className="text-emerald-600"
                          />
                          <span>Digitally Certified</span>
                        </>
                      ) : (
                        <>
                          <Lock size={13} className="text-amber-600" />
                          <span>Pending Compiler Sign-Off</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                  I hereby certify that the structural metrics, cube test
                  registers, MEP clearance logs, material quality inspections,
                  surveillance notes, and directives recorded within this weekly
                  quality dossier represent an accurate, uncompromised account
                  of quality surveillance operations conducted across the
                  project during this reporting period.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950/60 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
                  <div className="space-y-4">
                    <div className="text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Document Compiler (Prepared By)
                      </span>
                      <p className="text-base font-black text-slate-900 dark:text-white">
                        {(typeof report.preparedBy === "object"
                          ? report.preparedBy?.name
                          : report.preparedBy) || "QA/QC Engineer"}
                      </p>
                      <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                        {(typeof report.preparedBy === "object"
                          ? report.preparedBy?.designation ||
                            report.preparedBy?.role
                          : "QA/QC Engineer") || "QA/QC Engineer"}
                      </p>
                    </div>

                    {typeof report.preparedBy === "object" &&
                    report.preparedBy?.signed ? (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Digital Verification Timestamp
                        </span>
                        <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                          {report.preparedBy.signedAt
                            ? new Date(
                                report.preparedBy.signedAt,
                              ).toLocaleString("en-US", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "Timestamped"}
                        </p>
                        <p className="text-[10px] font-mono text-emerald-600 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 size={11} /> Cryptographic signature
                          verified & stored
                        </p>
                      </div>
                    ) : null}

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Revision Control (Back Sign-Off Display)
                      </label>
                      <input
                        type="text"
                        value={revisionNumber}
                        onChange={(e) => setRevisionNumber(e.target.value)}
                        placeholder="Rev 1.0 (Final Submission)"
                        className="w-full sm:max-w-xs px-3 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        Printed on the final summary card of this dossier.
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center items-start md:items-end border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
                    {typeof report.preparedBy === "object" &&
                    report.preparedBy?.signed ? (
                      <div className="space-y-3 w-full sm:w-auto text-left md:text-right">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 font-bold text-xs">
                          <CheckCircle2
                            size={16}
                            className="text-emerald-600"
                          />
                          <span>Certified by Compiler</span>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={handleClearSignature}
                            className="text-xs text-slate-500 hover:text-red-600 underline font-semibold transition-colors"
                            title="Clear certification and return to draft"
                          >
                            Clear Signature / Revoke Certification
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSignAsCompiler}
                        disabled={isSigningCompiler}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
                      >
                        {isSigningCompiler ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={15} />
                        )}
                        <span>Certify & Sign as Compiler</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================== */}
        {/* PRINT & EXPORT CONFIGURATION MODAL */}
        {/* ========================================== */}
        {isPrintModalOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                    <Printer size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Print & PDF Configuration
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Select orientation and quality audit scope
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(92vh-140px)]">
                {/* Template / Design Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Palette size={13} className="text-orange-500" />
                      <span>1. Document Design & Theme</span>
                    </label>
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider">
                      {WEEKLY_REPORT_TEMPLATES[selectedTemplate]?.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {Object.values(WEEKLY_REPORT_TEMPLATES).map((tmpl) => {
                      const isSelected = selectedTemplate === tmpl.id;
                      return (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => setSelectedTemplate(tmpl.id)}
                          className={`p-3 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${
                            isSelected
                              ? "border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 text-slate-900 dark:text-white shadow-sm ring-2 ring-orange-500/20"
                              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {/* Color bar preview */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-3.5 h-3.5 rounded-full shadow-xs"
                                style={{ backgroundColor: tmpl.accentColor }}
                              />
                              <span
                                className="w-2.5 h-2.5 rounded-full opacity-60"
                                style={{ backgroundColor: tmpl.primaryHeaderBg }}
                              />
                            </div>
                            {isSelected ? (
                              <CheckCircle2 size={16} className="text-orange-600 dark:text-orange-400" />
                            ) : (
                              <span
                                className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: tmpl.accentLight,
                                  color: tmpl.accentDark,
                                }}
                              >
                                {tmpl.id.split("-")[0]}
                              </span>
                            )}
                          </div>

                          <p className="font-bold text-xs leading-snug">{tmpl.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {tmpl.tagline}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[10px] text-slate-400 italic px-1 pt-0.5">
                    {WEEKLY_REPORT_TEMPLATES[selectedTemplate]?.description}
                  </p>
                </div>

                {/* Orientation selector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    2. Print Orientation
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPrintOrientation("portrait")}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        printOrientation === "portrait"
                          ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-slate-900 dark:text-white ring-2 ring-orange-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-6 h-8 border-2 border-current rounded-sm flex items-center justify-center text-[9px] font-bold">
                          A4
                        </div>
                        {printOrientation === "portrait" && (
                          <Check size={16} className="text-orange-600" />
                        )}
                      </div>
                      <p className="font-bold text-xs">Portrait</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Standard vertical dossier binder format
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPrintOrientation("landscape")}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        printOrientation === "landscape"
                          ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-slate-900 dark:text-white ring-2 ring-orange-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-6 border-2 border-current rounded-sm flex items-center justify-center text-[9px] font-bold">
                          A4
                        </div>
                        {printOrientation === "landscape" && (
                          <Check size={16} className="text-orange-600" />
                        )}
                      </div>
                      <p className="font-bold text-xs">Landscape</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Wide presentation & engineering drawing layout
                      </p>
                    </button>
                  </div>
                </div>

                {/* Scope options */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      3. Quality Surveillance Scope
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Choose preset or customize below
                    </span>
                  </div>

                  {/* Presets */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPrintIncludeNcrs(true);
                        setPrintIncludeComments(true);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        printIncludeNcrs && printIncludeComments
                          ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-900 dark:text-white"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <p className="font-bold text-xs">
                        Option 1: Complete Audit
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Show NCRs & Site Comments
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPrintIncludeNcrs(false);
                        setPrintIncludeComments(false);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        !printIncludeNcrs && !printIncludeComments
                          ? "border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 text-slate-900 dark:text-white"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <p className="font-bold text-xs">
                        Option 2: Executive Clean
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        No NCRs & Site Comments
                      </p>
                    </button>
                  </div>

                  {/* Granular Individual Checkboxes */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Granular Scope Controls
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={printIncludeNcrs}
                        onChange={(e) => setPrintIncludeNcrs(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Include Non-Conformance Reports (NCRs)
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          Defect logs, root causes & remediation status
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={printIncludeComments}
                        onChange={(e) =>
                          setPrintIncludeComments(e.target.checked)
                        }
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Include Site Surveillance Comments
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          Inspector observations and compliance field notes
                        </span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={printIncludeSIs}
                        onChange={(e) => setPrintIncludeSIs(e.target.checked)}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Include Site Instructions (SIs)
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          Contractual directives ({rawSiteInstructions.length}{" "}
                          records)
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Revision Control Selector */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FileText size={13} className="text-orange-500" />
                      <span>4. Document Revision Control (Last Page)</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={revisionNumber}
                    onChange={(e) => setRevisionNumber(e.target.value)}
                    placeholder="e.g. Rev 1.0 (Final Submission) or Rev 02"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:border-orange-500 focus:outline-none transition-colors"
                  />
                  <p className="text-[10px] text-slate-400 italic px-1">
                    Sets the revision identifier stamped on the back sign-off page of the final quality dossier.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between gap-2.5">
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span>Selected Template:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {WEEKLY_REPORT_TEMPLATES[selectedTemplate]?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  {printOrientation === "landscape" && (
                    <button
                      type="button"
                      onClick={() => {
                        handleGenerate();
                        setIsPrintModalOpen(false);
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
                      title="Generate high-resolution landscape presentation PDF deck"
                    >
                      <FileText size={14} className="text-orange-400" />
                      <span>Download Slide Deck (PDF)</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      generateWeeklyReportPDF(
                        { ...report, templateId: selectedTemplate, revisionNumber, printOrientation },
                        activeProject || {},
                        company || {},
                        {
                          orientation: printOrientation,
                          templateId: selectedTemplate,
                          includeNcrsAndComments:
                            printIncludeNcrs && printIncludeComments,
                          includeNcrs: printIncludeNcrs,
                          includeSiteComments: printIncludeComments,
                          includeSiteInstructions: printIncludeSIs,
                          revisionNumber,
                        },
                      );
                      setIsPrintModalOpen(false);
                    }}
                    className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
                  >
                    <Printer size={14} />
                    <span>Open Print Window</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* PHOTO GALLERY PICKER MODAL */}
        {/* ========================================== */}
        {isPickerOpen && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full sm:max-w-3xl lg:max-w-4xl sm:rounded-2xl shadow-2xl flex flex-col h-[92vh] sm:h-[85vh] sm:max-h-[800px] animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 duration-300">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white sm:rounded-t-2xl">
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    Select from Photo Gallery
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                    Choose a project photo to attach to this viewport
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsPickerOpen(false);
                    setPickerTarget(null);
                    setSelectedPhotoId(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors shrink-0 ml-2"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Filter Bar */}
              <div className="bg-slate-50 p-3 sm:p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-600">
                  <Calendar size={13} className="text-slate-400 shrink-0" />
                  <span className="shrink-0">Report period:</span>
                  <span className="font-bold text-slate-900">
                    {report.weekStart || "N/A"}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="font-bold text-slate-900">
                    {report.weekEnd || "N/A"}
                  </span>
                </div>

                {/* Segmented Toggle */}
                <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 w-full sm:w-auto">
                  <button
                    onClick={() => setFilterByDates(true)}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-semibold transition-all ${
                      filterByDates
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Filter size={12} />
                    <span>Report Dates</span>
                  </button>
                  <button
                    onClick={() => setFilterByDates(false)}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-semibold transition-all ${
                      !filterByDates
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Images size={12} />
                    <span>All Photos</span>
                  </button>
                </div>
              </div>

              {/* Photo Grid */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-50/50">
                {photosLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <PhotoSkeleton key={i} />
                    ))}
                  </div>
                ) : eligiblePhotos && eligiblePhotos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {eligiblePhotos.map((photo: GalleryPhoto) => {
                      const isSelected = selectedPhotoId === photo.id;
                      return (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => handleSelectGalleryPhoto(photo)}
                          className={`group relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                            isSelected
                              ? "border-orange-500 ring-2 ring-orange-500 ring-offset-2 scale-[0.98]"
                              : "border-transparent hover:border-orange-300 hover:shadow-md hover:scale-[1.02]"
                          }`}
                        >
                          <img
                            src={
                              photo.thumbnailUrl ||
                              getThumbnail(photo.url, 400) ||
                              photo.url
                            }
                            alt={photo.caption || "Site photo"}
                            loading="lazy"
                            className={`w-full h-full object-cover transition-transform duration-300 ${
                              isSelected ? "scale-105" : "group-hover:scale-110"
                            }`}
                          />

                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-orange-500 text-white rounded-full p-1 shadow-lg animate-in zoom-in duration-200">
                              <Check size={14} strokeWidth={3} />
                            </div>
                          )}

                          <div
                            className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity ${
                              isSelected
                                ? "opacity-90"
                                : "opacity-60 group-hover:opacity-80"
                            }`}
                          />

                          <div className="absolute bottom-0 inset-x-0 p-2.5 sm:p-3 text-white">
                            <p className="font-semibold text-[10px] sm:text-xs leading-tight line-clamp-2">
                              {photo.caption || "Site Photo"}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Calendar size={9} className="text-white/60" />
                              <p className="text-white/60 text-[9px] sm:text-[10px] font-mono">
                                {formatPhotoDate(
                                  photo.takenAt || photo.createdAt,
                                )}
                              </p>
                            </div>
                          </div>

                          {!isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="bg-white/90 text-slate-800 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                                Tap to Select
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                      <Images size={28} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600">
                      {filterByDates
                        ? "No photos match this report's date range"
                        : "No photos in the project gallery"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      {filterByDates
                        ? "Try switching to 'All Photos' to see the entire gallery"
                        : "Upload photos to the project to see them here"}
                    </p>
                    {filterByDates && (
                      <button
                        onClick={() => setFilterByDates(false)}
                        className="mt-4 text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 font-semibold px-4 py-2 rounded-lg transition-colors border border-orange-200"
                      >
                        Show All Photos
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 sm:p-4 border-t border-gray-100 bg-white shrink-0 flex justify-between items-center sm:rounded-b-2xl">
                <span className="text-[10px] sm:text-xs text-slate-500">
                  {eligiblePhotos.length} photo
                  {eligiblePhotos.length !== 1 ? "s" : ""} available
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsPickerOpen(false);
                    setPickerTarget(null);
                    setSelectedPhotoId(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 16:9 EXECUTIVE PRESENTATION SLIDE DECK MODAL */}
      {/* ========================================== */}
      <WeeklyReportSlideDeckModal
        isOpen={isSlideDeckOpen}
        onClose={() => setIsSlideDeckOpen(false)}
        report={report}
        activeProject={activeProject}
        company={company}
        executiveSummary={executiveSummary}
        highlights={highlights}
        concerns={concerns}
        nextWeekPlan={nextWeekPlan}
        overallQualityCompliance={overallQualityCompliance}
        beamLayoutImg={beamLayoutImg}
        columnLayoutImg={columnLayoutImg}
        slabImg={slabImg}
        mepClearance={mepClearance}
        pictorialUrls={pictorialUrls}
        rawSiteInstructions={rawSiteInstructions}
      />

      {/* ========================================== */}
      {/* EMAIL DISPATCH & CORRESPONDENCE MODAL */}
      {/* ========================================== */}
      <EmailComposerModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        defaultSubject={`[QA/QC Weekly Report] ${report?.title || "Weekly Quality Report"} - ${activeProject?.name || "Site"}`}
        defaultBodyText={`Dear Team,\n\nPlease find attached the official Weekly Quality Assurance & Control Report for ${report?.title || "Week " + (report?.weekNumber || "")} (${activeProject?.name || "Project"}).\n\nKind regards,\n`}
        initialAttachments={emailAttachments}
        module="WEEKLY_REPORT"
        referenceId={report?.id}
        referenceTitle={report?.title || "Weekly Quality Report"}
        projectId={report?.projectId || activeProject?.id}
      />
    </>
  );
};

// ==========================================
// FIELD COMPONENT
// ==========================================

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1 sm:space-y-1.5 w-full">
    <label className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">
      {label}
    </label>
    {children}
  </div>
);

export default WeeklyReportDetail;
