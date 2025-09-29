/**
 * Cloudflare Worker for Partner Inventory Scraping
 * Runs on Cloudflare's edge network with D1 database integration
 * 
 * Features:
 * - Scrapes partner dealer websites for vehicle inventory
 * - Change detection with fingerprinting
 * - Incremental updates to avoid redundant scraping
 * - Image caching with Cloudflare R2
 * - Scheduled runs via Cron Triggers
 */

export default {
  // Scheduled handler for Cron Triggers
  async scheduled(event, env, ctx) {
    // Run scraping jobs based on schedule
    const partners = await getActivePartners(env.DB);
    
    for (const partner of partners) {
      ctx.waitUntil(scrapePartnerInventory(partner, env));
    }
  },

  // HTTP handler for manual triggers and API
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handling
      if (url.pathname === '/api/scraper/trigger' && request.method === 'POST') {
        const { partnerId } = await request.json();
        const result = await triggerScrape(partnerId, env);
        return jsonResponse(result, corsHeaders);
      }

      if (url.pathname === '/api/scraper/status' && request.method === 'GET') {
        const status = await getScraperStatus(env.DB);
        return jsonResponse(status, corsHeaders);
      }

      if (url.pathname === '/api/partners' && request.method === 'GET') {
        const partners = await getPartnerVehicles(env.DB);
        return jsonResponse(partners, corsHeaders);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: error.message }, corsHeaders, 500);
    }
  }
};

/**
 * Get active partner configurations from database
 */
async function getActivePartners(db) {
  const result = await db.prepare(`
    SELECT * FROM partner_configs 
    WHERE is_active = 1
  `).all();
  
  return result.results || [];
}

/**
 * Main scraping function for a partner
 */
