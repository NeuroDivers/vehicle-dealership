'use client';

import Link from 'next/link';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useEffect, useState } from 'react';
import { Phone, Zap, Globe, Menu, X, LayoutDashboard } from 'lucide-react';

export default function NavigationMobile() {
  const { settings, getThemeColors } = useSiteSettings();
  const [mounted, setMounted] = useState(false);
  const [currentLang, setCurrentLang] = useState<'en' | 'fr' | 'es'>('fr');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const themeColors = getThemeColors();

  useEffect(() => {
    setMounted(true);
    const storedLang = localStorage.getItem('language') as 'en' | 'fr' | 'es';
    if (storedLang) {
      setCurrentLang(storedLang);
    } else {
      localStorage.setItem('language', 'fr'); // Set French as default
    }

    // Check if user is logged in
    const checkLoginStatus = () => {
      const token = localStorage.getItem('auth_token');
      setIsLoggedIn(!!token);
    };
    
    checkLoginStatus();

    // Listen for language changes from other components (like footer)
    const handleLanguageChange = () => {
      const newLang = localStorage.getItem('language') as 'en' | 'fr' | 'es';
      if (newLang && newLang !== currentLang) {
        setCurrentLang(newLang);
      }
    };
    
    // Listen for login/logout events
    window.addEventListener('storage', checkLoginStatus);
    window.addEventListener('userLoggedIn', checkLoginStatus);
    window.addEventListener('languageChange', handleLanguageChange);
    const interval = setInterval(checkLoginStatus, 500);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
      window.removeEventListener('userLoggedIn', checkLoginStatus);
      window.removeEventListener('languageChange', handleLanguageChange);
      clearInterval(interval);
    };
  }, [currentLang]);

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
              {/* Main Navigation Links */}
              <Link href="/" className="hover:opacity-80 transition"
                   style={{ color: themeColors.headerText || '#000' }}>
                Home
              </Link>
              <Link href="/vehicles" className="hover:opacity-80 transition"
                   style={{ color: themeColors.headerText || '#000' }}>
                Vehicles
              </Link>
              {settings.showElectricVehiclesLink !== false && (
                <Link href="/vehicles?fuelType=electric" 
                     className="flex items-center space-x-1 hover:opacity-80 transition"
                     style={{ color: themeColors.accent }}>
                  <Zap className="h-4 w-4" />
                  <span>Electric</span>
                </Link>
              )}
              <Link href="/contact" className="hover:opacity-80 transition"
                   style={{ color: themeColors.headerText || '#000' }}>
                Contact
              </Link>
              
              {/* Divider */}
              <div className="h-6 w-px bg-gray-300"></div>
              
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
              
              {/* Dashboard Button (Desktop) - Only for logged in users */}
              {isLoggedIn && (
                <Link
                  href="/admin"
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold transition hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              )}
              
              {/* CTA Buttons */}
              <Link
                href="/contact?type=preapproval"
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg font-semibold text-white transition-all hover:shadow-lg hover:scale-105"
                style={{ backgroundColor: themeColors.accent }}
              >
                <span>Get Pre-Approved</span>
              </Link>
              
              <a href={`tel:${settings.contactPhone}`} 
                 className="flex items-center space-x-2 px-4 py-2.5 rounded-lg font-semibold transition hover:shadow-lg"
                 style={{ backgroundColor: themeColors.primary, color: 'white' }}>
                <Phone className="h-4 w-4" />
                <span>{settings.contactPhone}</span>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
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
              {/* Main Navigation Links */}
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
              {settings.showElectricVehiclesLink !== false && (
                <Link 
                  href="/vehicles?fuelType=electric" 
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition font-medium"
                  style={{ color: themeColors.accent }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Zap className="h-4 w-4" />
                  <span>Electric Vehicles</span>
                </Link>
              )}
              <Link 
                href="/contact" 
                className="block px-3 py-2 rounded-lg hover:bg-gray-100 transition font-medium"
                style={{ color: themeColors.headerText || '#000' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
              
              {/* Dashboard Button (Mobile) - Only for logged in users */}
              {isLoggedIn && (
                <Link
                  href="/admin"
                  className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold transition hover:from-green-700 hover:to-emerald-700 shadow-md mt-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              )}
              
              {/* CTA Buttons Section */}
              <div className="border-t pt-3 mt-3 space-y-2">
                {/* Get Pre-Approved CTA Button */}
                <Link
                  href="/contact?type=preapproval"
                  className="block text-center px-4 py-3 rounded-lg font-semibold text-white transition-all shadow-md hover:shadow-lg"
                  style={{ backgroundColor: themeColors.accent }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  🎯 Get Pre-Approved
                </Link>
                
                {/* Phone CTA Button */}
                <a 
                  href={`tel:${settings.contactPhone}`} 
                  className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white font-semibold transition-all shadow-md hover:shadow-lg"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  <Phone className="h-5 w-5" />
                  <span>Call {settings.contactPhone}</span>
                </a>
              </div>
              
              {/* Language Selector for Mobile */}
              <div className="border-t pt-3 mt-3">
                <div className="px-3 py-2 text-sm font-medium text-gray-600">Language</div>
                <div className="flex space-x-2 px-3">
                  <button
                    onClick={() => changeLang('en')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      currentLang === 'en' 
                        ? 'text-white shadow-md' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    style={currentLang === 'en' ? { backgroundColor: themeColors.primary } : {}}
                  >
                    English
                  </button>
                  <button
                    onClick={() => changeLang('fr')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      currentLang === 'fr' 
                        ? 'text-white shadow-md' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    style={currentLang === 'fr' ? { backgroundColor: themeColors.primary } : {}}
                  >
                    Français
                  </button>
                  <button
                    onClick={() => changeLang('es')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      currentLang === 'es' 
                        ? 'text-white shadow-md' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    style={currentLang === 'es' ? { backgroundColor: themeColors.primary } : {}}
                  >
                    Español
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
