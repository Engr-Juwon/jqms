import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Building2,
  Info,
  Maximize2,
  X,
  ShieldAlert,
  Layers,
  Search,
  Pencil,
  Ruler,
  AlertTriangle,
  Download,
  Filter,
  Camera,
  Sliders,
  Tag,
  Type,
  Sparkles,
  Sun,
  Moon,
  Compass,
  Palette,
} from "lucide-react";
import { StructuralElement, ProjectLevel, Gridline, NCR } from "@/types";
import {
  buildGridSystemGeometry,
  resolveElementGridCoords,
  ResolvedElementCoords,
} from "@/lib/gridUtils";
import {
  getOrCalculateVolume,
  getOrCalculateFormworkArea,
} from "@/lib/elementCalculations";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { isQAQCUser } from "@/lib/permissions";
import { uploadImage, getThumbnail } from "@/lib/cloudinary";
import { syncPhotoToSiteGallery } from "@/lib/photoSync";
import { toast } from "react-hot-toast";
import { GridSnapshotModal } from "./GridSnapshotModal";

export type CanvasTheme = "dark" | "light" | "blueprint";

export interface CanvasThemeConfig {
  name: string;
  canvasBg: string;
  gridline: string;
  bubbleFill: string;
  bubbleStrokeX: string;
  bubbleTextX: string;
  bubbleStrokeY: string;
  bubbleTextY: string;
  dimLine: string;
  dimBoxBg: string;
  dimBoxStroke: string;
  dimText: string;
  plateBg: string;
  plateText: string;
  plateSubText: string;
  plateBorder: string;
  slabDefaultFill: string;
  slabDefaultStroke: string;
  beamCenterline: string;
  columnHatch: string;
  wallCenterline: string;
  shadowOpacity: string;
  shadowColor: string;
}

export const CANVAS_THEMES: Record<CanvasTheme, CanvasThemeConfig> = {
  dark: {
    name: "Dark CAD",
    canvasBg: "#090d16",
    gridline: "#334155",
    bubbleFill: "#090d16",
    bubbleStrokeX: "#0284c7",
    bubbleTextX: "#38bdf8",
    bubbleStrokeY: "#f59e0b",
    bubbleTextY: "#fbbf24",
    dimLine: "#475569",
    dimBoxBg: "#0f172a",
    dimBoxStroke: "#334155",
    dimText: "#94a3b8",
    plateBg: "#090d16",
    plateText: "#f8fafc",
    plateSubText: "#94a3b8",
    plateBorder: "#334155",
    slabDefaultFill: "#10b98120",
    slabDefaultStroke: "#059669",
    beamCenterline: "#ffffff",
    columnHatch: "#0f172a",
    wallCenterline: "#0f172a",
    shadowOpacity: "0.85",
    shadowColor: "#000000",
  },
  light: {
    name: "Light Paper",
    canvasBg: "#ffffff",
    gridline: "#cbd5e1",
    bubbleFill: "#ffffff",
    bubbleStrokeX: "#0284c7",
    bubbleTextX: "#0284c7",
    bubbleStrokeY: "#d97706",
    bubbleTextY: "#b45309",
    dimLine: "#94a3b8",
    dimBoxBg: "#ffffff",
    dimBoxStroke: "#cbd5e1",
    dimText: "#334155",
    plateBg: "#ffffff",
    plateText: "#0f172a",
    plateSubText: "#475569",
    plateBorder: "#cbd5e1",
    slabDefaultFill: "#ecfdf5",
    slabDefaultStroke: "#059669",
    beamCenterline: "#64748b",
    columnHatch: "#ffffff",
    wallCenterline: "#ffffff",
    shadowOpacity: "0.2",
    shadowColor: "#000000",
  },
  blueprint: {
    name: "Blueprint",
    canvasBg: "#0b1e3b",
    gridline: "#1e3a8a",
    bubbleFill: "#0b1e3b",
    bubbleStrokeX: "#38bdf8",
    bubbleTextX: "#7dd3fc",
    bubbleStrokeY: "#38bdf8",
    bubbleTextY: "#7dd3fc",
    dimLine: "#1e40af",
    dimBoxBg: "#0b1e3b",
    dimBoxStroke: "#1e40af",
    dimText: "#93c5fd",
    plateBg: "#0f274c",
    plateText: "#f0f9ff",
    plateSubText: "#93c5fd",
    plateBorder: "#1e40af",
    slabDefaultFill: "#1e3a8a40",
    slabDefaultStroke: "#38bdf8",
    beamCenterline: "#38bdf8",
    columnHatch: "#0b1e3b",
    wallCenterline: "#0b1e3b",
    shadowOpacity: "0.85",
    shadowColor: "#000000",
  },
};

export function getFormworkLayerStyle(fmwkArea: number): {
  fill: string;
  stroke: string;
  label: string;
} {
  if (fmwkArea > 30) {
    return { fill: "#059669", stroke: "#047857", label: "> 30 m² (High Contact)" };
  } else if (fmwkArea >= 15) {
    return { fill: "#34d399", stroke: "#10b981", label: "15 – 30 m² (Medium Contact)" };
  } else {
    return { fill: "#a7f3d0", stroke: "#6ee7b7", label: "< 15 m² (Low Contact)" };
  }
}

type OverlayLayer = "STATUS" | "FORMWORK" | "RISK";
type ElementTypeFilter = "ALL" | "COLUMN" | "BEAM" | "SLAB" | "WALL" | "STAIR";

interface GridPlanCanvasProps {
  gridlines?: Gridline[];
  elements?: StructuralElement[];
  levels?: ProjectLevel[];
  ncrs?: NCR[];
  scaleFactor?: number;
  className?: string;
  projectId?: string;
  onSelectElement?: (element: StructuralElement) => void;
}

export type RiskLevel = "CRITICAL" | "MODERATE" | "LOW";

export interface RiskAnalysis {
  level: RiskLevel;
  fill: string;
  stroke: string;
  label: string;
  reasons: string[];
}

const STATUS_COLOR_MAP: Record<
  string,
  { fill: string; stroke: string; label: string }
> = {
  PENDING: { fill: "#fef3c7", stroke: "#d97706", label: "Pending Inspection" },
  REBAR_IN_PROGRESS: {
    fill: "#e0e7ff",
    stroke: "#4338ca",
    label: "Rebar in Progress",
  },
  FORMWORK_IN_PROGRESS: {
    fill: "#f3e8ff",
    stroke: "#7e22ce",
    label: "Formwork in Progress",
  },
  READY_FOR_CASTING: {
    fill: "#fef08a",
    stroke: "#ca8a04",
    label: "Ready for Casting",
  },
  REBAR_INSPECTED: {
    fill: "#dbeafe",
    stroke: "#2563eb",
    label: "Rebar Inspected",
  },
  POURED: { fill: "#cffaff", stroke: "#0891b2", label: "Concrete Poured" },
  APPROVED: { fill: "#d1fae5", stroke: "#059669", label: "QA Approved" },
  REJECTED: { fill: "#fee2e2", stroke: "#dc2626", label: "QA Rejected" },
};

function evaluateQARisk(el: StructuralElement, ncrs: NCR[]): RiskAnalysis {
  const elementNcrs = (ncrs || []).filter(
    (n) =>
      n.elementId === el.id ||
      n.structuralElementId === el.id ||
      n.elementIds?.includes(el.id) ||
      n.elementNames?.includes(el.elementName) ||
      (n.elementName && n.elementName === el.elementName),
  );

  const openNCRs = elementNcrs.filter((n) => n.status !== "CLOSED");
  const inReviewNCRs = elementNcrs.filter(
    (n) => n.status === "UNDER_REVIEW" || n.status === "REMEDIATION",
  );

  const reasons: string[] = [];

  if (el.status === "REJECTED") {
    reasons.push("QA Status: REJECTED");
  }
  if (openNCRs.length > 0) {
    reasons.push(`${openNCRs.length} Open NCR(s) Active`);
  }

  if (reasons.length > 0) {
    return {
      level: "CRITICAL",
      fill: "#ef4444",
      stroke: "#991b1b",
      label: "Critical Risk / Defect",
      reasons,
    };
  }

  if (el.status === "PENDING") {
    reasons.push("Uninspected / Pending Sign-off");
  }
  if (inReviewNCRs.length > 0) {
    reasons.push(`${inReviewNCRs.length} NCR(s) Under Review`);
  }

  if (reasons.length > 0) {
    return {
      level: "MODERATE",
      fill: "#f59e0b",
      stroke: "#b45309",
      label: "Moderate Risk / Action Needed",
      reasons,
    };
  }

  return {
    level: "LOW",
    fill: "#10b981",
    stroke: "#047857",
    label: "Low Risk / Compliant",
    reasons: ["QA Sign-off Verified"],
  };
}

export type LabelDetailMode = "COMPACT" | "STANDARD" | "DETAILED";
export type TextSizeOption = "STANDARD" | "LARGE" | "EXTRA_LARGE";

/**
 * Shorten / normalize an element name for Compact mode
 * e.g. "COL-01" -> "C-01", "COLUMN-A1" -> "C-A1", "BEAM-101" -> "B-101", "SLAB-01" -> "S-01", "WALL-02" -> "W-02"
 */
function getCompactElementName(name: string, type: string): string {
  if (!name) return "";
  const clean = name.trim();
  const upperType = type.toUpperCase();
  if (
    upperType.includes("COLUMN") ||
    upperType.includes("PIER") ||
    upperType.includes("STANCHION")
  ) {
    return clean.replace(/^(COLUMN|COL)[-_ ]?/i, "C-");
  }
  if (upperType.includes("BEAM")) {
    return clean.replace(/^(BEAM|BM)[-_ ]?/i, "B-");
  }
  if (upperType.includes("SLAB")) {
    return clean.replace(/^(SLAB|SL)[-_ ]?/i, "S-");
  }
  if (upperType.includes("WALL")) {
    return clean.replace(/^(WALL|WL)[-_ ]?/i, "W-");
  }
  if (
    upperType.includes("FOOTING") ||
    upperType.includes("PAD") ||
    upperType.includes("PILE") ||
    upperType.includes("RAFT")
  ) {
    return clean.replace(/^(FOOTING|PAD|PILE|RAFT|FTG)[-_ ]?/i, "F-");
  }
  if (upperType.includes("STAIR")) {
    return clean.replace(/^(STAIRCASE|STAIR|STR)[-_ ]?/i, "ST-");
  }
  return clean;
}

function getPillDimensions(
  text: string,
  baseFontSize: number = 11,
  paddingX: number = 8,
  scale: number = 1,
) {
  const effectiveFont = Math.round(baseFontSize * scale * 10) / 10;
  const charW = effectiveFont * 0.62;
  const width = Math.max(
    Math.round(28 * scale),
    Math.round(text.length * charW + paddingX * 2 * scale),
  );
  const height = Math.round(effectiveFont + 8 * scale);
  return { width, height, fontSize: effectiveFont };
}

