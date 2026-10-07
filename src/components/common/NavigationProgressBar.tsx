import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { Loader2 } from "lucide-react";

/**
 * Top Navigation Progress Bar & Instant Click Indicator
 * Triggers at 0ms during the native click capture phase and remains visible
 * continuously until the new page is completely downloaded, rendered, and mounted.
 */
export const NavigationProgressBar: React.FC = () => {
  const location = useLocation();
  const { isNavigating, progress, finishNavigation } = useNavigationStore();

  // Whenever the active route in React Router finally commits and mounts, complete the navigation
  useEffect(() => {
    // Small timeout ensures the DOM has painted before dismissing the bar
    const t = setTimeout(() => {
      finishNavigation();
    }, 80);
    return () => clearTimeout(t);
  }, [location.pathname, location.search, finishNavigation]);

  const active = isNavigating || progress > 0;

  if (!active) return null;

  return (
    <>
      {/* 1. Ultra-high glow Top Progress Bar (Fixed across very top of browser) */}
      <div
        className="fixed top-0 left-0 right-0 h-[4px] z-[99999] pointer-events-none transition-opacity duration-300"
        style={{ opacity: active ? 1 : 0 }}
        aria-hidden="true"
      >
        <div className="w-full h-full bg-slate-900/10 dark:bg-white/5 relative overflow-hidden">
          {/* Animated gradient bar */}
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_16px_rgba(16,185,129,0.9)] transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
          {/* Shimmer light pulse on leading edge */}
          {progress < 100 && (
            <div
              className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/80 to-transparent -translate-x-full animate-[shimmer_1s_infinite]"
              style={{ left: `${progress}%` }}
            />
          )}
        </div>
      </div>

      {/* 2. Instant Floating Click-Feedback Pill */}
      {isNavigating && (
        <div className="fixed top-4 right-6 z-[99999] pointer-events-none flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs font-semibold shadow-2xl border border-emerald-500/50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
          <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
          <span className="tracking-wide">Loading view...</span>
        </div>
      )}
    </>
  );
};

export default NavigationProgressBar;
