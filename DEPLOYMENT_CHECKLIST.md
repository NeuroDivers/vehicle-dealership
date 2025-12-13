# Feed-Based Scraper System - Deployment Checklist

## ✅ Pre-Deployment Checklist

### Files Created (Verify all exist)
- [ ] `migrations/add-vendor-feeds.sql`
- [ ] `workers/feed-scraper.js`
- [ ] `workers/wrangler-feed-scraper.toml`
- [ ] `workers/feed-management-api.js`
- [ ] `workers/wrangler-feed-management-api.toml`
- [ ] `src/components/admin/FeedManagement.tsx`
- [ ] `scripts/deploy-feed-system.ps1`
- [ ] `scripts/test-feed-system.ps1`

### Documentation Created
- [ ] `README-FEED-SYSTEM.md`
- [ ] `FEED_SYSTEM_SUMMARY.md`
- [ ] `docs/FEED_SCRAPER_QUICK_START.md`
- [ ] `docs/FEED_SCRAPER_MIGRATION.md`
- [ ] `docs/OLD_VS_NEW_SCRAPER_COMPARISON.md`
- [ ] `docs/FEED_SYSTEM_ARCHITECTURE.md`
- [ ] `workers/README-FEED-SYSTEM.md`

---

## 🚀 Deployment Steps

### Step 1: Database Migration
```bash
wrangler d1 execute vehicle-dealership-analytics --file=migrations/add-vendor-feeds.sql --remote
```

**Expected Output:**
```
🌀 Executing on remote database vehicle-dealership-analytics (d70754b6-fec7-483a-b103-c1c78916c497):
🌀 To execute on your local development database, pass the --local flag to 'wrangler d1 execute'
✅ Executed 6 commands in 0.5s
```

**Verify:**
```bash
wrangler d1 execute vehicle-dealership-analytics --command "SELECT COUNT(*) as count FROM vendor_feeds" --remote
```

- [ ] Migration executed successfully
- [ ] vendor_feeds table created
- [ ] 3 vendors inserted (lambert, naniauto, sltautos)

---

### Step 2: Deploy Feed Scraper Worker
```bash
wrangler deploy --config workers/wrangler-feed-scraper.toml
```

**Expected Output:**
```
Total Upload: XX.XX KiB / gzip: XX.XX KiB
Uploaded feed-scraper (X.XX sec)
Published feed-scraper (X.XX sec)
  https://feed-scraper.nick-damato0011527.workers.dev
Current Deployment ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Verify:**
```bash
curl https://feed-scraper.nick-damato0011527.workers.dev
```

- [ ] Worker deployed successfully
- [ ] Worker URL accessible
- [ ] Returns "Feed Scraper API"

---

### Step 3: Deploy Feed Management API Worker
```bash
wrangler deploy --config workers/wrangler-feed-management-api.toml
```

**Expected Output:**
```
Total Upload: XX.XX KiB / gzip: XX.XX KiB
Uploaded feed-management-api (X.XX sec)
Published feed-management-api (X.XX sec)
  https://feed-management-api.nick-damato0011527.workers.dev
Current Deployment ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Verify:**
```bash
curl https://feed-management-api.nick-damato0011527.workers.dev/api/feeds
```

- [ ] Worker deployed successfully
- [ ] Worker URL accessible
- [ ] Returns JSON with 3 feeds

---

### Step 4: Update Environment Variables

Add to `.env.local`:
```env
NEXT_PUBLIC_FEED_MANAGEMENT_API=https://feed-management-api.nick-damato0011527.workers.dev
NEXT_PUBLIC_FEED_SCRAPER_API=https://feed-scraper.nick-damato0011527.workers.dev
```

- [ ] Environment variables added
- [ ] File saved

---

### Step 5: Integrate Frontend Component

**Option A: Add to existing admin page**
```tsx
// src/app/admin/page.tsx or similar
import FeedManagement from '@/components/admin/FeedManagement';

export default function AdminPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <FeedManagement />
    </div>
  );
}
```

**Option B: Create dedicated page**
```tsx
// src/app/admin/feeds/page.tsx
import FeedManagement from '@/components/admin/FeedManagement';

export default function FeedsPage() {
  return <FeedManagement />;
}
```

- [ ] Component integrated
- [ ] Page created/updated

---

### Step 6: Deploy Frontend

```bash
# Commit changes
git add .
git commit -m "Add feed-based scraper system"
git push origin main
```

**Wait for Cloudflare Pages to rebuild (2-5 minutes)**

- [ ] Changes committed
- [ ] Changes pushed to GitHub
- [ ] Cloudflare Pages build triggered
- [ ] Build completed successfully
- [ ] Frontend deployed

---

### Step 7: Run Tests

```powershell
.\scripts\test-feed-system.ps1
```

**Expected Results:**
- [ ] ✅ Test 1: Get all feeds - PASS
- [ ] ✅ Test 2: Get single feed - PASS
- [ ] ✅ Test 3: Feed URLs accessible - PASS
- [ ] ✅ Test 4: Scraper API responding - PASS
- [ ] ✅ Test 5: Database schema exists - PASS

---

### Step 8: Test Syncing

**Test sync one vendor:**
```bash
curl -X POST https://feed-scraper.nick-damato0011527.workers.dev/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"vendorId": "lambert"}'
```

**Expected Response:**
```json
{
  "success": true,
  "vendorId": "lambert",
  "vendorName": "Lambert Auto",
  "vehicles": 45,
  "saved": 45,
  "updated": 0,
  "duration": 3
}
```

