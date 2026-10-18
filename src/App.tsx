import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Camera,
  Sparkles,
  TrendingDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
  Settings,
  Leaf,
  Layers,
  RefreshCw,
  Info,
  DollarSign,
  Globe,
  Share2,
  Smartphone,
  QrCode,
  Download
} from 'lucide-react';
import { Item, NotificationLog, UserSettings, InventoryStats } from './types/index.ts';
import { AddItemModal } from './components/AddItemModal.tsx';
import { ItemDetailModal } from './components/ItemDetailModal.tsx';
import { PriorityQueue } from './components/PriorityQueue.tsx';
import { InventoryView } from './components/InventoryView.tsx';
import { NotificationCenter } from './components/NotificationCenter.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { ImpactStatsModal } from './components/ImpactStatsModal.tsx';
import { ShareLinkModal } from './components/ShareLinkModal.tsx';
import { InstallModal } from './components/InstallModal.tsx';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const SHARED_APP_URL = 'https://ais-pre-nzkqb4ee55s24hqxp6ji5q-731522841987.asia-northeast1.run.app';
const DEV_APP_URL = 'https://ais-dev-nzkqb4ee55s24hqxp6ji5q-731522841987.asia-northeast1.run.app';

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    email: 'rajeshknarasappa@gmail.com',
    name: 'Rajesh K',
    emailAlertsEnabled: true,
    pushAlertsEnabled: true,
    alertDaysAdvance: [7, 3, 1, 0],
    notificationTime: '08:30',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Fetch all initial data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [itemsRes, statsRes, notifsRes, settingsRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/stats'),
        fetch('/api/notifications'),
        fetch('/api/settings'),
      ]);

      const [itemsData, statsData, notifsData, settingsData] = await Promise.all([
        itemsRes.json(),
        statsRes.json(),
        notifsRes.json(),
        settingsRes.json(),
      ]);

      if (itemsData.success) setItems(itemsData.items);
      if (statsData.success) setStats(statsData.stats);
      if (notifsData.success) setNotifications(notifsData.notifications);
      if (settingsData.success) setSettings(settingsData.settings);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Periodic refresh every 60 seconds
    const interval = setInterval(loadData, 60000);

    // Detect standalone mode (already installed PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      setIsInstallModalOpen(true);
    }
  };

  // Handlers
  const handleItemAdded = (newItem: Item) => {
    setItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
    loadData();
  };

  const handleConsume = async (id: string) => {
    try {
      const item = items.find((i) => i.id === id);
      const newStatus = !item?.isConsumed;
      const res = await fetch(`/api/items/${id}/consume`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isConsumed: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.map((it) => (it.id === id ? data.item : it)));
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        if (selectedItem?.id === id) setSelectedItem(null);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Item>) => {
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.map((it) => (it.id === id ? data.item : it)));
        setSelectedItem(data.item);
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearNotifications = async () => {
    try {
      await fetch('/api/notifications/clear', { method: 'DELETE' });
      setNotifications([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerAudit = async () => {
    const res = await fetch('/api/notifications/check', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      setNotifications(data.notifications);
    }
  };

  const handleSaveSettings = async (newSettings: Partial<UserSettings>) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    const data = await res.json();
    if (data.success) {
      setSettings(data.settings);
    }
  };

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
                  ExpiryAlert
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-100 text-emerald-800 tracking-wider">
                  AI OCR Vision
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Smart household inventory, spoilage prevention & automated alerts
              </p>
            </div>
          </div>

          {/* Right Nav Action Items */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Waste Reduction Pill */}
            {stats && (
              <button
                onClick={() => setIsImpactModalOpen(true)}
                className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-800 text-xs font-semibold transition"
              >
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span>{stats.wasteAvoidedPercent}% Waste Avoided</span>
              </button>
            )}

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotifCenterOpen(true)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              title="Notifications & Expiry Logs"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {unreadNotifs}
                </span>
              )}
            </button>

            {/* Settings */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Website Link / Share */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              title="Get live website link and mobile QR code"
            >
              <Globe className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Website Link</span>
            </button>

            {/* Add Item Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>

          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 sm:pb-12">

        {/* Quick Metric Stats Banner */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Total Items */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <Package className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Total Items</span>
                <span className="text-xl font-bold text-slate-900">{stats.total}</span>
              </div>
            </div>

            {/* Expiring Soon */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Expiring Soon (≤3d)</span>
                <span className="text-xl font-bold text-amber-700">{stats.expiringSoon}</span>
              </div>
            </div>

            {/* Expired Overdue */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Expired (Action Needed)</span>
                <span className="text-xl font-bold text-rose-700">{stats.expired}</span>
              </div>
            </div>

            {/* Consumed / Prevented Spoilage */}
            <div
              onClick={() => setIsImpactModalOpen(true)}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center space-x-3.5 cursor-pointer hover:border-emerald-300 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block group-hover:text-emerald-700">
                  Consumed (Saved)
                </span>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xl font-bold text-emerald-700">{stats.consumed}</span>
                  <span className="text-[11px] font-medium text-emerald-600">
                    (~${stats.moneySavedEstimate.toFixed(0)} saved)
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Priority / Urgent Action Queue */}
        <PriorityQueue
          items={items}
          onConsume={handleConsume}
          onDelete={handleDelete}
          onSelect={setSelectedItem}
        />

        {/* Main Inventory Component with Category Filters & Search */}
        <InventoryView
          items={items}
          onConsume={handleConsume}
          onDelete={handleDelete}
          onSelect={setSelectedItem}
          onAddNew={() => setIsAddModalOpen(true)}
        />

      </main>

      {/* Modals */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onItemAdded={handleItemAdded}
      />

      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onConsume={handleConsume}
      />

      <NotificationCenter
        isOpen={isNotifCenterOpen}
        onClose={() => setIsNotifCenterOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onClearAll={handleClearNotifications}
        onTriggerCheck={handleTriggerAudit}
        userEmail={settings.email}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      <ImpactStatsModal
        isOpen={isImpactModalOpen}
        onClose={() => setIsImpactModalOpen(false)}
        stats={stats}
      />

      <ShareLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        sharedUrl={SHARED_APP_URL}
        devUrl={DEV_APP_URL}
      />

      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onNativeInstall={handleInstallClick}
        canNativeInstall={!!deferredPrompt}
        isIOS={isIOS}
        isInstalled={isInstalled}
      />

      {/* Floating Install App Button for Desktop/Tablet */}
      {!isInstalled && (
        <div className="hidden sm:block fixed bottom-6 right-6 z-30">
          <button
            onClick={handleInstallClick}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs shadow-lg shadow-emerald-600/30 border border-emerald-500/50 transition group"
            title="Install ExpiryAlert as a desktop or mobile application"
          >
            <Download className="w-4 h-4 group-hover:animate-bounce" />
            <span>Install App</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} ExpiryAlert • AI-Powered Expiration Tracking & Waste Prevention</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-slate-400">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="hover:text-emerald-700 text-emerald-600 font-semibold underline flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Open Web Link</span>
            </button>
            <span>•</span>
            <span>Powered by Gemini 3.8 Flash Vision</span>
            <span>•</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-slate-600 underline"
            >
              Alert Settings ({settings.email})
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-3 py-2 shadow-lg flex items-center justify-around">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center justify-center text-slate-600 hover:text-emerald-600 p-1"
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] font-semibold mt-0.5">Inventory</span>
        </button>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex flex-col items-center justify-center -mt-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full w-12 h-12 shadow-lg shadow-emerald-500/30 active:scale-95 transition"
        >
          <Camera className="w-6 h-6" />
        </button>

        <button
          onClick={() => setIsNotifCenterOpen(true)}
          className="flex flex-col items-center justify-center text-slate-600 hover:text-emerald-600 p-1 relative"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifs > 0 && (
            <span className="absolute top-0 right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadNotifs}
            </span>
          )}
          <span className="text-[10px] font-semibold mt-0.5">Alerts</span>
        </button>

        {/* Install Button at Bottom */}
        <button
          onClick={handleInstallClick}
          className="flex flex-col items-center justify-center text-emerald-700 hover:text-emerald-800 p-1"
        >
          <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-xs">
            <Download className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold mt-0.5 text-emerald-800">Install</span>
        </button>
      </nav>

    </div>
  );
}
