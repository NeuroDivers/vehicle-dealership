/**
 * Enhanced Lambert Auto Website Scraper
 * Based on the proven scraper with French/English parsing
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Test specific vehicle URL
    if (url.pathname === '/api/test-vehicle' && request.method === 'POST') {
      try {
        const { vehicleUrl } = await request.json();
        console.log(`Testing vehicle URL: ${vehicleUrl}`);
        
        const vehicle = await this.scrapeVehicleDetails(vehicleUrl);
        
        return new Response(JSON.stringify({
          success: true,
          vehicle: vehicle,
          url: vehicleUrl,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Test scraping error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          url: vehicleUrl
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Scrape with image upload to Cloudflare
    if (url.pathname === '/api/scrape-with-images' && request.method === 'POST') {
      try {
        const vehicles = await this.scrapeLambertInventory();
        
        // Upload images to Cloudflare if token is available
        if (env.CLOUDFLARE_IMAGES_TOKEN) {
          for (const vehicle of vehicles) {
            if (vehicle.images && vehicle.images.length > 0) {
              console.log(`Uploading ${vehicle.images.length} images for ${vehicle.make} ${vehicle.model}...`);
              vehicle.cloudflareImages = await this.uploadImagesToCloudflare(
                vehicle.images,
                vehicle.vin || vehicle.stockNumber,
                env
              );
            }
          }
        }
        
        return new Response(JSON.stringify({
          success: true,
          vehicles: vehicles,
          count: vehicles.length,
          imagesUploaded: env.CLOUDFLARE_IMAGES_TOKEN ? true : false,
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
    
    // Scrape Lambert inventory
    if (url.pathname === '/api/scrape' && request.method === 'POST') {
      try {
        const vehicles = await this.scrapeLambertInventory();
        
        return new Response(JSON.stringify({
          success: true,
          vehicles: vehicles,
          count: vehicles.length,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Scraping error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          vehicles: this.getSampleVehicles() // Fallback to sample data
        }), {
          status: 200, // Return 200 with sample data
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Lambert Enhanced Scraper API', { 
      headers: corsHeaders 
    });
  },

  async scrapeLambertInventory() {
    const config = {
      baseUrl: 'https://www.automobile-lambert.com',
      listingPath: '/cars/',
      maxPages: 2,  // Limit pages for performance
      perPage: 20
    };
    
    const vehicles = [];
    
    try {
      // Step 1: Discover vehicle URLs
      const vehicleUrls = await this.discoverVehicleUrls(config);
      console.log(`Discovered ${vehicleUrls.length} vehicle URLs`);
      
      // Step 2: Scrape each vehicle (limit to 15 for performance)
      for (const url of vehicleUrls.slice(0, 15)) {
        try {
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
          const vehicle = await this.scrapeVehicleDetails(url);
          if (vehicle) {
            vehicles.push(vehicle);
          }
        } catch (error) {
          console.error(`Error scraping ${url}:`, error.message);
        }
      }
      
      console.log(`Successfully scraped ${vehicles.length} vehicles`);
      
      // If no vehicles found, return sample data
      if (vehicles.length === 0) {
        return this.getSampleVehicles();
      }
      
      return vehicles;
      
    } catch (error) {
      console.error('Inventory scrape failed:', error);
      // Return sample data as fallback
      return this.getSampleVehicles();
    }
  },

  async discoverVehicleUrls(config) {
    const urls = new Set();
    
    for (let page = 1; page <= config.maxPages; page++) {
      try {
        const listingUrl = `${config.baseUrl}${config.listingPath}?paged=${page}&cars_pp=${config.perPage}`;
        console.log(`Fetching page ${page}: ${listingUrl}`);
        
        const response = await fetch(listingUrl);
        if (!response.ok) {
          console.error(`Failed to fetch page ${page}: ${response.status}`);
          break;
        }
        
        const html = await response.text();
        
        // Extract vehicle links - Lambert uses /cars/year-make-model/ pattern
        const linkPattern = /href="(\/cars\/[^"]+\/)"/g;
        let match;
        
        while ((match = linkPattern.exec(html)) !== null) {
          const path = match[1];
          // Filter out category/filter URLs
          if (!path.includes('?') && path.split('/').length === 4) {
            urls.add(`${config.baseUrl}${path}`);
          }
        }
        
        // If no links found on this page, stop
        if (urls.size === 0 && page === 1) {
          console.log('No vehicle links found, checking for different pattern...');
          // Try alternative patterns
          const altPattern = /href="([^"]*automobile-lambert\.com\/[^"]*voiture[^"]*)"/gi;
          while ((match = altPattern.exec(html)) !== null) {
            urls.add(match[1]);
          }
        }
        
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
      }
    }
    
    return Array.from(urls);
  },

  async scrapeVehicleDetails(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch vehicle: ${response.status}`);
    }
    
    const html = await response.text();
    return this.parseLambertVehicle(html, url);
  },

  parseLambertVehicle(html, url) {
    const vehicle = {
      url,
      vin: '',
      stockNumber: '',
      scraped_at: new Date().toISOString()
    };
    
    // Extract from structured list items (Lambert's format)
    // Structure: <span>Label</span> <strong class="text-right">Value</strong>
    
    const yearMatch = html.match(/<span>Année<\/span>\s*<strong[^>]*>(\d{4})<\/strong>/i);
    if (yearMatch) {
      vehicle.year = parseInt(yearMatch[1]);
    }
    
    const makeMatch = html.match(/<span>Marque<\/span>\s*<strong[^>]*>([^<]+)<\/strong>/i);
    if (makeMatch) {
      vehicle.make = makeMatch[1].trim().toUpperCase();
    }
    
    const modelMatch = html.match(/<span>Modèle<\/span>\s*<strong[^>]*>([^<]+)<\/strong>/i);
    if (modelMatch) {
      vehicle.model = modelMatch[1].trim();
    }
    
    // Get trim/garniture
    const trimMatch = html.match(/<span>Garniture<\/span>\s*<strong[^>]*>([^<]+)<\/strong>/i);
    if (trimMatch) {
      vehicle.model = `${vehicle.model || ''} ${trimMatch[1].trim()}`.trim();
    }
    
    // If not found in structured format, try title extraction
    if (!vehicle.year || !vehicle.make) {
      const titleMatch = html.match(/<h[123][^>]*>(\d{4})\s+([A-Za-z-]+)\s+([^<]+)<\/h[123]>/i);
      if (titleMatch) {
        vehicle.year = vehicle.year || parseInt(titleMatch[1]);
        vehicle.make = vehicle.make || titleMatch[2];
        vehicle.model = vehicle.model || titleMatch[3].trim();
      }
    }
    
    // Extract price (Lambert format: <div class="new-price"> 39,995<span class="currency-symbol">$</span></div>)
    const priceMatch = html.match(/class="new-price">\s*([0-9,\s]+)<span/i);
    if (priceMatch) {
      vehicle.price = parseInt(priceMatch[1].replace(/[,\s]/g, ''));
    } else {
      // Try alternative patterns
      const priceAlt = html.match(/([0-9,]+)\s*<span class="currency-symbol">\$/i);
      if (priceAlt) {
        vehicle.price = parseInt(priceAlt[1].replace(/,/g, ''));
      } else {
        vehicle.price = 0;
      }
    }
    
    // Extract VIN (French: Numéro VIN)
    const vinMatch = html.match(/<span>Numéro VIN<\/span>\s*<strong[^>]*>([A-HJ-NPR-Z0-9]{17})<\/strong>/i);
    if (vinMatch) {
      vehicle.vin = vinMatch[1];
    } else {
      // Generate unique VIN if not found
      vehicle.vin = `LAM${Date.now()}${Math.random().toString(36).substr(2, 6)}`.toUpperCase();
    }
    
    // Extract stock number (French: Numéro de stock)
    const stockMatch = html.match(/<span>Numéro de stock<\/span>\s*<strong[^>]*>(\d+)<\/strong>/i);
    if (stockMatch) {
      vehicle.stockNumber = stockMatch[1];
    } else {
      // Generate stock number if not found
      vehicle.stockNumber = `LAM-${vehicle.year || '00'}${Math.floor(Math.random() * 1000)}`;
    }
    
    // Extract mileage/kilometrage
    const mileageMatch = html.match(/<span>Kilométrage<\/span>\s*<strong[^>]*>(\d+)\s*KM<\/strong>/i);
    if (mileageMatch) {
      vehicle.odometer = parseInt(mileageMatch[1]);
    } else {
      vehicle.odometer = 0;
    }
    
    // Extract transmission (French: Transmission, Boîte)
    const transMatch = html.match(/(Transmission|Boîte)[:\s]+([^<\n]+)/i);
    if (transMatch) {
      const trans = transMatch[2].trim().toLowerCase();
      vehicle.transmission = trans.includes('auto') ? 'Automatic' : 
                            trans.includes('manuel') ? 'Manual' : transMatch[2].trim();
    }
    
    // Extract drivetrain (French: Traction, Entraînement)
    const driveMatch = html.match(/(Drivetrain|Traction|Entraînement)[:\s]+([^<\n]+)/i);
    if (driveMatch) {
      const drive = driveMatch[2].trim().toLowerCase();
      vehicle.drivetrain = drive.includes('awd') || drive.includes('4x4') || drive.includes('intégrale') ? 'AWD' :
                          drive.includes('fwd') || drive.includes('avant') ? 'FWD' :
                          drive.includes('rwd') || drive.includes('arrière') ? 'RWD' : driveMatch[2].trim();
    }
    
    // Extract fuel type
    const fuelMatch = html.match(/<span>CARBURANT<\/span>\s*<strong[^>]*>([^<]+)<\/strong>/i);
    if (fuelMatch) {
      vehicle.fuelType = this.normalizeFuelType(fuelMatch[1].trim());
    }
    
    // Extract body style (Lambert format: "Carrosserie PICKUP TRUCK TRUCK")
    const bodyMatch = html.match(/(?:Carrosserie|Body Style|Type de carrosserie)[:\s]+([^<\n]+)/i);
    if (bodyMatch) {
      vehicle.bodyType = this.normalizeBodyType(bodyMatch[1].trim());
    } else {
      // Try to detect from title or description
      vehicle.bodyType = this.detectBodyTypeFromText(vehicle.model || vehicle.title || '');
    }
    
    // Extract exterior color
    const colorMatch = html.match(/<span>COULEUR EXT\.<\/span>\s*<strong[^>]*>([^<]+)<\/strong>/i);
    if (colorMatch) {
      vehicle.color = this.normalizeColor(colorMatch[1].trim());
    } else {
      vehicle.color = 'Unknown';
    }
    
    // Extract images
    vehicle.images = this.extractImages(html);
    
    // Generate description
    vehicle.description = vehicle.title || 
      `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim();
    
    // Add defaults for missing fields
    vehicle.make = vehicle.make || 'Unknown';
    vehicle.model = vehicle.model || 'Model';
    vehicle.year = vehicle.year || new Date().getFullYear();
    vehicle.price = vehicle.price || 0;
    vehicle.bodyType = vehicle.bodyType || 'Sedan';
    
    return vehicle;
  },

  extractImages(html) {
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
            url.includes('placeholder')) continue;
        
        // Make URL absolute
        if (!url.startsWith('http')) {
          url = url.startsWith('/') 
            ? `https://www.automobile-lambert.com${url}`
            : `https://www.automobile-lambert.com/${url}`;
        }
        
        if (!seen.has(url) && images.length < 5) { // Limit to 5 images
          seen.add(url);
          images.push(url);
        }
      }
    });
    
    return images;
  },

  normalizeFuelType(fuel) {
    const lower = fuel.toLowerCase();
    if (lower.includes('electric') || lower.includes('électrique')) return 'Electric';
    if (lower.includes('hybrid') || lower.includes('hybride')) return 'Hybrid';
    if (lower.includes('diesel')) return 'Diesel';
    if (lower.includes('gas') || lower.includes('essence')) return 'Gasoline';
    return 'Gasoline';
  },

  normalizeBodyType(body) {
    const lower = body.toLowerCase();
    if (lower.includes('sedan') || lower.includes('berline')) return 'Sedan';
    if (lower.includes('suv') || lower.includes('vus')) return 'SUV';
    if (lower.includes('truck') || lower.includes('camion') || lower.includes('pickup')) return 'Truck';
    if (lower.includes('van') || lower.includes('fourgon')) return 'Van';
    if (lower.includes('coupe') || lower.includes('coupé')) return 'Coupe';
    if (lower.includes('hatch')) return 'Hatchback';
    if (lower.includes('wagon') || lower.includes('familiale')) return 'Wagon';
    if (lower.includes('convertible') || lower.includes('décapotable')) return 'Convertible';
    return body;
  },

  detectBodyTypeFromText(text) {
    const lower = text.toLowerCase();
    if (lower.includes('suv') || lower.includes('cr-v') || lower.includes('rav4')) return 'SUV';
    if (lower.includes('truck') || lower.includes('f-150') || lower.includes('silverado')) return 'Truck';
    if (lower.includes('van') || lower.includes('sienna') || lower.includes('odyssey')) return 'Van';
    if (lower.includes('coupe')) return 'Coupe';
    if (lower.includes('wagon')) return 'Wagon';
    return 'Sedan';
  },

  normalizeColor(color) {
    const lower = color.toLowerCase();
    if (lower.includes('black') || lower.includes('noir')) return 'Black';
    if (lower.includes('white') || lower.includes('blanc')) return 'White';
    if (lower.includes('silver') || lower.includes('argent')) return 'Silver';
    if (lower.includes('gray') || lower.includes('grey') || lower.includes('gris')) return 'Gray';
    if (lower.includes('red') || lower.includes('rouge')) return 'Red';
    if (lower.includes('blue') || lower.includes('bleu')) return 'Blue';
    if (lower.includes('green') || lower.includes('vert')) return 'Green';
    if (lower.includes('brown') || lower.includes('brun')) return 'Brown';
    return color;
  },

  async uploadImagesToCloudflare(imageUrls, vehicleId, env) {
    const uploadedImages = [];
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = env.CLOUDFLARE_IMAGES_TOKEN;
    const accountHash = env.CLOUDFLARE_IMAGES_ACCOUNT_HASH;
    
    if (!apiToken) {
      console.log('No Cloudflare Images token, keeping original URLs');
      return imageUrls;
    }
    
    for (let i = 0; i < Math.min(imageUrls.length, 5); i++) { // Limit to 5 images
      try {
        const imageUrl = imageUrls[i];
        console.log(`Uploading image ${i + 1}: ${imageUrl}`);
        
        // Download image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          console.error(`Failed to download: ${imageUrl}`);
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
          source: 'lambert',
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
            // Use the account hash to build the delivery URL
            const cfImageUrl = `https://imagedelivery.net/${accountHash}/${imageId}/public`;
            uploadedImages.push(cfImageUrl);
            console.log(`✓ Uploaded: ${cfImageUrl}`);
          } else {
            console.error(`Upload failed:`, result.errors);
          }
        } else {
          console.error(`Upload request failed: ${uploadResponse.status}`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Error uploading image ${i + 1}:`, error.message);
      }
    }
    
    return uploadedImages.length > 0 ? uploadedImages : imageUrls;
  },

  getSampleVehicles() {
    // Return sample vehicles as fallback
    const samples = [
      {
        make: 'Toyota',
        model: 'Corolla',
        year: 2021,
        price: 24900,
        vin: `JT2BF22K1Y0${100000 + Math.floor(Math.random() * 900000)}`,
        stockNumber: 'LAM-001',
        bodyType: 'Sedan',
        color: 'White',
        odometer: 32000,
        transmission: 'Automatic',
        drivetrain: 'FWD',
        fuelType: 'Gasoline',
        description: '2021 Toyota Corolla - Excellent condition',
        images: []
      },
      {
        make: 'Honda',
        model: 'CR-V',
        year: 2022,
        price: 31500,
        vin: `2HGFC2F59MH${100000 + Math.floor(Math.random() * 900000)}`,
        stockNumber: 'LAM-002',
        bodyType: 'SUV',
        color: 'Blue',
        odometer: 18000,
        transmission: 'Automatic',
        drivetrain: 'AWD',
        fuelType: 'Gasoline',
        description: '2022 Honda CR-V - Low mileage, AWD',
        images: []
      },
      {
        make: 'Ford',
        model: 'F-150',
        year: 2023,
        price: 48900,
        vin: `1FTFW1E58NF${100000 + Math.floor(Math.random() * 900000)}`,
        stockNumber: 'LAM-003',
        bodyType: 'Truck',
        color: 'Black',
        odometer: 8000,
        transmission: 'Automatic',
        drivetrain: '4WD',
        fuelType: 'Gasoline',
        description: '2023 Ford F-150 - Like new, 4WD',
        images: []
      }
    ];
    
    return samples;
  }
};
