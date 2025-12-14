# Cloudflare Pages Environment Variables Update

## Issue

The frontend is still trying to use old worker URLs because environment variables in Cloudflare Pages are set to the old values.

## Fix Applied

Updated `FeedManagement.tsx` to prioritize the new environment variable names and fall back correctly.

---

## Required: Update Cloudflare Pages Environment Variables

### 1. Go to Cloudflare Pages Dashboard

1. Visit: https://dash.cloudflare.com/
2. Navigate to: **Pages** → **Your Project** → **Settings** → **Environment Variables**

### 2. Delete Old Variables (Optional)

These are no longer needed:
- ❌ `NEXT_PUBLIC_FEED_MANAGEMENT_API`
- ❌ `NEXT_PUBLIC_VEHICLE_API`

### 3. Add/Update These Variables

**For Production AND Preview:**

```env
# Unified API (NEW - replaces 3 old workers)
NEXT_PUBLIC_AUTOPRET_API=https://autopret-api.nick-damato0011527.workers.dev

# Legacy compatibility (points to same unified API)
NEXT_PUBLIC_ANALYTICS_API_URL=https://autopret-api.nick-damato0011527.workers.dev

# Feed Scraper (separate worker for heavy processing)
NEXT_PUBLIC_FEED_SCRAPER_API=https://feed-scraper.nick-damato0011527.workers.dev
```

### 4. Redeploy

After updating environment variables:
1. Click **"Save"**
2. Go to **Deployments** tab
3. Click **"Retry deployment"** on the latest deployment

OR just push a new commit (already done with the fix).

---

## Current Status

### ✅ Code Fixed
- `FeedManagement.tsx` now uses correct fallback chain
- Will use `NEXT_PUBLIC_AUTOPRET_API` first
- Falls back to `NEXT_PUBLIC_ANALYTICS_API_URL`
- Finally falls back to hardcoded URL

### ⚠️ Environment Variables Need Update
The old environment variable `NEXT_PUBLIC_FEED_MANAGEMENT_API` is still pointing to the old worker, which is why you're seeing the CORS error.

---

## Quick Fix (Temporary)

The code fix I just pushed will work immediately because it now has a proper fallback chain. Once Cloudflare Pages redeploys (2-5 minutes), the issue will be resolved even without updating the environment variables.

However, you should still update the environment variables in Cloudflare Pages for cleanliness.

---

## Environment Variable Priority

The code now checks in this order:

1. `NEXT_PUBLIC_AUTOPRET_API` (new, recommended)
2. `NEXT_PUBLIC_ANALYTICS_API_URL` (legacy, but updated)
3. Hardcoded: `https://autopret-api.nick-damato0011527.workers.dev`

This ensures it will always use the correct unified API.

---

## Verification

After Cloudflare Pages redeploys, check:

1. Open browser DevTools → Network tab
2. Go to `/admin` → Vendors tab
3. Verify API calls go to: `autopret-api.nick-damato0011527.workers.dev`
4. Should NOT see: `feed-management-api.nick-damato0011527.workers.dev`

---

## Summary

**Issue:** Old environment variable pointing to deprecated worker  
**Fix:** Updated code to use correct fallback chain  
**Status:** ✅ Fixed (deploying now)  
**Action:** Update Cloudflare Pages env vars (optional but recommended)

---

**Updated:** 2025-12-13  
**Commit:** cf4180b  
**Deployment:** Auto-deploying via Cloudflare Pages
