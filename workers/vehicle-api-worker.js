/**
 * Vehicle API Worker
 * Handles all vehicle-related API endpoints
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // POST /api/auth/login - Staff login
      if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        const { email, password } = await request.json();
        
        console.log('Login attempt:', { email, passwordLength: password?.length });
        
        // Query staff table
        const staff = await env.DB.prepare(`
          SELECT id, email, name, role, is_active 
          FROM staff 
          WHERE email = ? AND password_hash = ? AND is_active = 1
        `).bind(email, password).first();
        
        console.log('Staff found:', staff ? 'Yes' : 'No');
        
        if (staff) {
          // Update last login
          await env.DB.prepare(`
            UPDATE staff SET last_login = datetime('now') WHERE id = ?
          `).bind(staff.id).run();
          
          // Generate simple token (in production, use proper JWT)
          const token = btoa(`${staff.id}:${Date.now()}`);
          
          return new Response(JSON.stringify({
            success: true,
            token,
            user: {
              id: staff.id,
              email: staff.email,
              name: staff.name,
              role: staff.role
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid email or password'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // GET /api/auth/verify - Verify auth token
      if (url.pathname === '/api/auth/verify' && request.method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({
            success: false,
            error: 'No token provided'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        try {
          const token = authHeader.substring(7);
          // Decode token (format: staffId:timestamp)
          const decoded = atob(token);
          const [staffId] = decoded.split(':');
          
          // Verify user still exists and is active
          const staff = await env.DB.prepare(`
            SELECT id, email, name, role FROM staff WHERE id = ? AND is_active = 1
          `).bind(staffId).first();
          
          if (staff) {
            return new Response(JSON.stringify({
              success: true,
              user: staff
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          } else {
            return new Response(JSON.stringify({
              success: false,
              error: 'Invalid token'
            }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        } catch (e) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid token format'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // GET /api/vehicles - Get all vehicles
      if (url.pathname === '/api/vehicles' && request.method === 'GET') {
        const { results } = await env.DB.prepare(`
          SELECT 
            id, make, model, year, price, odometer, bodyType, fuelType,
            transmission, drivetrain, color, vin, stockNumber,
            description, images, isSold,
            vendor_id, vendor_name, vendor_status, is_published, created_at
          FROM vehicles 
          WHERE (is_published = 1 OR is_published IS NULL)
            AND (vendor_status = 'active' OR vendor_status IS NULL)
            AND (isSold = 0 OR isSold IS NULL)
          ORDER BY created_at DESC
          LIMIT 500
        `).all();
        
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /api/vehicles/[id] - Get single vehicle
      if (url.pathname.match(/^\/api\/vehicles\/[\w-]+$/) && request.method === 'GET') {
        const vehicleId = url.pathname.split('/')[3];
        
        const vehicle = await env.DB.prepare(`
          SELECT * FROM vehicles WHERE id = ?
        `).bind(vehicleId).first();
        
        if (!vehicle) {
          return new Response(JSON.stringify({ error: 'Vehicle not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify(vehicle), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/vehicles - Create new vehicle
      if (url.pathname === '/api/vehicles' && request.method === 'POST') {
        const vehicle = await request.json();
        
        // Generate ID if not provided
        const id = vehicle.id || `VEH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        await env.DB.prepare(`
          INSERT INTO vehicles (
            id, make, model, year, price, odometer, bodyType, fuelType,
            transmission, drivetrain, color, vin, stockNumber,
            description, images, isSold,
            vendor_id, vendor_name, vendor_status, is_published,
            created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            datetime('now'), datetime('now')
          )
        `).bind(
          id,
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
          vehicle.vin || '',
          vehicle.stockNumber || '',
          vehicle.description || '',
          JSON.stringify(vehicle.images || []),
          vehicle.isSold || 0,
          vehicle.vendor_id || 'internal',
          vehicle.vendor_name || 'Internal Inventory',
          vehicle.vendor_status || 'active',
          vehicle.is_published !== false ? 1 : 0
        ).run();
        
        return new Response(JSON.stringify({ success: true, id }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // PUT /api/vehicles/[id] - Update vehicle
      if (url.pathname.match(/^\/api\/vehicles\/[\w-]+$/) && request.method === 'PUT') {
        const vehicleId = url.pathname.split('/')[3];
        const updates = await request.json();
        
        // Build dynamic update query
        const updateFields = [];
        const values = [];
        
        for (const [key, value] of Object.entries(updates)) {
          if (key !== 'id') {
            updateFields.push(`${key} = ?`);
            values.push(key === 'images' ? JSON.stringify(value) : value);
          }
        }
        
        if (updateFields.length === 0) {
          return new Response(JSON.stringify({ error: 'No fields to update' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        values.push(vehicleId);
        
        await env.DB.prepare(`
          UPDATE vehicles 
          SET ${updateFields.join(', ')}, updated_at = datetime('now')
          WHERE id = ?
        `).bind(...values).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // DELETE /api/vehicles/[id] - Delete vehicle
      if (url.pathname.match(/^\/api\/vehicles\/[\w-]+$/) && request.method === 'DELETE') {
        const vehicleId = url.pathname.split('/')[3];
        
        await env.DB.prepare(`
          DELETE FROM vehicles WHERE id = ?
        `).bind(vehicleId).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /api/reviews - Get all reviews
      if (url.pathname === '/api/reviews' && request.method === 'GET') {
        const { results } = await env.DB.prepare(`
          SELECT * FROM reviews 
          ORDER BY is_featured DESC, date DESC
        `).all();
        
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /api/reviews/featured - Get featured reviews only
      if (url.pathname === '/api/reviews/featured' && request.method === 'GET') {
        const { results } = await env.DB.prepare(`
          SELECT * FROM reviews 
          WHERE is_featured = 1 AND is_approved = 1
          ORDER BY date DESC
          LIMIT 10
        `).all();
        
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/reviews - Create a new review
      if (url.pathname === '/api/reviews' && request.method === 'POST') {
        const reviewData = await request.json();
        const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await env.DB.prepare(`
          INSERT INTO reviews (
            id, customer_name, rating, review_text, location, date, is_featured, is_approved
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          reviewId,
          reviewData.customer_name,
          reviewData.rating,
          reviewData.review_text,
          reviewData.location || null,
          reviewData.date,
          reviewData.is_featured || 0,
          reviewData.is_approved || 1
        ).run();
        
        return new Response(JSON.stringify({
          success: true,
          reviewId: reviewId
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // PUT /api/reviews/[id] - Update a review
      if (url.pathname.match(/^\/api\/reviews\/[\w-]+$/) && request.method === 'PUT') {
        const reviewId = url.pathname.split('/')[3];
        const reviewData = await request.json();
        
        await env.DB.prepare(`
          UPDATE reviews 
          SET customer_name = ?, rating = ?, review_text = ?, location = ?, 
              date = ?, is_featured = ?, is_approved = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          reviewData.customer_name,
          reviewData.rating,
          reviewData.review_text,
          reviewData.location || null,
          reviewData.date,
          reviewData.is_featured || 0,
          reviewData.is_approved || 1,
          reviewId
        ).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // DELETE /api/reviews/[id] - Delete a review
      if (url.pathname.match(/^\/api\/reviews\/[\w-]+$/) && request.method === 'DELETE') {
        const reviewId = url.pathname.split('/')[3];
        
        await env.DB.prepare(`
          DELETE FROM reviews WHERE id = ?
        `).bind(reviewId).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /api/admin/settings - Get site settings
      if (url.pathname === '/api/admin/settings' && request.method === 'GET') {
        const result = await env.DB.prepare(`
          SELECT settings_json FROM site_settings WHERE id = 1
        `).first();
        
        if (result && result.settings_json) {
          return new Response(result.settings_json, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Return default settings if none exist
        return new Response(JSON.stringify({
          siteName: 'Autoprêt 123',
          logo: '',
          contactEmail: 'info@autopret123.com',
          contactPhone: '514-444-2769',
          address: '',
          themeColors: {
            primary: '#10b981',
            secondary: '#059669',
            accent: '#34d399',
            headerText: '#000000'
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/admin/settings - Save site settings
      if (url.pathname === '/api/admin/settings' && request.method === 'POST') {
        const settings = await request.json();
        
        // Upsert settings
        await env.DB.prepare(`
          INSERT INTO site_settings (id, settings_json, updated_at)
          VALUES (1, ?, datetime('now'))
          ON CONFLICT(id) DO UPDATE SET 
            settings_json = excluded.settings_json,
            updated_at = datetime('now')
        `).bind(JSON.stringify(settings)).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /api/vendor-stats - Get real vendor statistics
      if (url.pathname === '/api/vendor-stats' && request.method === 'GET') {
        // Get Lambert stats
        const lambertStats = await env.DB.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN isSold = 0 OR isSold IS NULL THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN isSold = 1 THEN 1 ELSE 0 END) as sold,
            SUM(CASE WHEN vendor_status = 'unlisted' THEN 1 ELSE 0 END) as unlisted
          FROM vehicles 
          WHERE vendor_id = 'lambert' OR vendor_name LIKE '%Lambert%'
        `).first();

        // Get NaniAuto stats
        const naniautoStats = await env.DB.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN isSold = 0 OR isSold IS NULL THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN isSold = 1 THEN 1 ELSE 0 END) as sold,
            SUM(CASE WHEN vendor_status = 'unlisted' THEN 1 ELSE 0 END) as unlisted
          FROM vehicles 
          WHERE vendor_id = 'naniauto' OR vendor_name LIKE '%NaniAuto%'
        `).first();

        // Get SLT Autos stats
        const sltautosStats = await env.DB.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN isSold = 0 OR isSold IS NULL THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN isSold = 1 THEN 1 ELSE 0 END) as sold,
            SUM(CASE WHEN vendor_status = 'unlisted' THEN 1 ELSE 0 END) as unlisted
          FROM vehicles 
          WHERE vendor_id = 'sltautos' OR vendor_name LIKE '%SLT Autos%'
        `).first();

        // Get Internal stats
        const internalStats = await env.DB.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN isSold = 0 OR isSold IS NULL THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN isSold = 1 THEN 1 ELSE 0 END) as sold,
            SUM(CASE WHEN vendor_status = 'unlisted' THEN 1 ELSE 0 END) as unlisted
          FROM vehicles 
          WHERE vendor_id = 'internal' OR vendor_id IS NULL
        `).first();

        return new Response(JSON.stringify({
          lambert: {
            total_vehicles: lambertStats.total || 0,
            active_vehicles: lambertStats.active || 0,
            sold_vehicles: lambertStats.sold || 0,
            unlisted_vehicles: lambertStats.unlisted || 0
          },
          naniauto: {
            total_vehicles: naniautoStats.total || 0,
            active_vehicles: naniautoStats.active || 0,
            sold_vehicles: naniautoStats.sold || 0,
            unlisted_vehicles: naniautoStats.unlisted || 0
          },
          sltautos: {
            total_vehicles: sltautosStats.total || 0,
            active_vehicles: sltautosStats.active || 0,
            sold_vehicles: sltautosStats.sold || 0,
            unlisted_vehicles: sltautosStats.unlisted || 0
          },
          internal: {
            total_vehicles: internalStats.total || 0,
            active_vehicles: internalStats.active || 0,
            sold_vehicles: internalStats.sold || 0,
            unlisted_vehicles: internalStats.unlisted || 0
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/leads - Create a new lead
      if (url.pathname === '/api/leads' && request.method === 'POST') {
        const leadData = await request.json();
        
        // Generate unique ID
        const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Calculate lead score (simple scoring based on completeness)
        let leadScore = 50; // Base score
        if (leadData.message && leadData.message.length > 20) leadScore += 20;
        if (leadData.preferred_contact) leadScore += 10;
        if (leadData.inquiry_type === 'financing') leadScore += 20;
        
        await env.DB.prepare(`
          INSERT INTO leads (
            id, vehicle_id, vehicle_make, vehicle_model, vehicle_year, vehicle_price,
            customer_name, customer_email, customer_phone, message,
            inquiry_type, preferred_contact, lead_score, status, source, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          leadId,
          leadData.vehicle_id,
          leadData.vehicle_make,
          leadData.vehicle_model,
          leadData.vehicle_year,
          leadData.vehicle_price,
          leadData.customer_name,
          leadData.customer_email,
          leadData.customer_phone,
          leadData.message || null,
          leadData.inquiry_type || 'general',
          leadData.preferred_contact || 'email',
          leadScore,
          'new',
          leadData.source || 'website',
          leadData.timestamp || new Date().toISOString()
        ).run();
        
        return new Response(JSON.stringify({
          success: true,
          leadId: leadId,
          message: 'Lead created successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response('Not found', { 
        status: 404,
        headers: corsHeaders 
      });
      
    } catch (error) {
      console.error('API error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
