import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService } from "@/lib/db";
import { generateDailySiteLogPDF } from "@/lib/pdfGenerators";
import { DailySiteLog, DailySignOffEntry, UserRole } from "@/types";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import { ROLE_LEVELS, getUserSigningTitle } from "@/lib/permissions";
import { toast } from "react-hot-toast";
import {
  BookOpen,
  Calendar,
  Clock,
  Sun,
  Users,
  HardHat,
  ClipboardCheck,
  Truck,
  ShieldCheck,
  Eye,
  Camera,
  FileDown,
  Pencil,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  Building2,
  FileText,
  Lock,
} from "lucide-react";

export const DailySiteLogDetail: React.FC = () => {
  const { id, projectId } = useParams<{ id: string; projectId: string }>();
  const navigate = useNavigate();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();

  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";

  const [log, setLog] = useState<DailySiteLog | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign-off modal state
  const [signingSphere, setSigningSphere] = useState<
    "SITE_ENGINEER" | "QAQC_ENGINEER" | "SAFETY_OFFICER" | "PROJECT_MANAGER" | null
  >(null);
  const [signerDesignation, setSignerDesignation] = useState("");
  const [signerDeclaration, setSignerDeclaration] = useState(
    "I hereby confirm that I have reviewed the recorded activities, manpower, quality inspections, and safety entries for this shift and authenticate this record.",
  );
  const [signingInProgress, setSigningInProgress] = useState(false);

  const currentUserLevel = currentUser?.role
    ? ROLE_LEVELS[currentUser.role] || 1
    : 1;

  const canEdit =
    currentUserLevel >= 4 ||
    currentUser?.role === "SUPER_ADMIN" ||
    (log?.status === "DRAFT" && currentUser?.uid === log?.createdBy);

  const canDelete =
    currentUserLevel >= 4 ||
    currentUser?.role === "SUPER_ADMIN" ||
    hasPermission(currentUser?.role, "DELETE_DAILY_LOG");

  const loadLog = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await dbService.getDailySiteLog(id);
      setLog(data);
    } catch (e) {
      console.error("Error loading daily site log:", e);
      toast.error("Failed to load daily site log.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLog();
  }, [id]);

  const handlePrint = () => {
    if (!log) return;
    generateDailySiteLogPDF(log, activeProject || {}, company || {});
  };

  const handleDelete = async () => {
    if (!log) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete Daily Site Log "${log.logNumber}"?`,
    );
    if (!confirmDelete) return;

    try {
      await dbService.deleteDailySiteLog(log.id, currentProjId);
      if (currentUser) {
        await writeAudit({
          projectId: currentProjId,
          companyId: currentCompId,
          userId: currentUser.uid,
          userName: currentUser.fullName,
          userRole: currentUser.role,
          action: "DELETE_DAILY_LOG",
          module: "DAILY_SITE_LOG",
          details: `Deleted Daily Site Log ${log.logNumber} dated ${log.generalConditions.date}`,
        });
      }
      toast.success("Daily site log removed.");
      navigate("/project/daily-logs");
    } catch (e) {
      console.error("Error deleting log:", e);
      toast.error("Failed to delete log.");
    }
  };

  // Check if current user can sign a specific sphere
  const canUserSignSphere = (
    sphere: "SITE_ENGINEER" | "QAQC_ENGINEER" | "SAFETY_OFFICER" | "PROJECT_MANAGER",
  ) => {
    if (!currentUser?.role) return false;
    if (currentUser.role === "SUPER_ADMIN") return true;

    switch (sphere) {
      case "SITE_ENGINEER":
        return currentUserLevel >= 2;
      case "QAQC_ENGINEER":
        return (
          currentUser.role.includes("QAQC") ||
          currentUser.role.includes("QUALITY") ||
          currentUserLevel >= 3
        );
      case "SAFETY_OFFICER":
        return (
          currentUser.role.includes("SAFETY") ||
          currentUserLevel >= 3
        );
      case "PROJECT_MANAGER":
        return (
          currentUserLevel >= 4 ||
          currentUser.role === "PROJECT_MANAGER" ||
          currentUser.role === "CONSULTANT"
        );
      default:
        return false;
    }
  };

  const openSignModal = (
    sphere: "SITE_ENGINEER" | "QAQC_ENGINEER" | "SAFETY_OFFICER" | "PROJECT_MANAGER",
  ) => {
    setSigningSphere(sphere);
    setSignerDesignation(getUserSigningTitle(currentUser));
  };

  const submitSignOff = async () => {
    if (!log || !signingSphere || !currentUser) return;
    setSigningInProgress(true);

    try {
      const stampId = `JQMS-${signingSphere}-${Date.now().toString(36).toUpperCase()}`;
      const signOffEntry: DailySignOffEntry = {
        role: signingSphere,
        signed: true,
        signedBy: {
          uid: currentUser.uid,
          name: currentUser.fullName,
          designation: signerDesignation || getUserSigningTitle(currentUser),
          timestamp: Date.now(),
          digitalStamp: stampId,
          declaration: signerDeclaration,
        },
      };

      const updatedSignOffs = {
        ...(log.signOffs || {}),
        [signingSphere]: signOffEntry,
      };

      // Determine if log becomes fully approved
      let newStatus = log.status;
      if (signingSphere === "PROJECT_MANAGER") {
        newStatus = "APPROVED";
      } else if (
        updatedSignOffs.QAQC_ENGINEER?.signed &&
        updatedSignOffs.SAFETY_OFFICER?.signed
      ) {
        newStatus = "UNDER_REVIEW";
      }

      const updatedLog: DailySiteLog = {
        ...log,
        status: newStatus,
        signOffs: updatedSignOffs,
        updatedAt: Date.now(),
      };

      await dbService.saveDailySiteLog(updatedLog);
      setLog(updatedLog);

      await writeAudit({
        projectId: currentProjId,
        companyId: currentCompId,
        userId: currentUser.uid,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        action: `SIGN_DAILY_LOG_${signingSphere}`,
        module: "DAILY_SITE_LOG",
        details: `Signed Daily Site Log ${log.logNumber} (${signingSphere}) with Stamp ${stampId}`,
      });

      toast.success(
        `Daily Site Log authenticated for ${signingSphere.replace("_", " ")}!`,
      );
      setSigningSphere(null);
    } catch (e) {
      console.error("Error signing off:", e);
      toast.error("Failed to apply digital signature.");
    } finally {
      setSigningInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center">
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-2" />
        Loading Daily Site Log...
      </div>
    );
  }

  if (!log) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs max-w-md mx-auto">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800 mb-1">
          Daily Site Log Not Found
        </h2>
        <p className="text-slate-500 mb-4">
          The requested daily log does not exist or has been removed.
        </p>
        <Link
          to="/project/daily-logs"
          className="px-4 py-2 bg-sky-600 text-white rounded-lg font-bold inline-flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Registry
        </Link>
      </div>
    );
  }

  const gen = log.generalConditions;
  const totalHeadcount = (log.manpower || []).reduce(
    (acc, m) => acc + (Number(m.headCount) || 0),
    0,
  );
  const totalManHours = (log.manpower || []).reduce(
    (acc, m) =>
      acc +
      (Number(m.totalManHours) ||
        (Number(m.headCount) || 0) * (Number(m.hoursWorked) || gen.totalHours || 8)),
    0,
  );

  const quadSignOffCount = [
    log.signOffs?.SITE_ENGINEER?.signed,
    log.signOffs?.QAQC_ENGINEER?.signed,
    log.signOffs?.SAFETY_OFFICER?.signed,
    log.signOffs?.PROJECT_MANAGER?.signed,
  ].filter(Boolean).length;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 pb-20">
      {/* ─── Top Breadcrumbs & Actions ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Link
            to="/project/daily-logs"
            className="hover:text-sky-600 flex items-center"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Daily Site Logs
          </Link>
          <span>/</span>
          <span className="font-mono font-bold text-slate-800">
            {log.logNumber}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
          >
            <FileDown className="w-4 h-4 mr-1.5 text-slate-500" />
            Print / Export PDF
          </button>
          {canEdit && (
            <Link
              to={`/project/daily-logs/${log.id}/edit`}
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-lg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit Diary
            </Link>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Header Card with Status ─── */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Daily Site Log & Diary
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-black uppercase rounded border bg-sky-50 text-sky-800 border-sky-200">
                {log.logNumber}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
              <span className="flex items-center font-semibold text-slate-700">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {gen.date}
              </span>
              <span>&bull;</span>
              <span className="font-bold text-slate-700 uppercase">
                {gen.shift} Shift
              </span>
              <span>&bull;</span>
              <span>
                Hours: {gen.workHoursStart} - {gen.workHoursEnd} ({gen.totalHours} hrs)
              </span>
              <span>&bull;</span>
              <span>
                Project: <strong>{log.projectName}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Quad-Party Sign-Offs
              </div>
              <div className="text-xs font-bold text-slate-700">
                {quadSignOffCount} of 4 Authorized
              </div>
            </div>
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase border ${
                log.status === "APPROVED"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : log.status === "SUBMITTED" || log.status === "UNDER_REVIEW"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : log.status === "REJECTED"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-slate-100 text-slate-700 border-slate-300"
              }`}
            >
              {log.status.replace("_", " ")}
            </div>
          </div>
        </div>

        {/* Top KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Weather & Temperature
            </span>
            <div className="text-sm font-bold text-slate-800 mt-1 capitalize">
              {gen.weather.toLowerCase().replace("_", " ")} &bull; {gen.tempMax}°C
            </div>
            <div className="text-[10px] text-slate-500">
              Ground: {gen.groundConditions || "Dry"} (RH: {gen.humidity || 65}%)
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Workforce on Site
            </span>
            <div className="text-sm font-bold text-slate-800 mt-1 flex items-center">
              <Users className="w-3.5 h-3.5 mr-1 text-blue-500" />
              {totalHeadcount} Workers
            </div>
            <div className="text-[10px] text-slate-500">
              {totalManHours.toFixed(0)} Cumulative Man-Hours
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              QA/QC & Concrete
            </span>
            <div className="text-sm font-bold text-slate-800 mt-1">
              {log.quality?.inspections?.length || 0} Inspections &bull; {log.materials?.concretePours?.length || 0} Pours
            </div>
            <div className="text-[10px] text-slate-500">
              {log.materials?.deliveries?.length || 0} Deliveries Accepted
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Safety & HSE
            </span>
            <div className="text-sm font-bold text-emerald-600 mt-1 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              {log.hse?.incidentsReported ? `${log.hse.incidentsReported} Incident(s)` : "Zero Incidents"}
            </div>
            <div className="text-[10px] text-slate-500">
              TBT: {log.hse?.toolboxTalkAttendees || totalHeadcount} Workers Briefed
            </div>
          </div>
        </div>

        {gen.siteStatusNotes && (
          <div className="p-3 rounded-lg bg-sky-50/60 border border-sky-100 text-xs text-slate-700">
            <strong>Site Operations Overview:</strong> {gen.siteStatusNotes}
          </div>
        )}
      </div>

      {/* ─── SPHERE 1: SITE EXECUTION & MANPOWER ─── */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <HardHat className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-800">
              1. Site Trade Activities & Work Activities
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {log.activities?.length || 0} Activities Logged
          </span>
        </div>

        {/* Activities Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-2.5">Location / Level / Element</th>
                <th className="p-2.5">Trade Discipline</th>
                <th className="p-2.5">Activity Description</th>
                <th className="p-2.5 text-center">Output</th>
                <th className="p-2.5 text-center">Progress</th>
                <th className="p-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {log.activities && log.activities.length > 0 ? (
                log.activities.map((act, i) => (
                  <tr key={act.id || i} className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800">
                      {act.levelName} &bull; {act.elementName}
                      {act.gridlineRef && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          Grid: {act.gridlineRef}
                        </div>
                      )}
                    </td>
                    <td className="p-2.5 font-semibold text-sky-700">
                      {act.trade}
                    </td>
                    <td className="p-2.5 text-slate-600">
                      {act.description}
                      {act.delayNotes && (
                        <div className="text-[10px] text-rose-600 mt-0.5">
                          Note: {act.delayNotes}
                        </div>
                      )}
                    </td>
                    <td className="p-2.5 text-center font-medium">
                      {act.quantityDone || "—"}
                    </td>
                    <td className="p-2.5 text-center font-bold text-sky-600">
                      {act.progressPercentage != null ? `${act.progressPercentage}%` : "—"}
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          act.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : act.status === "DELAYED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {act.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400">
                    No specific activity breakdowns logged for this shift.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Manpower Breakdown Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Manpower Headcount Breakdown
          </h3>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Trade / Discipline</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Contractor / Sub-team</th>
                  <th className="p-2.5 text-center">Headcount</th>
                  <th className="p-2.5 text-center">Hours</th>
                  <th className="p-2.5 text-center">Total Man-Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {log.manpower && log.manpower.length > 0 ? (
                  log.manpower.map((m, i) => (
                    <tr key={m.id || i} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-bold text-slate-800">
                        {m.tradeName}
                      </td>
                      <td className="p-2.5 text-slate-500">
                        {m.tradeCategory || "Civil"}
                      </td>
                      <td className="p-2.5 text-slate-600">
                        {m.companyOrSubcontractor || "Direct Labor"}
                      </td>
                      <td className="p-2.5 text-center font-bold text-sky-600">
                        {m.headCount}
                      </td>
                      <td className="p-2.5 text-center text-slate-600">
                        {m.hoursWorked || gen.totalHours || 8}h
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-800">
                        {(Number(m.totalManHours) || (Number(m.headCount) * (Number(m.hoursWorked) || 8))).toFixed(0)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-400">
                      No trade manpower records logged.
                    </td>
                  </tr>
                )}
                <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                  <td colSpan={3} className="p-2.5 text-right uppercase text-[10px] text-slate-500">
                    Total Cumulative Shift Workforce:
                  </td>
                  <td className="p-2.5 text-center text-sky-700">{totalHeadcount}</td>
                  <td className="p-2.5 text-center text-slate-500">{gen.totalHours}h avg</td>
                  <td className="p-2.5 text-center text-slate-900">{totalManHours.toFixed(0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── SPHERE 2: QA/QC COMPLIANCE & MATERIALS ─── */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-800">
              2. Quality Assurance & Materials Verification
            </h2>
          </div>
        </div>

        {/* Inspections */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Hold-Point Site Inspections
          </h3>
          {log.quality?.inspections && log.quality.inspections.length > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Scope / Type</th>
                    <th className="p-2.5">RFI Ref</th>
                    <th className="p-2.5">Location / Element</th>
                    <th className="p-2.5">Result</th>
                    <th className="p-2.5">Inspector</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {log.quality.inspections.map((insp, i) => (
                    <tr key={insp.id || i} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-bold text-slate-800">
                        {insp.inspectionType}
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-slate-600">
                        {insp.refNo || "—"}
                      </td>
                      <td className="p-2.5 text-slate-600">
                        {insp.levelName} &bull; {insp.elementName}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            insp.result === "PASSED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : insp.result === "PASSED_AS_NOTED"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {insp.result.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-600">
                        {insp.inspectorName || "QA/QC Lead"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-3 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 text-center">
              No formal inspection hold-points witnessed during this shift.
            </div>
          )}
        </div>

        {/* Concrete & Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Concrete pours */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Concrete Pouring Log
            </h4>
            {log.materials?.concretePours && log.materials.concretePours.length > 0 ? (
              <div className="space-y-2">
                {log.materials.concretePours.map((cp, i) => (
                  <div
                    key={cp.id || i}
                    className="p-3 border border-slate-200 rounded-lg bg-slate-50 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">
                        {cp.elementName} ({cp.levelName || "Site"})
                      </span>
                      <span className="font-mono font-bold text-sky-700 px-2 py-0.5 bg-sky-100 rounded">
                        {cp.concreteGrade}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex justify-between">
                      <span>Volume: <strong>{cp.volumePoured} m³</strong></span>
                      <span>Slump: {cp.slumpMm ? `${cp.slumpMm} mm` : "—"}</span>
                      <span>Sample: {cp.cubeSampleNumber || "Set 6"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 text-center">
                No concrete pours executed this shift.
              </div>
            )}
          </div>

          {/* Deliveries */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Material Deliveries Received
            </h4>
            {log.materials?.deliveries && log.materials.deliveries.length > 0 ? (
              <div className="space-y-2">
                {log.materials.deliveries.map((del, i) => (
                  <div
                    key={del.id || i}
                    className="p-3 border border-slate-200 rounded-lg bg-slate-50 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">
                        {del.description}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          del.status === "APPROVED_AS_NOTED" || del.status === "APPROVED AS NOTED"
                            ? "bg-sky-100 text-sky-800 border border-sky-300"
                            : del.status === "PARTIALLY_ACCEPTED" || del.status === "PARTIALLY ACCEPTED"
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : del.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        }`}
                      >
                        {(del.status || "ACCEPTED").replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex justify-between">
                      <span>Supplier: {del.supplier}</span>
                      <span>Qty: <strong>{del.quantity} {del.unit}</strong></span>
                      <span>Doc: {del.ticketNumber || "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400 text-center">
                No material deliveries received this shift.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── SPHERE 3: HSE & SAFETY ─── */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-5 h-5 text-amber-500" />
          <h2 className="text-base font-bold text-slate-800">
            3. Health, Safety & Environmental Record (HSE)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Toolbox Talk (TBT)
            </span>
            <div className="font-bold text-slate-800">
              {log.hse?.toolboxTalkTopic || "Daily Morning Safety Briefing"}
            </div>
            <div className="text-slate-500">
              Attendance: <strong>{log.hse?.toolboxTalkAttendees || totalHeadcount} Workers</strong>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Incident & Near-Miss Record
            </span>
            <div
              className={`font-bold ${
                log.hse?.incidentsReported
                  ? "text-rose-600"
                  : "text-emerald-600"
              }`}
            >
              {log.hse?.incidentsReported
                ? `⚠️ ${log.hse.incidentsReported} Incidents Reported`
                : "✅ Zero Lost Time Accidents (0 LTI)"}
            </div>
            <div className="text-slate-500">
              Near-Misses: {log.hse?.nearMissesReported || 0}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Housekeeping Rating
            </span>
            <div className="font-bold text-slate-800">
              {log.hse?.housekeepingRating || "GOOD"}
            </div>
            <div className="text-slate-500">
              Accessways clear & perimeter safety barriers compliant
            </div>
          </div>
        </div>

        {log.hse?.safetyObservations && (
          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <strong>Safety Observations:</strong> {log.hse.safetyObservations}
          </div>
        )}
      </div>

      {/* ─── SPHERE 4: PHOTOS & EVIDENCE ─── */}
      {log.photos && log.photos.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-sky-600" />
              <h2 className="text-base font-bold text-slate-800">
                4. Attached Photographic Evidence ({log.photos.length})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {log.photos.map((p, idx) => (
              <div
                key={p.id || idx}
                className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50"
              >
                <img
                  src={p.url}
                  alt={p.caption}
                  className="w-full h-40 object-cover"
                />
                <div className="p-2.5 text-xs">
                  <div className="font-bold text-slate-800 line-clamp-1">
                    {p.caption}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {p.tradeTag} &bull; {p.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── QUAD-PARTY DIGITAL SIGN-OFF MATRIX ─── */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-sky-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Multi-Sphere Digital Certification (Quad-Party Sign-Off)
              </h2>
              <p className="text-xs text-slate-500">
                Authentication across Execution, QA/QC, Safety, and Governance spheres (ISO 9001:2015 Clause 8.5.1).
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Site Engineer */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-extrabold uppercase text-sky-700 tracking-wider mb-1">
                Site Engineer / Execution
              </div>
              <div className="text-xs font-bold text-slate-800">
                {log.signOffs?.SITE_ENGINEER?.signedBy?.name || log.createdByName || "Site Engineer"}
              </div>
              <div className="text-[11px] text-slate-500">
                {log.signOffs?.SITE_ENGINEER?.signedBy?.designation || "Project Field Engineer"}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80">
              {log.signOffs?.SITE_ENGINEER?.signed ? (
                <div>
                  <div className="flex items-center text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Digitally Authenticated
                  </div>
                  <div className="text-[9.5px] font-mono text-slate-400 mt-0.5">
                    {log.signOffs.SITE_ENGINEER.signedBy?.digitalStamp || "JQMS-SE-VERIFIED"}
                  </div>
                </div>
              ) : canUserSignSphere("SITE_ENGINEER") ? (
                <button
                  type="button"
                  onClick={() => openSignModal("SITE_ENGINEER")}
                  className="w-full py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded text-xs font-bold transition-colors"
                >
                  Sign as Site Engineer
                </button>
              ) : (
                <span className="text-xs text-slate-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> Pending Sign-Off
                </span>
              )}
            </div>
          </div>

          {/* 2. QA/QC Lead */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-extrabold uppercase text-emerald-700 tracking-wider mb-1">
                QA/QC Quality Lead
              </div>
              <div className="text-xs font-bold text-slate-800">
                {log.signOffs?.QAQC_ENGINEER?.signedBy?.name || "Pending QA/QC Lead"}
              </div>
              <div className="text-[11px] text-slate-500">
                {log.signOffs?.QAQC_ENGINEER?.signedBy?.designation || "QA/QC Engineer"}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80">
              {log.signOffs?.QAQC_ENGINEER?.signed ? (
                <div>
                  <div className="flex items-center text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Quality Certified
                  </div>
                  <div className="text-[9.5px] font-mono text-slate-400 mt-0.5">
                    {log.signOffs.QAQC_ENGINEER.signedBy?.digitalStamp || "JQMS-QAQC-CERT"}
                  </div>
                </div>
              ) : canUserSignSphere("QAQC_ENGINEER") ? (
                <button
                  type="button"
                  onClick={() => openSignModal("QAQC_ENGINEER")}
                  className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors"
                >
                  Certify QA/QC Compliance
                </button>
              ) : (
                <span className="text-xs text-slate-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> Awaiting QA/QC
                </span>
              )}
            </div>
          </div>

          {/* 3. Safety Manager */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-extrabold uppercase text-amber-700 tracking-wider mb-1">
                HSE & Safety Officer
              </div>
              <div className="text-xs font-bold text-slate-800">
                {log.signOffs?.SAFETY_OFFICER?.signedBy?.name || "Pending HSE Clearance"}
              </div>
              <div className="text-[11px] text-slate-500">
                {log.signOffs?.SAFETY_OFFICER?.signedBy?.designation || "Safety Manager"}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80">
              {log.signOffs?.SAFETY_OFFICER?.signed ? (
                <div>
                  <div className="flex items-center text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Safety Cleared
                  </div>
                  <div className="text-[9.5px] font-mono text-slate-400 mt-0.5">
                    {log.signOffs.SAFETY_OFFICER.signedBy?.digitalStamp || "JQMS-HSE-CLEARED"}
                  </div>
                </div>
              ) : canUserSignSphere("SAFETY_OFFICER") ? (
                <button
                  type="button"
                  onClick={() => openSignModal("SAFETY_OFFICER")}
                  className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-colors"
                >
                  Endorse Safety Record
                </button>
              ) : (
                <span className="text-xs text-slate-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> Awaiting HSE
                </span>
              )}
            </div>
          </div>

          {/* 4. Consultant / PM */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-extrabold uppercase text-purple-700 tracking-wider mb-1">
                Consultant / PM Approval
              </div>
              <div className="text-xs font-bold text-slate-800">
                {log.signOffs?.PROJECT_MANAGER?.signedBy?.name || "Pending PM / Consultant"}
              </div>
              <div className="text-[11px] text-slate-500">
                {log.signOffs?.PROJECT_MANAGER?.signedBy?.designation || "Supervising Authority"}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/80">
              {log.signOffs?.PROJECT_MANAGER?.signed ? (
                <div>
                  <div className="flex items-center text-xs font-bold text-purple-700">
                    <Award className="w-3.5 h-3.5 mr-1" /> Formally Approved
                  </div>
                  <div className="text-[9.5px] font-mono text-slate-400 mt-0.5">
                    {log.signOffs.PROJECT_MANAGER.signedBy?.digitalStamp || "JQMS-PM-APPROVED"}
                  </div>
                </div>
              ) : canUserSignSphere("PROJECT_MANAGER") ? (
                <button
                  type="button"
                  onClick={() => openSignModal("PROJECT_MANAGER")}
                  className="w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold transition-colors"
                >
                  Grant Final PM Approval
                </button>
              ) : (
                <span className="text-xs text-slate-400 flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> Awaiting PM
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── DIGITAL SIGNATURE MODAL ─── */}
      {signingSphere && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Digital Authentication & Certification
                </h3>
              </div>
              <button
                onClick={() => setSigningSphere(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-sky-50 rounded-lg border border-sky-100 text-sky-900">
                Authenticating as: <strong>{currentUser?.fullName}</strong> &bull;{" "}
                <span className="uppercase font-bold">
                  {signingSphere.replace("_", " ")}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Designation / Role Title
                </label>
                <input
                  type="text"
                  value={signerDesignation}
                  onChange={(e) => setSignerDesignation(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Certification Declaration
                </label>
                <textarea
                  rows={3}
                  value={signerDeclaration}
                  onChange={(e) => setSignerDeclaration(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-600"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 font-mono">
                Security Stamp: JQMS-{signingSphere}-AUTHD &bull; Timestamp: {new Date().toLocaleString()}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSigningSphere(null)}
                disabled={signingInProgress}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitSignOff}
                disabled={signingInProgress}
                className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow flex items-center transition-colors"
              >
                {signingInProgress ? "Applying Signature..." : "Apply Electronic Signature"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailySiteLogDetail;

