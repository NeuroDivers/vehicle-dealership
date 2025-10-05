-- Image Processing Jobs Table
-- Tracks background image upload jobs for progress monitoring

CREATE TABLE IF NOT EXISTS image_processing_jobs (
  id TEXT PRIMARY KEY,
  vendor_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  total_vehicles INTEGER NOT NULL DEFAULT 0,
  vehicles_processed INTEGER NOT NULL DEFAULT 0,
  images_uploaded INTEGER NOT NULL DEFAULT 0,
  images_failed INTEGER NOT NULL DEFAULT 0,
  current_vehicle TEXT,
  error_message TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_jobs_vendor ON image_processing_jobs(vendor_name);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON image_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON image_processing_jobs(created_at DESC);
