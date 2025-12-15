-- Add feed_identifier column to vehicles table
-- This column stores a unique identifier from the feed source for better matching

ALTER TABLE vehicles ADD COLUMN feed_identifier TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_feed_identifier ON vehicles(feed_identifier);

-- Backfill existing vehicles with feed_identifier based on VIN or make/model/year
-- VIN-based identifier (if VIN exists)
UPDATE vehicles 
SET feed_identifier = 'vin:' || vin 
WHERE vin IS NOT NULL AND vin != '' AND feed_identifier IS NULL;

-- Make/Model/Year-based identifier (fallback for vehicles without VIN)
UPDATE vehicles 
SET feed_identifier = 'mmy:' || COALESCE(vendor_id, 'unknown') || ':' || make || ':' || model || ':' || year
WHERE (vin IS NULL OR vin = '') AND feed_identifier IS NULL;
