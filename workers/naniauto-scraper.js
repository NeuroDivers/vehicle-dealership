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
        
        // Upload images to Cloudflare if token is available
        if (env.CF_IMAGES_TOKEN || env.CLOUDFLARE_IMAGES_TOKEN) {
          console.log('🖼️  Uploading images to Cloudflare Images...');
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
        
        const duration = Math.round((Date.now() - startTime) / 1000);
        
        return new Response(JSON.stringify({
          success: true,
          vehicles: vehicles,
          count: vehicles.length,
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
    
    try {
      // Fetch the inventory page
      console.log('Fetching NaniAuto inventory page...');
      const response = await fetch(`${baseUrl}/fr/inventory/`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Extract vehicle URLs from the inventory page
      const vehicleUrls = this.extractVehicleUrls(html, baseUrl);
      console.log(`Found ${vehicleUrls.length} vehicle URLs`);
      
      // Scrape each vehicle detail page
      for (const vehicleUrl of vehicleUrls) {
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
      
      // Extract price
      const priceMatch = html.match(/Prix[:\s]*<\/[^>]+>\s*<[^>]+>([0-9,\s]+)/i) ||
                        html.match(/price["\s:]+([0-9,]+)/i);
      if (priceMatch) {
        vehicle.price = parseInt(priceMatch[1].replace(/[,\s]/g, ''));
      }
      
      // Extract make
      const makeMatch = html.match(/Make[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i) ||
                       html.match(/Marque[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i);
      if (makeMatch) {
        vehicle.make = makeMatch[1].trim();
      }
      
      // Extract model
      const modelMatch = html.match(/Model[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i) ||
                        html.match(/Modèle[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i);
      if (modelMatch) {
        vehicle.model = modelMatch[1].trim();
      }
      
      // Extract year from URL or title
      const yearMatch = url.match(/\/(\d{4})-/) || html.match(/(\d{4})\s+[A-Z]/);
      if (yearMatch) {
        vehicle.year = parseInt(yearMatch[1]);
      }
      
      // Extract kilometers/odometer
      const kmMatch = html.match(/Kilom[èe]tres[:\s]*<\/[^>]+>\s*<[^>]+>([0-9,\s]+)/i);
      if (kmMatch) {
        vehicle.odometer = parseInt(kmMatch[1].replace(/[,\s]/g, ''));
      }
      
      // Extract body type
      const bodyMatch = html.match(/Body Type[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i) ||
                       html.match(/Type de carrosserie[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i);
      if (bodyMatch) {
        vehicle.bodyType = this.normalizeBodyType(bodyMatch[1].trim());
      }
      
      // Extract fuel type
      const fuelMatch = html.match(/Engine[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i) ||
                       html.match(/Moteur[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i);
      if (fuelMatch) {
        vehicle.fuelType = this.normalizeFuelType(fuelMatch[1].trim());
      }
      
      // Extract transmission
      const transMatch = html.match(/Transmission[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i);
      if (transMatch) {
        vehicle.transmission = this.normalizeTransmission(transMatch[1].trim());
      }
      
      // Extract color
      const colorMatch = html.match(/Exterior Color[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i) ||
                        html.match(/Couleur ext[ée]rieure[:\s]*<\/[^>]+>\s*<[^>]+>([^<]+)/i);
      if (colorMatch) {
        vehicle.color = this.normalizeColor(colorMatch[1].trim());
      }
      
      // Extract VIN
      const vinMatch = html.match(/VIN[:\s]*<\/[^>]+>\s*<[^>]+>([A-Z0-9]{17})/i);
      if (vinMatch) {
        vehicle.vin = vinMatch[1].trim();
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
