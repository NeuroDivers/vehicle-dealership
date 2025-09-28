-- Insert vehicles from the original database
-- These are the vehicles from vehicle-dealership-db that need to be in vehicle-dealership-analytics

INSERT INTO vehicles (id, make, model, year, price, odometer, bodyType, color, description, images, isSold, createdAt, updatedAt) VALUES
(1, 'Toyota', 'Camry', 2023, 35000, 15000, 'Sedan', 'Silver', 'Excellent condition, one owner', '[]', 1, '2025-09-28 04:11:24', '2025-09-28 04:11:24'),
(2, 'Honda', 'CR-V', 2022, 32000, 25000, 'SUV', 'Black', 'Well maintained, all service records', '[]', 0, '2025-09-28 04:11:24', '2025-09-28 04:11:24'),
(3, 'Ford', 'F-150', 2021, 45000, 35000, 'Truck', 'Blue', 'Heavy duty, perfect for work', '[]', 0, '2025-09-28 04:11:24', '2025-09-28 04:11:24'),
(4, 'Tesla', 'Model 3', 2023, 50000, 10000, 'Sedan', 'White', 'Like new, autopilot enabled', '[]', 1, '2025-09-28 04:11:24', '2025-09-28 04:11:24'),
(5, 'Chevrolet', 'Silverado', 2022, 48000, 20000, 'Truck', 'Red', 'Crew cab, leather interior', '[]', 0, '2025-09-28 04:11:24', '2025-09-28 04:11:24'),
(6, 'BMW', 'X5', 2021, 55000, 30000, 'SUV', 'Gray', 'Luxury SUV, fully loaded', '[]', 0, '2025-09-28 04:11:24', '2025-09-28 04:11:24'),
('e971331a-97d7-4ff4-85c4-a6427302f6f9', 'Toyota', 'Camry', 2025, 0, 24560, 'Sedan', 'Blue', NULL, '["https://vehicle-dealership-api.nick-damato0011527.workers.dev/api/images/vehicles/1759041046582-posru8.avif"]', 0, '2025-09-28 06:31:16', '2025-09-28 06:31:16')
ON CONFLICT(id) DO UPDATE SET
  make = excluded.make,
  model = excluded.model,
  year = excluded.year,
  price = excluded.price,
  odometer = excluded.odometer,
  bodyType = excluded.bodyType,
  color = excluded.color,
  description = excluded.description,
  images = excluded.images,
  isSold = excluded.isSold,
  updatedAt = excluded.updatedAt;
