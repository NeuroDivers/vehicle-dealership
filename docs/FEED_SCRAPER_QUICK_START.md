# Feed Scraper - Quick Start Guide

## 🚀 Quick Deploy (5 minutes)

```bash
# 1. Run migration
wrangler d1 execute vehicle-dealership-analytics --file=migrations/add-vendor-feeds.sql --remote

# 2. Deploy workers
wrangler deploy --config workers/wrangler-feed-scraper.toml
wrangler deploy --config workers/wrangler-feed-management-api.toml

# 3. Test it works
curl https://feed-management-api.nick-damato0011527.workers.dev/api/feeds
```

## 📋 What You Get

### Pre-configured Vendors

| Vendor | Feed URL | Status |
|--------|----------|--------|
| **Lambert Auto** | `https://dealer-scraper.../api/feeds/5/xml` | ✅ Active |
| **NaniAuto** | `https://dealer-scraper.../api/feeds/1/xml` | ✅ Active |
| **SLT Autos** | `https://dealer-scraper.../api/feeds/6/xml` | ✅ Active |

### API Endpoints

**Feed Management:**
- `GET /api/feeds` - List all feeds
- `POST /api/feeds` - Add new feed
- `PUT /api/feeds/{vendor_id}` - Update feed
- `DELETE /api/feeds/{vendor_id}` - Delete feed

**Scraping:**
- `POST /api/scrape` - Sync one vendor
- `POST /api/scrape-all` - Sync all vendors

## 🎯 Common Tasks

### Sync a Vendor

```bash
curl -X POST https://feed-scraper.nick-damato0011527.workers.dev/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"vendorId": "lambert"}'
```

### Add New Vendor

```bash
curl -X POST https://feed-management-api.nick-damato0011527.workers.dev/api/feeds \
  -H "Content-Type: application/json" \
  -d '{
    "vendor_id": "newdealer",
    "vendor_name": "New Dealer",
    "feed_url": "https://example.com/feed.xml",
    "feed_type": "xml",
    "is_active": true
  }'
```

### Check Sync Status

```bash
curl https://feed-management-api.nick-damato0011527.workers.dev/api/feeds/lambert
```

### Disable a Vendor

```bash
curl -X PUT https://feed-management-api.nick-damato0011527.workers.dev/api/feeds/lambert \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

## 🎨 Frontend Integration

### Add to Admin Dashboard

```tsx
// src/app/admin/page.tsx
import FeedManagement from '@/components/admin/FeedManagement';

export default function AdminDashboard() {
  return (
    <div className="p-6">
      <h1>Admin Dashboard</h1>
      <FeedManagement />
    </div>
  );
}
```

### Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_FEED_MANAGEMENT_API=https://feed-management-api.nick-damato0011527.workers.dev
NEXT_PUBLIC_FEED_SCRAPER_API=https://feed-scraper.nick-damato0011527.workers.dev
```

## 🔧 Troubleshooting

### "Feed not found" error
- Run migration: `wrangler d1 execute vehicle-dealership-analytics --file=migrations/add-vendor-feeds.sql --remote`

### No vehicles imported
- Check feed URL is accessible
- Verify XML format matches expected structure
- Check worker logs: `wrangler tail feed-scraper`

### Images not processing
- Verify IMAGE_PROCESSOR service binding in wrangler.toml
- Check Cloudflare Images credentials

## 📊 Monitoring

### View Worker Logs

```bash
# Feed scraper logs
wrangler tail feed-scraper

# Feed management API logs
wrangler tail feed-management-api
```

### Check Database

```bash
# View all feeds
wrangler d1 execute vehicle-dealership-analytics \
  --command "SELECT * FROM vendor_feeds"

# View sync history
wrangler d1 execute vehicle-dealership-analytics \
  --command "SELECT vendor_id, last_sync_at, last_sync_status, last_sync_count FROM vendor_feeds"
```

## 🎓 Key Concepts

### Feed Types
- **XML**: Standard vehicle feed format (default)
- **JSON**: Alternative format (future support)
- **CSV**: Comma-separated values (future support)

### Sync Frequency
- **manual**: Only sync when triggered
- **hourly**: Auto-sync every hour (requires Cron Trigger)
- **daily**: Auto-sync daily (requires Cron Trigger)
- **weekly**: Auto-sync weekly (requires Cron Trigger)

### Duplicate Detection
1. Check by VIN (if available)
2. Fallback to Make + Model + Year + vendor_id
3. Updates existing vehicle if found
4. Creates new vehicle if not found

### Image Processing
- Preserves existing Cloudflare image IDs
- Only processes images for new vehicles
- Async processing via IMAGE_PROCESSOR worker
- Limits to 15 images per vehicle

## 📖 Full Documentation

See `docs/FEED_SCRAPER_MIGRATION.md` for complete details.

## ✅ Success Checklist

- [ ] Migration applied to D1 database
- [ ] feed-scraper worker deployed
- [ ] feed-management-api worker deployed
- [ ] Environment variables added to .env.local
- [ ] Frontend component integrated
- [ ] Test sync completed successfully
- [ ] Vehicles imported and visible in dashboard

## 🆘 Need Help?

1. Check logs: `wrangler tail [worker-name]`
2. Review documentation: `docs/FEED_SCRAPER_MIGRATION.md`
3. Test API endpoints with curl commands above
4. Verify D1 database has vendor_feeds table
