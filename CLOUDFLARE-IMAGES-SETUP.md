# Cloudflare Images - Complete Setup ✅

## ✅ What's Configured

### 1. Lambert Scraper
- **Endpoint:** `/api/scrape` (default)
- **Behavior:** Automatically uploads ALL images to Cloudflare Images
- **Token:** `CF_IMAGES_TOKEN` (configured as secret)
- **Account:** 928f2a6b07f166d57bb4b31b9100d1f4
- **Hash:** fxSXhaLsNKtcGJIGPzWBwA

### 2. Image Upload Process
When you sync Lambert vehicles:
1. Scrapes vehicle data from Lambert website
2. Downloads each image from Lambert
3. Uploads to Cloudflare Images API
4. Generates Cloudflare delivery URL
5. Saves Cloudflare URL to database (not Lambert URL)

### 3. Website Display
All vehicle images now use Cloudflare Images:
- **Home page featured vehicles** → Thumbnail variant
- **Home page carousel** → Thumbnail variant
- **Vehicle listing page** → Thumbnail variant
- **Vehicle cards** → Thumbnail variant
- **Vehicle detail pages** → Public variant (full size)

## 🎯 Image Variants

Cloudflare Images automatically creates variants:

| Variant | Size | Used For | URL Pattern |
|---------|------|----------|-------------|
| `thumbnail` | ~300px | Listings, cards, grids | `/thumbnail` |
| `public` | Original | Detail pages, galleries | `/public` |

### Example URLs:
```
Thumbnail: https://imagedelivery.net/fxSXhaLsNKtcGJIGPzWBwA/2024-Buick-Encore-1/thumbnail
Full Size: https://imagedelivery.net/fxSXhaLsNKtcGJIGPzWBwA/2024-Buick-Encore-1/public
```

## 🚀 Benefits

### Performance
- ✅ **Faster page loads** - Smaller, optimized images
- ✅ **CDN delivery** - Served from nearest Cloudflare edge
- ✅ **Auto-optimization** - WebP, AVIF format conversion
- ✅ **Responsive** - Right size for each device

### Reliability
- ✅ **Persistent** - Images stay even if Lambert changes them
- ✅ **No hotlinking** - Not dependent on Lambert's server
- ✅ **99.9% uptime** - Cloudflare's infrastructure

### Cost
- ✅ **Bandwidth savings** - Smaller images = less data
- ✅ **Storage** - Cloudflare handles all storage
- ✅ **Free tier** - 100,000 images included

## 📋 How to Sync Vehicles

### Method 1: API Call (Recommended)
```powershell
$body = @{ saveToDatabase = $true } | ConvertTo-Json
Invoke-RestMethod -Uri "https://lambert-scraper.nick-damato0011527.workers.dev/api/scrape" `
  -Method Post -Body $body -ContentType "application/json"
```

### Method 2: Postman/Insomnia
- **URL:** `https://lambert-scraper.nick-damato0011527.workers.dev/api/scrape`
- **Method:** POST
- **Headers:** `Content-Type: application/json`
- **Body:**
```json
{
  "saveToDatabase": true
}
```

## 🔍 Verify It's Working

### Check Logs
```bash
npx wrangler tail lambert-scraper --format pretty
```

Look for:
```
=== Cloudflare Images Upload ===
Account ID: 928f2a6b07f166d57bb4b31b9100d1f4
Token exists: true
Uploading image 1: ...
✅ Uploaded: https://imagedelivery.net/...
```

### Check Database
```sql
SELECT images FROM vehicles LIMIT 1;
```

Should show Cloudflare URLs:
```json
["https://imagedelivery.net/fxSXhaLsNKtcGJIGPzWBwA/vehicle-1/public", ...]
```

NOT Lambert URLs:
```json
["https://www.automobile-lambert.com/wp-content/uploads/...", ...]
```

### Check Website
1. Go to your website
2. Open browser DevTools (F12)
3. Go to Network tab
4. Reload page
5. Filter by "img"
6. Look for URLs starting with `imagedelivery.net`

## 🛠️ Troubleshooting

### Images Not Uploading?
1. Check CF_IMAGES_TOKEN is set:
   ```bash
   npx wrangler secret list --config workers/wrangler-lambert-scraper.toml
   ```

2. Check logs for errors:
   ```bash
   npx wrangler tail lambert-scraper
   ```

3. Verify account credentials in `wrangler-lambert-scraper.toml`

### Images Still Showing Lambert URLs?
1. Re-sync vehicles using `/api/scrape` endpoint
2. Old vehicles may still have Lambert URLs
3. New syncs will have Cloudflare URLs

### Slow Upload?
- Normal! Uploading 40 vehicles × 15 images = 600 images
- Takes ~5-10 minutes for full sync
- 200ms delay between uploads to avoid rate limiting

## 📊 Current Status

- ✅ Cloudflare Images configured
- ✅ Lambert scraper uploads images automatically
- ✅ Website uses optimized variants
- ✅ Thumbnail variant for listings
- ✅ Public variant for detail pages
- ✅ All components updated

## 🎉 You're All Set!

Just sync Lambert vehicles and all images will automatically:
1. Upload to Cloudflare Images
2. Be optimized for web
3. Served from CDN
4. Display on your website

**No manual steps required!**
