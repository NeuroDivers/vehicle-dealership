# Vendor Settings Explained

## Overview

The Vendor Management system has three important settings for each vendor:

### 1. **Sync Frequency**
**What it should do:** How often the vendor's inventory should be automatically synced.

**Options:**
- `hourly` - Sync every hour
- `daily` - Sync once per day (recommended)
- `weekly` - Sync once per week
- `manual` - Only sync when manually triggered

**Current Status:** ⚠️ **NOT IMPLEMENTED**
- This is currently just a UI setting
- No automatic scheduling exists
- All syncs must be triggered manually via the "Sync Now" button

**To Implement:** Would need to use Cloudflare Workers Cron Triggers to schedule automatic syncs.

---

### 2. **Grace Period Days**
**What it should do:** Number of days to wait before marking a vehicle as "unlisted" after it disappears from the vendor's feed.

**Purpose:**
- Prevents premature marking as unlisted due to temporary glitches
- Gives vendors time to update their feeds
- Avoids false "vehicle unavailable" messages to customers

**Example:**
- Grace Period: 3 days
- Vehicle last seen: January 1
- Vehicle still marked "active" until: January 4
- On January 4, if still missing: Marked as "unlisted"

**Current Status:** ⚠️ **NOT IMPLEMENTED**
- Vehicles are immediately marked as "unlisted" when they disappear from vendor feed
- No grace period logic exists
- The `last_seen_from_vendor` field is set but not used for grace period calculations

---

### 3. **Auto Remove After Days**
**What it should do:** Number of days after being marked "unlisted" before the vehicle is automatically hidden or removed from public listings.

**Purpose:**
- Automatically clean up old, unavailable inventory
- Prevent showing vehicles that are no longer available
- Keep the dealership's listings fresh and accurate

**Example:**
- Auto Remove: 7 days
- Vehicle marked unlisted: January 1
- Vehicle remains visible but marked as "unlisted": January 1-7
- On January 8: Vehicle automatically hidden from public view (but kept in database)

**Current Status:** ⚠️ **NOT IMPLEMENTED**
- Unlisted vehicles remain visible indefinitely
- No automatic removal or hiding occurs
- Would need a background job or cron to check and hide vehicles

---

## How It SHOULD Work (Ideal Flow)

### Day 0: Vehicle in Vendor Feed
- Vehicle appears in vendor feed
- Sync worker imports it
- Status: `active`
- `last_seen_from_vendor`: Today

### Day 1-3: Vehicle Missing (Grace Period)
- Vehicle no longer in vendor feed
- Sync worker sees it's missing
- Grace Period: 3 days
- Status: Still `active` ⚠️ (not changed yet)
- `last_seen_from_vendor`: Day 0 (unchanged)

### Day 4: Grace Period Expires
- Vehicle still missing from vendor feed
- Grace period (3 days) has passed
- Status: Changed to `unlisted`
- Vehicle still visible on site with "Call for Availability" badge

### Day 4-10: Unlisted Period
- Vehicle remains unlisted
- Still visible on site but marked as potentially unavailable
- Customers can still inquire about it

### Day 11: Auto Remove
- 7 days after being marked unlisted
- Auto Remove After Days: 7
- Vehicle automatically hidden from public view
- Database record retained for history
- Only visible in admin dashboard

---

## Current Issues

### Issue 1: Sync History Only Shows Lambert
**Problem:** NaniAuto and SLT Autos syncs don't appear in Sync History

**Root Cause:**
- Only Lambert logs to `vendor_sync_logs` table
- NaniAuto and SLT Autos don't log their sync operations

**Files Affected:**
- `workers/vendor-sync-worker.js` - Lines 720-750 (NaniAuto) and 909-940 (SLT Autos)

**Fix Needed:** Add database logging to NaniAuto and SLT Autos sync functions

---

### Issue 2: Settings Are Not Implemented
**Problem:** Grace Period and Auto Remove settings exist in UI but don't actually do anything

**Root Cause:**
- Settings are stored but never used
- No logic exists to check grace period before marking unlisted
- No logic exists to auto-remove after specified days

**Fix Needed:**
1. Implement grace period check before marking vehicles as unlisted
2. Implement auto-remove cron job or sync-time check
3. Add scheduled workers for automatic syncing based on sync_frequency

---

## Database Schema

### `vendors` Table (Needed)
```sql
CREATE TABLE IF NOT EXISTS vendors (
  vendor_id TEXT PRIMARY KEY,
  vendor_name TEXT NOT NULL,
  vendor_type TEXT NOT NULL, -- 'scraper', 'api', 'manual'
  is_active INTEGER DEFAULT 1,
  sync_frequency TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly', 'manual'
  grace_period_days INTEGER DEFAULT 3,
  auto_remove_after_days INTEGER DEFAULT 7,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### `vendor_sync_logs` Table (Already Exists)
```sql
CREATE TABLE IF NOT EXISTS vendor_sync_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  sync_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  vehicles_found INTEGER DEFAULT 0,
  new_vehicles INTEGER DEFAULT 0,
  updated_vehicles INTEGER DEFAULT 0,
  removed_vehicles INTEGER DEFAULT 0,
  unlisted_vehicles INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success', -- 'success', 'partial', 'failed'
  error_message TEXT,
  sync_duration_seconds INTEGER,
  FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)
);
```

### `vehicles` Table (Already Has These Fields)
- `vendor_status` - 'active', 'unlisted', 'removed'
- `last_seen_from_vendor` - Timestamp of last appearance in vendor feed
- `unlisted_date` - When marked as unlisted (needed for auto-remove calculation)

---

## Implementation Priority

### High Priority (Fixes broken features)
1. ✅ Fix NaniAuto and SLT Autos not logging to sync history
2. ✅ Implement grace period logic
3. ✅ Add `unlisted_date` field to vehicles table

### Medium Priority (Nice to have)
4. ⚠️ Implement auto-remove after days logic
5. ⚠️ Create vendors table in database
6. ⚠️ Make vendor settings editable and save to database

### Low Priority (Advanced features)
7. ⚠️ Implement automatic syncing based on sync_frequency
8. ⚠️ Create cron workers for scheduled operations
9. ⚠️ Add email notifications for sync failures

---

## Quick Fixes Available Now

### Fix 1: Add Sync Logging to NaniAuto/SLT
Add this code before returning the response in both functions:

```javascript
// Log sync to database
await env.DB.prepare(`
  INSERT INTO vendor_sync_logs (
    vendor_id, vendor_name, sync_date,
    vehicles_found, new_vehicles, updated_vehicles,
    status, sync_duration_seconds
  ) VALUES (?, ?, datetime('now'), ?, ?, ?, ?, ?)
`).bind(
  'naniauto',  // or 'sltautos'
  'NaniAuto',  // or 'SLT Autos'
  vehicles.length,
  newCount,
  updatedCount,
  'success',
  duration
).run();
```

### Fix 2: Implement Grace Period
Replace immediate unlisting with grace period check:

```javascript
// Only mark as unlisted if grace period has passed
await env.DB.prepare(`
  UPDATE vehicles 
  SET 
    vendor_status = 'unlisted',
    unlisted_date = datetime('now')
  WHERE 
    vendor_id = ? 
    AND vin NOT IN (${placeholders})
    AND (last_seen_from_vendor IS NULL 
         OR datetime(last_seen_from_vendor, '+3 days') < datetime('now'))
    AND vendor_status = 'active'
`).bind(...).run();
```
