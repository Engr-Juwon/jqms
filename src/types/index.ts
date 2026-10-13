import { RequiredSignoffs, StakeholderSignoff } from "@/lib/pdfGenerators";

// ─── ROLE HIERARCHY ───
export type UserRole =
  // Executive & Corporate Governance (Level 5)
  | "SUPER_ADMIN"
  | "QUALITY_DIRECTOR"
  | "EXECUTIVE_MANAGEMENT"
  | "QUALITY_MANAGER"

  // Quality Management & Audit (Level 4)
  | "PROJECT_MANAGER"
  | "DEPUTY_QUALITY_MANAGER"
  | "LEAD_QUALITY_AUDITOR"
  | "QUALITY_AUDITOR"

  // Project & Field Leadership (Level 3-4)
  | "OPERATIONS_MANAGER"
  | "CONSTRUCTION_MANAGER"

  // Engineering, Laboratory & Document Control (Level 3)
  | "SENIOR_QAQC_ENGINEER"
  | "QAQC_ENGINEER"
  | "MATERIALS_ENGINEER"
  | "LAB_MANAGER"
  | "DOCUMENT_CONTROLLER"
  | "PROJECT_ENGINEER"
  | "MEP_COORDINATOR"
  | "MECHANICAL_ENGINEER"
  | "ELECTRICAL_ENGINEER"
  | "PLUMBING_ENGINEER"
  | "SAFETY_MANAGER"

  // Site Execution & Inspection (Level 2)
  | "QAQC_INSPECTOR"
  | "SITE_ENGINEER"
  | "MATERIALS_TECHNICIAN"
  | "SURVEYOR"
  | "FOREMAN"

  // External Stakeholders & Authorities (Level 1)
  | "CLIENT_REPRESENTATIVE"
  | "CONSULTANT"
  | "THIRD_PARTY_INSPECTOR"
  | "SUB_CONTRACTOR"
  | "SUPPLIER_VENDOR";

export const ROLE_LEVELS: Record<UserRole, number> = {
  // Level 5: System / Corporate Executive / Quality Management Head
  SUPER_ADMIN: 5,
  QUALITY_DIRECTOR: 5,
  EXECUTIVE_MANAGEMENT: 5,
  QUALITY_MANAGER: 5,

  // Level 4: Senior Project Management, Quality Authority & QAQC Lead Engineers
  PROJECT_MANAGER: 4,
  DEPUTY_QUALITY_MANAGER: 4,
  LEAD_QUALITY_AUDITOR: 4,
  SENIOR_QAQC_ENGINEER: 4,
  QAQC_ENGINEER: 4,

  // Level 3: Department Leads, Construction Managers, Senior Technical Engineers
  OPERATIONS_MANAGER: 3,
  CONSTRUCTION_MANAGER: 3,
  MATERIALS_ENGINEER: 3,
  LAB_MANAGER: 3,
  DOCUMENT_CONTROLLER: 3,
  PROJECT_ENGINEER: 3,
  MEP_COORDINATOR: 3,
  MECHANICAL_ENGINEER: 3,
  ELECTRICAL_ENGINEER: 3,
  PLUMBING_ENGINEER: 3,
  SAFETY_MANAGER: 3,
  QUALITY_AUDITOR: 3,
  QAQC_INSPECTOR: 3,

  // Level 2: Site Engineers & Technicians
  SITE_ENGINEER: 2,
  MATERIALS_TECHNICIAN: 2,
  SURVEYOR: 2,
  FOREMAN: 2,

  // Level 1: External Stakeholders, Clients, Consultants & Subcontractors
  CLIENT_REPRESENTATIVE: 1,
  CONSULTANT: 1,
  THIRD_PARTY_INSPECTOR: 1,
  SUB_CONTRACTOR: 1,
  SUPPLIER_VENDOR: 1,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  QUALITY_DIRECTOR: "Director of Quality & Governance",
  EXECUTIVE_MANAGEMENT: "Executive Management",
  QUALITY_MANAGER: "Quality Manager",

  DEPUTY_QUALITY_MANAGER: "Deputy Quality Manager",
  LEAD_QUALITY_AUDITOR: "Lead Quality Auditor",
  QUALITY_AUDITOR: "Quality Auditor",

  PROJECT_MANAGER: "Project Manager",
  OPERATIONS_MANAGER: "Operations Manager",
  CONSTRUCTION_MANAGER: "Construction Manager",

  SENIOR_QAQC_ENGINEER: "Senior QAQC Engineer",
  QAQC_ENGINEER: "QAQC Engineer",
  MATERIALS_ENGINEER: "Materials Lead Engineer",
  LAB_MANAGER: "Laboratory Manager",
  DOCUMENT_CONTROLLER: "Document Controller",
  PROJECT_ENGINEER: "Project Engineer",
  MEP_COORDINATOR: "MEP Coordinator",
  MECHANICAL_ENGINEER: "Mechanical Engineer",
  ELECTRICAL_ENGINEER: "Electrical Engineer",
  PLUMBING_ENGINEER: "Plumbing Engineer",
  SAFETY_MANAGER: "Safety & HSE Manager",

  QAQC_INSPECTOR: "QAQC Inspector",
  SITE_ENGINEER: "Site Engineer",
  MATERIALS_TECHNICIAN: "Materials Technician",
  SURVEYOR: "Site Surveyor",
  FOREMAN: "Foreman",

  CLIENT_REPRESENTATIVE: "Client Representative",
  CONSULTANT: "Consultant / Architect",
  THIRD_PARTY_INSPECTOR: "Third-Party Inspector (TPIA)",
  SUB_CONTRACTOR: "Subcontractor Representative",
  SUPPLIER_VENDOR: "Material Supplier / Vendor",
};

// Alias for backwards compatibility
export const ROLE_TITLES = ROLE_LABELS;

// ─── USER PROFILE ───
export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  displayName?: string;
  phone?: string;
  role: UserRole;
  title?: string;
  designation?: string;
  companyId: string;
  companyName?: string;
  status?: "ACTIVE" | "PENDING" | "SUSPENDED" | "INACTIVE" | string;
  projectIds?: string[];
  /** Indexed project membership used by Realtime Database & Firestore security rules. */
  projectAccess?: Record<string, true | boolean>;
  avatarUrl?: string;
  department?: string;
  isActive?: boolean;
  lastActiveProjectId?: string;
  smtpCredentials?: {
    username?: string;
    password?: string;
    senderEmail?: string;
    senderDisplayName?: string;
    emailSignature?: string;
    saveSentToImap?: boolean;
    includeCompanyLogoInSignature?: boolean;
  };
  createdAt: number | string;
  updatedAt?: number | string;
}

export interface CompanySMTPServerConfig {
  host: string;
  port: number;
  secure: boolean;
  requireTls?: boolean;
  imapHost?: string;
  imapPort?: number;
  imapSecure?: boolean;
  defaultSenderName?: string;
}

// ─── COMPANY ───
export interface CompanySettings {
  ncrPrefix?: string;
  rfiPrefix?: string;
  marPrefix?: string;
  mirPrefix?: string;
  siteCommentPrefix?: string;
  inspectionPrefix?: string;
  ptpPrefix?: string;
  weeklyReportPrefix?: string;
  siteInstructionPrefix?: string;
  cubeTestStandard?: "BS EN 12390" | "ASTM C39" | "IS 516" | string;
  rebarStandard?: "BS 4449" | "ASTM A615" | "IS 1786" | string;
  notifications?: {
    notifyNCR?: boolean;
    notifyInspection?: boolean;
    notifyCubeFailure?: boolean;
    notifyPTP?: boolean;
  };
  smtpServer?: CompanySMTPServerConfig;
}

export interface EmailCommunicationLog {
  id: string;
  companyId: string;
  projectId?: string;
  senderUid: string;
  senderName: string;
  senderEmail: string;
  recipients: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  module?: "WEEKLY_REPORT" | "NCR" | "SITE_INSTRUCTION" | "CUBE_TEST" | "INSPECTION" | "GENERAL" | string;
  referenceId?: string;
  referenceTitle?: string;
  status: "SENT" | "FAILED" | "DELIVERED";
  errorMessage?: string;
  hasAttachments?: boolean;
  attachmentNames?: string[];
  sentAt: string;
}

export interface Company {
  id: string;
  name: string;
  legalName?: string;
  logo?: string;
  logoUrl?: string;
  ownerId: string;
  projects?: number;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  registrationNo?: string;
  taxNumber?: string;
  standards?: string[];
  settings?: CompanySettings;
  createdAt: number | string;
  updatedAt?: number | string;
}

// ─── PROJECT ───
export interface Project {
  id: string;
  name: string;
  code: string;
  type: string;
  location?: string;
  address?: string;
  country?: string;
  clientName: string;
  contractorName: string;
  consultantName: string;
  startDate: string;
  endDate: string;
  description?: string;
  status: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED" | string;
  progress?: number;
  companyId: string;
  companyName?: string;
  iconUrl?: string;
  imageUrl?: string | null;
  coverImageUrl?: string;
  assignedStaff?: string[];
  assignedStaffIds?: string[];
  excludedStaffIds?: string[];
  createdBy?: string;
  icon?: string;
  color?: string;
  totalBudget?: number;
  currency?: string;
  costRates?: ProjectCostRates;
  carbonFactors?: CarbonFactors;
  currentLevelId?: string;
  currentLevelName?: string;
  createdAt: number | string;
  updatedAt?: number | string;
}

// ─── WORK PACKAGE ───
export interface WorkPackage {
  id: string;
  name: string; // e.g., "Foundation Works", "MEP", "Finishes"
  code?: string; // e.g., "WP-01", "WP-05"
  description?: string;
  leadTradeId?: string;
  status?: "ACTIVE" | "COMPLETED" | "ON_HOLD";
  projectId: string;
  companyId: string;
  createdAt: number | string;
  updatedAt?: number | string;
}

// ─── PROJECT LEVEL ───
export interface ProjectLevel {
  id: string;
  projectId: string;
  companyId: string;
  name: string; // e.g., "Basement 2", "Level 1", "Roof"
  description?: string;
  elevation: number; // in meters (e.g. -6.0, 0.0, 3.5)
  order: number;
  isCompleted?: boolean;
  completionPercentage?: number;
  totalElementsCount?: number;
  approvedElementsCount?: number;
  isPrecedenceComplete?: boolean;
  precedenceSourceLevelName?: string;
  workPackages?: WorkPackage[];
  workPackageId?: string;
  createdAt?: number | string;
}
export type Level = ProjectLevel;

// ─── GRIDLINE ───
export interface Gridline {
  id: string;
  projectId?: string;
  companyId?: string;
  axis: "X" | "Y";
  label: string; // e.g. "A", "B", "1", "2"
  order: number;
  distanceToNext: number; // in meters (e.g. 6.000)
  createdAt?: string | number;
  updatedAt?: string | number;
}

// ─── STRUCTURAL ELEMENT ───
export type ElementType =
  | "Column (Rectangular)"
  | "Column (Circular)"
  | "Slab"
  | "Beam"
  | "Wall"
  | "Stair"
  | "COLUMN"
  | "BEAM"
  | "SLAB"
  | "WALL"
  | "FOOTING"
  | "STAIRS"
  | "COLUMN_CIRCULAR"
  | "STAIR"
  | "OTHER"
  | "Column (Rectangular)"
  | "Column (Circular)"
  | "Slab"
  | "Beam"
  | "Wall"
  | "Stair"
  | "COLUMN"
  | "BEAM"
  | "SLAB"
  | "WALL"
  | "FOOTING"
  | "STAIRS"
  | "COLUMN_CIRCULAR"
  | "STAIR"
  | "OTHER"
  | string;

export type ElementStatus =
  | "PENDING"
  | "REBAR_IN_PROGRESS"
  | "FORMWORK_IN_PROGRESS"
  | "READY_FOR_CASTING"
  | "REBAR_INSPECTED"
  | "POURED"
  | "APPROVED"
  | "REJECTED";

export interface StairFlightForm {
  id: string;
  length: string;
  riserCount: string;
}

export interface StairLandingForm {
  id: string;
  length: string;
}

export interface WallOpeningForm {
  id?: string;
  width: number | string;
  height: number | string;
}

export interface StructuralElement {
  id: string;
  projectId: string;
  companyId?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: number | string;
  updatedAt?: number | string;
  updatedBy?: string;
  updatedByName?: string;

  // Common fields
  levelId: string;
  levelName?: string;
  level?: string;
  grid?: string; // e.g. "Grid C-4", "A-B/1-2"
  gridAxis?: string;
  gridX?: number; // 2D/3D coordinate
  gridY?: number;
  gridZ?: number;
  elementName: string; // e.g. "C-B1-04"
  name?: string; // alias for elementName
  elementType: ElementType;
  status: ElementStatus;
  calculatedVolume: number;
  volume?: number;
  achievedVolume?: number;
  workPackageId?: string;
  workPackageName?: string;
  supportedSlabThickness?: number;
  concreteGrade?: string; // e.g. "C40/50"
  rebarSpec?: string; // e.g. "8T20, T10-150"

