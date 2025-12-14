/**
 * AutoPret123 Unified API Worker
 * Combines vehicle-api, feed-management-api, and vin-decoder into one worker
 * 
 * Routes:
 * - /api/vehicles/*     - Vehicle CRUD operations
 * - /api/feeds/*        - Feed management (vendor_feeds)
 * - /api/decode-vin     - VIN decoder utility
 * - /api/auth/*         - Authentication endpoints
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
      // ============================================
      // AUTHENTICATION ROUTES (from vehicle-api)
      // ============================================
      
      // POST /api/auth/login - Staff login
      if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        return await this.handleLogin(request, env, corsHeaders);
      }

      // GET /api/auth/verify - Verify auth token
      if (url.pathname === '/api/auth/verify' && request.method === 'GET') {
        return await this.handleVerifyToken(request, env, corsHeaders);
      }

      // ============================================
      // VEHICLE ROUTES (from vehicle-api)
      // ============================================
      
      // GET /api/vehicles - Get all vehicles
      if (url.pathname === '/api/vehicles' && request.method === 'GET') {
        return await this.handleGetVehicles(request, env, corsHeaders);
      }

      // GET /api/vehicles/:id - Get single vehicle
      if (url.pathname.match(/^\/api\/vehicles\/\d+$/) && request.method === 'GET') {
        const id = url.pathname.split('/').pop();
        return await this.handleGetVehicle(id, env, corsHeaders);
      }

      // PUT /api/vehicles/:id - Update vehicle
      if (url.pathname.match(/^\/api\/vehicles\/\d+$/) && request.method === 'PUT') {
        const id = url.pathname.split('/').pop();
        return await this.handleUpdateVehicle(id, request, env, corsHeaders);
      }

      // DELETE /api/vehicles/:id - Delete vehicle
      if (url.pathname.match(/^\/api\/vehicles\/\d+$/) && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        return await this.handleDeleteVehicle(id, env, corsHeaders);
      }

      // POST /api/vehicles/:id/mark-sold - Mark vehicle as sold
      if (url.pathname.match(/^\/api\/vehicles\/\d+\/mark-sold$/) && request.method === 'POST') {
        const id = url.pathname.split('/')[3];
        return await this.handleMarkSold(id, request, env, corsHeaders);
      }

      // ============================================
      // FEED MANAGEMENT ROUTES (from feed-management-api)
      // ============================================
      
      // GET /api/feeds - Get all feeds
      if (url.pathname === '/api/feeds' && request.method === 'GET') {
        return await this.handleGetFeeds(env, corsHeaders);
      }

      // GET /api/feeds/:vendorId - Get single feed
      if (url.pathname.match(/^\/api\/feeds\/[^\/]+$/) && request.method === 'GET') {
        const vendorId = url.pathname.split('/').pop();
        return await this.handleGetFeed(vendorId, env, corsHeaders);
      }

      // POST /api/feeds - Create new feed
      if (url.pathname === '/api/feeds' && request.method === 'POST') {
        return await this.handleCreateFeed(request, env, corsHeaders);
      }

      // PUT /api/feeds/:vendorId - Update feed
      if (url.pathname.match(/^\/api\/feeds\/[^\/]+$/) && request.method === 'PUT') {
        const vendorId = url.pathname.split('/').pop();
        return await this.handleUpdateFeed(vendorId, request, env, corsHeaders);
      }

      // DELETE /api/feeds/:vendorId - Delete feed
      if (url.pathname.match(/^\/api\/feeds\/[^\/]+$/) && request.method === 'DELETE') {
        const vendorId = url.pathname.split('/').pop();
        return await this.handleDeleteFeed(vendorId, env, corsHeaders);
      }

      // ============================================
      // VIN DECODER ROUTES
      // ============================================
      
      // POST /api/decode-vin - Decode VIN
      if (url.pathname === '/api/decode-vin' && request.method === 'POST') {
        return await this.handleDecodeVIN(request, env, corsHeaders);
      }

      // ============================================
      // ADMIN/SETTINGS ROUTES
      // ============================================
      
      // GET /api/admin/settings - Get site settings
      if (url.pathname === '/api/admin/settings' && request.method === 'GET') {
        return await this.handleGetSettings(env, corsHeaders);
      }

      // POST /api/admin/settings - Update site settings
      if (url.pathname === '/api/admin/settings' && request.method === 'POST') {
        return await this.handleUpdateSettings(request, env, corsHeaders);
      }

      // ============================================
      // 404 - Route not found
      // ============================================
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Route not found',
        path: url.pathname
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('API Error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },

  // ============================================
  // AUTHENTICATION HANDLERS
  // ============================================
  
  async handleLogin(request, env, corsHeaders) {
    const { email, password } = await request.json();
    
    const staff = await env.DB.prepare(`
      SELECT id, email, name, role, is_active, password_hash
      FROM staff 
      WHERE email = ? AND is_active = 1
    `).bind(email).first();
    
    const passwordMatch = staff ? await bcrypt.compare(password, staff.password_hash) : false;
    
    if (staff && passwordMatch) {
      delete staff.password_hash;
      
      await env.DB.prepare(`
        UPDATE staff SET last_login = datetime('now') WHERE id = ?
      `).bind(staff.id).run();
      
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
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid email or password'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async handleVerifyToken(request, env, corsHeaders) {
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
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = atob(token);
      const [staffId] = decoded.split(':');
      
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
      }
    } catch (error) {
      // Invalid token format
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid token'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  // ============================================
  // VEHICLE HANDLERS
  // ============================================
  
  async handleGetVehicles(request, env, corsHeaders) {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'available';
    const vendorId = url.searchParams.get('vendor');
    const limit = parseInt(url.searchParams.get('limit')) || 100;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    
    let query = `SELECT * FROM vehicles WHERE 1=1`;
    const params = [];
    
    if (status && status !== 'all') {
      if (status === 'sold') {
        query += ` AND isSold = 1`;
      } else if (status === 'available') {
        query += ` AND (isSold = 0 OR isSold IS NULL)`;
      }
    }
    
    if (vendorId) {
      query += ` AND vendor_id = ?`;
      params.push(vendorId);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const result = await env.DB.prepare(query).bind(...params).all();
    
    return new Response(JSON.stringify({
      success: true,
      vehicles: result.results,
      count: result.results.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async handleGetVehicle(id, env, corsHeaders) {
    const vehicle = await env.DB.prepare(`
      SELECT * FROM vehicles WHERE id = ?
    `).bind(id).first();
    
    if (!vehicle) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Vehicle not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      vehicle
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async handleUpdateVehicle(id, request, env, corsHeaders) {
    const updates = await request.json();
    
    const fields = [];
    const values = [];
    
    const allowedFields = ['make', 'model', 'year', 'price', 'display_price', 'odometer', 
                           'bodyType', 'color', 'vin', 'stockNumber', 'description', 
                           'images', 'isSold', 'listing_status', 'fuelType', 'transmission', 
                           'drivetrain', 'engineSize', 'cylinders', 'is_published'];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No valid fields to update'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    values.push(id);
    
    await env.DB.prepare(`
      UPDATE vehicles SET ${fields.join(', ')} WHERE id = ?
    `).bind(...values).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Vehicle updated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async handleDeleteVehicle(id, env, corsHeaders) {
    await env.DB.prepare(`DELETE FROM vehicles WHERE id = ?`).bind(id).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Vehicle deleted successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async handleMarkSold(id, request, env, corsHeaders) {
    const { soldPrice, soldDate, buyerName } = await request.json();
    
    await env.DB.prepare(`
      UPDATE vehicles SET 
        isSold = 1,
        sold_date = ?,
        sold_at = ?
      WHERE id = ?
    `).bind(soldDate, soldDate, id).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Vehicle marked as sold'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  // ============================================
  // FEED MANAGEMENT HANDLERS
  // ============================================
  
  async handleGetFeeds(env, corsHeaders) {
    const feeds = await env.DB.prepare(`
      SELECT * FROM vendor_feeds ORDER BY vendor_name ASC
    `).all();
    
    return new Response(JSON.stringify({
      success: true,
      feeds: feeds.results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async handleGetFeed(vendorId, env, corsHeaders) {
    const feed = await env.DB.prepare(`
      SELECT * FROM vendor_feeds WHERE vendor_id = ?
    `).bind(vendorId).first();
    
    if (!feed) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Feed not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      feed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async handleCreateFeed(request, env, corsHeaders) {
    const { vendor_id, vendor_name, feed_url, feed_type, is_active, sync_frequency } = await request.json();
    
    if (!vendor_id || !vendor_name || !feed_url) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: vendor_id, vendor_name, feed_url'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    await env.DB.prepare(`
      INSERT INTO vendor_feeds (vendor_id, vendor_name, feed_url, feed_type, is_active, sync_frequency)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      vendor_id,
      vendor_name,
      feed_url,
      feed_type || 'xml',
      is_active !== undefined ? is_active : 1,
      sync_frequency || 'manual'
    ).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Feed created successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async handleUpdateFeed(vendorId, request, env, corsHeaders) {
    const updates = await request.json();
    
    const fields = [];
    const values = [];
    
    const allowedFields = ['vendor_name', 'feed_url', 'feed_type', 'is_active', 'sync_frequency'];
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No valid fields to update'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    values.push(vendorId);
    
    await env.DB.prepare(`
      UPDATE vendor_feeds SET ${fields.join(', ')} WHERE vendor_id = ?
    `).bind(...values).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Feed updated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async handleDeleteFeed(vendorId, env, corsHeaders) {
    await env.DB.prepare(`DELETE FROM vendor_feeds WHERE vendor_id = ?`).bind(vendorId).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Feed deleted successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  // ============================================
  // VIN DECODER HANDLERS
  // ============================================
  
  async handleDecodeVIN(request, env, corsHeaders) {
    const { vin } = await request.json();
    
    if (!vin || vin.length !== 17) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid VIN. Must be 17 characters.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const decodedData = await this.decodeVIN(vin);
    
    return new Response(JSON.stringify({
      success: true,
      vin: vin,
      data: decodedData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async decodeVIN(vin) {
    const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`;
    
    const response = await fetch(nhtsaUrl);
    const data = await response.json();
    
    if (!data.Results) {
      throw new Error('Failed to decode VIN');
    }
    
    const results = data.Results;
    const getValue = (variableId) => {
      const item = results.find(r => r.VariableId === variableId);
      return item?.Value || null;
    };
    
    return {
      make: getValue(26),
      model: getValue(28),
      year: getValue(29),
      bodyType: getValue(5),
      engineSize: getValue(71),
      cylinders: getValue(9),
      fuelType: getValue(24),
      transmission: getValue(37),
      drivetrain: getValue(15),
      manufacturer: getValue(27),
      plantCountry: getValue(75),
      vehicleType: getValue(39)
    };
  },

  // ============================================
  // SETTINGS HANDLERS
  // ============================================
  
  async handleGetSettings(env, corsHeaders) {
    try {
      const settings = await env.DB.prepare(`
        SELECT * FROM site_settings LIMIT 1
      `).first();
      
      return new Response(JSON.stringify({
        success: true,
        settings: settings || {}
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      // If table doesn't exist, return empty settings
      return new Response(JSON.stringify({
        success: true,
        settings: {}
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },

  async handleUpdateSettings(request, env, corsHeaders) {
    const settings = await request.json();
    
    try {
      // Try to update existing settings
      await env.DB.prepare(`
        INSERT OR REPLACE INTO site_settings (id, settings, updated_at)
        VALUES (1, ?, datetime('now'))
      `).bind(JSON.stringify(settings)).run();
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Settings updated successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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
};
