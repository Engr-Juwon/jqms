import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { dbService } from "@/lib/db";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  StructuralElement,
  InspectionRequest,
  NonConformanceReport,
  ConcreteCubeSample,
  SitePhoto,
  SiteCommentReport,
  ProjectLevel,
  WorkPackage,
  Gridline,
} from "@/types";
import { ElementViewer } from "@/components/registry/ElementViewer";
import { ElementModal } from "@/components/registry/ElementModal";
import {
  getOrCalculateVolume,
  getOrCalculateFormworkArea,
} from "@/lib/elementCalculations";
import { isQAQCUser } from "@/lib/permissions";
import { toast } from "react-hot-toast";
import {
  Box,
  Layers,
  ArrowLeft,
  Calendar,
  FlaskConical,
  AlertOctagon,
  ClipboardCheck,
  HardHat,
  Camera,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Ruler,
  Building2,
  Briefcase,
  AlertTriangle,
  FileText,
  Clock,
  ShieldCheck,
  Eye,
  Tag,
  Hammer,
  Pencil,
  QrCode,
  ShieldAlert,
} from "lucide-react";
import { ElementQRTagsModal } from "@/components/registry/ElementQRTagsModal";

const LIFECYCLE_STAGES = [
  { key: "PENDING", label: "Planned", desc: "Design & Specs" },
  { key: "REBAR_IN_PROGRESS", label: "Rebar", desc: "Reinforcement Fix" },
  { key: "FORMWORK_IN_PROGRESS", label: "Formwork", desc: "Shuttering & Ties" },
  { key: "REBAR_INSPECTED", label: "Pre-Pour QA", desc: "Hold-Point Signoff" },
  { key: "POURED", label: "Poured", desc: "In-Situ Casting" },
  { key: "APPROVED", label: "QA Accepted", desc: "Curing Passed" },
];

