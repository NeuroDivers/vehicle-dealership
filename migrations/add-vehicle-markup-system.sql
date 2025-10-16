-- Migration: Add vehicle price markup system
-- Supports vendor-level default markup and vehicle-level overrides

-- Add markup fields to vehicles table
ALTER TABLE vehicles ADD COLUMN price_markup_type TEXT DEFAULT 'none'; -- 'none', 'amount', 'percentage', 'vendor_default'
ALTER TABLE vehicles ADD COLUMN price_markup_value REAL DEFAULT 0; -- Dollar amount or percentage value
ALTER TABLE vehicles ADD COLUMN display_price REAL; -- Calculated price with markup (for performance)

-- Create vendor_settings table for vendor-specific configurations
CREATE TABLE IF NOT EXISTS vendor_settings (
  vendor_id TEXT PRIMARY KEY,
  vendor_name TEXT NOT NULL,
  markup_type TEXT DEFAULT 'none', -- 'none', 'amount', 'percentage'
  markup_value REAL DEFAULT 0, -- Dollar amount or percentage value
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default vendor settings
INSERT OR IGNORE INTO vendor_settings (vendor_id, vendor_name, markup_type, markup_value) VALUES
  ('lambert', 'Lambert Auto', 'none', 0),
  ('naniauto', 'NaniAuto', 'none', 0),
  ('sltautos', 'SLT Autos', 'none', 0),
  ('internal', 'Internal Inventory', 'none', 0);

-- Create index for faster price queries
CREATE INDEX IF NOT EXISTS idx_vehicles_display_price ON vehicles(display_price);
CREATE INDEX IF NOT EXISTS idx_vehicles_vendor_id ON vehicles(vendor_id);

-- Create trigger to automatically update display_price when price or markup changes
-- Note: SQLite triggers are basic, so we'll calculate display_price in application code
