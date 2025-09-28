'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Car, Calendar, Gauge, Palette, Loader2 } from 'lucide-react';
import VehicleImageGallery from '../components/VehicleImageGallery';
import VehicleContactButton from '../components/VehicleContactButton';
import VehicleContactForm from '../components/VehicleContactForm';
import VehicleSEO from './VehicleSEO';
import { trackVehicleView } from '@/lib/analytics-config';

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

export default function VehicleDetailClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const vehicleId = searchParams?.get('id');
  
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    if (!vehicleId) {
      router.push('/vehicles');
      return;
    }

    // Fetch vehicle data
    fetch(`https://vehicle-dealership-api.nick-damato0011527.workers.dev/api/vehicles/${vehicleId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(true);
        } else {
          setVehicle(data);
          // Track vehicle view for analytics
          trackVehicleView({
            vehicleId: data.id,
            make: data.make,
            model: data.model,
            year: data.year,
            price: data.price,
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch vehicle:', err);
        setError(true);
        setLoading(false);
      });
  }, [vehicleId, router]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Loader2 className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-spin" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Vehicle...</h1>
        <p className="text-gray-600">Please wait while we fetch the vehicle details.</p>
      </div>
    );
  }

  if (error || !vehicle) {
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

  // Parse images if they exist
  const images = vehicle.images ? (typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* SEO Component */}
      <VehicleSEO vehicle={vehicle} images={images} />
      
      {/* Back Button */}
      <Link href="/vehicles" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Inventory
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div>
          <VehicleImageGallery 
            images={images}
            vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          />
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
            ${vehicle.price.toLocaleString()}
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
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Get More Information
              </button>
              <VehicleContactButton vehicle={vehicle} />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      <VehicleContactForm 
        vehicle={vehicle} 
        isOpen={showContactForm}
        onClose={() => setShowContactForm(false)}
      />
    </div>
  );
}
