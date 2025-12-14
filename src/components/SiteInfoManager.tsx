'use client';

import { useState, useEffect, useRef } from 'react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

interface SiteInfo {
  siteName: string;
  logo: string;
  contactEmail: string;
  contactPhone: string;
  contactPhoneSecondary?: string;
  primaryPhoneForHeader?: 'primary' | 'secondary';
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
  disclaimers?: {
    en: string;
    fr: string;
    es: string;
  };
  themeColors: {
    primary: string;
    secondary: string;
    accent: string;
    headerText: string;
  };
  showVIN?: boolean;
  showElectricVehiclesLink?: boolean;
}

const defaultSiteInfo: SiteInfo = {
  siteName: 'Premium Auto Sales',
  logo: '',
  contactEmail: 'info@dealership.com',
  contactPhone: '555-0123',
  contactPhoneSecondary: '',
  primaryPhoneForHeader: 'primary',
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
  socialMedia: {
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    linkedin: ''
  },
  copyright: {
    en: '© 2024 Premium Auto Sales. All rights reserved.',
    fr: '© 2024 Premium Auto Sales. Tous droits réservés.',
    es: '© 2024 Premium Auto Sales. Todos los derechos reservados.'
  },
  disclaimers: {
    en: 'This vehicle is offered for sale subject to prior sale. All information provided is believed to be accurate but is not guaranteed. Please verify all details with our sales team.',
    fr: 'Ce véhicule est offert à la vente sous réserve de vente préalable. Toutes les informations fournies sont considérées comme exactes mais ne sont pas garanties. Veuillez vérifier tous les détails avec notre équipe de vente.',
    es: 'Este vehículo se ofrece a la venta sujeto a venta previa. Toda la información proporcionada se considera precisa pero no está garantizada. Verifique todos los detalles con nuestro equipo de ventas.'
  },
  themeColors: {
    primary: '#2563eb', // blue-600
    secondary: '#1e3a8a', // blue-900
    accent: '#3b82f6', // blue-500
    headerText: '#000000' // black for header text
  }
};

