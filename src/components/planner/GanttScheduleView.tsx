import React from 'react';
import { PlannerEvent } from '@/types';

interface GanttScheduleViewProps {
  events: PlannerEvent[];
  currentDate: Date;
  onSelectEvent: (event: PlannerEvent) => void;
}

export const GanttScheduleView: React.FC<GanttScheduleViewProps> = ({
  events,
  currentDate,
  onSelectEvent,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-6 overflow-x-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-xs">
        <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          4D Quality Timeline Schedule ({monthName})
        </span>
        <span className="font-mono text-slate-400 text-[11px]">
          Days 01 - {daysInMonth}
        </span>
      </div>

      <div className="space-y-4 min-w-[700px]">
        {events.map((evt) => {
          const dayNum = parseInt((evt.date || '2026-09-08').split('-')[2] || '1', 10);
          const leftPercent = Math.min(Math.max((dayNum / daysInMonth) * 100, 2), 85);

          return (
            <div
              key={evt.id}
              onClick={() => onSelectEvent(evt)}
              className="space-y-1.5 cursor-pointer group"
            >
              <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold group-hover:text-brand-500 transition">{evt.title}</span>
                <span className="font-mono text-[11px] text-slate-400">
                  {evt.date} {evt.time || ''}
                </span>
              </div>
              <div className="relative h-7 bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <div
                  className={`absolute top-1 bottom-1 rounded-lg px-2 flex items-center text-[10px] font-bold text-white shadow transition-all group-hover:brightness-110 ${
                    evt.eventType === 'NCR_DEADLINE'
                      ? 'bg-rose-600'
                      : evt.eventType === 'CONCRETE_POUR'
                      ? 'bg-amber-600'
                      : evt.eventType === 'CUBE_TEST_DUE'
                      ? 'bg-emerald-600'
                      : 'bg-indigo-600'
                  }`}
                  style={{ left: `${leftPercent}%`, minWidth: '140px' }}
                >
                  <span className="truncate">{evt.eventType.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
