# Cloudflare R2 Setup Guide for Vehicle Images

## Overview
This guide will help you set up Cloudflare R2 for storing vehicle images. R2 is Cloudflare's object storage service, compatible with S3 APIs, with no egress fees.

## Step 1: Create R2 Bucket

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** in the sidebar
3. Click **Create bucket**
4. Name your bucket: `vehicle-images`
5. Choose your region (select closest to your users)
6. Click **Create bucket**

## Step 2: Create R2 API Token

1. In R2 dashboard, go to **Manage R2 API tokens**
2. Click **Create API token**
3. Configure the token:
   - **Name**: `vehicle-dealership-upload`
   - **Permissions**: `Object Read & Write`
   - **Specify bucket**: Select `vehicle-images`
   - **TTL**: Leave as default (forever)
4. Click **Create API Token**
5. **IMPORTANT**: Save these credentials securely:
   - Access Key ID
   - Secret Access Key
   - Endpoint URL (e.g., `https://[account-id].r2.cloudflarestorage.com`)

## Step 3: Configure Public Access (for displaying images)

1. Go to your bucket settings
2. Navigate to **Settings** → **Public access**
3. Enable **Public bucket** or configure **Custom domain**
4. If using custom domain:
   - Add a subdomain like `images.yourdomain.com`
   - Cloudflare will handle SSL automatically

## Step 4: Update Worker Environment Variables

Add these to your Worker's environment variables:

```bash
# In Cloudflare Dashboard → Workers → Your Worker → Settings → Variables
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
R2_BUCKET_NAME=vehicle-images
R2_PUBLIC_URL=https://images.yourdomain.com  # or public bucket URL
```

## Step 5: Install Required Packages

In your Worker API project:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Step 6: Worker API Code for Image Upload

Add this to your Worker (vehicle-dealership-api):

```typescript
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

// Route: POST /api/upload/presigned-url
if (path === '/api/upload/presigned-url' && request.method === 'POST') {
  try {
    const { fileName, fileType } = await request.json();
    
    // Generate unique file name
    const key = `vehicles/${Date.now()}-${fileName}`;
    
    // Create presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });
    
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;
    
    return new Response(JSON.stringify({ uploadUrl, publicUrl }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to generate upload URL' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
```

## Step 7: Frontend Upload Code

Update the `handleImageUpload` function in EditVehicleClient.tsx:

```typescript
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setUploadingImage(true);
  
  try {
    // Get presigned URL from API
    const presignedRes = await fetch('https://vehicle-dealership-api.nick-damato0011527.workers.dev/api/upload/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
      }),
    });
    
    const { uploadUrl, publicUrl } = await presignedRes.json();
    
    // Upload directly to R2
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
    
    // Add image URL to form data
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), publicUrl],
    }));
    
  } catch (error) {
    console.error('Upload failed:', error);
    alert('Failed to upload image');
  } finally {
    setUploadingImage(false);
    e.target.value = '';
  }
};
```

## Step 8: Database Schema Update

Run this SQL in your D1 database:

```sql
-- Add images column if it doesn't exist
ALTER TABLE vehicles ADD COLUMN images TEXT;
```

## Pricing

**R2 Storage Costs:**
- **Storage**: $0.015 per GB/month
- **Class A operations** (uploads): $4.50 per million requests
- **Class B operations** (downloads): $0.36 per million requests
- **NO egress fees** (unlike S3)

**Example for 100 vehicles with 5 images each (2MB per image):**
- Storage: 1GB = $0.015/month
- Uploads: 500 images = $0.00225
- Downloads: Unlimited views = $0 (no egress fees!)

## Security Best Practices

1. **Never expose R2 credentials in frontend code**
2. **Use presigned URLs for uploads**
3. **Validate file types and sizes in Worker**
4. **Set up CORS policies on your bucket**
5. **Use Cloudflare's built-in DDoS protection**

## Testing

1. Upload a test image through the admin panel
2. Verify image appears in R2 bucket
3. Check image displays on vehicle page
4. Test image deletion functionality

## Troubleshooting

**CORS Issues:**
- Add your domain to R2 bucket CORS settings
- Ensure Worker returns proper CORS headers

**Upload Failures:**
- Check R2 API token permissions
- Verify environment variables are set correctly
- Check Worker logs for errors

**Images Not Displaying:**
- Verify public access is configured
- Check if custom domain is properly set up
- Ensure image URLs are correctly stored in database

## Next Steps

After R2 is set up:
1. Deploy updated Worker with image upload endpoints
2. Test image upload in admin panel
3. Update vehicle cards to display images
4. Add image gallery to vehicle detail pages
