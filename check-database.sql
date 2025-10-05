-- Check if there are any image processing jobs
SELECT 
  id,
  vendor_name,
  status,
  total_vehicles,
  vehicles_processed,
  images_uploaded,
  images_failed,
  created_at,
  started_at,
  completed_at
FROM image_processing_jobs
ORDER BY created_at DESC
LIMIT 10;

-- Check vehicles with vendor URLs that need processing
SELECT 
  id,
  vin,
  make,
  model,
  year,
  images,
  LENGTH(images) as images_length,
  CASE 
    WHEN images LIKE '%http%' THEN 'Has vendor URLs'
    WHEN images LIKE '%imagedelivery%' THEN 'Has Cloudflare URLs'
    ELSE 'Has IDs or empty'
  END as image_type
FROM vehicles
WHERE images IS NOT NULL 
  AND images != '[]'
LIMIT 20;

-- Count vehicles by image type
SELECT 
  CASE 
    WHEN images LIKE '%cdn.drivegood.com%' THEN 'Vendor URLs (needs processing)'
    WHEN images LIKE '%imagedelivery.net%' THEN 'Cloudflare URLs (processed)'
    WHEN images LIKE '%http%' THEN 'Other URLs'
    ELSE 'IDs or empty'
  END as image_type,
  COUNT(*) as count
FROM vehicles
WHERE images IS NOT NULL AND images != '[]'
GROUP BY image_type;

-- Check recent scraper runs
SELECT 
  id,
  timestamp,
  duration,
  stats
FROM lambert_scraper_runs
ORDER BY timestamp DESC
LIMIT 5;
