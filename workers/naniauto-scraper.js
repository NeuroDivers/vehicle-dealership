/**
 * NaniAuto Scraper Worker
 * Scrapes vehicle inventory from naniauto.com
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

    // Scrape NaniAuto inventory
    if (url.pathname === '/api/scrape' && request.method === 'POST') {
      try {
        const startTime = Date.now();
        console.log('🚀 Starting NaniAuto scrape...');
        
        const vehicles = await this.scrapeNaniAutoInventory();
        console.log(`🔍 Scraped ${vehicles.length} vehicles from NaniAuto`);
        
        // NEW APPROACH: Save vehicles with vendor URLs, trigger async image processing
        console.log(`💾 Saving ${vehicles.length} vehicles with vendor URLs (async image processing will follow)`);
        
        // Collect vehicle IDs that need image processing
        const vehicleIdsNeedingImages = [];
        for (const vehicle of vehicles) {
          if (vehicle.images && vehicle.images.length > 0) {
            // Keep vendor URLs for now - image processor will convert them
            vehicleIdsNeedingImages.push(vehicle.id || vehicle.vin);
          }
        }
        
        // Trigger async image processing (fire-and-forget)
        let imageJobId = null;
        if (vehicleIdsNeedingImages.length > 0 && env.IMAGE_PROCESSOR_URL) {
          imageJobId = `nani-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          console.log(`🚀 Triggering async image processing for ${vehicleIdsNeedingImages.length} vehicles (Job: ${imageJobId})...`);
          
          fetch(env.IMAGE_PROCESSOR_URL + '/api/process-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vehicleIds: vehicleIdsNeedingImages.slice(0, 10),
              batchSize: 10,
              jobId: imageJobId,
              vendorName: 'Nani Auto'
            })
          }).catch(err => {
            console.warn('⚠️  Image processor trigger failed (images will remain as vendor URLs):', err.message);
          });
        } else {
          console.log('ℹ️  Image processing disabled (set IMAGE_PROCESSOR_URL to enable)');
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

    return new Response('NaniAuto Scraper API', { headers: corsHeaders });
  },

  async scrapeNaniAutoInventory() {
    const vehicles = [];
    const baseUrl = 'https://naniauto.com';
    const allVehicleUrls = new Set();
    
    try {
      // Scrape multiple pages (pagination)
      let page = 1;
      let hasMorePages = true;
      const maxPages = 10; // Safety limit
      
      while (hasMorePages && page <= maxPages) {
        console.log(`Fetching NaniAuto inventory page ${page}...`);
        const pageUrl = page === 1 
          ? `${baseUrl}/fr/inventory/` 
          : `${baseUrl}/fr/inventory/p/${page}/`;
        
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
      console.error('Error in scrapeNaniAutoInventory:', error);
    }
    
    return vehicles;
  },

  extractVehicleUrls(html, baseUrl) {
    const urls = new Set();
    
    // Match NaniAuto detail page URLs
    const pattern = /href="(\/fr\/details\/p\/\d+\/[^"]+)"/g;
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
        source: 'naniauto',
        vendor_id: 'naniauto',
        vendor_name: 'NaniAuto',
        url: url
      };
      
      // Extract price from b-detail__head-price-num
      const priceMatch = html.match(/b-detail__head-price-num[^>]*>([0-9,\s]+)/i);
      if (priceMatch) {
        vehicle.price = parseInt(priceMatch[1].replace(/[,\s]/g, ''));
      }
      
      // Extract make from b-detail__main-aside-desc-value after "Make"
      const makeMatch = html.match(/Make<\/h4>[\s\S]*?b-detail__main-aside-desc-value[^>]*>([^<]+)/i);
      if (makeMatch) {
        vehicle.make = makeMatch[1].trim();
      }
      
      // Extract model - Match the exact row structure
      const modelMatch = html.match(/<div class="row">[\s\S]*?<h4[^>]*>(Model|Modèle)<\/h4>[\s\S]*?<p[^>]*>([^<]+)<\/p>[\s\S]*?<\/div>/i);
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
      
      // Extract kilometers/odometer (supports "Kilometres" and "Odomètre")
      const kmMatch = html.match(/<div class="row">[\s\S]*?<h4[^>]*>(Kilometres|Odomètre)<\/h4>[\s\S]*?<p[^>]*>([0-9,\s]+)[\s\S]*?<\/div>/i);
      if (kmMatch) {
        vehicle.odometer = parseInt(kmMatch[2].replace(/[,\sKM]/gi, ''));
        console.log(`✅ Odometer found: ${vehicle.odometer}`);
      } else {
        console.log('⚠️  Odometer not found in HTML');
        vehicle.odometer = 0;
      }
      
      // Extract body type (supports "Body Type" and "Carrosserie")
      const bodyMatch = html.match(/<h4[^>]*b-detail__main-aside-desc-title[^>]*>(Body Type|Carrosserie)<\/h4>[\s\S]*?<p[^>]*b-detail__main-aside-desc-value[^>]*>([^<]+)<\/p>/i);
      if (bodyMatch) {
        vehicle.bodyType = this.normalizeBodyType(bodyMatch[2].trim());
        console.log(`✅ Body Type found: ${bodyMatch[2].trim()} -> ${vehicle.bodyType}`);
      } else {
        console.log('⚠️  Body Type not found in HTML');
      }
      
      // Extract engine size (Moteur/Engine field contains size like "2.4", not fuel type)
      let engineMatch = html.match(/<h4[^>]*b-detail__main-aside-desc-title[^>]*>(Engine|Moteur)<\/h4>[\s\S]*?<p[^>]*b-detail__main-aside-desc-value[^>]*>([^<]+)<\/p>/i);
      if (engineMatch) {
        const rawEngine = engineMatch[2].trim();
        vehicle.engineSize = rawEngine.includes('L') ? rawEngine : `${rawEngine}L`;
        console.log(`✅ Engine Size found: ${rawEngine} -> ${vehicle.engineSize}`);
      } else {
        console.log('⚠️  Engine Size not found in HTML');
      }
      
      // Extract cylinders
      let cylindersMatch = html.match(/<h4[^>]*b-detail__main-aside-desc-title[^>]*>(Cylinders|Cylindres)<\/h4>[\s\S]*?<p[^>]*b-detail__main-aside-desc-value[^>]*>([^<]+)<\/p>/i);
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
      let transMatch = html.match(/<h4[^>]*b-detail__main-aside-desc-title[^>]*>Transmission<\/h4>[\s\S]*?<p[^>]*b-detail__main-aside-desc-value[^>]*>([^<]+)<\/p>/i);
      if (transMatch) {
        const rawTrans = transMatch[1].trim();
        vehicle.transmission = this.normalizeTransmission(rawTrans);
        console.log(`✅ Transmission found: ${rawTrans} -> ${vehicle.transmission}`);
      } else {
        console.log('⚠️  Transmission not found in HTML');
      }
      
      // Extract color (supports "Exterior Color" and "Couleur extérieure")
      const colorMatch = html.match(/<div class="row">[\s\S]*?<h4[^>]*>(Exterior Color|Couleur extérieure)<\/h4>[\s\S]*?<p[^>]*>([^<]+)<\/p>[\s\S]*?<\/div>/i);
      if (colorMatch) {
        vehicle.color = this.normalizeColor(colorMatch[2].trim());
        console.log(`✅ Color found: ${colorMatch[2].trim()} -> ${vehicle.color}`);
      } else {
        console.log('⚠️  Color not found in HTML');
        vehicle.color = 'Unknown';
      }
      
      // Extract VIN (supports "Vin" and "Numéro d'identification")
      const vinMatch = html.match(/<div class="row">[\s\S]*?<h4[^>]*>(Vin|Numéro d'identification)<\/h4>[\s\S]*?<p[^>]*>([A-Z0-9]{17})<\/p>[\s\S]*?<\/div>/i);
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
            ? `https://naniauto.com${url}`
            : `https://naniauto.com/${url}`;
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
          source: 'naniauto',
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
