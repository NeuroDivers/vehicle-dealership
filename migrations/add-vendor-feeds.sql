-- Migration: Add vendor_feeds table for XML feed management
-- Allows dynamic management of vendor feeds without hardcoding URLs

-- Create vendor_feeds table
CREATE TABLE IF NOT EXISTS vendor_feeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id TEXT NOT NULL UNIQUE,
  vendor_name TEXT NOT NULL,
  feed_url TEXT NOT NULL,
  feed_type TEXT DEFAULT 'xml', -- 'xml', 'json', 'csv'
  is_active INTEGER DEFAULT 1,
  sync_frequency TEXT DEFAULT 'manual', -- 'manual', 'hourly', 'daily', 'weekly'
  last_sync_at DATETIME,
  last_sync_status TEXT, -- 'success', 'error', 'pending'
  last_sync_message TEXT,
  last_sync_count INTEGER DEFAULT 0,
  total_syncs INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_vendor_feeds_vendor_id ON vendor_feeds(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_feeds_is_active ON vendor_feeds(is_active);

-- Insert initial feed configurations
INSERT OR IGNORE INTO vendor_feeds (vendor_id, vendor_name, feed_url, feed_type, is_active) VALUES
  ('lambert', 'Lambert Auto', 'https://dealer-scraper.nick-damato0011527.workers.dev/api/feeds/5/xml', 'xml', 1),
  ('naniauto', 'NaniAuto', 'https://dealer-scraper.nick-damato0011527.workers.dev/api/feeds/1/xml', 'xml', 1),
  ('sltautos', 'SLT Autos', 'https://dealer-scraper.nick-damato0011527.workers.dev/api/feeds/6/xml', 'xml', 1);

-- Update vendor_settings to ensure these vendors exist
INSERT OR IGNORE INTO vendor_settings (vendor_id, vendor_name, markup_type, markup_value) VALUES
  ('lambert', 'Lambert Auto', 'none', 0),
  ('naniauto', 'NaniAuto', 'none', 0),
  ('sltautos', 'SLT Autos', 'none', 0);
