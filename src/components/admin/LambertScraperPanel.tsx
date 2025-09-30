'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Download, CheckCircle, XCircle, AlertCircle, ExternalLink, Image, Database, Clock, TrendingUp } from 'lucide-react';

interface ScraperStats {
  lastRun?: string;
  vehiclesFound: number;
  imagesUploaded: number;
  syncedToMain: number;
  newVehicles: number;
  updatedVehicles: number;
  status: 'idle' | 'running' | 'success' | 'error';
  errorMessage?: string;
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

export default function LambertScraperPanel() {
  const [stats, setStats] = useState<ScraperStats>({
    vehiclesFound: 0,
    imagesUploaded: 0,
    syncedToMain: 0,
    newVehicles: 0,
    updatedVehicles: 0,
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
      // Use the admin API worker in production
      const apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 
                     'https://vehicle-admin-api.nick-damato0011527.workers.dev';
      const response = await fetch(`${apiUrl}/api/admin/lambert/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Use mock data for development
      setStats({
        lastRun: new Date(Date.now() - 3600000).toISOString(),
        vehiclesFound: 46,
        imagesUploaded: 184,
        syncedToMain: 46,
        newVehicles: 3,
        updatedVehicles: 7,
        status: 'success'
      });
    }
  };

  const loadRecentVehicles = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 
                     'https://vehicle-admin-api.nick-damato0011527.workers.dev';
      const response = await fetch(`${apiUrl}/api/admin/lambert/recent`);
      if (response.ok) {
        const data = await response.json();
        setRecentVehicles(data);
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error);
      // Mock data
      setRecentVehicles([
        {
          id: 'lam_1',
          title: '2018 Toyota C-HR XLE',
          price: 13999,
          year: 2018,
          make: 'Toyota',
          model: 'C-HR',
          vin: 'NMTKHMBX8JR064521',
          stock: 'LAM-001',
          images: ['image1.jpg', 'image2.jpg'],
          status: 'new',
          lastSynced: new Date().toISOString()
        }
      ]);
    }
  };

  const runScraper = async () => {
    setIsScrapingRunning(true);
    setStats(prev => ({ ...prev, status: 'running' }));
    
    try {
      // Call Lambert scraper directly to avoid worker-to-worker issues
      const lambertUrl = process.env.NEXT_PUBLIC_LAMBERT_WORKER_URL || 
                        'https://lambert-scraper.nick-damato0011527.workers.dev';
      
      console.log('Calling Lambert scraper directly...');
      const response = await fetch(`${lambertUrl}/api/lambert/scrape-with-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Update stats with real data
        const vehiclesFound = result.stats?.vehiclesFound || 0;
        const newVehicles = result.stats?.new || vehiclesFound;
        
        setStats({
          vehiclesFound,
          imagesUploaded: result.stats?.imagesUploaded || 0,
          syncedToMain: result.stats?.syncedToMain || 0,
          newVehicles,
          updatedVehicles: result.stats?.updated || 0,
          lastRun: new Date().toISOString(),
          status: 'success'
        });
        
        // If we have sample vehicles, update the recent vehicles list
        if (result.vehicles && result.vehicles.length > 0) {
          // Check which vehicles already exist in the database
          const adminApiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 
                             'https://vehicle-admin-api.nick-damato0011527.workers.dev';
          
          try {
            // Get existing vehicles from admin API which has access to the database
            const existingResponse = await fetch(`${adminApiUrl}/api/admin/vehicles`);
            const existingVehicles = await existingResponse.json();
            
            const formattedVehicles = result.vehicles.map((v: any, index: number) => {
              // Check if vehicle exists by VIN or stock number
              const exists = existingVehicles.some((existing: any) => 
                (v.vin && existing.vin === v.vin) ||
                (v.stock_number && existing.stockNumber === v.stock_number) ||
                (v.make === existing.make && v.model === existing.model && v.year === existing.year)
              );
              
              return {
                id: `lam_${index}`,
                title: v.title || `${v.year} ${v.make} ${v.model}`,
                price: v.price || 0,
                year: v.year,
                make: v.make,
                model: v.model,
                vin: v.vin,
                stock: v.stock_number,
                images: v.images || [],
                status: exists ? 'existing' as const : 'new' as const,
                lastSynced: new Date().toISOString()
              };
            });
            setRecentVehicles(formattedVehicles);
          } catch (error) {
            // If we can't check existing vehicles, mark all as new
            const formattedVehicles = result.vehicles.map((v: any, index: number) => ({
              id: `lam_${index}`,
              title: v.title || `${v.year} ${v.make} ${v.model}`,
              price: v.price || 0,
              year: v.year,
              make: v.make,
              model: v.model,
              vin: v.vin,
              stock: v.stock_number,
              images: v.images || [],
              status: 'new' as const,
              lastSynced: new Date().toISOString()
            }));
            setRecentVehicles(formattedVehicles);
          }
        }
        
        alert(`✅ Scraping completed! Found ${vehiclesFound} real vehicles from Lambert!`);
      } else {
        const errorText = await response.text();
        throw new Error(`Scraping failed: ${errorText}`);
      }
    } catch (error) {
      console.error('Scraping error:', error);
      setStats(prev => ({
        ...prev,
        status: 'error',
        errorMessage: 'Failed to complete scraping'
      }));
      alert('Scraping failed. Please check the console for details.');
    } finally {
      setIsScrapingRunning(false);
    }
  };

  const syncToMainInventory = async () => {
    setIsSyncing(true);
    
    try {
      // First, run the scraper to get fresh data
      const lambertUrl = process.env.NEXT_PUBLIC_LAMBERT_WORKER_URL || 
                        'https://lambert-scraper.nick-damato0011527.workers.dev';
      
      console.log('Fetching Lambert vehicles for sync...');
      const scrapeResponse = await fetch(`${lambertUrl}/api/lambert/scrape-with-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!scrapeResponse.ok) {
        throw new Error('Failed to fetch Lambert vehicles');
      }
      
      const scrapeResult = await scrapeResponse.json();
      
      if (!scrapeResult.vehicles || scrapeResult.vehicles.length === 0) {
        alert('No vehicles found to sync.');
        return;
      }
      
      // Now sync the vehicles to main inventory via admin API
      const apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 
                     'https://vehicle-admin-api.nick-damato0011527.workers.dev';
      
      const syncResponse = await fetch(`${apiUrl}/api/admin/lambert/sync-vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicles: scrapeResult.vehicles })
      });
      
