/**
 * Test SLT scraper directly (bypass dashboard)
 */

async function testSLTDirect() {
  console.log('🧪 Testing SLT scraper DIRECTLY (not through dashboard)\n');
  
  try {
    // Call scraper directly
    console.log('1️⃣ Calling SLT scraper...');
    const response = await fetch('https://sltautos-scraper.nick-damato0011527.workers.dev/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      console.error(`❌ Scraper failed: ${response.status}`);
      return;
    }
    
    const result = await response.json();
    console.log(`✅ Scraper completed!`);
    console.log(`   Vehicles: ${result.count}`);
    console.log(`   Duration: ${result.duration}s`);
    console.log(`   Image Job: ${result.imageProcessingJobId}\n`);
    
    // Wait for image processing
    console.log('2️⃣ Waiting 60 seconds for image processing...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // Check database
    console.log('3️⃣ Checking database...\n');
    console.log('Run this command to verify:');
    console.log('wrangler d1 execute vehicle-dealership-analytics --command "SELECT id, make, model, substr(images, 1, 50) FROM vehicles WHERE vendor_id=\'sltautos\' ORDER BY id DESC LIMIT 3" --remote');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSLTDirect();
