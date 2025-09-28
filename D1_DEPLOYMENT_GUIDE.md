# D1 Analytics Database Deployment Guide

This guide will help you set up the Cloudflare D1 database for persistent analytics storage in your vehicle dealership website.

## Prerequisites

- Cloudflare account with Workers and D1 access
- Wrangler CLI installed (`npm install -g wrangler`)
- Authenticated with Cloudflare (`wrangler login`)

## Step 1: Create the D1 Database

```bash
# Create the D1 database
wrangler d1 create vehicle-dealership-analytics

# This will output something like:
# ✅ Successfully created DB 'vehicle-dealership-analytics' in region EEUR
# Created your database using D1's new storage backend. The new storage backend is not yet recommended for production workloads, but backs up your data via point-in-time restore.
# 
# [[d1_databases]]
# binding = "DB"
# database_name = "vehicle-dealership-analytics"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

## Step 2: Update wrangler.toml

Copy the `database_id` from the output above and update the `wrangler.toml` file:

```toml
[[d1_databases]]
binding = "DB"
database_name = "vehicle-dealership-analytics"
database_id = "your-database-id-here"  # Replace with actual ID
```

## Step 3: Initialize the Database Schema

```bash
# Execute the schema file to create tables
wrangler d1 execute vehicle-dealership-analytics --file=./schema.sql
```

## Step 4: Deploy the Worker

```bash
# Deploy the analytics worker
wrangler deploy
```

## Step 5: Update Frontend API Endpoints

After deployment, you'll get a worker URL like:
`https://vehicle-dealership-analytics.your-subdomain.workers.dev`

Update your Next.js application to use this URL instead of the local API routes.

### Option A: Environment Variable (Recommended)

Add to your `.env.local`:
```
NEXT_PUBLIC_ANALYTICS_API_URL=https://vehicle-dealership-analytics.your-subdomain.workers.dev
```

### Option B: Direct URL Update

Update the fetch URLs in your components:
- `VehicleDetailClient.tsx`: Update analytics tracking calls
- `vehicles/page.tsx`: Update search query tracking
- `admin/analytics/page.tsx`: Update analytics data fetching

## Step 6: Test the Integration

1. **Test Vehicle View Tracking**: Visit a vehicle detail page and check if views are recorded
2. **Test Search Analytics**: Perform searches and verify they're tracked
3. **Test Lead Submission**: Submit a contact form and confirm it's stored
4. **Check Analytics Dashboard**: Verify the admin analytics page shows data

## Step 7: Database Management Commands

```bash
# View database info
wrangler d1 info vehicle-dealership-analytics

# Execute SQL queries
wrangler d1 execute vehicle-dealership-analytics --command="SELECT COUNT(*) FROM vehicle_views"

# Backup database
wrangler d1 backup create vehicle-dealership-analytics

# List backups
wrangler d1 backup list vehicle-dealership-analytics
```

## Migration from In-Memory Storage

The current API routes use in-memory storage. After D1 is deployed:

1. **Data Loss Warning**: In-memory data will be lost during migration
2. **Gradual Migration**: You can run both systems in parallel initially
3. **Analytics Reset**: Analytics will start fresh with D1 implementation

## Monitoring and Maintenance

- **Logs**: Use `wrangler tail` to monitor worker logs
- **Analytics**: Check Cloudflare dashboard for worker performance
- **Database Size**: Monitor D1 storage usage in Cloudflare dashboard
- **Backups**: Set up regular backup schedule for production data

## Cost Considerations

- **D1 Database**: 5GB storage free, then $0.75/GB
- **Worker Requests**: 100,000 requests/day free, then $0.50/million
- **Worker Duration**: 10ms CPU time free, then $12.50/million GB-s

## Security Notes

- Worker handles CORS automatically
- IP addresses are captured for analytics
- No sensitive data should be stored in analytics tables
- Consider implementing rate limiting for production use

## Troubleshooting

### Common Issues:

1. **Database ID not found**: Ensure `database_id` in `wrangler.toml` matches created database
2. **CORS errors**: Check worker CORS headers configuration
3. **Schema errors**: Verify SQL syntax in `schema.sql`
4. **Worker deployment fails**: Check `wrangler.toml` configuration

### Debug Commands:

```bash
# Check worker logs
wrangler tail vehicle-dealership-analytics

# Test database connection
wrangler d1 execute vehicle-dealership-analytics --command="SELECT 1"

# View recent data
wrangler d1 execute vehicle-dealership-analytics --command="SELECT * FROM vehicle_views ORDER BY timestamp DESC LIMIT 5"
```

## Next Steps

After successful deployment:

1. Update frontend to use D1 API endpoints
2. Remove old in-memory API routes
3. Set up monitoring and alerting
4. Configure backup schedule
5. Consider implementing caching for better performance
