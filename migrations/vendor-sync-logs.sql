-- Create vendor sync logs table
CREATE TABLE IF NOT EXISTS vendor_sync_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id VARCHAR(50),
  vendor_name VARCHAR(100),
  sync_date TIMESTAMP,
  vehicles_found INTEGER DEFAULT 0,
  new_vehicles INTEGER DEFAULT 0,
  updated_vehicles INTEGER DEFAULT 0,
  removed_vehicles INTEGER DEFAULT 0,
  unlisted_vehicles INTEGER DEFAULT 0,
  status VARCHAR(50),
  error_message TEXT,
  sync_duration_seconds INTEGER
);

-- Insert default vendors
INSERT OR IGNORE INTO vendors (vendor_id, vendor_name, vendor_type, scraper_url, sync_frequency, auto_remove_after_days, grace_period_days)
VALUES ('lambert', 'Lambert Auto', 'scraper', 'https://automobile-lambert.com', 'daily', 7, 3);

INSERT OR IGNORE INTO vendors (vendor_id, vendor_name, vendor_type, sync_frequency, auto_remove_after_days, grace_period_days)
VALUES ('internal', 'Internal Inventory', 'manual', 'manual', 0, 0);

-- Update existing vehicles to have Lambert as vendor if they have stock numbers
UPDATE vehicles 
SET vendor_id = 'lambert', vendor_name = 'Lambert Auto'
WHERE stockNumber IS NOT NULL AND stockNumber != '' AND vendor_id = 'internal';
