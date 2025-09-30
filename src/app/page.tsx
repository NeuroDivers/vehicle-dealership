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
  const themeColors = getThemeColors();
  const t = translations[language];

  useEffect(() => {
    setMounted(true);
    loadFeaturedVehicles();
    
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

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/vehicles?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/vehicles');
    }
  };

  if (!mounted) {
    return null;
  }


  const testimonials = [
    { name: 'John D.', rating: 5, text: 'Excellent service! Found my dream car at a great price.' },
    { name: 'Sarah M.', rating: 5, text: 'Professional staff and hassle-free experience. Highly recommend!' },
    { name: 'Mike R.', rating: 5, text: 'Best dealership in town. They really care about their customers.' },
  ];

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
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-2 flex">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-3 text-gray-800 outline-none"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-3 rounded-md font-semibold transition flex items-center space-x-2"
              style={{ backgroundColor: themeColors.primary, color: 'white' }}
            >
              <Search className="h-5 w-5" />
              <span>{t.searchButton}</span>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div>
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm opacity-75">{t.vehiclesInStock}</div>
            </div>
            <div>
              <div className="text-3xl font-bold">15+</div>
              <div className="text-sm opacity-75">{t.yearsOfService}</div>
            </div>
            <div>
              <div className="text-3xl font-bold">10,000+</div>
              <div className="text-sm opacity-75">{t.happyCustomers}</div>
            </div>
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
              const firstImage = images[0] || '/api/placeholder/400/300';
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
                    href={`/vehicles/${vehicle.id}`}
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
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: themeColors.primary }}>
              What Our Customers Say
            </h2>
            <p className="text-gray-600">Real reviews from real customers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" style={{ color: themeColors.accent }} />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
                <p className="font-semibold">- {testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
