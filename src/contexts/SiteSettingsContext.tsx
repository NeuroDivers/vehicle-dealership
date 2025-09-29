'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SiteSettings {
  siteName: string;
  logo: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  businessHours: {
    [key: string]: {
      en: string;
      fr: string;
      es: string;
    };
  };
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    linkedin?: string;
  };
  copyright: {
    en: string;
    fr: string;
    es: string;
  };
  themeColors: {
    primary: string;
    secondary: string;
    accent: string;
    headerText?: string;
  };
}

const defaultSettings: SiteSettings = {
  siteName: 'Premium Auto Sales',
  logo: '',
  contactEmail: 'info@dealership.com',
  contactPhone: '555-0123',
  address: '123 Main Street',
  city: 'City',
  province: 'Province',
  postalCode: '12345',
  country: 'Canada',
  businessHours: {
    monday: { en: '9:00 AM - 6:00 PM', fr: '9h00 - 18h00', es: '9:00 AM - 6:00 PM' },
    tuesday: { en: '9:00 AM - 6:00 PM', fr: '9h00 - 18h00', es: '9:00 AM - 6:00 PM' },
    wednesday: { en: '9:00 AM - 6:00 PM', fr: '9h00 - 18h00', es: '9:00 AM - 6:00 PM' },
    thursday: { en: '9:00 AM - 6:00 PM', fr: '9h00 - 18h00', es: '9:00 AM - 6:00 PM' },
    friday: { en: '9:00 AM - 6:00 PM', fr: '9h00 - 18h00', es: '9:00 AM - 6:00 PM' },
    saturday: { en: '10:00 AM - 4:00 PM', fr: '10h00 - 16h00', es: '10:00 AM - 4:00 PM' },
    sunday: { en: 'Closed', fr: 'Fermé', es: 'Cerrado' }
  },
  socialMedia: {},
  copyright: {
    en: '© 2024 Premium Auto Sales. All rights reserved.',
    fr: '© 2024 Premium Auto Sales. Tous droits réservés.',
    es: '© 2024 Premium Auto Sales. Todos los derechos reservados.'
  },
  themeColors: {
    primary: '#2563eb', // blue-600
    secondary: '#1e3a8a', // blue-900
    accent: '#3b82f6', // blue-500
    headerText: '#000000' // black for header text
  }
};

const SiteSettingsContext = createContext<{
  settings: SiteSettings;
  updateSettings: (settings: SiteSettings) => void;
  getThemeColors: () => {
    primary: string;
    secondary: string;
    accent: string;
    headerText: string;
  };
}>({
  settings: defaultSettings,
  updateSettings: () => {},
  getThemeColors: () => ({ primary: '', secondary: '', accent: '', headerText: '' })
});

export const useSiteSettings = () => useContext(SiteSettingsContext);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    // Load settings from localStorage
    const stored = localStorage.getItem('siteInfo');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Migrate old format to new format if needed
        if (!parsed.themeColors && parsed.themeColor) {
          // Old format had themeColor as a string
          const colorMap: any = {
            blue: { primary: '#2563eb', secondary: '#1e3a8a', accent: '#3b82f6' },
            red: { primary: '#dc2626', secondary: '#991b1b', accent: '#ef4444' },
            green: { primary: '#16a34a', secondary: '#15803d', accent: '#22c55e' },
            purple: { primary: '#9333ea', secondary: '#6b21a8', accent: '#a855f7' }
          };
          parsed.themeColors = colorMap[parsed.themeColor] || colorMap.blue;
          delete parsed.themeColor;
        } else if (!parsed.themeColors) {
          // No theme colors at all, use defaults
          parsed.themeColors = {
            primary: '#2563eb',
            secondary: '#1e3a8a',
            accent: '#3b82f6'
          };
        }
        setSettings(parsed);
        // Save migrated version back to localStorage
        localStorage.setItem('siteInfo', JSON.stringify(parsed));
      } catch (e) {
        console.error('Failed to parse site settings:', e);
      }
    }
  }, []);

  const updateSettings = (newSettings: SiteSettings) => {
    setSettings(newSettings);
    localStorage.setItem('siteInfo', JSON.stringify(newSettings));
  };

  const getThemeColors = () => {
    // Return the custom colors with fallbacks
    return {
      primary: settings.themeColors?.primary || '#2563eb',
      secondary: settings.themeColors?.secondary || '#1e3a8a',
      accent: settings.themeColors?.accent || '#3b82f6',
      headerText: settings.themeColors?.headerText || '#000000'
    };
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, updateSettings, getThemeColors }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}
