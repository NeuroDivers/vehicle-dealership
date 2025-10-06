/**
 * Test scraper directly (it now saves to D1 and triggers image processing)
 */

async function testScraperDirect() {
  console.log('🧪 Testing Scraper (saves to D1 directly)\n');

  console.log('1️⃣ Running Lambert scraper...');
  const response = await fetch(
    'https://lambert-scraper.nick-damato0011527.workers.dev/api/scrape',
    { method: 'POST' }
  );
  
  const data = await response.json();
  console.log(`\n✅ Scraper Response:`);
  console.log(`   Success: ${data.success}`);
  console.log(`   Vehicles: ${data.count}`);
  console.log(`   Duration: ${data.duration}s`);
  console.log(`   Image Job ID: ${data.imageProcessingJobId || 'NONE'}`);
  console.log(`   Stats: ${JSON.stringify(data.stats)}`);
  
  if (data.imageProcessingJobId) {
    console.log(`\n2️⃣ Image processing triggered! Job ID: ${data.imageProcessingJobId}`);
    console.log(`   Waiting 5 seconds...\n`);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const jobResponse = await fetch(
      `https://image-processor.nick-damato0011527.workers.dev/api/jobs/${data.imageProcessingJobId}`
    );
    const jobData = await jobResponse.json();
    
    if (jobData.success) {
      console.log(`✅ Job Status:`);
      console.log(`   Status: ${jobData.job.status}`);
      console.log(`   Progress: ${jobData.job.progress}%`);
      console.log(`   Vehicles: ${jobData.job.vehicles_processed}/${jobData.job.total_vehicles}`);
      console.log(`   Images: ${jobData.job.images_uploaded} uploaded, ${jobData.job.images_failed} failed`);
    } else {
      console.log(`❌ Job not found`);
    }
  } else {
    console.log(`\n⚠️  No image processing job ID returned`);
    console.log(`   This means either:`);
    console.log(`   1. No vehicles needed image processing (already have Cloudflare IDs)`);
    console.log(`   2. IMAGE_PROCESSOR_URL not set (unlikely - we just deployed it)`);
    console.log(`   3. All vehicles were unchanged (no new or updated vehicles)`);
  }
}

testScraperDirect();
