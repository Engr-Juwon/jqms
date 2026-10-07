import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  X,
  Save,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  User,
  Calendar,
  FileText,
  Loader2,
  Camera,
  Trash2,
  ZoomIn,
  Activity,
  Hash,
  Building2,
  ExternalLink,
  ListChecks,
  Layers,
  ChevronLeft,
  ChevronRight,
  HardHat,
  ClipboardCheck,
  Clock,
  Construction,
  Grid3X3,
  StickyNote,
  Lock,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  FileWarning,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MinusCircle,
  TrendingUp,
  TrendingDown,
  Shield,
  History,
  Send,
  ArrowRight,
  Pencil,
  Printer,
  Plus,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import {
  hasMinRole,
  ROLE_TITLES,
  isUserEligibleForStakeholderRole,
} from "@/lib/permissions";
import { hasPermission } from "@/lib/rbac";
import { uploadMultiple, getThumbnail } from "@/lib/cloudinary";
import { syncMultiplePhotosToSiteGallery } from "@/lib/photoSync";
import { FieldPhotoCapture } from "@/components/FieldPhotoCapture";
import TradeSubtradeSelect, {
  type TradeSelection,
} from "@/components/masterdata/TradeSubtradeSelect";
import {
  computeQualityScore,
  computePassRate,
  computeRiskLevel,
  STATUS_STYLES,
  RISK_STYLES,
} from "@/lib/inspectionHelpers";
import {
  generateInspectionPDF,
  type StakeholderSignoff,
} from "@/lib/pdfGenerators";
import DateFormatter from "@/components/DateFormatter";
import { toast } from "react-hot-toast";
import type {
  Inspection,
  InspectionItem,
  InspectionStatus,
  ItemResult,
  StatusHistoryEntry,
} from "@/types";

