'use client';

import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useEffect, useState } from 'react';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const { settings, getThemeColors } = useSiteSettings();
  const [mounted, setMounted] = useState(false);
  const [currentLang, setCurrentLang] = useState<'en' | 'fr' | 'es'>('en');
  const themeColors = getThemeColors();

  useEffect(() => {
    setMounted(true);
    // Get language from localStorage or browser
    const storedLang = localStorage.getItem('language') as 'en' | 'fr' | 'es';
    if (storedLang) {
      setCurrentLang(storedLang);
    }
  }, []);

  if (!mounted) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const copyright = settings.copyright[currentLang]
    .replace('2024', currentYear.toString())
    .replace('(c)', '©');

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              {settings.logo && (
                <img 
                  src={settings.logo} 
                  alt={settings.siteName} 
                  className="h-8 w-auto object-contain brightness-0 invert"
                />
              )}
              <h3 className="text-xl font-bold">{settings.siteName}</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" style={{ color: themeColors.accent }} />
                <span>{settings.address}, {settings.city}, {settings.province} {settings.postalCode}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" style={{ color: themeColors.accent }} />
                <a href={`tel:${settings.contactPhone}`} className="hover:text-white transition">
                  {settings.contactPhone}
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" style={{ color: themeColors.accent }} />
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-white transition">
                  {settings.contactEmail}
                </a>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: themeColors.accent }}>
              {currentLang === 'fr' ? 'Heures d\'ouverture' : 
               currentLang === 'es' ? 'Horario de atención' : 
               'Business Hours'}
            </h3>
            <div className="space-y-1 text-sm text-gray-200">
              {Object.entries(settings.businessHours).map(([day, hours]) => (
                <div key={day} className="flex justify-between">
                  <span className="capitalize">{day}:</span>
                  <span>{hours[currentLang]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Social Media & Language */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: themeColors.accent }}>
              {currentLang === 'fr' ? 'Suivez-nous' : 
               currentLang === 'es' ? 'Síguenos' : 
               'Follow Us'}
            </h3>
            <div className="flex space-x-4 mb-6">
              {settings.socialMedia.facebook && (
                <a href={settings.socialMedia.facebook} target="_blank" rel="noopener noreferrer" 
                   className="hover:opacity-75 transition">
                  <Facebook className="h-6 w-6" />
                </a>
              )}
              {settings.socialMedia.instagram && (
                <a href={settings.socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                   className="hover:opacity-75 transition">
                  <Instagram className="h-6 w-6" />
                </a>
              )}
              {settings.socialMedia.twitter && (
                <a href={settings.socialMedia.twitter} target="_blank" rel="noopener noreferrer"
                   className="hover:opacity-75 transition">
                  <Twitter className="h-6 w-6" />
                </a>
              )}
              {settings.socialMedia.youtube && (
                <a href={settings.socialMedia.youtube} target="_blank" rel="noopener noreferrer"
                   className="hover:opacity-75 transition">
                  <Youtube className="h-6 w-6" />
                </a>
              )}
              {settings.socialMedia.linkedin && (
                <a href={settings.socialMedia.linkedin} target="_blank" rel="noopener noreferrer"
                   className="hover:opacity-75 transition">
                  <Linkedin className="h-6 w-6" />
                </a>
              )}
            </div>

            {/* Language Selector */}
            <div className="flex space-x-2">
              {(['en', 'fr', 'es'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => {
                    setCurrentLang(lang);
                    localStorage.setItem('language', lang);
                  }}
                  className={`px-3 py-1 rounded text-sm transition ${
                    currentLang === lang 
                      ? 'text-white' 
                      : 'bg-gray-800 text-gray-200 hover:text-white'
                  }`}
                  style={currentLang === lang ? { backgroundColor: themeColors.primary } : {}}
                >
                  {lang === 'en' ? 'EN' : lang === 'fr' ? 'FR' : 'ES'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-400">
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
