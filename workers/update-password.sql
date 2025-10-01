-- Update admin password with bcrypt hash
UPDATE staff SET password_hash = '$2b$10$NA7gJ1q8BWLerQlQUBUV6Oqno.gzqeDwgDrObwuNcYnLB9V3QEheS' WHERE email = 'admin@dealership.com';
