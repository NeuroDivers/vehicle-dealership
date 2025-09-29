// Authentication handler for D1 Worker
// This handles login, logout, and session management

import { compare, hash } from 'bcryptjs';

// Generate a random token
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Hash password
export async function hashPassword(password) {
  return await hash(password, 10);
}

// Verify password
export async function verifyPassword(password, hashedPassword) {
  return await compare(password, hashedPassword);
}

// Handle login
export async function handleLogin(request, env) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get user from database
    const user = await env.DB.prepare(
      'SELECT * FROM staff WHERE email = ? AND is_active = 1'
    ).bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generate session token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Store session in database
    await env.DB.prepare(
      'INSERT INTO sessions (token, staff_id, expires_at) VALUES (?, ?, ?)'
    ).bind(token, user.id, expiresAt.toISOString()).run();
    
    // Update last login
    await env.DB.prepare(
      'UPDATE staff SET last_login = ? WHERE id = ?'
    ).bind(new Date().toISOString(), user.id).run();
    
    // Ensure dev role is properly passed
    const userRole = user.role === 'dev' ? 'dev' : (user.role || 'staff');
    
    return new Response(JSON.stringify({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: userRole
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Verify session
export async function verifySession(token, env) {
  if (!token) return null;
  
  const session = await env.DB.prepare(
    `SELECT s.*, st.id as user_id, st.email, st.name, st.role 
     FROM sessions s 
     JOIN staff st ON s.staff_id = st.id 
     WHERE s.token = ? AND s.expires_at > datetime('now') AND st.is_active = 1`
  ).bind(token).first();
  
  return session;
}

// Handle logout
export async function handleLogout(request, env) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    }
    
    return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ error: 'Logout failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle staff CRUD operations
export async function handleStaff(request, env, method) {
  try {
    // Verify authentication
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const session = await verifySession(token, env);
    
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if user has admin or manager role
    if (!['admin', 'manager'].includes(session.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    switch (method) {
      case 'GET':
        // Get all staff
        const { results } = await env.DB.prepare(
          'SELECT id, email, name, role, phone, is_active, last_login, created_at FROM staff ORDER BY name'
        ).all();
        
        return new Response(JSON.stringify(results), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      case 'POST':
        // Create new staff member
        const newStaff = await request.json();
        
        if (!newStaff.email || !newStaff.name || !newStaff.password) {
          return new Response(JSON.stringify({ error: 'Email, name, and password required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Hash password
        const hashedPassword = await hashPassword(newStaff.password);
        
        // Insert staff member
        const staffId = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO staff (id, email, name, password_hash, role, phone, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          staffId,
          newStaff.email,
          newStaff.name,
          hashedPassword,
          newStaff.role || 'staff',
          newStaff.phone || null,
          1
        ).run();
        
        // Log activity
        await env.DB.prepare(
          `INSERT INTO activity_log (id, staff_id, action, entity_type, entity_id, ip_address)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          crypto.randomUUID(),
          session.user_id,
          'create',
          'staff',
          staffId,
          request.headers.get('CF-Connecting-IP') || 'unknown'
        ).run();
        
        return new Response(JSON.stringify({ success: true, id: staffId }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
        
      case 'PUT':
        // Update staff member
        const url = new URL(request.url);
        const staffId = url.pathname.split('/').pop();
        const updateData = await request.json();
        
        // Build update query
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
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(staffId);
        
        await env.DB.prepare(
          `UPDATE staff SET ${updates.join(', ')} WHERE id = ?`
        ).bind(...values).run();
        
        // Log activity
        await env.DB.prepare(
          `INSERT INTO activity_log (id, staff_id, action, entity_type, entity_id, details, ip_address)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          crypto.randomUUID(),
          session.user_id,
          'update',
          'staff',
          staffId,
          JSON.stringify(updateData),
          request.headers.get('CF-Connecting-IP') || 'unknown'
        ).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      case 'DELETE':
        // Delete staff member
        const deleteUrl = new URL(request.url);
        const deleteId = deleteUrl.pathname.split('/').pop();
        
        // Don't allow deleting yourself
        if (deleteId === session.user_id) {
          return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        await env.DB.prepare('DELETE FROM staff WHERE id = ?').bind(deleteId).run();
        
        // Log activity
        await env.DB.prepare(
          `INSERT INTO activity_log (id, staff_id, action, entity_type, entity_id, ip_address)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(
          crypto.randomUUID(),
          session.user_id,
          'delete',
          'staff',
          deleteId,
          request.headers.get('CF-Connecting-IP') || 'unknown'
        ).run();
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      default:
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Staff handler error:', error);
    return new Response(JSON.stringify({ error: 'Operation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
