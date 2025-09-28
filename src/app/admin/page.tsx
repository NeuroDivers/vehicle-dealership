'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Car, TrendingUp, Users, DollarSign, BarChart3 } from 'lucide-react';

interface Stats {
  totalVehicles: number;
  soldVehicles: number;
  totalValue: number;
  averagePrice: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalVehicles: 0,
    soldVehicles: 0,
    totalValue: 0,
    averagePrice: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://vehicle-dealership-api.nick-damato0011527.workers.dev/api/vehicles')
      .then(res => res.json())
      .then(data => {
        const vehicles = Array.isArray(data) ? data : [];
        const total = vehicles.length;
        const sold = vehicles.filter((v) => v.isSold === 1).length;
        const totalValue = vehicles.reduce((sum, v) => sum + (v.price || 0), 0);
        const avgPrice = total > 0 ? totalValue / total : 0;
        
        setStats({
          totalVehicles: total,
          soldVehicles: sold,
          totalValue,
          averagePrice: avgPrice,
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch stats:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Vehicles</p>
              <p className="text-2xl font-bold">{loading ? '...' : stats.totalVehicles}</p>
            </div>
            <Car className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sold Vehicles</p>
              <p className="text-2xl font-bold">{loading ? '...' : stats.soldVehicles}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Inventory Value</p>
              <p className="text-2xl font-bold">
                {loading ? '...' : `$${stats.totalValue.toLocaleString()}`}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Price</p>
              <p className="text-2xl font-bold">
                {loading ? '...' : `$${Math.round(stats.averagePrice).toLocaleString()}`}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/vehicles"
            className="bg-blue-600 text-white text-center py-3 px-6 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2"
          >
            <Car className="h-4 w-4" />
            <span>Manage Vehicles</span>
          </Link>
          <Link
            href="/admin/vehicles/add"
            className="bg-green-600 text-white text-center py-3 px-6 rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2"
          >
            <span>Add New Vehicle</span>
          </Link>
          <Link
            href="/admin/analytics"
            className="bg-purple-600 text-white text-center py-3 px-6 rounded-lg hover:bg-purple-700 transition flex items-center justify-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>View Analytics</span>
          </Link>
          <Link
            href="/"
            className="bg-gray-600 text-white text-center py-3 px-6 rounded-lg hover:bg-gray-700 transition flex items-center justify-center space-x-2"
          >
            <span>View Public Site</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
