import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  StructuralElement,
  ElementStatus,
  ProjectLevel,
  Gridline,
} from "@/types";
import {
  Box,
  Layers,
  Maximize2,
  RotateCcw,
  Info,
  Grid,
  Building2,
  Sliders,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  ClipboardCheck,
  AlertTriangle,
  Camera,
  Download,
  CheckSquare,
  Square,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { uploadImage, getThumbnail } from "@/lib/cloudinary";
import { syncPhotoToSiteGallery } from "@/lib/photoSync";
import { toast } from "react-hot-toast";
import {
  buildGridSystemGeometry,
  resolveElementGridCoords,
  GridSystemGeometry,
} from "@/lib/gridUtils";

export interface BIMViewer3DProps {
  elements: StructuralElement[];
  levels?: ProjectLevel[];
  gridlines?: Gridline[];
  onSelectElement?: (element: StructuralElement | null) => void;
  onSelectElements?: (elements: StructuralElement[]) => void;
  selectedElementId?: string;
  selectedElementIds?: string[];
  activeLevelId?: string;
  onLevelChange?: (levelId: string) => void;
  projectId?: string;
}

const STATUS_COLORS: Record<ElementStatus, number> = {
  PENDING: 0x64748b, // Slate Grey
  REBAR_IN_PROGRESS: 0x6366f1, // Indigo
  FORMWORK_IN_PROGRESS: 0xa855f7, // Purple
  READY_FOR_CASTING: 0xeab308, // Yellow
  REBAR_INSPECTED: 0x0284c7, // Sky Blue
  POURED: 0xf59e0b, // Amber / Orange
  APPROVED: 0x16a34a, // Green
  REJECTED: 0xdc2626, // Red
};

const STATUS_HEX: Record<ElementStatus, string> = {
  PENDING: "#64748b",
  REBAR_IN_PROGRESS: "#6366f1",
  FORMWORK_IN_PROGRESS: "#a855f7",
  READY_FOR_CASTING: "#eab308",
  REBAR_INSPECTED: "#0284c7",
  POURED: "#f59e0b",
  APPROVED: "#16a34a",
  REJECTED: "#dc2626",
};

// Create a 2D canvas texture with text (for grid bubbles and elevation markers)
function createTextSprite(
  text: string,
  bgColor = "#0f172a",
  textColor = "#f8fafc",
  borderColor = "#0284c7",
) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Background bubble
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(10, 10, 236, 108, 24);
  ctx.fill();
  ctx.stroke();

  // Text
  ctx.fillStyle = textColor;
  ctx.font = "bold 44px monospace, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.2, 1.1, 1);
  return sprite;
}

/**
 * Constructs an authentic 3D structural concrete staircase geometry:
 * - Single Flight: stepped risers, horizontal treads, top landing platform, and sloped waist slab soffit.
 * - Two Flights (Dogleg / Return): Flight 1, intermediate landing platform, and parallel Flight 2.
 */
function createStaircaseGeometry(
  stairW: number,
  stairRise: number,
  waistT: number,
  landT: number,
  totalRun: number,
  riserCount: number,
  flights?: any[],
  landings?: any[],
): THREE.BufferGeometry {
  const hasMultipleFlights = Array.isArray(flights) && flights.length >= 2;

  if (hasMultipleFlights) {
    const fl1 = flights[0];
    const fl2 = flights[1];
    const fl1Risers = Math.max(2, Number(fl1?.riserCount) || Math.round(riserCount / 2));
    const fl2Risers = Math.max(2, Number(fl2?.riserCount) || Math.round(riserCount / 2));
    const fl1Run = Number(fl1?.length) || Math.max(1.2, totalRun * 0.45);
    const fl2Run = Number(fl2?.length) || Math.max(1.2, totalRun * 0.45);
    const landRun =
      landings && landings[0]?.length
        ? Number(landings[0].length)
        : Math.max(1.0, totalRun * 0.25);

    const halfRise = stairRise / 2;
    const wellGap = 0.12; // 120mm stairwell lightwell gap

    // Flight 1: 0 to halfRise
    const s1 = new THREE.Shape();
    s1.moveTo(0, 0);
    const stepT1 = fl1Run / fl1Risers;
    const stepR1 = halfRise / fl1Risers;
    for (let i = 0; i < fl1Risers; i++) {
      s1.lineTo(i * stepT1, (i + 1) * stepR1);
      s1.lineTo((i + 1) * stepT1, (i + 1) * stepR1);
    }
    s1.lineTo(fl1Run, halfRise - waistT);
    s1.lineTo(0, -waistT);
    s1.closePath();

    const g1 = new THREE.ExtrudeGeometry(s1, { depth: stairW, bevelEnabled: false });
    g1.translate(0, 0, -(stairW + wellGap / 2));

    // Mid Landing Platform
    const totalLandingW = 2 * stairW + wellGap;
    const gLand = new THREE.BoxGeometry(landRun, landT, totalLandingW);
    gLand.translate(fl1Run + landRun / 2, halfRise - landT / 2, 0);

    // Flight 2: climbs from halfRise to stairRise in reverse direction
    const s2 = new THREE.Shape();
    s2.moveTo(0, 0);
    const stepT2 = fl2Run / fl2Risers;
    const stepR2 = halfRise / fl2Risers;
    for (let i = 0; i < fl2Risers; i++) {
      s2.lineTo(i * stepT2, (i + 1) * stepR2);
      s2.lineTo((i + 1) * stepT2, (i + 1) * stepR2);
    }
    s2.lineTo(fl2Run, halfRise - waistT);
    s2.lineTo(0, -waistT);
    s2.closePath();

    const g2 = new THREE.ExtrudeGeometry(s2, { depth: stairW, bevelEnabled: false });
    g2.rotateY(Math.PI);
    g2.translate(fl1Run, halfRise, wellGap / 2 + stairW);

    try {
      const merged = BufferGeometryUtils.mergeGeometries([g1, gLand, g2]);
      if (merged) {
        merged.center();
        return merged;
      }
    } catch {
      // Fall through to single flight on merge error
    }
  }

  // Single Straight Flight with Top Landing
  const risers = Math.max(4, riserCount || 14);
  const landLen =
    landings && landings.length > 0 && landings[0]?.length
      ? Number(landings[0].length)
      : Math.max(0.8, Math.min(1.5, totalRun * 0.25));
  const flightRun = Math.max(1.5, totalRun - landLen);
  const stepT = flightRun / risers;
  const stepR = stairRise / risers;

  const s = new THREE.Shape();
  s.moveTo(0, 0);
  for (let i = 0; i < risers; i++) {
    s.lineTo(i * stepT, (i + 1) * stepR);
    s.lineTo((i + 1) * stepT, (i + 1) * stepR);
  }
  // Top landing platform
  s.lineTo(flightRun + landLen, stairRise);
  s.lineTo(flightRun + landLen, stairRise - landT);
  // Sloped waist soffit
  s.lineTo(flightRun, stairRise - landT);
  s.lineTo(0, -waistT);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, { depth: stairW, bevelEnabled: false });
  geo.center();
  return geo;
}

