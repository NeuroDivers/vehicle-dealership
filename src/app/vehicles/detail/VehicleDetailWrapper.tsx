'use client';

import { useState, useEffect } from 'react';
import { getVehicleEndpoint } from '@/lib/api-config';
import VehicleDetailClient from './VehicleDetailClient';

export default function VehicleDetailWrapper() {
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const vehicleId = urlParams.get('id');
    
    if (vehicleId) {
      fetch(getVehicleEndpoint(`/${vehicleId}`))
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(true);
          } else {
            setVehicle(data);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch vehicle:', err);
          setError(true);
          setLoading(false);
        });
    } else {
      setError(true);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Vehicle...</h1>
        <p className="text-gray-600">Please wait while we fetch the vehicle details.</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Not Found</h1>
        <p className="text-gray-600 mb-8">Sorry, we couldn&apos;t find the vehicle you&apos;re looking for.</p>
        <a href="/vehicles" className="text-blue-600 hover:text-blue-800">
          ← Back to Inventory
        </a>
      </div>
    );
  }

  return <VehicleDetailClient vehicle={vehicle} />;
}
