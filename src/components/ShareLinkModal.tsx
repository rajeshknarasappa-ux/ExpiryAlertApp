import React, { useState } from 'react';
import {
  X,
  Globe,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Smartphone,
  Share2,
  Bookmark,
  ShieldCheck,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedUrl: string;
  devUrl: string;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  onClose,
  sharedUrl,
  devUrl,
}) => {
  const [copiedDev, setCopiedDev] = useState(false);
  const [copiedShared, setCopiedShared] = useState(false);
  const [copiedTiny, setCopiedTiny] = useState(false);
  const [activeTab, setActiveTab] = useState<'mobile' | 'links' | 'troubleshoot'>('mobile');

  // Real active TinyURL generated for dev environment
  const tinyUrl = 'https://tinyurl.com/23czbv9n';

  if (!isOpen) return null;

  const handleCopy = (text: string, type: 'dev' | 'shared' | 'tiny') => {
    navigator.clipboard.writeText(text);
    if (type === 'dev') {
      setCopiedDev(true);
      setTimeout(() => setCopiedDev(false), 3000);
    } else if (type === 'shared') {
      setCopiedShared(true);
      setTimeout(() => setCopiedShared(false), 3000);
    } else {
      setCopiedTiny(true);
      setTimeout(() => setCopiedTiny(false), 3000);
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    tinyUrl
  )}&color=059669`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Open on Your Phone</h2>
              <p className="text-xs text-slate-500">Scan QR or use direct link on mobile browser</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-white overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'mobile'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan QR Code (Phone)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('links')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'links'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Direct Website URLs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('troubleshoot')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'troubleshoot'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why did my phone fail to open?</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {activeTab === 'mobile' ? (
            <div className="space-y-4 text-center">
              
              {/* QR Code */}
              <div className="flex flex-col items-center">
                <div className="p-3.5 bg-white rounded-2xl border-2 border-emerald-500/40 shadow-md inline-block">
                  <img
                    src={qrCodeUrl}
                    alt="Scan with phone camera to open ExpiryAlert"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                </div>
                <div className="mt-3">
                  <p className="text-sm font-bold text-slate-900">
                    Point your phone's camera at this QR code
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Opens <strong>tinyurl.com/23czbv9n</strong> directly on your mobile browser
                  </p>
                </div>
              </div>

              {/* One-click short link */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="font-mono text-emerald-800 font-semibold">{tinyUrl}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(tinyUrl, 'tiny')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-medium text-slate-700 flex items-center gap-1"
                  >
                    {copiedTiny ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTiny ? 'Copied' : 'Copy'}</span>
                  </button>
                  <a
                    href={tinyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 bg-slate-800 hover:bg-black text-white rounded-lg"
                    title="Open on this device"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Mobile Install tip */}
              <div className="text-left bg-emerald-50 rounded-xl p-3.5 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <strong>💡 Tip: Add to Home Screen</strong>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Once opened on your phone, tap <strong>Share → "Add to Home Screen"</strong> (Safari) or <strong>⋮ → "Install app"</strong> (Chrome). You can now open ExpiryAlert anytime without typing any URL!
                </p>
              </div>

            </div>
          ) : activeTab === 'links' ? (
            <div className="space-y-4">
              
              {/* Development App URL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Development Sandbox Link (Active Now):
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    Online
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 truncate select-all">
                    {devUrl}
                  </div>
                  <button
                    onClick={() => handleCopy(devUrl, 'dev')}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs"
                  >
                    {copiedDev ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDev ? 'Copied' : 'Copy'}</span>
                  </button>
                  <a
                    href={devUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800 hover:bg-black text-white rounded-xl text-xs"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Shared App URL */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Public Share URL (After clicking "Share" in AI Studio):
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    Published Instance
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 truncate select-all">
                    {sharedUrl}
                  </div>
                  <button
                    onClick={() => handleCopy(sharedUrl, 'shared')}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs"
                  >
                    {copiedShared ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedShared ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* TROUBLESHOOTING TAB */
            <div className="space-y-3.5 text-xs text-slate-700">
              
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="text-amber-950 block font-bold">
                    Why the link didn't open on your phone:
                  </strong>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    AI Studio links are secured by Google. To open them on your mobile phone, one of two things must happen:
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                      1
                    </span>
                    <strong className="text-slate-900">Log in to your Google Account on your phone browser</strong>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-7 leading-relaxed">
                    Open Safari or Chrome on your phone, go to <strong>accounts.google.com</strong>, and ensure you are logged into the same account: <span className="font-mono font-bold text-slate-800">rajeshknarasappa@gmail.com</span>. Then open the link.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                      2
                    </span>
                    <strong className="text-slate-900">Click the "Share" button in AI Studio (Top Right)</strong>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-7 leading-relaxed">
                    Look at the top-right corner of the Google AI Studio screen on your computer. Click the blue/white <strong>"Share"</strong> or <strong>"Publish"</strong> button. Select <strong>"Anyone with the link"</strong>. This activates public access so your phone can open it instantly with no Google sign-in required!
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>ExpiryAlert Mobile</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
