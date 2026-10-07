import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
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
import { useAuthStore } from '@/stores/useAuthStore';
import { isQAQCUser } from '@/lib/permissions';
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
    formula: 'L × W × (D − t_slab)',
  },
  {
    type: 'SLAB',
    label: 'Slab',
    icon: Layers,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
    formula: 'L × W × Thickness',
  },
  {
    type: 'WALL',
    label: 'Wall',
    icon: Building2,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800',
    formula: '(L × H − Σ Voids) × Thk',
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
  const isQAQC = isQAQCUser(currentUser);

  // Form identity state
  const [elementName, setElementName] = useState('');
  const [elementType, setElementType] = useState<ElementType>('COLUMN');
  const [status, setStatus] = useState<ElementStatus>('PENDING');
  const [levelId, setLevelId] = useState('');
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
  const [thickness, setThickness] = useState<number>(0.2);
  const [diameter, setDiameter] = useState<number>(0.6);

  // Column specific
  const [columnShape, setColumnShape] = useState<'rectangular' | 'circular'>(
    'rectangular',
  );
  const [isInclined, setIsInclined] = useState(false);
  const [inclinedCalcMode, setInclinedCalcMode] = useState<'offset' | 'angle'>(
    'offset',
  );
  const [horizontalOffset, setHorizontalOffset] = useState<number>(0.4);
  const [inclinationAngle, setInclinationAngle] = useState<number>(10);

  // Beam specific
  const [deductSlab, setDeductSlab] = useState(true);
  const [supportedSlabThickness, setSupportedSlabThickness] = useState<number>(0.15);

  // Wall specific
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
        length: editingElement.length || 0.6,
        width: editingElement.width || 0.6,
        height: editingElement.height || 3.2,
      };
      setLength(editingElement.length ?? dims.length ?? 0.6);
      setWidth(editingElement.width ?? dims.width ?? 0.6);
      setHeight(editingElement.height ?? dims.height ?? 3.2);
      setDepth(editingElement.depth ?? 0.6);
      setThickness(editingElement.thickness ?? 0.2);
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

      // Beam monolithic
      setSupportedSlabThickness(editingElement.supportedSlabThickness ?? 0.15);
      setDeductSlab(editingElement.supportedSlabThickness !== undefined && editingElement.supportedSlabThickness > 0);

      // Wall openings
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
        setLevelId(levels[0].id);
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
      setIsInclined(false);
      setLength(0.6);
      setWidth(0.6);
      setHeight(3.2);
      setDepth(0.6);
      setThickness(0.2);
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
      // By structural convention: beam top matches floor level datum + offset
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

  // Takeoff Live Calculations (Volume m³ and Formwork m²)
  const takeoff = useMemo(() => {
    let volume = 0;
    let formworkArea = 0;
    let formulaDesc = '';

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
          const radius = Dia / 2;
          const crossArea = Math.PI * radius * radius;
          const effH = effectiveColumnHeight;
          volume = crossArea * effH;
          formworkArea = Math.PI * Dia * effH;
          formulaDesc = `π × (${Dia}m / 2)² × ${effH.toFixed(2)}m (Circular Ø)`;
        } else {
          const effH = effectiveColumnHeight;
          volume = L * W * effH;
          formworkArea = 2 * (L + W) * effH;
          formulaDesc = `${L}m × ${W}m × ${effH.toFixed(2)}m (Perimeter × Eff H)`;
        }
        break;

      case 'BEAM': {
        const netDepth = Math.max(0, D - slabT);
        volume = L * W * D;
        formworkArea = (2 * netDepth + W) * L;
        formulaDesc = `${L}m × ${W}m × ${D}m | Formwork: (2 × (${D}m - ${slabT}m) + ${W}m) × ${L}m`;
        break;
      }

      case 'SLAB':
        volume = L * W * T;
        formworkArea = L * W + 2 * (L + W) * T;
        formulaDesc = `Soffit: ${L}m × ${W}m (${(L * W).toFixed(2)}m²) + Edges: 2 × (${L} + ${W}) × ${T}m`;
        break;

      case 'WALL': {
        const grossArea = L * H;
        const totalVoidArea = openings.reduce((sum, op) => {
          const w = Number(op.width) || 0;
          const h = Number(op.height) || 0;
          return sum + w * h;
        }, 0);
        const netArea = Math.max(0, grossArea - totalVoidArea);
        volume = netArea * T;
        formworkArea = 2 * netArea + 2 * (L + H) * T;
        formulaDesc = `Net Area: (${grossArea.toFixed(2)}m² - ${totalVoidArea.toFixed(2)}m² void) = ${netArea.toFixed(2)}m² × ${T}m Thk`;
        break;
      }

      case 'FOOTING':
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
        formworkArea = (soffitArea + landingArea) * 1.25;
        formulaDesc = `Flights (${flightVol.toFixed(2)}m³) + Landings (${landingVol.toFixed(2)}m³)`;
        break;
      }
    }

    return {
      volume: parseFloat(volume.toFixed(3)),
      formworkArea: parseFloat(formworkArea.toFixed(2)),
      formulaDesc,
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

      // Volume & Formwork
      calculatedVolume: effectiveCalculatedVolume,
      volume: effectiveCalculatedVolume,
      achievedVolume: Number(achievedVolume) || 0,
      calculatedFormworkArea: takeoff.formworkArea,
      area: takeoff.formworkArea,

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
        height: Number(height) || 0,
      },

      // Column attributes
      columnShape: elementType === 'COLUMN' ? columnShape : undefined,
      isInclined: elementType === 'COLUMN' ? isInclined : false,
      verticality: isInclined ? 'inclined' : 'straight',
      inclinedCalcMode: isInclined ? inclinedCalcMode : undefined,
      horizontalOffset: isInclined ? Number(horizontalOffset) : undefined,
      inclinationAngle: isInclined ? Number(inclinationAngle) : undefined,

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

      // Auto-increment element name (e.g. C-01 -> C-02, W1 -> W2)
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* ═══ Header ═══ */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {isEdit ? 'Edit Structural Element' : 'Register Structural Element'}
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                  {elementType}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                True engineering dimensional takeoff & elevation datum control
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
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
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
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
                        setThickness(0.2);
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
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Info & Grid Grid Alignment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Element ID / Tag <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  ref={nameInputRef}
                  type="text"
                  required
                  placeholder="e.g. C-B1-04, B-102, S-L1"
                  value={elementName}
                  onChange={(e) => setElementName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Project Floor Level <span className="text-rose-500">*</span>
              </label>
              <select
                value={levelId}
                onChange={(e) => setLevelId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
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
                <label className="text-xs font-semibold text-slate-400">
                  Grid Coordinate / Span
                </label>
                {gridHint && (
                  <button
                    type="button"
                    onClick={applyGridDimensions}
                    className="text-[11px] text-brand-400 hover:text-brand-300 underline font-medium flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Apply Span
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="e.g. B/2, 2/C-E, A-B/1-2"
                value={gridAxis}
                onChange={(e) => setGridAxis(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 font-mono"
              />
              {gridHint && (
                <p className="text-[11px] text-brand-400/90 mt-1 font-mono">{gridHint}</p>
              )}
            </div>
          </div>

          {/* ═══ Elevation Datum Section ═══ */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Elevation Datum & Level Binding
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Mode:</span>
                <button
                  type="button"
                  onClick={() => setElevationMode(elevationMode === 'auto' ? 'manual' : 'auto')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    elevationMode === 'auto'
                      ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {elevationMode === 'auto' ? '⚡ Auto-Derived' : '✏️ Manual Override'}
                </button>
              </div>
            </div>

            {elevationMode === 'auto' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-850 rounded-lg border border-slate-700/50">
                  <span className="text-[11px] text-slate-400 block">Level Datum</span>
                  <span className="text-sm font-mono font-bold text-white">
                    {calculatedElevations.levelDatum >= 0 ? '+' : ''}
                    {calculatedElevations.levelDatum.toFixed(3)} m
                  </span>
                </div>
                <div className="p-3 bg-slate-850 rounded-lg border border-slate-700/50">
                  <span className="text-[11px] text-slate-400 block">Base Elevation</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    {calculatedElevations.baseElevation >= 0 ? '+' : ''}
                    {calculatedElevations.baseElevation.toFixed(3)} m
                  </span>
                </div>
                <div className="p-3 bg-slate-850 rounded-lg border border-slate-700/50">
                  <span className="text-[11px] text-slate-400 block">Top Elevation</span>
                  <span className="text-sm font-mono font-bold text-cyan-400">
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
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-brand-400" />
                Geometric Dimensions & Structural Profile
              </span>
              <span className="text-xs text-slate-400 font-mono">Units: Meters (m)</span>
            </div>

            {/* COLUMN Profile */}
            {elementType === 'COLUMN' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Section Profile:</span>
                    <div className="inline-flex rounded-lg p-0.5 bg-slate-900 border border-slate-700">
                      <button
                        type="button"
                        onClick={() => setColumnShape('rectangular')}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                          columnShape === 'rectangular'
                            ? 'bg-brand-500 text-white shadow'
                            : 'text-slate-400 hover:text-white'
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
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Circular (Ø)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                      <input
                        type="checkbox"
                        checked={isInclined}
                        onChange={(e) => setIsInclined(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500 h-4 w-4"
                      />
                      <span>Slanted / Inclined Column</span>
                    </label>
                  </div>
                </div>

                {/* Dimensions inputs */}
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

                {/* Inclined parameters */}
                {isInclined && (
                  <div className="p-3.5 bg-slate-900/80 rounded-xl border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400">
                        Slanted Column Derivation
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setInclinedCalcMode('offset')}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            inclinedCalcMode === 'offset'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          Offset Mode (ΔX)
                        </button>
                        <button
                          type="button"
                          onClick={() => setInclinedCalcMode('angle')}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            inclinedCalcMode === 'angle'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
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
                      <div className="p-2.5 bg-slate-850 rounded-xl border border-slate-700/60 flex flex-col justify-center">
                        <span className="text-[11px] text-slate-400">
                          Derived Slant Length
                        </span>
                        <span className="text-sm font-mono font-bold text-amber-400">
                          {effectiveColumnHeight.toFixed(3)} m
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BEAM Profile */}
            {elementType === 'BEAM' && (
              <div className="space-y-4">
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

                <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                    <input
                      type="checkbox"
                      checked={deductSlab}
                      onChange={(e) => setDeductSlab(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500 h-4 w-4"
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

            {/* SLAB Profile */}
            {elementType === 'SLAB' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SmartField
                  label="Length (L)"
                  unit="m"
                  type="number"
                  step="0.01"
                  value={length}
                  onChange={(v) => setLength(Number(v))}
                />
                <SmartField
                  label="Width (W)"
                  unit="m"
                  type="number"
                  step="0.01"
                  value={width}
                  onChange={(v) => setWidth(Number(v))}
                />
                <SmartField
                  label="Thickness (T)"
                  unit="m"
                  type="number"
                  step="0.01"
                  value={thickness}
                  onChange={(v) => setThickness(Number(v))}
                />
              </div>
            )}

            {/* WALL Profile */}
            {elementType === 'WALL' && (
              <div className="space-y-4">
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

                {/* Wall Openings Builder */}
                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Wall Openings & Window/Door Deductions ({openings.length})
                    </span>
                    <button
                      type="button"
                      onClick={addOpening}
                      className="px-2.5 py-1 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 text-xs font-semibold flex items-center gap-1 border border-brand-500/30 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Opening
                    </button>
                  </div>

                  {openings.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      No openings specified. Full wall area will be computed.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {openings.map((op, idx) => (
                        <div
                          key={op.id || idx}
                          className="flex items-center gap-3 p-2 rounded-lg bg-slate-850 border border-slate-700/50"
                        >
                          <span className="text-xs font-mono text-slate-400">
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
                            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
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

            {/* FOOTING Profile */}
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

            {/* STAIR Profile */}
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
                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Stair Flights ({flights.length})
                    </span>
                    <button
                      type="button"
                      onClick={addFlight}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 text-xs font-semibold flex items-center gap-1 border border-indigo-500/30 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Flight
                    </button>
                  </div>

                  <div className="space-y-2">
                    {flights.map((fl, idx) => (
                      <div
                        key={fl.id || idx}
                        className="flex items-center gap-3 p-2 rounded-lg bg-slate-850 border border-slate-700/50"
                      >
                        <span className="text-xs font-mono text-slate-400">
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
                            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Landings List */}
                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Landings ({landings.length})
                    </span>
                    <button
                      type="button"
                      onClick={addLanding}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 text-xs font-semibold flex items-center gap-1 border border-indigo-500/30 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Landing
                    </button>
                  </div>

                  <div className="space-y-2">
                    {landings.map((ld, idx) => (
                      <div
                        key={ld.id || idx}
                        className="flex items-center gap-3 p-2 rounded-lg bg-slate-850 border border-slate-700/50"
                      >
                        <span className="text-xs font-mono text-slate-400">
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
                            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ═══ Material Specs & QA Planning ═══ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Concrete Mix Design
              </label>
              <select
                value={concreteGrade}
                onChange={(e) => setConcreteGrade(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500 font-mono"
              >
                {CONCRETE_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Rebar Spec / Ref
              </label>
              <input
                type="text"
                placeholder="e.g. 8T25, T10-150"
                value={rebarSpec}
                onChange={(e) => setRebarSpec(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Work Package
              </label>
              <select
                value={workPackageId}
                onChange={(e) => setWorkPackageId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500"
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
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
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
                className={`w-full px-3 py-2 bg-slate-800/90 border rounded-xl text-xs font-bold focus:outline-none ${
                  status === 'APPROVED'
                    ? 'text-emerald-400 border-emerald-500/40'
                    : status === 'POURED'
                    ? 'text-cyan-400 border-cyan-500/40'
                    : status === 'REJECTED'
                    ? 'text-rose-400 border-rose-500/40'
                    : 'text-amber-400 border-amber-500/40'
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
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Planned Pour Date
              </label>
              <input
                type="date"
                value={plannedCastingDate}
                onChange={(e) => setPlannedCastingDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          {/* ═══ Volumetric Takeoff & Progress Card ═══ */}
          <div className="p-4 bg-gradient-to-br from-slate-850 to-slate-900 rounded-2xl border border-brand-500/30 shadow-lg space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4" /> Volumetric Takeoff & Progress
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                  Formula: {takeoff.formulaDesc}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                    achievedPct >= 100
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : achievedPct > 0
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {achievedPct}% Achieved
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Calculated Volume */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/60 flex flex-col justify-between space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Calculated Volume
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded">
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
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-brand-400 font-mono font-bold text-sm focus:outline-none focus:border-brand-500"
                  />
                  {calculatedVolumeOverride !== '' && (
                    <button
                      type="button"
                      onClick={() => setCalculatedVolumeOverride('')}
                      className="text-[10px] text-slate-400 hover:text-slate-200 underline whitespace-nowrap"
                      title="Reset to live dimension calculation"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  Live calc: {takeoff.volume.toFixed(3)} m³
                </span>
              </div>

              {/* Achieved Volume */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/60 flex flex-col justify-between space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Achieved Volume
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
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
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-1">
                  {[0, 25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() =>
                        setAchievedVolume(
                          Number(((pct / 100) * effectiveCalculatedVolume).toFixed(3)),
                        )
                      }
                      className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Formwork Contact Area */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/60 flex flex-col justify-between space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Formwork Area
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">
                    m²
                  </span>
                </div>
                <div className="text-xl font-mono font-black text-cyan-400 py-1">
                  {takeoff.formworkArea.toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  Computed contact area
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* ═══ Footer Actions ═══ */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/95">
          <div className="text-xs text-slate-400 hidden sm:flex items-center gap-2 font-mono">
            <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 text-[11px]">
              Ctrl+Enter
            </kbd>
            <span>to save</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
            >
              Cancel
            </button>

            {!isEdit && (
              <button
                type="button"
                disabled={submitting || !elementName.trim()}
                onClick={handleSubmitAndAddAnother}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold shadow transition disabled:opacity-50 flex items-center gap-1.5"
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
