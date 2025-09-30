-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id VARCHAR(50) UNIQUE NOT NULL,
  vendor_name VARCHAR(100) NOT NULL,
  vendor_type VARCHAR(50),
  api_endpoint TEXT,
  scraper_url TEXT,
  sync_frequency VARCHAR(50) DEFAULT 'daily',
  last_sync TIMESTAMP,
  is_active INTEGER DEFAULT 1,
  settings TEXT,
  auto_remove_after_days INTEGER DEFAULT 7,
  grace_period_days INTEGER DEFAULT 3,
  auto_publish INTEGER DEFAULT 1,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
