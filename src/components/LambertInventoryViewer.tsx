'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ExternalLink, Download, RefreshCw, TrendingUp, TrendingDown, DollarSign, Car, Calendar, Hash } from 'lucide-react';

interface LambertVehicle {
  id: number;
  url: string;
  title: string;
  year: number;
  make: string;
  model: string;
  price: number;
  vin: string;
  stock_number: string;
  odometer: number;
  odometer_unit: string;
  transmission: string;
  fuel_type: string;
  body_type: string;
  color_exterior: string;
  images: string;
  local_images?: string;
  status: string;
  first_seen: string;
  last_changed?: string;
  scraped_at: string;
}

interface ScraperStats {
  totalVehicles: number;
  newToday: number;
  changedToday: number;
  removedToday: number;
  lastScrape: string;
  nextScrape: string;
}

export default function LambertInventoryViewer() {
  const [vehicles, setVehicles] = useState<LambertVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ScraperStats | null>(null);
  const [filter, setFilter] = useState<'all' | 'new' | 'changed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<LambertVehicle | null>(null);
  const [scraping, setScraping] = useState(false);

  // In production, replace with actual API calls
  const WORKER_URL = process.env.NEXT_PUBLIC_LAMBERT_WORKER_URL || 
                     'https://lambert-scraper.your-subdomain.workers.dev';

  useEffect(() => {
    fetchInventory();
    fetchStats();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch(`${WORKER_URL}/api/lambert/inventory`);
      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      }
    } catch (error) {
      console.error('Failed to fetch Lambert inventory:', error);
      // Use mock data for development
      setVehicles(getMockVehicles());
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${WORKER_URL}/api/lambert/delta`);
      if (response.ok) {
        const delta = await response.json();
        setStats({
          totalVehicles: vehicles.length,
          newToday: delta?.new?.length || 0,
          changedToday: delta?.changed?.length || 0,
          removedToday: 0,
          lastScrape: delta?.timestamp || new Date().toISOString(),
          nextScrape: getNextScrapeTime()
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Mock stats
      setStats({
        totalVehicles: 46,
        newToday: 3,
        changedToday: 7,
        removedToday: 1,
        lastScrape: new Date().toISOString(),
        nextScrape: getNextScrapeTime()
      });
    }
  };

  const triggerScrape = async () => {
    setScraping(true);
    try {
      const response = await fetch(`${WORKER_URL}/api/lambert/scrape`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Scraping completed! Found ${result.stats.vehiclesFound} vehicles`);
        await fetchInventory();
        await fetchStats();
      }
    } catch (error) {
      console.error('Failed to trigger scrape:', error);
      alert('Failed to start scraping. Check console for details.');
    } finally {
      setScraping(false);
    }
  };

  const exportCSV = async () => {
    try {
      const response = await fetch(`${WORKER_URL}/api/lambert/export-csv`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lambert-inventory.csv';
        a.click();
      }
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  const getNextScrapeTime = () => {
    const now = new Date();
    const next = new Date(now);
    
    // Next scrape at 2 AM or 2 PM
    if (now.getHours() < 2) {
      next.setHours(2, 0, 0, 0);
    } else if (now.getHours() < 14) {
      next.setHours(14, 0, 0, 0);
    } else {
      next.setDate(next.getDate() + 1);
      next.setHours(2, 0, 0, 0);
    }
    
    return next.toISOString();
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    // Apply status filter
    if (filter === 'new' && vehicle.status !== 'NEW') return false;
    if (filter === 'changed' && vehicle.status !== 'CHANGED') return false;
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        vehicle.title?.toLowerCase().includes(search) ||
        vehicle.make?.toLowerCase().includes(search) ||
        vehicle.model?.toLowerCase().includes(search) ||
        vehicle.vin?.toLowerCase().includes(search) ||
        vehicle.stock_number?.toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  const getMockVehicles = (): LambertVehicle[] => {
    return [
      {
        id: 1,
        url: 'https://www.automobile-lambert.com/cars/2018-toyota-c-hr/',
        title: '2018 Toyota C-HR XLE',
        year: 2018,
        make: 'Toyota',
        model: 'C-HR XLE',
        price: 13999,
        vin: 'NMTKHMBX8JR064521',
        stock_number: 'LAM-2018-CHR',
        odometer: 98000,
        odometer_unit: 'km',
        transmission: 'Automatic',
        fuel_type: 'gasoline',
        body_type: 'suv',
        color_exterior: 'Silver',
        images: JSON.stringify([
          'https://www.automobile-lambert.com/wp-content/uploads/2024/01/chr-1.jpg',
          'https://www.automobile-lambert.com/wp-content/uploads/2024/01/chr-2.jpg'
        ]),
        status: 'NEW',
        first_seen: new Date(Date.now() - 86400000).toISOString(),
        scraped_at: new Date().toISOString()
      },
      {
        id: 2,
        url: 'https://www.automobile-lambert.com/cars/2019-mazda-cx-5/',
        title: '2019 Mazda CX-5 GS',
        year: 2019,
        make: 'Mazda',
        model: 'CX-5 GS',
        price: 21999,
        vin: 'JM3KFBCM8K0567890',
        stock_number: 'LAM-2019-CX5',
        odometer: 75000,
        odometer_unit: 'km',
        transmission: 'Automatic',
        fuel_type: 'gasoline',
        body_type: 'suv',
        color_exterior: 'Red',
        images: JSON.stringify([]),
        status: 'CHANGED',
        first_seen: new Date(Date.now() - 604800000).toISOString(),
        last_changed: new Date().toISOString(),
        scraped_at: new Date().toISOString()
      }
    ];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Lambert Inventory</h2>
        <p className="text-gray-600">Loading inventory from automobile-lambert.com...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Lambert Inventory</h2>
        <div className="flex space-x-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={triggerScrape}
            disabled={scraping}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${scraping ? 'animate-spin' : ''}`} />
            <span>{scraping ? 'Scraping...' : 'Scrape Now'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <Car className="h-8 w-8 text-gray-400" />
              <span className="text-2xl font-bold">{stats.totalVehicles}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Total Vehicles</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <span className="text-2xl font-bold text-green-600">{stats.newToday}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">New Today</p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <RefreshCw className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold text-blue-600">{stats.changedToday}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Changed Today</p>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <TrendingDown className="h-8 w-8 text-red-500" />
              <span className="text-2xl font-bold text-red-600">{stats.removedToday}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Removed Today</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div className="text-right">
                <p className="text-xs text-gray-600">Last: {new Date(stats.lastScrape).toLocaleTimeString()}</p>
                <p className="text-xs text-gray-600">Next: {new Date(stats.nextScrape).toLocaleTimeString()}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">Scrape Schedule</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        <input
          type="text"
          placeholder="Search by make, model, VIN, or stock..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <div className="flex space-x-2">
          {(['all', 'new', 'changed'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg capitalize transition ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map(vehicle => {
          const images = JSON.parse(vehicle.images || '[]');
          
          return (
            <div key={vehicle.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
              {/* Image */}
              {images.length > 0 ? (
                <div className="relative h-48 bg-gray-100">
                  <img
                    src={images[0]}
                    alt={vehicle.title}
                    className="w-full h-full object-cover"
                  />
                  {vehicle.status === 'NEW' && (
                    <span className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                      NEW
                    </span>
                  )}
                  {vehicle.status === 'CHANGED' && (
                    <span className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                      UPDATED
                    </span>
                  )}
                </div>
              ) : (
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  <Car className="h-16 w-16 text-gray-400" />
                </div>
              )}
              
              {/* Details */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{vehicle.title}</h3>
                
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  ${vehicle.price?.toLocaleString()}
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Hash className="h-3 w-3" />
                    <span>Stock: {vehicle.stock_number}</span>
                  </div>
                  <div>VIN: {vehicle.vin}</div>
                  <div>{vehicle.odometer?.toLocaleString()} {vehicle.odometer_unit}</div>
                  <div>{vehicle.transmission} • {vehicle.fuel_type}</div>
                  <div>{vehicle.body_type} • {vehicle.color_exterior}</div>
                </div>
                
                <div className="mt-3 pt-3 border-t flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    First seen: {new Date(vehicle.first_seen).toLocaleDateString()}
                  </span>
                  <a
                    href={vehicle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No vehicles found matching your criteria
        </div>
      )}
    </div>
  );
}
