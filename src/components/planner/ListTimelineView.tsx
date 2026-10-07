import React from 'react';
import { PlannerEvent } from '@/types';
import { getEventTypeColorStyles, getEventTypeIcon } from './PlannerEventBadge';
import { Calendar, ChevronRight } from 'lucide-react';

interface ListTimelineViewProps {
  events: PlannerEvent[];
  onSelectEvent: (event: PlannerEvent) => void;
}

export const ListTimelineView: React.FC<ListTimelineViewProps> = ({
  events,
  onSelectEvent,
}) => {
  if (events.length === 0) {
    return (
      <div className="p-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
        <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Quality Events Found</h4>
        <p className="text-slate-500 text-xs mt-1">Adjust your filters or schedule a new event to populate the planner.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {events.map((evt) => {
        const styles = getEventTypeColorStyles(evt.eventType, evt.status);
        const Icon = getEventTypeIcon(evt.eventType);

        // Safe Date Parsing
        const rawDateStr = evt.date || (evt as any).scheduledDate || (evt as any).targetDate || '2026-09-08';
        let monthStr = 'SEP';
        let dayStr = '08';
        try {
          const parsed = new Date(rawDateStr);
          if (!isNaN(parsed.getTime())) {
            monthStr = parsed.toLocaleDateString('en-US', { month: 'short' });
            dayStr = String(parsed.getDate()).padStart(2, '0');
          } else if (rawDateStr.includes('-')) {
            const parts = rawDateStr.split('-');
            dayStr = parts[2] || '01';
          }
        } catch {
          monthStr = 'SEP';
          dayStr = '08';
        }

        return (
          <div
            key={evt.id}
            onClick={() => onSelectEvent(evt)}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 dark:hover:border-brand-500/50 shadow-md hover:shadow-xl transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              {/* Date badge */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center min-w-[75px] text-center flex-shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                  {monthStr}
                </span>
                <span className="font-mono font-black text-slate-900 dark:text-slate-100 text-base">
                  {dayStr}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {evt.time || 'All Day'}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles.bg}`}>
                    {(evt.eventType || 'EVENT').replace(/_/g, ' ')}
                  </span>
                  {evt.priority === 'CRITICAL' && (
                    <span className="px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-black">
                      CRITICAL
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {evt.title}
                </h3>

                <div className="text-slate-500 dark:text-slate-400 text-xs mt-1 flex flex-wrap items-center gap-3">
                  <span>Location: <strong className="text-slate-700 dark:text-slate-300">{evt.location || 'Site Wide'}</strong></span>
                  <span>•</span>
                  <span>Assigned: <strong className="text-slate-700 dark:text-slate-300">{evt.assignedTo || 'QA/QC Team'}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold ${
                evt.status === 'COMPLETED'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}>
                {evt.status || 'PENDING'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
