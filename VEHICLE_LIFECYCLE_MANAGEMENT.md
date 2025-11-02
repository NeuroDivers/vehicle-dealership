# Vehicle Lifecycle Management

## Overview

This document outlines the updated vehicle lifecycle management system for the dealership platform. The system handles vehicles from multiple vendors and manages their status throughout their lifecycle.

## Lifecycle States

Vehicles in the system go through the following lifecycle states:

1. **Active** - Vehicle is available from vendor and in our inventory
2. **Unlisted** - Vehicle is no longer available from vendor but still in our inventory
3. **Sold** - Vehicle has been sold (either by us or by vendor)
4. **Deleted** - Vehicle has been permanently removed from our database

## Updated Lifecycle Rules

### When a Vehicle Disappears from Vendor Feed:

1. **If Marked as Sold Internally:**
   - Keep in inventory
   - Maintain `isSold = 1` status
   - Never delete automatically

2. **If Not Sold:**
   - **Immediate Action:** Mark as "unlisted" (`vendor_status = 'unlisted'`)
   - **After 14-Day Grace Period:** Delete the vehicle and its information from database

### Implementation Details

For each vendor (Lambert, NaniAuto, SLT Autos), the system:

1. Compares current vendor feed with database records
2. Marks missing vehicles as "unlisted" immediately
3. Deletes vehicles that have been "unlisted" for more than 14 days (unless sold)

```javascript
// Mark vehicles as unlisted IMMEDIATELY when missing from vendor feed
await env.DB.prepare(`
  UPDATE vehicles 
  SET 
    vendor_status = 'unlisted',
    updatedAt = datetime('now')
  WHERE 
    vendor_id = '${vendorId}' 
    AND vendor_status = 'active'
    AND isSold = 0
    AND vin NOT IN (${placeholders})
`).bind(...currentVINs).run();

// Delete vehicles after 14-day grace period (unless sold internally)
const deletionGracePeriodDays = 14;

await env.DB.prepare(`
  DELETE FROM vehicles
  WHERE 
    vendor_id = '${vendorId}' 
    AND vendor_status = 'unlisted'
    AND isSold = 0
    AND last_seen_from_vendor IS NOT NULL
    AND datetime(last_seen_from_vendor, '+${deletionGracePeriodDays} days') <= datetime('now')
`).run();
```

## Scheduled Execution

The vendor-sync-worker runs on a schedule to perform lifecycle management:

```
schedule: 0 2 */3 * *  # At 2:00 AM, every 3 days
```

This ensures that vehicles are properly marked as unlisted and deleted according to the rules.

## Benefits

1. **Immediate Unlisting** - Vehicles no longer available from vendor are immediately marked as unlisted, improving inventory accuracy
2. **Grace Period** - 14-day grace period before deletion allows time for potential reappearance or manual intervention
3. **Database Cleanup** - Automatic deletion of stale listings keeps the database clean and efficient
4. **Sold Protection** - Vehicles marked as sold are never automatically deleted

## Manual Controls

Administrators can still manually:
- Mark vehicles as sold
- Unlist vehicles
- Delete vehicles
- Restore unlisted vehicles to active status

## Logging

All lifecycle management actions are logged in the `vendor_sync_logs` table, including:
- Number of vehicles unlisted
- Number of vehicles deleted
- Timestamp of action
- Duration of operation

## Implementation Date

This updated lifecycle management was implemented on November 2, 2025.
