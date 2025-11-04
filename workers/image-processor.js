/**
 * Cloudflare Images Processor Worker
 * 
 * Handles async image uploads from vendor URLs to Cloudflare Images
 * Features:
 * - Batch processing with parallelization
 * - Exponential backoff retry logic
 * - Status tracking in D1
 * - Prevents duplicate uploads
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Process pending images for vehicles
    if (url.pathname === '/api/process-images' && request.method === 'POST') {
      try {
        const { vehicleIds, batchSize = 5, jobId, vendorName } = await request.json();
        
        console.log(`📸 Starting image processing for ${vehicleIds?.length || 'all'} vehicles`);
        
        // Create or update job record
        let currentJobId = jobId;
        if (!currentJobId) {
          currentJobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Get vehicles with vendor URLs that need processing
        const vehicles = await this.getVehiclesNeedingImageUpload(env, vehicleIds, batchSize);
        
        if (vehicles.length === 0) {
          return new Response(JSON.stringify({
            success: true,
            message: 'No vehicles need image processing',
            processed: 0,
            jobId: currentJobId
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Update job status to processing
        await env.DB.prepare(`
          INSERT INTO image_processing_jobs (id, vendor_name, status, total_vehicles, started_at)
          VALUES (?, ?, 'processing', ?, datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            status = 'processing',
            total_vehicles = ?,
            started_at = datetime('now'),
            updated_at = datetime('now')
        `).bind(currentJobId, vendorName || 'unknown', vehicles.length, vehicles.length).run();
        
        console.log(`🔄 Processing ${vehicles.length} vehicles (Job: ${currentJobId})`);
        
        const results = {
          processed: 0,
          succeeded: 0,
          failed: 0,
          details: [],
          jobId: currentJobId
        };
        
        // Process each vehicle
        for (const vehicle of vehicles) {
          // Update job progress
          await env.DB.prepare(`
            UPDATE image_processing_jobs
            SET vehicles_processed = ?,
                current_vehicle = ?,
                updated_at = datetime('now')
            WHERE id = ?
          `).bind(results.processed + 1, `${vehicle.make} ${vehicle.model}`, currentJobId).run();
          
          const result = await this.processVehicleImages(vehicle, env, currentJobId);
          results.processed++;
          
          if (result.success) {
            results.succeeded++;
          } else {
            results.failed++;
          }
          
          // Update image counts
          await env.DB.prepare(`
            UPDATE image_processing_jobs
            SET images_uploaded = images_uploaded + ?,
                images_failed = images_failed + ?,
                updated_at = datetime('now')
            WHERE id = ?
          `).bind(result.imagesProcessed || 0, result.imagesFailed || 0, currentJobId).run();
          
          results.details.push({
            vehicleId: vehicle.id,
            vin: vehicle.vin,
            make: vehicle.make,
            model: vehicle.model,
            ...result
          });
        }
        
        console.log(`✅ Completed: ${results.succeeded} succeeded, ${results.failed} failed`);
        
        // Mark job as completed
        await env.DB.prepare(`
          UPDATE image_processing_jobs
          SET status = 'completed',
              completed_at = datetime('now'),
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(currentJobId).run();
        
        return new Response(JSON.stringify({
          success: true,
          ...results,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        console.error('Image processing error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Check status of image processing
    if (url.pathname === '/api/image-status' && request.method === 'GET') {
      try {
        const stats = await this.getImageProcessingStats(env);
        return new Response(JSON.stringify(stats), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Get progress of specific job
    if (url.pathname.match(/^\/api\/jobs\/[\w-]+$/) && request.method === 'GET') {
      try {
        const jobId = url.pathname.split('/')[3];
        const job = await env.DB.prepare(`
          SELECT * FROM image_processing_jobs WHERE id = ?
        `).bind(jobId).first();
        
        if (!job) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Job not found'
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Calculate progress percentage
        const progress = job.total_vehicles > 0 
          ? Math.round((job.vehicles_processed / job.total_vehicles) * 100)
          : 0;
        
        return new Response(JSON.stringify({
          success: true,
          job: {
            ...job,
            progress
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Get recent jobs
    if (url.pathname === '/api/jobs' && request.method === 'GET') {
      try {
        const { results } = await env.DB.prepare(`
          SELECT 
            id,
            vendor_name,
            status,
            total_vehicles,
            vehicles_processed,
            images_uploaded,
            images_failed,
            current_vehicle,
            started_at,
            completed_at,
            created_at
          FROM image_processing_jobs
          ORDER BY created_at DESC
          LIMIT 50
        `).all();
        
        // Add progress percentage to each job
        const jobsWithProgress = results.map(job => ({
          ...job,
          progress: job.total_vehicles > 0 
            ? Math.round((job.vehicles_processed / job.total_vehicles) * 100)
            : 0
        }));
        
        return new Response(JSON.stringify({
          success: true,
          jobs: jobsWithProgress
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Image Processor Worker', {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  },
  
  /**
   * Get vehicles that have vendor URLs needing upload to Cloudflare
   */
  async getVehiclesNeedingImageUpload(env, vehicleIds = null, limit = 10) {
    let query;
    let params = [];
    
    if (vehicleIds && vehicleIds.length > 0) {
      const placeholders = vehicleIds.map(() => '?').join(',');
      query = `
        SELECT id, vin, make, model, year, images
        FROM vehicles
        WHERE id IN (${placeholders})
        AND images IS NOT NULL
        AND images != '[]'
        LIMIT ?
      `;
      params = [...vehicleIds, limit];
    } else {
      // Get vehicles with vendor URLs (contain 'http' in images JSON)
      query = `
        SELECT id, vin, make, model, year, images
        FROM vehicles
        WHERE images IS NOT NULL
        AND images != '[]'
        AND images LIKE '%http%'
        ORDER BY createdAt DESC
        LIMIT ?
      `;
      params = [limit];
    }
    
    const { results } = await env.DB.prepare(query).bind(...params).all();
    return results || [];
  },
  
  /**
   * Process images for a single vehicle
   */
  async processVehicleImages(vehicle, env) {
    try {
      const images = typeof vehicle.images === 'string' 
        ? JSON.parse(vehicle.images) 
        : vehicle.images;
      
      if (!Array.isArray(images) || images.length === 0) {
        return { success: true, message: 'No images to process' };
      }
      
      // Separate vendor URLs from already-uploaded IDs
      const vendorUrls = [];
      const cloudflareIds = [];
      
      for (const img of images) {
        if (typeof img === 'string') {
          if (img.includes('cdn.drivegood.com') || (img.startsWith('http') && !img.includes('imagedelivery.net'))) {
            vendorUrls.push(img);
          } else {
            cloudflareIds.push(img); // Already an ID or Cloudflare URL
          }
        }
      }
      
      if (vendorUrls.length === 0) {
        return { 
          success: true, 
          message: 'All images already uploaded',
          imagesProcessed: 0,
          totalImages: images.length
        };
      }
      
      console.log(`  📤 Uploading ${vendorUrls.length} vendor URLs for ${vehicle.make} ${vehicle.model}`);
      
      // Upload vendor URLs to Cloudflare (with parallel processing)
      const uploadPromises = vendorUrls.map((url, index) => 
        this.uploadSingleImage(
          url, 
          `AutoPrets123-${vehicle.vin || vehicle.id}-${Date.now()}-${index}`,
          env,
          3 // max retries
        )
      );
      
      const uploadResults = await Promise.allSettled(uploadPromises);
      
      // Collect successful uploads
      const newCloudflareIds = [];
      const failedUrls = [];
      
      uploadResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          newCloudflareIds.push(result.value.imageId);
        } else {
          failedUrls.push(vendorUrls[index]); // Keep vendor URL as fallback
          console.warn(`  ⚠️  Failed to upload image ${index + 1}: ${result.reason || result.value?.error}`);
        }
      });
      
      // Combine: existing Cloudflare IDs + new uploads + failed vendor URLs
      const finalImages = [...cloudflareIds, ...newCloudflareIds, ...failedUrls];
      
      console.log(`  💾 Updating DB for vehicle ${vehicle.id} with ${finalImages.length} images`);
      console.log(`     New CF IDs: ${newCloudflareIds.length}, Failed: ${failedUrls.length}, Existing CF: ${cloudflareIds.length}`);
      
      // Update database with processed Cloudflare images
      try {
        const updateResult = await env.DB.prepare(`
          UPDATE vehicles 
          SET images = ?, updatedAt = datetime('now')
          WHERE id = ?
        `).bind(JSON.stringify(finalImages), vehicle.id).run();
        
        console.log(`  ✅ DB Update success: ${updateResult.meta?.changes || 0} rows changed`);
      } catch (dbError) {
        console.error(`  ❌ DB Update failed for vehicle ${vehicle.id}:`, dbError.message);
        throw dbError;
      }
      
      console.log(`✅ Updated vehicle ${vehicle.id}: uploaded ${newCloudflareIds.length}, failed ${failedUrls.length}, total ${finalImages.length}`);
      
      return {
        success: true,
        imagesProcessed: newCloudflareIds.length,
        imagesFailed: failedUrls.length,
        totalImages: finalImages.length,
        message: `Uploaded ${newCloudflareIds.length}/${vendorUrls.length} images`
      };
      
    } catch (error) {
      console.error(`  ❌ Error processing vehicle ${vehicle.id}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Upload a single image with retry logic
   */
  async uploadSingleImage(imageUrl, imageId, env, maxRetries = 3) {
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = env.CF_IMAGES_TOKEN || env.CLOUDFLARE_IMAGES_TOKEN;
    
    if (!apiToken || !accountId) {
      throw new Error('Missing Cloudflare credentials');
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Download image from vendor
        const imageResponse = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (!imageResponse.ok) {
          throw new Error(`Failed to download: ${imageResponse.status}`);
        }
        
        const imageBlob = await imageResponse.blob();
        
        // Check image size (Cloudflare Images has 10MB limit)
        if (imageBlob.size > 10 * 1024 * 1024) {
          throw new Error(`Image too large: ${Math.round(imageBlob.size / 1024 / 1024)}MB`);
        }
        
        // Sanitize image ID and add AutoPrets123 prefix
        let sanitizedId = imageId.replace(/[^a-zA-Z0-9-]/g, '-');
        
        // Add AutoPrets123 prefix if not already present
        if (!sanitizedId.startsWith('AutoPrets123-')) {
          sanitizedId = `AutoPrets123-${sanitizedId}`;
        }
        
        // Ensure it doesn't exceed Cloudflare's limit (truncate if needed)
        sanitizedId = sanitizedId.substring(0, 100);
        
        // Upload to Cloudflare
        const formData = new FormData();
        formData.append('file', imageBlob);
        formData.append('id', sanitizedId);
        formData.append('metadata', JSON.stringify({
          source: 'vendor',
          originalUrl: imageUrl,
          uploadedAt: new Date().toISOString(),
          project: 'AutoPrets123',
          projectId: 'vehicle-dealership',
          projectUrl: 'https://autopret123.ca'
        }));
        
        const uploadResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiToken}`
            },
            body: formData
          }
        );
        
        const result = await uploadResponse.json();
        
        if (result.success) {
          console.log(`    ✅ Uploaded: ${sanitizedId} (attempt ${attempt})`);
          return { success: true, imageId: sanitizedId };
        } else {
          throw new Error(JSON.stringify(result.errors));
        }
        
      } catch (error) {
        console.warn(`    ⚠️  Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          return { success: false, error: error.message };
        }
      }
    }
    
    return { success: false, error: 'Max retries reached' };
  },
  
  /**
   * Get stats on image processing status
   */
  async getImageProcessingStats(env) {
    const queries = await Promise.all([
      // Total vehicles
      env.DB.prepare(`SELECT COUNT(*) as count FROM vehicles`).first(),
      
      // Vehicles with vendor URLs
      env.DB.prepare(`
        SELECT COUNT(*) as count FROM vehicles 
        WHERE images LIKE '%cdn.drivegood.com%'
      `).first(),
      
      // Vehicles with Cloudflare images
      env.DB.prepare(`
        SELECT COUNT(*) as count FROM vehicles 
        WHERE images LIKE '%imagedelivery.net%'
      `).first(),
      
      // Vehicles with mixed (both vendor and Cloudflare)
      env.DB.prepare(`
        SELECT COUNT(*) as count FROM vehicles 
        WHERE images LIKE '%cdn.drivegood.com%'
        AND images LIKE '%imagedelivery.net%'
      `).first(),
    ]);
    
    return {
      success: true,
      stats: {
        totalVehicles: queries[0].count,
        needingProcessing: queries[1].count,
        fullyProcessed: queries[2].count - queries[3].count,
        partiallyProcessed: queries[3].count
      }
    };
  }
};
