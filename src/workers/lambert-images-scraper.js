/**
 * Lambert Scraper with Cloudflare Images Integration
 * 
 * Why Cloudflare Images instead of R2?
 * 1. Automatic image optimization (WebP, AVIF)
 * 2. On-the-fly resizing with variants
 * 3. Built-in CDN delivery
 * 4. Automatic format selection based on browser
 * 5. Image transformations (thumbnails, etc.)
 * 6. Better performance for web delivery
 * 
 * R2 is better for raw storage, but Cloudflare Images is optimized for web serving
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (url.pathname === '/api/lambert/sync-to-main' && request.method === 'POST') {
        const result = await syncLambertToMainInventory(env);
        return jsonResponse(result, corsHeaders);
      }

      if (url.pathname === '/api/lambert/scrape-with-images' && request.method === 'POST') {
        const result = await scrapeLambertWithImages(env);
        return jsonResponse(result, corsHeaders);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: error.message }, corsHeaders, 500);
    }
  }
};

/**
 * Scrape Lambert and sync to main inventory with Cloudflare Images
 */
async function scrapeLambertWithImages(env) {
  const config = {
    baseUrl: 'https://www.automobile-lambert.com',
    listingPath: '/cars/',
    maxPages: 50,
    perPage: 20,
    scrapeDelay: 1500,
    imagesPerVehicle: 5
  };

  console.log('Starting Lambert scrape with Cloudflare Images...');
  
  const stats = {
    vehiclesFound: 0,
    imagesUploaded: 0,
    syncedToMain: 0,
    errors: []
  };

  try {
    // Step 1: Discover vehicle URLs
    const vehicleUrls = await discoverVehicleUrls(config);
    stats.vehiclesFound = vehicleUrls.length;
    
    // Step 2: Process each vehicle
    const vehicles = [];
    
    for (const url of vehicleUrls) {
      await sleep(config.scrapeDelay);
      
      try {
        // Scrape vehicle details
        const vehicleData = await scrapeVehicleDetails(url, config);
        
        // Upload images to Cloudflare Images
        if (vehicleData.images && vehicleData.images.length > 0) {
          const uploadedImages = await uploadToCloudflareImages(
            vehicleData.images.slice(0, config.imagesPerVehicle),
            vehicleData.slug,
            env
          );
          
          vehicleData.cloudflareImages = uploadedImages;
          stats.imagesUploaded += uploadedImages.length;
        }
        
        vehicles.push(vehicleData);
        
      } catch (error) {
        console.error(`Error processing ${url}:`, error);
        stats.errors.push({ url, error: error.message });
      }
    }
    
    // Step 3: Save to Lambert database
    await saveLambertVehicles(env.DB, vehicles);
    
    // Step 4: Sync to main inventory
    const syncResult = await syncToMainInventory(env.DB, vehicles);
    stats.syncedToMain = syncResult.synced;
    
    return {
      success: true,
      stats,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Scrape failed:', error);
    return {
      success: false,
      error: error.message,
      stats
    };
  }
}

/**
 * Upload images to Cloudflare Images
 */
async function uploadToCloudflareImages(imageUrls, vehicleSlug, env) {
  const uploadedImages = [];
  const accountId = env.CF_ACCOUNT_ID;
  const apiToken = env.CF_IMAGES_TOKEN;
  
  for (let i = 0; i < imageUrls.length; i++) {
    try {
      // Download image from Lambert
      const imageResponse = await fetch(imageUrls[i]);
      if (!imageResponse.ok) continue;
      
      const imageBlob = await imageResponse.blob();
      
      // Upload to Cloudflare Images
      const formData = new FormData();
      formData.append('file', imageBlob);
      formData.append('id', `lambert-${vehicleSlug}-${i + 1}`);
      formData.append('metadata', JSON.stringify({
        source: 'lambert',
        vehicle: vehicleSlug,
        originalUrl: imageUrls[i]
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
      
      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        
        // Cloudflare Images provides multiple variants
        uploadedImages.push({
          id: result.result.id,
          original: imageUrls[i],
          thumbnail: `https://imagedelivery.net/${accountId}/${result.result.id}/thumbnail`,
          display: `https://imagedelivery.net/${accountId}/${result.result.id}/display`,
          full: `https://imagedelivery.net/${accountId}/${result.result.id}/public`
        });
      }
      
    } catch (error) {
      console.error(`Failed to upload image ${i + 1}:`, error);
    }
  }
  
  return uploadedImages;
}

/**
 * Sync Lambert vehicles to main inventory
 */
async function syncToMainInventory(db, vehicles) {
  const batch = [];
  let synced = 0;
  
  for (const vehicle of vehicles) {
    // Check if vehicle already exists by VIN or partner URL
    const existing = await db.prepare(`
      SELECT id FROM Vehicle 
      WHERE (partnerVin = ? AND partnerVin IS NOT NULL) 
         OR (partnerUrl = ? AND partnerUrl IS NOT NULL)
      LIMIT 1
    `).bind(vehicle.vin, vehicle.url).first();
    
    if (existing) {
      // Update existing vehicle
      batch.push(db.prepare(`
        UPDATE Vehicle SET
          make = ?, model = ?, year = ?, price = ?,
          odometer = ?, bodyType = ?, color = ?,
          fuelType = ?, description = ?, images = ?,
          partnerName = 'Automobile Lambert',
          partnerUrl = ?, partnerVin = ?, partnerStock = ?,
          lastSynced = CURRENT_TIMESTAMP,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        vehicle.make, vehicle.model, vehicle.year, vehicle.price,
        vehicle.odometer, vehicle.body_type, vehicle.color_exterior,
        vehicle.fuel_type || 'gasoline', vehicle.description,
        JSON.stringify(vehicle.cloudflareImages || []),
        vehicle.url, vehicle.vin, vehicle.stock_number,
        existing.id
      ));
    } else {
      // Insert new vehicle
      batch.push(db.prepare(`
        INSERT INTO Vehicle (
          id, make, model, year, price, odometer, bodyType, color,
          fuelType, description, images, isSold, source,
          partnerName, partnerUrl, partnerVin, partnerStock, lastSynced,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        generateId(), vehicle.make, vehicle.model, vehicle.year,
        vehicle.price, vehicle.odometer, vehicle.body_type,
        vehicle.color_exterior, vehicle.fuel_type || 'gasoline',
        vehicle.description, JSON.stringify(vehicle.cloudflareImages || []),
        false, 'lambert', 'Automobile Lambert', vehicle.url,
        vehicle.vin, vehicle.stock_number, new Date().toISOString(),
        new Date().toISOString(), new Date().toISOString()
      ));
    }
    
    synced++;
  }
  
  if (batch.length > 0) {
    await db.batch(batch);
  }
  
  return { synced };
}

/**
 * Sync Lambert inventory to main database
 */
async function syncLambertToMainInventory(env) {
  try {
    // Get all active Lambert vehicles
    const lambertVehicles = await env.DB.prepare(`
      SELECT * FROM lambert_vehicles
      WHERE status != 'REMOVED'
      ORDER BY scraped_at DESC
    `).all();
    
    const stats = {
      total: lambertVehicles.results.length,
      synced: 0,
      updated: 0,
      new: 0
    };
    
    // Sync each vehicle to main inventory
    for (const lambert of lambertVehicles.results) {
      const images = JSON.parse(lambert.local_images || lambert.images || '[]');
      
      // Check if exists in main inventory
      const existing = await env.DB.prepare(`
        SELECT id FROM Vehicle
        WHERE partnerVin = ? OR partnerUrl = ?
        LIMIT 1
      `).bind(lambert.vin, lambert.url).first();
      
      if (existing) {
        // Update existing
        await env.DB.prepare(`
          UPDATE Vehicle SET
            price = ?,
            odometer = ?,
            description = ?,
            images = ?,
            lastSynced = CURRENT_TIMESTAMP,
            updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          lambert.price,
          lambert.odometer,
          lambert.description,
          JSON.stringify(images),
          existing.id
        ).run();
        
        stats.updated++;
      } else {
        // Insert new
        await env.DB.prepare(`
          INSERT INTO Vehicle (
            id, make, model, year, price, odometer, bodyType, color,
            fuelType, description, images, isSold, source,
            partnerName, partnerUrl, partnerVin, partnerStock, lastSynced
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          generateId(),
          lambert.make,
          lambert.model,
          lambert.year,
          lambert.price,
          lambert.odometer,
          lambert.body_type,
          lambert.color_exterior,
          lambert.fuel_type || 'gasoline',
          lambert.description,
          JSON.stringify(images),
          false,
          'lambert',
          'Automobile Lambert',
          lambert.url,
          lambert.vin,
          lambert.stock_number,
          new Date().toISOString()
        ).run();
        
        stats.new++;
      }
      
      stats.synced++;
    }
    
    return {
      success: true,
      stats,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Sync failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper functions from previous scraper...
async function discoverVehicleUrls(config) {
  const urls = new Set();
  let page = 1;
  
  while (page <= config.maxPages) {
    const listingUrl = `${config.baseUrl}${config.listingPath}?paged=${page}&cars_pp=${config.perPage}`;
    
    try {
      const response = await fetch(listingUrl);
      if (!response.ok) break;
      
      const html = await response.text();
      const regex = /href="(\/cars\/[^"]+\/)"/g;
      let match;
      
      while ((match = regex.exec(html)) !== null) {
        const path = match[1];
        if (!path.includes('?') && path.split('/').length === 4) {
          urls.add(`${config.baseUrl}${path}`);
        }
      }
      
      page++;
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      break;
    }
  }
  
  return Array.from(urls);
}

async function scrapeVehicleDetails(url, config) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch vehicle: ${response.status}`);
  }
  
  const html = await response.text();
  const data = { url };
  
  // Extract title
  const titleMatch = html.match(/<h[12][^>]*>([^<]+)<\/h[12]>/);
  if (titleMatch) {
    data.title = titleMatch[1].trim();
    const titleParts = data.title.match(/(\d{4})\s+([A-Za-z]+)\s+(.+)/);
    if (titleParts) {
      data.year = parseInt(titleParts[1]);
      data.make = titleParts[2];
      data.model = titleParts[3];
    }
  }
  
  // Extract price
  const priceMatch = html.match(/\$\s*([0-9,\s]+)/);
  if (priceMatch) {
    data.price = parseInt(priceMatch[1].replace(/[,\s]/g, ''));
  }
  
  // Extract VIN
  const vinMatch = html.match(/(VIN|NIV)[:\s]+([A-Z0-9]{17})/i);
  if (vinMatch) {
    data.vin = vinMatch[2];
  }
  
  // Extract other fields...
  data.slug = url.split('/').filter(Boolean).pop();
  data.images = extractImages(html, config.baseUrl);
  
  return data;
}

function extractImages(html, baseUrl) {
  const images = [];
  const regex = /<img[^>]+src="([^"]+)"/g;
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    let url = match[1];
    if (!url.includes('logo') && !url.includes('icon')) {
      if (!url.startsWith('http')) {
        url = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
      }
      images.push(url);
    }
  }
  
  return images;
}

async function saveLambertVehicles(db, vehicles) {
  // Save to lambert_vehicles table
  const batch = [];
  
  for (const vehicle of vehicles) {
    batch.push(db.prepare(`
      INSERT OR REPLACE INTO lambert_vehicles (
        url, title, year, make, model, price, vin, stock_number,
        images, local_images, scraped_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      vehicle.url, vehicle.title, vehicle.year, vehicle.make,
      vehicle.model, vehicle.price, vehicle.vin, vehicle.stock_number,
      JSON.stringify(vehicle.images),
      JSON.stringify(vehicle.cloudflareImages),
      new Date().toISOString()
    ));
  }
  
  if (batch.length > 0) {
    await db.batch(batch);
  }
}

function generateId() {
  return 'lam_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function jsonResponse(data, headers = {}, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
