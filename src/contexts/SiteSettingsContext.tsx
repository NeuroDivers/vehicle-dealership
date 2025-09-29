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
  themeColor: 'blue' | 'red' | 'green' | 'purple';
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
  themeColor: 'blue'
};

const SiteSettingsContext = createContext<{
  settings: SiteSettings;
  updateSettings: (settings: SiteSettings) => void;
  getThemeColors: () => {
    primary: string;
    secondary: string;
    accent: string;
  };
}>({
  settings: defaultSettings,
  updateSettings: () => {},
  getThemeColors: () => ({ primary: '', secondary: '', accent: '' })
});

export const useSiteSettings = () => useContext(SiteSettingsContext);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    // Load settings from localStorage
    const stored = localStorage.getItem('siteInfo');
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
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
    const themes = {
      blue: {
        primary: 'rgb(37, 99, 235)', // blue-600
        secondary: 'rgb(30, 64, 175)', // blue-800
        accent: 'rgb(59, 130, 246)' // blue-500
      },
      red: {
        primary: 'rgb(220, 38, 38)', // red-600
        secondary: 'rgb(153, 27, 27)', // red-800
        accent: 'rgb(239, 68, 68)' // red-500
      },
      green: {
        primary: 'rgb(22, 163, 74)', // green-600
        secondary: 'rgb(21, 128, 61)', // green-800
        accent: 'rgb(34, 197, 94)' // green-500
      },
      purple: {
        primary: 'rgb(147, 51, 234)', // purple-600
        secondary: 'rgb(107, 33, 168)', // purple-800
        accent: 'rgb(168, 85, 247)' // purple-500
      }
    };

    return themes[settings.themeColor] || themes.blue;
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, updateSettings, getThemeColors }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}
