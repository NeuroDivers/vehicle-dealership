'use client';

import Link from 'next/link';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useEffect, useState } from 'react';

export default function Navigation() {
  const { settings, getThemeColors } = useSiteSettings();
  const [mounted, setMounted] = useState(false);
  const themeColors = getThemeColors();

  useEffect(() => {
    setMounted(true);
  }, []);

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
          
          <div className="flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 transition">
              Home
            </Link>
            <Link href="/vehicles" className="text-gray-700 hover:text-blue-600 transition">
              Vehicles
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 transition">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 transition">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
