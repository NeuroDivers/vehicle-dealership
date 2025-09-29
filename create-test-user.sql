-- Create a test user with a simple password for debugging
-- This uses a known bcrypt hash for 'test123'
INSERT OR REPLACE INTO staff (
  id,
  email,
  name,
  password_hash,
  role,
  is_active
) VALUES (
  'test-001',
  'test@dealership.com',
  'Test User',
  '$2a$10$N9qo8uLOickgx2ZMRZoMye/0lMiNvmK3qX9LN9udKvDvOtjRfKz2y', -- This is 'test123'
  'admin',
  1
);
