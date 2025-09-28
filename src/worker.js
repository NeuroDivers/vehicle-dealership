/**
 * Cloudflare Worker for Vehicle Dealership Analytics
 * Handles D1 database operations for vehicle views, search queries, and leads
 */

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight requests
function handleCORS(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
}

// Vehicle Views Analytics Handlers
async function handleVehicleViews(request, env) {
  const url = new URL(request.url);
  
  if (request.method === 'POST') {
    try {
      const viewData = await request.json();
      
      // Insert vehicle view into D1
      const stmt = env.DB.prepare(`
        INSERT INTO vehicle_views (id, vehicle_id, make, model, year, price, timestamp, user_agent, referrer, url, ip)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const timestamp = new Date().toISOString();
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      
      await stmt.bind(
        id,
        viewData.vehicleId,
        viewData.make,
        viewData.model,
        viewData.year,
        viewData.price,
        timestamp,
        viewData.userAgent,
        viewData.referrer,
        viewData.url,
        ip
      ).run();
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Vehicle view tracking error:', error);
      return new Response(JSON.stringify({ error: 'Failed to track view' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
  
  if (request.method === 'GET') {
    try {
      const timeRange = url.searchParams.get('timeRange') || '7d';
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }
      
      const startDateStr = startDate.toISOString();
      
      // Get filtered views
      const viewsResult = await env.DB.prepare(`
        SELECT * FROM vehicle_views 
        WHERE timestamp >= ? 
        ORDER BY timestamp DESC
      `).bind(startDateStr).all();
      
      const views = viewsResult.results || [];
      
      // Calculate analytics
      const totalViews = views.length;
      const uniqueVehicles = new Set(views.map(v => v.vehicle_id)).size;
      const averageViewsPerVehicle = uniqueVehicles > 0 ? totalViews / uniqueVehicles : 0;
      
      // Top vehicles by view count
      const vehicleViewCounts = {};
      views.forEach(view => {
        const key = view.vehicle_id;
        if (!vehicleViewCounts[key]) {
          vehicleViewCounts[key] = {
            vehicleId: view.vehicle_id,
            make: view.make,
            model: view.model,
            year: view.year,
            price: view.price,
            viewCount: 0,
            timestamp: view.timestamp,
            referrer: view.referrer
          };
        }
        vehicleViewCounts[key].viewCount++;
      });
      
      const topVehicles = Object.values(vehicleViewCounts)
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 5);
      
      // Recent views
      const recentViews = views.slice(0, 10);
      
      // Referrer stats
      const referrerCounts = {};
      views.forEach(view => {
        const referrer = view.referrer || 'direct';
        const source = referrer.includes('google') ? 'Google' :
                      referrer.includes('facebook') ? 'Facebook' :
                      referrer.includes('instagram') ? 'Instagram' :
                      referrer === 'direct' ? 'Direct' : 'Other';
        
        referrerCounts[source] = (referrerCounts[source] || 0) + 1;
      });
      
      const referrerStats = Object.entries(referrerCounts)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count);
      
      // Daily views for chart
      const dailyViews = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayViews = views.filter(view => 
          view.timestamp.split('T')[0] === dateStr
        ).length;
        
        dailyViews.push({ date: dateStr, views: dayViews });
      }
      
      const analytics = {
        totalViews,
        uniqueVehiclesViewed: uniqueVehicles,
        averageViewsPerVehicle: parseFloat(averageViewsPerVehicle.toFixed(1)),
        topVehicles,
        recentViews,
        referrerStats,
        dailyViews
      };
      
      return new Response(JSON.stringify(analytics), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Analytics fetch error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch analytics' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
}

// Search Queries Analytics Handlers
async function handleSearchQueries(request, env) {
  const url = new URL(request.url);
  
  if (request.method === 'POST') {
    try {
      const queryData = await request.json();
      
      // Insert search query into D1
      const stmt = env.DB.prepare(`
        INSERT INTO search_queries (id, query, result_count, timestamp, user_agent, url, ip)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const timestamp = new Date().toISOString();
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      
      await stmt.bind(
        id,
        queryData.query,
        queryData.resultCount,
        timestamp,
        queryData.userAgent,
        queryData.url,
        ip
      ).run();
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Search query tracking error:', error);
      return new Response(JSON.stringify({ error: 'Failed to track search query' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
  
  if (request.method === 'GET') {
    try {
      const timeRange = url.searchParams.get('timeRange') || '7d';
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }
      
      const startDateStr = startDate.toISOString();
      
      // Get filtered queries
      const queriesResult = await env.DB.prepare(`
        SELECT * FROM search_queries 
        WHERE timestamp >= ? 
        ORDER BY timestamp DESC
      `).bind(startDateStr).all();
      
      const queries = queriesResult.results || [];
      
      // Calculate analytics
      const totalSearches = queries.length;
      const uniqueQueries = new Set(queries.map(q => q.query.toLowerCase())).size;
      
      // Popular search terms
      const queryFrequency = {};
      
      queries.forEach(search => {
        const normalizedQuery = search.query.toLowerCase().trim();
        if (!queryFrequency[normalizedQuery]) {
          queryFrequency[normalizedQuery] = {
            query: search.query,
            count: 0,
            avgResults: 0
          };
        }
        queryFrequency[normalizedQuery].count++;
        queryFrequency[normalizedQuery].avgResults += search.result_count;
      });
      
      const popularSearches = Object.values(queryFrequency)
        .map(item => ({
          ...item,
          avgResults: Math.round(item.avgResults / item.count)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // No results searches (inventory gaps)
      const noResultSearches = {};
      queries
        .filter(search => search.result_count === 0)
        .forEach(search => {
          const normalizedQuery = search.query.toLowerCase().trim();
          noResultSearches[normalizedQuery] = (noResultSearches[normalizedQuery] || 0) + 1;
        });
      
      const inventoryGaps = Object.entries(noResultSearches)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Recent searches
      const recentSearches = queries.slice(0, 10);
      
      // Daily searches
      const dailySearches = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const daySearches = queries.filter(search => 
          search.timestamp.split('T')[0] === dateStr
        ).length;
        
        dailySearches.push({ date: dateStr, searches: daySearches });
      }
      
      const analytics = {
        totalSearches,
        uniqueQueries,
        averageResultsPerSearch: totalSearches > 0 ? 
          Math.round(queries.reduce((sum, q) => sum + q.result_count, 0) / totalSearches) : 0,
        popularSearches,
        inventoryGaps,
        recentSearches,
        dailySearches
      };
      
      return new Response(JSON.stringify(analytics), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Search analytics fetch error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch search analytics' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
}

// Leads Management Handlers
async function handleLeads(request, env) {
  const url = new URL(request.url);
  
  if (request.method === 'POST') {
    try {
      const leadData = await request.json();
      
      // Insert lead into D1
      const stmt = env.DB.prepare(`
        INSERT INTO leads (
          id, vehicle_id, vehicle_make, vehicle_model, vehicle_year, vehicle_price,
          customer_name, customer_email, customer_phone, message, inquiry_type,
          preferred_contact, lead_score, status, source, timestamp, user_agent, url, ip
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const timestamp = new Date().toISOString();
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      
      await stmt.bind(
        id,
        leadData.vehicleId,
        leadData.vehicleMake,
        leadData.vehicleModel,
        leadData.vehicleYear,
        leadData.vehiclePrice,
        leadData.customerName,
        leadData.customerEmail,
        leadData.customerPhone,
        leadData.message,
        leadData.inquiryType,
        leadData.preferredContact,
        leadData.leadScore,
        leadData.status || 'new',
        leadData.source || 'website',
        timestamp,
        leadData.userAgent,
        leadData.url,
        ip
      ).run();
      
      return new Response(JSON.stringify({ 
        success: true, 
        leadId: id,
        message: 'Lead submitted successfully' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Lead submission error:', error);
      return new Response(JSON.stringify({ error: 'Failed to submit lead' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
  
  if (request.method === 'GET') {
    try {
      const timeRange = url.searchParams.get('timeRange') || '7d';
      const status = url.searchParams.get('status');
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }
      
      const startDateStr = startDate.toISOString();
      
      // Build query with optional status filter
      let query = `SELECT * FROM leads WHERE timestamp >= ?`;
      const params = [startDateStr];
      
      if (status && status !== 'all') {
        query += ` AND status = ?`;
        params.push(status);
      }
      
      query += ` ORDER BY timestamp DESC`;
      
      const leadsResult = await env.DB.prepare(query).bind(...params).all();
      const leads = leadsResult.results || [];
      
      // Calculate analytics (same logic as before)
      const totalLeads = leads.length;
      const averageLeadScore = totalLeads > 0 ? 
        Math.round(leads.reduce((sum, lead) => sum + lead.lead_score, 0) / totalLeads) : 0;
      
      // Status distribution
      const statusDistribution = {};
      leads.forEach(lead => {
        statusDistribution[lead.status] = (statusDistribution[lead.status] || 0) + 1;
      });
      
      // Top inquiry types
      const inquiryTypes = {};
      leads.forEach(lead => {
        inquiryTypes[lead.inquiry_type] = (inquiryTypes[lead.inquiry_type] || 0) + 1;
      });
      
      const topInquiryTypes = Object.entries(inquiryTypes)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Lead sources
      const sources = {};
      leads.forEach(lead => {
        sources[lead.source] = (sources[lead.source] || 0) + 1;
      });
      
      const leadSources = Object.entries(sources)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count);
      
      // High-value leads
      const highValueLeads = leads
        .filter(lead => lead.lead_score >= 80)
        .sort((a, b) => b.lead_score - a.lead_score)
        .slice(0, 10);
      
      // Recent leads
      const recentLeads = leads.slice(0, 10);
      
      // Daily leads
      const dailyLeads = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayLeads = leads.filter(lead => 
          lead.timestamp.split('T')[0] === dateStr
        ).length;
        
        dailyLeads.push({ date: dateStr, leads: dayLeads });
      }
      
      // Vehicle interest
      const vehicleInterest = {};
      leads.forEach(lead => {
        const vehicleKey = `${lead.vehicle_year} ${lead.vehicle_make} ${lead.vehicle_model}`;
        if (!vehicleInterest[vehicleKey]) {
          vehicleInterest[vehicleKey] = {
            vehicle: vehicleKey,
            vehicleId: lead.vehicle_id,
            price: lead.vehicle_price,
            inquiries: 0,
            averageScore: 0
          };
        }
        vehicleInterest[vehicleKey].inquiries++;
        vehicleInterest[vehicleKey].averageScore += lead.lead_score;
      });
      
      const topVehicleInterest = Object.values(vehicleInterest)
        .map(item => ({
          ...item,
          averageScore: Math.round(item.averageScore / item.inquiries)
        }))
        .sort((a, b) => b.inquiries - a.inquiries)
        .slice(0, 5);
      
      const analytics = {
        totalLeads,
        averageLeadScore,
        statusDistribution,
        topInquiryTypes,
        leadSources,
        highValueLeads,
        recentLeads,
        dailyLeads,
        topVehicleInterest,
        conversionRate: totalLeads > 0 ? 
          Math.round(((statusDistribution.closed || 0) / totalLeads) * 100) : 0
      };
      
      return new Response(JSON.stringify(analytics), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Leads analytics fetch error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch leads analytics' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
}

// Vehicle CRUD handlers
async function handleVehicles(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  // Extract vehicle ID from path if present
  const vehicleIdMatch = path.match(/\/api\/vehicles\/(\d+)/);
  const vehicleId = vehicleIdMatch ? vehicleIdMatch[1] : null;
  
  try {
    switch (method) {
      case 'GET':
        if (vehicleId) {
          // Get single vehicle
          const vehicle = await env.DB.prepare(
            'SELECT * FROM vehicles WHERE id = ?'
          ).bind(vehicleId).first();
          
          if (!vehicle) {
            return new Response(JSON.stringify({ error: 'Vehicle not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          // Parse images if stored as JSON string
          if (vehicle.images && typeof vehicle.images === 'string') {
            try {
              vehicle.images = JSON.parse(vehicle.images);
            } catch (e) {
              // Keep as string if not valid JSON
            }
          }
          
          return new Response(JSON.stringify(vehicle), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          // Get all vehicles
          const { results } = await env.DB.prepare(
            'SELECT * FROM vehicles ORDER BY id DESC'
          ).all();
          
          // Parse images for each vehicle
          const vehicles = results.map(vehicle => {
            if (vehicle.images && typeof vehicle.images === 'string') {
              try {
                vehicle.images = JSON.parse(vehicle.images);
              } catch (e) {
                // Keep as string if not valid JSON
              }
            }
            return vehicle;
          });
          
          return new Response(JSON.stringify(vehicles), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
      case 'POST':
        // Create new vehicle
        const newVehicle = await request.json();
        
        // Stringify images array if needed
        if (newVehicle.images && typeof newVehicle.images !== 'string') {
          newVehicle.images = JSON.stringify(newVehicle.images);
        }
        
        const insertResult = await env.DB.prepare(
          `INSERT INTO vehicles (
            make, model, year, price, odometer, bodyType, 
            color, description, images, isSold, stockNumber, vin
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          newVehicle.make,
          newVehicle.model,
          newVehicle.year,
          newVehicle.price,
          newVehicle.odometer,
          newVehicle.bodyType,
          newVehicle.color,
          newVehicle.description || null,
          newVehicle.images || '[]',
          newVehicle.isSold || 0,
          newVehicle.stockNumber || null,
          newVehicle.vin || null
        ).run();
        
        return new Response(JSON.stringify({ 
          success: true, 
          id: insertResult.meta.last_row_id 
        }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      case 'PUT':
        // Update vehicle
        if (!vehicleId) {
          return new Response(JSON.stringify({ error: 'Vehicle ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const updatedVehicle = await request.json();
        
        // Stringify images array if needed
        if (updatedVehicle.images && typeof updatedVehicle.images !== 'string') {
          updatedVehicle.images = JSON.stringify(updatedVehicle.images);
        }
        
        await env.DB.prepare(
          `UPDATE vehicles SET 
            make = ?, model = ?, year = ?, price = ?, 
            odometer = ?, bodyType = ?, color = ?, 
            description = ?, images = ?, isSold = ?, 
            stockNumber = ?, vin = ?
          WHERE id = ?`
        ).bind(
          updatedVehicle.make,
          updatedVehicle.model,
          updatedVehicle.year,
          updatedVehicle.price,
          updatedVehicle.odometer,
          updatedVehicle.bodyType,
          updatedVehicle.color,
          updatedVehicle.description || null,
          updatedVehicle.images || '[]',
          updatedVehicle.isSold !== undefined ? updatedVehicle.isSold : 0,
          updatedVehicle.stockNumber || null,
          updatedVehicle.vin || null,
          vehicleId
        ).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      case 'DELETE':
        // Delete vehicle
        if (!vehicleId) {
          return new Response(JSON.stringify({ error: 'Vehicle ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        await env.DB.prepare('DELETE FROM vehicles WHERE id = ?').bind(vehicleId).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      default:
        return new Response('Method Not Allowed', {
          status: 405,
          headers: corsHeaders,
        });
    }
  } catch (error) {
    console.error('Vehicle handler error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process vehicle request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Main request handler
const workerHandler = {
  async fetch(request, env) {
    const corsResponse = handleCORS(request);
    if (corsResponse) return corsResponse;
    
    const url = new URL(request.url);
    const path = url.pathname;
    
    try {
      // Route requests to appropriate handlers
      if (path.startsWith('/api/vehicles')) {
        return await handleVehicles(request, env);
      } else if (path.startsWith('/api/analytics/vehicle-views')) {
        return await handleVehicleViews(request, env);
      } else if (path.startsWith('/api/analytics/search-queries')) {
        return await handleSearchQueries(request, env);
      } else if (path.startsWith('/api/leads')) {
        return await handleLeads(request, env);
      } else {
        return new Response('Not Found', { 
          status: 404,
          headers: corsHeaders 
        });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

export default workerHandler;
