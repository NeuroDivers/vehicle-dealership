-- =====================================
-- CLOUDFLARE D1 DEV USER SETUP
-- =====================================
-- This SQL adds a dev user to your Cloudflare D1 database

-- First, we need to modify the role constraint to allow 'dev' role
-- Since SQLite doesn't support ALTER COLUMN directly, we need to recreate the table

-- Step 1: Create a new temporary table with updated constraint
CREATE TABLE IF NOT EXISTS staff_new (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK(role IN ('dev', 'admin', 'manager', 'sales', 'staff')),
  phone TEXT,
  is_active INTEGER DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Copy existing data to new table
INSERT INTO staff_new SELECT * FROM staff;

-- Step 3: Drop the old table
DROP TABLE staff;

-- Step 4: Rename new table to staff
ALTER TABLE staff_new RENAME TO staff;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON staff(is_active);

-- Step 6: Delete existing dev user if exists
DELETE FROM staff WHERE email = 'nick@neurodivers.ca';

-- Step 7: Insert the dev user with proper password hash
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
  'dev',
  NULL,
  1,
  datetime('now'),
  datetime('now')
);

-- Step 8: Verify the user was created
SELECT id, email, name, role, is_active FROM staff WHERE email = 'nick@neurodivers.ca';

-- =====================================
-- CREDENTIALS:
-- Email: nick@neurodivers.ca
-- Password: Dev@2024!
-- Role: dev (Full System Access)
-- =====================================
