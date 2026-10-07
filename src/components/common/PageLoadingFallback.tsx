import React from "react";
import { ShieldCheck, Loader2 } from "lucide-react";

export const PageLoadingFallback: React.FC<{ message?: string }> = ({
  message = "Loading quality workspace...",
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full px-4">
      <div className="relative flex items-center justify-center mb-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/5 animate-pulse">
          <ShieldCheck className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="absolute -inset-1 rounded-2xl border-2 border-emerald-500/20 animate-spin [animation-duration:3s]" />
      </div>

      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
        <span>{message}</span>
      </div>

      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 tracking-wide uppercase font-medium">
        JQMS Enterprise
      </p>
    </div>
  );
};

export default PageLoadingFallback;