  // Elevation tracking (Auto derived from level elevation + element height/depth, but intentional & editable)
  elevation?: number; // Base/bottom elevation in meters (e.g. +3.500m)
  topElevation?: number; // Top of element elevation in meters (e.g. +6.700m)
  bottomElevation?: number; // Bottom elevation in meters
  elevationOffset?: number; // Specific offset from level datum (e.g. step down -0.05m)

  // Dimensions & Profile
  length?: number; // in meters
  width?: number; // in meters
  height?: number; // in meters
  depth?: number; // in meters
  thickness?: number; // in meters (slab/wall thickness)
  diameter?: number; // in meters (circular column diameter)
  columnShape?: "rectangular" | "circular" | "inclined";
  slabShape?: "rectangular" | "circular" | "semi_circular" | "circular_segment" | "circular_sector" | "curved_cantilever" | "trapezoidal_cantilever" | "cad_area";
  beamShape?: "straight" | "curved" | "tapered";
  wallShape?: "straight" | "curved";
  radius?: number; // in meters (radius R)
  arcRadius?: number; // alias for radius R in meters
  arcDepth?: number; // in meters (rise / sagitta / h)
  arcAngle?: number; // in degrees (subtended angle θ)
  chordLength?: number; // in meters (chord width C)
  arcLength?: number; // in meters (curved arc length s)
  curvedInputMode?: "radius_rise" | "chord_rise" | "radius_angle" | "radius_chord";
  isArcDeduction?: boolean; // for curved cantilever / recess
  cantileverDepth?: number; // in meters
  cantileverDirection?: "TOP" | "BOTTOM" | "LEFT" | "RIGHT" | "NORTH" | "SOUTH" | "EAST" | "WEST";
  isFlipped?: boolean; // Flip projection orientation
  isMirrored?: boolean; // Mirror horizontally (flip start/end taper or arc curvature side)
  taperEndDepth?: number; // in meters (for tapered / trapezoidal cantilever)
  customArea?: number; // in m2 (for irregular polyline / spline area)
  customPerimeter?: number; // in meters (for irregular polyline formwork)
  verticality?: "straight" | "inclined";
  isInclined?: boolean;
  verticalHeight?: number;
  horizontalOffset?: number;
  inclinationAngle?: number;
  inclinedCalcMode?: "offset" | "angle";
  calculatedFormworkArea?: number; // in m2
  area?: number; // in m2
  dimensions: {
    length: number;
    width: number;
    height: number;
  };

  // Wall Openings
  openings?: WallOpeningForm[];

  // Stair specific
  flightLength?: number;
  flightWidth?: number;
  waistThickness?: number;
  riserCount?: number;
  treadWidth?: number;
  landingWidth?: string | number;
  landingThickness?: string | number;
  flights?: any[];
  landings?: any[];

  // Planning & Casting
  plannedCastingDate?: string;
  actualCastingDate?: string;
  plannedPourDate?: string;
  actualPourDate?: string;
  nextInspectionDate?: string;
  nextInspectionType?: string;
  pourPermitId?: string;
  inspectionsCount?: number;
  linkedNcrIds?: string[];
  linkedCubeSampleIds?: string[];
}

// ─── 5D BIM COST & QUANTITY TAKEOFF (QTO) ───
export interface ProjectCostRates {
  currencySymbol: string;
  concreteRates: Record<string, number>;
  defaultConcreteRate: number;
  formworkRate: number; // per m2
  rebarRatePerTonne: number; // per Tonne
  laborRatePerM3: number; // per m3
  equipmentRatePerM3: number; // per m3 (pumps/cranes)
}

export interface Element5DCostBreakdown {
  concreteVolume: number;
  concreteRate: number;
  concreteCost: number;
  formworkArea: number;
  formworkRate: number;
  formworkCost: number;
  rebarTonnage: number;
  rebarRatePerTonne: number;
  rebarCost: number;
  laborRatePerM3: number;
  laborCost: number;
  equipmentRatePerM3: number;
  equipmentCost: number;
  totalCost: number;
  currencySymbol: string;
}

export interface Level5DCostSummary {
  levelId: string;
  levelName: string;
  totalElementsCount: number;
  plannedVolume: number;
  plannedFormworkArea: number;
  plannedRebarTonnage: number;
  plannedCostPV: number; // Planned Value (Budget)
  approvedCostEV: number; // Earned Value (QA/QC Approved)
  inProgressCost: number; // Rebar / Formwork / Ready / Poured
  currencySymbol: string;
  concreteCostTotal: number;
  formworkCostTotal: number;
  rebarCostTotal: number;
  laborCostTotal: number;
  equipmentCostTotal: number;
}

// ─── 6D BIM SUSTAINABILITY & EMBODIED CARBON ───
export interface CarbonFactors {
  concreteGradeFactors: Record<string, number>; // kg CO2e / m3
  defaultConcreteFactor: number; // kg CO2e / m3
  scmReplacementPct: number; // % SCM (GGBS/Fly Ash replacement, e.g. 30%)
  rebarCarbonFactor: number; // kg CO2e / tonne of steel
  recycledSteelPct: number; // % recycled EAF steel content (e.g. 60%)
  formworkCarbonFactor: number; // kg CO2e / m2 of shuttering reuse
  transportationFactor: number; // kg CO2e / m3 concrete transport
}

export type EcoRating = "A+" | "A" | "B" | "C" | "D" | "E";

export interface Element6DCarbonBreakdown {
  concreteVolume: number;
  concreteFactor: number; // kg CO2e / m3
  concreteCarbonKg: number;
  formworkArea: number;
  formworkCarbonKg: number;
  rebarTonnage: number;
  rebarCarbonFactor: number;
  rebarCarbonKg: number;
  transportCarbonKg: number;
  totalCarbonKg: number;
  totalCarbonTonne: number;
  carbonIntensityKgPerM3: number;
  scmAvoidedCarbonKg: number; // Saved CO2e from SCM replacement
  ecoRating: EcoRating;
}

export interface Level6DCarbonSummary {
  levelId: string;
  levelName: string;
  totalElementsCount: number;
  totalVolumeM3: number;
  totalCarbonKg: number;
  totalCarbonTonne: number;
  concreteCarbonTonne: number;
  rebarCarbonTonne: number;
  formworkCarbonTonne: number;
  transportCarbonTonne: number;
  averageIntensityKgPerM3: number;
  totalScmAvoidedCarbonTonne: number;
  greenBuildingTier: "Net-Zero Ready (A+)" | "Low Carbon (A)" | "Standard (B)" | "Moderate (C)" | "High Impact (D)";
}

// ─── ELEMENT REGISTRY UI PROPS ───
export interface ElementFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedLevelFilter: string;
  setSelectedLevelFilter: (val: string) => void;
  selectedStatusFilter: string;
  setSelectedStatusFilter: (val: string) => void;
  selectedPackageFilter: string;
  setSelectedPackageFilter: (val: string) => void;
  selectedTypeFilter: string;
  setSelectedTypeFilter: (val: string) => void;
  workPackages: Array<{ id: string; name: string }>;
  uniqueLevels: string[];
  statusOptions: string[];
  elementTypes: string[];
}

export interface ElementTableProps {
  elements: StructuralElement[];
  loading: boolean;
  canUpdateUser: boolean;
  statusOptions: string[];
  onViewDetail: (el: StructuralElement) => void;
  onStatusChange: (id: string, status: StructuralElement["status"]) => void;
  onEdit: (el: StructuralElement) => void;
  onDelete: (id: string, name: string, level: string) => void;
}

export interface LevelManagementProps {
  canCreateUser: boolean;
  canUpdateUser: boolean;
  editingLevelId: string | null;
  setEditingLevelId: (id: string | null) => void;
  levelFormName: string;
  setLevelFormName: (name: string) => void;
  levelFormPackageId: string;
  setLevelFormPackageId: (id: string) => void;
  projectLevels: ProjectLevel[];
  workPackages: WorkPackage[];
  levelsLoading: boolean;
  onSaveLevel: () => void;
  onDeleteLevel: (id: string, name: string) => void;
}

export interface ElementModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItemId: string | null;
  workPackages: WorkPackage[];
  form: {
    level: string;
    grid: string;
    elementName: string;
    elementType: StructuralElement["elementType"];
    length: string;
    width: string;
    thickness: string;
    diameter: string;
    workPackageId: string;
    status: StructuralElement["status"];
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  projectLevels: ProjectLevel[];
  elementTypes: string[];
  statusOptions: string[];
  computedVolume: number;
  onSubmit: () => void;
}

export interface WorkPackageManagementProps {
  canCreateUser: boolean;
  canUpdateUser: boolean;
  editingPackageId: string | null;
  setEditingPackageId: (id: string | null) => void;
  packageFormName: string;
  setPackageFormName: (name: string) => void;
  workPackages: WorkPackage[];
  loading: boolean;
  onSavePackage: () => void;
  onDeletePackage: (id: string, name: string) => void;
}

// ─── NON-CONFORMANCE REPORT (NCR) ───
export interface NCRVerificationChecklist {
  reInspected: boolean;
  fixSatisfiesSpec: boolean;
  photosTaken: boolean;
  notes?: string;
}

export interface NCRVerificationRemarks {
  reInspected?: string;
  fixSatisfiesSpec?: string;
  photosTaken?: string;
}

export type NCRRootCauseType =
  | "Workmanship"
  | "Material Defect"
  | "Drawing Error"
  | "Specification Non-Compliance"
  | "Equipment Failure"
  | "Other"
  | "Workmanship"
  | "Material Defect"
  | "Drawing Error"
  | "Specification Non-Compliance"
  | "Equipment Failure"
  | "Other"
  | string;

export type NCRFinalStatus = "CLOSED" | "REJECTED" | "PENDING";
export type NCRStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "REMEDIATION"
  | "CLOSED"
  | string;
export type NCRSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type NCRRootCause = NCRRootCauseType;

export interface CorrectiveActionItem {
  id: string;
  actionText: string;
  assignedTo: string;
  targetDate: string;
  completedDate?: string;
  status: "PENDING" | "COMPLETED";
}

export interface NonConformanceReport {
  id: string;
  ncrNumber: string; // e.g., "NCR-001" or "CDL-BS_NCR_..."
  title: string;
  status: NCRStatus;
  priority?: string;
  severity: NCRSeverity;
  category?: string;
  elementId?: string;
  structuralElementId?: string;
  elementName?: string;
  elementType?: string;
  elementIds?: string[];
  elementNames?: string[];
  elementsData?: Array<{
    id: string;
    elementName: string;
    elementType?: string;
    levelId?: string;
    levelName?: string;
    grid?: string;
  }>;
  trade?: string;
  tradeId?: string;
  tradeName?: string;
  subtrade?: string;
  subtradeId?: string;
  subtradeName?: string;
  gridLine?: string;
  gridAxis?: string;
  locationLevel?: string;
  levelId?: string;
  levelName?: string;
  sourceSiteCommentId?: string;
  raisedBy: {
    uid: string;
    name: string;
    role: string;
    date?: string;
  };
  raisedByName?: string;
  reportedBy?: string;
  assignedTo?: string;
  assignedToName?: string;
  projectId: string;
  projectName?: string;
  projectAddress?: string;
  companyId: string;
  companyName?: string;
  deadline?: string;
  targetResolutionDate?: string;
  actualResolutionDate?: string;
  attachments?: string[];
  photos: string[];
  beforePhotos?: any[];
  afterPhotos?: any[];
  evidencePhotos?: string[];
  statusHistory?: StatusHistoryEntry[];
  createdAt: number | string;
  createdBy?: string;
  updatedAt?: number | string;
  closedAt?: number | string | null;
  daysOpen?: number;

  // Upgraded structural layout fields
  location?: string;
  specReference?: string;
  drawingNumber?: string;
  dispositionType?: string;
  dateFound?: string;
  descriptionItems?: string[];
  description: string;
  rootCauseType: NCRRootCauseType;
  rootCauseOtherText?: string;
  rootCause?: string;
  rootCauseDetails?: string;
  correctiveActions: CorrectiveActionItem[];
  correctiveAction?: string;
  correctiveDirective?: string;
  preventiveAction?: string;
  preventiveDirective?: string;
  remedialDisposition?:
    | "REPAIR"
    | "REPLACE"
    | "REJECT"
    | "USE_AS_IS_CONCESSION"
    | string;
  dispositionStrategy?: string;

  // Verification & Sign-off
  verification?: NCRVerificationChecklist;
  verificationChecklist?: NCRVerificationChecklist;
  verificationRemarks?: NCRVerificationRemarks;
  finalStatus?: NCRFinalStatus;
  qaqcEngineerName?: string;
  signDate?: string;
  closureSignOff?: {
    closedByUid: string;
    closedByName: string;
    closedByRole?: string;
    signatureUrl?: string;
    closedAt: string;
  };
  logoBase64?: string;
}

