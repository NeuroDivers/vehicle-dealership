'use client';

import { useState, useEffect, useMemo } from 'react';
import { getVehicleEndpoint } from '@/lib/api-config';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Filter, X, Car, Gauge, Calendar, Fuel, Settings2, ArrowRight, MapPin } from 'lucide-react';
import { trackSearchQuery } from '@/lib/analytics-config';
import VehicleRequestModal from '@/components/VehicleRequestModal';
import { getAllVehicleImageUrls } from '@/utils/imageUtils';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

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

const translations = {
  en: {
    searchPlaceholder: 'Search vehicles...',
    filters: 'Filters',
    clearAll: 'Clear All',
    sortBy: 'Sort by:',
    priceLowHigh: 'Price: Low to High',
    priceHighLow: 'Price: High to Low',
    yearNewest: 'Year: Newest First',
    yearOldest: 'Year: Oldest First',
    makeAZ: 'Make: A to Z',
    mileageLowHigh: 'Mileage: Low to High',
    vehicle: 'vehicle',
    vehicles: 'vehicles',
    found: 'found',
    bodyType: 'Body Type',
    allTypes: 'All Types',
    fuelType: 'Fuel Type',
    allFuels: 'All Fuels',
    gasoline: 'Gasoline',
    diesel: 'Diesel',
    electric: 'Electric',
    hybrid: 'Hybrid',
    pluginHybrid: 'Plug-in Hybrid',
    minPrice: 'Min Price',
    maxPrice: 'Max Price',
    minPricePlaceholder: '$ Min',
    maxPricePlaceholder: '$ Max',
    minYear: 'Min Year',
    maxYear: 'Max Year',
    from: 'From',
    to: 'To',
    applyFilters: 'Apply Filters',
    noVehiclesTitle: 'No vehicles found',
    noVehiclesMessage: 'Try adjusting your filters or search terms',
    requestVehicle: 'Request a Vehicle',
    requestVehicleMessage: "Can't find what you're looking for?",
    loading: 'Loading vehicles...',
    mileage: 'Mileage',
    fuel: 'Fuel',
    trans: 'Trans.',
    color: 'Color',
    custom: 'Custom',
    price: 'Price',
    view: 'View',
    photos: 'photos'
  },
  fr: {
    searchPlaceholder: 'Rechercher des véhicules...',
    filters: 'Filtres',
    clearAll: 'Effacer tout',
    sortBy: 'Trier par:',
    priceLowHigh: 'Prix: Bas à élevé',
    priceHighLow: 'Prix: Élevé à bas',
    yearNewest: 'Année: Plus récent',
    yearOldest: 'Année: Plus ancien',
    makeAZ: 'Marque: A à Z',
    mileageLowHigh: 'Kilométrage: Bas à élevé',
    vehicle: 'véhicule',
    vehicles: 'véhicules',
    found: 'trouvé(s)',
    bodyType: 'Type de carrosserie',
    allTypes: 'Tous les types',
    fuelType: 'Type de carburant',
    allFuels: 'Tous les carburants',
    gasoline: 'Essence',
    diesel: 'Diesel',
    electric: 'Électrique',
    hybrid: 'Hybride',
    pluginHybrid: 'Hybride rechargeable',
    minPrice: 'Prix min',
    maxPrice: 'Prix max',
    minPricePlaceholder: '$ Min',
    maxPricePlaceholder: '$ Max',
    minYear: 'Année min',
    maxYear: 'Année max',
    from: 'De',
    to: 'À',
    applyFilters: 'Appliquer les filtres',
    noVehiclesTitle: 'Aucun véhicule trouvé',
    noVehiclesMessage: 'Essayez d\'ajuster vos filtres ou termes de recherche',
    requestVehicle: 'Demander un véhicule',
    requestVehicleMessage: 'Vous ne trouvez pas ce que vous cherchez?',
    loading: 'Chargement des véhicules...',
    mileage: 'Kilométrage',
    fuel: 'Carburant',
    trans: 'Trans.',
    color: 'Couleur',
    custom: 'Personnalisé',
    price: 'Prix',
    view: 'Voir',
    photos: 'photos'
  },
  es: {
    searchPlaceholder: 'Buscar vehículos...',
    filters: 'Filtros',
    clearAll: 'Borrar todo',
    sortBy: 'Ordenar por:',
    priceLowHigh: 'Precio: Bajo a alto',
    priceHighLow: 'Precio: Alto a bajo',
    yearNewest: 'Año: Más reciente',
    yearOldest: 'Año: Más antiguo',
    makeAZ: 'Marca: A a Z',
    mileageLowHigh: 'Kilometraje: Bajo a alto',
    vehicle: 'vehículo',
    vehicles: 'vehículos',
    found: 'encontrado(s)',
    bodyType: 'Tipo de carrocería',
    allTypes: 'Todos los tipos',
    fuelType: 'Tipo de combustible',
    allFuels: 'Todos los combustibles',
    gasoline: 'Gasolina',
    diesel: 'Diésel',
    electric: 'Eléctrico',
    hybrid: 'Híbrido',
    pluginHybrid: 'Híbrido enchufable',
    minPrice: 'Precio mín',
    maxPrice: 'Precio máx',
    minPricePlaceholder: '$ Mín',
    maxPricePlaceholder: '$ Máx',
    minYear: 'Año mín',
    maxYear: 'Año máx',
    from: 'Desde',
    to: 'Hasta',
    applyFilters: 'Aplicar filtros',
    noVehiclesTitle: 'No se encontraron vehículos',
    noVehiclesMessage: 'Intente ajustar sus filtros o términos de búsqueda',
    requestVehicle: 'Solicitar un vehículo',
    requestVehicleMessage: '¿No encuentra lo que busca?',
    loading: 'Cargando vehículos...',
    mileage: 'Kilometraje',
    fuel: 'Combustible',
    trans: 'Trans.',
    color: 'Color',
    custom: 'Personalizado',
    price: 'Precio',
    view: 'Ver',
    photos: 'fotos'
  }
};

