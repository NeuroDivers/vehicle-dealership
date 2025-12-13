# Feed-Based Scraper Migration Guide

## Overview

This migration replaces individual web scrapers (lambert-scraper, naniauto-scraper, sltautos-scraper) with a unified **feed-based scraper system** that reads XML/JSON feeds from a configurable database table.

## Benefits

✅ **No hardcoded URLs** - All feed URLs stored in database  
✅ **Easy vendor management** - Add/edit/delete vendors via UI  
✅ **Unified codebase** - One scraper handles all vendors  
✅ **Better tracking** - Sync history and status per vendor  
✅ **Scalable** - Add new vendors without code changes  

---

## Architecture

### New Components

1. **`vendor_feeds` table** - Stores feed configurations
2. **`feed-scraper` worker** - Universal XML/JSON feed parser
3. **`feed-management-api` worker** - CRUD API for feeds
4. **`FeedManagement.tsx`** - Admin UI component

### Data Flow

```
Admin UI → Feed Management API → vendor_feeds table
                                        ↓
                              Feed Scraper Worker
                                        ↓
                              vehicles table + Image Processor
```

---

## Deployment Steps

### Step 1: Run Database Migration

```bash
# Navigate to project root
cd d:\CascadeProjects\auto-pret-123

# Apply migration to D1 database
wrangler d1 execute vehicle-dealership-analytics --file=migrations/add-vendor-feeds.sql --remote
```

**What this does:**
- Creates `vendor_feeds` table
- Inserts initial feed configurations for Lambert, NaniAuto, and SLT Autos
- Creates indexes for performance

### Step 2: Deploy Workers

```bash
# Deploy feed scraper worker
wrangler deploy --config workers/wrangler-feed-scraper.toml

# Deploy feed management API worker
wrangler deploy --config workers/wrangler-feed-management-api.toml
```

**Expected Output:**
```
✅ feed-scraper deployed to https://feed-scraper.nick-damato0011527.workers.dev
✅ feed-management-api deployed to https://feed-management-api.nick-damato0011527.workers.dev
```

### Step 3: Update Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_FEED_MANAGEMENT_API=https://feed-management-api.nick-damato0011527.workers.dev
NEXT_PUBLIC_FEED_SCRAPER_API=https://feed-scraper.nick-damato0011527.workers.dev
```

### Step 4: Update Frontend

The `FeedManagement.tsx` component is ready to use. You can:

**Option A: Add to existing admin dashboard**
```tsx
// In your admin dashboard page
import FeedManagement from '@/components/admin/FeedManagement';

export default function AdminPage() {
  return (
    <div>
      <FeedManagement />
    </div>
  );
}
```

**Option B: Create dedicated feed management page**
```tsx
// src/app/admin/feeds/page.tsx
import FeedManagement from '@/components/admin/FeedManagement';

export default function FeedsPage() {
  return <FeedManagement />;
}
```

### Step 5: Deploy Frontend

```bash
# Commit changes
git add .
git commit -m "Add feed-based scraper system"
git push origin main

# This triggers Cloudflare Pages rebuild automatically
```

**⚠️ IMPORTANT:** Frontend MUST be deployed to Cloudflare Pages for the new UI to be accessible.

---

## Usage

### Via Admin UI

1. Navigate to Feed Management page
2. Click **"Add Feed"** to add new vendor
3. Click **"Sync"** button to import vehicles from a feed
4. Click **"Sync All"** to import from all active feeds
5. Edit/delete feeds as needed

### Via API

**Sync specific vendor:**
```bash
curl -X POST https://feed-scraper.nick-damato0011527.workers.dev/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"vendorId": "lambert"}'
```

**Sync all vendors:**
```bash
curl -X POST https://feed-scraper.nick-damato0011527.workers.dev/api/scrape-all
```

**Get all feeds:**
```bash
curl https://feed-management-api.nick-damato0011527.workers.dev/api/feeds
```

**Add new feed:**
```bash
curl -X POST https://feed-management-api.nick-damato0011527.workers.dev/api/feeds \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_id": "newvendor",
    "vendor_name": "New Vendor",
    "feed_url": "https://example.com/feed.xml",
    "feed_type": "xml",
    "is_active": true,
    "sync_frequency": "daily"
  }'
