import React from 'react';
import { LucideIcon, CheckCircle2 } from 'lucide-react';

export interface Benefit {
  icon?: LucideIcon;
  title: string;
  description: string;
}

interface BenefitsSectionProps {
  headline?: string;
  subheading?: string;
  benefits: Benefit[];
}

export const BenefitsSection: React.FC<BenefitsSectionProps> = ({
  headline = 'Why Teams Choose JQMS Enterprise',
  subheading = 'Purpose-built for civil engineering and high-rise construction projects.',
  benefits,
}) => {
  return (
    <section className="py-20 px-6 lg:px-12 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {headline}
          </h2>
          {subheading && (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              {subheading}
            </p>
          )}
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, idx) => {
            const Icon = benefit.icon ?? CheckCircle2;
            return (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
