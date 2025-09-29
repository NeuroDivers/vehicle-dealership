// Script to generate SQL command for creating dev user in Cloudflare D1
// Run with: node scripts/generate-dev-user-sql.js

const bcrypt = require('bcryptjs');

async function generateDevUserSQL() {
  try {
    // Password for the dev user
    const password = 'Dev@2024!';
    
    // Generate bcrypt hash
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Generate the SQL commands
    const sql = `
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
  '${hashedPassword}',
  'dev',
  'System Developer',
  1,
  datetime('now'),
  datetime('now')
);

-- 4. Verify the user was created
SELECT email, name, role, position, is_active FROM staff WHERE email = 'nick@neurodivers.ca';
`;

    console.log(sql);
    console.log('\n=====================================');
    console.log('🔐 DEV USER CREDENTIALS');
    console.log('=====================================');
    console.log('Email: nick@neurodivers.ca');
    console.log('Password: Dev@2024!');
    console.log('Role: Developer (Full System Access)');
    console.log('=====================================\n');
    
    console.log('📋 HOW TO APPLY:');
    console.log('=====================================');
    console.log('Option 1: Cloudflare Dashboard');
    console.log('1. Go to Cloudflare Dashboard > Workers & Pages > D1');
    console.log('2. Select your "vehicle-dealership-db" database');
    console.log('3. Go to "Console" tab');
    console.log('4. Copy and paste the SQL commands above');
    console.log('5. Click "Execute"\n');
    
    console.log('Option 2: Wrangler CLI');
    console.log('Save the SQL to a file and run:');
    console.log('npx wrangler d1 execute vehicle-dealership-db --file=./scripts/dev-user.sql\n');
    
    console.log('Option 3: Direct Command');
    console.log('Copy the INSERT statement and run:');
    console.log('npx wrangler d1 execute vehicle-dealership-db --command="<INSERT_STATEMENT>"\n');
    
    console.log('=====================================');
    console.log('🚀 FEATURES AVAILABLE TO DEV USER:');
    console.log('=====================================');
    console.log('✓ Full admin dashboard access');
    console.log('✓ AI features configuration');
    console.log('✓ Social media automation control');
    console.log('✓ API key management (view & modify)');
    console.log('✓ User permission management');
    console.log('✓ Override admin restrictions');
    console.log('✓ Analytics and reporting');
    console.log('✓ System settings control');
    console.log('✓ Developer-only debug tools\n');
    
    console.log('⚠️  SECURITY NOTES:');
    console.log('- Change the password after first login');
    console.log('- This account has unrestricted access');
    console.log('- Keep credentials secure');
    console.log('- Password hash is one-way encrypted');

    // Also save to a file for convenience
    const fs = require('fs');
    fs.writeFileSync('./scripts/dev-user-d1.sql', sql);
    console.log('\n✅ SQL saved to: scripts/dev-user-d1.sql');

  } catch (error) {
    console.error('❌ Error generating SQL:', error);
    process.exit(1);
  }
}

// Run the generator
generateDevUserSQL();
