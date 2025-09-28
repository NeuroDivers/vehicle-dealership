'use client';

import { useEffect } from 'react';
// Remove unused Head import since we're manipulating DOM directly

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  odometer: number;
  bodyType: string;
  color: string;
  description?: string;
  images?: string;
}

interface VehicleSEOProps {
  vehicle: Vehicle;
  images: string[];
}

export default function VehicleSEO({ vehicle, images }: VehicleSEOProps) {
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} - Auto Dealership`;
  const description = `${vehicle.year} ${vehicle.make} ${vehicle.model} in ${vehicle.color}. ${vehicle.bodyType} with ${vehicle.odometer.toLocaleString()} km. Priced at $${vehicle.price.toLocaleString()}. ${vehicle.description || 'Contact us for more details.'}`.substring(0, 160);
  const imageUrl = images.length > 0 ? images[0] : '/default-car.jpg';
  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/vehicles/detail?id=${vehicle.id}`;

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);

    // Update Open Graph tags
    const updateOrCreateMetaTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    updateOrCreateMetaTag('og:title', title);
    updateOrCreateMetaTag('og:description', description);
    updateOrCreateMetaTag('og:image', imageUrl);
    updateOrCreateMetaTag('og:url', url);
    updateOrCreateMetaTag('og:type', 'product');
    updateOrCreateMetaTag('product:price:amount', vehicle.price.toString());
    updateOrCreateMetaTag('product:price:currency', 'USD');

    // Update Twitter Card tags
    const updateOrCreateTwitterTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    updateOrCreateTwitterTag('twitter:card', 'summary_large_image');
    updateOrCreateTwitterTag('twitter:title', title);
    updateOrCreateTwitterTag('twitter:description', description);
    updateOrCreateTwitterTag('twitter:image', imageUrl);

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    // JSON-LD structured data for vehicles
    const structuredData = {
      "@context": "https://schema.org/",
      "@type": "Vehicle",
      "name": `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      "description": description,
      "brand": {
        "@type": "Brand",
        "name": vehicle.make
      },
      "model": vehicle.model,
      "vehicleModelDate": vehicle.year.toString(),
      "color": vehicle.color,
      "bodyType": vehicle.bodyType,
      "mileageFromOdometer": {
        "@type": "QuantitativeValue",
        "value": vehicle.odometer,
        "unitCode": "KMT"
      },
      "offers": {
        "@type": "Offer",
        "price": vehicle.price,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      },
      "image": images,
      "url": url
    };

    // Add or update JSON-LD script
    let jsonLdScript = document.querySelector('script[type="application/ld+json"]');
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(jsonLdScript);
    }
    jsonLdScript.textContent = JSON.stringify(structuredData);

  }, [vehicle, images, title, description, imageUrl, url]);

  return null; // This component doesn't render anything
}
