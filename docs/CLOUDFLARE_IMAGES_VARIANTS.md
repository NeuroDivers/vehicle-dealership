# Cloudflare Images Variants Setup

## Overview
Create optimized image variants for different use cases to improve performance and reduce bandwidth.

---

## Step 1: Access Cloudflare Images Dashboard

1. Log in to Cloudflare: https://dash.cloudflare.com
2. Go to **Images** → **Variants**
3. Click **"Create Variant"**

---

## Step 2: Create Thumbnail Variant

### Variant 1: Thumbnail (150px)
**Use case:** Small thumbnails in vehicle detail galleries

```
Name: thumbnail
Width: 150
Height: 150
Fit: cover
Quality: 85
Format: auto
```

**Settings:**
- ✅ Fit: Cover (crops to fill dimensions)
- ✅ Quality: 85% (good balance)
- ✅ Format: Auto (WebP for modern browsers, JPEG fallback)

**URL Pattern:**
```
https://imagedelivery.net/{account-hash}/{image-id}/thumbnail
```

---

## Step 3: Verify Existing Variants

### Variant 2: Card Size (300px) - Already Created
**Use case:** Vehicle cards in listings

```
Name: w=300
Width: 300
Height: auto
Fit: scale-down
Quality: 85
Format: auto
```

### Variant 3: Public (Original) - Default
**Use case:** Main vehicle images, full-size display

```
Name: public
Width: original
Height: original
Fit: scale-down
Quality: 85
Format: auto
```

---

## Step 4: Update Code to Use Variants

### Vehicle Detail Page (Thumbnails)
```typescript
// Use thumbnail variant for small gallery images
<Image
  src={img.replace(/\/(public|w=300|thumbnail)$/, '/thumbnail')}
  alt={`Thumbnail ${index + 1}`}
  fill
  className="object-cover"
  sizes="100px"
  loading="lazy"
/>
```

### Vehicle Cards (Listings)
```typescript
// Use w=300 variant for card images
<Image
  src={img.replace(/\/(public|w=300|thumbnail)$/, '/w=300')}
  alt={vehicle.name}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### Main Vehicle Image (Detail Page)
```typescript
// Use public variant for main display
<Image
  src={img} // Already uses /public by default
  alt={vehicle.name}
  fill
  className="object-contain"
  priority
/>
```

---

## Performance Comparison

### Before (Using /public for thumbnails):
- **Thumbnail size**: ~200-500 KB each
- **7 thumbnails**: ~1.4-3.5 MB
- **Load time**: 2-5 seconds

### After (Using /thumbnail variant):
- **Thumbnail size**: ~10-20 KB each
- **7 thumbnails**: ~70-140 KB
- **Load time**: 0.2-0.5 seconds

**Savings: 90-95% reduction in data transfer!** 🚀

---

## Variant Usage Guide

| Use Case | Variant | Size | When to Use |
|----------|---------|------|-------------|
| **Thumbnail Gallery** | `/thumbnail` | 150x150 | Small preview images |
| **Vehicle Cards** | `/w=300` | 300px width | Listing pages, search results |
| **Main Display** | `/public` | Original | Vehicle detail main image |
| **Hero Images** | `/public` | Original | Homepage banners |

---

## Additional Optimization Tips

### 1. Lazy Loading
```typescript
// Add loading="lazy" to thumbnails
<Image
  src={thumbnailUrl}
  loading="lazy"
  alt="Thumbnail"
/>
```

### 2. Proper Sizes Attribute
```typescript
// Tell browser expected display size
<Image
  sizes="(max-width: 768px) 100vw, 300px"
/>
```

### 3. Priority Loading
```typescript
// Use priority for above-the-fold images
<Image
  src={mainImage}
  priority
  alt="Main vehicle"
/>
```

---

## Testing

### Test URLs:
```
Original: https://imagedelivery.net/fxSXhaLsNKtcGJIGPzWBwA/2C4RDGBG6ER179818-1/public
Card: https://imagedelivery.net/fxSXhaLsNKtcGJIGPzWBwA/2C4RDGBG6ER179818-1/w=300
Thumbnail: https://imagedelivery.net/fxSXhaLsNKtcGJIGPzWBwA/2C4RDGBG6ER179818-1/thumbnail
```

### Verify Variants Work:
1. Open each URL in browser
2. Check image loads correctly
3. Verify dimensions match variant settings
4. Test on mobile and desktop

---

## Monitoring

### Check Performance:
1. Open Chrome DevTools → Network tab
2. Filter by "Img"
3. Check image sizes and load times
4. Compare before/after

### Expected Results:
- ✅ Thumbnails: 10-20 KB each
- ✅ Cards: 30-50 KB each
- ✅ Main images: 100-300 KB each
- ✅ Total page load: < 1 MB for images

---

## Troubleshooting

### Variant Not Working?
1. Check variant name matches exactly
2. Verify variant is created in Cloudflare dashboard
3. Clear browser cache
4. Wait 5-10 minutes for CDN propagation

### Images Look Blurry?
1. Increase quality setting (85 → 90)
2. Check variant dimensions are appropriate
3. Ensure fit mode is correct (cover vs scale-down)

---

## Next Steps

1. ✅ Create `thumbnail` variant in Cloudflare
2. ✅ Update vehicle detail component (already done)
3. ✅ Test on staging/production
4. ✅ Monitor performance improvements
5. ✅ Consider creating more variants if needed

---

**Questions?** Contact nick@neurodivers.ca
