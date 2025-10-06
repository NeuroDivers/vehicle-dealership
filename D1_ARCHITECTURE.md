# 🏗️ D1-Based Architecture (NO PRISMA)

## ✅ Current Setup

**ALL data is stored in Cloudflare D1 database:**
- Database: `vehicle-dealership-analytics`
- Database ID: `d70754b6-fec7-483a-b103-c1c78916c497`
- Account: `928f2a6b07f166d57bb4b31b9100d1f4`

**Prisma/SQLite is DISABLED** - Do not use Next.js API routes for data operations.

---

## 🚀 How It Works

### **Data Flow:**

```
┌─────────────────────────────────────────┐
│  Scraper Workers (Lambert/Nani/SLT)   │
│  1. Scrape vendor websites             │
│  2. Save directly to D1                │
│  3. Trigger image processor            │
│  4. Return success response            │
└─────────────────────────────────────────┘
         ↓ (saves to D1)
┌─────────────────────────────────────────┐
│  D1 Database                           │
│  - vehicles table                       │
│  - image_processing_jobs                │
│  - analytics tables                     │
└─────────────────────────────────────────┘
         ↓ (reads from D1)
┌─────────────────────────────────────────┐
│  Image Processor Worker                │
│  - Processes vendor URLs                │
│  - Uploads to Cloudflare Images         │
│  - Updates D1 with image IDs            │
└─────────────────────────────────────────┘
         ↓ (reads from D1)
┌─────────────────────────────────────────┐
│  Analytics Worker                       │
│  - Provides REST API to read vehicles   │
│  - Tracks analytics                     │
└─────────────────────────────────────────┘
         ↓ (calls analytics worker)
┌─────────────────────────────────────────┐
│  Cloudflare Pages (Next.js Frontend)   │
│  - Displays vehicles from D1            │
│  - Triggers scrapers                    │
│  - Shows progress                       │
└─────────────────────────────────────────┘
```

---

## 📊 Workers & Their D1 Access

| Worker | Has D1 Binding | Purpose |
|--------|---------------|---------|
| **lambert-scraper** | ✅ YES | Scrapes Lambert, saves to D1, triggers images |
| **naniauto-scraper** | ✅ YES | Scrapes Nani Auto, saves to D1, triggers images |
| **sltautos-scraper** | ✅ YES | Scrapes SLT Autos, saves to D1, triggers images |
| **image-processor** | ✅ YES | Processes images, updates D1, tracks jobs |
| **analytics worker** | ✅ YES | Provides API to read from D1 |

---

## 🔧 Running Scrapers

### **Lambert Scraper:**
```bash
curl -X POST https://lambert-scraper.nick-damato0011527.workers.dev/api/scrape
```

**What it does:**
1. Scrapes ~44 vehicles from automobile-lambert.com
2. Saves each vehicle to D1 `vehicles` table
3. Triggers image processor with vehicle IDs
4. Returns success with `imageProcessingJobId`

### **Nani Auto / SLT Autos:**
Same pattern - just call their `/api/scrape` endpoint.

---

## 📸 Image Processing

**Automatic flow:**
1. Scraper saves vehicle with vendor image URLs (e.g., `https://cdn.drivegood.com/...`)
2. Scraper triggers image processor with vehicle ID
3. Image processor:
   - Downloads images from vendor
   - Uploads to Cloudflare Images (parallel)
   - Updates vehicle record with Cloudflare image IDs
   - Tracks progress in `image_processing_jobs` table

**Monitor progress:**
```bash
curl https://image-processor.nick-damato0011527.workers.dev/api/jobs/{jobId}
```

---

## 🚫 What NOT to Use

### ❌ **Disabled: Prisma/Next.js API Routes**

These folders have been renamed with `.DISABLED_PRISMA` suffix:
- `src/app/api/admin/lambert/sync-vehicles.DISABLED_PRISMA/`
- `src/app/api/admin/vehicles/sync.DISABLED_PRISMA/`
- `src/app/api/admin/lambert/sync.DISABLED_PRISMA/`

