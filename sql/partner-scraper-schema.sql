-- Partner Scraper Database Schema for Cloudflare D1
-- This schema tracks partner dealerships, their vehicles, and scraping history

-- Partner configurations
CREATE TABLE IF NOT EXISTS partner_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  listing_path TEXT DEFAULT '/cars/',
  scrape_config TEXT, -- JSON config for scraper settings
  scrape_delay INTEGER DEFAULT 1000, -- Milliseconds between requests
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Partner vehicles inventory
CREATE TABLE IF NOT EXISTS partner_vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  vin TEXT,
  year INTEGER,
  make TEXT,
  model TEXT,
  price INTEGER,
  odometer INTEGER,
  odometer_unit TEXT DEFAULT 'km',
  fuel_type TEXT,
  body_type TEXT,
  color TEXT,
  stock_number TEXT,
  images TEXT, -- JSON array of image URLs
  description TEXT,
  fingerprint TEXT, -- For change detection
  status TEXT DEFAULT 'NEW', -- NEW, CHANGED, UNCHANGED, REMOVED
  first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_changed DATETIME,
  removed_at DATETIME,
  scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partner_configs(id),
  UNIQUE(partner_id, url)
);

-- Scraper run history
CREATE TABLE IF NOT EXISTS scraper_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id INTEGER NOT NULL,
  status TEXT NOT NULL, -- running, completed, failed
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  metadata TEXT, -- JSON with counts, errors, etc.
  FOREIGN KEY (partner_id) REFERENCES partner_configs(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_vehicles_partner_id ON partner_vehicles(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_vehicles_status ON partner_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_partner_vehicles_vin ON partner_vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_partner_vehicles_fingerprint ON partner_vehicles(fingerprint);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_partner_id ON scraper_runs(partner_id);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_started_at ON scraper_runs(started_at);

-- Sample partner configurations
INSERT OR IGNORE INTO partner_configs (name, base_url, scrape_config) VALUES 
(
  'Automobile Lambert',
  'https://automobile-lambert.com',
  '{
    "listing_path": "/cars/",
    "per_page": 20,
    "order_by": "date",
    "max_pages": 50,
    "link_pattern": "href=\"([^\"]+/cars/[^\"]+)\"",
    "scrape_delay": 1500
  }'
),
(
  'Example Auto Group',
  'https://example-auto.com',
  '{
    "listing_path": "/inventory/",
    "per_page": 24,
    "order_by": "price",
    "max_pages": 30,
    "link_pattern": "href=\"([^\"]+/vehicle/[^\"]+)\"",
    "scrape_delay": 2000
  }'
);
