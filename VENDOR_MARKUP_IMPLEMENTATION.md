# Vendor Markup Implementation

## Overview

This document explains how the vendor markup system works in the vehicle dealership platform, including how markups are applied during the syncing process and how they affect price display on the frontend.

## How Vendor Markups Work

### Markup Types

The system supports three types of markups:

1. **Fixed Amount** - Adds a specific dollar amount to the base price (e.g., +$1,000)
2. **Percentage** - Adds a percentage of the base price (e.g., +10%)
3. **None** - No markup applied

### Markup Application Hierarchy

Markups are applied in the following priority order:

1. **Individual Vehicle Markup** - If a specific vehicle has its own markup settings (`price_markup_type` = 'amount' or 'percentage'), these take precedence
2. **Vendor Default Markup** - If a vehicle is set to use vendor defaults (`price_markup_type` = 'vendor_default'), the vendor's markup settings are applied
3. **No Markup** - If neither of the above is set, the original price is displayed

### Database Structure

The markup system uses these key fields:

- **vendor_settings table**
  - `markup_type` - 'none', 'amount', or 'percentage'
  - `markup_value` - Dollar amount or percentage value

- **vehicles table**
  - `price` - Original base price from vendor
  - `price_markup_type` - 'none', 'amount', 'percentage', or 'vendor_default'
  - `price_markup_value` - Override markup value for this specific vehicle
  - `display_price` - Calculated final price with markup applied

## Implementation in Vendor Sync Worker

The vendor-sync-worker.js has been updated to properly handle markups during the syncing process:

### For New Vehicles

1. When a new vehicle is added from a vendor feed, it is automatically set to use vendor defaults:
   ```javascript
   price_markup_type = 'vendor_default'
   price_markup_value = 0
   ```

2. The display_price is calculated based on the vendor's markup settings:
   ```javascript
   // Get vendor markup settings
   const vendorSettings = await env.DB.prepare(`
     SELECT markup_type, markup_value FROM vendor_settings
     WHERE vendor_id = 'vendor_name'
   `).first();
   
   // Calculate display price
   displayPrice = calculateDisplayPrice(vehicle.price, vendorSettings.markup_type, vendorSettings.markup_value);
   ```

### For Existing Vehicles

1. When an existing vehicle is updated, its markup settings are preserved
2. The display_price is recalculated based on:
   - If using vendor defaults: the current vendor markup settings
   - If using vehicle-specific markup: the vehicle's own markup settings
   - The new base price from the vendor

## Frontend Display

On the frontend, only the final `display_price` is shown to customers. The original base price is not displayed, ensuring customers see only the final price with markup applied.

The only exception is in the admin interface, where staff can see both the original price and the markup details.

## Benefits

1. **Consistent Pricing** - All vehicles from the same vendor can have the same markup applied automatically
2. **Flexibility** - Individual vehicles can have custom markups when needed
3. **Transparency** - Original prices are preserved in the database for reporting
4. **Simplicity** - Customers see only one price, with no indication of markup

## Implementation Date

This markup system was fully implemented on November 2, 2025.
