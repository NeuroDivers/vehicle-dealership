/**
 * Bulk Delete Cloudflare Images Script
 * WARNING: This will delete ALL images in your Cloudflare Images account
 * Use with caution!
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

    // List all images endpoint
    if (url.pathname === '/api/list-images' && request.method === 'GET') {
      try {
        const images = await this.listAllImages(env);
        
        return new Response(JSON.stringify({
          success: true,
          count: images.length,
          images: images
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

    // Delete all images endpoint
    if (url.pathname === '/api/delete-all-images' && request.method === 'POST') {
      try {
        const { confirm } = await request.json();
        
        if (confirm !== 'DELETE_ALL_IMAGES') {
          return new Response(JSON.stringify({
            success: false,
            error: 'Confirmation required. Send {"confirm": "DELETE_ALL_IMAGES"}'
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

    return new Response('Bulk Delete Images API', { headers: corsHeaders });
  },

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
    return allImages;
  },

  async deleteAllImages(env) {
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = env.CF_IMAGES_TOKEN || env.CLOUDFLARE_IMAGES_TOKEN;
    
    if (!apiToken || !accountId) {
      throw new Error('Missing Cloudflare credentials');
    }

    console.log('🚨 Starting bulk delete operation...');
    
    // Get all images
    const images = await this.listAllImages(env);
    
    if (images.length === 0) {
      return {
        message: 'No images to delete',
        deleted: 0,
        failed: 0,
        total: 0
      };
    }

    console.log(`Found ${images.length} images to delete`);
    
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
