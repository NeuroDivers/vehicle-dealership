-- Cleanup Script for Corrupted Images Field
-- Run this in Cloudflare D1 dashboard to reset corrupted image data

-- First, check which vehicles have corrupted images (length > 1000 chars)
SELECT id, make, model, year, LENGTH(images) as img_length 
FROM vehicles 
WHERE LENGTH(images) > 1000
ORDER BY img_length DESC;

-- Reset corrupted images to empty JSON array
UPDATE vehicles 
SET images = '[]' 
WHERE LENGTH(images) > 1000;

-- Verify the cleanup
SELECT id, make, model, year, images 
FROM vehicles 
WHERE images = '[]';
