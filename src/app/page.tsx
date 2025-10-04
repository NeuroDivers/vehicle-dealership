'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Search, Phone, MapPin, Clock, ChevronRight, Star, Shield, Award, Car } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  images?: string;
  bodyType: string;
  isSold: number;
  odometer?: number;
}

const translations = {
  fr: {
    welcome: 'Bienvenue chez',
    tagline: 'Votre partenaire de confiance pour trouver le véhicule parfait',
    searchPlaceholder: 'Rechercher par marque, modèle ou type...',
    searchButton: 'Rechercher',
    vehiclesInStock: 'Véhicules en stock',
    yearsOfService: 'Années de service',
    happyCustomers: 'Clients satisfaits',
    featuredVehicles: 'Véhicules en vedette',
    featuredSubtitle: 'Découvrez notre sélection triée sur le volet',
    viewDetails: 'Voir les détails',
    whyChooseUs: 'Pourquoi nous choisir',
    whyChooseSubtitle: 'Votre satisfaction est notre priorité',
    qualityVehicles: 'Véhicules de qualité',
    qualityDesc: 'Chaque véhicule est inspecté et certifié',
    bestPrices: 'Meilleurs prix',
    bestPricesDesc: 'Prix compétitifs et options de financement',
    expertTeam: 'Équipe experte',
    expertTeamDesc: 'Personnel professionnel et expérimenté',
    testimonials: 'Témoignages',
    testimonialsSubtitle: 'Ce que disent nos clients',
    viewAllVehicles: 'Voir tous les véhicules'
  },
  en: {
    welcome: 'Welcome to',
    tagline: 'Your Trusted Partner in Finding the Perfect Vehicle',
    searchPlaceholder: 'Search by make, model, or type...',
    searchButton: 'Search',
    vehiclesInStock: 'Vehicles in Stock',
    yearsOfService: 'Years of Service',
    happyCustomers: 'Happy Customers',
    featuredVehicles: 'Featured Vehicles',
    featuredSubtitle: 'Check out our hand-picked selection',
    viewDetails: 'View Details',
    whyChooseUs: 'Why Choose Us',
    whyChooseSubtitle: 'Your satisfaction is our priority',
    qualityVehicles: 'Quality Vehicles',
    qualityDesc: 'Every vehicle is inspected and certified',
    bestPrices: 'Best Prices',
    bestPricesDesc: 'Competitive pricing and financing options',
    expertTeam: 'Expert Team',
    expertTeamDesc: 'Professional and experienced staff',
    testimonials: 'Testimonials',
    testimonialsSubtitle: 'What our customers say',
    viewAllVehicles: 'View All Vehicles'
  },
  es: {
    welcome: 'Bienvenido a',
    tagline: 'Su socio de confianza para encontrar el vehículo perfecto',
    searchPlaceholder: 'Buscar por marca, modelo o tipo...',
    searchButton: 'Buscar',
    vehiclesInStock: 'Vehículos en stock',
    yearsOfService: 'Años de servicio',
    happyCustomers: 'Clientes satisfechos',
    featuredVehicles: 'Vehículos destacados',
    featuredSubtitle: 'Vea nuestra selección cuidadosamente elegida',
    viewDetails: 'Ver detalles',
    whyChooseUs: 'Por qué elegirnos',
    whyChooseSubtitle: 'Su satisfacción es nuestra prioridad',
    qualityVehicles: 'Vehículos de calidad',
    qualityDesc: 'Cada vehículo es inspeccionado y certificado',
    bestPrices: 'Mejores precios',
    bestPricesDesc: 'Precios competitivos y opciones de financiamiento',
    expertTeam: 'Equipo experto',
    expertTeamDesc: 'Personal profesional y experimentado',
    testimonials: 'Testimonios',
    testimonialsSubtitle: 'Lo que dicen nuestros clientes',
    viewAllVehicles: 'Ver todos los vehículos'
  }
};

