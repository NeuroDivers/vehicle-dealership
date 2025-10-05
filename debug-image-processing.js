/**
 * Debug script to test image processing flow
 * Run with: node debug-image-processing.js
 */

const IMAGE_PROCESSOR_URL = 'https://image-processor.nick-damato0011527.workers.dev';

async function testImageProcessor() {
  console.log('🔍 Testing Image Processing System\n');

  // Test 1: Check if image processor is responding
  console.log('1️⃣ Testing image processor endpoint...');
  try {
    const response = await fetch(IMAGE_PROCESSOR_URL);
    console.log(`   ✅ Image processor responding: ${response.status}`);
  } catch (error) {
    console.log(`   ❌ Image processor not responding: ${error.message}`);
    return;
  }

  // Test 2: Check stats endpoint
  console.log('\n2️⃣ Checking image processing stats...');
  try {
    const response = await fetch(`${IMAGE_PROCESSOR_URL}/api/image-status`);
    const data = await response.json();
    console.log('   Stats:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`   ❌ Stats check failed: ${error.message}`);
  }

  // Test 3: Check recent jobs
  console.log('\n3️⃣ Checking recent jobs...');
  try {
    const response = await fetch(`${IMAGE_PROCESSOR_URL}/api/jobs`);
    const data = await response.json();
    if (data.success) {
      console.log(`   Found ${data.jobs.length} jobs:`);
      data.jobs.slice(0, 5).forEach(job => {
        console.log(`   - ${job.id}: ${job.status} (${job.progress}%) - ${job.vendor_name}`);
      });
    } else {
      console.log(`   ❌ Failed to fetch jobs: ${data.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Jobs check failed: ${error.message}`);
  }

  // Test 4: Trigger manual processing
  console.log('\n4️⃣ Triggering manual image processing (5 vehicles)...');
  try {
    const response = await fetch(`${IMAGE_PROCESSOR_URL}/api/process-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchSize: 5,
        vendorName: 'Debug Test'
      })
    });
    const data = await response.json();
    console.log('   Result:', JSON.stringify(data, null, 2));
    
    if (data.jobId) {
      console.log(`\n   📊 Monitor progress at:`);
      console.log(`   ${IMAGE_PROCESSOR_URL}/api/jobs/${data.jobId}`);
    }
  } catch (error) {
    console.log(`   ❌ Manual processing failed: ${error.message}`);
  }
}

testImageProcessor();
