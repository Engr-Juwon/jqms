import React, { useEffect, useState, useMemo } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  Link,
} from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService, sortByNewestFirst } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import { ROLE_TITLES } from "@/lib/permissions";
import { SignaturePad } from "@/components/common/SignaturePad";
import {
  SiteInstruction,
  SiteInstructionType,
  SiteInstructionSeverity,
  NonConformanceReport,
} from "@/types";
import { toast } from "react-hot-toast";
import {
  ShieldAlert,
  ArrowLeft,
  AlertOctagon,
  Flame,
  Plus,
  Trash2,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  FileWarning,
  Building2,
  Layers,
  MapPin,
  Save,
  Check,
  AlertTriangle,
  Briefcase,
  RefreshCw,
} from "lucide-react";
import {
  generateSiteInstructionNumber,
  getNextSiteInstructionSequence,
  type SiteInstructionFormat,
} from "@/lib/naming";
import TradeSubtradeSelect, {
  type TradeSelection,
} from "@/components/masterdata/TradeSubtradeSelect";
import LevelElementSelect, {
  type LevelElementSelection,
} from "@/components/masterdata/LevelElementSelect";

export const SiteInstructionCreate: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const ncrIdParam = searchParams.get("ncrId");

  const navigate = useNavigate();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();

  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";

  const canCreateSI = hasPermission(
    currentUser?.role,
    "CREATE_SITE_INSTRUCTION",
  );
  const canSignIssueSI = hasPermission(
    currentUser?.role,
    "SIGN_ISSUE_SITE_INSTRUCTION",
  );

  const [ncrs, setNcrs] = useState<NonConformanceReport[]>([]);
  const [selectedNcrId, setSelectedNcrId] = useState<string>(ncrIdParam || "");
  const [instructionNumber, setInstructionNumber] = useState("");
  const [existingSIs, setExistingSIs] = useState<SiteInstruction[]>([]);
  const [namingFormat, setNamingFormat] = useState<SiteInstructionFormat>(() =>
    activeProject?.code ? "PROJECT_YEAR_SEQ" : "YEAR_SEQ",
  );

  const computeNextInstructionNumber = (
    siList: SiteInstruction[],
    format: SiteInstructionFormat = namingFormat,
  ) => {
    const existingNums = siList.map((s) => s.instructionNumber).filter(Boolean);
    const prefix = company?.settings?.siteInstructionPrefix || "SI";
    const projectCode = activeProject?.code || "";
    const nextSeq = getNextSiteInstructionSequence(existingNums, {
      projectCode,
      prefix,
      year: new Date().getFullYear(),
    });
    return generateSiteInstructionNumber({
      projectCode,
      prefix,
      sequence: nextSeq,
      format,
    });
  };

  const isDuplicateNumber = useMemo(() => {
    if (!instructionNumber.trim()) return false;
    return existingSIs.some(
      (s) =>
        s.instructionNumber?.trim().toLowerCase() ===
        instructionNumber.trim().toLowerCase(),
    );
  }, [instructionNumber, existingSIs]);

  const [title, setTitle] = useState("");
  const [instructionType, setInstructionType] = useState<SiteInstructionType>(
    "OVERDUE_NCR_WARNING",
  );
  const [severity, setSeverity] = useState<SiteInstructionSeverity>("HIGH");

  // Recipient & Trade
  const [contractorName, setContractorName] = useState("");
  const [subcontractorName, setSubcontractorName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientRole, setRecipientRole] = useState("");
  const [tradeName, setTradeName] = useState("");

  const [tradeSelection, setTradeSelection] = useState<TradeSelection>({
    tradeId: "",
    tradeName: "",
    subtradeId: "",
    subtradeName: "",
  });

  const [levelSelection, setLevelSelection] = useState<LevelElementSelection>({
    levelId: "",
    levelName: "",
    elementId: "",
    elementName: "",
    gridLocation: "",
    elementType: "",
  });

  // Location & Element
  const [location, setLocation] = useState("");
  const [elementName, setElementName] = useState("");
  const [specReference, setSpecReference] = useState("");
  const [drawingNumber, setDrawingNumber] = useState("");

  // Instruction content
  const [subject, setSubject] = useState("");
  const [issueSummary, setIssueSummary] = useState("");
  const [instructionText, setInstructionText] = useState("");
  const [mandatoryActions, setMandatoryActions] = useState<string[]>([
    "Execute immediate rectification of outstanding defect in accordance with approved project quality specifications.",
    "Submit formal Remedial Method Statement (RMS) and materials submittals for review.",
    "Submit a Request for Inspection (RFI) to the Supervising Consultant upon complete physical rectification.",
  ]);
  const [newActionInput, setNewActionInput] = useState("");

  const [complianceDeadline, setComplianceDeadline] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );
  const [stopWorkOrdered, setStopWorkOrdered] = useState(false);
  const [contractualClause, setContractualClause] = useState(
    "ISO 9001:2015 Clause 8.7 (Nonconforming Outputs), Clause 10.2 (Corrective Action), and Contract Remedial Clauses",
  );

  // Single User Digital Signature & Signatory Designation
  const [signatureUrl, setSignatureUrl] = useState("");
  const [confirmedDeclaration, setConfirmedDeclaration] = useState(false);
  const [signerDesignation, setSignerDesignation] = useState<string>(() => {
    if (currentUser?.designation) return currentUser.designation;
    if (currentUser?.role && ROLE_TITLES[currentUser.role])
      return ROLE_TITLES[currentUser.role];
    return "QA/QC Engineer";
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.designation) {
        setSignerDesignation(currentUser.designation);
      } else if (currentUser.role && ROLE_TITLES[currentUser.role]) {
        setSignerDesignation(ROLE_TITLES[currentUser.role]);
      }
    }
  }, [currentUser]);

  // Load project NCRs & generate SI number
  useEffect(() => {
    const init = async () => {
      if (!currentProjId) return;

      const [ncrList, siList] = await Promise.all([
        dbService.getNCRs(currentProjId, currentCompId),
        dbService.getSiteInstructions(currentProjId, currentCompId),
      ]);

      setNcrs(sortByNewestFirst(ncrList));
      setExistingSIs(siList);

      // Auto-generate SI number
      const nextCount = (siList.length + 1).toString().padStart(3, "0");
      const year = new Date().getFullYear();
      setInstructionNumber(`SI-${year}-${nextCount}`);
      // Auto-generate formal SI number
      const preferredFmt: SiteInstructionFormat = activeProject?.code
        ? "PROJECT_YEAR_SEQ"
        : "YEAR_SEQ";
      setNamingFormat(preferredFmt);
      const generated = computeNextInstructionNumber(siList, preferredFmt);
      setInstructionNumber(generated);

      // Set default contractor name
      if (activeProject?.contractorName) {
        setContractorName(activeProject.contractorName);
      }
    };
    init();
  }, [currentProjId, currentCompId, activeProject]);

  // When NCR selection changes, auto-populate details
  useEffect(() => {
    if (!selectedNcrId || ncrs.length === 0) return;
    const targetNcr = ncrs.find((n) => n.id === selectedNcrId);
    if (!targetNcr) return;

    // Calculate days overdue
    let daysOverdue = 0;
    if (targetNcr.deadline) {
      const deadlineDate = new Date(targetNcr.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadlineDate < today) {
        const diffMs = today.getTime() - deadlineDate.getTime();
        daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }
    }

    const ncrNum = targetNcr.ncrNumber || "NCR";
    setTitle(
      daysOverdue > 0
        ? `Overdue Rectification Directive for ${ncrNum}`
        : `Site Quality Directive for ${ncrNum}`,
    );
    setSubject(
      daysOverdue > 0
        ? `FORMAL NOTICE OF DEFECT RECTIFICATION DEFAULT — ${ncrNum} (OVERDUE BY ${daysOverdue} DAYS)`
        : `QUALITY RECTIFICATION DIRECTIVE — ${ncrNum}`,
    );
    setInstructionType(
      daysOverdue > 0 ? "OVERDUE_NCR_WARNING" : "DEFECT_RECTIFICATION",
    );
    setSeverity(
      daysOverdue > 7
        ? "CRITICAL"
        : (targetNcr.severity as SiteInstructionSeverity) || "HIGH",
    );

    setIssueSummary(
      `Non-Conformance Report ${ncrNum} was raised on ${
        targetNcr.dateFound || targetNcr.createdAt
          ? new Date(
              targetNcr.dateFound || targetNcr.createdAt,
            ).toLocaleDateString("en-GB")
          : "record date"
      } with target resolution deadline of ${
        targetNcr.deadline
          ? new Date(targetNcr.deadline).toLocaleDateString("en-GB")
          : "the scheduled date"
      }.${
        daysOverdue > 0
          ? ` As of today, the rectification has exceeded the permitted remediation time by ${daysOverdue} calendar days without approved close-out.`
          : ""
      }\n\nDefect Details: ${targetNcr.description || targetNcr.title}`,
    );

    setInstructionText(
      `The Contractor is formally instructed to deploy adequate skilled workforce, certified materials, and approved remediation method statements to complete physical rectification of all non-conforming items identified in ${ncrNum} within the stipulated compliance deadline. Failure to rectify will result in third-party execution at Contractor's cost and withholding of inspection approvals.`,
    );

    setLocation(
      targetNcr.locationLevel ||
        targetNcr.levelName ||
        targetNcr.location ||
        "",
    );
    setElementName(targetNcr.elementName || "");
    setTradeName(targetNcr.trade || targetNcr.tradeName || "");
    const targetTrade = targetNcr.tradeName || targetNcr.trade || "";
    const targetSubtrade = targetNcr.subtradeName || targetNcr.subtrade || "";
    setTradeSelection({
      tradeId: targetNcr.tradeId || "",
      tradeName: targetTrade,
      subtradeId: targetNcr.subtradeId || "",
      subtradeName: targetSubtrade,
    });

    const targetLevel =
      targetNcr.locationLevel ||
      targetNcr.levelName ||
      targetNcr.location ||
      "";
    const targetElement = targetNcr.elementName || "";
    setLevelSelection({
      levelId: targetNcr.levelId || "",
      levelName: targetLevel,
      elementId: targetNcr.elementId || targetNcr.structuralElementId || "",
      elementName: targetElement,
      gridLocation: targetNcr.gridLine || targetNcr.gridAxis || "",
      elementType: targetNcr.elementType || "",
    });

    setLocation(targetLevel);
    setElementName(targetElement);
    setTradeName(targetTrade);
    setSpecReference(
      targetNcr.specReference || "BS EN 1992 / BS 8110 Quality Standards",
    );
    setDrawingNumber(targetNcr.drawingNumber || "");

    if (daysOverdue > 14) {
      setStopWorkOrdered(true);
      setSeverity("STOP_WORK");
    }
  }, [selectedNcrId, ncrs]);

  const handleAddAction = () => {
    if (!newActionInput.trim()) return;
    setMandatoryActions([...mandatoryActions, newActionInput.trim()]);
    setNewActionInput("");
  };

  const handleRemoveAction = (index: number) => {
    setMandatoryActions(mandatoryActions.filter((_, idx) => idx !== index));
  };

  const handleSave = async (isIssued: boolean) => {
    if (!canCreateSI) {
      toast.error("You do not have permission to draft Site Instructions");
      return;
    }
    if (isIssued && !canSignIssueSI) {
      toast.error(
        "You do not have permission to formally sign and issue Site Instructions",
      );
      return;
    }
    if (!instructionNumber.trim()) {
      toast.error("Instruction Number is required");
      return;
    }
    if (isDuplicateNumber) {
      toast.error(
        `Instruction reference "${instructionNumber}" is already in use on this project. Please change the sequence number to avoid duplicate records.`,
      );
      return;
    }
    if (!subject.trim()) {
      toast.error("Subject / Directive title is required");
      return;
    }
    if (isIssued && !signatureUrl && !currentUser?.uid) {
      toast.error(
        "A digital signature is required to formally issue this Site Instruction",
      );
      return;
    }
    if (isIssued && !confirmedDeclaration) {
      toast.error(
        "Please confirm the statutory compliance declaration checkbox",
      );
      return;
    }

    setSaving(true);
    try {
      const selectedNcr = ncrs.find((n) => n.id === selectedNcrId);
      let calculatedDaysOverdue = 0;
      if (selectedNcr?.deadline) {
        const deadlineDate = new Date(selectedNcr.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (deadlineDate < today) {
          calculatedDaysOverdue = Math.max(
            1,
            Math.floor(
              (today.getTime() - deadlineDate.getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          );
        }
      }

      const siId = `si_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const nowIso = new Date().toISOString();

      const newSI: SiteInstruction = {
        id: siId,
        instructionNumber,
        title: title || subject,
        type: instructionType,
        severity,
        status: isIssued ? "ISSUED" : "DRAFT",

        projectId: currentProjId,
        projectName: activeProject?.name || "Civil Project",
        projectAddress: activeProject?.address || activeProject?.location || "",
        companyId: currentCompId,
        companyName: company?.name || "JQMS Quality Systems",

        contractorName:
          contractorName || activeProject?.contractorName || "Main Contractor",
        subcontractorName: subcontractorName || undefined,
        recipientName: recipientName || undefined,
        recipientRole: recipientRole || undefined,

        ncrId: selectedNcr?.id || undefined,
        ncrNumber: selectedNcr?.ncrNumber || undefined,
        ncrTitle: selectedNcr?.title || undefined,
        ncrSeverity: selectedNcr?.severity || undefined,
        ncrCategory: selectedNcr?.category || undefined,
        ncrDeadline: selectedNcr?.deadline || undefined,
        ncrDaysOverdue: calculatedDaysOverdue || undefined,

        location: levelSelection.levelName || location || undefined,
        levelId: levelSelection.levelId || undefined,
        levelName: levelSelection.levelName || location || undefined,
        elementId: levelSelection.elementId || undefined,
        elementName: levelSelection.elementName || elementName || undefined,
        trade: tradeSelection.tradeName || tradeName || undefined,
        tradeId: tradeSelection.tradeId || undefined,
        tradeName: tradeSelection.tradeName || tradeName || undefined,
        subtrade: tradeSelection.subtradeName || undefined,
        subtradeId: tradeSelection.subtradeId || undefined,
        subtradeName: tradeSelection.subtradeName || undefined,
        specReference: specReference || undefined,
        drawingNumber: drawingNumber || undefined,

        subject,
        issueSummary,
        contractualClause,
        instructionText,
        mandatoryActions,
        complianceDeadline,
        stopWorkOrdered,

        signedBy: {
          uid: currentUser?.uid || "user-local",
          name: currentUser?.fullName || "Authorized Quality Engineer",
          role:
            signerDesignation.trim() ||
            (currentUser?.role
              ? ROLE_TITLES[currentUser.role]
              : "QA/QC Engineer"),
          designation:
            signerDesignation.trim() ||
            (currentUser?.role
              ? ROLE_TITLES[currentUser.role]
              : "QA/QC Engineer"),
          company:
            company?.name ||
            activeProject?.companyName ||
            "Quality Management Authority",
          email: currentUser?.email || undefined,
          signedAt: nowIso,
          signatureUrl: signatureUrl || undefined,
          digitalSignatureStamp: `JQMS-SI-${Date.now().toString(36).toUpperCase()}`,
          declaration:
            "I hereby confirm that this Site Instruction is formally issued in accordance with the Quality Assurance & Control procedures of this contract.",
        },

        createdAt: nowIso,
        createdBy: currentUser?.uid || "user-local",
        updatedAt: nowIso,
      };

      await dbService.saveSiteInstruction(newSI);

      if (currentUser) {
        await writeAudit({
          projectId: currentProjId,
          companyId: currentCompId,
          userId: currentUser.uid,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          action: isIssued
            ? "ISSUE_SITE_INSTRUCTION"
            : "DRAFT_SITE_INSTRUCTION",
          module: "SITE_INSTRUCTION",
          details: `Issued Site Instruction ${instructionNumber}: "${subject}"${
            selectedNcr ? ` (Linked to ${selectedNcr.ncrNumber})` : ""
          }`,
        });
      }

      toast.success(
        isIssued
          ? `Site Instruction ${instructionNumber} formally issued & signed!`
          : `Draft ${instructionNumber} saved.`,
      );

      navigate(
        currentProjId
          ? `/project/${currentProjId}/site-instructions/${newSI.id}`
          : `/project/site-instructions/${newSI.id}`,
      );
    } catch (e) {
      console.error("Save SI error:", e);
      toast.error("Failed to save Site Instruction");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 -mt-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-mono text-xs uppercase tracking-wider mb-0.5">
              <ShieldAlert className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>ISO 9001:2015 Clause 8.7 & 10.2 Statutory Directive</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Issue Formal Site Instruction
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={saving || !canCreateSI}
            title={
              !canCreateSI
                ? "Level 4 authority required to draft Site Instructions"
                : undefined
            }
            onClick={() => handleSave(false)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={saving || !canSignIssueSI}
            title={
              !canSignIssueSI
                ? "Level 4 authority required to formally issue Site Instructions"
                : undefined
            }
            onClick={() => handleSave(true)}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/20 transition active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Sign & Formally Issue</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quality Governance & Operational Demarcation Notice */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800/80 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl p-4 shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <p className="font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                Operational Demarcation Notice
              </p>
              <p className="text-blue-800/90 dark:text-slate-300 leading-relaxed">
                <strong>QA/QC Mandate:</strong> Quality instructions are issued
                as statutory audit directives and compliance hold points.
                <strong> Production Mandate:</strong> Physical execution, labor
                mobilization, material supply, method statement implementation,
                and repair management remain strictly under{" "}
                <strong>
                  Construction Management & Production Site Engineers
                </strong>
                .
              </p>
            </div>
          </div>

          {/* Card 1: Reference & Category */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <FileWarning className="w-4 h-4 text-orange-500" />
              <span>1. Directive Particulars & NCR Cross-Reference</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Instruction Reference #
                </label>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Instruction Reference #
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={namingFormat}
                      onChange={(e) => {
                        const newFmt = e.target.value as SiteInstructionFormat;
                        setNamingFormat(newFmt);
                        const nextGen = computeNextInstructionNumber(
                          existingSIs,
                          newFmt,
                        );
                        setInstructionNumber(nextGen);
                      }}
                      className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 outline-none font-medium cursor-pointer"
                      title="Naming pattern format"
                    >
                      <option value="PROJECT_YEAR_SEQ">
                        {activeProject?.code
                          ? `${activeProject.code}-SI-2026-001`
                          : "SI-2026-001"}
                      </option>
                      {activeProject?.code && (
                        <option value="PROJECT_SEQ">
                          {activeProject.code}-SI-001
                        </option>
                      )}
                      <option value="YEAR_SEQ">SI-2026-001</option>
                      <option value="SIMPLE_SEQ">SI-001</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const nextGen = computeNextInstructionNumber(
                          existingSIs,
                          namingFormat,
                        );
                        setInstructionNumber(nextGen);
                        toast.success(
                          "Recalculated next instruction reference",
                        );
                      }}
                      className="p-1 text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 rounded transition"
                      title="Re-calculate next sequential reference"
                    >
                      <RefreshCw size={12} />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={instructionNumber}
                  onChange={(e) => setInstructionNumber(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold bg-slate-50 dark:bg-slate-950 border ${
                    isDuplicateNumber
                      ? "border-red-500 dark:border-red-500 text-red-600 dark:text-red-400 focus:border-red-600"
                      : "border-slate-200 dark:border-slate-700 text-orange-600 dark:text-orange-400 focus:border-orange-500"
                  } focus:outline-none`}
                />
                {isDuplicateNumber ? (
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} /> Reference is already used by
                    another Site Instruction on this project.
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Standard sequential reference • Editable prior to formal
                    issuance
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Directive Category
                </label>
                <select
                  value={instructionType}
                  onChange={(e) =>
                    setInstructionType(e.target.value as SiteInstructionType)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 font-semibold"
                >
                  <option value="OVERDUE_NCR_WARNING">
                    ⚠️ Overdue NCR Rectification Warning
                  </option>
                  <option value="DEFECT_RECTIFICATION">
                    Defect Rectification Directive
                  </option>
                  <option value="QUALITY_DIRECTIVE">
                    General Quality Directive
                  </option>
                  <option value="WORK_STOPPAGE">
                    🛑 Immediate Work Stoppage Order
                  </option>
                  <option value="TESTING_ORDER">
                    Special Testing / Verification Order
                  </option>
                </select>
              </div>
            </div>

            {/* NCR Link Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Link to Non-Conformance Report (NCR)
              </label>
              <select
                value={selectedNcrId}
                onChange={(e) => setSelectedNcrId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 font-mono"
              >
                <option value="">
                  -- No Linked NCR (Standalone Site Directive) --
                </option>
                {ncrs.map((ncr) => {
                  let overdueTag = "";
                  if (ncr.deadline) {
                    const dl = new Date(ncr.deadline);
                    const td = new Date();
                    td.setHours(0, 0, 0, 0);
                    if (dl < td && ncr.status !== "CLOSED") {
                      const days = Math.floor(
                        (td.getTime() - dl.getTime()) / (1000 * 60 * 60 * 24),
                      );
                      overdueTag = ` [⚠️ OVERDUE by ${days}d]`;
                    }
                  }
                  return (
                    <option key={ncr.id} value={ncr.id}>
                      {ncr.ncrNumber || "NCR"} — {ncr.title || "Defect"} (
                      {ncr.status}){overdueTag}
                    </option>
                  );
                })}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Selecting an NCR auto-populates location, trade, defect
                background, and severity.
              </p>
            </div>

            {/* Severity & Stop Work Checkbox */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Directive Severity Level
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        "LOW",
                        "MEDIUM",
                        "HIGH",
                        "CRITICAL",
                        "STOP_WORK",
                      ] as SiteInstructionSeverity[]
                    ).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setSeverity(s);
                          if (s === "STOP_WORK") setStopWorkOrdered(true);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                          severity === s
                            ? s === "STOP_WORK" || s === "CRITICAL"
                              ? "bg-red-600 border-red-500 text-white"
                              : s === "HIGH"
                                ? "bg-amber-600 border-amber-500 text-white"
                                : "bg-blue-600 border-blue-500 text-white"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {s.replace(/_/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 sm:pt-0">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stopWorkOrdered}
                      onChange={(e) => {
                        setStopWorkOrdered(e.target.checked);
                        if (e.target.checked) setSeverity("STOP_WORK");
                      }}
                      className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <span className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wide">
                      Order Immediate Work Stoppage
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Recipient & Location */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-500" />
              <span>2. Contractor & Structural Location</span>
              <span>2. Contractor, Trade & Structural Location</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Main Contractor
                </label>
                <input
                  type="text"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  placeholder="e.g. Apex Civil Contractors Ltd"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subcontractor (Optional)
                </label>
                <input
                  type="text"
                  value={subcontractorName}
                  onChange={(e) => setSubcontractorName(e.target.value)}
                  placeholder="e.g. Steel Rebar Trade Specialists"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Attention / Site Representative
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Project Manager / Quality Lead"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Representative Role / Title
                </label>
                <input
                  type="text"
                  value={recipientRole}
                  onChange={(e) => setRecipientRole(e.target.value)}
                  placeholder="e.g. Project Director / Site Supervisor"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Master Data Selectors: Level & Element + Trade & Subtrade */}
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MapPin size={14} className="text-orange-500" />
                  Building Floor Level & Structural Element
                </h3>
                <LevelElementSelect
                  projectId={currentProjId}
                  companyId={currentCompId}
                  value={levelSelection}
                  onChange={(sel) => {
                    setLevelSelection(sel);
                    setLocation(sel.levelName);
                    setElementName(sel.elementName);
                  }}
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Briefcase size={14} className="text-orange-500" />
                  Trade Discipline & Subtrade Sector
                </h3>
                <TradeSubtradeSelect
                  companyId={currentCompId}
                  value={tradeSelection}
                  onChange={(sel) => {
                    setTradeSelection(sel);
                    setTradeName(sel.tradeName);
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Specification Clause / Standard Ref
                </label>
                <input
                  type="text"
                  value={specReference}
                  onChange={(e) => setSpecReference(e.target.value)}
                  placeholder="e.g. BS 8110 Cl 3.4 / BS EN 1992"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Applicable Drawing Number
                </label>
                <input
                  type="text"
                  value={drawingNumber}
                  onChange={(e) => setDrawingNumber(e.target.value)}
                  placeholder="e.g. S-102 Rev C"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Directive Body & Mandatory Actions */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-500" />
              <span>
                3. Instruction Directive & Mandatory Corrective Actions
              </span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subject / Directive Heading *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. FORMAL NOTICE OF DEFECT RECTIFICATION DEFAULT"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Background Non-Conformance & Defect Summary
              </label>
              <textarea
                rows={3}
                value={issueSummary}
                onChange={(e) => setIssueSummary(e.target.value)}
                placeholder="Describe the defect, root cause, and non-compliance context..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 leading-relaxed font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Specific Quality Directive Text
              </label>
              <textarea
                rows={3}
                value={instructionText}
                onChange={(e) => setInstructionText(e.target.value)}
                placeholder="State the formal instructions, engineering mandates, and consequences..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 leading-relaxed"
              />
            </div>

            {/* Mandatory Actions List */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Itemized Mandatory Action Directives
              </label>
              <div className="space-y-2 mb-3">
                {mandatoryActions.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono font-bold text-orange-600 dark:text-orange-400 mt-0.5">
                        {idx + 1}.0
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">
                        {action}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAction(idx)}
                      className="text-slate-400 hover:text-red-500 transition p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newActionInput}
                  onChange={(e) => setNewActionInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), handleAddAction())
                  }
                  placeholder="Add specific action item requirement..."
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleAddAction}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Compliance Deadline & Clauses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Compliance Due Date *
                </label>
                <input
                  type="date"
                  value={complianceDeadline}
                  onChange={(e) => setComplianceDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Governing Quality & Contract Clause
                </label>
                <input
                  type="text"
                  value={contractualClause}
                  onChange={(e) => setContractualClause(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Single-User Signature & Issuer Endorsement */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5 sticky top-24">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-orange-500" />
              <span>4. Authorized Issuer Digital Sign-Off</span>
            </h2>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              As a formal Site Instruction, this directive is signed
              unilaterally by the logged-in quality or resident engineering
              authority.
            </p>

            {/* User Profile Summary & Signatory Designation */}
            <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 space-y-3 text-xs">
              <div className="text-[10px] font-mono uppercase font-bold text-orange-600 dark:text-orange-400">
                Signing Authority Details:
              </div>
              <div className="font-bold text-slate-900 dark:text-white">
                {currentUser?.fullName || "Site Quality Authority"}
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Your Signatory Designation / Official Title *
                </label>
                <input
                  type="text"
                  required
                  value={signerDesignation}
                  onChange={(e) => setSignerDesignation(e.target.value)}
                  placeholder="e.g. QA/QC Engineer, Resident Engineer, Senior Structural Lead"
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Enter your exact professional designation to be printed on
                  this directive.
                </span>
              </div>

              <div className="text-[11px] text-slate-500">
                Organization: {company?.name || "Quality Management Authority"}
              </div>
            </div>

            {/* Signature Pad */}
            <div className="space-y-2">
              <SignaturePad
                label="Digital Signature Canvas"
                onSave={(dataUrl) => setSignatureUrl(dataUrl)}
                initialValue={signatureUrl}
              />
            </div>

            {/* Mandatory Confirmation Checkbox */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={confirmedDeclaration}
                  onChange={(e) => setConfirmedDeclaration(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                />
                <span className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  I certify that I am the authorized quality / site authority
                  logged in, and that this Site Instruction is formally issued
                  under contract conditions.
                </span>
              </label>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              disabled={saving || !canSignIssueSI}
              title={
                !canSignIssueSI
                  ? "Level 4 authority required to formally issue Site Instructions"
                  : undefined
              }
              onClick={() => handleSave(true)}
              className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black shadow-xl shadow-orange-600/30 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? "Issuing..." : "Sign & Formally Issue Now"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteInstructionCreate;
