import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  AlertOctagon,
  RefreshCw,
  Home,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  Trash2,
  HelpCircle,
} from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      copied: false,
      showDetails: true,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled exception:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/project/dashboard";
  };

  private handleClearCache = () => {
    try {
      const keysToPreserve = ["jqms_user", "jqms_auth", "jqms_theme"];
      Object.keys(localStorage).forEach((key) => {
        if (!keysToPreserve.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      window.location.reload();
    } catch {
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  private handleCopyDiagnostic = () => {
    const { error, errorInfo } = this.state;
    const diagnosticData = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      errorName: error?.name || "Unknown Error",
      errorMessage: error?.message || "No error message provided",
      stack: error?.stack || "No stack trace available",
      componentStack: errorInfo?.componentStack || "No component stack available",
    };

    navigator.clipboard.writeText(JSON.stringify(diagnosticData, null, 2));
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2500);
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, copied, showDetails } = this.state;

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans antialiased selection:bg-red-500 selection:text-white">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top Bar Alert */}
            <div className="p-6 bg-gradient-to-r from-red-950/70 via-slate-900 to-slate-900 border-b border-slate-800 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex-shrink-0">
                  <AlertOctagon className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                      Fatal Render Error
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      HTTP 500 / Client Exception
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    A Page Error Prevented This Module From Loading
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400">
                    The application caught an unexpected JavaScript exception. Diagnostic details have been captured below for immediate troubleshooting.
                  </p>
                </div>
              </div>
              <a
                href="/"
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
              </a>
            </div>

            {/* Error Message Highlight */}
            <div className="p-6 space-y-5">
              <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/50 space-y-2">
                <div className="flex items-center justify-between text-xs text-red-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" />
                    <span>Error Details & Message:</span>
                  </span>
                  <span className="font-mono text-[11px] text-red-300/80">
                    {error?.name || "Error"}
                  </span>
                </div>
                <div className="text-sm font-mono text-red-200 font-semibold break-words">
                  {error?.message || "An unspecified runtime error occurred in the component tree."}
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={this.handleReload}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/20 transition flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload Module</span>
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Go to Project Dashboard</span>
                </button>

                <button
                  onClick={this.handleCopyDiagnostic}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
                    copied
                      ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-400"
                      : "bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300"
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Copied Diagnostic Log!" : "Copy Error Log"}</span>
                </button>

                <button
                  onClick={this.handleClearCache}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-red-950/50 text-slate-400 hover:text-red-300 text-xs font-semibold border border-slate-800 hover:border-red-900/50 transition flex items-center gap-1.5 ml-auto"
                  title="Clear corrupt local storage state"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Cache</span>
                </button>
              </div>

              {/* Collapsible Technical Stack Trace */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/70">
                <button
                  onClick={() => this.setState({ showDetails: !showDetails })}
                  className="w-full px-4 py-3 bg-slate-950 flex items-center justify-between text-xs font-bold text-slate-400 hover:text-slate-200 transition"
                >
                  <span className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-orange-400" />
                    <span>Technical Stack Trace & Diagnostics</span>
                  </span>
                  {showDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {showDetails && (
                  <div className="p-4 border-t border-slate-800 text-xs font-mono space-y-3 max-h-72 overflow-y-auto">
                    {error?.stack && (
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                          Call Stack:
                        </div>
                        <pre className="text-slate-300 bg-slate-900 p-3 rounded-xl overflow-x-auto text-[11px] leading-relaxed whitespace-pre-wrap">
                          {error.stack}
                        </pre>
                      </div>
                    )}

                    {errorInfo?.componentStack && (
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                          Component Tree Hierarchy:
                        </div>
                        <pre className="text-slate-400 bg-slate-900 p-3 rounded-xl overflow-x-auto text-[10.5px] leading-relaxed whitespace-pre-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>JQMS Enterprise Quality Systems Diagnostic Engine</span>
              </div>
              <span>Platform Version 1.0.0</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

