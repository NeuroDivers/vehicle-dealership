/**
 * Test image processor directly with real vehicle IDs from D1
 */

async function testImageProcessorDirect() {
  console.log('🧪 Testing Image Processor Directly\n');

  // Use vehicle IDs we know exist in D1 (from previous query: 26072, 26073)
  const testVehicleIds = [26072, 26073];
  const jobId = `manual-test-${Date.now()}`;
  
  console.log(`1️⃣ Triggering image processor with vehicle IDs: ${testVehicleIds.join(', ')}`);
  console.log(`   Job ID: ${jobId}\n`);
  
  try {
    const response = await fetch(
      'https://image-processor.nick-damato0011527.workers.dev/api/process-images',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleIds: testVehicleIds,
          batchSize: 2,
          jobId: jobId,
          vendorName: 'Manual Test'
        })
      }
    );
    
    console.log(`Response status: ${response.status}`);
    
    const data = await response.json();
    console.log(`Response data:`, JSON.stringify(data, null, 2));
    
    if (data.jobId) {
      console.log(`\n2️⃣ Job created! Checking status...\n`);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const jobResponse = await fetch(
        `https://image-processor.nick-damato0011527.workers.dev/api/jobs/${data.jobId}`
      );
      const jobData = await jobResponse.json();
      
      if (jobData.success) {
        console.log(`✅ Job Status:`);
        console.log(`   Status: ${jobData.job.status}`);
        console.log(`   Progress: ${jobData.job.progress}%`);
        console.log(`   Vehicles: ${jobData.job.vehicles_processed}/${jobData.job.total_vehicles}`);
        console.log(`   Images: ${jobData.job.images_uploaded} uploaded, ${jobData.job.images_failed} failed`);
      } else {
        console.log(`❌ Job not found: ${jobData.error}`);
      }
    } else {
      console.log(`\n❌ No job ID returned`);
      console.log(`Error:`, data.error || 'Unknown');
    }
  } catch (error) {
    console.error(`❌ Test failed:`, error.message);
  }
}

testImageProcessorDirect();
