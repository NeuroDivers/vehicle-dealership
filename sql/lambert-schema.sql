-- Lambert-specific vehicle inventory schema for Cloudflare D1
-- Optimized for automobile-lambert.com structure

CREATE TABLE IF NOT EXISTS lambert_vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  year INTEGER,
  make TEXT,
  model TEXT,
  price INTEGER,
  vin TEXT,
  stock_number TEXT,
  odometer INTEGER,
  odometer_unit TEXT DEFAULT 'km',
  transmission TEXT,
  drivetrain TEXT,
  fuel_type TEXT,
  body_type TEXT,
  color_exterior TEXT,
  color_interior TEXT,
  description TEXT,
  images TEXT, -- JSON array of original image URLs
  local_images TEXT, -- JSON array of R2 stored images
  fingerprint TEXT,
  status TEXT DEFAULT 'NEW', -- NEW, CHANGED, UNCHANGED, REMOVED
  first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_changed DATETIME,
  removed_at DATETIME,
  scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Scraper run history
CREATE TABLE IF NOT EXISTS lambert_scraper_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  duration INTEGER, -- milliseconds
  stats TEXT, -- JSON with counts
  new_vehicles TEXT, -- JSON array of new vehicle summaries
  changed_vehicles TEXT -- JSON array of changed vehicle summaries
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lambert_vehicles_status ON lambert_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_lambert_vehicles_vin ON lambert_vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_lambert_vehicles_fingerprint ON lambert_vehicles(fingerprint);
CREATE INDEX IF NOT EXISTS idx_lambert_vehicles_year_make_model ON lambert_vehicles(year, make, model);
CREATE INDEX IF NOT EXISTS idx_lambert_vehicles_price ON lambert_vehicles(price);
CREATE INDEX IF NOT EXISTS idx_lambert_scraper_runs_timestamp ON lambert_scraper_runs(timestamp);
