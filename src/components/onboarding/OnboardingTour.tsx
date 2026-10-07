import React, { useEffect, useRef, useState, useCallback } from "react";
import { useOnboardingStore } from "@/stores/useOnboardingStore";
import { TOUR_STEPS } from "@/lib/onboardingSteps";
import { ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 10; // px padding around the spotlit element
const CARD_WIDTH = 340;

// ─── Confetti burst on completion ─────────────────────────────────────────────
const CONFETTI_COLORS = [
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#f97316",
];

function spawnConfetti() {
  if (typeof document === "undefined") return;
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:99999;overflow:hidden;";
  document.body.appendChild(container);

  for (let i = 0; i < 80; i++) {
    const dot = document.createElement("div");
    const color =
      CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const size = Math.random() * 8 + 4;
    const x = Math.random() * 100;
    const delay = Math.random() * 600;
    const duration = Math.random() * 1200 + 800;
    dot.style.cssText = `
      position:absolute;top:-${size}px;left:${x}vw;
      width:${size}px;height:${size}px;
      background:${color};border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      animation:confettiFall ${duration}ms ${delay}ms ease-in forwards;
    `;
    container.appendChild(dot);
  }

  // Inject keyframes once
  if (!document.getElementById("confetti-style")) {
    const style = document.createElement("style");
    style.id = "confetti-style";
    style.textContent = `
      @keyframes confettiFall {
        0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => container.remove(), 2500);
}

// ─── Main component ────────────────────────────────────────────────────────────
export const OnboardingTour: React.FC = () => {
  const {
    isActive,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
  } = useOnboardingStore();

  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [cardStyle, setCardStyle] = useState<React.CSSProperties>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const rafRef = useRef<number | null>(null);

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  // ── Compute spotlight & card position ────────────────────────────────────────
  const measureTarget = useCallback(() => {
    if (!step) return;

    if (!step.targetSelector) {
      // Centred modal — no spotlight
      setSpotlight(null);
      setCardStyle({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: CARD_WIDTH,
      });
      return;
    }

    const el = document.querySelector(
      step.targetSelector,
    ) as HTMLElement | null;
    if (!el) {
      // Element not found — fall back to centred
      setSpotlight(null);
      setCardStyle({
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: CARD_WIDTH,
      });
      return;
    }

    const rect = el.getBoundingClientRect();
    const sp: SpotlightRect = {
      top: rect.top - PADDING,
      left: rect.left - PADDING,
      width: rect.width + PADDING * 2,
      height: rect.height + PADDING * 2,
    };
    setSpotlight(sp);

    // Place the card to the right of spotlight by default
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardH = 220; // approx
    let cs: React.CSSProperties = { position: "fixed", width: CARD_WIDTH };

    if (step.placement === "right") {
      const leftPos = sp.left + sp.width + 16;
      if (leftPos + CARD_WIDTH < vw) {
        cs.left = leftPos;
        cs.top = Math.max(16, Math.min(sp.top, vh - cardH - 16));
      } else {
        // Flip to left if no room
        cs.right = vw - sp.left + 16;
        cs.top = Math.max(16, Math.min(sp.top, vh - cardH - 16));
      }
    } else if (step.placement === "left") {
      cs.right = vw - sp.left + 16;
      cs.top = Math.max(16, Math.min(sp.top, vh - cardH - 16));
    } else if (step.placement === "bottom") {
      cs.top = sp.top + sp.height + 16;
      cs.left = Math.max(16, sp.left);
    } else if (step.placement === "top") {
      cs.bottom = vh - sp.top + 16;
      cs.left = Math.max(16, sp.left);
    } else {
      cs.top = "50%";
      cs.left = "50%";
      cs.transform = "translate(-50%, -50%)";
    }

    setCardStyle(cs);
  }, [step]);

  // Re-measure on step change and on resize
  useEffect(() => {
    if (!isActive) return;
    setIsTransitioning(true);
    const t = setTimeout(() => {
      measureTarget();
      setIsTransitioning(false);
    }, 50);
    return () => clearTimeout(t);
  }, [isActive, currentStep, measureTarget]);

  useEffect(() => {
    if (!isActive) return;
    const onResize = () => measureTarget();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isActive, measureTarget]);

  // ── Keyboard navigation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skipTour();
      if (e.key === "ArrowRight") nextStep();
      if (e.key === "ArrowLeft") prevStep();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isActive, nextStep, prevStep, skipTour]);

  // ── Confetti on final step completion ─────────────────────────────────────────
  const handleComplete = () => {
    spawnConfetti();
    setTimeout(() => completeTour(), 300);
  };

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      nextStep();
    }
  };

  if (!isActive || !step) return null;

  // ── Clip-path backdrop with hole ──────────────────────────────────────────────
  const buildClipPath = (sp: SpotlightRect): string => {
    const r = 10; // border-radius of hole
    // Outer polygon (full screen) with inner rectangle cutout
    // We use the "evenodd" fill-rule trick via clip-path: path()
    // Simpler: use a clip-path that outlines the screen then the hole
    const { top: t, left: l, width: w, height: h } = sp;
    const b = t + h;
    const r2 = l + w;

    return `polygon(
      0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
      ${l}px ${t + r}px,
      ${l + r}px ${t}px,
      ${r2 - r}px ${t}px,
      ${r2}px ${t + r}px,
      ${r2}px ${b - r}px,
      ${r2 - r}px ${b}px,
      ${l + r}px ${b}px,
      ${l}px ${b - r}px,
      ${l}px ${t + r}px,
      0% 0%
    )`;
  };

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-[9000] pointer-events-none"
        style={{
          background: "rgba(2, 6, 23, 0.78)",
          clipPath: spotlight ? buildClipPath(spotlight) : undefined,
          transition: "clip-path 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}
      />

      {/* ── Spotlight border ring ── */}
      {spotlight && (
        <div
          className="fixed z-[9001] pointer-events-none rounded-[12px]"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow:
              "0 0 0 3px rgba(245, 158, 11, 0.85), 0 0 0 6px rgba(245, 158, 11, 0.2)",
            transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      )}

      {/* ── Tooltip card ── */}
      <div
        className="fixed z-[9002] pointer-events-auto"
        style={{
          ...cardStyle,
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning
            ? `${(cardStyle.transform as string) ?? ""} scale(0.96)`
            : ((cardStyle.transform as string) ?? "none"),
          transition: "opacity 0.2s ease, transform 0.2s ease",
        }}
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden select-none">
          {/* Progress bar */}
          <div className="h-1 bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full bg-amber-500 transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>

          <div className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl leading-none" aria-hidden>
                  {step.icon}
                </span>
                <div>
                  <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-0.5">
                    Step {currentStep + 1} of {totalSteps}
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    {step.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={skipTour}
                aria-label="Skip tour"
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition flex-shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {step.body}
            </p>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={skipTour}
                className="text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
              >
                Skip Tour
              </button>

              <div className="flex items-center gap-2">
                {!isFirstStep && (
                  <button
                    onClick={prevStep}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl transition shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {isLastStep ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      {step.actionLabel ?? "All Done!"}
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step dot indicators */}
        <div className="flex items-center justify-center gap-1 mt-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === currentStep ? 16 : 5,
                height: 5,
                background:
                  i === currentStep
                    ? "#f59e0b"
                    : i < currentStep
                      ? "#d97706"
                      : "rgba(148,163,184,0.4)",
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default OnboardingTour;
