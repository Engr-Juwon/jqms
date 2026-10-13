import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import { toast } from "react-hot-toast";
import { LevelElementSelect } from "@/components/sitecomments/LevelElementSelect";
import { TradeSubtradeSelect } from "@/components/sitecomments/TradeSubtradeSelect";
import { PermitToPour } from "@/types";
import { DraftBanner } from "@/components/common/DraftBanner";
import { saveFormDraft, getFormDraft, clearFormDraft } from "@/lib/idbVault";
import { useCompany } from "@/lib/companyHelper";
import {
  createDefaultPermitChecklist,
  PermitChecklistItem,
  PermitChecklistStatus,
} from "@/lib/permitChecklist";
import {
  HardHat,
  ArrowLeft,
  Save,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

export const PermitToPourCreate: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentUser, company } = useAuthStore();
  const { activeProject } = useProjectStore();
  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";
  const canCreatePTP = hasPermission(currentUser?.role, "CREATE_PTP");

  const { generateDocNumber, getPrefix } = useCompany();
  const [ptpNumber, setPtpNumber] = useState(() =>
    generateDocNumber("POUR_PERMIT"),
  );

  useEffect(() => {
    if (!rawDraft?.ptpNumber) {
      setPtpNumber(generateDocNumber("POUR_PERMIT"));
    }
  }, [getPrefix]);

  const [levelId, setLevelId] = useState(activeProject?.currentLevelId || "");
  const [levelName, setLevelName] = useState(activeProject?.currentLevelName || "");
  const [elementId, setElementId] = useState("");
  const [elementName, setElementName] = useState("");
  const [tradeId, setTradeId] = useState("");
  const [gridAxis, setGridAxis] = useState("");
  const [tradeName, setTradeName] = useState("Structural Concrete");
  const [subtradeName, setSubtradeName] = useState(
    "Concrete Placement & Pouring",
  );
  const [plannedPourDate, setPlannedPourDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0],
  );
  const [plannedPourTime, setPlannedPourTime] = useState("06:00 AM");
  const [targetVolumeM3, setTargetVolumeM3] = useState(8.4);
  const [concreteGrade, setConcreteGrade] = useState("C60/75 SCC");
  const [slumpTargetMm, setSlumpTargetMm] = useState(650);
  const [supplierBatchPlant, setSupplierBatchPlant] = useState(
    "ReadyMix Batching Plant #4",
  );
  const [truckDeliveryCountEstimate, setTruckDeliveryCountEstimate] =
    useState(2);
  const [notes, setNotes] = useState("");

  // Pre-Pour Checklist
  const [rebarInspectionApproved, setRebarInspectionApproved] = useState(true);
  const [rebarInspectionRef, setRebarInspectionRef] = useState("INSP-APPROVED");
  const [formworkStabilityChecked, setFormworkStabilityChecked] =
    useState(true);
  const [mepEmbedsSleevesClear, setMepEmbedsSleevesClear] = useState(true);
  const [jointCleanlinessWaterjet, setJointCleanlinessWaterjet] =
    useState(true);
  const [concreteMixGradeSlumpVerified, setConcreteMixGradeSlumpVerified] =
    useState(true);
  const [safetyLightingAccessClear, setSafetyLightingAccessClear] =
    useState(true);
  const [vibratorsPumpsStandbyReady, setVibratorsPumpsStandbyReady] =
    useState(true);
  const [checklistItems, setChecklistItems] = useState<PermitChecklistItem[]>(
    createDefaultPermitChecklist(),
  );

  const handleChecklistStatusChange = (
    id: string,
    status: PermitChecklistStatus,
  ) => {
    setChecklistItems((previous) =>
      previous.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  };

  // Draft State
  const [hasDraft, setHasDraft] = useState(false);
  const [draftTime, setDraftTime] = useState("");
  const [rawDraft, setRawDraft] = useState<any>(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);

  useEffect(() => {
    async function checkDraft() {
      if (!currentProjId) return;
      const d = await getFormDraft("POUR_PERMIT", currentProjId);
      if (d && d.data) {
        setHasDraft(true);
        setDraftTime(d.updatedAt);
        setRawDraft(d.data);
      }
    }
    checkDraft();
  }, [currentProjId]);

  const handleRestoreDraft = () => {
    if (!rawDraft) return;
    if (rawDraft.levelId) setLevelId(rawDraft.levelId);
    if (rawDraft.levelName) setLevelName(rawDraft.levelName);
    if (rawDraft.elementId) setElementId(rawDraft.elementId);
    if (rawDraft.elementName) setElementName(rawDraft.elementName);
    if (rawDraft.tradeId) setTradeId(rawDraft.tradeId);
    if (rawDraft.tradeName) setTradeName(rawDraft.tradeName);
    if (rawDraft.subtradeName) setSubtradeName(rawDraft.subtradeName);
    if (rawDraft.plannedPourDate) setPlannedPourDate(rawDraft.plannedPourDate);
    if (rawDraft.plannedPourTime) setPlannedPourTime(rawDraft.plannedPourTime);
    if (rawDraft.targetVolumeM3 !== undefined)
      setTargetVolumeM3(rawDraft.targetVolumeM3);
    if (rawDraft.concreteGrade) setConcreteGrade(rawDraft.concreteGrade);
    if (rawDraft.slumpTargetMm !== undefined)
      setSlumpTargetMm(rawDraft.slumpTargetMm);
    if (rawDraft.supplierBatchPlant)
      setSupplierBatchPlant(rawDraft.supplierBatchPlant);
    if (rawDraft.truckDeliveryCountEstimate !== undefined)
      setTruckDeliveryCountEstimate(rawDraft.truckDeliveryCountEstimate);
    if (rawDraft.notes) setNotes(rawDraft.notes);
    if (rawDraft.rebarInspectionApproved !== undefined)
      setRebarInspectionApproved(rawDraft.rebarInspectionApproved);
    if (rawDraft.formworkStabilityChecked !== undefined)
      setFormworkStabilityChecked(rawDraft.formworkStabilityChecked);
    if (rawDraft.mepEmbedsSleevesClear !== undefined)
      setMepEmbedsSleevesClear(rawDraft.mepEmbedsSleevesClear);
    if (rawDraft.jointCleanlinessWaterjet !== undefined)
      setJointCleanlinessWaterjet(rawDraft.jointCleanlinessWaterjet);
    if (rawDraft.concreteMixGradeSlumpVerified !== undefined)
      setConcreteMixGradeSlumpVerified(rawDraft.concreteMixGradeSlumpVerified);
    if (rawDraft.safetyLightingAccessClear !== undefined)
      setSafetyLightingAccessClear(rawDraft.safetyLightingAccessClear);
    if (rawDraft.vibratorsPumpsStandbyReady !== undefined)
      setVibratorsPumpsStandbyReady(rawDraft.vibratorsPumpsStandbyReady);
    if (rawDraft.checklistItems) setChecklistItems(rawDraft.checklistItems);
    setHasDraft(false);
  };

  const handleDiscardDraft = async () => {
    if (currentProjId) {
      await clearFormDraft("POUR_PERMIT", currentProjId);
    }
    setHasDraft(false);
    setRawDraft(null);
  };

  const handleSaveDraft = async () => {
    if (!canCreatePTP) {
      toast.error("You do not have permission to draft Permits to Pour");
      return;
    }
    if (!currentProjId) return;
    setIsDraftSaving(true);
    const draftPayload = {
      levelId,
      levelName,
      elementId,
      elementName,
      tradeId,
      tradeName,
      subtradeName,
      plannedPourDate,
      plannedPourTime,
      gridAxis,
      targetVolumeM3,
      concreteGrade,
      slumpTargetMm,
      supplierBatchPlant,
      truckDeliveryCountEstimate,
      notes,
      rebarInspectionApproved,
      rebarInspectionRef,
      formworkStabilityChecked,
      mepEmbedsSleevesClear,
      jointCleanlinessWaterjet,
      concreteMixGradeSlumpVerified,
      safetyLightingAccessClear,
      vibratorsPumpsStandbyReady,
      checklistItems,
      permitNumber: ptpNumber,
      floor: levelName,
      elementRef: elementName,
      estimatedVolume: Number(targetVolumeM3),
      pourDate: plannedPourDate,
      pourTime: plannedPourTime,
      supplier: supplierBatchPlant,
      placementMethod: "Concrete Placement & Pouring",
    };

    await saveFormDraft("POUR_PERMIT", currentProjId, draftPayload);
    if (!currentUser) return;

    const draftPtp: PermitToPour = {
      id: `ptp-draft-${Date.now()}`,
      projectId: currentProjId,
      companyId: currentCompId,
      ptpNumber,
      levelId: levelId || "lvl-site",
      levelName: levelName || "Site Level",
      elementId,
      elementName: elementName || "Draft Pour Element",
      tradeId,
      tradeName,
      subtradeName,
      gridAxis,
      plannedPourDate,
      plannedPourTime,
      targetVolumeM3: Number(targetVolumeM3),
      concreteGrade,
      slumpTargetMm: Number(slumpTargetMm),
      supplierBatchPlant,
      truckDeliveryCountEstimate: Number(truckDeliveryCountEstimate),
      checklist: {
        rebarInspectionApproved,
        rebarInspectionRef,
        formworkStabilityChecked,
        mepEmbedsSleevesClear,
        jointCleanlinessWaterjet,
        concreteMixGradeSlumpVerified,
        safetyLightingAccessClear,
        vibratorsPumpsStandbyReady,
      },
      checklistItems,
      status: "DRAFT",
      clearanceSignatures: {
        siteEngineer: {
          name: currentUser?.fullName || "Site Lead Engineer",
          signed: false,
        },
        rebarInspector: { name: "QA/QC Rebar Inspector", signed: false },
        mepCoordinator: { name: "MEP Coordinator", signed: false },
        qaqcLeadEngineer: {
          name: currentUser?.fullName || "QA/QC Lead",
          signed: false,
        },
      },
      issuedByName: currentUser?.fullName,
      issuedById: currentUser?.uid,
      notes,
      createdAt: new Date().toISOString(),
    };

    await dbService.savePermitToPour(draftPtp);

    if (currentUser) {
      await writeAudit({
        projectId: currentProjId,
        companyId: currentCompId,
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "DRAFT_POUR_PERMIT",
        module: "Permits",
        details: `Saved draft Permit to Pour ${ptpNumber} for ${elementName || "Pour Zone"}`,
        newValue: draftPtp,
      });
    }

    setIsDraftSaving(false);
    navigate("/project/permit-to-pour");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreatePTP) {
      toast.error("You do not have permission to create Permits to Pour");
      return;
    }
    if (!currentProjId) return;
    if (!currentUser) return;

    const newPtp: PermitToPour = {
      id: `ptp-${Date.now()}`,
      projectId: currentProjId,
      companyId: currentCompId,
      ptpNumber,
      levelId: levelId || "lvl-site",
      levelName: levelName || "Site Level",
      elementId,
      elementName: elementName || "General Structural Pour Zone",
      tradeId,
      tradeName,
      subtradeName,
      plannedPourDate,
      plannedPourTime,
      issuedById: currentUser.uid,
      issuedByName: currentUser.fullName,
      targetVolumeM3: Number(targetVolumeM3),
      concreteGrade,
      slumpTargetMm: Number(slumpTargetMm),
      supplierBatchPlant,
      truckDeliveryCountEstimate: Number(truckDeliveryCountEstimate),
      checklist: {
        rebarInspectionApproved,
        rebarInspectionRef,
        formworkStabilityChecked,
        mepEmbedsSleevesClear,
        jointCleanlinessWaterjet,
        concreteMixGradeSlumpVerified,
        safetyLightingAccessClear,
        vibratorsPumpsStandbyReady,
      },
      checklistItems,
      gridAxis,
      permitNumber: ptpNumber,
      floor: levelName,
      elementRef: elementName,
      estimatedVolume: Number(targetVolumeM3),
      pourDate: plannedPourDate,
      pourTime: plannedPourTime,
      supplier: supplierBatchPlant,
      placementMethod: "Concrete Placement & Pouring",
      stakeholders: [
        {
          role: "QA/QC Engineer",
          required: true,
          name: currentUser?.fullName || "QA/QC Engineer",
        },
        {
          role: "Site / Construction Manager",
          required: true,
          name: "Site / Construction Manager",
        },
        {
          role: "Structural Consultant / Engineer",
          required: true,
          name: "Structural Consultant / Engineer",
        },
        {
          role: "Mechanical Engineer",
          required: false,
          name: "Mechanical Engineer",
        },
        {
          role: "Electrical Engineer",
          required: false,
          name: "Electrical Engineer",
        },
      ],
      status: checklistItems.some((item) => item.status === "FAIL")
        ? "REJECTED"
        : "ISSUED",
      clearanceSignatures: {
        siteEngineer: {
          name: currentUser?.fullName || "Site Lead Engineer",
          signed: true,
          signedAt: new Date().toISOString(),
        },
        rebarInspector: {
          name: "QA/QC Rebar Inspector",
          signed: true,
          signedAt: new Date().toISOString(),
        },
        mepCoordinator: {
          name: "MEP Coordinator",
          signed: true,
          signedAt: new Date().toISOString(),
        },
        qaqcLeadEngineer: {
          name: currentUser?.fullName || "QA/QC Lead",
          signed: true,
          signedAt: new Date().toISOString(),
        },
      },
      notes,
      createdAt: new Date().toISOString(),
    };

    await dbService.savePermitToPour(newPtp);
    await clearFormDraft("POUR_PERMIT", currentProjId);

    if (currentUser) {
      await writeAudit({
        projectId: currentProjId,
        companyId: currentCompId,
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "ISSUE_PERMIT_TO_POUR",
        module: "PermitToPour",
        details: `Issued Permit to Pour ${ptpNumber} for ${elementName || "Pour Zone"} (${targetVolumeM3} m³ of ${concreteGrade})`,
        newValue: newPtp,
      });
    }

    navigate(`/project/permit-to-pour/${newPtp.id}`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/project/permit-to-pour")}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-mono text-xs uppercase tracking-wider mb-0.5">
              <span>
                Concrete Casting Authorization (ISO 9001:2015 Clause 8.5.1)
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Issue Permit to Pour (PTP)
            </h1>
          </div>
        </div>

        <span className="px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-xs font-bold border border-amber-200 dark:border-amber-500/30">
          Ref: {ptpNumber}
        </span>
      </div>

      <DraftBanner
        hasDraft={hasDraft}
        draftTime={draftTime}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        formName="Permit to Pour"
      />

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Pour Schedule & Location */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
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
            onElementChange={(elId, elName, elAxis) => {
              setElementId(elId);
              setElementName(elName);
              if(elAxis) setGridAxis(elAxis);
            }}
            required
          />

          <TradeSubtradeSelect
            companyId={currentCompId}
            selectedTradeId={tradeId}
            selectedTradeName={tradeName}
            selectedSubtrade={subtradeName}
            onTradeChange={(tId, tName) => {
              setTradeId(tId);
              setTradeName(tName);
            }}
            onSubtradeChange={(stName) => setSubtradeName(stName)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Planned Pour Date *
              </label>
              <input
                type="date"
                value={plannedPourDate}
                onChange={(e) => setPlannedPourDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Planned Pour Time *
              </label>
              <input
                type="text"
                value={plannedPourTime}
                onChange={(e) => setPlannedPourTime(e.target.value)}
                placeholder="e.g. 06:00 AM"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Target Volume (m³) *
              </label>
              <input
                type="number"
                step="0.1"
                value={targetVolumeM3}
                onChange={(e) => setTargetVolumeM3(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Concrete Grade *
              </label>
              <input
                type="text"
                value={concreteGrade}
                onChange={(e) => setConcreteGrade(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Target Slump (mm)
              </label>
              <input
                type="number"
                value={slumpTargetMm}
                onChange={(e) => setSlumpTargetMm(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Batching Plant Source
              </label>
              <input
                type="text"
                value={supplierBatchPlant}
                onChange={(e) => setSupplierBatchPlant(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Transit Mixers (Trucks)
              </label>
              <input
                type="number"
                value={truckDeliveryCountEstimate}
                onChange={(e) =>
                  setTruckDeliveryCountEstimate(Number(e.target.value))
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Mandatory Pre-Pour Hold Points Checklist */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <span className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px]">
            Multi-Disciplinary Pre-Pour Hold Points
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition">
              <input
                type="checkbox"
                checked={rebarInspectionApproved}
                onChange={(e) => setRebarInspectionApproved(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                Rebar Reinforcement Inspection Passed
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition">
              <input
                type="checkbox"
                checked={formworkStabilityChecked}
                onChange={(e) => setFormworkStabilityChecked(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                Formwork & Falsework Stability Certified
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition">
              <input
                type="checkbox"
                checked={mepEmbedsSleevesClear}
                onChange={(e) => setMepEmbedsSleevesClear(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                MEP Sleeves & Embeds Clearance Sign-Off
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition">
              <input
                type="checkbox"
                checked={jointCleanlinessWaterjet}
                onChange={(e) => setJointCleanlinessWaterjet(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                Joint Cleanliness & Waterjetting Verified
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition">
              <input
                type="checkbox"
                checked={concreteMixGradeSlumpVerified}
                onChange={(e) =>
                  setConcreteMixGradeSlumpVerified(e.target.checked)
                }
                className="rounded text-amber-500"
              />
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                Mix Grade & Batch Slump Pre-Approved
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition">
              <input
                type="checkbox"
                checked={vibratorsPumpsStandbyReady}
                onChange={(e) =>
                  setVibratorsPumpsStandbyReady(e.target.checked)
                }
                className="rounded text-amber-500"
              />
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                Standby Poker Vibrators & Backup Pump Ready
              </span>
            </label>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px]">
              Final Verification Checklist
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {checklistItems.filter((item) => item.status === "PASS").length}/
              {checklistItems.length} passed
            </span>
          </div>
          <div className="space-y-2">
            {checklistItems.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border ${
                  item.status === "PASS"
                    ? "bg-emerald-50/40 border-emerald-200"
                    : item.status === "FAIL"
                      ? "bg-rose-50/40 border-rose-200"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-start gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-extrabold uppercase shrink-0">
                    {item.category}
                  </span>
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 gap-1">
                  {(["PASS", "FAIL", "N/A"] as PermitChecklistStatus[]).map(
                    (status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() =>
                          handleChecklistStatusChange(item.id, status)
                        }
                        className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md transition ${
                          item.status === status
                            ? status === "PASS"
                              ? "bg-emerald-600 text-white"
                              : status === "FAIL"
                                ? "bg-rose-600 text-white"
                                : "bg-slate-600 text-white"
                            : "text-slate-500 hover:bg-white dark:hover:bg-slate-800"
                        }`}
                      >
                        {status}
                      </button>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate("/project/permit-to-pour")}
            className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isDraftSaving || !canCreatePTP}
            title={!canCreatePTP ? "You do not have permission to create Permits to Pour" : undefined}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-500/30 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{isDraftSaving ? "Saving Draft..." : "Save as Draft"}</span>
          </button>
          <button
            type="submit"
            disabled={!canCreatePTP}
            title={!canCreatePTP ? "You do not have permission to create Permits to Pour" : undefined}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-xl shadow-amber-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>Authorize & Issue Permit to Pour</span>
          </button>
        </div>
      </form>
    </div>
  );
};
