# How to Apply the Vendor Tracking Migration

## ✅ Migration is Ready!

The vendor tracking migration has been created and tested. Since the wrangler CLI is having issues connecting to the D1 database, you can apply the migration through the Cloudflare Dashboard.

## 📋 Steps to Apply Migration:

### Option 1: Through Cloudflare Dashboard (Recommended)

1. **Go to Cloudflare Dashboard**
   - Navigate to: https://dash.cloudflare.com
   - Select your account

2. **Open D1 Database**
   - Go to Workers & Pages → D1
   - Click on `vehicle-dealership-analytics` database

3. **Open SQL Console**
   - Click on the "Console" tab
   - You'll see a SQL editor

4. **Copy Migration SQL**
   - Open file: `migrations/002_add_vendor_tracking_fixed.sql`
   - Copy the entire contents

5. **Execute Migration**
   - Paste the SQL into the console
   - Click "Execute"
   - Wait for confirmation

### Option 2: Through Wrangler CLI (If it works)

```bash
# Try with the correct database name
npx wrangler d1 execute vehicle-dealership-analytics --file=migrations/002_add_vendor_tracking_fixed.sql --remote

# Or try without --remote flag for local testing
npx wrangler d1 execute vehicle-dealership-analytics --file=migrations/002_add_vendor_tracking_fixed.sql
```

## 🎯 What This Migration Does:

1. **Adds Vendor Tracking Fields** to vehicles table:
   - `vendor_id` - Identifies the source (lambert, internal, etc.)
   - `vendor_name` - Display name of the vendor
   - `vendor_stock_number` - Vendor's stock number
   - `last_seen_from_vendor` - When last seen in vendor feed
   - `vendor_status` - active/unlisted/removed status
   - `sync_status` - synced/pending_removal status
   - `is_published` - Show/hide from public

2. **Creates New Tables**:
   - `vendors` - Stores vendor configurations
   - `vendor_sync_logs` - Tracks sync history
   - `vendor_rules` - Advanced vendor-specific rules

3. **Sets Up Default Vendors**:
   - Lambert Auto (for scraper)
   - Internal Inventory (for manual entries)

4. **Updates Existing Vehicles**:
   - Assigns Lambert vendor to vehicles with Lambert stock numbers
   - Marks others as Internal Inventory

## ✨ After Migration:

Once applied, your system will have:
- Full multi-vendor tracking capability
- Vehicle lifecycle management
- Grace periods for missing vehicles
- Protection for sold vehicles
- Vendor badges on vehicle cards
- Complete sync history tracking

## 🚀 Next Steps:

1. Apply the migration using one of the methods above
2. Test the Lambert scraper with vendor tracking
3. Verify vendor badges appear on vehicle cards
4. Check the Vendors tab in admin dashboard

## 🆘 Troubleshooting:

If you get errors:
- Make sure you're logged into Cloudflare
- Verify the database name is correct
- Check that you have the right permissions
- Try executing the migration in smaller chunks if needed

The migration is idempotent (safe to run multiple times) thanks to `IF NOT EXISTS` clauses.
