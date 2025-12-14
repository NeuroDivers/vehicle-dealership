'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { Search, Phone, MapPin, Clock, ChevronRight, Star, Shield, Award, Car } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getVehicleImageUrl, isMobileDevice, getOptimalVariant } from '@/utils/imageUtils';

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
    viewAllInventory: 'Voir tout l\'inventaire',
    exploreByCategory: 'Explorez par catégorie',
    findPerfectVehicle: 'Trouvez le véhicule parfait pour votre style de vie',
    whyChooseUs: 'Pourquoi choisir',
    whyChooseSubtitle: 'Nous faisons tout notre possible pour nos clients',
    certifiedVehicles: 'Véhicules certifiés',
    certifiedVehiclesDesc: 'Tous les véhicules subissent une inspection approfondie',
    bestWarranty: 'Meilleure garantie',
    bestWarrantyDesc: 'Couverture complète pour votre tranquillité d\'esprit',
    fiveStarService: 'Service 5 étoiles',
    fiveStarServiceDesc: 'Excellente note de nos clients',
    support247: 'Support 24/7',
    support247Desc: 'Toujours là quand vous avez besoin de nous',
    qualityVehicles: 'Véhicules de qualité',
    qualityDesc: 'Chaque véhicule est inspecté et certifié',
    bestPrices: 'Meilleurs prix',
    bestPricesDesc: 'Prix compétitifs et options de financement',
    expertTeam: 'Équipe experte',
    expertTeamDesc: 'Personnel professionnel et expérimenté',
    testimonials: 'Témoignages',
    testimonialsSubtitle: 'Ce que disent nos clients',
    viewAllVehicles: 'Voir tous les véhicules',
    readyToFind: 'Prêt à trouver la voiture de vos rêves?',
    visitShowroom: 'Visitez notre salle d\'exposition ou parcourez en ligne aujourd\'hui',
    browseInventory: 'Parcourir l\'inventaire',
    call: 'Appeler',
    visitUs: 'Visitez-nous',
    openToday: 'Ouvert aujourd\'hui',
    checkOurHours: 'Vérifier nos heures'
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
    viewAllInventory: 'View All Inventory',
    exploreByCategory: 'Explore by Category',
    findPerfectVehicle: 'Find the perfect vehicle for your lifestyle',
    whyChooseUs: 'Why Choose',
    whyChooseSubtitle: 'We go above and beyond for our customers',
    certifiedVehicles: 'Certified Vehicles',
    certifiedVehiclesDesc: 'All vehicles undergo thorough inspection',
    bestWarranty: 'Best Warranty',
    bestWarrantyDesc: 'Comprehensive coverage for peace of mind',
    fiveStarService: '5-Star Service',
    fiveStarServiceDesc: 'Rated excellent by our customers',
    support247: '24/7 Support',
    support247Desc: 'Always here when you need us',
    qualityVehicles: 'Quality Vehicles',
    qualityDesc: 'Every vehicle is inspected and certified',
    bestPrices: 'Best Prices',
    bestPricesDesc: 'Competitive pricing and financing options',
    expertTeam: 'Expert Team',
    expertTeamDesc: 'Professional and experienced staff',
    testimonials: 'Testimonials',
    testimonialsSubtitle: 'What our customers say',
    viewAllVehicles: 'View All Vehicles',
    readyToFind: 'Ready to Find Your Dream Car?',
    visitShowroom: 'Visit our showroom or browse online today',
    browseInventory: 'Browse Inventory',
    call: 'Call',
    visitUs: 'Visit Us',
    openToday: 'Open Today',
    checkOurHours: 'Check our hours'
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
    viewAllInventory: 'Ver todo el inventario',
    exploreByCategory: 'Explorar por categoría',
    findPerfectVehicle: 'Encuentra el vehículo perfecto para tu estilo de vida',
    whyChooseUs: 'Por qué elegir',
    whyChooseSubtitle: 'Hacemos todo lo posible por nuestros clientes',
    certifiedVehicles: 'Vehículos certificados',
    certifiedVehiclesDesc: 'Todos los vehículos pasan por una inspección exhaustiva',
    bestWarranty: 'Mejor garantía',
    bestWarrantyDesc: 'Cobertura integral para su tranquilidad',
    fiveStarService: 'Servicio 5 estrellas',
    fiveStarServiceDesc: 'Calificado como excelente por nuestros clientes',
    support247: 'Soporte 24/7',
    support247Desc: 'Siempre aquí cuando nos necesite',
    qualityVehicles: 'Vehículos de calidad',
    qualityDesc: 'Cada vehículo es inspeccionado y certificado',
    bestPrices: 'Mejores precios',
    bestPricesDesc: 'Precios competitivos y opciones de financiamiento',
    expertTeam: 'Equipo experto',
    expertTeamDesc: 'Personal profesional y experimentado',
    testimonials: 'Testimonios',
    testimonialsSubtitle: 'Lo que dicen nuestros clientes',
    viewAllVehicles: 'Ver todos los vehículos',
    readyToFind: '¿Listo para encontrar el auto de sus sueños?',
    visitShowroom: 'Visite nuestro salón de exhibición o navegue en línea hoy',
    browseInventory: 'Explorar inventario',
    call: 'Llamar',
    visitUs: 'Visítenos',
    openToday: 'Abierto hoy',
    checkOurHours: 'Consultar nuestro horario'
  }
};

