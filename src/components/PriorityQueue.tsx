import React from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Trash2,
  ChevronRight,
  Flame,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Item } from '../types/index.ts';
import { getExpiryStatusDisplay } from '../utils/prioritization.ts';

interface PriorityQueueProps {
  items: Item[];
  onConsume: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (item: Item) => void;
}

export const PriorityQueue: React.FC<PriorityQueueProps> = ({
  items,
  onConsume,
  onDelete,
  onSelect,
}) => {
  // Filter for items needing immediate attention:
  // Not consumed AND (status is 'expired', 'expiring_today', or 'expiring_soon' <= 3 days)
  const urgentItems = items
    .filter(
      (item) =>
        !item.isConsumed &&
        (item.status === 'expired' ||
          item.status === 'expiring_today' ||
          item.status === 'expiring_soon')
    )
    .sort((a, b) => b.priorityScore - a.priorityScore);

  if (urgentItems.length === 0) {
    return (
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-200/80 rounded-2xl p-4 sm:p-5 mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Kitchen & Pantry All Clear!
            </h3>
            <p className="text-xs text-slate-500">
              No items require immediate attention today. All tracked supplies are fresh.
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
          Zero Food Waste
        </span>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-2xl bg-amber-500/5 border border-amber-200/70 p-4 sm:p-5 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center">
            <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Action Required • Priority Queue
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900">
                {urgentItems.length} {urgentItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Ranked dynamically by expiration urgency and product hazard score
            </p>
          </div>
        </div>
      </div>

      {/* Grid of urgent items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {urgentItems.map((item) => {
          const statusInfo = getExpiryStatusDisplay(item.daysUntilExpiry, item.isConsumed);
          const isExpired = item.status === 'expired';

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                {/* Top badges */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${statusInfo.badgeClass}`}
                  >
                    {isExpired ? (
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    ) : (
                      <Clock className="w-3 h-3 flex-shrink-0" />
                    )}
                    <span>{statusInfo.label}</span>
                  </span>

                  <span
                    title="Smart Priority Score (0-100)"
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      item.priorityScore >= 80
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Priority {item.priorityScore}
                  </span>
                </div>

                {/* Item Name & Details */}
                <div className="flex items-start space-x-3">
                  {item.imageURL ? (
                    <img
                      src={item.imageURL}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {item.name.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center space-x-1.5 mt-0.5">
                      <span className="capitalize">{item.category}</span>
                      <span>•</span>
                      <span>{item.location}</span>
                    </p>
                    {item.notes && (
                      <p className="text-[11px] text-slate-400 italic truncate mt-1">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between"
                onClick={(e) => e.stopPropagation()}
              >
                {!isExpired ? (
                  <button
                    type="button"
                    onClick={() => onConsume(item.id)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition"
                    title="Mark as consumed before spoiling"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Consume</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
                    title="Discard expired item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Discard</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center space-x-0.5"
                >
                  <span>Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