**Why disabled:**
- Prisma cannot connect to databases from Cloudflare Pages
- Creates confusion with two separate databases
- D1 is the single source of truth

**DO NOT re-enable these endpoints.**

---

## 📖 Reading Data from D1

### **Option 1: Analytics Worker API (Recommended)**
```javascript
// From Next.js frontend
const response = await fetch(
  'https://vehicle-dealership-analytics.nick-damato0011527.workers.dev/api/vehicles'
);
const vehicles = await response.json();
```

### **Option 2: Direct D1 Query (from Workers)**
```javascript
// Inside a worker with D1 binding
const { results } = await env.DB.prepare(`
  SELECT * FROM vehicles 
  WHERE vendor_status = 'active' AND is_published = 1
  ORDER BY created_at DESC
  LIMIT 50
`).all();
```

---

## 🗄️ D1 Database Schema

### **vehicles table:**
```sql
CREATE TABLE vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  price REAL NOT NULL,
  odometer INTEGER NOT NULL,
  bodyType TEXT,
  color TEXT,
  vin TEXT,
  stockNumber TEXT,
  description TEXT,
  images TEXT, -- JSON array
  isSold INTEGER DEFAULT 0,
  
  -- Vendor tracking
  vendor_id TEXT DEFAULT 'internal',
  vendor_name TEXT DEFAULT 'Internal Inventory',
  vendor_status TEXT DEFAULT 'active',
  vendor_stock_number TEXT,
  last_seen_from_vendor DATETIME,
  is_published INTEGER DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎯 Deployment

### **Deploy Scrapers:**
```bash
# Lambert
wrangler deploy workers/lambert-scraper-enhanced.js --config workers/wrangler-lambert-scraper.toml

# Nani Auto
wrangler deploy workers/naniauto-scraper.js --config workers/wrangler-naniauto-scraper.toml

# SLT Autos
wrangler deploy workers/sltautos-scraper.js --config workers/wrangler-sltautos-scraper.toml
```

### **Deploy Image Processor:**
```bash
wrangler deploy workers/image-processor.js --config workers/wrangler-image-processor.toml
```

### **Deploy Next.js (Cloudflare Pages):**
```bash
# Automatic on git push to main
# Or manual: git push origin main
```

---

## ✅ Testing the Complete Flow

### **1. Run Scraper**
```bash
curl -X POST https://lambert-scraper.nick-damato0011527.workers.dev/api/scrape
```

**Response:**
```json
{
  "success": true,
  "count": 44,
  "imageProcessingJobId": "lambert-1234567890-abc123",
  "duration": 15
}
```

### **2. Check Image Processing Progress**
```bash
curl https://image-processor.nick-damato0011527.workers.dev/api/jobs/lambert-1234567890-abc123
```

**Response:**
```json
{
  "success": true,
  "job": {
    "status": "processing",
    "progress": 65,
    "vehicles_processed": 28,
    "total_vehicles": 44,
    "images_uploaded": 112,
    "images_failed": 3,
    "current_vehicle": "2020 Toyota Camry"
  }
}
```

### **3. Verify in D1**
```bash
wrangler d1 execute vehicle-dealership-analytics --command "SELECT COUNT(*) FROM vehicles WHERE vendor_id='lambert'"
```

---

## 🎉 Benefits of This Architecture

✅ **Single Source of Truth** - Only D1, no confusion  
✅ **Works on Cloudflare Pages** - No server-side database needed  
✅ **Fast & Global** - D1 accessible from all Workers  
✅ **Automatic Image Processing** - No manual intervention  
✅ **Real-time Progress** - Track jobs as they run  
✅ **Scalable** - Workers handle traffic spikes automatically  
✅ **Cost Effective** - Cloudflare free tier covers most usage  

---

## 🚨 Important Notes

1. **Never use Prisma** - It's disabled for a reason
2. **All scrapers save to D1** - Not to Prisma
3. **Image processor uses D1** - For vehicles and jobs
4. **Frontend reads from D1** - Via analytics worker
5. **One database** - D1 is the only truth

---

**Last Updated:** 2025-10-05  
**Architecture:** D1-only, no Prisma  
**Status:** ✅ Production Ready