export const ElementDetail: React.FC = () => {
  const { id, elementId, projectId } = useParams<{
    id?: string;
    elementId?: string;
    projectId?: string;
  }>();
  const targetElementId = id || elementId;
  const navigate = useNavigate();

  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentProjId = projectId || activeProject?.id || "proj-default";
  const currentCompId =
    currentUser?.companyId ||
    company?.id ||
    activeProject?.companyId ||
    "comp-default";

  const [element, setElement] = useState<StructuralElement | null>(null);
  const [inspections, setInspections] = useState<InspectionRequest[]>([]);
  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [cubes, setCubes] = useState<ConcreteCubeSample[]>([]);
  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const [siteComments, setSiteComments] = useState<SiteCommentReport[]>([]);
  const [levels, setLevels] = useState<ProjectLevel[]>([]);
  const [packages, setPackages] = useState<WorkPackage[]>([]);
  const [gridlines, setGridlines] = useState<Gridline[]>([]);
  const [loading, setLoading] = useState(true);
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const handleSaveEditedElement = async (
    payload: Partial<StructuralElement>,
    editingId: string | null,
  ) => {
    if (!isQAQCUser(currentUser)) {
      toast.error("Unauthorized: Only QA/QC personnel are permitted to edit element properties.");
      return;
    }
    if (!element) return;
    try {
      const updated: StructuralElement = {
        ...element,
        ...payload,
        id: editingId || element.id,
        projectId: currentProjId,
        companyId: currentCompId,
        updatedAt: new Date().toISOString(),
      } as StructuralElement;

      await dbService.saveElement(updated);
      setElement(updated);
      setShowEditModal(false);
      toast.success(`Element "${updated.elementName}" updated.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update element properties.");
    }
  };

  useEffect(() => {
    async function load() {
      if (!currentProjId) return;
      setLoading(true);
      try {
        const [
          allElems,
          allInsps,
          allNcrs,
          allCubes,
          allPhotos,
          allComments,
          allLevels,
          allPackages,
          allGridlines,
        ] = await Promise.all([
          dbService.getElements(currentProjId, currentCompId).catch(() => []),
          dbService
            .getInspections(currentProjId, currentCompId)
            .catch(() => []),
          dbService.getNCRs(currentProjId, currentCompId).catch(() => []),
          dbService
            .getCubeSamples(currentProjId, currentCompId)
            .catch(() => []),
          dbService.getSitePhotos(currentProjId, currentCompId).catch(() => []),
          dbService
            .getSiteComments(currentProjId, currentCompId)
            .catch(() => []),
          dbService.getLevels(currentProjId, currentCompId).catch(() => []),
          dbService
            .getWorkPackages(currentProjId, currentCompId)
            .catch(() => []),
          dbService.getGridlines(currentProjId, currentCompId).catch(() => []),
        ]);

        setLevels(allLevels);
        setPackages(allPackages);
        setGridlines(allGridlines);

        // Find element by target id or element name
        const match =
          allElems.find((e: StructuralElement) => e.id === targetElementId) ||
          allElems.find(
            (e: StructuralElement) =>
              e.elementName?.toLowerCase().trim() ===
              targetElementId?.toLowerCase().trim(),
          ) ||
          allElems[0] ||
          null;

        setElement(match);

        if (match) {
          const matchName = match.elementName?.toLowerCase().trim() || "";

          // Filter linked inspections
          setInspections(
            allInsps.filter(
              (i: InspectionRequest) =>
                i.elementId === match.id ||
                (i.elementName &&
                  i.elementName.toLowerCase().includes(matchName)),
            ),
          );

          // Filter linked NCRs
          setNcrs(
            allNcrs.filter(
              (n: NonConformanceReport) =>
                n.elementId === match.id ||
                n.structuralElementId === match.id ||
                n.elementIds?.includes(match.id) ||
                n.elementNames?.some(
                  (name) => name.toLowerCase() === matchName,
                ) ||
                (n.elementName &&
                  n.elementName.toLowerCase().includes(matchName)),
            ),
          );

          // Filter linked Cube Tests
          setCubes(
            allCubes.filter(
              (c: ConcreteCubeSample) =>
                c.elementId === match.id ||
                (c.elementName &&
                  c.elementName.toLowerCase().includes(matchName)),
            ),
          );

          // Filter linked Photos
          setPhotos(
            allPhotos.filter(
              (p: SitePhoto) =>
                (p.elementName &&
                  p.elementName.toLowerCase().includes(matchName)) ||
                (p.sourceId && p.sourceId.includes(match.id)),
            ),
          );

          // Filter linked Site Comments
          const linkedComments: SiteCommentReport[] = [];
          allComments.forEach((c) => {
            const hasObs = c.observations?.some(
              (obs) =>
                obs.elementId === match.id ||
                (obs.structuralElement &&
                  obs.structuralElement.toLowerCase().includes(matchName)),
            );
            if (hasObs) {
              linkedComments.push(c);
            }
          });
          setSiteComments(linkedComments);
        }
      } catch (err) {
        console.error("Failed to load element passport:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentProjId, currentCompId, targetElementId]);

  // Safe Dimension Parsing
  const dimL = element?.length || element?.dimensions?.length || 0;
  const dimW = element?.width || element?.dimensions?.width || 0;
  const dimH = element?.height || element?.dimensions?.height || 0;
  const dimDia =
    element?.diameter || (element?.dimensions as any)?.diameter || 0;

  const levelName = useMemo(() => {
    if (!element) return "Level";
    const found = levels.find((l) => l.id === element.levelId);
    return found?.name || element.levelName || "General Floor Level";
  }, [element, levels]);

  const packageName = useMemo(() => {
    if (!element) return "General Package";
    const found = packages.find((p) => p.id === element.workPackageId);
    return found?.name || element.workPackageName || "Superstructure Works";
  }, [element, packages]);

  // QA Defect Hold & Cube Status
  const openNCRs = useMemo(() => {
    return ncrs.filter(
      (n) => n.status !== "CLOSED" && n.status !== "CANCELLED",
    );
  }, [ncrs]);

  const cubeCompliance = useMemo(() => {
    if (cubes.length === 0) return null;
    const failed = cubes.some(
      (c) => c.status === "REJECTED" || c.ncrGenerated === true,
    );
    const has28Day = cubes.some(
      (c) =>
        c.testAges?.includes(28) ||
        Boolean(c.day28Date) ||
        Boolean(c.day28Results?.length) ||
        Boolean(c.tests?.day28),
    );
    return {
      total: cubes.length,
      failed,
      has28Day,
    };
  }, [cubes]);

  const currentStageIndex = useMemo(() => {
    switch (element?.status) {
      case "APPROVED":
        return 5;
      case "POURED":
        return 4;
      case "REBAR_INSPECTED":
      case "READY_FOR_CASTING":
        return 3;
      case "FORMWORK_IN_PROGRESS":
        return 2;
      case "REBAR_IN_PROGRESS":
        return 1;
      case "PENDING":
      default:
        return 0;
    }
  }, [element?.status]);

  const isQAQC = isQAQCUser(currentUser);

  if (loading) {
    return (
      <div className="p-16 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Loading Structural Element Quality Passport...
        </p>
      </div>
    );
  }

  if (!isQAQC) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-red-500/30 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            QA/QC Access Restricted
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Structural Element Details and Quality Passports are strictly restricted to QA/QC personnel only.
          </p>
          <p className="text-xs text-slate-500">
            Your current role is{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {currentUser?.role || "Site Engineer"}
            </span>.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate("/project/dashboard")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow"
            >
              <span>Return to Executive Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!element) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 max-w-xl mx-auto mt-8 shadow-sm dark:shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center mx-auto border border-slate-200 dark:border-slate-800">
          <Box className="w-8 h-8 text-slate-400 dark:text-slate-600" />
        </div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white">
          Element Passport Not Found
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The requested structural element ID{" "}
          <code className="font-mono text-brand-600 dark:text-brand-400">{targetElementId}</code>{" "}
          could not be found in this project registry.
        </p>
        <button
          onClick={() => navigate("/project/elements")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Element Registry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* ─── Top Header & Title Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/project/elements")}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
            title="Back to Element Registry"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-0.5">
              <span className="font-bold">PASSPORT RECORD: {element.id}</span>
              <span>•</span>
              <span className="text-slate-500 dark:text-slate-400">
                GRID {element.grid || element.gridAxis || "N/A"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>{element.elementName}</span>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                  element.status === "APPROVED"
                    ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                    : element.status === "REJECTED"
                      ? "bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40"
                      : element.status === "POURED"
                        ? "bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40"
                        : element.status === "REBAR_INSPECTED"
                          ? "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                }`}
              >
                {element.status.replace(/_/g, " ")}
              </span>
            </h1>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowQRModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            title="Print Physical Adhesive QR Asset Tag"
          >
            <QrCode className="w-4 h-4 text-brand-400 dark:text-brand-600" />
            <span>Print QR Tag</span>
          </button>

          {isQAQC && (
            <button
              onClick={() => setShowEditModal(true)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-sm transition flex items-center gap-1.5"
              title="Edit Structural Element Properties"
            >
              <Pencil className="w-4 h-4 text-amber-500" />
              <span>Edit Element</span>
            </button>
          )}

          <button
            onClick={() => setShow3DViewer(true)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-cyan-700 dark:text-cyan-300 border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-sm transition flex items-center gap-1.5"
          >
            <Box className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>3D Element Twin</span>
          </button>

          <Link
            to={`/project/inspections/create?elementId=${element.id}&elementName=${encodeURIComponent(
              element.elementName,
            )}&locationLevel=${encodeURIComponent(levelName)}&gridLine=${encodeURIComponent(
              element.grid || element.gridAxis || "",
            )}`}
            className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition flex items-center gap-1.5"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Request Inspection</span>
          </Link>

          <Link
            to={`/project/site-comments/create?elementId=${element.id}&elementName=${encodeURIComponent(
              element.elementName,
            )}&locationLevel=${encodeURIComponent(levelName)}&gridLine=${encodeURIComponent(
              element.grid || element.gridAxis || "",
            )}`}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 dark:bg-amber-600/20 hover:bg-amber-600 text-amber-700 dark:text-amber-300 hover:text-white border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Camera className="w-4 h-4" />
            <span>Observation / Snag</span>
          </Link>

          <Link
            to={`/project/permit-to-pour/create?elementId=${element.id}&elementName=${encodeURIComponent(
              element.elementName,
            )}`}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-600/20 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5"
          >
            <HardHat className="w-4 h-4" />
            <span>Permit to Pour</span>
          </Link>
        </div>
      </div>

      {/* ─── Statutory Defect Hold Banner ─── */}
      {openNCRs.length > 0 && (
        <div className="bg-red-500/10 dark:bg-red-500/15 border-2 border-red-500/30 dark:border-red-500/40 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-red-900 dark:text-red-200 shadow-sm animate-pulse">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-red-500 text-white shrink-0 shadow-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                <span>QA/QC Defect Lock — Active Non-Conformance</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-200 dark:bg-red-900/80 text-red-900 dark:text-red-100 font-mono font-black border border-red-300 dark:border-red-700">
                  {openNCRs.length} OPEN DEFECT{openNCRs.length === 1 ? "" : "S"}
                </span>
              </h3>
              <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                This element is subject to an active QA/QC hold due to unresolved non-conformances. Statutory quality protocol disallows casting or final handover until NCR close-out is verified.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <a
              href="#section-ncrs"
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow"
            >
              Review Defects
            </a>
          </div>
        </div>
      )}

      {/* ─── Visual Lifecycle Pipeline Stepper ─── */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Structural Member Lifecycle Pipeline</span>
          </span>
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400 font-mono">
            {element.status.replace(/_/g, " ")}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {LIFECYCLE_STAGES.map((st, idx) => {
            const isCurrent = currentStageIndex === idx;
            const isDone = currentStageIndex > idx;
            return (
              <div
                key={st.key}
                className={`p-2.5 rounded-2xl border transition-all ${
                  isCurrent
                    ? "bg-brand-500/10 dark:bg-brand-500/20 border-brand-500/40 text-brand-700 dark:text-brand-300 shadow-sm ring-1 ring-brand-500/30"
                    : isDone
                      ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                      : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold">
                    0{idx + 1}
                  </span>
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : isCurrent ? (
                    <div className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  )}
                </div>
                <div className="text-xs font-black truncate">{st.label}</div>
                <div className="text-[10px] opacity-75 truncate">{st.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Key Metrics Grid ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm dark:shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center gap-1">
            <Ruler className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>Geometry Dimensions</span>
          </span>
          <div className="text-base font-black text-slate-900 dark:text-white font-mono">
            {dimDia > 0 ? (
              <span>
                Ø {dimDia}m × H {dimH}m
              </span>
            ) : dimL || dimW || dimH ? (
              <span>
                {dimL} × {dimW} × {dimH} mm
              </span>
            ) : (
              <span>Standard Geometry</span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Length × Width × Height
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm dark:shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center gap-1">
            <Box className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Calculated Volume</span>
          </span>
          <div className="text-base font-black text-cyan-600 dark:text-cyan-400 font-mono">
            {getOrCalculateVolume(element).toFixed(3)} m³
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Net in-situ concrete volume
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm dark:shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <FlaskConical className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Concrete Mix Grade</span>
            </span>
            {cubeCompliance && (
              <span
                className={`px-2 py-0.5 text-[9px] font-mono font-black rounded-full ${
                  cubeCompliance.failed
                    ? "bg-red-500/20 text-red-500 border border-red-500/30"
                    : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {cubeCompliance.failed
                  ? "DEFECT"
                  : `${cubeCompliance.total} CUBES`}
              </span>
            )}
          </span>
          <div className="text-base font-black text-slate-900 dark:text-white font-mono">
            {element.concreteGrade || "C35/45"}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {cubeCompliance?.has28Day
              ? "28d Test Data Logged"
              : "Target 28d Compressive Strength"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm dark:shadow-lg">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Location &amp; Level</span>
          </span>
          <div className="text-base font-black text-slate-900 dark:text-white truncate">
            {levelName}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Grid: {element.grid || element.gridAxis || "N/A"}
          </span>
        </div>
      </div>

      {/* ─── Reinforcement & Work Package Details ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rebar Detailing */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm dark:shadow-lg">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Hammer className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Reinforcement Detailing &amp; Rebar Schedule</span>
          </h3>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-brand-700 dark:text-brand-300">
            {element.rebarSpec ||
              "Standard Grade 500B High-Yield Ribbed Bars with 40mm cover"}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <span>
              Formwork Area:{" "}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {getOrCalculateFormworkArea(element).toFixed(2)} m²
              </strong>
            </span>
            <span>
              Pour Schedule:{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {element.plannedPourDate || element.plannedCastingDate || "TBD"}
              </strong>
            </span>
          </div>
        </div>

        {/* Work Package & QA Specifications */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm dark:shadow-lg">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Work Package &amp; Subcontractor Scope</span>
          </h3>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900 dark:text-white">{packageName}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Assigned Trade: Civil &amp; Structural Superstructure
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold">
              {element.elementType}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Linked QA/QC History Cards (Inspections, Cube Tests, NCRs, Observations) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Linked Inspections */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm dark:shadow-xl">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Inspection History ({inspections.length})</span>
            </h3>
            <Link
              to={`/project/inspections/create?elementId=${element.id}&elementName=${encodeURIComponent(element.elementName)}`}
              className="text-[11px] text-brand-600 dark:text-brand-400 hover:text-brand-500 font-bold transition"
            >
              + New
            </Link>
          </div>
          {inspections.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">
              No inspections recorded for this element yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {inspections.map((i) => (
                <div
                  key={i.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                >
                  <div className="flex justify-between font-bold">
                    <span className="text-brand-700 dark:text-brand-300 font-mono">
                      {i.inspectionNumber || "INSP"}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        i.status === "APPROVED"
                          ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                          : i.status === "REJECTED"
                            ? "bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                            : "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {i.status}
                    </span>
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 text-[11px]">
                    {i.templateName || "QA Inspection"}
                  </div>
                  <div className="text-slate-500 text-[10px] flex justify-between pt-1 border-t border-slate-200 dark:border-slate-900">
                    <span>{i.scheduledDate || "Date N/A"}</span>
                    <span>Score: {i.passScore || 100}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Linked Cube Tests */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm dark:shadow-xl">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Cube Strength Tests ({cubes.length})</span>
            </h3>
            <Link
              to="/project/concrete/sample"
              className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-bold transition"
            >
              + Sample
            </Link>
          </div>
          {cubes.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">
              No concrete test samples linked yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {cubes.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                >
                  <div className="flex justify-between font-bold">
                    <span className="text-emerald-700 dark:text-emerald-300 font-mono">
                      {c.sampleId}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        c.overallStatus === "APPROVED"
                          ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {c.overallStatus}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 text-[11px]">
                    7d: {c.tests?.day7?.compressiveStrengthNmm2 || "Pending"}{" "}
                    N/mm² • 28d:{" "}
                    {c.tests?.day28?.compressiveStrengthNmm2 || "Pending"} N/mm²
                  </div>
                  <div className="text-slate-500 text-[10px] flex justify-between pt-1 border-t border-slate-200 dark:border-slate-900">
                    <span>Cast: {c.castDate}</span>
                    <span>{c.batchingPlant || "Batch Plant"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Linked Non-Conformance Reports (NCR) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm dark:shadow-xl">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>Defects &amp; NCRs ({ncrs.length})</span>
            </h3>
            <Link
              to={`/project/ncrs/create?elementId=${element.id}&elementName=${encodeURIComponent(element.elementName)}`}
              className="text-[11px] text-red-600 dark:text-red-400 hover:text-red-500 font-bold transition"
            >
              + Raise NCR
            </Link>
          </div>
          {ncrs.length === 0 ? (
            <div className="py-6 text-center text-xs text-emerald-600 dark:text-emerald-400 flex flex-col items-center justify-center gap-1.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold">Zero Non-Conformances</span>
              <span className="text-slate-500 text-[11px]">
                Element satisfies QA tolerance limits
              </span>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {ncrs.map((n) => (
                <Link
                  key={n.id}
                  to={`/project/ncrs/${n.id}`}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-red-200 dark:border-red-900/40 hover:border-red-500 text-xs block transition space-y-1"
                >
                  <div className="flex justify-between font-bold">
                    <span className="text-red-600 dark:text-red-400 font-mono">
                      {n.ncrNumber || "NCR"}
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 text-[10px]">
                      {n.status}
                    </span>
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 text-[11px] line-clamp-1">
                    {n.title}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Linked Photographic Evidence Gallery ─── */}
      {photos.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm dark:shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>Photographic Evidence Archive ({photos.length})</span>
            </h3>
            <Link
              to="/project/photos"
              className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-500 font-bold transition flex items-center gap-1"
            >
              <span>View Full Gallery</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {photos.map((p, idx) => (
              <a
                key={p.id || idx}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-brand-500 transition block shadow-sm"
              >
                <img
                  src={p.thumbnailUrl || p.url}
                  alt={p.caption || "Evidence Photo"}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-2 flex items-end">
                  <span className="text-[10px] text-white font-bold line-clamp-1">
                    {p.caption || "Site Photo"}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ─── 3D Element Interactive Twin Modal ─── */}
      {show3DViewer && (
        <ElementViewer
          element={element}
          isOpen={show3DViewer}
          levelName={levelName}
          onClose={() => setShow3DViewer(false)}
        />
      )}

      {/* ─── Edit Element Modal ─── */}
      {showEditModal && element && (
        <ElementModal
          isOpen={showEditModal}
          editingElement={element}
          levels={levels}
          packages={packages}
          gridlines={gridlines}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleSaveEditedElement}
        />
      )}

      {/* ─── Physical QR Asset Tags Modal ─── */}
      {showQRModal && element && (
        <ElementQRTagsModal
          isOpen={showQRModal}
          elements={[element]}
          levelNameMap={new Map([[element.levelId || "", levelName]])}
          projectName={activeProject?.name}
          projectCode={activeProject?.code}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
};

export default ElementDetail;