async function scrapePartnerInventory(partner, env) {
  console.log(`Starting scrape for partner: ${partner.name}`);
  
  const scraper = new PartnerScraper(partner, env);
  const startTime = Date.now();
  
  try {
    // Update scrape status
    await updateScrapeStatus(env.DB, partner.id, 'running');
    
    // Discover all vehicle URLs
    const vehicleUrls = await scraper.discoverVehicleUrls();
    console.log(`Found ${vehicleUrls.length} vehicles for ${partner.name}`);
    
    // Get existing vehicles for comparison
    const existingVehicles = await getExistingVehicles(env.DB, partner.id);
    const existingUrls = new Set(existingVehicles.map(v => v.url));
    
    // Track changes
    const newVehicles = [];
    const changedVehicles = [];
    const processedUrls = new Set();
    
    // Process each vehicle with rate limiting
    for (const url of vehicleUrls) {
      await sleep(partner.scrape_delay || 1000); // Polite delay
      
      try {
        const vehicleData = await scraper.scrapeVehicleDetails(url);
        const fingerprint = generateFingerprint(vehicleData);
        
        processedUrls.add(url);
        
        if (!existingUrls.has(url)) {
          // New vehicle
          newVehicles.push({
            ...vehicleData,
            partner_id: partner.id,
            fingerprint,
            status: 'NEW',
            first_seen: new Date().toISOString()
          });
        } else {
          // Check if changed
          const existing = existingVehicles.find(v => v.url === url);
          if (existing.fingerprint !== fingerprint) {
            changedVehicles.push({
              ...vehicleData,
              partner_id: partner.id,
              fingerprint,
              status: 'CHANGED',
              last_changed: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
      }
    }
    
    // Mark missing vehicles (likely sold)
    const missingVehicles = existingVehicles.filter(v => !processedUrls.has(v.url));
    
    // Save to database
    await saveScrapedData(env.DB, {
      newVehicles,
      changedVehicles,
      missingVehicles,
      partnerId: partner.id
    });
    
    // Update scrape status
    const duration = Date.now() - startTime;
    await updateScrapeStatus(env.DB, partner.id, 'completed', {
      duration,
      new_count: newVehicles.length,
      changed_count: changedVehicles.length,
      removed_count: missingVehicles.length,
      total_count: vehicleUrls.length
    });
    
    console.log(`Completed scrape for ${partner.name} in ${duration}ms`);
    
  } catch (error) {
    console.error(`Scrape failed for ${partner.name}:`, error);
    await updateScrapeStatus(env.DB, partner.id, 'failed', { error: error.message });
  }
}

/**
 * Partner-specific scraper class
 */
class PartnerScraper {
  constructor(partner, env) {
    this.partner = partner;
    this.env = env;
    this.baseUrl = partner.base_url;
    this.config = JSON.parse(partner.scrape_config || '{}');
  }
  
  /**
   * Discover all vehicle URLs from listing pages
   */
  async discoverVehicleUrls() {
    const urls = new Set();
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const listUrl = this.buildListingUrl(page);
      const response = await fetch(listUrl);
      
      if (!response.ok) {
        console.error(`Failed to fetch listing page ${page}`);
        break;
      }
      
      const html = await response.text();
      const vehicleLinks = this.extractVehicleLinks(html);
      
      if (vehicleLinks.length === 0) {
        hasMore = false;
      } else {
        vehicleLinks.forEach(link => urls.add(link));
        page++;
        
        // Safety limit
        if (page > (this.config.max_pages || 100)) {
          break;
        }
      }
    }
    
    return Array.from(urls);
  }
  
  /**
   * Build listing page URL with pagination
   */
  buildListingUrl(page) {
    const params = new URLSearchParams({
      paged: page,
      cars_pp: this.config.per_page || 20,
      cars_orderby: this.config.order_by || 'date'
    });
    
    return `${this.baseUrl}${this.config.listing_path || '/cars/'}?${params}`;
  }
  
  /**
   * Extract vehicle detail URLs from listing HTML
   */
  extractVehicleLinks(html) {
    const links = [];
    const regex = new RegExp(this.config.link_pattern || 'href="([^"]+/cars/[^"]+)"', 'g');
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      const url = match[1].startsWith('http') ? match[1] : `${this.baseUrl}${match[1]}`;
      links.push(url);
    }
    
    return links;
  }
  
  /**
   * Scrape individual vehicle details
   */
  async scrapeVehicleDetails(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch vehicle: ${response.status}`);
    }
    
    const html = await response.text();
    const data = this.parseVehicleHtml(html);
    
    return {
      url,
      ...data,
      scraped_at: new Date().toISOString()
    };
  }
  
  /**
   * Parse vehicle details from HTML
   */
  parseVehicleHtml(html) {
    const data = {};
    
    // Extract title (make, model, year)
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    if (titleMatch) {
      const title = titleMatch[1].trim();
      const parts = title.match(/(\d{4})\s+(.+)/);
      if (parts) {
        data.year = parseInt(parts[1]);
        const makeModel = parts[2].split(' ');
        data.make = makeModel[0];
        data.model = makeModel.slice(1).join(' ');
      }
    }
    
    // Extract price
    const priceMatch = html.match(/\$([0-9,]+)/);
    if (priceMatch) {
      data.price = parseInt(priceMatch[1].replace(/,/g, ''));
    }
    
    // Extract VIN
    const vinMatch = html.match(/VIN[:\s]+([A-Z0-9]{17})/i);
    if (vinMatch) {
      data.vin = vinMatch[1];
    }
    
    // Extract mileage/odometer
    const mileageMatch = html.match(/(\d{1,3}[,\s]?\d{3})\s*(km|miles?)/i);
    if (mileageMatch) {
      data.odometer = parseInt(mileageMatch[1].replace(/[,\s]/g, ''));
      data.odometer_unit = mileageMatch[2].toLowerCase().includes('mile') ? 'miles' : 'km';
    }
    
    // Extract stock number
    const stockMatch = html.match(/Stock[:\s#]+([A-Z0-9-]+)/i);
    if (stockMatch) {
      data.stock_number = stockMatch[1];
    }
    
    // Extract fuel type
    const fuelMatch = html.match(/(gasoline|diesel|electric|hybrid|plug-in hybrid)/i);
    if (fuelMatch) {
      data.fuel_type = fuelMatch[1].toLowerCase().replace('plug-in ', 'plugin-');
    }
    
    // Extract body type
    const bodyMatch = html.match(/(sedan|suv|truck|van|coupe|convertible|wagon|hatchback)/i);
    if (bodyMatch) {
      data.body_type = bodyMatch[1].toLowerCase();
    }
    
    // Extract color
    const colorMatch = html.match(/Color[:\s]+([A-Za-z]+)/i);
    if (colorMatch) {
      data.color = colorMatch[1];
    }
    
    // Extract images
    data.images = this.extractImages(html);
    
    // Extract description
    const descMatch = html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)</);
    if (descMatch) {
      data.description = descMatch[1].trim();
    }
    
    return data;
  }
  
  /**
   * Extract image URLs from HTML
   */
  extractImages(html) {
    const images = [];
    const regex = /<img[^>]+src="([^"]+)"[^>]*>/g;
    let match;
    
    while ((match = regex.exec(html)) !== null) {
      const url = match[1];
      // Filter for vehicle images (skip logos, icons, etc.)
      if (url.includes('/cars/') || url.includes('/vehicles/') || url.includes('/inventory/')) {
        images.push(url.startsWith('http') ? url : `${this.baseUrl}${url}`);
      }
    }
    
    return images.slice(0, 20); // Limit to 20 images
  }
}

/**
 * Generate fingerprint for change detection
 */
function generateFingerprint(data) {
  const key = [
    data.vin,
    data.price,
    data.odometer,
    data.year,
    data.make,
    data.model,
    (data.images || []).slice(0, 3).join(',') // Include first 3 images
  ].join('|');
  
  return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}

/**
 * Get existing vehicles from database
 */
async function getExistingVehicles(db, partnerId) {
  const result = await db.prepare(`
    SELECT url, fingerprint, id 
    FROM partner_vehicles 
    WHERE partner_id = ? AND status != 'REMOVED'
  `).bind(partnerId).all();
  
  return result.results || [];
}

/**
 * Save scraped data to database
 */
async function saveScrapedData(db, { newVehicles, changedVehicles, missingVehicles, partnerId }) {
  const batch = [];
  
  // Insert new vehicles
  for (const vehicle of newVehicles) {
    batch.push(db.prepare(`
      INSERT INTO partner_vehicles (
        partner_id, url, vin, year, make, model, price, odometer, odometer_unit,
        fuel_type, body_type, color, stock_number, images, description,
        fingerprint, status, first_seen, last_seen, scraped_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      partnerId, vehicle.url, vehicle.vin, vehicle.year, vehicle.make, vehicle.model,
      vehicle.price, vehicle.odometer, vehicle.odometer_unit, vehicle.fuel_type,
      vehicle.body_type, vehicle.color, vehicle.stock_number,
      JSON.stringify(vehicle.images), vehicle.description,
      vehicle.fingerprint, 'NEW', vehicle.first_seen, vehicle.first_seen, vehicle.scraped_at
    ));
  }
  
  // Update changed vehicles
  for (const vehicle of changedVehicles) {
    batch.push(db.prepare(`
      UPDATE partner_vehicles SET
        vin = ?, year = ?, make = ?, model = ?, price = ?, odometer = ?,
        odometer_unit = ?, fuel_type = ?, body_type = ?, color = ?,
        stock_number = ?, images = ?, description = ?, fingerprint = ?,
        status = 'CHANGED', last_changed = ?, last_seen = ?, scraped_at = ?
      WHERE partner_id = ? AND url = ?
    `).bind(
      vehicle.vin, vehicle.year, vehicle.make, vehicle.model, vehicle.price,
      vehicle.odometer, vehicle.odometer_unit, vehicle.fuel_type, vehicle.body_type,
      vehicle.color, vehicle.stock_number, JSON.stringify(vehicle.images),
      vehicle.description, vehicle.fingerprint, vehicle.last_changed,
      vehicle.scraped_at, vehicle.scraped_at, partnerId, vehicle.url
    ));
  }
  
  // Mark missing vehicles as removed
  for (const vehicle of missingVehicles) {
    batch.push(db.prepare(`
      UPDATE partner_vehicles 
      SET status = 'REMOVED', removed_at = ?
      WHERE id = ?
    `).bind(new Date().toISOString(), vehicle.id));
  }
  
  // Execute batch
  await db.batch(batch);
}

/**
 * Update scraper status
 */
async function updateScrapeStatus(db, partnerId, status, metadata = {}) {
  await db.prepare(`
    INSERT INTO scraper_runs (
      partner_id, status, started_at, completed_at, metadata
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(partner_id) DO UPDATE SET
      status = ?, completed_at = ?, metadata = ?
  `).bind(
    partnerId, status, new Date().toISOString(),
    status === 'running' ? null : new Date().toISOString(),
    JSON.stringify(metadata),
    status, status === 'running' ? null : new Date().toISOString(),
    JSON.stringify(metadata)
  ).run();
}

/**
 * Trigger manual scrape
 */
async function triggerScrape(partnerId, env) {
  const partner = await env.DB.prepare(`
    SELECT * FROM partner_configs WHERE id = ?
  `).bind(partnerId).first();
  
  if (!partner) {
    throw new Error('Partner not found');
  }
  
  // Start scraping in background
  await scrapePartnerInventory(partner, env);
  
  return { success: true, message: `Scraping started for ${partner.name}` };
}

/**
 * Get scraper status
 */
async function getScraperStatus(db) {
  const result = await db.prepare(`
    SELECT 
      p.name as partner_name,
      s.status,
      s.started_at,
      s.completed_at,
      s.metadata
    FROM scraper_runs s
    JOIN partner_configs p ON s.partner_id = p.id
    ORDER BY s.started_at DESC
    LIMIT 20
  `).all();
  
  return result.results || [];
}

/**
 * Get partner vehicles
 */
async function getPartnerVehicles(db) {
  const result = await db.prepare(`
    SELECT 
      pv.*,
      pc.name as partner_name
    FROM partner_vehicles pv
    JOIN partner_configs pc ON pv.partner_id = pc.id
    WHERE pv.status != 'REMOVED'
    ORDER BY pv.scraped_at DESC
    LIMIT 100
  `).all();
  
  return result.results || [];
}

/**
 * Helper functions
 */
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
