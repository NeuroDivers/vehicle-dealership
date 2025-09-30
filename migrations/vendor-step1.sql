-- Step 1: Add vendor columns to vehicles table
ALTER TABLE vehicles ADD COLUMN vendor_id VARCHAR(50) DEFAULT 'internal';
ALTER TABLE vehicles ADD COLUMN vendor_name VARCHAR(100) DEFAULT 'Internal Inventory';
