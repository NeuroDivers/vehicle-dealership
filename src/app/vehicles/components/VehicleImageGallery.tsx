'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Car, X } from 'lucide-react';

interface VehicleImageGalleryProps {
  images: string[];
  vehicleName: string;
}

export default function VehicleImageGallery({ images, vehicleName }: VehicleImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Touch gesture detection
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!images || images.length === 0) {
    return (
      <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
        <Car className="h-24 w-24 text-gray-400" />
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  
  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50; // Minimum distance for a swipe
    
    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        // Swiped left - show next image
        nextImage();
      } else {
        // Swiped right - show previous image
        prevImage();
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <>
      {/* Main Gallery */}
      <div className="space-y-4">
        {/* Main Image */}
        <div 
          className="relative bg-gray-100 rounded-lg overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={images[currentIndex]}
            alt={`${vehicleName} - Image ${currentIndex + 1}`}
            className="w-full h-96 object-cover cursor-pointer"
            onClick={() => setShowFullscreen(true)}
          />
          
          {/* Navigation Arrows - More subtle on mobile */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className={`absolute left-2 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-full transition ${
                  isMobile 
                    ? 'bg-opacity-30 hover:bg-opacity-50' 
                    : 'bg-opacity-50 hover:bg-opacity-70'
                }`}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextImage}
                className={`absolute right-2 top-1/2 -translate-y-1/2 bg-black text-white p-2 rounded-full transition ${
                  isMobile 
                    ? 'bg-opacity-30 hover:bg-opacity-50' 
                    : 'bg-opacity-50 hover:bg-opacity-70'
                }`}
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          
          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-24 h-24 rounded overflow-hidden border-2 transition ${
                  index === currentIndex ? 'border-blue-500' : 'border-transparent'
                }`}
              >
                <img
                  src={image}
                  alt={`${vehicleName} - Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 right-4 text-white p-2 hover:bg-white hover:bg-opacity-10 rounded-full transition"
          >
            <X className="h-8 w-8" />
          </button>
          
          <div 
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={images[currentIndex]}
              alt={`${vehicleName} - Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Navigation in Fullscreen - More subtle on mobile */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 bg-black text-white p-3 rounded-full transition ${
                    isMobile 
                      ? 'bg-opacity-30 hover:bg-opacity-50' 
                      : 'bg-opacity-50 hover:bg-opacity-70'
                  }`}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  onClick={nextImage}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 bg-black text-white p-3 rounded-full transition ${
                    isMobile 
                      ? 'bg-opacity-30 hover:bg-opacity-50' 
                      : 'bg-opacity-50 hover:bg-opacity-70'
                  }`}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}
            
            {/* Counter in Fullscreen */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-lg px-4 py-2 rounded">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
