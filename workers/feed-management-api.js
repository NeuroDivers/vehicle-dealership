/**
 * Feed Management API Worker
 * CRUD operations for vendor_feeds table
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Get all feeds
      if (url.pathname === '/api/feeds' && request.method === 'GET') {
        const feeds = await env.DB.prepare(`
          SELECT * FROM vendor_feeds ORDER BY vendor_name ASC
        `).all();
        
        return new Response(JSON.stringify({
          success: true,
          feeds: feeds.results
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get single feed
      if (url.pathname.startsWith('/api/feeds/') && request.method === 'GET') {
        const vendorId = url.pathname.split('/').pop();
        
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
          feed: feed
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Create new feed
      if (url.pathname === '/api/feeds' && request.method === 'POST') {
        const body = await request.json();
        
        const { vendor_id, vendor_name, feed_url, feed_type, is_active, sync_frequency } = body;
        
        if (!vendor_id || !vendor_name || !feed_url) {
          return new Response(JSON.stringify({
            success: false,
            error: 'vendor_id, vendor_name, and feed_url are required'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // Check if vendor_id already exists
        const existing = await env.DB.prepare(`
          SELECT id FROM vendor_feeds WHERE vendor_id = ?
        `).bind(vendor_id).first();
        
        if (existing) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Feed with this vendor_id already exists'
          }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        await env.DB.prepare(`
          INSERT INTO vendor_feeds (
            vendor_id, vendor_name, feed_url, feed_type, is_active, sync_frequency
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          vendor_id,
          vendor_name,
          feed_url,
          feed_type || 'xml',
          is_active !== undefined ? is_active : 1,
          sync_frequency || 'manual'
        ).run();
        
        // Also create vendor_settings entry if it doesn't exist
        await env.DB.prepare(`
          INSERT OR IGNORE INTO vendor_settings (vendor_id, vendor_name, markup_type, markup_value)
          VALUES (?, ?, 'none', 0)
        `).bind(vendor_id, vendor_name).run();
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Feed created successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update feed
      if (url.pathname.startsWith('/api/feeds/') && request.method === 'PUT') {
        const vendorId = url.pathname.split('/').pop();
        const body = await request.json();
        
        const { vendor_name, feed_url, feed_type, is_active, sync_frequency } = body;
        
        const feed = await env.DB.prepare(`
          SELECT id FROM vendor_feeds WHERE vendor_id = ?
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
        
        await env.DB.prepare(`
          UPDATE vendor_feeds SET
            vendor_name = COALESCE(?, vendor_name),
            feed_url = COALESCE(?, feed_url),
            feed_type = COALESCE(?, feed_type),
            is_active = COALESCE(?, is_active),
            sync_frequency = COALESCE(?, sync_frequency),
            updated_at = datetime('now')
          WHERE vendor_id = ?
        `).bind(
          vendor_name || null,
          feed_url || null,
          feed_type || null,
          is_active !== undefined ? is_active : null,
          sync_frequency || null,
          vendorId
        ).run();
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Feed updated successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Delete feed
      if (url.pathname.startsWith('/api/feeds/') && request.method === 'DELETE') {
        const vendorId = url.pathname.split('/').pop();
        
        const feed = await env.DB.prepare(`
          SELECT id FROM vendor_feeds WHERE vendor_id = ?
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
        
        await env.DB.prepare(`
          DELETE FROM vendor_feeds WHERE vendor_id = ?
        `).bind(vendorId).run();
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Feed deleted successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: false,
        error: 'Not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('API error:', error);
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
