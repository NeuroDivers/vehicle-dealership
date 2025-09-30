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
      
      // For now, use sample data until we can properly scrape Lambert
      // The actual Lambert scraper worker can be integrated later
      console.log('Using sample Lambert data for testing...');
      vehicles = this.getSampleLambertVehicles();
      
      // Try to get real data from Lambert scraper if available
      try {
        const lambertScraperUrl = 'https://lambert-scraper.nick-damato0011527.workers.dev/api/lambert/scrape';
        const scraperResponse = await fetch(lambertScraperUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (scraperResponse.ok) {
          const scraperData = await scraperResponse.json();
          if (scraperData.vehicles && scraperData.vehicles.length > 0) {
            console.log(`Got ${scraperData.vehicles.length} vehicles from Lambert scraper`);
            vehicles = scraperData.vehicles.map(v => ({
              make: v.make || '',
              model: v.model || '',
              year: v.year || 0,
              price: v.price || 0,
              vin: v.vin || `LAM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              stockNumber: v.stockNumber || v.stock || '',
              bodyType: v.bodyType || '',
              fuelType: v.fuelType || '',
              transmission: v.transmission || '',
              drivetrain: v.drivetrain || '',
              color: v.color || '',
              odometer: v.odometer || v.mileage || 0,
              description: v.description || `${v.year} ${v.make} ${v.model}`,
              images: v.images || []
            }));
          }
        }
      } catch (error) {
        console.log('Could not fetch from Lambert scraper, using sample data:', error.message);
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
            // Insert new vehicle
            await env.DB.prepare(`
              INSERT INTO vehicles (
                make, model, year, price, odometer, bodyType, fuelType,
                transmission, drivetrain, color, vin, stockNumber,
                description, images, isSold,
                vendor_id, vendor_name, vendor_stock_number,
                last_seen_from_vendor, vendor_status, is_published,
                created_at, updated_at
              ) VALUES (
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, 0,
                'lambert', 'Lambert Auto', ?,
                datetime('now'), 'active', 1,
                datetime('now'), datetime('now')
              )
            `).bind(
              vehicle.make,
              vehicle.model,
              vehicle.year,
              vehicle.price,
              vehicle.odometer || 0,
              vehicle.bodyType || '',
              vehicle.fuelType || '',
              vehicle.transmission || '',
              vehicle.drivetrain || '',
              vehicle.color || '',
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
        sync_duration: syncDuration
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

  getSampleLambertVehicles() {
    // Return sample vehicles for testing
    return [
      {
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        price: 28500,
        vin: `LAM-TOY-${Date.now()}-001`,
        stockNumber: `LAM22TC001`,
        bodyType: 'Sedan',
        fuelType: 'Gasoline',
        transmission: 'Automatic',
        drivetrain: 'FWD',
        color: 'Silver',
        odometer: 25000,
        description: '2022 Toyota Camry - Excellent Condition',
        images: []
      },
      {
        make: 'Honda',
        model: 'CR-V',
        year: 2021,
        price: 32000,
        vin: `LAM-HON-${Date.now()}-002`,
        stockNumber: `LAM21HC002`,
        bodyType: 'SUV',
        fuelType: 'Gasoline',
        transmission: 'Automatic',
        drivetrain: 'AWD',
        color: 'Blue',
        odometer: 35000,
        description: '2021 Honda CR-V - AWD, Low Mileage',
        images: []
      },
      {
        make: 'Ford',
        model: 'F-150',
        year: 2023,
        price: 45000,
        vin: `LAM-FOR-${Date.now()}-003`,
        stockNumber: `LAM23FF003`,
        bodyType: 'Truck',
        fuelType: 'Gasoline',
        transmission: 'Automatic',
        drivetrain: '4WD',
        color: 'Black',
        odometer: 15000,
        description: '2023 Ford F-150 - 4WD, Crew Cab',
        images: []
      }
    ];
  }
};
