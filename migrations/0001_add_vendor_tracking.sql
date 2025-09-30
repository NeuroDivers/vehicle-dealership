-- Migration: Add Multi-Vendor Tracking Support
-- This migration adds vendor tracking capabilities to the existing database

-- Add vendor tracking columns to vehicles table (one at a time for SQLite)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vendor_id VARCHAR(50) DEFAULT 'internal';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(100) DEFAULT 'Internal Inventory';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vendor_stock_number VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_seen_from_vendor TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vendor_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'synced';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_published INTEGER DEFAULT 1;

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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create vendor sync logs table
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
  status VARCHAR(50),
  error_message TEXT,
  sync_duration_seconds INTEGER
);

-- Insert default vendors
INSERT OR IGNORE INTO vendors (vendor_id, vendor_name, vendor_type, scraper_url, sync_frequency, auto_remove_after_days, grace_period_days)
VALUES ('lambert', 'Lambert Auto', 'scraper', 'https://automobile-lambert.com', 'daily', 7, 3);

INSERT OR IGNORE INTO vendors (vendor_id, vendor_name, vendor_type, sync_frequency, auto_remove_after_days, grace_period_days)
VALUES ('internal', 'Internal Inventory', 'manual', 'manual', 0, 0);
