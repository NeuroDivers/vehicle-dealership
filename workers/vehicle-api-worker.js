/**
 * Vehicle API Worker
 * Handles all vehicle-related API endpoints
 */

import bcrypt from 'bcryptjs';

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
        
        // Query staff table - get user by email first
        const staff = await env.DB.prepare(`
          SELECT id, email, name, role, is_active, password_hash
          FROM staff 
          WHERE email = ? AND is_active = 1
        `).bind(email).first();
        
        // Verify password using bcrypt
        const passwordMatch = staff ? await bcrypt.compare(password, staff.password_hash) : false;
        
        if (staff && passwordMatch) {
          
          // Remove password_hash from response
          delete staff.password_hash;
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
              authenticated: true,
              success: true,
              user: staff
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          } else {
            return new Response(JSON.stringify({
              authenticated: false,
              success: false,
              error: 'Invalid token'
            }), {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        } catch (e) {
          return new Response(JSON.stringify({
            authenticated: false,
            success: false,
            error: 'Invalid token format'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // GET /api/staff - Get all staff
      if (url.pathname === '/api/staff' && request.method === 'GET') {
        const { results } = await env.DB.prepare(`
          SELECT id, email, name, role, phone, is_active, last_login, created_at
          FROM staff
          ORDER BY created_at DESC
        `).all();
        
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/staff - Create new staff member
      if (url.pathname === '/api/staff' && request.method === 'POST') {
        const staffData = await request.json();
        const staffId = `staff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Hash the password
        const plainPassword = staffData.password || 'changeme123';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        
        await env.DB.prepare(`
          INSERT INTO staff (id, email, name, password_hash, role, phone, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          staffId,
          staffData.email,
          staffData.name,
          hashedPassword,
          staffData.role || 'staff',
          staffData.phone || '',
          staffData.is_active !== undefined ? staffData.is_active : 1
        ).run();
        
        return new Response(JSON.stringify({ success: true, id: staffId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // PUT /api/staff/[id] - Update staff member
      if (url.pathname.match(/^\/api\/staff\/[\w-]+$/) && request.method === 'PUT') {
        const staffId = url.pathname.split('/')[3];
        const updates = await request.json();
        
        let updateFields = [];
        let values = [];
        
        if (updates.name !== undefined) {
          updateFields.push('name = ?');
          values.push(updates.name);
        }
        if (updates.email !== undefined) {
          updateFields.push('email = ?');
          values.push(updates.email);
        }
        if (updates.role !== undefined) {
          updateFields.push('role = ?');
          values.push(updates.role);
        }
        if (updates.phone !== undefined) {
          updateFields.push('phone = ?');
          values.push(updates.phone);
        }
        if (updates.is_active !== undefined) {
          updateFields.push('is_active = ?');
          values.push(updates.is_active);
        }
        if (updates.password !== undefined) {
          updateFields.push('password_hash = ?');
          const hashedPassword = await bcrypt.hash(updates.password, 10);
          values.push(hashedPassword);
        }
        
        updateFields.push('updated_at = datetime(\'now\')');
        values.push(staffId);
        
        await env.DB.prepare(`
          UPDATE staff SET ${updateFields.join(', ')} WHERE id = ?
        `).bind(...values).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // DELETE /api/staff/[id] - Delete staff member
      if (url.pathname.match(/^\/api\/staff\/[\w-]+$/) && request.method === 'DELETE') {
        const staffId = url.pathname.split('/')[3];
        
        await env.DB.prepare(`
          DELETE FROM staff WHERE id = ?
        `).bind(staffId).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /api/analytics/dashboard - Get analytics dashboard data
      if (url.pathname === '/api/analytics/dashboard' && request.method === 'GET') {
        const timeRange = url.searchParams.get('timeRange') || '7d';
        
        // Parse time range
        let daysAgo = 7;
        if (timeRange.endsWith('d')) daysAgo = parseInt(timeRange);
        else if (timeRange === '1m') daysAgo = 30;
        else if (timeRange === '3m') daysAgo = 90;
        
        // Helper function to safely query analytics tables
        const safeQuery = async (query) => {
          try {
            return await query;
          } catch (error) {
            console.log('Analytics table query failed (table may not exist):', error.message);
            return null;
          }
        };
        
        // Get vehicle views
        const vehicleViews = await safeQuery(env.DB.prepare(`
          SELECT COUNT(*) as totalViews, COUNT(DISTINCT vehicle_id) as uniqueVehicles, COUNT(DISTINCT visitor_id) as uniqueVisitors
          FROM vehicle_views
          WHERE viewed_at >= datetime('now', '-${daysAgo} days')
        `).first());
        
        // Get search stats
        const searchStats = await safeQuery(env.DB.prepare(`
          SELECT COUNT(*) as totalSearches, COUNT(DISTINCT query) as uniqueQueries, AVG(result_count) as avgResults
          FROM search_analytics
          WHERE searched_at >= datetime('now', '-${daysAgo} days')
        `).first());
        
        // Get lead stats
        const leadStats = await safeQuery(env.DB.prepare(`
          SELECT 
            COUNT(*) as totalLeads,
            SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as newLeads,
            SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contactedLeads,
            SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) as qualifiedLeads,
            SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closedLeads,
            AVG(score) as avgLeadScore
          FROM leads
          WHERE created_at >= datetime('now', '-${daysAgo} days')
        `).first());
        
        // Get top vehicles
        const topVehiclesResult = await safeQuery(env.DB.prepare(`
          SELECT v.id as vehicle_id, v.make, v.model, v.year, COUNT(*) as viewCount
          FROM vehicle_views vv
          JOIN vehicles v ON vv.vehicle_id = v.id
          WHERE vv.viewed_at >= datetime('now', '-${daysAgo} days')
          GROUP BY v.id, v.make, v.model, v.year
          ORDER BY viewCount DESC
          LIMIT 10
        `).all());
        
        // Get popular searches
        const popularSearchesResult = await safeQuery(env.DB.prepare(`
          SELECT query, COUNT(*) as count, AVG(result_count) as avgResults
          FROM search_analytics
          WHERE searched_at >= datetime('now', '-${daysAgo} days')
          GROUP BY query
          ORDER BY count DESC
          LIMIT 10
        `).all());
        
        // Get staff performance
        const staffPerformanceResult = await safeQuery(env.DB.prepare(`
          SELECT assigned_to, COUNT(*) as totalLeads, 
                 SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closedLeads,
                 AVG(score) as avgScore
          FROM leads
          WHERE created_at >= datetime('now', '-${daysAgo} days') AND assigned_to IS NOT NULL
          GROUP BY assigned_to
          ORDER BY totalLeads DESC
        `).all());
        
        // Get daily trends
        const dailyTrendsResult = await safeQuery(env.DB.prepare(`
          SELECT DATE(viewed_at) as date, COUNT(*) as views
          FROM vehicle_views
          WHERE viewed_at >= datetime('now', '-${daysAgo} days')
          GROUP BY DATE(viewed_at)
          ORDER BY date ASC
        `).all());
        
        // Get referrer stats
        const referrerStatsResult = await safeQuery(env.DB.prepare(`
          SELECT referrer as source, COUNT(*) as count
          FROM vehicle_views
          WHERE viewed_at >= datetime('now', '-${daysAgo} days') AND referrer IS NOT NULL
          GROUP BY referrer
          ORDER BY count DESC
          LIMIT 10
        `).all());
        
        const dashboardData = {
          overview: {
            vehicleViews: {
              totalViews: vehicleViews?.totalViews || 0,
              uniqueVehicles: vehicleViews?.uniqueVehicles || 0,
              uniqueVisitors: vehicleViews?.uniqueVisitors || 0
            },
            searchStats: {
              totalSearches: searchStats?.totalSearches || 0,
              uniqueQueries: searchStats?.uniqueQueries || 0,
              avgResults: Math.round(searchStats?.avgResults || 0)
            },
            leadStats: {
              totalLeads: leadStats?.totalLeads || 0,
              newLeads: leadStats?.newLeads || 0,
              contactedLeads: leadStats?.contactedLeads || 0,
              qualifiedLeads: leadStats?.qualifiedLeads || 0,
              closedLeads: leadStats?.closedLeads || 0,
              avgLeadScore: Math.round((leadStats?.avgLeadScore || 0) * 10) / 10
            }
          },
          topVehicles: topVehiclesResult?.results || [],
          popularSearches: popularSearchesResult?.results || [],
          staffPerformance: staffPerformanceResult?.results || [],
          dailyTrends: dailyTrendsResult?.results || [],
          referrerStats: referrerStatsResult?.results || []
        };
        
        return new Response(JSON.stringify(dashboardData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/analytics/vehicle-views - Track vehicle view
      if (url.pathname === '/api/analytics/vehicle-views' && request.method === 'POST') {
        try {
          const viewData = await request.json();
          
          // Generate unique ID
          const viewId = `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Try to insert into vehicle_views table
          try {
            await env.DB.prepare(`
              INSERT INTO vehicle_views (
                id, vehicle_id, visitor_id, session_id, referrer, user_agent, viewed_at
              ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            `).bind(
              viewId,
              viewData.vehicleId || null,
              viewData.visitorId || null,
              viewData.sessionId || null,
              viewData.referrer || null,
              viewData.userAgent || null
            ).run();
          } catch (dbError) {
            // Silently fail if table doesn't exist yet
            console.log('Vehicle views table not available:', dbError.message);
          }
          
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Error tracking vehicle view:', error);
          // Return success anyway - analytics tracking shouldn't break the site
          return new Response(JSON.stringify({ success: true }), {
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

      // DELETE /api/vehicles/[id] - Delete vehicle and associated images
      if (url.pathname.match(/^\/api\/vehicles\/[\w-]+$/) && request.method === 'DELETE') {
        const vehicleId = url.pathname.split('/')[3];
        
        try {
          // Get vehicle data first to find VIN/stockNumber for image deletion
          const vehicle = await env.DB.prepare(`
            SELECT vin, stockNumber, images FROM vehicles WHERE id = ?
          `).bind(vehicleId).first();
          
          if (vehicle) {
            // Delete associated Cloudflare Images
            const imageIdentifier = vehicle.vin || vehicle.stockNumber || vehicleId;
            await this.deleteVehicleImages(imageIdentifier, env);
          }
          
          // Delete vehicle from database
          await env.DB.prepare(`
            DELETE FROM vehicles WHERE id = ?
          `).bind(vehicleId).run();
          
          return new Response(JSON.stringify({ 
            success: true,
            imagesDeleted: vehicle ? true : false
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Error deleting vehicle:', error);
          return new Response(JSON.stringify({ 
            success: false,
            error: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
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

      // GET /api/leads - Get all leads
      if (url.pathname === '/api/leads' && request.method === 'GET') {
        const { results } = await env.DB.prepare(`
          SELECT * FROM leads
          ORDER BY created_at DESC
          LIMIT 500
        `).all();
        
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET /api/leads/[id] - Get single lead
      if (url.pathname.match(/^\/api\/leads\/[\w-]+$/) && request.method === 'GET') {
        const leadId = url.pathname.split('/')[3];
        
        const lead = await env.DB.prepare(`
          SELECT * FROM leads WHERE id = ?
        `).bind(leadId).first();
        
        if (!lead) {
          return new Response(JSON.stringify({ error: 'Lead not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify(lead), {
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

      // PUT /api/leads/[id] - Update a lead
      if (url.pathname.match(/^\/api\/leads\/[\w-]+$/) && request.method === 'PUT') {
        const leadId = url.pathname.split('/')[3];
        const updateData = await request.json();
        
        // Build UPDATE query dynamically
        const updates = [];
        const bindings = [];
        
        if (updateData.status !== undefined) {
          updates.push('status = ?');
          bindings.push(updateData.status);
        }
        if (updateData.assigned_to !== undefined) {
          updates.push('assigned_to = ?');
          bindings.push(updateData.assigned_to);
        }
        if (updateData.notes !== undefined) {
          updates.push('notes = ?');
          bindings.push(updateData.notes);
        }
        if (updateData.follow_up_date !== undefined) {
          updates.push('follow_up_date = ?');
          bindings.push(updateData.follow_up_date);
        }
        
        if (updates.length === 0) {
          return new Response(JSON.stringify({ error: 'No fields to update' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        bindings.push(leadId);
        
        await env.DB.prepare(`
          UPDATE leads 
          SET ${updates.join(', ')}
          WHERE id = ?
        `).bind(...bindings).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // POST /api/leads/:id/notes - Add a note to a lead
      if (url.pathname.match(/^\/api\/leads\/[\w-]+\/notes$/) && request.method === 'POST') {
        const leadId = url.pathname.split('/')[3];
        const noteData = await request.json();
        
        const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          await env.DB.prepare(`
            INSERT INTO lead_notes (id, lead_id, staff_name, note_text, note_type, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
          `).bind(
            noteId,
            leadId,
            noteData.staff_name || 'Unknown',
            noteData.note_text,
            noteData.note_type || 'note'
          ).run();
          
          return new Response(JSON.stringify({ success: true, noteId }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (dbError) {
          console.log('Note table not available:', dbError.message);
          return new Response(JSON.stringify({ success: true, noteId }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // POST /api/leads/:id/calls - Log a call for a lead
      if (url.pathname.match(/^\/api\/leads\/[\w-]+\/calls$/) && request.method === 'POST') {
        const leadId = url.pathname.split('/')[3];
        const callData = await request.json();
        
        const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          await env.DB.prepare(`
            INSERT INTO call_logs (id, lead_id, staff_name, duration_minutes, notes, outcome, created_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
          `).bind(
            callId,
            leadId,
            callData.staff_name || 'Unknown',
            callData.duration_minutes || 0,
            callData.notes || '',
            callData.outcome || 'answered'
          ).run();
          
          return new Response(JSON.stringify({ success: true, callId }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (dbError) {
          console.log('Call logs table not available:', dbError.message);
          return new Response(JSON.stringify({ success: true, callId }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // GET /api/leads/:id/activity - Get all activity (notes + calls) for a lead
      if (url.pathname.match(/^\/api\/leads\/[\w-]+\/activity$/) && request.method === 'GET') {
        const leadId = url.pathname.split('/')[3];
        
        try {
          const notes = await env.DB.prepare(`
            SELECT * FROM lead_notes WHERE lead_id = ? ORDER BY created_at DESC
          `).bind(leadId).all();
          
          const calls = await env.DB.prepare(`
            SELECT * FROM call_logs WHERE lead_id = ? ORDER BY created_at DESC
          `).bind(leadId).all();
          
          const activity = [
            ...(notes.results || []).map(n => ({ ...n, type: 'note' })),
            ...(calls.results || []).map(c => ({ ...c, type: 'call' }))
          ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          
          return new Response(JSON.stringify(activity), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (dbError) {
          console.log('Activity tables not available:', dbError.message);
          return new Response(JSON.stringify([]), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
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
  },

  async deleteVehicleImages(vehicleIdentifier, env) {
    const accountId = env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = env.CF_IMAGES_TOKEN || env.CLOUDFLARE_IMAGES_TOKEN;
    
    if (!apiToken || !accountId) {
      console.log('No Cloudflare Images credentials, skipping image deletion');
      return;
    }
    
    console.log(`Deleting images for vehicle: ${vehicleIdentifier}`);
    
    // Try to delete up to 20 images (more than we upload, to be safe)
    const deletePromises = [];
    for (let i = 1; i <= 20; i++) {
      const imageId = `${vehicleIdentifier}-${i}`.replace(/[^a-zA-Z0-9-]/g, '-');
      
      const deletePromise = fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${imageId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${apiToken}`
          }
        }
      ).then(response => {
        if (response.ok) {
          console.log(`✓ Deleted image: ${imageId}`);
          return { success: true, imageId };
        } else if (response.status === 404) {
          // Image doesn't exist, that's fine
          return { success: true, imageId, notFound: true };
        } else {
          console.log(`✗ Failed to delete ${imageId}: ${response.status}`);
          return { success: false, imageId };
        }
      }).catch(error => {
        console.error(`Error deleting ${imageId}:`, error);
        return { success: false, imageId, error: error.message };
      });
      
      deletePromises.push(deletePromise);
    }
    
    // Wait for all deletions to complete
    const results = await Promise.all(deletePromises);
    const deletedCount = results.filter(r => r.success && !r.notFound).length;
    console.log(`Deleted ${deletedCount} images for vehicle ${vehicleIdentifier}`);
    
    return results;
  }
};
