-- Create analytics tables for tracking vehicle views, searches, and user behavior

-- Table for tracking vehicle page views
CREATE TABLE IF NOT EXISTS vehicle_views (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  visitor_id TEXT,
  session_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  viewed_at DATETIME DEFAULT (datetime('now')),
  duration_seconds INTEGER,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_views_vehicle_id ON vehicle_views(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_views_viewed_at ON vehicle_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_vehicle_views_visitor_id ON vehicle_views(visitor_id);

-- Table for tracking search analytics
CREATE TABLE IF NOT EXISTS search_analytics (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  result_count INTEGER DEFAULT 0,
  filters_used TEXT,
  visitor_id TEXT,
  session_id TEXT,
  searched_at DATETIME DEFAULT (datetime('now')),
  clicked_vehicle_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_searched_at ON search_analytics(searched_at);
CREATE INDEX IF NOT EXISTS idx_search_analytics_visitor_id ON search_analytics(visitor_id);

-- Verify leads table exists (should already be there)
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  vehicle_id TEXT,
  source TEXT,
  status TEXT DEFAULT 'new',
  assigned_to TEXT,
  score INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME DEFAULT (datetime('now')),
  contacted_at DATETIME,
  notes TEXT,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (assigned_to) REFERENCES staff(id)
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_vehicle_id ON leads(vehicle_id);
