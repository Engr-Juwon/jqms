import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import {
  X,
  Save,
  Calculator,
  Plus,
  Trash2,
  ArrowUpRight,
  Layers,
  Ruler,
  Box,
  Building2,
  CheckCircle2,
  Compass,
  Square,
  Sparkles,
  Calendar,
  Briefcase,
  AlertCircle,
  HelpCircle,
  Hash,
  Circle,
  PieChart,
  Disc,
  Shapes,
  Maximize2,
  Eye,
  RotateCw,
  ArrowUpDown,
  Info,
  ArrowLeftRight,
} from 'lucide-react';
import { SmartField } from './SmartField';
import {
  StructuralElement,
  ProjectLevel,
  Gridline,
  WorkPackage,
  ElementType,
  ElementStatus,
  WallOpeningForm,
  StairFlightForm,
  StairLandingForm,
} from '@/types';
import { resolveGridDimensions } from '@/lib/gridUtils';
import {
  calculateCurvedGeometry,
  CurvedGeometryResult,
  normalizeDimension,
} from '@/lib/elementCalculations';
import { useAuthStore } from '@/stores/useAuthStore';
import { isQAQCUser, hasMinRole, canCreateRecords } from '@/lib/permissions';
import { toast } from 'react-hot-toast';

/* ─── Element Type Config ─── */
interface ElementTypeConfig {
  type: ElementType;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  formula: string;
}

const ELEMENT_CONFIGS: ElementTypeConfig[] = [
  {
    type: 'COLUMN',
    label: 'Column',
    icon: Box,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    formula: 'Area × Height',
  },
  {
    type: 'BEAM',
    label: 'Beam',
    icon: Ruler,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800',
    formula: 'L × W × (D − t_slab) (Straight/Curved)',
  },
  {
    type: 'SLAB',
    label: 'Slab',
    icon: Layers,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
    formula: 'Net Area × Thickness (Rect / Curved Arc)',
  },
  {
    type: 'WALL',
    label: 'Wall',
    icon: Building2,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800',
    formula: '(L × H − Σ Voids) × Thk (Straight/Curved)',
  },
  {
    type: 'FOOTING',
    label: 'Footing',
    icon: Square,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800',
    formula: 'L × W × Depth',
  },
  {
    type: 'STAIR',
    label: 'Stair',
    icon: ArrowUpRight,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800',
    formula: 'Σ (Flights + Landings)',
  },
];

const CONCRETE_GRADES = [
  'C20/25',
  'C25/30',
  'C28/35',
  'C30/37',
  'C32/40',
  'C35/45',
  'C40/50',
  'C45/55',
  'C50/60',
  'C60/75',
];

interface ElementModalProps {
  isOpen: boolean;
  editingElement?: StructuralElement | null;
  levels: ProjectLevel[];
  gridlines?: Gridline[];
  packages?: WorkPackage[];
  onClose: () => void;
  onSubmit: (
    payload: Partial<StructuralElement>,
    editingId: string | null,
  ) => Promise<void>;
}

