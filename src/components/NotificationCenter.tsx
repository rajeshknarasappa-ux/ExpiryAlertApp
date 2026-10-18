import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  RefreshCw,
  Mail,
  Check,
  Send,
  Sparkles
} from 'lucide-react';
import { NotificationLog } from '../types/index.ts';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationLog[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onTriggerCheck: () => Promise<void>;
  userEmail: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onTriggerCheck,
  userEmail,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [testSentMessage, setTestSentMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      await onTriggerCheck();
      setTestSentMessage('Expiration audit completed! Notification logs updated.');
      setTimeout(() => setTestSentMessage(null), 4000);
    } catch (e: any) {
      alert('Check failed: ' + e.message);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-amber-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Notification Logs & Alerts</h2>
              <p className="text-xs text-slate-500">
                Automated background expiration checks for {userEmail}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-2.5 bg-slate-50/50 border-b border-slate-200/60 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleManualCheck}
              disabled={isChecking}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs disabled:opacity-50 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Running Check...' : 'Run Scheduled Check Now'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-slate-600 hover:text-slate-900 hover:underline"
              >
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-rose-600 hover:text-rose-700 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Feedback message banner */}
        {testSentMessage && (
          <div className="mx-6 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{testSentMessage}</span>
          </div>
        )}

        {/* Notification Logs List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Bell className="w-10 h-10 mx-auto stroke-1 opacity-50" />
              <p className="text-sm font-medium text-slate-600">No expiration notifications yet</p>
              <p className="text-xs text-slate-400">
                You're in great shape! Alerts will appear here when items near their expiry date.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isOverdue = notif.alertType === 'OVERDUE';
              const isToday = notif.alertType === 'EXPIRED_TODAY';

              return (
                <div
                  key={notif.id}
                  onClick={() => onMarkRead(notif.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                    notif.isRead
                      ? 'bg-slate-50/50 border-slate-200 text-slate-600 opacity-80'
                      : 'bg-white border-amber-200 shadow-xs text-slate-900'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isOverdue
                        ? 'bg-rose-100 text-rose-600'
                        : isToday
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {isOverdue ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : isToday ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {notif.itemName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(notif.triggeredAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center space-x-2 mt-2 text-[10px] text-slate-400">
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Mail className="w-3 h-3 text-slate-400" />
                        Dispatched to {notif.recipientEmail}
                      </span>
                      {!notif.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Scheduled automated checks run in background every 30 minutes.</span>
        </div>

      </div>
    </div>
  );
};
