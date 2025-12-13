# Feed-Based Scraper System

## Overview

A unified, database-driven vehicle feed scraper system that replaces individual vendor scrapers with a single, configurable solution.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Admin Dashboard                         │
│                   (FeedManagement.tsx)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Feed Management API Worker                      │
│         (feed-management-api.js)                            │
│                                                              │
│  • GET /api/feeds - List all feeds                          │
│  • POST /api/feeds - Create feed                            │
│  • PUT /api/feeds/{id} - Update feed                        │
│  • DELETE /api/feeds/{id} - Delete feed                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  D1 Database                                 │
│              vendor_feeds table                              │
│                                                              │
│  • vendor_id, vendor_name, feed_url                         │
│  • feed_type, is_active, sync_frequency                     │
│  • last_sync_at, last_sync_status                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Feed Scraper Worker                             │
│              (feed-scraper.js)                               │
│                                                              │
│  • POST /api/scrape - Sync one vendor                       │
│  • POST /api/scrape-all - Sync all vendors                  │
│                                                              │
│  1. Fetch XML/JSON feed                                     │
│  2. Parse vehicle data                                      │
│  3. Normalize fields                                        │
│  4. Check for duplicates (VIN or make/model/year)           │
│  5. Insert/Update vehicles table                            │
│  6. Trigger image processing                                │
│  7. Update sync status                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Image Processor Worker                          │
│           (image-processor.js)                               │
│                                                              │
│  • Download images from vendor URLs                         │
│  • Upload to Cloudflare Images                              │
│  • Update vehicles table with CF image IDs                  │
└─────────────────────────────────────────────────────────────┘
```

## Workers

### 1. feed-scraper.js

**Purpose:** Universal XML/JSON feed parser and vehicle importer

**Endpoints:**
- `POST /api/scrape` - Sync specific vendor
  ```json
  { "vendorId": "lambert" }
  ```
- `POST /api/scrape-all` - Sync all active vendors

**Features:**
- ✅ XML feed parsing with flexible field matching
- ✅ Duplicate detection (VIN or make/model/year)
- ✅ Preserves Cloudflare image IDs on updates
- ✅ Vendor markup price calculation
- ✅ Async image processing
- ✅ Sync status tracking

**Configuration:** `wrangler-feed-scraper.toml`

### 2. feed-management-api.js

**Purpose:** CRUD API for vendor_feeds table

**Endpoints:**
- `GET /api/feeds` - List all feeds
- `GET /api/feeds/{vendor_id}` - Get single feed
- `POST /api/feeds` - Create new feed
- `PUT /api/feeds/{vendor_id}` - Update feed
- `DELETE /api/feeds/{vendor_id}` - Delete feed

**Configuration:** `wrangler-feed-management-api.toml`

## Database Schema

### vendor_feeds Table

```sql
CREATE TABLE vendor_feeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id TEXT NOT NULL UNIQUE,
  vendor_name TEXT NOT NULL,
  feed_url TEXT NOT NULL,
  feed_type TEXT DEFAULT 'xml',
  is_active INTEGER DEFAULT 1,
  sync_frequency TEXT DEFAULT 'manual',
  last_sync_at DATETIME,
  last_sync_status TEXT,
  last_sync_message TEXT,
  last_sync_count INTEGER DEFAULT 0,
  total_syncs INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## XML Feed Format

Expected XML structure:

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
    <fuelType>Gasoline</fuelType>
    <transmission>Automatic</transmission>
    <image>https://example.com/img1.jpg</image>
    <image>https://example.com/img2.jpg</image>
  </vehicle>
</vehicles>
```

**Flexible Field Names:**
- `odometer` / `mileage` / `kilometers`
- `bodyType` / `body_type` / `body`
- `color` / `exterior_color`
- `stockNumber` / `stock_number` / `stock`
- `fuelType` / `fuel_type` / `fuel`
- `image` / `photo`

## Deployment

### Quick Deploy

```bash
# 1. Apply migration
wrangler d1 execute vehicle-dealership-analytics --file=migrations/add-vendor-feeds.sql --remote

# 2. Deploy workers
wrangler deploy --config workers/wrangler-feed-scraper.toml
wrangler deploy --config workers/wrangler-feed-management-api.toml
```

### Using PowerShell Script

```powershell
.\scripts\deploy-feed-system.ps1
```

## Testing

```powershell
# Run test suite
.\scripts\test-feed-system.ps1

# Manual test - sync a vendor
curl -X POST https://feed-scraper.nick-damato0011527.workers.dev/api/scrape `
  -H "Content-Type: application/json" `
  -d '{"vendorId": "lambert"}'
```

## Configuration

### Pre-configured Vendors

| Vendor ID | Vendor Name | Feed URL |
|-----------|-------------|----------|
| lambert | Lambert Auto | https://dealer-scraper.../api/feeds/5/xml |
| naniauto | NaniAuto | https://dealer-scraper.../api/feeds/1/xml |
| sltautos | SLT Autos | https://dealer-scraper.../api/feeds/6/xml |

### Adding New Vendors

**Via API:**
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

**Via Admin UI:**
1. Navigate to Feed Management
2. Click "Add Feed"
3. Fill in form
4. Click "Save"

## Monitoring

### View Logs

```bash
# Feed scraper logs
wrangler tail feed-scraper

# Feed management API logs
wrangler tail feed-management-api
```

### Check Sync Status

```bash
# View all feeds with sync status
wrangler d1 execute vehicle-dealership-analytics \
  --command "SELECT vendor_id, vendor_name, last_sync_at, last_sync_status, last_sync_count FROM vendor_feeds"
```

## Migration from Old Scrapers

### Old System
- `lambert-scraper-enhanced.js` - Web scraper
- `naniauto-scraper.js` - Web scraper
- `sltautos-scraper.js` - Web scraper

### New System
- `feed-scraper.js` - Universal feed parser
- `feed-management-api.js` - Feed configuration API

### Benefits
- ✅ No hardcoded URLs
- ✅ Easy to add new vendors
- ✅ Centralized sync tracking
- ✅ Better error handling
- ✅ Unified codebase

### Backward Compatibility

Old scrapers can remain deployed as backup. Update `VendorManagement.tsx` to call feed-scraper instead:

```tsx
// OLD
await fetch('https://lambert-scraper-enhanced.../api/scrape', { method: 'POST' });

// NEW
await fetch('https://feed-scraper.../api/scrape', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ vendorId: 'lambert' })
});
```

## Troubleshooting

### Feed not syncing
1. Check feed URL is accessible
2. Verify XML format matches expected structure
3. Check worker logs: `wrangler tail feed-scraper`
4. Ensure `is_active = 1`

### Images not uploading
1. Verify IMAGE_PROCESSOR service binding
2. Check Cloudflare Images credentials
3. Ensure image URLs are accessible

### Duplicate vehicles
- Scraper checks VIN first, then make/model/year
- Ensure VINs are consistent in feed
- Check vendor_id is correct

## Documentation

- **Quick Start:** `docs/FEED_SCRAPER_QUICK_START.md`
- **Migration Guide:** `docs/FEED_SCRAPER_MIGRATION.md`
- **This File:** `workers/README-FEED-SYSTEM.md`

## Support

For issues:
1. Check worker logs
2. Review documentation
3. Test API endpoints
4. Verify database schema
