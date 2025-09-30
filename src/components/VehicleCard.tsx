'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Car, MapPin, Gauge, Fuel, ExternalLink } from 'lucide-react';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  odometer: number;
  bodyType: string;
  color: string;
  fuelType?: string;
  description?: string;
  images?: string;
  isSold?: boolean;
  
  // Partner fields
  source?: string;
  partnerName?: string;
  partnerUrl?: string;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  showPrice?: boolean;
}

export default function VehicleCard({ vehicle, showPrice = true }: VehicleCardProps) {
  const images = vehicle.images ? JSON.parse(vehicle.images) : [];
  let mainImage = images[0] || '/placeholder-vehicle.jpg';
  
  // Cloudflare Images - use public variant (thumbnail variant doesn't exist by default)
  
  // Determine if this is a partner vehicle
  const isPartnerVehicle = vehicle.source && vehicle.source !== 'internal';
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Image Container */}
      <div className="relative h-48 bg-gray-200">
        {vehicle.isSold && (
          <div className="absolute inset-0 bg-black bg-opacity-50 z-10 flex items-center justify-center">
            <span className="text-white text-2xl font-bold transform rotate-[-15deg]">SOLD</span>
          </div>
        )}
        
        {isPartnerVehicle && (
          <div className="absolute top-2 left-2 z-20">
            <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-semibold">
              {vehicle.partnerName || 'Partner'}
            </span>
          </div>
        )}
        
        {mainImage.startsWith('http') || mainImage.startsWith('/') ? (
          <img
            src={mainImage}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="h-16 w-16 text-gray-400" />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h3>
        
        {/* Price */}
        {showPrice && (
          <div className="text-2xl font-bold text-blue-600 mb-3">
            ${vehicle.price.toLocaleString()}
          </div>
        )}
        
        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-1">
            <Gauge className="h-4 w-4" />
            <span>{vehicle.odometer.toLocaleString()} km</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Car className="h-4 w-4" />
            <span>{vehicle.bodyType}</span>
          </div>
          
          {vehicle.fuelType && (
            <div className="flex items-center space-x-1">
              <Fuel className="h-4 w-4" />
              <span className="capitalize">{vehicle.fuelType}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 rounded-full border-2 border-gray-400" 
                 style={{ backgroundColor: vehicle.color.toLowerCase() }} />
            <span>{vehicle.color}</span>
          </div>
        </div>
        
        {/* Partner Link */}
        {isPartnerVehicle && vehicle.partnerUrl && (
          <div className="mb-3 pb-3 border-b">
            <a
              href={vehicle.partnerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-sm text-purple-600 hover:text-purple-800 transition"
            >
              <ExternalLink className="h-3 w-3" />
              <span>View on {vehicle.partnerName}</span>
            </a>
          </div>
        )}
        
        {/* Action Button */}
        <Link
          href={`/vehicles/${vehicle.id}`}
          className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
