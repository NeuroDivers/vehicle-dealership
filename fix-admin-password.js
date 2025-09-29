// Script to generate a proper bcrypt hash for admin password
const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('New password hash for admin123:');
  console.log(hash);
  
  // Test that it works
  const isValid = await bcrypt.compare('admin123', hash);
  console.log('\nVerification test:', isValid ? 'PASSED' : 'FAILED');
  
  console.log('\nSQL command to update admin password:');
  console.log(`UPDATE staff SET password_hash = '${hash}' WHERE email = 'admin@dealership.com';`);
}

generateHash();