export const GridPlanCanvas: React.FC<GridPlanCanvasProps> = ({
  gridlines = [],
  elements = [],
  levels = [],
  ncrs = [],
  scaleFactor = 80,
  className = "",
  projectId,
  onSelectElement,
}) => {
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentProjId = projectId || activeProject?.id || "proj-default";
  const currentCompId =
    currentUser?.companyId ||
    company?.id ||
    activeProject?.companyId ||
    "comp-default";

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 80, y: 80 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [touchDist, setTouchDist] = useState<number | null>(null);

  const dragDistanceRef = useRef<number>(0);

  const [selectedLevelId, setSelectedLevelId] = useState<string>(
    activeProject?.currentLevelId || "ALL",
  );
  const prevLevelIdRef = useRef<string | undefined>(activeProject?.currentLevelId);
  useEffect(() => {
    if (activeProject?.currentLevelId !== prevLevelIdRef.current) {
      prevLevelIdRef.current = activeProject?.currentLevelId;
      setSelectedLevelId(activeProject?.currentLevelId || "ALL");
    }
  }, [activeProject?.currentLevelId]);
  const [selectedElementType, setSelectedElementType] =
    useState<ElementTypeFilter>("ALL");
  const [activeLayer, setActiveLayer] = useState<OverlayLayer>("STATUS");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hoveredElement, setHoveredElement] =
    useState<StructuralElement | null>(null);
  const [inspectedElement, setInspectedElement] =
    useState<StructuralElement | null>(null);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [legendPosition, setLegendPosition] = useState<
    "BOTTOM_HORIZONTAL" | "TOP_HORIZONTAL" | "FLOATING"
  >("BOTTOM_HORIZONTAL");
  const [labelDetailMode, setLabelDetailMode] =
    useState<LabelDetailMode>("STANDARD");
  const [textSize, setTextSize] = useState<TextSizeOption>("LARGE");
  const [autoScaleLabels, setAutoScaleLabels] = useState<boolean>(true);
  const [canvasTheme, setCanvasTheme] = useState<CanvasTheme>("light");
  const currentTheme = CANVAS_THEMES[canvasTheme];
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState<boolean>(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Zoom-adaptive font scaling:
  // When zoomed out (e.g. zoom = 0.4 - 0.6 in Fit View), labels scale up so that on-screen text never drops below comfortable reading size (~11-13px).
  const labelScale = useMemo(() => {
    const zoomFactor = Math.max(0.25, Math.min(zoom, 1.25));
    const autoFactor = autoScaleLabels
      ? Math.max(1.0, Math.min(2.5, 0.95 / zoomFactor))
      : 1.0;
    const sizeMultiplier =
      textSize === "EXTRA_LARGE" ? 1.35 : textSize === "LARGE" ? 1.18 : 1.0;
    return autoFactor * sizeMultiplier;
  }, [zoom, autoScaleLabels, textSize]);

  const bubbleScale = useMemo(() => {
    const zoomFactor = Math.max(0.25, Math.min(zoom, 1.25));
    return autoScaleLabels
      ? Math.max(1.0, Math.min(1.85, 0.9 / zoomFactor))
      : 1.0;
  }, [zoom, autoScaleLabels]);

  const filteredElements = useMemo(() => {
    let result = elements;
    if (selectedLevelId !== "ALL") {
      result = result.filter((el) => el.levelId === selectedLevelId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (el) =>
          (el.elementName && el.elementName.toLowerCase().includes(q)) ||
          (el.grid && el.grid.toLowerCase().includes(q)) ||
          (el.gridAxis && el.gridAxis.toLowerCase().includes(q)) ||
          (el.elementType && el.elementType.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [elements, selectedLevelId, searchQuery]);

  const levelNameMap = useMemo(() => {
    const map = new Map<string, string>();
    levels.forEach((l) => map.set(l.id, l.name));
    return map;
  }, [levels]);

  const matchesType = useCallback(
    (el: StructuralElement) => {
      if (selectedElementType === "ALL") return true;
      const type = (el.elementType || "").toUpperCase();
      if (selectedElementType === "COLUMN") return type.includes("COLUMN");
      if (selectedElementType === "BEAM") return type.includes("BEAM");
      if (selectedElementType === "SLAB") return type.includes("SLAB");
      if (selectedElementType === "WALL") return type.includes("WALL");
      if (selectedElementType === "STAIR") return type.includes("STAIR");
      return true;
    },
    [selectedElementType],
  );

  // Compute Grid Axes from DB Gridlines using the unified grid system geometry
  const { xAxes, yAxes, xMap, yMap, minX, maxX, minY, maxY } = useMemo(() => {
    const geom = buildGridSystemGeometry(gridlines, scaleFactor);
    return {
      xAxes: geom.xAxes,
      yAxes: geom.yAxes,
      xMap: geom.xMap,
      yMap: geom.yMap,
      minX: -80,
      maxX: geom.maxX + 80,
      minY: -80,
      maxY: geom.maxY + 80,
    };
  }, [gridlines, scaleFactor]);

  // Spatial Element Position Mapping with Bidirectional Coordinate Resolver
  const parsedElementMap = useMemo(() => {
    const elMap = new Map<string, ResolvedElementCoords>();

    filteredElements.forEach((el, index) => {
      const coords = resolveElementGridCoords(
        el.grid || el.gridAxis,
        el.elementName,
        xMap,
        yMap,
        xAxes,
        yAxes,
        scaleFactor,
        index,
        el.gridX,
        el.gridZ,
      );
      elMap.set(el.id, coords);
    });

    return elMap;
  }, [filteredElements, xMap, yMap, xAxes, yAxes, scaleFactor]);

  const handleFitView = useCallback(() => {
    if (!canvasRef.current) return;
    const containerWidth = canvasRef.current.clientWidth || 800;
    const containerHeight = canvasRef.current.clientHeight || 600;

    const contentWidth = maxX - minX || 500;
    const contentHeight = maxY - minY || 500;

    const scaleX = containerWidth / contentWidth;
    const scaleY = containerHeight / contentHeight;
    const newZoom = Math.min(
      Math.max(Math.min(scaleX, scaleY) * 0.85, 0.3),
      2.2,
    );

    const centerX =
      (containerWidth - contentWidth * newZoom) / 2 - minX * newZoom;
    const centerY =
      (containerHeight - contentHeight * newZoom) / 2 - minY * newZoom;

    setZoom(newZoom);
    setPan({ x: centerX, y: centerY });
  }, [minX, maxX, minY, maxY]);

  useEffect(() => {
    handleFitView();
  }, [handleFitView]);

  const handleExportView = useCallback(() => {
    if (!svgRef.current) return;
    const exportWidth = 1920;
    const exportHeight = 1080;

    setIsExporting(true);
    const toastId = toast.loading(
      "Exporting 2D Blueprint with integrated legend...",
    );

    const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
    svgClone.setAttribute("width", exportWidth.toString());
    svgClone.setAttribute("height", exportHeight.toString());

    const svgString = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = exportWidth;
      canvas.height = exportHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsExporting(false);
        toast.error("Could not initialize export canvas", { id: toastId });
        return;
      }

      // 1. Blueprint / Canvas Background
      ctx.fillStyle = currentTheme.canvasBg;
      ctx.fillRect(0, 0, exportWidth, exportHeight);

      // 2. Draw SVG Plan
      ctx.drawImage(image, 0, 0, exportWidth, exportHeight);

      // 3. Draw Title Block (Top-Left)
      const currentLvlName =
        levels.find((l) => l.id === selectedLevelId)?.name || "All Levels";
      const projName =
        activeProject?.name || "Structural Quality Management System";

      const isLight = canvasTheme === "light";
      ctx.fillStyle = isLight
        ? "rgba(255, 255, 255, 0.96)"
        : "rgba(15, 23, 42, 0.94)";
      ctx.fillRect(40, 40, 560, 110);
      ctx.strokeStyle = isLight ? "#cbd5e1" : "#334155";
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, 560, 110);

      ctx.fillStyle = isLight ? "#0284c7" : "#38bdf8";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(projName.toUpperCase(), 58, 68);

      ctx.fillStyle = isLight ? "#0f172a" : "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("STRUCTURAL 2D SPATIAL GRID BLUEPRINT", 58, 96);

      ctx.fillStyle = isLight ? "#475569" : "#94a3b8";
      ctx.font = "normal 13px sans-serif";
      ctx.fillText(
        `Floor Level: ${currentLvlName} | Active Layer: ${activeLayer} | Elements: ${filteredElements.length}`,
        58,
        122,
      );

      ctx.fillStyle = isLight ? "#64748b" : "#64748b";
      ctx.font = "normal 11px monospace";
      ctx.fillText(`Captured: ${new Date().toLocaleString()}`, 58, 140);

      // 4. Draw Comprehensive Layer Legend (Bottom-Right)
      const legendW = 440;
      const legendH = activeLayer === "STATUS" ? 260 : 180;
      const legendX = exportWidth - legendW - 40;
      const legendY = exportHeight - legendH - 40;

      ctx.fillStyle = isLight
        ? "rgba(255, 255, 255, 0.96)"
        : "rgba(15, 23, 42, 0.94)";
      ctx.fillRect(legendX, legendY, legendW, legendH);
      ctx.strokeStyle = isLight ? "#0284c7" : "#0284c7";
      ctx.lineWidth = 2;
      ctx.strokeRect(legendX, legendY, legendW, legendH);

      // Legend Header
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(legendX, legendY, legendW, 36);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(
        `SPATIAL PLAN LEGEND (${activeLayer} OVERLAY)`,
        legendX + 16,
        legendY + 24,
      );

      if (activeLayer === "STATUS") {
        const statusEntries = [
          { label: "Pending Inspection", color: "#d97706", fill: "#fef3c7" },
          { label: "Rebar in Progress", color: "#4338ca", fill: "#e0e7ff" },
          { label: "Formwork in Progress", color: "#7e22ce", fill: "#f3e8ff" },
          { label: "Ready for Casting", color: "#ca8a04", fill: "#fef08a" },
          { label: "Rebar Inspected", color: "#2563eb", fill: "#dbeafe" },
          { label: "Concrete Poured", color: "#0891b2", fill: "#cffaff" },
          { label: "QA Approved", color: "#059669", fill: "#d1fae5" },
          { label: "QA Rejected", color: "#dc2626", fill: "#fee2e2" },
        ];

        statusEntries.forEach((item, idx) => {
          const col = idx < 4 ? 0 : 1;
          const row = idx < 4 ? idx : idx - 4;
          const itemX = legendX + 18 + col * 210;
          const itemY = legendY + 58 + row * 45;

          ctx.fillStyle = item.fill;
          ctx.fillRect(itemX, itemY - 12, 18, 18);
          ctx.strokeStyle = item.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(itemX, itemY - 12, 18, 18);

          ctx.fillStyle = "#e2e8f0";
          ctx.font = "normal 12px sans-serif";
          ctx.fillText(item.label, itemX + 26, itemY + 2);
        });
      } else if (activeLayer === "RISK") {
        const riskEntries = [
          { label: "Critical Risk (Defect / Open NCR)", color: "#ef4444" },
          { label: "Moderate Risk (Pending Sign-off)", color: "#f59e0b" },
          { label: "Low Risk (Compliant Verified)", color: "#10b981" },
        ];

        riskEntries.forEach((item, idx) => {
          const itemX = legendX + 18;
          const itemY = legendY + 60 + idx * 36;

          ctx.fillStyle = item.color;
          ctx.beginPath();
          ctx.arc(itemX + 8, itemY - 3, 8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#e2e8f0";
          ctx.font = "normal 13px sans-serif";
          ctx.fillText(item.label, itemX + 26, itemY + 2);
        });
      } else if (activeLayer === "FORMWORK") {
        const formworkEntries = [
          { label: "High Contact Area (> 30 m²)", color: "#059669" },
          { label: "Medium Contact Area (15 – 30 m²)", color: "#34d399" },
          { label: "Low Contact Area (< 15 m²)", color: "#a7f3d0" },
        ];

        formworkEntries.forEach((item, idx) => {
          const itemX = legendX + 18;
          const itemY = legendY + 60 + idx * 36;

          ctx.fillStyle = item.color;
          ctx.fillRect(itemX, itemY - 12, 18, 18);
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(itemX, itemY - 12, 18, 18);

          ctx.fillStyle = "#e2e8f0";
          ctx.font = "normal 13px sans-serif";
          ctx.fillText(item.label, itemX + 26, itemY + 2);
        });
      }

      // 5. Trigger Direct Browser Download
      const pngURL = canvas.toDataURL("image/png");
      const cleanProj = (activeProject?.name || "Project").replace(
        /[^a-zA-Z0-9]/g,
        "_",
      );
      const cleanLvl = currentLvlName.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `GridPlan_${cleanProj}_${cleanLvl}_${activeLayer}_${Date.now()}.png`;

      const downloadLink = document.createElement("a");
      downloadLink.href = pngURL;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobURL);

      // 6. Auto-Save to Universal Site Photo Gallery
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], fileName, { type: "image/png" });

        let photoUrl = "";
        try {
          const uploadRes = await uploadImage(
            file,
            `jqms/photos/${currentProjId}`,
          );
          photoUrl = uploadRes.url;
        } catch (uploadErr) {
          console.warn("Cloudinary upload fallback to dataURL:", uploadErr);
          photoUrl = pngURL;
        }

        const caption = `2D Spatial Grid Blueprint — ${currentLvlName} (${activeLayer} layer, ${filteredElements.length} elements)`;

        await syncPhotoToSiteGallery({
          projectId: currentProjId,
          companyId: currentCompId,
          url: photoUrl,
          thumbnailUrl: photoUrl.startsWith("http")
            ? getThumbnail(photoUrl, 300)
            : photoUrl,
          caption,
          floorLevel: currentLvlName,
          category: "PROGRESS",
          tradeName: "Structural / 2D Grid Plan",
          uploadedBy: currentUser?.fullName || "QA/QC Engineer",
          uploaderRole: currentUser?.role || "QA/QC Engineer",
          sourceModule: "2DGridPlan",
          sourceId: `grid-2d-${Date.now()}`,
        });

        toast.success("2D Grid Plan exported & saved to Site Photo Gallery!", {
          id: toastId,
        });
      }, "image/png");

      setIsExporting(false);
    };

    image.onerror = () => {
      setIsExporting(false);
      URL.revokeObjectURL(blobURL);
      toast.error("Failed to render 2D blueprint for export", { id: toastId });
    };

    image.src = blobURL;
  }, [
    levels,
    selectedLevelId,
    activeLayer,
    filteredElements,
    activeProject,
    currentProjId,
    currentCompId,
    currentUser,
  ]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragDistanceRef.current = 0;
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    dragDistanceRef.current += Math.abs(e.movementX) + Math.abs(e.movementY);
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(Math.max(0.25, prev * factor), 3.0));
  };

  // Touch Controls for Mobile & Tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragDistanceRef.current = 0;
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
      setTouchDist(null);
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      setTouchDist(dist);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      dragDistanceRef.current +=
        Math.abs(newX - pan.x) + Math.abs(newY - pan.y);
      setPan({ x: newX, y: newY });
    } else if (e.touches.length === 2 && touchDist !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      const factor = dist / touchDist;
      setZoom((prev) => Math.min(Math.max(0.25, prev * factor), 3.0));
      setTouchDist(dist);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchDist(null);
  };

  const handleElementClick = (e: React.MouseEvent, el: StructuralElement) => {
    e.stopPropagation();
    if (dragDistanceRef.current > 8) return;
    setInspectedElement(el);
    if (onSelectElement) onSelectElement(el);
  };

  return (
    <div
      className={`flex flex-col bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl relative ${className}`}
    >
      {/* Top Toolbar */}
      <div className="p-2.5 sm:p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 sm:gap-3 z-10">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Level Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <Building2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <select
              value={selectedLevelId}
              onChange={(e) => setSelectedLevelId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option
                value="ALL"
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                All Levels
              </option>
              {levels.map((lvl) => (
                <option
                  key={lvl.id}
                  value={lvl.id}
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {lvl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Layer Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 rounded-xl p-0.5 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveLayer("STATUS")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                activeLayer === "STATUS"
                  ? "bg-brand-600 text-white shadow"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Status Layer
            </button>
            <button
              onClick={() => setActiveLayer("FORMWORK")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                activeLayer === "FORMWORK"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Formwork
            </button>
            <button
              onClick={() => setActiveLayer("RISK")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                activeLayer === "RISK"
                  ? "bg-amber-600 text-white shadow"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              QA Risk
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <select
              value={selectedElementType}
              onChange={(e) =>
                setSelectedElementType(e.target.value as ElementTypeFilter)
              }
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option
                value="ALL"
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                All Types
              </option>
              <option
                value="COLUMN"
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                Columns Only
              </option>
              <option
                value="BEAM"
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                Beams Only
              </option>
              <option
                value="SLAB"
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                Slabs Only
              </option>
              <option
                value="WALL"
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                Walls Only
              </option>
              <option
                value="STAIR"
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                Stairs Only
              </option>
            </select>
          </div>

          {/* Label Detail Mode */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <Tag className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <select
              value={labelDetailMode}
              onChange={(e) =>
                setLabelDetailMode(e.target.value as LabelDetailMode)
              }
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              title="Element Label Callout Detail Level"
            >
              <option
                value="COMPACT"
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                Compact (C1, B1)
              </option>
              <option
                value="STANDARD"
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                Standard (COL-01)
              </option>
              <option
                value="DETAILED"
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                Detailed Specs (C1 · 450×450)
              </option>
            </select>
          </div>

          {/* Text Size / Legibility Control */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <Type className="w-3.5 h-3.5 text-orange-500" />
            <select
              value={textSize}
              onChange={(e) => setTextSize(e.target.value as TextSizeOption)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              title="Label Text Legibility Scale"
            >
              <option
                value="STANDARD"
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                Text: Standard (11px)
              </option>
              <option
                value="LARGE"
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                Text: Large (13px)
              </option>
              <option
                value="EXTRA_LARGE"
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                Text: Extra Large (15px)
              </option>
            </select>
          </div>

          {/* Auto-Scale Labels Button */}
          <button
            type="button"
            onClick={() => setAutoScaleLabels((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition ${
              autoScaleLabels
                ? "bg-orange-500/10 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-500/30 shadow-xs"
                : "bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
            }`}
            title="Automatically scale labels to remain readable when zoomed out"
          >
            <Sparkles className={`w-3 h-3 ${autoScaleLabels ? "text-orange-500" : "text-slate-400"}`} />
            <span className="hidden sm:inline">Auto-Scale</span>
          </button>
        </div>

        {/* Viewport Actions & Export */}
        <div className="flex items-center gap-1.5">
          {/* Theme Switcher: Dark / Light / Blueprint */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 rounded-xl p-0.5 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCanvasTheme("dark")}
              className={`p-1.5 rounded-lg transition ${
                canvasTheme === "dark"
                  ? "bg-slate-800 text-white shadow"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Dark CAD Theme"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCanvasTheme("light")}
              className={`p-1.5 rounded-lg transition ${
                canvasTheme === "light"
                  ? "bg-white text-slate-900 shadow border border-slate-200"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Light Paper Theme"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCanvasTheme("blueprint")}
              className={`p-1.5 rounded-lg transition ${
                canvasTheme === "blueprint"
                  ? "bg-brand-600 text-white shadow"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Blueprint Theme"
            >
              <Compass className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setZoom((z) => Math.min(3.0, z * 1.2))}
            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.25, z * 0.8))}
            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitView}
            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowLegend((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition ${
              showLegend
                ? "bg-brand-500/10 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 border-brand-500/30 shadow-xs"
                : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
            }`}
            title="Toggle 2D Spatial Plan Legend overlay"
          >
            <Layers className={`w-3.5 h-3.5 ${showLegend ? "text-brand-600 dark:text-brand-400" : "text-slate-400"}`} />
            <span className="hidden sm:inline">Legend</span>
          </button>
          <button
            onClick={() => setShowSnapshotModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-lg shadow-brand-500/20"
            title="Open 2D Blueprint Snapshot Studio to customize framing, resolution, layers, themes, and engineering title block"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Snapshot Studio</span>
          </button>
          <button
            onClick={handleExportView}
            disabled={isExporting}
            className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition disabled:opacity-50"
            title="Quick 1-Click Snapshot (Direct PNG Export)"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ backgroundColor: currentTheme.canvasBg }}
        className="w-full h-[600px] cursor-grab active:cursor-grabbing relative overflow-hidden select-none touch-none transition-colors duration-200"
      >
        <svg
          ref={svgRef}
          className="w-full h-full pointer-events-auto"
          style={{ width: "100%", height: "100%", backgroundColor: currentTheme.canvasBg }}
        >
          {/* Enhanced Drop Shadow for High-Legibility Labels */}
          <defs>
            <filter id="label-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor={currentTheme.shadowColor} floodOpacity={currentTheme.shadowOpacity} />
            </filter>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Gridlines Layer */}
            {/* X Gridlines (Vertical Lines) */}
            {xAxes.map((gx) => {
              const bubbleRadius = Math.round(15 * bubbleScale);
              const bubbleFontSize = Math.round(11 * bubbleScale);
              return (
                <g key={`x-${gx.label}`} data-layer="gridlines">
                  <line
                    x1={gx.offset}
                    y1={minY}
                    x2={gx.offset}
                    y2={maxY}
                    stroke={currentTheme.gridline}
                    strokeWidth="1.5"
                    strokeDasharray="5 5"
                  />
                  {/* Top Grid Bubble */}
                  <circle
                    cx={gx.offset}
                    cy={minY + 20}
                    r={bubbleRadius}
                    fill={currentTheme.bubbleFill}
                    stroke={currentTheme.bubbleStrokeX}
                    strokeWidth={Math.max(2, 2.5 * bubbleScale)}
                    filter="url(#label-shadow)"
                  />
                  <text
                    x={gx.offset}
                    y={minY + 20 + bubbleFontSize * 0.35}
                    textAnchor="middle"
                    fill={currentTheme.bubbleTextX}
                    fontSize={bubbleFontSize}
                    fontWeight="bold"
                    fontFamily="monospace, sans-serif"
                  >
                    {gx.label}
                  </text>
                  {/* Bottom Grid Bubble */}
                  <circle
                    cx={gx.offset}
                    cy={maxY - 20}
                    r={bubbleRadius}
                    fill={currentTheme.bubbleFill}
                    stroke={currentTheme.bubbleStrokeX}
                    strokeWidth={Math.max(2, 2.5 * bubbleScale)}
                    filter="url(#label-shadow)"
                  />
                  <text
                    x={gx.offset}
                    y={maxY - 20 + bubbleFontSize * 0.35}
                    textAnchor="middle"
                    fill={currentTheme.bubbleTextX}
                    fontSize={bubbleFontSize}
                    fontWeight="bold"
                    fontFamily="monospace, sans-serif"
                  >
                    {gx.label}
                  </text>
                </g>
              );
            })}

            {/* X Dimension Callouts */}
            {xAxes.map((gx, idx) => {
              const nextGx = xAxes[idx + 1];
              if (!nextGx) return null;
              const midOffset = (gx.offset + nextGx.offset) / 2;
              const distM = (nextGx.offset - gx.offset) / scaleFactor;
              const dimFontSize = Math.round(9.5 * bubbleScale);
              const dimWidth = Math.round(48 * bubbleScale);
              const dimHeight = Math.round(16 * bubbleScale);
              return (
                <g key={`dim-x-${idx}`} data-layer="dimensions">
                  <line
                    x1={gx.offset}
                    y1={minY + 48}
                    x2={nextGx.offset}
                    y2={minY + 48}
                    stroke={currentTheme.dimLine}
                    strokeWidth="1"
                  />
                  <line
                    x1={gx.offset}
                    y1={minY + 44}
                    x2={gx.offset}
                    y2={minY + 52}
                    stroke={currentTheme.dimLine}
                    strokeWidth="1"
                  />
                  <line
                    x1={nextGx.offset}
                    y1={minY + 44}
                    x2={nextGx.offset}
                    y2={minY + 52}
                    stroke={currentTheme.dimLine}
                    strokeWidth="1"
                  />
                  <rect
                    x={midOffset - dimWidth / 2}
                    y={minY + 48 - dimHeight / 2}
                    width={dimWidth}
                    height={dimHeight}
                    rx={3 * bubbleScale}
                    fill={currentTheme.dimBoxBg}
                    stroke={currentTheme.dimBoxStroke}
                    strokeWidth={Math.max(0.8, 1 * bubbleScale)}
                    filter="url(#label-shadow)"
                  />
                  <text
                    x={midOffset}
                    y={minY + 48 + dimFontSize * 0.35}
                    textAnchor="middle"
                    fill={currentTheme.dimText}
                    fontSize={dimFontSize}
                    fontWeight="bold"
                    fontFamily="monospace, sans-serif"
                  >
                    {distM.toFixed(2)}m
                  </text>
                </g>
              );
            })}

            {/* Y Gridlines (Horizontal Lines) */}
            {yAxes.map((gy) => {
              const bubbleRadius = Math.round(15 * bubbleScale);
              const bubbleFontSize = Math.round(11 * bubbleScale);
              return (
                <g key={`y-${gy.label}`} data-layer="gridlines">
                  <line
                    x1={minX}
                    y1={gy.offset}
                    x2={maxX}
                    y2={gy.offset}
                    stroke={currentTheme.gridline}
                    strokeWidth="1.5"
                    strokeDasharray="5 5"
                  />
                  {/* Left Grid Bubble */}
                  <circle
                    cx={minX + 20}
                    cy={gy.offset}
                    r={bubbleRadius}
                    fill={currentTheme.bubbleFill}
                    stroke={currentTheme.bubbleStrokeY}
                    strokeWidth={Math.max(2, 2.5 * bubbleScale)}
                    filter="url(#label-shadow)"
                  />
                  <text
                    x={minX + 20}
                    y={gy.offset + bubbleFontSize * 0.35}
                    textAnchor="middle"
                    fill={currentTheme.bubbleTextY}
                    fontSize={bubbleFontSize}
                    fontWeight="bold"
                    fontFamily="monospace, sans-serif"
                  >
                    {gy.label}
                  </text>
                  {/* Right Grid Bubble */}
                  <circle
                    cx={maxX - 20}
                    cy={gy.offset}
                    r={bubbleRadius}
                    fill={currentTheme.bubbleFill}
                    stroke={currentTheme.bubbleStrokeY}
                    strokeWidth={Math.max(2, 2.5 * bubbleScale)}
                    filter="url(#label-shadow)"
                  />
                  <text
                    x={maxX - 20}
                    y={gy.offset + bubbleFontSize * 0.35}
                    textAnchor="middle"
                    fill={currentTheme.bubbleTextY}
                    fontSize={bubbleFontSize}
                    fontWeight="bold"
                    fontFamily="monospace, sans-serif"
                  >
                    {gy.label}
                  </text>
                </g>
              );
            })}

            {/* Y Dimension Callouts */}
            {yAxes.map((gy, idx) => {
              const nextGy = yAxes[idx + 1];
              if (!nextGy) return null;
              const midOffset = (gy.offset + nextGy.offset) / 2;
              const distM = (nextGy.offset - gy.offset) / scaleFactor;
              const dimFontSize = Math.round(9.5 * bubbleScale);
              const dimWidth = Math.round(48 * bubbleScale);
              const dimHeight = Math.round(16 * bubbleScale);
              return (
                <g key={`dim-y-${idx}`} data-layer="dimensions">
                  <line
                    x1={minX + 48}
                    y1={gy.offset}
                    x2={minX + 48}
                    y2={nextGy.offset}
                    stroke={currentTheme.dimLine}
                    strokeWidth="1"
                  />
                  <line
                    x1={minX + 44}
                    y1={gy.offset}
                    x2={minX + 52}
                    y2={gy.offset}
                    stroke={currentTheme.dimLine}
                    strokeWidth="1"
                  />
                  <line
                    x1={minX + 44}
                    y1={nextGy.offset}
                    x2={minX + 52}
                    y2={nextGy.offset}
                    stroke={currentTheme.dimLine}
                    strokeWidth="1"
                  />
                  <rect
                    x={minX + 48 - dimWidth / 2}
                    y={midOffset - dimHeight / 2}
                    width={dimWidth}
                    height={dimHeight}
                    rx={3 * bubbleScale}
                    fill={currentTheme.dimBoxBg}
                    stroke={currentTheme.dimBoxStroke}
                    strokeWidth={Math.max(0.8, 1 * bubbleScale)}
                    filter="url(#label-shadow)"
                  />
                  <text
                    x={minX + 48}
                    y={midOffset + dimFontSize * 0.35}
                    textAnchor="middle"
                    fill={currentTheme.dimText}
                    fontSize={dimFontSize}
                    fontWeight="bold"
                    fontFamily="monospace, sans-serif"
                  >
                    {distM.toFixed(2)}m
                  </text>
                </g>
              );
            })}

            {/* 1. Slabs Layer (Bottom) */}
            {filteredElements
              .filter((el) =>
                (el.elementType || "").toUpperCase().includes("SLAB"),
              )
              .map((el) => {
                const coords = parsedElementMap.get(el.id);
                if (!coords) return null;
                const isMatching = matchesType(el);
                const rx = Math.min(coords.x1, coords.x2);
                const ry = Math.min(coords.y1, coords.y2);
                const rw = Math.max(Math.abs(coords.x2 - coords.x1), 60);
                const rh = Math.max(Math.abs(coords.y2 - coords.y1), 60);

                let fill = currentTheme.slabDefaultFill;
                let stroke = currentTheme.slabDefaultStroke;
                if (activeLayer === "STATUS") {
                  const s =
                    STATUS_COLOR_MAP[el.status || "PENDING"] ||
                    STATUS_COLOR_MAP.PENDING;
                  fill = `${s.fill}40`;
                  stroke = s.stroke;
                } else if (activeLayer === "RISK") {
                  const r = evaluateQARisk(el, ncrs);
                  fill = `${r.fill}40`;
                  stroke = r.stroke;
                } else if (activeLayer === "FORMWORK") {
                  const fArea = getOrCalculateFormworkArea(el);
                  const fw = getFormworkLayerStyle(fArea);
                  fill = `${fw.fill}40`;
                  stroke = fw.stroke;
                }

                const slabCx = rx + rw / 2;
                const slabCy = ry + rh / 2;
                const slabName =
                  labelDetailMode === "COMPACT"
                    ? getCompactElementName(el.elementName, "SLAB")
                    : el.elementName;

                const fmwkArea = getOrCalculateFormworkArea(el);
                const volText = `${getOrCalculateVolume(el).toFixed(2)} m³`;
                const slabSub =
                  labelDetailMode === "DETAILED"
                    ? activeLayer === "FORMWORK"
                      ? `${fmwkArea.toFixed(1)} m² fmwk · ${el.concreteGrade || "C30"}`
                      : `${volText} · ${el.concreteGrade || "C30"}`
                    : labelDetailMode === "STANDARD"
                      ? activeLayer === "FORMWORK"
                        ? `${fmwkArea.toFixed(1)} m²`
                        : volText
                      : "";

                const slabNameFont = Math.round(12 * labelScale);
                const slabSubFont = Math.round(9.5 * labelScale);
                const maxLen = Math.max(slabName.length, slabSub.length);
                const cardW = Math.max(
                  Math.round(68 * labelScale),
                  Math.round(maxLen * slabNameFont * 0.62 + 22 * labelScale),
                );
                const cardH = slabSub
                  ? Math.round(38 * labelScale)
                  : Math.round(22 * labelScale);

                // Accurate 2D Geometry Generation based on slabShape
                const shape = el.slabShape || "rectangular";
                const isCurvedCantilever = shape === "curved_cantilever";
                const isCircularSegment = shape === "circular_segment";
                const isSemiCircular = shape === "semi_circular";
                const isCircular = shape === "circular";
                const isTrapezoid = shape === "trapezoidal_cantilever";

                // Projection / Rise conversion to screen pixels
                const radiusM = el.radius || 0;
                let riseM = el.arcDepth || 0;
                if (riseM <= 0 && radiusM > 0) {
                  const spanM = rw / scaleFactor;
                  if (spanM / 2 < radiusM) {
                    riseM = radiusM - Math.sqrt(radiusM * radiusM - (spanM / 2) * (spanM / 2));
                  }
                }
                const risePx = riseM > 0 ? riseM * scaleFactor : Math.min(rh * 0.85, Math.max(12, rw * 0.15));
                const radiusPx = radiusM > 0 ? radiusM * scaleFactor : Math.max(rw, rh);

                let slabPathD = "";
                let isCustomPath = false;

                if (isCurvedCantilever) {
                  // Cantilever with curved edge projection or deduction
                  // Base rectangle is [rx, ry, rw, rh].
                  const pX1 = rx;
                  const pY1 = ry;
                  const pX2 = rx + rw;
                  const pY2 = ry;
                  const pX3 = rx + rw;
                  const pY3 = ry + rh;
                  const pX4 = rx;
                  const pY4 = ry + rh;

                  const dir = ((el.cantileverDirection || 'TOP') as string).toUpperCase();
                  const dipPx = Math.min((dir === 'LEFT' || dir === 'RIGHT' ? rw : rh) * 0.85, Math.max(12, risePx));
                  const bulgePx = Math.min((dir === 'LEFT' || dir === 'RIGHT' ? rw : rh) * 0.85, Math.max(12, risePx));

                  if (dir === 'TOP' || dir === 'NORTH') {
                    // Curve is on TOP edge (projects upwards, scoops down towards beam)
                    slabPathD = el.isArcDeduction
                      ? `M ${pX4} ${pY4} L ${pX3} ${pY3} L ${pX2} ${pY2} Q ${pX1 + rw / 2} ${pY1 + dipPx} ${pX1} ${pY1} Z`
                      : `M ${pX4} ${pY4} L ${pX3} ${pY3} L ${pX2} ${pY2} Q ${pX1 + rw / 2} ${pY1 - bulgePx} ${pX1} ${pY1} Z`;
                  } else if (dir === 'LEFT' || dir === 'WEST') {
                    // Curve is on LEFT edge (projects leftwards, scoops right towards beam)
                    slabPathD = el.isArcDeduction
                      ? `M ${pX2} ${pY1} L ${pX3} ${pY3} L ${pX4} ${pY4} Q ${pX1 + dipPx} ${pY1 + rh / 2} ${pX1} ${pY1} Z`
                      : `M ${pX2} ${pY1} L ${pX3} ${pY3} L ${pX4} ${pY4} Q ${pX1 - bulgePx} ${pY1 + rh / 2} ${pX1} ${pY1} Z`;
                  } else if (dir === 'RIGHT' || dir === 'EAST') {
                    // Curve is on RIGHT edge (projects rightwards, scoops left towards beam)
                    slabPathD = el.isArcDeduction
                      ? `M ${pX1} ${pY4} L ${pX1} ${pY1} L ${pX2} ${pY2} Q ${pX2 - dipPx} ${pY1 + rh / 2} ${pX3} ${pY3} Z`
                      : `M ${pX1} ${pY4} L ${pX1} ${pY1} L ${pX2} ${pY2} Q ${pX2 + bulgePx} ${pY1 + rh / 2} ${pX3} ${pY3} Z`;
                  } else {
                    // BOTTOM / SOUTH (Default fallback: curve is on bottom edge)
                    slabPathD = el.isArcDeduction
                      ? `M ${pX1} ${pY1} L ${pX2} ${pY1} L ${pX3} ${pY3} Q ${pX1 + rw / 2} ${pY3 - dipPx} ${pX4} ${pY4} Z`
                      : `M ${pX1} ${pY1} L ${pX2} ${pY1} L ${pX3} ${pY3} Q ${pX1 + rw / 2} ${pY3 + bulgePx} ${pX4} ${pY4} Z`;
                  }
                  isCustomPath = true;
                } else if (isCircularSegment) {
                  // Pure circular arc segment (chord + arc)
                  const rSweep = Math.max(radiusPx, rw / 2);
                  slabPathD = `M ${rx} ${ry + rh} L ${rx + rw} ${ry + rh} A ${rSweep} ${rSweep} 0 0 1 ${rx} ${ry + rh} Z`;
                  isCustomPath = true;
                } else if (isSemiCircular) {
                  // Semicircular slab
                  const halfR = rw / 2;
                  slabPathD = `M ${rx} ${ry + rh} A ${halfR} ${rh} 0 0 1 ${rx + rw} ${ry + rh} Z`;
                  isCustomPath = true;
                } else if (isTrapezoid) {
                  // Tapered / Trapezoidal cantilever with corner fillet arc
                  const w1 = el.cantileverDepth || el.width || 1.95;
                  const w2 = (el as any).taperEndDepth ?? 0;
                  const rFillet = el.radius || 1.5;
                  const dir = ((el.cantileverDirection || 'BOTTOM') as string).toUpperCase();
                  const isMirr = !!(el as any).isMirrored;

                  const filletPx = Math.min(rw * 0.4, Math.max(12, rFillet * scaleFactor * 0.5));
                  const h2Px = w2 > 0 ? (w2 / (w1 || 1)) * rh : 0;

                  if (dir === 'TOP' || dir === 'NORTH') {
                    // Beam at bottom (ry + rh), projects upwards
                    if (isMirr) {
                      const cornerFilletStart = rx + filletPx;
                      const topSlantedY = ry + rh - Math.max(12, rh * 0.5);
                      slabPathD = `M ${rx} ${ry + rh} L ${rx + rw} ${ry + rh} L ${rx + rw} ${ry} L ${cornerFilletStart} ${topSlantedY} Q ${rx} ${topSlantedY} ${rx} ${ry + rh - h2Px} Z`;
                    } else {
                      const cornerFilletStart = rx + rw - filletPx;
                      const topSlantedY = ry + rh - Math.max(12, rh * 0.5);
                      slabPathD = `M ${rx} ${ry + rh} L ${rx + rw} ${ry + rh} L ${rx + rw} ${ry + rh - h2Px} Q ${rx + rw} ${topSlantedY} ${cornerFilletStart} ${topSlantedY} L ${rx} ${ry} Z`;
                    }
                  } else if (dir === 'LEFT' || dir === 'WEST') {
                    if (isMirr) {
                      slabPathD = `M ${rx + rw} ${ry} L ${rx + rw} ${ry + rh} Q ${rx + rw * 0.5} ${ry + rh - filletPx} ${rx} ${ry} Z`;
                    } else {
                      slabPathD = `M ${rx + rw} ${ry} L ${rx + rw} ${ry + rh} L ${rx} ${ry + rh} Q ${rx + filletPx} ${ry + rh * 0.5} ${rx + rw * 0.3} ${ry} Z`;
                    }
                  } else if (dir === 'RIGHT' || dir === 'EAST') {
                    if (isMirr) {
                      slabPathD = `M ${rx} ${ry} L ${rx} ${ry + rh} Q ${rx + rw * 0.5} ${ry + rh - filletPx} ${rx + rw} ${ry} Z`;
                    } else {
                      slabPathD = `M ${rx} ${ry} L ${rx} ${ry + rh} L ${rx + rw} ${ry + rh} Q ${rx + rw - filletPx} ${ry + rh * 0.5} ${rx + rw * 0.7} ${ry} Z`;
                    }
                  } else {
                    // BOTTOM / SOUTH (Default for CAD drawings like 1BM78/79 vs 1BM80/81)
                    // Beam at top (ry), projects downwards to ry + rh
                    if (isMirr) {
                      // Mirrored (1BM80/81): Corner fillet on LEFT (rx + filletPx), W1 (1950mm) on RIGHT (rx + rw)
                      const cornerFilletStart = rx + filletPx;
                      const bottomSlantedY = ry + Math.max(12, rh * 0.5);
                      slabPathD = `M ${rx} ${ry} L ${rx + rw} ${ry} L ${rx + rw} ${ry + rh} L ${cornerFilletStart} ${bottomSlantedY} Q ${rx} ${bottomSlantedY} ${rx} ${ry + h2Px} Z`;
                    } else {
                      // Standard (1BM78/79): W1 (1950mm) on LEFT (rx), corner fillet on RIGHT (rx + rw - filletPx)
                      const cornerFilletStart = rx + rw - filletPx;
                      const bottomSlantedY = ry + Math.max(12, rh * 0.5);
                      slabPathD = `M ${rx} ${ry} L ${rx + rw} ${ry} L ${rx + rw} ${ry + h2Px} Q ${rx + rw} ${bottomSlantedY} ${cornerFilletStart} ${bottomSlantedY} L ${rx} ${ry + rh} Z`;
                    }
                  }
                  isCustomPath = true;
                }

                return (
                  <g key={`slab-${el.id}`} data-layer="slabs">
                    {isCircular ? (
                      <ellipse
                        cx={slabCx}
                        cy={slabCy}
                        rx={rw / 2}
                        ry={rh / 2}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth="2"
                        strokeDasharray="6 4"
                        opacity={isMatching ? 0.9 : 0.2}
                        className="cursor-pointer transition-opacity hover:opacity-100"
                        onClick={(e) => handleElementClick(e, el)}
                        onMouseEnter={() => setHoveredElement(el)}
                        onMouseLeave={() => setHoveredElement(null)}
                      />
                    ) : isCustomPath ? (
                      <path
                        d={slabPathD}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth="2"
                        strokeDasharray="6 4"
                        opacity={isMatching ? 0.9 : 0.2}
                        className="cursor-pointer transition-opacity hover:opacity-100"
                        onClick={(e) => handleElementClick(e, el)}
                        onMouseEnter={() => setHoveredElement(el)}
                        onMouseLeave={() => setHoveredElement(null)}
                      />
                    ) : (
                      <rect
                        x={rx}
                        y={ry}
                        width={rw}
                        height={rh}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth="2"
                        strokeDasharray="6 4"
                        opacity={isMatching ? 0.9 : 0.2}
                        className="cursor-pointer transition-opacity hover:opacity-100"
                        onClick={(e) => handleElementClick(e, el)}
                        onMouseEnter={() => setHoveredElement(el)}
                        onMouseLeave={() => setHoveredElement(null)}
                      />
                    )}
                    {/* High-Contrast Plate */}
                    <rect
                      x={slabCx - cardW / 2}
                      y={slabCy - cardH / 2}
                      width={cardW}
                      height={cardH}
                      rx={4 * labelScale}
                      fill={currentTheme.plateBg}
                      fillOpacity="0.95"
                      stroke={stroke}
                      strokeWidth={Math.max(1.2, 1.4 * labelScale)}
                      filter="url(#label-shadow)"
                      data-layer="labels"
                      className="pointer-events-none"
                    />
                    <text
                      x={slabCx}
                      y={
                        slabSub
                          ? slabCy - 4 * labelScale
                          : slabCy + slabNameFont * 0.35
                      }
                      textAnchor="middle"
                      fill={currentTheme.plateText}
                      fontSize={slabNameFont}
                      fontWeight="bold"
                      fontFamily="monospace, sans-serif"
                      className="pointer-events-none"
                      data-layer="labels"
                    >
                      {slabName}
                    </text>
                    {slabSub && (
                      <text
                        x={slabCx}
                        y={slabCy + slabSubFont * 1.1}
                        textAnchor="middle"
                        fill={currentTheme.plateSubText}
                        fontSize={slabSubFont}
                        fontFamily="monospace, sans-serif"
                        className="pointer-events-none"
                        data-layer="labels"
                      >
                        {slabSub}
                      </text>
                    )}
                  </g>
                );
              })}

            {/* 1.5 Staircases Layer */}
            {filteredElements
              .filter((el) => {
                const t = (el.elementType || "").toUpperCase();
                return t.includes("STAIR");
              })
              .map((el) => {
                const coords = parsedElementMap.get(el.id);
                if (!coords) return null;
                const isMatching = matchesType(el);

                let fill = `${currentTheme.slabDefaultFill}`;
                let stroke = "#10b981";
                if (activeLayer === "STATUS") {
                  const s =
                    STATUS_COLOR_MAP[el.status || "PENDING"] ||
                    STATUS_COLOR_MAP.PENDING;
                  fill = `${s.fill}40`;
                  stroke = s.stroke;
                } else if (activeLayer === "RISK") {
                  const r = evaluateQARisk(el, ncrs);
                  fill = `${r.fill}40`;
                  stroke = r.stroke;
                } else if (activeLayer === "FORMWORK") {
                  const fArea = getOrCalculateFormworkArea(el);
                  const fw = getFormworkLayerStyle(fArea);
                  fill = `${fw.fill}40`;
                  stroke = fw.stroke;
                }

                const totalRisers =
                  el.riserCount ||
                  (el.flights?.reduce(
                    (acc: number, f: any) =>
                      acc + (Number(f.riserCount) || 0),
                    0,
                  ) || 12);
                const flightW = (el.flightWidth || 1.2) * scaleFactor;
                const flightWPx = Math.max(28, flightW);

                if (coords.isSpan) {
                  const spanLen =
                    coords.spanLength > 0.05
                      ? coords.spanLength
                      : (el.length || el.flightLength || 3.0) * scaleFactor;
                  const angleDeg = (coords.angleRad * 180) / Math.PI;
                  const stepW = spanLen / Math.max(3, totalRisers);

                  const stairName =
                    labelDetailMode === "COMPACT"
                      ? getCompactElementName(el.elementName, "STAIR")
                      : el.elementName;
                  const stairSub =
                    labelDetailMode === "DETAILED"
                      ? `${totalRisers} Risers · ${el.concreteGrade || "C30"}`
                      : labelDetailMode === "STANDARD"
                        ? `${totalRisers} Risers`
                        : "";
                  const stairLabel = stairSub
                    ? `${stairName} (${stairSub})`
                    : stairName;
                  const {
                    width: tagW,
                    height: tagH,
                    fontSize: tagFont,
                  } = getPillDimensions(stairLabel, 10.5, 6, labelScale);

                  return (
                    <g
                      key={`stair-${el.id}`}
                      data-layer="stairs"
                      className="cursor-pointer transition-transform hover:scale-105"
                      onClick={(e) => handleElementClick(e, el)}
                      onMouseEnter={() => setHoveredElement(el)}
                      onMouseLeave={() => setHoveredElement(null)}
                      opacity={isMatching ? 0.92 : 0.2}
                    >
                      <g
                        transform={`translate(${coords.midX}, ${coords.midY}) rotate(${angleDeg})`}
                      >
                        <rect
                          x={-spanLen / 2}
                          y={-flightWPx / 2}
                          width={spanLen}
                          height={flightWPx}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth="2"
                          rx="3"
                        />
                        {Array.from({
                          length: Math.min(24, Math.max(2, totalRisers - 1)),
                        }).map((_, i) => (
                          <line
                            key={`str-step-${i}`}
                            x1={-spanLen / 2 + (i + 1) * stepW}
                            y1={-flightWPx / 2}
                            x2={-spanLen / 2 + (i + 1) * stepW}
                            y2={flightWPx / 2}
                            stroke={stroke}
                            strokeWidth="1.2"
                            strokeOpacity="0.8"
                          />
                        ))}
                        <circle
                          cx={-spanLen / 2 + 10}
                          cy={0}
                          r="3"
                          fill="#38bdf8"
                        />
                        <line
                          x1={-spanLen / 2 + 10}
                          y1={0}
                          x2={spanLen / 2 - 8}
                          y2={0}
                          stroke="#38bdf8"
                          strokeWidth="1.6"
                          strokeDasharray="4 3"
                        />
                        <polygon
                          points={`${spanLen / 2 - 2},0 ${spanLen / 2 - 8},-3.5 ${spanLen / 2 - 8},3.5`}
                          fill="#38bdf8"
                        />
                        <text
                          x={0}
                          y={-4}
                          fill="#38bdf8"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace, sans-serif"
                        >
                          UP
                        </text>
                      </g>

                      <rect
                        x={coords.midX - tagW / 2}
                        y={coords.midY + flightWPx / 2 + 3 * labelScale}
                        width={tagW}
                        height={tagH}
                        rx={3 * labelScale}
                        fill={currentTheme.plateBg}
                        fillOpacity="0.95"
                        stroke={stroke || currentTheme.plateBorder}
                        strokeWidth={Math.max(0.8, 1 * labelScale)}
                        filter="url(#label-shadow)"
                        data-layer="labels"
                      />
                      <text
                        x={coords.midX}
                        y={
                          coords.midY +
                          flightWPx / 2 +
                          3 * labelScale +
                          tagH / 2 +
                          tagFont * 0.35
                        }
                        textAnchor="middle"
                        fill={currentTheme.plateText}
                        fontSize={tagFont}
                        fontWeight="bold"
                        fontFamily="monospace, sans-serif"
                        className="pointer-events-none"
                        data-layer="labels"
                      >
                        {stairLabel}
                      </text>
                    </g>
                  );
                }

                const isArea = coords.isArea;
                const rx = isArea
                  ? Math.min(coords.x1, coords.x2)
                  : coords.x1 - 45;
                const ry = isArea
                  ? Math.min(coords.y1, coords.y2)
                  : coords.y1 - flightWPx / 2;
                const rw = isArea
                  ? Math.max(Math.abs(coords.x2 - coords.x1), 70)
                  : Math.max(80, (el.flightLength || 3.0) * scaleFactor);
                const rh = isArea
                  ? Math.max(Math.abs(coords.y2 - coords.y1), 40)
                  : flightWPx;
                const stepCount = Math.max(3, Math.min(20, totalRisers));
                const isHorizontal = rw >= rh;
                const stepSize = isHorizontal ? rw / stepCount : rh / stepCount;

                const stairName =
                  labelDetailMode === "COMPACT"
                    ? getCompactElementName(el.elementName, "STAIR")
                    : el.elementName;
                const stairSub =
                  labelDetailMode === "DETAILED"
                    ? `${totalRisers} Risers · ${el.concreteGrade || "C30"}`
                    : labelDetailMode === "STANDARD"
                      ? `${totalRisers} Risers`
                      : "";
                const stairLabel = stairSub
                  ? `${stairName} (${stairSub})`
                  : stairName;
                const {
                  width: tagW,
                  height: tagH,
                  fontSize: tagFont,
                } = getPillDimensions(stairLabel, 10.5, 6, labelScale);

                return (
                  <g
                    key={`stair-${el.id}`}
                    data-layer="stairs"
                    className="cursor-pointer transition-transform hover:scale-105"
                    onClick={(e) => handleElementClick(e, el)}
                    onMouseEnter={() => setHoveredElement(el)}
                    onMouseLeave={() => setHoveredElement(null)}
                    opacity={isMatching ? 0.92 : 0.2}
                  >
                    <rect
                      x={rx}
                      y={ry}
                      width={rw}
                      height={rh}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth="2"
                      rx="3"
                    />
                    {isHorizontal
                      ? Array.from({ length: stepCount - 1 }).map((_, i) => (
                          <line
                            key={`str-t-${i}`}
                            x1={rx + (i + 1) * stepSize}
                            y1={ry}
                            x2={rx + (i + 1) * stepSize}
                            y2={ry + rh}
                            stroke={stroke}
                            strokeWidth="1.2"
                            strokeOpacity="0.8"
                          />
                        ))
                      : Array.from({ length: stepCount - 1 }).map((_, i) => (
                          <line
                            key={`str-t-${i}`}
                            x1={rx}
                            y1={ry + (i + 1) * stepSize}
                            x2={rx + rw}
                            y2={ry + (i + 1) * stepSize}
                            stroke={stroke}
                            strokeWidth="1.2"
                            strokeOpacity="0.8"
                          />
                        ))}

                    {isHorizontal ? (
                      <>
                        <circle
                          cx={rx + 10}
                          cy={ry + rh / 2}
                          r="3"
                          fill="#38bdf8"
                        />
                        <line
                          x1={rx + 10}
                          y1={ry + rh / 2}
                          x2={rx + rw - 8}
                          y2={ry + rh / 2}
                          stroke="#38bdf8"
                          strokeWidth="1.6"
                          strokeDasharray="4 3"
                        />
                        <polygon
                          points={`${rx + rw - 2},${ry + rh / 2} ${rx + rw - 8},${ry + rh / 2 - 3.5} ${rx + rw - 8},${ry + rh / 2 + 3.5}`}
                          fill="#38bdf8"
                        />
                        <text
                          x={rx + rw / 2}
                          y={ry + rh / 2 - 4}
                          fill="#38bdf8"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace, sans-serif"
                        >
                          UP
                        </text>
                      </>
                    ) : (
                      <>
                        <circle
                          cx={rx + rw / 2}
                          cy={ry + rh - 10}
                          r="3"
                          fill="#38bdf8"
                        />
                        <line
                          x1={rx + rw / 2}
                          y1={ry + rh - 10}
                          x2={rx + rw / 2}
                          y2={ry + 8}
                          stroke="#38bdf8"
                          strokeWidth="1.6"
                          strokeDasharray="4 3"
                        />
                        <polygon
                          points={`${rx + rw / 2},${ry + 2} ${rx + rw / 2 - 3.5},${ry + 8} ${rx + rw / 2 + 3.5},${ry + 8}`}
                          fill="#38bdf8"
                        />
                        <text
                          x={rx + rw / 2 + 10}
                          y={ry + rh / 2}
                          fill="#38bdf8"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="start"
                          fontFamily="monospace, sans-serif"
                        >
                          UP
                        </text>
                      </>
                    )}

                    <rect
                      x={rx + rw / 2 - tagW / 2}
                      y={ry + rh + 3 * labelScale}
                      width={tagW}
                      height={tagH}
                      rx={3 * labelScale}
                      fill={currentTheme.plateBg}
                      fillOpacity="0.95"
                      stroke={stroke || currentTheme.plateBorder}
                      strokeWidth={Math.max(0.8, 1 * labelScale)}
                      filter="url(#label-shadow)"
                      data-layer="labels"
                    />
                    <text
                      x={rx + rw / 2}
                      y={ry + rh + 3 * labelScale + tagH / 2 + tagFont * 0.35}
                      textAnchor="middle"
                      fill={currentTheme.plateText}
                      fontSize={tagFont}
                      fontWeight="bold"
                      fontFamily="monospace, sans-serif"
                      className="pointer-events-none"
                      data-layer="labels"
                    >
                      {stairLabel}
                    </text>
                  </g>
                );
              })}

            {/* 2. Footings Layer */}
            {filteredElements
              .filter((el) => {
                const t = (el.elementType || "").toUpperCase();
                return (
                  t.includes("FOOTING") ||
                  t.includes("PAD") ||
                  t.includes("PILE") ||
                  t.includes("RAFT")
                );
              })
              .map((el) => {
                const coords = parsedElementMap.get(el.id);
                if (!coords) return null;
                const isMatching = matchesType(el);
                const cx = coords.x1;
                const cy = coords.y1;
                const fw = 40;
                const fh = 40;

                const footFmwk = getOrCalculateFormworkArea(el);
                const footName =
                  labelDetailMode === "COMPACT"
                    ? getCompactElementName(el.elementName, "FOOTING")
                    : el.elementName;
                const footText =
                  labelDetailMode === "DETAILED"
                    ? activeLayer === "FORMWORK"
                      ? `${footName} [${footFmwk.toFixed(1)} m² fmwk]`
                      : `${footName} [${el.concreteGrade || "Pad"}]`
                    : labelDetailMode === "STANDARD" && activeLayer === "FORMWORK"
                      ? `${footName} (${footFmwk.toFixed(1)} m²)`
                      : footName;
                const { width: fpW, height: fpH, fontSize: fpFont } = getPillDimensions(
                  footText,
                  10.5,
                  6,
                  labelScale,
                );

                let footFill = "#47556940";
                let footStroke = "#94a3b8";
                if (activeLayer === "STATUS") {
                  const s =
                    STATUS_COLOR_MAP[el.status || "PENDING"] ||
                    STATUS_COLOR_MAP.PENDING;
                  footFill = `${s.fill}40`;
                  footStroke = s.stroke;
                } else if (activeLayer === "RISK") {
                  const r = evaluateQARisk(el, ncrs);
                  footFill = `${r.fill}40`;
                  footStroke = r.stroke;
                } else if (activeLayer === "FORMWORK") {
                  const fw = getFormworkLayerStyle(footFmwk);
                  footFill = `${fw.fill}40`;
                  footStroke = fw.stroke;
                }

                return (
                  <g
                    key={`footing-${el.id}`}
                    data-layer="footings"
                    className="cursor-pointer transition-transform hover:scale-110"
                    onClick={(e) => handleElementClick(e, el)}
                    onMouseEnter={() => setHoveredElement(el)}
                    onMouseLeave={() => setHoveredElement(null)}
                    opacity={isMatching ? 0.85 : 0.2}
                  >
                    <rect
                      x={cx - fw / 2}
                      y={cy - fh / 2}
                      width={fw}
                      height={fh}
                      fill={footFill}
                      stroke={footStroke}
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      rx="4"
                    />
                    {/* Footing Callout Tag */}
                    <rect
                      x={cx - fpW / 2}
                      y={cy + fh / 2 + 2 * labelScale}
                      width={fpW}
                      height={fpH}
                      rx={3 * labelScale}
                      fill={currentTheme.plateBg}
                      fillOpacity="0.95"
                      stroke={footStroke || currentTheme.plateBorder}
                      strokeWidth={Math.max(0.8, 1 * labelScale)}
                      filter="url(#label-shadow)"
                      data-layer="labels"
                    />
                    <text
                      x={cx}
                      y={cy + fh / 2 + 2 * labelScale + fpH / 2 + fpFont * 0.35}
                      textAnchor="middle"
                      fill={currentTheme.plateText}
                      fontSize={fpFont}
                      fontWeight="bold"
                      fontFamily="monospace, sans-serif"
                      className="pointer-events-none"
                      data-layer="labels"
                    >
                      {footText}
                    </text>
                  </g>
                );
              })}

            {/* 3. Walls Layer */}
            {filteredElements
              .filter((el) =>
                (el.elementType || "").toUpperCase().includes("WALL"),
              )
              .map((el) => {
                const coords = parsedElementMap.get(el.id);
                if (!coords) return null;
                const isMatching = matchesType(el);

                let stroke = "#94a3b8";
                if (activeLayer === "STATUS") {
                  const s =
                    STATUS_COLOR_MAP[el.status || "PENDING"] ||
                    STATUS_COLOR_MAP.PENDING;
                  stroke = s.stroke;
                } else if (activeLayer === "RISK") {
                  const r = evaluateQARisk(el, ncrs);
                  stroke = r.stroke;
                } else if (activeLayer === "FORMWORK") {
                  const fArea = getOrCalculateFormworkArea(el);
                  const fw = getFormworkLayerStyle(fArea);
                  stroke = fw.stroke;
                }

                const midX = (coords.x1 + coords.x2) / 2;
                const midY = (coords.y1 + coords.y2) / 2;
                const wallSpanM = coords.spanLength / scaleFactor;
                const wallFmwk = getOrCalculateFormworkArea(el);
                const wallName =
                  labelDetailMode === "COMPACT"
                    ? getCompactElementName(el.elementName, "WALL")
                    : el.elementName;
                const wallText =
                  labelDetailMode === "DETAILED"
                    ? activeLayer === "FORMWORK"
                      ? `${wallName} [${wallFmwk.toFixed(1)} m² fmwk]`
                      : `${wallName} [${wallSpanM.toFixed(1)}m · ${el.concreteGrade || "C30"}]`
                    : labelDetailMode === "STANDARD"
                      ? activeLayer === "FORMWORK"
                        ? `${wallName} (${wallFmwk.toFixed(1)} m²)`
                        : `${wallName} (${wallSpanM.toFixed(1)}m)`
                      : wallName;

                const { width: wpW, height: wpH, fontSize: wpFont } = getPillDimensions(
                  wallText,
                  11,
                  7,
                  labelScale,
                );

                const wdx = coords.x2 - coords.x1;
                const wdy = coords.y2 - coords.y1;
                let wAngle = Math.atan2(wdy, wdx) * (180 / Math.PI);
                if (wAngle > 90) wAngle -= 180;
                if (wAngle < -90) wAngle += 180;

                return (
                  <g
                    key={`wall-${el.id}`}
                    data-layer="walls"
                    className="cursor-pointer transition-opacity hover:opacity-100"
                    onClick={(e) => handleElementClick(e, el)}
                    onMouseEnter={() => setHoveredElement(el)}
                    onMouseLeave={() => setHoveredElement(null)}
                    opacity={isMatching ? 0.95 : 0.2}
                  >
                    <line
                      x1={coords.x1}
                      y1={coords.y1}
                      x2={coords.x2}
                      y2={coords.y2}
                      stroke={stroke}
                      strokeWidth="12"
                      strokeLinecap="square"
                    />
                    <line
                      x1={coords.x1}
                      y1={coords.y1}
                      x2={coords.x2}
                      y2={coords.y2}
                      stroke={currentTheme.wallCenterline}
                      strokeWidth="2"
                    />
                    {/* Wall Orientation-Aligned Callout Tag */}
                    <g
                      data-layer="labels"
                      className="pointer-events-none"
                      transform={`translate(${midX}, ${midY}) rotate(${wAngle})`}
                      filter="url(#label-shadow)"
                    >
                      <rect
                        x={-wpW / 2}
                        y={-wpH / 2}
                        width={wpW}
                        height={wpH}
                        rx={3.5 * labelScale}
                        fill={currentTheme.plateBg}
                        fillOpacity="0.95"
                        stroke={stroke}
                        strokeWidth={Math.max(1, 1.2 * labelScale)}
                      />
                      <text
                        x="0"
                        y={wpFont * 0.35}
                        textAnchor="middle"
                        fill={currentTheme.plateText}
                        fontSize={wpFont}
                        fontWeight="bold"
                        fontFamily="monospace, sans-serif"
                      >
                        {wallText}
                      </text>
                    </g>
                  </g>
                );
              })}

            {/* 4. Beams Layer */}
            {filteredElements
              .filter((el) =>
                (el.elementType || "").toUpperCase().includes("BEAM"),
              )
              .map((el) => {
                const coords = parsedElementMap.get(el.id);
                if (!coords) return null;
                const isMatching = matchesType(el);

                let stroke = "#d97706";
                if (activeLayer === "STATUS") {
                  const s =
                    STATUS_COLOR_MAP[el.status || "PENDING"] ||
                    STATUS_COLOR_MAP.PENDING;
                  stroke = s.stroke;
                } else if (activeLayer === "RISK") {
                  const r = evaluateQARisk(el, ncrs);
                  stroke = r.stroke;
                } else if (activeLayer === "FORMWORK") {
                  const fArea = getOrCalculateFormworkArea(el);
                  const fw = getFormworkLayerStyle(fArea);
                  stroke = fw.stroke;
                }

                const midX = (coords.x1 + coords.x2) / 2;
                const midY = (coords.y1 + coords.y2) / 2;
                const spanM = coords.spanLength / scaleFactor;
                const beamFmwk = getOrCalculateFormworkArea(el);

                const beamName =
                  labelDetailMode === "COMPACT"
                    ? getCompactElementName(el.elementName, "BEAM")
                    : el.elementName;
                const beamText =
                  labelDetailMode === "DETAILED"
                    ? activeLayer === "FORMWORK"
                      ? `${beamName} [${beamFmwk.toFixed(1)} m² fmwk]`
                      : `${beamName} [${spanM.toFixed(1)}m · ${el.concreteGrade || "C30"}]`
                    : labelDetailMode === "STANDARD" && activeLayer === "FORMWORK"
                      ? `${beamName} (${beamFmwk.toFixed(1)} m²)`
                      : beamName;

                const { width: bpW, height: bpH, fontSize: bpFont } = getPillDimensions(
                  beamText,
                  11,
                  7,
                  labelScale,
                );

                const bdx = coords.x2 - coords.x1;
                const bdy = coords.y2 - coords.y1;
                let bAngle = Math.atan2(bdy, bdx) * (180 / Math.PI);
                if (bAngle > 90) bAngle -= 180;
                if (bAngle < -90) bAngle += 180;

                return (
                  <g
                    key={`beam-${el.id}`}
                    data-layer="beams"
                    className="cursor-pointer transition-opacity hover:opacity-100"
                    onClick={(e) => handleElementClick(e, el)}
                    onMouseEnter={() => setHoveredElement(el)}
                    onMouseLeave={() => setHoveredElement(null)}
                    opacity={isMatching ? 0.95 : 0.2}
                  >
                    {/* Main structural beam line */}
                    <line
                      x1={coords.x1}
                      y1={coords.y1}
                      x2={coords.x2}
                      y2={coords.y2}
                      stroke={stroke}
                      strokeWidth="9"
                      strokeLinecap="round"
                    />
                    {/* Beam centerline */}
                    <line
                      x1={coords.x1}
                      y1={coords.y1}
                      x2={coords.x2}
                      y2={coords.y2}
                      stroke={currentTheme.beamCenterline}
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      opacity="0.6"
                    />
                    {/* Orientation-Aligned Label Tag on Beam */}
                    <g
                      data-layer="labels"
                      className="pointer-events-none"
                      transform={`translate(${midX}, ${midY}) rotate(${bAngle})`}
                      filter="url(#label-shadow)"
                    >
                      <rect
                        x={-bpW / 2}
                        y={-bpH / 2}
                        width={bpW}
                        height={bpH}
                        rx={3.5 * labelScale}
                        fill={currentTheme.plateBg}
                        fillOpacity="0.95"
                        stroke={stroke}
                        strokeWidth={Math.max(1, 1.2 * labelScale)}
                      />
                      <text
                        x="0"
                        y={bpFont * 0.35}
                        textAnchor="middle"
                        fill={currentTheme.plateText}
                        fontSize={bpFont}
                        fontWeight="bold"
                        fontFamily="monospace, sans-serif"
                      >
                        {beamText}
                      </text>
                    </g>
                  </g>
                );
              })}

            {/* 5. Columns Layer (Top) */}
            {filteredElements
              .filter((el) => {
                const t = (el.elementType || "").toUpperCase();
                return (
                  t.includes("COLUMN") ||
                  t.includes("PIER") ||
                  t.includes("STANCHION")
                );
              })
              .map((el) => {
                const coords = parsedElementMap.get(el.id);
                const cx = coords ? coords.x1 : xAxes[0]?.offset || 0;
                const cy = coords ? coords.y1 : yAxes[0]?.offset || 0;
                const isMatching = matchesType(el);

                let fill = "#2563eb";
                let stroke = "#1d4ed8";
                if (activeLayer === "STATUS") {
                  const s =
                    STATUS_COLOR_MAP[el.status || "PENDING"] ||
                    STATUS_COLOR_MAP.PENDING;
                  fill = s.fill;
                  stroke = s.stroke;
                } else if (activeLayer === "RISK") {
                  const r = evaluateQARisk(el, ncrs);
                  fill = r.fill;
                  stroke = r.stroke;
                } else if (activeLayer === "FORMWORK") {
                  const fArea = getOrCalculateFormworkArea(el);
                  const fw = getFormworkLayerStyle(fArea);
                  fill = fw.fill;
                  stroke = fw.stroke;
                }

                const isCircular =
                  el.columnShape === "circular" ||
                  el.elementType === "COLUMN_CIRCULAR";
                const size = 26;

                return (
                  <g
                    key={`col-${el.id}`}
                    data-layer="columns"
                    className="cursor-pointer transition-transform hover:scale-125"
                    onClick={(e) => handleElementClick(e, el)}
                    onMouseEnter={() => setHoveredElement(el)}
                    onMouseLeave={() => setHoveredElement(null)}
                    opacity={isMatching ? 1 : 0.2}
                  >
                    {isCircular ? (
                      <g>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={size / 2}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth="2.5"
                        />
                        <line
                          x1={cx - size / 2}
                          y1={cy}
                          x2={cx + size / 2}
                          y2={cy}
                          stroke={currentTheme.columnHatch}
                          strokeWidth="1"
                        />
                        <line
                          x1={cx}
                          y1={cy - size / 2}
                          x2={cx}
                          y2={cy + size / 2}
                          stroke={currentTheme.columnHatch}
                          strokeWidth="1"
                        />
                      </g>
                    ) : (
                      <g>
                        <rect
                          x={cx - size / 2}
                          y={cy - size / 2}
                          width={size}
                          height={size}
                          rx="3"
                          fill={fill}
                          stroke={stroke}
                          strokeWidth="2.5"
                        />
                        {/* Architectural column hatch */}
                        <line
                          x1={cx - size / 2}
                          y1={cy - size / 2}
                          x2={cx + size / 2}
                          y2={cy + size / 2}
                          stroke={currentTheme.columnHatch}
                          strokeWidth="1"
                        />
                        <line
                          x1={cx - size / 2}
                          y1={cy + size / 2}
                          x2={cx + size / 2}
                          y2={cy - size / 2}
                          stroke={currentTheme.columnHatch}
                          strokeWidth="1"
                        />
                      </g>
                    )}
                    {/* Column Dynamic Name Pill */}
                    {(() => {
                      const colFmwk = getOrCalculateFormworkArea(el);
                      const colName =
                        labelDetailMode === "COMPACT"
                          ? getCompactElementName(el.elementName, "COLUMN")
                          : el.elementName;
                      const colText =
                        labelDetailMode === "DETAILED"
                          ? activeLayer === "FORMWORK"
                            ? `${colName} [${colFmwk.toFixed(1)} m² fmwk]`
                            : `${colName} [${el.concreteGrade || "C35"}]`
                          : labelDetailMode === "STANDARD" && activeLayer === "FORMWORK"
                            ? `${colName} (${colFmwk.toFixed(1)} m²)`
                            : colName;
                      const { width: cpW, height: cpH, fontSize: cpFont } =
                        getPillDimensions(colText, 11, 8, labelScale);
                      return (
                        <g
                          data-layer="labels"
                          className="pointer-events-none"
                          filter="url(#label-shadow)"
                        >
                          <rect
                            x={cx - cpW / 2}
                            y={cy + size / 2 + 3 * labelScale}
                            width={cpW}
                            height={cpH}
                            rx={4 * labelScale}
                            fill={currentTheme.plateBg}
                            fillOpacity="0.96"
                            stroke={stroke || currentTheme.plateBorder}
                            strokeWidth={Math.max(1, 1.2 * labelScale)}
                          />
                          <text
                            x={cx}
                            y={
                              cy +
                              size / 2 +
                              3 * labelScale +
                              cpH / 2 +
                              cpFont * 0.35
                            }
                            textAnchor="middle"
                            fill={currentTheme.plateText}
                            fontSize={cpFont}
                            fontWeight="bold"
                            fontFamily="monospace, sans-serif"
                          >
                            {colText}
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                );
              })}
          </g>
        </svg>

        {/* Hover Tooltip Card */}
        {hoveredElement && (
          <div className="absolute bottom-4 left-4 p-3 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl pointer-events-none z-20 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {hoveredElement.elementName}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/10 dark:bg-brand-600/20 text-brand-700 dark:text-brand-400 border border-brand-500/30">
                {hoveredElement.elementType}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Grid:{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {hoveredElement.grid || hoveredElement.gridAxis || "N/A"}
              </strong>{" "}
              | Level:{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {levelNameMap.get(hoveredElement.levelId) ||
                  hoveredElement.levelName}
              </strong>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Status:{" "}
              <strong className="text-amber-600 dark:text-amber-400">
                {hoveredElement.status}
              </strong>{" "}
              | Vol:{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {getOrCalculateVolume(hoveredElement).toFixed(2)} m³
              </strong>{" "}
              | Fmwk:{" "}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {getOrCalculateFormworkArea(hoveredElement).toFixed(2)} m²
              </strong>
            </p>
          </div>
        )}

        {/* Adjustable Legend (Top Horizontal, Bottom Horizontal, or Floating) */}
        {showLegend && (
          <>
            {legendPosition === "BOTTOM_HORIZONTAL" ||
            legendPosition === "TOP_HORIZONTAL" ? (
              <div
                className={`absolute ${
                  legendPosition === "TOP_HORIZONTAL"
                    ? "top-3 inset-x-4"
                    : "bottom-3 inset-x-4"
                } z-20 px-3.5 py-2 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl backdrop-blur-md flex items-center justify-between gap-3 overflow-x-auto text-xs animate-in fade-in duration-200`}
              >
                {/* Left: Layer Tag */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 font-extrabold text-[10px] uppercase tracking-wider border border-brand-500/20">
                    <Layers className="w-3 h-3" />
                    <span>Legend ({activeLayer})</span>
                  </div>
                </div>

                {/* Center: Swatches */}
                <div className="flex items-center gap-3.5 overflow-x-auto py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  {activeLayer === "STATUS" &&
                    Object.entries(STATUS_COLOR_MAP).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex items-center gap-1.5 shrink-0"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10 shadow-2xs"
                          style={{ backgroundColor: val.stroke }}
                        />
                        <span className="whitespace-nowrap">{val.label}</span>
                      </div>
                    ))}

                  {activeLayer === "RISK" && (
                    <>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-2xs" />
                        <span className="whitespace-nowrap">
                          Critical / Open NCR
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-2xs" />
                        <span className="whitespace-nowrap">
                          Moderate / Pending
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs" />
                        <span className="whitespace-nowrap">
                          Low Risk / Compliant
                        </span>
                      </div>
                    </>
                  )}

                  {activeLayer === "FORMWORK" && (
                    <>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-700 border border-emerald-600 shadow-2xs" />
                        <span className="whitespace-nowrap">&gt; 30 m²</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 border border-emerald-500 shadow-2xs" />
                        <span className="whitespace-nowrap">15 – 30 m²</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-200 border border-emerald-300 shadow-2xs" />
                        <span className="whitespace-nowrap">&lt; 15 m²</span>
                      </div>
                    </>
                  )}

                  {/* Structural Geometry Separator & Key */}
                  <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />
                  <div className="flex items-center gap-2.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-xs bg-blue-500 inline-block" />{" "}
                      Col
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-0.5 bg-amber-500 inline-block" />{" "}
                      Beam
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-1 border border-dashed border-slate-400 inline-block" />{" "}
                      Wall
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-emerald-500/30 border border-emerald-500 inline-block" />{" "}
                      Slab
                    </span>
                  </div>
                </div>

                {/* Right: Position & Close Controls */}
                <div className="flex items-center gap-1 shrink-0 pl-2 border-l border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() =>
                      setLegendPosition(
                        legendPosition === "BOTTOM_HORIZONTAL"
                          ? "TOP_HORIZONTAL"
                          : "BOTTOM_HORIZONTAL",
                      )
                    }
                    className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold transition flex items-center gap-1"
                    title={
                      legendPosition === "BOTTOM_HORIZONTAL"
                        ? "Dock to Top"
                        : "Dock to Bottom"
                    }
                  >
                    {legendPosition === "BOTTOM_HORIZONTAL"
                      ? "Top Dock"
                      : "Bottom Dock"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLegendPosition("FLOATING")}
                    className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold transition"
                    title="Float Panel"
                  >
                    Panel
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLegend(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Close Legend"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="absolute top-4 right-4 p-3.5 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-20 space-y-3 max-w-xs text-xs backdrop-blur-md animate-in fade-in duration-200">
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    <span className="font-extrabold uppercase tracking-wide text-[11px]">
                      Legend ({activeLayer})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setLegendPosition("BOTTOM_HORIZONTAL")}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Dock to Bottom Line"
                    >
                      Bottom Dock
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLegend(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Close Legend"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Status Layer Swatches */}
                {activeLayer === "STATUS" && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Lifecycle Status
                    </p>
                    {Object.entries(STATUS_COLOR_MAP).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border border-black/10 shadow-2xs"
                          style={{ backgroundColor: val.stroke }}
                        />
                        <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                          {val.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* QA Risk Layer Swatches */}
                {activeLayer === "RISK" && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Quality Risk Level
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0 bg-red-500 shadow-2xs" />
                      <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                        Critical Defect / Open NCR
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0 bg-amber-500 shadow-2xs" />
                      <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                        Moderate Risk / Pending Sign-off
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0 bg-emerald-500 shadow-2xs" />
                      <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                        Low Risk / Compliant Sign-off
                      </span>
                    </div>
                  </div>
                )}

                {/* Formwork Layer Swatches */}
                {activeLayer === "FORMWORK" && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Formwork Contact Area
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm shrink-0 bg-emerald-700 border border-emerald-600 shadow-2xs" />
                      <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                        &gt; 30 m² (High Contact)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm shrink-0 bg-emerald-400 border border-emerald-500 shadow-2xs" />
                      <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                        15 – 30 m² (Medium Contact)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm shrink-0 bg-emerald-200 border border-emerald-300 shadow-2xs" />
                      <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                        &lt; 15 m² (Low Contact)
                      </span>
                    </div>
                  </div>
                )}

                {/* Structural Geometry Key */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Structural Geometry Key
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block shrink-0" />
                      Column
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-1 bg-amber-500 inline-block shrink-0" />
                      Beam
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-1.5 border border-dashed border-slate-400 inline-block shrink-0" />
                      Wall
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-500/30 border border-emerald-500 inline-block shrink-0" />
                      Slab
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Inspected Element Detail Drawer / Dialog */}
      {inspectedElement && (
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/10 dark:bg-brand-600/20 border border-brand-500/30 rounded-xl text-brand-700 dark:text-brand-400 font-black">
              {inspectedElement.elementName}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{inspectedElement.elementType}</span>
                <span className="text-slate-400 dark:text-slate-500">•</span>
                <span className="text-brand-600 dark:text-brand-400 font-mono">
                  {inspectedElement.grid || inspectedElement.gridAxis}
                </span>
                <span className="text-slate-400 dark:text-slate-500">•</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {levelNameMap.get(inspectedElement.levelId) ||
                    inspectedElement.levelName}
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Concrete Grade:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {inspectedElement.concreteGrade}
                </strong>{" "}
                | Volume:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {getOrCalculateVolume(inspectedElement).toFixed(3)} m³
                </strong>{" "}
                | Formwork:{" "}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {getOrCalculateFormworkArea(inspectedElement).toFixed(2)} m²
                </strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isQAQCUser(currentUser) && (
              <button
                onClick={() =>
                  onSelectElement && onSelectElement(inspectedElement)
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Element
              </button>
            )}
            <button
              onClick={() => setInspectedElement(null)}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showSnapshotModal && (
        <GridSnapshotModal
          isOpen={showSnapshotModal}
          onClose={() => setShowSnapshotModal(false)}
          svgRef={svgRef}
          elements={elements}
          filteredElements={filteredElements}
          levels={levels}
          selectedLevelId={selectedLevelId}
          gridlines={gridlines}
          ncrs={ncrs}
          activeLayer={activeLayer}
          minX={minX}
          maxX={maxX}
          minY={minY}
          maxY={maxY}
          currentPan={pan}
          currentZoom={zoom}
          projectName={activeProject?.name}
          projectId={currentProjId}
          companyId={currentCompId}
          currentUser={currentUser}
          labelDetailMode={labelDetailMode}
          onLabelDetailModeChange={setLabelDetailMode}
        />
      )}
    </div>
  );
};
