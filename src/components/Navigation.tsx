'use client';

import Link from 'next/link';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useEffect, useState } from 'react';
import { Phone, Zap, Globe, LayoutDashboard } from 'lucide-react';

export default function Navigation() {
  const { settings, getThemeColors } = useSiteSettings();
  const [mounted, setMounted] = useState(false);
  const [currentLang, setCurrentLang] = useState<'en' | 'fr' | 'es'>('en');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const themeColors = getThemeColors();

  useEffect(() => {
    setMounted(true);
    const storedLang = localStorage.getItem('language') as 'en' | 'fr' | 'es';
    if (storedLang) {
      setCurrentLang(storedLang);
    }
    
    // Check if user is logged in
    const checkLoginStatus = () => {
      const token = localStorage.getItem('auth_token');
      setIsLoggedIn(!!token);
    };
    
    checkLoginStatus();
    
    // Listen for storage changes (login/logout events)
    window.addEventListener('storage', checkLoginStatus);
    
    // Custom event for login
    const handleLoginEvent = () => checkLoginStatus();
    window.addEventListener('userLoggedIn', handleLoginEvent);
    
    // Check login status on focus (when user returns to tab or navigates)
    const handleFocus = () => checkLoginStatus();
    window.addEventListener('focus', handleFocus);
    
    // Check periodically in case of navigation from admin
    const interval = setInterval(checkLoginStatus, 1000);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
      window.removeEventListener('userLoggedIn', handleLoginEvent);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const changeLang = (lang: 'en' | 'fr' | 'es') => {
    setCurrentLang(lang);
    localStorage.setItem('language', lang);
    setShowLangDropdown(false);
    // Trigger a re-render of components that use language
    window.dispatchEvent(new Event('languageChange'));
  };

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3">
            {settings.logo && (
              <img 
                src={settings.logo} 
                alt={settings.siteName} 
                className="h-10 w-auto object-contain"
              />
            )}
            <span 
              className="text-xl font-bold"
              style={{ color: themeColors.primary }}
            >
              {settings.siteName}
            </span>
          </Link>
          
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:opacity-80 transition"
                 style={{ color: themeColors.headerText }}>
              Home
            </Link>
            <Link href="/vehicles" className="text-gray-700 hover:opacity-80 transition"
                 style={{ color: themeColors.headerText }}>
              Vehicles
            </Link>
            <Link href="/vehicles?fuelType=electric" 
                 className="flex items-center space-x-1 text-gray-700 hover:opacity-80 transition"
                 style={{ color: themeColors.accent }}>
              <Zap className="h-4 w-4" />
              <span>Electric</span>
            </Link>
            <Link href="/about" className="text-gray-700 hover:opacity-80 transition"
                 style={{ color: themeColors.headerText }}>
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:opacity-80 transition"
                 style={{ color: themeColors.headerText }}>
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
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      currentLang === 'es' ? 'font-semibold' : ''
                    }`}
                  >
                    Español
                  </button>
                </div>
              )}
            </div>
            
            {/* Dashboard Link (Only for logged-in users) */}
            {isLoggedIn && (
              <Link
                href="/admin"
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold transition hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            )}
            
            {/* CTA Button */}
            <a
              href={`tel:${settings.contactPhone}`}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-semibold transition hover:opacity-90"
              style={{ backgroundColor: themeColors.accent }}
            >
              <Phone className="h-4 w-4" />
              <span>{settings.contactPhone}</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
