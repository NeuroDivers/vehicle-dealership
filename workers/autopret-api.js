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
    
    // CORS headers - Allow credentials for HttpOnly cookies
    const origin = request.headers.get('Origin') || 'https://autopret123.ca';
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
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

      // POST /api/auth/logout - Logout and clear cookie
      if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
        return await this.handleLogout(corsHeaders);
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

      // GET /api/admin/vehicles - Get all vehicles (admin view)
      if (url.pathname === '/api/admin/vehicles' && request.method === 'GET') {
        return await this.handleGetVehicles(request, env, corsHeaders);
      }

      // POST /api/admin/vehicles/:id/sync-from-vendor - Sync vehicle from vendor
      if (url.pathname.match(/^\/api\/admin\/vehicles\/\d+\/sync-from-vendor$/) && request.method === 'POST') {
        const id = url.pathname.split('/')[4];
        return await this.handleSyncVehicleFromVendor(id, env, corsHeaders);
      }

      // ============================================
      // STAFF ROUTES
      // ============================================

      // GET /api/staff - Get all staff
      if (url.pathname === '/api/staff' && request.method === 'GET') {
        return await this.handleGetStaff(env, corsHeaders);
      }

      // POST /api/staff - Create staff
      if (url.pathname === '/api/staff' && request.method === 'POST') {
        return await this.handleCreateStaff(request, env, corsHeaders);
      }

      // PUT /api/staff/:id - Update staff
      if (url.pathname.match(/^\/api\/staff\/[^\/]+$/) && request.method === 'PUT') {
        const id = url.pathname.split('/').pop();
        return await this.handleUpdateStaff(id, request, env, corsHeaders);
      }

      // DELETE /api/staff/:id - Delete staff
      if (url.pathname.match(/^\/api\/staff\/[^\/]+$/) && request.method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        return await this.handleDeleteStaff(id, env, corsHeaders);
      }

      // ============================================
      // ANALYTICS ROUTES
      // ============================================

      // GET /api/analytics/dashboard - Get dashboard analytics
      if (url.pathname === '/api/analytics/dashboard' && request.method === 'GET') {
        return await this.handleGetDashboardAnalytics(request, env, corsHeaders);
      }

      // POST /api/analytics/vehicle-views - Track vehicle view
      if (url.pathname === '/api/analytics/vehicle-views' && request.method === 'POST') {
        return await this.handleTrackVehicleView(request, env, corsHeaders);
      }

      // ============================================
      // REVIEWS ROUTES
      // ============================================

      // GET /api/reviews - Get all reviews
      if (url.pathname === '/api/reviews' && request.method === 'GET') {
        return await this.handleGetReviews(env, corsHeaders);
      }

      // GET /api/reviews/featured - Get featured reviews
      if (url.pathname === '/api/reviews/featured' && request.method === 'GET') {
        return await this.handleGetFeaturedReviews(env, corsHeaders);
      }

      // ============================================
      // LEADS ROUTES
      // ============================================

      // GET /api/leads - Get all leads
      if (url.pathname === '/api/leads' && request.method === 'GET') {
        return await this.handleGetLeads(env, corsHeaders);
      }

      // GET /api/leads/:id - Get single lead
      if (url.pathname.match(/^\/api\/leads\/[^\/]+$/) && request.method === 'GET') {
        const id = url.pathname.split('/').pop();
        return await this.handleGetLead(id, env, corsHeaders);
      }

      // PUT /api/leads/:id - Update lead
      if (url.pathname.match(/^\/api\/leads\/\d+$/) && request.method === 'PUT') {
        const id = url.pathname.split('/').pop();
        return await this.handleUpdateLead(id, request, env, corsHeaders);
      }

      // GET /api/leads/:id/activity - Get lead activity
      if (url.pathname.match(/^\/api\/leads\/\d+\/activity$/) && request.method === 'GET') {
        const id = url.pathname.split('/')[3];
        return await this.handleGetLeadActivity(id, env, corsHeaders);
      }

      // POST /api/leads/:id/calls - Add call to lead
      if (url.pathname.match(/^\/api\/leads\/\d+\/calls$/) && request.method === 'POST') {
        const id = url.pathname.split('/')[3];
        return await this.handleAddLeadCall(id, request, env, corsHeaders);
      }

      // POST /api/leads/:id/notes - Add note to lead
      if (url.pathname.match(/^\/api\/leads\/\d+\/notes$/) && request.method === 'POST') {
        const id = url.pathname.split('/')[3];
        return await this.handleAddLeadNote(id, request, env, corsHeaders);
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
      
      // Set HttpOnly cookie (expires in 7 days)
      const cookieExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
      const cookieHeader = `auth_token=${token}; HttpOnly; Secure; SameSite=None; Path=/; Expires=${cookieExpiry}`;
      
      return new Response(JSON.stringify({
        success: true,
        token, // Still return token for backward compatibility
        user: {
          id: staff.id,
          email: staff.email,
          name: staff.name,
          role: staff.role
        }
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Set-Cookie': cookieHeader
        }
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
    // Try to get token from cookie first, then fall back to Authorization header
    const cookieHeader = request.headers.get('Cookie');
    let token = null;
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      const authCookie = cookies.find(c => c.startsWith('auth_token='));
      if (authCookie) {
        token = authCookie.split('=')[1];
      }
    }
    
    // Fall back to Authorization header if no cookie
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No token provided'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
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

  async handleLogout(corsHeaders) {
    // Clear the auth cookie by setting it to expire immediately
    const cookieHeader = 'auth_token=; HttpOnly; Secure; SameSite=None; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Logged out successfully'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Set-Cookie': cookieHeader
      }
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
  },

  // ============================================
  // STAFF HANDLERS
  // ============================================

  async handleGetStaff(env, corsHeaders) {
    const staff = await env.DB.prepare(`
      SELECT id, email, name, role, is_active, last_login, created_at
      FROM staff
      ORDER BY created_at DESC
    `).all();
    
    return new Response(JSON.stringify({
      success: true,
      staff: staff.results || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async handleCreateStaff(request, env, corsHeaders) {
    const { email, password, name, role } = await request.json();
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = await env.DB.prepare(`
      INSERT INTO staff (id, email, password_hash, name, role, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
    `).bind(
      crypto.randomUUID(),
      email,
      passwordHash,
      name,
      role || 'staff'
    ).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Staff created successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async handleUpdateStaff(id, request, env, corsHeaders) {
    const data = await request.json();
    const fields = [];
    const values = [];
    
    if (data.name) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.email) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.role) {
      fields.push('role = ?');
      values.push(data.role);
    }
    if (data.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }
    if (data.password) {
      const passwordHash = await bcrypt.hash(data.password, 10);
      fields.push('password_hash = ?');
      values.push(passwordHash);
    }
    
    if (fields.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No fields to update'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    values.push(id);
    
    await env.DB.prepare(`
      UPDATE staff SET ${fields.join(', ')} WHERE id = ?
    `).bind(...values).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Staff updated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async handleDeleteStaff(id, env, corsHeaders) {
    await env.DB.prepare(`DELETE FROM staff WHERE id = ?`).bind(id).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Staff deleted successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  // ============================================
  // LEADS HANDLERS
  // ============================================

  async handleGetLeads(env, corsHeaders) {
    const leads = await env.DB.prepare(`
      SELECT * FROM leads ORDER BY created_at DESC
    `).all();
    
    return new Response(JSON.stringify({
      success: true,
      leads: leads.results || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async handleGetLead(id, env, corsHeaders) {
    const lead = await env.DB.prepare(`
      SELECT * FROM leads WHERE id = ?
    `).bind(id).first();
    
    if (!lead) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Lead not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      lead
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async handleUpdateLead(id, request, env, corsHeaders) {
    const data = await request.json();
    const fields = [];
    const values = [];
    
    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.assigned_to) {
      fields.push('assigned_to = ?');
      values.push(data.assigned_to);
    }
    if (data.notes) {
      fields.push('notes = ?');
      values.push(data.notes);
    }
    
    if (fields.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No fields to update'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    fields.push('updated_at = datetime("now")');
    values.push(id);
    
    await env.DB.prepare(`
      UPDATE leads SET ${fields.join(', ')} WHERE id = ?
    `).bind(...values).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Lead updated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async handleGetLeadActivity(id, env, corsHeaders) {
    const activity = await env.DB.prepare(`
      SELECT * FROM lead_activity WHERE lead_id = ? ORDER BY created_at DESC
    `).bind(id).all();
    
    return new Response(JSON.stringify({
      success: true,
      activity: activity.results || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async handleAddLeadCall(id, request, env, corsHeaders) {
    const data = await request.json();
    
    await env.DB.prepare(`
      INSERT INTO lead_activity (id, lead_id, type, notes, created_at, created_by)
      VALUES (?, ?, 'call', ?, datetime('now'), ?)
    `).bind(
      crypto.randomUUID(),
      id,
      data.notes || '',
      data.created_by || 'system'
    ).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Call logged successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async handleAddLeadNote(id, request, env, corsHeaders) {
    const data = await request.json();
    
    await env.DB.prepare(`
      INSERT INTO lead_activity (id, lead_id, type, notes, created_at, created_by)
      VALUES (?, ?, 'note', ?, datetime('now'), ?)
    `).bind(
      crypto.randomUUID(),
      id,
      data.notes || '',
      data.created_by || 'system'
    ).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Note added successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  async handleSyncVehicleFromVendor(id, env, corsHeaders) {
    // This is a placeholder - actual implementation would call vendor API
    return new Response(JSON.stringify({
      success: true,
      message: 'Vehicle sync initiated'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },

  // ============================================
  // REVIEWS HANDLERS
  // ============================================

  async handleGetReviews(env, corsHeaders) {
    try {
      const { results } = await env.DB.prepare(`
        SELECT * FROM reviews 
        WHERE is_approved = 1
        ORDER BY date DESC
        LIMIT 50
      `).all();
      
      return new Response(JSON.stringify(results || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Return empty array if table doesn't exist
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },

  async handleGetFeaturedReviews(env, corsHeaders) {
    try {
      const { results } = await env.DB.prepare(`
        SELECT * FROM reviews 
        WHERE is_featured = 1 AND is_approved = 1
        ORDER BY date DESC
        LIMIT 10
      `).all();
      
      return new Response(JSON.stringify(results || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Return empty array if table doesn't exist
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },

  // ============================================
  // ANALYTICS HANDLERS
  // ============================================

  async handleGetDashboardAnalytics(request, env, corsHeaders) {
    try {
      const url = new URL(request.url);
      const timeRange = url.searchParams.get('timeRange') || '7d';
      
      // Calculate date range
      const days = parseInt(timeRange.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get basic stats
      const totalVehicles = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM vehicles WHERE is_published = 1
      `).first();
      
      const totalViews = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM vehicle_views 
        WHERE viewed_at >= datetime('now', '-${days} days')
      `).first();
      
      const totalLeads = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM leads 
        WHERE created_at >= datetime('now', '-${days} days')
      `).first();
      
      return new Response(JSON.stringify({
        success: true,
        stats: {
          totalVehicles: totalVehicles?.count || 0,
          totalViews: totalViews?.count || 0,
          totalLeads: totalLeads?.count || 0,
          timeRange
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      // Return default stats if tables don't exist
      return new Response(JSON.stringify({
        success: true,
        stats: {
          totalVehicles: 0,
          totalViews: 0,
          totalLeads: 0,
          timeRange: '7d'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },

  async handleTrackVehicleView(request, env, corsHeaders) {
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
};