export const BIMViewer3D: React.FC<BIMViewer3DProps> = ({
  elements,
  levels = [],
  gridlines = [],
  onSelectElement,
  onSelectElements,
  selectedElementId,
  selectedElementIds: propSelectedElementIds,
  activeLevelId,
  onLevelChange,
  projectId,
}) => {
  const navigate = useNavigate();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentProjId = projectId || activeProject?.id || "proj-default";
  const currentCompId =
    currentUser?.companyId ||
    company?.id ||
    activeProject?.companyId ||
    "comp-default";

  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const gridGroupRef = useRef<THREE.Group | null>(null);
  const levelsGroupRef = useRef<THREE.Group | null>(null);
  const elementsGroupRef = useRef<THREE.Group | null>(null);

  // Multi-element selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (selectedElementId) initial.add(selectedElementId);
    if (propSelectedElementIds && propSelectedElementIds.length > 0) {
      propSelectedElementIds.forEach((id) => initial.add(id));
    }
    return initial;
  });
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const [filterType, setFilterType] = useState<string>("ALL");
  const [showGridlines, setShowGridlines] = useState<boolean>(true);
  const [showLevelPlanes, setShowLevelPlanes] = useState<boolean>(true);
  const [ghostInactiveLevels, setGhostInactiveLevels] = useState<boolean>(true);
  const [explodeFactor, setExplodeFactor] = useState<number>(1.0); // 1.0 = normal, >1.0 = exploded

  // Sync props changes
  useEffect(() => {
    if (selectedElementId) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.add(selectedElementId);
        return next;
      });
    }
  }, [selectedElementId]);

  useEffect(() => {
    if (propSelectedElementIds) {
      setSelectedIds(new Set(propSelectedElementIds));
    }
  }, [propSelectedElementIds]);

  // Camera Orbit state
  const orbitRef = useRef({
    isDragging: false,
    prevMouse: { x: 0, y: 0 },
    theta: Math.PI / 4,
    phi: Math.PI / 3.5,
    radius: 38,
    target: new THREE.Vector3(0, 4, 0),
  });

  // Calculate Grid Coordinate Lookup Table using unified system
  const gridGeom: GridSystemGeometry = useMemo(() => {
    return buildGridSystemGeometry(gridlines, 1.0);
  }, [gridlines]);

  const {
    xAxes,
    yAxes: zAxes,
    xMap,
    yMap: zMap,
    minX: gridMinX,
    maxX: gridMaxX,
    minY: gridMinZ,
    maxY: gridMaxZ,
    centerOffsetX,
    centerOffsetY: centerOffsetZ,
  } = gridGeom;

  // Level Elevation & Story Height Lookup Table
  const { sortedLevels, levelElevationMap, levelHeightMap } = useMemo(() => {
    const sorted = [...levels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const elevMap = new Map<string, number>();
    const heightMap = new Map<string, number>();

    sorted.forEach((l, idx) => {
      const curElev = l.elevation || 0;
      elevMap.set(l.id, curElev);
      elevMap.set(l.name.toLowerCase().trim(), curElev);

      const nextLvl = sorted[idx + 1];
      if (nextLvl) {
        const diff = (nextLvl.elevation || 0) - curElev;
        heightMap.set(l.id, diff > 0.5 ? diff : 3.2);
      } else {
        heightMap.set(l.id, 3.2);
      }
    });

    return {
      sortedLevels: sorted,
      levelElevationMap: elevMap,
      levelHeightMap: heightMap,
    };
  }, [levels]);

  // Selected Elements resolution
  const selectedElements = useMemo(() => {
    return elements.filter((el) => selectedIds.has(el.id));
  }, [elements, selectedIds]);

  // Single inspected element if only 1 is selected
  const singleSelectedElement = useMemo(() => {
    if (selectedElements.length === 1) return selectedElements[0];
    return null;
  }, [selectedElements]);

  // Toggle or select element helper
  const handleToggleElementSelect = useCallback(
    (elem: StructuralElement, isMulti: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (isMulti) {
          if (next.has(elem.id)) {
            next.delete(elem.id);
          } else {
            next.add(elem.id);
          }
        } else {
          if (next.has(elem.id) && next.size === 1) {
            next.clear();
          } else {
            next.clear();
            next.add(elem.id);
          }
        }

        const selectedList = elements.filter((e) => next.has(e.id));
        if (onSelectElements) onSelectElements(selectedList);
        if (onSelectElement) {
          onSelectElement(
            selectedList.length > 0
              ? selectedList[selectedList.length - 1]
              : null,
          );
        }

        return next;
      });
    },
    [elements, onSelectElement, onSelectElements],
  );

  const handleSelectAllVisible = useCallback(() => {
    const visible = elements.filter((el) => {
      if (
        filterType !== "ALL" &&
        (el.elementType || "").toUpperCase() !== filterType
      ) {
        return false;
      }
      if (
        activeLevelId &&
        activeLevelId !== "ALL" &&
        el.levelId !== activeLevelId
      ) {
        return false;
      }
      return true;
    });

    const newSet = new Set(visible.map((e) => e.id));
    setSelectedIds(newSet);
    if (onSelectElements) onSelectElements(visible);
    if (onSelectElement && visible.length > 0) onSelectElement(visible[0]);
  }, [elements, filterType, activeLevelId, onSelectElements, onSelectElement]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
    if (onSelectElements) onSelectElements([]);
    if (onSelectElement) onSelectElement(null);
  }, [onSelectElements, onSelectElement]);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);
    scene.fog = new THREE.FogExp2(0x070b14, 0.012);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    cameraRef.current = camera;

    // Renderer (preserveDrawingBuffer: true enables crisp PNG export)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.1);
    sunLight.position.set(35, 55, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 150;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const blueSkyLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    blueSkyLight.position.set(-25, 15, -25);
    scene.add(blueSkyLight);

    const warmGroundLight = new THREE.DirectionalLight(0xf59e0b, 0.2);
    warmGroundLight.position.set(0, -20, 0);
    scene.add(warmGroundLight);

    // Groups for organized rendering
    const gridGrp = new THREE.Group();
    const levelsGrp = new THREE.Group();
    const elemsGrp = new THREE.Group();

    scene.add(gridGrp);
    scene.add(levelsGrp);
    scene.add(elemsGrp);

    gridGroupRef.current = gridGrp;
    levelsGroupRef.current = levelsGrp;
    elementsGroupRef.current = elemsGrp;

    // Ground Grid & Base Floor
    const groundGrid = new THREE.GridHelper(70, 35, 0x0284c7, 0x1e293b);
    groundGrid.position.y = -0.02;
    scene.add(groundGrid);

    // Orbit Camera Update Helper
    const updateCameraPos = () => {
      const { radius, theta, phi, target } = orbitRef.current;
      camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = target.y + radius * Math.cos(phi);
      camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(target);
    };
    updateCameraPos();

    // Mouse & Touch Controls
    let dragDistance = 0;
    const onMouseDown = (e: MouseEvent) => {
      orbitRef.current.isDragging = true;
      dragDistance = 0;
      orbitRef.current.prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!orbitRef.current.isDragging) return;
      const dx = e.clientX - orbitRef.current.prevMouse.x;
      const dy = e.clientY - orbitRef.current.prevMouse.y;
      dragDistance += Math.abs(dx) + Math.abs(dy);

      if (e.buttons === 2 || e.shiftKey) {
        // Pan
        const right = new THREE.Vector3();
        camera.getWorldDirection(new THREE.Vector3());
        right
          .crossVectors(
            camera.up,
            new THREE.Vector3().subVectors(
              orbitRef.current.target,
              camera.position,
            ),
          )
          .normalize();
        orbitRef.current.target.addScaledVector(right, -dx * 0.03);
        orbitRef.current.target.y += dy * 0.03;
      } else {
        // Rotate
        orbitRef.current.theta -= dx * 0.007;
        orbitRef.current.phi = Math.max(
          0.1,
          Math.min(Math.PI / 2 - 0.02, orbitRef.current.phi - dy * 0.007),
        );
      }

      orbitRef.current.prevMouse = { x: e.clientX, y: e.clientY };
      updateCameraPos();
    };

    const onMouseUp = () => {
      orbitRef.current.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbitRef.current.radius = Math.max(
        6,
        Math.min(95, orbitRef.current.radius + e.deltaY * 0.03),
      );
      updateCameraPos();
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    dom.addEventListener("wheel", onWheel, { passive: false });
    dom.addEventListener("contextmenu", (e) => e.preventDefault());

    // Touch Controls for Mobile & Tablets
    let touchStartDist = 0;
    let touchDragDist = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        orbitRef.current.isDragging = true;
        touchDragDist = 0;
        orbitRef.current.prevMouse = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      } else if (e.touches.length === 2) {
        orbitRef.current.isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDist = Math.hypot(dx, dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && orbitRef.current.isDragging) {
        if (e.cancelable) e.preventDefault();
        const dx = e.touches[0].clientX - orbitRef.current.prevMouse.x;
        const dy = e.touches[0].clientY - orbitRef.current.prevMouse.y;
        touchDragDist += Math.abs(dx) + Math.abs(dy);

        orbitRef.current.theta -= dx * 0.007;
        orbitRef.current.phi = Math.max(
          0.1,
          Math.min(Math.PI / 2 - 0.02, orbitRef.current.phi - dy * 0.007),
        );
        orbitRef.current.prevMouse = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        updateCameraPos();
      } else if (e.touches.length === 2) {
        if (e.cancelable) e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const factor = (touchStartDist - dist) * 0.05;
        orbitRef.current.radius = Math.max(
          6,
          Math.min(95, orbitRef.current.radius + factor),
        );
        touchStartDist = dist;
        updateCameraPos();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        orbitRef.current.isDragging = false;
        if (touchDragDist < 10 && e.changedTouches.length > 0) {
          const touch = e.changedTouches[0];
          const rect = dom.getBoundingClientRect();
          mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(mouse, camera);
          const meshes = Array.from(meshMapRef.current.values());
          const intersects = raycaster.intersectObjects(meshes, false);

          if (intersects.length > 0) {
            const hitMesh = intersects[0].object as THREE.Mesh;
            const elemId = (hitMesh.userData as any)?.elementId;
            const elem = elements.find((el) => el.id === elemId);
            if (elem) {
              handleToggleElementSelect(elem, isMultiSelectMode);
            }
          } else if (!isMultiSelectMode) {
            handleClearSelection();
          }
        }
      }
    };

    dom.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    // Raycasting for Element Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      if (dragDistance > 6) return; // Ignore drag operations
      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(meshMapRef.current.values());
      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object as THREE.Mesh;
        const elemId = (hitMesh.userData as any)?.elementId;
        const elem = elements.find((el) => el.id === elemId);
        if (elem) {
          const isMulti =
            e.shiftKey || e.ctrlKey || e.metaKey || isMultiSelectMode;
          handleToggleElementSelect(elem, isMulti);
        }
      } else {
        // Clicking empty space unselects if not in multi-select mode
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey && !isMultiSelectMode) {
          handleClearSelection();
        }
      }
    };

    dom.addEventListener("click", onClick);

    // Animation Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      dom.removeEventListener("wheel", onWheel);
      dom.removeEventListener("click", onClick);
      dom.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      renderer.dispose();
    };
  }, [
    elements,
    isMultiSelectMode,
    handleToggleElementSelect,
    handleClearSelection,
  ]);

  // Reset Camera Helper
  const handleResetCamera = () => {
    if (!cameraRef.current) return;
    orbitRef.current.theta = Math.PI / 4;
    orbitRef.current.phi = Math.PI / 3.5;
    orbitRef.current.radius = 38;
    orbitRef.current.target.set(0, 4, 0);

    const { radius, theta, phi, target } = orbitRef.current;
    cameraRef.current.position.x =
      target.x + radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = target.y + radius * Math.cos(phi);
    cameraRef.current.position.z =
      target.z + radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(target);
  };

  // 1. Render 3D Gridlines System
  useEffect(() => {
    const gridGrp = gridGroupRef.current;
    if (!gridGrp) return;

    // Clear old grid items
    while (gridGrp.children.length > 0) {
      gridGrp.remove(gridGrp.children[0]);
    }

    if (!showGridlines) return;

    const gridExtentMargin = 3.5;
    const solidLineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 1.5,
    });

    // Render X Gridlines (running parallel to Z axis)
    xAxes.forEach((axis) => {
      const worldX = axis.pos - centerOffsetX;
      const startZ = gridMinZ - centerOffsetZ - gridExtentMargin;
      const endZ = gridMaxZ - centerOffsetZ + gridExtentMargin;

      const points = [
        new THREE.Vector3(worldX, 0.02, startZ),
        new THREE.Vector3(worldX, 0.02, endZ),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, solidLineMat);
      line.computeLineDistances();
      gridGrp.add(line);

      // Add Grid Bubbles at both ends
      const bubbleNorth = createTextSprite(
        axis.label,
        "#0f172a",
        "#38bdf8",
        "#0284c7",
      );
      if (bubbleNorth) {
        bubbleNorth.position.set(worldX, 0.5, startZ - 1.2);
        gridGrp.add(bubbleNorth);
      }

      const bubbleSouth = createTextSprite(
        axis.label,
        "#0f172a",
        "#38bdf8",
        "#0284c7",
      );
      if (bubbleSouth) {
        bubbleSouth.position.set(worldX, 0.5, endZ + 1.2);
        gridGrp.add(bubbleSouth);
      }
    });

    // Render Z Gridlines (running parallel to X axis)
    zAxes.forEach((axis) => {
      const worldZ = axis.pos - centerOffsetZ;
      const startX = gridMinX - centerOffsetX - gridExtentMargin;
      const endX = gridMaxX - centerOffsetX + gridExtentMargin;

      const points = [
        new THREE.Vector3(startX, 0.02, worldZ),
        new THREE.Vector3(endX, 0.02, worldZ),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, solidLineMat);
      line.computeLineDistances();
      gridGrp.add(line);

      // Add Grid Bubbles at both ends
      const bubbleWest = createTextSprite(
        axis.label,
        "#0f172a",
        "#fbbf24",
        "#d97706",
      );
      if (bubbleWest) {
        bubbleWest.position.set(startX - 1.2, 0.5, worldZ);
        gridGrp.add(bubbleWest);
      }

      const bubbleEast = createTextSprite(
        axis.label,
        "#0f172a",
        "#fbbf24",
        "#d97706",
      );
      if (bubbleEast) {
        bubbleEast.position.set(endX + 1.2, 0.5, worldZ);
        gridGrp.add(bubbleEast);
      }
    });
  }, [
    xAxes,
    zAxes,
    centerOffsetX,
    centerOffsetZ,
    gridMinX,
    gridMaxX,
    gridMinZ,
    gridMaxZ,
    showGridlines,
  ]);

  // 2. Render 3D Floor Level Datum Planes & Elevation Labels
  useEffect(() => {
    const levelsGrp = levelsGroupRef.current;
    if (!levelsGrp) return;

    while (levelsGrp.children.length > 0) {
      levelsGrp.remove(levelsGrp.children[0]);
    }

    if (!showLevelPlanes || sortedLevels.length === 0) return;

    const planeW = gridMaxX - gridMinX + 8;
    const planeD = gridMaxZ - gridMinZ + 8;

    sortedLevels.forEach((lvl) => {
      const rawElev = lvl.elevation || 0;
      const elev = rawElev * explodeFactor;
      const isLevelActive =
        !activeLevelId || activeLevelId === "ALL" || activeLevelId === lvl.id;

      // Semi-transparent floor plane
      const planeGeo = new THREE.PlaneGeometry(planeW, planeD);
      planeGeo.rotateX(-Math.PI / 2);

      const planeMat = new THREE.MeshBasicMaterial({
        color: isLevelActive ? 0x0284c7 : 0x334155,
        transparent: true,
        opacity: isLevelActive ? 0.08 : 0.02,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const planeMesh = new THREE.Mesh(planeGeo, planeMat);
      planeMesh.position.set(0, elev, 0);
      levelsGrp.add(planeMesh);

      // Edge outline
      const edges = new THREE.EdgesGeometry(planeGeo);
      const edgeLine = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: isLevelActive ? 0x0284c7 : 0x1e293b,
          transparent: true,
          opacity: isLevelActive ? 0.4 : 0.15,
        }),
      );
      edgeLine.position.set(0, elev, 0);
      levelsGrp.add(edgeLine);

      // Level Datum Text Marker (Left side of building)
      const elevStr =
        rawElev >= 0 ? `+${rawElev.toFixed(2)}m` : `${rawElev.toFixed(2)}m`;
      const levelLabel = `${lvl.name.split("(")[0].trim()} (${elevStr})`;
      const sprite = createTextSprite(
        levelLabel,
        isLevelActive ? "#0284c7" : "#0f172a",
        isLevelActive ? "#ffffff" : "#94a3b8",
        isLevelActive ? "#38bdf8" : "#334155",
      );

      if (sprite) {
        sprite.scale.set(4.2, 1.4, 1);
        sprite.position.set(-planeW / 2 - 2.8, elev, 0);
        levelsGrp.add(sprite);
      }
    });
  }, [
    sortedLevels,
    activeLevelId,
    showLevelPlanes,
    explodeFactor,
    gridMaxX,
    gridMinX,
    gridMaxZ,
    gridMinZ,
  ]);

  // 3. Render Elements Placed on Grids and Levels (with Multi-Select highlight support)
  useEffect(() => {
    const elemsGrp = elementsGroupRef.current;
    if (!elemsGrp) return;

    // Remove old meshes
    while (elemsGrp.children.length > 0) {
      elemsGrp.remove(elemsGrp.children[0]);
    }
    meshMapRef.current.clear();

    const filtered = elements.filter((el) => {
      if (
        filterType !== "ALL" &&
        (el.elementType || "").toUpperCase() !== filterType
      )
        return false;
      return true;
    });

    filtered.forEach((el, index) => {
      const type = (el.elementType || "").toUpperCase();
      const isSelected = selectedIds.has(el.id);
      const isLevelActive =
        !activeLevelId ||
        activeLevelId === "ALL" ||
        activeLevelId === el.levelId;

      // Determine Floor Level Elevation & Story Height
      let rawElev = 0;
      if (el.levelId && levelElevationMap.has(el.levelId)) {
        rawElev = levelElevationMap.get(el.levelId)!;
      } else if (el.gridY !== undefined) {
        rawElev = el.gridY;
      } else {
        rawElev = 0;
      }
      const floorElevation = rawElev * explodeFactor;
      const storyHeight = (el.levelId && levelHeightMap.get(el.levelId)) || 3.2;

      // Resolve Spatial Grid Coordinates via Bidirectional Resolver
      const coords = resolveElementGridCoords(
        el.grid || el.gridAxis,
        el.elementName,
        xMap,
        zMap,
        xAxes,
        zAxes,
        1.0,
        index,
        el.gridX,
        el.gridZ,
      );

      // Parse Physical Dimensions
      const rawL = el.length || el.dimensions?.length;
      const rawW = el.width || el.dimensions?.width;
      const rawH = el.height || el.dimensions?.height;
      const rawT = el.thickness || (el.dimensions as any)?.thickness;
      const rawD = el.diameter || (el.dimensions as any)?.diameter;
      const rawDepth = el.depth || (el.dimensions as any)?.depth;

      const lengthM = rawL ? (rawL > 50 ? rawL / 1000 : rawL) : 0;
      const widthM = rawW ? (rawW > 50 ? rawW / 1000 : rawW) : 0.35;
      const heightM = rawH ? (rawH > 50 ? rawH / 1000 : rawH) : storyHeight;
      const thicknessM = rawT ? (rawT > 50 ? rawT / 1000 : rawT) : 0.2;
      const depthM = rawDepth
        ? rawDepth > 50
          ? rawDepth / 1000
          : rawDepth
        : 0.6;
      const diameterM = rawD ? (rawD > 50 ? rawD / 1000 : rawD) : 0.5;

      // 3D Geometry & Spatial Placement Calculation
      let geo: THREE.BufferGeometry;
      let posX = 0;
      let posY = floorElevation;
      let posZ = 0;
      let rotationY = 0;

      if (
        type.includes("COLUMN") ||
        type.includes("PIER") ||
        type.includes("STANCHION")
      ) {
        posX = coords.x1 - centerOffsetX;
        posZ = coords.y1 - centerOffsetZ;
        posY = floorElevation + heightM / 2;

        if (
          el.columnShape === "circular" ||
          type.includes("CIRCULAR") ||
          el.diameter
        ) {
          const radius = diameterM / 2;
          geo = new THREE.CylinderGeometry(radius, radius, heightM, 24);
        } else {
          const colX = widthM || 0.35;
          const colZ = lengthM || colX;
          geo = new THREE.BoxGeometry(colX, heightM, colZ);
        }
      } else if (type.includes("BEAM")) {
        if (coords.isSpan) {
          posX = coords.midX - centerOffsetX;
          posZ = coords.midY - centerOffsetZ;
          const spanLen =
            coords.spanLength > 0.05 ? coords.spanLength : lengthM || 5.0;
          rotationY = -coords.angleRad;
          geo = new THREE.BoxGeometry(spanLen, depthM, widthM);
        } else {
          posX = coords.x1 - centerOffsetX;
          posZ = coords.y1 - centerOffsetZ;
          const spanLen = lengthM || 4.5;
          geo = new THREE.BoxGeometry(spanLen, depthM, widthM);
        }
        posY = floorElevation + storyHeight - depthM / 2;
      } else if (type.includes("SLAB")) {
        const slabW = coords.isArea
          ? Math.max(1.0, coords.sizeX)
          : lengthM || 6.0;
        const slabD = coords.isArea
          ? Math.max(1.0, coords.sizeY)
          : (el.cantileverDepth || widthM || 6.0);
        posY = floorElevation + storyHeight - thicknessM / 2;

        const shape = el.slabShape || "rectangular";
        const dir = ((el.cantileverDirection || 'TOP') as string).toUpperCase();
        const isMirr = !!(el as any).isMirrored;

        if (shape === "circular") {
          const rad = (el.radius || Math.min(slabW, slabD) / 2);
          geo = new THREE.CylinderGeometry(rad, rad, thicknessM, 32);
          posX = coords.midX - centerOffsetX;
          posZ = coords.midY - centerOffsetZ;
        } else if (shape === "semi_circular") {
          const rad = slabW / 2;
          const s = new THREE.Shape();
          s.absarc(0, 0, rad, 0, Math.PI, false);
          s.closePath();
          const extrudeSettings = {
            depth: thicknessM,
            bevelEnabled: false,
            curveSegments: 24,
          };
          geo = new THREE.ExtrudeGeometry(s, extrudeSettings);
          geo.rotateX(Math.PI / 2);
          posX = coords.midX - centerOffsetX;
          posZ = coords.midY - centerOffsetZ;
        } else if (shape === "circular_segment") {
          const rad = el.radius || Math.max(slabW / 2, 1.0);
          const rise = el.arcDepth || Math.min(rad, 1.5);
          const chord = slabW;
          const s = new THREE.Shape();
          const startX = -chord / 2;
          const endX = chord / 2;
          s.moveTo(startX, 0);
          s.quadraticCurveTo(0, rise, endX, 0);
          s.lineTo(startX, 0);
          const extrudeSettings = {
            depth: thicknessM,
            bevelEnabled: false,
            curveSegments: 24,
          };
          geo = new THREE.ExtrudeGeometry(s, extrudeSettings);
          geo.rotateX(Math.PI / 2);
          posX = coords.midX - centerOffsetX;
          posZ = coords.midY - centerOffsetZ;
        } else if (shape === "curved_cantilever") {
          const w = slabW;
          const d = slabD;
          const rise = el.arcDepth || Math.min(d * 0.8, 1.5);
          const isDeduct = !!el.isArcDeduction;
          const s = new THREE.Shape();

          // Construct shape centered around (0,0) in the X-Z plane
          const halfW = w / 2;
          const halfD = d / 2;

          if (dir === "TOP" || dir === "NORTH") {
            s.moveTo(-halfW, halfD);
            s.lineTo(halfW, halfD);
            s.lineTo(halfW, -halfD);
            if (isDeduct) {
              s.quadraticCurveTo(0, -halfD + rise, -halfW, -halfD);
            } else {
              s.quadraticCurveTo(0, -halfD - rise, -halfW, -halfD);
            }
            s.lineTo(-halfW, halfD);
          } else if (dir === "LEFT" || dir === "WEST") {
            s.moveTo(halfW, -halfD);
            s.lineTo(halfW, halfD);
            s.lineTo(-halfW, halfD);
            if (isDeduct) {
              s.quadraticCurveTo(-halfW + rise, 0, -halfW, -halfD);
            } else {
              s.quadraticCurveTo(-halfW - rise, 0, -halfW, -halfD);
            }
            s.lineTo(halfW, -halfD);
          } else if (dir === "RIGHT" || dir === "EAST") {
            s.moveTo(-halfW, -halfD);
            s.lineTo(-halfW, halfD);
            s.lineTo(halfW, halfD);
            if (isDeduct) {
              s.quadraticCurveTo(halfW - rise, 0, halfW, -halfD);
            } else {
              s.quadraticCurveTo(halfW + rise, 0, halfW, -halfD);
            }
            s.lineTo(-halfW, -halfD);
          } else {
            // BOTTOM / SOUTH
            s.moveTo(-halfW, -halfD);
            s.lineTo(halfW, -halfD);
            s.lineTo(halfW, halfD);
            if (isDeduct) {
              s.quadraticCurveTo(0, halfD - rise, -halfW, halfD);
            } else {
              s.quadraticCurveTo(0, halfD + rise, -halfW, halfD);
            }
            s.lineTo(-halfW, -halfD);
          }

          const extrudeSettings = {
            depth: thicknessM,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 1,
            bevelSize: 0.02,
            bevelThickness: 0.02,
            curveSegments: 28,
          };
          geo = new THREE.ExtrudeGeometry(s, extrudeSettings);
          geo.rotateX(Math.PI / 2);
          geo.center();
          posX = coords.midX - centerOffsetX;
          posZ = coords.midY - centerOffsetZ;
        } else if (shape === "trapezoidal_cantilever") {
          // CAD 1BM78/79 vs 1BM80/81 cantilever: W1 start depth + corner fillet arc into column
          const w = slabW;
          const w1 = el.cantileverDepth || widthM || 1.95;
          const w2 = (el as any).taperEndDepth ?? 0;
          const rFillet = el.radius || 1.5;
          const filletM = Math.min(w * 0.4, Math.max(0.5, rFillet * 0.7));
          const h2M = w2 > 0 ? (w2 / (w1 || 1)) * slabD : 0;
          const h1M = slabD;

          const s = new THREE.Shape();
          const halfW = w / 2;
          const halfD = h1M / 2;

          if (dir === "TOP" || dir === "NORTH") {
            if (isMirr) {
              s.moveTo(-halfW, -halfD);
              s.lineTo(halfW, -halfD);
              s.lineTo(halfW, halfD);
              s.lineTo(-halfW + filletM, halfD * 0.2);
              s.quadraticCurveTo(-halfW, halfD * 0.2, -halfW, -halfD + h2M);
            } else {
              s.moveTo(-halfW, -halfD);
              s.lineTo(halfW, -halfD);
              s.lineTo(halfW, -halfD + h2M);
              s.quadraticCurveTo(halfW, halfD * 0.2, halfW - filletM, halfD * 0.2);
              s.lineTo(-halfW, halfD);
            }
          } else {
            // BOTTOM / SOUTH (Default CAD standard 1BM78/79 and 1BM80/81)
            if (isMirr) {
              // Mirrored (1BM80/81): Fillet arc on LEFT, W1 (1950mm) on RIGHT
              s.moveTo(-halfW, -halfD);
              s.lineTo(halfW, -halfD);
              s.lineTo(halfW, halfD);
              s.lineTo(-halfW + filletM, -halfD + Math.max(0.3, halfD * 0.8));
              s.quadraticCurveTo(-halfW, -halfD + Math.max(0.3, halfD * 0.8), -halfW, -halfD + h2M);
            } else {
              // Standard (1BM78/79): W1 (1950mm) on LEFT, fillet arc on RIGHT
              s.moveTo(-halfW, -halfD);
              s.lineTo(halfW, -halfD);
              s.lineTo(halfW, -halfD + h2M);
              s.quadraticCurveTo(halfW, -halfD + Math.max(0.3, halfD * 0.8), halfW - filletM, -halfD + Math.max(0.3, halfD * 0.8));
              s.lineTo(-halfW, halfD);
            }
          }
          s.closePath();

          const extrudeSettings = {
            depth: thicknessM,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 1,
            bevelSize: 0.02,
            bevelThickness: 0.02,
            curveSegments: 28,
          };
          geo = new THREE.ExtrudeGeometry(s, extrudeSettings);
          geo.rotateX(Math.PI / 2);
          geo.center();
          posX = coords.midX - centerOffsetX;
          posZ = coords.midY - centerOffsetZ;
        } else {
          // Standard Rectangular Slab
          posX = coords.midX - centerOffsetX;
          posZ = coords.midY - centerOffsetZ;
          geo = new THREE.BoxGeometry(slabW, thicknessM, slabD);
        }
      } else if (type.includes("WALL") || type.includes("RETAINING")) {
        if (coords.isSpan) {
          posX = coords.midX - centerOffsetX;
          posZ = coords.midY - centerOffsetZ;
          const wallLen =
            coords.spanLength > 0.05 ? coords.spanLength : lengthM || 4.0;
          rotationY = -coords.angleRad;
          geo = new THREE.BoxGeometry(wallLen, heightM, thicknessM);
        } else {
          posX = coords.x1 - centerOffsetX;
          posZ = coords.y1 - centerOffsetZ;
          const wallLen = lengthM || 4.0;
          geo = new THREE.BoxGeometry(wallLen, heightM, thicknessM);
        }
        posY = floorElevation + heightM / 2;
      } else if (
        type.includes("FOOTING") ||
        type.includes("PAD") ||
        type.includes("PILE") ||
        type.includes("RAFT")
      ) {
        posX = coords.x1 - centerOffsetX;
        posZ = coords.y1 - centerOffsetZ;
        const footW = widthM || 1.8;
        const footL = lengthM || 1.8;
        const footThick = thicknessM || 0.6;
        posY = floorElevation + footThick / 2;
        geo = new THREE.BoxGeometry(footL, footThick, footW);
      } else if (type.includes("STAIR")) {
        const stairW = el.flightWidth || (widthM > 0.4 ? widthM : 1.2);
        const waistT = el.waistThickness || 0.15;
        const landT =
          (typeof el.landingThickness === "number"
            ? el.landingThickness
            : Number(el.landingThickness)) || 0.2;
        const stairRise = heightM > 0.5 ? heightM : storyHeight || 3.2;

        let totalRun = lengthM || 3.6;
        if (coords.isSpan && coords.spanLength > 0.5) {
          totalRun = coords.spanLength;
        } else if (coords.isArea && coords.sizeX > 0.5) {
          totalRun = Math.max(coords.sizeX, coords.sizeY);
        }

        const riserCnt =
          el.riserCount ||
          (el.flights?.reduce(
            (acc: number, f: any) => acc + (Number(f.riserCount) || 0),
            0,
          ) || 14);

        geo = createStaircaseGeometry(
          stairW,
          stairRise,
          waistT,
          landT,
          totalRun,
          riserCnt,
          el.flights,
          el.landings,
        );

        posY = floorElevation + stairRise / 2;

        if (coords.isSpan) {
          posX = coords.midX - centerOffsetX;
          posZ = coords.midY - centerOffsetZ;
          rotationY = -coords.angleRad;
        } else if (coords.isArea) {
          posX = coords.midX - centerOffsetX;
          posZ = coords.midY - centerOffsetZ;
          if (coords.sizeY > coords.sizeX) {
            rotationY = Math.PI / 2;
          }
        } else {
          posX = coords.x1 - centerOffsetX;
          posZ = coords.y1 - centerOffsetZ;
        }
      } else {
        posX = coords.midX - centerOffsetX;
        posZ = coords.midY - centerOffsetZ;
        posY = floorElevation + heightM / 2;
        const genW = Math.max(1.2, coords.sizeX || widthM);
        const genD = Math.max(1.2, coords.sizeY || lengthM || widthM);
        geo = new THREE.BoxGeometry(genW, heightM, genD);
      }

      // Material & Multi-Element Activation Colors
      const baseColor = STATUS_COLORS[el.status] || 0x64748b;
      const isGhosted =
        ghostInactiveLevels &&
        activeLevelId &&
        activeLevelId !== "ALL" &&
        activeLevelId !== el.levelId;

      const mat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0x0ea5e9 : baseColor,
        emissive: isSelected ? 0x0284c7 : 0x000000,
        emissiveIntensity: isSelected ? 0.45 : 0.0,
        roughness: isSelected ? 0.2 : 0.45,
        metalness: isSelected ? 0.35 : 0.1,
        transparent: true,
        opacity: isGhosted ? 0.12 : isSelected ? 1.0 : 0.92,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(posX, posY, posZ);
      if (rotationY) mesh.rotation.y = rotationY;
      mesh.userData = { elementId: el.id };
      mesh.castShadow = !isGhosted;
      mesh.receiveShadow = !isGhosted;

      // Highlight outline edge
      const edges = new THREE.EdgesGeometry(geo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: isSelected ? 0xffffff : isGhosted ? 0x334155 : 0x0f172a,
        linewidth: isSelected ? 3 : 1,
        transparent: true,
        opacity: isSelected ? 1.0 : isGhosted ? 0.15 : 0.7,
      });
      const line = new THREE.LineSegments(edges, edgeMat);
      mesh.add(line);

      elemsGrp.add(mesh);
      meshMapRef.current.set(el.id, mesh);
    });
  }, [
    elements,
    activeLevelId,
    filterType,
    selectedIds,
    explodeFactor,
    ghostInactiveLevels,
    xAxes,
    zAxes,
    xMap,
    zMap,
    levelElevationMap,
    levelHeightMap,
    centerOffsetX,
    centerOffsetZ,
  ]);

  // ═══════════════════════════════════════════════════════════════════════
  // EXPORT 3D SCREENSHOT WITH EMBEDDED LEGEND & DIRECT SITE GALLERY SYNC
  // ═══════════════════════════════════════════════════════════════════════
  const handleExportScreenshot = async () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) {
      toast.error("3D Viewport is not ready for screenshot export");
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading(
      "Capturing 3D BIM model screenshot with legend...",
    );

    try {
      // Force high-res render pass
      renderer.render(scene, camera);

      const webglCanvas = renderer.domElement;
      const exportWidth = 1920;
      const exportHeight = 1080;

      const compCanvas = document.createElement("canvas");
      compCanvas.width = exportWidth;
      compCanvas.height = exportHeight;
      const ctx = compCanvas.getContext("2d");
      if (!ctx)
        throw new Error("Could not initialize 2D export canvas context");

      // 1. Dark Blueprint Background
      ctx.fillStyle = "#070b14";
      ctx.fillRect(0, 0, exportWidth, exportHeight);

      // 2. Draw 3D WebGL Scene centered
      ctx.drawImage(webglCanvas, 0, 0, exportWidth, exportHeight);

      // 3. Draw Title Block (Top-Left)
      const currentLevelName =
        levels.find((l) => l.id === activeLevelId)?.name ||
        "All Levels (Full BIM)";
      const projName =
        activeProject?.name || "Structural Quality Management System";

      ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
      ctx.fillRect(40, 40, 560, 110);
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, 560, 110);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(projName.toUpperCase(), 58, 68);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("3D BIM STRUCTURAL MODEL TWIN", 58, 96);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "normal 13px sans-serif";
      ctx.fillText(
        `Floor Level: ${currentLevelName} | Filter: ${filterType} | Elements: ${elements.length}`,
        58,
        122,
      );

      ctx.fillStyle = "#64748b";
      ctx.font = "normal 11px monospace";
      ctx.fillText(`Captured: ${new Date().toLocaleString()}`, 58, 140);

      // 4. Draw Comprehensive Architectural Legend (Bottom-Right)
      const legendW = 420;
      const legendH = 260;
      const legendX = exportWidth - legendW - 40;
      const legendY = exportHeight - legendH - 40;

      ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
      ctx.fillRect(legendX, legendY, legendW, legendH);
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 2;
      ctx.strokeRect(legendX, legendY, legendW, legendH);

      // Legend Header
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(legendX, legendY, legendW, 36);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(
        "3D STRUCTURAL LIFECYCLE LEGEND",
        legendX + 16,
        legendY + 24,
      );

      // Legend Items (2 columns)
      const legendEntries = [
        { label: "Pending Inspection", color: STATUS_HEX.PENDING },
        { label: "Rebar in Progress", color: STATUS_HEX.REBAR_IN_PROGRESS },
        {
          label: "Formwork in Progress",
          color: STATUS_HEX.FORMWORK_IN_PROGRESS,
        },
        { label: "Ready for Casting", color: STATUS_HEX.READY_FOR_CASTING },
        { label: "Rebar Inspected", color: STATUS_HEX.REBAR_INSPECTED },
        { label: "Concrete Poured", color: STATUS_HEX.POURED },
        { label: "QA Approved", color: STATUS_HEX.APPROVED },
        { label: "QA Rejected", color: STATUS_HEX.REJECTED },
        { label: "Selected / Active", color: "#0ea5e9", isBox: true },
      ];

      legendEntries.forEach((item, idx) => {
        const col = idx < 5 ? 0 : 1;
        const row = idx < 5 ? idx : idx - 5;
        const itemX = legendX + 18 + col * 200;
        const itemY = legendY + 58 + row * 38;

        if (item.isBox) {
          ctx.fillStyle = item.color;
          ctx.fillRect(itemX, itemY - 11, 16, 16);
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.strokeRect(itemX, itemY - 11, 16, 16);
        } else {
          ctx.fillStyle = item.color;
          ctx.beginPath();
          ctx.arc(itemX + 8, itemY - 3, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#0f172a";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.fillStyle = item.isBox ? "#38bdf8" : "#e2e8f0";
        ctx.font = item.isBox
          ? "bold 12px sans-serif"
          : "normal 12px sans-serif";
        ctx.fillText(item.label, itemX + 24, itemY + 2);
      });

      // 5. Trigger Direct Browser Download
      const dataUrl = compCanvas.toDataURL("image/png");
      const cleanProj = (activeProject?.name || "Project").replace(
        /[^a-zA-Z0-9]/g,
        "_",
      );
      const cleanLevel = currentLevelName.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `BIM_3D_${cleanProj}_${cleanLevel}_${Date.now()}.png`;

      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // 6. Auto-Save to Universal Photo Gallery & Cloud Storage
      compCanvas.toBlob(async (blob) => {
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
          photoUrl = dataUrl;
        }

        const selectedCount = selectedElements.length;
        const caption = `3D BIM Model Snapshot — ${currentLevelName} (${elements.length} elements${
          selectedCount > 0 ? `, ${selectedCount} active selected` : ""
        })`;

        await syncPhotoToSiteGallery({
          projectId: currentProjId,
          companyId: currentCompId,
          url: photoUrl,
          thumbnailUrl: photoUrl.startsWith("http")
            ? getThumbnail(photoUrl, 300)
            : photoUrl,
          caption,
          floorLevel: currentLevelName,
          category: "PROGRESS",
          tradeName: "Structural / 3D BIM",
          uploadedBy: currentUser?.fullName || "QA/QC Engineer",
          uploaderRole: currentUser?.role || "QA/QC Engineer",
          sourceModule: "BIMViewer3D",
          sourceId: `bim-3d-${Date.now()}`,
        });

        toast.success(
          "3D BIM Screenshot downloaded & saved to Site Photo Gallery!",
          {
            id: toastId,
          },
        );
      }, "image/png");
    } catch (err: any) {
      console.error("3D export failed:", err);
      toast.error(`Export failed: ${err?.message || "Unknown error"}`, {
        id: toastId,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Multi-element aggregations
  const totalSelectedVolume = useMemo(() => {
    return selectedElements.reduce(
      (sum, el) => sum + (el.calculatedVolume || el.volume || 0),
      0,
    );
  }, [selectedElements]);

  const totalSelectedFormwork = useMemo(() => {
    return selectedElements.reduce(
      (sum, el) => sum + (el.calculatedFormworkArea || 0),
      0,
    );
  }, [selectedElements]);

  return (
    <div className="relative w-full h-[560px] rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
      {/* Top 3D Control Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Toolbar: Level Selector & Filters */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Floor Level Filter */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-xl text-xs">
            <Building2 className="w-3.5 h-3.5 text-brand-400 ml-1" />
            <select
              value={activeLevelId || "ALL"}
              onChange={(e) => onLevelChange && onLevelChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer pr-2"
            >
              <option value="ALL" className="bg-slate-900 text-slate-300">
                All Levels (Full BIM Twin)
              </option>
              {sortedLevels.map((lvl) => (
                <option
                  key={lvl.id}
                  value={lvl.id}
                  className="bg-slate-900 text-white"
                >
                  {lvl.name} (
                  {lvl.elevation >= 0 ? `+${lvl.elevation}` : lvl.elevation}m)
                </option>
              ))}
            </select>
          </div>

          {/* Element Type Filter Chips */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-xl text-xs">
            {["ALL", "COLUMN", "BEAM", "SLAB", "WALL", "STAIR", "FOOTING"].map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                    filterType === type
                      ? "bg-brand-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {type}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Right Toolbar: Viewport Mode Toggles, Multi-Select Mode, Explode Slider & Screenshot Export */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Multi-Select Mode Toggle Button */}
          <button
            onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition border ${
              isMultiSelectMode
                ? "bg-cyan-600/30 text-cyan-300 border-cyan-400 shadow-lg shadow-cyan-500/20"
                : "bg-slate-900/90 text-slate-300 border-slate-700 hover:text-white"
            }`}
            title="Toggle Multi-Element Selection (or hold Shift/Ctrl while clicking)"
          >
            {isMultiSelectMode ? (
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Multi-Select {isMultiSelectMode ? "ON" : "OFF"}</span>
            {selectedIds.size > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px]">
                {selectedIds.size}
              </span>
            )}
          </button>

          {/* Exploded View Slider */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-xl text-xs">
            <Sliders className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">
              Explode:
            </span>
            <input
              type="range"
              min="1.0"
              max="2.5"
              step="0.05"
              value={explodeFactor}
              onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
              className="w-16 sm:w-20 accent-brand-500 cursor-pointer"
              title={`Vertical floor explosion: ${explodeFactor.toFixed(2)}x`}
            />
            <span className="font-mono text-[10px] font-bold text-brand-400">
              {explodeFactor.toFixed(1)}x
            </span>
          </div>

          {/* Toggle 3D Gridlines */}
          <button
            onClick={() => setShowGridlines(!showGridlines)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition border ${
              showGridlines
                ? "bg-brand-600/20 text-brand-300 border-brand-500/40 shadow"
                : "bg-slate-900/90 text-slate-400 border-slate-700 hover:text-white"
            }`}
            title="Toggle 3D Gridlines and Bubbles"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Grids</span>
          </button>

          {/* Toggle 3D Level Datum Planes */}
          <button
            onClick={() => setShowLevelPlanes(!showLevelPlanes)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition border ${
              showLevelPlanes
                ? "bg-brand-600/20 text-brand-300 border-brand-500/40 shadow"
                : "bg-slate-900/90 text-slate-400 border-slate-700 hover:text-white"
            }`}
            title="Toggle 3D Floor Level Datum Planes"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Levels</span>
          </button>

          {/* Export HD Screenshot with Legend Button */}
          <button
            onClick={handleExportScreenshot}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
            title="Export high-res PNG screenshot with legend and auto-save to Site Gallery"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Export 3D PNG</span>
          </button>

          {/* Reset Camera View */}
          <button
            onClick={handleResetCamera}
            className="p-2 rounded-2xl bg-slate-900/95 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white shadow-xl transition"
            title="Reset Camera View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing bim-canvas-container"
      />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HUD 1: Single Selected Element Inspection Card (Bottom Left)            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {singleSelectedElement && (
        <div className="absolute bottom-16 lg:bottom-4 left-2 sm:left-4 right-2 sm:right-auto z-20 max-w-[calc(100vw-1.5rem)] sm:max-w-md p-3.5 sm:p-4 rounded-3xl bg-slate-900/95 backdrop-blur-md border border-cyan-500/60 shadow-2xl text-xs space-y-2.5 sm:space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
            <div>
              <h4 className="font-black text-white text-sm tracking-tight">
                {singleSelectedElement.elementName}
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                {singleSelectedElement.levelName || "Level"} · Grid:{" "}
                {singleSelectedElement.grid ||
                  singleSelectedElement.gridAxis ||
                  "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                  singleSelectedElement.status === "APPROVED"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : singleSelectedElement.status === "REJECTED"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : singleSelectedElement.status === "POURED"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : singleSelectedElement.status === "REBAR_INSPECTED"
                          ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}
              >
                {singleSelectedElement.status.replace(/_/g, " ")}
              </span>
              <button
                onClick={handleClearSelection}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[9px] uppercase font-bold">
                Element Type
              </span>
              <span className="font-bold text-white text-xs">
                {singleSelectedElement.elementType}
              </span>
            </div>
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[9px] uppercase font-bold">
                Volume / Grade
              </span>
              <span className="font-mono text-cyan-400 font-bold text-xs">
                {(
                  singleSelectedElement.calculatedVolume ||
                  singleSelectedElement.volume ||
                  0
                ).toFixed(3)}{" "}
                m³ ({singleSelectedElement.concreteGrade})
              </span>
            </div>
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[9px] uppercase font-bold">
                Rebar Specification
              </span>
              <span className="truncate block font-mono text-slate-200 text-xs">
                {singleSelectedElement.rebarSpec || "Standard Grade 500B"}
              </span>
            </div>
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[9px] uppercase font-bold">
                Pour Schedule
              </span>
              <span className="text-slate-200 text-xs">
                {singleSelectedElement.plannedPourDate ||
                  singleSelectedElement.plannedCastingDate ||
                  "TBD"}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() =>
                navigate(
                  `/project/${singleSelectedElement.projectId}/inspections/create?elementId=${singleSelectedElement.id}&elementName=${encodeURIComponent(
                    singleSelectedElement.elementName,
                  )}`,
                )
              }
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-[11px] shadow transition"
            >
              <ClipboardCheck size={12} />
              <span>Inspect</span>
            </button>
            <button
              onClick={() =>
                navigate(
                  `/project/${singleSelectedElement.projectId}/site-comments/create?elementId=${singleSelectedElement.id}&elementName=${encodeURIComponent(
                    singleSelectedElement.elementName,
                  )}`,
                )
              }
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 font-bold text-[11px] transition"
            >
              <Camera size={12} />
              <span>Snag</span>
            </button>
            <button
              onClick={() =>
                navigate(
                  `/project/${singleSelectedElement.projectId}/ncrs/create?elementId=${singleSelectedElement.id}&elementName=${encodeURIComponent(
                    singleSelectedElement.elementName,
                  )}`,
                )
              }
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 font-bold text-[11px] transition"
            >
              <AlertTriangle size={12} />
              <span>NCR</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HUD 2: Multi-Element Batch Selection Summary Card (Bottom Left)        */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {selectedElements.length > 1 && (
        <div className="absolute bottom-16 lg:bottom-4 left-2 sm:left-4 right-2 sm:right-auto z-20 max-w-[calc(100vw-1.5rem)] sm:max-w-md w-auto sm:w-full p-3.5 sm:p-4 rounded-3xl bg-slate-900/95 backdrop-blur-md border border-cyan-500/60 shadow-2xl text-xs space-y-2.5 sm:space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-cyan-400" />
              <h4 className="font-black text-white text-sm">
                {selectedElements.length} Structural Elements Active
              </h4>
            </div>
            <button
              onClick={handleClearSelection}
              className="text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          {/* Aggregated Totals Grid */}
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[9px] uppercase font-bold">
                Total Concrete Volume
              </span>
              <span className="font-mono text-cyan-400 font-black text-sm">
                {totalSelectedVolume.toFixed(3)} m³
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[9px] uppercase font-bold">
                Total Formwork Area
              </span>
              <span className="font-mono text-emerald-400 font-black text-sm">
                {totalSelectedFormwork.toFixed(1)} m²
              </span>
            </div>
          </div>

          {/* Selected Elements Tag Cloud (scrollable) */}
          <div className="max-h-24 overflow-y-auto flex flex-wrap gap-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
            {selectedElements.map((el) => (
              <span
                key={el.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-200"
              >
                <span>{el.elementName}</span>
                <span className="text-slate-500 font-mono">
                  ({el.elementType})
                </span>
                <button
                  onClick={() => handleToggleElementSelect(el, true)}
                  className="text-slate-400 hover:text-red-400 ml-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>

          {/* Batch Quick Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                const elementNames = selectedElements
                  .map((e) => e.elementName)
                  .join(", ");
                navigate(
                  `/project/${currentProjId}/inspections/create?elementNames=${encodeURIComponent(
                    elementNames,
                  )}`,
                );
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow transition"
            >
              <ClipboardCheck size={13} />
              <span>Inspect Group ({selectedElements.length})</span>
            </button>
            <button
              onClick={() => {
                const elementNames = selectedElements
                  .map((e) => e.elementName)
                  .join(", ");
                navigate(
                  `/project/${currentProjId}/site-comments/create?elementNames=${encodeURIComponent(
                    elementNames,
                  )}`,
                );
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 font-bold text-xs transition"
            >
              <Camera size={13} />
              <span>Snag Group</span>
            </button>
          </div>
        </div>
      )}

      {/* Legend & Navigation Helper Overlay Bottom Right */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-wrap items-center gap-3 px-3 py-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-[10px] text-slate-400 pointer-events-none shadow-xl">
        <span className="flex items-center gap-1 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />{" "}
          Pending
        </span>
        <span className="flex items-center gap-1 text-sky-400">
          <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />{" "}
          Rebar OK
        </span>
        <span className="flex items-center gap-1 text-amber-400">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />{" "}
          Poured
        </span>
        <span className="flex items-center gap-1 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />{" "}
          Approved
        </span>
        <span className="flex items-center gap-1 text-cyan-400 font-bold">
          <span className="w-2 h-2 rounded bg-cyan-400 inline-block" /> Active
          Selected
        </span>
        <span className="text-slate-600">|</span>
        <span>Rotate: Drag · Pan: Right-Drag · Multi-Select: Shift+Click</span>
      </div>
    </div>
  );
};

export default BIMViewer3D;
