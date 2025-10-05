# Migration Plan: isSold → listing_status

**Date:** January 5, 2025  
**Status:** 🔄 IN PROGRESS

---

## 🎯 **Objective**

Consolidate `isSold` (boolean: 0/1) and `listing_status` (enum: draft/published/unlisted/sold) into a single field: **`listing_status`**

---

## ✅ **Progress**

### **Phase 1: Bidirectional Sync** ✅ COMPLETED
**Status:** Deployed (worker version 53f80859)

**What was done:**
- ✅ `isSold = 1` now sets `listing_status = 'sold'`
- ✅ `isSold = 0` now sets `listing_status = 'published'`
- ✅ `listing_status = 'sold'` now sets `isSold = 1`
- ✅ `listing_status != 'sold'` now sets `isSold = 0`
- ✅ Both fields stay in sync automatically

**Files modified:**
- `src/worker.js` - PUT endpoint for vehicle updates

**Result:** The two fields are now synchronized, preventing inconsistencies.

---

### **Phase 2: Update All Code References** 🔄 IN PROGRESS

Need to update all code that uses `isSold` to use `listing_status` instead.

#### **Frontend Components to Update:**

1. **✅ EnhancedVehicleManager.tsx** (Admin)
   - Already uses `listing_status` for filters
   - Still has `handleToggleSold` using `isSold`
   - **Action:** Update toggle to use `listing_status`

2. **VehicleGrid.tsx** (Public)
   - Currently filters by `isSold`
   - **Action:** Filter by `listing_status !== 'sold'`

3. **VehicleCard.tsx** (Public)
   - May display sold badge using `isSold`
   - **Action:** Use `listing_status === 'sold'`

4. **VehicleDetailClient.tsx** (Public)
   - May check `isSold` for display
   - **Action:** Use `listing_status`

5. **Edit Vehicle Form**
   - May have checkbox for `isSold`
   - **Action:** Use dropdown for `listing_status`

#### **Backend/Workers to Update:**

1. **✅ worker.js** (Main API)
   - Bidirectional sync implemented
   - Still accepts `isSold` in requests
   - **Status:** Sync working, keep for backwards compatibility

2. **🔄 vendor-sync-worker.js** (Vendor Sync)
   - Currently sets `isSold = 0` when inserting vehicles
   - **Action:** Set `listing_status = 'published'` instead
   - Keep `isSold` for now for compatibility

3. **Lambert/NaniAuto/SLT Scrapers**
   - Check if they set `isSold`
   - **Action:** Update to use `listing_status`

#### **Database Queries to Update:**

1. **Public Vehicle Listings**
   ```sql
   -- Current
   WHERE isSold = 0
   
   -- New
   WHERE listing_status = 'published'
   ```

2. **Admin Vehicle Listings**
   ```sql
   -- Current
   WHERE isSold = 1  -- sold vehicles
   
   -- New
   WHERE listing_status = 'sold'
   ```

3. **Stats/Analytics**
   ```sql
   -- Current
   COUNT(*) WHERE isSold = 1
   
   -- New
   COUNT(*) WHERE listing_status = 'sold'
   ```

---

### **Phase 3: Migration Strategy** 📝 PLANNED

Since we have bidirectional sync, we can migrate gradually:

#### **Step 1: Ensure Data Consistency** ✅ DONE
- Sync logic ensures both fields match

#### **Step 2: Update Frontend (Gradual)**
1. Update one component at a time
2. Test each change
3. Keep backwards compatibility

#### **Step 3: Update Backend Queries**
1. Change API responses to prefer `listing_status`
2. Update vendor sync to use `listing_status`
3. Keep `isSold` populated for backwards compatibility

#### **Step 4: Deprecation Period**
1. Run both fields for 1-2 weeks
2. Monitor for issues
3. Ensure all clients updated

#### **Step 5: Remove isSold Column** (FINAL)
1. Remove from TypeScript interfaces
2. Remove from API responses
3. Drop database column
4. Update documentation

---

## 📊 **Current Database Schema**

```sql
-- vehicles table
isSold INTEGER DEFAULT 0              -- Old: 0 = available, 1 = sold
listing_status TEXT DEFAULT 'published'  -- New: draft, published, unlisted, sold
sold_at TEXT                          -- Timestamp when marked sold
```

**Mapping:**
| isSold | listing_status | Meaning |
|--------|----------------|---------|
| 0 | published | Available for sale, visible on site |
| 0 | draft | Work in progress, admin only |
| 0 | unlisted | Temporarily hidden |
| 1 | sold | Sold, not available |

---

## 🔍 **Files to Search and Update**

### **Search Patterns:**
```bash
# Find all references to isSold
grep -r "isSold" src/
grep -r "is_sold" src/
grep -r "vehicle.isSold" src/
grep -r "isSold =" src/

# Find SQL queries with isSold
grep -r "WHERE.*isSold" src/
grep -r "SET.*isSold" src/
grep -r "INSERT.*isSold" src/
```

