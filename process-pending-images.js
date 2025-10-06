/**
 * Manually trigger image processing for vehicles with vendor URLs
 */

async function processPendingImages() {
  console.log('🖼️  Processing pending vendor images...\n');

  // Vehicle IDs that need processing
  const vehicleIds = [
    26325, 26326, 26327, 26328, 26329, 26330, 26331, 26332, 26333, 26334,
    26335, 26336, 26337, 26338, 26339, 26340, 26341, 26342, 26343, 26344
  ];

  const jobId = `manual-batch-${Date.now()}`;
  
  console.log(`📝 Triggering image processor for ${vehicleIds.length} vehicles`);
  console.log(`   Job ID: ${jobId}\n`);
  
  try {
    const response = await fetch(
      'https://image-processor.nick-damato0011527.workers.dev/api/process-images',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleIds: vehicleIds,
          batchSize: 20,
          jobId: jobId,
          vendorName: 'Manual Processing'
        })
      }
    );
    
    console.log(`✅ Response status: ${response.status}\n`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Results:');
      console.log(`   Processed: ${data.processed} vehicles`);
      console.log(`   Succeeded: ${data.succeeded}`);
      console.log(`   Failed: ${data.failed}`);
      console.log(`   Job ID: ${data.jobId}\n`);
      
      // Wait and check status
      console.log('⏳ Waiting 5 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const jobResponse = await fetch(
        `https://image-processor.nick-damato0011527.workers.dev/api/jobs/${data.jobId}`
      );
      
      if (jobResponse.ok) {
        const jobData = await jobResponse.json();
        if (jobData.success) {
          console.log('✅ Final Job Status:');
          console.log(`   Status: ${jobData.job.status}`);
          console.log(`   Progress: ${jobData.job.progress}%`);
          console.log(`   Vehicles: ${jobData.job.vehicles_processed}/${jobData.job.total_vehicles}`);
          console.log(`   Images Uploaded: ${jobData.job.images_uploaded}`);
          console.log(`   Images Failed: ${jobData.job.images_failed}`);
        }
      }
    } else {
      const error = await response.text();
      console.error(`❌ Error: ${error}`);
    }
  } catch (error) {
    console.error(`❌ Failed:`, error.message);
  }
}

processPendingImages();
