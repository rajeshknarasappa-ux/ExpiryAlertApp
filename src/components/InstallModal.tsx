import React from 'react';
import { X, Download, Smartphone, Share, PlusSquare, CheckCircle2 } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNativeInstall?: () => void;
  canNativeInstall: boolean;
  isIOS: boolean;
  isInstalled: boolean;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  onNativeInstall,
  canNativeInstall,
  isIOS,
  isInstalled,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-emerald-50/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Install ExpiryAlert</h2>
              <p className="text-[11px] text-slate-500">Add to your device home screen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          {isInstalled ? (
            <div className="text-center py-4 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">Already Installed!</h3>
              <p className="text-slate-500 text-[11px]">
                ExpiryAlert is installed on your device. You can launch it directly from your home screen or app launcher.
              </p>
            </div>
          ) : canNativeInstall ? (
            <div className="space-y-3 text-center">
              <p className="text-slate-600 text-[12px] leading-relaxed">
                Install ExpiryAlert to launch instantly, work offline, and scan product labels with your camera in standalone mode.
              </p>
              <button
                type="button"
                onClick={() => {
                  onNativeInstall?.();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/20 transition active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Install App Now</span>
              </button>
            </div>
          ) : isIOS ? (
            <div className="space-y-3">
              <p className="text-slate-600 leading-relaxed">
                Follow these simple steps in <strong>Safari</strong> on your iPhone or iPad:
              </p>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2.5 text-[11px]">
                <div className="flex items-start space-x-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                    1
                  </span>
                  <span>
                    Tap the <strong>Share</strong> button in Safari's bottom toolbar (the square icon with an arrow pointing up: <Share className="w-3.5 h-3.5 inline mx-0.5" />).
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                    2
                  </span>
                  <span>
                    Scroll down and select <strong>"Add to Home Screen"</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5" />).
                  </span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                    3
                  </span>
                  <span>
                    Tap <strong>Add</strong> at top right. The app icon will appear on your home screen!
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-600 leading-relaxed">
                To install on your phone or desktop:
              </p>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2 text-[11px]">
                <div>
                  <strong>Chrome / Android:</strong> Tap the <strong>⋮ (three dots)</strong> menu in browser toolbar and click <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </div>
                <div>
                  <strong>Desktop (Chrome/Edge):</strong> Click the <strong>Install</strong> icon in the right side of the address bar.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
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
