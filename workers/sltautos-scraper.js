/**
 * SLT Autos Scraper Worker
 * Scrapes vehicle inventory from sltautos.com
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

    // Scrape SLT Autos inventory
    if (url.pathname === '/api/scrape' && request.method === 'POST') {
      try {
        const startTime = Date.now();
        console.log('🚀 Starting SLT Autos scrape...');
        
        const vehicles = await this.scrapeSLTAutosInventory();
        console.log(`🔍 Scraped ${vehicles.length} vehicles from SLT Autos`);
        
        // Save vehicles directly to D1 and trigger image processing
        console.log(`💾 Saving ${vehicles.length} vehicles to D1...`);
        
        let savedCount = 0;
        let updatedCount = 0;
        const vehicleIdsNeedingImages = [];
        
        for (const vehicle of vehicles) {
          try {
            // Check if vehicle exists in D1 (only check VIN if it's not empty)
            let existing = null;
            
            if (vehicle.vin && vehicle.vin.trim() !== '') {
              // If we have a VIN, search by VIN first (get images field too)
              existing = await env.DB.prepare(`
                SELECT id, images FROM vehicles WHERE vin = ? LIMIT 1
              `).bind(vehicle.vin).first();
            }
            
            // If no VIN match, try make/model/year
            if (!existing) {
              existing = await env.DB.prepare(`
                SELECT id, images FROM vehicles 
                WHERE make = ? AND model = ? AND year = ?
                LIMIT 1
              `).bind(vehicle.make, vehicle.model, vehicle.year).first();
            }
            
            if (existing) {
              // Check if existing vehicle already has Cloudflare image IDs
              const existingImages = existing.images ? JSON.parse(existing.images) : [];
              const hasCloudflareIds = existingImages.length > 0 && 
                typeof existingImages[0] === 'string' && 
                !existingImages[0].startsWith('http');
              
              // Update existing vehicle (preserve Cloudflare IDs if they exist)
              const imagesToSave = hasCloudflareIds ? existing.images : JSON.stringify(vehicle.images || []);
              
              await env.DB.prepare(`
                UPDATE vehicles SET
                  make = ?, model = ?, year = ?, price = ?, odometer = ?,
                  bodyType = ?, color = ?, vin = ?, stockNumber = ?,
                  description = ?, images = ?,
                  vendor_id = 'sltautos', vendor_name = 'SLT Autos'
                WHERE id = ?
              `).bind(
                vehicle.make, vehicle.model, vehicle.year, vehicle.price, vehicle.odometer || 0,
                vehicle.bodyType || '', vehicle.color || '', vehicle.vin || '', vehicle.stockNumber || '',
                vehicle.description || '', imagesToSave,
                existing.id
              ).run();
              
              // Only trigger image processing if we don't have Cloudflare IDs yet
              if (!hasCloudflareIds) {
                vehicleIdsNeedingImages.push(existing.id);
              }
              updatedCount++;
            } else {
              // Insert new vehicle with vendor tracking
              const result = await env.DB.prepare(`
                INSERT INTO vehicles (
                  make, model, year, price, odometer, bodyType, color, vin, stockNumber,
                  description, images, isSold,
                  vendor_id, vendor_name
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'sltautos', 'SLT Autos')
              `).bind(
                vehicle.make, vehicle.model, vehicle.year, vehicle.price, vehicle.odometer || 0,
                vehicle.bodyType || '', vehicle.color || '', vehicle.vin || '', vehicle.stockNumber || '',
                vehicle.description || '', JSON.stringify(vehicle.images || [])
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
        
        console.log(`✅ Saved ${savedCount} new vehicles, updated ${updatedCount} existing`);
        
        // Trigger image processing using service binding
        let imageJobId = null;
        if (vehicleIdsNeedingImages.length > 0) {
          imageJobId = `slt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const payload = {
            vehicleIds: vehicleIdsNeedingImages.slice(0, 20),
            batchSize: 20,
            jobId: imageJobId,
            vendorName: 'SLT Autos'
          };
          
          console.log(`📝 Triggering image processor for ${payload.vehicleIds.length} vehicles`);
          
          try {
            // Use service binding if available (worker-to-worker), fallback to HTTP
            let imgResponse;
            
            if (env.IMAGE_PROCESSOR) {
              console.log('✅ Using service binding (worker-to-worker)');
              imgResponse = await env.IMAGE_PROCESSOR.fetch(
                new Request('https://dummy/api/process-images', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                })
              );
            } else if (env.IMAGE_PROCESSOR_URL) {
              console.log('🔗 Using HTTP fallback');
              imgResponse = await fetch(env.IMAGE_PROCESSOR_URL + '/api/process-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
            } else {
              console.warn('⚠️  No image processor configured');
              imageJobId = null;
            }
            
            if (imgResponse) {
              console.log(`✅ Image processor response: ${imgResponse.status}`);
              
              if (imgResponse.ok) {
                const imgData = await imgResponse.json();
                console.log(`✅ Processed ${imgData.processed} vehicles, ${imgData.succeeded} succeeded`);
              } else {
                console.warn(`⚠️  Image processor returned ${imgResponse.status}`);
              }
            }
          } catch (err) {
            console.error('❌ Image processor trigger failed:', err.message);
          }
          
          console.log(`🚀 Image processing triggered (Job: ${imageJobId})`);
        }
        
        const duration = Math.round((Date.now() - startTime) / 1000);
        
        return new Response(JSON.stringify({
          success: true,
          vehicles: vehicles,
          count: vehicles.length,
          imageProcessingJobId: imageJobId,
          imagesUploaded: env.CF_IMAGES_TOKEN || env.CLOUDFLARE_IMAGES_TOKEN ? true : false,
          duration: duration,
          timestamp: new Date().toISOString()
        }), {
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

    return new Response('SLT Autos Scraper API', { headers: corsHeaders });
  },

  async scrapeSLTAutosInventory() {
    const vehicles = [];
    const baseUrl = 'https://sltautos.com';
    const allVehicleUrls = new Set();
    
    try {
      // Scrape multiple pages (pagination)
      let page = 1;
      let hasMorePages = true;
      const maxPages = 10; // Safety limit
      
      while (hasMorePages && page <= maxPages) {
        console.log(`Fetching SLT Autos inventory page ${page}...`);
        const pageUrl = page === 1 
          ? `${baseUrl}/en/inventory/` 
          : `${baseUrl}/en/inventory/p/${page}/`;
        
        const response = await fetch(pageUrl);
        
        if (!response.ok) {
          console.log(`Page ${page} returned ${response.status}, stopping pagination`);
          break;
        }
        
        const html = await response.text();
        
        // Extract vehicle URLs from this page
        const vehicleUrls = this.extractVehicleUrls(html, baseUrl);
        console.log(`Found ${vehicleUrls.length} vehicle URLs on page ${page}`);
        
        if (vehicleUrls.length === 0) {
          // No more vehicles, stop pagination
          hasMorePages = false;
          break;
        }
        
        // Add to set (automatically handles duplicates)
        vehicleUrls.forEach(url => allVehicleUrls.add(url));
        
        page++;
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay between pages
      }
      
      console.log(`Total unique vehicle URLs found: ${allVehicleUrls.size}`);
      
      // Scrape each vehicle detail page
      for (const vehicleUrl of allVehicleUrls) {
        try {
          await new Promise(resolve => setTimeout(resolve, 500)); // Delay to be polite
          const vehicle = await this.scrapeVehicleDetails(vehicleUrl);
          if (vehicle) {
            vehicles.push(vehicle);
          }
        } catch (error) {
          console.error(`Error scraping ${vehicleUrl}:`, error.message);
        }
      }
      
      console.log(`Successfully scraped ${vehicles.length} vehicles`);
    } catch (error) {
      console.error('Error in scrapeSLTAutosInventory:', error);
    }
    
    return vehicles;
  },

  extractVehicleUrls(html, baseUrl) {
    const urls = new Set();
    
    // Match SLT Autos detail page URLs (English version)
    const pattern = /href="(\/en\/details\/p\/\d+\/[^"]+)"/g;
    let match;
    
    while ((match = pattern.exec(html)) !== null) {
      const url = match[1].startsWith('http') ? match[1] : `${baseUrl}${match[1]}`;
      urls.add(url);
    }
    
    return Array.from(urls);
  },

  async scrapeVehicleDetails(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Extract vehicle data
      const vehicle = {
        source: 'sltautos',
        vendor_id: 'sltautos',
        vendor_name: 'SLT Autos',
        url: url
      };
      
      // Extract price from b-detail__head-price-num (handles $ symbol)
      const priceMatch = html.match(/b-detail__head-price-num[^>]*>\$?\s*([0-9,\s]+)/i);
      if (priceMatch) {
        vehicle.price = parseInt(priceMatch[1].replace(/[,\s]/g, ''));
        console.log(`✅ Price found: $${vehicle.price}`);
      } else {
        console.log('⚠️  Price not found in HTML');
      }
      
      // Extract make (supports "Make" and "Marque")
      const makeMatch = html.match(/<div class="row">[\s\S]*?<h4[^>]*>(Make|Marque)<\/h4>[\s\S]*?<p[^>]*>([^<]+)<\/p>[\s\S]*?<\/div>/i);
      if (makeMatch) {
        vehicle.make = makeMatch[2].trim();
        console.log(`✅ Make found: ${vehicle.make}`);
      } else {
        console.log('⚠️  Make not found in HTML');
      }
      
      // Extract model - Match the exact row structure (handles HTML entities)
      const modelMatch = html.match(/<div class="row">[\s\S]*?<h4[^>]*>(Model|Mod&egrave;le)<\/h4>[\s\S]*?<p[^>]*>([^<]+)<\/p>[\s\S]*?<\/div>/i);
      if (modelMatch) {
        vehicle.model = modelMatch[2].trim();
        console.log(`✅ Model found: ${vehicle.model}`);
      } else {
        console.log('⚠️  Model not found in HTML');
      }
      
      // Extract year from URL
      const yearMatch = url.match(/\/(\d{4})-/);
      if (yearMatch) {
        vehicle.year = parseInt(yearMatch[1]);
      }
      
      // Extract kilometers/odometer (supports English "Mileage" and French with HTML entities)
      const kmMatch = html.match(/<div class="row">[\s\S]*?<h4[^>]*>(Mileage|Kilometres|Odom&egrave;tre)<\/h4>[\s\S]*?<p[^>]*>([0-9,\s]+)[\s\S]*?<\/div>/i);
      if (kmMatch) {
        vehicle.odometer = parseInt(kmMatch[2].replace(/[,\sKM]/gi, ''));
        console.log(`✅ Odometer found: ${vehicle.odometer}`);
      } else {
        console.log('⚠️  Odometer not found in HTML');
        vehicle.odometer = 0;
      }
      
      // Extract body type (supports "Body Type" and "Carrosserie")
      const bodyMatch = html.match(/<div class="row">[\s\S]*?<h4[^>]*>(Body Type|Carrosserie)<\/h4>[\s\S]*?<p[^>]*>([^<]+)<\/p>[\s\S]*?<\/div>/i);
      if (bodyMatch) {
        vehicle.bodyType = this.normalizeBodyType(bodyMatch[2].trim());
        console.log(`✅ Body Type found: ${bodyMatch[2].trim()} -> ${vehicle.bodyType}`);
      } else {
        console.log('⚠️  Body Type not found in HTML');
      }
      
      // Extract engine size (Moteur/Engine field contains size like "2.4", not fuel type)
      let engineMatch = html.match(/<div class="row">[\s\S]*?<h4[^>]*>(Engine|Moteur)<\/h4>[\s\S]*?<p[^>]*>([^<]+)<\/p>[\s\S]*?<\/div>/i);
      if (engineMatch) {
        const rawEngine = engineMatch[2].trim();
        vehicle.engineSize = rawEngine.includes('L') ? rawEngine : `${rawEngine}L`;
        console.log(`✅ Engine Size found: ${rawEngine} -> ${vehicle.engineSize}`);
      } else {
        console.log('⚠️  Engine Size not found in HTML');
      }
      
      // Extract cylinders
      let cylindersMatch = html.match(/<div class="row">[\s\S]*?<h4[^>]*>(Cylinders|Cylindres)<\/h4>[\s\S]*?<p[^>]*>([^<]+)<\/p>[\s\S]*?<\/div>/i);
      if (cylindersMatch) {
        vehicle.cylinders = parseInt(cylindersMatch[2].trim());
        console.log(`✅ Cylinders found: ${vehicle.cylinders}`);
      } else {
        console.log('⚠️  Cylinders not found in HTML');
      }
      
      // NaniAuto/SLT don't have fuel type field - default to Gasoline for now
      vehicle.fuelType = 'Gasoline';
      console.log('ℹ️  Fuel Type defaulted to Gasoline (not specified on site)');
      
      // Extract transmission
      let transMatch = html.match(/<div class="row">[\s\S]*?<h4[^>]*>(Transmission)<\/h4>[\s\S]*?<p[^>]*>([^<]+)<\/p>[\s\S]*?<\/div>/i);
      if (transMatch) {
        const rawTrans = transMatch[2].trim();
        vehicle.transmission = this.normalizeTransmission(rawTrans);
        console.log(`✅ Transmission found: ${rawTrans} -> ${vehicle.transmission}`);
      } else {
        console.log('⚠️  Transmission not found in HTML');
      }
      
      // Extract color (supports "Exterior Color" and "Couleur extérieure" with HTML entities)
      const colorMatch = html.match(/<div class="row">[\s\S]*?<h4[^>]*>(Exterior Color|Couleur ext&eacute;rieure)<\/h4>[\s\S]*?<p[^>]*>([^<]+)<\/p>[\s\S]*?<\/div>/i);
      if (colorMatch) {
        vehicle.color = this.normalizeColor(colorMatch[2].trim());
        console.log(`✅ Color found: ${colorMatch[2].trim()} -> ${vehicle.color}`);
      } else {
        console.log('⚠️  Color not found in HTML');
        vehicle.color = 'Unknown';
      }
      
      // Extract VIN (supports English "Vin Number" and French with HTML entities)
      const vinMatch = html.match(/<div class="row">[\s\S]*?<h4[^>]*>(Vin Number|Vin|VIN|Num&eacute;ro d'identification)<\/h4>[\s\S]*?<p[^>]*>([A-Z0-9]{17})<\/p>[\s\S]*?<\/div>/i);
      if (vinMatch) {
        vehicle.vin = vinMatch[2].trim();
        console.log(`✅ VIN found: ${vehicle.vin}`);
      } else {
        console.log('⚠️  VIN not found in HTML');
      }
      
      // Extract images
      vehicle.images = this.extractImages(html);
      
      // Generate description
      vehicle.description = `${vehicle.year} ${vehicle.make} ${vehicle.model}`.trim();
      
      // Set stock number from URL ID
      const stockMatch = url.match(/\/p\/(\d+)\//);  
      if (stockMatch) {
        vehicle.stockNumber = `SLT-${stockMatch[1]}`;
        vehicle.vendor_stock_number = stockMatch[1];
      } else {
        console.log('⚠️  Stock number not found in URL');
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
    
    // Match image URLs
    const patterns = [
      /<img[^>]+src="([^"]+)"/g,
      /data-src="([^"]+)"/g,
      /data-lazy-src="([^"]+)"/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        let url = match[1];
        
        // Skip unwanted images
        const unwantedPatterns = [
          'logo', 'icon', 'badge', 'placeholder',
          '/wp-content/themes/', '/wp-content/plugins/',
          'facebook', 'twitter', 'instagram'
        ];
        
        const isUnwanted = unwantedPatterns.some(pattern => 
          url.toLowerCase().includes(pattern.toLowerCase())
        );
        
        if (isUnwanted) continue;
        
        // Make URL absolute
        if (!url.startsWith('http')) {
          url = url.startsWith('/') 
            ? `https://sltautos.com${url}`
            : `https://sltautos.com/${url}`;
        }
        
        if (!seen.has(url) && images.length < 15) {
          seen.add(url);
          images.push(url);
        }
      }
    });
    
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
        const imageId = `${vehicleId}-${i + 1}`.replace(/[^a-zA-Z0-9-]/g, '-');
        
        // Upload to Cloudflare Images
        const formData = new FormData();
        formData.append('file', imageBlob);
        formData.append('id', imageId);
        formData.append('metadata', JSON.stringify({
          vehicleId: vehicleId,
          source: 'sltautos',
          originalUrl: imageUrl,
          index: i + 1
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
