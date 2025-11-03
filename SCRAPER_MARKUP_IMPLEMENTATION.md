# Vendor Markup Implementation in Scrapers

## Overview

This document explains how the vendor markup system is implemented in the individual scrapers (Lambert, NaniAuto, SLT Autos) to ensure proper price display on the frontend.

## Current Implementation

The vendor markup system is currently implemented in the vendor-sync-worker.js file, which handles:

1. Setting `price_markup_type` to 'vendor_default' for new vehicles
2. Calculating `display_price` based on vendor markup settings
3. Preserving existing markup settings during updates

However, the individual scrapers (lambert-scraper-enhanced.js, naniauto-scraper.js, sltautos-scraper.js) are now called directly from the frontend and need to be updated to handle markup settings properly.

## Required Changes

### For Each Scraper:

1. **Add calculateDisplayPrice Helper Function**
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

2. **For New Vehicles (INSERT)**
   - Add `price_markup_type`, `price_markup_value`, and `display_price` fields to INSERT statements
   - Set `price_markup_type` to 'vendor_default'
   - Calculate `display_price` based on vendor markup settings

3. **For Existing Vehicles (UPDATE)**
   - Preserve existing `price_markup_type` and `price_markup_value`
   - Recalculate `display_price` based on the updated base price and markup settings

## Implementation Steps

### 1. Update SLT Autos Scraper

#### For INSERT Statement:
```javascript
// Get vendor markup settings
const vendorSettings = await env.DB.prepare(`
  SELECT markup_type, markup_value FROM vendor_settings
  WHERE vendor_id = 'sltautos'
`).first();

let displayPrice = vehicle.price;
if (vendorSettings) {
  displayPrice = calculateDisplayPrice(vehicle.price, vendorSettings.markup_type, vendorSettings.markup_value);
}

// Add markup fields to INSERT statement
INSERT INTO vehicles (
  // existing fields...
  price_markup_type, price_markup_value, display_price
) VALUES (
  // existing values...
  'vendor_default', 0, ?
)
```

#### For UPDATE Statement:
```javascript
// Get existing markup settings
const existingMarkup = await env.DB.prepare(`
  SELECT price_markup_type, price_markup_value FROM vehicles
  WHERE id = ?
`).bind(existing.id).first();

let markupType = existingMarkup?.price_markup_type || 'vendor_default';
let markupValue = existingMarkup?.price_markup_value || 0;
let displayPrice = vehicle.price;

// Calculate display price based on markup settings
if (markupType === 'vendor_default') {
  const vendorSettings = await env.DB.prepare(`
    SELECT markup_type, markup_value FROM vendor_settings
    WHERE vendor_id = 'sltautos'
  `).first();
  
  if (vendorSettings) {
    displayPrice = calculateDisplayPrice(vehicle.price, vendorSettings.markup_type, vendorSettings.markup_value);
  }
} else if (markupType === 'amount' || markupType === 'percentage') {
  displayPrice = calculateDisplayPrice(vehicle.price, markupType, markupValue);
}

// Add markup fields to UPDATE statement
UPDATE vehicles SET
  // existing fields...
  price_markup_type = ?,
  price_markup_value = ?,
  display_price = ?
WHERE id = ?
```

### 2. Update Lambert Scraper and NaniAuto Scraper

Apply the same changes to the other scrapers, adjusting the vendor_id as needed.

## Benefits

1. **Consistent Pricing** - All vehicles will have the correct display price regardless of how they are synced
2. **Preserved Settings** - Existing markup settings will be preserved during updates
3. **Automatic Application** - New vehicles will automatically use vendor default markup

## Implementation Date

This markup system update was implemented on November 3, 2025.
