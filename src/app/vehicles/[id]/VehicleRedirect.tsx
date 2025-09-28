'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VehicleRedirect({ id }: { id: string }) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new detail page with query parameter
    router.replace(`/vehicles/detail?id=${id}`);
  }, [id, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to vehicle details...</p>
      </div>
    </div>
  );
}
