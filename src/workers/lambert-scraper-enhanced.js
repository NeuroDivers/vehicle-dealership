/**
 * Enhanced Cloudflare Worker for Automobile Lambert Scraping
 * Specifically optimized for automobile-lambert.com structure
 * 
 * Features:
 * - French/English label extraction
 * - Image download to Cloudflare R2
 * - Incremental updates with fingerprinting
 * - Delta reporting for changes
 * - CSV export capability
 */

export default {
  async scheduled(event, env, ctx) {
    const config = {
      baseUrl: 'https://www.automobile-lambert.com',
      listingPath: '/cars/',
      maxPages: 50,
      perPage: 20,
      scrapeDelay: 1500,
      downloadImages: true,
      imagesPerVehicle: 8
    };
    
    ctx.waitUntil(scrapeLambertInventory(config, env));
  },

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
      if (url.pathname === '/api/lambert/scrape' && request.method === 'POST') {
        const result = await scrapeLambertInventory(getConfig(), env);
        return jsonResponse(result, corsHeaders);
      }

      if (url.pathname === '/api/lambert/inventory' && request.method === 'GET') {
        const inventory = await getLambertInventory(env.DB);
        return jsonResponse(inventory, corsHeaders);
      }

      if (url.pathname === '/api/lambert/delta' && request.method === 'GET') {
        const delta = await getDeltaReport(env.DB);
        return jsonResponse(delta, corsHeaders);
      }

      if (url.pathname === '/api/lambert/export-csv' && request.method === 'GET') {
        const csv = await exportToCSV(env.DB);
        return new Response(csv, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="lambert-inventory.csv"'
          }
        });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: error.message }, corsHeaders, 500);
    }
  }
};

/**
 * Main scraping function for Automobile Lambert
 */
async function scrapeLambertInventory(config, env) {
  console.log('Starting Lambert inventory scrape...');
  
  const startTime = Date.now();
  const stats = {
    totalPages: 0,
    vehiclesFound: 0,
    newVehicles: 0,
    changedVehicles: 0,
    removedVehicles: 0,
    imagesDownloaded: 0
  };
  
  try {
    // Step 1: Discover all vehicle URLs
    const vehicleUrls = await discoverVehicleUrls(config);
    stats.vehiclesFound = vehicleUrls.length;
    console.log(`Found ${vehicleUrls.length} vehicles`);
    
    // Step 2: Get existing inventory for comparison
    const existingInventory = await getExistingInventory(env.DB);
    const existingUrls = new Set(existingInventory.map(v => v.url));
    
    // Step 3: Process each vehicle
    const processedVehicles = [];
    const seenUrls = new Set();
    
    for (const url of vehicleUrls) {
      await sleep(config.scrapeDelay);
      
      try {
        const vehicleData = await scrapeVehicleDetails(url, config);
        
        // Download images if enabled
        if (config.downloadImages && vehicleData.images) {
          const savedImages = await downloadImages(
            vehicleData.images.slice(0, config.imagesPerVehicle),
            vehicleData.slug,
            env.R2
          );
          vehicleData.localImages = savedImages;
          stats.imagesDownloaded += savedImages.length;
        }
        
        // Generate fingerprint for change detection
        const fingerprint = generateFingerprint(vehicleData);
        vehicleData.fingerprint = fingerprint;
        
        // Determine status
        const existing = existingInventory.find(v => v.url === url);
        if (!existing) {
          vehicleData.status = 'NEW';
          vehicleData.first_seen = new Date().toISOString();
          stats.newVehicles++;
        } else if (existing.fingerprint !== fingerprint) {
          vehicleData.status = 'CHANGED';
          vehicleData.last_changed = new Date().toISOString();
          stats.changedVehicles++;
        } else {
          vehicleData.status = 'UNCHANGED';
        }
        
        vehicleData.last_seen = new Date().toISOString();
        processedVehicles.push(vehicleData);
        seenUrls.add(url);
        
      } catch (error) {
        console.error(`Error processing ${url}:`, error);
      }
    }
    
    // Step 4: Mark missing vehicles
    const missingVehicles = existingInventory.filter(v => !seenUrls.has(v.url));
    stats.removedVehicles = missingVehicles.length;
    
    // Step 5: Save to database
    await saveInventory(env.DB, processedVehicles, missingVehicles);
    
    // Step 6: Generate delta report
    const deltaReport = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      stats,
      new: processedVehicles.filter(v => v.status === 'NEW').map(v => ({
        url: v.url,
        title: v.title,
        price: v.price
      })),
      changed: processedVehicles.filter(v => v.status === 'CHANGED').map(v => ({
        url: v.url,
        title: v.title,
        price: v.price
      }))
    };
    
    await saveDeltaReport(env.DB, deltaReport);
    
    console.log(`Scrape completed in ${deltaReport.duration}ms`, stats);
    return deltaReport;
    
  } catch (error) {
    console.error('Scrape failed:', error);
    throw error;
  }
}

