import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { hasPermission } from "@/lib/rbac";
import { toast } from "react-hot-toast";
import { generateMIRPDF, StakeholderSignoff } from "@/lib/pdfGenerators";
import { ROLE_TITLES } from "@/lib/permissions";
import {
  MaterialInspectionReport,
  MIRInspectionDisposition,
  MIRStatus,
} from "@/types";
import {
  UniversalPhotoUploader,
  PhotoItem,
} from "@/components/common/UniversalPhotoUploader";
import { StructuredInspectionView } from "@/lib/inspectionTextFormatter";
import {
  ClipboardCheck,
  ArrowLeft,
  FileDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Send,
  AlertCircle,
  Truck,
  Building,
  Package,
  FileCheck2,
  Trash2,
  Edit3,
  ShieldCheck,
  Plus,
  X,
  UserCheck,
} from "lucide-react";

export const MIRDetail: React.FC = () => {
  const { projectId, id, mirId } = useParams<{
    projectId: string;
    id: string;
    mirId: string;
  }>();
  const targetId = id || mirId || "";
  const navigate = useNavigate();
  const { currentUser, company } = useAuthStore();
  const { activeProject } = useProjectStore();
  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";

  const canReviewMIR = hasPermission(currentUser?.role, "REVIEW_MIR");
  const canApproveRejectMIR =
    hasPermission(currentUser?.role, "APPROVE_REJECT_MIR") ||
    hasPermission(currentUser?.role, "CREATE_MIR") ||
    hasPermission(currentUser?.role, "REVIEW_MIR");
  const canDeleteMIR = hasPermission(currentUser?.role, "DELETE_MIR");
  const canCreateMIR = hasPermission(currentUser?.role, "CREATE_MIR");

  const DEFAULT_MIR_STAKEHOLDERS: StakeholderSignoff[] = [
    {
      role: "QA/QC Engineer",
      name: "",
      designation: "QA/QC Engineer",
      required: true,
      signed: false,
    },
    {
      role: "Contractor Quality Representative",
      name: "",
      designation: "Site QA/QC Inspector",
      required: true,
      signed: false,
    },
    {
      role: "Supervising Consultant / RE",
      name: "",
      designation: "Resident Engineer",
      required: false,
      signed: false,
    },
    {
      role: "Storekeeper / Warehouseman",
      name: "",
      designation: "Materials Storekeeper",
      required: false,
      signed: false,
    },
  ];

  const [mir, setMir] = useState<MaterialInspectionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [verdict, setVerdict] = useState<MIRInspectionDisposition>("ACCEPTED");
  const [consultantComments, setConsultantComments] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [stakeholders, setStakeholders] = useState<StakeholderSignoff[]>(
    DEFAULT_MIR_STAKEHOLDERS,
  );
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [customRoleInput, setCustomRoleInput] = useState("");

  const loadData = async () => {
    if (!currentProjId || !targetId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await dbService.getMIR(targetId, currentProjId, currentCompId);
    setMir(data);
    if (data) {
      if (data.disposition) setVerdict(data.disposition);

      if (data.qaqcSignOff?.comments) {
        setConsultantComments(data.qaqcSignOff.comments);
      } else if (data.consultantSignOff?.comments) {
        setConsultantComments(data.consultantSignOff.comments);
      }

      const rawPhotos = data.photos || [];
      setPhotos(
        rawPhotos.map((p: any) =>
          typeof p === "string" ? { url: p, caption: "" } : p,
        ),
      );

      if (data.stakeholders && data.stakeholders.length > 0) {
        setStakeholders(data.stakeholders);
      } else {
        const initial = DEFAULT_MIR_STAKEHOLDERS.map((s) => {
          if (s.role === "QA/QC Engineer") {
            const sign = data.qaqcSignOff || data.consultantSignOff;
            return {
              ...s,
              name: sign?.name || "",
              designation: (sign as any)?.designation || "QA/QC Engineer",
              signed: Boolean(sign?.signed),
              signedAt: sign?.date,
            };
          }
          if (s.role === "Contractor Quality Representative") {
            return {
              ...s,
              name:
                data.contractorSignOff?.name || data.inspectedBy?.name || "",
              designation: "Contractor Quality Representative",
              signed: Boolean(data.contractorSignOff?.signed),
              signedAt: data.contractorSignOff?.date,
            };
          }
          if (s.role.includes("Consultant") && data.consultantSignOff?.signed) {
            return {
              ...s,
              name: data.consultantSignOff.name,
              designation: "Resident Engineer",
              required: true,
              signed: true,
              signedAt: data.consultantSignOff.date,
            };
          }
          return s;
        });
        setStakeholders(initial);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentProjId, currentCompId, targetId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
        Loading Material Inspection Report...
      </div>
    );
  }

  if (!mir) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Material Inspection Report Not Found
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The requested inspection report could not be found for this project
          workspace.
        </p>
        <button
          onClick={() => navigate("/project/mir")}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          Return to MIR Registry
        </button>
      </div>
    );
  }

  const handlePhotosChange = async (newPhotos: PhotoItem[]) => {
    setPhotos(newPhotos);
    if (!mir) return;
    const updated: MaterialInspectionReport = {
      ...mir,
      photos: newPhotos.map((p) => p.url),
      updatedAt: new Date().toISOString(),
    };
    setMir(updated);
    await dbService.saveMIR(updated);
  };

  const toggleStakeholderRequired = async (index: number) => {
    const updated = stakeholders.map((s, idx) =>
      idx === index ? { ...s, required: !s.required } : s,
    );
    setStakeholders(updated);
    if (mir) {
      const updatedMir = {
        ...mir,
        stakeholders: updated,
        updatedAt: new Date().toISOString(),
      };
      setMir(updatedMir);
      await dbService.saveMIR(updatedMir);
      toast.success(
        `${updated[index].role} set to ${updated[index].required ? "Required" : "Optional"}`,
      );
    }
  };

  const updateStakeholderLocal = (
    index: number,
    updates: Partial<StakeholderSignoff>,
  ) => {
    setStakeholders((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, ...updates } : s)),
    );
  };

  const persistStakeholders = async (listToSave?: StakeholderSignoff[]) => {
    const list = listToSave || stakeholders;
    if (mir) {
      const updatedMir = {
        ...mir,
        stakeholders: list,
        updatedAt: new Date().toISOString(),
      };
      setMir(updatedMir);
      await dbService.saveMIR(updatedMir);
    }
  };

  const updateStakeholder = async (
    index: number,
    updates: Partial<StakeholderSignoff>,
  ) => {
    const updated = stakeholders.map((s, idx) =>
      idx === index ? { ...s, ...updates } : s,
    );
    setStakeholders(updated);
    if (mir) {
      const updatedMir = {
        ...mir,
        stakeholders: updated,
        updatedAt: new Date().toISOString(),
      };
      setMir(updatedMir);
      await dbService.saveMIR(updatedMir);
      if (updates.signed !== undefined) {
        toast.success(
          updates.signed
            ? `${updated[index].role} signature authenticated`
            : "Signature cleared",
        );
      }
    }
  };

  const handleAddStakeholder = async (roleName: string) => {
    if (!roleName.trim()) return;
    if (
      stakeholders.some(
        (s) => s.role.toLowerCase() === roleName.trim().toLowerCase(),
      )
    ) {
      toast.error(`Sign-off role "${roleName}" already exists`);
      return;
    }
    const newSh: StakeholderSignoff = {
      role: roleName.trim(),
      name: "",
      designation: roleName.trim(),
      required: true,
      signed: false,
    };
    const updated = [...stakeholders, newSh];
    setStakeholders(updated);
    setShowAddRoleModal(false);
    setCustomRoleInput("");
    if (mir) {
      const updatedMir = {
        ...mir,
        stakeholders: updated,
        updatedAt: new Date().toISOString(),
      };
      setMir(updatedMir);
      await dbService.saveMIR(updatedMir);
      toast.success(`Added ${roleName} sign-off requirement`);
    }
  };

  const handleRemoveStakeholder = async (index: number) => {
    const removedRole = stakeholders[index].role;
    const updated = stakeholders.filter((_, idx) => idx !== index);
    setStakeholders(updated);
    if (mir) {
      const updatedMir = {
        ...mir,
        stakeholders: updated,
        updatedAt: new Date().toISOString(),
      };
      setMir(updatedMir);
      await dbService.saveMIR(updatedMir);
      toast.success(`Removed ${removedRole} sign-off`);
    }
  };

  const handleUpdateStatus = async (newStatus: MIRStatus) => {
    if (!mir) return;
    try {
      const updated: MaterialInspectionReport = {
        ...mir,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
      setMir(updated);
      await dbService.saveMIR(updated);
      if (currentUser) {
        await writeAudit({
          projectId: currentProjId,
          companyId: currentCompId,
          userId: currentUser.uid,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          action: "UPDATE_MIR_STATUS",
          module: "Material Inspection",
          details: `Updated MIR ${mir.mirNumber} status to ${newStatus}`,
          newValue: updated,
        });
      }
      toast.success(`Document status updated to: ${newStatus}`);
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update document status");
    }
  };

  const handleApplyDisposition = async (
    e?: React.FormEvent,
    directVerdict?: MIRInspectionDisposition,
  ) => {
    if (e) e.preventDefault();
    if (!mir) return;
    const chosenVerdict = directVerdict || verdict;

    setSubmittingReview(true);
    try {
      let finalStatus: MIRStatus = "ACCEPTED";
      if (chosenVerdict === "ACCEPTED_AS_NOTED")
        finalStatus = "ACCEPTED_AS_NOTED";
      else if (chosenVerdict === "REJECTED") finalStatus = "REJECTED";
      else if (chosenVerdict === "HOLD_FOR_TESTING")
        finalStatus = "QUARANTINED";

      const endorsementDate = new Date().toISOString().split("T")[0];
      const userDesignation =
        currentUser?.designation ||
        (currentUser?.role ? ROLE_TITLES[currentUser.role] : "QA/QC Engineer");

      const qaqcSignOff = {
        name: currentUser?.fullName || "QA/QC Engineer",
        designation: userDesignation,
        company: company?.name || "QA/QC DESK",
        date: endorsementDate,
        verdict: chosenVerdict,
        comments: consultantComments.trim() || "",
        signed: true,
      };

      const updatedStakeholders = stakeholders.map((s) => {
        if (
          s.role.toLowerCase().includes("qa/qc") ||
          s.role.toLowerCase().includes("engineer")
        ) {
          return {
            ...s,
            name: currentUser?.fullName || s.name || "QA/QC Engineer",
            designation: userDesignation,
            signed: true,
            signedAt: new Date().toISOString(),
          };
        }
        return s;
      });

      const updated: MaterialInspectionReport = {
        ...mir,
        status: finalStatus,
        disposition: chosenVerdict,
        qaqcSignOff,
        consultantSignOff: {
          name: qaqcSignOff.name,
          firm: qaqcSignOff.company || "Quality Department",
          date: endorsementDate,
          verdict: chosenVerdict,
          comments: qaqcSignOff.comments || "",
          signed: true,
        },
        stakeholders: updatedStakeholders,
        updatedAt: new Date().toISOString(),
      };

      await dbService.saveMIR(updated);
      setStakeholders(updatedStakeholders);
      setMir(updated);
      setVerdict(chosenVerdict);

      if (currentUser) {
        await writeAudit({
          projectId: currentProjId,
          companyId: currentCompId,
          userId: currentUser.uid,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          action: "APPROVE_REJECT_MIR",
          module: "Material Inspection",
          details: `QA/QC Engineer Endorsed MIR ${mir.mirNumber} with verdict: ${chosenVerdict}`,
          newValue: updated,
        });
      }

      toast.success(
        `Verdict saved: ${chosenVerdict.replace(/_/g, " ")} (Status: ${finalStatus})`,
      );
    } catch (err) {
      console.error("Error endorsing MIR:", err);
      toast.error("Failed to update inspection disposition");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDelete = async () => {
    if (!canDeleteMIR) {
      toast.error(
        "Level 4+ Project Director authority required to delete an MIR",
      );
      return;
    }
    if (
      !window.confirm(
        `Permanently delete Material Inspection Report ${mir.mirNumber}?`,
      )
    ) {
      return;
    }

    try {
      await dbService.deleteMIR(mir.id, currentProjId);
      if (currentUser) {
        await writeAudit({
          projectId: currentProjId,
          companyId: currentCompId,
          userId: currentUser.uid,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          action: "DELETE_MIR",
          module: "Material Inspection",
          details: `Deleted MIR ${mir.mirNumber}`,
        });
      }
      toast.success("Inspection record deleted");
      navigate("/project/mir");
    } catch (err) {
      toast.error("Failed to delete inspection record");
    }
  };

  const VERDICT_OPTIONS: {
    code: MIRInspectionDisposition;
    title: string;
    desc: string;
    color: string;
    unselected: string;
  }[] = [
    {
      code: "ACCEPTED",
      title: "Accepted / Approved",
      desc: "Materials fully conform to specification & approved MAR. Release for site installation.",
      color:
        "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/30",
      unselected:
        "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-400",
    },
    {
      code: "ACCEPTED_AS_NOTED",
      title: "Accepted as Noted",
      desc: "Minor non-conformances noted. Materials released subject to complying with remarks.",
      color:
        "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 ring-1 ring-blue-500/30",
      unselected:
        "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-400",
    },
    {
      code: "REJECTED",
      title: "Rejected / Non-Compliant",
      desc: "Materials fail quality checkpoints. Quarantined for removal from site.",
      color:
        "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 ring-1 ring-red-500/30",
      unselected:
        "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-400",
    },
    {
      code: "HOLD_FOR_TESTING",
      title: "Hold for Laboratory Testing",
      desc: "Quarantined pending coupon test results (e.g. rebar tensile or cement testing).",
      color:
        "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/30",
      unselected:
        "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-400",
    },
  ];

  const totalDelivered =
    mir.items?.reduce(
      (acc, i) => acc + (Number(i.quantityDelivered) || 0),
      0,
    ) || 0;
  const totalAccepted =
    mir.items?.reduce((acc, i) => acc + (Number(i.quantityAccepted) || 0), 0) ||
    0;
  const totalRejected =
    mir.items?.reduce((acc, i) => acc + (Number(i.quantityRejected) || 0), 0) ||
    0;

  const editLink = projectId
    ? `/project/${projectId}/mir/${mir.id}/edit`
    : `/project/mir/${mir.id}/edit`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300 pb-16">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/project/mir")}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-0.5 font-bold">
              <span>{mir.mirNumber}</span>
              <span>•</span>
              <span>{mir.discipline}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {mir.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canDeleteMIR && (
            <button
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Delete MIR"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {canCreateMIR && (
            <Link
              to={editLink}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              <span>
                {mir.status === "DRAFT" ? "Continue Draft" : "Edit / Amend"}
              </span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => handleUpdateStatus("SUBMITTED")}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Submit / Finalize MIR</span>
          </button>
          <button
            onClick={() =>
              generateMIRPDF(
                { ...mir, stakeholders },
                activeProject || {},
                company || {},
              )
            }
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm transition"
          >
            <FileDown className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Export Stamped MIR PDF</span>
          </button>
        </div>
      </div>

      {/* Draft State Alert Banner */}
      {mir.status === "DRAFT" && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-xs">
                This Material Inspection Report is currently a Draft
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                You can promote this report to Submitted / Inspected, or
                continue editing draft fields.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleUpdateStatus("SUBMITTED")}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Submit / Finalize MIR</span>
            </button>
            {canCreateMIR && (
              <Link
                to={editLink}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Draft</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Overview Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Material Receiving Summary
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                mir.disposition === "ACCEPTED"
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300"
                  : mir.disposition === "ACCEPTED_AS_NOTED"
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300"
                    : mir.disposition === "REJECTED"
                      ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300"
                      : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300"
              }`}
            >
              Verdict:{" "}
              {mir.disposition
                ? mir.disposition.replace(/_/g, " ")
                : "Pending Decision"}
            </span>

            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Status:
              </label>
              <select
                value={mir.status}
                onChange={(e) =>
                  handleUpdateStatus(e.target.value as MIRStatus)
                }
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="INSPECTED">INSPECTED</option>
                <option value="ACCEPTED">ACCEPTED</option>
                <option value="ACCEPTED_AS_NOTED">ACCEPTED AS NOTED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="QUARANTINED">QUARANTINED</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Discipline
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {mir.discipline}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Approved MAR
            </span>
            {mir.marNumber ? (
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {mir.marNumber}
              </span>
            ) : (
              <span className="text-slate-500">Direct Receiving</span>
            )}
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Supplier / Vendor
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {mir.supplierVendor}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Waybill / Ticket
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {mir.deliveryNumber || "—"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Delivery Date
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {mir.deliveryDate}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Inspection Date
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {mir.inspectionDate}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Purchase Order (PO)
            </span>
            <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
              {mir.poNumber || "—"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">
              Laydown Area
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
              {mir.storageLocation || "General Laydown"}
            </span>
          </div>
        </div>

        {/* Verification Matrix Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">
              Packaging
            </span>
            <span
              className={`font-bold text-xs ${
                mir.packagingCondition === "DAMAGED"
                  ? "text-red-600"
                  : "text-emerald-600"
              }`}
            >
              {mir.packagingCondition}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">
              Mill Cert (MTC)
            </span>
            <span
              className={`font-bold text-xs ${
                mir.millCertificateProvided
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}
            >
              {mir.millCertificateProvided ? "PROVIDED" : "MISSING"}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">
              Dimensions
            </span>
            <span
              className={`font-bold text-xs ${
                mir.physicalDimensionsCheck === "PASS"
                  ? "text-emerald-600"
                  : mir.physicalDimensionsCheck === "FAIL"
                    ? "text-red-600"
                    : "text-slate-500"
              }`}
            >
              {mir.physicalDimensionsCheck}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">
              Lab Sampling
            </span>
            <span className="font-bold text-xs text-brand-600 dark:text-brand-400">
              {mir.samplingRequired
                ? `TAG: ${mir.sampleTagNumber || "YES"}`
                : "NOT REQUIRED"}
            </span>
          </div>
        </div>
      </div>

      {/* Line Items Quantity Audit */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Package className="w-4 h-4 text-brand-600" />
            <span>Delivered Items & Quantity Verification</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 text-[11px]">
            <span>
              Total Delivered:{" "}
              <strong className="text-slate-900 dark:text-white">
                {totalDelivered}
              </strong>
            </span>
            <span>
              Accepted:{" "}
              <strong className="text-emerald-600">{totalAccepted}</strong>
            </span>
            <span>
              Rejected:{" "}
              <strong className="text-red-600">{totalRejected}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Spec Ref</th>
                <th className="py-2.5 px-3 text-right">Delivered</th>
                <th className="py-2.5 px-3 text-right">Inspected</th>
                <th className="py-2.5 px-3 text-right">Accepted</th>
                <th className="py-2.5 px-3 text-right">Rejected</th>
                <th className="py-2.5 px-3 text-center">Unit</th>
                <th className="py-2.5 px-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {mir.items?.map((item, idx) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                >
                  <td className="py-2.5 px-3 text-slate-400 font-mono">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                    {item.description}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {item.specificationRef || "—"}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold">
                    {item.quantityDelivered}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
                    {item.quantityInspected}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                    {item.quantityAccepted}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-bold ${
                      item.quantityRejected > 0
                        ? "text-red-600"
                        : "text-slate-400"
                    }`}
                  >
                    {item.quantityRejected}
                  </td>
                  <td className="py-2.5 px-3 text-center uppercase font-mono text-[10px]">
                    {item.unit}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {item.remarks || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Observation & Defect Notes */}
      {(mir.inspectionNotes || mir.rejectionReasons || mir.actionRequired) && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
          <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-brand-600" />
            <span>Inspection Observations, Defects & Engineering Directives</span>
          </div>

          {mir.inspectionNotes && (
            <div className="space-y-1.5">
              <span className="text-slate-400 font-bold block text-[11px] uppercase tracking-wider">
                Inspector Observations & Notes:
              </span>
              <StructuredInspectionView
                text={mir.inspectionNotes}
                defaultCategory="note"
              />
            </div>
          )}

          {mir.rejectionReasons && (
            <div className="space-y-1.5">
              <span className="text-red-600 font-bold block text-[11px] uppercase tracking-wider">
                Defects, Non-Conformances & Justifications:
              </span>
              <StructuredInspectionView
                text={mir.rejectionReasons}
                defaultCategory="defect"
              />
            </div>
          )}

          {mir.actionRequired && (
            <div className="space-y-1.5">
              <span className="text-amber-600 font-bold block text-[11px] uppercase tracking-wider">
                Mandatory Action & Quarantine Requirements:
              </span>
              <StructuredInspectionView
                text={mir.actionRequired}
                defaultCategory="action"
              />
            </div>
          )}
        </div>
      )}

      {/* Photos & Attachments */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
        <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
          Inspection Photographic Documentation
        </div>
        <UniversalPhotoUploader
          photos={photos}
          onChange={handlePhotosChange}
          projectId={currentProjId}
          companyId={currentCompId}
          sourceModule="MIR"
          sourceId={mir.id}
          folder={`projects/${currentProjId}/mirs`}
          disabled={!canReviewMIR}
        />
      </div>

      {/* Statutory Stakeholder Sign-Off Authorizations */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Statutory Stakeholder Sign-Off Authorizations</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Configure required quality signatories or add manual custom
              sign-off roles for this material inspection report.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddRoleModal(true)}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Sign-off Role</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {stakeholders.map((sh, idx) => {
            const isQAQC =
              sh.role.toLowerCase().includes("qa/qc") &&
              sh.role.toLowerCase().includes("engineer");
            return (
              <div
                key={idx}
                className={`p-3.5 border rounded-2xl transition flex flex-col justify-between ${
                  sh.signed
                    ? "bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                    : sh.required
                      ? "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                      : "bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/60 opacity-70"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    <span>{sh.role}</span>
                    {sh.signed && (
                      <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                        SIGNED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isQAQC}
                      onClick={() => toggleStakeholderRequired(idx)}
                      className={`text-[9px] font-black px-2 py-0.5 rounded-lg border transition ${
                        isQAQC
                          ? "bg-amber-100 text-amber-800 border-amber-300 cursor-not-allowed"
                          : sh.required
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300"
                      }`}
                      title={
                        isQAQC
                          ? "QA/QC Engineer endorsement is statutory & mandatory"
                          : "Click to toggle Required / Optional"
                      }
                    >
                      {isQAQC
                        ? "MANDATORY"
                        : sh.required
                          ? "REQUIRED"
                          : "OPTIONAL"}
                    </button>
                    {!isQAQC && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStakeholder(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition"
                        title="Remove this signoff role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  {sh.signed ? (
                    <div className="space-y-1 py-0.5">
                      <div className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center justify-between text-xs">
                        <span>{sh.name}</span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                          {sh.signedAt
                            ? new Date(sh.signedAt).toLocaleDateString()
                            : "Signed"}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {sh.designation || sh.role}
                      </div>
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
                        Clear Signature
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Signatory Full Name
                        </label>
                        <input
                          type="text"
                          value={sh.name || ""}
                          onChange={(e) =>
                            updateStakeholderLocal(idx, {
                              name: e.target.value,
                            })
                          }
                          onBlur={() => persistStakeholders()}
                          placeholder={`Enter ${sh.role} name`}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Designation / Title
                        </label>
                        <input
                          type="text"
                          value={sh.designation || ""}
                          onChange={(e) =>
                            updateStakeholderLocal(idx, {
                              designation: e.target.value,
                            })
                          }
                          onBlur={() => persistStakeholders()}
                          placeholder={`e.g. ${sh.role}`}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateStakeholder(idx, {
                              name: currentUser?.fullName || "",
                              designation:
                                currentUser?.designation ||
                                (currentUser?.role
                                  ? ROLE_TITLES[currentUser.role]
                                  : sh.role),
                              signed: true,
                              signedAt: new Date().toISOString(),
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg font-bold text-[11px] transition shadow-sm"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            Sign as {currentUser?.fullName || "Current User"}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QA/QC Engineer Official Endorsement & Disposition Stamping */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-brand-600" />
              <span>
                QA/QC Engineer Official Endorsement & Material Disposition
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Apply official statutory quality receiving endorsement and
              material acceptance verdict (Level 3+ QA/QC Engineer / Quality
              Authority)
            </p>
          </div>

          {(mir.qaqcSignOff?.signed || mir.consultantSignOff?.signed) && (
            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold rounded-lg border border-emerald-300">
              Officially Endorsed by QA/QC
            </span>
          )}
        </div>

        <form onSubmit={(e) => handleApplyDisposition(e)} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                Select Official Disposition Verdict * (Click to Save Instantly)
              </label>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ Clicking any card immediately saves the verdict to database
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VERDICT_OPTIONS.map((opt) => {
                const isSelected = verdict === opt.code;
                return (
                  <div
                    key={opt.code}
                    onClick={() => {
                      setVerdict(opt.code);
                      handleApplyDisposition(undefined, opt.code);
                    }}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? `${opt.color} shadow-md`
                        : `${opt.unselected}`
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs mb-1">
                      <span>{opt.title}</span>
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>SAVED & APPLIED</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold group-hover:text-brand-600">
                          Click to Apply
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] opacity-80">{opt.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active / Current Endorsement Display */}
          {(mir.qaqcSignOff?.comments || mir.consultantSignOff?.comments) && (
            <div className="p-4 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/60 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-orange-900 dark:text-orange-300">
                <span className="uppercase tracking-wider">
                  Active QA/QC Endorsement Commentary & Directives:
                </span>
                <span>
                  {mir.qaqcSignOff?.name || mir.consultantSignOff?.name} •{" "}
                  {mir.qaqcSignOff?.date || mir.consultantSignOff?.date}
                </span>
              </div>
              <StructuredInspectionView
                text={
                  mir.qaqcSignOff?.comments || mir.consultantSignOff?.comments
                }
                defaultCategory="directive"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                QA/QC Engineer Remarks, Caveats & Conditions
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Supports paragraph breaks &amp; clauses
              </span>
            </div>
            {/* Structured Clause Preset Insertion Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">
                Insert Clause:
              </span>
              {[
                "Dimensional Non-Conformance: ",
                "Operational Impact: ",
                "Management Directive: ",
                "Liability Disclaimer: ",
                "Root Cause: ",
                "Corrective Action: ",
                "Special Condition: ",
              ].map((prefix) => (
                <button
                  key={prefix}
                  type="button"
                  onClick={() => {
                    setConsultantComments((prev) => {
                      const trimmed = prev.trim();
                      return trimmed ? `${trimmed}\n\n${prefix}` : prefix;
                    });
                  }}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950/40 dark:hover:text-brand-300 border border-slate-200 dark:border-slate-700 text-[10px] font-medium transition"
                >
                  + {prefix.replace(": ", "")}
                </button>
              ))}
            </div>
            <textarea
              rows={4}
              value={consultantComments}
              onChange={(e) => setConsultantComments(e.target.value)}
              placeholder="Enter official QA/QC engineering commentary, compliance restrictions, or testing conditions (e.g. Dimensional Non-Conformance: ..., Operational Impact: ..., Management Directive: ..., Liability Disclaimer: ...)..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 leading-relaxed text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {mir.qaqcSignOff?.signed
                ? `Endorsed by ${mir.qaqcSignOff.name} (${mir.qaqcSignOff.designation}) on ${mir.qaqcSignOff.date}`
                : mir.consultantSignOff?.signed
                  ? `Endorsed by ${mir.consultantSignOff.name} on ${mir.consultantSignOff.date}`
                  : "Awaiting QA/QC Engineer official endorsement stamp"}
            </span>

            <button
              type="submit"
              disabled={submittingReview}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-lg shadow-brand-500/20 transition active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>
                {submittingReview
                  ? "Saving Endorsement..."
                  : `Save & Apply Verdict: ${verdict.replace(/_/g, " ")}`}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Add Sign-off Authorization Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-600" />
                <span>Add Sign-off Authorization Role</span>
              </h3>
              <button
                onClick={() => setShowAddRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select standard project discipline or type a custom role to
              require on this material inspection report:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {[
                "Supervising Consultant / RE",
                "Project Manager",
                "Site Construction Engineer",
                "Materials Engineer",
                "Storekeeper / Warehouseman",
                "Structural Consultant",
                "Client Representative",
                "Safety Manager",
              ].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleAddStakeholder(r)}
                  className="px-2.5 py-2 text-left bg-slate-50 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition"
                >
                  + {r}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label className="block text-[10px] font-bold uppercase text-slate-500">
                Or Type Custom Role / Designation
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customRoleInput.trim()) {
                      e.preventDefault();
                      handleAddStakeholder(customRoleInput);
                    }
                  }}
                  placeholder="e.g. Geotechnical Specialist"
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  disabled={!customRoleInput.trim()}
                  onClick={() => handleAddStakeholder(customRoleInput)}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MIRDetail;
