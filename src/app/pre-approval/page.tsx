'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, DollarSign, Briefcase, CreditCard, User } from 'lucide-react';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

export default function PreApprovalPage() {
  const { settings, getThemeColors } = useSiteSettings();
  const themeColors = getThemeColors();
  const [currentLang, setCurrentLang] = useState<'en' | 'fr' | 'es'>('fr');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Info
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    
    // Employment Info
    employment_status: 'employed',
    employer_name: '',
    job_title: '',
    years_employed: '',
    annual_income: '',
    
    // Financial Info
    down_payment: '',
    monthly_budget: '',
    credit_rating: 'good',
    
    // Additional Info
    vehicle_interest: '',
    trade_in: 'no',
    trade_in_details: '',
    message: '',
  });

  useEffect(() => {
    const storedLang = localStorage.getItem('language') as 'en' | 'fr' | 'es';
    if (storedLang) {
      setCurrentLang(storedLang);
    }

    const handleLanguageChange = () => {
      const newLang = localStorage.getItem('language') as 'en' | 'fr' | 'es';
      if (newLang) setCurrentLang(newLang);
    };

    window.addEventListener('languageChange', handleLanguageChange);
    return () => window.removeEventListener('languageChange', handleLanguageChange);
  }, []);

  const t = (en: string, fr: string, es: string) => {
    return currentLang === 'fr' ? fr : currentLang === 'es' ? es : en;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 
                     'https://vehicle-dealership-analytics.nick-damato0011527.workers.dev';

      // Prepare financial data
      const financialData = {
        employment_status: formData.employment_status,
        employer_name: formData.employer_name,
        job_title: formData.job_title,
        years_employed: formData.years_employed,
        annual_income: formData.annual_income,
        down_payment: formData.down_payment,
        monthly_budget: formData.monthly_budget,
        credit_rating: formData.credit_rating,
        vehicle_interest: formData.vehicle_interest,
        trade_in: formData.trade_in,
        trade_in_details: formData.trade_in_details,
      };

      const leadData = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        message: formData.message || 'Pre-approval application submitted',
        inquiry_type: 'pre-approval',
        preferred_contact: 'email',
        source: 'website',
        financial_data: JSON.stringify(financialData),
      };

      const response = await fetch(`${apiUrl}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });

      if (response.ok) {
        setShowSuccess(true);
        // Reset form
        setFormData({
          customer_name: '',
          customer_email: '',
          customer_phone: '',
          employment_status: 'employed',
          employer_name: '',
          job_title: '',
          years_employed: '',
          annual_income: '',
          down_payment: '',
          monthly_budget: '',
          credit_rating: 'good',
          vehicle_interest: '',
          trade_in: 'no',
          trade_in_details: '',
          message: '',
        });
      } else {
        alert(t('Error submitting form', 'Erreur lors de la soumission', 'Error al enviar'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert(t('Error submitting form', 'Erreur lors de la soumission', 'Error al enviar'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle2 className="h-20 w-20 mx-auto mb-6" style={{ color: themeColors.accent }} />
          <h1 className="text-4xl font-bold mb-4" style={{ color: themeColors.primary }}>
            {t('Application Submitted!', 'Demande soumise!', '¡Solicitud enviada!')}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t(
              'Thank you! We will review your pre-approval application and contact you within 24-48 hours.',
              'Merci! Nous examinerons votre demande de préapprobation et vous contacterons dans les 24 à 48 heures.',
              '¡Gracias! Revisaremos su solicitud de pre-aprobación y nos comunicaremos con usted en 24-48 horas.'
            )}
          </p>
          <button
            onClick={() => setShowSuccess(false)}
            className="px-6 py-3 text-white rounded-lg font-semibold transition hover:opacity-90"
            style={{ backgroundColor: themeColors.accent }}
          >
            {t('Submit Another Application', 'Soumettre une autre demande', 'Enviar otra solicitud')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'linear-gradient(to bottom, #effff0, white)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: themeColors.primary }}>
            {t('Get Pre-Approved', 'Préapprobation de financement', 'Obtener pre-aprobación')}
          </h1>
          <p className="text-xl max-w-2xl mx-auto text-gray-600">
            {t(
              'Complete this form to get pre-approved for financing. This helps us find the best financing options for your budget.',
              'Remplissez ce formulaire pour obtenir une préapprobation de financement. Cela nous aide à trouver les meilleures options de financement pour votre budget.',
              'Complete este formulario para obtener la pre-aprobación de financiamiento. Esto nos ayuda a encontrar las mejores opciones de financiamiento para su presupuesto.'
            )}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          {/* Personal Information */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <User className="h-6 w-6" style={{ color: themeColors.primary }} />
              <h2 className="text-2xl font-bold text-gray-900">
                {t('Personal Information', 'Informations personnelles', 'Información personal')}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Full Name', 'Nom complet', 'Nombre completo')} *
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ outlineColor: themeColors.primary }}
                  onFocus={(e) => e.target.style.borderColor = themeColors.primary}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Email', 'Courriel', 'Correo electrónico')} *
                </label>
                <input
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ outlineColor: themeColors.primary }}
                  onFocus={(e) => e.target.style.borderColor = themeColors.primary}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Phone', 'Téléphone', 'Teléfono')} *
                </label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ outlineColor: themeColors.primary }}
                  onFocus={(e) => e.target.style.borderColor = themeColors.primary}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Briefcase className="h-6 w-6" style={{ color: themeColors.primary }} />
              <h2 className="text-2xl font-bold text-gray-900">
                {t('Employment Information', 'Informations sur l\'emploi', 'Información de empleo')}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Employment Status', 'Statut d\'emploi', 'Estado de empleo')} *
                </label>
                <select
                  name="employment_status"
                  value={formData.employment_status}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ outlineColor: themeColors.primary }}
                  onFocus={(e) => e.target.style.borderColor = themeColors.primary}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="employed">{t('Employed', 'Employé', 'Empleado')}</option>
                  <option value="self-employed">{t('Self-Employed', 'Travailleur autonome', 'Autónomo')}</option>
                  <option value="retired">{t('Retired', 'Retraité', 'Jubilado')}</option>
                  <option value="other">{t('Other', 'Autre', 'Otro')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Employer Name', 'Nom de l\'employeur', 'Nombre del empleador')}
                </label>
                <input
                  type="text"
                  name="employer_name"
                  value={formData.employer_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ outlineColor: themeColors.primary }}
                  onFocus={(e) => e.target.style.borderColor = themeColors.primary}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Job Title', 'Titre du poste', 'Título del puesto')}
                </label>
                <input
                  type="text"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ outlineColor: themeColors.primary }}
                  onFocus={(e) => e.target.style.borderColor = themeColors.primary}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Years Employed', 'Années d\'emploi', 'Años empleado')}
                </label>
                <input
                  type="number"
                  name="years_employed"
                  value={formData.years_employed}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ outlineColor: themeColors.primary }}
                  onFocus={(e) => e.target.style.borderColor = themeColors.primary}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <DollarSign className="h-6 w-6" style={{ color: themeColors.primary }} />
              <h2 className="text-2xl font-bold text-gray-900">
                {t('Financial Information', 'Informations financières', 'Información financiera')}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Annual Income', 'Revenu annuel', 'Ingreso anual')} *
                </label>
                <input
                  type="number"
                  name="annual_income"
                  value={formData.annual_income}
                  onChange={handleChange}
                  required
                  min="0"
                  step="1000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ outlineColor: themeColors.primary }}
                  onFocus={(e) => e.target.style.borderColor = themeColors.primary}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  placeholder="$"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Down Payment Available', 'Mise de fonds disponible', 'Pago inicial disponible')}
                </label>
                <input
                  type="number"
                  name="down_payment"
                  value={formData.down_payment}
                  onChange={handleChange}
                  min="0"
                  step="500"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ outlineColor: themeColors.primary }}
                  onFocus={(e) => e.target.style.borderColor = themeColors.primary}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  placeholder="$"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Monthly Budget', 'Budget mensuel', 'Presupuesto mensual')} *
                </label>
                <input
                  type="number"
                  name="monthly_budget"
                  value={formData.monthly_budget}
                  onChange={handleChange}
                  required
                  min="0"
                  step="50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ outlineColor: themeColors.primary }}
                  onFocus={(e) => e.target.style.borderColor = themeColors.primary}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  placeholder="$"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Credit Rating', 'Cote de crédit', 'Calificación crediticia')} *
                </label>
                <select
                  name="credit_rating"
                  value={formData.credit_rating}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ outlineColor: themeColors.primary }}
                  onFocus={(e) => e.target.style.borderColor = themeColors.primary}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="excellent">{t('Excellent (750+)', 'Excellent (750+)', 'Excelente (750+)')}</option>
                  <option value="good">{t('Good (700-749)', 'Bon (700-749)', 'Bueno (700-749)')}</option>
                  <option value="fair">{t('Fair (650-699)', 'Moyen (650-699)', 'Regular (650-699)')}</option>
                  <option value="poor">{t('Poor (< 650)', 'Faible (< 650)', 'Pobre (< 650)')}</option>
                  <option value="unknown">{t('Not Sure', 'Pas sûr', 'No estoy seguro')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Vehicle Interest */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <CreditCard className="h-6 w-6" style={{ color: themeColors.primary }} />
              <h2 className="text-2xl font-bold text-gray-900">
                {t('Vehicle Interest', 'Intérêt pour un véhicule', 'Interés en vehículo')}
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('What type of vehicle are you interested in?', 
                      'Quel type de véhicule vous intéresse?', 
                      '¿Qué tipo de vehículo le interesa?')}
                </label>
                <input
                  type="text"
                  name="vehicle_interest"
                  value={formData.vehicle_interest}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ outlineColor: themeColors.primary }}
                  onFocus={(e) => e.target.style.borderColor = themeColors.primary}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  placeholder={t('e.g., SUV, Sedan, Truck', 'ex: VUS, Berline, Camion', 'ej: SUV, Sedán, Camioneta')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Do you have a trade-in?', 'Avez-vous un véhicule à échanger?', '¿Tiene un vehículo para intercambiar?')}
                </label>
                <select
                  name="trade_in"
                  value={formData.trade_in}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ outlineColor: themeColors.primary }}
                  onFocus={(e) => e.target.style.borderColor = themeColors.primary}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="no">{t('No', 'Non', 'No')}</option>
                  <option value="yes">{t('Yes', 'Oui', 'Sí')}</option>
                </select>
              </div>

              {formData.trade_in === 'yes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('Trade-in Details', 'Détails du véhicule à échanger', 'Detalles del vehículo de intercambio')}
                  </label>
                  <input
                    type="text"
                    name="trade_in_details"
                    value={formData.trade_in_details}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ outlineColor: themeColors.primary }}
                    onFocus={(e) => e.target.style.borderColor = themeColors.primary}
                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    placeholder={t('Year, Make, Model, KM', 'Année, Marque, Modèle, KM', 'Año, Marca, Modelo, KM')}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Additional Comments', 'Commentaires supplémentaires', 'Comentarios adicionales')}
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  style={{ outlineColor: themeColors.primary }}
                  onFocus={(e) => e.target.style.borderColor = themeColors.primary}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="rounded-lg p-4" style={{ backgroundColor: `${themeColors.primary}10`, borderColor: `${themeColors.primary}40`, borderWidth: '1px' }}>
            <p className="text-sm text-gray-700">
              {t(
                '🔒 Your information is secure and will only be used to process your pre-approval application. We do not share your personal information with third parties.',
                '🔒 Vos informations sont sécurisées et ne seront utilisées que pour traiter votre demande de préapprobation. Nous ne partageons pas vos informations personnelles avec des tiers.',
                '🔒 Su información es segura y solo se utilizará para procesar su solicitud de pre-aprobación. No compartimos su información personal con terceros.'
              )}
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-4 text-white text-lg font-semibold rounded-lg shadow-lg transition-all hover:shadow-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.accent})` }}
            >
              {isSubmitting
                ? t('Submitting...', 'Envoi en cours...', 'Enviando...')
                : t('Submit Pre-Approval Application', 'Soumettre la demande', 'Enviar solicitud')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