export const ElementModal: React.FC<ElementModalProps> = ({
  isOpen,
  editingElement,
  levels = [],
  gridlines = [],
  packages = [],
  onClose,
  onSubmit,
}) => {
  const isEdit = !!editingElement;
  const { currentUser } = useAuthStore();
  const isQAQC = isQAQCUser(currentUser) || canCreateRecords(currentUser?.role) || !currentUser;

  const { activeProject } = useProjectStore();
  // Form identity state
  const [elementName, setElementName] = useState('');
  const [elementType, setElementType] = useState<ElementType>('COLUMN');
  const [status, setStatus] = useState<ElementStatus>('PENDING');
  const [levelId, setLevelId] = useState(activeProject?.currentLevelId || '');
  const [workPackageId, setWorkPackageId] = useState('');
  const [gridAxis, setGridAxis] = useState('B/2');
  const [concreteGrade, setConcreteGrade] = useState('C40/50');
  const [rebarSpec, setRebarSpec] = useState('');
  const [plannedCastingDate, setPlannedCastingDate] = useState('');

  // Volumetric & Achieved Progress state
  const [calculatedVolumeOverride, setCalculatedVolumeOverride] = useState<string>('');
  const [achievedVolume, setAchievedVolume] = useState<number>(0);

  // Primary Dimensions (in meters)
  const [length, setLength] = useState<number>(0.6);
  const [width, setWidth] = useState<number>(0.6);
  const [height, setHeight] = useState<number>(3.2);
  const [depth, setDepth] = useState<number>(0.6);
  const [thickness, setThickness] = useState<number>(0.175);
  const [diameter, setDiameter] = useState<number>(0.6);

  // Column specific
  const [columnShape, setColumnShape] = useState<'rectangular' | 'circular' | 'inclined'>('rectangular');
  const [isInclined, setIsInclined] = useState(false);
  const [inclinedCalcMode, setInclinedCalcMode] = useState<'offset' | 'angle'>('offset');
  const [horizontalOffset, setHorizontalOffset] = useState<number>(0.4);
  const [inclinationAngle, setInclinationAngle] = useState<number>(10);

  // Slab specific (Curved & Geometric Profile)
  const [slabShape, setSlabShape] = useState<
    'rectangular' | 'circular_segment' | 'circular_sector' | 'semi_circular' | 'circular' | 'curved_cantilever' | 'trapezoidal_cantilever' | 'cad_area'
  >('rectangular');
  const [curvedInputMode, setCurvedInputMode] = useState<'radius_rise' | 'chord_rise' | 'radius_angle' | 'radius_chord'>('radius_rise');
  const [radius, setRadius] = useState<number>(2.96);
  const [arcDepth, setArcDepth] = useState<number>(2.394);
  const [chordLength, setChordLength] = useState<number>(5.81);
  const [arcAngle, setArcAngle] = useState<number>(157.9);
  const [cantileverDepth, setCantileverDepth] = useState<number>(1.95);
  const [taperEndDepth, setTaperEndDepth] = useState<number>(0);
  const [customArea, setCustomArea] = useState<number>(0);
  const [customPerimeter, setCustomPerimeter] = useState<number>(0);
  const [cantileverMidDepth, setCantileverMidDepth] = useState<string>('');
  const [isArcDeduction, setIsArcDeduction] = useState(false);
  const [cantileverDirection, setCantileverDirection] = useState<'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT'>('TOP');
  const [isMirrored, setIsMirrored] = useState(false);

  // Auto-derivation handlers for Curved Cantilever & Arcs
  const autoDeriveArcFromRadiusAndSpan = () => {
    const span = Number(length) || Number(chordLength) || 0;
    const r = Number(radius) || 0;
    if (span > 0 && r > 0) {
      const halfSpan = span / 2;
      if (halfSpan < r) {
        const derivedH = r - Math.sqrt(r * r - halfSpan * halfSpan);
        setArcDepth(parseFloat(derivedH.toFixed(3)));
        toast.success(`Arc Depth auto-derived: h = ${derivedH.toFixed(3)}m from R=${r}m & Span=${span}m`);
      } else {
        toast.error('Span cannot exceed diameter (2R).');
      }
    } else {
      toast.error('Please specify both Span and Radius to auto-derive.');
    }
  };

  const autoDeriveFromMidpointDepth = (midVal: string) => {
    setCantileverMidDepth(midVal);
    const midD = parseFloat(midVal);
    const endD = Number(cantileverDepth) || 0;
    const span = Number(length) || 0;
    if (!isNaN(midD) && midD >= 0 && endD > 0) {
      const derivedH = Math.abs(endD - midD);
      setArcDepth(parseFloat(derivedH.toFixed(3)));
      if (span > 0 && derivedH > 0) {
        const derivedR = (derivedH / 2) + (span * span) / (8 * derivedH);
        setRadius(parseFloat(derivedR.toFixed(3)));
      }
    }
  };

  // Beam specific (Straight vs Curved vs Tapered)
  const [beamShape, setBeamShape] = useState<'straight' | 'curved' | 'tapered'>('straight');
  const [deductSlab, setDeductSlab] = useState(true);
  const [supportedSlabThickness, setSupportedSlabThickness] = useState<number>(0.15);

  // Wall specific (Straight vs Curved)
  const [wallShape, setWallShape] = useState<'straight' | 'curved'>('straight');
  const [openings, setOpenings] = useState<WallOpeningForm[]>([]);

  // Stair specific
  const [flightWidth, setFlightWidth] = useState<number>(1.2);
  const [waistThickness, setWaistThickness] = useState<number>(0.15);
  const [flights, setFlights] = useState<StairFlightForm[]>([
    { id: '1', length: '3.0', riserCount: '10' },
  ]);
  const [landings, setLandings] = useState<StairLandingForm[]>([
    { id: '1', length: '1.2' },
  ]);
  const [landingThickness, setLandingThickness] = useState<number>(0.2);
  const [treadWidth, setTreadWidth] = useState<number>(0.28);
  const [stairViewMode, setStairViewMode] = useState<'plan' | 'section'>('plan');
  const [stairDirection, setStairDirection] = useState<'UP' | 'DOWN'>('UP');

  // Elevation Tracking
  const [elevationMode, setElevationMode] = useState<'auto' | 'manual'>('auto');
  const [elevationOffset, setElevationOffset] = useState<number>(0);
  const [manualBaseElevation, setManualBaseElevation] = useState<number>(0);
  const [manualTopElevation, setManualTopElevation] = useState<number>(3.2);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [gridHint, setGridHint] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset or initialize on open
  useEffect(() => {
    if (!isOpen) return;

    if (editingElement) {
      setElementName(editingElement.elementName || editingElement.name || '');
      const rawType = (editingElement.elementType || 'COLUMN').toUpperCase();
      const matchedType: ElementType = (
        rawType.includes('BEAM')
          ? 'BEAM'
          : rawType.includes('SLAB')
          ? 'SLAB'
          : rawType.includes('WALL')
          ? 'WALL'
          : rawType.includes('FOOTING')
          ? 'FOOTING'
          : rawType.includes('STAIR')
          ? 'STAIR'
          : 'COLUMN'
      );
      setElementType(matchedType);
      setStatus(editingElement.status || 'PENDING');
      setLevelId(editingElement.levelId || '');
      setWorkPackageId(editingElement.workPackageId || '');
      setGridAxis(editingElement.grid || editingElement.gridAxis || '');
      setConcreteGrade(editingElement.concreteGrade || 'C40/50');
      setRebarSpec(editingElement.rebarSpec || '');
      setPlannedCastingDate(
        editingElement.plannedCastingDate ||
          editingElement.plannedPourDate ||
          '',
      );

      // Dimensions
      const dims = editingElement.dimensions || {
        length: editingElement.length || 5.0,
        width: editingElement.width || 0.3,
        height: editingElement.height || 0.6,
      };
      setLength(editingElement.length ?? dims.length ?? 5.0);
      setWidth(editingElement.width ?? dims.width ?? 0.3);
      setHeight(editingElement.height ?? dims.height ?? 3.2);
      setDepth(
        editingElement.depth ??
          (dims as any).depth ??
          (matchedType === 'BEAM' ? (editingElement.height ?? dims.height) : undefined) ??
          0.6,
      );
      setThickness(editingElement.thickness ?? 0.175);
      setDiameter(editingElement.diameter ?? 0.6);

      // Column shape & inclination
      const colShape =
        editingElement.columnShape ||
        (editingElement.elementType === 'COLUMN_CIRCULAR' ||
        editingElement.elementType === 'Column (Circular)'
          ? 'circular'
          : 'rectangular');
      setColumnShape(colShape);
      setIsInclined(!!editingElement.isInclined || editingElement.verticality === 'inclined');
      setInclinedCalcMode(editingElement.inclinedCalcMode || 'offset');
      setHorizontalOffset(editingElement.horizontalOffset ?? 0.4);
      setInclinationAngle(editingElement.inclinationAngle ?? 10);

      // Slab Profile & Curved Parameters
      setSlabShape(
        editingElement.slabShape ||
          (editingElement.radius || editingElement.arcDepth
            ? 'circular_segment'
            : 'rectangular'),
      );
      setCurvedInputMode(editingElement.curvedInputMode || 'radius_rise');
      setRadius(editingElement.radius ?? 2.96);
      setArcDepth(editingElement.arcDepth ?? 2.394);
      setChordLength(editingElement.chordLength ?? 5.81);
      setArcAngle(editingElement.arcAngle ?? 157.9);
      setCantileverDepth(editingElement.cantileverDepth ?? 1.95);
      setTaperEndDepth((editingElement as any).taperEndDepth ?? 0);
      setCustomArea(editingElement.area || (editingElement as any).customArea || 0);
      setCustomPerimeter((editingElement as any).customPerimeter || 0);
      setIsArcDeduction(!!editingElement.isArcDeduction);
      setIsMirrored(!!(editingElement as any).isMirrored);
      const rawDir = (editingElement.cantileverDirection || '').toUpperCase();
      setCantileverDirection(
        rawDir === 'BOTTOM' || rawDir === 'SOUTH' ? 'BOTTOM'
        : rawDir === 'LEFT' || rawDir === 'WEST' ? 'LEFT'
        : rawDir === 'RIGHT' || rawDir === 'EAST' ? 'RIGHT'
        : 'TOP'
      );

      // Beam monolithic & curved
      setBeamShape(editingElement.beamShape || (editingElement.radius ? 'curved' : 'straight'));
      setSupportedSlabThickness(editingElement.supportedSlabThickness ?? 0.15);
      setDeductSlab(editingElement.supportedSlabThickness !== undefined && editingElement.supportedSlabThickness > 0);

      // Wall curved & openings
      setWallShape(editingElement.wallShape || (editingElement.radius ? 'curved' : 'straight'));
      if (editingElement.openings && Array.isArray(editingElement.openings)) {
        setOpenings(editingElement.openings);
      } else {
        setOpenings([]);
      }

      // Stairs
      setFlightWidth(editingElement.flightWidth ?? 1.2);
      setWaistThickness(editingElement.waistThickness ?? 0.15);
      setLandingThickness(
        typeof editingElement.landingThickness === 'number'
          ? editingElement.landingThickness
          : 0.2,
      );
      setTreadWidth(editingElement.treadWidth ?? 0.28);
      if (editingElement.flights && editingElement.flights.length > 0) {
        setFlights(editingElement.flights);
      }
      if (editingElement.landings && editingElement.landings.length > 0) {
        setLandings(editingElement.landings);
      }

      // Volume & Progress Initialization
      if (editingElement.calculatedVolume !== undefined && editingElement.calculatedVolume !== null) {
        setCalculatedVolumeOverride(String(editingElement.calculatedVolume));
      } else if (editingElement.volume !== undefined && editingElement.volume !== null) {
        setCalculatedVolumeOverride(String(editingElement.volume));
      } else {
        setCalculatedVolumeOverride('');
      }
      setAchievedVolume(
        editingElement.achievedVolume ??
        (editingElement.status === 'POURED' || editingElement.status === 'APPROVED'
          ? (editingElement.calculatedVolume || editingElement.volume || 0)
          : 0)
      );

      // Elevation
      setElevationOffset(editingElement.elevationOffset ?? 0);
      if (editingElement.elevation !== undefined || editingElement.topElevation !== undefined) {
        setElevationMode('manual');
        setManualBaseElevation(editingElement.elevation ?? editingElement.bottomElevation ?? 0);
        setManualTopElevation(editingElement.topElevation ?? 3.2);
      } else {
        setElevationMode('auto');
      }
    } else {
      // Default new element
      setElementName('');
      setElementType('COLUMN');
      setStatus('PENDING');
      if (levels.length > 0 && !levelId) {
        setLevelId(activeProject?.currentLevelId || levels[0].id);
      }
      if (packages.length > 0 && !workPackageId) {
        setWorkPackageId(packages[0].id);
      }
      setGridAxis('A/1');
      setConcreteGrade('C40/50');
      setRebarSpec('');
      setPlannedCastingDate('');
      setCalculatedVolumeOverride('');
      setAchievedVolume(0);
      setColumnShape('rectangular');
      setSlabShape('rectangular');
      setBeamShape('straight');
      setWallShape('straight');
      setRadius(2.96);
      setArcDepth(2.394);
      setChordLength(5.81);
      setArcAngle(157.9);
      setCantileverDepth(1.95);
      setIsArcDeduction(false);
      setIsMirrored(false);
      setCantileverDirection('TOP');
      setCurvedInputMode('radius_rise');
      setIsInclined(false);
      setLength(0.6);
      setWidth(0.6);
      setHeight(3.2);
      setDepth(0.6);
      setThickness(0.175);
      setDiameter(0.6);
      setElevationMode('auto');
      setElevationOffset(0);
      setOpenings([]);
    }
  }, [isOpen, editingElement, levels, packages]);

  // Selected Level object
  const selectedLevel = useMemo(() => {
    return levels.find((l) => l.id === levelId);
  }, [levels, levelId]);

  // Auto Grid Span Resolution
  useEffect(() => {
    if (!gridAxis || gridlines.length === 0) {
      setGridHint(null);
      return;
    }
    const resolved = resolveGridDimensions(gridAxis, gridlines, elementType);
    if (resolved && (resolved.length !== null || resolved.width !== null)) {
      setGridHint(
        `Auto-detected from grid: ${
          resolved.length ? `L=${resolved.length.toFixed(2)}m ` : ''
        }${resolved.width ? `W=${resolved.width.toFixed(2)}m` : ''}`,
      );
    } else {
      setGridHint(null);
    }
  }, [gridAxis, gridlines, elementType]);

  const applyGridDimensions = useCallback(() => {
    const resolved = resolveGridDimensions(gridAxis, gridlines, elementType);
    if (resolved && (resolved.length !== null || resolved.width !== null)) {
      if (resolved.length && (elementType === 'BEAM' || elementType === 'SLAB' || elementType === 'WALL')) {
        setLength(parseFloat(resolved.length.toFixed(3)));
      }
      if (resolved.width && (elementType === 'SLAB' || elementType === 'FOOTING')) {
        setWidth(parseFloat(resolved.width.toFixed(3)));
      }
    }
  }, [gridAxis, gridlines, elementType]);

  // Slanted column calculations
  const effectiveColumnHeight = useMemo(() => {
    if (!isInclined) return height;
    if (inclinedCalcMode === 'offset') {
      return Math.sqrt(height * height + horizontalOffset * horizontalOffset);
    } else {
      const rad = (inclinationAngle * Math.PI) / 180;
      return rad < Math.PI / 2 ? height / Math.cos(rad) : height;
    }
  }, [isInclined, inclinedCalcMode, height, horizontalOffset, inclinationAngle]);

  // Elevation Calculations
  const calculatedElevations = useMemo(() => {
    const levelElevation = selectedLevel?.elevation ?? 0;
    const baseWithOffset = levelElevation + (Number(elevationOffset) || 0);

    let base = baseWithOffset;
    let top = baseWithOffset + height;

    if (elementType === 'COLUMN' || elementType === 'WALL') {
      base = baseWithOffset;
      top = baseWithOffset + height;
    } else if (elementType === 'BEAM') {
      top = baseWithOffset;
      base = top - depth;
    } else if (elementType === 'SLAB') {
      top = baseWithOffset;
      base = top - thickness;
    } else if (elementType === 'FOOTING') {
      top = baseWithOffset;
      base = top - depth;
    } else if (elementType === 'STAIR') {
      base = baseWithOffset;
      top = baseWithOffset + height;
    }

    if (elevationMode === 'manual') {
      return {
        baseElevation: manualBaseElevation,
        topElevation: manualTopElevation,
        levelDatum: levelElevation,
      };
    }

    return {
      baseElevation: parseFloat(base.toFixed(3)),
      topElevation: parseFloat(top.toFixed(3)),
      levelDatum: levelElevation,
    };
  }, [
    selectedLevel,
    elevationOffset,
    height,
    depth,
    thickness,
    elementType,
    elevationMode,
    manualBaseElevation,
    manualTopElevation,
  ]);

  // Takeoff Live Calculations (Area m², Volume m³ and Formwork m²)
  const takeoff = useMemo(() => {
    let volume = 0;
    let formworkArea = 0;
    let elementArea = 0;
    let formulaDesc = '';
    let curvedGeom: CurvedGeometryResult | null = null;

    const L = Number(length) || 0;
    const W = Number(width) || 0;
    const H = Number(height) || 0;
    const D = Number(depth) || 0;
    const T = Number(thickness) || 0;
    const Dia = Number(diameter) || 0;
    const slabT = deductSlab ? Number(supportedSlabThickness) || 0 : 0;

    switch (elementType) {
      case 'COLUMN':
        if (columnShape === 'circular') {
          const rad = Dia / 2;
          elementArea = Math.PI * rad * rad;
          const effH = effectiveColumnHeight;
          volume = elementArea * effH;
          formworkArea = Math.PI * Dia * effH;
          formulaDesc = `π × (${Dia}m / 2)² × ${effH.toFixed(2)}m (Circular Ø)`;
        } else {
          const effH = effectiveColumnHeight;
          elementArea = L * W;
          volume = elementArea * effH;
          formworkArea = 2 * (L + W) * effH;
          formulaDesc = `${L}m × ${W}m × ${effH.toFixed(2)}m (Perimeter × Eff H)`;
        }
        break;

      case 'BEAM': {
        const netDepth = Math.max(0, D - slabT);
        if (beamShape === 'curved') {
          const geom = calculateCurvedGeometry({
            radius,
            arcDepth,
            chordLength: chordLength || L,
            arcAngle,
            inputMode: curvedInputMode,
          });
          curvedGeom = geom;
          const arcLen = geom.arcLength;
          elementArea = arcLen * W;
          volume = arcLen * W * D;
          formworkArea = (2 * netDepth + W) * arcLen;
          formulaDesc = `Curved Beam (R=${radius}m, Arc Len=${arcLen.toFixed(2)}m) × ${W}m × ${D}m | Formwork: (2 × (${D}m - ${slabT}m) + ${W}m) × ${arcLen.toFixed(2)}m`;
        } else {
          elementArea = L * W;
          volume = L * W * D;
          formworkArea = (2 * netDepth + W) * L;
          formulaDesc = `${L}m × ${W}m × ${D}m | Formwork: (2 × (${D}m - ${slabT}m) + ${W}m) × ${L}m`;
        }
        break;
      }

      case 'SLAB': {
        const t = T || 0.175;
        if (slabShape === 'circular_segment') {
          const geom = calculateCurvedGeometry({
            radius,
            arcDepth,
            chordLength,
            arcAngle,
            inputMode: curvedInputMode,
          });
          curvedGeom = geom;
          elementArea = geom.segmentArea;
          volume = elementArea * t;
          formworkArea = elementArea + (geom.arcLength + geom.chordLength) * t;
          formulaDesc = `Circular Segment (R=${geom.radius}m, Rise h=${geom.arcDepth}m, Chord=${geom.chordLength}m, θ=${geom.arcAngleDeg}°) → Area: ${elementArea.toFixed(2)}m² | Vol: ${volume.toFixed(3)}m³`;
        } else if (slabShape === 'circular_sector') {
          const geom = calculateCurvedGeometry({
            radius,
            arcAngle,
            inputMode: 'radius_angle',
          });
          curvedGeom = geom;
          elementArea = geom.sectorArea;
          volume = elementArea * t;
          formworkArea = elementArea + (2 * radius + geom.arcLength) * t;
          formulaDesc = `Circular Sector (R=${radius}m, θ=${arcAngle}°) → Area: ${elementArea.toFixed(2)}m² | Vol: ${volume.toFixed(3)}m³`;
        } else if (slabShape === 'semi_circular') {
          const effR = radius > 0 ? radius : (L > 0 ? L / 2 : 3.0);
          elementArea = 0.5 * Math.PI * effR * effR;
          volume = elementArea * t;
          const perimeter = Math.PI * effR + 2 * effR;
          formworkArea = elementArea + perimeter * t;
          formulaDesc = `Semi-Circle (R=${effR.toFixed(2)}m) → Area: ${elementArea.toFixed(2)}m² | Vol: ${volume.toFixed(3)}m³`;
        } else if (slabShape === 'circular') {
          const effR = radius > 0 ? radius : (Dia > 0 ? Dia / 2 : 3.0);
          elementArea = Math.PI * effR * effR;
          volume = elementArea * t;
          const perimeter = 2 * Math.PI * effR;
          formworkArea = elementArea + perimeter * t;
          formulaDesc = `Full Circle (R=${effR.toFixed(2)}m, Ø=${(effR * 2).toFixed(2)}m) → Area: ${elementArea.toFixed(2)}m² | Vol: ${volume.toFixed(3)}m³`;
        } else if (slabShape === 'curved_cantilever') {
          const effCant = cantileverDepth || W || 1.95;
          const baseArea = L * effCant;
          const geom = calculateCurvedGeometry({
            radius,
            arcDepth,
            chordLength: chordLength || L,
            arcAngle,
            inputMode:
              radius > 0 && arcDepth > 0
                ? 'radius_rise'
                : radius > 0 && L > 0
                ? 'radius_chord'
                : arcDepth > 0 && L > 0
                ? 'chord_rise'
                : curvedInputMode,
          });
          curvedGeom = geom;
          elementArea = isArcDeduction
            ? Math.max(0, baseArea - geom.segmentArea)
            : baseArea + geom.segmentArea;
          volume = elementArea * t;
          const edgePerimeter = 2 * L + 2 * effCant + geom.arcLength;
          formworkArea = elementArea + edgePerimeter * t;
          formulaDesc = `Curved Cantilever: Base (${baseArea.toFixed(2)}m²) ${isArcDeduction ? '−' : '+'} Arc (${geom.segmentArea.toFixed(2)}m²) = Area: ${elementArea.toFixed(2)}m²`;
        } else if (slabShape === 'trapezoidal_cantilever') {
          const startD = cantileverDepth || W || 1.872;
          const endD = taperEndDepth ?? 0;
          const baseArea = L * ((startD + endD) / 2);
          const filletDeduct = radius > 0 ? (1 - Math.PI / 4) * radius * radius : 0;
          elementArea = Math.max(0, baseArea - filletDeduct);
          volume = elementArea * t;
          const hypotenuse = Math.sqrt(L * L + Math.pow(Math.abs(startD - endD), 2));
          const perimeter = L + startD + endD + hypotenuse;
          formworkArea = elementArea + perimeter * t;
          formulaDesc = `Tapered Cantilever: L=${L}m, W₁=${startD}m, W₂=${endD}m ${filletDeduct > 0 ? `(−${filletDeduct.toFixed(2)}m² fillet)` : ''} → Area: ${elementArea.toFixed(2)}m² | Vol: ${volume.toFixed(3)}m³`;
        } else if (slabShape === 'cad_area') {
          elementArea = customArea || (L * W) || 0;
          volume = elementArea * t;
          const perim = customPerimeter > 0 ? customPerimeter : (L > 0 && W > 0 ? 2 * (L + W) : Math.sqrt(elementArea || 1) * 4);
          formworkArea = elementArea + perim * t;
          formulaDesc = `Direct CAD Polyline/Spline Area: ${elementArea.toFixed(2)}m² × ${t}m Thk → Vol: ${volume.toFixed(3)}m³`;
        } else {
          // Rectangular
          elementArea = L * W;
          volume = elementArea * t;
          formworkArea = elementArea + 2 * (L + W) * t;
          formulaDesc = `Rectangular Soffit: ${L}m × ${W}m (${elementArea.toFixed(2)}m²) + Edges: 2 × (${L} + ${W}) × ${t}m`;
        }
        break;
      }

      case 'WALL': {
        let wallLen = L;
        if (wallShape === 'curved') {
          const geom = calculateCurvedGeometry({
            radius,
            arcDepth,
            chordLength: chordLength || L,
            arcAngle,
            inputMode: curvedInputMode,
          });
          curvedGeom = geom;
          wallLen = geom.arcLength;
        }
        const grossArea = wallLen * H;
        const totalVoidArea = openings.reduce((sum, op) => {
          const w = Number(op.width) || 0;
          const h = Number(op.height) || 0;
          return sum + w * h;
        }, 0);
        const netArea = Math.max(0, grossArea - totalVoidArea);
        elementArea = netArea;
        volume = netArea * T;
        formworkArea = 2 * netArea + 2 * (wallLen + H) * T;
        formulaDesc = `${wallShape === 'curved' ? 'Curved ' : ''}Net Wall Area: (${grossArea.toFixed(2)}m² - ${totalVoidArea.toFixed(2)}m² void) = ${netArea.toFixed(2)}m² × ${T}m Thk`;
        break;
      }

      case 'FOOTING':
        elementArea = L * W;
        volume = L * W * D;
        formworkArea = 2 * (L + W) * D;
        formulaDesc = `${L}m × ${W}m × ${D}m | Sides: 2 × (${L} + ${W}) × ${D}m`;
        break;

      case 'STAIR': {
        const flightVol = flights.reduce((sum, f) => {
          const fL = Number(f.length) || 0;
          const rCount = Number(f.riserCount) || 1;
          const waistVol = fL * flightWidth * waistThickness;
          const avgRiserH = (H / Math.max(1, flights.length)) / rCount;
          const stepVol = 0.5 * avgRiserH * treadWidth * rCount * flightWidth;
          return sum + waistVol + stepVol;
        }, 0);

        const landingVol = landings.reduce((sum, l) => {
          const lL = Number(l.length) || 0;
          return sum + lL * flightWidth * landingThickness;
        }, 0);

        volume = flightVol + landingVol;
        const soffitArea = flights.reduce((s, f) => s + (Number(f.length) || 0) * flightWidth, 0);
        const landingArea = landings.reduce((s, l) => s + (Number(l.length) || 0) * flightWidth, 0);
        elementArea = soffitArea + landingArea;
        formworkArea = elementArea * 1.25;
        formulaDesc = `Flights (${flightVol.toFixed(2)}m³) + Landings (${landingVol.toFixed(2)}m³)`;
        break;
      }
    }

    return {
      elementArea: parseFloat(elementArea.toFixed(2)),
      volume: parseFloat(volume.toFixed(3)),
      formworkArea: parseFloat(formworkArea.toFixed(2)),
      formulaDesc,
      curvedGeom,
    };
  }, [
    elementType,
    columnShape,
    effectiveColumnHeight,
    length,
    width,
    height,
    depth,
    thickness,
    diameter,
    deductSlab,
    supportedSlabThickness,
    slabShape,
    curvedInputMode,
    radius,
    arcDepth,
    chordLength,
    arcAngle,
    cantileverDepth,
    taperEndDepth,
    customArea,
    customPerimeter,
    isArcDeduction,
    beamShape,
    wallShape,
    openings,
    flights,
    landings,
    flightWidth,
    waistThickness,
    landingThickness,
    treadWidth,
  ]);

  // Effective Calculated Volume (live takeoff with optional custom override)
  const effectiveCalculatedVolume = useMemo(() => {
    if (
      calculatedVolumeOverride !== '' &&
      !isNaN(Number(calculatedVolumeOverride))
    ) {
      return Number(calculatedVolumeOverride);
    }
    return takeoff.volume;
  }, [calculatedVolumeOverride, takeoff.volume]);

  // Percentage Achieved
  const achievedPct = useMemo(() => {
    if (effectiveCalculatedVolume <= 0) return 0;
    return Math.min(
      100,
      Math.max(
        0,
        Math.round((achievedVolume / effectiveCalculatedVolume) * 100),
      ),
    );
  }, [achievedVolume, effectiveCalculatedVolume]);

  // Wall Opening Handlers
  const addOpening = () => {
    setOpenings((prev) => [
      ...prev,
      { id: Date.now().toString(), width: 0.9, height: 2.1, sillHeight: 0 },
    ]);
  };

  const updateOpening = (index: number, field: string, value: number) => {
    setOpenings((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeOpening = (index: number) => {
    setOpenings((prev) => prev.filter((_, i) => i !== index));
  };

  // Stair Flight / Landing Handlers
  const addFlight = () => {
    setFlights((prev) => [
      ...prev,
      { id: Date.now().toString(), length: '3.0', riserCount: '10' },
    ]);
  };

  const updateFlight = (index: number, field: string, value: string) => {
    setFlights((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeFlight = (index: number) => {
    setFlights((prev) => prev.filter((_, i) => i !== index));
  };

  const addLanding = () => {
    setLandings((prev) => [
      ...prev,
      { id: Date.now().toString(), length: '1.2' },
    ]);
  };

  const updateLanding = (index: number, value: string) => {
    setLandings((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], length: value };
      return next;
    });
  };

  const removeLanding = (index: number) => {
    setLandings((prev) => prev.filter((_, i) => i !== index));
  };

  // Build Payload
  const buildPayload = (): Partial<StructuralElement> => {
    const selectedPkg = packages.find((p) => p.id === workPackageId);

    const payload: Partial<StructuralElement> = {
      elementName: elementName.trim(),
      name: elementName.trim(),
      elementType,
      status,
      levelId,
      levelName: selectedLevel?.name || '',
      grid: gridAxis.trim(),
      gridAxis: gridAxis.trim(),
      workPackageId: workPackageId || undefined,
      workPackageName: selectedPkg?.name || undefined,
      concreteGrade,
      rebarSpec: rebarSpec.trim() || undefined,
      plannedCastingDate: plannedCastingDate || undefined,
      plannedPourDate: plannedCastingDate || undefined,

      // Volume, Formwork & Area
      calculatedVolume: effectiveCalculatedVolume,
      volume: effectiveCalculatedVolume,
      achievedVolume: Number(achievedVolume) || 0,
      calculatedFormworkArea: takeoff.formworkArea,
      area: takeoff.elementArea,

      // Elevation Datum
      elevation: calculatedElevations.baseElevation,
      bottomElevation: calculatedElevations.baseElevation,
      topElevation: calculatedElevations.topElevation,
      elevationOffset: Number(elevationOffset) || 0,

      // Dimensions
      length: Number(length) || 0,
      width: Number(width) || 0,
      height: Number(height) || 0,
      depth: Number(depth) || 0,
      thickness: Number(thickness) || 0,
      diameter: Number(diameter) || 0,
      dimensions: {
        length: Number(length) || 0,
        width: Number(width) || 0,
        height: elementType === 'BEAM' ? (Number(depth) || 0) : (Number(height) || 0),
        depth: Number(depth) || 0,
      } as any,

      // Column attributes
      columnShape: elementType === 'COLUMN' ? columnShape : undefined,
      isInclined: elementType === 'COLUMN' ? isInclined : false,
      verticality: isInclined ? 'inclined' : 'straight',
      inclinedCalcMode: isInclined ? inclinedCalcMode : undefined,
      horizontalOffset: isInclined ? Number(horizontalOffset) : undefined,
      inclinationAngle: isInclined ? Number(inclinationAngle) : undefined,

      // Slab & Curved attributes
      slabShape: elementType === 'SLAB' ? slabShape : undefined,
      beamShape: elementType === 'BEAM' ? beamShape : undefined,
      wallShape: elementType === 'WALL' ? wallShape : undefined,
      radius:
        (elementType === 'SLAB' && slabShape !== 'rectangular') ||
        (elementType === 'BEAM' && beamShape === 'curved') ||
        (elementType === 'WALL' && wallShape === 'curved')
          ? Number(radius)
          : undefined,
      arcDepth:
        (elementType === 'SLAB' && (slabShape === 'circular_segment' || slabShape === 'curved_cantilever')) ||
        (elementType === 'BEAM' && beamShape === 'curved')
          ? Number(arcDepth)
          : undefined,
      chordLength:
        elementType === 'SLAB' && (slabShape === 'circular_segment' || slabShape === 'curved_cantilever')
          ? Number(chordLength)
          : undefined,
      arcAngle:
        (elementType === 'SLAB' && (slabShape === 'circular_sector' || slabShape === 'circular_segment')) ||
        (elementType === 'BEAM' && beamShape === 'curved') ||
        (elementType === 'WALL' && wallShape === 'curved')
          ? Number(arcAngle)
          : undefined,
      arcLength: takeoff.curvedGeom ? takeoff.curvedGeom.arcLength : undefined,
      curvedInputMode:
        elementType === 'SLAB' || elementType === 'BEAM' || elementType === 'WALL'
          ? curvedInputMode
          : undefined,
      cantileverDepth:
        elementType === 'SLAB' && (slabShape === 'curved_cantilever' || slabShape === 'trapezoidal_cantilever')
          ? Number(cantileverDepth)
          : undefined,
      cantileverDirection:
        elementType === 'SLAB' && (slabShape === 'curved_cantilever' || slabShape === 'trapezoidal_cantilever')
          ? cantileverDirection
          : undefined,
      isFlipped:
        elementType === 'SLAB' && cantileverDirection === 'BOTTOM',
      isMirrored:
        elementType === 'SLAB' && (slabShape === 'curved_cantilever' || slabShape === 'trapezoidal_cantilever')
          ? isMirrored
          : undefined,
      taperEndDepth:
        elementType === 'SLAB' && slabShape === 'trapezoidal_cantilever'
          ? Number(taperEndDepth)
          : undefined,
      customArea:
        elementType === 'SLAB' && slabShape === 'cad_area'
          ? Number(customArea)
          : undefined,
      customPerimeter:
        elementType === 'SLAB' && slabShape === 'cad_area'
          ? Number(customPerimeter)
          : undefined,
      isArcDeduction:
        elementType === 'SLAB' && slabShape === 'curved_cantilever'
          ? isArcDeduction
          : undefined,

      // Beam attributes
      supportedSlabThickness:
        elementType === 'BEAM' && deductSlab
          ? Number(supportedSlabThickness)
          : undefined,

      // Wall openings
      openings: elementType === 'WALL' ? openings : undefined,

      // Stair attributes
      flightWidth: elementType === 'STAIR' ? flightWidth : undefined,
      waistThickness: elementType === 'STAIR' ? waistThickness : undefined,
      landingThickness: elementType === 'STAIR' ? landingThickness : undefined,
      treadWidth: elementType === 'STAIR' ? treadWidth : undefined,
      flights: elementType === 'STAIR' ? flights : undefined,
      landings: elementType === 'STAIR' ? landings : undefined,
    };

    return payload;
  };

  // Submit and Close
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isQAQC) {
      toast.error('Unauthorized: QA/QC authority required to register or modify elements.');
      return;
    }
    if (!elementName.trim()) {
      nameInputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload();
      await onSubmit(payload, editingElement ? editingElement.id : null);
      onClose();
    } catch (err) {
      console.error('Failed to save element:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit and Add Another (Batch Entry)
  const handleSubmitAndAddAnother = async () => {
    if (!isQAQC) {
      toast.error('Unauthorized: QA/QC authority required to register elements.');
      return;
    }
    if (!elementName.trim()) {
      nameInputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload();
      await onSubmit(payload, null);

      const match = elementName.match(/^(.*?)(\d+)$/);
      if (match) {
        const prefix = match[1];
        const num = parseInt(match[2], 10) + 1;
        const padded = num.toString().padStart(match[2].length, '0');
        setElementName(`${prefix}${padded}`);
      } else {
        setElementName('');
      }

      nameInputRef.current?.focus();
    } catch (err) {
      console.error('Failed to register element batch:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to save
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        {/* ═══ Header ═══ */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {isEdit ? 'Edit Structural Element' : 'Register Structural Element'}
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-mono">
                  {elementType}
                </span>
                {elementType === 'SLAB' && slabShape !== 'rectangular' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 font-mono">
                    {slabShape.replace(/_/g, ' ')}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                True engineering dimensional takeoff & curved geometry derivation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ═══ Scrollable Body ═══ */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
        >
          {/* Element Type Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
              Select Structural Classification
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {ELEMENT_CONFIGS.map((cfg) => {
                const Icon = cfg.icon;
                const isSelected = elementType === cfg.type;
                return (
                  <button
                    key={cfg.type}
                    type="button"
                    onClick={() => {
                      setElementType(cfg.type);
                      if (cfg.type === 'COLUMN' && length === 0.6 && width === 0.6) {
                        setHeight(3.2);
                      } else if (cfg.type === 'BEAM') {
                        setLength(5.0);
                        setWidth(0.3);
                        setDepth(0.6);
                      } else if (cfg.type === 'SLAB') {
                        setLength(6.0);
                        setWidth(6.0);
                        setThickness(0.175);
                      } else if (cfg.type === 'WALL') {
                        setLength(4.0);
                        setHeight(3.2);
                        setThickness(0.25);
                      } else if (cfg.type === 'FOOTING') {
                        setLength(2.0);
                        setWidth(2.0);
                        setDepth(0.6);
                      }
                    }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? `${cfg.bg} ${cfg.color} border-brand-500 shadow-md ring-1 ring-brand-500/50`
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Info & Grid Alignment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Element ID / Tag <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  ref={nameInputRef}
                  type="text"
                  required
                  placeholder="e.g. S-ARC-01, C-B1-04, B-102"
                  value={elementName}
                  onChange={(e) => setElementName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Project Floor Level <span className="text-rose-500">*</span>
              </label>
              <select
                value={levelId}
                onChange={(e) => setLevelId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
              >
                {levels.length === 0 && <option value="">No Levels Defined</option>}
                {levels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name} ({lvl.elevation >= 0 ? `+${lvl.elevation}` : lvl.elevation}m)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Grid Coordinate / Span
                </label>
                {gridHint && (
                  <button
                    type="button"
                    onClick={applyGridDimensions}
                    className="text-[11px] text-brand-600 dark:text-brand-400 hover:text-brand-500 underline font-medium flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Apply Span
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="e.g. B/2, 2/C-E, C1-C1 Arc"
                value={gridAxis}
                onChange={(e) => setGridAxis(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 font-mono"
              />
              {gridHint && (
                <p className="text-[11px] text-brand-600 dark:text-brand-400/90 mt-1 font-mono">{gridHint}</p>
              )}
            </div>
          </div>

          {/* ═══ Elevation Datum Section ═══ */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Elevation Datum & Level Binding
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Mode:</span>
                <button
                  type="button"
                  onClick={() => setElevationMode(elevationMode === 'auto' ? 'manual' : 'auto')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    elevationMode === 'auto'
                      ? 'bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-500/40'
                      : 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40'
                  }`}
                >
                  {elevationMode === 'auto' ? '⚡ Auto-Derived' : '✏️ Manual Override'}
                </button>
              </div>
            </div>

            {elevationMode === 'auto' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-700/50">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Level Datum</span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {calculatedElevations.levelDatum >= 0 ? '+' : ''}
                    {calculatedElevations.levelDatum.toFixed(3)} m
                  </span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-700/50">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Base Elevation</span>
                  <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {calculatedElevations.baseElevation >= 0 ? '+' : ''}
                    {calculatedElevations.baseElevation.toFixed(3)} m
                  </span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-700/50">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Top Elevation</span>
                  <span className="text-sm font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {calculatedElevations.topElevation >= 0 ? '+' : ''}
                    {calculatedElevations.topElevation.toFixed(3)} m
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SmartField
                  label="Manual Base Elevation"
                  unit="m"
                  type="number"
                  step="0.001"
                  value={manualBaseElevation}
                  onChange={(v) => setManualBaseElevation(Number(v))}
                />
                <SmartField
                  label="Manual Top Elevation"
                  unit="m"
                  type="number"
                  step="0.001"
                  value={manualTopElevation}
                  onChange={(v) => setManualTopElevation(Number(v))}
                />
              </div>
            )}

            <div className="pt-1">
              <SmartField
                label="Datum Offset / Stepdown (+/-)"
                unit="m"
                type="number"
                step="0.01"
                placeholder="e.g. -0.05 for stepdown"
                value={elevationOffset}
                onChange={(v) => setElevationOffset(Number(v))}
              />
            </div>
          </div>

          {/* ═══ Dynamic Section Profiling & Dimensions ═══ */}
          <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Geometric Dimensions & Profile Specification
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Units: Meters (m)</span>
            </div>

            {/* ─── COLUMN Profile ─── */}
            {elementType === 'COLUMN' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Section Profile:</span>
                    <div className="inline-flex rounded-lg p-0.5 bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setColumnShape('rectangular')}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                          columnShape === 'rectangular'
                            ? 'bg-brand-500 text-white shadow'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Rectangular / Square
                      </button>
                      <button
                        type="button"
                        onClick={() => setColumnShape('circular')}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                          columnShape === 'circular'
                            ? 'bg-brand-500 text-white shadow'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Circular (Ø)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={isInclined}
                        onChange={(e) => setIsInclined(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-brand-500 focus:ring-brand-500 h-4 w-4"
                      />
                      <span>Slanted / Inclined Column</span>
                    </label>
                  </div>
                </div>

                {columnShape === 'rectangular' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <SmartField
                      label="Length (L / Width X)"
                      unit="m"
                      type="number"
                      step="0.01"
                      value={length}
                      onChange={(v) => setLength(Number(v))}
                    />
                    <SmartField
                      label="Width (W / Depth Y)"
                      unit="m"
                      type="number"
                      step="0.01"
                      value={width}
                      onChange={(v) => setWidth(Number(v))}
                    />
                    <SmartField
                      label="Clear Height (H)"
                      unit="m"
                      type="number"
                      step="0.01"
                      value={height}
                      onChange={(v) => setHeight(Number(v))}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SmartField
                      label="Column Diameter (Ø)"
                      unit="m"
                      type="number"
                      step="0.01"
                      value={diameter}
                      onChange={(v) => setDiameter(Number(v))}
                    />
                    <SmartField
                      label="Clear Height (H)"
                      unit="m"
                      type="number"
                      step="0.01"
                      value={height}
                      onChange={(v) => setHeight(Number(v))}
                    />
                  </div>
                )}

                {isInclined && (
                  <div className="p-3.5 bg-white dark:bg-slate-900/80 rounded-xl border border-amber-300 dark:border-amber-500/30 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        Slanted Column Derivation
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setInclinedCalcMode('offset')}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            inclinedCalcMode === 'offset'
                              ? 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Offset Mode (ΔX)
                        </button>
                        <button
                          type="button"
                          onClick={() => setInclinedCalcMode('angle')}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            inclinedCalcMode === 'angle'
                              ? 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Angle Mode (θ°)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {inclinedCalcMode === 'offset' ? (
                        <SmartField
                          label="Horizontal Offset (ΔX)"
                          unit="m"
                          type="number"
                          step="0.01"
                          value={horizontalOffset}
                          onChange={(v) => setHorizontalOffset(Number(v))}
                        />
                      ) : (
                        <SmartField
                          label="Inclination Angle from Vertical (θ)"
                          unit="deg"
                          type="number"
                          step="1"
                          value={inclinationAngle}
                          onChange={(v) => setInclinationAngle(Number(v))}
                        />
                      )}
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-center">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Derived Slant Length
                        </span>
                        <span className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400">
                          {effectiveColumnHeight.toFixed(3)} m
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── BEAM Profile (Straight vs Curved) ─── */}
            {elementType === 'BEAM' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Beam Geometry:</span>
                  <div className="inline-flex rounded-lg p-0.5 bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setBeamShape('straight')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                        beamShape === 'straight'
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Straight Beam
                    </button>
                    <button
                      type="button"
                      onClick={() => setBeamShape('curved')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                        beamShape === 'curved'
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Curved / Arc Beam
                    </button>
                  </div>
                </div>

                {beamShape === 'straight' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <SmartField
                      label="Span Length (L)"
                      unit="m"
                      type="number"
                      step="0.01"
                      value={length}
                      onChange={(v) => setLength(Number(v))}
                    />
                    <SmartField
                      label="Beam Width (b)"
                      unit="m"
                      type="number"
                      step="0.01"
                      value={width}
                      onChange={(v) => setWidth(Number(v))}
                    />
                    <SmartField
                      label="Overall Depth (D)"
                      unit="m"
                      type="number"
                      step="0.01"
                      value={depth}
                      onChange={(v) => setDepth(Number(v))}
                    />
                  </div>
                ) : (
                  <div className="space-y-3 p-3.5 bg-white dark:bg-slate-900/80 rounded-xl border border-amber-300 dark:border-amber-500/30 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <SmartField
                        label="Centerline Radius (R)"
                        unit="m"
                        type="number"
                        step="0.01"
                        value={radius}
                        onChange={(v) => setRadius(Number(v))}
                      />
                      <SmartField
                        label="Subtended Angle (θ)"
                        unit="deg"
                        type="number"
                        step="1"
                        value={arcAngle}
                        onChange={(v) => setArcAngle(Number(v))}
                      />
                      <SmartField
                        label="Beam Width (b)"
                        unit="m"
                        type="number"
                        step="0.01"
                        value={width}
                        onChange={(v) => setWidth(Number(v))}
                      />
                      <SmartField
                        label="Overall Depth (D)"
                        unit="m"
                        type="number"
                        step="0.01"
                        value={depth}
                        onChange={(v) => setDepth(Number(v))}
                      />
                    </div>
                    {takeoff.curvedGeom && (
                      <div className="flex items-center gap-4 text-xs font-mono text-amber-600 dark:text-amber-400 pt-1">
                        <span>Derived Arc Length: <strong>{takeoff.curvedGeom.arcLength.toFixed(3)}m</strong></span>
                        <span>Chord Span: <strong>{takeoff.curvedGeom.chordLength.toFixed(3)}m</strong></span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-3.5 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={deductSlab}
                      onChange={(e) => setDeductSlab(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-brand-500 focus:ring-brand-500 h-4 w-4"
                    />
                    <span>Deduct monolithic slab depth from side formwork</span>
                  </label>

                  {deductSlab && (
                    <div className="pt-2">
                      <SmartField
                        label="Supported Slab Thickness (t_slab)"
                        unit="m"
                        type="number"
                        step="0.01"
                        value={supportedSlabThickness}
                        onChange={(v) => setSupportedSlabThickness(Number(v))}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── SLAB Profile (Rectangular vs Curved / Arc / Segment / Sector) ─── */}
            {elementType === 'SLAB' && (
              <div className="space-y-4">
                {/* Slab Shape Type Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Slab Geometric Shape & Boundary Type:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-2">
                    {[
                      { id: 'rectangular', label: 'Rectangular', icon: Square },
                      { id: 'trapezoidal_cantilever', label: 'Tapered / Trapezoidal', icon: Shapes, highlight: true },
                      { id: 'curved_cantilever', label: 'Curved Cantilever / Bay', icon: Shapes },
                      { id: 'cad_area', label: 'Irregular (CAD Polyline/Spline)', icon: Sparkles },
                      { id: 'circular_segment', label: 'Circular Segment / Arc', icon: Shapes },
                      { id: 'semi_circular', label: 'Semi-Circular', icon: Circle },
                      { id: 'circular_sector', label: 'Circular Sector (Pie)', icon: PieChart },
                      { id: 'circular', label: 'Full Circle', icon: Disc },
                    ].map((shape) => {
                      const Icon = shape.icon;
                      const isSelected = slabShape === shape.id;
                      return (
                        <button
                          key={shape.id}
                          type="button"
                          onClick={() => setSlabShape(shape.id as any)}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-[11px] font-semibold transition ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-center leading-tight">{shape.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 1. RECTANGULAR SLAB */}
                {slabShape === 'rectangular' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <SmartField
                      label="Length (L / Span X)"
                      unit="m"
                      type="number"
                      step="0.01"
                      value={length}
                      onChange={(v) => setLength(Number(v))}
                    />
                    <SmartField
                      label="Width (W / Span Y)"
                      unit="m"
                      type="number"
                      step="0.01"
                      value={width}
                      onChange={(v) => setWidth(Number(v))}
                    />
                    <SmartField
                      label="Slab Thickness (T)"
                      unit="m"
                      type="number"
                      step="0.005"
                      value={thickness}
                      onChange={(v) => setThickness(Number(v))}
                    />
                  </div>
                )}

                {/* 2. CIRCULAR SEGMENT / ARCH SLAB (CAD Radius & Arc Depth Match) */}
                {slabShape === 'circular_segment' && (
                  <div className="p-4 bg-white dark:bg-slate-900/90 rounded-2xl border border-emerald-300 dark:border-emerald-500/40 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" /> Circular Segment Arc Geometry
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Calculates exact plan area, chord span, and arc length directly from CAD parameters
                        </p>
                      </div>

                      {/* Input Mode Toggle */}
                      <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setCurvedInputMode('radius_chord')}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                            curvedInputMode === 'radius_chord'
                              ? 'bg-emerald-500 text-slate-950 shadow'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Radius (R) + Span (C) [Auto h]
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurvedInputMode('radius_rise')}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                            curvedInputMode === 'radius_rise'
                              ? 'bg-emerald-500 text-slate-950 shadow'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Radius (R) + Arc Depth (h)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurvedInputMode('chord_rise')}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                            curvedInputMode === 'chord_rise'
                              ? 'bg-emerald-500 text-slate-950 shadow'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Chord (C) + Arc Depth (h)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurvedInputMode('radius_angle')}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                            curvedInputMode === 'radius_angle'
                              ? 'bg-emerald-500 text-slate-950 shadow'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          Radius (R) + Angle (θ°)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {curvedInputMode === 'radius_chord' && (
                        <>
                          <SmartField
                            label="Arc Radius (R)"
                            unit="m"
                            type="number"
                            step="0.001"
                            value={radius}
                            placeholder="e.g. 2.960"
                            onChange={(v) => setRadius(Number(v))}
                          />
                          <SmartField
                            label="Chord Span Width (C)"
                            unit="m"
                            type="number"
                            step="0.001"
                            value={chordLength}
                            placeholder="e.g. 5.810"
                            onChange={(v) => setChordLength(Number(v))}
                          />
                        </>
                      )}

                      {curvedInputMode === 'radius_rise' && (
                        <>
                          <SmartField
                            label="Arc Radius (R)"
                            unit="m"
                            type="number"
                            step="0.001"
                            value={radius}
                            placeholder="e.g. 2.960"
                            onChange={(v) => setRadius(Number(v))}
                          />
                          <SmartField
                            label="Arc Depth / Rise (h)"
                            unit="m"
                            type="number"
                            step="0.001"
                            value={arcDepth}
                            placeholder="e.g. 2.394"
                            onChange={(v) => setArcDepth(Number(v))}
                          />
                        </>
                      )}

                      {curvedInputMode === 'chord_rise' && (
                        <>
                          <SmartField
                            label="Chord Span Width (C)"
                            unit="m"
                            type="number"
                            step="0.001"
                            value={chordLength}
                            placeholder="e.g. 5.810"
                            onChange={(v) => setChordLength(Number(v))}
                          />
                          <SmartField
                            label="Arc Depth / Rise (h)"
                            unit="m"
                            type="number"
                            step="0.001"
                            value={arcDepth}
                            placeholder="e.g. 2.394"
                            onChange={(v) => setArcDepth(Number(v))}
                          />
                        </>
                      )}

                      {curvedInputMode === 'radius_angle' && (
                        <>
                          <SmartField
                            label="Arc Radius (R)"
                            unit="m"
                            type="number"
                            step="0.001"
                            value={radius}
                            placeholder="e.g. 2.960"
                            onChange={(v) => setRadius(Number(v))}
                          />
                          <SmartField
                            label="Subtended Angle (θ)"
                            unit="deg"
                            type="number"
                            step="0.1"
                            value={arcAngle}
                            placeholder="e.g. 157.9"
                            onChange={(v) => setArcAngle(Number(v))}
                          />
                        </>
                      )}

                      <SmartField
                        label="Slab Thickness (T)"
                        unit="m"
                        type="number"
                        step="0.005"
                        value={thickness}
                        placeholder="e.g. 0.175"
                        onChange={(v) => setThickness(Number(v))}
                      />
                    </div>

                    {/* Interactive CAD Schematic & Derived Metrics */}
                    {takeoff.curvedGeom && (
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            CAD Computed Geometry Results
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            Approx. Plan Area: {takeoff.elementArea.toFixed(2)} m²
                          </span>
                        </div>

                        {/* Visual SVG CAD Diagram */}
                        <div className="h-32 bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center p-2 relative overflow-hidden">
                          <svg
                            viewBox="0 0 320 120"
                            className="w-full h-full max-w-sm"
                          >
                            {/* Gridlines Background */}
                            <line x1="20" y1="90" x2="300" y2="90" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 2" />
                            <line x1="160" y1="10" x2="160" y2="110" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" />

                            {/* Circular Segment Filled Shape */}
                            <path
                              d="M 50 90 A 130 130 0 0 1 270 90 Z"
                              fill="rgba(16, 185, 129, 0.25)"
                              stroke="#10b981"
                              strokeWidth="2.5"
                            />

                            {/* Radius indicator arrow */}
                            <line x1="160" y1="110" x2="225" y2="35" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="2 2" />
                            <text x="200" y="75" fill="#ec4899" fontSize="9" fontWeight="bold" fontFamily="monospace">
                              R={takeoff.curvedGeom.radius.toFixed(2)}m
                            </text>

                            {/* Rise / Arc depth indicator */}
                            <line x1="160" y1="20" x2="160" y2="90" stroke="#a855f7" strokeWidth="2" />
                            <text x="165" y="55" fill="#a855f7" fontSize="9" fontWeight="bold" fontFamily="monospace">
                              h={takeoff.curvedGeom.arcDepth.toFixed(2)}m
                            </text>

                            {/* Chord span bottom indicator */}
                            <line x1="50" y1="105" x2="270" y2="105" stroke="#0284c7" strokeWidth="1.5" />
                            <text x="135" y="116" fill="#0284c7" fontSize="9" fontWeight="bold" fontFamily="monospace">
                              Span C={takeoff.curvedGeom.chordLength.toFixed(2)}m
                            </text>

                            {/* Area text in center */}
                            <text x="110" y="78" className="fill-slate-900 dark:fill-white" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                              Area ≈ {takeoff.elementArea.toFixed(2)} m²
                            </text>
                          </svg>
                        </div>

                        {/* Geometric Metrics Readouts */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                          <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Arc Length (s)</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {takeoff.curvedGeom.arcLength.toFixed(3)} m
                            </span>
                          </div>
                          <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Chord Span (C)</span>
                            <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                              {takeoff.curvedGeom.chordLength.toFixed(3)} m
                            </span>
                          </div>
                          <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Included Angle (θ)</span>
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              {takeoff.curvedGeom.arcAngleDeg.toFixed(1)}°
                            </span>
                          </div>
                          <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Wet Concrete Vol</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {takeoff.volume.toFixed(3)} m³
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. CURVED CANTILEVER / BALCONY WITH ARC */}
                {slabShape === 'curved_cantilever' && (
                  <div className="p-4 bg-white dark:bg-slate-900/90 rounded-2xl border border-emerald-300 dark:border-emerald-500/40 space-y-4 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          Curved Cantilever Bay Profile
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Calculates cantilever slab panels with curved edge projections or inward recess cutouts
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Facing Direction Controls */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1.5 uppercase">Facing:</span>
                          <button
                            type="button"
                            onClick={() => setCantileverDirection('TOP')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                              cantileverDirection === 'TOP'
                                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                            title="Cantilever projects North / Upwards"
                          >
                            ↑ North / Top
                          </button>
                          <button
                            type="button"
                            onClick={() => setCantileverDirection('BOTTOM')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                              cantileverDirection === 'BOTTOM'
                                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                            title="Cantilever projects South / Downwards"
                          >
                            ↓ South / Bottom
                          </button>
                          <button
                            type="button"
                            onClick={() => setCantileverDirection('LEFT')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                              cantileverDirection === 'LEFT'
                                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                            title="Cantilever projects West / Left"
                          >
                            ← West
                          </button>
                          <button
                            type="button"
                            onClick={() => setCantileverDirection('RIGHT')}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                              cantileverDirection === 'RIGHT'
                                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                            title="Cantilever projects East / Right"
                          >
                            → East
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCantileverDirection((prev) =>
                                prev === 'TOP' ? 'BOTTOM' : prev === 'BOTTOM' ? 'TOP' : prev === 'LEFT' ? 'RIGHT' : 'LEFT'
                              )
                            }
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-200 dark:bg-slate-700 hover:bg-emerald-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 transition flex items-center gap-1"
                            title="Flip Facing Direction 180°"
                          >
                            <RotateCw className="w-3 h-3" /> Flip ⇅
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsMirrored((m) => !m)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border ${
                              isMirrored
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                                : 'bg-slate-200 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-200 border-transparent'
                            }`}
                            title="Mirror Left ⇄ Right (Invert curvature / arc corner side)"
                          >
                            <ArrowLeftRight className="w-3 h-3" /> Mirror ⇄
                          </button>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                          <input
                            type="checkbox"
                            checked={isArcDeduction}
                            onChange={(e) => setIsArcDeduction(e.target.checked)}
                            className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                          />
                          <span>Deduct Arc (Inward Recess / Cutout)</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <SmartField
                        label="Bay Span Length (L)"
                        unit="m"
                        type="number"
                        step="0.01"
                        value={length}
                        placeholder="e.g. 24.80"
                        onChange={(v) => setLength(Number(v))}
                      />
                      <SmartField
                        label="Cantilever End Depth (W_cant)"
                        unit="m"
                        type="number"
                        step="0.01"
                        value={cantileverDepth}
                        placeholder="e.g. 1.872"
                        onChange={(v) => setCantileverDepth(Number(v))}
                      />
                      <SmartField
                        label="Slab Thickness (T)"
                        unit="m"
                        type="number"
                        step="0.005"
                        value={thickness}
                        placeholder="e.g. 0.175"
                        onChange={(v) => setThickness(Number(v))}
                      />
                      <SmartField
                        label="Curved Arc Radius (R)"
                        unit="m"
                        type="number"
                        step="0.01"
                        value={radius}
                        placeholder="e.g. 98.24 or 7.25"
                        onChange={(v) => setRadius(Number(v))}
                      />
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Arc Depth / Rise (h)
                          </label>
                          {radius > 0 && length > 0 && (
                            <button
                              type="button"
                              onClick={autoDeriveArcFromRadiusAndSpan}
                              className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                              title="Auto-derive h = R - sqrt(R² - (L/2)²)"
                            >
                              <Sparkles className="w-3 h-3" /> Auto-Derive
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.001"
                            value={arcDepth || ''}
                            placeholder="Auto-derived or enter"
                            onChange={(e) => setArcDepth(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-slate-400">m</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Midpoint Depth (W_mid) <span className="text-[10px] font-normal text-slate-400">(Optional Helper)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.001"
                            value={cantileverMidDepth}
                            placeholder="e.g. 0.835"
                            onChange={(e) => autoDeriveFromMidpointDepth(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-slate-400">m</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          Derives h = |W_cant − W_mid| and Radius automatically
                        </p>
                      </div>
                    </div>

                    {/* Breakdown calculation summary */}
                    {takeoff.curvedGeom && (
                      <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-semibold text-emerald-800 dark:text-emerald-300">
                          <span>{takeoff.formulaDesc}</span>
                          <span className="font-mono">{takeoff.elementArea.toFixed(2)} m²</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                          <span>Base: {(length * (cantileverDepth || 0)).toFixed(2)} m²</span>
                          <span>Arc Segment: {takeoff.curvedGeom.segmentArea.toFixed(2)} m²</span>
                          <span>Arc Rise (h): {takeoff.curvedGeom.arcDepth.toFixed(3)} m</span>
                          <span>Radius (R): {takeoff.curvedGeom.radius.toFixed(2)} m</span>
                          <span>Wet Volume: {takeoff.volume.toFixed(3)} m³</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. TAPERED / TRAPEZOIDAL CANTILEVER SLAB */}
                {slabShape === 'trapezoidal_cantilever' && (
                  <div className="p-4 bg-white dark:bg-slate-900/90 rounded-2xl border border-emerald-300 dark:border-emerald-500/40 space-y-4 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Shapes className="w-4 h-4" /> Tapered / Trapezoidal Cantilever Slab
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Linearly tapered cantilever edge with corner fillet arc (e.g. C7 — C8 — C1)
                        </p>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 px-1.5 uppercase">Facing:</span>
                        <button
                          type="button"
                          onClick={() => setCantileverDirection('BOTTOM')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                            cantileverDirection === 'BOTTOM'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          title="Cantilever projects South / Downwards (as in CAD)"
                        >
                          ↓ South / Bottom
                        </button>
                        <button
                          type="button"
                          onClick={() => setCantileverDirection('TOP')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                            cantileverDirection === 'TOP'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          title="Cantilever projects North / Upwards"
                        >
                          ↑ North / Top
                        </button>
                        <button
                          type="button"
                          onClick={() => setCantileverDirection('LEFT')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                            cantileverDirection === 'LEFT'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          title="Cantilever projects West / Left"
                        >
                          ← West
                        </button>
                        <button
                          type="button"
                          onClick={() => setCantileverDirection('RIGHT')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                            cantileverDirection === 'RIGHT'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          title="Cantilever projects East / Right"
                        >
                          → East
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCantileverDirection((prev) =>
                              prev === 'BOTTOM' ? 'TOP' : prev === 'TOP' ? 'BOTTOM' : prev === 'LEFT' ? 'RIGHT' : 'LEFT'
                            )
                          }
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-200 dark:bg-slate-700 hover:bg-emerald-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 transition flex items-center gap-1"
                          title="Flip Facing Direction 180°"
                        >
                          <RotateCw className="w-3 h-3" /> Flip ⇅
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsMirrored((m) => !m)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border ${
                            isMirrored
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                              : 'bg-slate-200 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-200 border-transparent'
                          }`}
                          title="Mirror Left ⇄ Right (Invert W1 start depth and corner fillet arc side)"
                        >
                          <ArrowLeftRight className="w-3 h-3" /> Mirror ⇄
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <SmartField
                        label="Bay Span Length (L)"
                        unit="m"
                        type="number"
                        step="0.01"
                        value={length}
                        placeholder="e.g. 24.799"
                        onChange={(v) => setLength(Number(v))}
                      />
                      <SmartField
                        label="Start Cantilever Depth (W₁ / Left)"
                        unit="m"
                        type="number"
                        step="0.01"
                        value={cantileverDepth}
                        placeholder="e.g. 1.872"
                        onChange={(v) => setCantileverDepth(Number(v))}
                      />
                      <SmartField
                        label="End Cantilever Depth (W₂ / Right)"
                        unit="m"
                        type="number"
                        step="0.01"
                        value={taperEndDepth}
                        placeholder="e.g. 0.00 or 0.30"
                        onChange={(v) => setTaperEndDepth(Number(v))}
                      />
                      <SmartField
                        label="Corner Fillet Radius (R)"
                        unit="m"
                        type="number"
                        step="0.01"
                        value={radius}
                        placeholder="Optional (e.g. 1.50)"
                        onChange={(v) => setRadius(Number(v))}
                      />
                      <SmartField
                        label="Slab Thickness (T)"
                        unit="m"
                        type="number"
                        step="0.005"
                        value={thickness}
                        placeholder="e.g. 0.175"
                        onChange={(v) => setThickness(Number(v))}
                      />
                    </div>

                    {/* Breakdown calculation summary */}
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-semibold text-emerald-800 dark:text-emerald-300">
                        <span>{takeoff.formulaDesc}</span>
                        <span className="font-mono">{takeoff.elementArea.toFixed(2)} m²</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                        <span>Span: {length} m</span>
                        <span>Avg Width: {(((cantileverDepth || 0) + (taperEndDepth || 0)) / 2).toFixed(3)} m</span>
                        <span>Wet Volume: {takeoff.volume.toFixed(3)} m³</span>
                        <span>Formwork Area: {takeoff.formworkArea.toFixed(2)} m²</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. IRREGULAR POLYLINE / SPLINE DIRECT CAD AREA */}
                {slabShape === 'cad_area' && (
                  <div className="p-4 bg-white dark:bg-slate-900/90 rounded-2xl border border-emerald-300 dark:border-emerald-500/40 space-y-4 shadow-sm">
                    <div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> Irregular Polyline / Spline Area (Direct CAD Takeoff)
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Select the closed polyline or hatch in AutoCAD and type <strong>LI</strong> (or AREA) to copy the exact CAD plan area.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          CAD Measured Plan Area (A)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.001"
                            value={customArea || ''}
                            placeholder="e.g. 24.789"
                            onChange={(e) => setCustomArea(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-slate-400">m²</span>
                        </div>
                      </div>

                      <SmartField
                        label="Slab Thickness (T)"
                        unit="m"
                        type="number"
                        step="0.005"
                        value={thickness}
                        placeholder="e.g. 0.175"
                        onChange={(v) => setThickness(Number(v))}
                      />

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Boundary Perimeter (P) <span className="text-[10px] font-normal text-slate-400">(Optional)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={customPerimeter || ''}
                            placeholder="e.g. 32.50"
                            onChange={(e) => setCustomPerimeter(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-slate-400">m</span>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown calculation summary */}
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-semibold text-emerald-800 dark:text-emerald-300">
                        <span>{takeoff.formulaDesc}</span>
                        <span className="font-mono">{takeoff.elementArea.toFixed(2)} m²</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                        <span>Net Area: {takeoff.elementArea.toFixed(2)} m²</span>
                        <span>Slab Thickness: {thickness} m</span>
                        <span>Wet Volume: {takeoff.volume.toFixed(3)} m³</span>
                        <span>Formwork Contact Area: {takeoff.formworkArea.toFixed(2)} m²</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. SEMI-CIRCULAR / FULL CIRCLE / SECTOR */}
                {(slabShape === 'semi_circular' || slabShape === 'circular' || slabShape === 'circular_sector') && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <SmartField
                      label={slabShape === 'circular' ? 'Radius (R) or Ø/2' : 'Radius (R)'}
                      unit="m"
                      type="number"
                      step="0.01"
                      value={radius}
                      onChange={(v) => setRadius(Number(v))}
                    />
                    {slabShape === 'circular_sector' && (
                      <SmartField
                        label="Sector Angle (θ)"
                        unit="deg"
                        type="number"
                        step="1"
                        value={arcAngle}
                        onChange={(v) => setArcAngle(Number(v))}
                      />
                    )}
                    <SmartField
                      label="Slab Thickness (T)"
                      unit="m"
                      type="number"
                      step="0.005"
                      value={thickness}
                      onChange={(v) => setThickness(Number(v))}
                    />
                  </div>
                )}

                {/* ─── LIVE 2D CONCEPT SHAPE PREVIEW ─── */}
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-md space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <span>Live 2D Concept & Geometry Verification</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {(slabShape === 'curved_cantilever' || slabShape === 'trapezoidal_cantilever') && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setCantileverDirection((prev) =>
                                prev === 'TOP' ? 'BOTTOM' : prev === 'BOTTOM' ? 'TOP' : prev === 'LEFT' ? 'RIGHT' : 'LEFT'
                              )
                            }
                            className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 text-[11px] font-bold transition border border-emerald-500/30"
                            title="Flip Facing Direction 180°"
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>Flip ({cantileverDirection})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsMirrored((m) => !m)}
                            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition border ${
                              isMirrored
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                                : 'bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-400 border-indigo-500/30'
                            }`}
                            title="Mirror Horizontally (Invert taper/arc side)"
                          >
                            <ArrowLeftRight className="w-3 h-3" />
                            <span>Mirror {isMirrored ? '⇄ (Mirrored)' : '⇄'}</span>
                          </button>
                        </>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                        {slabShape.replace(/_/g, ' ').toUpperCase()}{slabShape === 'curved_cantilever' ? ` · ${cantileverDirection}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-48 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden p-2">
                    {/* Architectural grid background pattern */}
                    <svg className="w-full h-full" viewBox="0 0 400 180" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        <pattern id="modal-grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                        </pattern>
                      </defs>
                      <rect width="400" height="180" fill="url(#modal-grid-pattern)" />

                      {(() => {
                        const effL = length || 9.21;
                        const effCant = cantileverDepth || 1.95;
                        const effR = radius || 2.96;
                        const effH = arcDepth || 2.394;

                        if (slabShape === 'curved_cantilever') {
                          const isHorizontal = cantileverDirection === 'TOP' || cantileverDirection === 'BOTTOM';
                          const baseW = isHorizontal ? 280 : 70;
                          const baseH = isHorizontal ? 70 : 120;
                          const bx = isHorizontal ? 60 : 165;
                          const by = isHorizontal ? 40 : 30;

                          const riseNorm = Math.min(0.85, (effH / (effCant || 1.872)) * 0.7);
                          const dipPx = Math.max(16, Math.min(52, (isHorizontal ? baseH : baseW) * riseNorm));

                          let pathD = '';
                          let beamLine: { x1: number; y1: number; x2: number; y2: number; textX: number; textY: number; textAnchor: 'middle' | 'start' | 'end' } = { x1: 0, y1: 0, x2: 0, y2: 0, textX: 0, textY: 0, textAnchor: 'middle' };
                          let dimL = { x1: 0, y1: 0, x2: 0, y2: 0, textX: 0, textY: 0 };
                          let dimW: { x1: number; y1: number; x2: number; y2: number; textX: number; textY: number; textAnchor: 'middle' | 'start' | 'end' } = { x1: 0, y1: 0, x2: 0, y2: 0, textX: 0, textY: 0, textAnchor: 'end' };
                          let dipLine = { x1: 0, y1: 0, x2: 0, y2: 0, textX: 0, textY: 0 };

                          if (cantileverDirection === 'TOP') {
                            pathD = isArcDeduction
                              ? `M ${bx} ${by + baseH} L ${bx} ${by} Q ${bx + baseW / 2} ${by + dipPx} ${bx + baseW} ${by} L ${bx + baseW} ${by + baseH} Z`
                              : `M ${bx} ${by + baseH} L ${bx} ${by} Q ${bx + baseW / 2} ${by - dipPx} ${bx + baseW} ${by} L ${bx + baseW} ${by + baseH} Z`;
                            beamLine = { x1: bx, y1: by + baseH, x2: bx + baseW, y2: by + baseH, textX: bx + baseW / 2, textY: by + baseH + 16, textAnchor: 'middle' };
                            dimL = { x1: bx, y1: by - 12, x2: bx + baseW, y2: by - 12, textX: bx + baseW / 2, textY: by - 16 };
                            dimW = { x1: bx - 12, y1: by, x2: bx - 12, y2: by + baseH, textX: bx - 16, textY: by + baseH / 2 + 3, textAnchor: 'end' };
                            dipLine = { x1: bx + baseW / 2, y1: by, x2: bx + baseW / 2, y2: by + dipPx, textX: bx + baseW / 2 + 6, textY: by + dipPx / 2 + 4 };
                          } else if (cantileverDirection === 'BOTTOM') {
                            pathD = isArcDeduction
                              ? `M ${bx} ${by} L ${bx + baseW} ${by} L ${bx + baseW} ${by + baseH} Q ${bx + baseW / 2} ${by + baseH - dipPx} ${bx} ${by + baseH} Z`
                              : `M ${bx} ${by} L ${bx + baseW} ${by} L ${bx + baseW} ${by + baseH} Q ${bx + baseW / 2} ${by + baseH + dipPx} ${bx} ${by + baseH} Z`;
                            beamLine = { x1: bx, y1: by, x2: bx + baseW, y2: by, textX: bx + baseW / 2, textY: by - 8, textAnchor: 'middle' };
                            dimL = { x1: bx, y1: by + baseH + 18, x2: bx + baseW, y2: by + baseH + 18, textX: bx + baseW / 2, textY: by + baseH + 30 };
                            dimW = { x1: bx - 12, y1: by, x2: bx - 12, y2: by + baseH, textX: bx - 16, textY: by + baseH / 2 + 3, textAnchor: 'end' };
                            dipLine = { x1: bx + baseW / 2, y1: by + baseH, x2: bx + baseW / 2, y2: by + baseH - dipPx, textX: bx + baseW / 2 + 6, textY: by + baseH - dipPx / 2 + 4 };
                          } else if (cantileverDirection === 'LEFT') {
                            pathD = isArcDeduction
                              ? `M ${bx + baseW} ${by} L ${bx} ${by} Q ${bx + dipPx} ${by + baseH / 2} ${bx} ${by + baseH} L ${bx + baseW} ${by + baseH} Z`
                              : `M ${bx + baseW} ${by} L ${bx} ${by} Q ${bx - dipPx} ${by + baseH / 2} ${bx} ${by + baseH} L ${bx + baseW} ${by + baseH} Z`;
                            beamLine = { x1: bx + baseW, y1: by, x2: bx + baseW, y2: by + baseH, textX: bx + baseW + 8, textY: by + baseH / 2, textAnchor: 'start' };
                            dimL = { x1: bx + baseW + 22, y1: by, x2: bx + baseW + 22, y2: by + baseH, textX: bx + baseW + 36, textY: by + baseH / 2 };
                            dimW = { x1: bx, y1: by - 12, x2: bx + baseW, y2: by - 12, textX: bx + baseW / 2, textY: by - 16, textAnchor: 'middle' };
                            dipLine = { x1: bx, y1: by + baseH / 2, x2: bx + dipPx, y2: by + baseH / 2, textX: bx + dipPx / 2, textY: by + baseH / 2 - 6 };
                          } else {
                            // RIGHT
                            pathD = isArcDeduction
                              ? `M ${bx} ${by} L ${bx + baseW} ${by} Q ${bx + baseW - dipPx} ${by + baseH / 2} ${bx + baseW} ${by + baseH} L ${bx} ${by + baseH} Z`
                              : `M ${bx} ${by} L ${bx + baseW} ${by} Q ${bx + baseW + dipPx} ${by + baseH / 2} ${bx + baseW} ${by + baseH} L ${bx} ${by + baseH} Z`;
                            beamLine = { x1: bx, y1: by, x2: bx, y2: by + baseH, textX: bx - 8, textY: by + baseH / 2, textAnchor: 'end' };
                            dimL = { x1: bx - 22, y1: by, x2: bx - 22, y2: by + baseH, textX: bx - 34, textY: by + baseH / 2 };
                            dimW = { x1: bx, y1: by - 12, x2: bx + baseW, y2: by - 12, textX: bx + baseW / 2, textY: by - 16, textAnchor: 'middle' };
                            dipLine = { x1: bx + baseW, y1: by + baseH / 2, x2: bx + baseW - dipPx, y2: by + baseH / 2, textX: bx + baseW - dipPx / 2, textY: by + baseH / 2 - 6 };
                          }

                          return (
                            <g>
                              {/* Main Slab Profile */}
                              <path
                                d={pathD}
                                fill="#10b98125"
                                stroke="#10b981"
                                strokeWidth="2.5"
                              />
                              {/* Supporting Beam Line */}
                              <line x1={beamLine.x1} y1={beamLine.y1} x2={beamLine.x2} y2={beamLine.y2} stroke="#38bdf8" strokeWidth="2.5" />
                              <text x={beamLine.textX} y={beamLine.textY} fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor={beamLine.textAnchor} fontFamily="monospace">
                                Supporting Beam Line (1BM66/67)
                              </text>

                              {/* Dimension: Span L */}
                              <line x1={dimL.x1} y1={dimL.y1} x2={dimL.x2} y2={dimL.y2} stroke="#38bdf8" strokeWidth="1.2" />
                              <circle cx={dimL.x1} cy={dimL.y1} r="2" fill="#38bdf8" />
                              <circle cx={dimL.x2} cy={dimL.y2} r="2" fill="#38bdf8" />
                              <text x={dimL.textX} y={dimL.textY} fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                L = {effL.toFixed(2)}m
                              </text>

                              {/* Dimension: Depth W_cant */}
                              <line x1={dimW.x1} y1={dimW.y1} x2={dimW.x2} y2={dimW.y2} stroke="#fbbf24" strokeWidth="1.2" />
                              <text x={dimW.textX} y={dimW.textY} fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor={dimW.textAnchor} fontFamily="monospace">
                                W = {effCant.toFixed(2)}m
                              </text>

                              {/* Arc Deduction / Projection Details */}
                              {isArcDeduction ? (
                                <g>
                                  <line x1={dipLine.x1} y1={dipLine.y1} x2={dipLine.x2} y2={dipLine.y2} stroke="#f87171" strokeWidth="1.2" strokeDasharray="2 2" />
                                  <text x={dipLine.textX} y={dipLine.textY} fill="#fca5a5" fontSize="9" fontWeight="bold" fontFamily="monospace">
                                    h = {effH.toFixed(2)}m (Scoop)
                                  </text>
                                  <text x={isHorizontal ? bx + baseW / 2 : bx + baseW / 2} y={cantileverDirection === 'TOP' ? by + dipPx + 14 : cantileverDirection === 'BOTTOM' ? by + baseH - dipPx - 8 : by + baseH + 16} fill="#f87171" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                    Inward Curved Recess · R = {effR.toFixed(2)}m
                                  </text>
                                  <text x={isHorizontal ? bx + baseW / 2 : bx + baseW / 2} y={cantileverDirection === 'TOP' ? by + baseH - 8 : cantileverDirection === 'BOTTOM' ? by + 16 : by - 6} fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                    Midpoint Cantilever Depth W_mid = {Math.max(0, effCant - effH).toFixed(2)}m
                                  </text>
                                </g>
                              ) : (
                                <g>
                                  <line x1={dipLine.x1} y1={dipLine.y1} x2={dipLine.x2} y2={dipLine.y2} stroke="#a7f3d0" strokeWidth="1.2" strokeDasharray="2 2" />
                                  <text x={dipLine.textX} y={dipLine.textY} fill="#a7f3d0" fontSize="9" fontWeight="bold" fontFamily="monospace">
                                    h = {effH.toFixed(2)}m
                                  </text>
                                  <text x={bx + baseW / 2} y={cantileverDirection === 'TOP' ? by - dipPx - 4 : by + baseH + dipPx + 14} fill="#6ee7b7" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                    Arc R = {effR.toFixed(2)}m
                                  </text>
                                </g>
                              )}
                            </g>
                          );
                        }

                        if (slabShape === 'circular_segment') {
                          const cx = 200;
                          const cy = 40;
                          const w = 240;
                          const hArc = Math.min(90, Math.max(30, (effH / (effL || 1)) * 140));

                          return (
                            <g>
                              <path
                                d={`M ${cx - w / 2} ${cy + hArc} Q ${cx} ${cy - 10} ${cx + w / 2} ${cy + hArc} Z`}
                                fill="#10b98125"
                                stroke="#10b981"
                                strokeWidth="2.5"
                              />
                              <line x1={cx - w / 2} y1={cy + hArc + 12} x2={cx + w / 2} y2={cy + hArc + 12} stroke="#38bdf8" strokeWidth="1.2" />
                              <text x={cx} y={cy + hArc + 24} fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                Chord C = {effL.toFixed(2)}m
                              </text>
                              <text x={cx} y={cy + hArc / 2} fill="#a7f3d0" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                Rise h = {effH.toFixed(2)}m · R = {effR.toFixed(2)}m
                              </text>
                            </g>
                          );
                        }

                        if (slabShape === 'semi_circular') {
                          return (
                            <g>
                              <path
                                d="M 90 140 A 110 90 0 0 1 310 140 Z"
                                fill="#10b98125"
                                stroke="#10b981"
                                strokeWidth="2.5"
                              />
                              <text x="200" y="115" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                Semi-Circle R = {(radius || (effL / 2)).toFixed(2)}m
                              </text>
                            </g>
                          );
                        }

                        if (slabShape === 'circular') {
                          return (
                            <g>
                              <circle
                                cx="200"
                                cy="90"
                                r="65"
                                fill="#10b98125"
                                stroke="#10b981"
                                strokeWidth="2.5"
                              />
                              <text x="200" y="93" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                Full Circle Ø = {(effR * 2).toFixed(2)}m
                              </text>
                            </g>
                          );
                        }

                        if (slabShape === 'trapezoidal_cantilever') {
                          const w1 = cantileverDepth || 1.95;
                          const w2 = taperEndDepth || 0;
                          const rFillet = radius || 1.5;
                          const isBottom = cantileverDirection === 'BOTTOM';
                          const isTop = cantileverDirection === 'TOP';
                          const isHorizontal = isBottom || isTop;

                          const baseW = isHorizontal ? 280 : 75;
                          const baseH = isHorizontal ? 85 : 130;
                          const bx = isHorizontal ? 60 : 160;
                          const by = isHorizontal ? 45 : 25;

                          // Scaled depths
                          const maxW = Math.max(w1, w2, 0.1);
                          const h1Px = Math.max(25, Math.min(baseH, (w1 / maxW) * baseH));
                          const h2Px = w2 > 0 ? Math.max(10, Math.min(baseH, (w2 / maxW) * baseH)) : 0;
                          const filletPx = Math.min(baseW * 0.35, Math.max(18, (rFillet / (effL || 10)) * baseW * 1.5));

                          let pathD = '';
                          let beamY = by;
                          let beamX1 = bx;
                          let beamX2 = bx + baseW;

                          if (isBottom) {
                            beamY = by;
                            if (isMirrored) {
                              // Mirrored: Fillet is on LEFT (bx + filletPx), W1 (1950mm) is on RIGHT (bx + baseW)
                              const cornerFilletStart = bx + filletPx;
                              const bottomSlantedY = by + Math.max(18, h1Px * 0.45);
                              pathD = `M ${bx} ${by} L ${bx + baseW} ${by} L ${bx + baseW} ${by + h1Px} L ${cornerFilletStart} ${bottomSlantedY} Q ${bx} ${bottomSlantedY} ${bx} ${by + h2Px} Z`;
                            } else {
                              // Standard: W1 (1950mm) on LEFT, fillet arc on RIGHT near C1
                              const cornerFilletStart = bx + baseW - filletPx;
                              const bottomSlantedY = by + Math.max(18, h1Px * 0.45);
                              pathD = `M ${bx} ${by} L ${bx + baseW} ${by} L ${bx + baseW} ${by + h2Px} Q ${bx + baseW} ${bottomSlantedY} ${cornerFilletStart} ${bottomSlantedY} L ${bx} ${by + h1Px} Z`;
                            }
                          } else if (isTop) {
                            beamY = by + baseH;
                            if (isMirrored) {
                              const cornerFilletStart = bx + filletPx;
                              const topSlantedY = by + baseH - Math.max(18, h1Px * 0.45);
                              pathD = `M ${bx} ${by + baseH} L ${bx + baseW} ${by + baseH} L ${bx + baseW} ${by + baseH - h1Px} L ${cornerFilletStart} ${topSlantedY} Q ${bx} ${topSlantedY} ${bx} ${by + baseH - h2Px} Z`;
                            } else {
                              const cornerFilletStart = bx + baseW - filletPx;
                              const topSlantedY = by + baseH - Math.max(18, h1Px * 0.45);
                              pathD = `M ${bx} ${by + baseH} L ${bx + baseW} ${by + baseH} L ${bx + baseW} ${by + baseH - h2Px} Q ${bx + baseW} ${topSlantedY} ${cornerFilletStart} ${topSlantedY} L ${bx} ${by + baseH - h1Px} Z`;
                            }
                          } else if (cantileverDirection === 'LEFT') {
                            if (isMirrored) {
                              pathD = `M ${bx + baseW} ${by} L ${bx + baseW} ${by + baseH} Q ${bx + baseW * 0.5} ${by + baseH - filletPx} ${bx} ${by} Z`;
                            } else {
                              pathD = `M ${bx + baseW} ${by} L ${bx + baseW} ${by + baseH} L ${bx} ${by + baseH} Q ${bx + filletPx} ${by + baseH * 0.5} ${bx + baseW * 0.3} ${by} Z`;
                            }
                          } else {
                            // RIGHT
                            if (isMirrored) {
                              pathD = `M ${bx} ${by} L ${bx} ${by + baseH} Q ${bx + baseW * 0.5} ${by + baseH - filletPx} ${bx + baseW} ${by} Z`;
                            } else {
                              pathD = `M ${bx} ${by} L ${bx} ${by + baseH} L ${bx + baseW} ${by + baseH} Q ${bx + baseW - filletPx} ${by + baseH * 0.5} ${bx + baseW * 0.7} ${by} Z`;
                            }
                          }

                          return (
                            <g>
                              {/* Main Slab Profile */}
                              <path
                                d={pathD}
                                fill="#10b98125"
                                stroke="#10b981"
                                strokeWidth="2.5"
                              />

                              {/* Supporting Beam Line 1BM78/79 or 1BM80/81 */}
                              {isHorizontal ? (
                                <g>
                                  <line x1={beamX1} y1={beamY} x2={beamX2} y2={beamY} stroke="#38bdf8" strokeWidth="2.5" />
                                  {/* Column Pads along the beam */}
                                  <rect x={bx - 6} y={beamY - 6} width="12" height="12" fill="#38bdf8" rx="2" />
                                  <text x={bx} y={isBottom ? beamY - 10 : beamY + 18} fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                    {isMirrored ? 'C1' : 'C7'}
                                  </text>

                                  <rect x={bx + baseW * 0.55 - 5} y={beamY - 5} width="10" height="10" fill="#38bdf8" rx="2" />
                                  <text x={bx + baseW * 0.55} y={isBottom ? beamY - 10 : beamY + 18} fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                    C8
                                  </text>

                                  <rect x={bx + baseW - 6} y={beamY - 6} width="12" height="12" fill="#38bdf8" rx="2" />
                                  <text x={bx + baseW} y={isBottom ? beamY - 10 : beamY + 18} fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                    {isMirrored ? 'C7' : 'C1'}
                                  </text>

                                  <text x={bx + baseW * 0.28} y={isBottom ? beamY - 10 : beamY + 18} fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                    {isMirrored ? '1BM80/81 (300×750mm)' : '1BM78/79 (300×750mm)'}
                                  </text>
                                </g>
                              ) : null}

                              {/* Dimension: Span L */}
                              <line x1={bx} y1={isBottom ? by - 22 : by + baseH + 22} x2={bx + baseW} y2={isBottom ? by - 22 : by + baseH + 22} stroke="#38bdf8" strokeWidth="1.2" />
                              <circle cx={bx} cy={isBottom ? by - 22 : by + baseH + 22} r="2" fill="#38bdf8" />
                              <circle cx={bx + baseW} cy={isBottom ? by - 22 : by + baseH + 22} r="2" fill="#38bdf8" />
                              <text x={bx + baseW / 2} y={isBottom ? by - 26 : by + baseH + 34} fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                Span L = {effL.toFixed(2)}m
                              </text>

                              {/* Dimension: Cantilever Depth W1 */}
                              {isMirrored ? (
                                <>
                                  <line x1={bx + baseW + 14} y1={by} x2={bx + baseW + 14} y2={by + h1Px} stroke="#ec4899" strokeWidth="1.4" />
                                  <circle cx={bx + baseW + 14} cy={by} r="2" fill="#ec4899" />
                                  <circle cx={bx + baseW + 14} cy={by + h1Px} r="2" fill="#ec4899" />
                                  <text x={bx + baseW + 18} y={by + h1Px / 2 + 3} fill="#ec4899" fontSize="9" fontWeight="bold" textAnchor="start" fontFamily="monospace">
                                    W₁ = {w1.toFixed(3)}m (1950mm)
                                  </text>
                                </>
                              ) : (
                                <>
                                  <line x1={bx - 14} y1={by} x2={bx - 14} y2={by + h1Px} stroke="#ec4899" strokeWidth="1.4" />
                                  <circle cx={bx - 14} cy={by} r="2" fill="#ec4899" />
                                  <circle cx={bx - 14} cy={by + h1Px} r="2" fill="#ec4899" />
                                  <text x={bx - 18} y={by + h1Px / 2 + 3} fill="#ec4899" fontSize="9" fontWeight="bold" textAnchor="end" fontFamily="monospace">
                                    W₁ = {w1.toFixed(3)}m (1950mm)
                                  </text>
                                </>
                              )}

                              {/* Corner Fillet Arc annotation */}
                              <text
                                x={isMirrored ? bx + filletPx / 2 : bx + baseW - filletPx / 2}
                                y={isBottom ? by + Math.max(22, h1Px * 0.5) + 16 : by + baseH - 12}
                                fill="#a7f3d0"
                                fontSize="8.5"
                                fontWeight="bold"
                                textAnchor="middle"
                                fontFamily="monospace"
                              >
                                Corner Fillet Arc R = {rFillet.toFixed(2)}m
                              </text>
                            </g>
                          );
                        }

                        // Default Rectangular
                        return (
                          <g>
                            <rect
                              x="80"
                              y="45"
                              width="240"
                              height="85"
                              fill="#10b98125"
                              stroke="#10b981"
                              strokeWidth="2.5"
                            />
                            <text x="200" y="35" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                              L = {effL.toFixed(2)}m
                            </text>
                            <text x="60" y="92" fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="end" fontFamily="monospace">
                              W = {(cantileverDepth || 6.0).toFixed(2)}m
                            </text>
                            <text x="200" y="92" fill="#a7f3d0" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                              Rectangular Panel ({((effL) * (cantileverDepth || 6.0)).toFixed(1)} m²)
                            </text>
                          </g>
                        );
                      })()}
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* ─── WALL Profile (Straight vs Curved) ─── */}
            {elementType === 'WALL' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Wall Profile:</span>
                  <div className="inline-flex rounded-lg p-0.5 bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setWallShape('straight')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                        wallShape === 'straight'
                          ? 'bg-purple-500 text-white shadow'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Straight Wall
                    </button>
                    <button
                      type="button"
                      onClick={() => setWallShape('curved')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                        wallShape === 'curved'
                          ? 'bg-purple-500 text-white shadow'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Curved / Cylindrical Wall
                    </button>
                  </div>
                </div>

                {wallShape === 'straight' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <SmartField
                      label="Wall Length (L)"
                      unit="m"
                      type="number"
                      step="0.01"
                      value={length}
                      onChange={(v) => setLength(Number(v))}
                    />
                    <SmartField
                      label="Wall Height (H)"
                      unit="m"
                      type="number"
                      step="0.01"
                      value={height}
                      onChange={(v) => setHeight(Number(v))}
                    />
                    <SmartField
                      label="Wall Thickness (T)"
                      unit="m"
                      type="number"
                      step="0.01"
                      value={thickness}
                      onChange={(v) => setThickness(Number(v))}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-white dark:bg-slate-900/80 rounded-xl border border-purple-300 dark:border-purple-500/30 shadow-sm">
                    <SmartField
                      label="Curve Radius (R)"
                      unit="m"
                      type="number"
                      step="0.01"
                      value={radius}
                      onChange={(v) => setRadius(Number(v))}
                    />
                    <SmartField
                      label="Subtended Angle (θ)"
                      unit="deg"
                      type="number"
                      step="1"
                      value={arcAngle}
                      onChange={(v) => setArcAngle(Number(v))}
                    />
                    <SmartField
                      label="Wall Height (H)"
                      unit="m"
                      type="number"
                      step="0.01"
                      value={height}
                      onChange={(v) => setHeight(Number(v))}
                    />
                    <SmartField
                      label="Wall Thickness (T)"
                      unit="m"
                      type="number"
                      step="0.01"
                      value={thickness}
                      onChange={(v) => setThickness(Number(v))}
                    />
                  </div>
                )}

                {/* Wall Openings Builder */}
                <div className="p-3.5 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Wall Openings & Deductions ({openings.length})
                    </span>
                    <button
                      type="button"
                      onClick={addOpening}
                      className="px-2.5 py-1 rounded-lg bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 dark:hover:bg-brand-500/30 text-xs font-semibold flex items-center gap-1 border border-brand-500/20 dark:border-brand-500/30 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Opening
                    </button>
                  </div>

                  {openings.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                      No openings specified. Full wall area will be computed.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {openings.map((op, idx) => (
                        <div
                          key={op.id || idx}
                          className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/50"
                        >
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            #{idx + 1}
                          </span>
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <SmartField
                              label="Width (w)"
                              unit="m"
                              type="number"
                              step="0.01"
                              value={Number(op.width) || 0}
                              onChange={(v) => updateOpening(idx, 'width', Number(v))}
                            />
                            <SmartField
                              label="Height (h)"
                              unit="m"
                              type="number"
                              step="0.01"
                              value={Number(op.height) || 0}
                              onChange={(v) => updateOpening(idx, 'height', Number(v))}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeOpening(idx)}
                            className="p-2 text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── FOOTING Profile ─── */}
            {elementType === 'FOOTING' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SmartField
                  label="Pad Length (L)"
                  unit="m"
                  type="number"
                  step="0.01"
                  value={length}
                  onChange={(v) => setLength(Number(v))}
                />
                <SmartField
                  label="Pad Width (W)"
                  unit="m"
                  type="number"
                  step="0.01"
                  value={width}
                  onChange={(v) => setWidth(Number(v))}
                />
                <SmartField
                  label="Depth / Thickness (D)"
                  unit="m"
                  type="number"
                  step="0.01"
                  value={depth}
                  onChange={(v) => setDepth(Number(v))}
                />
              </div>
            )}

            {/* ─── STAIR Profile ─── */}
            {elementType === 'STAIR' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <SmartField
                    label="Stair Flight Width"
                    unit="m"
                    type="number"
                    step="0.01"
                    value={flightWidth}
                    onChange={(v) => setFlightWidth(Number(v))}
                  />
                  <SmartField
                    label="Waist Thickness"
                    unit="m"
                    type="number"
                    step="0.01"
                    value={waistThickness}
                    onChange={(v) => setWaistThickness(Number(v))}
                  />
                  <SmartField
                    label="Landing Thickness"
                    unit="m"
                    type="number"
                    step="0.01"
                    value={landingThickness}
                    onChange={(v) => setLandingThickness(Number(v))}
                  />
                  <SmartField
                    label="Tread Width"
                    unit="m"
                    type="number"
                    step="0.01"
                    value={treadWidth}
                    onChange={(v) => setTreadWidth(Number(v))}
                  />
                </div>

                {/* Flights List */}
                <div className="p-3.5 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Stair Flights ({flights.length})
                    </span>
                    <button
                      type="button"
                      onClick={addFlight}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-xs font-semibold flex items-center gap-1 border border-indigo-500/20 dark:border-indigo-500/30 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Flight
                    </button>
                  </div>

                  <div className="space-y-2">
                    {flights.map((fl, idx) => (
                      <div
                        key={fl.id || idx}
                        className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/50"
                      >
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          Flight {idx + 1}
                        </span>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <SmartField
                            label="Going Length"
                            unit="m"
                            type="number"
                            step="0.01"
                            value={Number(fl.length) || 0}
                            onChange={(v) => updateFlight(idx, 'length', String(v))}
                          />
                          <SmartField
                            label="Risers Count"
                            unit="nos"
                            type="number"
                            step="1"
                            value={Number(fl.riserCount) || 1}
                            onChange={(v) => updateFlight(idx, 'riserCount', String(v))}
                          />
                        </div>
                        {flights.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFlight(idx)}
                            className="p-2 text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Landings List */}
                <div className="p-3.5 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Landings ({landings.length})
                    </span>
                    <button
                      type="button"
                      onClick={addLanding}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-xs font-semibold flex items-center gap-1 border border-indigo-500/20 dark:border-indigo-500/30 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Landing
                    </button>
                  </div>

                  <div className="space-y-2">
                    {landings.map((ld, idx) => (
                      <div
                        key={ld.id || idx}
                        className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/50"
                      >
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          Landing {idx + 1}
                        </span>
                        <div className="flex-1">
                          <SmartField
                            label="Landing Span Length"
                            unit="m"
                            type="number"
                            step="0.01"
                            value={Number(ld.length) || 0}
                            onChange={(v) => updateLanding(idx, String(v))}
                          />
                        </div>
                        {landings.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLanding(idx)}
                            className="p-2 text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ─── LIVE 2D CONCEPT STAIRCASE PREVIEW ─── */}
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-md space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <span>Live 2D Concept & Geometry Verification</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                        <button
                          type="button"
                          onClick={() => setStairViewMode('plan')}
                          className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition ${
                            stairViewMode === 'plan'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Plan View
                        </button>
                        <button
                          type="button"
                          onClick={() => setStairViewMode('section')}
                          className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition ${
                            stairViewMode === 'section'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Section Profile
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setStairDirection((d) => (d === 'UP' ? 'DOWN' : 'UP'))}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 text-[11px] font-bold transition border border-emerald-500/30 font-mono"
                        title="Flip Climb Direction"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Climb: {stairDirection}</span>
                      </button>

                      {(() => {
                        const totalRisers = flights.reduce((acc, f) => acc + (Number(f.riserCount) || 0), 0) || 12;
                        return (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                            {flights.length} FLIGHT{flights.length > 1 ? 'S' : ''} · {totalRisers} RISERS
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="w-full h-56 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden p-2">
                    <svg className="w-full h-full" viewBox="0 0 460 210" preserveAspectRatio="xMidYMid meet">
                      <defs>
                        <pattern id="stair-grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                        </pattern>
                        <pattern id="stair-landing-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                          <line x1="0" y1="0" x2="0" y2="8" stroke="#6366f130" strokeWidth="1" />
                        </pattern>
                        <marker id="stair-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
                        </marker>
                      </defs>
                      <rect width="460" height="210" fill="url(#stair-grid-pattern)" />

                      {(() => {
                        const effFlightW = flightWidth || 1.2;
                        const effWaistT = waistThickness || 0.15;
                        const effLandT = landingThickness || 0.2;
                        const effTreadW = treadWidth || 0.28;

                        const totalFlightGoing = flights.reduce((sum, f) => sum + (Number(f.length) || 0), 0) || 3.0;
                        const totalLandingLen = landings.reduce((sum, l) => sum + (Number(l.length) || 0), 0) || (landings.length > 0 ? 1.2 : 0);
                        const totalRunM = totalFlightGoing + totalLandingLen;
                        const totalRisers = flights.reduce((sum, f) => sum + (Number(f.riserCount) || 0), 0) || 12;
                        const storyHeightM = height || 3.0;
                        const estRiserHeightMm = totalRisers > 0 ? (storyHeightM / totalRisers) * 1000 : 175;

                        if (stairViewMode === 'plan') {
                          const isDogLeg = flights.length >= 2;

                          if (isDogLeg) {
                            // Two-Flight Dogleg / Half-turn Plan View
                            const fl1 = flights[0];
                            const fl2 = flights[1];
                            const fl1Len = Number(fl1?.length) || 2.8;
                            const fl2Len = Number(fl2?.length) || 2.8;
                            const landLen = Number(landings[0]?.length) || 1.2;
                            const fl1Risers = Math.max(2, Number(fl1?.riserCount) || 8);
                            const fl2Risers = Math.max(2, Number(fl2?.riserCount) || 8);

                            const maxRun = Math.max(fl1Len, fl2Len) + landLen;
                            const scaleX = 260 / Math.max(maxRun, 3.0);
                            const fl1W_px = 54;
                            const fl2W_px = 54;
                            const wellGap_px = 12;
                            const originX = 55;
                            const fl1Y = 110;
                            const fl2Y = fl1Y - wellGap_px - fl2W_px;

                            const fl1Len_px = fl1Len * scaleX;
                            const fl2Len_px = fl2Len * scaleX;
                            const landLen_px = landLen * scaleX;
                            const landingX = originX + Math.max(fl1Len_px, fl2Len_px);

                            const stepW1 = fl1Len_px / fl1Risers;
                            const stepW2 = fl2Len_px / fl2Risers;

                            return (
                              <g>
                                {/* Flight 1 Outer Box */}
                                <rect x={originX} y={fl1Y} width={fl1Len_px} height={fl1W_px} fill="#10b98120" stroke="#10b981" strokeWidth="2" rx="2" />
                                {/* Flight 1 Tread Lines */}
                                {Array.from({ length: fl1Risers - 1 }).map((_, i) => (
                                  <line key={`f1-t-${i}`} x1={originX + (i + 1) * stepW1} y1={fl1Y} x2={originX + (i + 1) * stepW1} y2={fl1Y + fl1W_px} stroke="#10b98180" strokeWidth="1.2" />
                                ))}

                                {/* Intermediate Landing Box */}
                                <rect
                                  x={landingX}
                                  y={fl2Y}
                                  width={landLen_px}
                                  height={fl1W_px + wellGap_px + fl2W_px}
                                  fill="#6366f125"
                                  stroke="#6366f1"
                                  strokeWidth="2"
                                  rx="2"
                                />
                                <rect
                                  x={landingX}
                                  y={fl2Y}
                                  width={landLen_px}
                                  height={fl1W_px + wellGap_px + fl2W_px}
                                  fill="url(#stair-landing-hatch)"
                                />

                                {/* Flight 2 Outer Box (Returning leftward) */}
                                <rect x={originX} y={fl2Y} width={fl2Len_px} height={fl2W_px} fill="#10b98120" stroke="#10b981" strokeWidth="2" rx="2" />
                                {/* Flight 2 Tread Lines */}
                                {Array.from({ length: fl2Risers - 1 }).map((_, i) => (
                                  <line key={`f2-t-${i}`} x1={originX + (i + 1) * stepW2} y1={fl2Y} x2={originX + (i + 1) * stepW2} y2={fl2Y + fl2W_px} stroke="#10b98180" strokeWidth="1.2" />
                                ))}

                                {/* Stairwell Gap divider */}
                                <line x1={originX} y1={fl1Y - wellGap_px / 2} x2={landingX} y2={fl1Y - wellGap_px / 2} stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />

                                {/* Walkline Arrow */}
                                <circle cx={originX + 12} cy={fl1Y + fl1W_px / 2} r="4" fill="#38bdf8" />
                                <path
                                  d={`M ${originX + 12} ${fl1Y + fl1W_px / 2} L ${landingX + landLen_px / 2} ${fl1Y + fl1W_px / 2} Q ${landingX + landLen_px * 0.8} ${(fl1Y + fl2Y + fl2W_px) / 2} ${landingX + landLen_px / 2} ${fl2Y + fl2W_px / 2} L ${originX + 18} ${fl2Y + fl2W_px / 2}`}
                                  fill="none"
                                  stroke="#38bdf8"
                                  strokeWidth="1.8"
                                  strokeDasharray="4 3"
                                  markerEnd="url(#stair-arrow)"
                                />

                                {/* Direction text */}
                                <text x={originX + fl1Len_px / 2} y={fl1Y + fl1W_px / 2 - 8} fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                  {stairDirection === 'UP' ? 'UP →' : '← DOWN'} (Flight 1 · {fl1Risers} Risers)
                                </text>
                                <text x={originX + fl2Len_px / 2} y={fl2Y + fl2W_px / 2 + 14} fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                  {stairDirection === 'UP' ? '← UP' : 'DOWN →'} (Flight 2 · {fl2Risers} Risers)
                                </text>
                                <text x={landingX + landLen_px / 2} y={fl1Y - wellGap_px / 2 + 3} fill="#a5b4fc" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                  HALF LANDING
                                </text>

                                {/* Dimensions: Width */}
                                <line x1={originX - 12} y1={fl1Y} x2={originX - 12} y2={fl1Y + fl1W_px} stroke="#fbbf24" strokeWidth="1.2" />
                                <text x={originX - 16} y={fl1Y + fl1W_px / 2 + 3} fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="end" fontFamily="monospace">
                                  W₁ = {effFlightW.toFixed(2)}m
                                </text>

                                {/* Dimensions: Flight 1 Run */}
                                <line x1={originX} y1={fl1Y + fl1W_px + 14} x2={originX + fl1Len_px} y2={fl1Y + fl1W_px + 14} stroke="#38bdf8" strokeWidth="1.2" />
                                <text x={originX + fl1Len_px / 2} y={fl1Y + fl1W_px + 26} fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                  Run L₁ = {fl1Len.toFixed(2)}m
                                </text>

                                {/* Dimensions: Landing Run */}
                                <line x1={landingX} y1={fl1Y + fl1W_px + 14} x2={landingX + landLen_px} y2={fl1Y + fl1W_px + 14} stroke="#a5b4fc" strokeWidth="1.2" />
                                <text x={landingX + landLen_px / 2} y={fl1Y + fl1W_px + 26} fill="#a5b4fc" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                  L_land = {landLen.toFixed(2)}m
                                </text>

                                {/* Top Footprint Dimension */}
                                <line x1={originX} y1={fl2Y - 14} x2={landingX + landLen_px} y2={fl2Y - 14} stroke="#a7f3d0" strokeWidth="1.2" />
                                <circle cx={originX} cy={fl2Y - 14} r="2" fill="#a7f3d0" />
                                <circle cx={landingX + landLen_px} cy={fl2Y - 14} r="2" fill="#a7f3d0" />
                                <text x={(originX + landingX + landLen_px) / 2} y={fl2Y - 18} fill="#a7f3d0" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                  Total Stairwell Span = {(Math.max(fl1Len, fl2Len) + landLen).toFixed(2)}m
                                </text>
                              </g>
                            );
                          }

                          // Single Straight Flight Plan View
                          const fl = flights[0] || { length: '3.0', riserCount: '10' };
                          const flLen = Number(fl.length) || 3.0;
                          const landLen = landings.length > 0 ? (Number(landings[0].length) || 1.2) : 0;
                          const risers = Math.max(2, Number(fl.riserCount) || 10);
                          const totalSpanM = flLen + landLen;

                          const scaleX = 320 / Math.max(totalSpanM, 2.5);
                          const originX = 50;
                          const originY = 55;
                          const fH_px = 75;
                          const flLen_px = flLen * scaleX;
                          const landLen_px = landLen * scaleX;
                          const stepW = flLen_px / risers;

                          return (
                            <g>
                              {/* Flight Rect */}
                              <rect x={originX} y={originY} width={flLen_px} height={fH_px} fill="#10b98120" stroke="#10b981" strokeWidth="2" rx="2" />
                              {/* Treads */}
                              {Array.from({ length: risers - 1 }).map((_, i) => (
                                <line key={`st-t-${i}`} x1={originX + (i + 1) * stepW} y1={originY} x2={originX + (i + 1) * stepW} y2={originY + fH_px} stroke="#10b98180" strokeWidth="1.2" />
                              ))}

                              {/* Landing Platform (if present) */}
                              {landLen > 0 && (
                                <g>
                                  <rect x={originX + flLen_px} y={originY} width={landLen_px} height={fH_px} fill="#6366f125" stroke="#6366f1" strokeWidth="2" rx="2" />
                                  <rect x={originX + flLen_px} y={originY} width={landLen_px} height={fH_px} fill="url(#stair-landing-hatch)" />
                                  <text x={originX + flLen_px + landLen_px / 2} y={originY + fH_px / 2 + 4} fill="#a5b4fc" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                    LANDING ({landLen.toFixed(2)}m)
                                  </text>
                                </g>
                              )}

                              {/* Walkline */}
                              <circle cx={originX + 12} cy={originY + fH_px / 2} r="4" fill="#38bdf8" />
                              <line
                                x1={originX + 12}
                                y1={originY + fH_px / 2}
                                x2={originX + flLen_px + (landLen > 0 ? landLen_px * 0.7 : -8)}
                                y2={originY + fH_px / 2}
                                stroke="#38bdf8"
                                strokeWidth="1.8"
                                strokeDasharray="4 3"
                                markerEnd="url(#stair-arrow)"
                              />
                              <text x={originX + flLen_px / 2} y={originY + fH_px / 2 - 8} fill="#38bdf8" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                {stairDirection === 'UP' ? 'UP →' : '← DOWN'} ({risers} Risers · Tread G = {(effTreadW * 1000).toFixed(0)}mm)
                              </text>

                              {/* Dimensions: Flight Width */}
                              <line x1={originX - 12} y1={originY} x2={originX - 12} y2={originY + fH_px} stroke="#fbbf24" strokeWidth="1.2" />
                              <text x={originX - 16} y={originY + fH_px / 2 + 3} fill="#fbbf24" fontSize="9" fontWeight="bold" textAnchor="end" fontFamily="monospace">
                                W = {effFlightW.toFixed(2)}m
                              </text>

                              {/* Dimensions: Span Run */}
                              <line x1={originX} y1={originY + fH_px + 14} x2={originX + flLen_px} y2={originY + fH_px + 14} stroke="#38bdf8" strokeWidth="1.2" />
                              <text x={originX + flLen_px / 2} y={originY + fH_px + 26} fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                Going Run = {flLen.toFixed(2)}m
                              </text>

                              {/* Dimensions: Total Span */}
                              <line x1={originX} y1={originY - 14} x2={originX + totalSpanM * scaleX} y2={originY - 14} stroke="#a7f3d0" strokeWidth="1.2" />
                              <circle cx={originX} cy={originY - 14} r="2" fill="#a7f3d0" />
                              <circle cx={originX + totalSpanM * scaleX} cy={originY - 14} r="2" fill="#a7f3d0" />
                              <text x={originX + (totalSpanM * scaleX) / 2} y={originY - 18} fill="#a7f3d0" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                Total Span L = {totalSpanM.toFixed(2)}m · Waist = {(effWaistT * 1000).toFixed(0)}mm
                              </text>
                            </g>
                          );
                        }

                        // Section Elevation Profile View
                        const risers = totalRisers;
                        const numSteps = Math.min(14, risers);
                        const stepW_px = 18;
                        const stepH_px = 8;
                        const waist_px = 16;
                        const landW_px = 65;
                        const landH_px = 18;
                        const startX = 60;
                        const startY = 160;

                        let stepPath = `M ${startX - 30} ${startY} L ${startX} ${startY}`;
                        for (let i = 0; i < numSteps; i++) {
                          const rx = startX + i * stepW_px;
                          const ry = startY - i * stepH_px;
                          stepPath += ` L ${rx} ${ry - stepH_px} L ${rx + stepW_px} ${ry - stepH_px}`;
                        }
                        const topX = startX + numSteps * stepW_px;
                        const topY = startY - numSteps * stepH_px;
                        stepPath += ` L ${topX + landW_px} ${topY} L ${topX + landW_px} ${topY + landH_px} L ${topX} ${topY + landH_px}`;
                        stepPath += ` L ${startX + waist_px} ${startY + waist_px} L ${startX - 30} ${startY + waist_px} Z`;

                        return (
                          <g>
                            {/* Concrete Stair Profile */}
                            <path d={stepPath} fill="#10b98125" stroke="#10b981" strokeWidth="2.5" />

                            {/* Base FFL Level */}
                            <line x1={20} y1={startY} x2={startX + 30} y2={startY} stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 3" />
                            <text x={25} y={startY - 6} fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="monospace">
                              ▽ FFL 0.000m
                            </text>

                            {/* Top FFL Level */}
                            <line x1={topX - 20} y1={topY} x2={topX + landW_px + 40} y2={topY} stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 3" />
                            <text x={topX + landW_px + 8} y={topY - 6} fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="monospace">
                              △ FFL +{storyHeightM.toFixed(2)}m
                            </text>

                            {/* Annotation: Riser & Tread Zoom Indicator */}
                            <rect x={startX + 3 * stepW_px} y={startY - 4 * stepH_px} width={stepW_px} height={stepH_px} fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                            <text x={startX + 3.5 * stepW_px} y={startY - 4 * stepH_px - 8} fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                              Tread: {(effTreadW * 1000).toFixed(0)}mm
                            </text>
                            <text x={startX + 4 * stepW_px + 8} y={startY - 3.5 * stepH_px + 3} fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="monospace">
                              Riser: ~{estRiserHeightMm.toFixed(0)}mm
                            </text>

                            {/* Waist Thickness Annotation */}
                            <line x1={startX + 40} y1={startY - 20} x2={startX + 40 + waist_px} y2={startY - 20 + waist_px} stroke="#ec4899" strokeWidth="1.5" />
                            <text x={startX + 50 + waist_px} y={startY - 15 + waist_px} fill="#ec4899" fontSize="9" fontWeight="bold" fontFamily="monospace">
                              Waist t = {(effWaistT * 1000).toFixed(0)}mm
                            </text>

                            {/* Story Rise Dimension */}
                            <line x1={topX + landW_px + 20} y1={topY} x2={topX + landW_px + 20} y2={startY} stroke="#38bdf8" strokeWidth="1.2" />
                            <circle cx={topX + landW_px + 20} cy={topY} r="2" fill="#38bdf8" />
                            <circle cx={topX + landW_px + 20} cy={startY} r="2" fill="#38bdf8" />
                            <text x={topX + landW_px + 28} y={(topY + startY) / 2 + 4} fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">
                              Rise H = {storyHeightM.toFixed(2)}m ({risers} Risers)
                            </text>
                          </g>
                        );
                      })()}
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ═══ Material Specs & QA Planning ═══ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Concrete Mix Design
              </label>
              <select
                value={concreteGrade}
                onChange={(e) => setConcreteGrade(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500 font-mono"
              >
                {CONCRETE_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Rebar Spec / Ref
              </label>
              <input
                type="text"
                placeholder="e.g. 8T25, T10-150"
                value={rebarSpec}
                onChange={(e) => setRebarSpec(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Work Package
              </label>
              <select
                value={workPackageId}
                onChange={(e) => setWorkPackageId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500"
              >
                <option value="">No Work Package</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Element Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const newStatus = e.target.value as ElementStatus;
                  setStatus(newStatus);
                  if ((newStatus === 'POURED' || newStatus === 'APPROVED') && achievedVolume === 0) {
                    setAchievedVolume(effectiveCalculatedVolume);
                  }
                }}
                className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border rounded-xl text-xs font-bold focus:outline-none ${
                  status === 'APPROVED'
                    ? 'text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40'
                    : status === 'POURED'
                    ? 'text-cyan-600 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/40'
                    : status === 'REJECTED'
                    ? 'text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/40'
                    : 'text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/40'
                }`}
              >
                <option value="PENDING">Pending</option>
                <option value="REBAR_IN_PROGRESS">Rebar Progress</option>
                <option value="FORMWORK_IN_PROGRESS">Formwork Progress</option>
                <option value="READY_FOR_CASTING">Ready for Casting</option>
                <option value="REBAR_INSPECTED">Rebar Inspected</option>
                <option value="POURED">Poured</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Planned Pour Date
              </label>
              <input
                type="date"
                value={plannedCastingDate}
                onChange={(e) => setPlannedCastingDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          {/* ═══ Volumetric & Surface Takeoff Summary Card ═══ */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-850 dark:to-slate-900 rounded-2xl border border-brand-500/30 shadow-lg space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Live Engineering Takeoff & Quantity Schedule
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                    achievedPct >= 100
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40'
                      : achievedPct > 0
                      ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {achievedPct}% Achieved
                </span>
              </div>
            </div>

            {/* Formula Description */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
              <span><strong>Formula:</strong> {takeoff.formulaDesc}</span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-300 dark:border-slate-700/50">
              <div
                className={`h-full transition-all duration-300 ${
                  achievedPct >= 100
                    ? 'bg-emerald-500'
                    : achievedPct > 0
                    ? 'bg-amber-500'
                    : 'bg-transparent'
                }`}
                style={{ width: `${achievedPct}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Approximate Plan Surface Area */}
              <div className="p-3 bg-white dark:bg-slate-900/90 rounded-xl border border-sky-300 dark:border-sky-500/30 flex flex-col justify-between space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-sky-700 dark:text-sky-300 font-medium">
                    Plan / Surface Area
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 rounded">
                    m²
                  </span>
                </div>
                <div className="text-xl font-mono font-black text-sky-600 dark:text-sky-400 py-0.5">
                  {takeoff.elementArea.toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  Geometric plan area
                </span>
              </div>

              {/* Calculated Volume */}
              <div className="p-3 bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Calculated Volume
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 rounded">
                    m³
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder={takeoff.volume.toFixed(3)}
                    value={calculatedVolumeOverride}
                    onChange={(e) => setCalculatedVolumeOverride(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-brand-600 dark:text-brand-400 font-mono font-bold text-sm focus:outline-none focus:border-brand-500"
                  />
                  {calculatedVolumeOverride !== '' && (
                    <button
                      type="button"
                      onClick={() => setCalculatedVolumeOverride('')}
                      className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline whitespace-nowrap"
                      title="Reset to live dimension calculation"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  Live: {takeoff.volume.toFixed(3)} m³
                </span>
              </div>

              {/* Achieved Volume */}
              <div className="p-3 bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Achieved Volume
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded">
                    m³
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={achievedVolume || 0}
                    onChange={(e) => setAchievedVolume(Number(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-1">
                  {[0, 50, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() =>
                        setAchievedVolume(
                          Number(((pct / 100) * effectiveCalculatedVolume).toFixed(3)),
                        )
                      }
                      className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Formwork Contact Area */}
              <div className="p-3 bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    Formwork Area
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 rounded">
                    m²
                  </span>
                </div>
                <div className="text-xl font-mono font-black text-cyan-600 dark:text-cyan-400 py-0.5">
                  {takeoff.formworkArea.toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  Soffit + Shuttering edges
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* ═══ Footer Actions ═══ */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95">
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-2 font-mono">
            <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 text-[11px]">
              Ctrl+Enter
            </kbd>
            <span>to save</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
            >
              Cancel
            </button>

            {!isEdit && (
              <button
                type="button"
                disabled={submitting || !elementName.trim()}
                onClick={handleSubmitAndAddAnother}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Register & Add Another</span>
              </button>
            )}

            <button
              type="button"
              disabled={submitting || !elementName.trim()}
              onClick={() => handleSubmit()}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs shadow-lg shadow-brand-500/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isEdit ? 'Update Element' : 'Save Element'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElementModal;
