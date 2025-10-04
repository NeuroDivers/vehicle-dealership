# Lead Pipeline & System Improvements

## 1. Lead Pipeline Enhancements

### Current Issues:
- ❌ No pagination - scrolling forever with many leads
- ❌ No archive functionality
- ❌ Limited filtering options
- ❌ No bulk actions

### Proposed Solutions:

#### A. Add Pagination
```typescript
// Add to LeadPipeline component
const [currentPage, setCurrentPage] = useState(1);
const [leadsPerPage] = useState(20);
const [totalLeads, setTotalLeads] = useState(0);

// Paginate leads
const indexOfLastLead = currentPage * leadsPerPage;
const indexOfFirstLead = indexOfLastLead - leadsPerPage;
const currentLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead);
```

#### B. Archive Functionality
```sql
-- Add archived column to leads table
ALTER TABLE leads ADD COLUMN archived INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN archived_at TEXT;
ALTER TABLE leads ADD COLUMN archived_by TEXT;
```

**Features:**
- Archive old/lost leads
- View archived leads separately
- Restore archived leads
- Auto-archive leads older than X days

#### C. Advanced Filters
- Date range filter
- Lead score range
- Source filter (website, phone, email, etc.)
- Assigned to filter
- Status filter
- Archived/Active toggle

#### D. Bulk Actions
- Bulk assign to staff
- Bulk status update
- Bulk archive
- Bulk export to CSV

#### E. Lead List View (Alternative to Kanban)
- Table view with sortable columns
- Quick actions per row
- Better for large datasets

---

## 2. Analytics Dashboard - Popular Searches

### Current Issue:
- ❌ Popular searches tab is empty
- ❌ Home page search not tracked
- ❌ Inventory filters not tracked

### Solution:

#### A. Track Home Page Searches
```typescript
// In home page search component
const handleSearch = async (query: string) => {
  // Track the search
  await fetch('/api/analytics/track-search', {
    method: 'POST',
    body: JSON.stringify({
      query,
      source: 'homepage',
      timestamp: new Date().toISOString()
    })
  });
  
  // Perform search
  router.push(`/vehicles?search=${query}`);
};
```

#### B. Track Inventory Page Filters
```typescript
// Track when filters are applied
const trackFilterUsage = async (filters: any) => {
  await fetch('/api/analytics/track-filters', {
    method: 'POST',
    body: JSON.stringify({
      make: filters.make,
      model: filters.model,
      priceRange: filters.priceRange,
      year: filters.year,
      bodyType: filters.bodyType,
      timestamp: new Date().toISOString()
    })
  });
};
```

#### C. Analytics Database Schema
```sql
CREATE TABLE IF NOT EXISTS search_queries (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  source TEXT, -- 'homepage', 'inventory', 'mobile'
  results_count INTEGER,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS filter_usage (
  id TEXT PRIMARY KEY,
  filter_type TEXT, -- 'make', 'model', 'price', 'year', 'bodyType'
  filter_value TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_search_queries_timestamp ON search_queries(timestamp);
CREATE INDEX idx_filter_usage_timestamp ON filter_usage(timestamp);
```

---

## 3. Dashboard Link in Header

### Current Issue:
- ❌ No way to get back to admin dashboard from front page when logged in

### Solution:

```typescript
// In Header component
const [isLoggedIn, setIsLoggedIn] = useState(false);

useEffect(() => {
  const token = localStorage.getItem('auth_token');
  setIsLoggedIn(!!token);
}, []);

// Add to header navigation
{isLoggedIn && (
  <Link 
    href="/admin"
    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
  >
    <LayoutDashboard className="h-4 w-4" />
    Dashboard
  </Link>
)}
```

---

## 4. Protected Dev User

### Current Issue:
- ❌ Dev user can be deleted by other admins
- ❌ Dev user can be edited by others
- ❌ No special "dev" role

### Solution:

#### A. Create Dev Role
```sql
-- Add role column if not exists
ALTER TABLE staff ADD COLUMN role TEXT DEFAULT 'staff';

-- Update dev user
UPDATE staff 
SET role = 'dev' 
WHERE id = 'dev-1759282417863-eahhg7zr9';
```

#### B. Hide Dev User from Non-Dev Users
```typescript
// In staff list
const filteredStaff = staff.filter(member => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Hide dev users unless current user is dev
  if (member.role === 'dev' && currentUser.role !== 'dev') {
    return false;
  }
  
  return true;
});
```

#### C. Protect from Deletion
```typescript
// In staff management
const PROTECTED_USER_ID = 'dev-1759282417863-eahhg7zr9';

// Hide delete button
{member.id !== PROTECTED_USER_ID && (
  <button onClick={() => handleDelete(member.id)}>
    <Trash2 />
  </button>
)}

// Show notice
{member.id === PROTECTED_USER_ID && (
  <div className="text-sm text-gray-500">
    🔒 Protected - Cannot be deleted
  </div>
)}
```

#### D. Restrict Editing
```typescript
// Only allow editing by self
const canEdit = (staffMember: Staff) => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (staffMember.id === PROTECTED_USER_ID) {
    return currentUser.id === PROTECTED_USER_ID;
  }
  
  return true;
};
```

---

## 5. Implementation Priority

### Phase 1 (High Priority):
1. ✅ Add dashboard link to header
2. ✅ Protect dev user from deletion
3. ✅ Track home page searches
4. ✅ Add lead pagination

### Phase 2 (Medium Priority):
5. ✅ Add archive functionality to leads
6. ✅ Track inventory filters
7. ✅ Create dev role and hide dev users

### Phase 3 (Nice to Have):
8. ✅ Bulk actions for leads
9. ✅ Lead list view (table)
10. ✅ Advanced analytics dashboard

---

## 6. Database Migrations Needed

```sql
-- Leads table
ALTER TABLE leads ADD COLUMN archived INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN archived_at TEXT;
ALTER TABLE leads ADD COLUMN archived_by TEXT;

-- Staff table
ALTER TABLE staff ADD COLUMN role TEXT DEFAULT 'staff';
UPDATE staff SET role = 'dev' WHERE id = 'dev-1759282417863-eahhg7zr9';

-- Analytics tables
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
```

---

## 7. UI Components to Create

1. **LeadPagination.tsx** - Pagination controls
2. **LeadArchiveModal.tsx** - Archive confirmation
3. **LeadBulkActions.tsx** - Bulk action toolbar
4. **LeadTableView.tsx** - Alternative table view
5. **DashboardHeaderLink.tsx** - Header dashboard button
6. **ProtectedUserBadge.tsx** - Protected user indicator

---

Ready to implement! Which phase should we start with?
