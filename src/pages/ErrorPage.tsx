import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Copy,
  Check,
  Terminal,
  ChevronDown,
  ChevronUp,
  Trash2,
  ShieldAlert,
} from "lucide-react";

export const ErrorPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showTrace, setShowTrace] = useState(true);

  // Extract error info from navigation state if passed
  const stateError = (location.state as any)?.error;
  const stateMessage =
    (location.state as any)?.message ||
    stateError?.message ||
    "An unexpected application error or module load failure was encountered.";
  const stateStack =
    (location.state as any)?.stack ||
    stateError?.stack ||
    "No explicit stack trace recorded. The system caught an execution interruption.";

  const handleCopy = () => {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      targetLocation: location.pathname,
      message: stateMessage,
      stack: stateStack,
      userAgent: navigator.userAgent,
    };
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClearCacheAndReload = () => {
    try {
      const keysToKeep = ["jqms_user", "jqms_auth"];
      Object.keys(localStorage).forEach((k) => {
        if (!keysToKeep.includes(k)) localStorage.removeItem(k);
      });
      window.location.href = "/project/dashboard";
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans antialiased selection:bg-red-500 selection:text-white">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden space-y-0 animate-in fade-in zoom-in-95 duration-200">
        {/* Banner Header */}
        <div className="p-6 bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex-shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Module Error
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  System Diagnostics
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Page Load / Execution Interruption
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                The requested view encountered a runtime condition that halted execution. Diagnostic logs have been retained.
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="hidden sm:flex items-center gap-2.5 flex-shrink-0 bg-slate-950/60 hover:bg-slate-950 px-3.5 py-2 rounded-2xl border border-slate-800 transition"
          >
            <img
              src="/assets/jqms-icon.png"
              alt="JQMS"
              className="w-6 h-6 object-contain rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/jqms-icon.png";
              }}
            />
            <span className="text-xs font-mono font-bold text-slate-300">JQMS</span>
          </Link>
        </div>

        {/* Diagnostic Box */}
        <div className="p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/50 space-y-2">
            <div className="flex items-center justify-between text-xs text-red-400 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-4 h-4" />
                <span>Error Message:</span>
              </span>
            </div>
            <div className="text-sm font-mono text-red-200 font-semibold break-words">
              {stateMessage}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/20 transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Load</span>
            </button>

            <button
              onClick={() => navigate("/project/dashboard")}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Go to Project Dashboard</span>
            </button>

            <button
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
                copied
                  ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-400"
                  : "bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300"
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied Log!" : "Copy Error Details"}</span>
            </button>

            <button
              onClick={handleClearCacheAndReload}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-red-950/50 text-slate-400 hover:text-red-300 text-xs font-semibold border border-slate-800 hover:border-red-900/50 transition flex items-center gap-1.5 ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Cache</span>
            </button>
          </div>

          {/* Collapsible Stack Trace */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/70">
            <button
              onClick={() => setShowTrace(!showTrace)}
              className="w-full px-4 py-3 bg-slate-950 flex items-center justify-between text-xs font-bold text-slate-400 hover:text-slate-200 transition"
            >
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-orange-400" />
                <span>Diagnostic Stack Trace</span>
              </span>
              {showTrace ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showTrace && (
              <div className="p-4 border-t border-slate-800 text-xs font-mono space-y-2 max-h-60 overflow-y-auto">
                <pre className="text-slate-300 bg-slate-900 p-3 rounded-xl overflow-x-auto text-[11px] leading-relaxed whitespace-pre-wrap">
                  {stateStack}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

