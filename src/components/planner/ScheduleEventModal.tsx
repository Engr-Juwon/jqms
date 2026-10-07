import React, { useState } from 'react';
import { PlannerEvent, PlannerEventType } from '@/types';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  Bell,
  Save,
  FileText,
  Layers,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ScheduleEventModalProps {
  isOpen: boolean;
  initialDate?: string;
  projectId: string;
  companyId?: string;
  onClose: () => void;
  onSave: (event: PlannerEvent) => Promise<void>;
}

const EVENT_TYPES: Array<{ type: PlannerEventType; label: string }> = [
  { type: 'INSPECTION', label: 'QA/QC Inspection' },
  { type: 'CONCRETE_POUR', label: 'Concrete Pour (PTP)' },
  { type: 'CUBE_TEST_DUE', label: 'Concrete Cube Crush Test' },
  { type: 'NCR_DEADLINE', label: 'NCR Rectification Deadline' },
  { type: 'RFI_DUE', label: 'RFI Consultant Response' },
  { type: 'MAR_DUE', label: 'Material Approval Review' },
  { type: 'DELIVERY', label: 'Material Batch Delivery' },
  { type: 'MILESTONE', label: 'Project Milestone Target' },
  { type: 'TOOLBOX_TALK', label: 'Toolbox Talk / Safety Briefing' },
  { type: 'AUDIT', label: 'Quality / Lab Audit' },
  { type: 'CUSTOM_REMINDER', label: 'Custom Reminder / Alarm' },
];

export const ScheduleEventModal: React.FC<ScheduleEventModalProps> = ({
  isOpen,
  initialDate,
  projectId,
  companyId,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<PlannerEventType>('INSPECTION');
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('08:00');
  const [location, setLocation] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [reminderMinutes, setReminderMinutes] = useState<number>(60);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter an event title');
      return;
    }

    setSubmitting(true);
    try {
      const newEvent: PlannerEvent = {
        id: `custom-evt-${Date.now()}`,
        projectId,
        companyId,
        title: title.trim(),
        eventType,
        date,
        time,
        location: location.trim() || undefined,
        assignedTo: assignedTo.trim() || undefined,
        priority,
        status: 'PENDING',
        reminderMinutes,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await onSave(newEvent);
      toast.success('Event scheduled successfully!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to schedule event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Schedule Quality Event & Reminder
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create hold points, inspections, milestones, or personal alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Event Title / Activity Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 7-Day Cube Crush Test - L2 Slab Pour"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Event Classification
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as PlannerEventType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="CRITICAL">Critical Hold Point</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Scheduled Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Target Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Site Location / Level
              </label>
              <input
                type="text"
                placeholder="e.g. Level 3 Core Walls, Grid B/4"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Assigned Personnel / Subcontractor
              </label>
              <input
                type="text"
                placeholder="e.g. Lead QAQC Engineer / Apex Rebar"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Assistant Reminder Alert
            </label>
            <select
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500"
            >
              <option value={0}>At time of event</option>
              <option value={15}>15 minutes before</option>
              <option value={60}>1 hour before</option>
              <option value={1440}>1 day before (Morning Briefing)</option>
              <option value={4320}>3 days before</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Action Notes / Hold Point Criteria
            </label>
            <textarea
              rows={3}
              placeholder="Provide specifications, checklist details, or test parameters..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 shadow-lg shadow-brand-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Scheduling...' : 'Save & Set Reminder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
