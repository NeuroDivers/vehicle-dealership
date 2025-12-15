/**
 * Image Cleanup Worker
 * Runs periodically to find and delete orphaned Cloudflare images
 * that belong to this project but are no longer referenced in the database
 */

export default {
  async scheduled(event, env, ctx) {
    console.log('🧹 Starting image cleanup job...');
    
    try {
      await cleanupOrphanedImages(env);
    } catch (error) {
      console.error('❌ Image cleanup failed:', error);
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
        const result = await cleanupOrphanedImages(env);
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
    
    return new Response('Image Cleanup Worker - POST to trigger cleanup', {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'text/plain' 
      }
    });
  }
};

async function cleanupOrphanedImages(env) {
  const startTime = Date.now();
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const token = env.CF_IMAGES_TOKEN;
  
  if (!accountId || !token) {
    throw new Error('Missing Cloudflare credentials');
  }
  
  // Step 1: Get all image IDs from database
  console.log('📊 Fetching image IDs from database...');
  const vehicles = await env.DB.prepare(`
    SELECT id, images FROM vehicles WHERE images IS NOT NULL AND images != '[]'
  `).all();
  
  const dbImageIds = new Set();
  for (const vehicle of vehicles.results) {
    try {
      const images = JSON.parse(vehicle.images);
      images.forEach(img => {
        // Only track Cloudflare IDs (non-http strings)
        if (typeof img === 'string' && !img.startsWith('http')) {
          dbImageIds.add(img);
        }
      });
    } catch (e) {
      console.error(`Failed to parse images for vehicle ${vehicle.id}`);
    }
  }
  
  console.log(`✅ Found ${dbImageIds.size} images referenced in database`);
  
  // Step 2: Get all images from Cloudflare that belong to this project
  console.log('☁️ Fetching images from Cloudflare...');
  const cloudflareImages = await getAllCloudflareImages(accountId, token);
  
  // Filter for our project images
  const projectImages = cloudflareImages.filter(img => {
    // Check if ID starts with our prefix
    if (img.id.startsWith('AutoPrets123-') || img.id.startsWith('AutoPret123-')) {
      return true;
    }
    
    // Check metadata
    if (img.metadata) {
      try {
        const metadata = typeof img.metadata === 'string' 
          ? JSON.parse(img.metadata) 
          : img.metadata;
          
        return metadata.project === 'AutoPrets123' || 
               metadata.projectId === 'vehicle-dealership' ||
               metadata.projectUrl === 'https://autopret123.ca';
      } catch (e) {
        return false;
      }
    }
    
    return false;
  });
  
  console.log(`✅ Found ${projectImages.length} images in Cloudflare belonging to this project`);
  
  // Step 3: Find orphaned images
  const orphanedImages = projectImages.filter(img => !dbImageIds.has(img.id));
  
  console.log(`🗑️ Found ${orphanedImages.length} orphaned images`);
  
  if (orphanedImages.length === 0) {
    return {
      success: true,
      message: 'No orphaned images found',
      stats: {
        dbImages: dbImageIds.size,
        cloudflareImages: projectImages.length,
        orphaned: 0,
        deleted: 0,
        duration: Math.round((Date.now() - startTime) / 1000)
      }
    };
  }
  
  // Step 4: Delete orphaned images (with safety limit)
  const MAX_DELETE_PER_RUN = 100; // Safety limit
  const toDelete = orphanedImages.slice(0, MAX_DELETE_PER_RUN);
  let deletedCount = 0;
  let failedCount = 0;
  
  console.log(`🗑️ Deleting ${toDelete.length} orphaned images...`);
  
  for (const image of toDelete) {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${image.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        deletedCount++;
        console.log(`✅ Deleted: ${image.id}`);
      } else {
        failedCount++;
        console.error(`❌ Failed to delete ${image.id}: ${response.status}`);
      }
    } catch (err) {
      failedCount++;
      console.error(`❌ Error deleting ${image.id}:`, err.message);
    }
  }
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  
  const result = {
    success: true,
    message: `Deleted ${deletedCount} orphaned images`,
    stats: {
      dbImages: dbImageIds.size,
      cloudflareImages: projectImages.length,
      orphaned: orphanedImages.length,
      deleted: deletedCount,
      failed: failedCount,
      remaining: orphanedImages.length - toDelete.length,
      duration
    }
  };
  
  console.log(`✅ Cleanup complete in ${duration}s`);
  console.log(JSON.stringify(result.stats, null, 2));
  
  return result;
}

async function getAllCloudflareImages(accountId, token) {
  const allImages = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1?page=${page}&per_page=100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        console.error(`Failed to fetch images page ${page}: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      
      if (data.result && data.result.images) {
        allImages.push(...data.result.images);
        hasMore = data.result.images.length === 100;
        page++;
      } else {
        hasMore = false;
      }
    } catch (err) {
      console.error(`Error fetching images page ${page}:`, err.message);
      hasMore = false;
    }
  }
  
  return allImages;
}
