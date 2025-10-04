-- Working Migration Script for D1
-- This version only migrates fields that exist

-- Step 1: Migrate createdAt to created_at (ALREADY DONE - safe to run again)
UPDATE vehicles 
SET created_at = createdAt 
WHERE (created_at IS NULL OR created_at = '') AND createdAt IS NOT NULL;

-- Step 2: Migrate soldDate to sold_date (if any sold vehicles exist)
UPDATE vehicles 
SET sold_date = soldDate 
WHERE (sold_date IS NULL OR sold_date = '') AND soldDate IS NOT NULL;

-- Step 3: Set updatedAt to current time for any records missing it
UPDATE vehicles 
SET updatedAt = CURRENT_TIMESTAMP 
WHERE updatedAt IS NULL;

-- Verification queries
SELECT 'Migration Complete!' as status;
SELECT COUNT(*) as total_vehicles FROM vehicles;
SELECT COUNT(*) as vehicles_with_created_at FROM vehicles WHERE created_at IS NOT NULL;
SELECT COUNT(*) as sold_vehicles FROM vehicles WHERE isSold = 1;
