import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useCompany } from "@/lib/companyHelper";
import { dbService } from "@/lib/db";
import {
  isUserEligibleForStakeholderRole,
  isQAQCUser,
  getRoleLevel,
} from "@/lib/permissions";
import {
  Building,
  Layers,
  Home,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck2,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Camera,
  X,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Building2,
  ArrowRight,
  Sparkles,
  Award,
  HelpCircle,
  Eye,
  FileSpreadsheet,
} from "lucide-react";
import toast from "react-hot-toast";
import { SignaturePad } from "@/components/common/SignaturePad";
import {
  RoomPunchItem,
  TakingOverCertificate,
  PunchStageStatus,
  PunchSeverity,
  HandoverStatus,
} from "@/types";

const STAGE_CONFIG: Record<
  PunchStageStatus,
  { label: string; color: string; bg: string; border: string; step: number }
> = {
  DRAFT: {
    label: "Draft Snag",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    step: 1,
  },
  ISSUED: {
    label: "Issued to Subcontractor",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    step: 2,
  },
  RECTIFIED: {
    label: "Rectified by Trade",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    step: 3,
  },
  QAQC_VERIFIED: {
    label: "QA/QC Verified",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    step: 4,
  },
  CONSULTANT_APPROVED: {
    label: "Consultant Signed Off",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    step: 5,
  },
  HANDED_OVER: {
    label: "Handed Over (Client Ready)",
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
    step: 6,
  },
};

const SEVERITY_CONFIG: Record<
  PunchSeverity,
  { label: string; badge: string }
