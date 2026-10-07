import React from 'react';
import { PlannerEvent, PlannerEventType } from '@/types';
import {
  ClipboardCheck,
  AlertTriangle,
  Flame,
  FileQuestion,
  FileCheck,
  MessageSquare,
  FlaskConical,
  Truck,
  Flag,
  CheckSquare,
  Users,
  ShieldAlert,
  Bell,
} from 'lucide-react';

interface PlannerEventBadgeProps {
  event: PlannerEvent;
  onClick?: () => void;
  compact?: boolean;
}

export const getEventTypeColorStyles = (type: PlannerEventType, status?: string) => {
  const isRejected = status === 'REJECTED';

  if (isRejected) {
    return {
      bg: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      pill: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
      dot: 'bg-slate-500',
    };
  }

  switch (type) {
    case 'INSPECTION':
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 dark:hover:bg-blue-900/40',
        pill: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
        dot: 'bg-blue-500',
      };
    case 'CONCRETE_POUR':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 dark:hover:bg-amber-900/40',
        pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
        dot: 'bg-amber-500',
      };
    case 'CUBE_TEST_DUE':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 dark:hover:bg-emerald-900/40',
        pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'NCR_DEADLINE':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 dark:hover:bg-rose-900/40',
        pill: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
        dot: 'bg-rose-500',
      };
    case 'RFI_DUE':
      return {
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60 dark:hover:bg-indigo-900/40',
        pill: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200',
        dot: 'bg-indigo-500',
      };
    case 'MAR_DUE':
      return {
        bg: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60 dark:hover:bg-teal-900/40',
        pill: 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200',
        dot: 'bg-teal-500',
      };
    case 'DELIVERY':
      return {
        bg: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60 dark:hover:bg-orange-900/40',
        pill: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200',
        dot: 'bg-orange-500',
      };
    case 'MILESTONE':
      return {
        bg: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60 dark:hover:bg-purple-900/40',
        pill: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200',
        dot: 'bg-purple-500',
      };
    default:
      return {
        bg: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/60 dark:hover:bg-cyan-900/40',
        pill: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-200',
        dot: 'bg-cyan-500',
      };
  }
};

export const getEventTypeIcon = (type: PlannerEventType) => {
  switch (type) {
    case 'INSPECTION':
      return ClipboardCheck;
    case 'CONCRETE_POUR':
      return Flame;
    case 'CUBE_TEST_DUE':
      return FlaskConical;
    case 'NCR_DEADLINE':
      return AlertTriangle;
    case 'RFI_DUE':
      return FileQuestion;
    case 'MAR_DUE':
      return FileCheck;
    case 'SITE_COMMENT_DUE':
      return MessageSquare;
    case 'DELIVERY':
      return Truck;
    case 'MILESTONE':
      return Flag;
    case 'TASK':
      return CheckSquare;
    case 'TOOLBOX_TALK':
      return Users;
    case 'AUDIT':
      return ShieldAlert;
    default:
      return Bell;
  }
};

export const PlannerEventBadge: React.FC<PlannerEventBadgeProps> = ({
  event,
  onClick,
  compact = false,
}) => {
  const styles = getEventTypeColorStyles(event.eventType, event.status);
  const timePrefix = event.time ? `${event.time} ` : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-md border px-2 py-0.5 text-[11px] font-semibold transition flex items-center gap-1.5 truncate shadow-sm ${styles.bg}`}
      title={`${event.title} (${event.date} ${event.time || ''}) - ${event.status}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${styles.dot}`} />
      {timePrefix && (
        <span className="font-mono text-[10px] opacity-80 flex-shrink-0">
          {timePrefix}
        </span>
      )}
      <span className="truncate font-medium flex-1">
        {event.title}
      </span>
      {event.priority === 'CRITICAL' && (
        <span className="px-1 py-0.2 rounded bg-red-600 text-white text-[9px] font-bold uppercase flex-shrink-0">
          !
        </span>
      )}
    </button>
  );
};
