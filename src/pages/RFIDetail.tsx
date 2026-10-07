import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dbService } from '@/lib/db';
import { writeAudit } from '@/lib/audit';
import { hasPermission } from '@/lib/rbac';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { generateRFIPDF } from '@/lib/pdfGenerators';
import { RequestForInformation, RFIApprovalStatus } from '@/types';
import { UniversalPhotoUploader, PhotoItem } from '@/components/common/UniversalPhotoUploader';
import {
  FileQuestion,
  ArrowLeft,
  FileDown,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertTriangle,
  User,
  ShieldCheck,
  Send,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const RFIDetail: React.FC = () => {
  const { projectId, id, rfiId } = useParams<{ projectId: string; id: string; rfiId: string }>();
  const targetId = id || rfiId || '';
  const navigate = useNavigate();
  const { currentUser, company } = useAuthStore();
  const { activeProject } = useProjectStore();
  const currentProjId = activeProject?.id || projectId || '';
  const currentCompId = currentUser?.companyId || company?.id || activeProject?.companyId || '';

  const [rfi, setRfi] = useState<RequestForInformation | null>(null);
  const [loading, setLoading] = useState(true);
  const canRespondRFI = hasPermission(currentUser?.role, 'RESPOND_RFI');

  // Response fields
  const [responseText, setResponseText] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<RFIApprovalStatus>('APPROVED');
  const [attachments, setAttachments] = useState<PhotoItem[]>([]);

  const loadData = async () => {
    if (!currentProjId || !targetId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const list = await dbService.getRFIs(currentProjId, currentCompId);
    const match = list.find((r) => r.id === targetId || r.rfiNumber === targetId);
    setRfi(match || null);
    if (match) {
      if (match.response?.responseText) {
        setResponseText(match.response.responseText);
        setApprovalStatus(match.response.approvalStatus);
      }
      const raw = match.attachments || [];
      setAttachments(raw.map((a: any) => (typeof a === 'string' ? { url: a, caption: '' } : a)));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentProjId, currentCompId, targetId]);

  const handleAttachmentsChange = async (newAtts: PhotoItem[]) => {
    setAttachments(newAtts);
    if (!rfi) return;
    const updated: RequestForInformation = {
      ...rfi,
      attachments: newAtts.map((a) => a.url),
      updatedAt: new Date().toISOString(),
    };
    setRfi(updated);
    await dbService.saveRFI(updated);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">Loading RFI query...</div>;
  }

  if (!rfi) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-200">RFI Record Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The requested technical RFI record could not be found for this project workspace.
        </p>
        <button
          onClick={() => navigate('/project/rfi')}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition shadow"
        >
          Return to RFI Registry
        </button>
      </div>
    );
  }

  const handleSaveResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRespondRFI) {
      toast.error('You do not have permission to record consultant responses (Level 3+ required)');
      return;
    }
    const updated: RequestForInformation = {
      ...rfi,
      status: 'RESPONDED',
      attachments: attachments.map((a) => a.url),
      response: {
        responderName: currentUser?.fullName || 'Supervising Consultant',
        responderRole: currentUser?.role || 'CONSULTANT',
        responseDate: new Date().toISOString().split('T')[0],
        responseText,
        approvalStatus,
      },
      updatedAt: new Date().toISOString(),
    };

    await dbService.saveRFI(updated);

    if (currentUser) {
      await writeAudit({
        projectId: currentProjId,
        companyId: currentCompId,
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: 'RESPOND_RFI',
        module: 'RFI',
        details: `Recorded consultant response for ${rfi.rfiNumber} (${approvalStatus})`,
        newValue: updated,
      });
    }

    setRfi(updated);
    toast.success('Consultant response recorded successfully');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/project/rfi')}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-mono text-xs uppercase tracking-wider mb-0.5">
              <span>{rfi.rfiNumber}</span>
              <span>•</span>
              <span>{rfi.discipline}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{rfi.title}</h1>
          </div>
        </div>

        <button
          onClick={() => generateRFIPDF(rfi, activeProject || {}, company || {})}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm transition"
        >
          <FileDown className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Export Official RFI PDF</span>
        </button>
      </div>

      {/* RFI Inquiry Body */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Drawing Ref</span>
            <span className="font-mono text-brand-600 dark:text-brand-300 font-bold">{rfi.drawingReference}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Spec Clause</span>
            <span className="text-slate-800 dark:text-slate-200">{rfi.specReference || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Cost Impact</span>
            <span className="font-bold text-amber-700 dark:text-amber-400">
              {rfi.costImpact ? `YES ($${rfi.costImpactEstimate})` : 'NO'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Schedule Delay</span>
            <span className="font-bold text-red-700 dark:text-red-400">
              {rfi.scheduleImpact ? `YES (+${rfi.scheduleDelayDays}d)` : 'NO'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">Technical Question</span>
          <p className="text-slate-900 dark:text-slate-100 text-sm leading-relaxed p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-sans">
            {rfi.question}
          </p>
        </div>

        {rfi.proposedSolution && (
          <div className="space-y-2 pt-2">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase text-[10px]">Contractor Proposed Solution</span>
            <p className="text-slate-800 dark:text-slate-300 text-xs leading-relaxed p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-emerald-300 dark:border-emerald-900/40 font-sans">
              {rfi.proposedSolution}
            </p>
          </div>
        )}
      </div>

      {/* Site Sketches & Photographic Evidence */}
      <UniversalPhotoUploader
        photos={attachments}
        onChange={handleAttachmentsChange}
        projectId={currentProjId}
        companyId={currentCompId}
        uploadedBy={currentUser?.fullName || 'QA/QC Engineer'}
        uploaderRole={currentUser?.role}
        sourceModule="RFI"
        sourceId={rfi.id}
        tradeName={rfi.tradeName}
        category="PROGRESS"
        folder={`jqms/rfi/${rfi.id}/attachments`}
        title="RFI Sketches, Drawings & Photographic Records"
        description="View or upload clarifying site images, markups, and drawing attachments using Cloudinary or project gallery."
      />

      {/* Consultant Formal Response Portal */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-sm flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Consultant Formal Review & Directive (ISO 9001:2015 Clause 8.2.3)</span>
          </span>
          {rfi.response && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-500/30">
              {rfi.response.approvalStatus}
            </span>
          )}
        </div>

        <form onSubmit={handleSaveResponse} className="space-y-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Consultant Review Disposition *</label>
            <select
              value={approvalStatus}
              onChange={(e) => setApprovalStatus(e.target.value as RFIApprovalStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-brand-500"
            >
              <option value="APPROVED">APPROVED (Proceed with Contractor Proposal)</option>
              <option value="APPROVED_AS_NOTED">APPROVED AS NOTED (Proceed per Remarks)</option>
              <option value="REVISE_RESUBMIT">REVISE & RESUBMIT (Insufficient Detail)</option>
              <option value="REJECTED">REJECTED (Non-Compliant)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Formal Response / Directive Text *</label>
            <textarea
              rows={4}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Provide engineering response, calculation references, or approved sketch notes..."
              required
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 leading-relaxed text-xs font-sans"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {rfi.response ? `Last signed by ${rfi.response.responderName} on ${rfi.response.responseDate}` : 'Awaiting consultant sign-off'}
            </span>
            <button
              type="submit"
              disabled={!canRespondRFI}
              title={!canRespondRFI ? 'Level 3+ consultant/engineering authority required' : undefined}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-lg shadow-brand-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>Record Consultant Response</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RFIDetail;