- [ ] Sync completed successfully
- [ ] Vehicles imported
- [ ] No errors in response

---

### Step 9: Verify in Admin UI

1. Navigate to Feed Management page
2. Check that 3 vendors are listed
3. Click "Sync" on Lambert
4. Wait for completion
5. Verify success message
6. Check vehicle count updated

- [ ] UI loads correctly
- [ ] 3 vendors visible
- [ ] Sync button works
- [ ] Success message shown
- [ ] Vehicle count updated

---

### Step 10: Verify Vehicles in Database

```bash
wrangler d1 execute vehicle-dealership-analytics \
  --command "SELECT COUNT(*) as count FROM vehicles WHERE vendor_id = 'lambert'" \
  --remote
```

- [ ] Vehicles exist in database
- [ ] vendor_id field populated
- [ ] last_seen_from_vendor updated

---

## 🔍 Post-Deployment Verification

### Check Worker Logs

```bash
# Feed scraper logs
wrangler tail feed-scraper

# Feed management API logs
wrangler tail feed-management-api
```

- [ ] No errors in logs
- [ ] Requests logging correctly

### Check Sync Status

```bash
wrangler d1 execute vehicle-dealership-analytics \
  --command "SELECT vendor_id, last_sync_at, last_sync_status, last_sync_count FROM vendor_feeds" \
  --remote
```

- [ ] last_sync_at updated
- [ ] last_sync_status = 'success'
- [ ] last_sync_count > 0

### Test All Vendors

- [ ] Sync Lambert - Success
- [ ] Sync NaniAuto - Success
- [ ] Sync SLT Autos - Success

### Test Sync All

```bash
curl -X POST https://feed-scraper.nick-damato0011527.workers.dev/api/scrape-all
```

- [ ] All vendors synced
- [ ] No errors
- [ ] Total vehicle count correct

---

## 🎯 Feature Testing

### Add New Feed via UI
1. Click "Add Feed"
2. Fill in form:
   - vendor_id: `testvendor`
   - vendor_name: `Test Vendor`
   - feed_url: `https://example.com/feed.xml`
   - feed_type: `xml`
   - is_active: `true`
3. Click "Save"

- [ ] Feed added successfully
- [ ] Appears in list
- [ ] Can be edited
- [ ] Can be deleted

### Edit Feed
1. Click "Edit" on a feed
2. Change vendor_name
3. Click "Update"

- [ ] Feed updated successfully
- [ ] Changes reflected in list

### Delete Feed
1. Click "Delete" on test feed
2. Confirm deletion

- [ ] Feed deleted successfully
- [ ] Removed from list

---

## 🔧 Troubleshooting Checklist

### If migration fails:
- [ ] Check Cloudflare account ID is correct (928f2a6b07f166d57bb4b31b9100d1f4)
- [ ] Check database name is correct (vehicle-dealership-analytics)
- [ ] Check database ID is correct (d70754b6-fec7-483a-b103-c1c78916c497)
- [ ] Verify wrangler is authenticated: `wrangler whoami`

### If worker deployment fails:
- [ ] Check wrangler.toml has correct account_id
- [ ] Check wrangler.toml has correct database binding
- [ ] Verify no syntax errors in worker code
- [ ] Check wrangler version: `wrangler --version` (should be 3.x)

### If sync fails:
- [ ] Check feed URL is accessible
- [ ] Verify XML format is correct
- [ ] Check worker logs for errors
- [ ] Verify IMAGE_PROCESSOR service binding exists

### If images not processing:
- [ ] Check IMAGE_PROCESSOR service binding in wrangler.toml
- [ ] Verify Cloudflare Images credentials
- [ ] Check image-processor worker is deployed
- [ ] Verify image URLs in feed are accessible

---

## 📊 Success Metrics

After deployment, you should see:

- [ ] **3 vendors** configured in vendor_feeds table
- [ ] **100+ vehicles** imported (combined from all vendors)
- [ ] **Sync time** < 5 seconds per vendor
- [ ] **Success rate** 100% (all syncs successful)
- [ ] **Images** processing correctly (Cloudflare IDs preserved)
- [ ] **UI** responsive and functional
- [ ] **No errors** in worker logs

---

## 🎉 Deployment Complete!

Once all items are checked:

✅ **System is live and operational**

### Next Steps:
1. Monitor for 24-48 hours
2. Set up automated syncing (optional - Cron Triggers)
3. Add more vendors as needed
4. Consider deprecating old scrapers

### Maintenance:
- Check sync status daily
- Monitor worker logs weekly
- Update feed URLs as needed
- Add new vendors via UI

---

## 📖 Quick Reference

**Worker URLs:**
- Feed Scraper: https://feed-scraper.nick-damato0011527.workers.dev
- Feed Management API: https://feed-management-api.nick-damato0011527.workers.dev

**Key Commands:**
```bash
# View logs
wrangler tail feed-scraper
wrangler tail feed-management-api

# Check database
wrangler d1 execute vehicle-dealership-analytics --command "SELECT * FROM vendor_feeds" --remote

# Sync vendor
curl -X POST https://feed-scraper.../api/scrape -H "Content-Type: application/json" -d '{"vendorId": "lambert"}'
```

**Documentation:**
- Quick Start: `docs/FEED_SCRAPER_QUICK_START.md`
- Full Guide: `docs/FEED_SCRAPER_MIGRATION.md`
- Architecture: `docs/FEED_SYSTEM_ARCHITECTURE.md`

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Status:** ☐ In Progress  ☐ Complete  ☐ Issues Found  
**Notes:** _____________________________________________
