-- Migration: Add 'dev' role to staff table
-- Date: 2025-01-04
-- Description: Updates the role CHECK constraint to include 'dev' role for developer access

-- SQLite doesn't support ALTER TABLE to modify CHECK constraints
-- We need to recreate the table with the new constraint

-- Step 1: Create new staff table with updated role constraint
CREATE TABLE staff_new (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK(role IN ('admin', 'manager', 'sales', 'staff', 'dev')),
  phone TEXT,
  is_active INTEGER DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Copy all existing data
INSERT INTO staff_new 
SELECT * FROM staff;

-- Step 3: Drop old table
DROP TABLE staff;

-- Step 4: Rename new table to staff
ALTER TABLE staff_new RENAME TO staff;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON staff(is_active);

-- Step 6: Now you can update your user to dev role
-- UPDATE staff SET role = 'dev' WHERE email = 'nick@neurodivers.ca';
