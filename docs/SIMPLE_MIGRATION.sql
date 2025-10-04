-- Simple step-by-step migration
-- Run this if the full migration fails

-- Step 1: Add sold_date if it doesn't exist (safe to run multiple times)
ALTER TABLE vehicles ADD COLUMN sold_date TEXT;

-- Step 2: Copy soldDate to sold_date where sold_date is null
UPDATE vehicles SET sold_date = soldDate WHERE sold_date IS NULL AND soldDate IS NOT NULL;

-- Step 3: Add updated_at if it doesn't exist
ALTER TABLE vehicles ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;

-- Step 4: Copy updatedAt to updated_at where needed
UPDATE vehicles SET updated_at = updatedAt WHERE updated_at IS NULL AND updatedAt IS NOT NULL;

-- Step 5: Standardize created_at (copy from createdAt if needed)
UPDATE vehicles SET created_at = createdAt WHERE (created_at IS NULL OR created_at = '') AND createdAt IS NOT NULL;