export const InspectionDetail: React.FC = () => {
  const { id, inspectionId, projectId } = useParams<{
    id?: string;
    inspectionId?: string;
    projectId?: string;
  }>();
  const targetId = id || inspectionId || "";
  const { currentUser, company } = useAuthStore();
  const { activeProject } = useProjectStore();
  const navigate = useNavigate();

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [remarks, setRemarks] = useState("");
  const [contractor, setContractor] = useState("");
  const [tradeSelection, setTradeSelection] = useState<TradeSelection>({
    tradeId: "",
    tradeName: "",
    subtradeId: "",
    subtradeName: "",
  });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [approvalComment, setApprovalComment] = useState("");
  const [approverDesignation, setApproverDesignation] = useState<string>(() => {
    if (currentUser?.designation) return currentUser.designation;
    if (currentUser?.role && ROLE_TITLES[currentUser.role])
      return ROLE_TITLES[currentUser.role];
    return "QA/QC Engineer";
  });
  const [uploadingItem, setUploadingItem] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.designation) {
        setApproverDesignation(currentUser.designation);
      } else if (currentUser.role && ROLE_TITLES[currentUser.role]) {
        setApproverDesignation(ROLE_TITLES[currentUser.role]);
      }
    }
  }, [currentUser]);

  const canApproveInspection = hasPermission(
    currentUser?.role,
    "APPROVE_INSPECTION",
  );
  const canPerformInspection = hasPermission(
    currentUser?.role,
    "PERFORM_INSPECTION_CHECKLIST",
  );
  const canDeleteInspection = hasPermission(
    currentUser?.role,
    "DELETE_INSPECTION",
  );

  // States for the Interactive Photo Gallery Navigation
  const [activeGalleryItem, setActiveGalleryItem] =
    useState<InspectionItem | null>(null);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState<number>(0);

  // Storage dictionary for independent item remarks inputs
  const [localRemarks, setLocalRemarks] = useState<Record<string, string>>({});
  const isLvl3 = hasMinRole(currentUser?.role, 3);

  // Stakeholder Sign-Off Authorization State
  const DEFAULT_INSPECTION_STAKEHOLDERS: StakeholderSignoff[] = [
    {
      role: "QA/QC Engineer",
      name: "",
      designation: "QA/QC Engineer",
      required: true,
      signed: false,
    },
    {
      role: "Site / Construction Engineer",
      name: "",
      designation: "Site Engineer",
      required: true,
      signed: false,
    },
    {
      role: "Consultant / Resident Engineer",
      name: "",
      designation: "Resident Consultant",
      required: true,
      signed: false,
    },
  ];

  const [stakeholders, setStakeholders] = useState<StakeholderSignoff[]>(
    DEFAULT_INSPECTION_STAKEHOLDERS,
  );
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState("");

  const toggleStakeholderRequired = (index: number) => {
    setStakeholders((prev) =>
      prev.map((s, idx) =>
        idx === index ? { ...s, required: !s.required } : s,
      ),
    );
  };

  const updateStakeholder = (
    index: number,
    updates: Partial<StakeholderSignoff>,
  ) => {
    setStakeholders((prev) => {
      const updated = prev.map((s, idx) =>
        idx === index ? { ...s, ...updates } : s,
      );
      // Auto-persist when signed
      if (inspection && updates.signed !== undefined) {
        dbService
          .saveInspection({
            ...inspection,
            stakeholders: updated,
            updatedAt: new Date().toISOString(),
          })
          .catch((e) => console.error("Stakeholder auto-save error:", e));
      }
      return updated;
    });
  };

  const handleAddStakeholder = (roleName: string) => {
    if (!roleName.trim()) return;
    if (
      stakeholders.some(
        (s) => s.role.toLowerCase() === roleName.trim().toLowerCase(),
      )
    ) {
      toast.error(`Stakeholder card for "${roleName}" already exists`);
      return;
    }
    setStakeholders((prev) => [
      ...prev,
      {
        role: roleName.trim(),
        name: "",
        designation: roleName.trim(),
        required: true,
        signed: false,
      },
    ]);
    setShowAddRoleModal(false);
    setCustomRoleInput("");
    toast.success(`Added ${roleName} sign-off authorization`);
  };

  const handleRemoveStakeholder = (index: number) => {
    setStakeholders((prev) => prev.filter((_, idx) => idx !== index));
    toast.success("Sign-off requirement removed");
  };

  const handleRemarksChange = (itemId: string, val: string) => {
    setLocalRemarks((prev) => ({ ...prev, [itemId]: val }));
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, remarks: val } : it)),
    );
  };

  const loadData = async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const insp = await dbService.getInspection(targetId);
      if (insp) {
        setInspection(insp);
        setItems(insp.items || []);
        setRemarks(insp.remarks || "");
        setContractor(insp.contractor || "");
        setTradeSelection({
          tradeId: insp.tradeId || "",
          tradeName: insp.trade || "",
          subtradeId: insp.subtradeId || "",
          subtradeName: insp.subtrade || "",
        });

        if (insp.stakeholders && insp.stakeholders.length > 0) {
          setStakeholders(insp.stakeholders);
        } else {
          setStakeholders([
            {
              role: "QA/QC Engineer",
              name: insp.inspector?.name || insp.inspectorName || "",
              designation: insp.inspector?.designation || "QA/QC Engineer",
              required: true,
              signed: !!(
                insp.status === "APPROVED" || insp.status === "CLOSED"
              ),
              signedAt: insp.approvedAt
                ? new Date(insp.approvedAt).toISOString()
                : undefined,
            },
            {
              role: "Site / Construction Engineer",
              name: insp.subcontractorRepresentative || "",
              designation: "Site Engineer",
              required: true,
              signed: false,
            },
            {
              role: "Consultant / Resident Engineer",
              name: insp.consultantRepresentative || "",
              designation: "Resident Consultant",
              required: true,
              signed: false,
            },
          ]);
        }

        const initialRemarks: Record<string, string> = {};
        (insp.items || []).forEach((item) => {
          if (item.remarks) initialRemarks[item.id] = item.remarks;
        });
        setLocalRemarks(initialRemarks);
      }
    } catch (e) {
      console.error(e);
      toast.error("Could not load inspection details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetId]);

  const stats = {
    total: items.length,
    completed: items.filter((i) => i.result).length,
    pass: items.filter((i) => i.result === "PASS").length,
    fail: items.filter((i) => i.result === "FAIL").length,
    critFail: items.filter((i) => i.result === "FAIL" && i.critical).length,
    obs: items.filter((i) => i.result === "OBSERVATION").length,
    na: items.filter((i) => i.result === "NA").length,
    photos: items.reduce((acc, it) => acc + (it.photos?.length || 0), 0),
  };

  const qualityScore = computeQualityScore(items);
  const passRate = computePassRate(items);
  const riskLevel = computeRiskLevel(items);

  const handleResultChange = (itemId: string, result: ItemResult) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updated = {
            ...item,
            result,
            verifiedBy: currentUser?.fullName,
            verifiedAt: Date.now(),
          };
          return updated;
        }
        return item;
      }),
    );
  };

  const handlePhotoUpload = async (itemId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingItem(itemId);
    try {
      const results = await uploadMultiple(Array.from(files), "inspections");
      const urls = results.map((r) => r.url);
      if (urls.length > 0) {
        setItems((prev) =>
          prev.map((item) => {
            if (item.id === itemId) {
              return {
                ...item,
                photos: [...(item.photos || []), ...urls],
              };
            }
            return item;
          }),
        );
        toast.success(`Attached ${urls.length} photo(s)`);

        if (currentUser && inspection) {
          await syncMultiplePhotosToSiteGallery(
            urls.map((u) => ({
              projectId: inspection.projectId,
              companyId: currentUser.companyId || "",
              uploadedBy: currentUser.uid,
              uploadedByName: currentUser.fullName,
              uploaderRole: currentUser.role,
              url: u,
              category: "PROGRESS",
              sourceModule: "INSPECTION",
              sourceId: inspection.id || inspection.inspectionNumber,
              caption: `Inspection ${inspection.inspectionNumber} - Item Evidence`,
            })),
          );
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to upload photos");
    } finally {
      setUploadingItem(null);
    }
  };

  const handleFieldPhotoCapture = async (
    itemId: string,
    file: File,
    metadata: {
      latitude?: number;
      longitude?: number;
      timestamp: string;
      notes?: string;
    },
  ) => {
    setUploadingItem(itemId);
    try {
      const results = await uploadMultiple([file], "inspections/field");
      const urls = results.map((r) => r.url);
      if (urls.length > 0) {
        const photoUrl = urls[0];
        setItems((prev) =>
          prev.map((item) => {
            if (item.id === itemId) {
              return {
                ...item,
                photos: [...(item.photos || []), photoUrl],
              };
            }
            return item;
          }),
        );
        toast.success("Field photo captured & geostamped");

        if (currentUser && inspection) {
          await syncMultiplePhotosToSiteGallery([
            {
              projectId: inspection.projectId,
              companyId: currentUser.companyId || "",
              uploadedBy: currentUser.uid,
              uploadedByName: currentUser.fullName,
              uploaderRole: currentUser.role,
              url: photoUrl,
              category: "PROGRESS",
              sourceModule: "INSPECTION",
              sourceId: inspection.id || inspection.inspectionNumber,
              caption:
                metadata.notes ||
                `Field verification - ${inspection.inspectionNumber}`,
              location: metadata.latitude
                ? `GPS: ${metadata.latitude.toFixed(5)}, ${metadata.longitude?.toFixed(5)}`
                : undefined,
            },
          ]);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to process field photo");
    } finally {
      setUploadingItem(null);
    }
  };

  const removePhoto = (itemId: string, photoUrl: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            photos: (item.photos || []).filter((p) => p !== photoUrl),
          };
        }
        return item;
      }),
    );
  };

  const openPhotoGallery = (item: InspectionItem, index: number) => {
    setActiveGalleryItem(item);
    setCurrentPhotoIdx(index);
  };

  const nextPhoto = () => {
    if (!activeGalleryItem?.photos) return;
    setCurrentPhotoIdx((prev) => (prev + 1) % activeGalleryItem.photos!.length);
  };

  const prevPhoto = () => {
    if (!activeGalleryItem?.photos) return;
    setCurrentPhotoIdx((prev) =>
      prev === 0 ? activeGalleryItem.photos!.length - 1 : prev - 1,
    );
  };

  const generateNCRFromItem = (item: InspectionItem) => {
    if (!inspection) return;

    const queryParams = new URLSearchParams({
      sourceInspectionId: targetId,
      sourceItemId: item.id,
      title: `Inspection Failure: ${item.label}`,
      description: `Failed during inspection ${inspection.inspectionNumber}.\nRemarks: ${item.remarks || "No remarks"}`,
    }).toString();

    navigate(`/project/ncr/create?${queryParams}`);
  };

  const handleStatusChange = async (targetStatus: InspectionStatus) => {
    if (!currentUser || !inspection || !targetId) return;

    if (
      (targetStatus === "APPROVED" || targetStatus === "CLOSED") &&
      !canApproveInspection
    ) {
      toast.error(
        "Permission Denied: Level 4+ QA/QC Engineer or Quality Lead authorization is required to approve or close inspections.",
      );
      return;
    }

    setStatusChanging(true);
    try {
      const historyEntry: StatusHistoryEntry = {
        from: inspection.status,
        to: targetStatus,
        updatedBy: currentUser.uid,
        updatedByName: currentUser.fullName,
        updatedByRole:
          approverDesignation.trim() ||
          (currentUser.role
            ? ROLE_TITLES[currentUser.role]
            : "QA/QC Authority"),
        updatedByDesignation: approverDesignation.trim(),
        timestamp: Date.now(),
        comment: approvalComment || `Status set to ${targetStatus}`,
      };

      const updatedHistory = [
        ...(inspection.statusHistory || []),
        historyEntry,
      ];

      // Auto-sign QA/QC card if approving and not yet signed
      let currentStakeholders = [...stakeholders];
      if (targetStatus === "APPROVED") {
        const qaqcIdx = currentStakeholders.findIndex(
          (s) =>
            s.role.toLowerCase().includes("qa/qc") ||
            s.role.toLowerCase().includes("inspector"),
        );
        if (qaqcIdx >= 0 && !currentStakeholders[qaqcIdx].signed) {
          currentStakeholders[qaqcIdx] = {
            ...currentStakeholders[qaqcIdx],
            name: currentUser.fullName,
            designation: approverDesignation.trim() || "QA/QC Engineer",
            signed: true,
            signedAt: new Date().toISOString(),
          };
          setStakeholders(currentStakeholders);
        }
      }

      const updatedInsp: Inspection = {
        ...inspection,
        status: targetStatus,
        statusHistory: updatedHistory,
        passRate,
        qualityScore,
        riskLevel,
        items,
        stakeholders: currentStakeholders,
        updatedAt: new Date().toISOString(),
      };

      await dbService.saveInspection(updatedInsp);
      setApprovalComment("");
      toast.success(`Inspection status updated to ${targetStatus}`);
      loadData();
    } catch (e) {
      console.error(e);
      toast.error("Failed to transition status");
    } finally {
      setStatusChanging(false);
    }
  };

  const save = async () => {
    if (!currentUser || !inspection || !targetId) return;

    setSaving(true);
    try {
      const updatedInsp: Inspection = {
        ...inspection,
        items,
        remarks,
        contractor,
        trade: tradeSelection.tradeName,
        tradeId: tradeSelection.tradeId,
        subtrade: tradeSelection.subtradeName,
        subtradeId: tradeSelection.subtradeId,
        passRate,
        qualityScore,
        riskLevel,
        stakeholders,
        updatedAt: new Date().toISOString(),
      };

      await dbService.saveInspection(updatedInsp);
      toast.success("Inspection workspace saved");
      loadData();
    } catch (e) {
      console.error(e);
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInspection = async () => {
    if (!inspection || !targetId) return;

    if (!canDeleteInspection) {
      toast.error(
        "Permission Denied: You do not have statutory permission to delete Inspection records.",
      );
      return;
    }

    const confirm = window.confirm(
      `Are you sure you want to permanently delete inspection ${inspection.inspectionNumber}?`,
    );
    if (!confirm) return;

    try {
      const projId = projectId || activeProject?.id || "";
      await dbService.deleteInspection(targetId, projId);
      toast.success("Inspection removed");
      navigate(
        projectId
          ? `/project/${projectId}/inspections`
          : `/project/inspections`,
      );
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    }
  };

  const handleDownloadPDF = () => {
    if (!inspection) return;
    try {
      generateInspectionPDF(
        { ...inspection, stakeholders },
        activeProject || {},
        company || {},
      );
      toast.success("Inspection Report downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-orange-600" size={32} />
        <p className="text-sm font-semibold text-slate-500">
          Loading inspection workspace...
        </p>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="text-center py-20 text-slate-500">
        <FileText className="mx-auto mb-3 opacity-40" size={48} />
        <h2 className="text-xl font-bold">Inspection not found</h2>
      </div>
    );
  }

  const isReadOnly =
    (inspection.status === "APPROVED" || inspection.status === "CLOSED") &&
    !canApproveInspection;
  const rs = RISK_STYLES[riskLevel] || RISK_STYLES.LOW;
  const RiskIcon = rs.icon || AlertTriangle;

  const getStatusColor = (status: InspectionStatus) => {
    const colors: Record<string, string> = {
      DRAFT:
        "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700",
      PENDING_REVIEW:
        "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800",
      APPROVED:
        "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
      CLOSED:
        "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800",
    };
    return colors[status] || colors.DRAFT;
  };

  // Group items by category
  const groupedItems: Record<string, InspectionItem[]> = {};
  items.forEach((item) => {
    const cat = item.category || "General Quality Requirements";
    if (!groupedItems[cat]) groupedItems[cat] = [];
    groupedItems[cat].push(item);
  });

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-16">
      {/* ═══ TOP NAVIGATION BAR ═══ */}
      <div className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition text-slate-500"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-2 py-1 rounded-md border border-orange-200 dark:border-orange-800">
                  {inspection.inspectionNumber}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-md border ${getStatusColor(inspection.status)}`}
                >
                  {inspection.status.replace("_", " ")}
                </span>
                {isReadOnly && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 font-semibold">
                    <Lock size={10} /> Read Only
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition shadow-sm"
              >
                <Printer size={13} /> Print
              </button>
              <button
                onClick={save}
                disabled={saving || isReadOnly}
                className="px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 flex items-center gap-1.5 disabled:opacity-50 transition shadow-sm"
              >
                <Save size={13} /> {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleDeleteInspection}
                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900 transition"
                title="Delete Inspection"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ═══ Header & Title ═══ */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {inspection.element}
              </h1>
              <span className="text-lg font-semibold text-slate-600 dark:text-slate-400">
                {inspection.stage}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                <DateFormatter timestamp={inspection.createdAt} format="date" />
              </span>
              <span className="flex items-center gap-1">
                <User size={14} />
                {inspection.inspectorName}
              </span>
              <span className="flex items-center gap-1">
                <Building2 size={14} />
                {inspection.projectName || activeProject?.name}
              </span>
            </div>
          </div>

          {/* Quality Score Gauge */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Quality Score
              </p>
              <p
                className={`text-2xl font-bold ${qualityScore >= 90 ? "text-emerald-600" : qualityScore >= 70 ? "text-amber-600" : "text-red-600"}`}
              >
                {qualityScore}%
              </p>
            </div>
            <div className="w-12 h-12 relative">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  className="text-slate-100 dark:text-slate-800"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={125.6}
                  strokeDashoffset={125.6 - (125.6 * qualityScore) / 100}
                  className={`${qualityScore >= 90 ? "text-emerald-500" : qualityScore >= 70 ? "text-amber-500" : "text-red-500"} transition-all duration-500`}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* ═══ Inspection Identity & Meta ═══ */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <TradeSubtradeSelect
              companyId={currentUser?.companyId || company?.id}
              selectedTradeId={tradeSelection.tradeId}
              selectedTradeName={tradeSelection.tradeName}
              selectedSubtrade={tradeSelection.subtradeName}
              onTradeChange={(tId, tName) =>
                setTradeSelection((prev) => ({
                  ...prev,
                  tradeId: tId,
                  tradeName: tName,
                }))
              }
              onSubtradeChange={(stName: string) =>
                setTradeSelection((prev) => ({
                  ...prev,
                  subtradeName: stName,
                }))
              }
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Location & Structural Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin size={10} /> Location Level
                </label>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {inspection.floor || inspection.levelName || "—"}
                </p>
                {inspection.zone && (
                  <p className="text-xs text-slate-500">
                    Zone: {inspection.zone}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Grid3X3 size={10} /> Grid Line
                </label>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {inspection.zone || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Building2 size={10} /> Contractor
                </label>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {contractor || inspection.contractor || "—"}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock size={10} /> Created
                </label>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {inspection.createdAt
                    ? new Date(inspection.createdAt).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ KPI Metrics Row ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Items
              </p>
              <ListChecks size={14} className="text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.total}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {stats.completed} completed
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Pass Rate
              </p>
              <TrendingUp size={14} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">{passRate}%</p>
            <p className="text-xs text-emerald-600/70 mt-1">
              {stats.pass} passed
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Failures
              </p>
              <TrendingDown size={14} className="text-red-500" />
            </div>
            <p
              className={`text-2xl font-bold ${stats.fail > 0 ? "text-red-600" : "text-slate-400"}`}
            >
              {stats.fail}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {stats.critFail > 0
                ? `${stats.critFail} critical`
                : "No critical fails"}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Observations
              </p>
              <AlertCircle size={14} className="text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.obs}</p>
            <p className="text-xs text-slate-500 mt-1">{stats.na} N/A</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Risk Level
              </p>
              <RiskIcon size={14} className={rs.text} />
            </div>
            <p className={`text-2xl font-bold ${rs.text}`}>{rs.label}</p>
            <p className="text-xs text-slate-500 mt-1">Based on checks</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Photos
              </p>
              <ImageIcon size={14} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.photos}</p>
            <p className="text-xs text-slate-500 mt-1">Attached media</p>
          </div>
        </div>

        {/* ═══ Workflow & Status Control ═══ */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Activity size={16} className="text-orange-600" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Workflow & Status Control
            </h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Your Signatory Designation / Official Title
                </label>
                <input
                  type="text"
                  value={approverDesignation}
                  onChange={(e) => setApproverDesignation(e.target.value)}
                  placeholder="e.g. QA/QC Engineer, Supervising Consultant"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Authorization Notes / Remarks
                </label>
                <input
                  type="text"
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Add authorization notes or conditional remarks..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-orange-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 flex-wrap pt-1">
              <button
                onClick={() => handleStatusChange("DRAFT")}
                disabled={statusChanging || inspection.status === "DRAFT"}
                className="px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-sm disabled:opacity-50"
              >
                <Pencil size={12} className="inline mr-1" /> Revert to Draft
              </button>

              <button
                onClick={() => handleStatusChange("PENDING_REVIEW")}
                disabled={
                  statusChanging || inspection.status === "PENDING_REVIEW"
                }
                className="px-3 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-sm disabled:opacity-50"
              >
                <Send size={12} className="inline mr-1" /> Submit for Review
              </button>

              <button
                onClick={() => handleStatusChange("APPROVED")}
                disabled={
                  statusChanging ||
                  inspection.status === "APPROVED" ||
                  !canApproveInspection
                }
                title={
                  !canApproveInspection
                    ? "Requires Level 4+ QA/QC Engineer authorization"
                    : ""
                }
                className="px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-sm transition"
              >
                <CheckCircle2 size={12} className="inline mr-1" /> Approve
              </button>

              <button
                onClick={() => handleStatusChange("CLOSED")}
                disabled={
                  statusChanging ||
                  inspection.status === "CLOSED" ||
                  !canApproveInspection
                }
                title={
                  !canApproveInspection
                    ? "Requires Level 4+ QA/QC Engineer authorization"
                    : ""
                }
                className="px-3 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-sm transition"
              >
                <ShieldCheck size={12} className="inline mr-1" /> Close File
              </button>
            </div>
          </div>
        </div>

        {/* ═══ Inspection Checklist ═══ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardCheck size={18} className="text-orange-600" />{" "}
              Inspection Checklist Items
            </h2>
          </div>

          {Object.entries(groupedItems).map(([category, catItems]) => (
            <div
              key={category}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm"
            >
              <div className="bg-slate-50 dark:bg-slate-850 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-slate-500" />
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {category}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                  {catItems.length} items
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {catItems.map((item, idx) => {
                  const isExpanded = expanded.has(item.id);
                  const hasPhotos = item.photos && item.photos.length > 0;

                  return (
                    <div
                      key={item.id || idx}
                      className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {`${idx + 1}.`}
                            </span>
                            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                              {item.label}
                            </span>
                            {item.critical && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                                CRITICAL HOLD POINT
                              </span>
                            )}
                          </div>
                          {item.acceptanceCriteria && (
                            <p className="text-xs text-slate-500">
                              {item.acceptanceCriteria}
                            </p>
                          )}
                        </div>

                        {/* Status Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {(
                            [
                              "PASS",
                              "FAIL",
                              "OBSERVATION",
                              "NA",
                            ] as ItemResult[]
                          ).map((r) => (
                            <button
                              key={r}
                              disabled={isReadOnly || !canPerformInspection}
                              onClick={() => handleResultChange(item.id, r)}
                              className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition ${
                                item.result === r
                                  ? r === "PASS"
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                    : r === "FAIL"
                                      ? "bg-red-600 text-white border-red-600 shadow-sm"
                                      : r === "OBSERVATION"
                                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                        : "bg-slate-600 text-white border-slate-600 shadow-sm"
                                  : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-40"
                              }`}
                              title={r}
                            >
                              {r === "PASS" && <Check size={12} />}
                              {r === "FAIL" && <X size={12} />}
                              {r === "OBSERVATION" && (
                                <AlertTriangle size={12} />
                              )}
                              {r === "NA" && <MinusCircle size={12} />}
                            </button>
                          ))}
                          <button
                            onClick={() =>
                              setExpanded((prev) => {
                                const next = new Set(prev);
                                if (next.has(item.id)) next.delete(item.id);
                                else next.add(item.id);
                                return next;
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition ml-1"
                          >
                            {isExpanded ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expandable remarks & photo capture */}
                      {isExpanded && (
                        <div className="mt-3 space-y-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                          <textarea
                            value={localRemarks[item.id] || ""}
                            onChange={(e) =>
                              handleRemarksChange(item.id, e.target.value)
                            }
                            disabled={isReadOnly}
                            placeholder="Enter engineering remarks, observations, or corrective action notes..."
                            className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none resize-none focus:border-orange-500"
                            rows={2}
                          />

                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <div className="flex gap-2">
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                id={`file-${item.id}`}
                                className="hidden"
                                disabled={isReadOnly}
                                onChange={(e) =>
                                  handlePhotoUpload(item.id, e.target.files)
                                }
                              />
                              <label
                                htmlFor={`file-${item.id}`}
                                className={`px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs flex items-center gap-1.5 font-medium transition cursor-pointer shadow-sm`}
                              >
                                <Camera size={12} />
                                {uploadingItem === item.id
                                  ? "Uploading..."
                                  : "Attach Photos"}
                              </label>
                            </div>

                            <FieldPhotoCapture
                              onCapture={(file, meta) =>
                                handleFieldPhotoCapture(item.id, file, meta)
                              }
                            />

                            <div className="flex gap-2">
                              {item.result === "FAIL" && !item.ncrId && (
                                <button
                                  onClick={() => generateNCRFromItem(item)}
                                  className="px-3 py-1.5 text-xs font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 border border-red-200 dark:border-red-800 rounded-lg transition flex items-center gap-1.5"
                                >
                                  <FileWarning size={12} /> Raise NCR
                                </button>
                              )}
                              {item.ncrId && (
                                <button
                                  onClick={() =>
                                    navigate(`/project/ncr/${item.ncrId}`)
                                  }
                                  className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition flex items-center gap-1.5"
                                >
                                  <ExternalLink size={12} /> View NCR
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Thumbnails */}
                          {hasPhotos && (
                            <div className="pt-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <ImageIcon size={10} /> Attached Media (
                                {(item.photos || []).length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {(item.photos || []).map((photo, pIdx) => (
                                  <div
                                    key={pIdx}
                                    className="relative w-20 h-20 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition"
                                  >
                                    <img
                                      src={getThumbnail(photo)}
                                      alt={`Finding ${pIdx + 1}`}
                                      className="w-full h-full object-cover transition duration-200 group-hover:scale-110"
                                      onClick={() =>
                                        openPhotoGallery(item, pIdx)
                                      }
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                                      <ZoomIn
                                        size={16}
                                        className="text-white drop-shadow"
                                      />
                                    </div>
                                    {!isReadOnly && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removePhoto(item.id, photo);
                                        }}
                                        className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                                      >
                                        <X size={10} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ═══ SECTION: STATUTORY TRADE & OFFICER SIGNOFF AUTHORIZATIONS ═══ */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                SECTION: STATUTORY TRADE & OFFICER SIGNOFF AUTHORIZATIONS
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Role-enforced signoffs governed by quality and trade
                authorities. Only personnel holding the corresponding discipline
                role or designation can sign their section.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddRoleModal(true)}
                className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Plus size={13} />
                <span>Add Discipline Signoff</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {stakeholders.map((sh, idx) => {
              const isQAQC =
                sh.role.toLowerCase().includes("qa/qc") ||
                sh.role.toLowerCase().includes("inspector");
              const canSignThisRole = isUserEligibleForStakeholderRole(
                currentUser,
                sh.role,
              );
              const isSignedByMe =
                sh.signed && sh.name === currentUser?.fullName;
              const canClearSign =
                sh.signed &&
                (isSignedByMe ||
                  (currentUser?.role &&
                    hasPermission(currentUser.role, "APPROVE_INSPECTION")));

              return (
                <div
                  key={idx}
                  className={`p-3.5 border rounded-xl transition-all flex flex-col justify-between ${
                    sh.signed
                      ? "bg-emerald-50/70 border-emerald-400 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-200"
                      : sh.required
                        ? "bg-amber-50/40 border-amber-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                        : "bg-gray-50 border-gray-200 text-gray-400 opacity-60 dark:bg-slate-950/40 dark:border-slate-800"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold uppercase text-[10px] flex items-center gap-1.5">
                      {sh.role}
                      {sh.signed && (
                        <span className="bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                          SIGNED
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      disabled={isQAQC}
                      onClick={() => toggleStakeholderRequired(idx)}
                      className={`text-[9px] font-black px-2 py-0.5 rounded ${
                        sh.required
                          ? "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200"
                          : "bg-gray-200 text-gray-600 dark:bg-slate-800 dark:text-slate-400"
                      } ${isQAQC ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                    >
                      {isQAQC
                        ? "MANDATORY"
                        : sh.required
                          ? "REQUIRED"
                          : "OPTIONAL"}
                    </button>
                  </div>

                  {/* Signatory Particulars & Strict Role Signing */}
                  <div className="space-y-2 my-2 bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-lg border border-gray-200/80 dark:border-slate-800">
                    {sh.signed ? (
                      <div className="space-y-1.5 py-1">
                        <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                          <span>{sh.name}</span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                            {sh.signedAt
                              ? new Date(sh.signedAt).toLocaleDateString()
                              : "Signed"}
                          </span>
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                          {sh.designation || sh.role}
                        </div>
                        {canClearSign && (
                          <button
                            type="button"
                            onClick={() =>
                              updateStakeholder(idx, {
                                name: "",
                                designation: "",
                                signed: false,
                                signedAt: undefined,
                              })
                            }
                            className="text-[10px] text-rose-600 hover:underline font-bold mt-1 inline-block"
                          >
                            Clear / Resign
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-0.5">
                            Signatory Full Name
                          </label>
                          <input
                            type="text"
                            value={sh.name || ""}
                            disabled={!canSignThisRole}
                            onChange={(e) =>
                              updateStakeholder(idx, { name: e.target.value })
                            }
                            placeholder={
                              canSignThisRole
                                ? "Enter your full name"
                                : `Awaiting ${sh.role} signature`
                            }
                            className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-xs font-semibold outline-none focus:border-[#ea580c] text-gray-900 dark:text-white disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-950"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-0.5">
                            Signatory Designation / Title
                          </label>
                          <input
                            type="text"
                            value={sh.designation || ""}
                            disabled={!canSignThisRole}
                            onChange={(e) =>
                              updateStakeholder(idx, {
                                designation: e.target.value,
                              })
                            }
                            placeholder={`e.g. ${sh.role}`}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-xs font-semibold outline-none focus:border-[#ea580c] text-gray-900 dark:text-white disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-950"
                          />
                        </div>
                        {canSignThisRole ? (
                          <button
                            type="button"
                            onClick={() =>
                              updateStakeholder(idx, {
                                name: currentUser?.fullName || "",
                                designation:
                                  currentUser?.designation ||
                                  (currentUser?.role
                                    ? ROLE_TITLES[currentUser.role]
                                    : sh.role),
                                signed: true,
                                signedAt: new Date().toISOString(),
                              })
                            }
                            className="text-[10px] text-[#ea580c] hover:underline font-bold text-left block mt-1"
                          >
                            + Sign as {currentUser?.fullName} (
                            {currentUser?.designation ||
                              (currentUser?.role
                                ? ROLE_TITLES[currentUser.role]
                                : sh.role)}
                            )
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 italic pt-1">
                            <Lock
                              size={10}
                              className="text-slate-400 shrink-0"
                            />
                            <span>Only {sh.role} can sign this section</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200/60 dark:border-slate-800">
                    <span className="text-[10px] font-medium text-gray-500">
                      {sh.required ? "Will appear on PDF" : "Excluded from PDF"}
                    </span>
                    {!isQAQC && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStakeholder(idx)}
                        className="text-[10px] text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ Interactive Photo Lightbox Gallery Modal ═══ */}
      {activeGalleryItem &&
        activeGalleryItem.photos &&
        activeGalleryItem.photos.length > 0 && (
          <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-md">
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start text-white">
              <div className="max-w-lg">
                <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">
                  Photo Navigator
                </p>
                <h4 className="text-sm font-semibold text-slate-200">
                  {activeGalleryItem.label}
                </h4>
              </div>
              <button
                onClick={() => setActiveGalleryItem(null)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition text-white"
              >
                <X size={22} />
              </button>
            </div>

            <div className="relative flex items-center justify-center w-full max-w-5xl h-[70vh] px-16">
              {activeGalleryItem.photos.length > 1 && (
                <button
                  onClick={prevPhoto}
                  className="absolute left-0 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
                >
                  <ChevronLeft size={28} />
                </button>
              )}

              <img
                src={activeGalleryItem.photos[currentPhotoIdx]}
                alt="Expanded view"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/10"
              />

              {activeGalleryItem.photos.length > 1 && (
                <button
                  onClick={nextPhoto}
                  className="absolute right-0 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
                >
                  <ChevronRight size={28} />
                </button>
              )}
            </div>

            <div className="mt-6 text-center space-y-4 w-full max-w-2xl">
              <p className="text-sm text-slate-400 font-medium">
                Photo{" "}
                <span className="text-white font-bold">
                  {currentPhotoIdx + 1}
                </span>{" "}
                of {activeGalleryItem.photos.length}
              </p>

              {activeGalleryItem.photos.length > 1 && (
                <div className="flex justify-center gap-2 overflow-x-auto py-2 max-w-full px-4">
                  {activeGalleryItem.photos.map((ph, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPhotoIdx(idx)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                        idx === currentPhotoIdx
                          ? "border-orange-500 scale-110 shadow-lg shadow-orange-500/20"
                          : "border-transparent opacity-50 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={getThumbnail(ph)}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      {/* ═══ Add Discipline Signoff Authorization Modal ═══ */}
      {showAddRoleModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus size={16} className="text-orange-600" />
                Add Discipline Signoff Authorization
              </h3>
              <button
                onClick={() => setShowAddRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select standard engineering discipline or type custom designation
              to require on this inspection report:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Mechanical Engineer",
                "Electrical Engineer",
                "Plumbing Engineer",
                "MEP Coordinator",
                "Safety Manager",
                "Structural Consultant",
                "Materials Engineer",
                "Surveyor",
              ].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleAddStakeholder(r)}
                  className="px-2.5 py-2 text-left bg-slate-50 hover:bg-orange-50 hover:text-orange-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition"
                >
                  + {r}
                </button>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Or Custom Trade Role / Designation
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customRoleInput.trim()) {
                      e.preventDefault();
                      handleAddStakeholder(customRoleInput);
                    }
                  }}
                  placeholder="e.g. Geotechnical Specialist"
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  disabled={!customRoleInput.trim()}
                  onClick={() => handleAddStakeholder(customRoleInput)}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionDetail;
