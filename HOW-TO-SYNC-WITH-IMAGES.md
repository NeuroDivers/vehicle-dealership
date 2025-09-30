# How to Sync Lambert Vehicles with Cloudflare Images

## The Problem
There are TWO scraper endpoints:

1. **`/api/scrape`** - Basic scraping (NO image upload) ❌
2. **`/api/scrape-with-images`** - Scraping WITH Cloudflare Images upload ✅

You've been using `/api/scrape` which doesn't upload images!

## The Solution

### Use the correct endpoint:

**Endpoint:** `https://lambert-scraper.nick-damato0011527.workers.dev/api/scrape-with-images`

**Method:** POST

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "saveToDatabase": true
}
```

## How to Call It

### Option 1: Using Postman/Insomnia
1. Create a new POST request
2. URL: `https://lambert-scraper.nick-damato0011527.workers.dev/api/scrape-with-images`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
   ```json
   {
     "saveToDatabase": true
   }
   ```
5. Send

### Option 2: Using PowerShell
```powershell
$body = @{
    saveToDatabase = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://lambert-scraper.nick-damato0011527.workers.dev/api/scrape-with-images" -Method Post -Body $body -ContentType "application/json"
```

### Option 3: Using curl (in Git Bash or WSL)
```bash
curl -X POST https://lambert-scraper.nick-damato0011527.workers.dev/api/scrape-with-images \
  -H "Content-Type: application/json" \
  -d '{"saveToDatabase": true}'
```

## What Will Happen

When you use `/api/scrape-with-images`, you'll see logs like:

```
=== Cloudflare Images Upload ===
Account ID: 928f2a6b07f166d57bb4b31b9100d1f4
Account Hash: fxSXhaLsNKtcGJIGPzWBwA
Token exists: true
Vehicle ID: 2024-Buick-Encore-GX
Image count: 15
Uploading image 1: https://...
✅ Uploaded: https://imagedelivery.net/fxSXhaLsNKtcGJIGPzWBwA/2024-Buick-Encore-GX-1/public
Uploading image 2: https://...
✅ Uploaded: https://imagedelivery.net/fxSXhaLsNKtcGJIGPzWBwA/2024-Buick-Encore-GX-2/public
...
```

## Verify It Worked

After running the sync, check a vehicle in the database:
```sql
SELECT images FROM vehicles LIMIT 1;
```

The images should be Cloudflare URLs like:
```
["https://imagedelivery.net/fxSXhaLsNKtcGJIGPzWBwA/vehicle-id-1/public", ...]
```

NOT Lambert URLs like:
```
["https://www.automobile-lambert.com/wp-content/uploads/...", ...]
```

## Troubleshooting

If images still don't upload:
1. Check the logs: `npx wrangler tail lambert-scraper --format pretty`
2. Look for the "=== Cloudflare Images Upload ===" message
3. Check for error messages
4. Verify CF_IMAGES_TOKEN is set in the worker
