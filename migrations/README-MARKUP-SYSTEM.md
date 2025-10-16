# Vehicle Price Markup System

## Overview

This system allows you to add markups to vehicle prices, either at the vendor level (default for all vehicles from that vendor) or at the individual vehicle level.

## Architecture

### Database Schema

**vendor_settings table:**
- `vendor_id` (TEXT, PRIMARY KEY) - Unique vendor identifier
- `vendor_name` (TEXT) - Display name
- `markup_type` (TEXT) - 'none', 'amount', or 'percentage'
- `markup_value` (REAL) - Dollar amount or percentage value
- `is_active` (INTEGER) - Active status
- `created_at`, `updated_at` (DATETIME)

**vehicles table additions:**
- `price_markup_type` (TEXT) - 'none', 'amount', 'percentage', or 'vendor_default'
- `price_markup_value` (REAL) - Override markup value
- `display_price` (REAL) - Calculated final price (for performance)

### Markup Types

1. **none** - No markup, display original price
2. **amount** - Add fixed dollar amount (e.g., +$1000)
3. **percentage** - Add percentage of price (e.g., +10%)
4. **vendor_default** - Use vendor's default markup setting

## Usage

### Setting Vendor-Level Defaults

1. Go to **Admin → Vendors**
2. Click **Price Markup** button on any vendor card
3. Choose markup type and value
4. Click **Save Markup**

All vehicles from that vendor will use this markup unless overridden.

### Overriding Individual Vehicles

In the vehicle edit form:
- Set `price_markup_type` to 'amount' or 'percentage'
- Set `price_markup_value` to the desired value
- Or set to 'vendor_default' to use vendor setting

### API Endpoints

**GET /api/vendor-settings**
- Returns all vendor markup configurations

**PUT /api/vendor-settings/:vendorId**
- Updates vendor markup settings
- Body: `{ markup_type, markup_value }`

**POST /api/vehicles**
- Automatically calculates `display_price` based on markup

**PUT /api/vehicles/:id**
- Recalculates `display_price` when price or markup changes

## Price Calculation Logic

```javascript
function calculateDisplayPrice(basePrice, markupType, markupValue) {
  if (markupType === 'none') return basePrice;
  if (markupType === 'amount') return basePrice + markupValue;
  if (markupType === 'percentage') return basePrice + (basePrice * markupValue / 100);
  return basePrice;
}
```

### Examples

**Base Price:** $25,000

- **No markup:** Display = $25,000
- **Fixed amount (+$2,000):** Display = $27,000
- **Percentage (+8%):** Display = $27,000

## Migration

```bash
# Run migration to add markup columns
wrangler d1 execute vehicle-dealership-analytics --file=./migrations/add-vehicle-markup-system.sql --remote
```

## Frontend Components

**VendorMarkupSettings.tsx**
- Modal for configuring vendor markup
- Live example calculation
- Validation and error handling

**VendorManagement.tsx**
- "Price Markup" button for each vendor
- Opens markup settings modal

## Benefits

✅ **Flexible** - Set defaults per vendor, override per vehicle
✅ **Transparent** - Store both original price and display price
✅ **Performance** - Pre-calculated display_price for fast queries
✅ **Simple** - Easy to manage through admin UI
✅ **Automatic** - Scraped vehicles use vendor default automatically

## Best Practices

1. **Vendor Defaults First** - Set vendor-level markup for consistency
2. **Vehicle Overrides** - Only override when needed for special pricing
3. **Test Calculations** - Use the example calculator in the modal
4. **Monitor Margins** - Track markup impact on sales

## Implementation Notes

- `display_price` is calculated automatically on INSERT and UPDATE
- Scrapers default to `vendor_default` markup type
- Original price always preserved in `price` column
- Frontend can show both original and display price if desired
