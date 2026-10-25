import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService } from "@/lib/db";
import { generateDailyLogNumber } from "@/lib/naming";
import { writeAudit } from "@/lib/audit";
import { toast } from "react-hot-toast";
import {
  DailySiteLog,
  DailyShift,
  DailyWeatherCondition,
  EquipmentStatus,
  DelayCategory,
  HousekeepingRating,
  DailyWorkActivity,
  DailyManpowerEntry,
  DailyEquipmentEntry,
  DailyDelayEntry,
  DailyQualityInspectionItem,
  DailyConcretePourItem,
  DailyDeliveryItem,
  DailyHsePermit,
  DailySiteLogPhoto,
  ProjectLevel,
  StructuralElement,
} from "@/types";
import {
  BookOpen,
  Calendar,
  Clock,
  Sun,
  Users,
  HardHat,
  ClipboardCheck,
  Truck,
  ShieldCheck,
  Eye,
  Camera,
  Plus,
  Trash2,
  Save,
  Send,
  ArrowLeft,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export const DailySiteLogCreate: React.FC = () => {
  const { id, projectId } = useParams<{ id?: string; projectId?: string }>();
  const navigate = useNavigate();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();

  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";

  const [activeTab, setActiveTab] = useState<
    "general" | "execution" | "qaqc" | "hse" | "consultant" | "photos"
  >("general");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Structural metadata for activity pickers
  const [levels, setLevels] = useState<ProjectLevel[]>([]);
  const [elements, setElements] = useState<StructuralElement[]>([]);

  // 1. General & Environmental
  const [logNumber, setLogNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState<DailyShift>("DAY");
  const [weather, setWeather] = useState<DailyWeatherCondition>("SUNNY");
  const [tempMin, setTempMin] = useState<number>(22);
  const [tempMax, setTempMax] = useState<number>(31);
  const [humidity, setHumidity] = useState<number>(65);
  const [groundConditions, setGroundConditions] = useState("Dry & Compacted");
  const [workHoursStart, setWorkHoursStart] = useState("07:00");
  const [workHoursEnd, setWorkHoursEnd] = useState("17:00");
  const [totalHours, setTotalHours] = useState(10);
  const [siteStatusNotes, setSiteStatusNotes] = useState("");

  // 2. Execution & Manpower
  const [manpower, setManpower] = useState<DailyManpowerEntry[]>([]);
  const [activities, setActivities] = useState<DailyWorkActivity[]>([]);
  const [equipment, setEquipment] = useState<DailyEquipmentEntry[]>([]);

  const [delays, setDelays] = useState<DailyDelayEntry[]>([]);

  // 3. QA/QC & Materials
  const [inspections, setInspections] = useState<DailyQualityInspectionItem[]>([
    {
      id: "qi-1",
      refNo: "RFI-REBAR-042",
      inspectionType: "Column Rebar & Starter Bars",
      levelName: "Level 02",
      elementName: "Columns C1-C8",
      trade: "Structural Steel",
      result: "PASSED",
      inspectorName: "QA/QC Lead Engineer",
    },
  ]);
  const [ncrsRaised, setNcrsRaised] = useState<string>("");
  const [ncrsClosed, setNcrsClosed] = useState<string>("");
  const [qualityNotes, setQualityNotes] = useState("");

  const [concretePours, setConcretePours] = useState<DailyConcretePourItem[]>([]);
  const [deliveries, setDeliveries] = useState<DailyDeliveryItem[]>([
    {
      id: "del-1",
      description: "High Yield Deformed Rebar Y16 & Y20",
      supplier: "Apex Steel Mills",
      ticketNumber: "DN-88492",
      quantity: "24",
      unit: "Tons",
      status: "ACCEPTED",
    },
  ]);
  const [labTestingNotes, setLabTestingNotes] = useState("");

  // 4. HSE & Safety
  const [toolboxTalkTopic, setToolboxTalkTopic] = useState(
    "Working at Heights & Scaffold Fall Arrest Safety",
  );
  const [toolboxTalkAttendees, setToolboxTalkAttendees] = useState(36);
  const [permitsToWork, setPermitsToWork] = useState<DailyHsePermit[]>([
    {
      id: "ptw-1",
      permitType: "Working at Heights",
      location: "Level 02 Perimeter Edge",
      approvedBy: "HSE Manager",
      validUntil: "17:00",
    },
  ]);
  const [incidentsReported, setIncidentsReported] = useState<number>(0);
  const [incidentDetails, setIncidentDetails] = useState("");
  const [nearMissesReported, setNearMissesReported] = useState<number>(0);
  const [housekeepingRating, setHousekeepingRating] =
    useState<HousekeepingRating>("GOOD");
  const [safetyObservations, setSafetyObservations] = useState(
    "100% PPE compliance observed across all trades. Edge protection rails inspected and cleared.",
  );

  // 5. Consultant & Governance
  const [consultantVisitorName, setConsultantVisitorName] = useState("");
  const [consultantOrganization, setConsultantOrganization] = useState("");
  const [consultantObservations, setConsultantObservations] = useState("");
  const [consultantDirectives, setConsultantDirectives] = useState("");

  // 6. Photos
  const [photos, setPhotos] = useState<DailySiteLogPhoto[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [newPhotoTrade, setNewPhotoTrade] = useState("");
  const [newPhotoLocation, setNewPhotoLocation] = useState("");

  // Load existing log if in edit mode
  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      setLoading(true);
      dbService
        .getDailySiteLog(id)
        .then((existing) => {
          if (existing) {
            setLogNumber(existing.logNumber);
            setDate(existing.generalConditions.date);
            setShift(existing.generalConditions.shift);
            setWeather(existing.generalConditions.weather);
            setTempMin(existing.generalConditions.tempMin || 22);
            setTempMax(existing.generalConditions.tempMax || 30);
            setHumidity(existing.generalConditions.humidity || 65);
            setGroundConditions(
              existing.generalConditions.groundConditions || "Normal",
            );
            setWorkHoursStart(existing.generalConditions.workHoursStart);
            setWorkHoursEnd(existing.generalConditions.workHoursEnd);
            setTotalHours(existing.generalConditions.totalHours);
            setSiteStatusNotes(existing.generalConditions.siteStatusNotes || "");

            setManpower(existing.manpower || []);
            setActivities(existing.activities || []);
            setEquipment(existing.equipment || []);
            setDelays(existing.delays || []);

            setInspections(existing.quality?.inspections || []);
            setNcrsRaised((existing.quality?.ncrsRaised || []).join(", "));
            setNcrsClosed((existing.quality?.ncrsClosed || []).join(", "));
            setQualityNotes(existing.quality?.qualityNotes || "");

            setConcretePours(existing.materials?.concretePours || []);
            setDeliveries(existing.materials?.deliveries || []);
            setLabTestingNotes(existing.materials?.labTestingNotes || "");

            setToolboxTalkTopic(existing.hse?.toolboxTalkTopic || "");
            setToolboxTalkAttendees(existing.hse?.toolboxTalkAttendees || 0);
            setPermitsToWork(existing.hse?.permitsToWork || []);
            setIncidentsReported(existing.hse?.incidentsReported || 0);
            setIncidentDetails(existing.hse?.incidentDetails || "");
            setNearMissesReported(existing.hse?.nearMissesReported || 0);
            setHousekeepingRating(existing.hse?.housekeepingRating || "GOOD");
            setSafetyObservations(existing.hse?.safetyObservations || "");

            setConsultantVisitorName(existing.consultant?.visitorName || "");
            setConsultantOrganization(existing.consultant?.organization || "");
            setConsultantObservations(existing.consultant?.observations || "");
            setConsultantDirectives(existing.consultant?.directivesIssued || "");

            setPhotos(existing.photos || []);
          }
        })
        .finally(() => setLoading(false));
    } else {
      // Set auto-generated number
      const projCode = activeProject?.code || "PRJ";
      setLogNumber(generateDailyLogNumber(projCode, date));
    }

    // Load project structural metadata
    if (currentProjId) {
      dbService.getLevels(currentProjId).then(setLevels).catch(console.error);
      dbService
        .getElements(currentProjId)
        .then(setElements)
        .catch(console.error);
    }
  }, [id, currentProjId]);

  // Recalculate work hours when start/end changes
  const calculateTotalHours = (start: string, end: string) => {
    try {
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      let diff = eh + em / 60 - (sh + sm / 60);
      if (diff < 0) diff += 24;
      setTotalHours(Math.max(1, Math.round(diff * 10) / 10));
    } catch {
      setTotalHours(10);
    }
  };

  // Helper to add activity
  const addActivityRow = () => {
    setActivities((prev) => [
      ...prev,
      {
        id: `act-${Date.now()}`,
        levelName: levels[0]?.name || "Level 01",
        trade: "General Works",
        description: "",
        progressPercentage: 0,
        status: "IN_PROGRESS",
      },
    ]);
  };

  // Helper to add manpower
  const addManpowerRow = () => {
    setManpower((prev) => [
      ...prev,
      {
        id: `mp-${Date.now()}`,
        tradeName: "",
        tradeCategory: "Civil",
        companyOrSubcontractor: "Subcontractor",
        headCount: 1,
        hoursWorked: totalHours,
        totalManHours: totalHours,
      },
    ]);
  };

  // Helper to add plant equipment
  const addEquipmentRow = () => {
    setEquipment((prev) => [
      ...prev,
      {
        id: `eq-${Date.now()}`,
        equipmentType: "",
        plantNumber: "",
        quantity: 1,
        status: "OPERATIONAL",
        hoursUsed: totalHours,
      },
    ]);
  };

  // Helper to add delay
  const addDelayRow = () => {
    setDelays((prev) => [
      ...prev,
      {
        id: `del-${Date.now()}`,
        category: "WEATHER",
        location: "Site Wide",
        impactHours: 1,
        description: "",
      },
    ]);
  };

  // Helper to add inspection
  const addInspectionRow = () => {
    setInspections((prev) => [
      ...prev,
      {
        id: `qi-${Date.now()}`,
        inspectionType: "Rebar Clearance",
        result: "PASSED",
      },
    ]);
  };

  // Helper to add concrete pour
  const addConcretePourRow = () => {
    setConcretePours((prev) => [
      ...prev,
      {
        id: `cp-${Date.now()}`,
        elementName: "Suspended Slab",
        concreteGrade: "C30/37",
        volumePoured: 25,
        status: "COMPLETED",
      },
    ]);
  };

  // Helper to add material delivery
  const addDeliveryRow = () => {
    setDeliveries((prev) => [
      ...prev,
      {
        id: `dl-${Date.now()}`,
        description: "",
        supplier: "",
        quantity: "1",
        unit: "Truckloads",
        status: "ACCEPTED",
      },
    ]);
  };

  // Helper to add photo
  const handleAddPhoto = () => {
    if (!newPhotoUrl) {
      toast.error("Please provide an image URL");
      return;
    }
    setPhotos((prev) => [
      ...prev,
      {
        id: `ph-${Date.now()}`,
        url: newPhotoUrl,
        caption: newPhotoCaption || "Site activity photograph",
        tradeTag: newPhotoTrade || "General",
        location: newPhotoLocation || "Site",
        uploadedBy: currentUser?.fullName || "Site Engineer",
        timestamp: Date.now(),
      },
    ]);
    setNewPhotoUrl("");
    setNewPhotoCaption("");
    setNewPhotoTrade("");
    setNewPhotoLocation("");
    toast.success("Photo attachment added");
  };

  const totalHeadcount = manpower.reduce(
    (acc, m) => acc + (Number(m.headCount) || 0),
    0,
  );
  const totalManHoursComputed = manpower.reduce(
    (acc, m) =>
      acc +
      (Number(m.totalManHours) ||
        (Number(m.headCount) || 0) * (Number(m.hoursWorked) || totalHours)),
    0,
  );

  const handleSave = async (submitForReview = false) => {
    if (saving) return;
    if (!currentProjId || !currentCompId) {
      toast.error("Active project workspace required.");
      return;
    }

    setSaving(true);
    try {
      let finalLogNumber = logNumber;
      if (!isEditMode) {
        try {
          const seq = await dbService.getNextSequenceNumber(currentCompId, currentProjId, "DSL");
          finalLogNumber = seq.formattedCode;
        } catch {
          finalLogNumber = logNumber || generateDailyLogNumber(activeProject?.code, date);
        }
      }

      const recordId = id || `dsl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const logRecord: DailySiteLog = {
        id: recordId,
        logNumber: finalLogNumber,
        projectId: currentProjId,
        projectName: activeProject?.name || "Project",
        projectCode: activeProject?.code || "PRJ",
        companyId: currentCompId,
        companyName: company?.name || "JQMS Enterprise",
        status: submitForReview ? "SUBMITTED" : "DRAFT",

        generalConditions: {
          date,
          shift,
          weather,
          tempMin: Number(tempMin) || 0,
          tempMax: Number(tempMax) || 0,
          humidity: Number(humidity) || 0,
          groundConditions,
          workHoursStart,
          workHoursEnd,
          totalHours,
          siteStatusNotes,
        },

        activities,
        manpower: manpower.map((m) => ({
          ...m,
          totalManHours:
            Number(m.totalManHours) ||
            (Number(m.headCount) || 0) * (Number(m.hoursWorked) || totalHours),
        })),
        equipment,
        delays,

        quality: {
          inspections,
          ncrsRaised: ncrsRaised
            ? ncrsRaised.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          ncrsClosed: ncrsClosed
            ? ncrsClosed.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          qualityNotes,
        },

        materials: {
          deliveries,
          concretePours,
          labTestingNotes,
        },

        hse: {
          toolboxTalkTopic,
          toolboxTalkAttendees: Number(toolboxTalkAttendees) || 0,
          permitsToWork,
          incidentsReported: Number(incidentsReported) || 0,
          incidentDetails,
          nearMissesReported: Number(nearMissesReported) || 0,
          housekeepingRating,
          safetyObservations,
        },

        consultant: {
          visitorName: consultantVisitorName,
          organization: consultantOrganization,
          observations: consultantObservations,
          directivesIssued: consultantDirectives,
        },

        signOffs: {
          SITE_ENGINEER: {
            role: "SITE_ENGINEER",
            signed: true,
            signedBy: {
              uid: currentUser?.uid || "author",
              name: currentUser?.fullName || "Site Engineer",
              designation: currentUser?.role || "Site Engineer",
              timestamp: Date.now(),
              digitalStamp: `JQMS-SE-${recordId.slice(-6).toUpperCase()}`,
            },
          },
        },

        photos,
        createdBy: currentUser?.uid || "user",
        createdByName: currentUser?.fullName || "Site Engineer",
        createdByRole: currentUser?.role,
        createdAt: isEditMode ? date : Date.now(),
        updatedAt: Date.now(),
      };

      await dbService.saveDailySiteLog(logRecord);

      if (currentUser) {
        await writeAudit({
          projectId: currentProjId,
          companyId: currentCompId,
          userId: currentUser.uid,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          action: isEditMode ? "EDIT_DAILY_LOG" : "CREATE_DAILY_LOG",
          module: "DAILY_SITE_LOG",
          details: `${isEditMode ? "Updated" : "Created"} Daily Site Log ${logRecord.logNumber} (${submitForReview ? "Submitted for Approval" : "Draft"})`,
        });
      }

      toast.success(
        submitForReview
          ? "Daily Site Log submitted for review & approvals!"
          : "Daily Site Log draft saved.",
      );
      navigate(`/project/daily-logs/${recordId}`);
    } catch (e) {
      console.error("Error saving daily site log:", e);
      toast.error("Failed to save daily site log.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center">
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-2" />
        Loading site log details...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 pb-20">
      {/* ─── Breadcrumbs & Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Link
            to="/project/daily-logs"
            className="hover:text-sky-600 flex items-center"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Daily Site Logs
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">
            {isEditMode ? `Edit ${logNumber}` : "New Daily Shift Log"}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="inline-flex items-center px-4 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5 mr-1" />
            Submit for Review
          </button>
        </div>
      </div>

      {/* ─── Document Title Banner ─── */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {isEditMode ? "Modify Daily Site Log" : "New Daily Site Shift Log"}
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-sky-100 text-sky-800 rounded border border-sky-300">
              ISO 9001:2015 Clause 8.5.1
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Project: <strong className="text-slate-700">{activeProject?.name || "Active Workspace"}</strong> &bull; Ref: <span className="font-mono font-bold text-sky-700">{logNumber}</span>
          </p>
        </div>

        <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 text-right flex items-center space-x-6">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Workforce</div>
            <div className="text-base font-black text-slate-800">{totalHeadcount} Personnel</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Man-Hours</div>
            <div className="text-base font-black text-sky-600">{totalManHoursComputed.toFixed(0)} hrs</div>
          </div>
        </div>
      </div>

      {/* ─── Multi-Sphere Navigation Tabs ─── */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("general")}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 whitespace-nowrap transition-colors ${
            activeTab === "general"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Sun className="w-4 h-4" />
          <span>1. General & Weather</span>
        </button>

        <button
          onClick={() => setActiveTab("execution")}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 whitespace-nowrap transition-colors ${
            activeTab === "execution"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <HardHat className="w-4 h-4" />
          <span>2. Trade Activities & Manpower</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 font-bold">
            {manpower.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("qaqc")}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 whitespace-nowrap transition-colors ${
            activeTab === "qaqc"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>3. QA/QC & Concrete</span>
        </button>

        <button
          onClick={() => setActiveTab("hse")}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 whitespace-nowrap transition-colors ${
            activeTab === "hse"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>4. HSE & Safety</span>
        </button>

        <button
          onClick={() => setActiveTab("consultant")}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 whitespace-nowrap transition-colors ${
            activeTab === "consultant"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>5. Consultant Oversight</span>
        </button>

        <button
          onClick={() => setActiveTab("photos")}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 whitespace-nowrap transition-colors ${
            activeTab === "photos"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>6. Evidence Photos ({photos.length})</span>
        </button>
      </div>

      {/* ─── TAB 1: GENERAL & ENVIRONMENTAL ─── */}
      {activeTab === "general" && (
        <div className="bg-white p-6 rounded-b-xl border border-slate-200 border-t-0 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Log Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (!isEditMode) {
                    setLogNumber(generateDailyLogNumber(activeProject?.code, e.target.value));
                  }
                }}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Site Shift
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as DailyShift)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="DAY">Day Shift</option>
                <option value="NIGHT">Night Shift</option>
                <option value="DOUBLE_SHIFT">Double Shift (Day + Night)</option>
                <option value="OVERTIME">Overtime Shift</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Log Reference Number
              </label>
              <input
                type="text"
                value={logNumber}
                onChange={(e) => setLogNumber(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 font-mono font-bold text-slate-700"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Weather Condition
              </label>
              <select
                value={weather}
                onChange={(e) =>
                  setWeather(e.target.value as DailyWeatherCondition)
                }
                className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="SUNNY">☀️ Sunny / Clear</option>
                <option value="CLEAR">🌤️ Mild / Clear</option>
                <option value="OVERCAST">☁️ Overcast / Cloudy</option>
                <option value="RAIN">🌧️ Moderate Rain</option>
                <option value="HEAVY_RAIN">⛈️ Heavy Rain / Downpour</option>
                <option value="STORMY">🌩️ Stormy / High Winds</option>
                <option value="EXTREME_HEAT">🔥 Extreme Heat (&gt;38°C)</option>
                <option value="WINDY">💨 High Winds / Dust Storm</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Temperature Range (°C)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={tempMin}
                  onChange={(e) => setTempMin(Number(e.target.value))}
                  className="w-1/2 text-xs p-2 rounded-lg border border-slate-200"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={tempMax}
                  onChange={(e) => setTempMax(Number(e.target.value))}
                  className="w-1/2 text-xs p-2 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Relative Humidity (%)
              </label>
              <input
                type="number"
                value={humidity}
                onChange={(e) => setHumidity(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-lg border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ground & Soil Condition
              </label>
              <input
                type="text"
                value={groundConditions}
                onChange={(e) => setGroundConditions(e.target.value)}
                placeholder="e.g. Dry, Muddy, Flooded"
                className="w-full text-xs p-2 rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Shift Start Time
              </label>
              <input
                type="time"
                value={workHoursStart}
                onChange={(e) => {
                  setWorkHoursStart(e.target.value);
                  calculateTotalHours(e.target.value, workHoursEnd);
                }}
                className="w-full text-xs p-2 rounded-lg border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Shift End Time
              </label>
              <input
                type="time"
                value={workHoursEnd}
                onChange={(e) => {
                  setWorkHoursEnd(e.target.value);
                  calculateTotalHours(workHoursStart, e.target.value);
                }}
                className="w-full text-xs p-2 rounded-lg border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Shift Duration
              </label>
              <div className="text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-700">
                {totalHours} Operational Hours
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              General Shift Remarks / Site Status Overview
            </label>
            <textarea
              rows={3}
              value={siteStatusNotes}
              onChange={(e) => setSiteStatusNotes(e.target.value)}
              placeholder="Record overall site operations, high-level milestone progress, site visitors, or environmental highlights..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      )}

      {/* ─── TAB 2: TRADE EXECUTION & MANPOWER ─── */}
      {activeTab === "execution" && (
        <div className="bg-white p-6 rounded-b-xl border border-slate-200 border-t-0 shadow-sm space-y-8">
          {/* Manpower Sub-section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Trade Headcount & On-Site Manpower
                </h3>
                <p className="text-[11px] text-slate-500">
                  Log personnel count per trade discipline to calculate cumulative shift man-hours.
                </p>
              </div>
              <button
                type="button"
                onClick={addManpowerRow}
                className="inline-flex items-center px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Trade
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-2.5">Trade / Discipline</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Contractor / Sub-team</th>
                    <th className="p-2.5 text-center w-24">Headcount</th>
                    <th className="p-2.5 text-center w-24">Hours</th>
                    <th className="p-2.5 text-center w-24">Man-Hours</th>
                    <th className="p-2.5 text-right w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {manpower.map((m, idx) => (
                    <tr key={m.id || idx} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={m.tradeName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setManpower((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, tradeName: val } : item,
                              ),
                            );
                          }}
                          placeholder="e.g. Carpenters, Steel Fixers"
                          className="w-full p-1 border border-slate-200 rounded text-xs font-semibold"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={m.tradeCategory || "Civil"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setManpower((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? { ...item, tradeCategory: val }
                                  : item,
                              ),
                            );
                          }}
                          className="w-full p-1 border border-slate-200 rounded text-xs"
                        >
                          <option value="Civil">Civil</option>
                          <option value="Structural">Structural</option>
                          <option value="MEP">MEP</option>
                          <option value="Finishes">Finishes</option>
                          <option value="General">General</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={m.companyOrSubcontractor || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setManpower((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? { ...item, companyOrSubcontractor: val }
                                  : item,
                              ),
                            );
                          }}
                          placeholder="e.g. Subcontractor Firm"
                          className="w-full p-1 border border-slate-200 rounded text-xs"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={m.headCount}
                          onChange={(e) => {
                            const cnt = Number(e.target.value) || 0;
                            const hrs = Number(m.hoursWorked) || totalHours;
                            setManpower((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? {
                                      ...item,
                                      headCount: cnt,
                                      totalManHours: cnt * hrs,
                                    }
                                  : item,
                              ),
                            );
                          }}
                          className="w-16 p-1 border border-slate-200 rounded text-xs text-center font-bold"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={m.hoursWorked}
                          onChange={(e) => {
                            const hrs = Number(e.target.value) || 0;
                            const cnt = Number(m.headCount) || 0;
                            setManpower((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? {
                                      ...item,
                                      hoursWorked: hrs,
                                      totalManHours: cnt * hrs,
                                    }
                                  : item,
                              ),
                            );
                          }}
                          className="w-16 p-1 border border-slate-200 rounded text-xs text-center"
                        />
                      </td>
                      <td className="p-2 text-center font-bold text-sky-700">
                        {(
                          (Number(m.headCount) || 0) *
                          (Number(m.hoursWorked) || totalHours)
                        ).toFixed(0)}
                      </td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setManpower((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activities Sub-section */}
          <div className="space-y-3 border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Site Work Activities & Progress
                </h3>
                <p className="text-[11px] text-slate-500">
                  Breakdown by level, zone, and element for complete traceability.
                </p>
              </div>
              <button
                type="button"
                onClick={addActivityRow}
                className="inline-flex items-center px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Activity
              </button>
            </div>

            <div className="space-y-3">
              {activities.map((act, idx) => (
                <div
                  key={act.id || idx}
                  className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                        Floor Level
                      </label>
                      <input
                        type="text"
                        value={act.levelName || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActivities((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, levelName: val } : item,
                            ),
                          );
                        }}
                        placeholder="e.g. Level 02, Foundation"
                        className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                        Element / Zone / Grid
                      </label>
                      <input
                        type="text"
                        value={act.elementName || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActivities((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, elementName: val } : item,
                            ),
                          );
                        }}
                        placeholder="e.g. Slab Bay 3, Columns C1-C8"
                        className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                        Trade Discipline
                      </label>
                      <input
                        type="text"
                        value={act.trade}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActivities((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, trade: val } : item,
                            ),
                          );
                        }}
                        placeholder="e.g. Formwork, Steel, MEP"
                        className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                          Status
                        </label>
                        <select
                          value={act.status}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setActivities((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, status: val } : item,
                              ),
                            );
                          }}
                          className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white font-semibold"
                        >
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="DELAYED">Delayed</option>
                          <option value="ON_HOLD">On Hold</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setActivities((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="text-slate-400 hover:text-rose-600 p-2 mt-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                        Detailed Activity & Scope Description
                      </label>
                      <input
                        type="text"
                        value={act.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActivities((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, description: val } : item,
                            ),
                          );
                        }}
                        placeholder="Describe exact work executed during this shift..."
                        className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                        Quantity Output (e.g. 50 m², 12 T)
                      </label>
                      <input
                        type="text"
                        value={act.quantityDone || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActivities((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, quantityDone: val }
                                : item,
                            ),
                          );
                        }}
                        placeholder="e.g. 140 m² shuttering"
                        className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Equipment & Delays Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-200 pt-6">
            {/* Equipment */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Plant & Heavy Equipment
                </h4>
                <button
                  type="button"
                  onClick={addEquipmentRow}
                  className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center"
                >
                  <Plus className="w-3.5 h-3.5 mr-0.5" /> Add Plant
                </button>
              </div>

              <div className="space-y-2">
                {equipment.map((eq, idx) => (
                  <div
                    key={eq.id || idx}
                    className="p-2.5 border border-slate-200 rounded-lg bg-white flex items-center space-x-2 text-xs"
                  >
                    <input
                      type="text"
                      placeholder="Equipment (e.g. Tower Crane)"
                      value={eq.equipmentType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEquipment((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, equipmentType: val } : item,
                          ),
                        );
                      }}
                      className="flex-1 p-1 border border-slate-200 rounded text-xs"
                    />
                    <select
                      value={eq.status}
                      onChange={(e) => {
                        const val = e.target.value as EquipmentStatus;
                        setEquipment((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, status: val } : item,
                          ),
                        );
                      }}
                      className="p-1 border border-slate-200 rounded text-xs font-semibold"
                    >
                      <option value="OPERATIONAL">Operational</option>
                      <option value="STANDBY">Standby</option>
                      <option value="BREAKDOWN">Breakdown</option>
                      <option value="MAINTENANCE">Maintenance</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Hours"
                      value={eq.hoursUsed}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setEquipment((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, hoursUsed: val } : item,
                          ),
                        );
                      }}
                      className="w-14 p-1 border border-slate-200 rounded text-xs text-center"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEquipment((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Delays */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Site Delays & Hindrances
                </h4>
                <button
                  type="button"
                  onClick={addDelayRow}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center"
                >
                  <Plus className="w-3.5 h-3.5 mr-0.5" /> Log Obstacle
                </button>
              </div>

              {delays.length === 0 ? (
                <div className="p-4 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">
                  No delays or work stoppages logged for this shift.
                </div>
              ) : (
                <div className="space-y-2">
                  {delays.map((del, idx) => (
                    <div
                      key={del.id || idx}
                      className="p-2.5 border border-rose-100 bg-rose-50/40 rounded-lg space-y-2 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <select
                          value={del.category}
                          onChange={(e) => {
                            const val = e.target.value as DelayCategory;
                            setDelays((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, category: val } : item,
                              ),
                            );
                          }}
                          className="p-1 border border-slate-200 rounded text-xs font-bold text-rose-700 bg-white"
                        >
                          <option value="WEATHER">Weather Stoppage</option>
                          <option value="MATERIAL">Material Shortage</option>
                          <option value="DESIGN_RFI">Design Query / RFI</option>
                          <option value="SUB_CONTRACTOR">Subcontractor</option>
                          <option value="INSPECTION_HOLD">Inspection Hold</option>
                          <option value="SAFETY">Safety Stop</option>
                          <option value="EQUIPMENT">Equipment Breakdown</option>
                          <option value="OTHER">Other Factor</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Hours"
                          value={del.impactHours}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setDelays((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, impactHours: val } : item,
                              ),
                            );
                          }}
                          className="w-16 p-1 border border-slate-200 rounded text-xs text-center bg-white"
                        />
                        <span className="text-[11px] text-slate-500">hours</span>
                        <div className="flex-1" />
                        <button
                          type="button"
                          onClick={() =>
                            setDelays((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Description of delay & mitigation action..."
                        value={del.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDelays((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, description: val } : item,
                            ),
                          );
                        }}
                        className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: QA/QC & MATERIALS ─── */}
      {activeTab === "qaqc" && (
        <div className="bg-white p-6 rounded-b-xl border border-slate-200 border-t-0 shadow-sm space-y-6">
          {/* QA/QC Hold Points */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  QA/QC Hold-Points & Site Inspections
                </h3>
                <p className="text-[11px] text-slate-500">
                  Record RFI verifications, pre-pour sign-offs, and hold-points witnessed today.
                </p>
              </div>
              <button
                type="button"
                onClick={addInspectionRow}
                className="inline-flex items-center px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Log Inspection
              </button>
            </div>

            <div className="space-y-2">
              {inspections.map((insp, idx) => (
                <div
                  key={insp.id || idx}
                  className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-xs"
                >
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                      Inspection Scope / Type
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Slab Rebar Clearance"
                      value={insp.inspectionType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInspections((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, inspectionType: val } : item,
                          ),
                        );
                      }}
                      className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                      RFI Ref No
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. RFI-088"
                      value={insp.refNo || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInspections((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, refNo: val } : item,
                          ),
                        );
                      }}
                      className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                      Result
                    </label>
                    <select
                      value={insp.result}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setInspections((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, result: val } : item,
                          ),
                        );
                      }}
                      className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white font-bold"
                    >
                      <option value="PASSED">Passed</option>
                      <option value="PASSED_AS_NOTED">Passed as Noted</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 pt-3">
                    <input
                      type="text"
                      placeholder="Inspector Name"
                      value={insp.inspectorName || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInspections((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? { ...item, inspectorName: val }
                              : item,
                          ),
                        );
                      }}
                      className="flex-1 p-1.5 border border-slate-200 rounded text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setInspections((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Concrete Pours */}
          <div className="space-y-3 border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Concrete Pouring & Cube Sampling
                </h3>
                <p className="text-[11px] text-slate-500">
                  Log volume, concrete mix grade, slump test, and cube test specimen numbers.
                </p>
              </div>
              <button
                type="button"
                onClick={addConcretePourRow}
                className="inline-flex items-center px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Log Pour
              </button>
            </div>

            {concretePours.length === 0 ? (
              <div className="p-3 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">
                No concrete pours executed during this shift.
              </div>
            ) : (
              <div className="space-y-2">
                {concretePours.map((cp, idx) => (
                  <div
                    key={cp.id || idx}
                    className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 grid grid-cols-1 md:grid-cols-5 gap-3 text-xs"
                  >
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                        Element
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Columns L2"
                        value={cp.elementName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setConcretePours((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, elementName: val } : item,
                            ),
                          );
                        }}
                        className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                        Design Grade
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. C30/37"
                        value={cp.concreteGrade}
                        onChange={(e) => {
                          const val = e.target.value;
                          setConcretePours((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, concreteGrade: val } : item,
                            ),
                          );
                        }}
                        className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                        Poured Volume (m³)
                      </label>
                      <input
                        type="number"
                        placeholder="m³"
                        value={cp.volumePoured}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setConcretePours((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, volumePoured: val } : item,
                            ),
                          );
                        }}
                        className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white font-bold text-sky-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                        Slump (mm)
                      </label>
                      <input
                        type="number"
                        placeholder="mm"
                        value={cp.slumpMm || ""}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setConcretePours((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, slumpMm: val } : item,
                            ),
                          );
                        }}
                        className="w-full p-1.5 border border-slate-200 rounded text-xs bg-white"
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-3">
                      <input
                        type="text"
                        placeholder="Cube Sample Set #"
                        value={cp.cubeSampleNumber || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setConcretePours((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, cubeSampleNumber: val }
                                : item,
                            ),
                          );
                        }}
                        className="flex-1 p-1.5 border border-slate-200 rounded text-xs bg-white font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setConcretePours((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Material Deliveries */}
          <div className="space-y-3 border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Material Deliveries Received On Site
                </h3>
                <p className="text-[11px] text-slate-500">
                  Track delivery notes and initial physical inspection status.
                </p>
              </div>
              <button
                type="button"
                onClick={addDeliveryRow}
                className="inline-flex items-center px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Log Delivery
              </button>
            </div>

            <div className="space-y-2">
              {deliveries.map((del, idx) => (
                <div
                  key={del.id || idx}
                  className="p-2.5 border border-slate-200 rounded-lg bg-white grid grid-cols-1 md:grid-cols-5 gap-2 text-xs items-center"
                >
                  <input
                    type="text"
                    placeholder="Material description"
                    value={del.description}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDeliveries((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, description: val } : item,
                        ),
                      );
                    }}
                    className="p-1 border border-slate-200 rounded font-semibold text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Supplier / Vendor"
                    value={del.supplier}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDeliveries((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, supplier: val } : item,
                        ),
                      );
                    }}
                    className="p-1 border border-slate-200 rounded text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Ticket / Delivery Note #"
                    value={del.ticketNumber || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDeliveries((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, ticketNumber: val } : item,
                        ),
                      );
                    }}
                    className="p-1 border border-slate-200 rounded font-mono text-xs"
                  />
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      placeholder="Qty"
                      value={del.quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDeliveries((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, quantity: val } : item,
                          ),
                        );
                      }}
                      className="w-16 p-1 border border-slate-200 rounded text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Unit"
                      value={del.unit}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDeliveries((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, unit: val } : item,
                          ),
                        );
                      }}
                      className="w-16 p-1 border border-slate-200 rounded text-xs"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={del.status}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setDeliveries((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, status: val } : item,
                          ),
                        );
                      }}
                      className="flex-1 p-1 border border-slate-200 rounded text-xs font-bold"
                    >
                      <option value="ACCEPTED">Accepted</option>
                      <option value="APPROVED_AS_NOTED">Approved as Noted</option>
                      <option value="PARTIALLY_ACCEPTED">Partially Accepted</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="HOLD_FOR_TESTING">Hold for Lab</option>
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        setDeliveries((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: HSE & SAFETY ─── */}
      {activeTab === "hse" && (
        <div className="bg-white p-6 rounded-b-xl border border-slate-200 border-t-0 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Morning Toolbox Talk (TBT) Topic
              </label>
              <input
                type="text"
                value={toolboxTalkTopic}
                onChange={(e) => setToolboxTalkTopic(e.target.value)}
                placeholder="e.g. Safe Lifting, Edge Protection, Scaffolding"
                className="w-full text-xs p-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                TBT Attendance (Workers Briefed)
              </label>
              <input
                type="number"
                value={toolboxTalkAttendees}
                onChange={(e) =>
                  setToolboxTalkAttendees(Number(e.target.value))
                }
                className="w-full text-xs p-2 rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Incidents / First Aid Reported
              </label>
              <input
                type="number"
                min="0"
                value={incidentsReported}
                onChange={(e) =>
                  setIncidentsReported(Number(e.target.value))
                }
                className={`w-full text-xs p-2 rounded-lg border font-bold ${
                  incidentsReported > 0
                    ? "border-rose-400 bg-rose-50 text-rose-700"
                    : "border-slate-200 text-emerald-700"
                }`}
              />
              <span className="text-[10px] text-slate-400">
                {incidentsReported === 0 ? "✅ Zero Accidents Logged" : "⚠️ Incident Action Required"}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Near-Misses Logged
              </label>
              <input
                type="number"
                min="0"
                value={nearMissesReported}
                onChange={(e) =>
                  setNearMissesReported(Number(e.target.value))
                }
                className="w-full text-xs p-2 rounded-lg border border-slate-200 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Site Housekeeping Score
              </label>
              <select
                value={housekeepingRating}
                onChange={(e) =>
                  setHousekeepingRating(e.target.value as HousekeepingRating)
                }
                className="w-full text-xs p-2 rounded-lg border border-slate-200 font-bold"
              >
                <option value="EXCELLENT">Excellent (Immaculate Order)</option>
                <option value="GOOD">Good (Safe & Clear Access)</option>
                <option value="SATISFACTORY">Satisfactory (Minor Cleanup Needed)</option>
                <option value="POOR">Poor (Hazardous Obstructions)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Safety & Environmental Observations
            </label>
            <textarea
              rows={3}
              value={safetyObservations}
              onChange={(e) => setSafetyObservations(e.target.value)}
              placeholder="Detail PPE audits, perimeter edge checks, fire extinguisher inspection, dust control..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
            />
          </div>
        </div>
      )}

      {/* ─── TAB 5: CONSULTANT & GOVERNANCE ─── */}
      {activeTab === "consultant" && (
        <div className="bg-white p-6 rounded-b-xl border border-slate-200 border-t-0 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Consultant / Client Representative Name
              </label>
              <input
                type="text"
                value={consultantVisitorName}
                onChange={(e) => setConsultantVisitorName(e.target.value)}
                placeholder="e.g. Lead Supervising Consultant"
                className="w-full text-xs p-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Firm / Organization
              </label>
              <input
                type="text"
                value={consultantOrganization}
                onChange={(e) => setConsultantOrganization(e.target.value)}
                placeholder="e.g. Royal Engineering Consultants"
                className="w-full text-xs p-2 rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Site Walk Observations & Remarks
            </label>
            <textarea
              rows={3}
              value={consultantObservations}
              onChange={(e) => setConsultantObservations(e.target.value)}
              placeholder="Record any comments, quality approvals, or directives noted during the consultant's site walk..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Formal Directives Issued
            </label>
            <textarea
              rows={2}
              value={consultantDirectives}
              onChange={(e) => setConsultantDirectives(e.target.value)}
              placeholder="Verbal instructions or instructions referenced (e.g. SI references)..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
            />
          </div>
        </div>
      )}

      {/* ─── TAB 6: PHOTOS & EVIDENCE ─── */}
      {activeTab === "photos" && (
        <div className="bg-white p-6 rounded-b-xl border border-slate-200 border-t-0 shadow-sm space-y-6">
          {/* Add photo card */}
          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Add Photo Attachment
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Image URL (or Cloudinary / Firebase Storage URL)"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
              />
              <input
                type="text"
                placeholder="Photo Caption / Description"
                value={newPhotoCaption}
                onChange={(e) => setNewPhotoCaption(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
              />
              <input
                type="text"
                placeholder="Trade Tag (e.g. Rebar, Formwork, Concrete)"
                value={newPhotoTrade}
                onChange={(e) => setNewPhotoTrade(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Location / Element"
                  value={newPhotoLocation}
                  onChange={(e) => setNewPhotoLocation(e.target.value)}
                  className="flex-1 text-xs p-2 rounded-lg border border-slate-200 bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Add Photo
                </button>
              </div>
            </div>
          </div>

          {/* Photo gallery preview */}
          {photos.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">
              No photo evidence attached yet. Add photo URLs above.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 relative group"
                >
                  <img
                    src={p.url}
                    alt={p.caption}
                    className="w-full h-36 object-cover"
                  />
                  <div className="p-2 text-xs">
                    <div className="font-bold text-slate-800 truncate">
                      {p.caption}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {p.tradeTag} &bull; {p.location}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPhotos((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="absolute top-2 right-2 p-1 bg-white/90 text-rose-600 rounded-full shadow hover:bg-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Bottom Persistent Action Bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-slate-200 py-3 px-6 z-20 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span>Ref: <strong className="font-mono text-slate-700">{logNumber}</strong></span>
          <span>&bull;</span>
          <span>Date: <strong>{date}</strong></span>
          <span>&bull;</span>
          <span>Shift: <strong>{shift}</strong></span>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/project/daily-logs"
            className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow transition-colors flex items-center"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Submit for Review & Signatures
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailySiteLogCreate;

