# Phase 2: Analytics Tracking Implementation Summary

## Status: Ready to Implement

### What Needs to Be Done:

**1. Track Home Page Searches** ⭐⭐⭐
- Capture search queries from home page search bar
- Store in analytics database
- Display in "Popular Searches" tab

**2. Track Inventory Page Filters** ⭐⭐
- Capture filter selections (make, model, price, year, body type)
- Store filter usage data
- Display most popular filters

**3. Display in Analytics Dashboard** ⭐⭐⭐
- Show top 10 search queries
- Show most used filters
- Add date range filtering

---

## Files to Create/Modify:

### Backend (Workers):
1. Update `workers/vehicle-dealership-api-worker.js`:
   - Add `/api/analytics/track-search` endpoint
   - Add `/api/analytics/track-filters` endpoint
   - Add `/api/analytics/popular-searches` endpoint
   - Add `/api/analytics/popular-filters` endpoint

### Frontend:
2. Update `src/app/page.tsx` (Home page):
   - Add search tracking on form submit

3. Update `src/app/vehicles/page.tsx` (Inventory):
   - Add filter tracking when filters change

4. Update `src/app/admin/analytics/AnalyticsDashboard.tsx`:
   - Fetch and display popular searches
   - Fetch and display popular filters

---

## Database Schema:

```sql
-- Search queries table
CREATE TABLE IF NOT EXISTS search_queries (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  source TEXT, -- 'homepage', 'inventory'
  results_count INTEGER,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Filter usage table
CREATE TABLE IF NOT EXISTS filter_usage (
  id TEXT PRIMARY KEY,
  filter_type TEXT, -- 'make', 'model', 'price', 'year', 'bodyType'
  filter_value TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_search_timestamp ON search_queries(timestamp);
CREATE INDEX idx_filter_timestamp ON filter_usage(timestamp);
```

---

## Implementation Steps:

### Step 1: Add Database Tables (5 min)
Run migration in Cloudflare D1

### Step 2: Add API Endpoints (15 min)
- Track search endpoint
- Track filters endpoint
- Get popular searches endpoint
- Get popular filters endpoint

### Step 3: Update Home Page (10 min)
- Add tracking call on search submit

### Step 4: Update Inventory Page (15 min)
- Add tracking when filters change
- Debounce to avoid too many calls

### Step 5: Update Analytics Dashboard (20 min)
- Fetch popular searches
- Fetch popular filters
- Display in existing tabs
- Add charts/visualizations

---

## API Endpoints Design:

### POST /api/analytics/track-search
```json
{
  "query": "honda civic",
  "source": "homepage",
  "results_count": 5
}
```

### POST /api/analytics/track-filters
```json
{
  "filters": {
    "make": "Honda",
    "priceRange": "10000-20000",
    "year": "2015-2020"
  }
}
```

### GET /api/analytics/popular-searches?days=30
```json
{
  "searches": [
    { "query": "honda civic", "count": 45 },
    { "query": "toyota camry", "count": 38 },
    ...
  ]
}
```

### GET /api/analytics/popular-filters?days=30
```json
{
  "filters": {
    "make": [
      { "value": "Honda", "count": 120 },
      { "value": "Toyota", "count": 95 }
    ],
    "priceRange": [
      { "value": "10000-20000", "count": 85 }
    ]
  }
}
```

---

## Next Session Tasks:

1. Create database migration
2. Add API endpoints to worker
3. Update home page search
4. Update inventory filters
5. Update analytics dashboard
6. Test everything

---

**Estimated Time: 1-1.5 hours**

**Ready to implement in next session!** 🚀