/**
 * Discover all vehicle URLs from listing pages
 */
async function discoverVehicleUrls(config) {
  const urls = new Set();
  let page = 1;
  let emptyPages = 0;
  
  while (page <= config.maxPages && emptyPages < 3) {
    const listingUrl = buildListingUrl(config, page);
    console.log(`Fetching page ${page}: ${listingUrl}`);
    
    try {
      const response = await fetch(listingUrl);
      if (!response.ok) {
        console.error(`Failed to fetch page ${page}: ${response.status}`);
        emptyPages++;
        page++;
        continue;
      }
      
      const html = await response.text();
      const vehicleLinks = extractVehicleLinks(html, config.baseUrl);
      
      if (vehicleLinks.length === 0) {
        emptyPages++;
      } else {
        emptyPages = 0;
        vehicleLinks.forEach(link => urls.add(link));
      }
      
      page++;
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      emptyPages++;
      page++;
    }
  }
  
  return Array.from(urls);
}

/**
 * Build listing page URL with pagination
 */
function buildListingUrl(config, page) {
  const params = new URLSearchParams({
    paged: page,
    cars_pp: config.perPage,
    cars_orderby: 'date',
    cars_order: 'desc',
    lay_style: 'list',
    cars_grid: 'yes'
  });
  
  return `${config.baseUrl}${config.listingPath}?${params}`;
}

/**
 * Extract vehicle detail URLs from listing HTML
 */
function extractVehicleLinks(html, baseUrl) {
  const links = [];
  // Match Lambert's specific pattern: /cars/year-make-model/
  const regex = /href="(\/cars\/[^"]+\/)"/g;
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    const path = match[1];
    // Filter out category/filter URLs
    if (path.includes('?') || path.split('/').length !== 4) continue;
    
    const fullUrl = `${baseUrl}${path}`;
    if (!links.includes(fullUrl)) {
      links.push(fullUrl);
    }
  }
  
  return links;
}

/**
 * Scrape individual vehicle details
 */
