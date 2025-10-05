-- Migration: Add listing_status column to vehicles table
-- Date: 2025-10-05
-- Purpose: Support Draft, Published, Unlisted, and Sold vehicle statuses

-- Step 1: Add the new column with a default value
ALTER TABLE vehicles ADD COLUMN listing_status TEXT DEFAULT 'published';

-- Step 2: Migrate existing data based on isSold field
-- Sold vehicles (isSold = 1) → 'sold'
UPDATE vehicles 
SET listing_status = 'sold' 
WHERE isSold = 1;

-- Available vehicles (isSold = 0 or NULL) → 'published'
UPDATE vehicles 
SET listing_status = 'published' 
WHERE isSold = 0 OR isSold IS NULL;

-- Unlisted vehicles (vendor_status = 'unlisted') → 'unlisted'
UPDATE vehicles 
SET listing_status = 'unlisted' 
WHERE vendor_status = 'unlisted' AND isSold = 0;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_listing_status ON vehicles(listing_status);

-- Step 4: Add constraint (SQLite supports CHECK constraints in newer versions)
-- Note: This will ensure only valid statuses can be inserted
-- Valid statuses: 'draft', 'published', 'unlisted', 'sold'
-- SQLite doesn't support ALTER TABLE ADD CONSTRAINT, so we note it here for future reference

-- Verification queries:
-- SELECT listing_status, COUNT(*) FROM vehicles GROUP BY listing_status;
-- SELECT * FROM vehicles WHERE listing_status = 'draft' LIMIT 5;
