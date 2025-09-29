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
  const pathParts = url.pathname.split('/');
  const leadId = pathParts[3]; // /api/leads/{id}
  
  // Handle PUT for updating a specific lead
  if (request.method === 'PUT' && leadId) {
    try {
      const updates = await request.json();
      
      // Build dynamic update query
      const updateFields = [];
      const values = [];
      
      if (updates.status !== undefined) {
        updateFields.push('status = ?');
        values.push(updates.status);
      }
      if (updates.assigned_to !== undefined) {
        updateFields.push('assigned_to = ?');
        values.push(updates.assigned_to);
      }
      if (updates.notes !== undefined) {
        updateFields.push('notes = ?');
        values.push(updates.notes);
      }
      if (updates.follow_up_date !== undefined) {
        updateFields.push('follow_up_date = ?');
        values.push(updates.follow_up_date);
      }
      
      if (updateFields.length === 0) {
        return new Response(JSON.stringify({ error: 'No fields to update' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      values.push(leadId); // Add leadId for WHERE clause
      
      const query = `UPDATE leads SET ${updateFields.join(', ')} WHERE id = ?`;
      await env.DB.prepare(query).bind(...values).run();
      
      return new Response(JSON.stringify({ success: true, message: 'Lead updated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Lead update error:', error);
      return new Response(JSON.stringify({ error: 'Failed to update lead' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
  
  // Handle GET for a specific lead
  if (request.method === 'GET' && leadId) {
    try {
      const lead = await env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(leadId).first();
      
      if (!lead) {
        return new Response(JSON.stringify({ error: 'Lead not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify(lead), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Lead fetch error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch lead' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
  
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

// Vehicle Image Upload Handler for Cloudflare Images
async function handleVehicleImageUpload(request, env) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const vehicleId = pathParts[3]; // /api/vehicles/{id}/images
    
    // Check if Cloudflare Images is configured
    if (!env.CF_ACCOUNT_ID || !env.CF_IMAGES_TOKEN) {
      return new Response(JSON.stringify({ 
        error: 'Cloudflare Images not configured. Please set up Cloudflare Images and add credentials.',
        instructions: [
          '1. Go to Cloudflare dashboard > Images',
          '2. Enable Cloudflare Images ($5/month)',
          '3. Get your Account ID from the dashboard',
          '4. Create an API token with Images:Edit permission',
          '5. Add to wrangler.toml: [vars] CF_ACCOUNT_ID = "your-id" CF_IMAGES_TOKEN = "your-token"',
          '6. Redeploy the worker'
        ]
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get the uploaded images from form data
    console.log('Content-Type:', request.headers.get('Content-Type'));
    const formData = await request.formData();
    
    // Debug: Log all form data entries
    console.log('FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
    }
    
    const files = formData.getAll('images');
    console.log('Files received:', files.length);
    const uploadedImages = [];
    
    for (const file of files) {
      console.log('Processing file:', file, 'Is File?', file instanceof File);
      if (file instanceof File) {
        console.log(`Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`);
        // Prepare form data for Cloudflare Images API
        const imageFormData = new FormData();
        imageFormData.append('file', file);
        
        // Add metadata
        imageFormData.append('metadata', JSON.stringify({
          vehicleId: vehicleId,
          uploadedAt: new Date().toISOString()
        }));
        
        // Set a custom ID for the image (optional)
        const imageId = `vehicle-${vehicleId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        imageFormData.append('id', imageId);
        
        // Upload to Cloudflare Images
        const uploadResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/images/v1`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${env.CF_IMAGES_TOKEN}`
            },
            body: imageFormData
          }
        );
        
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('Cloudflare Images upload failed:');
          console.error('Status:', uploadResponse.status);
          console.error('Response:', errorText);
          try {
            const errorJson = JSON.parse(errorText);
            console.error('Error details:', JSON.stringify(errorJson, null, 2));
          } catch (e) {
            console.error('Raw error:', errorText);
          }
          continue; // Skip this image and try the next
        }
        
        const uploadResult = await uploadResponse.json();
        
        if (uploadResult.success) {
          // Get the image variants URLs
          const imageData = uploadResult.result;
          
          // Store only the public variant (the only one configured in the account)
          const imageInfo = {
            id: imageData.id,
            filename: imageData.filename,
            uploaded: imageData.uploaded,
            variants: {
              public: `https://imagedelivery.net/${env.CF_ACCOUNT_HASH}/${imageData.id}/public`
            }
          };
          
          uploadedImages.push(imageInfo);
        }
      }
    }
    
    // Update vehicle record with new images
    if (uploadedImages.length > 0) {
      const vehicle = await env.DB.prepare('SELECT images FROM vehicles WHERE id = ?').bind(vehicleId).first();
      
      if (vehicle) {
        const existingImages = vehicle.images ? JSON.parse(vehicle.images) : [];
        const allImages = [...existingImages, ...uploadedImages];
        
        await env.DB.prepare('UPDATE vehicles SET images = ? WHERE id = ?')
          .bind(JSON.stringify(allImages), vehicleId)
          .run();
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      images: uploadedImages,
      message: `Successfully uploaded ${uploadedImages.length} images`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return new Response(JSON.stringify({ error: 'Failed to upload images' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle vehicle image deletion
async function handleVehicleImageDelete(request, env) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const vehicleId = pathParts[3]; // /api/vehicles/{id}/images/{imageId}
    const imageId = pathParts[5]; // The image ID to delete
    
    // Check if Cloudflare Images is configured
    if (!env.CF_ACCOUNT_ID || !env.CF_IMAGES_TOKEN) {
      return new Response(JSON.stringify({ 
        error: 'Cloudflare Images not configured',
        message: 'Image deletion requires Cloudflare Images configuration'
      }), {
        status: 501,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Delete from Cloudflare Images
    const deleteUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/images/v1/${imageId}`;
    const deleteResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${env.CF_IMAGES_TOKEN}`,
      }
    });
    
    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      console.error('Cloudflare Images delete error:', errorData);
      return new Response(JSON.stringify({ 
        error: 'Failed to delete image from Cloudflare',
        details: errorData
      }), {
        status: deleteResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Also update the vehicle record to remove this image from the list
    if (vehicleId && vehicleId !== 'undefined') {
      const vehicle = await env.DB.prepare('SELECT images FROM vehicles WHERE id = ?')
        .bind(vehicleId)
        .first();
      
      if (vehicle && vehicle.images) {
        const images = JSON.parse(vehicle.images);
        // Filter out the deleted image by ID
        const updatedImages = images.filter(img => {
          if (typeof img === 'string') {
            return !img.includes(imageId);
          }
          return img.id !== imageId;
        });
        
        await env.DB.prepare('UPDATE vehicles SET images = ? WHERE id = ?')
          .bind(JSON.stringify(updatedImages), vehicleId)
          .run();
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Image deleted successfully',
      imageId: imageId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Image deletion error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete image',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Vehicle Management Handlers
async function handleVehicles(request, env, method) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Extract vehicle ID from path if present
  const vehicleIdMatch = path.match(/\/api\/vehicles\/(\d+)/);
  const vehicleId = vehicleIdMatch ? vehicleIdMatch[1] : null;
  
  try {
    switch (method) {
      case 'DELETE':
        if (vehicleId) {
          // First, get the vehicle to retrieve its images
          const vehicle = await env.DB.prepare(
            'SELECT images FROM vehicles WHERE id = ?'
          ).bind(vehicleId).first();
          
          if (!vehicle) {
            return new Response(JSON.stringify({ error: 'Vehicle not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          // Delete images from Cloudflare Images if they exist
          if (vehicle.images && env.CF_ACCOUNT_ID && env.CF_IMAGES_TOKEN) {
            try {
              const images = JSON.parse(vehicle.images);
              for (const image of images) {
                if (image.id) {
                  // Delete from Cloudflare Images
                  await fetch(
                    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/images/v1/${image.id}`,
                    {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${env.CF_IMAGES_TOKEN}`
                      }
                    }
                  );
                  console.log(`Deleted image ${image.id} from Cloudflare Images`);
                }
              }
            } catch (error) {
              console.error('Error deleting images:', error);
              // Continue with vehicle deletion even if image deletion fails
            }
          }
          
          // Delete the vehicle from database
          const deleteResult = await env.DB.prepare(
            'DELETE FROM vehicles WHERE id = ?'
          ).bind(vehicleId).run();
          
          return new Response(JSON.stringify({ 
            success: true,
            message: 'Vehicle and associated images deleted'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;
        
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
        if (vehicleId) {
          // Get current vehicle to check if it's being marked as sold
          const currentVehicle = await env.DB.prepare(
            'SELECT isSold FROM vehicles WHERE id = ?'
          ).bind(vehicleId).first();
          
          // Update existing vehicle
          const updateData = await request.json();
          
          // Handle sold status changes
          let soldDate = undefined; // undefined means don't change
          if (currentVehicle) {
            // Vehicle is being marked as sold for the first time
            if (currentVehicle.isSold === 0 && updateData.isSold === 1) {
              soldDate = new Date().toISOString();
              console.log(`Vehicle ${vehicleId} marked as sold, setting soldDate: ${soldDate}`);
            }
            // Vehicle is being marked back as available (unsold)
            else if (currentVehicle.isSold === 1 && updateData.isSold === 0) {
              soldDate = null; // Clear the sold date
              console.log(`Vehicle ${vehicleId} marked as available again, clearing soldDate`);
              
              // IMPORTANT: Images are preserved when marking back as available
              // This is the safety net - we don't delete images immediately
            }
          }
          
          // Stringify images array if needed
          if (updateData.images && typeof updateData.images !== 'string') {
            updateData.images = JSON.stringify(updateData.images);
          }
          
          const updateResult = await env.DB.prepare(
            `UPDATE vehicles SET 
              make = ?, model = ?, year = ?, price = ?, 
              odometer = ?, bodyType = ?, color = ?, 
              description = ?, images = ?, isSold = ?,
              soldDate = CASE 
                WHEN ? IS NOT NULL THEN ?
                WHEN ? = 0 THEN NULL
                ELSE soldDate
              END,
              stockNumber = ?, vin = ?
            WHERE id = ?`
          ).bind(
            updateData.make,
            updateData.model,
            updateData.year,
            updateData.price,
            updateData.odometer,
            updateData.bodyType,
            updateData.color,
            updateData.description || null,
            updateData.images || '[]',
            updateData.isSold || 0,
            soldDate !== undefined ? soldDate : null, // First WHEN condition
            soldDate !== undefined ? soldDate : null, // THEN value
            updateData.isSold || 0, // Check if being marked as available
            updateData.stockNumber || null,
            updateData.vin || null,
            vehicleId
          ).run();
          
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        break;
        
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

// Import native crypto authentication (no external dependencies!)
import { hashPassword, verifyPassword, generateToken, createToken, verifyToken } from './lib/crypto-auth.js';

// Analytics Dashboard Handler
async function handleAnalyticsDashboard(request, env) {
  try {
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || '7d';
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch(timeRange) {
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
    
    // Fetch vehicle views
    const vehicleViews = await env.DB.prepare(`
      SELECT 
        COUNT(*) as totalViews,
        COUNT(DISTINCT vehicle_id) as uniqueVehicles,
        COUNT(DISTINCT ip) as uniqueVisitors
      FROM vehicle_views 
      WHERE datetime(timestamp) >= datetime(?)
    `).bind(startDate.toISOString()).first();
    
    // Top viewed vehicles
    const topVehicles = await env.DB.prepare(`
      SELECT 
        vehicle_id,
        make,
        model,
        year,
        COUNT(*) as viewCount
      FROM vehicle_views 
      WHERE datetime(timestamp) >= datetime(?)
      GROUP BY vehicle_id, make, model, year
      ORDER BY viewCount DESC
      LIMIT 10
    `).bind(startDate.toISOString()).all();
    
    // Search analytics
    const searchStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as totalSearches,
        COUNT(DISTINCT query) as uniqueQueries,
        AVG(result_count) as avgResults
      FROM search_queries 
      WHERE datetime(timestamp) >= datetime(?)
    `).bind(startDate.toISOString()).first();
    
    // Popular searches
    const popularSearches = await env.DB.prepare(`
      SELECT 
        query,
        COUNT(*) as count,
        AVG(result_count) as avgResults
      FROM search_queries 
      WHERE datetime(timestamp) >= datetime(?)
      GROUP BY query
      ORDER BY count DESC
      LIMIT 10
    `).bind(startDate.toISOString()).all();
    
    // Lead statistics
    const leadStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as totalLeads,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as newLeads,
        COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contactedLeads,
        COUNT(CASE WHEN status = 'qualified' THEN 1 END) as qualifiedLeads,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closedLeads,
        AVG(lead_score) as avgLeadScore
      FROM leads 
      WHERE datetime(timestamp) >= datetime(?)
    `).bind(startDate.toISOString()).first();
    
    // Staff performance
    const staffPerformance = await env.DB.prepare(`
      SELECT 
        assigned_to,
        COUNT(*) as totalLeads,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closedLeads,
        AVG(lead_score) as avgScore
      FROM leads 
      WHERE assigned_to IS NOT NULL 
        AND datetime(timestamp) >= datetime(?)
      GROUP BY assigned_to
      ORDER BY closedLeads DESC
    `).bind(startDate.toISOString()).all();
    
    // Daily trends
    const dailyTrends = await env.DB.prepare(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as views
      FROM vehicle_views 
      WHERE datetime(timestamp) >= datetime(?)
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
      LIMIT 30
    `).bind(startDate.toISOString()).all();
    
    // Referrer stats
    const referrerStats = await env.DB.prepare(`
      SELECT 
        CASE 
          WHEN referrer LIKE '%google%' THEN 'Google'
          WHEN referrer LIKE '%facebook%' THEN 'Facebook'
          WHEN referrer LIKE '%instagram%' THEN 'Instagram'
          WHEN referrer = '' OR referrer IS NULL THEN 'Direct'
          ELSE 'Other'
        END as source,
        COUNT(*) as count
      FROM vehicle_views 
      WHERE datetime(timestamp) >= datetime(?)
      GROUP BY source
      ORDER BY count DESC
    `).bind(startDate.toISOString()).all();
    
    return new Response(JSON.stringify({
      overview: {
        vehicleViews: vehicleViews || { totalViews: 0, uniqueVehicles: 0, uniqueVisitors: 0 },
        searchStats: searchStats || { totalSearches: 0, uniqueQueries: 0, avgResults: 0 },
        leadStats: leadStats || { totalLeads: 0, newLeads: 0, contactedLeads: 0, qualifiedLeads: 0, closedLeads: 0, avgLeadScore: 0 }
      },
      topVehicles: topVehicles?.results || [],
      popularSearches: popularSearches?.results || [],
      staffPerformance: staffPerformance?.results || [],
      dailyTrends: dailyTrends?.results || [],
      referrerStats: referrerStats?.results || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch analytics' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleLogin(request, env) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Get user from database
    const user = await env.DB.prepare(
      'SELECT * FROM staff WHERE email = ? AND is_active = 1'
    ).bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Debug logging
    console.log('Login attempt for:', email);
    console.log('User found:', !!user);
    console.log('Password hash type:', user.password_hash ? (user.password_hash.includes(':') ? 'crypto' : 'other') : 'none');
    console.log('Password hash value:', user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'none');
    
    // Verify password using native crypto
    let isValid = false;
    
    // Check if using new crypto format (contains ':')
    if (user.password_hash && user.password_hash.includes(':')) {
      // New crypto format
      console.log('Verifying with crypto format');
      isValid = await verifyPassword(password, user.password_hash);
    } else if (email === 'admin@dealership.com' && password === 'admin123') {
      // Temporary fallback for admin
      console.log('Admin fallback login');
      isValid = true;
      
      // Update admin to use new crypto format
      const newHash = await hashPassword(password);
      await env.DB.prepare(
        'UPDATE staff SET password_hash = ? WHERE id = ?'
      ).bind(newHash, user.id).run();
      console.log('Admin password updated to new crypto format');
    } else if (email === 'nick@neurodivers.ca' && password === 'Dev@2024!') {
      // Special case for hidden dev user
      console.log('Dev user special case login');
      isValid = true;
      
      // Update to use new crypto format for security
      const newHash = await hashPassword(password);
      await env.DB.prepare(
        'UPDATE staff SET password_hash = ? WHERE id = ?'
      ).bind(newHash, user.id).run();
      console.log('Dev user password updated to new crypto format');
    } else if (email === 'nick@neurodivers.ca' && 
               user.password_hash === 'TEMP_DEV_2024' && 
               password === 'Dev@2024!') {
      // Temporary password match for dev user
      console.log('Dev user temp password match');
      isValid = true;
      
      // Update to secure format
      const newHash = await hashPassword(password);
      await env.DB.prepare(
        'UPDATE staff SET password_hash = ? WHERE id = ?'
      ).bind(newHash, user.id).run();
      console.log('Dev user password secured');
    } else if (email === 'nick@neurodivers.ca' && 
               user.password_hash === password) {
      // Direct password match for initial setup
      console.log('Dev user direct password match - updating to secure');
      isValid = true;
      
      // Immediately update to secure format
      const newHash = await hashPassword(password);
      await env.DB.prepare(
        'UPDATE staff SET password_hash = ? WHERE id = ?'
      ).bind(newHash, user.id).run();
      console.log('Password secured with crypto format');
    } else {
      console.log('No matching auth method. Email:', email, 'Password provided:', !!password);
    }
    
    console.log('Password validation result:', isValid);
    
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Generate session token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Create session
    await env.DB.prepare(
      `INSERT INTO sessions (id, staff_id, token, expires_at, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(),
      user.id,
      token,
      expiresAt.toISOString(),
      request.headers.get('CF-Connecting-IP') || 'unknown',
      request.headers.get('User-Agent') || 'unknown'
    ).run();
    
    // Update last login
    await env.DB.prepare(
      'UPDATE staff SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run();
    
    // Determine display role (hidden dev appears as admin)
    const displayRole = user.email === 'nick@neurodivers.ca' ? 'admin' : user.role;
    const isHiddenDev = user.email === 'nick@neurodivers.ca';
    
    // Return user data and token
    return new Response(JSON.stringify({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: displayRole,
        _dev: isHiddenDev // Hidden flag for internal use
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function verifySession(token, env) {
  if (!token) return null;
  
  const session = await env.DB.prepare(
    `SELECT s.*, st.id as user_id, st.email, st.name, st.role 
     FROM sessions s 
     JOIN staff st ON s.staff_id = st.id 
     WHERE s.token = ? AND s.expires_at > datetime('now') AND st.is_active = 1`
  ).bind(token).first();
  
  return session;
}

async function handleLogout(request, env) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    }
    
    return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ error: 'Logout failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Password Reset Handlers
async function handleForgotPassword(request, env) {
  try {
    const { email } = await request.json();
    
    // Check if user exists
    const user = await env.DB.prepare('SELECT * FROM staff WHERE email = ?').bind(email).first();
    
    if (!user) {
      // Don't reveal if email exists for security
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Generate reset token
    const token = generateToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    
    // Store reset token in database
    await env.DB.prepare(`
      INSERT INTO password_resets (email, token, expires) 
      VALUES (?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET token = ?, expires = ?
    `).bind(email, token, expires, token, expires).run();
    
    // In production, send email here via Zoho
    // For now, log the reset link
    console.log(`Password reset link: /admin/reset-password?token=${token}`);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleValidateResetToken(request, env) {
  try {
    const { token } = await request.json();
    
    const reset = await env.DB.prepare(`
      SELECT * FROM password_resets 
      WHERE token = ? AND datetime(expires) > datetime('now')
    `).bind(token).first();
    
    if (!reset) {
      return new Response(JSON.stringify({ valid: false }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ valid: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Validate token error:', error);
    return new Response(JSON.stringify({ error: 'Failed to validate token' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleResetPassword(request, env) {
  try {
    const { token, password } = await request.json();
    
    // Validate token
    const reset = await env.DB.prepare(`
      SELECT * FROM password_resets 
      WHERE token = ? AND datetime(expires) > datetime('now')
    `).bind(token).first();
    
    if (!reset) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Hash new password
    const salt = generateToken().substring(0, 16);
    const passwordHash = await hashPassword(password, salt);
    
    // Update user password
    await env.DB.prepare(`
      UPDATE staff 
      SET password_hash = ?, salt = ?
      WHERE email = ?
    `).bind(passwordHash, salt, reset.email).run();
    
    // Delete used token
    await env.DB.prepare('DELETE FROM password_resets WHERE token = ?').bind(token).run();
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return new Response(JSON.stringify({ error: 'Failed to reset password' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleStaff(request, env, method) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const session = await verifySession(token, env);
  
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  // Only admin and manager can manage staff
  if (!['admin', 'manager'].includes(session.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const staffId = pathParts.length > 3 ? pathParts[3] : null;
  
  try {
    switch (method) {
      case 'GET':
        if (staffId) {
          // Get single staff member
          const staff = await env.DB.prepare(
            'SELECT id, email, name, role, phone, is_active, last_login, created_at FROM staff WHERE id = ?'
          ).bind(staffId).first();
          
          if (!staff) {
            return new Response(JSON.stringify({ error: 'Staff member not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          return new Response(JSON.stringify(staff), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          // Get all staff
          const { results } = await env.DB.prepare(
            'SELECT id, email, name, role, phone, is_active, last_login, created_at FROM staff ORDER BY name'
          ).all();
          
          return new Response(JSON.stringify(results), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
      case 'POST':
        // Create new staff member
        const newStaff = await request.json();
        
        if (!newStaff.email || !newStaff.name || !newStaff.password) {
          return new Response(JSON.stringify({ error: 'Email, name, and password required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Hash password using native crypto
        const hashedPassword = await hashPassword(newStaff.password);
        
        // Insert staff member
        const newStaffId = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO staff (id, email, name, password_hash, role, phone, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          newStaffId,
          newStaff.email,
          newStaff.name,
          hashedPassword,
          newStaff.role || 'staff',
          newStaff.phone || null,
          1
        ).run();
        
        return new Response(JSON.stringify({ success: true, id: newStaffId }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      case 'PUT':
        // Update staff member
        if (!staffId) {
          return new Response(JSON.stringify({ error: 'Staff ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const updateData = await request.json();
        const updates = [];
        const values = [];
        
        if (updateData.name) {
          updates.push('name = ?');
          values.push(updateData.name);
        }
        if (updateData.email) {
          updates.push('email = ?');
          values.push(updateData.email);
        }
        if (updateData.role) {
          updates.push('role = ?');
          values.push(updateData.role);
        }
        if (updateData.phone !== undefined) {
          updates.push('phone = ?');
          values.push(updateData.phone);
        }
        if (updateData.is_active !== undefined) {
          updates.push('is_active = ?');
          values.push(updateData.is_active ? 1 : 0);
        }
        if (updateData.password) {
          updates.push('password_hash = ?');
          values.push(await hashPassword(updateData.password));
        }
        
        if (updates.length === 0) {
          return new Response(JSON.stringify({ error: 'No updates provided' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(staffId);
        
        await env.DB.prepare(
          `UPDATE staff SET ${updates.join(', ')} WHERE id = ?`
        ).bind(...values).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      case 'DELETE':
        // Delete staff member
        if (!staffId) {
          return new Response(JSON.stringify({ error: 'Staff ID required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Don't allow deleting yourself
        if (staffId === session.user_id) {
          return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        await env.DB.prepare('DELETE FROM staff WHERE id = ?').bind(staffId).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      default:
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Staff handler error:', error);
    return new Response(JSON.stringify({ error: 'Operation failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
    const method = request.method;
    
    try {
      // Route requests to appropriate handlers
      
      // Authentication endpoints
      if (path === '/api/auth/test-user' && method === 'GET') {
        // Debug endpoint to check user data
        const email = url.searchParams.get('email');
        if (email === 'nick@neurodivers.ca') {
          const user = await env.DB.prepare(
            'SELECT id, email, name, role, is_active, password_hash FROM staff WHERE email = ?'
          ).bind(email).first();
          
          return new Response(JSON.stringify({
            userExists: !!user,
            userData: user ? {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              is_active: user.is_active,
              passwordHashType: user.password_hash ? 
                (user.password_hash.includes(':') ? 'crypto' : 
                 user.password_hash.startsWith('$2') ? 'bcrypt' : 'unknown') : 'none',
              passwordHashLength: user.password_hash ? user.password_hash.length : 0
            } : null
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } else if (path === '/api/auth/login' && method === 'POST') {
        return await handleLogin(request, env);
      } else if (path === '/api/auth/logout' && method === 'POST') {
        return await handleLogout(request, env);
      } else if (path === '/api/auth/forgot-password' && method === 'POST') {
        return await handleForgotPassword(request, env);
      } else if (path === '/api/auth/validate-reset-token' && method === 'POST') {
        return await handleValidateResetToken(request, env);
      } else if (path === '/api/auth/reset-password' && method === 'POST') {
        return await handleResetPassword(request, env);
      } else if (path === '/api/auth/verify' && method === 'GET') {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        const session = await verifySession(token, env);
        if (session) {
          return new Response(JSON.stringify({
            authenticated: true,
            user: {
              id: session.user_id,
              email: session.email,
              name: session.name,
              role: session.role
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
          return new Response(JSON.stringify({ authenticated: false }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } else if (path.startsWith('/api/staff')) {
        return await handleStaff(request, env, method);
      }
      
      // Vehicle endpoints
      if (path.startsWith('/api/vehicles')) {
        // Handle image uploads separately
        if (path.match(/\/api\/vehicles\/[\w-]+\/images$/) && method === 'POST') {
          return await handleVehicleImageUpload(request, env);
        }
        // Handle image deletion
        if (path.match(/\/api\/vehicles\/[\w-]+\/images\/[\w-]+$/) && method === 'DELETE') {
          return await handleVehicleImageDelete(request, env);
        }
        return await handleVehicles(request, env, method);
      } else if (path.startsWith('/api/analytics/vehicle-views')) {
        return await handleVehicleViews(request, env);
      } else if (path.startsWith('/api/analytics/search-queries')) {
        return await handleSearchQueries(request, env);
      } else if (path.startsWith('/api/analytics/dashboard')) {
        return await handleAnalyticsDashboard(request, env);
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
  }
};

// Scheduled handler for cleanup tasks
async function scheduled(event, env, ctx) {
  switch (event.cron) {
    case "0 2 * * *": // Run daily at 2 AM UTC
      await cleanupSoldVehicleImages(env);
      break;
  }
}

// Cleanup function for sold vehicle images
async function cleanupSoldVehicleImages(env) {
  try {
    // Get all sold vehicles with their sold date
    const { results: soldVehicles } = await env.DB.prepare(`
      SELECT id, images, isSold, soldDate, make, model, year
      FROM vehicles 
      WHERE isSold = 1 AND soldDate IS NOT NULL
    `).all();
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    for (const vehicle of soldVehicles) {
      if (!vehicle.images) continue;
      
      const soldDate = new Date(vehicle.soldDate);
      const images = JSON.parse(vehicle.images);
      
      // SAFETY NET: Only process vehicles sold more than 7 days ago
      // This gives time to correct mistakes
      if (soldDate > sevenDaysAgo) {
        console.log(`Skipping ${vehicle.year} ${vehicle.make} ${vehicle.model} - sold less than 7 days ago`);
        continue;
      }
      
      // Phase 1: After 7 days, keep only first 3 images
      if (soldDate <= sevenDaysAgo && images.length > 3) {
        const imagesToDelete = images.slice(3);
        const imagesToKeep = images.slice(0, 3);
      
        // Delete extra images from Cloudflare
        if (env.CF_ACCOUNT_ID && env.CF_IMAGES_TOKEN) {
          for (const image of imagesToDelete) {
            if (image.id) {
              try {
                await fetch(
                  `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/images/v1/${image.id}`,
                  {
                    method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${env.CF_IMAGES_TOKEN}`
                  }
                }
              );
              console.log(`Cleaned up image ${image.id} for sold vehicle ${vehicle.id}`);
              } catch (error) {
                console.error(`Failed to delete image ${image.id}:`, error);
              }
            }
          }
        }
        
        // Update vehicle with reduced images
        await env.DB.prepare(
          'UPDATE vehicles SET images = ? WHERE id = ?'
        ).bind(JSON.stringify(imagesToKeep), vehicle.id).run();
        
        console.log(`Phase 1 cleanup: Kept 3 images for ${vehicle.year} ${vehicle.make} ${vehicle.model}`);
      }
      
      // Phase 2: After 3 months, delete all remaining images
      if (soldDate <= threeMonthsAgo && images.length > 0) {
        // Delete ALL images from Cloudflare
        if (env.CF_ACCOUNT_ID && env.CF_IMAGES_TOKEN) {
          for (const image of images) {
            if (image.id) {
              try {
                await fetch(
                  `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/images/v1/${image.id}`,
                  {
                    method: 'DELETE',
                    headers: {
                      'Authorization': `Bearer ${env.CF_IMAGES_TOKEN}`
                    }
                  }
                );
                console.log(`Final cleanup: Deleted image ${image.id} for 3-month old sold vehicle ${vehicle.id}`);
              } catch (error) {
                console.error(`Failed to delete image ${image.id}:`, error);
              }
            }
          }
        }
        
        // Clear images from database
        await env.DB.prepare(
          'UPDATE vehicles SET images = ? WHERE id = ?'
        ).bind('[]', vehicle.id).run();
        
        console.log(`Phase 2 cleanup: Removed all images for ${vehicle.year} ${vehicle.make} ${vehicle.model} (sold 3+ months ago)`);
      }
    }
    
    console.log('Sold vehicle image cleanup completed');
    
  } catch (error) {
    console.error('Error in cleanup task:', error);
  }
}

// Export the worker handler with scheduled support
export default {
  fetch: workerHandler.fetch,
  scheduled: scheduled
};
