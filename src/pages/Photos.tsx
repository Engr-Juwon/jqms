import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService, sortByNewestFirst } from "@/lib/db";
import { uploadMultiple, getThumbnail, getOptimized } from "@/lib/cloudinary";
import { syncMultiplePhotosToSiteGallery, syncPhotoToSiteGallery } from "@/lib/photoSync";
import { generateUniversalName } from "@/lib/naming";
import { FieldPhotoCapture, FieldPhotoMetadata } from "@/components/common/FieldPhotoCapture";
import { SitePhoto, PhotoCategory, ProjectLevel, MasterTrade } from "@/types";
import {
  Camera,
  Search,
  X,
  Sparkles,
  Upload,
  Plus,
  Trash2,
  Maximize2,
  Filter,
  Tag,
  MapPin,
  Clock,
  Layers,
  Briefcase,
  Building2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

export const Photos: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";
  const currentProjId = projectId || activeProject?.id || "";

  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const [levels, setLevels] = useState<ProjectLevel[]>([]);
  const [trades, setTrades] = useState<MasterTrade[]>([]);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [levelFilter, setLevelFilter] = useState<string>(
    activeProject?.currentLevelName || "ALL",
  );
  const prevLevelNameRef = useRef<string | undefined>(activeProject?.currentLevelName);
  useEffect(() => {
    if (activeProject?.currentLevelName !== prevLevelNameRef.current) {
      prevLevelNameRef.current = activeProject?.currentLevelName;
      setLevelFilter(activeProject?.currentLevelName || "ALL");
      if (!uploadLevelId && activeProject?.currentLevelId) {
        setUploadLevelId(activeProject.currentLevelId);
        setUploadFloor(activeProject.currentLevelName || "");
      }
    }
  }, [activeProject?.currentLevelName, activeProject?.currentLevelId]);
  const [tradeFilter, setTradeFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<SitePhoto | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload modal state
  const [uploadCategory, setUploadCategory] = useState<PhotoCategory>("PROGRESS");
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadLevelId, setUploadLevelId] = useState(activeProject?.currentLevelId || "");
  const [uploadFloor, setUploadFloor] = useState(activeProject?.currentLevelName || "");
  const [uploadElement, setUploadElement] = useState("");
  const [uploadTradeId, setUploadTradeId] = useState("");
  const [uploadTrade, setUploadTrade] = useState("");
  const [uploadSubtradeId, setUploadSubtradeId] = useState("");
  const [uploadSubtrade, setUploadSubtrade] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);

  // Load master data (Levels & Trades)
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [lvls, trds] = await Promise.all([
          currentProjId ? dbService.getLevels(currentProjId, currentCompId).catch(() => []) : Promise.resolve([]),
          currentCompId ? dbService.getTrades(currentCompId).catch(() => []) : Promise.resolve([]),
        ]);
        if (lvls && lvls.length > 0) setLevels(lvls);
        if (trds && trds.length > 0) setTrades(trds);
      } catch (e) {
        console.error("Failed to load master data in Photos:", e);
      }
    };
    fetchMasterData();
  }, [currentProjId, currentCompId]);

  const loadRequestId = useRef(0);

  const loadPhotos = async () => {
    const requestId = ++loadRequestId.current;
    const isLatest = () => requestId === loadRequestId.current;
    setIsLoading(true);
    setLoadError(false);
    try {
      const explicitPhotos = await dbService.getSitePhotos(
        currentProjId,
        currentCompId,
      );

      // Gather photos attached across all modules
      const [comments, ncrs, inspections, mars, rfis, weeklyReports] = await Promise.all([
        dbService.getSiteComments(currentProjId, currentCompId).catch(() => []),
        dbService.getNCRs(currentProjId, currentCompId).catch(() => []),
        dbService.getInspections(currentProjId, currentCompId).catch(() => []),
        dbService.getMARs(currentProjId, currentCompId).catch(() => []),
        dbService.getRFIs(currentProjId, currentCompId).catch(() => []),
        dbService.getWeeklyReports(currentProjId, currentCompId).catch(() => []),
      ]);

      const gathered: SitePhoto[] = [];

      // 1. Site Comments Photos
      comments.forEach((c) => {
        const inspector =
          c.raisedByName ||
          (typeof c.raisedBy === "object" ? c.raisedBy?.name : undefined) ||
          "QA/QC Engineer";
        const createdIso =
          typeof c.createdAt === "number"
            ? new Date(c.createdAt).toISOString()
            : String(c.createdAt || new Date().toISOString());

        c.observations?.forEach((obs, obsIdx) => {
          const obsComment =
            obs.comments || obs.observationText || obs.fieldObservation || "";
          const trade = obs.tradeName || obs.trade || "";
          const subtrade = obs.subtradeName || obs.subtrade || "";
          const level = obs.levelName || c.locationDescription || "";
          const element = obs.elementName || obs.structuralElement || "";

          obs.photos?.forEach((p: any, i: number) => {
            const photoUrl =
              typeof p === "string" ? p : p?.url || p?.thumbnailUrl || "";
            const caption =
              typeof p === "object" && p?.caption
                ? p.caption
                : `${c.reportNumber || "QC/COMMENTS"}: ${obsComment}`;
            if (!photoUrl) return;

            gathered.push({
              id: `photo-comment-${c.id}-${obsIdx}-${i}`,
              projectId: currentProjId,
              companyId: currentCompId,
              url: photoUrl,
              thumbnailUrl:
                typeof p === "object" && p?.thumbnailUrl
                  ? p.thumbnailUrl
                  : getThumbnail(photoUrl, 250),
              caption,
              sourceModule: "SiteComments",
              sourceId: c.id,
              category: "QUALITY_DEFECT",
              floorLevel: level,
              levelId: obs.levelId,
              levelName: level,
              elementId: obs.elementId,
              elementName: element,
              tradeId: obs.tradeId,
              tradeName: trade,
              subtradeId: obs.subtradeId,
              subtradeName: subtrade,
              uploadedBy: inspector,
              uploadedAt: createdIso,
            });
          });
        });
      });

      // 2. NCR Photos (beforePhotos, afterPhotos, photos, evidencePhotos)
      ncrs.forEach((n) => {
        const uploader =
          n.raisedByName ||
          (typeof n.raisedBy === "object" ? n.raisedBy?.name : "QA/QC Inspector") ||
          "QA/QC Inspector";
        const createdIso = String(n.createdAt || new Date().toISOString());
        const nLevel = n.locationLevel || n.levelName || (n as any).location || "";
        const nTrade = n.tradeName || n.trade || "";
        const nSubtrade = n.subtradeName || (n as any).subtrade || "";
        const nElement = n.elementName || "";

        // beforePhotos
        (n.beforePhotos || []).forEach((p: any, i: number) => {
          const url = typeof p === "string" ? p : p?.url;
          if (!url) return;
          gathered.push({
            id: `photo-ncr-before-${n.id}-${i}`,
            projectId: currentProjId,
            companyId: currentCompId,
            url,
            thumbnailUrl: getThumbnail(url, 250),
            caption:
              typeof p === "object" && p?.caption
                ? p.caption
                : `NCR ${n.ncrNumber || ""}: Defect Photo - ${n.title || ""}`,
            sourceModule: "NCR",
            sourceId: n.id,
            category: "QUALITY_DEFECT",
            floorLevel: nLevel,
            levelId: n.levelId,
            levelName: nLevel,
            elementId: n.elementId,
            elementName: nElement,
            tradeId: n.tradeId,
            tradeName: nTrade,
            subtradeId: n.subtradeId,
            subtradeName: nSubtrade,
            uploadedBy: uploader,
            uploadedAt: createdIso,
          });
        });

        // afterPhotos
        (n.afterPhotos || []).forEach((p: any, i: number) => {
          const url = typeof p === "string" ? p : p?.url;
          if (!url) return;
          gathered.push({
            id: `photo-ncr-after-${n.id}-${i}`,
            projectId: currentProjId,
            companyId: currentCompId,
            url,
            thumbnailUrl: getThumbnail(url, 250),
            caption:
              typeof p === "object" && p?.caption
                ? p.caption
                : `NCR ${n.ncrNumber || ""}: Rectification Photo - ${n.title || ""}`,
            sourceModule: "NCR",
            sourceId: n.id,
            category: "PROGRESS",
            floorLevel: nLevel,
            levelId: n.levelId,
            levelName: nLevel,
            elementId: n.elementId,
            elementName: nElement,
            tradeId: n.tradeId,
            tradeName: nTrade,
            subtradeId: n.subtradeId,
            subtradeName: nSubtrade,
            uploadedBy: uploader,
            uploadedAt: createdIso,
          });
        });

        // raw photos / evidence
        (n.photos || []).forEach((p: any, i: number) => {
          const url = typeof p === "string" ? p : p?.url;
          if (!url) return;
          gathered.push({
            id: `photo-ncr-raw-${n.id}-${i}`,
            projectId: currentProjId,
            companyId: currentCompId,
            url,
            thumbnailUrl: getThumbnail(url, 250),
            caption: `NCR ${n.ncrNumber || ""}: ${n.title || "Defect record"}`,
            sourceModule: "NCR",
            sourceId: n.id,
            category: "QUALITY_DEFECT",
            floorLevel: nLevel,
            levelId: n.levelId,
            levelName: nLevel,
            elementId: n.elementId,
            elementName: nElement,
            tradeId: n.tradeId,
            tradeName: nTrade,
            subtradeId: n.subtradeId,
            subtradeName: nSubtrade,
            uploadedBy: uploader,
            uploadedAt: createdIso,
          });
        });
      });

      // 3. Inspection Checkpoint Photos
      inspections.forEach((ins) => {
        const insLevel = ins.levelName || (ins as any).floor || "";
        const insTrade = (ins as any).tradeName || ins.trade || "";
        const insSubtrade = (ins as any).subtradeName || (ins as any).subtrade || "";
        const insElement = ins.elementName || "";

        ins.items?.forEach((item, itemIdx) => {
          item.photos?.forEach((url: string, i: number) => {
            if (!url) return;
            gathered.push({
              id: `photo-insp-${ins.id}-${itemIdx}-${i}`,
              projectId: currentProjId,
              companyId: currentCompId,
              url,
              thumbnailUrl: getThumbnail(url, 250),
              caption: `Inspection ${ins.inspectionNumber || ""}: ${item.label}`,
              sourceModule: "Inspections",
              sourceId: ins.id,
              category: "PROGRESS",
              floorLevel: insLevel,
              levelId: ins.levelId,
              levelName: insLevel,
              elementId: ins.elementId,
              elementName: insElement,
              tradeId: ins.tradeId,
              tradeName: insTrade,
              subtradeId: (ins as any).subtradeId,
              subtradeName: insSubtrade,
              uploadedBy: ins.inspector?.name || "QA/QC Inspector",
              uploadedAt: String(ins.createdAt || new Date().toISOString()),
            });
          });
        });
      });

      // 4. MAR Photos & Attachments
      mars.forEach((m) => {
        (m.attachments || []).forEach((url: string, i: number) => {
          if (!url || typeof url !== "string") return;
          const isImg =
            url.match(/\.(jpeg|jpg|gif|png|webp|avif)($|\?)/i) ||
            url.includes("cloudinary") ||
            url.includes("image");
          if (!isImg) return;
          gathered.push({
            id: `photo-mar-${m.id}-${i}`,
            projectId: currentProjId,
            companyId: currentCompId,
            url,
            thumbnailUrl: getThumbnail(url, 250),
            caption: `MAR ${m.marNumber || ""}: ${m.technicalDescription || m.title || "Sample photo"}`,
            sourceModule: "MAR",
            sourceId: m.id,
            category: "MATERIAL",
            tradeId: (m as any).tradeId,
            tradeName: m.tradeName || m.trade,
            subtradeId: (m as any).subtradeId,
            subtradeName: (m as any).subtradeName || (m as any).subtrade,
            uploadedBy: m.submittedByName || "QA/QC Material Inspector",
            uploadedAt: String(m.createdAt || new Date().toISOString()),
          });
        });
      });

      // 5. RFI Photos & Attachments
      rfis.forEach((r) => {
        const rLevel = r.locationLevel || r.levelName || (r as any).location || "";
        (r.attachments || []).forEach((url: string, i: number) => {
          if (!url || typeof url !== "string") return;
          const isImg =
            url.match(/\.(jpeg|jpg|gif|png|webp|avif)($|\?)/i) ||
            url.includes("cloudinary") ||
            url.includes("image");
          if (!isImg) return;
          gathered.push({
            id: `photo-rfi-${r.id}-${i}`,
            projectId: currentProjId,
            companyId: currentCompId,
            url,
            thumbnailUrl: getThumbnail(url, 250),
            caption: `RFI ${r.rfiNumber || ""}: ${r.title || "Technical query reference"}`,
            sourceModule: "RFI",
            sourceId: r.id,
            category: "PROGRESS",
            floorLevel: rLevel,
            levelId: r.levelId,
            levelName: rLevel,
            tradeId: (r as any).tradeId,
            tradeName: r.tradeName || r.discipline,
            subtradeId: (r as any).subtradeId,
            subtradeName: (r as any).subtradeName || (r as any).subtrade,
            uploadedBy: r.raisedByName || r.raisedBy?.name || "Technical Lead",
            uploadedAt: String(r.createdAt || new Date().toISOString()),
          });
        });
      });

      // 6. Weekly Report Progress Photos & Layouts
      weeklyReports.forEach((wr) => {
        const uploader =
          typeof wr.preparedBy === "string"
            ? wr.preparedBy
            : (wr.preparedBy as any)?.name || "QA/QC Lead";
        const createdIso = String(wr.createdAt || new Date().toISOString());

        (wr.pictorialUrls || []).forEach((p: any, i: number) => {
          const url = typeof p === "string" ? p : p?.url;
          if (!url) return;
          gathered.push({
            id: `photo-wr-pic-${wr.id}-${i}`,
            projectId: currentProjId,
            companyId: currentCompId,
            url,
            thumbnailUrl: getThumbnail(url, 250),
            caption:
              typeof p === "object" && p?.caption
                ? p.caption
                : `Weekly Report W${wr.weekNumber || ""}: Progress photo #${i + 1}`,
            sourceModule: "WeeklyReport",
            sourceId: wr.id,
            category: "PROGRESS",
            uploadedBy: uploader,
            uploadedAt: createdIso,
          });
        });
      });

      // Deduplicate by URL
      const map = new Map<string, SitePhoto>();
      [...explicitPhotos, ...gathered].forEach((p) => {
        if (p.url && !map.has(p.url)) map.set(p.url, p);
      });

      if (isLatest()) {
        setPhotos(sortByNewestFirst(Array.from(map.values())));
      }
    } catch (err) {
      console.error("Failed to load photos:", err);
      if (isLatest()) setLoadError(true);
    } finally {
      if (isLatest()) {
        setIsLoading(false);
        setLastLoadedAt(new Date());
      }
    }
  };

  useEffect(() => {
    loadPhotos();
  }, [currentProjId, currentCompId]);

  // Handle Direct Upload Submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    const toastId = toast.loading(`Uploading ${uploadFiles.length} photo(s) to Cloudinary...`);

    try {
      const standardizedFiles = uploadFiles.map((file) => {
        const ext = file.name.split(".").pop() || "jpg";
        const universalName = generateUniversalName(
          activeProject?.code || currentProjId,
          "PHOTO",
          { extension: ext }
        );
        return new File([file], universalName, { type: file.type });
      });
      const results = await uploadMultiple(standardizedFiles, `jqms/photos/${currentProjId}`);

      const newPhotosToSync = results.map((res, i) => {
        const photoCode =
          standardizedFiles[i]?.name.replace(/\.[^/.]+$/, "") ||
          generateUniversalName(activeProject?.code || currentProjId, "PHOTO");
        return {
          projectId: currentProjId,
          companyId: currentCompId,
          url: res.url,
          thumbnailUrl: getThumbnail(res.url, 250),
          caption: uploadCaption
            ? `${photoCode} - ${uploadCaption} (${i + 1})`
            : `${photoCode} - Site Record ${new Date().toLocaleDateString()}`,
          floorLevel: uploadFloor || undefined,
          levelId: uploadLevelId || undefined,
          levelName: uploadFloor || undefined,
          elementName: uploadElement || undefined,
          category: uploadCategory,
          tradeName: uploadTrade || undefined,
          tradeId: uploadTradeId || undefined,
          subtradeName: uploadSubtrade || undefined,
          subtradeId: uploadSubtradeId || undefined,
          uploadedBy: currentUser?.fullName || "QA/QC Inspector",
          uploaderRole: currentUser?.role,
          sourceModule: "DirectUpload" as const,
          sourceId: `upload-${Date.now()}`,
        };
      });

      await syncMultiplePhotosToSiteGallery(newPhotosToSync);

      toast.success(`${newPhotosToSync.length} photo(s) uploaded and saved to gallery!`, {
        id: toastId,
      });

      setShowUploadModal(false);
      setUploadFiles([]);
      setUploadCaption("");
      setUploadFloor("");
      setUploadLevelId("");
      setUploadElement("");
      setUploadTrade("");
      setUploadTradeId("");
      setUploadSubtrade("");
      setUploadSubtradeId("");
      loadPhotos();
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(`Upload error: ${err?.message || "Failed to upload"}`, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Field Camera Direct Snap
  const handleCameraSnap = async (file: File, meta: FieldPhotoMetadata) => {
    setIsUploading(true);
    const toastId = toast.loading("Uploading camera snapshot to Cloudinary...");

    try {
      const universalName = generateUniversalName(
        activeProject?.code || currentProjId,
        "PHOTO",
        { extension: "jpg" }
      );
      const renamedFile = new File([file], universalName, {
        type: file.type || "image/jpeg",
      });
      const results = await uploadMultiple([renamedFile], `jqms/photos/${currentProjId}`);
      const res = results[0];

      const photoCode = universalName.replace(/\.[^/.]+$/, "");
      const snapCaption = `${photoCode} - Field Camera Capture (${new Date().toLocaleString()})`;

      await syncPhotoToSiteGallery({
        projectId: currentProjId,
        companyId: currentCompId,
        url: res.url,
        thumbnailUrl: getThumbnail(res.url, 250),
        caption: snapCaption,
        floorLevel: uploadFloor || undefined,
        category: "PROGRESS",
        tradeName: uploadTrade || "Site QA/QC",
        uploadedBy: currentUser?.fullName || "QA/QC Inspector",
        uploaderRole: currentUser?.role,
        sourceModule: "DirectUpload",
        sourceId: `snap-${Date.now()}`,
      });

      toast.success("Camera photo captured and added to gallery!", { id: toastId });
      loadPhotos();
    } catch (err: any) {
      console.error("Camera capture failed:", err);
      toast.error("Camera capture failed", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // Filter photos
  const filtered = sortByNewestFirst(
    photos.filter((p) => {
      const matchCat = categoryFilter === "ALL" || p.category === categoryFilter;
      const matchLevel =
        levelFilter === "ALL" ||
        p.floorLevel === levelFilter ||
        p.levelName === levelFilter ||
        p.levelId === levelFilter;
      const matchTrade =
        tradeFilter === "ALL" ||
        p.tradeName === tradeFilter ||
        p.tradeId === tradeFilter;
      const matchSearch =
        (
          (p.caption || "") +
          " " +
          (p.tradeName || "") +
          " " +
          (p.subtradeName || "") +
          " " +
          (p.floorLevel || "") +
          " " +
          (p.elementName || "") +
          " " +
          (p.sourceModule || "")
        )
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      return matchCat && matchLevel && matchTrade && matchSearch;
    }),
  );

  // Selected trade's subtrades for modal
  const currentSelectedTradeObj = trades.find(
    (t) => t.id === uploadTradeId || t.name === uploadTrade,
  );
  const currentSubtrades = currentSelectedTradeObj?.subtrades || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Camera className="w-4 h-4" />
            <span>Centralized Evidence Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Universal Site Photo Gallery
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Auto-synchronized across Site Comments, NCRs, Inspections, Permits to Pour, and Raw Material Deliveries
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <FieldPhotoCapture
            onCapture={handleCameraSnap}
            folder={`jqms/photos/${currentProjId}`}
            label="Camera Snap"
            buttonClassName="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          />

          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload New Photos</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search caption, trade, subtrade, floor..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          {/* Level Filter Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <MapPin size={14} className="text-slate-400" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Floor Levels</option>
              {levels.map((lvl) => (
                <option key={lvl.id} value={lvl.name}>
                  {lvl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Trade Filter Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <Briefcase size={14} className="text-slate-400" />
            <select
              value={tradeFilter}
              onChange={(e) => setTradeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Trades</option>
              {trades.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
          {[
            "ALL",
            "QUALITY_DEFECT",
            "PROGRESS",
            "POUR",
            "MATERIAL",
            "SAFETY",
          ].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                categoryFilter === cat
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {cat.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Load status */}
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 text-xs font-medium"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-brand-600 dark:text-brand-400" />
            <span className="text-slate-600 dark:text-slate-300">
              Loading photos...
            </span>
          </>
        ) : loadError ? (
          <>
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-600 dark:text-red-400">
              Failed to load photos.
            </span>
            <button
              onClick={() => loadPhotos()}
              className="underline text-brand-600 dark:text-brand-400"
            >
              Retry
            </button>
          </>
        ) : lastLoadedAt ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-600 dark:text-slate-300">
              Loaded {photos.length} photo(s) at {lastLoadedAt.toLocaleTimeString()}
            </span>
          </>
        ) : null}
      </div>

      {/* Photos Grid */}
      {isLoading && photos.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl">
          <Camera className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">
            No Site Photos Found
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Photos uploaded to Site Comments, NCRs, Inspections, and Pour Permits are automatically indexed here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((photo) => (
            <div
              key={photo.id || photo.url}
              onClick={() => setSelectedPhoto(photo)}
              className="group rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 overflow-hidden shadow-sm dark:shadow-xl cursor-pointer transition flex flex-col justify-between"
            >
              <div className="h-48 relative overflow-hidden bg-slate-100 dark:bg-slate-950">
                <img
                  src={getThumbnail(photo.url, 400)}
                  alt={photo.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-white font-mono">
                  {photo.sourceModule || "Gallery"}
                </div>
                <div
                  className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                    photo.category === "QUALITY_DEFECT"
                      ? "bg-red-500 text-white"
                      : photo.category === "POUR"
                      ? "bg-amber-500 text-white"
                      : photo.category === "MATERIAL"
                      ? "bg-purple-500 text-white"
                      : "bg-brand-600 text-white"
                  }`}
                >
                  {photo.category}
                </div>
              </div>

              <div className="p-3.5 space-y-2 text-xs">
                <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">
                  {photo.caption}
                </p>

                {/* Trade & Subtrade Badge */}
                {(photo.tradeName || photo.subtradeName) && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {photo.tradeName && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                        {photo.tradeName}
                      </span>
                    )}
                    {photo.subtradeName && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {photo.subtradeName}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="truncate max-w-[120px]">
                    {photo.floorLevel || photo.levelName || "General Site"}
                  </span>
                  <span>{new Date(photo.uploadedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Photos Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Upload className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <span>Upload Media to Universal Gallery</span>
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Select Image File(s) *
                </label>
                <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 flex flex-col items-center justify-center gap-2">
                  <Camera className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                  <div className="text-center">
                    {uploadFiles.length > 0 ? (
                      <span className="font-semibold text-brand-600 dark:text-brand-300">
                        {uploadFiles.length} file(s) selected
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400">
                        JPEG, PNG, WEBP (Auto-compressed to &lt;1MB)
                      </span>
                    )}
                  </div>
                  <label className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg cursor-pointer font-semibold">
                    <span>Browse Files</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      required
                      onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as PhotoCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="PROGRESS">Progress Record</option>
                    <option value="QUALITY_DEFECT">Defect Evidence</option>
                    <option value="POUR">Permit to Pour</option>
                    <option value="MATERIAL">Material Delivery</option>
                    <option value="SAFETY">Safety Inspection</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Floor Level
                  </label>
                  {levels.length > 0 ? (
                    <select
                      value={uploadLevelId}
                      onChange={(e) => {
                        setUploadLevelId(e.target.value);
                        const match = levels.find((l) => l.id === e.target.value);
                        setUploadFloor(match ? match.name : "");
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="">-- Select Project Level --</option>
                      {levels.map((lvl) => (
                        <option key={lvl.id} value={lvl.id}>
                          {lvl.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={uploadFloor}
                      onChange={(e) => setUploadFloor(e.target.value)}
                      placeholder="e.g. Ground Floor / Level 2"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Trade Sector
                  </label>
                  {trades.length > 0 ? (
                    <select
                      value={uploadTradeId}
                      onChange={(e) => {
                        setUploadTradeId(e.target.value);
                        const match = trades.find((t) => t.id === e.target.value);
                        setUploadTrade(match ? match.name : "");
                        setUploadSubtradeId("");
                        setUploadSubtrade("");
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="">-- Select Trade --</option>
                      {trades.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={uploadTrade}
                      onChange={(e) => setUploadTrade(e.target.value)}
                      placeholder="e.g. Structural Rebar / Formwork"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Subtrade Sector
                  </label>
                  {currentSubtrades.length > 0 ? (
                    <select
                      value={uploadSubtrade}
                      onChange={(e) => {
                        setUploadSubtrade(e.target.value);
                        setUploadSubtradeId(e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="">-- Select Subtrade --</option>
                      {currentSubtrades.map((st: any) => {
                        const val =
                          typeof st === "string" ? st : st.name || st.id || "";
                        return (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={uploadSubtrade}
                      onChange={(e) => setUploadSubtrade(e.target.value)}
                      placeholder="e.g. Beam B2 Rebar"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Structural Element (Optional)
                </label>
                <input
                  type="text"
                  value={uploadElement}
                  onChange={(e) => setUploadElement(e.target.value)}
                  placeholder="e.g. Column C-14 / Transfer Beam TB-02"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Caption / Description
                </label>
                <input
                  type="text"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="e.g. Beam B2-04 rebar reinforcement before casting"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || uploadFiles.length === 0}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold shadow-lg transition"
                >
                  {isUploading ? "Uploading..." : "Save to Gallery"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex-1 bg-black flex items-center justify-center p-4 min-h-[300px]">
              <img
                src={getOptimized(selectedPhoto.url, 1600)}
                alt="Full view"
                className="max-h-[70vh] rounded-xl object-contain"
              />
            </div>

            <div className="w-full md:w-80 p-6 space-y-4 text-xs bg-slate-50 dark:bg-slate-950 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 overflow-y-auto">
              <div>
                <span className="text-[10px] font-mono text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider">
                  {selectedPhoto.category} • {selectedPhoto.sourceModule}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {selectedPhoto.caption}
                </h3>
              </div>

              <div className="space-y-2 divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Floor Level:</span>
                  <span className="font-semibold">
                    {selectedPhoto.floorLevel || selectedPhoto.levelName || "General Site"}
                  </span>
                </div>
                {selectedPhoto.elementName && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Element Tag:</span>
                    <span className="font-semibold">
                      {selectedPhoto.elementName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Trade:</span>
                  <span className="font-semibold">
                    {selectedPhoto.tradeName || "General"}
                  </span>
                </div>
                {selectedPhoto.subtradeName && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Subtrade:</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      {selectedPhoto.subtradeName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Uploaded By:</span>
                  <span className="font-semibold">
                    {selectedPhoto.uploadedBy}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Timestamp:</span>
                  <span className="font-mono text-[11px]">
                    {new Date(selectedPhoto.uploadedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Photos;
