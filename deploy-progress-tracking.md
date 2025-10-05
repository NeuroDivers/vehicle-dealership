# Deploy Image Processing Progress Tracking

## Step 1: Create Database Table

Run this in your Cloudflare D1 dashboard or via wrangler:

```bash
# Option A: Via Wrangler
wrangler d1 execute vehicle-dealership-analytics --file=sql/image-processing-jobs.sql --remote

# Option B: In Cloudflare Dashboard
# Go to: D1 Database > vehicle-dealership-analytics > Console
# Copy/paste the contents of sql/image-processing-jobs.sql
```

## Step 2: Deploy Workers

```bash
# Deploy image processor (has progress tracking updates)
wrangler deploy workers/image-processor.js --config workers/wrangler-image-processor.toml

# Deploy all scrapers (they now return jobId)
wrangler deploy workers/lambert-scraper-enhanced.js --config workers/wrangler-lambert-scraper.toml
wrangler deploy workers/naniauto-scraper.js --config workers/wrangler-naniauto-scraper.toml
wrangler deploy workers/sltautos-scraper.js --config workers/wrangler-sltautos-scraper.toml
```

## Step 3: Test Progress Tracking

### Run a scraper:
```bash
curl -X POST https://lambert-scraper.nick-damato0011527.workers.dev/api/scrape
```

### Check the response for jobId:
```json
{
  "success": true,
  "imageProcessingJobId": "lambert-1733530123-abc123",
  ...
}
```

### Monitor progress:
```bash
# Get specific job
curl https://image-processor.nick-damato0011527.workers.dev/api/jobs/lambert-1733530123-abc123

# Get all recent jobs
curl https://image-processor.nick-damato0011527.workers.dev/api/jobs
```

## Step 4: View in UI

Add to your admin dashboard:

```tsx
import ImageProcessorPanel from '@/components/admin/ImageProcessorPanel';

// In your page:
<ImageProcessorPanel />
```

The panel will show:
- Real-time progress bars
- Current vehicle being processed
- Images uploaded/failed counts
- Recent jobs history

## What You'll See

### During Processing:
```
Image Processing - Lambert Auto       [85%]
████████████████████░░░  85%

Vehicles: 17/20   Uploaded: 142   Failed: 3   Processing: Toyota Camry
```

### When Complete:
```
Image Processing - Lambert Auto       [100%]
█████████████████████  100%

Vehicles: 20/20   Uploaded: 187   Failed: 5   ✓ Complete
```

Progress updates automatically every 2 seconds!
