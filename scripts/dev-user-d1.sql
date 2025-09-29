
-- =====================================
-- CLOUDFLARE D1 DEV USER SETUP
-- =====================================
-- Run these commands in your Cloudflare D1 console
-- or via Wrangler: npx wrangler d1 execute vehicle-dealership-db --command="<SQL>"

-- 1. First, ensure the staff table exists
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT,
  role TEXT DEFAULT 'staff',
  position TEXT,
  phone TEXT,
  image TEXT,
  is_active INTEGER DEFAULT 1,
  last_login TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. Delete existing dev user if exists
DELETE FROM staff WHERE email = 'nick@neurodivers.ca';

-- 3. Insert the dev user with hashed password
INSERT INTO staff (
  email,
  name,
  password_hash,
  role,
  position,
  is_active,
  created_at,
  updated_at
) VALUES (
  'nick@neurodivers.ca',
  'Nick (Developer)',
  '$2b$12$.dIWZ2vytoBbA/RtKFepW.XUlMBx3MfqVOQm.zTPV5ng5SWxnYjdC',
  'dev',
  'System Developer',
  1,
  datetime('now'),
  datetime('now')
);

-- 4. Verify the user was created
SELECT email, name, role, position, is_active FROM staff WHERE email = 'nick@neurodivers.ca';
