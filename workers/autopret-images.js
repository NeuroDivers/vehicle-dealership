/**
 * AutoPret123 Unified Images Worker
 * Combines image-processor and bulk-delete-images into one worker
 * 
 * Routes:
 * - /api/process-images    - Upload vendor URLs to Cloudflare Images
 * - /api/image-status      - Get image processing stats
 * - /api/jobs              - Get recent processing jobs
 * - /api/jobs/:id          - Get specific job status
 * - /api/list-images       - List all Cloudflare Images
 * - /api/delete-images     - Bulk delete project images
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // ============================================
      // IMAGE PROCESSING ROUTES
      // ============================================
      
      // POST /api/process-images - Process vendor URLs to Cloudflare
      if (url.pathname === '/api/process-images' && request.method === 'POST') {
        return await this.handleProcessImages(request, env, corsHeaders);
      }

      // GET /api/image-status - Get processing stats
      if (url.pathname === '/api/image-status' && request.method === 'GET') {
        return await this.handleImageStatus(env, corsHeaders);
      }

      // GET /api/jobs - Get recent jobs
      if (url.pathname === '/api/jobs' && request.method === 'GET') {
        return await this.handleGetJobs(env, corsHeaders);
      }

      // GET /api/jobs/:id - Get specific job status
      if (url.pathname.match(/^\/api\/jobs\/[\w-]+$/) && request.method === 'GET') {
        const jobId = url.pathname.split('/')[3];
        return await this.handleGetJob(jobId, env, corsHeaders);
      }

      // ============================================
      // IMAGE MANAGEMENT ROUTES
      // ============================================
      
      // GET /api/list-images - List all Cloudflare Images
      if (url.pathname === '/api/list-images' && request.method === 'GET') {
        return await this.handleListImages(env, corsHeaders);
      }

      // POST /api/delete-images - Bulk delete project images
      if ((url.pathname === '/api/delete-images' || url.pathname === '/api/delete-all-images' || url.pathname === '/api/delete-autoprets123-images') && request.method === 'POST') {
        return await this.handleDeleteImages(request, env, corsHeaders);
      }

      // ============================================
      // 404 - Route not found
      // ============================================
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Route not found',
        path: url.pathname
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Images API Error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },

  // ============================================
  // IMAGE PROCESSING HANDLERS
  // ============================================
  
  async handleProcessImages(request, env, corsHeaders) {
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
  },

  async handleImageStatus(env, corsHeaders) {
    const stats = await this.getImageProcessingStats(env);
    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async handleGetJobs(env, corsHeaders) {
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
  },

  async handleGetJob(jobId, env, corsHeaders) {
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
  },

  // ============================================
  // IMAGE MANAGEMENT HANDLERS
  // ============================================
  
  async handleListImages(env, corsHeaders) {
    const images = await this.listAllImages(env);
    
    // Count images by project
    const projectCounts = {};
    images.forEach(image => {
      const project = image.project || 'unknown';
      projectCounts[project] = (projectCounts[project] || 0) + 1;
    });
    
    return new Response(JSON.stringify({
      success: true,
      count: images.length,
      projectCounts: projectCounts,
      autoprets123Count: projectCounts['AutoPrets123'] || 0,
      images: images
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async handleDeleteImages(request, env, corsHeaders) {
    const { confirm } = await request.json();
    
    if (confirm !== 'DELETE_AUTOPRETS123_IMAGES') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Confirmation required. Send {"confirm": "DELETE_AUTOPRETS123_IMAGES"}'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = await this.deleteAllImages(env);
    
    return new Response(JSON.stringify({
      success: true,
      ...result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  // ============================================
  // IMAGE PROCESSING UTILITIES
  // ============================================
  
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
  },

  // ============================================
  // IMAGE MANAGEMENT UTILITIES
  // ============================================
  
  async listAllImages(env) {
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = env.CF_IMAGES_TOKEN || env.CLOUDFLARE_IMAGES_TOKEN;
    
    if (!apiToken || !accountId) {
      throw new Error('Missing Cloudflare credentials');
    }

    const allImages = [];
    let page = 1;
    let hasMore = true;

    console.log('Starting to list all images...');

    while (hasMore) {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1?page=${page}&per_page=100`,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to list images: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.result && data.result.images) {
        allImages.push(...data.result.images);
        console.log(`Page ${page}: Found ${data.result.images.length} images (Total: ${allImages.length})`);
        
        // Check if there are more pages
        hasMore = data.result.images.length === 100;
        page++;
      } else {
        hasMore = false;
      }

      // Safety limit to prevent infinite loops
      if (page > 1000) {
        console.log('Reached page limit of 1000');
        break;
      }
    }

    console.log(`Total images found: ${allImages.length}`);
    
    // Add project information to the response
    allImages.forEach(image => {
      if (image.id.startsWith('AutoPrets123-')) {
        image.project = 'AutoPrets123';
      } else if (image.metadata) {
        try {
          const metadata = typeof image.metadata === 'string' 
            ? JSON.parse(image.metadata) 
            : image.metadata;
            
          if (metadata.project === 'AutoPrets123' || 
              metadata.projectId === 'vehicle-dealership' ||
              metadata.projectUrl === 'https://autopret123.ca') {
            image.project = 'AutoPrets123';
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });
    
    return allImages;
  },

  async deleteAllImages(env) {
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = env.CF_IMAGES_TOKEN || env.CLOUDFLARE_IMAGES_TOKEN;
    
    if (!apiToken || !accountId) {
      throw new Error('Missing Cloudflare credentials');
    }

    console.log('🚨 Starting bulk delete operation for AutoPrets123 project images only...');
    
    // Get all images
    const allImages = await this.listAllImages(env);
    
    if (allImages.length === 0) {
      return {
        message: 'No images found',
        deleted: 0,
        failed: 0,
        total: 0
      };
    }

    // Filter images to only include those from AutoPrets123 project
    const images = allImages.filter(image => {
      // Check if image ID has AutoPrets123 prefix
      if (image.id.startsWith('AutoPrets123-')) {
        return true;
      }
      
      // Check metadata if available
      if (image.metadata) {
        try {
          const metadata = typeof image.metadata === 'string' 
            ? JSON.parse(image.metadata) 
            : image.metadata;
            
          return metadata.project === 'AutoPrets123' || 
                 metadata.projectId === 'vehicle-dealership' ||
                 metadata.projectUrl === 'https://autopret123.ca';
        } catch (e) {
          // If metadata parsing fails, don't include this image
          return false;
        }
      }
      
      // If no identifying information, don't include this image
      return false;
    });
    
    console.log(`Found ${images.length} AutoPrets123 images out of ${allImages.length} total images`);
    
    if (images.length === 0) {
      return {
        message: 'No AutoPrets123 images to delete',
        deleted: 0,
        failed: 0,
        total: 0
      };
    }
    
    let deleted = 0;
    let failed = 0;
    const errors = [];

    // Delete in batches of 50 to avoid overwhelming the API
    const batchSize = 50;
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      
      console.log(`Deleting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(images.length / batchSize)} (${batch.length} images)`);
      
      const deletePromises = batch.map(async (image) => {
        try {
          const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${image.id}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${apiToken}`
              }
            }
          );

          if (response.ok) {
            deleted++;
            if (deleted % 100 === 0) {
              console.log(`Progress: ${deleted}/${images.length} deleted`);
            }
            return { success: true, id: image.id };
          } else {
            failed++;
            const error = `Failed to delete ${image.id}: ${response.status}`;
            errors.push(error);
            return { success: false, id: image.id, error };
          }
        } catch (error) {
          failed++;
          const errorMsg = `Error deleting ${image.id}: ${error.message}`;
          errors.push(errorMsg);
          return { success: false, id: image.id, error: errorMsg };
        }
      });

      await Promise.all(deletePromises);
      
      // Small delay between batches to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Bulk delete complete: ${deleted} deleted, ${failed} failed`);

    return {
      message: 'Bulk delete complete',
      total: images.length,
      deleted: deleted,
      failed: failed,
      errors: errors.slice(0, 10) // Return first 10 errors only
    };
  }
};
