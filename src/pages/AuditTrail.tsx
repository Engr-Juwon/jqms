import React, { useState, useEffect } from "react";
import { ShieldCheck, Search, Filter, RefreshCw } from "lucide-react";
import { dbService } from "../lib/db";
import { useAuthStore } from "../stores/useAuthStore";
import { AuditLog } from "../types";

export const AuditTrail: React.FC = () => {
  const { company } = useAuthStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const loadLogs = async () => {
    const compId = company?.id || "";
    if (!compId) {
      setLogs([]);
      return;
    }
    const data = await dbService.getAuditLogs(compId);
    setLogs(data);
  };

  useEffect(() => {
    loadLogs();
  }, [company]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.userName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.module || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.action || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="sticky top-1 sm:top-2 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 sm:p-6 rounded-2xl shadow-md dark:shadow-xl transition-colors">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Immutable Enterprise Audit Trail
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Tamper-evident ISO 9001 compliance audit register logging every
              system state change, sign-off, and escalation.
            </p>
          </div>
          <button
            onClick={loadLogs}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Audit Log
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by engineer name, action, module, or operation details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 shadow-sm"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE_SITE_COMMENT">CREATE_SITE_COMMENT</option>
              <option value="RAISE_NCR">RAISE_NCR</option>
              <option value="CLOSE_NCR">CLOSE_NCR</option>
              <option value="SUBMIT_RFI">SUBMIT_RFI</option>
              <option value="SUBMIT_MAR">SUBMIT_MAR</option>
              <option value="EXECUTE_INSPECTION">EXECUTE_INSPECTION</option>
              <option value="APPROVE_POUR">APPROVE_POUR</option>
              <option value="RECORD_CUBE_TEST">RECORD_CUBE_TEST</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Timestamp (UTC)</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Module</th>
                  <th className="py-3.5 px-4">Authorized User</th>
                  <th className="py-3.5 px-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-slate-500 dark:text-slate-400"
                    >
                      No matching audit trail logs recorded
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition font-mono text-xs"
                    >
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-sans font-medium">
                        {log.module}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {log.userName}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          {log.userRole}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-sans max-w-sm truncate">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
};
