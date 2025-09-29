-- SQL script to create a dev user in Cloudflare D1 database
-- Run this in your Cloudflare D1 console or via Wrangler

-- First, ensure the staff table exists with the correct structure
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

-- Delete existing dev user if exists
DELETE FROM staff WHERE email = 'nick@neurodivers.ca';

-- Insert the dev user
-- Password: Dev@2024! (bcrypt hash with 12 rounds)
-- This hash was generated from bcrypt.hash('Dev@2024!', 12)
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
  '$2a$12$YourHashHere', -- This needs to be generated
  'dev',
  'System Developer',
  1,
  datetime('now'),
  datetime('now')
);

-- Verify the user was created
SELECT email, name, role, position, is_active FROM staff WHERE email = 'nick@neurodivers.ca';
