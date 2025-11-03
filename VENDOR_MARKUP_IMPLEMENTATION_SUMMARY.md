# Vendor Markup Implementation Summary

## Overview

This document summarizes the implementation of the vendor markup system across the vehicle dealership platform, including both the vendor-sync-worker and individual scrapers.

## Implementation Details

### 1. Vendor Sync Worker

The vendor-sync-worker.js has been updated to:

- Add a `calculateDisplayPrice` helper function
- Set `price_markup_type` to 'vendor_default' for new vehicles
- Preserve existing markup settings during updates
- Recalculate `display_price` based on markup settings

### 2. Individual Scrapers

All individual scrapers (lambert-scraper-enhanced.js, sltautos-scraper.js) have been updated to:

- Add the same `calculateDisplayPrice` helper function
- Set `price_markup_type` to 'vendor_default' for new vehicles
- Preserve existing markup settings during updates
- Recalculate `display_price` based on markup settings

### 3. Markup Application Logic

The system follows this priority order:

1. **Individual vehicle markup** (if specifically set for a vehicle)
2. **Vendor default markup** (applied to all vehicles from that vendor)
3. **No markup** (if neither is set)

## Code Examples

### Helper Function

```javascript
function calculateDisplayPrice(basePrice, markupType, markupValue) {
  if (!markupType || markupType === 'none' || !markupValue) {
    return basePrice;
  }
  
  if (markupType === 'amount') {
    return basePrice + markupValue;
  } else if (markupType === 'percentage') {
    return basePrice + (basePrice * (markupValue / 100));
  }
  
  return basePrice;
}
```

### For New Vehicles (INSERT)

```javascript
// Get vendor markup settings
const vendorSettings = await env.DB.prepare(`
  SELECT markup_type, markup_value FROM vendor_settings
  WHERE vendor_id = 'vendor_name'
`).first();

let displayPrice = vehicle.price;
if (vendorSettings) {
  displayPrice = calculateDisplayPrice(vehicle.price, vendorSettings.markup_type, vendorSettings.markup_value);
}

// Insert with markup fields
INSERT INTO vehicles (
  // existing fields...
  price_markup_type, price_markup_value, display_price
) VALUES (
  // existing values...
  'vendor_default', 0, ?
)
```

### For Existing Vehicles (UPDATE)

```javascript
// Get existing markup settings
const existingVehicle = await env.DB.prepare(`
  SELECT price_markup_type, price_markup_value FROM vehicles
  WHERE id = ?
`).bind(existing.id).first();

let existingMarkupType = existingVehicle.price_markup_type || 'vendor_default';
let existingMarkupValue = existingVehicle.price_markup_value || 0;
let displayPrice = vehicle.price;

// Calculate display price based on markup settings
if (existingMarkupType === 'vendor_default') {
  const vendorSettings = await env.DB.prepare(`
    SELECT markup_type, markup_value FROM vendor_settings
    WHERE vendor_id = 'vendor_name'
  `).first();
  
  if (vendorSettings) {
    displayPrice = calculateDisplayPrice(vehicle.price, vendorSettings.markup_type, vendorSettings.markup_value);
  }
} else if (existingMarkupType === 'amount' || existingMarkupType === 'percentage') {
  displayPrice = calculateDisplayPrice(vehicle.price, existingMarkupType, existingMarkupValue);
}

// Update with preserved markup settings
UPDATE vehicles SET
  // existing fields...
  price_markup_type = ?,
  price_markup_value = ?,
  display_price = ?
WHERE id = ?
```

## Benefits

1. **Consistent Pricing** - All vehicles have the correct display price regardless of how they are synced
2. **Preserved Settings** - Existing markup settings are preserved during updates
3. **Automatic Application** - New vehicles automatically use vendor default markup
4. **Transparency** - Original prices are preserved in the database for reporting
5. **Simplicity** - Customers see only one price, with no indication of markup

## Implementation Date

This markup system update was implemented on November 3, 2025.

## Files Updated

1. `workers/vendor-sync-worker.js`
2. `workers/lambert-scraper-enhanced.js`
3. `workers/sltautos-scraper.js`
4. `workers/naniauto-scraper.js` (pending update)

## Next Steps

1. Complete the update of `naniauto-scraper.js` to handle markup settings
2. Test the markup system with real data
3. Monitor the system to ensure markups are being applied correctly
