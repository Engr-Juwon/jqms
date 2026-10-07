import { InspectionItem, RiskLevel } from '@/types';
import { AlertTriangle, AlertOctagon, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const computeQualityScore = (items: InspectionItem[] = []): number => {
  if (!items || items.length === 0) return 100;
  const scoredItems = items.filter((i) => i.result && i.result !== 'NA');
  if (scoredItems.length === 0) return 100;

  let totalWeight = 0;
  let earnedWeight = 0;

  scoredItems.forEach((i) => {
    const w = i.weight || (i.critical ? 5 : 2);
    totalWeight += w;
    if (i.result === 'PASS') {
      earnedWeight += w;
    } else if (i.result === 'OBSERVATION') {
      earnedWeight += w * 0.5;
    }
  });

  return totalWeight === 0 ? 100 : Math.round((earnedWeight / totalWeight) * 100);
};

export const computePassRate = (items: InspectionItem[] = []): number => {
  if (!items || items.length === 0) return 0;
  const completed = items.filter((i) => i.result && i.result !== 'NA');
  if (completed.length === 0) return 0;
  const passed = completed.filter((i) => i.result === 'PASS').length;
  return Math.round((passed / completed.length) * 100);
};

export const computeRiskLevel = (items: InspectionItem[] = []): RiskLevel => {
  const critFails = items.filter((i) => i.critical && i.result === 'FAIL').length;
  const fails = items.filter((i) => i.result === 'FAIL').length;

  if (critFails > 0) return 'CRITICAL';
  if (fails >= 3) return 'HIGH';
  if (fails > 0) return 'MEDIUM';
  return 'LOW';
};

export const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-700' },
  PENDING_REVIEW: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-800' },
  APPROVED: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800' },
  CLOSED: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-800' },
  REJECTED: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-800' },
};

export const RISK_STYLES: Record<string, { bg: string; text: string; label: string; border: string; icon: any }> = {
  LOW: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400', label: 'Low Risk', border: 'border-emerald-200 dark:border-emerald-800', icon: CheckCircle2 },
  MEDIUM: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400', label: 'Medium Risk', border: 'border-amber-200 dark:border-amber-800', icon: AlertTriangle },
  HIGH: { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-400', label: 'High Risk', border: 'border-orange-200 dark:border-orange-800', icon: AlertOctagon },
  CRITICAL: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-400', label: 'Critical Risk', border: 'border-rose-200 dark:border-rose-800', icon: ShieldAlert },
};
