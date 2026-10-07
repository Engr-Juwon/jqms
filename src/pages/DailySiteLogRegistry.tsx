import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useProjectStore } from "@/stores/useProjectStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { dbService, sortByNewestFirst } from "@/lib/db";
import { generateDailySiteLogPDF } from "@/lib/pdfGenerators";
import { DailySiteLog, DailySiteLogStatus } from "@/types";
import { writeAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/rbac";
import { toast } from "react-hot-toast";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  FileDown,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  HardHat,
  Trash2,
  ChevronRight,
  Eye,
  Pencil,
  Sun,
  CloudRain,
  Cloud,
  ShieldCheck,
  Building2,
  Sparkles,
} from "lucide-react";

export const DailySiteLogRegistry: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { activeProject } = useProjectStore();
  const { currentUser, company } = useAuthStore();

  const currentProjId = activeProject?.id || projectId || "";
  const currentCompId =
    currentUser?.companyId || company?.id || activeProject?.companyId || "";

  const canCreate = hasPermission(currentUser?.role, "CREATE_DAILY_LOG");
  const canDelete = hasPermission(currentUser?.role, "DELETE_DAILY_LOG");

  const [logs, setLogs] = useState<DailySiteLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [shiftFilter, setShiftFilter] = useState<string>("ALL");

  const loadLogs = async () => {
    if (!currentProjId) return;
    setLoading(true);
    try {
      const data = await dbService.getDailySiteLogs(currentProjId, currentCompId);
      setLogs(sortByNewestFirst(data));
    } catch (e) {
      console.error("Error loading daily site logs:", e);
      toast.error("Failed to load daily site logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [currentProjId, currentCompId]);

  const handleDelete = async (log: DailySiteLog) => {
    if (!canDelete) {
      toast.error("You do not have permission to delete daily site logs.");
      return;
    }
    const confirmDelete = window.confirm(
      `Are you sure you want to delete Daily Site Log "${log.logNumber}" (${log.generalConditions.date})? This action is irreversible.`,
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
      setLogs((prev) => prev.filter((l) => l.id !== log.id));
    } catch (e) {
      console.error("Error deleting log:", e);
      toast.error("Failed to delete log.");
    }
  };

  const handlePrint = (log: DailySiteLog) => {
    generateDailySiteLogPDF(log, activeProject || {}, company || {});
  };

  // Filter calculations
  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      log.logNumber.toLowerCase().includes(term) ||
      log.generalConditions.date.toLowerCase().includes(term) ||
      (log.createdByName && log.createdByName.toLowerCase().includes(term)) ||
      (log.generalConditions.siteStatusNotes &&
        log.generalConditions.siteStatusNotes.toLowerCase().includes(term)) ||
      log.activities.some(
        (a) =>
          a.description.toLowerCase().includes(term) ||
          a.trade.toLowerCase().includes(term) ||
          (a.elementName && a.elementName.toLowerCase().includes(term)),
      );

    const matchesStatus =
      statusFilter === "ALL" || log.status === statusFilter;
    const matchesShift =
      shiftFilter === "ALL" || log.generalConditions.shift === shiftFilter;

    return matchesSearch && matchesStatus && matchesShift;
  });

  // KPI calculations
  const totalLogsCount = logs.length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLog = logs.find((l) => l.generalConditions.date === todayStr);
  const latestLog = logs[0];
  const latestManpower = latestLog
    ? (latestLog.manpower || []).reduce(
        (acc, m) => acc + (Number(m.headCount) || 0),
        0,
      )
    : 0;
  const latestManHours = latestLog
    ? (latestLog.manpower || []).reduce(
        (acc, m) =>
          acc +
          (Number(m.totalManHours) ||
            (Number(m.headCount) || 0) * (Number(m.hoursWorked) || 8)),
        0,
      )
    : 0;
  const activeDelaysCount = logs.reduce(
    (acc, l) => acc + (l.delays ? l.delays.length : 0),
    0,
  );

  const getStatusBadge = (status: DailySiteLogStatus) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
          </span>
        );
      case "SUBMITTED":
      case "UNDER_REVIEW":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 mr-1" /> Under Review
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 mr-1" /> Needs Revision
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            Draft Record
          </span>
        );
    }
  };

  const getWeatherIcon = (w: string) => {
    switch (w) {
      case "SUNNY":
        return <Sun className="w-4 h-4 text-amber-500 inline mr-1" />;
      case "RAIN":
      case "HEAVY_RAIN":
        return <CloudRain className="w-4 h-4 text-blue-500 inline mr-1" />;
      case "OVERCAST":
      case "CLOUDY":
        return <Cloud className="w-4 h-4 text-slate-500 inline mr-1" />;
      default:
        return <Sun className="w-4 h-4 text-amber-400 inline mr-1" />;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* ─── Top Banner & Actions ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Daily Site Logs & Site Diary
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-sky-100 text-sky-800 rounded border border-sky-300">
                Multi-Sphere
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive daily operational diary across Execution, QA/QC, Materials, HSE & Consultant oversight (ISO 9001:2015 Clause 8.5.1).
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {canCreate && (
            <Link
              to="/project/daily-logs/create"
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Log Daily Shift
            </Link>
          )}
        </div>
      </div>

      {/* ─── KPI Metric Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Logs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Total Diary Logs
            </span>
            <Calendar className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">
            {totalLogsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Archived site shifts recorded
          </div>
        </div>

        {/* Today's Shift Status */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Today's Status
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-black text-slate-800 mt-2">
            {todayLog ? (
              <span className="text-emerald-600 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1 inline" /> Logged ({todayLog.generalConditions.shift})
              </span>
            ) : (
              <span className="text-amber-600 flex items-center">
                <Clock className="w-4 h-4 mr-1 inline" /> Pending Entry
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {todayLog ? `Ref: ${todayLog.logNumber}` : "Shift diary not yet compiled today"}
          </div>
        </div>

        {/* Latest Active Workforce */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Latest Workforce
            </span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">
            {latestManpower}{" "}
            <span className="text-xs font-semibold text-slate-400">Workers</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {latestManHours.toFixed(0)} cumulative man-hours logged
          </div>
        </div>

        {/* Active Delays / Hindrances */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Recorded Delays
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">
            {activeDelaysCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Site obstacles & weather hindrances
          </div>
        </div>
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search log ref, date, trades, activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Needs Revision</option>
          </select>

          <div className="flex items-center space-x-1.5 text-xs text-slate-500 ml-2">
            <span className="font-semibold">Shift:</span>
          </div>
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Shifts</option>
            <option value="DAY">Day Shift</option>
            <option value="NIGHT">Night Shift</option>
            <option value="DOUBLE_SHIFT">Double Shift</option>
            <option value="OVERTIME">Overtime Shift</option>
          </select>
        </div>
      </div>

      {/* ─── Log Records Table ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center">
            <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-2" />
            Loading daily site logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center px-4">
            <BookOpen className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-slate-700 font-bold text-sm mb-1">
              No daily site logs found
            </p>
            <p className="max-w-md text-slate-500 mb-4">
              {logs.length === 0
                ? "Start recording today's site execution, manpower, inspections, and safety records by logging a shift."
                : "No logs matched your current search filters."}
            </p>
            {canCreate && (
              <Link
                to="/project/daily-logs/create"
                className="inline-flex items-center px-3.5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create First Site Log
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Log Ref & Shift</th>
                  <th className="py-3 px-4">Weather & Env</th>
                  <th className="py-3 px-4">Workforce Headcount</th>
                  <th className="py-3 px-4">Key Activities</th>
                  <th className="py-3 px-4">QA/QC & Materials</th>
                  <th className="py-3 px-4 text-center">Quad Sign-Offs</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const headcount = (log.manpower || []).reduce(
                    (acc, m) => acc + (Number(m.headCount) || 0),
                    0,
                  );
                  const totalHrs = (log.manpower || []).reduce(
                    (acc, m) =>
                      acc +
                      (Number(m.totalManHours) ||
                        (Number(m.headCount) || 0) * (Number(m.hoursWorked) || 8)),
                    0,
                  );

                  // Quad Sign-Off states
                  const seSigned = Boolean(log.signOffs?.SITE_ENGINEER?.signed);
                  const qaSigned = Boolean(log.signOffs?.QAQC_ENGINEER?.signed);
                  const hseSigned = Boolean(log.signOffs?.SAFETY_OFFICER?.signed);
                  const pmSigned = Boolean(
                    log.signOffs?.PROJECT_MANAGER?.signed ||
                      log.signOffs?.CONSULTANT?.signed,
                  );

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Ref & Shift */}
                      <td className="py-3 px-4">
                        <Link
                          to={`/project/daily-logs/${log.id}`}
                          className="font-bold text-sky-700 hover:text-sky-900 block font-mono text-[11px]"
                        >
                          {log.logNumber}
                        </Link>
                        <div className="flex items-center space-x-1.5 text-[11px] text-slate-600 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className="font-semibold">{log.generalConditions.date}</span>
                          <span className="text-slate-300">&bull;</span>
                          <span className="uppercase text-[9.5px] font-bold text-slate-500">
                            {log.generalConditions.shift}
                          </span>
                        </div>
                      </td>

                      {/* Weather */}
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center">
                          {getWeatherIcon(log.generalConditions.weather)}
                          <span className="font-semibold capitalize text-[11px]">
                            {log.generalConditions.weather.toLowerCase().replace("_", " ")}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {log.generalConditions.tempMax != null
                            ? `${log.generalConditions.tempMin || 20}°C - ${log.generalConditions.tempMax}°C`
                            : "Normal Temp"}
                        </div>
                      </td>

                      {/* Workforce */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 flex items-center space-x-1">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          <span>{headcount} Workers</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {totalHrs.toFixed(0)} Total Man-Hours
                        </div>
                      </td>

                      {/* Activities */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 line-clamp-1 text-[11px]">
                          {log.activities && log.activities.length > 0
                            ? log.activities[0].description
                            : "No activity details"}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {log.activities ? log.activities.length : 0} activities recorded
                        </div>
                      </td>

                      {/* QA/QC & Materials */}
                      <td className="py-3 px-4">
                        <div className="text-[11px] text-slate-700">
                          {log.quality?.inspections?.length || 0} Hold-Points &bull;{" "}
                          {log.materials?.concretePours?.length || 0} Pours
                        </div>
                        {log.delays && log.delays.length > 0 && (
                          <div className="text-[10px] text-rose-600 font-bold flex items-center mt-0.5">
                            <AlertTriangle className="w-3 h-3 mr-1 inline" />
                            {log.delays.length} Delay(s) logged
                          </div>
                        )}
                      </td>

                      {/* Quad Sign-Offs Badges */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center space-x-1">
                          <span
                            title="Site Engineer Sign-Off"
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                              seSigned
                                ? "bg-sky-100 text-sky-700 border border-sky-300"
                                : "bg-slate-100 text-slate-400 border border-slate-200"
                            }`}
                          >
                            SE
                          </span>
                          <span
                            title="QA/QC Lead Sign-Off"
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                              qaSigned
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                                : "bg-slate-100 text-slate-400 border border-slate-200"
                            }`}
                          >
                            QA
                          </span>
                          <span
                            title="HSE / Safety Officer Sign-Off"
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                              hseSigned
                                ? "bg-amber-100 text-amber-700 border border-amber-300"
                                : "bg-slate-100 text-slate-400 border border-slate-200"
                            }`}
                          >
                            HSE
                          </span>
                          <span
                            title="Consultant / PM Sign-Off"
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                              pmSigned
                                ? "bg-purple-100 text-purple-700 border border-purple-300"
                                : "bg-slate-100 text-slate-400 border border-slate-200"
                            }`}
                          >
                            PM
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(log.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handlePrint(log)}
                            title="Print / Export PDF"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/project/daily-logs/${log.id}`}
                            title="View Full Diary"
                            className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {log.status === "DRAFT" && (
                            <Link
                              to={`/project/daily-logs/${log.id}/edit`}
                              title="Edit Log"
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </Link>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(log)}
                              title="Delete Record"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailySiteLogRegistry;

