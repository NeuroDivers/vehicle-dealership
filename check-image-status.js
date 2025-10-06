/**
 * Check the current state of SLT vehicle images
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function checkImages() {
  console.log('🔍 Checking SLT Autos vehicle image status...\n');
  
  try {
    // Check vehicles with Cloudflare IDs
    const cfQuery = `SELECT COUNT(*) as count FROM vehicles WHERE vendor_id='sltautos' AND images NOT LIKE '%http%' AND images != '[]'`;
    const { stdout: cfOut } = await execPromise(
      `wrangler d1 execute vehicle-dealership-analytics --command "${cfQuery}" --remote`,
      { cwd: __dirname }
    );
    
    // Check vehicles with vendor URLs  
    const vendorQuery = `SELECT COUNT(*) as count FROM vehicles WHERE vendor_id='sltautos' AND images LIKE '%sltautos.com%'`;
    const { stdout: vendorOut } = await execPromise(
      `wrangler d1 execute vehicle-dealership-analytics --command "${vendorQuery}" --remote`,
      { cwd: __dirname }
    );
    
    // Check total SLT vehicles
    const totalQuery = `SELECT COUNT(*) as count FROM vehicles WHERE vendor_id='sltautos'`;
    const { stdout: totalOut } = await execPromise(
      `wrangler d1 execute vehicle-dealership-analytics --command "${totalQuery}" --remote`,
      { cwd: __dirname }
    );
    
    console.log('📊 Results:');
    console.log(cfOut);
    console.log(vendorOut);
    console.log(totalOut);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkImages();