export type NCR = NonConformanceReport;

// ─── SITE INSTRUCTION (QUALITY WARNING & DIRECTIVE) ───
export type SiteInstructionSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL"
  | "STOP_WORK";

export type SiteInstructionStatus =
  | "DRAFT"
  | "ISSUED"
  | "ACKNOWLEDGED"
  | "COMPLIED"
  | "SUPERSEDED"
  | "CANCELLED";

export type SiteInstructionType =
  | "OVERDUE_NCR_WARNING"
  | "QUALITY_DIRECTIVE"
  | "DEFECT_RECTIFICATION"
  | "WORK_STOPPAGE"
  | "TESTING_ORDER"
  | "GENERAL_INSTRUCTION";

export interface SiteInstructionSignOff {
  uid: string;
  name: string;
  role: string;
  designation?: string;
  company?: string;
  email?: string;
  signedAt: string;
  signatureUrl?: string;
  digitalSignatureStamp?: string;
  declaration?: string;
}

export interface SiteInstruction {
  id: string;
  instructionNumber: string; // e.g. "SI-2026-001"
  title: string;
  type: SiteInstructionType;
  severity: SiteInstructionSeverity;
  status: SiteInstructionStatus;

  // Project & Scope
  projectId: string;
  projectName?: string;
  projectAddress?: string;
  companyId: string;
  companyName?: string;
  issuingDepartment?: string;

  // Recipient / Contractor
  contractorName?: string;
  subcontractorName?: string;
  recipientName?: string;
  recipientRole?: string;
  recipientEmail?: string;

  // Linked NCR Context (when issued against an NCR)
  ncrId?: string;
  ncrNumber?: string;
  ncrTitle?: string;
  ncrSeverity?: string;
  ncrCategory?: string;
  ncrDeadline?: string;
  ncrDaysOpen?: number;
  ncrDaysOverdue?: number;

  // Structural Location & Discipline
  location?: string;
  levelId?: string;
  levelName?: string;
  elementId?: string;
  elementName?: string;
  trade?: string;
  tradeId?: string;
  tradeName?: string;
  subtrade?: string;
  subtradeId?: string;
  subtradeName?: string;
  specReference?: string;
  drawingNumber?: string;

  // Instruction Directives & Mandatory Actions
  subject: string;
  issueSummary: string; // Defect / non-conformance context
  contractualClause?: string; // e.g. "ISO 9001:2015 Clause 8.7 & 10.2 / Spec Sec 03300"
  instructionText: string; // Direct contractual directive
  mandatoryActions: string[]; // List of specific action directives
  complianceDeadline: string; // Target compliance date or hours
  stopWorkOrdered?: boolean; // Whether work on the element/zone must halt immediately
  preventiveMeasures?: string;

  // Single Authorized Issuer Sign-Off (Logged-In User)
  signedBy: SiteInstructionSignOff;

  // Metadata & Attachments
  photos?: string[];
  attachments?: string[];
  remarks?: string;
  createdAt: number | string;
  createdBy: string;
  updatedAt?: number | string;
}

// ─── INSPECTION & HOLD POINTS ───
export type InspectionStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "SCHEDULED"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "CONDITIONAL"
  | "RE_INSPECTION"
  | "CLOSED";

export type ItemResult = "PASS" | "FAIL" | "OBSERVATION" | "NA" | "";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ApprovalEntry {
  level: string; // "QAQC_ENGINEER" | "CONSTRUCTION_MANAGER" | "PROJECT_MANAGER" | "CONSULTANT"
  userId: string;
  userName: string;
  role: string;
  decision: "APPROVED" | "REJECTED" | "PENDING";
  comment?: string;
  signature: string; // base64 PNG or text initial
  timestamp: number;
}

export interface PunchItem {
  id: string;
  description: string;
  status: "OPEN" | "CLOSED";
  raisedAt: number;
  closedAt: number | null;
}

export interface InspectionChecklistItem {
  id: string;
  label: string;
  discipline?: string;
  isHoldPoint?: boolean;
  critical?: boolean;
  importanceWeight?: number; // 1 to 5
  weight?: number;
  acceptanceCriteria?: string;
  result: ItemResult;
  remarks?: string;
  photos?: string[];
  category?: string;
  voiceNote?: string;
  ncrId?: string;
  timestamp?: number;
}

export type InspectionItem = InspectionChecklistItem;

export interface InspectionRequest {
  id: string;
  inspectionNumber: string; // "INSP-2026-001"
  templateId?: string;
  templateName: string;
  stage: string;
  element?: string;
  elementId?: string;
  structuralElementId?: string;
  elementName?: string;
  elementType?: string;
  elementRef?: string;
  levelId?: string;
  levelName?: string;
  building?: string;
  floor?: string;
  zone?: string;
  gridAxis?: string;
  date?: string;
  scheduledDate: string;
  scheduledTime?: string;
  projectId: string;
  projectName?: string;
  companyId: string;
  description?: string;
  inspector: {
    uid: string;
    name: string;
    role: string;
    designation?: string;
  };
  inspectorName?: string;
  contractor?: string;
  trade?: string;
  tradeId?: string;
  subtrade?: string;
  subtradeId?: string;
  status: InspectionStatus;
  riskLevel?: RiskLevel;
  passScore: number; // percentage 0 - 100
  passRate?: number;
  qualityScore?: number;
  items: InspectionChecklistItem[];
  remarks?: string;
  attachments?: string[];
  dueDate?: string;
  approvals?: ApprovalEntry[];
  punchItems?: PunchItem[];
  linkedNcrId?: string;
  linkedNcrIds?: string[];
  geoLocation?: { lat: number; lng: number };
  statusHistory?: StatusHistoryEntry[];
  consultantRepresentative?: string;
  subcontractorRepresentative?: string;
  signatures?: {
    inspector?: string;
    consultant?: string;
    siteEngineer?: string;
  };
  stakeholders?: StakeholderSignoff[];
  createdBy?: string;
  createdAt: number | string;
  updatedAt?: number | string;
  submittedAt?: number;
  approvedAt?: number;
  closedAt?: number;
}

export type Inspection = InspectionRequest;

export interface TemplateItem {
  id?: string;
  label: string;
  critical: boolean;
  weight?: number;
  importanceWeight?: number;
  category?: string;
  acceptanceCriteria?: string;
  discipline?: string;
  isHoldPoint?: boolean;
}

export type InspectionTemplateItem = TemplateItem;

export interface InspectionTemplate {
  id: string;
  name?: string;
  element: string;
  stage: string;
  discipline: string;
  trade?: string;
  version: string;
  description?: string;
  items: TemplateItem[];
  isSystem?: boolean;
  isActive?: boolean;
  companyId: string;
  createdBy?: string;
  createdAt?: number | string;
  updatedAt?: number | string;
}

// ─── PERMIT TO POUR (PTP) ───
export interface PermitToPour {
  id: string;
  projectId: string;
  companyId: string;
  ptpNumber: string; // "PTP-2026-001"
  levelId: string;
  levelName: string;
  elementId?: string;
  elementName: string;
  tradeId?: string;
  tradeName?: string;
  subtradeName?: string;
  plannedPourDate: string;
  plannedPourTime: string;
  targetVolumeM3: number;
  concreteGrade: string;
  slumpTargetMm: number;
  supplierBatchPlant?: string;
  batchingPlant?: string;
  inspectedBy?: string;
  requiredSignoffs?: RequiredSignoffs;
  issuedByName: string;
  gridAxis: string;
  grid?: string;
  truckDeliveryCountEstimate?: number;
  checklist: {
    rebarInspectionApproved: boolean;
    rebarInspectionRef?: string;
    formworkStabilityChecked: boolean;
    mepEmbedsSleevesClear: boolean;
    jointCleanlinessWaterjet: boolean;
    concreteMixGradeSlumpVerified: boolean;
    safetyLightingAccessClear?: boolean;
    vibratorsPumpsStandbyReady: boolean;
  };
  checklistItems?: Array<{
    id?: string;
    category?: string;
    label: string;
    status: "PASS" | "FAIL" | "N/A" | string;
    notes?: string;
  }>;
  building?: string;
  floor?: string;
  zone?: string;
  elementRef?: string;
  elementType?: string;
  permitNumber?: string;
  estimatedVolume?: number;
  pourDate?: string;
  pourTime?: string;
  supplier?: string;
  placementMethod?: string;
  stakeholders?: StakeholderSignoff[];
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "ISSUED";
  clearanceSignatures: {
    siteEngineer?: { name: string; signed: boolean; signedAt?: string };
    rebarInspector?: { name: string; signed: boolean; signedAt?: string };
    mepCoordinator?: { name: string; signed: boolean; signedAt?: string };
    qaqcLeadEngineer?: { name: string; signed: boolean; signedAt?: string };
    consultantEngineer?: { name: string; signed: boolean; signedAt?: string };
  };
  notes?: string;
  issuedById: string;
  createdAt: string | number;
  updatedAt?: string | number;
}

// ─── CONCRETE & STEEL MATERIALS ───
export interface MaterialDelivery {
  id: string;
  projectId: string;
  companyId: string;
  materialName?: string;
  deliveryNumber?: string;
  deliveryDate: string;
  deliveryNote?: string;
  deliveryNoteNumber?: string;
  supplier?: string;
  supplierName: string;
  materialCategory?:
    | "Cement"
    | "Rebar"
    | "Aggregates"
    | "Admixtures"
    | "Waterproofing"
    | "Structural Steel"
    | "Pipes/MEP"
    | "Masonry"
    | string;
  materialDescription: string;
  quantity?: string | number;
  quantityReceived?: number;
  quantityAccepted?: number;
  quantityRejected?: number;
  unit?: "tons" | "m3" | "bags" | "meters" | "pieces" | "liters" | string;
  vehicleTruckNumber?: string;
  truckNumber?: string;
  batchNumber?: string;
  trade?: string;
  tradeId?: string;
  subtrade?: string;
  subtradeId?: string;
  status?: string;
  qaqcStatus?: "ACCEPTED" | "REJECTED" | "CONDITIONAL" | "PARTIALLY_ACCEPTED" | "APPROVED AS NOTED" | string;
  rejectionReason?: string;
  ncrNumber?: string;
  ncrId?: string;
  qaqcRemarks?: string;
  remarks?: string;
  inspectionNotes?: string;
  photos?: string[];
  millCertificates?: string[];
  inspectorName?: string;
  createdBy?: string;
  createdAt: number | string;
  updatedAt?: number | string;
}

export interface CubeCrushSpecimenResult {
  id: number;
  load: string | number; // kN e.g., "527.88"
  strength: string | number; // MPa e.g., "23.46"
  cubeWeight?: string | number; // kg
  failureMode?: string; // e.g., "Cone Failure", "Shear Failure"
}

export interface DayResultEntry {
  averageStrength: number;
  minimumStrength?: number;
  maximumStrength?: number;
  standardDeviation?: number;
  status: "PASS" | "FAIL" | "PENDING" | string;
  remarks?: string;
  technician?: string;
  testDate?: string;
  testingStandard?: string; // e.g., "BS EN 12390-3"
  enteredBy?: string;
  enteredAt?: string;
  cubes: CubeCrushSpecimenResult[];
}

export interface CubeCrushTest {
  testAgeDays: 1 | 3 | 7 | 14 | 28 | 56 | number;
  scheduledDate: string;
  testDate?: string;
  cubeDimensionsMm?: {
    length: number;
    width: number;
    height: number;
  };
  densityKgM3?: number;
  crushingLoadKn?: number;
  compressiveStrengthNmm2?: number;
  targetStrengthNmm2: number;
  percentageAchieved?: number;
  compliance?: "PENDING" | "PASS" | "FAIL" | string;
  labTechnician?: string;
  witnessedBy?: string;
}

export type CubeTestResult = DayResultEntry;

// ==========================================
// 1. Supporting Sub-Interfaces
// ==========================================

export type ConcreteStatus =
  | "PENDING"
  | "CURING"
  | "PARTIALLY_TESTED"
  | "7-DAY DONE"
  | "14-DAY DONE"
  | "28-DAY DONE"
  | "APPROVED"
  | "REJECTED"
  | "OVERDUE"
  | "NCR_ISSUED"
  | string;

export type TestAge = 1 | 3 | 7 | 14 | 28 | 56 | number;

export interface IndividualCubeRecord {
  cubeId: string; // e.g., "AUTO-001"
  cubeMark: string; // e.g., "CUBE-001"
  mouldNumber?: string;
  cureLocation?: string;
}

