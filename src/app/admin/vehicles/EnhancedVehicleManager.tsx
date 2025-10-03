'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getVehicleEndpoint } from '@/lib/api-config';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  X, 
  Car,
  DollarSign,
  Calendar,
  Gauge,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Download,
  Upload,
  Grid,
  LayoutGrid
} from 'lucide-react';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  odometer: number;
  bodyType: string;
  color: string;
  isSold: number;
  images?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  vendor_id?: string;
  vendor_name?: string;
  vendor_stock_number?: string;
  vendor_status?: string;
}

export default function EnhancedVehicleManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showSold, setShowSold] = useState(false);
  const [showAvailable, setShowAvailable] = useState(true);
  const [selectedBodyType, setSelectedBodyType] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState<'price' | 'year' | 'odometer' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // Bulk selection
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = () => {
    fetch(getVehicleEndpoint())
      .then(res => res.json())
      .then(data => {
        setVehicles(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch vehicles:', err);
        setLoading(false);
      });
  };

  // Filter and sort vehicles
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles.filter(vehicle => {
      // Status filter
      if (!showSold && vehicle.isSold === 1) return false;
      if (!showAvailable && vehicle.isSold === 0) return false;
      
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const searchableText = `${vehicle.make} ${vehicle.model} ${vehicle.year} ${vehicle.color} ${vehicle.bodyType} ${vehicle.id} ${vehicle.vendor_name || ''} ${vehicle.vendor_stock_number || ''}`.toLowerCase();
        if (!searchableText.includes(search)) return false;
      }
      
      // Body type filter
      if (selectedBodyType && vehicle.bodyType !== selectedBodyType) return false;
      
      // Year filter
      if (selectedYear && vehicle.year.toString() !== selectedYear) return false;
      
      // Vendor filter
      if (selectedVendor && vehicle.vendor_id !== selectedVendor) return false;
      
      // Price range filter
      if (priceRange.min && vehicle.price < parseFloat(priceRange.min)) return false;
      if (priceRange.max && vehicle.price > parseFloat(priceRange.max)) return false;
      
      return true;
    });
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'year':
          comparison = a.year - b.year;
          break;
        case 'odometer':
          comparison = a.odometer - b.odometer;
          break;
        case 'date':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [vehicles, searchTerm, showSold, showAvailable, selectedBodyType, selectedYear, selectedVendor, priceRange, sortBy, sortOrder]);

  // Get unique values for filters
  const bodyTypes = useMemo(() => {
    const types = new Set(vehicles.map(v => v.bodyType));
    return Array.from(types).sort();
  }, [vehicles]);
  
  const years = useMemo(() => {
    const yearSet = new Set(vehicles.map(v => v.year.toString()));
    return Array.from(yearSet).sort((a, b) => b.localeCompare(a));
  }, [vehicles]);
  
  const vendors = useMemo(() => {
    const vendorMap = new Map();
    vehicles.forEach(v => {
      if (v.vendor_id) {
        vendorMap.set(v.vendor_id, v.vendor_name || v.vendor_id);
      }
    });
    return Array.from(vendorMap.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [vehicles]);

  const deleteVehicleById = async (id: string) => {
    // Internal delete function without confirmation
    const res = await fetch(getVehicleEndpoint(`/${id}`), {
      method: 'DELETE',
    });
    
    if (res.ok) {
      setVehicles(prev => prev.filter(v => v.id !== id));
      setSelectedVehicles(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      return true;
    }
    return false;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    
    setDeletingId(id);
    try {
      await deleteVehicleById(id);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('Failed to delete vehicle');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleSold = async (vehicle: Vehicle) => {
    try {
      const res = await fetch(getVehicleEndpoint(`/${vehicle.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...vehicle, isSold: vehicle.isSold === 1 ? 0 : 1 }),
      });
      
      if (res.ok) {
        fetchVehicles();
      } else {
        alert('Failed to update vehicle');
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
      alert('Failed to update vehicle');
    }
  };

  const handleBulkAction = async () => {
    if (selectedVehicles.size === 0) {
      alert('Please select vehicles first');
      return;
    }
    
    if (!bulkAction) {
      alert('Please select an action');
      return;
    }
    
    const selectedVehiclesList = vehicles.filter(v => selectedVehicles.has(v.id));
    
    switch (bulkAction) {
      case 'markSold':
        for (const vehicle of selectedVehiclesList) {
          if (vehicle.isSold === 0) {
            await handleToggleSold(vehicle);
          }
        }
        break;
      case 'markAvailable':
        for (const vehicle of selectedVehiclesList) {
          if (vehicle.isSold === 1) {
            await handleToggleSold(vehicle);
          }
        }
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete ${selectedVehicles.size} vehicles?`)) {
          const vehicleIds = Array.from(selectedVehicles);
          let successCount = 0;
          let failCount = 0;
          
          for (const id of vehicleIds) {
            try {
              const success = await deleteVehicleById(id);
              if (success) {
                successCount++;
              } else {
                failCount++;
              }
            } catch (error) {
              console.error(`Error deleting vehicle ${id}:`, error);
              failCount++;
            }
          }
          
          if (successCount > 0) {
            alert(`Successfully deleted ${successCount} vehicle(s)${failCount > 0 ? `. Failed to delete ${failCount} vehicle(s).` : '.'}`);
          } else if (failCount > 0) {
            alert(`Failed to delete ${failCount} vehicle(s).`);
          }
        }
        break;
      case 'export':
        exportVehicles(selectedVehiclesList);
        break;
    }
    
    setSelectedVehicles(new Set());
    setBulkAction('');
  };

  const exportVehicles = (vehiclesToExport: Vehicle[]) => {
    const csv = [
      ['ID', 'Make', 'Model', 'Year', 'Price', 'Odometer', 'Body Type', 'Color', 'Status'],
      ...vehiclesToExport.map(v => [
        v.id,
        v.make,
        v.model,
        v.year,
        v.price,
        v.odometer,
        v.bodyType,
        v.color,
        v.isSold === 1 ? 'Sold' : 'Available'
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicles_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const toggleSelectAll = () => {
    if (selectedVehicles.size === filteredVehicles.length) {
      setSelectedVehicles(new Set());
    } else {
      setSelectedVehicles(new Set(filteredVehicles.map(v => v.id)));
    }
  };

  const toggleSelectVehicle = (id: string) => {
    const newSet = new Set(selectedVehicles);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedVehicles(newSet);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedBodyType('');
    setSelectedYear('');
    setSelectedVendor('');
    setPriceRange({ min: '', max: '' });
    setShowSold(false);
    setShowAvailable(true);
  };

  const stats = useMemo(() => {
    const sold = vehicles.filter(v => v.isSold === 1).length;
    const available = vehicles.filter(v => v.isSold === 0).length;
    const totalValue = vehicles.filter(v => v.isSold === 0).reduce((sum, v) => sum + v.price, 0);
    const avgPrice = available > 0 ? totalValue / available : 0;
    
    return { sold, available, totalValue, avgPrice };
  }, [vehicles]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Loading vehicles...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vehicle Inventory Management</h1>
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md flex items-center space-x-1 transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Table view"
            >
              <Grid className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md flex items-center space-x-1 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:inline">Grid</span>
            </button>
          </div>
          <Link
            href="/admin/vehicles/add"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Vehicle</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
            </div>
            <Car className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sold</p>
              <p className="text-2xl font-bold text-red-600">{stats.sold}</p>
            </div>
            <CheckSquare className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Price</p>
              <p className="text-2xl font-bold">${Math.round(stats.avgPrice).toLocaleString()}</p>
            </div>
            <Gauge className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showAvailable}
                onChange={(e) => setShowAvailable(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Available</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showSold}
                onChange={(e) => setShowSold(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Sold</span>
            </label>
          </div>
          
          {/* Body Type */}
          <select
            value={selectedBodyType}
            onChange={(e) => setSelectedBodyType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {bodyTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          {/* Year */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          {/* Vendor */}
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Vendors</option>
            {vendors.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          
          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center space-x-1"
          >
            <X className="h-4 w-4" />
            <span>Clear</span>
          </button>
        </div>
        
        {/* Price Range */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-4">
          <div className="md:col-span-2 flex items-center space-x-2">
            <input
              type="number"
              placeholder="Min price"
              value={priceRange.min}
              onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Max price"
              value={priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Sort */}
          <div className="md:col-span-2 flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Date Added</option>
              <option value="price">Price</option>
              <option value="year">Year</option>
              <option value="odometer">Mileage</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
          
          {/* Results count */}
          <div className="md:col-span-2 flex items-center text-sm text-gray-600">
            Showing {filteredVehicles.length} of {vehicles.length} vehicles
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedVehicles.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">
                {selectedVehicles.size} vehicle{selectedVehicles.size !== 1 ? 's' : ''} selected
              </span>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="">Choose action...</option>
                <option value="markSold">Mark as Sold</option>
                <option value="markAvailable">Mark as Available</option>
                <option value="export">Export to CSV</option>
                <option value="delete">Delete</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Apply
              </button>
            </div>
            <button
              onClick={() => setSelectedVehicles(new Set())}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {/* Vehicles Display */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No vehicles found matching your criteria</p>
          {(searchTerm || selectedBodyType || selectedYear || priceRange.min || priceRange.max) ? (
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          ) : (
            <Link
              href="/admin/vehicles/add"
              className="text-blue-600 hover:text-blue-800"
            >
              Add your first vehicle
            </Link>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedVehicles.size === filteredVehicles.length && filteredVehicles.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVehicles.map((vehicle) => {
                  const images = vehicle.images ? (typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images) : [];
                  // Extract the first image URL properly
                  let firstImageUrl = null;
                  if (images.length > 0) {
                    const img = images[0];
                    if (typeof img === 'string') {
                      firstImageUrl = img;
                    } else if (img && img.variants) {
                      firstImageUrl = img.variants.public || img.variants.gallery;
                    } else if (img && img.url) {
                      firstImageUrl = img.url;
                    } else if (img && img.id) {
                      firstImageUrl = img.id;
                    }
                  }
                  // Use thumbnail variant for table view (150px)
                  if (firstImageUrl && firstImageUrl.includes('imagedelivery.net')) {
                    firstImageUrl = firstImageUrl.replace(/\/(public|thumbnail|w=300)$/, '/thumbnail');
                  }
                  
                  return (
                    <tr key={vehicle.id} className={`hover:bg-gray-50 ${vehicle.isSold === 1 ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedVehicles.has(vehicle.id)}
                          onChange={() => toggleSelectVehicle(vehicle.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {firstImageUrl ? (
                          <img
                            src={firstImageUrl}
                            alt={`${vehicle.make} ${vehicle.model}`}
                            className="h-16 w-16 object-cover rounded"
                          />
                        ) : (
                          <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No image</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </div>
                          <div className="text-sm text-gray-500">ID: {vehicle.id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {vehicle.color} • {vehicle.bodyType}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vehicle.odometer.toLocaleString()} km
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${vehicle.price.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {vehicle.vendor_name || 'Internal'}
                        </div>
                        {vehicle.vendor_stock_number && (
                          <div className="text-xs text-gray-500">
                            Stock: {vehicle.vendor_stock_number}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleSold(vehicle)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            vehicle.isSold === 1
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {vehicle.isSold === 1 ? 'Sold' : 'Available'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <Link
                            href={`/vehicles/detail?id=${vehicle.id}`}
                            target="_blank"
                            className="text-gray-600 hover:text-gray-900"
                            title="View on site"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/admin/vehicles/edit?id=${vehicle.id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit vehicle"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(vehicle.id)}
                            disabled={deletingId === vehicle.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Delete vehicle"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVehicles.map((vehicle) => {
            const images = vehicle.images ? (typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images) : [];
            // Extract the first image URL properly
            let firstImageUrl = null;
            if (images.length > 0) {
              const img = images[0];
              if (typeof img === 'string') {
                firstImageUrl = img;
              } else if (img && img.variants) {
                firstImageUrl = img.variants.public || img.variants.gallery;
              } else if (img && img.url) {
                firstImageUrl = img.url;
              } else if (img && img.id) {
                firstImageUrl = img.id;
              }
            }
            // Use w=300 variant for grid view (300px)
            if (firstImageUrl && firstImageUrl.includes('imagedelivery.net')) {
              firstImageUrl = firstImageUrl.replace(/\/(public|thumbnail|w=300)$/, '/w=300');
            }
            
            return (
              <div
                key={vehicle.id}
                className={`bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow ${
                  vehicle.isSold === 1 ? 'opacity-75' : ''
                } ${
                  selectedVehicles.has(vehicle.id) ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {/* Image */}
                <div className="relative">
                  {firstImageUrl ? (
                    <img
                      src={firstImageUrl}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                  
                  {/* Checkbox */}
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={selectedVehicles.has(vehicle.id)}
                      onChange={() => toggleSelectVehicle(vehicle.id)}
                      className="rounded w-5 h-5 bg-white shadow"
                    />
                  </div>
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => handleToggleSold(vehicle)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium shadow ${
                        vehicle.isSold === 1
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {vehicle.isSold === 1 ? 'Sold' : 'Available'}
                    </button>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-4">
                  {/* Title */}
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                  
                  {/* Details */}
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <Car className="h-4 w-4" />
                      <span>{vehicle.color} • {vehicle.bodyType}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Gauge className="h-4 w-4" />
                      <span>{vehicle.odometer.toLocaleString()} km</span>
                    </div>
                    {vehicle.vendor_name && (
                      <div className="text-xs text-gray-500">
                        Vendor: {vehicle.vendor_name}
                      </div>
                    )}
                  </div>
                  
                  {/* Price */}
                  <div className="text-2xl font-bold text-gray-900 mb-4">
                    ${vehicle.price.toLocaleString()}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex space-x-2 border-t pt-3">
                    <Link
                      href={`/vehicles/detail?id=${vehicle.id}`}
                      target="_blank"
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded border border-gray-300"
                      title="View on site"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </Link>
                    <Link
                      href={`/admin/vehicles/edit?id=${vehicle.id}`}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded border border-blue-300"
                      title="Edit vehicle"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
                      disabled={deletingId === vehicle.id}
                      className="flex items-center justify-center px-3 py-2 text-sm text-red-600 hover:text-red-900 hover:bg-red-50 rounded border border-red-300 disabled:opacity-50"
                      title="Delete vehicle"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
