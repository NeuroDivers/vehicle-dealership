# Deploy Lambert Sync Worker

## 🚀 Quick Deploy Instructions

The Lambert sync worker needs to be deployed to Cloudflare Workers to enable database saving functionality.

### Step 1: Deploy the Worker

```bash
cd workers
npx wrangler deploy lambert-sync-worker.js --config wrangler-lambert-sync.toml
```

### Step 2: Set Custom Domain (Optional)

After deployment, you can set a custom domain in Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select `lambert-sync-worker`
3. Go to Settings → Triggers
4. Add custom domain: `lambert-sync.yourdomain.com`

### Step 3: Update Environment Variable

Add to your `.env.local`:
```
NEXT_PUBLIC_LAMBERT_SYNC_WORKER_URL=https://lambert-sync-worker.nick-damato0011527.workers.dev
```

Or use your custom domain if set.

## 📋 What This Worker Does

1. **Fetches Lambert Inventory**: Calls the Lambert scraper to get current vehicles
2. **Compares with Database**: Checks which vehicles are new vs existing
3. **Saves to D1 Database**: 
   - Inserts new vehicles with vendor tracking
   - Updates existing vehicles
   - Marks missing vehicles as "unlisted"
4. **Logs Sync Results**: Records sync history in vendor_sync_logs table

## 🔧 Features

- **Vendor Tracking**: All vehicles marked as "Lambert Auto" vendor
- **Duplicate Prevention**: Checks by VIN and stock number
- **Update Detection**: Updates prices and details for existing vehicles
- **Lifecycle Management**: Marks vehicles not in current sync as unlisted
- **Error Handling**: Continues sync even if individual vehicles fail
- **Sync Logging**: Complete audit trail of all sync operations

## 🎯 Endpoints

- `POST /sync-lambert` - Triggers full Lambert inventory sync

## 📊 Response Format

```json
{
  "success": true,
  "vehicles_found": 46,
  "new_vehicles": 5,
  "updated_vehicles": 41,
  "errors": [],
  "status": "success"
}
```

## 🆘 Troubleshooting

If sync isn't working:

1. **Check Worker Logs**: 
   ```bash
   npx wrangler tail lambert-sync-worker
   ```

2. **Verify Database Binding**: 
   - Ensure D1 database ID is correct in wrangler config
   - Database must have vendor tracking columns

3. **Test Lambert Scraper**:
   - Verify https://lambert-scraper.nick-damato0011527.workers.dev is working

4. **Check CORS**: 
   - Worker includes CORS headers for browser access

## 🔄 Manual Test

Test the sync endpoint:
```bash
curl -X POST https://lambert-sync-worker.nick-damato0011527.workers.dev/sync-lambert
```

This should return sync results and save vehicles to the database.
