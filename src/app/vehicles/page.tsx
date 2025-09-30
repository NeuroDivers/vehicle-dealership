'use client';

import { useState, useEffect, useMemo } from 'react';
import { getVehicleEndpoint } from '@/lib/api-config';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Filter, X, Car } from 'lucide-react';
import { trackSearchQuery } from '@/lib/analytics-config';

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

  // Check URL params for fuel type filter (for Electric vehicles link)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fuelTypeParam = urlParams.get('fuelType');
    if (fuelTypeParam) {
      setFilters(prev => ({ ...prev, fuelType: fuelTypeParam }));
      setShowFilters(true);
    }
  }, []);

  useEffect(() => {
    fetch(getVehicleEndpoint())
      .then(res => res.json())
      .then(data => {
        // Only show available vehicles (not sold)
        const availableVehicles = data.filter((v: Vehicle) => v.isSold !== 1);
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

      // Fuel type filter
      if (filters.fuelType && vehicle.fuelType !== filters.fuelType) return false;

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
      if (value.trim()) {
        const results = vehicles.filter(vehicle => {
          const searchLower = value.toLowerCase();
          return vehicle.make.toLowerCase().includes(searchLower) ||
                 vehicle.model.toLowerCase().includes(searchLower) ||
                 vehicle.year.toString().includes(value) ||
                 (vehicle.color && vehicle.color.toLowerCase().includes(searchLower));
        });
        trackSearchAnalytics(value, results.length);
      }
    }, 1000); // Track after 1 second of no typing
    
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
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
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
        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
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
          </div>
        )}
        
        {/* Vehicle Grid */}
        {filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">No vehicles found matching your criteria</p>
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800"
            >
              Clear filters and try again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
{filteredVehicles.map((vehicle) => {
  let images: string[] = [];
  if (vehicle.images) {
    const imageData = typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images;
    images = imageData.map((img: any) => {
      let imageUrl = '';
      if (typeof img === 'string') {
        imageUrl = img;
      } else if (img.variants) {
        imageUrl = img.variants.thumbnail || img.variants.public || img.variants.gallery;
      } else if (img.url) {
        imageUrl = img.url;
      }
      
      // Use thumbnail variant for Cloudflare Images
      if (imageUrl && imageUrl.includes('imagedelivery.net')) {
        imageUrl = imageUrl.replace('/public', '/thumbnail');
      }
      
      return imageUrl;
    }).filter((url: any) => url);
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
                      <Image
                        src={images[0]}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                    {/* Vendor Badge - Hidden from public view */}
                    {/* Status Badges */}
                    {vehicle.vendor_status === 'unlisted' && (
                      <div className="absolute top-2 right-2 bg-yellow-500 bg-opacity-90 text-white text-xs px-2 py-1 rounded z-10">
                        Unlisted
                      </div>
                    )}
                    {vehicle.isSold === 1 && (
                      <div className="absolute top-2 right-2 bg-red-500 bg-opacity-90 text-white text-xs px-2 py-1 rounded z-10">
                        Sold
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
                    <span className="text-blue-600 text-sm font-medium hover:text-blue-800">
                      View Details →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
