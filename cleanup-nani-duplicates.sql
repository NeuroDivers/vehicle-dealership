-- Cleanup Nani Auto Duplicate Vehicles
-- This removes the "Internal Inventory" duplicates created before vendor tracking was fixed

-- Step 1: See how many duplicates we have
SELECT 
  vin,
  COUNT(*) as count,
  GROUP_CONCAT(id) as ids,
  GROUP_CONCAT(vendor_name) as vendors
FROM vehicles
WHERE vin IN (
  SELECT vin FROM vehicles 
  WHERE vin IS NOT NULL AND vin != '' 
  GROUP BY vin 
  HAVING COUNT(*) > 1
)
GROUP BY vin;

-- Step 2: Delete the "Internal Inventory" duplicates where we have a NaniAuto version
-- (Keep the NaniAuto version, delete the Internal Inventory version)
DELETE FROM vehicles
WHERE id IN (
  SELECT v1.id
  FROM vehicles v1
  INNER JOIN vehicles v2 ON v1.vin = v2.vin AND v1.id != v2.id
  WHERE v1.vendor_id = 'internal'
    AND v2.vendor_id = 'naniauto'
    AND v1.vin IS NOT NULL
    AND v1.vin != ''
);

-- Step 3: Verify the cleanup
SELECT 
  vin,
  COUNT(*) as count,
  GROUP_CONCAT(vendor_name) as vendors
FROM vehicles
WHERE vin IN (
  SELECT vin FROM vehicles 
  WHERE vin IS NOT NULL AND vin != '' 
  GROUP BY vin 
  HAVING COUNT(*) > 1
)
GROUP BY vin;