export default function VehiclesPage() {
  const { settings, getThemeColors } = useSiteSettings();
  const themeColors = getThemeColors();
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
  const t = translations[language];

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
          <p className="text-gray-600">{t.loading}</p>
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
              placeholder={t.searchPlaceholder}
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
            <span>{t.filters}</span>
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
                {t.clearAll}
              </button>
            )}
            
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">{t.sortBy}</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="price-asc">{t.priceLowHigh}</option>
                <option value="price-desc">{t.priceHighLow}</option>
                <option value="year-desc">{t.yearNewest}</option>
                <option value="year-asc">{t.yearOldest}</option>
                <option value="make-asc">{t.makeAZ}</option>
                <option value="odometer-asc">{t.mileageLowHigh}</option>
              </select>
            </div>
          </div>
          
          <span className="text-sm text-gray-600">
            {filteredVehicles.length} {filteredVehicles.length === 1 ? t.vehicle : t.vehicles} {t.found}
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
                <h3 className="text-lg font-semibold">{t.filters}</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.bodyType}</label>
                <select
                  value={filters.bodyType}
                  onChange={(e) => setFilters({...filters, bodyType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t.allTypes}</option>
                  {bodyTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.fuelType}</label>
                <select
                  value={filters.fuelType}
                  onChange={(e) => setFilters({...filters, fuelType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t.allFuels}</option>
                  <option value="gasoline">{t.gasoline}</option>
                  <option value="diesel">{t.diesel}</option>
                  <option value="electric">{t.electric}</option>
                  <option value="hybrid">{t.hybrid}</option>
                  <option value="plugin-hybrid">{t.pluginHybrid}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.minPrice}</label>
                <input
                  type="number"
                  placeholder={t.minPricePlaceholder}
                  value={filters.minPrice}
                  onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.maxPrice}</label>
                <input
                  type="number"
                  placeholder={t.maxPricePlaceholder}
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.minYear}</label>
                <input
                  type="number"
                  placeholder={t.from}
                  value={filters.minYear}
                  onChange={(e) => setFilters({...filters, minYear: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.maxYear}</label>
                <input
                  type="number"
                  placeholder={t.to}
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
                  {t.clearAll}
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t.applyFilters}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
{filteredVehicles.map((vehicle) => {
  // Use utility function to get all image URLs (handles both vendor URLs and Cloudflare IDs)
  const images = getAllVehicleImageUrls(vehicle.images, 'public');
  return (
                <Link 
                  key={vehicle.id} 
                  href={`/vehicles/detail?id=${vehicle.id}`}
                  className="group bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-transparent block"
                  style={{
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {/* Vehicle Image with Gradient Overlay */}
                  <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {images.length > 0 ? (
                      <>
                        <img
                          src={images[0]}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="h-20 w-20 text-gray-300" />
                      </div>
                    )}
                    
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                      {/* Body Type Badge */}
                      <div 
                        className="px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-sm"
                        style={{ backgroundColor: `${themeColors.primary}` }}
                      >
                        {vehicle.bodyType}
                      </div>
                      {/* Year Badge */}
                      <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-gray-800 shadow-lg">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {vehicle.year}
                      </div>
                    </div>

                    {/* Photo Count */}
                    {images.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-lg z-10">
                        📸 {images.length} {t.photos}
                      </div>
                    )}

                    {/* SOLD Banner */}
                    {vehicle.isSold === 1 && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-center justify-center">
                        <div className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-2xl shadow-2xl transform -rotate-12">
                          SOLD
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Vehicle Details */}
                  <div className="p-6">
                    {/* Title */}
                    <h2 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-current transition-colors"
                        style={{ color: `${themeColors.primary}` }}>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h2>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {/* Odometer */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                             style={{ backgroundColor: `${themeColors.accent}15` }}>
                          <Gauge className="h-4 w-4" style={{ color: themeColors.accent }} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">{t.mileage}</p>
                          <p className="font-semibold text-gray-700">{vehicle.odometer.toLocaleString()} km</p>
                        </div>
                      </div>

                      {/* Fuel Type */}
                      {vehicle.fuelType && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                               style={{ backgroundColor: `${themeColors.accent}15` }}>
                            <Fuel className="h-4 w-4" style={{ color: themeColors.accent }} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 font-medium">{t.fuel}</p>
                            <p className="font-semibold text-gray-700">{vehicle.fuelType}</p>
                          </div>
                        </div>
                      )}

                      {/* Transmission */}
                      {vehicle.transmission && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                               style={{ backgroundColor: `${themeColors.accent}15` }}>
                            <Settings2 className="h-4 w-4" style={{ color: themeColors.accent }} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 font-medium">{t.trans}</p>
                            <p className="font-semibold text-gray-700">{vehicle.transmission}</p>
                          </div>
                        </div>
                      )}

                      {/* Color */}
                      {vehicle.color && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200">
                            {vehicle.color.startsWith('#') ? (
                              <div 
                                className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
                                style={{ backgroundColor: vehicle.color }}
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-gray-300"></div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 font-medium">{t.color}</p>
                            <p className="font-semibold text-gray-700 capitalize">
                              {vehicle.color.startsWith('#') ? t.custom : vehicle.color}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-4"></div>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">{t.price}</p>
                        <p className="text-3xl font-bold" style={{ color: themeColors.primary }}>
                          ${vehicle.price.toLocaleString()}
                        </p>
                      </div>
                      <div 
                        className="px-5 py-2.5 rounded-xl font-semibold text-white flex items-center gap-2 group-hover:gap-3 transition-all shadow-md group-hover:shadow-lg"
                        style={{ backgroundColor: themeColors.accent }}
                      >
                        {t.view}
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
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
