import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import { toast } from "react-hot-toast";
import { RequestForInformation } from "@/types";
import { DraftBanner } from "@/components/common/DraftBanner";
import { saveFormDraft, getFormDraft, clearFormDraft } from "@/lib/idbVault";
import { useCompany } from "@/lib/companyHelper";
import { TradeSubtradeSelect } from "@/components/masterdata/TradeSubtradeSelect";
import MultiLevelElementSelect, {
  SelectedElementItem,
} from "@/components/masterdata/MultiLevelElementSelect";
import {
  UniversalPhotoUploader,
  PhotoItem,
} from "@/components/common/UniversalPhotoUploader";
import { FileQuestion, ArrowLeft, Save, DollarSign, Clock } from "lucide-react";

export const RFICreate: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { currentUser, company } = useAuthStore();
  const { activeProject } = useProjectStore();
  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";
  const canCreateRFI = hasPermission(currentUser?.role, "CREATE_RFI");

  const { generateDocNumber, getPrefix } = useCompany();
  const [rfiNumber, setRfiNumber] = useState(() => generateDocNumber("RFI"));

  useEffect(() => {
    if (!rawDraft?.rfiNumber) {
      setRfiNumber(generateDocNumber("RFI"));
    }
  }, [getPrefix]);

  const [title, setTitle] = useState("");
  const [drawingReference, setDrawingReference] = useState("");
  const [specReference, setSpecReference] = useState("");
  const [discipline, setDiscipline] = useState("Structural");
  const [tradeId, setTradeId] = useState("");
  const [tradeName, setTradeName] = useState("Civil & Structural Works");
  const [subtradeName, setSubtradeName] = useState("");
  const [levelId, setLevelId] = useState(activeProject?.currentLevelId || "");
  const [levelName, setLevelName] = useState(activeProject?.currentLevelName || "");
  const [elementId, setElementId] = useState("");
  const [elementName, setElementName] = useState("");
  const [gridLocation, setGridLocation] = useState("");
  const [selectedElements, setSelectedElements] = useState<
    SelectedElementItem[]
  >([]);

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
      setElementName(names);
      setElementId(items[0].id);
      if (items[0].levelId) setLevelId(items[0].levelId);
      if (levels) setLevelName(levels);
      if (grids) setGridLocation(grids);
    } else {
      setElementName("");
      setElementId("");
    }
  };
  const [priority, setPriority] = useState<
    "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  >("HIGH");
  const [question, setQuestion] = useState("");
  const [proposedSolution, setProposedSolution] = useState("");
  const [costImpact, setCostImpact] = useState(false);
  const [costImpactEstimate, setCostImpactEstimate] = useState<number>(0);
  const [scheduleImpact, setScheduleImpact] = useState(false);
  const [scheduleDelayDays, setScheduleDelayDays] = useState<number>(0);
  const [assignedConsultant, setAssignedConsultant] = useState(
    "Supervising Consultant Engineer",
  );
  const [attachments, setAttachments] = useState<PhotoItem[]>([]);

  // Draft State
  const [hasDraft, setHasDraft] = useState(false);
  const [draftTime, setDraftTime] = useState("");
  const [rawDraft, setRawDraft] = useState<any>(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);

  useEffect(() => {
    async function checkDraft() {
      if (!currentProjId) return;
      const d = await getFormDraft("RFI", currentProjId);
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
    if (rawDraft.title) setTitle(rawDraft.title);
    if (rawDraft.drawingReference)
      setDrawingReference(rawDraft.drawingReference);
    if (rawDraft.specReference) setSpecReference(rawDraft.specReference);
    if (rawDraft.discipline) setDiscipline(rawDraft.discipline);
    if (rawDraft.tradeId) setTradeId(rawDraft.tradeId);
    if (rawDraft.tradeName) setTradeName(rawDraft.tradeName);
    if (rawDraft.subtradeName) setSubtradeName(rawDraft.subtradeName);
    if (rawDraft.levelId) setLevelId(rawDraft.levelId);
    if (rawDraft.levelName) setLevelName(rawDraft.levelName);
    if (rawDraft.elementId) setElementId(rawDraft.elementId);
    if (rawDraft.elementName) setElementName(rawDraft.elementName);
    if (rawDraft.gridLocation) setGridLocation(rawDraft.gridLocation);
    if (rawDraft.priority) setPriority(rawDraft.priority);
    if (rawDraft.question) setQuestion(rawDraft.question);
    if (rawDraft.proposedSolution)
      setProposedSolution(rawDraft.proposedSolution);
    if (rawDraft.costImpact !== undefined) setCostImpact(rawDraft.costImpact);
    if (rawDraft.costImpactEstimate !== undefined)
      setCostImpactEstimate(rawDraft.costImpactEstimate);
    if (rawDraft.scheduleImpact !== undefined)
      setScheduleImpact(rawDraft.scheduleImpact);
    if (rawDraft.scheduleDelayDays !== undefined)
      setScheduleDelayDays(rawDraft.scheduleDelayDays);
    if (rawDraft.assignedConsultant)
      setAssignedConsultant(rawDraft.assignedConsultant);
    if (rawDraft.attachments) {
      setAttachments(
        rawDraft.attachments.map((a: any) =>
          typeof a === "string" ? { url: a, caption: "" } : a,
        ),
      );
    }
    setHasDraft(false);
  };

  const handleDiscardDraft = async () => {
    if (currentProjId) {
      await clearFormDraft("RFI", currentProjId);
    }
    setHasDraft(false);
    setRawDraft(null);
  };

  const handleSaveDraft = async () => {
    if (!canCreateRFI) {
      toast.error("You do not have permission to raise RFIs");
      return;
    }
    if (!currentProjId) return;
    setIsDraftSaving(true);
    const draftPayload = {
      title,
      drawingReference,
      specReference,
      discipline,
      tradeId,
      tradeName,
      subtradeName,
      levelId,
      levelName,
      elementId,
      elementName,
      gridLocation,
      priority,
      question,
      proposedSolution,
      costImpact,
      costImpactEstimate,
      scheduleImpact,
      scheduleDelayDays,
      assignedConsultant,
      attachments: attachments.map((a) => a.url),
    };

    await saveFormDraft("RFI", currentProjId, draftPayload);

    const draftRfi: RequestForInformation = {
      id: `rfi-draft-${Date.now()}`,
      projectId: currentProjId,
      companyId: currentCompId,
      rfiNumber,
      title: title || "Draft RFI Request",
      drawingReference,
      specReference,
      discipline,
      tradeId,
      tradeName,
      subtradeName,
      question,
      proposedSolution,
      costImpact,
      costImpactEstimate: costImpact ? costImpactEstimate : 0,
      scheduleImpact,
      scheduleDelayDays: scheduleImpact ? scheduleDelayDays : 0,
      priority,
      status: "DRAFT",
      raisedBy: {
        uid: currentUser?.uid || "usr-qaqc",
        name: currentUser?.fullName || "QA/QC Engineer",
        role: currentUser?.role || "QAQC_ENGINEER",
        date: new Date().toISOString().split("T")[0],
      },
      assignedConsultant,
      attachments: attachments.map((a) => a.url),
      createdAt: new Date().toISOString(),
    };

    await dbService.saveRFI(draftRfi);

    if (currentUser) {
      await writeAudit({
        projectId: currentProjId,
        companyId: currentCompId,
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "DRAFT_RFI",
        module: "RFI",
        details: `Saved draft RFI ${rfiNumber}: ${title || "Untitled Draft"}`,
        newValue: draftRfi,
      });
    }

    setIsDraftSaving(false);
    navigate("/project/rfi");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateRFI) {
      toast.error("You do not have permission to raise RFIs");
      return;
    }
    if (!currentProjId) return;

    const newRfi: RequestForInformation = {
      id: `rfi-${Date.now()}`,
      projectId: currentProjId,
      companyId: currentCompId,
      rfiNumber,
      title,
      drawingReference,
      specReference,
      discipline,
      tradeId,
      tradeName,
      trade: tradeName,
      subtradeName,
      levelId,
      levelName,
      locationLevel: levelName,
      elementId,
      elementName,
      elementIds: selectedElements.map((e) => e.id),
      elementNames: selectedElements.map((e) => e.elementName),
      elementsData: selectedElements,
      gridLine: gridLocation,
      question,
      proposedSolution,
      costImpact,
      costImpactEstimate: costImpact ? costImpactEstimate : 0,
      scheduleImpact,
      scheduleDelayDays: scheduleImpact ? scheduleDelayDays : 0,
      priority,
      status: "SUBMITTED",
      raisedBy: {
        uid: currentUser?.uid || "usr-qaqc",
        name: currentUser?.fullName || "QA/QC Engineer",
        role: currentUser?.role || "QAQC_ENGINEER",
        date: new Date().toISOString().split("T")[0],
      },
      assignedConsultant,
      attachments: attachments.map((a) => a.url),
      createdAt: new Date().toISOString(),
    };

    await dbService.saveRFI(newRfi);
    await clearFormDraft("RFI", currentProjId);

    if (currentUser) {
      await writeAudit({
        projectId: currentProjId,
        companyId: currentCompId,
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "SUBMIT_RFI",
        module: "RFI",
        details: `Submitted Technical RFI ${rfiNumber}: ${title}`,
        newValue: newRfi,
      });
    }

    navigate(`/project/rfi/${newRfi.id}`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/project/rfi")}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-0.5">
              <span>
                Technical Inquiry & Engineering Clarifications (ISO 9001:2015
                Clause 8.2.3)
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Draft Request for Information
            </h1>
          </div>
        </div>

        <span className="px-3 py-1 rounded-lg bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 font-mono text-xs font-bold border border-brand-200 dark:border-brand-500/30">
          Ref: {rfiNumber}
        </span>
      </div>

      <DraftBanner
        hasDraft={hasDraft}
        draftTime={draftTime}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        formName="RFI Request"
      />

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Subject / Technical Inquiry Topic *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Column C-GF-01 Mechanical Coupler Staggering Requirements"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Drawing Reference *
              </label>
              <input
                type="text"
                value={drawingReference}
                onChange={(e) => setDrawingReference(e.target.value)}
                placeholder="e.g. DWG-STR-GF-104 Rev C"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Specification Section
              </label>
              <input
                type="text"
                value={specReference}
                onChange={(e) => setSpecReference(e.target.value)}
                placeholder="e.g. Section 03200 Clause 3.2"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Engineering Discipline
              </label>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Structural">Civil & Structural</option>
                <option value="Architectural">Architectural</option>
                <option value="MEP">MEP & Services</option>
                <option value="Geotechnical">Geotechnical / Foundation</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-4">
            <MultiLevelElementSelect
              projectId={currentProjId}
              companyId={currentCompId}
              selectedElements={selectedElements}
              onChange={handleSelectedElementsChange}
              label="Structural Elements Under Technical Query"
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
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Assigned Consultant / Architect
              </label>
              <input
                type="text"
                value={assignedConsultant}
                onChange={(e) => setAssignedConsultant(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              >
                <option value="URGENT">URGENT (Critical Path)</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>
        </div>

        {/* Technical Question & Solution */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Technical Question / Ambiguity *
            </label>
            <textarea
              rows={4}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="State the engineering conflict, missing dimension, or specification ambiguity in detail..."
              required
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 leading-relaxed font-sans"
            />
          </div>

          <div>
            <label className="block text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
              Contractor Proposed Solution / Recommendation
            </label>
            <textarea
              rows={3}
              value={proposedSolution}
              onChange={(e) => setProposedSolution(e.target.value)}
              placeholder="Provide suggested technical resolution to accelerate consultant review..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-emerald-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
            />
          </div>
        </div>

        {/* Impact Analysis */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
            Cost & Schedule Impact Assessment
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <label className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={costImpact}
                  onChange={(e) => setCostImpact(e.target.checked)}
                  className="rounded text-brand-500"
                />
                <span>Potential Cost Impact</span>
              </label>
              {costImpact && (
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[10px] mb-1">
                    Estimated Cost Impact ($ USD)
                  </label>
                  <input
                    type="number"
                    value={costImpactEstimate}
                    onChange={(e) =>
                      setCostImpactEstimate(Number(e.target.value))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <label className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleImpact}
                  onChange={(e) => setScheduleImpact(e.target.checked)}
                  className="rounded text-brand-500"
                />
                <span>Potential Schedule Delay</span>
              </label>
              {scheduleImpact && (
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 text-[10px] mb-1">
                    Estimated Delay (Days)
                  </label>
                  <input
                    type="number"
                    value={scheduleDelayDays}
                    onChange={(e) =>
                      setScheduleDelayDays(Number(e.target.value))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Site Sketches, Drawings & Photo Evidence */}
        <UniversalPhotoUploader
          photos={attachments}
          onChange={(newPhotos) => setAttachments(newPhotos)}
          projectId={currentProjId}
          companyId={currentCompId}
          uploadedBy={currentUser?.fullName || "QA/QC Engineer"}
          uploaderRole={currentUser?.role}
          sourceModule="RFI"
          sourceId={rfiNumber}
          tradeName={tradeName}
          category="PROGRESS"
          folder={`jqms/rfi/${rfiNumber}/attachments`}
          title="RFI Sketches, Drawings & Site Evidence Photos"
          description="Attach clarifying markups, drawings, or site photos to assist the consultant with reviewing this technical query."
        />

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate("/project/rfi")}
            className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isDraftSaving || !canCreateRFI}
            title={
              !canCreateRFI
                ? "You do not have permission to raise RFIs"
                : undefined
            }
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-500/30 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{isDraftSaving ? "Saving Draft..." : "Save as Draft"}</span>
          </button>
          <button
            type="submit"
            disabled={!canCreateRFI}
            title={
              !canCreateRFI
                ? "You do not have permission to raise RFIs"
                : undefined
            }
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-xl shadow-brand-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>Submit Technical RFI to Consultant</span>
          </button>
        </div>
      </form>
    </div>
  );
};
