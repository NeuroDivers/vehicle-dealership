-- =====================================
-- ADD DEV USER FOR CLOUDFLARE WORKER
-- =====================================
-- This creates the dev user with a simple password for initial setup
-- You should change this password after first login

-- Delete existing user if exists
DELETE FROM staff WHERE email = 'nick@neurodivers.ca';

-- Insert the user with simple password for initial setup
-- The worker will update this to the new crypto format on first login
INSERT INTO staff (
  id,
  email,
  name,
  password_hash,
  role,
  phone,
  is_active,
  last_login,
  created_at,
  updated_at
) VALUES (
  'dev-' || lower(hex(randomblob(8))),
  'nick@neurodivers.ca',
  'Nick',
  'Dev@2024!',  -- Plain text password - worker will hash on first login
  'admin',      -- Appears as admin (hidden dev privileges via email)
  NULL,
  1,
  NULL,
  datetime('now'),
  datetime('now')
);

-- Verify the user was created
SELECT id, email, name, role, is_active FROM staff WHERE email = 'nick@neurodivers.ca';

-- =====================================
-- IMPORTANT NOTES:
-- =====================================
-- 1. This uses a plain text password initially
-- 2. The worker will automatically hash it on first login
-- 3. After first login, the password will be secure
-- 
-- CREDENTIALS:
-- Email: nick@neurodivers.ca
-- Password: Dev@2024!
-- 
-- CHANGE THIS PASSWORD AFTER FIRST LOGIN!
-- =====================================
