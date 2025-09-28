# Single D1 Database Architecture

## Overview

This vehicle dealership application uses a **single Cloudflare D1 database** for all data operations. This eliminates synchronization issues and simplifies the architecture.

## Database: `vehicle-dealership-analytics`

**Database ID:** `d70754b6-fec7-483a-b103-c1c78916c497`  
**Worker URL:** `https://vehicle-dealership-analytics.nick-damato0011527.workers.dev`

### Tables

1. **vehicles** - All vehicle inventory
   - Includes both available and sold vehicles
   - Full CRUD operations supported

2. **vehicle_views** - Analytics for vehicle page views
   - Tracks user interactions with vehicle listings
   - IP addresses, referrers, user agents

3. **search_queries** - Search analytics
   - Popular search terms
   - Search result counts
   - User search patterns

4. **leads** - Customer inquiries and leads
   - Lead scoring and status tracking
   - Contact information
   - Follow-up management

## API Endpoints

All endpoints are served by the single Worker at `https://vehicle-dealership-analytics.nick-damato0011527.workers.dev`:

### Vehicle Operations
- `GET /api/vehicles` - Get all vehicles (including sold)
- `GET /api/vehicles/:id` - Get specific vehicle
- `POST /api/vehicles` - Create new vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Analytics Operations
- `POST /api/analytics/vehicle-views` - Track vehicle view
- `GET /api/analytics/vehicle-views` - Get view analytics
- `POST /api/analytics/search-queries` - Track search
- `GET /api/analytics/search-queries` - Get search analytics

### Lead Operations
- `POST /api/leads` - Submit new lead
- `GET /api/leads` - Get leads with analytics

## Configuration

### Environment Variables

```env
# Single D1 database URL for all operations
NEXT_PUBLIC_ANALYTICS_API_URL=https://vehicle-dealership-analytics.nick-damato0011527.workers.dev

# Enable D1 for all operations
NEXT_PUBLIC_USE_D1_ANALYTICS=true
```

### Key Benefits

1. **Single Source of Truth** - No data synchronization issues
2. **Simplified Architecture** - One database, one Worker, one API
3. **Cost Effective** - Single D1 database on free tier (5GB)
4. **Better Performance** - No cross-database queries
5. **Easier Maintenance** - One schema to manage

## Data Flow

```
User Action → Next.js App → D1 Worker API → D1 Database
                ↑                              ↓
                └──────── Response ←───────────┘
```

## Migration from Dual Database

If you previously used two databases (`vehicle-dealership-db` and `vehicle-dealership-analytics`):

1. All vehicle data has been migrated to `vehicle-dealership-analytics`
2. The old `vehicle-dealership-db` is no longer used
3. The old Worker API (`vehicle-dealership-api`) is deprecated

## Deployment

1. **Database is already created:** `vehicle-dealership-analytics`
2. **Worker is deployed:** Updates automatically on push to main
3. **Frontend uses:** Environment variable to point to single API

## Current Data

As of deployment:
- **Total Vehicles:** 6
- **Sold Vehicles:** 2 (Toyota Camry ID:1, Tesla Model 3 ID:4)
- **Available Vehicles:** 4

## Maintenance

### Adding Vehicles
```javascript
// All vehicle operations go through the D1 Worker
fetch('https://vehicle-dealership-analytics.nick-damato0011527.workers.dev/api/vehicles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(vehicleData)
})
```

### Updating Vehicle Status
```javascript
// Toggle sold status
fetch(`https://vehicle-dealership-analytics.nick-damato0011527.workers.dev/api/vehicles/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...vehicle, isSold: 1 })
})
```

## Troubleshooting

### If vehicles don't appear:
1. Check Worker logs in Cloudflare dashboard
2. Verify environment variable: `NEXT_PUBLIC_ANALYTICS_API_URL`
3. Ensure D1 database has data: `wrangler d1 execute vehicle-dealership-analytics --remote --command "SELECT * FROM vehicles"`

### If sold vehicles don't show:
- The API now returns ALL vehicles regardless of status
- Check the "Sold" checkbox in the admin dashboard filters

## Future Considerations

- All new features should use this single D1 database
- No need for data synchronization
- Backup strategy: Use Cloudflare D1's built-in backup features
- Scaling: D1 can handle millions of rows efficiently