export interface CubeCrushTestSummary {
  testAgeDays: TestAge;
  scheduledDate: string;
  actualTestDate?: string;
  individualResults?: any[];
  cubes?: CubeCrushSpecimenResult[];
  averageStrengthNmm2: number;
  averageStrength?: number;
  requiredStrengthNmm2: number;
  percentageOfTarget: number; // e.g., 85.5%
  compliance: "PASS" | "FAIL" | "PENDING" | string;
  status?: string;
  testedBy?: string;
  witnessedBy?: string;
  remarks?: string;
  crushingLoadKn?: number;
  compressiveStrengthNmm2?: number;
  targetStrengthNmm2?: number;
  testDate?: string;
  labTechnician?: string;
  cubeDimensionsMm?: { length: number; width: number; height: number };
}

export interface ConcreteNCRLink {
  ncrId: string;
  ncrNumber: string; // e.g., "NCR-2026-0041"
  status: "OPEN" | "UNDER_REVIEW" | "CORRECTIVE_ACTION" | "CLOSED" | string;
  generatedAt: number;
  generatedBy: string;
  triggeredByAge: TestAge; // Age at which strength failed (e.g., 7 or 28)
  actualStrengthNmm2: number;
  requiredStrengthNmm2: number;
  proposedAction?:
    | "RE_TEST_CORE"
    | "STRUCTURAL_CALCULATION"
    | "LOAD_TEST"
    | "DEMOLITION_REBUILD"
    | string;
}

// ==========================================
// 2. Primary ConcreteCubeSample Interface
// ==========================================

export interface ConcreteCubeSample {
  // Primary Identifiers & Database Keys
  id: string;
  sampleId: string; // e.g., "CDL-BS-CUBE-0002"
  inscribedName?: string; // e.g., "S3"
  projectId: string;
  projectName?: string;
  companyId: string;
  sampleNumber?: string;
  sampleBarcode?: string;
  sampleLocation?: string;

  // Project Quality References & Traceability
  inspectionLot?: string;
  pourReference?: string; // PTP Number link
  concretePourSequence?: string;
  drawingReference?: string;
  ITPReference?: string;
  methodStatementReference?: string;
  RFINumber?: string;

  // Structural Location & Level Info
  elementId?: string;
  elementName: string; // e.g., "Pile Cap"
  structureElement?: string; // e.g., "Pile Cap"
  levelId?: string;
  levelName: string; // e.g., "0 - Foundation"
  level?: string; // e.g., "0 - Foundation"
  block?: string;
  zone?: string; // e.g., "PILE CAPS 4, 5, 6, 7"
  gridReference?: string;
  chainage?: string;

  // Mix Design & Batching Details
  supplier: string; // e.g., "LEVITICAL"
  batchingPlant?: string;
  truckNumber?: string;
  batchTicketNumber?: string;
  deliveryNoteNumber?: string;
  cementType?: string; // e.g., "OPC Type I"
  admixtureType?: string;
  admixtureDosage?: string;
  aggregateSource?: string;
  maximumAggregateSize?: string;
  waterCementRatio?: number | string; // e.g., "0.40"
  concreteGrade: string; // e.g., "C30"
  mixDesignReference?: string;
  mixType?: string; // "Design Mix" | "Standard Mix"
  mixRatio?: string; // e.g., "1:2:4"
  exposureClass?: string;

  // Target Strengths (N/mm²)
  target28DayStrengthNmm2?: number; // Characteristic strength (e.g., 30)
  characteristicStrength?: string;
  targetStrength?: string;
  day1Required?: number;
  day3Required?: number;
  day7Required?: number; // e.g., 21 (70%)
  day14Required?: number; // e.g., 25.5 (85%)
  day28Required?: number; // e.g., 30 (100%)

  // Fresh Concrete Properties & Site Tests
  slumpMm?: number; // e.g., 120
  slumpResult?: string;
  slumpTestTime?: string;
  slumpClass?: string;
  concreteTempCelsius?: number;
  ambientTemperature?: string;
  concreteTemperature?: string;
  airContent?: string;
  density?: string | number;
  densityKgM3?: number;
  freshConcreteAccepted?: boolean;
  rejectionReason?: string;

  // Sampling & Casting Information
  castDate: string; // "YYYY-MM-DD"
  castTime: string; // "HH:mm"
  samplerName?: string;
  sampledBy?: string;
  witnessedBy?: string;
  samplingMethod?: string; // e.g., "BS EN 12350-1"
  sampleCondition?: string; // e.g., "Good"

  // Specimen Mold Details
  numCubes?: number;
  cubeCount?: number; // e.g., 6
  cubeSizeMm?: number | 100 | 150 | 200;
  cubeSize?: string; // e.g., "150x150x150mm"
  cubeType?: string; // e.g., "Standard"
  cubes?: IndividualCubeRecord[];

  // Curing Laboratory Details
  curingMethod?:
    | "Water Tank"
    | "Water Tank (20°C)"
    | "Curing Compound"
    | "Site Wet Burlap"
    | string;
  curingTank?: string;
  curingTankNumber?: string;
  curingStartDate?: string;
  curingTemperature?: string;
  removedFromTankDate?: string;

  // Scheduled Test Dates
  testAges?: TestAge[]; // e.g., [7, 28]
  day1Date?: string | null;
  day3Date?: string | null;
  day7Date?: string | null;
  day14Date?: string | null;
  day28Date?: string | null;

  // Laboratory & Testing Equipment Metadata
  testingLaboratory?: string; // e.g., "LSMTL"
  laboratoryAccreditationNumber?: string;
  testingMachine?: string;
  machineCalibrationCertificate?: string;

  // Test Results & Crush Summaries
  day1Results?: DayResultEntry[];
  day3Results?: DayResultEntry[];
  day7Results?: DayResultEntry[];
  day14Results?: DayResultEntry[];
  day28Results?: DayResultEntry[];
  tests?: {
    day1?: CubeCrushTestSummary;
    day3?: CubeCrushTestSummary;
    day7?: CubeCrushTestSummary;
    day14?: CubeCrushTestSummary;
    day28?: CubeCrushTestSummary;
    day56?: CubeCrushTestSummary;
  };

  // Status & Non-Conformance Tracking
  status: ConcreteStatus;
  overallStatus?: ConcreteStatus; // Duplicate field alias for compatibility
  ncrGenerated?: boolean;
  ncrNumber?: string;
  linkedNcrId?: string;
  ncrDetails?: ConcreteNCRLink; // Detailed NCR link metadata
  retestRequired?: boolean;

  // Approvals & Signatures
  preparedBy?: string;
  preparedByDate?: string;
  qaqcInspector?: string;
  reviewedBy?: string;
  reviewedByDate?: string;
  approvedBy?: string;
  approvedByDate?: string;
  approvedBySign?: string;
  remarks?: string;

  // Attachments & System Auditing
  attachments?: string[];
  createdBy?: string;
  createdAt: number | string;
  updatedAt?: number | string;

  // Legacy flat properties preserved for backwards compatibility
  lab?: string;
  strength7Days?: string;
  status7Days?: string;
  strength28Days?: string;
  status28Days?: string;
  expectedStrength?: string;
  result?: string;
  trade?: string;
  tradeId?: string;
  subtrade?: string;
  subtradeId?: string;
}

export type CubeSample = ConcreteCubeSample;
export type CubeTest = ConcreteCubeSample;

export interface SteelTestResults {
  tensileYield: number;
  tensileUltimate: number;
  elongation: number;
  reductionOfArea: number;
  bendAngle: string;
  bendCracks: boolean;
  bendResult: "PASS" | "FAIL";
  rebendResult: "PASS" | "FAIL";
  rebendRemarks: string;
  testedBy: string;
  testedDate: string;
  overallResult: "PASS" | "FAIL";
}

export interface SteelSample {
  id: string;
  sampleId?: string;
  testNumber: string;
  projectId: string;
  projectName?: string;
  companyId: string;
  createdBy?: string;
  createdAt: number | string;
  supplier: string;
  manufacturer?: string;
  millName?: string;
  heatNumber: string;
  batchNumber?: string;
  deliveryNote?: string;
  barType?: string;
  diameter?: string;
  barDiameterMm?: 8 | 10 | 12 | 16 | 20 | 25 | 32 | 40;
  grade?: string;
  steelGrade?: "Grade 500B" | "Grade 500C" | "Grade 460" | "Fe 500D" | string;
  quantityDelivered?: string;
  quantitySampled?: string;
  samplingDate?: string;
  sampleDate?: string;
  sampleTime?: string;
  testDate?: string;
  witnessedBy?: string;
  remarks?: string;
  qaqcInspector?: string;
  nominalAreaMm2?: number;
  yieldStrengthNmm2?: number;
  ultimateTensileStrengthNmm2?: number;
  yieldRatio?: number;
  elongationPercentage?: number;
  bendTestResult?: "PASS" | "FAIL";
  rebendTestResult?: "PASS" | "FAIL";
  overallStatus?: "PASS" | "FAIL" | string;
  status?:
    | "SAMPLED"
    | "LAB SENT"
    | "TESTING"
    | "RESULT RECEIVED"
    | "APPROVED"
    | "REJECTED"
    | string;
  testResults?: SteelTestResults | null;
  millCertAttachmentUrl?: string;
  labName?: string;
  testedBy?: string;
  attachments?: string[];
  trade?: string;
  tradeId?: string;
  subtrade?: string;
  subtradeId?: string;
  yieldStrength?: string;
  tensileStrength?: string;
  elongation?: string;
  result?: string;
  updatedAt?: number | string;
}

export type SteelRebarTest = SteelSample;
export type RebarTest = SteelSample;

// ─── BAR CUTTING SCHEDULE (QA/QC & BBS FABRICATION) ───
export interface BBSItem {
  id: string;
  member: string;
  elementId?: string;
  barMark: string;
  diameter: number;
  steelGrade?: string;
  noOfMembers: number;
  barsPerMember: number;
  totalBars: number;
  cutLengthM: number;
  shapeCode?: string;
  dimensions?: {
    a?: number;
    b?: number;
    c?: number;
    d?: number;
    e?: number;
    r?: number;
  };
  totalLengthM: number;
  unitWeightKgM?: number;
  totalWeightKg: number;
}

export interface CuttingPatternCut {
  bbsItemId?: string;
  barMark: string;
  member: string;
  cutLengthM: number;
  diameter?: number;
  steelGrade?: string;
}

export interface CuttingPattern {
  patternId: string;
  diameter?: number;
  steelGrade?: string;
  stockLengthM: number;
  cuts: CuttingPatternCut[];
  totalCutLengthM: number;
  offcutLengthM: number;
  isReusableOffcut: boolean;
  wastePercentage: number;
  stockBarQuantity: number;
}

export interface DiameterCuttingBreakdown {
  diameter: number;
  steelGrade?: string;
  totalCutsRequired: number;
  totalStockBarsUsed: number;
  totalCutWeightKg: number;
  totalStockWeightKg: number;
  totalScrapWeightKg: number;
  totalReusableOffcutWeightKg: number;
  scrapPercentage: number;
  isWithinLimit: boolean;
}

export interface BarCuttingSummary {
  totalBarsRequired: number;
  totalStockBarsUsed: number;
  totalCutWeightKg: number;
  totalStockWeightKg: number;
  totalScrapWeightKg: number;
  totalReusableOffcutWeightKg: number;
  scrapPercentage: number;
  contractualScrapLimit: number;
  isWithinLimit: boolean;
  diameterBreakdown?: Record<number, DiameterCuttingBreakdown>;
}

export interface BarCuttingQAVerification {
  cuttingToleranceChecked: boolean;
  endCutSquarenessChecked: boolean;
  couplerPrepVerified: boolean;
  inspectedBy?: string;
  inspectedAt?: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  remarks?: string;
}

