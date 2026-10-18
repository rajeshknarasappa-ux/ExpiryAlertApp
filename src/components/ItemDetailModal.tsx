import React, { useState } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Tag,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Clock,
  Sparkles,
  Edit2,
  Check,
  Package,
  Layers,
  Info
} from 'lucide-react';
import { Item, ItemCategory } from '../types/index.ts';
import { getExpiryStatusDisplay } from '../utils/prioritization.ts';

interface ItemDetailModalProps {
  item: Item | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Item>) => void;
  onDelete: (id: string) => void;
  onConsume: (id: string) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onUpdate,
  onDelete,
  onConsume,
}) => {
  if (!item) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [brand, setBrand] = useState(item.brand || '');
  const [category, setCategory] = useState<ItemCategory>(item.category);
  const [expiryDate, setExpiryDate] = useState(item.expiryDate);
  const [location, setLocation] = useState(item.location);
  const [quantity, setQuantity] = useState(item.quantity);
  const [notes, setNotes] = useState(item.notes || '');

  const statusInfo = getExpiryStatusDisplay(item.daysUntilExpiry, item.isConsumed);

  const handleSave = () => {
    onUpdate(item.id, {
      name,
      brand,
      category,
      expiryDate,
      location,
      quantity,
      notes,
    });
    setIsEditing(false);
  };

  // Timeline percentage calculation
  const purchaseTime = new Date(item.purchaseDate).getTime();
  const expiryTime = new Date(item.expiryDate).getTime();
  const nowTime = Date.now();
  const totalDuration = expiryTime - purchaseTime;
  let elapsedPercent = 0;
  if (totalDuration > 0) {
    elapsedPercent = Math.min(100, Math.max(0, Math.round(((nowTime - purchaseTime) / totalDuration) * 100)));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header with image banner */}
        <div className="relative h-44 bg-slate-800 overflow-hidden">
          {item.imageURL ? (
            <img
              src={item.imageURL}
              alt={item.name}
              className="w-full h-full object-cover opacity-90"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-800 to-slate-700 text-slate-400">
              <Package className="w-16 h-16 opacity-40" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title & Badge in Hero */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="flex items-center space-x-2 mb-1">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur shadow-sm ${statusInfo.badgeClass}`}>
                {statusInfo.label}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 backdrop-blur font-medium">
                {item.category}
              </span>
            </div>
            <h2 className="text-xl font-bold truncate">{item.name}</h2>
            {item.brand && <p className="text-xs text-white/80">{item.brand}</p>}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ItemCategory)}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    <option value="Groceries">Groceries</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Cosmetics">Cosmetics</option>
                    <option value="Pantry">Pantry</option>
                    <option value="Household">Household</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
            </div>
          ) : (
            <>
              {/* Timeline Progress Bar */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                  <span>Purchased: {item.purchaseDate}</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    Expires: {item.expiryDate}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      item.status === 'expired'
                        ? 'bg-rose-600'
                        : item.daysUntilExpiry <= 3
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${item.status === 'expired' ? 100 : elapsedPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 font-mono">
                  <span>{elapsedPercent}% elapsed</span>
                  <span>Priority Score: {item.priorityScore}/100</span>
                </div>
              </div>

              {/* Grid details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center space-x-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>
                    Location: <strong>{item.location}</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700">
                  <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>
                    Qty: <strong>{item.quantity} {item.unit}</strong>
                  </span>
                </div>
              </div>

              {/* Storage Advice */}
              {item.storageTips && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 text-xs text-emerald-900 flex items-start space-x-2">
                  <Info className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold block text-emerald-800">Storage Recommendation:</span>
                    <span>{item.storageTips}</span>
                  </div>
                </div>
              )}

              {/* Scanned OCR Readout if available */}
              {item.rawOcrText && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    AI OCR Label Transcript
                  </span>
                  <p className="font-mono text-slate-600 text-[11px] leading-relaxed break-words">
                    {item.rawOcrText}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
                onDelete(item.id);
                onClose();
              }
            }}
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition text-xs font-semibold flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>

          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onConsume(item.id);
                    onClose();
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm ${
                    item.isConsumed
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{item.isConsumed ? 'Mark as Active' : 'Mark as Consumed'}</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
