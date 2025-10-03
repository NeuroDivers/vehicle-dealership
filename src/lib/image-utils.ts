/**
 * Cloudflare Images utility functions
 * 
 * Available variants:
 * - public: Original size (use for main display)
 * - w=300: 300px width (use for cards/listings)
 * - thumbnail: 150px width (use for small thumbnails)
 */

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
