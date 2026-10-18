import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db.ts';
import { extractProductDetailsFromImage } from './src/server/geminiOcr.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware to parse large JSON payloads (base64 image uploads)
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// ==========================================
// API ROUTES
// ==========================================

/**
 * GET /api/items
 * Fetches all tracked items with computed urgency status and priority sorting.
 * Query params: category, status, search, sort
 */
app.get('/api/items', (req: Request, res: Response) => {
  try {
    let items = db.getItems();
    const { category, status, search } = req.query;

    if (category && category !== 'All') {
      items = items.filter((it) => it.category.toLowerCase() === String(category).toLowerCase());
    }

    if (status) {
      if (status === 'attention') {
        // Needs attention: expired or expiring soon (<= 3 days) and not consumed
        items = items.filter((it) => !it.isConsumed && (it.status === 'expired' || it.status === 'expiring_today' || it.status === 'expiring_soon'));
      } else if (status === 'consumed') {
        items = items.filter((it) => it.isConsumed);
      } else if (status === 'active') {
        items = items.filter((it) => !it.isConsumed);
      } else {
        items = items.filter((it) => it.status === status);
      }
    }

    if (search && typeof search === 'string') {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          (it.brand && it.brand.toLowerCase().includes(q)) ||
          (it.notes && it.notes.toLowerCase().includes(q)) ||
          (it.location && it.location.toLowerCase().includes(q)) ||
          it.category.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, items });
  } catch (error: any) {
    console.error('Error fetching items:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/items/:id
 */
app.get('/api/items/:id', (req: Request, res: Response) => {
  try {
    const item = db.getItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    res.json({ success: true, item });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/items
 * Create a new item (manual entry or confirmed from AI scan)
 */
app.post('/api/items', (req: Request, res: Response) => {
  try {
    const { name, category, expiryDate, purchaseDate, quantity, unit, location, notes, brand, subCategory, storageTips, imageURL, rawOcrText, aiConfidence } = req.body;

    if (!name || !expiryDate) {
      return res.status(400).json({ success: false, error: 'Name and Expiry Date are required.' });
    }

    const newItem = db.addItem({
      name: name.trim(),
      brand: brand?.trim() || '',
      category: category || 'Groceries',
      subCategory: subCategory?.trim() || '',
      purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
      expiryDate,
      quantity: Number(quantity) > 0 ? Number(quantity) : 1,
      unit: unit || 'unit',
      location: location || 'Fridge',
      notes: notes?.trim() || '',
      storageTips: storageTips?.trim() || '',
      imageURL: imageURL || '',
      rawOcrText: rawOcrText || '',
      aiConfidence: aiConfidence || 'high',
      isConsumed: false,
    });

    res.status(201).json({ success: true, item: newItem });
  } catch (error: any) {
    console.error('Error adding item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/items/:id
 * Update item details
 */
app.put('/api/items/:id', (req: Request, res: Response) => {
  try {
    const updated = db.updateItem(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    res.json({ success: true, item: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/items/:id
 * Remove or discard an item
 */
app.delete('/api/items/:id', (req: Request, res: Response) => {
  try {
    const success = db.deleteItem(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/items/:id/consume
 * Mark item as consumed (waste prevented!) or restore
 */
app.patch('/api/items/:id/consume', (req: Request, res: Response) => {
  try {
    const { isConsumed } = req.body;
    const shouldConsume = isConsumed !== undefined ? Boolean(isConsumed) : true;
    const item = db.markAsConsumed(req.params.id, shouldConsume);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    res.json({ success: true, item });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/scan-label
 * AI Vision OCR extraction endpoint using Gemini 3.8 Flash
 * Accepts base64 image data string
 */
app.post('/api/scan-label', async (req: Request, res: Response) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'Image data is required for OCR scanning.' });
    }

    const extraction = await extractProductDetailsFromImage(image);
    res.json({ success: true, data: extraction });
  } catch (error: any) {
    console.error('Scan error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to scan product label.',
    });
  }
});

/**
 * GET /api/notifications
 * Fetch notification logs
 */
app.get('/api/notifications', (req: Request, res: Response) => {
  try {
    const notifications = db.getNotifications();
    res.json({ success: true, notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/notifications/check
 * Trigger manual or scheduled background expiration check
 */
app.post('/api/notifications/check', (req: Request, res: Response) => {
  try {
    const newAlerts = db.runNotificationCheck(true);
    const notifications = db.getNotifications();
    res.json({ success: true, count: newAlerts.length, newAlerts, notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/notifications/:id/read
 */
app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
  try {
    const ok = db.markNotificationAsRead(req.params.id);
    res.json({ success: ok });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/notifications/read-all
 */
app.patch('/api/notifications/read-all', (req: Request, res: Response) => {
  try {
    db.markAllNotificationsRead();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/notifications/clear
 */
app.delete('/api/notifications/clear', (req: Request, res: Response) => {
  try {
    db.clearAllNotifications();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/stats
 */
app.get('/api/stats', (req: Request, res: Response) => {
  try {
    const stats = db.getStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/settings
 */
app.get('/api/settings', (req: Request, res: Response) => {
  try {
    const settings = db.getSettings();
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/settings
 */
app.put('/api/settings', (req: Request, res: Response) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Periodic background job: checks for expiring items every 30 minutes
setInterval(() => {
  try {
    db.runNotificationCheck(true);
  } catch (err) {
    console.error('Scheduled notification check error:', err);
  }
}, 30 * 60 * 1000);

// ==========================================
// VITE CLIENT MOUNTING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ExpiryAlert] Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
