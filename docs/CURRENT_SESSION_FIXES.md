# Current Session Fixes - January 5, 2025

## Issues Identified

### 1. ✅ **SiteSettingsContext Changes** - COMPLETED
- **Status:** Committed and pushed (174d4e4)

### 2. ✅ **`.map is not a function` Error** - FIXED
- **Location:** `/vehicles` page
- **Cause:** `imageData` not being checked if it's an array before calling `.map()`
- **Solution:** Added `Array.isArray(imageData)` check before mapping
- **Status:** Fixed, ready to deploy

### 3. ⏳ **Missing `/api/admin/site-info` Endpoint** - IN PROGRESS
- **Error:** `GET https://autopret123.ca/api/admin/site-info 404`
- **Impact:** Admin dashboard can't load site info
- **Solution:** Need to add endpoint in worker.js

### 4. ⏳ **Cache Clear Button** - PENDING
- **Request:** Add "Clear Cache" button in admin dev tools
- **Purpose:** Clear browser cache easily
- **Solution:** Add button that calls `caches.keys()` and `caches.delete()`

### 5. ⏳ **Status Toggle → Status Popup** - PENDING
- **Current:** Clicking status toggles between Available/Sold
- **Requested:** Open popup with all 4 status options + Save button
- **Statuses:** Draft, Published, Unlisted, Sold
- **Location:** Vehicle management table

### 6. ✅ **Image Deletion Grace Period** - ALREADY IMPLEMENTED
- **Current Behavior:** Images are NOT deleted immediately when sold
- **Existing Implementation:**
  - Cleanup endpoint: `/api/admin/images/cleanup-sold`
  - Grace period: 14 days (keep all images)
  - After 14 days: Keep only first image
  - After 90 days: Delete all images
- **Status:** Already working correctly!

### 7. ⏳ **Individual Vehicle Sync Still Failing** - NEEDS INVESTIGATION
- **Error:** 500 Internal Server Error
- **Endpoint:** `/api/admin/vehicles/25849/sync-from-vendor`
- **Next Step:** Check Cloudflare Workers logs for error details

---

## Cache Clearing Methods

### Browser-Side Cache Clear
```javascript
// Clear all caches
const clearAllCaches = async () => {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  // Also clear localStorage
  localStorage.clear();
  // Reload page
  window.location.reload();
};
```

### Cloudflare Worker Cache Clear
- Cloudflare automatically caches assets
- Can purge via Cloudflare Dashboard or API
- For development: Add `Cache-Control: no-cache` headers

---

## Status Popup Component Design

```typescript
// StatusChangeModal.tsx
interface StatusChangeModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newStatus: string) => Promise<void>;
}

const StatusChangeModal: React.FC<StatusChangeModalProps> = ({ vehicle, isOpen, onClose, onSave }) => {
  const [selectedStatus, setSelectedStatus] = useState(vehicle.listing_status || 'published');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedStatus);
      onClose();
    } catch (error) {
      alert('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Change Vehicle Status</h3>
        <p className="text-sm text-gray-600 mb-4">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </p>
        
        <div className="space-y-2 mb-6">
          {[
            { value: 'draft', label: 'Draft', desc: 'Work in progress', color: 'gray' },
            { value: 'published', label: 'Published', desc: 'Available for sale', color: 'green' },
            { value: 'unlisted', label: 'Unlisted', desc: 'Temporarily hidden', color: 'yellow' },
            { value: 'sold', label: 'Sold', desc: 'Vehicle sold', color: 'red' }
          ].map(status => (
            <label key={status.value} className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="status"
                value={status.value}
                checked={selectedStatus === status.value}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="mr-3"
              />
              <div>
                <div className="font-medium">{status.label}</div>
                <div className="text-xs text-gray-500">{status.desc}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## Next Steps

1. Add `/api/admin/site-info` endpoint
2. Create StatusChangeModal component
3. Update EnhancedVehicleManager to use modal
4. Add cache clear button in admin dev tools
5. Test all changes
6. Deploy

---

## Image Deletion Clarification

**IMPORTANT:** Images are NOT deleted immediately when a vehicle is marked as sold!

The cleanup happens via a **separate endpoint** (`/api/admin/images/cleanup-sold`) that must be called manually or via cron job.

**Timeline:**
- Day 0: Vehicle marked as sold → `sold_at` timestamp set, images remain
- Day 1-14: All images remain intact
- Day 15-89: All images except first one deleted
- Day 90+: All images deleted

**To enable automatic cleanup:** Set up a cron job to call the cleanup endpoint daily.
