import { Suspense } from 'react';
import { Metadata } from 'next';
import VehicleDetailWrapper from './VehicleDetailWrapper';

export const metadata: Metadata = {
  title: 'Vehicle Details - Auto Dealership',
  description: 'View detailed information about our vehicles including specifications, images, and pricing.',
  openGraph: {
    title: 'Vehicle Details - Auto Dealership',
    description: 'View detailed information about our vehicles including specifications, images, and pricing.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vehicle Details - Auto Dealership',
    description: 'View detailed information about our vehicles including specifications, images, and pricing.',
  },
};

export default function VehicleDetailPage({ searchParams }: { searchParams: { id?: string } }) {
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
        <VehicleDetailWrapper />
      </Suspense>
    </main>
  );
}