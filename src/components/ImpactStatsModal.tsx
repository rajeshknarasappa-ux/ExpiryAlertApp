import React from 'react';
import { X, TrendingUp, DollarSign, Leaf, Sparkles, CheckCircle2, AlertOctagon } from 'lucide-react';
import { InventoryStats } from '../types/index.ts';

interface ImpactStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: InventoryStats | null;
}

export const ImpactStatsModal: React.FC<ImpactStatsModalProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  if (!isOpen || !stats) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Waste Reduction Impact</h2>
              <p className="text-xs text-slate-500">Your household sustainability & savings scorecard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Top Score Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider block">
              Waste Avoidance Efficiency
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-4xl font-extrabold tracking-tight">
                {stats.wasteAvoidedPercent}%
              </span>
              <span className="text-sm font-medium text-emerald-100">
                of tracked items consumed before expiry
              </span>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-xs text-slate-500 block mb-1">Estimated Grocery Savings</span>
              <div className="flex items-center space-x-1">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span className="text-2xl font-bold text-slate-900">
                  {stats.moneySavedEstimate.toFixed(2)}
                </span>
              </div>
              <span className="text-[10px] text-emerald-600 mt-1 block">
                Calculated from consumed items
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="text-xs text-slate-500 block mb-1">Items Saved from Waste</span>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-2xl font-bold text-slate-900">
                  {stats.consumed}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                vs {stats.expired} expired discarded
              </span>
            </div>
          </div>

          {/* Category Distribution */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Inventory by Category
            </h4>
            <div className="space-y-2">
              {Object.entries(stats.categoryCounts).map(([cat, count]) => {
                const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-medium">{cat}</span>
                      <span className="text-slate-500 font-mono">
                        {count} items ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Tip */}
          <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-950 font-semibold">Pro Tip: FIFO Storage</strong>
              <span>Always place newer groceries behind older ones in your fridge or pantry to automatically rotate stock!</span>
            </div>
          </div>

        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-900"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
