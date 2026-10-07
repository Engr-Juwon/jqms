import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

export interface FeatureCardProps {
  /** Lucide icon component */
  icon: LucideIcon;
  title: string;
  description: string;
  /** Tailwind colour token prefix (e.g. "brand", "amber", "emerald") */
  accentColor?: 'brand' | 'amber' | 'emerald' | 'sky' | 'violet' | 'rose';
  /** When true the card is visually elevated as the primary/highlighted feature */
  featured?: boolean;
  /** Optional route to navigate to on click */
  href?: string;
}

const accentMap: Record<NonNullable<FeatureCardProps['accentColor']>, {
  bg: string;
  border: string;
  hoverBorder: string;
  icon: string;
}> = {
  brand:   { bg: 'bg-brand-500/10 dark:bg-brand-500/15',   border: 'border-brand-500/20',   hoverBorder: 'hover:border-brand-500/50',   icon: 'text-brand-600 dark:text-brand-400' },
  amber:   { bg: 'bg-amber-500/10 dark:bg-amber-500/15',   border: 'border-amber-500/20',   hoverBorder: 'hover:border-amber-500/50',   icon: 'text-amber-600 dark:text-amber-400' },
  emerald: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', border: 'border-emerald-500/20', hoverBorder: 'hover:border-emerald-500/50', icon: 'text-emerald-600 dark:text-emerald-400' },
  sky:     { bg: 'bg-sky-500/10 dark:bg-sky-500/15',       border: 'border-sky-500/20',     hoverBorder: 'hover:border-sky-500/50',     icon: 'text-sky-600 dark:text-sky-400' },
  violet:  { bg: 'bg-violet-500/10 dark:bg-violet-500/15', border: 'border-violet-500/20',  hoverBorder: 'hover:border-violet-500/50',  icon: 'text-violet-600 dark:text-violet-400' },
  rose:    { bg: 'bg-rose-500/10 dark:bg-rose-500/15',     border: 'border-rose-500/20',    hoverBorder: 'hover:border-rose-500/50',    icon: 'text-rose-600 dark:text-rose-400' },
};

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  accentColor = 'brand',
  featured = false,
  href,
}) => {
  const accent = accentMap[accentColor];

  const card = (
    <div
      className={clsx(
        'group relative flex flex-col gap-4 p-6 rounded-2xl border transition-all duration-200',
        'bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-none',
        accent.border,
        accent.hoverBorder,
        featured && [
          'ring-2 ring-brand-500/30 dark:ring-brand-400/20',
          'shadow-lg shadow-brand-500/10',
        ],
      )}
    >
      {featured && (
        <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-[10px] font-bold tracking-wide uppercase">
          Primary
        </span>
      )}

      {/* Icon container */}
      <div
        className={clsx(
          'w-12 h-12 rounded-xl border flex items-center justify-center transition-transform duration-200 group-hover:scale-110',
          accent.bg,
          accent.border,
          accent.icon,
        )}
      >
        <Icon className="w-6 h-6" />
      </div>

      {/* Text */}
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block no-underline">
        {card}
      </a>
    );
  }

  return card;
};

export default FeatureCard;
