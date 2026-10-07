import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService, sortByNewestFirst } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { ITPPlan, ITPStatus } from "@/types";
import { generateDefaultITPPlans } from "@/lib/defaultITPTemplates";
import {
  exportITPPlanPDF,
  printITPPlan,
  exportITPPlanCSV,
} from "@/services/pdf/itpReport";
import { Pagination } from "@/components/common/Pagination";
import {
  ClipboardList,
  Plus,
  Search,
  FileDown,
  Printer,
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
  AlertOctagon,
  ShieldCheck,
  Eye,
  RefreshCw,
  FolderOpen,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";

export const ITPRegistryPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();
  const currentProjId = projectId || activeProject?.id || "proj-skyline-tower";
  const currentCompId =
    currentUser?.companyId || company?.id || "comp-collection-dev";

  const [itpPlans, setItpPlans] = useState<ITPPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [newDiscipline, setNewDiscipline] = useState("Civil/Structural");
  const [newMethodRef, setNewMethodRef] = useState("WMS-CIV-001");
  const [newMethodTitle, setNewMethodTitle] = useState("");
  const [newSpecSection, setNewSpecSection] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await dbService.getITPPlans(currentProjId, currentCompId);
      setItpPlans(sortByNewestFirst(list));
    } catch (e) {
      console.error("Error loading ITP plans:", e);
      toast.error("Failed to load Inspection & Test Plans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentProjId, currentCompId]);

  // URL Helper
  const getDetailUrl = (planId: string) => {
    if (projectId) {
      return `/projects/${projectId}/itp/${planId}`;
    }
    return `/project/itp/${planId}`;
  };

  // KPIs
  const kpis = useMemo(() => {
    const total = itpPlans.length;
    const approved = itpPlans.filter((p) => p.status === "APPROVED").length;
    let holdPoints = 0;
    let reviewPoints = 0;

    itpPlans.forEach((p) => {
      (p.items || []).forEach((item) => {
        if (item.controlGate === "H") holdPoints++;
        if (item.controlGate === "R") reviewPoints++;
      });
    });

    return { total, approved, holdPoints, reviewPoints };
  }, [itpPlans]);

  // Filtered List
  const filteredPlans = useMemo(() => {
    return itpPlans.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.itpNumber.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        (p.methodStatementRef && p.methodStatementRef.toLowerCase().includes(q)) ||
        (p.discipline && p.discipline.toLowerCase().includes(q));

      const matchDiscipline =
        selectedDiscipline === "ALL" || p.discipline === selectedDiscipline;
      const matchStatus =
        selectedStatus === "ALL" || p.status === selectedStatus;

      return matchSearch && matchDiscipline && matchStatus;
    });
  }, [itpPlans, searchQuery, selectedDiscipline, selectedStatus]);

  // Paginated List
  const paginatedPlans = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPlans.slice(start, start + pageSize);
  }, [filteredPlans, currentPage, pageSize]);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDiscipline, selectedStatus]);

  // Create ITP Plan
  const handleCreateITP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please enter an ITP title.");
      return;
    }

    const autoNumber =
      newNumber.trim() ||
      `CD-ITP-${newDiscipline.slice(0, 3).toUpperCase()}-${String(itpPlans.length + 1).padStart(3, "0")}`;

    const newPlan: ITPPlan = {
      id: `itp-${Date.now()}`,
      itpNumber: autoNumber,
      title: newTitle.trim(),
      discipline: newDiscipline,
      docCode: "CD-QP-001",
      methodStatementRef: newMethodRef.trim() || undefined,
      methodStatementTitle: newMethodTitle.trim() || undefined,
      specSection: newSpecSection.trim() || undefined,
      revision: "REV. 01",
      status: "DRAFT",
      projectId: currentProjId,
      projectName: activeProject?.name || "Standard Construction Project",
      companyId: currentCompId,
      companyName: company?.name || "Collection Developments LTD",
      officeAddress: "3B, Taofik Lawal, Off Awolowo Road, Ikoyi, Lagos",
      contactEmail: "info@collection.gp",
      contactPhone: "+234 (0) 16328782",
      items: [
        {
          id: `item-${Date.now()}-1`,
          itemNo: "1.0",
          activityStage: "1. Pre-Execution Setup",
          itemParameter: "Workmanship, approved drawings & method alignment",
          referenceStandard: "Project Specifications",
          acceptanceCriteria: "100% compliance with approved submittals & IFC drawings",
          controlGate: "H",
          responsibleParty: "QA/QC Engineer, Client Consultant",
          frequency: "Prior to work commencement",
          verifiableRecord: "WIR / RFI",
          subcontractorGate: "H",
          contractorQaGate: "H",
          consultantGate: "H",
          isCompleted: false,
        },
      ],
      preparedBy: currentUser?.fullName || "Oladejo Jesujuwon",
      preparedByTitle: currentUser?.designation || "QA/QC Engineer",
      preparedByDate: new Date().toLocaleDateString("en-GB"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await dbService.saveITPPlan(newPlan);
      setItpPlans((prev) => [newPlan, ...prev]);

      await writeAudit({
        action: "CREATE",
        module: "DOCUMENTS",
        details: `Created Inspection & Test Plan: ${newPlan.itpNumber} - ${newPlan.title}`,
        targetId: newPlan.id,
        projectId: currentProjId,
        companyId: currentCompId,
        userId: currentUser?.uid || "sys",
        userName: currentUser?.fullName || "QA/QC Engineer",
        userRole: currentUser?.role || "QAQC_ENGINEER",
      });

      toast.success(`Created ${newPlan.itpNumber} successfully!`);
      setShowCreateModal(false);
      setNewTitle("");
      setNewNumber("");
      navigate(getDetailUrl(newPlan.id));
    } catch (err) {
      console.error("Error creating ITP plan:", err);
      toast.error("Failed to create ITP plan.");
    }
  };

  // Reset to company default templates
  const handleResetDefaults = async () => {
    if (
      !window.confirm(
        "Load standard templates from Collection Developments LTD Quality Plan (CD-QP-001)? Existing customized plans will be preserved.",
      )
    ) {
      return;
    }
    const defaults = generateDefaultITPPlans(currentProjId, currentCompId);
    for (const d of defaults) {
      await dbService.saveITPPlan(d);
    }
    await loadData();
    toast.success("Loaded company QMP standard ITP templates!");
  };

  // Delete ITP Plan
  const handleDeletePlan = async (plan: ITPPlan) => {
    if (!window.confirm(`Are you sure you want to delete ${plan.itpNumber}?`)) {
      return;
    }
    try {
      await dbService.deleteITPPlan(plan.id, currentProjId);
      setItpPlans((prev) => prev.filter((p) => p.id !== plan.id));
      toast.success(`Deleted ${plan.itpNumber}`);
    } catch (err) {
      console.error("Error deleting ITP:", err);
      toast.error("Failed to delete ITP plan.");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-amber-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                CD-QP-001 &bull; REV. 01
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ISO 9001:2015 Clause 8.5.1
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-amber-400" />
              Inspection & Test Plan (ITP) Matrix
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Establish mandatory control gates (Hold Points, Witness, Review, Surveillance) 
              for structural casting, masonry, geotechnical, and finishes compliance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleResetDefaults}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Load standard templates from company QMP (CD-QP-001)"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              Company Templates
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              New ITP Package
            </button>
          </div>
        </div>

        {/* Company Badge Footer */}
        <div className="mt-5 pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              <strong>Collection Developments LTD</strong> &bull; 3B, Taofik Lawal, Ikoyi Lagos
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>Contact: +234 (0) 16328782</span>
            <span>&bull;</span>
            <span className="text-amber-400 font-mono">info@collection.gp</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total ITP Packages
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {kpis.total}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Active trade & engineering plans
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Approved by Consultant
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-2">
            {kpis.approved}
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Verified IFC specifications
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Mandatory Hold Points (H)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            {kpis.holdPoints}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Work stoppage until sign-off
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Lab & Review Gates (R)
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {kpis.reviewPoints}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            MTC, cube crushing, & soil certs
          </div>
        </div>
      </div>

      {/* Control Gates Quick Reference Bar */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="font-bold text-amber-950 dark:text-amber-300 flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>CD-QP-001 Section 5.3.2 Control Gates Legend:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-bold border border-red-200 dark:border-red-800/50">
            <strong>H (Hold Point):</strong> Mandatory stoppage; sign-off required
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/50">
            <strong>W (Witness Point):</strong> Notified attendance checkpoint
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-600">
            <strong>R (Review Point):</strong> MTC & test cert verification
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/50">
            <strong>S (Surveillance):</strong> Random ongoing site audits
          </span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ITP #, title, method statement, standard..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Disciplines</option>
            <option value="Civil/Structural">Civil / Structural</option>
            <option value="Concrete & Masonry">Concrete & Masonry</option>
            <option value="Geotechnical">Geotechnical & Earthworks</option>
            <option value="MEP">MEP Concealed Services</option>
            <option value="Finishes">Architectural Finishes</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      {/* Main ITP Registry Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400">
            <div className="animate-spin w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm font-semibold">Loading ITP Matrix Records...</p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              No Inspection & Test Plans Found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No ITP plans match your current filters. You can click &quot;Company Templates&quot; 
              above to auto-load your standard CD-QP-001 packages.
            </p>
            <button
              onClick={handleResetDefaults}
              className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition"
            >
              Load Company QMP Templates
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">ITP Reference</th>
                  <th className="py-3.5 px-4">Plan Title & Scope</th>
                  <th className="py-3.5 px-4">Discipline</th>
                  <th className="py-3.5 px-4">Method Statement (WMS)</th>
                  <th className="py-3.5 px-4">Gates Breakdown</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {paginatedPlans.map((plan) => {
                  const items = plan.items || [];
                  const hCount = items.filter((i) => i.controlGate === "H").length;
                  const wCount = items.filter((i) => i.controlGate === "W").length;
                  const rCount = items.filter((i) => i.controlGate === "R").length;
                  const sCount = items.filter((i) => i.controlGate === "S").length;

                  return (
                    <tr
                      key={plan.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-750 transition"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        <Link
                          to={getDetailUrl(plan.id)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                        >
                          <FolderOpen className="w-3.5 h-3.5 text-blue-500" />
                          {plan.itpNumber}
                        </Link>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {plan.revision || "Rev 01"} &bull; {plan.docCode || "CD-QP-001"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          to={getDetailUrl(plan.id)}
                          className="font-bold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition"
                        >
                          {plan.title}
                        </Link>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {plan.specSection || `${items.length} inspection parameters`}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {plan.discipline}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {plan.methodStatementRef ? (
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {plan.methodStatementRef}
                            </span>
                            <div className="text-[10px] text-slate-400 truncate max-w-xs">
                              {plan.methodStatementTitle || "Method Statement"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None linked</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-[10px] font-black">
                          {hCount > 0 && (
                            <span
                              className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                              title={`${hCount} Hold Points`}
                            >
                              {hCount}H
                            </span>
                          )}
                          {wCount > 0 && (
                            <span
                              className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                              title={`${wCount} Witness Points`}
                            >
                              {wCount}W
                            </span>
                          )}
                          {rCount > 0 && (
                            <span
                              className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                              title={`${rCount} Review Points`}
                            >
                              {rCount}R
                            </span>
                          )}
                          {sCount > 0 && (
                            <span
                              className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              title={`${sCount} Surveillance Points`}
                            >
                              {sCount}S
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            plan.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : plan.status === "UNDER_REVIEW"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {plan.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={getDetailUrl(plan.id)}
                            className="px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition"
                          >
                            Open Matrix
                          </Link>

                          <button
                            onClick={() =>
                              exportITPPlanPDF(
                                plan,
                                activeProject || undefined,
                                company || undefined,
                              )
                            }
                            title="Download Company ITP Matrix PDF"
                            className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <FileDown className="w-4 h-4 text-blue-500" />
                          </button>

                          <button
                            onClick={() =>
                              printITPPlan(
                                plan,
                                activeProject || undefined,
                                company || undefined,
                              )
                            }
                            title="Print Preview / Save as PDF"
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => exportITPPlanCSV(plan)}
                            title="Download CSV Spreadsheet"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          </button>

                          <button
                            onClick={() => handleDeletePlan(plan)}
                            title="Delete ITP Plan"
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredPlans.length > 0 && (
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredPlans.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* Create New ITP Package Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Create Inspection & Test Plan (ITP)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Collection Developments LTD Quality Management Framework
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateITP} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ITP Title & Scope *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ITP for Post-Tensioned Slab Casting & Grouting"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Discipline
                  </label>
                  <select
                    value={newDiscipline}
                    onChange={(e) => setNewDiscipline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Civil/Structural">Civil / Structural</option>
                    <option value="Concrete & Masonry">Concrete & Masonry</option>
                    <option value="Geotechnical">Geotechnical & Earthworks</option>
                    <option value="MEP">MEP Concealed Services</option>
                    <option value="Finishes">Architectural Finishes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ITP Reference Code
                  </label>
                  <input
                    type="text"
                    placeholder="Leave blank for auto-number"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Method Statement Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. WMS-CON-004"
                    value={newMethodRef}
                    onChange={(e) => setNewMethodRef(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Specification Clause
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Section 03300 - Cast-in-place"
                    value={newSpecSection}
                    onChange={(e) => setNewSpecSection(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Method Statement Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Method Statement for Post-Tensioning and Duct Grouting"
                  value={newMethodTitle}
                  onChange={(e) => setNewMethodTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl transition shadow-md shadow-amber-500/20"
                >
                  Create & Open Matrix
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ITPRegistryPage;