export default function Home() {
  const { settings, getThemeColors } = useSiteSettings();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState<'fr' | 'en' | 'es'>('fr'); // French by default
  const [featuredVehicles, setFeaturedVehicles] = useState<Vehicle[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [carouselVehicles, setCarouselVehicles] = useState<{[key: string]: Vehicle[]}>({
    suv: [],
    sedan: [],
    truck: []
  });
  const [activeCategory, setActiveCategory] = useState<'suv' | 'sedan' | 'truck'>('suv');
  const themeColors = getThemeColors();
  const t = translations[language];

  useEffect(() => {
    setMounted(true);
    loadFeaturedVehicles();
    loadTestimonials();
    loadCarouselVehicles();
    
    // Get initial language from localStorage (set by header)
    const storedLang = localStorage.getItem('language') as 'fr' | 'en' | 'es';
    if (storedLang) {
      setLanguage(storedLang);
    }
    
    // Listen for language changes from header
    const handleLanguageChange = () => {
      const newLang = localStorage.getItem('language') as 'fr' | 'en' | 'es';
      if (newLang) {
        setLanguage(newLang);
      }
    };
    
    window.addEventListener('languageChange', handleLanguageChange);
    return () => window.removeEventListener('languageChange', handleLanguageChange);
  }, []);

  const loadTestimonials = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://vehicle-dealership-api.nick-damato0011527.workers.dev';
      const response = await fetch(`${apiUrl}/api/reviews/featured`);
      if (response.ok) {
        const data = await response.json();
        setTestimonials(data);
      }
    } catch (error) {
      console.error('Failed to load testimonials:', error);
    }
  };

  const loadCarouselVehicles = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://vehicle-dealership-api.nick-damato0011527.workers.dev';
      const response = await fetch(`${apiUrl}/api/vehicles`);
      if (response.ok) {
        const data = await response.json();
        const available = data.filter((v: Vehicle) => v.isSold === 0);
        
        // Group by body type
        const suv = available.filter((v: Vehicle) => v.bodyType === 'SUV').slice(0, 6);
        const sedan = available.filter((v: Vehicle) => v.bodyType === 'Sedan').slice(0, 6);
        const truck = available.filter((v: Vehicle) => v.bodyType === 'Truck').slice(0, 6);
        
        setCarouselVehicles({ suv, sedan, truck });
      }
    } catch (error) {
      console.error('Failed to load carousel vehicles:', error);
    }
  };

  const loadFeaturedVehicles = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://vehicle-dealership-api.nick-damato0011527.workers.dev';
      const response = await fetch(`${apiUrl}/api/vehicles?limit=6`);
      if (response.ok) {
        const data = await response.json();
        // Filter out sold vehicles
        const available = data.filter((v: Vehicle) => v.isSold === 0).slice(0, 3);
        setFeaturedVehicles(available);
      }
    } catch (error) {
      console.error('Failed to load featured vehicles:', error);
    }
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    
    // Track search query
    if (query) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://vehicle-dealership-api.nick-damato0011527.workers.dev'}/api/analytics/track-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query,
            source: 'homepage',
            url: window.location.href,
            user_agent: navigator.userAgent
          })
        });
      } catch (error) {
        console.error('Failed to track search:', error);
        // Don't block the search if tracking fails
      }
      
      router.push(`/vehicles?search=${encodeURIComponent(query)}`);
    } else {
      router.push('/vehicles');
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative h-[600px] flex items-center justify-center text-white"
        style={{
          background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            {t.welcome} {settings.siteName}
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            {t.tagline}
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-2 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-3 text-gray-800 outline-none rounded min-w-0"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 rounded-md font-semibold transition flex items-center justify-center space-x-2 whitespace-nowrap"
              style={{ backgroundColor: themeColors.primary, color: 'white' }}
            >
              <Search className="h-5 w-5" />
              <span className="hidden sm:inline">{t.searchButton}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Featured Vehicles */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: themeColors.primary }}>
              {t.featuredVehicles}
            </h2>
            <p className="text-gray-600">{t.featuredSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredVehicles.length === 0 && (
              <div className="col-span-3 text-center py-12">
                <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {language === 'fr' ? 'Aucun véhicule disponible pour le moment' :
                   language === 'es' ? 'No hay vehículos disponibles en este momento' :
                   'No vehicles available at the moment'}
                </p>
              </div>
            )}
            {featuredVehicles.map((vehicle) => {
              let images = [];
              try {
                images = vehicle.images ? (typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images) : [];
              } catch (e) {
                console.error('Error parsing images:', e);
                images = [];
              }
              let firstImage = images[0] || '/api/placeholder/400/300';
              
              // Use thumbnail variant for Cloudflare Images (300x300 optimized)
              if (firstImage && firstImage.includes('imagedelivery.net')) {
                firstImage = firstImage.replace('/public', '/thumbnail');
              }
              
              return (
              <div key={vehicle.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                <div className="h-48 bg-gray-200 relative">
                  {firstImage !== '/api/placeholder/400/300' ? (
                    <img src={firstImage} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover" />
                  ) : (
                    <Car className="h-full w-full p-12 text-gray-400" />
                  )}
                  <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold"
                       style={{ color: themeColors.primary }}>
                    {vehicle.bodyType}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                  <div className="text-2xl font-bold mb-4" style={{ color: themeColors.primary }}>
                    ${vehicle.price.toLocaleString()}
                  </div>
                  <Link
                    href={`/vehicles/detail?id=${vehicle.id}`}
                    className="block text-center py-2 rounded-md transition"
                    style={{ 
                      backgroundColor: themeColors.accent,
                      color: 'white'
                    }}
                  >
                    {t.viewDetails}
                  </Link>
                </div>
              </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/vehicles"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition"
              style={{ 
                backgroundColor: themeColors.primary,
                color: 'white'
              }}
            >
              <span>View All Inventory</span>
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Vehicle Carousel by Category */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4" style={{ color: themeColors.primary }}>
              {language === 'fr' ? 'Explorez par catégorie' : 
               language === 'es' ? 'Explorar por categoría' : 
               'Explore by Category'}
            </h2>
            <p className="text-gray-600">
              {language === 'fr' ? 'Trouvez le véhicule parfait pour votre style de vie' : 
               language === 'es' ? 'Encuentra el vehículo perfecto para tu estilo de vida' : 
               'Find the perfect vehicle for your lifestyle'}
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex justify-center space-x-4 mb-8">
            {[
              { key: 'suv' as const, label: { fr: 'VUS', en: 'SUVs', es: 'SUVs' } },
              { key: 'sedan' as const, label: { fr: 'Berlines', en: 'Sedans', es: 'Sedanes' } },
              { key: 'truck' as const, label: { fr: 'Camions', en: 'Trucks', es: 'Camionetas' } }
            ].map((category) => (
              <button
                key={category.key}
                onClick={() => setActiveCategory(category.key)}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  activeCategory === category.key
                    ? 'text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={activeCategory === category.key ? { backgroundColor: themeColors.primary } : {}}
              >
                {category.label[language]}
              </button>
            ))}
          </div>

          {/* Vehicle Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {carouselVehicles[activeCategory].length > 0 ? (
              carouselVehicles[activeCategory].map((vehicle) => {
                let images = [];
                try {
                  images = vehicle.images ? (typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images) : [];
                } catch (e) {
                  images = [];
                }
                let firstImage = images[0] || '/api/placeholder/400/300';
                
                // Use thumbnail variant for Cloudflare Images (300x300 optimized)
                if (firstImage && firstImage.includes('imagedelivery.net')) {
                  firstImage = firstImage.replace('/public', '/thumbnail');
                }
                
                return (
                  <Link
                    key={vehicle.id}
                    href={`/vehicles/detail?id=${vehicle.id}`}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition group"
                  >
                    <div className="h-48 bg-gray-200 relative overflow-hidden">
                      {firstImage !== '/api/placeholder/400/300' ? (
                        <img 
                          src={firstImage} 
                          alt={`${vehicle.make} ${vehicle.model}`} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                        />
                      ) : (
                        <Car className="h-full w-full p-12 text-gray-400" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-2xl font-bold mb-2" style={{ color: themeColors.primary }}>
                        ${vehicle.price.toLocaleString()}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{vehicle.odometer?.toLocaleString()} km</span>
                        <span>{vehicle.bodyType}</span>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-12">
                <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {language === 'fr' ? 'Aucun véhicule disponible dans cette catégorie' : 
                   language === 'es' ? 'No hay vehículos disponibles en esta categoría' : 
                   'No vehicles available in this category'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: themeColors.primary }}>
              Why Choose {settings.siteName}?
            </h2>
            <p className="text-gray-600">We go above and beyond for our customers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                   style={{ backgroundColor: `${themeColors.accent}20` }}>
                <Shield className="h-10 w-10" style={{ color: themeColors.primary }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Certified Vehicles</h3>
              <p className="text-gray-600">All vehicles undergo thorough inspection</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                   style={{ backgroundColor: `${themeColors.accent}20` }}>
                <Award className="h-10 w-10" style={{ color: themeColors.primary }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Best Warranty</h3>
              <p className="text-gray-600">Comprehensive coverage for peace of mind</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                   style={{ backgroundColor: `${themeColors.accent}20` }}>
                <Star className="h-10 w-10" style={{ color: themeColors.primary }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">5-Star Service</h3>
              <p className="text-gray-600">Rated excellent by our customers</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                   style={{ backgroundColor: `${themeColors.accent}20` }}>
                <Phone className="h-10 w-10" style={{ color: themeColors.primary }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">Always here when you need us</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4" style={{ color: themeColors.primary }}>
                {t.testimonials}
              </h2>
              <p className="text-gray-600">{t.testimonialsSubtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.slice(0, 3).map((testimonial) => (
                <div key={testimonial.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" style={{ color: themeColors.accent }} />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.review_text}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.customer_name}</p>
                    {testimonial.location && (
                      <p className="text-sm text-gray-500">{testimonial.location}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16" style={{ backgroundColor: `${themeColors.primary}10` }}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4" style={{ color: themeColors.primary }}>
            Ready to Find Your Dream Car?
          </h2>
          <p className="text-gray-600 mb-8">Visit our showroom or browse online today</p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              href="/vehicles"
              className="px-8 py-4 rounded-lg font-semibold transition"
              style={{ 
                backgroundColor: themeColors.primary,
                color: 'white'
              }}
            >
              Browse Inventory
            </Link>
            <a
              href={`tel:${settings.contactPhone}`}
              className="px-8 py-4 rounded-lg font-semibold border-2 transition hover:bg-white"
              style={{ 
                borderColor: themeColors.primary,
                color: themeColors.primary
              }}
            >
              <Phone className="inline-block h-5 w-5 mr-2" />
              Call {settings.contactPhone}
            </a>
          </div>

          <div className="mt-8 flex flex-col md:flex-row gap-8 justify-center text-left">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 mt-1" style={{ color: themeColors.primary }} />
              <div>
                <p className="font-semibold">Visit Us</p>
                <p className="text-gray-600">{settings.address}, {settings.city}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 mt-1" style={{ color: themeColors.primary }} />
              <div>
                <p className="font-semibold">Open Today</p>
                <p className="text-gray-600">
                  {settings.businessHours[new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()]?.en || 'Check our hours'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
