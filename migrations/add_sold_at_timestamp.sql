-- Migration: Add sold_at timestamp for graceful image deletion
-- Date: 2025-01-05
-- Purpose: Track when vehicles are marked as sold for image cleanup

-- Add sold_at column to track when vehicle was marked as sold
ALTER TABLE vehicles ADD COLUMN sold_at TEXT;

-- Update existing sold vehicles to have sold_at = updated_at or created_at
UPDATE vehicles 
SET sold_at = datetime('now') 
WHERE isSold = 1 AND sold_at IS NULL;

-- Create index for image cleanup queries
CREATE INDEX IF NOT EXISTS idx_vehicles_sold_at ON vehicles(sold_at);

-- Verification query:
-- SELECT id, make, model, year, isSold, sold_at FROM vehicles WHERE isSold = 1;
