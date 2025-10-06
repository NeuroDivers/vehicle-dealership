/**
 * Test image processing for a single vehicle with detailed logging
 */

async function testSingleVehicle() {
  const vehicleId = 26392; // Mazda3 that we know has vendor URLs
  const jobId = `debug-test-${Date.now()}`;
  
  console.log(`🔍 Testing image processing for vehicle ${vehicleId}\n`);
  
  try {
    const response = await fetch(
      'https://image-processor.nick-damato0011527.workers.dev/api/process-images',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleIds: [vehicleId],
          batchSize: 1,
          jobId: jobId,
          vendorName: 'Debug Test'
        })
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Response:', JSON.stringify(data, null, 2));
    } else {
      console.error(`❌ Failed: ${response.status}`);
      const error = await response.text();
      console.error(error);
    }
  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}

testSingleVehicle();
