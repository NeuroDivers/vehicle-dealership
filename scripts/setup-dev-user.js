// Setup script to create a dev user in the SQLite database
// Run with: node scripts/setup-dev-user.js

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// Path to the SQLite database
const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');

async function setupDevUser() {
  try {
    // Open database connection
    const db = new Database(dbPath);
    
    // Create Staff table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS Staff (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT,
        role TEXT DEFAULT 'staff',
        position TEXT,
        phone TEXT,
        image TEXT,
        isActive BOOLEAN DEFAULT 1,
        lastLogin DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Hash the password
    const password = 'Dev@2024!';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM Staff WHERE email = ?').get('nick@neurodivers.ca');

    if (existingUser) {
      // Update existing user
      const updateStmt = db.prepare(`
        UPDATE Staff 
        SET name = ?, 
            password = ?, 
            role = ?, 
            position = ?,
            isActive = 1,
            updatedAt = CURRENT_TIMESTAMP
        WHERE email = ?
      `);
      
      updateStmt.run(
        'Nick (Developer)',
        hashedPassword,
        'dev',
        'System Developer',
        'nick@neurodivers.ca'
      );
      
      console.log('✅ Dev user updated successfully!');
    } else {
      // Create new user
      const insertStmt = db.prepare(`
        INSERT INTO Staff (email, name, password, role, position, isActive)
        VALUES (?, ?, ?, ?, ?, 1)
      `);
      
      insertStmt.run(
        'nick@neurodivers.ca',
        'Nick (Developer)',
        hashedPassword,
        'dev',
        'System Developer'
      );
      
      console.log('✅ Dev user created successfully!');
    }

    console.log('');
    console.log('=====================================');
    console.log('🔐 DEV USER CREDENTIALS');
    console.log('=====================================');
    console.log('Email: nick@neurodivers.ca');
    console.log('Password: Dev@2024!');
    console.log('Role: Developer (Full System Access)');
    console.log('=====================================');
    console.log('');
    console.log('🚀 Access Levels:');
    console.log('✓ Full admin dashboard access');
    console.log('✓ AI features configuration');
    console.log('✓ Social media automation control');
    console.log('✓ API key management (view & modify)');
    console.log('✓ User permission management');
    console.log('✓ Override admin restrictions');
    console.log('✓ Analytics and reporting');
    console.log('✓ System settings control');
    console.log('');
    console.log('📍 Login URL: http://localhost:3000/admin');
    console.log('');
    console.log('⚠️  Security Reminder:');
    console.log('- Change the password after first login');
    console.log('- This account has unrestricted access');
    console.log('- Keep credentials secure');

    // Close database
    db.close();

  } catch (error) {
    console.error('❌ Error setting up dev user:', error);
    console.error('');
    console.error('Make sure you have run:');
    console.error('1. npm install');
    console.error('2. npx prisma generate');
    console.error('3. npx prisma db push');
    process.exit(1);
  }
}

// Run the setup
setupDevUser();
