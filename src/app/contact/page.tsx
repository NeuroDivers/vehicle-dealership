'use client';

import { useState, useEffect } from 'react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

const translations = {
  en: {
    title: 'Contact Us',
    getInTouch: 'Get in Touch',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    businessHours: 'Business Hours'
  },
  fr: {
    title: 'Contactez-nous',
    getInTouch: 'Entrer en contact',
    phone: 'Téléphone',
    email: 'Courriel',
    address: 'Adresse',
    businessHours: 'Heures d\'ouverture'
  },
  es: {
    title: 'Contáctenos',
    getInTouch: 'Póngase en contacto',
    phone: 'Teléfono',
    email: 'Correo electrónico',
    address: 'Dirección',
    businessHours: 'Horario comercial'
  }
};

export default function ContactPage() {
  const { settings } = useSiteSettings();
  const [language, setLanguage] = useState<'en' | 'fr' | 'es'>('fr');
  const t = translations[language];

  useEffect(() => {
    const storedLang = localStorage.getItem('language') as 'en' | 'fr' | 'es';
    if (storedLang) {
      setLanguage(storedLang);
    } else {
      localStorage.setItem('language', 'fr'); // Set French as default
    }
  }, []);

  const businessHoursDays = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.title}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-semibold mb-4">{t.getInTouch}</h2>
            <div className="space-y-3">
              <p className="text-gray-600">
                <strong>{t.phone}:</strong> {settings.contactPhone}
              </p>
              <p className="text-gray-600">
                <strong>{t.email}:</strong> {settings.contactEmail}
              </p>
              <p className="text-gray-600">
                <strong>{t.address}:</strong> {settings.address}{settings.address && ', '}{settings.city}{settings.city && ', '}{settings.province} {settings.postalCode}
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-semibold mb-4">{t.businessHours}</h2>
            <div className="space-y-2 text-gray-600">
              {businessHoursDays.map(day => {
                const hours = settings.businessHours?.[day];
                if (!hours) return null;
                const dayName = day.charAt(0).toUpperCase() + day.slice(1);
                return (
                  <p key={day}>
                    <strong>{dayName}:</strong> {hours[language]}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