      if (syncResponse.ok) {
        const syncResult = await syncResponse.json();
        const message = `✅ Sync Complete!\n` +
                       `• New vehicles: ${syncResult.new || 0}\n` +
                       `• Updated: ${syncResult.updated || 0}\n` +
                       `• Unchanged: ${syncResult.skipped || 0}\n` +
                       `• Total processed: ${syncResult.total}`;
        alert(message);
        await loadStats();
      } else {
        throw new Error('Failed to sync vehicles to main inventory');
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync to main inventory. Please check the console for details.');
    } finally {
      setIsSyncing(false);
    }
  };

  const exportData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 
                     'https://vehicle-admin-api.nick-damato0011527.workers.dev';
      const response = await fetch(`${apiUrl}/api/admin/lambert/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lambert-inventory-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lambert Inventory Scraper</h2>
          <p className="text-sm text-gray-600 mt-1">
            Sync vehicles from automobile-lambert.com
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {getStatusIcon(stats.status)}
          <span className="text-sm text-gray-600">
            {stats.status === 'running' ? 'Scraping...' : 
             stats.lastRun ? `Last run: ${new Date(stats.lastRun).toLocaleString()}` : 
             'Never run'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        {(['overview', 'vehicles', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`pb-2 px-1 font-medium capitalize transition-colors ${
              selectedTab === tab
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Database className="h-8 w-8 text-blue-500" />
                <span className="text-2xl font-bold text-blue-600">{stats.vehiclesFound}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Vehicles Found</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Image className="h-8 w-8 text-green-500" />
                <span className="text-2xl font-bold text-green-600">{stats.imagesUploaded}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Images Uploaded</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                <span className="text-2xl font-bold text-purple-600">{stats.newVehicles}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">New Vehicles</p>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <RefreshCw className="h-8 w-8 text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-600">{stats.updatedVehicles}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">Updated Vehicles</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={runScraper}
              disabled={isScrapingRunning}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <RefreshCw className={`h-4 w-4 ${isScrapingRunning ? 'animate-spin' : ''}`} />
              <span>{isScrapingRunning ? 'Scraping...' : 'Run Scraper'}</span>
            </button>
            
            <button
              onClick={async () => {
                const lambertUrl = process.env.NEXT_PUBLIC_LAMBERT_WORKER_URL || 
                                  'https://lambert-scraper.nick-damato0011527.workers.dev';
                try {
                  const response = await fetch(`${lambertUrl}/api/lambert/test`);
                  const data = await response.json();
                  alert(`✅ Connection successful! Lambert has ${data.vehiclesFound} vehicles on first page.`);
                } catch (error) {
                  alert('❌ Connection failed. Check console for details.');
                  console.error(error);
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Test Connection</span>
            </button>
            
            <button
              onClick={syncToMainInventory}
              disabled={isSyncing}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Database className="h-4 w-4" />
              <span>{isSyncing ? 'Syncing...' : 'Sync to Main Inventory'}</span>
            </button>
            
            <button
              onClick={exportData}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            
            <a
              href="https://www.automobile-lambert.com/cars/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Visit Lambert Site</span>
            </a>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Scrapes all vehicles from automobile-lambert.com</li>
              <li>• Downloads and optimizes images using Cloudflare Images</li>
              <li>• Detects new, changed, and removed vehicles</li>
              <li>• Syncs to your main inventory with partner tracking</li>
              <li>• Preserves original VIN and stock numbers</li>
            </ul>
          </div>

          {/* Error Message */}
          {stats.status === 'error' && stats.errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-800">{stats.errorMessage}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Vehicles Tab */}
      {selectedTab === 'vehicles' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Lambert Vehicles</h3>
          
          <div className="space-y-3">
            {recentVehicles.map(vehicle => (
              <div key={vehicle.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-lg">{vehicle.title}</h4>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      ${vehicle.price.toLocaleString()}
                    </p>
                    <div className="text-sm text-gray-600 mt-2 space-y-1">
                      {vehicle.vin && <p>VIN: {vehicle.vin}</p>}
                      {vehicle.stock && <p>Stock: {vehicle.stock}</p>}
                      <p>{vehicle.images.length} images available</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      vehicle.status === 'new' ? 'bg-green-100 text-green-800' :
                      vehicle.status === 'existing' ? 'bg-gray-100 text-gray-800' :
                      vehicle.status === 'updated' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {vehicle.status === 'existing' ? 'Already in Inventory' : vehicle.status}
                    </span>
                    {vehicle.lastSynced && (
                      <p className="text-xs text-gray-500 mt-2">
                        Synced: {new Date(vehicle.lastSynced).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {recentVehicles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No vehicles found. Run the scraper to import Lambert inventory.
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {selectedTab === 'settings' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Scraper Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Pages to Scrape
                </label>
                <input
                  type="number"
                  defaultValue={50}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Images per Vehicle
                </label>
                <input
                  type="number"
                  defaultValue={5}
                  min={1}
                  max={10}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scrape Delay (ms)
                </label>
                <input
                  type="number"
                  defaultValue={1500}
                  min={500}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Delay between requests to be polite to Lambert&apos;s server
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="auto-sync"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="auto-sync" className="text-sm text-gray-700">
                  Automatically sync to main inventory after scraping
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="download-images"
                  defaultChecked
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="download-images" className="text-sm text-gray-700">
                  Download and optimize images with Cloudflare Images
                </label>
              </div>
              
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Save Settings
              </button>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Schedule</h3>
            <p className="text-sm text-gray-600">
              Configure automatic scraping schedule (requires Cloudflare Cron Triggers)
            </p>
            <div className="mt-4 space-y-2">
              <label className="flex items-center space-x-3">
                <input type="radio" name="schedule" value="manual" defaultChecked />
                <span className="text-sm">Manual only</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="radio" name="schedule" value="daily" />
                <span className="text-sm">Daily at 2:00 AM</span>
              </label>
              <label className="flex items-center space-x-3">
                <input type="radio" name="schedule" value="twice" />
                <span className="text-sm">Twice daily (2:00 AM & 2:00 PM)</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
