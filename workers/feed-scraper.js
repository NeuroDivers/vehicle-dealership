/**
 * Universal Feed Scraper Worker
 * Fetches and processes XML/JSON feeds from vendor_feeds table
 * Supports multiple vendors dynamically without hardcoded URLs
 */

// Helper function to calculate display price with markup
function calculateDisplayPrice(basePrice, markupType, markupValue) {
  if (!markupType || markupType === 'none' || !markupValue) {
    return basePrice;
  }
  
  if (markupType === 'amount') {
    return basePrice + markupValue;
  } else if (markupType === 'percentage') {
    return basePrice + (basePrice * (markupValue / 100));
  }
  
  return basePrice;
}

// Parse XML to JSON
function parseXML(xmlString) {
  const vehicles = [];
  
  // Extract all <vehicle> or <car> tags
  const vehiclePattern = /<(?:vehicle|car)[^>]*>([\s\S]*?)<\/(?:vehicle|car)>/gi;
  const matches = xmlString.matchAll(vehiclePattern);
  
  for (const match of matches) {
    const vehicleXml = match[1];
    const vehicle = {};
    
    // Extract fields using regex
    const fields = [
      'make', 'model', 'year', 'price', 'odometer', 'mileage', 'kilometers',
      'bodyType', 'body_type', 'body', 'color', 'exterior_color', 'vin',
      'stockNumber', 'stock_number', 'stock', 'description', 'fuelType',
      'fuel_type', 'fuel', 'transmission', 'drivetrain', 'engineSize',
      'engine_size', 'engine', 'cylinders', 'doors', 'passengers',
      'condition', 'status'
    ];
    
    fields.forEach(field => {
      const pattern = new RegExp(`<${field}[^>]*>([^<]*)<\/${field}>`, 'i');
      const fieldMatch = vehicleXml.match(pattern);
      if (fieldMatch) {
        vehicle[field] = fieldMatch[1].trim();
      }
    });
    
    // Extract images
    const images = [];
    const imagePattern = /<(?:image|photo)[^>]*>([^<]+)<\/(?:image|photo)>/gi;
    let imageMatch;
    while ((imageMatch = imagePattern.exec(vehicleXml)) !== null) {
      images.push(imageMatch[1].trim());
    }
    vehicle.images = images;
    
    vehicles.push(vehicle);
  }
  
  return vehicles;
}

// Normalize vehicle data from feed
function normalizeVehicle(rawVehicle, vendorId, vendorName) {
  const vehicle = {
    vendor_id: vendorId,
    vendor_name: vendorName,
  };
  
  // Make
  vehicle.make = rawVehicle.make || '';
  
  // Model
  vehicle.model = rawVehicle.model || '';
  
  // Year
  vehicle.year = parseInt(rawVehicle.year) || new Date().getFullYear();
  
  // Price
  const priceStr = rawVehicle.price || '0';
  vehicle.price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
  
  // Odometer (handle multiple field names)
  const odometerStr = rawVehicle.odometer || rawVehicle.mileage || rawVehicle.kilometers || '0';
  vehicle.odometer = parseInt(odometerStr.replace(/[^0-9]/g, '')) || 0;
  
  // Body Type
  vehicle.bodyType = normalizeBodyType(rawVehicle.bodyType || rawVehicle.body_type || rawVehicle.body || '');
  
  // Color
  vehicle.color = normalizeColor(rawVehicle.color || rawVehicle.exterior_color || 'Unknown');
  
  // VIN
  vehicle.vin = rawVehicle.vin || '';
  
  // Stock Number
  vehicle.stockNumber = rawVehicle.stockNumber || rawVehicle.stock_number || rawVehicle.stock || '';
  
  // Description
  vehicle.description = rawVehicle.description || `${vehicle.year} ${vehicle.make} ${vehicle.model}`.trim();
  
  // Fuel Type
  vehicle.fuelType = normalizeFuelType(rawVehicle.fuelType || rawVehicle.fuel_type || rawVehicle.fuel || 'Gasoline');
  
  // Transmission
  vehicle.transmission = normalizeTransmission(rawVehicle.transmission || '');
  
  // Drivetrain
  vehicle.drivetrain = rawVehicle.drivetrain || null;
  
  // Engine Size
  vehicle.engineSize = rawVehicle.engineSize || rawVehicle.engine_size || rawVehicle.engine || null;
  
  // Images
  vehicle.images = Array.isArray(rawVehicle.images) ? rawVehicle.images : [];
  
  return vehicle;
}

