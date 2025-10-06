'use client';

import { useState, useEffect } from 'react';
import { 
  Package, RefreshCw, AlertCircle, CheckCircle, 
  Clock, TrendingUp, TrendingDown, Eye, EyeOff,
  Truck, Settings, Calendar, BarChart3
} from 'lucide-react';

interface Vendor {
  vendor_id: string;
  vendor_name: string;
  vendor_type: 'scraper' | 'api' | 'manual';
  last_sync?: string;
  is_active: boolean;
  sync_frequency: string;
  auto_remove_after_days: number;
  grace_period_days: number;
  stats?: {
    total_vehicles: number;
    active_vehicles: number;
    unlisted_vehicles: number;
    sold_vehicles: number;
  };
}

interface SyncLog {
  id: number;
  vendor_id: string;
  vendor_name: string;
  sync_date: string;
  vehicles_found: number;
  new_vehicles: number;
  updated_vehicles: number;
  removed_vehicles: number;
  unlisted_vehicles: number;
  status: 'success' | 'partial' | 'failed';
  error_message?: string;
  sync_duration_seconds?: number;
}

export default function VendorManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState<string | null>(null);

  useEffect(() => {
    loadVendors();
    loadSyncLogs();
  }, []);

  const loadVendors = async () => {
    try {
      // Fetch real vendor stats from API
      const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 
                    'https://vehicle-dealership-api.nick-damato0011527.workers.dev';
      const response = await fetch(`${apiUrl}/api/vendor-stats`);
      
      if (response.ok) {
        const stats = await response.json();
        
        setVendors([
          {
            vendor_id: 'lambert',
            vendor_name: 'Lambert Auto',
            vendor_type: 'scraper',
            last_sync: new Date(Date.now() - 3600000).toISOString(), // TODO: Get from sync logs
            is_active: true,
            sync_frequency: 'daily',
            auto_remove_after_days: 7,
            grace_period_days: 3,
            stats: stats.lambert
          },
          {
            vendor_id: 'naniauto',
            vendor_name: 'NaniAuto',
            vendor_type: 'scraper',
            last_sync: undefined,
            is_active: true,
            sync_frequency: 'daily',
            auto_remove_after_days: 7,
            grace_period_days: 3,
            stats: stats.naniauto || { total_vehicles: 0, active_vehicles: 0, unlisted_vehicles: 0, sold_vehicles: 0 }
          },
          {
            vendor_id: 'sltautos',
            vendor_name: 'SLT Autos',
            vendor_type: 'scraper',
            last_sync: undefined,
            is_active: true,
            sync_frequency: 'daily',
            auto_remove_after_days: 7,
            grace_period_days: 3,
            stats: stats.sltautos || { total_vehicles: 0, active_vehicles: 0, unlisted_vehicles: 0, sold_vehicles: 0 }
          },
          {
            vendor_id: 'internal',
            vendor_name: 'Internal Inventory',
            vendor_type: 'manual',
            is_active: true,
            sync_frequency: 'manual',
            auto_remove_after_days: 0,
            grace_period_days: 0,
            stats: stats.internal
          }
        ]);
      } else {
        console.error('Failed to load vendor stats');
      }
    } catch (error) {
      console.error('Error loading vendor stats:', error);
    }
  };

  const loadSyncLogs = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 
                    'https://vehicle-dealership-api.nick-damato0011527.workers.dev';
      const response = await fetch(`${apiUrl}/api/vendor-sync-logs`);
      
      if (response.ok) {
        const logs = await response.json();
        setSyncLogs(logs);
      } else {
        console.error('Failed to load sync logs');
        setSyncLogs([]);
      }
    } catch (error) {
      console.error('Error loading sync logs:', error);
      setSyncLogs([]);
    }
  };

  const syncVendor = async (vendorId: string) => {
    setSyncing(vendorId);
    try {
      // Call scraper directly instead of vendor-sync-worker
      const scraperUrls: Record<string, string> = {
        lambert: process.env.NEXT_PUBLIC_LAMBERT_SCRAPER_URL || 'https://lambert-scraper.nick-damato0011527.workers.dev',
        naniauto: process.env.NEXT_PUBLIC_NANIAUTO_SCRAPER_URL || 'https://naniauto-scraper.nick-damato0011527.workers.dev',
        sltautos: process.env.NEXT_PUBLIC_SLTAUTOS_SCRAPER_URL || 'https://sltautos-scraper.nick-damato0011527.workers.dev'
      };
      
      const scraperUrl = scraperUrls[vendorId];
      if (!scraperUrl) {
        alert(`Vendor ${vendorId} is not configured for scraping`);
        return;
      }
      
      const response = await fetch(`${scraperUrl}/api/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const vehiclesCount = result.count || 0;
          const duration = result.duration || '0';
          const imageJobId = result.imageProcessingJobId;
          
          alert(`✅ Scrape completed successfully!
• ${vehiclesCount} vehicles scraped
• Duration: ${duration} seconds
• Images are being processed (Job: ${imageJobId?.substring(0, 20) || 'N/A'}...)

Vehicles have been saved to the database. Image processing is running in the background.`);
          loadVendors();
          loadSyncLogs();
        } else {
          alert(`Scrape failed: ${result.error}`);
        }
      } else {
        alert('Scrape request failed. Check console for details.');
      }
    } catch (error) {
      alert('Sync failed. Check console for details.');
      console.error('Sync error:', error);
    } finally {
      setSyncing(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Management</h1>
        <p className="text-gray-600">Manage vehicle inventory sources and synchronization</p>
      </div>

      {/* Vendor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {vendors.map(vendor => (
          <div key={vendor.vendor_id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Vendor Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{vendor.vendor_name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      vendor.vendor_type === 'scraper' ? 'bg-blue-100 text-blue-700' :
                      vendor.vendor_type === 'api' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {vendor.vendor_type}
                    </span>
                    {vendor.is_active ? (
                      <span className="flex items-center text-xs text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center text-xs text-gray-500">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowSettings(showSettings === vendor.vendor_id ? null : vendor.vendor_id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Settings className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Total</span>
                    <Truck className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xl font-semibold text-gray-900 mt-1">
                    {vendor.stats?.total_vehicles || 0}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-600">Active</span>
                    <Eye className="h-4 w-4 text-green-400" />
                  </div>
                  <p className="text-xl font-semibold text-green-900 mt-1">
                    {vendor.stats?.active_vehicles || 0}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-yellow-600">Unlisted</span>
                    <EyeOff className="h-4 w-4 text-yellow-400" />
                  </div>
                  <p className="text-xl font-semibold text-yellow-900 mt-1">
                    {vendor.stats?.unlisted_vehicles || 0}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600">Sold</span>
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                  </div>
                  <p className="text-xl font-semibold text-blue-900 mt-1">
                    {vendor.stats?.sold_vehicles || 0}
                  </p>
                </div>
              </div>

              {/* Settings Panel */}
              {showSettings === vendor.vendor_id && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Sync Frequency</span>
                    <span className="font-medium">{vendor.sync_frequency}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Grace Period</span>
                    <span className="font-medium">{vendor.grace_period_days} days</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Auto Remove After</span>
                    <span className="font-medium">{vendor.auto_remove_after_days} days</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  Last sync: {vendor.last_sync ? formatDate(vendor.last_sync) : 'Never'}
                </div>
              </div>
              <button
                onClick={() => syncVendor(vendor.vendor_id)}
                disabled={syncing === vendor.vendor_id || vendor.vendor_type === 'manual'}
                className={`w-full py-2 px-4 rounded-lg font-medium transition flex items-center justify-center ${
                  vendor.vendor_type === 'manual' 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : syncing === vendor.vendor_id
                    ? 'bg-gray-200 text-gray-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {syncing === vendor.vendor_id ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : vendor.vendor_type === 'manual' ? (
                  'Manual Entry Only'
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </>
                )}
              </button>
            </div>
          </div>
        ))}

        {/* Add New Vendor Card */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 overflow-hidden">
          <button className="w-full h-full min-h-[300px] p-6 flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition">
            <Package className="h-12 w-12 mb-3" />
            <span className="text-lg font-medium">Add New Vendor</span>
            <span className="text-sm mt-1">Connect another inventory source</span>
          </button>
        </div>
      </div>

      {/* Sync History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Sync History</h2>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Found
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  New
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unlisted
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Removed
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {syncLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.vendor_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.sync_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                    {log.vehicles_found}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {log.new_vehicles > 0 && (
                      <span className="text-green-600 font-medium">+{log.new_vehicles}</span>
                    )}
                    {log.new_vehicles === 0 && <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {log.updated_vehicles > 0 && (
                      <span className="text-blue-600 font-medium">↻{log.updated_vehicles}</span>
                    )}
                    {log.updated_vehicles === 0 && <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {log.unlisted_vehicles > 0 && (
                      <span className="text-yellow-600 font-medium">{log.unlisted_vehicles}</span>
                    )}
                    {log.unlisted_vehicles === 0 && <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {log.removed_vehicles > 0 && (
                      <span className="text-red-600 font-medium">-{log.removed_vehicles}</span>
                    )}
                    {log.removed_vehicles === 0 && <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                    {log.sync_duration_seconds ? `${log.sync_duration_seconds}s` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      log.status === 'success' ? 'bg-green-100 text-green-800' :
                      log.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
