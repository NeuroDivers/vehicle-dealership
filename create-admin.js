// Script to create admin user with hashed password
// Run this locally to generate the hash, then insert into D1

const bcrypt = require('bcryptjs');

async function createAdminHash() {
  const password = 'admin123'; // Change this in production!
  const hash = await bcrypt.hash(password, 10);
  
  console.log('Password hash for "admin123":');
  console.log(hash);
  
  console.log('\nSQL command to insert admin user:');
  console.log(`
INSERT OR REPLACE INTO staff (
  id,
  email,
  name,
  password_hash,
  role,
  is_active
) VALUES (
  'admin-001',
  'admin@dealership.com',
  'Admin User',
  '${hash}',
  'admin',
  1
);
  `);
}

createAdminHash();
