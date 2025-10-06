/**
 * Test the complete flow:
 * 1. Run scraper
 * 2. Sync vehicles (using local Next.js API)
 * 3. Check if image processing job created
 */

async function testCompleteFlow() {
  console.log('🧪 Testing Complete Vehicle Sync + Image Processing Flow\n');

  // Step 1: Check if Next.js API is running
  console.log('1️⃣ Checking if Next.js API is running...');
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${API_URL}/api/admin/vehicles/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicles: [] }) // Empty test
    });
    
    if (response.status === 400) {
      console.log(`   ✅ Next.js API is running at ${API_URL}`);
      console.log('   ✅ Sync endpoint exists\n');
    } else {
      console.log(`   ⚠️  Unexpected response: ${response.status}\n`);
    }
  } catch (error) {
    console.log(`   ❌ Next.js API not accessible at ${API_URL}`);
    console.log(`   Error: ${error.message}`);
    console.log('\n   💡 Make sure to run: npm run dev\n');
    return;
  }

  // Step 2: Run Lambert scraper
  console.log('2️⃣ Running Lambert scraper...');
  try {
    const scrapeResponse = await fetch(
      'https://lambert-scraper.nick-damato0011527.workers.dev/api/scrape',
      { method: 'POST' }
    );
    
    const scrapeData = await scrapeResponse.json();
    console.log(`   ✅ Scraper completed in ${scrapeData.duration}s`);
    console.log(`   📊 Found ${scrapeData.count} vehicles`);
    console.log(`   📈 New: ${scrapeData.stats?.new || 0}, Updated: ${scrapeData.stats?.updated || 0}\n`);
    
    if (!scrapeData.vehicles || scrapeData.vehicles.length === 0) {
      console.log('   ⚠️  No vehicles returned. Cannot test sync.\n');
      return;
    }

    // Step 3: Sync vehicles to database
    console.log('3️⃣ Syncing vehicles to database...');
    const syncResponse = await fetch(`${API_URL}/api/admin/vehicles/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicles: scrapeData.vehicles.slice(0, 5), // Just sync first 5 for testing
        vendorId: 'lambert',
        vendorName: 'Lambert Auto'
      })
    });

    if (!syncResponse.ok) {
      console.log(`   ❌ Sync failed: ${syncResponse.status}`);
      const error = await syncResponse.text();
      console.log(`   Error: ${error}\n`);
      return;
    }

    const syncData = await syncResponse.json();
    console.log(`   ✅ Sync complete!`);
    console.log(`   📊 New: ${syncData.new}, Updated: ${syncData.updated}, Skipped: ${syncData.skipped}`);
    
    if (syncData.imageProcessing) {
      console.log(`   🎉 IMAGE PROCESSING TRIGGERED!`);
      console.log(`   📝 Job ID: ${syncData.imageProcessing.jobId}`);
      console.log(`   📸 Images to process: ${syncData.imageProcessing.count}\n`);
      
      // Step 4: Check job status
      console.log('4️⃣ Checking image processing job status...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const jobResponse = await fetch(
        `https://image-processor.nick-damato0011527.workers.dev/api/jobs/${syncData.imageProcessing.jobId}`
      );
      
      if (jobResponse.ok) {
        const jobData = await jobResponse.json();
        if (jobData.success) {
          const job = jobData.job;
          console.log(`   ✅ Job found!`);
          console.log(`   Status: ${job.status}`);
          console.log(`   Progress: ${job.progress}%`);
          console.log(`   Vehicles: ${job.vehicles_processed}/${job.total_vehicles}`);
          console.log(`   Images: ${job.images_uploaded} uploaded, ${job.images_failed} failed`);
          
          if (job.current_vehicle) {
            console.log(`   Currently processing: ${job.current_vehicle}`);
          }
        } else {
          console.log(`   ❌ Job not found: ${jobData.error}`);
        }
      } else {
        console.log(`   ❌ Failed to check job status`);
      }
    } else {
      console.log(`   ⚠️  Image processing NOT triggered`);
      console.log(`   This means no vehicles had vendor image URLs\n`);
    }

  } catch (error) {
    console.error('   ❌ Test failed:', error.message);
  }
}

testCompleteFlow();
