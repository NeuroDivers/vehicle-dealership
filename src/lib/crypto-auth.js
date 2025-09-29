// Crypto-based authentication for Cloudflare Workers
// Uses Web Crypto API - native to edge runtime, no external dependencies

/**
 * Hash a password using PBKDF2 with Web Crypto API
 * @param {string} password - Plain text password
 * @param {string} salt - Salt for hashing (base64 encoded)
 * @returns {Promise<string>} - Base64 encoded hash
 */
export async function hashPassword(password, salt = null) {
  // Generate salt if not provided
  if (!salt) {
    const saltBuffer = crypto.getRandomValues(new Uint8Array(16));
    salt = btoa(String.fromCharCode(...saltBuffer));
  }
  
  // Convert password to buffer
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
  
  // Import password as key
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Derive key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000, // Industry standard
      hash: 'SHA-256'
    },
    passwordKey,
    256 // 32 bytes
  );
  
  // Convert to base64
  const hashArray = new Uint8Array(derivedBits);
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  
  // Return salt:hash format
  return `${salt}:${hashBase64}`;
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password to verify
 * @param {string} storedHash - Stored hash in salt:hash format
 * @returns {Promise<boolean>} - True if password matches
 */
export async function verifyPassword(password, storedHash) {
  try {
    // Extract salt and hash
    const [salt, hash] = storedHash.split(':');
    
    if (!salt || !hash) {
      return false;
    }
    
    // Hash the provided password with the same salt
    const newHash = await hashPassword(password, salt);
    
    // Compare hashes
    return newHash === storedHash;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes (default 32)
 * @returns {string} - Hex encoded token
 */
export function generateToken(length = 32) {
  const array = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash data using SHA-256
 * @param {string} data - Data to hash
 * @returns {Promise<string>} - Hex encoded hash
 */
export async function sha256(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a secure API key
 * @returns {string} - API key in format: prefix_randomToken
 */
export function generateApiKey(prefix = 'vd') {
  const token = generateToken(24);
  return `${prefix}_${token}`;
}

/**
 * Time-constant string comparison to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} - True if strings match
 */
export function secureCompare(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Create a JWT-like token (simplified for edge)
 * @param {object} payload - Token payload
 * @param {string} secret - Secret key
 * @returns {Promise<string>} - Signed token
 */
export async function createToken(payload, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  const signature = await sha256(`${encodedHeader}.${encodedPayload}.${secret}`);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify a JWT-like token
 * @param {string} token - Token to verify
 * @param {string} secret - Secret key
 * @returns {Promise<object|null>} - Decoded payload or null if invalid
 */
export async function verifyToken(token, secret) {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    
    if (!encodedHeader || !encodedPayload || !signature) {
      return null;
    }
    
    const expectedSignature = await sha256(`${encodedHeader}.${encodedPayload}.${secret}`);
    
    if (!secureCompare(signature, expectedSignature)) {
      return null;
    }
    
    return JSON.parse(atob(encodedPayload));
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}
