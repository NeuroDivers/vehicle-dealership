async function checkJobs() {
  const response = await fetch('https://image-processor.nick-damato0011527.workers.dev/api/jobs');
  const data = await response.json();
  
  if (data.success) {
    console.log(`\n✅ Found ${data.jobs.length} jobs:\n`);
    data.jobs.forEach(job => {
      console.log(`ID: ${job.id}`);
      console.log(`  Vendor: ${job.vendor_name}`);
      console.log(`  Status: ${job.status}`);
      console.log(`  Progress: ${job.progress}%`);
      console.log(`  Vehicles: ${job.vehicles_processed}/${job.total_vehicles}`);
      console.log(`  Images: ${job.images_uploaded} uploaded, ${job.images_failed} failed`);
      console.log(`  Created: ${job.created_at}`);
      console.log('');
    });
  } else {
    console.log(`❌ Error: ${data.error}`);
  }
}

checkJobs();
