/**
 * NaniAuto Scraper Worker
 * Scrapes vehicle inventory from naniauto.com
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

    // Scrape NaniAuto inventory
    if (url.pathname === '/api/scrape' && request.method === 'POST') {
      const startTime = Date.now();
      let vehicles = [];
      let savedCount = 0;
      let updatedCount = 0;
      let vehicleIdsNeedingImages = [];
      
      try {
        console.log('Starting NaniAuto scrape...');
        
        // Fetch vehicle data from NaniAuto website
        try {
          // Perform actual web scraping
          vehicles = await this.scrapeNaniAutoInventory();
          console.log(`Scraped ${vehicles.length} vehicles from NaniAuto`);
          
          // Upload images to Cloudflare if token is available
          if (env.CF_IMAGES_TOKEN || env.CLOUDFLARE_IMAGES_TOKEN) {
            console.log('📤 Uploading images to Cloudflare Images...');
            for (const vehicle of vehicles) {
              if (vehicle.images && vehicle.images.length > 0) {
                console.log(`Uploading ${vehicle.images.length} images for ${vehicle.make} ${vehicle.model}...`);
                const uploadedImages = await this.uploadImagesToCloudflare(
                  vehicle.images,
                  vehicle.vin || `${vehicle.year}-${vehicle.make}-${vehicle.model}`.replace(/\s+/g, '-'),
                  env
                );
                vehicle.images = uploadedImages;
              }
            }
          }
        } catch (error) {
          console.error('Error fetching vehicles:', error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Save vehicles to database
        for (const vehicle of vehicles) {
          try {
            // Check if vehicle already exists
            let existing;
            if (vehicle.vin) {
              existing = await env.DB.prepare(`
                SELECT id, images, price_markup_type, price_markup_value FROM vehicles 
                WHERE vin = ? AND vendor_id = 'naniauto'
                LIMIT 1
              `).bind(vehicle.vin).first();
            } else {
              // Fallback to make/model/year if no VIN
              existing = await env.DB.prepare(`
                SELECT id, images, price_markup_type, price_markup_value FROM vehicles 
                WHERE make = ? AND model = ? AND year = ? AND vendor_id = 'naniauto'
                LIMIT 1
              `).bind(vehicle.make, vehicle.model, vehicle.year).first();
            }
            
            if (existing) {
              // Check if existing vehicle already has Cloudflare image IDs
              const existingImages = existing.images ? JSON.parse(existing.images) : [];
              const hasCloudflareIds = existingImages.length > 0 && 
                !existingImages[0].startsWith('http');
              
              // Update existing vehicle (preserve Cloudflare IDs if they exist)
              const imagesToSave = hasCloudflareIds ? existing.images : JSON.stringify(vehicle.images || []);
              
              // Get existing markup settings and recalculate display price
              let existingMarkupType = existing.price_markup_type || 'vendor_default';
              let existingMarkupValue = existing.price_markup_value || 0;
              let displayPrice = vehicle.price;
              
              try {
                if (existingMarkupType === 'vendor_default') {
                  // Get vendor markup settings
                  const vendorSettings = await env.DB.prepare(`
                    SELECT markup_type, markup_value FROM vendor_settings
                    WHERE vendor_id = 'naniauto'
                  `).first();
                  
                  if (vendorSettings) {
                    displayPrice = calculateDisplayPrice(vehicle.price, vendorSettings.markup_type, vendorSettings.markup_value);
                    console.log(`Applied vendor markup: ${vendorSettings.markup_type} ${vendorSettings.markup_value} - Base: ${vehicle.price} → Display: ${displayPrice}`);
                  }
                } else if (existingMarkupType === 'amount' || existingMarkupType === 'percentage') {
                  // Use vehicle-specific markup
                  displayPrice = calculateDisplayPrice(vehicle.price, existingMarkupType, existingMarkupValue);
                  console.log(`Applied vehicle-specific markup: ${existingMarkupType} ${existingMarkupValue} - Base: ${vehicle.price} → Display: ${displayPrice}`);
                }
              } catch (err) {
                console.error('Error calculating display price:', err);
              }
              
              console.log(`Updating vehicle with preserved markup: type=${existingMarkupType}, value=${existingMarkupValue}, display_price=${displayPrice}`);
              
              await env.DB.prepare(`
                UPDATE vehicles SET
                  make = ?, model = ?, year = ?, price = ?, odometer = ?,
                  bodyType = ?, color = ?, vin = ?, stockNumber = ?,
                  description = ?, images = ?,
                  fuelType = ?, transmission = ?, drivetrain = ?, engineSize = ?,
                  vendor_id = 'naniauto', vendor_name = 'NaniAuto',
                  last_seen_from_vendor = datetime('now'),
                  vendor_status = 'active',
                  price_markup_type = ?,
                  price_markup_value = ?,
                  display_price = ?
                WHERE id = ?
              `).bind(
                vehicle.make, vehicle.model, vehicle.year, vehicle.price, vehicle.odometer || 0,
                vehicle.bodyType || '', vehicle.color || '', vehicle.vin || '', vehicle.stockNumber || '',
                vehicle.description || '', imagesToSave,
                vehicle.fuelType || null, vehicle.transmission || null, vehicle.drivetrain || null, vehicle.engineSize || null,
                existingMarkupType,
                existingMarkupValue,
                displayPrice,
                existing.id
              ).run();
              
              // Only trigger image processing if we don't have Cloudflare IDs yet
              if (!hasCloudflareIds) {
                vehicleIdsNeedingImages.push(existing.id);
              }
              updatedCount++;
            } else {
              // Get vendor markup settings for display price calculation
              let displayPrice = vehicle.price;
              
              // Get vendor markup settings
              let markupType = 'vendor_default';
              let markupValue = 0;
              
              try {
                const vendorSettings = await env.DB.prepare(`
                  SELECT markup_type, markup_value FROM vendor_settings
                  WHERE vendor_id = 'naniauto'
                `).first();
                
                if (vendorSettings) {
                  // Store the actual vendor markup settings
                  markupType = vendorSettings.markup_type || 'none';
                  markupValue = vendorSettings.markup_value || 0;
                  
                  displayPrice = calculateDisplayPrice(vehicle.price, markupType, markupValue);
                  console.log(`Applied vendor markup to new vehicle: ${markupType} ${markupValue} - Base: ${vehicle.price} → Display: ${displayPrice}`);
                }
              } catch (err) {
                console.error('Error getting vendor markup settings:', err);
              }
              
              // Insert new vehicle with vendor tracking and markup settings
              const result = await env.DB.prepare(`
                INSERT INTO vehicles (
                  make, model, year, price, odometer, bodyType, color, vin, stockNumber,
                  description, images, isSold,
                  fuelType, transmission, drivetrain, engineSize,
                  vendor_id, vendor_name,
                  last_seen_from_vendor, vendor_status,
                  price_markup_type, price_markup_value, display_price
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 'naniauto', 'NaniAuto', datetime('now'), 'active', ?, ?, ?)
              `).bind(
                vehicle.make, vehicle.model, vehicle.year, vehicle.price, vehicle.odometer || 0,
                vehicle.bodyType || '', vehicle.color || '', vehicle.vin || '', vehicle.stockNumber || '',
                vehicle.description || '', JSON.stringify(vehicle.images || []),
                vehicle.fuelType || null, vehicle.transmission || null, vehicle.drivetrain || null, vehicle.engineSize || null,
                markupType, markupValue, displayPrice
              ).run();
              
              if (result.meta.last_row_id) {
                vehicleIdsNeedingImages.push(result.meta.last_row_id);
              }
              savedCount++;
            }
          } catch (err) {
            console.error(`Failed to save vehicle ${vehicle.make} ${vehicle.model}:`, err.message);
          }
        }
        
        console.log(`✅ [${new Date().toISOString()}] FINISHED saving: ${savedCount} new vehicles, ${updatedCount} existing`);
        console.log(`📊 [${new Date().toISOString()}] Vehicle IDs needing images: ${vehicleIdsNeedingImages.length}`);
        console.log(`   IDs: ${vehicleIdsNeedingImages.slice(0, 5).join(', ')}${vehicleIdsNeedingImages.length > 5 ? '...' : ''}`);
        console.log(`🔄 [${new Date().toISOString()}] About to trigger image processing...`);
        
        // Trigger image processing using service binding
        let imageJobId = null;
        if (vehicleIdsNeedingImages.length > 0) {
          imageJobId = `nani-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const payload = {
            vehicleIds: vehicleIdsNeedingImages.slice(0, 20),
            batchSize: 20,
            jobId: imageJobId,
            vendorName: 'NaniAuto'
          };
          
          console.log(`📝 [${new Date().toISOString()}] Triggering image processor for ${payload.vehicleIds.length} vehicles`);
          console.log(`   Job ID: ${imageJobId}`);
          
          try {
            // Use service binding if available (worker-to-worker), fallback to HTTP
            let imgResponse;
            if (env.IMAGE_PROCESSOR) {
              imgResponse = await env.IMAGE_PROCESSOR.fetch(
                'https://image-processor/api/process-vehicle-images',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                }
              );
            } else {
              // Fallback to HTTP if service binding not available
              const imageProcessorUrl = env.IMAGE_PROCESSOR_URL || 'https://image-processor.nick-damato0011527.workers.dev';
              imgResponse = await fetch(`${imageProcessorUrl}/api/process-vehicle-images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
            }
            
            if (imgResponse.ok) {
              console.log(`✅ [${new Date().toISOString()}] Image processing triggered successfully`);
            } else {
              console.error(`❌ [${new Date().toISOString()}] Failed to trigger image processing:`, await imgResponse.text());
            }
          } catch (error) {
            console.error(`❌ [${new Date().toISOString()}] Error triggering image processing:`, error);
          }
        }
        
        // Log sync to database
        try {
          await env.DB.prepare(`
            INSERT INTO vendor_sync_logs (
              vendor_id, vendor_name, sync_date,
              vehicles_found, new_vehicles, updated_vehicles,
              status, sync_duration_seconds
            ) VALUES (?, ?, datetime('now'), ?, ?, ?, ?, ?)
          `).bind(
            'naniauto',
            'NaniAuto',
            vehicles.length,
            savedCount,
            updatedCount,
            'success',
            Math.round((Date.now() - startTime) / 1000)
          ).run();
        } catch (logError) {
          console.error('Failed to log sync:', logError);
        }
        
        const duration = Math.round((Date.now() - startTime) / 1000);
        return new Response(JSON.stringify({
          success: true,
          vendor: 'naniauto',
          vehiclesFound: vehicles.length,
          newVehicles: savedCount,
          updatedVehicles: updatedCount,
          vehiclesNeedingImages: vehicleIdsNeedingImages.length,
          imageJobId: imageJobId,
          duration: `${duration}s`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        console.error('Error in NaniAuto scraper:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Not found', { status: 404 });
  },
  
  async scrapeNaniAutoInventory() {
    const vehicles = [];
    const baseUrl = 'https://naniauto.com';
    const allVehicleUrls = new Set();
    
    try {
      // Scrape multiple pages (pagination)
      // NaniAuto has both French and English pages, we'll check both
      const languages = ['fr', 'en'];
      const maxPages = 10; // Safety limit
      
      for (const lang of languages) {
        console.log(`Checking ${lang} pages...`);
        
        // Manually check pages 1, 2, and 3 since we know they exist
        for (let page = 1; page <= 3; page++) {
          console.log(`Fetching NaniAuto inventory page ${page} (${lang})...`);
          
          // Construct URL based on page number and language
          const pageUrl = page === 1 
            ? `${baseUrl}/${lang}/inventory/` 
            : `${baseUrl}/${lang}/inventory/p/${page}/`;
          
          try {
            const response = await fetch(pageUrl);
            
            if (!response.ok) {
              console.log(`Page ${page} (${lang}) returned ${response.status}, skipping`);
              continue;
            }
            
            const html = await response.text();
            console.log(`Successfully fetched page ${page} (${lang}), HTML length: ${html.length}`);
            
            // Extract vehicle URLs from this page
            const vehicleUrls = this.extractVehicleUrls(html, baseUrl);
            console.log(`Found ${vehicleUrls.length} vehicles on page ${page} (${lang})`);
            
            // Add new URLs to our set
            vehicleUrls.forEach(url => allVehicleUrls.add(url));
          } catch (error) {
            console.error(`Error fetching page ${page} (${lang}):`, error);
          }
          
          // Add a small delay between requests
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log(`Total unique vehicle URLs found: ${allVehicleUrls.size}`);
      
      // Scrape details for each vehicle (limit to 50 for performance)
      const urlsToScrape = Array.from(allVehicleUrls).slice(0, 50);
      
      for (const url of urlsToScrape) {
        try {
          console.log(`Scraping details from ${url}`);
          const vehicle = await this.scrapeVehicleDetails(url);
          if (vehicle) {
            vehicles.push(vehicle);
          }
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Error scraping ${url}:`, error);
        }
      }
      
      return vehicles;
    } catch (error) {
      console.error('Error scraping NaniAuto inventory:', error);
      throw error;
    }
  },
  
  extractVehicleUrls(html, baseUrl) {
    const urls = [];
    // Match both French and English detail URLs
    const regexPatterns = [
      // French URLs
      /href="(\/fr\/details\/p\/\d+\/[^"]+)"/g,
      // English URLs
      /href="(\/en\/details\/p\/\d+\/[^"]+)"/g,
      // Backup pattern for any details URLs
      /href="(\/[^\/]+\/details\/p\/\d+\/[^"]+)"/g
    ];
    
    for (const regex of regexPatterns) {
      let match;
      while ((match = regex.exec(html)) !== null) {
        const url = baseUrl + match[1];
        if (!urls.includes(url)) {
          urls.push(url);
        }
      }
    }
    
    if (urls.length > 0) {
      console.log('Found URLs:', urls);
    }
    return urls;
  },
  
  async scrapeVehicleDetails(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch ${url}: ${response.status}`);
        return null;
      }
      
      const html = await response.text();
      console.log(`Fetched HTML content for ${url}, length: ${html.length}`);
      
      const vehicle = {
        make: '',
        model: '',
        year: 0,
        price: 0,
        odometer: 0,
        images: []
      };
      
      // Extract make, model, year from title
      // Format: "2024 Honda Civic Automatique"
      const titleMatch = html.match(/<h1[^>]*>([\d]{4})\s+([^\s]+)\s+([^<]+)<\/h1>/i);
      if (titleMatch) {
        vehicle.year = parseInt(titleMatch[1]);
        vehicle.make = titleMatch[2];
        vehicle.model = titleMatch[3].split(' ')[0]; // Take first word as model
        console.log(`Extracted from title: Year=${vehicle.year}, Make=${vehicle.make}, Model=${vehicle.model}`);
      } else {
        console.log('Title match failed');
      }
      
      // Extract price - using the actual HTML structure
      const priceMatch = html.match(/class="b-detail__head-price-num">([\d,\s]+)\s*\$/i) ||
                         html.match(/Price:\s*([\d,\s]+)\s*\$/i) ||
                         html.match(/\$\s*([\d,\s]+)/i) ||
                         html.match(/([\d,\s]+)\s*\$/i);
      
      if (priceMatch) {
        vehicle.price = parseInt(priceMatch[1].replace(/[,\s]/g, ''));
        console.log(`Extracted price: ${vehicle.price}`);
      } else {
        console.log('Price match failed, HTML snippet around price area:');
        // Log a snippet of HTML around where the price might be to help debug
        const priceSnippet = html.match(/b-detail__head-price[\s\S]{1,200}/i);
        if (priceSnippet) {
          console.log(priceSnippet[0]);
        } else {
          console.log('Could not find price section in HTML');
        }
      }
      
      // Extract odometer (kilometers)
      const kmMatch = html.match(/Kilometres<\/h4>\s*<h4[^>]*>([0-9,\s]+)/i) ||
                     html.match(/Kilometres\s*([0-9,\s]+)/i) ||
                     html.match(/Odomètre:\s*([0-9,\s]+)/i);
      if (kmMatch) {
        vehicle.odometer = parseInt(kmMatch[1].replace(/[,\s]/g, ''));
        console.log(`Extracted odometer: ${vehicle.odometer}`);
      } else {
        console.log('Odometer match failed');
      }
      
      // Extract body type
      const bodyMatch = html.match(/Body Type<\/h4>\s*<h4[^>]*>([^<]+)/i) ||
                       html.match(/Body Type\s*([^<\n]+)/i) ||
                       html.match(/Berline|SUV|Fourgonnette|Coupe|Hatchback|Wagon|Truck/i);
      if (bodyMatch) {
        vehicle.bodyType = this.normalizeBodyType(bodyMatch[1] ? bodyMatch[1].trim() : bodyMatch[0].trim());
        console.log(`Extracted body type: ${vehicle.bodyType}`);
      } else {
        console.log('Body type match failed');
      }
      
      // Extract engine/fuel type
      const fuelMatch = html.match(/Engine<\/h4>\s*<h4[^>]*>([^<]+)/i) ||
                       html.match(/Engine\s*([^<\n]+)/i) ||
                       html.match(/Moteur\s*:\s*([^<\n]+)/i);
      if (fuelMatch) {
        vehicle.fuelType = this.normalizeFuelType(fuelMatch[1] ? fuelMatch[1].trim() : fuelMatch[0].trim());
        console.log(`Extracted fuel type: ${vehicle.fuelType}`);
      } else {
        // Default to gasoline if not found
        vehicle.fuelType = 'Gasoline';
        console.log('Fuel type match failed, defaulting to Gasoline');
      }
      
      // Extract transmission
      const transMatch = html.match(/Transmission<\/h4>\s*<h4[^>]*>([^<]+)/i) ||
                        html.match(/Transmission\s*([^<\n]+)/i) ||
                        html.match(/Automatique|Manuelle/i);
      if (transMatch) {
        vehicle.transmission = this.normalizeTransmission(transMatch[1] ? transMatch[1].trim() : transMatch[0].trim());
        console.log(`Extracted transmission: ${vehicle.transmission}`);
      } else {
        console.log('Transmission match failed');
      }
      
      // Extract color
      const colorMatch = html.match(/Exterior Color<\/h4>\s*<h4[^>]*>([^<]+)/i) ||
                        html.match(/Exterior Color\s*([^<\n]+)/i) ||
                        html.match(/Couleur\s*ext[éeè]rieure\s*:\s*([^<\n]+)/i);
      if (colorMatch) {
        vehicle.color = this.normalizeColor(colorMatch[1] ? colorMatch[1].trim() : colorMatch[0].trim());
        console.log(`Extracted color: ${vehicle.color}`);
      } else {
        console.log('Color match failed');
      }
      
      // Extract VIN
      const vinMatch = html.match(/Vin<\/h4>\s*<h4[^>]*>([A-Z0-9]{17})/i) ||
                      html.match(/Vin\s*([A-Z0-9]{17})/i) ||
                      html.match(/VIN\s*:?\s*([A-Z0-9]{17})/i);
      if (vinMatch) {
        vehicle.vin = vinMatch[1].trim();
        console.log(`Extracted VIN: ${vehicle.vin}`);
      } else {
        console.log('VIN match failed');
      }
      
      // Extract images
      vehicle.images = this.extractImages(html);
      
      // Generate description
      vehicle.description = `${vehicle.year} ${vehicle.make} ${vehicle.model}`.trim();
      
      // Set stock number from URL ID
      const stockMatch = url.match(/\/p\/(\d+)\//); 
      if (stockMatch) {
        vehicle.stockNumber = `NANI-${stockMatch[1]}`;
        vehicle.vendor_stock_number = stockMatch[1];
      }
      
      console.log(`✓ Scraped: ${vehicle.year} ${vehicle.make} ${vehicle.model} - $${vehicle.price}`);
      return vehicle;
    } catch (error) {
      console.error(`Error scraping vehicle details from ${url}:`, error);
      return null;
    }
  },
  
  extractImages(html) {
    const images = [];
    const seen = new Set();
    
    // Match image URLs - focus on large images that are likely to be vehicle photos
    const patterns = [
      // Look for gallery images
      /<img[^>]+src="([^"]+)"[^>]+class="[^"]*gallery-image[^"]*"/g,
      // Look for large images
      /<img[^>]+src="([^"]+)"[^>]+width="[5-9][0-9]{2,}"/g,
      /<img[^>]+width="[5-9][0-9]{2,}"[^>]+src="([^"]+)"/g,
      // Look for any image with vehicle in URL
      /<img[^>]+src="([^"]*vehicle[^"]*)"/g,
      // Look for any image with car in URL
      /<img[^>]+src="([^"]*car[^"]*)"/g,
      // Look for any image with auto in URL
      /<img[^>]+src="([^"]*auto[^"]*)"/g,
      // Fallback to any image
      /<img[^>]+src="([^"]+)"/g,
      // Try data attributes
      /data-src="([^"]+)"/g,
      /data-lazy-src="([^"]+)"/g
    ];
    
    console.log('Extracting images from HTML...');
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        let url = match[1];
        
        // Skip unwanted images
        const unwantedPatterns = [
          'logo', 'icon', 'badge', 'placeholder', 'button', 'banner',
          '/wp-content/themes/', '/wp-content/plugins/',
          'facebook', 'twitter', 'instagram', 'social',
          'favicon', 'header', 'footer', 'menu', 'nav'
        ];
        
        const isUnwanted = unwantedPatterns.some(pattern =>
          url.toLowerCase().includes(pattern.toLowerCase())
        );
        
        if (isUnwanted) continue;
        
        // Make URL absolute
        if (!url.startsWith('http')) {
          url = url.startsWith('/')
            ? `https://naniauto.com${url}`
            : `https://naniauto.com/${url}`;
        }
        
        // Only add if it's a new URL and we haven't reached the limit
        if (!seen.has(url) && images.length < 15) {
          seen.add(url);
          images.push(url);
          console.log(`Found image: ${url}`);
        }
      }
    });
    
    console.log(`Total images found: ${images.length}`);
    
    // If we didn't find any images, use a placeholder
    if (images.length === 0) {
      const placeholder = 'https://naniauto.com/wp-content/uploads/2023/06/naniauto-logo.png';
      images.push(placeholder);
      console.log(`No images found, using placeholder: ${placeholder}`);
    }
    
    return images;
  },
  
  normalizeBodyType(bodyType) {
    const lower = bodyType.toLowerCase();
    if (lower.includes('fourgon') || lower.includes('van')) return 'Van';
    if (lower.includes('suv')) return 'SUV';
    if (lower.includes('sedan') || lower.includes('berline')) return 'Sedan';
    if (lower.includes('truck') || lower.includes('camion')) return 'Truck';
    if (lower.includes('coupe') || lower.includes('coupé')) return 'Coupe';
    if (lower.includes('hatch')) return 'Hatchback';
    if (lower.includes('wagon')) return 'Wagon';
    return bodyType;
  },
  
  normalizeFuelType(fuel) {
    const lower = fuel.toLowerCase();
    if (lower.includes('essence') || lower.includes('gas')) return 'Gasoline';
    if (lower.includes('diesel')) return 'Diesel';
    if (lower.includes('electric') || lower.includes('électrique')) return 'Electric';
    if (lower.includes('hybrid') || lower.includes('hybride')) return 'Hybrid';
    return fuel;
  },
  
  normalizeTransmission(trans) {
    const lower = trans.toLowerCase();
    if (lower.includes('auto')) return 'Automatic';
    if (lower.includes('manual') || lower.includes('manuelle')) return 'Manual';
    return trans;
  },
  
  normalizeColor(color) {
    const lower = color.toLowerCase();
    if (lower.includes('white') || lower.includes('blanc')) return 'White';
    if (lower.includes('black') || lower.includes('noir')) return 'Black';
    if (lower.includes('gray') || lower.includes('grey') || lower.includes('gris')) return 'Gray';
    if (lower.includes('silver') || lower.includes('argent')) return 'Silver';
    if (lower.includes('red') || lower.includes('rouge')) return 'Red';
    if (lower.includes('blue') || lower.includes('bleu')) return 'Blue';
    return color;
  },
  
  async uploadImagesToCloudflare(imageUrls, vehicleId, env) {
    const uploadedImages = [];
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = env.CF_IMAGES_TOKEN || env.CLOUDFLARE_IMAGES_TOKEN;
    const accountHash = env.CLOUDFLARE_IMAGES_ACCOUNT_HASH;
    
    if (!apiToken || !accountId || !accountHash) {
      console.log('⚠️  Missing Cloudflare Images credentials');
      return imageUrls;
    }
    
    for (let i = 0; i < Math.min(imageUrls.length, 15); i++) {
      try {
        const imageUrl = imageUrls[i];
        
        // Download image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          console.error(`Failed to download: ${imageUrl}`);
          uploadedImages.push(imageUrl);
          continue;
        }
        
        const imageBlob = await imageResponse.blob();
        const imageId = `AutoPrets123-${vehicleId}-${i + 1}`.replace(/[^a-zA-Z0-9-]/g, '-');
        
        // Upload to Cloudflare Images
        const formData = new FormData();
        formData.append('file', imageBlob);
        formData.append('id', imageId);
        formData.append('metadata', JSON.stringify({
          vehicleId: vehicleId,
          source: 'naniauto',
          originalUrl: imageUrl,
          index: i + 1,
          project: 'AutoPrets123',
          projectId: 'auto-pret-123',
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
        
        if (uploadResponse.ok) {
          const result = await uploadResponse.json();
          if (result.success) {
            const cfImageUrl = `https://imagedelivery.net/${accountHash}/${imageId}/public`;
            uploadedImages.push(cfImageUrl);
            console.log(`✅ Uploaded: ${cfImageUrl}`);
          } else {
            console.error(`❌ Upload failed:`, JSON.stringify(result.errors));
            uploadedImages.push(imageUrl);
          }
        } else {
          console.error(`❌ Upload request failed: ${uploadResponse.status}`);
          uploadedImages.push(imageUrl);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error uploading image ${i + 1}:`, error.message);
        uploadedImages.push(imageUrls[i]);
      }
    }
    
    return uploadedImages.length > 0 ? uploadedImages : imageUrls;
  }
};
