# ExpiryAlert 📦⏰

> **Smart Expiration Tracker & Household Waste Reducer** with AI Vision OCR, Dynamic Urgency Prioritization, and Automated Expiry Alerts.

![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)
![React](https://img.shields.io/badge/React-19-cyan.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8.svg)
![Gemini](https://img.shields.io/badge/Gemini%20AI-3.8%20Flash%20Vision-orange.svg)

---

## 🌟 Key Features

1. **AI Vision & Label OCR (Dual Mode Addition):**
   - **Snap & Scan:** Upload an image or take a live picture of a product label using your phone's camera.
   - **Gemini 3.8 Flash Vision:** Automatically extracts product name, brand, expiry date (`EXP`, `BEST BY`, `USE BY`), category, sub-category, and tailored storage advice.
   - **Manual Form:** Clean, intuitive input fields with quick date presets (+3 days, +1 week, +1 month, +6 months) and storage location tags (Fridge, Pantry, Freezer, Medicine Cabinet).

2. **Smart Dynamic Prioritization:**
   - Multi-factor urgency scoring (0–100) based on days remaining and category hazard multipliers.
   - High-risk items (e.g., antibiotics, perishable dairy/meat) are scored higher in the priority queue to prevent health risks and spoilage.

3. **Urgent Action Queue:**
   - Dedicated priority section highlighting items needing immediate consumption within 48 hours or items overdue.
   - 1-click **"Consume"** action to celebrate waste prevented and track grocery savings.

4. **Automated Alerts & Notification Center:**
   - Background check runs periodically to detect expiring items at customizable intervals (7 days, 3 days, 1 day, day of expiry).
   - In-app notification center with audit trigger and email alert log dispatch simulation to user inbox (`rajeshknarasappa@gmail.com`).

5. **Household Waste Reduction Scorecard:**
   - Real-time analytics tracking waste avoided efficiency (%), items consumed vs. discarded, and estimated money saved ($).

6. **Mobile Ready & PWA:**
   - Fully responsive design with mobile bottom thumb navigation bar.
   - Supports native camera label snapping on iOS and Android.
   - Installable to mobile and desktop home screens via Web App Manifest.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend:** Node.js, Express, tsx
- **AI & Vision:** `@google/genai` (Gemini 3.8 Flash multimodal vision)
- **Database:** Prisma Schema + Persistent JSON store (`data/items.json`)
- **Build Tool:** Vite 8

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or bun
- Gemini API Key

### 1. Clone the repository
```bash
git clone https://github.com/rajeshknarasappa-ux/expiryAlertApp.git
cd expiryAlertApp
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your Gemini API key in `.env`:
```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
PORT=3000
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production
```bash
npm run build
npm start
```

---

## 📂 Project Structure

```
├── data/                    # JSON database storage (items, notifications, settings)
├── prisma/
│   └── schema.prisma        # Database schema (User, Item, NotificationLog)
├── public/                  # Public assets & PWA manifest
├── src/
│   ├── components/          # React components
│   │   ├── AddItemModal.tsx       # Dual-mode AI OCR & manual entry
│   │   ├── ImpactStatsModal.tsx   # Waste reduction & savings stats
│   │   ├── InventoryView.tsx      # Filterable cards/table view
│   │   ├── ItemDetailModal.tsx    # Shelf-life timeline & details
│   │   ├── NotificationCenter.tsx # Alert logs & scheduled check
│   │   ├── PriorityQueue.tsx      # Urgent items queue (≤48h)
│   │   ├── SettingsModal.tsx      # Alert intervals & notification email
│   │   └── ShareLinkModal.tsx     # Mobile QR code & live links
│   ├── data/
│   │   └── sampleLabels.ts        # Presets for 1-click OCR testing
│   ├── server/
│   │   ├── db.ts                  # Persistent storage engine
│   │   └── geminiOcr.ts           # Gemini Vision OCR extraction service
│   ├── types/
│   │   └── index.ts               # Core TypeScript definitions
│   ├── utils/
│   │   └── prioritization.ts      # Urgency scoring algorithm
│   ├── App.tsx                    # Main application container
│   ├── index.css                  # Global styles & Tailwind CSS
│   └── main.tsx                   # React client entry point
├── server.ts                # Express backend & Vite middleware
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📄 License
This project is licensed under the Apache 2.0 License.
