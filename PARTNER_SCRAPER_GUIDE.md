# Partner Inventory Scraper - Deployment Guide

## Overview

The Partner Inventory Scraper is a Cloudflare Worker that automatically scrapes vehicle inventory from partner dealership websites. It features:

- **Automated Discovery**: Finds all vehicle URLs from paginated listing pages
- **Smart Change Detection**: Uses fingerprinting to detect new, changed, and removed vehicles
- **Incremental Updates**: Only processes changes, not entire inventory each time
- **Polite Scraping**: Respects rate limits and robots.txt
- **Scheduled Runs**: Automatic twice-daily updates via Cron Triggers
- **Manual Triggers**: On-demand scraping through admin UI

## Architecture

```
Partner Website → Cloudflare Worker → D1 Database → Your Admin UI
                        ↓
                   R2 Storage (images)
```

## Setup Instructions

### 1. Create D1 Database

```bash
# Create the database
npx wrangler d1 create vehicle-dealership-db

# Note the database ID from output
# Update wrangler-scraper.toml with this ID
```

### 2. Initialize Database Schema

```bash
# Apply the schema
npx wrangler d1 execute vehicle-dealership-db --file=sql/partner-scraper-schema.sql
```

### 3. Deploy the Scraper Worker

```bash
# Deploy to Cloudflare
npx wrangler deploy -c wrangler-scraper.toml

# Your worker will be available at:
# https://vehicle-partner-scraper.<your-subdomain>.workers.dev
```

### 4. Configure Partners

Add partner configurations to the database:

```sql
INSERT INTO partner_configs (name, base_url, scrape_config) VALUES 
(
  'Partner Name',
  'https://partner-site.com',
  '{
    "listing_path": "/inventory/",
    "per_page": 20,
    "order_by": "date",
    "max_pages": 50,
    "link_pattern": "href=\"([^\"]+/vehicle/[^\"]+)\"",
    "scrape_delay": 1500
  }'
);
```

### 5. Test Manual Scraping

```bash
# Trigger a manual scrape
curl -X POST https://vehicle-partner-scraper.<your-subdomain>.workers.dev/api/scraper/trigger \
  -H "Content-Type: application/json" \
  -d '{"partnerId": 1}'

# Check status
curl https://vehicle-partner-scraper.<your-subdomain>.workers.dev/api/scraper/status
```

## Configuration Options

### Partner Config Fields

- `listing_path`: URL path to vehicle listings (e.g., `/cars/`, `/inventory/`)
- `per_page`: Number of vehicles per page
- `order_by`: Sort order (date, price, year)
- `max_pages`: Maximum pages to scrape (safety limit)
- `link_pattern`: Regex to extract vehicle URLs from HTML
- `scrape_delay`: Milliseconds between requests

### Scraper Settings

Edit `wrangler-scraper.toml`:

```toml
[vars]
MAX_CONCURRENT_SCRAPES = "3"      # Parallel scraping limit
DEFAULT_SCRAPE_DELAY = "1000"     # Default delay between requests
IMAGE_DOWNLOAD_ENABLED = "false"   # Download images to R2
ROBOTS_TXT_CHECK = "true"          # Respect robots.txt
```

## HTML Parsing Patterns

The scraper extracts data using these patterns:

### Vehicle Title
```regex
<h1[^>]*>(\d{4})\s+(.+)<\/h1>
```

### Price
```regex
\$([0-9,]+)
```

### VIN
```regex
VIN[:\s]+([A-Z0-9]{17})
```

### Mileage
```regex
(\d{1,3}[,\s]?\d{3})\s*(km|miles?)
```

## Customizing for Different Sites

### 1. Analyze Target Site

```javascript
// Check their listing page structure
// Look for pagination parameters
// Identify vehicle link patterns
// Note any rate limiting or blocks
```

### 2. Update Scrape Config

```json
{
  "listing_path": "/their-inventory-path/",
  "link_pattern": "their-specific-pattern",
  "per_page": 24,
  "scrape_delay": 2000
}
```

### 3. Customize Parser

Edit `parseVehicleHtml()` in `partner-scraper.js` to match their HTML structure:

```javascript
// Add site-specific parsing logic
if (this.partner.name === 'Special Partner') {
  // Custom extraction logic
}
```

## Monitoring & Maintenance

### Check Scraper Health

```sql
-- Recent runs
SELECT * FROM scraper_runs 
ORDER BY started_at DESC 
LIMIT 10;

-- Failed scrapes
SELECT * FROM scraper_runs 
WHERE status = 'failed';

-- Vehicle changes over time
SELECT 
  DATE(scraped_at) as date,
  COUNT(CASE WHEN status = 'NEW' THEN 1 END) as new_vehicles,
  COUNT(CASE WHEN status = 'CHANGED' THEN 1 END) as changed_vehicles,
  COUNT(CASE WHEN status = 'REMOVED' THEN 1 END) as removed_vehicles
FROM partner_vehicles
GROUP BY DATE(scraped_at)
ORDER BY date DESC;
```

### Common Issues

1. **Rate Limiting**: Increase `scrape_delay`
2. **HTML Changes**: Update `link_pattern` or parsing logic
3. **Timeouts**: Reduce `max_pages` or increase Worker CPU limits
4. **Missing Data**: Check if site structure changed

## API Endpoints

### Trigger Scrape
```
POST /api/scraper/trigger
Body: { "partnerId": 1 }
```

### Get Status
```
GET /api/scraper/status
```

### Get Partner Vehicles
```
GET /api/partners
```

## Integration with Main App

### Display Partner Vehicles

```typescript
// In your Next.js app
const partnerVehicles = await fetch(
  'https://vehicle-partner-scraper.workers.dev/api/partners'
).then(r => r.json());

// Merge with your inventory
const allVehicles = [...yourVehicles, ...partnerVehicles];
```

### Add to Admin Dashboard

```typescript
import PartnerScraperManager from '@/components/PartnerScraperManager';

// In admin page
{activeTab === 'scraper' && <PartnerScraperManager />}
```

## Cost Estimates

- **Cloudflare Workers**: 100,000 requests/day free
- **D1 Database**: 5GB storage free
- **R2 Storage**: 10GB/month free
- **Cron Triggers**: Unlimited

For a typical dealership scraping 2-3 partners twice daily:
- ~6 scrape runs/day
- ~3,000 vehicle pages/day
- **Total cost**: $0 (within free tier)

## Security Considerations

1. **Rate Limiting**: Always respect partner sites
2. **User Agent**: Set honest user agent
3. **Robots.txt**: Check and respect
4. **Legal**: Ensure you have permission to scrape
5. **API Keys**: Use Cloudflare secrets for sensitive data

## Support

For issues or customization needs:
1. Check Worker logs in Cloudflare dashboard
2. Review D1 query logs
3. Test with single partner first
4. Gradually increase scraping scope

## License

This scraper is provided as-is for your vehicle dealership platform. Ensure you comply with all applicable laws and website terms of service when scraping third-party sites.
