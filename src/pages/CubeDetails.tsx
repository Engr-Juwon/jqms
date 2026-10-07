import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useThemeStore } from "@/stores/useThemeStore";
import {
  ConcreteCubeSample,
  CubeCrushTestSummary,
  DayResultEntry,
  CubeCrushSpecimenResult,
  TestAge,
  ConcreteNCRLink,
  NonConformanceReport,
} from "@/types";
import { generateNcrNumber } from "@/lib/naming";
import { plannerSync } from "@/lib/plannerSync";
import { hasPermission } from "@/lib/rbac";
import { hasMinRole } from "@/lib/permissions";
import { Link } from "react-router-dom";
import {
  FlaskConical,
  ArrowLeft,
  Calculator,
  TrendingUp,
  Printer,
  AlertOctagon,
  FileText,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Calendar,
  Building,
  Plus,
  Trash2,
  Save,
  Check,
} from "lucide-react";
import { generateCubeTestPDF } from "@/lib/pdfGenerators";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { toast } from "react-hot-toast";

export const CubeDetails: React.FC = () => {
  const { projectId, id } = useParams<{ projectId: string; id: string }>();
  const navigate = useNavigate();
  const { currentUser, company } = useAuthStore();
  const { activeProject, projects, setActiveProject } = useProjectStore();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";
  const currentProjId =
    projectId ||
    activeProject?.id ||
    localStorage.getItem("jqms_active_project_id") ||
    localStorage.getItem("currentProjectId") ||
    projects[0]?.id ||
    "";

  // Synchronize active project in store if not set
  useEffect(() => {
    if (!activeProject && currentProjId && projects.length > 0) {
      const match = projects.find((p) => p.id === currentProjId);
      if (match) setActiveProject(match);
    }
  }, [activeProject, currentProjId, projects, setActiveProject]);

  const [cube, setCube] = useState<ConcreteCubeSample | null>(null);
  const [loading, setLoading] = useState(true);

  const canLogTests = hasPermission(currentUser?.role, "ENTER_CUBE_CRUSH_TEST");
  const canCertify28D = hasPermission(
    currentUser?.role,
    "CERTIFY_28D_STRENGTH",
  );
  const canAuthorizeConcession = hasMinRole(currentUser?.role, 4);
  const canDeleteCube =
    !currentUser ||
    !currentUser.role ||
    hasPermission(currentUser?.role, "DELETE_CONCRETE_RECORD") ||
    hasMinRole(currentUser?.role, 2);

  // Active Test Age tab: 1, 3, 7, 14, 28, 56
  const [activeTestAge, setActiveTestAge] = useState<number>(7);

  // Multi-cube crushing inputs for the active test age
  const [specimens, setSpecimens] = useState<
    Array<{
      id: number;
      load: string;
      strength: string;
      cubeWeight: string;
      failureMode: string;
    }>
  >([
    {
      id: 1,
      load: "",
      strength: "",
      cubeWeight: "",
      failureMode: "Cone Failure",
    },
    {
      id: 2,
      load: "",
      strength: "",
      cubeWeight: "",
      failureMode: "Cone Failure",
    },
    {
      id: 3,
      load: "",
      strength: "",
      cubeWeight: "",
      failureMode: "Cone Failure",
    },
  ]);

  const [labTechName, setLabTechName] = useState("J. Oladejo");
  const [testingStandard, setTestingStandard] = useState("BS EN 12390-3");
  const [testDate, setTestDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [remarks, setRemarks] = useState("");
  const [witnessedByName, setWitnessedByName] = useState(
    "Sarah Chen (QA/QC Eng)",
  );

  // Proposed Action state for NCR generation
  const [proposedAction, setProposedAction] =
    useState<ConcreteNCRLink["proposedAction"]>("RE_TEST_CORE");

  const loadData = async () => {
    setLoading(true);
    let match: ConcreteCubeSample | null = null;
    if (id) {
      match = await dbService.getCubeSample(id, currentProjId);
    }
    if (!match) {
      const list = await dbService.getCubeSamples(currentProjId, currentCompId);
      match = list.find((c) => c.id === id || c.sampleId === id) || null;
    }
    setCube(match || null);
    if (match) {
      if (match.preparedBy) setLabTechName(match.preparedBy);
      if (match.qaqcInspector) setWitnessedByName(match.qaqcInspector);
      const ages = match.testAges || [7, 28];
      if (ages.length > 0 && !ages.includes(activeTestAge as any)) {
        setActiveTestAge(ages[0]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentProjId, currentCompId, id]);

  const getTestResultForAge = (age: number) => {
    if (!cube) return null;
    const ageResultsKey = `day${age}Results` as keyof ConcreteCubeSample;
    const array = (cube[ageResultsKey] as DayResultEntry[]) || [];
    if (array && array.length > 0 && array[0]?.averageStrength) {
      return {
        averageStrength: array[0].averageStrength,
        status: array[0].status,
        date: array[0].testDate || "",
        technician: array[0].technician || "",
        standard: array[0].testingStandard || "",
        remarks: array[0].remarks || "",
        specimens: array[0].cubes || [],
      };
    }
    const summary =
      cube.tests?.[
        `day${age}` as keyof NonNullable<ConcreteCubeSample["tests"]>
      ];
    if (summary && (summary.averageStrengthNmm2 || summary.averageStrength)) {
      return {
        averageStrength:
          summary.averageStrengthNmm2 || summary.averageStrength || 0,
        status: summary.status || summary.compliance || "PASS",
        date: summary.actualTestDate || summary.scheduledDate || "",
        technician: summary.testedBy || "",
        standard: testingStandard,
        remarks: summary.remarks || "",
        specimens: summary.cubes || summary.individualResults || [],
      };
    }
    return null;
  };

  // When active test age changes, populate specimens from existing results if available
  useEffect(() => {
    if (!cube) return;
    const existing = getTestResultForAge(activeTestAge);

    if (existing && existing.specimens.length > 0) {
      setSpecimens(
        existing.specimens.map((c: any, i: number) => ({
          id: c.id || i + 1,
          load: String(c.load || c.failureLoadKn || ""),
          strength: String(c.strength || c.compressiveStrengthNmm2 || ""),
          cubeWeight: String(c.cubeWeight || c.weightKg || ""),
          failureMode: c.failureMode || c.typeOfFailure || "Cone Failure",
        })),
      );
      if (existing.technician) setLabTechName(existing.technician);
      if (existing.date) setTestDate(existing.date);
      if (existing.standard) setTestingStandard(existing.standard);
      if (existing.remarks) setRemarks(existing.remarks);
    } else {
      initDefaultSpecimens();
    }
  }, [activeTestAge, cube]);

  const initDefaultSpecimens = () => {
    setSpecimens([
      {
        id: 1,
        load: "",
        strength: "",
        cubeWeight: "",
        failureMode: "Cone Failure",
      },
      {
        id: 2,
        load: "",
        strength: "",
        cubeWeight: "",
        failureMode: "Cone Failure",
      },
      {
        id: 3,
        load: "",
        strength: "",
        cubeWeight: "",
        failureMode: "Cone Failure",
      },
    ]);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
        Loading concrete cube sample...
      </div>
    );
  }

  if (!cube) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 shadow-sm dark:shadow-xl">
        <FlaskConical className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Cube Sample Not Found
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          The requested concrete cube test record does not exist or has been
          removed.
        </p>
        <button
          onClick={() => navigate(`/project/${currentProjId}/concrete`)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition"
        >
          Return to Concrete & Cube Registry
        </button>
      </div>
    );
  }

  // Determine Base 28-Day Target Strength dynamically
  const parsedTargetString = cube.targetStrength
    ? parseFloat(cube.targetStrength)
    : 0;
  const base28DayTarget =
    cube.target28DayStrengthNmm2 ||
    cube.day28Required ||
    (isNaN(parsedTargetString) ? 0 : parsedTargetString) ||
    30;

  // Specimen Dimensions and Area Calculation
  const sizeMm =
    cube.cubeSizeMm || (cube.cubeSize ? parseInt(cube.cubeSize) : 150) || 150;
  const areaMm2 = sizeMm * sizeMm;

  // Automatically calculate target strength for active age
  const getTargetForAge = (age: number) => {
    const val =
      age === 1
        ? cube?.day1Required || base28DayTarget * 0.2
        : age === 3
          ? cube?.day3Required || base28DayTarget * 0.45
          : age === 7
            ? cube?.day7Required || base28DayTarget * 0.7
            : age === 14
              ? cube?.day14Required || base28DayTarget * 0.85
              : age === 28
                ? cube?.day28Required || base28DayTarget
                : base28DayTarget * 1.1;
    return Number(val.toFixed(1));
  };

  const targetForAge = getTargetForAge(activeTestAge);

  const getScheduledDateForAge = (age: number) => {
    if (!cube?.castDate) return "—";
    const [y, m, d] = cube.castDate.split("-").map(Number);
    if (!y || !m || !d) return "—";
    const date = new Date(y, m - 1, d + age);
    return date.toISOString().split("T")[0];
  };

  const handleAutoFillEstimates = () => {
    const target = getTargetForAge(activeTestAge);
    const estLoadKn = Math.round(((target * areaMm2) / 1000) * 100) / 100;
    const estStrength = ((estLoadKn * 1000) / areaMm2).toFixed(2);

    setSpecimens([
      {
        id: 1,
        load: String(estLoadKn),
        strength: estStrength,
        cubeWeight: "8.15",
        failureMode: "Cone Failure",
      },
      {
        id: 2,
        load: String(estLoadKn),
        strength: estStrength,
        cubeWeight: "8.12",
        failureMode: "Cone Failure",
      },
      {
        id: 3,
        load: "",
        strength: "",
        cubeWeight: "",
        failureMode: "Cone Failure",
      },
    ]);
  };

  // Handle Specimen Load changes & recalculate individual strength
  const handleSpecimenLoadChange = (index: number, val: string) => {
    setSpecimens((prev) => {
      const next = [...prev];
      const loadNum = parseFloat(val);
      const strength =
        !isNaN(loadNum) && loadNum > 0
          ? ((loadNum * 1000) / areaMm2).toFixed(2)
          : "";
      next[index] = { ...next[index], load: val, strength };
      return next;
    });
  };

  const handleSpecimenFieldChange = (
    index: number,
    field: string,
    val: string,
  ) => {
    setSpecimens((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleAddSpecimen = () => {
    setSpecimens((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        load: "",
        strength: "",
        cubeWeight: "",
        failureMode: "Cone Failure",
      },
    ]);
  };

  const handleRemoveSpecimen = (index: number) => {
    if (specimens.length <= 1) return;
    setSpecimens((prev) => prev.filter((_, i) => i !== index));
  };

  // Real-time statistical calculations
  const validStrengths = specimens
    .map((s) => parseFloat(s.strength))
    .filter((n) => !isNaN(n) && n > 0);

  const averageStrength =
    validStrengths.length > 0
      ? Number(
          (
            validStrengths.reduce((a, b) => a + b, 0) / validStrengths.length
          ).toFixed(2),
        )
      : 0;

  const minStrength =
    validStrengths.length > 0 ? Math.min(...validStrengths) : 0;
  const maxStrength =
    validStrengths.length > 0 ? Math.max(...validStrengths) : 0;

  const standardDeviation =
    validStrengths.length > 1
      ? Number(
          Math.sqrt(
            validStrengths.reduce(
              (sq, n) => sq + Math.pow(n - averageStrength, 2),
              0,
            ) /
              (validStrengths.length - 1),
          ).toFixed(2),
        )
      : 0;

  const percentageAchieved =
    targetForAge > 0
      ? Number(((averageStrength / targetForAge) * 100).toFixed(1))
      : 0;

  const isPassing = averageStrength >= targetForAge;

  const handleRecordTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canLogTests) {
      toast.error(
        "Permission Denied: You do not have statutory authorization to log concrete crush test results.",
      );
      return;
    }
    if (validStrengths.length === 0) {
      toast.error("Please enter load (kN) for at least one specimen cube.");
      return;
    }

    const ageKey = `day${activeTestAge}Results` as keyof ConcreteCubeSample;

    const dayEntry: DayResultEntry = {
      averageStrength,
      minimumStrength: minStrength,
      maximumStrength: maxStrength,
      standardDeviation,
      status: isPassing ? "PASS" : "FAIL",
      remarks,
      technician: labTechName,
      testDate,
      testingStandard,
      enteredBy: currentUser?.fullName || labTechName,
      enteredAt: new Date().toISOString(),
      cubes: specimens.map((s) => ({
        id: s.id,
        load: s.load,
        strength: s.strength,
        cubeWeight: s.cubeWeight,
        failureMode: s.failureMode,
      })),
    };

    const testSummary: CubeCrushTestSummary = {
      testAgeDays: activeTestAge as TestAge,
      scheduledDate: testDate,
      actualTestDate: testDate,
      averageStrengthNmm2: averageStrength,
      averageStrength,
      requiredStrengthNmm2: targetForAge,
      percentageOfTarget: percentageAchieved,
      compliance: isPassing ? "PASS" : "FAIL",
      status: isPassing ? "PASS" : "FAIL",
      testedBy: labTechName,
      witnessedBy: witnessedByName,
      remarks,
      cubes: dayEntry.cubes,
    };

    let updatedStatus = cube.status;
    let ncrLinkData = cube.ncrDetails;
    let ncrGeneratedFlag = cube.ncrGenerated || false;
    let ncrNum = cube.ncrNumber;

    if (!isPassing) {
      updatedStatus = "NCR_ISSUED";
      ncrGeneratedFlag = true;
      const projectCode = activeProject?.code?.toUpperCase() || "";
      const ncrId = cube.ncrDetails?.ncrId || `ncr-${Date.now()}`;
      ncrNum =
        cube.ncrNumber ||
        cube.ncrDetails?.ncrNumber ||
        generateNcrNumber(projectCode);
      const timestamp = Date.now();

      const resolutionText = (proposedAction || "RE_TEST_CORE").replace(
        /_/g,
        " ",
      );
      const ncrTitle = `Low Compressive Strength Non-Conformance: ${cube.sampleId} (${cube.inscribedName ? `Mark ${cube.inscribedName} - ` : ""}${cube.structureElement || cube.elementName})`;
      const deficitValue = (targetForAge - averageStrength).toFixed(2);
      const ncrDescription = `Concrete cube specimen ${cube.sampleId} (${cube.inscribedName ? `Inscribed Mark: ${cube.inscribedName}, ` : ""}${cube.structureElement || cube.elementName}) failed to meet specified compressive strength requirement at ${activeTestAge}-Day crushing test.
Achieved Average Strength: ${averageStrength} MPa
Required Target Strength: ${targetForAge} MPa (Deficit: ${deficitValue} MPa, ${percentageAchieved}% achieved)
Structural Location: ${cube.levelName || cube.level || "Site Area"} ${cube.zone ? `(Zone: ${cube.zone})` : ""}
Pour Reference (PTP): ${cube.pourReference || "—"} | ITP: ${cube.ITPReference || "—"}
ReadyMix Supplier: ${cube.supplier || "—"} | Batch Ticket: ${cube.batchTicketNumber || cube.deliveryNoteNumber || "—"}
Proposed Resolution: ${resolutionText}.`;

      const ncrPayload: NonConformanceReport = {
        id: ncrId,
        ncrNumber: ncrNum,
        title: ncrTitle,
        description: ncrDescription,
        descriptionItems: [
          `Compressive strength at ${activeTestAge}-day break test is ${averageStrength} MPa vs ${targetForAge} MPa specified.`,
          `Structural Element: ${cube.structureElement || cube.elementName} at ${cube.levelName || cube.level || "Site"}`,
          `Pour Reference: ${cube.pourReference || "—"}, Batch Ticket: ${cube.batchTicketNumber || cube.deliveryNoteNumber || "—"}`,
          `Proposed Resolution: ${resolutionText}`,
        ],
        status: "OPEN",
        priority: activeTestAge === 28 ? "CRITICAL" : "HIGH",
        severity: (activeTestAge === 28 ? "CRITICAL" : "HIGH") as any,
        photos: [],
        category: "Structural Concrete",
        location: cube.levelName || cube.level || "",
        elementName:
          cube.structureElement || cube.elementName || "Concrete Structure",
        elementId: cube.elementId || cube.sampleId,
        structuralElementId: cube.elementId || cube.sampleId,
        locationLevel: cube.levelName || cube.level || "",
        gridLine: cube.zone || "",
        dateFound: testDate,
        deadline: new Date(Date.now() + 7 * 86400000)
          .toISOString()
          .split("T")[0],
        trade: "Civil / Structural",
        tradeId: "trade-civil-structural",
        subtrade: "Concrete Works",
        subtradeId: "subtrade-concrete",
        rootCauseType: "Material Defect",
        rootCause: `Material Defect: Concrete failed ${activeTestAge}-Day compressive strength requirement (${averageStrength} MPa vs ${targetForAge} MPa target)`,
        correctiveAction: `Execute ${resolutionText} on in-situ element and conduct structural engineering assessment.`,
        correctiveActions: [
          {
            id: `ca-${Date.now()}-1`,
            actionText: `Perform ${resolutionText} on ${cube.structureElement || cube.elementName}`,
            assignedTo: labTechName,
            targetDate: new Date(Date.now() + 7 * 86400000)
              .toISOString()
              .split("T")[0],
            status: "PENDING",
          },
        ],
        preventiveAction: `Audit batching plant mix proportions, water-cement ratios, and aggregate gradings for supplier ${cube.supplier || "ReadyMix"}.`,
        raisedBy: {
          uid: currentUser?.uid || "system",
          name: currentUser?.fullName || labTechName,
          role: currentUser?.role || "QA/QC Engineer",
          date: testDate,
        },
        raisedByName: currentUser?.fullName || labTechName,
        reportedBy: currentUser?.fullName || labTechName,
        assignedTo: "",
        assignedToName: cube.supplier || "ReadyMix Supplier",
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
            userName: currentUser?.fullName || labTechName,
            comment: `Automatically generated NCR upon failure of ${activeTestAge}-Day crush test (${averageStrength} MPa < ${targetForAge} MPa).`,
            timestamp,
          },
        ],
        createdAt: timestamp,
        updatedAt: timestamp,
        finalStatus: "PENDING",
        qaqcEngineerName: witnessedByName || currentUser?.fullName || "",
        signDate: testDate,
      };

      await dbService.saveNCR(ncrPayload);

      await plannerSync.syncEvent({
        relatedId: ncrPayload.id,
        relatedModule: "ncr",
        title: `NCR Issued: Concrete Deficit ${cube.sampleId}`,
        description: `NCR ${ncrNum} issued for failing ${activeTestAge}-Day cube test on ${cube.structureElement || cube.elementName} (${averageStrength} MPa vs ${targetForAge} MPa).`,
        startDate: testDate,
        startTime: "09:00",
        eventType: "CUSTOM",
        status: "SCHEDULED",
        location:
          `${cube.levelName || cube.level || ""} ${cube.zone || ""}`.trim(),
        projectId: currentProjId,
        companyId: currentCompId,
        createdBy: currentUser?.uid || "system",
        eventKey: "found",
      });

      ncrLinkData = {
        ncrId: ncrPayload.id,
        ncrNumber: ncrNum,
        status: "OPEN",
        generatedAt: timestamp,
        generatedBy: currentUser?.fullName || "QA/QC System",
        triggeredByAge: activeTestAge as TestAge,
        actualStrengthNmm2: averageStrength,
        requiredStrengthNmm2: targetForAge,
        proposedAction: proposedAction,
      };
    } else {
      // If sample previously had an NCR generated and is now passing on re-test / updated requirements, clear the NCR
      const existingNcrId = cube.ncrDetails?.ncrId || cube.ncrNumber;
      if (existingNcrId || cube.ncrGenerated) {
        if (existingNcrId) {
          try {
            await dbService.deleteNCR(existingNcrId, currentProjId);
          } catch (err) {
            console.error(
              "Failed to delete linked NCR upon re-test pass:",
              err,
            );
          }
        }
        ncrGeneratedFlag = false;
        ncrNum = undefined;
        ncrLinkData = undefined;
      }

      updatedStatus =
        activeTestAge === 28
          ? "APPROVED"
          : (`${activeTestAge}-DAY DONE` as any);
    }

    const updated: ConcreteCubeSample = {
      ...cube,
      [ageKey]: [dayEntry],
      tests: {
        ...cube.tests,
        [`day${activeTestAge}`]: testSummary,
      },
      status: updatedStatus,
      overallStatus: updatedStatus,
      ncrGenerated: ncrGeneratedFlag,
      ncrNumber: ncrNum,
      ncrDetails: ncrLinkData,
      updatedAt: Date.now(),
    };

    await dbService.saveCubeSample(updated);
    setCube(updated);

    if (currentUser) {
      await writeAudit({
        projectId: currentProjId,
        companyId: currentCompId,
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: !isPassing ? "GENERATE_NCR" : "RECORD_CUBE_TEST",
        module: "Concrete",
        details: `Recorded ${activeTestAge}-Day crush test for ${cube.sampleId} (${cube.inscribedName || "Cube"}): Avg ${averageStrength} MPa (${isPassing ? "PASS" : "FAIL - NCR Generated"})`,
        newValue: updated,
      });
    }

    toast.success(
      isPassing
        ? `${activeTestAge}-Day Crush Test saved: ${averageStrength} MPa (PASSED)`
        : `Test recorded: Non-conformance ${ncrNum} issued & registered!`,
    );
  };

  const handleApproveConcession = async () => {
    if (!cube) return;

    if (!canAuthorizeConcession && !canCertify28D) {
      toast.error(
        "Permission Denied: Only Level 4+ QA/QC Engineers or Quality Managers can approve specimens under concession.",
      );
      return;
    }

    const confirmApprove = window.confirm(
      `Are you sure you want to formally APPROVE specimen "${cube.sampleId}" under concession/waiver and delete the associated Non-Conformance Report (${cube.ncrNumber || cube.ncrDetails?.ncrNumber || "linked NCR"})?`,
    );
    if (!confirmApprove) return;

    const ncrIdToDelete = cube.ncrDetails?.ncrId || cube.ncrNumber;
    if (ncrIdToDelete) {
      try {
        await dbService.deleteNCR(ncrIdToDelete, currentProjId);
      } catch (err) {
        console.error("Failed to delete NCR on concession approval:", err);
      }
    }

    const updated: ConcreteCubeSample = {
      ...cube,
      status: "APPROVED",
      overallStatus: "APPROVED",
      ncrGenerated: false,
      ncrNumber: undefined,
      ncrDetails: undefined,
      updatedAt: Date.now(),
    };

    await dbService.saveCubeSample(updated);
    setCube(updated);

    if (currentUser) {
      await writeAudit({
        projectId: currentProjId,
        companyId: currentCompId,
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "APPROVE_CONCESSION",
        module: "Concrete",
        details: `Approved specimen ${cube.sampleId} under engineering concession. Removed linked NCR ${ncrIdToDelete || ""}.`,
        newValue: updated,
      });
    }

    toast.success("Sample approved under concession. Associated NCR cleared.");
  };

  const handleDeleteCube = async () => {
    if (!cube) return;

    if (!canDeleteCube) {
      toast.error(
        "Permission Denied: You do not have statutory permission to delete concrete test records.",
      );
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete concrete sample record "${cube.sampleId}"? This action cannot be undone and will also remove any linked NCR.`,
    );
    if (!confirmDelete) return;

    const effectiveProjId =
      cube.projectId || currentProjId || activeProject?.id || projectId || "";

    const ncrIdToDelete = cube.ncrDetails?.ncrId || cube.ncrNumber;
    if (ncrIdToDelete) {
      try {
        await dbService.deleteNCR(ncrIdToDelete, effectiveProjId);
      } catch (err) {
        console.error("Failed to delete linked NCR on sample deletion:", err);
      }
    }

    try {
      await dbService.deleteCubeSample(cube.id, effectiveProjId);
      if (cube.sampleId && cube.sampleId !== cube.id) {
        await dbService.deleteCubeSample(cube.sampleId, effectiveProjId);
      }
    } catch (err) {
      console.error("Failed to delete cube sample:", err);
    }

    if (currentUser) {
      try {
        await writeAudit({
          projectId: effectiveProjId,
          companyId: currentCompId,
          userId: currentUser.uid,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          action: "DELETE_CUBE_SAMPLE",
          module: "Concrete",
          details: `Deleted concrete cube sample ${cube.sampleId} (${cube.structureElement || cube.elementName})`,
        });
      } catch (auditErr) {
        console.warn("Non-fatal: failed to write audit log:", auditErr);
      }
    }

    toast.success(`Concrete specimen ${cube.sampleId} deleted`);
    navigate(
      effectiveProjId
        ? `/project/${effectiveProjId}/concrete`
        : `/project/concrete`,
    );
  };

  // Build Curve Data for Chart
  const getActualStrengthForAge = (age: number) => {
    const ageKey = `day${age}Results` as keyof ConcreteCubeSample;
    const array = cube[ageKey] as DayResultEntry[] | undefined;
    if (array && array.length > 0 && array[0]?.averageStrength) {
      return array[0].averageStrength;
    }
    const summary =
      cube.tests?.[
        `day${age}` as keyof NonNullable<ConcreteCubeSample["tests"]>
      ];
    return (
      summary?.averageStrengthNmm2 || summary?.compressiveStrengthNmm2 || null
    );
  };

  const curveData = [
    { day: "Day 0", target: 0, actual: 0 },
    {
      day: "Day 1",
      target: Math.round(base28DayTarget * 0.2 * 10) / 10,
      actual: getActualStrengthForAge(1),
    },
    {
      day: "Day 3",
      target: Math.round(base28DayTarget * 0.45 * 10) / 10,
      actual: getActualStrengthForAge(3),
    },
    {
      day: "Day 7",
      target: Math.round(base28DayTarget * 0.7 * 10) / 10,
      actual: getActualStrengthForAge(7),
    },
    {
      day: "Day 14",
      target: Math.round(base28DayTarget * 0.85 * 10) / 10,
      actual: getActualStrengthForAge(14),
    },
    {
      day: "Day 28",
      target: base28DayTarget,
      actual: getActualStrengthForAge(28),
    },
    {
      day: "Day 56",
      target: Math.round(base28DayTarget * 1.1 * 10) / 10,
      actual: getActualStrengthForAge(56),
    },
  ];

  const tooltipStyle = isDark
    ? {
        backgroundColor: "#0f172a",
        borderColor: "#334155",
        borderRadius: "8px",
        color: "#f8fafc",
      }
    : {
        backgroundColor: "#ffffff",
        borderColor: "#e2e8f0",
        borderRadius: "8px",
        color: "#0f172a",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
      };

  const gridStroke = isDark ? "#334155" : "#e2e8f0";
  const axisStroke = isDark ? "#94a3b8" : "#64748b";

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300 text-slate-900 dark:text-slate-100">
      {/* Header */}
        <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/project/${currentProjId}/concrete`)}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-xs uppercase tracking-wider mb-0.5">
                <span>{cube.sampleId}</span>
                {cube.inscribedName && (
                  <>
                    <span>•</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-bold">
                      Mark: {cube.inscribedName}
                    </span>
                  </>
                )}
                <span>•</span>
                <span>{cube.concreteGrade}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {cube.structureElement || cube.elementName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                generateCubeTestPDF(cube, activeProject || {}, company || {})
              }
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition shadow-sm"
            >
              <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Print Official Certificate</span>
            </button>
            <button
              type="button"
              onClick={handleDeleteCube}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 text-xs font-bold transition shadow-sm"
              title="Delete Specimen Record"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Sample</span>
            </button>
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                cube.status === "APPROVED"
                  ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40"
                  : cube.status === "NCR_ISSUED" || cube.status === "REJECTED"
                    ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/40"
                    : "bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/40"
              }`}
            >
              {cube.status}
            </span>
          </div>
        </div>

        {/* NCR Alert Banner */}
        {cube.ncrGenerated && cube.ncrDetails && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-red-900 dark:text-red-200">
            <div className="flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <span>
                    NON-CONFORMANCE REPORT ISSUED ({cube.ncrDetails.ncrNumber})
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-200 dark:bg-red-900/60 text-red-800 dark:text-red-300 text-[10px] font-mono">
                    {cube.ncrDetails.status}
                  </span>
                </div>
                <p>
                  Concrete failed target strength at{" "}
                  <strong>{cube.ncrDetails.triggeredByAge}-Day</strong> test:
                  Achieved{" "}
                  <strong>{cube.ncrDetails.actualStrengthNmm2} MPa</strong> vs
                  Required{" "}
                  <strong>{cube.ncrDetails.requiredStrengthNmm2} MPa</strong>.
                </p>
                <p className="font-mono text-[11px] text-red-700 dark:text-red-300">
                  Proposed Resolution:{" "}
                  <strong>
                    {cube.ncrDetails.proposedAction?.replace(/_/g, " ")}
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleApproveConcession}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                title="Approve sample under concession and clear NCR"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Concession & Clear NCR</span>
              </button>
              <Link
                to={`/project/${currentProjId}/ncrs/${cube.ncrDetails.ncrId}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition"
              >
                <FileText className="w-4 h-4" />
                <span>Open NCR in Register →</span>
              </Link>
            </div>
          </div>
        )}

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500">
              28d Characteristic Spec
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
              {base28DayTarget} MPa
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              {cube.concreteGrade} • {cube.mixType || "Design Mix"}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500">
              Slump & Fresh Props
            </span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {cube.slumpResult || cube.slumpMm || "120"} mm
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              W/C: {cube.waterCementRatio || "0.40"} • Temp:{" "}
              {cube.concreteTemperature || "28"}°C
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500">
              Supplier & Batching
            </span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
              {cube.supplier}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Ticket: {cube.batchTicketNumber || cube.deliveryNoteNumber || "—"}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500">
              Casting & Traceability
            </span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
              {cube.castDate} @ {cube.castTime}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              PTP: {cube.pourReference || "—"} • ITP: {cube.ITPReference || "—"}
            </span>
          </div>
        </div>

        {/* Compressive Strength Growth Curve Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                Compressive Strength Development Curve (Target vs Actual)
              </span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              Standard: BS EN 12390-3 / ASTM C39
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curveData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="day" stroke={axisStroke} fontSize={11} />
                <YAxis stroke={axisStroke} fontSize={11} unit=" MPa" />
                <Tooltip contentStyle={tooltipStyle} />
                <ReferenceLine
                  y={base28DayTarget}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label="28d Target"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke={axisStroke}
                  strokeDasharray="5 5"
                  name="Target Curve (MPa)"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#34d399" }}
                  name="Actual Strength (MPa)"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comprehensive Compressive Strength Test Results Register */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Test Results Summary Register (All Test Ages)</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {cube.sampleId} • Target 28D: {base28DayTarget} MPa (
              {cube.concreteGrade})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-mono uppercase text-slate-400">
                  <th className="py-2.5 px-3">Age</th>
                  <th className="py-2.5 px-3">Scheduled Date</th>
                  <th className="py-2.5 px-3">Test Date</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Achieved Avg</th>
                  <th className="py-2.5 px-3">% Target</th>
                  <th className="py-2.5 px-3">Specimens</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {[1, 3, 7, 14, 28, 56].map((age) => {
                  const target = getTargetForAge(age);
                  const result = getTestResultForAge(age);
                  const isTested =
                    result !== null && result.averageStrength > 0;
                  const isPass = isTested
                    ? result.averageStrength >= target
                    : null;
                  const pct =
                    isTested && target > 0
                      ? Math.round((result.averageStrength / target) * 100)
                      : null;
                  const isSelected = activeTestAge === age;

                  return (
                    <tr
                      key={age}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20"
                          : ""
                      }`}
                      onClick={() => setActiveTestAge(age)}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{age}-Day</span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {getScheduledDateForAge(age)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {result?.date || "—"}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-600 dark:text-slate-400">
                        {target} MPa
                      </td>
                      <td className="py-2.5 px-3">
                        {isTested ? (
                          <span
                            className={`font-black text-sm ${
                              isPass
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {result.averageStrength} MPa
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {pct != null ? `${pct}%` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500">
                        {result?.specimens?.length
                          ? result.specimens
                              .map((s: any) =>
                                s.strength ? `${s.strength}` : "—",
                              )
                              .join(", ") + " MPa"
                          : "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isTested
                              ? isPass
                                ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30"
                                : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          }`}
                        >
                          {isTested
                            ? isPass
                              ? "PASSED"
                              : "FAILED"
                            : "PENDING"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTestAge(age);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-sans transition ${
                            isSelected
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600"
                          }`}
                        >
                          {isSelected ? "Active Station" : "Enter Results"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Multi-Cube Crushing Station & Calculation Engine */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-sm flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Crushing Station: Record {activeTestAge}-Day Test</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 block">
                Formula: Strength (MPa) = (Load kN × 1000) / {areaMm2} mm² (
                {sizeMm}×{sizeMm} mm)
              </span>
            </div>

            {/* Age Selector Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              {[1, 3, 7, 14, 28, 56].map((age) => {
                const res = getTestResultForAge(age);
                const hasTest = res !== null && res.averageStrength > 0;
                const isPass =
                  hasTest && res.averageStrength >= getTargetForAge(age);

                return (
                  <button
                    key={age}
                    type="button"
                    onClick={() => setActiveTestAge(age)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                      activeTestAge === age
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <span>{age}D</span>
                    {hasTest && (
                      <span
                        className={`text-[10px] px-1 py-0.1 rounded font-mono ${
                          activeTestAge === age
                            ? "bg-emerald-700 text-white"
                            : isPass
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                              : "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {res.averageStrength} MPa
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleRecordTest} className="space-y-5">
            {/* Target for Selected Age */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Target Requirement ({activeTestAge}-Day)
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {targetForAge} MPa
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Calculated Average
                </span>
                <span
                  className={`text-lg font-black font-mono ${averageStrength > 0 ? (isPassing ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400") : "text-slate-400"}`}
                >
                  {averageStrength > 0
                    ? `${averageStrength} MPa`
                    : "Awaiting Loads"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Min / Max Strength
                </span>
                <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                  {minStrength > 0
                    ? `${minStrength} / ${maxStrength} MPa`
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Standard Deviation
                </span>
                <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                  {standardDeviation > 0 ? `${standardDeviation} MPa` : "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Achievement
                </span>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                    averageStrength > 0
                      ? isPassing
                        ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30"
                        : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {averageStrength > 0
                    ? `${percentageAchieved}% (${isPassing ? "PASS" : "FAIL"})`
                    : "PENDING"}
                </span>
              </div>
            </div>

            {/* Individual Specimen Crushing Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  Individual Specimen Break Log ({activeTestAge}-Day)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoFillEstimates}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] transition"
                    title="Auto-fill theoretical design test loads"
                  >
                    <span>Auto-Fill Design Loads</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSpecimen}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Specimen</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Specimen</th>
                      <th className="py-2.5 px-3">Crushing Load (kN) *</th>
                      <th className="py-2.5 px-3">
                        Compressive Strength (MPa)
                      </th>
                      <th className="py-2.5 px-3">Weight (kg)</th>
                      <th className="py-2.5 px-3">Failure Mode</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {specimens.map((spec, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">
                          Cube #{spec.id}
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            step="0.01"
                            value={spec.load}
                            onChange={(e) =>
                              handleSpecimenLoadChange(idx, e.target.value)
                            }
                            placeholder="e.g. 527.88"
                            className="w-32 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-black text-slate-900 dark:text-white">
                          {spec.strength ? `${spec.strength} MPa` : "—"}
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={spec.cubeWeight}
                            onChange={(e) =>
                              handleSpecimenFieldChange(
                                idx,
                                "cubeWeight",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. 8.15"
                            className="w-24 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={spec.failureMode}
                            onChange={(e) =>
                              handleSpecimenFieldChange(
                                idx,
                                "failureMode",
                                e.target.value,
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-emerald-500"
                          >
                            <option value="Cone Failure">Cone Failure</option>
                            <option value="Cone & Shear Failure">
                              Cone & Shear Failure
                            </option>
                            <option value="Shear Failure">Shear Failure</option>
                            <option value="Explosive Failure">
                              Explosive Failure
                            </option>
                            <option value="Satisfactory">Satisfactory</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {specimens.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSpecimen(idx)}
                              className="p-1 rounded text-slate-400 hover:text-red-500 transition"
                              title="Remove Specimen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {!isPassing && averageStrength > 0 && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 space-y-2">
                <label className="block font-bold text-red-800 dark:text-red-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>
                    Proposed Action for Generated Non-Conformance Report (NCR)
                  </span>
                </label>
                <select
                  value={proposedAction}
                  onChange={(e) => setProposedAction(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-red-300 dark:border-red-700 text-slate-900 dark:text-white font-semibold focus:outline-none"
                >
                  <option value="RE_TEST_CORE">
                    Core Drilling & Non-Destructive Testing (NDT)
                  </option>
                  <option value="STRUCTURAL_CALCULATION">
                    Structural Calculations & Design Review
                  </option>
                  <option value="LOAD_TEST">Full Structural Load Test</option>
                  <option value="DEMOLITION_REBUILD">
                    Demolition and Reconstruction
                  </option>
                </select>
              </div>
            )}

            {/* Test Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Test Date
                </label>
                <input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Testing Standard
                </label>
                <input
                  type="text"
                  value={testingStandard}
                  onChange={(e) => setTestingStandard(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Testing Technician
                </label>
                <input
                  type="text"
                  value={labTechName}
                  onChange={(e) => setLabTechName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  QA/QC Witness Engineer
                </label>
                <input
                  type="text"
                  value={witnessedByName}
                  onChange={(e) => setWitnessedByName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="submit"
                className={`px-6 py-2.5 rounded-xl text-white font-bold shadow-lg transition cursor-pointer flex items-center gap-2 ${
                  averageStrength > 0 && !isPassing
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                <Save className="w-4 h-4" />
                <span>
                  {averageStrength > 0 && !isPassing
                    ? `Save ${activeTestAge}-Day Test & Issue NCR`
                    : `Save ${activeTestAge}-Day Test & Update Certificate`}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
  );
};
