import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Camera,
  Download,
  Copy,
  Check,
  X,
  RefreshCw,
  Layers,
  Sliders,
  Eye,
  EyeOff,
  Sparkles,
  Monitor,
  Printer,
  Square,
  FileImage,
  ShieldCheck,
  AlertTriangle,
  Bookmark,
  Palette,
  Maximize2,
  FileText,
  Clock,
  User,
  Shield,
  UploadCloud,
  ArrowLeftRight,
  RotateCw,
  RotateCcw,
  Compass,
  LayoutGrid,
  Tag,
  Ghost,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  StructuralElement,
  ProjectLevel,
  Gridline,
  NCR,
  PhotoCategory,
} from "@/types";
import { uploadImage, getThumbnail } from "@/lib/cloudinary";
import { syncPhotoToSiteGallery } from "@/lib/photoSync";

export type SnapshotPreset =
  | "REPORT_HD"
  | "4K"
  | "2K"
  | "1080P"
  | "A4_PRINT"
  | "SQUARE"
  | "CUSTOM";
export type SnapshotTheme = "DARK" | "LIGHT" | "NAVY" | "TRANSPARENT";
export type SnapshotScope = "FULL_EXTENTS" | "VIEWPORT";
export type TitleBlockPos = "TOP_LEFT" | "TOP_RIGHT" | "BOTTOM_LEFT";
export type LegendPos =
  | "TOP_HORIZONTAL"
  | "BOTTOM_HORIZONTAL"
  | "BOTTOM_RIGHT"
  | "BOTTOM_LEFT"
  | "TOP_RIGHT";
export type LegendSize = "COMPACT" | "STANDARD" | "LARGE" | "XLARGE" | "CUSTOM";
export type WatermarkType =
  | "NONE"
  | "FOR_CONSTRUCTION"
  | "PRELIMINARY"
  | "QA_APPROVED"
  | "OPEN_DEFECTS"
  | "CONFIDENTIAL"
  | "CUSTOM";
export type SnapshotOrientation = "LANDSCAPE" | "PORTRAIT";
export type ContentRotation = 0 | 90 | 180 | 270;
export type LabelDetailMode = "COMPACT" | "STANDARD" | "DETAILED";
export type ExportFormat =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/svg+xml";

export interface GridSnapshotConfig {
  scope: SnapshotScope;
  orientation: SnapshotOrientation;
  contentRotation: ContentRotation;
  keepLabelsUpright: boolean;
  padding: number;
  preset: SnapshotPreset;
  width: number;
  height: number;
  dpiScale: number;
  theme: SnapshotTheme;
  showGridlines: boolean;
  showDimensions: boolean;
  showElementLabels: boolean;
  showColumns: boolean;
  showBeams: boolean;
  showSlabs: boolean;
  showFootings: boolean;
  showWalls: boolean;
  ghostDisabledElements: boolean;
  ghostOpacity: number;
  showTitleBlock: boolean;
  titleBlockPosition: TitleBlockPos;
  projectTitle: string;
  blueprintTitle: string;
  subtitle: string;
  includeTimestamp: boolean;
  includeInspector: boolean;
  inspectorName: string;
  inspectorRole: string;
  revisionText: string;
  showLegend: boolean;
  legendPosition: LegendPos;
  legendSize: LegendSize;
  legendScale: number;
  watermark: WatermarkType;
  customWatermarkText: string;
  format: ExportFormat;
  jpegQuality: number;
  autoSaveToGallery: boolean;
  galleryCategory: PhotoCategory;
}

const STORAGE_KEY = "jqms_2d_snapshot_settings_v2";

export const PRESET_DIMENSIONS: Record<
  SnapshotPreset,
  { w: number; h: number; label: string; desc: string }
> = {
  REPORT_HD: {
    w: 3840,
    h: 2160,
    label: "Weekly Report HD (4K Ultra)",
    desc: "3840 × 2160 (16:9 Razor-Sharp Presentation & PDF)",
  },
  "2K": {
    w: 2560,
    h: 1440,
    label: "2K QHD Crisp",
    desc: "2560 × 1440 (High-Density Vector Blueprint)",
  },
  "4K": {
    w: 3840,
    h: 2160,
    label: "4K UHD Master",
    desc: "3840 × 2160 (Maximum Detail Resolution)",
  },
  A4_PRINT: {
    w: 3508,
    h: 2480,
    label: "A4 Print Landscape",
    desc: "3508 × 2480 (~300 DPI Architectural Scale)",
  },
  "1080P": {
    w: 1920,
    h: 1080,
    label: "Full HD 1080p",
    desc: "1920 × 1080 (Standard Web Viewport)",
  },
  SQUARE: {
    w: 1440,
    h: 1440,
    label: "Square 1:1",
    desc: "1440 × 1440 (Detail / Inspection Report)",
  },
  CUSTOM: {
    w: 1920,
    h: 1080,
    label: "Custom Canvas",
    desc: "User-defined Dimensions",
  },
};

interface GridSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
  elements: StructuralElement[];
  filteredElements: StructuralElement[];
  levels: ProjectLevel[];
  selectedLevelId: string;
  gridlines: Gridline[];
  ncrs: NCR[];
  activeLayer: "STATUS" | "FORMWORK" | "RISK";
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  currentPan: { x: number; y: number };
  currentZoom: number;
  projectName?: string;
  projectId?: string;
  companyId?: string;
  currentUser?: { fullName?: string; role?: string } | null;
  initialContentRotation?: ContentRotation;
  labelDetailMode?: LabelDetailMode;
  onLabelDetailModeChange?: (mode: LabelDetailMode) => void;
}

