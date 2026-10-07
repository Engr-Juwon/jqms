import React, { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { useCompany } from "@/lib/companyHelper";
import { dbService } from "@/lib/db";
import {
  isUserEligibleForStakeholderRole,
  isQAQCUser,
  getRoleLevel,
} from "@/lib/permissions";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Filter,
  Layers,
  ChevronRight,
  X,
  ExternalLink,
  Printer,
  FileCheck2,
  AlertOctagon,
  MessageSquare,
  BookOpen,
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { SignaturePad } from "@/components/common/SignaturePad";
import {
  MethodStatement,
  MethodStatementReviewCode,
  RAMSReviewStatus,
  RAMSHazardControlItem,
  CRSReviewCommentItem,
  ITPPlan,
  PermitToPour,
} from "@/types";

const REVIEW_CODE_CONFIG: Record<
  MethodStatementReviewCode,
  { label: string; badge: string; border: string; desc: string }
> = {
  "Code A": {
    label: "Code A - Approved",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
    desc: "Approved without comments. Work may proceed in strict compliance.",
  },
  "Code B": {
    label: "Code B - Approved as Noted",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
    desc: "Work may proceed subject to incorporation of noted CRS remarks in Rev 01.",
  },
  "Code C": {
    label: "Code C - Revise & Resubmit",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
    desc: "Major non-compliances identified. Revise methodology and resubmit before starting work.",
  },
  "Code D": {
    label: "Code D - Rejected",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    border: "border-rose-500/20",
    desc: "Rejected. Totally non-compliant with design standards or safety regulations.",
  },
};

const DISCIPLINES = [
  "Civil & Structural",
  "Architectural & Finishes",
  "MEP - Electrical",
  "MEP - Mechanical",
  "Geotechnical & Earthworks",
  "Façade & Waterproofing",
  "Specialist Works",
  "General",
] as const;

export const MethodStatementsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { activeProject } = useProjectStore();
  const { company } = useCompany();

  const projectId = activeProject?.id || "proj-default";
  const companyId = company?.id || "comp-default";

  // State
  const [loading, setLoading] = useState(true);
  const [methodStatements, setMethodStatements] = useState<MethodStatement[]>([]);
  const [itpPlans, setItpPlans] = useState<ITPPlan[]>([]);
  const [ptps, setPtps] = useState<PermitToPour[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCode, setSelectedCode] = useState<string>("ALL");

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMS, setSelectedMS] = useState<MethodStatement | null>(null);
  const [showPrintDossier, setShowPrintDossier] = useState(false);

  // Form State
  const [formNumber, setFormNumber] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDiscipline, setFormDiscipline] = useState<(typeof DISCIPLINES)[number]>("Civil & Structural");
  const [formTrade, setFormTrade] = useState("Reinforced Concrete & PT Works");
  const [formRevision, setFormRevision] = useState("Rev 00");
  const [formScope, setFormScope] = useState("");
  const [formSequence, setFormSequence] = useState("");
  const [formPlantInput, setFormPlantInput] = useState("");
  const [formPlantList, setFormPlantList] = useState<string[]>([]);
  const [formMaterialInput, setFormMaterialInput] = useState("");
  const [formMaterialList, setFormMaterialList] = useState<string[]>([]);
  const [formHoldPointsInput, setFormHoldPointsInput] = useState("");
  const [formHoldPointsList, setFormHoldPointsList] = useState<string[]>([]);
  const [formLinkedItpIds, setFormLinkedItpIds] = useState<string[]>([]);

  // Interactive RAMS Table Builder in Form
  const [formRamsItems, setFormRamsItems] = useState<RAMSHazardControlItem[]>([
    {
      id: "rams-1",
      activityStep: "Initial Site Set-up & Perimeter Barricading",
      hazardDescription: "Unauthorized personnel entering high-risk operation zone",
      initialRisk: "MEDIUM",
      controlMeasures: "Install 2m high chainlink hoarding with safety signage and access control marshal.",
      residualRisk: "LOW",
      responsiblePerson: "HSE Site Supervisor",
    },
  ]);
  const [newRamsActivity, setNewRamsActivity] = useState("");
  const [newRamsHazard, setNewRamsHazard] = useState("");
  const [newRamsInitialRisk, setNewRamsInitialRisk] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("HIGH");
  const [newRamsControl, setNewRamsControl] = useState("");
  const [newRamsResidualRisk, setNewRamsResidualRisk] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW");
  const [newRamsPerson, setNewRamsPerson] = useState("");

  // Consultant Review / CRS State in Drawer
  const [activeDrawerTab, setActiveDrawerTab] = useState<"overview" | "rams" | "crs" | "signoff">("overview");
  const [newCrsSection, setNewCrsSection] = useState("Section 2 - Sequence of Work");
  const [newCrsComment, setNewCrsComment] = useState("");
  const [contractorReplyText, setContractorReplyText] = useState("");
  const [selectedCrsItemId, setSelectedCrsItemId] = useState<string | null>(null);

  // Review Stamping & Sign-off State
  const [reviewCodeDecision, setReviewCodeDecision] = useState<MethodStatementReviewCode>("Code A");
  const [consultantRemarks, setConsultantRemarks] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [stampNumber, setStampNumber] = useState("CONSULTANT-STAMP-2026");
  const [signingInProgress, setSigningInProgress] = useState(false);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [msList, itps, ptpList] = await Promise.all([
        dbService.getMethodStatements(projectId, companyId),
        dbService.getITPPlans(projectId, companyId),
        dbService.getPermitToPours(projectId, companyId),
      ]);
      setMethodStatements(msList);
      setItpPlans(itps);
      setPtps(ptpList);
    } catch (err) {
      console.error("Failed to load method statements:", err);
      toast.error("Failed to load method statements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId, companyId]);

  // Filtered List
  const filteredMS = useMemo(() => {
    return methodStatements.filter((ms) => {
      if (selectedDiscipline !== "ALL" && ms.discipline !== selectedDiscipline) return false;
      if (selectedStatus !== "ALL" && ms.status !== selectedStatus) return false;
      if (selectedCode !== "ALL" && ms.reviewCode !== selectedCode) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = ms.msNumber.toLowerCase().includes(q);
        const matchTitle = ms.title.toLowerCase().includes(q);
        const matchTrade = ms.trade.toLowerCase().includes(q);
        const matchScope = ms.scopeOfWork.toLowerCase().includes(q);
        if (!matchNum && !matchTitle && !matchTrade && !matchScope) {
          return false;
        }
      }
      return true;
    });
  }, [methodStatements, selectedDiscipline, selectedStatus, selectedCode, searchQuery]);

  // KPI Metrics
  const stats = useMemo(() => {
    const total = methodStatements.length;
    const codeA = methodStatements.filter((m) => m.reviewCode === "Code A").length;
    const codeB = methodStatements.filter((m) => m.reviewCode === "Code B").length;
    const underReview = methodStatements.filter((m) => m.status === "UNDER_REVIEW" || m.status === "SUBMITTED").length;
    const reviseCodeC = methodStatements.filter((m) => m.reviewCode === "Code C" || m.reviewCode === "Code D").length;
    const approvalRate = total > 0 ? Math.round(((codeA + codeB) / total) * 100) : 100;

    return { total, codeA, codeB, underReview, reviseCodeC, approvalRate };
  }, [methodStatements]);

  // Create Method Statement Handler
  const handleCreateMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Please enter a Method Statement title");
      return;
    }

    const docNum = formNumber.trim() || `MS-${formDiscipline.substring(0, 3).toUpperCase()}-${String(methodStatements.length + 1).padStart(3, "0")}`;

    const newMS: MethodStatement = {
      id: `ms-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      msNumber: docNum,
      title: formTitle,
      projectId,
      projectName: activeProject?.name || "Apex Tower",
      companyId,
      discipline: formDiscipline,
      trade: formTrade,
      revision: formRevision,
      status: "SUBMITTED",
      isoClause: "ISO 9001:2015 Clause 8.1 & ISO 45001",
      scopeOfWork: formScope,
      sequenceOfOperations: formSequence,
      plantAndEquipment: formPlantList,
      materialsUsed: formMaterialList,
      qualityHoldPoints: formHoldPointsList,
      ramsHazardsAndControls: formRamsItems,
      linkedItpIds: formLinkedItpIds,
      linkedItpTitles: itpPlans
        .filter((itp) => formLinkedItpIds.includes(itp.id))
        .map((itp) => itp.title),
      crsItems: [],
      preparedBy: {
        name: currentUser?.fullName || "Project Engineer",
        role: currentUser?.role || "PROJECT_ENGINEER",
        designation: "Senior Project Engineer",
        date: new Date().toISOString(),
        signed: true,
      },
      revisionHistory: [
        {
          revision: formRevision,
          date: new Date().toISOString().split("T")[0],
          author: currentUser?.fullName || "Project Engineer",
          changeSummary: "Initial submittal for Consultant approval.",
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await dbService.saveMethodStatement(newMS);
      toast.success(`Method Statement ${newMS.msNumber} submitted successfully!`);
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (err) {
      console.error("Failed to create MS:", err);
      toast.error("Failed to save Method Statement.");
    }
  };

  const resetForm = () => {
    setFormNumber("");
    setFormTitle("");
    setFormScope("");
    setFormSequence("");
    setFormPlantList([]);
    setFormMaterialList([]);
    setFormHoldPointsList([]);
    setFormLinkedItpIds([]);
  };

  // Add CRS Comment Handler
  const handleAddCrsComment = async () => {
    if (!selectedMS || !newCrsComment.trim()) return;

    const newCommentItem: CRSReviewCommentItem = {
      id: `crs-${Date.now()}`,
      itemNumber: (selectedMS.crsItems?.length || 0) + 1,
      sectionReference: newCrsSection,
      consultantComment: newCrsComment.trim(),
      commentBy: `${currentUser?.fullName || "Consultant"} (Consulting Engineer)`,
      commentDate: new Date().toISOString(),
      status: "OPEN",
    };

    const updatedMS: MethodStatement = {
      ...selectedMS,
      crsItems: [...(selectedMS.crsItems || []), newCommentItem],
      status: "UNDER_REVIEW",
      updatedAt: Date.now(),
    };

    try {
      await dbService.saveMethodStatement(updatedMS);
      setSelectedMS(updatedMS);
      setNewCrsComment("");
      toast.success("Review comment added to CRS Sheet!");
      loadData();
    } catch (err) {
      console.error("Failed to add CRS comment:", err);
      toast.error("Could not add review comment.");
    }
  };

  // Contractor Reply to CRS Comment
  const handleReplyCrsComment = async (crsId: string) => {
    if (!selectedMS || !contractorReplyText.trim()) return;

    const updatedCrs = (selectedMS.crsItems || []).map((item) => {
      if (item.id === crsId) {
        return {
          ...item,
          contractorResponse: contractorReplyText.trim(),
          responseBy: currentUser?.fullName || "Project Engineer",
          responseDate: new Date().toISOString(),
          status: "RESOLVED" as const,
        };
      }
      return item;
    });

    const updatedMS: MethodStatement = {
      ...selectedMS,
      crsItems: updatedCrs,
      updatedAt: Date.now(),
    };

    try {
      await dbService.saveMethodStatement(updatedMS);
      setSelectedMS(updatedMS);
      setContractorReplyText("");
      setSelectedCrsItemId(null);
      toast.success("Response recorded on CRS Sheet!");
      loadData();
    } catch (err) {
      console.error("Failed to reply CRS comment:", err);
      toast.error("Could not record response.");
    }
  };

  // Consultant Formal Stamping Handler
  const handleStampReviewDecision = async () => {
    if (!selectedMS || !currentUser) return;
    setSigningInProgress(true);

    const nowIso = new Date().toISOString();
    const updatedMS: MethodStatement = {
      ...selectedMS,
      reviewCode: reviewCodeDecision,
      status: reviewCodeDecision === "Code A" ? "CODE_A" : reviewCodeDecision === "Code B" ? "CODE_B" : reviewCodeDecision === "Code C" ? "CODE_C" : "CODE_D",
      consultantSignOff: {
        name: currentUser.fullName || "Supervising Consultant",
        firm: "Supervising Consultant Consortium",
        date: nowIso,
        reviewCode: reviewCodeDecision,
        signed: true,
        stampNumber: stampNumber || `SPCE-STAMP-${Math.floor(1000 + Math.random() * 9000)}`,
        comments: consultantRemarks || REVIEW_CODE_CONFIG[reviewCodeDecision].desc,
        signatureUrl: signatureData || undefined,
      },
      updatedAt: Date.now(),
    };

    try {
      await dbService.saveMethodStatement(updatedMS);
      toast.success(`Stamped with ${reviewCodeDecision} successfully!`);
      setSelectedMS(updatedMS);
      setConsultantRemarks("");
      setSignatureData(null);
      loadData();
    } catch (err) {
      console.error("Stamp decision failed:", err);
      toast.error("Failed to apply consultant stamp.");
    } finally {
      setSigningInProgress(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FileText className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Method Statements & RAMS Review Workflow
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  ISO 9001:2015 Clause 8.1
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Formal work methodology submittals, RAMS risk assessment matrices, and Consultant Comment Resolution Sheets (CRS).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Method Statement</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Submittals</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {stats.total}
          </p>
          <p className="text-xs text-slate-500 mt-1">Across all trades</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Code A Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.codeA}
          </p>
          <p className="text-xs text-slate-500 mt-1">Unconditional release</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Code B (As Noted)</span>
            <FileCheck2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {stats.codeB}
          </p>
          <p className="text-xs text-slate-500 mt-1">Subject to remarks</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Under Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {stats.underReview}
          </p>
          <p className="text-xs text-slate-500 mt-1">CRS in progress</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Revise & Resubmit</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {stats.reviseCodeC}
          </p>
          <p className="text-xs text-slate-500 mt-1">Code C & D remarks</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Approval Rate</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.approvalRate}%
          </p>
          <p className="text-xs text-slate-500 mt-1">Quality benchmark</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search MS #, Title, Trade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Discipline */}
          <select
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
          >
            <option value="ALL">All Disciplines</option>
            {DISCIPLINES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Review Code */}
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
          >
            <option value="ALL">All Review Codes</option>
            <option value="Code A">Code A - Approved</option>
            <option value="Code B">Code B - Approved as Noted</option>
            <option value="Code C">Code C - Revise & Resubmit</option>
            <option value="Code D">Code D - Rejected</option>
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
          >
            <option value="ALL">All Workflow Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="CODE_A">Code A Approved</option>
            <option value="CODE_B">Code B Approved as Noted</option>
            <option value="CODE_C">Code C Revision Required</option>
          </select>
        </div>
      </div>

      {/* Method Statements Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Document # & Rev</th>
                <th className="px-4 py-3.5">Method Statement Title</th>
                <th className="px-4 py-3.5">Discipline & Trade</th>
                <th className="px-4 py-3.5">Linked ITP & PTP</th>
                <th className="px-4 py-3.5">CRS Comments</th>
                <th className="px-4 py-3.5">Consultant Review Code</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMS.map((ms) => {
                const codeConfig = ms.reviewCode ? REVIEW_CODE_CONFIG[ms.reviewCode] : null;
                const openCrsCount = (ms.crsItems || []).filter((c) => c.status === "OPEN").length;

                return (
                  <tr
                    key={ms.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedMS(ms);
                      setActiveDrawerTab("overview");
                    }}
                  >
                    <td className="px-5 py-4">
                      <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {ms.msNumber}
                      </div>
                      <span className="inline-block mt-0.5 text-[11px] px-2 py-0.5 rounded font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {ms.revision}
                      </span>
                    </td>

                    <td className="px-4 py-4 max-w-sm">
                      <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {ms.title}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {ms.scopeOfWork}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {ms.discipline}
                      </div>
                      <div className="text-xs text-slate-500">{ms.trade}</div>
                    </td>

                    <td className="px-4 py-4 text-xs">
                      {ms.linkedItpIds?.length > 0 ? (
                        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>{ms.linkedItpIds.length} Linked ITP(s)</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">No ITP Linked</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {ms.crsItems?.length > 0 ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            openCrsCount > 0
                              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300"
                              : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300"
                          }`}
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>
                            {openCrsCount > 0 ? `${openCrsCount} Open CRS` : "All Resolved"}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">No Comments</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {codeConfig ? (
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${codeConfig.badge} ${codeConfig.border}`}
                        >
                          {codeConfig.label}
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                          Pending Review
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMS(ms);
                          setActiveDrawerTab("overview");
                        }}
                        className="px-3 py-1.5 rounded-xl border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-xs font-medium"
                      >
                        Review & CRS →
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredMS.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No method statements found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NEW METHOD STATEMENT WIZARD */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-500/10 text-indigo-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Create Method Statement & RAMS Submittal
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMS} className="p-6 overflow-y-auto space-y-5">
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Document Ref #</label>
                  <input
                    type="text"
                    placeholder="e.g. MS-STR-002"
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Discipline</label>
                  <select
                    value={formDiscipline}
                    onChange={(e) => setFormDiscipline(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {DISCIPLINES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Revision</label>
                  <input
                    type="text"
                    value={formRevision}
                    onChange={(e) => setFormRevision(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  Method Statement Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Method Statement for High-Rise Core-Wall Jump-Form Concrete Works"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {/* Scope & Sequence */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  1. Scope of Work (Clause 8.1 Specification)
                </label>
                <textarea
                  rows={2}
                  placeholder="Summarize exact technical operations, structures covered, and engineering objectives..."
                  value={formScope}
                  onChange={(e) => setFormScope(e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  2. Step-by-Step Sequence of Operations
                </label>
                <textarea
                  rows={3}
                  placeholder="1. Pre-survey confirmation&#10;2. Formwork crane lifting&#10;3. Rebar cage fixing..."
                  value={formSequence}
                  onChange={(e) => setFormSequence(e.target.value)}
                  required
                  className="w-full mt-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {/* Linked ITPs */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">
                  3. Link Inspection & Test Plans (ITP)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {itpPlans.map((itp) => (
                    <label
                      key={itp.id}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <input
                        type="checkbox"
                        checked={formLinkedItpIds.includes(itp.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormLinkedItpIds([...formLinkedItpIds, itp.id]);
                          } else {
                            setFormLinkedItpIds(formLinkedItpIds.filter((id) => id !== itp.id));
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {itp.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Plant & Equipment + Quality Hold Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Plant & Equipment Required
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="e.g. 50-Ton Mobile Crane"
                      value={formPlantInput}
                      onChange={(e) => setFormPlantInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (formPlantInput.trim()) {
                          setFormPlantList([...formPlantList, formPlantInput.trim()]);
                          setFormPlantInput("");
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-xl"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formPlantList.map((p, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs flex items-center gap-1"
                      >
                        {p}
                        <button
                          type="button"
                          onClick={() => setFormPlantList(formPlantList.filter((_, i) => i !== idx))}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Quality Hold Points (Mandatory Witness)
                  </label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      placeholder="e.g. HP-01: Rebar tie inspection"
                      value={formHoldPointsInput}
                      onChange={(e) => setFormHoldPointsInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (formHoldPointsInput.trim()) {
                          setFormHoldPointsList([...formHoldPointsList, formHoldPointsInput.trim()]);
                          setFormHoldPointsInput("");
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-xl"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formHoldPointsList.map((hp, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1"
                      >
                        {hp}
                        <button
                          type="button"
                          onClick={() => setFormHoldPointsList(formHoldPointsList.filter((_, i) => i !== idx))}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-md shadow-indigo-600/20"
                >
                  Submit for Consultant Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER: METHOD STATEMENT REVIEW, RAMS & CRS */}
      {selectedMS && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedMS.msNumber} ({selectedMS.revision})
                  </span>
                  {selectedMS.reviewCode && (
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${REVIEW_CODE_CONFIG[selectedMS.reviewCode].badge} ${REVIEW_CODE_CONFIG[selectedMS.reviewCode].border}`}
                    >
                      {selectedMS.reviewCode}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {selectedMS.title}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrintDossier(true)}
                  className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedMS(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 bg-slate-50/30 overflow-x-auto no-scrollbar whitespace-nowrap">
              <button
                onClick={() => setActiveDrawerTab("overview")}
                className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition-all shrink-0 ${
                  activeDrawerTab === "overview"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                1. Methodology & Sequence
              </button>
              <button
                onClick={() => setActiveDrawerTab("rams")}
                className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition-all shrink-0 ${
                  activeDrawerTab === "rams"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                2. RAMS Risk Matrix ({selectedMS.ramsHazardsAndControls?.length || 0})
              </button>
              <button
                onClick={() => setActiveDrawerTab("crs")}
                className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition-all shrink-0 ${
                  activeDrawerTab === "crs"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                3. CRS Review Comments ({selectedMS.crsItems?.length || 0})
              </button>
              <button
                onClick={() => setActiveDrawerTab("signoff")}
                className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition-all shrink-0 ${
                  activeDrawerTab === "signoff"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                4. Consultant Stamp & Sign-Off
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* TAB 1: METHODOLOGY OVERVIEW */}
              {activeDrawerTab === "overview" && (
                <div className="space-y-6 text-sm">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Scope of Operations
                    </h3>
                    <p className="mt-1.5 text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl">
                      {selectedMS.scopeOfWork}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Step-by-Step Sequence of Operations
                    </h3>
                    <div className="mt-1.5 whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl font-mono text-xs">
                      {selectedMS.sequenceOfOperations}
                    </div>
                  </div>

                  {/* Hold Points & Plant */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500">
                        Quality Hold Points (Mandatory)
                      </h3>
                      <div className="space-y-1">
                        {selectedMS.qualityHoldPoints?.map((hp, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-lg text-xs font-medium text-rose-800 dark:text-rose-300"
                          >
                            {hp}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                        Plant & Specialized Equipment
                      </h3>
                      <div className="space-y-1">
                        {selectedMS.plantAndEquipment?.map((p, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-lg text-xs font-medium text-indigo-800 dark:text-indigo-300"
                          >
                            ✓ {p}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Linked ITPs */}
                  {selectedMS.linkedItpTitles && selectedMS.linkedItpTitles.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Linked Inspection & Test Plans (ITP)
                      </h3>
                      <div className="mt-2 space-y-1.5">
                        {selectedMS.linkedItpTitles.map((t, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-medium text-indigo-600 dark:text-indigo-400"
                          >
                            <LinkIcon className="w-4 h-4" />
                            <span>{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: RAMS RISK ASSESSMENT MATRIX */}
              {activeDrawerTab === "rams" && (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase">
                        <tr>
                          <th className="p-3">Activity Step</th>
                          <th className="p-3">Hazard Description</th>
                          <th className="p-3">Initial Risk</th>
                          <th className="p-3">Control Measures</th>
                          <th className="p-3">Residual</th>
                          <th className="p-3">In-Charge</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {selectedMS.ramsHazardsAndControls?.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-3 font-semibold text-slate-900 dark:text-white">
                              {item.activityStep}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">
                              {item.hazardDescription}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded font-bold ${
                                  item.initialRisk === "CRITICAL"
                                    ? "bg-rose-100 text-rose-800"
                                    : item.initialRisk === "HIGH"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {item.initialRisk}
                              </span>
                            </td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">
                              {item.controlMeasures}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                                {item.residualRisk}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 font-medium">
                              {item.responsiblePerson}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: COMMENT RESOLUTION SHEET (CRS) */}
              {activeDrawerTab === "crs" && (
                <div className="space-y-6">
                  {/* Add Consultant Comment */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase block">
                      Add Consultant Review Remark (CRS Entry)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 uppercase">
                          Section Reference
                        </label>
                        <input
                          type="text"
                          value={newCrsSection}
                          onChange={(e) => setNewCrsSection(e.target.value)}
                          className="w-full mt-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase">
                          Consultant Comment / Directive
                        </label>
                        <div className="flex gap-2 mt-1">
                          <input
                            type="text"
                            placeholder="Type engineering feedback or clarification needed..."
                            value={newCrsComment}
                            onChange={(e) => setNewCrsComment(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                          />
                          <button
                            type="button"
                            onClick={handleAddCrsComment}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl"
                          >
                            Post Comment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* List of CRS Entries */}
                  <div className="space-y-3">
                    {selectedMS.crsItems?.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            Item #{item.itemNumber} • {item.sectionReference}
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              item.status === "RESOLVED"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border-l-2 border-amber-500 rounded-r-lg text-xs">
                          <span className="text-slate-400 block">{item.commentBy}</span>
                          <p className="text-slate-800 dark:text-slate-200 font-medium mt-0.5">
                            {item.consultantComment}
                          </p>
                        </div>

                        {item.contractorResponse ? (
                          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border-l-2 border-blue-500 rounded-r-lg text-xs">
                            <span className="text-slate-400 block">
                              Contractor Response ({item.responseBy}):
                            </span>
                            <p className="text-slate-800 dark:text-slate-200 font-medium mt-0.5">
                              {item.contractorResponse}
                            </p>
                          </div>
                        ) : (
                          <div>
                            {selectedCrsItemId === item.id ? (
                              <div className="space-y-2 mt-2">
                                <textarea
                                  rows={2}
                                  placeholder="Contractor explanation or revision details..."
                                  value={contractorReplyText}
                                  onChange={(e) => setContractorReplyText(e.target.value)}
                                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setSelectedCrsItemId(null)}
                                    className="px-3 py-1 text-xs border rounded-lg"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleReplyCrsComment(item.id)}
                                    className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
                                  >
                                    Submit Response
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedCrsItemId(item.id);
                                  setContractorReplyText("");
                                }}
                                className="text-xs text-indigo-600 hover:underline font-semibold"
                              >
                                + Record Contractor Response
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {(!selectedMS.crsItems || selectedMS.crsItems.length === 0) && (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        No review comments recorded.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: CONSULTANT FORMAL STAMPING */}
              {activeDrawerTab === "signoff" && (
                <div className="space-y-6">
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase block tracking-wider">
                      Consultant Review Code Stamping
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      {(["Code A", "Code B", "Code C", "Code D"] as MethodStatementReviewCode[]).map((code) => {
                        const isSelected = reviewCodeDecision === code;
                        const cfg = REVIEW_CODE_CONFIG[code];

                        return (
                          <div
                            key={code}
                            onClick={() => setReviewCodeDecision(code)}
                            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm"
                                : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                            }`}
                          >
                            <span className="text-xs font-bold block">{cfg.label}</span>
                            <span className="text-[11px] text-slate-500 mt-1 block leading-tight">
                              {cfg.desc}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">
                        Supervising Consultant Remarks & Conditions
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Detailed engineering remarks or conditions for execution..."
                        value={consultantRemarks}
                        onChange={(e) => setConsultantRemarks(e.target.value)}
                        className="w-full mt-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-500 uppercase">
                        Consultant Official Stamp & Digital Signature
                      </span>
                      <SignaturePad label="Consultant Decision Stamp" onSave={setSignatureData} />
                    </div>

                    <button
                      onClick={handleStampReviewDecision}
                      disabled={signingInProgress}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
                    >
                      {signingInProgress ? "Applying Stamp..." : `Formally Stamp & Sign as ${reviewCodeDecision}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRINTABLE METHOD STATEMENT & RAMS DOSSIER */}
      {showPrintDossier && selectedMS && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Official Method Statement & RAMS Dossier
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowPrintDossier(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 text-slate-900 dark:text-white text-xs">
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <span className="uppercase font-bold tracking-widest text-slate-500">
                  APEX QUALITY ASSURANCE & SAFETY DOSSIER
                </span>
                <h1 className="text-xl font-black uppercase">
                  METHOD STATEMENT & RISK ASSESSMENT (RAMS)
                </h1>
                <p className="font-mono text-indigo-600 font-bold">
                  Doc Ref: {selectedMS.msNumber} • {selectedMS.revision}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 font-semibold block">PROJECT</span>
                  <span className="font-bold">{selectedMS.projectName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">DISCIPLINE</span>
                  <span className="font-bold">{selectedMS.discipline}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">TRADE</span>
                  <span className="font-bold">{selectedMS.trade}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">REVIEW CODE</span>
                  <span className="font-bold text-emerald-600">{selectedMS.reviewCode || "Code A"}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-1">
                  1. Scope of Work
                </h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg">
                  {selectedMS.scopeOfWork}
                </p>
              </div>

              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-1">
                  2. Sequence of Operations
                </h4>
                <div className="whitespace-pre-line text-slate-700 bg-slate-50 p-3 rounded-lg font-mono">
                  {selectedMS.sequenceOfOperations}
                </div>
              </div>

              <div>
                <h4 className="font-bold uppercase tracking-wider text-slate-400 mb-1">
                  3. RAMS Risk Assessment Matrix
                </h4>
                <table className="w-full text-left border">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2 border">Activity</th>
                      <th className="p-2 border">Hazard</th>
                      <th className="p-2 border">Initial Risk</th>
                      <th className="p-2 border">Control Measure</th>
                      <th className="p-2 border">Residual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMS.ramsHazardsAndControls?.map((r) => (
                      <tr key={r.id}>
                        <td className="p-2 border font-semibold">{r.activityStep}</td>
                        <td className="p-2 border">{r.hazardDescription}</td>
                        <td className="p-2 border font-bold">{r.initialRisk}</td>
                        <td className="p-2 border">{r.controlMeasures}</td>
                        <td className="p-2 border font-bold text-emerald-600">{r.residualRisk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Endorsements */}
              <div className="pt-4 border-t grid grid-cols-3 gap-3">
                <div className="p-3 border rounded-lg text-center">
                  <span className="text-slate-400 font-semibold block">Prepared By</span>
                  <p className="font-bold mt-1">{selectedMS.preparedBy?.name}</p>
                  <p className="text-[10px] text-emerald-600">✓ Signed</p>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <span className="text-slate-400 font-semibold block">QA/QC Reviewed</span>
                  <p className="font-bold mt-1">{selectedMS.qaqcReviewer?.name || "Engr. David Okon"}</p>
                  <p className="text-[10px] text-emerald-600">✓ Compliant</p>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <span className="text-slate-400 font-semibold block">Supervising Consultant</span>
                  <p className="font-bold mt-1">{selectedMS.consultantSignOff?.name || "Arch. Marcus Sterling"}</p>
                  <p className="text-[10px] text-emerald-600">✓ Stamped {selectedMS.reviewCode || "Code A"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
