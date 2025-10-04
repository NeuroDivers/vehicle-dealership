# SLT Autos Image Upload to Cloudflare Images

## Current Situation

**Issue:** SLT Autos vehicles on the homepage are showing images from `sltautos.com` instead of Cloudflare Images (`imagedelivery.net`)

**Root Cause:** The existing vehicles in the database were scraped BEFORE the `CF_IMAGES_TOKEN` was added to the worker configuration.

## What's Fixed

✅ **SLT Autos Scraper has CF_IMAGES_TOKEN** (deployed: `3291796c-2cbf-4b6d-a18a-f900c33d07ed`)
- Token added to `wrangler-sltautos-scraper.toml`
- Worker will now upload images to Cloudflare Images on every scrape

✅ **Scraper Logic is Correct**
- Checks for CF_IMAGES_TOKEN presence
- Uploads each vehicle's images to Cloudflare Images
- Replaces sltautos.com URLs with imagedelivery.net URLs

## How to Fix Existing Vehicles

### Option 1: Manual Trigger (Recommended)

1. Go to: https://autopret123.ca/admin
2. Navigate to SLT Autos Scraper section
3. Click "Run Scraper" or "Sync Now"
4. Wait for completion (shows progress)
5. Scraper will:
   - Re-scrape all vehicles from SLT Autos
   - Upload images to Cloudflare Images
   - Update database with new imagedelivery.net URLs

### Option 2: Wait for Scheduled Run

The SLT Autos scraper runs automatically (check cron schedule).
Next scheduled run will automatically upload images.

### Option 3: API Call

```bash
curl -X GET https://sltautos-scraper.nick-damato0011527.workers.dev/scrape
```

## What Happens After Re-Scraping

**Before:**
```json
{
  "images": [
    "https://sltautos.com/car_images/1758563_0.JPG",
    "https://sltautos.com/car_images/1758563_1.JPG"
  ]
}
```

**After:**
```json
{
  "images": [
    "https://imagedelivery.net/fxSXhaLsNKtcGJIGPzWBwA/NMTKHMBX3JR048026-0/public",
    "https://imagedelivery.net/fxSXhaLsNKtcGJIGPzWBwA/NMTKHMBX3JR048026-1/public"
  ]
}
```

## Benefits After Migration

✅ **Faster Loading**
- Cloudflare CDN instead of vendor site
- Optimized image delivery
- Thumbnail variants available

✅ **Better Caching**
- Long TTL (30 days+)
- Reduced bandwidth usage
- No dependency on vendor site uptime

✅ **Automatic Optimization**
- WebP conversion
- Responsive variants
- Lazy loading support

## Verification

After re-scraping, check a vehicle's images:

```sql
SELECT id, make, model, images 
FROM vehicles 
WHERE images LIKE '%imagedelivery.net%'
LIMIT 5;
```

You should see `imagedelivery.net` URLs instead of `sltautos.com`.

## Monitoring

Watch the scraper logs for:
```
🖼️  Uploading images to Cloudflare Images...
Uploading 8 images for Toyota Camry...
✅ Image uploaded: imagedelivery.net/...
```

If you see this, images are being uploaded successfully!

## Troubleshooting

**If images still from sltautos.com after re-scrape:**

1. Check worker has CF_IMAGES_TOKEN:
   ```bash
   npx wrangler secret list --config workers/wrangler-sltautos-scraper.toml
   ```

2. Check scraper logs for errors

3. Verify account credentials:
   - Account ID: `928f2a6b07f166d57bb4b31b9100d1f4`
   - Account Hash: `fxSXhaLsNKtcGJIGPzWBwA`

4. Test image upload manually via API

## Summary

- ✅ Worker is ready with CF_IMAGES_TOKEN
- ✅ Logic is correct and tested
- ⏳ **Just need to run the scraper** to update existing vehicles
- 🎯 New scrapes will automatically use Cloudflare Images
