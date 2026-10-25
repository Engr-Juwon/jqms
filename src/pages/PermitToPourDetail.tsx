import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { dbService } from "@/lib/db";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import {
  generatePermitToPourPDF,
  generatePermitToPourPrint,
  StakeholderSignoff,
} from "@/lib/pdfGenerators";
import { PermitToPour } from "@/types";
import { hasPermission } from "@/lib/rbac";
import {
  ROLE_TITLES,
  isUserEligibleForStakeholderRole,
  getUserSigningTitle,
} from "@/lib/permissions";
import {
  HardHat,
  ArrowLeft,
  FileDown,
  Save,
  CheckCircle2,
  Calendar,
  Layers,
  Clock,
  ShieldCheck,
  AlertCircle,
  Lock,
} from "lucide-react";
import {
  PermitChecklistItem,
  PermitChecklistStatus,
  createDefaultPermitChecklist,
} from "@/lib/permitChecklist";
import MultiLevelElementSelect, {
  SelectedElementItem,
} from "@/components/masterdata/MultiLevelElementSelect";
import TradeSubtradeSelect from "@/components/masterdata/TradeSubtradeSelect";

export const PermitToPourDetail: React.FC = () => {
  const { projectId, id } = useParams<{ projectId: string; id: string }>();
  const navigate = useNavigate();
  const { currentUser, company } = useAuthStore();
  const { activeProject } = useProjectStore();
  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";

  const [ptp, setPtp] = useState<PermitToPour | null>(null);
  const [ptpStatus, setPTPStatus] = useState("REJECTED");
  const [loading, setLoading] = useState(true);

  const canEditPTP = hasPermission(currentUser?.role, "EDIT_PTP");
  const canSignQAQC = hasPermission(currentUser?.role, "SIGN_PTP_QAQC");
  const canSignCM = hasPermission(currentUser?.role, "SIGN_PTP_CM");
  const canSignConsultant = hasPermission(
    currentUser?.role,
    "SIGN_PTP_CONSULTANT",
  );
  const canAuthorizePour = hasPermission(
    currentUser?.role,
    "AUTHORIZE_POUR_FINAL",
  );
  const canDeletePTP = hasPermission(currentUser?.role, "DELETE_PTP");

  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [zone, setZone] = useState("");
  const [elementType, setElementType] = useState("");
  const [elementRef, setElementRef] = useState("");
  const [pourDate, setPourDate] = useState("");
  const [pourTime, setPourTime] = useState("");
  const [concreteGrade, setConcreteGrade] = useState("");
  const [slumpTargetMm, setslumpTargetMm] = useState(20);
  const [estimatedVolume, setEstimatedVolume] = useState("");
  const [checklistItems, setChecklistItems] = useState<PermitChecklistItem[]>(
    [],
  );

  const [levelId, setLevelId] = useState("");
  const [levelName, setLevelName] = useState("");
  const [elementId, setElementId] = useState("");
  const [elementName, setElementName] = useState("");
  const [selectedElements, setSelectedElements] = useState<
    SelectedElementItem[]
  >([]);
  const [tradeId, setTradeId] = useState("");
  const [gridAxis, setGridAxis] = useState("");
  const [tradeName, setTradeName] = useState("Structural Concrete");
  const [subtradeName, setSubtradeName] = useState(
    "Concrete Placement & Pouring",
  );

  // ─── SECTION 4 STATE: POST-POUR RECORD ───
  const [actualStartTime, setActualStartTime] = useState("");
  const [actualEndTime, setActualEndTime] = useState("");
  const [actualVolume, setActualVolume] = useState("");
  const [slumpTruck1, setSlumpTruck1] = useState("");
  const [slumpTruck2, setSlumpTruck2] = useState("");
  const [slumpTruck3, setSlumpTruck3] = useState("");
  const [cubeSetId, setCubeSetId] = useState("");
  const [cubeCount, setCubeCount] = useState("6");
  const [curingMethod, setCuringMethod] = useState("Hessian & Water");

  const [saving, setSaving] = useState(false);

  const [customRoleInput, setCustomRoleInput] = useState("");
  const [stakeholders, setStakeholders] = useState<StakeholderSignoff[]>([
    { role: "QA/QC Engineer", required: true, name: "" },
    { role: "Site / Construction Manager", required: true, name: "" },
    { role: "Structural Consultant / Engineer", required: true, name: "" },
    { role: "Mechanical Engineer", required: false, name: "" },
    { role: "Electrical Engineer", required: false, name: "" },
  ]);

  useEffect(() => {
    if (ptp) {
      if (ptp.stakeholders && ptp.stakeholders.length > 0) {
        // Ensure QA/QC Engineer always exists in the array if missing
        const hasQAQC = ptp.stakeholders.some((s: any) =>
          s.role.toLowerCase().includes("qa/qc"),
        );
        if (!hasQAQC) {
          setStakeholders([
            { role: "QA/QC Engineer", required: true, name: "" },
            ...ptp.stakeholders,
          ]);
        } else {
          setStakeholders(ptp.stakeholders);
        }
      }
    }
  }, [ptp]);

  const CONCRETE_GRADES = [
    "C20/25",
    "C25/30",
    "C28/35",
    "C30/37",
    "C32/40",
    "C35/45",
    "C40/50",
    "C45/55",
    "C50/60",
    "C60/75",
  ];

  useEffect(() => {
    async function load() {
      if (!currentProjId || !id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const list = await dbService.getPermitsToPour(
        currentProjId,
        currentCompId,
      );
      const match = list.find(
        (p: PermitToPour) => p.id === id || p.ptpNumber === id,
      );
      setPtp(match || null);
      if (match) {
        setBuilding(match.building || "");
        setFloor(match.floor || match.levelName || "");
        setZone(match.zone || match.gridAxis || "");
        setElementType(match.elementType || "");
        setElementRef(match.elementRef || match.elementName || "");
        setPourDate(match.pourDate || match.plannedPourDate || "");
        setPourTime(match.pourTime || match.plannedPourTime || "");
        setConcreteGrade(match.concreteGrade || "");
        setEstimatedVolume(
          String(match.estimatedVolume ?? match.targetVolumeM3 ?? ""),
        );
        setLevelId(match.levelId || "");
        setLevelName(match.levelName || match.floor || "");
        setGridAxis(match.gridAxis || match.zone || "");
        setElementId(match.elementId || "");
        setElementName(match.elementName || match.elementRef || "");
        if (match.elementsData && match.elementsData.length > 0) {
          setSelectedElements(match.elementsData);
        } else if (match.elementId || match.elementName) {
          setSelectedElements([
            {
              id: match.elementId || `el-${Date.now()}`,
              elementName:
                match.elementName ||
                match.elementRef ||
                "Structural Pour Zone",
              levelId: match.levelId,
              levelName: match.levelName,
              grid: match.gridAxis || match.zone,
              elementType: match.elementType,
            },
          ]);
        }
        setTradeId(match.tradeId || "");
        setTradeName(match.tradeName || "Structural Concrete");
        setSubtradeName(match.subtradeName || "Concrete Placement & Pouring");
        setPTPStatus(match.status);
        setChecklistItems(
          (match.checklistItems as PermitChecklistItem[]) ||
            createDefaultPermitChecklist(),
        );
        setslumpTargetMm(match.slumpTargetMm ?? 20);
        if (match.stakeholders && match.stakeholders.length > 0) {
          setStakeholders(match.stakeholders);
        }
      }
      setLoading(false);
    }
    load();
  }, [currentProjId, currentCompId, id]);

  const handleChecklistStatusChange = (
    itemId: string,
    status: PermitChecklistStatus,
  ) => {
    setChecklistItems((items) =>
      items.map((item) => (item.id === itemId ? { ...item, status } : item)),
    );
  };

  const handleSaveChanges = async () => {
    if (!ptp) return;

    if (!canEditPTP && !canSignQAQC) {
      toast.error(
        "Permission Denied: You do not have statutory permission to edit or update this Permit to Pour.",
      );
      return;
    }

    setSaving(true);
    try {
      const updated: PermitToPour = {
        ...ptp,
        building,
        floor,
        levelId: levelId || ptp.levelId || "",
        levelName: levelName || floor || ptp.levelName || "",
        zone,
        gridAxis: gridAxis || zone || ptp.gridAxis || "",
        elementType,
        elementRef,
        elementId: elementId || ptp.elementId || "",
        elementName: elementName || elementRef || ptp.elementName || "",
        elementIds: selectedElements.map((e) => e.id),
        elementNames: selectedElements.map((e) => e.elementName),
        elementsData: selectedElements,
        tradeId: tradeId || ptp.tradeId || "",
        tradeName: tradeName || ptp.tradeName || "Structural Concrete",
        subtradeName:
          subtradeName || ptp.subtradeName || "Concrete Placement & Pouring",
        pourDate,
        pourTime,
        plannedPourDate: pourDate,
        plannedPourTime: pourTime,
        concreteGrade,
        estimatedVolume: Number(estimatedVolume) || 0,
        targetVolumeM3: Number(estimatedVolume) || 0,
        checklistItems,
        slumpTargetMm,
        stakeholders,
        status: checklistItems.some((item) => item.status === "FAIL")
          ? "REJECTED"
          : ptp.status,
        updatedAt: new Date().toISOString(),
      };
      await dbService.savePermitToPour(updated);
      setPtp(updated);
      toast.success("Permit to Pour updated successfully");
    } catch (err) {
      console.error("Failed to save PTP:", err);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const toggleStakeholderRequired = (index: number) => {
    setStakeholders((prev) =>
      prev.map((sh, i) =>
        i === index ? { ...sh, required: !sh.required } : sh,
      ),
    );
  };

  const updateStakeholder = (
    index: number,
    fields: Partial<StakeholderSignoff>,
  ) => {
    setStakeholders((prev) =>
      prev.map((sh, i) => (i === index ? { ...sh, ...fields } : sh)),
    );
  };

  const handleAddCustomStakeholder = () => {
    if (!customRoleInput.trim()) return;
    setStakeholders((prev) => [
      ...prev,
      {
        role: customRoleInput.trim(),
        designation: customRoleInput.trim(),
        required: true,
        name: "",
      },
    ]);
    setCustomRoleInput("");
  };

  const handleRemoveStakeholder = (index: number) => {
    setStakeholders((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
        Loading pour permit...
      </div>
    );
  }

  if (!ptp) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-200">
          Permit to Pour Not Found
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The requested casting clearance permit could not be found for this
          project workspace.
        </p>
        <button
          onClick={() => navigate("/project/permit-to-pour")}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition shadow"
        >
          Return to Permit to Pour List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/project/permit-to-pour")}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-mono text-xs uppercase tracking-wider mb-0.5">
              <span>{ptp.ptpNumber}</span>
              <span>•</span>
              <span>
                Authorized Pour Clearance (ISO 9001:2015 Clause 8.5.1)
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {ptp.elementName}
            </h1>
          </div>
        </div>

        <button
          onClick={() =>
            generatePermitToPourPrint(ptp, activeProject || {}, company || {})
          }
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm transition"
        >
          <FileDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Print PTP</span>
        </button>

        <button
          onClick={() =>
            generatePermitToPourPDF(ptp, activeProject || {}, company || {})
          }
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm transition"
        >
          <FileDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Export PTP Certificate</span>
        </button>
      </div>

      {/* Pour Identity & Volume Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">
              Planned Pour Date
            </span>
            <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">
              {ptp.plannedPourDate} @ {ptp.plannedPourTime}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">
              Authorized Volume
            </span>
            <span className="font-mono text-brand-600 dark:text-brand-300 font-bold text-sm">
              {ptp.targetVolumeM3} m³
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">
              Concrete Grade
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {ptp.concreteGrade}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">
              Slump Spec
            </span>
            <span className="font-mono text-slate-800 dark:text-slate-200">
              {ptp.slumpTargetMm} mm
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4 text-xs">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Permit Details & Authorizations
          </h3>
          <button
            onClick={handleSaveChanges}
            disabled={saving || (!canEditPTP && !canSignQAQC)}
            title={
              !canEditPTP && !canSignQAQC
                ? "Permission Denied: Level 2+ required to edit this Permit to Pour"
                : undefined
            }
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <MultiLevelElementSelect
            projectId={currentProjId}
            companyId={currentCompId}
            selectedElements={selectedElements}
            onChange={(items) => {
              setSelectedElements(items);
              if (items.length > 0) {
                const names = items.map((i) => i.elementName).join(", ");
                const grids = Array.from(
                  new Set(items.map((i) => i.grid).filter(Boolean)),
                ).join(", ");
                const levels = Array.from(
                  new Set(items.map((i) => i.levelName).filter(Boolean)),
                ).join(", ");
                setElementName(names);
                setElementRef(names);
                setElementId(items[0].id);
                if (items[0].levelId) setLevelId(items[0].levelId);
                if (levels) setLevelName(levels);
                if (grids) setGridAxis(grids);
              } else {
                setElementName("");
                setElementRef("");
                setElementId("");
              }
            }}
            required
            label="Structural Elements Scheduled for Concrete Pour"
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
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Concrete Mix Design / Grade
            </label>
            <select
              value={concreteGrade}
              onChange={(e) => setConcreteGrade(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              {CONCRETE_GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          {[
            ["Pour Date", pourDate, setPourDate],
            ["Pour Time", pourTime, setPourTime],
            ["Estimated Volume (m³)", estimatedVolume, setEstimatedVolume],
            ["slumpTargetMm", slumpTargetMm, setslumpTargetMm],
          ].map(([label, value, setter]) => (
            <label key={label as string} className="space-y-1">
              <span className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                {label as string}
              </span>
              <input
                value={value as string}
                onChange={(event) =>
                  (setter as (value: string) => void)(event.target.value)
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </label>
          ))}
        </div>
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
          <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Stakeholders Who Will Sign This PTP
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {stakeholders.map((stakeholder, index) => (
              <div
                key={`${stakeholder.role}-${index}`}
                className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              >
                <input
                  type="checkbox"
                  checked={stakeholder.required}
                  onChange={(event) =>
                    setStakeholders((items) =>
                      items.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, required: event.target.checked }
                          : item,
                      ),
                    )
                  }
                  className="w-4 h-4 accent-amber-600"
                />
                <input
                  value={stakeholder.role}
                  onChange={(event) =>
                    setStakeholders((items) =>
                      items.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, role: event.target.value }
                          : item,
                      ),
                    )
                  }
                  className="min-w-0 flex-1 bg-transparent font-bold text-xs text-slate-800 dark:text-slate-200 outline-none"
                />
                <input
                  placeholder="Signer name"
                  value={stakeholder.name || ""}
                  onChange={(event) =>
                    setStakeholders((items) =>
                      items.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, name: event.target.value }
                          : item,
                      ),
                    )
                  }
                  className="w-32 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {checklistItems.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4 text-xs">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Pre-Pour Checklist
            </h3>
            <span className="font-mono font-bold text-slate-500 dark:text-slate-400">
              {checklistItems.filter((item) => item.status === "PASS").length}/
              {checklistItems.length} PASS
            </span>
          </div>
          <div className="space-y-2">
            {checklistItems.map((item, index) => (
              <div
                key={item.id || index}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                  <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {index + 1}
                  </span>
                  <div>
                    <span className="font-bold text-[10px] uppercase text-slate-500 dark:text-slate-400 mr-2">
                      {item.category}
                    </span>
                    {item.label}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {(["PASS", "FAIL", "N/A"] as PermitChecklistStatus[]).map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() =>
                          handleChecklistStatusChange(
                            item.id || String(index),
                            status,
                          )
                        }
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${item.status === status ? (status === "PASS" ? "bg-emerald-600 text-white" : status === "FAIL" ? "bg-rose-600 text-white" : "bg-slate-600 text-white") : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
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
      )}

      {/* SECTION 3: TRADE SIGNOFF AUTHORIZATIONS */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 bg-gray-100 p-2.5 rounded-lg flex justify-between items-center">
          <span>SECTION 3: TRADE SIGNOFF AUTHORIZATIONS</span>
        </h3>

        {ptp.status === "REJECTED" ? (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            Status is REJECTED: Only QA/QC Engineer signoff will be included on
            the document.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {stakeholders.map((sh, idx) => {
                const isQAQC = sh.role.toLowerCase().includes("qa/qc");
                const canSignThisRole = isUserEligibleForStakeholderRole(
                  currentUser,
                  sh.role,
                );
                const isSignedByMe =
                  sh.signed && sh.name === currentUser?.fullName;
                const canClearSign =
                  sh.signed &&
                  (isSignedByMe ||
                    (currentUser?.role &&
                      hasPermission(currentUser.role, "AUTHORIZE_POUR_FINAL")));

                return (
                  <div
                    key={idx}
                    className={`p-3.5 border rounded-xl transition-all flex flex-col justify-between ${
                      sh.signed
                        ? "bg-emerald-50/70 border-emerald-400 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-200"
                        : sh.required
                          ? "bg-amber-50/40 border-amber-200 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                          : "bg-gray-50 border-gray-200 text-gray-400 opacity-60 dark:bg-slate-950/40 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold uppercase text-[10px] flex items-center gap-1.5">
                        {sh.role}
                        {sh.signed && (
                          <span className="bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded">
                            SIGNED
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        disabled={isQAQC}
                        onClick={() => toggleStakeholderRequired(idx)}
                        className={`text-[9px] font-black px-2 py-0.5 rounded ${
                          sh.required
                            ? "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200"
                            : "bg-gray-200 text-gray-600 dark:bg-slate-800 dark:text-slate-400"
                        } ${isQAQC ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                      >
                        {isQAQC
                          ? "MANDATORY"
                          : sh.required
                            ? "REQUIRED"
                            : "OPTIONAL"}
                      </button>
                    </div>

                    {/* Signatory Particulars & Strict Role Signing */}
                    <div className="space-y-2 my-2 bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-lg border border-gray-200/80 dark:border-slate-800">
                      {sh.signed ? (
                        <div className="space-y-1.5 py-1">
                          <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                            <span>{sh.name}</span>
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                              {sh.signedAt
                                ? new Date(sh.signedAt).toLocaleDateString()
                                : "Signed"}
                            </span>
                          </div>
                          <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                            {sh.designation || sh.role}
                          </div>
                          {canClearSign && (
                            <button
                              type="button"
                              onClick={() =>
                                updateStakeholder(idx, {
                                  name: "",
                                  designation: "",
                                  signed: false,
                                  signedAt: undefined,
                                })
                              }
                              className="text-[10px] text-rose-600 hover:underline font-bold mt-1 inline-block"
                            >
                              Clear / Resign
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-0.5">
                              Signatory Full Name
                            </label>
                            <input
                              type="text"
                              value={sh.name || ""}
                              disabled={!canSignThisRole}
                              onChange={(e) =>
                                updateStakeholder(idx, { name: e.target.value })
                              }
                              placeholder={
                                canSignThisRole
                                  ? "Enter your full name"
                                  : `Awaiting ${sh.role} signature`
                              }
                              className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-xs font-semibold outline-none focus:border-[#ea580c] text-gray-900 dark:text-white disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-950"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-0.5">
                              Signatory Designation / Title
                            </label>
                            <input
                              type="text"
                              value={sh.designation || ""}
                              disabled={!canSignThisRole}
                              onChange={(e) =>
                                updateStakeholder(idx, {
                                  designation: e.target.value,
                                })
                              }
                              placeholder={`e.g. ${sh.role}`}
                              className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-xs font-semibold outline-none focus:border-[#ea580c] text-gray-900 dark:text-white disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-950"
                            />
                          </div>
                          {canSignThisRole ? (
                            <button
                              type="button"
                              onClick={() =>
                                updateStakeholder(idx, {
                                  name: currentUser?.fullName || "",
                                  designation: getUserSigningTitle(currentUser),
                                  signed: true,
                                  signedAt: new Date().toISOString(),
                                })
                              }
                              className="text-[10px] text-[#ea580c] hover:underline font-bold text-left block mt-1"
                            >
                              + Sign as {currentUser?.fullName} (
                              {getUserSigningTitle(currentUser)})
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 italic pt-1">
                              <Lock size={10} className="text-slate-400 shrink-0" />
                              <span>Only {sh.role} can sign this section</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200/60 dark:border-slate-800">
                      <span className="text-[10px] font-medium text-gray-500">
                        {sh.required
                          ? "Will appear on PDF"
                          : "Excluded from PDF"}
                      </span>
                      {!isQAQC && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStakeholder(idx)}
                          className="text-rose-500 hover:text-rose-700 text-[10px] font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Custom Trade Input */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="e.g. Site Surveyor / Geotechnical Engineer"
                value={customRoleInput}
                // disabled={!canUpdatePermit}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-[#ea580c]"
              />
              <button
                type="button"
                // disabled={!canUpdatePermit}
                onClick={handleAddCustomStakeholder}
                className="bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                + Add Signoff
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: POST-POUR RECORD */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 bg-gray-100 p-2.5 rounded-lg">
          SECTION 4: POST-POUR RECORD
        </h3>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-500 mb-1">
                Actual Start Time
              </label>
              <input
                type="time"
                value={actualStartTime}
                // disabled={!canUpdatePermit}
                onChange={(e) => setActualStartTime(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-medium outline-none focus:border-[#ea580c]"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-500 mb-1">
                Completion Time
              </label>
              <input
                type="time"
                value={actualEndTime}
                // disabled={!canUpdatePermit}
                onChange={(e) => setActualEndTime(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-medium outline-none focus:border-[#ea580c]"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-500 mb-1">
                Actual Volume Poured (m³)
              </label>
              <input
                type="number"
                step="0.1"
                value={actualVolume}
                // disabled={!canUpdatePermit}
                onChange={(e) => setActualVolume(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-medium outline-none focus:border-[#ea580c]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-500 mb-1">
                Slump Truck 1 (mm)
              </label>
              <input
                type="text"
                value={slumpTruck1}
                // disabled={!canUpdatePermit}
                onChange={(e) => setSlumpTruck1(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-medium outline-none focus:border-[#ea580c]"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-500 mb-1">
                Slump Truck 2 (mm)
              </label>
              <input
                type="text"
                value={slumpTruck2}
                // disabled={!canUpdatePermit}
                onChange={(e) => setSlumpTruck2(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-medium outline-none focus:border-[#ea580c]"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-500 mb-1">
                Slump Truck 3 (mm)
              </label>
              <input
                type="text"
                value={slumpTruck3}
                // disabled={!canUpdatePermit}
                onChange={(e) => setSlumpTruck3(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-medium outline-none focus:border-[#ea580c]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-gray-500 mb-1">
                Cube Sample Set ID
              </label>
              <input
                type="text"
                value={cubeSetId}
                // disabled={!canUpdatePermit}
                onChange={(e) => setCubeSetId(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-medium outline-none focus:border-[#ea580c]"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-500 mb-1">
                Total Cubes
              </label>
              <input
                type="text"
                value={cubeCount}
                // disabled={!canUpdatePermit}
                onChange={(e) => setCubeCount(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-medium outline-none focus:border-[#ea580c]"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-500 mb-1">
                Curing Method
              </label>
              <select
                value={curingMethod}
                // disabled={!canUpdatePermit}
                onChange={(e) => setCuringMethod(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-medium outline-none focus:border-[#ea580c]"
              >
                <option value="Hessian & Water">Hessian & Water</option>
                <option value="Ponding">Ponding</option>
                <option value="Curing Compound">Curing Compound Spray</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
      );
};
