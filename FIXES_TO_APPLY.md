# Fixes to Apply

## 1. Fix Lambert Scraper Stats (Overview Tab)

In `src/components/admin/LambertScraperPanel.tsx`, find the `runScraper` function around line 150-175 and replace:

```tsx
setRecentVehicles(formattedVehicles.slice(0, 10));
```

With:

```tsx
// Count actual new vs existing vehicles
const actualNewVehicles = formattedVehicles.filter((v: any) => v.status === 'new').length;
const actualExistingVehicles = formattedVehicles.filter((v: any) => v.status === 'existing').length;

// Update stats with correct counts
setStats(prev => ({
  ...prev,
  newVehicles: actualNewVehicles,
  updatedVehicles: actualExistingVehicles
}));

setRecentVehicles(formattedVehicles.slice(0, 10));
```

## 2. Fix Footer Copyright Symbol

In `src/components/Footer.tsx`, find the copyright text (around line 100-120) and replace:

```tsx
{settings.copyright[currentLang]}
```

With:

```tsx
{settings.copyright[currentLang].replace('(c)', '©').replace(/2024/g, new Date().getFullYear().toString())}
```

## 3. Add Disclaimers to Site Settings

In `src/contexts/SiteSettingsContext.tsx`, add to the interface (around line 35):

```tsx
interface SiteSettings {
  // ... existing fields ...
  disclaimers?: {
    en: string;
    fr: string;
    es: string;
  };
}
```

And in defaultSettings (around line 67):

```tsx
const defaultSettings: SiteSettings = {
  // ... existing fields ...
  disclaimers: {
    en: "This vehicle is offered for sale subject to prior sale. All information provided is believed to be accurate but is not guaranteed. Please verify all details with our sales team.",
    fr: "Ce véhicule est offert à la vente sous réserve de vente préalable. Toutes les informations fournies sont considérées comme exactes mais ne sont pas garanties. Veuillez vérifier tous les détails avec notre équipe de vente.",
    es: "Este vehículo se ofrece a la venta sujeto a venta previa. Toda la información proporcionada se considera precisa pero no está garantizada. Por favor verifique todos los detalles con nuestro equipo de ventas."
  }
};
```

## 4. Add Disclaimers to Site Info Manager

In `src/components/SiteInfoManager.tsx`, add disclaimer fields (around line 400, after copyright fields):

```tsx
{/* Disclaimer Section */}
<div className="bg-white rounded-lg shadow p-6">
  <h3 className="text-lg font-semibold mb-4">Vehicle Disclaimers</h3>
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        English Disclaimer
      </label>
      <textarea
        value={siteInfo.disclaimers?.en || ''}
        onChange={(e) => setSiteInfo({
          ...siteInfo,
          disclaimers: {
            ...siteInfo.disclaimers,
            en: e.target.value
          }
        })}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        French Disclaimer
      </label>
      <textarea
        value={siteInfo.disclaimers?.fr || ''}
        onChange={(e) => setSiteInfo({
          ...siteInfo,
          disclaimers: {
            ...siteInfo.disclaimers,
            fr: e.target.value
          }
        })}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Spanish Disclaimer
      </label>
      <textarea
        value={siteInfo.disclaimers?.es || ''}
        onChange={(e) => setSiteInfo({
          ...siteInfo,
          disclaimers: {
            ...siteInfo.disclaimers,
            es: e.target.value
          }
        })}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>
</div>
```

## 5. Use the Improved Vehicle Detail Page

Replace the contents of `src/app/vehicles/detail/VehicleDetailClient.tsx` with the contents from `VehicleDetailImproved.tsx` (created in this session).

Or in `src/app/vehicles/detail/VehicleDetailWrapper.tsx`, change:

```tsx
import VehicleDetailClient from './VehicleDetailClient';
```

To:

```tsx
import VehicleDetailClient from './VehicleDetailImproved';
```

## Summary

These fixes will:
1. ✅ Show correct new vs existing vehicle counts in Lambert scraper overview
2. ✅ Display copyright symbol (©) and current year in footer
3. ✅ Add multilingual disclaimer support to site settings
4. ✅ Improve vehicle detail page with better layout, features, and disclaimer section
5. ✅ Add share, print, and favorite buttons to vehicle pages
