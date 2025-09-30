-- Create Vehicle table (capital V) for main inventory with partner fields
CREATE TABLE IF NOT EXISTS Vehicle (
    id TEXT PRIMARY KEY,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    price REAL,
    odometer INTEGER,
    bodyType TEXT,
    color TEXT,
    fuelType TEXT DEFAULT 'gasoline',
    description TEXT,
    images TEXT,
    isSold INTEGER DEFAULT 0,
    source TEXT DEFAULT 'manual',
    partnerName TEXT,
    partnerUrl TEXT,
    partnerVin TEXT,
    partnerStock TEXT,
    lastSynced TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicle_partner_vin ON Vehicle(partnerVin);
CREATE INDEX IF NOT EXISTS idx_vehicle_partner_url ON Vehicle(partnerUrl);
CREATE INDEX IF NOT EXISTS idx_vehicle_source ON Vehicle(source);
CREATE INDEX IF NOT EXISTS idx_vehicle_is_sold ON Vehicle(isSold);
