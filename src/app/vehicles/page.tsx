'use client';

import { useState, useEffect, useMemo } from 'react';
import { getVehicleEndpoint } from '@/lib/api-config';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Filter, X, Car } from 'lucide-react';
import { trackSearchQuery } from '@/lib/analytics-config';
import VehicleRequestModal from '@/components/VehicleRequestModal';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  odometer: number;
  bodyType: string;
  fuelType?: string;
  transmission?: string;
  drivetrain?: string;
  color?: string;
  vin?: string;
  stockNumber?: string;
  description?: string;
  isSold?: number;
  sold_date?: string;
  images?: string;
  vendor_id?: string;
  vendor_name?: string;
  vendor_status?: 'active' | 'unlisted' | 'sold_by_us' | 'sold_by_vendor' | 'removed';
  last_seen_from_vendor?: string;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('price-asc');
  const [filters, setFilters] = useState({
    bodyType: '',
    fuelType: '',
    minPrice: '',
    maxPrice: '',
    minYear: '',
    maxYear: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [language, setLanguage] = useState<'en' | 'fr' | 'es'>('en');

  // Check URL params for fuel type filter and search term
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fuelTypeParam = urlParams.get('fuelType');
    const searchParam = urlParams.get('search');
    
    if (fuelTypeParam) {
      setFilters(prev => ({ ...prev, fuelType: fuelTypeParam }));
      setShowFilters(true);
    }
    
    if (searchParam) {
      setSearchTerm(searchParam);
    }

    // Get language from localStorage
    const storedLang = localStorage.getItem('language') as 'en' | 'fr' | 'es';
    if (storedLang) {
      setLanguage(storedLang);
    }
  }, []);

  useEffect(() => {
    fetch(getVehicleEndpoint())
      .then(res => res.json())
      .then(data => {
        // Show vehicles that are:
        // 1. Not sold, OR
        // 2. Sold within the last 14 days
        const now = new Date();
        const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
        
        const availableVehicles = data.filter((v: Vehicle) => {
          if (v.isSold !== 1) return true; // Not sold
          
          // If sold, check if within 14 days
          if (v.sold_date) {
            const soldDate = new Date(v.sold_date);
            return soldDate >= fourteenDaysAgo;
          }
          
          return false; // Sold but no date, don't show
        });
        
        setVehicles(availableVehicles);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch vehicles:', err);
        setLoading(false);
      });
  }, []);

  // Filter and sort vehicles based on search, filters, and sort option
  const filteredVehicles = useMemo(() => {
    const filtered = vehicles.filter(vehicle => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        vehicle.make.toLowerCase().includes(searchLower) ||
        vehicle.model.toLowerCase().includes(searchLower) ||
        vehicle.year.toString().includes(searchTerm) ||
        (vehicle.color && vehicle.color.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      // Body type filter
      if (filters.bodyType && vehicle.bodyType !== filters.bodyType) return false;

      // Fuel type filter (case-insensitive)
      if (filters.fuelType && vehicle.fuelType?.toLowerCase() !== filters.fuelType.toLowerCase()) return false;

      // Price filters
      if (filters.minPrice && vehicle.price < parseInt(filters.minPrice)) return false;
      if (filters.maxPrice && vehicle.price > parseInt(filters.maxPrice)) return false;

      // Year filters
      if (filters.minYear && vehicle.year < parseInt(filters.minYear)) return false;
      if (filters.maxYear && vehicle.year > parseInt(filters.maxYear)) return false;

      return true;
    });

    // Sort the filtered vehicles
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'year-desc':
          return b.year - a.year;
        case 'year-asc':
          return a.year - b.year;
        case 'make-asc':
          return a.make.localeCompare(b.make);
        case 'odometer-asc':
          return a.odometer - b.odometer;
        default:
          return 0;
      }
    });

    return sorted;
  }, [vehicles, searchTerm, filters, sortBy]);

  // Get unique body types for filter dropdown
  const bodyTypes = useMemo(() => {
    const types = new Set(vehicles.map(v => v.bodyType));
    return Array.from(types).sort();
  }, [vehicles]);

  // Get unique fuel types for filter dropdown
  const fuelTypes = useMemo(() => {
    const types = new Set(vehicles.map(v => v.fuelType || 'gasoline'));
    return Array.from(types).sort();
  }, [vehicles]);

  // Track search queries for analytics (using imported function)
  const trackSearchAnalytics = (query: string, resultCount: number) => {
    if (!query.trim()) return;
    trackSearchQuery({ query: query.trim(), resultCount });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout to track search after user stops typing
    const timeout = setTimeout(() => {
      if (value.trim() && value.trim().length >= 3) {
        const results = vehicles.filter(vehicle => {
          const searchLower = value.toLowerCase();
          return vehicle.make.toLowerCase().includes(searchLower) ||
                 vehicle.model.toLowerCase().includes(searchLower) ||
                 vehicle.year.toString().includes(value) ||
                 (vehicle.color && vehicle.color.toLowerCase().includes(searchLower));
        });
        trackSearchAnalytics(value, results.length);
      }
    }, 2000); // Track after 2 seconds of no typing
    
    setSearchTimeout(timeout);
  };

  const clearFilters = () => {
    setFilters({
      bodyType: '',
      fuelType: '',
      minPrice: '',
      maxPrice: '',
      minYear: '',
      maxYear: '',
    });
    setSearchTerm('');
    
    // Clear search timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Our Vehicles</h1>
          <p className="text-gray-600">Loading vehicles from database...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter Toggle and Active Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Filter className="h-4 w-4 mr-2" />
            <span>Filters</span>
            {Object.values(filters).some(v => v) && (
              <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {Object.values(filters).filter(v => v).length}
              </span>
            )}
          </button>
        </div>
        
        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            {(searchTerm || Object.values(filters).some(v => v)) && (
              <button
                onClick={clearFilters}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </button>
            )}
            
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="year-desc">Year: Newest First</option>
                <option value="year-asc">Year: Oldest First</option>
                <option value="make-asc">Make: A to Z</option>
                <option value="odometer-asc">Mileage: Low to High</option>
              </select>
            </div>
          </div>
          
          <span className="text-sm text-gray-600">
            {filteredVehicles.length} {filteredVehicles.length === 1 ? 'vehicle' : 'vehicles'} found
          </span>
        </div>
        {/* Filters Panel - Slide-in Modal on Mobile, Regular Panel on Desktop */}
        {showFilters && (
          <>
            {/* Mobile Overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setShowFilters(false)}
            />
            
            {/* Filters Container */}
            <div className="fixed md:relative inset-y-0 right-0 md:inset-auto w-full max-w-sm md:max-w-none bg-white md:rounded-lg shadow-lg md:shadow p-6 mb-0 md:mb-8 z-50 md:z-auto overflow-y-auto md:overflow-visible transform transition-transform duration-300 ease-in-out">
              {/* Mobile Header */}
              <div className="flex justify-between items-center mb-4 md:hidden">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body Type</label>
                <select
                  value={filters.bodyType}
                  onChange={(e) => setFilters({...filters, bodyType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  {bodyTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                <select
                  value={filters.fuelType}
                  onChange={(e) => setFilters({...filters, fuelType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Fuels</option>
                  <option value="gasoline">Gasoline</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="plugin-hybrid">Plug-in Hybrid</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
                <input
                  type="number"
                  placeholder="$ Min"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                <input
                  type="number"
                  placeholder="$ Max"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Year</label>
                <input
                  type="number"
                  placeholder="From"
                  value={filters.minYear}
                  onChange={(e) => setFilters({...filters, minYear: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Year</label>
                <input
                  type="number"
                  placeholder="To"
                  value={filters.maxYear}
                  onChange={(e) => setFilters({...filters, maxYear: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              </div>
              
              {/* Mobile Apply Button */}
              <div className="mt-6 md:hidden flex gap-2">
                <button
                  onClick={clearFilters}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </>
        )}
        
        {/* Vehicle Grid */}
        {filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No vehicles found matching your criteria</h3>
            <p className="text-gray-600 mb-6">But we can help you find it!</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowRequestModal(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition"
              >
                Request This Vehicle
              </button>
              <button
                onClick={clearFilters}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
{filteredVehicles.map((vehicle) => {
  let images: string[] = [];
  if (vehicle.images) {
    const imageData = typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images;
    // Safety check: ensure imageData is an array
    if (Array.isArray(imageData)) {
      images = imageData.map((img: any) => {
      let imageUrl = '';
      if (typeof img === 'string') {
        imageUrl = img;
      } else if (img.variants) {
        imageUrl = img.variants.thumbnail || img.variants.public || img.variants.gallery;
      } else if (img.url) {
        imageUrl = img.url;
      }
      
      // Use w=600 variant for Cloudflare Images (600px width, better quality for cards)
      if (imageUrl && imageUrl.includes('imagedelivery.net')) {
        imageUrl = imageUrl.replace(/\/(public|thumbnail|w=300|w=600)$/, '/w=600');
      }
      
      return imageUrl;
    }).filter((url: any) => url);
    }
  }
  return (
                <Link 
                  key={vehicle.id} 
                  href={`/vehicles/detail?id=${vehicle.id}`}
                  className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition block"
                >
                  {/* Vehicle Image */}
                  <div className="relative h-48 bg-gray-100">
                    {images.length > 0 ? (
                      <img
                        src={images[0]}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><svg class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg></div>';
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Car className="h-16 w-16" />
                      </div>
                    )}
                    {images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded z-10">
                        +{images.length - 1} photos
                      </div>
                    )}
                    {/* SOLD Banner */}
                    {vehicle.isSold === 1 && (
                      <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-center py-2 font-bold text-lg z-20 shadow-lg">
                        SOLD
                      </div>
                    )}
                    {/* Vendor Badge - Hidden from public view */}
                    {/* Status Badges */}
                    {vehicle.vendor_status === 'unlisted' && !vehicle.isSold && (
                      <div className="absolute top-2 right-2 bg-yellow-500 bg-opacity-90 text-white text-xs px-2 py-1 rounded z-10">
                        Unlisted
                      </div>
                    )}
                  </div>
                  
                  {/* Vehicle Details */}
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-2">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h2>
                    <div className="text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        {vehicle.color && (
                          <>
                            {vehicle.color.startsWith('#') ? (
                              <div className="flex items-center gap-1">
                                <div 
                                  className="w-4 h-4 rounded border border-gray-300" 
                                  style={{ backgroundColor: vehicle.color }}
                                  title={vehicle.color}
                                />
                                <span>Color</span>
                              </div>
                            ) : (
                              <span>{vehicle.color}</span>
                            )}
                          </>
                        )}
                        <span>• {vehicle.bodyType}</span>
                      </div>
                      <p>{vehicle.odometer.toLocaleString()} km</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600 mb-3">
                      ${vehicle.price.toLocaleString()}
                    </p>
                    <span className="text-blue-700 text-sm font-semibold hover:text-blue-900">
                      View Details →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Vehicle Request Modal */}
      <VehicleRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        searchQuery={searchTerm}
        language={language}
      />
    </main>
  );
}
