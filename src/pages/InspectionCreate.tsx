import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ShieldAlert,
  Clipboard,
  Building2,
  Briefcase,
  Loader2,
  FileText,
  MapPin,
  Calendar,
  Clock,
  Link2,
  Search,
  Filter,
  CheckCircle2,
  AlertOctagon,
  Layers,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react";
import type {
  Inspection,
  InspectionTemplate,
  RiskLevel,
  InspectionItem,
} from "@/types";
import { ROLE_TITLES } from "@/lib/permissions";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import TradeSubtradeSelect, {
  type TradeSelection,
} from "@/components/masterdata/TradeSubtradeSelect";
import MultiLevelElementSelect, {
  SelectedElementItem,
} from "@/components/masterdata/MultiLevelElementSelect";
import { toast } from "react-hot-toast";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import { generateInspectionNumber } from "@/lib/naming";
import { ELEMENTS } from "@/lib/defaultInspectionTemplates";
import { plannerSync } from "@/lib/plannerSync";

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

export const InspectionCreate: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const { currentUser, company } = useAuthStore();
  const { activeProject } = useProjectStore();
  const navigate = useNavigate();

  const activeProjId = activeProject?.id || projectId || "";
  const activeCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";
  const canCreateInspection = hasPermission(
    currentUser?.role,
    "CREATE_INSPECTION",
  );

  // URL PARAMS
  const scheduleId = searchParams.get("scheduleId") || "";
  const elementIdParam = searchParams.get("elementId") || "";
  const elementNameParam = searchParams.get("elementName") || "";
  const locationLevelParam = searchParams.get("locationLevel") || "";
  const gridLineParam = searchParams.get("gridLine") || "";

  // STATE
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<TradeSelection | null>(
    null,
  );
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [zone, setZone] = useState("");
  const [elementRef, setElementRef] = useState("");
  const [elementType, setElementType] = useState("");
  const [selectedElementId, setSelectedElementId] = useState("");
  const [contractor, setContractor] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("MEDIUM");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [inspectorDesignation, setInspectorDesignation] = useState<string>(
    () => {
      if (currentUser?.designation) return currentUser.designation;
      if (currentUser?.role && ROLE_TITLES[currentUser.role])
        return ROLE_TITLES[currentUser.role];
      return "QA/QC Inspector";
    },
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.designation) {
        setInspectorDesignation(currentUser.designation);
      } else if (currentUser.role && ROLE_TITLES[currentUser.role]) {
        setInspectorDesignation(ROLE_TITLES[currentUser.role]);
      }
    }
  }, [currentUser]);

  // Template Filtering States
  const [templateFilterElement, setTemplateFilterElement] =
    useState<string>("ALL");
  const [templateFilterDiscipline, setTemplateFilterDiscipline] =
    useState<string>("ALL");
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [showChecklistPreview, setShowChecklistPreview] = useState(true);

  const [selectedElements, setSelectedElements] = useState<
    SelectedElementItem[]
  >([]);

  useEffect(() => {
    if (elementIdParam || elementNameParam) {
      const initialItem: SelectedElementItem = {
        id: elementIdParam || `ctx-${Date.now()}`,
        elementName: elementNameParam || "Selected Element",
        levelName: locationLevelParam || "",
        grid: gridLineParam || "",
      };
      setSelectedElements([initialItem]);
    }
    if (elementIdParam) setSelectedElementId(elementIdParam);
    if (elementNameParam) setElementRef(elementNameParam);
    if (gridLineParam) setZone(gridLineParam);
    if (locationLevelParam) {
      if (locationLevelParam.includes("-")) {
        const parts = locationLevelParam.split("-").map((p) => p.trim());
        setBuilding(parts[0] || "");
        setFloor(parts[1] || "");
      } else {
        setFloor(locationLevelParam);
      }
    }
  }, [elementIdParam, elementNameParam, locationLevelParam, gridLineParam]);

  // Load Templates from Database (with auto-seed fallback)
  useEffect(() => {
    async function loadTemplates() {
      if (!activeCompId) return;
      setTemplatesLoading(true);
      try {
        let list = await dbService.getInspectionTemplates(activeCompId);
        if (!list || list.length === 0) {
          list = await dbService.seedCompanyInspectionTemplates(activeCompId);
        }
        setTemplates(list || []);
        if (list && list.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load inspection templates:", err);
      } finally {
        setTemplatesLoading(false);
      }
    }
    loadTemplates();
  }, [activeCompId]);

  // Auto-align template filter when elements are selected from structural register
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
        new Set(
          items
            .map((i) => i.elementType)
            .filter((t): t is string => Boolean(t)),
        ),
      );

      if (levels) setFloor(levels);
      setElementRef(names);
      setSelectedElementId(items[0].id);
      if (grids) setZone(grids);
      if (types.length > 0 && types[0]) {
        const primaryType = types[0];
        setElementType(primaryType);
        const matched = ELEMENTS.find(
          (el) =>
            primaryType.toLowerCase().includes(el.toLowerCase()) ||
            el.toLowerCase().includes(primaryType.toLowerCase()),
        );
        if (matched) {
          setTemplateFilterElement(matched);
        }
      }
    } else {
      setElementRef("");
      setSelectedElementId("");
    }
  };

  // Filtered Templates calculation
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchElem =
        templateFilterElement === "ALL" ||
        t.element
          ?.toLowerCase()
          .includes(templateFilterElement.toLowerCase()) ||
        templateFilterElement
          .toLowerCase()
          .includes(t.element?.toLowerCase() || "");

      const matchDisc =
        templateFilterDiscipline === "ALL" ||
        (t.discipline || "").toLowerCase() ===
          templateFilterDiscipline.toLowerCase();

      const q = templateSearchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (t.name || "").toLowerCase().includes(q) ||
        (t.element || "").toLowerCase().includes(q) ||
        (t.stage || "").toLowerCase().includes(q) ||
        (t.discipline || "").toLowerCase().includes(q) ||
        (t.items || []).some((it) => it.label.toLowerCase().includes(q));

      return matchElem && matchDisc && matchSearch;
    });
  }, [
    templates,
    templateFilterElement,
    templateFilterDiscipline,
    templateSearchQuery,
  ]);

  useEffect(() => {
    if (filteredTemplates.length > 0) {
      const exists = filteredTemplates.some((t) => t.id === selectedTemplateId);
      if (!exists && selectedTemplateId) {
        // keep selected if valid
      } else if (!selectedTemplateId) {
        setSelectedTemplateId(filteredTemplates[0].id);
      }
    }
  }, [filteredTemplates, selectedTemplateId]);

  const selectedTemplate = useMemo(() => {
    return (
      templates.find((t) => t.id === selectedTemplateId) ||
      filteredTemplates[0] ||
      null
    );
  }, [templates, filteredTemplates, selectedTemplateId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateInspection) {
      toast.error("You do not have permission to create inspections");
      return;
    }
    if (!activeProjId || !currentUser) return;
    if (!selectedTrade?.tradeName) {
      toast.error("Please pick a Trade discipline");
      return;
    }

    const template = selectedTemplate;
    if (!template) {
      toast.error("Please select a valid inspection checklist template");
      return;
    }

    try {
      setIsSubmitting(true);
      const nextNumber = generateInspectionNumber(activeProject?.code);

      const initialItems: InspectionItem[] = (template?.items || []).map(
        (item, idx) => ({
          id: item.id || `item-${idx + 1}-${Date.now()}`,
          label: item.label,
          critical: item.critical ?? false,
          isHoldPoint: item.isHoldPoint ?? false,
          weight: item.weight || (item.critical ? 5 : 2),
          importanceWeight: item.importanceWeight || (item.critical ? 5 : 2),
          category: item.category || template.element || "General",
          acceptanceCriteria:
            item.acceptanceCriteria ||
            "Per approved project specifications and IFC drawings",
          discipline: item.discipline || template.discipline || "Structural",
          result: "PENDING" as any,
          remarks: "",
          photos: [],
        }),
      );

      const newInspection: Inspection = {
        id: `insp-${Date.now()}`,
        companyId: activeCompId,
        projectId: activeProjId,
        inspectionNumber: nextNumber,
        status: "DRAFT",
        riskLevel,
        element:
          elementRef ||
          template.element ||
          selectedTrade.tradeName ||
          "Structural Member",
        stage: template?.stage || "Pre-Pour",
        trade: selectedTrade.tradeName,
        subtrade: selectedTrade.subtradeName,
        tradeId: selectedTrade.tradeId,
        subtradeId: selectedTrade.subtradeId,
        building: building || "",
        floor: floor || "",
        levelName: floor || "",
        zone: zone || "",
        elementRef: elementRef || "",
        elementName: elementRef || "",
        contractor: contractor || "",
        templateId: template?.id,
        items: initialItems,
        qualityScore: 100,
        inspector: {
          uid: currentUser.uid,
          name: currentUser.fullName || "QA/QC Inspector",
          role:
            inspectorDesignation.trim() ||
            (currentUser.role
              ? ROLE_TITLES[currentUser.role]
              : "QAQC_INSPECTOR"),
          designation: inspectorDesignation.trim(),
        },
        inspectorName: currentUser.fullName || "QA/QC Inspector",
        templateName:
          template?.name ||
          `${template?.element} - ${template?.stage}` ||
          "Standard Inspection",
        scheduledDate: new Date().toISOString().split("T")[0],
        passScore: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        elementId: selectedElementId,
        elementIds: selectedElements.map((e) => e.id),
        elementNames: selectedElements.map((e) => e.elementName),
        elementsData: selectedElements,
      } as any;

      await dbService.saveInspection(newInspection);

      await plannerSync.syncEvent({
        relatedId: newInspection.id,
        relatedModule: "inspections",
        title: `Inspection: ${newInspection.inspectionNumber} - ${newInspection.floor || newInspection.element}`,
        description: `Field inspection for ${newInspection.trade} / ${newInspection.subtrade || "General"} (${template.stage})`,
        startDate: new Date().toISOString().split("T")[0],
        startTime: "08:00",
        eventType: "INSPECTION",
        status: newInspection.status,
        location:
          `${newInspection.building} ${newInspection.floor} ${newInspection.zone}`.trim(),
        projectId: activeProjId,
        companyId: activeCompId,
        createdBy: currentUser.uid,
      });

      await writeAudit({
        userId: currentUser.uid,
        userName: currentUser.fullName || "QAQC Inspector",
        action: "CREATE_INSPECTION",
        module: "QC",
        details: `Created Inspection ${nextNumber} using ${template.element} - ${template.stage} template for ${selectedTrade.tradeName} at ${floor}`,
        companyId: activeCompId,
        projectId: activeProjId,
        targetId: newInspection.id,
      });

      toast.success(
        `Inspection sequence ${nextNumber} initialized with ${initialItems.length} checklist points`,
      );
      navigate(`/project/inspections/${newInspection.id}`);
    } catch (err) {
      console.error("Failed creating inspection:", err);
      toast.error("Failed to generate inspection entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const criticalCount =
    selectedTemplate?.items?.filter((it) => it.critical).length || 0;
  const holdPointCount =
    selectedTemplate?.items?.filter((it) => it.isHoldPoint).length || 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col antialiased text-slate-900 dark:text-slate-100 transition-colors">
      <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-4 shadow-sm backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-95"
              title="Return"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                <span>Quality Assurance</span>
                <span>/</span>
                <span className="text-[#ea580c]">Inspections (Clause 8.6)</span>
                {scheduleId && (
                  <>
                    <span>/</span>
                    <span className="text-blue-600 flex items-center gap-1">
                      <Link2 size={12} />
                      From Schedule
                    </span>
                  </>
                )}
              </nav>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Initialize Field Inspection
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="inspection-form"
              disabled={
                isSubmitting || templatesLoading || !canCreateInspection
              }
              title={
                !canCreateInspection
                  ? "You do not have permission to create inspections"
                  : undefined
              }
              className="bg-[#ea580c] hover:bg-[#c2410c] disabled:bg-orange-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm flex items-center gap-2 tracking-wide cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generating Records...
                </>
              ) : (
                "Initialize Inspection"
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8">
        <form
          id="inspection-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
        >
          <div className="lg:col-span-2 space-y-6">
            {/* Protocol Parameters */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Clipboard size={14} className="text-[#ea580c]" />
                Trade Discipline & Protocol Parameters
              </h3>

              <div>
                <TradeSubtradeSelect
                  companyId={activeCompId}
                  selectedTradeId={selectedTrade?.tradeId}
                  selectedTradeName={selectedTrade?.tradeName}
                  selectedSubtrade={selectedTrade?.subtradeName}
                  onTradeChange={(tId, tName) => {
                    setSelectedTrade({
                      tradeId: tId,
                      tradeName: tName,
                      subtradeId: "",
                      subtradeName: "",
                    });
                  }}
                  onSubtradeChange={(stName) => {
                    setSelectedTrade((prev) => ({
                      tradeId: prev?.tradeId || "",
                      tradeName: prev?.tradeName || "",
                      subtradeId: stName,
                      subtradeName: stName,
                    }));
                  }}
                  required
                />
              </div>
            </div>

            {/* Master ISO 9001 Checklist Template Selection */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileText size={14} className="text-[#ea580c]" />
                  ISO 9001 Checklist Template Alignment
                </h3>
                <span className="text-[11px] font-bold text-slate-500">
                  {filteredTemplates.length} Available Templates
                </span>
              </div>

              {/* Template Filtering Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Filter by Element
                  </label>
                  <select
                    value={templateFilterElement}
                    onChange={(e) => setTemplateFilterElement(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#ea580c]"
                  >
                    <option value="ALL">
                      All Elements ({ELEMENTS.length})
                    </option>
                    {ELEMENTS.map((el) => (
                      <option key={el} value={el}>
                        {el}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Filter Discipline
                  </label>
                  <select
                    value={templateFilterDiscipline}
                    onChange={(e) =>
                      setTemplateFilterDiscipline(e.target.value)
                    }
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#ea580c]"
                  >
                    <option value="ALL">All Disciplines</option>
                    <option value="Structural">Structural</option>
                    <option value="Civil">Civil</option>
                    <option value="MEP">MEP</option>
                    <option value="Finishes">Finishes</option>
                    <option value="Geotechnical">Geotechnical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Search Checkpoint / Stage
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search stage/item..."
                      value={templateSearchQuery}
                      onChange={(e) => setTemplateSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-[#ea580c]"
                    />
                    <Search
                      size={12}
                      className="absolute left-2.5 top-3 text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Template Main Dropdown Selector */}
              <Field
                label="Selected Inspection Checklist Template"
                icon={<FileText size={12} className="text-slate-400" />}
                required
              >
                {templatesLoading ? (
                  <div className="flex items-center gap-2 p-3 text-xs text-slate-400">
                    <Loader2
                      size={14}
                      className="animate-spin text-orange-500"
                    />
                    Loading master inspection catalog...
                  </div>
                ) : (
                  <select
                    required
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">
                      -- Choose Technical Checklist Alignment --
                    </option>
                    {filteredTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.element} — {t.stage} ({t.items?.length || 0}{" "}
                        checkpoints | {t.discipline || "Structural"})
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              {/* Selected Template Live Preview Box */}
              {selectedTemplate && (
                <div className="rounded-xl border border-orange-200 dark:border-orange-950/60 bg-orange-50/40 dark:bg-orange-950/10 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-orange-500 text-white">
                          {selectedTemplate.discipline || "Structural"}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {selectedTemplate.element} — {selectedTemplate.stage}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {selectedTemplate.name ||
                          "Master ISO 9001:2015 Clause 8.6 Inspection Template"}{" "}
                        • Version: {selectedTemplate.version || "v2.0"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
                        {selectedTemplate.items?.length || 0} Checkpoints
                      </span>
                      {criticalCount > 0 && (
                        <span className="px-2 py-1 rounded-md bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold border border-red-200 dark:border-red-900 flex items-center gap-1">
                          <AlertOctagon size={11} /> {criticalCount} Critical
                        </span>
                      )}
                      {holdPointCount > 0 && (
                        <span className="px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-900">
                          {holdPointCount} Hold Points
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expandable Checklist Items Preview */}
                  <div className="pt-2 border-t border-orange-200/60 dark:border-orange-900/40">
                    <button
                      type="button"
                      onClick={() =>
                        setShowChecklistPreview(!showChecklistPreview)
                      }
                      className="text-xs font-bold text-[#ea580c] flex items-center gap-1.5 hover:underline"
                    >
                      {showChecklistPreview ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                      {showChecklistPreview
                        ? "Hide Checklist Verification Items"
                        : "Preview Checklist Verification Items"}
                    </button>

                    {showChecklistPreview && (
                      <div className="mt-3 max-h-60 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                        {(selectedTemplate.items || []).map((it, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 text-xs shadow-2xs"
                          >
                            <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold flex items-center justify-center shrink-0 text-[10px]">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                                {it.label}
                              </p>
                              {it.acceptanceCriteria && (
                                <p className="text-[10px] text-slate-400 mt-0.5 italic">
                                  Criteria: {it.acceptanceCriteria}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {it.critical && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 uppercase">
                                  Critical
                                </span>
                              )}
                              {it.isHoldPoint && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 uppercase">
                                  Hold
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Structural Location Placement Context */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Building2 size={14} className="text-slate-500" />
                Structural Location Placement Context
              </h3>

              <MultiLevelElementSelect
                projectId={activeProjId}
                companyId={activeCompId}
                selectedElements={selectedElements}
                onChange={handleSelectedElementsChange}
                required
                label="Structural Elements Under Inspection"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Building / Structure"
                  icon={<Building2 size={12} className="text-slate-400" />}
                >
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    placeholder="e.g., Main Tower, Podium"
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Zone / Area (Gridline)"
                  icon={<MapPin size={12} className="text-slate-400" />}
                >
                  <input
                    type="text"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    placeholder="Auto-fills on element selection"
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Briefcase size={14} className="text-slate-500" />
                Operational Risk Profile
              </h3>

              <Field
                label="Executing Contractor"
                icon={<Briefcase size={12} className="text-slate-400" />}
              >
                <input
                  type="text"
                  value={contractor}
                  onChange={(e) => setContractor(e.target.value)}
                  placeholder="Subcontractor Name"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Your Signatory Designation / Title"
                icon={<User size={12} className="text-slate-400" />}
                required
              >
                <input
                  type="text"
                  required
                  value={inspectorDesignation}
                  onChange={(e) => setInspectorDesignation(e.target.value)}
                  placeholder="e.g. QA/QC Inspector, Structural Quality Lead"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Risk Classification"
                icon={<ShieldAlert size={12} className="text-slate-400" />}
              >
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                  className={inputClass}
                >
                  <option value="LOW">
                    Low Risk (Standard Finishing / Non-Structural)
                  </option>
                  <option value="MEDIUM">
                    Medium Risk (Secondary Structural / MEP)
                  </option>
                  <option value="HIGH">
                    High Risk (Primary Structural Pre-Pour)
                  </option>
                  <option value="CRITICAL">
                    Critical Path Risk (Core / Transfer / PT)
                  </option>
                </select>
              </Field>
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-400">
                <Info size={14} />
                <span>ISO 9001:2015 Clause 8.6 Guidance</span>
              </div>
              <p className="text-xs text-blue-600/90 dark:text-blue-300 leading-relaxed">
                Release of products and services shall not proceed until the
                planned verification arrangements have been satisfactorily
                completed. All critical checkpoints must achieve 100% compliance
                prior to final sign-off.
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default InspectionCreate;
