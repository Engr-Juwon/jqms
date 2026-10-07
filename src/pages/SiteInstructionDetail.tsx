import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService } from "@/lib/db";
import { generateSiteInstructionPDF } from "@/lib/pdfGenerators";
import { SiteInstruction } from "@/types";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import { ROLE_LEVELS } from "@/lib/permissions";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  FileDown,
  AlertOctagon,
  CheckCircle2,
  Calendar,
  Clock,
  UserCheck,
  Building2,
  MapPin,
  Layers,
  ShieldAlert,
  Flame,
  FileWarning,
  Trash2,
  Printer,
  ChevronRight,
  Pencil,
  Save,
  X,
  Plus,
} from "lucide-react";

export const SiteInstructionDetail: React.FC = () => {
  const { id, projectId } = useParams<{ id: string; projectId: string }>();
  const navigate = useNavigate();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();

  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";

  const [si, setSi] = useState<SiteInstruction | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editIssueSummary, setEditIssueSummary] = useState("");
  const [editInstructionText, setEditInstructionText] = useState("");
  const [editMandatoryActions, setEditMandatoryActions] = useState<string[]>(
    [],
  );
  const [newActionInput, setNewActionInput] = useState("");
  const [editComplianceDeadline, setEditComplianceDeadline] = useState("");
  const [editContractualClause, setEditContractualClause] = useState("");
  const [editStopWorkOrdered, setEditStopWorkOrdered] = useState(false);
  const [editSignerDesignation, setEditSignerDesignation] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const canAcknowledge = hasPermission(
    currentUser?.role,
    "ACKNOWLEDGE_SITE_INSTRUCTION",
  );
  const canCancel = hasPermission(currentUser?.role, "CANCEL_SITE_INSTRUCTION");
  const canDelete = hasPermission(currentUser?.role, "DELETE_SITE_INSTRUCTION");

  const currentUserLevel = currentUser?.role
    ? ROLE_LEVELS[currentUser.role] || 1
    : 1;
  const isAuthor = Boolean(
    currentUser?.uid &&
    (currentUser.uid === si?.signedBy?.uid ||
      currentUser.uid === si?.createdBy),
  );
  // Author, Level 4+ QA/QC authorities, or Super Admin can edit the Site Instruction after issuance
  const canEditInstruction =
    isAuthor || currentUserLevel >= 4 || currentUser?.role === "SUPER_ADMIN";

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await dbService.getSiteInstruction(id);
      setSi(data);
    } catch (e) {
      console.error("Error loading SI:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDownloadPDF = () => {
    if (!si) return;
    try {
      generateSiteInstructionPDF(
        si,
        activeProject || undefined,
        company || undefined,
      );
    } catch (err) {
      console.error("PDF Export error:", err);
      toast.error("Failed to generate PDF document");
    }
  };

  const handleUpdateStatus = async (
    newStatus: "ACKNOWLEDGED" | "COMPLIED" | "CANCELLED",
  ) => {
    if (!si) return;
    if (newStatus === "CANCELLED" && !canCancel) {
      toast.error("You do not have permission to cancel Site Instructions");
      return;
    }
    if (
      (newStatus === "ACKNOWLEDGED" || newStatus === "COMPLIED") &&
      !canAcknowledge
    ) {
      toast.error(
        "You do not have permission to update compliance status on this Site Instruction",
      );
      return;
    }
    const updated: SiteInstruction = {
      ...si,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveSiteInstruction(updated);
    setSi(updated);

    if (currentUser) {
      await writeAudit({
        projectId: currentProjId,
        companyId: currentCompId,
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "UPDATE_SITE_INSTRUCTION_STATUS",
        module: "SITE_INSTRUCTION",
        details: `Updated status of Site Instruction ${si.instructionNumber} to ${newStatus}`,
      });
    }

    toast.success(`Site Instruction marked as ${newStatus}`);
  };

  const startEditing = () => {
    if (!si) return;
    setEditSubject(si.subject || si.title || "");
    setEditIssueSummary(si.issueSummary || "");
    setEditInstructionText(si.instructionText || "");
    setEditMandatoryActions(
      si.mandatoryActions ? [...si.mandatoryActions] : [],
    );
    setEditComplianceDeadline(
      si.complianceDeadline ? si.complianceDeadline.split("T")[0] : "",
    );
    setEditContractualClause(si.contractualClause || "");
    setEditStopWorkOrdered(
      Boolean(si.stopWorkOrdered || si.severity === "STOP_WORK"),
    );
    setEditSignerDesignation(
      si.signedBy?.designation || si.signedBy?.role || "",
    );
    setIsEditing(true);
  };

  const handleAddActionItem = () => {
    if (!newActionInput.trim()) return;
    setEditMandatoryActions((prev) => [...prev, newActionInput.trim()]);
    setNewActionInput("");
  };

  const handleRemoveActionItem = (index: number) => {
    setEditMandatoryActions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async () => {
    if (!si) return;
    if (!canEditInstruction) {
      toast.error(
        "Permission Denied: You do not have authority to edit this Site Instruction.",
      );
      return;
    }
    setEditSaving(true);
    try {
      const updated: SiteInstruction = {
        ...si,
        subject: editSubject.trim() || si.subject,
        title: editSubject.trim() || si.title,
        issueSummary: editIssueSummary,
        instructionText: editInstructionText,
        mandatoryActions: editMandatoryActions,
        complianceDeadline: editComplianceDeadline,
        contractualClause: editContractualClause,
        stopWorkOrdered: editStopWorkOrdered,
        severity: editStopWorkOrdered
          ? "STOP_WORK"
          : si.severity === "STOP_WORK"
            ? "HIGH"
            : si.severity,
        signedBy: {
          ...si.signedBy,
          role: editSignerDesignation.trim() || si.signedBy.role,
          designation:
            editSignerDesignation.trim() ||
            si.signedBy.designation ||
            si.signedBy.role,
        },
        updatedAt: new Date().toISOString(),
      };

      await dbService.saveSiteInstruction(updated);
      setSi(updated);

      if (currentUser) {
        await writeAudit({
          projectId: currentProjId,
          companyId: currentCompId,
          userId: currentUser.uid,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          action: "UPDATE_SITE_INSTRUCTION",
          module: "SITE_INSTRUCTION",
          details: `Edited directives and signatory designation for Site Instruction ${si.instructionNumber}`,
          newValue: updated,
        });
      }

      toast.success("Site Instruction updated successfully");
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update site instruction:", err);
      toast.error("Failed to save changes");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!si) return;
    if (!canDelete) {
      toast.error("You do not have permission to delete Site Instructions");
      return;
    }
    const confirmDelete = window.confirm(
      `Are you sure you want to delete Site Instruction ${si.instructionNumber}?`,
    );
    if (!confirmDelete) return;

    await dbService.deleteSiteInstruction(si.id, currentProjId);
    toast.success(`Site Instruction deleted`);
    navigate(
      currentProjId
        ? `/project/${currentProjId}/site-instructions`
        : `/project/site-instructions`,
    );
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        Loading Site Instruction particulars...
      </div>
    );
  }

  if (!si) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Site Instruction Not Found
        </h2>
        <p className="text-xs text-slate-500">
          The requested instruction reference may have been removed or
          relocated.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  const issueDateStr = si.signedBy?.signedAt
    ? new Date(si.signedBy.signedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const complianceDateStr = si.complianceDeadline
    ? new Date(si.complianceDeadline).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const isStopWork = si.severity === "STOP_WORK" || si.stopWorkOrdered;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
                {si.instructionNumber}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  si.status === "COMPLIED"
                    ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300"
                    : si.status === "ACKNOWLEDGED"
                      ? "bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-300"
                      : "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-300"
                }`}
              >
                {si.status || "ISSUED"}
              </span>
              {isStopWork && (
                <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black animate-pulse">
                  STOP WORK ORDER
                </span>
              )}
            </div>
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="Directive Title / Subject"
                  className="w-full px-3 py-1.5 rounded-xl text-lg font-bold bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <label className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editStopWorkOrdered}
                    onChange={(e) => setEditStopWorkOrdered(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600"
                  />
                  <span>Issue Immediate Mandatory Work Stoppage Order</span>
                </label>
              </div>
            ) : (
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                {si.subject || si.title}
              </h1>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {canEditInstruction &&
            (isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={editSaving}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={editSaving}
                  className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{editSaving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={startEditing}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 transition flex items-center gap-1.5"
              >
                <Pencil className="w-4 h-4" />
                <span>Edit Instruction</span>
              </button>
            ))}

          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold shadow transition flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Official PDF</span>
          </button>

          {si.status !== "COMPLIED" && (
            <button
              onClick={() => handleUpdateStatus("COMPLIED")}
              disabled={!canAcknowledge}
              title={
                !canAcknowledge
                  ? "You do not have permission to mark compliance"
                  : undefined
              }
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Complied</span>
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={!canDelete}
            className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              !canDelete
                ? "Level 4 authority required to delete Site Instructions"
                : "Delete Site Instruction"
            }
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stop Work Danger Callout */}
      {isStopWork && (
        <div className="p-4 rounded-2xl bg-red-600 text-white shadow-xl flex items-center gap-3.5">
          <Flame className="w-6 h-6 shrink-0 animate-bounce" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-wide">
              Mandatory Work Stoppage Order In Effect
            </h3>
            <p className="text-xs text-red-100 mt-0.5">
              All further construction activities on the affected zone and
              elements MUST immediately halt until full physical rectification
              and re-inspection sign-off.
            </p>
          </div>
        </div>
      )}

      {/* Linked Overdue NCR Banner */}
      {(si.ncrNumber || si.ncrId) && (
        <div className="p-5 rounded-3xl bg-red-950/20 border border-red-800/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-mono text-[10px] font-bold uppercase tracking-wider border border-red-500/30">
                Overdue NCR Reference
              </span>
              <span className="font-mono font-black text-sm text-red-400">
                {si.ncrNumber}
              </span>
              {si.ncrDaysOverdue && (
                <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold">
                  {si.ncrDaysOverdue} Days Overdue
                </span>
              )}
            </div>

            <Link
              to={
                currentProjId
                  ? `/project/${currentProjId}/ncrs/${si.ncrId}`
                  : `/project/ncrs/${si.ncrId}`
              }
              className="inline-flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300 hover:underline"
            >
              <span>View NCR Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            {si.ncrTitle || "Refer to detailed defect summary below."}
          </p>
        </div>
      )}

      {/* Main Particulars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Directive Body */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h2 className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
              Quality Directive Body
            </h2>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Background Defect Context:
                  </label>
                  <textarea
                    value={editIssueSummary}
                    onChange={(e) => setEditIssueSummary(e.target.value)}
                    rows={3}
                    placeholder="Background defect and non-conformance context..."
                    className="w-full text-xs text-slate-900 dark:text-white font-mono leading-relaxed bg-white dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Specific Statutory Directive:
                  </label>
                  <textarea
                    value={editInstructionText}
                    onChange={(e) => setEditInstructionText(e.target.value)}
                    rows={4}
                    placeholder="Mandatory contractual directive to contractor..."
                    className="w-full text-xs text-slate-900 dark:text-white leading-relaxed bg-white dark:bg-slate-950 p-3.5 rounded-2xl border-l-4 border-orange-500 border-t border-r border-b border-orange-300 dark:border-orange-700 font-medium outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Background Defect Context:
                  </span>
                  <div className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-mono leading-relaxed bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                    {si.issueSummary || "No issue summary recorded."}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Specific Statutory Directive:
                  </span>
                  <div className="text-xs text-slate-900 dark:text-white mt-1 leading-relaxed bg-orange-50/50 dark:bg-orange-950/20 p-3.5 rounded-2xl border-l-4 border-orange-500 border-t border-r border-b border-orange-200 dark:border-orange-900/40 whitespace-pre-wrap font-medium">
                    {si.instructionText ||
                      "Comply with mandatory actions detailed below."}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mandatory Action Items */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h2 className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
              Mandatory Action Items & Requirements
            </h2>

            {isEditing ? (
              <div className="space-y-2.5">
                {editMandatoryActions.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5 flex-1">
                      <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                        {idx + 1}.0
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                        {action}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveActionItem(idx)}
                      className="text-red-500 hover:text-red-700 p-1 transition"
                      title="Remove action item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newActionInput}
                    onChange={(e) => setNewActionInput(e.target.value)}
                    placeholder="Add another mandatory action item..."
                    className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-orange-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddActionItem();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddActionItem}
                    className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {si.mandatoryActions && si.mandatoryActions.length > 0 ? (
                  si.mandatoryActions.map((action, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs"
                    >
                      <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                        {idx + 1}.0
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                        {action}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">
                    Execute complete rectification of outstanding defects.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info & Signature */}
        <div className="space-y-6">
          {/* Administrative Metadata */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-xs">
            <h2 className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider">
              Administration & Context
            </h2>

            <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800/60">
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  Main Contractor
                </span>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {si.contractorName ||
                    activeProject?.contractorName ||
                    "Main Contractor"}
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  Trade / Discipline
                </span>
                <div className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5 font-mono">
                  {si.tradeName || "Civil / Structural Engineering"}
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  Location & Element
                </span>
                <div className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                  {si.location || si.levelName || "Site"} •{" "}
                  {si.elementName || "Structural Zone"}
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  Compliance Deadline
                </span>
                {isEditing ? (
                  <input
                    type="date"
                    value={editComplianceDeadline}
                    onChange={(e) => setEditComplianceDeadline(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-red-600 dark:text-red-400 outline-none focus:border-orange-500"
                  />
                ) : (
                  <div className="font-mono font-bold text-red-600 dark:text-red-400 mt-0.5">
                    {complianceDateStr}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  Governing Quality Clause
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editContractualClause}
                    onChange={(e) => setEditContractualClause(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-orange-500"
                  />
                ) : (
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {si.contractualClause || "ISO 9001:2015 Clause 8.7 & 10.2"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Single Authorized Issuer Signature Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h2 className="text-xs font-mono uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-orange-500" />
              <span>Authorized Quality Authority Sign-Off</span>
            </h2>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  Certified By:
                </span>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {si.signedBy?.name || "Authorized Quality Lead"}
                </div>
                {isEditing ? (
                  <div className="mt-2 space-y-1">
                    <label className="block text-[10px] font-mono uppercase font-bold text-slate-600 dark:text-slate-400">
                      Signatory Designation / Title *
                    </label>
                    <input
                      type="text"
                      value={editSignerDesignation}
                      onChange={(e) => setEditSignerDesignation(e.target.value)}
                      placeholder="e.g. QA/QC Engineer, Resident Engineer"
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-950 border border-orange-300 dark:border-orange-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <span className="text-[10px] text-slate-400 block">
                      Update how your professional title appears on this
                      document.
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] font-bold text-orange-600 dark:text-orange-400 mt-0.5">
                    {si.signedBy?.designation ||
                      si.signedBy?.role ||
                      "Resident QA/QC Authority"}
                  </div>
                )}
                <div className="text-[10px] text-slate-400 mt-1">
                  {si.signedBy?.company ||
                    company?.name ||
                    "Supervising Authority"}
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  Date & Timestamp:
                </span>
                <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">
                  {si.signedBy?.signedAt || si.createdAt || "—"}
                </div>
              </div>

              {/* Digital Signature Image / Stamp */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">
                  Digital Signature & Verification
                </span>
                {si.signedBy?.signatureUrl ? (
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <img
                      src={si.signedBy.signatureUrl}
                      alt="Signature"
                      className="max-h-14 max-w-full mx-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-orange-600">
                    {si.signedBy?.name || "ELECTRONICALLY CERTIFIED"}
                  </div>
                )}
                <span className="font-mono text-[9px] text-slate-400 mt-1 block">
                  Stamp:{" "}
                  {si.signedBy?.digitalSignatureStamp || "JQMS-SIG-VERIFIED"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteInstructionDetail;
