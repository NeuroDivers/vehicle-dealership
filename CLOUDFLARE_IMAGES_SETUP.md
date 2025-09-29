# Cloudflare Images Setup Guide

## Overview
This guide will help you set up Cloudflare Images for optimized vehicle image storage and delivery.

## Step 1: Enable Cloudflare Images

1. **Log in to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Select your account

2. **Navigate to Images**
   - Click on "Images" in the left sidebar
   - Click "Enable Cloudflare Images"
   - Confirm the $5/month subscription

3. **Note Your Account Details**
   - **Account ID**: Found in the right sidebar of your dashboard
   - **Account Hash**: Found in Images > Overview (looks like: `abc123def456`)

## Step 2: Create API Token

1. **Go to API Tokens**
   - Click your profile icon (top right)
   - Select "My Profile"
   - Go to "API Tokens" tab
   - Click "Create Token"

2. **Configure Token Permissions**
   - Use "Custom token" template
   - Token name: `Vehicle Dealership Images`
   - Permissions:
     - Account > Cloudflare Images > Edit
   - Click "Continue to summary"
   - Click "Create Token"
   - **SAVE YOUR TOKEN** (shown only once!)

## Step 3: Configure Image Variants

1. **Go to Images > Variants**
2. **Create these variants:**

   **Thumbnail** (for vehicle cards)
   - Name: `thumbnail`
   - Width: 400px
   - Height: 300px
   - Fit: Cover
   - Quality: 85

   **Gallery** (for vehicle detail page)
   - Name: `gallery`
   - Width: 1200px
   - Height: 800px
   - Fit: Scale Down
   - Quality: 90

   **Public** (full size, optimized)
   - Name: `public`
   - Width: 2000px
   - Height: Auto
   - Fit: Scale Down
   - Quality: 95

## Step 4: Update Worker Configuration

1. **Edit wrangler.toml**
   ```toml
   [vars]
   ENVIRONMENT = "production"
   CF_ACCOUNT_ID = "your-account-id-here"
   CF_ACCOUNT_HASH = "your-account-hash-here"
   CF_IMAGES_TOKEN = "your-api-token-here"
   ```

2. **Deploy the Worker**
   ```bash
   wrangler deploy
   ```

## Step 5: Test Image Upload

1. Go to your admin panel: `/admin/vehicles/add`
2. Try uploading an image
3. Check if the image appears with proper variants

## Image URL Structure

Once uploaded, your images will be available at:
- **Thumbnail**: `https://imagedelivery.net/{account-hash}/{image-id}/thumbnail`
- **Gallery**: `https://imagedelivery.net/{account-hash}/{image-id}/gallery`
- **Public**: `https://imagedelivery.net/{account-hash}/{image-id}/public`

## Features You Get

### Automatic Optimizations
- **Format conversion**: Serves WebP/AVIF to supported browsers
- **Quality adjustment**: Based on network speed
- **Lazy loading**: Built-in support
- **Responsive images**: Automatic srcset generation

### Performance Benefits
- **Global CDN**: Images served from 200+ locations
- **Smart caching**: Optimized cache headers
- **Polish**: Additional compression (if enabled)
- **Mirage**: Mobile optimization (if enabled)

## Cost Breakdown

### Monthly Costs
- **Base**: $5/month (includes 100,000 images)
- **Additional storage**: $5 per 100,000 images
- **Delivery**: $1 per 100,000 delivered images

### Example for Dealership
- 500 vehicles × 10 images = 5,000 images
- Monthly cost: **$5** (well under 100k limit)
- Unlimited delivery to first 100k requests

## Troubleshooting

### "Cloudflare Images not configured" error
- Ensure all three variables are set in wrangler.toml
- Redeploy the worker after adding variables

### Images not displaying
- Check if variants are created correctly
- Verify the account hash is correct
- Check browser console for errors

### Upload failures
- Verify API token has Images:Edit permission
- Check file size (max 10MB per image)
- Ensure image format is supported (JPEG, PNG, GIF, WebP, AVIF)

## Advanced Features

### Polish (Optional)
Enable Polish for additional compression:
1. Go to Speed > Optimization
2. Enable Polish
3. Select "Lossy" for maximum compression

### Flexible Variants
You can create custom variants for specific use cases:
- `mobile`: 600px width for mobile views
- `hero`: 1920px width for homepage banners
- `social`: 1200x630px for social media sharing

## Migration from R2

If you were using R2:
1. Images in R2 remain accessible
2. New uploads go to Cloudflare Images
3. Gradually migrate old images if needed

## Best Practices

1. **Use appropriate variants**
   - Thumbnail for listings
   - Gallery for detail pages
   - Public only when needed

2. **Optimize before upload**
   - Remove EXIF data
   - Use reasonable resolutions
   - Consider initial compression

3. **Monitor usage**
   - Check Images dashboard regularly
   - Monitor bandwidth usage
   - Track variant performance

## Support

- **Cloudflare Docs**: https://developers.cloudflare.com/images/
- **API Reference**: https://api.cloudflare.com/#cloudflare-images
- **Community**: https://community.cloudflare.com/
