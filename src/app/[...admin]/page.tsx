'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import admin components based on the path
const AdminLayout = dynamic(() => import('../admin-temp/layout'), { ssr: false });
const AdminDashboard = dynamic(() => import('../admin-temp/page'), { ssr: false });
const AdminVehicles = dynamic(() => import('../admin-temp/vehicles/page'), { ssr: false });
const AdminVehicleAdd = dynamic(() => import('../admin-temp/vehicles/add/page'), { ssr: false });
const AdminVehicleEdit = dynamic(() => import('../admin-temp/vehicles/edit/[id]/EditVehicleClient'), { ssr: false });

export default function AdminCatchAll() {
  const pathname = usePathname();
  const router = useRouter();

  // Parse the admin route
  const adminPath = pathname?.replace('/admin', '') || '';
  
  // Route to appropriate component
  if (adminPath === '' || adminPath === '/') {
    return <AdminDashboard />;
  }
  
  if (adminPath === '/vehicles') {
    return <AdminVehicles />;
  }
  
  if (adminPath === '/vehicles/add') {
    return <AdminVehicleAdd />;
  }
  
  if (adminPath.startsWith('/vehicles/edit/')) {
    return <AdminVehicleEdit />;
  }

  // 404 for unknown admin routes
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
        <button 
          onClick={() => router.push('/admin')}
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Admin Dashboard
        </button>
      </div>
    </div>
  );
}
