# Latino-Auto.com Site Update Required

## Issue
The `latino-auto.com` website is showing errors when trying to sync vendors:
```
Access to fetch at 'https://latino-auto-vendor-feed-sync.nick-damato0011527.workers.dev/sync/lambert' 
from origin 'https://latino-auto.com' has been blocked by CORS policy
```

## Root Cause
1. **Old worker deleted**: `latino-auto-vendor-feed-sync` was deleted (it was obsolete)
2. **Old code deployed**: `latino-auto.com` still has old code that references the deleted worker
3. **Separate deployment**: `latino-auto.com` is a different Cloudflare Pages project from `autopret123.ca`

## Current State

### autopret123.ca ✅
- **Status**: Up to date
- **Feed Scraper**: Uses `feed-scraper.nick-damato0011527.workers.dev`
- **Working**: Yes

### latino-auto.com ❌
- **Status**: Outdated
- **Feed Scraper**: Trying to use deleted `latino-auto-vendor-feed-sync` worker
- **Working**: No - CORS errors

## Solution Options

### Option 1: Update latino-auto.com Deployment (Recommended)
Deploy the latest code to latino-auto.com so it uses the new `feed-scraper` worker:

```bash
# If latino-auto.com is connected to the same GitHub repo:
# Just push to the branch it's watching (probably main)
git push origin main

# Cloudflare Pages will auto-deploy
```

**Update environment variables for latino-auto.com:**
```
NEXT_PUBLIC_FEED_SCRAPER_API=https://feed-scraper.nick-damato0011527.workers.dev
NEXT_PUBLIC_AUTOPRET_API=https://autopret-api.nick-damato0011527.workers.dev
```

### Option 2: Recreate Old Worker (Not Recommended)
If you can't update latino-auto.com immediately, you could temporarily recreate the old worker as a proxy:

```javascript
// latino-auto-vendor-feed-sync.js (temporary proxy)
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Proxy to new feed-scraper
    const newUrl = url.pathname.replace('/sync/', '');
    const vendorId = newUrl.split('/')[0];
    
    const response = await fetch('https://feed-scraper.nick-damato0011527.workers.dev/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendorId })
    });
    
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
};
```

### Option 3: Disable Feed Sync on latino-auto.com
If feed sync isn't needed on latino-auto.com, hide or disable the feature in the UI.

## Recommended Action

**Update latino-auto.com to use the new architecture:**

1. **Check Cloudflare Pages Projects:**
   - Go to Cloudflare Dashboard → Pages
   - Find `latino-auto` project
   - Check which branch it's deploying from

2. **Ensure Latest Code:**
   - Verify `latino-auto` project is deploying from `main` branch
   - Or manually trigger a redeploy

3. **Update Environment Variables:**
   ```
   NEXT_PUBLIC_FEED_SCRAPER_API=https://feed-scraper.nick-damato0011527.workers.dev
   NEXT_PUBLIC_AUTOPRET_API=https://autopret-api.nick-damato0011527.workers.dev
   NEXT_PUBLIC_ANALYTICS_API_URL=https://autopret-api.nick-damato0011527.workers.dev
   ```

4. **Redeploy:**
   - Trigger manual redeploy in Cloudflare Pages dashboard
   - Or push a commit to trigger auto-deploy

## Verification

After updating latino-auto.com:

1. **Clear browser cache** (Ctrl+Shift+R)
2. **Check console** - Should see new worker URLs
3. **Test sync** - Should work without CORS errors
4. **Check network tab** - Should call `feed-scraper.nick-damato0011527.workers.dev`

## Current Worker URLs

### Active Workers ✅
- `feed-scraper.nick-damato0011527.workers.dev` - NEW unified scraper
- `autopret-api.nick-damato0011527.workers.dev` - Main API
- `autopret-images.nick-damato0011527.workers.dev` - Image processing
- `dealer-scraper.nick-damato0011527.workers.dev` - Feed provider

### Deleted Workers ❌
- `latino-auto-vendor-feed-sync.nick-damato0011527.workers.dev` - DELETED

## Notes

- Both sites (`autopret123.ca` and `latino-auto.com`) should use the same backend workers
- The new `feed-scraper` worker is more robust and unified
- Keeping old workers creates maintenance burden and schema conflicts
- All sites should be updated to use the new architecture

## Status
⚠️ **Action Required**: Update latino-auto.com deployment

## Date Identified
2025-12-13 23:52 EST
