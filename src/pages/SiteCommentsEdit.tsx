import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import {
  syncPhotoToSiteGallery,
  syncMultiplePhotosToSiteGallery,
} from "@/lib/photoSync";
import { uploadMultiple, getThumbnail } from "@/lib/cloudinary";
import { generateSiteCommentsPDF } from "@/lib/pdfGenerators";
import { LevelElementSelect } from "@/components/sitecomments/LevelElementSelect";
import { TradeSubtradeSelect } from "@/components/sitecomments/TradeSubtradeSelect";
import { RemarkSnippetDrawer } from "@/components/sitecomments/RemarkSnippetDrawer";
import { PhotoMarkupModal } from "@/components/sitecomments/PhotoMarkupModal";
import { SignaturePad } from "@/components/common/SignaturePad";
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
  FileDown,
  Clock,
  Layers,
  MapPin,
  Calendar,
  AlertTriangle,
  User,
  ShieldCheck,
  Maximize2,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export const SiteCommentsEdit: React.FC = () => {
  const { id, projectId } = useParams<{ id: string; projectId?: string }>();
  const navigate = useNavigate();
  const { currentUser, company } = useAuthStore();
  const { activeProject } = useProjectStore();
  const currentProjId = projectId || activeProject?.id || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";
  const canEditComment = hasPermission(currentUser?.role, "RESOLVE_SITE_COMMENT");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalReport, setOriginalReport] =
    useState<SiteCommentReport | null>(null);

  // Form State
  const [reportNumber, setReportNumber] = useState("");
  const [title, setTitle] = useState("");
  const [inspectionDate, setInspectionDate] = useState("");
  const [inspectionTime, setInspectionTime] = useState("");
  const [weatherConditions, setWeatherConditions] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [reportStatus, setReportStatus] = useState("ISSUED");

  // Observations State
  const [observations, setObservations] = useState<ObservationItem[]>([]);

  // Sign-off State
  const [inspectorName, setInspectorName] = useState("");
  const [inspectorRole, setInspectorRole] = useState("");
  const [engineerSig, setEngineerSig] = useState("");
  const [subconName, setSubconName] = useState("");
  const [subconCompany, setSubconCompany] = useState("");
  const [subconSig, setSubconSig] = useState("");

  // Modals & Drawers
  const [isSnippetDrawerOpen, setIsSnippetDrawerOpen] = useState(false);
  const [activeObsIndexForSnippet, setActiveObsIndexForSnippet] = useState(0);

  const [markupModalOpen, setMarkupModalOpen] = useState(false);
  const [activeMarkupImage, setActiveMarkupImage] = useState<string>("");
  const [activeObsIndexForMarkup, setActiveObsIndexForMarkup] = useState(0);
  const [activePhotoIndexForMarkup, setActivePhotoIndexForMarkup] = useState(0);

  // Lightbox
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  // Collapsible observation items for mobile ergonomics
  const [collapsedObs, setCollapsedObs] = useState<Record<number, boolean>>({});

  const toggleObsCollapse = (index: number) => {
    setCollapsedObs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Fetch Report Data
  useEffect(() => {
    async function loadReport() {
      if (!id) return;
      setLoading(true);
      try {
        const list = await dbService.getSiteComments(
          currentProjId,
          currentCompId,
        );
        const target = list.find((r) => r.id === id);

        if (target) {
          setOriginalReport(target);
          setReportNumber(target.reportNumber || "QC/COMMENTS");
          setTitle(target.title || "");
          setInspectionDate(
            target.inspectionDate || new Date().toISOString().split("T")[0],
          );
          setInspectionTime(
            target.inspectionTime || new Date().toTimeString().slice(0, 5),
          );
          setWeatherConditions(
            target.weatherConditions || "Clear & Dry (28°C)",
          );
          setLocationDescription(target.locationDescription || "");
          setReportStatus(target.status || "ISSUED");

          // Inspector info
          const originName =
            target.raisedByName ||
            (typeof target.raisedBy === "object"
              ? target.raisedBy?.name
              : target.raisedBy) ||
            currentUser?.fullName ||
            "QA/QC Engineer";
          setInspectorName(originName);

          const originRole =
            target.inspectorRole ||
            (typeof target.raisedBy === "object"
              ? target.raisedBy?.role
              : "") ||
            currentUser?.role ||
            "QA/QC Engineer";
          setInspectorRole(originRole);

          // Subcontractor info
          setSubconName(
            target.signOff?.contractorRepName ||
              target.acknowledgedBy?.name ||
              "Subcontractor Representative",
          );
          setSubconCompany(
            target.acknowledgedBy?.subcontractorCompany ||
              target.companyName ||
              company?.name ||
              "",
          );
          if (target.acknowledgedBy?.signatureUrl) {
            setSubconSig(target.acknowledgedBy.signatureUrl);
          }

          // Observations normalization
          if (target.observations && target.observations.length > 0) {
            setObservations(
              target.observations.map((o, idx) => {
                const parsedTrade = parseTradeAndSubtrade(o);
                return {
                  ...o,
                  id: o.id || `obs-${Date.now()}-${idx}`,
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
                  elementName: o.structuralElement || o.elementName || "",
                  trade: parsedTrade.trade,
                  tradeName: parsedTrade.trade,
                  tradeId: o.tradeId || parsedTrade.tradeId,
                  subtrade: parsedTrade.subtrade,
                  subtradeName: parsedTrade.subtrade,
                  subtradeId: o.subtradeId || parsedTrade.subtradeId,
                  gridLocation: o.gridLocation || "",
                  levelName: o.levelName || "Ground Floor",
                  severity: (o.severity || "MEDIUM") as ObservationSeverity,
                  status: o.status || "OPEN",
                  photos: o.photos || [],
                  dueDate:
                    o.dueDate ||
                    new Date(Date.now() + 3 * 86400000)
                      .toISOString()
                      .split("T")[0],
                };
              }),
            );
          }
        }
      } catch (err) {
        console.error("Error loading site comment report:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [id, currentProjId, currentCompId]);

  const handleAddObservation = () => {
    setObservations((prev) => [
      ...prev,
      {
        id: `obs-${Date.now()}`,
        observationNumber: prev.length + 1,
        levelId: "lvl-gf",
        levelName: "Ground Floor",
        gridLocation: "",
        structuralElement: "",
        elementName: "",
        tradeId: "trade-civ",
        tradeName: "Civil & Structural Concrete",
        trade: "Structural Concrete",
        severity: "MEDIUM",
        observationText: "",
        comments: "",
        correctiveDirective: "",
        status: "OPEN",
        assignedTo: subconCompany || "Contractor",
        assignedSubcontractor: subconCompany || "Contractor",
        photos: [],
        dueDate: new Date(Date.now() + 3 * 86400000)
          .toISOString()
          .split("T")[0],
      },
    ]);
  };

  const handleRemoveObservation = (index: number) => {
    if (observations.length <= 1) {
      alert("A site observation report must contain at least one observation.");
      return;
    }
    if (confirm("Are you sure you want to delete this observation item?")) {
      setObservations((prev) => prev.filter((_, i) => i !== index));
    }
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

    const toastId = toast.loading(
      "Uploading observation photo(s) to Cloudinary...",
    );
    try {
      const results = await uploadMultiple(
        Array.from(files),
        `jqms/comments/${currentProjId}`,
      );

      const newPhotoObjs: ObservationPhoto[] = results.map((res) => ({
        url: res.url,
        thumbnailUrl: getThumbnail(res.url, 250),
        caption: `Observation #${obsIndex + 1} - ${observations[obsIndex]?.levelName || "Site"} (${new Date().toLocaleDateString()})`,
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
          companyId: currentCompId || company?.id || "comp-apex-civil",
          url: p.url,
          thumbnailUrl: p.thumbnailUrl,
          caption: p.caption || `Observation #${obsIndex + 1}`,
          floorLevel: observations[obsIndex]?.levelName,
          elementName:
            observations[obsIndex]?.structuralElement ||
            observations[obsIndex]?.elementName,
          tradeName:
            observations[obsIndex]?.tradeName || observations[obsIndex]?.trade,
          category: "QUALITY_DEFECT",
          uploadedBy: currentUser?.fullName || inspectorName,
          uploaderRole: currentUser?.role || inspectorRole,
          sourceModule: "SiteComments",
          sourceId: id || "pending",
        })),
      );

      toast.success(
        `${newPhotoObjs.length} photo(s) uploaded and indexed in gallery!`,
        { id: toastId },
      );
    } catch (err: any) {
      console.error("Photo upload error:", err);
      toast.error("Failed to upload photo(s)", { id: toastId });
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const handleRemovePhoto = (obsIdx: number, photoIdx: number) => {
    setObservations((prev) => {
      const next = [...prev];
      const photos = [...(next[obsIdx].photos || [])];
      photos.splice(photoIdx, 1);
      next[obsIdx] = { ...next[obsIdx], photos };
      return next;
    });
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
    if (!canEditComment) {
      toast.error("You do not have permission to modify site observations");
      return;
    }
    if (!id) return;
    setSaving(true);

    try {
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
            assignedTo: obs.assignedTo || obs.assignedSubcontractor || "",
            assignedSubcontractor:
              obs.assignedTo || obs.assignedSubcontractor || "",
            structuralElement: obs.structuralElement || obs.elementName || "",
            elementName: obs.structuralElement || obs.elementName || "",
            trade: parsedTrade.trade,
            tradeName: parsedTrade.trade,
            tradeId: obs.tradeId || parsedTrade.tradeId,
            subtrade: parsedTrade.subtrade,
            subtradeName: parsedTrade.subtrade,
            subtradeId: obs.subtradeId || parsedTrade.subtradeId,
            status: obs.status || "OPEN",
          };
        },
      );

      const isAllCompliant = sanitizedObservations.every(
        (o) =>
          o.status === "Compliant" ||
          o.status === "RECTIFIED" ||
          o.status === "Rectified on Site" ||
          o.status === "CLOSED",
      );

      const updatedReport: SiteCommentReport = {
        ...(originalReport || {}),
        id,
        projectId: currentProjId,
        companyId: currentCompId || company?.id || "-Oubn5JnM98I3QvSzHCB",
        projectName:
          activeProject?.name || originalReport?.projectName || "Project",
        companyName: company?.name || originalReport?.companyName,
        reportNumber: reportNumber || "QC/COMMENTS",
        title:
          title ||
          (activeProject?.name
            ? `${activeProject.name} - Field Observation`
            : "Site Observation Report"),
        inspectionDate,
        inspectionTime,
        inspectorRole,
        weatherConditions,
        locationDescription,
        observations: sanitizedObservations,
        raisedBy:
          currentUser?.uid || originalReport?.raisedBy || "usr-qaqc-eng",
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
        status: isAllCompliant ? "CLOSED" : reportStatus,
        createdAt: originalReport?.createdAt || Date.now(),
        updatedAt: Date.now(),
        updatedBy: currentUser?.uid || "usr-qaqc-eng",
        updatedByName: currentUser?.fullName || inspectorName,
      };

      // 1. Save updated report in database
      await dbService.saveSiteComment(updatedReport);

      // 2. Sync photos to centralized photo gallery
      for (const obs of sanitizedObservations) {
        const photos = obs.photos || [];
        const obsText = obs.comments || obs.observationText || "";
        for (const photo of photos) {
          const photoUrl =
            typeof photo === "string"
              ? photo
              : photo?.url || photo?.thumbnailUrl;
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
            sourceId: id,
          });
        }
      }

      // 3. Write Audit Log
      await writeAudit({
        projectId: currentProjId,
        companyId: currentCompId || company?.id || "comp-apex-civil",
        userId: currentUser?.uid || "unknown",
        userName: currentUser?.fullName || inspectorName || "User",
        userRole: currentUser?.role || inspectorRole || "QA/QC Engineer",
        action: "UPDATE",
        module: "SiteComments",
        details: `Edited Site Observation Report ${reportNumber} with ${sanitizedObservations.length} observations (Status: ${updatedReport.status})`,
        previousValue: originalReport,
        newValue: updatedReport,
      });

      // Redirect back to registry
      navigate("/project/site-comments");
    } catch (err) {
      console.error("Failed to save edited site comment:", err);
      alert("Failed to save changes. Please check your connection.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
          Loading Site Observation Record...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/project/site-comments")}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
            title="Back to Site Observations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-0.5">
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editing Site Observation Report</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Edit Observation ({reportNumber})
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {originalReport && (
            <button
              type="button"
              onClick={() =>
                generateSiteCommentsPDF(
                  originalReport,
                  activeProject || {},
                  company || {},
                )
              }
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-sm"
            >
              <FileDown className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>PDF Preview</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !canEditComment}
            title={!canEditComment ? "You do not have permission to modify site observations" : undefined}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Updates</span>
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: General Report Metadata */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquareWarning className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Report Header & Site Context</span>
            </h2>
            <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-200 dark:border-brand-500/20">
              {reportNumber}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Report Reference #
              </label>
              <input
                type="text"
                value={reportNumber}
                onChange={(e) => setReportNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-brand-700 dark:text-brand-300 focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Report Title / Subject
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 2nd Floor Beam Rebar Inspection Findings"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Overall Report Status
              </label>
              <select
                value={reportStatus}
                onChange={(e) => setReportStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-brand-500"
              >
                <option value="ISSUED">ISSUED (Active Action)</option>
                <option value="RECTIFIED">RECTIFIED (Resolved)</option>
                <option value="CLOSED">CLOSED (Verified by QA)</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Inspection Date
              </label>
              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Inspection Time
              </label>
              <input
                type="time"
                value={inspectionTime}
                onChange={(e) => setInspectionTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Weather & Site Conditions
              </label>
              <input
                type="text"
                value={weatherConditions}
                onChange={(e) => setWeatherConditions(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              General Location Description
            </label>
            <input
              type="text"
              value={locationDescription}
              onChange={(e) => setLocationDescription(e.target.value)}
              placeholder="e.g. Core 1, Grid A-D / 1-4, Suspended Slab & Staircases"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Section 2: Discrete Observations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Discrete Observations & Directives ({observations.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Each observation supports multi-line enter spacing, photos with
                markup annotation, severity, and trade tags.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddObservation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-600/20 hover:bg-brand-100 dark:hover:bg-brand-600/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30 text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Observation</span>
            </button>
          </div>

          {observations.map((obs, idx) => {
            const obsText =
              obs.comments || obs.observationText || obs.fieldObservation || "";
            const directive = obs.correctiveDirective || "";
            const photos = obs.photos || [];
            const isItemCollapsed = Boolean(collapsedObs[idx]);
            const elementPreview = obs.structuralElement || obs.elementName || "No element selected";
            const levelPreview = obs.levelName || "No level";

            return (
              <div
                key={obs.id || idx}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4"
              >
                {/* Header row for observation */}
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
                    <span className="w-6 h-6 rounded-full bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400 text-xs font-bold flex items-center justify-center font-mono">
                      {idx + 1}
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
                    {/* Status Selector */}
                    <select
                      value={obs.status || "OPEN"}
                      onChange={(e) =>
                        updateObservationField(idx, "status", e.target.value)
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer focus:outline-none transition min-h-[32px] ${
                        obs.status === "Compliant" ||
                        obs.status === "RECTIFIED" ||
                        obs.status === "Rectified on Site" ||
                        obs.status === "CLOSED"
                          ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60"
                          : obs.status === "Non-Compliant"
                            ? "bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/60"
                            : obs.status === "Observation / Note"
                              ? "bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700/60"
                              : "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60"
                      }`}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="Non-Compliant">Non-Compliant</option>
                      <option value="Compliant">Compliant</option>
                      <option value="Observation / Note">
                        Observation / Note
                      </option>
                      <option value="Rectified on Site">
                        Rectified on Site
                      </option>
                      <option value="RECTIFIED">RECTIFIED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>

                    {/* Severity Selector */}
                    <select
                      value={obs.severity || "MEDIUM"}
                      onChange={(e) =>
                        updateObservationField(
                          idx,
                          "severity",
                          e.target.value as ObservationSeverity,
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 min-h-[32px]"
                    >
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </select>

                    {observations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveObservation(idx)}
                        className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-200 transition min-h-[32px] min-w-[32px] flex items-center justify-center"
                        title="Delete Observation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {!isItemCollapsed && (
                  <>

                {/* Level, Element & Trade pickers */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <LevelElementSelect
                    projectId={currentProjId}
                    selectedLevelId={obs.levelId}
                    selectedLevelName={obs.levelName}
                    selectedElementId={obs.elementId}
                    selectedElementName={obs.elementName}
                    onLevelChange={(lvlId, lvlName) => {
                      // Single atomic update
                      updateObservationField(idx, "levelId", lvlId);
                      updateObservationField(idx, "levelName", lvlName);
                    }}
                    onElementChange={(elemId, elemName, gridLoc) => {
                      // Single atomic update
                      updateObservationField(idx, "elementId", elemId);
                      updateObservationField(idx, "elementName", elemName);
                      if (gridLoc && !obs.gridLocation) {
                        updateObservationField(idx, "gridLocation", gridLoc);
                      }
                    }}
                  />

                  <TradeSubtradeSelect
                    companyId={currentCompId}
                    selectedTradeId={obs.tradeId}
                    selectedTradeName={obs.tradeName || obs.trade}
                    selectedSubtrade={obs.subtradeName || obs.subtrade}
                    onTradeChange={(trId, trName) => {
                      updateObservationField(idx, "tradeId", trId);
                      updateObservationField(idx, "tradeName", trName);
                      updateObservationField(idx, "trade", trName);
                    }}
                    onSubtradeChange={(subName) => {
                      updateObservationField(idx, "subtradeName", subName);
                      updateObservationField(idx, "subtrade", subName);
                    }}
                  />
                </div>

                {/* Grid location & Assignee */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Grid Location / Coordinate</span>
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
                      placeholder="e.g. Grid E / 9'-10', Axis C-D"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 font-mono focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Assigned Subcontractor / Person</span>
                    </label>
                    <input
                      type="text"
                      value={obs.assignedTo || obs.assignedSubcontractor || ""}
                      onChange={(e) =>
                        updateObservationField(
                          idx,
                          "assignedTo",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. Titan Steel / Mr. Wasiu"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Observed Site Condition Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>Observed Site Condition / Defect Description</span>
                      <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveObsIndexForSnippet(idx);
                        setIsSnippetDrawerOpen(true);
                      }}
                      className="text-[11px] text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Quick Remark Snippets</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={obsText}
                    onChange={(e) =>
                      updateObservationField(
                        idx,
                        "observationText",
                        e.target.value,
                      )
                    }
                    placeholder="Enter full multi-line details with newlines/bullets (e.g. * Insufficient lap length of BB bars on GRID F...)"
                    className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 leading-relaxed font-sans whitespace-pre-line focus:outline-none focus:border-brand-500 transition"
                    required
                  />
                </div>

                {/* Corrective Action Directive Textarea */}
                <div>
                  <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                    Corrective Action Directive / Instructions to Subcontractor
                  </label>
                  <textarea
                    rows={3}
                    value={directive}
                    onChange={(e) =>
                      updateObservationField(
                        idx,
                        "correctiveDirective",
                        e.target.value,
                      )
                    }
                    placeholder="e.g. Provide 480mm splice bars to increase lap length prior to casting."
                    className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-emerald-300 dark:border-emerald-900/40 text-slate-900 dark:text-slate-200 placeholder-slate-400 leading-relaxed font-sans whitespace-pre-line focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                {/* Photos & Evidence section */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      <span>
                        Attached Photographic Evidence ({photos.length})
                      </span>
                    </span>

                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer transition shadow-sm">
                      <Plus className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      <span>Attach Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e, idx)}
                      />
                    </label>
                  </div>

                  {photos.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {photos.map((p, pIdx) => {
                        const url =
                          typeof p === "string"
                            ? p
                            : p?.url || p?.thumbnailUrl || "";
                        if (!url) return null;

                        return (
                          <div
                            key={pIdx}
                            className="relative group w-24 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 shadow-sm"
                          >
                            <img
                              src={url}
                              alt={`Observation photo ${pIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />

                            {/* Overlay action buttons */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition">
                              <button
                                type="button"
                                onClick={() => setLightboxPhoto(url)}
                                className="p-1.5 rounded-lg bg-slate-800/90 text-slate-200 hover:text-white"
                                title="Enlarge photo"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openMarkupModal(idx, pIdx, url)}
                                className="p-1.5 rounded-lg bg-brand-600/90 text-white hover:bg-brand-500"
                                title="Annotate / Markup photo"
                              >
                                <PenTool className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(idx, pIdx)}
                                className="p-1.5 rounded-lg bg-red-600/90 text-white hover:bg-red-500"
                                title="Remove photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                </>
                )}
              </div>
            );
          })}
        </div>

        {/* Section 3: Dual Sign-off & Acknowledgement */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Dual Field Sign-off & Contractor Acknowledgement</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* QA/QC Inspector Column */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <span className="text-xs font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wider block">
                Originating QA/QC Inspector
              </span>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Inspector Name
                </label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Inspector Role / Title
                </label>
                <input
                  type="text"
                  value={inspectorRole}
                  onChange={(e) => setInspectorRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-2">
                <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Inspector Digital Signature
                </span>
                <SignaturePad
                  onSave={(dataUrl: string) => setEngineerSig(dataUrl)}
                  initialValue={engineerSig}
                  label="Inspector Signature"
                />
              </div>
            </div>

            {/* Contractor Acknowledgement Column */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                Contractor Representative Acknowledgement
              </span>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Contractor Representative Name
                </label>
                <input
                  type="text"
                  value={subconName}
                  onChange={(e) => setSubconName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Subcontractor Company
                </label>
                <input
                  type="text"
                  value={subconCompany}
                  onChange={(e) => setSubconCompany(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-2">
                <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Contractor Digital Signature
                </span>
                <SignaturePad
                  onSave={(dataUrl: string) => setSubconSig(dataUrl)}
                  initialValue={subconSig}
                  label="Contractor Signature"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate("/project/site-comments")}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 text-xs font-semibold transition shadow-sm"
          >
            Cancel & Return
          </button>

          <button
            type="submit"
            disabled={saving || !canEditComment}
            title={!canEditComment ? "You do not have permission to modify site observations" : undefined}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Updates...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Site Observation Updates</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Snippet Drawer */}
      <RemarkSnippetDrawer
        isOpen={isSnippetDrawerOpen}
        onClose={() => setIsSnippetDrawerOpen(false)}
        onSelectSnippet={(snip) => {
          const current =
            observations[activeObsIndexForSnippet]?.observationText || "";
          const newText = current ? `${current}\n${snip}` : snip;
          updateObservationField(
            activeObsIndexForSnippet,
            "observationText",
            newText,
          );
        }}
      />

      {/* Photo Markup Modal */}
      {markupModalOpen && (
        <PhotoMarkupModal
          isOpen={markupModalOpen}
          imageUrl={activeMarkupImage}
          onClose={() => setMarkupModalOpen(false)}
          onSaveAnnotatedImage={handleSaveAnnotatedPhoto}
        />
      )}

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-300">
                Evidence Inspection
              </span>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={lightboxPhoto}
              alt="Enlarged evidence"
              className="max-w-full max-h-[75vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
