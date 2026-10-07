import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { hasPermission } from "@/lib/rbac";
import { toast } from "react-hot-toast";
import { generateMARPDF } from "@/lib/pdfGenerators";
import { MaterialApprovalRequest, SubmittalReviewCode } from "@/types";
import {
  UniversalPhotoUploader,
  PhotoItem,
} from "@/components/common/UniversalPhotoUploader";
import {
  FileCheck2,
  ArrowLeft,
  FileDown,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  AlertCircle,
} from "lucide-react";

export const MARDetail: React.FC = () => {
  const { projectId, id, marId } = useParams<{
    projectId: string;
    id: string;
    marId: string;
  }>();
  const targetId = id || marId || "";
  const navigate = useNavigate();
  const { currentUser, company } = useAuthStore();
  const { activeProject } = useProjectStore();
  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";

  const [mar, setMar] = useState<MaterialApprovalRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const canReviewMAR = hasPermission(currentUser?.role, "APPROVE_REJECT_MAR");

  // Review Form
  const [reviewCode, setReviewCode] = useState<SubmittalReviewCode>("Code A");
  const [reviewComments, setReviewComments] = useState("");
  const [attachments, setAttachments] = useState<PhotoItem[]>([]);

  const loadData = async () => {
    if (!currentProjId || !targetId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const list = await dbService.getMARs(currentProjId, currentCompId);
    const match = list.find(
      (m) => m.id === targetId || m.marNumber === targetId,
    );
    setMar(match || null);
    if (match) {
      if (match.reviewCode) setReviewCode(match.reviewCode);
      if (match.reviewComments) setReviewComments(match.reviewComments);
      const rawAtts = match.attachments || [];
      setAttachments(
        rawAtts.map((a: any) =>
          typeof a === "string" ? { url: a, caption: "" } : a,
        ),
      );
    }
    setLoading(false);
  };

  const handleAttachmentsChange = async (newAtts: PhotoItem[]) => {
    setAttachments(newAtts);
    if (!mar) return;
    const updated: MaterialApprovalRequest = {
      ...mar,
      attachments: newAtts.map((a) => a.url),
      updatedAt: new Date().toISOString(),
    };
    setMar(updated);
    await dbService.saveMAR(updated);
  };

  useEffect(() => {
    loadData();
  }, [currentProjId, currentCompId, targetId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
        Loading submittal record...
      </div>
    );
  }

  if (!mar) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Submittal Record Not Found
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The requested Material Approval Request (MAR) could not be found for
          this project workspace.
        </p>
        <button
          onClick={() => navigate("/project/mar")}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          Return to MAR Submittals
        </button>
      </div>
    );
  }

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canReviewMAR) {
      toast.error(
        "You do not have permission to review or approve material requests (Level 3+ required)",
      );
      return;
    }
    const isApproved = reviewCode === "Code A" || reviewCode === "Code B";
    const updated: MaterialApprovalRequest = {
      ...mar,
      status: isApproved ? "APPROVED" : "REJECTED",
      reviewCode,
      reviewComments,
      reviewedBy: {
        name: currentUser?.fullName || "Supervising Consultant",
        role: currentUser?.role || "CONSULTANT",
        date: new Date().toISOString().split("T")[0],
      },
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveMAR(updated);

    if (currentUser) {
      await writeAudit({
        projectId: currentProjId,
        companyId: currentCompId,
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: "REVIEW_MAR",
        module: "Submittals",
        details: `Issued formal approval review for ${mar.marNumber} (${reviewCode})`,
        newValue: updated,
      });
    }

    setMar(updated);
  };

  const CODES: {
    code: SubmittalReviewCode;
    title: string;
    desc: string;
    color: string;
    unselected: string;
  }[] = [
    {
      code: "Code A",
      title: "Approved",
      desc: "Work may proceed unconditionally.",
      color:
        "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/30",
      unselected:
        "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-400",
    },
    {
      code: "Code B",
      title: "Approved as Noted",
      desc: "Work may proceed subject to incorporating remarks.",
      color:
        "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 ring-1 ring-blue-500/30",
      unselected:
        "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-400",
    },
    {
      code: "Code C",
      title: "Revise & Resubmit",
      desc: "Work may NOT proceed. Revise and resubmit.",
      color:
        "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/30",
      unselected:
        "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-400",
    },
    {
      code: "Code D",
      title: "Rejected",
      desc: "Non-compliant with contract specifications.",
      color:
        "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 ring-1 ring-red-500/30",
      unselected:
        "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-400",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/project/mar")}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-0.5">
              <span>{mar.marNumber}</span>
              <span>•</span>
              <span>{mar.category}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {mar.title}
            </h1>
          </div>
        </div>

        <button
          onClick={() =>
            generateMARPDF(mar, activeProject || {}, company || {})
          }
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm transition"
        >
          <FileDown className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Export Stamped MAR PDF</span>
        </button>
      </div>

      {/* Submittal Details */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">
              Category
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {mar.category}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">
              Trade / Discipline
            </span>
            <span className="text-slate-800 dark:text-slate-200">
              {mar.tradeName}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">
              Supplier
            </span>
            <span className="text-slate-800 dark:text-slate-200">
              {mar.supplierVendor}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">
              Physical Sample
            </span>
            <span className="font-bold text-brand-600 dark:text-brand-300">
              {mar.sampleSubmitted ? "YES (Submitted)" : "NO"}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
            Technical Specification Description
          </span>
          <p className="text-slate-800 dark:text-slate-100 text-sm leading-relaxed p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            {mar.technicalDescription}
          </p>
        </div>
      </div>

      {/* Material Photos & Attached Documents */}
      <UniversalPhotoUploader
        photos={attachments}
        onChange={handleAttachmentsChange}
        projectId={currentProjId}
        companyId={currentCompId}
        uploadedBy={currentUser?.fullName || "QA/QC Engineer"}
        uploaderRole={currentUser?.role}
        sourceModule="MAR"
        sourceId={mar.id}
        tradeName={mar.tradeName}
        category="MATERIAL"
        folder={`jqms/mar/${mar.id}/attachments`}
        title="Material Samples, Mill Certificates & Technical Evidence"
        description="Inspect physical sample photos and compliance certificates uploaded to Cloudinary or project gallery."
      />

      {/* Consultant Review & Approval Stamp Portal */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-sm flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>
              Consultant Review Stamp & Final Disposition (ISO 9001:2015 Clause
              8.4)
            </span>
          </span>
          {mar.reviewCode && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-500/30">
              Current: {mar.reviewCode}
            </span>
          )}
        </div>

        <form onSubmit={handleSaveReview} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-slate-700 dark:text-slate-300 font-semibold">
              Select Official Approval Code Stamp *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CODES.map((c) => {
                const isSelected = reviewCode === c.code;
                return (
                  <div
                    key={c.code}
                    onClick={() => setReviewCode(c.code)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${isSelected ? `${c.color} shadow-md` : `${c.unselected}`}`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs mb-1">
                      <span>
                        {c.code}: {c.title}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <div className="text-[11px] opacity-80">{c.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Consultant Remarks & Conditions *
            </label>
            <textarea
              rows={4}
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              placeholder="Enter technical comments, compliance caveats, testing preconditions..."
              required
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 leading-relaxed text-xs placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {mar.reviewedBy
                ? `Reviewed by ${mar.reviewedBy.name} on ${mar.reviewedBy.date}`
                : "Awaiting consultant disposition"}
            </span>
            <button
              type="submit"
              disabled={!canReviewMAR}
              title={
                !canReviewMAR
                  ? "Level 3+ consultant/engineering authority required"
                  : undefined
              }
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>Apply Approval Stamp</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
