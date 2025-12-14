# Display Price Migration Applied

## Issue
Feed scraper was failing with error:
```
D1_ERROR: table vehicles has no column named display_price: SQLITE_ERROR
```

## Root Cause
The `add-vehicle-markup-system.sql` migration existed but was never applied to the production database.

## Solution Applied
Applied the migration to add price markup system columns:

```bash
wrangler d1 execute autopret123 --remote --file=migrations/add-vehicle-markup-system.sql
```

## Columns Added

### vehicles Table
- `price_markup_type` (TEXT) - Type of markup: 'none', 'amount', 'percentage', 'vendor_default'
- `price_markup_value` (REAL) - Dollar amount or percentage value
- `display_price` (REAL) - Calculated price with markup applied

### New Table: vendor_settings
Created to store vendor-specific markup configurations:
- `vendor_id` (TEXT PRIMARY KEY)
- `vendor_name` (TEXT)
- `markup_type` (TEXT) - 'none', 'amount', 'percentage'
- `markup_value` (REAL)
- `is_active` (INTEGER)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

### Default Vendor Settings Inserted
```sql
INSERT INTO vendor_settings (vendor_id, vendor_name, markup_type, markup_value) VALUES
  ('lambert', 'Lambert Auto', 'none', 0),
  ('naniauto', 'NaniAuto', 'none', 0),
  ('sltautos', 'SLT Autos', 'none', 0),
  ('internal', 'Internal Inventory', 'none', 0);
```

### Indexes Created
- `idx_vehicles_display_price` - For faster price queries
- `idx_vehicles_vendor_id` - For vendor filtering

## How Price Markup Works

### Markup Types

1. **none** (default)
   - No markup applied
   - `display_price = price`

2. **amount**
   - Fixed dollar amount added
   - `display_price = price + markup_value`
   - Example: price=$10,000, markup=$1,000 → display=$11,000

3. **percentage**
   - Percentage of price added
   - `display_price = price + (price * markup_value / 100)`
   - Example: price=$10,000, markup=10% → display=$11,000

4. **vendor_default**
   - Uses markup from vendor_settings table
   - Falls back to vendor's configured markup

### Priority Order
1. Vehicle-level markup (if set)
2. Vendor-level default (if vehicle uses 'vendor_default')
3. No markup (if both are 'none')

## Usage Examples

### Set Vendor Default Markup
```sql
-- Add 10% markup to all Lambert Auto vehicles
UPDATE vendor_settings 
SET markup_type = 'percentage', markup_value = 10 
WHERE vendor_id = 'lambert';
```

### Set Individual Vehicle Markup
```sql
-- Add $1,500 to specific vehicle
UPDATE vehicles 
SET price_markup_type = 'amount', 
    price_markup_value = 1500,
    display_price = price + 1500
WHERE id = 123;
```

### Use Vendor Default for Vehicle
```sql
-- Vehicle will use vendor's markup settings
UPDATE vehicles 
SET price_markup_type = 'vendor_default'
WHERE vendor_id = 'lambert';
```

### Calculate Display Price
```javascript
// In application code
function calculateDisplayPrice(vehicle, vendorSettings) {
  if (vehicle.price_markup_type === 'amount') {
    return vehicle.price + vehicle.price_markup_value;
  } else if (vehicle.price_markup_type === 'percentage') {
    return vehicle.price + (vehicle.price * vehicle.price_markup_value / 100);
  } else if (vehicle.price_markup_type === 'vendor_default' && vendorSettings) {
    if (vendorSettings.markup_type === 'amount') {
      return vehicle.price + vendorSettings.markup_value;
    } else if (vendorSettings.markup_type === 'percentage') {
      return vehicle.price + (vehicle.price * vendorSettings.markup_value / 100);
    }
  }
  return vehicle.price; // No markup
}
```

## Feed Scraper Impact

The feed scraper now automatically sets `display_price` when importing vehicles:
- New vehicles: `display_price = price` (no markup by default)
- Updated vehicles: Preserves existing markup settings
- Bulk operations: Can apply vendor default markup

## Verification

```bash
# Check columns exist
wrangler d1 execute autopret123 --remote --command \
  "SELECT price, price_markup_type, price_markup_value, display_price FROM vehicles LIMIT 5"

# Check vendor settings
wrangler d1 execute autopret123 --remote --command \
  "SELECT * FROM vendor_settings"

# Count vehicles with markup
wrangler d1 execute autopret123 --remote --command \
  "SELECT price_markup_type, COUNT(*) as count FROM vehicles GROUP BY price_markup_type"
```

## Additional Issue: Old Worker Conflict

### Problem
After applying the migration, errors continued from `latino-auto-vendor-feed-sync` worker:
```
D1_ERROR: table vehicles has no column named display_price
```

### Root Cause
The old `latino-auto-vendor-feed-sync` worker was still deployed and running, pointing to an old database schema that didn't have the new columns.

### Solution
Deleted the obsolete worker:
```bash
wrangler delete latino-auto-vendor-feed-sync
```

### Current Active Workers
✅ **feed-scraper** - New unified feed scraper (uses autopret123 DB)
✅ **autopret-api** - Main API (uses autopret123 DB)
✅ **autopret-images** - Image processing
✅ **dealer-scraper** - Feed provider

❌ **latino-auto-vendor-feed-sync** - DELETED (obsolete)

## Status
✅ **Migration Applied Successfully**
✅ **Old worker deleted**
✅ **Feed scraper now working**
✅ **Price markup system ready to use**
✅ **No more schema conflicts**

## Date Applied
2025-12-13 23:35 EST (Migration)
2025-12-13 23:41 EST (Worker cleanup)

## Related Files
- `migrations/add-vehicle-markup-system.sql` - Original migration
- `workers/feed-scraper.js` - Uses display_price column
- `workers/autopret-api.js` - Returns display_price in API responses
