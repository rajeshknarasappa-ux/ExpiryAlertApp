import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  List,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  ExternalLink,
  Tag,
  Package,
  Layers,
  ShoppingBag,
  Pill,
  Sparkle
} from 'lucide-react';
import { Item, ItemCategory } from '../types/index.ts';
import { getExpiryStatusDisplay } from '../utils/prioritization.ts';

interface InventoryViewProps {
  items: Item[];
  onConsume: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (item: Item) => void;
  onAddNew: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  items,
  onConsume,
  onDelete,
  onSelect,
  onAddNew,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [sortBy, setSortBy] = useState<'priority' | 'expiry' | 'name' | 'added'>('priority');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const categories: { label: string; value: string; icon?: string }[] = [
    { label: 'All Categories', value: 'All' },
    { label: 'Groceries', value: 'Groceries' },
    { label: 'Medicine', value: 'Medicine' },
    { label: 'Cosmetics', value: 'Cosmetics' },
    { label: 'Pantry', value: 'Pantry' },
    { label: 'Household', value: 'Household' },
  ];

  const statusFilters = [
    { label: 'Active Items', value: 'active' },
    { label: 'All Items', value: 'all' },
    { label: 'Expiring Soon (≤3d)', value: 'expiring_soon' },
    { label: 'Fresh (>3d)', value: 'fresh' },
    { label: 'Expired', value: 'expired' },
    { label: 'Consumed (Saved)', value: 'consumed' },
  ];

  // Filtering
  const filteredItems = items.filter((item) => {
    // Category match
    if (selectedCategory !== 'All' && item.category !== selectedCategory) {
      return false;
    }

    // Status filter match
    if (selectedStatus === 'active') {
      if (item.isConsumed) return false;
    } else if (selectedStatus === 'consumed') {
      if (!item.isConsumed) return false;
    } else if (selectedStatus === 'expiring_soon') {
      if (item.isConsumed || (item.status !== 'expiring_soon' && item.status !== 'expiring_today')) return false;
    } else if (selectedStatus === 'expired') {
      if (item.isConsumed || item.status !== 'expired') return false;
    } else if (selectedStatus === 'fresh') {
      if (item.isConsumed || item.status !== 'fresh') return false;
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchBrand = item.brand?.toLowerCase().includes(q) || false;
      const matchLoc = item.location.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q) || false;
      if (!matchName && !matchBrand && !matchLoc && !matchCat && !matchNotes) {
        return false;
      }
    }

    return true;
  });

  // Sorting
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'priority') {
      // Consumed to bottom
      if (a.isConsumed !== b.isConsumed) return a.isConsumed ? 1 : -1;
      return b.priorityScore - a.priorityScore;
    } else if (sortBy === 'expiry') {
      if (a.isConsumed !== b.isConsumed) return a.isConsumed ? 1 : -1;
      return a.expiryDate.localeCompare(b.expiryDate);
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'added') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  return (
    <div className="space-y-5">
      
      {/* Search, Filter Tabs & Sort Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3.5">
        
        {/* Search Bar + View Toggle */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, brand, location, or notes..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer"
              >
                <option value="priority">Sort: Urgency Priority</option>
                <option value="expiry">Sort: Expiry (Soonest)</option>
                <option value="added">Sort: Date Added (Newest)</option>
                <option value="name">Sort: Name (A-Z)</option>
              </select>
            </div>

            {/* Grid / Table Toggle */}
            <div className="hidden sm:flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table'
                    ? 'bg-white shadow-xs text-slate-900 font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Dense Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          {categories.map((cat) => {
            const count =
              cat.value === 'All'
                ? items.filter((i) => !i.isConsumed).length
                : items.filter((i) => !i.isConsumed && i.category === cat.value).length;

            const isSelected = selectedCategory === cat.value;

            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium flex items-center space-x-1.5 transition ${
                  isSelected
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Filter Sub-bar */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 text-xs overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0">
            Status:
          </span>
          {statusFilters.map((st) => (
            <button
              key={st.value}
              onClick={() => setSelectedStatus(st.value)}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-medium transition ${
                selectedStatus === st.value
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

      </div>

      {/* Item List / Cards */}
      {sortedItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
          <h3 className="text-base font-bold text-slate-800">No items found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No inventory items matched "${searchQuery}". Try clearing the search query or changing filters.`
              : 'Your inventory in this category is empty. Add a product by scanning its label with AI or manual entry.'}
          </p>
          <div className="pt-2">
            <button
              onClick={onAddNew}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Add Your First Item</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedItems.map((item) => {
            const statusInfo = getExpiryStatusDisplay(item.daysUntilExpiry, item.isConsumed);

            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className={`bg-white rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden group hover:shadow-md ${
                  item.isConsumed
                    ? 'border-slate-200 opacity-75 bg-slate-50/50'
                    : item.status === 'expired'
                    ? 'border-rose-200 shadow-rose-100/50'
                    : item.status === 'expiring_soon' || item.status === 'expiring_today'
                    ? 'border-amber-200 shadow-amber-100/50'
                    : 'border-slate-200 shadow-slate-100/50 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Card Image Banner */}
                  <div className="relative h-32 bg-slate-100 overflow-hidden">
                    {item.imageURL ? (
                      <img
                        src={item.imageURL}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                        <Package className="w-8 h-8 opacity-40" />
                      </div>
                    )}
                    
                    {/* Status Pill in corner */}
                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur shadow-xs ${statusInfo.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.pillClass}`} />
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>

                    {/* Location Badge */}
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-black/60 text-white backdrop-blur">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>{item.location}</span>
                      </span>
                    </div>
                  </div>

                  {/* Item Details */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {item.category} {item.brand && `• ${item.brand}`}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                          {item.name}
                        </h4>
                      </div>
                    </div>

                    {/* Expiry date readout */}
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{item.expiryDate}</span>
                      </div>
                      <span className="text-slate-500 text-[11px]">
                        Qty: {item.quantity} {item.unit}
                      </span>
                    </div>

                    {/* Storage tip / Notes snippet */}
                    {(item.storageTips || item.notes) && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 italic bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        {item.storageTips || item.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div
                  className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onConsume(item.id)}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      item.isConsumed
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-500/20'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{item.isConsumed ? 'Mark Active' : 'Consume'}</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelect(item)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition text-xs font-semibold"
                    >
                      View
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* DENSE TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Item & Brand</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedItems.map((item) => {
                  const statusInfo = getExpiryStatusDisplay(item.daysUntilExpiry, item.isConsumed);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelect(item)}
                      className="hover:bg-slate-50/70 transition cursor-pointer"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 flex items-center space-x-2">
                        {item.imageURL && (
                          <img
                            src={item.imageURL}
                            alt=""
                            className="w-7 h-7 rounded-md object-cover border border-slate-100"
                          />
                        )}
                        <div>
                          <div>{item.name}</div>
                          {item.brand && <div className="text-[10px] text-slate-400 font-normal">{item.brand}</div>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{item.category}</td>
                      <td className="py-3 px-4 text-slate-600">{item.location}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        {item.expiryDate}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-700">
                        {item.priorityScore}
                      </td>
                      <td
                        className="py-3 px-4 text-right space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onConsume(item.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg"
                        >
                          {item.isConsumed ? 'Undo' : 'Consume'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
