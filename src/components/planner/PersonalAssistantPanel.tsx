import React, { useState, useMemo } from 'react';
import { PlannerEvent } from '@/types';
import {
  Sparkles,
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Volume2,
  ChevronRight,
  Send,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PersonalAssistantPanelProps {
  events: PlannerEvent[];
  projectName?: string;
  onSelectEvent: (event: PlannerEvent) => void;
  onQuickComplete?: (eventId: string) => void;
  onSnoozeEvent?: (eventId: string, days: number) => void;
  onOpenScheduleModal: () => void;
}

export const PersonalAssistantPanel: React.FC<PersonalAssistantPanelProps> = ({
  events,
  projectName = 'Current Project',
  onSelectEvent,
  onOpenScheduleModal,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'CRITICAL' | 'TODAY' | 'UPCOMING'>('ALL');
  const [query, setQuery] = useState('');
  const [assistantMessages, setAssistantMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `Good day! I'm your JQMS Quality & Construction Assistant for ${projectName}. I have analyzed your structural hold points, cube crush testing dates, and NCR deadlines. How can I assist your site schedule today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Categorize
  const { todayEvents, overdueEvents, upcomingEvents, criticalEvents } = useMemo(() => {
    const today: PlannerEvent[] = [];
    const overdue: PlannerEvent[] = [];
    const upcoming: PlannerEvent[] = [];
    const critical: PlannerEvent[] = [];

    events.forEach((evt) => {
      const isCompleted = evt.status === 'COMPLETED';
      if (isCompleted) return;

      if (evt.date === todayStr) {
        today.push(evt);
      } else if (evt.date < todayStr) {
        overdue.push(evt);
      } else {
        upcoming.push(evt);
      }

      if (evt.priority === 'CRITICAL') {
        critical.push(evt);
      }
    });

    return {
      todayEvents: today,
      overdueEvents: overdue,
      upcomingEvents: upcoming,
      criticalEvents: critical,
    };
  }, [events, todayStr]);

  // Filtered list
  const displayEvents = useMemo(() => {
    let list = events.filter((e) => e.status !== 'COMPLETED');
    if (filterType === 'CRITICAL') {
      list = list.filter((e) => e.priority === 'CRITICAL' || e.date < todayStr);
    } else if (filterType === 'TODAY') {
      list = list.filter((e) => e.date === todayStr);
    } else if (filterType === 'UPCOMING') {
      list = list.filter((e) => e.date > todayStr);
    }
    return list.slice(0, 15);
  }, [events, filterType, todayStr]);

  const handleTestSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
      toast.success('Audio notification chime tested!');
    } catch (e) {
      toast('Notification chime previewed');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query.trim();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAssistantMessages((prev) => [...prev, { sender: 'user', text: userText, time }]);
    setQuery('');

    // Rule-based instant replies
    setTimeout(() => {
      let reply = '';
      const lower = userText.toLowerCase();
      if (lower.includes('cube') || lower.includes('crush') || lower.includes('test')) {
        const cubeCount = events.filter((e) => e.eventType === 'CUBE_TEST_DUE').length;
        reply = `You have ${cubeCount} cube test milestones scheduled. ${overdueEvents.filter(e => e.eventType === 'CUBE_TEST_DUE').length} are overdue for crushing results entry.`;
      } else if (lower.includes('ncr') || lower.includes('non-conformance') || lower.includes('deadline')) {
        const ncrCount = events.filter((e) => e.eventType === 'NCR_DEADLINE').length;
        reply = `There are ${ncrCount} active NCR deadlines on record. ${overdueEvents.filter(e => e.eventType === 'NCR_DEADLINE').length} require immediate rectification sign-off.`;
      } else if (lower.includes('pour') || lower.includes('ptp') || lower.includes('concrete')) {
        const ptpCount = events.filter((e) => e.eventType === 'CONCRETE_POUR').length;
        reply = `Found ${ptpCount} Permit to Pour casting operations. Make sure rebar and formwork inspections are closed out before delivery.`;
      } else if (lower.includes('today') || lower.includes('schedule') || lower.includes('morning')) {
        reply = `Today's agenda has ${todayEvents.length} active tasks and ${overdueEvents.length} overdue items awaiting action.`;
      } else {
        reply = `Understood. I've recorded that for ${projectName}. You can click any event card below to inspect records, mark as complete, or reschedule.`;
      }

      setAssistantMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 400);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
      {/* Left Column: AI Daily Briefing & Proactive Reminders (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Morning Daily Briefing Hero Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/90 via-slate-900 to-slate-900 border border-indigo-500/30 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="w-32 h-32 text-indigo-400" />
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">
                  Personal Quality & Site Assistant
                </h2>
                <span className="text-xs text-indigo-200/80 font-mono">
                  Autonomous Quality Scheduler & Reminder Vault
                </span>
              </div>
            </div>

            <button
              onClick={handleTestSound}
              className="p-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-800/80 border border-indigo-500/30 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Test Sound Alert"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">Chime</span>
            </button>
          </div>

          {/* AI Executive Summary */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-indigo-500/20 backdrop-blur-md space-y-2">
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              <strong className="text-indigo-300">Daily QA Briefing:</strong> You have{' '}
              <span className="font-bold text-emerald-400">{todayEvents.length} events today</span>,{' '}
              <span className="font-bold text-rose-400">{overdueEvents.length} overdue hold points</span>, and{' '}
              <span className="font-bold text-cyan-400">{upcomingEvents.length} upcoming quality targets</span> across {projectName}.
            </p>

            {overdueEvents.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-indigo-500/20 text-rose-300 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400 animate-pulse" />
                <span>Urgent: {overdueEvents.length} items require your immediate sign-off or resolution!</span>
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-2">
            <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 text-center">
              <span className="text-[11px] text-slate-400 block font-medium">Critical Hold Points</span>
              <span className="text-xl font-mono font-black text-rose-400">{criticalEvents.length}</span>
            </div>
            <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 text-center">
              <span className="text-[11px] text-slate-400 block font-medium">Today's Actions</span>
              <span className="text-xl font-mono font-black text-emerald-400">{todayEvents.length}</span>
            </div>
            <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 text-center">
              <span className="text-[11px] text-slate-400 block font-medium">Next 7 Days</span>
              <span className="text-xl font-mono font-black text-indigo-400">{upcomingEvents.length}</span>
            </div>
          </div>
        </div>

        {/* Interactive Assistant Chat Stream */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Ask Quality Assistant
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Live Sync</span>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {assistantMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <input
              type="text"
              placeholder="Ask e.g. 'What cubes are due today?' or 'Any overdue NCRs?'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Proactive Action Stream (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-500" />
              Proactive Action Items ({displayEvents.length})
            </span>
            <button
              onClick={onOpenScheduleModal}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-bold"
            >
              + Add Event
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
            {(['ALL', 'CRITICAL', 'TODAY', 'UPCOMING'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterType(mode)}
                className={`flex-1 py-1 rounded-lg transition ${
                  filterType === mode
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Action List */}
          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {displayEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <span>No active reminder tasks in this view. All cleared!</span>
              </div>
            ) : (
              displayEvents.map((evt) => {
                const isOverdue = evt.date < todayStr;
                const isToday = evt.date === todayStr;

                return (
                  <div
                    key={evt.id}
                    onClick={() => onSelectEvent(evt)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col gap-2 hover:shadow-md ${
                      isOverdue
                        ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 hover:border-rose-400'
                        : isToday
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-400'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            isOverdue
                              ? 'bg-rose-500 text-white'
                              : isToday
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {isOverdue ? 'OVERDUE' : isToday ? 'TODAY' : evt.date}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {evt.time || 'All Day'}
                        </span>
                      </div>

                      {evt.priority === 'CRITICAL' && (
                        <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[9px] font-black border border-red-300 dark:border-red-800">
                          CRITICAL
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs line-clamp-2">
                      {evt.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/50">
                      <span>{evt.location || 'Site Location'}</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-0.5">
                        Details <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
