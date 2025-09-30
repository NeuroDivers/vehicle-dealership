'use client';

import Link from 'next/link';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useEffect, useState } from 'react';
import { Phone, Zap, Globe, Menu, X } from 'lucide-react';

export default function NavigationMobile() {
  const { settings, getThemeColors } = useSiteSettings();
  const [mounted, setMounted] = useState(false);
  const [currentLang, setCurrentLang] = useState<'en' | 'fr' | 'es'>('en');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const themeColors = getThemeColors();

  useEffect(() => {
    setMounted(true);
    const storedLang = localStorage.getItem('language') as 'en' | 'fr' | 'es';
    if (storedLang) {
      setCurrentLang(storedLang);
    }
  }, []);

  const changeLang = (lang: 'en' | 'fr' | 'es') => {
    setCurrentLang(lang);
    localStorage.setItem('language', lang);
    setShowLangDropdown(false);
    window.dispatchEvent(new Event('languageChange'));
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              {settings.logo && (
                <img 
                  src={settings.logo} 
                  alt={settings.siteName} 
                  className="h-8 sm:h-10 w-auto object-contain"
                />
              )}
              <span 
                className="text-lg sm:text-xl font-bold"
                style={{ color: themeColors.primary }}
              >
                {settings.siteName}
              </span>
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="hover:opacity-80 transition"
                   style={{ color: themeColors.headerText || '#000' }}>
                Home
              </Link>
              <Link href="/vehicles" className="hover:opacity-80 transition"
                   style={{ color: themeColors.headerText || '#000' }}>
                Vehicles
              </Link>
              <Link href="/vehicles?fuelType=electric" 
                   className="flex items-center space-x-1 hover:opacity-80 transition"
                   style={{ color: themeColors.accent }}>
                <Zap className="h-4 w-4" />
                <span>Electric</span>
              </Link>
              <Link href="/about" className="hover:opacity-80 transition"
                   style={{ color: themeColors.headerText || '#000' }}>
                About
              </Link>
              <Link href="/contact" className="hover:opacity-80 transition"
                   style={{ color: themeColors.headerText || '#000' }}>
                Contact
              </Link>
              
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="flex items-center space-x-1 px-3 py-1 rounded-lg hover:bg-gray-100 transition"
                >
                  <Globe className="h-4 w-4" style={{ color: themeColors.primary }} />
                  <span className="text-sm font-medium">
                    {currentLang.toUpperCase()}
                  </span>
                </button>
                
                {showLangDropdown && (
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border z-50">
                    <button
                      onClick={() => changeLang('en')}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        currentLang === 'en' ? 'font-semibold' : ''
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => changeLang('fr')}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        currentLang === 'fr' ? 'font-semibold' : ''
                      }`}
                    >
                      Français
                    </button>
                    <button
                      onClick={() => changeLang('es')}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-b-lg ${
                        currentLang === 'es' ? 'font-semibold' : ''
                      }`}
                    >
                      Español
                    </button>
                  </div>
                )}
              </div>
              
              <a href={`tel:${settings.contactPhone}`} 
                 className="flex items-center space-x-2 px-4 py-2 rounded-lg transition"
                 style={{ backgroundColor: themeColors.primary, color: 'white' }}>
                <Phone className="h-4 w-4" />
                <span>{settings.contactPhone}</span>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" style={{ color: themeColors.primary }} />
              ) : (
                <Menu className="h-6 w-6" style={{ color: themeColors.primary }} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-2 space-y-1">
              <Link 
                href="/" 
                className="block px-3 py-2 rounded-lg hover:bg-gray-100 transition font-medium"
                style={{ color: themeColors.headerText || '#000' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/vehicles" 
                className="block px-3 py-2 rounded-lg hover:bg-gray-100 transition font-medium"
                style={{ color: themeColors.headerText || '#000' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Vehicles
              </Link>
              <Link 
                href="/vehicles?fuelType=electric" 
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition font-medium"
                style={{ color: themeColors.accent }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Zap className="h-4 w-4" />
                <span>Electric Vehicles</span>
              </Link>
              <Link 
                href="/about" 
                className="block px-3 py-2 rounded-lg hover:bg-gray-100 transition font-medium"
                style={{ color: themeColors.headerText || '#000' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/contact" 
                className="block px-3 py-2 rounded-lg hover:bg-gray-100 transition font-medium"
                style={{ color: themeColors.headerText || '#000' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              
              {/* Language Selector for Mobile */}
              <div className="border-t pt-2 mt-2">
                <div className="px-3 py-2 text-sm text-gray-500">Language</div>
                <div className="flex space-x-2 px-3">
                  <button
                    onClick={() => changeLang('en')}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      currentLang === 'en' 
                        ? 'text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={currentLang === 'en' ? { backgroundColor: themeColors.primary } : {}}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => changeLang('fr')}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      currentLang === 'fr' 
                        ? 'text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={currentLang === 'fr' ? { backgroundColor: themeColors.primary } : {}}
                  >
                    FR
                  </button>
                  <button
                    onClick={() => changeLang('es')}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      currentLang === 'es' 
                        ? 'text-white' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    style={currentLang === 'es' ? { backgroundColor: themeColors.primary } : {}}
                  >
                    ES
                  </button>
                </div>
              </div>
              
              {/* Phone Number for Mobile */}
              <div className="border-t pt-2 mt-2">
                <a 
                  href={`tel:${settings.contactPhone}`} 
                  className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white font-medium"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  <Phone className="h-5 w-5" />
                  <span>Call {settings.contactPhone}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
