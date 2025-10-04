# Immediate Action Plan - System Improvements

## Summary of Requested Improvements

### 1. Lead Pipeline Enhancements ⭐⭐⭐
**Problem:** Too many leads = endless scrolling
**Solutions:**
- Add pagination (20 leads per page)
- Add archive functionality
- Add filters (date, score, assignee, status)
- Add bulk actions
- Add table view option

### 2. Analytics Dashboard - Popular Searches ⭐⭐⭐
**Problem:** Popular searches tab is empty
**Solutions:**
- Track home page search bar queries
- Track inventory page filter usage
- Display top searches in analytics
- Show most popular filters

### 3. Dashboard Link in Header ⭐⭐⭐
**Problem:** No way to get back to admin from front page
**Solution:**
- Add green "Dashboard" button in header (only for logged-in users)

### 4. Protect Dev User ⭐⭐⭐
**Problem:** Dev user can be deleted/edited by others
**Solutions:**
- Hide delete button for dev user (dev-1759282417863-eahhg7zr9)
- Only allow self-editing
- Create "dev" role
- Hide dev users from non-dev users

---

## Implementation Order

### Phase 1: Quick Wins (30 minutes)
1. ✅ Add dashboard link to header
2. ✅ Hide delete button for protected user
3. ✅ Add "cannot be deleted" notice

### Phase 2: Analytics (1 hour)
4. ✅ Track home page searches
5. ✅ Track inventory filters
6. ✅ Display in analytics dashboard

### Phase 3: Lead Pipeline (2 hours)
7. ✅ Add pagination to leads
8. ✅ Add archive functionality
9. ✅ Add advanced filters
10. ✅ Add bulk actions

### Phase 4: User Roles (1 hour)
11. ✅ Create dev role in database
12. ✅ Hide dev users from non-dev
13. ✅ Restrict editing permissions

---

## Files to Modify

### Phase 1:
- `src/components/Navigation.tsx` - Add dashboard link
- `src/app/admin/staff/page.tsx` - Protect dev user

### Phase 2:
- `src/app/page.tsx` - Track home searches
- `src/app/vehicles/page.tsx` - Track filters
- `src/app/admin/analytics/AnalyticsDashboard.tsx` - Display data
- Create: `src/app/api/analytics/track-search/route.ts`
- Create: `src/app/api/analytics/track-filters/route.ts`

### Phase 3:
- `src/app/admin/leads/LeadPipeline.tsx` - Add pagination, filters, archive
- Create: `src/components/LeadPagination.tsx`
- Create: `src/components/LeadArchiveModal.tsx`
- Create: `src/components/LeadBulkActions.tsx`

### Phase 4:
- Database migration for roles
- `src/lib/auth-handler.js` - Add role checks
- `src/app/admin/staff/page.tsx` - Filter by role

---

## Database Changes Needed

```sql
-- Add to leads table
ALTER TABLE leads ADD COLUMN archived INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN archived_at TEXT;
ALTER TABLE leads ADD COLUMN archived_by TEXT;

-- Add to staff table  
ALTER TABLE staff ADD COLUMN role TEXT DEFAULT 'staff';
UPDATE staff SET role = 'dev' WHERE id = 'dev-1759282417863-eahhg7zr9';

-- Create analytics tables
CREATE TABLE IF NOT EXISTS search_queries (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  source TEXT,
  results_count INTEGER,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS filter_usage (
  id TEXT PRIMARY KEY,
  filter_type TEXT,
  filter_value TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_search_timestamp ON search_queries(timestamp);
CREATE INDEX idx_filter_timestamp ON filter_usage(timestamp);
```

---

## Next Steps

**Would you like me to:**
1. Start with Phase 1 (Quick Wins) - Dashboard link + Protect dev user?
2. Focus on Analytics first - Track searches and filters?
3. Tackle Lead Pipeline improvements?
4. Do all of them in order?

Let me know your preference and I'll implement immediately! 🚀
