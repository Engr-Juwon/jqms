import React, { useState } from "react";
import { PlannerEvent } from "@/types";
import { PlannerEventBadge } from "./PlannerEventBadge";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

interface MonthCalendarGridProps {
  currentDate: Date;
  events: PlannerEvent[];
  onSelectEvent: (event: PlannerEvent) => void;
  onQuickSchedule: (dateStr: string) => void;
}

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export const MonthCalendarGrid: React.FC<MonthCalendarGridProps> = ({
  currentDate,
  events,
  onSelectEvent,
  onQuickSchedule,
}) => {
  const [overflowDate, setOverflowDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const formatLocalYYYYMMDD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatLocalYYYYMMDD(new Date());

  // Build true 35 or 42 calendar day cells (Monday-based)
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // 0 is Sunday, 1 is Monday ... so for Monday start:
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
  const totalDaysInMonth = lastDayOfMonth.getDate();

  const days: Array<{
    dateStr: string;
    dayNum: number;
    isCurrentMonth: boolean;
    isToday: boolean;
  }> = [];

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, d);
    const dateStr = formatLocalYYYYMMDD(prevDate);
    days.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Current month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const curDate = new Date(year, month, d);
    const dateStr = formatLocalYYYYMMDD(curDate);
    days.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // Next month leading days to complete grid (up to 35 or 42)
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    const nextDate = new Date(year, month + 1, d);
    const dateStr = formatLocalYYYYMMDD(nextDate);
    days.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Group events by date
  const eventsByDate = new Map<string, PlannerEvent[]>();
  events.forEach((evt) => {
    const d =
      evt.date || (evt as any).scheduledDate || (evt as any).targetDate || "";
    if (!d) return;
    const list = eventsByDate.get(d) || [];
    list.push(evt);
    eventsByDate.set(d, list);
  });

  const overflowEvents = overflowDate
    ? eventsByDate.get(overflowDate) || []
    : [];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
      {/* 7 Weekday Header row */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-center text-xs font-bold text-slate-500 dark:text-slate-400 py-3">
        {WEEKDAYS.map((day) => (
          <div key={day} className="tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid Cells */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-slate-800 bg-slate-200 dark:bg-slate-800">
        {days.map((cell) => {
          const dayEvents = eventsByDate.get(cell.dateStr) || [];
          const count = dayEvents.length;
          const maxVisible = 3;
          const visibleEvents = dayEvents.slice(0, maxVisible);
          const hasMore = count > maxVisible;

          return (
            <div
              key={cell.dateStr}
              onClick={(e) => {
                if ((e.target as HTMLElement).tagName === "BUTTON") return;
                onQuickSchedule(cell.dateStr);
              }}
              className={`min-h-[115px] p-2 bg-white dark:bg-slate-900 flex flex-col justify-between transition hover:bg-slate-50/80 dark:hover:bg-slate-850/60 group cursor-pointer ${
                !cell.isCurrentMonth
                  ? "opacity-40 bg-slate-50/50 dark:bg-slate-950/40"
                  : ""
              }`}
            >
              {/* Top Bar of Day Cell: Day Number & Event Count Badge */}
              <div className="flex items-center justify-between mb-1.5 pointer-events-none">
                {cell.isToday ? (
                  <span className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center shadow-md">
                    {cell.dayNum}
                  </span>
                ) : (
                  <span
                    className={`text-xs font-semibold ${
                      cell.isCurrentMonth
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-slate-400 dark:text-slate-600"
                    }`}
                  >
                    {cell.dayNum}
                  </span>
                )}

                {count > 0 && (
                  <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
                    {count}
                  </span>
                )}
              </div>

              {/* Event Badges List inside cell */}
              <div className="flex-1 space-y-1 overflow-hidden">
                {visibleEvents.map((evt) => (
                  <PlannerEventBadge
                    key={evt.id}
                    event={evt}
                    onClick={() => onSelectEvent(evt)}
                  />
                ))}

                {hasMore && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOverflowDate(cell.dateStr);
                    }}
                    className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline pt-0.5 block"
                  >
                    +{count - maxVisible} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overflow Modal for "+X more" events on a single date */}
      {overflowDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-sm">
                  Scheduled Events for {overflowDate}
                </h4>
                <span className="text-xs text-slate-500 font-mono">
                  {overflowEvents.length} events found
                </span>
              </div>
              <button
                onClick={() => setOverflowDate(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {overflowEvents.map((evt) => (
                <PlannerEventBadge
                  key={evt.id}
                  event={evt}
                  onClick={() => {
                    setOverflowDate(null);
                    onSelectEvent(evt);
                  }}
                />
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  const d = overflowDate;
                  setOverflowDate(null);
                  onQuickSchedule(d);
                }}
                className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-400 text-slate-950 text-xs font-bold rounded-xl transition"
              >
                + Schedule On This Day
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
