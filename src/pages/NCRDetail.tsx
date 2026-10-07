import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  User,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  History,
  FileText,
  LayoutGrid,
  FileCheck2,
  ShieldCheck,
  Plus,
  Trash2,
  Image as ImageIcon,
  Upload,
  Clock,
  Briefcase,
  FileWarning,
  Flame,
  FileDown,
  ExternalLink,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { plannerSync } from "@/lib/plannerSync";
import { hasMinRole } from "@/lib/permissions";
import { hasPermission } from "@/lib/rbac";
import TradeSubtradeSelect, {
  type TradeSelection,
} from "@/components/masterdata/TradeSubtradeSelect";
import LevelElementSelect, {
  type LevelElementSelection,
} from "@/components/masterdata/LevelElementSelect";
import MultiLevelElementSelect, {
  type SelectedElementItem,
} from "@/components/masterdata/MultiLevelElementSelect";
import type {
  NonConformanceReport,
  StatusHistoryEntry,
  SiteInstruction,
} from "@/types";
import { generateSiteInstructionPDF } from "@/lib/pdfGenerators";
import { toast } from "react-hot-toast";
import {
  generateStandardNCRPDF,
  type StandardNCRPDFData,
  type NCRPhoto,
} from "@/services/pdf/ncrReport";
import { uploadMultiple, getThumbnail } from "@/lib/cloudinary";
import { syncMultiplePhotosToSiteGallery } from "@/lib/photoSync";
import { FieldPhotoCapture } from "@/components/FieldPhotoCapture";

type PhotoType = "before" | "after";

export interface PhotoItem {
  url: string;
  caption?: string;
}

const DEFAULT_SPEC_REF = "BS 8110 / BS EN 1992 (Eurocode 2)";

const normalizePhotos = (photos: any[]): PhotoItem[] => {
  if (!Array.isArray(photos)) return [];
  return photos
    .map((item) => {
      if (typeof item === "string") {
        return { url: item, caption: "" };
      }
      return { url: item?.url || "", caption: item?.caption || "" };
    })
    .filter((p) => Boolean(p.url));
};

export const mapNCRToPDFData = (
  ncr: any,
  company: any,
  activeProject: any,
): StandardNCRPDFData => {
  const descriptionItems = (() => {
    if (
      ncr.descriptionItems &&
      Array.isArray(ncr.descriptionItems) &&
      ncr.descriptionItems.length > 0
    ) {
      return ncr.descriptionItems.filter(
        (i: any) => typeof i === "string" && i.trim().length > 0,
      );
    }
    if (ncr.description) {
      return ncr.description
        .split("\n")
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0);
    }
    return [ncr.title || "No itemized description recorded."];
  })();

  const correctiveActions = (() => {
    if (
      ncr.correctiveActions &&
      Array.isArray(ncr.correctiveActions) &&
      ncr.correctiveActions.length > 0
    ) {
      return ncr.correctiveActions
        .map((a: any) =>
          typeof a === "string" ? a : a.action || a.description || "",
        )
        .filter((a: string) => a.trim().length > 0);
    }
    if (ncr.correctiveAction) {
      return [ncr.correctiveAction];
    }
    return [];
  })();

  const rootCauseType = (() => {
    if (ncr.rootCauseType) return ncr.rootCauseType;
    if (ncr.rootCause?.startsWith("Other:")) return "Other";
    if (
      ["Workmanship", "Material Defect", "Drawing Error"].includes(
        ncr.rootCause || "",
      )
    ) {
      return ncr.rootCause;
    }
    return "Workmanship";
  })();

  const rootCauseOtherText = (() => {
    if (ncr.rootCauseType === "Other" || ncr.rootCause?.startsWith("Other:")) {
      return (
        ncr.rootCauseOtherText ||
        ncr.rootCause?.replace("Other:", "").trim() ||
        ""
      );
    }
    return "";
  })();

  const finalStatus = (() => {
    if (ncr.status === "CLOSED") return "CLOSED";
    if (ncr.status === "REJECTED") return "REJECTED";
    if (ncr.status === "RESOLVED") return "RESOLVED";
    if (ncr.status === "UNDER_REVIEW") return "UNDER_REVIEW";
    return "OPEN";
  })();

  const signDate = (() => {
    if (ncr.signDate) return ncr.signDate;
    if (ncr.closedAt) return new Date(ncr.closedAt).toLocaleDateString("en-GB");
    const closedEntry = ncr.statusHistory?.find(
      (h: any) => h.status === "CLOSED",
    );
    if (closedEntry?.timestamp)
      return new Date(closedEntry.timestamp).toLocaleDateString("en-GB");
    return "";
  })();

  const qaqcEngineerName = (() => {
    if (ncr.qaqcEngineerName) return ncr.qaqcEngineerName;
    const closedEntry = ncr.statusHistory?.find(
      (h: any) => h.status === "CLOSED",
    );
    return closedEntry?.userName || ncr.raisedByName || ncr.reportedBy || "";
  })();

  const beforePhotos = normalizePhotos(
    ncr.beforePhotos || ncr.attachments || [],
  );
  const afterPhotos = normalizePhotos(ncr.afterPhotos || []);
  const totalPhotos = beforePhotos.length + afterPhotos.length;

  return {
    logoBase64: company?.logoUrl || activeProject?.logoUrl || "",
    ncrNumber: ncr.ncrNumber || "NCR-001",
    revisionNo: ncr.revisionNo || "00",
    projectName:
      ncr.projectName || activeProject?.name || "Structural Quality Project",
    projectAddress: activeProject?.location || activeProject?.address || "",
    companyName: ncr.companyName || company?.name || "JQMS Civil Quality",
    companyAddress: company?.address,
    companyEmail: company?.email,
    companyPhone: company?.phone,
    contractorName: ncr.contractorName || company?.name || "Main Contractor",
    elementName:
      ncr.elementNames && ncr.elementNames.length > 1
        ? `${ncr.elementNames.join(", ")} (${ncr.elementNames.length} elements)`
        : ncr.elementName || ncr.title || "Structural Element",
    elementNames: ncr.elementNames || (ncr.elementName ? [ncr.elementName] : []),
    locationLevel: ncr.locationLevel || ncr.location || "All Levels / Site",
    gridLine: ncr.gridLine || "—",
    specReference: ncr.specReference || DEFAULT_SPEC_REF,
    drawingNumber: ncr.drawingNumber || "—",
    dispositionType: ncr.dispositionType || "Rework",
    dateFound:
      ncr.dateFound ||
      (ncr.createdAt
        ? new Date(ncr.createdAt).toISOString().split("T")[0]
        : ""),
    deadline: ncr.deadline || "—",
    reportedBy: ncr.reportedBy || ncr.raisedByName || "QA/QC Inspector",
    assignedTo:
      ncr.assignedTo ||
      ncr.assignedToName ||
      (ncr.trade
        ? `${ncr.trade}${ncr.subtrade ? ` (${ncr.subtrade})` : ""}`
        : "Unassigned"),
    assignedToName: ncr.assignedToName || "",
    trade: ncr.trade || "",
    subtrade: ncr.subtrade || "",
    descriptionItems,
    rootCauseType,
    rootCauseDetails: ncr.rootCause || "",
    rootCauseOtherText,
    correctiveActions,
    preventiveAction: ncr.preventiveAction || "",
    beforePhotos,
    afterPhotos,
    statusHistory: Array.isArray(ncr.statusHistory) ? ncr.statusHistory : [],
    verification: {
      reInspected: ncr.status === "CLOSED",
      fixSatisfiesSpec: ncr.status === "CLOSED",
      photosTaken: totalPhotos > 0,
      ...(ncr.verification || {}),
    },
    verificationRemarks: {
      reInspected:
        ncr.status === "CLOSED"
          ? "Post-remedial physical site inspection complete"
          : "Pending Site Verification",
      fixSatisfiesSpec:
        ncr.status === "CLOSED"
          ? "Rectification satisfies project specification requirements & codes"
          : "Pending Final Approval",
      photosTaken:
        totalPhotos > 0
          ? `${totalPhotos} photographic evidence item(s) archived in appendix`
          : "No photos recorded",
      ...(ncr.verificationRemarks || {}),
    },
    finalStatus,
    qaqcEngineerName,
    siteManagerName: ncr.siteManagerName || "",
    consultantName: ncr.consultantName || "",
    signDate,
    closedAt: ncr.closedAt,
  };
};

