-- Migration: Add Multi-Vendor Tracking Support
-- Date: 2024-09-29
-- Description: Adds vendor tracking capabilities to manage vehicles from multiple sources

-- 1. Add vendor tracking fields to vehicles table
ALTER TABLE vehicles ADD COLUMN vendor_id VARCHAR(50) DEFAULT 'internal';
ALTER TABLE vehicles ADD COLUMN vendor_name VARCHAR(100) DEFAULT 'Internal Inventory';
ALTER TABLE vehicles ADD COLUMN vendor_stock_number VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN last_seen_from_vendor TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE vehicles ADD COLUMN vendor_status VARCHAR(50) DEFAULT 'active';
-- Values: 'active', 'unlisted', 'sold_by_us', 'sold_by_vendor', 'removed'
ALTER TABLE vehicles ADD COLUMN sync_status VARCHAR(50) DEFAULT 'synced';
-- Values: 'synced', 'pending_removal', 'manually_kept'
ALTER TABLE vehicles ADD COLUMN is_published BOOLEAN DEFAULT true;

-- Create index for vendor queries
CREATE INDEX IF NOT EXISTS idx_vendor_tracking ON vehicles(vendor_id, vendor_status, last_seen_from_vendor);
CREATE INDEX IF NOT EXISTS idx_vehicle_visibility ON vehicles(is_published, vendor_status);

-- 2. Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id VARCHAR(50) UNIQUE NOT NULL,
  vendor_name VARCHAR(100) NOT NULL,
  vendor_type VARCHAR(50), -- 'scraper', 'api', 'manual'
  api_endpoint TEXT,
  scraper_url TEXT,
  sync_frequency VARCHAR(50) DEFAULT 'daily', -- 'hourly', 'daily', 'weekly'
  last_sync TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  settings JSON, -- Vendor-specific settings
  auto_remove_after_days INTEGER DEFAULT 7,
  grace_period_days INTEGER DEFAULT 3,
  auto_publish BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create vendor sync logs table
CREATE TABLE IF NOT EXISTS vendor_sync_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id VARCHAR(50),
  vendor_name VARCHAR(100),
  sync_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  vehicles_found INTEGER DEFAULT 0,
  new_vehicles INTEGER DEFAULT 0,
  updated_vehicles INTEGER DEFAULT 0,
  removed_vehicles INTEGER DEFAULT 0,
  unlisted_vehicles INTEGER DEFAULT 0,
  status VARCHAR(50), -- 'success', 'partial', 'failed'
  error_message TEXT,
  sync_duration_seconds INTEGER,
  FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)
);

-- 4. Insert default vendors
INSERT OR IGNORE INTO vendors (
  vendor_id, 
  vendor_name, 
  vendor_type, 
  scraper_url, 
  sync_frequency,
  auto_remove_after_days,
  grace_period_days
) VALUES 
  ('lambert', 'Lambert Auto', 'scraper', 'https://automobile-lambert.com', 'daily', 7, 3),
  ('internal', 'Internal Inventory', 'manual', NULL, 'manual', 0, 0);

-- 5. Update existing vehicles to have Lambert as vendor (if they have Lambert-style stock numbers)
UPDATE vehicles 
SET 
  vendor_id = 'lambert',
  vendor_name = 'Lambert Auto',
  vendor_stock_number = stockNumber
WHERE 
  stockNumber IS NOT NULL 
  AND stockNumber != ''
  AND vendor_id IS NULL;

-- 6. Update remaining vehicles as internal inventory
UPDATE vehicles 
SET 
  vendor_id = 'internal',
  vendor_name = 'Internal Inventory'
WHERE 
  vendor_id IS NULL;

-- 7. Create vendor rules table for advanced configuration
CREATE TABLE IF NOT EXISTS vendor_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id VARCHAR(50) UNIQUE NOT NULL,
  price_markup_percentage DECIMAL(5,2),
  excluded_makes JSON, -- JSON array of makes to exclude
  minimum_price DECIMAL(10,2),
  maximum_price DECIMAL(10,2),
  minimum_year INTEGER,
  maximum_age_years INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)
);

-- 8. Create trigger to update the updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_vendors_timestamp 
AFTER UPDATE ON vendors
BEGIN
  UPDATE vendors SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_vendor_rules_timestamp 
AFTER UPDATE ON vendor_rules
BEGIN
  UPDATE vendor_rules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
