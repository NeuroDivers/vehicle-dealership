'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, Filter, X } from 'lucide-react';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  odometer: number;
  bodyType: string;
  color: string;
  description?: string;
  isSold?: number;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    bodyType: '',
    minPrice: '',
    maxPrice: '',
    minYear: '',
    maxYear: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch('https://vehicle-dealership-api.nick-damato0011527.workers.dev/api/vehicles')
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

  // Filter vehicles based on search and filters
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        vehicle.make.toLowerCase().includes(searchLower) ||
        vehicle.model.toLowerCase().includes(searchLower) ||
        vehicle.year.toString().includes(searchTerm) ||
        vehicle.color.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Body type filter
      if (filters.bodyType && vehicle.bodyType !== filters.bodyType) return false;

      // Price filters
      if (filters.minPrice && vehicle.price < parseInt(filters.minPrice)) return false;
      if (filters.maxPrice && vehicle.price > parseInt(filters.maxPrice)) return false;

      // Year filters
      if (filters.minYear && vehicle.year < parseInt(filters.minYear)) return false;
      if (filters.maxYear && vehicle.year > parseInt(filters.maxYear)) return false;

      return true;
    });
  }, [vehicles, searchTerm, filters]);

  // Get unique body types for filter dropdown
  const bodyTypes = useMemo(() => {
    const types = new Set(vehicles.map(v => v.bodyType));
    return Array.from(types).sort();
  }, [vehicles]);

  const clearFilters = () => {
    setFilters({
      bodyType: '',
      minPrice: '',
      maxPrice: '',
      minYear: '',
      maxYear: '',
    });
    setSearchTerm('');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Our Vehicles</h1>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by make, model, year, or color..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            Filters
          </button>
          
          {(searchTerm || Object.values(filters).some(v => v)) && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-4 py-2 text-sm text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </button>
          )}
          
          <span className="text-sm text-gray-600">
            {filteredVehicles.length} {filteredVehicles.length === 1 ? 'vehicle' : 'vehicles'} found
          </span>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
            {filteredVehicles.map((vehicle) => (
              <Link 
                key={vehicle.id} 
                href={`/vehicles/${vehicle.id}`}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition block"
              >
                <h2 className="text-xl font-semibold mb-2">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h2>
                <div className="text-sm text-gray-600 mb-3">
                  <p>{vehicle.color} • {vehicle.bodyType}</p>
                  <p>{vehicle.odometer.toLocaleString()} km</p>
                </div>
                <p className="text-2xl font-bold text-green-600 mb-3">
                  ${vehicle.price.toLocaleString()}
                </p>
                <span className="text-blue-600 text-sm font-medium hover:text-blue-800">
                  View Details →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