export interface BarCuttingSchedule {
  id: string;
  scheduleNumber: string;
  title: string;
  projectId: string;
  companyId: string;
  levelId?: string;
  levelName?: string;
  elementIds?: string[];
  status: "DRAFT" | "OPTIMIZED" | "QA_APPROVED" | "IN_CUTTING" | "COMPLETED";
  diameterMm: number;
  diameters?: number[];
  steelGrade: string;
  stockBarLengthM: number;
  heatNumber?: string;
  millCertificateNumber?: string;
  supplier?: string;
  sourceBBSFileName?: string;
  bbsItems: BBSItem[];
  cuttingPatterns: CuttingPattern[];
  summary: BarCuttingSummary;
  qaVerification: BarCuttingQAVerification;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConcreteGradePreset {
  grade: string;
  strength: number;
  oneDayPct: number;
  threeDayPct: number;
  sevenDayPct: number;
  fourteenDayPct: number;
}

export type ConcreteGrade =
  | "C20/25"
  | "C25/30"
  | "C30/37"
  | "C35/45"
  | "C40/50"
  | "C50/60"
  | string;

export const CONCRETE_GRADES: ConcreteGradePreset[] = [
  {
    grade: "C15",
    strength: 15,
    oneDayPct: 0.15,
    threeDayPct: 0.4,
    sevenDayPct: 0.65,
    fourteenDayPct: 0.8,
  },
  {
    grade: "C20",
    strength: 20,
    oneDayPct: 0.15,
    threeDayPct: 0.4,
    sevenDayPct: 0.65,
    fourteenDayPct: 0.8,
  },
  {
    grade: "C25",
    strength: 25,
    oneDayPct: 0.2,
    threeDayPct: 0.45,
    sevenDayPct: 0.7,
    fourteenDayPct: 0.85,
  },
  {
    grade: "C30",
    strength: 30,
    oneDayPct: 0.2,
    threeDayPct: 0.45,
    sevenDayPct: 0.7,
    fourteenDayPct: 0.85,
  },
  {
    grade: "C35",
    strength: 35,
    oneDayPct: 0.2,
    threeDayPct: 0.45,
    sevenDayPct: 0.7,
    fourteenDayPct: 0.85,
  },
  {
    grade: "C40",
    strength: 40,
    oneDayPct: 0.25,
    threeDayPct: 0.5,
    sevenDayPct: 0.75,
    fourteenDayPct: 0.9,
  },
  {
    grade: "C45",
    strength: 45,
    oneDayPct: 0.25,
    threeDayPct: 0.5,
    sevenDayPct: 0.75,
    fourteenDayPct: 0.9,
  },
  {
    grade: "C50",
    strength: 50,
    oneDayPct: 0.25,
    threeDayPct: 0.5,
    sevenDayPct: 0.75,
    fourteenDayPct: 0.9,
  },
  {
    grade: "C60",
    strength: 60,
    oneDayPct: 0.3,
    threeDayPct: 0.55,
    sevenDayPct: 0.8,
    fourteenDayPct: 0.9,
  },
  {
    grade: "C15",
    strength: 15,
    oneDayPct: 0.15,
    threeDayPct: 0.4,
    sevenDayPct: 0.65,
    fourteenDayPct: 0.8,
  },
  {
    grade: "C20",
    strength: 20,
    oneDayPct: 0.15,
    threeDayPct: 0.4,
    sevenDayPct: 0.65,
    fourteenDayPct: 0.8,
  },
  {
    grade: "C25",
    strength: 25,
    oneDayPct: 0.2,
    threeDayPct: 0.45,
    sevenDayPct: 0.7,
    fourteenDayPct: 0.85,
  },
  {
    grade: "C30",
    strength: 30,
    oneDayPct: 0.2,
    threeDayPct: 0.45,
    sevenDayPct: 0.7,
    fourteenDayPct: 0.85,
  },
  {
    grade: "C35",
    strength: 35,
    oneDayPct: 0.2,
    threeDayPct: 0.45,
    sevenDayPct: 0.7,
    fourteenDayPct: 0.85,
  },
  {
    grade: "C40",
    strength: 40,
    oneDayPct: 0.25,
    threeDayPct: 0.5,
    sevenDayPct: 0.75,
    fourteenDayPct: 0.9,
  },
  {
    grade: "C45",
    strength: 45,
    oneDayPct: 0.25,
    threeDayPct: 0.5,
    sevenDayPct: 0.75,
    fourteenDayPct: 0.9,
  },
  {
    grade: "C50",
    strength: 50,
    oneDayPct: 0.25,
    threeDayPct: 0.5,
    sevenDayPct: 0.75,
    fourteenDayPct: 0.9,
  },
  {
    grade: "C60",
    strength: 60,
    oneDayPct: 0.3,
    threeDayPct: 0.55,
    sevenDayPct: 0.8,
    fourteenDayPct: 0.9,
  },
];

export const STRUCTURE_ELEMENTS = [
  "Foundation",
  "Pile Cap",
  "Ground Beam",
  "Column",
  "Shear Wall",
  "Retaining Wall",
  "Slab",
  "Staircase",
  "Mezzanine Beam",
  "Mezzanine Column",
  "Mezzanine Column Kicker",
  "Mezzanine Slab",
  "Roof Slab",
  "Lintel",
  "Ramp",
  "Water Tank",
  "Other",
  "Foundation",
  "Pile Cap",
  "Ground Beam",
  "Column",
  "Shear Wall",
  "Retaining Wall",
  "Slab",
  "Staircase",
  "Mezzanine Beam",
  "Mezzanine Column",
  "Mezzanine Column Kicker",
  "Mezzanine Slab",
  "Roof Slab",
  "Lintel",
  "Ramp",
  "Water Tank",
  "Other",
];

export const CUBE_SIZES = ["100x100x100mm", "150x150x150mm", "200x200x200mm"];
export const STANDARD_TEST_DAYS = [1, 3, 7, 14, 28];
export const FAILURE_MODES = [
  "Cone Failure",
  "Cone & Shear",
  "Shear Failure",
  "Columnar Failure",
  "Splitting Failure",
  "Unsatisfactory",
  "Other",
  "Cone Failure",
  "Cone & Shear",
  "Shear Failure",
  "Columnar Failure",
  "Splitting Failure",
  "Unsatisfactory",
  "Other",
];
export const CEMENT_TYPES = [
  "OPC Type I",
  "OPC Type II",
  "SRC Type V",
  "Limestone Blend",
  "GGBS Blend",
  "PFA Blend",
  "OPC Type I",
  "OPC Type II",
  "SRC Type V",
  "Limestone Blend",
  "GGBS Blend",
  "PFA Blend",
];

export const CURING_METHODS = [
  "Water Tank",
  "Water Sprinkler",
  "Wet Hessian",
  "Membrane Curing",
  "Steam Curing",
  "Air Curing",
  "Water Tank",
  "Water Sprinkler",
  "Wet Hessian",
  "Membrane Curing",
  "Steam Curing",
  "Air Curing",
];

export const WIZARD_STEPS = [
  { num: 1, label: "Identification" },
  { num: 2, label: "Location" },
  { num: 3, label: "Production Data" },
  { num: 4, label: "Mix Info" },
  { num: 5, label: "Fresh Tests" },
  { num: 6, label: "Sampling" },
  { num: 7, label: "Cubes" },
  { num: 8, label: "Curing" },
  { num: 9, label: "Test Schedule" },
  { num: 10, label: "Laboratory" },
  { num: 11, label: "Signatures" },
  { num: 1, label: "Identification" },
  { num: 2, label: "Location" },
  { num: 3, label: "Production Data" },
  { num: 4, label: "Mix Info" },
  { num: 5, label: "Fresh Tests" },
  { num: 6, label: "Sampling" },
  { num: 7, label: "Cubes" },
  { num: 8, label: "Curing" },
  { num: 9, label: "Test Schedule" },
  { num: 10, label: "Laboratory" },
  { num: 11, label: "Signatures" },
];

// ─── RFI (REQUEST FOR INFORMATION) ───
export type RFIStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "RESPONDED"
  | "CLOSED"
  | "REJECTED";

export type RFIPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "URGENT";

export type RFICategory =
  | "Structural"
  | "Architectural"
  | "MEP"
  | "Civil"
  | "Drawing Ambiguity"
  | "Specification Clarification"
  | "Other";

export type RFIApprovalStatus =
  | "APPROVED"
  | "APPROVED_AS_NOTED"
  | "REVISE_RESUBMIT"
  | "REJECTED";

export interface RFIResponse {
  respondedBy?: string;
  respondedByName?: string;
  responderName?: string;
  responderRole?: string;
  responseDate: number | string;
  responseText: string;
  status?: RFIApprovalStatus;
  approvalStatus?: RFIApprovalStatus;
  attachments?: string[];
  attachedSketches?: string[];
}

export interface RequestForInformation {
  id: string;
  rfiNumber: string; // e.g. "RFI-2026-001" or "RFI_4829_03092026"
  projectId: string;
  projectName?: string;
  companyId: string;
  companyName?: string;
  title: string;
  category?: RFICategory;
  discipline?: string;
  priority: RFIPriority;
  status: RFIStatus;

  // Reference information
  drawingReference?: string;
  drawingNumber?: string;
  specReference?: string;
  specificationRef?: string;
  elementId?: string;
  structuralElementId?: string;
  elementName?: string;
  elementType?: string;
  locationLevel?: string;
  levelId?: string;
  levelName?: string;
  gridLine?: string;
  trade?: string;
  tradeId?: string;
  tradeName?: string;
  subtradeName?: string;

  // Technical Query
  question: string;
  proposedSolution?: string;

  // Impact Assessment
  hasCostImpact?: boolean;
  costImpact?: boolean;
  costImpactEstimate?: number | string;
  hasScheduleImpact?: boolean;
  scheduleImpact?: boolean;
  scheduleDelayDays?: number;
  scheduleImpactDays?: number;
  impactNotes?: string;

  // Consultant Submittal Info
  assignedConsultant?: string;
  assignedConsultantName?: string;
  assignedConsultantEmail?: string;
  requestedDueDate?: string;

  // Submittal Metadata
  raisedBy: {
    uid: string;
    name: string;
    role: string;
    date: string;
  };
  raisedByName?: string;
  submittedAt?: number | null;

  // Formal Consultant Response
  response?: {
    responderName: string;
    responderRole: string;
    responseDate: string;
    responseText: string;
    approvalStatus: RFIApprovalStatus;
    attachedSketches?: string[];
  } | null;

  // Media / Attachments
  attachments: string[];

  // History & Timestamps
  statusHistory?: StatusHistoryEntry[];
  createdAt: number | string;
  updatedAt?: number | string;
  closedAt?: number | string | null;
}

export type RFI = RequestForInformation;

// ─── MAR (MATERIAL APPROVAL REQUEST & SUBMITTALS) ───
export type MARStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "APPROVED_AS_NOTED"
  | "REVISE_RESUBMIT"
  | "REJECTED";

export type MARApprovalCode = "CODE_A" | "CODE_B" | "CODE_C" | "CODE_D";
export type SubmittalReviewCode = "Code A" | "Code B" | "Code C" | "Code D";

export type MARCategory =
  | "Material Approval Request (MAR)"
  | "Technical Data Sheet (TDS)"
  | "Technical Data Sheet"
  | "Mill Certificate"
  | "Method Statement"
  | "Material Sample"
  | "Shop Drawing"
  | "Test Certificate"
  | "Test Report";

export type SubmittalCategory = MARCategory;

export interface MARResponse {
  respondedBy?: string;
  respondedByName?: string;
  responseDate: number | string;
  responseText: string;
  approvalCode?: MARApprovalCode;
  attachments?: string[];
}

export interface MaterialApprovalRequest {
  id: string;
  marNumber: string; // e.g. "MAR-2026-001" or "MAR_4829_03092026"
  projectId: string;
  projectName?: string;
  companyId: string;
  companyName?: string;
  title: string;
  category: MARCategory;
  tradeName?: string;
  status: MARStatus;
  approvalCode?: MARApprovalCode | null;
  reviewCode?: SubmittalReviewCode;

  // Technical Specifications & Vendor References
  specSection?: string;
  specificationRef?: string;
  drawingNumber?: string;
  trade?: string;
  subtrade?: string;
  supplierVendor: string;
  manufacturer?: string;

  // Submittal Details
  technicalDescription?: string;
  description?: string;
  sampleSubmitted: boolean;
  sampleDetails?: string;

  // Target Consultant & Due Dates
  assignedConsultantName?: string;
  assignedConsultantEmail?: string;
  requestedDueDate?: string;

  // Review & Comments
  reviewComments?: string;
  reviewedBy?: {
    name: string;
    role: string;
    date: string;
    signatureUrl?: string;
  };

  // Submittal Metadata
  submittedBy?: string;
  submittedByName?: string;
  submittedAt?: number | null;

  // Formal Consultant Review Response
  response?: MARResponse | null;

  // Attachments
  attachments: string[];

