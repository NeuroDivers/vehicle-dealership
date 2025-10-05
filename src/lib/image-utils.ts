/**
 * Cloudflare Images utility functions
 * 
 * Available variants:
 * - public: Original size (use for main display)
 * - w=300: 300px width (use for cards/listings)
 * - thumbnail: 150px width (use for small thumbnails)
 */

// Cloudflare Images account hash
const CF_ACCOUNT_HASH = 'fxSXhaLsNKtcGJIGPzWBwA';

/**
 * Constructs a full Cloudflare Images URL from an image ID
 */
export function constructImageUrl(imageId: string, variant: 'public' | 'w=300' | 'thumbnail' = 'public'): string {
  return `https://imagedelivery.net/${CF_ACCOUNT_HASH}/${imageId}/${variant}`;
}

/**
 * Extracts image URL from Cloudflare Images API response
 */
export function extractImageUrl(imageData: any, variant: 'public' | 'w=300' | 'thumbnail' = 'public'): string {
  // If it's already a URL string, return it
  if (typeof imageData === 'string') {
    if (imageData.startsWith('http')) {
      return imageData;
    }
    // Assume it's an ID, construct URL
    return constructImageUrl(imageData, variant);
  }
  
  // Handle response object with variants
  if (imageData.variants) {
    if (Array.isArray(imageData.variants)) {
      // Variants is an array of URLs
      const variantUrl = imageData.variants.find((url: string) => url.includes(`/${variant}`));
      if (variantUrl) return variantUrl;
      // Fallback to first variant
      return imageData.variants[0] || '';
    } else if (typeof imageData.variants === 'object') {
      // Variants is an object with named keys
      return imageData.variants[variant] || imageData.variants.public || '';
    }
  }
  
  // Fallback: use ID to construct URL
  if (imageData.id) {
    return constructImageUrl(imageData.id, variant);
  }
  
  return '';
}

export function getCloudflareImageUrl(imageUrl: string, variant: 'public' | 'w=300' | 'thumbnail' = 'public'): string {
  // Check if it's already a Cloudflare Images URL
  if (imageUrl.includes('imagedelivery.net')) {
    // Replace the variant at the end
    return imageUrl.replace(/\/(public|w=300|thumbnail)$/, `/${variant}`);
  }
  
  // Return as-is if not a Cloudflare Images URL
  return imageUrl;
}

export function getThumbnailUrl(imageUrl: string): string {
  return getCloudflareImageUrl(imageUrl, 'thumbnail');
}

export function getCardImageUrl(imageUrl: string): string {
  return getCloudflareImageUrl(imageUrl, 'w=300');
}

export function getFullImageUrl(imageUrl: string): string {
  return getCloudflareImageUrl(imageUrl, 'public');
}