export default function Home() {
  const { settings, getThemeColors } = useSiteSettings();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState<'fr' | 'en' | 'es'>('fr'); // French by default
  const [isMobile, setIsMobile] = useState(false);
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
    
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(isMobileDevice());
    };
    checkMobile();
    
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
    
    // Optimize resize handling for mobile detection
    let resizeTimer: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkMobile, 200);
    };
    
    window.addEventListener('languageChange', handleLanguageChange);
    window.addEventListener('resize', debouncedResize);
    
    return () => {
      window.removeEventListener('languageChange', handleLanguageChange);
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  const loadTestimonials = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://autopret-api.nick-damato0011527.workers.dev';
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
      const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://autopret-api.nick-damato0011527.workers.dev';
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
      const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://autopret-api.nick-damato0011527.workers.dev';
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
    
    if (query) {
      // Track search query (don't wait for it)
      fetch(`${process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://autopret-api.nick-damato0011527.workers.dev'}/api/analytics/track-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          source: 'homepage',
          url: window.location.href,
          user_agent: navigator.userAgent,
          result_count: 0
        })
      }).catch(error => {
        console.error('Failed to track search:', error);
      });
      
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
              aria-label={t.searchButton}
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
              // Use mobile-optimized variant for better performance (380x285 on mobile)
              const optimalVariant = getOptimalVariant(isMobile, 'card');
              const firstImage = getVehicleImageUrl(vehicle.images, 0, optimalVariant);
              
              return (
              <div key={vehicle.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                <div className="h-48 bg-gray-200 relative">
                  <img 
                    src={firstImage} 
                    alt={`${vehicle.make} ${vehicle.model}`} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-vehicle.jpg';
                    }}
                  />
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
              <span>{t.viewAllInventory}</span>
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
              {t.exploreByCategory}
            </h2>
            <p className="text-gray-600">
              {t.findPerfectVehicle}
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
                // Use mobile-optimized variant for better performance (380x285 on mobile)
                const optimalVariant = getOptimalVariant(isMobile, 'card');
                const firstImage = getVehicleImageUrl(vehicle.images, 0, optimalVariant);
                
                return (
                  <Link
                    key={vehicle.id}
                    href={`/vehicles/detail?id=${vehicle.id}`}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition group"
                  >
                    <div className="h-48 bg-gray-200 relative overflow-hidden">
                      <img 
                        src={firstImage} 
                        alt={`${vehicle.make} ${vehicle.model}`} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-vehicle.jpg';
                        }}
                      />
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
              {t.whyChooseUs} {settings.siteName}?
            </h2>
            <p className="text-gray-600">{t.whyChooseSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                   style={{ backgroundColor: `${themeColors.accent}20` }}>
                <Shield className="h-10 w-10" style={{ color: themeColors.primary }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.certifiedVehicles}</h3>
              <p className="text-gray-600">{t.certifiedVehiclesDesc}</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                   style={{ backgroundColor: `${themeColors.accent}20` }}>
                <Award className="h-10 w-10" style={{ color: themeColors.primary }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.bestWarranty}</h3>
              <p className="text-gray-600">{t.bestWarrantyDesc}</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                   style={{ backgroundColor: `${themeColors.accent}20` }}>
                <Star className="h-10 w-10" style={{ color: themeColors.primary }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.fiveStarService}</h3>
              <p className="text-gray-600">{t.fiveStarServiceDesc}</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                   style={{ backgroundColor: `${themeColors.accent}20` }}>
                <Phone className="h-10 w-10" style={{ color: themeColors.primary }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.support247}</h3>
              <p className="text-gray-600">{t.support247Desc}</p>
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
            {t.readyToFind}
          </h2>
          <p className="text-gray-600 mb-8">{t.visitShowroom}</p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              href="/vehicles"
              className="px-8 py-4 rounded-lg font-semibold transition"
              style={{ 
                backgroundColor: themeColors.primary,
                color: 'white'
              }}
            >
              {t.browseInventory}
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
              {t.call} {settings.contactPhone}
            </a>
          </div>

          <div className="mt-8 flex flex-col md:flex-row gap-8 justify-center text-left">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 mt-1" style={{ color: themeColors.primary }} />
              <div>
                <p className="font-semibold">{t.visitUs}</p>
                <p className="text-gray-600">{settings.address}, {settings.city}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 mt-1" style={{ color: themeColors.primary }} />
              <div>
                <p className="font-semibold">{t.openToday}</p>
                <p className="text-gray-600">
                  {settings.businessHours[new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()]?.[language] || t.checkOurHours}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
