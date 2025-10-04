-- Database Schema Cleanup Migration
-- Fixes duplicate and inconsistent field names in vehicles table

-- Step 1: Create a new clean vehicles table with proper schema
CREATE TABLE vehicles_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Basic Vehicle Info
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  price REAL NOT NULL,
  odometer INTEGER NOT NULL,
  
  -- Vehicle Details
  bodyType TEXT NOT NULL,
  color TEXT NOT NULL,
  fuelType TEXT,
  transmission TEXT,
  drivetrain TEXT,
  engineSize TEXT,
  cylinders INTEGER,
  
  -- Identifiers
  stockNumber TEXT,
  vin TEXT,
  
  -- Content
  description TEXT,
  images TEXT,
  
  -- Status Fields
  isSold INTEGER DEFAULT 0,
  sold_date TEXT,  -- Standardized: snake_case, when vehicle was sold
  is_published INTEGER DEFAULT 1,
  
  -- Vendor/Source Tracking
  vendor_id VARCHAR(50) DEFAULT 'internal',
  vendor_name VARCHAR(100) DEFAULT 'Internal Inventory',
  vendor_stock_number VARCHAR(100),
  vendor_status VARCHAR(50) DEFAULT 'active',
  last_seen_from_vendor TIMESTAMP,
  sync_status VARCHAR(50) DEFAULT 'synced',
  
  -- Timestamps (Standardized to snake_case)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Copy data from old table to new table, handling duplicates
INSERT INTO vehicles_new (
  id, make, model, year, price, odometer,
  bodyType, color, fuelType, transmission, drivetrain, engineSize, cylinders,
  stockNumber, vin, description, images,
  isSold, sold_date, is_published,
  vendor_id, vendor_name, vendor_stock_number, vendor_status, 
  last_seen_from_vendor, sync_status,
  created_at, updated_at
)
SELECT 
  id, make, model, year, price, odometer,
  bodyType, color, fuelType, transmission, drivetrain, engineSize, cylinders,
  stockNumber, vin, description, images,
  isSold, 
  COALESCE(soldDate, sold_date) as sold_date,  -- Use soldDate if exists, fallback to sold_date
  is_published,
  vendor_id, vendor_name, vendor_stock_number, vendor_status,
  last_seen_from_vendor, sync_status,
  COALESCE(created_at, createdAt, CURRENT_TIMESTAMP) as created_at,  -- Prefer created_at, fallback to createdAt
  COALESCE(updatedAt, updated_at, CURRENT_TIMESTAMP) as updated_at   -- Prefer updatedAt, fallback to updated_at
FROM vehicles;

-- Step 3: Drop old table
DROP TABLE vehicles;

-- Step 4: Rename new table to vehicles
ALTER TABLE vehicles_new RENAME TO vehicles;

-- Step 5: Create indexes for performance
CREATE INDEX idx_vehicles_make ON vehicles(make);
CREATE INDEX idx_vehicles_model ON vehicles(model);
CREATE INDEX idx_vehicles_year ON vehicles(year);
CREATE INDEX idx_vehicles_price ON vehicles(price);
CREATE INDEX idx_vehicles_isSold ON vehicles(isSold);
CREATE INDEX idx_vehicles_vendor_id ON vehicles(vendor_id);
CREATE INDEX idx_vehicles_created_at ON vehicles(created_at);
CREATE INDEX idx_vehicles_sold_date ON vehicles(sold_date);

-- Step 6: Verify the migration
SELECT 'Migration Complete - New Schema:' as status;
PRAGMA table_info(vehicles);

-- Step 7: Show record count
SELECT COUNT(*) as total_vehicles FROM vehicles;
SELECT COUNT(*) as sold_vehicles FROM vehicles WHERE isSold = 1;