export const NCRDetail: React.FC = () => {
  const { id, ncrId, projectId } = useParams<{
    id?: string;
    ncrId?: string;
    projectId?: string;
  }>();
  const targetId = id || ncrId || "";
  const { currentUser, company } = useAuthStore();
  const { activeProject } = useProjectStore();
  const navigate = useNavigate();
  const currentProjId = projectId || activeProject?.id || "proj-skyline-tower";

  const [ncr, setNcr] = useState<NonConformanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingType, setUploadingType] = useState<PhotoType | null>(null);

  const [beforePhotos, setBeforePhotos] = useState<PhotoItem[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<PhotoItem[]>([]);

  const isLvl3 = hasMinRole(currentUser?.role, 3);
  const canCloseNCR = hasPermission(currentUser?.role, "APPROVE_CLOSE_NCR");
  const canIssueSI = hasPermission(currentUser?.role, "ISSUE_SITE_INSTRUCTION");
  const canDeleteNCR = hasPermission(currentUser?.role, "DELETE_NCR");
  const canEditNCR = hasPermission(currentUser?.role, "EDIT_NCR");

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    category: "Structural",
    location: "",
    elementName: "",
    locationLevel: "",
    gridLine: "",
    specReference: DEFAULT_SPEC_REF,
    drawingNumber: "",
    dispositionType: "Rework" as "Rework" | "Repair" | "Use As-Is" | "Scrap",
    dateFound: "",
    trade: "",
    deadline: "",
    assignedToName: "",
    rootCauseType: "Workmanship" as
      | "Workmanship"
      | "Material Defect"
      | "Drawing Error"
      | "Other",
    rootCauseOtherText: "",
    rootCause: "",
    correctiveAction: "",
    correctiveActionsList: [] as string[],
    preventiveAction: "",
    companyName: company?.name || "",
    verification: {
      reInspected: false,
      fixSatisfiesSpec: false,
      photosTaken: false,
    },
    verificationRemarks: {
      reInspected: "",
      fixSatisfiesSpec: "",
      photosTaken: "",
    },
  });

  const [tradeSelection, setTradeSelection] = useState<TradeSelection>({
    tradeId: "",
    tradeName: "",
    subtradeId: "",
    subtradeName: "",
  });

  const [selectedElements, setSelectedElements] = useState<SelectedElementItem[]>([]);

  const [levelSelection, setLevelSelection] = useState<LevelElementSelection>({
    levelId: "",
    levelName: "",
    elementId: "",
    elementName: "",
    gridLocation: "",
    elementType: "",
  });

  const [newStatus, setNewStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");
  const [linkedSIs, setLinkedSIs] = useState<SiteInstruction[]>([]);

  const isOverdue = (() => {
    if (!ncr || ncr.status === "CLOSED" || ncr.status === "RESOLVED")
      return false;
    if (!ncr.deadline) return false;
    const deadlineDate = new Date(ncr.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadlineDate < today;
  })();

  const daysOverdue = (() => {
    if (!ncr?.deadline) return 0;
    const deadlineDate = new Date(ncr.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor(
      (today.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return Math.max(0, diff);
  })();

  const loadData = async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const [data, siList] = await Promise.all([
        dbService.getNCR(targetId),
        dbService.getSiteInstructions(currentProjId),
      ]);
      setLinkedSIs(siList.filter((si) => si.ncrId === targetId));
      if (data) {
        setNcr(data);

        const loadedBefore = normalizePhotos(
          data.beforePhotos || data.attachments || [],
        );
        const loadedAfter = normalizePhotos(data.afterPhotos || []);

        setBeforePhotos(loadedBefore);
        setAfterPhotos(loadedAfter);

        let rType:
          | "Workmanship"
          | "Material Defect"
          | "Drawing Error"
          | "Other" = "Workmanship";
        let rOtherText = "";
        if (data.rootCauseType) {
          rType = data.rootCauseType as any;
          rOtherText = data.rootCauseOtherText || "";
        } else if (data.rootCause?.startsWith("Other:")) {
          rType = "Other";
          rOtherText = data.rootCause.replace("Other:", "").trim();
        } else if (
          ["Workmanship", "Material Defect", "Drawing Error"].includes(
            data.rootCause || "",
          )
        ) {
          rType = data.rootCause as any;
        }

        const actionsList =
          data.correctiveActions && data.correctiveActions.length > 0
            ? (data.correctiveActions as any[]).map((a) =>
                typeof a === "string" ? a : a.action || a.description || "",
              )
            : data.correctiveAction
              ? [data.correctiveAction]
              : [];

        const photoCount = loadedBefore.length + loadedAfter.length;

        setForm({
          title: data.title || "",
          description:
            data.descriptionItems?.join("\n") || data.description || "",
          priority: data.priority || "MEDIUM",
          category: data.category || "Structural",
          location: data.location || data.locationLevel || "",
          elementName: data.elementName || "",
          locationLevel: data.locationLevel || data.location || "",
          gridLine: data.gridLine || "",
          specReference: data.specReference || DEFAULT_SPEC_REF,
          drawingNumber: data.drawingNumber || "",
          dispositionType: (data.dispositionType as any) || "Rework",
          dateFound: data.dateFound || "",
          trade: data.trade || "",
          deadline: data.deadline || "",
          assignedToName: data.assignedToName || "",
          rootCauseType: rType,
          rootCauseOtherText: rOtherText,
          rootCause: data.rootCause || "",
          correctiveAction: data.correctiveAction || "",
          correctiveActionsList: actionsList,
          preventiveAction: data.preventiveAction || "",
          companyName: data.companyName || company?.name || "",
          verification: {
            reInspected: data.status === "CLOSED",
            fixSatisfiesSpec: data.status === "CLOSED",
            photosTaken: photoCount > 0,
            ...(data.verification || {}),
          },
          verificationRemarks: {
            reInspected: "",
            fixSatisfiesSpec: "",
            photosTaken: "",
            ...(data.verificationRemarks || {}),
          },
        });

        setTradeSelection({
          tradeId: data.tradeId || "",
          tradeName: data.tradeName || data.trade || "",
          subtradeId: data.subtradeId || "",
          subtradeName: data.subtradeName || data.subtrade || "",
        });

        setLevelSelection({
          levelId: data.levelId || "",
          levelName:
            data.locationLevel || data.levelName || data.location || "",
          elementId: data.elementId || data.structuralElementId || "",
          elementName: data.elementName || "",
          gridLocation: data.gridLine || data.gridAxis || "",
          elementType: data.elementType || "",
        });

        if (data.elementsData && data.elementsData.length > 0) {
          setSelectedElements(data.elementsData);
        } else if (data.elementIds && data.elementIds.length > 0) {
          setSelectedElements(
            data.elementIds.map((id, index) => ({
              id,
              elementName: data.elementNames?.[index] || data.elementName || id,
              elementType: data.elementType,
              levelId: data.levelId,
              levelName: data.levelName || data.locationLevel,
              grid: data.gridLine,
            })),
          );
        } else if (data.elementId) {
          setSelectedElements([
            {
              id: data.elementId,
              elementName: data.elementName || "Element",
              elementType: data.elementType,
              levelId: data.levelId,
              levelName: data.levelName || data.locationLevel,
              grid: data.gridLine,
            },
          ]);
        } else {
          setSelectedElements([]);
        }

        setNewStatus(data.status || "OPEN");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetId]);

  const handlePhotoUpload = async (
    files: FileList | null,
    photoType: PhotoType = "before",
  ) => {
    if (!files || files.length === 0 || !targetId || !ncr) return;

    if (ncr.status === "APPROVED" || ncr.status === "CLOSED") {
      if (!isLvl3) {
        toast.error(
          "Media upload locked! Only Quality Managers can modify Approved/Closed NCRs.",
        );
        return;
      }
    }

    setUploadingType(photoType);
    try {
      const results = await uploadMultiple(
        Array.from(files),
        `jqms/ncrs/${targetId}/${photoType}`,
      );

      const defaultCaption = `${ncr.ncrNumber || "NCR"} - ${ncr.title} (${
        photoType === "before" ? "Defect Photo" : "Rectification Photo"
      })`;

      const newPhotos: PhotoItem[] = results.map((r) => ({
        url: r.url,
        caption: defaultCaption,
      }));

      const isBefore = photoType === "before";
      const currentList = isBefore ? beforePhotos : afterPhotos;
      const updatedPhotos = [...currentList, ...newPhotos];

      if (isBefore) setBeforePhotos(updatedPhotos);
      else setAfterPhotos(updatedPhotos);

      const fieldKey = isBefore ? "beforePhotos" : "afterPhotos";

      await dbService.saveNCR({
        ...ncr,
        [fieldKey]: updatedPhotos,
        updatedAt: Date.now(),
      });

      // Auto-sync to Central Site Photo Gallery
      try {
        await syncMultiplePhotosToSiteGallery(
          newPhotos.map((item) => ({
            projectId: ncr.projectId || activeProject?.id || "",
            companyId: ncr.companyId || company?.id || "",
            url: item.url,
            thumbnailUrl: getThumbnail(item.url, 250),
            caption: item.caption || defaultCaption,
            floorLevel: ncr.locationLevel || ncr.levelName || ncr.location,
            levelId: ncr.levelId,
            elementId: ncr.elementId,
            elementName: ncr.elementName,
            category: "QUALITY_DEFECT",
            tradeId: ncr.tradeId,
            tradeName: ncr.tradeName || ncr.trade,
            subtradeId: ncr.subtradeId,
            subtradeName: ncr.subtradeName || ncr.subtrade,
            uploadedBy: currentUser?.fullName || "QA/QC Engineer",
            uploaderRole: currentUser?.role,
            sourceModule: "NCR",
            sourceId: ncr.id,
          })),
        );
      } catch (syncErr) {
        console.warn("Photo gallery sync warning:", syncErr);
      }

      toast.success(
        `${newPhotos.length} ${photoType} photo(s) uploaded and indexed in gallery.`,
      );
    } catch (e) {
      console.error(e);
      toast.error("Photo upload failed");
    } finally {
      setUploadingType(null);
    }
  };

  const handleFieldPhotoCapture = async (
    file: File,
    metadata: any,
    photoType: PhotoType = "before",
  ) => {
    if (!targetId || !ncr) return;

    const defaultCaption = `${ncr.ncrNumber || "NCR"} - ${ncr.title} (${
      photoType === "before" ? "Defect Photo" : "Rectification Photo"
    })`;

    try {
      const results = await uploadMultiple(
        [file],
        `jqms/ncrs/${targetId}/${photoType}`,
      );
      if (results.length > 0) {
        const newPhotoItem: PhotoItem = {
          url: results[0].url,
          caption: defaultCaption,
        };

        const isBefore = photoType === "before";
        const currentList = isBefore ? beforePhotos : afterPhotos;
        const updatedPhotos = [...currentList, newPhotoItem];

        if (isBefore) setBeforePhotos(updatedPhotos);
        else setAfterPhotos(updatedPhotos);

        const fieldKey = isBefore ? "beforePhotos" : "afterPhotos";

        await dbService.saveNCR({
          ...ncr,
          [fieldKey]: updatedPhotos,
          updatedAt: Date.now(),
        });

        // Auto-sync to Central Site Photo Gallery
        try {
          await syncMultiplePhotosToSiteGallery([
            {
              projectId: ncr.projectId || activeProject?.id || "",
              companyId: ncr.companyId || company?.id || "",
              url: newPhotoItem.url,
              thumbnailUrl: getThumbnail(newPhotoItem.url, 250),
              caption: newPhotoItem.caption || defaultCaption,
              floorLevel: ncr.locationLevel || ncr.levelName || ncr.location,
              levelId: ncr.levelId,
              elementId: ncr.elementId,
              elementName: ncr.elementName,
              category: "QUALITY_DEFECT",
              tradeId: ncr.tradeId,
              tradeName: ncr.tradeName || ncr.trade,
              subtradeId: ncr.subtradeId,
              subtradeName: ncr.subtradeName || ncr.subtrade,
              uploadedBy: currentUser?.fullName || "QA/QC Engineer",
              uploaderRole: currentUser?.role,
              sourceModule: "NCR",
              sourceId: ncr.id,
            },
          ]);
        } catch (syncErr) {
          console.warn("Photo gallery sync warning:", syncErr);
        }

        toast.success(
          `${photoType.toUpperCase()} field photo captured and indexed in gallery.`,
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload captured field photo");
    }
  };

  const handleUpdateCaption = async (
    index: number,
    caption: string,
    photoType: PhotoType,
  ) => {
    if (!targetId || !ncr) return;

    const isBefore = photoType === "before";
    const currentList = isBefore ? [...beforePhotos] : [...afterPhotos];
    currentList[index] = { ...currentList[index], caption };

    if (isBefore) setBeforePhotos(currentList);
    else setAfterPhotos(currentList);

    const fieldKey = isBefore ? "beforePhotos" : "afterPhotos";
    await dbService.saveNCR({
      ...ncr,
      [fieldKey]: currentList,
      updatedAt: Date.now(),
    });
  };

  const handleRemovePhoto = async (index: number, photoType: PhotoType) => {
    if (!targetId || !ncr) return;

    const isBefore = photoType === "before";
    const currentList = isBefore ? beforePhotos : afterPhotos;
    const updatedPhotos = currentList.filter((_, i) => i !== index);

    if (isBefore) setBeforePhotos(updatedPhotos);
    else setAfterPhotos(updatedPhotos);

    const fieldKey = isBefore ? "beforePhotos" : "afterPhotos";

    await dbService.saveNCR({
      ...ncr,
      [fieldKey]: updatedPhotos,
      updatedAt: Date.now(),
    });

    toast.success("Photo removed successfully");
  };

  const handleAddCorrectiveActionItem = () => {
    setForm((prev) => ({
      ...prev,
      correctiveActionsList: [...prev.correctiveActionsList, ""],
    }));
  };

  const handleUpdateCorrectiveActionItem = (index: number, val: string) => {
    const updated = [...form.correctiveActionsList];
    updated[index] = val;
    setForm((prev) => ({ ...prev, correctiveActionsList: updated }));
  };

  const handleRemoveCorrectiveActionItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      correctiveActionsList: prev.correctiveActionsList.filter(
        (_, i) => i !== index,
      ),
    }));
  };

  const handleSave = async () => {
    if (!currentUser || !ncr || !targetId) return;

    setSaving(true);
    try {
      const descriptionItems = form.description
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (descriptionItems.length === 0 && form.title) {
        descriptionItems.push(form.title);
      }

      const filteredCorrectiveActions = form.correctiveActionsList
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      const specRefToSave = form.specReference?.trim() || DEFAULT_SPEC_REF;

      const elementIds = selectedElements.map((e) => e.id);
      const elementNames = selectedElements.map((e) => e.elementName);
      const elementsData = selectedElements.map((e) => ({
        id: e.id,
        elementName: e.elementName,
        elementType: e.elementType,
        levelId: e.levelId,
        levelName: e.levelName,
        grid: e.grid,
      }));

      const primaryElementId =
        elementIds[0] || levelSelection.elementId || ncr.elementId || "";
      const primaryElementName =
        elementNames.length > 0
          ? elementNames.join(", ")
          : levelSelection.elementName || form.elementName || ncr.elementName || "";

      const updatedNCR: NonConformanceReport = {
        ...ncr,
        title: form.title,
        description: form.description,
        descriptionItems,
        priority: form.priority as any,
        category: form.category,
        elementName: primaryElementName,
        elementId: primaryElementId,
        structuralElementId: primaryElementId,
        elementType: selectedElements[0]?.elementType || levelSelection.elementType || ncr.elementType,
        elementIds: elementIds.length > 0 ? elementIds : primaryElementId ? [primaryElementId] : [],
        elementNames: elementNames.length > 0 ? elementNames : primaryElementName ? [primaryElementName] : [],
        elementsData: elementsData.length > 0 ? elementsData : undefined,
        locationLevel: levelSelection.levelName || form.locationLevel,
        levelId: levelSelection.levelId || selectedElements[0]?.levelId || ncr.levelId,
        levelName: levelSelection.levelName || form.locationLevel,
        location: levelSelection.levelName || form.locationLevel,
        gridLine: levelSelection.gridLocation || form.gridLine,
        specReference: specRefToSave,
        drawingNumber: form.drawingNumber,
        dispositionType: form.dispositionType,
        dateFound: form.dateFound,
        deadline: form.deadline,
        assignedToName: form.assignedToName,
        rootCauseType: form.rootCauseType,
        rootCauseOtherText:
          form.rootCauseType === "Other" ? form.rootCauseOtherText : "",
        rootCause: form.rootCause,
        correctiveActions: filteredCorrectiveActions as any,
        correctiveAction: filteredCorrectiveActions[0] || form.correctiveAction,
        preventiveAction: form.preventiveAction,
        trade: tradeSelection.tradeName,
        tradeId: tradeSelection.tradeId,
        tradeName: tradeSelection.tradeName,
        subtrade: tradeSelection.subtradeName,
        subtradeId: tradeSelection.subtradeId,
        subtradeName: tradeSelection.subtradeName,
        beforePhotos,
        afterPhotos,
        updatedAt: Date.now(),
      };

      await dbService.saveNCR(updatedNCR);

      await plannerSync.syncEvent({
        relatedId: targetId,
        relatedModule: "ncr",
        title: `NCR Found: ${form.title}`,
        description: `NCR ${ncr.ncrNumber} raised on ${form.dateFound}. Trade: ${tradeSelection.tradeName}.`,
        startDate: form.dateFound,
        startTime: "09:00",
        eventType: "CUSTOM",
        status: ncr.status,
        location: `${form.locationLevel} ${form.gridLine}`.trim(),
        assignedTo: form.assignedToName,
        projectId: ncr.projectId,
        companyId: currentUser.companyId,
        createdBy: currentUser.uid,
        eventKey: "found",
      });

      if (form.deadline) {
        await plannerSync.syncEvent({
          relatedId: targetId,
          relatedModule: "ncr",
          title: `NCR Deadline: ${form.title}`,
          description: `Action required for NCR ${ncr.ncrNumber}.`,
          startDate: form.deadline,
          startTime: "08:00",
          eventType: "NCR_DEADLINE",
          status: ncr.status,
          location: `${form.locationLevel} ${form.gridLine}`.trim(),
          assignedTo: form.assignedToName,
          projectId: ncr.projectId,
          companyId: currentUser.companyId,
          createdBy: currentUser.uid,
          eventKey: "deadline",
        });
      }

      await writeAudit({
        userId: currentUser.uid,
        userName: currentUser.fullName,
        action: "EDIT_NCR",
        module: "NCR",
        details: `Amended properties for ${ncr.ncrNumber}. Spec Ref: ${specRefToSave}`,
        companyId: currentUser.companyId || "",
        projectId: ncr.projectId,
        targetId,
      });

      toast.success("NCR updated and planner synchronized");
      setIsEditing(false);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save amendments");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!currentUser || !ncr || !targetId || !newStatus) return;

    if (newStatus === "CLOSED" && !canCloseNCR) {
      toast.error(
        "Permission Denied: Only Level 4+ QA/QC Engineers or Quality Managers can close/certify NCR resolution.",
      );
      return;
    }

    if (newStatus === "REJECTED" && !canCloseNCR) {
      toast.error(
        "Permission Denied: Only Level 4+ QA/QC Engineers or Quality Managers can reject an NCR.",
      );
      return;
    }

    setSaving(true);
    try {
      const timestamp = Date.now();
      const historyEntry: StatusHistoryEntry = {
        status: newStatus as any,
        userId: currentUser.uid,
        userName: currentUser.fullName,
        comment: statusComment || `Status shifted to ${newStatus}`,
        timestamp,
      };

      const updatedHistory = [...(ncr.statusHistory || []), historyEntry];
      const updatedNCR: NonConformanceReport = {
        ...ncr,
        status: newStatus as any,
        statusHistory: updatedHistory,
        updatedAt: timestamp,
      };

      if (newStatus === "CLOSED") {
        updatedNCR.closedAt = timestamp;
        updatedNCR.finalStatus = "CLOSED";
        updatedNCR.qaqcEngineerName = currentUser.fullName;
        updatedNCR.signDate = new Date().toLocaleDateString("en-GB");
      }

      await dbService.saveNCR(updatedNCR);

      toast.success(`Status shifted to ${newStatus}`);
      setStatusComment("");
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to shift system status");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!ncr) return;
    try {
      const pdfData = mapNCRToPDFData(
        {
          ...ncr,
          ...form,
          beforePhotos,
          afterPhotos,
        },
        company,
        activeProject,
      );
      generateStandardNCRPDF(pdfData);
      toast.success("PDF document downloaded");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleDeleteNCR = async () => {
    if (!ncr || !targetId) return;

    if (!canDeleteNCR) {
      toast.error(
        "Permission Denied: You do not have statutory permission to delete Non-Conformance Reports.",
      );
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete Non-Conformance Report ${ncr.ncrNumber}? This action cannot be undone.`,
    );
    if (!confirmDelete) return;

    try {
      await dbService.deleteNCR(ncr.id, currentProjId);

      if (currentUser) {
        await writeAudit({
          userId: currentUser.uid,
          userName: currentUser.fullName,
          action: "DELETE_NCR",
          module: "NCR",
          details: `Permanently deleted Non-Conformance Report ${ncr.ncrNumber} (${ncr.title})`,
          companyId: currentUser.companyId || "",
          projectId: ncr.projectId || currentProjId,
          targetId: ncr.id,
        });
      }

      toast.success(`NCR ${ncr.ncrNumber} deleted`);
      navigate(projectId ? `/project/${projectId}/ncrs` : `/project/ncrs`);
    } catch (err) {
      console.error("Failed to delete NCR:", err);
      toast.error("Failed to delete Non-Conformance Report");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-[#ea580c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!ncr) {
    return (
      <div className="text-center py-20">
        <p className="text-[14px] text-slate-500">NCR record not found</p>
        <button
          onClick={() => navigate("/project/ncrs")}
          className="mt-4 text-[#ea580c] font-semibold hover:underline"
        >
          Back to list
        </button>
      </div>
    );
  }

  const isClosed = ncr.status === "CLOSED";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 text-[13px] animate-in fade-in duration-200">
      {/* ═══ Header Bar ═══ */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 shrink-0 transition"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-mono font-semibold text-[#ea580c] shrink-0">
                {ncr.ncrNumber}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase shrink-0 ${
                  ncr.status === "OPEN"
                    ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800"
                    : ncr.status === "CLOSED"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                }`}
              >
                {ncr.status?.replace(/_/g, " ")}
              </span>
            </div>
            <h1 className="text-[16px] sm:text-[18px] font-bold text-slate-900 dark:text-white truncate leading-snug">
              {ncr.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={handleDownloadPDF}
            className="h-9 px-3 sm:px-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-[12px] sm:text-[13px] font-semibold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition"
          >
            <FileText size={15} className="shrink-0 text-slate-500" />
            <span>Export Document Form</span>
          </button>

          <button
            onClick={handleDeleteNCR}
            className="h-9 px-3 sm:px-4 border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 rounded-lg text-[12px] sm:text-[13px] font-semibold flex items-center gap-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 shadow-sm transition"
            title="Delete Non-Conformance Report"
          >
            <Trash2 size={15} className="shrink-0" />
            <span>Delete NCR</span>
          </button>

          {!isClosed && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="h-9 px-3 sm:px-4 bg-[#ea580c] text-white rounded-lg text-[12px] sm:text-[13px] font-semibold hover:bg-[#c2410c] shadow-sm transition"
            >
              {isEditing ? "Cancel Amendments" : "Amend Properties"}
            </button>
          )}

          {isEditing && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-9 px-3 sm:px-4 bg-emerald-600 text-white rounded-lg text-[12px] sm:text-[13px] font-semibold hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition"
            >
              <Save size={15} className="shrink-0" />
              <span>{saving ? "Saving..." : "Save Context"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══ Overdue Warning Banner ═══ */}
      {isOverdue && (
        <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-500/80 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-md shrink-0 animate-pulse">
              <Flame size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold text-red-900 dark:text-red-200">
                  NCR Rectification Overdue ({daysOverdue} Days Past Deadline)
                </h3>
                <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-extrabold uppercase rounded-full tracking-wider">
                  Critical Warning
                </span>
              </div>
              <p className="text-[12px] text-red-700 dark:text-red-300 mt-1 max-w-2xl leading-relaxed">
                The rectification deadline ({ncr.deadline}) has expired without
                resolution. Under ISO 9001:2015 &amp; BS standard quality
                procedures, you may issue a formal unilateral{" "}
                <strong>Site Instruction Warning</strong> to enforce contractual
                compliance.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!canIssueSI) {
                toast.error(
                  "Permission Denied: Only Level 4+ QA/QC Engineers or Quality Managers can issue formal Site Instructions.",
                );
                return;
              }
              navigate(
                projectId
                  ? `/project/${projectId}/site-instructions/create?ncrId=${ncr.id}`
                  : `/project/site-instructions/create?ncrId=${ncr.id}`,
              );
            }}
            disabled={!canIssueSI}
            title={
              !canIssueSI
                ? "Requires Level 4+ QA/QC or Quality Manager authority"
                : ""
            }
            className="w-full md:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-[12px] sm:text-[13px] font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition shrink-0"
          >
            <FileWarning size={16} />
            <span>Issue Site Instruction Warning</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* ═══ Quality Governance / Operational Demarcation Notice ═══ */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800/80 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl p-4 shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="space-y-1 text-xs">
              <p className="font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                Quality Governance & Operational Demarcation
              </p>
              <p className="text-blue-800/90 dark:text-slate-300 leading-relaxed">
                <strong>QA/QC Mandate:</strong> QA/QC operates strictly as an
                independent <strong>audit & verification authority</strong>{" "}
                (defect identification, non-conformance logging, and closeout
                certification).
                <strong> Production Mandate:</strong> Physical execution, method
                statement execution, rework coordination, and repair management
                remain the direct operational responsibility of the{" "}
                <strong>
                  Construction Manager, Site Engineers, and Trade Contractors
                </strong>
                .
              </p>
            </div>
          </div>

          {/* ═══ Specification Context Panel ═══ */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle size={18} className="text-[#ea580c]" />{" "}
              Construction Matrix & Specification Context
            </h2>

            {isEditing ? (
              <div className="space-y-4">
                <div className="pb-1">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    NCR Title Overview
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#ea580c]"
                  />
                </div>

                {/* Level & Structural Element Selector */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <LayoutGrid size={14} className="text-[#ea580c]" />
                      Affected Structural Elements
                    </h3>
                    {selectedElements.length > 1 && (
                      <span className="text-[11px] font-bold text-[#ea580c] bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                        {selectedElements.length} Elements Linked
                      </span>
                    )}
                  </div>
                  <MultiLevelElementSelect
                    projectId={ncr.projectId || currentProjId}
                    companyId={ncr.companyId || company?.id}
                    selectedElements={selectedElements}
                    onChange={(items) => {
                      setSelectedElements(items);
                      if (items.length > 0) {
                        const names = items.map((i) => i.elementName).join(", ");
                        const grids = Array.from(new Set(items.map((i) => i.grid).filter(Boolean))).join(", ");
                        const levels = Array.from(new Set(items.map((i) => i.levelName).filter(Boolean))).join(", ");
                        setLevelSelection({
                          levelId: items[0].levelId || "",
                          levelName: levels || items[0].levelName || "",
                          elementId: items[0].id,
                          elementName: names,
                          gridLocation: grids,
                          elementType: items[0].elementType,
                        });
                        setForm((prev) => ({
                          ...prev,
                          elementName: names,
                          locationLevel: levels || prev.locationLevel,
                          gridLine: grids || prev.gridLine,
                        }));
                      } else {
                        setLevelSelection({
                          levelId: "",
                          levelName: "",
                          elementId: "",
                          elementName: "",
                          gridLocation: "",
                          elementType: "",
                        });
                        setForm((prev) => ({
                          ...prev,
                          elementName: "",
                          gridLine: "",
                        }));
                      }
                    }}
                  />
                </div>

                {/* Trade & Subtrade Selector */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Briefcase size={14} className="text-[#ea580c]" />
                    Trade Discipline & Subtrade Sector
                  </h3>
                  <TradeSubtradeSelect
                    companyId={ncr.companyId || company?.id}
                    value={tradeSelection}
                    onChange={setTradeSelection}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Date Found
                    </label>
                    <input
                      type="date"
                      value={form.dateFound}
                      onChange={(e) =>
                        setForm({ ...form, dateFound: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#ea580c]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Action Deadline
                    </label>
                    <input
                      type="date"
                      value={form.deadline}
                      onChange={(e) =>
                        setForm({ ...form, deadline: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#ea580c]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Specification Clause / Standard Ref
                    </label>
                    <input
                      value={form.specReference}
                      onChange={(e) =>
                        setForm({ ...form, specReference: e.target.value })
                      }
                      placeholder="e.g. BS 8110 Cl 3.4 / BS EN 1992"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#ea580c]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Applicable Drawing Number
                    </label>
                    <input
                      value={form.drawingNumber}
                      onChange={(e) =>
                        setForm({ ...form, drawingNumber: e.target.value })
                      }
                      placeholder="e.g. S-102 Rev C"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#ea580c]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Priority & Category
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={form.priority}
                        onChange={(e) =>
                          setForm({ ...form, priority: e.target.value as any })
                        }
                        className="w-1/2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                      <select
                        value={form.category}
                        onChange={(e) =>
                          setForm({ ...form, category: e.target.value })
                        }
                        className="w-1/2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="Structural">Structural</option>
                        <option value="Architectural">Architectural</option>
                        <option value="MEP">MEP</option>
                        <option value="Safety">Safety</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Assigned Action Owner / Representative
                    </label>
                    <input
                      value={form.assignedToName}
                      onChange={(e) =>
                        setForm({ ...form, assignedToName: e.target.value })
                      }
                      placeholder="Production / Site Engineer / Trade Contractor"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#ea580c]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Floor Level / Location
                  </label>
                  <p className="text-[14px] font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin size={14} className="text-[#ea580c]" />{" "}
                    {ncr.locationLevel ||
                      ncr.levelName ||
                      ncr.location ||
                      "All Levels / General Site"}
                  </p>
                </div>

                <div className={(ncr.elementIds && ncr.elementIds.length > 1) || (ncr.elementsData && ncr.elementsData.length > 1) ? "md:col-span-2" : ""}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Affected Structural Element{ncr.elementIds && ncr.elementIds.length > 1 ? `s (${ncr.elementIds.length})` : ""}
                    </label>
                    {ncr.elementIds && ncr.elementIds.length > 1 && (
                      <span className="text-[10px] font-bold text-[#ea580c] bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                        Multi-Element Defect Group
                      </span>
                    )}
                  </div>

                  {ncr.elementsData && ncr.elementsData.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {ncr.elementsData.map((el) => (
                        <Link
                          key={el.id}
                          to={`/project/elements/${el.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-[#ea580c] dark:hover:border-[#ea580c] hover:text-[#ea580c] shadow-xs transition-all group"
                          title="Open Element Quality Passport"
                        >
                          <LayoutGrid size={13} className="text-[#ea580c] group-hover:scale-110 transition-transform" />
                          <span>{el.elementName}</span>
                          {el.elementType && (
                            <span className="text-[10px] uppercase font-mono text-slate-400 dark:text-slate-500">
                              {el.elementType}
                            </span>
                          )}
                          {el.grid && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              [{el.grid}]
                            </span>
                          )}
                          <ExternalLink size={11} className="text-slate-400 opacity-60 group-hover:opacity-100" />
                        </Link>
                      ))}
                    </div>
                  ) : ncr.elementIds && ncr.elementIds.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {ncr.elementIds.map((id, idx) => {
                        const name = ncr.elementNames?.[idx] || id;
                        return (
                          <Link
                            key={id}
                            to={`/project/elements/${id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-[#ea580c] dark:hover:border-[#ea580c] hover:text-[#ea580c] shadow-xs transition-all group"
                            title="Open Element Quality Passport"
                          >
                            <LayoutGrid size={13} className="text-[#ea580c] group-hover:scale-110 transition-transform" />
                            <span>{name}</span>
                            <ExternalLink size={11} className="text-slate-400 opacity-60 group-hover:opacity-100" />
                          </Link>
                        );
                      })}
                    </div>
                  ) : ncr.elementId ? (
                    <div className="pt-0.5">
                      <Link
                        to={`/project/elements/${ncr.elementId}`}
                        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-slate-900 dark:text-white hover:text-[#ea580c] transition-colors group"
                      >
                        <LayoutGrid size={14} className="text-[#ea580c]" />{" "}
                        <span>{ncr.elementName || "—"}</span>
                        {ncr.gridLine ? `(${ncr.gridLine})` : ""}
                        <ExternalLink size={12} className="text-slate-400 opacity-70 group-hover:opacity-100" />
                      </Link>
                    </div>
                  ) : (
                    <p className="text-[14px] font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 pt-0.5">
                      <LayoutGrid size={14} className="text-slate-400" />{" "}
                      {ncr.elementName || "—"}{" "}
                      {ncr.gridLine ? `(${ncr.gridLine})` : ""}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Trade & Subtrade Sector
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                      {ncr.trade || ncr.tradeName || "General Civil"}
                    </span>
                    {ncr.subtrade || ncr.subtradeName ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {ncr.subtrade || ncr.subtradeName}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Date Found
                  </label>
                  <p className="text-[14px] font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                    <Calendar size={14} className="text-slate-400" />{" "}
                    {ncr.dateFound || "—"}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Action Deadline
                  </label>
                  <p className="text-[14px] font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                    <Calendar size={14} className="text-slate-400" />{" "}
                    {ncr.deadline || "—"}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Specification Clause / Standard Ref
                  </label>
                  <p className="text-[14px] font-semibold text-slate-900 dark:text-white">
                    {ncr.specReference || DEFAULT_SPEC_REF}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Applicable Drawing Number
                  </label>
                  <p className="text-[14px] font-semibold text-slate-900 dark:text-white">
                    {ncr.drawingNumber || "—"}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Priority & Category
                  </label>
                  <p className="text-[14px] font-semibold text-slate-900 dark:text-white">
                    {ncr.priority} • {ncr.category}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Assigned Action Owner / Representative
                  </label>
                  <p className="text-[14px] font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                    <User size={14} className="text-slate-400" />{" "}
                    {ncr.assignedToName || ncr.assignedTo || "Unassigned"}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Itemized Description of Non-Conformance
              </label>
              {isEditing ? (
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={4}
                  placeholder="Enter each non-conforming item on a separate line..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none font-mono focus:border-[#ea580c]"
                />
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
                  {ncr.descriptionItems && ncr.descriptionItems.length > 0 ? (
                    <ul className="space-y-2 list-none pl-0 font-mono text-slate-800 dark:text-slate-200">
                      {ncr.descriptionItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#ea580c] font-bold select-none">
                            •
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[13px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                      {ncr.description || "No descriptive entries written."}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ═══ Photographic Evidence Panel ═══ */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon size={18} className="text-[#ea580c]" /> Photographic
              Evidence (Before & After Fix)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Before Fix */}
              <div className="p-4 border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[13px] text-red-800 dark:text-red-300 uppercase tracking-wide">
                      Before Fix (Defect Evidence)
                    </h3>
                    <p className="text-[11px] text-red-600 dark:text-red-400">
                      Captured during initial non-conformance log
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 rounded-full">
                    {beforePhotos.length} photo
                    {beforePhotos.length !== 1 && "s"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 min-h-[80px]">
                  {beforePhotos.map((photo, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-1.5 p-2 border border-red-200 dark:border-red-900/40 bg-white dark:bg-slate-800 rounded-lg"
                    >
                      <div className="relative group rounded-md overflow-hidden aspect-video bg-gray-100 dark:bg-slate-900">
                        <img
                          src={getThumbnail(photo.url)}
                          alt={photo.caption || `Before Fix ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {!isClosed && (
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(i, "before")}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white p-1.5 rounded-md transition"
                            title="Delete photo"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={photo.caption || ""}
                        onChange={(e) =>
                          handleUpdateCaption(i, e.target.value, "before")
                        }
                        placeholder="Add caption..."
                        disabled={isClosed}
                        className="w-full px-2 py-1 text-[11px] border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none"
                      />
                    </div>
                  ))}
                  {beforePhotos.length === 0 && (
                    <div className="flex items-center justify-center border border-dashed border-red-200 dark:border-red-900/60 rounded-lg p-4 text-[12px] text-red-400 italic">
                      No initial defect photos attached
                    </div>
                  )}
                </div>

                {!isClosed && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-red-100 dark:border-red-900/40">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) =>
                        handlePhotoUpload(e.target.files, "before")
                      }
                      className="hidden"
                      id="before-photo-upload"
                      disabled={uploadingType === "before"}
                    />
                    <label
                      htmlFor="before-photo-upload"
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded-lg text-[12px] font-semibold text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer flex items-center gap-1.5"
                    >
                      <Upload size={14} />
                      {uploadingType === "before"
                        ? "Uploading..."
                        : "Upload Photos"}
                    </label>
                    <FieldPhotoCapture
                      onCapture={(file, meta) =>
                        handleFieldPhotoCapture(file, meta, "before")
                      }
                    />
                  </div>
                )}
              </div>

              {/* After Fix */}
              <div className="p-4 border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[13px] text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                      After Fix (Remedial Evidence)
                    </h3>

                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      Captured post-rectification inspection
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-full">
                    {afterPhotos.length} photo{afterPhotos.length !== 1 && "s"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 min-h-[80px]">
                  {afterPhotos.map((photo, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-1.5 p-2 border border-emerald-200 dark:border-emerald-900/40 bg-white dark:bg-slate-800 rounded-lg"
                    >
                      <div className="relative group rounded-md overflow-hidden aspect-video bg-gray-100 dark:bg-slate-900">
                        <img
                          src={getThumbnail(photo.url)}
                          alt={photo.caption || `After Fix ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {!isClosed && (
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(i, "after")}
                            className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white p-1.5 rounded-md transition"
                            title="Delete photo"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={photo.caption || ""}
                        onChange={(e) =>
                          handleUpdateCaption(i, e.target.value, "after")
                        }
                        placeholder="Add caption..."
                        disabled={isClosed}
                        className="w-full px-2 py-1 text-[11px] border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none"
                      />
                    </div>
                  ))}
                  {afterPhotos.length === 0 && (
                    <div className="flex items-center justify-center border border-dashed border-emerald-200 dark:border-emerald-900/60 rounded-lg p-4 text-[12px] text-emerald-500 italic">
                      No remedial fix photos attached
                    </div>
                  )}
                </div>

                {!isClosed && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/40">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) =>
                        handlePhotoUpload(e.target.files, "after")
                      }
                      className="hidden"
                      id="after-photo-upload"
                      disabled={uploadingType === "after"}
                    />
                    <label
                      htmlFor="after-photo-upload"
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[12px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer flex items-center gap-1.5"
                    >
                      <Upload size={14} />
                      {uploadingType === "after"
                        ? "Uploading..."
                        : "Upload Photos"}
                    </label>
                    <FieldPhotoCapture
                      onCapture={(file, meta) =>
                        handleFieldPhotoCapture(file, meta, "after")
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══ Resolution & Action Plan ═══ */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" /> Resolution
              Analysis, Action Plan & Disposition
            </h2>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Proposed Disposition Strategy
              </label>
              {isEditing ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(["Rework", "Repair", "Use As-Is", "Scrap"] as const).map(
                    (disp) => (
                      <label
                        key={disp}
                        className={`flex items-center justify-center p-2 rounded-lg border text-[12px] font-semibold cursor-pointer select-none transition ${
                          form.dispositionType === disp
                            ? "border-[#ea580c] bg-orange-50 dark:bg-orange-950/40 text-[#ea580c]"
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800"
                        }`}
                      >
                        <input
                          type="radio"
                          name="dispositionType"
                          checked={form.dispositionType === disp}
                          onChange={() =>
                            setForm({ ...form, dispositionType: disp })
                          }
                          className="sr-only"
                        />
                        {disp === "Use As-Is"
                          ? "Use As-Is (Concession)"
                          : disp === "Scrap"
                            ? "Reject / Scrap"
                            : disp}
                      </label>
                    ),
                  )}
                </div>
              ) : (
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-md font-semibold text-[12px]">
                  {form.dispositionType === "Use As-Is"
                    ? "Use As-Is (Concession)"
                    : form.dispositionType === "Scrap"
                      ? "Reject / Scrap"
                      : form.dispositionType || "Rework"}
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/40">
                <label className="block text-[12px] font-semibold text-slate-800 dark:text-slate-200 mb-2.5">
                  Root Cause Category Selection
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(
                    [
                      "Workmanship",
                      "Material Defect",
                      "Drawing Error",
                      "Other",
                    ] as const
                  ).map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 cursor-pointer select-none"
                    >
                      <input
                        type="radio"
                        name="rootCauseType"
                        checked={form.rootCauseType === type}
                        onChange={() =>
                          setForm({ ...form, rootCauseType: type })
                        }
                        className="w-4 h-4 text-[#ea580c] focus:ring-0 accent-orange-600"
                      />
                      <span
                        className={`text-[13px] ${
                          form.rootCauseType === type
                            ? "font-semibold text-slate-900 dark:text-white"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {type === "Drawing Error"
                          ? "Drawing / Design Error"
                          : type}
                      </span>
                    </label>
                  ))}
                </div>

                {form.rootCauseType === "Other" && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <input
                      value={form.rootCauseOtherText}
                      onChange={(e) =>
                        setForm({ ...form, rootCauseOtherText: e.target.value })
                      }
                      placeholder="Specify alternative cause findings..."
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#ea580c]"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Root Cause Category
                </label>
                <p className="text-[13px] font-bold text-slate-900 dark:text-white bg-orange-50/50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 px-3 py-1.5 rounded-lg inline-block">
                  {form.rootCauseType === "Drawing Error"
                    ? "Drawing / Design Error"
                    : form.rootCauseType || "Workmanship"}
                  {form.rootCauseType === "Other" && form.rootCauseOtherText
                    ? ` (${form.rootCauseOtherText})`
                    : ""}
                </p>
              </div>
            )}

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Root Cause Analysis Evaluation Description
              </label>
              <textarea
                value={form.rootCause}
                onChange={(e) =>
                  setForm({ ...form, rootCause: e.target.value })
                }
                rows={3}
                placeholder="Why did this non-conformance structural issue emerge?"
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:border-[#ea580c] disabled:opacity-75"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                  Corrective Action Plan Items (Immediate Rectification)
                </label>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleAddCorrectiveActionItem}
                    className="text-[#ea580c] text-[12px] font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Plus size={14} /> Add Action Step
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  {form.correctiveActionsList.map((act, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-[12px]">
                        {idx + 1}.
                      </span>
                      <input
                        value={act}
                        onChange={(e) =>
                          handleUpdateCorrectiveActionItem(idx, e.target.value)
                        }
                        placeholder={`Corrective action step ${idx + 1}...`}
                        className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#ea580c]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCorrectiveActionItem(idx)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {form.correctiveActionsList.length === 0 && (
                    <p className="text-[12px] text-slate-400 italic">
                      No itemized action steps added. Click above to add steps.
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
                  {form.correctiveActionsList.length > 0 ? (
                    <ol className="space-y-1.5 list-decimal pl-4 text-slate-800 dark:text-slate-200">
                      {form.correctiveActionsList.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-[13px] text-slate-500">
                      No corrective action steps specified.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Preventive Strategy Blueprint (Recurrence Prevention)
              </label>
              <textarea
                value={form.preventiveAction}
                onChange={(e) =>
                  setForm({ ...form, preventiveAction: e.target.value })
                }
                rows={3}
                placeholder="Long-term procedural change to avert repetition..."
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:border-[#ea580c] disabled:opacity-75"
              />
            </div>
          </div>

          {/* ═══ Quality Verification & Re-Inspection Protocol ═══ */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" /> Quality
              Verification & Re-Inspection Protocol
            </h2>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.verification.reInspected}
                  disabled={!isEditing}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      verification: {
                        ...form.verification,
                        reInspected: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-[#ea580c] rounded border-slate-300 focus:ring-0 accent-orange-600"
                />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Physical Area Re-Inspected
                  </p>
                  <p className="text-[12px] text-slate-500">
                    Defective elements have been verified on-site after
                    remediation.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.verification.fixSatisfiesSpec}
                  disabled={!isEditing}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      verification: {
                        ...form.verification,
                        fixSatisfiesSpec: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-[#ea580c] rounded border-slate-300 focus:ring-0 accent-orange-600"
                />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Fix Satisfies Approved Specifications & Codes
                  </p>
                  <p className="text-[12px] text-slate-500">
                    Remedial work meets standard tolerances and engineering
                    requirements.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={beforePhotos.length > 0 || afterPhotos.length > 0}
                  disabled={true}
                  className="w-4 h-4 text-[#ea580c] rounded border-slate-300 focus:ring-0 accent-orange-600"
                />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Post-Remedial Photographic Evidence Captured
                  </p>
                  <p className="text-[12px] text-slate-500">
                    Verification photos uploaded or archived in project system (
                    {beforePhotos.length + afterPhotos.length} photo(s) total).
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ═══ Right Action Column ═══ */}
        <div className="space-y-6">
          {/* Tracker Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-[14px] font-bold text-slate-900 dark:text-white">
              Update Tracker Status
            </h3>
            <div className="space-y-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                disabled={isClosed}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="OPEN">Open / Active Defect</option>
                <option value="UNDER_REVIEW">Under Engineering Review</option>
                <option value="CLOSED" disabled={!canCloseNCR}>
                  {canCloseNCR
                    ? "Closed / Rectified Satisfactorily"
                    : "Closed (Level 4+ QA/QC Authorization Required)"}
                </option>
                <option value="REJECTED" disabled={!canCloseNCR}>
                  {canCloseNCR
                    ? "Rejected"
                    : "Rejected (Level 4+ QA/QC Authorization Required)"}
                </option>
              </select>

              {!isClosed && (
                <>
                  <textarea
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    placeholder="Enter status transition notes, audit logs, or site validation feedback..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-[13px] bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                  />
                  <button
                    onClick={handleStatusChange}
                    disabled={saving}
                    className="w-full bg-slate-900 dark:bg-brand-600 hover:bg-black dark:hover:bg-brand-500 text-white py-2 rounded-lg text-[13px] font-semibold transition disabled:opacity-50"
                  >
                    Transition Workflow Status
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sign-off Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-[14px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck2 size={16} className="text-slate-500" /> Inspector
              Sign-Off Summary
            </h3>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">QA/QC Engineer:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {ncr.qaqcEngineerName ||
                    ncr.raisedByName ||
                    ncr.reportedBy ||
                    "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Sign-Off Date:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {ncr.signDate ||
                    (ncr.closedAt
                      ? new Date(ncr.closedAt).toLocaleDateString("en-GB")
                      : "Pending")}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Closure Approval:</span>
                <span
                  className={`font-semibold ${ncr.status === "CLOSED" ? "text-emerald-600" : "text-amber-600"}`}
                >
                  {ncr.status === "CLOSED"
                    ? "Verified & Closed"
                    : "Open / In Progress"}
                </span>
              </div>
            </div>
          </div>

          {/* Site Instructions (Warning Documents) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileWarning size={16} className="text-red-500" /> Site
                Instructions
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {linkedSIs.length} Issued
              </span>
            </div>

            {linkedSIs.length > 0 ? (
              <div className="space-y-2.5">
                {linkedSIs.map((si) => (
                  <div
                    key={si.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[11px] text-red-600 dark:text-red-400">
                        {si.instructionNumber}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 font-bold uppercase rounded ${
                          si.status === "ACKNOWLEDGED"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : si.status === "ISSUED"
                              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {si.status}
                      </span>
                    </div>
                    <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {si.subject}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span>Due: {si.complianceDeadline || "Immediate"}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            generateSiteInstructionPDF(
                              si,
                              activeProject || undefined,
                              company || undefined,
                            )
                          }
                          className="text-[#ea580c] hover:underline font-semibold flex items-center gap-1"
                          title="Download Official PDF"
                        >
                          <FileDown size={12} /> PDF
                        </button>
                        <button
                          onClick={() =>
                            navigate(
                              projectId
                                ? `/project/${projectId}/site-instructions/${si.id}`
                                : `/project/site-instructions/${si.id}`,
                            )
                          }
                          className="text-slate-700 dark:text-slate-300 hover:text-black font-semibold"
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-slate-400">
                No Site Instructions issued for this NCR yet.
              </p>
            )}

            {!isClosed && (
              <button
                onClick={() => {
                  if (!canIssueSI) {
                    toast.error(
                      "Permission Denied: Only Level 4+ QA/QC Engineers or Quality Managers can issue formal Site Instructions.",
                    );
                    return;
                  }
                  navigate(
                    projectId
                      ? `/project/${projectId}/site-instructions/create?ncrId=${ncr.id}`
                      : `/project/site-instructions/create?ncrId=${ncr.id}`,
                  );
                }}
                disabled={!canIssueSI}
                title={
                  !canIssueSI
                    ? "Requires Level 4+ QA/QC or Quality Manager authority"
                    : ""
                }
                className="w-full py-2 px-3 border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed text-red-700 dark:text-red-300 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 transition"
              >
                <Plus size={14} />
                <span>Issue Site Instruction</span>
              </button>
            )}
          </div>

          {/* Workflow History Timeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-[14px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History size={16} className="text-slate-500" /> Workflow
              Lifecycle History
            </h3>
            <div className="space-y-4 relative before:absolute before:top-2 before:bottom-2 before:left-3.5 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
              {ncr.statusHistory && ncr.statusHistory.length > 0 ? (
                ncr.statusHistory.map((history, i) => (
                  <div key={i} className="flex gap-3 items-start relative z-10">
                    <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 z-10 font-bold text-[10px] text-slate-600 dark:text-slate-300">
                      {i + 1}
                    </div>
                    <div className="space-y-0.5 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                          {history.status?.replace(/_/g, " ")}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(history.timestamp).toLocaleDateString(
                            "en-GB",
                          )}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        {history.userName}
                      </p>
                      {history.comment && (
                        <p className="text-slate-500 italic bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700 mt-1">
                          "{history.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[12px] text-slate-400 pl-8">
                  No workflow history logged.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NCRDetail;
