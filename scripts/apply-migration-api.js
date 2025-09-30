/**
 * Apply D1 Migration using Cloudflare API
 * This script applies the vendor tracking migration directly via API
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ACCOUNT_ID = '777f8cabbe88e62f6ade4fb16ad852a7';
const DATABASE_ID = 'd70754b6-fec7-483a-b103-c1c78916c497';
const DATABASE_NAME = 'vehicle-dealership-analytics';

// You'll need to set your Cloudflare API token as an environment variable
// Get it from: Dashboard > My Profile > API Tokens
const API_TOKEN = process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;

if (!API_TOKEN) {
  console.error('❌ Error: Please set your Cloudflare API token');
  console.error('Set it with: set CLOUDFLARE_API_TOKEN=your-token-here');
  console.error('Get token from: https://dash.cloudflare.com/profile/api-tokens');
  process.exit(1);
}

// Read the migration file
const migrationPath = path.join(__dirname, '..', 'migrations', '002_add_vendor_tracking_fixed.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('🚀 Applying Vendor Tracking Migration via Cloudflare API');
console.log('========================================================');
console.log(`Database: ${DATABASE_NAME} (${DATABASE_ID})`);
console.log('');

// Function to execute SQL via API
async function executeSQLViaAPI() {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: migrationSQL
        })
      }
    );

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Migration applied successfully!');
      console.log('');
      console.log('📊 What was added:');
      console.log('  ✓ Vendor tracking fields to vehicles table');
      console.log('  ✓ vendors table for vendor management');
      console.log('  ✓ vendor_sync_logs table for history');
      console.log('  ✓ vendor_rules table for configuration');
      console.log('  ✓ Default vendors (Lambert, Internal)');
      console.log('');
      console.log('🎉 Your database is ready for multi-vendor inventory!');
    } else {
      console.error('❌ Migration failed:', result.errors);
      if (result.errors && result.errors[0]) {
        console.error('Error details:', result.errors[0].message);
      }
    }
  } catch (error) {
    console.error('❌ Failed to execute migration:', error.message);
    console.error('');
    console.error('Try applying manually through Cloudflare Dashboard:');
    console.error('1. Go to: https://dash.cloudflare.com');
    console.error('2. Navigate to Workers & Pages → D1');
    console.error('3. Click on vehicle-dealership-analytics');
    console.error('4. Use the Console tab to run the SQL');
  }
}

// Run the migration
executeSQLViaAPI();