  // History & Audit Timestamps
  statusHistory?: StatusHistoryEntry[];
  createdAt: number | string;
  updatedAt?: number | string;
  closedAt?: number | string | null;
}

export type MAR = MaterialApprovalRequest;

// ─── SITE COMMENTS & OBSERVATIONS ───
export interface TradeSelection {
  tradeId: string;
  tradeName: string;
  subtradeId?: string;
  subtradeName?: string;
}

export interface LevelElementSelection {
  levelId: string;
  levelName: string;
  elementId?: string;
  structuralElementId?: string;
  elementName?: string;
  elementType?: string;
}

export interface ObservationPhoto {
  id?: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  timestamp?: number;
  uploadedAt?: number;
}

export interface ObservationRow {
  id: string;
  location: LevelElementSelection;
  gridLocation: string;
  structuralElement: string;
  levelName: string;
  fieldObservation: string;
  correctiveDirective: string;
  discipline: string;
  tradeSelection: TradeSelection;
  status:
    | "Compliant"
    | "Non-Compliant"
    | "Observation / Note"
    | "Rectified on Site"
    | string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  assignedTo: string;
  dueDate: string;
  photos: ObservationPhoto[];
}

export type ObservationSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ObservationStatus = "OPEN" | "IN_PROGRESS" | "RECTIFIED" | "CLOSED";

export interface ObservationItem {
  id?: string;
  observationNumber?: number;
  levelId?: string;
  levelName?: string;
  gridLocation?: string;
  elementId?: string;
  structuralElementId?: string;
  elementName?: string;
  elementType?: string;
  structuralElement?: string;
  tradeId?: string;
  tradeName?: string;
  trade?: string;
  subtradeId?: string;
  subtradeName?: string;
  subtrade?: string;
  severity?: ObservationSeverity | string;
  observationText?: string;
  comments?: string;
  fieldObservation?: string;
  correctiveDirective?: string;
  status?:
    | ObservationStatus
    | "Compliant"
    | "Non-Compliant"
    | "Observation / Note"
    | "Rectified on Site"
    | string;
  assignedSubcontractor?: string;
  assignedTo?: string;
  photos?: (string | ObservationPhoto)[];
  photoThumbnails?: string[];
  dueDate?: string;
  rectifiedDate?: string;
  escalatedToNcrId?: string;
}

export interface SiteCommentSignOff {
  contractorRepName?: string;
  contractorSignDate?: string;
  contractorSigned?: boolean;
  qaEngineerName?: string;
  qaSignDate?: string;
  qaSigned?: boolean;
}

export interface SiteCommentReport {
  id: string;
  projectId: string;
  companyId: string;
  reportNumber: string; // "QC/COM/2026/001" or "QC/COMMENTS/2026/6851"
  title?: string;
  projectName?: string;
  companyName?: string;
  inspectionDate: string;
  inspectionTime?: string;
  inspectorRole?: string;
  weatherConditions?: string;
  locationDescription?: string;
  observations: ObservationItem[];
  raisedBy?:
    | string
    | {
        uid?: string;
        name?: string;
        role?: string;
        signatureUrl?: string;
      };
  raisedByName?: string;
  signOff?: SiteCommentSignOff;
  acknowledgedBy?: {
    name?: string;
    subcontractorCompany?: string;
    signatureUrl?: string;
    signedAt?: string;
  };
  status?: "DRAFT" | "ISSUED" | "RECTIFIED" | "CLOSED" | "OPEN" | string;
  createdAt?: string | number;
  updatedAt?: string | number;
  updatedBy?: string;
  updatedByName?: string;
}

// ─── WEEKLY REPORT ───
export interface PreparedBy {
  uid?: string;
  email?: string;
  name: string;
  designation?: string;
  role?: string;
  signed?: boolean;
  signedAt?: string;
}

export interface QuantitySummary {
  completion: string;
  element: string;
  scope: string;
  calculatedVolume?: number;
  achievedVolume?: number;
  total?: number;
  percentageTotal?: number;
}

export interface PictorialUrls {
  caption: string;
  url: string;
}

export interface NcrRemediationLog {
  assignedTo: string;
  dateIdentified: string;
  description: string;
  elementLevel: string;
  refNo: string;
  riskLevel: string;
  status: string;
  targetFixDate: string;
}

export interface WeeklyReport {
  id: string;
  reportNumber: string; // "WQR-2026-W36"
  weekNumber?: number;
  year?: number;
  weekStart?: string; // YYYY-MM-DD
  weekEnd?: string;
  startDate?: string;
  endDate?: string;
  title?: string;
  executiveSummary: string;
  coverImageBase64?: string;
  coverImageUrl?: string;
  logoBase64?: string;
  selectedLevelId?: string;
  selectedLevel?: string;
  selectedLevelName?: string;
  inspectionStats?: {
    total: number;
    passed: number;
    failed: number;
    pending: number;
  };
  metrics?: {
    inspectionsConducted: number;
    inspectionPassRate: number;
    openNcrs: number;
    closedNcrsThisWeek: number;
    cubeTestsExecuted?: number;
    cubeTestComplianceRate: number;
    totalConcretePouredM3: number;
    siteCommentsLogged?: number;
  };
  pictorialUrls?: PictorialUrls[] | Array<{ url: string; caption: string }>;
  ncr?: NCR[];
  ncrStats?: { opened: number; closed: number; openTotal: number };
  findingStats?: { opened: number; closed: number; openTotal: number };
  highlights?: string;
  concerns?: string;
  nextWeekPlan?: string;
  keyAchievements?: string[];
  topObservations?: {
    title: string;
    trade: string;
    severity: string;
    status: string;
  }[];
  nextWeekQualityPlan?: string[];
  preparedBy:
    | PreparedBy
    | string
    | {
        uid?: string;
        name: string;
        email?: string;
        designation?: string;
        role?: string;
        signed?: boolean;
        signedAt?: string;
      };
  preparedByName?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: number;
  status: "DRAFT" | "PUBLISHED" | "APPROVED" | "UNDER REVIEW" | string;
  attachedPhotos?: string[];
  photoGalleryUrls?: string[];
  projectId: string;
  projectName?: string;
  templateId?: string;
  overallQualityCompliance?: number | string;
  remediationSummaryText?: string;
  cubeTests?: ConcreteCubeSample[] | any[];
  quantitySummary?: QuantitySummary[] | any[];
  castingStatusList?: string[] | any[];
  materialDeliveries?: MaterialDelivery[] | any[];
  totalVolumeCalculated?: number | string;
  overallQuantityCompletion?: number | string;
  ncrRemediationLog?: NcrRemediationLog[] | any[];
  mepClearance?: any[];
  siteComments?: any[];
  siteInstructions?: any[];
  structuralElements?: any[];
  filteredNcrs?: any[];
  filteredInspections?: any[];
  filteredFindings?: any[];
  filteredMaterialDeliveries?: any[];
  filteredCubeTests?: any[];
  filteredSiteComments?: any[];
  filteredSiteInstructions?: any[];
  includeNcrsAndComments?: boolean;
  includeSiteInstructions?: boolean;
  printOrientation?: "portrait" | "landscape";
  companyId: string;
  companyName?: string;
  synopsis?: string;
  milestones?: string;
  beamLayoutImg?: string;
  columnLayoutImg?: string;
  slabImg?: string;
  createdAt: number | string;
  updatedAt?: number | string;
  [key: string]: any;
}

// ─── FINDINGS & SNAGS ───
export type FindingStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "CORRECTED"
  | "VERIFIED"
  | "CLOSED";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface FindingComment {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
}

export interface Finding {
  id: string;
  findingNumber: string;
  title: string;
  description: string;
  category: string;
  trade: string;
  tradeId?: string;
  subtrade?: string;
  subtradeId?: string;
  building: string;
  floor: string;
  zone: string;
  location: string;
  severity: Severity;
  status: FindingStatus;
  raisedBy: string;
  raisedByName: string;
  assignedTo: string;
  assignedToName: string;
  contractor: string;
  deadline: string;
  attachments: string[];
  beforePhotos: string[];
  afterPhotos: string[];
  comments?: FindingComment[];
  projectId: string;
  projectName: string;
  companyId: string;
  closedAt: number | null;
  statusHistory: StatusHistoryEntry[];
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export type SnagStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "READY_FOR_INSPECTION"
  | "CLOSED"
  | "REJECTED";

export interface SnagItem {
  id: string;
  snagNumber: string;
  title: string;
  description: string;
  trade: string;
  tradeId?: string;
  subtrade?: string;
  subtradeId?: string;
  building: string;
  floor: string;
  room: string;
  location: string;
  level: string;
  severity: Severity;
  status: SnagStatus;
  dateFound: string;
  contractor: string;
  assignedTo: string;
  assignedToName: string;
  deadline: string;
  photos: string[];
  closureEvidence: string[];
  contractorRemarks: string;
  projectId: string;
  projectName: string;
  companyId: string;
  closedAt: number | null;
  statusHistory: StatusHistoryEntry[];
  createdBy: string;
  createdByName: string;
  createdAt: number;
  updatedAt: number;
}

// ─── DOCUMENTS & PHOTO ALBUMS ───
export type DocStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SUPERSEDED";

export type DocCategory =
  | "DRAWING"
  | "METHOD_STATEMENT"
  | "SPECIFICATION"
  | "REPORT"
  | "CERTIFICATE"
  | "ITP"
  | "Method Statement"
  | "Structural Drawing"
  | "Architectural Drawing"
  | "Calibration Certificate"
  | "OTHER"
  | string;

export interface ProjectDocument {
  id: string;
  documentNumber?: string;
  docNumber?: string;
  title: string;
  description?: string;
  category: DocCategory;
  discipline: string;
  revision: string;
  status: DocStatus;
  fileUrl: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileSizeMb?: number;
  thumbnailUrl?: string;
  tags?: string[];
  remarks?: string;
  uploadDate?: string;
  previousVersions?: {
    revision: string;
    url: string;
    uploadedAt: number | string;
    uploadedBy: string;
  }[];
  uploadedBy: string;
  uploadedByName?: string;
  projectId: string;
  projectName?: string;
  companyId: string;
  createdAt: number | string;
  updatedAt?: number | string;
}

export type DocumentRecord = ProjectDocument;

export interface PhotoAlbum {
  id: string;
  name: string;
  description: string;
  coverPhoto: string;
  photoCount: number;
  building: string;
  floor: string;
  projectId: string;
  companyId: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export type PhotoCategory =
  | "PROGRESS"
  | "QUALITY_DEFECT"
  | "SAFETY"
  | "MATERIAL"
  | "POUR";

export interface SitePhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption: string;
  building?: string;
  floor?: string;
  location?: string;
  floorLevel?: string;
  levelId?: string;
  levelName?: string;
  elementId?: string;
  elementName?: string;
  category: PhotoCategory;
  tradeId?: string;
  tradeName?: string;
  subtradeId?: string;
  subtradeName?: string;
  takenAt?: number;
  uploadedBy: string;
  uploadedByName?: string;
  uploaderRole?: string;
  uploadedAt: string | number;
  albumId?: string;
  projectId: string;
  companyId: string;
  linkedFindingId?: string;
  linkedNcrId?: string;
  beforeAfterPairId?: string;
  sourceModule?:
    | "SiteComments"
    | "NCR"
    | "Inspections"
    | "PermitToPour"
    | "Concrete"
    | "Deliveries"
    | "MAR"
    | "MIR"
    | "RFI"
    | "Steel"
    | "Documents"
    | "WeeklyReport"
    | "DirectUpload"
    | string;
  sourceId?: string;
  markupData?: string;
  createdAt?: number | string;
}

// ─── CALENDAR & PLANNER EVENTS ───
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  eventType:
    | "INSPECTION"
    | "CUBE_TEST"
    | "CASTING"
    | "MEETING"
    | "MILESTONE"
    | "HOLD_POINT"
    | "SNAG_DEADLINE"
    | "NCR_DEADLINE"
    | "RFI_DEADLINE"
    | "SUBMITTAL_DEADLINE"
    | "PERMIT_TO_POUR"
    | "CUSTOM";
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "CANCELLED";
  assignedTo?: string;
  location?: string;
  trade?: string;
  relatedId?: string;
  relatedModule?: string;
  createdBy: string;
  createdAt: number | string;
  updatedAt?: string | number;
  companyId?: string;
  projectId: string;
}

export type EventType = CalendarEvent["eventType"];
export type EventStatus = CalendarEvent["status"];
export type ViewMode = "month" | "week" | "day" | "gantt" | "list";

export interface EventConfig {
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
}

export interface StatusConfig {
  label: string;
  dot: string;
  bg: string;
  text: string;
}

export interface CalendarCell {
  date: string;
  inMonth: boolean;
  isToday: boolean;
}

export interface EventStats {
  today: number;
  upcoming: number;
  overdue: number;
  completed: number;
}

export interface ConnectionState {
  connected: boolean;
  lastUpdate: number | null;
  error: string | null;
}

export type PlannerEventType =
  | "INSPECTION"
  | "NCR_DEADLINE"
  | "CONCRETE_POUR"
  | "RFI_DUE"
  | "MAR_DUE"
  | "SITE_COMMENT_DUE"
  | "CUBE_TEST_DUE"
  | "DELIVERY"
  | "MILESTONE"
  | "TASK"
  | "TOOLBOX_TALK"
  | "AUDIT"
  | "CUSTOM_REMINDER"
  | string;

export interface PlannerEvent {
  id: string;
  projectId: string;
  companyId?: string;
  title: string;
  description?: string;
  eventType: PlannerEventType;
  date: string;
  eventKey?: string;
  startDate?: string;
  endDate?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  status:
    | "PENDING"
    | "COMPLETED"
    | "OVERDUE"
    | "CANCELLED"
    | "IN_PROGRESS"
    | "REJECTED"
    | "SCHEDULED"
    | string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  referenceId?: string;
  referenceUrl?: string;
  assignedTo?: string;
  assigneeUid?: string;
  assigneeName?: string;
  notes?: string;
  levelId?: string;
  levelName?: string;
  elementId?: string;
  structuralElementId?: string;
  elementName?: string;
  elementType?: string;
  tradeId?: string;
  tradeName?: string;
  subtradeName?: string;
  linkedRecordType?: string;
  linkedRecordId?: string;
  isQualityHoldPoint?: boolean;
  createdBy?: string;
  reminderMinutes?: number;
  isAssistantPinned?: boolean;
  concreteGrade?: string;
  volumeM3?: number;
  sampleId?: string;
  ncrNumber?: string;
  ptpNumber?: string;
  inspectionNumber?: string;
  rfiNumber?: string;
  createdAt?: number | string;
  updatedAt?: number | string;
}

// ─── TRADES, AUDIT, NOTIFICATIONS & CALCULATOR ───
export type MasterDataStatus = "Active" | "Archived";

export interface Trade {
  id: string;
  companyId: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  icon?: string;
  status: MasterDataStatus;
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
  usageCount?: number;
}

export interface Subtrade {
  id: string;
  tradeId: string;
  companyId: string;
  name: string;
  code: string;
  description?: string;
  status: MasterDataStatus;
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
  usageCount?: number;
}

export interface MasterTrade {
  id: string;
  companyId: string;
  name: string;
  codePrefix: string;
  colorHex: string;
  icon?: string;
  description?: string;
  status?: string;
  subtrades: string[];
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface StatusHistoryEntry {
  from?: string;
  to?: string;
  status?: string;
  userId?: string;
  userName?: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedByRole?: string;
  updatedByDesignation?: string;
  comment: string;
  timestamp: number;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  targetUserId: string;
  companyId: string;
  projectId: string;
  link: string;
  read: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: number;
}

export interface AuditLog {
  id: string;
  targetId?: string;
  userId: string;
  userName: string;
  userRole?: string;
  action: string;
  module:
    | "SiteComments"
    | "NCR"
    | "RFI"
    | "Submittals"
    | "Inspections"
    | "PermitToPour"
    | "Concrete"
    | "Steel"
    | "Deliveries"
    | "Planner"
    | "Documents"
    | "Settings"
    | "Auth"
    | string;
  details: string;
  previousValue?: string | any;
  newValue?: string | any;
  companyId: string;
  projectId?: string;
  timestamp: number | string;
}

export interface CalculatorEntry {
  id: string;
  projectId: string;
  companyId?: string;
  type?: string;
  title?: string;
  calcType?:
    | "AREA"
    | "VOLUME"
    | "CONCRETE_VOLUME"
    | "MIX_RATIO"
    | "BLOCK"
    | "TILE"
    | "PAINT"
    | "REBAR_WEIGHT"
    | "UNIT_CONVERTER"
    | "MIX_DESIGN"
    | string;
  inputs: Record<string, any>;
  result: Record<string, any> | string;
  unit?: string;
  notes?: string;
  userId?: string;
  userName?: string;
  calculatedBy?: string;
  createdAt?: number;
  timestamp?: string;
}

// ─── MATERIAL INSPECTION REPORT (MIR) ───
export type MIRStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "INSPECTED"
  | "ACCEPTED"
  | "ACCEPTED_AS_NOTED"
  | "REJECTED"
  | "QUARANTINED";

export type MIRInspectionDisposition =
  | "ACCEPTED"
  | "ACCEPTED_AS_NOTED"
  | "REJECTED"
  | "HOLD_FOR_TESTING";

export type MaterialDiscipline =
  | "Civil & Structural"
  | "Architectural"
  | "MEP - Electrical"
  | "MEP - Mechanical"
  | "Plumbing & Drainage"
  | "Geotechnical"
  | "General";

export interface MIRItem {
  id: string;
  description: string;
  specificationRef?: string;
  quantityDelivered: number;
  quantityInspected: number;
  quantityAccepted: number;
  quantityRejected: number;
  unit: string; // e.g. "tons", "bags", "m3", "bundles", "pcs", "meters"
  remarks?: string;
}

export interface MaterialInspectionReport {
  id: string;
  mirNumber: string; // e.g. "MIR-2026-001"
  projectId: string;
  projectName?: string;
  companyId: string;
  companyName?: string;
  title: string;
  discipline: MaterialDiscipline;
  status: MIRStatus;
  disposition?: MIRInspectionDisposition;

