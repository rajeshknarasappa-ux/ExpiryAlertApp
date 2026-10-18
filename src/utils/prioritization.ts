import { Item, ItemCategory, UrgencyStatus } from '../types/index.ts';

/**
 * Calculates days remaining until expiration from a target date string.
 * Negative number indicates the item has already expired.
 */
export function calculateDaysUntilExpiry(expiryDateStr: string, referenceDate: Date = new Date()): number {
  if (!expiryDateStr) return 999;
  
  const expiry = new Date(expiryDateStr);
  if (isNaN(expiry.getTime())) return 999;

  // Set reference date to start of day in local time
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  const exp = new Date(expiry);
  exp.setHours(0, 0, 0, 0);

  const diffMs = exp.getTime() - ref.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determines UrgencyStatus based on days remaining and consumed flag
 */
export function determineUrgencyStatus(daysUntilExpiry: number, isConsumed: boolean = false): UrgencyStatus {
  if (isConsumed) return 'consumed';
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry === 0) return 'expiring_today';
  if (daysUntilExpiry <= 3) return 'expiring_soon';
  return 'fresh';
}

/**
 * Category hazard multiplier reflecting safety/spoilage severity.
 * Expired medicines can cause health risks or lack efficacy.
 * Dairy/meat/poultry causes severe bacterial food-borne illness.
 */
export const CATEGORY_HAZARD_WEIGHTS: Record<ItemCategory, number> = {
  Medicine: 1.35,
  Groceries: 1.25,
  Cosmetics: 1.1,
  Pantry: 0.95,
  Household: 0.9,
  Other: 1.0,
};

/**
 * Computes a normalized Priority Score (0 to 100).
 * 100 = critical immediate action required (e.g. expired medicine or milk expiring today)
 * 0 = consumed or well in the future
 */
export function computePriorityScore(
  daysUntilExpiry: number,
  category: ItemCategory,
  isConsumed: boolean = false
): number {
  if (isConsumed) return 0;

  const categoryMultiplier = CATEGORY_HAZARD_WEIGHTS[category] || 1.0;
  let baseScore: number;

  if (daysUntilExpiry < 0) {
    // Already expired - highest urgency to discard or safely dispose
    const overdueDays = Math.abs(daysUntilExpiry);
    baseScore = 85 + Math.min(15, overdueDays * 2);
  } else if (daysUntilExpiry === 0) {
    // Expires today
    baseScore = 80;
  } else if (daysUntilExpiry === 1) {
    baseScore = 70;
  } else if (daysUntilExpiry <= 3) {
    baseScore = 55 + (3 - daysUntilExpiry) * 5;
  } else if (daysUntilExpiry <= 7) {
    baseScore = 35 + (7 - daysUntilExpiry) * 3;
  } else if (daysUntilExpiry <= 14) {
    baseScore = 20 + (14 - daysUntilExpiry);
  } else {
    baseScore = Math.max(5, 20 - Math.floor(daysUntilExpiry / 10));
  }

  const finalScore = Math.min(100, Math.round(baseScore * categoryMultiplier));
  return Math.max(1, finalScore);
}

/**
 * Enriches an item with dynamically evaluated daysUntilExpiry, status, and priorityScore.
 */
export function enrichItemWithComputedFields(
  item: Omit<Item, 'daysUntilExpiry' | 'status' | 'priorityScore'> & Partial<Pick<Item, 'daysUntilExpiry' | 'status' | 'priorityScore'>>,
  referenceDate: Date = new Date()
): Item {
  const daysUntilExpiry = calculateDaysUntilExpiry(item.expiryDate, referenceDate);
  const status = determineUrgencyStatus(daysUntilExpiry, item.isConsumed);
  const priorityScore = computePriorityScore(daysUntilExpiry, item.category, item.isConsumed);

  return {
    ...item,
    daysUntilExpiry,
    status,
    priorityScore,
  } as Item;
}

/**
 * Dynamic smart prioritization sort function.
 * 1. Active items requiring immediate attention (expired & expiring soon) ranked by priorityScore DESC.
 * 2. Fresh items ordered by expiry date ascending (earliest to expire first).
 * 3. Consumed items placed at the bottom.
 */
export function sortItemsBySmartPriority(items: Item[]): Item[] {
  return [...items].sort((a, b) => {
    // Keep consumed items at the bottom
    if (a.isConsumed && !b.isConsumed) return 1;
    if (!a.isConsumed && b.isConsumed) return -1;
    if (a.isConsumed && b.isConsumed) {
      return (b.consumedAt || '').localeCompare(a.consumedAt || '');
    }

    // Compare priority scores first (higher priority on top)
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }

    // Secondary sort: earliest expiry date first
    return a.expiryDate.localeCompare(b.expiryDate);
  });
}

/**
 * Human-readable relative status label
 */
export function getExpiryStatusDisplay(daysUntilExpiry: number, isConsumed: boolean = false): {
  label: string;
  badgeClass: string;
  pillClass: string;
  iconType: 'alert' | 'clock' | 'check' | 'calendar';
} {
  if (isConsumed) {
    return {
      label: 'Consumed',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      pillClass: 'bg-emerald-500',
      iconType: 'check',
    };
  }

  if (daysUntilExpiry < 0) {
    const abs = Math.abs(daysUntilExpiry);
    return {
      label: abs === 1 ? 'Expired yesterday' : `Expired ${abs} days ago`,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
      pillClass: 'bg-rose-600',
      iconType: 'alert',
    };
  }

  if (daysUntilExpiry === 0) {
    return {
      label: 'Expires today!',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold',
      pillClass: 'bg-amber-500',
      iconType: 'alert',
    };
  }

  if (daysUntilExpiry === 1) {
    return {
      label: 'Expires tomorrow',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      pillClass: 'bg-amber-500',
      iconType: 'clock',
    };
  }

  if (daysUntilExpiry <= 3) {
    return {
      label: `${daysUntilExpiry} days left`,
      badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      pillClass: 'bg-yellow-500',
      iconType: 'clock',
    };
  }

  if (daysUntilExpiry <= 7) {
    return {
      label: `${daysUntilExpiry} days left`,
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      pillClass: 'bg-blue-500',
      iconType: 'calendar',
    };
  }

  return {
    label: `${daysUntilExpiry} days left`,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pillClass: 'bg-emerald-500',
    iconType: 'calendar',
  };
}