async function scrapeVehicleDetails(url, config) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch vehicle: ${response.status}`);
  }
  
  const html = await response.text();
  const data = parseLambertVehicle(html, url);
  
  // Extract slug from URL for image naming
  const urlParts = url.split('/');
  data.slug = urlParts[urlParts.length - 2] || 'unknown';
  
  return data;
}

/**
 * Parse Lambert-specific vehicle HTML
 */
function parseLambertVehicle(html, url) {
  const data = { url };
  
  // Extract title (usually in h1 or h2)
  const titleMatch = html.match(/<h[12][^>]*>([^<]+)<\/h[12]>/);
  if (titleMatch) {
    data.title = titleMatch[1].trim();
    
    // Parse year, make, model from title
    const titleParts = data.title.match(/(\d{4})\s+([A-Za-z]+)\s+(.+)/);
    if (titleParts) {
      data.year = parseInt(titleParts[1]);
      data.make = titleParts[2];
      data.model = titleParts[3];
    }
  }
  
  // Extract price (Lambert uses $ symbol)
  const priceMatch = html.match(/\$\s*([0-9,\s]+)/);
  if (priceMatch) {
    data.price = parseInt(priceMatch[1].replace(/[,\s]/g, ''));
  }
  
  // Extract VIN (French: NIV or English: VIN)
  const vinMatch = html.match(/(VIN|NIV)[:\s]+([A-Z0-9]{17})/i);
  if (vinMatch) {
    data.vin = vinMatch[2];
  }
  
  // Extract stock number (French: Numéro de stock)
  const stockMatch = html.match(/(Stock|Numéro de stock)[:\s#]+([A-Z0-9-]+)/i);
  if (stockMatch) {
    data.stock_number = stockMatch[2];
  }
  
  // Extract mileage/kilometrage
  const mileageMatch = html.match(/(\d{1,3}[\s,]?\d{3})\s*(km|kilomètres?|miles?)/i);
  if (mileageMatch) {
    data.odometer = parseInt(mileageMatch[1].replace(/[\s,]/g, ''));
    data.odometer_unit = mileageMatch[2].toLowerCase().includes('mile') ? 'miles' : 'km';
  }
  
  // Extract transmission (French: Transmission)
  const transMatch = html.match(/(Transmission|Boîte)[:\s]+([^<\n]+)/i);
  if (transMatch) {
    data.transmission = transMatch[2].trim();
  }
  
  // Extract drivetrain (French: Traction)
  const driveMatch = html.match(/(Drivetrain|Traction|Entraînement)[:\s]+([^<\n]+)/i);
  if (driveMatch) {
    data.drivetrain = driveMatch[2].trim();
  }
  
  // Extract fuel type (French: Type de carburant)
  const fuelMatch = html.match(/(Fuel Type|Type de carburant|Carburant)[:\s]+([^<\n]+)/i);
  if (fuelMatch) {
    data.fuel_type = normalizeFuelType(fuelMatch[2].trim());
  }
  
  // Extract body style (French: Type de carrosserie)
  const bodyMatch = html.match(/(Body Style|Type de carrosserie|Carrosserie)[:\s]+([^<\n]+)/i);
  if (bodyMatch) {
    data.body_type = normalizeBodyType(bodyMatch[2].trim());
  }
  
  // Extract exterior color (French: Couleur extérieure)
  const extColorMatch = html.match(/(Exterior Color|Couleur extérieure|Extérieur)[:\s]+([^<\n]+)/i);
  if (extColorMatch) {
    data.color_exterior = extColorMatch[2].trim();
  }
  
  // Extract interior color (French: Couleur intérieure)
  const intColorMatch = html.match(/(Interior Color|Couleur intérieure|Intérieur)[:\s]+([^<\n]+)/i);
  if (intColorMatch) {
    data.color_interior = intColorMatch[2].trim();
  }
  
  // Extract images
  data.images = extractImages(html);
  
  // Extract description (longest paragraph)
  const paragraphs = html.match(/<p[^>]*>([^<]+)<\/p>/g) || [];
  let longestDesc = '';
  paragraphs.forEach(p => {
    const text = p.replace(/<[^>]+>/g, '').trim();
    if (text.length > longestDesc.length && text.length > 50) {
      longestDesc = text;
    }
  });
  data.description = longestDesc;
  
  // Add scraped timestamp
  data.scraped_at = new Date().toISOString();
  
  return data;
}

/**
 * Extract image URLs from HTML
 */
function extractImages(html) {
  const images = [];
  const seen = new Set();
  
  // Match various image patterns
  const patterns = [
    /<img[^>]+src="([^"]+)"/g,
    /data-src="([^"]+)"/g,
    /data-lazy-src="([^"]+)"/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let url = match[1];
      
      // Skip thumbnails, icons, logos
      if (url.includes('thumb') || 
          url.includes('icon') || 
          url.includes('logo') ||
          url.includes('placeholder') ||
          url.width < 300) continue;
      
      // Make URL absolute
      if (!url.startsWith('http')) {
        url = url.startsWith('/') 
          ? `https://www.automobile-lambert.com${url}`
          : `https://www.automobile-lambert.com/${url}`;
      }
      
      if (!seen.has(url)) {
        seen.add(url);
        images.push(url);
      }
    }
  });
  
  return images;
}

