/**
 * Lambert Sync Worker
 * This worker handles syncing Lambert inventory to the D1 database
 * It should be deployed as a separate Cloudflare Worker
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

    // Handle sync endpoint
    if (url.pathname === '/sync-lambert' && request.method === 'POST') {
      try {
        // First, scrape Lambert inventory
        const lambertResponse = await fetch('https://lambert-scraper.nick-damato0011527.workers.dev/api/lambert/scrape-with-images', {
          method: 'POST'
        });

        if (!lambertResponse.ok) {
          throw new Error('Failed to scrape Lambert inventory');
        }

        const lambertData = await lambertResponse.json();
        const vehicles = lambertData.vehicles || [];
        
        // Get existing vehicles from database
        const existingVehicles = await env.DB.prepare(
          'SELECT vin, stockNumber, vendor_id FROM vehicles WHERE vendor_id = ?'
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
                  odometer = ?,
                  images = ?,
                  description = ?,
                  last_seen_from_vendor = CURRENT_TIMESTAMP,
                  vendor_status = 'active',
                  updated_at = CURRENT_TIMESTAMP
                WHERE (vin = ? OR stockNumber = ?) AND vendor_id = 'lambert'
              `).bind(
                vehicle.price,
                vehicle.odometer,
                JSON.stringify(vehicle.images || []),
                vehicle.description || '',
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
                  CURRENT_TIMESTAMP, 'active', 1,
                  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )
              `).bind(
                vehicle.make || '',
                vehicle.model || '',
                vehicle.year || 0,
                vehicle.price || 0,
                vehicle.odometer || 0,
                vehicle.bodyType || '',
                vehicle.fuelType || '',
                vehicle.transmission || '',
                vehicle.drivetrain || '',
                vehicle.color || '',
                vehicle.vin || '',
                vehicle.stockNumber || '',
                vehicle.description || '',
                JSON.stringify(vehicle.images || []),
                vehicle.stockNumber || ''
              ).run();
              
              newCount++;
            }
          } catch (error) {
            console.error('Error processing vehicle:', vehicle.vin, error);
            errors.push(`${vehicle.vin}: ${error.message}`);
          }
        }

        // Mark vehicles not in current sync as unlisted
        const currentVINs = vehicles.map(v => v.vin).filter(Boolean);
        const currentStockNumbers = vehicles.map(v => v.stockNumber).filter(Boolean);
        
        if (currentVINs.length > 0 || currentStockNumbers.length > 0) {
          const placeholders = [...currentVINs.map(() => '?'), ...currentStockNumbers.map(() => '?')].join(',');
          
          await env.DB.prepare(`
            UPDATE vehicles 
            SET 
              vendor_status = 'unlisted',
              last_seen_from_vendor = CURRENT_TIMESTAMP
            WHERE 
              vendor_id = 'lambert' 
              AND vendor_status = 'active'
              AND isSold = 0
              AND (
                (vin IS NOT NULL AND vin NOT IN (${currentVINs.map(() => '?').join(',')}))
                OR (stockNumber IS NOT NULL AND stockNumber NOT IN (${currentStockNumbers.map(() => '?').join(',')}))
              )
          `).bind(...currentVINs, ...currentStockNumbers).run();
        }

        // Log sync results
        await env.DB.prepare(`
          INSERT INTO vendor_sync_logs (
            vendor_id, vendor_name, sync_date,
            vehicles_found, new_vehicles, updated_vehicles,
            status, error_message
          ) VALUES (
            'lambert', 'Lambert Auto', CURRENT_TIMESTAMP,
            ?, ?, ?,
            ?, ?
          )
        `).bind(
          vehicles.length,
          newCount,
          updatedCount,
          errors.length > 0 ? 'partial' : 'success',
          errors.length > 0 ? JSON.stringify(errors) : null
        ).run();

        return new Response(JSON.stringify({
          success: true,
          vehicles_found: vehicles.length,
          new_vehicles: newCount,
          updated_vehicles: updatedCount,
          errors: errors,
          status: errors.length > 0 ? 'partial' : 'success'
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
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
            'lambert', 'Lambert Auto', CURRENT_TIMESTAMP,
            0, 0, 0,
            'failed', ?
          )
        `).bind(error.message).run();

        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }

    return new Response('Not found', { status: 404 });
  }
};
