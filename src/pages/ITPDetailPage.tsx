import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { ITPPlan, ITPItem, ITPControlGate, ITPStatus } from "@/types";
import {
  exportITPPlanPDF,
  printITPPlan,
  exportITPPlanCSV,
} from "@/services/pdf/itpReport";
import {
  ClipboardList,
  ArrowLeft,
  Plus,
  FileDown,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertOctagon,
  ShieldCheck,
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  Layers,
  FileText,
  X,
  Clock,
  Sparkles,
  Award,
} from "lucide-react";
import { toast } from "react-hot-toast";

export const ITPDetailPage: React.FC = () => {
  const { projectId, id } = useParams<{ projectId: string; id: string }>();
  const navigate = useNavigate();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentProjId = projectId || activeProject?.id || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";

  const [plan, setPlan] = useState<ITPPlan | null>(null);
  const [loading, setLoading] = useState(true);

  // Matrix Filter State
  const [selectedGateFilter, setSelectedGateFilter] = useState<
    "ALL" | "H" | "W" | "R" | "S"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit / Add Item Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ITPItem | null>(null);

  // Form Fields
  const [formItemNo, setFormItemNo] = useState("");
  const [formStage, setFormStage] = useState("");
  const [formParameter, setFormParameter] = useState("");
  const [formStandard, setFormStandard] = useState("");
  const [formCriteria, setFormCriteria] = useState("");
  const [formGate, setFormGate] = useState<ITPControlGate>("H");
  const [formParty, setFormParty] = useState("QA/QC Engineer, Client Consultant");
  const [formFrequency, setFormFrequency] = useState("100% prior to pour authorization");
  const [formRecord, setFormRecord] = useState("WIR / RFI");
  const [formRemarks, setFormRemarks] = useState("");

  // Load ITP Plan
  const loadPlan = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // First try direct fetch
      let found = await dbService.getITPPlanById(id);
      if (!found) {
        // Look up in project list
        const list = await dbService.getITPPlans(currentProjId, currentCompId);
        found = list.find((p) => p.id === id) || null;
      }
      setPlan(found);
    } catch (err) {
      console.error("Error loading ITP plan:", err);
      toast.error("Failed to load ITP plan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlan();
  }, [id, currentProjId, currentCompId]);

  // Registry URL
  const registryUrl = projectId
    ? `/project/${projectId}/itp`
    : `/project/itp`;

  // Gate summary counts
  const gateCounts = useMemo(() => {
    if (!plan) return { H: 0, W: 0, R: 0, S: 0, total: 0 };
    const items = plan.items || [];
    return {
      H: items.filter((i) => i.controlGate === "H").length,
      W: items.filter((i) => i.controlGate === "W").length,
      R: items.filter((i) => i.controlGate === "R").length,
      S: items.filter((i) => i.controlGate === "S").length,
      total: items.length,
    };
  }, [plan]);

  // Filtered Matrix Rows
  const filteredItems = useMemo(() => {
    if (!plan) return [];
    return (plan.items || []).filter((item) => {
      const matchGate =
        selectedGateFilter === "ALL" || item.controlGate === selectedGateFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.itemNo.toLowerCase().includes(q) ||
        item.activityStage.toLowerCase().includes(q) ||
        item.itemParameter.toLowerCase().includes(q) ||
        item.referenceStandard.toLowerCase().includes(q) ||
        item.acceptanceCriteria.toLowerCase().includes(q) ||
        item.responsibleParty.toLowerCase().includes(q);

      return matchGate && matchSearch;
    });
  }, [plan, selectedGateFilter, searchQuery]);

  // Open Modal for New Item
  const handleOpenAddItem = () => {
    setEditingItem(null);
    const nextNo = plan
      ? `${(plan.items || []).length + 1}.0`
      : "1.0";
    setFormItemNo(nextNo);
    setFormStage("");
    setFormParameter("");
    setFormStandard("Project Specifications");
    setFormCriteria("");
    setFormGate("H");
    setFormParty("QA/QC Engineer, Client Consultant");
    setFormFrequency("100% prior to pour authorization");
    setFormRecord("WIR / RFI");
    setFormRemarks("");
    setShowItemModal(true);
  };

  // Open Modal for Editing Item
  const handleOpenEditItem = (item: ITPItem) => {
    setEditingItem(item);
    setFormItemNo(item.itemNo);
    setFormStage(item.activityStage);
    setFormParameter(item.itemParameter);
    setFormStandard(item.referenceStandard);
    setFormCriteria(item.acceptanceCriteria);
    setFormGate(item.controlGate);
    setFormParty(item.responsibleParty);
    setFormFrequency(item.frequency || "");
    setFormRecord(item.verifiableRecord || "WIR / RFI");
    setFormRemarks(item.remarks || "");
    setShowItemModal(true);
  };

  // Save Item (Add or Update)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;

    const itemData: ITPItem = {
      id: editingItem ? editingItem.id : `item-${Date.now()}`,
      itemNo: formItemNo.trim() || "1.0",
      activityStage: formStage.trim() || "General Inspection",
      itemParameter: formParameter.trim() || "Specification Check",
      referenceStandard: formStandard.trim() || "Project Specs",
      acceptanceCriteria: formCriteria.trim() || "Approved Specifications",
      controlGate: formGate,
      responsibleParty: formParty.trim() || "QA/QC Engineer",
      frequency: formFrequency.trim() || undefined,
      verifiableRecord: formRecord.trim() || "WIR / RFI",
      remarks: formRemarks.trim() || undefined,
      isCompleted: editingItem ? editingItem.isCompleted : false,
      subcontractorGate: formGate,
      contractorQaGate: formGate,
      consultantGate: formGate === "S" ? "S" : "H",
    };

    let updatedItems: ITPItem[];
    if (editingItem) {
      updatedItems = (plan.items || []).map((i) =>
        i.id === editingItem.id ? itemData : i,
      );
    } else {
      updatedItems = [...(plan.items || []), itemData];
    }

    const updatedPlan: ITPPlan = {
      ...plan,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };

    try {
      await dbService.saveITPPlan(updatedPlan);
      setPlan(updatedPlan);
      toast.success(editingItem ? "Updated inspection item!" : "Added new inspection item!");
      setShowItemModal(false);
    } catch (err) {
      console.error("Error saving ITP item:", err);
      toast.error("Failed to save inspection item.");
    }
  };

  // Delete Item
  const handleDeleteItem = async (itemId: string) => {
    if (!plan) return;
    if (!window.confirm("Are you sure you want to remove this inspection parameter?")) {
      return;
    }

    const updatedItems = (plan.items || []).filter((i) => i.id !== itemId);
    const updatedPlan: ITPPlan = {
      ...plan,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };

    try {
      await dbService.saveITPPlan(updatedPlan);
      setPlan(updatedPlan);
      toast.success("Removed inspection item.");
    } catch (err) {
      console.error("Error deleting item:", err);
      toast.error("Failed to remove item.");
    }
  };

  // Approve Plan
  const handleApprovePlan = async () => {
    if (!plan) return;
    const isApproved = plan.status === "APPROVED";
    const nextStatus: ITPStatus = isApproved ? "UNDER_REVIEW" : "APPROVED";

    const updated: ITPPlan = {
      ...plan,
      status: nextStatus,
      approvedBy: isApproved
        ? undefined
        : `${currentUser?.fullName || "Structural Engineer of Record"} (Approved via QMS)`,
      approvedByDate: isApproved ? undefined : new Date().toLocaleDateString("en-GB"),
      updatedAt: new Date().toISOString(),
    };

    try {
      await dbService.saveITPPlan(updated);
      setPlan(updated);
      toast.success(
        nextStatus === "APPROVED"
          ? "ITP Matrix approved and stamped for execution!"
          : "ITP Matrix status moved to Under Review.",
      );
    } catch (err) {
      console.error("Error updating plan status:", err);
      toast.error("Failed to update status.");
    }
  };

  // Raise WIR / RFI action from a matrix item
  const handleRaiseRFI = (item: ITPItem) => {
    if (!plan) return;
    // Navigate to RFI creation with prefilled query state
    const rfiTitle = `[${plan.itpNumber} - Item ${item.itemNo}] ${item.itemParameter}`;
    const rfiSpec = item.referenceStandard;
    const rfiCriteria = item.acceptanceCriteria;

    // Use router state or search params
    navigate(
      projectId ? `/project/${projectId}/rfi/create` : `/project/rfi/create`,
      {
        state: {
          prefill: {
            title: rfiTitle,
            specificationClause: rfiSpec,
            drawingReference: plan.methodStatementRef || "IFC Drawing",
            question: `Verification of ${item.activityStage} - ${item.itemParameter}.\nAcceptance Criteria: ${rfiCriteria}\nControlling Document: ${item.verifiableRecord || "WIR"}`,
          },
        },
      },
    );
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm font-semibold">Loading ITP Matrix...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-16 text-center text-slate-400 max-w-md mx-auto">
        <AlertOctagon className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          ITP Plan Not Found
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          The requested Inspection & Test Plan does not exist or has been removed.
        </p>
        <Link
          to={registryUrl}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to ITP Registry
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1700px] mx-auto space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to={registryUrl}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to ITP Registry
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              exportITPPlanPDF(
                plan,
                activeProject || undefined,
                company || undefined,
              )
            }
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            Export Official PDF
          </button>

          <button
            onClick={() =>
              printITPPlan(
                plan,
                activeProject || undefined,
                company || undefined,
              )
            }
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Preview
          </button>

          <button
            onClick={() => exportITPPlanCSV(plan)}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            CSV Export
          </button>

          <button
            onClick={handleOpenAddItem}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Add Inspection Item
          </button>

          <button
            onClick={handleApprovePlan}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              plan.status === "APPROVED"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {plan.status === "APPROVED" ? "Approved & Active" : "Sign & Approve ITP"}
          </button>
        </div>
      </div>

      {/* Header Document Control Banner Matching CD-QP-001 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Navy Header Block */}
        <div className="bg-slate-900 text-white p-5 border-b-2 border-amber-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-slate-950 uppercase tracking-wide">
                {plan.docCode || "CD-QP-001"}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {plan.revision || "REV. 01"}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Ref: <strong>{plan.itpNumber}</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {plan.title}
            </h2>
            <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-3">
              <span>Discipline: <strong>{plan.discipline}</strong></span>
              <span>&bull;</span>
              <span>Spec Clause: <strong>{plan.specSection || "Project Specifications"}</strong></span>
            </div>
          </div>

          <div className="text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
            <div className="text-sm font-black text-white flex items-center md:justify-end gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {company?.name || plan.companyName || "Quality Assurance Department"}
            </div>
            {(company?.address || plan.officeAddress) && (
              <div className="text-[11px] text-slate-400 mt-0.5">
                {company?.address || plan.officeAddress}
              </div>
            )}
            {(company?.email || plan.contactEmail || company?.phone || plan.contactPhone) && (
              <div className="text-[11px] text-amber-400 font-mono mt-0.5">
                {[company?.email || plan.contactEmail, company?.phone || plan.contactPhone].filter(Boolean).join(" • ")}
              </div>
            )}
          </div>
        </div>

        {/* Traceability Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 dark:divide-slate-700 text-xs bg-slate-50/50 dark:bg-slate-900/40">
          <div className="p-4">
            <div className="text-[10px] font-bold uppercase text-slate-400">Method Statement Link</div>
            <div className="font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              {plan.methodStatementRef || "WMS-CIV-001"}
            </div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">
              {plan.methodStatementTitle || "Approved Methodology"}
            </div>
          </div>

          <div className="p-4">
            <div className="text-[10px] font-bold uppercase text-slate-400">Project / Location</div>
            <div className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">
              {plan.projectName || activeProject?.name || "Active Project Site"}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Structural QA/QC Work Package
            </div>
          </div>

          <div className="p-4">
            <div className="text-[10px] font-bold uppercase text-slate-400">QA Sign-Off Authority</div>
            <div className="font-bold text-slate-900 dark:text-white mt-0.5">
              {plan.preparedBy || "Oladejo Jesujuwon"}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {plan.preparedByTitle || "QA/QC Engineer"} &bull; {plan.preparedByDate || "18-08-2026"}
            </div>
          </div>

          <div className="p-4">
            <div className="text-[10px] font-bold uppercase text-slate-400">Approval Status</div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                  plan.status === "APPROVED"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : plan.status === "UNDER_REVIEW"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {plan.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Gate Interactive Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Gate Pill Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedGateFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedGateFilter === "ALL"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            All Items ({gateCounts.total})
          </button>

          <button
            onClick={() => setSelectedGateFilter("H")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedGateFilter === "H"
                ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-100 border border-red-200 dark:border-red-900/40"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Hold Points - [H] ({gateCounts.H})
          </button>

          <button
            onClick={() => setSelectedGateFilter("W")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedGateFilter === "W"
                ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                : "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-900/40"
            }`}
          >
            Witness - [W] ({gateCounts.W})
          </button>

          <button
            onClick={() => setSelectedGateFilter("R")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedGateFilter === "R"
                ? "bg-slate-700 text-white shadow-md shadow-slate-700/20"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-600"
            }`}
          >
            Review / Lab - [R] ({gateCounts.R})
          </button>

          <button
            onClick={() => setSelectedGateFilter("S")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedGateFilter === "S"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-900/40"
            }`}
          >
            Surveillance - [S] ({gateCounts.S})
          </button>
        </div>

        {/* Live Matrix Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search parameter, standard..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Main Interactive ITP Matrix Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wide">
                <th className="py-3 px-3 w-12 text-center">S/N</th>
                <th className="py-3 px-3.5 w-44">Activity / Stage</th>
                <th className="py-3 px-4 min-w-[200px]">Inspection Item / Parameter</th>
                <th className="py-3 px-3.5 min-w-[150px]">Reference Standard / Spec</th>
                <th className="py-3 px-4 min-w-[260px]">Acceptance Criteria</th>
                <th className="py-3 px-3 w-20 text-center">Gate</th>
                <th className="py-3 px-3.5 min-w-[170px]">Responsible Party</th>
                <th className="py-3 px-3.5 min-w-[140px]">Controlling Record</th>
                <th className="py-3 px-3.5 text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-700/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No inspection parameters match the selected control gate or search.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const gate = item.controlGate;
                  const isHold = gate === "H";
                  const isWitness = gate === "W";
                  const isReview = gate === "R";
                  const isSurveillance = gate === "S";

                  return (
                    <tr
                      key={item.id || idx}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-750 transition ${
                        isHold ? "bg-red-50/20 dark:bg-red-950/10" : ""
                      }`}
                    >
                      {/* S/N */}
                      <td className="py-3.5 px-3 text-center font-bold font-mono text-slate-500">
                        {item.itemNo || idx + 1}
                      </td>

                      {/* Stage */}
                      <td className="py-3.5 px-3.5 font-bold text-slate-900 dark:text-white">
                        {item.activityStage}
                      </td>

                      {/* Parameter */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {item.itemParameter}
                        {item.remarks && (
                          <div className="text-[10px] font-normal text-amber-600 dark:text-amber-400 mt-0.5 italic">
                            Note: {item.remarks}
                          </div>
                        )}
                      </td>

                      {/* Reference Standard */}
                      <td className="py-3.5 px-3.5 font-bold text-blue-600 dark:text-blue-400">
                        {item.referenceStandard}
                      </td>

                      {/* Acceptance Criteria */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                        {item.acceptanceCriteria}
                      </td>

                      {/* Control Gate Badge */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-xs shadow-xs ${
                            isHold
                              ? "bg-red-600 text-white shadow-red-600/30"
                              : isWitness
                                ? "bg-amber-500 text-slate-950"
                                : isReview
                                  ? "bg-slate-700 text-white"
                                  : "bg-blue-600 text-white"
                          }`}
                          title={
                            isHold
                              ? "Hold Point: Work cannot proceed without signed inspection"
                              : isWitness
                                ? "Witness Point: Notified inspection checkpoint"
                                : isReview
                                  ? "Review Point: Document & certificate check"
                                  : "Surveillance: Continuous monitoring"
                          }
                        >
                          {gate}
                        </span>
                      </td>

                      {/* Responsible Party */}
                      <td className="py-3.5 px-3.5 text-slate-600 dark:text-slate-300 font-medium">
                        {item.responsibleParty}
                        {item.frequency && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Freq: {item.frequency}
                          </div>
                        )}
                      </td>

                      {/* Record */}
                      <td className="py-3.5 px-3.5">
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                          {item.verifiableRecord || "WIR / RFI"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click Raise WIR/RFI for Hold Points */}
                          {isHold && (
                            <button
                              onClick={() => handleRaiseRFI(item)}
                              title="Raise formal WIR / RFI from this Hold Point"
                              className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-black transition flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <AlertOctagon className="w-3 h-3" />
                              WIR
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEditItem(item)}
                            title="Edit Inspection Item"
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            title="Remove Inspection Item"
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Signatures Block Matching CD-QP-001 Page 2 Document Control */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          Formal Document Control & Sign-Off Block (CD-QP-001)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="font-bold text-slate-400 text-[10px] uppercase">PREPARED BY (QA/QC ENGINEER)</div>
            <div className="font-black text-slate-900 dark:text-white mt-1 text-sm">
              {plan.preparedBy || "Oladejo Jesujuwon"}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Title: {plan.preparedByTitle || "QA/QC Engineer"}
            </div>
            <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400">
              Date: {plan.preparedByDate || "18-08-2026"} &bull; Certified by Quality Desk
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="font-bold text-slate-400 text-[10px] uppercase">CHECKED BY (QUALITY MANAGER)</div>
            <div className="font-black text-slate-900 dark:text-white mt-1 text-sm">
              {plan.checkedBy || "QA/QC Manager"}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Title: {plan.checkedByTitle || "Quality Assurance Manager"}
            </div>
            <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400">
              Date: {plan.checkedByDate || "20-08-2026"} &bull; Compliance Endorsed
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="font-bold text-slate-400 text-[10px] uppercase">APPROVED BY (CONSULTANT / RE)</div>
            <div className="font-black text-slate-900 dark:text-white mt-1 text-sm">
              {plan.approvedBy || "Resident Engineer / Lead Consultant"}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Title: {plan.approvedByTitle || "Supervising Structural Consultant"}
            </div>
            <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-400">
              Date: {plan.approvedByDate || "22-08-2026"} &bull; Final IFC Clearance
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Inspection Parameter Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingItem ? "Edit Inspection Parameter" : "Add Inspection Parameter"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspection & Test Plan Matrix &bull; {plan.itpNumber}
                </p>
              </div>
              <button
                onClick={() => setShowItemModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Item S/N *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1.0 or 2.1"
                    value={formItemNo}
                    onChange={(e) => setFormItemNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Activity / Process Stage *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1. Block Quality or Pre-Pour Reinforcement"
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Inspection Item / Parameter *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sandcrete / Masonry compressive strength or Cover block placement"
                  value={formParameter}
                  onChange={(e) => setFormParameter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reference Standard / Spec *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BS 6073 / NIS 87 or BS EN 12390"
                    value={formStandard}
                    onChange={(e) => setFormStandard(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Control Gate (CD-QP-001) *
                  </label>
                  <select
                    value={formGate}
                    onChange={(e) => setFormGate(e.target.value as ITPControlGate)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="H">H - Hold Point (Work stoppage; sign-off required)</option>
                    <option value="W">W - Witness Point (Scheduled observation notice)</option>
                    <option value="R">R - Review Point (Lab test, cert or MTC review)</option>
                    <option value="S">S - Surveillance (Random site visual monitoring)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Acceptance Criteria & Tolerances *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Min. 5 blocks tested per batch of 5,000; meets specified strength or Vertical plumb within ±3 mm"
                  value={formCriteria}
                  onChange={(e) => setFormCriteria(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Responsible / Verifying Party
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Testing Lab, QA/QC Engineer"
                    value={formParty}
                    onChange={(e) => setFormParty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Controlling Document / Record
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WIR / RFI or Permit to Pour (PTP)"
                    value={formRecord}
                    onChange={(e) => setFormRecord(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Frequency / Extent
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Min 5 blocks per 5,000 batch or 100% pre-pour"
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Special Remarks / Protocol Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. No screeding or tiling prior to flood test clearance"
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition shadow-md shadow-amber-500/20"
                >
                  {editingItem ? "Save Changes" : "Append to Matrix"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ITPDetailPage;
