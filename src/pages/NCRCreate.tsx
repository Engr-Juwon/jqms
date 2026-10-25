import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  ShieldAlert,
  Calendar,
  Clock,
  MapPin,
  Link2,
  FileText,
  Loader2,
  Briefcase,
  Building2,
  Clipboard,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import { plannerSync } from "@/lib/plannerSync";
import { NonConformanceReport, StatusHistoryEntry } from "@/types";
import TradeSubtradeSelect, {
  type TradeSelection,
} from "@/components/masterdata/TradeSubtradeSelect";
import LevelElementSelect, {
  type LevelElementSelection,
} from "@/components/masterdata/LevelElementSelect";
import MultiLevelElementSelect, {
  type SelectedElementItem,
} from "@/components/masterdata/MultiLevelElementSelect";
import { toast } from "react-hot-toast";
import { generateNcrNumber } from "@/lib/naming";
import { UniversalPhotoUploader, PhotoItem } from "@/components/common/UniversalPhotoUploader";

const inputClass =
  "w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-[13px] font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-orange-100 transition-all shadow-sm placeholder:text-gray-400";

interface FieldProps {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  required?: boolean;
}

const Field: React.FC<FieldProps> = ({ label, icon, children, required }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
      {icon}
      <span>{label}</span>
      {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

export const NCRCreate: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const { currentUser, company } = useAuthStore();
  const { activeProject } = useProjectStore();
  const navigate = useNavigate();

  const authUser = currentUser;
  const activeProjId = activeProject?.id || projectId || "";
  const activeCompId =
    authUser?.companyId || company?.id || activeProject?.companyId || "";

  const [submitting, setSubmitting] = useState(false);
  const [ncrPhotos, setNcrPhotos] = useState<PhotoItem[]>([]);
  const canCreateNCR = authUser?.role ? hasPermission(authUser.role, "CREATE_NCR") : true;

  const [selectedElements, setSelectedElements] = useState<SelectedElementItem[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    category: "Structural",
    elementId: "",
    elementName: "",
    elementType: "",
    locationLevel: "",
    gridLine: "",
    dateFound: new Date().toISOString().split("T")[0],
    deadline: "",
    assignedToName: "",
    rootCauseType: "Workmanship" as
      | "Workmanship"
      | "Material Defect"
      | "Drawing Error"
      | "Other",
    rootCauseOtherText: "",
    sourceInspectionId: "",
    sourceItemId: "",
  });

  const [tradeSelection, setTradeSelection] = useState<TradeSelection>({
    tradeId: "",
    tradeName: "",
    subtradeId: "",
    subtradeName: "",
  });

  const handleSelectedElementsChange = (items: SelectedElementItem[]) => {
    setSelectedElements(items);
    if (items.length > 0) {
      const names = items.map((i) => i.elementName).join(", ");
      const grids = Array.from(
        new Set(items.map((i) => i.grid).filter(Boolean)),
      ).join(", ");
      const levels = Array.from(
        new Set(items.map((i) => i.levelName).filter(Boolean)),
      ).join(", ");
      const types = Array.from(
        new Set(items.map((i) => i.elementType).filter(Boolean)),
      );

      setForm((prev) => ({
        ...prev,
        elementId: items[0].id,
        elementName: names,
        elementType:
          (types.length === 1
            ? types[0]
            : types.length > 1
              ? "Multiple"
              : prev.elementType) || "",
        locationLevel: levels || prev.locationLevel,
        gridLine: grids || prev.gridLine,
        title:
          prev.title ||
          (items.length === 1
            ? `Defect identified on ${items[0].elementName}`
            : `Defect across ${items.length} elements (${items.slice(0, 3).map((i) => i.elementName).join(", ")}${items.length > 3 ? "..." : ""})`),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        elementId: "",
        elementName: "",
        elementType: "",
        gridLine: "",
      }));
    }
  };

  useEffect(() => {
    // Check for pending escalation from Site Comments
    const pendingEscalation = sessionStorage.getItem("pending_ncr_escalation");
    if (pendingEscalation) {
      try {
        const parsed = JSON.parse(pendingEscalation);
        setForm((prev) => ({
          ...prev,
          title: parsed.title || prev.title,
          locationLevel: parsed.locationLevel || prev.locationLevel,
          gridLine: parsed.gridLine || prev.gridLine,
          priority: parsed.priority || prev.priority,
          description: parsed.description || prev.description,
          assignedToName: parsed.assignedToName || prev.assignedToName,
          elementId: "SITE_LOCATION",
          elementName: parsed.locationLevel
            ? `Site Location (${parsed.locationLevel})`
            : "Site Location",
        }));
        sessionStorage.removeItem("pending_ncr_escalation");
        toast.success("Pre-filled NCR form from escalated site observation!");
      } catch (err) {
        console.error("Failed to parse escalation data", err);
      }
    }

    const paramElementId = searchParams.get("elementId");
    const paramElementName = searchParams.get("elementName");
    const paramLocationLevel = searchParams.get("locationLevel");
    const paramGridLine = searchParams.get("gridLine");
    const paramSourceInsp = searchParams.get("sourceInspectionId");
    const paramSourceItem = searchParams.get("sourceItemId");
    const paramTitle = searchParams.get("title");
    const paramDesc = searchParams.get("description");

    if (
      paramElementId ||
      paramElementName ||
      paramSourceInsp ||
      paramLocationLevel
    ) {
      setForm((prev) => ({
        ...prev,
        elementId: paramElementId || prev.elementId || "SITE_LOCATION",
        elementName: paramElementName || prev.elementName || "Site Location",
        locationLevel: paramLocationLevel || prev.locationLevel,
        gridLine: paramGridLine || prev.gridLine,
        sourceInspectionId: paramSourceInsp || prev.sourceInspectionId,
        sourceItemId: paramSourceItem || prev.sourceItemId,
        title:
          paramTitle ||
          prev.title ||
          (paramElementName ? `Defect identified on ${paramElementName}` : ""),
        description: paramDesc || prev.description,
      }));

      if (paramElementId && paramElementId !== "SITE_LOCATION") {
        setSelectedElements((prev) => {
          if (prev.some((e) => e.id === paramElementId)) return prev;
          return [
            {
              id: paramElementId,
              elementName: paramElementName || "Selected Element",
              grid: paramGridLine || "",
              levelName: paramLocationLevel || "",
            },
            ...prev,
          ];
        });
      }
    }
  }, [searchParams]);

  const handleSubmit = async () => {
    if (submitting) return;
    if (!canCreateNCR) {
      toast.error("You do not have permission to create NCRs");
      return;
    }
    if (!activeCompId || !activeProjId) {
      toast.error("Active project workspace is required to create an NCR");
      return;
    }
    if (!authUser) {
      toast.error("You must be logged in to create an NCR");
      return;
    }

    if (!form.title.trim()) {
      toast.error("NCR Title is required");
      return;
    }
    if (form.deadline && form.deadline < form.dateFound) {
      toast.error("Action deadline cannot be before the date found");
      return;
    }

    setSubmitting(true);
    try {
      const timestamp = Date.now();
      const projectCode = activeProject?.code?.toUpperCase() || "NCR";
      let finalNumber = "";
      try {
        const seq = await dbService.getNextSequenceNumber(
          activeCompId,
          activeProjId,
          `${projectCode}-NCR`,
        );
        finalNumber = seq.formattedCode;
      } catch {
        finalNumber = generateNcrNumber(projectCode);
      }

      const statusHistory: StatusHistoryEntry[] = [
        {
          status: "OPEN",
          userId: authUser?.uid || "user",
          userName: authUser?.fullName || "QA Engineer",
          comment: "NCR created via contextual element registry route",
          timestamp,
        },
      ];

      const descriptionItems = form.description
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (descriptionItems.length === 0 && form.title) {
        descriptionItems.push(form.title);
      }

      const elementIds = selectedElements.map((e) => e.id);
      const elementNames = selectedElements.map((e) => e.elementName);
      const elementsData = selectedElements.map((e) => ({
        id: e.id,
        elementName: e.elementName,
        elementType: e.elementType,
        levelId: e.levelId,
        levelName: e.levelName,
        grid: e.grid,
      }));

      const primaryElementId = elementIds[0] || form.elementId || "SITE_LOCATION";
      const primaryElementName =
        elementNames.length > 0 ? elementNames.join(", ") : form.elementName || "Site Area";

      const finalTradeName =
        tradeSelection.tradeName || form.category || "Civil / Structural";
      const finalTradeId = tradeSelection.tradeId || "trade-civil";

      const payload: NonConformanceReport = {
        id: `ncr-${Date.now()}`,
        ncrNumber: finalNumber,
        title: form.title.trim(),
        description: form.description.trim(),
        descriptionItems,
        status: "OPEN",
        priority: form.priority,
        severity: (form.priority === "CRITICAL"
          ? "CRITICAL"
          : form.priority === "HIGH"
            ? "HIGH"
            : form.priority === "MEDIUM"
              ? "MEDIUM"
              : "LOW") as any,
        photos: ncrPhotos.map((p) => p.url),
        category: form.category || finalTradeName,
        location: form.locationLevel || "Site Level",
        elementName: primaryElementName,
        elementId: primaryElementId,
        elementType: form.elementType || "Structural",
        elementIds: elementIds.length > 0 ? elementIds : [primaryElementId],
        elementNames: elementNames.length > 0 ? elementNames : [primaryElementName],
        elementsData: elementsData.length > 0 ? elementsData : undefined,
        locationLevel: form.locationLevel || "Site Level",
        gridLine: form.gridLine || "",
        structuralElementId: primaryElementId,
        dateFound: form.dateFound,
        deadline: form.deadline || undefined,
        trade: finalTradeName,
        tradeId: finalTradeId,
        subtrade: tradeSelection.subtradeName || "",
        subtradeId: tradeSelection.subtradeId || "",
        rootCauseType: form.rootCauseType,
        rootCauseOtherText:
          form.rootCauseType === "Other" ? form.rootCauseOtherText : "",
        rootCause:
          form.rootCauseType === "Other"
            ? `Other: ${form.rootCauseOtherText}`
            : form.rootCauseType,
        correctiveAction: "",
        correctiveActions: [],
        preventiveAction: "",
        raisedBy: {
          uid: authUser.uid,
          name: authUser.fullName,
          role: authUser.role,
        },
        raisedByName: authUser.fullName,
        reportedBy: authUser.fullName,
        assignedTo: "",
        assignedToName: form.assignedToName.trim(),
        projectId: activeProjId,
        projectName: activeProject?.name || "Project Workspace",
        projectAddress: activeProject?.location || "",
        companyId: activeCompId,
        companyName:
          authUser.companyName || company?.name || "JQMS Enterprise",
        attachments: [],
        statusHistory,
        createdAt: timestamp,
        updatedAt: timestamp,
        closedAt: undefined,
        createdBy: authUser.uid,
        finalStatus: "PENDING",
        qaqcEngineerName: "",
        signDate: "",
      };

      await dbService.saveNCR(payload);

      // Non-blocking background sync tasks
      plannerSync.syncEvent({
        relatedId: payload.id,
        relatedModule: "ncr",
        title: `NCR Found: ${form.title}`,
        description: `NCR ${finalNumber} raised on ${form.dateFound}. Trade: ${finalTradeName}. Priority: ${form.priority}.`,
        startDate: form.dateFound,
        startTime: "09:00",
        eventType: "CUSTOM",
        status: "SCHEDULED",
        location: `${form.locationLevel} ${form.gridLine}`.trim(),
        projectId: activeProjId,
        companyId: activeCompId,
        createdBy: authUser.uid,
        eventKey: "found",
      }).catch((e) => console.warn("Planner sync warning:", e));

      if (form.deadline) {
        plannerSync.syncEvent({
          relatedId: payload.id,
          relatedModule: "ncr",
          title: `NCR Deadline: ${form.title}`,
          description: `Action required by ${form.assignedToName || "Responsible party"} for NCR ${finalNumber}. Found: ${form.dateFound}.`,
          startDate: form.deadline,
          startTime: "08:00",
          eventType: "NCR_DEADLINE",
          status: "SCHEDULED",
          location: `${form.locationLevel} ${form.gridLine}`.trim(),
          assignedTo: form.assignedToName,
          projectId: activeProjId,
          companyId: activeCompId,
          createdBy: authUser.uid,
          eventKey: "deadline",
        }).catch((e) => console.warn("Planner sync deadline warning:", e));
      }

      writeAudit({
        userId: authUser.uid,
        userName: authUser.fullName,
        action: "CREATE_NCR",
        module: "NCR",
        details: `Created ${finalNumber} for ${elementNames.length > 1 ? `${elementNames.length} Elements (${primaryElementName})` : `Element: ${primaryElementName}`} at ${form.locationLevel} / Grid: ${form.gridLine}`,
        companyId: activeCompId,
        projectId: activeProjId,
        targetId: payload.id,
      }).catch((e) => console.warn("Audit log warning:", e));

      toast.success(`${finalNumber} created successfully`);
      navigate(`/project/ncrs/${payload.id}`);
    } catch (error) {
      console.error("Failed to create NCR:", error);
      toast.error("Failed to create NCR. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isContextual = !!searchParams.get("elementId");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col antialiased text-slate-900 dark:text-slate-100 transition-colors">
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-4 shadow-sm backdrop-blur-md transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-95"
              title="Return to Registry"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                <span>Quality Assurance</span>
                <span>/</span>
                <span className="text-[#ea580c]">NCR</span>
                {isContextual && (
                  <>
                    <span>/</span>
                    <span className="text-blue-600 flex items-center gap-1">
                      <Link2 size={12} />
                      From Element
                    </span>
                  </>
                )}
              </nav>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Raise New NCR
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !canCreateNCR}
              title={!canCreateNCR ? "You do not have permission to create NCRs" : undefined}
              className="bg-[#ea580c] hover:bg-[#c2410c] disabled:bg-orange-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm flex items-center gap-2 tracking-wide cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating NCR...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Create NCR
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-6">
            {isContextual && (
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-4">
                <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                    Contextual Element Pre-selected
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    Initial element attached. You can select more elements below if they share this defect.
                  </p>
                </div>
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2.5 py-1 rounded-full font-mono">
                  {selectedElements[0]?.elementName || form.elementName || form.elementId?.slice(-8)}
                </span>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Clipboard size={14} className="text-[#ea580c]" />
                NCR Core Details
              </h3>

              <Field
                label="NCR Title"
                icon={<FileText size={12} className="text-slate-400" />}
                required
              >
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Honeycombing on structural column"
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Date Found"
                  icon={<Calendar size={12} className="text-slate-400" />}
                >
                  <input
                    type="date"
                    value={form.dateFound}
                    onChange={(e) =>
                      setForm({ ...form, dateFound: e.target.value })
                    }
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Action Deadline"
                  icon={<Clock size={12} className="text-slate-400" />}
                >
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) =>
                      setForm({ ...form, deadline: e.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field
                label="Itemized Defect Descriptions"
                icon={<FileText size={12} className="text-slate-400" />}
              >
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={5}
                  placeholder={`a. Inconsistent spacing of links on all sides.
b. Column construction joint is littered with binding wires.`}
                  className={`${inputClass} font-mono resize-y`}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Press Enter for independent sub-rows (a, b, c)
                </p>
              </Field>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Building2 size={14} className="text-[#ea580c]" />
                  Structural Location & Affected Elements
                </h3>
                {selectedElements.length > 1 && (
                  <span className="text-[11px] font-bold text-[#ea580c] bg-orange-50 dark:bg-orange-950/60 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                    Multi-Element Issue: {selectedElements.length} Elements Linked
                  </span>
                )}
              </div>

              <MultiLevelElementSelect
                projectId={activeProjId}
                companyId={activeCompId}
                selectedElements={selectedElements}
                onChange={handleSelectedElementsChange}
                required
              />

              {form.elementId === "SITE_LOCATION" && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                  <strong>Site Observation Reference:</strong> {form.locationLevel || "General Site"} {form.gridLine ? `(Grid: ${form.gridLine})` : ""}. You can also pick specific structural elements above.
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <ShieldAlert size={14} className="text-slate-500" />
                Classification & Accountability
              </h3>

              <div>
                <TradeSubtradeSelect
                  companyId={activeCompId}
                  selectedTradeId={tradeSelection.tradeId}
                  selectedTradeName={tradeSelection.tradeName}
                  selectedSubtrade={tradeSelection.subtradeName}
                  onTradeChange={(tId, tName) => {
                    setTradeSelection((prev) => ({
                      ...prev,
                      tradeId: tId,
                      tradeName: tName,
                      subtradeId: "",
                      subtradeName: "",
                    }));
                  }}
                  onSubtradeChange={(stName) => {
                    setTradeSelection((prev) => ({
                      ...prev,
                      subtradeId: stName,
                      subtradeName: stName,
                    }));
                  }}
                  required
                />
              </div>

              <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-850/40">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                  Root Cause Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(
                    [
                      "Workmanship",
                      "Material Defect",
                      "Drawing Error",
                      "Other",
                    ] as const
                  ).map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 cursor-pointer select-none"
                    >
                      <input
                        type="radio"
                        name="rootCauseType"
                        checked={form.rootCauseType === type}
                        onChange={() =>
                          setForm({ ...form, rootCauseType: type })
                        }
                        className="w-4 h-4 text-[#ea580c] accent-orange-600"
                      />
                      <span
                        className={`text-[13px] ${form.rootCauseType === type ? "font-semibold text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}
                      >
                        {type}
                      </span>
                    </label>
                  ))}
                </div>

                {form.rootCauseType === "Other" && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <input
                      value={form.rootCauseOtherText}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          rootCauseOtherText: e.target.value,
                        })
                      }
                      placeholder="Specify alternative root cause..."
                      className={inputClass}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Briefcase size={14} className="text-slate-500" />
                Operational Profile
              </h3>

              <Field
                label="Priority"
                icon={<ShieldAlert size={12} className="text-slate-400" />}
              >
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value as any })
                  }
                  className={inputClass}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </Field>

              <Field
                label="Assigned To"
                icon={<Briefcase size={12} className="text-slate-400" />}
              >
                <input
                  value={form.assignedToName}
                  onChange={(e) =>
                    setForm({ ...form, assignedToName: e.target.value })
                  }
                  placeholder="Subcontractor or site supervisor"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Grid Line Reference"
                icon={<MapPin size={12} className="text-slate-400" />}
              >
                <input
                  value={form.gridLine}
                  onChange={(e) =>
                    setForm({ ...form, gridLine: e.target.value })
                  }
                  placeholder="e.g. A-10 / Grid 4"
                  disabled={isContextual}
                  className={`${inputClass} disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500`}
                />
              </Field>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <UniversalPhotoUploader
                photos={ncrPhotos}
                onChange={setNcrPhotos}
                projectId={activeProjId}
                companyId={activeCompId}
                uploadedBy={authUser?.uid}
                uploadedByName={authUser?.fullName}
                sourceModule="NCR"
                sourceId="new-ncr"
                title="Defect Evidence & Inspection Photos"
                description="Capture or upload high-resolution evidence for this Non-Conformance Report"
              />
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-3 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                NCR Summary
              </h4>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Element</span>
                  <span className="font-medium">{form.elementName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Trade</span>
                  <span className="font-medium">
                    {tradeSelection.tradeName || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Priority</span>
                  <span
                    className={`font-medium ${
                      form.priority === "CRITICAL"
                        ? "text-red-400"
                        : form.priority === "HIGH"
                          ? "text-orange-400"
                          : "text-slate-300"
                    }`}
                  >
                    {form.priority}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Deadline</span>
                  <span className="font-medium">
                    {form.deadline || "Not set"}
                  </span>
                </div>
              </div>
              {form.deadline && (
                <div className="pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Calendar size={12} />
                    <span>Will sync to Construction Planner</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NCRCreate;
