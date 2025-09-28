'use client';

import { useState, useEffect } from 'react';

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
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://vehicle-dealership-api.nick-damato0011527.workers.dev/api/vehicles')
      .then(res => res.json())
      .then(data => {
        setVehicles(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch vehicles:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Our Vehicles</h1>
          <p className="text-gray-600">Loading vehicles from database...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Our Vehicles</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <h2 className="text-xl font-semibold mb-2">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h2>
              <div className="text-sm text-gray-600 mb-3">
                <p>{vehicle.color} • {vehicle.bodyType}</p>
                <p>{vehicle.odometer.toLocaleString()} km</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                ${vehicle.price.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Phase 5: Connected to Cloudflare D1 Database via Worker API
          </p>
        </div>
      </div>
    </main>
  );
}