function normalizeBodyType(bodyType) {
  const lower = bodyType.toLowerCase();
  if (lower.includes('fourgon') || lower.includes('van')) return 'Van';
  if (lower.includes('suv')) return 'SUV';
  if (lower.includes('sedan') || lower.includes('berline')) return 'Sedan';
  if (lower.includes('truck') || lower.includes('camion') || lower.includes('pickup')) return 'Truck';
  if (lower.includes('coupe') || lower.includes('coupé')) return 'Coupe';
  if (lower.includes('hatch')) return 'Hatchback';
  if (lower.includes('wagon')) return 'Wagon';
  if (lower.includes('convertible')) return 'Convertible';
  return bodyType || 'Other';
}

function normalizeFuelType(fuel) {
  const lower = fuel.toLowerCase();
  if (lower.includes('essence') || lower.includes('gas')) return 'Gasoline';
  if (lower.includes('diesel')) return 'Diesel';
  if (lower.includes('electric') || lower.includes('électrique')) return 'Electric';
  if (lower.includes('hybrid') || lower.includes('hybride')) return 'Hybrid';
  return fuel;
}

function normalizeTransmission(trans) {
  const lower = trans.toLowerCase();
  if (lower.includes('auto')) return 'Automatic';
  if (lower.includes('manual') || lower.includes('manuelle')) return 'Manual';
  return trans || null;
}

