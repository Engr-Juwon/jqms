import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { syncPhotoToSiteGallery, syncMultiplePhotosToSiteGallery } from "@/lib/photoSync";
import { uploadMultiple, getThumbnail } from "@/lib/cloudinary";
import { toast } from "react-hot-toast";
import { hasPermission } from "@/lib/rbac";
import {
  saveDraftObservation,
  getDraftObservation,
  clearDraftObservation,
} from "@/lib/idbVault";
import { LevelElementSelect } from "@/components/sitecomments/LevelElementSelect";
import { TradeSubtradeSelect } from "@/components/sitecomments/TradeSubtradeSelect";
import { RemarkSnippetDrawer } from "@/components/sitecomments/RemarkSnippetDrawer";
import { PhotoMarkupModal } from "@/components/sitecomments/PhotoMarkupModal";
import { SignaturePad } from "@/components/common/SignaturePad";
import { DraftBanner } from "@/components/common/DraftBanner";
import { saveFormDraft, getFormDraft, clearFormDraft } from "@/lib/idbVault";
import { useCompany } from "@/lib/companyHelper";
import {
  SiteCommentReport,
  ObservationItem,
  ObservationSeverity,
  ObservationPhoto,
} from "@/types";
import { parseTradeAndSubtrade } from "@/lib/tradeUtils";
import {
  MessageSquareWarning,
  Plus,
  Trash2,
  Camera,
  Sparkles,
  Save,
  CheckCircle2,
  ArrowLeft,
  PenTool,
  Edit3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export const SiteCommentsCreate: React.FC = () => {
  const { projectId, id: editReportId } = useParams<{
    projectId: string;
    id?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, company } = useAuthStore();
  const { activeProject } = useProjectStore();
  const currentProjId = projectId || activeProject?.id || "proj-skyline-tower";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";
  const canCreateComment = hasPermission(currentUser?.role, "CREATE_SITE_COMMENT");

  const isEditMode = Boolean(editReportId);

  const { generateDocNumber, getPrefix } = useCompany();
  // Form State
  const [reportNumber, setReportNumber] = useState(() => generateDocNumber('SITE_COMMENT'));

  useEffect(() => {
    if (!isEditMode && !rawDraft?.reportNumber) {
      setReportNumber(generateDocNumber('SITE_COMMENT'));
    }
  }, [getPrefix, isEditMode]);
  const [title, setTitle] = useState("");
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [inspectionTime, setInspectionTime] = useState(
    new Date().toTimeString().slice(0, 5),
  );
  const [weatherConditions, setWeatherConditions] =
    useState("Clear & Dry (28°C)");
  const [locationDescription, setLocationDescription] = useState("");
  const [assignedSubcontractor, setAssignedSubcontractor] = useState(
    "Titan Steel & Rebar Contracting",
  );

  // Observations List
  const [observations, setObservations] = useState<ObservationItem[]>([
    {
      id: `obs-${Date.now()}`,
      observationNumber: 1,
      levelId: activeProject?.currentLevelId || "lvl-gf",
      levelName: activeProject?.currentLevelName || "Ground Floor",
      gridLocation: "",
      structuralElement: "",
      tradeId: "trade-reb",
      tradeName: "Structural",
      trade: "Structural",
      subtradeName: "Rebar",
      subtrade: "Rebar",
      severity: "HIGH",
      observationText: "",
      comments: "",
      correctiveDirective: "",
      status: "Non-Compliant",
      assignedTo: "Titan Steel & Rebar Contracting",
      assignedSubcontractor: "Titan Steel & Rebar Contracting",
      photos: [],
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
    },
  ]);

  // Signatures & Metadata
  const [engineerSig, setEngineerSig] = useState("");
  const [inspectorName, setInspectorName] = useState(
    currentUser?.fullName || "QA/QC Engineer",
  );
  const [inspectorRole, setInspectorRole] = useState(
    currentUser?.role || "QA/QC Engineer",
  );
  const [subconSig, setSubconSig] = useState("");
  const [subconName, setSubconName] = useState("Rajesh Patel");
  const [subconCompany, setSubconCompany] = useState("Titan Steel Contracting");
  const [originalReport, setOriginalReport] =
    useState<SiteCommentReport | null>(null);

  // Drawer & Markup Modals
  const [isSnippetDrawerOpen, setIsSnippetDrawerOpen] = useState(false);
  const [activeObsIndexForSnippet, setActiveObsIndexForSnippet] = useState(0);

  const [markupModalOpen, setMarkupModalOpen] = useState(false);
  const [activeMarkupImage, setActiveMarkupImage] = useState<string>("");
  const [activeObsIndexForMarkup, setActiveObsIndexForMarkup] = useState(0);
  const [activePhotoIndexForMarkup, setActivePhotoIndexForMarkup] = useState(0);

  // Draft Management
  const [hasDraft, setHasDraft] = useState(false);
  const [draftTime, setDraftTime] = useState("");
  const [rawDraft, setRawDraft] = useState<any>(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);

  // Collapsible observation items for mobile ergonomics
  const [collapsedObs, setCollapsedObs] = useState<Record<number, boolean>>({});

  const toggleObsCollapse = (index: number) => {
    setCollapsedObs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Check and detect draft from IDB / LocalStorage
  useEffect(() => {
    if (isEditMode) return;
    async function checkDraft() {
      if (!currentProjId) return;
      const d = await getFormDraft("SITE_COMMENT", currentProjId);
      if (d && d.data) {
        setHasDraft(true);
        setDraftTime(d.updatedAt);
        setRawDraft(d.data);
      }
    }
    checkDraft();
  }, [currentProjId, isEditMode]);

  const handleRestoreDraft = () => {
    if (!rawDraft) return;
    if (rawDraft.title) setTitle(rawDraft.title);
    if (rawDraft.inspectionDate) setInspectionDate(rawDraft.inspectionDate);
    if (rawDraft.inspectionTime) setInspectionTime(rawDraft.inspectionTime);
    if (rawDraft.weatherConditions)
      setWeatherConditions(rawDraft.weatherConditions);
    if (rawDraft.locationDescription)
      setLocationDescription(rawDraft.locationDescription);
    if (rawDraft.assignedSubcontractor)
      setAssignedSubcontractor(rawDraft.assignedSubcontractor);
    if (rawDraft.observations && rawDraft.observations.length > 0)
      setObservations(rawDraft.observations);
    setHasDraft(false);
  };

  const handleDiscardDraft = async () => {
    await clearFormDraft("SITE_COMMENT", currentProjId);
    setHasDraft(false);
    setRawDraft(null);
  };

  const handleSaveDraft = async () => {
    if (!canCreateComment) {
      toast.error("You do not have permission to log site observations");
      return;
    }
    setIsDraftSaving(true);
    const draftPayload = {
      title,
      inspectionDate,
      inspectionTime,
      weatherConditions,
      locationDescription,
      assignedSubcontractor,
      observations,
    };
    await saveFormDraft("SITE_COMMENT", currentProjId, draftPayload);

    const draftReport: SiteCommentReport = {
      id: `sc-draft-${Date.now()}`,
      reportNumber,
      title: title || "Draft Site Observations",
      projectId: currentProjId,
      companyId: currentCompId,
      inspectionDate,
      inspectionTime,
      weatherConditions,
      locationDescription,
      observations: observations.map((o) => ({
        ...o,
        status: o.status || "Non-Compliant",
      })),
      raisedByName: inspectorName,
      inspectorRole: inspectorRole,
      raisedBy: {
        name: inspectorName,
        role: inspectorRole,
        signatureUrl: engineerSig || undefined,
      },
      signOff: {
        qaEngineerName: inspectorName,
        qaSigned: Boolean(engineerSig),
        qaSignDate: inspectionDate,
        contractorRepName: subconName,
        contractorSigned: Boolean(subconSig),
        contractorSignDate: subconSig ? inspectionDate : undefined,
      },
      status: "DRAFT",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await dbService.saveSiteComment(draftReport);

    if (currentUser) {
      await writeAudit({
        projectId: currentProjId,
        companyId: currentCompId,
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "DRAFT_SITE_COMMENT",
        module: "Site Comments",
        details: `Saved draft site comment report ${draftReport.reportNumber}`,
        newValue: draftReport,
      });
    }

    setIsDraftSaving(false);
    navigate("/project/site-comments");
  };

  // Load existing report if in edit mode
  useEffect(() => {
    async function loadEditData() {
      if (!isEditMode && !location.state?.editReport) return;

      let reportToEdit: SiteCommentReport | undefined =
        location.state?.editReport;

      if (!reportToEdit && editReportId) {
        const list = await dbService.getSiteComments(
          currentProjId,
          currentCompId,
        );
        reportToEdit = list.find((r) => r.id === editReportId);
      }

      if (reportToEdit) {
        setOriginalReport(reportToEdit);
        setReportNumber(reportToEdit.reportNumber || reportNumber);
        setTitle(reportToEdit.title || "");
        setInspectionDate(
          reportToEdit.inspectionDate || new Date().toISOString().split("T")[0],
        );
        if (reportToEdit.inspectionTime)
          setInspectionTime(reportToEdit.inspectionTime);
        if (reportToEdit.weatherConditions)
          setWeatherConditions(reportToEdit.weatherConditions);
        if (reportToEdit.locationDescription)
          setLocationDescription(reportToEdit.locationDescription);

        if (reportToEdit.raisedByName)
          setInspectorName(reportToEdit.raisedByName);
        else if (
          typeof reportToEdit.raisedBy === "object" &&
          reportToEdit.raisedBy?.name
        ) {
          setInspectorName(reportToEdit.raisedBy.name);
        }

        if (reportToEdit.inspectorRole)
          setInspectorRole(reportToEdit.inspectorRole);
        else if (
          typeof reportToEdit.raisedBy === "object" &&
          reportToEdit.raisedBy?.role
        ) {
          setInspectorRole(reportToEdit.raisedBy.role);
        }

        if (reportToEdit.signOff?.contractorRepName)
          setSubconName(reportToEdit.signOff.contractorRepName);
        else if (reportToEdit.acknowledgedBy?.name)
          setSubconName(reportToEdit.acknowledgedBy.name);

        if (reportToEdit.acknowledgedBy?.subcontractorCompany) {
          setSubconCompany(reportToEdit.acknowledgedBy.subcontractorCompany);
        }

        if (reportToEdit.observations && reportToEdit.observations.length > 0) {
          setObservations(
            reportToEdit.observations.map((o, idx) => ({
              ...o,
              observationNumber: o.observationNumber || idx + 1,
              observationText:
                o.comments || o.observationText || o.fieldObservation || "",
              comments:
                o.comments || o.observationText || o.fieldObservation || "",
              correctiveDirective: o.correctiveDirective || "",
              assignedTo: o.assignedTo || o.assignedSubcontractor || "",
              assignedSubcontractor:
                o.assignedTo || o.assignedSubcontractor || "",
              structuralElement: o.structuralElement || o.elementName || "",
              trade: o.trade || o.tradeName || "",
              status: o.status || "Non-Compliant",
              severity: (o.severity || "HIGH") as ObservationSeverity,
            })),
          );
        }
      }
    }

    loadEditData();
  }, [isEditMode, editReportId, currentProjId, currentCompId, location.state]);

  const handleAddObservation = () => {
    setObservations((prev) => [
      ...prev,
      {
        id: `obs-${Date.now()}`,
        observationNumber: prev.length + 1,
        levelId: activeProject?.currentLevelId || "lvl-gf",
        levelName: activeProject?.currentLevelName || "Ground Floor",
        gridLocation: "",
        structuralElement: "",
        tradeId: "trade-civ",
        tradeName: "Structural",
        trade: "Structural",
        subtradeName: "Concrete",
        subtrade: "Concrete",
        severity: "MEDIUM",
        observationText: "",
        comments: "",
        correctiveDirective: "",
        status: "Non-Compliant",
        assignedTo: assignedSubcontractor,
        assignedSubcontractor: assignedSubcontractor,
        photos: [],
        dueDate: new Date(Date.now() + 3 * 86400000)
          .toISOString()
          .split("T")[0],
      },
    ]);
  };

  const handleRemoveObservation = (index: number) => {
    if (observations.length <= 1) return;
    setObservations((prev) => prev.filter((_, i) => i !== index));
  };

  const updateObservationField = (
    index: number,
    field: keyof ObservationItem,
    val: any,
  ) => {
    setObservations((prev) => {
      const next = [...prev];
      const target = { ...next[index], [field]: val };

      // Keep duplicate field mappings synchronized
      if (field === "observationText") target.comments = val;
      if (field === "comments") target.observationText = val;
      if (field === "assignedSubcontractor") target.assignedTo = val;
      if (field === "assignedTo") target.assignedSubcontractor = val;
      if (field === "elementName") target.structuralElement = val;
      if (field === "structuralElement") target.elementName = val;
      if (field === "tradeName") target.trade = val;
      if (field === "trade") target.tradeName = val;

      next[index] = target;
      return next;
    });
  };

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    obsIndex: number,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const toastId = toast.loading('Uploading observation photo(s) to Cloudinary...');
    try {
      const results = await uploadMultiple(Array.from(files), `jqms/comments/${currentProjId}`);

      const newPhotoObjs: ObservationPhoto[] = results.map((res) => ({
        url: res.url,
        thumbnailUrl: getThumbnail(res.url, 250),
        caption: `Observation #${obsIndex + 1} - ${observations[obsIndex]?.levelName || 'Site'} (${new Date().toLocaleDateString()})`,
        timestamp: Date.now(),
        uploadedAt: Date.now(),
      }));

      setObservations((prev) => {
        const next = [...prev];
        const currentPhotos = next[obsIndex].photos || [];
        next[obsIndex] = {
          ...next[obsIndex],
          photos: [...currentPhotos, ...newPhotoObjs],
        };
        return next;
      });

      // Auto-sync to Central Site Gallery
      await syncMultiplePhotosToSiteGallery(
        newPhotoObjs.map((p) => ({
          projectId: currentProjId,
          companyId: currentCompId,
          url: p.url,
          thumbnailUrl: p.thumbnailUrl,
          caption: p.caption || `Observation #${obsIndex + 1}`,
          floorLevel: observations[obsIndex]?.levelName,
          elementName: observations[obsIndex]?.structuralElement,
          tradeName: observations[obsIndex]?.tradeName,
          category: 'QUALITY_DEFECT',
          uploadedBy: currentUser?.fullName || 'QA/QC Engineer',
          uploaderRole: currentUser?.role,
          sourceModule: 'SiteComments',
          sourceId: reportNumber || `com-${Date.now()}`,
        }))
      );

      toast.success(`${newPhotoObjs.length} photo(s) uploaded and saved!`, { id: toastId });
    } catch (err: any) {
      console.error('Photo upload failed:', err);
      toast.error(`Upload failed: ${err?.message || 'Error occurred'}`, { id: toastId });
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const openMarkupModal = (
    obsIdx: number,
    photoIdx: number,
    imgUrl: string,
  ) => {
    setActiveObsIndexForMarkup(obsIdx);
    setActivePhotoIndexForMarkup(photoIdx);
    setActiveMarkupImage(imgUrl);
    setMarkupModalOpen(true);
  };

  const handleSaveAnnotatedPhoto = (annotatedUrl: string) => {
    setObservations((prev) => {
      const next = [...prev];
      const photos = [...(next[activeObsIndexForMarkup].photos || [])];
      const existing = photos[activePhotoIndexForMarkup];

      if (typeof existing === "object" && existing !== null) {
        photos[activePhotoIndexForMarkup] = {
          ...existing,
          url: annotatedUrl,
          thumbnailUrl: annotatedUrl,
        };
      } else {
        photos[activePhotoIndexForMarkup] = annotatedUrl;
      }

      next[activeObsIndexForMarkup] = {
        ...next[activeObsIndexForMarkup],
        photos,
      };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateComment) {
      toast.error("You do not have permission to log site observations");
      return;
    }
    const reportId = editReportId || originalReport?.id || `com-${Date.now()}`;

    // Ensure all observations have synchronized comments and observationText
    const sanitizedObservations: ObservationItem[] = observations.map(
      (obs, idx) => {
        const text =
          obs.comments || obs.observationText || obs.fieldObservation || "";
        const parsedTrade = parseTradeAndSubtrade(obs);
        return {
          ...obs,
          observationNumber: idx + 1,
          comments: text,
          observationText: text,
          assignedTo:
            obs.assignedTo ||
            obs.assignedSubcontractor ||
            assignedSubcontractor,
          assignedSubcontractor:
            obs.assignedTo ||
            obs.assignedSubcontractor ||
            assignedSubcontractor,
          structuralElement: obs.structuralElement || obs.elementName || "",
          elementName: obs.structuralElement || obs.elementName || "",
          trade: parsedTrade.trade,
          tradeName: parsedTrade.trade,
          tradeId: obs.tradeId || parsedTrade.tradeId,
          subtrade: parsedTrade.subtrade,
          subtradeName: parsedTrade.subtrade,
          subtradeId: obs.subtradeId || parsedTrade.subtradeId,
          status: obs.status || "Non-Compliant",
        };
      },
    );

    const reportData: SiteCommentReport = {
      id: reportId,
      projectId: currentProjId,
      companyId: currentCompId || company?.id || "-Oubn5JnM98I3QvSzHCB",
      projectName:
        activeProject?.name || originalReport?.projectName || "Bankside",
      companyName:
        company?.name ||
        originalReport?.companyName ||
        "Collection Developments LTD",
      reportNumber,
      title:
        title ||
        (activeProject?.name
          ? `${activeProject.name} - Field Observation`
          : "Site Comment & Directives"),
      inspectionDate,
      inspectionTime,
      inspectorRole,
      weatherConditions,
      locationDescription,
      observations: sanitizedObservations,
      raisedBy: currentUser?.uid || originalReport?.raisedBy || "usr-qaqc-eng",
      raisedByName: inspectorName,
      signOff: {
        qaEngineerName: inspectorName,
        qaSignDate: inspectionDate,
        qaSigned: true,
        contractorRepName: subconName,
        contractorSignDate: subconSig ? inspectionDate : "",
        contractorSigned: Boolean(subconSig),
      },
      acknowledgedBy: {
        name: subconName,
        subcontractorCompany: subconCompany,
        signatureUrl: subconSig,
        signedAt: subconSig ? new Date().toISOString() : undefined,
      },
      status: sanitizedObservations.every(
        (o) => o.status === "Compliant" || o.status === "RECTIFIED",
      )
        ? "CLOSED"
        : "ISSUED",
      createdAt: originalReport?.createdAt || Date.now(),
      updatedAt: Date.now(),
      updatedBy: currentUser?.uid || "usr-qaqc-eng",
      updatedByName: currentUser?.fullName || inspectorName,
    };

    // Save to Firestore
    await dbService.saveSiteComment(reportData);
    await clearFormDraft("SITE_COMMENT", currentProjId);

    // Auto-sync photos to central site gallery
    for (const obs of sanitizedObservations) {
      const photos = obs.photos || [];
      const obsText = obs.comments || obs.observationText || "";
      for (const photo of photos) {
        const photoUrl =
          typeof photo === "string" ? photo : photo?.url || photo?.thumbnailUrl;
        if (!photoUrl) continue;
        await syncPhotoToSiteGallery({
          projectId: currentProjId,
          companyId: currentCompId || company?.id || "comp-apex-civil",
          url: photoUrl,
          caption: `${obsText.substring(0, 80)} (${reportNumber})`,
          floorLevel: obs.levelName,
          elementName: obs.structuralElement || obs.elementName,
          category: "QUALITY_DEFECT",
          tradeName: obs.trade || obs.tradeName,
          uploadedBy: currentUser?.fullName || inspectorName,
          uploaderRole: currentUser?.role || inspectorRole,
          sourceModule: "SiteComments",
          sourceId: reportId,
        });
      }
    }

    // Write Audit Log
    if (currentUser) {
      const action = isEditMode ? "UPDATE_SITE_COMMENT" : "CREATE_SITE_COMMENT";
      const details = isEditMode
        ? `Updated Site Observation Report ${reportNumber} (Status / Observations updated)`
        : `Created Site Observation Report ${reportNumber} with ${sanitizedObservations.length} items`;

      await writeAudit({
        projectId: currentProjId,
        companyId: currentCompId || company?.id || "comp-apex-civil",
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action,
        module: "SiteComments",
        details,
        previousValue: originalReport,
        newValue: reportData,
      });
    }

    if (!isEditMode) {
      await clearDraftObservation(`draft-${currentProjId}`);
    }

    navigate(`/project/${currentProjId}/site-comments`);
    navigate("/project/site-comments");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/project/site-comments")}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-0.5">
              <span>
                {isEditMode
                  ? "Editing Existing Record"
                  : "Procore Standard Observation Suite"}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isEditMode
                ? `Edit Site Observation (${reportNumber})`
                : "Create Site Observation Report"}
            </h1>
          </div>
        </div>
      </div>

      <DraftBanner
        hasDraft={hasDraft}
        draftTime={draftTime}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        formName="Site Observations"
      />

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Report Metadata Header Box */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
              Report Identity & Site Conditions
            </span>
            <span className="px-3 py-1 rounded-lg bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 font-mono text-xs font-bold border border-brand-200 dark:border-brand-500/30">
              Ref: {reportNumber}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Report Subject / Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Ground Floor Transfer Beam & Column Rebar Non-Compliances"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Inspection Date *
              </label>
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Inspection Time
              </label>
              <input
                type="time"
                value={inspectionTime}
                onChange={(e) => setInspectionTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Weather & Site Condition
              </label>
              <input
                type="text"
                value={weatherConditions}
                onChange={(e) => setWeatherConditions(e.target.value)}
                placeholder="e.g. 28°C, Dry, High Wind"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                General Location / Zone
              </label>
              <input
                type="text"
                value={locationDescription}
                onChange={(e) => setLocationDescription(e.target.value)}
                placeholder="e.g. Podium Level 1, Core Walls & Columns"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Observations List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Observation Items ({observations.length})
            </h3>
            <button
              type="button"
              onClick={handleAddObservation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Observation</span>
            </button>
          </div>

          {observations.map((obs, idx) => {
            const obsTextVal = obs.comments || obs.observationText || "";
            const directiveVal = obs.correctiveDirective || "";
            const assignedVal =
              obs.assignedTo || obs.assignedSubcontractor || "";

            const isItemCollapsed = Boolean(collapsedObs[idx]);
            const elementPreview = obs.structuralElement || obs.elementName || "No element selected";
            const levelPreview = obs.levelName || "No level";

            return (
              <div
                key={obs.id || idx}
                className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4 relative group"
              >
                {/* Item Top Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleObsCollapse(idx)}
                      className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                      title={isItemCollapsed ? "Expand Observation" : "Collapse Observation"}
                    >
                      {isItemCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </button>
                    <span className="w-6 h-6 rounded-lg bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center font-mono text-xs">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                      Observation #{idx + 1}
                    </span>
                    {isItemCollapsed && (
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded truncate max-w-[180px]">
                        {elementPreview} ({levelPreview})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* QA/QC Snippet Drawer Trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveObsIndexForSnippet(idx);
                        setIsSnippetDrawerOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/70 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 text-[11px] font-semibold transition shadow-sm min-h-[32px]"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span className="hidden sm:inline">Insert QA/QC Remark Snippet</span>
                      <span className="sm:hidden">Snippet</span>
                    </button>

                    {observations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveObservation(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                        title="Delete this observation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {!isItemCollapsed && (
                  <>

                {/* Master Data Selectors */}
                <div className="space-y-3">
                    <LevelElementSelect
                    projectId={currentProjId}
                    selectedLevelId={obs.levelId}
                    selectedElementId={obs.elementId}
                    onLevelChange={(lId, lName) => {
                      updateObservationField(idx, "levelId", lId);
                      updateObservationField(idx, "levelName", lName);
                    }}
                    onElementChange={(elId, elName, gridLoc) => {
                      updateObservationField(idx, "elementId", elId);
                      updateObservationField(idx, "elementName", elName);
                      updateObservationField(idx, "structuralElement", elName);
                      if (gridLoc && !obs.gridLocation) {
                        updateObservationField(idx, "gridLocation", gridLoc);
                      }
                    }}
                    required
                  />

                  <TradeSubtradeSelect
                    companyId={currentCompId}
                    selectedTradeId={obs.tradeId}
                    selectedTradeName={obs.tradeName || obs.trade}
                    selectedSubtrade={obs.subtradeName || obs.subtrade}
                    onTradeChange={(tId, tName) => {
                      updateObservationField(idx, "tradeId", tId);
                      updateObservationField(idx, "tradeName", tName);
                      updateObservationField(idx, "trade", tName);
                    }}
                    onSubtradeChange={(stName) => { 
                      updateObservationField(idx, "subtradeName", stName);
                      updateObservationField(idx, "subtrade", stName);
                    }}
                    required
                  />
                </div>

                {/* Grid Location & Structural Element manual overrides */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Grid Location Reference (e.g. 3-5/C-D)
                    </label>
                    <input
                      type="text"
                      value={obs.gridLocation || ""}
                      onChange={(e) =>
                        updateObservationField(
                          idx,
                          "gridLocation",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. 3-5/C-D or Grid F / 9-10"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 font-mono focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Structural Element Name
                    </label>
                    <input
                      type="text"
                      value={obs.structuralElement || obs.elementName || ""}
                      onChange={(e) => {
                        updateObservationField(
                          idx,
                          "structuralElement",
                          e.target.value,
                        );
                        updateObservationField(
                          idx,
                          "elementName",
                          e.target.value,
                        );
                      }}
                      placeholder="e.g. Main Staircase, Beam B12, Column C4"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Severity, Status, Target Date & Subcontractor */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Defect Severity *
                    </label>
                    <select
                      value={obs.severity || "HIGH"}
                      onChange={(e) =>
                        updateObservationField(
                          idx,
                          "severity",
                          e.target.value as ObservationSeverity,
                        )
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-brand-500"
                    >
                      <option value="CRITICAL">CRITICAL (Stop Work)</option>
                      <option value="HIGH">HIGH (Major Defect)</option>
                      <option value="MEDIUM">
                        MEDIUM (Standard Non-Compliance)
                      </option>
                      <option value="LOW">LOW (Minor Remark)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Observation Status *
                    </label>
                    <select
                      value={obs.status || "Non-Compliant"}
                      onChange={(e) =>
                        updateObservationField(idx, "status", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-brand-500"
                    >
                      <option value="Non-Compliant">Non-Compliant</option>
                      <option value="Compliant">Compliant</option>
                      <option value="Observation / Note">
                        Observation / Note
                      </option>
                      <option value="Rectified on Site">
                        Rectified on Site
                      </option>
                      <option value="OPEN">OPEN</option>
                      <option value="RECTIFIED">RECTIFIED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Target Rectification Date
                    </label>
                    <input
                      type="date"
                      value={obs.dueDate || ""}
                      onChange={(e) =>
                        updateObservationField(idx, "dueDate", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Assigned Subcontractor / Person
                    </label>
                    <input
                      type="text"
                      value={assignedVal}
                      onChange={(e) => {
                        updateObservationField(
                          idx,
                          "assignedTo",
                          e.target.value,
                        );
                        updateObservationField(
                          idx,
                          "assignedSubcontractor",
                          e.target.value,
                        );
                      }}
                      placeholder="e.g. Mr. Wasiu / Titan Steel"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Split Fields: Observation Condition vs Directive (Multi-line Preserved) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                        Observed Site Condition (Defect Details) *
                      </label>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        Press Enter for new line / bullets
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      value={obsTextVal}
                      onChange={(e) => {
                        updateObservationField(idx, "comments", e.target.value);
                        updateObservationField(
                          idx,
                          "observationText",
                          e.target.value,
                        );
                      }}
                      placeholder="* Insufficient lap length of Bottom bars (BB) at beam support ON GRID F&#10;* Laps entering from panel 1 aren't lapped properly...&#10;* Provide 480mm splice bars to increase lap length"
                      required
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 leading-relaxed font-sans"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-emerald-700 dark:text-emerald-400 font-semibold">
                        Mandatory Corrective Action Directive *
                      </label>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-mono">
                        Preserves line breaks
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      value={directiveVal}
                      onChange={(e) =>
                        updateObservationField(
                          idx,
                          "correctiveDirective",
                          e.target.value,
                        )
                      }
                      placeholder="* Fabricate and install missing splice connection bars prior to casting&#10;* Ensure 20mm concrete cover spacer blocks are positioned securely"
                      required
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                    />
                  </div>
                </div>

                {/* Photo Evidence & Annotations */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">
                      Photographic Evidence & Annotations (
                      {obs.photos?.length || 0})
                    </span>
                    <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold transition shadow-sm">
                      <Camera className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handlePhotoUpload(e, idx)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Photos Grid */}
                  <div className="flex flex-wrap gap-3">
                    {(obs.photos || []).map((pItem, pIdx) => {
                      const imgUrl =
                        typeof pItem === "string"
                          ? pItem
                          : pItem?.thumbnailUrl || pItem?.url || "";
                      const caption =
                        typeof pItem === "object" && pItem?.caption
                          ? pItem.caption
                          : "";

                      return (
                        <div
                          key={pIdx}
                          className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 w-28 h-28 bg-slate-50 dark:bg-slate-950 shadow-sm"
                        >
                          <img
                            src={imgUrl}
                            alt="Evidence"
                            className="w-full h-full object-cover"
                          />
                          {/* Draw Markup Button Overlay */}
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1.5 p-1">
                            <button
                              type="button"
                              onClick={() => openMarkupModal(idx, pIdx, imgUrl)}
                              className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold flex items-center gap-1 shadow"
                            >
                              <PenTool className="w-3 h-3" />
                              <span>Markup</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newP = (obs.photos || []).filter(
                                  (_, i) => i !== pIdx,
                                );
                                updateObservationField(idx, "photos", newP);
                              }}
                              className="text-slate-300 hover:text-red-400 text-[10px] font-semibold"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                </>
                )}
              </div>
            );
          })}
        </div>

        {/* Dual Digital Signature Blocks */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
              Dual Digital Authorization & Sign-Off
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Engineer Signature */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[10px] mb-1">
                    QA/QC Engineer Name
                  </label>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[10px] mb-1">
                    Inspector Role
                  </label>
                  <input
                    type="text"
                    value={inspectorRole}
                    onChange={(e) => setInspectorRole(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
              <SignaturePad
                label="Engineer Digital Signature"
                onSave={(sig) => setEngineerSig(sig)}
              />
            </div>

            {/* Subcontractor Representative Acknowledgment */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[10px] mb-1">
                    Subcontractor Rep Name
                  </label>
                  <input
                    type="text"
                    value={subconName}
                    onChange={(e) => setSubconName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[10px] mb-1">
                    Contracting Firm
                  </label>
                  <input
                    type="text"
                    value={subconCompany}
                    onChange={(e) => setSubconCompany(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
              <SignaturePad
                label="Subcontractor Digital Acknowledgment"
                onSave={(sig) => setSubconSig(sig)}
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate("/project/site-comments")}
            className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isDraftSaving || !canCreateComment}
            title={!canCreateComment ? "You do not have permission to log site observations" : undefined}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-500/30 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{isDraftSaving ? "Saving Draft..." : "Save as Draft"}</span>
          </button>
          <button
            type="submit"
            disabled={!canCreateComment}
            title={!canCreateComment ? "You do not have permission to log site observations" : undefined}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-xl shadow-brand-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>
              {isEditMode
                ? "Save & Update Site Observation Report"
                : "Issue Official Site Observation Report"}
            </span>
          </button>
        </div>
      </form>

      {/* Snippet Drawer Modal */}
      <RemarkSnippetDrawer
        isOpen={isSnippetDrawerOpen}
        onClose={() => setIsSnippetDrawerOpen(false)}
        onSelectSnippet={(obsText, dirText, sev) => {
          updateObservationField(
            activeObsIndexForSnippet,
            "observationText",
            obsText,
          );
          updateObservationField(activeObsIndexForSnippet, "comments", obsText);
          updateObservationField(
            activeObsIndexForSnippet,
            "correctiveDirective",
            dirText,
          );
          updateObservationField(activeObsIndexForSnippet, "severity", sev);
        }}
      />

      {/* HTML5 Photo Evidence Markup Modal */}
      <PhotoMarkupModal
        isOpen={markupModalOpen}
        imageUrl={activeMarkupImage}
        onClose={() => setMarkupModalOpen(false)}
        onSaveAnnotatedImage={handleSaveAnnotatedPhoto}
      />
    </div>
  );
};
