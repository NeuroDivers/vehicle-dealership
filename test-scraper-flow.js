/**
 * Test if scraper properly triggers image processor
 */

async function testScraperFlow() {
  console.log('🧪 Testing Scraper → Image Processor Flow\n');

  // Test Lambert scraper
  console.log('1️⃣ Triggering Lambert scraper...');
  try {
    const response = await fetch(
      'https://lambert-scraper.nick-damato0011527.workers.dev/api/scrape',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    const data = await response.json();
    console.log('\n✅ Scraper Response:');
    console.log(`   - Success: ${data.success}`);
    console.log(`   - Vehicles: ${data.count}`);
    console.log(`   - New: ${data.stats?.new || 0}`);
    console.log(`   - Image Job ID: ${data.imageProcessingJobId || 'NOT RETURNED'}`);
    console.log(`   - Duration: ${data.duration}s`);
    
    if (data.imageProcessingJobId) {
      console.log(`\n📊 Monitor job at:`);
      console.log(`   https://image-processor.nick-damato0011527.workers.dev/api/jobs/${data.imageProcessingJobId}`);
      
      // Wait a moment then check job status
      console.log('\n⏳ Waiting 3 seconds then checking job status...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const jobResponse = await fetch(
        `https://image-processor.nick-damato0011527.workers.dev/api/jobs/${data.imageProcessingJobId}`
      );
      const jobData = await jobResponse.json();
      
      if (jobData.success) {
        const job = jobData.job;
        console.log(`\n✅ Job Status:`);
        console.log(`   - Status: ${job.status}`);
        console.log(`   - Progress: ${job.progress}%`);
        console.log(`   - Vehicles: ${job.vehicles_processed}/${job.total_vehicles}`);
        console.log(`   - Images Uploaded: ${job.images_uploaded}`);
        console.log(`   - Images Failed: ${job.images_failed}`);
      } else {
        console.log(`\n❌ Job not found: ${jobData.error}`);
      }
    } else {
      console.log('\n⚠️  WARNING: Scraper did not return imageProcessingJobId!');
      console.log('   This means the image processor was not triggered.');
      console.log('   Checking if IMAGE_PROCESSOR_URL is set...');
    }
    
  } catch (error) {
    console.log(`\n❌ Scraper test failed: ${error.message}`);
  }
}

testScraperFlow();
