/**
 * Image Reprocessor Worker
 * Finds vehicles with vendor URLs (not Cloudflare IDs) and triggers image processing
 * Runs on cron schedule and can be manually triggered
 */

export default {
  async scheduled(event, env, ctx) {
    console.log('🔄 Starting scheduled image reprocessing check...');
    
    try {
      const result = await reprocessUnprocessedImages(env);
      console.log('✅ Scheduled reprocessing complete:', result);
    } catch (error) {
      console.error('❌ Scheduled reprocessing failed:', error);
    }
  },

  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://autopret123.ca',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };

    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    // Allow manual trigger via HTTP
    if (request.method === 'POST') {
      try {
        const result = await reprocessUnprocessedImages(env);
        return new Response(JSON.stringify(result), {
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          }
        });
      }
    }
    
    return new Response('Image Reprocessor - POST to trigger reprocessing', {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'text/plain' 
      }
    });
  }
};

async function reprocessUnprocessedImages(env) {
  const startTime = Date.now();
  
  // Find vehicles with unprocessed images (vendor URLs instead of Cloudflare IDs)
  const { results: vehicles } = await env.DB.prepare(`
    SELECT id, images, make, model, year, vendor_name
    FROM vehicles
    WHERE images IS NOT NULL 
    AND images != '[]'
    AND images != ''
  `).all();
  
  console.log(`📊 Found ${vehicles.length} vehicles with images`);
  
  const needsProcessing = [];
  
  for (const vehicle of vehicles) {
    try {
      const images = JSON.parse(vehicle.images);
      
      // Check if images are vendor URLs (start with http) instead of Cloudflare IDs
      if (images.length > 0 && typeof images[0] === 'string' && images[0].startsWith('http')) {
        needsProcessing.push({
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          vendor_name: vehicle.vendor_name,
          imageCount: images.length
        });
      }
    } catch (err) {
      console.error(`Failed to parse images for vehicle ${vehicle.id}:`, err.message);
    }
  }
  
  console.log(`🔍 Found ${needsProcessing.length} vehicles needing image processing`);
  
  if (needsProcessing.length === 0) {
    return {
      success: true,
      message: 'No vehicles need image processing',
      stats: {
        total: vehicles.length,
        needsProcessing: 0,
        processed: 0,
        failed: 0
      },
      duration: Date.now() - startTime
    };
  }
  
  // Trigger image processing in batches
  const batchSize = 50;
  const vehicleIds = needsProcessing.map(v => v.id);
  let processed = 0;
  let failed = 0;
  
  for (let i = 0; i < vehicleIds.length; i += batchSize) {
    const batch = vehicleIds.slice(i, i + batchSize);
    const jobId = `reprocess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`📸 Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.length} vehicles`);
    
    try {
      const response = await env.IMAGE_PROCESSOR.fetch(
        new Request('https://dummy/api/process-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleIds: batch,
            batchSize: 10,
            jobId: jobId
          })
        })
      );
      
      if (response.ok) {
        const data = await response.json();
        processed += data.succeeded || 0;
        failed += data.failed || 0;
        console.log(`✅ Batch complete: ${data.succeeded} succeeded, ${data.failed} failed`);
      } else {
        console.error(`❌ Image processor returned status ${response.status}`);
        failed += batch.length;
      }
    } catch (err) {
      console.error('❌ Image processor failed:', err.message);
      failed += batch.length;
    }
    
    // Small delay between batches to avoid overwhelming the system
    if (i + batchSize < vehicleIds.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  const duration = Date.now() - startTime;
  
  return {
    success: true,
    message: `Reprocessed ${processed} vehicles, ${failed} failed`,
    stats: {
      total: vehicles.length,
      needsProcessing: needsProcessing.length,
      processed: processed,
      failed: failed
    },
    vehicles: needsProcessing.slice(0, 10), // Return first 10 for reference
    duration: duration
  };
}