> = {
  COSMETIC: {
    label: "Cosmetic",
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  MINOR: {
    label: "Minor",
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  MAJOR: {
    label: "Major",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  CRITICAL: {
    label: "Critical (Hold)",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  },
};

const DEFAULT_ROOMS = [
  "Master Bedroom",
  "Bedroom 2",
  "Living & Dining Area",
  "Kitchen",
  "Ensuite Bathroom",
  "Guest Bathroom",
  "Balcony / Terrace",
  "Corridor / Foyer",
  "Utility / Laundry",
];

const DEFAULT_TRADES = [
  "Joinery & Doors",
  "MEP & Electrical",
  "Sanitary & Plumbing",
  "Painting & Wall Finishes",
  "Tiling & Flooring",
  "Glazing & Windows",
  "False Ceiling & Plasterboard",
  "HVAC & Grilles",
  "Ironmongery & Hardware",
];

export const PunchListHandoverPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { activeProject } = useProjectStore();
  const { company } = useCompany();

  const projectId = activeProject?.id || "proj-default";
  const companyId = company?.id || "comp-default";

  // State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"snags" | "spatial_matrix" | "tocs">("spatial_matrix");
  const [punchItems, setPunchItems] = useState<RoomPunchItem[]>([]);
  const [tocs, setTocs] = useState<TakingOverCertificate[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState<string>("ALL");
  const [selectedLevel, setSelectedLevel] = useState<string>(
    activeProject?.currentLevelName || "ALL",
  );
  const prevLevelNameRef = useRef<string | undefined>(activeProject?.currentLevelName);
  useEffect(() => {
    if (activeProject?.currentLevelName !== prevLevelNameRef.current) {
      prevLevelNameRef.current = activeProject?.currentLevelName;
      setSelectedLevel(activeProject?.currentLevelName || "ALL");
      if (activeProject?.currentLevelName) {
        setFormLevel(activeProject.currentLevelName);
        setTocLevel(activeProject.currentLevelName);
      }
    }
  }, [activeProject?.currentLevelName]);
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL");
  const [selectedRoom, setSelectedRoom] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedTrade, setSelectedTrade] = useState<string>("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");

  // Modals & Drawers
  const [showNewSnagModal, setShowNewSnagModal] = useState(false);
  const [selectedSnagForDetail, setSelectedSnagForDetail] = useState<RoomPunchItem | null>(null);
  const [showTOCModal, setShowTOCModal] = useState(false);
  const [selectedTOC, setSelectedTOC] = useState<TakingOverCertificate | null>(null);

  // Snag Form State
  const [formBuilding, setFormBuilding] = useState("Tower 1");
  const [formLevel, setFormLevel] = useState("Level 04");
  const [formUnit, setFormUnit] = useState("Apt 402");
  const [formRoom, setFormRoom] = useState("Master Bedroom");
  const [formElementRef, setFormElementRef] = useState("");
  const [formTrade, setFormTrade] = useState("Joinery & Doors");
  const [formSeverity, setFormSeverity] = useState<PunchSeverity>("MINOR");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formContractor, setFormContractor] = useState("Prime Finishes & Joinery Ltd");
  const [formDueDate, setFormDueDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]
  );
  const [formBeforePhotos, setFormBeforePhotos] = useState<string[]>([
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
  ]);
  const [photoInputUrl, setPhotoInputUrl] = useState("");

  // Rectification & Signoff Drawer State
  const [rectificationNotes, setRectificationNotes] = useState("");
  const [rectificationPhotoUrl, setRectificationPhotoUrl] = useState("");
  const [signoffRemarks, setSignoffRemarks] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signingInProgress, setSigningInProgress] = useState(false);

  // TOC Generator State
  const [tocBuilding, setTocBuilding] = useState("Tower 1");
  const [tocLevel, setTocLevel] = useState("Level 04");
  const [tocUnit, setTocUnit] = useState("Apt 402");
  const [tocScope, setTocScope] = useState(
    "Practical Completion & Quality Clearance of Apartment 402 Architectural & MEP Finishes"
  );
  const [tocWarrantyMonths, setTocWarrantyMonths] = useState(12);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [items, certs] = await Promise.all([
        dbService.getRoomPunchItems(projectId, companyId),
        dbService.getTakingOverCertificates(projectId, companyId),
      ]);
      setPunchItems(items);
      setTocs(certs);
    } catch (err) {
      console.error("Failed to load punch items:", err);
      toast.error("Failed to load punch list & handover register.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId, companyId]);

  // Derived Spatial Trees
  const buildings = useMemo(() => {
    const set = new Set<string>();
    punchItems.forEach((i) => i.building && set.add(i.building));
    if (set.size === 0) set.add("Tower 1");
    return Array.from(set);
  }, [punchItems]);

  const levels = useMemo(() => {
    const set = new Set<string>();
    punchItems.forEach((i) => i.levelName && set.add(i.levelName));
    if (set.size === 0) set.add("Level 04");
    return Array.from(set);
  }, [punchItems]);

  const units = useMemo(() => {
    const set = new Set<string>();
    punchItems.forEach((i) => i.unitName && set.add(i.unitName));
    if (set.size === 0) {
      set.add("Apt 401");
      set.add("Apt 402");
    }
    return Array.from(set);
  }, [punchItems]);

  const rooms = useMemo(() => {
    const set = new Set<string>();
    punchItems.forEach((i) => i.roomName && set.add(i.roomName));
    DEFAULT_ROOMS.forEach((r) => set.add(r));
    return Array.from(set);
  }, [punchItems]);

  // Filtered Snags
  const filteredPunchItems = useMemo(() => {
    return punchItems.filter((item) => {
      if (selectedBuilding !== "ALL" && item.building !== selectedBuilding) return false;
      if (selectedLevel !== "ALL" && item.levelName !== selectedLevel) return false;
      if (selectedUnit !== "ALL" && item.unitName !== selectedUnit) return false;
      if (selectedRoom !== "ALL" && item.roomName !== selectedRoom) return false;
      if (selectedStatus !== "ALL" && item.stageStatus !== selectedStatus) return false;
      if (selectedTrade !== "ALL" && item.trade !== selectedTrade) return false;
      if (selectedSeverity !== "ALL" && item.severity !== selectedSeverity) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = item.punchNumber.toLowerCase().includes(q);
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchContractor = item.contractorName.toLowerCase().includes(q);
        const matchUnit = item.unitName.toLowerCase().includes(q);
        const matchRoom = item.roomName.toLowerCase().includes(q);
        if (!matchNum && !matchTitle && !matchDesc && !matchContractor && !matchUnit && !matchRoom) {
          return false;
        }
      }
      return true;
    });
  }, [
    punchItems,
    selectedBuilding,
    selectedLevel,
    selectedUnit,
    selectedRoom,
    selectedStatus,
    selectedTrade,
    selectedSeverity,
    searchQuery,
  ]);

  // KPI Metrics
  const stats = useMemo(() => {
    const total = punchItems.length;
    const open = punchItems.filter((i) => i.stageStatus === "DRAFT" || i.stageStatus === "ISSUED").length;
    const rectified = punchItems.filter((i) => i.stageStatus === "RECTIFIED").length;
    const verified = punchItems.filter((i) => i.stageStatus === "QAQC_VERIFIED" || i.stageStatus === "CONSULTANT_APPROVED").length;
    const handedOver = punchItems.filter((i) => i.stageStatus === "HANDED_OVER").length;
    const critical = punchItems.filter((i) => i.severity === "CRITICAL" && i.stageStatus !== "HANDED_OVER").length;
    const readyRate = total > 0 ? Math.round(((verified + handedOver) / total) * 100) : 100;

    return { total, open, rectified, verified, handedOver, critical, readyRate };
  }, [punchItems]);

  // Spatial Completion Matrix Grouping
  const spatialMatrix = useMemo(() => {
    const map: Record<string, { unit: string; level: string; building: string; rooms: Record<string, RoomPunchItem[]> }> = {};

    units.forEach((u) => {
      map[u] = {
        unit: u,
        level: "Level 04",
        building: "Tower 1",
        rooms: {},
      };
      DEFAULT_ROOMS.forEach((r) => {
        map[u].rooms[r] = [];
      });
    });

    punchItems.forEach((item) => {
      const u = item.unitName || "General Unit";
      if (!map[u]) {
        map[u] = {
          unit: u,
          level: item.levelName || "Level 04",
          building: item.building || "Tower 1",
          rooms: {},
        };
      }
      const r = item.roomName || "General Area";
      if (!map[u].rooms[r]) {
        map[u].rooms[r] = [];
      }
      map[u].rooms[r].push(item);
    });

    return Object.values(map);
  }, [units, punchItems]);

  // Create Snag Handler
  const handleCreateSnag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Please enter a snag title");
      return;
    }

    const nextNum = `PUNCH-${formBuilding.replace(/\s+/g, "").toUpperCase()}-${formLevel.replace(/\s+/g, "").toUpperCase()}-${formUnit.replace(/\s+/g, "").toUpperCase()}-${String(punchItems.length + 1).padStart(3, "0")}`;

    const newSnag: RoomPunchItem = {
      id: `punch-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      punchNumber: nextNum,
      projectId,
      projectName: activeProject?.name || "Apex Tower",
      companyId,
      building: formBuilding,
      levelName: formLevel,
      unitName: formUnit,
      roomName: formRoom,
      elementRef: formElementRef || undefined,
      trade: formTrade,
      severity: formSeverity,
      stageStatus: "ISSUED",
      title: formTitle,
      description: formDescription,
      beforePhotos: formBeforePhotos,
      rectificationPhotos: [],
      contractorName: formContractor,
      dueDate: formDueDate,
      raisedBy: {
        uid: currentUser?.uid || "user-qaqc",
        name: currentUser?.fullName || "QA/QC Inspector",
        role: currentUser?.role || "QAQC_INSPECTOR",
        date: new Date().toISOString(),
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await dbService.saveRoomPunchItem(newSnag);
      toast.success(`Snag ${newSnag.punchNumber} issued to ${formContractor}!`);
      setShowNewSnagModal(false);
      setFormTitle("");
      setFormDescription("");
      setFormElementRef("");
      loadData();
    } catch (err) {
      console.error("Failed to create snag:", err);
      toast.error("Could not save snag item.");
    }
  };

  // Rectify & Multi-Stage Sign-off Handler
  const handleAdvanceSnagStage = async (targetStage: PunchStageStatus) => {
    if (!selectedSnagForDetail || !currentUser) return;
    setSigningInProgress(true);

    const nowIso = new Date().toISOString();
    const updated: RoomPunchItem = {
      ...selectedSnagForDetail,
      stageStatus: targetStage,
      updatedAt: Date.now(),
    };

    if (targetStage === "RECTIFIED") {
      updated.rectificationRemarks = rectificationNotes || "Defect rectified as per specification.";
      updated.rectificationDate = nowIso;
      if (rectificationPhotoUrl.trim()) {
        updated.rectificationPhotos = [
          ...(updated.rectificationPhotos || []),
          rectificationPhotoUrl.trim(),
        ];
      }
      updated.rectifiedBy = {
        uid: currentUser.uid,
        name: currentUser.fullName || "Subcontractor Foreman",
        date: nowIso,
        notes: rectificationNotes,
      };
    } else if (targetStage === "QAQC_VERIFIED") {
      updated.verifiedBy = {
        uid: currentUser.uid,
        name: currentUser.fullName || "QA/QC Engineer",
        role: currentUser.role || "QAQC_ENGINEER",
        date: nowIso,
        signatureUrl: signatureData || undefined,
        notes: signoffRemarks || "Verified compliant on site inspection.",
      };
    } else if (targetStage === "CONSULTANT_APPROVED") {
      updated.consultantApprovedBy = {
        uid: currentUser.uid,
        name: currentUser.fullName || "Supervising Consultant",
        firm: "Supervising Consultant Engineers",
        date: nowIso,
        signatureUrl: signatureData || undefined,
        notes: signoffRemarks || "Approved for practical completion.",
      };
    } else if (targetStage === "HANDED_OVER") {
      updated.handedOverBy = {
        uid: currentUser.uid,
        name: currentUser.fullName || "Client Representative",
        role: currentUser.role || "CLIENT_REPRESENTATIVE",
        date: nowIso,
        signatureUrl: signatureData || undefined,
      };
      updated.closedAt = Date.now();
    }

    try {
      await dbService.saveRoomPunchItem(updated);
      toast.success(`Snag updated to ${STAGE_CONFIG[targetStage].label}!`);
      setSelectedSnagForDetail(updated);
      setRectificationNotes("");
      setRectificationPhotoUrl("");
      setSignoffRemarks("");
      setSignatureData(null);
      loadData();
    } catch (err) {
      console.error("Stage transition failed:", err);
      toast.error("Failed to update snag stage.");
    } finally {
      setSigningInProgress(false);
    }
  };

  // Generate Taking Over Certificate (TOC)
  const handleGenerateTOC = async (e: React.FormEvent) => {
    e.preventDefault();
    const unitSnags = punchItems.filter(
      (i) => i.building === tocBuilding && i.levelName === tocLevel && i.unitName === tocUnit
    );

    const total = unitSnags.length;
    const open = unitSnags.filter((i) => i.stageStatus === "DRAFT" || i.stageStatus === "ISSUED").length;
    const rectified = unitSnags.filter((i) => i.stageStatus === "RECTIFIED").length;
    const verified = unitSnags.filter(
      (i) => i.stageStatus === "QAQC_VERIFIED" || i.stageStatus === "CONSULTANT_APPROVED" || i.stageStatus === "HANDED_OVER"
    ).length;
    const readyRate = total > 0 ? Math.round((verified / total) * 100) : 100;

    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split("T")[0];

    const newTOC: TakingOverCertificate = {
      id: `toc-${Date.now()}`,
      tocNumber: `TOC-${tocBuilding.replace(/\s+/g, "").toUpperCase()}-${tocUnit.replace(/\s+/g, "").toUpperCase()}`,
      projectId,
      projectName: activeProject?.name || "Apex Tower",
      companyId,
      building: tocBuilding,
      levelName: tocLevel,
      unitName: tocUnit,
      roomNames: DEFAULT_ROOMS,
      scopeOfHandover: tocScope,
      status: readyRate === 100 ? "FULLY_HANDED_OVER" : "SUBSTANTIALLY_COMPLETED",
      inspectionDate: todayStr,
      handoverDate: todayStr,
      warrantyStartDate: todayStr,
      defectsLiabilityPeriodMonths: tocWarrantyMonths,
      totalSnagsCount: total,
      openSnagsCount: open,
      rectifiedSnagsCount: rectified,
      verifiedSnagsCount: verified,
      readinessPercentage: readyRate,
      signOffs: {
        contractorRep: {
          name: currentUser?.fullName || "Contractor Director",
          designation: "Project Director",
          company: "Main Contractor Consortium",
          signed: true,
          date: nowIso,
          signatureUrl: signatureData || undefined,
        },
        qaqcManager: {
          name: "Engr. David Okon",
          designation: "Lead Quality Manager",
          company: "Quality Assurance Department",
          signed: true,
          date: nowIso,
        },
        consultantRep: {
          name: "Arch. Marcus Sterling",
          designation: "Supervising Consultant",
          firm: "Sterling & Partners Consulting",
          signed: readyRate >= 90,
          date: nowIso,
        },
        clientRep: {
          name: "Client Representative",
          designation: "Handover Acceptance Officer",
          organization: "Apex Real Estate Holdings",
          signed: readyRate === 100,
          date: nowIso,
        },
      },
      notes: `Taking Over Certificate formally compiled with ${verified}/${total} snags resolved (${readyRate}% Quality Clearance). Warranty active for ${tocWarrantyMonths} months defects liability.`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await dbService.saveTakingOverCertificate(newTOC);
      toast.success(`Taking Over Certificate ${newTOC.tocNumber} generated successfully!`);
      setShowTOCModal(false);
      setSelectedTOC(newTOC);
      loadData();
    } catch (err) {
      console.error("Failed to generate TOC:", err);
      toast.error("Could not generate Taking Over Certificate.");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Home className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Room-by-Room Punch List & Handover Register
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ISO 9001:2015 Clause 8.6 & 8.7
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Spatial snag tracking, multi-stage rectification clearance, and Taking Over Certificate (TOC) practical completion dossiers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowTOCModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 font-medium text-sm transition-all shadow-sm"
          >
            <Award className="w-4 h-4" />
            <span>Generate TOC / Handover</span>
          </button>

          <button
            onClick={() => setShowNewSnagModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Log New Snag</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Snags</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {stats.total}
          </p>
          <p className="text-xs text-slate-500 mt-1">Across all rooms</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Pending Trade</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {stats.open}
          </p>
          <p className="text-xs text-slate-500 mt-1">Awaiting fix</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Rectified</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {stats.rectified}
          </p>
          <p className="text-xs text-slate-500 mt-1">Needs QA verification</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>QA/Consultant Verified</span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            {stats.verified}
          </p>
          <p className="text-xs text-slate-500 mt-1">Ready for handover</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Handed Over</span>
            <Award className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-2">
            {stats.handedOver}
          </p>
          <p className="text-xs text-slate-500 mt-1">Client accepted</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Readiness Score</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.readyRate}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Quality completion</p>
        </div>
      </div>

      {/* Navigation View Tabs */}
      <div className="flex items-center gap-2 sm:gap-3 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveTab("spatial_matrix")}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 font-medium text-xs sm:text-sm rounded-xl transition-all shrink-0 ${
            activeTab === "spatial_matrix"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Spatial Room Readiness Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab("snags")}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 font-medium text-xs sm:text-sm rounded-xl transition-all shrink-0 ${
            activeTab === "snags"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Detailed Snag Register ({filteredPunchItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("tocs")}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 font-medium text-xs sm:text-sm rounded-xl transition-all shrink-0 ${
            activeTab === "tocs"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Taking Over Certificates (TOC) ({tocs.length})</span>
        </button>
      </div>

      {/* TAB 1: SPATIAL ROOM READINESS MATRIX */}
      {activeTab === "spatial_matrix" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {spatialMatrix.map((unitGroup) => {
              const allUnitSnags = punchItems.filter((i) => i.unitName === unitGroup.unit);
              const openCount = allUnitSnags.filter((i) => i.stageStatus === "DRAFT" || i.stageStatus === "ISSUED").length;
              const rectifiedCount = allUnitSnags.filter((i) => i.stageStatus === "RECTIFIED").length;
              const verifiedCount = allUnitSnags.filter(
                (i) => i.stageStatus === "QAQC_VERIFIED" || i.stageStatus === "CONSULTANT_APPROVED" || i.stageStatus === "HANDED_OVER"
              ).length;
              const totalCount = allUnitSnags.length;
              const unitReadiness = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 100;

              return (
                <div
                  key={unitGroup.unit}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-slate-900 dark:text-white">
                          {unitGroup.unit}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          {unitGroup.building} • {unitGroup.level}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {totalCount} Total Snags ({openCount} Open, {rectifiedCount} Rectified, {verifiedCount} Verified)
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${unitReadiness >= 90 ? "text-emerald-600" : unitReadiness >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                          {unitReadiness}%
                        </span>
                        <span className="text-xs text-slate-400">Ready</span>
                      </div>
                      <button
                        onClick={() => {
                          setTocUnit(unitGroup.unit);
                          setTocBuilding(unitGroup.building);
                          setTocLevel(unitGroup.level);
                          setShowTOCModal(true);
                        }}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                      >
                        Issue TOC Cert →
                      </button>
                    </div>
                  </div>

                  {/* Room Breakdown Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DEFAULT_ROOMS.map((roomName) => {
                      const roomSnags = allUnitSnags.filter((s) => s.roomName === roomName);
                      const roomOpen = roomSnags.filter((s) => s.stageStatus === "DRAFT" || s.stageStatus === "ISSUED").length;
                      const roomRectified = roomSnags.filter((s) => s.stageStatus === "RECTIFIED").length;
                      const roomVerified = roomSnags.filter(
                        (s) => s.stageStatus === "QAQC_VERIFIED" || s.stageStatus === "CONSULTANT_APPROVED" || s.stageStatus === "HANDED_OVER"
                      ).length;

                      const isSnagFree = roomSnags.length === 0;
                      const isClear = roomOpen === 0 && roomRectified === 0;

                      return (
                        <div
                          key={roomName}
                          onClick={() => {
                            setSelectedUnit(unitGroup.unit);
                            setSelectedRoom(roomName);
                            setActiveTab("snags");
                          }}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSnagFree
                              ? "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                              : isClear
                              ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 hover:border-emerald-300"
                              : roomOpen > 0
                              ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 hover:border-amber-300"
                              : "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40 hover:border-blue-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {roomName}
                            </span>
                            {isSnagFree ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                                Snag Free
                              </span>
                            ) : (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                  isClear
                                    ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
                                    : "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200"
                                }`}
                              >
                                {roomSnags.length} Snags
                              </span>
                            )}
                          </div>

                          {!isSnagFree && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                              {roomOpen > 0 && (
                                <span className="text-amber-600 dark:text-amber-400 font-medium">
                                  {roomOpen} Open
                                </span>
                              )}
                              {roomRectified > 0 && (
                                <span className="text-blue-600 dark:text-blue-400 font-medium">
                                  {roomRectified} Rectified
                                </span>
                              )}
                              {roomVerified > 0 && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                  {roomVerified} Verified
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED SNAG REGISTER TABLE */}
      {activeTab === "snags" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {/* Search */}
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search snag, room, trade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Building */}
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
              >
                <option value="ALL">All Buildings</option>
                {buildings.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              {/* Floor Level */}
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
              >
                <option value="ALL">All Levels</option>
                {levels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>

              {/* Unit */}
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
              >
                <option value="ALL">All Units</option>
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>

              {/* Room */}
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
              >
                <option value="ALL">All Rooms</option>
                {rooms.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {/* Trade */}
              <select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
              >
                <option value="ALL">All Trades</option>
                {DEFAULT_TRADES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Status */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
              >
                <option value="ALL">All Stages</option>
                {Object.keys(STAGE_CONFIG).map((k) => (
                  <option key={k} value={k}>
                    {STAGE_CONFIG[k as PunchStageStatus].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Snags Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Snag Reference</th>
                    <th className="px-4 py-3.5">Spatial Location</th>
                    <th className="px-4 py-3.5">Trade & Severity</th>
                    <th className="px-4 py-3.5">Defect Summary</th>
                    <th className="px-4 py-3.5">Assigned Subcontractor</th>
                    <th className="px-4 py-3.5">Lifecycle Stage</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPunchItems.map((item) => {
                    const stage = STAGE_CONFIG[item.stageStatus];
                    const severity = SEVERITY_CONFIG[item.severity];

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedSnagForDetail(item)}
                      >
                        <td className="px-5 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {item.punchNumber}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {item.unitName} • {item.roomName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.building} • {item.levelName}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {item.trade}
                          </div>
                          <span
                            className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${severity.badge}`}
                          >
                            {severity.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 max-w-xs">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {item.description}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-xs">
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {item.contractorName}
                          </p>
                          <p className="text-slate-500">Due: {item.dueDate}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${stage.bg} ${stage.color} ${stage.border}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {stage.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSnagForDetail(item);
                            }}
                            className="px-3 py-1.5 rounded-xl border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-xs font-medium"
                          >
                            Inspect & Sign →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPunchItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500">
                        No snag records found matching the active filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TAKING OVER CERTIFICATES (TOC) */}
      {activeTab === "tocs" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tocs.map((cert) => (
              <div
                key={cert.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                    {cert.tocNumber}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {cert.handoverDate}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {cert.unitName} ({cert.building})
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {cert.scopeOfHandover}
                  </p>
                </div>

                {/* Snags Stats Ribbon */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-slate-400 block">Total Snags</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {cert.totalSnagsCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Resolved</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {cert.verifiedSnagsCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Warranty</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {cert.defectsLiabilityPeriodMonths} Mo
                    </span>
                  </div>
                </div>

                {/* Sign-offs Grid */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex items-center justify-between">
                    <span>Main Contractor:</span>
                    <span className="font-semibold text-emerald-600">✓ Signed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>QA/QC Manager:</span>
                    <span className="font-semibold text-emerald-600">✓ Verified</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Supervising Consultant:</span>
                    <span className="font-semibold text-emerald-600">✓ Approved</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Client Representative:</span>
                    <span className="font-semibold text-teal-600">✓ Accepted</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setSelectedTOC(cert)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition-all shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View Official TOC Dossier</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: LOG NEW SNAG */}
      {showNewSnagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-500/10 text-indigo-600 rounded-lg">
                  <Plus className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Log New Room Snag Item
                </h2>
              </div>
              <button
                onClick={() => setShowNewSnagModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSnag} className="p-6 overflow-y-auto space-y-4">
              {/* Spatial Location */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Building</label>
                  <input
                    type="text"
                    value={formBuilding}
                    onChange={(e) => setFormBuilding(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Level</label>
                  <input
                    type="text"
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Unit / Apt</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Room</label>
                  <select
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {DEFAULT_ROOMS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Element Reference / Specific Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master Bed North Wall Skirting, Basin Trap"
                  value={formElementRef}
                  onChange={(e) => setFormElementRef(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {/* Trade & Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Trade Category</label>
                  <select
                    value={formTrade}
                    onChange={(e) => setFormTrade(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {DEFAULT_TRADES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Severity Level</label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as PunchSeverity)}
                    className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="COSMETIC">Cosmetic (Touch-up)</option>
                    <option value="MINOR">Minor (No impact to occupancy)</option>
                    <option value="MAJOR">Major (Rectification required before TOC)</option>
                    <option value="CRITICAL">Critical (Life safety / Hold point)</option>
                  </select>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Defect Title</label>
                <input
                  type="text"
                  placeholder="Brief summary of snag"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Technical Defect Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Precise description of non-compliance, dimension gaps, or finish flaws..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {/* Assignment & SLA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Subcontractor Trade Company
                  </label>
                  <input
                    type="text"
                    value={formContractor}
                    onChange={(e) => setFormContractor(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Rectification Target Deadline
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Photo Evidence */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Before Photo Proof (URL)
                </label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={photoInputUrl}
                    onChange={(e) => setPhotoInputUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (photoInputUrl.trim()) {
                        setFormBeforePhotos([...formBeforePhotos, photoInputUrl.trim()]);
                        setPhotoInputUrl("");
                      }
                    }}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl text-sm"
                  >
                    Add Photo
                  </button>
                </div>

                <div className="flex gap-2 mt-2">
                  {formBeforePhotos.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                      <img src={url} alt="Before" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormBeforePhotos(formBeforePhotos.filter((_, idx) => idx !== i))}
                        className="absolute top-0 right-0 bg-red-600 text-white p-0.5 rounded-bl text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewSnagModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-md shadow-indigo-600/20"
                >
                  Formally Issue Snag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER: SNAG DETAIL & STAGED SIGN-OFF */}
      {selectedSnagForDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedSnagForDetail.punchNumber}
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedSnagForDetail.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedSnagForDetail(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Stage Progression Bar */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  Snag Lifecycle Clearance Progress
                </span>
                <div className="grid grid-cols-6 gap-1 text-center">
                  {(Object.keys(STAGE_CONFIG) as PunchStageStatus[]).map((st, idx) => {
                    const cfg = STAGE_CONFIG[st];
                    const currentStep = STAGE_CONFIG[selectedSnagForDetail.stageStatus].step;
                    const isPassed = cfg.step <= currentStep;
                    const isCurrent = cfg.step === currentStep;

                    return (
                      <div key={st} className="space-y-1">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isPassed
                              ? "bg-indigo-600"
                              : "bg-slate-200 dark:bg-slate-700"
                          } ${isCurrent ? "ring-2 ring-indigo-400" : ""}`}
                        />
                        <span
                          className={`text-[10px] block truncate font-medium ${
                            isCurrent
                              ? "text-indigo-600 dark:text-indigo-400 font-bold"
                              : "text-slate-400"
                          }`}
                        >
                          {cfg.label.split(" ")[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Defect Overview */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                    <span className="text-slate-400 block">Spatial Location</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedSnagForDetail.building} • {selectedSnagForDetail.levelName} • {selectedSnagForDetail.unitName} ({selectedSnagForDetail.roomName})
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                    <span className="text-slate-400 block">Trade & Subcontractor</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedSnagForDetail.trade} ({selectedSnagForDetail.contractorName})
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl">
                  <span className="text-xs font-semibold text-slate-400 uppercase block">
                    Defect Description
                  </span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    {selectedSnagForDetail.description}
                  </p>
                </div>
              </div>

              {/* Before & After Photo Comparison */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  Photo Evidence Comparison
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 block">
                      Before (Initial Snag)
                    </span>
                    {selectedSnagForDetail.beforePhotos?.length > 0 ? (
                      <img
                        src={selectedSnagForDetail.beforePhotos[0]}
                        alt="Before"
                        className="w-full h-40 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400">
                        No Photo
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
                      After (Rectified Work)
                    </span>
                    {selectedSnagForDetail.rectificationPhotos?.length > 0 ? (
                      <img
                        src={selectedSnagForDetail.rectificationPhotos[0]}
                        alt="After"
                        className="w-full h-40 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-400">
                        Pending Rectification
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Multi-Stage Action Panel */}
              <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-4">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase block tracking-wider">
                  Stage Sign-off & Clearance Action
                </span>

                {selectedSnagForDetail.stageStatus === "ISSUED" && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Step 1: Subcontractor submits rectification details and upload proof photo.
                    </p>
                    <textarea
                      rows={2}
                      placeholder="Explain rectification work done (e.g., gap filled, realigned, repainted)..."
                      value={rectificationNotes}
                      onChange={(e) => setRectificationNotes(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                    <input
                      type="url"
                      placeholder="After Photo URL (Proof of Rectification)"
                      value={rectificationPhotoUrl}
                      onChange={(e) => setRectificationPhotoUrl(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                    <button
                      onClick={() => handleAdvanceSnagStage("RECTIFIED")}
                      disabled={signingInProgress}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
                    >
                      {signingInProgress ? "Submitting..." : "Mark as Rectified by Subcontractor"}
                    </button>
                  </div>
                )}

                {selectedSnagForDetail.stageStatus === "RECTIFIED" && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Step 2: QA/QC Engineer verifies rectification on site and stamps approval.
                    </p>
                    <textarea
                      rows={2}
                      placeholder="QA/QC inspection remarks..."
                      value={signoffRemarks}
                      onChange={(e) => setSignoffRemarks(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase">
                        QA/QC Digital Signature Stamp
                      </span>
                      <SignaturePad label="QA/QC Inspection Stamp" onSave={setSignatureData} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAdvanceSnagStage("ISSUED")}
                        className="flex-1 py-2.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 font-semibold text-xs rounded-xl"
                      >
                        Reject & Return
                      </button>
                      <button
                        onClick={() => handleAdvanceSnagStage("QAQC_VERIFIED")}
                        disabled={signingInProgress}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md"
                      >
                        {signingInProgress ? "Saving..." : "Verify & Stamp (QA/QC)"}
                      </button>
                    </div>
                  </div>
                )}

                {selectedSnagForDetail.stageStatus === "QAQC_VERIFIED" && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Step 3: Supervising Consultant signs off for practical completion inclusion.
                    </p>
                    <textarea
                      rows={2}
                      placeholder="Consultant sign-off comments..."
                      value={signoffRemarks}
                      onChange={(e) => setSignoffRemarks(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase">
                        Consultant Signature Stamp
                      </span>
                      <SignaturePad label="Consultant Clearance Stamp" onSave={setSignatureData} />
                    </div>
                    <button
                      onClick={() => handleAdvanceSnagStage("CONSULTANT_APPROVED")}
                      disabled={signingInProgress}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md"
                    >
                      {signingInProgress ? "Saving..." : "Consultant Final Sign-Off"}
                    </button>
                  </div>
                )}

                {selectedSnagForDetail.stageStatus === "CONSULTANT_APPROVED" && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Step 4: Client Representative / PM final acceptance and Handover clearance.
                    </p>
                    <button
                      onClick={() => handleAdvanceSnagStage("HANDED_OVER")}
                      disabled={signingInProgress}
                      className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-md"
                    >
                      {signingInProgress ? "Saving..." : "Clear into Final Client Handover"}
                    </button>
                  </div>
                )}

                {selectedSnagForDetail.stageStatus === "HANDED_OVER" && (
                  <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl text-center text-xs text-teal-800 dark:text-teal-200 font-semibold">
                    ✓ This snag is fully resolved, verified, and handed over to client.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: GENERATE TAKING OVER CERTIFICATE (TOC) */}
      {showTOCModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-teal-500/10 text-teal-600 rounded-lg">
                  <Award className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Generate Taking Over Certificate (TOC)
                </h2>
              </div>
              <button
                onClick={() => setShowTOCModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateTOC} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Building</label>
                  <input
                    type="text"
                    value={tocBuilding}
                    onChange={(e) => setTocBuilding(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Level</label>
                  <input
                    type="text"
                    value={tocLevel}
                    onChange={(e) => setTocLevel(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Unit / Scope</label>
                  <input
                    type="text"
                    value={tocUnit}
                    onChange={(e) => setTocUnit(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Handover Scope & Statement of Completion
                </label>
                <textarea
                  rows={2}
                  value={tocScope}
                  onChange={(e) => setTocScope(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Defects Liability Warranty Period (Months)
                </label>
                <input
                  type="number"
                  value={tocWarrantyMonths}
                  onChange={(e) => setTocWarrantyMonths(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {/* Digital Signature */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  Project Director / PM Signature Stamp
                </span>
                <SignaturePad label="TOC Endorsement Stamp" onSave={setSignatureData} />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTOCModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium shadow-md shadow-teal-600/20"
                >
                  Issue Official Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: OFFICIAL TOC PRINTABLE DOSSIER VIEW */}
      {selectedTOC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-teal-600" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Taking Over Certificate (TOC) Official Dossier
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedTOC(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-slate-900 dark:text-white">
              {/* Certificate Header */}
              <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-6 text-center space-y-1">
                <span className="text-xs uppercase font-bold tracking-widest text-slate-500">
                  Apex Quality Management System • Practical Completion Dossier
                </span>
                <h1 className="text-2xl font-black uppercase tracking-tight">
                  TAKING OVER CERTIFICATE (TOC)
                </h1>
                <p className="text-sm font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  Certificate Ref: {selectedTOC.tocNumber}
                </p>
              </div>

              {/* Key Scope */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">PROJECT</span>
                  <span className="font-bold">{selectedTOC.projectName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">LOCATION</span>
                  <span className="font-bold">{selectedTOC.building} • {selectedTOC.levelName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">UNIT / SCOPE</span>
                  <span className="font-bold">{selectedTOC.unitName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">HANDOVER DATE</span>
                  <span className="font-bold">{selectedTOC.handoverDate}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  1. Scope of Taking Over & Practical Completion
                </h4>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {selectedTOC.scopeOfHandover}. The works have been inspected and verified as substantially complete in accordance with the Contract Specifications and ISO 9001:2015 Clause 8.6 standards.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  2. Quality Audit & Snag Rectification Summary
                </h4>
                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-slate-400 block">Total Items Audited</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedTOC.totalSnagsCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Rectified & Verified</span>
                    <span className="text-base font-bold text-emerald-600">
                      {selectedTOC.verifiedSnagsCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Readiness Compliance</span>
                    <span className="text-base font-bold text-indigo-600">
                      {selectedTOC.readinessPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures Stamped */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  3. Multi-Stakeholder Endorsements & Digital Signatures
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-xl space-y-2 text-xs">
                    <span className="font-semibold text-slate-400 block uppercase">Main Contractor</span>
                    <p className="font-bold">{selectedTOC.signOffs?.contractorRep?.name || "Project Director"}</p>
                    <p className="text-[11px] text-emerald-600 font-semibold">✓ Digitally Signed & Handed Over</p>
                  </div>
                  <div className="p-4 border rounded-xl space-y-2 text-xs">
                    <span className="font-semibold text-slate-400 block uppercase">Lead QA/QC Manager</span>
                    <p className="font-bold">{selectedTOC.signOffs?.qaqcManager?.name || "Engr. David Okon"}</p>
                    <p className="text-[11px] text-emerald-600 font-semibold">✓ Quality Clearance Verified</p>
                  </div>
                  <div className="p-4 border rounded-xl space-y-2 text-xs">
                    <span className="font-semibold text-slate-400 block uppercase">Supervising Consultant</span>
                    <p className="font-bold">{selectedTOC.signOffs?.consultantRep?.name || "Arch. Marcus Sterling"}</p>
                    <p className="text-[11px] text-emerald-600 font-semibold">✓ Approved for Practical Completion</p>
                  </div>
                  <div className="p-4 border rounded-xl space-y-2 text-xs">
                    <span className="font-semibold text-slate-400 block uppercase">Client Representative</span>
                    <p className="font-bold">{selectedTOC.signOffs?.clientRep?.name || "Client Sponsor"}</p>
                    <p className="text-[11px] text-teal-600 font-semibold">✓ Accepted & Warranty Commenced</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
