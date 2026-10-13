import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import { LevelElementSelect } from "@/components/sitecomments/LevelElementSelect";
import {
  ConcreteCubeSample,
  TestAge,
  IndividualCubeRecord,
  NonConformanceReport,
} from "@/types";
import { generateNcrNumber } from "@/lib/naming";
import { plannerSync } from "@/lib/plannerSync";
import {
  FlaskConical,
  ArrowLeft,
  Save,
  Building2,
  Layers,
  Thermometer,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ShieldCheck,
  Award,
  Hash,
  Info,
  Check,
} from "lucide-react";
import { toast } from "react-hot-toast";

export const CubeForm: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentUser, company } = useAuthStore();
  const { activeProject } = useProjectStore();
  const currentProjId = activeProject?.id || projectId || "proj-skyline-tower";
  const currentCompId =
    currentUser?.companyId ||
    company?.id ||
    activeProject?.companyId ||
    "comp-apex-civil";
  const canCreateSample = hasPermission(currentUser?.role, "CREATE_CONCRETE_SAMPLE");

  // Section 1: Structural Location & Traceability
  const [sampleId, setSampleId] = useState(
    () =>
      `CDL-BS-CUBE-${String(Math.floor(Math.random() * 800 + 100)).padStart(4, "0")}`,
  );
  const [inscribedName, setInscribedName] = useState("S3");
  const [levelId, setLevelId] = useState(activeProject?.currentLevelId || "");
  const [levelName, setLevelName] = useState(
    activeProject?.currentLevelName || "0 - Foundation",
  );
  const [elementId, setElementId] = useState("");
  const [elementName, setElementName] = useState("Pile Cap");
  const [zone, setZone] = useState("PILE CAPS 4, 5, 6, 7");
  const [block, setBlock] = useState("");
  const [chainage, setChainage] = useState("");
  const [gridReference, setGridReference] = useState("");
  const [pourReference, setPourReference] = useState("PTP-2026-0012");
  const [ITPReference, setITPReference] = useState("ITP-CIV-004");
  const [RFINumber, setRFINumber] = useState("RFI-2026-088");
  const [drawingReference, setDrawingReference] = useState("DWG-STR-104-REV2");

  // Section 2: Concrete Mix Design & Delivery
  const [concreteGrade, setConcreteGrade] = useState("C30");
  const [target28DayStrength, setTarget28DayStrength] = useState<number>(30);
  const [mixType, setMixType] = useState<string>("Design Mix");
  const [cementType, setCementType] = useState<string>("OPC Type I");
  const [supplier, setSupplier] = useState("LEVITICAL");
  const [batchingPlant, setBatchingPlant] = useState(
    "Central ReadyMix Plant #1",
  );
  const [truckNumber, setTruckNumber] = useState("TRK-884");
  const [batchTicketNumber, setBatchTicketNumber] = useState("BT-99014");
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState("DN-99412");
  const [maximumAggregateSize, setMaximumAggregateSize] = useState("20mm");
  const [aggregateSource, setAggregateSource] = useState(
    "Quarry A Crushed Granite",
  );
  const [admixtureType, setAdmixtureType] = useState(
    "Polycarboxylate Superplasticizer",
  );
  const [admixtureDosage, setAdmixtureDosage] = useState("0.8% by cement wt");
  const [waterCementRatio, setWaterCementRatio] = useState<number | string>(
    "0.40",
  );

  // Section 3: Fresh Concrete Field Tests & Acceptance
  const [slumpMm, setSlumpMm] = useState<number>(120);
  const [slumpTestTime, setSlumpTestTime] = useState("09:15");
  const [freshConcreteAccepted, setFreshConcreteAccepted] =
    useState<boolean>(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [concreteTempCelsius, setConcreteTempCelsius] = useState<number>(28.5);
  const [ambientTemperature, setAmbientTemperature] = useState("32°C");
  const [densityKgM3, setDensityKgM3] = useState<number>(2420);
  const [airContent, setAirContent] = useState("1.8%");
  const [samplingMethod, setSamplingMethod] = useState("BS EN 12350-1");
  const [sampleCondition, setSampleCondition] = useState("Good");
  const [castDate, setCastDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [castTime, setCastTime] = useState("09:11");
  const [samplerName, setSamplerName] = useState(
    currentUser?.fullName || "QA/QC Site Technician",
  );
  const [qaqcInspector, setQaqcInspector] = useState(
    "Eng. David K. (QA/QC Eng)",
  );

  // Section 4: Specimen Molds & Curing Regimen
  const [cubeSize, setCubeSize] = useState<string>("150x150x150mm");
  const [cubeSizeMm, setCubeSizeMm] = useState<number>(150);
  const [cubeCount, setCubeCount] = useState<number>(6);
  const [cubeType, setCubeType] = useState("Standard");
  const [curingMethod, setCuringMethod] = useState<string>("Water Tank");
  const [curingTank, setCuringTank] = useState("Tank #1");
  const [curingStartDate, setCuringStartDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [curingTemperature, setCuringTemperature] = useState("20°C ± 2°C");

  // Test Ages selection
  const [selectedAges, setSelectedAges] = useState<number[]>([7, 28]);

  // Section 5: Testing Laboratory & Approvals
  const [testingLaboratory, setTestingLaboratory] = useState("LSMTL");
  const [testingMachine, setTestingMachine] = useState(
    "Automatic Digital Compression Machine",
  );
  const [machineCalibrationCertificate, setMachineCalibrationCertificate] =
    useState("CAL-2025-9921");
  const [laboratoryAccreditationNumber, setLaboratoryAccreditationNumber] =
    useState("ISO/IEC 17025:2017 #4421");
  const [preparedBy, setPreparedBy] = useState("QA/QC Site Team");
  const [reviewedBy, setReviewedBy] = useState("Materials QA Lead");
  const [approvedBy, setApprovedBy] = useState("Consultant Resident Engineer");
  const [remarks, setRemarks] = useState(
    "Cubes prepared in accordance with BS EN 12390-1. Standard moist cured.",
  );

  // Auto calculate Slump Class
  const slumpClass = useMemo(() => {
    if (slumpMm <= 40) return "S1 (10-40mm)";
    if (slumpMm <= 90) return "S2 (50-90mm)";
    if (slumpMm <= 150) return "S3 (100-150mm)";
    if (slumpMm <= 210) return "S4 (160-210mm)";
    return "S5 (≥220mm)";
  }, [slumpMm]);

  // Handle grade selection change & auto update target strength
  const handleGradeChange = (val: string) => {
    setConcreteGrade(val);
    const match = val.match(/\d+/);
    if (match) {
      setTarget28DayStrength(Number(match[0]));
    }
  };

  // Toggle Test Age
  const toggleAge = (age: number) => {
    if (selectedAges.includes(age)) {
      if (selectedAges.length === 1) {
        toast.error("At least one test age is required.");
        return;
      }
      setSelectedAges(selectedAges.filter((a) => a !== age));
    } else {
      setSelectedAges([...selectedAges, age].sort((a, b) => a - b));
    }
  };

  const handleCubeSizeSelect = (sizeStr: string) => {
    setCubeSize(sizeStr);
    if (sizeStr.startsWith("100")) setCubeSizeMm(100);
    else if (sizeStr.startsWith("200")) setCubeSizeMm(200);
    else setCubeSizeMm(150);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateSample) {
      toast.error("You do not have permission to register concrete samples");
      return;
    }
    if (!currentProjId) {
      toast.error("Project ID missing");
      return;
    }

    const castDateObj = new Date(castDate);

    // Compute scheduled dates
    const day1Date = selectedAges.includes(1)
      ? new Date(castDateObj.getTime() + 1 * 86400000)
          .toISOString()
          .split("T")[0]
      : null;
    const day3Date = selectedAges.includes(3)
      ? new Date(castDateObj.getTime() + 3 * 86400000)
          .toISOString()
          .split("T")[0]
      : null;
    const day7Date = selectedAges.includes(7)
      ? new Date(castDateObj.getTime() + 7 * 86400000)
          .toISOString()
          .split("T")[0]
      : null;
    const day14Date = selectedAges.includes(14)
      ? new Date(castDateObj.getTime() + 14 * 86400000)
          .toISOString()
          .split("T")[0]
      : null;
    const day28Date = selectedAges.includes(28)
      ? new Date(castDateObj.getTime() + 28 * 86400000)
          .toISOString()
          .split("T")[0]
      : null;

    const day1Required = Number((target28DayStrength * 0.35).toFixed(1));
    const day3Required = Number((target28DayStrength * 0.5).toFixed(1));
    const day7Required = Number((target28DayStrength * 0.7).toFixed(1));
    const day14Required = Number((target28DayStrength * 0.85).toFixed(1));
    const day28Required = Number(target28DayStrength.toFixed(1));

    // Generate individual cube entries
    const generatedCubes: IndividualCubeRecord[] = Array.from(
      { length: cubeCount },
      (_, i) => ({
        cubeId: `AUTO-${String(i + 1).padStart(3, "0")}`,
        cubeMark: `CUBE-${String(i + 1).padStart(3, "0")}`,
        cureLocation: curingTank || "Tank #1",
        mouldNumber: `M-${String(i + 1).padStart(2, "0")}`,
      }),
    );

    const newSample: ConcreteCubeSample = {
      id: `cube-${Date.now()}`,
      sampleId: sampleId.trim() || `CUBE-${Date.now()}`,
      inscribedName: inscribedName.trim() || "S1",
      projectId: currentProjId,
      companyId: currentCompId,
      elementId,
      elementName: elementName || "Structural Element",
      structureElement: elementName || "Structural Element",
      levelId,
      levelName: levelName || "Site Level",
      level: levelName || "Site Level",
      zone: zone || undefined,
      block: block || undefined,
      chainage: chainage || undefined,
      gridReference: gridReference || undefined,
      pourReference: pourReference || undefined,
      ITPReference: ITPReference || undefined,
      RFINumber: RFINumber || undefined,
      drawingReference: drawingReference || undefined,

      concreteGrade,
      target28DayStrengthNmm2: target28DayStrength,
      mixType,
      cementType,
      supplier,
      batchingPlant,
      truckNumber,
      batchTicketNumber,
      deliveryNoteNumber,
      maximumAggregateSize,
      aggregateSource,
      admixtureType,
      admixtureDosage,
      waterCementRatio: Number(waterCementRatio) || waterCementRatio,

      slumpMm: Number(slumpMm),
      slumpResult: String(slumpMm),
      slumpClass,
      slumpTestTime,
      freshConcreteAccepted,
      rejectionReason: freshConcreteAccepted ? undefined : rejectionReason,
      concreteTempCelsius: Number(concreteTempCelsius),
      concreteTemperature: `${concreteTempCelsius}°C`,
      ambientTemperature,
      densityKgM3: Number(densityKgM3),
      density: densityKgM3,
      airContent,
      samplingMethod,
      sampleCondition,
      castDate,
      castTime,
      samplerName,
      sampledBy: samplerName,
      qaqcInspector,

      cubeCount: Number(cubeCount),
      numCubes: Number(cubeCount),
      cubeSize,
      cubeSizeMm,
      cubeType,
      cubes: generatedCubes,

      curingMethod,
      curingTank,
      curingTankNumber: curingTank,
      curingStartDate,
      curingTemperature,

      testAges: selectedAges as TestAge[],
      day1Date,
      day3Date,
      day7Date,
      day14Date,
      day28Date,
      day1Required,
      day3Required,
      day7Required,
      day14Required,
      day28Required,

      testingLaboratory,
      testingMachine,
      machineCalibrationCertificate,
      laboratoryAccreditationNumber,

      preparedBy,
      preparedByDate: castDate,
      reviewedBy,
      approvedBy,
      remarks,

      status: freshConcreteAccepted ? "CURING" : "REJECTED",
      overallStatus: freshConcreteAccepted ? "CURING" : "REJECTED",
      ncrGenerated: !freshConcreteAccepted,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      tests: {
        ...(selectedAges.includes(7) && {
          day7: {
            testAgeDays: 7,
            scheduledDate: day7Date || "",
            cubeDimensionsMm: {
              length: cubeSizeMm,
              width: cubeSizeMm,
              height: cubeSizeMm,
            },
            targetStrengthNmm2: day7Required,
            compliance: "PENDING",
            averageStrengthNmm2: 0,
            requiredStrengthNmm2: day7Required,
            percentageOfTarget: 0,
          },
        }),
        ...(selectedAges.includes(28) && {
          day28: {
            testAgeDays: 28,
            scheduledDate: day28Date || "",
            cubeDimensionsMm: {
              length: cubeSizeMm,
              width: cubeSizeMm,
              height: cubeSizeMm,
            },
            targetStrengthNmm2: day28Required,
            compliance: "PENDING",
            averageStrengthNmm2: 0,
            requiredStrengthNmm2: day28Required,
            percentageOfTarget: 0,
          },
        }),
      },
    };

    try {
      if (!freshConcreteAccepted) {
        const projectCode = activeProject?.code?.toUpperCase() || "";
        const ncrNumber = generateNcrNumber(projectCode);
        const ncrId = `ncr-${Date.now()}`;
        const timestamp = Date.now();

        const ncrPayload: NonConformanceReport = {
          id: ncrId,
          ncrNumber: ncrNumber,
          title: `Fresh Concrete Delivery Rejection: ${sampleId} (${inscribedName ? `Mark ${inscribedName} - ` : ""}${elementName || "Structural Element"})`,
          description: `Fresh concrete delivery for ${elementName || "Element"} at ${levelName || "Location"} was REJECTED during field acceptance tests.
Reason for Rejection: ${rejectionReason || "Slump or temperature exceeded allowable tolerances"}.
Supplier: ${supplier} | Batch Ticket: ${batchTicketNumber || deliveryNoteNumber || "—"} | Truck: ${truckNumber || "—"}
Measured Slump: ${slumpMm} mm | Concrete Temp: ${concreteTempCelsius}°C.`,
          descriptionItems: [
            `Fresh concrete rejected at discharge.`,
            `Reason: ${rejectionReason || "Out of specification"}`,
            `Truck Number: ${truckNumber || "—"}, Batch Ticket: ${batchTicketNumber || "—"}`,
          ],
          status: "OPEN",
          priority: "HIGH",
          severity: "HIGH",
          photos: [],
          category: "Structural Concrete",
          location: levelName,
          elementName: elementName || "Concrete Structure",
          elementId: elementId || sampleId,
          structuralElementId: elementId || sampleId,
          locationLevel: levelName,
          gridLine: zone || "",
          dateFound: castDate,
          deadline: new Date(Date.now() + 3 * 86400000)
            .toISOString()
            .split("T")[0],
          trade: "Civil / Structural",
          tradeId: "trade-civil-structural",
          subtrade: "Concrete Works",
          subtradeId: "subtrade-concrete",
          rootCauseType: "Material Defect",
          rootCause: `Material Defect: Rejected fresh concrete delivery batch`,
          correctiveAction: `Batch rejected and returned to plant. Issue concession/replacement load.`,
          correctiveActions: [
            {
              id: `ca-${Date.now()}-1`,
              actionText: `Reject truck load and record return docket`,
              assignedTo: samplerName || "QA/QC Inspector",
              targetDate: castDate,
              status: "COMPLETED",
            },
          ],
          preventiveAction: `Review batching plant transit time and dosage controls with supplier ${supplier}.`,
          raisedBy: {
            uid: currentUser?.uid || "system",
            name: currentUser?.fullName || samplerName || "QA/QC Inspector",
            role: currentUser?.role || "QA/QC Inspector",
            date: castDate,
          },
          raisedByName:
            currentUser?.fullName || samplerName || "QA/QC Inspector",
          reportedBy: currentUser?.fullName || samplerName || "QA/QC Inspector",
          assignedTo: "",
          assignedToName: supplier || "Concrete Supplier",
          projectId: currentProjId,
          projectName: activeProject?.name || "Project",
          projectAddress: activeProject?.location || "",
          companyId: currentCompId,
          companyName:
            currentUser?.companyName || company?.name || "JQMS Enterprise",
          attachments: [],
          statusHistory: [
            {
              status: "OPEN",
              userId: currentUser?.uid || "system",
              userName:
                currentUser?.fullName || samplerName || "QA/QC Inspector",
              comment: `NCR issued for rejected concrete batch: ${rejectionReason || "Out of specification"}`,
              timestamp,
            },
          ],
          createdAt: timestamp,
          updatedAt: timestamp,
          finalStatus: "PENDING",
          qaqcEngineerName: qaqcInspector || currentUser?.fullName || "",
          signDate: castDate,
        };

        await dbService.saveNCR(ncrPayload);

        await plannerSync.syncEvent({
          relatedId: ncrPayload.id,
          relatedModule: "ncr",
          title: `NCR Issued: Fresh Concrete Rejection (${ncrNumber})`,
          description: `Batch rejected for ${elementName}: ${rejectionReason || "Out of specification"}`,
          startDate: castDate,
          startTime: castTime || "09:00",
          eventType: "CUSTOM",
          status: "SCHEDULED",
          location: `${levelName} ${zone}`.trim(),
          projectId: currentProjId,
          companyId: currentCompId,
          createdBy: currentUser?.uid || "system",
          eventKey: "found",
        });

        newSample.ncrNumber = ncrNumber;
        newSample.ncrDetails = {
          ncrId,
          ncrNumber,
          status: "OPEN",
          generatedAt: timestamp,
          generatedBy: currentUser?.fullName || "QA/QC Inspector",
          triggeredByAge: 0 as TestAge,
          actualStrengthNmm2: 0,
          requiredStrengthNmm2: target28DayStrength,
          proposedAction: "DEMOLITION_REBUILD",
        };
      }

      await dbService.saveCubeSample(newSample);

      if (currentUser) {
        await writeAudit({
          projectId: currentProjId,
          companyId: currentCompId,
          userId: currentUser.uid,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          action: !freshConcreteAccepted
            ? "GENERATE_NCR"
            : "LOG_CONCRETE_SAMPLE",
          module: "Concrete",
          details: `Logged concrete cube sample ${sampleId} (Inscribed: ${inscribedName}, Grade: ${concreteGrade}) for ${elementName || "Element"}${!freshConcreteAccepted ? ` - REJECTED (NCR Issued)` : ""}`,
          newValue: newSample,
        });
      }

      toast.success(
        freshConcreteAccepted
          ? `Cube sample ${sampleId} successfully registered!`
          : `Sample ${sampleId} registered as REJECTED. Non-conformance report issued!`,
      );
      navigate(`/project/${currentProjId}/concrete/${newSample.id}`);
    } catch (err: any) {
      console.error("Failed to save cube sample:", err);
      toast.error("Failed to save cube sample.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300 text-slate-900 dark:text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/project/concrete")}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-xs uppercase tracking-wider mb-0.5">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>BS EN 12390 & ASTM C39 Concrete Quality Control</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Log Concrete Field Sample & Molds
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Mark: {inscribedName || "—"}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold border border-slate-200 dark:border-slate-700">
            {sampleId}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Section 1: Structural Location & Quality References */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                  Structural Location & Traceability
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Element designation, zone, and statutory QA/QC references
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
              Mandatory Traceability
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Sample Serial ID *
              </label>
              <input
                type="text"
                value={sampleId}
                onChange={(e) => setSampleId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                placeholder="e.g. CDL-BS-CUBE-0002"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Inscribed Mark / Cube Code *
              </label>
              <input
                type="text"
                value={inscribedName}
                onChange={(e) => setInscribedName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                placeholder="e.g. S3, C1-P4"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Permit to Pour (PTP) Ref #
              </label>
              <input
                type="text"
                value={pourReference}
                onChange={(e) => setPourReference(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                placeholder="e.g. PTP-2026-0012"
              />
            </div>
          </div>

          <LevelElementSelect
            projectId={currentProjId}
            companyId={currentCompId}
            selectedLevelId={levelId}
            selectedLevelName={levelName}
            selectedElementId={elementId}
            selectedElementName={elementName}
            onLevelChange={(lId, lName) => {
              setLevelId(lId);
              setLevelName(lName);
            }}
            onElementChange={(elId, elName) => {
              setElementId(elId);
              setElementName(elName);
            }}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Zone / Pour Bay
              </label>
              <input
                type="text"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g. PILE CAPS 4, 5, 6, 7"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Block / Structure
              </label>
              <input
                type="text"
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Tower A"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                ITP Reference
              </label>
              <input
                type="text"
                value={ITPReference}
                onChange={(e) => setITPReference(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                placeholder="e.g. ITP-CIV-004"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                RFI / Drawing Number
              </label>
              <input
                type="text"
                value={RFINumber}
                onChange={(e) => setRFINumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-indigo-500"
                placeholder="e.g. RFI-2026-088"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Concrete Mix Design & Supplier Details */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                  Concrete Mix Specification & Batching Logistics
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Mix proportions, cement grade, supplier batch tickets
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider">
              Mix Design
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Concrete Grade *
              </label>
              <select
                value={concreteGrade}
                onChange={(e) => handleGradeChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold font-mono focus:outline-none focus:border-amber-500"
              >
                <option value="C20/25">C20/25 (20 MPa)</option>
                <option value="C25/30">C25/30 (25 MPa)</option>
                <option value="C30">C30 (30 MPa)</option>
                <option value="C30/37">C30/37 (30 MPa)</option>
                <option value="C35/45">C35/45 (35 MPa)</option>
                <option value="C40/50">C40/50 (40 MPa)</option>
                <option value="C50/60">C50/60 (50 MPa)</option>
                <option value="C60/75">C60/75 (60 MPa)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Target 28-Day Strength (MPa) *
              </label>
              <input
                type="number"
                step="0.5"
                value={target28DayStrength}
                onChange={(e) => setTarget28DayStrength(Number(e.target.value))}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Mix Type
              </label>
              <select
                value={mixType}
                onChange={(e) => setMixType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Design Mix">Design Mix</option>
                <option value="Prescribed Mix">Prescribed Mix</option>
                <option value="Standard Mix">Standard Mix</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Cement Type
              </label>
              <select
                value={cementType}
                onChange={(e) => setCementType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              >
                <option value="OPC Type I">OPC Type I (CEM I 42.5N)</option>
                <option value="OPC Type II">
                  OPC Type II (Moderate Sulfate)
                </option>
                <option value="SRC Type V">
                  SRC Type V (Sulfate Resistant)
                </option>
                <option value="GGBS 50% Mix">GGBS 50% Slag Blend</option>
                <option value="PFA / Fly Ash 30%">
                  PFA / Fly Ash 30% Blend
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Supplier / ReadyMix Firm *
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-semibold"
                placeholder="e.g. LEVITICAL"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Batching Plant
              </label>
              <input
                type="text"
                value={batchingPlant}
                onChange={(e) => setBatchingPlant(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                placeholder="e.g. Plant #1"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Batch Ticket #
              </label>
              <input
                type="text"
                value={batchTicketNumber}
                onChange={(e) => setBatchTicketNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                placeholder="e.g. BT-99014"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Truck Mixer #
              </label>
              <input
                type="text"
                value={truckNumber}
                onChange={(e) => setTruckNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                placeholder="e.g. TRK-884"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Max Aggregate Size
              </label>
              <input
                type="text"
                value={maximumAggregateSize}
                onChange={(e) => setMaximumAggregateSize(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                placeholder="e.g. 20mm"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Admixture Type & Dosage
              </label>
              <input
                type="text"
                value={admixtureType}
                onChange={(e) => setAdmixtureType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                placeholder="e.g. Superplasticizer 0.8%"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                W/C Ratio
              </label>
              <input
                type="text"
                value={waterCementRatio}
                onChange={(e) => setWaterCementRatio(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                placeholder="e.g. 0.40"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Fresh Concrete Field Tests & Acceptance */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                  Fresh Concrete Field Tests & On-Site Acceptance
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Slump workability, temperatures, density, and acceptance
                  decision
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFreshConcreteAccepted(true)}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                  freshConcreteAccepted
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ACCEPTED</span>
              </button>
              <button
                type="button"
                onClick={() => setFreshConcreteAccepted(false)}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                  !freshConcreteAccepted
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>REJECTED</span>
              </button>
            </div>
          </div>

          {!freshConcreteAccepted && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
              <label className="block text-rose-700 dark:text-rose-300 font-bold mb-1">
                Reason for Fresh Concrete Batch Rejection *
              </label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required={!freshConcreteAccepted}
                placeholder="e.g. Slump collapse (260mm) exceeding specified tolerance (120±25mm)"
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-100 text-xs focus:outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Slump Result (mm) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={slumpMm}
                  onChange={(e) => setSlumpMm(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                  mm
                </span>
              </div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                Class: {slumpClass}
              </p>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Concrete Temp (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={concreteTempCelsius}
                onChange={(e) => setConcreteTempCelsius(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Limit: max 32°C (BS 8500)
              </p>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Ambient Temp
              </label>
              <input
                type="text"
                value={ambientTemperature}
                onChange={(e) => setAmbientTemperature(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                placeholder="e.g. 32°C"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Fresh Density (kg/m³)
              </label>
              <input
                type="number"
                value={densityKgM3}
                onChange={(e) => setDensityKgM3(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Cast Date *
              </label>
              <input
                type="date"
                value={castDate}
                onChange={(e) => setCastDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Cast Time *
              </label>
              <input
                type="time"
                value={castTime}
                onChange={(e) => setCastTime(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Sampling Method Standard
              </label>
              <input
                type="text"
                value={samplingMethod}
                onChange={(e) => setSamplingMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                placeholder="e.g. BS EN 12350-1"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Sampler / Materials Tech
              </label>
              <input
                type="text"
                value={samplerName}
                onChange={(e) => setSamplerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Specimen Molds & Curing Regimen */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                  Specimen Mold Registry & Statutory Curing Regimen
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cube dimensions, bath curing tanks, and test age schedule
                  targets
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider">
              BS EN 12390-2
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Cube Dimensions
              </label>
              <select
                value={cubeSize}
                onChange={(e) => handleCubeSizeSelect(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="150x150x150mm">
                  150 x 150 x 150 mm (Standard)
                </option>
                <option value="100x100x100mm">
                  100 x 100 x 100 mm (Agg ≤ 20mm)
                </option>
                <option value="200x200x200mm">
                  200 x 200 x 200 mm (Mass Concrete)
                </option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Cubes Cast (Count) *
              </label>
              <input
                type="number"
                min="1"
                max="18"
                value={cubeCount}
                onChange={(e) => setCubeCount(Number(e.target.value))}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Curing Regimen
              </label>
              <select
                value={curingMethod}
                onChange={(e) => setCuringMethod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Water Tank">Water Tank (Submerged 20°C)</option>
                <option value="Water Tank (20°C)">
                  Water Tank (20°C ± 2°C)
                </option>
                <option value="Site Wet Burlap">Site Wet Burlap Curing</option>
                <option value="Curing Compound">Curing Compound</option>
                <option value="Steam Cured">Steam Cured</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Curing Tank / Location
              </label>
              <input
                type="text"
                value={curingTank}
                onChange={(e) => setCuringTank(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                placeholder="e.g. Tank #1"
              />
            </div>
          </div>

          {/* Test Ages Selector */}
          <div className="pt-2">
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">
              Scheduled Test Ages & Target Strengths:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                {
                  age: 1,
                  label: "1 Day",
                  pct: "35%",
                  req: (target28DayStrength * 0.35).toFixed(1),
                },
                {
                  age: 3,
                  label: "3 Days",
                  pct: "50%",
                  req: (target28DayStrength * 0.5).toFixed(1),
                },
                {
                  age: 7,
                  label: "7 Days",
                  pct: "70%",
                  req: (target28DayStrength * 0.7).toFixed(1),
                },
                {
                  age: 14,
                  label: "14 Days",
                  pct: "85%",
                  req: (target28DayStrength * 0.85).toFixed(1),
                },
                {
                  age: 28,
                  label: "28 Days",
                  pct: "100%",
                  req: target28DayStrength.toFixed(1),
                },
              ].map(({ age, label, pct, req }) => {
                const isSelected = selectedAges.includes(age);
                return (
                  <button
                    key={age}
                    type="button"
                    onClick={() => toggleAge(age)}
                    className={`p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20"
                        : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {label}
                      </span>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded border border-slate-300 dark:border-slate-700" />
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                      {req} MPa ({pct})
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Individual Specimen Auto Breakdown */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                Generated Specimen Tags ({cubeCount} Cubes)
              </span>
              <span className="text-[11px] text-slate-400">
                Individual mould tracking
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {Array.from({ length: Math.min(cubeCount, 12) }, (_, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center font-mono"
                >
                  <div className="text-[10px] text-slate-400">
                    Cube #{i + 1}
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    CUBE-{String(i + 1).padStart(3, "0")}
                  </div>
                  <div className="text-[9px] text-emerald-600 dark:text-emerald-400">
                    Mould M-{String(i + 1).padStart(2, "0")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 5: Testing Laboratory & QA Signatures */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                5
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                  Testing Laboratory & Compliance Accreditation
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  ISO/IEC 17025 accredited laboratory, test machine, and witness
                  signoffs
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wider">
              Accredited Laboratory
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Testing Laboratory
              </label>
              <input
                type="text"
                value={testingLaboratory}
                onChange={(e) => setTestingLaboratory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 font-semibold"
                placeholder="e.g. LSMTL"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Testing Machine Model
              </label>
              <input
                type="text"
                value={testingMachine}
                onChange={(e) => setTestingMachine(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                placeholder="e.g. Digital Compression Machine"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Calibration Certificate Ref
              </label>
              <input
                type="text"
                value={machineCalibrationCertificate}
                onChange={(e) =>
                  setMachineCalibrationCertificate(e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
                placeholder="e.g. CAL-2025-9921"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Lab Accreditation #
              </label>
              <input
                type="text"
                value={laboratoryAccreditationNumber}
                onChange={(e) =>
                  setLaboratoryAccreditationNumber(e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-purple-500"
                placeholder="e.g. ISO/IEC 17025:2017 #4421"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Prepared By (QA/QC Team)
              </label>
              <input
                type="text"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                placeholder="e.g. QA/QC Site Team"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                QA/QC Inspector / Witness
              </label>
              <input
                type="text"
                value={qaqcInspector}
                onChange={(e) => setQaqcInspector(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                placeholder="e.g. Eng. David K."
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Approved By (Consultant RE)
              </label>
              <input
                type="text"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                placeholder="e.g. Consultant Resident Engineer"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              General Remarks / Sampling Notes
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              placeholder="e.g. Normal sampling according to BS EN 12350-1..."
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
            <Info className="w-4 h-4 text-emerald-500" />
            <span>
              Sample will be recorded in Curing state with scheduled test dates
              auto-populated.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate("/project/concrete")}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canCreateSample}
              title={!canCreateSample ? "You do not have permission to register concrete samples" : undefined}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xl shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>Register Sample & Schedule Crushing</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
