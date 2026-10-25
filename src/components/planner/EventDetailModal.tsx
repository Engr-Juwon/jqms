import React from 'react';
import { PlannerEvent } from '@/types';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { getEventTypeColorStyles, getEventTypeIcon } from './PlannerEventBadge';
import { toast } from 'react-hot-toast';

interface EventDetailModalProps {
  event: PlannerEvent | null;
  onClose: () => void;
  onStatusChange?: (eventId: string, status: string) => void;
  onSnooze?: (eventId: string, days: number) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onStatusChange,
}) => {
  const navigate = useNavigate();

  if (!event) return null;

  const styles = getEventTypeColorStyles(event.eventType, event.status);
  const Icon = getEventTypeIcon(event.eventType);

  const handleNavigateToSource = () => {
    if (!event.referenceId) return;

    if (event.eventType === 'INSPECTION') {
      navigate(`/project/inspections/${event.referenceId}`);
    } else if (event.eventType === 'CONCRETE_POUR') {
      navigate(`/project/permit-to-pour/${event.referenceId}`);
    } else if (event.eventType === 'CUBE_TEST_DUE') {
      navigate(`/project/concrete/${event.referenceId}`);
    } else if (event.eventType === 'NCR_DEADLINE') {
      navigate(`/project/ncr/${event.referenceId}`);
    } else if (event.eventType === 'RFI_DUE') {
      navigate(`/project/rfi/${event.referenceId}`);
    } else if (event.eventType === 'MAR_DUE') {
      navigate(`/project/mar/${event.referenceId}`);
    } else {
      navigate('/project/planner');
    }
    onClose();
  };

  const handleShare = () => {
    const text = `[JQMS Planner] ${event.title} - ${event.date} ${event.time || ''} (Priority: ${event.priority})`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success('Event details copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${styles.bg}`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${styles.pill}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono opacity-80">
                {event.eventType.replace(/_/g, ' ')}
              </span>
              <h3 className="font-bold text-base line-clamp-1">
                {event.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Scheduled Date</span>
              <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                {event.date}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Time / Window</span>
              <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                {event.time || 'All Day'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40">
              <span className="text-slate-500 dark:text-slate-400">Status</span>
              <span className="font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 font-mono">
                {event.status}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40">
              <span className="text-slate-500 dark:text-slate-400">Priority</span>
              <span className={`font-bold px-2 py-0.5 rounded ${
                event.priority === 'CRITICAL'
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
              }`}>
                {event.priority}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40">
                <span className="text-slate-500 dark:text-slate-400">Location</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {event.location}
                </span>
              </div>
            )}
            {event.assignedTo && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40">
                <span className="text-slate-500 dark:text-slate-400">Assigned To</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {event.assignedTo}
                </span>
              </div>
            )}
          </div>

          {event.notes && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">Notes:</span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{event.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleShare}
            className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Share Details"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            {event.referenceId && (
              <button
                onClick={handleNavigateToSource}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
              >
                <span>View Record</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            {onStatusChange && (
              <button
                onClick={() => {
                  onStatusChange(event.id, event.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED');
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{event.status === 'COMPLETED' ? 'Reopen' : 'Mark Done'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
