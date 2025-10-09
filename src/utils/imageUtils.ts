/**
 * Image utility functions for handling both vendor URLs and Cloudflare Images IDs
 */

const CLOUDFLARE_ACCOUNT_HASH = 'fxSXhaLsNKtcGJIGPzWBwA';
const CLOUDFLARE_IMAGES_BASE = `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}`;

/**
 * Check if a string is a Cloudflare Images ID
 * Format: "VIN-timestamp-index" or similar alphanumeric-timestamp-number pattern
 */
export function isCloudflareImageId(imageString: string): boolean {
  if (!imageString || imageString.startsWith('http') || imageString.startsWith('/')) {
    return false;
  }
  
  // Cloudflare IDs contain hyphens and alphanumeric chars, no dots or slashes
  // Example: "3VV4B7AXXJM208189-1759728536395-0"
  return /^[A-Za-z0-9]+-\d+-\d+$/.test(imageString);
}

/**
 * Convert a Cloudflare Images ID to a full URL with cache optimization
 * @param imageId - The Cloudflare Images ID
 * @param variant - The variant to use (public, thumbnail, mobile, etc.)
 * @param cacheDays - Cache duration in days (default 30)
 * @returns Full Cloudflare Images URL
 */
export function getCloudflareImageUrl(imageId: string, variant: string = 'public', cacheDays: number = 30): string {
  // Cloudflare Images URLs with cache control via variant
  // Cache is handled by Cloudflare Images service (default 30 days)
  return `${CLOUDFLARE_IMAGES_BASE}/${imageId}/${variant}`;
}

/**
 * Detect if user is on mobile device
 * @returns true if mobile device detected
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
}

/**
 * Get the optimal image variant based on device type and use case
 * @param isMobile - Whether the device is mobile
 * @param useCase - The use case (card, detail, thumbnail)
 * @returns The variant name
 */
export function getOptimalVariant(isMobile: boolean, useCase: 'card' | 'detail' | 'thumbnail' = 'card'): string {
  if (useCase === 'thumbnail') return 'thumbnail';
  if (useCase === 'detail') return 'public';
  
  // For card images on homepage/listing
  // Mobile: use 'mobile' variant (optimized for 380x285)
  // Desktop: use 'public' variant (full quality)
  return isMobile ? 'mobile' : 'public';
}

/**
 * Get the appropriate image URL from a vehicle's image field
 * Handles both vendor URLs and Cloudflare Images IDs
 * 
 * @param imagesField - The images field from the database (JSON string or array)
 * @param index - Which image to get (default 0 for main image)
 * @param variant - Cloudflare Images variant (thumbnail, public, etc.)
 * @returns Image URL ready to use in <img> src
 */
export function getVehicleImageUrl(
  imagesField: string | string[] | null | undefined,
  index: number = 0,
  variant: 'thumbnail' | 'public' | 'cover' | 'mobile' | string = 'thumbnail'
): string {
  // Parse images if it's a string
  let images: string[] = [];
  
  if (typeof imagesField === 'string') {
    try {
      images = JSON.parse(imagesField);
    } catch (e) {
      console.warn('Failed to parse images field:', imagesField);
      return '/placeholder-vehicle.jpg';
    }
  } else if (Array.isArray(imagesField)) {
    images = imagesField;
  }
  
  // Get the specific image
  const imageString = images[index];
  if (!imageString) {
    return '/placeholder-vehicle.jpg';
  }
  
  // If it's already a full URL, return as-is
  if (imageString.startsWith('http')) {
    return imageString;
  }
  
  // If it's a Cloudflare Images ID, convert to URL
  if (isCloudflareImageId(imageString)) {
    return getCloudflareImageUrl(imageString, variant);
  }
  
  // If it's a relative path, return as-is
  if (imageString.startsWith('/')) {
    return imageString;
  }
  
  // Fallback
  console.warn('Unknown image format:', imageString);
  return '/placeholder-vehicle.jpg';
}

/**
 * Get all image URLs for a vehicle
 * @param imagesField - The images field from the database
 * @param variant - Cloudflare Images variant
 * @returns Array of image URLs
 */
export function getAllVehicleImageUrls(
  imagesField: string | string[] | null | undefined,
  variant: 'thumbnail' | 'public' | 'cover' | 'mobile' | string = 'public'
): string[] {
  // Parse images
  let images: string[] = [];
  
  if (typeof imagesField === 'string') {
    try {
      images = JSON.parse(imagesField);
    } catch (e) {
      return ['/placeholder-vehicle.jpg'];
    }
  } else if (Array.isArray(imagesField)) {
    images = imagesField;
  }
  
  if (images.length === 0) {
    return ['/placeholder-vehicle.jpg'];
  }
  
  // Convert each image
  return images.map((img, index) => getVehicleImageUrl(imagesField, index, variant));
}
