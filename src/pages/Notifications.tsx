import React, { useState } from 'react';
import { Bell, Check, CheckCheck, AlertTriangle, FileText, CheckCircle2, Trash2 } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: 'ALERT' | 'INFO' | 'SUCCESS' | 'WARNING';
  timestamp: string;
  read: boolean;
  link?: string;
}

const DEFAULT_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'notif-1',
    title: 'CRITICAL Non-Conformance Escalated',
    message: 'NCR-2024-001 (Column Honeycombing & Voids) has been raised for Level L04 Grid C-3.',
    type: 'ALERT',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    link: '/project/ncrs',
  },
  {
    id: 'notif-2',
    title: 'Permit to Pour (PTP) Authorized',
    message: 'PTP-2024-001 for Level L04 Slab Pour 2 has received all 4 mandatory clearances.',
    type: 'SUCCESS',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    read: false,
    link: '/project/permit-to-pour',
  },
  {
    id: 'notif-3',
    title: 'Consultant MAR Review Received',
    message: 'MAR-2024-001 (Epoxy Rebar Grouting Mortar) returned with Code A (Approved).',
    type: 'INFO',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    read: true,
    link: '/project/mar',
  },
  {
    id: 'notif-4',
    title: '28-Day Concrete Cube Test Due',
    message: 'CUBE-2024-001 batch set is scheduled for compressive crushing testing today.',
    type: 'WARNING',
    timestamp: new Date(Date.now() - 96400000).toISOString(),
    read: true,
    link: '/project/concrete',
  },
];

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<InAppNotification[]>(DEFAULT_NOTIFICATIONS);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
            <Bell className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Notifications & Quality Alerts</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              {unreadCount} unread system notifications and escalation triggers
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-sm"
          >
            <CheckCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
            No notifications available
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                n.read
                  ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400'
                  : 'bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-500/30 text-slate-900 dark:text-white shadow-sm dark:shadow-lg dark:shadow-indigo-500/5'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${
                  n.type === 'ALERT' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' :
                  n.type === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                  n.type === 'WARNING' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                  'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                }`}>
                  {n.type === 'ALERT' ? <AlertTriangle className="w-5 h-5" /> :
                   n.type === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5" /> :
                   <FileText className="w-5 h-5" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-bold ${n.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>{n.title}</h3>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-500"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{n.message}</p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 block">
                    {new Date(n.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    title="Mark as read"
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(n.id)}
                  title="Delete"
                  className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