export const GridSnapshotModal: React.FC<GridSnapshotModalProps> = ({
  isOpen,
  onClose,
  svgRef,
  elements,
  filteredElements,
  levels,
  selectedLevelId,
  gridlines,
  ncrs,
  activeLayer,
  minX,
  maxX,
  minY,
  maxY,
  currentPan,
  currentZoom,
  projectName = "Structural Quality Management System",
  projectId = "",
  companyId = "",
  currentUser,
  initialContentRotation = 0,
  labelDetailMode = "STANDARD",
  onLabelDetailModeChange,
}) => {
  const currentLvlName = useMemo(() => {
    return (
      levels.find((l) => l.id === selectedLevelId)?.name || "All Floor Levels"
    );
  }, [levels, selectedLevelId]);

  // Default configuration
  const defaultConfig: GridSnapshotConfig = useMemo(() => {
    let saved: Partial<GridSnapshotConfig> = {};
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      if (item) saved = JSON.parse(item);
    } catch (e) {
      console.warn("Could not read snapshot settings from localStorage:", e);
    }

    return {
      scope: saved.scope || "FULL_EXTENTS",
      orientation: saved.orientation || "LANDSCAPE",
      contentRotation: (initialContentRotation !== undefined ? initialContentRotation : (saved.contentRotation ?? 0)),
      keepLabelsUpright: saved.keepLabelsUpright ?? true,
      padding: saved.padding ?? 80,
      preset: saved.preset || "REPORT_HD",
      width: saved.width || 3840,
      height: saved.height || 2160,
      dpiScale: saved.dpiScale || 2,
      theme: saved.theme || "LIGHT",
      showGridlines: saved.showGridlines ?? true,
      showDimensions: saved.showDimensions ?? true,
      showElementLabels: saved.showElementLabels ?? true,
      showColumns: saved.showColumns ?? true,
      showBeams: saved.showBeams ?? true,
      showSlabs: saved.showSlabs ?? true,
      showFootings: saved.showFootings ?? true,
      showWalls: saved.showWalls ?? true,
      ghostDisabledElements: saved.ghostDisabledElements ?? false,
      ghostOpacity: saved.ghostOpacity ?? 0.18,
      showTitleBlock: saved.showTitleBlock ?? true,
      titleBlockPosition: saved.titleBlockPosition || "TOP_LEFT",
      projectTitle: saved.projectTitle || projectName,
      blueprintTitle:
        saved.blueprintTitle || "STRUCTURAL 2D SPATIAL GRID BLUEPRINT",
      subtitle:
        saved.subtitle ||
        `Floor Level: ${currentLvlName} | Elements: ${filteredElements.length}`,
      includeTimestamp: saved.includeTimestamp ?? true,
      includeInspector: saved.includeInspector ?? true,
      inspectorName:
        saved.inspectorName || currentUser?.fullName || "QA/QC Engineer",
      inspectorRole:
        saved.inspectorRole || currentUser?.role || "Quality Control Lead",
      revisionText: saved.revisionText || "Rev 01 - Quality Verification",
      showLegend: saved.showLegend ?? true,
      legendPosition: saved.legendPosition || "BOTTOM_HORIZONTAL",
      legendSize: (saved.legendSize as LegendSize) || "STANDARD",
      legendScale: typeof saved.legendScale === "number" ? saved.legendScale : 1.0,
      watermark: saved.watermark || "FOR_CONSTRUCTION",
      customWatermarkText:
        saved.customWatermarkText || "APPROVED FOR CONSTRUCTION",
      format: saved.format || "image/png",
      jpegQuality: saved.jpegQuality || 0.98,
      autoSaveToGallery: saved.autoSaveToGallery ?? false,
      galleryCategory: (saved.galleryCategory as PhotoCategory) || "PROGRESS",
    };
  }, [projectName, currentLvlName, filteredElements.length, currentUser]);

  const [config, setConfig] = useState<GridSnapshotConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState<
    "FRAMING" | "THEME_LAYERS" | "TITLE_STAMP" | "EXPORT"
  >("FRAMING");
  const [previewDataUrl, setPreviewDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Sync title / project defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfig((prev) => ({
        ...prev,
        projectTitle: prev.projectTitle || projectName,
        subtitle: `Floor Level: ${currentLvlName} | Active Layer: ${activeLayer} | Elements: ${filteredElements.length}`,
      }));
    }
  }, [
    isOpen,
    projectName,
    currentLvlName,
    activeLayer,
    filteredElements.length,
  ]);

  // Handle Preset changes
  // Handle Preset changes (respects orientation)
  const handlePresetSelect = (preset: SnapshotPreset) => {
    if (preset === "CUSTOM") {
      setConfig((c) => ({ ...c, preset }));
      return;
    }
    const dim = PRESET_DIMENSIONS[preset];
    const isPortrait = config.orientation === "PORTRAIT";
    const w = isPortrait ? Math.min(dim.w, dim.h) : Math.max(dim.w, dim.h);
    const h = isPortrait ? Math.max(dim.w, dim.h) : Math.min(dim.w, dim.h);
    setConfig((c) => ({
      ...c,
      preset,
      width: w,
      height: h,
    }));
  };

  // Explicit Orientation Switcher (Landscape / Horizontal vs Portrait / Vertical)
  const handleSetOrientation = (orientation: SnapshotOrientation) => {
    setConfig((c) => {
      let w = c.width;
      let h = c.height;
      if (orientation === "LANDSCAPE" && w < h) {
        const temp = w;
        w = h;
        h = temp;
      } else if (orientation === "PORTRAIT" && w > h) {
        const temp = w;
        w = h;
        h = temp;
      }
      return {
        ...c,
        orientation,
        width: w,
        height: h,
      };
    });
  };

  // Instant Flip W ⇄ H
  const handleFlipOrientation = () => {
    setConfig((c) => {
      const nextOrientation: SnapshotOrientation =
        c.width >= c.height ? "PORTRAIT" : "LANDSCAPE";
      return {
        ...c,
        orientation: nextOrientation,
        width: c.height,
        height: c.width,
      };
    });
  };

  // Save as default in localStorage
  const handleSaveDefaults = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      toast.success("Snapshot settings saved as your default!", { icon: "💾" });
    } catch (e) {
      toast.error("Failed to save settings to localStorage");
    }
  };

  // Core Render Engine: Renders the SVG + Overlays to an HTML Canvas
  const renderSnapshotToCanvas = useCallback(
    async (targetScale = 1): Promise<HTMLCanvasElement | null> => {
      if (!svgRef.current) return null;

      const exportWidth = Math.round(config.width * targetScale);
      const exportHeight = Math.round(config.height * targetScale);

      // Clone SVG
      const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
      svgClone.setAttribute("width", exportWidth.toString());
      svgClone.setAttribute("height", exportHeight.toString());
      svgClone.setAttribute("viewBox", `0 0 ${exportWidth} ${exportHeight}`);

      // Manipulate Layers (Handle Disabling & Ghosting)
      const handleLayerVisibility = (layerKey: string, isVisible: boolean) => {
        const nodes = svgClone.querySelectorAll(`[data-layer="${layerKey}"]`);
        if (isVisible) return;

        if (!config.ghostDisabledElements) {
          // Normal mode: completely remove disabled elements
          nodes.forEach((el) => el.remove());
        } else {
          // Ghost mode: keep them faintly visible beneath enabled elements
          const ghostOpacityVal = config.ghostOpacity ?? 0.18;
          nodes.forEach((el) => {
            const element = el as SVGElement;
            // Lower opacity to faint ghost level
            element.setAttribute("opacity", ghostOpacityVal.toString());
            // Style as dashed blueprint wireframe
            element.setAttribute("stroke-dasharray", "4 3");
            element.setAttribute("pointer-events", "none");

            // Strip high-contrast text labels inside disabled element layers so they don't clutter
            element.querySelectorAll('[data-layer="labels"]').forEach((lbl) => lbl.remove());
            element.querySelectorAll("text").forEach((txt) => {
              (txt as SVGElement).setAttribute("opacity", (ghostOpacityVal * 0.8).toString());
            });

            // Ensure ghosted elements are placed underneath other elements by prepending to parent
            if (element.parentNode) {
              element.parentNode.insertBefore(element, element.parentNode.firstChild);
            }
          });
        }
      };

      if (!config.showGridlines) {
        svgClone
          .querySelectorAll('[data-layer="gridlines"]')
          .forEach((el) => el.remove());
      }
      if (!config.showDimensions) {
        svgClone
          .querySelectorAll('[data-layer="dimensions"]')
          .forEach((el) => el.remove());
      }
      if (!config.showElementLabels) {
        svgClone
          .querySelectorAll('[data-layer="labels"]')
          .forEach((el) => el.remove());
      }

      // Structural element layers
      handleLayerVisibility("columns", config.showColumns);
      handleLayerVisibility("beams", config.showBeams);
      handleLayerVisibility("slabs", config.showSlabs);
      handleLayerVisibility("footings", config.showFootings);
      handleLayerVisibility("walls", config.showWalls);

      // Framing, Content Rotation & Scope
      const angle = config.contentRotation || 0;
      const mainGroup = svgClone.querySelector("g");
      if (mainGroup) {
        if (config.scope === "FULL_EXTENTS") {
          const pad = config.padding * targetScale;
          const origW = maxX - minX || 500;
          const origH = maxY - minY || 500;
          const origCx = (minX + maxX) / 2;
          const origCy = (minY + maxY) / 2;

          // When rotated 90 or 270, effective width and height swap
          const isRotated90 = angle === 90 || angle === 270;
          const effectiveW = isRotated90 ? origH : origW;
          const effectiveH = isRotated90 ? origW : origH;

          const scaleW = (exportWidth - pad * 2) / effectiveW;
          const scaleH = (exportHeight - pad * 2) / effectiveH;
          const bestScale = Math.max(Math.min(scaleW, scaleH), 0.05);

          const targetCenterX = exportWidth / 2;
          const targetCenterY = exportHeight / 2;

          mainGroup.setAttribute(
            "transform",
            `translate(${targetCenterX}, ${targetCenterY}) scale(${bestScale}) rotate(${angle}) translate(${-origCx}, ${-origCy})`,
          );
        } else {
          // VIEWPORT: scale screen zoom by resolution ratio, rotated around canvas center
          const screenW = svgRef.current.clientWidth || 1000;
          const ratio = exportWidth / screenW;
          const targetCenterX = exportWidth / 2;
          const targetCenterY = exportHeight / 2;

          mainGroup.setAttribute(
            "transform",
            `translate(${targetCenterX}, ${targetCenterY}) rotate(${angle}) translate(${-targetCenterX}, ${-targetCenterY}) translate(${currentPan.x * ratio}, ${currentPan.y * ratio}) scale(${currentZoom * ratio})`,
          );
        }

        // Counter-rotate text labels to keep them upright and readable if enabled
        if (config.keepLabelsUpright && angle !== 0) {
          svgClone.querySelectorAll("text").forEach((textEl) => {
            const x = parseFloat(textEl.getAttribute("x") || "0");
            const y = parseFloat(textEl.getAttribute("y") || "0");
            if (!isNaN(x) && !isNaN(y)) {
              const prevTransform = textEl.getAttribute("transform") || "";
              textEl.setAttribute(
                "transform",
                `${prevTransform} rotate(${-angle}, ${x}, ${y})`.trim(),
              );
            }
          });
        }
      }

      // Theme Inversion & Line Sharpening for Light Paper / Weekly Report mode
      if (config.theme === "LIGHT") {
        svgClone.querySelectorAll("line").forEach((line) => {
          const stroke = line.getAttribute("stroke");
          if (stroke === "#334155" || stroke === "#475569" || stroke === "#1e293b" || stroke === "#0f172a") {
            line.setAttribute("stroke", "#334155");
          }
          const sw = parseFloat(line.getAttribute("stroke-width") || "1");
          if (sw < 1.6) {
            line.setAttribute("stroke-width", "1.6");
          }
        });
        svgClone
          .querySelectorAll('[data-layer="labels"] rect')
          .forEach((rect) => {
            const fill = rect.getAttribute("fill");
            if (
              fill === "#090d16" ||
              fill === "#0f172a" ||
              fill === "#070b14" ||
              fill === "#1e293b"
            ) {
              rect.setAttribute("fill", "#ffffff");
              rect.setAttribute("fill-opacity", "0.98");
              rect.setAttribute("stroke", "#334155");
              rect.setAttribute("stroke-width", "1.5");
            }
          });
        svgClone
          .querySelectorAll('[data-layer="labels"] text')
          .forEach((text) => {
            const fill = text.getAttribute("fill");
            if (
              fill === "#f8fafc" ||
              fill === "#ffffff" ||
              fill === "#cbd5e1"
            ) {
              text.setAttribute("fill", "#0f172a");
              text.setAttribute("font-weight", "bold");
            } else if (fill === "#94a3b8") {
              text.setAttribute("fill", "#334155");
              text.setAttribute("font-weight", "bold");
            }
          });
        svgClone
          .querySelectorAll('[data-layer="dimensions"] text')
          .forEach((text) => {
            text.setAttribute("fill", "#0f172a");
            text.setAttribute("font-weight", "bold");
          });
      } else {
        // DARK / NAVY: Ensure crisp strokes on high-res canvas
        svgClone.querySelectorAll("line").forEach((line) => {
          const sw = parseFloat(line.getAttribute("stroke-width") || "1");
          if (sw < 1.4) {
            line.setAttribute("stroke-width", "1.4");
          }
        });
      }

      // Ensure all Grid Bubbles have 100% transparent backgrounds with crisp outlines
      svgClone
        .querySelectorAll('[data-layer="gridlines"] circle')
        .forEach((circle) => {
          circle.setAttribute("fill", "transparent");
          circle.setAttribute("fill-opacity", "0");
        });

      // Convert SVG to Data URL via Blob
      const svgString = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      return new Promise<HTMLCanvasElement | null>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = exportWidth;
          canvas.height = exportHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            URL.revokeObjectURL(blobURL);
            resolve(null);
            return;
          }

          // Enable High-Quality Subpixel Smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // 1. Fill Background
          if (config.theme === "DARK") {
            ctx.fillStyle = "#070b14";
            ctx.fillRect(0, 0, exportWidth, exportHeight);
          } else if (config.theme === "LIGHT") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, exportWidth, exportHeight);
          } else if (config.theme === "NAVY") {
            ctx.fillStyle = "#0a1e3b";
            ctx.fillRect(0, 0, exportWidth, exportHeight);
          } else {
            // TRANSPARENT
            ctx.clearRect(0, 0, exportWidth, exportHeight);
          }

          // 2. Draw SVG Plan
          ctx.drawImage(img, 0, 0, exportWidth, exportHeight);
          URL.revokeObjectURL(blobURL);

          // 3. Watermark CAD Stamp (Draw before title block so text remains legible)
          if (config.watermark !== "NONE") {
            ctx.save();
            ctx.translate(exportWidth / 2, exportHeight / 2);
            ctx.rotate((-22 * Math.PI) / 180);

            let stampText = "";
            let stampColor = "#10b981";
            let stampBg = "rgba(16, 185, 129, 0.08)";

            switch (config.watermark) {
              case "FOR_CONSTRUCTION":
                stampText = "APPROVED FOR CONSTRUCTION";
                stampColor = "#10b981";
                stampBg = "rgba(16, 185, 129, 0.1)";
                break;
              case "PRELIMINARY":
                stampText = "PRELIMINARY — NOT FOR CONSTRUCTION";
                stampColor = "#f59e0b";
                stampBg = "rgba(245, 158, 11, 0.1)";
                break;
              case "QA_APPROVED":
                stampText = "QA/QC APPROVED & VERIFIED";
                stampColor = "#059669";
                stampBg = "rgba(5, 150, 105, 0.12)";
                break;
              case "OPEN_DEFECTS":
                stampText = "QA HOLD — RECTIFICATION REQUIRED";
                stampColor = "#ef4444";
                stampBg = "rgba(239, 68, 68, 0.12)";
                break;
              case "CONFIDENTIAL":
                stampText = "CONFIDENTIAL — FOR INTERNAL AUDIT ONLY";
                stampColor = "#64748b";
                stampBg = "rgba(100, 116, 139, 0.1)";
                break;
              case "CUSTOM":
                stampText =
                  config.customWatermarkText.toUpperCase() || "WATERMARK";
                stampColor = "#0284c7";
                stampBg = "rgba(2, 132, 199, 0.1)";
                break;
            }

            const stampFontSize = Math.max(Math.round(exportWidth * 0.032), 24);
            ctx.font = `900 ${stampFontSize}px sans-serif`;
            const textMetrics = ctx.measureText(stampText);
            const boxW = textMetrics.width + 80;
            const boxH = stampFontSize * 2.2;

            ctx.fillStyle = stampBg;
            ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
            ctx.strokeStyle = stampColor;
            ctx.lineWidth = 5 * targetScale;
            ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);

            ctx.fillStyle = stampColor;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(stampText, 0, 0);

            ctx.restore();
          }

          // 4. Engineering Title Block
          if (config.showTitleBlock) {
            const tbW = Math.min(
              620 * targetScale,
              exportWidth - 80 * targetScale,
            );
            const tbH = 136 * targetScale;
            let tbX = 40 * targetScale;
            let tbY = 40 * targetScale;

            if (config.titleBlockPosition === "TOP_RIGHT") {
              tbX = exportWidth - tbW - 40 * targetScale;
            } else if (config.titleBlockPosition === "BOTTOM_LEFT") {
              tbY = exportHeight - tbH - 40 * targetScale;
            }

            // Title Block Background & Border
            ctx.fillStyle =
              config.theme === "LIGHT"
                ? "rgba(248, 250, 252, 0.96)"
                : "rgba(15, 23, 42, 0.94)";
            ctx.fillRect(tbX, tbY, tbW, tbH);
            ctx.strokeStyle = config.theme === "LIGHT" ? "#cbd5e1" : "#334155";
            ctx.lineWidth = 2 * targetScale;
            ctx.strokeRect(tbX, tbY, tbW, tbH);

            // Left accent bar
            ctx.fillStyle = "#0284c7";
            ctx.fillRect(tbX, tbY, 6 * targetScale, tbH);

            const textLeft = tbX + 24 * targetScale;

            // Project Subheader
            ctx.fillStyle = config.theme === "LIGHT" ? "#0284c7" : "#38bdf8";
            ctx.font = `bold ${Math.round(13 * targetScale)}px sans-serif`;
            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";
            ctx.fillText(
              (config.projectTitle || "PROJECT BLUEPRINT").toUpperCase(),
              textLeft,
              tbY + 28 * targetScale,
            );

            // Main Blueprint Title
            ctx.fillStyle = config.theme === "LIGHT" ? "#0f172a" : "#ffffff";
            ctx.font = `bold ${Math.round(18 * targetScale)}px sans-serif`;
            ctx.fillText(
              config.blueprintTitle || "2D SPATIAL GRID BLUEPRINT",
              textLeft,
              tbY + 56 * targetScale,
            );

            // Level & Elements Details
            ctx.fillStyle = config.theme === "LIGHT" ? "#475569" : "#94a3b8";
            ctx.font = `normal ${Math.round(12 * targetScale)}px sans-serif`;
            ctx.fillText(config.subtitle, textLeft, tbY + 80 * targetScale);

            // Inspector & Revision Stamp Line
            const metaParts: string[] = [];
            if (config.includeTimestamp) {
              metaParts.push(new Date().toLocaleString());
            }
            if (config.includeInspector && config.inspectorName) {
              metaParts.push(`Inspector: ${config.inspectorName}`);
            }
            if (config.revisionText) {
              metaParts.push(config.revisionText);
            }

            ctx.fillStyle = config.theme === "LIGHT" ? "#64748b" : "#64748b";
            ctx.font = `normal ${Math.round(10.5 * targetScale)}px monospace`;
            ctx.fillText(
              metaParts.join(" • "),
              textLeft,
              tbY + 104 * targetScale,
            );
          }

          // 5. Integrated Legend Overlay (Horizontal Dock or Floating Card)
          if (config.showLegend) {
            const legScale =
              typeof config.legendScale === "number" && config.legendScale > 0
                ? config.legendScale
                : config.legendSize === "COMPACT"
                  ? 0.75
                  : config.legendSize === "LARGE"
                    ? 1.25
                    : config.legendSize === "XLARGE"
                      ? 1.5
                      : 1.0;

            const isTopHorizontal = config.legendPosition === "TOP_HORIZONTAL";
            const isBottomHorizontal =
              config.legendPosition === "BOTTOM_HORIZONTAL";
            const isHorizontal = isTopHorizontal || isBottomHorizontal;

            if (isHorizontal) {
              const lgW = exportWidth - 64 * targetScale;
              const lgH = Math.round(40 * targetScale * legScale);
              const lgX = 32 * targetScale;
              let lgY = isBottomHorizontal
                ? exportHeight - lgH - 24 * targetScale
                : 24 * targetScale;

              // If top horizontal and title block is also top, push legend just below title block
              if (
                isTopHorizontal &&
                config.showTitleBlock &&
                (config.titleBlockPosition === "TOP_LEFT" ||
                  config.titleBlockPosition === "TOP_RIGHT")
              ) {
                lgY = (40 + 136 + 14) * targetScale;
              }

              // Background Bar
              ctx.fillStyle =
                config.theme === "LIGHT"
                  ? "rgba(248, 250, 252, 0.96)"
                  : "rgba(15, 23, 42, 0.94)";
              ctx.strokeStyle =
                config.theme === "LIGHT" ? "#cbd5e1" : "#0284c7";
              ctx.lineWidth = 1.5 * targetScale * Math.min(legScale, 1.4);

              if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(
                  lgX,
                  lgY,
                  lgW,
                  lgH,
                  8 * targetScale * Math.min(legScale, 1.2),
                );
                ctx.fill();
                ctx.stroke();
              } else {
                ctx.fillRect(lgX, lgY, lgW, lgH);
                ctx.strokeRect(lgX, lgY, lgW, lgH);
              }

              // Left Accent Badge
              const badgeW = Math.round(124 * targetScale * legScale);
              const badgeH = Math.round(26 * targetScale * legScale);
              const badgeX = lgX + 8 * targetScale;
              const badgeY = lgY + (lgH - badgeH) / 2;

              ctx.fillStyle = "#0284c7";
              if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(
                  badgeX,
                  badgeY,
                  badgeW,
                  badgeH,
                  6 * targetScale * Math.min(legScale, 1.2),
                );
                ctx.fill();
              } else {
                ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
              }

              ctx.fillStyle = "#ffffff";
              ctx.font = `bold ${Math.round(11 * targetScale * legScale)}px sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(
                `LEGEND • ${activeLayer}`,
                badgeX + badgeW / 2,
                badgeY + badgeH / 2,
              );

              // Horizontal items
              const startX = badgeX + badgeW + 18 * targetScale * legScale;
              const availableW = lgW - (badgeW + 36 * targetScale * legScale);

              if (activeLayer === "STATUS") {
                const statusItems = [
                  { label: "Pending", color: "#d97706", fill: "#fef3c7" },
                  { label: "Rebar Active", color: "#4338ca", fill: "#e0e7ff" },
                  { label: "Formwork", color: "#7e22ce", fill: "#f3e8ff" },
                  { label: "Ready Cast", color: "#ca8a04", fill: "#fef08a" },
                  { label: "Inspected", color: "#2563eb", fill: "#dbeafe" },
                  { label: "Poured", color: "#0891b2", fill: "#cffaff" },
                  { label: "QA Approved", color: "#059669", fill: "#d1fae5" },
                  { label: "QA Rejected", color: "#dc2626", fill: "#fee2e2" },
                ];
                const colW = availableW / statusItems.length;

                statusItems.forEach((item, idx) => {
                  const ix = startX + idx * colW;
                  const iy = lgY + lgH / 2;
                  const sz = Math.round(12 * targetScale * legScale);

                  ctx.fillStyle = item.fill;
                  ctx.fillRect(ix, iy - sz / 2, sz, sz);
                  ctx.strokeStyle = item.color;
                  ctx.lineWidth = 1.2 * targetScale * Math.min(legScale, 1.3);
                  ctx.strokeRect(ix, iy - sz / 2, sz, sz);

                  ctx.fillStyle =
                    config.theme === "LIGHT" ? "#1e293b" : "#e2e8f0";
                  ctx.font = `bold ${Math.round(10.5 * targetScale * legScale)}px sans-serif`;
                  ctx.textAlign = "left";
                  ctx.textBaseline = "middle";
                  ctx.fillText(
                    item.label,
                    ix + sz + 6 * targetScale * legScale,
                    iy,
                  );
                });
              } else if (activeLayer === "RISK") {
                const riskItems = [
                  { label: "Critical Risk (Open NCR)", color: "#ef4444" },
                  {
                    label: "Moderate Risk (Pending Sign-off)",
                    color: "#f59e0b",
                  },
                  { label: "Low Risk (Compliant Verified)", color: "#10b981" },
                ];
                const colW = Math.min(
                  availableW / riskItems.length,
                  240 * targetScale * legScale,
                );

                riskItems.forEach((item, idx) => {
                  const ix = startX + idx * colW;
                  const iy = lgY + lgH / 2;

                  ctx.fillStyle = item.color;
                  ctx.beginPath();
                  ctx.arc(
                    ix + 6 * targetScale * legScale,
                    iy,
                    Math.round(5 * targetScale * legScale),
                    0,
                    Math.PI * 2,
                  );
                  ctx.fill();

                  ctx.fillStyle =
                    config.theme === "LIGHT" ? "#1e293b" : "#e2e8f0";
                  ctx.font = `bold ${Math.round(11 * targetScale * legScale)}px sans-serif`;
                  ctx.textAlign = "left";
                  ctx.textBaseline = "middle";
                  ctx.fillText(
                    item.label,
                    ix + 16 * targetScale * legScale,
                    iy,
                  );
                });
              } else {
                // Formwork
                const fwItems = [
                  { label: "High Area (> 30 m²)", color: "#059669" },
                  { label: "Medium Area (15 – 30 m²)", color: "#34d399" },
                  { label: "Low Area (< 15 m²)", color: "#a7f3d0" },
                ];
                const colW = Math.min(
                  availableW / fwItems.length,
                  240 * targetScale * legScale,
                );

                fwItems.forEach((item, idx) => {
                  const ix = startX + idx * colW;
                  const iy = lgY + lgH / 2;
                  const sz = Math.round(12 * targetScale * legScale);

                  ctx.fillStyle = item.color;
                  ctx.fillRect(ix, iy - sz / 2, sz, sz);
                  ctx.strokeStyle =
                    config.theme === "LIGHT" ? "#0f172a" : "#ffffff";
                  ctx.lineWidth = 0.8 * targetScale * Math.min(legScale, 1.3);
                  ctx.strokeRect(ix, iy - sz / 2, sz, sz);

                  ctx.fillStyle =
                    config.theme === "LIGHT" ? "#1e293b" : "#e2e8f0";
                  ctx.font = `bold ${Math.round(11 * targetScale * legScale)}px sans-serif`;
                  ctx.textAlign = "left";
                  ctx.textBaseline = "middle";
                  ctx.fillText(
                    item.label,
                    ix + sz + 6 * targetScale * legScale,
                    iy,
                  );
                });
              }
            } else {
              // Floating Box Corner Legend
              const lgW = Math.min(
                Math.round(380 * targetScale * legScale),
                exportWidth - 80 * targetScale,
              );
              const baseH = activeLayer === "STATUS" ? 240 : 160;
              const lgH = Math.min(
                Math.round(baseH * targetScale * legScale),
                exportHeight - 80 * targetScale,
              );
              let lgX = exportWidth - lgW - 40 * targetScale;
              let lgY = exportHeight - lgH - 40 * targetScale;

              if (config.legendPosition === "BOTTOM_LEFT") {
                lgX = 40 * targetScale;
              } else if (config.legendPosition === "TOP_RIGHT") {
                lgY = 40 * targetScale;
              }

              ctx.fillStyle =
                config.theme === "LIGHT"
                  ? "rgba(248, 250, 252, 0.96)"
                  : "rgba(15, 23, 42, 0.94)";
              ctx.fillRect(lgX, lgY, lgW, lgH);
              ctx.strokeStyle = "#0284c7";
              ctx.lineWidth = 1.5 * targetScale * Math.min(legScale, 1.4);
              ctx.strokeRect(lgX, lgY, lgW, lgH);

              // Header Banner
              const bannerH = Math.round(30 * targetScale * legScale);
              ctx.fillStyle = "#0284c7";
              ctx.fillRect(lgX, lgY, lgW, bannerH);
              ctx.fillStyle = "#ffffff";
              ctx.font = `bold ${Math.round(12 * targetScale * legScale)}px sans-serif`;
              ctx.textAlign = "left";
              ctx.textBaseline = "middle";
              ctx.fillText(
                `PLAN LEGEND (${activeLayer} OVERLAY)`,
                lgX + 14 * targetScale * legScale,
                lgY + bannerH / 2,
              );

              if (activeLayer === "STATUS") {
                const statusItems = [
                  { label: "Pending", color: "#d97706", fill: "#fef3c7" },
                  { label: "Rebar Active", color: "#4338ca", fill: "#e0e7ff" },
                  { label: "Formwork", color: "#7e22ce", fill: "#f3e8ff" },
                  { label: "Ready Cast", color: "#ca8a04", fill: "#fef08a" },
                  { label: "Inspected", color: "#2563eb", fill: "#dbeafe" },
                  { label: "Poured", color: "#0891b2", fill: "#cffaff" },
                  { label: "QA Approved", color: "#059669", fill: "#d1fae5" },
                  { label: "QA Rejected", color: "#dc2626", fill: "#fee2e2" },
                ];

                statusItems.forEach((item, idx) => {
                  const col = idx < 4 ? 0 : 1;
                  const row = idx < 4 ? idx : idx - 4;
                  const colSpacing = (lgW - 28 * targetScale * legScale) / 2;
                  const ix =
                    lgX + (14 * targetScale * legScale + col * colSpacing);
                  const iy =
                    lgY +
                    (bannerH +
                      16 * targetScale * legScale +
                      row * 44 * targetScale * legScale);
                  const sz = Math.round(14 * targetScale * legScale);

                  ctx.fillStyle = item.fill;
                  ctx.fillRect(ix, iy - sz / 2, sz, sz);
                  ctx.strokeStyle = item.color;
                  ctx.lineWidth = 1.5 * targetScale * Math.min(legScale, 1.3);
                  ctx.strokeRect(ix, iy - sz / 2, sz, sz);

                  ctx.fillStyle =
                    config.theme === "LIGHT" ? "#1e293b" : "#e2e8f0";
                  ctx.font = `normal ${Math.round(11 * targetScale * legScale)}px sans-serif`;
                  ctx.textAlign = "left";
                  ctx.textBaseline = "middle";
                  ctx.fillText(
                    item.label,
                    ix + sz + 8 * targetScale * legScale,
                    iy,
                  );
                });
              } else if (activeLayer === "RISK") {
                const riskItems = [
                  { label: "Critical Risk (Open NCR)", color: "#ef4444" },
                  {
                    label: "Moderate Risk (Pending Sign-off)",
                    color: "#f59e0b",
                  },
                  { label: "Low Risk (Compliant Verified)", color: "#10b981" },
                ];

                riskItems.forEach((item, idx) => {
                  const ix = lgX + 16 * targetScale * legScale;
                  const iy =
                    lgY +
                    (bannerH +
                      20 * targetScale * legScale +
                      idx * 36 * targetScale * legScale);
                  const dotR = Math.round(6 * targetScale * legScale);

                  ctx.fillStyle = item.color;
                  ctx.beginPath();
                  ctx.arc(
                    ix + dotR,
                    iy,
                    dotR,
                    0,
                    Math.PI * 2,
                  );
                  ctx.fill();

                  ctx.fillStyle =
                    config.theme === "LIGHT" ? "#1e293b" : "#e2e8f0";
                  ctx.font = `normal ${Math.round(11.5 * targetScale * legScale)}px sans-serif`;
                  ctx.textAlign = "left";
                  ctx.textBaseline = "middle";
                  ctx.fillText(
                    item.label,
                    ix + dotR * 2 + 10 * targetScale * legScale,
                    iy,
                  );
                });
              } else {
                // Formwork
                const fwItems = [
                  { label: "High Area (> 30 m²)", color: "#059669" },
                  { label: "Medium Area (15 – 30 m²)", color: "#34d399" },
                  { label: "Low Area (< 15 m²)", color: "#a7f3d0" },
                ];

                fwItems.forEach((item, idx) => {
                  const ix = lgX + 16 * targetScale * legScale;
                  const iy =
                    lgY +
                    (bannerH +
                      20 * targetScale * legScale +
                      idx * 36 * targetScale * legScale);
                  const sz = Math.round(14 * targetScale * legScale);

                  ctx.fillStyle = item.color;
                  ctx.fillRect(
                    ix,
                    iy - sz / 2,
                    sz,
                    sz,
                  );
                  ctx.strokeStyle =
                    config.theme === "LIGHT" ? "#0f172a" : "#ffffff";
                  ctx.lineWidth = 1.0 * targetScale * Math.min(legScale, 1.3);
                  ctx.strokeRect(ix, iy - sz / 2, sz, sz);

                  ctx.fillStyle =
                    config.theme === "LIGHT" ? "#1e293b" : "#e2e8f0";
                  ctx.font = `normal ${Math.round(11.5 * targetScale * legScale)}px sans-serif`;
                  ctx.textAlign = "left";
                  ctx.textBaseline = "middle";
                  ctx.fillText(
                    item.label,
                    ix + sz + 8 * targetScale * legScale,
                    iy,
                  );
                });
              }
            }
          }

          resolve(canvas);
        };

        img.onerror = (err) => {
          console.error("SVG Image load error for snapshot:", err);
          URL.revokeObjectURL(blobURL);
          resolve(null);
        };

        img.src = blobURL;
      });
    },
    [
      svgRef,
      config,
      minX,
      maxX,
      minY,
      maxY,
      currentPan,
      currentZoom,
      activeLayer,
    ],
  );

  // Debounced Live Preview Generator
  const updatePreview = useCallback(async () => {
    if (!isOpen || !svgRef.current) return;
    setIsGenerating(true);
    setPreviewError(null);

    try {
      // Use low scale (0.5x or capped at 800px) for ultra-fast instant live preview
      const previewScale = Math.min(800 / config.width, 0.6);
      const previewCanvas = await renderSnapshotToCanvas(previewScale);
      if (previewCanvas) {
        setPreviewDataUrl(previewCanvas.toDataURL("image/jpeg", 0.85));
      } else {
        setPreviewError("Could not render blueprint preview");
      }
    } catch (e: any) {
      console.error("Preview render failed:", e);
      setPreviewError(e?.message || "Preview failed");
    } finally {
      setIsGenerating(false);
    }
  }, [isOpen, svgRef, config, renderSnapshotToCanvas]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updatePreview();
    }, 120);
    return () => clearTimeout(timer);
  }, [updatePreview]);

  // Download Handler
  const handleDownload = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Generating high-resolution snapshot...");

    try {
      const finalScale = config.dpiScale || 1;
      const canvas = await renderSnapshotToCanvas(finalScale);
      if (!canvas) throw new Error("Canvas initialization failed");

      const cleanProj = (config.projectTitle || "Project").replace(
        /[^a-zA-Z0-9]/g,
        "_",
      );
      const cleanLvl = currentLvlName.replace(/[^a-zA-Z0-9]/g, "_");
      const ext =
        config.format === "image/jpeg"
          ? "jpg"
          : config.format === "image/webp"
            ? "webp"
            : "png";
      const fileName = `GridPlan_${cleanProj}_${cleanLvl}_${config.preset}_${Date.now()}.${ext}`;

      const dataUrl = canvas.toDataURL(config.format, config.jpegQuality);
      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Auto-save to gallery if toggled
      if (config.autoSaveToGallery && projectId) {
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], fileName, { type: config.format });
          let photoUrl = "";
          try {
            const uploadRes = await uploadImage(
              file,
              `jqms/photos/${projectId}`,
            );
            photoUrl = uploadRes.url;
          } catch (uploadErr) {
            photoUrl = dataUrl;
          }

          const caption = `${config.blueprintTitle} — ${currentLvlName} (${config.width}x${config.height}, ${config.preset})`;

          await syncPhotoToSiteGallery({
            projectId,
            companyId,
            url: photoUrl,
            thumbnailUrl: photoUrl.startsWith("http")
              ? getThumbnail(photoUrl, 300)
              : photoUrl,
            caption,
            floorLevel: currentLvlName,
            category: config.galleryCategory,
            tradeName: "Structural / 2D Grid Plan",
            uploadedBy:
              currentUser?.fullName || config.inspectorName || "QA/QC Engineer",
            uploaderRole:
              currentUser?.role || config.inspectorRole || "QA/QC Engineer",
            sourceModule: "2DGridPlan",
            sourceId: `grid-2d-${Date.now()}`,
          });
        }, config.format);
      }

      toast.success(
        `Exported ${config.width * finalScale}×${config.height * finalScale}px snapshot!`,
        { id: toastId },
      );
      onClose();
    } catch (err: any) {
      toast.error(`Export failed: ${err.message || "Unknown error"}`, {
        id: toastId,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Copy to Clipboard Handler
  const handleCopyToClipboard = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Rendering snapshot for clipboard...");

    try {
      const canvas = await renderSnapshotToCanvas(config.dpiScale || 1);
      if (!canvas) throw new Error("Could not create canvas");

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Could not generate image blob");
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
          toast.success("Snapshot copied to clipboard! (Ctrl+V to paste)", {
            id: toastId,
          });
        } catch (clipboardErr) {
          toast.error(
            "Clipboard permission denied by browser. Try direct download.",
            { id: toastId },
          );
        }
      }, "image/png");
    } catch (e: any) {
      toast.error(`Copy failed: ${e?.message || "Unknown error"}`, {
        id: toastId,
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/25">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  2D Blueprint Snapshot Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-500/30">
                  Fluid Settings
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure framing, resolution, visual themes, layers, and
                engineering title block
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
              title="Save current configuration as your default for future snapshots"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Set as Default</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left Column: Live Interactive Preview */}
          <div className="lg:col-span-7 p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
            <div className="w-full flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Live Snapshot Preview
                </span>
                {isGenerating && (
                  <div className="flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Rendering...</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {config.width * (config.dpiScale || 1)} ×{" "}
                  {config.height * (config.dpiScale || 1)} px
                </span>
                <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  {config.format.replace("image/", "").toUpperCase()}
                </span>
              </div>
            </div>

            {/* Preview Viewport Frame */}
            <div className="relative w-full flex-1 max-h-[500px] flex items-center justify-center bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 overflow-hidden shadow-inner">
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Snapshot Preview"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-300"
                />
              ) : (
                <div className="text-center p-8">
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-slate-400">
                    Rendering preview canvas...
                  </p>
                </div>
              )}

              {previewError && (
                <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <p className="text-xs text-red-300 font-semibold">
                    {previewError}
                  </p>
                </div>
              )}
            </div>

            {/* Framing Summary Pills */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400">
              <span>
                Scope:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {config.scope === "FULL_EXTENTS"
                    ? "Full Extents (All Elements)"
                    : "Current Viewport"}
                </strong>
              </span>
              <span>
                Layout:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {config.orientation === "PORTRAIT"
                    ? "Portrait / Vertical"
                    : "Landscape / Horizontal"}
                </strong>
              </span>
              <span>
                Theme:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {config.theme}
                </strong>
              </span>
              <span>
                Stamp:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {config.watermark !== "NONE" ? config.watermark : "None"}
                </strong>
              </span>
            </div>
          </div>

          {/* Right Column: Fluid Controls Studio */}
          <div className="lg:col-span-5 flex flex-col min-h-0 bg-white dark:bg-slate-900">
            {/* Tabs Header */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-3 pt-2 gap-1 bg-slate-50/70 dark:bg-slate-900/70">
              <button
                onClick={() => setActiveTab("FRAMING")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl border-b-2 transition ${
                  activeTab === "FRAMING"
                    ? "border-brand-600 text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-900 shadow-sm"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Size & Framing</span>
              </button>

              <button
                onClick={() => setActiveTab("THEME_LAYERS")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl border-b-2 transition ${
                  activeTab === "THEME_LAYERS"
                    ? "border-brand-600 text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-900 shadow-sm"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Theme & Layers</span>
              </button>

              <button
                onClick={() => setActiveTab("TITLE_STAMP")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl border-b-2 transition ${
                  activeTab === "TITLE_STAMP"
                    ? "border-brand-600 text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-900 shadow-sm"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Title & Stamp</span>
              </button>

              <button
                onClick={() => setActiveTab("EXPORT")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl border-b-2 transition ${
                  activeTab === "EXPORT"
                    ? "border-brand-600 text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-900 shadow-sm"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>

            {/* Tab Contents: Scrollable */}
            <div className="flex-1 p-5 overflow-y-auto space-y-5">
              {/* TAB 1: SIZE & FRAMING */}
              {activeTab === "FRAMING" && (
                <div className="space-y-4">
                  {/* Grid & Elements Array Orientation (Content Rotation) */}
                  <div className="p-3.5 rounded-2xl bg-brand-50/40 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Grid & Elements Array Layout
                        </label>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setConfig((c) => ({
                              ...c,
                              contentRotation: (((c.contentRotation - 90 + 360) % 360) as ContentRotation),
                            }))
                          }
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1 shadow-sm"
                          title="Rotate grid array 90° Counter-Clockwise"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="text-[10px]">-90°</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfig((c) => ({
                              ...c,
                              contentRotation: (((c.contentRotation + 90) % 360) as ContentRotation),
                            }))
                          }
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1 shadow-sm"
                          title="Rotate grid array 90° Clockwise"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span className="text-[10px]">+90°</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Orient the actual structural gridlines and elements array horizontally (landscape) or vertically across the blueprint:
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setConfig((c) => ({ ...c, contentRotation: 0 }))}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                          config.contentRotation === 0
                            ? "bg-white dark:bg-slate-900 border-brand-500 text-brand-900 dark:text-brand-200 shadow-md ring-1 ring-brand-500"
                            : "bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-black text-xs">
                          0°
                        </div>
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1">
                            <span>Standard (0°)</span>
                            {config.contentRotation === 0 && <Check className="w-3 h-3 text-brand-600" />}
                          </div>
                          <div className="text-[10px] text-slate-500">Default grid array</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfig((c) => ({ ...c, contentRotation: 90 }))}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                          config.contentRotation === 90
                            ? "bg-white dark:bg-slate-900 border-brand-500 text-brand-900 dark:text-brand-200 shadow-md ring-1 ring-brand-500"
                            : "bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-black text-xs">
                          90°
                        </div>
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1">
                            <span>Landscape (90° CW)</span>
                            {config.contentRotation === 90 && <Check className="w-3 h-3 text-brand-600" />}
                          </div>
                          <div className="text-[10px] text-slate-500">Horizontal array view</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfig((c) => ({ ...c, contentRotation: 180 }))}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                          config.contentRotation === 180
                            ? "bg-white dark:bg-slate-900 border-brand-500 text-brand-900 dark:text-brand-200 shadow-md ring-1 ring-brand-500"
                            : "bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-black text-xs">
                          180°
                        </div>
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1">
                            <span>Inverted (180°)</span>
                            {config.contentRotation === 180 && <Check className="w-3 h-3 text-brand-600" />}
                          </div>
                          <div className="text-[10px] text-slate-500">Inverted array view</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfig((c) => ({ ...c, contentRotation: 270 }))}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                          config.contentRotation === 270
                            ? "bg-white dark:bg-slate-900 border-brand-500 text-brand-900 dark:text-brand-200 shadow-md ring-1 ring-brand-500"
                            : "bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-black text-xs">
                          270°
                        </div>
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1">
                            <span>Landscape (270° CCW)</span>
                            {config.contentRotation === 270 && <Check className="w-3 h-3 text-brand-600" />}
                          </div>
                          <div className="text-[10px] text-slate-500">Horizontal flipped array</div>
                        </div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-brand-200/50 dark:border-brand-800/40">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        Keep axis bubbles & element labels upright when rotated
                      </label>
                      <input
                        type="checkbox"
                        checked={config.keepLabelsUpright}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            keepLabelsUpright: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 accent-brand-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Capture Framing Scope
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setConfig((c) => ({ ...c, scope: "FULL_EXTENTS" }))
                        }
                        className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 ${
                          config.scope === "FULL_EXTENTS"
                            ? "bg-brand-50/50 dark:bg-brand-950/30 border-brand-500 text-brand-900 dark:text-brand-200"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        <span className="font-bold text-xs flex items-center justify-between">
                          <span>Full Extents</span>
                          {config.scope === "FULL_EXTENTS" && (
                            <Check className="w-3.5 h-3.5 text-brand-600" />
                          )}
                        </span>
                        <span className="text-[11px] opacity-75">
                          Auto-fit entire floor plan & gridlines
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setConfig((c) => ({ ...c, scope: "VIEWPORT" }))
                        }
                        className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 ${
                          config.scope === "VIEWPORT"
                            ? "bg-brand-50/50 dark:bg-brand-950/30 border-brand-500 text-brand-900 dark:text-brand-200"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        <span className="font-bold text-xs flex items-center justify-between">
                          <span>Current Viewport</span>
                          {config.scope === "VIEWPORT" && (
                            <Check className="w-3.5 h-3.5 text-brand-600" />
                          )}
                        </span>
                        <span className="text-[11px] opacity-75">
                          WYSIWYG: exactly what you see on screen
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Framing Padding Slider */}
                  {config.scope === "FULL_EXTENTS" && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Framing Margin / Breathing Room
                        </label>
                        <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                          {config.padding} px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="200"
                        step="10"
                        value={config.padding}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            padding: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-brand-600"
                      />
                    </div>
                  )}

                  {/* Layout Orientation Selector: Landscape vs Portrait */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Layout Orientation
                      </label>
                      <button
                        type="button"
                        onClick={handleFlipOrientation}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold text-brand-600 dark:text-brand-400 transition"
                        title="Swap width and height (flip canvas orientation 90 degrees)"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>Swap W ⇄ H</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetOrientation("LANDSCAPE")}
                        className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                          config.orientation === "LANDSCAPE"
                            ? "bg-brand-50/50 dark:bg-brand-950/30 border-brand-500 text-brand-900 dark:text-brand-200"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        <div className="w-9 h-6 border-2 border-current rounded flex items-center justify-center font-mono font-black text-[9px] shadow-sm flex-shrink-0">
                          16:9
                        </div>
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1.5">
                            <span>Landscape / Horizontal</span>
                            {config.orientation === "LANDSCAPE" && (
                              <Check className="w-3.5 h-3.5 text-brand-600" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Wide blueprint display
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetOrientation("PORTRAIT")}
                        className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                          config.orientation === "PORTRAIT"
                            ? "bg-brand-50/50 dark:bg-brand-950/30 border-brand-500 text-brand-900 dark:text-brand-200"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        <div className="w-6 h-9 border-2 border-current rounded flex items-center justify-center font-mono font-black text-[9px] shadow-sm flex-shrink-0">
                          9:16
                        </div>
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1.5">
                            <span>Portrait / Vertical</span>
                            {config.orientation === "PORTRAIT" && (
                              <Check className="w-3.5 h-3.5 text-brand-600" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Vertical sheet & mobile reports
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Resolution Presets */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Resolution & Canvas Presets
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(PRESET_DIMENSIONS) as SnapshotPreset[]).map(
                        (key) => {
                          const p = PRESET_DIMENSIONS[key];
                          const isSelected = config.preset === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handlePresetSelect(key)}
                              className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                                isSelected
                                  ? "bg-brand-50/50 dark:bg-brand-950/30 border-brand-500 text-brand-900 dark:text-brand-200"
                                  : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                              }`}
                            >
                              <span className="font-bold text-xs flex items-center justify-between">
                                <span>{p.label}</span>
                                {isSelected && (
                                  <Check className="w-3 h-3 text-brand-600" />
                                )}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                {p.desc}
                              </span>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>

                  {/* Custom Dimensions if selected */}
                  {config.preset === "CUSTOM" && (
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Width (px)
                        </label>
                        <input
                          type="number"
                          min="640"
                          max="7680"
                          value={config.width}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              width: Math.max(200, Number(e.target.value)),
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Height (px)
                        </label>
                        <input
                          type="number"
                          min="480"
                          max="4320"
                          value={config.height}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              height: Math.max(200, Number(e.target.value)),
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  )}

                  {/* DPI / Scale Multiplier */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      DPI / Quality Multiplier
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          scale: 1,
                          label: "1x Standard",
                          desc: "Fast & light",
                        },
                        { scale: 2, label: "2x Retina", desc: "Crisp display" },
                        {
                          scale: 3,
                          label: "3x Ultra Print",
                          desc: "Architectural 300 DPI",
                        },
                      ].map((item) => (
                        <button
                          key={item.scale}
                          type="button"
                          onClick={() =>
                            setConfig((c) => ({ ...c, dpiScale: item.scale }))
                          }
                          className={`p-2 rounded-xl border text-center transition ${
                            config.dpiScale === item.scale
                              ? "bg-brand-50/50 dark:bg-brand-950/30 border-brand-500 text-brand-700 dark:text-brand-300 font-bold"
                              : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <div className="text-xs">{item.label}</div>
                          <div className="text-[10px] text-slate-500">
                            {item.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: THEME & LAYERS */}
              {activeTab === "THEME_LAYERS" && (
                <div className="space-y-4">
                  {/* Theme Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Visual Blueprint Theme
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          id: "DARK" as SnapshotTheme,
                          label: "Cyber Dark Blueprint",
                          color: "bg-[#070b14] border-slate-700 text-white",
                        },
                        {
                          id: "LIGHT" as SnapshotTheme,
                          label: "Architectural White Paper",
                          color: "bg-white border-slate-300 text-slate-900",
                        },
                        {
                          id: "NAVY" as SnapshotTheme,
                          label: "Classic CAD Navy",
                          color: "bg-[#0a1e3b] border-blue-900 text-white",
                        },
                        {
                          id: "TRANSPARENT" as SnapshotTheme,
                          label: "Transparent (No BG)",
                          color:
                            "bg-transparent border-dashed border-slate-400 text-slate-700 dark:text-slate-300",
                        },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() =>
                            setConfig((c) => ({ ...c, theme: t.id }))
                          }
                          className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                            config.theme === t.id
                              ? "ring-2 ring-brand-500 border-transparent shadow"
                              : "hover:border-slate-400"
                          } ${t.color}`}
                        >
                          <span className="text-xs font-bold">{t.label}</span>
                          {config.theme === t.id && (
                            <Check className="w-3.5 h-3.5 text-brand-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Granular Layer Toggles */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Layer Visibility
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "showGridlines", label: "Gridlines & Bubbles" },
                        { key: "showDimensions", label: "Metric Dimensions" },
                        {
                          key: "showElementLabels",
                          label: "Element Text Labels",
                        },
                        { key: "showColumns", label: "Columns Layer" },
                        { key: "showBeams", label: "Beams Layer" },
                        { key: "showSlabs", label: "Slabs Layer" },
                        { key: "showFootings", label: "Footings & Piles" },
                        { key: "showWalls", label: "Structural Walls" },
                      ].map(({ key, label }) => {
                        const val = (config as any)[key];
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() =>
                              setConfig((c) => ({ ...c, [key]: !val }))
                            }
                            className={`px-3 py-2 rounded-xl border text-left flex items-center justify-between transition text-xs ${
                              val
                                ? "bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                                : "bg-transparent border-dashed border-slate-200 dark:border-slate-800 text-slate-400"
                            }`}
                          >
                            <span>{label}</span>
                            {val ? (
                              <Eye className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Faint Ghost Underlay for Disabled Elements */}
                    <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Ghost className={`w-4 h-4 ${config.ghostDisabledElements ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">
                              Show Disabled Elements Underneath
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                              Render inactive layers faintly beneath enabled elements as blueprint reference
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setConfig((c) => ({
                              ...c,
                              ghostDisabledElements: !c.ghostDisabledElements,
                            }))
                          }
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            config.ghostDisabledElements
                              ? 'bg-indigo-600 dark:bg-indigo-500'
                              : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              config.ghostDisabledElements ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {config.ghostDisabledElements && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            Faint Opacity ({Math.round((config.ghostOpacity ?? 0.18) * 100)}%)
                          </span>
                          <input
                            type="range"
                            min="0.05"
                            max="0.45"
                            step="0.02"
                            value={config.ghostOpacity ?? 0.18}
                            onChange={(e) =>
                              setConfig((c) => ({
                                ...c,
                                ghostOpacity: parseFloat(e.target.value),
                              }))
                            }
                            className="w-36 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Element Label Callout Detail Level */}
                  {config.showElementLabels && (
                    <div className="p-3.5 rounded-2xl bg-brand-50/40 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800/60 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                          <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Label Callout Detail Level
                          </label>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                          {labelDetailMode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Choose how much engineering notation is stamped directly onto structural elements:
                      </p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          {
                            id: "COMPACT" as const,
                            label: "Compact",
                            desc: "C1, B1, S1, W1",
                          },
                          {
                            id: "STANDARD" as const,
                            label: "Standard",
                            desc: "COL-01, BEAM-104",
                          },
                          {
                            id: "DETAILED" as const,
                            label: "Detailed Specs",
                            desc: "C1 · 450×450 · C35",
                          },
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => onLabelDetailModeChange?.(mode.id)}
                            className={`p-2 rounded-xl border text-center transition ${
                              labelDetailMode === mode.id
                                ? "bg-brand-600 border-brand-600 text-white font-bold shadow-sm"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                            }`}
                          >
                            <div className="text-xs font-bold">{mode.label}</div>
                            <div
                              className={`text-[9px] mt-0.5 truncate ${
                                labelDetailMode === mode.id
                                  ? "text-brand-100"
                                  : "text-slate-400"
                              }`}
                            >
                              {mode.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TITLE & STAMP */}
              {activeTab === "TITLE_STAMP" && (
                <div className="space-y-4">
                  {/* Title Block Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        Engineering Title Block
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Draws professional header with project, level, and
                        metadata
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.showTitleBlock}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          showTitleBlock: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-brand-600 rounded cursor-pointer"
                    />
                  </div>

                  {config.showTitleBlock && (
                    <div className="space-y-3 pl-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Project Header
                        </label>
                        <input
                          type="text"
                          value={config.projectTitle}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              projectTitle: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                          placeholder="Project Name"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Blueprint Title
                        </label>
                        <input
                          type="text"
                          value={config.blueprintTitle}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              blueprintTitle: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                          placeholder="STRUCTURAL 2D SPATIAL GRID BLUEPRINT"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            QA Inspector
                          </label>
                          <input
                            type="text"
                            value={config.inspectorName}
                            onChange={(e) =>
                              setConfig((c) => ({
                                ...c,
                                inspectorName: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Revision / Note
                          </label>
                          <input
                            type="text"
                            value={config.revisionText}
                            onChange={(e) =>
                              setConfig((c) => ({
                                ...c,
                                revisionText: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Position
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(
                            [
                              "TOP_LEFT",
                              "TOP_RIGHT",
                              "BOTTOM_LEFT",
                            ] as TitleBlockPos[]
                          ).map((pos) => (
                            <button
                              key={pos}
                              type="button"
                              onClick={() =>
                                setConfig((c) => ({
                                  ...c,
                                  titleBlockPosition: pos,
                                }))
                              }
                              className={`py-1 px-2 rounded-lg border text-center text-xs ${
                                config.titleBlockPosition === pos
                                  ? "bg-brand-50 dark:bg-brand-950 border-brand-500 font-bold text-brand-600"
                                  : "border-slate-200 dark:border-slate-800 text-slate-500"
                              }`}
                            >
                              {pos.replace("_", " ")}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Watermark CAD Stamp */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Watermark / CAD Engineering Stamp
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "NONE" as WatermarkType, label: "No Stamp" },
                        {
                          id: "FOR_CONSTRUCTION" as WatermarkType,
                          label: "Approved For Construction",
                        },
                        {
                          id: "PRELIMINARY" as WatermarkType,
                          label: "Preliminary / Review",
                        },
                        {
                          id: "QA_APPROVED" as WatermarkType,
                          label: "QA/QC Verified Seal",
                        },
                        {
                          id: "OPEN_DEFECTS" as WatermarkType,
                          label: "QA Hold / Rectification",
                        },
                        {
                          id: "CONFIDENTIAL" as WatermarkType,
                          label: "Confidential / Internal",
                        },
                        {
                          id: "CUSTOM" as WatermarkType,
                          label: "Custom Stamp Text",
                        },
                      ].map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() =>
                            setConfig((c) => ({ ...c, watermark: w.id }))
                          }
                          className={`p-2 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition ${
                            config.watermark === w.id
                              ? "bg-brand-50/50 dark:bg-brand-950/30 border-brand-500 text-brand-700 dark:text-brand-300 font-bold"
                              : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                          }`}
                        >
                          <span>{w.label}</span>
                          {config.watermark === w.id && (
                            <Check className="w-3 h-3 text-brand-600" />
                          )}
                        </button>
                      ))}
                    </div>

                    {config.watermark === "CUSTOM" && (
                      <input
                        type="text"
                        value={config.customWatermarkText}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            customWatermarkText: e.target.value,
                          }))
                        }
                        className="mt-2 w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                        placeholder="ENTER CUSTOM WATERMARK TEXT"
                      />
                    )}
                  </div>

                  {/* Integrated Legend */}
                  <div className="space-y-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          Integrated Plan Legend
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Renders color-coded status / risk / formwork key
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.showLegend}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            showLegend: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 accent-brand-600 rounded cursor-pointer"
                      />
                    </div>

                    {config.showLegend && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          Legend Placement & Alignment
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            {
                              id: "BOTTOM_HORIZONTAL" as LegendPos,
                              label: "Bottom Ribbon (Clear)",
                              desc: "Horizontal footer bar",
                            },
                            {
                              id: "TOP_HORIZONTAL" as LegendPos,
                              label: "Top Ribbon (Clear)",
                              desc: "Horizontal header bar",
                            },
                            {
                              id: "BOTTOM_RIGHT" as LegendPos,
                              label: "Bottom-Right Card",
                              desc: "Floating box",
                            },
                            {
                              id: "BOTTOM_LEFT" as LegendPos,
                              label: "Bottom-Left Card",
                              desc: "Floating box",
                            },
                          ].map((pos) => (
                            <button
                              key={pos.id}
                              type="button"
                              onClick={() =>
                                setConfig((c) => ({
                                  ...c,
                                  legendPosition: pos.id,
                                }))
                              }
                              className={`p-2 rounded-xl border text-left transition ${
                                config.legendPosition === pos.id
                                  ? "bg-brand-50/70 dark:bg-brand-950/40 border-brand-500 text-brand-700 dark:text-brand-300 font-bold shadow-xs"
                                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                              }`}
                            >
                              <div className="text-xs font-bold">
                                {pos.label}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {pos.desc}
                              </div>
                            </button>
                          ))}
                        </div>

                        {/* Legend Size & Scaling Controls */}
                        <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                              Legend Size &amp; Scale
                            </label>
                            <span className="px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-mono text-[11px] font-bold border border-brand-200 dark:border-brand-800">
                              {Math.round((config.legendScale ?? 1.0) * 100)}%
                            </span>
                          </div>

                          {/* Quick Size Presets */}
                          <div className="grid grid-cols-4 gap-1.5">
                            {[
                              {
                                id: "COMPACT" as LegendSize,
                                scale: 0.75,
                                label: "Compact",
                                sub: "75%",
                              },
                              {
                                id: "STANDARD" as LegendSize,
                                scale: 1.0,
                                label: "Standard",
                                sub: "100%",
                              },
                              {
                                id: "LARGE" as LegendSize,
                                scale: 1.25,
                                label: "Large",
                                sub: "125%",
                              },
                              {
                                id: "XLARGE" as LegendSize,
                                scale: 1.5,
                                label: "X-Large",
                                sub: "150%",
                              },
                            ].map((preset) => {
                              const isActive =
                                config.legendSize === preset.id ||
                                Math.abs(
                                  (config.legendScale ?? 1.0) - preset.scale,
                                ) < 0.03;
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() =>
                                    setConfig((c) => ({
                                      ...c,
                                      legendSize: preset.id,
                                      legendScale: preset.scale,
                                    }))
                                  }
                                  className={`py-1.5 px-1 rounded-lg border text-center transition cursor-pointer ${
                                    isActive
                                      ? "bg-brand-50 dark:bg-brand-950/50 border-brand-500 text-brand-700 dark:text-brand-300 font-bold shadow-xs"
                                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                                  }`}
                                >
                                  <div className="text-[11px] font-bold leading-tight">
                                    {preset.label}
                                  </div>
                                  <div className="text-[9px] text-slate-400 leading-tight">
                                    {preset.sub}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Fine-Tuning Slider */}
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span>50% (Small)</span>
                              <span>200% (Maximum)</span>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="2.0"
                              step="0.05"
                              value={config.legendScale ?? 1.0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setConfig((c) => ({
                                  ...c,
                                  legendScale: val,
                                  legendSize:
                                    val === 0.75
                                      ? "COMPACT"
                                      : val === 1.0
                                        ? "STANDARD"
                                        : val === 1.25
                                          ? "LARGE"
                                          : val === 1.5
                                            ? "XLARGE"
                                            : "CUSTOM",
                                }));
                              }}
                              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
                            />
                            {(config.legendScale ?? 1.0) !== 1.0 && (
                              <div className="flex justify-end pt-0.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfig((c) => ({
                                      ...c,
                                      legendSize: "STANDARD",
                                      legendScale: 1.0,
                                    }))
                                  }
                                  className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline font-semibold cursor-pointer"
                                >
                                  Reset to 100% Default
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: EXPORT & ACTIONS */}
              {activeTab === "EXPORT" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Image Output Format
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          fmt: "image/png" as ExportFormat,
                          label: "PNG",
                          desc: "Lossless crisp linework",
                        },
                        {
                          fmt: "image/jpeg" as ExportFormat,
                          label: "JPEG",
                          desc: "Smaller compressed file",
                        },
                        {
                          fmt: "image/webp" as ExportFormat,
                          label: "WebP",
                          desc: "Modern web efficiency",
                        },
                      ].map((item) => (
                        <button
                          key={item.fmt}
                          type="button"
                          onClick={() =>
                            setConfig((c) => ({ ...c, format: item.fmt }))
                          }
                          className={`p-2.5 rounded-xl border text-center transition ${
                            config.format === item.fmt
                              ? "bg-brand-50/50 dark:bg-brand-950/30 border-brand-500 text-brand-700 dark:text-brand-300 font-bold"
                              : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <div className="text-xs">{item.label}</div>
                          <div className="text-[10px] text-slate-500">
                            {item.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {config.format === "image/jpeg" && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          JPEG Quality Scale
                        </label>
                        <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                          {Math.round(config.jpegQuality * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.6"
                        max="1.0"
                        step="0.05"
                        value={config.jpegQuality}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            jpegQuality: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-brand-600"
                      />
                    </div>
                  )}

                  {/* Universal Site Photo Gallery Sync */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <UploadCloud className="w-4 h-4 text-brand-600" />
                          <span>Sync to Universal Site Photo Gallery</span>
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Automatically registers snapshot under this project &
                          level
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.autoSaveToGallery}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            autoSaveToGallery: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 accent-brand-600 rounded cursor-pointer"
                      />
                    </div>

                    {config.autoSaveToGallery && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Photo Category Tag
                        </label>
                        <select
                          value={config.galleryCategory}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              galleryCategory: e.target.value as any,
                            }))
                          }
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                        >
                          <option value="PROGRESS">
                            Project Progress Record
                          </option>
                          <option value="QUALITY_DEFECT">
                            Quality Defect / NCR Audit
                          </option>
                          <option value="MATERIAL">
                            Material & Blueprint Spec
                          </option>
                          <option value="POUR">
                            Pour & Casting Inspection
                          </option>
                          <option value="SAFETY">Safety & Access Plan</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Output:{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {config.width * (config.dpiScale || 1)} ×{" "}
                  {config.height * (config.dpiScale || 1)} px
                </strong>{" "}
                ({config.format.replace("image/", "").toUpperCase()})
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition shadow-sm disabled:opacity-50"
                  title="Copy snapshot directly to OS clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Copied!
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy to Clipboard</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition shadow-lg shadow-brand-500/25 disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download Snapshot</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
