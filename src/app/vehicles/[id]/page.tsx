'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Car, Calendar, Gauge, Palette, MapPin, Phone, Mail } from 'lucide-react';

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

export default function VehicleDetailPage() {
  const params = useParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetch(`https://vehicle-dealership-api.nick-damato0011527.workers.dev/api/vehicles/${params.id}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setVehicle(data);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch vehicle:', err);
          setLoading(false);
        });
    }
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <p className="text-gray-600">Loading vehicle details...</p>
        </div>
      </main>
    );
  }

  if (!vehicle) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Not Found</h1>
          <p className="text-gray-600 mb-8">Sorry, we couldn&apos;t find the vehicle you&apos;re looking for.</p>
          <Link href="/vehicles" className="text-blue-600 hover:text-blue-800">
            ← Back to Inventory
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/vehicles" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inventory
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div>
            <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
              <Car className="h-24 w-24 text-gray-400" />
            </div>
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
              <button
                onClick={() => setShowContactModal(true)}
                disabled={vehicle.isSold === 1}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
                  vehicle.isSold === 1
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {vehicle.isSold === 1 ? 'Vehicle Sold' : 'Contact Us About This Vehicle'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-blue-600" />
                <span>(555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <span>info@autodealership.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span>123 Main St, City, State 12345</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Reference Vehicle ID: {vehicle.id}
            </p>
            <button
              onClick={() => setShowContactModal(false)}
              className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
