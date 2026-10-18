// Core TypeScript interfaces for ExpiryAlert

export type ItemCategory = 'Groceries' | 'Medicine' | 'Cosmetics' | 'Pantry' | 'Household' | 'Other';

export type UrgencyStatus = 'expired' | 'expiring_today' | 'expiring_soon' | 'fresh' | 'consumed';

export interface Item {
  id: string;
  name: string;
  brand?: string;
  category: ItemCategory;
  subCategory?: string;
  purchaseDate: string; // ISO string YYYY-MM-DD
  expiryDate: string;   // ISO string YYYY-MM-DD
  openedDate?: string;
  quantity: number;
  unit: string;
  location: string;     // e.g. "Fridge", "Pantry", "Freezer", "Medicine Cabinet", "Bathroom"
  notes?: string;
  storageTips?: string;
  imageURL?: string;
  rawOcrText?: string;
  aiConfidence?: 'high' | 'medium' | 'low';
  
  // Computed fields:
  daysUntilExpiry: number;
  status: UrgencyStatus;
  priorityScore: number; // 0 - 100 (100 = most urgent)
  
  isConsumed: boolean;
  consumedAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  itemId: string;
  itemName: string;
  category: ItemCategory;
  alertType: 'EXPIRING_IN_7_DAYS' | 'EXPIRING_IN_3_DAYS' | 'EXPIRING_IN_1_DAY' | 'EXPIRED_TODAY' | 'OVERDUE';
  daysRemaining: number;
  message: string;
  recipientEmail: string;
  channel: 'EMAIL' | 'PUSH' | 'IN_APP';
  isRead: boolean;
  triggeredAt: string;
}

export interface UserSettings {
  email: string;
  name: string;
  emailAlertsEnabled: boolean;
  pushAlertsEnabled: boolean;
  alertDaysAdvance: number[]; // e.g. [7, 3, 1, 0]
  notificationTime: string;   // e.g. "09:00"
}

export interface OcrExtractionResult {
  productName: string;
  brand: string;
  category: ItemCategory;
  subCategory: string;
  expiryDate: string;        // YYYY-MM-DD
  manufactureDate?: string;  // YYYY-MM-DD
  confidence: 'high' | 'medium' | 'low';
  rawOcrText: string;
  notes: string;
  storageRecommendation: string;
  estimatedShelfLifeDays?: number;
}

export interface InventoryStats {
  total: number;
  fresh: number;
  expiringSoon: number;
  expired: number;
  consumed: number;
  wasteAvoidedPercent: number;
  moneySavedEstimate: number;
  categoryCounts: Record<ItemCategory, number>;
}
