# NaniAuto Vendor Integration

## Overview
NaniAuto has been added as a second vendor alongside Lambert Auto.

## What Was Created

### 1. NaniAuto Scraper Worker
**File:** `workers/naniauto-scraper.js`
**URL:** `https://naniauto-scraper.nick-damato0011527.workers.dev`

**Features:**
- Scrapes inventory from https://naniauto.com/fr/inventory/
- Extracts vehicle details from detail pages
- Uploads images to Cloudflare Images
- Normalizes French/English field names

**Data Extracted:**
- Make, Model, Year
- Price, Kilometers (Odometer)
- Body Type, Fuel Type, Transmission
- Exterior Color, VIN
- Images (up to 15 per vehicle)

### 2. Vendor Sync Integration
**Updated:** `workers/vendor-sync-worker.js`

Added `syncNaniAuto()` function that:
- Calls NaniAuto scraper
- Saves vehicles to database with `vendor_id = 'naniauto'`
- Updates existing vehicles or inserts new ones
- Tracks vendor status and last seen date

### 3. Vendor Management UI
**Updated:** `src/components/admin/VendorManagement.tsx`

NaniAuto now appears in the vendor list with:
- Real-time stats (total, active, sold, unlisted)
- Sync button
- Last sync timestamp
- Vendor configuration

### 4. API Stats
**Updated:** `workers/vehicle-api-worker.js`

`GET /api/vendor-stats` now returns stats for:
- Lambert
- **NaniAuto** (new!)
- Internal

## How to Deploy

### Step 1: Deploy NaniAuto Scraper
```bash
cd workers
npx wrangler deploy naniauto-scraper.js --config wrangler-naniauto-scraper.toml
```

### Step 2: Add Cloudflare Images Token
```bash
npx wrangler secret put CF_IMAGES_TOKEN --config wrangler-naniauto-scraper.toml
# Paste the same token used for Lambert scraper
```

### Step 3: Deploy Vendor Sync Worker
```bash
npx wrangler deploy vendor-sync-worker.js --config wrangler-vendor-sync.toml
```

### Step 4: Deploy API Worker
```bash
npx wrangler deploy vehicle-api-worker.js --config wrangler-vehicle-api.toml
```

## How to Use

### Sync NaniAuto Vehicles
1. Go to Admin → Vendor Management
2. Find "NaniAuto" card
3. Click "Sync Now"
4. Wait for sync to complete
5. Check stats and sync history

### View NaniAuto Vehicles
All NaniAuto vehicles will appear in:
- Home page (if featured)
- Vehicles listing page
- Filtered by `vendor_id = 'naniauto'`

## Example Vehicle Data

From: https://naniauto.com/fr/details/p/1733344214/2017-gmc-other-automatique/

```json
{
  "make": "GMC",
  "model": "Other",
  "year": 2017,
  "price": 12950,
  "odometer": 180698,
  "bodyType": "Van",
  "fuelType": "Gasoline",
  "transmission": "Automatic",
  "color": "White",
  "vin": "1GTW7AFF5H1203804",
  "stockNumber": "NANI-1733344214",
  "vendor_id": "naniauto",
  "vendor_name": "NaniAuto"
}
```

## Multi-Vendor Features

- ✅ Track vehicle source (Lambert, NaniAuto, Internal)
- ✅ Vendor-specific sync schedules
- ✅ Separate stats per vendor
- ✅ Vendor status tracking (active/unlisted)
- ✅ Last seen from vendor timestamp
- ✅ Auto-remove stale listings (configurable)

## Next Steps

1. Deploy all workers
2. Test NaniAuto sync
3. Verify vehicles appear in database
4. Check images uploaded to Cloudflare
5. View vehicles on website

## Troubleshooting

**No vehicles scraped?**
- Check NaniAuto website is accessible
- View worker logs: `npx wrangler tail naniauto-scraper`

**Images not uploading?**
- Verify CF_IMAGES_TOKEN is set
- Check Cloudflare Images quota

**Sync fails?**
- Check vendor-sync-worker logs
- Verify database connection
- Check NaniAuto scraper is deployed
