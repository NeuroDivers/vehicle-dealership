import Link from 'next/link';
import { ArrowLeft, Car, Calendar, Gauge, Palette } from 'lucide-react';
import VehicleContactButton from '../components/VehicleContactButton';
import VehicleImageGallery from '../components/VehicleImageGallery';

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

// Generate static params for all vehicle IDs at build time
export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
    { id: '6' },
  ];
}

// Fetch vehicle data at build time
async function getVehicle(id: string): Promise<Vehicle | null> {
  try {
    const res = await fetch(`https://vehicle-dealership-api.nick-damato0011527.workers.dev/api/vehicles/${id}`, {
      cache: 'no-store'
    });
    const data = await res.json();
    if (data.error) return null;
    return data;
  } catch (error) {
    console.error('Failed to fetch vehicle:', error);
    return null;
  }
}

export default async function VehicleDetailPage({ params }: { params: { id: string } }) {
  const vehicle = await getVehicle(params.id);

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

  // Parse images if they exist
  const images = vehicle.images ? (typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images) : [];

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
              <VehicleContactButton vehicle={vehicle} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
