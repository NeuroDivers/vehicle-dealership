# Frontend Markup Display Implementation

## Overview
The frontend now displays vehicle prices **with markup applied** by default, using the `display_price` field calculated by the backend.

## Changes Made

### 1. Vehicle Listing Page (`src/app/vehicles/page.tsx`)
- **Display:** Shows `display_price` (if available) instead of base `price`
- **Sorting:** Price sorting uses `display_price` for accurate ordering
- **Filtering:** Price range filters use `display_price` for correct results
- **Interface:** Added `display_price?: number` to Vehicle interface

### 2. Vehicle Detail Pages

#### VehicleDetailImproved.tsx
- **Price Display:** Shows `display_price` prominently
- **Strikethrough:** Original price shown with line-through when markup exists
- **Share Function:** Uses marked-up price in share text
- **Financing Modal:** Passes marked-up price for calculations
- **SEO/Schema:** Structured data uses marked-up price

#### VehicleDetailClient.tsx
- **Price Display:** Shows `display_price` instead of base price

#### VehicleSEO.tsx
- **Meta Tags:** All price meta tags use `display_price`
- **Schema.org:** Product offer price uses marked-up amount
- **Social Sharing:** Open Graph price uses markup

## How It Works

### Backend Calculation
The backend (`src/worker.js`) automatically calculates `display_price`:
```javascript
// For POST /api/vehicles and PUT /api/vehicles/:id
if (vehicle.price_markup_type === 'vendor_default') {
  // Get vendor's default markup
  const vendorSettings = await env.DB.prepare(
    `SELECT markup_type, markup_value FROM vendor_settings WHERE vendor_id = ?`
  ).bind(vehicle.vendor_id).first();
  
  display_price = calculateDisplayPrice(price, vendorSettings.markup_type, vendorSettings.markup_value);
} else if (vehicle.price_markup_type === 'amount') {
  display_price = price + vehicle.price_markup_value;
} else if (vehicle.price_markup_type === 'percentage') {
  display_price = price + (price * (vehicle.price_markup_value / 100));
}
```

### Frontend Display
The frontend simply uses `display_price` when available:
```typescript
// Always use display_price if it exists, otherwise fall back to base price
${(vehicle.display_price || vehicle.price).toLocaleString()}
```

### Visual Indication of Markup
When a markup is applied (display_price > price):
```typescript
<p className="text-4xl font-bold">
  ${vehicle.display_price.toLocaleString()}
</p>
{vehicle.display_price > vehicle.price && (
  <p className="text-xl text-gray-500 line-through">
    ${vehicle.price.toLocaleString()}
  </p>
)}
```

## User Experience

### On Listing Page
- Customers see marked-up prices immediately
- Sorting by price works correctly with markups
- Filtering by price range uses marked-up amounts

### On Detail Page
- Large, prominent display of marked-up price
- Original price shown as strikethrough (if markup exists)
- Financing calculator uses marked-up price
- Share functionality includes marked-up price

### SEO Benefits
- Search engines see correct price in meta tags
- Schema.org structured data accurate
- Social media cards display marked-up price

## Examples

### Example 1: Vendor Default Markup
```
Backend:
- Base Price: $25,000
- Lambert Auto Default: +8%
- Calculated display_price: $27,000

Frontend Display:
$27,000
$25,000 (strikethrough)
```

### Example 2: Individual Vehicle Override
```
Backend:
- Base Price: $30,000
- Vehicle Override: +$2,500 (amount)
- Calculated display_price: $32,500

Frontend Display:
$32,500
$30,000 (strikethrough)
```

### Example 3: No Markup
```
Backend:
- Base Price: $20,000
- Markup Type: none
- display_price: $20,000

Frontend Display:
$20,000
(no strikethrough)
```

## Benefits

✅ **Transparent Pricing** - Customers see the actual sale price  
✅ **Automatic Updates** - Frontend automatically reflects backend markup changes  
✅ **Accurate Calculations** - Financing, sorting, filtering all use correct prices  
✅ **SEO Optimized** - Search engines index marked-up prices  
✅ **Visual Clarity** - Strikethrough shows value/savings when markup applied  

## Deployment Notes

After deploying:
1. ✅ Database migration adds `display_price` column
2. ✅ Backend calculates `display_price` on INSERT/UPDATE
3. ✅ Frontend displays `display_price` automatically
4. ✅ No additional configuration needed

## Backward Compatibility

If `display_price` is NULL or undefined:
- Frontend falls back to base `price`
- No breaking changes
- System works with or without markups
