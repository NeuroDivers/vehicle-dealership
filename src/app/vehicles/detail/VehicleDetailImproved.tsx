'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { getVehicleEndpoint } from '@/lib/api-config';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, Phone, Mail, Car, Share2, Calendar, Gauge, Fuel, Settings, 
  Palette, Hash, Barcode, MapPin, ChevronLeft, ChevronRight, Shield,
  CheckCircle, Info, Star, Heart, Printer, DollarSign
} from 'lucide-react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { getAllVehicleImageUrls } from '@/utils/imageUtils';
import { trackVehicleView } from '@/lib/analytics-config';
import FinancingModal from '@/components/FinancingModal';

export default function VehicleDetailImproved({ vehicle }: { vehicle: any }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showFinancingModal, setShowFinancingModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { settings, getThemeColors } = useSiteSettings();
  const themeColors = getThemeColors();
  
  // Get current language
  const [currentLang, setCurrentLang] = useState<'en' | 'fr' | 'es'>('en');
  const [isMobile, setIsMobile] = useState(false);
  
  // Touch gesture detection
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
    if (isRightSwipe) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };
  
  // Detect mobile device based on screen width
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Mobile if width < 768px
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useEffect(() => {
    const storedLang = localStorage.getItem('language') as 'en' | 'fr' | 'es';
    if (storedLang) {
      setCurrentLang(storedLang);
    }
    
    // Listen for language changes
    const handleLangChange = () => {
      const newLang = localStorage.getItem('language') as 'en' | 'fr' | 'es';
      if (newLang) setCurrentLang(newLang);
    };
    
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  useEffect(() => {
    if (vehicle) {
      trackVehicleView({
        vehicleId: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        price: vehicle.price,
      });
    }
  }, [vehicle]);

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

  // Get disclaimer text based on language
  const getDisclaimer = () => {
    const disclaimers = settings?.disclaimers || {
      en: "This vehicle is offered for sale subject to prior sale. All information provided is believed to be accurate but is not guaranteed. Please verify all details with our sales team.",
      fr: "Ce véhicule est offert à la vente sous réserve de vente préalable. Toutes les informations fournies sont considérées comme exactes mais ne sont pas garanties. Veuillez vérifier tous les détails avec notre équipe de vente.",
      es: "Este vehículo se ofrece a la venta sujeto a venta previa. Toda la información proporcionada se considera precisa pero no está garantizada. Por favor verifique todos los detalles con nuestro equipo de ventas."
    };
    return disclaimers[currentLang] || disclaimers.en;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        text: `Check out this ${vehicle.year} ${vehicle.make} ${vehicle.model} for $${vehicle.price?.toLocaleString()}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb & Actions Bar */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/vehicles" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inventory
        </Link>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            title="Add to favorites"
          >
            <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            title="Share"
          >
            <Share2 className="h-5 w-5 text-gray-400" />
          </button>
          <button
            onClick={handlePrint}
            className="p-2 rounded-lg hover:bg-gray-100 transition print:hidden"
            title="Print"
          >
            <Printer className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enhanced Image Gallery */}
        <div>
          <div 
            className="relative h-[400px] md:h-[450px] lg:h-[500px] bg-gray-100 rounded-xl overflow-hidden shadow-lg"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {images.length > 0 ? (
              <>
                <Image
                  src={images[currentImageIndex]}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                {images.length > 1 && (
                  <>
                    {/* Hide arrows on mobile - swipe gestures only */}
                    {!isMobile && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-lg hover:bg-white transition"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-lg hover:bg-white transition"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </button>
                      </>
                    )}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full">
                      <span className="text-white text-sm">{currentImageIndex + 1} / {images.length}</span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Car className="h-24 w-24" />
              </div>
            )}
          </div>
          
          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 md:grid-cols-6 gap-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative h-16 md:h-20 rounded-lg overflow-hidden border-2 transition hover:opacity-80 ${
                    index === currentImageIndex ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'
                  }`}
                >
                  <Image
                    src={img.replace(/\/(public|w=300|thumbnail)$/, '/thumbnail')}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="100px"
                    loading="lazy"
                  />
                  {index === currentImageIndex && (
                    <div className="absolute inset-0 bg-blue-500/20" />
                  )}
                </button>
              ))}
            </div>
          )}
          
          {vehicle.isSold === 1 && (
            <div className="mt-4 bg-red-100 text-red-800 px-4 py-3 rounded-lg text-center font-semibold">
              This Vehicle Has Been Sold
            </div>
          )}
        </div>

        {/* Enhanced Details Section */}
        <div>
          {/* Title & Price */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <div className="flex items-baseline space-x-4">
              <p className="text-4xl font-bold" style={{ color: themeColors.primary }}>
                ${vehicle.price ? vehicle.price.toLocaleString() : 'Call for Price'}
              </p>
              {vehicle.originalPrice && vehicle.originalPrice > vehicle.price && (
                <p className="text-xl text-gray-500 line-through">
                  ${vehicle.originalPrice.toLocaleString()}
                </p>
              )}
            </div>
          </div>
          
          {/* Key Features Grid */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Info className="h-5 w-5 mr-2" style={{ color: themeColors.primary }} />
              Key Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Year</p>
                    <p className="font-semibold text-lg">{vehicle.year}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Gauge className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Mileage</p>
                    <p className="font-semibold text-lg">
                      {vehicle.odometer ? `${vehicle.odometer.toLocaleString()} km` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Car className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Body Type</p>
                    <p className="font-semibold text-lg">{vehicle.bodyType || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Palette className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Color</p>
                    <div className="flex items-center space-x-2">
                      {vehicle.color?.startsWith('#') ? (
                        <>
                          <div 
                            className="w-6 h-6 rounded border border-gray-300" 
                            style={{ backgroundColor: vehicle.color }}
                          />
                          <span className="font-semibold text-lg">Custom</span>
                        </>
                      ) : (
                        <span className="font-semibold text-lg">{vehicle.color || 'N/A'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Fuel className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Fuel Type</p>
                    <p className="font-semibold text-lg">{vehicle.fuelType || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Settings className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Transmission</p>
                    <p className="font-semibold text-lg">{vehicle.transmission || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {/* Engine Size */}
              {vehicle.engineSize && (
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Gauge className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Engine Size</p>
                      <p className="font-semibold text-lg">{vehicle.engineSize}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Cylinders */}
              {vehicle.cylinders && (
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Cylinders</p>
                      <p className="font-semibold text-lg">{vehicle.cylinders}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* VIN - Only show if enabled in site settings */}
              {settings.showVIN && vehicle.vin && (
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Hash className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">VIN</p>
                      <p className="font-semibold text-lg font-mono">{vehicle.vin}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {vehicle.description && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed">{vehicle.description}</p>
            </div>
          )}

          {/* Disclaimer Section */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">
                  {currentLang === 'fr' ? 'Avis de non-responsabilité' : 
                   currentLang === 'es' ? 'Descargo de responsabilidad' : 
                   'Disclaimer'}
                </h3>
                <p className="text-sm text-yellow-800">
                  {getDisclaimer()}
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">
              {currentLang === 'fr' ? 'Intéressé par ce véhicule?' : 
               currentLang === 'es' ? '¿Interesado en este vehículo?' : 
               'Interested in this vehicle?'}
            </h2>
            <div className="space-y-3">
              {/* Financing Button - Primary CTA */}
              <button
                onClick={() => setShowFinancingModal(true)}
                className="w-full text-white py-4 px-6 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition flex items-center justify-center space-x-2"
                style={{ backgroundColor: themeColors.primary }}
              >
                <DollarSign className="h-5 w-5" />
                <span>
                  {currentLang === 'fr' ? 'Demande de financement' : 
                   currentLang === 'es' ? 'Solicitar financiamiento' : 
                   'Apply for Financing'}
                </span>
              </button>
              
              {/* Contact Info */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">
                  {currentLang === 'fr' ? 'Ou contactez-nous directement' : 
                   currentLang === 'es' ? 'O contáctenos directamente' : 
                   'Or contact us directly'}
                </p>
                <a 
                  href={`tel:${settings.contactPhone}`} 
                  className="flex items-center justify-center space-x-2 text-lg font-semibold hover:underline"
                  style={{ color: themeColors.primary }}
                >
                  <Phone className="h-5 w-5" />
                  <span>{settings.contactPhone}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financing Modal */}
      <FinancingModal
        isOpen={showFinancingModal}
        onClose={() => setShowFinancingModal(false)}
        vehicle={{
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          price: vehicle.price
        }}
        language={currentLang}
      />

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-semibold mb-4">Contact Us</h3>
            <p className="text-gray-600 mb-4">
              Interested in the {vehicle.year} {vehicle.make} {vehicle.model}?
            </p>
            <p className="text-gray-600 mb-6">
              Call us at: <a href={`tel:${settings.contactPhone}`} className="font-semibold" style={{ color: themeColors.primary }}>
                {settings.contactPhone}
              </a>
            </p>
            <button
              onClick={() => setShowContactForm(false)}
              className="w-full py-3 px-4 rounded-lg text-white font-semibold"
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
