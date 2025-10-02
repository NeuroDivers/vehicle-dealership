# Setup Image Deletion for Vehicle API Worker

## Problem
The vehicle-api-worker doesn't have the CF_IMAGES_TOKEN secret set, so it can't delete images from Cloudflare Images when vehicles are deleted.

## Solution
Copy the CF_IMAGES_TOKEN from another worker to the vehicle-api-worker.

## Steps

### Option 1: Set the secret manually (if you have the token)
```bash
cd workers
npx wrangler secret put CF_IMAGES_TOKEN --config wrangler-vehicle-api.toml
# Paste your Cloudflare Images API token when prompted
```

### Option 2: Get the token from Cloudflare Dashboard
1. Go to https://dash.cloudflare.com/
2. Select your account
3. Go to **Images** → **API Tokens**
4. Copy your existing token (or create a new one)
5. Run the command from Option 1 and paste the token

### Option 3: Use the same token as other workers
The token is already set in:
- lambert-scraper
- naniauto-scraper
- generic-dealer-scraper

You can use the same token value.

## Verify
After setting the secret, deploy the worker:
```bash
cd workers
npx wrangler deploy --config wrangler-vehicle-api.toml
```

Then test by deleting a vehicle from the admin panel. Check Cloudflare Images to confirm the images were deleted.

## How It Works
When you delete a vehicle:
1. API gets vehicle data (including VIN)
2. Calls `deleteVehicleImages(VIN)` function
3. Tries to delete images: `{VIN}-1`, `{VIN}-2`, etc.
4. Deletes vehicle from database
5. Returns success with `imagesDeleted: true`

## Troubleshooting
If images still aren't being deleted:
1. Check worker logs: https://dash.cloudflare.com/ → Workers → vehicle-dealership-api → Logs
2. Look for errors like "No Cloudflare Images credentials"
3. Verify the secret is set: `npx wrangler secret list --config wrangler-vehicle-api.toml`
