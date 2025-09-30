'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw, Upload, ExternalLink, ChevronDown, ChevronUp, Check, Package } from 'lucide-react';

interface ScraperStats {
  lastRun?: string;
  vehiclesFound: number;
  imagesUploaded: number;
  syncedToMain: number;
  newVehicles: number;
  updatedVehicles: number;
  unlistedVehicles: number;
  removedVehicles: number;
  status: 'idle' | 'running' | 'success' | 'error' | 'partial' | 'failed';
}

interface LambertVehicle {
  id: string;
  title: string;
  price: number;
  year: number;
  make: string;
  model: string;
  vin?: string;
  stock?: string;
  images: string[];
  status: 'new' | 'updated' | 'unchanged' | 'existing';
  lastSynced?: string;
}

export default function LambertScraperPanelV2() {
  const [stats, setStats] = useState<ScraperStats>({
    vehiclesFound: 0,
    imagesUploaded: 0,
    syncedToMain: 0,
    newVehicles: 0,
    updatedVehicles: 0,
    unlistedVehicles: 0,
    removedVehicles: 0,
    status: 'idle'
  });
  
  const [recentVehicles, setRecentVehicles] = useState<LambertVehicle[]>([]);
  const [isScrapingRunning, setIsScrapingRunning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'vehicles' | 'settings'>('overview');

  useEffect(() => {
    loadStats();
    loadRecentVehicles();
  }, []);

  const loadStats = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 
                     'https://vehicle-admin-api.nick-damato0011527.workers.dev';
      const response = await fetch(`${apiUrl}/api/admin/lambert/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadRecentVehicles = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 
                     'https://vehicle-admin-api.nick-damato0011527.workers.dev';
      const response = await fetch(`${apiUrl}/api/admin/lambert/vehicles?limit=10`);
      if (response.ok) {
        const vehicles = await response.json();
        setRecentVehicles(vehicles);
      }
    } catch (error) {
      console.error('Failed to load recent vehicles:', error);
    }
  };

  const runScraper = async () => {
    setIsScrapingRunning(true);
    setStats(prev => ({ ...prev, status: 'running' }));
    
    try {
      // Call the Lambert sync worker that saves to database
      const syncWorkerUrl = process.env.NEXT_PUBLIC_LAMBERT_SYNC_WORKER_URL || 
                           'https://lambert-sync-worker.nick-damato0011527.workers.dev';
      
      const response = await fetch(`${syncWorkerUrl}/sync-lambert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Sync request failed');
      }
      
      const result = await response.json();
      
      // Update stats with sync results
      setStats({
        vehiclesFound: result.vehicles_found,
        imagesUploaded: 0, // Will be tracked separately
        syncedToMain: result.vehicles_found,
        newVehicles: result.new_vehicles,
        updatedVehicles: result.updated_vehicles,
        unlistedVehicles: 0,
        removedVehicles: 0,
        lastRun: new Date().toISOString(),
        status: result.status || 'success'
      });
      
      // Reload vehicles
      await loadRecentVehicles();
      
      if (result.success) {
        alert(`✅ Sync completed successfully!
• ${result.vehicles_found} vehicles found
• ${result.new_vehicles} new vehicles added to database
• ${result.updated_vehicles} vehicles updated in database
${result.errors && result.errors.length > 0 ? `• ${result.errors.length} errors occurred` : ''}`);
      } else {
        alert(`❌ Sync failed: ${result.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('Scraping error:', error);
      setStats(prev => ({ ...prev, status: 'error' }));
      alert('Scraping failed. Please check the console for details.');
    } finally {
      setIsScrapingRunning(false);
    }
  };

  const syncToMainInventory = async () => {
    setIsSyncing(true);
    try {
      // This is now handled automatically by the VendorSyncManager
      alert('Vehicles are automatically synced during the scraping process.');
    } finally {
      setIsSyncing(false);
    }
  };

  const exportCSV = () => {
    // Generate CSV from recent vehicles
    const headers = ['Title', 'Price', 'Year', 'Make', 'Model', 'VIN', 'Stock', 'Status'];
    const rows = recentVehicles.map(v => [
      v.title,
      v.price,
      v.year,
      v.make,
      v.model,
      v.vin || '',
      v.stock || '',
      v.status
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lambert-vehicles-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-7 w-7 text-blue-600" />
              Lambert Inventory Scraper
            </h2>
            <p className="text-gray-600 mt-1">
              Sync vehicles from automobile-lambert.com with vendor tracking
            </p>
          </div>
          <div className="flex items-center gap-2">
            {stats.lastRun && (
              <span className="text-sm text-gray-500">
                Last run: {formatDate(stats.lastRun)}
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              stats.status === 'running' ? 'bg-blue-100 text-blue-700' :
              stats.status === 'success' ? 'bg-green-100 text-green-700' :
              stats.status === 'error' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {stats.status === 'running' ? '🔄 Running' :
               stats.status === 'success' ? '✅ Success' :
               stats.status === 'error' ? '❌ Error' :
               '⏸️ Idle'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b">
          {(['overview', 'vehicles', 'settings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`pb-2 px-1 border-b-2 font-medium text-sm capitalize ${
                selectedTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-900">{stats.vehiclesFound}</span>
              </div>
              <p className="text-sm text-blue-700">Vehicles Found</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Upload className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold text-green-900">{stats.newVehicles}</span>
              </div>
              <p className="text-sm text-green-700">New Vehicles</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <RefreshCw className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-900">{stats.updatedVehicles}</span>
              </div>
              <p className="text-sm text-purple-700">Updated Vehicles</p>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Download className="h-5 w-5 text-yellow-600" />
                <span className="text-2xl font-bold text-yellow-900">{stats.unlistedVehicles}</span>
              </div>
              <p className="text-sm text-yellow-700">Unlisted</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={runScraper}
              disabled={isScrapingRunning}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                isScrapingRunning 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${isScrapingRunning ? 'animate-spin' : ''}`} />
              {isScrapingRunning ? 'Scraping...' : 'Run Scraper'}
            </button>
            
            <button
              onClick={() => alert('Test connection feature coming soon!')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
            >
              <Check className="h-4 w-4" />
              Test Connection
            </button>
            
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            
            <a
              href="https://automobile-lambert.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition"
            >
              <ExternalLink className="h-4 w-4" />
              Visit Lambert Site
            </a>
          </div>

          {/* How it works */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">How it works with Vendor Tracking</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Scrapes all vehicles from automobile-lambert.com</li>
              <li>• Downloads and optimizes images using Cloudflare Images</li>
              <li>• Detects new, changed, and removed vehicles</li>
              <li>• Marks vehicles as "Lambert Auto" vendor</li>
              <li>• Handles missing vehicles with grace period (3 days)</li>
              <li>• Auto-removes stale listings after 7 days</li>
              <li>• Preserves vehicles marked as sold by dealership</li>
              <li>• Syncs to main inventory with partner tracking</li>
            </ul>
          </div>
        </>
      )}

      {/* Vehicles Tab */}
      {selectedTab === 'vehicles' && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Recent Lambert Vehicles</h3>
          {recentVehicles.length > 0 ? (
            <div className="space-y-3">
              {recentVehicles.map((vehicle) => (
                <div key={vehicle.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{vehicle.title}</h4>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        ${vehicle.price.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        {vehicle.vin && <span>VIN: {vehicle.vin}</span>}
                        {vehicle.stock && <span>Stock: {vehicle.stock}</span>}
                      </div>
                      {vehicle.images.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          {vehicle.images.length} images available
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        vehicle.status === 'new' ? 'bg-green-100 text-green-700' :
                        vehicle.status === 'existing' ? 'bg-gray-100 text-gray-700' :
                        vehicle.status === 'updated' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {vehicle.status === 'existing' ? 'Already in Inventory' : vehicle.status}
                      </span>
                      {vehicle.lastSynced && (
                        <span className="text-xs text-gray-500">
                          Synced: {formatDate(vehicle.lastSynced)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No vehicles scraped yet. Run the scraper to see results.
            </p>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {selectedTab === 'settings' && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Vendor Configuration</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Vendor ID</span>
                <span className="font-mono text-sm">lambert</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Vendor Name</span>
                <span className="font-medium">Lambert Auto</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Grace Period</span>
                <span className="font-medium">3 days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Auto-Remove After</span>
                <span className="font-medium">7 days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sync Frequency</span>
                <span className="font-medium">Daily</span>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">API Configuration</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Scraper URL</span>
                <span className="font-mono text-xs">lambert-scraper.workers.dev</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Admin API</span>
                <span className="font-mono text-xs">vehicle-admin-api.workers.dev</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
