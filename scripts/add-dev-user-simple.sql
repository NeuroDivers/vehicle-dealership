-- =====================================
-- SIMPLE DEV USER SETUP (Using Admin Role)
-- =====================================
-- This creates your dev user with admin role (highest available in current schema)

-- Delete existing user if exists
DELETE FROM staff WHERE email = 'nick@neurodivers.ca';

-- Insert the dev user with admin role
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
  'dev-' || lower(hex(randomblob(8))),
  'nick@neurodivers.ca',
  'Nick (Developer)',
  '$2b$12$.dIWZ2vytoBbA/RtKFepW.XUlMBx3MfqVOQm.zTPV5ng5SWxnYjdC',
  'admin',  -- Using admin role since dev is not in the constraint
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
-- Role: admin (Full Access)
-- =====================================
-- Note: The system code recognizes nick@neurodivers.ca
-- as a developer regardless of the role in database
