import fs from 'fs';
import path from 'path';
import { Item, NotificationLog, UserSettings, InventoryStats } from '../types/index.ts';
import {
  enrichItemWithComputedFields,
  sortItemsBySmartPriority,
  calculateDaysUntilExpiry,
} from '../utils/prioritization.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const ITEMS_FILE = path.join(DATA_DIR, 'items.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function formatDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

const DEFAULT_SETTINGS: UserSettings = {
  email: 'rajeshknarasappa@gmail.com',
  name: 'Rajesh K',
  emailAlertsEnabled: true,
  pushAlertsEnabled: true,
  alertDaysAdvance: [7, 3, 1, 0],
  notificationTime: '08:30',
};

// Realistic initial seed inventory showcasing various categories and expiry states
const INITIAL_SEED_ITEMS: Omit<Item, 'daysUntilExpiry' | 'status' | 'priorityScore'>[] = [
  {
    id: 'seed-item-1',
    name: 'Organic Whole Milk',
    brand: 'Horizon Organic',
    category: 'Groceries',
    subCategory: 'Dairy',
    purchaseDate: formatDate(-10),
    expiryDate: formatDate(0), // EXPIRES TODAY!
    quantity: 1,
    unit: 'carton (64 fl oz)',
    location: 'Fridge',
    notes: 'Keep chilled below 4°C. Check cap seal.',
    storageTips: 'Store on main fridge shelf, not door rack, for consistent cooling.',
    imageURL: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80',
    rawOcrText: 'HORIZON ORGANIC WHOLE MILK BEST BY 18 OCT 2026 PLANT #06-12',
    aiConfidence: 'high',
    isConsumed: false,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-item-2',
    name: 'Amoxicillin Antibiotic 500mg',
    brand: 'Novartis Sandoz',
    category: 'Medicine',
    subCategory: 'Antibiotics',
    purchaseDate: formatDate(-12),
    expiryDate: formatDate(2), // EXPIRES IN 2 DAYS (High priority medicine!)
    quantity: 6,
    unit: 'capsules',
    location: 'Medicine Cabinet',
    notes: 'Prescribed for 10-day course. Take with meal.',
    storageTips: 'Store in dry place between 15-25°C away from bathroom moisture.',
    imageURL: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80',
    rawOcrText: 'AMOXICILLIN 500MG CAPSULES EXP 20/10/2026 LOT B8921',
    aiConfidence: 'high',
    isConsumed: false,
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-item-3',
    name: 'Organic Baby Spinach',
    brand: 'Earthbound Farm',
    category: 'Groceries',
    subCategory: 'Fresh Produce',
    purchaseDate: formatDate(-7),
    expiryDate: formatDate(-2), // EXPIRED 2 DAYS AGO!
    quantity: 1,
    unit: 'tub (5 oz)',
    location: 'Fridge',
    notes: 'Inspect for wilting or moisture before discarding.',
    storageTips: 'Place a dry paper towel in container to absorb excess condensation.',
    imageURL: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&auto=format&fit=crop&q=80',
    rawOcrText: 'ORGANIC BABY SPINACH BEST IF USED BY 16 OCT 2026',
    aiConfidence: 'high',
    isConsumed: false,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-item-4',
    name: 'Greek Strawberry Yogurt',
    brand: 'Chobani',
    category: 'Groceries',
    subCategory: 'Dairy',
    purchaseDate: formatDate(-4),
    expiryDate: formatDate(3), // EXPIRES IN 3 DAYS
    quantity: 2,
    unit: 'cups (5.3 oz)',
    location: 'Fridge',
    notes: 'Great for breakfast or morning smoothies.',
    storageTips: 'Keep refrigerated 33°-40°F.',
    imageURL: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&auto=format&fit=crop&q=80',
    rawOcrText: 'CHOBANI GREEK YOGURT STRAWBERRY EXP 21 OCT 2026',
    aiConfidence: 'high',
    isConsumed: false,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-item-5',
    name: 'Mineral Sunscreen SPF 50',
    brand: 'La Roche-Posay',
    category: 'Cosmetics',
    subCategory: 'Sun Protection',
    purchaseDate: formatDate(-30),
    expiryDate: formatDate(45), // FRESH (45 days)
    quantity: 1,
    unit: 'bottle (50 ml)',
    location: 'Bathroom',
    notes: 'Broad spectrum UVA/UVB protection.',
    storageTips: 'Do not leave in direct hot car sunlight.',
    imageURL: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80',
    rawOcrText: 'ANTHELIOS MINERAL SPF 50 EXP 12/2026 LOT 54S900',
    aiConfidence: 'high',
    isConsumed: false,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-item-6',
    name: 'Organic Chickpeas (Garbanzo)',
    brand: 'Eden Foods',
    category: 'Pantry',
    subCategory: 'Canned Goods',
    purchaseDate: formatDate(-60),
    expiryDate: formatDate(180), // FRESH (180 days)
    quantity: 3,
    unit: 'cans (15 oz)',
    location: 'Pantry',
    notes: 'No salt added, BPA-free lined can.',
    storageTips: 'Store in cool, dry pantry cabinet.',
    imageURL: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
    rawOcrText: 'EDEN ORGANIC CHICKPEAS BEST BY 15 APR 2027',
    aiConfidence: 'high',
    isConsumed: false,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed-item-7',
    name: 'Artisan Sliced Sourdough',
    brand: 'Rustic Bakery',
    category: 'Groceries',
    subCategory: 'Bakery',
    purchaseDate: formatDate(-5),
    expiryDate: formatDate(-1),
    quantity: 1,
    unit: 'loaf',
    location: 'Pantry',
    notes: 'Consumed before it could spoil! Prevented waste.',
    storageTips: 'Keep tightly wrapped or freeze slices for toasting.',
    imageURL: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80',
    rawOcrText: 'RUSTIC SOURDOUGH BAKE DATE 13 OCT 2026 BEST BY 17 OCT',
    aiConfidence: 'high',
    isConsumed: true,
    consumedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class Database {
  private items: Item[] = [];
  private notifications: NotificationLog[] = [];
  private settings: UserSettings = DEFAULT_SETTINGS;

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(ITEMS_FILE)) {
        const raw = fs.readFileSync(ITEMS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.items = parsed.map((item: any) => enrichItemWithComputedFields(item));
      } else {
        this.items = INITIAL_SEED_ITEMS.map((item) => enrichItemWithComputedFields(item));
        this.saveItemsToDisk();
      }

      if (fs.existsSync(NOTIFICATIONS_FILE)) {
        const raw = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
        this.notifications = JSON.parse(raw);
      } else {
        // Generate initial notification alerts based on seed data
        this.runNotificationCheck(false);
      }

      if (fs.existsSync(SETTINGS_FILE)) {
        const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      } else {
        this.saveSettingsToDisk();
      }
    } catch (e) {
      console.error('Error loading database from disk:', e);
      this.items = INITIAL_SEED_ITEMS.map((item) => enrichItemWithComputedFields(item));
    }
  }

  private saveItemsToDisk() {
    try {
      fs.writeFileSync(ITEMS_FILE, JSON.stringify(this.items, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving items to disk:', e);
    }
  }

  private saveNotificationsToDisk() {
    try {
      fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(this.notifications, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving notifications to disk:', e);
    }
  }

  private saveSettingsToDisk() {
    try {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving settings to disk:', e);
    }
  }

  /**
   * Get all items, re-computed against current time and sorted by priority.
   */
  public getItems(): Item[] {
    const enriched = this.items.map((it) => enrichItemWithComputedFields(it));
    return sortItemsBySmartPriority(enriched);
  }

  public getItemById(id: string): Item | undefined {
    const item = this.items.find((i) => i.id === id);
    return item ? enrichItemWithComputedFields(item) : undefined;
  }

  public addItem(itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'daysUntilExpiry' | 'status' | 'priorityScore'>): Item {
    const id = `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    
    const rawItem = {
      ...itemData,
      id,
      isConsumed: itemData.isConsumed || false,
      createdAt: now,
      updatedAt: now,
    };

    const enriched = enrichItemWithComputedFields(rawItem);
    this.items.unshift(enriched);
    this.saveItemsToDisk();

    // Check if new item warrants an immediate alert (e.g. expiring soon)
    this.checkSingleItemNotification(enriched);

    return enriched;
  }

  public updateItem(id: string, updates: Partial<Item>): Item | null {
    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const existing = this.items[index];
    const updatedRaw = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    const enriched = enrichItemWithComputedFields(updatedRaw);
    this.items[index] = enriched;
    this.saveItemsToDisk();
    return enriched;
  }

  public markAsConsumed(id: string, isConsumed: boolean = true): Item | null {
    return this.updateItem(id, {
      isConsumed,
      consumedAt: isConsumed ? new Date().toISOString() : undefined,
    });
  }

  public deleteItem(id: string): boolean {
    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) return false;
    this.items.splice(index, 1);
    this.saveItemsToDisk();
    return true;
  }

  public getSettings(): UserSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<UserSettings>): UserSettings {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettingsToDisk();
    return this.settings;
  }

  public getNotifications(): NotificationLog[] {
    return [...this.notifications].sort(
      (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    );
  }

  public markNotificationAsRead(id: string): boolean {
    const notif = this.notifications.find((n) => n.id === id);
    if (!notif) return false;
    notif.isRead = true;
    this.saveNotificationsToDisk();
    return true;
  }

  public markAllNotificationsRead(): void {
    this.notifications.forEach((n) => (n.isRead = true));
    this.saveNotificationsToDisk();
  }

  public clearAllNotifications(): void {
    this.notifications = [];
    this.saveNotificationsToDisk();
  }

  /**
   * Evaluates all active items against notification rules and triggers logs.
   */
  public runNotificationCheck(save: boolean = true): NotificationLog[] {
    const newAlerts: NotificationLog[] = [];
    const activeItems = this.items.filter((i) => !i.isConsumed);

    for (const item of activeItems) {
      const days = calculateDaysUntilExpiry(item.expiryDate);
      let alertType: NotificationLog['alertType'] | null = null;
      let message = '';

      if (days < 0) {
        alertType = 'OVERDUE';
        message = `⚠️ Warning: "${item.name}" has expired (${Math.abs(days)} days overdue). Please safely discard or inspect before use.`;
      } else if (days === 0) {
        alertType = 'EXPIRED_TODAY';
        message = `🚨 Action Required: "${item.name}" expires TODAY! Consume or freeze immediately.`;
      } else if (days === 1) {
        alertType = 'EXPIRING_IN_1_DAY';
        message = `⏰ Urgent: "${item.name}" expires tomorrow (${item.location}).`;
      } else if (days <= 3) {
        alertType = 'EXPIRING_IN_3_DAYS';
        message = `📅 Reminder: "${item.name}" will expire in ${days} days.`;
      }

      if (alertType) {
        // Prevent duplicate spam if alert already triggered today for this item and alertType
        const todayStr = new Date().toISOString().split('T')[0];
        const existingAlert = this.notifications.find(
          (n) => n.itemId === item.id && n.alertType === alertType && n.triggeredAt.startsWith(todayStr)
        );

        if (!existingAlert) {
          const alert: NotificationLog = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            itemId: item.id,
            itemName: item.name,
            category: item.category,
            alertType,
            daysRemaining: days,
            message,
            recipientEmail: this.settings.email,
            channel: 'IN_APP',
            isRead: false,
            triggeredAt: new Date().toISOString(),
          };
          this.notifications.unshift(alert);
          newAlerts.push(alert);
        }
      }
    }

    if (save && newAlerts.length > 0) {
      this.saveNotificationsToDisk();
    }

    return newAlerts;
  }

  private checkSingleItemNotification(item: Item): void {
    const days = calculateDaysUntilExpiry(item.expiryDate);
    if (days <= 3) {
      this.runNotificationCheck(true);
    }
  }

  /**
   * Generates summary inventory statistics
   */
  public getStats(): InventoryStats {
    const all = this.getItems();
    let total = 0;
    let fresh = 0;
    let expiringSoon = 0;
    let expired = 0;
    let consumed = 0;

    const categoryCounts: Record<string, number> = {
      Groceries: 0,
      Medicine: 0,
      Cosmetics: 0,
      Pantry: 0,
      Household: 0,
      Other: 0,
    };

    for (const it of all) {
      total++;
      if (categoryCounts[it.category] !== undefined) {
        categoryCounts[it.category]++;
      }

      if (it.isConsumed) {
        consumed++;
      } else if (it.status === 'expired') {
        expired++;
      } else if (it.status === 'expiring_soon' || it.status === 'expiring_today') {
        expiringSoon++;
      } else {
        fresh++;
      }
    }

    const activeTotal = total - consumed;
    const wasteAvoidedPercent = consumed + activeTotal > 0 ? Math.round((consumed / (consumed + expired || 1)) * 100) : 100;
    // Estimate ~$4.50 average value saved per consumed item before expiration
    const moneySavedEstimate = consumed * 4.5;

    return {
      total,
      fresh,
      expiringSoon,
      expired,
      consumed,
      wasteAvoidedPercent: Math.min(100, Math.max(0, wasteAvoidedPercent)),
      moneySavedEstimate,
      categoryCounts: categoryCounts as any,
    };
  }
}

export const db = new Database();
