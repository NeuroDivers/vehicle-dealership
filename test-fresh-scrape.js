/**
 * Test fresh scrape from scratch
 * This will clear test vehicles and run a fresh Lambert scrape
 */

async function testFreshScrape() {
  console.log('🧹 Testing Fresh Scrape Flow\n');
  
  // Step 1: Clear existing Lambert vehicles (optional - comment out to keep)
  console.log('1️⃣ Clearing existing Lambert vehicles...');
  console.log('   ⚠️  SKIPPING - Remove comment below to actually clear\n');
  
  // Uncomment these lines to actually delete:
  // const { execSync } = require('child_process');
  // execSync('wrangler d1 execute vehicle-dealership-analytics --command "DELETE FROM vehicles WHERE vendor_id = \'lambert\'" --remote', { stdio: 'inherit' });
  
  // Step 2: Run fresh scrape
  console.log('2️⃣ Running fresh Lambert scrape...');
  const startTime = Date.now();
  
  try {
    const response = await fetch(
      'https://lambert-scraper.nick-damato0011527.workers.dev/api/scrape',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log(`\n✅ Scrape completed in ${duration}s\n`);
      console.log('📊 Results:');
      console.log(`   Vehicles Found: ${data.count}`);
      console.log(`   New: ${data.stats?.new || 'N/A'}`);
      console.log(`   Updated: ${data.stats?.updated || 'N/A'}`);
      console.log(`   Image Job ID: ${data.imageProcessingJobId || 'NONE'}\n`);
      
      if (data.imageProcessingJobId) {
        console.log('3️⃣ Waiting for image processing...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        console.log('\n4️⃣ Checking job status...');
        const jobResponse = await fetch(
          `https://image-processor.nick-damato0011527.workers.dev/api/jobs/${data.imageProcessingJobId}`
        );
        
        if (jobResponse.ok) {
          const jobData = await jobResponse.json();
          if (jobData.success) {
            console.log('\n✅ Image Processing Results:');
            console.log(`   Status: ${jobData.job.status}`);
            console.log(`   Progress: ${jobData.job.progress}%`);
            console.log(`   Vehicles: ${jobData.job.vehicles_processed}/${jobData.job.total_vehicles}`);
            console.log(`   Images Uploaded: ${jobData.job.images_uploaded}`);
            console.log(`   Images Failed: ${jobData.job.images_failed}\n`);
            
            // Step 3: Verify in database
            console.log('5️⃣ Verifying database...');
            console.log('   Run these commands to check:\n');
            console.log('   # Count vehicles:');
            console.log('   wrangler d1 execute vehicle-dealership-analytics \\');
            console.log('     --command "SELECT COUNT(*) FROM vehicles WHERE vendor_id=\'lambert\'" --remote\n');
            console.log('   # Check images:');
            console.log('   wrangler d1 execute vehicle-dealership-analytics \\');
            console.log('     --command "SELECT COUNT(*) FROM vehicles WHERE images LIKE \'%imagedelivery.net%\'" --remote\n');
            console.log('   # Check for duplicates:');
            console.log('   wrangler d1 execute vehicle-dealership-analytics \\');
            console.log('     --command "SELECT vin, COUNT(*) FROM vehicles WHERE vin!=\'\' GROUP BY vin HAVING COUNT(*)>1" --remote\n');
          }
        }
      }
      
      console.log('✨ Fresh scrape test complete!\n');
      console.log('Expected Results:');
      console.log('✅ ~44 vehicles saved');
      console.log('✅ All with vendor_id=\'lambert\'');
      console.log('✅ ~200+ images uploaded to Cloudflare');
      console.log('✅ No duplicates');
      console.log('✅ Job tracking working\n');
      
    } else {
      console.error(`❌ Scrape failed: ${response.status}`);
      const error = await response.text();
      console.error(error);
    }
  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}

testFreshScrape();