export default function SiteInfoManager() {
  const { updateSettings } = useSiteSettings();
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(defaultSiteInfo);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [activeLanguageTab, setActiveLanguageTab] = useState<'en' | 'fr' | 'es'>('en');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Auto-update copyright year
  const currentYear = new Date().getFullYear();
  const updateCopyrightYear = (text: string) => {
    return text.replace(/© \d{4}/, `© ${currentYear}`);
  };

  useEffect(() => {
    loadSiteInfo();
  }, []);

  const loadSiteInfo = async () => {
    try {
      // Load from localStorage first
      const localInfo = localStorage.getItem('siteInfo');
      if (localInfo) {
        const parsed = JSON.parse(localInfo);
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
          // Save migrated version
          localStorage.setItem('siteInfo', JSON.stringify(parsed));
        } else if (!parsed.themeColors) {
          // No theme colors at all, use defaults
          parsed.themeColors = defaultSiteInfo.themeColors;
        }
        setSiteInfo(parsed);
        setLogoPreview(parsed.logo || '');
      }

      // Try to load from API
      const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://autopret-api.nick-damato0011527.workers.dev';
      const response = await fetch(`${apiUrl}/api/admin/settings`);
      if (response.ok) {
        const data = await response.json();
        if (data.settings && data.settings.siteInfo) {
          // Apply same migration logic
          if (!data.settings.siteInfo.themeColors) {
            data.settings.siteInfo.themeColors = defaultSiteInfo.themeColors;
          }
          setSiteInfo(data.settings.siteInfo);
          setLogoPreview(data.settings.siteInfo.logo || '');
          // Save to localStorage
          localStorage.setItem('siteInfo', JSON.stringify(data.settings.siteInfo));
        }
      }
    } catch (error) {
      console.error('Failed to load site info:', error);
      // Use localStorage if available
      const localInfo = localStorage.getItem('siteInfo');
      if (localInfo) {
        const parsed = JSON.parse(localInfo);
        if (!parsed.themeColors) {
          parsed.themeColors = defaultSiteInfo.themeColors;
        }
        setSiteInfo(parsed);
        setLogoPreview(parsed.logo || '');
      }
    }
  };
  const saveSiteInfo = async () => {
    setLoading(true);
    try {
      // Always save to localStorage
      localStorage.setItem('siteInfo', JSON.stringify(siteInfo));
      
      // Update the context to trigger re-renders
      updateSettings(siteInfo as any);
      
      // Try to save to API
      const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'https://autopret-api.nick-damato0011527.workers.dev';
      const response = await fetch(`${apiUrl}/api/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteInfo })
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save site info to API:', error);
      // Still show success since localStorage worked
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setSiteInfo(prev => ({ ...prev, logo: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateBusinessHours = (day: string, lang: 'en' | 'fr' | 'es', value: string) => {
    setSiteInfo(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [lang]: value
        }
      }
    }));
  };

  const updateCopyright = (lang: 'en' | 'fr' | 'es', value: string) => {
    setSiteInfo(prev => ({
      ...prev,
      copyright: {
        ...prev.copyright,
        [lang]: value
      }
    }));
  };

  const updateSocialMedia = (platform: keyof typeof siteInfo.socialMedia, value: string) => {
    setSiteInfo(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Site Information</h2>
        <button
          onClick={saveSiteInfo}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } disabled:opacity-50`}
        >
          {loading ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      {/* Basic Information */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site Name
            </label>
            <input
              type="text"
              value={siteInfo.siteName}
              onChange={(e) => setSiteInfo(prev => ({ ...prev, siteName: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo
            </label>
            <div className="flex items-center space-x-4">
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-12 w-auto object-contain"
                />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Upload Logo
              </button>
              {logoPreview && (
                <button
                  onClick={() => {
                    setLogoPreview('');
                    setSiteInfo(prev => ({ ...prev, logo: '' }));
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={siteInfo.contactEmail}
              onChange={(e) => setSiteInfo(prev => ({ ...prev, contactEmail: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Phone
            </label>
            <input
              type="tel"
              value={siteInfo.contactPhone}
              onChange={(e) => setSiteInfo(prev => ({ ...prev, contactPhone: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secondary Phone (Optional)
            </label>
            <input
              type="tel"
              value={siteInfo.contactPhoneSecondary || ''}
              onChange={(e) => setSiteInfo(prev => ({ ...prev, contactPhoneSecondary: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional phone number"
            />
          </div>
        </div>

        {siteInfo.contactPhoneSecondary && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number to Display in Header
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="primaryPhone"
                  value="primary"
                  checked={siteInfo.primaryPhoneForHeader === 'primary' || !siteInfo.primaryPhoneForHeader}
                  onChange={(e) => setSiteInfo(prev => ({ ...prev, primaryPhoneForHeader: 'primary' }))}
                  className="mr-2"
                />
                <span className="text-sm">Primary ({siteInfo.contactPhone})</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="primaryPhone"
                  value="secondary"
                  checked={siteInfo.primaryPhoneForHeader === 'secondary'}
                  onChange={(e) => setSiteInfo(prev => ({ ...prev, primaryPhoneForHeader: 'secondary' }))}
                  className="mr-2"
                />
                <span className="text-sm">Secondary ({siteInfo.contactPhoneSecondary})</span>
              </label>
            </div>
            <p className="text-xs text-gray-600 mt-2">This phone number will appear as the call-to-action button in the site header.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={siteInfo.address}
              onChange={(e) => setSiteInfo(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              value={siteInfo.city}
              onChange={(e) => setSiteInfo(prev => ({ ...prev, city: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Province/State
            </label>
            <input
              type="text"
              value={siteInfo.province}
              onChange={(e) => setSiteInfo(prev => ({ ...prev, province: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postal Code
            </label>
            <input
              type="text"
              value={siteInfo.postalCode}
              onChange={(e) => setSiteInfo(prev => ({ ...prev, postalCode: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              type="text"
              value={siteInfo.country}
              onChange={(e) => setSiteInfo(prev => ({ ...prev, country: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Business Hours */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Business Hours</h3>
        
        {/* Language Tabs */}
        <div className="flex space-x-2 mb-4 border-b">
          {(['en', 'fr', 'es'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => setActiveLanguageTab(lang)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeLanguageTab === lang
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'Español'}
            </button>
          ))}
        </div>
        
        <div className="space-y-3">
          {Object.entries(siteInfo.businessHours).map(([day, hours]) => (
            <div key={day} className="flex items-center space-x-4">
              <span className="w-24 font-medium capitalize">{day}:</span>
              <input
                type="text"
                value={hours[activeLanguageTab]}
                onChange={(e) => updateBusinessHours(day, activeLanguageTab, e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={activeLanguageTab === 'en' ? '9:00 AM - 6:00 PM' : 
                           activeLanguageTab === 'fr' ? '9h00 - 18h00' : 
                           '9:00 AM - 6:00 PM'}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Copyright Text */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Copyright Text</h3>
        <p className="text-sm text-gray-600 mb-3">The year will automatically update to {currentYear}</p>
        
        {/* Language Tabs for Copyright */}
        <div className="flex space-x-2 mb-4 border-b">
          {(['en', 'fr', 'es'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => setActiveLanguageTab(lang)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeLanguageTab === lang
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'Español'}
            </button>
          ))}
        </div>
        
        <div>
          <input
            type="text"
            value={updateCopyrightYear(siteInfo.copyright[activeLanguageTab])}
            onChange={(e) => updateCopyright(activeLanguageTab, e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={
              activeLanguageTab === 'en' ? `© ${currentYear} Your Company. All rights reserved.` :
              activeLanguageTab === 'fr' ? `© ${currentYear} Votre Entreprise. Tous droits réservés.` :
              `© ${currentYear} Su Empresa. Todos los derechos reservados.`
            }
          />
        </div>
      </div>

      {/* Disclaimer Text */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Vehicle Disclaimer Text</h3>
        <p className="text-sm text-gray-600 mb-3">This disclaimer appears on individual vehicle pages</p>
        
        {/* Language Tabs for Disclaimer */}
        <div className="flex border-b mb-4">
          {(['en', 'fr', 'es'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => setActiveLanguageTab(lang)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeLanguageTab === lang
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'Español'}
            </button>
          ))}
        </div>
        
        <div>
          <textarea
            value={siteInfo.disclaimers?.[activeLanguageTab] || ''}
            onChange={(e) => setSiteInfo(prev => ({
              ...prev,
              disclaimers: {
                ...prev.disclaimers,
                en: activeLanguageTab === 'en' ? e.target.value : (prev.disclaimers?.en || ''),
                fr: activeLanguageTab === 'fr' ? e.target.value : (prev.disclaimers?.fr || ''),
                es: activeLanguageTab === 'es' ? e.target.value : (prev.disclaimers?.es || '')
              }
            }))}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={
              activeLanguageTab === 'en' ? 'This vehicle is offered for sale subject to prior sale...' :
              activeLanguageTab === 'fr' ? 'Ce véhicule est offert à la vente sous réserve...' :
              'Este vehículo se ofrece a la venta sujeto...'
            }
          />
        </div>
      </div>

      {/* Display Settings */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Display Settings</h3>
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={siteInfo.showVIN || false}
              onChange={(e) => setSiteInfo(prev => ({
                ...prev,
                showVIN: e.target.checked
              }))}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Show VIN on Vehicle Details</span>
              <p className="text-xs text-gray-500">Display the Vehicle Identification Number (VIN) on public vehicle detail pages</p>
            </div>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={siteInfo.showElectricVehiclesLink !== false}
              onChange={(e) => setSiteInfo(prev => ({
                ...prev,
                showElectricVehiclesLink: e.target.checked
              }))}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Show Electric Vehicles Link in Header</span>
              <p className="text-xs text-gray-500">Display the "Electric" link in the navigation menu (both desktop and mobile)</p>
            </div>
          </label>
        </div>
      </div>

      {/* Theme Colors */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Theme Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={siteInfo.themeColors.primary}
                onChange={(e) => setSiteInfo(prev => ({ 
                  ...prev, 
                  themeColors: { ...prev.themeColors, primary: e.target.value }
                }))}
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={siteInfo.themeColors.primary}
                onChange={(e) => setSiteInfo(prev => ({ 
                  ...prev, 
                  themeColors: { ...prev.themeColors, primary: e.target.value }
                }))}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#2563eb"
              />
              <div 
                className="w-10 h-10 rounded border border-gray-300"
                style={{ backgroundColor: siteInfo.themeColors.primary }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secondary Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={siteInfo.themeColors.secondary}
                onChange={(e) => setSiteInfo(prev => ({ 
                  ...prev, 
                  themeColors: { ...prev.themeColors, secondary: e.target.value }
                }))}
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={siteInfo.themeColors.secondary}
                onChange={(e) => setSiteInfo(prev => ({ 
                  ...prev, 
                  themeColors: { ...prev.themeColors, secondary: e.target.value }
                }))}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#1e3a8a"
              />
              <div 
                className="w-10 h-10 rounded border border-gray-300"
                style={{ backgroundColor: siteInfo.themeColors.secondary }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Accent Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={siteInfo.themeColors.accent}
                onChange={(e) => setSiteInfo(prev => ({ 
                  ...prev, 
                  themeColors: { ...prev.themeColors, accent: e.target.value }
                }))}
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={siteInfo.themeColors.accent}
                onChange={(e) => setSiteInfo(prev => ({ 
                  ...prev, 
                  themeColors: { ...prev.themeColors, accent: e.target.value }
                }))}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#3b82f6"
              />
              <div 
                className="w-10 h-10 rounded border border-gray-300"
                style={{ backgroundColor: siteInfo.themeColors.accent }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Header Text Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={siteInfo.themeColors.headerText || '#000000'}
                onChange={(e) => setSiteInfo(prev => ({ 
                  ...prev, 
                  themeColors: { ...prev.themeColors, headerText: e.target.value }
                }))}
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={siteInfo.themeColors.headerText || '#000000'}
                onChange={(e) => setSiteInfo(prev => ({ 
                  ...prev, 
                  themeColors: { ...prev.themeColors, headerText: e.target.value }
                }))}
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#000000"
              />
              <div 
                className="w-10 h-10 rounded border border-gray-300"
                style={{ backgroundColor: siteInfo.themeColors.headerText || '#000000' }}
              />
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Tip: Primary for buttons, Secondary for dark backgrounds, Accent for highlights, Header Text for navigation
        </p>
      </div>

      {/* Social Media */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Social Media</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(siteInfo.socialMedia).map(([platform, url]) => (
            <div key={platform}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {platform}
              </label>
              <input
                type="url"
                value={url || ''}
                onChange={(e) => updateSocialMedia(platform as keyof typeof siteInfo.socialMedia, e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`https://${platform}.com/yourpage`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSiteInfo}
          disabled={loading}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } disabled:opacity-50`}
        >
          {loading ? 'Saving...' : saved ? '✓ Saved' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
