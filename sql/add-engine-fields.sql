-- Add engineSize and cylinders columns to vehicles table
-- These fields store engine specifications that some vendors provide

-- Add engineSize column (e.g., "2.4L", "3.6L")
ALTER TABLE vehicles ADD COLUMN engineSize TEXT;

-- Add cylinders column (e.g., 4, 6, 8)
ALTER TABLE vehicles ADD COLUMN cylinders INTEGER;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicles_engineSize ON vehicles(engineSize);
CREATE INDEX IF NOT EXISTS idx_vehicles_cylinders ON vehicles(cylinders);