```

---

## Feed XML Format

The scraper expects XML in this format:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<vehicles>
  <vehicle>
    <make>Toyota</make>
    <model>Camry</model>
    <year>2024</year>
    <price>25000</price>
    <odometer>15000</odometer>
    <bodyType>Sedan</bodyType>
    <color>White</color>
    <vin>1HGBH41JXMN109186</vin>
    <stockNumber>T12345</stockNumber>
    <description>2024 Toyota Camry in excellent condition</description>
    <fuelType>Gasoline</fuelType>
    <transmission>Automatic</transmission>
    <drivetrain>FWD</drivetrain>
    <engineSize>2.5L</engineSize>
    <image>https://example.com/image1.jpg</image>
    <image>https://example.com/image2.jpg</image>
  </vehicle>
  <!-- More vehicles... -->
</vehicles>
```

**Supported field variations:**
- `odometer`, `mileage`, `kilometers`
- `bodyType`, `body_type`, `body`
- `color`, `exterior_color`
- `stockNumber`, `stock_number`, `stock`
- `fuelType`, `fuel_type`, `fuel`
- `engineSize`, `engine_size`, `engine`
- `image`, `photo`

---

## Migration from Old Scrapers

### What Happens to Old Scrapers?

The old scrapers (`lambert-scraper-enhanced.js`, `naniauto-scraper.js`, `sltautos-scraper.js`) can be:

1. **Kept as backup** - They still work independently
2. **Deprecated** - Update VendorManagement.tsx to call feed-scraper instead
3. **Removed** - Once feed-scraper is verified working

### Update VendorManagement.tsx

Replace old scraper calls with feed-scraper:

```tsx
// OLD WAY
const response = await fetch('https://lambert-scraper-enhanced.nick-damato0011527.workers.dev/api/scrape', {
  method: 'POST'
});

// NEW WAY
const response = await fetch('https://feed-scraper.nick-damato0011527.workers.dev/api/scrape', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ vendorId: 'lambert' })
});
```

---

## Troubleshooting

### Feed not syncing

1. Check feed URL is accessible: `curl [feed_url]`
2. Verify feed format matches expected XML structure
3. Check worker logs: `wrangler tail feed-scraper`
4. Ensure `is_active = 1` in vendor_feeds table

### Images not uploading

1. Verify `IMAGE_PROCESSOR` service binding is configured
2. Check Cloudflare Images credentials in wrangler.toml
3. Ensure image URLs in feed are accessible
4. Check image-processor worker logs

### Duplicate vehicles

The scraper checks for duplicates using:
1. **VIN** (if available)
2. **Make + Model + Year + vendor_id** (fallback)

If duplicates still occur, check that VINs are consistent in the feed.

---

## Database Schema

### vendor_feeds Table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| vendor_id | TEXT | Unique vendor identifier |
| vendor_name | TEXT | Display name |
| feed_url | TEXT | XML/JSON feed URL |
| feed_type | TEXT | 'xml', 'json', or 'csv' |
| is_active | INTEGER | 1 = active, 0 = inactive |
| sync_frequency | TEXT | 'manual', 'hourly', 'daily', 'weekly' |
| last_sync_at | DATETIME | Last sync timestamp |
| last_sync_status | TEXT | 'success', 'error', 'pending' |
| last_sync_message | TEXT | Status message |
| last_sync_count | INTEGER | Vehicles processed |
| total_syncs | INTEGER | Total sync count |
| created_at | DATETIME | Creation timestamp |
| updated_at | DATETIME | Last update timestamp |

---

## Next Steps

1. ✅ Deploy migration and workers
2. ✅ Test syncing with existing vendors
3. ⏳ Monitor for 24-48 hours
4. ⏳ Deprecate old scrapers if successful
5. ⏳ Add automated scheduling (Cloudflare Cron Triggers)

---

## Support

For issues or questions:
- Check worker logs: `wrangler tail [worker-name]`
- Review D1 database: `wrangler d1 execute vehicle-dealership-analytics --command "SELECT * FROM vendor_feeds"`
- Check this documentation: `docs/FEED_SCRAPER_MIGRATION.md`
