import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { Lottie } from 'lottie-react';

export interface HeroProps {
  title: string;
  subtitle: string;
  primaryCtaLabel: string;
  primaryCtaLink: string;
  secondaryCtaLabel?: string;
  secondaryCtaLink?: string;
  /** Optional badge text shown above the title */
  badge?: string;
}

/**
 * Full-width hero section with a Lottie JSON animation backdrop,
 * gradient overlay, headline, subtitle and up to two CTA buttons.
 *
 * The animation JSON is loaded lazily (via dynamic import in useEffect)
 * so it doesn't block the initial paint. The page gracefully falls back
 * to the CSS gradient if the animation file fails to load.
 */
export const Hero: React.FC<HeroProps> = ({
  title,
  subtitle,
  primaryCtaLabel,
  primaryCtaLink,
  secondaryCtaLabel,
  secondaryCtaLink,
  badge,
}) => {
  // Lazy-load the animation JSON so it doesn't bloat the main bundle
  const [animationData, setAnimationData] = React.useState<object | null>(null);

  React.useEffect(() => {
    import('@/assets/home-hero.json')
      .then((mod) => setAnimationData(mod.default ?? (mod as unknown as object)))
      .catch(() => {
        // Silently degrade — the gradient background still shows
      });
  }, []);

  return (
    <section
      className={clsx(
        'relative overflow-hidden',
        // CSS gradient — always visible, serves as fallback if Lottie fails
        'bg-gradient-to-br from-slate-50 via-slate-100 to-brand-50',
        'dark:from-slate-950 dark:via-slate-900 dark:to-slate-950',
      )}
      aria-label="Hero"
    >
      {/* ── Lottie animation backdrop ─────────────────────────────────── */}
      {animationData && (
        <div
          className="absolute inset-0 pointer-events-none select-none opacity-20 dark:opacity-10"
          aria-hidden="true"
        >
          <Lottie
            src={animationData}
            loop
            autoplay
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}

      {/* ── Gradient overlay (ensures text legibility over animation) ─── */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/60 to-slate-50 dark:via-slate-950/60 dark:to-slate-950 pointer-events-none"
        aria-hidden="true"
      />

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="relative px-6 lg:px-12 py-24 lg:py-36 max-w-5xl mx-auto flex flex-col items-center text-center gap-6">
        {/* Badge */}
        {badge && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-semibold animate-pulse">
            <span>{badge}</span>
          </div>
        )}

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight max-w-4xl">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          {subtitle}
        </p>

        {/* CTA buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to={primaryCtaLink}
            className="px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-bold text-sm shadow-xl shadow-brand-500/30 transition-all duration-150 flex items-center gap-2.5"
          >
            <span>{primaryCtaLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {secondaryCtaLabel && secondaryCtaLink && (
            <Link
              to={secondaryCtaLink}
              className="px-8 py-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm shadow-sm transition-all duration-150"
            >
              {secondaryCtaLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