  // Cross References
  marId?: string;
  marNumber?: string; // Links to approved Material Approval Request
  deliveryId?: string;
  deliveryNumber?: string; // Links to Gate Delivery log
  poNumber?: string; // Purchase Order
  supplierVendor: string;
  manufacturer?: string;
  deliveryDate: string;
  inspectionDate: string;
  storageLocation?: string; // Laydown Yard A, Warehouse 2, Rebar Compound, etc.

  // Verification Checkpoints
  packagingCondition: "SATISFACTORY" | "DAMAGED" | "COMPROMISED";
  millCertificateProvided: boolean;
  physicalDimensionsCheck: "PASS" | "FAIL" | "NOT_APPLICABLE";
  samplingRequired: boolean;
  sampleTagNumber?: string;
  quarantineActionTaken?: boolean;

  // Line Items
  items: MIRItem[];

  // Observations & Defect Notes
  inspectionNotes?: string;
  rejectionReasons?: string;
  actionRequired?: string;

  // Photos & Attachments
  photos?: string[];
  attachments?: string[];

  // Sign-offs
  inspectedBy?: {
    name: string;
    role: string;
    date: string;
    signatureUrl?: string;
  };
  contractorSignOff?: {
    name: string;
    company: string;
    date: string;
    signed: boolean;
  };
  consultantSignOff?: {
    name: string;
    firm: string;
    date: string;
    verdict: MIRInspectionDisposition;
    comments?: string;
    signed: boolean;
  };
  qaqcSignOff?: {
    name: string;
    designation: string;
    company?: string;
    date: string;
    verdict: MIRInspectionDisposition;
    comments?: string;
    signed: boolean;
  };
  stakeholders?: StakeholderSignoff[];

  // Metadata
  createdAt: number | string;
  updatedAt?: number | string;
  createdBy?: string;
}

// ─── DAILY SITE LOG (SITE DIARY - MULTI-SPHERE) ───
export type DailySiteLogStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";

export type DailyShift = "DAY" | "NIGHT" | "DOUBLE_SHIFT" | "OVERTIME";

export type DailyWeatherCondition =
  | "SUNNY"
  | "CLEAR"
  | "OVERCAST"
  | "RAIN"
  | "HEAVY_RAIN"
  | "STORMY"
  | "EXTREME_HEAT"
  | "WINDY";

export type EquipmentStatus =
  | "OPERATIONAL"
  | "STANDBY"
  | "BREAKDOWN"
  | "MAINTENANCE";

export type DelayCategory =
  | "WEATHER"
  | "MATERIAL"
  | "DESIGN_RFI"
  | "SUB_CONTRACTOR"
  | "INSPECTION_HOLD"
  | "SAFETY"
  | "EQUIPMENT"
  | "OTHER";

export type HousekeepingRating = "EXCELLENT" | "GOOD" | "SATISFACTORY" | "POOR";

export interface DailyGeneralConditions {
  date: string; // YYYY-MM-DD
  shift: DailyShift;
  weather: DailyWeatherCondition;
  tempMin?: number; // Celsius
  tempMax?: number; // Celsius
  humidity?: number; // %
  groundConditions?: string; // Dry, Damp, Muddy, Flooded
  workHoursStart: string; // e.g. "07:00"
  workHoursEnd: string; // e.g. "17:00"
  totalHours: number;
  siteStatusNotes?: string;
}

export interface DailyWorkActivity {
  id: string;
  levelId?: string;
  levelName?: string;
  elementId?: string;
  elementName?: string;
  gridlineRef?: string;
  trade: string;
  tradeId?: string;
  subcontractor?: string;
  description: string;
  progressPercentage?: number; // 0 - 100
  quantityDone?: string; // e.g. "45 m2", "120 linear meters"
  unit?: string;
  status: "IN_PROGRESS" | "COMPLETED" | "DELAYED" | "ON_HOLD";
  delayNotes?: string;
}

export interface DailyManpowerEntry {
  id: string;
  tradeName: string;
  tradeCategory?: string; // "Civil", "Structural", "MEP", "Finishes", "General"
  companyOrSubcontractor?: string;
  headCount: number;
  hoursWorked: number;
  totalManHours: number;
  notes?: string;
}

export interface DailyEquipmentEntry {
  id: string;
  equipmentType: string;
  plantNumber?: string;
  quantity: number;
  status: EquipmentStatus;
  hoursUsed: number;
  operatorName?: string;
  location?: string;
  notes?: string;
}

export interface DailyDelayEntry {
  id: string;
  category: DelayCategory;
  location?: string;
  trade?: string;
  impactHours: number;
  description: string;
  remedialAction?: string;
}

export interface DailyQualityInspectionItem {
  id: string;
  refNo?: string;
  inspectionType: string;
  levelName?: string;
  elementName?: string;
  trade?: string;
  result: "PASSED" | "PASSED_AS_NOTED" | "REJECTED" | "PENDING";
  inspectorName?: string;
  notes?: string;
}

export interface DailyQualityEntry {
  inspections: DailyQualityInspectionItem[];
  ncrsRaised?: string[];
  ncrsClosed?: string[];
  siteInstructionsReferenced?: string[];
  qualityNotes?: string;
}

export interface DailyDeliveryItem {
  id: string;
  description: string;
  supplier: string;
  ticketNumber?: string;
  quantity: string;
  quantityAccepted?: number | string;
  quantityRejected?: number | string;
  unit: string;
  timeReceived?: string;
  status:
    | "ACCEPTED"
    | "APPROVED"
    | "APPROVED_AS_NOTED"
    | "APPROVED AS NOTED"
    | "PARTIALLY_ACCEPTED"
    | "PARTIALLY ACCEPTED"
    | "REJECTED"
    | "HOLD_FOR_TESTING"
    | string;
  rejectionReason?: string;
  ncrNumber?: string;
  mirRef?: string;
  notes?: string;
}

export interface DailyConcretePourItem {
  id: string;
  elementName: string;
  levelName?: string;
  concreteGrade: string;
  supplier?: string;
  truckCount?: number;
  volumePoured: number;
  slumpMm?: number;
  cubeSampleNumber?: string;
  ptpRef?: string;
  status: "COMPLETED" | "IN_PROGRESS" | "INTERRUPTED";
}

export interface DailyMaterialEntry {
  deliveries: DailyDeliveryItem[];
  concretePours: DailyConcretePourItem[];
  labTestingNotes?: string;
}

export interface DailyHsePermit {
  id: string;
  permitType: string;
  location: string;
  approvedBy: string;
  validUntil?: string;
}

export interface DailyHseEntry {
  toolboxTalkTopic?: string;
  toolboxTalkAttendees?: number;
  permitsToWork: DailyHsePermit[];
  incidentsReported: number;
  incidentDetails?: string;
  nearMissesReported?: number;
  housekeepingRating: HousekeepingRating;
  safetyObservations?: string;
}

export interface DailyConsultantEntry {
  visitorName?: string;
  organization?: string;
  siteWalkTime?: string;
  observations?: string;
  directivesIssued?: string;
  approvalNotes?: string;
}

export interface DailySignOffEntry {
  role:
    | "SITE_ENGINEER"
    | "QAQC_ENGINEER"
    | "SAFETY_OFFICER"
    | "CONSULTANT"
    | "PROJECT_MANAGER";
  signed: boolean;
  signedBy?: {
    uid: string;
    name: string;
    designation: string;
    signatureUrl?: string;
    timestamp: string | number;
    digitalStamp?: string;
    declaration?: string;
  };
}

export interface DailySiteLogPhoto {
  id: string;
  url: string;
  caption: string;
  tradeTag?: string;
  location?: string;
  uploadedBy?: string;
  timestamp: string | number;
}

export interface DailySiteLog {
  id: string;
  logNumber: string; // e.g. "DSL-PRJ-2026-09-16-001"
  projectId: string;
  projectName?: string;
  projectCode?: string;
  companyId: string;
  companyName?: string;
  status: DailySiteLogStatus;

  // Spheres
  generalConditions: DailyGeneralConditions;
  activities: DailyWorkActivity[];
  manpower: DailyManpowerEntry[];
  equipment: DailyEquipmentEntry[];
  delays: DailyDelayEntry[];
  quality: DailyQualityEntry;
  materials: DailyMaterialEntry;
  hse: DailyHseEntry;
  consultant: DailyConsultantEntry;
  signOffs: Record<string, DailySignOffEntry>;
  photos: DailySiteLogPhoto[];

