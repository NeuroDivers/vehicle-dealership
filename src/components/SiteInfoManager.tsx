'use client';

import { useState, useEffect, useRef } from 'react';

interface SiteInfo {
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
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    linkedin?: string;
  };
}

const defaultSiteInfo: SiteInfo = {
  siteName: 'Vehicle Dealership',
  logo: '',
  contactEmail: 'info@dealership.com',
  contactPhone: '555-0123',
  address: '123 Main Street',
  city: 'City',
  province: 'Province',
  postalCode: '12345',
  country: 'Canada',
  businessHours: {
    monday: '9:00 AM - 6:00 PM',
    tuesday: '9:00 AM - 6:00 PM',
    wednesday: '9:00 AM - 6:00 PM',
    thursday: '9:00 AM - 6:00 PM',
    friday: '9:00 AM - 6:00 PM',
    saturday: '10:00 AM - 4:00 PM',
    sunday: 'Closed'
  },
  socialMedia: {
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    linkedin: ''
  }
};

export default function SiteInfoManager() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo>(defaultSiteInfo);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSiteInfo();
  }, []);

  const loadSiteInfo = async () => {
    try {
      // Load from localStorage first
      const localInfo = localStorage.getItem('siteInfo');
      if (localInfo) {
        const parsed = JSON.parse(localInfo);
        setSiteInfo(parsed);
        setLogoPreview(parsed.logo || '');
      }

      // Try to load from API
      const response = await fetch('/api/admin/site-info');
      if (response.ok) {
        const data = await response.json();
        setSiteInfo(data.siteInfo || defaultSiteInfo);
        setLogoPreview(data.siteInfo?.logo || '');
        // Save to localStorage
        localStorage.setItem('siteInfo', JSON.stringify(data.siteInfo || defaultSiteInfo));
      }
    } catch (error) {
      console.error('Failed to load site info:', error);
      // Use localStorage if available
      const localInfo = localStorage.getItem('siteInfo');
      if (localInfo) {
        const parsed = JSON.parse(localInfo);
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
      
      // Try to save to API
      const response = await fetch('/api/admin/site-info', {
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

  const updateBusinessHours = (day: keyof typeof siteInfo.businessHours, value: string) => {
    setSiteInfo(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: value
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
              Phone
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(siteInfo.businessHours).map(([day, hours]) => (
            <div key={day}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {day}
              </label>
              <input
                type="text"
                value={hours}
                onChange={(e) => updateBusinessHours(day as keyof typeof siteInfo.businessHours, e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 9:00 AM - 6:00 PM"
              />
            </div>
          ))}
        </div>
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
