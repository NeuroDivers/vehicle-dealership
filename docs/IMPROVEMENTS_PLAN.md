# Vehicle Dealership Improvements Plan

## Issues to Fix

### 1. ✅ Auto-sync Scheduling (Every Few Days)
**Problem:** No automatic syncing, must use "Sync Now" button

**Solution:**
- Add Cloudflare Workers Cron Trigger to run every 3 days
- Keep manual "Sync Now" button for immediate syncing
- Add last_auto_sync timestamp to track automatic vs manual syncs

**Implementation:**
- Update `wrangler-vendor-sync.toml` with cron schedule
- Add endpoint to handle scheduled syncs
- Rotate through vendors (Lambert Day 1, NaniAuto Day 2, SLT Day 3, repeat)

---

### 2. ✅ Add Draft/Unlisted Status (Beyond Available/Sold)
**Problem:** Only "Available" (is Sold=0) or "Sold" (isSold=1) statuses

**Solution:**
- Add `listing_status` field to vehicles table
- Values: `draft`, `published`, `unlisted`, `sold`
- Keep `isSold` for backwards compatibility
- `draft` = Not visible to public, admin-only
- `published` = Visible on site (current "Available")
- `unlisted` = Not visible but not sold (different from vendor_status)
- `sold` = Marked as sold by dealership

**Migration needed:**
```sql
ALTER TABLE vehicles ADD COLUMN listing_status TEXT DEFAULT 'published';
UPDATE vehicles SET listing_status = 'sold' WHERE isSold = 1;
UPDATE vehicles SET listing_status = 'published' WHERE isSold = 0;
```

---

### 3. ✅ Fix Sold Filter in Vehicle Inventory
**Problem:** Sold vehicles don't appear even when "Sold" filter is checked

**Root Cause:** API endpoint `/api/vehicles` filters out sold vehicles:
```javascript
AND (isSold = 0 OR isSold IS NULL)
```

**Solution:**
- Create new `/api/admin/vehicles` endpoint that returns ALL vehicles
- Update `EnhancedVehicleManager.tsx` to use admin endpoint
- Keep public endpoint filtered for customer-facing pages

---

### 4. ✅ Individual Vehicle Sync from Vendor
**Problem:** Must scrape entire vendor site to update one vehicle

**Solution:**
- Add "Refresh from Vendor" button on each vehicle row
- Create endpoint `/api/admin/vehicles/[id]/sync-from-vendor`
- Fetch specific vehicle from vendor by VIN or stock number
- Update only that vehicle's details (price, odometer, images, etc.)

**Benefits:**
- Quick updates without full scrape
- Useful when customer asks about specific vehicle
- Reduces load on vendor sites

---

### 5. ✅ Fix Analytics Dashboard Time Filter
**Problem:** Time filter (last 24h, 7d, 30d) doesn't work

**Root Cause:** Filter selection not passed to API or not implemented in queries

**Solution:**
- Add time range parameter to analytics API queries
- Filter by `created_at` or `timestamp` fields
- Implement for all analytics queries (views, searches, leads, etc.)

---

### 6. ✅ Add Swipe Gestures for Mobile Image Gallery
**Problem:** On mobile, must use arrow buttons to change images (not natural)

**Solution:**
- Add touch event listeners (touchstart, touchmove, touchend)
- Detect swipe direction and distance
- Trigger next/previous image on swipe
- Make arrows more subtle on mobile (semi-transparent)
- Optional: Hide arrows on mobile entirely after initial view

**Implementation:**
- Update `VehicleImageGallery` component
- Add swipe gesture detection library or custom implementation
- CSS: Hide/fade arrows on touchscreen devices

---

## Implementation Order

### High Priority (Do First)
1. ✅ Fix sold filter - Create admin vehicles endpoint
2. ✅ Add draft/unlisted status - Expand vehicle statuses
3. ✅ Mobile swipe gestures - Better UX on phones

### Medium Priority
4. ✅ Individual vehicle sync - Convenience feature
5. ✅ Analytics time filter - Fix broken feature

### Low Priority (Nice to Have)
6. ✅ Auto-sync scheduling - Automation

---

## Database Changes Needed

### New Field: `listing_status`
```sql
ALTER TABLE vehicles ADD COLUMN listing_status TEXT DEFAULT 'published' 
  CHECK(listing_status IN ('draft', 'published', 'unlisted', 'sold'));
```

### Migration Script
```sql
-- Step 1: Add new column
ALTER TABLE vehicles ADD COLUMN listing_status TEXT DEFAULT 'published';

-- Step 2: Migrate existing data
UPDATE vehicles SET listing_status = 'sold' WHERE isSold = 1;
UPDATE vehicles SET listing_status = 'published' WHERE isSold = 0 OR isSold IS NULL;

-- Step 3: Create index
CREATE INDEX IF NOT EXISTS idx_vehicles_listing_status ON vehicles(listing_status);
```

---

## API Endpoints to Create/Modify

### 1. New: `/api/admin/vehicles` (GET)
Returns ALL vehicles including sold, draft, unlisted

### 2. New: `/api/admin/vehicles/[id]/sync-from-vendor` (POST)
Syncs single vehicle from its vendor source

### 3. Modify: `/api/vehicles` (GET)
Keep existing filter for public (only published, not sold)

### 4. Modify: `/api/vehicles/[id]` (PUT/PATCH)
Add support for `listing_status` field updates

### 5. Modify: `/api/analytics/*` (GET)
Add `timeRange` query parameter (24h, 7d, 30d, all)

---

## UI Changes Needed

### EnhancedVehicleManager.tsx
- Use `/api/admin/vehicles` instead of `/api/vehicles`
- Add "Draft", "Unlisted" filter options
- Add "Refresh from Vendor" button per vehicle
- Update bulk actions to include "Mark as Draft", "Mark as Unlisted"

### VehicleImageGallery Component
- Add touch event handlers
- Implement swipe detection
- Make arrows semi-transparent on mobile
- Add CSS media query for touch devices

### Analytics Dashboard
- Wire up time range filter to API calls
- Add loading state when changing time range
- Update chart data based on time filter

---

## Testing Checklist

- [ ] Admin can see sold vehicles with "Sold" filter checked
- [ ] Admin can mark vehicle as Draft (not visible to public)
- [ ] Admin can mark vehicle as Unlisted (not visible, not sold)
- [ ] Public site doesn't show draft/unlisted vehicles
- [ ] Individual vehicle sync updates price/details correctly
- [ ] Analytics time filter (24h, 7d, 30d) shows correct data
- [ ] Mobile users can swipe through images
- [ ] Arrow buttons still work on desktop
- [ ] Auto-sync runs every 3 days without manual trigger
