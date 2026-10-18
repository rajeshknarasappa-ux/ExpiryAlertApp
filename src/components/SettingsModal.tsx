import React, { useState } from 'react';
import { X, Mail, Bell, Clock, Check, Shield, Save } from 'lucide-react';
import { UserSettings } from '../types/index.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: Partial<UserSettings>) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  if (!isOpen) return null;

  const [email, setEmail] = useState(settings.email);
  const [name, setName] = useState(settings.name);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(settings.emailAlertsEnabled);
  const [pushAlertsEnabled, setPushAlertsEnabled] = useState(settings.pushAlertsEnabled);
  const [alertDays, setAlertDays] = useState<number[]>(settings.alertDaysAdvance || [7, 3, 1, 0]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleDay = (day: number) => {
    if (alertDays.includes(day)) {
      setAlertDays(alertDays.filter((d) => d !== day));
    } else {
      setAlertDays([...alertDays, day].sort((a, b) => b - a));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        email,
        name,
        emailAlertsEnabled,
        pushAlertsEnabled,
        alertDaysAdvance: alertDays,
      });
      onClose();
    } catch (e: any) {
      alert('Failed to save settings: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Notification Settings</h2>
              <p className="text-xs text-slate-500">Configure reminder triggers & delivery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-sm">
          {/* User Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recipient Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-xl text-xs sm:text-sm font-mono text-slate-800"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Expiry alerts and daily digests will be sent to this inbox.
            </p>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-slate-800">Email Expiry Alerts</span>
              <input
                type="checkbox"
                checked={emailAlertsEnabled}
                onChange={(e) => setEmailAlertsEnabled(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-semibold text-slate-800">Browser In-App Reminders</span>
              <input
                type="checkbox"
                checked={pushAlertsEnabled}
                onChange={(e) => setPushAlertsEnabled(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </label>
          </div>

          {/* Alert Intervals */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Send Alert Reminders At:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { days: 7, label: '7 days before' },
                { days: 3, label: '3 days before' },
                { days: 1, label: '1 day before' },
                { days: 0, label: 'On day of expiry' },
              ].map(({ days, label }) => {
                const active = alertDays.includes(days);
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => toggleDay(days)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition ${
                      active
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{label}</span>
                    {active && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
