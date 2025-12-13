'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AIFeatureManager from '@/components/AIFeatureManager';
import SiteInfoManager from '@/components/SiteInfoManager';
import VendorManagement from '@/components/admin/VendorManagement';
import FeedManagement from '@/components/admin/FeedManagement';

interface Stats {
  totalVehicles: number;
  soldVehicles: number;
  totalValue: number;
  averagePrice: number;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'financing' | 'analytics' | 'staff' | 'settings' | 'ai' | 'site' | 'vendors'>('overview');
  const [vendorSubTab, setVendorSubTab] = useState<'feeds' | 'legacy'>('feeds');
  const [stats, setStats] = useState<Stats>({
    totalVehicles: 0,
    soldVehicles: 0,
    totalValue: 0,
    averagePrice: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isDevUser, setIsDevUser] = useState(false);

  useEffect(() => {
    // Check if user is dev
    const userEmail = localStorage.getItem('userEmail');
    setIsDevUser(userEmail === 'nick@neurodivers.ca');
    
    // Use Cloudflare Worker API in production
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://vehicle-dealership-api.nick-damato0011527.workers.dev';
    fetch(`${apiUrl}/api/vehicles`)
      .then(res => res.json())
      .then(data => {
        const vehicles = Array.isArray(data) ? data : [];
        const total = vehicles.length;
        const sold = vehicles.filter((v) => v.isSold === 1).length;
        // Calculate total value only for available vehicles (not sold)
        const availableVehicles = vehicles.filter((v) => v.isSold !== 1);
        const totalValue = availableVehicles.reduce((sum, v) => sum + (v.price || 0), 0);
        const avgPrice = availableVehicles.length > 0 ? totalValue / availableVehicles.length : 0;
        
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
            <div className="h-8 w-8 bg-blue-600 rounded-full"></div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sold Vehicles</p>
              <p className="text-2xl font-bold">{loading ? '...' : stats.soldVehicles}</p>
            </div>
            <div className="h-8 w-8 bg-green-600 rounded-full"></div>
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
            <div className="h-8 w-8 bg-yellow-600 rounded-full"></div>
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
            <div className="h-8 w-8 bg-purple-600 rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setActiveTab('site')}
          className={`bg-white rounded-lg shadow p-4 text-left hover:shadow-md transition ${
            activeTab === 'site' ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <div className="text-2xl mb-2">🏢</div>
          <h3 className="font-semibold">Site Info</h3>
          <p className="text-sm text-gray-600">Manage site settings</p>
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`bg-white rounded-lg shadow p-4 text-left hover:shadow-md transition ${
            activeTab === 'vendors' ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <div className="text-2xl mb-2">📦</div>
          <h3 className="font-semibold">Vendors</h3>
          <p className="text-sm text-gray-600">Manage vehicle vendors</p>
        </button>
        {isDevUser && (
          <button
            onClick={() => setActiveTab('ai')}
            className={`bg-white rounded-lg shadow p-4 text-left hover:shadow-md transition ${
              activeTab === 'ai' ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="text-2xl mb-2">🤖</div>
            <h3 className="font-semibold">AI Features</h3>
            <p className="text-sm text-gray-600">Configure AI tools</p>
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/vehicles"
            className="bg-blue-600 text-white text-center py-3 px-6 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2"
          >
            <span>🚗</span>
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
            <span>📊</span>
            <span>View Analytics</span>
          </Link>
          <Link
            href="/admin/leads"
            className="bg-orange-600 text-white text-center py-3 px-6 rounded-lg hover:bg-orange-700 transition flex items-center justify-center space-x-2"
          >
            <span>💬</span>
            <span>Manage Leads</span>
          </Link>
          <Link
            href="/admin/staff"
            className="bg-indigo-600 text-white text-center py-3 px-6 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center space-x-2"
          >
            <span>👥</span>
            <span>Staff Management</span>
          </Link>
          <Link
            href="/admin/settings"
            className="bg-red-600 text-white text-center py-3 px-6 rounded-lg hover:bg-red-700 transition flex items-center justify-center space-x-2"
          >
            <span>⚙️</span>
            <span>Settings & API Keys</span>
          </Link>
          <button
            onClick={() => setActiveTab('vendors')}
            className="bg-purple-600 text-white text-center py-3 px-6 rounded-lg hover:bg-purple-700 transition flex items-center justify-center space-x-2"
          >
            <span>📦</span>
            <span>Vendor Management</span>
          </button>
          <Link
            href="/"
            className="bg-gray-600 text-white text-center py-3 px-6 rounded-lg hover:bg-gray-700 transition flex items-center justify-center space-x-2"
          >
            <span>View Public Site</span>
          </Link>
        </div>
      </div>
      )}

      {/* Site Info Tab */}
      {activeTab === 'site' && (
        <SiteInfoManager />
      )}

      {/* Vehicles Tab */}
      {activeTab === 'vehicles' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Vehicle Management</h2>
          <div className="space-y-4">
            <Link
              href="/admin/vehicles"
              className="block bg-blue-600 text-white text-center py-3 px-6 rounded-lg hover:bg-blue-700 transition"
            >
              Manage Vehicle Inventory
            </Link>
            <Link
              href="/admin/vehicles/add"
              className="block bg-green-600 text-white text-center py-3 px-6 rounded-lg hover:bg-green-700 transition"
            >
              Add New Vehicle
            </Link>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">System Settings</h2>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">API Configuration</h3>
              <p className="text-gray-600 text-sm mb-3">Configure API endpoints and keys</p>
              <Link
                href="/admin/settings"
                className="text-blue-600 hover:text-blue-800"
              >
                Manage API Settings →
              </Link>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Database</h3>
              <p className="text-gray-600 text-sm mb-3">Database connection and maintenance</p>
              <button className="text-blue-600 hover:text-blue-800">
                View Database Status →
              </button>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Cache</h3>
              <p className="text-gray-600 text-sm mb-3">Clear cache and optimize performance</p>
              <button 
                onClick={() => {
                  localStorage.clear();
                  alert('Cache cleared successfully!');
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Features Tab - Only for Dev */}
      {activeTab === 'ai' && isDevUser && (
        <AIFeatureManager />
      )}

      {/* Vendors Tab */}
      {activeTab === 'vendors' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">Vendor & Feed Management</h2>
            
            {/* Sub-tabs for Vendor Management */}
            <div className="flex gap-4 mb-6 border-b">
              <button
                onClick={() => setVendorSubTab('feeds')}
                className={`pb-3 px-4 font-medium transition ${
                  vendorSubTab === 'feeds'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Feed Management (New)
              </button>
              <button
                onClick={() => setVendorSubTab('legacy')}
                className={`pb-3 px-4 font-medium transition ${
                  vendorSubTab === 'legacy'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Legacy Vendor Management
              </button>
            </div>

            {/* Feed Management Tab */}
            {vendorSubTab === 'feeds' && (
              <div>
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>New Feed-Based System:</strong> Manage vendor XML/JSON feeds with 35x faster syncing. 
                    Add vendors in 30 seconds without code changes!
                  </p>
                </div>
                <FeedManagement />
              </div>
            )}

            {/* Legacy Vendor Management Tab */}
            {vendorSubTab === 'legacy' && (
              <div>
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Legacy System:</strong> Old web scraper-based vendor management. 
                    Consider migrating to the new feed-based system for better performance.
                  </p>
                </div>
                <VendorManagement />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