  // Metadata
  createdBy: string;
  createdByName?: string;
  createdByRole?: UserRole;
  createdAt: number | string;
  updatedAt?: number | string;
}

// ─── INSPECTION & TEST PLAN (ITP) MATRIX ───
export type ITPControlGate = "H" | "W" | "R" | "S" | "-";
export type ITPStatus = "DRAFT" | "UNDER_REVIEW" | "APPROVED" | "SUPERSEDED";

export interface ITPItem {
  id: string;
  itemNo: string; // e.g. "1.1", "1.2", "2.1"
  activityStage: string; // e.g. "1. Block Quality", "7. Hardened Concrete Testing"
  itemParameter: string; // e.g. "Sandcrete / Masonry compressive strength"
  referenceStandard: string; // e.g. "BS 6073 / NIS 87", "BS EN 12390 / ASTM C39"
  acceptanceCriteria: string; // e.g. "Min. 5 blocks tested per batch of 5,000; meets specified strength"
  controlGate: ITPControlGate; // "H" | "W" | "R" | "S"
  responsibleParty: string; // e.g. "Testing Lab, QA/QC Engineer", "QA/QC Inspector", "Client Consultant"
  frequency?: string; // e.g. "Min 5 blocks per 5,000 batch", "Every concrete truck load"
  verifiableRecord?: string; // e.g. "WIR / RFI", "Permit to Pour (PTP)", "Cube Test Report"
  subcontractorGate?: ITPControlGate;
  contractorQaGate?: ITPControlGate;
  consultantGate?: ITPControlGate;
  thirdPartyGate?: ITPControlGate;
  linkedRfiId?: string;
  linkedRfiNumber?: string;
  isCompleted?: boolean;
  remarks?: string;
}

export interface ITPPlan {
  id: string;
  itpNumber: string; // e.g. "CD-ITP-MAS-002" or "ITP-CIV-001"
  title: string; // e.g. "ITP for Masonry & Finishes"
  discipline: string; // "Concrete & Masonry", "Civil/Structural", "Geotechnical", "MEP", "Finishes"
  docCode?: string; // e.g. "CD-QP-001" (Company Quality Plan reference)
  methodStatementRef?: string; // e.g. "MS-MAS-003"
  methodStatementTitle?: string;
  specSection?: string; // e.g. "Section 04200 - Unit Masonry"
  revision: string; // "Rev 01"
  status: ITPStatus;
  projectId: string;
  projectName?: string;
  companyId: string;
  companyName?: string;
  officeAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  items: ITPItem[];
  preparedBy: string;
  preparedByTitle?: string;
  preparedByDate?: string;
  checkedBy?: string;
  checkedByTitle?: string;
  checkedByDate?: string;
  approvedBy?: string;
  approvedByTitle?: string;
  approvedByDate?: string;
  createdAt: number | string;
  updatedAt: number | string;
}

// ─── TEAM CHAT & GROUP COLLABORATION SYSTEM ───
export type ChatChannelType =
  | "DIRECT"
  | "GROUP"
  | "PROJECT_GENERAL"
  | "TRADE"
  | "TOPIC"
  | "QAQC_ALERTS";

export interface ChatMember {
  uid: string;
  name: string;
  role?: string;
  title?: string;
  designation?: string;
  email?: string;
  avatarUrl?: string;
  joinedAt?: number | string;
  lastReadAt?: number | string;
  isAdmin?: boolean;
}

export interface ChatAttachment {
  id: string;
  name: string;
  url: string;
  type: "image" | "document" | "pdf" | "audio" | "other";
  size?: number;
  duration?: number; // audio duration in seconds
}

export interface ChatGroupPermissions {
  onlyAdminsCanSendMessages?: boolean;
  onlyAdminsCanEditGroupInfo?: boolean;
  onlyAdminsCanAddMembers?: boolean;
}

export interface ChatChannel {
  id: string;
  companyId: string;
  projectId?: string;
  projectName?: string;
  name: string;
  description?: string;
  type: ChatChannelType;
  avatarUrl?: string;
  color?: string;
  isPrivate?: boolean;
  isDefaultProjectGroup?: boolean;
  createdBy: string;
  createdByName?: string;
  createdAt: number;
  updatedAt: number;
  memberIds: string[];
  members: ChatMember[];
  permissions?: ChatGroupPermissions;
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    timestamp: number;
    hasAttachment?: boolean;
  };
  unreadCount?: number;
  topic?: string;
  tradeId?: string;
  pinned?: boolean;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  companyId: string;
  projectId?: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  senderTitle?: string;
  senderDesignation?: string;
  senderAvatarUrl?: string;
  content: string;
  attachments?: ChatAttachment[];
  timestamp: number;
  createdAt: number;
  updatedAt?: number;
  isEdited?: boolean;
  pinned?: boolean;
  status?: "sent" | "delivered" | "read";
  replyToMessageId?: string;
  replyToMessageText?: string;
  replyToSenderName?: string;
  readBy?: string[]; // user IDs who have read this message
  reactions?: Record<string, string[]>; // emoji -> array of userIds (e.g. { "👍": ["uid1", "uid2"], "❤️": ["uid3"] })
  isSystemMessage?: boolean;
}

// ─── ROOM-BY-ROOM PUNCH LIST & HANDOVER REGISTER ───
export type PunchStageStatus =
  | "DRAFT"
  | "ISSUED"
  | "RECTIFIED"
  | "QAQC_VERIFIED"
  | "CONSULTANT_APPROVED"
  | "HANDED_OVER";

export type PunchSeverity = "COSMETIC" | "MINOR" | "MAJOR" | "CRITICAL";

export interface RoomPunchItem {
  id: string;
  punchNumber: string; // e.g. "PUNCH-T1-L04-402-001"
  projectId: string;
  projectName?: string;
  companyId: string;

  // Spatial Breakdown Hierarchy
  building: string; // e.g. "Tower A", "Block 1", "Main Villa"
  levelId?: string;
  levelName: string; // e.g. "Level 04"
  unitName: string; // e.g. "Apt 402", "Unit B", "Office 201"
  roomName: string; // e.g. "Master Bedroom", "Living Room", "Kitchen", "Guest Bath", "Balcony"
  elementRef?: string; // e.g. "North Wall", "Under Sink", "Window Sill"

  // Discipline & Trade
  trade: string; // e.g. "Joinery & Doors", "MEP & Electrical", "Painting & Finishes", "Glazing", "Tiling"
  tradeId?: string;
  subtrade?: string;
  severity: PunchSeverity;
  stageStatus: PunchStageStatus;

  // Defect Details
  title: string;
  description: string;
  beforePhotos: string[];
  rectificationPhotos: string[];
  rectificationRemarks?: string;
  rectificationDate?: string;

  // Responsibility & Deadlines
  contractorName: string;
  assignedTo?: string;
  assignedToName?: string;
  dueDate: string;

  // Signatures & Staged Approvals
  raisedBy: {
    uid: string;
    name: string;
    role: string;
    date: string;
  };
  rectifiedBy?: {
    uid?: string;
    name: string;
    date: string;
    notes?: string;
  };
  verifiedBy?: {
    uid: string;
    name: string;
    role: string;
    date: string;
    signatureUrl?: string;
    notes?: string;
  };
  consultantApprovedBy?: {
    uid: string;
    name: string;
    firm?: string;
    date: string;
    signatureUrl?: string;
    notes?: string;
  };
  handedOverBy?: {
    uid: string;
    name: string;
    role: string;
    date: string;
    signatureUrl?: string;
  };

  // Associated Handover Certificate
  handoverCertificateId?: string;

  createdAt: number | string;
  updatedAt?: number | string;
  closedAt?: number | string | null;
}

export type HandoverStatus =
  | "DRAFT"
  | "UNDER_INSPECTION"
  | "SNAGS_PENDING"
  | "SUBSTANTIALLY_COMPLETED"
  | "FULLY_HANDED_OVER";

export interface TakingOverCertificate {
  id: string;
  tocNumber: string; // e.g. "TOC-2026-001" or "RHC-402"
  projectId: string;
  projectName?: string;
  companyId: string;
  companyName?: string;

  // Spatial Scope
  building: string;
  levelName: string;
  unitName: string;
  roomNames: string[];
  scopeOfHandover: string; // e.g. "Practical Completion of Architectural & MEP Finishes for Unit 402"

  status: HandoverStatus;
  inspectionDate: string;
  handoverDate: string;
  warrantyStartDate: string;
  defectsLiabilityPeriodMonths: number; // e.g. 12

  // Statistics
  totalSnagsCount: number;
  openSnagsCount: number;
  rectifiedSnagsCount: number;
  verifiedSnagsCount: number;
  readinessPercentage: number; // 0 - 100%

  // Multi-Stakeholder Sign-offs
  signOffs: {
    contractorRep?: {
      name: string;
      designation: string;
      company: string;
      signed: boolean;
      date: string;
      signatureUrl?: string;
    };
    qaqcManager?: {
      name: string;
      designation: string;
      company: string;
      signed: boolean;
      date: string;
      signatureUrl?: string;
    };
    consultantRep?: {
      name: string;
      designation: string;
      firm: string;
      signed: boolean;
      date: string;
      signatureUrl?: string;
    };
    clientRep?: {
      name: string;
      designation: string;
      organization: string;
      signed: boolean;
      date: string;
      signatureUrl?: string;
    };
  };

  notes?: string;
  outstandingMinorDefects?: string[];
  attachments?: string[];
  createdAt: number | string;
  updatedAt?: number | string;
}

// ─── METHOD STATEMENTS & RAMS REVIEW WORKFLOW ───
export type RAMSReviewStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CODE_A"
  | "CODE_B"
  | "CODE_C"
  | "CODE_D"
  | "SUPERSEDED";

export type MethodStatementReviewCode =
  | "Code A" // Approved
  | "Code B" // Approved as Noted
  | "Code C" // Revise & Resubmit
  | "Code D"; // Rejected

export interface RAMSHazardControlItem {
  id: string;
  activityStep: string;
  hazardDescription: string;
  initialRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  controlMeasures: string;
  residualRisk: "LOW" | "MEDIUM" | "HIGH";
  responsiblePerson: string;
}

export interface CRSReviewCommentItem {
  id: string;
  itemNumber: number;
  sectionReference: string;
  consultantComment: string;
  commentBy: string;
  commentDate: string;
  contractorResponse?: string;
  responseBy?: string;
  responseDate?: string;
  status: "OPEN" | "RESOLVED" | "CLOSED";
}

export interface MethodStatementRevision {
  revision: string; // e.g. "Rev 00", "Rev 01"
  date: string;
  author: string;
  changeSummary: string;
  reviewCode?: MethodStatementReviewCode;
  submittedAt?: string;
  approvedAt?: string;
}

export interface MethodStatement {
  id: string;
  msNumber: string; // e.g. "MS-CIV-001", "RAMS-STR-004"
  title: string;
  projectId: string;
  projectName?: string;
  companyId: string;
  companyName?: string;

  discipline:
    | "Civil & Structural"
    | "Architectural & Finishes"
    | "MEP - Electrical"
    | "MEP - Mechanical"
    | "Geotechnical & Earthworks"
    | "Façade & Waterproofing"
    | "Specialist Works"
    | "General";
  trade: string;
  revision: string; // "Rev 00", "Rev 01", "Rev 02"
  status: RAMSReviewStatus;
  reviewCode?: MethodStatementReviewCode;
  isoClause?: string; // Default "ISO 9001:2015 Clause 8.1 & ISO 45001"

  // Scope & Sequence of Work
  scopeOfWork: string;
  sequenceOfOperations: string;
  plantAndEquipment: string[];
  materialsUsed: string[];
  qualityHoldPoints: string[];
  emergencyProcedures?: string;
  environmentalControls?: string;

  // RAMS Risk Assessment Matrix
  ramsHazardsAndControls: RAMSHazardControlItem[];

  // Linked Project Quality Records
  linkedItpIds: string[];
  linkedItpTitles?: string[];
  linkedPtpIds?: string[];
  linkedDrawingNumbers?: string[];

  // Comment Resolution Sheet (CRS)
  crsItems: CRSReviewCommentItem[];

  // Multi-Stakeholder Reviews
  preparedBy: {
    name: string;
    role: string;
    designation?: string;
    date: string;
    signed: boolean;
    signatureUrl?: string;
  };
  qaqcReviewer?: {
    name: string;
    role: string;
    designation?: string;
    date: string;
    signed: boolean;
    comments?: string;
    signatureUrl?: string;
  };
  hseReviewer?: {
    name: string;
    role: string;
    designation?: string;
    date: string;
    signed: boolean;
    comments?: string;
    signatureUrl?: string;
  };
  consultantSignOff?: {
    name: string;
    firm: string;
    date: string;
    reviewCode: MethodStatementReviewCode;
    signed: boolean;
    stampNumber?: string;
    comments?: string;
    signatureUrl?: string;
  };

  documentUrl?: string;
  attachments?: string[];
  revisionHistory: MethodStatementRevision[];

  createdAt: number | string;
  updatedAt?: number | string;
}

