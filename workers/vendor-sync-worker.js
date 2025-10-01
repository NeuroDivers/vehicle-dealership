/**
 * Unified Vendor Sync Worker
 * Handles all vendor syncing including Lambert scraping and database persistence
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

    // Handle vendor sync endpoint
    if (url.pathname === '/api/sync-vendor' && request.method === 'POST') {
      try {
        const { vendorId } = await request.json();
        
        if (vendorId === 'lambert') {
          return await this.syncLambert(env, corsHeaders);
        } else if (vendorId === 'naniauto') {
          return await this.syncNaniAuto(env, corsHeaders);
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: 'Vendor not supported'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
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

    // Get vendor stats
    if (url.pathname === '/api/vendor-stats' && request.method === 'GET') {
      try {
        const stats = await env.DB.prepare(`
          SELECT 
            v.vendor_id,
            v.vendor_name,
            COUNT(CASE WHEN vh.vendor_status = 'active' THEN 1 END) as active_vehicles,
            COUNT(CASE WHEN vh.vendor_status = 'unlisted' THEN 1 END) as unlisted_vehicles,
            COUNT(CASE WHEN vh.isSold = 1 THEN 1 END) as sold_vehicles,
            MAX(vsl.sync_date) as last_sync
          FROM vendors v
          LEFT JOIN vehicles vh ON v.vendor_id = vh.vendor_id
          LEFT JOIN vendor_sync_logs vsl ON v.vendor_id = vsl.vendor_id
          GROUP BY v.vendor_id, v.vendor_name
        `).all();

        return new Response(JSON.stringify(stats.results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Not found', { status: 404 });
  },

  async syncLambert(env, corsHeaders) {
    const startTime = Date.now();
    let vehicles = [];
    
    try {
      console.log('Starting Lambert sync...');
      
      // Try to get real data from Lambert scraper using service binding
      try {
        console.log('Calling Lambert scraper via service binding...');
        
        // Use service binding instead of HTTP fetch
        const scraperRequest = new Request('https://lambert-scraper/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const scraperResponse = await env.LAMBERT_SCRAPER.fetch(scraperRequest);
        console.log(`Scraper response status: ${scraperResponse.status}`);
        
        if (scraperResponse.ok) {
          const scraperData = await scraperResponse.json();
          console.log(`Scraper data:`, JSON.stringify(scraperData).substring(0, 200));
          if (scraperData.success && scraperData.vehicles && scraperData.vehicles.length > 0) {
            console.log(`Got ${scraperData.vehicles.length} vehicles from Lambert scraper`);
            if (scraperData.imagesUploaded) {
              console.log('✓ Images uploaded to Cloudflare Images');
            }
            
            // Map vehicles from scraper
            vehicles = scraperData.vehicles.map(v => ({
              make: v.make || '',
              model: v.model || '',
              year: v.year || 0,
              price: v.price || 0,
              vin: v.vin || `LAM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              stockNumber: v.stockNumber || v.stock || '',
              bodyType: v.bodyType || '',
              color: v.color || 'Unknown',
              odometer: v.odometer || v.mileage || 0,
              description: v.description || `${v.year} ${v.make} ${v.model}`,
              // The scraper already replaces v.images with Cloudflare URLs!
              images: v.images || []
            }));
          } else {
            console.log('Lambert scraper returned no vehicles or empty response');
            console.log('Scraper success:', scraperData.success);
            console.log('Vehicles array:', scraperData.vehicles ? scraperData.vehicles.length : 'undefined');
            vehicles = [];
          }
        } else {
          console.log(`Lambert scraper request failed with status: ${scraperResponse.status}`);
          const errorText = await scraperResponse.text();
          console.log('Error response:', errorText.substring(0, 200));
          vehicles = [];
        }
      } catch (error) {
        console.log('Could not fetch from Lambert scraper:', error.message);
        console.log('Error stack:', error.stack);
        vehicles = [];
      }
      
      // Step 2: Save to database
      const existingVehicles = await env.DB.prepare(
        'SELECT vin, stockNumber FROM vehicles WHERE vendor_id = ?'
      ).bind('lambert').all();
      
      const existingVINs = new Set(existingVehicles.results.map(v => v.vin));
      const existingStockNumbers = new Set(existingVehicles.results.map(v => v.stockNumber));
      
      let newCount = 0;
      let updatedCount = 0;
      let errors = [];
      
      // Process each vehicle
      for (const vehicle of vehicles) {
        try {
          const isExisting = existingVINs.has(vehicle.vin) || existingStockNumbers.has(vehicle.stockNumber);
          
          if (isExisting) {
            // Update existing vehicle
            await env.DB.prepare(`
              UPDATE vehicles 
              SET 
                price = ?,
                last_seen_from_vendor = datetime('now'),
                vendor_status = 'active',
                updated_at = datetime('now')
              WHERE (vin = ? OR stockNumber = ?) AND vendor_id = 'lambert'
            `).bind(
              vehicle.price,
              vehicle.vin,
              vehicle.stockNumber
            ).run();
            
            updatedCount++;
          } else {
            // Insert new vehicle - including required color field
            await env.DB.prepare(`
              INSERT INTO vehicles (
                make, model, year, price, odometer, bodyType, color,
                vin, stockNumber, description, images, isSold,
                vendor_id, vendor_name, vendor_stock_number,
                last_seen_from_vendor, vendor_status, is_published
              ) VALUES (
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, 0,
                'lambert', 'Lambert Auto', ?,
                datetime('now'), 'active', 1
              )
            `).bind(
              vehicle.make,
              vehicle.model,
              vehicle.year,
              vehicle.price,
              vehicle.odometer || 0,
              vehicle.bodyType || '',
              vehicle.color || 'Unknown',
              vehicle.vin,
              vehicle.stockNumber,
              vehicle.description || '',
              JSON.stringify(vehicle.images || []),
              vehicle.stockNumber
            ).run();
            
            newCount++;
          }
        } catch (error) {
          console.error('Error processing vehicle:', vehicle.vin, error);
          errors.push(`${vehicle.vin}: ${error.message}`);
        }
      }
      
      // Mark vehicles not in current sync as unlisted
      if (vehicles.length > 0) {
        const currentVINs = vehicles.map(v => v.vin);
        const placeholders = currentVINs.map(() => '?').join(',');
        
        await env.DB.prepare(`
          UPDATE vehicles 
          SET 
            vendor_status = 'unlisted',
            last_seen_from_vendor = datetime('now')
          WHERE 
            vendor_id = 'lambert' 
            AND vendor_status = 'active'
            AND isSold = 0
            AND vin NOT IN (${placeholders})
        `).bind(...currentVINs).run();
      }
      
      // Log sync results
      const syncDuration = Math.floor((Date.now() - startTime) / 1000);
      await env.DB.prepare(`
        INSERT INTO vendor_sync_logs (
          vendor_id, vendor_name, sync_date,
          vehicles_found, new_vehicles, updated_vehicles,
          status, error_message, sync_duration_seconds
        ) VALUES (
          'lambert', 'Lambert Auto', datetime('now'),
          ?, ?, ?,
          ?, ?, ?
        )
      `).bind(
        vehicles.length,
        newCount,
        updatedCount,
        errors.length > 0 ? 'partial' : 'success',
        errors.length > 0 ? JSON.stringify(errors) : null,
        syncDuration
      ).run();
      
      return new Response(JSON.stringify({
        success: true,
        vehicles_found: vehicles.length,
        new_vehicles: newCount,
        updated_vehicles: updatedCount,
        errors: errors,
        status: errors.length > 0 ? 'partial' : 'success',
        sync_duration: syncDuration,
        debug_info: {
          scraper_called: true,
          vehicles_received: vehicles.length
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error('Sync error:', error);
      
      // Log error
      await env.DB.prepare(`
        INSERT INTO vendor_sync_logs (
          vendor_id, vendor_name, sync_date,
          vehicles_found, new_vehicles, updated_vehicles,
          status, error_message
        ) VALUES (
          'lambert', 'Lambert Auto', datetime('now'),
          0, 0, 0,
          'failed', ?
        )
      `).bind(error.message).run();
      
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },

  async uploadImagesToCloudflare(imageUrls, vehicleId, env) {
    const uploadedImages = [];
    const accountId = env.CLOUDFLARE_ACCOUNT_ID || '928f2a6b07f166d57bb4b31b9100d1f4';
    const apiToken = env.CLOUDFLARE_IMAGES_TOKEN;
    
    if (!apiToken) {
      console.log('No Cloudflare Images token configured, keeping original URLs');
      return imageUrls;
    }
    
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const imageUrl = imageUrls[i];
        console.log(`Uploading image ${i + 1}/${imageUrls.length}: ${imageUrl}`);
        
        // Download image from Lambert CDN
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          console.error(`Failed to download image: ${imageUrl}`);
          uploadedImages.push(imageUrl); // Keep original URL
          continue;
        }
        
        const imageBlob = await imageResponse.blob();
        
        // Create unique ID for the image
        const imageId = `${vehicleId}-${i + 1}`;
        
        // Upload to Cloudflare Images
        const formData = new FormData();
        formData.append('file', imageBlob);
        formData.append('id', imageId);
        formData.append('metadata', JSON.stringify({
          vehicleId: vehicleId,
          source: 'lambert',
          originalUrl: imageUrl
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
            // Store the Cloudflare Images URL
            const cfImageUrl = result.result.variants[0]; // Use first variant (usually public)
            uploadedImages.push(cfImageUrl);
            console.log(`Successfully uploaded image ${i + 1}: ${cfImageUrl}`);
          } else {
            console.error(`Upload failed for image ${i + 1}:`, result.errors);
            uploadedImages.push(imageUrl); // Keep original URL
          }
        } else {
          console.error(`Upload request failed for image ${i + 1}: ${uploadResponse.status}`);
          uploadedImages.push(imageUrl); // Keep original URL
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error uploading image ${i + 1}:`, error);
        uploadedImages.push(imageUrls[i]); // Keep original URL on error
      }
    }
    
    return uploadedImages;
  },

  getSampleLambertVehicles() {
    // Generate realistic Lambert inventory
    const timestamp = Date.now();
    const vehicles = [
      {
        make: 'Toyota',
        model: 'Camry SE',
        year: 2022,
        price: 28500,
        vin: `JT2BF22K1Y0${100000 + Math.floor(Math.random() * 900000)}`,
        stockNumber: `LAM-2201`,
        bodyType: 'Sedan',
        color: 'Silver',
        odometer: 25000,
        description: '2022 Toyota Camry SE - Excellent Condition, One Owner',
        images: []
      },
      {
        make: 'Honda',
        model: 'CR-V EX',
        year: 2021,
        price: 32000,
        vin: `5J6RM4H55ML${100000 + Math.floor(Math.random() * 900000)}`,
        stockNumber: `LAM-2102`,
        bodyType: 'SUV',
        color: 'Blue',
        odometer: 35000,
        description: '2021 Honda CR-V EX - AWD, Low Mileage, Leather Seats',
        images: []
      },
      {
        make: 'Ford',
        model: 'F-150 XLT',
        year: 2023,
        price: 45000,
        vin: `1FTFW1E58NF${100000 + Math.floor(Math.random() * 900000)}`,
        stockNumber: `LAM-2303`,
        bodyType: 'Truck',
        color: 'Black',
        odometer: 15000,
        description: '2023 Ford F-150 XLT - 4WD, Crew Cab, Like New',
        images: []
      },
      {
        make: 'Chevrolet',
        model: 'Equinox LT',
        year: 2020,
        price: 24900,
        vin: `2GNAXSEV0L6${100000 + Math.floor(Math.random() * 900000)}`,
        stockNumber: `LAM-2004`,
        bodyType: 'SUV',
        color: 'White',
        odometer: 42000,
        description: '2020 Chevrolet Equinox LT - AWD, Backup Camera',
        images: []
      },
      {
        make: 'Nissan',
        model: 'Altima SV',
        year: 2021,
        price: 26500,
        vin: `1N4BL4DV8MC${100000 + Math.floor(Math.random() * 900000)}`,
        stockNumber: `LAM-2105`,
        bodyType: 'Sedan',
        color: 'Gray',
        odometer: 28000,
        description: '2021 Nissan Altima SV - ProPILOT Assist, Sunroof',
        images: []
      },
      {
        make: 'Mazda',
        model: 'CX-5 Touring',
        year: 2022,
        price: 31500,
        vin: `JM3KFBCM8N0${100000 + Math.floor(Math.random() * 900000)}`,
        stockNumber: `LAM-2206`,
        bodyType: 'SUV',
        color: 'Red',
        odometer: 22000,
        description: '2022 Mazda CX-5 Touring - AWD, Premium Audio',
        images: []
      },
      {
        make: 'Hyundai',
        model: 'Tucson SEL',
        year: 2023,
        price: 33900,
        vin: `KM8J3CAL5PU${100000 + Math.floor(Math.random() * 900000)}`,
        stockNumber: `LAM-2307`,
        bodyType: 'SUV',
        color: 'Green',
        odometer: 8000,
        description: '2023 Hyundai Tucson SEL - Panoramic Sunroof, Safety Package',
        images: []
      },
      {
        make: 'RAM',
        model: '1500 Big Horn',
        year: 2021,
        price: 42000,
        vin: `1C6SRFFT6MN${100000 + Math.floor(Math.random() * 900000)}`,
        stockNumber: `LAM-2108`,
        bodyType: 'Truck',
        color: 'Gray',
        odometer: 31000,
        description: '2021 RAM 1500 Big Horn - 4x4, Crew Cab, Hemi V8',
        images: []
      },
      {
        make: 'Volkswagen',
        model: 'Jetta S',
        year: 2020,
        price: 19900,
        vin: `3VWN57BU5LM${100000 + Math.floor(Math.random() * 900000)}`,
        stockNumber: `LAM-2009`,
        bodyType: 'Sedan',
        color: 'White',
        odometer: 38000,
        description: '2020 Volkswagen Jetta S - Turbocharged, Great Fuel Economy',
        images: []
      },
      {
        make: 'Subaru',
        model: 'Outback Premium',
        year: 2022,
        price: 34500,
        vin: `4S4BTAFC8N3${100000 + Math.floor(Math.random() * 900000)}`,
        stockNumber: `LAM-2210`,
        bodyType: 'Wagon',
        color: 'Blue',
        odometer: 19000,
        description: '2022 Subaru Outback Premium - AWD, EyeSight Safety',
        images: []
      }
    ];
    
    console.log(`Generated ${vehicles.length} sample Lambert vehicles`);
    return vehicles;
  },

  async syncNaniAuto(env, corsHeaders) {
    console.log('Starting NaniAuto sync...');
    
    let vehicles = [];
    
    // Call NaniAuto scraper using service binding
    try {
      console.log('Calling NaniAuto scraper via service binding...');
      
      // Use service binding instead of HTTP fetch
      const scraperRequest = new Request('https://naniauto-scraper/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const scraperResponse = await env.NANIAUTO_SCRAPER.fetch(scraperRequest);
      
      console.log(`Scraper response status: ${scraperResponse.status}`);
      
      if (scraperResponse.ok) {
        const scraperData = await scraperResponse.json();
        console.log(`Scraper data:`, JSON.stringify(scraperData).substring(0, 200));
        if (scraperData.success && scraperData.vehicles && scraperData.vehicles.length > 0) {
          console.log(`Got ${scraperData.vehicles.length} vehicles from NaniAuto scraper`);
          
          vehicles = scraperData.vehicles.map(v => ({
            make: v.make || '',
            model: v.model || '',
            year: v.year || 0,
            price: v.price || 0,
            vin: v.vin || `NANI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            stockNumber: v.stockNumber || v.stock || '',
            bodyType: v.bodyType || '',
            fuelType: v.fuelType || '',
            transmission: v.transmission || '',
            color: v.color || 'Unknown',
            odometer: v.odometer || v.mileage || 0,
            description: v.description || `${v.year} ${v.make} ${v.model}`,
            images: v.images || []
          }));
        } else {
          console.log('NaniAuto scraper returned no vehicles or empty response');
          console.log('Scraper success:', scraperData.success);
          console.log('Vehicles array:', scraperData.vehicles ? scraperData.vehicles.length : 'undefined');
          vehicles = [];
        }
      } else {
        console.log(`NaniAuto scraper request failed with status: ${scraperResponse.status}`);
        const errorText = await scraperResponse.text();
        console.log('Error response:', errorText.substring(0, 200));
        vehicles = [];
      }
    } catch (error) {
      console.log('Could not fetch from NaniAuto scraper:', error.message);
      console.log('Error stack:', error.stack);
      vehicles = [];
    }
    
    // Save to database
    const existingVehicles = await env.DB.prepare(
      'SELECT vin, stockNumber FROM vehicles WHERE vendor_id = ?'
    ).bind('naniauto').all();
    
    const existingVINs = new Set(existingVehicles.results.map(v => v.vin));
    const existingStockNumbers = new Set(existingVehicles.results.map(v => v.stockNumber));
    
    let newCount = 0;
    let updatedCount = 0;
    
    for (const vehicle of vehicles) {
      try {
        const isExisting = existingVINs.has(vehicle.vin) || existingStockNumbers.has(vehicle.stockNumber);
        
        if (isExisting) {
          // Update existing vehicle
          await env.DB.prepare(`
            UPDATE vehicles 
            SET 
              price = ?,
              odometer = ?,
              last_seen_from_vendor = datetime('now'),
              vendor_status = 'active',
              updated_at = datetime('now')
            WHERE (vin = ? OR stockNumber = ?) AND vendor_id = 'naniauto'
          `).bind(
            vehicle.price,
            vehicle.odometer,
            vehicle.vin,
            vehicle.stockNumber
          ).run();
          
          updatedCount++;
        } else {
          // Insert new vehicle
          await env.DB.prepare(`
            INSERT INTO vehicles (
              make, model, year, price, odometer, bodyType, fuelType,
              transmission, color, vin, stockNumber, description, images, isSold,
              vendor_id, vendor_name, vendor_stock_number,
              last_seen_from_vendor, vendor_status, is_published
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0,
              'naniauto', 'NaniAuto', ?,
              datetime('now'), 'active', 1
            )
          `).bind(
            vehicle.make,
            vehicle.model,
            vehicle.year,
            vehicle.price,
            vehicle.odometer,
            vehicle.bodyType,
            vehicle.fuelType || 'Gasoline',
            vehicle.transmission || 'Automatic',
            vehicle.color,
            vehicle.vin,
            vehicle.stockNumber,
            vehicle.description,
            JSON.stringify(vehicle.images),
            vehicle.stockNumber
          ).run();
          
          newCount++;
        }
      } catch (error) {
        console.error(`Error saving vehicle ${vehicle.vin}:`, error.message);
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      vehicles_found: vehicles.length,
      new_vehicles: newCount,
      updated_vehicles: updatedCount,
      vendor: 'naniauto',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};
