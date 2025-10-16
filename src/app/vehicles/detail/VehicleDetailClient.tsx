'use client';

import { useState, useEffect, useRef } from 'react';
import { getVehicleEndpoint } from '@/lib/api-config';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Car, MapPin, Phone, Mail, Calendar, Fuel, Gauge, ArrowLeft, Palette } from 'lucide-react';
import Link from 'next/link';
import VehicleSEO from './VehicleSEO';
import { trackVehicleView } from '@/lib/analytics-config';
import { getAllVehicleImageUrls } from '@/utils/imageUtils';

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
  isSold: number;
}

export default function VehicleDetailClient({ vehicle }: { vehicle: any }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { getThemeColors } = useSiteSettings();
  const themeColors = getThemeColors();
  
  // Touch gesture detection
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  
  // Detect mobile device based on screen width
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Mobile if width < 768px (tablet breakpoint)
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (vehicle) {
      // Track vehicle view for analytics
      trackVehicleView({
        vehicleId: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        price: vehicle.price,
      });
    }
  }, [vehicle]);

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = (images: string[]) => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;
    
    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        // Swiped left - next image
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      } else {
        // Swiped right - previous image
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!vehicle) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Not Found</h1>
        <p className="text-gray-600 mb-8">Sorry, we couldn&apos;t find the vehicle you&apos;re looking for.</p>
        <Link href="/vehicles" className="text-blue-600 hover:text-blue-800">
          ← Back to Inventory
        </Link>
      </div>
    );
  }

  // Get all images using utility function (handles both vendor URLs and Cloudflare IDs)
  const images = getAllVehicleImageUrls(vehicle.images, 'public');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Image Gallery */}
        <div 
          className="relative h-96 bg-gray-100 rounded-lg overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => handleTouchEnd(images)}
        >
          {images.length > 0 ? (
            <>
              <Image
                src={images[currentImageIndex]}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {images.length > 1 && (
                <>
                  {/* Hide arrows on mobile - swipe gestures only */}
                  {!isMobile && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full hover:bg-white transition"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full hover:bg-white transition"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </>
                  )}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Car className="h-16 w-16" />
            </div>
          )}
        </div>
      
      {/* Back Button */}
      <Link href="/vehicles" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Inventory
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div>
          {vehicle.isSold === 1 && (
            <div className="mt-4 bg-red-100 text-red-800 px-4 py-2 rounded-lg text-center font-semibold">
              This Vehicle Has Been Sold
            </div>
          )}
        </div>

        {/* Details Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          
          <p className="text-3xl font-bold text-green-600 mb-6">
            ${(vehicle.display_price || vehicle.price).toLocaleString()}
          </p>

          {/* Specifications */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Specifications</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Year</p>
                  <p className="font-semibold">{vehicle.year}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Gauge className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Mileage</p>
                  <p className="font-semibold">{vehicle.odometer.toLocaleString()} km</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Car className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Body Type</p>
                  <p className="font-semibold">{vehicle.bodyType}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Palette className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Color</p>
                  <p className="font-semibold">{vehicle.color}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {vehicle.description && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-gray-700">{vehicle.description}</p>
            </div>
          )}

          {/* Contact Section */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Interested in this vehicle?</h2>
            <div className="space-y-4">
              <button
                onClick={() => setShowContactForm(true)}
                className="w-full text-white py-3 px-6 rounded-lg transition font-semibold hover:opacity-90"
                style={{ backgroundColor: themeColors.primary }}
              >
                Get More Information
              </button>
              <button
                onClick={() => setShowContactForm(true)}
                className="w-full border-2 py-3 px-6 rounded-lg transition font-semibold hover:opacity-90"
                style={{ borderColor: themeColors.primary, color: themeColors.primary }}
              >
                Contact Us About This Vehicle
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form Modal - Placeholder */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
            <p className="text-gray-600 mb-4">
              Interested in the {vehicle.year} {vehicle.make} {vehicle.model}?
            </p>
            <p className="text-gray-600 mb-4">
              Call us at: <a href="tel:555-0123" className="font-semibold" style={{ color: themeColors.primary }}>555-0123</a>
            </p>
            <button
              onClick={() => setShowContactForm(false)}
              className="w-full py-2 px-4 rounded-lg text-white font-semibold"
              style={{ backgroundColor: themeColors.primary }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