### **Expected File List:**
- `src/app/vehicles/VehicleGrid.tsx`
- `src/app/vehicles/VehicleCard.tsx`
- `src/app/vehicles/detail/VehicleDetailClient.tsx`
- `src/app/admin/vehicles/EnhancedVehicleManager.tsx`
- `src/app/admin/vehicles/edit/page.tsx`
- `src/app/admin/analytics/page.tsx`
- `src/worker.js`
- `workers/vendor-sync-worker.js`
- `workers/lambert-scraper.js`
- `workers/naniauto-scraper.js`
- `workers/sltautos-scraper.js`

---

## 🚀 **Recommended Migration Order**

### **Week 1: Backend**
1. ✅ Add bidirectional sync (DONE)
2. Update vendor-sync-worker
3. Update scrapers
4. Test vendor sync thoroughly

### **Week 2: Frontend**
5. Update admin vehicle manager
6. Update public vehicle grid
7. Update vehicle detail pages
8. Update edit forms

### **Week 3: Cleanup**
9. Remove isSold from TypeScript interfaces
10. Update API documentation
11. Create migration to drop column

---

## 🛠️ **Example Code Changes**

### **Before (isSold):**
```typescript
// Filter available vehicles
const available = vehicles.filter(v => v.isSold === 0);

// Check if sold
if (vehicle.isSold === 1) {
  return <SoldBadge />;
}

// Toggle sold status
onClick={() => updateVehicle({ isSold: vehicle.isSold === 1 ? 0 : 1 })}
```

### **After (listing_status):**
```typescript
// Filter available vehicles
const available = vehicles.filter(v => v.listing_status === 'published');

// Check if sold
if (vehicle.listing_status === 'sold') {
  return <SoldBadge />;
}

// Change listing status
onClick={() => updateVehicle({ 
  listing_status: vehicle.listing_status === 'sold' ? 'published' : 'sold' 
})}

// Or use a dropdown
<select value={vehicle.listing_status}>
  <option value="draft">Draft</option>
  <option value="published">Published</option>
  <option value="unlisted">Unlisted</option>
  <option value="sold">Sold</option>
</select>
```

---

## ⚠️ **Important Notes**

### **DO NOT Remove isSold Yet!**
- Keep the column during migration
- Maintains backwards compatibility
- Allows gradual transition
- Safety net if issues arise

### **Test Thoroughly**
- Test toggling sold status
- Test vendor sync
- Test filters in admin
- Test public site display
- Test analytics

### **Monitor After Changes**
- Check error logs
- Verify data consistency
- Monitor user reports

---

## 🎯 **Success Criteria**

Migration is complete when:
- [ ] All frontend components use `listing_status`
- [ ] All backend queries use `listing_status`
- [ ] No code references `isSold` (except sync logic)
- [ ] All tests pass
- [ ] Production stable for 2 weeks
- [ ] No user-reported issues
- [ ] Documentation updated

**Then and only then:** Drop the `isSold` column.

---

## 📝 **Final Migration SQL**

**ONLY RUN AFTER ALL CODE UPDATED:**

```sql
-- Step 1: Verify data consistency
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN isSold = 1 AND listing_status != 'sold' THEN 1 ELSE 0 END) as inconsistent_sold,
  SUM(CASE WHEN isSold = 0 AND listing_status = 'sold' THEN 1 ELSE 0 END) as inconsistent_available
FROM vehicles;

-- Step 2: If inconsistent count is 0, proceed
-- Drop the isSold column
ALTER TABLE vehicles DROP COLUMN isSold;

-- Step 3: Drop soldDate if not used
ALTER TABLE vehicles DROP COLUMN soldDate;

-- Step 4: Verify
PRAGMA table_info(vehicles);
```

---

## 📚 **Benefits of Migration**

### **Before (Two Fields):**
- ❌ Redundant data
- ❌ Can get out of sync
- ❌ Confusing which to use
- ❌ Limited status options (only sold/available)

### **After (One Field):**
- ✅ Single source of truth
- ✅ Cannot get out of sync
- ✅ Clear what to use
- ✅ Four status options (draft/published/unlisted/sold)
- ✅ More granular control
- ✅ Better admin experience

---

## 🐛 **Known Issues Fixed**

1. ✅ **listing_status not updating when toggling sold**
   - Fixed with bidirectional sync

2. ✅ **Individual vehicle sync 404 error**
   - Fixed URL construction

3. 🔄 **Filters showing both sold and unsold vehicles**
   - Will be fixed when frontend uses listing_status

---

## 📖 **Next Steps**

1. **Update EnhancedVehicleManager toggle function**
2. **Update vendor-sync-worker to set listing_status**
3. **Update public vehicle grid filters**
4. **Test all changes thoroughly**
5. **Monitor for 1-2 weeks**
6. **Complete final migration**

---

**Status:** Phase 1 complete. Phase 2 in progress. Safe to continue development with both fields synced.
