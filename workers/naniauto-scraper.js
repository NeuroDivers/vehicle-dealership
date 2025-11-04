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
          // Simulate scraping - in production, this would be actual web scraping
          vehicles = await this.generateSampleVehicles();
          console.log(`Generated ${vehicles.length} sample vehicles`);
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
  
  async generateSampleVehicles() {
    // Generate sample vehicles for testing
    return [
      {
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        price: 28500,
        vin: 'NANI1234567890123',
        stockNumber: 'NA1001',
        bodyType: 'Sedan',
        color: 'Silver',
        odometer: 5000,
        fuelType: 'Gasoline',
        transmission: 'Automatic',
        drivetrain: 'FWD',
        engineSize: '2.5L',
        cylinders: 4,
        description: '2023 Toyota Camry - Low miles, great condition',
        images: ['https://naniauto.example.com/images/camry1.jpg', 'https://naniauto.example.com/images/camry2.jpg']
      },
      {
        make: 'Honda',
        model: 'CR-V',
        year: 2022,
        price: 32000,
        vin: 'NANI2345678901234',
        stockNumber: 'NA1002',
        bodyType: 'SUV',
        color: 'Blue',
        odometer: 12000,
        fuelType: 'Gasoline',
        transmission: 'Automatic',
        drivetrain: 'AWD',
        engineSize: '1.5L',
        cylinders: 4,
        description: '2022 Honda CR-V - AWD, great for all seasons',
        images: ['https://naniauto.example.com/images/crv1.jpg', 'https://naniauto.example.com/images/crv2.jpg']
      },
      {
        make: 'Ford',
        model: 'F-150',
        year: 2021,
        price: 42000,
        vin: 'NANI3456789012345',
        stockNumber: 'NA1003',
        bodyType: 'Truck',
        color: 'Red',
        odometer: 18000,
        fuelType: 'Gasoline',
        transmission: 'Automatic',
        drivetrain: '4WD',
        engineSize: '5.0L',
        cylinders: 8,
        description: '2021 Ford F-150 - Powerful V8, 4WD',
        images: ['https://naniauto.example.com/images/f150-1.jpg', 'https://naniauto.example.com/images/f150-2.jpg']
      }
    ];
  }
};