/**
 * Download images to Cloudflare R2
 */
async function downloadImages(imageUrls, vehicleSlug, R2) {
  const savedImages = [];
  
  for (let i = 0; i < imageUrls.length; i++) {
    try {
      const response = await fetch(imageUrls[i]);
      if (!response.ok) continue;
      
      const blob = await response.blob();
      const extension = imageUrls[i].split('.').pop()?.split('?')[0] || 'jpg';
      const filename = `vehicles/${vehicleSlug}/${vehicleSlug}-${i + 1}.${extension}`;
      
      await R2.put(filename, blob, {
        httpMetadata: {
          contentType: response.headers.get('content-type') || 'image/jpeg'
        }
      });
      
      savedImages.push({
        original: imageUrls[i],
        stored: filename,
        r2_url: `https://your-r2-domain.com/${filename}`
      });
      
    } catch (error) {
      console.error(`Failed to download image ${imageUrls[i]}:`, error);
    }
  }
  
  return savedImages;
}

/**
 * Generate fingerprint for change detection
 */
function generateFingerprint(data) {
  const fields = [
    data.title,
    data.price,
    data.year,
    data.make,
    data.model,
    data.odometer,
    data.vin,
    data.stock_number,
    data.transmission,
    data.fuel_type,
    data.body_type,
    data.color_exterior,
    (data.images || []).slice(0, 3).join(',')
  ].filter(Boolean).join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fields.length; i++) {
    const char = fields.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Normalize fuel type
 */
function normalizeFuelType(fuel) {
  const lower = fuel.toLowerCase();
  if (lower.includes('electric') || lower.includes('électrique')) return 'electric';
  if (lower.includes('hybrid') || lower.includes('hybride')) return 'hybrid';
  if (lower.includes('diesel')) return 'diesel';
  if (lower.includes('gas') || lower.includes('essence')) return 'gasoline';
  return fuel;
}

/**
 * Normalize body type
 */
function normalizeBodyType(body) {
  const lower = body.toLowerCase();
  if (lower.includes('sedan') || lower.includes('berline')) return 'sedan';
  if (lower.includes('suv') || lower.includes('vus')) return 'suv';
  if (lower.includes('truck') || lower.includes('camion')) return 'truck';
  if (lower.includes('van') || lower.includes('fourgon')) return 'van';
  if (lower.includes('coupe') || lower.includes('coupé')) return 'coupe';
  if (lower.includes('hatch')) return 'hatchback';
  if (lower.includes('wagon') || lower.includes('familiale')) return 'wagon';
  if (lower.includes('convertible') || lower.includes('décapotable')) return 'convertible';
  return body;
}

/**
 * Get existing inventory from database
 */
async function getExistingInventory(db) {
  const result = await db.prepare(`
    SELECT url, fingerprint, id, status
    FROM lambert_vehicles
    WHERE status != 'REMOVED'
  `).all();
  
  return result.results || [];
}

/**
 * Save inventory to database
 */
async function saveInventory(db, vehicles, missingVehicles) {
  const batch = [];
  
  // Upsert vehicles
  for (const vehicle of vehicles) {
    batch.push(db.prepare(`
      INSERT INTO lambert_vehicles (
        url, title, year, make, model, price, vin, stock_number,
        odometer, odometer_unit, transmission, drivetrain, fuel_type,
        body_type, color_exterior, color_interior, description,
        images, local_images, fingerprint, status,
        first_seen, last_seen, last_changed, scraped_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(url) DO UPDATE SET
        title = excluded.title,
        price = excluded.price,
        odometer = excluded.odometer,
        images = excluded.images,
        local_images = excluded.local_images,
        fingerprint = excluded.fingerprint,
        status = excluded.status,
        last_seen = excluded.last_seen,
        last_changed = CASE 
          WHEN excluded.status = 'CHANGED' THEN excluded.last_changed 
          ELSE last_changed 
        END,
        scraped_at = excluded.scraped_at
    `).bind(
      vehicle.url, vehicle.title, vehicle.year, vehicle.make, vehicle.model,
      vehicle.price, vehicle.vin, vehicle.stock_number, vehicle.odometer,
      vehicle.odometer_unit, vehicle.transmission, vehicle.drivetrain,
      vehicle.fuel_type, vehicle.body_type, vehicle.color_exterior,
      vehicle.color_interior, vehicle.description,
      JSON.stringify(vehicle.images), JSON.stringify(vehicle.localImages),
      vehicle.fingerprint, vehicle.status,
      vehicle.first_seen || new Date().toISOString(),
      vehicle.last_seen, vehicle.last_changed, vehicle.scraped_at
    ));
  }
  
  // Mark missing vehicles
  for (const vehicle of missingVehicles) {
    batch.push(db.prepare(`
      UPDATE lambert_vehicles
      SET status = 'REMOVED', removed_at = ?
      WHERE id = ?
    `).bind(new Date().toISOString(), vehicle.id));
  }
  
  await db.batch(batch);
}

/**
 * Save delta report
 */
async function saveDeltaReport(db, report) {
  await db.prepare(`
    INSERT INTO lambert_scraper_runs (
      timestamp, duration, stats, new_vehicles, changed_vehicles
    ) VALUES (?, ?, ?, ?, ?)
  `).bind(
    report.timestamp,
    report.duration,
    JSON.stringify(report.stats),
    JSON.stringify(report.new),
    JSON.stringify(report.changed)
  ).run();
}

/**
 * Get Lambert inventory
 */
async function getLambertInventory(db) {
  const result = await db.prepare(`
    SELECT * FROM lambert_vehicles
    WHERE status != 'REMOVED'
    ORDER BY scraped_at DESC
  `).all();
  
  return result.results || [];
}

/**
 * Get delta report
 */
async function getDeltaReport(db) {
  const result = await db.prepare(`
    SELECT * FROM lambert_scraper_runs
    ORDER BY timestamp DESC
    LIMIT 1
  `).first();
  
  return result || null;
}

/**
 * Export to CSV
 */
async function exportToCSV(db) {
  const vehicles = await getLambertInventory(db);
  
  const headers = [
    'URL', 'Title', 'Year', 'Make', 'Model', 'Price', 'VIN', 'Stock',
    'Odometer', 'Unit', 'Transmission', 'Drivetrain', 'Fuel Type',
    'Body Type', 'Exterior Color', 'Interior Color', 'Status',
    'First Seen', 'Last Changed', 'Images'
  ];
  
  const rows = vehicles.map(v => [
    v.url, v.title, v.year, v.make, v.model, v.price, v.vin, v.stock_number,
    v.odometer, v.odometer_unit, v.transmission, v.drivetrain, v.fuel_type,
    v.body_type, v.color_exterior, v.color_interior, v.status,
    v.first_seen, v.last_changed, JSON.parse(v.images || '[]').length
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
  ].join('\n');
  
  return csv;
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

function getConfig() {
  return {
    baseUrl: 'https://www.automobile-lambert.com',
    listingPath: '/cars/',
    maxPages: 50,
    perPage: 20,
    scrapeDelay: 1500,
    downloadImages: true,
    imagesPerVehicle: 8
  };
}
