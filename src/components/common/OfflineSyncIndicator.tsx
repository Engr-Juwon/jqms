import React, { useEffect, useState } from "react";
import { useOfflineStore } from "@/stores/useOfflineStore";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ChevronDown,
  ChevronUp,
  Database,
  Cloud,
  Zap,
} from "lucide-react";

export const OfflineSyncIndicator: React.FC = () => {
  const {
    isOnline,
    queuedItems,
    isSyncing,
    latencyMs,
    checkStatus,
    checkConnection,
    syncNow,
  } = useOfflineStore();

  const [expanded, setExpanded] = useState(false);
  const [checkingPing, setCheckingPing] = useState(false);

  useEffect(() => {
    checkStatus();
    checkConnection();
    const interval = setInterval(() => {
      checkStatus();
      checkConnection();
    }, 15000);
    return () => clearInterval(interval);
  }, [checkStatus, checkConnection]);

  const handleTestPing = async () => {
    setCheckingPing(true);
    await checkConnection();
    await checkStatus();
    setCheckingPing(false);
  };

  return (
    <>
      {/* Offline Alert Sticky Banner at Top if Disconnected */}
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 z-50 bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white px-4 py-2 text-xs font-semibold shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 max-w-3xl mx-auto">
            <WifiOff className="w-4 h-4 shrink-0 animate-bounce" />
            <span>
              <strong>You are working offline.</strong> All data is safely saved in your local device vault and will sync automatically when reconnected.
            </span>
          </div>
          <button
            onClick={handleTestPing}
            disabled={checkingPing}
            className="shrink-0 px-2.5 py-1 bg-white/20 hover:bg-white/30 active:scale-95 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${checkingPing ? "animate-spin" : ""}`} />
            <span>{checkingPing ? "Checking..." : "Retry Connection"}</span>
          </button>
        </div>
      )}

      {/* Floating Network & Sync Status Pill (Bottom-Right across all pages) */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 font-sans select-none">
        {/* Expanded Panel */}
        {expanded && (
          <div className="w-80 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 space-y-3.5 text-xs text-slate-800 dark:text-slate-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold">
                <Activity className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Live Network Diagnostics</span>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Status Rows */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                  {isOnline ? (
                    <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <WifiOff className="w-3.5 h-3.5 text-red-500" />
                  )}
                  <span>Connection</span>
                </span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    isOnline
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                  }`}
                >
                  {isOnline ? "Online (Live)" : "Offline (Local Vault)"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Latency</span>
                </span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {latencyMs !== null ? `${latencyMs} ms` : isOnline ? "Good (<50ms)" : "N/A"}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                  <Database className="w-3.5 h-3.5 text-brand-500" />
                  <span>Queued Vault Items</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {queuedItems.length}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleTestPing}
                disabled={checkingPing}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingPing ? "animate-spin" : ""}`} />
                <span>Test Ping</span>
              </button>

              <button
                onClick={syncNow}
                disabled={isSyncing || !isOnline || queuedItems.length === 0}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition"
              >
                <Cloud className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Minimized / Compact Trigger Pill */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full shadow-lg border backdrop-blur-md transition-all duration-300 active:scale-95 text-xs font-semibold ${
            !isOnline
              ? "bg-red-500/90 text-white border-red-400 hover:bg-red-600 shadow-red-500/20"
              : isSyncing
              ? "bg-amber-500/90 text-white border-amber-400 hover:bg-amber-600 shadow-amber-500/20"
              : queuedItems.length > 0
              ? "bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 hover:bg-amber-100 shadow-amber-500/10"
              : "bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-900 shadow-slate-900/5 hover:border-brand-500/40"
          }`}
          title="Click to view network diagnostics and offline sync vault"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                !isOnline ? "bg-red-400" : isSyncing ? "bg-amber-400" : "bg-emerald-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                !isOnline ? "bg-red-500" : isSyncing ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
          </span>

          <span className="tracking-tight">
            {!isOnline
              ? "Offline"
              : isSyncing
              ? "Syncing Vault..."
              : queuedItems.length > 0
              ? `${queuedItems.length} Pending Sync`
              : latencyMs !== null
              ? `Online (${latencyMs}ms)`
              : "Online"}
          </span>

          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 opacity-60" />
          )}
        </button>
      </div>
    </>
  );
};
