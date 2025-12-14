'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SiteSettings {
  siteName: string;
  logo: string;
  contactEmail: string;
  contactPhone: string;
  contactPhoneSecondary?: string;
  primaryPhoneForHeader?: 'primary' | 'secondary'; // Which phone to show in header CTA
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
  disclaimers?: {
    en: string;
    fr: string;
    es: string;
  };
  showVIN?: boolean; // Toggle to show/hide VIN on vehicle detail pages
  showElectricVehiclesLink?: boolean; // Toggle to show/hide Electric Vehicles link in header
}

const defaultSettings: SiteSettings = {
  siteName: 'AutoPrêt 123',
  logo: '',
  contactEmail: 'info@autopret123.com',
  contactPhone: '514-907-7738',
  contactPhoneSecondary: '',
  primaryPhoneForHeader: 'primary',
  address: '',
  city: '',
  province: '',
  postalCode: '',
  country: 'Canada',
  businessHours: {
    monday: { en: '9:00 AM - 6:00 PM', fr: '9h00 - 18h00', es: '9:00 AM - 6:00 PM' },
    tuesday: { en: '9:00 AM - 6:00 PM', fr: '9h00 - 18h00', es: '9:00 AM - 6:00 PM' },
    wednesday: { en: '9:00 AM - 6:00 PM', fr: '9h00 - 18h00', es: '9:00 AM - 6:00 PM' },
    thursday: { en: '9:00 AM - 6:00 PM', fr: '9h00 - 18h00', es: '9:00 AM - 6:00 PM' },
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
    primary: '#1f4d2f', // green-500
    secondary: '#15803d', // green-600
    accent: '#1f4d2f', // green-400
    headerText: '#000000' // black for header text
  },
  disclaimers: {
    en: "This vehicle is offered for sale subject to prior sale. All information provided is believed to be accurate but is not guaranteed. Please verify all details with our sales team.",
    fr: "Ce véhicule est offert à la vente sous réserve de vente préalable. Toutes les informations fournies sont considérées comme exactes mais ne sont pas garanties. Veuillez vérifier tous les détails avec notre équipe de vente.",
    es: "Este vehículo se ofrece a la venta sujeto a venta previa. Toda la información proporcionada se considera precisa pero no está garantizada. Por favor verifique todos los detalles con nuestro equipo de ventas."
  },
  showElectricVehiclesLink: true // Show Electric Vehicles link by default
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
  // Initialize with default settings, API will load real settings
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    // Load settings from API only
    const loadSettings = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 
                      'https://autopret-api.nick-damato0011527.workers.dev';
        const response = await fetch(`${apiUrl}/api/admin/settings`);
        
        if (response.ok) {
          const data = await response.json();
          const apiSettings = data.settings?.siteInfo || data.settings || data;
          
          if (apiSettings && (apiSettings.themeColors || apiSettings.siteName)) {
            // Set CSS variables immediately
            if (typeof document !== 'undefined' && apiSettings.themeColors) {
              document.documentElement.style.setProperty('--color-primary', apiSettings.themeColors.primary);
              document.documentElement.style.setProperty('--color-secondary', apiSettings.themeColors.secondary);
              document.documentElement.style.setProperty('--color-accent', apiSettings.themeColors.accent);
              if (apiSettings.themeColors.headerText) {
                document.documentElement.style.setProperty('--color-header-text', apiSettings.themeColors.headerText);
              }
            }
            
            setSettings(apiSettings);
          }
        }
      } catch (error) {
        console.error('Failed to load settings from API:', error);
        // Use default settings if API fails
        setSettings(defaultSettings);
      }
    };
    
    loadSettings();
  }, []);
  const updateSettings = async (newSettings: SiteSettings) => {
    setSettings(newSettings);
    
    // Save to API
    try {
      const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 
                    'https://autopret-api.nick-damato0011527.workers.dev';
      await fetch(`${apiUrl}/api/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      console.log('✓ Settings saved to database');
    } catch (error) {
      console.error('Failed to save settings to API:', error);
    }
  };

  const getThemeColors = () => {
    // Return the custom colors with fallbacks
    return {
      primary: settings.themeColors?.primary || '#1f4d2f',
      secondary: settings.themeColors?.secondary || '#15803d',
      accent: settings.themeColors?.accent || '#1f4d2f',
      headerText: settings.themeColors?.headerText || '#000000'
    };
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, updateSettings, getThemeColors }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}