function normalizeColor(color) {
  const lower = color.toLowerCase();
  if (lower.includes('white') || lower.includes('blanc')) return 'White';
  if (lower.includes('black') || lower.includes('noir')) return 'Black';
  if (lower.includes('gray') || lower.includes('grey') || lower.includes('gris')) return 'Gray';
  if (lower.includes('silver') || lower.includes('argent')) return 'Silver';
  if (lower.includes('red') || lower.includes('rouge')) return 'Red';
  if (lower.includes('blue') || lower.includes('bleu')) return 'Blue';
  if (lower.includes('green') || lower.includes('vert')) return 'Green';
  if (lower.includes('yellow') || lower.includes('jaune')) return 'Yellow';
  return color;
}

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

    // Scrape specific vendor by vendor_id
    if (url.pathname === '/api/scrape' && request.method === 'POST') {
      try {
        const body = await request.json();
        const vendorId = body.vendorId;
        
        if (!vendorId) {
          return new Response(JSON.stringify({
            success: false,
            error: 'vendorId is required'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const result = await this.scrapeVendorFeed(vendorId, env);
        
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Scraping error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Scrape all active vendors
    if (url.pathname === '/api/scrape-all' && request.method === 'POST') {
      try {
        const results = await this.scrapeAllVendors(env);
        
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Scraping error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Feed Scraper API', { headers: corsHeaders });
  },

  async scrapeVendorFeed(vendorId, env) {
    const startTime = Date.now();
    console.log(`🚀 Starting feed scrape for vendor: ${vendorId}`);
    
    try {
      // Get feed configuration from database
      const feedConfig = await env.DB.prepare(`
        SELECT * FROM vendor_feeds WHERE vendor_id = ? AND is_active = 1
      `).bind(vendorId).first();
      
      if (!feedConfig) {
        throw new Error(`No active feed found for vendor: ${vendorId}`);
      }
      
      console.log(`📡 Fetching feed from: ${feedConfig.feed_url}`);
      
      // Fetch the feed - use service binding if it's from dealer-scraper
      let feedResponse;
      if (feedConfig.feed_url.includes('dealer-scraper') && env.DEALER_SCRAPER) {
        // Use service binding for dealer-scraper worker
        const feedUrl = new URL(feedConfig.feed_url);
        feedResponse = await env.DEALER_SCRAPER.fetch(
          new Request(feedConfig.feed_url, {
            headers: {
              'User-Agent': 'AutoPrets123-FeedScraper/1.0',
              'Accept': 'application/xml, text/xml, */*'
            }
          })
        );
      } else {
        // Use regular fetch for external URLs
        feedResponse = await fetch(feedConfig.feed_url, {
          headers: {
            'User-Agent': 'AutoPrets123-FeedScraper/1.0',
            'Accept': 'application/xml, text/xml, */*'
          }
        });
      }
      
      if (!feedResponse.ok) {
        throw new Error(`Feed fetch failed: ${feedResponse.status} ${feedResponse.statusText}`);
      }
      
      const feedContent = await feedResponse.text();
      console.log(`✅ Feed fetched: ${feedContent.length} bytes`);
      
      // Parse feed based on type
      let vehicles = [];
      if (feedConfig.feed_type === 'xml') {
        vehicles = parseXML(feedContent);
      } else if (feedConfig.feed_type === 'json') {
        const jsonData = JSON.parse(feedContent);
        vehicles = jsonData.vehicles || jsonData.cars || jsonData;
      }
      
      console.log(`🔍 Parsed ${vehicles.length} vehicles from feed`);
      
      // Normalize and save vehicles
      let savedCount = 0;
      let updatedCount = 0;
      const vehicleIdsNeedingImages = [];
      
      for (const rawVehicle of vehicles) {
        try {
          const vehicle = normalizeVehicle(rawVehicle, feedConfig.vendor_id, feedConfig.vendor_name);
          
          // Skip invalid vehicles
          if (!vehicle.make || !vehicle.model || !vehicle.year || !vehicle.price) {
            console.warn(`⚠️  Skipping invalid vehicle: ${JSON.stringify(vehicle)}`);
            continue;
          }
          
          // Check if vehicle exists
          let existing = null;
          
          if (vehicle.vin && vehicle.vin.trim() !== '') {
            existing = await env.DB.prepare(`
              SELECT id, images FROM vehicles WHERE vin = ? LIMIT 1
            `).bind(vehicle.vin).first();
          }
          
          if (!existing) {
            existing = await env.DB.prepare(`
              SELECT id, images FROM vehicles 
              WHERE make = ? AND model = ? AND year = ? AND vendor_id = ?
              LIMIT 1
            `).bind(vehicle.make, vehicle.model, vehicle.year, vehicle.vendor_id).first();
          }
          
          if (existing) {
            // Update existing vehicle
            const existingImages = existing.images ? JSON.parse(existing.images) : [];
            const hasCloudflareIds = existingImages.length > 0 && 
              typeof existingImages[0] === 'string' && 
              !existingImages[0].startsWith('http');
            
            const imagesToSave = hasCloudflareIds ? existing.images : JSON.stringify(vehicle.images || []);
            
            // Get existing markup settings
            const markupSettings = await env.DB.prepare(`
              SELECT price_markup_type, price_markup_value FROM vehicles WHERE id = ?
            `).bind(existing.id).first();
            
            let markupType = markupSettings?.price_markup_type || 'vendor_default';
            let markupValue = markupSettings?.price_markup_value || 0;
            let displayPrice = vehicle.price;
            
            if (markupType === 'vendor_default') {
              const vendorSettings = await env.DB.prepare(`
                SELECT markup_type, markup_value FROM vendor_settings WHERE vendor_id = ?
              `).bind(vehicle.vendor_id).first();
              
              if (vendorSettings) {
                displayPrice = calculateDisplayPrice(vehicle.price, vendorSettings.markup_type, vendorSettings.markup_value);
              }
            } else if (markupType === 'amount' || markupType === 'percentage') {
              displayPrice = calculateDisplayPrice(vehicle.price, markupType, markupValue);
            }
            
            await env.DB.prepare(`
              UPDATE vehicles SET
                make = ?, model = ?, year = ?, price = ?, odometer = ?,
                bodyType = ?, color = ?, vin = ?, stockNumber = ?,
                description = ?, images = ?,
                fuelType = ?, transmission = ?, drivetrain = ?, engineSize = ?,
                vendor_id = ?, vendor_name = ?,
                last_seen_from_vendor = datetime('now'),
                vendor_status = 'active',
                display_price = ?
              WHERE id = ?
            `).bind(
              vehicle.make, vehicle.model, vehicle.year, vehicle.price, vehicle.odometer || 0,
              vehicle.bodyType || '', vehicle.color || '', vehicle.vin || '', vehicle.stockNumber || '',
              vehicle.description || '', imagesToSave,
              vehicle.fuelType || null, vehicle.transmission || null, vehicle.drivetrain || null, vehicle.engineSize || null,
              vehicle.vendor_id, vehicle.vendor_name,
              displayPrice,
              existing.id
            ).run();
            
            if (!hasCloudflareIds) {
              vehicleIdsNeedingImages.push(existing.id);
            }
            updatedCount++;
          } else {
            // Insert new vehicle
            let displayPrice = vehicle.price;
            let markupType = 'vendor_default';
            let markupValue = 0;
            
            const vendorSettings = await env.DB.prepare(`
              SELECT markup_type, markup_value FROM vendor_settings WHERE vendor_id = ?
            `).bind(vehicle.vendor_id).first();
            
            if (vendorSettings) {
              markupType = vendorSettings.markup_type || 'none';
              markupValue = vendorSettings.markup_value || 0;
              displayPrice = calculateDisplayPrice(vehicle.price, markupType, markupValue);
            }
            
            const result = await env.DB.prepare(`
              INSERT INTO vehicles (
                make, model, year, price, odometer, bodyType, color, vin, stockNumber,
                description, images, isSold,
                fuelType, transmission, drivetrain, engineSize,
                vendor_id, vendor_name,
                last_seen_from_vendor, vendor_status,
                price_markup_type, price_markup_value, display_price
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, datetime('now'), 'active', ?, ?, ?)
            `).bind(
              vehicle.make, vehicle.model, vehicle.year, vehicle.price, vehicle.odometer || 0,
              vehicle.bodyType || '', vehicle.color || '', vehicle.vin || '', vehicle.stockNumber || '',
              vehicle.description || '', JSON.stringify(vehicle.images || []),
              vehicle.fuelType || null, vehicle.transmission || null, vehicle.drivetrain || null, vehicle.engineSize || null,
              vehicle.vendor_id, vehicle.vendor_name,
              markupType, markupValue, displayPrice
            ).run();
            
            if (result.meta.last_row_id) {
              vehicleIdsNeedingImages.push(result.meta.last_row_id);
            }
            savedCount++;
          }
        } catch (err) {
          console.error(`Failed to save vehicle ${rawVehicle.make} ${rawVehicle.model}:`, err.message);
        }
      }
      
      console.log(`✅ Saved: ${savedCount} new, ${updatedCount} updated`);
      
      // Trigger image processing
      let imageJobId = null;
      if (vehicleIdsNeedingImages.length > 0 && env.IMAGE_PROCESSOR) {
        imageJobId = `feed-${vendorId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          const imgResponse = await env.IMAGE_PROCESSOR.fetch(
            new Request('https://dummy/api/process-images', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                vehicleIds: vehicleIdsNeedingImages.slice(0, 20),
                batchSize: 20,
                jobId: imageJobId,
                vendorName: feedConfig.vendor_name
              })
            })
          );
          
          if (imgResponse.ok) {
            const imgData = await imgResponse.json();
            console.log(`✅ Image processing: ${imgData.processed} vehicles, ${imgData.succeeded} succeeded`);
          }
        } catch (err) {
          console.error('❌ Image processor failed:', err.message);
        }
      }
      
      // Update feed sync status
      await env.DB.prepare(`
        UPDATE vendor_feeds SET
          last_sync_at = datetime('now'),
          last_sync_status = 'success',
          last_sync_message = ?,
          last_sync_count = ?,
          total_syncs = total_syncs + 1
        WHERE vendor_id = ?
      `).bind(
        `Successfully imported ${savedCount} new and ${updatedCount} updated vehicles`,
        savedCount + updatedCount,
        vendorId
      ).run();
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      return {
        success: true,
        vendorId: vendorId,
        vendorName: feedConfig.vendor_name,
        vehicles: vehicles.length,
        saved: savedCount,
        updated: updatedCount,
        imageProcessingJobId: imageJobId,
        duration: duration,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Error scraping vendor ${vendorId}:`, error);
      
      // Update feed sync status with error
      try {
        await env.DB.prepare(`
          UPDATE vendor_feeds SET
            last_sync_at = datetime('now'),
            last_sync_status = 'error',
            last_sync_message = ?
          WHERE vendor_id = ?
        `).bind(error.message, vendorId).run();
      } catch (dbErr) {
        console.error('Failed to update feed status:', dbErr);
      }
      
      return {
        success: false,
        vendorId: vendorId,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },

  async scrapeAllVendors(env) {
    console.log('🚀 Starting scrape for all active vendors');
    
    // Get all active feeds
    const feeds = await env.DB.prepare(`
      SELECT vendor_id FROM vendor_feeds WHERE is_active = 1
    `).all();
    
    const results = [];
    
    for (const feed of feeds.results) {
      const result = await this.scrapeVendorFeed(feed.vendor_id, env);
      results.push(result);
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalVehicles = results.reduce((sum, r) => sum + (r.saved || 0) + (r.updated || 0), 0);
    
    return {
      success: true,
      totalVendors: results.length,
      successfulVendors: successCount,
      totalVehicles: totalVehicles,
      results: results,
      timestamp: new Date().toISOString()
    };
  }
};
