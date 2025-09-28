-- D1 Database Schema for Vehicle Dealership Analytics
-- This schema supports vehicle views, search queries, and lead management

-- Vehicle Views Analytics Table
CREATE TABLE IF NOT EXISTS vehicle_views (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    price REAL NOT NULL,
    timestamp TEXT NOT NULL,
    user_agent TEXT,
    referrer TEXT,
    url TEXT,
    ip TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Search Queries Analytics Table
CREATE TABLE IF NOT EXISTS search_queries (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    result_count INTEGER NOT NULL DEFAULT 0,
    timestamp TEXT NOT NULL,
    user_agent TEXT,
    url TEXT,
    ip TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Leads Management Table
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    vehicle_make TEXT NOT NULL,
    vehicle_model TEXT NOT NULL,
    vehicle_year INTEGER NOT NULL,
    vehicle_price REAL NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    message TEXT,
    inquiry_type TEXT NOT NULL,
    preferred_contact TEXT NOT NULL,
    lead_score INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new',
    source TEXT NOT NULL DEFAULT 'website',
    timestamp TEXT NOT NULL,
    user_agent TEXT,
    url TEXT,
    ip TEXT,
    assigned_to TEXT,
    follow_up_date TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicle_views_vehicle_id ON vehicle_views(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_views_timestamp ON vehicle_views(timestamp);
CREATE INDEX IF NOT EXISTS idx_vehicle_views_make_model ON vehicle_views(make, model);

CREATE INDEX IF NOT EXISTS idx_search_queries_query ON search_queries(query);
CREATE INDEX IF NOT EXISTS idx_search_queries_result_count ON search_queries(result_count);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  price REAL NOT NULL,
  odometer INTEGER NOT NULL,
  bodyType TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  images TEXT,
  isSold INTEGER DEFAULT 0,
  stockNumber TEXT,
  vin TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on isSold for filtering
CREATE INDEX IF NOT EXISTS idx_vehicles_sold ON vehicles(isSold);

-- Create leads table
CREATE INDEX IF NOT EXISTS idx_leads_vehicle_id ON leads(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_timestamp ON leads(timestamp);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads(lead_score);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
