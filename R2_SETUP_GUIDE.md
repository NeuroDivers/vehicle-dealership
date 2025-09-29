# Cloudflare R2 Setup Guide for Vehicle Images

## Overview
This guide will help you set up Cloudflare R2 for storing vehicle images. R2 is Cloudflare's object storage service, similar to AWS S3 but with no egress fees.

## Step 1: Create R2 Bucket

1. **Log in to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Select your account

2. **Navigate to R2**
   - Click on "R2" in the left sidebar
   - Click "Create bucket"

3. **Configure Bucket**
   - Name: `vehicle-images` (or your preferred name)
   - Location: Choose "Automatic" for best performance
   - Click "Create bucket"

## Step 2: Configure Public Access (Optional)

If you want images to be publicly accessible:

1. Go to your bucket settings
2. Click on "Settings" tab
3. Under "Public Access", click "Allow public access"
4. Note your public bucket URL (format: `https://pub-[hash].r2.dev`)

## Step 3: Update Worker Configuration

1. **Update wrangler.toml**
   ```toml
   # Uncomment these lines in wrangler.toml
   [[r2_buckets]]
   binding = "R2_BUCKET"
   bucket_name = "vehicle-images"  # Use your bucket name
   ```

2. **Update the worker code**
   - Open `src/worker.js`
   - Find the `handleVehicleImageUpload` function
   - Uncomment the production code block
   - Update the public URL with your R2 bucket URL

## Step 4: Deploy the Worker

```bash
# Deploy the updated worker with R2 binding
wrangler deploy
```

## Step 5: Configure CORS (if needed)

If you're uploading directly from the browser:

1. Go to your R2 bucket settings
2. Click on "CORS Policy"
3. Add this policy:
   ```json
   [
     {
       "AllowedOrigins": ["https://your-domain.com"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

## Alternative: Use Cloudflare Images (Recommended for Production)

For production use, consider **Cloudflare Images** instead of R2:
- Automatic image optimization
- Multiple variants (thumbnail, full size, etc.)
- Built-in CDN delivery
- $5/month for 100,000 images

### To use Cloudflare Images:

1. **Enable Cloudflare Images**
   - Go to Dashboard > Images
   - Click "Enable Cloudflare Images"
   - Note your Account Hash

2. **Update the upload endpoint**
   ```javascript
   // Use Cloudflare Images API
   const response = await fetch(
     `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1`,
     {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${API_TOKEN}`
       },
       body: formData
     }
   );
   ```

## Cost Comparison

### R2 Storage:
- **Storage**: $0.015/GB per month
- **Operations**: $0.36 per million Class A operations
- **No egress fees**

### Cloudflare Images:
- **$5/month** for 100,000 images
- **$1 per 100,000 images** beyond that
- Includes optimization and CDN

## Current Implementation Status

The worker currently returns instructions for R2 setup when image upload is attempted. Once R2 is configured:

1. The worker will handle image uploads
2. Images will be stored in R2 with proper organization
3. URLs will be saved in the D1 database
4. The admin panel can display and manage images

## Troubleshooting

### "R2 bucket not configured" error
- Ensure wrangler.toml has the R2 binding uncommented
- Redeploy the worker after adding the binding

### Images not displaying
- Check if the bucket has public access enabled
- Verify the public URL format is correct
- Check CORS settings if uploading from browser

### Upload failures
- Verify file size limits (R2 supports up to 5TB per object)
- Check worker logs for specific errors
- Ensure proper authentication if using private bucket

## Next Steps

1. Create the R2 bucket in Cloudflare dashboard
2. Update wrangler.toml with the binding
3. Redeploy the worker
4. Test image upload from the admin panel
5. Consider migrating to Cloudflare Images for production
