import { Suspense } from 'react';
import VehicleDetailClient from './VehicleDetailClient';

export default function VehicleDetailPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Suspense fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="h-16 w-16 text-gray-400 mx-auto mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Vehicle...</h1>
          <p className="text-gray-600">Please wait while we fetch the vehicle details.</p>
        </div>
      }>
        <VehicleDetailClient />
      </Suspense>
    </main>
  );
}
